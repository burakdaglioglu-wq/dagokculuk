/* ================================================================================================
   🌋 YANARDAĞ HAZİNESİ — Karışık Sınıf › Oyunlar teması 'yanardag' (v444, 2026-11-22).
   Dedektif Okçular ile birlikte seçildi (bkz. dagsk-km-dedektif.js başlığı). Taslak: claude.ai/artifact/NccwUsq6iJ9v9nFJfTqBag
   OYUN: Ejder yumurtaları patlamak üzere olan yanardağın yamacında. Eşiği geçen ok lava en yakın yumurtayı tekneye
   fırlatır (10/X altın yumurta = 3). Her seriden sonra lav aşağı akar (ulaştığı yumurtayı yakar), öfke artar; patlama
   serisi GİZLİ. Patlamadıysa SINIF OYLAR: 🔥 DEVAM / 🚣 KAÇ. KAÇ → bekleyen sıra 5 sn kürek çeker, teknedekiler ambara.
   Patlarsa teknedekilerin yarısı yanar. 5 ada zinciri; final: ambardaki yumurtadan yavru ejder, herkesin adı.
   ZORLUK: Kolay 5+/geç patlar/yavaş lav/kaptan uyarır/hedef 15 · Normal 7+/hedef 20 · Zor 8+/erken/sahte gümbür/hedef 25.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Oy açıkken seri girilirse DEVAM sayılır.
     yngSahneKur(panel) · yngGuncelle() · yngSeri(s, i, kaydedilecek, done) · yngAnlik() · yngGeriYukle(k) · yngSporcu(g, ad)
   DURUM 'dag_km_yanardag_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL; 12 saat kuralı KM_OYUN_SIFIR_ONEK'te.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1280, H = 720;
    const DF = '"Lilita One","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = (a) => a[Math.floor(Math.random() * a.length)];
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function aktifSporcu() { const l = liste(); const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; return l[i] || null; }
    function adlarHTML(l) { return '<div class="yng-adlar">' + l.map((a) => '<span>' + kacis(ilkAd(a)) + '</span>').join('') + '</div>'; }
    function siraliAdlar(a) { return (a || []).slice().sort((x, y) => String(x).localeCompare(String(y), 'tr')); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_yng_ses') !== '0'; } catch (e) { return true; } }
    function ses(t) {
        if (!sesAcik()) return;
        try {
            AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = AC.currentTime;
            const ton = (f, d, tip, v, f2, g0) => { const o = AC.createOscillator(), g = AC.createGain(), b = n + (g0 || 0); o.type = tip || 'sine'; o.frequency.setValueAtTime(f, b); if (f2) o.frequency.exponentialRampToValueAtTime(f2, b + d); g.gain.setValueAtTime(v || .15, b); g.gain.exponentialRampToValueAtTime(.001, b + d); o.connect(g).connect(AC.destination); o.start(b); o.stop(b + d + .02); };
            const gur = (d, v, fr) => { const L = Math.floor(AC.sampleRate * d), bf = AC.createBuffer(1, L, AC.sampleRate), c = bf.getChannelData(0); for (let i = 0; i < L; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / L); const s = AC.createBufferSource(); s.buffer = bf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fr || 1200; const g = AC.createGain(); g.gain.value = v || .3; s.connect(f).connect(g).connect(AC.destination); s.start(); };
            ({
                cek: () => ton(900, .12, 'triangle', .06, 1600),
                kritik: () => { [660, 880, 1320].forEach((f, i) => ton(f, .18, 'triangle', .11, null, i * .07)); },
                iska: () => ton(300, .25, 'sine', .08, 150),
                yumurta: () => { ton(700, .1, 'sine', .12, 1100); ton(1100, .12, 'sine', .08, 1600, .08); },
                lav: () => gur(.5, .25, 250),
                gumbur: () => { gur(1.4, .6, 180); ton(55, 1.2, 'sawtooth', .12, 30); },
                kurek: () => gur(.25, .2, 700),
                zafer: () => [523, 659, 784, 1046].forEach((f, i) => ton(f, .35, 'triangle', .12, null, i * .12)),
                yanlis: () => { ton(300, .3, 'sawtooth', .1, 200); ton(200, .4, 'sawtooth', .1, 120, .25); },
                sec: () => ton(880, .07, 'square', .05)
            })[t]();
        } catch (e) { }
    }

    /* ---------------- VERİ ---------------- */
    const YZ = {
        kolay: { ad: '🐣 Kolay', d: '5+ yumurta · yanardağ geç patlar · lav yavaş · kaptan uyarır', esik: 5, patla: [5, 6, 6, 7, 7, 8, 9], lav: [.05, .11], gurultu: 0, hedef: 15 },
        normal: { ad: '🦊 Normal', d: '7+ yumurta · hedef 20', esik: 7, patla: [3, 4, 4, 5, 5, 5, 6, 6, 7, 8], lav: [.08, .17], gurultu: 1, hedef: 20 },
        zor: { ad: '🧠 Zor', d: '8+ yumurta · erken patlayabilir · sahte gümbürtüler · hedef 25', esik: 8, patla: [3, 3, 4, 4, 5, 5, 6], lav: [.1, .2], gurultu: 2, hedef: 25 }
    };
    const ADALAR = [
        { ad: 'Kül Adası', gok: ['#ff9a5a', '#7a2d5a', '#2a1238'], deniz: ['#2a5f8a', '#0d2238'], tas: ['#4a3a3a', '#2a1e22'], yum: ['#9be3c8', '#5ab89a'], hikaye: 'Ejder Anne yumurtalarını yanardağın yamacına bırakıp yiyecek aramaya gitti. Ama yanardağ uyanıyor! Kaptan Mercan sandalı adaya yanaştırdı.', anlat: 'Kaptan Mercan: "Ne kadar çok yumurta, o kadar çok yavru ejder! Ama ne zaman kaçacağımıza hep birlikte karar vereceğiz."' },
        { ad: 'Zümrüt Ada', gok: ['#8fd3ff', '#4a8ac8', '#1a3a6a'], deniz: ['#1f8a9a', '#0a3040'], tas: ['#3a5a3a', '#1f2e22'], yum: ['#ffd0e8', '#e88ab8'], hikaye: 'İkinci ada yemyeşil ama dağın tepesinden kara duman yükseliyor. Pembe yumurtalar çatlamak üzere!', anlat: 'Kaptan Mercan: "Bu yanardağ sessiz… Sessiz olan daha tehlikelidir!"' },
        { ad: 'Gece Adası', gok: ['#3a2a7a', '#1a1240', '#08061a'], deniz: ['#1a2a6a', '#060a20'], tas: ['#2a2440', '#141022'], yum: ['#c8b8ff', '#8a6ad8'], hikaye: 'Gece oldu. Karanlıkta parlayan mor yumurtalar sadece lavın ışığında görünüyor.', anlat: 'Kaptan Mercan: "Lav karanlıkta daha parlak. Hangi yöne aktığını iyi izleyin!"' },
        { ad: 'Buz Yanardağı', gok: ['#cfe8ff', '#7aa8d8', '#2a4a7a'], deniz: ['#4a7aa8', '#12304a'], tas: ['#6a7a90', '#3a4658'], yum: ['#9fe8ff', '#4ab8e8'], hikaye: 'Garip bir ada: tepesi buzla kaplı ama içi lav dolu! Buz eridikçe lav daha hızlı akacak.', anlat: 'Kaptan Mercan: "Buz kırılırsa her şey bir anda olur. Cesur ama dikkatli!"' },
        { ad: 'Ejder Dağı', gok: ['#ff6a3a', '#8a1a1a', '#2a0606'], deniz: ['#5a2a3a', '#1a0a10'], tas: ['#3a1a14', '#1a0a08'], yum: ['#ffd95a', '#e8a020'], hikaye: 'Son ada: Ejder Anne\'nin kendi yuvası. Altın yumurtalar burada. Ama bu dağ hepsinden öfkeli!', anlat: 'Kaptan Mercan: "Son kez! Bu yumurtaları kurtarırsak Ejder Anne bizi hiç unutmaz."' }
    ];
    const YOL = [
        [[835, 214], [805, 280], [770, 350], [730, 420], [680, 490], [630, 560]],
        [[868, 214], [872, 300], [862, 380], [870, 460], [890, 560]],
        [[905, 214], [955, 290], [1010, 370], [1070, 450], [1150, 560]]
    ];
    const YUM_YER = [[0, .32, -46], [0, .55, 50], [0, .78, -50], [0, .92, 44], [1, .3, 44], [1, .52, -44], [1, .74, 46], [1, .93, -46], [2, .33, 46], [2, .55, -48], [2, .76, 50], [2, .92, -44]];
    function yolNokta(yi, t) { const P = YOL[yi]; const n = P.length - 1; const f = Math.max(0, Math.min(.9999, t)) * n; const i = Math.floor(f), u = f - i; return [lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u), Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0])]; }

    /* ---------------- DURUM ---------------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_yanardag_' + konum(); }
    function bosDurum(zor) { zor = YZ[zor] ? zor : 'normal'; const st = { tarih: bugun(), zor, esik: YZ[zor].esik, hedef: YZ[zor].hedef, ada: 0, ambar: 0, hepAtan: [], toplamOk: 0, katki: {}, yanan: 0 }; adaKur(st); return st; }
    function adaKur(st) {
        st.yum = YUM_YER.map((p, i) => { const q = yolNokta(p[0], p[1]); const nx = -Math.sin(q[2]), ny = Math.cos(q[2]); return { id: i, yi: p[0], t: p[1], pos: [Math.round(q[0] + nx * p[2]), Math.round(q[1] + ny * p[2] * .5 - 18)], d: 'var' }; });
        st.lav = [0, 0, 0]; st.tekne = 0; st.seriNo = 0; st.ofke = 0; st.adaAtan = []; st.son = null;
        const Z = YZ[st.zor] || YZ.normal; st.patla = Math.max(2, sec(Z.patla) + (st.ada === 4 ? -1 : 0)); st.faz = 'basla';
    }
    function durum() {
        if (_stKonum !== konum()) { _st = null; _stHam = null; _stKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (ham !== _stHam) { _stHam = ham; try { _st = ham ? JSON.parse(ham) : null; } catch (e) { _st = null; } }
        if (!_st || _st.tarih !== bugun() || !_st.yum) { _st = bosDurum(_st && _st.zor); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }

    /* ---------------- ÇİZİM YARDIMCILARI + EFEKTLER ---------------- */
    function yaz(x, t, px, py, size, renk, o) { o = o || {}; x.save(); x.font = size + 'px ' + DF; x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; if (o.a != null) x.globalAlpha *= o.a; x.lineJoin = 'round'; x.lineWidth = o.kalin || Math.max(4, size / 7); x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(t, px, py); x.fillStyle = renk; x.fillText(t, px, py); x.restore(); }
    function yuv(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    const FX = { p: [], f: [], a: [], shake: 0, flash: 0 };
    function fxParca(px, py, n, renk, hiz, boy, g, omur) { hiz = hiz || 7; boy = boy || 6; omur = omur || 50; for (let i = 0; i < n; i++) { const an = Math.random() * Math.PI * 2, v = rnd(.3, 1) * hiz; FX.p.push({ x: px, y: py, vx: Math.cos(an) * v, vy: Math.sin(an) * v - hiz * .3, l: omur * rnd(.5, 1), m: omur, r: Array.isArray(renk) ? sec(renk) : renk, s: boy * rnd(.5, 1.3), g: g == null ? .25 : g }); } }
    function fxYazi(px, py, t, renk, boy, omur) { FX.f.push({ x: px, y: py, t, r: renk, s: boy || 56, l: omur || 70, m: omur || 70 }); }
    function fxOk(x0, y0, x1, y1, dur, yay) { return new Promise((res) => FX.a.push({ tip: 'ok', x0, y0, x1, y1, t: 0, dur, res, yay: yay == null ? 170 : yay, iz: [] })); }
    function fxUcan(ciz, x0, y0, x1, y1, dur, yay) { return new Promise((res) => FX.a.push({ tip: 'ucan', ciz, x0, y0, x1, y1, t: 0, dur, res, yay: yay == null ? 200 : yay, iz: [] })); }
    function fxNokta(a, t) { const cx = (a.x0 + a.x1) / 2, cy = Math.min(a.y0, a.y1) - a.yay, u = 1 - t; return { x: u * u * a.x0 + 2 * u * t * cx + t * t * a.x1, y: u * u * a.y0 + 2 * u * t * cy + t * t * a.y1 }; }
    function fxGuncelle(dt) {
        const k = dt / 16.7;
        for (const p of FX.p) { p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k; p.vx *= Math.pow(.98, k); p.l -= k; } FX.p = FX.p.filter((p) => p.l > 0);
        for (const f of FX.f) { f.l -= k; f.y -= .8 * k; } FX.f = FX.f.filter((f) => f.l > 0);
        for (const a of FX.a) { a.t += dt / a.dur; a.iz.push(fxNokta(a, Math.min(1, a.t))); if (a.iz.length > 10) a.iz.shift(); if (a.t >= 1 && !a.bitti) { a.bitti = true; a.res(); } } FX.a = FX.a.filter((a) => !a.bitti);
        FX.shake *= Math.pow(.88, k); if (FX.shake < .3) FX.shake = 0; FX.flash *= Math.pow(.92, k); if (FX.flash < .01) FX.flash = 0;
    }
    function fxCiz(x) {
        for (const a of FX.a) {
            const t = Math.min(1, a.t), q = fxNokta(a, t), q2 = fxNokta(a, Math.max(0, t - .03)), an = Math.atan2(q.y - q2.y, q.x - q2.x);
            x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 1; i < a.iz.length; i++) { x.strokeStyle = 'rgba(255,230,160,' + (i / a.iz.length * .5) + ')'; x.lineWidth = (a.tip === 'ok' ? 4 : 8) * i / a.iz.length; x.beginPath(); x.moveTo(a.iz[i - 1].x, a.iz[i - 1].y); x.lineTo(a.iz[i].x, a.iz[i].y); x.stroke(); } x.restore();
            if (a.tip === 'ok') { x.save(); x.translate(q.x, q.y); x.rotate(an); x.strokeStyle = '#e8d2a8'; x.lineWidth = 4; x.beginPath(); x.moveTo(-52, 0); x.lineTo(0, 0); x.stroke(); x.fillStyle = '#d9dde8'; x.beginPath(); x.moveTo(10, 0); x.lineTo(-6, -7); x.lineTo(-6, 7); x.closePath(); x.fill(); x.fillStyle = '#ff4f5e'; x.beginPath(); x.moveTo(-52, 0); x.lineTo(-64, -9); x.lineTo(-46, 0); x.lineTo(-64, 9); x.closePath(); x.fill(); x.restore(); }
            else a.ciz(x, q.x, q.y, t);
        }
        for (const p of FX.p) { x.globalAlpha = Math.max(0, p.l / p.m); x.fillStyle = p.r; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); } x.globalAlpha = 1;
        for (const f of FX.f) { const a = Math.min(1, f.l / (f.m * .4)), sk = 1 + Math.max(0, (f.l - f.m + 10) / 10) * .4; yaz(x, f.t, f.x, f.y, f.s * sk, f.r, { a }); }
    }
    function yumurtaCiz(x, cx, cy, r, renk, o) {
        o = o || {}; x.save(); x.translate(cx, cy); if (o.rot) x.rotate(o.rot);
        if (o.altin) { const g = x.createRadialGradient(0, 0, 4, 0, 0, r * 2.4); g.addColorStop(0, 'rgba(255,220,90,.55)'); g.addColorStop(1, 'rgba(255,220,90,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 2.4, 0, 7); x.fill(); }
        const g = x.createRadialGradient(-r * .35, -r * .5, r * .15, 0, 0, r * 1.4); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, o.altin ? '#ffe58a' : renk[0]); g.addColorStop(1, o.altin ? '#c88a10' : renk[1]);
        x.fillStyle = g; x.beginPath(); x.moveTo(0, -r * 1.3); x.bezierCurveTo(r * .95, -r * 1.3, r * 1.05, r * .9, 0, r * .95); x.bezierCurveTo(-r * 1.05, r * .9, -r * .95, -r * 1.3, 0, -r * 1.3); x.fill();
        x.fillStyle = 'rgba(0,0,0,.18)';[[-.35, -.2, .18], [.3, .25, .14], [-.1, .5, .12], [.35, -.55, .1]].forEach((s) => { x.beginPath(); x.arc(s[0] * r, s[1] * r, s[2] * r, 0, 7); x.fill(); });
        if (o.catlak) { x.strokeStyle = 'rgba(40,20,10,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-r * .6, -r * .1); x.lineTo(-r * .2, -r * .35); x.lineTo(r * .1, -r * .05); x.lineTo(r * .5, -r * .3); x.stroke(); }
        x.restore();
    }
    function palmiye(x, px, py, egik) {
        x.save(); x.translate(px, py); x.strokeStyle = '#6a4a2a'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(egik * 120, -70, egik * 90, -140); x.stroke();
        const tx = egik * 90, ty = -140; x.fillStyle = '#2f7a3a'; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55; x.save(); x.translate(tx, ty); x.rotate(a); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(40, -18, 80, 10); x.quadraticCurveTo(40, -4, 0, 0); x.fill(); x.restore(); }
        x.restore();
    }
    function statikCiz(x, ada) {
        const A = ADALAR[ada] || ADALAR[0];
        const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, A.gok[2]); g.addColorStop(.55, A.gok[1]); g.addColorStop(1, A.gok[0]); x.fillStyle = g; x.fillRect(0, 0, W, 560);
        if (ada === 2) for (let i = 0; i < 120; i++) { x.fillStyle = 'rgba(255,255,255,' + Math.random() * .7 + ')'; x.fillRect(Math.random() * W, Math.random() * 400, 1.6, 1.6); }
        const gx = ada === 2 ? 200 : 240, gy = ada === 2 ? 110 : 430; const sg = x.createRadialGradient(gx, gy, 10, gx, gy, 180); sg.addColorStop(0, 'rgba(255,240,200,.85)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = sg; x.fillRect(gx - 180, gy - 180, 360, 360); x.fillStyle = ada === 2 ? '#eef0ff' : '#fff2c8'; x.beginPath(); x.arc(gx, gy, ada === 2 ? 30 : 54, 0, 7); x.fill();
        x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.moveTo(0, 560); x.quadraticCurveTo(120, 500, 260, 560); x.fill(); x.beginPath(); x.moveTo(300, 560); x.quadraticCurveTo(360, 525, 420, 560); x.fill();
        const d = x.createLinearGradient(0, 540, 0, H); d.addColorStop(0, A.deniz[0]); d.addColorStop(1, A.deniz[1]); x.fillStyle = d; x.fillRect(0, 545, W, H - 545);
        x.fillStyle = '#d8b878'; x.beginPath(); x.moveTo(400, 600); x.quadraticCurveTo(450, 560, 560, 566); x.lineTo(1280, 566); x.lineTo(1280, 610); x.quadraticCurveTo(900, 628, 400, 600); x.fill();
        const tg = x.createLinearGradient(0, 200, 0, 580); tg.addColorStop(0, A.tas[0]); tg.addColorStop(1, A.tas[1]); x.fillStyle = tg;
        x.beginPath(); x.moveTo(450, 580); x.quadraticCurveTo(640, 420, 790, 214); x.lineTo(930, 214); x.quadraticCurveTo(1080, 420, 1300, 580); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3;[[800, 230, 690, 420], [840, 230, 800, 470], [920, 230, 990, 440], [900, 230, 1120, 500]].forEach((r) => { x.beginPath(); x.moveTo(r[0], r[1]); x.quadraticCurveTo((r[0] + r[2]) / 2 + 20, (r[1] + r[3]) / 2, r[2], r[3]); x.stroke(); });
        x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.moveTo(790, 214); x.quadraticCurveTo(700, 350, 560, 540); x.lineTo(600, 540); x.quadraticCurveTo(730, 360, 800, 214); x.fill();
        if (ada === 3) { x.fillStyle = 'rgba(235,245,255,.92)'; x.beginPath(); x.moveTo(760, 250); x.quadraticCurveTo(790, 214, 800, 212); x.lineTo(920, 212); x.quadraticCurveTo(950, 230, 970, 262); x.lineTo(940, 280); x.lineTo(915, 255); x.lineTo(880, 285); x.lineTo(850, 256); x.lineTo(815, 282); x.lineTo(790, 258); x.closePath(); x.fill(); }
        x.fillStyle = '#1a0a06'; x.beginPath(); x.ellipse(860, 214, 72, 14, 0, 0, 7); x.fill();
        palmiye(x, 480, 580, -.2); palmiye(x, 1230, 585, .15);
    }
    function tekneCiz(x, st, tx, ty, t) {
        const sal = Math.sin(t / 600) * 4, eg = Math.sin(t / 800) * .03; x.save(); x.translate(tx, ty + sal); x.rotate(eg);
        const n = Math.min(14, st.tekne); const A = ADALAR[st.ada] || ADALAR[0];
        for (let i = 0; i < n; i++) { const col = i % 7, row = Math.floor(i / 7); yumurtaCiz(x, -96 + col * 30, -20 - row * 24, 13, A.yum); }
        const hg = x.createLinearGradient(0, -20, 0, 40); hg.addColorStop(0, '#8a5a32'); hg.addColorStop(1, '#4a2a14'); x.fillStyle = hg;
        x.beginPath(); x.moveTo(-150, -14); x.lineTo(150, -14); x.quadraticCurveTo(130, 40, 90, 44); x.lineTo(-100, 44); x.quadraticCurveTo(-140, 40, -150, -14); x.fill();
        x.strokeStyle = '#3a2210'; x.lineWidth = 3; x.beginPath(); x.moveTo(-140, 6); x.lineTo(140, 6); x.stroke(); x.fillStyle = '#d23a32'; x.fillRect(-150, -18, 300, 7);
        const ox = 110, oy = -14; x.fillStyle = '#2a3566'; yuv(x, ox - 14, oy - 58, 28, 50, 10); x.fill(); x.fillStyle = '#f1c7a2'; x.beginPath(); x.arc(ox, oy - 72, 15, 0, 7); x.fill(); x.fillStyle = '#3a2414'; x.beginPath(); x.arc(ox, oy - 78, 15, Math.PI, 0); x.fill();
        x.strokeStyle = '#6a3a1a'; x.lineWidth = 4; x.beginPath(); x.arc(ox + 22, oy - 48, 30, -1.2, 1.2); x.stroke(); x.strokeStyle = '#ddd'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ox + 22 + Math.cos(-1.2) * 30, oy - 48 + Math.sin(-1.2) * 30); x.lineTo(ox + 22 + Math.cos(1.2) * 30, oy - 48 + Math.sin(1.2) * 30); x.stroke();
        x.restore();
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i <= 20; i++) { const px = tx - 170 + i * 17, py = ty + 48 + Math.sin(t / 300 + i) * 3; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    }

    /* ---------------- SAHNE ---------------- */
    let _cv = null, _ctx = null, _raf = 0, _son = 0, _olcek = 1, _ox = 0, _oy = 0, _dpr = 1, _statik = null, _statikAnahtar = '', _perdeFaz = null, _zaman = [];
    let _lavG = [0, 0, 0], _duman = [], _yanAnim = {}, _ucanlar = new Set(), _tekneX = 700, _patladi = 0, _kurekIv = 0;
    function panel() { return $('km-oyun-panel-yanardag'); }
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; if (_kurekIv) { clearInterval(_kurekIv); _kurekIv = 0; } }
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
    function yngSahneKur(p) {
        p = p || panel(); if (!p) return; css(); zamanTemizle(); _perdeFaz = null; _patladi = 0;
        const st = durum(); _lavG = st.lav.slice(); _tekneX = 700;
        p.innerHTML = `<div class="yng-kap"><canvas id="yng-cv"></canvas>
          <div class="yng-hud"><button class="yng-btn" id="yng-zor-btn" title="Zorluk">⚙️</button><button class="yng-btn" id="yng-ses-btn" title="Ses">🔊</button><button class="yng-btn" id="yng-nasil-btn" title="Nasıl oynanır?">❓</button><button class="yng-btn" id="yng-yeni-btn" title="Bu adayı baştan">🔄</button></div>
          <div class="yng-perde" id="yng-perde" hidden></div></div>`;
        _cv = $('yng-cv'); _ctx = _cv.getContext('2d');
        try { new ResizeObserver(boyutla).observe(_cv); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        $('yng-zor-btn').onclick = zorlukAc;
        $('yng-ses-btn').onclick = () => { try { localStorage.setItem('dag_yng_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); ses('sec'); };
        $('yng-nasil-btn').onclick = nasil;
        $('yng-yeni-btn').onclick = yeniSor;
        if (!_raf) { _son = performance.now(); _raf = requestAnimationFrame(dongu); }
        yngGuncelle();
    }
    function hudCiz() { const s = $('yng-ses-btn'); if (s) s.textContent = sesAcik() ? '🔊' : '🔇'; }
    function yngGuncelle() { if (!panel()) return; const st = durum(); hudCiz(); if (st.faz !== _perdeFaz) perdeCiz(st); }
    function dongu(t) {
        _raf = 0;
        if (!_cv || !document.body.contains(_cv)) { _cv = null; return; }
        const dt = Math.min(50, t - _son); _son = t;
        if (_cv.offsetParent !== null) { alanKontrol(t); ciz(t, dt); }
        _raf = requestAnimationFrame(dongu);
    }
    function ciz(t, dt) {
        const x = _ctx, st = _st || durum(); if (!x) return; const A = ADALAR[st.ada] || ADALAR[0], k = dt / 16.7;
        fxGuncelle(dt);
        for (let i = 0; i < 3; i++) _lavG[i] += ((st.lav[i] || 0) - _lavG[i]) * Math.min(1, .04 * k);
        x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#05060a'; x.fillRect(0, 0, _cv.width, _cv.height);
        const sc = _dpr * _olcek; x.setTransform(sc, 0, 0, sc, _dpr * _ox, _dpr * _oy);
        x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
        const titre = (st.ofke || 0) * .8 + (_patladi ? 14 : 0), sx = FX.shake + titre; if (sx) x.translate(rnd(-sx, sx) * .5, rnd(-sx, sx) * .5);
        const sa = st.ada + '|' + sc; if (!_statik || _statikAnahtar !== sa) { _statik = document.createElement('canvas'); _statik.width = Math.ceil(W * sc); _statik.height = Math.ceil(H * sc); const c = _statik.getContext('2d'); c.setTransform(sc, 0, 0, sc, 0, 0); statikCiz(c, st.ada); _statikAnahtar = sa; }
        x.drawImage(_statik, 0, 0, W, H);
        const kp = .4 + (st.ofke || 0) * .12 + Math.sin(t / 300) * .08; const kg = x.createRadialGradient(860, 210, 6, 860, 210, 200); kg.addColorStop(0, 'rgba(255,170,60,' + kp + ')'); kg.addColorStop(1, 'rgba(255,80,20,0)'); x.fillStyle = kg; x.fillRect(660, 10, 400, 400);
        x.fillStyle = 'rgba(255,' + (140 + Math.sin(t / 200) * 40 | 0) + ',40,.95)'; x.beginPath(); x.ellipse(860, 214, 58, 9, 0, 0, 7); x.fill();
        if (Math.random() < (.25 + (st.ofke || 0) * .12) * k) _duman.push({ x: 860 + rnd(-30, 30), y: 200, vx: rnd(-.4, .6) + .3, vy: -rnd(.8, 1.6) - (st.ofke || 0) * .2, s: rnd(18, 30), l: 260, m: 260 });
        for (const p of _duman) { p.x += p.vx * k; p.y += p.vy * k; p.s += .25 * k; p.l -= k; const a = Math.min(.45, p.l / p.m * .5); x.fillStyle = 'rgba(60,50,55,' + a + ')'; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
        _duman = _duman.filter((p) => p.l > 0 && p.y > -80);
        for (let yi = 0; yi < 3; yi++) {
            const L = _lavG[yi]; if (L <= .01) continue; const P = YOL[yi];
            x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
            for (let pass = 0; pass < 3; pass++) {
                x.beginPath(); x.moveTo(P[0][0], P[0][1]); for (let s = 1; s <= 40; s++) { const tt = s / 40 * L; const q = yolNokta(yi, tt); x.lineTo(q[0] + Math.sin(tt * 20 + yi) * 4, q[1]); }
                if (pass === 0) { x.strokeStyle = 'rgba(255,90,20,.35)'; x.lineWidth = 46; } else if (pass === 1) { x.strokeStyle = '#ff5a14'; x.lineWidth = 22; } else { x.strokeStyle = 'rgba(255,220,90,.95)'; x.lineWidth = 7; x.setLineDash([18, 14]); x.lineDashOffset = -t / 30; }
                x.stroke();
            }
            x.restore();
            const uc = yolNokta(yi, L); x.fillStyle = 'rgba(255,230,120,.9)'; x.beginPath(); x.arc(uc[0], uc[1], 10 + Math.sin(t / 120) * 2, 0, 7); x.fill();
            if (Math.random() < .05 * k) fxParca(uc[0], uc[1], 3, ['#ffb43a', '#ff6a1a'], 3, 4, .15, 30);
        }
        for (const e of st.yum) {
            const [ex, ey] = e.pos;
            if (e.d === 'yandi') { const a = _yanAnim[e.id]; if (a == null || a >= 1) continue; _yanAnim[e.id] = a + dt / 700; yumurtaCiz(x, ex, ey, 20, ['#555', '#222'], { catlak: true }); x.globalAlpha = 1 - Math.min(1, a); x.fillStyle = 'rgba(255,120,30,.8)'; x.beginPath(); x.arc(ex, ey, 26, 0, 7); x.fill(); x.globalAlpha = 1; continue; }
            if (e.d !== 'var' || _ucanlar.has(e.id)) continue;
            const tehlike = (st.lav[e.yi] || 0) + .18 >= e.t;
            const sal = tehlike ? Math.sin(t / 60 + e.id) * .15 : Math.sin(t / 900 + e.id) * .05;
            x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(ex, ey + 22, 18, 5, 0, 0, 7); x.fill();
            x.strokeStyle = '#8a6a3a'; x.lineWidth = 3; x.beginPath(); x.ellipse(ex, ey + 16, 24, 8, 0, 0, Math.PI); x.stroke();
            yumurtaCiz(x, ex, ey, 20, A.yum, { rot: sal, catlak: tehlike });
            if (tehlike) yaz(x, '!', ex + 22, ey - 26, 26, '#ff6a4a', { a: .5 + Math.sin(t / 120) * .5 });
        }
        tekneCiz(x, st, _tekneX, 620, t);
        fxCiz(x);
        x.restore();
        if (FX.flash) { x.fillStyle = 'rgba(255,90,30,' + FX.flash * .5 + ')'; x.fillRect(0, 0, W, H); }
        // HUD
        yuv(x, 20, 18, 370, 96, 18); x.fillStyle = 'rgba(8,10,20,.75)'; x.fill();
        yaz(x, 'ADA ' + (st.ada + 1) + '/5 · ' + A.ad.toUpperCase(), 36, 44, 24, '#ffe9b0', { al: 'left' });
        for (let i = 0; i < 5; i++) { x.fillStyle = i < st.ada ? '#5ee39b' : i === st.ada ? '#ffc94a' : 'rgba(255,255,255,.2)'; x.beginPath(); x.arc(48 + i * 26, 80, 8, 0, 7); x.fill(); }
        yaz(x, 'ÖFKE', 200, 80, 20, '#ffb090', { al: 'left' });
        for (let i = 0; i < 5; i++) { x.fillStyle = i < (st.ofke || 0) ? '#ff5a1a' : 'rgba(255,255,255,.15)'; x.beginPath(); x.moveTo(264 + i * 24, 90); x.quadraticCurveTo(254 + i * 24, 76, 264 + i * 24, 64); x.quadraticCurveTo(274 + i * 24, 76, 264 + i * 24, 90); x.fill(); }
        yaz(x, (YZ[st.zor] || YZ.normal).ad.toUpperCase(), 380, 140, 20, st.zor === 'zor' ? '#ff9a6a' : st.zor === 'kolay' ? '#9ff0c4' : '#ffd98a', { al: 'right' });
        yuv(x, W - 330, 18, 310, 96, 18); x.fillStyle = 'rgba(8,10,20,.75)'; x.fill();
        yumurtaCiz(x, W - 292, 62, 18, ['#ffe58a', '#c88a10']);
        yaz(x, 'AMBARDA ' + st.ambar, W - 262, 46, 28, '#ffffff', { al: 'left' });
        yaz(x, 'Yuva için hedef: ' + st.hedef, W - 262, 84, 20, '#c9d2ff', { al: 'left' });
        yuv(x, W - 330, 124, 310, 46, 14); x.fillStyle = 'rgba(8,10,20,.75)'; x.fill(); yaz(x, '🛶 Teknede: ' + st.tekne, W - 175, 147, 26, '#ffd98a');
        if (st.faz === 'oyun') { const s = aktifSporcu(); yuv(x, 866, 670, 400, 44, 14); x.fillStyle = 'rgba(10,12,24,.88)'; x.fill(); yaz(x, (s ? '🏹 ' + ilkAd(s.ad).toUpperCase() + ' · ' : '') + 'Yumurta için ' + st.esik + '+', 1066, 692, 24, '#fff'); }
    }

    /* ---------------- PERDELER ---------------- */
    function perde(html, bag) { const p = $('yng-perde'); if (!p) return; p.innerHTML = html; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('yng-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(aktif) { return '<p><b>Zorluk seç:</b></p><div class="yng-zorsec">' + Object.keys(YZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === aktif ? 'on' : '') + '"><span class="n">' + YZ[k].ad + '</span><span class="d">' + YZ[k].d + '</span></button>').join('') + '</div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const A = ADALAR[st.ada] || ADALAR[0];
        if (st.faz === 'oyun') { perdeKapat(); return; }
        if (st.faz === 'basla') {
            perde('<div class="yng-kart"><div class="yng-buyuk">🌋🥚</div><span class="yng-etiket">Ada ' + (st.ada + 1) + ' / 5</span><h2>' + kacis(A.ad) + '</h2><p>' + kacis(A.hikaye) + '</p><p class="yng-anlat">' + kacis(A.anlat) + '</p><p>Ambarda: <b>' + st.ambar + '</b> yumurta · Ejder yuvası için hedef: <b>' + st.hedef + '</b></p>' + (st.ada === 0 && st.ambar === 0 ? zorSecHTML(st.zor) : '') + '<div class="yng-butonlar"><button class="yng-b" id="yng-bas">🛶 Adaya çık!</button></div><p class="yng-not">İlk seri girilince oyun kendiliğinden başlar.</p></div>', (p) => {
                p.querySelector('#yng-bas').onclick = () => { const s = durum(); s.faz = 'oyun'; kaydet(); ses('sec'); yngGuncelle(); };
                p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            });
        } else if (st.faz === 'oy') {
            const uyar = st.zor === 'kolay' && st.patla - st.seriNo <= 1;
            perde('<div class="yng-kart koyu"><span class="yng-etiket">Sınıf oylasın · el kaldırın</span><h2>Devam mı, kaç mı?</h2><p>🛶 Teknede <b>' + st.tekne + '</b> yumurta · 🌋 Öfke ' + '🔥'.repeat(st.ofke) + '<span style="opacity:.3">' + '🔥'.repeat(5 - st.ofke) + '</span></p>' + (uyar ? '<p class="yng-anlat">Kaptan Mercan: "Dağ çok titriyor… bence kaçalım!"</p>' : '') + '<div class="yng-oy"><button class="devam" id="yng-dv"><span class="n">🔥 DEVAM</span><span class="d">Daha çok yumurta… ama patlayabilir!</span></button><button class="kac" id="yng-kc"><span class="n">🚣 KAÇ</span><span class="d">Teknedekiler ambara, kurtuldu!</span></button></div><p class="yng-not">Oy vermeden seri girilirse DEVAM sayılır.</p></div>', (p) => {
                p.querySelector('#yng-dv').onclick = () => { const s = durum(); s.faz = 'oyun'; kaydet(); ses('sec'); fxYazi(640, 300, 'CESUR OKÇULAR DEVAM EDİYOR!', '#ffb090', 44, 90); yngGuncelle(); };
                p.querySelector('#yng-kc').onclick = () => { const s = durum(); s.faz = 'kurek'; kaydet(); yngGuncelle(); };
            });
        } else if (st.faz === 'kurek') {
            let n = 5; const ciz = () => perde('<div class="yng-kart koyu"><span class="yng-etiket">Bekleyen sıra</span><h2>🚣 KÜREK ÇEKİN!</h2><div class="yng-geri">' + n + '</div><p>Hep birlikte, kollar ileri geri!</p></div>');
            ciz(); ses('kurek');
            if (_kurekIv) clearInterval(_kurekIv);
            _kurekIv = setInterval(() => { n--; _tekneX -= 40; ses('kurek'); if (n > 0) { ciz(); return; } clearInterval(_kurekIv); _kurekIv = 0; const s2 = durum(); if (s2.faz === 'kurek') { kacBitir(s2); kaydet(); } _tekneX = 700; yngGuncelle(); }, 1000);
        } else if (st.faz === 'adasonu' || st.faz === 'final') {
            const m = st.son || { baslik: '', metin: '', anlat: '' };
            if (st.faz === 'final') {
                const yavru = Math.floor(st.ambar / 4), hep = siraliAdlar(st.hepAtan), ok = st.ambar >= st.hedef;
                perde('<div class="yng-kart koyu"><div class="yng-buyuk">' + (ok ? '🐲🥚🐲' : '🥚🐲') + '</div><h2>' + (ok ? 'EJDER ANNE ÇOK MUTLU!' : 'Yuva biraz boş kaldı…') + '</h2><p>' + kacis(m.metin) + '</p><p>Ambarda <b>' + st.ambar + '</b> yumurta vardı. Yuvada <b>' + yavru + '</b> yavru ejder yumurtadan çıktı!' + (ok ? ' Hedefi geçtik!' : ' Hedef ' + st.hedef + ' idi; bir dahaki seferde daha cesur olalım.') + '</p><p>Kurtarıcı okçular:</p>' + adlarHTML(hep) + '<div class="yng-butonlar"><button class="yng-b" id="yng-yeni">🔁 Yeni yolculuk</button></div></div>', (p) => {
                    p.querySelector('#yng-yeni').onclick = () => { _st = bosDurum(st.zor); kaydet(); _tekneX = 700; yngGuncelle(); };
                });
            } else {
                perde('<div class="yng-kart koyu"><div class="yng-buyuk">' + (m.tip === 'patladi' ? '🌋💥' : m.tip === 'kilpayi' ? '😮🌋' : '🚣🥚') + '</div><h2>' + kacis(m.baslik) + '</h2><p>' + kacis(m.metin) + '</p><p>Bu adanın okçuları:</p>' + adlarHTML(siraliAdlar(st.adaAtan)) + '<p class="yng-anlat">' + kacis(m.anlat) + '</p><p>🏠 Ambarda toplam <b>' + st.ambar + '</b> / ' + st.hedef + '</p><div class="yng-butonlar"><button class="yng-b" id="yng-dev">Sıradaki ada →</button></div></div>', (p) => {
                    p.querySelector('#yng-dev').onclick = () => { const s = durum(); sonrakiAda(s); kaydet(); yngGuncelle(); };
                });
            }
        }
    }
    function sonrakiAda(st) { st.ada = Math.min(4, st.ada + 1); adaKur(st); _lavG = [0, 0, 0]; _yanAnim = {}; _tekneX = 700; }
    function kacBitir(st) {
        const kurtarilan = st.tekne; st.ambar += st.tekne; st.tekne = 0; const kalan = st.patla - st.seriNo;
        const hepsi = !st.yum.some((e) => e.d === 'var');
        st.son = { tip: kalan <= 1 ? 'kilpayi' : 'kac', baslik: '🚣 Kaçtık!', metin: (hepsi ? 'Adada yumurta kalmadı! ' : '') + kurtarilan + ' yumurta ambara girdi.', anlat: kalan <= 1 ? 'Kaptan Mercan: "Arkamıza bakın! Tam kaçarken patladı. Kıl payı!"' : 'Kaptan Mercan: "Yanardağ ' + kalan + ' seri daha dayanacakmış… Ama güvende olmak da iyi!"' };
        st.faz = st.ada >= 4 ? 'final' : 'adasonu'; ses('zafer');
    }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esik = YZ[z].esik; st.hedef = YZ[z].hedef; adaKur(st); kaydet(); ses('sec'); _perdeFaz = null; yngGuncelle(); }
    function zorlukAc() {
        const st = durum();
        perde('<div class="yng-kart koyu"><h2>⚙️ Zorluk</h2><p>Zorluğu değiştirirsen bu ada baştan başlar. Ambardaki yumurtalar kalır.</p>' + zorSecHTML(st.zor) + '<p><b>Yumurta için gereken puan:</b></p><div class="yng-esik">' + [5, 6, 7, 8].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="yng-butonlar"><button class="yng-b ikincil" id="yng-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; kaydet(); ses('sec'); zorlukAc(); });
            p.querySelector('#yng-kapat').onclick = () => { _perdeFaz = null; yngGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        perde('<div class="yng-kart koyu"><h2>🌋 Nasıl oynanır?</h2><p class="yng-sol">📣 <b>Koç söyler:</b> "Her iyi ok bir ejder yumurtası kurtarır. Her seriden sonra hep birlikte karar verin: DEVAM mı, KAÇ mı?"<br>🏹 Eşiği geçen ok, lava en yakın yumurtayı tekneye fırlatır. <b>10/X</b> altın yumurtadır, 3 sayılır.<br>🌋 Lav her seride aşağı akar ve ulaştığı yumurtayı yakar. Patlama zamanı gizlidir; duman ve öfke ipucu verir.<br>🙋 Sınıf el kaldırarak oylar. <b>KAÇ</b> denince bekleyen sıra 5 saniye kürek çeker, teknedekiler ambara girer.<br>💥 Patlarsa teknedekilerin yarısı yanar. 5 adanın sonunda ambardaki yumurtalardan yavru ejderler çıkar.</p><div class="yng-butonlar"><button class="yng-b" id="yng-tamam">Tamam</button></div></div>', (p) => { p.querySelector('#yng-tamam').onclick = () => { _perdeFaz = null; yngGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    function yeniSor() {
        perde('<div class="yng-kart koyu"><h2>🔄 Bu ada baştan mı?</h2><p>Yumurtalar ve lav yenilenir. Teknedekiler kaybolur, ambardakiler kalır.</p><div class="yng-butonlar"><button class="yng-b kirmizi" id="yng-evet">Evet, baştan</button><button class="yng-b ikincil" id="yng-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#yng-evet').onclick = () => { const s = durum(); adaKur(s); _lavG = [0, 0, 0]; _yanAnim = {}; kaydet(); _perdeFaz = null; yngGuncelle(); };
            p.querySelector('#yng-hayir').onclick = () => { _perdeFaz = null; yngGuncelle(); };
        });
        _perdeFaz = 'yeni';
    }

    /* ---------------- SERİ ---------------- */
    function hedefYumurta(st) { const v = st.yum.filter((e) => e.d === 'var' && !_ucanlar.has(e.id)); if (!v.length) return null; return v.reduce((b, e) => (e.t - st.lav[e.yi]) < (b.t - st.lav[b.yi]) ? e : b, v[0]); }
    function yngSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitir = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        let st = durum();
        if (_kurekIv) { clearInterval(_kurekIv); _kurekIv = 0; }
        if (st.faz === 'kurek') kacBitir(st);
        if (st.faz === 'adasonu') sonrakiAda(st);
        if (st.faz === 'final') { _st = bosDurum(st.zor); st = _st; }
        st.faz = 'oyun'; _perdeFaz = null; kaydet(); perdeKapat();
        const key = s.g + '|' + s.ad, oklar = (kaydedilecek || []).map((k) => okDeger(k.puan)); const A = ADALAR[st.ada] || ADALAR[0];
        if (st.adaAtan.indexOf(s.ad) === -1) st.adaAtan.push(s.ad);
        if (st.hepAtan.indexOf(s.ad) === -1) st.hepAtan.push(s.ad);
        st.toplamOk += oklar.length;
        const gorsel = !!(_cv && document.body.contains(_cv) && _cv.offsetParent !== null);
        (async () => {
            for (const p of oklar) {
                const e = hedefYumurta(st); const isabet = p >= st.esik && e;
                const tx = e ? e.pos[0] : 860, ty = e ? e.pos[1] : 300;
                if (gorsel) { ses('cek'); await fxOk(_tekneX + 130, 560, isabet ? tx : tx + rnd(-90, 90), isabet ? ty : ty + rnd(30, 70), 560, 200); }
                if (isabet) {
                    const altin = p === 10, deger = altin ? 3 : 1;
                    e.d = 'alindi'; st.tekne += deger; st.katki[key] = (st.katki[key] || 0) + deger; kaydet();
                    if (gorsel) {
                        _ucanlar.add(e.id);
                        fxParca(tx, ty, altin ? 36 : 16, altin ? ['#ffd34a', '#fff3a0'] : ['#ffffff', A.yum[0]], altin ? 10 : 6, 5);
                        fxYazi(tx, ty - 50, altin ? 'ALTIN YUMURTA +3' : '+1 🥚', altin ? '#ffd34a' : '#ffffff', altin ? 50 : 44, 80); ses(altin ? 'kritik' : 'yumurta');
                        await fxUcan((x, qx, qy, tt) => yumurtaCiz(x, qx, qy, 20, A.yum, { rot: tt * 12, altin }), tx, ty, _tekneX - 20, 590, 650, 150);
                        _ucanlar.delete(e.id); fxParca(_tekneX - 20, 590, 12, '#ffffff', 4, 4);
                    }
                } else if (gorsel) { fxYazi(tx, ty + 40, p === 0 ? 'ISKA' : 'kaçtı…', '#ffd0b0', 38); ses('iska'); }
            }
            if (gorsel) await bekle(400);
            st.seriNo++; const Z = YZ[st.zor] || YZ.normal;
            for (let j = 0; j < 3; j++) st.lav[j] = Math.min(1, st.lav[j] + rnd(Z.lav[0], Z.lav[1]));
            if (gorsel) { ses('lav'); await bekle(1100); }
            for (const e of st.yum) if (e.d === 'var' && st.lav[e.yi] >= e.t) { e.d = 'yandi'; st.yanan++; _yanAnim[e.id] = 0; if (gorsel) { fxYazi(e.pos[0], e.pos[1] - 40, 'YANDI!', '#ff6a4a', 34, 80); fxParca(e.pos[0], e.pos[1], 20, ['#ff8a3a', '#333'], 6, 5); } }
            st.ofke = Math.max(0, Math.min(5, Math.floor(st.seriNo / st.patla * 4.2 + rnd(-.6, .9) * Z.gurultu)));
            if (st.zor === 'zor' && st.seriNo < st.patla && Math.random() < .3 && gorsel) { FX.shake = 22; ses('gumbur'); fxYazi(860, 330, 'GÜMBÜR! Patlıyor mu?!', '#ffb090', 40, 90); }
            kaydet();
            if (st.seriNo >= st.patla) { bitir(); await patlama(st, gorsel); return; }
            if (!st.yum.some((e) => e.d === 'var')) { kacBitir(st); kaydet(); bitir(); yngGuncelle(); return; }
            st.faz = 'oy'; kaydet(); bitir(); yngGuncelle();
        })().catch(() => bitir());
        setTimeout(bitir, 9000); // emniyet: dock kilitli kalmasın
    }
    async function patlama(st, gorsel) {
        if (gorsel) {
            _patladi = 1; ses('gumbur'); FX.flash = .9; FX.shake = 40;
            for (let i = 0; i < 5; i++) fxParca(860, 200, 40, ['#ff5a14', '#ffd34a', '#ff8a3a', '#3a2a2a'], 18, 9, .35, 90);
            for (let i = 0; i < 6; i++) fxUcan((x, qx, qy) => { x.fillStyle = '#ff6a1a'; x.beginPath(); x.arc(qx, qy, 14, 0, 7); x.fill(); x.fillStyle = '#ffd34a'; x.beginPath(); x.arc(qx - 3, qy - 3, 6, 0, 7); x.fill(); }, 860, 200, rnd(80, 1200), rnd(560, 700), rnd(900, 1400), rnd(150, 320));
        }
        for (let i = 0; i < 3; i++) st.lav[i] = 1;
        for (const e of st.yum) if (e.d === 'var') { e.d = 'yandi'; st.yanan++; _yanAnim[e.id] = 0; }
        const kayip = Math.ceil(st.tekne / 2); st.tekne -= kayip; st.ambar += st.tekne; const kurtulan = st.tekne; st.tekne = 0;
        st.son = { tip: 'patladi', baslik: '🌋 YANARDAĞ PATLADI!', metin: 'Lav topları tekneye düştü: ' + kayip + ' yumurta yandı. ' + kurtulan + ' yumurtayı kurtardık.', anlat: 'Kaptan Mercan: "Herkes iyi mi? Bir dahaki adada belki biraz daha erken kaçarız…"' };
        st.faz = st.ada >= 4 ? 'final' : 'adasonu'; kaydet();
        if (gorsel) { await bekle(2200); _patladi = 0; ses('yanlis'); }
        yngGuncelle();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function yngAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function yngGeriYukle(k) { if (!k) return; zamanTemizle(); _st = k; _stKonum = konum(); kaydet(); _lavG = k.lav.slice(); _yanAnim = {}; _perdeFaz = null; if (panel()) yngGuncelle(); }
    function yngSporcu(g, ad) { const n = durum().katki[g + '|' + ad] || 0; return n ? '🥚' + n : '-'; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('yng-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'yng-css';
        st.textContent = `
.km-oyun-panel-yanardag{padding:0;background:#05060a;overflow:hidden}
.yng-kap{position:absolute;inset:0}
.yng-kap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.yng-hud{position:absolute;right:10px;top:calc(50% - 20px);flex-direction:column;display:flex;gap:6px;z-index:2}
.yng-btn{background:rgba(10,12,24,.85);border:1px solid #3b4680;color:#fff;border-radius:999px;min-width:40px;height:40px;font-size:18px;cursor:pointer;padding:0 10px}
.yng-perde{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:2%;background:rgba(5,6,14,.6);backdrop-filter:blur(2px)}
.yng-perde[hidden]{display:none}
.yng-kart{max-width:800px;width:100%;max-height:100%;overflow:auto;background:linear-gradient(160deg,#1e2646,#121731);color:#eef1fb;border:2px solid #3b4680;border-radius:20px;padding:clamp(12px,2.6vw,26px);display:flex;flex-direction:column;gap:clamp(6px,1.2vw,12px);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.yng-kart h2{margin:0;font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(24px,3.6vw,42px);line-height:1.1}
.yng-kart p{margin:0 auto;max-width:60ch;font-size:clamp(15px,1.9vw,21px);color:#d5dbf5;line-height:1.4}
.yng-kart .yng-sol{text-align:left}
.yng-anlat{font-style:italic;color:#ffe2a0!important}
.yng-not{font-size:13px!important;opacity:.65}
.yng-etiket{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#9ba5cc}
.yng-buyuk{font-size:clamp(34px,6vw,64px);line-height:1}
.yng-geri{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(64px,13vw,150px);color:#5ee39b;line-height:1}
.yng-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.yng-adlar span{background:#2a3566;color:#fff;border-radius:999px;padding:3px 12px;font-weight:800;font-size:clamp(13px,1.6vw,17px)}
.yng-butonlar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.yng-b{border:0;cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.2vw,23px);padding:10px 22px;border-radius:14px;background:#ffc94a;color:#241800}
.yng-b.kirmizi{background:#d93a3a;color:#fff}.yng-b.ikincil{background:#2a3566;color:#fff}
.yng-oy{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.yng-oy button{border:0;cursor:pointer;border-radius:18px;padding:clamp(10px,2vw,18px);display:flex;flex-direction:column;gap:4px;align-items:center;font-family:"Lilita One","Baloo 2",sans-serif}
.yng-oy .n{font-size:clamp(26px,5vw,48px);line-height:1}.yng-oy .d{font-family:Nunito,system-ui,sans-serif;font-weight:800;font-size:clamp(12px,1.5vw,16px)}
.yng-oy .devam{background:linear-gradient(160deg,#ff7a2a,#c2260f);color:#fff}.yng-oy .kac{background:linear-gradient(160deg,#5ee39b,#1f9a5a);color:#06281a}
.yng-zorsec{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.yng-zorsec button{cursor:pointer;border-radius:16px;padding:10px;background:#232c55;border:3px solid #3d4a8a;color:#fff;display:flex;flex-direction:column;gap:3px;align-items:center}
.yng-zorsec button.on{border-color:#ff9a1a;box-shadow:0 0 0 3px rgba(255,154,26,.35)}
.yng-zorsec .n{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.4vw,25px)}.yng-zorsec .d{font-weight:800;font-size:12px;opacity:.8}
.yng-esik{display:flex;gap:8px;justify-content:center}.yng-esik button{cursor:pointer;border-radius:12px;padding:8px 16px;font-weight:900;font-size:18px;background:#232c55;color:#fff;border:2px solid #3d4a8a}.yng-esik button.on{border-color:#ff9a1a}
@media (max-width:600px){.yng-zorsec{grid-template-columns:1fr}.yng-zorsec .d{display:none}.yng-btn{height:36px;min-width:36px;font-size:15px}}`;
        document.head.appendChild(st);
    }

    window.yngSahneKur = yngSahneKur;
    window.yngGuncelle = yngGuncelle;
    window.yngSeri = yngSeri;
    window.yngAnlik = yngAnlik;
    window.yngGeriYukle = yngGeriYukle;
    window.yngSporcu = yngSporcu;
})();
