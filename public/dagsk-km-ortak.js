// ============================================================================================
// Karışık Sınıf — ORTAK DERS (2026-09-29, kullanıcı: "oluşturulan ortak sınıflar herhangi bir PC,
// telefon ya da tabletten girilse ortak çalışabilsin")
//
// Eskiden bir konumdaki dersin SADECE sporcu listesi sunucudaydı; oyun ilerlemesi, takımlar, karakterler,
// lig, Canavar/Kule/Kayıp Ada, ders akışı, yarışma kurulumu… hepsi o cihazın localStorage'ındaydı. İkinci
// cihaz aynı derse girince sporcuları görüyor ama oyunun durumunu göremiyordu.
//
// Nasıl çalışır:
//  - Konuma ait her yerel kayıt ('dag_km_<ne>_<konum>') paylaşılır; sadece bu cihazın EKRAN tercihleri
//    (skor paneli konumu/boyutu, kamera kilidi, ses, efekt, kart konumu, yan panel) cihazda kalır.
//  - localStorage.setItem/removeItem sarılır: paylaşılan bir kayıt değişince 0,6 sn sonra sunucuya gider.
//  - Nesne değerleri ALT GİRDİ bazında (ör. her sporcu "grup|ad" ayrı) karşılaştırılır — iki cihaz
//    aynı anda farklı sporculara skor girerse ikisi de korunur. Aynı girdide en yeni zaman kazanır
//    (sunucuda tek UPSERT ... WHERE t daha yeni, bkz. src/routes/kmOrtak.ts).
//  - Başka cihaz yazınca WebSocket ile anında (yedek olarak 12 sn'de bir) çekilir, yerel kayda yazılır,
//    bellek önbellekleri sıfırlanır, açık ekran yeniden çizilir. Koç o an skor giriyorsa / bir alana
//    yazıyorsa yeniden çizim bekletilir, kimsenin elinden ekran alınmaz.
//  - Çevrimdışıyken yapılanlar kuyrukta kalır, bağlantı gelince gönderilir.
// ============================================================================================
(function () {
    const YEREL_KALAN = /^dag_km_(dok|ykskart|railkucuk|kamerakilit|sesli|dramatik)/;
    const TAM_CIZIM = /^dag_km_(takimmodu|coklutakimlar|coklu|lig|adil|yukselen|temagecmisi|oyun_sayac|pistuzunluk|liste|yarisma_kurulum)_/;
    const AYRAC = '\u0001';
    const orjSet = Storage.prototype.setItem, orjSil = Storage.prototype.removeItem;
    let O = null;            // { konum, son: {id:{d,t}}, s, bekleyen: {id:{a,alt,d,t}} }
    let uyguluyor = false, kirli = new Set(), zamanlayici = null, calisiyor = false, tekrarGerek = false;
    let bekleyenYenile = new Set(), yenileZaman = null;

    function konum() { try { return _kmAktifKonum || null; } catch (e) { return null; } }
    function platformAcik() { let p = document.getElementById('karisik-platform'); return !!(p && p.style.display !== 'none' && p.style.display !== ''); }
    function paylasimli(k, kn) { kn = kn || konum(); return !!kn && typeof k === 'string' && k.indexOf('dag_km_') === 0 && k.slice(-(kn.length + 1)) === '_' + kn && !YEREL_KALAN.test(k); }
    function cihaz() { try { return (typeof _cihazId !== 'undefined' && _cihazId) || localStorage.getItem('dag_cihaz_id') || null; } catch (e) { return null; } }
    function depoAnahtar(kn) { return 'km_ortak_yerel_' + kn; }
    function kaydet() { if (!O) return; try { orjSet.call(localStorage, depoAnahtar(O.konum), JSON.stringify({ son: O.son, s: O.s, bekleyen: O.bekleyen })); } catch (e) {} }
    function hazirla() {
        let kn = konum(); if (!kn) return false;
        if (O && O.konum === kn) return true;
        let d = null; try { d = JSON.parse(localStorage.getItem(depoAnahtar(kn)) || 'null'); } catch (e) {}
        O = { konum: kn, son: (d && d.son) || {}, s: (d && d.s) || 0, bekleyen: (d && d.bekleyen) || {}, ilk: !d };
        kirli = new Set(); bekleyenYenile = new Set();
        return true;
    }

    // ---- yerel yazmaları yakala
    Storage.prototype.setItem = function (k, v) {
        orjSet.call(this, k, v);
        if (this === localStorage && !uyguluyor && paylasimli(k)) { kirli.add(k); zamanla(600); }
    };
    Storage.prototype.removeItem = function (k) {
        orjSil.call(this, k);
        if (this === localStorage && !uyguluyor && paylasimli(k)) { kirli.add(k); zamanla(600); }
    };

    // Değeri alt girdilere ayır: düz nesne → her anahtar ayrı; diğer her şey (dizi, sayı, metin) → tek girdi ('').
    function ayristir(ham) {
        if (ham === null) return {};
        if (ham.charAt(0) === '{') { try { let o = JSON.parse(ham); if (o && typeof o === 'object' && !Array.isArray(o)) { let r = {}; Object.keys(o).forEach(function (x) { r[x] = JSON.stringify(o[x]); }); return r; } } catch (e) {} }
        return { '': ham };
    }
    function altlar(a) { let on = a + AYRAC, r = []; Object.keys(O.son).forEach(function (id) { if (id.indexOf(on) === 0) r.push(id.slice(on.length)); }); return r; }
    function farkTopla(anahtarlar, eskiZaman) {
        let simdi = Date.now();
        anahtarlar.forEach(function (a) {
            let yeni = ayristir(localStorage.getItem(a)), gorulen = {};
            Object.keys(yeni).forEach(function (alt) {
                gorulen[alt] = 1; let id = a + AYRAC + alt, e = O.son[id];
                if (e && e.d === yeni[alt]) return;
                let t = eskiZaman ? 1 : Math.max(simdi, e ? e.t + 1 : 0);
                O.son[id] = { d: yeni[alt], t: t }; O.bekleyen[id] = { a: a, alt: alt, d: yeni[alt], t: t };
            });
            altlar(a).forEach(function (alt) {
                if (gorulen[alt]) return; let id = a + AYRAC + alt, e = O.son[id];
                if (!e || e.d === null) return;
                let t = eskiZaman ? 1 : Math.max(simdi, e.t + 1);
                O.son[id] = { d: null, t: t }; O.bekleyen[id] = { a: a, alt: alt, d: null, t: t };
            });
        });
    }
    function yenidenKur(a) {
        let alt = altlar(a), nesne = null;
        alt.forEach(function (x) { if (x === '') return; let e = O.son[a + AYRAC + x]; if (e && e.d !== null) { nesne = nesne || {}; try { nesne[x] = JSON.parse(e.d); } catch (er) {} } });
        uyguluyor = true;
        try {
            if (nesne) orjSet.call(localStorage, a, JSON.stringify(nesne));
            else { let e = O.son[a + AYRAC]; if (e && e.d !== null) orjSet.call(localStorage, a, e.d); else orjSil.call(localStorage, a); }
        } catch (er) {} finally { uyguluyor = false; }
    }
    // korunan: ilk katılımda bu cihazda zaten dolu olan kayıtlar — başka bir cihazın ilk katılımda gönderdiği
    // tohum (t=1) bunların üzerine yazmaz; sadece gerçek bir değişiklik (t = o anki zaman) yazar.
    function uzakUygula(girdiler, korunan) {
        let degisen = new Set();
        (girdiler || []).forEach(function (g) {
            if (g.s > O.s) O.s = g.s;
            if (!paylasimli(g.a, O.konum)) return;
            let id = g.a + AYRAC + (g.alt || ''), e = O.son[id];
            if (e && g.t <= e.t) return;
            if (korunan && g.t <= 1 && korunan.has(g.a)) return;
            O.son[id] = { d: g.d, t: g.t };
            let b = O.bekleyen[id]; if (b && b.t <= g.t) delete O.bekleyen[id];
            degisen.add(g.a);
        });
        degisen.forEach(yenidenKur);
        return degisen;
    }

    // ---- ana döngü: yerel farkı topla → sunucudan çek → bekleyenleri gönder
    function zamanla(ms) { clearTimeout(zamanlayici); zamanlayici = setTimeout(dongu, ms); }
    async function dongu() {
        // Ekran kapalıyken de bekleyen yerel değişiklik varsa gönderilir (ör. "Dersi Bitir" listeyi silip ekranı hemen kapatıyor).
        if (!hazirla()) return;
        if (!platformAcik() && !kirli.size && !Object.keys(O.bekleyen).length) return;
        if (calisiyor) { tekrarGerek = true; return; }
        calisiyor = true; tekrarGerek = false;
        let kn = O.konum;
        try {
            if (!O.ilk) { farkTopla(kirli); kirli.clear(); }
            let r = await fetch('/api/km-ortak/' + encodeURIComponent(kn) + '?s=' + Math.max(0, O.ilk ? 0 : O.s - 5000));
            if (!r.ok) throw new Error('çekme ' + r.status);
            let veri = await r.json();
            if (!O || O.konum !== kn) return;
            let yerel = [];
            if (O.ilk) for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (paylasimli(k, kn)) yerel.push(k); }
            let degisen = uzakUygula(veri.girdiler, O.ilk ? new Set(yerel) : null);
            if (O.ilk) {
                // İlk katılım: sunucudaki GERÇEK değişiklikler esas alınır. Bu cihazdaki kayıtlar en eski zamanla
                // (t=1, "tohum") gönderilir — boşluk doldurur ama hiçbir gerçek değişikliğin üzerine yazamaz.
                farkTopla(yerel, true); kirli.clear(); O.ilk = false;
            }
            if (degisen.size) yenile(degisen);
            let gidecek = Object.keys(O.bekleyen).map(function (id) { return O.bekleyen[id]; });
            for (let i = 0; i < gidecek.length; i += 300) {
                let parca = gidecek.slice(i, i + 300);
                let p = await fetch('/api/km-ortak/' + encodeURIComponent(kn), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cihaz: cihaz(), girdiler: parca }) });
                if (!p.ok) throw new Error('gönderme ' + p.status);
                parca.forEach(function (g) { let id = g.a + AYRAC + g.alt, b = O.bekleyen[id]; if (b && b.t === g.t) delete O.bekleyen[id]; });
            }
        } catch (e) { /* çevrimdışı/geçici hata: kuyruk kalıcı, sonraki turda yeniden denenir */ }
        finally { kaydet(); calisiyor = false; if (tekrarGerek) zamanla(300); }
    }

    // ---- uzaktan gelen değişikliği ekrana yansıt
    function mesgul() {
        try {
            if (_kmOyunKilit || (_kmOyunSeriGirisleri && _kmOyunSeriGirisleri.length)) return true;
            if (_kmAktifSekme === 'reaksiyon') return true;
            let a = document.activeElement;
            if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest('#karisik-platform')) return true;
        } catch (e) {}
        return false;
    }
    const ONBELLEK = ['_kmOyunYuklenenKonum', '_kmFutbolTakimYuklenenKonum', '_kmTakimYuklenenKonum', '_kmOyunCokluYuklenenKonum',
        '_kmOyunHayvanKarakterYuklenenKonum', '_kmSisKesiflerYuklenenKonum', '_kmSisGunlukYuklenenKonum', '_kmGizliKelimeYuklenenKonum',
        '_kmKuleYuklenenKonum', '_kmKuleRekorYuklenenKonum', '_kmCanavarYuklenenKonum', '_kmCanavarRekorYuklenenKonum',
        '_kmOyunAmblemYuklenenKonum', '_kmYksYuklenenKonum', '_kmYksKaliciYuklenenKonum', '_kmRfxYuklenenKonum', '_kmKkGunlukYuklenenKonum'];
    function onbellekSifirla(degisen) {
        ONBELLEK.forEach(function (v) { try { (0, eval)(v + ' = "__ortak__"'); } catch (e) {} });
        try { if (!_kmOyunSayacTimerId) _kmOyunSayacYuklenenKonum = '__ortak__'; } catch (e) {}
        try { _kmKelimeYuklenenKonum = '__yuklenmedi__'; } catch (e) {}
        try { if (!_kmRtGiris) _kmRt = null; } catch (e) {}
        if ([...degisen].some(function (k) { return k.indexOf('dag_km_yarisma_kurulum_') === 0; })) { try { _kmYarismaKurulumYukle(); } catch (e) {} }
    }
    function yenile(degisen) {
        degisen.forEach(function (k) { bekleyenYenile.add(k); });
        clearTimeout(yenileZaman);
        if (mesgul()) { yenileZaman = setTimeout(function () { yenile(new Set()); }, 1500); return; }
        let ks = bekleyenYenile; bekleyenYenile = new Set();
        if (!ks.size || !platformAcik()) return;
        let listeK = 'dag_km_liste_' + O.konum;
        if (ks.has(listeK)) {
            let l = []; try { l = JSON.parse(localStorage.getItem(listeK) || '[]') || []; } catch (e) {}
            if (!l.length) {
                // Ders başka bir cihazda "Dersi Bitir" ile kapatıldı.
                try { _kmListe = []; _kmSecimler = {}; document.getElementById('karisik-platform').style.display = 'none'; kmDevamBanneriGuncelle(); } catch (e) {}
                try { showToast('Bu ders başka bir cihazda bitirildi.', 'warning'); } catch (e) {}
                return;
            }
            try { _kmListe = l; _kmSecimler = {}; l.forEach(function (s) { _kmSecimler[s.g + '_' + s.ad] = s; }); } catch (e) {}
        }
        onbellekSifirla(ks);
        try { kmSinifKartiCiz(); kmAracIzgaraCiz(); } catch (e) {}
        let ic = document.getElementById('km-icerik'); if (!ic || ic.style.display === 'none') return;
        try {
            if (_kmAktifSekme === 'oyunlar') {
                if ([...ks].some(function (k) { return TAM_CIZIM.test(k); })) kmOyunlarCiz();
                else { kmOyunDurumEmin(); kmOyunRosterYenile(); kmOyunSahneKurAktif(); kmOyunChipleriCiz(); kmOyunLiderCiz(); }
            } else kmSekme(_kmAktifSekme);
        } catch (e) { console.warn('km-ortak yenileme', e); }
    }

    // ---- tetikleyiciler
    function kur() {
        if (!window.dagskSync || !window.dagskSync.kmOrtakDinle) return setTimeout(kur, 500);
        window.dagskSync.kmOrtakDinle(function (p) { if (p && O && p.konum === O.konum) zamanla(150); });
    }
    kur();
    setInterval(function () { if (platformAcik()) dongu(); }, 12000);
    window.addEventListener('online', function () { zamanla(200); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) zamanla(200); });
    // Platform açıldığı an ilk senkron (kmPlatformGoster her giriş yolunun ortak noktası).
    function platformKanca() {
        if (typeof kmPlatformGoster !== 'function') return setTimeout(platformKanca, 300);
        let eski = kmPlatformGoster;
        kmPlatformGoster = function () { let r = eski.apply(this, arguments); zamanla(50); return r; };
    }
    platformKanca();
    window.kmOrtakDurum = function () { return O ? { konum: O.konum, s: O.s, girdi: Object.keys(O.son).length, bekleyen: Object.keys(O.bekleyen).length } : null; };
})();
