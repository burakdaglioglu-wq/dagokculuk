/* ================================================================================================
   🥚 YUMURTA YUVASI — Karışık Sınıf › Oyunlar (2026-10-11, kullanıcı 8 yaş için iki oyun fikrinden "yumurta güzelmiş,
   önce onu yapalım" dedi). Araştırma notu: 6-8 yaşta koleksiyon merakı başlar; sporda kalmayı en iyi "kendini geçme"
   (ustalık) ortamı sağlar → çocuk başkasıyla değil KENDİ ortalamasıyla yarışır, zayıf çocuk da ilerler.

   Kural: her çocuğun bir yumurtası var. Her gerçek seri (Skor Gir, Oyunlar, Ok Partisi — nereden girilirse) ısı verir:
     🔥 her seri +1 · 🎯 bütün oklar hedefte (M yok) +1 · ⭐ ok başına ortalaması KENDİ son 30 serisinin ortalamasını
     geçerse +2.  Yumurta 10'da çatlar, 22'de yavru çıkar, 40'ta büyür → albüme girer, çocuk yeni yumurta seçer.
   İlerleme SAKLANMAZ, HESAPLANIR: sporcunun serilerinden (seriler + kartGecmisi, yuva.basla sonrası) her açılışta
   yeniden hesaplanır → seri silme / geri alma / cihaz değişikliği kendiliğinden doğru. Saklanan tek şey seçimler:
   sp.oyun.yuva = { basla, sira: [{ no, renk, t }] } — sp.oyun gamification yoluyla sunucuya gider (coinDamga ile
   coinT ilerletilir, yoksa sunucu yazmayı reddeder). Hayvanlar KM_OYUN_KARAKTERLER'den (İzci/Tırmanıcı figürleri hariç).
   Kancalar: app.js _skorKaydetCekirdek → window.yuvaSeriSonrasi (çatladı/çıktı/büyüdü bildirimi).
   ================================================================================================ */
// Eşikler (2026-10-11 v237: 10/22/40 → çok uzun bulundu). 10+ yaş temel 8/18/30; küçükler daha çabuk:
// 8-9 yaş ×0.8 (6/14/24), 7 ve altı ×0.6 (5/11/18). Yaş bilinmiyorsa grup: minikler ×0.6, küçükler ×0.8.
const YUVA_ESIK_TEMEL = { catla: 8, yavru: 18, buyu: 30 };
function yuvaYasCarpan(sp, g) {
    let yas = null; try { if (typeof yasHesapla === 'function') yas = yasHesapla(sp); } catch (e) {}
    if (yas !== null && yas > 2 && yas < 80) return yas <= 7 ? 0.6 : yas <= 9 ? 0.8 : 1;
    return g === 'minikler' ? 0.6 : g === 'kucukler' ? 0.8 : 1;
}
function yuvaEsik(sp, g) { const c = yuvaYasCarpan(sp, g) * ((typeof kmOyunAyar === 'function' && kmOyunAyar().yuvaCarpan) || 1); /* ⚙️ Oyun Ayarları hız çarpanı */ return { catla: Math.round(YUVA_ESIK_TEMEL.catla * c), yavru: Math.round(YUVA_ESIK_TEMEL.yavru * c), buyu: Math.round(YUVA_ESIK_TEMEL.buyu * c), carpan: c }; }
const YUVA_ESIK = YUVA_ESIK_TEMEL; // (eski adla erişen kalmasın diye)
const YUVA_RENK = [
    { id: 'pembe', ana: '#FF8FB8', ben: '#FFD3E4', koyu: '#D9487F' }, { id: 'mavi', ana: '#6EC6FF', ben: '#D2EEFF', koyu: '#2F8FD6' }, { id: 'yesil', ana: '#7BD88F', ben: '#D7F5DD', koyu: '#3FA35A' },
    { id: 'mor', ana: '#B18CFF', ben: '#E6DAFF', koyu: '#7C4FE0' }, { id: 'turuncu', ana: '#FFB067', ben: '#FFE3C7', koyu: '#E07A1F' }, { id: 'sari', ana: '#FFDA5C', ben: '#FFF3C2', koyu: '#D9A400' },
];
// NADİR YUMURTALAR (2026-10-11, kullanıcı "geliştir" → "Nadir yumurtalar" seçti). Haklar da serilerden HESAPLANIR:
//   ⭐ Altın: yeni kişisel rekor seri (ok başına ortalaması önceki bütün serilerinden yüksek, en az 5 eski seri varken).
//   💎 Elmas: kendi ortalamasını ÜST ÜSTE 3 seri geçmek. (v239'a kadar 'gokkusagi' idi — kullanıcı istemedi; eski kayıtlar elmas sayılır.)
// Nadir yumurta daha hızlı ısınır (altın ×1.5, elmas ×2) ve içinden PARLAK hayvan çıkar (albümde altın çerçeve).
const YUVA_NADIR = {
    altin: { id: 'altin', ana: '#F4B731', ben: '#FFF1B8', koyu: '#B07A06', ad: 'Altın yumurta', ikon: '⭐', carpan: 1.5, nasil: 'Yeni rekor seri at' },
    elmas: { id: 'elmas', ana: '#7FD8F5', ben: '#FFFFFF', koyu: '#2A9CC4', ad: 'Elmas yumurta', ikon: '💎', carpan: 2, nasil: 'Ortalamanı üst üste 3 kez geç' },
};
const yuvaNadirMi = (renk) => !!YUVA_NADIR[yuvaEskiRenk(renk)];
const yuvaEskiRenk = (id) => id === 'gokkusagi' ? 'elmas' : id;
const yuvaRenkBul = (id) => (id = yuvaEskiRenk(id), false) || YUVA_NADIR[id] || YUVA_RENK.find((r) => r.id === id) || YUVA_RENK[0];
function yuvaHayvanlar() { return (typeof KM_OYUN_KARAKTERLER !== 'undefined' ? KM_OYUN_KARAKTERLER : []).filter((k) => k.no <= 9 || k.no >= 13); }
function yuvaHayvan(no) { return yuvaHayvanlar().find((k) => k.no === no) || yuvaHayvanlar()[0]; }
function yuvaSp(g, ad) { return turnuvaDB[g] && turnuvaDB[g][ad]; }
function yuvaKayit(sp) { const o = sp && sp.oyun; return (o && o.yuva) || null; }
const yuvaDeger = (v) => v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0);

// Sporcunun bütün serileri (güncel kart + geçmiş kartlar), zamana göre sıralı, tekrarsız.
function yuvaSeriler(sp) {
    const tum = [], gorulen = new Set();
    const ekle = (s) => { if (!s || !Array.isArray(s.oklar) || !s.oklar.length) return; const k = s.seriId || ((s.t || '') + '|' + s.oklar.join(',')); if (gorulen.has(k)) return; gorulen.add(k); tum.push(s); };
    (sp.kartGecmisi || []).forEach((k) => (k.seriler || []).forEach(ekle));
    (sp.seriler || []).forEach(ekle);
    const zaman = (s) => s.t || (s.tarih ? Date.parse(s.tarih + 'T12:00:00') : 0);
    return tum.sort((a, b) => zaman(a) - zaman(b)).map((s) => ({ ...s, _t: zaman(s) }));
}
// Bir serinin ısısı ve hangi kuralların tuttuğu. onceki = bu seriden önceki seriler (kişisel ortalama için).
function yuvaSeriIsi(s, onceki) {
    const n = s.oklar.length, ort = s.oklar.reduce((a, v) => a + yuvaDeger(v), 0) / n;
    const son = onceki.slice(-30); let p = 0, ok = 0; son.forEach((x) => { p += x.oklar.reduce((a, v) => a + yuvaDeger(v), 0); ok += x.oklar.length; });
    const kisisel = ok >= 6 ? p / ok : null;
    const hepsi = !s.oklar.some((v) => v === 'M'), gecti = kisisel !== null && ort > kisisel;
    return { isi: 1 + (hepsi ? 1 : 0) + (gecti ? 2 : 0), hepsi, gecti };
}
// Durum: haric = sondan kaç seri sayılmasın (bildirim için "önceki hal").
function yuvaDurum(g, ad, haric) {
    const sp = yuvaSp(g, ad), y = yuvaKayit(sp);
    if (!sp || !y) return { yok: true, toplam: 0, album: [], sira: [], gorevler: [], yem: {}, dost: null, bugunIsi: 0 };
    let seriler = yuvaSeriler(sp); if (haric) seriler = seriler.slice(0, Math.max(0, seriler.length - haric));
    // Her yumurta YALNIZ kendi penceresindeki serilerle ısınır: [seçildiği an, sonraki yumurtanın seçildiği an) — ilk
    // yumurta için pencere y.basla'dan (o günün başı) başlar. 40'ta durur, artan ısı sonraki yumurtaya TAŞINMAZ
    // (yoksa çok seri atmış çocuğun yeni yumurtası anında çatlıyordu — sürprizin tadı kaçıyordu).
    const E = yuvaEsik(sp, g);
    const sira = (y.sira || []).map((x) => x.renk === 'gokkusagi' ? { ...x, renk: 'elmas' } : x), isilar = sira.map(() => 0), kazanc = { altin: 0, elmas: 0 };
    const dostlar = (y.dost || []).slice().sort((a, b) => a.t - b.t), yem = {}; // 🐾 dost: o an yanındaki hayvan serilerden yem alır
    let enIyiOrt = -1, oncekiSay = 0, zincir = 0, gun = null;
    let toplam = 0, bugunIsi = 0, bugunKural = { seri: 0, hepsi: 0, gecti: 0 }; const bugun = typeof bugunISO === 'function' ? bugunISO() : '';
    seriler.forEach((s, i) => {
        const ort = s.oklar.reduce((a, v) => a + yuvaDeger(v), 0) / s.oklar.length;
        const rekor = oncekiSay >= 5 && ort > enIyiOrt;
        enIyiOrt = Math.max(enIyiOrt, ort); oncekiSay++;
        if (s._t < y.basla) return;
        const r = yuvaSeriIsi(s, seriler.slice(0, i)); let isi = r.isi;
        // 📋 Günün görevleri: bu seriyle tamamlanan her görev +YUVA_GOREV_ODUL ısı (yalnız YUVA_GOREV_BASLA'dan sonraki günler)
        if (s.tarih && s.tarih >= YUVA_GOREV_BASLA) {
            if (!gun || gun.tarih !== s.tarih) gun = yuvaGorevGun(ad, s.tarih, seriler.slice(0, i));
            gun.seriler.push(s);
            gun.liste.forEach((gv) => { if (!gv.tamam && gv.kontrol(gun.seriler, gun.ctx)) { gv.tamam = true; isi += YUVA_GOREV_ODUL; } });
        }
        toplam += isi;
        if (rekor) kazanc.altin++;
        if (r.gecti) { zincir++; if (zincir >= 3) { kazanc.elmas++; zincir = 0; } } else zincir = 0;
        if (s.tarih === bugun) { bugunIsi += isi; bugunKural.seri++; if (r.hepsi) bugunKural.hepsi++; if (r.gecti) bugunKural.gecti++; }
        for (let e = sira.length - 1; e >= 0; e--) { const bas = e === 0 ? y.basla : sira[e].t; if (s._t >= bas) { isilar[e] += isi * ((YUVA_NADIR[sira[e].renk] || {}).carpan || 1); break; } }
        for (let j = dostlar.length - 1; j >= 0; j--) if (s._t >= dostlar[j].t) { yem[dostlar[j].no] = (yem[dostlar[j].no] || 0) + isi; break; }
    });
    let tamam = 0; while (tamam < sira.length && isilar[tamam] >= E.buyu) tamam++;
    const album = sira.slice(0, tamam);
    const aktif = sira[tamam] || null, ilerleme = aktif ? Math.floor(Math.min(E.buyu, isilar[tamam])) : 0;
    const kullanilan = (r) => sira.filter((x) => x.renk === r).length;
    const hak = { altin: Math.max(0, kazanc.altin - kullanilan('altin')), elmas: Math.max(0, kazanc.elmas - kullanilan('elmas')) };
    const evre = !aktif ? -1 : ilerleme >= E.yavru ? 2 : ilerleme >= E.catla ? 1 : 0;
    const gunB = gun && gun.tarih === bugun ? gun : (bugun >= YUVA_GOREV_BASLA ? yuvaGorevGun(ad, bugun, seriler) : null);
    const gorevler = gunB ? gunB.liste.map((x) => ({ id: x.id, ikon: x.ikon, metin: x.metin, tamam: !!x.tamam })) : [];
    const dost = dostlar.length ? dostlar[dostlar.length - 1].no : null;
    return { toplam, album, aktif, ilerleme, evre, secimGerek: !aktif, tamam, bugunIsi, bugunKural, sira, adim: tamam * 4 + (evre + 1), hak, zincir, esik: E, gorevler, yem, dost };
}
function yuvaKaydet(sp) { try { if (typeof coinDamga === 'function') coinDamga(sp); else sp.lastModified = Date.now(); } catch (e) {} try { oyVeriKaydet(); } catch (e) {} }
function yuvaBaslat(g, ad) {
    const sp = yuvaSp(g, ad); if (!sp) return;
    const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
    if (!o.yuva) { const b = new Date(); b.setHours(0, 0, 0, 0); o.yuva = { basla: b.getTime(), sira: [] }; } // bugünün serileri de sayılır
    return o.yuva;
}
// Yeni yumurta: renk çocuğun seçimi; içindeki hayvan sürpriz — albümde olmayanlardan rastgele.
function yuvaYumurtaSec(g, ad, renk) {
    const sp = yuvaSp(g, ad); if (!sp) return; const y = yuvaBaslat(g, ad), d = yuvaDurum(g, ad);
    if (!d.secimGerek && y.sira.length) return;
    if (yuvaNadirMi(renk) && !(d.hak && d.hak[renk] > 0)) return;
    const ayniTur = y.sira.filter((x) => yuvaNadirMi(x.renk) === yuvaNadirMi(renk)), sahip = new Set(ayniTur.map((x) => x.no).concat(ayniTur.map((x) => x.ikiz).filter(Boolean)));
    let aday = yuvaHayvanlar().filter((k) => !sahip.has(k.no)); if (!aday.length) aday = yuvaHayvanlar();
    const no = aday[Math.floor(Math.random() * aday.length)].no, kalan = aday.filter((k) => k.no !== no);
    const ikiz = Math.random() < YUVA_IKIZ_OLASILIK && kalan.length ? kalan[Math.floor(Math.random() * kalan.length)].no : null;
    if ((!y.dost || !y.dost.length) && d.album.length) y.dost = [{ no: d.album[d.album.length - 1].no, t: Date.now() }];
    y.sira.push({ no, renk, t: Date.now(), ikiz, hediye: YUVA_HEDIYELER[Math.floor(Math.random() * YUVA_HEDIYELER.length)] });
    yuvaKaydet(sp);
}

