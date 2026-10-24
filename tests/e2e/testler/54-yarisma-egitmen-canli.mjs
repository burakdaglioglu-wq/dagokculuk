// 🏆 Eğitmen Yarışma sekmesi + canlı ısı haritası (v309, kullanıcı: "yarışma oldu, sporcular skor girdi ama eğitmen olarak
// görebileceğim yer bulamadım; düşüşleri/yükselişleri görmek istiyorum" + "eğitmene Yarışma sekmesi: ayarlanmış yarışmalar +
// yeni yarışma"; üç taslaktan B · Canlı Isı Haritası). Eğitmen sekmeden yarışma ekler, yarışmaya dokununca herkes × seriler
// tablosu, ± antrenmana göre, Dikkat kutusu (2. yarı düşüşü, girmeyen), seri dökümü; girmeyen sporcu için "✏️ Gir" Skor Gir'i
// yarışma modunda açar, çıkınca sekmeye döner. Test kendi yarışmasını en sonda siler.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yid = null;
  try {
    await uygulamaAc(p);
    await p.evaluate(() => { loggedInSporcu = null; aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); });
    esit(await p.evaluate(() => document.getElementById('tab-yarisma').style.display), '', 'eğitmende Yarışma sekmesi görünmeli');
    await p.evaluate(() => sekmeAc('yarisma'));
    // v312: önce soru ekranı; eğitmende Benim skorum yok, Tüm yarışmalar → yönetim listesi
    await p.waitForSelector('#icerik-yarisma .yrs-acilis .yrs-sec-kart', { timeout: 15000, state: 'attached' });
    dogrula(!/Benim skorum/.test(await p.locator('#icerik-yarisma').textContent()), 'eğitmende Benim skorum olmamalı');
    await p.evaluate(() => yrsAcilisSec('liste'));
    await p.waitForSelector('#icerik-yarisma .yrs-sekme-yonet .yrs-ana-btn', { timeout: 15000, state: 'attached' });
    await p.evaluate(() => { let o = {}; yrsListe().filter((y) => /^TEST/.test(y.ad)).forEach((y) => { o[y.id] = Object.assign({}, y, { sil: true }); }); if (Object.keys(o).length) yrsYaz('yarismalar', o); });
    const sp = await p.evaluate(() => yrsTumSporcular().slice(0, 2));
    dogrula(sp.length === 2, 'iki sporcu yok');
    // ＋ Yeni yarışma (sekmenin içinde, pencere değil)
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-ana-btn').click());
    await p.waitForSelector('#icerik-yarisma .yrs-form', { state: 'attached' });
    yid = await p.evaluate((sp) => { let y = _yrs.duzenle; y.ad = 'TEST Canlı Kupa'; y.tarih = yrsBugun(); y.mesafe = '18m'; y.yuz = '6'; y.ok = 30; y.seriOk = 3; sp.forEach((s) => yrsEkle(s.k)); yrsKaydet(); return y.id; }, sp);
    dogrula(await p.locator('#icerik-yarisma .yrs-yar.bugun', { hasText: 'TEST Canlı Kupa' }).count(), 'bugünkü yarışma listede vurgulu değil');
    // 1. sporcu 10 seri girmiş (2. yarıda düşüş + bir 0'lı seri), 2. sporcu hiç girmemiş
    await p.evaluate(({ yid, sp }) => { let s = [['10', '9', '9'], ['10', '10', '9'], ['9', '9', '9'], ['10', '9', '8'], ['10', '10', '10'], ['7', '6', 'M'], ['6', '6', '5'], ['M', 'M', 'M'], ['7', '6', '5'], ['6', '5', 'M']], o = {}; o[yid + '|' + sp[0].k] = { mac: { seriler: s, kon: [], nis: [], bitti: false, son: Date.now() } }; yrsYaz('yarisma_sporcu', o); }, { yid, sp });
    await p.evaluate((yid) => yrsCanliAc(yid), yid);
    await p.waitForSelector('#icerik-yarisma .yrs-isi', { state: 'attached' });
    const t = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'), r = [...e.querySelectorAll('.yrs-isi tbody tr')]; return { satir: r.length, hucre: r[0].querySelectorAll('td[title]').length, top: r[0].querySelector('td.top').textContent, gir: r[1].querySelectorAll('.yrs-sen-gir').length, metin: e.textContent, canli: e.querySelectorAll('.yrs-canli-rozet').length, nabiz: e.querySelectorAll('.yrs-nabiz').length }; });
    esit(t.satir, 2, 'ısı haritası satırları');
    esit(t.hucre, 10, '10 seri hücresi');
    dogrula(/^200/.test(t.top), 'toplam 200 olmalı: ' + t.top);
    esit(t.gir, 1, 'girmeyen sporcuda ✏️ Gir');
    dogrula(/2\. yarıda düştü/.test(t.metin) && /hiç vuramadı/.test(t.metin) && /skor girmedi/.test(t.metin), 'Dikkat kutusu eksik');
    dogrula(t.canli >= 1 && t.nabiz === 1, 'CANLI rozeti / şu an atıyor işareti');
    dogrula(/Kulüp seri ortalaması/.test(t.metin), 'kulüp seri ortalaması yok');
    // isme dokun → seri dökümü
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-isi tbody tr td.ad button').click());
    await p.waitForSelector('#icerik-yarisma .yrs-cn-detay .yrs-bar', { state: 'attached' });
    dogrula(/1–5\. SERİ/.test(await p.locator('#icerik-yarisma .yrs-cn-detay').textContent()), 'yarı karşılaştırması yok');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-canli.png', fullPage: true });
    // ✏️ Gir → Skor Gir yarışma modunda, 2. sporcu adına; çıkınca canlı ekrana dönülür
    const eskiGrup = await p.evaluate(() => aktifGrup);
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-sen-gir').click());
    await p.waitForSelector('#skor-grid-paneli-baba #yrs-giris-bant', { timeout: 8000 });
    esit(await p.evaluate((sp) => [secilenSporcu === sp[1].ad, aktifGrup === sp[1].g, aktifHedefTipi, getMaksOk()].join(','), sp), 'true,true,6ring,3', 'Skor Gir yarışma modu (2. sporcu, 6 halka, 3 ok)');
    for (const v of ['9', '8', '7']) { await p.evaluate((v) => hizliOkEkle(v), v); await p.waitForTimeout(40); }
    await p.waitForTimeout(700);
    await p.evaluate(() => skorEkraniniKapat()); await p.waitForTimeout(300);
    await p.waitForSelector('#icerik-yarisma .yrs-isi', { state: 'attached' });
    esit(await p.evaluate(() => aktifGrup), eskiGrup, 'aktif grup geri gelmeli');
    const t2 = await p.evaluate(() => [...document.querySelectorAll('#icerik-yarisma .yrs-isi tbody tr td.top')].map((x) => x.textContent).join('|'));
    dogrula(/^200.*\|24/.test(t2), 'koçun girdiği seri tabloda yok: ' + t2);
    // ← Yarışmalar → liste; ✏️ düzenle açılır
    await p.evaluate(() => [...document.querySelectorAll('#icerik-yarisma .yz-btn')].find((b) => /Yarışmalar/.test(b.textContent)).click());
    await p.waitForSelector('#icerik-yarisma .yrs-yar-duz', { state: 'attached' });
    // 🔴 açılış → Bugün atılanlar: bugünkü yarışmanın ısı haritası gömülü (geri düğmesi yok, Düzenle var); Dün çipi boş
    await p.evaluate(() => yrsAcilisSec(null));
    await p.waitForSelector('#icerik-yarisma .yrs-sec-kart.ana', { state: 'attached' });
    dogrula(/TEST Canlı Kupa/.test(await p.locator('#icerik-yarisma .yrs-sec-kart.ana').textContent()), 'Bugün atılanlar kartında yarışma yok');
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-sec-kart.ana').click());
    await p.waitForSelector('#icerik-yarisma .yrs-gun-blok .yrs-isi', { state: 'attached' });
    const gv = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'); return { geri: /← Yarışmalar/.test(e.textContent), duz: /Düzenle/.test(e.textContent), cip: e.querySelectorAll('.yrs-gun-cip button').length }; });
    esit([gv.geri, gv.duz, gv.cip].join(','), 'false,true,4', 'gün görünümü');
    await p.evaluate(() => yrsGunSec('hafta'));
    dogrula(await p.locator('#icerik-yarisma .yrs-yar', { hasText: 'TEST Canlı Kupa' }).count(), 'Bu hafta listesinde yarışma yok');
    // 📊 sporcu görünümü (v311): "Yarışma skorları" kartı herkesin ısı haritasını salt okunur açar (Düzenle / Gir yok)
    dogrula(await p.evaluate(() => /TEST Canlı Kupa/.test(yrsSkorKartHTML())), 'sporcu skor kartında bugünkü yarışma yok');
    await p.evaluate((yid) => yrsSonuclarAc(yid), yid);
    await p.waitForSelector('#yrs-yonet.yrs-arka .yrs-isi', { state: 'attached' });
    const ro = await p.evaluate(() => { let k = document.getElementById('yrs-yonet'); return { gir: k.querySelectorAll('.yrs-sen-gir, .yrs-link').length, duz: /Düzenle/.test(k.textContent), satir: k.querySelectorAll('.yrs-isi tbody tr').length }; });
    esit([ro.gir, ro.duz, ro.satir].join(','), '0,false,2', 'salt okunur skor tablosu');
    await p.evaluate(() => yrsYonetKapat());
    esit(await p.evaluate(() => [!!document.getElementById('yrs-yonet'), !!_yrs.salt].join(',')), 'false,false', 'kapatınca salt okunur mod kalkmalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🏆 eğitmen Yarışma sekmesi: yeni yarışma, canlı ısı haritası, Dikkat, seri dökümü, ✏️ Gir → Skor Gir yarışma modu ✓');
  } finally {
    if (yid) await p.evaluate((yid) => { try { let o = {}; o[yid] = Object.assign({}, kyDepoOku('yarismalar')[yid], { sil: true }); yrsYaz('yarismalar', o); } catch (e) {} }, yid).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
