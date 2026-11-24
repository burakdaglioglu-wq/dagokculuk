// 🎬 Tanıtım sitesi videosu (v454): Range (206) — iPhone/Safari'de oynaması için şart —, kapak, dokununca oynar, önceden indirilmez.
import { tarayici, B, dogrula, esit } from '../yardimci.mjs';
export default async function () {
  const r = await fetch(B + '/video/veli-notu.mp4', { headers: { range: 'bytes=10-19' } });
  esit(r.status, 206, 'Range'); esit((await r.arrayBuffer()).byteLength, 10, 'parça boyu'); dogrula(/^bytes 10-19\/\d+$/.test(r.headers.get('content-range')), 'content-range'); esit(r.headers.get('content-type'), 'video/mp4', 'tür');
  esit((await fetch(B + '/video/yok.mp4')).status, 404, 'olmayan video');
  for (const ad of ['oyun-bizde', 'tek-ok', 'bugun-ne-yaptin']) { esit((await fetch(B + '/video/' + ad + '.mp4', { headers: { range: 'bytes=0-9' } })).status, 206, ad); esit((await fetch(B + '/site-video/' + ad + '.jpg')).status, 200, ad + ' kapak'); }
  const ctx = await (await tarayici()).newContext({ viewport: { width: 390, height: 663 } }), p = await ctx.newPage(), istek = [], hata = [];
  p.on('request', (x) => { if (x.url().includes('/video/')) istek.push(x.url()); }); p.on('pageerror', (e) => hata.push(e.message));
  try {
    await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.locator('#video').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
    esit(istek.filter((x) => !x.includes('sinema-')).length, 0, 'video dokunmadan indirilmemeli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v1.png' });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'yatay taşma');
    await p.locator('#video .vd-oynat').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-v2.png' });
    await p.locator('#video .vd-oynat').first().click(); await p.waitForFunction(() => { const v = document.querySelector('#video video'); return v.currentTime > 0.3 && v.controls; }, null, { timeout: 15000 });
    esit(await p.evaluate(() => Math.round(document.querySelector('#video video').duration)), 47, 'süre');
    // İlk kez bu salonda: ispatı olmayan "Türkiye'de ilk / tek" sözü yazılmaz, görseller yüklenir
    const ilk = p.locator('#ilk'); await ilk.scrollIntoViewIfNeeded(); esit(await ilk.locator('.ilk-ay').count(), 3, 'aylar'); dogrula(!/türkiye|dünya|\btek\s/i.test(await ilk.innerText()), 'ispatsız iddia');
    for (let i = 0; i < 3; i++) { await ilk.locator('img').nth(i).scrollIntoViewIfNeeded(); await p.waitForFunction((k) => document.querySelectorAll('#ilk img')[k].naturalWidth > 0, i, { timeout: 8000 }); await p.waitForTimeout(900); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-i' + i + '.png' }); }
    if (process.env.E2E_EKRAN) { await p.evaluate(() => document.getElementById('ilk').scrollIntoView()); await p.waitForTimeout(900); await p.screenshot({ path: process.env.E2E_EKRAN + '-i9.png' }); }
    // üç oyun videosu: dokununca oynar, ötekiler durur, bitince kapak döner
    esit(await p.locator('#video .vd-uc .vd-kutu').count(), 3, 'üç video');
    for (let i = 0; i < 3; i++) { await p.locator('#video .vd-uc .vd-oynat').nth(i).scrollIntoViewIfNeeded(); await p.waitForTimeout(400); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-u' + i + '.png' }); await p.locator('#video .vd-uc .vd-oynat').nth(i).click(); await p.waitForFunction((k) => { const v = document.querySelectorAll('#video video'); return v[k + 1].currentTime > 0.3 && [...v].every((x, j) => j === k + 1 || x.paused); }, i, { timeout: 15000 }); }
    esit((await p.evaluate(() => [...document.querySelectorAll('#video .vd-uc video')].map((v) => Math.round(v.duration)))).join(), '22,28,20', 'süreler');
    await p.evaluate(() => { const v = document.querySelectorAll('#video video')[3]; v.currentTime = v.duration - 0.2; }); await p.waitForFunction(() => !document.querySelectorAll('#video .vd-kutu')[3].classList.contains('oynuyor'), null, { timeout: 8000 });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'yatay taşma (üç video)');
    if (process.env.E2E_EKRAN) { await p.setViewportSize({ width: 1366, height: 1000 }); await p.evaluate(() => document.getElementById('ilk').scrollIntoView()); await p.waitForTimeout(1800); await p.screenshot({ path: process.env.E2E_EKRAN + '-im.png' }); await p.setViewportSize({ width: 1366, height: 850 }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.locator('#video').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('video').scrollIntoView()); await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-v3.png' }); await p.evaluate(() => document.querySelector('.vd-alt-bas').scrollIntoView()); await p.waitForTimeout(800); await p.screenshot({ path: process.env.E2E_EKRAN + '-v4.png' }); }
    esit(hata.length, 0, hata.join('|'));
    // giriş "Sinema": kapak hemen, video sonra; doğru ekran için doğru dosya, yazı okunur yerde, görünmezken durur; hareketi azalt → hiç inmez
    for (const [w, h, ad, gen] of [[1917, 1095, 'genis', 1560], [1366, 650, 'genis', 1560], [1024, 768, 'genis', 1560], [390, 663, 'dik', 900]]) {
      const q = await (await (await tarayici()).newContext({ viewport: { width: w, height: h } })).newPage(), kap = []; q.on('request', (x) => { if (x.url().includes('hero/sinema')) kap.push(x.url()); });
      await q.goto(B + '/'); await q.waitForSelector('.vz-hero.video-var', { timeout: 20000 }); await q.waitForTimeout(2600);
      const o = await q.evaluate(() => { const v = document.querySelector('.vz-sin video'), r = (x) => { const b = document.querySelector(x).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); }; return { src: v.src, gen: v.videoWidth, oyna: !v.paused && v.currentTime > .5, tas: document.documentElement.scrollWidth > innerWidth + 1, sin: r('.vz-sin'), hero: r('.vz-hero'), bas: r('.vz-baslik .vz-keskin'), tel: r('.vz-tel'), slo: document.querySelector('.vz-slogan').textContent }; });
      dogrula(o.src.includes('sinema-' + ad) && o.gen === gen && o.oyna && !o.tas && /Gerçek ok/.test(o.slo) && kap.every((x) => x.includes('sinema-' + ad)) && o.sin[2] === o.hero[2] && o.sin[3] - o.sin[1] === o.hero[3] - o.hero[1] && o.bas[1] > o.hero[1] && o.tel[3] <= o.hero[3], 'sinema ' + w + ' ' + JSON.stringify(o));
      if (process.env.E2E_EKRAN) await q.screenshot({ path: process.env.E2E_EKRAN + '-g' + w + '.png' });
      await q.evaluate(() => scrollTo(0, 4000)); await q.waitForFunction(() => document.querySelector('.vz-sin video').paused, null, { timeout: 5000 }); await q.context().close(); }
    const az = await (await (await tarayici()).newContext({ reducedMotion: 'reduce' })).newPage(); let n = 0; az.on('request', (x) => { if (x.url().includes('video/sinema-')) n++; }); await az.goto(B + '/'); await az.waitForTimeout(2500); esit(n, 0, 'hareketi azalt'); await az.context().close();
  } finally { await ctx.close(); }
}
