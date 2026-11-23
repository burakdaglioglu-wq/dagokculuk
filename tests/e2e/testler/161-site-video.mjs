// 🎬 Tanıtım sitesi videosu (v454): Range (206) — iPhone/Safari'de oynaması için şart —, kapak, dokununca oynar, önceden indirilmez.
import { tarayici, B, dogrula, esit } from '../yardimci.mjs';
export default async function () {
  const r = await fetch(B + '/video/veli-notu.mp4', { headers: { range: 'bytes=10-19' } });
  esit(r.status, 206, 'Range'); esit((await r.arrayBuffer()).byteLength, 10, 'parça boyu'); dogrula(/^bytes 10-19\/\d+$/.test(r.headers.get('content-range')), 'content-range'); esit(r.headers.get('content-type'), 'video/mp4', 'tür');
  esit((await fetch(B + '/video/yok.mp4')).status, 404, 'olmayan video');
  const ctx = await (await tarayici()).newContext({ viewport: { width: 390, height: 663 } }), p = await ctx.newPage(), istek = [], hata = [];
  p.on('request', (x) => { if (x.url().includes('/video/')) istek.push(x.url()); }); p.on('pageerror', (e) => hata.push(e.message));
  try {
    await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.locator('#video').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
    esit(istek.filter((x) => x.includes('veli-notu')).length, 0, 'video dokunmadan indirilmemeli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v1.png' });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'yatay taşma');
    await p.locator('#video .vd-oynat').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v2.png' });
    await p.locator('#video .vd-oynat').click(); await p.waitForFunction(() => { const v = document.querySelector('#video video'); return v.currentTime > 0.3 && v.controls; }, null, { timeout: 15000 });
    esit(await p.evaluate(() => Math.round(document.querySelector('#video video').duration)), 47, 'süre');
    if (process.env.E2E_EKRAN) { await p.setViewportSize({ width: 1366, height: 850 }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.locator('#video').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('video').scrollIntoView()); await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-v3.png' }); }
    esit(hata.length, 0, hata.join('|'));
    // giriş arka planı (v455): iki kopya aynı karede, görünmezken durur; hareketi azalt → hiç inmez
    for (const [w, h, ad] of [[1366, 800, 'genis'], [390, 663, 'dik']]) { const q = await (await (await tarayici()).newContext({ viewport: { width: w, height: h } })).newPage(); await q.goto(B + '/'); await q.waitForSelector('.vz-hero.video-var', { timeout: 20000 }); await q.waitForTimeout(2500); const o = await q.evaluate(() => { const [n, b] = ['.vz-video-n', '.vz-video-b'].map((x) => document.querySelector(x)); return { src: n.src, fark: Math.abs(n.currentTime - b.currentTime), oyna: !n.paused && !b.paused, tas: document.documentElement.scrollWidth > innerWidth + 1 }; }); dogrula(o.src.includes('giris-' + ad) && o.fark < 0.2 && o.oyna && !o.tas, 'giriş videosu ' + JSON.stringify(o)); await q.evaluate(() => scrollTo(0, 4000)); await q.waitForFunction(() => document.querySelector('.vz-video-n').paused, null, { timeout: 5000 }); await q.context().close(); }
    const az = await (await (await tarayici()).newContext({ reducedMotion: 'reduce' })).newPage(); let n = 0; az.on('request', (x) => { if (/giris-/.test(x.url())) n++; }); await az.goto(B + '/'); await az.waitForTimeout(2500); esit(n, 0, 'hareketi azalt'); await az.context().close();
  } finally { await ctx.close(); }
}
