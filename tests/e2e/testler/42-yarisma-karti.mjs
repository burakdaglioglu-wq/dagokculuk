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
    // v312: sekme önce sorar (Bugün atılanlar / Dün / Benim skorum / Tüm yarışmalar) → Benim skorum
    await p.evaluate(() => sekmeAc('yarisma'));
    await p.waitForSelector('#icerik-yarisma .yrs-acilis .yrs-sec-kart', { timeout: 15000, state: 'attached' });
    dogrula(/Benim skorum/.test(await p.locator('#icerik-yarisma').textContent()), 'sporcu açılışında Benim skorum yok');
    await p.evaluate(() => yrsAcilisSec('benim'));
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
    // ⚔️ maç zamanı (v309): 'Skor gir' normal Skor Gir ekranını yarışma modunda açar — hedefe dokunarak 1. seri (3'lü: her yüze
    // bir ok, yeri kaydolur), hızlı girişle 2. seri (otomatik kaydet). Seriler antrenmana değil yarisma_sporcu.mac'e yazılır.
    await p.evaluate(() => yrsModSec('mac'));
    const spSeri0 = await p.evaluate((sp) => ((turnuvaDB[sp.g][sp.ad] || {}).seriler || []).length, sp);
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-gir-btn').click());
    await p.waitForSelector('#skor-grid-paneli-baba #yrs-giris-bant', { timeout: 8000 });
    esit(await p.evaluate(() => [aktifHedefTipi, getMaksOk(), document.getElementById('skor-grid-paneli-baba').style.display].join(',')), '3spot,3,block', 'yarışma modu: 3lü hedef, 3 ok, Skor Gir açık');
    const dokun = (x, y) => p.evaluate(([x, y]) => { let svg = document.getElementById('hedef-svg-3spot'), pt = svg.createSVGPoint(); pt.x = x; pt.y = y; let q = pt.matrixTransform(svg.getScreenCTM()); hedefNoktaEkle(q.x, q.y); }, [x, y]);
    await dokun(8, -140); await dokun(15, 0); await dokun(15, 140);
    await p.evaluate(() => document.getElementById('skor-kaydet-btn').click()); await p.waitForTimeout(150);
    for (const v of ['X', '8', '7']) { await p.evaluate((v) => hizliOkEkle(v), v); await p.waitForTimeout(40); }
    await p.waitForTimeout(700); // otomatik kaydet (350 ms)
    let mm = await p.evaluate(({ yid, sp }) => ((kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k] || {}).mac || {}), { yid, sp }), m = mm.seriler;
    esit(JSON.stringify(m), JSON.stringify([['10', '9', '9'], ['X', '8', '7']]), 'maç serileri');
    let k0 = (mm.kon || [])[0] || [];
    dogrula(k0.length === 3 && k0.every((k) => k && k.x > 0 && Math.abs(k.y) < 0.05) && k0.map((k) => k.s).sort().join() === '0,1,2', 'dokunuş yeri (yüz + konum) kaydolmadı: ' + JSON.stringify(mm.kon));
    dogrula(((mm.kon || [])[1] || []).every((k) => !k || k.x == null), 'hızlı girişte konum olmamalı');
    esit(await p.evaluate((sp) => ((turnuvaDB[sp.g][sp.ad] || {}).seriler || []).length, sp), spSeri0, 'yarışma serisi antrenmana yazılmamalı');
    dogrula(/53/.test(await p.locator('#yrs-giris-bant').textContent()), 'bantta toplam 53 yok');
    // ✏️ önceki seriyi düzelt: son seri geri gelir, yeniden kaydedilir
    await p.evaluate(() => oncekiSeriyiDuzelt()); await p.waitForTimeout(100);
    esit(await p.evaluate(({ yid, sp }) => [kyDepoOku('yarisma_sporcu')[yid + '|' + sp.k].mac.seriler.length, anlikAtilanOklar.map((o) => o.puan).join('')].join(':'), { yid, sp }), '1:X87', 'geri al');
    await p.evaluate(() => skorKaydet()); await p.waitForTimeout(150);
    await p.evaluate(() => skorEkraniniKapat()); await p.waitForTimeout(300);
    esit(await p.evaluate((sp) => [!!window._yrsGiris, aktifGrup === sp.g, document.getElementById('icerik-yarisma').classList.contains('aktif')].join(','), sp), 'false,true,true', 'çıkınca Yarışma sekmesine dönmeli');
    await p.waitForSelector('#icerik-yarisma .yrs-gir-btn', { state: 'attached' });
    dogrula(/3. seriyi gir/.test(await p.locator('#icerik-yarisma .yrs-gir-btn').textContent()), 'düğme 3. seriyi göstermeli');
    dogrula(/Bugünkü grubun/.test(await p.locator('#icerik-yarisma').textContent()), 'grup kartı yok');
    dogrula(/Hedef temposunun/.test(await p.locator('#icerik-yarisma').textContent()), 'hedef temposu yok');
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
    // eğitmen platformunda da Yarışma sekmesi var (v309: liste + yeni yarışma + canlı ısı haritası)
    esit(await p.evaluate(() => { loggedInSporcu = null; aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); return document.getElementById('tab-yarisma').style.display; }), '', 'eğitmende de Yarışma sekmesi görünmeli (v309)');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-kart.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🏆 yarışma: koç ekler, sporcu sekmesi (ön hazırlık: sayaç/liste/plan · maç zamanı: Skor Gir yarışma modu, dokun + hızlı giriş, geri al, bitir), sonuç ✓');
  } finally {
    if (yid) await p.evaluate((yid) => { try { let o = {}; o[yid] = Object.assign({}, kyDepoOku('yarismalar')[yid], { sil: true }); yrsYaz('yarismalar', o); loggedInSporcu = null; } catch (e) {} }, yid).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
