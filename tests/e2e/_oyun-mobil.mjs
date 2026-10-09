// Elle deneme: Oyunlar'ı telefon/tablet öykünmesiyle (dokunmatik) aç, tema seç, 3 ok gir, İlerlet'e dokun.
// Kullanım (proje kökünden): DAGSK_TEST_PIN=... node tests/e2e/_oyun-mobil.mjs [tema]
import { devices, webkit } from 'playwright';
import { tarayici, tarayiciKapat, oturumAl, uygulamaAc, karisikSinifArac } from './yardimci.mjs';

const CIKTI = process.env.CIKTI || '.';
const tema = process.argv[2] || 'zirve';
const CIHAZLAR = { telefon: devices['iPhone 13'], tablet: devices['iPad (gen 7)'] };

for (const [ad, cihaz] of Object.entries(CIHAZLAR)) {
  const b = process.env.MOTOR === 'webkit' ? (globalThis.__wk ||= await webkit.launch()) : await tarayici();
  const ctx = await b.newContext({ ...cihaz });
  const t = await oturumAl();
  await ctx.addInitScript((tk) => { try { localStorage.setItem('dag_oturum', tk); } catch (e) {} }, t);
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) hatalar.push('console: ' + m.text()); });
  p.on('dialog', (d) => d.accept());
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.screenshot({ path: `${CIKTI}/oyun-${ad}-1-acilis.png` });
    // tema seçimi gerçek dokunuşla (düğme varsa)
    const temaBtn = p.locator(`[onclick*="kmOyunTemaSec('${tema}')"]`).first();
    const temaVar = await temaBtn.count();
    if (temaVar) { await temaBtn.scrollIntoViewIfNeeded().catch(() => {}); await temaBtn.tap({ timeout: 5000 }).catch((e) => hatalar.push('tema tap: ' + e.message.split('\n')[0])); }
    else await p.evaluate((t) => kmOyunTemaSec(t), tema);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${CIKTI}/oyun-${ad}-2-tema.png` });
    if (process.env.LIMIT) await p.evaluate(async (tam) => { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; const gd = turnuvaDB[s.g][s.ad]; gd.devamModu = false; const lim = parseInt(document.getElementById('toplam-seri-ayar').value) || 12; gd.seriler = gd.seriler || []; while (gd.seriler.length < lim) gd.seriler.push({ oklar: ['5','5','5'], toplam: 15, id: 'tst' + gd.seriler.length }); if (tam) { try { await document.getElementById('km-oyun-wrap').requestFullscreen(); } catch (e) { window.__fsHata = e.message; } } }, !!process.env.TAM);
    const once = await p.evaluate(() => ({ idx: _kmOyunAktifIndex, ad: (_kmOyunRosterCache[_kmOyunAktifIndex] || {}).ad, n: _kmOyunRosterCache.length, tema: _kmOyunAktifTema }));
    for (const v of ['9', '8', '7']) {
      const pb = p.locator(`#km-oyun-pad button:has-text("${v}")`).first();
      const gorunur = await pb.isVisible().catch(() => false);
      if (!gorunur) { hatalar.push(`pad ${v} görünmüyor`); continue; }
      await pb.tap({ timeout: 4000 }).catch((e) => hatalar.push(`pad ${v} tap: ` + e.message.split('\n')[0]));
      await p.waitForTimeout(150);
    }
    const slot = await p.evaluate(() => ({ giris: _kmOyunSeriGirisleri.slice(), kilit: _kmOyunKilit }));
    await p.screenshot({ path: `${CIKTI}/oyun-${ad}-3-seri.png` });
    const btn = p.locator('#km-oyun-ilerlet-btn');
    const btnDurum = await btn.evaluate((e) => { const r = e.getBoundingClientRect(); const ust = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { disabled: e.disabled, gorunur: r.width > 0 && r.height > 0, r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], ustteki: ust ? (ust.id || ust.className || ust.tagName) : null, ic: innerHeight }; }).catch((e) => ({ hata: e.message }));
    await btn.tap({ timeout: 4000 }).catch((e) => hatalar.push('ilerlet tap: ' + e.message.split('\n')[0]));
    await p.waitForTimeout(4500);
    const onay = await p.evaluate(() => { const m = document.getElementById('onay-modal'); const b = document.getElementById('onay-evet-btn'); if (!m) return 'yok'; const r = b.getBoundingClientRect(); const ust = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { display: m.style.display, fs: !!document.fullscreenElement, fsHata: window.__fsHata || null, evetUstte: ust === b || (ust && b.contains(ust)), ustteki: ust ? (ust.id || ust.className) : null, z: getComputedStyle(m).zIndex }; });
    console.log('ONAY', ad, JSON.stringify(onay));
    if (onay.display === 'flex') { await p.locator('#onay-evet-btn').tap({ timeout: 4000 }).catch((e) => hatalar.push('evet tap: ' + e.message.split('\n')[0])); await p.waitForTimeout(4500); }
    const sonra = await p.evaluate(() => ({ idx: _kmOyunAktifIndex, ad: (_kmOyunRosterCache[_kmOyunAktifIndex] || {}).ad, giris: _kmOyunSeriGirisleri.slice(), kilit: _kmOyunKilit }));
    await p.screenshot({ path: `${CIKTI}/oyun-${ad}-4-sonra.png` });
    console.log(JSON.stringify({ cihaz: ad, tema, temaVar, once, slot, btnDurum, sonra, hatalar }, null, 1));
  } catch (e) {
    console.log(ad, 'HATA', e.message, hatalar);
    await p.screenshot({ path: `${CIKTI}/oyun-${ad}-hata.png` }).catch(() => {});
  } finally { await ctx.close(); }
}
await tarayiciKapat(); if (globalThis.__wk) await globalThis.__wk.close();
