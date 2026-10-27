/* ================================================================================================
   🤧 HAPŞIRIK! — Karışık Sınıf › Oyunlar teması 'hapsirik' (2026-10-27).
   Kullanıcı Ortak Canavar'ı sevdi ("ortak bir şeyi devirmek, canavarların ara ara tepki vermesi"), küçük yaş grubu için
   yeni bir oyun istedi; iki taslak turundan sonra "Hapşırık"ı seçti + 4 ek (ses, kahraman anı, rüya baloncuğu, gizli
   hassas nokta) + "karakterler aynı olmasın" (her seviye ayrı bir yaratık: ejder / kurbağa / mamut / ayı).
   OYUN: Yolu kapatan dev yaratık uyuyor. Her ok, atan çocuğun yerinden uçan bir tüy olur ve halka rengine göre bir yeri
   gıdıklar (sarı → burun/hortum, kırmızı → göbek/gıdı, mavi → ayak/pati, siyah-beyaz → kuyruk/sırt/kulak, M → horlar).
   Yaratığın gizli bir PUANI var (5-8): o puanı atanın tüyü gizli yere gider (kulak/koltuk altı…) → kahkaha. Gıdık %100'de
   "ha… haa… HAAAA…" — yaratık başına bir kez %50 "…hıh. Geçti!" (gıdık %80'e iner) — sonra HAPŞUUU!, kahraman anı
   (son tüyü atan), "Hep birlikte: ÇOK YAŞA!", yaratık kenara çekilir, sıradaki yaratık gelir.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (sıradaki sporcu, geri al, tam ekran — app.js). Gerçek seri app.js'te
   _skorKaydetCekirdek ile yazılır; bu dosya yalnız oyun durumunu ve çizimi yönetir:
     hpsSahneKur(panel) · hpsGuncelle() · hpsSeri(s, i, kaydedilecek, done) · hpsAnlik() · hpsGeriYukle(kopya) · hpsSporcuGidik(g, ad)
   DURUM 'dag_km_hapsirik_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL (Kule/Canavar ilkesi):
     { tarih, no, tip, gerekli, gidik, sahte, katki{'g|ad':n}, gizli{yer,deger}, bulan, hapsirtanlar[{tip,ad,g}], seri }
   Rozet: sp.oyun.hapsirik = { hapsirtti, gizli } (Canavar koleksiyonu gibi, geri al bunu geri almaz).
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
    function halka(v) { v = String(v); if (v === 'M' || v === '0') return 'gri'; const d = v === 'X' ? 10 : +v; return d >= 9 ? 'sari' : d >= 7 ? 'kirmizi' : d >= 5 ? 'mavi' : 'siyahbeyaz'; }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }

    /* ---------------- SES (WebAudio sentezi, dosya yok; cihaza özel aç/kapa) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_hps_ses') !== '0'; } catch (e) { return true; } }
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
    function P() { return (Y[_aktifTip] || Y.ejder).perde; }
    const SES = {
        horla() { if (_aktifTip === 'kurbaga') { ton(160, 110, .18, 'square', .05); ton(150, 100, .22, 'square', .05, .26); return; } hisirti(1.2, 260 * P(), 160 * P(), .07, 0, 3); ton(64 * P(), 52 * P(), 1.2, 'sawtooth', .035); },
        tuy() { hisirti(.4, 2600, 800, .05, 0, 1.5); },
        burun() { hisirti(.22, 4200, 5200, .08, 0, 4); hisirti(.18, 4200, 3000, .06, .25, 4); },
        kikir() { for (let i = 0; i < 5; i++) ton((720 + (i % 2) * 90) * P(), (820 + (i % 2) * 90) * P(), .08, 'triangle', .1, i * .1); },
        ayak() { ton(520 * P(), 1300 * P(), .22, 'sine', .1); ton(600 * P(), 1500 * P(), .18, 'sine', .07, .22); },
        kuyruk() { hisirti(.32, 1400, 350, .07, 0, 1.2); },
        pit() { ton(320, 180, .09, 'sine', .1); },
        ha(n) { ton((170 + n * 45) * P(), (240 + n * 70) * P(), .45 + n * .2, 'sawtooth', .05 + n * .03); hisirti(.45 + n * .2, 700, 1400, .04 + n * .03, 0, .8); },
        hapsu() { hisirti(1.1, 2600, 250, .45, 0, .5); ton(160 * P(), 38, .7, 'square', .18); ton(90, 30, .9, 'sine', .3); if (_aktifTip === 'mamut') { ton(330, 520, .5, 'sawtooth', .12, .05); ton(520, 300, .6, 'sawtooth', .1, .5); } },
        gecti() { ton(300 * P(), 180 * P(), .5, 'triangle', .1); },
        gizli() { [880, 1175, 1568, 2093].forEach((f, i) => ton(f, f * 1.01, .2, 'sine', .12, i * .08)); },
        kahkaha() { for (let i = 0; i < 8; i++) ton((380 + (i % 2) * 140) * P(), (330 + (i % 2) * 140) * P(), .11, 'square', .05, i * .13); },
        ruya() { ton(990, 1320, .25, 'sine', .06); ton(1320, 880, .3, 'sine', .05, .18); },
        fanfar() { [523, 659, 784, 1046].forEach((f, i) => ton(f, f, .3, 'triangle', .13, i * .13)); ton(1046, 1046, .6, 'triangle', .12, .55); },
        cokyasa() { [392, 523, 659].forEach((f, i) => ton(f, f, .22, 'triangle', .1, i * .1)); },
        geldi() { [330, 392, 494].forEach((f, i) => ton(f * P(), f * P(), .2, 'triangle', .08, i * .12)); }
    };

    /* ---------------- YARATIKLAR — hepsi aynı yerel çerçevede çizilir (yer y=500, baş solda x≈300-560, gövde sağda ≤990).
       Ortak parça kimlikleri: hps-nefes(gövde soluması) hps-govde hps-bas hps-burun hps-ayak hps-kuyruk hps-yanak hps-agiz
       hps-go1/2 (açık göz) hps-gk1/2 (kapalı göz) hps-balon (burun balonu) hps-zzz · hedef işaretleri hps-h-<yer>. ---------- */
    const KOYU_GOZ = '#1e1a18';
    function gozler(a, b, r, koyu) {
        return [a, b].map((p, i) => `<path id="hps-gk${i + 1}" d="M${p[0] - r} ${p[1]} q${r} ${r * .7} ${r * 2} 0" fill="none" stroke="${koyu}" stroke-width="5" stroke-linecap="round"/>`
            + `<g id="hps-go${i + 1}" opacity="0"><circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#fff" stroke="${koyu}" stroke-width="3"/><circle cx="${p[0] - r * .3}" cy="${p[1] + 2}" r="${r * .5}" fill="${KOYU_GOZ}"/><circle cx="${p[0] - r * .5}" cy="${p[1] - r * .2}" r="${r * .18}" fill="#fff"/></g>`).join('');
    }
    function zzz(x, y) { return `<g id="hps-zzz"><text class="hps-zzzt" x="${x}" y="${y}" font-size="28" font-weight="800" fill="#cfe3ff">z</text><text class="hps-zzzt" style="animation-delay:.8s" x="${x + 20}" y="${y - 20}" font-size="22" font-weight="800" fill="#cfe3ff">z</text><text class="hps-zzzt" style="animation-delay:1.6s" x="${x + 36}" y="${y - 38}" font-size="17" font-weight="800" fill="#cfe3ff">z</text></g>`; }
    function balon(x, y, r) { return `<circle id="hps-balon" class="hps-burun-balon" style="transform-box:fill-box;transform-origin:right bottom" cx="${x}" cy="${y}" r="${r}" fill="#cfe9ff" opacity=".55" stroke="#fff" stroke-width="2"/>`; }
    function hedef(yer, x, y) { return `<circle id="hps-h-${yer}" cx="${x}" cy="${y}" r="2" opacity="0"/>`; }
    // Tüy (40×40): yumuşak bayrak + sap. Emoji kullanılmıyor — 🪶 eski tablet/Windows'ta kare görünüyordu.
    const TUY_SVG_IC = '<path d="M35 4C22 5 9 15 7 31c5-1 11-4 15-8-4 0-6-1-7-2 4 0 8-2 11-5-3 0-5-1-6-2 5-1 9-4 15-10z" fill="#fff7e6" stroke="#c9a66b" stroke-width="1.6" stroke-linejoin="round"/><path d="M35 4L4 37" stroke="#a8844a" stroke-width="2" stroke-linecap="round"/>';
    function og(id, x, y) { return `id="${id}" style="transform-box:view-box;transform-origin:${x}px ${y}px"`; }

    const Y = {
        ejder: {
            ad: 'Uykucu Ejder', ikon: '🐉', perde: 1, ten: '#6fae74', koyu: '#2f5e3a', karin: '#e8dca0',
            yer: 'KÖYÜN TÜNELİ', gok: ['#2b3550', '#5f6f8c'], zemin: ['#4f5e3a', '#6a7c48'],
            bolge: { burun: 'BURUN', gobek: 'GÖBEK', ayak: 'AYAK', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'kulak', ad: 'KULAK', iy: 'kulağı', emoji: '👂' }, { yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'cene', ad: 'ÇENE', iy: 'çenesi', emoji: '😆' }],
            ruya: ['🎂', 'mmm... pasta...'], karisik: ['🥦', 'Pasta BROKOLİ oldu!'], ruyaXY: [470, 215],
            hapsirik: { cesit: 'toz', renk: ['#efe6cc', '#e0d4b0', '#f6efd8'] },
            agiz: { uyku: 'M372 444 q30 12 64 -4', ha: 'M378 440 q28 -2 54 -2', acik: 'M380 432 a22 16 0 1 0 44 0 a22 16 0 1 0 -44 0', utanc: 'M380 440 a14 10 0 1 0 28 0 a14 10 0 1 0 -28 0', gulumse: 'M374 438 q30 22 64 -2' },
            arka() {
                return `<path d="M430 500 Q450 140 700 90 Q960 60 1010 160 V500Z" fill="#4a4740"/><path d="M480 500 Q470 250 600 200 Q640 185 650 220" fill="none" stroke="#5c5850" stroke-width="10"/>
                    <path d="M520 500 Q525 170 745 150 Q955 150 965 500Z" fill="#14161b"/>`;
            },
            isikXY: [760, 380],
            svg(c) {
                let dik = ''; for (let a = 200; a <= 330; a += 13) { const t = a * Math.PI / 180, x = 690 + 195 * Math.cos(t), y = 410 + 88 * Math.sin(t), nx = Math.cos(t), ny = Math.sin(t); dik += `<path d="M${x - ny * 11} ${y + nx * 11} L${x + nx * 24} ${y + ny * 24} L${x + ny * 11} ${y - nx * 11}Z" fill="${c.koyu}"/>`; }
                return `<g ${og('hps-kuyruk', 860, 470)}><path d="M860 462 Q980 500 900 528 Q780 548 650 520" fill="none" stroke="${c.ten}" stroke-width="34" stroke-linecap="round"/><path d="M652 520 l-34 -22 l6 24 l-14 18z" fill="${c.koyu}"/></g>
                <g ${og('hps-nefes', 690, 500)} class="hps-nefes"><g ${og('hps-govde', 690, 500)}>${dik}
                  <path d="M640 345 Q705 245 800 300 Q768 308 778 336 Q740 330 722 352Z" fill="${c.koyu}" opacity=".75"/>
                  <ellipse cx="690" cy="410" rx="195" ry="88" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="660" cy="452" rx="150" ry="40" fill="${c.karin}"/>
                  ${[560, 600, 640, 680, 720, 760].map((x) => `<path d="M${x} 420 q4 30 0 62" stroke="${c.koyu}" stroke-width="2.5" fill="none" opacity=".35"/>`).join('')}
                  <ellipse cx="640" cy="360" rx="70" ry="18" fill="#fff" opacity=".13"/></g></g>
                <g ${og('hps-ayak', 820, 495)}><ellipse cx="842" cy="478" rx="44" ry="26" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>${[0, 1, 2].map((i) => `<circle cx="872" cy="${462 + i * 14}" r="8" fill="${c.karin}" stroke="${c.koyu}" stroke-width="2"/>`).join('')}<ellipse cx="840" cy="480" rx="16" ry="11" fill="${c.karin}"/></g>
                <ellipse cx="470" cy="482" rx="40" ry="20" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-bas', 530, 430)}>
                  <path d="M500 330 l-10 -42 l30 32z M535 336 l6 -40 l20 38z" fill="#efe6d0" stroke="${c.koyu}" stroke-width="3"/>
                  <path ${og('hps-kulak', 545, 355)} d="M540 350 l34 -14 l-8 24 l30 -2 l-22 22z" fill="${c.koyu}" opacity=".8"/>
                  <ellipse cx="472" cy="388" rx="84" ry="66" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="394" cy="412" rx="64" ry="44" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="455" cy="350" rx="40" ry="12" fill="#fff" opacity=".15"/>
                  <g ${og('hps-burun', 352, 410)}><ellipse cx="352" cy="398" rx="9" ry="6" fill="${c.koyu}"/><ellipse cx="356" cy="424" rx="9" ry="6" fill="${c.koyu}"/></g>
                  ${balon(318, 404, 26)}
                  <ellipse id="hps-yanak" cx="455" cy="420" rx="22" ry="12" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([467, 364], [511, 358], 15, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(520, 300)}
                </g>
                ${hedef('burun', 350, 412)}${hedef('gobek', 660, 452)}${hedef('ayak', 842, 474)}${hedef('kuyruk', 760, 516)}
                ${hedef('kulak', 572, 352)}${hedef('koltuk', 516, 466)}${hedef('cene', 420, 452)}`;
            }
        },
        kurbaga: {
            ad: 'Koca Vırak', ikon: '🐸', perde: 1.35, ten: '#7cbf5a', koyu: '#2f6a2a', karin: '#eaf2b8',
            yer: 'BATAKLIK KÖPRÜSÜ', gok: ['#1c2e33', '#3f6460'], zemin: ['#2f5a4c', '#4a7a5e'],
            bolge: { burun: 'BURUN', gobek: 'GIDI', ayak: 'PERDE AYAK', kuyruk: 'SIRT' },
            gizliler: [{ yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'diz', ad: 'DİZ', iy: 'dizi', emoji: '😝' }, { yer: 'yanak', ad: 'YANAK', iy: 'yanağı', emoji: '😊' }],
            ruya: ['🐝', 'vızzz... arı...'], karisik: ['🧦', 'Arı ÇORAP oldu!'], ruyaXY: [440, 150],
            hapsirik: { cesit: 'kabarcik', renk: ['#bfeeff', '#d8fff0', '#9fe3d0'] },
            agiz: { uyku: 'M470 372 Q595 402 720 372', ha: 'M480 378 Q595 384 710 378', acik: 'M520 372 Q595 446 670 372 Q595 390 520 372Z', utanc: 'M582 384 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0', gulumse: 'M470 366 Q595 424 720 366' },
            arka() {
                return `<rect x="540" y="230" width="26" height="275" rx="8" fill="#5a4330"/><rect x="930" y="230" width="26" height="275" rx="8" fill="#5a4330"/>
                    <path d="M520 250 Q748 160 976 250" fill="none" stroke="#6b5038" stroke-width="22" stroke-linecap="round"/>
                    <path d="M566 500 V262 Q748 196 930 262 V500Z" fill="#0f1d1e"/>
                    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${590 + i * 62} 500 v-${30 + (i % 3) * 18}" stroke="#2f5a4c" stroke-width="5"/>`).join('')}`;
            },
            isikXY: [748, 380],
            svg(c) {
                return `<g ${og('hps-nefes', 640, 500)} class="hps-nefes">
                  <ellipse cx="800" cy="455" rx="95" ry="48" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                  <path d="M860 490 l34 -8 l-10 14 l18 6 l-36 4z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3"/>
                  <g ${og('hps-govde', 640, 500)}><ellipse cx="640" cy="400" rx="185" ry="105" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                    <ellipse cx="610" cy="444" rx="125" ry="58" fill="${c.karin}"/><ellipse cx="600" cy="330" rx="90" ry="20" fill="#fff" opacity=".12"/></g>
                  <g ${og('hps-kuyruk', 750, 360)}>${[[700, 330, 14], [760, 352, 10], [735, 388, 9], [800, 388, 12], [785, 322, 8]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${c.koyu}" opacity=".45"/>`).join('')}</g>
                </g>
                <ellipse cx="500" cy="470" rx="34" ry="28" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><ellipse cx="700" cy="476" rx="34" ry="26" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-ayak', 490, 488)}><path d="M440 500 l20 -22 l10 20 l12 -22 l10 22 l16 -20 l6 22z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3" stroke-linejoin="round"/></g>
                <path d="M720 500 l14 -18 l10 16 l12 -18 l10 18 l12 -16 l4 18z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3" stroke-linejoin="round"/>
                <g ${og('hps-bas', 600, 400)}>
                  <circle cx="540" cy="292" r="46" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/><circle cx="660" cy="284" r="46" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  ${gozler([540, 288], [660, 280], 28, c.koyu)}
                  <g ${og('hps-burun', 598, 338)}><ellipse cx="585" cy="340" rx="6" ry="4" fill="${c.koyu}"/><ellipse cx="612" cy="338" rx="6" ry="4" fill="${c.koyu}"/></g>
                  ${balon(566, 322, 22)}
                  <ellipse ${og('hps-gidi', 595, 410)} cx="595" cy="410" rx="62" ry="28" fill="#f2c7c0" opacity=".9" stroke="${c.koyu}" stroke-width="2"/>
                  <ellipse id="hps-yanak" cx="498" cy="356" rx="20" ry="10" fill="#ff8fa8" opacity=".25"/>
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="5" stroke-linecap="round"/>
                  ${zzz(690, 230)}
                </g>
                ${hedef('burun', 598, 338)}${hedef('gobek', 595, 412)}${hedef('ayak', 468, 492)}${hedef('kuyruk', 752, 356)}
                ${hedef('koltuk', 528, 448)}${hedef('diz', 862, 428)}${hedef('yanak', 498, 356)}`;
            }
        },
        mamut: {
            ad: 'Tüylü Mamut', ikon: '🐘', perde: .7, ten: '#9a6a48', koyu: '#4a2e1c', karin: '#c79a74',
            yer: 'BUZ GEÇİDİ', gok: ['#1e2a40', '#5d7a9c'], zemin: ['#cfe2ef', '#eef6fb'],
            bolge: { burun: 'HORTUM', gobek: 'GÖBEK', ayak: 'AYAK', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'kulak', ad: 'KULAK', iy: 'kulağı', emoji: '👂' }, { yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'sirt', ad: 'SIRT', iy: 'sırtı', emoji: '🙃' }],
            ruya: ['🍉', 'karpuuuz...'], karisik: ['⛄', 'Karpuz KARDAN ADAM oldu!'], ruyaXY: [440, 100],
            hapsirik: { cesit: 'kar', renk: ['#ffffff', '#dff1ff', '#c8e6ff'] },
            agiz: { uyku: 'M445 352 q12 6 24 0', ha: 'M443 352 h28', acik: 'M445 345 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0', utanc: 'M450 350 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0', gulumse: 'M442 348 q14 14 30 0' },
            arka() {
                return `<path d="M450 500 Q470 200 620 120 Q760 60 900 120 Q1010 180 1010 500Z" fill="#a9cbe4" opacity=".9"/>
                    <path d="M540 500 Q545 210 745 190 Q945 190 955 500Z" fill="#1b2a3c"/>
                    <path d="M540 500 Q545 210 745 190 Q945 190 955 500" fill="none" stroke="#e6f4ff" stroke-width="10" opacity=".7"/>
                    ${[600, 660, 720, 780, 840, 900].map((x, i) => `<path d="M${x} ${200 + (i % 2) * 6} l8 ${22 + (i % 3) * 8} l8 -${22 + (i % 3) * 8}z" fill="#e6f4ff" opacity=".8"/>`).join('')}`;
            },
            isikXY: [748, 390],
            svg(c) {
                const kil = (x, y) => `<path d="M${x} ${y} q6 14 -2 26" fill="none" stroke="${c.koyu}" stroke-width="3" opacity=".45" stroke-linecap="round"/>`;
                return `<g ${og('hps-kuyruk', 955, 300)}><path d="M955 300 Q990 330 984 372" fill="none" stroke="${c.koyu}" stroke-width="7" stroke-linecap="round"/><ellipse cx="984" cy="380" rx="11" ry="16" fill="${c.koyu}"/></g>
                <rect x="850" y="398" width="60" height="102" rx="18" fill="${c.koyu}"/><rect x="770" y="408" width="55" height="92" rx="18" fill="${c.koyu}"/>
                <g ${og('hps-nefes', 740, 430)} class="hps-nefes"><g ${og('hps-govde', 740, 430)}>
                  <path d="M520 330 Q560 190 740 185 Q920 180 965 300 Q975 420 900 432 L560 432 Q505 420 520 330Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  ${[[600, 220], [660, 200], [730, 192], [800, 196], [870, 214], [930, 250], [620, 300], [700, 280], [780, 290], [860, 300], [920, 340], [650, 370], [740, 370], [830, 380]].map((p) => kil(p[0], p[1])).join('')}
                  <ellipse cx="720" cy="422" rx="150" ry="22" fill="${c.karin}" opacity=".8"/><ellipse cx="700" cy="230" rx="90" ry="20" fill="#fff" opacity=".1"/></g></g>
                <rect x="650" y="405" width="58" height="95" rx="18" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-ayak', 590, 420)}><rect x="560" y="398" width="62" height="102" rx="18" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>${[572, 588, 604].map((x) => `<ellipse cx="${x}" cy="494" rx="7" ry="5" fill="#f2ead8"/>`).join('')}</g>
                <g ${og('hps-bas', 520, 330)}>
                  <ellipse ${og('hps-kulak', 520, 270)} cx="548" cy="300" rx="42" ry="62" fill="${c.koyu}" opacity=".85"/>
                  <path d="M440 380 Q340 380 372 446 Q392 486 360 488" fill="none" stroke="${c.koyu}" stroke-width="44" stroke-linecap="round"/>
                  <path d="M440 380 Q340 380 372 446 Q392 486 360 488" fill="none" stroke="${c.ten}" stroke-width="36" stroke-linecap="round"/>
                  ${[400, 380, 375, 380].map((x, i) => `<path d="M${x - 14} ${398 + i * 22} h28" stroke="${c.koyu}" stroke-width="2.5" opacity=".4"/>`).join('')}
                  <circle cx="470" cy="290" r="86" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <path d="M420 212 l10 -26 l14 22 l12 -28 l12 26 l14 -22 l8 28" fill="${c.koyu}" stroke="${c.koyu}" stroke-width="3" stroke-linejoin="round"/>
                  <ellipse cx="450" cy="250" rx="40" ry="14" fill="#fff" opacity=".13"/>
                  <path d="M430 352 Q380 410 326 384" fill="none" stroke="#f5efe0" stroke-width="14" stroke-linecap="round"/><path d="M468 360 Q414 420 352 404" fill="none" stroke="#efe6d0" stroke-width="12" stroke-linecap="round"/>
                  <g ${og('hps-burun', 362, 484)}><circle cx="360" cy="488" r="19" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><ellipse cx="352" cy="490" rx="4" ry="3" fill="${c.koyu}"/><ellipse cx="366" cy="491" rx="4" ry="3" fill="${c.koyu}"/></g>
                  ${balon(330, 470, 22)}
                  <ellipse id="hps-yanak" cx="508" cy="318" rx="18" ry="10" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([444, 286], [494, 280], 12, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(520, 190)}
                </g>
                ${hedef('burun', 360, 486)}${hedef('gobek', 720, 414)}${hedef('ayak', 592, 470)}${hedef('kuyruk', 984, 378)}
                ${hedef('kulak', 556, 300)}${hedef('koltuk', 632, 416)}${hedef('sirt', 760, 205)}`;
            }
        },
        ayi: {
            ad: 'Uykucu Ayı', ikon: '🐻', perde: .82, ten: '#8a5a3a', koyu: '#3e2414', karin: '#d8b48c',
            yer: 'ORMAN KAPISI', gok: ['#16241c', '#3a5240'], zemin: ['#2d3f24', '#46603a'],
            bolge: { burun: 'BURUN', gobek: 'GÖBEK', ayak: 'PATİ', kuyruk: 'KULAK' },
            gizliler: [{ yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'gidi', ad: 'GIDI', iy: 'gıdısı', emoji: '😆' }, { yer: 'gobekdeligi', ad: 'GÖBEK DELİĞİ', iy: 'göbek deliği', emoji: '😝' }],
            ruya: ['🍯', 'baaal...'], karisik: ['🥕', 'Bal HAVUÇ oldu!'], ruyaXY: [450, 150],
            hapsirik: { cesit: 'yaprak', renk: ['#c98a3a', '#8aa84a', '#d9b25a', '#6f8f3a'] },
            agiz: { uyku: 'M646 286 q14 8 28 0', ha: 'M646 288 h28', acik: 'M648 282 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0', utanc: 'M653 286 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0', gulumse: 'M640 282 q20 18 40 0' },
            arka() {
                return `${[[470, 120, 60], [990, 110, 66]].map((t) => `<rect x="${t[0] - 14}" y="${t[1] + 120}" width="28" height="${380 - t[1]}" fill="#3a2a1a"/><path d="M${t[0]} ${t[1]} l${t[2]} 130 h-${t[2] * 2}z M${t[0]} ${t[1] + 60} l${t[2] * 1.2} 140 h-${t[2] * 2.4}z" fill="#1f3a26"/>`).join('')}
                    <rect x="540" y="200" width="22" height="300" fill="#5a4330"/><rect x="938" y="200" width="22" height="300" fill="#5a4330"/>
                    <path d="M530 210 H970" stroke="#6b5038" stroke-width="20" stroke-linecap="round"/>
                    <rect x="562" y="222" width="376" height="278" fill="#0e1712"/>`;
            },
            isikXY: [750, 380],
            svg(c) {
                return `<ellipse cx="660" cy="500" rx="230" ry="16" fill="#000" opacity=".25"/>
                <g transform="translate(850 462)"><ellipse rx="42" ry="40" fill="#c98a3a" stroke="#6a4214" stroke-width="4"/><rect x="-30" y="-46" width="60" height="14" rx="6" fill="#a86a24"/><path d="M-26 -34 q8 30 2 40 q-6 -10 -2 -40" fill="#f2c040"/><text y="8" text-anchor="middle" font-size="16" font-weight="900" fill="#5a3410">BAL</text></g>
                <ellipse cx="760" cy="470" rx="50" ry="32" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-nefes', 660, 500)} class="hps-nefes"><g ${og('hps-govde', 660, 500)}>
                  <ellipse cx="660" cy="390" rx="150" ry="125" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="660" cy="412" rx="95" ry="82" fill="${c.karin}"/><path d="M652 432 q8 8 16 0" fill="none" stroke="${c.koyu}" stroke-width="3" stroke-linecap="round"/>
                  <ellipse cx="540" cy="380" rx="32" ry="62" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4" transform="rotate(-18 540 380)"/>
                  <ellipse cx="780" cy="380" rx="32" ry="62" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4" transform="rotate(18 780 380)"/></g></g>
                <g ${og('hps-ayak', 540, 470)}><ellipse cx="560" cy="470" rx="50" ry="32" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><ellipse cx="524" cy="468" rx="20" ry="24" fill="${c.karin}"/>${[[512, 444], [526, 440], [540, 446]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${c.karin}"/>`).join('')}</g>
                <g ${og('hps-bas', 660, 320)}>
                  <g ${og('hps-kuyruk', 660, 170)}><circle cx="590" cy="160" r="30" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><circle cx="590" cy="162" r="15" fill="${c.karin}"/><circle cx="730" cy="160" r="30" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><circle cx="730" cy="162" r="15" fill="${c.karin}"/></g>
                  <circle cx="660" cy="232" r="92" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="640" cy="180" rx="40" ry="14" fill="#fff" opacity=".12"/>
                  <ellipse cx="660" cy="270" rx="46" ry="34" fill="${c.karin}"/>
                  <g ${og('hps-burun', 660, 254)}><ellipse cx="660" cy="254" rx="17" ry="12" fill="${c.koyu}"/><ellipse cx="654" cy="250" rx="5" ry="3" fill="#fff" opacity=".4"/></g>
                  ${balon(628, 254, 20)}
                  <ellipse id="hps-yanak" cx="606" cy="262" rx="18" ry="10" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([622, 222], [698, 222], 13, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(740, 140)}
                </g>
                ${hedef('burun', 660, 254)}${hedef('gobek', 690, 400)}${hedef('ayak', 524, 468)}${hedef('kuyruk', 590, 160)}
                ${hedef('koltuk', 556, 336)}${hedef('gidi', 660, 318)}${hedef('gobekdeligi', 660, 436)}`;
            }
        },
        // ---- 2026-10-27 (kullanıcı: "daha fazla hayvan koy, az hapşırık hayvanı var") — 4 yeni, her biri ayrı gövde biçimi.
        // Emojiler eski tabletlerde de çıkanlardan (🪶 🦣 🪰 🧊 gibi yeni emojiler kare görünüyordu).
        timsah: {
            ad: 'Uykucu Timsah', ikon: '🐊', perde: .9, ten: '#5f9a5a', koyu: '#22401f', karin: '#e3e6a8', kuyrukSoz: 'kuyruk şap!',
            yer: 'NEHİR GEÇİDİ', gok: ['#1b2a2a', '#4b6d5c'], zemin: ['#55683a', '#76894a'],
            bolge: { burun: 'BURUN', gobek: 'GÖBEK', ayak: 'PENÇE', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'cene', ad: 'ÇENE', iy: 'çenesi', emoji: '😆' }, { yer: 'sirt', ad: 'SIRT', iy: 'sırtı', emoji: '🙃' }],
            ruya: ['🐟', 'balııık...'], karisik: ['🥒', 'Balık SALATALIK oldu!'], ruyaXY: [450, 255],
            hapsirik: { cesit: 'kabarcik', renk: ['#bfeeff', '#d8fff0', '#9fe3d0'] },
            agiz: { uyku: 'M334 452 Q440 468 556 462', ha: 'M336 454 Q440 460 552 458', acik: 'M342 450 Q440 504 556 466 Q440 470 342 450Z', utanc: 'M520 460 a10 7 0 1 0 20 0 a10 7 0 1 0 -20 0', gulumse: 'M332 448 Q440 482 558 458' },
            arka() {
                return `<path d="M520 500 Q530 250 750 232 Q965 245 975 500Z" fill="#3b4a3a"/><path d="M560 500 Q565 285 750 272 Q935 282 940 500Z" fill="#0f1a16"/>
                    ${[[540, 300], [600, 255], [690, 238], [800, 240], [890, 262], [950, 310]].map((p) => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="26" ry="16" fill="#56664f"/>`).join('')}`;
            },
            isikXY: [748, 400],
            svg(c) {
                let pul = ''; for (let x = 520; x <= 880; x += 30) pul += `<path d="M${x - 12} ${396 + Math.abs(x - 700) * .05} l12 -20 l12 20z" fill="${c.koyu}"/>`;
                return `<g ${og('hps-kuyruk', 900, 460)}><path d="M880 432 Q960 446 998 490 Q940 482 880 478Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>${[920, 950].map((x) => `<path d="M${x - 8} ${448 + (x - 920) * .5} l8 -14 l8 14z" fill="${c.koyu}"/>`).join('')}</g>
                <ellipse cx="822" cy="484" rx="32" ry="20" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-nefes', 690, 500)} class="hps-nefes"><g ${og('hps-govde', 690, 500)}>${pul}
                  <ellipse cx="690" cy="446" rx="232" ry="56" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="690" cy="474" rx="200" ry="20" fill="${c.karin}"/>
                  ${[560, 620, 680, 740, 800].map((x) => `<path d="M${x} 418 q20 -10 40 0" stroke="${c.koyu}" stroke-width="2.5" fill="none" opacity=".35"/>`).join('')}</g></g>
                <g ${og('hps-ayak', 560, 488)}><ellipse cx="560" cy="484" rx="34" ry="20" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>${[536, 552, 568].map((x) => `<path d="M${x} 498 l-6 8 h12z" fill="#f5efd8"/>`).join('')}</g>
                <g ${og('hps-bas', 470, 450)}>
                  <path d="M566 398 Q470 388 336 416 Q300 428 312 452 Q430 464 566 462Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5" stroke-linejoin="round"/>
                  <path d="M318 456 Q430 478 566 474 L566 462 Q430 464 318 452Z" fill="${c.karin}" stroke="${c.koyu}" stroke-width="3"/>
                  ${[350, 380, 410, 440, 470, 500, 530].map((x) => `<path d="M${x} 456 l6 9 l6 -9z" fill="#fff"/>`).join('')}
                  <circle cx="470" cy="398" r="20" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/><circle cx="516" cy="394" r="20" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                  <ellipse cx="440" cy="414" rx="50" ry="8" fill="#fff" opacity=".13"/>
                  <g ${og('hps-burun', 326, 428)}><ellipse cx="324" cy="424" rx="6" ry="4" fill="${c.koyu}"/><ellipse cx="338" cy="420" rx="6" ry="4" fill="${c.koyu}"/></g>
                  ${balon(304, 420, 20)}
                  <ellipse id="hps-yanak" cx="530" cy="440" rx="18" ry="9" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([470, 396], [516, 392], 11, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(560, 350)}
                </g>
                ${hedef('burun', 324, 426)}${hedef('gobek', 690, 474)}${hedef('ayak', 560, 488)}${hedef('kuyruk', 958, 476)}
                ${hedef('koltuk', 612, 474)}${hedef('cene', 430, 470)}${hedef('sirt', 720, 394)}`;
            }
        },
        kaplumbaga: {
            ad: 'Koca Kabuk', ikon: '🐢', perde: .75, ten: '#7aa05a', koyu: '#2f441f', karin: '#e3d39a', kuyrukSoz: 'kuyrukçuk!',
            yer: 'KUMSAL YOLU', gok: ['#2a3352', '#b9806a'], zemin: ['#d6bd86', '#ead6a4'],
            bolge: { burun: 'BURUN', gobek: 'KABUK ALTI', ayak: 'AYAK', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'boyun', ad: 'BOYUN', iy: 'boynu', emoji: '😆' }, { yer: 'koltuk', ad: 'KOLTUK ALTI', iy: 'koltuk altı', emoji: '🤭' }, { yer: 'tepe', ad: 'KABUK TEPESİ', iy: 'kabuk tepesi', emoji: '🙃' }],
            ruya: ['🍓', 'çileeek...'], karisik: ['🌶️', 'Çilek BİBER oldu!'], ruyaXY: [440, 205],
            hapsirik: { cesit: 'toz', renk: ['#f1dfae', '#e6cc8e', '#fff2cf'] },
            agiz: { uyku: 'M380 420 q20 8 40 0', ha: 'M382 420 h36', acik: 'M384 414 a16 12 0 1 0 32 0 a16 12 0 1 0 -32 0', utanc: 'M392 418 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0', gulumse: 'M378 414 q22 18 44 0' },
            arka() {
                return `<path d="M530 500 Q540 230 750 215 Q965 230 975 500Z" fill="#8a6a52"/><path d="M570 500 Q575 270 750 258 Q930 268 935 500Z" fill="#2c1f19"/>
                    <path d="M990 500 Q975 330 1005 200" fill="none" stroke="#6b4a2a" stroke-width="16"/><path d="M1005 200 q-60 -10 -90 30 M1005 200 q-40 -40 -100 -30 M1005 200 q30 -40 -10 -70" fill="none" stroke="#3f6a3a" stroke-width="12" stroke-linecap="round"/>`;
            },
            isikXY: [750, 390],
            svg(c) {
                const kabuk = '#8a6a3a', kabukK = '#4a3418';
                const desen = [[620, 330], [700, 300], [780, 330], [660, 400], [740, 400], [820, 400], [580, 410]].map((p) => `<path d="M${p[0] - 30} ${p[1]} l15 -24 h30 l15 24 l-15 24 h-30z" fill="none" stroke="${kabukK}" stroke-width="4" opacity=".45"/>`).join('');
                return `<g ${og('hps-kuyruk', 930, 470)}><path d="M915 455 l40 16 l-40 12z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3" stroke-linejoin="round"/></g>
                <rect x="822" y="440" width="56" height="58" rx="22" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>
                <g ${og('hps-nefes', 700, 480)} class="hps-nefes"><g ${og('hps-govde', 700, 480)}>
                  <path d="M478 466 Q488 240 700 232 Q912 240 922 466Z" fill="${kabuk}" stroke="${kabukK}" stroke-width="6"/>${desen}
                  <ellipse cx="680" cy="290" rx="90" ry="22" fill="#fff" opacity=".12"/>
                  <rect x="468" y="452" width="464" height="28" rx="14" fill="${c.karin}" stroke="${kabukK}" stroke-width="4"/></g></g>
                <g ${og('hps-ayak', 540, 490)}><rect x="512" y="448" width="58" height="52" rx="22" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4"/>${[524, 540, 556].map((x) => `<ellipse cx="${x}" cy="496" rx="6" ry="4" fill="#f5efd8"/>`).join('')}</g>
                <g ${og('hps-bas', 480, 430)}>
                  <path d="M540 440 Q490 430 440 404" fill="none" stroke="${c.koyu}" stroke-width="58" stroke-linecap="round"/><path d="M540 440 Q490 430 440 404" fill="none" stroke="${c.ten}" stroke-width="50" stroke-linecap="round"/>
                  ${[470, 500].map((x) => `<path d="M${x} ${404 + (x - 470) * .5} q6 14 0 28" stroke="${c.koyu}" stroke-width="2.5" fill="none" opacity=".35"/>`).join('')}
                  <circle cx="420" cy="395" r="58" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="412" cy="428" rx="34" ry="16" fill="${c.karin}"/><ellipse cx="410" cy="358" rx="28" ry="10" fill="#fff" opacity=".15"/>
                  <g ${og('hps-burun', 370, 394)}><ellipse cx="368" cy="388" rx="4" ry="3" fill="${c.koyu}"/><ellipse cx="370" cy="400" rx="4" ry="3" fill="${c.koyu}"/></g>
                  ${balon(350, 384, 20)}
                  <ellipse id="hps-yanak" cx="450" cy="410" rx="16" ry="9" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([404, 376], [444, 372], 12, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(470, 320)}
                </g>
                ${hedef('burun', 366, 394)}${hedef('gobek', 700, 466)}${hedef('ayak', 540, 490)}${hedef('kuyruk', 940, 470)}
                ${hedef('boyun', 488, 424)}${hedef('koltuk', 600, 462)}${hedef('tepe', 700, 250)}`;
            }
        },
        balina: {
            ad: 'Uykucu Balina', ikon: '🐳', perde: .6, ten: '#4f7fb8', koyu: '#1f3a63', karin: '#d2e2f2', kuyrukSoz: 'şap şap!',
            yer: 'LİMAN AĞZI', gok: ['#14223a', '#3f6c90'], zemin: ['#1f4f73', '#3a7aa5'],
            bolge: { burun: 'NEFES DELİĞİ', gobek: 'GÖBEK', ayak: 'YÜZGEÇ', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'koltuk', ad: 'YÜZGEÇ ALTI', iy: 'yüzgeç altı', emoji: '🤭' }, { yer: 'cene', ad: 'ÇENE', iy: 'çenesi', emoji: '😆' }, { yer: 'sirt', ad: 'SIRT', iy: 'sırtı', emoji: '🙃' }],
            ruya: ['🦐', 'karideees...'], karisik: ['🍦', 'Karides DONDURMA oldu!'], ruyaXY: [440, 190],
            hapsirik: { cesit: 'kabarcik', renk: ['#cfefff', '#e6f8ff', '#a8dcff'] },
            agiz: { uyku: 'M372 440 Q422 456 482 448', ha: 'M374 442 Q422 446 478 444', acik: 'M382 436 Q426 486 478 446 Q426 452 382 436Z', utanc: 'M430 446 a9 7 0 1 0 18 0 a9 7 0 1 0 -18 0', gulumse: 'M370 436 Q422 470 484 444' },
            arka() {
                return `<rect x="540" y="230" width="34" height="275" fill="#5d6a78"/><rect x="926" y="230" width="34" height="275" fill="#5d6a78"/>
                    <path d="M530 236 Q750 170 970 236" fill="none" stroke="#7a8796" stroke-width="18" stroke-linecap="round"/><path d="M574 500 V248 Q750 196 926 248 V500Z" fill="#0d1b2a"/>
                    <rect x="990" y="150" width="22" height="350" fill="#e9eef3"/><rect x="990" y="190" width="22" height="18" fill="#d94a3a"/><rect x="990" y="250" width="22" height="18" fill="#d94a3a"/><circle cx="1001" cy="140" r="12" fill="#ffe08a"/>`;
            },
            isikXY: [748, 390],
            svg(c) {
                return `<g ${og('hps-kuyruk', 930, 400)}><path d="M900 410 Q940 380 950 330" fill="none" stroke="${c.ten}" stroke-width="40" stroke-linecap="round"/>
                  <path d="M950 330 q-50 -40 -66 -12 q34 0 66 12 q20 -54 50 -40 q-30 14 -50 40z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4" stroke-linejoin="round"/></g>
                <g ${og('hps-nefes', 660, 480)} class="hps-nefes"><g ${og('hps-govde', 660, 480)}>
                  <path d="M360 420 Q370 300 560 296 Q800 296 910 400 Q930 470 860 486 L420 486 Q360 476 360 420Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <path d="M380 452 Q560 500 860 470 L860 486 L420 486 Q380 476 380 452Z" fill="${c.karin}"/>
                  ${[440, 500, 560, 620, 680, 740, 800].map((x) => `<path d="M${x} ${470 + (x > 700 ? -6 : 0)} v12" stroke="${c.koyu}" stroke-width="2.5" opacity=".3"/>`).join('')}
                  <ellipse cx="620" cy="320" rx="120" ry="16" fill="#fff" opacity=".13"/></g></g>
                <g ${og('hps-ayak', 560, 462)}><path d="M540 450 Q580 470 600 510 Q560 498 530 466Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4" stroke-linejoin="round"/></g>
                <g ${og('hps-bas', 440, 420)}>
                  <ellipse cx="430" cy="420" rx="66" ry="58" fill="${c.ten}"/>
                  <g ${og('hps-burun', 520, 302)}><ellipse cx="520" cy="300" rx="14" ry="5" fill="${c.koyu}"/></g>
                  ${balon(520, 280, 18)}
                  <ellipse id="hps-yanak" cx="482" cy="428" rx="18" ry="9" fill="#ff8fa8" opacity=".25"/>
                  ${gozler([414, 398], [456, 394], 11, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(560, 250)}
                </g>
                <rect x="250" y="482" width="820" height="26" fill="#3a7aa5" opacity=".55"/>
                ${[300, 420, 560, 700, 840, 980].map((x) => `<path d="M${x} 484 q14 -8 28 0 q14 8 28 0" fill="none" stroke="#cfe9ff" stroke-width="3" opacity=".6"/>`).join('')}
                ${hedef('burun', 520, 300)}${hedef('gobek', 640, 474)}${hedef('ayak', 572, 478)}${hedef('kuyruk', 960, 330)}
                ${hedef('koltuk', 600, 462)}${hedef('cene', 420, 462)}${hedef('sirt', 720, 304)}`;
            }
        },
        salyangoz: {
            ad: 'Mışıl Salyangoz', ikon: '🐌', perde: 1.2, ten: '#f0b77a', koyu: '#7a4a22', karin: '#ffe0b8', kuyrukSoz: 'kuyruk kıvrıl!',
            yer: 'BAHÇE KAPISI', gok: ['#22304a', '#6a8fb0'], zemin: ['#4a7a3a', '#6a9a4a'],
            bolge: { burun: 'BURUN', gobek: 'KARIN', ayak: 'TABAN', kuyruk: 'KUYRUK' },
            gizliler: [{ yer: 'anten', ad: 'ANTEN', iy: 'anteni', emoji: '😆' }, { yer: 'kabuk', ad: 'KABUK ORTASI', iy: 'kabuk ortası', emoji: '🙃' }, { yer: 'yanak', ad: 'YANAK', iy: 'yanağı', emoji: '😊' }],
            ruya: ['🍃', 'yapraaak...'], karisik: ['🍕', 'Yaprak PİZZA oldu!'], ruyaXY: [500, 175],
            hapsirik: { cesit: 'toz', renk: ['#ffe08a', '#ffc2d8', '#fff2b8'] },
            agiz: { uyku: 'M380 440 q16 8 32 0', ha: 'M382 440 h28', acik: 'M384 434 a14 11 0 1 0 28 0 a14 11 0 1 0 -28 0', utanc: 'M390 438 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0', gulumse: 'M378 434 q18 16 36 0' },
            arka() {
                return `<rect x="560" y="250" width="20" height="250" fill="#f2efe6"/><rect x="920" y="250" width="20" height="250" fill="#f2efe6"/>
                    <path d="M560 262 Q750 150 940 262" fill="none" stroke="#5a8a3a" stroke-width="26" stroke-linecap="round"/><path d="M580 500 V274 Q750 178 920 274 V500Z" fill="#14231a"/>
                    ${[[600, 236, '#ff8fb8'], [680, 196, '#ffd23f'], [760, 186, '#ff8fb8'], [840, 200, '#c9a6ff'], [905, 236, '#ffd23f']].map((f) => `<circle cx="${f[0]}" cy="${f[1]}" r="11" fill="${f[2]}"/><circle cx="${f[0]}" cy="${f[1]}" r="4" fill="#fff8d0"/>`).join('')}`;
            },
            isikXY: [750, 390],
            svg(c) {
                const kab = '#a27ad8', kabK = '#4e2f7a';
                return `<g ${og('hps-kuyruk', 930, 484)}><path d="M900 470 Q950 478 972 498 L900 500Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="4" stroke-linejoin="round"/></g>
                <g ${og('hps-nefes', 680, 490)} class="hps-nefes"><g ${og('hps-govde', 680, 490)}>
                  <path d="M400 500 Q390 450 450 440 L880 456 Q920 470 916 500Z" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5" stroke-linejoin="round"/>
                  <path d="M450 470 L880 478" stroke="${c.karin}" stroke-width="14" stroke-linecap="round"/>
                  <circle cx="700" cy="330" r="140" fill="${kab}" stroke="${kabK}" stroke-width="6"/>
                  <path d="M700 330 m-18 0 a18 18 0 1 1 36 0 a36 36 0 1 1 -72 0 a54 54 0 1 1 108 0 a72 72 0 1 1 -144 0 a90 90 0 1 1 180 0 a104 104 0 1 1 -208 0" fill="none" stroke="${kabK}" stroke-width="7" opacity=".55" stroke-linecap="round"/>
                  <ellipse cx="660" cy="240" rx="56" ry="18" fill="#fff" opacity=".18"/></g></g>
                <g ${og('hps-ayak', 470, 496)}><path d="M420 500 q12 -12 24 0 q12 -12 24 0 q12 -12 24 0 q12 -12 24 0" fill="${c.karin}" stroke="${c.koyu}" stroke-width="3"/></g>
                <g ${og('hps-bas', 420, 440)}>
                  <path d="M398 372 Q388 330 380 300 M428 368 Q432 330 432 292" fill="none" stroke="${c.koyu}" stroke-width="14" stroke-linecap="round"/>
                  <path ${og('hps-kulak', 405, 300)} d="M398 372 Q388 330 380 300 M428 368 Q432 330 432 292" fill="none" stroke="${c.ten}" stroke-width="9" stroke-linecap="round"/>
                  <circle cx="380" cy="296" r="15" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3"/><circle cx="432" cy="288" r="15" fill="${c.ten}" stroke="${c.koyu}" stroke-width="3"/>
                  <ellipse cx="412" cy="412" rx="58" ry="62" fill="${c.ten}" stroke="${c.koyu}" stroke-width="5"/>
                  <ellipse cx="400" cy="378" rx="26" ry="10" fill="#fff" opacity=".2"/>
                  <g ${og('hps-burun', 372, 418)}><ellipse cx="368" cy="414" rx="4" ry="3" fill="${c.koyu}"/><ellipse cx="380" cy="418" rx="4" ry="3" fill="${c.koyu}"/></g>
                  ${balon(350, 410, 18)}
                  <ellipse id="hps-yanak" cx="440" cy="428" rx="16" ry="9" fill="#ff8fa8" opacity=".35"/>
                  ${gozler([380, 296], [432, 288], 10, c.koyu)}
                  <path id="hps-agiz" fill="none" stroke="${c.koyu}" stroke-width="4" stroke-linecap="round"/>
                  ${zzz(470, 270)}
                </g>
                ${hedef('burun', 372, 416)}${hedef('gobek', 560, 476)}${hedef('ayak', 470, 496)}${hedef('kuyruk', 940, 488)}
                ${hedef('anten', 432, 300)}${hedef('kabuk', 700, 330)}${hedef('yanak', 440, 428)}`;
            }
        }
    };
    const TIPLER = ['ejder', 'kurbaga', 'mamut', 'ayi', 'timsah', 'kaplumbaga', 'balina', 'salyangoz'];
    // Gün + yaratık sırası tohumla karışır (her gün başka bir yaratıkla başlar, her cihaz aynı sırayı görür).
    function tipSec(no, tarih) {
        const t = TIPLER.slice(); let h = hash(tarih + '|hps');
        for (let i = t.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; const j = h % (i + 1); [t[i], t[j]] = [t[j], t[i]]; }
        return t[no % t.length];
    }
    function yaratikAdi(st) { const c = Y[st.tip]; const tur = Math.floor(st.no / TIPLER.length); return c.ad + (tur ? ' ' + ['', 'II', 'III', 'IV', 'V'][Math.min(4, tur)] : ''); }

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_hapsirik_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    // Gereken gıdık: sınıftaki her çocuktan ~1 seri. Çocuğun ok ortalaması (son 30 seri, Canavar'la aynı ölçü) beklenen
    // gıdığı belirler; hiç kaydı olmayan için 6. Her sonraki yaratık %15 daha gıdıklanmaz. Oyun Ayarları › Hapşırık seviyesi
    // (hapsirikSeri, kişi başı seri; standart 1) bunu çarpar.
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.hapsirikSeri > 0) ? a.hapsirikSeri : 1; } catch (e) { return 1; } }
    function gerekliHesapla(no) {
        let top = 0; const k = seviye();
        liste().forEach((s) => { let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { } top += 3 * (4 + o * 1.1); });
        return Math.round(Math.max(60 * k, top * k) * (1 + .15 * no));
    }
    function yeniYaratik(st, no) {
        st.no = no; st.tip = tipSec(no, st.tarih); st.gerekli = gerekliHesapla(no); st.gidik = 0; st.sahte = false; st.katki = {};
        const g = Y[st.tip].gizliler; st.gizli = { yer: g[hash(st.tarih + '|' + no + '|g') % g.length].yer, deger: 5 + hash(st.tarih + '|' + no + '|d') % 4 }; st.bulan = null;
    }
    function durum() {
        // Her okumada depodan bakılır: km-ortak başka cihazın yazdığını getirmiş olabilir (değişmediyse ayrıştırılmaz).
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !Y[_st.tip]) { _st = { tarih: bugun(), hapsirtanlar: [], seri: 0 }; yeniYaratik(_st, 0); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function gizliBilgi(st) { return Y[st.tip].gizliler.find((x) => x.yer === st.gizli.yer) || Y[st.tip].gizliler[0]; }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.hapsirik = o.hapsirik || {}; o.hapsirik[alan] = (o.hapsirik[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---------------- ÇİZİM ---------------- */
    let _aktifTip = 'ejder', _zaman = [], _toren = false;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-hapsirik'); }
    const T = 'translate(208 112) scale(.8)'; // yerel yaratık çerçevesi (x 290..990) → sahnede x 440..1000
    // Çocuklar sol üstteki tepede (skor kutusu varsayılan olarak sol altta — Canavar gibi); 6'şarlı sıralar, arka sıra yukarıda.
    function cocukXY(i) { const satir = Math.floor(i / 6), sutun = i % 6; return { x: 34 + sutun * 50 + (satir % 2) * 25, y: 205 - satir * 50 }; }
    function sahneHTML(st) {
        const c = Y[st.tip], gb = gizliBilgi(st);
        let cocuk = '';
        liste().map((s, i) => [s, i]).reverse().forEach(([s, i]) => {
            const p = cocukXY(i), renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('hapsirik', i) : '#ffd23f';
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 40) : `<circle cy="-18" r="16" fill="${renk}"/>`;
            cocuk += `<g class="hps-cocuk" id="hps-c${i}" data-km-sporcu="${i}" data-dy="${488 - p.y}" style="transition:transform 2s ease-in-out ${i * .12}s,opacity .6s ease ${1.6 + i * .12}s"><g transform="translate(${p.x} ${p.y})"><g class="hps-ci">${kar}</g>
                <circle class="hps-halka" cx="0" cy="-20" r="25" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="hps-ad-yazi" y="15" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#1b2233" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        return `<svg id="hps-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="hps-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.gok[0]}"/><stop offset="1" stop-color="${c.gok[1]}"/></linearGradient>
          <radialGradient id="hps-isikg" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#ffe7a8"/><stop offset=".5" stop-color="#e8b860" stop-opacity=".7"/><stop offset="1" stop-color="#e8b860" stop-opacity="0"/></radialGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#hps-gok)"/>
          ${[[90, 70], [180, 130], [300, 60], [420, 110], [560, 50], [640, 90], [760, 40], [880, 70], [60, 200]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity="${st.tip === 'ayi' ? .35 : .6}"/>`).join('')}
          ${st.tip === 'mamut' ? [[120, 300], [260, 250], [380, 320]].map((p) => `<path d="M${p[0] - 90} 500 L${p[0]} ${p[1]} L${p[0] + 90} 500Z" fill="#cfe2ef" opacity=".25"/>`).join('') : ''}
          ${st.tip === 'kurbaga' ? [140, 200, 330, 390].map((x, i) => `<path d="M${x} 500 q${4 + i} -60 ${-6 + i * 3} -${90 + i * 12}" stroke="#2f5a4c" stroke-width="5" fill="none"/><ellipse cx="${x - 6 + i * 3}" cy="${410 - i * 12}" rx="6" ry="16" fill="#5a4330"/>`).join('') : ''}
          ${st.tip === 'ayi' ? [70, 150, 260, 350].map((x, i) => `<path d="M${x} ${180 + (i % 2) * 40} l50 140 h-100z M${x} ${240 + (i % 2) * 40} l60 150 h-120z" fill="#122a1a" opacity=".8"/><rect x="${x - 7}" y="${380 + (i % 2) * 40}" width="14" height="${130 - (i % 2) * 40}" fill="#24180e"/>`).join('') : ''}
          <rect x="-400" y="500" width="1800" height="260" fill="${c.zemin[0]}"/><rect x="-400" y="500" width="1800" height="7" fill="${c.zemin[1]}"/>
          ${st.tip === 'kurbaga' ? '<rect x="-400" y="516" width="1800" height="44" fill="#2a4f5e" opacity=".7"/>' : ''}
          <g transform="${T}">
            ${c.arka()}
            <ellipse id="hps-isik" cx="${c.isikXY[0]}" cy="${c.isikXY[1]}" rx="190" ry="160" fill="url(#hps-isikg)" opacity="0" style="transition:opacity 1.5s"/>
            <text x="748" y="${({ mamut: 176, ayi: 104, kurbaga: 150 })[st.tip] || 132}" text-anchor="middle" font-size="20" font-weight="700" fill="#fff" opacity=".6">${c.yer}</text>
            <g id="hps-yaratik" style="transform-box:view-box;transform-origin:690px 500px;transition:transform 1.8s ease-in-out"><g ${og('hps-yuvarlan', 690, 500)}>${c.svg(c)}<g id="hps-gizli-iz"></g></g></g>
            <g id="hps-ruya" style="transform-box:view-box;transform-origin:${c.ruyaXY[0]}px ${c.ruyaXY[1]}px;transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .35s">
              <g fill="#fff" opacity=".92" transform="translate(${c.ruyaXY[0]} ${c.ruyaXY[1]}) scale(1.15) translate(-332 -225)"><circle cx="430" cy="312" r="7" opacity=".9"/><circle cx="405" cy="288" r="11" opacity=".9"/><circle cx="300" cy="215" r="44"/><circle cx="350" cy="200" r="50"/><circle cx="392" cy="225" r="38"/><circle cx="335" cy="250" r="40"/><circle cx="268" cy="245" r="32"/></g>
              <g ${og('hps-ruya-ic', c.ruyaXY[0], c.ruyaXY[1])}><text id="hps-ruya-emoji" x="${c.ruyaXY[0]}" y="${c.ruyaXY[1] - 4}" text-anchor="middle" font-size="46">${c.ruya[0]}</text><g id="hps-ruya-tuy" opacity="0" transform="translate(${c.ruyaXY[0] + 40} ${c.ruyaXY[1] - 46}) scale(.9)">${TUY_SVG_IC}</g></g>
              <text id="hps-ruya-yazi" x="${c.ruyaXY[0]}" y="${c.ruyaXY[1] + 22}" text-anchor="middle" font-size="14" font-weight="800" fill="#4a4550"></text>
            </g>
            <g id="hps-hapsu"></g>
          </g>
          <path d="M-400 560 V226 Q60 180 190 194 Q320 210 430 284 V560Z" fill="${c.zemin[0]}" opacity=".92"/><path d="M-400 226 Q60 180 190 194 Q320 210 430 284" fill="none" stroke="${c.zemin[1]}" stroke-width="6"/>
          <g id="hps-cocuklar">${cocuk}</g>
        </svg>
        <div class="hps-hud"><div class="hps-hud-ust"><span class="hps-ad" id="hps-ad"></span><span class="hps-cip" id="hps-gizli-cip"></span>
          <button class="hps-btn" id="hps-ses-btn" title="Ses">🔊</button><button class="hps-btn" id="hps-nasil-btn" title="Nasıl oynanır?">❓</button><button class="hps-btn" id="hps-yeni-btn" title="Yeni yaratık">🔄</button></div>
          <div class="hps-bar"><i id="hps-bar-ic"></i><span id="hps-bar-yazi"></span></div></div>
        <div class="hps-ust" id="hps-ust"></div>
        <div class="hps-dev" id="hps-dev"></div>`;
    }
    function hpsSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false;
        const st = durum(); _aktifTip = st.tip; const c = Y[st.tip];
        p.innerHTML = sahneHTML(st);
        p.dataset.tip = st.tip;
        agiz('uyku');
        ruyaAsamaUygula(st, true);
        if (st.bulan) gizliIzCiz(st);
        $('hps-ses-btn').onclick = () => { try { localStorage.setItem('dag_hps_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.ruya(); };
        $('hps-nasil-btn').onclick = nasil;
        $('hps-yeni-btn').onclick = yeniOyunSor;
        hudCiz(); hpsGuncelle();
        clearInterval(_horT); _sonVurus = Date.now();
        _horT = setInterval(() => {
            if (!panel() || !panel().isConnected || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'hapsirik') || (typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme !== 'oyunlar')) { clearInterval(_horT); return; }
            if (!_toren && Date.now() - _sonVurus > 4000) SES.horla();
        }, 3400);
        void c;
    }
    let _horT = null, _sonVurus = 0;
    function hudCiz() {
        const st = durum(), c = Y[st.tip], gb = gizliBilgi(st), y = Math.min(100, Math.round(st.gidik));
        if (!$('hps-ad')) return;
        $('hps-ad').textContent = c.ikon + ' ' + yaratikAdi(st);
        $('hps-gizli-cip').innerHTML = st.bulan ? `${gb.emoji} <b>${st.gizli.deger}</b> = ${gb.ad.toLocaleLowerCase('tr')}` : '🤫 Gizli nokta: <b>?</b>';
        $('hps-bar-ic').style.width = y + '%'; $('hps-bar-yazi').textContent = 'Gıdık %' + y;
        $('hps-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
    }
    // Sıradaki çocuğun halkası (kabuk her sıra değişiminde Resync çağırır)
    let _sonAi = -1;
    function hpsGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        // çocuklar ters sırada çizilir (arka sıra önce) — halka DOM sırasına değil çocuğun kimliğine (hps-c<i>) göre yanar
        // Sıra geçişi görünsün (kullanıcı: "burada geçişlerin olması lazım"): sırası gelen zıplar, adı sarı yanar.
        document.querySelectorAll('#hps-cocuklar .hps-cocuk').forEach((g) => { const aktif = +g.id.slice(5) === ai, h = g.querySelector('.hps-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('hps-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('hps-c' + ai); if (c && c.querySelector('.hps-ci')) { const e = c.querySelector('.hps-ci'); e.classList.remove('hps-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('hps-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function agiz(sekil) { const a = $('hps-agiz'); if (!a) return; const c = Y[_aktifTip]; a.setAttribute('d', c.agiz[sekil] || c.agiz.uyku); a.setAttribute('fill', (sekil === 'acik' || sekil === 'utanc') ? '#5a2620' : 'none'); }
    function goz(n, acik) { const o = $('hps-go' + n), k = $('hps-gk' + n); if (o) o.setAttribute('opacity', acik ? 1 : 0); if (k) k.setAttribute('opacity', acik ? 0 : 1); }
    function anim(id, cls) { const e = $(id); if (!e) return; e.classList.remove(cls); void e.getBoundingClientRect(); e.classList.add(cls); }
    // Yerel/sahne noktası → panel içi piksel
    function nokta(elOrId) {
        const p = panel(), e = typeof elOrId === 'string' ? $(elOrId) : elOrId; if (!p || !e) return { x: 0, y: 0 };
        const r = e.getBoundingClientRect(), pr = p.getBoundingClientRect(); return { x: r.left + r.width / 2 - pr.left, y: r.top + r.height / 2 - pr.top };
    }
    function olcek() { const s = $('hps-svg'); if (!s) return 1; const r = s.getBoundingClientRect(); return Math.min(r.width / 1000, r.height / 560); }
    function pop(t, el, dy, boy, renk) {
        const u = $('hps-ust'); if (!u) return; const p = nokta(el), k = olcek(), d = document.createElement('div');
        d.className = 'hps-pop'; d.textContent = t; d.style.left = p.x + 'px'; d.style.top = (p.y + (dy || 0) * k) + 'px'; d.style.fontSize = Math.max(14, (boy || 26) * k * 1.25) + 'px'; if (renk) d.style.color = renk;
        u.appendChild(d); setTimeout(() => d.remove(), 1400);
    }
    let _balonT = null;
    function konus(t, ms) {
        const u = $('hps-ust'); if (!u) return; let b = $('hps-konus'); if (!b) { b = document.createElement('div'); b.id = 'hps-konus'; b.className = 'hps-konus'; u.appendChild(b); }
        const bs = $('hps-bas'), pn = panel(); if (!bs || !pn) return; const r = bs.getBoundingClientRect(), pr = pn.getBoundingClientRect();
        b.textContent = t; b.style.left = (r.left + r.width * .45 - pr.left) + 'px'; b.style.top = (r.top - pr.top) + 'px'; b.classList.add('goster');
        clearTimeout(_balonT); _balonT = setTimeout(() => b.classList.remove('goster'), ms || 1900);
    }
    function dev(html, ms) { const d = $('hps-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function ucur(i, hedefId, cb) {
        const u = $('hps-ust'), c = $('hps-c' + i), h = $(hedefId); if (!u || !h) { cb(); return; }
        const a = c ? nokta(c.querySelector('.hps-ci') || c) : { x: 40, y: 200 }, b = nokta(h), k = olcek();
        const d = document.createElement('div'); d.className = 'hps-tuy'; const tb = Math.max(22, 46 * k); d.innerHTML = '<svg viewBox="0 0 40 40" width="' + tb + '" height="' + tb + '">' + TUY_SVG_IC + '</svg>'; d.style.left = (a.x - tb / 2) + 'px'; d.style.top = (a.y - tb / 2) + 'px'; u.appendChild(d);
        const dx = b.x - a.x + (Math.random() * 14 - 7) * k, dy = b.y - a.y + (Math.random() * 10 - 5) * k, tep = -Math.max(70, Math.abs(dx) * .28) * k;
        const an = d.animate([{ transform: 'translate(0,0) rotate(-50deg)' }, { transform: `translate(${dx / 2}px,${dy / 2 + tep}px) rotate(0deg)`, offset: .5 }, { transform: `translate(${dx}px,${dy}px) rotate(50deg)` }], { duration: 800, easing: 'ease-in-out' });
        an.onfinish = () => { d.remove(); cb(); };
    }
    // Bulut ~190 birim geniş: 14 harften uzun yazı iki dengeli satıra bölünür (eskiden buluttan taşıyordu).
    function ruyaYazi(yz, t) {
        const x = yz.getAttribute('x'), w = String(t).split(' '); let satir = [t];
        if (t.length > 14 && w.length > 1) { let en = 1, fark = 1e9; for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < fark) { fark = d; en = i; } } satir = [w.slice(0, en).join(' '), w.slice(en).join(' ')]; }
        yz.innerHTML = satir.map((s, i) => '<tspan x="' + x + '" dy="' + (i ? '1.15em' : '0') + '">' + kacis(s) + '</tspan>').join('');
    }
    function ruyaAsamaUygula(st, sessiz) {
        const c = Y[st.tip], o = st.gidik / st.gerekli * 100, a = o >= 66 ? 2 : o >= 33 ? 1 : 0;
        const tuy = $('hps-ruya-tuy'), em = $('hps-ruya-emoji'), yz = $('hps-ruya-yazi'); if (!tuy) return;
        const once = +(($('hps-ruya') || {}).dataset || {}).asama || 0;
        tuy.setAttribute('opacity', a >= 1 ? 1 : 0);
        em.textContent = a >= 2 ? c.karisik[0] : c.ruya[0];
        ruyaYazi(yz, a >= 2 ? c.karisik[1] : a === 1 ? 'hı? bir şey gıdıklıyor...' : c.ruya[1]);
        $('hps-ruya').dataset.asama = a;
        if (!sessiz) { anim('hps-ruya-ic', 'hps-kikir'); if (a === 2 && once < 2) { pop('Rüyası karıştı! 😵', 'hps-ruya-emoji', -70, 24, '#ffe9a8'); SES.ruya(); } }
    }
    function gizliIzCiz(st) { const iz = $('hps-gizli-iz'), h = $('hps-h-' + st.gizli.yer); if (!iz || !h) return; iz.innerHTML = `<text class="hps-parilti" x="${h.getAttribute('cx')}" y="${h.getAttribute('cy')}" text-anchor="middle" font-size="28">✨</text>`; }

    /* ---------------- SERİ İŞLEME ---------------- */
    // Önce DURUM hesaplanır ve kaydedilir (geri al / yenile / diğer cihaz tutarlı), sonra okların görseli oynar.
    function hpsSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); hpsSahneKur(); }
        const st = durum(), key = s.g + '|' + s.ad, olaylar = [];
        let hapsirdi = null;
        st.seri = (st.seri || 0) + 1;
        (kaydedilecek || []).forEach((k) => {
            const v = String(k.puan), r = halka(v);
            if (hapsirdi) { // aynı seride hapşırtan oktan sonrakiler sıradaki yaratığa sayılır
                if (r !== 'gri') { const ek = (okDeger(v) === st.gizli.deger ? 25 : { sari: 15, kirmizi: 10, mavi: 10, siyahbeyaz: 6 }[r]) * (v === 'X' ? 1.5 : 1); st.gidik = Math.min(st.gerekli * .95, st.gidik + ek); st.katki[key] = (st.katki[key] || 0) + ek; }
                return;
            }
            let yer = r === 'sari' ? 'burun' : r === 'kirmizi' ? 'gobek' : r === 'mavi' ? 'ayak' : r === 'siyahbeyaz' ? 'kuyruk' : null;
            if (okDeger(v) === st.gizli.deger) yer = 'gizli';
            const o = { v: v, yer: yer, ek: 0, gizliYeni: false, sahte: false };
            if (yer) {
                o.ek = (yer === 'gizli' ? (st.bulan ? 20 : 25) : { burun: 15, gobek: 10, ayak: 10, kuyruk: 6 }[yer]) * (v === 'X' ? 1.5 : 1);
                if (yer === 'gizli' && !st.bulan) { st.bulan = key; o.gizliYeni = true; rozetYaz(s.g, s.ad, 'gizli'); }
                st.gidik += o.ek; st.katki[key] = (st.katki[key] || 0) + o.ek;
                if (st.gidik >= st.gerekli) {
                    if (!st.sahte && hash(st.tarih + '|' + st.no + '|' + st.seri) % 2 === 0) { st.sahte = true; st.gidik = Math.round(st.gerekli * .8); o.sahte = true; }
                    else {
                        const kac = Object.entries(st.katki).sort((a, b) => b[1] - a[1])[0];
                        hapsirdi = { tip: st.tip, no: st.no, ad: s.ad, g: s.g, i: i, gizliBulan: st.bulan, enCok: kac ? kac[0] : null, adi: yaratikAdi(st) };
                        st.hapsirtanlar.push({ tip: st.tip, ad: s.ad, g: s.g, t: Date.now() });
                        rozetYaz(s.g, s.ad, 'hapsirtti');
                        yeniYaratik(st, st.no + 1);
                    }
                }
            }
            o.oran = hapsirdi ? 1 : Math.min(1, st.gidik / (st.gerekli || 1));
            olaylar.push(o);
        });
        kaydet();
        // görsel
        if (!panel() || !$('hps-svg')) { try { done(); } catch (e) { } return; }
        _sonVurus = Date.now();
        let n = 0; const hepsi = olaylar.length;
        const bitti = () => {
            const sahte = olaylar.find((x) => x.sahte);
            if (hapsirdi || sahte) _toren = true; // done() sırayı ilerletir → HUD yeni yaratığa geçmesin
            try { done(); } catch (e) { }
            if (hapsirdi) hapsirGoster(hapsirdi, !!sahte);
            else if (sahte) sahteGoster();
        };
        if (!hepsi) { bitti(); return; }
        olaylar.forEach((o, k) => {
            setTimeout(() => {
                SES.tuy();
                const hedefId = o.yer ? 'hps-h-' + (o.yer === 'gizli' ? (_ekranGizli || st.gizli).yer : o.yer) : null;
                const varis = () => { okTepki(o, s, i, hapsirdi); n++; if (n === hepsi) setTimeout(bitti, 350); };
                if (!hedefId) { ucurYere(i, varis); return; }
                ucur(i, hedefId, varis);
            }, k * 380);
        });
    }
    // Ekrandaki yaratığın gizli yeri (aynı seride hapşırık olursa durum yeni yaratığa geçer, ekran eskisini gösterir)
    let _ekranGizli = null;
    function ucurYere(i, cb) {
        const u = $('hps-ust'), c = $('hps-c' + i); if (!u) { cb(); return; }
        const tmp = document.createElementNS(NS, 'circle'); const sv = $('hps-svg'); tmp.setAttribute('cx', 360 + Math.random() * 60); tmp.setAttribute('cy', 515); tmp.setAttribute('r', 2); tmp.setAttribute('opacity', 0); sv.appendChild(tmp);
        ucur(i, tmp, () => { tmp.remove(); cb(); }); void c;
    }
    function okTepki(o, s, i, hapsirdi) {
        const c = Y[_aktifTip];
        const yuzde = Math.round(o.oran * 100);
        if ($('hps-bar-ic')) { $('hps-bar-ic').style.width = yuzde + '%'; $('hps-bar-yazi').textContent = 'Gıdık %' + yuzde; }
        if (!o.yer) { SES.pit(); pop('pıt.', 'hps-h-burun', 90, 20, '#cfd6e0'); pop(_aktifTip === 'kurbaga' ? 'VIRAAK... 💤' : 'HORRR... 💤', 'hps-zzz', 10, 26, '#cfe3ff'); anim('hps-balon', 'hps-burun-balon'); setTimeout(SES.horla, 200); return; }
        const st = { gidik: o.oran * 100, gerekli: 100, tip: _aktifTip };
        ruyaAsamaUygula(st);
        if (o.yer === 'gizli') {
            const gy = (_ekranGizli || durum().gizli).yer, gb = c.gizliler.find((x) => x.yer === gy) || c.gizliler[0];
            SES.kahkaha(); anim('hps-yuvarlan', 'hps-kahkaha'); if (gy === 'kulak') anim('hps-kulak', 'hps-kulak-cirp');
            pop('KAHKAHA! 🤣', 'hps-h-' + gy, -90, 34, '#ffe08a');
            if (o.gizliYeni) {
                SES.gizli(); const iz = $('hps-gizli-iz'), h = $('hps-h-' + gy);
                if (iz && h) iz.innerHTML = `<text class="hps-parilti" x="${h.getAttribute('cx')}" y="${h.getAttribute('cy')}" text-anchor="middle" font-size="28">✨</text>`;
                dev(`GİZLİ NOKTA! ${gb.emoji}<small>${kacis(ilkAd(s.ad))} buldu: ${gb.ad.toLocaleLowerCase('tr')} çok gıdıklanıyor · artık her <b>${okDeger(o.v)}</b> buraya gider</small>`, 2600);
                if (!hapsirdi) hudCiz(); else { const cip = $('hps-gizli-cip'); if (cip) cip.innerHTML = `${gb.emoji} <b>${okDeger(o.v)}</b> = ${gb.ad.toLocaleLowerCase('tr')}`; }
            }
        } else if (o.yer === 'burun') { SES.burun(); anim('hps-burun', 'hps-kipir'); pop(rnd(['hı... hıı', 'fıss!', 'hıhh?']), 'hps-h-burun', -50, 28, '#ffd0dc'); const b = $('hps-balon'); if (b) { b.style.display = 'none'; setTimeout(() => { if (b.isConnected && !_toren) b.style.display = ''; }, 2500); } }
        else if (o.yer === 'gobek') { SES.kikir(); anim(_aktifTip === 'kurbaga' ? 'hps-gidi' : 'hps-govde', _aktifTip === 'kurbaga' ? 'hps-sisir' : 'hps-kikir'); pop(rnd(['kıkıkı!', 'hihihi', 'kih kih']), 'hps-h-gobek', -80, 28, '#ffe9a8'); }
        else if (o.yer === 'ayak') { SES.ayak(); anim('hps-ayak', 'hps-ayak-salla'); pop(rnd(['hiii!', 'ayy', 'kıpır kıpır']), 'hps-h-ayak', -60, 24, '#d8f0ff'); }
        else if (o.yer === 'kuyruk') { SES.kuyruk(); anim('hps-kuyruk', _aktifTip === 'kurbaga' ? 'hps-kipir' : 'hps-kuyruk-salla'); pop(c.kuyrukSoz || (_aktifTip === 'ayi' ? 'kulak kıpır!' : _aktifTip === 'kurbaga' ? 'hıhı sırtım!' : 'fış fış'), 'hps-h-kuyruk', -40, 22, '#e8f0d8'); }
        if (o.v === 'X') pop('X! ×1.5', o.yer === 'gizli' ? 'hps-h-' + (_ekranGizli || durum().gizli).yer : 'hps-h-' + o.yer, -110, 22, '#ffe08a');
        if (o.oran >= .5 && o.oran < 1 && Math.random() < .55) { goz(2, true); setTimeout(() => goz(2, false), 800); konus(rnd(['Mmm... kim o?', 'Hıı... rüya mı bu?', 'Beş dakika daha...']), 1500); }
        if (o.oran >= .75 && o.oran < 1) { agiz('ha'); pop('ha...', 'hps-h-burun', -30, 30); }
    }
    function nefesAl() {
        const st = durum(); void st;
        const b = $('hps-balon'); if (b) b.style.display = 'none'; const z = $('hps-zzz'); if (z) z.style.display = 'none';
        pop('ha...', 'hps-h-burun', -40, 34); SES.ha(0);
        sonra(() => { pop('haa...', 'hps-h-burun', -70, 44); SES.ha(1); }, 700);
        sonra(() => { pop('HAAAA...', 'hps-h-burun', -100, 58); SES.ha(2); const n = $('hps-nefes'); if (n) n.setAttribute('class', 'hps-nefes-al'); const bs = $('hps-bas'); if (bs) bs.classList.add('hps-bas-geri'); agiz('acik'); }, 1400);
    }
    function sahteGoster() {
        _toren = true; nefesAl();
        sonra(() => {
            SES.gecti(); const n = $('hps-nefes'); if (n) n.setAttribute('class', 'hps-nefes'); const bs = $('hps-bas'); if (bs) bs.classList.remove('hps-bas-geri'); agiz('uyku');
            pop('...hıh.', 'hps-h-burun', -40, 40, '#cfe3ff');
            sonra(() => { dev('Geçti! 😅<small>Biraz daha gıdıklayın!</small>', 1800); const z = $('hps-zzz'); if (z) z.style.display = ''; _toren = false; hudCiz(); ruyaAsamaUygula(durum(), true); }, 700);
        }, 3200);
    }
    function hapsirGoster(h, sahteOnce) {
        _toren = true; const c = Y[h.tip]; _aktifTip = h.tip;
        const sure = sahteOnce ? 0 : 0; void sure;
        nefesAl();
        sonra(() => {
            const bs = $('hps-bas'); if (bs) { bs.classList.remove('hps-bas-geri'); void bs.getBoundingClientRect(); bs.classList.add('hps-bas-ileri'); }
            const n = $('hps-nefes'); if (n) n.setAttribute('class', '');
            SES.hapsu();
            const r = $('hps-ruya'); if (r) { r.style.transform = 'scale(1.3)'; r.style.opacity = 0; pop('POF!', 'hps-ruya-emoji', 0, 34); }
            dev('HAPŞUUUU!', 1400);
            const w = document.getElementById('km-oyun-sahne') || panel(); w.classList.add('hps-salla'); setTimeout(() => w.classList.remove('hps-salla'), 1100);
            anim('hps-cocuklar', 'hps-savrul');
            const hs = $('hps-hapsu'), bn = $('hps-h-burun'); if (hs && bn) {
                const ox = +bn.getAttribute('cx'), oy = +bn.getAttribute('cy'); let x = '';
                for (let k = 0; k < 28; k++) {
                    const a = Math.PI * (.62 + Math.random() * .76), d = 60 + Math.random() * 300, px = ox + Math.cos(a) * d, py = oy + Math.sin(a) * d * .6, cl = rnd(c.hapsirik.renk), gec = (Math.random() * .25).toFixed(2), og2 = `style="transform-box:view-box;transform-origin:${ox}px ${oy}px;animation-delay:${gec}s"`;
                    if (c.hapsirik.cesit === 'kabarcik') x += `<circle class="hps-bulut" ${og2} cx="${px}" cy="${py}" r="${10 + Math.random() * 22}" fill="${cl}" fill-opacity=".25" stroke="#fff" stroke-width="2.5"/>`;
                    else if (c.hapsirik.cesit === 'yaprak') x += k % 2 ? `<text class="hps-bulut" ${og2} x="${px}" y="${py}" font-size="30">${rnd(['🍂', '🍃', '🍁'])}</text>` : `<circle class="hps-bulut" ${og2} cx="${px}" cy="${py}" r="${14 + Math.random() * 24}" fill="${cl}" opacity=".7"/>`;
                    else { x += `<circle class="hps-bulut" ${og2} cx="${px}" cy="${py}" r="${20 + Math.random() * 34}" fill="${cl}"/>`; if (c.hapsirik.cesit === 'kar' && k % 3 === 0) x += `<text class="hps-bulut" ${og2} x="${px}" y="${py}" font-size="28">❄️</text>`; }
                }
                hs.innerHTML = x;
            }
        }, 3200);
        sonra(() => { const bs = $('hps-bas'); if (bs) bs.classList.remove('hps-bas-ileri'); goz(1, true); goz(2, true); agiz('utanc'); const y = $('hps-yanak'); if (y) y.setAttribute('opacity', .8); konus('...ben mi yaptım onu? 😳', 1800); }, 4500);
        // 🏅 kahraman anı — son tüyü atan
        sonra(() => {
            SES.fanfar(); const ce = $('hps-c' + h.i);
            if (ce) { ce.classList.add('hps-kahraman'); const g = ce.querySelector('g'); if (g) g.insertAdjacentHTML('beforeend', '<text y="-50" text-anchor="middle" font-size="22">👑</text>'); }
            let resim = '';
            try { const s = liste()[h.i]; if (s && typeof kmOyunKarakterBilgi === 'function' && typeof kmOyunHayvanKarakterAta === 'function') resim = `<img class="hps-kahr-img" src="${kmOyunKarakterBilgi(kmOyunHayvanKarakterAta(s)).src}" alt="">`; } catch (e) { }
            dev(`${resim}<br>Hapşırtan: ${kacis(ilkAd(h.ad))}! 🏅<small>Son tüyü o attı · rozet kazandı</small>`);
        }, 6200);
        sonra(() => { SES.cokyasa(); dev('Hep birlikte:<br>ÇOK YAŞA! 🗣️<small>Sınıfça bağırın!</small>'); }, 8800);
        sonra(() => { const d = $('hps-dev'); if (d) d.classList.remove('goster'); agiz('gulumse'); konus('Sağ olun! Buyrun, geçin 😊', 2400); }, 11300);
        sonra(() => { const y = $('hps-yaratik'); if (y) y.style.transform = 'translate(250px,-8px) scale(.82)'; const is = $('hps-isik'); if (is) is.setAttribute('opacity', 1); }, 12800);
        sonra(() => { document.querySelectorAll('#hps-cocuklar .hps-cocuk').forEach((e) => { e.querySelector('.hps-ci').classList.add('hps-hop'); e.style.transform = 'translate(560px,' + (+e.dataset.dy || 0) + 'px)'; e.style.opacity = 0; }); }, 13600);
        sonra(() => {
            const enCok = h.enCok ? liste().find((s) => s.g + '|' + s.ad === h.enCok) : null, bulan = h.gizliBulan ? liste().find((s) => s.g + '|' + s.ad === h.gizliBulan) : null;
            const st = durum(), yeni = Y[st.tip];
            dev(`${c.ikon} ${kacis(h.adi)} hapşırdı! 🎉<small>🏅 Hapşırtan: ${kacis(ilkAd(h.ad))}${enCok ? ' · ✨ En çok gıdıklayan: ' + kacis(ilkAd(enCok.ad)) : ''}${bulan ? ' · ✨ Gizli noktayı bulan: ' + kacis(ilkAd(bulan.ad)) : ''}<br>Sıradaki: ${yeni.ikon} ${kacis(yaratikAdi(st))}</small>`, 5200);
        }, 16000);
        sonra(() => { _toren = false; hpsSahneKur(); SES.geldi(); const p = panel(); if (p) { const y = $('hps-yaratik'); if (y) { y.style.transition = 'none'; y.style.transform = 'translate(420px,0) scale(.7)'; void y.getBoundingClientRect(); y.style.transition = 'transform 1.4s cubic-bezier(.3,1.2,.5,1)'; y.style.transform = ''; } } }, 21400);
    }
    function nasil() {
        const st = durum(), c = Y[st.tip], b = c.bolge;
        dev(`${c.ikon} Hapşırtın!<small style="text-align:left;display:inline-block;max-width:560px">
          ${kacis(c.ad)} yolu kapatmış, uyuyor. Her ok bir tüy olur:<br>
          🟡 Sarı → ${b.burun} (en çok gıdıklar) · 🔴 Kırmızı → ${b.gobek} · 🔵 Mavi → ${b.ayak} · ⚫⚪ Siyah/beyaz → ${b.kuyruk} · Iska → horlar<br>
          🤫 Gizli bir puan var: o puanı atanın tüyü gizli yere gider!<br>Gıdık dolunca HAPŞUUU — sonra hep birlikte <b>ÇOK YAŞA!</b><br><i>(kapatmak için dokun)</i></small>`);
        const d = $('hps-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    function yeniOyunSor() {
        const f = () => { const st = durum(); yeniYaratik(st, st.no + 1); kaydet(); hpsSahneKur(); if (typeof showToast === 'function') showToast('🔄 Yeni yaratık geldi!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Bu yaratık atlansın, sıradaki gelsin mi?<br><small>Gıdık sıfırlanır (sporcuların serileri silinmez).</small>', f, 'Sıradaki gelsin', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function hpsAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function hpsGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _st = k; _stKonum = konum(); kaydet(); if (panel()) hpsSahneKur(); }
    function hpsSporcuGidik(g, ad) { const st = durum(); return Math.round(st.katki[g + '|' + ad] || 0); }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('hps-css')) return;
        const st = document.createElement('style'); st.id = 'hps-css';
        st.textContent = `
.km-oyun-panel-hapsirik{padding:0;background:#1b2233}
.hps-hud{position:absolute;right:12px;top:10px;z-index:1;width:min(440px,52%);display:grid;gap:6px;pointer-events:none}
.hps-hud-ust{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.hps-ad,.hps-cip{background:rgba(16,18,24,.74);color:#f3ede2;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;white-space:nowrap}
.hps-btn{pointer-events:auto;background:rgba(16,18,24,.74);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.hps-bar{position:relative;height:18px;border-radius:999px;background:rgba(16,18,24,.74);overflow:hidden}
.hps-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#d97a9a,#f2b3c8);transition:width .5s}
.hps-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}
.hps-ust{position:absolute;inset:0;pointer-events:none;z-index:2}
/* çocuğa dokununca sıra ona geçer: kabuğun ortak data-km-sporcu dinleyicisi (app.js kmOyunSahneSporcuBul) */
.hps-cocuk{cursor:pointer}
.hps-halka{transition:opacity .3s}.hps-cocuk.hps-aktif .hps-ad-yazi{fill:#ffd23f}
.hps-sira-geldi{transform-box:fill-box;transform-origin:50% 100%;animation:hpsSiraGeldi .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes hpsSiraGeldi{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.18)}100%{transform:translateY(0) scale(1)}}.hps-cocuk:hover .hps-ci{filter:brightness(1.15)}
.hps-tuy{position:absolute;pointer-events:none;line-height:0;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.hps-pop{position:absolute;font-weight:900;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.35);white-space:nowrap;transform:translate(-50%,-50%);animation:hpsPop 1.3s ease-out forwards}
@keyframes hpsPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-120%) scale(1)}}
.hps-konus{position:absolute;background:#fffaf0;color:#2a2018;border-radius:16px;padding:8px 14px;font-weight:800;font-size:clamp(13px,1.6vw,18px);transform:translate(-50%,-100%) scale(.6);opacity:0;transition:.25s;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,.35)}
.hps-konus.goster{opacity:1;transform:translate(-50%,-100%) scale(1)}
.hps-dev{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(30px,6.5vw,84px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.3);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.05;width:92%}
.hps-dev small{display:block;font-size:.3em;font-weight:800;margin-top:8px;color:#ffe9b8;line-height:1.35}
.hps-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
.hps-kahr-img{width:1.6em;height:1.6em;object-fit:contain;filter:drop-shadow(0 0 18px #ffd860)}
.hps-zzzt{animation:hpsZzz 2.4s ease-in-out infinite}
@keyframes hpsZzz{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(24px,-40px)}}
.hps-nefes{animation:hpsNefes 3.2s ease-in-out infinite}
@keyframes hpsNefes{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.04)}}
.hps-nefes-al{animation:hpsNefesAl 1.6s ease-in forwards}
@keyframes hpsNefesAl{to{transform:scale(1.07,1.16)}}
.hps-kipir{animation:hpsKipir .6s ease}
@keyframes hpsKipir{0%,100%{transform:scale(1)}25%{transform:scale(1.35,1.15)}50%{transform:scale(.9)}75%{transform:scale(1.2,1.1)}}
.hps-kikir{animation:hpsKikir .7s ease}
@keyframes hpsKikir{0%,100%{transform:translateY(0)}20%{transform:translateY(-8px)}40%{transform:translateY(0)}60%{transform:translateY(-6px)}80%{transform:translateY(0)}}
.hps-sisir{animation:hpsSisir .9s ease}
@keyframes hpsSisir{0%,100%{transform:scale(1)}30%{transform:scale(1.6,1.9)}60%{transform:scale(1.3,1.5)}}
.hps-ayak-salla{animation:hpsAyak .7s ease}
@keyframes hpsAyak{0%,100%{transform:rotate(0)}25%{transform:rotate(-16deg)}50%{transform:rotate(12deg)}75%{transform:rotate(-8deg)}}
.hps-kuyruk-salla{animation:hpsKuyruk .8s ease}
@keyframes hpsKuyruk{0%,100%{transform:rotate(0)}30%{transform:rotate(-9deg)}60%{transform:rotate(6deg)}}
.hps-kahkaha{animation:hpsKahkaha 1.3s ease}
@keyframes hpsKahkaha{0%,100%{transform:rotate(0)}15%{transform:rotate(-4deg) translateY(-6px)}30%{transform:rotate(3deg)}45%{transform:rotate(-3deg) translateY(-4px)}60%{transform:rotate(2deg)}80%{transform:rotate(-1deg)}}
.hps-kulak-cirp{animation:hpsKulak .25s ease 4}
@keyframes hpsKulak{50%{transform:rotate(-22deg)}}
.hps-parilti{animation:hpsParilti 1.6s ease-in-out infinite}
@keyframes hpsParilti{0%,100%{opacity:.4}50%{opacity:1}}
.hps-bas-geri{transition:transform 1.6s ease-in;transform:rotate(-12deg)}
.hps-bas-ileri{transition:transform .15s ease-out;transform:rotate(9deg)}
.hps-burun-balon{animation:hpsBalon 3.2s ease-in-out infinite}
@keyframes hpsBalon{0%,100%{transform:scale(.25)}50%{transform:scale(1)}}
.hps-bulut{animation:hpsBulut 1.4s ease-out forwards}
@keyframes hpsBulut{0%{transform:scale(.1);opacity:1}60%{opacity:.95}100%{transform:scale(1);opacity:0}}
.hps-savrul{animation:hpsSavrul 1s ease-out}
@keyframes hpsSavrul{0%{transform:translateX(0)}25%{transform:translateX(-24px)}100%{transform:translateX(0)}}
.hps-salla{animation:hpsSalla .1s linear 10}
@keyframes hpsSalla{0%,100%{transform:translate(0,0)}25%{transform:translate(-6px,3px)}75%{transform:translate(6px,-3px)}}
.hps-hop{animation:hpsHop .4s ease-in-out infinite}
@keyframes hpsHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.hps-kahraman .hps-ci{filter:drop-shadow(0 0 10px #ffd860)}
#hps-ruya-ic.hps-kikir{animation:hpsKikir .7s ease}
@media (max-width:700px){.hps-hud{width:62%}.hps-ad,.hps-cip{font-size:12px;padding:4px 9px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-hapsirik *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    // Sahne kurulurken ekrandaki gizli yeri hatırla (aynı seride hapşırık olursa durum yeni yaratığa geçer)
    const _kur = hpsSahneKur;
    window.hpsSahneKur = function (p) { _kur(p); try { _ekranGizli = Object.assign({}, durum().gizli); } catch (e) { } };
    hpsSahneKur = window.hpsSahneKur; // eslint-disable-line no-func-assign
    window.hpsGuncelle = hpsGuncelle;
    window.hpsSeri = hpsSeri;
    window.hpsAnlik = hpsAnlik;
    window.hpsGeriYukle = hpsGeriYukle;
    window.hpsSporcuGidik = hpsSporcuGidik;
    window.hpsYaratiklar = Y;
    // Oyun Ayarları › Hapşırık seviyesi değişince sahnedeki yaratığın gereken gıdığı yeniden hesaplanır (dolu oran korunur).
    window.hpsAyarUygula = function () {
        if (_toren) return; const st = durum(), yeni = gerekliHesapla(st.no); if (!yeni || yeni === st.gerekli) return;
        const oran = Math.min(.98, st.gidik / (st.gerekli || 1)); st.gerekli = yeni; st.gidik = Math.round(oran * yeni); kaydet();
        if (panel() && $('hps-svg')) hpsGuncelle();
    };
})();