// ---- SÜRPRİZLER (2026-10-11, kullanıcı: "sürprizler çok hoş oldu, yumurtaları geliştir")
// 👯 İkiz: yumurtaların ~%15'inden iki hayvan çıkar (ikincisi de albüme girer).
// 🔍 İpucu: yumurta çatlayınca içinden ses gelir — hayvanın yaşadığı yere göre tahmin ettirir.
// 🎁 Hediye: büyüyen hayvan bir hediye getirir; albümde hayvanın üstünde görünür.
const YUVA_IKIZ_OLASILIK = 0.15;
const YUVA_HEDIYELER = ['👑', '🎩', '🕶️', '🎀', '⭐', '🌸', '🏅', '🎈', '🍀', '🧢'];
const YUVA_IPUCU = {
    'Kaplumbağa': '🐢 Tık tık… çok yavaş bir şey kıpırdıyor!', 'Kurbağa': '💧 Vıraak! Islak bir ses geliyor…', 'Kirpi': '🍂 İçeriden dikenli bir hışırtı geliyor…',
    'Köpek': '🦴 Hav! Kuyruk sallama sesi mi o?', 'Ayı': '🍯 Bal kokusu geliyor…', 'Tembel Hayvan': '😴 Biri çok uykulu… esniyor!', 'Zürafa': '🌳 Bu yumurtada uzun bir şey var!',
    'Arı': '🌼 Vızzz… çiçek kokusu!', 'Penguen': '❄️ Yumurta buz gibi soğuk!', 'Zebra': '🦓 Çizgili bir şey görünüyor…', 'Ahtapot': '🌊 Dalga sesi… çok kollu bir şey!',
    'Yılan': '〰️ Tıss… kıvrılan bir ses!', 'Bukalemun': '🎨 Yumurtanın rengi değişiyor!', 'Bal Arısı': '🍯 Vızzz… bal kokusu!', 'Tilki': '🍂 Orman kokusu… kurnaz bir göz!',
    'Yunus': '🌊 Deniz sesi… neşeli bir ıslık!', 'Salyangoz': '🐌 İçeriden sümüklü bir iz…', 'Istakoz': '🦞 Çıt çıt… kıskaç sesi!', 'Balon Balığı': '🎈 Yumurta şişiyor gibi!',
    'Kedi': '🐾 Miyav… tırmalama sesi!', 'Deniz Kaplumbağası': '🏖️ Kum ve deniz kokusu…', 'Timsah': '🐊 Şap şap… büyük dişler!', 'Yeşil Timsah': '🌿 Bataklık kokusu… şap!',
};
function yuvaIpucu(no) { const h = yuvaHayvan(no); return YUVA_IPUCU[h.ad] || '👂 İçeriden bir ses geliyor…'; }
// Albümdeki bütün hayvanlar (ikizler dahil): { no, renk, hediye }
function yuvaAlbumHayvanlar(album) { const l = []; (album || []).forEach((a) => { l.push({ no: a.no, renk: a.renk, hediye: a.hediye }); if (a.ikiz) l.push({ no: a.ikiz, renk: a.renk, hediye: a.hediye }); }); return l; }

// ---- 2026-10-14 GELİŞTİRME (kullanıcı "yumurta oyununu geliştirelim" → dördünü de seçti: hayvanı besle, sınıf yuvası,
// görev kartları, daha canlı ekran). Hepsi yine serilerden HESAPLANIR; yeni saklanan tek şey dost seçimleri:
// sp.oyun.yuva.dost = [{ no, t }] (t'den sonraki seriler o hayvanı besler).
function yuvaHash(m) { let h = 2166136261; for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const yuvaSeriOrt = (s) => s.oklar.reduce((a, v) => a + yuvaDeger(v), 0) / s.oklar.length;
const yuvaHalka = (v) => { const d = yuvaDeger(v); return v === 'M' ? 'm' : d >= 9 ? 'sari' : d >= 7 ? 'kirmizi' : d >= 5 ? 'mavi' : d >= 3 ? 'siyah' : 'beyaz'; };

// 📋 GÖREV KARTLARI: her çocuğa her gün 3 görev (tarih + ad'dan sabit seçilir → her cihazda aynı). Zorluk çocuğun kendi
// ortalamasına göre (son 30 seri, günden önce). Tamamlanan görev o seriye +3 ısı ekler (yumurtaya da dosta da gider).
const YUVA_GOREV_ODUL = 3, YUVA_GOREV_BASLA = '2026-10-14'; // eski günlere görev uygulanmaz (yumurtalar birden ilerlemesin)
function yuvaGorevHavuz(ort) {
    const o = ort === null ? 5 : ort, sari = o >= 7.5 ? 2 : 1, esik = o >= 7 ? 7 : o >= 5 ? 5 : 3, top = Math.min(29, Math.max(10, Math.round(o * 3) + 2));
    const ustUste = (l, f) => { let z = 0; for (const x of l) { z = f(x) ? z + 1 : 0; if (z >= 2) return true; } return false; };
    return [
        { id: 'sari', ikon: '🟡', metin: sari > 1 ? 'Bir seride 2 okunu sarıya at' : 'Bir okunu sarıya at (9-10-X)', kontrol: (l) => l.some((x) => x.oklar.filter((v) => yuvaDeger(v) >= 9).length >= sari) },
        { id: 'temiz', ikon: '🎯', metin: 'Hiç ıska (M) atmadan 2 seri at', kontrol: (l) => l.filter((x) => !x.oklar.includes('M')).length >= 2 },
        { id: 'gec', ikon: '⭐', metin: ort === null ? 'Bugün 3 seri at' : 'Kendi ortalamanı geç (' + ort.toFixed(1).replace('.', ',') + ')', kontrol: (l, c) => c.ort === null ? l.length >= 3 : l.some((x) => yuvaSeriOrt(x) > c.ort) },
        { id: 'cok', ikon: '🔥', metin: 'Bugün 4 seri at', kontrol: (l) => l.length >= 4 },
        { id: 'toplam', ikon: '➕', metin: '3 okun toplamı en az ' + top + ' olsun', kontrol: (l) => l.some((x) => yuvaSeriOrt(x) * 3 >= top) },
        { id: 'esik', ikon: '💪', metin: 'Bir seride bütün okların ' + esik + ' veya üstü', kontrol: (l) => l.some((x) => x.oklar.every((v) => yuvaDeger(v) >= esik)) },
        { id: 'renk', ikon: '🎨', metin: 'Bir seride bütün okların aynı renge', kontrol: (l) => l.some((x) => yuvaHalka(x.oklar[0]) !== 'm' && x.oklar.every((v) => yuvaHalka(v) === yuvaHalka(x.oklar[0]))) },
        { id: 'iki', ikon: '🚀', metin: ort === null ? 'Üst üste 2 seri hiç ıska atma' : 'Üst üste 2 seri ortalamanı geç', kontrol: (l, c) => ustUste(l, (x) => c.ort === null ? !x.oklar.includes('M') : yuvaSeriOrt(x) > c.ort) },
    ];
}
function yuvaGorevGun(ad, tarih, onceki) {
    let p = 0, n = 0; onceki.slice(-30).forEach((x) => x.oklar.forEach((v) => { p += yuvaDeger(v); n++; }));
    const ort = n >= 6 ? p / n : null, kopya = yuvaGorevHavuz(ort), liste = [];
    let h = yuvaHash(tarih + '|' + ad);
    while (liste.length < 3 && kopya.length) { liste.push({ ...kopya.splice(h % kopya.length, 1)[0], tamam: false }); h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; }
    return { tarih, seriler: [], ctx: { ort }, liste };
}
function yuvaGorevNoktaHTML(d) { return d && d.gorevler && d.gorevler.length ? `<div class="yv-gorev-nokta" title="Bugünün görevleri">${d.gorevler.map((x) => '<i class="' + (x.tamam ? 'ok' : '') + '"></i>').join('')}</div>` : ''; }
function yuvaGorevHTML(d) {
    if (!d.gorevler || !d.gorevler.length) return '';
    return `<div class="yv-gorevler"><div class="yv-gorev-bas">📋 Bugünün görevleri <small>her biri +${YUVA_GOREV_ODUL} 🔥</small></div>${d.gorevler.map((x) => `<div class="yv-gorev${x.tamam ? ' tamam' : ''}"><span>${x.tamam ? '✅' : x.ikon}</span><b>${esc(x.metin)}</b><em>${x.tamam ? 'Tamam!' : '+' + YUVA_GOREV_ODUL + ' 🔥'}</em></div>`).join('')}</div>`;
}

// 🐾 DOST: albümdeki bir hayvan yanında kalır; dost olduğu sürece her serinin ısısı onu besler (yem). Seviye 1→5,
// her seviyede bir aksesuar takar. Yumurta büyüyüp yeni yumurta seçilirken ilk dost kendiliğinden atanır.
const YUVA_DOST_ESIK = [0, 6, 15, 27, 42];
const YUVA_DOST_AKS = { 2: '🎀', 3: '🧢', 4: '🕶️', 5: '👑' }, YUVA_DOST_AKS_AD = { 2: 'kurdele', 3: 'şapka', 4: 'gözlük', 5: 'taç' };
function yuvaDostSeviye(y) {
    y = Math.floor(y || 0); let lv = 1; while (lv < 5 && y >= YUVA_DOST_ESIK[lv]) lv++;
    const alt = YUVA_DOST_ESIK[lv - 1], ust = YUVA_DOST_ESIK[lv];
    return { lv, yem: y, sonraki: lv >= 5 ? alt : ust, yuzde: lv >= 5 ? 100 : Math.round((y - alt) / (ust - alt) * 100) };
}
function yuvaDostResim(no, lv, boy) { const h = yuvaHayvan(no); return `<span class="yv-dost-res lv${lv}" style="width:${boy}px;height:${boy}px"><img src="${h.src}" alt="${esc(h.ad)}" style="width:${boy}px;height:${boy}px">${YUVA_DOST_AKS[lv] ? `<em style="font-size:${Math.round(boy * 0.36)}px">${YUVA_DOST_AKS[lv]}</em>` : ''}</span>`; }
function yuvaDostSec(g, ad, no) { const sp = yuvaSp(g, ad), y = yuvaKayit(sp); if (!y) return; y.dost = y.dost || []; const son = y.dost[y.dost.length - 1]; if (son && son.no === no) return; y.dost.push({ no, t: Date.now() }); yuvaKaydet(sp); }
function yuvaDostHTML(d) {
    if (!yuvaAlbumHayvanlar(d.album).length) return `<div class="yv-dost bos">🐾 İlk hayvanın büyüyünce onu <b>dost</b> olarak yanına alırsın. Attığın her seri onu besler, seviye atlar!</div>`;
    if (!d.dost) return `<div class="yv-dost bos">🐾 Albümünden bir <b>dost</b> seç! Attığın her seri onu besler, seviye atladıkça kurdele, şapka, gözlük ve taç takar.<br><button class="yv-btn birincil" data-dost-sec="1">🐾 Dost seç</button></div>`;
    const h = yuvaHayvan(d.dost), s = yuvaDostSeviye(d.yem[d.dost]);
    return `<div class="yv-dost"><div>${yuvaDostResim(d.dost, s.lv, 96)}</div><div class="yv-dost-bilgi"><b>🐾 Dostum: ${esc(h.ad)} <span class="yv-lv">Lv ${s.lv}</span></b>
      <div class="yv-cubuk yem"><i style="width:${s.yuzde}%"></i></div>
      <small>${s.lv >= 5 ? '👑 En üst seviye! Taç takıyor.' : `🍎 ${s.yem}/${s.sonraki} yem · Lv ${s.lv + 1} olunca ${YUVA_DOST_AKS[s.lv + 1]} ${YUVA_DOST_AKS_AD[s.lv + 1]} takar`}</small>
      <button class="yv-btn" data-dost-sec="1">Dostu değiştir</button></div></div>`;
}
function yuvaDostSecAc(i) {
    const k = (_kmListe || [])[i]; if (!k) return; const d = yuvaDurum(k.g, k.ad);
    const ah = [...new Map(yuvaAlbumHayvanlar(d.album).map((a) => [a.no, a])).values()];
    const p = yuvaPencere(`<h2>🐾 Dostunu seç</h2><p>Attığın her seri dostunu besler. Seviye atladıkça 🎀 kurdele, 🧢 şapka, 🕶️ gözlük ve 👑 taç takar!</p>
      <div class="yv-dost-secim">${ah.map((a) => { const s = yuvaDostSeviye(d.yem[a.no]); return `<button data-no="${a.no}" class="${a.no === d.dost ? 'secili' : ''}">${yuvaDostResim(a.no, s.lv, 70)}<span>${esc(yuvaHayvan(a.no).ad)}</span><small>Lv ${s.lv}${a.no === d.dost ? ' · şu an dostun' : ''}</small></button>`; }).join('')}</div>
      <div><button class="yv-btn" data-kapat="1">Vazgeç</button></div>`);
    p.querySelector('[data-kapat]').onclick = () => { p.remove(); yuvaDetay(i); };
    p.querySelectorAll('[data-no]').forEach((b) => b.onclick = () => { yuvaDostSec(k.g, k.ad, +b.dataset.no); yuvaSes(990); p.remove(); kmYuvaCiz(); yuvaUcan('🐾 Dost seçildi!'); setTimeout(() => yuvaDetay(i), 500); });
}

// 🏫 SINIF YUVASI: dersteki (oyun hattındaki) çocukların BUGÜNKÜ ısısı tek bir dev yumurtayı ısıtır. Hedef kişi başı ≈8 ısı
// (⚙️ yumurta hızıyla ölçeklenir). %30'da çatlar, %60'ta yavru görünür, dolunca büyür → yeni dev yumurta. Hayvan ve renk
// tarihten sabit seçilir (her cihaz aynı hayvanı görür). Yumurtası olmayan çocuğun serileri de sayılır.
function yuvaBugunHam(g, ad) { const sp = yuvaSp(g, ad); if (!sp) return 0; const l = yuvaSeriler(sp), b = bugunISO(); let t = 0; l.forEach((x, i) => { if (x.tarih === b) t += yuvaSeriIsi(x, l.slice(0, i)).isi; }); return t; }
function yuvaSinifDurum(liste, durumlar) {
    const bugun = bugunISO(), carp = (typeof kmOyunAyar === 'function' && kmOyunAyar().yuvaCarpan) || 1;
    const hedef = Math.max(12, Math.round(liste.length * 8 * carp));
    let toplam = 0; const katki = [];
    liste.forEach((k, j) => { const d = durumlar[j], v = d && !d.yok ? d.bugunIsi : yuvaBugunHam(k.g, k.ad); toplam += v; if (v) katki.push({ ad: k.ad, v }); });
    katki.sort((a, b) => b.v - a.v);
    const tamam = Math.floor(toplam / hedef), ilerleme = toplam - tamam * hedef, oran = ilerleme / hedef, evre = oran >= 0.6 ? 2 : oran >= 0.3 ? 1 : 0;
    const hl = yuvaHayvanlar(), yum = (j) => ({ no: hl[yuvaHash(bugun + '|sinif|' + j) % hl.length].no, renk: YUVA_RENK[yuvaHash(bugun + '|renk|' + j) % YUVA_RENK.length].id });
    return { hedef, toplam, tamam, ilerleme, evre, aktif: yum(tamam), cikanlar: Array.from({ length: tamam }, (_, j) => yum(j)), katki, adim: tamam * 3 + evre };
}
function yuvaSinifHTML(s, boy, tv) {
    const kisa = (a) => esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(a) : a);
    return `<div class="yv-sinif" id="yv-sinif"><div class="yv-sinif-yum">${yuvaGorselHTML({ aktif: s.aktif, evre: s.evre, secimGerek: false }, boy)}</div>
      <div class="yv-sinif-bilgi"><div class="yv-sinif-bas">🏫 Sınıf yuvası${s.tamam ? ` <span class="yv-lv">${s.tamam + 1}. dev yumurta</span>` : ''}</div>
        <small>Herkesin bugünkü ateşi bu dev yumurtayı ısıtır. Dolunca sınıfça sürpriz hayvan çıkar!</small>
        <div class="yv-cubuk buyuk"><i style="width:${Math.round(s.ilerleme / s.hedef * 100)}%"></i><span style="left:30%"></span><span style="left:60%"></span></div>
        <div class="yv-sinif-sayi">🔥 <b>${s.ilerleme}</b>/${s.hedef} · ${['Isınıyor', 'Çatlıyor!', 'Yavru göründü!'][s.evre]}</div>
        <div class="yv-katki">${s.katki.length ? s.katki.slice(0, tv ? 14 : 8).map((c) => `<span>${kisa(c.ad)} <b>+${c.v}</b></span>`).join('') : '<span>Henüz seri yok — ilk ateşi kim yakacak? 🔥</span>'}</div>
        ${s.cikanlar.length ? `<div class="yv-sinif-cikan">Bugün sınıfça çıkanlar: ${s.cikanlar.map((c) => { const h = yuvaHayvan(c.no); return `<img src="${h.src}" alt="${esc(h.ad)}" title="${esc(h.ad)}">`; }).join('')}</div>` : ''}</div></div>`;
}
// Dev yumurta bu cihazda en son görülen adımı geçtiyse kutla (günde bir kayıt; açılışta ilk görüşte kutlama yok).
function yuvaSinifKutla(s) {
    const b = bugunISO(), yaz = () => { try { localStorage.setItem('dag_yuva_sinif', JSON.stringify({ t: b, adim: s.adim, tamam: s.tamam })); } catch (e) {} };
    let o = {}; try { o = JSON.parse(localStorage.getItem('dag_yuva_sinif') || '{}'); } catch (e) {}
    if (o.t !== b || s.adim <= o.adim) { yaz(); return; }
    yaz();
    const tip = s.tamam > (o.tamam || 0) ? 'buyu' : s.evre === 2 ? 'yavru' : 'catla', c = tip === 'buyu' ? s.cikanlar[s.cikanlar.length - 1] : s.aktif;
    let bekleme = 0; const oyna = () => { if (document.querySelector('.yv-sahne') && bekleme++ < 10) return setTimeout(oyna, 800); yuvaKirilma(tip, c.renk, c.no, '🏫 Sınıf yuvası'); };
    setTimeout(oyna, 700);
}
// Kaydedilen seride ekrana kıvılcım
function yuvaKivilcim() {
    const e = document.createElement('div'); e.className = 'yv-kiv';
    e.innerHTML = Array.from({ length: 16 }, (_, j) => `<i style="--a:${j * 22.5}deg;--d:${90 + (j % 4) * 35}px;animation-delay:${(j % 3) * 60}ms">${['🔥', '✨', '⭐', '🔥'][j % 4]}</i>`).join('');
    (document.fullscreenElement || document.body).appendChild(e); setTimeout(() => e.remove(), 1300);
}

