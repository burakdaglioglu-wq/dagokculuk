// Elle deneme: telefonda karakter seçici (26 karakter) açılır, görünür alanda, yeni bir hayvan seçilir, sahnede çizilir.
// Kullanım: DAGSK_TEST_PIN=... node tests/e2e/_oyun-karakter.mjs
import { devices } from 'playwright';
import { tarayici, tarayiciKapat, oturumAl, uygulamaAc, karisikSinifArac } from './yardimci.mjs';

const CIKTI = process.env.CIKTI || '.';
const b = await tarayici();
for (const [ad, cihaz] of [['telefon', devices['iPhone 13']], ['pc', { viewport: { width: 1400, height: 900 } }]]) {
  const ctx = await b.newContext({ ...cihaz });
  await ctx.addInitScript((tk) => { try { localStorage.setItem('dag_oturum', tk); } catch (e) {} }, await oturumAl());
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => { kmOyunTemaSec('zirve'); kmOyunKarakterSecAc(0); });
    await p.waitForTimeout(700);
    const kutu = await p.evaluate(() => { const k = document.querySelector('.km-oyun-karakter-kutu'); const r = k.getBoundingClientRect(); return { kart: document.querySelectorAll('.km-oyun-karakter-sec').length, yeni: document.querySelectorAll('.km-oyun-karakter-yeni').length, ust: Math.round(r.top), alt: Math.round(r.bottom), ic: innerHeight }; });
    await p.screenshot({ path: `${CIKTI}/kar-${ad}-1-secici.png` });
    await p.locator('.km-oyun-karakter-sec', { hasText: 'Yunus' }).click();
    await p.waitForTimeout(900);
    const secim = await p.evaluate(() => { const s = _kmOyunRosterCache[0]; return { no: kmOyunHayvanKarakterAta(s), img: !!document.querySelector('#km-oyun-sahne image[href*="yunus"]') }; });
    await p.screenshot({ path: `${CIKTI}/kar-${ad}-2-sahne.png` });
    console.log(ad, JSON.stringify({ kutu, secim, hatalar }));
  } catch (e) { console.log(ad, 'HATA', e.message.split('\n')[0], hatalar); }
  await ctx.close();
}
await tarayiciKapat();
