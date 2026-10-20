// 🏆 Yarışma kartı (2026-10-20, kullanıcı: "hafta sonu yarışma var, sporcu sayfasında eksik kaldık" → "A · Ana ekranda yarışma
// kartı"). Koç Yarışma › 🏆 Yarışmalar'da yarışma ekler, sporcu seçer, hedef + not yazar; sporcunun ana ekranının en üstünde kart:
// geri sayım, hazırlık listesi (işaretlenir), hedef + plan (Yaptım), koç notu, analiz; yarışma günü sonucu girilir, geçmişe düşer.
// Test kendi yarışmasını en sonda siler.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yid = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    await p.evaluate(() => yzYarismalarAc());
    await p.waitForTimeout(800); // önceki yarım kalan test yarışmalarını temizle
    await p.evaluate(() => { let o = {}; yrsListe().filter((y) => /^TEST/.test(y.ad)).forEach((y) => { o[y.id] = Object.assign({}, y, { sil: true }); }); if (Object.keys(o).length) yrsYaz('yarismalar', o); });
    await p.waitForSelector('#yrs-yonet .yrs-pen');
    const sp = await p.evaluate(() => { let l = yrsTumSporcular(); return l[0]; });
    dogrula(sp, 'sporcu yok');
    yid = await p.evaluate((sp) => {
      yrsDuzenle(null); let y = _yrs.duzenle; y.ad = 'TEST Salon Yarışması'; y.tarih = yrsGunEkle(yrsBugun(), 3); y.saat = '09:30'; y.yer = 'Test Salonu'; y.mesafe = '18m'; y.yuz = '3lu'; y.kategori = 'U18'; y.ok = 60;
      yrsEkle(sp.k); yrsHedefYaz(sp.k, 'hedef', 540); yrsHedefYaz(sp.k, 'not', 'Rutini bozma'); yrsKaydet(); return y.id;
    }, sp);
    dogrula(await p.locator('#yrs-yonet .yrs-yar', { hasText: 'TEST Salon Yarışması' }).count(), 'yarışma listede yok');
    await p.evaluate(() => yrsYonetKapat());
    // sporcunun ekranı
    await p.goto(p.url()); await uygulamaAc(p);
    await p.evaluate((sp) => { loggedInSporcu = sp.ad; aktifGrup = sp.g; aktifPlatform = 'sporcu'; tablariPlatformaGoreAyarla(); sekmeAc('ana'); }, sp);
    // ana ekranda kısa şerit, sekme düğmesi görünür (yalnız sporcu kimliğiyle)
    await p.waitForSelector('#yarisma-kart-ana .yrs-serit', { timeout: 15000, state: 'attached' });
    esit(await p.evaluate(() => document.getElementById('tab-yarisma').style.display), '', 'sporcuya Yarışma sekmesi görünmeli');
    await p.evaluate(() => sekmeAc('yarisma'));
    await p.waitForSelector('#icerik-yarisma .yrs-hero', { timeout: 15000, state: 'attached' });
    const k = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'); return { metin: e.textContent, sayac: e.querySelectorAll('#yrs-sayac div').length, madde: e.querySelectorAll('.yrs-liste input').length, plan: e.querySelectorAll('.yrs-plan button').length, mod: e.querySelectorAll('.yrs-mod button').length }; });
    dogrula(/TEST Salon Yarışması/.test(k.metin) && /540/.test(k.metin) && /Rutini bozma/.test(k.metin), 'sekmede yarışma/hedef/not yok');
    esit(k.mod, 2, 'Ön hazırlık / Maç zamanı seçimi');
    esit(k.sayac, 4, 'geri sayım');
    dogrula(k.madde >= 5 && k.plan >= 3, 'hazırlık listesi / plan yok');
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-liste input').click()); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-plan button').click()); await p.waitForTimeout(150);
    const st = await p.evaluate(({ yid, sp }) => kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k], { yid, sp });
    dogrula(st && st.hazir && st.hazir[0] && st.plan && st.plan[0], 'hazırlık/plan işareti kaydolmadı');
    // ⚔️ maç zamanı: 2 seri gir (3 ok), tempo görünür, geri al, bitir → sonuç puanı
    await p.evaluate(() => yrsModSec('mac'));
    const bas = (v) => p.evaluate((v) => [...document.querySelectorAll('#icerik-yarisma .yrs-puanlar button')].find((b) => b.textContent === v).click(), v);
    for (const v of ['10', '9', '9', 'X', '8', '7']) { await bas(v); await p.waitForTimeout(60); }
    let m = await p.evaluate(({ yid, sp }) => ((kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k] || {}).mac || {}).seriler, { yid, sp });
    esit(JSON.stringify(m), JSON.stringify([['10', '9', '9'], ['X', '8', '7']]), 'maç serileri');
    dogrula(/Hedef temposunun/.test(await p.locator('#icerik-yarisma').textContent()), 'hedef temposu yok');
    await bas('5'); await p.evaluate(() => [...document.querySelectorAll('#icerik-yarisma .yrs-mac-alt button')][0].click());
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-bitir').click()); await p.waitForTimeout(200);
    await p.evaluate(() => onayOnayla()); await p.waitForTimeout(250);
    let s = await p.evaluate(({ yid, sp }) => (kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k] || {}).sonuc, { yid, sp });
    esit(s && s.puan, 53, 'bitirince toplam (10+9+9+10+8+7) sonuca geçmeli');
    // sıra + madalya ekle
    await p.waitForSelector('#icerik-yarisma #yrs-puan', { state: 'attached' });
    await p.evaluate(() => { document.getElementById('yrs-sira').value = '2'; document.getElementById('yrs-kisi').value = '19'; [...document.querySelectorAll('#icerik-yarisma .yrs-madalya button')].find((b) => b.textContent === '🥈').click(); document.querySelector('#icerik-yarisma .yrs-sonuc .yrs-ana-btn').click(); });
    await p.waitForTimeout(250);
    s = await p.evaluate(({ yid, sp }) => (kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k] || {}).sonuc, { yid, sp });
    esit(s && [s.puan, s.sira, s.kisi, s.madalya].join(','), '53,2,19,🥈', 'sonuç kaydı');
    // koç çıkış yapınca sekme kalkmalı
    esit(await p.evaluate(() => { loggedInSporcu = null; aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); return document.getElementById('tab-yarisma').style.display; }), 'none', 'eğitmende Yarışma sekmesi gizli olmalı');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-kart.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🏆 yarışma: koç ekler, sporcu sekmesi (ön hazırlık: sayaç/liste/plan · maç zamanı: seri/tempo/geri al/bitir), sonuç ✓');
  } finally {
    if (yid) await p.evaluate((yid) => { try { let o = {}; o[yid] = Object.assign({}, kyDepoOku('yarismalar')[yid], { sil: true }); yrsYaz('yarismalar', o); loggedInSporcu = null; } catch (e) {} }, yid).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
