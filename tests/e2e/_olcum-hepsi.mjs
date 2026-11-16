import { sayfaAc, uygulamaAc, karisikSinifArac } from './yardimci.mjs';
const { ctx, p } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
try {
  await uygulamaAc(p); await karisikSinifArac(p, 'oyunlar');
  const temalar = await p.evaluate(() => Object.keys(KM_OYUN_TEMALAR));
  for (const t of temalar) {
    try {
      await p.evaluate((t) => kmOyunTemaSec(t), t); await p.waitForTimeout(2200);
      const r = await p.evaluate((t) => { const sc = document.querySelector('#km-oyun-wrap .km-oyun-scene').getBoundingClientRect(); const pn = document.getElementById('km-oyun-panel-' + t); if (!pn) return 'panel yok'; const b = pn.getBoundingClientRect(); let ic = 0; pn.querySelectorAll(':scope > *').forEach((c) => { const cb = c.getBoundingClientRect(); ic = Math.max(ic, cb.bottom); }); return { sahne: Math.round(sc.height), panel: Math.round(b.height), pg: Math.round(b.width), sg: Math.round(sc.width), icAlt: Math.round(sc.bottom - ic) }; }, t);
      console.log(t.padEnd(14), JSON.stringify(r));
    } catch (e) { console.log(t, 'HATA', e.message.slice(0, 80)); }
  }
} finally { await ctx.close(); process.exit(0); }
