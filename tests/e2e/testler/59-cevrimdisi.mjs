// 📴 Çevrimdışı ve zayıf internet (v317). Kullanıcı (2026-10-26): "linkle indirsinler, çevrimdışı kullansınlar". Ölçüm: her istek
// 25 sn'de cevaplanınca uygulama 77 sn'de açılıyordu (sw.js ağ-önce + sayfa başındaki CDN dosyaları opaque olduğu için hiç
// önbelleğe girmiyordu). Test: sporcu giriş linkiyle girer → (1) internet yokken uygulama açılır, giriş kalır, seri kaydedilip
// kuyruğa girer, internet gelince gider; (2) zayıf internette (25 sn gecikme) uygulama 10 sn içinde açılır.
import { chromium } from 'playwright';
import { B, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  try {
    const a = (await (await fetch(B + '/api/athletes')).json()).athletes.find((x) => x.ad === 'YoklamaTest');
    dogrula(a, 'YoklamaTest yok');
    const kod = String(a.kod || a.dogumYili);
    await p.goto(B + '/app.html?sg=YoklamaTest&sk=' + encodeURIComponent(kod));
    await p.waitForFunction(() => loggedInSporcu === 'YoklamaTest', null, { timeout: 40000 });
    await p.reload(); await p.waitForFunction(() => !!navigator.serviceWorker.controller && loggedInSporcu === 'YoklamaTest', null, { timeout: 30000 });
    await p.waitForTimeout(3000);
    // (1) internet yok
    await ctx.setOffline(true);
    let t0 = Date.now();
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => loggedInSporcu === 'YoklamaTest', null, { timeout: 15000 });
    const sure1 = (Date.now() - t0) / 1000;
    dogrula(await p.evaluate(() => typeof html2pdf === 'function' && typeof Chart === 'function'), 'internetsiz PDF / grafik kütüphanesi yüklenmedi');
    const once = await p.evaluate(() => ({ seri: (turnuvaDB[aktifGrup].YoklamaTest.seriler || []).length, kuyruk: _seriBekleyen.length }));
    await p.evaluate(() => skorEkraniniAc('YoklamaTest')); await p.waitForTimeout(500);
    const n = await p.evaluate(() => getMaksOk());
    for (let i = 0; i < n; i++) { await p.evaluate(() => hizliOkEkle('8')); await p.waitForTimeout(60); }
    await p.waitForFunction((o) => _seriBekleyen.length > o.kuyruk && (turnuvaDB[aktifGrup].YoklamaTest.seriler || []).length > o.seri, once, { timeout: 8000 });
    await ctx.setOffline(false);
    await p.waitForFunction(() => _seriBekleyen.length === 0, null, { timeout: 40000 });
    // (2) zayıf internet: her istek 25 sn gecikmeli
    await ctx.route('**/*', async (r) => { await new Promise((ok) => setTimeout(ok, 25000)); r.continue().catch(() => {}); });
    t0 = Date.now();
    p.reload({ waitUntil: 'commit', timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(500);
    await p.waitForFunction(() => typeof loggedInSporcu !== 'undefined' && loggedInSporcu === 'YoklamaTest', null, { timeout: 10000, polling: 250 });
    const sure2 = (Date.now() - t0) / 1000;
    log('📴 internetsiz açılış ' + sure1.toFixed(1) + ' sn, seri kuyruğa girdi → internet gelince gitti; zayıf internette açılış ' + sure2.toFixed(1) + ' sn (eskiden 77 sn) ✓');
  } finally {
    await ctx.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    await b.close();
  }
}