// ---------------- görseller ----------------
// 2026-10-14 (kullanıcı: "yumurtalar güzel gözükmüyor, boş gibi; biraz daha düzgün yapalım"): yumurta artık hacimli
// (ışık + kenar gölgesi + alt gölge), her rengin kendi deseni var (benek, zikzak, leke, yıldız, dalga, kuşak) ve bir
// saman YUVANIN içinde duruyor. Kırılma animasyonu yuvasız çizer (yuvaYok) — çatlak koordinatları aynı (viewBox 92×110).
const YUVA_DESEN = { pembe: 'benek', mavi: 'zikzak', yesil: 'leke', mor: 'yildiz', turuncu: 'dalga', sari: 'kusak', altin: 'elmasKesim', elmas: 'elmasKesim' };
function yuvaDesenSVG(tip, r) {
    const b = r.ben, k = r.koyu || r.ana;
    if (tip === 'zikzak') return `<path d="M-4 60 L6 51 L16 60 L26 51 L36 60 L46 51 L56 60 L66 51 L76 60 L86 51 L96 60" fill="none" stroke="${b}" stroke-width="6" stroke-linejoin="round"/><path d="M-4 72 L6 63 L16 72 L26 63 L36 72 L46 63 L56 72 L66 63 L76 72 L86 63 L96 72" fill="none" stroke="${k}" stroke-opacity=".35" stroke-width="2.5" stroke-linejoin="round"/><circle cx="34" cy="30" r="4" fill="${b}"/><circle cx="58" cy="86" r="5" fill="${b}"/>`;
    if (tip === 'leke') return `<path d="M20 44c6-6 16-4 17 4s-8 12-15 9-7-8-2-13z" fill="${k}" fill-opacity=".38"/><path d="M58 66c7-5 18 0 16 9s-12 10-17 5-4-10 1-14z" fill="${k}" fill-opacity=".38"/><path d="M50 22c4-3 10-1 10 4s-6 7-10 4-3-5 0-8z" fill="${k}" fill-opacity=".32"/><path d="M24 80c4-3 10-1 10 3s-5 7-9 5-4-5-1-8z" fill="${k}" fill-opacity=".32"/>`;
    if (tip === 'yildiz') { const y = (x, yy, s) => `<path transform="translate(${x} ${yy}) scale(${s})" d="M0 -6 L1.8 -1.9 6 -1.9 2.6 0.8 3.8 5 0 2.5 -3.8 5 -2.6 0.8 -6 -1.9 -1.8 -1.9Z" fill="${b}"/>`; return y(28, 36, 1.2) + y(60, 30, .9) + y(46, 58, 1.4) + y(24, 74, .9) + y(66, 80, 1.1) + y(44, 92, .8); }
    if (tip === 'dalga') return `<path d="M-4 42 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/><path d="M-4 66 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/><path d="M-4 88 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="${b}" stroke-width="4" stroke-linecap="round" stroke-opacity=".8"/>`;
    if (tip === 'kusak') return `<rect x="0" y="54" width="92" height="14" fill="${b}"/><rect x="0" y="54" width="92" height="2.5" fill="${k}" fill-opacity=".3"/><rect x="0" y="66" width="92" height="2.5" fill="${k}" fill-opacity=".3"/><circle cx="30" cy="34" r="4" fill="${b}"/><circle cx="56" cy="26" r="3" fill="${b}"/><circle cx="38" cy="86" r="4.5" fill="${b}"/><circle cx="64" cy="82" r="3" fill="${b}"/>`;
    if (tip === 'elmasKesim') return `<path d="M46 4 L30 40 L46 70 L62 40 Z" fill="#fff" fill-opacity=".22"/><path d="M6 68 L30 40 L46 70 L28 104 Z" fill="#fff" fill-opacity=".12"/><path d="M86 68 L62 40 L46 70 L64 104 Z" fill="${k}" fill-opacity=".18"/><path d="M28 104 L46 70 L64 104 Z" fill="${k}" fill-opacity=".12"/>`;
    // benek (varsayılan)
    return `<circle cx="30" cy="60" r="7" fill="${b}"/><circle cx="60" cy="72" r="9" fill="${b}"/><circle cx="52" cy="28" r="5" fill="${b}"/><circle cx="24" cy="84" r="4" fill="${b}"/><circle cx="70" cy="46" r="4" fill="${b}"/><circle cx="42" cy="90" r="3" fill="${b}"/>`;
}
function yuvaYumurtaSVG(renkId, evre, boy, yuvaYok) {
    renkId = yuvaEskiRenk(renkId);
    const r = yuvaRenkBul(renkId), id = 'yg' + Math.random().toString(36).slice(2, 7), nadir = yuvaNadirMi(renkId), k = r.koyu || r.ana;
    const govde = 'M46 4 C70 4 86 44 86 68 C86 90 68 104 46 104 C24 104 6 90 6 68 C6 44 22 4 46 4 Z';
    const grad = renkId === 'elmas'
        ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#BDEFFF"/><stop offset=".55" stop-color="#7FD8F5"/><stop offset=".8" stop-color="#D9F6FF"/><stop offset="1" stop-color="#3FA9D0"/></linearGradient>`
        : `<radialGradient id="${id}" cx="36%" cy="28%" r="82%"><stop offset="0" stop-color="${r.ben}"/><stop offset=".42" stop-color="${r.ana}"/><stop offset="1" stop-color="${k}"/></radialGradient>`;
    const yildiz = nadir ? '<g class="yv-pirilti"><path d="M20 30 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff"/><path d="M70 22 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#fff"/><path d="M74 80 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#fff"/></g>' : '';
    const catlak = evre >= 1 ? `<path d="M22 46 L31 40 L37 48 L45 41 L52 49 L60 42 L70 47" fill="none" stroke="#3A2416" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 41 L47 33 M60 42 L63 35 M31 40 L29 34" stroke="#3A2416" stroke-width="2" stroke-linecap="round"/>` : '';
    // saman yuva: arka kenar yumurtanın arkasında, ön kenar önünde (yumurta yuvaya oturur)
    const yuvaArka = yuvaYok ? '' : `<ellipse cx="46" cy="101" rx="42" ry="10" fill="#4A260F"/>`;
    const yuvaOn = yuvaYok ? '' : `<path d="M3 99 C8 116 26 121 46 121 C66 121 84 116 89 99 C78 106 64 108 46 108 C28 108 14 106 3 99 Z" fill="#9A6332"/>
      <path d="M8 104 C22 111 38 112 52 111 M14 110 C30 116 52 116 76 108 M10 101 C30 108 64 109 84 102 M24 116 C40 119 58 118 70 114" fill="none" stroke="#C48A4E" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 106 C24 109 34 110 44 109 M50 113 C62 112 72 110 82 105" fill="none" stroke="#6B3F1D" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M4 99 L-1 95 M88 99 L94 94 M20 108 L16 113 M74 110 L79 115" stroke="#B9824A" stroke-width="2" stroke-linecap="round"/>`;
    const H = yuvaYok ? 110 : 123;
    return `<svg viewBox="0 0 92 ${H}" width="${boy}" height="${boy * H / 92}" aria-hidden="true"${nadir ? ' class="yv-nadir-svg"' : ''} style="overflow:visible"><defs>${grad}<clipPath id="${id}c"><path d="${govde}"/></clipPath></defs>
      ${yuvaYok ? '<ellipse cx="46" cy="106" rx="30" ry="5" fill="rgba(0,0,0,.22)"/>' : ''}${yuvaArka}
      <path d="${govde}" fill="url(#${id})"/>
      <g clip-path="url(#${id}c)">${yuvaDesenSVG(YUVA_DESEN[renkId] || 'benek', r)}
        <ellipse cx="46" cy="104" rx="46" ry="22" fill="${k}" fill-opacity=".35"/>
        <ellipse cx="88" cy="66" rx="14" ry="44" fill="${k}" fill-opacity=".25"/></g>
      <path d="${govde}" fill="none" stroke="${k}" stroke-opacity=".55" stroke-width="2"/>
      <ellipse cx="30" cy="32" rx="8" ry="15" transform="rotate(-24 30 32)" fill="#fff" fill-opacity=".55"/><circle cx="37" cy="17" r="3" fill="#fff" fill-opacity=".7"/>
      ${yildiz}${catlak}${yuvaOn}</svg>`;
}
// Yavru: kabuğun alt yarısında, başı dışarıda. Büyük: tam boy, yıldızlı.
function yuvaYavruHTML(g, renkId, no, boy, ikizNo) {
    const r = yuvaRenkBul(renkId), h = yuvaHayvan(no), h2 = ikizNo ? yuvaHayvan(ikizNo) : null;
    return `<div class="yv-yavru${yuvaNadirMi(renkId) ? ' parlak' : ''}${h2 ? ' ikiz' : ''}" style="width:${boy}px;height:${boy * 1.2}px"><img src="${h.src}" alt="${esc(h.ad)}" style="width:${boy * (h2 ? 0.62 : 0.86)}px;height:${boy * (h2 ? 0.62 : 0.86)}px">${h2 ? `<img class="yv-ikiz2" src="${h2.src}" alt="${esc(h2.ad)}" style="width:${boy * 0.6}px;height:${boy * 0.6}px">` : ''}
      <svg viewBox="0 0 92 60" width="${boy}" height="${boy * 0.65}" class="yv-kabuk" aria-hidden="true"><path d="M8 4 L18 14 L28 4 L38 14 L48 4 L58 14 L68 4 L78 14 L86 6 C88 30 72 56 46 56 C20 56 4 30 8 4 Z" fill="${r.ana}" stroke="rgba(0,0,0,.14)" stroke-width="2"/><circle cx="26" cy="34" r="5" fill="${r.ben}"/><circle cx="62" cy="40" r="6" fill="${r.ben}"/></svg></div>`;
}
function yuvaGorselHTML(d, boy) {
    if (d.secimGerek) return `<div class="yv-bos" style="width:${boy}px;height:${boy * 1.2}px">❔</div>`;
    if (d.evre === 2) return yuvaYavruHTML('', d.aktif.renk, d.aktif.no, boy, d.aktif.ikiz);
    return `<div class="yv-yumurta${yuvaNadirMi(d.aktif.renk) ? ' nadir' : ''} ${d.evre === 1 ? 'sallan' : 'nefes'}">${yuvaYumurtaSVG(d.aktif.renk, d.evre, boy)}</div>`;
}
const YUVA_EVRE_AD = ['Yumurta', 'Çatlıyor!', 'Yavru çıktı!'];
function yuvaHakCipHTML(hak) { return Object.keys(YUVA_NADIR).filter((k) => hak && hak[k] > 0).map((k) => `<span class="yv-hak ${k}">${YUVA_NADIR[k].ikon}${hak[k] > 1 ? '×' + hak[k] : ''}</span>`).join(''); }

