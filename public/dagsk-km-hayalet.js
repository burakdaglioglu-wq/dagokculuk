/* ================================================================================================
   👻 HAYALET AVCILARI — Karışık Sınıf › Oyunlar teması 'hayalet' (v447, 2026-11-23).
   Kullanıcı 6 fikirlik sayfadan (claude.ai/artifact/7Kktd8PBRe7ryD6jFTtJuh) "Resim Avı" + "Hayalet Avcıları"nı seçti.
   v459 SADELEŞTİRME (kullanıcı: "hayalet nasıl kaçıyor anlamıyor ve neye ateş etmem gerektiği gibi karışıklıklar var"):
     • Fener HER ZAMAN bir eşyada (hedefSec): 👀 görünen hayalet → tıkırtı gelen eşya → en yakın "?" eşya. Koç dokunursa sınıfın seçtiği.
     • Altta tek cümle: "KEREM: 7 ve üstü at → DOLABI AÇ / HAYALETİ YAKALA". Duvarda 3 satırlık kural levhası hep açık.
     • eşik+ : hayalet varsa kavanoza; yoksa BOŞ + yanında hayalet varsa yan eşyalar sallanır "TIK TIK?", yoksa yandakiler de BOŞ.
     • eşik altı: hayalet oradaysa GÖRE GÖRE kaçar (iz + "KOLTUĞA KAÇTI"), kaçtığı yerde 👀 görünür kalır, fener peşinden gider.
       Hayalet yoksa eşya kapalı kalır. 0 = ıska. Hayalet YALNIZ zayıf okla kaçar; gizli kıpırdama ve ılık/soğuk KALDIRILDI.
     • 10/X: ayrıca saklı bir hayaleti gösterir (👀).
   Süre (seri) dolunca kalan hayaletler ekranda pencereden uçar → oda yeniden. 5 oda + Hayalet Kral (3 kez; vurulunca yeniden saklanır).
   ZORLUK: Kolay 5 eşya / 2 hayalet / 5 seri / 5+ · Normal 6/3/5/7+ · Zor 7/3/6/8+ (400'er serilik simülasyonla ayarlandı).
   KABUK: hylSahneKur · hylGuncelle · hylSeri · hylAnlik · hylGeriYukle · hylSporcu
   DURUM 'dag_km_hayalet_<konum>' günlük · KALICI 'dag_km_hylkalici_<konum>' (oda, sezon, kavanoz, rütbe, rozet).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1280, H = 720, ZEMIN = 610, L0 = 530, R0 = 1250;
    const K = window.kmKit;
    const DF = '"Lilita One","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = (a) => a[Math.floor(Math.random() * a.length)];
    const karistir = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    function aktif() { const l = K.liste(); return l[K.ai()] || null; }
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ---------- SES ---------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_hyl_ses') !== '0'; } catch (e) { return true; } }
    function ses(t) {
        if (!sesAcik()) return;
        try {
            AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = AC.currentTime;
            const ton = (f, d, tip, v, f2, g0) => { const o = AC.createOscillator(), g = AC.createGain(), b = n + (g0 || 0); o.type = tip || 'sine'; o.frequency.setValueAtTime(f, b); if (f2) o.frequency.exponentialRampToValueAtTime(f2, b + d); g.gain.setValueAtTime(v || .15, b); g.gain.exponentialRampToValueAtTime(.001, b + d); o.connect(g).connect(AC.destination); o.start(b); o.stop(b + d + .02); };
            ({
                fener: () => ton(1200, .08, 'square', .04, 1800),
                yakala: () => { [660, 880, 1100, 1320].forEach((f, i) => ton(f, .2, 'triangle', .1, null, i * .07)); ton(200, .3, 'sine', .1, 80, .05); },
                kacti: () => { ton(500, .4, 'sine', .1, 1400); },
                tik: () => [0, .16, .5, .66].forEach((g) => ton(420, .06, 'square', .06, 300, g)),
                bos: () => ton(260, .18, 'triangle', .07, 200),
                uu: () => { ton(220, .9, 'sine', .08, 330); ton(330, .9, 'sine', .05, 220, .1); },
                gece: () => { for (let i = 0; i < 6; i++) ton(523, .35, 'triangle', .08, null, i * .45); },
                temiz: () => [523, 659, 784, 1046, 1318].forEach((f, i) => ton(f, .35, 'triangle', .12, null, i * .1)),
                sec: () => ton(880, .07, 'square', .05)
            })[t]();
        } catch (e) { }
    }

    /* ---------- VERİ ---------- */
    const DZ = {
        kolay: { ad: '🐣 Kolay', d: '5 eşya · 2 hayalet · 5 seri · 5+', es: 5, hy: 2, saat: 5, esik: 5 },
        normal: { ad: '🦊 Normal', d: '6 eşya · 3 hayalet · 5 seri · 7+', es: 6, hy: 3, saat: 5, esik: 7 },
        zor: { ad: '🧠 Zor', d: '7 eşya · 3 hayalet · 6 seri · 8+', es: 7, hy: 3, saat: 6, esik: 8 }
    };
    const ESYA = {
        dolap: { ad: 'Dolap', h: 215, i: 'DOLABI', e: 'DOLABA' }, koltuk: { ad: 'Koltuk', h: 140, i: 'KOLTUĞU', e: 'KOLTUĞA' }, saat: { ad: 'Saat', h: 225, i: 'SAATİ', e: 'SAATE' }, sandik: { ad: 'Sandık', h: 100, i: 'SANDIĞI', e: 'SANDIĞA' },
        somine: { ad: 'Şömine', h: 190, i: 'ŞÖMİNEYİ', e: 'ŞÖMİNEYE' }, kitaplik: { ad: 'Kitaplık', h: 215, i: 'KİTAPLIĞI', e: 'KİTAPLIĞA' }, piyano: { ad: 'Piyano', h: 160, i: 'PİYANOYU', e: 'PİYANOYA' }, varil: { ad: 'Fıçı', h: 120, i: 'FIÇIYI', e: 'FIÇIYA' },
        yatak: { ad: 'Yatak', h: 130, i: 'YATAĞI', e: 'YATAĞA' }, ayna: { ad: 'Ayna', h: 205, i: 'AYNAYI', e: 'AYNAYA' }, kazan: { ad: 'Kazan', h: 120, i: 'KAZANI', e: 'KAZANA' }, heykel: { ad: 'Zırh', h: 225, i: 'ZIRHI', e: 'ZIRHA' }
    };
    const ODALAR = [
        { id: 'hol', ad: 'Giriş Holü', duvar: ['#3a2a4a', '#2a1e36'], es: ['dolap', 'koltuk', 'saat', 'heykel', 'ayna', 'sandik', 'somine'] },
        { id: 'kutuphane', ad: 'Kütüphane', duvar: ['#2a3a2e', '#1c2a20'], es: ['kitaplik', 'koltuk', 'saat', 'sandik', 'somine', 'ayna', 'heykel'] },
        { id: 'mutfak', ad: 'Mutfak', duvar: ['#4a3a24', '#30261a'], es: ['dolap', 'kazan', 'varil', 'sandik', 'somine', 'saat', 'kitaplik'] },
        { id: 'yatak', ad: 'Yatak Odası', duvar: ['#2a2e4a', '#1c1f36'], es: ['yatak', 'dolap', 'ayna', 'sandik', 'koltuk', 'saat', 'piyano'] },
        { id: 'tavan', ad: 'Tavan Arası', duvar: ['#3a3430', '#26221e'], es: ['sandik', 'varil', 'heykel', 'dolap', 'ayna', 'piyano', 'kazan'] }
    ];
    const KRAL = { id: 'kral', ad: 'Kule · Hayalet Kral', duvar: ['#3a1e3a', '#220e22'], es: ['heykel', 'saat', 'ayna', 'piyano', 'sandik', 'kitaplik', 'somine'] };
    const ROZET = { fener: ['🔦', 'Fenerci'], yakala: ['👻', 'Hayalet Yakalayan'], altin: ['⭐', 'Süper Fener'], uclu: ['🎯', 'Üçü de İyi'], gelisen: ['📈', 'Gelişen'] };
    const RUTBE = [[0, '🐣', 'Korkak Kedi'], [1, '🔦', 'Fenerci'], [5, '👻', 'Avcı'], [12, '🧪', 'Profesör'], [25, '👑', 'Hayalet Ustası']];
    function odaBul(i) { return i >= ODALAR.length ? KRAL : ODALAR[i]; }

    /* ---------- KALICI ---------- */
    let _kal = null, _kalHam = null, _kalKonum = null;
    function kalAnahtar() { return 'dag_km_hylkalici_' + konum(); }
    function kal() {
        if (_kalKonum !== konum()) { _kal = null; _kalHam = null; _kalKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(kalAnahtar()); } catch (e) { }
        if (ham !== _kalHam) { _kalHam = ham; try { _kal = ham ? JSON.parse(ham) : null; } catch (e) { _kal = null; } }
        if (!_kal || typeof _kal !== 'object') _kal = { oda: 0, sezon: 1, kavanoz: 0, fener: {}, rozet: {} };
        _kal.fener = _kal.fener || {}; _kal.rozet = _kal.rozet || {}; return _kal;
    }
    function kalKaydet() { try { _kalHam = JSON.stringify(_kal); localStorage.setItem(kalAnahtar(), _kalHam); } catch (e) { } }

    /* ---------- DURUM ---------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_hayalet_' + konum(); }
    function bosDurum(zor) { const st = { tarih: bugun(), zor: zor || 'normal', faz: 'basla', hepAtan: [], toplamOk: 0, katki: {}, sonTop: {} }; odaKur(st); return st; }
    function odaKur(st) {
        const Kl = kal(), Z = DZ[st.zor] || DZ.normal, O = odaBul(Kl.oda), kralMi = O.id === 'kral';
        st.oda = Kl.oda; st.esik = st.esikEl || Z.esik; st.maxSaat = Z.saat + (kralMi ? 2 : 0); st.saat = 0;
        const tipler = karistir(O.es).slice(0, Z.es), gen = (R0 - L0) / Z.es;
        st.es = tipler.map((t, i) => ({ t, x: Math.round(L0 + gen * (i + .5)), w: Math.round(Math.min(gen - 14, 150)), h: ESYA[t].h }));
        const yer = karistir(st.es.map((_, i) => i));
        st.hy = kralMi ? [yer[0]] : yer.slice(0, Z.hy); st.kralCan = kralMi ? 3 : 0;
        st.bos = st.es.map(() => null); st.gor = st.hy.map(() => false); st.duy = []; st.elle = false; st.secili = null; hedefSec(st); st.turAtan = []; st.turRozet = {}; st.yakalanan = 0; st.son = null; st.rovans = false;
    }
    function durum() {
        if (_stKonum !== konum()) { _st = null; _stHam = null; _stKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (ham !== _stHam) { _stHam = ham; try { _st = ham ? JSON.parse(ham) : null; } catch (e) { _st = null; } }
        if (!_st || _st.tarih !== bugun() || !_st.es || !_st.hy) { _st = bosDurum(_st && _st.zor); kaydet(); }
        if (!Array.isArray(_st.gor)) { _st.gor = _st.hy.map(() => false); _st.duy = []; _st.elle = false; } // v458 ve öncesinden kalan oda
        if (_st.secili == null || _st.bos[_st.secili]) hedefSec(_st);
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function kalan(st) { return st.hy.filter((h) => h >= 0).length; }
    function hayaletVar(st, i) { return st.hy.indexOf(i) !== -1; }
    // Hayalet başka eşyaya geçer (mümkünse hayaletsiz bir eşyaya); gor=true → gittiği yer görünür kalır
    function tasi(st, hj, yeniYer, gor) { st.hy[hj] = yeniYer; st.bos[yeniYer] = null; st.gor[hj] = !!gor; st.duy = []; }
    function kacacakYer(st, i) { const bas = st.es.map((_, k) => k).filter((k) => k !== i), bosY = bas.filter((k) => !hayaletVar(st, k)); return sec(bosY.length ? bosY : bas); }
    function gorunenVar(st, i) { return st.hy.some((h, k) => h === i && st.gor[k]); }
    function sakliVar(st, i) { return st.hy.some((h, k) => h === i && !st.gor[k]); }
    // Fenerin kendiliğinden gideceği eşya: görünen hayalet → tıkırtı → en yakın "?" eşya
    function hedefSec(st) {
        st.elle = false; const i0 = st.secili == null ? Math.floor(st.es.length / 2) : st.secili, yakin = (l) => l.slice().sort((a, b) => Math.abs(a - i0) - Math.abs(b - i0))[0];
        const G = st.hy.filter((h, k) => h >= 0 && st.gor[k]), D = (st.duy || []).filter((k) => !st.bos[k]), Q = st.es.map((_, k) => k).filter((k) => !st.bos[k]);
        st.secili = G.length ? yakin(G) : D.length ? yakin(D) : Q.length ? yakin(Q) : i0;
    }

    /* ---------- ÇİZİM ---------- */
    let _cv = null, _ctx = null, _raf = 0, _son = 0, _olcek = 1, _ox = 0, _oy = 0, _dpr = 1, _perdeFaz = null, _zaman = [], _kimSon = 0;
    const FX = { p: [], f: [], gh: [], fener: null, shake: 0, band: null, iz: null, sallan: {} };
    function band(t, alt, renk, ms) { FX.band = { t, alt: alt || '', r: renk, t0: performance.now(), ms: ms || 1500 }; }
    function panel() { return $('km-oyun-panel-hayalet'); }
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    const bekle = (ms) => new Promise((r) => sonra(r, ms));
    function yaz(x, t, px, py, size, renk, o) { o = o || {}; x.save(); x.font = size + 'px ' + DF; x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; if (o.a != null) x.globalAlpha *= o.a; x.lineJoin = 'round'; x.lineWidth = Math.max(4, size / 7); x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(t, px, py); x.fillStyle = renk; x.fillText(t, px, py); x.restore(); }
    function yuv(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function fxYazi(px, py, t, renk, boy, omur) { FX.f.push({ x: px, y: py, t, r: renk, s: boy || 48, l: omur || 70, m: omur || 70 }); }
    function fxParca(px, py, n, renk) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rnd(2, 8); FX.p.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, l: rnd(25, 50), m: 50, r: Array.isArray(renk) ? sec(renk) : renk, s: rnd(3, 7) }); } }
    function esUst(e) { return ZEMIN - e.h; }
    function hayaletCiz(x, cx, cy, s, a, t, kral) {
        x.save(); x.globalAlpha = a; x.translate(cx, cy); x.scale(s, s);
        const dal = Math.sin(t / 300) * 4; x.fillStyle = kral ? '#e8d8ff' : '#f2f6ff'; x.shadowColor = kral ? '#c9a6ff' : '#9fd8ff'; x.shadowBlur = 24;
        x.beginPath(); x.moveTo(-40, 30); x.lineTo(-40, -10); x.arc(0, -10, 40, Math.PI, 0); x.lineTo(40, 30);
        for (let k = 0; k < 4; k++) x.quadraticCurveTo(40 - k * 20 - 10, 46 + (k % 2 ? dal : -dal), 40 - (k + 1) * 20, 30); x.closePath(); x.fill(); x.shadowBlur = 0;
        x.fillStyle = '#1a1a2a'; x.beginPath(); x.ellipse(-14, -12, 7, 10, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(14, -12, 7, 10, 0, 0, 7); x.fill();
        x.beginPath(); x.ellipse(0, 10, 9, 7 + Math.sin(t / 200) * 2, 0, 0, 7); x.fill();
        if (kral) { x.fillStyle = '#ffd34a'; x.beginPath(); x.moveTo(-30, -44); x.lineTo(-30, -66); x.lineTo(-15, -52); x.lineTo(0, -72); x.lineTo(15, -52); x.lineTo(30, -66); x.lineTo(30, -44); x.closePath(); x.fill(); }
        x.restore();
    }
    function esyaCiz(x, e, t) {
        const L = e.x - e.w / 2, U = esUst(e), w = e.w, h = e.h, R = e.x + e.w / 2;
        x.save(); x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(e.x, ZEMIN + 4, w * .55, 10, 0, 0, 7); x.fill();
        const ah = (c) => { x.fillStyle = c; };
        switch (e.t) {
            case 'dolap': ah('#6a4428'); yuv(x, L, U, w, h, 6); x.fill(); ah('#7c5232'); x.fillRect(L + 6, U + 10, w / 2 - 9, h - 26); x.fillRect(e.x + 3, U + 10, w / 2 - 9, h - 26); ah('#d9b46a'); x.beginPath(); x.arc(e.x - 7, U + h / 2, 4, 0, 7); x.arc(e.x + 7, U + h / 2, 4, 0, 7); x.fill(); break;
            case 'koltuk': ah('#7a2a3a'); yuv(x, L, U, w, h * .7, 18); x.fill(); ah('#8e3446'); yuv(x, L - 6, U + h * .35, 26, h * .55, 10); x.fill(); yuv(x, R - 20, U + h * .35, 26, h * .55, 10); x.fill(); ah('#a03e52'); yuv(x, L + 16, U + h * .45, w - 32, h * .3, 8); x.fill(); ah('#3a1a14'); x.fillRect(L + 8, ZEMIN - 14, 8, 14); x.fillRect(R - 16, ZEMIN - 14, 8, 14); break;
            case 'saat': ah('#5a3a20'); yuv(x, e.x - w * .3, U, w * .6, h, 8); x.fill(); ah('#f4efe2'); x.beginPath(); x.arc(e.x, U + 40, w * .22, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 3; x.beginPath(); x.moveTo(e.x, U + 40); x.lineTo(e.x, U + 26); x.moveTo(e.x, U + 40); x.lineTo(e.x + 10, U + 44); x.stroke(); ah('#c8a050'); const sw = Math.sin(t / 500) * 10; x.beginPath(); x.moveTo(e.x, U + 80); x.lineTo(e.x + sw, U + h - 50); x.lineWidth = 3; x.strokeStyle = '#c8a050'; x.stroke(); x.beginPath(); x.arc(e.x + sw, U + h - 46, 9, 0, 7); x.fill(); break;
            case 'sandik': ah('#7a4a22'); yuv(x, L, U + 10, w, h - 10, 6); x.fill(); ah('#8a5a2a'); x.beginPath(); x.moveTo(L, U + 28); x.quadraticCurveTo(e.x, U - 8, R, U + 28); x.closePath(); x.fill(); ah('#c8a050'); x.fillRect(L + 10, U + 10, 8, h - 10); x.fillRect(R - 18, U + 10, 8, h - 10); x.fillRect(e.x - 8, U + 36, 16, 16); break;
            case 'somine': ah('#6a6a72'); x.fillRect(L, U, w, h); ah('#4a4a52'); x.fillRect(L - 8, U, w + 16, 16); ah('#140c08'); yuv(x, L + 16, U + 46, w - 32, h - 46, 10); x.fill(); const fl = Math.sin(t / 120) * 4; ah('#ff8a3a'); x.beginPath(); x.moveTo(e.x - 22, ZEMIN - 6); x.quadraticCurveTo(e.x - 10, ZEMIN - 50 - fl, e.x, ZEMIN - 30); x.quadraticCurveTo(e.x + 10, ZEMIN - 56 + fl, e.x + 22, ZEMIN - 6); x.fill(); ah('#ffd34a'); x.beginPath(); x.moveTo(e.x - 10, ZEMIN - 6); x.quadraticCurveTo(e.x, ZEMIN - 34 - fl, e.x + 10, ZEMIN - 6); x.fill(); break;
            case 'kitaplik': ah('#5a3a20'); x.fillRect(L, U, w, h); for (let r = 0; r < 4; r++) { ah('#3a2414'); x.fillRect(L + 6, U + 10 + r * (h - 16) / 4, w - 12, (h - 16) / 4 - 6); for (let k = 0; k < 5; k++) { ah(['#b84a3a', '#3a7ab8', '#5aa06a', '#c8a050', '#8a4aa0'][(k + r) % 5]); x.fillRect(L + 10 + k * (w - 20) / 5, U + 14 + r * (h - 16) / 4, (w - 20) / 5 - 3, (h - 16) / 4 - 12); } } break;
            case 'piyano': ah('#1a1a22'); yuv(x, L, U, w, h * .65, 8); x.fill(); ah('#f4f4f4'); x.fillRect(L + 6, U + h * .5, w - 12, 14); ah('#1a1a22'); for (let k = 0; k < 7; k++) x.fillRect(L + 12 + k * (w - 24) / 7, U + h * .5, 4, 8); x.fillRect(L + 8, U + h * .65, 8, h * .35); x.fillRect(R - 16, U + h * .65, 8, h * .35); break;
            case 'varil': ah('#8a5a2a'); x.beginPath(); x.ellipse(e.x, U + h / 2, w * .4, h / 2, 0, 0, 7); x.fill(); ah('#4a4a52'); x.fillRect(e.x - w * .4, U + h * .25, w * .8, 6); x.fillRect(e.x - w * .4, U + h * .7, w * .8, 6); break;
            case 'yatak': ah('#5a3a20'); x.fillRect(L, U, 12, h); x.fillRect(R - 12, U + 30, 12, h - 30); ah('#e8e0ff'); yuv(x, L + 8, U + 40, w - 16, h - 60, 10); x.fill(); ah('#7a8ad8'); yuv(x, L + 30, U + 50, w - 46, h - 70, 8); x.fill(); ah('#fff'); yuv(x, L + 12, U + 42, 28, 22, 8); x.fill(); break;
            case 'ayna': ah('#c8a050'); x.beginPath(); x.ellipse(e.x, U + h * .42, w * .38, h * .42, 0, 0, 7); x.fill(); const g = x.createLinearGradient(L, U, R, U + h); g.addColorStop(0, '#9ab8d8'); g.addColorStop(1, '#3a4a6a'); ah(g); x.beginPath(); x.ellipse(e.x, U + h * .42, w * .32, h * .37, 0, 0, 7); x.fill(); ah('#c8a050'); x.fillRect(e.x - 5, U + h * .8, 10, h * .2); break;
            case 'kazan': ah('#2a2a32'); x.beginPath(); x.ellipse(e.x, U + h * .55, w * .45, h * .45, 0, 0, Math.PI); x.fill(); x.fillRect(e.x - w * .45, U + h * .2, w * .9, h * .35); ah('#5ee39b'); x.beginPath(); x.ellipse(e.x, U + h * .22, w * .4, 10, 0, 0, 7); x.fill(); for (let k = 0; k < 3; k++) { const b = (t / 600 + k / 3) % 1; ah('rgba(94,227,155,' + (1 - b) + ')'); x.beginPath(); x.arc(e.x - 14 + k * 14, U + 10 - b * 50, 5, 0, 7); x.fill(); } break;
            case 'heykel': ah('#8a92a6'); x.beginPath(); x.arc(e.x, U + 26, 22, 0, 7); x.fill(); ah('#6b7484'); x.fillRect(e.x - 16, U + 8, 32, 10); ah('#9aa2b6'); yuv(x, e.x - 30, U + 50, 60, h * .55, 10); x.fill(); ah('#6b7484'); x.fillRect(e.x - 24, U + 50 + h * .55, 16, h - 50 - h * .55); x.fillRect(e.x + 8, U + 50 + h * .55, 16, h - 50 - h * .55); x.strokeStyle = '#c8ccd8'; x.lineWidth = 5; x.beginPath(); x.moveTo(e.x + 38, U + 20); x.lineTo(e.x + 38, ZEMIN - 10); x.stroke(); break;
        }
        x.restore();
    }
    let _statik = null, _statikOlcek = 0, _statikOda = -1;
    function statikCiz(x, st) {
        const O = odaBul(st.oda);
        const g = x.createLinearGradient(0, 74, 0, ZEMIN); g.addColorStop(0, O.duvar[0]); g.addColorStop(1, O.duvar[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(255,255,255,.035)'; for (let k = L0 - 20; k < W; k += 46) x.fillRect(k, 80, 18, ZEMIN - 80);
        // pencere + ay
        x.save(); x.translate(0, 52);
        x.fillStyle = '#0b1028'; yuv(x, 860, 110, 150, 170, 70); x.fill(); x.strokeStyle = '#4a3a2a'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#f4f0d0'; x.beginPath(); x.arc(960, 160, 22, 0, 7); x.fill(); x.fillStyle = '#0b1028'; x.beginPath(); x.arc(950, 152, 20, 0, 7); x.fill();
        x.strokeStyle = '#4a3a2a'; x.lineWidth = 5; x.beginPath(); x.moveTo(935, 112); x.lineTo(935, 278); x.moveTo(862, 200); x.lineTo(1008, 200); x.stroke();
        x.restore();
        // zemin
        const z = x.createLinearGradient(0, ZEMIN, 0, H); z.addColorStop(0, '#3a2414'); z.addColorStop(1, '#1a0e08'); x.fillStyle = z; x.fillRect(0, ZEMIN, W, H - ZEMIN);
        x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; for (let k = 0; k < W; k += 90) { x.beginPath(); x.moveTo(k, ZEMIN); x.lineTo(k - 60, H); x.stroke(); }
        // sol: avcının köşesi (kavanoz rafı çizimi dinamik)
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 74, 508, H - 74); x.fillStyle = '#0e0a14'; x.fillRect(506, 74, 6, H - 74);
        x.fillStyle = '#5a3a22'; x.fillRect(20, 312, 470, 10);
    }
    function kavanozCiz(x, st, t) {
        const n = st.oda >= ODALAR.length ? 1 : st.hy.length;
        for (let i = 0; i < n; i++) {
            const cx = 255 + (i - (n - 1) / 2) * 110, by = 312, dolu = i < st.yakalanan;
            x.fillStyle = 'rgba(200,230,255,.18)'; yuv(x, cx - 34, by - 72, 68, 72, 12); x.fill(); x.strokeStyle = 'rgba(220,240,255,.6)'; x.lineWidth = 3; x.stroke();
            x.fillStyle = '#8a6a44'; x.fillRect(cx - 28, by - 82, 56, 11);
            if (dolu) hayaletCiz(x, cx, by - 36, .5, 1, t + i * 400, st.oda >= ODALAR.length);
            else yaz(x, '?', cx, by - 36, 32, 'rgba(255,255,255,.35)');
        }
    }
    // Duvardaki kural levhası: hep aynı üç satır
    function kuralLevha(x, st) {
        x.save(); x.fillStyle = 'rgba(14,10,26,.86)'; yuv(x, 534, 156, 300, 156, 16); x.fill(); x.strokeStyle = '#6a5490'; x.lineWidth = 3; x.stroke(); x.restore();
        [[st.esik + ' ve üstü', 'YAKALAR', '#5ee39b'], ['1 – ' + (st.esik - 1), 'HAYALET KAÇAR', '#ff8a7a'], ['10 ve X', 'HAYALET GÖSTERİR', '#ffd34a']].forEach((r, i) => { const y = 183 + i * 50; yaz(x, r[0], 552, y - 10, 23, r[2], { al: 'left' }); yaz(x, r[1], 552, y + 14, 18, '#fff', { al: 'left' }); });
    }
    function sureLevha(x, st, t) {
        if (st.faz !== 'oyun') return; const k = Math.max(0, st.maxSaat - st.saat), az = k <= 2;
        x.save(); x.fillStyle = 'rgba(14,10,26,.86)'; yuv(x, 1030, 156, 230, 156, 16); x.fill(); x.strokeStyle = az ? '#ff7a6a' : '#6a5490'; x.lineWidth = az ? 5 : 3; x.stroke(); x.restore();
        yaz(x, String(k), 1145, 200, 70, az ? '#ff7a6a' : '#fff', { a: az ? .6 + Math.sin(t / 150) * .4 : 1 });
        yaz(x, k === 1 ? 'SON SERİ' : 'SERİ KALDI', 1145, 252, 24, az ? '#ff9a8a' : '#ffe2a0'); yaz(x, 'sonra pencereden kaçarlar', 1145, 286, 17, '#c8d0f0');
    }
    // Her okun sonucu: ne oldu + şimdi ne olacak
    function bandCiz(x) {
        const b = FX.band; if (!b) return; const g = performance.now() - b.t0; if (g > b.ms) { FX.band = null; return; }
        const a = Math.min(1, g / 120, (b.ms - g) / 200), y = 84; x.save(); x.globalAlpha = Math.max(0, a); x.fillStyle = 'rgba(8,6,16,.95)'; yuv(x, L0, y, 734, 120, 20); x.fill(); x.strokeStyle = b.r; x.lineWidth = 6; x.stroke();
        const sig = (m, s, yy, r) => { x.font = s + 'px ' + DF; while (x.measureText(m).width > 690 && s > 16) { s -= 2; x.font = s + 'px ' + DF; } yaz(x, m, L0 + 367, yy, s, r, { a: Math.max(0, a) }); };
        sig(b.t, 46, y + (b.alt ? 42 : 60), b.r); if (b.alt) sig(b.alt, 30, y + 90, '#fff'); x.restore();
    }
    function ciz(t, dt) {
        const x = _ctx, st = _st || durum(); if (!x) return;
        const k = dt / 16.7; FX.p.forEach((p) => { p.x += p.vx * k; p.y += p.vy * k; p.vy += .15 * k; p.l -= k; }); FX.p = FX.p.filter((p) => p.l > 0); FX.f.forEach((f) => { f.l -= k; f.y -= .7 * k; }); FX.f = FX.f.filter((f) => f.l > 0);
        x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#05040a'; x.fillRect(0, 0, _cv.width, _cv.height);
        const sc = _dpr * _olcek; x.setTransform(sc, 0, 0, sc, _dpr * _ox, _dpr * _oy);
        x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
        if (FX.shake) { x.translate(rnd(-FX.shake, FX.shake), rnd(-FX.shake, FX.shake)); FX.shake *= .9; if (FX.shake < .3) FX.shake = 0; }
        if (!_statik || _statikOlcek !== sc || _statikOda !== st.oda) { _statik = document.createElement('canvas'); _statik.width = Math.ceil(W * sc); _statik.height = Math.ceil(H * sc); const s2 = _statik.getContext('2d'); s2.setTransform(sc, 0, 0, sc, 0, 0); statikCiz(s2, st); _statikOlcek = sc; _statikOda = st.oda; }
        x.drawImage(_statik, 0, 0, W, H);
        // eşyalar (tıkırtı gelen sallanır)
        st.es.forEach((e, i) => { const tik = !st.bos[i] && (st.duy || []).indexOf(i) !== -1; x.save(); if (tik) { x.translate(e.x, ZEMIN); x.rotate(Math.sin(t / 45) * .03 * (Math.sin(t / 400) > -.2 ? 1 : 0)); x.translate(-e.x, -ZEMIN); } esyaCiz(x, e, t); x.restore(); });
        // karanlık: yalnız fenerin baktığı eşya aydınlık
        const hd = st.faz === 'oyun' && st.secili != null ? st.es[st.secili] : null;
        x.save(); x.fillStyle = 'rgba(4,4,12,.62)'; x.beginPath(); x.rect(L0 - 18, 74, W, H); if (hd) { x.ellipse(hd.x, ZEMIN - hd.h / 2, hd.w * .72, hd.h / 2 + 34, 0, 0, Math.PI * 2, true); } x.fill('evenodd');
        if (hd) { const gr = x.createLinearGradient(0, H, 0, ZEMIN - hd.h / 2); gr.addColorStop(0, 'rgba(255,236,160,.32)'); gr.addColorStop(1, 'rgba(255,236,160,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(890 - 14, H); x.lineTo(hd.x - hd.w * .72, ZEMIN - hd.h / 2); x.lineTo(hd.x + hd.w * .72, ZEMIN - hd.h / 2); x.lineTo(890 + 14, H); x.closePath(); x.fill(); }
        x.restore();
        kuralLevha(x, st); sureLevha(x, st, t);
        // kaçış izi
        if (FX.iz) { const z = FX.iz; z.l -= dt; if (z.l <= 0) FX.iz = null; else { x.save(); x.globalAlpha = Math.min(1, z.l / 600); x.strokeStyle = '#ff8a7a'; x.lineWidth = 6; x.setLineDash([4, 16]); x.lineCap = 'round'; x.beginPath(); x.moveTo(z.x0, z.y0); x.quadraticCurveTo((z.x0 + z.x1) / 2, Math.min(z.y0, z.y1) - 150, z.x1, z.y1); x.stroke(); x.restore(); } }
        st.es.forEach((e, i) => {
            const U = esUst(e), su = st.secili === i && st.faz === 'oyun', gorunen = st.hy.findIndex((h, k) => h === i && st.gor[k]), ucuyor = FX.gh.some((g) => g.hedef === i);
            if (st.bos[i]) { x.save(); x.fillStyle = 'rgba(8,10,20,.6)'; x.fillRect(e.x - e.w / 2 - 6, U - 6, e.w + 12, e.h + 12); x.restore(); yaz(x, 'BOŞ', e.x, ZEMIN - Math.min(e.h / 2, 80), 32, '#9aa6c8'); }
            else if (gorunen !== -1) { if (!ucuyor) { x.save(); x.beginPath(); x.rect(e.x - 90, U - 140, 180, 148); x.clip(); hayaletCiz(x, e.x + Math.sin(t / 260) * 5, U - 14 + Math.sin(t / 380) * 5, .95, 1, t, st.oda >= ODALAR.length); x.restore(); yaz(x, 'BURADA', e.x, ZEMIN - Math.min(e.h / 2, 50), 27, '#ffb0a4'); } }
            else { const tik = (st.duy || []).indexOf(i) !== -1; yaz(x, '?', e.x, ZEMIN - Math.min(e.h / 2, 90), 64, tik ? '#ffd34a' : 'rgba(255,255,255,.8)'); if (tik) yaz(x, 'TIK TIK', e.x, ZEMIN - Math.min(e.h / 2, 90) - 46, 24, '#ffd34a'); }
            if (su) { const b = Math.sin(t / 220) * 5, ty = U - (gorunen !== -1 ? 78 : 44); x.strokeStyle = '#ffd34a'; x.lineWidth = 6; x.setLineDash([]); yuv(x, e.x - e.w / 2 - 12, U - 12, e.w + 24, e.h + 24, 16); x.stroke(); yaz(x, '🔦', e.x, ty - b, 40, '#fff'); x.fillStyle = '#ffd34a'; x.beginPath(); x.moveTo(e.x - 14, ty + 22 - b); x.lineTo(e.x + 14, ty + 22 - b); x.lineTo(e.x, ty + 38 - b); x.closePath(); x.fill(); }
            yaz(x, ESYA[e.t].ad, e.x, ZEMIN + 27, su ? 26 : 21, su ? '#ffd34a' : '#e8e0ff');
        });
        // hayalet animasyonları (yakalanan kavanoza uçar, kaçan süzülür)
        FX.gh = FX.gh.filter((g) => { g.u += dt / g.d; const u = Math.max(0, Math.min(1, g.u)); if (g.u < 0) return true; hayaletCiz(x, lerp(g.x0, g.x1, u), lerp(g.y0, g.y1, u) - Math.sin(u * Math.PI) * g.yay, lerp(g.s0, g.s1, u), g.a ? 1 - u * .3 : 1, t, g.kral); return g.u < 1; });
        // fener ışığı
        if (FX.fener) { const f = FX.fener; f.u += dt / 500; const a = Math.max(0, 1 - Math.abs(f.u - .5) * 2); x.save(); x.globalCompositeOperation = 'lighter'; const gr = x.createRadialGradient(f.x, f.y, 10, f.x, f.y, 150 * f.g); gr.addColorStop(0, 'rgba(255,240,180,' + (.55 * a) + ')'); gr.addColorStop(1, 'rgba(255,240,180,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(890, H); x.lineTo(f.x - 90 * f.g, f.y - 60); x.lineTo(f.x + 90 * f.g, f.y - 60); x.closePath(); x.fill(); x.beginPath(); x.arc(f.x, f.y, 150 * f.g, 0, 7); x.fill(); x.restore(); if (f.u >= 1) FX.fener = null; }
        kavanozCiz(x, st, t);
        FX.p.forEach((p) => { x.globalAlpha = Math.max(0, p.l / p.m); x.fillStyle = p.r; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }); x.globalAlpha = 1;
        FX.f.forEach((f) => { const a = Math.min(1, f.l / (f.m * .4)); yaz(x, f.t, f.x, f.y, f.s, f.r, { a }); });
        x.restore();
        // üst şerit
        const O = odaBul(st.oda), Kl = kal(), Z = DZ[st.zor] || DZ.normal;
        x.fillStyle = 'rgba(6,8,14,.94)'; x.fillRect(0, 0, W, 74); x.fillStyle = '#b58cff'; x.fillRect(0, 72, W, 3);
        yaz(x, (st.oda >= ODALAR.length ? '👑 KULE' : 'ODA ' + (st.oda + 1) + '/5') + ' · SEZON ' + (Kl.sezon || 1), 24, 22, 20, '#c9a6ff', { al: 'left' });
        yaz(x, O.ad.toUpperCase(), 24, 52, 30, '#fff', { al: 'left' });
        yaz(x, Z.ad.toUpperCase(), 400, 38, 22, st.zor === 'zor' ? '#ff9a6a' : st.zor === 'kolay' ? '#9ff0c4' : '#ffd98a');
        const kalanS = st.maxSaat - st.saat, cx = 520, cy = 37; x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 4; x.stroke();
        for (let i = 0; i < st.maxSaat; i++) { const a = -Math.PI / 2 + i / st.maxSaat * Math.PI * 2; x.fillStyle = i < st.saat ? '#7a3ad8' : '#222'; x.beginPath(); x.arc(cx + Math.cos(a) * 21, cy + Math.sin(a) * 21, 3.4, 0, 7); x.fill(); }
        const teh = kalanS <= 2 && st.faz === 'oyun';
        yaz(x, st.oda >= ODALAR.length ? 'HAYALET KRAL' : '👻 ' + kalan(st) + ' HAYALET KALDI', cx + 44, 26, 25, '#fff', { al: 'left' });
        yaz(x, (st.oda >= ODALAR.length ? st.kralCan + ' kez daha yakala · ' : st.yakalanan + ' yakalandı · ') + kalanS + ' seri kaldı', cx + 44, 56, 18, teh ? '#ff9a8a' : '#c8d0f0', { al: 'left' });
        // şimdi cümlesi
        if (st.faz === 'oyun') {
            const e = st.secili != null ? st.es[st.secili] : null;
            const gv = e && gorunenVar(st, st.secili), cumle = '🏹 ' + simdiCumle(st);
            yuv(x, L0, 84, 734, 62, 16); x.fillStyle = gv ? '#5a1620' : '#14203e'; x.fill(); x.strokeStyle = gv ? '#ff8a7a' : '#ffd34a'; x.lineWidth = 4; x.stroke(); let fs = 38; x.font = fs + 'px ' + DF; while (x.measureText(cumle).width > 716 && fs > 18) { fs -= 2; x.font = fs + 'px ' + DF; } yaz(x, cumle, L0 + 367, 116, fs, '#fff'); if (FX.band) bandCiz(x);
        }
    }
    function dongu(t) {
        _raf = 0; if (!_cv || !document.body.contains(_cv)) { _cv = null; return; }
        const dt = Math.min(50, t - _son); _son = t;
        if (_cv.offsetParent !== null) { ciz(t, dt); if (t - _kimSon > 300) { _kimSon = t; kimCiz(); simdiCiz(); } }
        _raf = requestAnimationFrame(dongu);
    }
    function simdiCumle(st) { const s = aktif(), e = st.secili != null ? st.es[st.secili] : null; return (s ? K.ilkAd(s.ad).toLocaleUpperCase('tr-TR') + ': ' : '') + st.esik + ' ve üstü at → ' + (e && gorunenVar(st, st.secili) ? 'HAYALETİ YAKALA' : e ? ESYA[e.t].i + ' AÇ' : ''); }
    // Telefonda sahne küçülür: aynı cümle / okun sonucu sahnenin altında büyük yazıyla
    function simdiCiz() {
        const el = $('hyl-simdi'); if (!el) return; const st = _st || durum(), goster = st.faz === 'oyun' && _olcek < .5 && _oy > 60; el.hidden = !goster; if (!goster) return;
        el.style.top = (_oy + H * _olcek + 8) + 'px'; const b = FX.band, h = b ? '<b style="color:' + b.r + '">' + K.kacis(b.t) + '</b><span>' + K.kacis(b.alt) + '</span>' : '<b>🏹 ' + K.kacis(simdiCumle(st)) + '</b><span>1 – ' + (st.esik - 1) + ': hayalet kaçar · 10 ve X: hayalet gösterir</span>';
        if (el._h !== h) { el._h = h; el.innerHTML = h; }
    }
    function boyutla() {
        if (!_cv) return; const r = _cv.getBoundingClientRect(); if (!r.width || !r.height) return;
        _dpr = Math.min(2, window.devicePixelRatio || 1); _cv.width = Math.round(r.width * _dpr); _cv.height = Math.round(r.height * _dpr);
        _olcek = Math.min(r.width / W, r.height / H); _ox = (r.width - W * _olcek) / 2; _oy = (r.height - H * _olcek) / 2; _statik = null;
        const k = $('hyl-kim'); if (k) { k.style.left = (_ox + 14 * _olcek) + 'px'; k.style.top = (_oy + 86 * _olcek) + 'px'; k.style.width = (480 * _olcek) + 'px'; k.style.fontSize = (10 * _olcek) + 'px'; }
        const p = $('hyl-pop'); if (p) { p.style.left = (_ox + 14 * _olcek) + 'px'; p.style.top = (_oy + 228 * _olcek) + 'px'; p.style.width = (480 * _olcek) + 'px'; p.style.fontSize = (8 * _olcek) + 'px'; }
    }
    function hylSahneKur(p) {
        p = p || panel(); if (!p) return; css(); K.css(); _zaman.forEach(clearTimeout); _zaman = []; _perdeFaz = null;
        p.innerHTML = `<div class="hyl-kap"><canvas id="hyl-cv"></canvas>
          <div class="hyl-hud"><button class="hyl-btn" id="hyl-zor-btn" title="Zorluk">⚙️</button><button class="hyl-btn" id="hyl-ses-btn" title="Ses">🔊</button><button class="hyl-btn" id="hyl-nasil-btn" title="Nasıl oynanır?">❓</button><button class="hyl-btn" id="hyl-yeni-btn" title="Bu odayı baştan">🔄</button></div>
          <div class="hyl-kim" id="hyl-kim" hidden></div><div class="kk-pop" id="hyl-pop" hidden></div>
          <div class="hyl-simdi" id="hyl-simdi" hidden></div><div class="hyl-perde" id="hyl-perde" hidden></div></div>`;
        _cv = $('hyl-cv'); _ctx = _cv.getContext('2d');
        try { new ResizeObserver(boyutla).observe(_cv); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        _cv.addEventListener('pointerdown', tiklama);
        $('hyl-zor-btn').onclick = zorlukAc; $('hyl-nasil-btn').onclick = nasil; $('hyl-yeni-btn').onclick = yeniSor;
        $('hyl-ses-btn').onclick = () => { try { localStorage.setItem('dag_hyl_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); ses('sec'); };
        if (!_raf) { _son = performance.now(); _raf = requestAnimationFrame(dongu); }
        hylGuncelle();
    }
    function hudCiz() { const s = $('hyl-ses-btn'); if (s) s.textContent = sesAcik() ? '🔊' : '🔇'; }
    function hylGuncelle() { if (!panel()) return; const st = durum(); hudCiz(); kimCiz(true); if (st.faz !== _perdeFaz) perdeCiz(st); }
    function kimCiz(zorla) {
        const st = _st || durum();
        K.kim($('hyl-kim'), { goster: st.faz === 'oyun', zorla, tema: 'hayalet', alt: (s) => { const r = K.rutbe(kal().fener[s.g + '|' + s.ad] || 0, RUTBE); return r[1] + ' ' + r[2]; }, rozet: (s) => ((st.turRozet || {})[s.g + '|' + s.ad] || []).map((id) => ROZET[id][0]).join(''), secAc: secAc });
    }
    function tiklama(e) {
        const st = durum(); if (st.faz !== 'oyun') return;
        const r = _cv.getBoundingClientRect(), qx = (e.clientX - r.left - _ox) / _olcek, qy = (e.clientY - r.top - _oy) / _olcek;
        const i = st.es.findIndex((es) => Math.abs(qx - es.x) <= es.w / 2 + 12 && qy >= esUst(es) - 60 && qy <= ZEMIN + 40);
        if (i < 0) return;
        if (st.bos[i]) { fxYazi(st.es[i].x, esUst(st.es[i]) - 30, 'Burası boş', '#9ad8ff', 30, 50); return; }
        st.secili = i; st.elle = true; kaydet(); ses('sec');
    }

    /* ---------- PERDELER ---------- */
    function perde(html, bag) { const p = $('hyl-perde'); if (!p) return; p.innerHTML = '<div class="hyl-kart">' + html + '</div>'; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('hyl-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(a) { return '<p><b>Zorluk seç:</b></p><div class="hyl-zorsec">' + Object.keys(DZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === a ? 'on' : '') + '"><span class="n">' + DZ[k].ad + '</span><span class="d">' + DZ[k].d + '</span></button>').join('') + '</div>'; }
    function adlarHTML(l) { return '<div class="hyl-adlar">' + l.slice().sort((a, b) => String(a).localeCompare(String(b), 'tr')).map((a) => '<span>' + K.kacis(K.ilkAd(a)) + '</span>').join('') + '</div>'; }
    function konakHTML(oda) { return '<div class="hyl-konak">' + ODALAR.map((o, i) => '<span class="' + (i < oda ? 'temiz' : i === oda ? 'su' : '') + '">' + (i < oda ? '✅' : i === oda ? '👻' : '🚪') + '<b>' + K.kacis(o.ad) + '</b></span>').join('') + '<span class="' + (oda >= ODALAR.length ? 'su' : '') + '">👑<b>Kule</b></span></div>'; }
    function kuralHTML(st) { return '<div class="hyl-kural"><div class="iyi"><b>' + st.esik + ' ve üstü</b><span>Fenerin baktığı eşya açılır. Hayalet oradaysa <b>yakalanır</b>. Boşsa yandan gelen tık tık sesi ipucudur.</span></div><div class="kotu"><b>1 – ' + (st.esik - 1) + '</b><span>Hayalet oradaysa <b>başka eşyaya kaçar</b>. Nereye kaçtığını görürsün, peşinden at.</span></div><div class="altin"><b>10 ve X</b><span>Ayrıca saklanan bir hayaleti <b>gösterir</b>.</span></div></div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const O = odaBul(st.oda), Kl = kal(), kralMi = st.oda >= ODALAR.length;
        if (st.faz === 'oyun') { perdeKapat(); return; }
        if (st.faz === 'basla') {
            perde('<span class="hyl-etiket">' + (kralMi ? '👑 SON ODA' : 'Oda ' + (st.oda + 1) + '/5') + ' · Sezon ' + (Kl.sezon || 1) + '</span><h2>' + (kralMi ? 'Hayalet Kral!' : K.kacis(O.ad)) + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</h2>' + konakHTML(st.oda)
                + '<p>' + (kralMi ? 'Bütün hayaletlerin kralı bu eşyalardan birinde. <b>3 kez</b> yakalayın; her yakalanışta yeniden saklanır. ' : 'Eşyaların arkasında <b>' + st.hy.length + ' hayalet</b> saklanıyor. ') + '<b>' + st.maxSaat + ' seride</b> hepsini yakalayın, yoksa kalanlar pencereden kaçar.</p>' + kuralHTML(st)
                + '<div class="hyl-butonlar"><button class="hyl-b" id="hyl-bas">🔦 Avı başlat</button></div>' + (st.oda === 0 && !st.rovans ? zorSecHTML(st.zor) : '') + '<p class="hyl-not">📣 Koç söyler: "Kendi hedefine at. ' + st.esik + ' ve üstü eşyayı açar, zayıf ok hayaleti kaçırır!" · Sınıf başka eşya isterse koç o eşyaya dokunur.</p>', (p) => {
                    p.querySelector('#hyl-bas').onclick = () => { const s = durum(); s.faz = 'oyun'; kaydet(); ses('uu'); hylGuncelle(); saklanma(); };
                    p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
                });
        } else if (st.faz === 'temiz') {
            perde('<div class="hyl-buyuk">✨🫙✨</div><span class="hyl-etiket">' + K.kacis(O.ad) + ' temizlendi</span><h2>Bütün hayaletler kavanozda!</h2>' + konakHTML(Kl.oda) + '<p>Bu odanın avcıları:</p>' + adlarHTML(st.turAtan)
                + '<div class="hyl-butonlar"><button class="hyl-b" id="hyl-dev">' + (Kl.oda >= ODALAR.length ? '👑 Kuleye çık →' : '🚪 Sıradaki oda →') + '</button></div>', (p) => {
                    p.querySelector('#hyl-dev').onclick = () => { const s = durum(); odaKur(s); s.faz = 'basla'; kaydet(); hylGuncelle(); };
                });
        } else if (st.faz === 'gece') {
            perde('<div class="hyl-buyuk">🕛👻💨</div><h2>Süre doldu!</h2><p>' + st.maxSaat + ' seride <b>' + st.yakalanan + '</b> hayalet yakaladık, <b>' + kalan(st) + '</b> hayalet pencereden kaçtı. Hepsini yakalayana kadar bu odadayız, yeniden deneyelim!</p><div class="hyl-butonlar"><button class="hyl-b kirmizi" id="hyl-rov">🔁 Bu oda yeniden</button></div>', (p) => {
                p.querySelector('#hyl-rov').onclick = () => { const s = durum(); odaKur(s); s.rovans = true; s.faz = 'basla'; kaydet(); hylGuncelle(); };
            });
        } else if (st.faz === 'final') {
            perde('<div class="hyl-buyuk">👑🫙🏆</div><h2>KONAK TEMİZ!</h2><p>Hayalet Kral kavanozda! ' + ((Kl.sezon || 2) - 1) + '. sezonun hayalet avcıları ' + st.hepAtan.length + ' okçunun hepsi:</p>' + adlarHTML(st.hepAtan) + '<p>Toplam ' + (Kl.kavanoz || 0) + ' hayalet kavanozda · ' + st.toplamOk + ' ok</p><div class="hyl-butonlar"><button class="hyl-b" id="hyl-yeni">🏚️ Yeni konak (yeni sezon)</button></div>', (p) => {
                p.querySelector('#hyl-yeni').onclick = () => { _st = bosDurum(st.zor); kaydet(); hylGuncelle(); };
            });
        }
    }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esikEl = 0; odaKur(st); st.faz = 'basla'; kaydet(); ses('sec'); _perdeFaz = null; hylGuncelle(); }
    function zorlukAc() {
        const st = durum();
        perde('<h2>⚙️ Zorluk</h2><p>Değiştirirsen bu oda baştan başlar.</p>' + zorSecHTML(st.zor) + '<p><b>Yakalamak için gereken puan:</b></p><div class="hyl-esik">' + [5, 6, 7, 8].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="hyl-butonlar"><button class="hyl-b ikincil" id="hyl-kapat">Kapat</button></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; s.esikEl = s.esik; kaydet(); ses('sec'); zorlukAc(); });
            p.querySelector('#hyl-kapat').onclick = () => { _perdeFaz = null; hylGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        const st = durum();
        perde('<h2>👻 Nasıl oynanır?</h2><p>Herkes <b>kendi hedefine</b> atar. Fenerin baktığı eşya sarı çerçevelidir; sınıf başka eşya isterse koç ona dokunur.</p>' + kuralHTML(st) + '<p>Hayalet <b>yalnız zayıf okla</b> kaçar. Süre dolunca kalanlar pencereden gider, oda baştan oynanır. 5 oda + Hayalet Kral = konak temiz.</p><div class="hyl-butonlar"><button class="hyl-b" id="hyl-tamam">Tamam</button></div>', (p) => { p.querySelector('#hyl-tamam').onclick = () => { _perdeFaz = null; hylGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    // Oda başında: hayaletler göz önünde koşup eşyaların arkasına saklanır (gerçek yerleri göstermez)
    function saklanma() {
        const st = durum(), n = st.oda >= ODALAR.length ? 1 : st.hy.length; band(n === 1 ? '👑 HAYALET KRAL SAKLANIYOR!' : '👻 ' + n + ' HAYALET SAKLANIYOR!', 'Her biri bir eşyanın arkasında', '#c9a6ff', 2600);
        for (let k = 0; k < n; k++) FX.gh.push({ x0: 935, y0: 250, x1: L0 + 60 + (R0 - L0 - 120) * (k + .5) / n, y1: 470, s0: .6, s1: .9, u: -k * .25, d: 1500, yay: 60, a: true, kral: st.oda >= ODALAR.length });
    }
    function yeniSor() {
        perde('<h2>🔄 Bu oda baştan mı?</h2><p>Eşyalar ve hayaletlerin yeri değişir. Oda numarası aynı kalır.</p><div class="hyl-butonlar"><button class="hyl-b kirmizi" id="hyl-evet">Evet, baştan</button><button class="hyl-b ikincil" id="hyl-hayir">Vazgeç</button></div>', (p) => {
            p.querySelector('#hyl-evet').onclick = () => { const s = durum(); odaKur(s); s.faz = 'basla'; kaydet(); _perdeFaz = null; hylGuncelle(); };
            p.querySelector('#hyl-hayir').onclick = () => { _perdeFaz = null; hylGuncelle(); };
        });
        _perdeFaz = 'yeni';
    }
    function secAc() {
        const st = durum();
        perde(K.secHTML((s) => (st.turAtan || []).indexOf(s.ad) !== -1, (s) => K.rutbe(kal().fener[s.g + '|' + s.ad] || 0, RUTBE)[1], 'hayalet') + '<div class="hyl-butonlar"><button class="hyl-b ikincil" id="hyl-kapat">Kapat</button></div>', (p) => {
            K.secBagla(p, () => { ses('sec'); _perdeFaz = null; hylGuncelle(); });
            p.querySelector('#hyl-kapat').onclick = () => { _perdeFaz = null; hylGuncelle(); };
        });
        _perdeFaz = 'sec';
    }

    /* ---------- ROZET ---------- */
    function rozetVer(S, s, id) {
        const key = s.g + '|' + s.ad; S.turRozet = S.turRozet || {}; const v = S.turRozet[key] = S.turRozet[key] || []; if (v.indexOf(id) !== -1) return; v.push(id);
        const Kl = kal(), r = Kl.rozet[key] = Kl.rozet[key] || {}; r[id] = (r[id] || 0) + 1; kalKaydet();
        K.pop($('hyl-pop'), s, ROZET[id][0] + ' ' + ROZET[id][1].toLocaleUpperCase('tr-TR') + ' rozeti!');
    }
    function fenerSay(s) { const key = s.g + '|' + s.ad, Kl = kal(), once = K.rutbe(Kl.fener[key] || 0, RUTBE); Kl.fener[key] = (Kl.fener[key] || 0) + 1; kalKaydet(); const y = K.rutbe(Kl.fener[key], RUTBE); if (y !== once) K.pop($('hyl-pop'), s, y[1] + ' artık ' + y[2].toLocaleUpperCase('tr-TR') + '!', true); }

    /* ---------- SERİ ---------- */
    function hylSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitirD = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        let st = durum();
        if (st.faz === 'temiz') { odaKur(st); }
        if (st.faz === 'gece') { odaKur(st); }
        if (st.faz === 'final') { _st = bosDurum(st.zor); st = _st; }
        const S = durum(); S.faz = 'oyun'; _perdeFaz = null; perdeKapat();
        if (S.secili == null || S.bos[S.secili]) hedefSec(S);
        const key = s.g + '|' + s.ad, oklar = (kaydedilecek || []).map((k) => okDeger(k.puan));
        if (S.turAtan.indexOf(s.ad) === -1) S.turAtan.push(s.ad); if (S.hepAtan.indexOf(s.ad) === -1) S.hepAtan.push(s.ad); S.toplamOk += oklar.length;
        const top = oklar.reduce((a, b) => a + b, 0); S.sonTop = S.sonTop || {};
        if (oklar.some((p) => p === 10)) rozetVer(S, s, 'altin');
        if (oklar.length >= 3 && oklar.every((p) => p >= S.esik)) rozetVer(S, s, 'uclu');
        if (S.sonTop[key] != null && top >= S.sonTop[key] + 3) rozetVer(S, s, 'gelisen');
        S.sonTop[key] = top; kaydet(); kimCiz(true);
        const kim = K.ilkAd(s.ad).toLocaleUpperCase('tr-TR'), sure = oklar.length > 3 ? 620 : 1150; FX.band = null;
        const gorsel = !!(_cv && document.body.contains(_cv) && _cv.offsetParent !== null);
        (async () => {
            for (const p of oklar) {
                if (S.faz !== 'oyun') break;
                if (S.secili == null || S.bos[S.secili]) hedefSec(S);
                const i2 = S.secili, e = S.es[i2], E = ESYA[e.t], U = esUst(e), iyi = p >= S.esik, on = kim + ' ' + p;
                if (gorsel) { ses('fener'); FX.fener = { x: e.x, y: U + e.h / 2, u: 0, g: p === 0 ? .2 : .4 + Math.min(10, p) / 12 }; await bekle(420); }
                let hj = S.hy.findIndex((h, k) => h === i2 && S.gor[k]); if (hj === -1) hj = S.hy.indexOf(i2);
                if (iyi) {
                    fenerSay(s); rozetVer(S, s, 'fener'); S.katki[key] = (S.katki[key] || 0) + 1;
                    if (hj !== -1) { // YAKALANDI
                        const kralMi = S.oda >= ODALAR.length;
                        if (kralMi && S.kralCan > 1) { // Kral vurulunca bütün eşyalar yeniden "?"
                            S.kralCan--; const yeniYer = kacacakYer(S, i2); S.bos = S.es.map(() => null); tasi(S, hj, yeniYer, false); S.secili = i2; S.elle = false;
                            if (gorsel) { ses('yakala'); FX.shake = 8; fxParca(e.x, U, 40, ['#c9a6ff', '#fff', '#ffd34a']); FX.gh.push({ x0: e.x, y0: U, x1: 935, y1: 250, s0: 1.3, s1: .3, u: 0, d: 800, yay: 60, a: true, kral: true }); band(on + ' · KRAL VURULDU!', 'Yeniden saklandı · ' + S.kralCan + ' kez daha', '#ffd34a', sure + 500); }
                            rozetVer(S, s, 'yakala');
                        } else {
                            S.hy[hj] = -1; S.gor[hj] = false; S.duy = []; S.yakalanan++; const Kl = kal(); Kl.kavanoz = (Kl.kavanoz || 0) + 1; kalKaydet(); rozetVer(S, s, 'yakala'); if (kralMi) S.kralCan = 0;
                            if (gorsel) { ses('yakala'); FX.shake = 10; fxParca(e.x, U, 50, ['#9fd8ff', '#fff', '#c9a6ff', '#ffd34a']); const jx = 255 + ((S.yakalanan - 1) - ((kralMi ? 1 : S.hy.length) - 1) / 2) * 110; FX.gh.push({ x0: e.x, y0: U - 20, x1: jx, y1: 276, s0: 1.2, s1: .5, u: 0, d: 1000, yay: 140, kral: kralMi }); band(on + ' · HAYALET YAKALANDI!', kalan(S) ? kalan(S) + ' hayalet kaldı' : 'Hepsi kavanozda!', '#5ee39b', sure + 300); }
                            const ikinci = S.hy.indexOf(i2); if (ikinci !== -1) S.gor[ikinci] = true; else S.bos[i2] = 'bos'; // aynı eşyada bir hayalet daha varsa görünür
                        }
                    } else { // BOŞ: yanında saklı hayalet varsa yan eşyalar tıkırdar, yoksa onlar da boştur
                        S.bos[i2] = 'bos'; const yan = [i2 - 1, i2 + 1].filter((k) => k >= 0 && k < S.es.length && !S.bos[k] && !gorunenVar(S, k)), ses2 = yan.some((k) => sakliVar(S, k));
                        S.duy = ses2 ? yan : (S.duy || []).filter((k) => !S.bos[k]); if (!ses2) yan.forEach((k) => { S.bos[k] = 'bos'; }); S.duy = S.duy.filter((k) => !S.bos[k]);
                        if (gorsel) { ses(ses2 ? 'tik' : 'bos'); band(on + ' · ' + E.i + ' AÇTI, BOŞ!', ses2 ? (yan.length === 1 ? 'Yandan ses geliyor: ' + ESYA[S.es[yan[0]].t].ad : 'Yandan ses geliyor! Soldan mı, sağdan mı?') : yan.length ? 'Yandakiler de boş' : 'Başka eşyaya bak', '#9ad8ff', sure + 300); }
                    }
                    if (p === 10) { const sk = S.hy.map((h, k) => h >= 0 && !S.gor[k] ? k : -1).filter((k) => k >= 0); if (sk.length && !(S.oda >= ODALAR.length)) { const g = sec(sk); S.gor[g] = true; S.duy = S.duy.filter((k) => k !== S.hy[g]); if (gorsel) { await bekle(sure * .7); ses('uu'); band(on + ' · SÜPER FENER!', 'Hayalet göründü: ' + ESYA[S.es[S.hy[g]].t].ad, '#ffd34a', sure + 300); } } }
                    if (!S.elle || S.bos[i2] || S.secili !== i2) hedefSec(S);
                } else if (hj !== -1 && p > 0) { // zayıf ok: göz göre göre kaçar, fener peşinden gider
                    const yeniYer = kacacakYer(S, i2), y = S.es[yeniYer]; tasi(S, hj, yeniYer, true);
                    if (!hayaletVar(S, i2)) S.bos[i2] = 'bos';
                    S.secili = yeniYer; S.elle = false;
                    if (gorsel) { ses('kacti'); FX.iz = { x0: e.x, y0: U, x1: y.x, y1: esUst(y), l: 2600 }; FX.gh.push({ x0: e.x, y0: U - 14, x1: y.x, y1: esUst(y) - 14, s0: 1.1, s1: .95, u: 0, d: 1000, yay: 150, hedef: yeniYer, kral: S.oda >= ODALAR.length }); band(on + ' · ZAYIF OK, HAYALET KAÇTI!', ESYA[y.t].e + ' kaçtı, peşinden!', '#ff8a7a', sure + 400); }
                } else if (gorsel) { ses('bos'); band(on + (p === 0 ? ' · ISKA' : ' · ZAYIF OK'), (gorunenVar(S, i2) ? 'Yakalamak' : E.i + ' açmak') + ' için ' + S.esik + ' ve üstü', '#e8d8c0', sure); }
                kaydet(); if (gorsel) await bekle(sure);
                if (kalan(S) === 0) break;
            }
            if (kalan(S) === 0 && S.faz === 'oyun') {
                const Kl = kal(), kralMi = S.oda >= ODALAR.length;
                if (gorsel) { ses('temiz'); await bekle(1400); }
                if (kralMi) { Kl.oda = 0; Kl.sezon = (Kl.sezon || 1) + 1; S.faz = 'final'; } else { Kl.oda = Kl.oda + 1; S.faz = 'temiz'; }
                kalKaydet(); kaydet(); bitirD(); hylGuncelle(); return;
            }
            S.saat++;
            kaydet(); bitirD();
            if (S.saat >= S.maxSaat) {
                if (gorsel) { ses('gece'); band('🕛 SÜRE DOLDU!', kalan(S) + ' hayalet pencereden kaçıyor', '#ff8a7a', 2600); S.hy.forEach((h, k) => { if (h >= 0) { const e = S.es[h]; FX.gh.push({ x0: e.x, y0: esUst(e), x1: 935, y1: 250, s0: 1.1, s1: .2, u: -k * .25, d: 1300, yay: 60, kral: S.oda >= ODALAR.length }); } }); S.gor = S.gor.map(() => false); await bekle(2600); }
                S.faz = 'gece'; kaydet(); hylGuncelle();
            } else if (gorsel && S.maxSaat - S.saat <= 2) band('🕛 ' + (S.maxSaat - S.saat === 1 ? 'SON SERİ!' : 'SON 2 SERİ!'), 'Süre dolarsa kalanlar pencereden kaçar', '#ff8a7a', 1800);
        })().catch(() => bitirD());
        setTimeout(bitirD, 8000);
    }
    function hylAnlik() { const a = JSON.parse(JSON.stringify(durum())); a._kal = JSON.parse(JSON.stringify(kal())); return a; }
    function hylGeriYukle(k) { if (!k) return; _zaman.forEach(clearTimeout); _zaman = []; k = JSON.parse(JSON.stringify(k)); if (k._kal) { _kal = k._kal; _kalKonum = konum(); kalKaydet(); delete k._kal; } _st = k; _stKonum = konum(); kaydet(); _perdeFaz = null; FX.gh = []; FX.fener = null; FX.band = null; FX.iz = null; if (panel()) hylGuncelle(); }
    function hylSporcu(g, ad) { const st = durum(), n = st.katki[g + '|' + ad] || 0; return n ? '🔦' + n : '-'; }

    /* ---------- STİL ---------- */
    function css() {
        if ($('hyl-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'hyl-css';
        st.textContent = `
.km-oyun-panel-hayalet{padding:0;background:#05040a;overflow:hidden}
.hyl-kap{position:absolute;inset:0}
.hyl-kap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;cursor:pointer}
.hyl-hud{position:absolute;right:8px;top:6px;display:flex;gap:5px;z-index:2}
.hyl-btn{background:rgba(10,12,24,.85);border:1px solid #5a4680;color:#fff;border-radius:999px;min-width:36px;height:36px;font-size:16px;cursor:pointer;padding:0 10px;font-weight:900}
.hyl-kim{position:absolute;z-index:3}.hyl-kim[hidden]{display:none}
.hyl-simdi{position:absolute;left:8px;right:8px;z-index:3;background:rgba(14,10,26,.95);border:2px solid #ffd34a;border-radius:14px;padding:8px 12px;text-align:center;color:#fff;pointer-events:none}.hyl-simdi[hidden]{display:none}.hyl-simdi b{display:block;font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:17px;line-height:1.2}.hyl-simdi span{font-size:14px;font-weight:700;color:#d8d0f0}
.hyl-perde{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:2%;background:rgba(5,4,14,.66);backdrop-filter:blur(2px)}
.hyl-perde[hidden]{display:none}
.hyl-kart{max-width:820px;width:100%;max-height:100%;overflow:auto;background:linear-gradient(160deg,#ece4ff,#d6c8f4);color:#221a34;border:2px solid #8a6ad0;border-radius:20px;padding:clamp(12px,2.6vw,26px);display:flex;flex-direction:column;gap:clamp(6px,1.2vw,12px);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.hyl-kart h2{margin:0;font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(26px,3.8vw,44px);line-height:1.1}
.hyl-kart p{margin:0 auto;max-width:62ch;font-size:clamp(15px,1.9vw,21px);color:#2e2440;line-height:1.4}.hyl-kart .hyl-sol{text-align:left}
.hyl-etiket{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#6a4aa8}
.hyl-buyuk{font-size:clamp(40px,7vw,72px);line-height:1}
.hyl-not{font-size:13px!important;opacity:.7}
.hyl-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.hyl-adlar span{background:#3a2a66;color:#fff;border-radius:999px;padding:3px 12px;font-weight:800;font-size:clamp(13px,1.6vw,17px)}
.hyl-konak{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.hyl-konak span{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border-radius:12px;padding:6px 8px;min-width:74px;font-size:clamp(20px,2.6vw,28px);border:2px solid transparent}
.hyl-konak span b{font-size:11px;font-weight:900;color:#3a2a66}.hyl-konak span.temiz{background:#e2f8ec}.hyl-konak span.su{border-color:#8a6ad0;background:#f4eeff}
.hyl-kural{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:left}.hyl-kural>div{border-radius:14px;padding:10px 14px;background:#fff;border-left:8px solid #2fae6b}.hyl-kural>.kotu{border-color:#d93a3a}.hyl-kural>.altin{border-color:#e0a000}
.hyl-kural>div>b{display:block;font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(20px,2.4vw,28px);color:#221a34}.hyl-kural span{font-size:clamp(14px,1.5vw,17px);line-height:1.35;color:#2e2440}
.hyl-butonlar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hyl-b{border:0;cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.2vw,23px);padding:10px 22px;border-radius:14px;background:#ffc94a;color:#241800}
.hyl-b.kirmizi{background:#d93a3a;color:#fff}.hyl-b.ikincil{background:#3a2a66;color:#fff}
.hyl-zorsec{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hyl-zorsec button{cursor:pointer;border-radius:16px;padding:10px;background:#fff;border:3px solid #c8b8f0;color:#221a34;display:flex;flex-direction:column;gap:3px;align-items:center}
.hyl-zorsec button.on{border-color:#ff9a1a;box-shadow:0 0 0 3px rgba(255,154,26,.35)}
.hyl-zorsec .n{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.4vw,25px)}.hyl-zorsec .d{font-weight:800;font-size:12px;opacity:.8}
.hyl-esik{display:flex;gap:8px;justify-content:center}.hyl-esik button{cursor:pointer;border-radius:12px;padding:8px 16px;font-weight:900;font-size:18px;background:#fff;border:2px solid #c8b8f0}.hyl-esik button.on{border-color:#ff9a1a;background:#ffe2a8}
@media (max-width:600px){.hyl-kural{grid-template-columns:1fr;gap:6px}.hyl-kural>div{padding:7px 12px}.hyl-konak{display:none}.hyl-zorsec{grid-template-columns:1fr}.hyl-zorsec .d{display:none}}`;
        document.head.appendChild(st);
    }

    window.hylSahneKur = hylSahneKur;
    window.hylGuncelle = hylGuncelle;
    window.hylSeri = hylSeri;
    window.hylAnlik = hylAnlik;
    window.hylGeriYukle = hylGeriYukle;
    window.hylSporcu = hylSporcu;
    window.hylEsyaNokta = (i) => { if (!_cv) return null; const r = _cv.getBoundingClientRect(), e = durum().es[i]; return { x: r.left + _ox + e.x * _olcek, y: r.top + _oy + (ZEMIN - e.h / 2) * _olcek }; }; // e2e
})();
