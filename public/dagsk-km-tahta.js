/* ================================================================================================
   🎲 DEV TAHTA — Karışık Sınıf › Oyunlar teması 'tahta' (2026-11-09, v393). Kullanıcı: "çocuklar hep aynı şeyi yaptığı için sıkılıyor: at, puan say, gel yaz,
   ilerle… arada fiziksel aktivite de olsun". Beş fikirden "B Salon Tahtası + A Görev Kartı"nı seçti ("detayını daha iyi kurgula ve yap").
   OYUN: sınıf 2–4 takıma (dengeli) bölünür, her takımın tahtada bir piyonu var. Seri adıma dönüşür (çocuğun KENDİ seviyesine göre): kendi hedefini vuran ok 2,
     hedefe değen ok 1 adım. Her "el"de (aynı anda atan kişi sayısı kadar seri) yeni bir KURAL KARTI çekilir (Renk Avı, Çift Güç, İlk/Son Ok Joker, Tam Seri, Şanslı El)
     ve yeni bir YÜRÜYÜŞ KARTI (hedefe giderken, eller boş: yengeç, penguen…). Tahtada özel kareler: 🏃 Hareket (takım görevi, süre bitince +1), 🚀 Roket (+3),
     🌪️ Fırtına (−2), 🃏 Sürpriz. Takımın "piyonu" bir çocuk: salonda koni yolu varsa o çocuk adımları zıplar; piyon her el değişir.
   KURALLAR (STANDING): kazanan herkes atınca belli olur (bitişe erken varan bekler, fazla adım sayılır); küçük takım eşitlenir (adım × büyük/küçük, kesir birikir,
     "+1 küçük takım" olarak görünür); tur sırasında çocukların kişisel puan/adım sıralaması yok; finalde takımlar sabit sırada, herkesin adı; "Hep birlikte bitir"
     erken bitişte atış başına ortalamaya bakar. Güvenlik: hareket yalnız atış çizgisinin arkasında, yaylar yerde; yürüyüş kartı yalnız HEDEFE GİDERKEN (eller boş).
   KABUK: skor girişi Oyunlar'ın dock'u. tbSahneKur · tbGuncelle · tbSeri(s, i, kaydedilecek, done) · tbAnlik · tbGeriYukle · tbSporcu · tbAyarUygula · tbFinalZorla.
   Durum 'dag_km_tahta_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK). Ayarlar: tahtaTur, tahtaEl, tahtaTakim.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('tahta', k); } catch (e) { return true; } };
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_tahta_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');
    const adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
    const ayar = (k, v) => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a[k] != null) ? a[k] : v; } catch (e) { return v; } };
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- içerik ---- */
    const TAKIM = [{ ad: 'ŞİMŞEK', renk: '#FF5A4E', ikon: '⚡' }, { ad: 'KARTAL', renk: '#3E9BFF', ikon: '🦅' }, { ad: 'KAPLAN', renk: '#FFC23D', ikon: '🐯' }, { ad: 'EJDER', renk: '#36D47F', ikon: '🐉' }];
    const halka = (p) => p >= 9 ? 'sari' : p >= 7 ? 'kirmizi' : p >= 5 ? 'mavi' : p >= 3 ? 'siyah' : p >= 1 ? 'beyaz' : 'iska';
    const HALKA_RENK = { sari: '#F5D32A', kirmizi: '#E23B2E', mavi: '#2F7FD6', siyah: '#2A2D36', beyaz: '#F3F4F6', iska: '#4B5563' };
    const RENK_AD = { sari: 'SARI', kirmizi: 'KIRMIZI', mavi: 'MAVİ' };
    const KARTLAR = {
        renk: { ikon: '🎯', ad: 'RENK AVI', yaz: (k) => 'Bu elin rengi ' + RENK_AD[k.renk] + ': o renge giden her ok +1 adım' },
        cift: { ikon: '⚡', ad: 'ÇİFT GÜÇ', yaz: () => 'Kendi hedefini vuran ok 3 adım' },
        ilk: { ikon: '🥇', ad: 'İLK OK JOKER', yaz: () => 'İlk okun adımı iki katı' },
        son: { ikon: '🏁', ad: 'SON OK JOKER', yaz: () => 'Son okun adımı iki katı' },
        tam: { ikon: '🧱', ad: 'TAM SERİ', yaz: () => '3 ok da hedefteyse +2 adım' },
        sans: { ikon: '🍀', ad: 'ŞANSLI EL', yaz: () => 'Iska bile 1 adım' }
    };
    const KART_DESTE = ['renk', 'renk', 'cift', 'ilk', 'son', 'tam', 'sans'];
    // Takım görevi (Hareket karesi): atış çizgisinin arkasında, yaylar yerde
    const GOREVLER = [['🙆', '10 YILDIZ ZIPLAMASI', 'Kollar yukarı, bacaklar aç-kapa'], ['🏋️', '5 ÇÖMEL-KALK', 'Sırt dik, yavaş yavaş'], ['✈️', 'UÇAK DENGESİ', 'Tek ayak, kollar açık, 10 saniye'],
        ['🗿', 'HEYKEL', '10 saniye hiç kıpırdama!'], ['🐸', '5 KURBAĞA SIÇRAMASI', 'Çömel, yerinde zıpla'], ['🏃', 'YERİNDE KOŞU', '10 saniye, dizler yukarı'],
        ['🤸', 'KOL ÇEVİRME', 'Kollarla 10 büyük daire'], ['🕺', 'TAKIM DANSI', '10 saniye hep birlikte dans']];
    // Yürüyüş kartı: yalnız HEDEFE GİDERKEN (eller boş); dönüşte oklar elde, normal yürünür
    const YURUYUS = [['🦀', 'YENGEÇ YÜRÜYÜŞÜ'], ['🐧', 'PENGUEN YÜRÜYÜŞÜ'], ['🤖', 'ROBOT GİBİ'], ['🐘', 'DEV FİL ADIMLARI'], ['🐭', 'PARMAK UCU, SESSİZ'], ['🦆', 'ÖRDEK YÜRÜYÜŞÜ'], ['🐻', 'AYI YÜRÜYÜŞÜ'], ['🐇', 'TAVŞAN SEKMESİ']];
    const SURPRIZ = [{ t: 'ileri', ikon: '💨', ad: 'RÜZGÂR ARKADA', yaz: '2 kare ileri!' }, { t: 'herkes', ikon: '🤝', ad: 'HEP BİRLİKTE', yaz: 'Bütün takımlar 1 kare ileri' },
        { t: 'cift', ikon: '✨', ad: 'GÜÇ YÜKLEMESİ', yaz: 'Takımın sıradaki atışı çift adım' }, { t: 'dans', ikon: '🕺', ad: 'ZAFER DANSI', yaz: 'Takım 10 sn dans etsin: +2 kare' }];
    // v394 (kullanıcı: "iyi de atsa kötü de atsa ceza yeme ihtimali olsun"): sürprizin yarısı kötü; her seride küçük bir KARA BULUT şansı
    const SURPRIZ_KOTU = [{ t: 'geri', ikon: '🍌', ad: 'MUZ KABUĞU', yaz: '2 kare geri kaydı!', n: 2 }, { t: 'geri', ikon: '🌬️', ad: 'TERS RÜZGÂR', yaz: '1 kare geri', n: 1 },
        { t: 'buz', ikon: '🧊', ad: 'DONDU', yaz: 'Takımın sıradaki atışı yarım adım' }];
    const BULUT = [{ ikon: '⛈️', ad: 'KARA BULUT', yaz: 'Şimşek çaktı, 1 kare geri!', n: 1 }, { ikon: '🦅', ad: 'KARTAL KAPTI', yaz: 'Bayrağı kaptı, 2 kare geri!', n: 2 }, { ikon: '🕳️', ad: 'ÇUKUR', yaz: 'Piyon çukura düştü, 1 kare geri', n: 1 }];
    const BULUT_SANS = 1 / 7;
    const KARE = { bos: { ikon: '', ad: '' }, bas: { ikon: '', ad: 'BAŞLA' }, bitis: { ikon: '🏆', ad: 'BİTİŞ' }, hareket: { ikon: '🏃', ad: 'HAREKET' }, roket: { ikon: '🚀', ad: '+3' }, firtina: { ikon: '🌪️', ad: '−2' }, yilan: { ikon: '🐍', ad: '−3' }, kart: { ikon: '🃏', ad: 'SÜRPRİZ' } };

    /* ---- kurallar (saf) ---- */
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca 2 adım
    function okAdim(p, esik, kart, i, n) {
        let a = p >= esik ? 2 : p >= 1 ? 1 : 0;
        if (!kart) return a;
        if (kart.tip === 'cift' && p >= esik) a = 3;
        if (kart.tip === 'sans' && p === 0) a = 1;
        if (kart.tip === 'renk' && p >= 1 && halka(p) === kart.renk) a += 1;
        if ((kart.tip === 'ilk' && i === 0) || (kart.tip === 'son' && i === n - 1)) a *= 2;
        return a;
    }
    function seriAdim(puanlar, esik, kart) {
        const n = puanlar.length, oklar = puanlar.map((p, i) => okAdim(p, esik, kart, i, n));
        const bonus = (kart && kart.tip === 'tam' && n >= 3 && puanlar.every((p) => p >= 1)) ? 2 : 0;
        return { oklar, bonus, toplam: oklar.reduce((a, b) => a + b, 0) + bonus };
    }
    // Tahta uzunluğu: ok başı ~1,3 adım (seri ~3,9) → önde giden takım bitişe oyunun sonuna doğru varır
    function uzunluk(enBuyukTakim, tur) { return Math.max(10, Math.min(44, Math.round(3.9 * enBuyukTakim * tur))); }
    function takimSayisi(n, secim) { if (n < 2) return 1; if (secim >= 2) return Math.min(secim, n); return n <= 9 ? 2 : n <= 17 ? 3 : 4; }
    // Dengeli yılan dağıtımı: güçlüler sırayla takımlara, sonra ters sıra (1-2-3-3-2-1…)
    function takimlaraBol(kisiler, T, ortOf, gurultu) {
        const s = kisiler.map((k) => ({ k, o: (ortOf(k) || 0) + (gurultu ? gurultu() * .4 : 0) })).sort((a, b) => b.o - a.o), m = {};
        s.forEach((x, i) => { const tur = Math.floor(i / T), j = i % T; m[x.k] = tur % 2 ? T - 1 - j : j; });
        return m;
    }
    function tahtaUret(L, r, acik) {
        const k = Array(L + 1).fill('bos'); k[0] = 'bas'; k[L] = 'bitis';
        const koy = (i, t) => { for (const d of [0, 1, -1, 2, -2]) { const j = i + d; if (j > 1 && j < L - 1 && k[j] === 'bos') { k[j] = t; return; } } };
        koy(Math.round(L * .28), 'roket'); if (L >= 16) koy(Math.round(L * .62), 'roket');
        koy(Math.round(L * .17), 'kart'); if (L >= 14) koy(Math.round(L * .74), 'kart');
        if (acik.firtina && L >= 12) { koy(Math.round(L * .5), 'firtina'); if (L >= 22) koy(Math.round(L * .86), 'firtina'); }
        if (acik.ceza) { koy(Math.round(L * .38), 'yilan'); if (L >= 14) koy(L - 3, 'yilan'); if (L >= 26) koy(Math.round(L * .7), 'yilan'); }
        if (acik.hareket) for (let i = 3; i < L - 1; i += 4) koy(i + (r() < .5 ? 0 : 1), 'hareket');
        return k;
    }
    function kartCek(onceki, r) {
        const d = KART_DESTE.filter((t) => !onceki || t !== onceki.tip), tip = d[Math.floor(r() * d.length)];
        return tip === 'renk' ? { tip, renk: ['mavi', 'mavi', 'kirmizi', 'kirmizi', 'sari'][Math.floor(r() * 5)] } : { tip };
    }
    // Kazanan: takımın konumu (erken bitişte atış başına konum). Eşitlikte birden çok takım.
    function kazananlar(poz, atis, erken) {
        const puanlar = poz.map((p, i) => erken ? (atis[i] ? p / atis[i] : -1) : p), en = Math.max(...puanlar);
        return puanlar.map((p, i) => (Math.abs(p - en) < 1e-9 && p >= 0 ? i : -1)).filter((i) => i >= 0);
    }

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _kur = '', _gor = [], _gorevT = 0, _finalOynuyor = false;
    function yeniOyun() { return { tarih: bugun(), faz: 'oyun', basladi: false, T: 0, L: 0, kareler: [], takim: {}, poz: [], kesir: [], gorev: [], cift: [], atan: {}, adim: {}, seri: 0, el: 1, elSay: 0, kart: null, yuruyus: 0, piyon: [], piyonSay: {}, gorevBekle: null, kazanan: null, finalAdlar: null, erken: false }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { const t = +ayar('tahtaTur', 1); return t > 0 ? t : 1; };
    const elBoy = () => { const e = +ayar('tahtaEl', 4); return e > 0 ? e : 4; };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const ortKey = (k) => { const i = k.indexOf('|'); return ortalama({ g: k.slice(0, i), ad: k.slice(i + 1) }); };
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    function uyeler(st, ti) { return atabilenler().map(kimlik).filter((k) => st.takim[k] === ti); }
    function carpan(st, ti) { const boy = []; for (let i = 0; i < st.T; i++) boy.push(uyeler(st, i).length); const en = Math.max(...boy, 1), b = boy[ti] || en; return en / b; }
    function piyonSec(st) {
        st.piyon = []; for (let ti = 0; ti < st.T; ti++) {
            const u = uyeler(st, ti); if (!u.length) { st.piyon.push(null); continue; }
            const en = Math.min(...u.map((k) => st.piyonSay[k] || 0)), k = u.find((x) => (st.piyonSay[x] || 0) === en);
            st.piyonSay[k] = (st.piyonSay[k] || 0) + 1; st.piyon.push(k);
        }
    }
    function baslat(st) {
        const l = atabilenler().map(kimlik); if (!l.length) return;
        const T = takimSayisi(l.length, +ayar('tahtaTakim', 0)); st.T = T;
        st.takim = takimlaraBol(l, T, ortKey, Math.random);
        const boy = Math.max(...Array.from({ length: T }, (_, i) => l.filter((k) => st.takim[k] === i).length));
        st.L = uzunluk(boy, turSay()); st.kareler = tahtaUret(st.L, Math.random, { firtina: ic('firtina'), hareket: ic('hareket'), ceza: ic('ceza') });
        st.poz = Array(T).fill(0); st.kesir = Array(T).fill(0); st.gorev = Array(T).fill(0); st.cift = Array(T).fill(0); st.buz = Array(T).fill(0);
        st.kart = ic('kart') ? kartCek(null, Math.random) : null; st.yuruyus = Math.floor(Math.random() * YURUYUS.length);
        piyonSec(st); st.basladi = true; _gor = st.poz.slice();
    }
    // Oyun sürerken gelen çocuk en küçük takıma
    function yeniKatilan(st) {
        if (!st.basladi) return false; let d = false;
        atabilenler().map(kimlik).forEach((k) => { if (st.takim[k] != null && st.takim[k] < st.T) return; const boy = Array.from({ length: st.T }, (_, i) => uyeler(st, i).length), en = Math.min(...boy); st.takim[k] = boy.indexOf(en); d = true; });
        return d;
    }
    function bitir(st, erken) {
        const l = atabilenler(), atis = Array.from({ length: st.T }, (_, i) => uyeler(st, i).reduce((t, k) => t + (st.atan[k] || 0), 0));
        st.erken = !!erken; st.kazanan = kazananlar(st.poz, atis, st.erken); st.faz = 'son';
        st.finalAdlar = Array.from({ length: st.T }, (_, i) => uyeler(st, i).map(adOf));
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.tahta = o.tahta || {}; o.tahta.oyun = (o.tahta.oyun || 0) + 1; if (st.kazanan.indexOf(st.takim[kimlik(s)]) >= 0) o.tahta.kazanma = (o.tahta.kazanma || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur, f2) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    function gurultu(sure, gur, gec, f, tip) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = Math.floor(AC.sampleRate * sure), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const k = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); k.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f || 800; g.gain.value = gur || .2; k.connect(fl); fl.connect(g); g.connect(AC.destination); k.start(AC.currentTime + (gec || 0)); } catch (e) { } }
    const SES = {
        ok: () => { gurultu(.2, .1, 0, 2400, 'bandpass'); ton(660, .12, 0, 'triangle', .05); },
        adim: (i) => ton(392 * Math.pow(1.06, Math.min(i, 14)), .1, 0, 'square', .055),
        roket: () => { ton(220, .7, 0, 'sawtooth', .07, 1400); gurultu(.8, .16, 0, 1800, 'bandpass'); },
        firtina: () => { gurultu(1.1, .22, 0, 500); ton(300, .6, .1, 'sine', .05, 120); },
        kart: () => { [523, 784, 1047].forEach((f, i) => ton(f, .14, i * .07, 'triangle', .07)); gurultu(.12, .08, 0, 3000, 'highpass'); },
        duduk: () => { ton(2100, .22, 0, 'sine', .08); ton(2100, .4, .3, 'sine', .08); },
        bitis: () => { [523, 659, 784, 1047].forEach((f, i) => ton(f, .2, i * .09, 'square', .06)); },
        hic: () => ton(200, .16, 0, 'triangle', .06),
        zafer: () => { [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, .28, i * .14, 'square', .07)); [1568, 2093, 2637].forEach((f, i) => ton(f, .3, .8 + i * .1, 'triangle', .05)); }
    };

    /* ---- çizim ---- */
    const panel = () => $('km-oyun-panel-tahta');
    let _fx = [], _raf = 0;
    function tuvalBoyut(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    function patla(x, y, renkler, n) {
        if (azHareket()) return; const t0 = performance.now();
        for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, h = 2 + Math.random() * 7; _fx.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 3, s: 5 + Math.random() * 8, r: renkler[i % renkler.length], t0, om: 600 + Math.random() * 700 }); }
        if (!_raf) _raf = requestAnimationFrame(efekt);
    }
    function efekt(ms) {
        _raf = 0; const cv = $('tb-efekt'); if (!cv) { _fx = []; return; }
        if (!cv._c || cv._w !== cv.clientWidth || cv._h !== cv.clientHeight) { cv._c = tuvalBoyut(cv); cv._w = cv.clientWidth; cv._h = cv.clientHeight; }
        const c = cv._c; c.clearRect(0, 0, cv._w, cv._h);
        _fx = _fx.filter((q) => ms - q.t0 < q.om);
        _fx.forEach((q) => { const u = (ms - q.t0) / q.om; q.x += q.vx; q.y += q.vy; q.vy += .3; c.globalAlpha = 1 - u; c.fillStyle = q.r; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s * .6); });
        c.globalAlpha = 1; if (_fx.length) _raf = requestAnimationFrame(efekt);
    }
    function merkezOf(el) { const sa = document.querySelector('.tb-sahne'); if (!el || !sa) return null; const r = el.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width / 2, y: r.top - rs.top + r.height / 2 }; }

    // Tahta: kareler yılan gibi aşağıdan yukarı; başlangıç sol altta, bitiş en üstte
    let _yer = { s: 0, n: 0, an: '', xy: [] };
    function tahtaCiz(zorla) {
        const st = durum(), t = $('tb-tahta'); if (!t || !st.L) return; const W = t.clientWidth, H = t.clientHeight; if (!W || !H) return;
        const N = st.L + 1, an = W + 'x' + H + '|' + st.kareler.join(','); if (!zorla && an === _yer.an) return;
        let en = { s: 0, R: 1, C: N };
        for (let R = 1; R <= 9; R++) { const C = Math.ceil(N / R), s = Math.min(W / C, H / R, 118); if (s > en.s) en = { s, R, C }; }
        const { s, R, C } = en, ox = (W - C * s) / 2, oy = (H - R * s) / 2, xy = [];
        for (let i = 0; i < N; i++) { const row = Math.floor(i / C), c0 = i % C, col = row % 2 ? C - 1 - c0 : c0; xy.push([ox + col * s + s / 2, oy + (R - 1 - row) * s + s / 2]); }
        _yer = { s, n: N, an, xy };
        const g = Math.max(3, s * .1), yol = xy.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
        let h = '<svg class="tb-yol" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><polyline points="' + yol + '" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="' + (s * .34).toFixed(1) + '" stroke-linejoin="round" stroke-linecap="round"/></svg>';
        st.kareler.forEach((k, i) => {
            const [x, y] = xy[i], d = KARE[k] || KARE.bos;
            h += '<div class="tb-kare k-' + k + (i % 2 ? ' tek' : '') + '" data-i="' + i + '" style="left:' + (x - s / 2 + g / 2).toFixed(1) + 'px;top:' + (y - s / 2 + g / 2).toFixed(1) + 'px;width:' + (s - g).toFixed(1) + 'px;height:' + (s - g).toFixed(1) + 'px;--fs:' + (s * .36).toFixed(1) + 'px">'
                + (k === 'bas' || k === 'bitis' ? '' : '<s>' + i + '</s>') + (d.ikon ? '<i>' + d.ikon + '</i>' : '') + (d.ad ? '<em>' + d.ad + '</em>' : '') + '</div>';
        });
        for (let ti = 0; ti < st.T; ti++) { const tk = TAKIM[ti]; h += '<div class="tb-piyon" id="tb-p' + ti + '" style="--t:' + tk.renk + '" aria-label="' + tk.ad + ' piyonu"><i>' + tk.ikon + '</i><b class="tb-fazla"></b></div>'; }
        t.innerHTML = h; piyonYerlestir(true);
    }
    function piyonYerlestir(ani) {
        const st = durum(); if (!_yer.xy.length) return; const s = _yer.s, boy = Math.max(26, Math.min(64, s * .52)), grup = {};
        for (let ti = 0; ti < st.T; ti++) { const k = Math.min(_gor[ti] != null ? _gor[ti] : st.poz[ti] || 0, st.L); (grup[k] = grup[k] || []).push(ti); }
        Object.keys(grup).forEach((k) => {
            const l = grup[k], [x, y] = _yer.xy[k] || _yer.xy[0], d = s * .2;
            const of = l.length === 1 ? [[0, 0]] : l.length === 2 ? [[-d, 0], [d, 0]] : [[-d, -d], [d, -d], [-d, d], [d, d]];
            l.forEach((ti, j) => {
                const e = $('tb-p' + ti); if (!e) return; const [dx, dy] = of[j] || [0, 0];
                if (ani) e.classList.add('ani'); e.style.width = e.style.height = boy.toFixed(0) + 'px'; e.style.left = (x + dx - boy / 2).toFixed(1) + 'px'; e.style.top = (y + dy - boy * .62).toFixed(1) + 'px'; e.style.fontSize = (boy * .5).toFixed(0) + 'px';
                const f = (_gor[ti] != null ? _gor[ti] : st.poz[ti]) - st.L, fz = e.querySelector('.tb-fazla'); if (fz) fz.textContent = f > 0 ? '+' + f : '';
                if (ani) requestAnimationFrame(() => e.classList.remove('ani'));
            });
        });
    }
    function zipla(ti) { const e = $('tb-p' + ti); if (!e) return; e.classList.remove('zipla'); void e.offsetWidth; e.classList.add('zipla'); }
    function balon(ti, metin, sinif) {
        const e = $('tb-p' + ti), t = $('tb-tahta'); if (!e || !t) return; const b = document.createElement('span');
        b.className = 'tb-balon ' + (sinif || ''); b.textContent = metin; b.style.left = (parseFloat(e.style.left) + e.offsetWidth / 2) + 'px'; b.style.top = (parseFloat(e.style.top) - 6) + 'px'; t.appendChild(b); setTimeout(() => b.remove(), 900);
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function kartHTML(k) {
        if (!k) return '<i class="tb-kart-ikon">🎲</i><div><small>BU ELİN KARTI</small><b>NORMAL EL</b><span>Kendi hedefin 2, hedefe değen 1 adım</span></div>';
        const d = KARTLAR[k.tip]; return '<i class="tb-kart-ikon"' + (k.tip === 'renk' ? ' style="background:' + HALKA_RENK[k.renk] + '"' : '') + '>' + d.ikon + '</i><div><small>BU ELİN KARTI</small><b>' + d.ad + (k.tip === 'renk' ? ' · ' + RENK_AD[k.renk] : '') + '</b><span>' + esc(d.yaz(k)) + '</span></div>';
    }
    function takimlarCiz(st) {
        const l = liste(), ai = aktifIndeks(), kutu = $('tb-takimlar'); if (!kutu) return;
        const imza = st.T + '|' + l.map((s, i) => { const k = kimlik(s); return k + ':' + st.takim[k] + ':' + (st.atan[k] || 0) + ':' + (i === ai ? 1 : 0); }).join(',') + '|' + st.piyon.join(',') + '|' + st.poz.join(',') + '|' + st.cift.join(',') + '|' + (st.buz || []).join(',') + '|' + ic('piyon');
        if (kutu._imza === imza) return; kutu._imza = imza;
        let h = '';
        for (let ti = 0; ti < st.T; ti++) {
            const tk = TAKIM[ti], p = st.poz[ti] || 0, yer = p >= st.L ? '🏁' + (p > st.L ? '+' + (p - st.L) : '') : p + '<small>/' + st.L + '</small>';
            const uy = l.map((s, i) => ({ s, i, k: kimlik(s) })).filter((x) => st.takim[x.k] === ti);
            h += '<div class="tb-tk" style="--t:' + tk.renk + '"><div class="tb-tk-bas"><i>' + tk.ikon + '</i><b>' + tk.ad + '</b>' + (st.cift[ti] ? '<u>✨ ×2</u>' : '') + (st.buz && st.buz[ti] ? '<u>🧊 ½</u>' : '') + '<em>' + yer + '</em></div><div class="tb-tk-uye">'
                + uy.map((x) => { const at = (st.atan[x.k] || 0) >= turSay(), pi = ic('piyon') && st.piyon[ti] === x.k; return '<button type="button" class="tb-uye' + (at ? ' atti' : '') + (x.i === ai ? ' aktif' : '') + (pi ? ' piyon' : '') + '" data-km-sporcu="' + x.i + '" data-k="' + esc(x.k) + '">' + (pi ? '<i title="Piyon: salonda zıplar">👟</i>' : '') + esc(ilkAd(x.s.ad)) + '</button>'; }).join('') + '</div></div>';
        }
        kutu.innerHTML = h; kutu.style.setProperty('--n', Math.max(1, st.T)); kutu.classList.toggle('sik', l.length > 14);
    }
    function guncelle() {
        const kok = $('tb-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son' && (_finalOynuyor || _kilit)) return;
        if (st.faz === 'son') return sonCiz(st);
        if (!$('tb-oyun')) oyunIskelet();
        if (!st.basladi && atabilenler().length) { baslat(st); kaydet(); }
        else if (yeniKatilan(st)) kaydet();
        if (!_kilit) _gor = st.poz.slice();
        takimlarCiz(st); // önce takımlar: tahta kalan yüksekliğe göre ölçülür
        tahtaCiz(); if (!_kilit) piyonYerlestir();
        const kk = $('tb-kart'), ys = $('tb-yuru'), y = YURUYUS[st.yuruyus % YURUYUS.length], kartImza = JSON.stringify(st.kart) + st.el;
        if (kk && kk._i !== kartImza) { kk._i = kartImza; kk.innerHTML = kartHTML(st.kart); }
        if (ys) { ys.hidden = !ic('toplama'); const yi = st.yuruyus + '|' + st.el; if (ys._i !== yi) { ys._i = yi; ys.innerHTML = '<i>' + y[0] + '</i><div><small>HEDEFE GİDERKEN · eller boş</small><b>' + y[1] + '</b></div>'; } }
        const n = atabilenler().length, a = atanSay(st), akt = liste()[aktifIndeks()];
        const yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        yaz('tb-at', a + ' / ' + n); yaz('tb-elno', 'EL ' + st.el);
        if (akt) {
            const k = kimlik(akt), es = esikOf(ortalama(akt)), ti = st.takim[k], tk = TAKIM[ti] || TAKIM[0], h = $('tb-yan-hedef');
            if (h) h.setAttribute('data-esik', es); yaz('tb-yan-ad', buyuk(ilkAd(akt.ad))); yaz('tb-yan-tk', tk.ikon + ' ' + tk.ad);
            const yy = $('tb-yan'); if (yy) yy.style.setProperty('--t', tk.renk);
            yaz('tb-yan-esik', (es >= 9 ? 'Sarı' : es >= 7 ? 'Kırmızı ya da sarı' : 'Mavi ya da içi') + ' = 2 adım · hedefe değen = 1 adım');
        }
        const bit = $('tb-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
        if (st.gorevBekle && !$('tb-gorev').classList.contains('ac') && !$('tb-yenikart').classList.contains('ac') && !_kilit) gorevAc(st.gorevBekle, true);
    }
    function oyunIskelet() {
        $('tb-icerik').innerHTML = '<div class="tb-oyun" id="tb-oyun"><div class="tb-ust"><div class="tb-kart" id="tb-kart"></div><div class="tb-sayac"><small id="tb-elno">EL 1</small><b id="tb-at">0 / 0</b><span>attı</span></div><div class="tb-yuru" id="tb-yuru"></div></div>'
            + '<div class="tb-orta"><div class="tb-tahta" id="tb-tahta"></div><div class="tb-duyuru" id="tb-duyuru" aria-live="polite"></div><div class="tb-gorev" id="tb-gorev"></div><div class="tb-yenikart" id="tb-yenikart" aria-live="polite"></div></div>'
            + '<div class="tb-takimlar" id="tb-takimlar"></div>'
            + '<div class="tb-yan" id="tb-yan"><div class="tb-yan-hedef" id="tb-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte 2 adım bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div><div class="tb-yan-yazi"><small>SIRADA · <span id="tb-yan-tk"></span></small><b id="tb-yan-ad"></b><span id="tb-yan-esik"></span></div>'
            + '<div class="tb-arac"><button type="button" class="tb-kucuk" id="tb-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="tb-kucuk" id="tb-yeni-btn" aria-label="Yeni oyun">↻</button><button type="button" class="tb-kucuk genis" id="tb-kartcek">🃏 Yeni kart</button><button type="button" class="tb-kucuk genis" id="tb-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        _yer.an = ''; $('tb-takimlar')._imza = '';
        // tahta alanı küçülünce/büyüyünce (takım listesi uzayınca, ekran dönünce) kareler yeniden dizilir
        if (window.ResizeObserver) new ResizeObserver(() => { if ($('tb-tahta')) { tahtaCiz(); if (!_kilit) piyonYerlestir(); } }).observe($('tb-tahta'));
    }
    function sonCiz(st) {
        gorevKapat(false, true);
        const kaz = st.kazanan || [], tek = kaz.length === 1, l = st.finalAdlar || [];
        const bas = tek ? TAKIM[kaz[0]].ikon + ' ' + TAKIM[kaz[0]].ad + ' KAZANDI!' : kaz.length ? 'BERABERE! ' + kaz.map((i) => TAKIM[i].ikon + ' ' + TAKIM[i].ad).join(' · ') : 'OYUN BİTTİ';
        const toplamAdim = Object.keys(st.adim || {}).reduce((t, k) => t + (st.adim[k] || 0), 0), gorev = (st.gorev || []).reduce((a, b) => a + b, 0);
        let tk = ''; for (let i = 0; i < st.T; i++) { const t = TAKIM[i], p = st.poz[i] || 0; tk += '<div class="tb-son-tk' + (kaz.indexOf(i) >= 0 ? ' kaz' : '') + '" style="--t:' + t.renk + '"><b>' + t.ikon + ' ' + t.ad + '</b><em>' + (p >= st.L ? 'BİTİŞ' + (p > st.L ? ' +' + (p - st.L) : '') : p + '. kare') + '</em><span>' + (l[i] || []).map(esc).join(' · ') + '</span></div>'; }
        $('tb-icerik').innerHTML = '<div class="tb-son" id="tb-son"><span class="tb-et">Herkes attı' + (st.erken ? ' · erken bitti, atış başına bakıldı' : '') + '</span><h2>' + esc(bas) + '</h2><p class="tb-cumle">Hep birlikte <b>' + toplamAdim + '</b> adım attınız' + (gorev ? ', <b>' + gorev + '</b> hareket görevi yaptınız' : '') + '. Bravo hepinize!</p><div class="tb-son-tklar">' + tk + '</div><button type="button" class="tb-buyuk" id="tb-yeni-son">Yeni oyun</button></div>';
        _kur = '';
    }
    function duyur(html, sinif) { const d = $('tb-duyuru'); if (!d) return; d.className = 'tb-duyuru ac ' + (sinif || ''); d.innerHTML = html; }
    function duyuruKapa() { const d = $('tb-duyuru'); if (d) d.className = 'tb-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; _finalOynuyor = false; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function yeniKartGoster(st, sonrasi) {
        const y = $('tb-yenikart'); if (!y) return sonrasi && sonrasi();
        const k = st.kart, d = k ? KARTLAR[k.tip] : null, yu = YURUYUS[st.yuruyus % YURUYUS.length];
        y.innerHTML = '<div class="tb-yk" style="' + (k && k.tip === 'renk' ? '--kr:' + HALKA_RENK[k.renk] : '') + '"><small>EL ' + st.el + ' · YENİ KART</small><i>' + (d ? d.ikon : '🎲') + '</i><b>' + (d ? d.ad + (k.tip === 'renk' ? ' · ' + RENK_AD[k.renk] : '') : 'NORMAL EL') + '</b><span>' + esc(d ? d.yaz(k) : 'Kendi hedefin 2, hedefe değen 1 adım') + '</span>'
            + (ic('toplama') ? '<p>Hedefe giderken: ' + yu[0] + ' <b>' + yu[1] + '</b></p>' : '') + (ic('piyon') ? '<p class="pi">👟 Yeni piyonlar: ' + st.piyon.filter(Boolean).map(adOf).join(', ') + '</p>' : '') + '</div>';
        y.classList.remove('ac'); void y.offsetWidth; y.classList.add('ac'); SES.kart();
        sonra(() => { y.classList.remove('ac'); sonrasi && sonrasi(); }, 2600);
    }
    /* Hareket görevi: takım atış çizgisinin arkasında yapar. Süre bitince ya da sıradaki seri girilince +ödül kendiliğinden; "Geç" ödülsüz kapatır. */
    function gorevAc(g, sessiz) {
        const e = $('tb-gorev'); if (!e) return; const tk = TAKIM[g.ti] || TAKIM[0], d = g.g === 'dans' ? ['🕺', 'ZAFER DANSI', '10 saniye hep birlikte dans!'] : GOREVLER[g.g % GOREVLER.length];
        let kalan = g.sn || 15;
        e.style.setProperty('--t', tk.renk);
        e.innerHTML = '<div class="tb-gorev-kutu"><small>' + tk.ikon + ' ' + tk.ad + ' TAKIMI · HAREKET!</small><i>' + d[0] + '</i><b>' + d[1] + '</b><span>' + d[2] + '</span><p>Yaylar yerde · atış çizgisinin arkasında</p><div class="tb-gorev-alt"><em id="tb-gorev-sn">' + kalan + '</em><button type="button" id="tb-gorev-tamam">✓ Yaptık +' + g.odul + '</button><button type="button" id="tb-gorev-gec">Geç</button></div></div>';
        e.classList.add('ac'); if (!sessiz) SES.duduk();
        clearInterval(_gorevT); _gorevT = setInterval(() => { kalan--; const s = $('tb-gorev-sn'); if (s) s.textContent = Math.max(0, kalan); if (kalan <= 0) gorevKapat(true); }, 1000);
    }
    function gorevKapat(odul, sessiz) {
        clearInterval(_gorevT); _gorevT = 0; const e = $('tb-gorev'); if (e) e.classList.remove('ac');
        const st = durum(), g = st.gorevBekle; if (!g) return; st.gorevBekle = null;
        if (odul && st.faz === 'oyun') { st.poz[g.ti] = (st.poz[g.ti] || 0) + g.odul; st.gorev[g.ti] = (st.gorev[g.ti] || 0) + 1; }
        kaydet();
        if (odul && !sessiz && !_kilit) { _gor = st.poz.slice(); piyonYerlestir(); zipla(g.ti); balon(g.ti, '+' + g.odul, 'iyi'); SES.bitis(); duyur('<b>' + TAKIM[g.ti].ikon + ' ' + TAKIM[g.ti].ad + ' GÖREVİ YAPTI: +' + g.odul + ' KARE!</b>', 'iyi'); sonra(duyuruKapa, 1500); takimlarCiz(st); }
        else if (!_kilit) { _gor = st.poz.slice(); piyonYerlestir(); takimlarCiz(st); }
    }

    /* ---- seri ---- */
    function tbSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); gorevKapat(true, true); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; }
        if (!st.basladi) baslat(st); yeniKatilan(st);
        if (!st.T) { _kilit = false; try { done(); } catch (e) { } return; }
        const key = kimlik(s); if (st.takim[key] == null) { st.takim[key] = 0; }
        const ti = st.takim[key], tk = TAKIM[ti], puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), esik = esikOf(ortalama(s)), kart = st.kart, r = seriAdim(puanlar, esik, kart);
        let adim = r.toplam; const guc = !!st.cift[ti]; if (guc) { adim *= 2; st.cift[ti] = 0; }
        if (!st.buz) st.buz = []; const buzlu = !!st.buz[ti]; if (buzlu) { if (!guc) adim = Math.ceil(adim / 2); st.buz[ti] = 0; }
        st.kesir[ti] = (st.kesir[ti] || 0) + adim * (carpan(st, ti) - 1); const ek = adim > 0 ? Math.floor(st.kesir[ti] + 1e-9) : 0; st.kesir[ti] -= ek;
        const from = st.poz[ti] || 0, ara = from + adim + ek, kare = ara >= st.L ? 'bitis' : st.kareler[ara];
        let to = ara, sur = null, gorev = null, bulut = null;
        if (adim + ek > 0) {
            if (kare === 'roket') to = ara + 3;
            else if (kare === 'firtina') to = Math.max(0, ara - 2);
            else if (kare === 'yilan') to = Math.max(0, ara - 3);
            else if (kare === 'kart') { sur = rastgele(ic('ceza') && Math.random() < .5 ? SURPRIZ_KOTU : SURPRIZ); if (sur.t === 'geri') to = Math.max(0, ara - sur.n); else if (sur.t === 'buz') st.buz[ti] = 1; else if (sur.t === 'ileri') to = ara + 2; else if (sur.t === 'cift') st.cift[ti] = 1; else if (sur.t === 'dans') gorev = { ti, g: 'dans', odul: 2, sn: 12 }; }
            else if (kare === 'hareket' && ic('hareket')) gorev = { ti, g: Math.floor(Math.random() * GOREVLER.length), odul: 1, sn: 15 };
        }
        if (ic('ceza') && to === ara && ara < st.L && (st.kareler[ara] === 'bos' || st.kareler[ara] === 'bas' || !(adim + ek)) && from > 0 && Math.random() < BULUT_SANS) { bulut = rastgele(BULUT); to = Math.max(0, to - bulut.n); }
        const onceGor = st.poz.slice(), piyonOnce = st.piyon[ti];
        st.poz[ti] = to; if (sur && sur.t === 'herkes') st.poz = st.poz.map((x) => x + 1);
        st.atan[key] = (st.atan[key] || 0) + 1; st.adim[key] = (st.adim[key] || 0) + adim + ek; st.seri = (st.seri || 0) + 1;
        st.elSay = (st.elSay || 0) + 1; let yeniKart = false;
        const final = herkesAtti(st);
        if (final && gorev) { st.poz[ti] += gorev.odul; st.gorev[ti] = (st.gorev[ti] || 0) + 1; gorev = null; }
        if (gorev) st.gorevBekle = gorev;
        if (!final && st.elSay >= elBoy()) { st.elSay = 0; st.el = (st.el || 1) + 1; st.kart = ic('kart') ? kartCek(st.kart, Math.random) : null; st.yuruyus = (st.yuruyus + 1 + Math.floor(Math.random() * (YURUYUS.length - 1))) % YURUYUS.length; piyonSec(st); yeniKart = true; }
        if (final) bitir(st);
        kaydet();
        if (!panel()) return bit();
        if (!$('tb-oyun')) oyunIskelet();
        tahtaCiz(); _gor = onceGor; piyonYerlestir();
        const adi = buyuk(ilkAd(s.ad)), chips = puanlar.map((p, j) => '<i class="tb-ok" style="--h:' + HALKA_RENK[halka(p)] + (halka(p) === 'beyaz' || halka(p) === 'sari' ? ';--hy:#151515' : '') + '"><s>' + (p === 10 && String((kaydedilecek[j] || {}).puan) === 'X' ? 'X' : p === 0 ? 'M' : p) + '</s>+' + r.oklar[j] + '</i>').join('');
        const ekler = (r.bonus ? '<u>+' + r.bonus + ' TAM SERİ</u>' : '') + (guc ? '<u>✨ ×2 GÜÇ</u>' : '') + (buzlu && !guc ? '<u>🧊 yarım adım</u>' : '') + (ek ? '<u>+' + ek + ' küçük takım</u>' : '');
        const piyonAd = ic('piyon') && piyonOnce ? adOf(piyonOnce) : null;
        const toplamA = adim + ek;
        duyur('<span class="tb-d-ad" style="color:' + tk.renk + '">' + tk.ikon + ' ' + esc(adi) + '</span><span class="tb-d-ok">' + chips + '</span><b class="tb-d-top">' + (toplamA ? '= ' + toplamA + ' ADIM' : 'ADIM YOK') + '</b>' + ekler + (toplamA && piyonAd ? '<small>👟 Salonda: ' + esc(piyonAd) + ' ' + toplamA + ' kare zıplasın</small>' : ''), toplamA ? '' : 'sonuk');
        SES.ok();
        let t = 900; const dt = toplamA > 8 ? 170 : 260;
        if (!toplamA) { SES.hic(); t += 300; }
        for (let k = 1; k <= toplamA; k++) sonra(() => { _gor[ti] = from + k; piyonYerlestir(); zipla(ti); balon(ti, String(k)); SES.adim(k); }, t + (k - 1) * dt);
        t += toplamA * dt + 250;
        const ozel = (html, sinif, ses, fn, sure) => { sonra(() => { duyur(html, sinif); ses && ses(); fn && fn(); }, t); t += sure || 1300; };
        if (toplamA) {
            if (kare === 'roket') ozel('<b>🚀 ROKET! 3 KARE UÇTU!</b>', 'iyi', SES.roket, () => { _gor[ti] = to; const e = $('tb-p' + ti); if (e) e.classList.add('uc'); piyonYerlestir(); sonra(() => { const x = $('tb-p' + ti); if (x) x.classList.remove('uc'); const m = merkezOf(x); if (m) patla(m.x, m.y, ['#FFB347', '#FFE08A', '#FF6B3D'], 22); }, 650); }, 1500);
            else if (kare === 'firtina') ozel('<b>🌪️ FIRTINA! 2 KARE GERİ</b><small>Sıradaki atış toparlar!</small>', 'kotu', SES.firtina, () => { _gor[ti] = to; const e = $('tb-p' + ti); if (e) e.classList.add('uc', 'don'); piyonYerlestir(); sonra(() => { const x = $('tb-p' + ti); if (x) x.classList.remove('uc', 'don'); }, 900); }, 1500);
            else if (kare === 'yilan') ozel('<b>🐍 YILAN! 3 KARE KAYDI</b><small>Herkesin başına gelebilir — sıradaki atış toparlar!</small>', 'kotu', SES.firtina, () => { _gor[ti] = to; const e = $('tb-p' + ti); if (e) e.classList.add('uc', 'don'); piyonYerlestir(); sonra(() => { const x = $('tb-p' + ti); if (x) x.classList.remove('uc', 'don'); }, 900); }, 1500);
            else if (sur && (sur.t === 'geri' || sur.t === 'buz')) ozel('<b>🃏 SÜRPRİZ: ' + sur.ikon + ' ' + sur.ad + '</b><small>' + esc(sur.yaz) + '</small>', 'kotu', SES.firtina, () => { if (sur.t === 'geri') { _gor[ti] = to; const e = $('tb-p' + ti); if (e) e.classList.add('uc', 'don'); piyonYerlestir(); sonra(() => { const x = $('tb-p' + ti); if (x) x.classList.remove('uc', 'don'); }, 900); } takimlarCiz(st); }, 1900);
            else if (sur) ozel('<b>🃏 SÜRPRİZ: ' + sur.ikon + ' ' + sur.ad + '</b><small>' + esc(sur.yaz) + '</small>', 'iyi', SES.kart, () => { if (sur.t === 'ileri' || sur.t === 'herkes') { _gor = st.poz.slice(); document.querySelectorAll('.tb-piyon').forEach((e) => e.classList.add('uc')); piyonYerlestir(); sonra(() => document.querySelectorAll('.tb-piyon').forEach((e) => e.classList.remove('uc')), 700); } takimlarCiz(st); }, 1900);
            else if (ara >= st.L && from < st.L) ozel('<b>🏁 ' + tk.ikon + ' ' + tk.ad + ' BİTİŞTE!</b><small>Kazanan herkes atınca belli olur; fazla adımlar da sayılır.</small>', 'iyi', SES.bitis, () => { const m = merkezOf($('tb-p' + ti)); if (m) patla(m.x, m.y, [tk.renk, '#FFFFFF', '#FFD86B'], 30); }, 1800);
        }
        if (bulut) ozel('<b>' + bulut.ikon + ' ' + bulut.ad + '!</b><small>' + esc(bulut.yaz) + ' Şans işi — iyi atan da yakalanır.</small>', 'kotu', SES.firtina, () => { _gor[ti] = to; const e = $('tb-p' + ti); if (e) e.classList.add('uc', 'don'); piyonYerlestir(); sonra(() => { const x = $('tb-p' + ti); if (x) x.classList.remove('uc', 'don'); }, 900); }, 1700);
        sonra(() => {
            duyuruKapa(); _gor = st.poz.slice(); piyonYerlestir(); takimlarCiz(st);
            if (final) { _kilit = true; finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } }); return; }
            if (yeniKart) { yeniKartGoster(st, () => { if (st.gorevBekle) gorevAc(st.gorevBekle); }); bit(); return; }
            if (st.gorevBekle) gorevAc(st.gorevBekle);
            bit();
        }, t);
    }
    function finalSahne(st, sonrasi) {
        _finalOynuyor = true; SES.zafer(); const kaz = st.kazanan || [];
        duyur('<b>HERKES ATTI! ' + (kaz.length === 1 ? TAKIM[kaz[0]].ikon + ' ' + TAKIM[kaz[0]].ad + ' KAZANDI!' : 'BERABERE!') + '</b>', 'iyi');
        kaz.forEach((ti, j) => sonra(() => { zipla(ti); const m = merkezOf($('tb-p' + ti)); if (m) patla(m.x, m.y, [TAKIM[ti].renk, '#FFFFFF', '#FFD86B', '#7CCBFF'], 44); }, 200 + j * 300));
        sonra(() => { duyuruKapa(); _finalOynuyor = false; sonrasi(); }, azHareket() ? 400 : 2600);
    }
    function tbFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; gorevKapat(true, true); bitir(s, atanSay(s) < atabilenler().length); kaydet(); zamanTemizle(); _kilit = true; finalSahne(s, () => { _kilit = false; guncelle(); }); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Oyun şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Takımlar atış başına adıma göre karşılaştırılır, herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Sınıf takımlara bölünür, her takımın tahtada bir piyonu var.<br>Seri adıma dönüşür: <b>kendi hedefini</b> vuran ok 2, hedefe değen ok 1 adım (yeni başlayana mavi, ortaya kırmızı, iyiye sarı).<br>'
            + 'Her elde yeni bir <b>kural kartı</b> çıkar (Renk Avı, Çift Güç, Joker…) ve hedefe giderken yapılacak <b>yürüyüş</b>.<br>🏃 Hareket karesi: takım çizginin arkasında görevi yapar, +1. 🚀 Roket +3, 🌪️ Fırtına −2, 🐍 Yılan −3, 🃏 Sürpriz (iyi de çıkar kötü de).<br>⛈️ Kara bulut: her seride küçük bir şans — iyi atan da kötü atan da 1–2 kare geri gidebilir.<br>'
            + '👟 Piyon: salonda koni yolu varsa o çocuk adımları zıplar.<br>Kazanan herkes atınca belli olur. Küçük takımın adımları eşitlenir.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); gorevKapat(false, true); _kilit = false; _st = yeniOyun(); kaydet(); _kur = ''; _gor = []; $('tb-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni oyun başlasın mı?<br><small>Takımlar yeniden kurulur. Sporcu serileri silinmez.</small>', f, 'Yeni oyun', 'Vazgeç'); else f();
    }
    function kartElle() { const st = durum(); if (st.faz !== 'oyun' || _kilit) return; st.elSay = 0; st.el = (st.el || 1) + 1; st.kart = ic('kart') ? kartCek(st.kart, Math.random) : null; st.yuruyus = (st.yuruyus + 1) % YURUYUS.length; piyonSec(st); kaydet(); guncelle(); yeniKartGoster(st); }
    function tbSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _kur = ''; _yer = { s: 0, n: 0, an: '', xy: [] };
        p.innerHTML = '<div class="tb-sahne"><div id="tb-icerik"></div><canvas id="tb-efekt" aria-hidden="true"></canvas></div>'; _fx = [];
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'tb-nasil') nasil(); else if (t.id === 'tb-yeni-btn' || t.id === 'tb-yeni-son') yeniSor(); else if (t.id === 'tb-bitir') tbFinalZorla();
            else if (t.id === 'tb-kartcek') kartElle(); else if (t.id === 'tb-gorev-tamam') gorevKapat(true); else if (t.id === 'tb-gorev-gec') gorevKapat(false);
        };
        guncelle();
        if (window.ResizeObserver) { if (p._tbRo) p._tbRo.disconnect(); p._tbRo = new ResizeObserver(() => { if ($('tb-tahta')) { tahtaCiz(); if (!_kilit) piyonYerlestir(); } }); p._tbRo.observe(p); }
    }
    function css() {
        if ($('tb-css')) return; const st = document.createElement('style'); st.id = 'tb-css';
        st.textContent = '.km-oyun-panel-tahta{padding:0;background:#0E1024;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.tb-sahne{position:absolute;inset:0;color:#F4F5FF;overflow:hidden;background:radial-gradient(120% 80% at 30% -10%,#2C2F72 0%,#15173A 55%,#0B0C1E 100%)}.tb-sahne:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,rgba(255,255,255,.02) 0 2px,transparent 2px 64px);pointer-events:none}'
            + '#tb-efekt{position:absolute;left:0;top:0;width:100%;height:100%;z-index:3;pointer-events:none;display:block;max-width:none}'
            + '#tb-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.tb-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:8px;min-height:0}'
            + '.tb-ust{flex:none;display:grid;grid-template-columns:minmax(0,1.5fr) auto minmax(0,1fr);gap:8px;align-items:stretch}'
            + '.tb-kart,.tb-yuru{display:flex;gap:10px;align-items:center;padding:6px 10px;border-radius:12px;background:rgba(8,9,26,.72);border:1px solid rgba(255,255,255,.1);min-width:0}.tb-kart{border-color:#FFC23D;box-shadow:0 0 0 1px rgba(255,194,61,.25),0 0 18px rgba(255,194,61,.15)}'
            + '.tb-kart-ikon,.tb-yuru>i{flex:none;width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-style:normal;font-size:26px;background:rgba(255,255,255,.08)}.tb-kart>div,.tb-yuru>div{min-width:0;display:flex;flex-direction:column;line-height:1.15}'
            + '.tb-kart small,.tb-yuru small,.tb-sayac small{font-size:11px;font-weight:800;letter-spacing:.08em;color:#AEB3D8}.tb-kart b,.tb-yuru b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(20px,2.3vw,28px);font-weight:800;color:#FFD86B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-yuru b{color:#9BEA5A;white-space:normal;font-size:clamp(17px,1.8vw,22px);line-height:1.05}.tb-kart span{font-size:clamp(12px,1.25vw,15px);font-weight:700;color:#E3E6FF}'
            + '.tb-sayac{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 12px;border-radius:12px;background:rgba(8,9,26,.72);line-height:1}.tb-sayac b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(24px,2.8vw,34px);font-weight:800;font-variant-numeric:tabular-nums}.tb-sayac span{font-size:11px;font-weight:700;color:#AEB3D8}'
            + '.tb-orta{flex:1;min-height:0;position:relative}.tb-tahta{position:absolute;inset:0}.tb-yol{position:absolute;left:0;top:0;pointer-events:none}'
            + '.tb-kare{position:absolute;box-sizing:border-box;border-radius:14%;background:#262A5A;border:2px solid rgba(255,255,255,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}.tb-kare.tek{background:#2E3368}'
            + '.tb-kare s{position:absolute;left:8%;top:6%;text-decoration:none;font-size:max(10px,calc(var(--fs) * .38));font-weight:800;color:rgba(255,255,255,.5);font-variant-numeric:tabular-nums}.tb-kare i{font-style:normal;font-size:var(--fs)}.tb-kare em{font-style:normal;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:max(10px,calc(var(--fs) * .42));letter-spacing:.03em;margin-top:2px}'
            + '.tb-kare.k-hareket{background:#147A44;border-color:#36D47F}.tb-kare.k-roket{background:#B84A0F;border-color:#FF9A3D}.tb-kare.k-yilan{background:#3F6B12;border-color:#B4F04A}.tb-kare.k-firtina{background:#5B2BA8;border-color:#A77BFF}.tb-kare.k-kart{background:#A3245E;border-color:#FF6FAE}'
            + '.tb-kare.k-bas{background:#E8EAF6;border-color:#fff;color:#15173A}.tb-kare.k-bas em{font-size:max(11px,calc(var(--fs) * .5))}.tb-kare.k-bitis{background:repeating-conic-gradient(#F4F5FF 0 25%,#1B1D3A 0 50%) 0 0/34% 34%;border:3px solid #FFD86B;box-shadow:0 0 22px rgba(255,216,107,.45)}.tb-kare.k-bitis i{filter:drop-shadow(0 2px 2px #000)}.tb-kare.k-bitis em{background:#FFD86B;color:#1A1000;padding:1px 5px;border-radius:5px}'
            + '.tb-piyon{position:absolute;z-index:5;box-sizing:border-box;border-radius:50% 50% 46% 46%;background:radial-gradient(circle at 35% 30%,#fff 0 8%,var(--t) 9% 60%,color-mix(in srgb,var(--t) 60%,#000) 100%);border:3px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.35),0 0 16px var(--t);display:grid;place-items:center;transition:left .2s ease-out,top .2s ease-out;pointer-events:none}.tb-piyon.ani{transition:none}.tb-piyon.uc{transition:left .6s cubic-bezier(.3,1.4,.5,1),top .6s cubic-bezier(.3,1.4,.5,1)}.tb-piyon i{font-style:normal;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}'
            + '.tb-fazla{position:absolute;right:-12px;top:-10px;font-family:"Barlow Condensed",sans-serif;font-size:15px;font-weight:800;background:#FFD86B;color:#1A1000;border-radius:8px;padding:0 5px}.tb-fazla:empty{display:none}'
            + '.tb-balon{position:absolute;z-index:6;transform:translate(-50%,-100%);font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:30px;color:#fff;text-shadow:0 2px 0 #000,0 0 10px #000;pointer-events:none;animation:tb-balon .9s ease-out forwards}.tb-balon.iyi{color:#9BEA5A}'
            + '.tb-duyuru{position:absolute;left:50%;top:8px;z-index:8;transform:translate(-50%,-8px) scale(.96);width:max-content;max-width:96%;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;text-align:center;padding:8px 14px;border-radius:14px;background:rgba(6,7,20,.92);border:1px solid rgba(255,255,255,.14);opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}.tb-duyuru.ac{opacity:1;transform:translate(-50%,0)}'
            + '.tb-duyuru b,.tb-d-ad{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(24px,3vw,40px);line-height:1}.tb-duyuru.iyi b{color:#FFD86B}.tb-duyuru.kotu b{color:#C9A8FF}.tb-duyuru.sonuk .tb-d-top{color:#AEB3D8}.tb-duyuru small{flex-basis:100%;font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#E3E6FF}.tb-duyuru u{text-decoration:none;font-weight:800;font-size:14px;padding:2px 8px;border-radius:8px;background:#FFD86B;color:#1A1000}'
            + '.tb-d-ok{display:flex;gap:6px}.tb-ok{display:flex;align-items:center;gap:3px;font-style:normal;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(20px,2.2vw,28px);color:#9BEA5A}.tb-ok s{text-decoration:none;display:grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;background:var(--h);color:var(--hy,#fff);font-size:.8em;border:2px solid rgba(255,255,255,.6)}.tb-d-top{color:#FFD86B}'
            + '.tb-gorev,.tb-yenikart{position:absolute;inset:0;z-index:9;display:grid;place-items:center;pointer-events:none;opacity:0;transition:opacity .2s}.tb-gorev.ac,.tb-yenikart.ac{opacity:1}.tb-gorev.ac{pointer-events:auto;background:rgba(6,7,20,.45)}'
            + '.tb-gorev-kutu,.tb-yk{box-sizing:border-box;width:min(440px,94%);max-height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:14px 18px;border-radius:20px;background:#121433;border:3px solid var(--t,#36D47F);box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 30px color-mix(in srgb,var(--t,#36D47F) 50%,transparent)}'
            + '.tb-gorev-kutu small,.tb-yk small{font-size:13px;font-weight:800;letter-spacing:.08em;color:var(--t,#FFD86B)}.tb-gorev-kutu i,.tb-yk i{font-style:normal;font-size:clamp(46px,6vw,72px);line-height:1.1}.tb-gorev-kutu b,.tb-yk b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(28px,3.6vw,46px);font-weight:800;line-height:1;color:#fff}.tb-gorev-kutu span,.tb-yk span{font-size:clamp(15px,1.6vw,19px);font-weight:700;color:#E3E6FF}.tb-gorev-kutu p{margin:2px 0 0;font-size:13px;font-weight:700;color:#FFB199}'
            + '.tb-gorev-alt{display:flex;gap:8px;align-items:center;margin-top:8px}.tb-gorev-alt em{font-style:normal;font-family:"Barlow Condensed",sans-serif;font-size:34px;font-weight:800;min-width:50px;color:var(--t)}.tb-gorev-alt button{min-height:48px;padding:0 18px;border-radius:24px;border:0;font:inherit;font-weight:800;font-size:16px;cursor:pointer;background:var(--t);color:#0B0C1E}.tb-gorev-alt button+button{background:#262A5A;color:#F4F5FF;border:1px solid rgba(255,255,255,.2)}'
            + '.tb-yk{--t:#FFC23D}.tb-yk i{width:1.5em;height:1.5em;display:grid;place-items:center;border-radius:20px;background:var(--kr,rgba(255,255,255,.08))}.tb-yk p{margin:4px 0 0;font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#C8F5A0}.tb-yk p b{font-size:inherit;font-family:inherit;color:#9BEA5A}.tb-yk p.pi{color:#E3E6FF}'
            + '.tb-takimlar{flex:none;display:grid;grid-template-columns:repeat(var(--n,2),minmax(0,1fr));gap:6px}.tb-orta{min-height:150px}'
            + '.tb-takimlar.sik .tb-uye{min-height:24px;padding:1px 6px;font-size:12px;border-radius:6px}.tb-takimlar.sik .tb-tk-uye{gap:2px;margin-top:3px}.tb-takimlar.sik .tb-tk{padding:4px 5px}.tb-takimlar.sik .tb-tk-bas b{font-size:16px}'
            + '.tb-tk{min-width:0;padding:5px 7px;border-radius:12px;background:rgba(8,9,26,.75);border:2px solid var(--t);border-top-width:5px}.tb-tk-bas{display:flex;align-items:center;gap:5px;line-height:1}.tb-tk-bas i{font-style:normal;font-size:18px}.tb-tk-bas b{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(17px,1.8vw,22px);color:var(--t)}.tb-tk-bas u{text-decoration:none;font-size:11px;font-weight:800;padding:1px 6px;border-radius:6px;background:#FFD86B;color:#1A1000}.tb-tk-bas b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.tb-tk-bas em{margin-left:auto;flex:none;font-style:normal;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(17px,1.8vw,22px);white-space:nowrap;padding:0 7px;border-radius:8px;background:var(--t);color:#0B0C1E}.tb-tk-bas em small{font-size:.65em;opacity:.7}'
            + '.tb-tk-uye{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}.tb-uye{min-height:30px;padding:2px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#F4F5FF;font:inherit;font-size:clamp(12px,1.25vw,15px);font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tb-uye i{font-style:normal}.tb-uye.atti:after{content:"✓";color:#9BEA5A;font-weight:900}.tb-uye.piyon{border-color:var(--t)}.tb-uye.aktif{background:#FFC23D;color:#1A1000;border-color:#FFC23D}.tb-uye.aktif.atti:after{color:#1A1000}'
            + '.tb-yan{position:absolute;z-index:7;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(8,9,26,.8);border-left:5px solid var(--t,#FFC23D);display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.tb-yan-hedef{flex:none;width:96px}.tb-yan-hedef svg{display:block;width:100%}.tb-yan-hedef .m{fill:#2F7FD6}.tb-yan-hedef .k{fill:#E23B2E}.tb-yan-hedef .s{fill:#F5D32A}.tb-yan-hedef[data-esik="7"] .m,.tb-yan-hedef[data-esik="9"] .m,.tb-yan-hedef[data-esik="9"] .k{fill:#3A3D55}'
            + '.tb-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.tb-yan-yazi small{font-size:12px;font-weight:800;letter-spacing:.08em;color:#AEB3D8}.tb-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;line-height:1;color:#FFC23D;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tb-yan-yazi>span{font-size:clamp(14px,1.4vw,17px);font-weight:800;line-height:1.25}'
            + '.tb-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.tb-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.2);background:#262A5A;color:#F4F5FF;font:inherit;font-weight:800;cursor:pointer}.tb-kucuk[hidden]{display:none}.tb-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.tb-son{height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:12px 16px;border-radius:16px;background:rgba(8,9,26,.8)}.tb-et{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#AEB3D8}.tb-son h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(40px,5.6vw,76px);line-height:.95;color:#FFD86B}.tb-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#E3E6FF}.tb-cumle b{color:#9BEA5A}'
            + '.tb-son-tklar{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.tb-son-tk{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:2px solid var(--t)}.tb-son-tk.kaz{background:color-mix(in srgb,var(--t) 22%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--t) 50%,transparent)}.tb-son-tk b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:24px;font-weight:800;color:var(--t)}.tb-son-tk em{font-style:normal;font-weight:800}.tb-son-tk span{font-size:14px;font-weight:600;line-height:1.4;color:#E3E6FF}'
            + '.tb-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFC23D;color:#1A1000;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.tb-sahne button:focus-visible{outline:3px solid #FFC23D;outline-offset:2px}'
            + '@keyframes tb-balon{0%{opacity:0;transform:translate(-50%,-60%) scale(.6)}25%{opacity:1;transform:translate(-50%,-110%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-190%) scale(1)}}'
            + '@media(prefers-reduced-motion:no-preference){.tb-piyon.zipla i{animation:tb-zipla .26s ease-out}.tb-piyon.don{animation:tb-don .8s}.tb-yenikart.ac .tb-yk{animation:tb-kart .6s cubic-bezier(.3,1.5,.5,1)}.tb-gorev.ac .tb-gorev-kutu{animation:tb-kart .5s cubic-bezier(.3,1.5,.5,1)}.tb-uye.aktif{animation:tb-nabiz 1.2s ease-in-out infinite}.tb-son-tk.kaz{animation:tb-nabiz 1.4s ease-in-out infinite}.tb-kare.k-bitis i{animation:tb-nabiz 1.6s ease-in-out infinite;display:inline-block}'
            + '@keyframes tb-zipla{0%{transform:translateY(0)}50%{transform:translateY(-38%) scale(1.1)}100%{transform:translateY(0)}}@keyframes tb-don{to{transform:rotate(720deg)}}@keyframes tb-kart{0%{transform:perspective(600px) rotateY(90deg) scale(.7)}100%{transform:none}}@keyframes tb-nabiz{0%,100%{transform:none}50%{transform:scale(1.05)}}}'
            + '@media(max-width:860px){#tb-icerik{padding:8px}.tb-oyun{overflow-y:auto}.tb-ust{grid-template-columns:minmax(0,1fr) auto}.tb-yuru{grid-column:1 / -1}.tb-kart-ikon,.tb-yuru>i{width:36px;height:36px;font-size:21px}.tb-orta{flex:none;height:min(60vh,360px)}.tb-takimlar{max-height:none;grid-template-columns:repeat(2,minmax(0,1fr))}.tb-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.tb-yan-hedef{width:48px}.tb-yan-yazi b{font-size:26px}.tb-yan-yazi>span{font-size:13px}.tb-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.tbSahneKur = tbSahneKur;
    window.tbGuncelle = guncelle;
    window.tbSeri = tbSeri;
    window.tbAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.tbGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); clearInterval(_gorevT); const g = $('tb-gorev'); if (g) g.classList.remove('ac'); _kilit = false; _st = k; _kn = konum(); kaydet(); _gor = (k.poz || []).slice(); if ($('tb-icerik')) { if (k.faz === 'oyun' && !$('tb-oyun')) $('tb-icerik').innerHTML = ''; _yer.an = ''; guncelle(); } };
    window.tbSporcu = (g, ad) => (durum().adim || {})[g + '|' + ad] || 0;
    window.tbAyarUygula = () => { if ($('tb-icerik')) guncelle(); };
    window.tbFinalZorla = tbFinalZorla;
    window.tbDurum = durum;
    window._tbIc = { esikOf, okAdim, seriAdim, uzunluk, takimSayisi, takimlaraBol, tahtaUret, kartCek, kazananlar, TAKIM, KARTLAR };
})();
