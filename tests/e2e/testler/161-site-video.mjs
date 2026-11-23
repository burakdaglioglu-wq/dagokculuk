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
    esit(istek.length, 0, 'video dokunmadan indirilmemeli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v1.png' });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'yatay taşma');
    await p.locator('#video .vd-oynat').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v2.png' });
    await p.locator('#video .vd-oynat').click(); await p.waitForFunction(() => { const v = document.querySelector('#video video'); return v.currentTime > 0.3 && v.controls; }, null, { timeout: 15000 });
    esit(await p.evaluate(() => Math.round(document.querySelector('#video video').duration)), 47, 'süre');
    if (process.env.E2E_EKRAN) { await p.setViewportSize({ width: 1366, height: 850 }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.locator('#video').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('video').scrollIntoView()); await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-v3.png' }); }
    esit(hata.length, 0, hata.join('|'));
  } finally { await ctx.close(); }
}
