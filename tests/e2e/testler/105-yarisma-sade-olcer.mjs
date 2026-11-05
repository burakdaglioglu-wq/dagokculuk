// 2026-11-06 (v380) Kullanıcı: "yarışma karışık oldu, sporcu ekle çıkarı daha büyük yap, yeni seri ekleyi düzelt" + Atış Ölçer'i gerçek telefonla denedi:
// "kaç saniye kaldığını gösterdi ama skoru zaten genel yarışmada giriyorum; orada düzelt, yarışmadaysa skor girişini de ekle".
// Panel: büyük Sporcular + Seri ekle, az araç. Son seride ve Sonuçlar'da seri eklenir. Sporcu penceresi: başlık ve Kapat hep görünür, satırlar büyük, 390 px'te iki sekme.
// Ölçer: süreler seriye yazılır ve masada görünür; seri dolunca telefonda skor ekranı, kayıt masadaki yolla aynı; masa girdiyse üzerine yazmaz; skor ekranında sensör durur.
// Skorlar gerçek kayda işlenmez (kayit=false).
import { sayfaAc, uygulamaAc, karisikSinifArac, tarayiciKapat, dogrula, esit } from '../yardimci.mjs';

// kaldır, tut, bırak, indir: test 100'deki sahte sensörle aynı biçim
const SENSOR = `window._hkSahte = function (tutuslar) {
  const l = []; let t = window.__hkT || 1000; const dt = 20;
  const ekle = (ag, r, lin) => { l.push({ t, ag, r: r || [0, 0, 0], l: lin || [0, 0, 0] }); t += dt; };
  const dinlen = (ms) => { for (let i = 0; i < ms / dt; i++) ekle([0, 0, 9.8]); };
  const kaldir = () => { for (let i = 0; i <= 25; i++) { const a = i / 25 * Math.PI / 2; ekle([0, 9.8 * Math.sin(a), 9.8 * Math.cos(a)], [0, 90, 0]); } };
  const tut = (ms) => { for (let i = 0; i < ms / dt; i++) { const s = i * dt / 1000; ekle([0, 9.8, 0], [0.3, 3 * Math.sin(s * 5), 2 * Math.cos(s * 4)]); } };
  const indir = () => { for (let i = 0; i <= 25; i++) { const a = (1 - i / 25) * Math.PI / 2; ekle([0, 9.8 * Math.sin(a), 9.8 * Math.cos(a)], [0, -90, 0]); } };
  const birak = () => { ekle([0, 9.8, 0], [0, 40, 260], [32, 4, 2]); for (let i = 0; i < 1500 / dt; i++) ekle([0, 9.8, 0], [0, 4, 3]); };
  dinlen(1000); tutuslar.forEach((h) => { kaldir(); tut(h); birak(); indir(); dinlen(1200); }); window.__hkT = t; return l;
};`;

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), olcer: localStorage.getItem('dagsk_atis_olcer'), siradaki: _yz.siradaki }));
    const adlar = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 16); localStorage.removeItem(yzAnahtar()); localStorage.removeItem('dagsk_atis_olcer'); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      yzKurAyar('kayit', false); const t = yzKurulumTaslak(); t.katilimci = tum.slice(0, 16).map((k) => k.g + '|' + k.ad); t.format = yzFormatAnahtar(2, 3); yzCiz();
      return tum.slice(0, 16).map((k) => k.g + '|' + k.ad);
    });
    dogrula(adlar.length >= 3, 'en az 3 sporcu gerekli');
    await p.locator('button', { hasText: 'Turu başlat' }).click(); await p.waitForTimeout(400);

    // ---- panel: büyük düğmeler, az araç
    const sp = p.locator('.yz-buyuk-is', { hasText: 'Sporcular' }), se = p.locator('#yz-seri-ekle');
    dogrula(await sp.isVisible() && await se.isVisible(), 'büyük düğmeler görünmüyor');
    const b1 = await sp.boundingBox(), b2 = await se.boundingBox();
    dogrula(b1.height >= 72 && b2.height >= 72, 'düğmeler büyük değil: ' + b1.height + '/' + b2.height);
    dogrula(await p.locator('.yz-a-araclar .yz-arac').count() <= 7, 'araç sayısı çok');
    dogrula(await p.locator('.yz-a-araclar button:has-text("Atış Ölçer")').isVisible(), 'panelde Atış Ölçer yok');
    dogrula(await p.evaluate(() => document.getElementById('km-icerik').getBoundingClientRect().top < 200), 'tur başlayınca sayfa aşağıda kaldı');
    await p.evaluate(() => yzMenu()); await p.waitForTimeout(200);
    for (const x of ['Yetenek Şovu', 'Skor kâğıtları', 'Canlı izle', 'Tema']) dogrula(await p.locator('#onay-modal button', { hasText: x }).isVisible(), 'Diğer menüsünde yok: ' + x);
    await p.evaluate(() => { document.getElementById('onay-modal').style.display = 'none'; });

    // ---- seri ekle: panelden tek dokunuş, geri alınır, sayaçtaki seri kıpırdamaz
    esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), 2, 'başlangıç 2 seri');
    await se.click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), 3, 'Seri ekle çalışmadı');
    esit(await p.evaluate(() => yzOku().durum.seri), 0, 'seri ekle turu ilerletmemeli');
    await p.locator('.yz-seri-sil').click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), 2, 'eklenen seri kaldırılamadı');
    esit(await p.locator('.yz-seri-sil').count(), 0, 'eklenen seri yokken ➖ çıkmamalı');

    // ---- sporcu penceresi
    await sp.click(); await p.waitForSelector('#yz-secici .yz-secici');
    const kutu = await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, h: b.height, w: b.width }; }; return { kapat: r('.yz-sec-kapat'), aday: r('.yz-sec-aday'), sat: r('.yz-sec-sat'), cikar: r('.yz-sec-cikar'), arti: r('.yz-sec-arti'), ara: r('#yz-sec-ara'), pencere: r('.yz-secici') }; });
    dogrula(kutu.kapat.t >= 0 && kutu.kapat.b <= 800, 'Kapat ekranda değil');
    dogrula(kutu.pencere.w >= 900, 'pencere dar: ' + kutu.pencere.w);
    dogrula(kutu.sat.h >= 68, 'sporcu satırı küçük: ' + kutu.sat.h); dogrula(kutu.cikar.h >= 48, 'Çıkar küçük'); dogrula(kutu.ara.h >= 52, 'arama küçük');
    if (kutu.aday) { dogrula(kutu.aday.h >= 68, 'aday satırı küçük'); dogrula(kutu.arti.h >= 48, '+ küçük'); }
    // arama: yazarken kutu kaybolmaz (yalnız liste değişir)
    await p.evaluate(() => { document.getElementById('yz-sec-ara').__iz = 1; });
    await p.locator('#yz-sec-ara').fill('zzzqqq');
    esit(await p.evaluate(() => document.getElementById('yz-sec-ara').__iz), 1, 'arama kutusu her harfte yeniden kuruluyor');
    dogrula((await p.locator('#yz-sec-adaylar').innerText()).includes('bulunamadı'), 'boş arama mesajı yok');
    await p.locator('#yz-sec-ara').fill('');
    // ekle / çıkar
    const aday = await p.evaluate(() => { const kat = yzOku().durum.katilimci; return yzTumSporcular().find((x) => !x.pasif && !kat.includes(x.k)); });
    if (aday) {
      await p.locator('#yz-sec-ara').fill(aday.ad);
      await p.locator('.yz-sec-aday[onclick*="' + await p.evaluate((k) => yzEnc(k), aday.k) + '"]').first().click(); await p.waitForTimeout(150);
      dogrula(await p.evaluate((k) => yzOku().durum.katilimci.includes(k), aday.k), 'ekleme çalışmadı');
      await p.locator('.yz-sec-sat', { hasText: aday.ad }).locator('button', { hasText: 'Çıkar' }).click(); await p.waitForTimeout(150);
      dogrula(!(await p.evaluate((k) => yzOku().durum.katilimci.includes(k), aday.k)), 'çıkarma çalışmadı');
      await p.evaluate((k) => { yzGuncelle((o) => { o.durum.cikarilan = (o.durum.cikarilan || []).filter((x) => x !== k); }); }, aday.k);
    }
    await p.locator('#yz-secici button', { hasText: 'Kapat' }).click();

    // ---- ÖLÇER: tablette masa, telefonda kol. Aynı tarayıcı: kayıt ortak olduğu için ikisini de burada görürüz.
    const k0 = adlar[0], ad0 = k0.split('|')[1], g0 = k0.split('|')[0];
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { _yz.siradaki = false; window.__titre = []; hareketAc({ km: true }); });
    await p.waitForSelector('#hk .hk-ana', { timeout: 15000 });
    await p.evaluate(([g, a]) => hkSporcu(encodeURIComponent(g), encodeURIComponent(a)), [g0, ad0]);
    await p.waitForSelector('#hk-yz-kart');
    dogrula((await p.locator('#hk-yz-kart').innerText()).includes('1. seri / 2'), 'yarışma kartı');
    esit(await p.evaluate(() => _hkIc.durum().mesafe), 18, 'mesafe yarışmadan gelmeli');
    await p.locator('#hk .hk-ana', { hasText: 'Başla' }).click(); await p.waitForSelector('#hk-yz-serit');
    await p.evaluate(SENSOR);
    await p.evaluate(() => _hkIc.besle(_hkSahte([4000, 3000])));
    dogrula((await p.locator('#hk-yz-serit').innerText()).includes('2 / 3'), 'şeritte 2/3 ok yok');
    const yarim = await p.evaluate((k) => { const o = yzOku(), r = yzOlcumOzet(o, k, 0); return r && r.t.length; }, k0);
    esit(yarim, 2, 'süreler yarışma kaydına yazılmadı');
    // üçüncü ok: seri doldu → skor ekranı
    await p.evaluate(() => _hkIc.besle(_hkSahte([6000])));
    await p.waitForSelector('#hk-skor-kaydet', { timeout: 4000 });
    dogrula(await p.evaluate(() => document.querySelector('#hk').scrollWidth <= document.querySelector('#hk').clientWidth + 1), 'skor ekranı 390 px taşıyor');
    const tusBoy = await p.locator('.hk-tus').first().boundingBox(); dogrula(tusBoy.height >= 56, 'tuş küçük');
    // skor ekranında sensör durur: hedefe yürürken ok sayılmaz
    const once = await p.evaluate(() => _hkIc.durum().D.oklar.length);
    await p.evaluate(() => _hkIc.besle(_hkSahte([3000])));
    esit(await p.evaluate(() => _hkIc.durum().D.oklar.length), once, 'skor ekranında sensör durmadı');
    // puan gir: masadaki yolla aynı kayıt
    dogrula(await p.locator('#hk-skor-kaydet').isDisabled(), 'eksik seride kaydet kapalı olmalı');
    for (const t of ['X', '9', '7']) await p.locator('.hk-tus', { hasText: new RegExp('^' + t + '$') }).click();
    await p.locator('#hk-skor-kaydet').click(); await p.waitForSelector('#hk-yz-serit');
    const kayit = await p.evaluate((k) => { const o = yzOku(), D = _hkIc.durum().D; return { s: yzSkor(o, k)[0], p: (o[yzPKey(o.durum.id, k)] || [])[0], puan: D.oklar.map((a) => a.puan), seri: _hkIc.durum().yzSeri, top: yzSiralama(o).find((r) => r.k === k).toplam, evre: D.evre, cift: _hkIc.ciftlerTopla().length }; }, k0);
    esit(JSON.stringify(kayit.s), JSON.stringify(['X', '9', '7']), 'skor yarışmaya yazılmadı');
    esit(kayit.top, 26, 'sıralamaya işlenmedi'); esit(JSON.stringify(kayit.puan), JSON.stringify(['X', '9', '7']), 'puan oklarla eşleşmedi');
    esit(kayit.seri, 1, 'telefon sıradaki seriye geçmedi'); esit(kayit.evre, 'bekle', 'sensör yeniden başlamadı');
    // masa aynı seride önce girerse: telefon üzerine YAZMAZ, süreleri bağlar
    await p.evaluate((k) => { yzGirisAc(yzEnc(k), 1); ['10', '8', '6'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzGirisKapat(); }, k0);
    await p.evaluate(() => _hkIc.besle(_hkSahte([4500, 4000, 3500])));
    await p.waitForTimeout(1800);
    esit(await p.locator('#hk-skor-kaydet').count(), 0, 'masa girmişken skor ekranı açılmamalı');
    const masa = await p.evaluate((k) => { const o = yzOku(); return { s: yzSkor(o, k)[1], t: yzOlcumOzet(o, k, 1).t.length }; }, k0);
    esit(JSON.stringify(masa.s), JSON.stringify(['10', '8', '6']), 'masanın skoru değişti'); esit(masa.t, 3, 'süreler 2. seriye bağlanmadı');
    // özet: seri seri, masadaki de eşleşir
    await p.locator('#hk .hk-ana', { hasText: 'Bitir' }).click(); await p.waitForSelector('#hk-seri-ozet');
    const oz = await p.locator('#hk-seri-ozet').innerText();
    dogrula(/1\. seri[\s\S]*26/.test(oz) && /2\. seri[\s\S]*24/.test(oz), 'özet: ' + oz);
    esit(await p.evaluate(() => _hkIc.ciftlerTopla().length), 6, 'masadan girilen de puanla eşleşmeli');
    await p.evaluate(() => hkKapat());

    // ---- saf
    const sec = await p.evaluate(() => { const f = _hkIc.seriSec; return [f(null, 2, 12, 6, 0), f(1, 3, 12, 6, 2), f(1, 1, 12, 6, 3), f(1, 1, 12, 6, 6), f(11, 11, 12, 6, 6), f(5, 2, 12, 6, 1)]; });
    esit(JSON.stringify(sec), JSON.stringify([2, 3, 1, 2, 11, 5]), 'seriSec');

    // ---- masa: süre skor penceresinde görünür
    await p.setViewportSize({ width: 1280, height: 800 });
    await p.evaluate((k) => { yzCiz(); yzGirisAc(yzEnc(k), 0); }, k0); await p.waitForSelector('#yz-olcum-satir');
    dogrula(/Tutuş/.test(await p.locator('#yz-olcum-satir').innerText()), 'masada tutuş satırı yok');
    await p.evaluate(() => yzGirisKapat());

    // ---- son seride ve Sonuçlar'da seri eklenir
    await p.evaluate(() => { const o = yzOku(); yzGuncelle((x) => { x.durum.seri = 1; }); yzOku().durum.katilimci.forEach((k) => { if (yzSkor(yzOku(), k)[1]) return; yzGirisAc(yzEnc(k), 1); ['9', '9', '9'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzGirisKapat(); }); yzCiz(); });
    await p.waitForSelector('.yz-son-uzat');
    await p.locator('.yz-son-uzat').click(); await p.waitForTimeout(200);
    const u = await p.evaluate(() => ({ f: yzFormat(yzOku().durum).seri, s: yzOku().durum.seri })); esit(u.f, 3, 'son seride eklenmedi'); esit(u.s, 2, 'yeni seriye geçmedi');
    await p.evaluate(() => yzBitir(true)); await p.waitForSelector('#yz-sonuc-uzat');
    await p.locator('#yz-sonuc-uzat button').click(); await p.waitForTimeout(300);
    const u2 = await p.evaluate(() => ({ a: yzOku().durum.asama, f: yzFormat(yzOku().durum).seri, s: yzOku().durum.seri }));
    esit(u2.a, 'tur', 'bitmiş tur açılmadı'); esit(u2.f, 4, 'Sonuçlar\'dan seri eklenmedi'); esit(u2.s, 3, 'yeni seriye geçmedi');

    // ---- telefonda sıralama kartları: tablo gizli, kart açılır, seriye dokununca giriş açılır
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { _yz.telAcik = {}; yzCiz(); }); await p.waitForTimeout(200);
    dogrula(!(await p.locator('.yz-tablo-genis').first().isVisible()), 'telefonda tablo görünmemeli');
    const tk = p.locator('.yz-tel-kart').first(); dogrula(await tk.isVisible(), 'telefonda kart yok');
    dogrula((await tk.locator('summary').boundingBox()).height >= 60, 'kart küçük');
    const tkAd = await tk.getAttribute('data-tel');
    await tk.locator('summary').click(); await p.waitForTimeout(100);
    dogrula(await tk.locator('.yz-tel-seri').first().isVisible(), 'kart açılmadı');
    await p.evaluate(() => yzCiz()); await p.waitForTimeout(100);
    dogrula(await p.locator('.yz-tel-kart[open]').first().getAttribute('data-tel') === tkAd, 'yeniden çizimde kart kapandı');
    await p.locator('.yz-tel-kart[open] .yz-tel-seri').first().click(); await p.waitForSelector('#yz-giris'); await p.evaluate(() => yzGirisKapat());
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'tur ekranı 390 px taşıyor');
    await p.setViewportSize({ width: 1280, height: 800 });
    dogrula(await p.locator('.yz-tablo-genis').first().isVisible() && !(await p.locator('.yz-tel-kart').first().isVisible()), 'geniş ekranda tablo olmalı');

    // ---- üzerine gelince kart: koyu, küçük
    const hov = await p.evaluate((k) => { yzHoverKart(k, 100, 100); const e = document.querySelector('.yz-hov'), c = getComputedStyle(e), r = { bg: c.backgroundColor, w: e.getBoundingClientRect().width, cumle: e.querySelectorAll('.yz-hov-cumle>div').length }; yzHoverKapat(); return r; }, k0);
    esit(hov.bg, 'rgb(39, 39, 44)', 'kart koyu değil'); dogrula(hov.w <= 340, 'kart büyük: ' + hov.w); dogrula(hov.cumle <= 2, 'en çok 2 cümle');

    // ---- Analiz: süre–puan (ilk iki seri eşleşti: 6 ok). Dilim saf.
    const dl = await p.evaluate(async () => { if (typeof yzaTutusDilim !== 'function') await dagskEkYukle('dagsk-km-yarisma-analiz.js'); const v = yzaTutusDilim([[4100, 10], [4500, 9], [4900, 8], [2000, 5], [9000, 1], [9500, 3]]); return { n: v.n, en: v.en.s, ort: v.dilim[2].ort, kisa: v.dilim[0].n, uzun: v.dilim[6].n }; });
    esit(JSON.stringify(dl), JSON.stringify({ n: 6, en: 4, ort: 9, kisa: 1, uzun: 2 }), 'tutuş dilimi');
    await p.evaluate((k) => yzAnalizAc(encodeURIComponent(k)), k0); await p.waitForSelector('#yza-tutus', { timeout: 20000 });
    const tt = await p.locator('#yza-tutus').innerText(), ttBek = await p.evaluate((k) => yzaTutusCiftleri(yzaTurBilgi(), k).length, k0); dogrula(ttBek >= 6 && tt.includes('Toplam ' + ttBek + ' ok'), 'Analiz grafiği bu turun 6 okunu görmeli: ' + ttBek + ' · ' + tt.slice(0, 100)); // arşivdeki eski turlar da sayılır
    await p.evaluate(() => yzaKapat());

    // ---- Sonuçlar: az düğme, gerisi Diğer'de; arşivde süre kalır
    await p.evaluate(() => yzBitir(true)); await p.waitForSelector('#yz-sonuc-diger');
    dogrula(await p.locator('.yz-sonuc-ana button').count() <= 5, 'Sonuçlar\'da düğme çok');
    await p.locator('#yz-sonuc-diger').click(); await p.waitForTimeout(150);
    for (const x of ['Madalya töreni', 'Sonuç PDF', 'Belgeler', 'Kulüp ligi']) dogrula(await p.locator('#onay-modal button', { hasText: x }).isVisible(), 'Diğer\'de yok: ' + x);
    await p.evaluate(() => { document.getElementById('onay-modal').style.display = 'none'; });
    const ars = await p.evaluate((k) => { const a = yzArsivOku(), s = a[a.length - 1].sporcular.find((x) => x.k === k); return s.tut && s.tut.length; }, k0); esit(ars, 6, 'arşivde süre yok');
    const uzat2 = await p.evaluate(() => yzFormat(yzOku().durum).seri); await p.locator('#yz-sonuc-uzat button').click(); await p.waitForTimeout(200); esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), uzat2 + 1, 'uzatma');

    // ---- geçen seferki gibi başlat: ayarlar kalır, tek dokunuş
    const sonA = await p.evaluate(() => JSON.stringify(yzOku().sonAyar && { m: yzOku().sonAyar.mesafe, f: yzOku().sonAyar.format })); dogrula(sonA && sonA !== 'null', 'sonAyar saklanmadı');
    await p.evaluate(() => { yzYeniTur(); _yz.kurulum = null; const t = yzKurulumTaslak(); t.format = yzFormatAnahtar(6, 6); t.mesafe = '70m'; t.kayit = false; yzCiz(); }); await p.waitForSelector('#yz-hizli');
    await p.locator('#yz-hizli button').click(); await p.waitForTimeout(300);
    const hz = await p.evaluate(() => { const d = yzOku().durum; return JSON.stringify({ m: d.ayar.mesafe, f: d.ayar.format }); }); esit(hz, sonA, 'hızlı başlat ayarları'); esit(await p.evaluate(() => yzOku().durum.ayar.kayit), false, 'kayıt ayarı korunmalı');

    // ---- eleme maçı: telefon maçı bulur, set = seri, skor telefondan girilir, süre maça yazılır
    const el = await p.evaluate(async () => { const o = yzOku(); o.durum.katilimci.slice(0, 4).forEach((k) => { yzGirisAc(yzEnc(k), 0); ['9', '9', '9'].slice(0, yzOkSayiK(yzOku().durum, k)).concat(['9', '9', '9']).slice(0, yzOkSayiK(yzOku().durum, k)).forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzGirisKapat(); }); yzBitir(true); yzElemeBaslat(4); await new Promise((r) => setTimeout(r, 200)); const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.oynanabilir); return { macId: m.id, k: m.a, b: yzOlcerDurum(m.a) }; });
    dogrula(el.b && el.b.birim === 'set' && el.b.ok === 3 && el.b.simdi === 0, 'eleme durumu: ' + JSON.stringify(el.b));
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((k) => { hareketAc({ km: true }); return k; }, el.k); await p.waitForSelector('#hk .hk-ana', { timeout: 15000 });
    await p.evaluate((k) => hkSporcu(encodeURIComponent(k.split('|')[0]), encodeURIComponent(k.split('|')[1])), el.k); await p.waitForSelector('#hk-yz-kart');
    dogrula(/set/.test(await p.locator('#hk-yz-kart').innerText()), 'kart seti söylemiyor');
    await p.locator('#hk .hk-ana', { hasText: 'Başla' }).click(); await p.waitForSelector('#hk-yz-serit');
    await p.evaluate(() => _hkIc.besle(_hkSahte([4000, 5000, 3000]))); await p.waitForSelector('#hk-skor-kaydet', { timeout: 4000 });
    for (const t of ['10', '9', '8']) await p.locator('.hk-tus', { hasText: new RegExp('^' + t + '$') }).click();
    await p.locator('#hk-skor-kaydet').click(); await p.waitForTimeout(300);
    const mk = await p.evaluate(([mac, k]) => { const o = yzOku(), m = yzMacBul(o, mac), t = m.a === k ? 'a' : 'b'; return { s: m.setler[0][t], tut: yzOlcumOzet(o, 'm' + mac + '_' + k, 0).t.length, sonraki: yzOlcerDurum(k).simdi }; }, [el.macId, el.k]);
    esit(JSON.stringify(mk.s), JSON.stringify(['10', '9', '8']), 'maç seti yazılmadı'); esit(mk.tut, 3, 'maç süresi yazılmadı'); esit(mk.sonraki, 1, 'sıradaki set');
    await p.evaluate(() => hkKapat());
    await p.setViewportSize({ width: 1280, height: 800 });
    await p.evaluate(([mac, k]) => { const m = yzMacBul(yzOku(), mac); yzMacSetGir(mac, m.a === k ? 'a' : 'b', 0); }, [el.macId, el.k]); await p.waitForSelector('#yz-olcum-satir'); await p.evaluate(() => yzGirisKapat());

    // ---- telefonda sporcu penceresi: iki sekme, yana taşma yok, klavye kendiliğinden açılmaz (dokunmatik)
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); yzModAyarla('siralama'); _yz.kurulum = null; const t = yzKurulumTaslak(); t.kayit = false; yzBaslat(); yzSporcuSecici('tur'); }); await p.waitForSelector('.yz-sec-sekme');
    dogrula(await p.locator('.yz-sec-sekme').isVisible(), 'telefonda sekme yok');
    dogrula(await p.locator('.yz-sec-kapat').isVisible(), 'telefonda Kapat yok');
    dogrula(await p.evaluate(() => { const e = document.querySelector('.yz-secici'); return e.scrollWidth <= e.clientWidth + 1; }), 'sporcu penceresi 390 px taşıyor');
    dogrula(await p.locator('#yz-sec-ara').isVisible(), 'Ekle sekmesi açık başlamalı');
    await p.locator('.yz-sec-sekme button', { hasText: 'Turda' }).click();
    dogrula(await p.locator('.yz-sec-sat').first().isVisible() && !(await p.locator('#yz-sec-ara').isVisible()), 'Turda sekmesi');
    await p.locator('.yz-sec-kapat').click();
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(adlar.length + ' sporcu · panel · seri ekle (3 yer) · sporcu penceresi · ölçer: süre, skor, masa ezilmez, eşleşme · 390 px');
  } finally {
    await p.evaluate((y) => { try { try { hkKapat(); } catch (e) { } if (y) { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.olcer) localStorage.setItem('dagsk_atis_olcer', y.olcer); else localStorage.removeItem('dagsk_atis_olcer'); _kmListe = JSON.parse(y.liste); _yz.siradaki = y.siradaki; } } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
