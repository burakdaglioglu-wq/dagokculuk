/* ================================================================================================
   🧟 ZOMBİ SALGINI — Karışık Sınıf › Oyunlar teması 'zombi' (2026-11-06, v381). Son Üs'ün yerine. Kullanıcı Son Üs için "çok kötü, yeni oyun yap" dedi,
   dört farklı oyundan bunu seçti. Teşhis: bütün oyunlar "ok at, can düşsün"; burada can barı yok, ekrandaki kalabalık değişir.
   OYUN: herkes ekranda kendi karakteriyle. Birkaç çocuk zombi başlar. Ok "panzehir" ise (çocuğun KENDİ seviyesine göre) bir zombi iyileşir; zombi çocuk
     önce kendini iyileştirir. Belirli aralıkla zombiler ısırır. Herkes atınca sağlam çoğunluktaysa salgın durur.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz (zombi kalmazsa yeni dalga gelir); suç çocuğa yüklenmez: ısırık atan çocuğa değil, sırası gelen kalabalığa;
     tur sırasında puan sıralaması yok; finalde herkesin adı, son atan kahraman değil; koçta "Hep birlikte bitir".
   GÖRÜNÜM (2026-11-07, v383; kullanıcı: "zombi görünümünü daha iyi yapmalıyız", iki canlı taslaktan B "Son barikat"ı seçti): gece sokağı; zombiler barikatın arkasında, sağlamlar önünde.
     Isırılan çocuk barikatı geçer, kurtulan geri koşar. Karakterler piksel, sağlamın elinde yay; tişört rengi zombi olunca solgun kalır. Kurallar değişmedi. Kişiler DOM'da (data-km-sporcu), konum left/top ile: button:active transform'u bozmasın.
   ANLAR (v384): ısırıkta sokaktan ADSIZ bir zombi atlar (STANDING: ısıran hiçbir çocuk değil), panzehir parlayan ok + patlama, sentez zombi sesleri, final sahnesi (kazanınca güneş doğar, son zombiler de iyileşir; kaybedince barikat yıkılır, kızıl gök).
   KABUK: skor girişi Oyunlar'ın dock'u. zbSahneKur · zbGuncelle · zbSeri(s, i, kaydedilecek, done) · zbAnlik · zbGeriYukle · zbSporcu · zbAyarUygula · zbFinalZorla.
   Durum 'dag_km_zombi_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('zombi', k); } catch (e) { return true; } };
    const renk = (i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk('zombi', i) : '#5FD4FF');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_zombi_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');

    /* ---- kurallar (saf) ---- */
    const ISIRIK_ARALIK = 1; // simülasyon: her atışta 1 ısırık, 8-24 çocukta aynı dengeyi veriyor (ok başı %40 iyi atış: ~%80 kazanma, kalabalığın ~%40'ı zombi; kötü gün ~%20)
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca panzehir
    function panzehirSay(puanlar, esik) { return puanlar.filter((p) => p >= esik).length; }
    function baslangicSay(n) { return Math.max(1, Math.round(n / 6)); }
    function isirikSay() { return 1; }
    function kazandi(z, n) { return z < n - z; }
    // Seri sonucu: { iyilesen: [...], isirilan: [...], dalga: bool, atlandi: bool }. secici(dizi) rastgele seçim (test sabitler).
    // opt (v401, hepsi isteğe bağlı): ekKurtar = bu seride fazladan kurtulan (süper panzehir, zincir, şişe), isirikAtla = bu seride ısırık yok
    // (ışık bombası, projektör, tipi), ekIsirik = fazladan ısırık (koşucu, karanlık, dev zombi). opt yoksa kurallar v381 ile aynı.
    function adimHesapla(st, key, puanlar, esik, herkes, secici, dalgaAcik, opt) {
        opt = opt || {};
        const r = { iyilesen: [], isirilan: [], dalga: false, atlandi: false, panzehir: panzehirSay(puanlar, esik) };
        let hak = r.panzehir > 0 ? 1 + (opt.ekKurtar || 0) : 0; // normalde bir seride en çok bir kişi: oyunu tek çocuk bitiremesin
        if (hak && st.zombi[key]) { r.iyilesen.push(key); hak--; }
        if (hak) { const adaylar = herkes.filter((k) => st.zombi[k] && !r.iyilesen.includes(k)).sort((a, b) => (st.zamani[a] || 0) - (st.zamani[b] || 0)); r.iyilesen.push(...adaylar.slice(0, hak)); }
        r.iyilesen.forEach((k) => { delete st.zombi[k]; delete st.zamani[k]; });
        st.seri = (st.seri || 0) + 1;
        if (opt.isirikAtla) { r.atlandi = true; return r; }
        if (st.seri % ISIRIK_ARALIK === 0) {
            const z = herkes.filter((k) => st.zombi[k]).length;
            if (z === 0) { if (dalgaAcik && herkes.length > 1) { r.dalga = true; const a = herkes.filter((k) => !r.iyilesen.includes(k)); const k = secici(a.length ? a : herkes); if (k) { r.isirilan.push(k); st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; } } }
            else {
                let bos = herkes.filter((k) => !st.zombi[k] && !r.iyilesen.includes(k));
                for (let i = isirikSay(z) + (opt.ekIsirik || 0); i > 0 && bos.length; i--) { // en az ısırılan öncelikli: hep aynı çocuk zombi olmasın
                    const en = Math.min(...bos.map((k) => st.isirik[k] || 0)), k = secici(bos.filter((x) => (st.isirik[x] || 0) === en));
                    st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; r.isirilan.push(k); bos = bos.filter((x) => x !== k);
                }
            }
        }
        return r;
    }
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- Zombi 2.0 (v401, 2026-11-10; kullanıcı ilk gerçek dersten sonra: "çok sevdiler, zor olması da hoştu" → sunumdaki 6 fikrin hepsi) ----
       1 GECELER: sınıf her oyunda bir sonraki geceyi oynar (kazanınca yeni gece açılır, kaybedince aynı gece). Her gece tek yenilik.
       2 ÖZEL OKLAR: süper panzehir (X/10, çocuk başı oyunda bir kez, 2 kişi), ışık bombası (serinin 3 oku da panzehir → bu seride ısırık yok),
         zincir (art arda 3 çocuk panzehir → +1 kurtulan, üç adın hepsi). 3 DEV ZOMBİ: son turda sınıfın yarısı atınca gelir; her panzehir kalbinde
         çatlak; SADECE herkes atınca düşer ya da barikatı aşar (STANDING). 4 ZOMBİ ÇOCUĞUN İŞİ: koro, kurtulma pozu, isteğe bağlı 10 sn yürüyüş.
       5 SIĞINAK: kazanılan gece sayısıyla parçalar açılır; kalıcı (12 saat kuralına girmez: dag_km_zombikamp_<konum>). 6 SAHNELER: sokak, lunapark,
         hastane, kar; her biri tek küçük kural. Hiçbir yenilik bir çocuğa suç yüklemez: ek ısırıklar sokaktan gelir, kimin ıskası olduğu söylenmez. */
    const GECE = [null,
        { ad: 'İlk gece', yazi: 'Kurallar bildiğiniz gibi.' },
        { ad: 'Koşucular', yazi: 'Her 4. atışta hızlı bir koşucu zombi bir kişiyi daha ısırır.' },
        { ad: 'Sis', yazi: 'Barikatın arkası sisli: kaç zombi olduğu sonunda belli olur.' },
        { ad: 'Elektrik kesik', yazi: 'Karanlıkta her 3. atışta ek ısırık. Işık bombası ya da zincir projektörü yakar.' },
        { ad: 'Dev zombi gecesi', yazi: 'Koşucular geri döndü, dev zombi daha güçlü.' }];
    const GECE_EN = 5;
    const SAHNE = {
        sokak: { ad: 'Gece sokağı', ikon: '🏙️', yazi: 'Son barikat.' },
        lunapark: { ad: 'Terk edilmiş lunapark', ikon: '🎡', yazi: 'Zincir için 2 çocuk yeter.' },
        hastane: { ad: 'Hastane laboratuvarı', ikon: '🧪', yazi: 'Her panzehir şişeyi doldurur; dolunca bir zombi daha kurtulur.' },
        kar: { ad: 'Kar fırtınası', ikon: '❄️', yazi: 'Her 4. atışta tipi: zombiler donar, ısıramaz.' }
    };
    const SAHNE_GECE = [null, 'sokak', 'lunapark', 'hastane', 'kar', 'sokak'];
    const PARCA = [
        { k: 'projektor', ad: 'Projektör', ikon: '🔦', esik: 1, yazi: 'Oyunun ilk ısırığı gelmez.' },
        { k: 'kapi', ad: 'Demir kapı', ikon: '🚪', esik: 2, yazi: 'Başlangıçta bir zombi eksik.' },
        { k: 'telsiz', ad: 'Telsiz', ikon: '📻', esik: 4, yazi: 'Isırıktan önce uyarı verir.' },
        { k: 'cati', ad: 'Çatı', ikon: '🏠', esik: 6, yazi: 'Sis gecesinde zombiler görünür.' },
        { k: 'bayrak', ad: 'Bayrak', ikon: '🚩', esik: 8, yazi: 'Salonun adı barikatta dalgalanır.' }];
    const kosucuMu = (g) => g === 2 || g === 5, sisMi = (g) => g === 3, karanlikMi = (g) => g === 4;
    const superMi = (ham) => (ham || []).some((v) => v === 'X' || v === '10'); // X ya da tam merkez
    const isikBombasiMi = (puanlar, esik) => puanlar.length >= 3 && puanlar.every((p) => p >= esik);
    const zincirHedef = (sahne) => (sahne === 'lunapark' ? 2 : 3);
    const siseGerek = (n) => Math.max(2, Math.ceil(n / 3));
    const devGerek = (kalan, gece) => Math.max(1, Math.ceil(kalan * (gece === 5 ? .6 : .5))); // son ok atılana kadar düşmez; kalan atıcıların yarısı (5. gece %60)
    // Bu seride ek ısırık / ısırık atlama (saf: test sabitler). seri = bu seriden SONRAKİ sayaç (st.seri + 1).
    function geceEtkisi(gece, sahne, seri, isikAcik, devCanli, devDogdu) {
        const e = { ek: [], atla: '' };
        if (kosucuMu(gece) && seri % 4 === 0) e.ek.push('kosucu');
        if (karanlikMi(gece) && !isikAcik && seri % 3 === 0) e.ek.push('karanlik');
        if (devCanli && (seri - devDogdu) % 2 === 0) e.ek.push('dev');
        if (sahne === 'kar' && seri % 4 === 0) e.atla = 'tipi';
        return e;
    }

    /* ---- v402 (2026-11-11, kullanıcı: "sporcular için ekstra görevler verebilirsin" + "arkada bekleyen zombiler, yaklaşan sis, büyük zombi… heyecan katmak için") ----
       🎯 KİŞİSEL GÖREV: sırası gelen çocuğa kendi seviyesine göre bir görev (atış başına sabit, ekranda önceden görünür). Başaran barikata 🪵 kalas çakar;
       2 kalas bir ısırığı durdurur. Başaramamanın cezası yok. 📢 SINIF GÖREVİ: her 5 atışta hareket kartı; koç "Yaptık" derse +1 kalas. Oyun durmaz.
       GERİLİM: ufukta yürüyen zombi sürüsü (zombi oranıyla çoğalır), barikata yaklaşan sis, son tura doğru yükselen dev gölgesi, %40 zombide kalp atışı. */
    const GOREV = [
        { k: 'ilk', yaz: () => 'İlk okun panzehir olsun', ok: (p, e) => p.length > 0 && p[0] >= e },
        { k: 'son', yaz: () => 'Son okun panzehir olsun', ok: (p, e) => p.length > 0 && p[p.length - 1] >= e },
        { k: 'iska', yaz: () => 'Hiç ıska yok: bütün oklar hedefte', ok: (p) => p.length > 0 && p.every((x) => x >= 1) },
        { k: 'iki', yaz: () => 'En az iki ok panzehir', ok: (p, e) => p.filter((x) => x >= e).length >= 2 },
        { k: 'ust', yaz: (e) => 'En az bir ok ' + (e >= 7 ? 'sarıya' : 'kırmızıya ya da sarıya'), ok: (p, e) => p.some((x) => x >= Math.min(9, e + 2)) },
        { k: 'toplam', yaz: (e) => 'Toplam ' + (e * 3 - 3) + ' puan ya da fazlası', ok: (p, e) => p.reduce((a, b) => a + b, 0) >= e * 3 - 3 }
    ];
    const SINIF_GOREV = ['Herkes 10 kez zıplasın!', '5 saniye zombi gibi DONUN!', 'Tek ayak üstünde 10 saniye!', 'Herkes 5 çömelme!', 'Kollarını 10 kez çevir!', 'Yerinde 10 saniye koş!', 'Zombi yürüyüşüyle bir tur, sonra yerine!'];
    const KALAS_KALKAN = 2;
    function gorevOf(key, deneme, tarih) { let h = 7; const x = key + '|' + deneme + '|' + tarih; for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0; return GOREV[h % GOREV.length]; }

    /* ---- kalıcı kamp (gece ilerlemesi, sığınak, yürüyüş tercihi): konuma bağlı, 12 saat kuralına GİRMEZ ---- */
    const kampAnahtar = () => 'dag_km_zombikamp_' + konum();
    function kamp() { let k = null; try { k = JSON.parse(localStorage.getItem(kampAnahtar()) || 'null'); } catch (e) { } k = k || {}; return { gece: Math.min(GECE_EN, k.gece || 1), enYuksek: Math.min(GECE_EN, k.enYuksek || 1), kazanilan: k.kazanilan || 0, yuruyus: !!k.yuruyus, sahne: SAHNE[k.sahne] ? k.sahne : 'oto' }; }
    function kampYaz(k) { try { localStorage.setItem(kampAnahtar(), JSON.stringify(k)); } catch (e) { } }
    const geceAcik = () => ic('kampanya');
    function oyunGecesi() { return geceAcik() ? kamp().gece : 1; }
    function oyunSahnesi(gece) { const k = kamp(); return k.sahne !== 'oto' ? k.sahne : SAHNE_GECE[gece] || 'sokak'; }
    const parcaVar = (st, k) => ic('siginak') && (st.kazanilan0 || 0) >= PARCA.find((p) => p.k === k).esik;

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _kur = '', _gorevZ = [];
    function yeniOyun() {
        const k = kamp(), g = oyunGecesi();
        return { tarih: bugun(), zombi: {}, zamani: {}, isirik: {}, atan: {}, kurtardi: {}, seri: 0, faz: 'oyun', basladi: false, finalAdlar: null, kazandi: null,
            gece: g, sahne: oyunSahnesi(g), kazanilan0: k.kazanilan, superKul: {}, zincir: [], zincirler: [], kalas: 0, gorevBasari: {}, sinifGorev: 0, sgBekle: null, isikAcik: false, sise: 0, projektorKul: false, dev: null, devSonuc: null, kampYazildi: false };
    }
    // eski (v400 öncesi) kayıtlar: eksik alanlar
    function tamamla(st) {
        if (!st.gece) { st.gece = 1; st.sahne = st.sahne || 'sokak'; }
        if (!SAHNE[st.sahne]) st.sahne = 'sokak';
        ['superKul', 'gorevBasari'].forEach((a) => { st[a] = st[a] || {}; }); if (st.kalas == null) st.kalas = 0; if (st.sinifGorev == null) st.sinifGorev = 0; ['zincir', 'zincirler'].forEach((a) => { st[a] = st[a] || []; });
        if (st.sise == null) st.sise = 0; if (st.kazanilan0 == null) st.kazanilan0 = 0;
        return st;
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        tamamla(_st);
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.zombiTur > 0) ? a.zombiTur : 1; } catch (e) { return 1; } };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    const zombiSay = (st) => atabilenler().filter((s) => st.zombi[kimlik(s)]).length;
    function salginBaslat(st) {
        const l = atabilenler().map(kimlik); if (!l.length) return [];
        const z = [], kalan = l.slice();
        let bas = baslangicSay(l.length); if (parcaVar(st, 'kapi') && bas > 1) bas--; // 🚪 demir kapı
        for (let i = bas; i > 0 && kalan.length; i--) { const k = rastgele(kalan); z.push(k); st.zombi[k] = 1; st.zamani[k] = 0; kalan.splice(kalan.indexOf(k), 1); }
        st.basladi = true; return z;
    }
    // Oyun bitince bir kez: kazanılan gece sığınağa sayılır, sıradaki gece açılır (kaybedince aynı gece tekrar)
    function kampIlerlet(st) {
        if (st.kampYazildi) return; st.kampYazildi = true;
        const k = kamp();
        if (st.kazandi) {
            k.kazanilan++;
            if (geceAcik()) { if (st.gece >= k.enYuksek && k.enYuksek < GECE_EN) k.enYuksek = st.gece + 1; k.gece = Math.min(GECE_EN, k.enYuksek, st.gece + 1); }
        } else if (geceAcik()) k.gece = st.gece;
        kampYaz(k); st.kampSonra = { gece: k.gece, kazanilan: k.kazanilan, yeniParca: PARCA.filter((p) => k.kazanilan === p.esik && st.kazandi).map((p) => p.k) };
    }
    // Dev zombi: son turda sınıfın yarısı atınca gelir
    function devDogsunMu(st) {
        if (!ic('dev') || st.dev || st.faz !== 'oyun') return false;
        const n = atabilenler().length, son = turSay(), sonTurAtan = atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= son).length;
        if (n < 2 || sonTurAtan < Math.ceil(n / 2) || sonTurAtan >= n) return false;
        st.dev = { gerek: devGerek(n - sonTurAtan, st.gece), sayi: 0, catlak: {}, dogdu: st.seri };
        return true;
    }
    // Herkes atınca: kalp yeterince çatladıysa dev düşer, en eski 2 zombi kurtulur; çatlamadıysa barikatı aşar, 2 sağlamı ısırır
    function devCoz(st, herkes, secici) {
        if (!st.dev || st.devSonuc) return null;
        const r = { dustu: st.dev.sayi >= st.dev.gerek, iyilesen: [], isirilan: [] };
        if (r.dustu) { herkes.filter((k) => st.zombi[k]).sort((a, b) => (st.zamani[a] || 0) - (st.zamani[b] || 0)).slice(0, 2).forEach((k) => { delete st.zombi[k]; delete st.zamani[k]; r.iyilesen.push(k); }); }
        else { let bos = herkes.filter((k) => !st.zombi[k]); for (let i = 0; i < 2 && bos.length; i++) { const k = (secici || rastgele)(bos); st.zombi[k] = 1; st.zamani[k] = st.seri; r.isirilan.push(k); bos = bos.filter((x) => x !== k); } }
        st.devSonuc = r; return r;
    }
    function bitir(st) {
        const l = atabilenler();
        st.finalAdlar = l.map((s) => ilkAd(s.ad)); st.kazandi = kazandi(zombiSay(st), l.length); st.faz = 'son';
        kampIlerlet(st);
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.zombi = o.zombi || {}; o.zombi.oyun = (o.zombi.oyun || 0) + 1; if (st.kazandi) o.zombi.kurtulus = (o.zombi.kurtulus || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    function gurultu(sure, gur, gec, f, tip) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = Math.floor(AC.sampleRate * sure), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const k = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); k.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f || 800; g.gain.value = gur || .2; k.connect(fl); fl.connect(g); g.connect(AC.destination); k.start(AC.currentTime + (gec || 0)); } catch (e) { } }
    // Hırıltı: iki alçak testere + titreyen gürültü, her seferinde biraz farklı
    function hirilti(gur, gec) { const f = 62 + Math.random() * 26, g = gec || 0; for (let i = 0; i < 6; i++) ton(f + (i % 2 ? 14 : -6), .13, g + i * .09, 'sawtooth', (gur || .1) * (1 - i * .1)); gurultu(.6, (gur || .1) * 1.3, g, 420); }
    const SES = {
        ok: () => { gurultu(.26, .12, 0, 2400, 'bandpass'); ton(520, .2, 0, 'sine', .05); ton(780, .16, .08, 'sine', .05); },
        kurtar: () => { [523, 659, 880, 1175].forEach((f, i) => ton(f, .2, i * .07, 'triangle', .09)); [2093, 2637, 3136].forEach((f, i) => ton(f, .14, .26 + i * .06, 'sine', .035)); },
        atla: () => { hirilti(.1); gurultu(.16, .16, .1, 900); },
        isir: () => { gurultu(.14, .34, 0, 2600, 'highpass'); ton(110, .28, 0, 'sawtooth', .13); ton(70, .4, .1, 'sawtooth', .12); hirilti(.11, .16); },
        kacti: () => ton(180, .16, 0, 'triangle', .06),
        boom: () => { gurultu(1.2, .5, 0, 500); ton(90, 1, 0, 'square', .14); },
        zafer: () => { [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, .28, i * .14, 'square', .07)); [1568, 2093, 2637].forEach((f, i) => ton(f, .3, .8 + i * .1, 'triangle', .05)); },
        cekic: () => { [0, .14, .28].forEach((g) => { gurultu(.06, .3, g, 1400, 'bandpass'); ton(180, .08, g, 'square', .07); }); },
        kalp: (h) => { ton(58, .12, 0, 'sine', .22 * h); ton(50, .14, .2, 'sine', .18 * h); },
        alkis: () => { for (let i = 0; i < 9; i++) gurultu(.05, .16, i * .09 + Math.random() * .04, 2600, 'highpass'); },
        isik: () => { gurultu(.5, .2, 0, 5000, 'highpass'); [1047, 1319, 1568, 2093].forEach((f, i) => ton(f, .3, i * .05, 'sine', .05)); },
        telsiz: () => { gurultu(.35, .1, 0, 1800, 'bandpass'); ton(1400, .08, .05, 'square', .04); ton(1400, .08, .2, 'square', .04); },
        yenilgi: () => { SES.boom(); [220, 185, 147, 110].forEach((f, i) => ton(f, .34, .3 + i * .2, 'sawtooth', .09)); hirilti(.14, .7); hirilti(.12, 1.2); }
    };

    /* ---- çizim: kalabalık bir kez kurulur, sınıflar ve konumlar değişir (animasyon ve performans için) ---- */
    const panel = () => $('km-oyun-panel-zombi');
    /* piksel karakter (26x36, iki kare). Sağlam çocuğun elinde yay; zombi olunca tişört rengi solgun kalır, çocuk kim olduğunu kaybetmez. */
    const SAC = ['#2B1B12', '#5A3417', '#8A5A2B', '#C99A4B', '#1C1C24', '#6E2F1E'], TEN = ['#F2C79A', '#E6B98C', '#D9A578', '#F5D0A9'];
    const karma = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return h; };
    const hexMi = (h) => /^#[0-9a-f]{6}$/i.test(String(h));
    const koyu = (h, k) => { const n = parseInt(h.slice(1), 16); return 'rgb(' + Math.min(255, ((n >> 16) & 255) * k | 0) + ',' + Math.min(255, ((n >> 8) & 255) * k | 0) + ',' + Math.min(255, (n & 255) * k | 0) + ')'; };
    const solgun = (h) => { const n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, o = (r + g + b) / 3; return 'rgb(' + ((r * .55 + o * .45) * .72 | 0) + ',' + ((g * .55 + o * .45) * .72 | 0) + ',' + ((b * .55 + o * .45) * .72 | 0) + ')'; };
    function kareSaglam(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, y0 = a ? 0 : 1, g = o.g, g2 = koyu(g, .72), ten = o.ten, t2 = koyu(ten, .82), s = o.sac;
        p(8, 25, 4, 8, '#26324A'); p(14, 25, 4, 8, '#26324A'); p(16, 25, 2, 8, '#1B2438'); p(7, 33, 5, 2, '#14141C'); p(14, 33, 5, 2, '#14141C');
        p(7, 14 + y0, 12, 11, g); p(16, 14 + y0, 3, 11, g2); p(7, 22 + y0, 12, 1, '#3A2A18'); p(19, 15 + y0, 3, 8, g); p(19, 23 + y0, 3, 2, ten); p(4, 15 + y0, 3, 8, g); p(4, 23 + y0, 3, 2, ten);
        for (let i = 0; i < 6; i++) p(8 + i, 15 + y0 + i, 1, 1, '#7A5230'); // sadak kayışı
        p(22, 5 + y0, 1, 2, '#8A5A2B'); p(23, 7 + y0, 1, 4, '#8A5A2B'); p(24, 11 + y0, 1, 10, '#7A5230'); p(23, 21 + y0, 1, 4, '#8A5A2B'); p(22, 25 + y0, 1, 2, '#8A5A2B'); p(22, 7 + y0, 1, 18, '#DFE6EA'); // yay
        p(8, 3 + y0, 10, 11, ten); p(16, 3 + y0, 2, 11, t2); p(10, 8 + y0, 2, 2, '#141018'); p(14, 8 + y0, 2, 2, '#141018'); p(11, 11 + y0, 4, 1, '#6B3B2A');
        if (o.stil === 0) { p(7, 1 + y0, 12, 4, s); p(7, 5 + y0, 2, 3, s); }
        else if (o.stil === 1) { p(7, 1 + y0, 12, 4, s); p(6, 4 + y0, 3, 12, s); p(17, 4 + y0, 3, 12, s); }
        else if (o.stil === 2) { p(7, 2 + y0, 12, 3, s); p(8, y0, 2, 2, s); p(12, y0, 2, 2, s); p(16, y0, 2, 2, s); }
        else if (o.stil === 3) { p(7, 1 + y0, 12, 4, s); p(18, 3 + y0, 3, 3, s); p(20, 5 + y0, 2, 8, s); }
        else if (o.stil === 4) { p(6, y0, 14, 5, s); p(5, 3 + y0, 3, 5, s); p(18, 3 + y0, 3, 5, s); }
        else { p(7, 1 + y0, 12, 3, s); p(17, 3 + y0, 2, 4, s); }
    }
    function kareZombi(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, sil = (x, y, w, h) => c.clearRect(ox + x, y, w, h), t = '#7FBF4A', t2 = '#5D9436', hx = 7 + a;
        p(8, 26, 4, 7, '#2A332E'); p(15, 27, 4, 6, '#2A332E'); p(7, 33, 5, 2, '#101410'); p(15, 33, 5, 2, '#101410'); sil(9, 30, 2, 2);
        p(7, 15, 12, 12, o.solgun); p(16, 15, 3, 12, 'rgba(0,0,0,.35)'); p(9, 18, 3, 3, t2); sil(7, 25, 3, 2); sil(14, 24, 3, 3); p(11, 26, 2, 1, '#2A332E');
        p(0, 15 + a, 8, 3, t); p(0, 15 + a, 2, 3, t2); p(0, 20 - a, 8, 3, t2); p(0, 20 - a, 2, 3, '#47752A');
        p(hx, 3, 11, 11, t); p(hx + 8, 3, 3, 11, t2); p(hx + 1, 6, 2, 3, t2);
        p(hx, 1, 11, 3, '#3D5A22'); p(hx, 4, 2, 3, '#3D5A22'); p(hx + 4, 0, 2, 1, '#3D5A22'); p(hx + 8, 0, 2, 1, '#3D5A22');
        p(hx + 1, 6, 4, 4, '#3B0B0B'); p(hx + 2, 7, 3, 3, '#FF3B30'); p(hx + 3, 8, 1, 1, '#FFE4D6'); p(hx + 7, 7, 2, 2, '#141018');
        p(hx + 2, 11, 7, 3, '#1A0A0A'); p(hx + 3, 11, 1, 1, '#EDE6C8'); p(hx + 5, 11, 1, 1, '#EDE6C8'); p(hx + 7, 11, 1, 1, '#EDE6C8'); p(hx + 4, 13, 1, 1, '#EDE6C8'); p(hx + 6, 13, 1, 1, '#EDE6C8');
        p(hx + 5, 14, 1, 2, '#9BEA5A');
    }
    const _spr = new Map();
    function spriteOf(k, r) {
        const an = k + '|' + r; if (_spr.has(an)) return _spr.get(an);
        const h = karma(k), g = hexMi(r) ? r : '#3B82F6', o = { g, solgun: solgun(g), ten: TEN[h % TEN.length], sac: SAC[(h >> 3) % SAC.length], stil: (h >> 6) % 6 };
        const yap = (f) => { const cv = document.createElement('canvas'); cv.width = 52; cv.height = 36; const c = cv.getContext('2d'); f(c, 0, 0, o); f(c, 26, 1, o); return cv.toDataURL('image/png'); };
        const s = { n: yap(kareSaglam), z: yap(kareZombi) }; _spr.set(an, s); return s;
    }
    function kisiHtml(k, r) { const s = spriteOf(k, r); return '<span class="zb-svg" aria-hidden="true"><i class="zb-spr n" style="background-image:url(' + s.n + ')"></i><i class="zb-spr z" style="background-image:url(' + s.z + ')"></i></span>'; }

    /* sahne: gece sokağı. Zemin barikat çizgisine göre bir kez çizilir; ateş, ışık, sis ayrı tuvalde. */
    function tohum(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    let _kalpT = 0, _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' }, _raf = 0, _son = 0, _gok = null, _finalOynuyor = false, _fx = [], _okEf = [], _ortam = 0, _npc = [];
    function tuvalBoyut(cv, w, h) { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * d); cv.height = Math.round(h * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    // Sahne paletleri (v401). sokak = v383 görünümü birebir.
    const PAL = {
        sokak: { gok: ['#071018', '#123041', '#2F5A4C'], uzak: '#142630', yakin: '#0D1A1F', yol: ['#26362E', '#141F1B'], on: ['#23302A', '#111B18'], leke: 'rgba(0,0,0,.3)', yildiz: true, ay: true },
        lunapark: { gok: ['#12061F', '#3A1250', '#7A2D5C'], uzak: '#24102F', yakin: '#170A20', yol: ['#3A2A36', '#1C1420'], on: ['#2E2230', '#151017'], leke: 'rgba(0,0,0,.3)', yildiz: true, ay: true },
        hastane: { gok: ['#06101C', '#0F2A40', '#2C5266'], uzak: '#12283A', yakin: '#0B1A26', yol: ['#4A5A5E', '#2A3438'], on: ['#46524F', '#232C2B'], leke: 'rgba(255,255,255,.06)', yildiz: true, ay: true },
        kar: { gok: ['#26354C', '#56698A', '#A2B3C8'], uzak: '#3E4E64', yakin: '#2C394A', yol: ['#B9C8D6', '#7F94AB'], on: ['#AEBFD0', '#6F849C'], leke: 'rgba(255,255,255,.28)', yildiz: false, ay: false }
    };
    const sahneAd = () => { try { return (durum().sahne) || 'sokak'; } catch (e) { return 'sokak'; } };
    function zeminCiz(w, h, bar) {
        const cv = $('zb-zemin'); if (!cv) return; const c = tuvalBoyut(cv, w, h), t = Math.round(Math.max(bar * .42, Math.min(90, bar * .8))), o = Math.max(.55, h / 620);
        _sah.ufuk = t; const sh = sahneAd(), P = PAL[sh] || PAL.sokak; _sah.sahne = sh;
        const g = c.createLinearGradient(0, 0, 0, t); g.addColorStop(0, P.gok[0]); g.addColorStop(.55, P.gok[1]); g.addColorStop(1, P.gok[2]); c.fillStyle = g; c.fillRect(0, 0, w, t + 2);
        let r = tohum(4);
        if (P.yildiz) for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (.25 + r() * .6) + ')'; c.fillRect(r() * w, r() * t * .6, 2, 2); }
        if (P.ay) {
            const ax = w * .45, ay = Math.max(20, t * .42), ps = Math.max(3, 6 * o); for (let i = 5; i > 0; i--) { c.fillStyle = 'rgba(236,240,190,' + (.035 * i) + ')'; c.beginPath(); c.arc(ax, ay, ps * 7 + i * 18 * o, 0, 7); c.fill(); }
            c.fillStyle = '#ECEFC0'; for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) if (x * x + y * y <= 50) c.fillRect(ax + x * ps, ay + y * ps, ps + .5, ps + .5);
            c.fillStyle = '#CFD3A0'; [[-3, -2, 2], [2, 1, 3], [-1, 4, 1], [4, -4, 1]].forEach(([x, y, s2]) => c.fillRect(ax + x * ps, ay + y * ps, s2 * ps, s2 * ps));
        } else { r = tohum(7); for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(220,230,240,' + (.12 + r() * .12) + ')'; const cx = r() * w, cy = r() * t * .5, rr = (30 + r() * 60) * o; c.beginPath(); c.ellipse(cx, cy, rr * 1.8, rr * .55, 0, 0, 7); c.fill(); } }
        _sah.teker = null;
        if (sh === 'lunapark') {
            const R = Math.min(t * .7, 170 * o), cx = w * .46, cy = t - R * .55; _sah.teker = { x: cx, y: cy, R };
            c.fillStyle = '#1C0D24'; c.beginPath(); c.moveTo(cx - R * .5, t + 2); c.lineTo(cx, cy); c.lineTo(cx + R * .5, t + 2); c.lineTo(cx + R * .42, t + 2); c.lineTo(cx, cy + 10); c.lineTo(cx - R * .42, t + 2); c.fill();
            r = tohum(31); for (let x = w * .04; x < w * .5; x += 90 * o) { const tw = (60 + r() * 30) * o, th = (40 + r() * 26) * o; for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#B8325A' : '#E8D8C8'; c.beginPath(); c.moveTo(x + tw / 2, t - th); c.lineTo(x + i * tw / 6, t); c.lineTo(x + (i + 1) * tw / 6, t); c.fill(); } c.fillStyle = '#FFD86B'; c.fillRect(x + tw / 2 - 2, t - th - 8 * o, 4, 8 * o); }
        }
        r = tohum(11); for (let x = -20; x < w;) { const gn = (70 + r() * 80) * o, y = (40 + r() * 70) * o * (sh === 'lunapark' ? .6 : 1); c.fillStyle = P.uzak; c.fillRect(x, t - y, gn, y + 2); if (sh === 'kar') { c.fillStyle = 'rgba(235,242,250,.55)'; c.fillRect(x, t - y - 3 * o, gn, 5 * o); } x += gn + r() * 8; }
        if (sh === 'hastane') {
            const bx = w * .5, bw = w * .38, bh = Math.min(t * .85, 170 * o), by = t - bh; c.fillStyle = '#16303F'; c.fillRect(bx, by, bw, bh + 2); c.fillStyle = '#1D3B4C'; c.fillRect(bx, by, bw, 6 * o);
            r = tohum(19); for (let wy = by + 14 * o; wy < t - 14 * o; wy += 18 * o) for (let a = bx + 10 * o; a < bx + bw - 14 * o; a += 18 * o) { const q = r(); c.fillStyle = q > .55 ? (q > .9 ? '#C9F2F7' : '#5FB8C8') : 'rgba(0,0,0,.35)'; c.fillRect(a, wy, 10 * o, 10 * o); }
            const kx = bx + bw / 2, ky = by - 26 * o, kk = 22 * o; c.fillStyle = '#E8F4F2'; c.fillRect(kx - kk, ky - kk / 2, kk * 2, kk * 1.6); c.fillStyle = '#E23B3B'; c.fillRect(kx - kk * .7, ky + kk * .1, kk * 1.4, kk * .4); c.fillRect(kx - kk * .2, ky - kk * .4, kk * .4, kk * 1.4);
            _sah.hac = { x: kx, y: ky + kk * .3, r: kk * 2.2 };
        } else _sah.hac = null;
        r = tohum(23); for (let x = -30; x < w;) { const gn = (80 + r() * 90) * o, y = (24 + r() * 56) * o * (sh === 'lunapark' ? .7 : 1); c.fillStyle = P.yakin; c.fillRect(x, t - y, gn, y + 2); for (let wy = t - y + 7 * o; wy < t - 8 * o; wy += 15 * o) for (let a = x + 6 * o; a < x + gn - 9 * o; a += 14 * o) { const q = r(); c.fillStyle = q > .9 ? (q > .97 ? '#D9902A' : '#A98A48') : 'rgba(0,0,0,.28)'; c.fillRect(a, wy, 6 * o, 8 * o); } if (sh === 'kar') { c.fillStyle = '#E6EEF6'; c.fillRect(x - 2, t - y - 5 * o, gn + 4, 6 * o); } x += gn + r() * 6; }
        const yol = c.createLinearGradient(0, t, 0, bar); yol.addColorStop(0, P.yol[0]); yol.addColorStop(1, P.yol[1]); c.fillStyle = yol; c.fillRect(0, t, w, bar - t + 2);
        if (sh === 'hastane') { c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let x = 0; x < w; x += 40 * o) { c.beginPath(); c.moveTo(x, t); c.lineTo(x - 30 * o, bar); c.stroke(); } }
        r = tohum(41); c.fillStyle = P.leke; for (let i = 0; i < 26; i++) c.fillRect(r() * w, t + 4 + r() * (bar - t), (8 + r() * 30) * o, (3 + r() * 5) * o);
        const on = c.createLinearGradient(0, bar, 0, h); on.addColorStop(0, P.on[0]); on.addColorStop(1, P.on[1]); c.fillStyle = on; c.fillRect(0, bar, w, h - bar);
        const a = Math.max(.42, .62 * o), ax2 = w * .02, ay2 = t + 22 * o;
        if (sh === 'sokak') { // yanık araba
            c.fillStyle = '#0A0F10'; c.fillRect(ax2 - 6 * a, ay2 + 12 * a, 120 * a, 6 * a); c.fillStyle = '#4A2822'; c.fillRect(ax2, ay2 - 8 * a, 108 * a, 22 * a); c.fillRect(ax2 + 24 * a, ay2 - 28 * a, 52 * a, 22 * a); c.fillStyle = '#10202A'; c.fillRect(ax2 + 30 * a, ay2 - 24 * a, 18 * a, 16 * a); c.fillStyle = '#0A0A0E'; c.fillRect(ax2 + 12 * a, ay2 + 8 * a, 20 * a, 14 * a); c.fillRect(ax2 + 74 * a, ay2 + 8 * a, 20 * a, 14 * a);
        } else if (sh === 'hastane') { // ambulans
            c.fillStyle = '#0A0F10'; c.fillRect(ax2 - 4 * a, ay2 + 14 * a, 124 * a, 6 * a); c.fillStyle = '#DCE4E6'; c.fillRect(ax2, ay2 - 30 * a, 82 * a, 46 * a); c.fillRect(ax2 + 82 * a, ay2 - 14 * a, 34 * a, 30 * a); c.fillStyle = '#E23B3B'; c.fillRect(ax2, ay2 - 4 * a, 116 * a, 6 * a); c.fillRect(ax2 + 32 * a, ay2 - 24 * a, 16 * a, 6 * a); c.fillRect(ax2 + 37 * a, ay2 - 29 * a, 6 * a, 16 * a); c.fillStyle = '#20384A'; c.fillRect(ax2 + 92 * a, ay2 - 10 * a, 18 * a, 10 * a); c.fillStyle = '#0A0A0E'; c.fillRect(ax2 + 14 * a, ay2 + 10 * a, 20 * a, 14 * a); c.fillRect(ax2 + 86 * a, ay2 + 10 * a, 20 * a, 14 * a);
        } else if (sh === 'lunapark') { // bilet gişesi
            c.fillStyle = '#2A1A34'; c.fillRect(ax2, ay2 - 30 * a, 70 * a, 48 * a); for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#E8D8C8' : '#B8325A'; c.fillRect(ax2 - 6 * a + i * 16 * a, ay2 - 42 * a, 16 * a, 14 * a); } c.fillStyle = '#FFD86B'; c.fillRect(ax2 + 16 * a, ay2 - 20 * a, 38 * a, 16 * a);
        } else { // kardan adam
            const kx = ax2 + 40 * a, ky = ay2 + 10 * a; c.fillStyle = '#EEF4FA'; c.beginPath(); c.arc(kx, ky, 22 * a, 0, 7); c.fill(); c.beginPath(); c.arc(kx, ky - 30 * a, 15 * a, 0, 7); c.fill(); c.fillStyle = '#1A1A22'; c.fillRect(kx - 6 * a, ky - 34 * a, 3 * a, 3 * a); c.fillRect(kx + 3 * a, ky - 34 * a, 3 * a, 3 * a); c.fillStyle = '#F08A2A'; c.fillRect(kx, ky - 30 * a, 9 * a, 3 * a); c.fillStyle = '#C0392B'; c.fillRect(kx - 14 * a, ky - 20 * a, 28 * a, 5 * a);
        }
        if (sh !== 'hastane') { const vx = w * .34, vy = t + 6 * o; c.fillStyle = '#2A2F33'; c.fillRect(vx - 16 * o, vy, 32 * o, 28 * o); c.fillStyle = '#454B50'; c.fillRect(vx - 16 * o, vy + 7 * o, 32 * o, 3 * o); c.fillRect(vx - 16 * o, vy + 18 * o, 32 * o, 3 * o); }
    }
    function barikatCiz(w, y, yuk) {
        const cv = $('zb-barikat'); if (!cv) return; const kp = $('zb-kalabalik'), sa = document.querySelector('.zb-sahne'); if (!kp || !sa) return; const rk = kp.getBoundingClientRect(), rs = sa.getBoundingClientRect(), st = durum(), parcalar = PARCA.filter((p) => parcaVar(st, p.k)), lamba = 0, sh = st.sahne || 'sokak';
        cv.style.left = (rs.left - rk.left) + 'px'; cv.style.top = (y - lamba) + 'px'; cv.style.width = w + 'px'; cv.style.height = (yuk + lamba + 4) + 'px';
        const c = tuvalBoyut(cv, w, yuk + lamba + 4), ks = yuk / 3, kg = ks * 2.5;
        c.clearRect(0, 0, w, yuk + lamba + 4);
        const renk = { sokak: ['#9A8A5E', '#8A7A52'], kar: ['#9A8A5E', '#8A7A52'], lunapark: ['#B8325A', '#E8D8C8'], hastane: ['#C9D4D8', '#A9B8BE'] }[sh] || ['#9A8A5E', '#8A7A52'];
        for (let s2 = 0; s2 < 3; s2++) for (let x = -kg + (s2 % 2 ? kg / 2 : 0); x < w; x += kg) { const yy = lamba + s2 * ks; c.fillStyle = renk[s2 % 2]; c.fillRect(x, yy, kg - 1, ks); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, yy + ks * .76, kg - 1, ks * .24); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x + 3, yy + 2, kg - 7, 2); if (sh === 'hastane') { c.fillStyle = '#3F8FB0'; c.fillRect(x, yy + ks * .4, kg - 1, ks * .14); } }
        if (sh === 'kar') { c.fillStyle = '#EEF4FA'; for (let x = 0; x < w; x += 14) c.fillRect(x, lamba - 3 + (x / 14 % 3), 15, 6); }
        // 🏚️ sığınak parçaları barikatın üstünde; 🚩 bayrakta salonun adı
        if (parcalar.length) {
            const ib = Math.round(Math.max(16, yuk * .62)); c.font = ib + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; c.textBaseline = 'bottom';
            parcalar.filter((p) => p.k !== 'bayrak').forEach((p, i) => { const x = 8 + i * ib * 1.3; c.fillStyle = 'rgba(8,12,12,.7)'; c.beginPath(); c.arc(x + ib * .55, yuk / 2, ib * .62, 0, 7); c.fill(); c.textBaseline = 'middle'; c.fillText(p.ikon, x + ib * .05, yuk / 2 + 1); });
            if (parcalar.some((p) => p.k === 'bayrak')) {
                const fx = w * .5, ad = buyuk((typeof kmKonumAdi === 'function' && kmKonumAdi()) || 'DAĞ SK').slice(0, 18);
                const fh = yuk * .62, fw = Math.max(70, ad.length * fh * .5 + 18); c.fillStyle = '#C62828'; c.fillRect(fx - fw / 2, (yuk - fh) / 2, fw, fh); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(fx - fw / 2, (yuk - fh) / 2 + fh - 3, fw, 3);
                c.fillStyle = '#FFFFFF'; c.font = '800 ' + Math.round(fh * .62) + 'px system-ui,sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText('🚩 ' + ad, fx, yuk / 2 + 1); c.textAlign = 'left';
            }
        }
        c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, lamba + yuk, w, 4);
    }
    function canliCiz(ms) {
        const cv = $('zb-canli'); if (!cv || !_sah.w) return; const { w, h, bar, ufuk } = _sah, c = cv.getContext('2d'), t = ms / 1000, o = Math.max(.55, h / 620);
        c.clearRect(0, 0, w, h);
        if (_gok) {
            const p = azHareket() || !_gok.t0 ? 1 : Math.min(1, (ms - _gok.t0) / 1900);
            c.save(); c.beginPath(); c.rect(0, 0, w, ufuk); c.clip();
            const g = c.createLinearGradient(0, 0, 0, ufuk);
            if (_gok.tip === 'safak') {
                g.addColorStop(0, 'rgba(120,170,220,' + (.75 * p) + ')'); g.addColorStop(.6, 'rgba(255,170,90,' + (.8 * p) + ')'); g.addColorStop(1, 'rgba(255,214,140,' + (.9 * p) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, ufuk);
                const r = 44 * o, sx = w * .8, sy = ufuk + r - p * (ufuk * .62 + r), ps = Math.max(3, r / 7); for (let i = 3; i > 0; i--) { c.fillStyle = 'rgba(255,226,140,' + (.12 * i) + ')'; c.beginPath(); c.arc(sx, sy, r + i * 18 * o, 0, 7); c.fill(); }
                c.fillStyle = '#FFE08A'; for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) if (x * x + y * y <= 50) c.fillRect(sx + x * ps, sy + y * ps, ps + .5, ps + .5);
            } else {
                g.addColorStop(0, 'rgba(60,8,12,' + (.8 * p) + ')'); g.addColorStop(1, 'rgba(190,40,24,' + (.7 * p) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, ufuk);
                for (let i = 0; i < 16; i++) { const u = (t * .12 + i * .13) % 1, sz = (18 + u * 40) * o; c.fillStyle = 'rgba(14,10,12,' + (.55 * (1 - u) * p) + ')'; c.fillRect(w * (.1 + (i % 8) * .12) + Math.sin(t + i) * 12 - sz / 2, ufuk - u * ufuk - sz / 2, sz, sz); }
            }
            c.restore();
        }
        if (!_gok) [[w * .09, 0], [w * .49, 1.7]].forEach(([x, f]) => { const a = Math.sin(t * .8 + f) * .3; c.fillStyle = 'rgba(235,240,190,.09)'; c.beginPath(); c.moveTo(x, bar); c.lineTo(x + Math.sin(a) * w * .35 - 80 * o, ufuk); c.lineTo(x + Math.sin(a) * w * .35 + 80 * o, ufuk); c.closePath(); c.fill(); });
        [w * .09, w * .49].forEach((x) => { c.fillStyle = '#0A1012'; c.fillRect(x - 3, bar - 118 * o, 6, 118 * o); c.fillStyle = '#D9DCC0'; c.fillRect(x - 13, bar - 128 * o, 26, 12 * o); });
        if (_sah.teker) { const T = _sah.teker, n = 10, don = t * .18; c.strokeStyle = '#4A2A5A'; c.lineWidth = 3; c.beginPath(); c.arc(T.x, T.y, T.R, 0, 7); c.stroke(); for (let i = 0; i < n; i++) { const a = don + i * Math.PI * 2 / n, x = T.x + Math.cos(a) * T.R, y = T.y + Math.sin(a) * T.R; c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(x, y); c.stroke(); c.fillStyle = ['#FF5FA2', '#FFD86B', '#7CCBFF'][i % 3]; c.globalAlpha = .55 + .45 * Math.abs(Math.sin(t * 3 + i)); c.fillRect(x - 7 * o, y, 14 * o, 11 * o); c.globalAlpha = 1; } c.fillStyle = '#FFD86B'; c.beginPath(); c.arc(T.x, T.y, 6 * o, 0, 7); c.fill(); }
        if (_sah.hac) { c.fillStyle = 'rgba(255,80,80,' + (.08 + .07 * Math.max(0, Math.sin(t * 2.4))) + ')'; c.beginPath(); c.arc(_sah.hac.x, _sah.hac.y, _sah.hac.r, 0, 7); c.fill(); }
        if (_sah.sahne === 'kar') for (let i = 0; i < 70; i++) { const u = (t * (.05 + (i % 7) * .012) + i * .137) % 1, x = ((i * 97.3) % w) + Math.sin(t * .8 + i) * 18, y = u * h, s2 = (1.5 + (i % 3)) * o; c.fillStyle = 'rgba(245,250,255,' + (.5 + (i % 4) * .12) + ')'; c.fillRect(x, y, s2, s2); }
        const fx = w * .34, fy = ufuk + 8 * o, pa = .1 + .04 * Math.sin(t * 9);
        if (_sah.sahne !== 'hastane') { c.fillStyle = 'rgba(255,130,40,' + pa + ')'; c.beginPath(); c.arc(fx, fy - 18 * o, 76 * o, 0, 7); c.fill();
        for (let i = 0; i < 20; i++) { const u = (t * (.8 + i * .04) + i * .31) % 1, x = fx + (Math.sin(i * 2.1 + t * 3) * (22 - u * 15) + (i % 7 - 3) * 5) * o, y = fy - u * 70 * o, s = ((1 - u) * 11 + 3) * o; c.fillStyle = u < .3 ? '#FFE08A' : u < .65 ? '#FF8A2E' : 'rgba(190,50,20,.8)'; c.fillRect(x - s / 2, y - s / 2, s, s); } }
        if (_gok && _gok.tip === 'safak') return;
        if (_atm.acik && !_gok) {
            const A = _atm, kos = Math.max(.6, o);
            // ufukta yürüyen sürü: zombi oranıyla çoğalır (sis gecesinde zaten görünmez)
            const m = Math.round(4 + A.oran * 16);
            for (let i = 0; i < m; i++) {
                const hz = 5 + (i % 4) * 2.5, x = ((i * 173.7 + t * hz) % (w + 80)) - 40, boy = (16 + (i % 3) * 5) * kos, y = ufuk + 4 * kos + (i % 3) * 5 * kos, sal = Math.sin(t * 3 + i) * 2;
                c.fillStyle = 'rgba(8,12,10,.9)'; c.fillRect(x - boy * .18 + sal, y - boy, boy * .36, boy * .62); c.fillRect(x - boy * .14 + sal, y - boy * 1.28, boy * .28, boy * .3); c.fillRect(x + boy * .16 + sal, y - boy * .9, boy * .34, boy * .1); c.fillRect(x - boy * .14, y - boy * .38, boy * .1, boy * .38); c.fillRect(x + boy * .04, y - boy * .38, boy * .1, boy * .38);
                if (Math.sin(t * 1.7 + i * 2.3) > -.6) { c.fillStyle = 'rgba(255,60,40,.9)'; c.fillRect(x - boy * .06 + sal, y - boy * 1.2, 2 * kos, 2 * kos); c.fillRect(x + boy * .04 + sal, y - boy * 1.2, 2 * kos, 2 * kos); }
            }
            // barikata yaklaşan sis: zombi oranı arttıkça öne gelir
            const sy = ufuk + (bar - ufuk) * Math.min(.92, .15 + A.oran * 1.5), sg = c.createLinearGradient(0, ufuk, 0, sy + 30 * kos);
            sg.addColorStop(0, 'rgba(150,190,160,0)'); sg.addColorStop(.6, 'rgba(150,190,160,.16)'); sg.addColorStop(.9, 'rgba(170,210,180,.26)'); sg.addColorStop(1, 'rgba(170,210,180,0)'); c.fillStyle = sg; c.fillRect(0, ufuk, w, sy - ufuk + 30 * kos);
            for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(190,225,200,.07)'; c.beginPath(); c.ellipse(((i * 260 + t * (10 + i * 4)) % (w + 400)) - 200, sy - 8 * kos + Math.sin(t + i) * 6, 170 * kos, 22 * kos, 0, 0, 7); c.fill(); }
            // dev gölgesi: son tura doğru binaların arkasından yükselir (dev gelince sahnede)
            if (ic('dev') && !A.dev && A.ilerleme >= .2) {
                const yuk = Math.min(1, (A.ilerleme - .2) / .45), gx = w * .58, gb = 70 * kos, top = ufuk + 6 - yuk * 110 * kos;
                c.fillStyle = 'rgba(4,6,8,' + (.55 + .35 * yuk) + ')'; c.fillRect(gx - gb, top + gb * .9, gb * 2, ufuk - top); c.fillRect(gx - gb * .55, top, gb * 1.1, gb); c.fillRect(gx - gb * 1.5, top + gb * 1.1, gb * .55, gb * .3); c.fillRect(gx + gb * .95, top + gb * 1.1, gb * .55, gb * .3);
                const parla = .5 + .5 * Math.sin(t * 2.2); c.fillStyle = 'rgba(255,50,30,' + (.5 + .5 * parla) * yuk + ')'; c.fillRect(gx - gb * .32, top + gb * .35, gb * .2, gb * .14); c.fillRect(gx + gb * .12, top + gb * .35, gb * .2, gb * .14);
                c.fillStyle = 'rgba(255,50,30,' + .12 * yuk * parla + ')'; c.beginPath(); c.arc(gx, top + gb * .42, gb * .9, 0, 7); c.fill();
            }
            // kalp atışı: zombiler %40'ı geçince kenarlar kızarır
            if (A.oran >= .4) { const hz = 1 + A.oran * 1.2, v = Math.pow(Math.max(0, Math.sin(t * Math.PI * hz)), 6), rg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75); rg.addColorStop(0, 'rgba(200,20,20,0)'); rg.addColorStop(1, 'rgba(200,20,20,' + (.12 + .22 * v) + ')'); c.fillStyle = rg; c.fillRect(0, 0, w, h); }
        }
        for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(155,234,90,.05)'; c.fillRect(((i * 310 + t * (14 + i * 3)) % (w + 420)) - 420, ufuk + (bar - ufuk) * (i / 5), 420, Math.max(16, 28 * o)); }
    }
    // Efekt katmanı (kişilerin üstünde): parlayan ok, patlama parçacıkları
    function efektCiz(ms) {
        const cv = $('zb-efekt'); if (!cv) return; if (!_fx.length && !_okEf.length) { if (cv._dolu) { cv.getContext('2d').clearRect(0, 0, _sah.w, _sah.h); cv._dolu = false; } return; }
        const c = cv.getContext('2d'); c.clearRect(0, 0, _sah.w, _sah.h); cv._dolu = true;
        _okEf = _okEf.filter((a) => ms - a.t0 < a.sure + 120);
        _okEf.forEach((a) => {
            const p = Math.min(1, (ms - a.t0) / a.sure), x = a.x0 + (a.x1 - a.x0) * p, y = a.y0 + (a.y1 - a.y0) * p, b = Math.max(0, p - .45), xk = a.x0 + (a.x1 - a.x0) * b, yk = a.y0 + (a.y1 - a.y0) * b, aci = Math.atan2(a.y1 - a.y0, a.x1 - a.x0);
            c.lineCap = 'round'; c.strokeStyle = 'rgba(155,234,90,.35)'; c.lineWidth = 14; c.beginPath(); c.moveTo(xk, yk); c.lineTo(x, y); c.stroke(); c.strokeStyle = '#D8FFB0'; c.lineWidth = 5; c.stroke();
            c.save(); c.translate(x, y); c.rotate(aci); c.fillStyle = '#FFF6C0'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-6, -8); c.lineTo(-6, 8); c.closePath(); c.fill(); c.restore();
        });
        _fx = _fx.filter((q) => ms - q.t0 < q.om);
        _fx.forEach((q) => { const u = (ms - q.t0) / q.om; q.x += q.vx; q.y += q.vy; q.vy += .32; c.globalAlpha = 1 - u; c.fillStyle = q.r; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }); c.globalAlpha = 1;
    }
    function patla(x, y, renkler, n) { if (azHareket()) return; const t0 = performance.now(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, h = 2 + Math.random() * 6; _fx.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 2, s: 4 + Math.random() * 8, r: renkler[i % renkler.length], t0, om: 450 + Math.random() * 450 }); } }
    function kisiMerkez(k) { const e = kisiEl(k), sa = document.querySelector('.zb-sahne'); if (!e || !sa) return null; const r = e.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width / 2, y: r.top - rs.top + r.height * .4 }; }
    function dongu(ms) {
        _raf = 0; const p = panel(); if (!p || !p.isConnected || !$('zb-canli') || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'zombi')) return;
        if (!document.hidden && ms - _son >= 33) {
            _son = ms; try { canliCiz(ms); efektCiz(ms); } catch (e) { }
            // zombiler ara sıra hırıldar (ses açıksa, çok kısık)
            if (_atm.acik && _atm.oran >= .4 && ms > (_kalpT || 0)) { _kalpT = ms + 1300 - _atm.oran * 500; try { if (AC && AC.state === 'running' && !_kilit) SES.kalp(Math.min(1, _atm.oran + .2)); } catch (e) { } }
            if (ms > _ortam) { _ortam = ms + 8000 + Math.random() * 7000; try { if (AC && AC.state === 'running' && !_kilit && !_gok && $('zb-oyun') && zombiSay(durum()) > 0) hirilti(.045); } catch (e) { } }
        }
        _raf = requestAnimationFrame(dongu);
    }
    // Sahne ölçüsü değişince (ya da ilk açılışta) zemin yeniden çizilir
    function sahneOlc() {
        const sa = document.querySelector('.zb-sahne'); if (!sa) return null; const rs = sa.getBoundingClientRect(); if (!rs.width || !rs.height) return null;
        const kp = $('zb-kalabalik'), rk = kp ? kp.getBoundingClientRect() : null, bar = rk && rk.height ? Math.round(rk.top - rs.top + rk.height * BAR_ORAN) : Math.round(rs.height * .55), w = Math.round(rs.width), h = Math.round(rs.height), an = w + '|' + h + '|' + bar + '|' + (durum().sahne || 'sokak');
        if (_sah.anahtar !== an) { _sah = { w, h, bar, ufuk: 0, anahtar: an }; zeminCiz(w, h, bar); const cv = $('zb-canli'); if (cv) tuvalBoyut(cv, w, h); const ef = $('zb-efekt'); if (ef) tuvalBoyut(ef, w, h); if (azHareket()) canliCiz(performance.now()); }
        return _sah;
    }
    /* kalabalık: zombiler barikatın arkasında (sokakta), sağlamlar önünde. Çocuk ısırılınca barikatı geçer, kurtulunca geri koşar. */
    const BAR_ORAN = .5, AD_YUK = 19;
    // Verilen alana en büyük karakteri sığdıran sütun sayısı; karakterler azsa az satır
    function izgara(n, W, H, enFazla) {
        let en = { boy: 0, k: 1, s: 1 };
        for (let k = n; k >= 1; k--) { const s = Math.ceil(n / k), boy = Math.min(enFazla, W / k / .8, H / s - AD_YUK); if (boy > en.boy) en = { boy, k, s }; }
        return en;
    }
    function diz(el, W, y0, H, enFazla, zTaban) {
        if (!el.length) return; const g = izgara(el.length, W, Math.max(40, H), enFazla), sat = H / g.s, boy = Math.max(24, g.boy);
        el.forEach((b, i) => {
            const row = Math.floor(i / g.k), say = row < g.s - 1 ? g.k : el.length - g.k * (g.s - 1), o = i - row * g.k, cw = W / say, kw = Math.min(cw, boy * 1.25), y = y0 + sat * (row + 1) - boy - AD_YUK;
            b.style.left = Math.round(cw * (o + .5) - kw / 2) + 'px'; b.style.top = Math.round(y) + 'px'; b.style.width = Math.round(kw) + 'px'; b.style.height = Math.round(boy + AD_YUK) + 'px'; b.style.zIndex = zTaban + row; b.style.setProperty('--ad', Math.max(11, Math.min(15, boy * .2)) + 'px');
        });
    }
    function yerlesim(zombiler) {
        const kp = $('zb-kalabalik'); if (!kp) return; const r = kp.getBoundingClientRect(); if (!r.width || !r.height) return; const z = zombiler || durum().zombi, sa = sahneOlc();
        const bar = Math.round(r.height * BAR_ORAN), yuk = Math.max(24, Math.min(50, r.height * .1)), hepsi = Array.from(kp.querySelectorAll('.zb-kisi')), zo = hepsi.filter((b) => z[b.getAttribute('data-k')]), sg = hepsi.filter((b) => !z[b.getAttribute('data-k')]);
        const devVar = !!$('zb-dev'); diz(zo, devVar ? r.width * .78 : r.width, 0, bar - 1, 112, 10);
        diz(sg, r.width, bar + yuk * .3, r.height - bar - yuk * .3, 140, 60);
        if (sa) barikatCiz(sa.w, bar, yuk);
    }
    function kalabalikKur() {
        const l = liste(), st = durum(), kp = $('zb-kalabalik'); if (!kp) return;
        kp.classList.remove('gecis');
        kp.innerHTML = '<canvas id="zb-barikat" aria-hidden="true"></canvas>' + l.map((s, i) => { const k = kimlik(s); return '<button type="button" class="zb-kisi" data-km-sporcu="' + i + '" data-k="' + esc(k) + '"><span class="zb-kafa">' + kisiHtml(k, renk(i)) + '<i class="zb-sira">SIRA</i></span><span class="zb-ad"><b class="zb-tik" aria-hidden="true"></b>' + esc(ilkAd(s.ad)) + '</span></button>'; }).join('');
        _kur = l.map(kimlik).join('\u0001') + '|' + st.tarih;
        _sah.anahtar = '';
        requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); }));
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function guncelle() {
        const kok = $('zb-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son' && (_finalOynuyor || _kilit)) return; // final sahnesi oynuyor, kabuk erken çağırsa da kesilmesin
        if (st.faz === 'son') { if (!_gok) _gok = { tip: st.kazandi ? 'safak' : 'kizil', t0: 0 }; if (azHareket()) canliCiz(performance.now()); return sonCiz(st); }
        _gok = null;
        if (!$('zb-oyun')) oyunIskelet();
        if ((liste().map(kimlik).join('\u0001') + '|' + st.tarih) !== _kur) kalabalikKur();
        if (!st.basladi && atabilenler().length) { const z = salginBaslat(st); kaydet(); if (z.length && !_kilit) acilis(z); }
        const ai = aktifIndeks(), n = atabilenler().length;
        document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b, i) => {
            const k = b.getAttribute('data-k'), z = !!st.zombi[k], at = (st.atan[k] || 0) >= turSay(), akt = i === ai;
            b.classList.toggle('zombi', z); b.classList.toggle('atti', at); b.classList.toggle('aktif', akt);
            const ad = b.querySelector('.zb-ad').textContent; b.setAttribute('aria-label', ad + (z ? ', zombi' : ', sağlam') + (at ? ', attı' : ''));
        });
        yerlesim();
        const zs = zombiSay(st), saglam = n - zs, a = atanSay(st), akt = liste()[ai];
        const yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        void saglam; sayiYaz(zs, n, st); yaz('zb-at', a + ' / ' + n + ' attı'); yaz('zb-kim', akt ? buyuk(ilkAd(akt.ad)) : '');
        yaz('zb-gece-yazi', geceYazi(st)); yaz('zb-siginak', PARCA.filter((p2) => parcaVar(st, p2.k)).map((p2) => p2.ikon).join(''));
        const sise = $('zb-sise'); if (sise) { sise.hidden = st.sahne !== 'hastane'; if (st.sahne === 'hastane') yaz('zb-sise', '🧪 ' + st.sise + '/' + siseGerek(n)); }
        const kp = $('zb-kalabalik'); if (kp) kp.classList.toggle('sis', sisAktif(st));
        const sa = document.querySelector('.zb-sahne'); if (sa) sa.setAttribute('data-sahne', st.sahne);
        karanlikUygula(st); devCiz(); kalasCiz(); atmGuncelle(st); if (st.sgBekle != null && !$('zb-sgorev') && !_kilit) sinifGorevAc();
        if (akt) { const es = esikOf(ortalama(akt)), h = $('zb-yan-hedef'); if (h) h.setAttribute('data-esik', es); yaz('zb-yan-ad', buyuk(ilkAd(akt.ad))); { const gv = ic('gorev') ? gorevOf(kimlik(akt), st.atan[kimlik(akt)] || 0, st.tarih) : null, ge = $('zb-yan-gorev'); if (ge) { ge.hidden = !gv; if (gv) yaz('zb-yan-gorev', '🎯 GÖREV: ' + gv.yaz(es) + ' → 🪵'); } } yaz('zb-yan-esik', (st.zombi[kimlik(akt)] ? 'Kendini kurtar: ' : 'Panzehir: ') + (es >= 9 ? 'sarıya vur' : es >= 7 ? 'kırmızıya ya da sarıya vur' : 'maviye ya da içine vur')); }
        const bit = $('zb-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
    }
    function oyunIskelet() {
        $('zb-icerik').innerHTML = '<div class="zb-oyun" id="zb-oyun"><div class="zb-ust"><div class="zb-say z"><b id="zb-z">0</b><span>ZOMBİ</span></div><div class="zb-orta"><div class="zb-cubuk" role="img" aria-label="Zombi ve sağlam oranı"><i id="zb-bar"></i></div><div class="zb-bilgi"><span class="zb-sira-hud">Sıra: <b id="zb-kim"></b></span><span id="zb-at"></span><button type="button" class="zb-gece" id="zb-gece-btn" aria-label="Gece, sahne ve sığınak"><span id="zb-gece-yazi"></span> ▾' + (typeof yeniRozet === 'function' ? yeniRozet() : '') + '</button><span class="zb-sise" id="zb-sise" hidden></span><span class="zb-siginak" id="zb-siginak" title="Sığınak"></span><span class="zb-kalas" id="zb-kalas" title="Kalas: 2 kalas bir ısırığı durdurur"></span></div></div><div class="zb-say s"><b id="zb-s">0</b><span>SAĞLAM</span></div></div>'
            + '<div class="zb-duyuru" id="zb-duyuru" aria-live="polite"></div><div class="zb-kalabalik" id="zb-kalabalik"></div>'
            + '<div class="zb-yan" id="zb-yan"><div class="zb-yan-hedef" id="zb-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte panzehir bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div><div class="zb-yan-yazi"><small>SIRADA</small><b id="zb-yan-ad"></b><span id="zb-yan-esik"></span><em id="zb-yan-gorev" class="zb-yan-gorev" hidden></em></div>'
            + '<div class="zb-arac"><button type="button" class="zb-kucuk" id="zb-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="zb-kucuk" id="zb-yeni-btn" aria-label="Yeni salgın">↻</button><button type="button" class="zb-kucuk genis" id="zb-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        kalabalikKur();
    }
    function sonCiz(st) {
        const k = st.kazandi, l = st.finalAdlar || [], n = l.length, z = st.sonZ != null ? st.sonZ : zombiSay(st);
        const sinif = liste().map((s, i) => '<span class="zb-son-kisi' + (k ? '' : ' zombi') + '" style="--g:' + (i % 7) + '">' + kisiHtml(kimlik(s), renk(i)) + '</span>').join('');
        $('zb-icerik').innerHTML = '<div class="zb-son ' + (k ? 'kazandi' : 'kaybetti') + '" id="zb-son"><span class="zb-et">Herkes attı</span><h2>' + (k ? 'SALGIN DURDU!' : 'ŞEHİR DÜŞTÜ!') + '</h2><p class="zb-sonuc"><b>' + (n - z) + '</b> sağlam · <b>' + z + '</b> zombi</p><p class="zb-cumle">' + (k ? 'Hep birlikte kurtardınız. Panzehir son zombilere de yetti.' : 'Bir dahaki sefere hep birlikte. Rövanş?') + '</p>' + sonEk(st) + '<div class="zb-adlar"><small>Bu salgında savaşanlar</small><span>' + l.map(esc).join(' · ') + '</span></div><button type="button" class="zb-buyuk" id="zb-yeni-son">Yeni salgın</button><div class="zb-son-kal" aria-hidden="true">' + sinif + '</div></div>';
        _kur = ''; _sah.anahtar = ''; sahneOlc();
    }
    function geceYazi(st) { const sh = SAHNE[st.sahne] || SAHNE.sokak; return geceAcik() ? '🌙 GECE ' + st.gece + ' · ' + GECE[st.gece].ad + ' · ' + sh.ikon : sh.ikon + ' ' + sh.ad; }
    function sonEk(st) {
        const adK = (k) => ilkAd(k.slice(k.indexOf('|') + 1)), sat = [];
        if (st.dev) { const c = Object.keys(st.dev.catlak || {}); const d = st.devSonuc; sat.push('👹 ' + (d && d.dustu ? 'Dev zombi düştü.' : 'Dev zombi barikatı aştı.') + (c.length ? ' Kalbini çatlatanlar: ' + c.map(adK).map(esc).join(', ') : '')); }
        if ((st.zincirler || []).length) sat.push('🔗 Zincir: ' + st.zincirler.map((z) => z.map(adK).map(esc).join(' + ')).join(' · '));
        const su = Object.keys(st.superKul || {}); if (su.length) sat.push('⭐ Süper panzehir: ' + su.map(adK).map(esc).join(', '));
        const gb = Object.keys(st.gorevBasari || {}); if (gb.length) sat.push('🎯 Görevi başaranlar: ' + gb.map(adK).map(esc).join(', '));
        if (st.sinifGorev) sat.push('📢 Sınıf görevi: ' + st.sinifGorev + ' kez hep birlikte');
        const ks = st.kampSonra;
        if (geceAcik() && ks) { if (st.kazandi && st.gece >= GECE_EN) sat.push('🏆 Beş geceyi de geçtiniz! Sıradaki: yine dev zombi gecesi'); else if (st.kazandi) sat.push('🌙 Gece ' + st.gece + ' geçildi! Sıradaki: Gece ' + ks.gece + ' · ' + GECE[ks.gece].ad); else sat.push('🌙 Gece ' + st.gece + ' bir dahaki sefere tekrar'); }
        if (ks && ic('siginak')) (ks.yeniParca || []).forEach((k) => { const p = PARCA.find((x) => x.k === k); if (p) sat.push('🏚️ Sığınağa yeni parça: ' + p.ikon + ' ' + p.ad + ' — ' + p.yazi); });
        return sat.length ? '<div class="zb-son-ek">' + sat.map((x) => '<span>' + x + '</span>').join('') + '</div>' : '';
    }
    // 🌙 Gece / sahne / sığınak paneli (sahnenin içinde açılır, tam ekranda da çalışır)
    function kampPanel() {
        const sa = document.querySelector('.zb-sahne'); if (!sa) return; let p = $('zb-kamp'); if (p) { p.remove(); return; }
        p = document.createElement('div'); p.id = 'zb-kamp'; p.className = 'zb-kamp'; sa.appendChild(p); kampPanelCiz();
    }
    function kampPanelCiz() {
        const p = $('zb-kamp'); if (!p) return; const k = kamp(), st = durum(), basladi = st.faz === 'oyun' && st.seri > 0;
        let h = '<div class="zb-kamp-kutu" role="dialog" aria-label="Gece, sahne ve sığınak"><div class="zb-kamp-ust"><b>🌙 Geceler ve sığınak</b><button type="button" class="zb-kucuk" id="zb-kamp-kapat" aria-label="Kapat">✕</button></div>';
        if (basladi) h += '<p class="zb-kamp-not">Salgın sürüyor: seçimin <b>yeni salgında</b> geçerli olur.</p>';
        if (geceAcik()) {
            h += '<div class="zb-kamp-bas">Gece</div><div class="zb-kamp-izgara">';
            for (let g = 1; g <= GECE_EN; g++) { const acik = g <= k.enYuksek; h += '<button type="button" data-gece="' + g + '" class="' + (g === k.gece ? 'on' : '') + '"' + (acik ? '' : ' disabled') + '><b>' + (acik ? g : '🔒') + '</b><span>' + esc(GECE[g].ad) + '</span><small>' + esc(acik ? GECE[g].yazi : 'Gece ' + (g - 1) + ' geçilince açılır') + '</small></button>'; }
            h += '</div>';
        } else h += '<p class="zb-kamp-not">Geceler kapalı (Oyun Ayarları › İçerik). Her oyun 1. gece.</p>';
        h += '<div class="zb-kamp-bas">Sahne</div><div class="zb-kamp-izgara">';
        h += '<button type="button" data-sahne="oto" class="' + (k.sahne === 'oto' ? 'on' : '') + '"><b>🌙</b><span>Geceye göre</span><small>Her gece başka yer</small></button>';
        Object.keys(SAHNE).forEach((a) => { h += '<button type="button" data-sahne="' + a + '" class="' + (k.sahne === a ? 'on' : '') + '"><b>' + SAHNE[a].ikon + '</b><span>' + esc(SAHNE[a].ad) + '</span><small>' + esc(SAHNE[a].yazi) + '</small></button>'; });
        h += '</div>';
        if (ic('siginak')) {
            h += '<div class="zb-kamp-bas">🏚️ Sığınak · kazanılan gece: ' + k.kazanilan + '</div><div class="zb-kamp-parca">';
            PARCA.forEach((p2) => { const v = k.kazanilan >= p2.esik; h += '<span class="' + (v ? 'on' : '') + '"><b>' + (v ? p2.ikon : '🔒') + ' ' + esc(p2.ad) + '</b><small>' + esc(v ? p2.yazi : p2.esik + '. zaferde açılır') + '</small></span>'; });
            h += '</div>';
        }
        h += '<div class="zb-kamp-bas">Zombi olan çocuk</div><button type="button" class="zb-kamp-yuruyus' + (k.yuruyus ? ' on' : '') + '" data-yuruyus="1"><b>🚶 Zombi yürüyüşü: ' + (k.yuruyus ? 'AÇIK' : 'KAPALI') + '</b><small>Isırılan 10 saniye zombi gibi yürüyüp sıraya döner. Oyun durmaz.</small></button>';
        p.innerHTML = h + '</div>';
    }
    function kampSec(t) {
        const k = kamp(), st = durum();
        if (t.dataset.gece) { const g = +t.dataset.gece; if (g > k.enYuksek) return; k.gece = g; }
        else if (t.dataset.sahne) k.sahne = t.dataset.sahne;
        else if (t.dataset.yuruyus) { k.yuruyus = !k.yuruyus; kampYaz(k); return kampPanelCiz(); }
        kampYaz(k);
        if (st.faz === 'oyun' && !st.seri) { zamanTemizle(); gorevTemizle(); _kilit = false; _gok = null; _st = yeniOyun(); kaydet(); _kur = ''; $('zb-icerik').innerHTML = ''; _sah.anahtar = ''; guncelle(); sahneOlc(); }
        kampPanelCiz();
    }
    function duyur(metin, sinif, alt) { const d = $('zb-duyuru'); if (!d) return; const u = document.querySelector('.zb-ust'); if (u) d.style.top = (u.offsetHeight + 4) + 'px'; d.className = 'zb-duyuru ac ' + (sinif || ''); d.innerHTML = esc(metin) + (alt ? '<small>' + esc(alt) + '</small>' : ''); }
    function duyuruKapa() { const d = $('zb-duyuru'); if (d) d.className = 'zb-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; _finalOynuyor = false; npcTemizle(); }
    function gorevTemizle() { _gorevZ.forEach(clearInterval); _gorevZ = []; const g = $('zb-gorev'); if (g) g.remove(); }
    // Sayaçlar: sis gecesinde zombi sayısı gizli (çatı varsa görünür)
    function sisAktif(st) { return !!(st && st.faz === 'oyun' && sisMi(st.gece) && !parcaVar(st, 'cati')); }
    function sayiYaz(zs, n, st) {
        const sis = sisAktif(st), z = $('zb-z'), sg = $('zb-s'), bar = $('zb-bar');
        if (z) z.textContent = sis ? '?' : zs; if (sg) sg.textContent = sis ? '?' : (n - zs); if (bar) bar.style.width = sis ? '50%' : (n ? zs / n * 100 : 0) + '%';
        const cb = document.querySelector('.zb-cubuk'); if (cb) cb.classList.toggle('sis', sis);
    }
    function flas(tur) { const sa = document.querySelector('.zb-sahne'); if (!sa || azHareket()) return; const c = tur === 'kar' ? 'flas-kar' : 'flas'; sa.classList.remove(c); void sa.offsetWidth; sa.classList.add(c); sonra(() => sa.classList.remove(c), 1200); }
    function karanlikUygula(st) { const sa = document.querySelector('.zb-sahne'); if (sa) sa.classList.toggle('karanlik', !!(st && st.faz === 'oyun' && karanlikMi(st.gece) && !st.isikAcik)); }
    // 👹 Dev zombi: zombi tarafında büyük figür + kalp çatlakları (adlar finalde)
    function devCiz(yeni) {
        const st = durum(), kp = $('zb-kalabalik'); let d = $('zb-dev');
        if (!kp || !st.dev || st.faz !== 'oyun') { if (d && !_finalOynuyor && !_kilit) d.remove(); return; }
        if (!d) { d = document.createElement('div'); d.id = 'zb-dev'; d.className = 'zb-dev'; d.setAttribute('aria-label', 'Dev zombi'); d.innerHTML = '<span class="zb-dev-svg">' + kisiHtml('dev zombi', '#4A3A5A').replace('zb-svg', 'zb-svg zombi') + '</span><span class="zb-dev-kalp" id="zb-dev-kalp"></span>'; kp.appendChild(d); }
        if (yeni) { d.classList.remove('geldi'); void d.offsetWidth; d.classList.add('geldi'); }
        const g = st.dev.gerek, n = Math.min(st.dev.sayi, g); let h = '';
        for (let i = 0; i < g; i++) h += '<i' + (i < n ? ' class="c"' : '') + '></i>';
        const k = $('zb-dev-kalp'); if (k) k.innerHTML = '<b>👹 ' + n + '/' + g + '</b><span>' + h + '</span>';
    }
    function kalasCiz() { const e = $('zb-kalas'); if (!e) return; const n = durum().kalas || 0, v = ic('gorev') && n > 0; e.hidden = !v; const m = v ? '🪵 ' + n + (n >= KALAS_KALKAN ? ' 🛡️' : '') : ''; if (e.textContent !== m) e.textContent = m; }
    // 📢 Sınıf görevi kartı: oyunu durdurmaz; "Yaptık" +1 kalas
    function sinifGorevAc() {
        const st = durum(), sa = document.querySelector('.zb-sahne'); if (st.sgBekle == null || !sa || st.faz !== 'oyun' || $('zb-sgorev')) return;
        const d = document.createElement('div'); d.id = 'zb-sgorev'; d.className = 'zb-sgorev'; d.setAttribute('role', 'dialog');
        d.innerHTML = '<small>📢 SINIF GÖREVİ · hep birlikte</small><b>' + esc(SINIF_GOREV[st.sgBekle % SINIF_GOREV.length]) + '</b><span>Yaylar yerde, atış çizgisinin arkasında. Yaparsanız barikata 🪵 kalas.</span><div><button type="button" class="zb-buyuk" id="zb-sg-tamam">✓ Yaptık</button><button type="button" class="zb-kucuk genis" id="zb-sg-gec">Geç</button></div>';
        sa.appendChild(d); SES.telsiz();
    }
    function sinifGorevKapat(yapti) {
        const st = durum(), d = $('zb-sgorev'); if (d) d.remove(); if (st.sgBekle == null) return;
        st.sgBekle = null; if (yapti) { st.kalas = (st.kalas || 0) + 1; st.sinifGorev = (st.sinifGorev || 0) + 1; SES.cekic(); duyur('📢 SINIF GÖREVİ TAMAM!', 'iyi', '🪵 Kalas çakıldı (' + st.kalas + ')'); setTimeout(duyuruKapa, 1600); }
        kaydet(); kalasCiz();
    }
    // Gerilim katmanı için oyun durumu (canlı tuval okur)
    let _atm = { oran: 0, ilerleme: 0, dev: false, acik: false, son: false };
    function atmGuncelle(st) { const n = atabilenler().length || 1; _atm = { oran: zombiSay(st) / n, ilerleme: atanSay(st) / n, dev: !!st.dev, acik: ic('gerilim') && st.faz === 'oyun', son: st.faz !== 'oyun', sis: sisAktif(st) }; }
    function devKukre() { const d = $('zb-dev'); if (!d || azHareket()) return; d.classList.remove('kukre'); void d.offsetWidth; d.classList.add('kukre'); }
    // 🚶 Zombi yürüyüşü (koç açarsa): ısırılan 10 sn zombi gibi yürüyüp sıraya döner. Oyunu durdurmaz.
    function gorevGoster(adlar) {
        gorevTemizle(); const y = $('zb-yan'); if (!y || !adlar.length) return;
        const g = document.createElement('div'); g.id = 'zb-gorev'; g.className = 'zb-gorev'; let kalan = 10;
        const yaz = () => { g.innerHTML = '<span>🚶 ' + esc(adlar.join(', ')) + '</span><b>' + kalan + '</b><small>sn zombi yürüyüşü, sonra sıraya dön</small>'; };
        yaz(); y.appendChild(g);
        const t = setInterval(() => { kalan--; if (kalan <= 0) { clearInterval(t); g.classList.add('bitti'); g.innerHTML = '<span>✅ ' + esc(adlar.join(', ')) + '</span><small>Sıraya dönebilirsin</small>'; setTimeout(() => { if (g.isConnected) g.remove(); }, 2500); return; } yaz(); }, 1000);
        _gorevZ.push(t);
    }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function kisiEl(k) { return document.querySelector('#zb-kalabalik .zb-kisi[data-k="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]'); }
    function isaretle(k, sinif, ms) { const e = kisiEl(k); if (!e) return; e.classList.remove(sinif); void e.offsetWidth; e.classList.add(sinif); sonra(() => { const x = kisiEl(k); if (x) x.classList.remove(sinif); }, ms || 900); }
    // Panzehir oku: atan çocuktan iyileşene uçar; kendini iyileştirirse yukarıdan iner
    function okUcur(kaynak, hedef) {
        if (azHareket()) return; const a = kisiMerkez(kaynak), b = kisiMerkez(hedef); if (!a || !b) return;
        const ayni = kaynak === hedef; _okEf.push({ x0: ayni ? b.x + 40 : a.x, y0: ayni ? b.y - 130 : a.y, x1: b.x, y1: b.y, t0: performance.now(), sure: 300 });
    }
    // Isırık: sokaktan adsız bir zombi barikatı aşıp çocuğa atlar (hiçbir çocuk ısıran olmaz), sonra çocukla birlikte geri çekilir
    function npcGonder(k) {
        const kp = $('zb-kalabalik'), e = kisiEl(k); if (azHareket() || !kp || !e) return null;
        const r = kp.getBoundingClientRect(), bar = r.height * BAR_ORAN, g = parseFloat(e.style.width) || 60, y = parseFloat(e.style.height) || 90, x = parseFloat(e.style.left) || 0, ust = parseFloat(e.style.top) || 0, n = document.createElement('span');
        n.className = 'zb-npc zombi'; n.innerHTML = kisiHtml('sokak zombisi', '#6B7280'); n.style.cssText = 'left:' + x + 'px;top:' + (bar - y * .9) + 'px;width:' + g + 'px;height:' + y + 'px;opacity:0;z-index:45'; kp.appendChild(n); _npc.push(n);
        void n.offsetWidth; n.style.opacity = '1'; n.style.zIndex = '66'; n.style.left = (x - g * .18) + 'px'; n.style.top = (ust - y * .12) + 'px';
        return n;
    }
    function npcTemizle() { _npc.forEach((n) => n.remove()); _npc = []; }
    // Final sahnesi: kazanınca güneş doğar, son zombiler de iyileşir; kaybedince barikat yıkılır, herkes zombi. Sonra sonuç ekranı.
    function finalSahne(st, sonrasi) {
        const k = st.kazandi, kp = $('zb-kalabalik'); _gok = { tip: k ? 'safak' : 'kizil', t0: performance.now() }; (k ? SES.zafer : SES.yenilgi)();
        if (!kp || azHareket()) { _finalOynuyor = false; return sonrasi(); }
        _finalOynuyor = true;
        const el = Array.from(kp.querySelectorAll('.zb-kisi')), bitti = () => { _finalOynuyor = false; npcTemizle(); sonrasi(); };
        duyur(k ? 'SALGIN DURDU!' : 'BARİKAT DÜŞTÜ!', k ? 'iyi' : 'kotu');
        if (k) {
            const z = el.filter((b) => b.classList.contains('zombi'));
            z.forEach((b, i) => sonra(() => { b.classList.remove('zombi'); isaretle(b.getAttribute('data-k'), 'kurtuldu', 900); const m = kisiMerkez(b.getAttribute('data-k')); if (m) patla(m.x, m.y, ['#9BEA5A', '#FFD86B', '#FFFFFF'], 14); if (i % 2 === 0) ton(880 + i * 40, .12, 0, 'triangle', .05); }, 500 + i * 120));
            sonra(() => { yerlesim({}); }, 700 + z.length * 120);
        } else {
            const b = $('zb-barikat'); if (b) b.classList.add('yikil'); kp.classList.remove('sars'); void kp.offsetWidth; kp.classList.add('sars');
            const hepsi = {}; el.forEach((x) => { hepsi[x.getAttribute('data-k')] = 1; });
            el.filter((x) => !x.classList.contains('zombi')).forEach((x, i) => sonra(() => { x.classList.add('zombi'); isaretle(x.getAttribute('data-k'), 'isirildi', 800); }, 400 + i * 90));
            void hepsi;
        }
        sonra(() => { duyuruKapa(); bitti(); }, 2800);
    }
    function acilis(z) {
        _kilit = true; const adlar = z.map((k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)))).join(', ');
        duyur('SALGIN BAŞLADI! ' + adlar + ' ZOMBİ OLDU!', 'kotu'); SES.isir(); z.forEach((k) => isaretle(k, 'isirildi', 900));
        sonra(() => { duyuruKapa(); _kilit = false; }, 2200);
    }

    /* ---- seri ---- */
    function zbSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; } // sonuç ekranında girilen seri kayda geçer, oyunu etkilemez
        if (!st.basladi) salginBaslat(st);
        const key = kimlik(s), ham = (kaydedilecek || []).map((k) => String(k.puan)), puanlar = ham.map(puan), esik = esikOf(ortalama(s)), herkes = atabilenler().map(kimlik);
        const gv = ic('gorev') ? gorevOf(key, st.atan[key] || 0, st.tarih) : null, gvOk = !!(gv && gv.ok(puanlar, esik));
        const pz = panzehirSay(puanlar, esik), ozel = ic('ozelOk'), an = { super: false, isik: false, zincir: null, sise: false, projektorYandi: false, devCatlak: 0 };
        let ekKurtar = 0;
        // ⭐ süper panzehir: X/10, çocuk başı oyunda bir kez · 💡 ışık bombası: 3 okun hepsi panzehir · 🔗 zincir: art arda farklı çocuklar
        if (ozel && pz > 0 && superMi(ham) && !st.superKul[key]) { an.super = true; st.superKul[key] = 1; ekKurtar++; }
        if (ozel && isikBombasiMi(puanlar, esik)) an.isik = true;
        if (pz > 0) { if (st.zincir[st.zincir.length - 1] !== key) st.zincir.push(key); } else st.zincir = [];
        if (ozel && pz > 0 && st.zincir.length >= zincirHedef(st.sahne)) { an.zincir = st.zincir.slice(); st.zincirler.push(an.zincir); st.zincir = []; ekKurtar++; }
        if (st.sahne === 'hastane' && pz > 0) { st.sise++; if (st.sise >= siseGerek(herkes.length)) { an.sise = true; st.sise = 0; ekKurtar++; } }
        if ((an.isik || an.zincir) && karanlikMi(st.gece) && !st.isikAcik) { st.isikAcik = true; an.projektorYandi = true; }
        const devCanli = !!(st.dev && !st.devSonuc);
        if (devCanli && pz > 0) { const c = an.super ? 2 : 1; st.dev.sayi += c; st.dev.catlak[key] = (st.dev.catlak[key] || 0) + c; an.devCatlak = c; }
        const ge = geceEtkisi(st.gece, st.sahne, (st.seri || 0) + 1, st.isikAcik, devCanli, devCanli ? st.dev.dogdu : 0);
        let atla = an.isik ? 'isik' : ge.atla;
        if (!atla && parcaVar(st, 'projektor') && !st.projektorKul) { atla = 'projektor'; st.projektorKul = true; }
        if (!atla && ic('gorev') && st.kalas >= KALAS_KALKAN && (herkes.some((k) => st.zombi[k]) || ic('dalga'))) { atla = 'kalas'; st.kalas -= KALAS_KALKAN; }
        const oncekiZ0 = Object.assign({}, st.zombi);
        const r = adimHesapla(st, key, puanlar, esik, herkes, rastgele, ic('dalga'), { ekKurtar, isirikAtla: !!atla, ekIsirik: ge.ek.length });
        st.atan[key] = (st.atan[key] || 0) + 1;
        if (r.iyilesen.length) st.kurtardi[key] = (st.kurtardi[key] || 0) + 1;
        if (gvOk) { st.kalas = (st.kalas || 0) + 1; st.gorevBasari[key] = (st.gorevBasari[key] || 0) + 1; }
        const devGeldi = devDogsunMu(st), final = herkesAtti(st);
        const sonrakiZ = Object.assign({}, st.zombi); let dv = null;
        if (final) { dv = devCoz(st, herkes, rastgele); st.sonZ = herkes.filter((k) => st.zombi[k]).length; bitir(st); }
        kaydet();
        if (!panel()) return bit();
        const adi = buyuk(ilkAd(s.ad)), adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
        if (!$('zb-oyun')) oyunIskelet();
        // kalabalık önce iyileşeni gösterir, ısırık sonra, dev zombinin sonucu en son
        const goster = (zombiler) => { document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b) => b.classList.toggle('zombi', !!zombiler[b.getAttribute('data-k')])); yerlesim(zombiler); sayiYaz(herkes.filter((k) => zombiler[k]).length, herkes.length, durum()); _atm.oran = herkes.length ? herkes.filter((k) => zombiler[k]).length / herkes.length : 0; };
        const ara = Object.assign({}, oncekiZ0); r.iyilesen.forEach((k) => delete ara[k]);
        if (!r.iyilesen.length) goster(ara);
        let bek = 0;
        const altlar = [];
        if (an.zincir) altlar.push('🔗 ZİNCİR: ' + an.zincir.map(adOf).join(' + '));
        if (an.sise) altlar.push('🧪 ŞİŞE DOLDU, BİR KİŞİ DAHA!');
        if (an.devCatlak) altlar.push('👹 DEV ZOMBİDE ÇATLAK ' + Math.min(st.dev.sayi, st.dev.gerek) + '/' + st.dev.gerek);
        if (r.iyilesen.length) {
            r.iyilesen.forEach((h, j) => sonra(() => okUcur(key, h), j * 140)); SES.ok();
            sonra(() => { goster(ara); r.iyilesen.forEach((h) => { isaretle(h, 'kurtuldu', 1100); const m = kisiMerkez(h); if (m) patla(m.x, m.y, an.super ? ['#FFD86B', '#FFFFFF', '#FFC24B'] : ['#9BEA5A', '#D8FFB0', '#FFD86B', '#FFFFFF'], an.super ? 44 : 30); }); SES.kurtar(); if (ic('koro')) SES.alkis(); devCiz(); }, 300);
            const adlar = r.iyilesen.map(adOf).join(', ');
            const ana = an.super ? '⭐ ' + adi + ' SÜPER PANZEHİR! ' + adlar + ' KURTULDU!' : (r.iyilesen.length === 1 && r.iyilesen[0] === key ? adi + ' PANZEHİRİ VURDU, İYİLEŞTİ!' : adi + ' PANZEHİR ATTI, ' + adlar + ' KURTULDU!');
            if (ic('koro')) altlar.push('👏 KAHRAMAN POZU!');
            duyur(ana, 'iyi', altlar.join(' · ')); bek = 1500;
        } else if (r.panzehir) { duyur(adi + ' PANZEHİR ATTI! ZOMBİ KALMADI!', 'iyi', altlar.join(' · ')); SES.kurtar(); devCiz(); bek = 1200; }
        else { duyur(adi + ': AZ KALDI!', ''); SES.kacti(); bek = 900; }
        if (an.isik || an.projektorYandi) {
            sonra(() => { flas(); SES.isik(); duyur(an.isik ? '💡 IŞIK BOMBASI! ZOMBİLER GÖZLERİNİ KAPATTI' : '🔦 PROJEKTÖR YANDI!', 'iyi', an.projektorYandi ? 'Sokak aydınlandı: karanlık ısırıkları bitti' : 'Bu atışta kimse ısırılmadı'); karanlikUygula(durum()); }, bek); bek += 1500;
        } else if (atla) {
            const m = { kalas: ['🪵 KALASLAR DAYANDI! ISIRIK DURDU', 'Görevlerle çakılan kalaslar barikatı korudu'], tipi: ['❄️ TİPİ! ZOMBİLER DONDU', 'Bu atışta kimse ısırılmadı'], projektor: ['🔦 SIĞINAĞIN PROJEKTÖRÜ! ZOMBİLER GERİ KAÇTI', 'İlk ısırık gelmedi'] }[atla];
            if (m) { sonra(() => { duyur(m[0], 'iyi', m[1]); SES.kacti(); if (atla === 'tipi') flas('kar'); }, bek); bek += 1300; }
        }
        if (r.isirilan.length) {
            const neden = ge.ek.map((e) => ({ kosucu: 'KOŞUCU ZOMBİ', karanlik: 'KARANLIKTA', dev: 'DEV ZOMBİ KÜKREDİ' }[e])).filter(Boolean);
            if (parcaVar(st, 'telsiz')) { sonra(() => { duyur('📻 TELSİZ: ZOMBİLER GELİYOR!', ''); SES.telsiz(); }, bek); bek += 700; }
            sonra(() => { SES.atla(); r.isirilan.forEach(npcGonder); if (ge.ek.includes('dev')) devKukre(); }, bek); bek += 420;
            sonra(() => {
                goster(sonrakiZ); SES.isir(); r.isirilan.forEach((k) => { isaretle(k, 'isirildi', 1000); const m = kisiMerkez(k); if (m) patla(m.x, m.y, ['#9BEA5A', '#5D9436', '#EDE6C8'], 18); }); _npc.forEach((n) => { n.style.top = '0px'; n.style.opacity = '0'; }); sonra(npcTemizle, 1100);
                const sah = $('zb-kalabalik'); if (sah && !azHareket()) { sah.classList.remove('sars'); void sah.offsetWidth; sah.classList.add('sars'); }
                duyur((r.dalga ? 'YENİ DALGA! ' : (neden.length ? neden.join(' + ') + '! ' : 'ZOMBİLER SALDIRDI! ')) + r.isirilan.map(adOf).join(', ') + ' ISIRILDI!', 'kotu', ic('koro') ? '🧟 ZOMBİLER HEP BİRLİKTE: HIRRR!' : '');
                if (ic('koro')) hirilti(.16, .35);
                if (kamp().yuruyus) gorevGoster(r.isirilan.map(adOf));
            }, bek); bek += 1400;
        }
        if (gvOk) { sonra(() => { duyur('🎯 ' + adi + ' GÖREVİ BAŞARDI!', 'iyi', '🪵 Barikata kalas çakıldı (' + st.kalas + ')' + (st.kalas >= KALAS_KALKAN ? ' · sıradaki ısırık durur' : '')); SES.cekic(); kalasCiz(); }, bek); bek += 1300; }
        if (!final && ic('gorev') && st.seri % 5 === 0) { st.sgBekle = (st.sinifGorev + st.seri) % SINIF_GOREV.length; kaydet(); sonra(() => sinifGorevAc(), bek + 200); }
        if (devGeldi) {
            sonra(() => { devCiz(true); SES.boom(); hirilti(.16, .2); duyur('👹 DEV ZOMBİ GELDİ!', 'kotu', 'Kalbini hep birlikte çatlatın: ' + st.dev.gerek + ' çatlak · son ok atılınca düşer'); }, bek); bek += 2200;
        }
        sonra(() => {
            duyuruKapa();
            if (final) {
                const devsiz = () => finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } });
                if (dv) return devFinal(dv, goster, devsiz);
                devsiz(); return;
            }
            bit();
        }, bek);
    }
    // Dev zombinin sonu: herkes attıktan sonra (STANDING) düşer ya da barikatı aşar
    function devFinal(dv, goster, sonrasi) {
        const adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1))), d = $('zb-dev');
        if (d) d.classList.add(dv.dustu ? 'dustu' : 'asti');
        if (dv.dustu) { SES.boom(); sonra(SES.zafer, 300); duyur('👹 DEV ZOMBİ DÜŞTÜ!', 'iyi', dv.iyilesen.length ? dv.iyilesen.map(adOf).join(', ') + ' KURTULDU' : 'Hep birlikte çatlattınız'); }
        else { SES.isir(); hirilti(.18, .1); duyur('👹 DEV ZOMBİ BARİKATI AŞTI!', 'kotu', dv.isirilan.length ? dv.isirilan.map(adOf).join(', ') + ' ISIRILDI' : ''); }
        sonra(() => { goster(durum().zombi); (dv.dustu ? dv.iyilesen : dv.isirilan).forEach((k) => { isaretle(k, dv.dustu ? 'kurtuldu' : 'isirildi', 1000); const m = kisiMerkez(k); if (m) patla(m.x, m.y, dv.dustu ? ['#FFD86B', '#FFFFFF'] : ['#9BEA5A', '#5D9436'], 26); }); }, 700);
        sonra(() => { duyuruKapa(); sonrasi(); }, 2600);
    }
    function zbFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; const herkes = atabilenler().map(kimlik), dv = devCoz(s, herkes, rastgele); s.sonZ = zombiSay(s); bitir(s); kaydet(); zamanTemizle(); const son = () => finalSahne(s, () => guncelle()); if (dv && $('zb-oyun')) { const goster = (z) => { document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b) => b.classList.toggle('zombi', !!z[b.getAttribute('data-k')])); yerlesim(z); }; devFinal(dv, goster, son); } else son(); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Salgın şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Sonuçta herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Ekrandakiler bu sınıf. Birkaç kişi zombi başlar.<br>Atış iyiyse panzehir olur: bir zombi kurtulur, zombi çocuk önce kendini kurtarır. "İyi atış" çocuğun kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.<br>Her atıştan sonra zombiler bir kişiyi ısırır.<br>Herkes atınca sağlam çoğunluktaysa salgın durur.<br><br><b>⭐ Süper panzehir</b>: X ya da 10 iki kişiyi kurtarır (oyunda bir kez). <b>💡 Işık bombası</b>: üç okun hepsi panzehirse o atışta ısırık yok. <b>🔗 Zincir</b>: art arda üç çocuk panzehir atarsa bir kişi daha kurtulur.<br><b>👹 Dev zombi</b>: son turda sınıfın yarısı atınca gelir; her panzehir kalbini çatlatır, son ok atılınca düşer ya da barikatı aşar.<br><b>🌙 Geceler</b>: kazanınca yeni gece açılır, her gece bir yenilik. Kazanılan geceler sığınağa parça ekler.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); gorevTemizle(); const sg = $('zb-sgorev'); if (sg) sg.remove(); _kilit = false; _gok = null; _st = yeniOyun(); kaydet(); _kur = ''; _sah.anahtar = ''; const kp = $('zb-kamp'); if (kp) kp.remove(); $('zb-icerik').innerHTML = ''; guncelle(); sahneOlc(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni salgın başlasın mı?<br><small>Sporcu serileri silinmez.</small>', f, 'Yeni salgın', 'Vazgeç'); else f();
    }
    function zbSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); gorevTemizle(); _kilit = false; _kur = '';
        p.innerHTML = '<div class="zb-sahne"><canvas id="zb-zemin" aria-hidden="true"></canvas><canvas id="zb-canli" aria-hidden="true"></canvas><div id="zb-icerik"></div><canvas id="zb-efekt" aria-hidden="true"></canvas></div>'; _fx = []; _okEf = []; _npc = []; _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' };
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'zb-nasil') nasil(); else if (t.id === 'zb-yeni-btn' || t.id === 'zb-yeni-son') yeniSor(); else if (t.id === 'zb-bitir') zbFinalZorla(); else if (t.id === 'zb-gece-btn' || t.id === 'zb-kamp-kapat') kampPanel(); else if (t.id === 'zb-sg-tamam' || t.id === 'zb-sg-gec') sinifGorevKapat(t.id === 'zb-sg-tamam'); else if (t.closest('#zb-kamp')) kampSec(t);
        };
        guncelle(); sahneOlc();
        if (window.ResizeObserver) { if (p._zbRo) p._zbRo.disconnect(); p._zbRo = new ResizeObserver(() => { const kp = $('zb-kalabalik'); if (!kp) return void sahneOlc(); kp.classList.remove('gecis'); yerlesim(); requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); })); }); p._zbRo.observe(p); }
        if (!_raf && !azHareket()) _raf = requestAnimationFrame(dongu); else if (azHareket()) canliCiz(performance.now());
    }
    function css() {
        if ($('zb-css')) return; const st = document.createElement('style'); st.id = 'zb-css';
        st.textContent = '.km-oyun-panel-zombi{padding:0;background:#0C1412;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.zb-sahne{position:absolute;inset:0;color:#F2F6EE;overflow:hidden;background:#0C1412}#zb-zemin,#zb-canli,#zb-efekt{position:absolute;left:0;top:0;width:100%;height:100%;display:block;max-width:none}#zb-efekt{z-index:2;pointer-events:none}'
            + '#zb-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.zb-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:6px;min-height:0}'
            + '.zb-ust{flex:none;position:relative;z-index:70;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:4px 10px;border-radius:12px;background:rgba(5,9,8,.72)}'
            + '.zb-say{display:flex;flex-direction:column;align-items:center;min-width:76px;line-height:1}.zb-say b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(44px,6vw,68px);font-weight:800;font-variant-numeric:tabular-nums}.zb-say span{font-size:13px;font-weight:800;letter-spacing:.08em}.zb-say.z b,.zb-say.z span{color:#9BEA5A}.zb-say.s b,.zb-say.s span{color:#7CCBFF}'
            + '.zb-cubuk{height:18px;border-radius:9px;background:#3A7FB8;overflow:hidden}.zb-cubuk i{display:block;height:100%;background:#7FD63F;transition:width .5s}'
            + '.zb-bilgi{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px;font-size:clamp(13px,1.45vw,17px);font-weight:700;color:#DCE6D6;align-items:baseline}.zb-bilgi b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,2.6vw,32px);font-weight:800;color:#FFC24B}.zb-kl{color:#FFB199}'
            + '.zb-kalabalik{flex:1;min-height:0;position:relative}#zb-barikat{position:absolute;z-index:50;pointer-events:none;display:block;max-width:none}.zb-npc{position:absolute;display:block;pointer-events:none;transition:left .36s ease-in,top .36s ease-in,opacity .2s}.zb-npc .zb-svg{height:100%}.zb-npc .zb-spr.z{display:block}.zb-npc .zb-spr.n{display:none}#zb-barikat.yikil{transition:transform 1.4s cubic-bezier(.5,0,.9,.5),opacity 1.4s;transform:translateY(60%) rotate(2deg);opacity:0}.zb-kalabalik.sars{animation:zb-sars .4s}.zb-kalabalik.gecis .zb-kisi{transition:left 1s ease-in-out,top 1s ease-in-out,width .5s,height .5s}'
            + '.zb-kisi{position:absolute;min-width:0;min-height:44px;padding:0;border:0;background:transparent;color:#F2F6EE;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1px}'
            + '.zb-kafa{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center}.zb-svg{position:relative;display:block;height:100%;aspect-ratio:26/36;max-width:100%;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}.zb-spr{position:absolute;inset:0;display:block;background-size:200% 100%;background-repeat:no-repeat;image-rendering:pixelated}.zb-spr.z{display:none}.zombi>.zb-svg .zb-spr.z,.zombi .zb-kafa .zb-spr.z{display:block}.zombi>.zb-svg .zb-spr.n,.zombi .zb-kafa .zb-spr.n{display:none}'
            + '.zb-ad{flex:none;max-width:100%;font-size:var(--ad,13px);font-weight:800;line-height:1.15;padding:1px 6px;border-radius:7px;background:rgba(8,12,12,.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-kisi.zombi .zb-ad{color:#BDF58C}'
            + '.zb-tik:empty{display:none}.zb-kisi.atti .zb-ad:before{content:"✓ ";color:#FFC24B}'
            + '.zb-sira{display:none;position:absolute;top:-2px;left:50%;transform:translateX(-50%);padding:1px 8px;border-radius:6px;background:#FFC24B;color:#1A1000;font-style:normal;font-size:12px;font-weight:800;z-index:2}.zb-kisi.aktif .zb-sira{display:block}.zb-kisi.aktif .zb-ad{background:#FFC24B;color:#1A1000}.zb-kisi.aktif .zb-svg{filter:drop-shadow(0 0 7px #FFC24B)}'
            + '.zb-duyuru{position:absolute;left:0;right:0;z-index:95;text-align:center;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(22px,3vw,38px);line-height:1.05;padding:6px 12px;border-radius:10px;background:rgba(6,10,10,.88);color:#fff;opacity:0;pointer-events:none;transform:scale(.94);transition:opacity .12s,transform .12s}.zb-duyuru.ac{opacity:1;transform:none}.zb-duyuru.iyi{color:#FFD86B}.zb-duyuru.kotu{color:#9BEA5A}'
            + '.zb-ok{position:absolute;z-index:90;width:44px;height:5px;margin:-2px 0 0 -22px;background:#FFE9B0;border-radius:2px;transform-origin:center;pointer-events:none}'
            + '.zb-yan{position:absolute;z-index:70;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(5,9,8,.72);display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}.zb-yan-hedef{flex:none;width:112px}.zb-yan-hedef svg{display:block;width:100%}.zb-yan-hedef .m{fill:#2F7FD6}.zb-yan-hedef .k{fill:#E23B2E}.zb-yan-hedef .s{fill:#F5D32A}.zb-yan-hedef[data-esik="7"] .m,.zb-yan-hedef[data-esik="9"] .m,.zb-yan-hedef[data-esik="9"] .k{fill:#2A3430}'
            + '.zb-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.zb-yan-yazi small{font-size:13px;font-weight:800;letter-spacing:.1em;color:#C9D4C4}.zb-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(34px,4.4vw,56px);font-weight:800;line-height:1;color:#FFC24B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-yan-yazi span{font-size:clamp(15px,1.5vw,19px);font-weight:800;line-height:1.25}.zb-sira-hud{display:none}'
            + '.zb-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.zb-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid #3B4A44;background:#17211E;color:#F2F6EE;font:inherit;font-weight:800;cursor:pointer}.zb-kucuk[hidden]{display:none}.zb-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.zb-son{height:100%;overflow-y:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:10px 14px;border-radius:14px;background:rgba(5,9,8,.68)}.zb-son-kal{flex:none;display:flex;flex-wrap:wrap;gap:2px 6px;padding-top:4px}.zb-son-kisi{display:block;height:58px}.zb-son-kisi .zb-svg{height:100%}.zb-son-kisi.zombi .zb-spr.z{display:block}.zb-son-kisi.zombi .zb-spr.n{display:none}.zb-et{font-size:clamp(13px,1.5vw,17px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#DCE6D6}.zb-son h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(44px,6vw,80px);line-height:.92}.zb-son.kazandi h2{color:#FFD86B}.zb-son.kaybetti h2{color:#9BEA5A}.zb-sonuc{margin:0;font-size:clamp(20px,2.6vw,32px);font-weight:700}.zb-sonuc b{font-family:"Barlow Condensed",sans-serif;font-size:1.3em}.zb-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#DCE6D6}'
            + '.zb-adlar{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(8,12,12,.72)}.zb-adlar small{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#B9C6B3}.zb-adlar span{font-size:clamp(14px,1.45vw,18px);font-weight:700;line-height:1.4}.zb-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFC24B;color:#1A1000;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.zb-sahne button:focus-visible{outline:3px solid #FFC24B;outline-offset:2px}'
            + '.zb-duyuru small{display:block;margin-top:3px;font-family:"Manrope",system-ui,sans-serif;font-size:clamp(14px,1.6vw,20px);font-weight:800;color:#F2F6EE;letter-spacing:.02em}.zb-gece{border:1px solid #4A5A3A;background:rgba(23,33,30,.92);color:#FFC24B;font:inherit;font-weight:800;font-size:clamp(12px,1.3vw,15px);border-radius:999px;padding:3px 12px;min-height:34px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-sise{font-weight:800;color:#9FE6F2}.zb-siginak{letter-spacing:2px}.zb-siginak:empty{display:none}.zb-kalas{font-weight:800;color:#E8B87A}.zb-kalas[hidden]{display:none}.zb-yan-gorev{display:block;margin-top:2px;font-style:normal;font-size:clamp(14px,1.45vw,18px);font-weight:800;color:#FFE1A8;line-height:1.25}.zb-yan-gorev[hidden]{display:none}.zb-sgorev{position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:110;width:min(560px,92%);box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:16px;background:rgba(40,24,6,.95);border:2px solid #FFB347;box-shadow:0 20px 50px rgba(0,0,0,.55);color:#FFF1D8;text-align:center}.zb-sgorev small{font-size:12.5px;font-weight:800;letter-spacing:.1em;color:#FFC24B}.zb-sgorev b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(28px,4vw,48px);line-height:1.05}.zb-sgorev span{font-size:14px;font-weight:700;color:#E8D3B0}.zb-sgorev div{display:flex;gap:8px;justify-content:center;margin-top:4px}.zb-sgorev .zb-buyuk{align-self:auto;min-height:52px}.zb-cubuk.sis{background:#56646A}.zb-cubuk.sis i{background:repeating-linear-gradient(45deg,#7B8A90 0 8px,#5E6C72 8px 16px)}.zb-kalabalik.sis::before{content:"";position:absolute;left:0;right:0;top:0;height:50%;z-index:49;pointer-events:none;background:linear-gradient(180deg,rgba(160,178,184,.12),rgba(176,190,196,.34))}.zb-kalabalik.sis .zb-kisi.zombi .zb-svg{filter:blur(2.5px) grayscale(.7) brightness(.85);opacity:.75}.zb-kalabalik.sis .zb-dev .zb-svg{filter:blur(3px) grayscale(.6)}.zb-sahne.karanlik #zb-zemin,.zb-sahne.karanlik #zb-canli{filter:brightness(.3)}.zb-sahne.karanlik .zb-kisi:not(.aktif) .zb-svg{filter:brightness(.5)}.zb-sahne.flas::after,.zb-sahne.flas-kar::after{content:"";position:absolute;inset:0;z-index:96;pointer-events:none;animation:zb-flas 1.1s ease-out forwards}.zb-sahne.flas::after{background:#FFFBE0}.zb-sahne.flas-kar::after{background:#E6F2FF}@keyframes zb-flas{0%{opacity:.9}100%{opacity:0}}.zb-dev{position:absolute;right:1%;top:0;width:20%;height:50%;z-index:48;display:flex;flex-direction:column;align-items:center;pointer-events:none;transform-origin:50% 100%}.zb-dev-svg{flex:1;min-height:0;width:100%;display:flex;justify-content:center;align-items:flex-end;padding-top:30px;box-sizing:border-box}.zb-dev .zb-svg{height:100%;filter:drop-shadow(0 0 12px rgba(255,90,70,.55))}.zb-dev .zb-spr.z{display:block}.zb-dev .zb-spr.n{display:none}.zb-dev-kalp{position:absolute;top:0;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;background:rgba(8,12,12,.86);padding:3px 8px;border-radius:8px;white-space:nowrap;z-index:2}.zb-dev-kalp b{font-size:13px;color:#FF8A7A}.zb-dev-kalp span{display:flex;flex-wrap:wrap;justify-content:center;max-width:140px;gap:2px}.zb-dev-kalp i{width:10px;height:8px;border-radius:2px;background:#4A3A3A}.zb-dev-kalp i.c{background:#9BEA5A}.zb-dev.dustu{transition:transform 1.2s ease-in,opacity 1.2s;transform:rotate(80deg) translateY(20%);opacity:0}.zb-dev.asti{transition:transform .9s;transform:translateY(60%) scale(1.15)}.zb-gorev{width:100%;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;padding:6px 10px;border-radius:10px;background:#3A1E12;border:1px solid #FFB347;color:#FFE1B8;font-weight:800;box-sizing:border-box}.zb-gorev b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:30px;line-height:1;color:#FFB347}.zb-gorev small{font-size:13px}.zb-gorev.bitti{background:#16301E;border-color:#9BEA5A;color:#D8FFB0}.zb-kamp{position:absolute;inset:0;z-index:120;background:rgba(4,8,7,.84);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto;box-sizing:border-box}.zb-kamp-kutu{width:min(860px,100%);background:#121C19;border:1px solid #3B4A44;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;color:#F2F6EE;box-sizing:border-box}.zb-kamp-ust{display:flex;justify-content:space-between;align-items:center;font-size:18px}.zb-kamp-bas{font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#9BEA5A;margin-top:4px}.zb-kamp-not{margin:0;font-size:13px;color:#C9D4C4}.zb-kamp-izgara,.zb-kamp-parca{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.zb-kamp-izgara button,.zb-kamp-yuruyus{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px;border-radius:12px;border:2px solid #3B4A44;background:#17211E;color:#F2F6EE;font:inherit;cursor:pointer;min-height:44px}.zb-kamp-izgara button b{font-size:20px}.zb-kamp-izgara button span{font-weight:800;font-size:14px}.zb-kamp-izgara small,.zb-kamp-yuruyus small,.zb-kamp-parca small{font-size:11.5px;color:#B9C6B3;line-height:1.3}.zb-kamp-izgara button.on,.zb-kamp-yuruyus.on{border-color:#FFC24B;background:#2A2412}.zb-kamp-izgara button:disabled{opacity:.45;cursor:not-allowed}.zb-kamp-parca span{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:12px;border:2px dashed #3B4A44;opacity:.65}.zb-kamp-parca span.on{border-style:solid;border-color:#9BEA5A;opacity:1}.zb-son-ek{display:flex;flex-direction:column;gap:4px;padding:8px 12px;border-radius:12px;background:rgba(40,30,8,.72);font-size:clamp(14px,1.45vw,18px);font-weight:800;color:#FFE1A8}@media(prefers-reduced-motion:no-preference){.zb-dev.geldi{animation:zb-dev-gel 1.3s ease-out}.zb-dev.kukre .zb-svg{animation:zb-isir .8s}@keyframes zb-dev-gel{0%{transform:translateY(-30%) scale(.5);opacity:0}60%{transform:translateY(4%) scale(1.08);opacity:1}100%{transform:none}}}@media(max-width:860px){.zb-kalabalik{min-height:42%}.zb-yan .zb-yan-yazi{flex:1 1 170px}.zb-yan .zb-arac{flex:none}.zb-yan-gorev{font-size:12.5px;margin-top:0}.zb-yan .zb-yan-hedef{width:40px}.zb-bilgi{gap:2px 8px;margin-top:3px}.zb-sgorev{top:12%}.zb-sgorev b{font-size:26px}.zb-dev{width:24%}.zb-dev-kalp b{font-size:11px}.zb-kamp-izgara,.zb-kamp-parca{grid-template-columns:repeat(2,minmax(0,1fr))}.zb-gece{font-size:12px;padding:2px 8px;min-height:30px}}'
            + '@media(prefers-reduced-motion:no-preference){.zb-spr{animation:zb-kare 1.3s steps(2,jump-end) infinite}.zombi .zb-spr{animation-duration:.7s}.zb-son.kazandi .zb-son-kisi:not(.zombi) .zb-svg{animation:zb-zipla .8s ease-in-out infinite;animation-delay:calc(var(--g) * -.11s)}@keyframes zb-kare{from{background-position:0 0}to{background-position:200% 0}}.zb-kisi.zombi .zb-svg{animation:zb-sal 1.5s ease-in-out infinite;transform-origin:50% 100%}.zb-kisi.isirildi .zb-svg{animation:zb-isir .9s}.zb-kisi.kurtuldu .zb-svg{animation:zb-kurtul .9s}.zb-kisi.aktif:not(.zombi) .zb-svg{animation:zb-zipla .9s ease-in-out infinite}@keyframes zb-sal{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes zb-zipla{0%,100%{transform:none}50%{transform:translateY(-6%)}}@keyframes zb-isir{0%{transform:scale(1)}20%{transform:scale(1.28) rotate(-8deg)}40%{transform:scale(1.1) rotate(8deg)}60%{transform:scale(1.22) rotate(-5deg)}100%{transform:none}}@keyframes zb-kurtul{0%{transform:scale(.8)}35%{transform:scale(1.35) translateY(-12%)}100%{transform:none}}@keyframes zb-sars{20%{transform:translateX(9px)}45%{transform:translateX(-8px)}70%{transform:translateX(5px)}}}'
            + '.zb-kisi.kurtuldu .zb-svg{filter:drop-shadow(0 0 14px #FFD86B)}.zb-kisi.isirildi .zb-svg{filter:drop-shadow(0 0 14px #9BEA5A)}'
            + '@media(max-width:860px){#zb-icerik{padding:8px 8px 8px}.zb-say{min-width:58px}.zb-sira-hud{display:inline}.zb-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.zb-yan-hedef{width:52px}.zb-yan-yazi small,.zb-yan-yazi b{display:none}.zb-yan-yazi span{font-size:14px}.zb-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.zbSahneKur = zbSahneKur;
    window.zbGuncelle = guncelle;
    window.zbSeri = zbSeri;
    window.zbAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.zbGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); _kilit = false; _st = k; _kn = konum(); kaydet(); if ($('zb-icerik')) { if (k.faz === 'oyun' && !$('zb-oyun')) $('zb-icerik').innerHTML = ''; guncelle(); } };
    window.zbSporcu = (g, ad) => (durum().kurtardi || {})[g + '|' + ad] || 0;
    window.zbAyarUygula = () => { if ($('zb-icerik')) guncelle(); };
    window.zbFinalZorla = zbFinalZorla;
    window.zbDurum = durum;
    window._zbIc = { GOREV, gorevOf, KALAS_KALKAN, SINIF_GOREV, esikOf, panzehirSay, baslangicSay, isirikSay, kazandi, adimHesapla, ISIRIK_ARALIK, geceEtkisi, superMi, isikBombasiMi, zincirHedef, siseGerek, devGerek, devCoz, GECE, SAHNE, PARCA, SAHNE_GECE };
    window.zbKamp = kamp;
})();
