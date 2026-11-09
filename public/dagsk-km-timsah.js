/* ================================================================================================
   🐊 UYUYAN DEV — Karışık Sınıf › Oyunlar teması 'timsah' (2026-11-09, v399). Kullanıcı: "oyunlara dönelim, cezalı oyunlar olsun";
   dört fikirden (Ceza Çarkı, Bomba Takımı, Timsah Bataklığı, Lanetli Kurallar) taslakları görüp "Uyuyan Dev"i seçti.
   OYUN: bütün sınıf birlikte. Dev timsah uyuyor; sınıf onu uyandırmadan balık toplar. Ok, çocuğun KENDİ seviyesine göre değerlendirilir:
     kendi hedefini vuran ok 🐟🐟, hedefe değen ok 🐟, ıska 🔊🔊 (uyku metresi +2), seviyesinin çok altındaki ok 🔊.
     3 ok da kendi hedefindeyse 🎵 NİNNİ: metre −2. Her seride küçük bir ŞANS OLAYI (ördek vakvaklar, dal kırılır… ya da ay doğar, balık sürüsü gelir):
     iyi atan da kötü atan da etkilenir. Metre %70'i geçince timsah bir gözünü açar, ekran kızarır, kalp atışı duyulur.
   CEZA: metre dolunca timsah uyanır, kükrer, kovadan balık kapar; ÇARK o uyku döneminde atanlar arasından 1–3 kişi seçer (gürültü yapanın şansı
     biraz daha fazla ama iyi atan da seçilebilir). Seçilenler atış çizgisinin arkasında bir görev yapar (yaylar yerde), timsah yeniden uyur.
   KURALLAR (STANDING): sonuç herkes atınca belli olur; tur sırasında kişisel puan/balık sıralaması yok; finalde herkesin adı; "Hep birlikte bitir"
     erken bitişte atış başına bakar. KABUK: tmSahneKur · tmGuncelle · tmSeri(s, i, kaydedilecek, done) · tmAnlik · tmGeriYukle · tmSporcu · tmAyarUygula · tmFinalZorla.
   Durum 'dag_km_timsah_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK). Ayar: timsahTur. İçerik: sans, kapma, gerilim.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('timsah', k); } catch (e) { return true; } };
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_timsah_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');
    const adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
    const ayar = (k, v) => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a[k] != null) ? a[k] : v; } catch (e) { return v; } };
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- içerik ---- */
    const halka = (p) => p >= 9 ? 'sari' : p >= 7 ? 'kirmizi' : p >= 5 ? 'mavi' : p >= 3 ? 'siyah' : p >= 1 ? 'beyaz' : 'iska';
    const HALKA_RENK = { sari: '#F5D32A', kirmizi: '#E23B2E', mavi: '#2F7FD6', siyah: '#2A2D36', beyaz: '#F3F4F6', iska: '#4B5563' };
    const MAX = 10, GERGIN = 7, OLAY_SANS = 1 / 6, GOREV_SN = 20;
    const OLAY_KOTU = [{ ikon: '🦆', ad: 'ÖRDEK VAKVAKLADI', yaz: 'Uyku metresi +2', ses: 2 }, { ikon: '🪵', ad: 'DAL KIRILDI', yaz: 'Çatırt! Uyku metresi +2', ses: 2 },
        { ikon: '🐸', ad: 'KURBAĞA KOROSU', yaz: 'Vrak vrak… Uyku metresi +1', ses: 1 }, { ikon: '🤧', ad: 'BİRİ HAPŞIRDI', yaz: 'HAPŞU! Uyku metresi +3', ses: 3 }];
    const OLAY_IYI = [{ ikon: '🌙', ad: 'AY DOĞDU', yaz: 'Timsah derin uykuya daldı: metre −2', ses: -2 }, { ikon: '🐟', ad: 'BALIK SÜRÜSÜ', yaz: '+3 balık kendiliğinden geldi', balik: 3 }];
    // Ceza görevleri: atış çizgisinin arkasında, yaylar yerde
    const GOREV = [['🐸', '5 KURBAĞA SIÇRAMASI', 'Çömel, yerinde zıpla'], ['🐊', 'TİMSAH AĞZI', 'Kollarını timsah ağzı gibi 10 kez aç-kapa'], ['🗿', 'HEYKEL', '10 saniye hiç kıpırdama'],
        ['🦩', 'FLAMİNGO', 'Tek ayak üstünde 10 saniye'], ['🏃', 'YERİNDE KOŞU', '10 saniye, dizler yukarı'], ['🙆', '10 YILDIZ ZIPLAMASI', 'Kollar yukarı, bacaklar aç-kapa'],
        ['🐒', 'MAYMUN DANSI', '10 saniye maymun gibi dans'], ['🐢', 'KAPLUMBAĞA', 'Çömel, 5 saniye kabuğuna saklan, sonra fırla']];

    /* ---- kurallar (saf) ---- */
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca 🐟🐟
    function okSonuc(p, es) { if (p >= es) return { b: 2, s: 0 }; if (p <= 0) return { b: 0, s: 2 }; if (p < es - 4) return { b: 0, s: 1 }; return { b: 1, s: 0 }; }
    function seriSonuc(puanlar, es) {
        const oklar = puanlar.map((p) => okSonuc(p, es));
        return { oklar, balik: oklar.reduce((t, o) => t + o.b, 0), ses: oklar.reduce((t, o) => t + o.s, 0), ninni: puanlar.length >= 3 && puanlar.every((p) => p >= es) };
    }
    // Ağırlıklı, tekrarsız seçim (gürültü yapanın şansı biraz fazla, ama herkes seçilebilir)
    function agirlikliSec(havuz, n, r) {
        const h = havuz.slice(), sec = [];
        while (sec.length < n && h.length) { const top = h.reduce((t, x) => t + x.w, 0); let x = r() * top, i = 0; for (; i < h.length - 1; i++) { x -= h[i].w; if (x < 0) break; } sec.push(h[i].k); h.splice(i, 1); }
        return sec;
    }
    const secimSayisi = (n) => Math.min(3, Math.max(1, Math.round(n / 3)));
    // Hedef: ok başına ~0,9 balık (orta seviye bir sınıf, timsahın kaptıkları da düşünülünce zor ama yapılabilir)
    function hedefBalik(n, tur, okOrt) { return Math.max(10, Math.round(n * tur * (okOrt || 3) * 0.9)); }
    const kapmaOf = (balik) => Math.min(balik, Math.max(2, Math.round(balik * 0.1)));

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _gb = 0, _gs = 0, _gorevT = 0, _finalOynuyor = false, _uyanAcik = false;
    function yeniOyun() { return { tarih: bugun(), faz: 'oyun', basladi: false, balik: 0, ses: 0, atan: {}, kb: {}, donem: {}, uyanma: 0, gorev: 0, kapilan: 0, seri: 0, ok: 0, son: [], uyan: null, hedefAn: false, kazandi: null, G: 0, finalAdlar: null, erken: false }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { const t = +ayar('timsahTur', 1); return t > 0 ? t : 1; };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    const hedef = (st) => st.faz === 'son' && st.G ? st.G : hedefBalik(atabilenler().length, turSay(), st.seri ? st.ok / st.seri : 3);
    function uyanKur(st) {
        const var_ = new Set(atabilenler().map(kimlik)), havuz = Object.keys(st.donem || {}).filter((k) => var_.has(k)).map((k) => ({ k, w: st.donem[k] }));
        const secilen = agirlikliSec(havuz, secimSayisi(havuz.length), Math.random), kapti = ic('kapma') ? kapmaOf(st.balik) : 0;
        st.balik -= kapti; st.kapilan = (st.kapilan || 0) + kapti; st.uyanma = (st.uyanma || 0) + 1;
        st.uyan = { secilen, g: Math.floor(Math.random() * GOREV.length), kapti };
        return st.uyan;
    }
    function bitir(st, erken) {
        const l = atabilenler(), G = hedef(st);
        st.erken = !!erken; st.G = G; st.faz = 'son';
        const beklenen = st.erken ? G * Math.min(1, (st.seri || 0) / Math.max(1, l.length * turSay())) : G;
        st.kazandi = st.hedefAn || st.balik >= beklenen;
        st.finalAdlar = l.filter((s) => st.atan[kimlik(s)]).map((s) => adOf(kimlik(s)));
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp || !st.atan[kimlik(s)]) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.timsah = o.timsah || {}; o.timsah.oyun = (o.timsah.oyun || 0) + 1; if (st.kazandi) o.timsah.kazanma = (o.timsah.kazanma || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur, f2) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    function gurultu(sure, gur, gec, f, tip) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = Math.floor(AC.sampleRate * sure), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const k = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); k.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f || 800; g.gain.value = gur || .2; k.connect(fl); fl.connect(g); g.connect(AC.destination); k.start(AC.currentTime + (gec || 0)); } catch (e) { } }
    const SES = {
        ok: () => { gurultu(.2, .1, 0, 2400, 'bandpass'); ton(660, .12, 0, 'triangle', .05); },
        balik: () => { ton(520, .1, 0, 'sine', .08, 1100); gurultu(.12, .06, 0, 1800, 'bandpass'); },
        ses: () => { gurultu(.3, .22, 0, 900, 'bandpass'); ton(170, .22, 0, 'square', .05, 120); },
        hic: () => ton(200, .16, 0, 'triangle', .06),
        ninni: () => { [659, 587, 523, 587, 659, 659].forEach((f, i) => ton(f, .32, i * .24, 'sine', .06)); },
        kalp: () => { [0, .2, .9, 1.1].forEach((d) => ton(62, .16, d, 'sine', .35)); },
        olay: () => { [523, 784].forEach((f, i) => ton(f, .14, i * .08, 'triangle', .07)); },
        kukreme: () => { ton(150, 1.2, 0, 'sawtooth', .13, 45); gurultu(1.2, .35, 0, 420); ton(95, 1, .1, 'square', .07, 40); },
        tik: () => ton(1300, .03, 0, 'square', .035),
        yakala: () => { ton(240, .25, 0, 'sawtooth', .09, 90); gurultu(.18, .2, 0, 1500); },
        duduk: () => { ton(2100, .22, 0, 'sine', .08); ton(2100, .4, .3, 'sine', .08); },
        uyku: () => { [392, 330, 262].forEach((f, i) => ton(f, .4, i * .25, 'sine', .06)); },
        zafer: () => { [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, .28, i * .14, 'square', .07)); [1568, 2093, 2637].forEach((f, i) => ton(f, .3, .8 + i * .1, 'triangle', .05)); }
    };

    /* ---- çizim ---- */
    const panel = () => $('km-oyun-panel-timsah');
    let _fx = [], _raf = 0;
    function tuvalBoyut(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    function patla(x, y, renkler, n) {
        if (azHareket()) return; const t0 = performance.now();
        for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, h = 2 + Math.random() * 7; _fx.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 3, s: 5 + Math.random() * 8, r: renkler[i % renkler.length], t0, om: 600 + Math.random() * 700 }); }
        if (!_raf) _raf = requestAnimationFrame(efekt);
    }
    function efekt(ms) {
        _raf = 0; const cv = $('tm-efekt'); if (!cv) { _fx = []; return; }
        if (!cv._c || cv._w !== cv.clientWidth || cv._h !== cv.clientHeight) { cv._c = tuvalBoyut(cv); cv._w = cv.clientWidth; cv._h = cv.clientHeight; }
        const c = cv._c; c.clearRect(0, 0, cv._w, cv._h);
        _fx = _fx.filter((q) => ms - q.t0 < q.om);
        _fx.forEach((q) => { const u = (ms - q.t0) / q.om; q.x += q.vx; q.y += q.vy; q.vy += .3; c.globalAlpha = 1 - u; c.fillStyle = q.r; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s * .6); });
        c.globalAlpha = 1; if (_fx.length) _raf = requestAnimationFrame(efekt);
    }
    function merkezOf(el) { const sa = document.querySelector('.tm-sahne'); if (!el || !sa) return null; const r = el.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width / 2, y: r.top - rs.top + r.height / 2 }; }
    // Uçan simge (🐟 suyun içinden kovaya; 🔊 timsahın başına; kapılan balık kovadan timsaha)
    function uc(metin, nereden, nereye, sinif) {
        if (azHareket()) return; const sa = document.querySelector('.tm-sahne'); if (!sa || !nereden || !nereye) return;
        const e = document.createElement('span'); e.className = 'tm-uc ' + (sinif || ''); e.textContent = metin; e.style.left = nereden.x + 'px'; e.style.top = nereden.y + 'px'; sa.appendChild(e);
        requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transform = 'translate(' + (nereye.x - nereden.x) + 'px,' + (nereye.y - nereden.y) + 'px) scale(.7)'; e.style.opacity = '.2'; }));
        setTimeout(() => e.remove(), 900);
    }
    const kovaXY = () => merkezOf($('tm-kova-ikon'));
    const basXY = () => merkezOf($('tm-goz-hedef'));
    const suXY = () => { const o = $('tm-orta'), sa = document.querySelector('.tm-sahne'); if (!o || !sa) return null; const r = o.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width * (.25 + Math.random() * .5), y: r.top - rs.top + r.height * .86 }; };

    function timsahSVG() {
        const ucgen = (l, yon) => l.map(([x, y]) => yon ? 'M' + x + ' ' + y + ' L' + (x + 6) + ' ' + (y + 10) + ' L' + (x + 12) + ' ' + y + 'Z' : 'M' + (x - 13) + ' ' + (y + 7) + ' L' + x + ' ' + (y - 13) + ' L' + (x + 13) + ' ' + (y + 7) + 'Z').join(' ');
        const ustDis = [], altDis = []; for (let x = 96; x <= 300; x += 26) { ustDis.push([x, 171]); altDis.push([x + 10, 177]); }
        const sirt = [[362, 131], [398, 123], [434, 121], [470, 125], [506, 133], [542, 144], [578, 157]];
        return '<svg class="tm-timsah" viewBox="0 0 640 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>'
            + '<linearGradient id="tm-su-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a8a76" stop-opacity=".55"/><stop offset=".35" stop-color="#14524a" stop-opacity=".92"/><stop offset="1" stop-color="#082622"/></linearGradient>'
            + '<radialGradient id="tm-goz-g" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#FFF7A8"/><stop offset="1" stop-color="#E4A400"/></radialGradient>'
            + '<linearGradient id="tm-deri" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FAE55"/><stop offset="1" stop-color="#3E7A33"/></linearGradient></defs>'
            + '<g class="tm-govde">'
            + '<path d="M270 134 C330 108 470 112 612 170 L612 214 L270 214 Z" fill="url(#tm-deri)"/><path d="' + ucgen(sirt) + '" fill="#2F5F28"/>'
            + '<path class="tm-agiz-ic" d="M78 170 L336 162 L336 190 L92 190 Z" fill="#B8344F"/><ellipse class="tm-agiz-ic" cx="250" cy="182" rx="48" ry="7" fill="#E0708A"/>'
            + '<path d="M68 178 C60 190 76 200 98 200 L338 200 L338 174 Z" fill="#5A9746"/><path d="' + altDis.map(([x]) => 'M' + x + ' 188 L' + (x + 6) + ' 177 L' + (x + 12) + ' 188Z').join(' ') + '" fill="#FFF9E6" class="tm-alt-dis"/>'
            + '<g class="tm-ust-cene"><path d="M338 132 C292 110 172 114 94 126 C64 131 56 152 64 164 C70 173 82 175 96 175 L338 176 Z" fill="url(#tm-deri)"/>'
            + '<path d="' + ucgen(ustDis, true) + '" fill="#FFF9E6"/>'
            + '<ellipse cx="88" cy="128" rx="6" ry="3.5" fill="#24481F"/><ellipse cx="108" cy="125" rx="6" ry="3.5" fill="#24481F"/>'
            + '<circle cx="170" cy="140" r="5" fill="#4E8A3E"/><circle cx="196" cy="150" r="4" fill="#4E8A3E"/><circle cx="226" cy="136" r="6" fill="#4E8A3E"/><circle cx="252" cy="152" r="4" fill="#4E8A3E"/>'
            + '<circle cx="300" cy="120" r="29" fill="#5A9746"/><circle id="tm-goz-hedef" cx="300" cy="114" r="2" fill="none"/>'
            + '<g class="tm-goz"><circle cx="300" cy="114" r="17" fill="url(#tm-goz-g)"/><ellipse cx="300" cy="114" rx="4" ry="13" fill="#141414"/><circle cx="294" cy="108" r="3.5" fill="#fff"/></g>'
            + '<path class="tm-kapak" d="M282 114 Q300 127 318 114" stroke="#24481F" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>'
            + '<ellipse cx="96" cy="236" rx="46" ry="11" fill="#3E8F4A"/><ellipse cx="560" cy="262" rx="38" ry="9" fill="#3E8F4A"/>'
            + '<rect x="0" y="190" width="640" height="110" fill="url(#tm-su-g)"/>'
            + '<path class="tm-dalga" d="M40 204 q20 -6 40 0 t40 0 M380 214 q20 -6 40 0 t40 0 M520 200 q16 -5 32 0 t32 0" stroke="#7FD6C2" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>'
            + '<g class="tm-kabarcik"><circle cx="86" cy="186" r="5"/><circle cx="96" cy="186" r="3.5"/><circle cx="80" cy="186" r="2.5"/></g>'
            + '</svg>';
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function oyunIskelet() {
        let seg = ''; for (let i = MAX - 1; i >= 0; i--) seg += '<i data-s="' + i + '" style="--c:hsl(' + Math.round(130 - i * 13) + ' 75% 52%)"></i>';
        $('tm-icerik').innerHTML = '<div class="tm-oyun" id="tm-oyun"><div class="tm-ust">'
            + '<div class="tm-kova"><i id="tm-kova-ikon">🪣</i><div class="tm-kova-yazi"><small>KOVADAKİ BALIK</small><b><span id="tm-balik">0</span><em id="tm-hedef">/ 0</em></b></div><div class="tm-bar"><i id="tm-bar"></i><u id="tm-bar-yazi"></u></div></div>'
            + '<div class="tm-sayac"><small>ATTI</small><b id="tm-at">0 / 0</b><span id="tm-uyanma">😴 hiç uyanmadı</span></div></div>'
            + '<div class="tm-orta" id="tm-orta"><div class="tm-ay" aria-hidden="true"></div><div class="tm-sazlik" aria-hidden="true"></div>'
            + '<div class="tm-metre" id="tm-metre"><small>UYKU</small><div class="tm-metre-kap">' + seg + '</div><b id="tm-metre-yuz">😴</b></div>'
            + '<div class="tm-sahne-ic">' + timsahSVG() + '<span class="tm-zzz" aria-hidden="true"><b>z</b><b>z</b><b>Z</b></span></div>'
            + '<div class="tm-son" id="tm-son" aria-label="Son atışlar"></div>'
            + '<div class="tm-duyuru" id="tm-duyuru" aria-live="polite"></div><div class="tm-uyan" id="tm-uyan" aria-live="assertive"></div></div>'
            + '<div class="tm-cocuklar" id="tm-cocuklar"></div>'
            + '<div class="tm-yan" id="tm-yan"><div class="tm-yan-hedef" id="tm-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte iki balık bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div>'
            + '<div class="tm-yan-yazi"><small>SIRADA</small><b id="tm-yan-ad"></b><span id="tm-yan-esik"></span><span class="tm-yan-ses" id="tm-yan-ses"></span></div>'
            + '<div class="tm-arac"><button type="button" class="tm-kucuk" id="tm-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="tm-kucuk" id="tm-yeni-btn" aria-label="Yeni oyun">↻</button><button type="button" class="tm-kucuk genis" id="tm-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        $('tm-cocuklar')._imza = '';
    }
    function sayilarCiz(st) {
        const G = hedef(st), yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        yaz('tm-balik', Math.max(0, _gb)); yaz('tm-hedef', '/ ' + G);
        const bar = $('tm-bar'); if (bar) bar.style.width = Math.min(100, Math.max(0, _gb) / G * 100).toFixed(1) + '%';
        yaz('tm-bar-yazi', _gb >= G ? '🎉 HEDEF DOLDU' : '');
        const o = $('tm-orta'); if (!o) return;
        const s = Math.max(0, Math.min(MAX, _gs));
        o.querySelectorAll('.tm-metre-kap i').forEach((e) => e.classList.toggle('dolu', +e.dataset.s < s));
        yaz('tm-metre-yuz', s >= MAX ? '😡' : s >= GERGIN ? '😠' : s >= 4 ? '😪' : '😴');
        o.classList.toggle('gergin', s >= GERGIN && s < MAX);
        o.classList.toggle('gerilim', s >= GERGIN && s < MAX && ic('gerilim'));
    }
    function cocuklarCiz(st) {
        const l = liste(), ai = aktifIndeks(), kutu = $('tm-cocuklar'); if (!kutu) return;
        const sec = st.uyan ? st.uyan.secilen : [];
        const imza = l.map((s, i) => { const k = kimlik(s); return k + ':' + (st.atan[k] || 0) + ':' + (i === ai ? 1 : 0) + ':' + (sec.indexOf(k) >= 0 ? 1 : 0); }).join(',') + '|' + turSay();
        if (kutu._imza === imza) return; kutu._imza = imza;
        kutu.innerHTML = l.map((s, i) => { const k = kimlik(s), at = (st.atan[k] || 0) >= turSay(); return '<button type="button" class="tm-uye' + (at ? ' atti' : '') + (i === ai ? ' aktif' : '') + (sec.indexOf(k) >= 0 ? ' yakalandi' : '') + '" data-km-sporcu="' + i + '">' + esc(ilkAd(s.ad)) + '</button>'; }).join('');
        kutu.classList.toggle('sik', l.length > 16);
    }
    function sonCizListe(st) {
        const e = $('tm-son'); if (!e) return; const imza = JSON.stringify(st.son || []); if (e._i === imza) return; e._i = imza;
        e.innerHTML = (st.son || []).map((x) => '<div class="' + (x.s ? 'ses' : x.b ? 'sus' : '') + '"><span>' + esc(x.a) + '</span><em>' + (x.b ? '🐟'.repeat(Math.min(x.b, 6)) : '') + (x.s ? '🔊'.repeat(Math.min(x.s, 6)) : '') + (!x.b && !x.s ? '·' : '') + '</em></div>').join('');
    }
    function yanCiz(st) {
        const akt = liste()[aktifIndeks()], yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        if (akt) {
            const es = esikOf(ortalama(akt)), h = $('tm-yan-hedef'); if (h) h.setAttribute('data-esik', es);
            yaz('tm-yan-ad', buyuk(ilkAd(akt.ad)));
            yaz('tm-yan-esik', (es >= 9 ? 'Sarı' : es >= 7 ? 'Kırmızı ya da sarı' : 'Mavi ya da içi') + ' = 🐟🐟 · hedefe değen = 🐟');
            yaz('tm-yan-ses', 'Iska = 🔊🔊' + (es >= 9 ? ' · beyaz/siyah = 🔊' : es >= 7 ? ' · beyaz = 🔊' : ''));
        }
        const n = atabilenler().length, a = atanSay(st), bit = $('tm-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
        const u = $('tm-uyanma'); if (u) { const t = st.uyanma ? '🐊 ' + st.uyanma + ' kez uyandı' : '😴 hiç uyanmadı'; if (u.textContent !== t) u.textContent = t; }
        const at = $('tm-at'); if (at && at.textContent !== a + ' / ' + n) at.textContent = a + ' / ' + n;
    }
    function ciz(st) { sayilarCiz(st); cocuklarCiz(st); sonCizListe(st); yanCiz(st); }
    function guncelle() {
        const kok = $('tm-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son' && (_finalOynuyor || _kilit || _uyanAcik)) return;
        if (st.faz === 'son') return sonCiz(st);
        if (!$('tm-oyun')) oyunIskelet();
        if (!st.basladi && atabilenler().length) { st.basladi = true; kaydet(); }
        if (!_kilit) { _gb = st.balik; _gs = st.ses; }
        ciz(st);
        if (st.uyan && !_kilit && !_uyanAcik) uyanGoster(st, true);
    }
    function sonCiz(st) {
        uyanKapatSessiz();
        const kaz = !!st.kazandi, l = st.finalAdlar || [];
        const bas = kaz ? '🎉 BALIKLAR TOPLANDI!' : '🐊 TİMSAH BU SEFER DOYDU';
        const cumle = 'Hep birlikte <b>' + (st.balik || 0) + '</b> balık topladınız' + (st.uyanma ? ', timsah <b>' + st.uyanma + '</b> kez uyandı' + (st.gorev ? ', <b>' + st.gorev + '</b> ceza görevi yapıldı' : '') : ', timsah hiç uyanmadı') + '. '
            + (kaz ? 'Timsah hâlâ uyuyor. Bravo hepinize!' : 'Hedef ' + (st.G || 0) + ' balıktı. Rövanşta daha sessiz olalım!');
        $('tm-icerik').innerHTML = '<div class="tm-son-ekran' + (kaz ? ' kaz' : '') + '" id="tm-son-ekran"><span class="tm-et">Herkes attı' + (st.erken ? ' · erken bitti, atış başına bakıldı' : '') + '</span><h2>' + bas + '</h2><p class="tm-cumle">' + cumle + '</p>'
            + '<div class="tm-son-adlar"><small>BALIĞA ÇIKANLAR</small><div>' + l.map((a) => '<span>' + esc(a) + '</span>').join('') + '</div></div><button type="button" class="tm-buyuk" id="tm-yeni-son">Yeni oyun</button></div>';
    }
    function duyur(html, sinif) { const d = $('tm-duyuru'); if (!d) return; d.className = 'tm-duyuru ac ' + (sinif || ''); d.innerHTML = html; }
    function duyuruKapa() { const d = $('tm-duyuru'); if (d) d.className = 'tm-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; _finalOynuyor = false; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function kovaDol() { const e = $('tm-kova-ikon'); if (!e) return; e.classList.remove('dol'); void e.offsetWidth; e.classList.add('dol'); }
    function kipir(sinif) { const o = $('tm-orta'); if (!o) return; o.classList.remove(sinif); void o.offsetWidth; o.classList.add(sinif); }

    /* Uyanma: göz açılır, kükreme, balık kapılır; çark 1–3 kişi seçer; görev kartı. Sıradaki seri girilirse görev "yapıldı" sayılır. */
    function uyanGoster(st, sessiz) {
        const u = st.uyan, e = $('tm-uyan'), o = $('tm-orta'); if (!u || !e || !o) return;
        _uyanAcik = true; o.classList.add('uyandi'); _gs = MAX; sayilarCiz(st); cocuklarCiz(st);
        const g = GOREV[u.g % GOREV.length], adlar = u.secilen.map(adOf);
        const havuz = atabilenler().map((s) => adOf(kimlik(s)));
        e.innerHTML = '<div class="tm-uyan-kutu"><small>🐊 TİMSAH UYANDI!' + (u.kapti ? ' · ' + u.kapti + ' balık kaptı' : '') + '</small><b class="tm-uyan-bas">KİMİ YAKALAYACAK?</b>'
            + '<div class="tm-cark">' + adlar.map((a, i) => '<span class="tm-slot" data-i="' + i + '">' + esc(sessiz ? a : rastgele(havuz)) + '</span>').join('') + '</div>'
            + '<div class="tm-gorev" id="tm-gorev"' + (sessiz ? '' : ' hidden') + '><i>' + g[0] + '</i><b>' + g[1] + '</b><span>' + esc(g[2]) + '</span><p>Yaylar yerde · atış çizgisinin arkasında · sınıf alkışlasın!</p>'
            + '<div class="tm-gorev-alt"><em id="tm-gorev-sn">' + GOREV_SN + '</em><button type="button" id="tm-gorev-tamam">✓ Yaptık, timsah uyusun</button><button type="button" id="tm-gorev-gec">Geç</button></div></div></div>';
        e.classList.add('ac');
        const sayac = () => { let kalan = GOREV_SN; clearInterval(_gorevT); _gorevT = setInterval(() => { kalan--; const s = $('tm-gorev-sn'); if (s) s.textContent = Math.max(0, kalan); if (kalan <= 0) uyanKapat(true); }, 1000); };
        if (sessiz) { e.querySelectorAll('.tm-slot').forEach((x) => x.classList.add('dur')); sayac(); return; }
        const dur = [];
        e.querySelectorAll('.tm-slot').forEach((x, i) => {
            const t = setInterval(() => { x.textContent = rastgele(havuz); SES.tik(); }, 85); dur.push(t);
            sonra(() => { clearInterval(t); x.textContent = adlar[i]; x.classList.add('dur'); SES.yakala(); const m = merkezOf(x); if (m) patla(m.x, m.y, ['#7BE36B', '#FFD34D', '#FFFFFF'], 16); }, (azHareket() ? 200 : 1500) + i * 800);
        });
        sonra(() => { dur.forEach(clearInterval); const gg = $('tm-gorev'); if (gg) gg.hidden = false; const b = e.querySelector('.tm-uyan-bas'); if (b) b.textContent = adlar.length > 1 ? 'YAKALANANLAR GÖREV YAPSIN!' : 'YAKALANAN GÖREV YAPSIN!'; SES.duduk(); sayac(); }, (azHareket() ? 300 : 1700) + adlar.length * 800);
    }
    function uyanKapatSessiz() { clearInterval(_gorevT); _gorevT = 0; const e = $('tm-uyan'); if (e) { e.classList.remove('ac'); e.innerHTML = ''; } const o = $('tm-orta'); if (o) o.classList.remove('uyandi'); _uyanAcik = false; }
    function uyanKapat(yapildi, sessiz) {
        const st = durum(); uyanKapatSessiz();
        if (st.uyan) { if (yapildi) st.gorev = (st.gorev || 0) + 1; st.uyan = null; st.ses = 0; st.donem = {}; kaydet(); }
        _gs = st.ses; if (!_kilit) _gb = st.balik;
        if (st.faz === 'son') { if (sessiz) return; _kilit = true; finalSahne(st, () => { _kilit = false; sonCiz(st); }); return; }
        if (!sessiz) { SES.uyku(); duyur('<b>😴 TİMSAH YENİDEN UYUDU</b><small>Şşş… sessiz olun, balık toplamaya devam!</small>', 'iyi'); sonra(duyuruKapa, 1800); }
        if ($('tm-oyun')) ciz(st);
    }

    /* ---- seri ---- */
    function tmSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); if (durum().uyan || _uyanAcik) uyanKapat(true, true); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; }
        st.basladi = true;
        const key = kimlik(s), puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), es = esikOf(ortalama(s)), r = seriSonuc(puanlar, es);
        let olay = null; if (ic('sans') && Math.random() < OLAY_SANS) olay = Math.random() < .65 ? rastgele(OLAY_KOTU) : rastgele(OLAY_IYI);
        const b0 = st.balik, s0 = st.ses;
        st.balik += r.balik + ((olay && olay.balik) || 0);
        st.kb[key] = (st.kb[key] || 0) + r.balik;
        const sesHam = s0 + r.ses + (olay && olay.ses > 0 ? olay.ses : 0);
        const sesYeni = sesHam >= MAX ? MAX : Math.max(0, sesHam - (r.ninni ? 2 : 0) - (olay && olay.ses < 0 ? -olay.ses : 0)); // metre dolduysa ninni yetişmez
        st.donem[key] = (st.donem[key] || 0) + 1 + r.ses;
        st.atan[key] = (st.atan[key] || 0) + 1; st.seri = (st.seri || 0) + 1; st.ok = (st.ok || 0) + puanlar.length;
        st.son = [{ a: adOf(key), b: r.balik, s: r.ses }].concat(st.son || []).slice(0, 5);
        let uyan = null; if (sesYeni >= MAX) uyan = uyanKur(st);
        st.ses = sesYeni;
        const hedefYeni = !st.hedefAn && st.balik >= hedef(st); if (hedefYeni) st.hedefAn = true;
        const final = herkesAtti(st);
        if (final) bitir(st);
        kaydet();
        if (!panel()) return bit();
        if (!$('tm-oyun')) oyunIskelet();
        _gb = b0; _gs = s0; ciz(st);
        const adi = buyuk(ilkAd(s.ad)), chips = puanlar.map((p, j) => { const o = r.oklar[j], h = halka(p); return '<i class="tm-ok" style="--h:' + HALKA_RENK[h] + (h === 'beyaz' || h === 'sari' ? ';--hy:#151515' : '') + '"><s>' + (p === 10 && String((kaydedilecek[j] || {}).puan) === 'X' ? 'X' : p === 0 ? 'M' : p) + '</s>' + (o.b ? '🐟'.repeat(o.b) : o.s ? '🔊'.repeat(o.s) : '·') + '</i>'; }).join('');
        duyur('<span class="tm-d-ad">' + esc(adi) + '</span><span class="tm-d-ok">' + chips + '</span><b class="tm-d-top">' + (r.balik ? '+' + r.balik + ' 🐟' : 'BALIK YOK') + (r.ses ? ' · 🔊 +' + r.ses : '') + '</b>', r.ses ? 'kotu' : r.balik ? '' : 'sonuk');
        SES.ok();
        let t = 650; const adimT = azHareket() ? 150 : 480;
        r.oklar.forEach((o) => {
            sonra(() => {
                if (o.b) { for (let q = 0; q < o.b; q++) sonra(() => { uc('🐟', suXY(), kovaXY(), 'balik'); _gb++; sayilarCiz(st); kovaDol(); }, q * 150); SES.balik(); }
                else if (o.s) { _gs = Math.min(MAX, _gs + o.s); uc('🔊', suXY(), basXY(), 'ses'); sayilarCiz(st); kipir('kipir'); SES.ses(); }
                else SES.hic();
            }, t); t += adimT;
        });
        t += 300;
        const ozel = (html, sinif, ses, fn, sure) => { sonra(() => { duyur(html, sinif); ses && ses(); fn && fn(); }, t); t += sure || 1500; };
        if (olay) ozel('<b>' + olay.ikon + ' ' + olay.ad + '!</b><small>' + esc(olay.yaz) + (olay.ses > 0 ? ' · Şans işi, iyi atan da yakalanır.' : '') + '</small>', olay.ses > 0 ? 'kotu' : 'iyi', olay.ses > 0 ? SES.ses : SES.olay, () => {
            if (olay.balik) { for (let q = 0; q < olay.balik; q++) sonra(() => { uc('🐟', suXY(), kovaXY(), 'balik'); _gb++; sayilarCiz(st); }, q * 140); }
            if (olay.ses) { _gs = Math.max(0, Math.min(MAX, _gs + olay.ses)); if (olay.ses > 0) kipir('kipir'); sayilarCiz(st); }
        }, 1900);
        if (r.ninni && !uyan) ozel('<b>🎵 TAM SERİ: NİNNİ!</b><small>Üç ok da kendi hedefinde. Uyku metresi −2</small>', 'iyi', SES.ninni, () => { _gs = st.ses; sayilarCiz(st); }, 1800);
        if (hedefYeni && !final) ozel('<b>🎉 HEDEF DOLDU!</b><small>Herkes atana kadar devam: fazla balıklar da sayılır. Timsahı uyandırmayın!</small>', 'iyi', SES.zafer, () => { const m = kovaXY(); if (m) patla(m.x, m.y, ['#FFD34D', '#7BE36B', '#FFFFFF'], 30); }, 2000);
        if (!uyan && st.ses >= GERGIN && ic('gerilim')) sonra(() => SES.kalp(), t);
        if (uyan) {
            sonra(() => { duyur('<b>👁️ …</b><small>Timsahın gözü açılıyor…</small>', 'kotu'); _gs = MAX; sayilarCiz(st); const o = $('tm-orta'); if (o) o.classList.add('gergin'); if (ic('gerilim')) SES.kalp(); }, t); t += azHareket() ? 300 : 1500;
            sonra(() => {
                duyur('<b class="tm-kukre">HAAAAP! 🐊 TİMSAH UYANDI!</b>' + (uyan.kapti ? '<small>Kovadan ' + uyan.kapti + ' balık kaptı!</small>' : ''), 'kotu');
                const o = $('tm-orta'); if (o) o.classList.add('uyandi'); SES.kukreme();
                for (let q = 0; q < Math.min(uyan.kapti, 8); q++) sonra(() => { uc('🐟', kovaXY(), basXY(), 'kapti'); }, q * 110);
                _gb = st.balik; sayilarCiz(st);
            }, t); t += azHareket() ? 300 : 2000;
            sonra(() => { duyuruKapa(); uyanGoster(st); _kilit = false; try { done(); } catch (e) { } cocuklarCiz(st); yanCiz(st); }, t);
            return;
        }
        sonra(() => {
            duyuruKapa(); _gb = st.balik; _gs = st.ses; ciz(st);
            if (final) { _kilit = true; finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } }); return; }
            bit();
        }, t);
    }
    function finalSahne(st, sonrasi) {
        _finalOynuyor = true; SES.zafer(); const kaz = !!st.kazandi;
        duyur('<b>HERKES ATTI! ' + (kaz ? '🎉 ' + st.balik + ' BALIK, TİMSAH UYUYOR!' : '🐊 TİMSAH BU SEFER DOYDU') + '</b>', kaz ? 'iyi' : 'kotu');
        if (kaz) [0, 300, 600].forEach((d) => sonra(() => { const m = kovaXY(); if (m) patla(m.x + (Math.random() - .5) * 200, m.y + 40, ['#FFD34D', '#7BE36B', '#FFFFFF', '#7CCBFF'], 40); }, d));
        sonra(() => { duyuruKapa(); _finalOynuyor = false; sonrasi(); }, azHareket() ? 400 : 2600);
    }
    function tmFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; uyanKapat(true, true); bitir(s, atanSay(s) < atabilenler().length); kaydet(); zamanTemizle(); _kilit = true; finalSahne(s, () => { _kilit = false; guncelle(); }); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Oyun şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Toplanan balık, atılan seri sayısına göre hedefle karşılaştırılır; herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Dev timsah uyuyor. Bütün sınıf, onu <b>uyandırmadan</b> kovaya balık toplar.<br>Ok çocuğun kendi seviyesine göre: <b>kendi hedefi</b> 🐟🐟, hedefe değen 🐟, <b>ıska</b> 🔊🔊 (seviyesinin çok altındaki ok 🔊).<br>'
            + '3 ok da kendi hedefindeyse 🎵 ninni: uyku metresi −2. Şans olayları: 🦆 ördek, 🪵 dal, 🤧 hapşırık metreyi doldurur; 🌙 ay ve 🐟 balık sürüsü yardım eder (iyi atana da kötü atana da çıkar).<br>'
            + '<b>Metre dolunca</b> timsah uyanır, kovadan balık kapar; çark o arada atanlardan 1–3 kişi seçer, onlar atış çizgisinin arkasında (yaylar yerde) görev yapar ve timsah yeniden uyur.<br>Sonuç herkes atınca belli olur.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); uyanKapatSessiz(); _kilit = false; _st = yeniOyun(); kaydet(); _gb = 0; _gs = 0; $('tm-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni oyun başlasın mı?<br><small>Kova boşalır, timsah yeniden uyur. Sporcu serileri silinmez.</small>', f, 'Yeni oyun', 'Vazgeç'); else f();
    }
    function tmSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _uyanAcik = false; clearInterval(_gorevT);
        p.innerHTML = '<div class="tm-sahne"><div id="tm-icerik"></div><canvas id="tm-efekt" aria-hidden="true"></canvas></div>'; _fx = [];
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'tm-nasil') nasil(); else if (t.id === 'tm-yeni-btn' || t.id === 'tm-yeni-son') yeniSor(); else if (t.id === 'tm-bitir') tmFinalZorla();
            else if (t.id === 'tm-gorev-tamam') uyanKapat(true); else if (t.id === 'tm-gorev-gec') uyanKapat(false);
        };
        guncelle();
    }
    function css() {
        if ($('tm-css')) return; const st = document.createElement('style'); st.id = 'tm-css';
        st.textContent = '.km-oyun-panel-timsah{padding:0;background:#071A1C;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.tm-sahne{position:absolute;inset:0;color:#F2FAF4;overflow:hidden;background:radial-gradient(120% 90% at 70% -10%,#1E4A55 0%,#0E2A30 50%,#06151A 100%)}'
            + '#tm-efekt{position:absolute;left:0;top:0;width:100%;height:100%;z-index:12;pointer-events:none;display:block;max-width:none}'
            + '#tm-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.tm-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:8px;min-height:0}'
            + '.tm-ust{flex:none;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}'
            + '.tm-kova{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;gap:2px 10px;align-items:center;padding:6px 12px;border-radius:14px;background:rgba(4,14,16,.75);border:1px solid rgba(123,227,107,.35)}'
            + '.tm-kova>i{grid-row:1 / 3;font-style:normal;font-size:38px;line-height:1;display:inline-block}.tm-kova-yazi small,.tm-sayac small{font-size:11px;font-weight:800;letter-spacing:.08em;color:#9CC7B8}'
            + '.tm-kova-yazi b{display:block;font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(30px,3.6vw,46px);font-weight:800;line-height:.95;color:#7BE36B;font-variant-numeric:tabular-nums}.tm-kova-yazi em{font-style:normal;font-size:.55em;color:#9CC7B8;margin-left:4px}'
            + '.tm-bar{position:relative;height:14px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}.tm-bar i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:linear-gradient(90deg,#3FBF7F,#B9F26B);transition:width .25s}.tm-bar u{position:absolute;inset:0;display:grid;place-items:center;text-decoration:none;font-size:10px;font-weight:900;color:#0B2410}'
            + '.tm-sayac{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 14px;border-radius:14px;background:rgba(4,14,16,.75);line-height:1.05}.tm-sayac b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(24px,2.8vw,34px);font-weight:800;font-variant-numeric:tabular-nums}.tm-sayac span{font-size:12px;font-weight:800;color:#C9E4D8;white-space:nowrap}'
            + '.tm-orta{flex:1;min-height:170px;position:relative;border-radius:18px;overflow:hidden;background:linear-gradient(#0B2A31 0%,#0E3438 58%,#0B2622 100%);display:grid;grid-template-columns:auto minmax(0,1fr);border:1px solid rgba(255,255,255,.08)}'
            + '.tm-ay{position:absolute;right:7%;top:8%;width:clamp(34px,6vw,70px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 40%,#FFF8D6,#E8D58A);box-shadow:0 0 40px rgba(255,240,180,.45);opacity:.85}'
            + '.tm-sazlik{position:absolute;inset:auto 0 0 0;height:60%;pointer-events:none;background:repeating-linear-gradient(95deg,transparent 0 22px,rgba(40,90,50,.55) 22px 25px,transparent 25px 61px),repeating-linear-gradient(84deg,transparent 0 37px,rgba(30,70,40,.5) 37px 40px,transparent 40px 90px);-webkit-mask:linear-gradient(transparent,#000 60%);mask:linear-gradient(transparent,#000 60%);opacity:.6}'
            + '.tm-metre{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;background:rgba(4,14,16,.55)}.tm-metre small{font-size:11px;font-weight:900;letter-spacing:.1em;color:#C9E4D8}.tm-metre b{font-size:30px;line-height:1}'
            + '.tm-metre-kap{flex:1;display:flex;flex-direction:column;gap:3px;width:clamp(26px,3vw,40px);min-height:80px}.tm-metre-kap i{flex:1;border-radius:5px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);transition:background .2s,box-shadow .2s}.tm-metre-kap i.dolu{background:var(--c);box-shadow:0 0 10px var(--c)}'
            + '.tm-sahne-ic{position:relative;min-width:0;display:flex;align-items:flex-end;justify-content:center}.tm-timsah{display:block;width:100%;height:100%;max-height:100%;overflow:visible}'
            + '.tm-ust-cene{transform-origin:338px 176px;transition:transform .35s cubic-bezier(.3,1.6,.5,1)}.tm-goz{transform-origin:300px 114px;transform:scaleY(.06);transition:transform .9s ease}.tm-kapak{transition:opacity .4s}.tm-agiz-ic,.tm-alt-dis{opacity:0;transition:opacity .2s}'
            + '.tm-orta.gergin .tm-goz{transform:scaleY(.45)}.tm-orta.gergin .tm-kapak,.tm-orta.uyandi .tm-kapak{opacity:0}.tm-orta.uyandi .tm-goz{transform:scaleY(1);transition-duration:.25s}.tm-orta.uyandi .tm-ust-cene{transform:rotate(16deg)}.tm-orta.uyandi .tm-agiz-ic,.tm-orta.uyandi .tm-alt-dis{opacity:1}'
            + '.tm-kabarcik circle{fill:rgba(190,240,230,.7)}.tm-orta.gergin .tm-kabarcik,.tm-orta.uyandi .tm-kabarcik,.tm-orta.gergin .tm-zzz,.tm-orta.uyandi .tm-zzz{display:none}'
            + '.tm-zzz{position:absolute;left:44%;top:6%;display:flex;gap:6px;font-family:"Barlow Condensed",sans-serif;font-weight:800;color:#CFEFFF;pointer-events:none}.tm-zzz b{font-size:clamp(22px,3vw,40px);opacity:0}'
            + '.tm-orta:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 0 rgba(255,40,60,0);transition:box-shadow .4s}.tm-orta.gerilim:after{box-shadow:inset 0 0 90px rgba(255,40,60,.55)}.tm-orta.uyandi:after{box-shadow:inset 0 0 140px rgba(255,30,50,.8)}'
            + '.tm-son{position:absolute;right:8px;bottom:8px;z-index:5;display:flex;flex-direction:column;gap:3px;max-width:44%}.tm-son div{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:2px 8px;border-radius:8px;background:rgba(4,14,16,.72);font-size:clamp(12px,1.2vw,15px);font-weight:800}.tm-son div span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tm-son em{font-style:normal;white-space:nowrap;font-size:.9em}.tm-son .ses{color:#FFB3BE}.tm-son .sus{color:#B6F7C8}.tm-son div:nth-child(n+4){opacity:.6}'
            + '.tm-uc{position:absolute;z-index:11;font-size:clamp(24px,2.6vw,36px);line-height:1;transform:translate(-50%,-50%);transition:transform .75s cubic-bezier(.4,-.3,.5,1),opacity .75s;pointer-events:none;margin:-.5em 0 0 -.5em}.tm-uc.ses{transition-timing-function:ease-out}.tm-uc.kapti{filter:drop-shadow(0 0 6px #FF3B5C)}'
            + '.tm-duyuru{position:absolute;left:50%;top:8px;z-index:8;transform:translate(-50%,-8px) scale(.96);width:max-content;max-width:94%;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;text-align:center;padding:8px 14px;border-radius:14px;background:rgba(3,12,14,.93);border:1px solid rgba(255,255,255,.14);opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}.tm-duyuru.ac{opacity:1;transform:translate(-50%,0)}'
            + '.tm-duyuru b,.tm-d-ad{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(24px,3vw,40px);line-height:1}.tm-d-ad{color:#FFD34D}.tm-duyuru.iyi b{color:#B9F26B}.tm-duyuru.kotu b{color:#FF8FA0}.tm-duyuru.sonuk .tm-d-top{color:#9CC7B8}.tm-duyuru small{flex-basis:100%;font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#E2F2EA}'
            + '.tm-d-ok{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.tm-ok{display:flex;align-items:center;gap:3px;font-style:normal;font-size:clamp(18px,2vw,24px)}.tm-ok s{text-decoration:none;display:grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;background:var(--h);color:var(--hy,#fff);font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:.8em;border:2px solid rgba(255,255,255,.6)}.tm-d-top{color:#7BE36B}'
            + '.tm-uyan{position:absolute;inset:0;z-index:9;display:grid;place-items:center end;padding:8px;box-sizing:border-box;pointer-events:none;opacity:0;transition:opacity .2s}.tm-uyan.ac{opacity:1;pointer-events:auto;background:rgba(40,0,8,.45)}'
            + '.tm-uyan-kutu{box-sizing:border-box;width:min(440px,66%);max-height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:10px 14px;border-radius:20px;background:#140A0E;border:3px solid #FF4D63;box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 40px rgba(255,60,80,.45)}'
            + '.tm-uyan-kutu>small{font-size:13px;font-weight:900;letter-spacing:.08em;color:#FF8FA0}.tm-uyan-bas{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(22px,2.7vw,34px);font-weight:800;line-height:1;color:#fff}'
            + '.tm-cark{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.tm-slot{min-width:5em;padding:4px 12px;border-radius:12px;background:#2A1218;border:2px dashed #FF8FA0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(22px,2.6vw,34px);line-height:1.05;color:#FFD3DA}.tm-slot.dur{background:#FFD34D;color:#2A1300;border:2px solid #fff}'
            + '.tm-gorev{display:grid;grid-template-columns:auto minmax(0,1fr);gap:0 10px;align-items:center;text-align:left}.tm-gorev[hidden]{display:none}.tm-gorev>i{grid-row:1 / 3;font-style:normal;font-size:clamp(36px,4.4vw,54px);line-height:1}.tm-gorev>p,.tm-gorev-alt{grid-column:1 / -1;text-align:center;justify-content:center}.tm-gorev>b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(22px,2.7vw,34px);font-weight:800;color:#B9F26B;line-height:1}.tm-gorev>span{font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#F2E6E8}.tm-gorev>p{margin:2px 0 0;font-size:13px;font-weight:700;color:#FFB199}'
            + '.tm-gorev-alt{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;align-items:center;margin-top:4px}.tm-gorev-alt em{font-style:normal;font-family:"Barlow Condensed",sans-serif;font-size:34px;font-weight:800;min-width:50px;color:#FFD34D}.tm-gorev-alt button{min-height:48px;padding:0 18px;border-radius:24px;border:0;font:inherit;font-weight:800;font-size:16px;cursor:pointer;background:#7BE36B;color:#0B2410}.tm-gorev-alt button+button{background:#2A1218;color:#F2FAF4;border:1px solid rgba(255,255,255,.2)}'
            + '.tm-cocuklar{flex:none;display:flex;flex-wrap:wrap;gap:4px}.tm-uye{min-height:32px;padding:2px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#F2FAF4;font:inherit;font-size:clamp(13px,1.3vw,16px);font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px}.tm-uye.atti:after{content:"✓";color:#7BE36B;font-weight:900}.tm-uye.aktif{background:#FFD34D;color:#2A1300;border-color:#FFD34D}.tm-uye.aktif.atti:after{color:#2A1300}.tm-uye.yakalandi{border-color:#FF4D63;box-shadow:0 0 0 2px #FF4D63}.tm-uye.yakalandi:before{content:"🐊"}'
            + '.tm-cocuklar.sik .tm-uye{min-height:26px;padding:1px 7px;font-size:12.5px;border-radius:7px}'
            + '.tm-yan{position:absolute;z-index:7;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(4,14,16,.82);border-left:5px solid #7BE36B;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.tm-yan-hedef{flex:none;width:96px}.tm-yan-hedef svg{display:block;width:100%}.tm-yan-hedef .m{fill:#2F7FD6}.tm-yan-hedef .k{fill:#E23B2E}.tm-yan-hedef .s{fill:#F5D32A}.tm-yan-hedef[data-esik="7"] .m,.tm-yan-hedef[data-esik="9"] .m,.tm-yan-hedef[data-esik="9"] .k{fill:#33424A}'
            + '.tm-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.tm-yan-yazi small{font-size:12px;font-weight:800;letter-spacing:.08em;color:#9CC7B8}.tm-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;line-height:1;color:#FFD34D;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tm-yan-yazi>span{font-size:clamp(14px,1.4vw,17px);font-weight:800;line-height:1.25}.tm-yan-yazi .tm-yan-ses{color:#FFB3BE}'
            + '.tm-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.tm-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.2);background:#173A3E;color:#F2FAF4;font:inherit;font-weight:800;cursor:pointer}.tm-kucuk[hidden]{display:none}.tm-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.tm-son-ekran{height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;padding:14px 18px;border-radius:18px;background:rgba(4,14,16,.85);border:2px solid rgba(255,77,99,.5)}.tm-son-ekran.kaz{border-color:#7BE36B;box-shadow:0 0 40px rgba(123,227,107,.25)}.tm-et{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9CC7B8}'
            + '.tm-son-ekran h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(40px,5.6vw,76px);line-height:.95;color:#FF8FA0}.tm-son-ekran.kaz h2{color:#B9F26B}.tm-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#E2F2EA}.tm-cumle b{color:#FFD34D}'
            + '.tm-son-adlar small{display:block;font-size:12px;font-weight:900;letter-spacing:.1em;color:#9CC7B8;margin-bottom:6px}.tm-son-adlar div{display:flex;flex-wrap:wrap;gap:6px}.tm-son-adlar span{padding:5px 12px;border-radius:10px;background:rgba(123,227,107,.14);border:1px solid rgba(123,227,107,.4);font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(18px,2vw,24px)}'
            + '.tm-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#7BE36B;color:#0B2410;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.tm-sahne button:focus-visible{outline:3px solid #FFD34D;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.tm-govde{animation:tm-nefes 3.2s ease-in-out infinite}.tm-zzz b{animation:tm-z 3s ease-out infinite}.tm-zzz b:nth-child(2){animation-delay:.6s}.tm-zzz b:nth-child(3){animation-delay:1.2s}.tm-kabarcik{animation:tm-kab 2.6s ease-in infinite}.tm-dalga{animation:tm-dal 4s ease-in-out infinite}'
            + '.tm-orta.kipir .tm-govde{animation:tm-kipir .4s ease}.tm-orta.uyandi .tm-timsah{animation:tm-salla .11s linear 8}.tm-orta.gerilim:after{animation:tm-nabiz .9s ease-in-out infinite}.tm-kova>i.dol{animation:tm-pop .3s ease}'
            + '.tm-uyan.ac .tm-uyan-kutu{animation:tm-kart .5s cubic-bezier(.3,1.5,.5,1)}.tm-slot.dur{animation:tm-pop .35s cubic-bezier(.3,1.6,.5,1)}.tm-uye.aktif{animation:tm-nb 1.2s ease-in-out infinite}.tm-kukre{animation:tm-salla .12s linear 6;display:inline-block}'
            + '@keyframes tm-nefes{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}@keyframes tm-z{0%{opacity:0;transform:translate(0,14px) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translate(18px,-26px) scale(1.2)}}@keyframes tm-kab{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-40px);opacity:0}}@keyframes tm-dal{50%{transform:translateX(14px)}}'
            + '@keyframes tm-kipir{30%{transform:translate(-4px,-6px) rotate(-1deg)}60%{transform:translate(3px,2px)}}@keyframes tm-salla{25%{transform:translate(-6px,2px)}75%{transform:translate(6px,-2px)}}@keyframes tm-nabiz{50%{box-shadow:inset 0 0 130px rgba(255,40,60,.75)}}'
            + '@keyframes tm-kart{0%{transform:scale(.6) rotate(-4deg)}100%{transform:none}}@keyframes tm-pop{0%{transform:scale(1.5)}100%{transform:none}}@keyframes tm-nb{50%{transform:scale(1.05)}}}'
            + '@media(max-width:860px){.tm-uyan{place-items:center}.tm-uyan-kutu{width:min(440px,96%)}#tm-icerik{padding:8px}.tm-oyun{overflow-y:auto}.tm-orta{flex:none;height:min(40vh,270px);min-height:200px}.tm-metre-kap{width:22px}.tm-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.tm-yan-hedef{width:48px}.tm-yan-yazi b{font-size:26px}.tm-yan-yazi>span{font-size:13px}.tm-arac{width:auto}.tm-son{max-width:55%}.tm-kova>i{font-size:28px}}';
        document.head.appendChild(st);
    }
    window.tmSahneKur = tmSahneKur;
    window.tmGuncelle = guncelle;
    window.tmSeri = tmSeri;
    window.tmAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.tmGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); uyanKapatSessiz(); _kilit = false; _st = k; _kn = konum(); kaydet(); _gb = k.balik || 0; _gs = k.ses || 0; if ($('tm-icerik')) { if (k.faz === 'oyun' && !$('tm-oyun')) $('tm-icerik').innerHTML = ''; guncelle(); } };
    window.tmSporcu = (g, ad) => (durum().kb || {})[g + '|' + ad] || 0;
    window.tmAyarUygula = () => { if ($('tm-icerik')) guncelle(); };
    window.tmFinalZorla = tmFinalZorla;
    window.tmDurum = durum;
    window._tmIc = { esikOf, okSonuc, seriSonuc, agirlikliSec, secimSayisi, hedefBalik, kapmaOf, MAX, GERGIN, GOREV };
})();