// ---------------- ekran ----------------
const YUVA_CSS = `
.yv{--zemin:#FFF6E6;--zemin2:#FFE9C7;--yazi:#4A2E1C;--soluk:#9A7458;--vurgu:#FF7A45;--ates:#FF5A1F;--cim:#7CC86E;
  --yvf-b:'Baloo 2','Trebuchet MS',system-ui,sans-serif;--yvf-g:'Nunito',system-ui,sans-serif;
  color:var(--yazi);font-family:var(--yvf-g);background:radial-gradient(900px 500px at 50% -20%,#FFFDF7,var(--zemin) 60%),var(--zemin);border-radius:22px;padding:18px;display:grid;gap:14px;position:relative;overflow:hidden}
.yv:fullscreen{border-radius:0;overflow:auto}
.yv button{font-family:inherit;cursor:pointer}.yv button:focus-visible{outline:3px solid var(--vurgu);outline-offset:2px}
.yv-ust{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
.yv-logo{font:800 32px/1 var(--yvf-b);display:flex;align-items:center;gap:10px}.yv-logo small{display:block;font:800 11.5px var(--yvf-g);letter-spacing:.14em;color:var(--soluk);text-transform:uppercase;margin-top:4px}
.yv-btn{border:0;border-radius:999px;padding:9px 16px;font:900 14px var(--yvf-g);background:#fff;color:var(--yazi);box-shadow:0 3px 0 rgba(74,46,28,.15),inset 0 0 0 2px rgba(74,46,28,.1)}
.yv-btn.birincil{background:var(--vurgu);color:#fff;box-shadow:0 5px 0 #C8501F}
.yv-kurallar{display:flex;flex-wrap:wrap;gap:8px}
.yv-kural{background:#fff;border-radius:16px;padding:8px 14px;font-weight:900;font-size:15px;box-shadow:inset 0 0 0 2px rgba(74,46,28,.08);display:flex;gap:8px;align-items:center}
.yv-kural b{font:800 20px var(--yvf-b);color:var(--ates)}
.yv-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.yv-kart{position:relative;border:0;background:linear-gradient(#fff,#FFF9EE);border-radius:24px;padding:12px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 6px 0 rgba(74,46,28,.10),inset 0 0 0 2px rgba(74,46,28,.06);color:var(--yazi)}
.yv-kart:hover{transform:translateY(-2px)}
.yv-kart .yv-ad{font:800 18px/1.1 var(--yvf-b);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yv-kart .yv-evre{font-weight:900;font-size:12.5px;color:var(--soluk)}
.yv-cubuk{width:100%;height:12px;border-radius:999px;background:#F3E3CC;overflow:hidden;position:relative}
.yv-cubuk i{position:absolute;inset:0 auto 0 0;border-radius:999px;background:linear-gradient(90deg,#FFB067,var(--ates));transition:width .6s ease}
.yv-cubuk span{position:absolute;top:0;bottom:0;width:2px;background:rgba(74,46,28,.25)}
.yv-alt{display:flex;justify-content:space-between;width:100%;font-weight:900;font-size:12.5px;font-variant-numeric:tabular-nums}
.yv-bugun{position:absolute;top:8px;right:8px;background:var(--ates);color:#fff;font:900 12px var(--yvf-g);border-radius:999px;padding:3px 8px}
.yv-yumurta.nefes svg{animation:yvNefes 2.6s ease-in-out infinite;transform-origin:50% 90%}
.yv-yumurta.sallan svg{animation:yvSallan 1.1s ease-in-out infinite;transform-origin:50% 90%}
@keyframes yvNefes{50%{transform:scale(1.03)}}
@keyframes yvSallan{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-7deg)}80%{transform:rotate(6deg)}90%{transform:rotate(-3deg)}}
.yv-yavru{position:relative;display:flex;justify-content:center}
.yv-yavru img{position:absolute;bottom:22%;object-fit:contain;animation:yvZipla 1.8s ease-in-out infinite;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18))}
.yv-yavru .yv-kabuk{position:absolute;bottom:0;left:0}
@keyframes yvZipla{50%{transform:translateY(-6%)}}
.yv-nadir-svg{filter:drop-shadow(0 0 10px rgba(255,200,60,.75))}
.yv-yumurta.nadir svg{filter:drop-shadow(0 0 12px rgba(255,200,60,.8))}
.yv-pirilti{animation:yvPirilti 1.6s ease-in-out infinite;transform-origin:50% 50%}
@keyframes yvPirilti{50%{opacity:.25}}
.yv-yavru.parlak img,.yv-parlak img{filter:drop-shadow(0 0 6px #FFD54A) drop-shadow(0 0 14px rgba(255,200,60,.8)) saturate(1.25)}
.yv-yavru.parlak::after,.yv-parlak::after{content:'✨';position:absolute;top:-4px;right:-2px;font-size:22px;animation:yvPirilti 1.4s infinite}
.yv-parlak{position:relative;display:inline-flex}
.yv-hak{display:inline-flex;align-items:center;gap:2px;border-radius:999px;padding:2px 7px;font:900 12px var(--yvf-g);background:linear-gradient(135deg,#FFE27A,#F4B731);color:#5A3A00;box-shadow:0 2px 0 rgba(0,0,0,.12)}
.yv-hak.elmas{background:linear-gradient(135deg,#E6FAFF,#7FD8F5);color:#0B4A63}
.yv-haklar{position:absolute;top:8px;left:8px;display:flex;gap:4px}
.yv-album .parlak{background:radial-gradient(circle,#FFF6CF,#fff);box-shadow:inset 0 0 0 3px #F4B731,0 0 12px rgba(244,183,49,.45)}
.yv-album .parlak img{filter:drop-shadow(0 0 4px #FFD54A) saturate(1.25)}
.yv-secim .yv-nadir-etk{display:block;font:900 12px var(--yvf-g);color:var(--altin-yazi,#8A5A00);margin-top:2px}
.yv-kural.nadir{background:linear-gradient(135deg,#FFF6D6,#FFF)}
.yv-ped-kutu{background:#fff;border-radius:22px;padding:14px;display:grid;gap:10px;box-shadow:inset 0 0 0 2px rgba(255,122,69,.25)}
.yv-ped-baslik{font:800 19px var(--yvf-b);color:var(--ates)}
.yv-slotlar{display:flex;gap:8px;justify-content:center}
.yv-slotlar span{width:52px;height:52px;border-radius:14px;border:3px dashed #E8CFA8;display:flex;align-items:center;justify-content:center;font:800 24px var(--yvf-b)}
.yv-ped{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-width:420px;width:100%;margin:0 auto}
.yv-ped button{border:0;border-radius:12px;padding:12px 0;font:800 20px var(--yvf-b);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)}
.yv-ped button:disabled{opacity:.4;cursor:not-allowed}
.yv .yv-btn:disabled{opacity:.45;cursor:not-allowed}
.yv-sahne{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 45%,rgba(255,236,190,.97),rgba(255,176,103,.93) 60%,rgba(200,80,31,.92));display:flex;align-items:center;justify-content:center;cursor:pointer;animation:yvSahneGel .25s ease}
.yv-sahne.kapan{animation:yvSahneGit .3s ease forwards}
@keyframes yvSahneGel{from{opacity:0}}@keyframes yvSahneGit{to{opacity:0}}
.yv-sahne-ic{position:relative;width:260px;height:300px;display:flex;align-items:center;justify-content:center}
.yv-sahne-yazi{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:18px;white-space:nowrap;font:800 clamp(30px,7vw,54px)/1 'Baloo 2',system-ui,sans-serif;color:#fff;text-shadow:0 4px 0 #C8501F,0 10px 30px rgba(120,40,0,.35);opacity:0;animation:yvYaziGel .5s 1.15s cubic-bezier(.2,1.6,.4,1) forwards}
.yv-sahne-isim{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;white-space:nowrap;font:800 28px 'Baloo 2',system-ui,sans-serif;color:#7A3A10}
@keyframes yvYaziGel{from{opacity:0;transform:translateX(-50%) scale(.4)}to{opacity:1;transform:translateX(-50%) scale(1)}}
.yv-kirik{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:yvTitre .12s linear 8}
.yv-kirik.ust{clip-path:polygon(0 0,100% 0,100% 44%,88% 40%,76% 46%,64% 39%,52% 46%,40% 38%,30% 45%,18% 39%,0 44%)}
.yv-kirik.alt{clip-path:polygon(0 44%,18% 39%,30% 45%,40% 38%,52% 46%,64% 39%,76% 46%,88% 40%,100% 44%,100% 100%,0 100%)}
.yv-sahne.yv-s-yavru .yv-kirik.ust{animation:yvTitre .12s linear 8,yvUstUc .7s 1s cubic-bezier(.3,.6,.4,1) forwards}
.yv-sahne.yv-s-yavru .yv-kirik.alt{animation:yvTitre .12s linear 8,yvAltDus .7s 1s ease-in forwards}
.yv-sahne.yv-s-catla .yv-kirik{animation:yvTitre .12s linear 8,yvSallanBuyuk 1s 1s ease-in-out 2}
@keyframes yvTitre{25%{transform:translateX(-4px) rotate(-3deg)}75%{transform:translateX(4px) rotate(3deg)}}
@keyframes yvSallanBuyuk{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
@keyframes yvUstUc{to{transform:translate(-90px,-170px) rotate(-55deg);opacity:0}}
@keyframes yvAltDus{to{transform:translate(40px,140px) rotate(25deg);opacity:0}}
.yv-catlak-ciz{position:absolute;stroke-dasharray:1;stroke-dashoffset:1;animation:yvCiz .35s 1s ease forwards}
.yv-catlak-ciz path{stroke-dasharray:1;stroke-dashoffset:1;animation:yvCiz .35s 1s ease forwards}
@keyframes yvCiz{to{stroke-dashoffset:0}}
.yv-firla{position:absolute;opacity:0;transform:scale(.2) translateY(60px);animation:yvFirla .7s 1.1s cubic-bezier(.2,1.7,.4,1) forwards}
.yv-sahne.yv-s-buyu .yv-firla{animation-delay:.15s}
.yv-firla img{width:220px;height:220px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(120,40,0,.35))}
@keyframes yvFirla{to{opacity:1;transform:scale(1) translateY(0)}}
.yv-isinlar{position:absolute;width:520px;height:520px;left:50%;top:50%;margin:-260px 0 0 -260px;border-radius:50%;background:repeating-conic-gradient(rgba(255,255,255,.35) 0 10deg,transparent 10deg 22deg);opacity:0;animation:yvIsin .6s 1.05s ease forwards,yvDon 8s 1.05s linear infinite;pointer-events:none}
.yv-sahne.yv-s-catla .yv-isinlar{display:none}
@keyframes yvIsin{to{opacity:1}}@keyframes yvDon{to{transform:rotate(360deg)}}
.yv-yildiz{position:absolute;left:50%;top:50%;font-style:normal;font-size:26px;opacity:0;animation:yvYildiz 1s 1.1s ease-out forwards}
.yv-sahne.yv-s-catla .yv-yildiz{display:none}
@keyframes yvYildiz{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--a)) translateY(0)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateY(calc(var(--d) * -1))}}
@media (prefers-reduced-motion:reduce){.yv-sahne *{animation-duration:.01s!important;animation-delay:0s!important}}
.yv-ipucu{font:800 12px var(--yvf-g);color:#7A4A1A;background:#FFF1D6;border-radius:10px;padding:4px 8px;text-align:center;line-height:1.25}
.yv-ipucu.buyuk{font:800 17px var(--yvf-b);padding:10px 14px;margin:0}.yv-ipucu.buyuk small{font:700 13px var(--yvf-g);color:var(--soluk)}
.yv-yavru.ikiz img{left:2%}.yv-yavru .yv-ikiz2{position:absolute;bottom:22%;right:0;left:auto!important;object-fit:contain;animation:yvZipla 1.8s .5s ease-in-out infinite}
.yv-album div{position:relative}.yv-hediye{position:absolute;top:-6px;right:-4px;font-style:normal;font-size:18px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
.yv-hediye.buyuk{position:static;font-size:44px;align-self:flex-start}
.yv-firla.ikiz{display:flex;gap:0}.yv-firla.ikiz img{width:170px;height:170px}
.yv-sahne-yazi small{display:block;font:800 clamp(16px,3.4vw,24px)/1.2 'Nunito',system-ui,sans-serif;text-shadow:0 2px 0 #C8501F;margin-top:10px;white-space:normal;max-width:90vw}
.yv-bos{display:flex;align-items:center;justify-content:center;font-size:40px;border-radius:50% 50% 46% 46%;border:4px dashed #E8CFA8;color:#D2AE7C}
.yv-kart.yeni{animation:yvPatla .9s ease}
@keyframes yvPatla{20%{transform:scale(1.12) rotate(-3deg)}40%{transform:scale(.96) rotate(3deg)}60%{transform:scale(1.05)}}
.yv-katman{position:fixed;inset:0;z-index:9500;background:rgba(60,35,15,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.yv-pencere{width:min(640px,100%);max-height:100%;overflow:auto;background:linear-gradient(#FFFDF8,#FFF3DE);border-radius:28px;padding:22px;box-shadow:0 30px 80px rgba(60,35,15,.35);display:grid;gap:14px;text-align:center;color:var(--yazi);animation:yvGel .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes yvGel{from{transform:scale(.75);opacity:0}}
.yv-pencere h2{margin:0;font:800 clamp(26px,5vw,38px)/1.05 var(--yvf-b)}.yv-pencere p{margin:0;font-weight:700;color:var(--soluk)}
.yv-buyuk{display:flex;justify-content:center;padding:6px 0}
.yv-secim{display:flex;justify-content:center;gap:clamp(8px,3vw,26px);flex-wrap:wrap}
.yv-secim button{border:0;background:transparent;border-radius:24px;padding:8px}
.yv-secim button:hover svg{animation:yvSallan 1s ease-in-out infinite;transform-origin:50% 90%}
.yv-album{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}
.yv-album div{aspect-ratio:1;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(74,46,28,.06)}
.yv-album img{width:80%;height:80%;object-fit:contain}.yv-album .kapali img{filter:brightness(0) opacity(.12)}
.yv-satir{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.yv-satir div{background:#fff;border-radius:16px;padding:10px 6px;font-weight:900;font-size:13px}.yv-satir b{display:block;font:800 26px var(--yvf-b);color:var(--ates)}
.yv-uc{position:fixed;left:50%;top:34%;transform:translate(-50%,-50%);z-index:9600;font:800 clamp(26px,5.5vw,48px) var(--yvf-b);color:#fff;text-shadow:0 4px 0 #C8501F,0 8px 24px rgba(0,0,0,.25);pointer-events:none;animation:yvUc 1.6s ease forwards;white-space:nowrap}
@keyframes yvUc{0%{transform:translate(-50%,-30%) scale(.6);opacity:0}20%{transform:translate(-50%,-50%) scale(1.08);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-85%);opacity:0}}
.yv-gorsel-kap{position:relative;display:flex;justify-content:center}
.yv-alev{position:absolute;left:0;right:0;bottom:30%;display:flex;justify-content:center;gap:20px;pointer-events:none;z-index:2}
.yv-alev i{font-style:normal;font-size:16px;opacity:0;animation:yvAlev 2.2s ease-in infinite}.yv-alev i:nth-child(2){animation-delay:.7s}.yv-alev i:nth-child(3){animation-delay:1.4s}
@keyframes yvAlev{0%{opacity:0;transform:translateY(10px) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translateY(-64px) scale(1.1)}}
.yv-kart.sicak{box-shadow:0 6px 0 rgba(255,90,31,.22),inset 0 0 0 2px rgba(255,122,69,.45),0 0 22px rgba(255,140,60,.25)}
.yv-kart.kaynar .yv-yumurta svg{animation:yvSallan .75s ease-in-out infinite;filter:drop-shadow(0 0 10px rgba(255,120,40,.75))}
.yv-gorev-nokta{display:flex;gap:5px;justify-content:center}.yv-gorev-nokta i{width:12px;height:12px;border-radius:50%;background:#F3E3CC;box-shadow:inset 0 0 0 2px rgba(74,46,28,.12)}.yv-gorev-nokta i.ok{background:#3FAE4A;box-shadow:0 0 6px rgba(63,174,74,.6)}
.yv-dost-mini{display:inline-flex;align-items:center;gap:2px}.yv-dost-mini img{width:20px;height:20px;object-fit:contain}
.yv-sinif{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;background:linear-gradient(135deg,#fff,#FFF1DA);border-radius:24px;padding:14px 18px;box-shadow:0 6px 0 rgba(74,46,28,.10),inset 0 0 0 2px rgba(255,122,69,.25)}
.yv-sinif-bas{font:800 22px/1.1 var(--yvf-b)}
.yv-sinif-bilgi{display:grid;gap:6px;min-width:0}.yv-sinif-bilgi small{font-weight:800;color:var(--soluk);font-size:12.5px}
.yv-cubuk.buyuk{height:18px}
.yv-sinif-sayi{font:800 16px var(--yvf-b)}.yv-sinif-sayi b{font-size:22px;color:var(--ates)}
.yv-katki{display:flex;flex-wrap:wrap;gap:5px}.yv-katki span{background:#fff;border-radius:999px;padding:3px 9px;font-weight:900;font-size:12px;box-shadow:inset 0 0 0 2px rgba(74,46,28,.08)}.yv-katki b{color:var(--ates)}
.yv-sinif-cikan{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:900;font-size:12.5px}.yv-sinif-cikan img{width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))}
.yv-lv{display:inline-block;background:var(--vurgu);color:#fff;border-radius:999px;padding:1px 8px;font:900 12px var(--yvf-g);vertical-align:middle}
.yv-gorevler{background:#fff;border-radius:20px;padding:12px;display:grid;gap:6px;text-align:left}
.yv-gorev-bas{font:800 18px var(--yvf-b)}.yv-gorev-bas small{font:800 12px var(--yvf-g);color:var(--soluk)}
.yv-gorev{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-radius:14px;background:#FFF7EA;font-size:14px}
.yv-gorev span{font-size:20px;text-align:center}.yv-gorev em{font-style:normal;font-weight:900;color:var(--ates);font-size:13px;white-space:nowrap}
.yv-gorev.tamam{background:#E5F7E1}.yv-gorev.tamam b{text-decoration:line-through;color:#4F7A45}.yv-gorev.tamam em{color:#3E8E3A}
.yv-dost{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;background:#fff;border-radius:20px;padding:12px;text-align:left}
.yv-dost.bos{display:block;font-weight:800;text-align:center}.yv-dost.bos .yv-btn{margin-top:8px}
.yv-dost-bilgi{display:grid;gap:6px}.yv-dost-bilgi b{font:800 18px var(--yvf-b)}.yv-dost-bilgi small{font-weight:800;color:var(--soluk)}.yv-dost-bilgi .yv-btn{justify-self:start}
.yv-cubuk.yem i{background:linear-gradient(90deg,#9BE07F,#3FAE4A)}
.yv-dost-res{position:relative;display:inline-flex}.yv-dost-res img{object-fit:contain;animation:yvZipla 1.8s ease-in-out infinite;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18))}
.yv-dost-res em{position:absolute;top:-14%;left:50%;transform:translateX(-50%) rotate(-8deg);font-style:normal;line-height:1}
.yv-dost-res.lv4 em{top:14%}.yv-dost-res.lv5 img{filter:drop-shadow(0 0 6px #FFD54A) drop-shadow(0 0 14px rgba(255,200,60,.8))}
.yv-dost-secim{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
.yv-dost-secim button{border:0;background:#fff;border-radius:18px;padding:12px 6px 10px;display:grid;justify-items:center;gap:4px;box-shadow:inset 0 0 0 2px rgba(74,46,28,.08);color:var(--yazi);font-weight:900}
.yv-dost-secim button.secili{box-shadow:inset 0 0 0 3px var(--vurgu)}.yv-dost-secim small{color:var(--soluk)}
.yv-albumlv{position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);font:900 10px var(--yvf-g);background:var(--vurgu);color:#fff;border-radius:999px;padding:0 6px;white-space:nowrap}
.yv-kiv{position:fixed;left:50%;top:45%;z-index:99990;pointer-events:none}
.yv-kiv i{position:absolute;font-style:normal;font-size:26px;opacity:0;animation:yvKiv .9s ease-out forwards}
@keyframes yvKiv{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.6)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(1.1)}}
.yv-tv-ana{display:grid;grid-template-columns:minmax(300px,38%) 1fr;gap:16px;align-items:start}
.yv-tv .yv-sinif{grid-template-columns:1fr;justify-items:center;text-align:center;padding:22px}
.yv-tv .yv-sinif-bas{font-size:34px}.yv-tv .yv-sinif-sayi{font-size:22px}.yv-tv .yv-sinif-sayi b{font-size:36px}.yv-tv .yv-katki{justify-content:center}.yv-tv .yv-sinif-bilgi{width:100%}.yv-tv .yv-sinif-cikan{justify-content:center}
.yv-tv-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.yv-tv-kart{position:relative;border:0;background:#fff;border-radius:20px;padding:10px 6px;display:grid;justify-items:center;gap:3px;color:var(--yazi);box-shadow:0 4px 0 rgba(74,46,28,.1)}
.yv-tv-kart .yv-ad{font:800 17px/1.1 var(--yvf-b);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yv-tv-isi{font:900 13px var(--yvf-g);color:var(--ates)}.yv-tv-isi.yok{color:var(--soluk)}
.yv-tv-kart.sicak{box-shadow:0 4px 0 rgba(255,90,31,.3),0 0 18px rgba(255,140,60,.35)}
.yv-tv-kart.yeni{animation:yvPatla .9s ease}
.yv-arti{position:absolute;top:-8px;right:-4px;z-index:3;background:var(--ates);color:#fff;border-radius:999px;padding:2px 9px;font:900 15px var(--yvf-b);pointer-events:none;animation:yvArti 2.6s ease forwards}
@keyframes yvArti{0%{transform:scale(.3);opacity:0}15%{transform:scale(1.2);opacity:1}70%{opacity:1}100%{transform:translateY(-22px);opacity:0}}
.yv:fullscreen.yv-tv{padding:24px}
@media (max-width:800px){.yv-tv-ana{grid-template-columns:1fr}.yv-sinif{grid-template-columns:1fr;justify-items:center;text-align:center}.yv-katki,.yv-sinif-cikan{justify-content:center}}
@media (max-width:600px){.yv{padding:12px}.yv-logo{font-size:26px}.yv-izgara{grid-template-columns:repeat(2,minmax(0,1fr))}.yv-kural{font-size:13px}}
/* 🌙 KOYU (varsayılan, 2026-10-14 kullanıcı: "beyaz arka bazen iyi olmuyor"): kulüp paleti #FD8E01 #FC5B01 #D73204 #861C02 #430F02 */
.yv.koyu{--zemin:#1A0904;--zemin2:#2A1208;--yazi:#FFF1E6;--soluk:#D6A88A;--vurgu:#FD8E01;--ates:#FC5B01;--kart:#2B1209;--kart2:#341710;--cizgi:rgba(253,142,1,.22);
  background:radial-gradient(900px 520px at 50% -18%,rgba(215,50,4,.32),transparent 62%),radial-gradient(700px 420px at 100% 110%,rgba(134,28,2,.45),transparent 60%),#160703;color:var(--yazi)}
.yv.koyu .yv-btn{background:var(--kart2);color:var(--yazi);box-shadow:0 3px 0 rgba(0,0,0,.35),inset 0 0 0 1.5px var(--cizgi)}
.yv.koyu .yv-btn.birincil{background:linear-gradient(180deg,#FD8E01,#FC5B01);color:#1A0700;box-shadow:0 5px 0 #861C02}
.yv.koyu .yv-kural,.yv.koyu .yv-satir div,.yv.koyu .yv-katki span,.yv.koyu .yv-gorevler,.yv.koyu .yv-dost,.yv.koyu .yv-album div,.yv.koyu .yv-dost-secim button,.yv.koyu .yv-ped-kutu{background:var(--kart);color:var(--yazi);box-shadow:inset 0 0 0 1.5px var(--cizgi)}
.yv.koyu .yv-kural.nadir{background:linear-gradient(135deg,rgba(244,183,49,.18),var(--kart))}
.yv.koyu .yv-kart,.yv.koyu .yv-tv-kart{background:linear-gradient(180deg,#331609,#230d05);color:var(--yazi);box-shadow:0 6px 0 rgba(0,0,0,.35),inset 0 0 0 1.5px var(--cizgi)}
.yv.koyu .yv-kart.sicak,.yv.koyu .yv-tv-kart.sicak{box-shadow:0 6px 0 rgba(0,0,0,.35),inset 0 0 0 2px rgba(253,142,1,.6),0 0 26px rgba(252,91,1,.35)}
.yv.koyu .yv-cubuk{background:rgba(255,241,230,.1)}.yv.koyu .yv-cubuk span{background:rgba(255,241,230,.25)}
.yv.koyu .yv-sinif{background:linear-gradient(135deg,#3A170A,#230d05);box-shadow:0 6px 0 rgba(0,0,0,.35),inset 0 0 0 2px rgba(253,142,1,.35)}
.yv.koyu .yv-pencere{background:linear-gradient(#2E1309,#1C0904);color:var(--yazi);box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1.5px var(--cizgi)}
.yv.koyu .yv-katman{background:rgba(10,3,1,.7)}
.yv.koyu .yv-ipucu{background:rgba(253,142,1,.14);color:#FFD9B0}
.yv.koyu .yv-gorev{background:rgba(255,241,230,.06)}.yv.koyu .yv-gorev.tamam{background:rgba(63,174,74,.18)}.yv.koyu .yv-gorev.tamam b{color:#9BE07F}
.yv.koyu .yv-gorev-nokta i{background:rgba(255,241,230,.12);box-shadow:inset 0 0 0 2px rgba(255,241,230,.15)}
.yv.koyu .yv-album .kapali img{filter:brightness(0) invert(1) opacity(.08)}
.yv.koyu .yv-bos{border-color:rgba(253,142,1,.35);color:#D6A88A}
.yv.koyu .yv-slotlar span{border-color:rgba(253,142,1,.35)}
.yv.koyu .yv-kart .yv-evre{color:var(--soluk)}
.yv.koyu .yv-hak{box-shadow:0 2px 0 rgba(0,0,0,.4)}
.yv.koyu p[style*="var(--soluk)"]{color:var(--soluk)}
/* Yarışma bağlantısı (sayaç şeridi) */
.yv-yz{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:0;border-radius:18px;padding:8px 10px 8px 14px;background:linear-gradient(90deg,rgba(215,50,4,.28),rgba(67,15,2,.5));color:#FFF1E6;box-shadow:inset 0 0 0 1.5px rgba(253,142,1,.45);font:inherit;text-align:left}
.yv.acik .yv-yz{background:linear-gradient(90deg,#FFE3C7,#FFF6E6);color:var(--yazi);box-shadow:inset 0 0 0 1.5px rgba(255,122,69,.45)}
.yv-yz-et{font:900 12px var(--yvf-g);letter-spacing:.1em;color:#FD8E01;white-space:nowrap}.yv-yz-bilgi{flex:1;min-width:120px;font-weight:800;font-size:13px}
.yv-yz .yz-sayac{background:rgba(0,0,0,.32);color:#FFF1E6;min-width:0;flex-direction:row;gap:8px;padding:4px 14px;border-radius:999px}.yv-yz .yz-sayac-alt{font-size:10.5px}.yv-yz .yz-sayac-sure{font-size:22px;line-height:1}
.yv-yz-btn{display:flex;gap:6px;flex-wrap:wrap}
/* Sporcular penceresi */
.yv-sp-liste{display:grid;gap:6px;text-align:left}
.yv-sp-sat{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:14px;background:rgba(255,241,230,.06);box-shadow:inset 0 0 0 1.5px var(--cizgi,rgba(74,46,28,.1))}
.yv.acik .yv-sp-sat{background:#fff}
.yv-sp-sat b{font:800 16px var(--yvf-b)}.yv-sp-sat small{display:block;font-weight:800;font-size:11.5px;color:var(--soluk)}
.yv-sp-ara{width:100%;box-sizing:border-box;min-height:44px;border-radius:14px;border:1.5px solid var(--cizgi,rgba(74,46,28,.2));background:transparent;color:var(--yazi);padding:8px 12px;font:inherit;font-size:15px}
.yv-sp-adaylar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.yv-sp-aday{border:0;border-radius:14px;padding:8px 12px;background:rgba(253,142,1,.12);color:var(--yazi);font:800 14px var(--yvf-g);box-shadow:inset 0 0 0 1.5px var(--cizgi,rgba(74,46,28,.12));display:grid;justify-items:start;min-height:44px}
.yv.acik .yv-sp-aday{background:#fff}
.yv-sp-aday small{font-size:10.5px;color:var(--soluk)}
.yv-sp-bas{font:800 15px var(--yvf-b);text-align:left;margin-top:4px}
.yv.koyu{--altin-yazi:#F4C04A}
@media (prefers-reduced-motion:reduce){.yv *{animation:none!important;transition:none!important}}
`;
function yuvaKaynakYukle() {
    if (!document.getElementById('kp-font') && !document.getElementById('yv-font')) { const l = document.createElement('link'); l.id = 'yv-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800;900&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('yv-stil')) return;
    const st = document.createElement('style'); st.id = 'yv-stil'; st.textContent = YUVA_CSS; document.head.appendChild(st);
}
// Bu cihazda en son görülen adım — ekran açılınca ilerleyen kartlar "patlar".
function yuvaGorulenAl() { try { return JSON.parse(localStorage.getItem('dag_yuva_gorulen') || '{}'); } catch (e) { return {}; } }
function yuvaGorulenYaz(m) { try { localStorage.setItem('dag_yuva_gorulen', JSON.stringify(m)); } catch (e) {} }

// Ekran: kartlar (varsayılan) ya da 📺 Sınıf ekranı (_yvTv: dev yumurta + küçük kartlar, TV/projeksiyon için).
// #yv-kok yerinde kalır, yalnız içi yenilenir → tam ekran yeniden çizimde kapanmaz. Ekran açıkken 4 sn'de bir başka
// cihazdan gelen seri var mı bakılır (imza değiştiyse yeniden çiz; açık pencere/animasyon varken beklenir).
// ---- 👥 Yumurta oyuncuları + 🏆 Yarışma bağlantısı (2026-10-14, kullanıcı: "yarışma moduyla birlikte çalışmıyor, geçiş yeri
// yok; burada da sporcuları çıkarıp ekleyebileyim; bazen hem yarışma hem bu oyunu oynayabilsinler").
// Liste = ders listesinden oyun hattındakiler (eskisi gibi) + elle eklenenler (Yarışma hattındakiler de olabilir: ikisini
// birden oynar — yarışmada attığı seriler zaten yumurtasını ısıtır) − elle çıkarılanlar. Kayıt 'dag_km_yuvaliste_<konum>'
// (km-ortak ile her cihaza gider): { 'grup|ad': 'ek' | 'cik' }.
function yuvaListeAnahtar() { return 'dag_km_yuvaliste_' + (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum ? _kmAktifKonum : 'varsayilan'); }
function yuvaListeAyar() { try { return JSON.parse(localStorage.getItem(yuvaListeAnahtar()) || '{}') || {}; } catch (e) { return {}; } }
function yuvaListeAyarla(k, v) { const a = yuvaListeAyar(); a[k] = v; try { localStorage.setItem(yuvaListeAnahtar(), JSON.stringify(a)); } catch (e) {} }
function yuvaYarismadaMi(k) { return typeof kmHat === 'function' && kmHat(k.g, k.ad) === 'yarisma'; }
function yuvaOyuncuMu(k) { const a = yuvaListeAyar()[k.g + '|' + k.ad]; if (a === 'ek') return true; if (a === 'cik') return false; return !yuvaYarismadaMi(k); }
const yuvaKatla = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u');
function yuvaSporcular() {
    const kisa = (k) => esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad), kod = (k) => esc(encodeURIComponent(k.g + '|' + k.ad));
    const grup = (g) => esc(typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[g] ? LIG_ETIKET[g] : g);
    const ders = (_kmListe || []).filter((k) => yuvaSp(k.g, k.ad)), icinde = ders.filter(yuvaOyuncuMu), disinda = ders.filter((k) => !yuvaOyuncuMu(k));
    const p = yuvaPencere(`<h2>👥 Yumurta oyuncuları</h2>
      <p>Yarışmadaki sporcuyu da ekleyebilirsin — ikisini birden oynar; yarışmada attığı seriler yumurtasını da ısıtır.</p>
      <div class="yv-sp-liste">${icinde.map((k) => `<div class="yv-sp-sat"><span><b>${kisa(k)}</b><small>${grup(k.g)}${yuvaYarismadaMi(k) ? ' · 🏆 yarışmada da' : ''}</small></span><button class="yv-btn" data-cik="${kod(k)}">Çıkar</button></div>`).join('') || '<p>Yumurtada kimse yok — aşağıdan ekle.</p>'}</div>
      ${disinda.length ? `<div class="yv-sp-bas">Derste ama yumurtada değil</div><div class="yv-sp-adaylar">${disinda.map((k) => `<button class="yv-sp-aday" data-ek="${kod(k)}"><span>+ ${kisa(k)}</span><small>${yuvaYarismadaMi(k) ? '🏆 yarışmada — ikisinde de oynasın' : 'çıkarılmıştı'}</small></button>`).join('')}</div>` : ''}
      <div class="yv-sp-bas">Derste olmayan sporcu ekle</div>
      <input class="yv-sp-ara" id="yv-sp-ara" type="search" placeholder="İsim yaz… (tüm gruplar)" autocomplete="off">
      <div class="yv-sp-adaylar" id="yv-sp-sonuc"></div>
      <div><button class="yv-btn birincil" data-kapat="1">Tamam</button></div>`);
    const yenile = () => { kmYuvaCiz(); setTimeout(yuvaSporcular, 30); };
    p.querySelector('[data-kapat]').onclick = () => p.remove();
    p.querySelectorAll('[data-cik]').forEach((b) => b.onclick = () => { yuvaListeAyarla(decodeURIComponent(b.dataset.cik), 'cik'); yenile(); });
    p.querySelectorAll('[data-ek]').forEach((b) => b.onclick = () => { yuvaListeAyarla(decodeURIComponent(b.dataset.ek), 'ek'); yuvaSes(990); yenile(); });
    const ara = p.querySelector('#yv-sp-ara'), sonuc = p.querySelector('#yv-sp-sonuc');
    ara.oninput = () => {
        const q = yuvaKatla(ara.value.trim()); if (q.length < 2) { sonuc.innerHTML = ''; return; }
        const dersteki = new Set((_kmListe || []).map((k) => k.g + '|' + k.ad)), l = [];
        ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!dersteki.has(g + '|' + ad) && yuvaKatla(ad).indexOf(q) !== -1) l.push({ g, ad, pasif: !!(turnuvaDB[g][ad].pasif || turnuvaDB[g][ad].donduruldu) }); }));
        sonuc.innerHTML = l.slice(0, 24).map((k) => `<button class="yv-sp-aday" data-yeni="${kod(k)}"><span>+ ${esc(k.ad)}</span><small>${grup(k.g)} · derse de eklenir${k.pasif ? ' · pasif' : ''}</small></button>`).join('') || '<p>Bu isimde sporcu yok.</p>';
        sonuc.querySelectorAll('[data-yeni]').forEach((b) => b.onclick = () => {
            const k = decodeURIComponent(b.dataset.yeni), i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
            if (!(_kmListe || []).some((s) => s.g === g && s.ad === ad)) { _kmListe.push({ g, ad }); try { _kmListeKaydet(); } catch (e) {} try { kmSinifKartiCiz(); } catch (e) {} }
            yuvaListeAyarla(k, 'ek'); yuvaSes(990); showToast(ad + ' derse ve yumurtaya eklendi', 'success'); yenile();
        });
    };
    setTimeout(() => { try { ara.focus(); } catch (e) {} }, 50);
}
// Yarışma turu sürüyorsa üstte şerit: seri, bekleyen skor, süre (Yarışma'nın sayacı burada da işler) + geçiş düğmeleri.
function yuvaYarismaHTML() {
    if (typeof yzOku !== 'function') return '';
    let o; try { o = yzOku(); } catch (e) { return ''; }
    const d = o.durum; if (!d || !d.asama || d.asama === 'kurulum' || d.asama === 'bitti') return '';
    const f = d.asama === 'tur' ? yzFormat(d) : null, seri = f ? Math.min(d.seri, f.seri - 1) : 0, bek = f ? yzBekleyenler(o, seri).length : 0;
    return `<div class="yv-yz"><span class="yv-yz-et">🎯 YARIŞMA SÜRÜYOR</span><span class="yv-yz-bilgi">${f ? 'Seri ' + (seri + 1) + '/' + f.seri + (bek ? ' · ' + bek + ' skor bekleniyor' : ' · seri tamam') : 'Eleme maçları'}</span>${o.sayac ? yzSayacHTML(o, 'yz-oyun-sayac') : ''}<span class="yv-yz-btn"><button class="yv-btn" onclick="yuvaYarismayaGec(false)">🏆 Yarışma ekranı</button><button class="yv-btn birincil" onclick="yuvaYarismayaGec(true)">📺 Yarışma TV</button></span></div>`;
}
function yuvaYarismayaGec(tv) {
    if (typeof kmKarmaYarismayaGec === 'function') return kmKarmaYarismayaGec(tv);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    if (typeof kmAracSec === 'function') kmAracSec('yarisma'); else kmSekme('yarisma');
}
// Tema: 🌙 koyu (varsayılan, kulüp renkleri) / ☀️ açık — bu cihazın tercihi.
function yuvaTema() { try { return localStorage.getItem('dagsk_yuva_tema') === 'acik' ? 'acik' : 'koyu'; } catch (e) { return 'koyu'; } }
function yuvaTemaDegis() { try { localStorage.setItem('dagsk_yuva_tema', yuvaTema() === 'koyu' ? 'acik' : 'koyu'); } catch (e) {} kmYuvaCiz(); }
let _yvTv = false, _yvPoll = null, _yvImza = '', _yvSonBugun = {};
function yuvaImza() { return (typeof yzAnahtar === 'function' ? (localStorage.getItem(yzAnahtar()) || '') : '') + '#' + (localStorage.getItem(yuvaListeAnahtar()) || '') + '#' + (_kmListe || []).map((k) => { const sp = yuvaSp(k.g, k.ad), y = yuvaKayit(sp); return sp ? (sp.seriler || []).length + ':' + (sp.kartGecmisi || []).length + ':' + (y ? (y.sira || []).length + '.' + (y.dost || []).length : '-') : '0'; }).join(',') + '|' + (typeof bugunISO === 'function' ? bugunISO() : ''); }
function yuvaPollBaslat() {
    if (_yvPoll) return;
    _yvPoll = setInterval(() => {
        if (!document.getElementById('yv-kok') || (typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme !== 'yuva')) { clearInterval(_yvPoll); _yvPoll = null; return; }
        if (document.querySelector('.yv-katman,.yv-sahne')) return;
        if (yuvaImza() !== _yvImza) kmYuvaCiz();
    }, 4000);
}
function yuvaTvDegis() { _yvTv = !_yvTv; kmYuvaCiz(); if (_yvTv && !document.fullscreenElement) yuvaTamEkran(); }
function yuvaKartHTML(k, d) {
    const i = k.i, E = d.esik || YUVA_ESIK, yuzde = d.aktif ? Math.round(d.ilerleme / E.buyu * 100) : 0;
    const evreYazi = d.yok || d.secimGerek ? '🥚 Yumurta seç!' : YUVA_EVRE_AD[d.evre];
    const alt = d.aktif ? [0, E.catla, E.yavru][d.evre] : 0, ust = d.aktif ? [E.catla, E.yavru, E.buyu][d.evre] : 1;
    const kaynar = d.aktif && (d.ilerleme - alt) / Math.max(1, ust - alt) >= 0.7; // bir sonraki evreye çok az kaldı → yumurta titrer
    const dost = d.dost ? '<span class="yv-dost-mini" title="Dostu"><img src="' + yuvaHayvan(d.dost).src + '" alt="">Lv' + yuvaDostSeviye(d.yem[d.dost]).lv + '</span>' : '';
    return `<button class="yv-kart${kaynar ? ' kaynar' : ''}${d.bugunIsi ? ' sicak' : ''}" id="yv-kart-${i}" onclick="yuvaDetay(${i})">${!d.yok && yuvaHakCipHTML(d.hak) ? `<span class="yv-haklar">${yuvaHakCipHTML(d.hak)}</span>` : ''}${d.bugunIsi ? `<span class="yv-bugun">🔥 +${d.bugunIsi}</span>` : ''}
      <div class="yv-gorsel-kap">${d.bugunIsi ? '<span class="yv-alev"><i>🔥</i><i>✨</i><i>🔥</i></span>' : ''}${d.yok ? `<div class="yv-bos" style="width:84px;height:100px">🥚</div>` : yuvaGorselHTML(d, 84)}</div>
      <div class="yv-ad">${esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad)}</div><div class="yv-evre">${evreYazi}${!d.yok && !d.secimGerek && d.evre === 2 && d.aktif.ikiz ? ' 👯 İkiz!' : ''}</div>${!d.yok && !d.secimGerek && d.evre === 1 ? `<div class="yv-ipucu">${esc(yuvaIpucu(d.aktif.no))}</div>` : ''}
      <div class="yv-cubuk"><i style="width:${yuzde}%"></i><span style="left:${E.catla / E.buyu * 100}%"></span><span style="left:${E.yavru / E.buyu * 100}%"></span></div>
      ${yuvaGorevNoktaHTML(d)}
      <div class="yv-alt"><span>🔥 ${d.aktif ? d.ilerleme : 0}/${E.buyu}</span>${dost}<span>🐾 ${d.album ? yuvaAlbumHayvanlar(d.album).length : 0}</span></div></button>`;
}
function yuvaTvKartHTML(k, d) {
    const isi = d.yok ? yuvaBugunHam(k.g, k.ad) : d.bugunIsi;
    return `<button class="yv-tv-kart${isi ? ' sicak' : ''}" id="yv-kart-${k.i}" onclick="yuvaDetay(${k.i})">${d.yok ? '<div class="yv-bos" style="width:58px;height:70px;font-size:26px">🥚</div>' : d.secimGerek ? '<div class="yv-bos" style="width:58px;height:70px;font-size:26px">❔</div>' : yuvaGorselHTML(d, 58)}
      <div class="yv-ad">${esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad)}</div><div class="yv-tv-isi${isi ? '' : ' yok'}">${isi ? '🔥 +' + isi + ' bugün' : 'henüz seri yok'}</div>${yuvaGorevNoktaHTML(d)}</button>`;
}
function kmYuvaCiz() {
    yuvaKaynakYukle();
    const ic = document.getElementById('km-icerik'); if (!ic) return;
    const liste = (_kmListe || []).map((k, i) => ({ ...k, i })).filter((k) => yuvaSp(k.g, k.ad) && yuvaOyuncuMu(k)); // i = _kmListe sırası (detay/seçim onu kullanır) · oyuncu: oyun hattı + elle eklenenler − çıkarılanlar
    if (typeof yzOku !== 'function' && typeof dagskEkYukle === 'function' && !window._yvYzIstendi) { window._yvYzIstendi = 1; dagskEkYukle('dagsk-km-yarisma-pro.js').then(() => { if (document.getElementById('yv-kok')) kmYuvaCiz(); }).catch(() => {}); } // yarışma şeridi için
    const durumlar = liste.map((k) => yuvaDurum(k.g, k.ad)), sinif = yuvaSinifDurum(liste, durumlar);
    const gorulen = yuvaGorulenAl(), yeniler = [], artilar = [];
    liste.forEach((k, j) => {
        const d = durumlar[j], anahtar = k.g + '|' + k.ad;
        if (!d.yok && gorulen[anahtar] !== undefined && d.adim > gorulen[anahtar]) yeniler.push(k.i);
        if (!d.yok) gorulen[anahtar] = d.adim;
        const isi = d.yok ? 0 : d.bugunIsi, onceki = _yvSonBugun[anahtar];
        if (onceki !== undefined && isi > onceki) artilar.push([k.i, isi - onceki]);
        _yvSonBugun[anahtar] = isi;
    });
    yuvaGorulenYaz(gorulen);
    let kok = document.getElementById('yv-kok');
    if (!kok || !ic.contains(kok)) { ic.innerHTML = '<div class="yv" id="yv-kok"></div>'; kok = document.getElementById('yv-kok'); }
    kok.className = 'yv ' + yuvaTema() + (_yvTv ? ' yv-tv' : '');
    const ust = `<div class="yv-ust"><div class="yv-logo">🥚<div>Yumurta Yuvası<small>${_yvTv ? 'Sınıf ekranı · seriler geldikçe kendiliğinden yenilenir' : 'Kendi rekorunu geç, yumurtan çatlasın'}</small></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${_yvTv ? '' : '<button class="yv-btn" onclick="yuvaNasil()">❓ Nasıl oynanır?</button>'}<button class="yv-btn" onclick="yuvaSporcular()">👥 Sporcular</button><button class="yv-btn" onclick="yuvaYarismayaGec(false)">🏆 Yarışma</button><button class="yv-btn${_yvTv ? ' birincil' : ''}" id="yv-tv-btn" onclick="yuvaTvDegis()">${_yvTv ? '🃏 Kartlara dön' : '📺 Sınıf ekranı'}</button><button class="yv-btn" onclick="yuvaTemaDegis()" title="Açık / koyu görünüm">${yuvaTema() === 'koyu' ? '☀️' : '🌙'}</button><button class="yv-btn" onclick="yuvaTamEkran()">🖥️ Tam ekran</button><button class="yv-btn" onclick="kmSekme('oyunlar')">← Oyunlar</button></div></div>` + yuvaYarismaHTML();
    if (!liste.length) kok.innerHTML = ust + '<p style="font-weight:800">Yumurtada oynayan sporcu yok. <button class="yv-btn birincil" onclick="yuvaSporcular()">👥 Sporcu ekle</button></p>';
    else if (_yvTv) kok.innerHTML = ust + `<div class="yv-tv-ana">${yuvaSinifHTML(sinif, 210, true)}<div class="yv-tv-izgara">${liste.map((k, j) => yuvaTvKartHTML(k, durumlar[j])).join('')}</div></div>`;
    else kok.innerHTML = ust + yuvaSinifHTML(sinif, 96) + `
      <div class="yv-kurallar"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div><div class="yv-kural">📋 Görev yap <b>+${YUVA_GOREV_ODUL}</b></div><div class="yv-kural nadir">⭐ Rekor seri → <b style="font-size:16px">Altın yumurta</b></div><div class="yv-kural nadir">💎 Ortalamanı 3 kez üst üste geç → <b style="font-size:16px">Elmas yumurta</b></div></div>
      <div class="yv-izgara">${liste.map((k, j) => yuvaKartHTML(k, durumlar[j])).join('')}</div>
      <p style="margin:0;font-weight:700;color:var(--soluk);font-size:13px">👆 Kartına dokun → serini buradan gir, görevlerini ve dostunu gör. Skor Gir, Oyunlar ya da Ok Partisi'nden girilen seriler de sayılır.</p>`;
    yeniler.forEach((i, j) => setTimeout(() => { const el = document.getElementById('yv-kart-' + i); if (el) { el.classList.add('yeni'); yuvaSes(880 + j * 60); } }, 300 + j * 350));
    artilar.forEach(([i, n]) => { const el = document.getElementById('yv-kart-' + i); if (el) { const a = document.createElement('span'); a.className = 'yv-arti'; a.textContent = '+' + n + ' 🔥'; el.appendChild(a); } });
    if (yeniler.length) yuvaUcan(yeniler.length > 1 ? '🐣 Yumurtalar ısındı!' : '🐣 Yumurta ilerledi!');
    _yvImza = yuvaImza(); yuvaPollBaslat();
    if (document.getElementById('yz-oyun-sayac') && typeof yzTimerBaslat === 'function') { try { yzTimerBaslat(); } catch (e) {} } // yarışma süresi şeritte işlesin
    if (liste.length) yuvaSinifKutla(sinif);
}
function yuvaTamEkran() { const el = document.getElementById('yv-kok'); if (!el) return; if (document.fullscreenElement) { document.exitFullscreen(); return; } const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { const r = f.call(el); if (r && r.catch) r.catch(() => {}); } }
function yuvaPencere(html) { document.querySelectorAll('.yv-katman').forEach((x) => x.remove()); /* aynı anda tek pencere */ const kok = document.getElementById('yv-kok') || document.body, k = document.createElement('div'); k.className = 'yv-katman'; k.innerHTML = `<div class="yv-pencere">${html}</div>`; k.addEventListener('click', (e) => { if (e.target === k) k.remove(); }); kok.appendChild(k); return k; }
let _yvSes = null; function yuvaSes(f = 700, d = 0.12) { try { _yvSes = _yvSes || new (window.AudioContext || window.webkitAudioContext)(); const o = _yvSes.createOscillator(), g = _yvSes.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.1, _yvSes.currentTime); g.gain.exponentialRampToValueAtTime(0.001, _yvSes.currentTime + d); o.connect(g).connect(_yvSes.destination); o.start(); o.stop(_yvSes.currentTime + d); } catch (e) {} }
function yuvaUcan(m) { const kok = document.getElementById('yv-kok'); if (!kok) return; const e = document.createElement('div'); e.className = 'yv-uc'; e.textContent = m; kok.appendChild(e); setTimeout(() => e.remove(), 1600); }
function yuvaNasil() {
    const k = yuvaPencere(`<h2>🥚 Nasıl oynanır?</h2>
      <div class="yv-buyuk">${yuvaYumurtaSVG('pembe', 0, 70)}${yuvaYumurtaSVG('mavi', 1, 70)}${yuvaYavruHTML('', 'yesil', 18, 70)}</div>
      <p style="font:800 19px var(--yvf-b);color:var(--yazi)">Ok attıkça yumurtan ısınır. Çatlar, içinden bir yavru çıkar, yavru büyüyünce albümüne girer!</p>
      <div class="yv-kurallar" style="justify-content:center"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div></div>
      <p style="font-weight:800;color:var(--altin-yazi,#8A5A00)">✨ Nadir yumurtalar: ⭐ rekor seri atarsan <b>altın yumurta</b>, ortalamanı 3 kez üst üste geçersen 💎 <b>elmas yumurta</b> kazanırsın. Daha hızlı ısınır, içinden PARLAK hayvan çıkar!</p>
      <p style="font-weight:800">📋 Her gün 3 <b>görev</b>: yaparsan +${YUVA_GOREV_ODUL} 🔥 · 🐾 Büyüyen hayvanını <b>dost</b> seç: her seri onu besler, Lv 5'e kadar çıkar, 🎀🧢🕶️👑 takar · 🏫 <b>Sınıf yuvası</b>: herkesin ateşi dev yumurtayı ısıtır!</p>
      <p style="font-weight:800">🎁 Sürprizler: bazen yumurtadan <b>ikiz</b> çıkar 👯, çatlayınca içinden <b>ipucu sesi</b> gelir 🔍, büyüyen hayvan sana <b>hediye</b> getirir 👑</p>
      <p style="font-size:13px">Küçükler daha çabuk: 7 yaş ve altında yumurta en hızlı, 10 yaş ve üstünde biraz daha geç çatlar.</p>
      <p>Başkasıyla değil, kendinle yarışırsın. Dünkü halini geçersen yumurtan daha hızlı ısınır. Albümde toplanacak ${yuvaHayvanlar().length} hayvan var!</p>
      <div><button class="yv-btn birincil" data-kapat="1">Tamam!</button></div>`);
    k.querySelector('[data-kapat]').onclick = () => k.remove();
}
function yuvaDetay(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    if (d.yok || d.secimGerek) return yuvaSecimAc(i);
    const ah = yuvaAlbumHayvanlar(d.album), sahip = new Set(ah.map((a) => a.no)), parlak = new Set(ah.filter((a) => yuvaNadirMi(a.renk)).map((a) => a.no));
    const hediye = {}; ah.forEach((a) => { if (a.hediye && !hediye[a.no]) hediye[a.no] = a.hediye; });
    const lvEt = (no) => { if (!sahip.has(no)) return ''; const lv = yuvaDostSeviye(d.yem[no]).lv; return no === d.dost || lv > 1 ? `<span class="yv-albumlv">${no === d.dost ? '🐾 ' : ''}Lv${lv}</span>` : ''; };
    const album = yuvaHayvanlar().map((h) => `<div class="${parlak.has(h.no) ? 'parlak' : sahip.has(h.no) ? '' : 'kapali'}" title="${sahip.has(h.no) ? esc(h.ad) : '?'}"><img src="${h.src}" alt="">${hediye[h.no] ? `<em class="yv-hediye">${hediye[h.no]}</em>` : ''}${lvEt(h.no)}</div>`).join('');
    const kalan = d.esik[d.evre === 0 ? 'catla' : d.evre === 1 ? 'yavru' : 'buyu'] - d.ilerleme;
    const sonraki = d.evre === 0 ? 'çatlamasına' : d.evre === 1 ? 'yavru çıkmasına' : 'büyümesine';
    const p = yuvaPencere(`<h2>${ad}${d.evre === 2 ? ' · ' + esc(yuvaHayvan(d.aktif.no).ad) : ''}</h2>
      <div class="yv-buyuk" id="yv-detay-gorsel">${yuvaGorselHTML(d, 130)}</div>
      <p style="font:800 20px var(--yvf-b);color:var(--yazi)">${YUVA_EVRE_AD[d.evre]}${d.evre === 2 && d.aktif.ikiz ? ' · 👯 İKİZ!' : ''} · ${sonraki} <span style="color:var(--ates)">🔥 ${kalan}</span> kaldı</p>
      ${d.evre === 1 ? `<p class="yv-ipucu buyuk">${esc(yuvaIpucu(d.aktif.no))}<br><small>Hangi hayvan olabilir? Tahmin et!</small></p>` : ''}
      ${yuvaPedHTML()}
      ${yuvaGorevHTML(d)}
      ${yuvaHakCipHTML(d.hak) ? `<p style="font:800 15px var(--yvf-g);color:var(--altin-yazi,#8A5A00)">Kazandığın nadir yumurta: ${yuvaHakCipHTML(d.hak)} · bu yumurta büyüyünce seçebilirsin!</p>` : `<p style="font-size:13px">💎 Elmas yumurtaya ${3 - (d.zincir || 0)} seri kaldı (ortalamanı üst üste geç) · ⭐ Rekor seri atarsan altın yumurta!</p>`}
      <div class="yv-satir"><div><b>${d.bugunKural.seri}</b>bugün seri</div><div><b>${d.bugunKural.hepsi}</b>hepsi hedefte</div><div><b>${d.bugunKural.gecti}</b>rekorunu geçti</div></div>
      ${yuvaDostHTML(d)}
      <p style="font:800 16px var(--yvf-b);color:var(--yazi)">🐾 Albüm · ${sahip.size}/${yuvaHayvanlar().length}${parlak.size ? ` · ✨ parlak ${parlak.size}` : ''}</p>
      <div class="yv-album">${album}</div>
      <div><button class="yv-btn birincil" data-kapat="1">Kapat</button></div>`);
    p.querySelector('[data-kapat]').onclick = () => p.remove();
    p.querySelectorAll('[data-dost-sec]').forEach((b) => b.onclick = () => yuvaDostSecAc(i));
    yuvaPedBagla(p, k, i);
}
// ---- KIRILMA ANİMASYONU (kullanıcı: "animasyon ile kırılabilir"). tip: 'catla' | 'yavru' | 'buyu'.
// Tam ekranda da görünsün diye fullscreenElement'e (yoksa body'ye) eklenir; dokununca ya da süre bitince kapanır.
function yuvaKirilma(tip, renk, no, isim, bitince, ikizNo, hediye) {
    const kok = document.fullscreenElement || document.body, h = yuvaHayvan(no), parlak = yuvaNadirMi(renk), h2 = ikizNo ? yuvaHayvan(ikizNo) : null;
    const yumurta = yuvaYumurtaSVG(renk, tip === 'catla' ? 0 : 1, 180, true); // kırılırken yuvasız (yarımlar uçar)
    const adlar = h.ad.toLocaleUpperCase('tr-TR') + (h2 ? ' VE ' + h2.ad.toLocaleUpperCase('tr-TR') : '');
    const yazi = tip === 'catla' ? '🥚 ÇATLIYOR!' : tip === 'yavru' ? (h2 ? `👯 İKİZ! ${adlar} ÇIKTI!` : `🐣 ${parlak ? 'PARLAK ' : ''}${adlar} ÇIKTI!`) : `🎉 ${adlar} BÜYÜDÜ!`;
    const altYazi = tip === 'catla' ? yuvaIpucu(no) : tip === 'buyu' && hediye ? `🎁 Hediye getirdi: ${hediye}` : '';
    const e = document.createElement('div'); e.className = 'yv-sahne yv-s-' + tip;
    e.innerHTML = `<div class="yv-sahne-ic">
        <div class="yv-isinlar"></div>
        ${tip === 'buyu' ? '' : `<div class="yv-kirik ust">${yumurta}</div><div class="yv-kirik alt">${yumurta}</div>`}
        ${tip === 'catla' ? '<svg class="yv-catlak-ciz" viewBox="0 0 92 110" width="180" height="216"><path d="M22 46 L31 40 L37 48 L45 41 L52 49 L60 42 L70 47" fill="none" stroke="#5A3A2A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>' : `<div class="yv-firla${parlak ? ' yv-parlak' : ''}${h2 ? ' ikiz' : ''}"><img src="${h.src}" alt="">${h2 ? `<img src="${h2.src}" alt="">` : ''}</div>`}
        <div class="yv-sahne-yazi">${esc(yazi)}${altYazi ? `<small>${esc(altYazi)}</small>` : ''}</div><div class="yv-sahne-isim">${esc(isim)}</div>
        ${Array.from({ length: 14 }, (_, j) => `<i class="yv-yildiz" style="--a:${j * 360 / 14}deg;--d:${120 + (j % 3) * 50}px">${['⭐', '✨', '💛'][j % 3]}</i>`).join('')}
      </div>`;
    kok.appendChild(e);
    [0, 140, 280].forEach((t, j) => setTimeout(() => yuvaSes(520 + j * 90, 0.06), t));
    setTimeout(() => { yuvaSes(tip === 'catla' ? 330 : 990, 0.18); setTimeout(() => yuvaSes(tip === 'catla' ? 440 : 1318, 0.25), 140); }, 1100);
    let kapandi = false; const kapat = () => { if (kapandi) return; kapandi = true; e.classList.add('kapan'); setTimeout(() => { e.remove(); if (bitince) bitince(); }, 300); };
    e.addEventListener('click', kapat); setTimeout(kapat, tip === 'catla' ? 2600 : 3600);
}
// ---- Skor pedi: 3 ok gir → gerçek seri (_skorKaydetCekirdek; limit dolarsa onayIste ile uzatma) → yumurta ısınır.
const YUVA_PED = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
const YUVA_PED_RENK = { X: '#FFD23F', '10': '#FFD23F', '9': '#FFD23F', '8': '#EF3B4A', '7': '#EF3B4A', '6': '#3D8BFF', '5': '#3D8BFF', '4': '#1E1B2E', '3': '#1E1B2E', '2': '#F2F0F7', '1': '#F2F0F7', M: '#8A8699' };
const yuvaPedYazi = (v) => ['X', '10', '9', '2', '1'].includes(v) ? '#2A1E00' : '#fff';
function yuvaPedHTML() {
    return `<div class="yv-ped-kutu"><div class="yv-ped-baslik">🏹 Serini gir, yumurtanı ısıt!</div>
      <div class="yv-slotlar" data-slotlar>${[0, 1, 2].map(() => '<span></span>').join('')}</div>
      <div class="yv-ped">${YUVA_PED.map((v) => `<button data-ok="${v}" style="background:${YUVA_PED_RENK[v]};color:${yuvaPedYazi(v)}">${v}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="yv-btn" data-sil="1">Son oku sil</button><button class="yv-btn birincil" data-kaydet="1" disabled>🔥 Kaydet</button></div></div>`;
}
function yuvaPedBagla(p, k, i) {
    const oklar = [], slot = p.querySelector('[data-slotlar]'), kaydet = p.querySelector('[data-kaydet]');
    const ciz = () => { slot.innerHTML = [0, 1, 2].map((j) => oklar[j] !== undefined ? `<span style="background:${YUVA_PED_RENK[oklar[j]]};color:${yuvaPedYazi(oklar[j])};border-style:solid">${oklar[j]}</span>` : '<span></span>').join(''); kaydet.disabled = oklar.length < 3; p.querySelectorAll('[data-ok]').forEach((b) => b.disabled = oklar.length >= 3); };
    p.querySelectorAll('[data-ok]').forEach((b) => b.onclick = () => { if (oklar.length >= 3) return; oklar.push(b.dataset.ok); yuvaSes(500 + yuvaDeger(b.dataset.ok) * 40, 0.05); ciz(); });
    p.querySelector('[data-sil]').onclick = () => { oklar.pop(); ciz(); };
    kaydet.onclick = () => {
        if (oklar.length < 3) return;
        const once = yuvaDurum(k.g, k.ad), kayit = oklar.map((v) => ({ puan: v }));
        window._yuvaPedKayitT = Date.now(); // kanca (yuvaSeriSonrasi) animasyonu ikinci kez oynatmasın
        let sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit);
        const bitti = () => {
            if (!sonuc.ok) { showToast('Seri kaydedilemedi.', 'error'); return; }
            try { klasmanDoldur(); } catch (e) {}
            try { otomatikYoklamaIsaretle(k.ad, k.g); } catch (e) {}
            const simdi = yuvaDurum(k.g, k.ad), kazanc = simdi.toplam - once.toplam, isim = typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad;
            p.remove(); yuvaKivilcim();
            if (simdi.adim !== once.adim && once.aktif) {
                const tip = simdi.tamam > once.tamam ? 'buyu' : simdi.evre === 2 ? 'yavru' : 'catla';
                setTimeout(() => yuvaKirilma(tip, once.aktif.renk, once.aktif.no, isim, () => yuvaDetay(i), once.aktif.ikiz, once.aktif.hediye), 150);
            } else setTimeout(() => { yuvaDetay(i); yuvaUcan(`🔥 +${kazanc}`); }, 120);
        };
        if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
            onayIste(esc(k.ad) + ' için günlük seri limiti (' + sonuc.limit + ') doldu.<br><br>Seriyi uzatıp bu skoru kaydedeyim mi?', () => {
                sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
                try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
                try { if (typeof bulutaGonderKontrol === 'function') bulutaGonderKontrol(); } catch (e) {}
                sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit); bitti();
            }, 'Devam Et');
            return;
        }
        bitti();
    };
    ciz();
}
function yuvaSecimAc(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    const uc = YUVA_RENK.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const sonAlbum = d.album && d.album.length ? d.album[d.album.length - 1] : null, yeniGelen = sonAlbum ? yuvaHayvan(sonAlbum.no) : null, yeniParlak = sonAlbum && yuvaNadirMi(sonAlbum.renk), yeniIkiz = sonAlbum && sonAlbum.ikiz ? yuvaHayvan(sonAlbum.ikiz) : null;
    const nadirler = Object.keys(YUVA_NADIR).filter((k) => d.hak && d.hak[k] > 0);
    const p = yuvaPencere(`${yeniGelen ? `<div class="yv-buyuk"><span class="${yeniParlak ? 'yv-parlak' : ''}"><img src="${yeniGelen.src}" alt="" style="width:120px;height:120px;object-fit:contain"></span>${yeniIkiz ? `<span class="${yeniParlak ? 'yv-parlak' : ''}"><img src="${yeniIkiz.src}" alt="" style="width:110px;height:110px;object-fit:contain"></span>` : ''}${sonAlbum.hediye ? `<em class="yv-hediye buyuk">${sonAlbum.hediye}</em>` : ''}</div><h2>🎉 ${yeniParlak ? 'Parlak ' : ''}${esc(yeniGelen.ad)}${yeniIkiz ? ' ve ' + esc(yeniIkiz.ad) : ''} büyüdü!</h2><p>${sonAlbum.hediye ? `🎁 Sana bir hediye getirdi: <b style="font-size:22px">${sonAlbum.hediye}</b> · ` : ''}Albümüne girdi. Şimdi yeni bir yumurta seç.</p>` : `<h2>${ad}, yumurtanı seç!</h2><p>İçinden hangi hayvan çıkacak? Sürpriz! 🤫</p>`}
      ${nadirler.length ? '<p style="font:800 16px var(--yvf-b);color:var(--altin-yazi,#8A5A00)">✨ Nadir yumurta hakkın var! İçinden PARLAK hayvan çıkar.</p>' : ''}<div class="yv-secim">${nadirler.map((k) => `<button data-renk="${k}" aria-label="${YUVA_NADIR[k].ad}">${yuvaYumurtaSVG(k, 0, 100)}<span class="yv-nadir-etk">${YUVA_NADIR[k].ikon} ${YUVA_NADIR[k].ad}</span></button>`).join('')}${uc.map((r) => `<button data-renk="${r.id}" aria-label="${r.id} yumurta">${yuvaYumurtaSVG(r.id, 0, 90)}</button>`).join('')}</div>`);
    p.querySelectorAll('[data-renk]').forEach((b) => b.onclick = () => { yuvaYumurtaSec(k.g, k.ad, b.dataset.renk); yuvaSes(990); p.remove(); kmYuvaCiz(); yuvaUcan('🥚 Yumurta yuvada!'); setTimeout(() => yuvaDetay(i), 700); });
}
// Her gerçek seriden sonra (app.js _skorKaydetCekirdek): evre değiştiyse kutla.
function yuvaSeriSonrasi(g, ad) {
    const sp = yuvaSp(g, ad); if (!sp || !yuvaKayit(sp)) return;
    const once = yuvaDurum(g, ad, 1), simdi = yuvaDurum(g, ad);
    const isim = typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : ad;
    Object.keys(YUVA_NADIR).forEach((k, j) => { if ((simdi.hak[k] || 0) > (once.hak[k] || 0)) setTimeout(() => { try { showToast(`${YUVA_NADIR[k].ikon} ${isim} ${YUVA_NADIR[k].ad.toLocaleLowerCase('tr-TR')} kazandı!`, 'success'); } catch (e) {} yuvaSes(1318, 0.2); }, 900 + j * 900); });
    (simdi.gorevler || []).forEach((x, j) => { if (x.tamam && !((once.gorevler || [])[j] || {}).tamam) setTimeout(() => { try { showToast(`✅ ${isim}: görev tamam — ${x.metin} (+${YUVA_GOREV_ODUL} 🔥)`, 'success'); } catch (e) {} yuvaSes(1175, 0.15); }, 500 + j * 700); });
    if (simdi.dost && simdi.dost === once.dost) { const a = yuvaDostSeviye(once.yem[once.dost]).lv, b = yuvaDostSeviye(simdi.yem[simdi.dost]).lv; if (b > a) setTimeout(() => { try { showToast(`⬆️ ${isim}'in dostu ${yuvaHayvan(simdi.dost).ad} Lv ${b} oldu! ${YUVA_DOST_AKS[b] || ''} ${YUVA_DOST_AKS_AD[b] || ''}`, 'success'); } catch (e) {} yuvaSes(1318, 0.2); }, 1300); }
    if (simdi.adim === once.adim) { if (_kmAktifSekme === 'yuva') kmYuvaCiz(); return; }
    let m = '';
    if (simdi.tamam > once.tamam) { const sa = simdi.album[simdi.album.length - 1]; m = `🎉 ${isim}: ${yuvaNadirMi(sa.renk) ? '✨ parlak ' : ''}${yuvaHayvan(sa.no).ad} büyüdü, albüme girdi!`; }
    else if (simdi.evre === 2) m = simdi.aktif.ikiz ? `👯 İKİZ! ${isim}'in yumurtasından ${yuvaHayvan(simdi.aktif.no).ad} ve ${yuvaHayvan(simdi.aktif.ikiz).ad} çıktı!` : `🐣 ${isim}'in yumurtasından ${yuvaHayvan(simdi.aktif.no).ad} çıktı!`;
    else if (simdi.evre === 1) m = `🥚 ${isim}'in yumurtası çatlıyor!`;
    if (m) { try { showToast(m, 'success'); } catch (e) {} yuvaSes(1046, 0.18); }
    if (_kmAktifSekme === 'yuva' && !document.querySelector('.yv-katman,.yv-sahne') && once.aktif && !(Date.now() - (window._yuvaPedKayitT || 0) < 3000)) {
        const tip = simdi.tamam > once.tamam ? 'buyu' : simdi.evre === 2 ? 'yavru' : 'catla';
        setTimeout(() => yuvaKirilma(tip, once.aktif.renk, once.aktif.no, isim, null, once.aktif.ikiz, once.aktif.hediye), 250);
    }
    if (_kmAktifSekme === 'yuva') kmYuvaCiz();
}
window.yuvaSeriSonrasi = yuvaSeriSonrasi;
