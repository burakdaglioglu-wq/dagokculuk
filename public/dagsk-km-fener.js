/* ================================================================================================
   🇹🇷 FENER ALAYI — Karışık Sınıf › Oyunlar teması 'fener' (2026-10-28, 29 Ekim için).
   Kullanıcı 6'lı taslak sayfasından "Fener Alayı"nı seçti: "29 Ekim için Cumhuriyet oyunu yap, ben de aktivite yapacağım".
   OYUN: Gece, bayrak süslü sokak; üstte kırmızı-beyaz fener dizileri. Hedef Cumhuriyet'in yaşı kadar fener (2026 → 103).
   Her ok, atan çocuğun yerinden bir kıvılcım olur ve sıradaki fenerleri yakar: Iska → 0 · 1-4 → 1 · 5-6 → 2 · 7-8 → 3 ·
   9-10 → 4 · X → 5 (+ havai fişek). Fenerler yandıkça ortadaki bayrak göndere çekilir. Belli fenerlerde kısa bilgi kartı
   (1923, ilk cumhurbaşkanı, başkent Ankara…). Hepsi yanınca tören: bayrak tepede dalgalanır, havai fişekler, "Cumhuriyetimiz
   103 yaşında!", son feneri yakan 👑 + en çok yakan; sonra yeni tur (fenerler söner, yeniden).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumunu ve çizimi yönetir:
     fenerSahneKur(panel) · fenerGuncelle() · fenerSeri(s, i, kaydedilecek, done) · fenerAnlik() · fenerGeriYukle(kopya) · fenerSporcu(g, ad)
   DURUM 'dag_km_fener_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL: { tarih, tur, yanan, katki{'g|ad':adet}, tamamlayanlar[], seri }
   Rozet: sp.oyun.fener = { tamamladi }.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    // Cumhuriyet'in yaşı (29 Ekim 1923): 2026'da 103. Hedef fener sayısı bu.
    // Takvim yılına göre "kaçıncı yıl" (bayram haftası öncesi de aynı sayı görünsün).
    const HEDEF = Math.max(100, new Date().getFullYear() - 1923);
    function fenerSayisi(v) { v = String(v); if (v === 'X') return 5; const d = okDeger(v); return d >= 9 ? 4 : d >= 7 ? 3 : d >= 5 ? 2 : d >= 1 ? 1 : 0; }
    // Kısa, doğru bilgi kartları (fener sayısı eşiğinde bir kez)
    const BILGI = [
        [10, '📜 29 Ekim 1923', 'Türkiye Cumhuriyeti ilan edildi.'],
        [23, '🏛️ Başkent Ankara', '13 Ekim 1923\'te Ankara başkent oldu.'],
        [40, '⭐ İlk Cumhurbaşkanı', 'Mustafa Kemal Atatürk, ilk cumhurbaşkanımız oldu.'],
        [60, '🗳️ Cumhuriyet nedir?', 'Halkın kendi seçtiği kişilerle yönetilmesidir.'],
        [80, '🏮 Fener alayı', 'Cumhuriyet Bayramı akşamı fenerlerle yürüyüş yapılır.'],
        [95, '🎉 Az kaldı!', 'Son fenerler — hep birlikte!']
    ];

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_fener_ses') !== '0'; } catch (e) { return true; } }
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
        kivilcim() { hisirti(.25, 2400, 5000, .05, 0, 3); },
        yan(k) { ton(660 + k * 60, 990 + k * 60, .12, 'triangle', .07); },
        iska() { ton(220, 160, .12, 'sine', .05); },
        bilgi() { [523, 659].forEach((f, i) => ton(f, f, .2, 'triangle', .08, i * .12)); },
        fisek() { ton(300, 1400, .4, 'sine', .05); hisirti(.6, 3000, 400, .12, .4, .6); },
        davul() { for (let i = 0; i < 6; i++) { ton(110, 50, .18, 'sine', .25, i * .22); if (i % 2) hisirti(.08, 4000, 3000, .05, i * .22, 2); } },
        fanfar() { [392, 523, 659, 784].forEach((f, i) => ton(f, f, .3, 'triangle', .14, i * .16)); ton(1046, 1046, .8, 'triangle', .14, .7); }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_fener_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = { tarih: bugun(), tur: 1, yanan: 0, katki: {}, tamamlayanlar: [], seri: 0 }; kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.fener = o.fener || {}; o.fener[alan] = (o.fener[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false, _ekranYanan = null;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-fener'); }
    function cocukXY(i) { const satir = Math.floor(i / 6), sutun = i % 6; return { x: 34 + sutun * 50 + (satir % 2) * 25, y: 205 - satir * 50 }; }
    // Fener dizileri: 4 sarkık sıra, x 420…985. Sıra başına ceil(HEDEF/4) fener.
    const SIRA = 4, SIRA_N = Math.ceil(HEDEF / SIRA);
    function fenerXY(k) {
        const r = Math.floor(k / SIRA_N), j = k % SIRA_N, n = Math.min(SIRA_N, HEDEF - r * SIRA_N), t = n > 1 ? j / (n - 1) : .5;
        const x = 420 + t * 565, y0 = 70 + r * 72; return { x: x, y: y0 + Math.sin(t * Math.PI) * 34 };
    }
    function ipYolu(r) { const n = Math.min(SIRA_N, HEDEF - r * SIRA_N); let d = `M405 ${70 + r * 72 - 14}`; for (let j = 0; j < n; j++) { const p = fenerXY(r * SIRA_N + j); d += ` L${p.x.toFixed(1)} ${(p.y - 12).toFixed(1)}`; } return d + ` L998 ${70 + r * 72 - 14}`; }
    function fenerSVG(k, yanik) {
        const p = fenerXY(k), kirmizi = k % 2 === 0;
        return `<g class="fener${yanik ? ' yanik' : ''}${kirmizi ? ' kirmizi' : ' beyaz'}" id="fener-f${k}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
          <circle class="fener-isik" r="17" fill="${kirmizi ? '#ff3b3b' : '#fff3c4'}"/><line y1="-12" y2="-8" stroke="#3a3a48" stroke-width="2"/>
          <rect class="fener-govde" x="-6.5" y="-8" width="13" height="17" rx="5"/><rect x="-5" y="-9.5" width="10" height="3" rx="1.5" fill="#2a2a36"/><rect x="-5" y="8" width="10" height="2.5" rx="1.2" fill="#2a2a36"/></g>`;
    }
    function bayrakSVG() {
        // Türk bayrağı oranlarına yakın (2:3); ay-yıldız beyaz
        return `<g id="fener-bayrak-g"><rect x="0" y="0" width="120" height="80" fill="#e30a17"/><circle cx="40" cy="40" r="20" fill="#fff"/><circle cx="45" cy="40" r="16" fill="#e30a17"/>
          <path d="M66 40 l-12.4 4 7.6-10.5 v13 l-7.6-10.5Z" fill="#fff"/></g>`;
    }
    function sahneHTML(st) {
        const yanan = _ekranYanan != null ? _ekranYanan : st.yanan;
        let cocuk = '';
        liste().map((s, i) => [s, i]).reverse().forEach(([s, i]) => {
            const p = cocukXY(i), renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('fener', i) : '#ffd23f';
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 40) : `<circle cy="-18" r="16" fill="${renk}"/>`;
            const yakti = (st.katki[s.g + '|' + s.ad] || 0) > 0;
            cocuk += `<g class="fener-cocuk" id="fener-c${i}" data-km-sporcu="${i}"><g transform="translate(${p.x} ${p.y})"><g class="fener-ci">${kar}</g>
                <g class="fener-el${yakti ? ' yanik' : ''}" transform="translate(19 -14)"><circle class="fener-isik" r="9" fill="#ff3b3b"/><line y1="-12" y2="-6" stroke="#ccc" stroke-width="1.5"/><rect class="fener-govde" x="-4" y="-6" width="8" height="10" rx="3"/></g>
                <circle class="fener-halka" cx="0" cy="-20" r="25" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="fener-ad-yazi" y="15" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#120d22" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        let yildiz = ''; for (let i = 0; i < 46; i++) { const x = (i * 397) % 1000, y = (i * 131) % 250; yildiz += `<circle class="fener-yildiz" style="animation-delay:${(i % 9) * .3}s" cx="${x}" cy="${y}" r="${(i % 3) * .5 + .8}" fill="#fff"/>`; }
        let bina = ''; [[330, 120, 130], [455, 90, 170], [550, 140, 110], [690, 100, 150], [790, 130, 125], [920, 110, 160]].forEach(([x, w, h], k) => {
            bina += `<rect x="${x}" y="${500 - h}" width="${w}" height="${h}" fill="${k % 2 ? '#1d1838' : '#231d42'}"/>`;
            for (let yy = 500 - h + 14; yy < 488; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 20) bina += `<rect x="${xx}" y="${yy}" width="9" height="11" fill="${(xx * 7 + yy * 3) % 5 ? '#ffd88a' : '#3a3260'}" opacity=".75"/>`;
            bina += `<g transform="translate(${x + w / 2} ${500 - h - 26})"><line y1="0" y2="26" stroke="#bbb" stroke-width="2"/><rect x="1" y="0" width="22" height="14" fill="#e30a17"/><circle cx="8" cy="7" r="4" fill="#fff"/><circle cx="9.2" cy="7" r="3.2" fill="#e30a17"/></g>`;
        });
        let ip = ''; for (let r = 0; r < SIRA; r++) ip += `<path d="${ipYolu(r)}" fill="none" stroke="#5a5470" stroke-width="2"/>`;
        let fener = ''; for (let k = 0; k < HEDEF; k++) fener += fenerSVG(k, k < yanan);
        const oran = Math.min(1, yanan / HEDEF), bayrakY = 470 - oran * 400;
        return `<svg id="fener-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="fener-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0b24"/><stop offset=".7" stop-color="#241a4a"/><stop offset="1" stop-color="#4a2a50"/></linearGradient>
            <filter id="fener-par" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5"/></filter></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#fener-gok)"/>${yildiz}
          ${bina}
          <rect x="-400" y="500" width="1800" height="260" fill="#16122a"/><rect x="-400" y="500" width="1800" height="5" fill="#2e2650"/>
          <g id="fener-ipler">${ip}</g><g id="fener-fenerler">${fener}</g>
          <rect x="356" y="62" width="6" height="440" rx="3" fill="#cfd3da"/><circle cx="359" cy="60" r="7" fill="#ffd23f"/>
          <g id="fener-bayrak" style="transform:translate(362px,${bayrakY}px)"><g class="fener-dalga">${bayrakSVG()}</g></g>
          <path d="M-400 560 V226 Q60 180 190 194 Q320 210 430 284 V560Z" fill="#120d22" opacity=".92"/><path d="M-400 226 Q60 180 190 194 Q320 210 430 284" fill="none" stroke="#e30a17" stroke-opacity=".6" stroke-width="5"/>
          <g id="fener-cocuklar">${cocuk}</g>
          <g id="fener-ucan"></g><g id="fener-fisek"></g><g id="fener-pop"></g>
        </svg>
        <div class="fener-hud"><div class="fener-hud-ust"><span class="fener-ad" id="fener-ad"></span><span class="fener-cip" id="fener-sayi"></span>
          <button class="fener-btn" id="fener-ses-btn" title="Ses">🔊</button><button class="fener-btn" id="fener-nasil-btn" title="Nasıl oynanır?">❓</button><button class="fener-btn" id="fener-yeni-btn" title="Fenerleri söndür, baştan">🔄</button></div>
          <div class="fener-bar"><i id="fener-bar-ic"></i><span id="fener-bar-yazi"></span></div></div>
        <div class="fener-dev" id="fener-dev"></div>`;
    }
    function fenerSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false; _ekranYanan = null;
        const st = durum();
        p.innerHTML = sahneHTML(st);
        $('fener-ses-btn').onclick = () => { try { localStorage.setItem('dag_fener_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.bilgi(); };
        $('fener-nasil-btn').onclick = nasil;
        $('fener-yeni-btn').onclick = yeniOyunSor;
        _sonAi = -1; hudCiz(); fenerGuncelle();
    }
    function hudCiz(yanan) {
        if (!$('fener-ad')) return; const st = durum(); if (yanan == null) yanan = _ekranYanan != null ? _ekranYanan : st.yanan;
        const tur = _toren ? st.tur - 1 : st.tur; $('fener-ad').textContent = '🏮 Fener Alayı' + (tur > 1 ? ' · ' + tur + '. tur' : '');
        $('fener-sayi').innerHTML = `🏮 <b>${Math.min(yanan, HEDEF)}</b> / ${HEDEF}`;
        const y = Math.min(100, Math.round(yanan / HEDEF * 100));
        $('fener-bar-ic').style.width = y + '%'; $('fener-bar-yazi').textContent = 'Cumhuriyet ' + HEDEF + ' yaşında · %' + y;
        $('fener-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
    }
    let _sonAi = -1;
    function fenerGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#fener-cocuklar .fener-cocuk').forEach((g) => { const aktif = +g.id.slice(7) === ai, h = g.querySelector('.fener-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('fener-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('fener-c' + ai), e = c && c.querySelector('.fener-ci'); if (e) { e.classList.remove('fener-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('fener-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('fener-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 22, 'font-weight': 900, fill: renk || '#fff', stroke: '#120d22', 'stroke-width': 4, 'paint-order': 'stroke', class: 'fener-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1500);
    }
    function dev(html, ms) { const d = $('fener-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function bayrakCek(yanan, tepe) { const b = $('fener-bayrak'); if (b) b.style.transform = `translate(362px,${tepe ? 70 : 470 - Math.min(1, yanan / HEDEF) * 400}px)`; }
    function fisek(x, y, renk, n, r) {
        const g = $('fener-fisek'); if (!g) return;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = svgEl('circle', { cx: x, cy: y, r: 3.2, fill: renk }, g); const an = c.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 24}px)`, opacity: 0 }], { duration: 1400, easing: 'ease-out' }); an.onfinish = () => c.remove(); }
    }
    function kivilcim(i, hedefK, cb) {
        const g = $('fener-ucan'); if (!g) { cb(); return; }
        const a = cocukXY(i); a.y -= 26; const b = hedefK != null ? fenerXY(Math.min(HEDEF - 1, hedefK)) : { x: a.x + 120, y: 480 };
        const k = svgEl('g', {}, g); svgEl('circle', { r: 9, fill: '#ffcf4a', opacity: .45 }, k); svgEl('circle', { r: 4, fill: '#fff6c4' }, k);
        const tep = Math.min(a.y, b.y) - 70, kare = [];
        for (let s = 0; s <= 12; s++) { const t = s / 12; kare.push({ transform: `translate(${a.x + (b.x - a.x) * t}px,${(1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * tep + t * t * b.y}px)` }); }
        const an = k.animate(kare, { duration: 600, easing: 'linear' }); an.onfinish = () => { k.remove(); cb(); };
    }

    /* ---------------- SERİ İŞLEME ---------------- */
    function fenerSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); fenerSahneKur(); }
        const st = durum(), key = s.g + '|' + s.ad, olaylar = [];
        st.seri = (st.seri || 0) + 1;
        const basla = st.yanan; let tamam = null;
        (kaydedilecek || []).forEach((k) => {
            const v = String(k.puan), n = fenerSayisi(v);
            st.katki[key] = (st.katki[key] || 0) + n;
            if (tamam) { st.yanan += n; return; } // tur bittikten sonraki oklar yeni turun fenerleri
            const once = st.yanan; st.yanan += n;
            const o = { v: v, n: n, bas: once, son: Math.min(HEDEF, st.yanan), x: v === 'X' };
            o.bilgi = BILGI.filter((b) => once < b[0] && st.yanan >= b[0]).pop() || null;
            if (st.yanan >= HEDEF) {
                const sira = Object.entries(st.katki).sort((a, b) => b[1] - a[1])[0];
                tamam = { tur: st.tur, ad: s.ad, g: s.g, i: i, enCok: sira ? sira[0] : null };
                st.tamamlayanlar.push({ ad: s.ad, g: s.g, t: Date.now() }); rozetYaz(s.g, s.ad, 'tamamladi');
                st.yanan -= HEDEF; st.tur += 1;
            }
            olaylar.push(o);
        });
        kaydet();
        if (!panel() || !$('fener-svg')) { try { done(); } catch (e) { } return; }
        _ekranYanan = basla;
        let n = 0; const hepsi = olaylar.length;
        const bitti = () => { if (tamam) _toren = true; else _ekranYanan = null; try { done(); } catch (e) { } if (tamam) tamamGoster(tamam); };
        if (!hepsi) { bitti(); return; }
        olaylar.forEach((o, k) => {
            setTimeout(() => {
                SES.kivilcim();
                kivilcim(i, o.n ? o.bas : null, () => { okTepki(o, i); n++; if (n === hepsi) setTimeout(bitti, 500); });
            }, k * 450);
        });
    }
    function okTepki(o, i) {
        if (!o.n) { SES.iska(); const a = cocukXY(i); pop('pıss…', a.x + 120, 460, 18, '#b8b0d8'); return; }
        for (let k = o.bas; k < o.son; k++) {
            const j = k - o.bas;
            setTimeout(() => { const f = $('fener-f' + k); if (f) { f.classList.add('yanik', 'fener-yeni'); } SES.yan(j); }, j * 90);
        }
        _ekranYanan = o.son; bayrakCek(o.son); hudCiz(o.son);
        const p = fenerXY(Math.max(0, o.son - 1)); pop('+' + o.n + ' 🏮', p.x, p.y - 22, 20 + o.n * 2, '#ffd88a');
        if (o.x) { SES.fisek(); setTimeout(() => fisek(560 + Math.random() * 360, 80 + Math.random() * 120, '#e30a17', 26, 80), 300); setTimeout(() => fisek(560 + Math.random() * 360, 80 + Math.random() * 120, '#ffffff', 22, 70), 600); pop('X! HAVAİ FİŞEK 🎆', 700, 300, 26, '#ffd23f'); }
        if (o.bilgi) { SES.bilgi(); dev(`${o.bilgi[1]}<small>${o.bilgi[2]}</small>`, 2800); }
        const c = $('fener-c' + i); if (c) { const e = c.querySelector('.fener-el'); if (e) e.classList.add('yanik'); }
    }
    function tamamGoster(h) {
        _toren = true; _ekranYanan = HEDEF; hudCiz(HEDEF); bayrakCek(HEDEF, true);
        SES.davul(); setTimeout(SES.fanfar, 1400);
        const b = $('fener-bayrak'); if (b) b.classList.add('fener-tepe');
        dev(`🎉 CUMHURİYETİMİZ ${HEDEF} YAŞINDA!<small>29 Ekim Cumhuriyet Bayramımız kutlu olsun! · Hep birlikte: Yaşasın Cumhuriyet!</small>`, 4200);
        let k = 0; const renk = ['#e30a17', '#ffffff', '#ffd23f', '#e30a17', '#ffffff'];
        const fs = () => { if (!$('fener-svg') || k > 22) return; SES.fisek(); fisek(430 + Math.random() * 540, 60 + Math.random() * 170, renk[k % renk.length], 24 + (k % 3) * 6, 60 + Math.random() * 50); k++; sonra(fs, 330); };
        fs();
        sonra(() => {
            const ce = $('fener-c' + h.i); if (ce) { ce.classList.add('fener-kahraman'); const g = ce.querySelector('g'); if (g) g.insertAdjacentHTML('beforeend', '<text y="-50" text-anchor="middle" font-size="22">👑</text>'); }
            const bul = (k2) => liste().find((s) => s.g + '|' + s.ad === k2), enCok = h.enCok ? bul(h.enCok) : null;
            dev(`🏮 Son feneri yakan: ${kacis(ilkAd(h.ad))}! 🏅<small>${enCok ? '🔥 En çok fener yakan: ' + kacis(ilkAd(enCok.ad)) + ' · ' : ''}Sıradaki: ${durum().tur}. Fener Alayı</small>`, 4000);
        }, 4600);
        sonra(() => { _toren = false; _ekranYanan = null; fenerSahneKur(); }, 9200);
    }
    function nasil() {
        dev(`🏮 Fener Alayı<small style="text-align:left;display:inline-block;max-width:600px">
          Hedef: Cumhuriyetimizin yaşı kadar fener — <b>${HEDEF} fener</b>! Her ok sıradaki fenerleri yakar:<br>
          ⚫⚪ 1-4 → 1 fener · 🔵 5-6 → 2 · 🔴 7-8 → 3 · 🟡 9-10 → 4 · X → 5 + havai fişek 🎆 · Iska → sönük<br>
          Fenerler yandıkça bayrak göndere çekilir. Hepsi yanınca kutlama!<br><i>(kapatmak için dokun)</i></small>`);
        const d = $('fener-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    function yeniOyunSor() {
        const f = () => { const st = durum(); st.yanan = 0; kaydet(); fenerSahneKur(); if (typeof showToast === 'function') showToast('🔄 Fenerler söndü — yeniden yakalım!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Bütün fenerler sönsün, baştan mı başlayalım?<br><small>Sporcuların serileri silinmez.</small>', f, 'Baştan başla', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function fenerAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function fenerGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _ekranYanan = null; _st = k; _stKonum = konum(); kaydet(); if (panel()) fenerSahneKur(); }
    function fenerSporcu(g, ad) { const st = durum(); return st.katki[g + '|' + ad] || 0; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('fener-css')) return;
        const st = document.createElement('style'); st.id = 'fener-css';
        st.textContent = `
.km-oyun-panel-fener{padding:0;background:#0a0b24;overflow:hidden}
.fener-hud{position:absolute;right:12px;top:10px;z-index:1;width:min(440px,52%);display:grid;gap:6px;pointer-events:none}
.fener-hud-ust{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.fener-ad,.fener-cip{background:rgba(14,10,30,.78);color:#fff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;white-space:nowrap}
.fener-btn{pointer-events:auto;background:rgba(14,10,30,.78);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.fener-bar{position:relative;height:18px;border-radius:999px;background:rgba(14,10,30,.78);overflow:hidden}
.fener-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#e30a17,#ff6b6b);transition:width .5s}
.fener-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}
.fener-cocuk{cursor:pointer}.fener-cocuk:hover .fener-ci{filter:brightness(1.15)}
.fener-halka{transition:opacity .3s}.fener-cocuk.fener-aktif .fener-ad-yazi{fill:#ffd23f}
.fener-sira-geldi{transform-box:fill-box;transform-origin:50% 100%;animation:fenerSiraGeldi .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes fenerSiraGeldi{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.18)}100%{transform:translateY(0) scale(1)}}
.fener-kahraman .fener-ci{filter:drop-shadow(0 0 10px #ffd860)}
/* fener: sönükken koyu, yanınca kırmızı/beyaz + ışık halesi */
.fener .fener-govde,.fener-el .fener-govde{fill:#3a3548;stroke:#55506a;stroke-width:1;transition:fill .3s}
.fener .fener-isik,.fener-el .fener-isik{opacity:0;filter:url(#fener-par);transition:opacity .4s}
.fener.yanik.kirmizi .fener-govde,.fener-el.yanik .fener-govde{fill:#ff3b3b;stroke:#ffb0b0}
.fener.yanik.beyaz .fener-govde{fill:#fff6dc;stroke:#ffe9a8}
.fener.yanik .fener-isik,.fener-el.yanik .fener-isik{opacity:.75;animation:fenerTitre 1.6s ease-in-out infinite}
@keyframes fenerTitre{50%{opacity:.45}}
.fener-yeni{animation:fenerYeni .5s cubic-bezier(.3,1.6,.5,1)}@keyframes fenerYeni{0%{transform:scale(1)}40%{transform:scale(1.6)}100%{transform:scale(1)}}
.fener-yeni{transform-box:fill-box;transform-origin:center}
.fener-yildiz{animation:fenerYildiz 3s ease-in-out infinite}@keyframes fenerYildiz{50%{opacity:.3}}
#fener-bayrak{transition:transform 1s ease-out}
.fener-dalga{transform-box:fill-box;transform-origin:0 50%;animation:fenerDalga 2.2s ease-in-out infinite}@keyframes fenerDalga{50%{transform:skewY(3deg) scaleX(.94)}}
.fener-tepe .fener-dalga{animation-duration:.8s}
.fener-pop{animation:fenerPop 1.4s ease-out forwards;transform-box:fill-box;transform-origin:center}
@keyframes fenerPop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-46px)}}
.fener-dev{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(26px,5.4vw,72px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.35);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.08;width:92%}
.fener-dev small{display:block;font-size:.34em;font-weight:800;margin-top:10px;color:#ffe2e2;line-height:1.35}
.fener-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (max-width:700px){.fener-hud{width:62%}.fener-ad,.fener-cip{font-size:12px;padding:4px 9px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-fener *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.fenerSahneKur = fenerSahneKur;
    window.fenerGuncelle = fenerGuncelle;
    window.fenerSeri = fenerSeri;
    window.fenerAnlik = fenerAnlik;
    window.fenerGeriYukle = fenerGeriYukle;
    window.fenerSporcu = fenerSporcu;
    window.fenerHedef = HEDEF;
})();
