/* ================================================================================================
   🪢 DEV HALAT ÇEKME — Karışık Sınıf › Oyunlar teması 'halat' (2026-10-28, 29 Ekim turnuvası için).
   Kullanıcı Cumhuriyet turnuvası taslaklarından seçti + kural: "skorları tek tek giriyorum; biri önce girilince kazanma
   ihtimali olmasın — kazanan BÜTÜN sporcular girince belli olsun".
   OYUN: Sınıf iki takıma ayrılır (🔴 AL / ⚪ AK, ok ortalamasına göre dengeli yılan dağıtım). Bir RAUNT = herkes bir seri.
   Her seri halatı canlı oynatır ama raunt ancak iki takımın HERKESİ atınca biter (önce atanın avantajı yok). Takım puanı =
   üyelerin bu rauntki seri ortalamalarının toplamı ÷ takım mevcudu (takımlar farklı sayıda olsa da adil; aynı çocuk iki seri
   atarsa ortalaması alınır). Raunt sonunda önde olan takım çeker, rakip çamura düşer 😂; 3 rauntta 2 alan maçı kazanır.
   Gelmeyen sporcu yüzünden raunt bitmiyorsa koç "⏭️ Raundu bitir" ile atanlarla değerlendirir.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumunu ve çizimi yönetir:
     halatSahneKur(panel) · halatGuncelle() · halatSeri(s, i, kaydedilecek, done) · halatAnlik() · halatGeriYukle(kopya) · halatSporcu(g, ad)
   DURUM 'dag_km_halat_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL:
     { tarih, takim{'g|ad':0|1}, mac{no, skor[2]}, raunt, atan{'g|ad':[seriToplam…]}, gecmis[{raunt,kazanan,p[2]}], galip[], seri }
   Rozet: sp.oyun.halat = { mac }.
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
    const TAKIM = [{ ad: 'AL', renk: '#e30a17', acik: '#ff6b6b' }, { ad: 'AK', renk: '#f4f4f4', acik: '#ffffff' }];
    const PX = 14, SINIR = 230; // takım puan farkının 1 puanı = 14 px; halat ±230 px'te durur

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_halat_ses') !== '0'; } catch (e) { return true; } }
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
        cek() { ton(120, 80, .25, 'sawtooth', .07); hisirti(.25, 600, 300, .05, 0, 1); },
        hey() { [0, .18].forEach((g) => ton(260, 200, .14, 'square', .06, g)); },
        gerilim() { ton(220, 230, .9, 'sawtooth', .05); },
        davul() { for (let i = 0; i < 4; i++) ton(110, 50, .18, 'sine', .25, i * .2); },
        camur() { hisirti(.6, 500, 120, .2, 0, .6); ton(160, 60, .4, 'sine', .15); },
        fanfar() { [392, 523, 659, 784].forEach((f, i) => ton(f, f, .3, 'triangle', .14, i * .16)); ton(1046, 1046, .8, 'triangle', .14, .7); }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_halat_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function kisi(s) { return s.g + '|' + s.ad; }
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) return a; } } catch (e) { } return 6; }
    // Dengeli takım: ok ortalamasına göre sırala, yılan dağıtım (0,1,1,0,0,1…)
    function takimKur(st) {
        st.takim = {};
        liste().slice().sort((a, b) => ortalama(b) - ortalama(a)).forEach((s, k) => { st.takim[kisi(s)] = [0, 1, 1, 0][k % 4]; });
    }
    // Listeye sonradan gelen sporcu küçük takıma
    function takimTamamla(st) {
        let degisti = false;
        liste().forEach((s) => { const k = kisi(s); if (st.takim[k] == null) { const n = [0, 1].map((t) => liste().filter((x) => st.takim[kisi(x)] === t).length); st.takim[k] = n[0] <= n[1] ? 0 : 1; degisti = true; } });
        return degisti;
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !_st.takim) { _st = { tarih: bugun(), mac: { no: 1, skor: [0, 0] }, raunt: 1, atan: {}, gecmis: [], galip: [], seri: 0 }; takimKur(_st); kaydet(); }
        else if (takimTamamla(_st)) kaydet();
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.halat = o.halat || {}; o.halat[alan] = (o.halat[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }
    function uyeler(st, t) { return liste().filter((s) => st.takim[kisi(s)] === t); }
    // Takım puanı = Σ(üyenin bu rauntki seri ortalaması) ÷ bölen. Bölen: normalde takım mevcudu (atmayan 0 sayılır →
    // raunt sürerken canlı çekişme); raunt elle bitirilirse atanların sayısı.
    function takimPuani(st, t, atanlaraGore) {
        const u = uyeler(st, t); let top = 0, atan = 0;
        u.forEach((s) => { const a = st.atan[kisi(s)]; if (a && a.length) { top += a.reduce((x, y) => x + y, 0) / a.length; atan++; } });
        const bolen = atanlaraGore ? Math.max(1, atan) : Math.max(1, u.length);
        return { puan: top / bolen, atan: atan, n: u.length };
    }
    function kalanlar(st) { return liste().filter((s) => !(st.atan[kisi(s)] || []).length); }
    function fark(st, atanlaraGore) { return takimPuani(st, 0, atanlaraGore).puan - takimPuani(st, 1, atanlaraGore).puan; }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-halat'); }
    const IP_Y = 186, YER_Y = 236; // halat ve takımlar yukarıda: alttaki skor paneli çocukları örtmesin
    function yerler(st) {
        const p = {};
        [0, 1].forEach((t) => {
            const u = uyeler(st, t), adim = Math.min(66, 300 / Math.max(1, u.length)); // ilk çekici düğümden 120 px uzakta: ortadaki skor paneli örtmesin
            u.forEach((s, k) => { p[kisi(s)] = { x: t === 0 ? 380 - k * adim : 620 + k * adim, t: t }; });
        });
        return p;
    }
    function sahneHTML(st) {
        const y = yerler(st); let cocuk = '';
        liste().forEach((s, i) => {
            const p = y[kisi(s)]; if (!p) return;
            const T = TAKIM[p.t], renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('halat', i) : T.renk;
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 44) : `<circle cy="-20" r="18" fill="${renk}"/>`;
            const atti = (st.atan[kisi(s)] || []).length > 0;
            cocuk += `<g class="halat-cocuk${atti ? ' atti' : ''}" id="halat-c${i}" data-km-sporcu="${i}" data-takim="${p.t}"><g transform="translate(${p.x.toFixed(1)} ${YER_Y})">
                <g class="halat-govde ${p.t === 0 ? 'halat-sol' : 'halat-sag'}"><g transform="scale(${p.t === 0 ? 1 : -1} 1)">${kar}</g>
                <rect x="-16" y="-50" width="32" height="7" rx="3" fill="${T.renk}" stroke="#2a1015" stroke-width="1.5"/></g>
                <circle class="halat-halka" cx="0" cy="-22" r="27" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="halat-tik" y="-62" text-anchor="middle" font-size="16">${atti ? '✅' : ''}</text>
                <text class="halat-ad-yazi" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#2a1015" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        let bayrak = ''; for (let i = 0; i < 16; i++) { const x = -40 + i * 68; bayrak += `<path d="M${x} 104 L${x + 34} 128 L${x + 68} 104" fill="none" stroke="#fff" stroke-width="2"/><path d="M${x + 24} 111 h18 l-9 22Z" fill="${i % 2 ? '#fff' : '#e30a17'}"/>`; }
        const px = Math.max(-SINIR, Math.min(SINIR, fark(st) * PX));
        return `<svg id="halat-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="halat-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb9f2"/><stop offset="1" stop-color="#d6efff"/></linearGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#halat-gok)"/>
          <g fill="#fff" opacity=".85"><ellipse cx="140" cy="60" rx="70" ry="20"/><ellipse cx="760" cy="44" rx="90" ry="22"/></g>
          ${bayrak}
          <rect x="-400" y="${YER_Y}" width="1800" height="400" fill="#5fb04c"/><rect x="-400" y="${YER_Y}" width="1800" height="8" fill="#4a9a3a"/>
          <ellipse id="halat-camur" cx="500" cy="${YER_Y + 26}" rx="120" ry="22" fill="#7a5230"/><ellipse cx="480" cy="${YER_Y + 22}" rx="40" ry="7" fill="#9a7048" opacity=".7"/>
          <line x1="500" y1="${YER_Y - 6}" x2="500" y2="${YER_Y + 60}" stroke="#fff" stroke-width="5"/>
          <line x1="${500 - SINIR + 50}" y1="${YER_Y}" x2="${500 - SINIR + 50}" y2="${YER_Y + 70}" stroke="#e30a17" stroke-width="4" stroke-dasharray="8 6"/><line x1="${500 + SINIR - 50}" y1="${YER_Y}" x2="${500 + SINIR - 50}" y2="${YER_Y + 70}" stroke="#e30a17" stroke-width="4" stroke-dasharray="8 6"/>
          <g id="halat-ip" style="transform:translateX(${px}px)">
            <path d="M-100 ${IP_Y} H1100" stroke="#c9a06b" stroke-width="10" stroke-linecap="round"/><path d="M-100 ${IP_Y} H1100" stroke="#9a7444" stroke-width="3" stroke-dasharray="7 9"/>
            <g id="halat-cocuklar">${cocuk}</g>
            <g transform="translate(500 ${IP_Y})"><rect x="-9" y="-16" width="18" height="32" rx="5" fill="#2a1015"/><line x1="0" y1="-16" x2="0" y2="-74" stroke="#2a1015" stroke-width="3"/>
              <g transform="translate(0 -74)"><rect width="54" height="36" fill="#e30a17"/><circle cx="18" cy="18" r="9.5" fill="#fff"/><circle cx="20.5" cy="18" r="7.6" fill="#e30a17"/><path d="M33 18 l-6 2 3.7-5 v6.3 l-3.7-5Z" fill="#fff"/></g></g>
          </g>
          <g id="halat-pop"></g>
        </svg>
        <div class="halat-hud"><div class="halat-hud-ust"><span class="halat-ad" id="halat-ad"></span>
          <button class="halat-btn" id="halat-ses-btn" title="Ses">🔊</button><button class="halat-btn" id="halat-nasil-btn" title="Nasıl oynanır?">❓</button><button class="halat-btn" id="halat-bitir-btn" title="Raundu bitir (gelmeyen varsa)">⏭️</button><button class="halat-btn" id="halat-yeni-btn" title="Takımları yeniden kur / yeni maç">🔀</button></div>
          <div class="halat-skor" id="halat-skor"></div><div class="halat-alt" id="halat-alt"></div></div>
        <div class="halat-dev" id="halat-dev"></div>`;
    }
    function halatSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false;
        const st = durum();
        p.innerHTML = sahneHTML(st);
        $('halat-ses-btn').onclick = () => { try { localStorage.setItem('dag_halat_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.hey(); };
        $('halat-nasil-btn').onclick = nasil;
        $('halat-bitir-btn').onclick = bitirSor;
        $('halat-yeni-btn').onclick = yeniSor;
        _sonAi = -1; hudCiz(); halatGuncelle();
    }
    function hudCiz() {
        const st = durum(); if (!$('halat-ad')) return;
        $('halat-ad').textContent = `🪢 Maç ${st.mac.no} · Raunt ${st.raunt}`;
        const p = [0, 1].map((t) => takimPuani(st, t));
        $('halat-skor').innerHTML = [0, 1].map((t) => `<div class="halat-tk t${t}"><b>${TAKIM[t].ad}</b><span class="halat-raunt">${'●'.repeat(st.mac.skor[t])}${'○'.repeat(Math.max(0, 2 - st.mac.skor[t]))}</span><small>${p[t].atan}/${p[t].n} attı · ort. ${p[t].puan.toFixed(1)}</small></div>`).join('<div class="halat-vs">⚔️</div>');
        const k = kalanlar(st), alt = $('halat-alt');
        alt.innerHTML = k.length ? (k.length === 1 ? `🥁 Her şey <b>${kacis(ilkAd(k[0].ad))}</b>'in okunda!` : `Raunt bitmedi · <b>${k.length}</b> sporcu daha atacak — kazanan herkes atınca belli olur`) : '';
        $('halat-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
    }
    function ipCiz(st, atanlaraGore) { const ip = $('halat-ip'); if (ip) ip.style.transform = `translateX(${Math.max(-SINIR, Math.min(SINIR, fark(st, atanlaraGore) * PX))}px)`; }
    let _sonAi = -1;
    function halatGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#halat-cocuklar .halat-cocuk').forEach((g) => { const aktif = +g.id.slice(7) === ai, h = g.querySelector('.halat-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('halat-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('halat-c' + ai), e = c && c.querySelector('.halat-govde'); if (e) { e.classList.remove('halat-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('halat-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('halat-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 24, 'font-weight': 900, fill: renk || '#fff', stroke: '#2a1015', 'stroke-width': 4, 'paint-order': 'stroke', class: 'halat-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1600);
    }
    function dev(html, ms) { const d = $('halat-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function anim(e, cls) { if (!e) return; e.classList.remove(cls); void e.getBoundingClientRect(); e.classList.add(cls); }

    /* ---------------- SERİ İŞLEME ---------------- */
    function halatSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); halatSahneKur(); }
        const st = durum(), key = kisi(s), top = (kaydedilecek || []).reduce((a, k) => a + okDeger(k.puan), 0);
        st.seri = (st.seri || 0) + 1;
        const once = fark(st), ikinci = (st.atan[key] || []).length > 0;
        (st.atan[key] = st.atan[key] || []).push(top);
        const sonra2 = fark(st), t = st.takim[key];
        const sonuc = kalanlar(st).length ? null : rauntBitir(st, false);
        kaydet();
        if (!panel() || !$('halat-svg')) { try { done(); } catch (e) { } return; }
        // görsel: atan çocuk çeker, halat kayar
        const c = $('halat-c' + i); if (c) { c.classList.add('atti'); const tk = c.querySelector('.halat-tik'); if (tk) tk.textContent = '✅'; anim(c.querySelector('.halat-govde'), 'halat-asil'); }
        SES.cek(); setTimeout(SES.hey, 250);
        ipCiz(st, false);
        const x = t === 0 ? 300 : 700;
        pop(`${TAKIM[t].ad} +${top}${ikinci ? ' (ort.)' : ''}`, x, 210, 30, t === 0 ? '#ff6b6b' : '#fff');
        if (Math.abs(sonra2 - once) * PX < 6) { anim($('halat-ip'), 'halat-titre'); pop('Halat titriyor!', 500, 170, 22, '#2a1015'); }
        hudCiz();
        const kal = kalanlar(st);
        if (!sonuc && kal.length === 1) { SES.gerilim(); dev(`🥁 Son atış!<small>Her şey ${kacis(ilkAd(kal[0].ad))}'in okunda</small>`, 2200); }
        setTimeout(() => { if (sonuc) _toren = true; try { done(); } catch (e) { } if (sonuc) rauntGoster(sonuc); }, 900);
    }
    // Raunt sonucu: durumu ilerletir, gösterimi döndürür
    function rauntBitir(st, atanlaraGore) {
        const p = [0, 1].map((t) => takimPuani(st, t, atanlaraGore).puan), f = p[0] - p[1];
        const kazanan = Math.abs(f) < 0.05 ? -1 : (f > 0 ? 0 : 1);
        const sonuc = { raunt: st.raunt, mac: st.mac.no, kazanan: kazanan, p: p, fark: f, macBitti: false, skor: null };
        st.gecmis.push({ mac: st.mac.no, raunt: st.raunt, kazanan: kazanan, p: p.map((x) => +x.toFixed(2)) });
        if (kazanan >= 0) st.mac.skor[kazanan]++;
        sonuc.skor = st.mac.skor.slice();
        if (kazanan >= 0 && st.mac.skor[kazanan] >= 2) {
            sonuc.macBitti = true; st.galip.push({ mac: st.mac.no, takim: kazanan, t: Date.now() });
            liste().forEach((s) => { if (st.takim[kisi(s)] === kazanan) rozetYaz(s.g, s.ad, 'mac'); });
            st.mac = { no: st.mac.no + 1, skor: [0, 0] }; st.raunt = 1;
        } else st.raunt += 1;
        st.atan = {};
        return sonuc;
    }
    function rauntGoster(r) {
        _toren = true;
        const ip = $('halat-ip');
        if (r.kazanan < 0) {
            SES.gerilim(); dev(`BERABERE! 🤝<small>${r.p[0].toFixed(1)} – ${r.p[1].toFixed(1)} · raunt yeniden</small>`, 2600);
            sonra(() => { _toren = false; halatSahneKur(); }, 2900); return;
        }
        SES.davul();
        const T = TAKIM[r.kazanan];
        // kazanan halatı kendi tarafına sonuna kadar çeker, kaybedenler çamura
        if (ip) { ip.style.transition = 'transform 1.2s cubic-bezier(.5,0,.3,1.4)'; ip.style.transform = `translateX(${r.kazanan === 0 ? -SINIR - 40 : SINIR + 40}px)`; }
        sonra(() => {
            SES.camur(); const w = document.getElementById('km-oyun-sahne') || panel(); anim(w, 'halat-salla');
            document.querySelectorAll('#halat-cocuklar .halat-cocuk').forEach((c) => { if (+c.dataset.takim !== r.kazanan) c.querySelector('.halat-govde').classList.add('halat-dus'); else c.querySelector('.halat-govde').classList.add('halat-sevin'); });
            dev(`${T.ad} ÇEKTİ! 💪<small>${r.p[0].toFixed(1)} – ${r.p[1].toFixed(1)} · Maç: AL ${r.skor[0]} – ${r.skor[1]} AK</small>`, 3000);
        }, 1100);
        if (r.macBitti) {
            sonra(() => { SES.fanfar(); dev(`🏆 ${T.ad} TAKIMI KAZANDI!<small>29 Ekim Halat Çekme · Maç ${r.mac} · Yaşasın Cumhuriyet! 🎉</small>`, 4200); }, 4300);
            sonra(() => { _toren = false; halatSahneKur(); }, 8800);
        } else sonra(() => { _toren = false; halatSahneKur(); }, 4600);
    }
    function bitirSor() {
        const st = durum(), k = kalanlar(st);
        if (!Object.keys(st.atan).length) { if (typeof showToast === 'function') showToast('Bu rauntta henüz kimse atmadı.', 'info'); return; }
        const f = () => { const r = rauntBitir(durum(), true); kaydet(); if (typeof kmOyunChipleriCiz === 'function') { try { kmOyunChipleriCiz(); } catch (e) { } } rauntGoster(r); };
        const msg = `Raunt şimdi bitsin mi?<br><small>${k.length} sporcu atmadı (${k.slice(0, 6).map((s) => kacis(ilkAd(s.ad))).join(', ')}${k.length > 6 ? '…' : ''}). Takımlar yalnız atanların ortalamasıyla karşılaştırılır.</small>`;
        if (typeof onayIste === 'function') onayIste(msg, f, 'Raundu bitir', 'Vazgeç'); else f();
    }
    function yeniSor() {
        const f = () => { const st = durum(); takimKur(st); st.mac = { no: st.mac.no + (st.mac.skor[0] || st.mac.skor[1] ? 1 : 0), skor: [0, 0] }; st.raunt = 1; st.atan = {}; kaydet(); halatSahneKur(); if (typeof showToast === 'function') showToast('🔀 Takımlar yeniden kuruldu — yeni maç!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Takımlar yeniden dengeli kurulsun ve yeni maç başlasın mı?<br><small>Bu maçın raunt skoru sıfırlanır (serileri silinmez).</small>', f, 'Yeni maç', 'Vazgeç'); else f();
    }
    function nasil() {
        dev(`🪢 Dev Halat Çekme<small style="text-align:left;display:inline-block;max-width:620px">
          İki takım: 🔴 AL – ⚪ AK (ok ortalamasına göre dengeli). Bir raunt = herkes bir seri.<br>
          Her seri halatı kendi tarafına çeker; ama <b>kazanan, herkes atınca belli olur</b> — önce atanın avantajı yok.<br>
          Takım puanı = üyelerin seri ortalaması ÷ takım mevcudu (takımlar farklı sayıda olsa da adil).<br>
          3 rauntta 2 alan kazanır · gelmeyen varsa ⏭️ ile raunt atanlarla bitirilir.<br><i>(kapatmak için dokun)</i></small>`);
        const d = $('halat-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function halatAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function halatGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _st = k; _stKonum = konum(); kaydet(); if (panel()) halatSahneKur(); }
    function halatSporcu(g, ad) { const st = durum(), t = st.takim[g + '|' + ad]; return t == null ? '-' : TAKIM[t].ad; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('halat-css')) return;
        const st = document.createElement('style'); st.id = 'halat-css';
        st.textContent = `
.km-oyun-panel-halat{padding:0;background:#6fb9f2;overflow:hidden}
.halat-hud{position:absolute;left:50%;transform:translateX(-50%);top:8px;z-index:1;width:min(620px,94%);display:grid;gap:6px;pointer-events:none}
.halat-hud-ust{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap}
.halat-ad{background:rgba(42,16,21,.8);color:#fff;border-radius:999px;padding:6px 14px;font-weight:900;font-size:14px;white-space:nowrap}
.halat-btn{pointer-events:auto;background:rgba(42,16,21,.8);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.halat-skor{display:flex;align-items:stretch;gap:8px;justify-content:center}
.halat-tk{flex:1;max-width:250px;border-radius:14px;padding:6px 12px;background:rgba(42,16,21,.82);display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:10px}
.halat-tk b{font:800 26px 'Baloo 2',sans-serif;grid-row:span 2}.halat-tk.t0 b{color:#ff5a5a}.halat-tk.t1 b{color:#fff}
.halat-raunt{color:#ffd23f;font-size:18px;letter-spacing:3px}.halat-tk small{color:#f0dde0;font-weight:800;font-size:11.5px}
.halat-vs{align-self:center;font-size:22px}
.halat-alt{justify-self:center;background:rgba(42,16,21,.85);color:#fff;border-radius:999px;padding:5px 14px;font-weight:800;font-size:clamp(11px,1.3vw,14px);white-space:nowrap;pointer-events:none}
.halat-alt:empty{display:none}.halat-alt b{color:#ffd23f}
.halat-cocuk{cursor:pointer}.halat-cocuk:hover .halat-govde{filter:brightness(1.15)}
.halat-halka{transition:opacity .3s}.halat-cocuk.halat-aktif .halat-ad-yazi{fill:#ffd23f}
.halat-cocuk:not(.atti) .halat-govde{opacity:.82}
#halat-ip{transition:transform .9s cubic-bezier(.3,1.4,.5,1)}
.halat-govde{transform-box:fill-box;transform-origin:50% 100%}
.halat-sol{animation:halatSol 1.6s ease-in-out infinite}.halat-sag{animation:halatSag 1.6s ease-in-out infinite}
@keyframes halatSol{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(-17deg)}}@keyframes halatSag{0%,100%{transform:rotate(12deg)}50%{transform:rotate(17deg)}}
.halat-sol.halat-asil{animation:halatSolAsil .6s ease-in-out}.halat-sag.halat-asil{animation:halatSagAsil .6s ease-in-out}
@keyframes halatSolAsil{0%,100%{transform:rotate(-12deg)}40%{transform:rotate(-32deg) translateX(-6px)}}@keyframes halatSagAsil{0%,100%{transform:rotate(12deg)}40%{transform:rotate(32deg) translateX(6px)}}
.halat-sira-geldi{animation:halatSira .7s cubic-bezier(.3,1.6,.5,1)!important}@keyframes halatSira{40%{transform:translateY(-14px) scale(1.15)}}
.halat-dus{animation:halatDus 1s ease-in forwards!important}@keyframes halatDus{40%{transform:rotate(0) translateY(-10px)}100%{transform:rotate(80deg) translateY(10px);filter:sepia(1) saturate(3) hue-rotate(-20deg) brightness(.7)}}
.halat-sevin{animation:halatSevin .45s ease-in-out 6!important}@keyframes halatSevin{50%{transform:translateY(-16px)}}
.halat-titre{animation:halatTitre .09s linear 6}@keyframes halatTitre{50%{margin-left:4px}}
.halat-pop{animation:halatPop 1.6s ease-out forwards;transform-box:fill-box;transform-origin:center}
@keyframes halatPop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-50px)}}
.halat-salla{animation:halatSalla .1s linear 8}@keyframes halatSalla{25%{transform:translate(-6px,3px)}75%{transform:translate(6px,-3px)}}
.halat-dev{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(28px,6vw,80px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.35);-webkit-text-stroke:2px #2a1015;text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.05;width:92%}
.halat-dev small{display:block;font-size:.3em;font-weight:800;margin-top:10px;color:#fff;-webkit-text-stroke:0;text-shadow:0 2px 4px #000;line-height:1.35}
.halat-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (max-width:700px){.halat-tk b{font-size:20px}.halat-tk small{font-size:10px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-halat *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.halatSahneKur = halatSahneKur;
    window.halatGuncelle = halatGuncelle;
    window.halatSeri = halatSeri;
    window.halatAnlik = halatAnlik;
    window.halatGeriYukle = halatGeriYukle;
    window.halatSporcu = halatSporcu;
})();
