// ☁️ Yarışma skorunun sunucuya gidişi (v315). 2026-10-25 yarışmasında sporcular telefondan girdi ama sunucuya hiçbir skor
// ulaşmadı, telefon yine "✓" diyordu. Test: (1) sunucu yarışma kayıtlarını birleştirir — iki telefonun birbirinden habersiz
// PUT'u kayıt düşürmez; (2) internet yokken giriş bandı "telefonda saklı" der, internet gelince kendisi gönderir ve
// "gönderildi ✓" olur; (3) yönetici sporcu kartında "🏆 Yarışma skorları" satırı + ısı haritası bu sporcu açık gelir.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yid = null;
  try {
    await uygulamaAc(p);
    await p.evaluate(() => { loggedInSporcu = null; aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); sekmeAc('yarisma'); });
    await p.waitForFunction(() => typeof yrsGirisAc === 'function' && typeof yrsKarttanAc === 'function', null, { timeout: 15000 });
    const sp = await p.evaluate(() => yrsTumSporcular().slice(0, 2));
    dogrula(sp.length === 2, 'iki sporcu yok');
    yid = await p.evaluate((sp) => { let id = 'ytest' + Date.now().toString(36), o = {}; o[id] = { id, ad: 'TEST Gönderim', tarih: yrsBugun(), mesafe: '18m', yuz: '6', ok: 30, seriOk: 3, katilimci: sp.map((s) => s.k) }; yrsYaz('yarismalar', o); return id; }, sp);

    // (1) iki telefon aynı anda: birbirini görmeyen iki PUT → ikisi de sunucuda kalmalı
    const yaris = await p.evaluate(async ({ yid, sp }) => {
      let put = (o) => fetch('/api/meta/yarisma_sporcu', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(o) }) });
      let a = {}, b = {}; a[yid + '|' + sp[0].k] = { mac: { seriler: [['9', '9', '9']] }, t: Date.now() }; b[yid + '|' + sp[1].k] = { mac: { seriler: [['8', '8', '8']] }, t: Date.now() };
      await Promise.all([put(a), put(b)]);
      let d = JSON.parse((await (await fetch('/api/meta/yarisma_sporcu')).json()).value || '{}');
      return [!!d[yid + '|' + sp[0].k], !!d[yid + '|' + sp[1].k]].join(',');
    }, { yid, sp });
    esit(yaris, 'true,true', 'iki telefonun skoru da sunucuda kalmalı');
    // bu iki deneme kaydını temizle (sonraki adım 1. sporcuya sıfırdan girer)
    await p.evaluate(({ yid, sp }) => { let o = {}; sp.forEach((s) => { o[yid + '|' + s.k] = { mac: { seriler: [], kon: [], nis: [], bitti: false } }; }); yrsYaz('yarisma_sporcu', o); }, { yid, sp });
    await p.waitForTimeout(800);

    // (2) internetsiz giriş → "telefonda saklı" → internet gelince kendisi gönderir
    await p.evaluate((a) => yrsGirisAc(a), yid + '|' + sp[0].k);
    await p.waitForSelector('#yrs-giris-bant', { timeout: 8000 });
    await ctx.setOffline(true);
    for (const v of ['10', '9', '8']) { await p.evaluate((v) => hizliOkEkle(v), v); await p.waitForTimeout(40); }
    await p.waitForFunction(() => { let e = document.getElementById('yrs-gonderim'); return e && e.classList.contains('bekliyor'); }, null, { timeout: 20000 });
    dogrula(/telefonda saklı/.test(await p.locator('#yrs-gonderim').textContent()), 'internetsiz uyarı metni');
    await ctx.setOffline(false);
    await p.waitForFunction(() => { let e = document.getElementById('yrs-gonderim'); return e && e.classList.contains('tamam'); }, null, { timeout: 30000 });
    const sunucu = await p.evaluate(async (a) => { let d = JSON.parse((await (await fetch('/api/meta/yarisma_sporcu')).json()).value || '{}'); return JSON.stringify(((d[a] || {}).mac || {}).seriler || []); }, yid + '|' + sp[0].k);
    esit(sunucu, '[["10","9","8"]]', 'internet gelince seri sunucuya gitmeli');
    await p.evaluate(() => skorEkraniniKapat()); await p.waitForTimeout(300);

    // (3) yönetici sporcu kartı: 🏆 Yarışma skorları satırı → ısı haritası bu sporcu açık
    const satir = await p.evaluate((s) => (dagYonetimAdaptor().islemler({ grup: s.g, ad: s.ad }).find((x) => /Yarışma skorları/.test(x.et)) || {}).alt || '', sp[0]);
    dogrula(/1 seri, 27 puan/.test(satir), 'kart satırı: ' + satir);
    // v318 kart ızgarası (Kayıt işlemleri → 🏆 Skor & yarışma): puan + seri sayısı + şerit + Isı haritası düğmesi
    const panel = await p.evaluate((s) => dagYonetimAdaptor().islemPanel({ grup: s.g, ad: s.ad }), sp[0]);
    dogrula(/TEST Gönderim/.test(panel) && panel.includes('<b>27</b>') && /1 seri/.test(panel) && /ynk-serit/.test(panel) && /Isı haritası/.test(panel) && /Giriş linkini gönder/.test(panel), 'kart ızgarası eksik');
    await p.evaluate((s) => yrsKarttanAc(s.g, s.ad), sp[0]);
    await p.waitForSelector('#yrs-yonet.yrs-arka .yrs-cn-detay', { state: 'attached', timeout: 8000 });
    dogrula((await p.locator('#yrs-yonet .yrs-cn-detay').textContent()).includes(sp[0].ad), 'ısı haritasında sporcu seçili açılmalı');
    await p.evaluate(() => yrsYonetKapat());
    log('☁️ yarışma gönderimi: iki telefon birbirini ezmiyor, internetsiz → saklı → gelince gönderildi ✓, kartta 🏆 Yarışma skorları ✓');
  } finally {
    await ctx.setOffline(false).catch(() => {});
    if (yid) await p.evaluate((yid) => { try { let o = {}; o[yid] = Object.assign({}, kyDepoOku('yarismalar')[yid], { sil: true }); yrsYaz('yarismalar', o); } catch (e) {} }, yid).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
