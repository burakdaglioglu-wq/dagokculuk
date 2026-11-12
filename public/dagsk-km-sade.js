/* ================================================================================================
   ✦ KARIŞIK SINIF · SADE EKRANLAR (2026-11-03, v373). Kullanıcı: "hocalarım karışık sınıfı kullanıyor ama karışık geliyor —
   sade, bilgilendirici ikonlu, Nike uygulaması gibi; ağırlıklı Yarışma, Oyun, Form Lab; yeni sınıf ve sporcu oluştur buraya;
   derse sporcu eklemek kolay olsun; sporcu oyun mu yarışma mı kolay seçilsin; yeni yarışma kolay; yoklama düzgün".
   Taslak (V2 satırı): https://claude.ai/artifact/PZK3pvwQfw2dbK696qMaMV
   Ana ekrandan ksAc(ekran) ile açılan tam ekran sayfalar (#ks-ekran):
     yoklama — sayaç, Kalanlar geldi, ✓ / ✕ (tekrar basmak kaldırır), isim yazıp derse ekle, listede yoksa yeni sporcu
     kimne   — iki sütun Yarışma | Oyun, isme dokun öbür tarafa geçsin; hazır bölüşümler
     yarisma — tek ekran yeni yarışma: 36 / 60 / 72 ok, mesafe, kâğıt, süre → Başlat (sporcular Yarışma tarafından)
     yeni    — Yeni sınıf (ad + gruplar → yeni konum, sporcular otomatik) · Yeni sporcu (ad, grup, doğum yılı, bugünkü derse ekle)
     yeniler — v375: yeni özellikler, ne işe yarar, nasıl kullanılır (KS_YENILER; rozet süresi app.js KM_YENI_BITIS)
   YENİ VERİ YOK: otomatikYoklamaDB, _kmListe (_kmListeKaydet), dag_km_hat_<konum> (kmHatKaydet + hat hafızası), karisik_sinif_konumlar,
   Yarışma kurulum taslağı (yzKurulumTaslak → yzBaslat / yzDogrudanBaslat), turnuvaDB (yoneticiKaydet). Renkler styles.css --ks-*.
   ================================================================================================ */
