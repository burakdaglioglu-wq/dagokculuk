/* ================================================================================================
   🏰 KALE SAVUNMASI — Karışık Sınıf › Oyunlar teması 'kale' (2026-10-28).
   Kullanıcı üç taslak turundan sonra (heyecan / ödül / koleksiyon) "Kale Savunması"nı seçti: "yap ama domuz olmasın"
   (taslaktaki 🐗 yok). Düşmanlar emoji değil, burada çizilen sevimli SVG'ler (eski tablette emoji kare görünüyordu):
   goblin · yarasa · ork · taş golem · her 3. dalgada ejderha (boss).
   OYUN: Çocuklar kale burçlarında okçu. Düşmanlar sağdan yolda kaleye yürür. Her ok en öndeki düşmana gider: puan = hasar,
   9/10/X kritik ×1,5, X ateşli ok (arkadakine de +5). Her seriden sonra düşmanlar bir adım yaklaşır; kapıya varan kalenin bir
   canını alır (❤️×3). Dalga temizlenince kutlama (son düşüreni 👑) ve daha güçlü dalga gelir. Kale düşerse aynı dalga
   baştan (ceza yok — "hep birlikte tekrar!").
   Denge: dalganın toplam canı = sınıfın beklenen hasarı (her sporcu ~1 seri × Oyun Ayarları › Kale seviyesi); adım boyu
   sınıf kalabalığına göre ölçeklenir (öndeki düşman ~1,6 tur seride kapıya varır).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumunu ve çizimi yönetir:
     kaleSahneKur(panel) · kaleGuncelle() · kaleSeri(s, i, kaydedilecek, done) · kaleAnlik() · kaleGeriYukle(kopya) · kaleSporcuHasar(g, ad)
   DURUM 'dag_km_kale_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL:
     { tarih, dalga, can, dusmanlar[{id,tip,can,max,x,y}], sonId, adim, katki{'g|ad':hasar}, dusuren{'g|ad':adet}, temizlenen, dustu, seri }
   Rozet: sp.oyun.kale = { temizledi, ejderha }.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }

    /* ---------------- SES (WebAudio sentezi; cihaza özel aç/kapa) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_kale_ses') !== '0'; } catch (e) { return true; } }
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
        vin() { hisirti(.3, 3000, 900, .06, 0, 2); },
        vur(k) { ton(k ? 260 : 200, 90, .14, 'square', k ? .12 : .08); hisirti(.1, 1200, 600, .08, 0, 1); },
        iska() { ton(180, 120, .1, 'sine', .06); },
        dus() { ton(520, 140, .3, 'triangle', .1); hisirti(.3, 900, 300, .06, .05, .7); },
        adim() { for (let i = 0; i < 4; i++) ton(90, 70, .07, 'sine', .07, i * .14); },
        kapi() { ton(110, 40, .6, 'sawtooth', .16); hisirti(.5, 400, 100, .2, 0, .6); },
        fanfar() { [523, 659, 784, 1046].forEach((f, i) => ton(f, f, .3, 'triangle', .13, i * .13)); ton(1046, 1046, .6, 'triangle', .12, .55); },
        boru() { [392, 392, 523].forEach((f, i) => ton(f, f, .22, 'sawtooth', .07, i * .2)); },
        ejder() { ton(160, 60, 1.1, 'sawtooth', .12); hisirti(1, 800, 200, .1, 0, .5); }
    };

    /* ---------------- DÜŞMANLAR — (0,0) ayak hizası; hepsi sevimli, korkutucu değil ---------------- */
    function gozler(x1, x2, y, r, gz) { return [x1, x2].map((x) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${gz || '#fff'}"/><circle cx="${x + r * .2}" cy="${y + r * .15}" r="${r * .5}" fill="#1b1b24"/><circle cx="${x - r * .15}" cy="${y - r * .3}" r="${r * .18}" fill="#fff"/>`).join(''); }
    const D = {
        goblin: {
            ad: 'Goblin', agirlik: 1, olcek: 1, ucar: false,
            svg() {
                return `<ellipse cx="0" cy="-2" rx="16" ry="4" fill="#0004"/><rect x="-10" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/><rect x="3" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/>
                  <ellipse cx="0" cy="-26" rx="17" ry="16" fill="#8b5a33"/><ellipse cx="0" cy="-22" rx="11" ry="7" fill="#a8743f"/>
                  <path d="M-15 -50 L-34 -60 L-18 -40Z M15 -50 L34 -60 L18 -40Z" fill="#6fbf5a"/><circle cx="0" cy="-48" r="17" fill="#7fcf66"/>
                  ${gozler(-6, 7, -51, 5)}<path d="M-5 -40 q5 4 10 0" fill="none" stroke="#2d5a24" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M17 -30 l14 -22" stroke="#6b4a2a" stroke-width="6" stroke-linecap="round"/><circle cx="31" cy="-53" r="7" fill="#6b4a2a"/>`;
            }
        },
        yarasa: {
            ad: 'Yarasa', agirlik: .7, olcek: 1, ucar: true,
            svg() {
                return `<ellipse cx="0" cy="70" rx="12" ry="3" fill="#0003"/><g class="kale-kanat"><path d="M-8 -6 Q-30 -26 -44 -6 Q-34 -10 -30 0 Q-22 -8 -16 2Z M8 -6 Q30 -26 44 -6 Q34 -10 30 0 Q22 -8 16 2Z" fill="#6a4aa0"/></g>
                  <ellipse cx="0" cy="-2" rx="14" ry="13" fill="#8a66c4"/><path d="M-10 -12 l-3 -12 l9 7Z M10 -12 l3 -12 l-9 7Z" fill="#8a66c4"/>${gozler(-5, 5, -4, 4, '#fff6a8')}
                  <path d="M-3 5 l2 3 l2 -3 M2 5 l2 3 l2 -3" fill="#fff"/>`;
            }
        },
        ork: {
            ad: 'Ork', agirlik: 1.5, olcek: 1.25, ucar: false,
            svg() {
                return `<ellipse cx="0" cy="-2" rx="20" ry="5" fill="#0004"/><rect x="-13" y="-16" width="10" height="16" rx="4" fill="#5b6e34"/><rect x="3" y="-16" width="10" height="16" rx="4" fill="#5b6e34"/>
                  <rect x="-20" y="-46" width="40" height="34" rx="12" fill="#6f5a48"/><rect x="-20" y="-32" width="40" height="6" fill="#4a3b2e"/>
                  <circle cx="0" cy="-58" r="18" fill="#93b05a"/><path d="M-19 -62 a19 17 0 0 1 38 0Z" fill="#9aa2ad"/><path d="M-18 -66 l-10 -12 l14 4Z M18 -66 l10 -12 l-14 4Z" fill="#e8e0c8"/>
                  ${gozler(-6, 7, -56, 4.5)}<path d="M-8 -46 l3 -5 l3 5 M5 -46 l3 -5 l3 5" fill="#fff"/><path d="M-9 -46 h18" stroke="#3d4d22" stroke-width="2.5" stroke-linecap="round"/>
                  <rect x="-34" y="-46" width="16" height="22" rx="5" fill="#8a6a3a" stroke="#5a4426" stroke-width="2"/>`;
            }
        },
        golem: {
            ad: 'Taş Golem', agirlik: 2, olcek: 1.35, ucar: false,
            svg() {
                return `<ellipse cx="0" cy="-2" rx="24" ry="5" fill="#0004"/><rect x="-18" y="-18" width="14" height="18" rx="5" fill="#7a7f8c"/><rect x="4" y="-18" width="14" height="18" rx="5" fill="#7a7f8c"/>
                  <path d="M-24 -20 Q-28 -52 -8 -58 Q16 -62 24 -44 Q28 -24 20 -18Z" fill="#9aa0ad"/><circle cx="-34" cy="-32" r="10" fill="#8a909c"/><circle cx="34" cy="-34" r="11" fill="#8a909c"/>
                  <path d="M-10 -40 l6 6 l-4 8 M12 -30 l-4 -6" stroke="#6a6f7c" stroke-width="2" fill="none"/><rect x="-14" y="-78" width="28" height="24" rx="8" fill="#a8aebb"/>
                  <circle cx="-6" cy="-67" r="4" fill="#7ff6ff"/><circle cx="6" cy="-67" r="4" fill="#7ff6ff"/><path d="M-12 -40 q12 6 24 0" fill="none" stroke="#5f9e6a" stroke-width="5" opacity=".6"/>`;
            }
        },
        ejderha: {
            ad: 'Ejderha', agirlik: 5, olcek: 2.1, ucar: false, boss: true,
            svg() {
                return `<ellipse cx="0" cy="-2" rx="34" ry="6" fill="#0005"/><g class="kale-kanat"><path d="M-6 -48 Q-46 -96 -66 -64 Q-50 -66 -48 -54 Q-36 -62 -28 -50Z M6 -48 Q46 -96 66 -64 Q50 -66 48 -54 Q36 -62 28 -50Z" fill="#b45ad6" opacity=".9"/></g>
                  <path d="M20 -18 Q46 -10 52 -28 Q54 -36 46 -34" fill="none" stroke="#8e44ad" stroke-width="9" stroke-linecap="round"/><path d="M44 -38 l10 -4 l-4 10Z" fill="#ffd23f"/>
                  <rect x="-16" y="-14" width="11" height="14" rx="4" fill="#7d3c98"/><rect x="5" y="-14" width="11" height="14" rx="4" fill="#7d3c98"/>
                  <ellipse cx="0" cy="-30" rx="24" ry="22" fill="#9b59b6"/><ellipse cx="-2" cy="-26" rx="13" ry="13" fill="#f5d27a"/>
                  <ellipse cx="-14" cy="-62" rx="20" ry="17" fill="#9b59b6"/><ellipse cx="-28" cy="-56" rx="12" ry="9" fill="#a96bc4"/><circle cx="-33" cy="-58" r="2" fill="#4a1f5c"/>
                  <path d="M-20 -77 l-4 -12 l9 8Z M-6 -77 l2 -13 l6 10Z" fill="#ffd23f"/>${gozler(-16, -4, -66, 5)}<path d="M-34 -50 q8 4 14 0" fill="none" stroke="#4a1f5c" stroke-width="2.5" stroke-linecap="round"/>`;
            }
        }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_kale_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.kaleSeri > 0) ? a.kaleSeri : 1; } catch (e) { return 1; } }
    // Dalganın toplam canı: her sporcunun beklenen seri hasarı (ok ortalaması — Canavar'la aynı ölçü; kaydı yoksa 6) × seviye,
    // her dalga %12 daha güçlü. Adım boyu: öndeki düşman ~1,6 × (sınıf × seviye) seride kapıya varır.
    function toplamCan(dalga) {
        let top = 0; const k = seviye();
        liste().forEach((s) => { let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { } top += 3 * o * 1.1; });
        return Math.round(Math.max(40, top) * k * (1 + .12 * (dalga - 1)));
    }
    function adimHesapla() { return Math.max(18, Math.min(140, 600 / (Math.max(3, liste().length) * 1.6 * seviye()))); }
    function dalgaTipleri(dalga) {
        const havuz = ['goblin']; if (dalga >= 2) havuz.push('yarasa'); if (dalga >= 3) havuz.push('ork'); if (dalga >= 4) havuz.push('golem');
        const n = Math.min(8, 3 + Math.floor(dalga / 2)), t = [];
        for (let i = 0; i < n; i++) t.push(i < 2 ? 'goblin' : havuz[(dalga * 7 + i * 3) % havuz.length]);
        if (dalga % 3 === 0) t.push('ejderha');
        return t;
    }
    function yeniDalga(st, dalga) {
        st.dalga = dalga; st.adim = adimHesapla();
        const tipler = dalgaTipleri(dalga), top = toplamCan(dalga), ag = tipler.reduce((a, t) => a + D[t].agirlik, 0);
        st.dusmanlar = tipler.map((t, i) => { const c = Math.max(6, Math.round(top * D[t].agirlik / ag)); return { id: ++st.sonId, tip: t, can: c, max: c, x: 800 + i * 52 + (D[t].boss ? 70 : 0), y: D[t].ucar ? 360 + (i % 2) * 24 : 486 + (i % 2) * 12 }; });
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !Array.isArray(_st.dusmanlar)) { _st = { tarih: bugun(), can: 3, sonId: 0, katki: {}, dusuren: {}, temizlenen: 0, dustu: 0, seri: 0 }; yeniDalga(_st, 1); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.kale = o.kale || {}; o.kale[alan] = (o.kale[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-kale'); }
    const KAPI_X = 360;
    // Çocuklar burçlarda: ön sur (y 210), arkasında daha yüksek iç sur (y 160), en arkada kule (y 110). 6'şarlı sıralar.
    function cocukXY(i) { const satir = Math.floor(i / 6), sutun = i % 6; return { x: 34 + sutun * 50 + (satir % 2) * 25, y: 205 - satir * 50 }; }
    function dusmanSVG(d) {
        const c = D[d.tip], oran = Math.max(0, d.can / d.max);
        return `<g class="kale-dusman" id="kale-d${d.id}" data-tip="${d.tip}" style="transform:translate(${d.x}px,${d.y}px)"><g transform="scale(${c.olcek})"><g class="kale-govde${c.ucar ? ' kale-uc' : ' kale-yuru'}">${c.svg()}</g></g>
          <g transform="translate(0 ${c.ucar ? -30 : -84 * c.olcek})"><rect x="-22" y="0" width="44" height="7" rx="3.5" fill="#0008"/><rect class="kale-can" x="-22" y="0" width="${44 * oran}" height="7" rx="3.5" fill="${oran > .5 ? '#7cf29a' : oran > .25 ? '#ffd23f' : '#ff6b6b'}"/></g></g>`;
    }
    function surHTML() {
        const dis = (y, renk, koyu) => { let m = ''; for (let x = -400; x < 335; x += 30) m += `<rect x="${x}" y="${y - 16}" width="18" height="18" fill="${renk}"/>`; return `<rect x="-400" y="${y}" width="735" height="${560 - y}" fill="${renk}"/>${m}<path d="M-400 ${y + 1} H335" stroke="${koyu}" stroke-width="3"/>`; };
        let tas = ''; for (let y = 240; y < 500; y += 26) for (let x = -400 + ((y / 26) % 2) * 22; x < 293; x += 44) tas += `<rect x="${x}" y="${y}" width="42" height="24" rx="3" fill="none" stroke="#00000018" stroke-width="2"/>`;
        return dis(110, '#5d6478', '#4a5063') + dis(160, '#6f7790', '#5a6178') + dis(210, '#858da6', '#6c7390') + tas
            + '<path d="M250 500 v-64 a36 36 0 0 1 72 0 v64Z" fill="#3a2a1e"/><path d="M256 500 v-60 M268 500 v-70 M280 500 v-72 M292 500 v-72 M304 500 v-70 M316 500 v-60" stroke="#24180f" stroke-width="3"/>'
            + '<rect x="-10" y="40" width="6" height="74" fill="#5a4030"/><path id="kale-bayrak" class="kale-bayrak" d="M-4 42 l46 14 l-46 14Z" fill="#ffd23f"/>';
    }
    function sahneHTML(st) {
        let cocuk = '';
        liste().map((s, i) => [s, i]).reverse().forEach(([s, i]) => {
            const p = cocukXY(i), renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('kale', i) : '#ffd23f';
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 40) : `<circle cy="-18" r="16" fill="${renk}"/>`;
            cocuk += `<g class="kale-cocuk" id="kale-c${i}" data-km-sporcu="${i}"><g transform="translate(${p.x} ${p.y})"><g class="kale-ci">${kar}</g>
                <circle class="kale-halka" cx="0" cy="-20" r="25" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="kale-ad-yazi" y="15" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#1b2233" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        return `<svg id="kale-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="kale-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2d63"/><stop offset=".55" stop-color="#a0527a"/><stop offset="1" stop-color="#ffb06b"/></linearGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#kale-gok)"/>
          <circle cx="800" cy="210" r="70" fill="#ffd9a0" opacity=".75"/>
          <path d="M300 420 L470 260 L580 360 L700 240 L860 400 L1000 300 L1400 420Z" fill="#5a3f6e" opacity=".7"/>
          <path d="M-400 440 Q300 400 600 430 T1400 420 V760 H-400Z" fill="#4f7a44"/>
          <path d="M330 492 Q600 470 1400 486" fill="none" stroke="#b08a5a" stroke-width="46" stroke-linecap="round" opacity=".85"/>
          <g id="kale-dusmanlar">${st.dusmanlar.map(dusmanSVG).join('')}</g>
          <g id="kale-sur">${surHTML()}</g>
          <g id="kale-cocuklar">${cocuk}</g>
          <g id="kale-ucan"></g><g id="kale-pop"></g>
        </svg>
        <div class="kale-hud"><div class="kale-hud-ust"><span class="kale-ad" id="kale-ad"></span><span class="kale-cip" id="kale-canlar"></span>
          <button class="kale-btn" id="kale-ses-btn" title="Ses">🔊</button><button class="kale-btn" id="kale-nasil-btn" title="Nasıl oynanır?">❓</button><button class="kale-btn" id="kale-yeni-btn" title="Baştan başla">🔄</button></div>
          <div class="kale-bar"><i id="kale-bar-ic"></i><span id="kale-bar-yazi"></span></div></div>
        <div class="kale-dev" id="kale-dev"></div>`;
    }
    function kaleSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false;
        const st = durum();
        p.innerHTML = sahneHTML(st);
        $('kale-ses-btn').onclick = () => { try { localStorage.setItem('dag_kale_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.boru(); };
        $('kale-nasil-btn').onclick = nasil;
        $('kale-yeni-btn').onclick = yeniOyunSor;
        _sonAi = -1; hudCiz(); kaleGuncelle();
    }
    let _ekranHud = null; // tören sırasında HUD ekrandaki (eski) dalgayı gösterir
    function hudCiz() {
        if (!$('kale-ad')) return;
        const st = _ekranHud || durum(), kalan = st.dusmanlar.length, top = st.dusmanlar.reduce((a, d) => a + d.max, 0) || 1, can = st.dusmanlar.reduce((a, d) => a + Math.max(0, d.can), 0);
        $('kale-ad').textContent = '🏰 Dalga ' + st.dalga + (dalgaTipleri(st.dalga).indexOf('ejderha') >= 0 ? ' · 🐲' : '');
        $('kale-canlar').textContent = [0, 1, 2].map((i) => i < st.can ? '❤️' : '🖤').join('');
        const y = Math.round((1 - can / top) * 100);
        $('kale-bar-ic').style.width = y + '%'; $('kale-bar-yazi').textContent = kalan ? `Kalan düşman ${kalan} · %${y}` : 'Dalga temiz!';
        $('kale-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
    }
    let _sonAi = -1;
    function kaleGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#kale-cocuklar .kale-cocuk').forEach((g) => { const aktif = +g.id.slice(6) === ai, h = g.querySelector('.kale-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('kale-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('kale-c' + ai), e = c && c.querySelector('.kale-ci'); if (e) { e.classList.remove('kale-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('kale-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('kale-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 24, 'font-weight': 900, fill: renk || '#fff', stroke: '#1b1230', 'stroke-width': 4, 'paint-order': 'stroke', class: 'kale-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1500);
    }
    function dev(html, ms) { const d = $('kale-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function anim(e, cls) { if (!e) return; e.classList.remove(cls); void e.getBoundingClientRect(); e.classList.add(cls); }
    function hedefNokta(d) { const c = D[d.tip]; return { x: d.x, y: d.y - (c.ucar ? 0 : 34 * c.olcek) }; }
    // Ok: çocuğun yerinden yay çizerek hedefe uçar; ucu gidiş yönüne döner (SVG birimleriyle, ölçek gerekmez)
    function okUcur(i, x, y, ates, cb) {
        const g = $('kale-ucan'); if (!g) { cb(); return; }
        const a = cocukXY(i); a.y -= 26;
        const o = svgEl('g', {}, g), ic = svgEl('g', {}, o);
        svgEl('path', { d: 'M-22 0 H14', stroke: ates ? '#ff9f43' : '#f4e2c0', 'stroke-width': 4, 'stroke-linecap': 'round' }, ic);
        svgEl('path', { d: 'M14 -6 L26 0 L14 6Z', fill: ates ? '#ff5f1f' : '#c9ced9' }, ic); svgEl('path', { d: 'M-22 0 l-8 -6 M-22 0 l-8 6', stroke: '#ff8fa8', 'stroke-width': 3 }, ic);
        if (ates) svgEl('circle', { cx: 22, cy: 0, r: 9, fill: '#ffb347', opacity: .6 }, ic);
        const tep = Math.min(a.y, y) - 90 - Math.abs(x - a.x) * .08, n = 14, kare = [];
        for (let k = 0; k <= n; k++) {
            const t = k / n, px = a.x + (x - a.x) * t, py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * tep + t * t * y;
            const dx = (x - a.x), dy = 2 * (1 - t) * (tep - a.y) + 2 * t * (y - tep);
            kare.push({ transform: `translate(${px}px,${py}px) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)` });
        }
        const an = o.animate(kare, { duration: 560, easing: 'linear' });
        an.onfinish = () => { o.remove(); cb(); };
    }

    /* ---------------- SERİ İŞLEME ---------------- */
    // Önce DURUM hesaplanır ve kaydedilir (geri al / yenile / diğer cihaz tutarlı), sonra görsel oynar.
    function kaleSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); kaleSahneKur(); }
        const st = durum(), key = s.g + '|' + s.ad, olaylar = [];
        st.seri = (st.seri || 0) + 1;
        let temiz = null, dustu = false;
        (kaydedilecek || []).forEach((k) => {
            const v = String(k.puan), d = okDeger(v);
            const on = st.dusmanlar.slice().sort((a, b) => a.x - b.x)[0];
            if (!on || temiz) return;
            if (!d) { olaylar.push({ tur: 'iska', id: on.id }); return; }
            const kritik = d >= 9, hasar = Math.round(d * (kritik ? 1.5 : 1));
            on.can -= hasar; st.katki[key] = (st.katki[key] || 0) + hasar;
            const o = { tur: 'ok', id: on.id, hasar: hasar, kritik: kritik, ates: v === 'X', oldu: [] };
            if (o.ates) { const arka = st.dusmanlar.filter((x) => x !== on).sort((a, b) => a.x - b.x)[0]; if (arka) { arka.can -= 5; o.arka = arka.id; st.katki[key] += 5; } }
            st.dusmanlar.filter((x) => x.can <= 0).forEach((x) => { o.oldu.push(x.id); st.dusuren[key] = (st.dusuren[key] || 0) + 1; if (x.tip === 'ejderha') { rozetYaz(s.g, s.ad, 'ejderha'); o.ejder = true; } });
            st.dusmanlar = st.dusmanlar.filter((x) => x.can > 0);
            o.durum = st.dusmanlar.map((x) => ({ id: x.id, can: x.can, max: x.max }));
            olaylar.push(o);
            if (!st.dusmanlar.length) {
                const sira = Object.entries(st.dusuren).sort((a, b) => b[1] - a[1])[0];
                temiz = { dalga: st.dalga, ad: s.ad, g: s.g, i: i, enCok: sira ? sira[0] : null };
                st.temizlenen = (st.temizlenen || 0) + 1; rozetYaz(s.g, s.ad, 'temizledi');
                _ekranHud = { dalga: st.dalga, can: st.can, dusmanlar: [] };
                yeniDalga(st, st.dalga + 1);
            }
        });
        // dalga sürüyorsa düşmanlar bir adım yaklaşır; kapıya varan kalenin canını alır
        let adim = null;
        if (!temiz) {
            const varan = [];
            st.dusmanlar.forEach((d) => { d.x = Math.max(KAPI_X, d.x - st.adim * (D[d.tip].ucar ? 1.3 : 1)); if (d.x <= KAPI_X) varan.push(d.id); });
            st.dusmanlar = st.dusmanlar.filter((d) => varan.indexOf(d.id) < 0);
            st.can -= varan.length;
            adim = { konum: st.dusmanlar.map((d) => ({ id: d.id, x: d.x, y: d.y })), varan: varan };
            if (st.can <= 0) { dustu = { dalga: st.dalga }; st.dustu = (st.dustu || 0) + 1; st.can = 3; _ekranHud = { dalga: st.dalga, can: 0, dusmanlar: [] }; yeniDalga(st, st.dalga); }
        }
        kaydet();
        if (!panel() || !$('kale-svg')) { _ekranHud = null; try { done(); } catch (e) { } return; }
        let n = 0; const hepsi = olaylar.length;
        const bitti = () => {
            if (temiz || dustu) _toren = true;
            if (adim) adimGoster(adim, !!dustu);
            sonra(() => { try { done(); } catch (e) { } if (temiz) temizGoster(temiz); else if (dustu) dustuGoster(); }, adim ? 700 : 100);
        };
        if (!hepsi) { bitti(); return; }
        olaylar.forEach((o, k) => {
            setTimeout(() => {
                // hedefin EKRANDAKİ yeri (durum çoktan adım atmış / düşman ölmüş olabilir)
                const e = $('kale-d' + o.id), m = e ? /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform) : null;
                const h = hedefNokta({ x: m ? +m[1] : 700, y: m ? +m[2] : 486, tip: (e && e.dataset.tip) || 'goblin' });
                SES.vin();
                const tx = o.tur === 'iska' ? h.x - 40 - Math.random() * 60 : h.x, ty = o.tur === 'iska' ? 500 : h.y;
                okUcur(i, tx, ty, o.ates, () => { okTepki(o, h, tx, ty); n++; if (n === hepsi) setTimeout(bitti, 350); });
            }, k * 420);
        });
    }
    function okTepki(o, h, x, y) {
        if (o.tur === 'iska') { SES.iska(); pop('ıska', x, y - 20, 20, '#e0d6f0'); const g = $('kale-ucan'); if (g) { const t = svgEl('path', { d: `M${x - 14} ${y} l24 -10`, stroke: '#f4e2c0', 'stroke-width': 4, 'stroke-linecap': 'round' }, g); setTimeout(() => t.remove(), 1500); } return; }
        SES.vur(o.kritik);
        const e = $('kale-d' + o.id); if (e) anim(e.querySelector('.kale-govde'), 'kale-vurul');
        pop((o.kritik ? '💥 ' : '') + '-' + o.hasar, h.x, h.y - 40, o.kritik ? 30 : 24, o.kritik ? '#ffd23f' : '#fff');
        if (o.ates) { pop('🔥 ATEŞLİ OK!', h.x, h.y - 80, 22, '#ff9f43'); if (o.arka) { const a = $('kale-d' + o.arka); if (a) anim(a.querySelector('.kale-govde'), 'kale-vurul'); } }
        (o.durum || []).forEach((d) => { const b = document.querySelector('#kale-d' + d.id + ' .kale-can'); if (b) { const r = Math.max(0, d.can / d.max); b.setAttribute('width', 44 * r); b.setAttribute('fill', r > .5 ? '#7cf29a' : r > .25 ? '#ffd23f' : '#ff6b6b'); } });
        o.oldu.forEach((id) => { const d = $('kale-d' + id); if (!d) return; SES.dus(); d.classList.add('kale-ol'); setTimeout(() => d.remove(), 600); });
        if (o.ejder) { SES.ejder(); dev('🐲 EJDERHA DÜŞTÜ!', 1800); }
        if (!_ekranHud) hudCiz(); else ekranHudGuncelle(o);
    }
    function ekranHudGuncelle(o) {
        const bar = $('kale-bar-ic'); if (bar && !(o.durum || []).length) { bar.style.width = '100%'; $('kale-bar-yazi').textContent = 'Dalga temiz!'; }
    }
    function adimGoster(a, dustu) {
        SES.adim();
        a.konum.forEach((d) => { const e = $('kale-d' + d.id); if (e) e.style.transform = `translate(${d.x}px,${d.y}px)`; });
        a.varan.forEach((id) => { const e = $('kale-d' + id); if (!e) return; e.style.transform = `translate(${KAPI_X}px,${e.style.transform.match(/,\s*([-\d.]+)px/)[1]}px)`; setTimeout(() => { e.classList.add('kale-ol'); setTimeout(() => e.remove(), 600); }, 650); });
        if (a.varan.length) {
            setTimeout(() => {
                SES.kapi(); const w = document.getElementById('km-oyun-sahne') || panel(); anim(w, 'kale-salla');
                pop(a.varan.length > 1 ? `Kapıya ${a.varan.length} düşman! 💔` : 'Kapıya ulaştı! 💔', 360, 330, 28, '#ff8fa8');
                if (!dustu) hudCiz(); else { const c = $('kale-canlar'); if (c) c.textContent = '🖤🖤🖤'; }
            }, 650);
        } else if (!dustu) setTimeout(hudCiz, 650);
    }
    function temizGoster(h) {
        _toren = true; SES.fanfar();
        dev(`DALGA ${h.dalga} TEMİZ! 🎉`, 2200);
        const b = $('kale-bayrak'); if (b) anim(b, 'kale-bayrak-sevin');
        document.querySelectorAll('#kale-cocuklar .kale-ci').forEach((e, k) => { e.style.animationDelay = (k % 6) * .07 + 's'; e.classList.add('kale-zipla'); });
        sonra(() => {
            const ce = $('kale-c' + h.i); if (ce) { ce.classList.add('kale-kahraman'); const g = ce.querySelector('g'); if (g) g.insertAdjacentHTML('beforeend', '<text y="-50" text-anchor="middle" font-size="22">👑</text>'); }
            const bul = (k) => liste().find((s) => s.g + '|' + s.ad === k), enCok = h.enCok ? bul(h.enCok) : null, st = durum();
            dev(`🏅 Son düşmanı düşüren: ${kacis(ilkAd(h.ad))}!<small>${enCok ? '🏹 Bugün en çok düşüren: ' + kacis(ilkAd(enCok.ad)) + ' · ' : ''}Sıradaki: Dalga ${st.dalga}${dalgaTipleri(st.dalga).indexOf('ejderha') >= 0 ? ' — 🐲 EJDERHA geliyor!' : ''}</small>`, 3600);
        }, 2500);
        sonra(() => { _toren = false; _ekranHud = null; kaleSahneKur(); SES.boru(); const g = $('kale-dusmanlar'); if (g) anim(g, 'kale-geliyor'); }, 6600);
    }
    function dustuGoster() {
        _toren = true; SES.kapi();
        dev('KALE DÜŞTÜ! 😱<small>Hep birlikte tekrar — aynı dalga baştan, kale yine 3 canlı!</small>', 3200);
        sonra(() => { _toren = false; _ekranHud = null; kaleSahneKur(); SES.boru(); const g = $('kale-dusmanlar'); if (g) anim(g, 'kale-geliyor'); }, 3600);
    }
    function nasil() {
        dev(`🏰 Kaleyi koruyun!<small style="text-align:left;display:inline-block;max-width:580px">
          Düşmanlar yoldan kaleye yürüyor. Her ok <b>en öndeki</b> düşmana gider: puan = hasar.<br>
          🟡 9-10 kritik ×1,5 💥 · X ateşli ok 🔥 (arkadakine de vurur) · Iska → ok yere saplanır<br>
          Her seriden sonra düşmanlar bir adım yaklaşır. Kapıya varan kalenin bir canını alır ❤️❤️❤️<br>
          Dalga temizlenince daha güçlüsü gelir — her 3. dalgada 🐲 ejderha!<br><i>(kapatmak için dokun)</i></small>`);
        const d = $('kale-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    function yeniOyunSor() {
        const f = () => { const st = durum(); st.can = 3; yeniDalga(st, 1); kaydet(); kaleSahneKur(); if (typeof showToast === 'function') showToast('🔄 Kale savunması baştan başladı!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Kale savunması 1. dalgadan yeniden başlasın mı?<br><small>Sporcuların serileri silinmez.</small>', f, 'Baştan başla', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function kaleAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function kaleGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _ekranHud = null; _st = k; _stKonum = konum(); kaydet(); if (panel()) kaleSahneKur(); }
    function kaleSporcuHasar(g, ad) { const st = durum(); return st.katki[g + '|' + ad] || 0; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('kale-css')) return;
        const st = document.createElement('style'); st.id = 'kale-css';
        st.textContent = `
.km-oyun-panel-kale{padding:0;background:#3b2d63;overflow:hidden}
.kale-hud{position:absolute;right:12px;top:10px;z-index:1;width:min(440px,52%);display:grid;gap:6px;pointer-events:none}
.kale-hud-ust{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.kale-ad,.kale-cip{background:rgba(20,14,36,.74);color:#f6efff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;white-space:nowrap}
.kale-btn{pointer-events:auto;background:rgba(20,14,36,.74);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.kale-bar{position:relative;height:18px;border-radius:999px;background:rgba(20,14,36,.74);overflow:hidden}
.kale-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff9f43,#ffd23f);transition:width .5s}
.kale-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}
/* çocuğa dokununca sıra ona geçer: kabuğun ortak data-km-sporcu dinleyicisi (app.js kmOyunSahneSporcuBul) */
.kale-cocuk{cursor:pointer}.kale-cocuk:hover .kale-ci{filter:brightness(1.15)}
.kale-halka{transition:opacity .3s}.kale-cocuk.kale-aktif .kale-ad-yazi{fill:#ffd23f}
.kale-sira-geldi,.kale-zipla{transform-box:fill-box;transform-origin:50% 100%}
.kale-sira-geldi{animation:kaleSiraGeldi .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes kaleSiraGeldi{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.18)}100%{transform:translateY(0) scale(1)}}
.kale-zipla{animation:kaleZipla .45s ease-in-out 6}@keyframes kaleZipla{50%{transform:translateY(-14px)}}
.kale-kahraman .kale-ci{filter:drop-shadow(0 0 10px #ffd860)}
/* düşman konumu dış g'nin CSS transform'unda (adım geçişi), iç .kale-govde yürür/sallanır — CSS transform özniteliği ezerdi */
.kale-dusman{transition:transform .6s ease-in-out}
.kale-govde{transform-box:fill-box;transform-origin:50% 100%}
.kale-yuru{animation:kaleYuru .6s ease-in-out infinite}@keyframes kaleYuru{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-3px)}}
.kale-uc{animation:kaleUc 1.6s ease-in-out infinite}@keyframes kaleUc{50%{transform:translateY(-12px)}}
.kale-kanat{animation:kaleKanat .25s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 80%}@keyframes kaleKanat{to{transform:scaleY(.55)}}
.kale-govde.kale-vurul{animation:kaleVurul .35s ease-out}@keyframes kaleVurul{0%{transform:none;filter:none}25%{transform:translateX(12px) rotate(10deg);filter:brightness(2.2)}100%{transform:none;filter:none}}
.kale-ol{animation:kaleOl .55s ease-in forwards}@keyframes kaleOl{to{opacity:0;filter:brightness(3)}}
.kale-geliyor{animation:kaleGeliyor 1.1s ease-out}@keyframes kaleGeliyor{from{transform:translateX(320px);opacity:0}}
.kale-bayrak{transform-box:fill-box;transform-origin:0 50%;animation:kaleBayrak 1.8s ease-in-out infinite}@keyframes kaleBayrak{50%{transform:scaleX(.82) skewY(4deg)}}
.kale-bayrak-sevin{animation:kaleBayrak .3s ease-in-out 10}
.kale-pop{animation:kalePop 1.4s ease-out forwards;transform-box:fill-box;transform-origin:center}
@keyframes kalePop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-50px)}}
.kale-salla{animation:kaleSalla .1s linear 8}@keyframes kaleSalla{0%,100%{transform:translate(0,0)}25%{transform:translate(-6px,3px)}75%{transform:translate(6px,-3px)}}
.kale-dev{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(28px,6vw,80px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.35);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.05;width:92%}
.kale-dev small{display:block;font-size:.3em;font-weight:800;margin-top:8px;color:#ffe9b8;line-height:1.35}
.kale-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (max-width:700px){.kale-hud{width:62%}.kale-ad,.kale-cip{font-size:12px;padding:4px 9px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-kale *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.kaleSahneKur = kaleSahneKur;
    window.kaleGuncelle = kaleGuncelle;
    window.kaleSeri = kaleSeri;
    window.kaleAnlik = kaleAnlik;
    window.kaleGeriYukle = kaleGeriYukle;
    window.kaleSporcuHasar = kaleSporcuHasar;
    window.kaleDusmanlar = D;
    // Oyun Ayarları › Kale seviyesi değişince sahnedeki dalganın canı ve adım boyu yeniden hesaplanır (kalan can oranı korunur).
    window.kaleAyarUygula = function () {
        if (_toren) return; const st = durum(), top = toplamCan(st.dalga), tipler = dalgaTipleri(st.dalga), ag = tipler.reduce((a, t) => a + D[t].agirlik, 0);
        st.dusmanlar.forEach((d) => { const yeni = Math.max(6, Math.round(top * D[d.tip].agirlik / ag)), oran = d.can / (d.max || 1); d.max = yeni; d.can = Math.max(1, Math.round(oran * yeni)); });
        st.adim = adimHesapla(); kaydet();
        if (panel() && $('kale-svg')) kaleSahneKur();
    };
})();
