/* ================================================================================================
   🐠 SINIF AKVARYUMU — Karışık Sınıf › Oyunlar teması 'akvaryum' (2026-10-28).
   Kullanıcı yeni oyun önerileri arasından (tarayıcı taslağı) "Sınıf Akvaryumu"nu seçti. Ortak, sakin bir sınıf oyunu.
   OYUN: Her ok, atan çocuğun yerinden suya düşen bir damla olur; düştüğü yerde bir deniz canlısı doğar. Halka canlıyı seçer:
     Iska → yalnız kabarcık · 1-4 küçük balık · 5-6 renkli balık / yengeç / karides · 7-8 kaplumbağa / ahtapot / kalamar
     9 → yunus / balon balığı · 10 ve X → NADİR (balina, köpekbalığı, dev balina) — X ×1,5 doluluk.
   Canlıların toplam değeri akvaryumu doldurur; %100'de "AKVARYUM DOLDU!" töreni (son oku atan kahraman, en çok canlı getiren,
   nadir bulanlar), canlılar yüzerek ayrılır ve sıradaki akvaryum gelir (5 farklı akvaryum: mercan / derin / buz / batık / lagün).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Gerçek seri app.js'te _skorKaydetCekirdek ile yazılır; bu dosya yalnız
   oyun durumunu ve çizimi yönetir:
     akvSahneKur(panel) · akvGuncelle() · akvSeri(s, i, kaydedilecek, done) · akvAnlik() · akvGeriYukle(kopya) · akvSporcuCanli(g, ad)
   DURUM 'dag_km_akvaryum_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL (Kule/Canavar/Hapşırık ilkesi):
     { tarih, no, tip, gerekli, dolu, canlilar[{e,k,b,x,y,n,yer}], katki{'g|ad':adet}, nadir{'g|ad':adet}, dolanlar[{tip,ad,g}], seri }
   Rozet: sp.oyun.akvaryum = { doldurdu, nadir }.
   Emoji yalnız eski (Unicode ≤10) olanlar — yeni emojiler eski tablet/Windows'ta kare görünüyordu (🪸 🪼 🦭 kullanılmaz).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function hash(m) { let h = 2166136261; for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }

    /* ---------------- SES (WebAudio sentezi, dosya yok; cihaza özel aç/kapa) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_akv_ses') !== '0'; } catch (e) { return true; } }
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function ton(f1, f2, dur, tip, vol, gec) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tip || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .15, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
    }
    function hisirti(dur, f1, f2, vol, gec, q) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const s = a.createBufferSource(); s.buffer = buf; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1;
        f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2 || f1, t + dur);
        const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .1, t + dur * .15); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .05);
    }
    const SES = {
        damla() { ton(900, 1500, .12, 'sine', .07); },
        blup() { ton(300, 700, .14, 'sine', .12); ton(420, 900, .1, 'sine', .08, .12); },
        sicra() { hisirti(.35, 2400, 600, .08, 0, .8); },
        canli(b) { const f = [660, 587, 494, 392][Math.min(3, b)]; [1, 1.26, 1.5].forEach((k, i) => ton(f * k, f * k, .16, 'triangle', .07, i * .07)); },
        nadir() { [784, 988, 1175, 1568, 1976].forEach((f, i) => ton(f, f * 1.01, .25, 'sine', .1, i * .08)); },
        fanfar() { [523, 659, 784, 1046].forEach((f, i) => ton(f, f, .3, 'triangle', .13, i * .13)); ton(1046, 1046, .6, 'triangle', .12, .55); },
        geldi() { [392, 494, 587].forEach((f, i) => ton(f, f, .2, 'triangle', .08, i * .12)); }
    };

    /* ---------------- CANLILAR — boy 0 küçük … 4 nadir. yer:'kum' olanlar dipte yürür, diğerleri yüzer. ---------------- */
    const CANLI = [
        [{ e: '🐟', ad: 'Küçük balık' }],
        [{ e: '🐠', ad: 'Renkli balık' }, { e: '🐠', ad: 'Renkli balık' }, { e: '🦀', ad: 'Yengeç', yer: 'kum' }, { e: '🦐', ad: 'Karides', yer: 'kum' }],
        [{ e: '🐢', ad: 'Kaplumbağa' }, { e: '🐙', ad: 'Ahtapot' }, { e: '🦑', ad: 'Kalamar' }],
        [{ e: '🐬', ad: 'Yunus' }, { e: '🐡', ad: 'Balon balığı' }],
        [{ e: '🐋', ad: 'Balina' }, { e: '🦈', ad: 'Köpekbalığı' }, { e: '🐳', ad: 'Dev balina' }]
    ];
    const BOY_PUNTO = [30, 40, 50, 60, 84];
    function boyHesapla(v) { if (v === 'M' || v === '0') return -1; const d = okDeger(v); return d >= 10 ? 4 : d === 9 ? 3 : d >= 7 ? 2 : d >= 5 ? 1 : 0; }
    function deger(v) { const b = boyHesapla(v); if (b < 0) return 0; return [4, 6, 9, 12, 15][b] * (String(v) === 'X' ? 1.5 : 1); }

    /* ---------------- AKVARYUMLAR — her biri ayrı renk + dekor (aynı akvaryum boyanmış hali değil) ---------------- */
    function yosun(x, h, renk, gec) { return `<path class="akv-yosun" style="animation-delay:${gec}s;transform-origin:${x}px 505px" d="M${x} 505 q-14 -${h * .3} 4 -${h * .55} q16 -${h * .2} -2 -${h * .45}" fill="none" stroke="${renk}" stroke-width="9" stroke-linecap="round"/>`; }
    function mercan(x, renk, k) {
        k = k || 1; return `<g transform="translate(${x} 505) scale(${k})" fill="none" stroke="${renk}" stroke-width="10" stroke-linecap="round"><path d="M0 0 V-60 M0 -30 L-26 -58 M0 -42 L22 -72 M-26 -58 V-80 M22 -72 L34 -90"/></g>`;
    }
    const A = {
        mercan: {
            ad: 'Mercan Bahçesi', ikon: '🐠', su: ['#1ea0c8', '#0f5f8f', '#0b3b63'], kum: ['#d9b77a', '#c9a066'],
            dekor() { return mercan(420, '#ff7f9e', 1.1) + mercan(905, '#ffb36b', .9) + mercan(640, '#c9a6ff', .7) + yosun(500, 150, '#4fbf7a', 0) + yosun(770, 190, '#3fae6a', .8) + yosun(960, 130, '#4fbf7a', 1.5) + '<text x="700" y="512" font-size="30">🐚</text>'; }
        },
        derin: {
            ad: 'Derin Deniz', ikon: '🌌', su: ['#163a6b', '#0a1a3a', '#050b1c'], kum: ['#3b3a4a', '#2c2b38'],
            dekor() {
                let x = ''; for (let i = 0; i < 26; i++) { const h = hash('derin' + i); x += `<circle class="akv-isil" style="animation-delay:${(h % 30) / 10}s" cx="${340 + h % 650}" cy="${80 + (h >> 8) % 400}" r="${1.5 + (h >> 4) % 3}" fill="#9ff3ff"/>`; }
                return x + '<path d="M360 505 l40 -90 l30 60 l26 -40 l34 70Z M820 505 l36 -120 l40 90 l30 -50 l30 80Z" fill="#1d2235"/>' + yosun(600, 120, '#2d6a6a', .4) + yosun(760, 90, '#2d6a6a', 1.2);
            }
        },
        buz: {
            ad: 'Buz Denizi', ikon: '❄️', su: ['#bfe8ff', '#5aa9d6', '#1f5f8f'], kum: ['#e9f3f8', '#cfe2ee'],
            dekor() { return '<path d="M380 0 L420 0 L450 70 L400 130 L360 60Z M600 0 L700 0 L690 90 L640 150 L590 80Z M880 0 L1000 0 L1000 60 L940 120 L900 70Z" fill="#f2fbff" opacity=".85"/><path d="M420 505 l50 -70 l40 70Z M840 505 l30 -50 l40 50Z" fill="#ffffff" opacity=".8"/>' + yosun(560, 110, '#6fb8a8', .6); }
        },
        batik: {
            ad: 'Batık Gemi', ikon: '⚓', su: ['#2f8f8a', '#17565c', '#0c2e36'], kum: ['#b39b6a', '#9c8458'],
            dekor() { return '<g opacity=".85"><path d="M560 505 L600 420 L880 420 L930 505Z" fill="#4a3424"/><rect x="700" y="300" width="12" height="122" fill="#3a2818" transform="rotate(12 706 420)"/><path d="M712 310 L790 360 L716 380Z" fill="#cfc4a8" opacity=".55" transform="rotate(12 706 420)"/><circle cx="660" cy="455" r="12" fill="#1a1410"/><circle cx="740" cy="455" r="12" fill="#1a1410"/><circle cx="820" cy="455" r="12" fill="#1a1410"/></g><text x="430" y="508" font-size="40">⚓</text>' + yosun(500, 160, '#3c9a5c', 0) + yosun(960, 170, '#3c9a5c', 1); }
        },
        lagun: {
            ad: 'Ay Işığı Lagünü', ikon: '🌙', su: ['#5b4b9c', '#2e2563', '#171238'], kum: ['#8a7aa8', '#73648f'],
            dekor() { return '<ellipse cx="760" cy="30" rx="120" ry="16" fill="#fff6c9" opacity=".35"/><path d="M700 30 L640 505 L880 505 L820 30Z" fill="#fff6c9" opacity=".07"/>' + mercan(430, '#ff9fd0', 1) + mercan(930, '#9fe7ff', .9) + yosun(560, 140, '#6a5fb0', .3) + yosun(860, 120, '#6a5fb0', 1.1) + '<text x="620" y="512" font-size="28">🐚</text>'; }
        }
    };
    const TIPLER = ['mercan', 'derin', 'buz', 'batik', 'lagun'];
    function tipSec(no, tarih) {
        const t = TIPLER.slice(); let h = hash(tarih + '|akv');
        for (let i = t.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; const j = h % (i + 1); [t[i], t[j]] = [t[j], t[i]]; }
        return t[no % t.length];
    }
    function akvAdi(st) { const tur = Math.floor(st.no / TIPLER.length); return A[st.tip].ad + (tur ? ' ' + ['', 'II', 'III', 'IV', 'V'][Math.min(4, tur)] : ''); }

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_akvaryum_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    // Gereken doluluk: sınıftaki her çocuktan ~1 seri (Hapşırık ölçüsü; ok ortalaması Canavar'la aynı). Her sonraki akvaryum
    // %15 daha büyük. Oyun Ayarları › Akvaryum seviyesi (akvaryumSeri, kişi başı seri; standart 1) bunu çarpar.
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.akvaryumSeri > 0) ? a.akvaryumSeri : 1; } catch (e) { return 1; } }
    function gerekliHesapla(no) {
        let top = 0; const k = seviye();
        liste().forEach((s) => { let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { } top += 3 * (o * 1.25); });
        return Math.round(Math.max(50 * k, top * k) * (1 + .15 * no));
    }
    function yeniAkvaryum(st, no) { st.no = no; st.tip = tipSec(no, st.tarih); st.gerekli = gerekliHesapla(no); st.dolu = 0; st.canlilar = []; }
    function durum() {
        // Her okumada depodan bakılır: km-ortak başka cihazın yazdığını getirmiş olabilir (değişmediyse ayrıştırılmaz).
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !A[_st.tip]) { _st = { tarih: bugun(), dolanlar: [], katki: {}, nadir: {}, seri: 0 }; yeniAkvaryum(_st, 0); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.akvaryum = o.akvaryum || {}; o.akvaryum[alan] = (o.akvaryum[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }
    // Canlının akvaryumdaki yeri (sahne birimi). Yüzenler sağdaki su alanında, kumdakiler dipte.
    function yerSec(c, b) {
        if (c.yer === 'kum') return { x: 380 + Math.random() * 580, y: 500 };
        const p = BOY_PUNTO[b] / 2; return { x: 360 + p + Math.random() * (600 - p * 2), y: 110 + p + Math.random() * (340 - p * 2) };
    }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-akvaryum'); }
    // Çocuklar sol alttaki seyir terasında (Hapşırık'ın tepesiyle aynı yer; skor kutusu varsayılan olarak solda)
    function cocukXY(i) { const satir = Math.floor(i / 6), sutun = i % 6; return { x: 34 + sutun * 50 + (satir % 2) * 25, y: 205 - satir * 50 }; }
    // (konum transform özniteliği dış g'de; dans/ayrılış CSS transform'u iç .akv-govde'de — CSS transform özniteliği ezerdi)
    function canliSVG(c, yeni) {
        const fs = BOY_PUNTO[c.b], kum = c.yer === 'kum', h = hash(c.e + c.x + '|' + c.y), dx = -(50 + h % 160), t = 7 + (h >> 5) % 7;
        const renk = c.r || '#fff';
        return `<g class="akv-canli${yeni ? ' akv-gir' : ''}${c.n ? ' akv-nadir' : ''}" transform="translate(${c.x.toFixed(0)} ${c.y.toFixed(0)})"><g class="akv-govde">`
            + `<g class="${kum ? 'akv-yuru' : 'akv-yuz'}" style="--dx:${kum ? dx / 2 : dx}px;--t:${t}s;animation-delay:-${(h % 70) / 10}s">${c.n ? `<circle r="${fs * .62}" fill="#fff6c9" opacity=".18" class="akv-hale"/>` : ''}<g class="${kum ? '' : 'akv-don'}" style="--t:${t}s;animation-delay:-${(h % 70) / 10}s"><text class="akv-emoji" text-anchor="middle" dominant-baseline="central" font-size="${fs}">${c.e}</text></g>`
            + (c.ad ? `<text class="akv-sahip" y="${fs * .55 + 10}" text-anchor="middle" font-size="12" font-weight="900" fill="${renk}" stroke="#0b1d33" stroke-width="3" paint-order="stroke">${kacis(c.ad)}</text>` : '')
            + '</g></g></g>';
    }
    function sahneHTML(st) {
        const c = A[st.tip];
        let cocuk = '';
        liste().map((s, i) => [s, i]).reverse().forEach(([s, i]) => {
            const p = cocukXY(i), renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('akvaryum', i) : '#ffd23f';
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 40) : `<circle cy="-18" r="16" fill="${renk}"/>`;
            cocuk += `<g class="akv-cocuk" id="akv-c${i}" data-km-sporcu="${i}"><g transform="translate(${p.x} ${p.y})"><g class="akv-ci">${kar}</g>
                <circle class="akv-halka" cx="0" cy="-20" r="25" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="akv-ad-yazi" y="15" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#0b1d33" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        let kab = ''; for (let i = 0; i < 16; i++) { const h = hash(st.tip + 'k' + i); kab += `<circle class="akv-kab" style="--t:${4 + h % 5}s;animation-delay:-${(h >> 4) % 60 / 10}s" cx="${340 + h % 640}" cy="510" r="${2 + (h >> 9) % 5}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1.5"/>`; }
        return `<svg id="akv-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="akv-sug" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.su[0]}"/><stop offset=".55" stop-color="${c.su[1]}"/><stop offset="1" stop-color="${c.su[2]}"/></linearGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#akv-sug)"/>
          <g fill="#fff" opacity=".07"><path d="M420 -10 L500 -10 L380 520 L300 520Z"/><path d="M640 -10 L690 -10 L600 520 L540 520Z"/><path d="M860 -10 L940 -10 L840 520 L760 520Z"/></g>
          <path class="akv-dalga" d="M-400 14 Q-300 4 -200 14 T0 14 T200 14 T400 14 T600 14 T800 14 T1000 14 T1200 14 T1400 14 V-200 H-400Z" fill="#ffffff" opacity=".16"/>
          <g id="akv-dekor">${c.dekor()}</g>
          <path d="M-400 505 Q100 488 400 500 T1000 498 T1400 505 V760 H-400Z" fill="${c.kum[0]}"/><path d="M-400 505 Q100 488 400 500 T1000 498 T1400 505" fill="none" stroke="${c.kum[1]}" stroke-width="6"/>
          <g id="akv-kab">${kab}</g>
          <g id="akv-canlilar">${st.canlilar.slice(-60).map((x) => canliSVG(x)).join('')}</g>
          <g id="akv-ucan"></g>
          <path d="M-400 560 V226 Q60 180 190 194 Q320 210 430 284 V560Z" fill="#0b1d33" opacity=".9"/><path d="M-400 226 Q60 180 190 194 Q320 210 430 284" fill="none" stroke="#7dd3fc" stroke-opacity=".35" stroke-width="5"/>
          <g id="akv-cocuklar">${cocuk}</g>
          <g id="akv-pop"></g>
        </svg>
        <div class="akv-hud"><div class="akv-hud-ust"><span class="akv-ad" id="akv-ad"></span><span class="akv-cip" id="akv-sayi"></span>
          <button class="akv-btn" id="akv-ses-btn" title="Ses">🔊</button><button class="akv-btn" id="akv-nasil-btn" title="Nasıl oynanır?">❓</button><button class="akv-btn" id="akv-yeni-btn" title="Yeni akvaryum">🔄</button></div>
          <div class="akv-bar"><i id="akv-bar-ic"></i><span id="akv-bar-yazi"></span></div></div>
        <div class="akv-dev" id="akv-dev"></div>`;
    }
    function akvSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false; _ekranHud = null;
        const st = durum();
        p.innerHTML = sahneHTML(st); p.dataset.tip = st.tip;
        $('akv-ses-btn').onclick = () => { try { localStorage.setItem('dag_akv_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.blup(); };
        $('akv-nasil-btn').onclick = nasil;
        $('akv-yeni-btn').onclick = yeniOyunSor;
        _sonAi = -1; hudCiz(); akvGuncelle();
    }
    let _ekranHud = null;
    function hudCiz(oran) {
        if (!$('akv-ad')) return;
        // dolan akvaryumun töreni bitene kadar HUD ekrandaki (eski) akvaryumu gösterir — durum çoktan yenisine geçti
        const st = _ekranHud || durum(), c = A[st.tip], adet = st.canlilar.length;
        const y = Math.min(100, Math.round(oran != null ? oran * 100 : st.dolu / (st.gerekli || 1) * 100));
        const n = st.canlilar.filter((x) => x.n).length;
        $('akv-ad').textContent = c.ikon + ' ' + (st.adi || akvAdi(st));
        $('akv-sayi').innerHTML = `🐟 <b>${adet}</b> canlı${n ? ` · ✨ <b>${n}</b> nadir` : ''}`;
        $('akv-bar-ic').style.width = y + '%'; $('akv-bar-yazi').textContent = 'Akvaryum %' + y;
        $('akv-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
    }
    // Sıradaki çocuğun halkası + sıra geçişinde zıplama (Hapşırık'la aynı; kabuk her sıra değişiminde çağırır)
    let _sonAi = -1;
    function akvGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#akv-cocuklar .akv-cocuk').forEach((g) => { const aktif = +g.id.slice(5) === ai, h = g.querySelector('.akv-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('akv-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('akv-c' + ai), e = c && c.querySelector('.akv-ci'); if (e) { e.classList.remove('akv-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('akv-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('akv-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 24, 'font-weight': 900, fill: renk || '#fff', stroke: '#0b1d33', 'stroke-width': 4, 'paint-order': 'stroke', class: 'akv-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1500);
    }
    function dev(html, ms) { const d = $('akv-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function cocukNokta(i) { const p = cocukXY(i); return { x: p.x, y: p.y - 22 }; }
    // Damla: çocuğun yerinden yay çizerek hedefe uçar (SVG içinde, sahne birimiyle — ölçek hesabı gerekmez)
    function damlaUcur(i, x, y, cb) {
        const g = $('akv-ucan'); if (!g) { cb(); return; }
        const a = cocukNokta(i), d = svgEl('g', {}, g);
        svgEl('path', { d: 'M0 -12 C7 -2 9 3 9 6 A9 9 0 0 1 -9 6 C-9 3 -7 -2 0 -12Z', fill: '#bfeaff', stroke: '#ffffff', 'stroke-width': 2 }, d);
        const tep = Math.min(a.y, y) - 120;
        const an = d.animate([{ transform: `translate(${a.x}px,${a.y}px)` }, { transform: `translate(${(a.x + x) / 2}px,${tep}px)`, offset: .5 }, { transform: `translate(${x}px,${y}px)` }], { duration: 750, easing: 'ease-in-out' });
        an.onfinish = () => { d.remove(); cb(); };
    }
    function sicrat(x, y, buyuk) {
        const g = $('akv-ucan'); if (!g) return;
        for (let k = 0; k < (buyuk ? 3 : 2); k++) { const c = svgEl('circle', { cx: x, cy: y, r: 6, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, class: 'akv-halka-dalga', style: `animation-delay:${k * .15}s` }, g); setTimeout(() => c.remove(), 1200); }
        for (let k = 0; k < 6; k++) { const b = svgEl('circle', { cx: x + (Math.random() * 40 - 20), cy: y, r: 2 + Math.random() * 4, fill: 'none', stroke: '#fff', 'stroke-opacity': .7, 'stroke-width': 1.5, class: 'akv-kab', style: '--t:2.2s' }, g); setTimeout(() => b.remove(), 2100); }
    }

    /* ---------------- SERİ İŞLEME ---------------- */
    // Önce DURUM hesaplanır ve kaydedilir (geri al / yenile / diğer cihaz tutarlı), sonra okların görseli oynar.
    function akvSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); akvSahneKur(); }
        const st = durum(), key = s.g + '|' + s.ad, olaylar = [], renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('akvaryum', i) : '#ffd23f';
        let doldu = null;
        st.seri = (st.seri || 0) + 1;
        (kaydedilecek || []).forEach((k) => {
            const v = String(k.puan), b = boyHesapla(v);
            if (b < 0) { if (!doldu) olaylar.push({ v: v, b: -1 }); return; }
            const tur = rnd(CANLI[b]), p = yerSec(tur, b);
            const canli = { e: tur.e, k: key, ad: ilkAd(s.ad).slice(0, 8), r: renk, b: b, x: p.x, y: p.y, n: b === 4 ? 1 : 0, yer: tur.yer || '' };
            st.canlilar.push(canli); st.dolu += deger(v);
            st.katki[key] = (st.katki[key] || 0) + 1;
            if (canli.n) { st.nadir[key] = (st.nadir[key] || 0) + 1; rozetYaz(s.g, s.ad, 'nadir'); }
            if (doldu) return; // aynı seride dolduran oktan sonrakiler sıradaki akvaryuma girer (görseli tören sonrası)
            const o = { v: v, b: b, canli: canli, tur: tur, oran: Math.min(1, st.dolu / (st.gerekli || 1)) };
            if (st.dolu >= st.gerekli) {
                const sayac = {}; st.canlilar.forEach((x) => { sayac[x.k] = (sayac[x.k] || 0) + 1; });
                const enCok = Object.entries(sayac).sort((a, b2) => b2[1] - a[1])[0];
                const nadirler = [...new Set(st.canlilar.filter((x) => x.n).map((x) => x.k))];
                doldu = { tip: st.tip, adi: akvAdi(st), ad: s.ad, g: s.g, i: i, adet: st.canlilar.length, enCok: enCok ? enCok[0] : null, nadirler: nadirler };
                st.dolanlar.push({ tip: st.tip, ad: s.ad, g: s.g, t: Date.now() });
                rozetYaz(s.g, s.ad, 'doldurdu');
                const fazla = st.dolu - st.gerekli;
                _ekranHud = { tip: st.tip, adi: akvAdi(st), canlilar: st.canlilar.slice(), dolu: 1, gerekli: 1 };
                yeniAkvaryum(st, st.no + 1); st.dolu = Math.min(st.gerekli * .5, fazla);
                o.oran = 1;
            }
            olaylar.push(o);
        });
        kaydet();
        // görsel
        if (!panel() || !$('akv-svg')) { try { done(); } catch (e) { } return; }
        let n = 0; const hepsi = olaylar.length;
        const bitti = () => { if (doldu) _toren = true; try { done(); } catch (e) { } if (doldu) dolduGoster(doldu); };
        if (!hepsi) { bitti(); return; }
        olaylar.forEach((o, k) => {
            setTimeout(() => {
                SES.damla();
                const x = o.canli ? o.canli.x : 380 + Math.random() * 560, y = o.canli ? o.canli.y : 60;
                damlaUcur(i, x, o.b < 0 ? 40 : y, () => { okTepki(o, x, y); n++; if (n === hepsi) setTimeout(bitti, 450); });
            }, k * 420);
        });
    }
    function okTepki(o, x, y) {
        if (o.b < 0) { SES.blup(); sicrat(x, 30); pop('blup!', x, 70, 22, '#d8f3ff'); return; }
        SES.sicra(); sicrat(x, y, o.b >= 3);
        const g = $('akv-canlilar'); if (g) { g.insertAdjacentHTML('beforeend', canliSVG(o.canli, true)); while (g.childNodes.length > 60) g.firstChild.remove(); }
        if (o.canli.n) { SES.nadir(); pop('✨ NADİR! ' + o.tur.ad + '!', x, y - 60, 30, '#ffe08a'); dev(`✨ NADİR CANLI! ${o.canli.e}<small>${kacis(o.canli.ad)} bir ${o.tur.ad.toLocaleLowerCase('tr')} getirdi!</small>`, 2200); }
        else { SES.canli(o.b); pop('+' + o.tur.e + ' ' + o.tur.ad, x, y - BOY_PUNTO[o.b] * .7, 20 + o.b * 2, o.canli.r); }
        if (o.v === 'X') pop('X! ×1.5', x, y - 95, 22, '#ffe08a');
        hudCiz(o.oran);
        const st = durum(); void st;
    }
    function dolduGoster(h) {
        _toren = true; const c = A[h.tip];
        SES.fanfar();
        dev(`AKVARYUM DOLDU! 🎉<small>${c.ikon} ${kacis(h.adi)} · ${h.adet} canlı</small>`, 2600);
        document.querySelectorAll('#akv-canlilar .akv-govde').forEach((e, k) => { e.classList.add('akv-dans'); e.style.animationDelay = (k % 8) * .08 + 's'; });
        sonra(() => {
            SES.fanfar(); const ce = $('akv-c' + h.i);
            if (ce) { ce.classList.add('akv-kahraman'); const g = ce.querySelector('g'); if (g) g.insertAdjacentHTML('beforeend', '<text y="-50" text-anchor="middle" font-size="22">👑</text>'); }
            let resim = '';
            try { const s = liste()[h.i]; if (s && typeof kmOyunKarakterBilgi === 'function' && typeof kmOyunHayvanKarakterAta === 'function') resim = `<img class="akv-kahr-img" src="${kmOyunKarakterBilgi(kmOyunHayvanKarakterAta(s)).src}" alt="">`; } catch (e) { }
            dev(`${resim}<br>Dolduran: ${kacis(ilkAd(h.ad))}! 🏅<small>Son canlıyı o getirdi · rozet kazandı</small>`);
        }, 2900);
        sonra(() => {
            const bul = (k) => liste().find((s) => s.g + '|' + s.ad === k), enCok = h.enCok ? bul(h.enCok) : null;
            const nadir = h.nadirler.map(bul).filter(Boolean).map((s) => kacis(ilkAd(s.ad)));
            const st = durum();
            dev(`${c.ikon} ${kacis(h.adi)} doldu! 🎉<small>🏅 Dolduran: ${kacis(ilkAd(h.ad))}${enCok ? ' · 🐟 En çok canlı getiren: ' + kacis(ilkAd(enCok.ad)) : ''}${nadir.length ? '<br>✨ Nadir bulanlar: ' + nadir.join(', ') : ''}<br>Sıradaki: ${A[st.tip].ikon} ${kacis(akvAdi(st))}</small>`, 4800);
        }, 6000);
        // canlılar yüzerek sağdan ayrılır
        sonra(() => { document.querySelectorAll('#akv-canlilar .akv-govde').forEach((e, k) => { e.classList.remove('akv-dans'); e.classList.add('akv-git'); e.style.animationDelay = (k % 10) * .1 + 's'; }); }, 9200);
        sonra(() => { _toren = false; akvSahneKur(); SES.geldi(); const sv = $('akv-svg'); if (sv) { sv.classList.add('akv-yeni-gel'); } }, 11400);
    }
    function nasil() {
        const st = durum(), c = A[st.tip];
        dev(`${c.ikon} Akvaryumu doldurun!<small style="text-align:left;display:inline-block;max-width:580px">
          Her ok suya bir damla olur, düştüğü yerde bir canlı doğar:<br>
          ⚫⚪ 1-4 → 🐟 küçük balık · 🔵 5-6 → 🐠 🦀 🦐 · 🔴 7-8 → 🐢 🐙 🦑 · 🟡 9 → 🐬 🐡<br>
          ✨ 10 ve X → NADİR: 🐋 🦈 🐳 · Iska → yalnız kabarcık<br>
          Akvaryum dolunca kutlama — sonra sıradaki akvaryum gelir!<br><i>(kapatmak için dokun)</i></small>`);
        const d = $('akv-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    function yeniOyunSor() {
        const f = () => { const st = durum(); yeniAkvaryum(st, st.no + 1); kaydet(); akvSahneKur(); if (typeof showToast === 'function') showToast('🔄 Yeni akvaryum geldi!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Bu akvaryum boşaltılsın, sıradaki gelsin mi?<br><small>Canlılar ve doluluk sıfırlanır (sporcuların serileri silinmez).</small>', f, 'Sıradaki gelsin', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function akvAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function akvGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _st = k; _stKonum = konum(); kaydet(); if (panel()) akvSahneKur(); }
    function akvSporcuCanli(g, ad) { const st = durum(); return st.katki[g + '|' + ad] || 0; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('akv-css')) return;
        const st = document.createElement('style'); st.id = 'akv-css';
        st.textContent = `
.km-oyun-panel-akvaryum{padding:0;background:#0b3b63;overflow:hidden}
.akv-hud{position:absolute;right:12px;top:10px;z-index:1;width:min(440px,52%);display:grid;gap:6px;pointer-events:none}
.akv-hud-ust{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.akv-ad,.akv-cip{background:rgba(8,20,36,.72);color:#eaf6ff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;white-space:nowrap}
.akv-btn{pointer-events:auto;background:rgba(8,20,36,.72);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.akv-bar{position:relative;height:18px;border-radius:999px;background:rgba(8,20,36,.72);overflow:hidden}
.akv-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3fb6e0,#8be8ff);transition:width .5s}
.akv-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}
/* çocuğa dokununca sıra ona geçer: kabuğun ortak data-km-sporcu dinleyicisi (app.js kmOyunSahneSporcuBul) */
.akv-cocuk{cursor:pointer}.akv-cocuk:hover .akv-ci{filter:brightness(1.15)}
.akv-halka{transition:opacity .3s}.akv-cocuk.akv-aktif .akv-ad-yazi{fill:#ffd23f}
.akv-sira-geldi{transform-box:fill-box;transform-origin:50% 100%;animation:akvSiraGeldi .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes akvSiraGeldi{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.18)}100%{transform:translateY(0) scale(1)}}
.akv-yuz,.akv-don,.akv-yuru,.akv-gir .akv-emoji,.akv-dans,.akv-git,.akv-hale{transform-box:fill-box;transform-origin:center}
.akv-yuz{animation:akvYuz var(--t) ease-in-out infinite}
/* yüzme: dış g (ad yazısıyla birlikte) gidip gelir; iç .akv-don yalnız emojiyi döndürür — yazı ayna görünmesin */
@keyframes akvYuz{0%,100%{transform:translate(0,0)}25%{transform:translate(calc(var(--dx)*.5),-8px)}50%{transform:translate(var(--dx),0)}75%{transform:translate(calc(var(--dx)*.5),8px)}}
.akv-don{animation:akvDon var(--t) linear infinite}
@keyframes akvDon{0%,49.9%{transform:scaleX(1)}50%,99.9%{transform:scaleX(-1)}}
.akv-yuru{animation:akvYuru var(--t) ease-in-out infinite}
@keyframes akvYuru{0%,100%{transform:translateX(0)}50%{transform:translateX(var(--dx))}}
.akv-gir .akv-emoji{animation:akvGir .9s cubic-bezier(.3,1.5,.5,1) both}
@keyframes akvGir{0%{transform:scale(.1) rotate(-30deg);opacity:0}100%{transform:none;opacity:1}}
.akv-nadir .akv-emoji{filter:drop-shadow(0 0 10px #fff3b0)}
.akv-hale{animation:akvHale 2s ease-in-out infinite}@keyframes akvHale{50%{transform:scale(1.25);opacity:.05}}
.akv-sahip{opacity:.85}
.akv-yosun{animation:akvYosun 4s ease-in-out infinite;transform-box:view-box}@keyframes akvYosun{50%{transform:rotate(5deg)}}
.akv-isil{animation:akvIsil 3s ease-in-out infinite}@keyframes akvIsil{50%{opacity:.2}}
.akv-kab{animation:akvKab var(--t) linear infinite}@keyframes akvKab{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(-480px);opacity:0}}
.akv-dalga{animation:akvDalga 6s linear infinite}@keyframes akvDalga{to{transform:translateX(-400px)}}
.akv-halka-dalga{animation:akvHalka 1s ease-out forwards;transform-box:fill-box;transform-origin:center}@keyframes akvHalka{0%{transform:scale(.3);opacity:1}100%{transform:scale(7);opacity:0}}
.akv-pop{animation:akvPop 1.4s ease-out forwards;transform-box:fill-box;transform-origin:center}
@keyframes akvPop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-50px)}}
.akv-dans{animation:akvDans .5s ease-in-out 5}@keyframes akvDans{50%{transform:translateY(-18px) rotate(-8deg)}}
.akv-git{animation:akvGit 2s ease-in forwards}@keyframes akvGit{to{transform:translateX(900px);opacity:0}}
.akv-yeni-gel #akv-dekor,.akv-yeni-gel #akv-canlilar{animation:akvYeniGel 1.2s cubic-bezier(.3,1.2,.5,1)}@keyframes akvYeniGel{0%{transform:translateX(500px);opacity:0}100%{transform:none;opacity:1}}
.akv-dev{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(28px,6vw,80px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.3);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.05;width:92%}
.akv-dev small{display:block;font-size:.3em;font-weight:800;margin-top:8px;color:#d8f3ff;line-height:1.35}
.akv-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
.akv-kahr-img{width:1.6em;height:1.6em;object-fit:contain;filter:drop-shadow(0 0 18px #9be7ff)}
.akv-kahraman .akv-ci{filter:drop-shadow(0 0 10px #ffd860)}
@media (max-width:700px){.akv-hud{width:62%}.akv-ad,.akv-cip{font-size:12px;padding:4px 9px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-akvaryum *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.akvSahneKur = akvSahneKur;
    window.akvGuncelle = akvGuncelle;
    window.akvSeri = akvSeri;
    window.akvAnlik = akvAnlik;
    window.akvGeriYukle = akvGeriYukle;
    window.akvSporcuCanli = akvSporcuCanli;
    window.akvAkvaryumlar = A;
    // Oyun Ayarları › Akvaryum seviyesi değişince sahnedeki akvaryumun gereken doluluğu yeniden hesaplanır (dolu oran korunur).
    window.akvAyarUygula = function () {
        if (_toren) return; const st = durum(), yeni = gerekliHesapla(st.no); if (!yeni || yeni === st.gerekli) return;
        const oran = Math.min(.98, st.dolu / (st.gerekli || 1)); st.gerekli = yeni; st.dolu = Math.round(oran * yeni); kaydet();
        if (panel() && $('akv-svg')) hudCiz();
    };
})();