let _ks = { ekran: null, ara: '', poll: null, imza: '', yeniTur: 'sinif', sinifAd: '', sinifGrup: {}, spAd: '', spGrup: null, spYil: '', spCins: null, spDerse: true, yzYukleniyor: false };
const KS_GRUPLAR = ['buyukler', 'yildizlar', 'kucukler', 'minikler'];
const KS_GRUP_AD = { buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' };
const KS_IK = {
    geri: '<path d="M15 6l-6 6 6 6"/>', kapat: '<path d="M6 6l12 12M18 6 6 18"/>', tik: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', carpi: '<path d="M6 6l12 12M18 6 6 18"/>',
    arti: '<path d="M12 5v14M5 12h14"/>', ileri: '<path d="M5 12h14M13 6l6 6-6 6"/>', sag: '<path d="M9 6l6 6-6 6"/>', sol: '<path d="M15 6l-6 6 6 6"/>',
    kupa: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M12 13v4M8 21h8M9 17h6"/>', oyun: '<rect x="3" y="8" width="18" height="9" rx="4.5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="16" cy="11.5" r="1"/>',
    sporcu: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.5 3-5.5 6.5-5.5 1.3 0 2.5.3 3.5.8M18 14v6M15 17h6"/>', cop: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    saat: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>', oynat: '<path d="M7 4l13 8-13 8z"/>', ara: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    grup: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.5 2.5 3.5 5.4"/>'
};
function ksIkon(ad, b, w) { return '<svg width="' + (b || 18) + '" height="' + (b || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2.2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (KS_IK[ad] || '') + '</svg>'; }
function ksE(x) { return encodeURIComponent(x).replace(/'/g, '%27'); }
function ksD(x) { return decodeURIComponent(x); }
function ksKonum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
function ksKonumAd() { let k = (typeof _kmKonumlar !== 'undefined' && _kmKonumlar || []).find(function (x) { return x.id === ksKonum(); }); return k ? k.ad : 'Ana Salon'; }
function ksKatla(x) { return String(x || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
function ksBas(ad) { return String(ad || '').trim().split(/\s+/).map(function (p) { return p[0] || ''; }).slice(0, 2).join('').toLocaleUpperCase('tr-TR'); }
function ksYok(k) { let y = (otomatikYoklamaDB[bugunISO()] || {})[k.ad]; if (!y || y.grup !== k.g) return null; return y.geldi === false ? 'gelmedi' : 'geldi'; }
function ksTur() { try { let o = JSON.parse(localStorage.getItem('dag_km_yarismatur_' + ksKonum()) || 'null'); let d = o && o.durum; return d && (d.asama === 'tur' || d.asama === 'eleme') ? d : null; } catch (e) { return null; } }
function ksTurSporcu(g, ad) { let sp = turnuvaDB[g] && turnuvaDB[g][ad]; return !!sp && (typeof kisiTuru !== 'function' || kisiTuru(g, ad) === 'sporcu'); }
function ksAktifSporcular(g) { let db = turnuvaDB[g] || {}; return Object.keys(db).filter(function (ad) { return !db[ad].pasif && !db[ad].donduruldu && ksTurSporcu(g, ad); }); }

// ---------------------------------------------------------------- kabuk
function ksEkranAc(ekran, arg) {
    ksCss();
    let kap = document.getElementById('ks-ekran');
    if (!kap) {
        kap = document.createElement('div'); kap.id = 'ks-ekran'; kap.className = 'ks-ekran'; kap.setAttribute('role', 'dialog'); kap.setAttribute('aria-modal', 'true');
        document.body.appendChild(kap); document.addEventListener('keydown', ksTus, true);
    }
    kap.style.zIndex = document.getElementById('yz-tv') ? '33600' : '26000';
    _ks.ekran = ekran; _ks.ara = '';
    if (ekran === 'yeni') {
        _ks.yeniTur = arg === 'sporcu' ? 'sporcu' : 'sinif';
        if (arg && typeof arg === 'object') { _ks.yeniTur = arg.tur || 'sporcu'; if (arg.ad) _ks.spAd = arg.ad; }
        if (_ks.yeniTur === 'sinif') { _ks.sinifAd = ''; _ks.sinifGrup = {}; }
        else if (!(arg && arg.ad)) _ks.spAd = '';
        _ks.spDerse = !!(_kmListe || []).length || _ks.spDerse;
    }
    kap.scrollTop = 0;
    ksCiz();
    if (ekran === 'yoklama' && arg === 'ekle') setTimeout(function () { let a = document.getElementById('ks-ara'); if (a) a.focus(); }, 60);
    if (ekran === 'yeni') setTimeout(function () { let a = document.getElementById(_ks.yeniTur === 'sinif' ? 'ks-sinif-ad' : 'ks-sp-ad'); if (a && !a.value) a.focus(); }, 60);
    clearInterval(_ks.poll);
    _ks.poll = setInterval(function () {
        if (!document.getElementById('ks-ekran')) { clearInterval(_ks.poll); return; }
        if (_ks.ekran !== 'yoklama' && _ks.ekran !== 'kimne') return;
        let i = ksImza(); if (i !== _ks.imza && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#ks-ekran input'))) ksCiz();
    }, 3000);
}
function ksKapat() {
    let k = document.getElementById('ks-ekran'); if (k) k.remove();
    clearInterval(_ks.poll); document.removeEventListener('keydown', ksTus, true); _ks.ekran = null;
    ksYan();
}
function ksTus(e) { if (e.key === 'Escape' && document.getElementById('ks-ekran') && getComputedStyle(document.getElementById('onay-modal')).display === 'none') { e.preventDefault(); ksKapat(); } }
function ksYan() { try { kmSinifKartiCiz(); } catch (e) {} try { kmAracIzgaraCiz(); } catch (e) {} }
function ksImza() { return JSON.stringify(_kmListe || []) + '|' + JSON.stringify(otomatikYoklamaDB[bugunISO()] || {}) + '|' + (localStorage.getItem('dag_km_hat_' + ksKonum()) || ''); }
function ksCiz(odakAra) {
    let kap = document.getElementById('ks-ekran'); if (!kap) return;
    _ks.imza = ksImza();
    let html = _ks.ekran === 'yoklama' ? ksYoklamaHTML() : _ks.ekran === 'kimne' ? ksKimNeHTML() : _ks.ekran === 'yarisma' ? ksYarismaHTML() : _ks.ekran === 'yeniler' ? ksYenilerHTML() : ksYeniHTML();
    kap.setAttribute('aria-label', { yoklama: 'Yoklama', kimne: 'Kim ne yapacak', yarisma: 'Yeni yarışma', yeniler: 'Yeni özellikler', yeni: _ks.yeniTur === 'sinif' ? 'Yeni sınıf' : 'Yeni sporcu' }[_ks.ekran] || 'Karışık Sınıf');
    kap.innerHTML = '<div class="ks-sayfa">' + html + '</div>';
    if (odakAra) { let a = document.getElementById('ks-ara'); if (a) { a.focus(); try { a.setSelectionRange(a.value.length, a.value.length); } catch (e) {} } }
}
function ksUst(geriFn, etiket, sagHTML) {
    return '<div class="ks-e-ust"><button type="button" class="ks-yuvarlak" onclick="' + geriFn + '" aria-label="' + (geriFn === 'ksKapat()' ? 'Kapat' : 'Geri') + '">' + ksIkon(geriFn === 'ksKapat()' ? 'kapat' : 'geri', 18) + '</button>'
        + '<span class="ks-etiket">' + esc(etiket) + '</span><span style="flex:1"></span>' + (sagHTML || '') + '</div>';
}

// ---------------------------------------------------------------- yeni özellikler (v375)
const KS_YENILER = [
    {
        id: 'film', ad: 'Okçuluk Filmi', ne: '3 dakikalık tam ekran film: biz kimiz, okçuluk nedir, klasik ve makaralı yay, zor anlar, atış okulu (formdan nişangâha), yarışmalar ve gelecek. Loş başlar, gaza getiren müzikle biter.',
        ikon: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 6l2 4M12 6l2 4M17 6l2 4"/><path d="M10 13l4 2.5-4 2.5z"/>',
        ozellik: [['Seslendirme + altyazı', 'Türkçe ses okur, büyük altyazı çıkar; 🗣️ ile kapatılır.'], ['Müzik', 'Loş açılış, zor anlarda sakin, sonra yükselen final.'], ['Atış okulu', 'Dağınık oklarda form, toplu ama kenarda oklarda nişangâh (oku takip et).'], ['Kulübün fotoğrafları', 'Salon, takım ve yarışma fotoğrafları.']],
        adim: ['Sesi aç, mümkünse TV ekranına yansıt.', '▶ İzle düğmesine bas; çubuğa dokunarak ileri/geri sarabilirsin.', 'Bitince Tekrar izle ya da Kapat.'],
        not: 'Sporcular da kendi ana ekranlarından açabilir. Seslendirme cihazın Türkçe sesine bağlıdır.',
        ac: 'Filmi izle'
    },
    {
        id: 'cokaci', ad: 'Çok Açılı Kamera', ne: 'Dört telefona kadar aynı anda çeker; bilgisayarda önden, yandan, arkadan ve hedef görüntüsü yan yana görünür.',
        ikon: '<rect x="3" y="5" width="8" height="6" rx="1"/><rect x="13" y="5" width="8" height="6" rx="1"/><rect x="3" y="13" width="8" height="6" rx="1"/><rect x="13" y="13" width="8" height="6" rx="1"/>',
        ozellik: [
            ['Dört açı birden', 'Her açıya ayrı telefon bağlanır; bir açıya dokununca büyür.'],
            ['Gecikmeli izleme', '3, 5, 8 ya da 10 sn geriden gösterir: sporcu atar, döner, kendini dört açıdan görür.'],
            ['Tekrar', 'Son 12 saniyeyi dört açıdan aynı anda, istersen yavaş ya da kare kare oynatır.'],
            ['Bir kez kur', "Telefon QR'ı bir kez okutur; sonraki derslerde kamera simgesinden açılınca aynı açıya kendiliğinden bağlanır."]
        ],
        adim: ["Bilgisayarda Çok Açılı Kamera'yı aç.", "Her açıda Telefon bağla'ya bas, o telefonla QR'ı okut.", 'Telefonları sehpaya koy; Canlı ya da gecikme seç.'],
        not: "Telefonlar ve bilgisayar aynı Wi-Fi'de olmalı. Video kaydedilmez. Henüz salonda dört telefonla denenmedi.",
        ac: "Çok Açılı Kamera'yı aç"
    },
    {
        id: 'okhizi', ad: 'Ok Hızı', ne: 'Telefon ipin bırakılma sesini ve okun hedefe çarpma sesini duyar, okun hızını km/s olarak söyler.',
        ikon: '<path d="M3 12h13"/><path d="M13 8l4 4-4 4"/><path d="M3 8h4M3 16h4"/><circle cx="20" cy="12" r="1.6"/>',
        ozellik: [
            ['Ek alet yok', 'Kronograf gerekmez, telefonun mikrofonu yeter.'],
            ['Rekor', 'Her sporcunun mesafe başına en hızlı oku saklanır, sporcu kartında görünür.'],
            ['Videodan ölç', 'Telefonun kamerasıyla çekilmiş atış videosunu seçersen sesinden hızı bulur.'],
            ['Elle düzelt', 'Çarpma yanlış duyulduysa ses dalgasında çarpma anına dokun, hız yeniden hesaplanır.']
        ],
        adim: ['Derse eklenen sporculardan birini ve hedef mesafesini seç.', 'Telefonu atış çizgisine, sporcunun yanına koy, Dinlemeye başla\'ya bas.', 'Sporcu atsın; hız ekrana büyük yazılır. Bitince Bitir\'e bas.'],
        not: 'Salon sessiz olmalı; yan hedeflerden gelen sesler karışabilir. Henüz salonda denenmedi; ilk derslerde sonuçları kontrol et.',
        ac: 'Ok Hızı\'nı aç'
    },
    {
        id: 'atisolcer', ad: 'Atış Ölçer', ne: 'Sporcunun nişanda ne kadar kaldığını ve ne kadar oynadığını telefonun hareket sensörüyle ölçer.',
        ikon: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/><path d="M3 8c1.5 1 1.5 3 0 4M21 8c-1.5 1-1.5 3 0 4"/>',
        ozellik: [
            ['Tutuş süresi', 'Her okta nişanda kaç saniye kaldığını ve sürenin oktan oka ne kadar değiştiğini gösterir.'],
            ['Yarışmaya bağlı', 'Sıralama turu sürerken süreler o seriye yazılır, tablette de görünür. Skor telefondan da girilir, masadan girilmişse üzerine yazılmaz.'],
            ['Uygun süre', 'Puanla eşleşen 18 oktan sonra sporcunun en iyi puan aldığı süreyi bulur.'],
            ['Sesli uyarı', 'Hedef süre aşılınca bip çalar, Android\'de ayrıca titrer.'],
            ['Salınım ve nişan izi', 'Bırakıştan önceki 2 saniyede yayın ne kadar oynadığını gösterir, izi hedefte tekrar oynatır.'],
            ['İndirme sayacı', 'Atmadan yayı indirdiği okları sayar.'],
            ['Gelişim', 'Oturumlar boyunca tutuş, tutarlılık ve salınımın nasıl değiştiğini gösterir.'],
            ['Yanlış bildir', 'Sayım tutmazsa "Yanlış saydı" ya da "Atış kaçtı"ya bas. Ölçüm bu kayıtlarla iyileştirilir.']
        ],
        adim: ['Derse eklenen sporculardan birini seç.', 'Telefonu sporcunun yay koluna sıkıca bağla, Başla\'ya bas.', 'Bitince Bitir\'e bas, okları Skor Gir\'de işaretle.'],
        not: 'Telefon gerekir, bilgisayarda ölçmez. Sonuçlar yalnız bu telefonda kalır. Henüz salonda denenmedi; ilk derslerde sayımı kontrol et.',
        ac: 'Atış Ölçer\'i aç'
    },
    {
        id: 'foto', ad: 'Fotoğrafla puanla', ne: 'Hedefin fotoğrafından okları bulur ve puanları önerir. Artık ilk fotoğrafta da çalışır.',
        ikon: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
        ozellik: [
            ['İlk fotoğrafta ok bulma', 'Önceki fotoğraf olmadan okları bulur, eski delikleri ok saymaz.'],
            ['Emin değilse "?"', 'Çizgideki ya da belirsiz okları kırmızı "?" ile işaretler.'],
            ['Hedef türü seçimi', '6 halka, tam hedef, 3\'lü dikey ve Vegas 3\'lü.'],
            ['Nişangâh önerisi', 'Grup analizinde kayma tutarlıysa hangi yöne alacağını söyler; oklar dağınıksa oynatma der.'],
            ['Bulma başarısı', 'Uygulamanın okların yüzde kaçını doğru bulduğunu gösterir. Düzeltmelerin bulmayı iyileştirmek için saklanır.']
        ],
        adim: ['Skor Gir\'de sporcuya dokun.', '"Fotoğrafla puanla"ya bas, hedef türünü seç, fotoğraf çek.', '"?" olanları kontrol et, kaydet.'],
        not: 'Henüz gerçek hedef fotoğraflarıyla denenmedi. Kaydetmeden önce okları mutlaka kontrol et.',
        ac: 'Skor Gir\'e git'
    }
];
function ksYenilerHTML() {
    return ksUst('ksKapat()', 'Karışık Sınıf') + '<h1 class="ks-e-baslik">Yeni özellikler</h1><p class="ks-e-alt">Ne işe yarar, nasıl kullanılır?</p>'
        + KS_YENILER.map(function (y) {
            return '<section class="ks-yeni-kart" data-yeni="' + y.id + '"><div class="ks-yeni-bas"><span class="ks-yeni-ikon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + y.ikon + '</svg></span><h2>' + esc(y.ad) + '</h2></div>'
                + '<p class="ks-yeni-ne">' + esc(y.ne) + '</p>'
                + '<p class="ks-alan-ad">NELER VAR?</p><dl class="ks-yeni-liste">' + y.ozellik.map(function (o) { return '<div><dt>' + esc(o[0]) + '</dt><dd>' + esc(o[1]) + '</dd></div>'; }).join('') + '</dl>'
                + '<p class="ks-alan-ad">NASIL KULLANILIR?</p><ol class="ks-yeni-adim">' + y.adim.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol>'
                + '<p class="ks-yeni-not">' + esc(y.not) + '</p>'
                + '<button type="button" class="ks-ana-btn" onclick="ksYeniAc(\'' + y.id + '\')">' + esc(y.ac) + ksIkon('ileri', 18, 2.4) + '</button></section>';
        }).join('');
}
function ksYeniAc(id) {
    ksKapat();
    if (id === 'film') { if (typeof dagFilmAcYukle === 'function') dagFilmAcYukle(); return; }
    if (id === 'foto') { kmAracSec('skor'); showToast('Sporcuya dokun, sonra Fotoğrafla puanla', 'info'); }
    else kmAracSec(id);
}

// ---------------------------------------------------------------- 1) yoklama + derse sporcu ekle
function ksYoklamaYaz(gE, aE, durum) {
    let g = ksD(gE), ad = ksD(aE), t = bugunISO(); if (!otomatikYoklamaDB[t]) otomatikYoklamaDB[t] = {};
    let saat = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (durum === 'geldi' || durum === 'gelmedi') otomatikYoklamaDB[t][ad] = { saat: saat, grup: g, elle: true, geldi: durum === 'geldi' };
    else delete otomatikYoklamaDB[t][ad];
    try { otomatikYoklamaKaydet(); } catch (e) {}
    try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    try { yoneticiDevamsizlikWidgetCiz(); } catch (e) {}
    ksCiz();
}
function ksKalanlarGeldi() {
    let t = bugunISO(), n = 0; if (!otomatikYoklamaDB[t]) otomatikYoklamaDB[t] = {};
    let saat = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    (_kmListe || []).forEach(function (k) { if (!ksYok(k)) { otomatikYoklamaDB[t][k.ad] = { saat: saat, grup: k.g, elle: true, geldi: true }; n++; } });
    try { otomatikYoklamaKaydet(); } catch (e) {} try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    showToast(n ? n + ' sporcu "geldi" işaretlendi' : 'İşaretsiz sporcu yok', 'success'); ksCiz();
}
// Derse ekle: listeye girer ve "geldi" işaretlenir (salondaysa eklenir). Yarışma turu sürüyorsa tura eklemek yarışma ekranında.
function ksDerseEkle(gE, aE, sessiz) {
    let g = ksD(gE), ad = ksD(aE); if (!turnuvaDB[g] || !turnuvaDB[g][ad]) return;
    if ((_kmListe || []).some(function (s) { return s.g === g && s.ad === ad; })) { if (!sessiz) showToast(ad + ' zaten derste', 'warning'); return; }
    _kmListe = (_kmListe || []).concat([{ g: g, ad: ad }]);
    try { _kmSecimler[g + '_' + ad] = { g: g, ad: ad }; } catch (e) {}
    try { _kmListeKaydet(); } catch (e) {}
    try { kmHatHafizaUygula(); } catch (e) {}
    let t = bugunISO(); if (!otomatikYoklamaDB[t]) otomatikYoklamaDB[t] = {};
    if (!otomatikYoklamaDB[t][ad] || otomatikYoklamaDB[t][ad].grup !== g) {
        otomatikYoklamaDB[t][ad] = { saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), grup: g, elle: true, geldi: true };
        try { otomatikYoklamaKaydet(); } catch (e) {} try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    }
    _ks.ara = '';
    if (!sessiz) showToast(ad + ' derse eklendi', 'success');
    ksCiz(true);
}
function ksPasifEkle(gE, aE) {
    let g = ksD(gE), ad = ksD(aE), sp = turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
    onayIste('<b>' + esc(ad) + '</b> ' + (sp.pasif ? 'pasif (bıraktı)' : 'dondurulmuş') + ' olarak işaretli.<br>Tekrar aktif edilip derse eklensin mi?', function () {
        sporcuPasifAyarla(g, ad, false); ksDerseEkle(gE, aE);
    }, 'Aktif et ve ekle', 'Vazgeç');
}
function ksDerstenCikar(gE, aE) {
    let g = ksD(gE), ad = ksD(aE);
    onayIste('<b>' + esc(ad) + '</b> bugünkü dersten çıkarılsın mı?<br><small>Skorları ve karnesi silinmez; yalnız ders listesinden çıkar.</small>', function () {
        _kmListe = (_kmListe || []).filter(function (s) { return !(s.g === g && s.ad === ad); });
        try { delete _kmSecimler[g + '_' + ad]; } catch (e) {}
        try { _kmListeKaydet(); } catch (e) {}
        showToast(ad + ' dersten çıkarıldı', 'warning'); ksCiz();
    }, 'Çıkar', 'Vazgeç');
}
function ksAdaylar(q) {
    let liste = _kmListe || [], derste = {}, aktif = [], pasif = [];
    liste.forEach(function (s) { derste[s.g + '|' + s.ad] = 1; });
    KS_GRUPLAR.forEach(function (g) {
        let db = turnuvaDB[g] || {};
        Object.keys(db).forEach(function (ad) {
            if (derste[g + '|' + ad] || ksKatla(ad).indexOf(q) === -1) return;
            (db[ad].pasif || db[ad].donduruldu ? pasif : aktif).push({ g: g, ad: ad, bas: ksKatla(ad).indexOf(q) === 0 });
        });
    });
    let sira = function (a, b) { return (b.bas - a.bas) || a.ad.localeCompare(b.ad, 'tr'); };
    return { aktif: aktif.sort(sira).slice(0, 6), pasif: pasif.sort(sira).slice(0, 3) };
}
function ksVurgula(ad, q) {
    let i = ksKatla(ad).indexOf(q); if (!q || i === -1) return esc(ad);
    return esc(ad.slice(0, i)) + '<mark>' + esc(ad.slice(i, i + q.length)) + '</mark>' + esc(ad.slice(i + q.length));
}
function ksGrupEtiket(g, ad) {
    let tur = typeof kisiTuru === 'function' ? kisiTuru(g, ad) : 'sporcu';
    return (KS_GRUP_AD[g] || g) + (tur === 'egitmen' ? ' · eğitmen' : tur === 'misafir' ? ' · misafir' : '');
}
function ksYoklamaHTML() {
    let liste = (_kmListe || []).filter(function (k) { return turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; });
    let say = { geldi: 0, gelmedi: 0, bos: 0 }, durum = {};
    liste.forEach(function (k) { let y = ksYok(k); durum[k.g + '|' + k.ad] = y; say[y || 'bos']++; });
    let srt = { bos: 0, geldi: 1, gelmedi: 2 };
    liste = liste.slice().sort(function (a, b) { return srt[durum[a.g + '|' + a.ad] || 'bos'] - srt[durum[b.g + '|' + b.ad] || 'bos'] || a.ad.localeCompare(b.ad, 'tr'); });
    let q = ksKatla(_ks.ara.trim());
    let aday = '';
    if (q) {
        let r = ksAdaylar(q);
        aday = '<div class="ks-aday">'
            + r.aktif.map(function (k) {
                return '<div class="ks-sat ks-sat-kucuk"><span class="ks-av">' + esc(ksBas(k.ad)) + '</span><span class="ks-ad"><b>' + ksVurgula(k.ad, q) + '</b><i>' + esc(ksGrupEtiket(k.g, k.ad)) + '</i></span>'
                    + '<button type="button" class="ks-hap-btn vurgu" onclick="ksDerseEkle(\'' + ksE(k.g) + '\',\'' + ksE(k.ad) + '\')">Ekle</button></div>';
            }).join('')
            + r.pasif.map(function (k) {
                return '<div class="ks-sat ks-sat-kucuk soluk"><span class="ks-av">' + esc(ksBas(k.ad)) + '</span><span class="ks-ad"><b>' + ksVurgula(k.ad, q) + '</b><i>' + esc(KS_GRUP_AD[k.g] || k.g) + ' · ' + (turnuvaDB[k.g][k.ad].pasif ? 'pasif' : 'dondurulmuş') + '</i></span>'
                    + '<button type="button" class="ks-hap-btn" onclick="ksPasifEkle(\'' + ksE(k.g) + '\',\'' + ksE(k.ad) + '\')">Aktif et</button></div>';
            }).join('')
            + (!r.aktif.length && !r.pasif.length ? '<div class="ks-aday-bos">Bu isimde kayıtlı sporcu yok.</div>' : '')
            + '<button type="button" class="ks-aday-yeni" onclick="ksEkranAc(\'yeni\',{tur:\'sporcu\',ad:_ks.ara.trim()})">' + ksIkon('sporcu', 20, 2) + '<span>Listede yok mu? <b>Yeni sporcu oluştur</b></span></button>'
            + '</div>';
    }
    let satirlar = liste.map(function (k) {
        let y = durum[k.g + '|' + k.ad], gE = ksE(k.g), aE = ksE(k.ad);
        return '<div class="ks-sat' + (y === 'gelmedi' ? ' gelmedi' : '') + '">'
            + '<span class="ks-av' + (y ? '' : ' bekliyor') + '">' + (y ? esc(ksBas(k.ad)) : '?') + '</span>'
            + '<span class="ks-ad"><b>' + esc(k.ad) + '</b><i>' + esc(ksGrupEtiket(k.g, k.ad)) + (y ? '' : ' · işaretlenmedi') + '</i></span>'
            + '<button type="button" class="ks-yb' + (y === 'geldi' ? ' ok' : '') + '" aria-pressed="' + (y === 'geldi') + '" aria-label="' + esc(k.ad) + ' geldi" onclick="ksYoklamaYaz(\'' + gE + '\',\'' + aE + '\',' + (y === 'geldi' ? 'null' : '\'geldi\'') + ')">' + ksIkon('tik', 20, 2.6) + '</button>'
            + '<button type="button" class="ks-yb' + (y === 'gelmedi' ? ' no' : '') + '" aria-pressed="' + (y === 'gelmedi') + '" aria-label="' + esc(k.ad) + ' gelmedi" onclick="ksYoklamaYaz(\'' + gE + '\',\'' + aE + '\',' + (y === 'gelmedi' ? 'null' : '\'gelmedi\'') + ')">' + ksIkon('carpi', 18, 2.6) + '</button>'
            + '<button type="button" class="ks-cik" aria-label="' + esc(k.ad) + ' dersten çıkar" title="Dersten çıkar" onclick="ksDerstenCikar(\'' + gE + '\',\'' + aE + '\')">' + ksIkon('cop', 16, 2) + '</button>'
            + '</div>';
    }).join('');
    return ksUst('ksKapat()', 'Bugün · ' + ksKonumAd())
        + '<div class="ks-sayac-satir"><div><span class="ks-sayac">' + say.geldi + '<span>/' + liste.length + '</span></span>'
        + '<span class="ks-sayac-alt"><em class="y">' + say.geldi + ' geldi</em> · <em class="k">' + say.gelmedi + ' gelmedi</em> · ' + say.bos + ' işaretsiz</span></div>'
        + (say.bos ? '<button type="button" class="ks-hap-btn acik" onclick="ksKalanlarGeldi()">' + ksIkon('tik', 16, 2.6) + 'Kalanlar geldi</button>' : '') + '</div>'
        + '<label class="ks-ekle-kutu">' + ksIkon('arti', 18, 2.4) + '<input id="ks-ara" type="search" autocomplete="off" placeholder="Derse sporcu ekle — isim yaz" aria-label="Derse sporcu ekle" value="' + esc(_ks.ara) + '" oninput="_ks.ara=this.value; ksCiz(true)"></label>'
        + aday
        + '<div class="ks-bolum"><span>DERSTEKİLER</span><span>GELDİ · GELMEDİ</span></div>'
        + '<div class="ks-liste">' + (satirlar || '<div class="ks-bos">Derste henüz kimse yok. Yukarıya bir isim yaz.</div>') + '</div>'
        + '<div class="ks-alt-bar"><button type="button" class="ks-ana-btn" onclick="ksEkranAc(\'kimne\')">Tamam · Kim ne yapacak?' + ksIkon('ileri', 18, 2.4) + '</button></div>';
}

// ---------------------------------------------------------------- 2) kim yarışma, kim oyun
function ksHatYaz(kE, hat) {
    let k = ksD(kE), h = kmHatlar(); h[k] = hat === 'yarisma' ? 'yarisma' : 'oyun';
    kmHatKaydet(h); try { kmHatHafizaKaydet([k], h); } catch (e) {}
    ksCiz();
}
function ksHatToplu(tur) {
    if (tur === 'yarisma') {
        let h = {}; (_kmListe || []).forEach(function (s) { h[s.g + '|' + s.ad] = 'yarisma'; });
        kmHatKaydet(h); try { kmHatHafizaKaydet(Object.keys(h), h); } catch (e) {}
    } else kmHatToplu(tur);
    ksCiz();
}
function ksKimNeHTML() {
    let liste = (_kmListe || []).filter(function (k) { return turnuvaDB[k.g] && turnuvaDB[k.g][k.ad] && ksYok(k) !== 'gelmedi'; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
    let gelmedi = (_kmListe || []).filter(function (k) { return ksYok(k) === 'gelmedi'; }).length;
    let h = kmHatlar(), yar = [], oy = [];
    liste.forEach(function (k) { (h[k.g + '|' + k.ad] === 'yarisma' ? yar : oy).push(k); });
    let tur = ksTur(), turK = tur ? (tur.katilimci || []) : [];
    let kisi = function (k, hedef) {
        let yas = typeof kmSporcuYasi === 'function' ? kmSporcuYasi(k.g, k.ad) : null, turDisi = tur && hedef === 'oyun' && turK.indexOf(k.g + '|' + k.ad) === -1;
        return '<button type="button" class="ks-kisi" onclick="ksHatYaz(\'' + ksE(k.g + '|' + k.ad) + '\',\'' + hedef + '\')" aria-label="' + esc(k.ad) + ': ' + (hedef === 'oyun' ? 'oyuna geçir' : 'yarışmaya geçir') + '">'
            + (hedef === 'yarisma' ? ksIkon('sol', 14, 2.4) : '') + '<span><b>' + esc(k.ad) + '</b>' + (yas != null || turDisi ? '<i>' + (yas != null ? yas + ' yaş' : '') + (turDisi ? (yas != null ? ' · ' : '') + 'turda değil' : '') + '</i>' : '') + '</span>'
            + (hedef === 'oyun' ? ksIkon('sag', 14, 2.4) : '') + '</button>';
    };
    return ksUst('ksKapat()', liste.length + ' sporcu' + (gelmedi ? ' · ' + gelmedi + ' gelmedi' : ''))
        + '<h1 class="ks-e-baslik">Kim ne<br>yapacak?</h1><p class="ks-e-alt">İsme dokun, öbür tarafa geçsin. Yarışmadakiler oyunlarda görünmez.</p>'
        + '<div class="ks-hazir"><button type="button" class="ks-hap-btn" onclick="ksHatToplu(\'yas\')">12 yaş ve üstü yarışma</button><button type="button" class="ks-hap-btn" onclick="ksHatToplu(\'hepsi\')">Hepsi oyun</button><button type="button" class="ks-hap-btn" onclick="ksHatToplu(\'yarisma\')">Hepsi yarışma</button></div>'
        + '<div class="ks-sutunlar">'
        + '<section class="ks-sutun y" aria-label="Yarışma"><div class="ks-sutun-bas">' + ksIkon('kupa', 22) + '<b>Yarışma</b><span>' + yar.length + '</span></div><div class="ks-sutun-liste">' + (yar.map(function (k) { return kisi(k, 'oyun'); }).join('') || '<div class="ks-sutun-bos">Kimse yok</div>') + '</div></section>'
        + '<section class="ks-sutun" aria-label="Oyun"><div class="ks-sutun-bas">' + ksIkon('oyun', 22) + '<b>Oyun</b><span>' + oy.length + '</span></div><div class="ks-sutun-liste">' + (oy.map(function (k) { return kisi(k, 'yarisma'); }).join('') || '<div class="ks-sutun-bos">Kimse yok</div>') + '</div></section>'
        + '</div>'
        + (tur ? '<p class="ks-e-alt">Yarışma turu sürüyor — tura sonradan katılacakları Yarışma ekranındaki listeden ekle.</p>' : '')
        + '<div class="ks-alt-bar iki"><button type="button" class="ks-ana-btn" onclick="' + (tur ? 'ksKapat(); kmAracSec(\'yarisma\')' : 'ksEkranAc(\'yarisma\')') + '">' + (tur ? 'Yarışmaya dön' : 'Yarışmayı kur') + '</button>'
        + '<button type="button" class="ks-ana-btn acik" onclick="ksKapat(); kmAracSec(\'oyunlar\')">Oyun seç</button></div>';
}

// ---------------------------------------------------------------- 3) yeni yarışma (tek ekran)
const KS_YZ_HAZIR = [{ k: 'yarim', ok: '36 ok', alt: '6 seri × 6' }, { k: 'salon', ok: '60 ok', alt: 'Salon · 20 × 3' }, { k: 'tam', ok: '72 ok', alt: '12 seri × 6' }];
const KS_YZ_YUZ_KISA = { '6': '6 halka', '10': '10 halka · 122', '10k': '10 halka · 80', '3lu': "3'lü dikey" };
function ksYzHazirMi() { return typeof yzKurulumTaslak === 'function' && typeof yzBaslat === 'function'; }
function ksYzTaslak() {
    let t = yzKurulumTaslak();
    // Gelmedi işaretlenen sporcu yarışmaya alınmaz (taslak her açılışta derse göre tazelenir).
    t.katilimci = t.katilimci.filter(function (k) { let i = k.indexOf('|'); return ksYok({ g: k.slice(0, i), ad: k.slice(i + 1) }) !== 'gelmedi'; });
    return t;
}
function ksYzAyar(a, v) {
    let t = yzKurulumTaslak();
    if (a === 'format') { t.format = v; t.sure = yzVarsayilanSure(v); }
    else t[a] = v;
    ksCiz();
}
function ksYarismaHTML() {
    if (!ksYzHazirMi()) {
        if (!_ks.yzYukleniyor) {
            _ks.yzYukleniyor = true;
            dagskEkYukle('dagsk-km-yarisma-pro.js').then(function () { _ks.yzYukleniyor = false; if (_ks.ekran === 'yarisma') ksCiz(); })
                .catch(function () { _ks.yzYukleniyor = false; showToast('Yarışma yüklenemedi — internet?', 'error'); });
        }
        return ksUst('ksKapat()', 'Yarışma') + '<div class="ks-bos">Yükleniyor…</div>';
    }
    let tur = ksTur();
    if (tur) return ksUst('ksKapat()', 'Yarışma')
        + '<h1 class="ks-e-baslik">Tur<br>sürüyor</h1><p class="ks-e-alt">' + (tur.katilimci || []).length + ' sporcu · ' + esc((tur.ayar && tur.ayar.mesafe) || '') + '. Yeni yarışma için önce bu turu bitir.</p>'
        + '<div class="ks-alt-bar"><button type="button" class="ks-ana-btn" onclick="ksKapat(); kmAracSec(\'yarisma\')">' + ksIkon('oynat', 16) + 'Tura dön</button></div>';
    let t = ksYzTaslak(), dogrudan = t.tur === 'eleme', f = yzFormatBul(t.format), sure = t.sure || yzVarsayilanSure(t.format);
    let cip = function (ad, aktif, fn, cls) { return '<button type="button" class="ks-cip' + (aktif ? ' on' : '') + (cls ? ' ' + cls : '') + '" aria-pressed="' + !!aktif + '" onclick="' + fn + '">' + ad + '</button>'; };
    let adlar = t.katilimci.map(function (k) { return k.slice(k.indexOf('|') + 1); });
    let avatar = adlar.slice(0, 4).map(function (ad) { return '<span class="ks-av mini">' + esc(ksBas(ad)) + '</span>'; }).join('');
    let karma = typeof kmKarmaMi === 'function' && kmKarmaMi();
    return ksUst('ksKapat()', 'Yarışma · ' + t.katilimci.length + ' sporcu')
        + '<h1 class="ks-e-baslik">Yeni<br>yarışma</h1>'
        + '<div class="ks-segment" role="group" aria-label="Yarışma türü">' + cip('Sıralama turu', !dogrudan, 'ksYzAyar(\'tur\',\'siralama\')') + cip('Doğrudan eleme', dogrudan, 'ksYzAyar(\'tur\',\'eleme\')') + '</div>'
        + (dogrudan ? '<p class="ks-e-alt">Eşleştirmeli eleme tablosu · set sistemi (World Archery). Tablo boyu ve kura ayarı “Tüm ayarlar”da.</p>'
            : '<p class="ks-alan-ad">HAZIR</p><div class="ks-hazir-format">' + KS_YZ_HAZIR.map(function (h) {
                return '<button type="button" class="ks-format' + (t.format === h.k ? ' on' : '') + '" aria-pressed="' + (t.format === h.k) + '" onclick="ksYzAyar(\'format\',\'' + h.k + '\')"><b>' + h.ok + '</b><span>' + h.alt + '</span></button>';
            }).join('') + '</div>'
            + (KS_YZ_HAZIR.some(function (h) { return h.k === t.format; }) ? '' : '<p class="ks-e-alt">Seçili: ' + esc(f.ad) + '</p>'))
        + '<p class="ks-alan-ad">MESAFE</p><div class="ks-cipler">' + ['18m', '20m', '30m', '50m', '60m', '70m'].map(function (m) { return cip(m.replace('m', ' m'), t.mesafe === m, 'ksYzAyar(\'mesafe\',\'' + m + '\')'); }).join('') + '</div>'
        + '<p class="ks-alan-ad">HEDEF KÂĞIDI</p><div class="ks-cipler">' + Object.keys(YZ_YUZ).map(function (y) { return cip(KS_YZ_YUZ_KISA[y] || YZ_YUZ[y].ad, (t.yuz || '6') === y, 'ksYzAyar(\'yuz\',\'' + y + '\')'); }).join('') + '</div>'
        + (dogrudan ? '' : '<p class="ks-alan-ad">SERİ SÜRESİ</p><div class="ks-cipler">' + YZ_SURELER.map(function (s) { return cip(s >= 120 && s % 60 === 0 ? (s / 60) + ' dk' : s + ' sn', sure === s, 'ksYzAyar(\'sure\',' + s + ')'); }).join('') + '</div>')
        + '<div class="ks-ozet-kart"><span class="ks-av-grup">' + (avatar || ksIkon('grup', 20)) + '</span><span class="ks-ozet-yazi"><b>' + t.katilimci.length + ' sporcu</b><i>' + (karma ? 'yarışma tarafı' : 'derstekilerin hepsi') + '</i></span>'
        + '<button type="button" class="ks-link" onclick="ksEkranAc(\'kimne\')">Düzenle</button></div>'
        + '<div class="ks-link-satir"><button type="button" class="ks-link" onclick="ksTumAyarlar()">Tüm ayarlar</button><button type="button" class="ks-link" onclick="ksDigerTurler()">Takım yarışması · diğer türler</button></div>'
        + '<div class="ks-alt-bar"><button type="button" class="ks-ana-btn buyuk"' + (t.katilimci.length >= (dogrudan ? 2 : 1) ? '' : ' disabled') + ' onclick="ksYarismaBaslat()">' + ksIkon('oynat', 18) + (dogrudan ? 'Elemeyi başlat' : 'Yarışmayı başlat') + '</button>'
        + '<span class="ks-alt-not">' + (t.katilimci.length >= (dogrudan ? 2 : 1) ? 'Başlayınca TV ekranı da hazır olur' : (dogrudan ? 'Eleme için en az 2 sporcu gerekir' : 'Önce yarışmaya sporcu ekle')) + '</span></div>';
}
function ksTumAyarlar() { ksYzTaslak(); try { yzModAyarla('siralama'); } catch (e) {} ksKapat(); kmAracSec('yarisma'); }
function ksDigerTurler() { try { yzModAyarla('secim'); _yz.secimAcik = true; } catch (e) {} ksKapat(); kmAracSec('yarisma'); }
function ksYarismaBaslat() {
    if (!ksYzHazirMi()) return;
    let t = ksYzTaslak(), dogrudan = t.tur === 'eleme';
    if (!t.sure) t.sure = yzVarsayilanSure(t.format);
    try { yzModAyarla('siralama'); } catch (e) {}
    ksKapat();
    kmAracSec('yarisma');
    // kmSekme('yarisma') modülü (zaten yüklü) bir sonraki adımda açar; kurulum ekranı çizilince başlat.
    let n = 0, dene = function () {
        if (typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme === 'yarisma' && document.querySelector('#km-icerik .yz')) { if (dogrudan) yzDogrudanBaslat(); else yzBaslat(); return; }
        if (++n < 40) setTimeout(dene, 50);
    };
    setTimeout(dene, 30);
}

// ---------------------------------------------------------------- 4) yeni sınıf / yeni sporcu
function ksYeniTur(t) { _ks.yeniTur = t; ksCiz(); setTimeout(function () { let a = document.getElementById(t === 'sinif' ? 'ks-sinif-ad' : 'ks-sp-ad'); if (a && !a.value) a.focus(); }, 30); }
function ksSinifGrup(g) { _ks.sinifGrup[g] = !_ks.sinifGrup[g]; ksCiz(); }
function ksSinifSecilen() {
    let l = []; KS_GRUPLAR.forEach(function (g) { if (_ks.sinifGrup[g]) ksAktifSporcular(g).sort(function (a, b) { return a.localeCompare(b, 'tr'); }).forEach(function (ad) { l.push({ g: g, ad: ad }); }); });
    return l;
}
function ksVarsayilanSinifAd() { let d = new Date(); return GUN_ADI_TR[d.getDay()] + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
function ksSinifAc() {
    let inp = document.getElementById('ks-sinif-ad'), ad = ((inp && inp.value) || '').trim() || ksVarsayilanSinifAd();
    let secilen = ksSinifSecilen();
    let b = document.getElementById('ks-sinif-btn'); if (b) { b.disabled = true; b.textContent = 'Açılıyor…'; }
    _kmKonumlariGetir().then(function (konumlar) {
        if (konumlar.some(function (k) { return ksKatla(k.ad) === ksKatla(ad); })) {
            if (b) { b.disabled = false; b.textContent = 'Sınıfı aç'; }
            return showToast('"' + ad + '" adında bir sınıf zaten var — başka bir ad yaz ya da “Değiştir”den o sınıfa gir.', 'warning');
        }
        let id = 'k' + Date.now();
        _kmKonumlar = konumlar.concat([{ id: id, ad: ad }]);
        _kmKonumlariKaydet(_kmKonumlar);
        // Yeni konumun ders listesi önce yerelde hazırlanır — kmKonumaBaglan → kmAcYerel onu bulup platformu açar
        // (liste boşsa eski sporcu seçme penceresi açılır). Sunucuya _kmListeKaydet yazar.
        try { localStorage.setItem('dag_km_liste_' + id, JSON.stringify(secilen)); } catch (e) {}
        _kmYerelZamanYaz(id);
        ksKapat();
        try { if (typeof _yz !== 'undefined' && _yz) _yz.kurulum = null; } catch (e) {}
        _kmBaslangicZamani = Date.now();
        kmKonumaBaglan(id);
        if (secilen.length) {
            _kmListe = secilen; _kmSecimler = {}; secilen.forEach(function (s) { _kmSecimler[s.g + '_' + s.ad] = s; });
            try { _kmListeKaydet(); } catch (e) {}
            ksYan();
            showToast('“' + ad + '” açıldı · ' + secilen.length + ' sporcu', 'success');
            setTimeout(function () { ksEkranAc('yoklama'); }, 80);
        } else showToast('“' + ad + '” açıldı — sporcuları seç', 'success');
    });
}
function ksSporcuKaydet() {
    let ad = ((document.getElementById('ks-sp-ad') || {}).value || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
    let yil = ((document.getElementById('ks-sp-yil') || {}).value || '').trim();
    let g = _ks.spGrup;
    if (!ad) return showToast('Ad soyad yaz.', 'error');
    if (!g) return showToast('Grubunu seç.', 'error');
    if (!_ks.spCins) return showToast('Kız mı erkek mi, seç.', 'error');
    let y = parseInt(yil, 10), buYil = new Date().getFullYear();
    if (yil && !(y >= 1930 && y <= buYil)) return showToast('Doğum yılını kontrol et (örn. 2015).', 'error');
    if (turnuvaDB[g] && turnuvaDB[g][ad]) {
        return onayIste('<b>' + esc(ad) + '</b> zaten ' + esc(KS_GRUP_AD[g]) + ' grubunda kayıtlı.' + (_ks.spDerse ? '<br>Bugünkü derse eklensin mi?' : ''), _ks.spDerse ? function () { ksKapat(); ksDerseEkle(ksE(g), ksE(ad)); } : null, _ks.spDerse ? 'Derse ekle' : 'Tamam', 'Vazgeç');
    }
    let norm = turkceNormalize(ad), cakisan = null;
    KS_GRUPLAR.forEach(function (gg) { if (cakisan) return; Object.keys(turnuvaDB[gg] || {}).forEach(function (m) { if (!cakisan && turkceNormalize(m) === norm) cakisan = { g: gg, ad: m }; }); });
    _ks.bekleyen = { g: g, ad: ad, yil: yil ? y : null, mevcut: cakisan };
    if (cakisan) {
        // İki seçenekli onay: onayIste tek geri çağırım alır — Aidat'taki "Yeni Sporcu Ekle" gibi düğmeler mesajın içinde.
        onayIste('<b>' + esc(cakisan.ad) + '</b> zaten <b>' + esc(KS_GRUP_AD[cakisan.g] || cakisan.g) + '</b> grubunda kayıtlı. Aynı kişi mi?<br><small>Aynı kişiyse yeni kayıt açma — skor geçmişi ikiye bölünür.</small>'
            + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
            + '<button type="button" onclick="onayKapat(); ksBekleyenSec(\'ayni\')" style="min-height:44px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-weight:800;cursor:pointer">Aynı kişi' + (_ks.spDerse ? ' — derse ekle' : '') + '</button>'
            + '<button type="button" onclick="onayKapat(); ksBekleyenSec(\'yeni\')" style="min-height:44px;border-radius:10px;border:1px solid var(--neon-red);background:transparent;color:var(--neon-red);font-weight:800;cursor:pointer">Farklı kişi — yeni kayıt</button></div>', null, null);
        setTimeout(function () { let b = document.getElementById('onay-evet-btn'); if (b) b.style.display = 'none'; }, 50);
        return;
    }
    ksBekleyenSec('yeni');
}
function ksBekleyenSec(ne) {
    let b = _ks.bekleyen; _ks.bekleyen = null; if (!b) return;
    if (ne === 'yeni') return ksSporcuOlustur(b.g, b.ad, b.yil);
    ksKapat();
    if (_ks.spDerse) { ksDerseEkle(ksE(b.mevcut.g), ksE(b.mevcut.ad)); ksEkranAc('yoklama'); }
    else showToast(b.mevcut.ad + ' zaten kayıtlı', 'info');
}
// Kullanıcılar / Aidat'taki "Yeni Sporcu Ekle" ile aynı kayıt yolu (silinenlerden geri alma + yoneticiKaydet ile anında bulut).
function ksSporcuOlustur(g, ad, yil) {
    if (!turnuvaDB[g]) turnuvaDB[g] = {};
    if (turnuvaDB[g][ad]) return showToast(ad + ' zaten kayıtlı', 'warning');
    try {
        let silinmisti = silinenlerDB.some(function (x) { return !x.tasindi && x.grup === g && x.ad === ad; });
        if (silinmisti) _sporcuSunucudaGeriAl(g, ad).then(function () { try { bulutaGonderKontrol(); } catch (e) {} }).catch(function () {});
        silinenlerDB = silinenlerDB.filter(function (s) { return !(s.grup === g && s.ad === ad); }); silinenlerKaydet();
    } catch (e) {}
    turnuvaDB[g][ad] = { toplamSkor: 0, xAdet: 0, dogumYili: yil || null, cinsiyet: _ks.spCins, yay: 'Klasik', seriler: [], detayliOklar: [], lastModified: Date.now(),
        dogumTarihi: null, acilKisi: null, acilTelefon: null, katilmaTarihi: bugunISO(), aileMeslek: null, antrenmanNotu: null, genelNot: null };
    yoneticiKaydet();
    try { sporcuListesiniYenile(); siralamaListesiDoldur(); } catch (e) {}
    let derse = _ks.spDerse && typeof _kmListe !== 'undefined';
    _ks.spAd = ''; _ks.spYil = ''; _ks.spCins = null;
    if (derse) { ksKapat(); ksDerseEkle(ksE(g), ksE(ad), true); showToast(ad + ' kaydedildi ve derse eklendi', 'success'); ksEkranAc('yoklama'); }
    else { showToast(ad + ' → ' + KS_GRUP_AD[g] + ' kaydedildi', 'success'); ksCiz(); }
}
function ksYeniHTML() {
    let sinif = _ks.yeniTur === 'sinif';
    let ust = ksUst('ksKapat()', sinif ? 'Yeni sınıf' : 'Yeni sporcu',
        '<div class="ks-segment kucuk" role="tablist" aria-label="Ne oluşturulacak"><button type="button" role="tab" aria-selected="' + sinif + '" class="ks-cip' + (sinif ? ' on' : '') + '" onclick="ksYeniTur(\'sinif\')">Sınıf</button>'
        + '<button type="button" role="tab" aria-selected="' + !sinif + '" class="ks-cip' + (sinif ? '' : ' on') + '" onclick="ksYeniTur(\'sporcu\')">Sporcu</button></div>');
    if (sinif) {
        let secilen = ksSinifSecilen();
        return ust + '<h1 class="ks-e-baslik">Yeni sınıf</h1><p class="ks-e-alt">Grupları seç, sporcular kendiliğinden gelsin. Sonra yoklamaya geçersin.</p>'
            + '<label class="ks-alan-ad" for="ks-sinif-ad">SINIFIN ADI</label><input id="ks-sinif-ad" class="ks-girdi" value="' + esc(_ks.sinifAd) + '" placeholder="' + esc(ksVarsayilanSinifAd()) + '" oninput="_ks.sinifAd=this.value" autocomplete="off">'
            + '<p class="ks-alan-ad">HANGİ GRUPLAR?</p><div class="ks-grup-izgara">' + KS_GRUPLAR.map(function (g) {
                let on = !!_ks.sinifGrup[g], n = ksAktifSporcular(g).length;
                return '<button type="button" class="ks-grup' + (on ? ' on' : '') + '" aria-pressed="' + on + '" onclick="ksSinifGrup(\'' + g + '\')"><span class="ks-kutu">' + (on ? ksIkon('tik', 16, 2.8) : '') + '</span><span><b>' + KS_GRUP_AD[g] + '</b><i>' + n + ' sporcu</i></span></button>';
            }).join('') + '</div>'
            + '<div class="ks-ozet-kart">' + ksIkon('grup', 20) + '<span class="ks-ozet-yazi"><b>' + (secilen.length ? secilen.length + ' sporcu derse eklenecek' : 'Grup seçmezsen sporcuları tek tek seçersin') + '</b><i>Sınıf, “Değiştir” listesinde de görünür</i></span></div>'
            + '<div class="ks-alt-bar"><button type="button" id="ks-sinif-btn" class="ks-ana-btn buyuk" onclick="ksSinifAc()">Sınıfı aç' + ksIkon('ileri', 18, 2.4) + '</button></div>';
    }
    if (!_ks.spGrup) { let say = {}; (_kmListe || []).forEach(function (s) { say[s.g] = (say[s.g] || 0) + 1; }); _ks.spGrup = Object.keys(say).sort(function (a, b) { return say[b] - say[a]; })[0] || (typeof aktifGrup !== 'undefined' && KS_GRUPLAR.indexOf(aktifGrup) !== -1 ? aktifGrup : 'kucukler'); }
    let derste = typeof _kmListe !== 'undefined' && (_kmListe || []).length >= 0;
    return ust + '<h1 class="ks-e-baslik">Yeni sporcu</h1><p class="ks-e-alt">Kulübe kalıcı kayıt açılır. Diğer bilgileri sonra Kullanıcılar’dan doldurabilirsin.</p>'
        + '<label class="ks-alan-ad" for="ks-sp-ad">AD SOYAD</label><input id="ks-sp-ad" class="ks-girdi" value="' + esc(_ks.spAd) + '" oninput="_ks.spAd=this.value" autocomplete="off" autocapitalize="characters" placeholder="Örn. ELİF YILMAZ">'
        + '<p class="ks-alan-ad">GRUBU</p><div class="ks-cipler">' + KS_GRUPLAR.map(function (g) { return '<button type="button" class="ks-cip' + (_ks.spGrup === g ? ' on' : '') + '" aria-pressed="' + (_ks.spGrup === g) + '" onclick="_ks.spGrup=\'' + g + '\'; ksCiz()">' + KS_GRUP_AD[g] + '</button>'; }).join('') + '</div>'
        + '<div class="ks-iki-alan"><div><p class="ks-alan-ad">CİNSİYET</p><div class="ks-cipler"><button type="button" class="ks-cip' + (_ks.spCins === 'K' ? ' on' : '') + '" aria-pressed="' + (_ks.spCins === 'K') + '" onclick="_ks.spCins=\'K\'; ksCiz()">Kız</button><button type="button" class="ks-cip' + (_ks.spCins === 'E' ? ' on' : '') + '" aria-pressed="' + (_ks.spCins === 'E') + '" onclick="_ks.spCins=\'E\'; ksCiz()">Erkek</button></div></div>'
        + '<div><label class="ks-alan-ad" for="ks-sp-yil">DOĞUM YILI</label><input id="ks-sp-yil" class="ks-girdi" inputmode="numeric" maxlength="4" value="' + esc(_ks.spYil) + '" oninput="_ks.spYil=this.value" placeholder="İsteğe bağlı"></div></div>'
        + (derste ? '<label class="ks-onay"><input type="checkbox"' + (_ks.spDerse ? ' checked' : '') + ' onchange="_ks.spDerse=this.checked"><span class="ks-kutu">' + ksIkon('tik', 16, 2.8) + '</span>Bugünkü derse de ekle (geldi)</label>' : '')
        + '<div class="ks-alt-bar"><button type="button" class="ks-ana-btn buyuk" onclick="ksSporcuKaydet()">Sporcuyu kaydet</button></div>';
}

// ---------------------------------------------------------------- stil
function ksCss() {
    if (document.getElementById('ks-css')) return;
    let st = document.createElement('style'); st.id = 'ks-css';
    st.textContent = ''
        + '.ks-ekran{position:fixed;inset:0;z-index:26000;background:var(--ks-zemin);color:var(--ks-yazi);overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:inherit}'
        + '.ks-sayfa{width:min(620px,100%);margin:0 auto;box-sizing:border-box;padding:16px 16px 132px;display:flex;flex-direction:column;gap:12px}'
        + '.ks-e-ust{display:flex;align-items:center;gap:10px;min-height:44px}'
        + '.ks-yuvarlak{width:44px;height:44px;border-radius:22px;border:0;background:var(--ks-kart);color:var(--ks-yazi);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}'
        + '.ks-e-baslik{margin:4px 0 0;font-family:var(--ks-baslik-font);font-weight:800;font-size:44px;line-height:.92;text-transform:uppercase;color:var(--ks-yazi)}'
        + '.ks-e-alt{margin:0;font-size:13.5px;line-height:1.45;color:var(--ks-soluk)}'
        + '.ks-yeni-kart{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:20px;background:var(--ks-kart);border:1px solid var(--ks-cizgi);color:var(--ks-yazi)}'
        + '.ks-yeni-bas{display:flex;align-items:center;gap:12px}.ks-yeni-ikon{width:44px;height:44px;flex-shrink:0;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;background:var(--ks-kart2);color:var(--ks-vurgu2)}'
        + '.ks-yeni-kart h2{margin:0;font-family:var(--ks-baslik-font);font-weight:800;font-size:30px;line-height:1;text-transform:uppercase;color:var(--ks-yazi)}'
        + '.ks-yeni-ne{margin:0;font-size:15px;line-height:1.45}.ks-yeni-liste{margin:0;display:flex;flex-direction:column;gap:9px}.ks-yeni-liste dt{font-size:14px;font-weight:800}.ks-yeni-liste dd{margin:1px 0 0;font-size:13.5px;line-height:1.4;color:var(--ks-soluk)}'
        + '.ks-yeni-adim{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:5px;font-size:14px;line-height:1.4}.ks-yeni-not{margin:2px 0;padding:10px 12px;border-radius:12px;background:var(--ks-kart2);font-size:13px;line-height:1.4;color:var(--ks-soluk)}'
        + '.ks-sayac-satir{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}'
        + '.ks-sayac{display:block;font-family:var(--ks-baslik-font);font-weight:800;font-size:64px;line-height:.85;font-variant-numeric:tabular-nums}.ks-sayac span{color:var(--ks-soluk);opacity:.6}'
        + '.ks-sayac-alt{display:block;margin-top:6px;font-size:13px;font-weight:600;color:var(--ks-soluk)}.ks-sayac-alt em{font-style:normal}.ks-sayac-alt em.y{color:var(--ks-yesil)}.ks-sayac-alt em.k{color:var(--ks-kirmizi)}'
        + '.ks-hap-btn{min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;white-space:nowrap}'
        + '.ks-hap-btn.acik{background:var(--ks-acik);color:var(--ks-acik-yazi);border-color:var(--ks-acik)}.ks-hap-btn.vurgu{background:var(--ks-vurgu);color:var(--ks-vurgu-yazi);border-color:var(--ks-vurgu);min-height:40px}'
        + '.ks-ekle-kutu{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 14px;border-radius:14px;background:var(--ks-kart);border:1.5px solid var(--ks-vurgu);color:var(--ks-vurgu2)}'
        + '.ks-ekle-kutu input{flex:1;min-width:0;min-height:48px;border:0;outline:0;background:transparent;color:var(--ks-yazi);font:inherit;font-size:16px;padding:0}'
        + '#ks-ekran .ks-ekle-kutu input:focus{border:0;outline:0;box-shadow:none;background:transparent}'
        + '.ks-aday{border-radius:14px;background:var(--ks-kart);border:1px solid var(--ks-cizgi);padding:4px 12px;margin-top:-4px}'
        + '.ks-aday mark{background:transparent;color:var(--ks-vurgu2);font-weight:800}.ks-aday-bos{padding:12px 0;font-size:13px;color:var(--ks-soluk)}'
        + '.ks-aday-yeni{width:100%;min-height:50px;border:0;background:transparent;color:var(--ks-yazi);font:inherit;font-size:14px;display:flex;align-items:center;gap:10px;cursor:pointer;padding:0;text-align:left}.ks-aday-yeni svg{color:var(--ks-vurgu2);flex-shrink:0}.ks-aday-yeni b{color:var(--ks-vurgu2)}'
        + '.ks-bolum{display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--ks-soluk);margin-top:6px}'
        + '.ks-liste{display:flex;flex-direction:column}'
        + '.ks-sat{min-height:62px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--ks-cizgi)}.ks-liste .ks-sat:last-child{border-bottom:0}'
        + '.ks-sat-kucuk{min-height:54px}.ks-aday .ks-sat:last-of-type{border-bottom:1px solid var(--ks-cizgi)}.ks-sat.soluk{opacity:.75}'
        + '.ks-av{width:38px;height:38px;border-radius:19px;background:var(--ks-kart2);display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;color:var(--ks-yazi)}'
        + '.ks-av.bekliyor{background:color-mix(in srgb,var(--ks-vurgu2) 20%,transparent);color:var(--ks-vurgu2)}.ks-av.mini{width:30px;height:30px;font-size:10.5px;border:2px solid var(--ks-kart);margin-left:-8px}.ks-av.mini:first-child{margin-left:0}'
        + '.ks-ad{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.ks-ad b{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ks-ad i{font-style:normal;font-size:11.5px;color:var(--ks-soluk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.ks-sat.gelmedi .ks-ad b{text-decoration:line-through;color:var(--ks-soluk)}'
        + '.ks-yb{width:50px;height:44px;border-radius:12px;border:1px solid var(--ks-cizgi);background:transparent;color:var(--ks-soluk);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}'
        + '.ks-yb.ok{background:var(--ks-yesil);border-color:var(--ks-yesil);color:#0A0A0A}body.light-theme .ks-yb.ok{color:#fff}'
        + '.ks-yb.no{background:color-mix(in srgb,var(--ks-kirmizi) 18%,transparent);border-color:var(--ks-kirmizi);color:var(--ks-kirmizi)}'
        + '.ks-cik{width:36px;height:44px;border:0;background:transparent;color:var(--ks-soluk);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;border-radius:10px;opacity:.75}'
        + '.ks-bos{padding:24px 8px;text-align:center;color:var(--ks-soluk);font-size:14px}'
        + '.ks-alt-bar{position:fixed;left:0;right:0;bottom:0;z-index:2;padding:12px 16px calc(16px + env(safe-area-inset-bottom));background:var(--ks-zemin);border-top:1px solid var(--ks-cizgi);display:flex;flex-direction:column;align-items:center;gap:6px}'
        + '.ks-alt-bar > *{width:min(588px,100%)}.ks-alt-bar.iki{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding-left:max(16px,calc(50% - 294px));padding-right:max(16px,calc(50% - 294px))}.ks-alt-bar.iki > *{width:auto}'
        + '.ks-ana-btn{min-height:54px;border-radius:27px;border:0;background:var(--ks-vurgu);color:var(--ks-vurgu-yazi);font:inherit;font-size:15px;font-weight:800;letter-spacing:.02em;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;padding:0 16px;text-transform:uppercase}'
        + '.ks-ana-btn.buyuk{min-height:58px;font-size:16px}.ks-ana-btn.acik{background:var(--ks-acik);color:var(--ks-acik-yazi)}.ks-ana-btn:disabled{opacity:.45;cursor:default}'
        + '.ks-alt-not{font-size:12px;color:var(--ks-soluk);text-align:center}'
        + '.ks-hazir{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}.ks-hazir::-webkit-scrollbar{display:none}.ks-hazir .ks-hap-btn{min-height:40px;font-size:12.5px}'
        + '.ks-sutunlar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start}'
        + '.ks-sutun{border-radius:20px;background:var(--ks-kart);border:1px solid var(--ks-cizgi);padding-bottom:8px;min-width:0}'
        + '.ks-sutun.y{background:var(--ks-vurgu);border-color:var(--ks-vurgu);color:var(--ks-vurgu-yazi)}'
        + '.ks-sutun-bas{display:flex;align-items:center;gap:8px;padding:12px 12px 10px}.ks-sutun-bas b{flex:1;font-family:var(--ks-baslik-font);font-weight:800;font-size:24px;text-transform:uppercase}.ks-sutun-bas span{font-family:var(--ks-baslik-font);font-weight:800;font-size:24px}'
        + '.ks-sutun-liste{display:flex;flex-direction:column;gap:6px;padding:0 8px}.ks-sutun-bos{padding:10px 6px 4px;font-size:12.5px;opacity:.7}'
        + '.ks-kisi{min-height:48px;width:100%;border-radius:12px;border:0;display:flex;align-items:center;gap:6px;padding:4px 10px;font:inherit;text-align:left;cursor:pointer;background:var(--ks-kart2);color:var(--ks-yazi)}'
        + '.ks-sutun.y .ks-kisi{background:rgba(10,10,10,.82);color:#F5F2EF}body.light-theme .ks-sutun.y .ks-kisi{background:#fff;color:#17120E}'
        + '.ks-kisi span{flex:1;min-width:0;display:flex;flex-direction:column}.ks-kisi b{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ks-kisi i{font-style:normal;font-size:10.5px;opacity:.7}.ks-kisi svg{flex-shrink:0;opacity:.6}'
        + '.ks-segment{display:flex;gap:4px;padding:4px;border-radius:24px;background:var(--ks-kart);align-self:flex-start;max-width:100%}.ks-segment .ks-cip{border:0;min-height:40px}.ks-segment.kucuk .ks-cip{min-height:36px;padding:0 14px}'
        + '.ks-cipler{display:flex;flex-wrap:wrap;gap:8px}'
        + '.ks-cip{min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}'
        + '.ks-cip.on{background:var(--ks-acik);border-color:var(--ks-acik);color:var(--ks-acik-yazi);font-weight:800}'
        + '.ks-alan-ad{display:block;margin:8px 0 -2px;font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--ks-soluk)}'
        + '.ks-hazir-format{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'
        + '.ks-format{min-height:84px;border-radius:16px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;text-align:left;padding:0 12px;display:flex;flex-direction:column;justify-content:center;gap:2px;cursor:pointer}'
        + '.ks-format b{font-family:var(--ks-baslik-font);font-weight:800;font-size:26px;line-height:1;text-transform:uppercase}.ks-format span{font-size:11.5px;color:var(--ks-soluk)}'
        + '.ks-format.on{border:2px solid var(--ks-vurgu);background:color-mix(in srgb,var(--ks-vurgu) 16%,var(--ks-kart))}'
        + '.ks-ozet-kart{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:var(--ks-kart);margin-top:6px}.ks-ozet-kart > svg{color:var(--ks-vurgu2);flex-shrink:0}'
        + '.ks-av-grup{display:flex;align-items:center;color:var(--ks-vurgu2)}.ks-ozet-yazi{flex:1;min-width:0;display:flex;flex-direction:column}.ks-ozet-yazi b{font-size:14px}.ks-ozet-yazi i{font-style:normal;font-size:12px;color:var(--ks-soluk)}'
        + '.ks-link{border:0;background:transparent;color:var(--ks-vurgu2);font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;min-height:44px;padding:0 4px}'
        + '.ks-link-satir{display:flex;flex-wrap:wrap;gap:4px 16px}'
        + '.ks-girdi{width:100%;box-sizing:border-box;min-height:50px;border-radius:12px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;font-size:16px;padding:0 14px;outline:0}'
        + '#ks-ekran .ks-girdi:focus{border-color:var(--ks-vurgu2);box-shadow:none;outline:0;background:var(--ks-kart)}'
        + '.ks-grup-izgara{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}'
        + '.ks-grup{min-height:62px;border-radius:14px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;display:flex;align-items:center;gap:10px;padding:0 12px;text-align:left;cursor:pointer}'
        + '.ks-grup span:last-child{display:flex;flex-direction:column}.ks-grup b{font-size:14.5px}.ks-grup i{font-style:normal;font-size:11.5px;color:var(--ks-soluk)}'
        + '.ks-grup.on{border:2px solid var(--ks-vurgu);background:color-mix(in srgb,var(--ks-vurgu) 16%,var(--ks-kart))}'
        + '.ks-kutu{width:22px;height:22px;border-radius:6px;border:2px solid var(--ks-soluk);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ks-vurgu-yazi)}'
        + '.ks-grup.on .ks-kutu{background:var(--ks-vurgu);border-color:var(--ks-vurgu)}'
        + '.ks-iki-alan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ks-iki-alan > div{display:flex;flex-direction:column;gap:10px}'
        + '.ks-onay{display:flex;align-items:center;gap:10px;min-height:48px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px}'
        + '.ks-onay input{position:absolute;opacity:0;width:1px;height:1px}.ks-onay .ks-kutu svg{opacity:0}.ks-onay input:checked + .ks-kutu{background:var(--ks-vurgu);border-color:var(--ks-vurgu)}.ks-onay input:checked + .ks-kutu svg{opacity:1}'
        + '.ks-onay input:focus-visible + .ks-kutu{outline:3px solid var(--ks-vurgu2);outline-offset:2px}'
        + '#ks-ekran button:focus-visible,#ks-ekran input:focus-visible{outline:3px solid var(--ks-vurgu2);outline-offset:2px}'
        + '.ks-sutun.y .ks-kisi:focus-visible{outline-color:var(--ks-vurgu-yazi)}'
        + '@media (max-width:370px){.ks-sayfa{padding-left:12px;padding-right:12px}.ks-yb{width:44px}.ks-e-baslik{font-size:40px}.ks-format b{font-size:22px}.ks-iki-alan{grid-template-columns:1fr}}';
    document.head.appendChild(st);
}
window.ksEkranAc = ksEkranAc;
