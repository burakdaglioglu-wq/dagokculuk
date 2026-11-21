/* ================================================================================================
   🕵️ DEDEKTİF OKÇULAR — Karışık Sınıf › Oyunlar teması 'dedektif' (v444, 2026-11-22).
   Kullanıcı "oyunlar çok kötü, sadece 3 oyun oynuyoruz" dedi; sunucu kaydında Ortak Canavar + Gizli Kelime (tahmin)
   öne çıktı. 6 fikirlik sayfadan Dedektif + Yanardağ seçildi, "görseller iyi olsun" + "zorluk seviyeleri (bazıları
   zeki, bazıları küçük)" + "dedektifteki yazılar büyük olsun" istendi. Taslak: claude.ai/artifact/NccwUsq6iJ9v9nFJfTqBag
   OYUN: 4–6 çizilmiş şüpheli polis sırasında (şapka/gözlük/bıyık/boy/atkı/çanta/palto = ipucu özellikleri). Eşiği geçen
   ok mantar panoya bir ipucu kartı açar; 10/X "altın ipucu": Komiser Baykuş bir masumu eler. Sınıf "bu değil" der → koç
   şüpheliye dokunup çizer; hazır olunca 🫵 Suçla. Yanlış suçlama 2 seri kaybettirir. İstasyon saati (7–10 seri) dolunca
   tren kalkar, hırsız kaçar (Rövanş). 5 vaka zinciri; final: herkesin adı (asla son atan kahraman değil).
   ZORLUK: Kolay 4 şüpheli/10 seri/5+/uymayanlar kendiliğinden elenir · Normal 6/8/7+ · Zor 6/7/8+ "…DEĞİLDİ" ipuçları.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js, _skorKaydetCekirdek). Bu dosya yalnız oyun durumu + çizim:
     ddkSahneKur(panel) · ddkGuncelle() · ddkSeri(s, i, kaydedilecek, done) · ddkAnlik() · ddkGeriYukle(k) · ddkSporcu(g, ad)
   DURUM 'dag_km_dedektif_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL; 12 saat kuralı KM_OYUN_SIFIR_ONEK'te.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1280, H = 720, AYAK = 640;
    const DF = '"Lilita One","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
    const TF = '"Special Elite","Courier New",monospace';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = (a) => a[Math.floor(Math.random() * a.length)];
    const karistir = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function aktifSporcu() { const l = liste(); const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; return l[i] || null; }
    function adlarHTML(l) { return '<div class="ddk-adlar">' + l.map((a) => '<span>' + kacis(ilkAd(a)) + '</span>').join('') + '</div>'; }
    function siraliAdlar(a) { return (a || []).slice().sort((x, y) => String(x).localeCompare(String(y), 'tr')); }

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_ddk_ses') !== '0'; } catch (e) { return true; } }
    function ses(t) {
        if (!sesAcik()) return;
        try {
            AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = AC.currentTime;
            const ton = (f, d, tip, v, f2, g0) => { const o = AC.createOscillator(), g = AC.createGain(), b = n + (g0 || 0); o.type = tip || 'sine'; o.frequency.setValueAtTime(f, b); if (f2) o.frequency.exponentialRampToValueAtTime(f2, b + d); g.gain.setValueAtTime(v || .15, b); g.gain.exponentialRampToValueAtTime(.001, b + d); o.connect(g).connect(AC.destination); o.start(b); o.stop(b + d + .02); };
            const gur = (d, v, fr) => { const L = Math.floor(AC.sampleRate * d), bf = AC.createBuffer(1, L, AC.sampleRate), c = bf.getChannelData(0); for (let i = 0; i < L; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / L); const s = AC.createBufferSource(); s.buffer = bf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fr || 1200; const g = AC.createGain(); g.gain.value = v || .3; s.connect(f).connect(g).connect(AC.destination); s.start(); };
            ({
                cek: () => ton(900, .12, 'triangle', .06, 1600),
                vur: () => { gur(.15, .3, 1500); ton(500, .12, 'square', .06, 900); },
                kritik: () => { [660, 880, 1320].forEach((f, i) => ton(f, .18, 'triangle', .11, null, i * .07)); },
                iska: () => ton(300, .25, 'sine', .08, 150),
                kart: () => { gur(.08, .25, 3000); ton(1200, .06, 'square', .04); },
                tik: () => ton(1500, .03, 'square', .05),
                dudu: () => { ton(440, .5, 'sawtooth', .08, 430); ton(554, .5, 'sawtooth', .06, 550, .02); },
                davul: () => { for (let i = 0; i < 10; i++) ton(90, .08, 'square', .08, 60, i * .1); },
                dogru: () => [523, 659, 784, 1046, 1318].forEach((f, i) => ton(f, .35, 'triangle', .12, null, i * .1)),
                yanlis: () => { ton(300, .3, 'sawtooth', .1, 200); ton(200, .4, 'sawtooth', .1, 120, .25); },
                sec: () => ton(880, .07, 'square', .05)
            })[t]();
        } catch (e) { }
    }

    /* ---------------- VERİ ---------------- */
    const DZ = {
        kolay: { ad: '🐣 Kolay', d: '4 şüpheli · 10 seri · 5+ ipucu · uymayanlar kendiliğinden elenir', n: 4, saat: 10, esik: 5, oto: true, ters: false },
        normal: { ad: '🦊 Normal', d: '6 şüpheli · 8 seri · 7+ ipucu', n: 6, saat: 8, esik: 7, oto: false, ters: false },
        zor: { ad: '🧠 Zor', d: '6 şüpheli · 7 seri · 8+ ipucu · "DEĞİLDİ" ipuçları', n: 6, saat: 7, esik: 8, oto: false, ters: true }
    };
    const PALTO = { kahve: ['#8a5a35', 'kahverengi'], gri: ['#6b7484', 'gri'], yesil: ['#3f7d4e', 'yeşil'], mor: ['#6d4c9a', 'mor'] };
    const SAPKA = { kirmizi: '#d23a32', mavi: '#2f6fd6', silindir: '#1b1b22' };
    const ATKI = { sari: '#f2c230', yesil: '#3fbf6a' };
    const TEN = ['#f6d2b4', '#e8b48e', '#c98d63', '#8d5a3b', '#f1c7a2'];
    const SAC = ['#2a1c14', '#5a3a22', '#a8742c', '#d8b56a', '#1a1a1a', '#8a3a1c'];
    const VAKALAR = [
        { ad: 'Kayıp Altın Ok', yer: 'Şehir Müzesi', nesne: 'altinok', hikaye: 'Şehir müzesindeki Altın Ok gece yarısı vitrininden kayboldu! Bekçi {n} kişinin müzeden çıktığını gördü. Hırsız trenle şehirden kaçacak.', anlat: 'Komiser Baykuş: "Okçularım, iyi atış = iyi ipucu. Hepinize güveniyorum!"' },
        { ad: 'Kraliyet Pastası', yer: 'Saray Pastanesi', nesne: 'pasta', hikaye: 'Kralın doğum günü pastası pastaneden çalındı! Pastacı {n} müşteriyi hatırlıyor. Pasta erimeden hırsızı bulmalıyız.', anlat: 'Komiser Baykuş: "Pasta kokusu hâlâ havada... Hırsız uzakta değil!"' },
        { ad: 'Konuşan Papağan', yer: 'Hayvanat Bahçesi', nesne: 'papagan', hikaye: 'Hayvanat bahçesinin ünlü konuşan papağanı Pırpır kayıp! Kafesin yanında {n} ziyaretçi görülmüş.', anlat: 'Komiser Baykuş: "Pırpır kaçırılırken bağırmış: \'İMDAT!\' Hadi bulalım!"' },
        { ad: 'Okul Kupası', yer: 'Spor Salonu', nesne: 'kupa', hikaye: 'Okçuluk turnuvasının kupası salondan kayboldu! Yarın tören var. {n} şüpheli o akşam salondaymış.', anlat: 'Komiser Baykuş: "Kupayı bulamazsak tören olmaz. Bu vaka bizim için çok önemli!"' },
        { ad: 'Kralın Tacı', yer: 'Kale', nesne: 'tac', hikaye: 'Son ve en büyük vaka: Kralın tacı çalındı! Kale kapısında {n} şüpheli yakalandı ama hangisi gerçek hırsız?', anlat: 'Komiser Baykuş: "Bu vakayı çözen okçular kraliyet dedektifi olacak!"' }
    ];
    const OZ = [
        { k: 'sapka', v: ['kirmizi', 'mavi', 'silindir', null] }, { k: 'gozluk', v: [true, false] }, { k: 'biyik', v: [true, false] },
        { k: 'boy', v: ['uzun', 'kisa'] }, { k: 'atki', v: ['sari', 'yesil', null] }, { k: 'canta', v: [true, false] }, { k: 'palto', v: ['kahve', 'gri', 'yesil', 'mor'] }
    ];
    function eslesir(o, c) { return c.not ? o[c.k] !== c.v : o[c.k] === c.v; }
    function ipucuMetni(c) {
        const v = c.v;
        if (c.not) {
            const RN = { kirmizi: 'KIRMIZI', mavi: 'MAVİ', sari: 'SARI', yesil: 'YEŞİL' };
            if (c.k === 'sapka') return v === null ? 'Şapka TAKIYORDU' : v === 'silindir' ? 'Silindir şapkası YOKTU' : 'Şapkası ' + RN[v] + ' DEĞİLDİ';
            if (c.k === 'atki') return v === null ? 'Atkı TAKIYORDU' : 'Atkısı ' + RN[v] + ' DEĞİLDİ';
            if (c.k === 'palto') return 'Paltosu ' + PALTO[v][1].toUpperCase() + ' DEĞİLDİ';
        }
        switch (c.k) {
            case 'sapka': return v === 'silindir' ? 'Uzun siyah silindir şapkası vardı' : v ? 'Şapkası ' + (v === 'kirmizi' ? 'KIRMIZI' : 'MAVİ') + 'ydı' : 'Şapkası YOKTU';
            case 'gozluk': return v ? 'GÖZLÜK takıyordu' : 'Gözlüğü YOKTU';
            case 'biyik': return v ? 'BIYIKLIYDI' : 'Bıyığı YOKTU';
            case 'boy': return v === 'uzun' ? 'UZUN boyluydu' : 'KISA boyluydu';
            case 'atki': return v ? 'Atkısı ' + (v === 'sari' ? 'SARI' : 'YEŞİL') + 'ydı' : 'Atkısı YOKTU';
            case 'canta': return v ? 'Elinde ÇANTA vardı' : 'Çantası YOKTU';
            case 'palto': return 'Paltosu ' + PALTO[v][1].toUpperCase() + 'di';
        }
        return '';
    }
    // Her vakada ipuçları hırsızı TEK kişiye indirir (3–5 ipucu; Kolay'da 2–4); ilk ipucu en az yarısını ayakta bırakır.
    function vakaUret(n, ters) {
        for (let deneme = 0; deneme < 4000; deneme++) {
            const s = []; for (let i = 0; i < n; i++) { const o = {}; OZ.forEach((z) => o[z.k] = sec(z.v)); o.ten = sec(TEN); o.sac = sec(SAC); o.no = i + 1; o.faz = Math.random() * 6; s.push(o); }
            const h = Math.floor(Math.random() * n), hr = s[h];
            const imza = (o) => OZ.map((z) => String(o[z.k])).join('|'); if (new Set(s.map(imza)).size < n) continue;
            let ad = OZ.map((z) => ({ k: z.k, v: hr[z.k] }));
            if (ters) OZ.forEach((z) => { if (z.k !== 'sapka' && z.k !== 'atki' && z.k !== 'palto') return; const dig = z.v.filter((v) => v !== hr[z.k]); ad.push({ k: z.k, v: sec(dig), not: true }); ad.push({ k: z.k, v: sec(dig), not: true }); });
            ad = karistir(ad);
            let kalan = s.map((_, i) => i); const ipucu = [];
            for (const c of ad) { if (kalan.length === 1) break; if (ipucu.some((p) => p.k === c.k && p.v === c.v && !!p.not === !!c.not)) continue; const yeni = kalan.filter((i) => eslesir(s[i], c)); if (yeni.length < kalan.length) { ipucu.push(c); kalan = yeni; } }
            if (kalan.length !== 1 || ipucu.length < (n <= 4 ? 2 : 3) || ipucu.length > 5) continue;
            if (ters && ipucu.filter((c) => c.not).length < 2) continue;
            if (s.filter((o) => eslesir(o, ipucu[0])).length < Math.ceil(n / 2)) continue;
            return { s, h, ipucu };
        }
        return null;
    }

    /* ---------------- DURUM ---------------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_dedektif_' + konum(); }
    function bosDurum(zor) { const st = { tarih: bugun(), zor: zor || 'normal', vaka: 0, faz: 'basla', hepAtan: [], toplamOk: 0, katki: {} }; vakaKur(st); return st; }
    function vakaKur(st) {
        const Z = DZ[st.zor] || DZ.normal;
        st.n = Z.n; st.maxSaat = Z.saat; st.esik = st.esikEl || Z.esik;
        st.v = vakaUret(Z.n, Z.ters); st.acik = 0; st.x = Array(Z.n).fill(0); st.masum = Array(Z.n).fill(0); st.saat = 0; st.sonuc = null; st.vakaAtan = [];
    }
    function durum() {
        const k = anahtar();
        if (_stKonum !== konum()) { _st = null; _stHam = null; _stKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(k); } catch (e) { }
        if (ham !== _stHam) { _stHam = ham; try { _st = ham ? JSON.parse(ham) : null; } catch (e) { _st = null; } }
        if (!_st || _st.tarih !== bugun() || !_st.v || !_st.v.s) { _st = bosDurum(_st && _st.zor); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }

    /* ---------------- ÇİZİM YARDIMCILARI ---------------- */
    function yaz(x, t, px, py, size, renk, o) { o = o || {}; x.save(); x.font = size + 'px ' + (o.font || DF); x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; if (o.a != null) x.globalAlpha *= o.a; if (o.kontur !== false) { x.lineJoin = 'round'; x.lineWidth = o.kalin || Math.max(4, size / 7); x.strokeStyle = o.kontur || 'rgba(0,0,0,.75)'; x.strokeText(t, px, py); } x.fillStyle = renk; x.fillText(t, px, py); x.restore(); }
    function yuv(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function shade(hex, p) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + p, g = (n >> 8 & 255) + p, b = (n & 255) + p; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------------- EFEKTLER ---------------- */
    const FX = { p: [], f: [], a: [], shake: 0, flash: 0 };
    function fxParca(px, py, n, renk, hiz, boy) { hiz = hiz || 7; boy = boy || 6; for (let i = 0; i < n; i++) { const an = Math.random() * Math.PI * 2, v = rnd(.3, 1) * hiz; FX.p.push({ x: px, y: py, vx: Math.cos(an) * v, vy: Math.sin(an) * v - hiz * .3, l: 50 * rnd(.5, 1), m: 50, r: Array.isArray(renk) ? sec(renk) : renk, s: boy * rnd(.5, 1.3) }); } }
    function fxYazi(px, py, t, renk, boy, omur) { FX.f.push({ x: px, y: py, t, r: renk, s: boy || 56, l: omur || 70, m: omur || 70 }); }
    function fxOk(x0, y0, x1, y1, dur) { return new Promise((res) => FX.a.push({ x0, y0, x1, y1, t: 0, dur, res, yay: 180, iz: [] })); }
    function fxNokta(a, t) { const cx = (a.x0 + a.x1) / 2, cy = Math.min(a.y0, a.y1) - a.yay, u = 1 - t; return { x: u * u * a.x0 + 2 * u * t * cx + t * t * a.x1, y: u * u * a.y0 + 2 * u * t * cy + t * t * a.y1 }; }
    function fxGuncelle(dt) {
        const k = dt / 16.7;
        for (const p of FX.p) { p.x += p.vx * k; p.y += p.vy * k; p.vy += .25 * k; p.l -= k; } FX.p = FX.p.filter((p) => p.l > 0);
        for (const f of FX.f) { f.l -= k; f.y -= .8 * k; } FX.f = FX.f.filter((f) => f.l > 0);
        for (const a of FX.a) { a.t += dt / a.dur; a.iz.push(fxNokta(a, Math.min(1, a.t))); if (a.iz.length > 10) a.iz.shift(); if (a.t >= 1 && !a.bitti) { a.bitti = true; a.res(); } } FX.a = FX.a.filter((a) => !a.bitti);
        FX.shake *= Math.pow(.88, k); if (FX.shake < .3) FX.shake = 0; FX.flash *= Math.pow(.92, k); if (FX.flash < .01) FX.flash = 0;
    }
    function fxCiz(x) {
        for (const a of FX.a) {
            const t = Math.min(1, a.t), q = fxNokta(a, t), q2 = fxNokta(a, Math.max(0, t - .03)), an = Math.atan2(q.y - q2.y, q.x - q2.x);
            x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 1; i < a.iz.length; i++) { x.strokeStyle = 'rgba(255,230,160,' + (i / a.iz.length * .5) + ')'; x.lineWidth = 4 * i / a.iz.length; x.beginPath(); x.moveTo(a.iz[i - 1].x, a.iz[i - 1].y); x.lineTo(a.iz[i].x, a.iz[i].y); x.stroke(); } x.restore();
            x.save(); x.translate(q.x, q.y); x.rotate(an); x.strokeStyle = '#e8d2a8'; x.lineWidth = 4; x.beginPath(); x.moveTo(-52, 0); x.lineTo(0, 0); x.stroke(); x.fillStyle = '#d9dde8'; x.beginPath(); x.moveTo(10, 0); x.lineTo(-6, -7); x.lineTo(-6, 7); x.closePath(); x.fill(); x.fillStyle = '#ff4f5e'; x.beginPath(); x.moveTo(-52, 0); x.lineTo(-64, -9); x.lineTo(-46, 0); x.lineTo(-64, 9); x.closePath(); x.fill(); x.restore();
        }
        for (const p of FX.p) { x.globalAlpha = Math.max(0, p.l / p.m); x.fillStyle = p.r; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); } x.globalAlpha = 1;
        for (const f of FX.f) { const a = Math.min(1, f.l / (f.m * .4)), sk = 1 + Math.max(0, (f.l - f.m + 10) / 10) * .4; yaz(x, f.t, f.x, f.y, f.s * sk, f.r, { a }); }
    }

    /* ---------------- ŞÜPHELİ ÇİZİMİ ---------------- */
    const SIRA_X0 = 520, SIRA_GEN = 744; // şüpheliler sağda: sol alt köşe skor dock'una bırakıldı (Komiser masası)
    function SARA(st) { return SIRA_GEN / (st.n || 6); }
    function SX(st, i) { return SIRA_X0 + SARA(st) * (i + .5); }
    function supheliCiz(x, o, cx, t, durumu) {
        const uzun = o.boy === 'uzun', boyH = uzun ? 330 : 258, nef = Math.sin(t / 700 + o.faz) * 2.2;
        const ust = AYAK - boyH, govdeUst = ust + 86, govdeAlt = AYAK - 70, omuz = uzun ? 46 : 42;
        x.save();
        x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(cx, AYAK + 6, 54, 10, 0, 0, 7); x.fill();
        x.fillStyle = '#22202a'; yuv(x, cx - 24, govdeAlt - 6, 18, 76, 7); x.fill(); yuv(x, cx + 6, govdeAlt - 6, 18, 76, 7); x.fill();
        x.fillStyle = '#111'; yuv(x, cx - 30, AYAK - 8, 26, 12, 5); x.fill(); yuv(x, cx + 4, AYAK - 8, 26, 12, 5); x.fill();
        const pr = PALTO[o.palto][0]; const pg = x.createLinearGradient(cx - omuz, 0, cx + omuz, 0); pg.addColorStop(0, pr); pg.addColorStop(.5, shade(pr, 18)); pg.addColorStop(1, shade(pr, -25));
        x.fillStyle = pg; x.beginPath(); x.moveTo(cx - omuz + 6, govdeUst + nef); x.quadraticCurveTo(cx, govdeUst - 8 + nef, cx + omuz - 6, govdeUst + nef); x.lineTo(cx + omuz + 6, govdeAlt + 14); x.lineTo(cx - omuz - 6, govdeAlt + 14); x.closePath(); x.fill();
        x.strokeStyle = shade(pr, -40); x.lineWidth = 2; x.beginPath(); x.moveTo(cx, govdeUst + 10 + nef); x.lineTo(cx, govdeAlt + 12); x.stroke();
        x.fillStyle = shade(pr, -45); x.fillRect(cx - omuz - 2, lerp(govdeUst, govdeAlt, .55), omuz * 2 + 4, 8);
        x.fillStyle = '#d9c48a'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx + 8, govdeUst + 28 + i * 26 + nef, 3.4, 0, 7); x.fill(); }
        x.fillStyle = shade(pr, -20); x.beginPath(); x.moveTo(cx - 18, govdeUst + nef); x.lineTo(cx, govdeUst + 30 + nef); x.lineTo(cx - 30, govdeUst + 8 + nef); x.closePath(); x.fill(); x.beginPath(); x.moveTo(cx + 18, govdeUst + nef); x.lineTo(cx, govdeUst + 30 + nef); x.lineTo(cx + 30, govdeUst + 8 + nef); x.closePath(); x.fill();
        x.fillStyle = shade(pr, -12); yuv(x, cx - omuz - 14, govdeUst + 6 + nef, 18, uzun ? 122 : 100, 9); x.fill(); yuv(x, cx + omuz - 4, govdeUst + 6 + nef, 18, uzun ? 122 : 100, 9); x.fill();
        x.fillStyle = o.ten; x.beginPath(); x.arc(cx - omuz - 5, govdeUst + (uzun ? 130 : 108) + nef, 9, 0, 7); x.fill(); x.beginPath(); x.arc(cx + omuz + 5, govdeUst + (uzun ? 130 : 108) + nef, 9, 0, 7); x.fill();
        if (o.canta) { const bx = cx + omuz + 5, by = govdeUst + (uzun ? 136 : 114) + nef; x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by + 4, 12, Math.PI, 0); x.stroke(); x.fillStyle = '#7a4a22'; yuv(x, bx - 22, by + 8, 44, 34, 6); x.fill(); x.fillStyle = '#d9c48a'; x.fillRect(bx - 4, by + 14, 8, 6); }
        yuv(x, cx - 26, govdeUst + 46 + nef, 52, 36, 5); x.fillStyle = '#f4efe2'; x.fill(); x.strokeStyle = '#222'; x.lineWidth = 2; x.stroke();
        x.font = '28px ' + DF; x.fillStyle = '#1a1a1a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.no, cx, govdeUst + 65 + nef);
        const bx = cx, by = ust + 46 + nef;
        x.fillStyle = shade(o.ten, -15); x.fillRect(cx - 10, by + 30, 20, 16);
        if (o.atki) { const ar = ATKI[o.atki]; x.fillStyle = ar; yuv(x, cx - 30, by + 36, 60, 18, 9); x.fill(); x.fillStyle = shade(ar, -20); yuv(x, cx + 6, by + 44, 16, 56, 6); x.fill(); x.strokeStyle = shade(ar, -35); x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + 8, by + 60 + i * 12); x.lineTo(cx + 20, by + 60 + i * 12); x.stroke(); } }
        x.fillStyle = o.ten; x.beginPath(); x.ellipse(bx, by, 34, 40, 0, 0, 7); x.fill();
        x.fillStyle = shade(o.ten, -10); x.beginPath(); x.arc(bx - 34, by + 4, 8, 0, 7); x.fill(); x.beginPath(); x.arc(bx + 34, by + 4, 8, 0, 7); x.fill();
        x.fillStyle = o.sac; x.beginPath(); x.ellipse(bx, by - 22, 36, 24, 0, Math.PI, 0); x.fill(); x.fillRect(bx - 36, by - 24, 8, 22); x.fillRect(bx + 28, by - 24, 8, 22);
        const bak = Math.sin(t / 1300 + o.faz * 3) * 3.5;
        x.fillStyle = '#fff'; x.beginPath(); x.ellipse(bx - 13, by - 2, 8, 7, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(bx + 13, by - 2, 8, 7, 0, 0, 7); x.fill();
        x.fillStyle = '#1b1b22'; x.beginPath(); x.arc(bx - 13 + bak, by - 1, 4, 0, 7); x.fill(); x.beginPath(); x.arc(bx + 13 + bak, by - 1, 4, 0, 7); x.fill();
        x.strokeStyle = o.sac; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx - 22, by - 14); x.lineTo(bx - 6, by - 11 + (o.faz > 3 ? 2 : -1)); x.moveTo(bx + 22, by - 14); x.lineTo(bx + 6, by - 11 + (o.faz > 3 ? -1 : 2)); x.stroke();
        x.fillStyle = shade(o.ten, -25); x.beginPath(); x.moveTo(bx, by + 2); x.lineTo(bx - 5, by + 13); x.lineTo(bx + 5, by + 13); x.closePath(); x.fill();
        x.strokeStyle = '#6b2a24'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by + 18, 7, .2, Math.PI - .2); x.stroke();
        if (o.biyik) { x.fillStyle = o.sac === '#d8b56a' ? '#8a6a2a' : o.sac; x.beginPath(); x.moveTo(bx, by + 14); x.quadraticCurveTo(bx - 14, by + 10, bx - 22, by + 20); x.quadraticCurveTo(bx - 10, by + 18, bx, by + 18); x.quadraticCurveTo(bx + 10, by + 18, bx + 22, by + 20); x.quadraticCurveTo(bx + 14, by + 10, bx, by + 14); x.fill(); }
        if (o.gozluk) { x.strokeStyle = '#15151c'; x.lineWidth = 3.5; x.beginPath(); x.arc(bx - 13, by - 2, 11, 0, 7); x.stroke(); x.beginPath(); x.arc(bx + 13, by - 2, 11, 0, 7); x.stroke(); x.beginPath(); x.moveTo(bx - 2, by - 3); x.lineTo(bx + 2, by - 3); x.stroke(); }
        if (o.sapka === 'silindir') { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(bx, by - 30, 48, 9, 0, 0, 7); x.fill(); yuv(x, bx - 28, by - 96, 56, 68, 6); x.fill(); x.fillStyle = '#8a1c2a'; x.fillRect(bx - 28, by - 44, 56, 10); }
        else if (o.sapka) { const sr = SAPKA[o.sapka]; x.fillStyle = shade(sr, -20); x.beginPath(); x.ellipse(bx, by - 28, 52, 11, 0, 0, 7); x.fill(); x.fillStyle = sr; x.beginPath(); x.moveTo(bx - 30, by - 30); x.quadraticCurveTo(bx - 32, by - 70, bx, by - 66); x.quadraticCurveTo(bx + 32, by - 70, bx + 30, by - 30); x.closePath(); x.fill(); x.fillStyle = '#1b1b22'; x.fillRect(bx - 30, by - 40, 60, 8); }
        x.restore();
        if (durumu === 'x' || durumu === 'masum') {
            x.save(); x.fillStyle = 'rgba(8,10,20,.55)'; x.fillRect(cx - 70, ust - 80, 140, boyH + 90);
            if (durumu === 'x') { x.strokeStyle = 'rgba(230,50,50,.9)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 50, ust - 10); x.lineTo(cx + 50, ust + 150); x.moveTo(cx + 50, ust - 10); x.lineTo(cx - 50, ust + 150); x.stroke(); }
            else damga(x, cx, ust + 80, 'MASUM', '#3fbf6a', -.2);
            x.restore();
        }
        if (durumu === 'suclu') damga(x, cx, ust + 90, 'YAKALANDI', '#e23b3b', -.18, 30);
    }
    function damga(x, cx, cy, t, renk, rot, boy) { boy = boy || 34; x.save(); x.translate(cx, cy); x.rotate(rot); x.font = boy + 'px ' + DF; const w = x.measureText(t).width + 24; x.strokeStyle = renk; x.lineWidth = 5; yuv(x, -w / 2, -boy * .8, w, boy * 1.6, 8); x.stroke(); x.fillStyle = renk; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 0, 2); x.restore(); }
    function yokCiz(x) { x.strokeStyle = '#d02828'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.moveTo(-17, -17); x.lineTo(17, 17); x.stroke(); }
    function sapkaIkon(x, renk) { x.fillStyle = shade(renk, -20); x.beginPath(); x.ellipse(0, 10, 26, 6, 0, 0, 7); x.fill(); x.fillStyle = renk; x.beginPath(); x.moveTo(-15, 9); x.quadraticCurveTo(-16, -14, 0, -12); x.quadraticCurveTo(16, -14, 15, 9); x.fill(); }
    function ipucuIkon(x, c, cx, cy) {
        x.save(); x.translate(cx, cy); x.lineCap = 'round';
        const v = c.v;
        if (c.k === 'sapka') { if (v === 'silindir') { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(0, 12, 24, 5, 0, 0, 7); x.fill(); x.fillRect(-14, -20, 28, 32); x.fillStyle = '#8a1c2a'; x.fillRect(-14, 4, 28, 5); } else sapkaIkon(x, v ? SAPKA[v] : '#6b7484'); if (!v && !c.not) yokCiz(x); }
        else if (c.k === 'gozluk') { x.strokeStyle = '#15151c'; x.lineWidth = 4; x.beginPath(); x.arc(-12, 0, 10, 0, 7); x.stroke(); x.beginPath(); x.arc(12, 0, 10, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-2, 0); x.lineTo(2, 0); x.stroke(); if (!v) yokCiz(x); }
        else if (c.k === 'biyik') { x.fillStyle = '#3a2414'; x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(-14, -6, -24, 6); x.quadraticCurveTo(-10, 4, 0, 4); x.quadraticCurveTo(10, 4, 24, 6); x.quadraticCurveTo(14, -6, 0, -2); x.fill(); if (!v) yokCiz(x); }
        else if (c.k === 'boy') { x.strokeStyle = '#1b1b22'; x.lineWidth = 4; const h = v === 'uzun' ? 22 : 10; x.beginPath(); x.moveTo(0, h); x.lineTo(0, -h); x.moveTo(-7, -h + 7); x.lineTo(0, -h); x.lineTo(7, -h + 7); x.moveTo(-7, h - 7); x.lineTo(0, h); x.lineTo(7, h - 7); x.stroke(); x.fillStyle = '#1b1b22'; x.beginPath(); x.arc(-18, v === 'uzun' ? -16 : -4, 5, 0, 7); x.fill(); x.fillRect(-21, v === 'uzun' ? -11 : 1, 6, v === 'uzun' ? 32 : 18); }
        else if (c.k === 'atki') { x.fillStyle = v ? ATKI[v] : '#8a92a6'; yuv(x, -22, -8, 44, 12, 6); x.fill(); yuv(x, 4, 0, 12, 22, 4); x.fill(); if (!v && !c.not) yokCiz(x); }
        else if (c.k === 'canta') { x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.beginPath(); x.arc(0, -6, 10, Math.PI, 0); x.stroke(); x.fillStyle = '#7a4a22'; yuv(x, -18, -4, 36, 24, 5); x.fill(); if (!v) yokCiz(x); }
        else if (c.k === 'palto') { x.fillStyle = PALTO[v][0]; x.beginPath(); x.moveTo(-12, -18); x.lineTo(12, -18); x.lineTo(20, 20); x.lineTo(-20, 20); x.closePath(); x.fill(); x.fillRect(-24, -16, 8, 26); x.fillRect(16, -16, 8, 26); }
        if (c.not && v !== null) yokCiz(x);
        x.restore();
    }
    function nesneCiz(x, tip, cx, cy, s) {
        x.save(); x.translate(cx, cy); x.scale(s, s);
        if (tip === 'altinok') { x.rotate(-.5); x.strokeStyle = '#f6c53a'; x.lineWidth = 5; x.beginPath(); x.moveTo(-36, 0); x.lineTo(30, 0); x.stroke(); x.fillStyle = '#ffd95a'; x.beginPath(); x.moveTo(40, 0); x.lineTo(26, -9); x.lineTo(26, 9); x.fill(); x.fillStyle = '#e39a1a'; x.beginPath(); x.moveTo(-36, 0); x.lineTo(-48, -10); x.lineTo(-30, 0); x.lineTo(-48, 10); x.fill(); }
        else if (tip === 'pasta') { x.fillStyle = '#f3d9b0'; x.fillRect(-30, -6, 60, 26); x.fillStyle = '#f58ab0'; x.fillRect(-30, -14, 60, 10); x.fillRect(-20, -30, 40, 18); x.fillStyle = '#fff6e0'; x.fillRect(-20, -34, 40, 6); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(0, -40, 6, 0, 7); x.fill(); }
        else if (tip === 'papagan') { x.fillStyle = '#2fbf5a'; x.beginPath(); x.ellipse(0, 4, 18, 26, 0, 0, 7); x.fill(); x.fillStyle = '#e8402a'; x.beginPath(); x.arc(0, -22, 15, 0, 7); x.fill(); x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(10, -24); x.lineTo(22, -18); x.lineTo(10, -14); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(4, -26, 4, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(5, -26, 2, 0, 7); x.fill(); }
        else if (tip === 'kupa') { x.fillStyle = '#ffc94a'; x.beginPath(); x.moveTo(-24, -30); x.lineTo(24, -30); x.quadraticCurveTo(22, 6, 0, 10); x.quadraticCurveTo(-22, 6, -24, -30); x.fill(); x.fillRect(-5, 8, 10, 14); x.fillRect(-18, 22, 36, 8); }
        else if (tip === 'tac') { x.fillStyle = '#ffc94a'; x.beginPath(); x.moveTo(-32, 16); x.lineTo(-32, -14); x.lineTo(-16, 2); x.lineTo(0, -22); x.lineTo(16, 2); x.lineTo(32, -14); x.lineTo(32, 16); x.closePath(); x.fill(); ['#e23b3b', '#2f6fd6', '#3fbf6a'].forEach((r, i) => { x.fillStyle = r; x.beginPath(); x.arc(-18 + i * 18, 8, 5, 0, 7); x.fill(); }); }
        x.restore();
    }
    function kartSatir(x, metin, gen) {
        for (const boy of [30, 27, 24, 21]) { x.font = boy + 'px ' + DF; const kel = metin.split(' '), sat = []; let su = ''; for (const k of kel) { const den = su ? su + ' ' + k : k; if (x.measureText(den).width <= gen) su = den; else { if (su) sat.push(su); su = k; } } if (su) sat.push(su); if (sat.length <= (boy >= 27 ? 2 : 3)) return { boy, sat }; }
        return { boy: 20, sat: [metin] };
    }
    const _kartAnim = {};
    function kartCiz(x, i, c, acik) {
        const px = 14 + i * 251, py = 84, w = 243, h = 104;
        const anim = _kartAnim[i]; const don = anim != null ? Math.min(1, anim) : 1; const sx = Math.abs(Math.cos(Math.PI * (1 - don)));
        x.save(); x.translate(px + w / 2, py + h / 2); x.rotate(((i * 37) % 7 - 3) * .005); x.scale(acik ? Math.max(.02, sx) : 1, 1);
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
        const goster = acik && don > .5;
        x.fillStyle = goster ? (c.not ? '#ffe9e2' : '#f5ecd6') : '#d9c9a6'; x.fillRect(-w / 2, -h / 2, w, h);
        if (goster) {
            x.save(); x.translate(-w / 2 + 34, 0); ipucuIkon(x, c, 0, 0); x.restore();
            const r = kartSatir(x, ipucuMetni(c), w - 76);
            x.font = r.boy + 'px ' + DF; x.fillStyle = c.not ? '#8a1c14' : '#2a2014'; x.textAlign = 'left'; x.textBaseline = 'middle';
            const sh = r.boy * 1.08; r.sat.forEach((t, k) => x.fillText(t, -w / 2 + 68, (k - (r.sat.length - 1) / 2) * sh + 2));
        } else { x.fillStyle = 'rgba(80,50,20,.5)'; x.font = '44px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 0, -6); x.font = '18px ' + DF; x.fillText('İPUCU ' + (i + 1), 0, 28); }
        x.restore();
        x.fillStyle = '#d23a32'; x.beginPath(); x.arc(px + w / 2, py + 4, 7, 0, 7); x.fill();
    }
    let _statik = null, _statikOlcek = 0;
    function statikCiz(x) {
        const g = x.createLinearGradient(0, 0, 0, AYAK); g.addColorStop(0, '#1a2030'); g.addColorStop(1, '#2b3346'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.strokeStyle = 'rgba(220,230,255,.18)';
        for (let cm = 60; cm <= 190; cm += 10) { const y = AYAK - cm / 0.53; if (y < 200) continue; x.lineWidth = cm % 50 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(SIRA_X0 - 6, y); x.lineTo(W - 6, y); x.stroke(); if (cm % 20 === 0) { x.font = '18px ' + DF; x.fillStyle = 'rgba(220,230,255,.45)'; x.textAlign = 'left'; x.fillText(cm, SIRA_X0, y - 8); x.textAlign = 'right'; x.fillText(cm, W - 10, y - 8); } }
        const z = x.createLinearGradient(0, AYAK, 0, H); z.addColorStop(0, '#14161e'); z.addColorStop(1, '#07080c'); x.fillStyle = z; x.fillRect(0, AYAK, W, H - AYAK);
        // üst mantar şerit (ipucu panosu)
        x.fillStyle = '#4a2f1a'; x.fillRect(0, 74, W, 124);
        const pg = x.createLinearGradient(0, 78, 0, 194); pg.addColorStop(0, '#b88752'); pg.addColorStop(1, '#946638'); x.fillStyle = pg; x.fillRect(4, 78, W - 8, 116);
        for (let i = 0; i < 700; i++) { x.fillStyle = 'rgba(60,30,10,' + rnd(.05, .2) + ')'; x.fillRect(4 + Math.random() * (W - 8), 78 + Math.random() * 116, 2, 2); }
        // sol: komiserin odası (sol alt köşe skor dock'una kalabilir — süs)
        const og = x.createLinearGradient(0, 200, 0, H); og.addColorStop(0, '#20263a'); og.addColorStop(1, '#141824'); x.fillStyle = og; x.fillRect(0, 198, SIRA_X0 - 14, H - 198);
        x.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 6; i++) x.fillRect(0, 250 + i * 70, SIRA_X0 - 14, 2);
        x.fillStyle = '#0e1220'; x.fillRect(SIRA_X0 - 16, 198, 6, H - 198);
        // pencere (gece şehir)
        x.fillStyle = '#0b1530'; yuv(x, 60, 228, 200, 150, 8); x.fill(); x.strokeStyle = '#3a4466'; x.lineWidth = 6; x.stroke();
        x.fillStyle = '#f4f0d0'; x.beginPath(); x.arc(210, 262, 18, 0, 7); x.fill();
        for (let i = 0; i < 7; i++) { const bh = 30 + (i * 37 % 50); x.fillStyle = '#1a2440'; x.fillRect(66 + i * 27, 372 - bh, 24, bh); x.fillStyle = 'rgba(255,220,120,.7)'; if (i % 2) x.fillRect(72 + i * 27, 380 - bh, 5, 5); }
        x.strokeStyle = '#3a4466'; x.lineWidth = 4; x.beginPath(); x.moveTo(160, 228); x.lineTo(160, 378); x.moveTo(60, 303); x.lineTo(260, 303); x.stroke();
        // masa
        x.fillStyle = '#5a3a22'; x.fillRect(20, 520, 460, 26); x.fillStyle = '#3a2414'; x.fillRect(40, 546, 22, 140); x.fillRect(436, 546, 22, 140);
        // lamba
        x.fillStyle = '#2a7a4a'; x.beginPath(); x.moveTo(370, 446); x.lineTo(430, 446); x.lineTo(450, 480); x.lineTo(350, 480); x.closePath(); x.fill(); x.fillStyle = '#c8a050'; x.fillRect(396, 480, 8, 40); x.fillRect(376, 514, 48, 8);
        const lg = x.createRadialGradient(400, 500, 10, 400, 520, 160); lg.addColorStop(0, 'rgba(255,230,150,.35)'); lg.addColorStop(1, 'rgba(255,230,150,0)'); x.fillStyle = lg; x.fillRect(240, 470, 320, 200);
        // dosya yığını
        x.fillStyle = '#d9c9a6'; x.fillRect(250, 498, 90, 22); x.fillStyle = '#c8b088'; x.fillRect(256, 486, 84, 14); x.fillStyle = '#e9dcc0'; x.fillRect(244, 506, 96, 8);
    }
    function baykusCiz(x, t) {
        const bx = 150, by = 452 + Math.sin(t / 800) * 3, goz = (Math.sin(t / 2200) > .96) ? .15 : 1;
        x.save();
        x.fillStyle = '#7a5434'; x.beginPath(); x.ellipse(bx, by, 64, 74, 0, 0, 7); x.fill();
        x.fillStyle = '#c9a77c'; x.beginPath(); x.ellipse(bx, by + 18, 42, 50, 0, 0, 7); x.fill();
        x.strokeStyle = 'rgba(120,80,40,.5)'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(bx, by + 8 + i * 14, 18, .3, Math.PI - .3); x.stroke(); }
        x.fillStyle = '#5a3a22'; x.beginPath(); x.ellipse(bx - 58, by + 10, 18, 44, .25, 0, 7); x.fill(); x.beginPath(); x.ellipse(bx + 58, by + 10, 18, 44, -.25, 0, 7); x.fill();
        // dedektif şapkası
        x.fillStyle = '#8a6a44'; x.beginPath(); x.ellipse(bx, by - 62, 58, 12, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(bx - 40, by - 62); x.quadraticCurveTo(bx, by - 112, bx + 40, by - 62); x.fill();
        x.strokeStyle = '#6a4a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(bx - 36, by - 72); x.lineTo(bx + 36, by - 72); x.stroke();
        // gözler
        [-24, 24].forEach((dx) => { x.fillStyle = '#fff6dc'; x.beginPath(); x.arc(bx + dx, by - 22, 22, 0, 7); x.fill(); x.strokeStyle = '#5a3a22'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#1a1208'; x.beginPath(); x.ellipse(bx + dx + Math.sin(t / 1500) * 4, by - 22, 10, 10 * goz, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(bx + dx + 3, by - 26, 3, 0, 7); x.fill(); });
        x.fillStyle = '#f2a83a'; x.beginPath(); x.moveTo(bx - 8, by - 6); x.lineTo(bx + 8, by - 6); x.lineTo(bx, by + 8); x.closePath(); x.fill();
        // büyüteç
        x.strokeStyle = '#3a2414'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx + 62, by + 30); x.lineTo(bx + 92, by + 64); x.stroke();
        x.strokeStyle = '#c8a050'; x.lineWidth = 6; x.beginPath(); x.arc(bx + 52, by + 18, 20, 0, 7); x.stroke(); x.fillStyle = 'rgba(180,220,255,.3)'; x.fill();
        x.restore();
        yaz(x, 'KOMİSER BAYKUŞ', bx, 548 + 22, 20, '#ffe2a0');
    }
    /* ---------------- SAHNE ---------------- */
    let _cv = null, _ctx = null, _raf = 0, _son = 0, _olcek = 1, _ox = 0, _oy = 0, _dpr = 1, _suclaMod = false, _tren = 0, _sonucAnim = null, _perdeFaz = null, _zaman = [];
    function panel() { return $('km-oyun-panel-dedektif'); }
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    const bekle = (ms) => new Promise((r) => sonra(r, ms));
    // Skor dock'u sol altta durur: sahnenin o köşesi bilerek süs (Komiser masası / deniz); kartlar dock'un üstünde açılır.
    let _alanImza = '';
    function serbestAlan(r) {
        let x0 = 0, x1 = r.width; const d = null; // v444: sahne dock köşesini boş bırakacak şekilde tasarlandı → tam alan
        if (d && d.offsetParent !== null) {
            const b = d.getBoundingClientRect();
            if (b.width > 150 && b.width < r.width * .6 && b.bottom > r.top + 40 && b.top < r.bottom && b.right > r.left && b.left < r.right) {
                if (b.left + b.width / 2 < r.left + r.width / 2) x0 = Math.max(0, b.right - r.left + 8); else x1 = Math.min(r.width, b.left - r.left - 8);
            }
        }
        if (x1 - x0 < r.width * .45) { x0 = 0; x1 = r.width; }
        return { x0, x1 };
    }
    function boyutla() {
        if (!_cv) return; const r = _cv.getBoundingClientRect(); if (!r.width || !r.height) return;
        const a = serbestAlan(r); _alanImza = [Math.round(r.width), Math.round(r.height), Math.round(a.x0), Math.round(a.x1)].join('|');
        _dpr = Math.min(2, window.devicePixelRatio || 1); _cv.width = Math.round(r.width * _dpr); _cv.height = Math.round(r.height * _dpr);
        const gw = a.x1 - a.x0; _olcek = Math.min(gw / W, r.height / H); _ox = a.x0 + (gw - W * _olcek) / 2; _oy = (r.height - H * _olcek) / 2; _statik = null;
    }
    let _alanSon = 0;
    function alanKontrol(t) { if (t - _alanSon < 400 || !_cv) return; _alanSon = t; const r = _cv.getBoundingClientRect(); if (!r.width) return; const a = serbestAlan(r); const im = [Math.round(r.width), Math.round(r.height), Math.round(a.x0), Math.round(a.x1)].join('|'); if (im !== _alanImza) boyutla(); }
    function ddkSahneKur(p) {
        p = p || panel(); if (!p) return; css(); zamanTemizle(); _suclaMod = false; _tren = 0; _sonucAnim = null; _perdeFaz = null;
        p.innerHTML = `<div class="ddk-kap"><canvas id="ddk-cv"></canvas>
          <div class="ddk-hud"><button class="ddk-btn ddk-sucla" id="ddk-sucla-btn">🫵 Suçla</button><button class="ddk-btn" id="ddk-zor-btn" title="Zorluk">⚙️</button><button class="ddk-btn" id="ddk-ses-btn" title="Ses">🔊</button><button class="ddk-btn" id="ddk-nasil-btn" title="Nasıl oynanır?">❓</button><button class="ddk-btn" id="ddk-yeni-btn" title="Bu vakayı baştan">🔄</button></div>
          <div class="ddk-perde" id="ddk-perde" hidden></div></div>`;
        _cv = $('ddk-cv'); _ctx = _cv.getContext('2d');
        try { new ResizeObserver(boyutla).observe(_cv); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        _cv.addEventListener('pointerdown', tiklama);
        $('ddk-sucla-btn').onclick = () => { const st = durum(); if (st.faz !== 'oyun') return; _suclaMod = !_suclaMod; ses('sec'); hudCiz(); };
        $('ddk-zor-btn').onclick = zorlukAc;
        $('ddk-ses-btn').onclick = () => { try { localStorage.setItem('dag_ddk_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); ses('sec'); };
        $('ddk-nasil-btn').onclick = nasil;
        $('ddk-yeni-btn').onclick = yeniSor;
        if (!_raf) { _son = performance.now(); _raf = requestAnimationFrame(dongu); }
        ddkGuncelle();
    }
    function hudCiz() {
        const b = $('ddk-sucla-btn'); if (b) { b.textContent = _suclaMod ? '✖ Vazgeç' : '🫵 Suçla'; b.classList.toggle('acik', _suclaMod); }
        const s = $('ddk-ses-btn'); if (s) s.textContent = sesAcik() ? '🔊' : '🔇';
    }
    function ddkGuncelle() {
        if (!panel()) return;
        const st = durum(); hudCiz();
        if (st.faz !== _perdeFaz) perdeCiz(st);
    }
    function dongu(t) {
        _raf = 0;
        if (!_cv || !document.body.contains(_cv)) { _cv = null; return; }
        const dt = Math.min(50, t - _son); _son = t;
        if (_cv.offsetParent !== null) { alanKontrol(t); ciz(t, dt); }
        _raf = requestAnimationFrame(dongu);
    }
    function ciz(t, dt) {
        const x = _ctx, st = _st || durum(); if (!x || !st.v) return;
        fxGuncelle(dt);
        for (const k in _kartAnim) if (_kartAnim[k] < 1) _kartAnim[k] = Math.min(1, _kartAnim[k] + dt / 450);
        x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#07080c'; x.fillRect(0, 0, _cv.width, _cv.height);
        const sc = _dpr * _olcek; x.setTransform(sc, 0, 0, sc, _dpr * _ox, _dpr * _oy);
        x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
        if (FX.shake) x.translate(rnd(-FX.shake, FX.shake), rnd(-FX.shake, FX.shake));
        if (!_statik || _statikOlcek !== sc) { _statik = document.createElement('canvas'); _statik.width = Math.ceil(W * sc); _statik.height = Math.ceil(H * sc); const sx = _statik.getContext('2d'); sx.setTransform(sc, 0, 0, sc, 0, 0); statikCiz(sx); _statikOlcek = sc; }
        x.drawImage(_statik, 0, 0, W, H);
        const V = VAKALAR[st.vaka] || VAKALAR[0];
        x.save(); x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < st.n; i++) { const cx = SX(st, i); const vurgu = _suclaMod || (st.sonuc && st.sonuc.i === i); const a = st.x[i] ? .03 : vurgu ? .16 : .09; const g = x.createLinearGradient(cx, 0, cx, AYAK); g.addColorStop(0, 'rgba(255,240,200,' + a * 1.8 + ')'); g.addColorStop(1, 'rgba(255,240,200,' + a * .4 + ')'); x.fillStyle = g; x.beginPath(); x.moveTo(cx - 16, 198); x.lineTo(cx + 16, 198); x.lineTo(cx + 70, AYAK); x.lineTo(cx - 70, AYAK); x.closePath(); x.fill(); x.fillStyle = 'rgba(255,240,200,' + a + ')'; x.beginPath(); x.ellipse(cx, AYAK + 6, 80, 14, 0, 0, 7); x.fill(); }
        x.restore();
        st.v.s.forEach((s, i) => { const d = st.sonuc && st.sonuc.i === i && st.sonuc.dogru ? 'suclu' : st.masum[i] ? 'masum' : st.x[i] ? 'x' : null; supheliCiz(x, s, SX(st, i), t, d); });
        if (_suclaMod) { const pu = Math.sin(t / 200) * .5 + .5; st.v.s.forEach((s, i) => { if (st.x[i] || st.masum[i]) return; const ust = AYAK - (s.boy === 'uzun' ? 330 : 258); yaz(x, '👆', SX(st, i), ust - 60 - pu * 10, 40, '#fff'); }); }
        for (let i = 0; i < 5; i++) { if (i < st.v.ipucu.length) kartCiz(x, i, st.v.ipucu[i], i < st.acik); else { const px = 14 + i * 251; x.strokeStyle = 'rgba(60,30,10,.35)'; x.setLineDash([8, 8]); x.lineWidth = 2; x.strokeRect(px + 4, 88, 235, 96); x.setLineDash([]); } }
        baykusCiz(x, t);
        yuv(x, 236, 222, 266, 128, 12); x.fillStyle = '#f5ecd6'; x.fill(); nesneCiz(x, V.nesne, 284, 296, .8);
        x.font = '15px ' + TF; x.fillStyle = '#7a2a1a'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('ÇALINAN:', 326, 246); { const r = kartSatir(x, V.ad, 166); x.font = r.boy + 'px ' + DF; x.fillStyle = '#2a2014'; r.sat.forEach((t, k) => x.fillText(t, 326, 284 + k * r.boy * 1.1)); }
        fxCiz(x);
        x.restore();
        if (FX.flash) { x.fillStyle = 'rgba(255,60,40,' + FX.flash * .4 + ')'; x.fillRect(0, 0, W, H); }
        // üst şerit
        x.fillStyle = 'rgba(6,8,14,.92)'; x.fillRect(0, 0, W, 74); x.fillStyle = '#ffc94a'; x.fillRect(0, 72, W, 3);
        yaz(x, 'VAKA ' + (st.vaka + 1) + '/5', 24, 22, 20, '#ffc94a', { al: 'left' });
        yaz(x, V.ad.toUpperCase(), 24, 52, 32, '#ffffff', { al: 'left' });
        for (let i = 0; i < 5; i++) { x.fillStyle = i < st.vaka ? '#5ee39b' : i === st.vaka ? '#ffc94a' : 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(150 + i * 26, 22, 8, 0, 7); x.fill(); }
        yaz(x, (DZ[st.zor] || DZ.normal).ad.toUpperCase(), 400, 38, 22, st.zor === 'zor' ? '#ff9a6a' : st.zor === 'kolay' ? '#9ff0c4' : '#ffd98a');
        const kalan = st.maxSaat - st.saat, cx = 520, cy = 37, R = 31;
        x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 4; x.stroke();
        for (let i = 0; i < st.maxSaat; i++) { const a = -Math.PI / 2 + i / st.maxSaat * Math.PI * 2; x.fillStyle = i < st.saat ? '#d23a32' : '#222'; x.beginPath(); x.arc(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 3.5, 0, 7); x.fill(); }
        const ya = -Math.PI / 2 + st.saat / st.maxSaat * Math.PI * 2; x.strokeStyle = '#d23a32'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ya) * 18, cy + Math.sin(ya) * 18); x.stroke();
        const tehlike = kalan <= 2 && st.faz === 'oyun';
        yaz(x, '🚂 TREN ' + kalan + ' SERİ SONRA', cx + 46, 26, 26, tehlike ? '#ff7a6a' : '#ffffff', { al: 'left', a: tehlike ? .6 + Math.sin(t / 150) * .4 : 1 });
        yaz(x, 'kalkmadan hırsızı bul!', cx + 46, 56, 18, '#b8c0e0', { al: 'left' });
        // atan + şimdi cümlesi
        if (st.faz === 'oyun') {
            const s = aktifSporcu();
            yuv(x, SIRA_X0, 664, 744, 48, 14); x.fillStyle = 'rgba(10,12,24,.88)'; x.fill();
            const tumu = st.acik >= st.v.ipucu.length;
            yaz(x, tumu ? 'Bütün ipuçları açık! Hırsızı gösterin, 🫵 Suçla' : (s ? '🏹 ' + ilkAd(s.ad).toUpperCase() + ' atıyor · ' : '') + 'İpucu için ' + st.esik + '+', SIRA_X0 + 372, 688, 28, tumu ? '#ffd98a' : '#ffffff');
        }
        if (_suclaMod) { yuv(x, SIRA_X0 + 20, 204, 704, 52, 16); x.fillStyle = 'rgba(140,20,20,.92)'; x.fill(); yaz(x, 'KİMİ SUÇLUYORSUNUZ? ŞÜPHELİYE DOKUN', SIRA_X0 + 372, 230, 26, '#fff'); }
        if (_tren > 0) { _tren += dt / 2200; const tx = lerp(-300, W + 300, Math.min(1, _tren)); x.fillStyle = '#1b1b22'; yuv(x, tx - 160, 560, 320, 90, 14); x.fill(); x.fillStyle = '#d23a32'; x.fillRect(tx - 160, 590, 320, 10); x.fillStyle = '#ffd98a'; for (let i = 0; i < 4; i++) x.fillRect(tx - 140 + i * 70, 572, 40, 22); x.fillStyle = '#222'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(tx - 130 + i * 65, 652, 16, 0, 7); x.fill(); } if (_tren >= 1) _tren = 0; }
    }
    function tiklama(e) {
        const st = durum(); if (st.faz !== 'oyun') return;
        const r = _cv.getBoundingClientRect(); const qx = (e.clientX - r.left - _ox) / _olcek, qy = (e.clientY - r.top - _oy) / _olcek;
        if (qx < SIRA_X0 - 10 || qy < 200 || qy > AYAK + 20) return;
        const i = Math.floor((qx - SIRA_X0) / SARA(st)); if (i < 0 || i >= st.n || st.masum[i]) return;
        if (_suclaMod) { if (!st.x[i]) suclaSor(i); return; }
        st.x[i] = st.x[i] ? 0 : 1; kaydet(); ses('sec'); if (st.x[i]) fxYazi(SX(st, i), 300, 'BU DEĞİL!', '#ff8a8a', 34, 50);
    }

    /* ---------------- PERDELER (kartlar) ---------------- */
    function perde(html, bag) { const p = $('ddk-perde'); if (!p) return; p.innerHTML = html; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('ddk-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(aktif) { return '<p><b>Zorluk seç:</b></p><div class="ddk-zorsec">' + Object.keys(DZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === aktif ? 'on' : '') + '"><span class="n">' + DZ[k].ad + '</span><span class="d">' + DZ[k].d + '</span></button>').join('') + '</div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const V = VAKALAR[st.vaka] || VAKALAR[0];
        if (st.faz === 'oyun') { perdeKapat(); return; }
        if (st.faz === 'basla') {
            perde('<div class="ddk-kart"><span class="ddk-etiket">Gizli dosya · Vaka ' + (st.vaka + 1) + ' / 5 · ' + kacis(V.yer) + '</span><h2>' + kacis(V.ad) + '</h2><p>' + (st.rovans ? 'Hırsız yine aynı numarayı yaptı! ' : '') + kacis(V.hikaye.replace('{n}', st.n)) + '</p><p class="ddk-anlat">' + kacis(V.anlat) + '</p>' + (st.vaka === 0 && !st.rovans ? zorSecHTML(st.zor) : '') + '<div class="ddk-butonlar"><button class="ddk-b" id="ddk-bas">🔍 Soruşturmayı başlat</button></div><p class="ddk-not">İlk seri girilince soruşturma kendiliğinden başlar.</p></div>', (p) => {
                p.querySelector('#ddk-bas').onclick = () => { const s = durum(); s.faz = 'oyun'; kaydet(); ses('kart'); ddkGuncelle(); };
                p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { zorAyarla(b.dataset.z); });
            });
        } else if (st.faz === 'cozuldu') {
            perde('<div class="ddk-kart"><div class="ddk-buyuk">🔒✅</div><span class="ddk-etiket">Vaka ' + (st.vaka + 1) + ' kapandı</span><h2>' + kacis(V.ad) + ' bulundu!</h2><p>Hırsızı hep birlikte yakaladık. Bu vakanın dedektifleri:</p>' + adlarHTML(siraliAdlar(st.vakaAtan)) + '<p class="ddk-anlat">Komiser Baykuş: "Aferin! Ama telsizden yeni bir ihbar geliyor…"</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-dev">Sıradaki vaka →</button></div></div>', (p) => {
                p.querySelector('#ddk-dev').onclick = () => { sonrakiVaka(durum()); kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'kacti') {
            const h = st.v.s[st.v.h];
            perde('<div class="ddk-kart"><div class="ddk-buyuk">🚂💨</div><h2>Tren kalktı!</h2><p>Hırsız ' + h.no + ' numaraydı ve kaçtı… Ama Komiser Baykuş izini sürüyor.</p><p class="ddk-anlat">Komiser Baykuş: "Bir sonraki trene yetişiriz! Bu sefer daha hızlı ipucu toplayalım."</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-rov">🔁 Rövanş: bu vakayı yeniden</button></div></div>', (p) => {
                p.querySelector('#ddk-rov').onclick = () => { const s = durum(); vakaKur(s); s.rovans = true; s.faz = 'basla'; kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'final') {
            const hep = siraliAdlar(st.hepAtan);
            perde('<div class="ddk-kart"><div class="ddk-buyuk">👑🏆🦉</div><h2>BÜTÜN VAKALAR ÇÖZÜLDÜ!</h2><p>Kral, ' + hep.length + ' okçuyu "Kraliyet Dedektifi" ilan etti:</p>' + adlarHTML(hep) + '<p>Toplam ' + st.toplamOk + ' ok</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-yeni">🔁 Yeni dosyalar</button></div></div>', (p) => {
                p.querySelector('#ddk-yeni').onclick = () => { _st = bosDurum(st.zor); kaydet(); ddkGuncelle(); };
            });
        }
    }
    function sonrakiVaka(st) { st.vaka = Math.min(4, st.vaka + 1); st.rovans = false; vakaKur(st); st.faz = 'basla'; }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esikEl = 0; vakaKur(st); st.faz = 'basla'; kaydet(); ses('sec'); _perdeFaz = null; ddkGuncelle(); }
    function zorlukAc() {
        const st = durum();
        perde('<div class="ddk-kart"><h2>⚙️ Zorluk</h2><p>Değiştirirsen bu vaka yeni şüphelilerle baştan başlar.</p>' + zorSecHTML(st.zor) + '<p><b>İpucu için gereken puan:</b></p><div class="ddk-esik">' + [5, 6, 7, 8].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="ddk-butonlar"><button class="ddk-b ikincil" id="ddk-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; s.esikEl = s.esik; kaydet(); ses('sec'); zorlukAc(); });
            p.querySelector('#ddk-kapat').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        perde('<div class="ddk-kart"><h2>🕵️ Nasıl oynanır?</h2><p class="ddk-sol">📣 <b>Koç söyler:</b> "İyi atılan her ok bir ipucu açar. Tren kalkmadan hırsızı hep birlikte bulun!"<br>🏹 Eşiği geçen ok panoya bir ipucu kartı açar. <b>10/X</b> altın ipucudur: Komiser Baykuş bir masumu eler.<br>🙋 Sınıf "bu değil!" derse şüpheliye dokun, üstü çizilir. Hazır olunca <b>🫵 Suçla</b>.<br>⚠️ Yanlış suçlama 2 seri kaybettirir. Saat dolarsa tren kalkar, hırsız kaçar.<br>⚙️ Zorluk: Kolay (4 şüpheli, uymayanlar kendiliğinden elenir) · Normal · Zor ("DEĞİLDİ" ipuçları).</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-tamam">Tamam</button></div></div>', (p) => { p.querySelector('#ddk-tamam').onclick = () => { _perdeFaz = null; ddkGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    function yeniSor() {
        perde('<div class="ddk-kart"><h2>🔄 Bu vaka baştan mı?</h2><p>Yeni şüpheliler ve yeni ipuçları gelir. Vaka numarası aynı kalır.</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-evet">Evet, baştan</button><button class="ddk-b ikincil" id="ddk-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#ddk-evet').onclick = () => { const s = durum(); vakaKur(s); s.faz = 'basla'; kaydet(); _perdeFaz = null; ddkGuncelle(); };
            p.querySelector('#ddk-hayir').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'yeni';
    }
    function suclaSor(i) {
        const st = durum(); _suclaMod = false; hudCiz();
        perde('<div class="ddk-kart"><span class="ddk-etiket">Suçlama</span><h2>' + st.v.s[i].no + ' numara mı?</h2><p>Sınıf emin mi? Herkes "evet" derse koç bassın.</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-evet">🫵 Evet, hırsız bu!</button><button class="ddk-b ikincil" id="ddk-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#ddk-hayir').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
            p.querySelector('#ddk-evet').onclick = () => { perdeKapat(); _perdeFaz = 'oyun'; sucla(i); };
        });
        _perdeFaz = 'sucla';
    }
    async function sucla(i) {
        const st = durum(); ses('davul'); st.sonuc = { i: i, dogru: null }; await bekle(1300);
        if (i === st.v.h) {
            st.sonuc.dogru = true; kaydet(); ses('dogru'); FX.shake = 12; fxParca(SX(st, i), 300, 80, ['#ffd34a', '#ff7a5a', '#8fe0ff', '#fff'], 12, 7); fxYazi(SX(st, i), 220, 'YAKALANDI!', '#ffd34a', 64, 120);
            await bekle(1800);
            const s = durum(); s.faz = s.vaka >= 4 ? 'final' : 'cozuldu'; kaydet(); ddkGuncelle();
        } else {
            st.sonuc = null; st.masum[i] = 1; st.saat = Math.min(st.maxSaat, st.saat + 2); kaydet();
            ses('yanlis'); FX.flash = .6; FX.shake = 14; fxYazi(SX(st, i), 260, 'MASUM!', '#5ee39b', 56, 100); fxYazi(SIRA_X0 + 372, 260, '⏰ 2 seri kaybettik!', '#ff8a8a', 40, 110);
            if (st.saat >= st.maxSaat) { await bekle(800); kacti(); }
        }
    }
    async function kacti() { const st = durum(); ses('dudu'); _tren = .0001; await bekle(2300); st.faz = 'kacti'; kaydet(); ddkGuncelle(); }

    /* ---------------- SERİ ---------------- */
    function ddkSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitir = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        const st = durum();
        // Kart açıkken seri girildiyse sıradaki adıma geç (koç kartı kapatmayı unuttu)
        if (st.faz === 'cozuldu') sonrakiVaka(st);
        if (st.faz === 'kacti') { vakaKur(st); st.rovans = false; }
        if (st.faz === 'final') { _st = bosDurum(st.zor); }
        const S = durum(); S.faz = 'oyun'; _suclaMod = false; _perdeFaz = null; kaydet(); perdeKapat(); hudCiz();
        const key = s.g + '|' + s.ad, oklar = (kaydedilecek || []).map((k) => okDeger(k.puan));
        if (S.vakaAtan.indexOf(s.ad) === -1) S.vakaAtan.push(s.ad);
        if (S.hepAtan.indexOf(s.ad) === -1) S.hepAtan.push(s.ad);
        S.toplamOk += oklar.length;
        const gorsel = !!(_cv && document.body.contains(_cv) && _cv.offsetParent !== null);
        (async () => {
            for (const p of oklar) {
                const hedefIp = S.acik < S.v.ipucu.length; const tx = hedefIp ? 14 + S.acik * 251 + 121 : 640, ty = hedefIp ? 136 : 160;
                const isabet = p >= S.esik && hedefIp;
                if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, isabet ? tx : tx + rnd(-140, 140), isabet ? ty : ty + rnd(40, 90), 520); }
                if (isabet) {
                    _kartAnim[S.acik] = 0; S.acik++; S.katki[key] = (S.katki[key] || 0) + 1;
                    if (gorsel) { ses('kart'); fxParca(tx, ty, 24, ['#ffd34a', '#fff3c4'], 7, 5); fxYazi(tx, ty + 90, '🔍 İPUCU!', '#ffd34a', 46, 80); }
                    if ((DZ[S.zor] || DZ.normal).oto) { const c = S.v.ipucu[S.acik - 1]; S.v.s.forEach((o, j) => { if (!eslesir(o, c) && !S.x[j] && !S.masum[j]) { S.x[j] = 1; if (gorsel) fxYazi(SX(S, j), 300, 'UYMUYOR', '#ff8a8a', 30, 80); } }); }
                    if (p === 10) { const aday = S.v.s.map((_, j) => j).filter((j) => j !== S.v.h && !S.x[j] && !S.masum[j]); if (aday.length) { const m = sec(aday); S.masum[m] = 1; if (gorsel) { ses('kritik'); fxYazi(SX(S, m), 240, '🦉 MASUM!', '#5ee39b', 44, 110); fxYazi(SIRA_X0 + 372, 300, 'ALTIN İPUCU! Komiser birini eledi', '#ffd34a', 36, 120); } } }
                } else if (gorsel) { if (p >= S.esik) { fxYazi(640, 240, 'Bütün ipuçları açık!', '#ffd34a', 30); ses('vur'); } else { fxYazi(tx, 240, p === 0 ? 'ISKA' : 'iz bulunamadı…', '#e8d8c0', 36); ses('iska'); } }
                kaydet();
                if (gorsel) await bekle(120);
            }
            S.saat++; kaydet();
            if (gorsel) { ses('tik'); if (S.maxSaat - S.saat === 2) { fxYazi(SIRA_X0 + 372, 260, '🚂 Düdük çaldı! 2 seri kaldı!', '#ff8a6a', 38, 120); ses('dudu'); } }
            bitir();
            if (S.saat >= S.maxSaat) { if (gorsel) kacti(); else { S.faz = 'kacti'; kaydet(); } }
        })().catch(() => bitir());
        setTimeout(bitir, 6000); // emniyet: animasyon takılırsa dock kilitli kalmasın
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function ddkAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function ddkGeriYukle(k) { if (!k) return; zamanTemizle(); _st = k; _stKonum = konum(); kaydet(); _perdeFaz = null; if (panel()) ddkGuncelle(); }
    function ddkSporcu(g, ad) { const st = durum(); const n = st.katki[g + '|' + ad] || 0; return n ? '🔍' + n : '-'; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('ddk-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'ddk-css';
        st.textContent = `
.km-oyun-panel-dedektif{padding:0;background:#07080c;overflow:hidden}
.ddk-kap{position:absolute;inset:0}
.ddk-kap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;cursor:pointer}
.ddk-hud{position:absolute;right:8px;top:6px;display:flex;gap:5px;z-index:2}
.ddk-btn{background:rgba(10,12,24,.85);border:1px solid #3b4680;color:#fff;border-radius:999px;min-width:36px;height:36px;font-size:16px;cursor:pointer;padding:0 10px;font-weight:900}
.ddk-btn.ddk-sucla{background:#c2262f;border-color:#ff7a7a;font-size:17px;padding:0 16px}
.ddk-btn.ddk-sucla.acik{background:#555}
.ddk-perde{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:2%;background:rgba(5,6,14,.62);backdrop-filter:blur(2px)}
.ddk-perde[hidden]{display:none}
.ddk-kart{max-width:800px;width:100%;max-height:100%;overflow:auto;background:linear-gradient(160deg,#e9dcc0,#d6c39c);color:#2a2014;border:2px solid #8a6d3b;border-radius:20px;padding:clamp(12px,2.6vw,26px);display:flex;flex-direction:column;gap:clamp(6px,1.2vw,12px);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.ddk-kart h2{margin:0;font-family:"Special Elite","Courier New",monospace;font-size:clamp(24px,3.6vw,42px);line-height:1.1}
.ddk-kart p{margin:0 auto;max-width:60ch;font-size:clamp(15px,1.9vw,22px);color:#3a2c1a;line-height:1.4}
.ddk-kart .ddk-sol{text-align:left}
.ddk-anlat{font-style:italic;color:#7a3a10!important}
.ddk-not{font-size:13px!important;opacity:.7}
.ddk-etiket{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#7a5a2a}
.ddk-buyuk{font-size:clamp(34px,6vw,64px);line-height:1}
.ddk-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.ddk-adlar span{background:#2a3566;color:#fff;border-radius:999px;padding:3px 12px;font-weight:800;font-size:clamp(13px,1.6vw,17px)}
.ddk-butonlar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.ddk-b{border:0;cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.2vw,23px);padding:10px 22px;border-radius:14px;background:#ffc94a;color:#241800}
.ddk-b.kirmizi{background:#d93a3a;color:#fff}.ddk-b.ikincil{background:#2a3566;color:#fff}
.ddk-zorsec{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ddk-zorsec button{cursor:pointer;border-radius:16px;padding:10px;background:#fff8e6;border:3px solid #c8a868;color:#2a2014;display:flex;flex-direction:column;gap:3px;align-items:center}
.ddk-zorsec button.on{border-color:#ff9a1a;box-shadow:0 0 0 3px rgba(255,154,26,.35)}
.ddk-zorsec .n{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.4vw,25px)}.ddk-zorsec .d{font-weight:800;font-size:12px;opacity:.8}
.ddk-esik{display:flex;gap:8px;justify-content:center}.ddk-esik button{cursor:pointer;border-radius:12px;padding:8px 16px;font-weight:900;font-size:18px;background:#fff8e6;border:2px solid #c8a868}.ddk-esik button.on{border-color:#ff9a1a;background:#ffe2a8}
@media (max-width:600px){.ddk-zorsec{grid-template-columns:1fr}.ddk-zorsec .d{display:none}.ddk-btn{height:36px;min-width:36px;font-size:15px}}`;
        document.head.appendChild(st);
    }

    window.ddkSahneKur = ddkSahneKur;
    window.ddkGuncelle = ddkGuncelle;
    window.ddkSeri = ddkSeri;
    window.ddkAnlik = ddkAnlik;
    window.ddkGeriYukle = ddkGeriYukle;
    window.ddkSporcu = ddkSporcu;
    // e2e: i. şüphelinin ekrandaki (client) gövde noktası
    window.ddkSupheliNokta = (i) => { if (!_cv) return null; const r = _cv.getBoundingClientRect(); return { x: r.left + _ox + SX(durum(), i) * _olcek, y: r.top + _oy + 470 * _olcek }; };
})();
