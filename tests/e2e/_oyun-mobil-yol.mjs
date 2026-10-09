// Elle deneme: Karışık Sınıf ana ekranından GERÇEK dokunuşlarla Oyunlar'a gir, oyun değiştir, başlat.
// Kullanım: DAGSK_TEST_PIN=... [MOTOR=webkit] node tests/e2e/_oyun-mobil-yol.mjs
import { devices, webkit } from 'playwright';
import { tarayici, tarayiciKapat, oturumAl, uygulamaAc, api } from './yardimci.mjs';

const CIKTI = process.env.CIKTI || '.';
const cihazAd = process.env.CIHAZ || 'iPhone 13';
const b = process.env.MOTOR === 'webkit' ? await webkit.launch() : await tarayici();
const ctx = await b.newContext({ ...devices[cihazAd] });
const t = await oturumAl();
await ctx.addInitScript((tk) => { try { localStorage.setItem('dag_oturum', tk); } catch (e) {} }, t);
const p = await ctx.newPage();
const hatalar = [];
p.on('pageerror', (e) => hatalar.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) hatalar.push('console: ' + m.text()); });
p.on('dialog', (d) => d.accept());
const adim = async (ad) => { await p.waitForTimeout(700); await p.screenshot({ path: `${CIKTI}/yol-${ad}.png` }); console.log('adım', ad, hatalar.length ? hatalar.slice(-3) : ''); };
try {
  await uygulamaAc(p);
  let liste = []; try { liste = JSON.parse((await api('/api/meta/karisik_sinif_liste_varsayilan')).d.value || '[]'); } catch (e) {}
  await p.locator("button[onclick=\"platformSec('egitmen')\"]").tap(); await p.waitForTimeout(600);
  await p.locator('#km-giris-btn').tap();
  const devam = p.locator('button:has-text("Derse Devam Et")').last();
  await devam.waitFor({ timeout: 40000 }).catch(() => {});
  if (await devam.isVisible().catch(() => false)) await devam.tap();
  await adim('1-km');
  const kp = p.locator('button:has-text("✕")').first(); if (await kp.isVisible().catch(() => false)) { await kp.tap(); }
  await adim('2-km-ana');
  // Oyunlar aracını ana ekrandan bul ve dokun
  const oy = p.locator('[onclick*="kmAracSec(\'oyunlar\')"]').first();
  console.log('oyunlar düğmesi sayısı', await p.locator('[onclick*="kmAracSec(\'oyunlar\')"]').count());
  await oy.scrollIntoViewIfNeeded().catch(() => {});
  await oy.tap({ timeout: 6000 }).catch((e) => hatalar.push('oyunlar tap: ' + e.message.split('\n')[0]));
  await adim('3-oyunlar');
  const degistir = p.locator('button[onclick="kmOyunSeciciAc()"]').first();
  console.log('DEG ONCE', JSON.stringify(await degistir.evaluate((e) => { const r = e.getBoundingClientRect(); const u = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { r: [r.left, r.top, r.width, r.height].map(Math.round), ust: u === e || e.contains(u) ? 'kendisi' : (u && (u.id || u.className)) }; })));
  if (await degistir.isVisible().catch(() => false)) { await degistir.tap().catch((e) => hatalar.push('değiştir: ' + e.message.split('\n')[0])); }
  await adim('4-secici');
  console.log('SECICI', JSON.stringify(await p.evaluate(() => { const s = document.getElementById('km-oyun-secici'); const g = document.getElementById('km-oyun-govde'); const r = s && s.getBoundingClientRect(); return { sDisp: s && s.style.display, sKart: s && s.children.length, sR: r && [r.left, r.top, r.width, r.height].map(Math.round), gDisp: g && g.style.display, scrollY }; })));
  const durum = await p.evaluate(() => ({ tema: typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : null, sekme: typeof _kmAktifSekme !== 'undefined' ? _kmAktifSekme : null, icerik: (document.getElementById('km-icerik') || {}).innerText?.slice(0, 300) }));
  console.log(JSON.stringify(durum));
} catch (e) { console.log('HATA', e.message.split('\n')[0]); await p.screenshot({ path: `${CIKTI}/yol-hata.png` }).catch(() => {}); }
console.log('hatalar', JSON.stringify(hatalar));
await ctx.close(); if (process.env.MOTOR === 'webkit') await b.close(); else await tarayiciKapat();
