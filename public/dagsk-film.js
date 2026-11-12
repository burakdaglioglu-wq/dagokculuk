/* ================================================================================================
   🎬 OKÇULUK FİLMİ (v405, 2026-11-12) — kullanıcı: "yaklaşık 3 dakika güzel bir video; biz kimiz, okçuluk nedir, klasik yay, makaralı yay,
   amacımız; bazen sıkılabilirsin/yorulabilirsin/atışların iyi gitmeyebilir ama düzenli antrenmanla düzelir; arkada loş müzik, sonra gaza
   getiren; atışları ve yönlerini göster, ne yapmalısın: formdan nişangâh ayarına; yarışmalar, madalya, oyunlarla eğlence, yarışma modunda
   kendini bilmek, ortaokul-lise-üniversite-iş hayatı, liderlik, arkadaşlık. Çocuğun ağzı açık kalsın."
   Gerçek video dosyası YOK: tek <canvas> (1600x900 sanal sahne) + kulübün kendi fotoğrafları (Ken Burns) + WebAudio müzik (sentez) +
   speechSynthesis tr-TR seslendirme + büyük altyazı. Her şey t'ye (saniye) bağlı ve deterministik → duraklat / sar / tekrar sorunsuz.
   Açılış: dagFilmAc(). Karışık Sınıf araçlarında ve sporcu giriş ekranında düğme.
   ================================================================================================ */
(function () {
    'use strict';
    if (window.dagFilmAc) return;
    const SURE = 186, W = 1600, H = 900;
    const $ = (id) => document.getElementById(id);
    const FONT = '"Barlow Condensed","Archivo Narrow",Impact,sans-serif', FONT2 = '"Archivo","Manrope",system-ui,sans-serif';
    const TURUNCU = '#FF6A1A', ALTIN = '#FFD23F', BEYAZ = '#F4F6FA';
    const FOTO = { salon: '/hero/salon-1600.webp', salon2: '/kulup/salon2-1600.webp', takim: '/galeri/okculuk-2.jpg', makarali: '/galeri/okculuk-1.jpg', kiz: '/galeri/okculuk-4.jpg', vitrin: '/galeri/okculuk-5.jpg', stadyum: '/galeri/okculuk-3.jpg', ikili: '/hero/salon-900.jpg', logo: '/tanitim-logo.png', zirve: '/vitrin/zirve.webp', canavar: '/vitrin/canavar.webp', hapsirik: '/vitrin/hapsirik.webp', ninja: '/vitrin/ninja.webp' };
    const IMG = {};
    function yukle() { Object.keys(FOTO).forEach((k) => { if (IMG[k]) return; const i = new Image(); i.decoding = 'async'; i.src = FOTO[k]; IMG[k] = i; }); }
    const hazir = (k) => IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0;

    /* ---------- yardımcılar ---------- */
    const kis = (x, a, b) => Math.max(a, Math.min(b, x));
    const ara = (t, a, b) => kis((t - a) / (b - a), 0, 1);
    const yum = (p) => p * p * (3 - 2 * p);
    const cik = (p) => 1 - Math.pow(1 - p, 3);
    const gir = (p) => p * p * p;
    const zip = (p) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
    function rnd(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    function gorunur(t, a, b, gir_, cik_) { return Math.min(ara(t, a, a + (gir_ || .6)), 1 - ara(t, b - (cik_ || .6), b)); }

    function foto(c, k, t, d, o) { // Ken Burns: o = { z0, z1, x0, x1, y0, y1, a }
        if (!hazir(k)) { c.fillStyle = '#0b0f16'; c.fillRect(0, 0, W, H); return; }
        const im = IMG[k], p = d ? yum(kis(t / d, 0, 1)) : 0, z = (o.z0 || 1.05) + ((o.z1 || 1.15) - (o.z0 || 1.05)) * p;
        const s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * z, w = im.naturalWidth * s, h = im.naturalHeight * s;
        const fx = (o.x0 == null ? .5 : o.x0) + ((o.x1 == null ? .5 : o.x1) - (o.x0 == null ? .5 : o.x0)) * p, fy = (o.y0 == null ? .5 : o.y0) + ((o.y1 == null ? .5 : o.y1) - (o.y0 == null ? .5 : o.y0)) * p;
        c.save(); c.globalAlpha = o.a == null ? 1 : o.a; c.drawImage(im, (W - w) * fx, (H - h) * fy, w, h); c.restore();
    }
    function karart(c, a, renk) { c.fillStyle = renk || 'rgba(4,6,12,' + a + ')'; if (renk) c.globalAlpha = a; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    function vinyet(c, g) { const r = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,' + (g || .75) + ')'); c.fillStyle = r; c.fillRect(0, 0, W, H); }
    function alttanKarart(c, g) { const r = c.createLinearGradient(0, H * .35, 0, H); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,' + (g || .85) + ')'); c.fillStyle = r; c.fillRect(0, 0, W, H); }
    function yazi(c, s, x, y, o) {
        o = o || {}; c.save(); c.globalAlpha = o.a == null ? 1 : kis(o.a, 0, 1); if (c.globalAlpha <= 0) { c.restore(); return; }
        c.font = (o.w || 800) + ' ' + (o.s || 80) + 'px ' + (o.f || FONT); c.textAlign = o.h || 'center'; c.textBaseline = 'middle';
        if (o.ls && c.letterSpacing !== undefined) c.letterSpacing = o.ls + 'px';
        if (o.olcek && o.olcek !== 1) { c.translate(x, y); c.scale(o.olcek, o.olcek); x = 0; y = 0; }
        if (o.golge !== false) { c.shadowColor = o.gr || 'rgba(0,0,0,.55)'; c.shadowBlur = o.gb == null ? 24 : o.gb; c.shadowOffsetY = 4; }
        c.fillStyle = o.r || BEYAZ; c.fillText(s, x, y); c.restore();
    }
    // Harf harf beliren yazı (kinetik)
    function harfHarf(c, s, x, y, t, a, o) {
        o = o || {}; c.save(); c.font = (o.w || 900) + ' ' + (o.s || 120) + 'px ' + (o.f || FONT); const genis = c.measureText(s).width; c.restore();
        let px = x - genis / 2; const har = Array.from(s);
        har.forEach((h, i) => {
            c.save(); c.font = (o.w || 900) + ' ' + (o.s || 120) + 'px ' + (o.f || FONT); const gw = c.measureText(h).width; c.restore();
            const p = cik(ara(t, a + i * (o.ara || .05), a + i * (o.ara || .05) + .45));
            yazi(c, h, px + gw / 2, y + (1 - p) * (o.dy == null ? 40 : o.dy), Object.assign({}, o, { a: p * (o.a == null ? 1 : o.a), olcek: .7 + .3 * zip(p) }));
            px += gw;
        });
    }
    function toz(c, t, n, renk, hiz) { // yavaş yükselen parçacıklar
        for (let i = 0; i < n; i++) { const x = (rnd(i) * W + Math.sin(t * .3 + i) * 30) % W, y = H - ((rnd(i + 50) * H + t * (12 + rnd(i + 9) * 30) * (hiz || 1)) % (H + 40)), r = 1 + rnd(i + 3) * 2.5; c.fillStyle = renk || 'rgba(255,200,140,' + (.15 + rnd(i + 7) * .35) + ')'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    }
    /* hedef: WA 10 halka. halka(p) kaç halka çizildi (0..10) */
    const HALKA = [['#F5F5F0', '#2a2a2a'], ['#F5F5F0', '#2a2a2a'], ['#1d1d22', '#e9e9e9'], ['#1d1d22', '#e9e9e9'], ['#2F86D6', '#1b4f80'], ['#2F86D6', '#1b4f80'], ['#E5372C', '#8f1f18'], ['#E5372C', '#8f1f18'], ['#FFD23F', '#a8861c'], ['#FFD23F', '#a8861c']];
    function hedef(c, x, y, r, kac, o) {
        o = o || {}; kac = kac == null ? 10 : kac; c.save(); c.globalAlpha = o.a == null ? 1 : o.a;
        if (o.parla) { const g = c.createRadialGradient(x, y, r * .2, x, y, r * 1.6); g.addColorStop(0, 'rgba(255,210,63,' + .25 * o.parla + ')'); g.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.6, 0, 7); c.fill(); }
        for (let i = 0; i < 10; i++) {
            const p = kis(kac - i, 0, 1); if (p <= 0) continue; const rr = r * (10 - i) / 10 * (o.zip ? zip(p) : p);
            c.fillStyle = HALKA[i][0]; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.strokeStyle = HALKA[i][1]; c.lineWidth = Math.max(1, r / 220); c.stroke();
        }
        if (kac >= 10) { c.strokeStyle = 'rgba(80,60,10,.6)'; c.lineWidth = Math.max(1, r / 260); c.beginPath(); c.arc(x, y, r * .05, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x - r * .02, y); c.lineTo(x + r * .02, y); c.moveTo(x, y - r * .02); c.lineTo(x, y + r * .02); c.stroke(); }
        if (o.puan) { for (let i = 0; i < 10; i++) { if (kac < i + 1) continue; const yy = y - r * (10 - i) / 10 + r * .05; yazi(c, String(i + 1), x, yy, { s: r * .055, w: 800, f: FONT2, r: i >= 2 && i <= 3 ? '#fff' : (i >= 4 && i <= 7 ? '#fff' : '#222'), golge: false, a: (o.a == null ? 1 : o.a) * kis(kac - i, 0, 1) }); } }
        c.restore();
    }
    // Ok: (x,y) uç, aci yön, boy; gömülü ok için sadece kuyruk görünür
    function ok(c, x, y, aci, boy, o) {
        o = o || {}; c.save(); c.translate(x, y); c.rotate(aci); c.globalAlpha = o.a == null ? 1 : o.a;
        const sh = o.renk || '#1b1b1f', tuy = o.tuy || TURUNCU;
        c.lineCap = 'round'; c.strokeStyle = sh; c.lineWidth = Math.max(2, boy * .022); c.beginPath(); c.moveTo(0, 0); c.lineTo(-boy, 0); c.stroke();
        c.fillStyle = '#c9ced8'; c.beginPath(); c.moveTo(boy * .05, 0); c.lineTo(-boy * .03, -boy * .022); c.lineTo(-boy * .03, boy * .022); c.closePath(); c.fill();
        c.fillStyle = tuy; [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(-boy * .82, 0); c.lineTo(-boy * .97, s * boy * .07); c.lineTo(-boy, s * boy * .07); c.lineTo(-boy * .9, 0); c.closePath(); c.fill(); });
        c.fillStyle = '#fff'; c.fillRect(-boy * 1.01, -boy * .012, boy * .03, boy * .024);
        c.restore();
    }
    function okIzi(c, x, y, aci, uzun, a) { c.save(); c.translate(x, y); c.rotate(aci); const g = c.createLinearGradient(0, 0, -uzun, 0); g.addColorStop(0, 'rgba(255,220,160,' + .55 * a + ')'); g.addColorStop(1, 'rgba(255,220,160,0)'); c.strokeStyle = g; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-uzun, 0); c.stroke(); c.restore(); }
    // hedefe saplanmış ok (önden: nokta + kısa kuyruk)
    function saplanmis(c, x, y, r, renk) { c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(x + 3, y + 3, r * 1.2, 0, 7); c.fill(); c.fillStyle = '#16161a'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = renk || TURUNCU; c.lineWidth = r * .9; c.beginPath(); c.moveTo(x, y); c.lineTo(x - r * 2.2, y - r * 3.2); c.stroke(); c.restore(); }
    function parlama(c, x, y, r, a) { if (a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,245,200,' + a + ')'); g.addColorStop(.3, 'rgba(255,190,90,' + a * .6 + ')'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    function halkaDalga(c, x, y, p, r, renk) { if (p <= 0 || p >= 1) return; c.save(); c.strokeStyle = renk || 'rgba(255,210,63,' + (1 - p) + ')'; c.lineWidth = 6 * (1 - p) + 1; c.beginPath(); c.arc(x, y, r * cik(p), 0, 7); c.stroke(); c.restore(); }

    /* klasik (olimpik) yay — yan görünüş. cekis 0..1 */
    function yayKlasik(c, x, y, s, cekis, o) {
        o = o || {}; c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = o.a == null ? 1 : o.a; c.lineCap = 'round'; c.lineJoin = 'round';
        const b = cekis * 120, ec = 1 - cekis * .12;
        // kollar (recurve uçlar)
        c.strokeStyle = '#2b2f3a'; c.lineWidth = 14;
        c.beginPath(); c.moveTo(0, -95); c.bezierCurveTo(-30 * ec, -200, -40 * ec, -300, 0 - 8 * cekis, -360 * ec); c.quadraticCurveTo(14, -385 * ec, 26, -372 * ec); c.stroke();
        c.beginPath(); c.moveTo(0, 95); c.bezierCurveTo(-30 * ec, 200, -40 * ec, 300, 0 - 8 * cekis, 360 * ec); c.quadraticCurveTo(14, 385 * ec, 26, 372 * ec); c.stroke();
        c.strokeStyle = TURUNCU; c.lineWidth = 4; c.beginPath(); c.moveTo(-4, -110); c.bezierCurveTo(-32 * ec, -200, -42 * ec, -300, -6 - 8 * cekis, -352 * ec); c.stroke(); c.beginPath(); c.moveTo(-4, 110); c.bezierCurveTo(-32 * ec, 200, -42 * ec, 300, -6 - 8 * cekis, 352 * ec); c.stroke();
        // gövde (riser)
        c.fillStyle = '#E8541A'; c.beginPath(); c.moveTo(-14, -120); c.quadraticCurveTo(10, -60, 6, -20); c.lineTo(22, 10); c.lineTo(18, 40); c.quadraticCurveTo(10, 80, -14, 120); c.lineTo(-24, 115); c.quadraticCurveTo(-6, 60, -10, 0); c.quadraticCurveTo(-6, -60, -24, -115); c.closePath(); c.fill();
        // nişangâh + stabilizer
        c.strokeStyle = '#9aa3b5'; c.lineWidth = 4; c.beginPath(); c.moveTo(14, -40); c.lineTo(120, -40); c.stroke(); c.fillStyle = ALTIN; c.beginPath(); c.arc(124, -40, 7, 0, 7); c.fill();
        c.strokeStyle = '#1b1f2a'; c.lineWidth = 7; c.beginPath(); c.moveTo(16, 30); c.lineTo(230, 46); c.stroke(); c.fillStyle = '#1b1f2a'; c.beginPath(); c.arc(236, 47, 12, 0, 7); c.fill();
        // kiriş
        c.strokeStyle = 'rgba(240,240,240,.9)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(24, -372 * ec); c.lineTo(-b - 10, 0); c.lineTo(24, 372 * ec); c.stroke();
        if (o.ok !== false) ok(c, 170, -4, 0, 170 + b, { tuy: o.tuy });
        c.restore();
    }
    /* makaralı yay — yan görünüş, makaralar döner */
    function yayMakarali(c, x, y, s, cekis, o) {
        o = o || {}; c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = o.a == null ? 1 : o.a; c.lineCap = 'round'; c.lineJoin = 'round';
        const b = cekis * 110, don = cekis * Math.PI * 1.4;
        c.strokeStyle = '#1f232c'; c.lineWidth = 18; c.beginPath(); c.moveTo(4, -110); c.quadraticCurveTo(-46, -200, -64, -268); c.stroke(); c.beginPath(); c.moveTo(4, 110); c.quadraticCurveTo(-46, 200, -64, 268); c.stroke();
        [-1, 1].forEach((sg) => {
            c.save(); c.translate(-68, 278 * sg); c.rotate(don * sg);
            c.fillStyle = '#2a2f3a'; c.beginPath(); c.ellipse(0, 0, 36, 32, 0, 0, 7); c.fill(); c.strokeStyle = '#9aa3b5'; c.lineWidth = 3; c.stroke();
            c.fillStyle = '#0d0f14'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(Math.cos(k * 1.57) * 16, Math.sin(k * 1.57) * 16, 6, 0, 7); c.fill(); }
            c.fillStyle = TURUNCU; c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fill(); c.restore();
        });
        // gövde
        c.fillStyle = '#2E64C9'; c.beginPath(); c.moveTo(-6, -150); c.lineTo(20, -150); c.quadraticCurveTo(30, -60, 26, 0); c.quadraticCurveTo(30, 60, 20, 150); c.lineTo(-6, 150); c.quadraticCurveTo(4, 60, 0, 0); c.quadraticCurveTo(4, -60, -6, -150); c.closePath(); c.fill();
        c.strokeStyle = '#9aa3b5'; c.lineWidth = 4; c.beginPath(); c.moveTo(22, -60); c.lineTo(150, -60); c.stroke(); c.fillStyle = '#0d0f14'; c.beginPath(); c.arc(156, -60, 16, 0, 7); c.fill(); c.strokeStyle = '#7CFF8A'; c.lineWidth = 3; c.beginPath(); c.arc(156, -60, 10, 0, 7); c.stroke();
        c.strokeStyle = '#1b1f2a'; c.lineWidth = 7; c.beginPath(); c.moveTo(24, 40); c.lineTo(250, 60); c.stroke();
        // kiriş + kablolar
        c.strokeStyle = 'rgba(240,240,240,.9)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-60, -300); c.lineTo(-b - 66, 0); c.lineTo(-60, 300); c.stroke();
        c.strokeStyle = 'rgba(200,205,215,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-74, -250); c.lineTo(-56, 300); c.moveTo(-74, 250); c.lineTo(-56, -300); c.stroke();
        if (o.ok !== false) ok(c, 210, -2, 0, 210 + b, { tuy: '#7CFF8A' });
        c.restore();
    }
    function madalya(c, x, y, r, sal, renk, yz) {
        c.save(); c.translate(x, y); c.rotate(sal);
        c.fillStyle = '#C8102E'; c.beginPath(); c.moveTo(-r * .5, -r * 3); c.lineTo(-r * .15, -r * .8); c.lineTo(r * .15, -r * .8); c.lineTo(r * .5, -r * 3); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(-r * .1, -r * 3, r * .2, r * 2.2);
        const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#FFF6C8'); g.addColorStop(.5, renk || ALTIN); g.addColorStop(1, '#8a6a10'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = r * .06; c.beginPath(); c.arc(0, 0, r * .78, 0, 7); c.stroke();
        yazi(c, yz || '1', 0, r * .04, { s: r * .9, r: '#7a5a00', golge: false });
        c.restore();
    }

    /* ---------- SAHNELER (her biri t: filmin saniyesi) ---------- */
    const SAHNE = [
        // 1 · AÇILIŞ 0–14: karanlık, toz, ağır çekim ok, 10, logo
        { a: 0, b: 14, ciz(c, t) {
            c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H); toz(c, t, 70, null, .6);
            const hx = 1180, hy = 450, hr = 230;
            const hedefA = ara(t, 4.5, 7); hedef(c, hx, hy, hr, 10, { a: hedefA * .95, parla: ara(t, 9.3, 10) * (1 - ara(t, 11, 13)) });
            // ok uçuşu 6.4–9.4 (yavaş)
            const p = ara(t, 6.4, 9.4), x0 = -200, y0 = 520, ux = hx - 2, uy = hy + 3;
            if (p > 0 && p < 1) { const e = 1 - Math.pow(1 - p, 1.6), x = x0 + (ux - x0) * e, y = y0 + (uy - y0) * e - Math.sin(e * Math.PI) * 40; const aci = Math.atan2(uy - y0, ux - x0) - Math.cos(e * Math.PI) * .08; okIzi(c, x, y, aci, 420, 1); ok(c, x, y, aci, 260); }
            if (t >= 9.4) { saplanmis(c, ux, uy, 9); parlama(c, ux, uy, 260, (1 - ara(t, 9.4, 11)) * .9); halkaDalga(c, ux, uy, ara(t, 9.4, 10.6), 340); }
            if (t >= 9.4 && t < 9.6) karart(c, (1 - ara(t, 9.4, 9.6)) * .55, '#fff6d0');
            yazi(c, 'Bir nefes...', 420, 330, { s: 64, w: 600, f: FONT2, a: gorunur(t, .8, 4.6, .8, .8) });
            yazi(c, 'Bir hedef...', 420, 450, { s: 64, w: 600, f: FONT2, a: gorunur(t, 3.4, 6.6, .8, .8) });
            yazi(c, 'Ve bir ok.', 420, 570, { s: 64, w: 600, f: FONT2, a: gorunur(t, 5.8, 9.2, .6, .6) });
            if (t > 10.2) {
                const lp = ara(t, 10.2, 11.2); karart(c, lp * .55);
                harfHarf(c, 'DAĞ OKÇULUK', W / 2, 400, t, 10.3, { s: 190, ara: .06, ls: 6, a: 1 - ara(t, 13.2, 14) });
                yazi(c, 'ODAK  ·  GÜÇ  ·  TUTKU  ·  SPOR', W / 2, 545, { s: 40, w: 700, f: FONT2, r: TURUNCU, ls: 8, a: ara(t, 11.4, 12.2) * (1 - ara(t, 13.2, 14)) });
            }
            vinyet(c, .8);
        } },
        // 2 · BİZ KİMİZ 14–32
        { a: 14, b: 32, ciz(c, t) {
            const l = t - 14;
            if (l < 6.5) foto(c, 'salon', l, 6.5, { z0: 1.18, z1: 1.04, x0: .3, x1: .6, a: gorunur(l, 0, 6.5, .8, .5) });
            else if (l < 12.5) foto(c, 'takim', l - 6.5, 6, { z0: 1.0, z1: 1.12, y0: .35, y1: .3, a: gorunur(l, 6.3, 12.5, .5, .5) });
            else foto(c, 'ikili', l - 12.5, 5.5, { z0: 1.05, z1: 1.18, y0: .4, y1: .55, a: gorunur(l, 12.3, 18, .5, .6) });
            alttanKarart(c, .85); vinyet(c, .55);
            yazi(c, 'BİZ KİMİZ?', 110, 140, { h: 'left', s: 70, r: TURUNCU, ls: 4, a: gorunur(l, .3, 5.8) });
            yazi(c, 'Pendik Dağ Okçuluk Spor Kulübü', 110, 620, { h: 'left', s: 76, a: gorunur(l, .8, 6.2) });
            yazi(c, 'Her hafta aynı atış çizgisinde buluşan,', 110, 690, { h: 'left', s: 62, w: 700, a: gorunur(l, 6.8, 12.2) });
            yazi(c, 'birlikte büyüyen bir aile.', 110, 770, { h: 'left', s: 62, w: 700, r: ALTIN, a: gorunur(l, 7.6, 12.2) });
            yazi(c, 'Burası bizim salonumuz.', 110, 690, { h: 'left', s: 70, a: gorunur(l, 12.8, 17.6) });
            yazi(c, 'Burası senin yerin.', 110, 770, { h: 'left', s: 70, r: ALTIN, a: gorunur(l, 13.8, 17.6) });
        } },
        // 3 · OKÇULUK NEDİR 32–52: tarih çizgisi + halka halka hedef
        { a: 32, b: 52, ciz(c, t) {
            const l = t - 32; c.fillStyle = '#070a12'; c.fillRect(0, 0, W, H); toz(c, t, 40, 'rgba(120,170,255,.25)', .4);
            // tarih: yaylar (siluet) soldan gelir 0–10
            const tp = gorunur(l, 0, 10.4, .8, .8);
            if (tp > 0) {
                c.save(); c.globalAlpha = tp; c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(160, 520); c.lineTo(160 + 1280 * cik(ara(l, .3, 3)), 520); c.stroke(); c.restore();
                [['BİNLERCE YIL ÖNCE', 'Avcıların ve okçu süvarilerin yayı', 300], ['OSMANLI', 'Kemankeşler, menzil rekorları', 800], ['BUGÜN', 'Olimpiyat sporu', 1300]].forEach(([b1, b2, x], i) => {
                    const p = cik(ara(l, 1 + i * 2.2, 2 + i * 2.2)); c.save(); c.globalAlpha = tp * p; c.fillStyle = i === 2 ? ALTIN : TURUNCU; c.beginPath(); c.arc(x, 520, 12 * p, 0, 7); c.fill(); c.restore();
                    yazi(c, b1, x, 430 - (1 - p) * 30, { s: 46, r: i === 2 ? ALTIN : BEYAZ, a: tp * p }); yazi(c, b2, x, 590, { s: 30, w: 600, f: FONT2, r: '#c9d2e3', a: tp * p });
                    if (i === 2) yazi(c, '◯◯◯◯◯', x, 650, { s: 34, w: 400, r: '#9fb0ff', a: tp * p * .8, golge: false });
                });
                yazi(c, 'OKÇULUK NEDİR?', W / 2, 160, { s: 92, ls: 6, a: tp });
            }
            // hedef halka halka 10.4–20
            const hp = gorunur(l, 10.2, 20, .6, .7);
            if (hp > 0) {
                const kac = 10 * cik(ara(l, 10.6, 15.2)); hedef(c, 560, 470, 330, kac, { a: hp, zip: true, puan: true, parla: ara(l, 15, 16) });
                const sat = [['10 · 9', 'SARI', ALTIN], ['8 · 7', 'KIRMIZI', '#E5372C'], ['6 · 5', 'MAVİ', '#4AA0F0'], ['4 · 3', 'SİYAH', '#c0c4cc'], ['2 · 1', 'BEYAZ', '#fff']];
                sat.forEach(([p_, ad, r], i) => { const q = cik(ara(l, 11 + i * .7, 11.6 + i * .7)); yazi(c, ad, 1040 + (1 - q) * 60, 250 + i * 95, { h: 'left', s: 58, r: r, a: hp * q }); yazi(c, p_ + ' puan', 1300 + (1 - q) * 60, 250 + i * 95, { h: 'left', s: 44, w: 600, f: FONT2, a: hp * q }); });
                yazi(c, 'Ortası 10, dışarı çıktıkça azalır.', 1240, 760, { s: 40, w: 700, f: FONT2, r: ALTIN, a: hp * ara(l, 15, 16) });
            }
            vinyet(c, .6);
        } },
        // 4 · KLASİK YAY 52–70
        { a: 52, b: 70, ciz(c, t) {
            const l = t - 52; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c1424'); g.addColorStop(1, '#141c30'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            const fa = gorunur(l, 9.5, 18, 1, .6); if (fa > 0) { foto(c, 'ikili', l - 9.5, 8.5, { z0: 1.1, z1: 1.2, y0: .45, y1: .5, a: fa * .55 }); karart(c, .45); }
            const cek = l < 3 ? 0 : l < 6 ? yum(ara(l, 3, 5.5)) : l < 7.4 ? 1 : 0;
            const gir_ = cik(ara(l, .2, 1.6)); yayKlasik(c, 520 - (1 - gir_) * 400, 470, 1.05, cek, { a: gir_ * gorunur(l, 0, 18, .3, .6), ok: l < 7.4 });
            // bırakınca ok uçar
            if (l >= 7.4 && l < 9) { const p = ara(l, 7.4, 8.6); okIzi(c, 520 + 180 + p * 1100, 466, 0, 300, 1 - p); ok(c, 520 + 180 + p * 1100, 466, 0, 180); }
            if (l >= 7.4 && l < 8) karart(c, (1 - ara(l, 7.4, 8)) * .2, '#ffffff');
            yazi(c, 'KLASİK YAY', 1000, 200, { h: 'left', s: 110, ls: 4, a: gorunur(l, .5, 17.6) });
            yazi(c, 'Olimpiyatların yayı', 1000, 290, { h: 'left', s: 48, w: 700, f: FONT2, r: TURUNCU, a: gorunur(l, 1.2, 17.6) });
            [['✋', 'Parmakla çekilir', 2.4], ['💪', 'Güç senin bedeninden gelir', 5.6], ['🎯', '70 metre: olimpiyat mesafesi', 11.6]].forEach(([e, s, a]) => { const q = cik(ara(l, a, a + .6)); yazi(c, e + '  ' + s, 1000 + (1 - q) * 50, 420 + (a > 10 ? 2 : a > 5 ? 1 : 0) * 90, { h: 'left', s: 44, w: 700, f: FONT2, a: q * gorunur(l, 0, 17.6, .1, .6) }); });
            vinyet(c, .6);
        } },
        // 5 · MAKARALI YAY 70–88
        { a: 70, b: 88, ciz(c, t) {
            const l = t - 70;
            if (l < 9.5) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1620'); g.addColorStop(1, '#10202c'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
            else { foto(c, l < 13.8 ? 'kiz' : 'makarali', l < 13.8 ? l - 9.5 : l - 13.8, l < 13.8 ? 4.3 : 4.2, { z0: 1.05, z1: 1.18, y0: .4, y1: .3, a: gorunur(l, 9.3, 18, .6, .6) }); alttanKarart(c, .8); }
            const ga = gorunur(l, 0, 9.6, .5, .6), cek = l < 2.6 ? 0 : yum(ara(l, 2.6, 5.4));
            if (ga > 0) {
                yayMakarali(c, 560, 470, 1.2, cek, { a: ga });
                // makara çekiş eğrisi (let-off): ağırlık önce artar, sonra düşer
                const ex = 980, ey = 640, ew = 480, eh = 220, p = ara(l, 3, 6.5);
                c.save(); c.globalAlpha = ga; c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ex, ey - eh); c.lineTo(ex, ey); c.lineTo(ex + ew, ey); c.stroke();
                c.strokeStyle = '#7CFF8A'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 60 * p; i++) { const u = i / 60, k = u < .55 ? Math.sin(u / .55 * Math.PI / 2) : 1 - (u - .55) / .45 * .78; const px = ex + u * ew, py = ey - k * eh; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.restore();
                yazi(c, 'çekiş →', ex + ew, ey + 30, { h: 'right', s: 26, w: 600, f: FONT2, r: '#9aa3b5', a: ga, golge: false }); yazi(c, 'yük', ex - 12, ey - eh, { h: 'right', s: 26, w: 600, f: FONT2, r: '#9aa3b5', a: ga, golge: false });
                yazi(c, 'Tam çekişte yük hafifler', ex + ew * .5, ey - eh - 40, { s: 34, w: 800, f: FONT2, r: '#7CFF8A', a: ga * ara(l, 5.6, 6.4) });
            }
            yazi(c, 'MAKARALI YAY', 960, 200, { h: 'left', s: 96, ls: 4, a: gorunur(l, .4, 9.4) });
            yazi(c, 'Makaralar çekişi hafifletir', 960, 285, { h: 'left', s: 46, w: 700, f: FONT2, r: '#7CFF8A', a: gorunur(l, 1, 9.4) });
            yazi(c, 'Mekanik bırakıcı · büyüteçli nişangâh', 110, 560, { h: 'left', s: 56, a: gorunur(l, 9.8, 17.6) });
            yazi(c, '50 metrede milimetrik atış', 110, 640, { h: 'left', s: 56, r: ALTIN, a: gorunur(l, 10.8, 17.6) });
            vinyet(c, .6);
        } },
        // 6 · AMACIMIZ 88–100: dev kelimeler
        { a: 88, b: 100, ciz(c, t) {
            const l = t - 88; c.fillStyle = '#06070c'; c.fillRect(0, 0, W, H);
            foto(c, 'salon2', l, 12, { z0: 1.2, z1: 1.3, a: .22 }); toz(c, t, 50);
            yazi(c, 'Amacımız sadece 10 vurmak değil.', W / 2, 150, { s: 64, w: 700, f: FONT2, a: gorunur(l, .3, 11.6) });
            [['ODAK', TURUNCU], ['SABIR', ALTIN], ['ÖZGÜVEN', '#7CCBFF'], ['ARKADAŞLIK', '#7CFF8A']].forEach(([s, r], i) => {
                const a = 4.4 + i * 1.3, q = zip(ara(l, a, a + .5)); yazi(c, s, W / 2, 330 + i * 140, { s: 150, r: r, ls: 10, olcek: .6 + .4 * q, a: ara(l, a, a + .3) * (1 - ara(l, 11.3, 12)) });
            });
            vinyet(c, .7);
        } },
        // 7 · ZOR ANLAR 100–120
        { a: 100, b: 120, ciz(c, t) {
            const l = t - 100, isik = ara(l, 13.2, 15.5);
            c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H);
            // yağmur benzeri çizgiler (karamsar)
            c.save(); c.globalAlpha = .35 * (1 - isik); c.strokeStyle = '#8fa3c0'; c.lineWidth = 1.5; for (let i = 0; i < 90; i++) { const x = (rnd(i) * W + t * 60) % W, y = (rnd(i + 3) * H + t * 700 + i * 37) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 34); c.stroke(); } c.restore();
            const hx = 1260, hy = 470; hedef(c, hx, hy, 230, 10, { a: .55 + .45 * isik, parla: isik });
            // dağınık oklar (kötü gün) → toplanır
            for (let i = 0; i < 9; i++) {
                const gel = ara(l, 7.6 + i * .35, 7.9 + i * .35); if (gel <= 0) continue;
                const kx = hx + (rnd(i + 20) - .5) * 400, ky = hy + (rnd(i + 40) - .5) * 400, mx = hx + (rnd(i + 60) - .5) * 40, my = hy + (rnd(i + 80) - .5) * 40, q = yum(ara(l, 15.2 + i * .1, 17));
                saplanmis(c, kx + (mx - kx) * q, ky + (my - ky) * q, 8, q > .5 ? ALTIN : '#8a8f9a');
            }
            const sat = [['Bazen sıkılırsın.', 1, 4], ['Bazen yorulursun.', 4.5, 7.6], ['Bazen oklar istediğin yere gitmez.', 8, 12.6]];
            sat.forEach(([s, a, b], i) => yazi(c, s, 120, 300 + i * 110, { h: 'left', s: i === 2 ? 50 : 72, w: 700, f: FONT2, r: '#c3cad6', a: gorunur(l, a, 13.2, .7, .8) * (l < b ? 1 : .55) }));
            yazi(c, 'Ama düzenli antrenmanla...', 120, 360, { h: 'left', s: 76, w: 800, f: FONT2, a: gorunur(l, 13.6, 19.6, .7, .4) });
            harfHarf(c, 'HER ŞEY DÜZELİR.', 520, 500, t, 115.6, { s: 120, r: ALTIN, ara: .05, a: 1 - ara(l, 19.4, 20) });
            if (isik > 0) { parlama(c, hx, hy, 500 * isik, .25 * isik); }
            vinyet(c, .85 - .25 * isik);
        } },
        // 8 · ATIŞ OKULU 120–152: önce form, sonra nişangâh
        { a: 120, b: 152, ciz(c, t) {
            const l = t - 120; const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0a1020'); g.addColorStop(1, '#16102a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            const hx = 1230, hy = 430, hr = 270; hedef(c, hx, hy, hr, 10, { parla: l > 29 ? ara(l, 29, 30) : 0 });
            yazi(c, 'ATIŞ OKULU', 110, 110, { h: 'left', s: 64, r: TURUNCU, ls: 6 });
            // A: dağınık → form → toplanır (0–15)
            const okSay = 6;
            for (let i = 0; i < okSay; i++) {
                let x, y; const dag = [hx + (rnd(i + 1) - .5) * 420, hy + (rnd(i + 2) - .5) * 420];
                const grup = [hx + 130 + (rnd(i + 5) - .5) * 60, hy - 115 + (rnd(i + 6) - .5) * 60]; // toplu ama sağ üstte
                const merk = [hx + (rnd(i + 5) - .5) * 60, hy + (rnd(i + 6) - .5) * 60];
                const g1 = yum(ara(l, 11.4, 13.6)), g2 = yum(ara(l, 27.4, 29.4));
                x = dag[0] + (grup[0] - dag[0]) * g1; y = dag[1] + (grup[1] - dag[1]) * g1;
                x = x + (merk[0] - x) * g2; y = y + (merk[1] - y) * g2;
                const gor = ara(l, .6 + i * .25, .8 + i * .25); if (gor > 0) saplanmis(c, x, y, 9, g2 > .9 ? ALTIN : TURUNCU);
            }
            // dağınıklık / grup halkası
            if (l > 1.8 && l < 11.2) { c.save(); c.setLineDash([12, 10]); c.strokeStyle = 'rgba(255,90,90,' + gorunur(l, 1.8, 11.2) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 235, 0, 7); c.stroke(); c.restore(); }
            if (l > 14 && l < 27.6) { c.save(); c.setLineDash([12, 10]); c.strokeStyle = 'rgba(124,255,138,' + gorunur(l, 14, 27.6) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(hx + 130, hy - 115, 70, 0, 7); c.stroke(); c.restore(); }
            const fA = gorunur(l, .4, 14, .5, .6);
            yazi(c, 'Oklar dağınık mı?', 110, 230, { h: 'left', s: 70, a: fA });
            yazi(c, 'Önce FORMUNA bak:', 110, 310, { h: 'left', s: 52, w: 700, f: FONT2, r: ALTIN, a: fA * ara(l, 1.4, 2) });
            [['🦶', 'Hep aynı duruş', 4.6], ['💪', 'Hep aynı çekiş', 6.2], ['🌬️', 'Nefesini kontrol et', 7.8], ['🤲', 'Yumuşak bırakış, takip et', 9.4]].forEach(([e, s, a], i) => {
                const q = cik(ara(l, a, a + .5)); yazi(c, e + '  ' + s, 130 + (1 - q) * 40, 410 + i * 80, { h: 'left', s: 46, w: 700, f: FONT2, a: q * fA });
                if (l > a + .4) yazi(c, '✓', 100, 410 + i * 80, { s: 46, r: '#7CFF8A', a: fA * ara(l, a + .4, a + .8) });
            });
            yazi(c, 'Form oturunca oklar TOPLANIR.', 110, 740, { h: 'left', s: 50, w: 800, f: FONT2, r: '#7CFF8A', a: gorunur(l, 11.6, 14) });
            // B: nişangâh (15–31)
            const fB = gorunur(l, 15, 31.6, .5, .6);
            yazi(c, 'Toplandı ama merkezde değil mi?', 110, 230, { h: 'left', s: 62, a: fB });
            yazi(c, 'NİŞANGÂH ZAMANI', 110, 310, { h: 'left', s: 64, r: ALTIN, ls: 3, a: fB * ara(l, 18.6, 19.2) });
            yazi(c, 'Nişangâh oku takip eder:', 110, 400, { h: 'left', s: 48, w: 700, f: FONT2, a: fB * ara(l, 21.4, 22) });
            yazi(c, '➡  Oklar sağda → nişangâhı SAĞA al', 110, 470, { h: 'left', s: 42, w: 700, f: FONT2, a: fB * ara(l, 23, 23.6) });
            yazi(c, '⬆  Oklar yukarıda → nişangâhı YUKARI al', 110, 535, { h: 'left', s: 42, w: 700, f: FONT2, a: fB * ara(l, 24.2, 24.8) });
            // nişangâh büyüteci (vizör) çizimi: pin önce merkezde, sonra sağ-yukarı kayar
            if (fB > 0) {
                const vx = 380, vy = 630, kay = yum(ara(l, 25, 27.2)), px = vx + kay * 34, py = vy - kay * 30;
                c.save(); c.globalAlpha = fB; c.fillStyle = '#10141e'; c.fillRect(vx - 160, vy - 12, 320, 24); c.strokeStyle = '#3a4256'; c.lineWidth = 3; c.strokeRect(vx - 160, vy - 12, 320, 24);
                c.fillStyle = '#0b0e15'; c.beginPath(); c.arc(px, py, 58, 0, 7); c.fill(); c.strokeStyle = '#9aa3b5'; c.lineWidth = 6; c.stroke(); c.fillStyle = ALTIN; c.beginPath(); c.arc(px, py, 7, 0, 7); c.fill();
                for (let k = -6; k <= 6; k++) { c.fillStyle = '#5a6378'; c.fillRect(vx + k * 20 - 1, vy + 14, 2, k % 2 ? 8 : 14); }
                c.restore();
                yazi(c, 'klik klik', px + 90, py - 30, { h: 'left', s: 30, w: 800, f: FONT2, r: '#7CCBFF', a: fB * gorunur(l, 25, 27.8, .2, .3) });
            }
            if (l > 29.2) { yazi(c, '10!', hx, hy - 330, { s: 120, r: ALTIN, olcek: zip(ara(l, 29.2, 29.8)), a: ara(l, 29.2, 29.5) * (1 - ara(l, 31.4, 32)) }); halkaDalga(c, hx, hy, ara(l, 29.2, 30.6), 400); }
            vinyet(c, .55);
        } },
        // 9 · GELECEK 152–172: yarışma + madalya, oyunlar, hayat yolu
        { a: 152, b: 172, ciz(c, t) {
            const l = t - 152;
            if (l < 8.2) { foto(c, 'stadyum', l, 8.2, { z0: 1.0, z1: 1.14, y0: .3, y1: .45, a: gorunur(l, 0, 8.2, .5, .5) }); alttanKarart(c, .85); vinyet(c, .5);
                yazi(c, 'YARIŞMALAR', 110, 600, { h: 'left', s: 120, ls: 6, a: gorunur(l, .4, 8) }); yazi(c, 'Madalyalar · kürsüler · alkışlar', 110, 700, { h: 'left', s: 54, w: 700, f: FONT2, r: ALTIN, a: gorunur(l, 3.6, 8) });
                [[1180, 300, ALTIN, '1', 3.6], [1360, 340, '#cfd6e0', '2', 4.4], [1000, 360, '#d08a4a', '3', 5.2]].forEach(([x, y, r, s, a]) => { const q = ara(l, a, a + .8); if (q > 0) madalya(c, x, y - (1 - cik(q)) * 300, 70, Math.sin(t * 2.2 + x) * .12 * (1 - q * .5), r, s); });
                return; }
            c.fillStyle = '#080a12'; c.fillRect(0, 0, W, H); toz(c, t, 50, 'rgba(255,210,63,.3)');
            if (l < 14) { // oyunlar + yarışma modu
                const a2 = gorunur(l, 8.2, 14, .5, .5);
                ['zirve', 'canavar', 'hapsirik', 'ninja'].forEach((k, i) => { if (!hazir(k)) return; const q = cik(ara(l, 8.4 + i * .3, 9.2 + i * .3)), x = 140 + i * 340, y = 210; c.save(); c.globalAlpha = a2 * q; c.translate(x + 150, y + 110); c.rotate((i - 1.5) * .04); c.scale(.8 + .2 * q, .8 + .2 * q); const im = IMG[k], s = Math.max(300 / im.naturalWidth, 220 / im.naturalHeight); c.beginPath(); c.roundRect ? c.roundRect(-150, -110, 300, 220, 22) : c.rect(-150, -110, 300, 220); c.clip(); c.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); c.restore(); });
                yazi(c, 'Oyunlarla EĞLEN', W / 2, 560, { s: 92, r: '#7CFF8A', a: a2 * ara(l, 8.6, 9.2) });
                yazi(c, 'Yarışma modunda KENDİNİ TANI', W / 2, 690, { s: 80, r: ALTIN, a: a2 * ara(l, 10.2, 10.8) });
                return;
            }
            // hayat yolu 14–20
            const a3 = gorunur(l, 14, 20, .4, .5), ad = [['ORTAOKUL', '🎒'], ['LİSE', '📚'], ['ÜNİVERSİTE', '🎓'], ['İŞ HAYATI', '💼']];
            c.save(); c.globalAlpha = a3; c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 4; c.beginPath(); c.moveTo(180, 420); c.lineTo(180 + 1240 * cik(ara(l, 14, 15.6)), 420); c.stroke(); c.restore();
            ad.forEach(([s, e], i) => { const q = cik(ara(l, 14.3 + i * .55, 14.9 + i * .55)), x = 260 + i * 360; yazi(c, e, x, 330 - (1 - q) * 40, { s: 80, a: a3 * q, golge: false }); yazi(c, s, x, 490, { s: 54, a: a3 * q }); c.save(); c.globalAlpha = a3 * q; c.fillStyle = TURUNCU; c.beginPath(); c.arc(x, 420, 13, 0, 7); c.fill(); c.restore(); });
            yazi(c, 'Okçulukta öğrendiğin her şey seninle gelir.', W / 2, 650, { s: 58, w: 700, f: FONT2, a: a3 * ara(l, 16, 16.6) });
            yazi(c, 'Odak  ·  Sabır  ·  Liderlik  ·  Arkadaşlık', W / 2, 740, { s: 60, r: ALTIN, a: a3 * ara(l, 17, 17.6) });
            vinyet(c, .6);
        } },
        // 10 · FİNAL 172–186
        { a: 172, b: SURE + 1, ciz(c, t) {
            const l = t - 172; foto(c, 'kiz', l, 14, { z0: 1.25, z1: 1.05, y0: .35, y1: .45, a: .5 * (1 - ara(l, 7.6, 8.4)) }); karart(c, .55); toz(c, t, 80, null, 1.6);
            const kel = [['ODAK.', 0.6], ['SABIR.', 1.6], ['LİDERLİK.', 2.6], ['ARKADAŞLIK.', 3.6]];
            kel.forEach(([s, a], i) => yazi(c, s, W / 2, 230 + i * 130, { s: 130, r: i % 2 ? ALTIN : BEYAZ, ls: 8, olcek: .7 + .3 * zip(ara(l, a, a + .4)), a: ara(l, a, a + .25) * (1 - ara(l, 4.8, 5.4)) }));
            yazi(c, 'Hedefin ne?', W / 2, 450, { s: 120, a: gorunur(l, 5.4, 8.2, .4, .3) });
            // final oku 8.2–8.6 (müzikteki büyük vuruşla)
            const hx = W / 2, hy = 420; const hA = ara(l, 7.8, 8.3); if (hA > 0) hedef(c, hx, hy, 210, 10, { a: hA * (1 - ara(l, 13, 14)), parla: ara(l, 8.6, 9) });
            const p = ara(l, 8.2, 8.6); if (p > 0 && p < 1) { const x = -100 + (hx + 100) * gir(p); okIzi(c, x, hy, 0, 600, 1); ok(c, x, hy, 0, 240); }
            if (l >= 8.6) { saplanmis(c, hx, hy, 9); parlama(c, hx, hy, 420, (1 - ara(l, 8.6, 10)) * 1); halkaDalga(c, hx, hy, ara(l, 8.6, 10), 700); halkaDalga(c, hx, hy, ara(l, 8.9, 10.5), 900); if (l < 8.8) karart(c, (1 - ara(l, 8.6, 8.8)) * .8, '#fff6d0'); }
            yazi(c, 'SIRADAKİ OK SENİN.', W / 2, 720, { s: 120, r: ALTIN, ls: 4, olcek: .8 + .2 * zip(ara(l, 9, 9.6)), a: ara(l, 9, 9.3) });
            if (hazir('logo') && l > 10.4) { const q = cik(ara(l, 10.4, 11.4)), im = IMG.logo, s = 130 / im.naturalHeight; c.save(); c.globalAlpha = q; c.drawImage(im, W / 2 - im.naturalWidth * s / 2, 70, im.naturalWidth * s, 130); c.restore(); }
            yazi(c, 'DAĞ OKÇULUK  ·  ODAK · GÜÇ · TUTKU · SPOR', W / 2, 830, { s: 34, w: 700, f: FONT2, r: '#c9d2e3', ls: 4, a: ara(l, 11, 12) });
            vinyet(c, .7);
        } }
    ];
    // Seslendirme + altyazı (t, metin)
    const ANLATIM = [
        [0.8, 'Bir nefes...', 0], [3.5, 'Bir hedef...', 0], [6, 'Ve bir ok.', 0],
        [15, 'Biz Dağ Okçuluk\'uz.'], [20.4, 'Her hafta aynı atış çizgisinde buluşan, birlikte büyüyen bir aileyiz.', 0], [27, 'Burası bizim salonumuz. Burası senin yerin.', 0],
        [33, 'Okçuluk binlerce yıllık bir sanat.'], [37.4, 'Bugün ise olimpiyatlarda yarışılan bir spor.'], [43.2, 'Hedefin tam ortası on puan. Dışarı çıktıkça puan azalır.', 0],
        [53, 'Bu klasik yay: olimpiyatların yayı.', 0], [57.4, 'Parmaklarınla çekersin; gücü kendi bedeninden gelir.'], [63.6, 'Olimpiyatlarda yetmiş metreden atılır.'],
        [71, 'Bu da makaralı yay.', 0], [74, 'Uçlarındaki makaralar sayesinde, tam çekişte yük hafifler.'], [80.4, 'Mekanik bırakıcıyla elli metreden milimetrik atışlar yapılır.'],
        [89, 'Amacımız sadece on vurmak değil.', 0], [92.4, 'Odaklanmayı, sabretmeyi, kendine güvenmeyi ve arkadaşlığı öğrenmek.', 0],
        [101, 'Bazen sıkılırsın.', 0], [104.5, 'Bazen yorulursun.', 0], [108, 'Bazen oklar istediğin yere gitmez.', 0], [113.6, 'Ama düzenli antrenmanla... her şey düzelir.', 0],
        [120.6, 'Oklar dağınıksa, önce formuna bak.', 0], [124.4, 'Hep aynı duruş. Hep aynı çekiş.', 0], [127.8, 'Nefesini kontrol et. Yumuşak bırak.', 0], [131.6, 'Form oturunca, oklar toplanır.', 0],
        [135.4, 'Toplandı ama merkezde değil mi?', 0], [138.6, 'O zaman nişangâh zamanı.', 0], [141.4, 'Nişangâh oku takip eder. Oklar sağdaysa nişangâhı sağa al.', 0], [147.6, 'Bir iki klik... ve on!'],
        [152.6, 'Sonra yarışmalar gelir.', 0], [155.8, 'Madalyalar, kürsüler, alkışlar.', 0], [160.4, 'Oyunlarla eğlenirsin. Yarışma modunda kendini tanırsın.', 0],
        [166, 'Okçulukta öğrendiğin her şey seninle gelir: ortaokulda, lisede, üniversitede, iş hayatında.', 0],
        [172.6, 'Odak. Sabır. Liderlik. Arkadaşlık.', 0], [177.4, 'Hedefin ne?', 0], [181, 'Sıradaki ok senin.', 0]
    ];

    /* ---------- MÜZİK (WebAudio, sentez). 84 BPM; bölümler zamana bağlı, sarınca kaldığı ölçüden devam ---------- */
    const BPM = 84, VUR = 60 / BPM;
    const AKOR = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
    const ZOR = [[57, 60, 64], [50, 53, 57]]; // Am Dm
    const MEL = [76, 74, 72, 71, 72, 74, 76, 79, 81, 79, 76, 74, 72, 74, 76, 72]; // epik ezgi (8'lik)
    const bolum = (t) => t < 32 ? 'los' : t < 100 ? 'yumusak' : t < 120 ? 'zor' : t < 152 ? 'yuksel' : t < 180 ? 'epik' : 'son';
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    let AC = null, bus = null, master = null, _gurBuf = null;
    function sesKur() {
        if (AC) return AC; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return null; }
        master = AC.createGain(); master.gain.value = .85; const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; master.connect(comp); comp.connect(AC.destination);
        const n = AC.sampleRate * 1.5; _gurBuf = AC.createBuffer(1, n, AC.sampleRate); const d = _gurBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return AC;
    }
    function yeniBus() { if (bus) { try { bus.gain.setValueAtTime(0, AC.currentTime); bus.disconnect(); } catch (e) { } } bus = AC.createGain(); bus.gain.value = 1; bus.connect(master); }
    function zarf(g, t, at, tut, bir, gur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gur), t + at); g.gain.setValueAtTime(Math.max(.0002, gur), t + at + tut); g.gain.exponentialRampToValueAtTime(0.0001, t + at + tut + bir); }
    function ped(nota, t, sure, gur, kesim) { nota.forEach((m) => { [-6, 6].forEach((dt) => { const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = kesim; f.Q.value = .6; o.connect(f); f.connect(g); g.connect(bus); zarf(g, t, sure * .3, sure * .45, sure * .35, gur); o.start(t); o.stop(t + sure + .1); }); }); }
    function cin(m, t, gur, sure) { const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m + 12); o.connect(g); o2.connect(g); g.connect(bus); zarf(g, t, .005, .02, sure || .8, gur); o.start(t); o2.start(t); o.stop(t + (sure || .8) + .1); o2.stop(t + (sure || .8) + .1); }
    function bas(m, t, sure, gur) { const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.value = 260; o.connect(f); f.connect(g); g.connect(bus); zarf(g, t, .01, sure * .6, sure * .4, gur); o.start(t); o.stop(t + sure + .05); }
    function davul(t, gur) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .25); o.connect(g); g.connect(bus); zarf(g, t, .003, .03, .3, gur); o.start(t); o.stop(t + .4); }
    function gur(t, sure, gur_, f, tip) { const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = _gurBuf; fl.type = tip || 'bandpass'; fl.frequency.value = f || 1800; s.connect(fl); fl.connect(g); g.connect(bus); zarf(g, t, .002, .01, sure, gur_); s.start(t, Math.random() * .5); s.stop(t + sure + .05); }
    function trampet(t, g_) { gur(t, .18, g_, 1800); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = 190; o.connect(g); g.connect(bus); zarf(g, t, .002, .01, .12, g_ * .5); o.start(t); o.stop(t + .2); }
    function zil(t, g_) { gur(t, .05, g_, 8000, 'highpass'); }
    function tom(t, m, g_) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(hz(m), t); o.frequency.exponentialRampToValueAtTime(hz(m) * .5, t + .3); o.connect(g); g.connect(bus); zarf(g, t, .003, .03, .3, g_); o.start(t); o.stop(t + .4); }
    function yukselis(t, sure, g_) { const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = _gurBuf; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(6000, t + sure); s.connect(fl); fl.connect(g); g.connect(bus); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(g_, t + sure); g.gain.exponentialRampToValueAtTime(.0001, t + sure + .15); s.start(t); s.stop(t + sure + .2); }
    function darbe(t, g_) { davul(t, g_); gur(t, 1.6, g_ * .5, 400, 'lowpass'); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(55, t); o.connect(g); g.connect(bus); zarf(g, t, .005, .2, 2.2, g_ * .8); o.start(t); o.stop(t + 2.5); }
    // tek vuruşluk müzik: k = vuruş indisi (filmin 0'ından), ts = AC zamanı
    function vurusCal(k, ts) {
        const t = k * VUR, b = bolum(t), olcu = Math.floor(k / 4), v = k % 4, ak = AKOR[olcu % 4];
        if (b === 'los') { if (k === Math.round(9.4 / VUR)) darbe(ts, .5); if (v === 0) ped(ak, ts, VUR * 4, .028, 650); if (t > 4 && (v === 0 || v === 2)) cin(ak[v === 0 ? 0 : 2] + 12, ts, .03, 1.6); }
        else if (b === 'yumusak') { if (v === 0) { ped(ak, ts, VUR * 4, .03, 900); bas(ak[0] - 24, ts, VUR * 3.8, .1); } [0, .5].forEach((h, j) => cin(ak[(v * 2 + j) % 3] + 12, ts + h * VUR, .022, .5)); if (t > 60 && (v === 0 || v === 2)) davul(ts, .22); if (t > 76 && (v === 1 || v === 3)) zil(ts + VUR * .5, .03); }
        else if (b === 'zor') { const za = ZOR[olcu % 2]; if (v === 0) ped(za, ts, VUR * 4, .028, 480); if (v === 0) { davul(ts, .3); davul(ts + .22, .2); } if (v === 2) cin(za[2], ts, .02, 1.4); if (t >= 114 && t < 114 + VUR) yukselis(ts, 120 - t, .12); }
        else if (b === 'yuksel') {
            const p = (t - 120) / 32, kes = 900 + p * 2600;
            if (v === 0) { ped(ak, ts, VUR * 4, .03 + p * .015, kes); }
            davul(ts, .45 + p * .2); [0, .5].forEach((h) => { bas(ak[0] - 24, ts + h * VUR, VUR * .45, .1); zil(ts + h * VUR + VUR * .25, .03 + p * .03); });
            if (t > 126 && (v === 1 || v === 3)) trampet(ts, .18 + p * .1);
            for (let j = 0; j < 4; j++) cin(ak[j % 3] + 12 + (j > 1 ? 12 : 0), ts + j * VUR / 4, .014 + p * .016, .25);
            if (t >= 148 && t < 148 + VUR) yukselis(ts, 152 - t, .16);
        }
        else if (b === 'epik') {
            if (v === 0) { ped(ak, ts, VUR * 4, .05, 3200); ped([ak[0] + 12, ak[1] + 12], ts, VUR * 4, .025, 3600); }
            davul(ts, .7); if (v === 1 || v === 3) trampet(ts, .32); [0, .5].forEach((h) => { bas(ak[0] - 24, ts + h * VUR, VUR * .45, .13); zil(ts + h * VUR + VUR * .25, .06); });
            [0, .5].forEach((h, j) => { const m = MEL[(k * 2 + j) % MEL.length]; cin(m, ts + h * VUR, .045, .45); });
            if (olcu % 4 === 3 && v === 3) [0, .25, .5, .75].forEach((h, j) => tom(ts + h * VUR, 50 - j * 3, .35));
            if (t >= 152 && t < 152 + VUR) darbe(ts, .6);
            if (t >= 177.3 && t < 177.3 + VUR) yukselis(ts, 180.2 - t, .2);
        }
        else if (b === 'son') { if (k === Math.ceil(180.2 / VUR)) { darbe(ts, .9); ped(AKOR[0], ts, 5.5, .06, 3000); ped([69, 72, 76], ts, 5.5, .035, 4000); cin(81, ts, .06, 3); } }
    }
    // final ok vuruşu (180.2 s) müziğe sabit: yukarıdaki 'son' bloğu yakalar
    let _sonrakiVurus = 0, _zamanlayici = null;
    function planla() { if (!AC || durum.duraklat) return; const simdi = saat(); const ileri = simdi + .6; while (_sonrakiVurus * VUR < ileri && _sonrakiVurus * VUR < SURE) { const t = _sonrakiVurus * VUR; if (t >= simdi - .05) { try { vurusCal(_sonrakiVurus, AC.currentTime + (t - simdi)); } catch (e) { } } _sonrakiVurus++; } }

    /* ---------- seslendirme ---------- */
    let _sesTr = null;
    function sesSec() { try { const v = speechSynthesis.getVoices(); _sesTr = v.find((x) => /^tr/i.test(x.lang) && /Yelda|Google|Filiz|Emel/i.test(x.name)) || v.find((x) => /^tr/i.test(x.lang)) || null; } catch (e) { } }
    function konus(m) { if (!durum.anlatim || !window.speechSynthesis) return; try { const u = new SpeechSynthesisUtterance(m); u.lang = 'tr-TR'; if (_sesTr) u.voice = _sesTr; u.rate = .98; u.pitch = 1; u.volume = 1; speechSynthesis.speak(u); } catch (e) { } }

    /* ---------- oynatıcı ---------- */
    const durum = { t: 0, duraklat: true, anlatim: true, ses: true, son: -1, baslaAC: 0, baslaPerf: 0, bitti: false };
    function saat() { if (durum.duraklat) return durum.t; if (AC && AC.state === 'running') return AC.currentTime - durum.baslaAC; return (performance.now() - durum.baslaPerf) / 1000; }
    let _raf = 0, _cv = null, _c = null; const _hatalar = [];
    function boyutla() {
        const k = $('dfm'), cv = _cv; if (!k || !cv) return; const d = Math.min(2, window.devicePixelRatio || 1), ww = k.clientWidth, hh = k.clientHeight;
        const s = Math.min(ww / W, hh / H); cv.style.width = Math.round(W * s) + 'px'; cv.style.height = Math.round(H * s) + 'px'; cv.width = Math.round(W * s * d); cv.height = Math.round(H * s * d); _c.setTransform(s * d, 0, 0, s * d, 0, 0);
    }
    function ciz(t) {
        const c = _c; if (!c) return; c.save(); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        // geçişler: sahneler üst üste biner (bir sonrakinin ilk 0.6 sn'si)
        SAHNE.forEach((s) => { if (t >= s.a - .001 && t < s.b) { c.save(); try { s.ciz(c, t); } catch (e) { if (_hatalar.length < 20) _hatalar.push(s.a + 's: ' + e.message); } c.restore(); } });
        const gec = SAHNE.find((s) => t >= s.a && t < s.a + .6 && s.a > 0); if (gec) { c.fillStyle = 'rgba(0,0,0,' + (1 - ara(t, gec.a, gec.a + .6)) * .6 + ')'; c.fillRect(0, 0, W, H); }
        if (t > SURE - 1.5) { c.fillStyle = 'rgba(0,0,0,' + ara(t, SURE - 1.5, SURE) + ')'; c.fillRect(0, 0, W, H); }
        c.restore();
        // altyazı + ilerleme
        let alt = ''; for (let i = 0; i < ANLATIM.length; i++) { const [a, m, g] = ANLATIM[i], b = i + 1 < ANLATIM.length ? Math.min(ANLATIM[i + 1][0], a + 6.5) : a + 5; if (t >= a && t < b) { alt = g === 0 ? '' : m; break; } }
        const ae = $('dfm-alt'); if (ae && ae.textContent !== alt) { ae.textContent = alt; ae.style.opacity = alt ? 1 : 0; }
        const pe = $('dfm-ilerle'); if (pe) pe.style.width = (t / SURE * 100) + '%';
        const ze = $('dfm-zaman'); if (ze) { const f = (x) => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0'); ze.textContent = f(t) + ' / ' + f(SURE); }
    }
    function dongu() {
        _raf = 0; if (!$('dfm')) return;
        const t = Math.min(SURE, saat()); durum.t = t; planla();
        // seslendirme: geçilen satır (sarınca ileri atlananlar söylenmez)
        for (let i = durum.son + 1; i < ANLATIM.length && ANLATIM[i][0] <= t; i++) { if (t - ANLATIM[i][0] < 1.2) konus(ANLATIM[i][1]); durum.son = i; }
        ciz(t);
        if (t >= SURE) { bitir(); return; }
        if (!durum.duraklat) _raf = requestAnimationFrame(dongu);
    }
    function oynat() {
        sesKur(); durum.bitti = false; $('dfm').classList.remove('bitti');
        if (durum.t >= SURE - .05) durum.t = 0;
        if (AC) { if (AC.state === 'suspended') AC.resume(); yeniBus(); durum.baslaAC = AC.currentTime - durum.t; master.gain.value = durum.ses ? .85 : 0; }
        durum.baslaPerf = performance.now() - durum.t * 1000;
        _sonrakiVurus = Math.ceil(durum.t / VUR); durum.son = ANLATIM.findIndex((x) => x[0] >= durum.t) - 1; if (durum.son < -1) durum.son = ANLATIM.length - 1;
        durum.duraklat = false; dugmeYaz(); clearInterval(_zamanlayici); _zamanlayici = setInterval(planla, 120);
        if (!_raf) _raf = requestAnimationFrame(dongu);
    }
    function duraklat() { durum.t = saat(); durum.duraklat = true; clearInterval(_zamanlayici); if (bus) { try { bus.gain.setValueAtTime(0, AC.currentTime); } catch (e) { } } try { speechSynthesis.cancel(); } catch (e) { } dugmeYaz(); ciz(durum.t); }
    function sar(t) { const calisiyor = !durum.duraklat; if (calisiyor) duraklat(); durum.t = kis(t, 0, SURE - .1); durum.son = ANLATIM.findIndex((x) => x[0] >= durum.t) - 1; ciz(durum.t); if (calisiyor) oynat(); }
    function bitir() { durum.duraklat = true; durum.bitti = true; durum.t = SURE; clearInterval(_zamanlayici); const k = $('dfm'); if (k) k.classList.add('bitti'); dugmeYaz(); }
    function dugmeYaz() { const b = $('dfm-oynat'); if (b) b.textContent = durum.duraklat ? (durum.bitti ? '↻' : '▶') : '❚❚'; const a = $('dfm-anlatim'); if (a) { a.textContent = durum.anlatim ? '🗣️' : '🔕'; a.title = durum.anlatim ? 'Seslendirme açık' : 'Seslendirme kapalı'; } const s = $('dfm-ses'); if (s) s.textContent = durum.ses ? '🔊' : '🔇'; }
    function kapat() {
        durum.duraklat = true; clearInterval(_zamanlayici); if (_raf) cancelAnimationFrame(_raf); _raf = 0; try { speechSynthesis.cancel(); } catch (e) { }
        if (bus) { try { bus.disconnect(); } catch (e) { } bus = null; } try { if (AC) AC.suspend(); } catch (e) { }
        try { if (document.fullscreenElement) document.exitFullscreen(); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) { }
        const k = $('dfm'); if (k) k.remove(); window.removeEventListener('resize', boyutla); document.removeEventListener('keydown', tus); document.removeEventListener('visibilitychange', gizlenince);
    }
    function tus(e) { if (e.key === 'Escape') kapat(); else if (e.key === ' ') { e.preventDefault(); durum.duraklat ? oynat() : duraklat(); } else if (e.key === 'ArrowRight') sar(saat() + 10); else if (e.key === 'ArrowLeft') sar(saat() - 10); }
    function gizlenince() { if (document.hidden && !durum.duraklat) duraklat(); }
    function css() {
        if ($('dfm-css')) return; const s = document.createElement('style'); s.id = 'dfm-css';
        s.textContent = '#dfm{position:fixed;inset:0;z-index:2147483600;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-family:"Archivo",system-ui,sans-serif;-webkit-user-select:none;user-select:none}'
            + '#dfm canvas{display:block}'
            + '#dfm-alt{position:absolute;left:50%;bottom:clamp(64px,10vh,110px);transform:translateX(-50%);max-width:min(92vw,1100px);text-align:center;font-weight:800;font-size:clamp(17px,2.6vw,34px);line-height:1.3;padding:.3em .8em;border-radius:.5em;background:rgba(0,0,0,.55);transition:opacity .3s;pointer-events:none}'
            + '#dfm-alt:empty{opacity:0}'
            + '.dfm-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:10px max(14px,env(safe-area-inset-left));background:linear-gradient(transparent,rgba(0,0,0,.75));opacity:1;transition:opacity .4s}'
            + '#dfm.oynuyor:not(:hover) .dfm-bar{opacity:.0}#dfm.oynuyor.dokundu .dfm-bar{opacity:1}'
            + '.dfm-bar button{min-width:48px;height:48px;border-radius:24px;border:1px solid rgba(255,255,255,.25);background:rgba(20,24,34,.8);color:#fff;font-size:20px;font-weight:800;cursor:pointer}'
            + '.dfm-cubuk{flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.2);cursor:pointer;position:relative}.dfm-cubuk i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:#FF6A1A}'
            + '#dfm-zaman{font-variant-numeric:tabular-nums;font-weight:700;font-size:14px;min-width:84px;text-align:right}'
            + '#dfm-kapat{position:absolute;top:max(12px,env(safe-area-inset-top));right:14px;width:48px;height:48px;border-radius:24px;border:1px solid rgba(255,255,255,.25);background:rgba(20,24,34,.8);color:#fff;font-size:22px;cursor:pointer;z-index:3}'
            + '.dfm-giris{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 40%,rgba(255,106,26,.25),rgba(0,0,0,.92) 60%);text-align:center;padding:20px}'
            + '.dfm-giris h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(44px,8vw,96px);letter-spacing:.04em;line-height:.95}.dfm-giris p{margin:0;color:#c9d2e3;font-size:clamp(15px,2vw,20px);max-width:620px}'
            + '.dfm-buyuk{min-width:220px;min-height:68px;border-radius:34px;border:0;background:#FF6A1A;color:#1a0d05;font-family:inherit;font-size:24px;font-weight:900;cursor:pointer;box-shadow:0 10px 40px rgba(255,106,26,.45)}'
            + '.dfm-son{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(0,0,0,.6)}#dfm.bitti .dfm-son{display:flex}'
            + '.dfm-son button{min-width:200px;min-height:56px;border-radius:28px;border:1px solid rgba(255,255,255,.3);background:rgba(20,24,34,.85);color:#fff;font-family:inherit;font-size:20px;font-weight:800;cursor:pointer}.dfm-son button.dfm-buyuk{background:#FF6A1A;color:#1a0d05;border:0}';
        document.head.appendChild(s);
    }
    function dagFilmAc() {
        if ($('dfm')) return; css(); yukle(); sesSec(); try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = sesSec; } catch (e) { }
        const k = document.createElement('div'); k.id = 'dfm'; k.setAttribute('role', 'dialog'); k.setAttribute('aria-label', 'Okçuluk filmi');
        k.innerHTML = '<canvas id="dfm-cv" aria-hidden="true"></canvas><div id="dfm-alt" aria-live="polite"></div>'
            + '<div class="dfm-bar"><button id="dfm-oynat" aria-label="Oynat / duraklat">▶</button><button id="dfm-geri" aria-label="10 saniye geri">⟲</button><div class="dfm-cubuk" id="dfm-cubuk" role="slider" aria-label="Filmde ilerle"><i id="dfm-ilerle"></i></div><span id="dfm-zaman">0:00 / 3:06</span><button id="dfm-anlatim" aria-label="Seslendirme">🗣️</button><button id="dfm-ses" aria-label="Ses">🔊</button><button id="dfm-tam" aria-label="Tam ekran">⛶</button></div>'
            + '<button id="dfm-kapat" aria-label="Kapat">✕</button>'
            + '<div class="dfm-son"><h2 style="margin:0;font-family:\'Barlow Condensed\',Impact,sans-serif;font-size:clamp(40px,7vw,80px)">SIRADAKİ OK SENİN.</h2><button class="dfm-buyuk" id="dfm-tekrar">↻ Tekrar izle</button><button id="dfm-son-kapat">Kapat</button></div>'
            + '<div class="dfm-giris" id="dfm-giris"><h2>🎯 OKÇULUK<br><span style="color:#FF6A1A">BİZİM HİKÂYEMİZ</span></h2><p>3 dakikalık film · sesi açın, büyük ekrana yansıtın</p><button class="dfm-buyuk" id="dfm-basla">▶ İzle</button></div>';
        document.body.appendChild(k);
        _cv = $('dfm-cv'); _c = _cv.getContext('2d'); boyutla(); durum.t = 0; durum.duraklat = true; durum.bitti = false; ciz(0);
        window.addEventListener('resize', boyutla); document.addEventListener('keydown', tus); document.addEventListener('visibilitychange', gizlenince);
        const tamEkran = () => { try { const r = k.requestFullscreen || k.webkitRequestFullscreen; if (r && !document.fullscreenElement && !document.webkitFullscreenElement) { const p = r.call(k); if (p && p.catch) p.catch(() => { }); } } catch (e) { } };
        $('dfm-basla').onclick = () => { $('dfm-giris').remove(); tamEkran(); konus(''); oynat(); k.classList.add('oynuyor'); setTimeout(boyutla, 300); };
        $('dfm-oynat').onclick = () => { durum.duraklat ? oynat() : duraklat(); };
        $('dfm-geri').onclick = () => sar(saat() - 10);
        $('dfm-cubuk').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); sar((e.clientX - r.left) / r.width * SURE); };
        $('dfm-anlatim').onclick = () => { durum.anlatim = !durum.anlatim; if (!durum.anlatim) try { speechSynthesis.cancel(); } catch (e) { } dugmeYaz(); };
        $('dfm-ses').onclick = () => { durum.ses = !durum.ses; if (master) master.gain.value = durum.ses ? .85 : 0; if (!durum.ses) try { speechSynthesis.cancel(); } catch (e) { } dugmeYaz(); };
        $('dfm-tam').onclick = () => { if (document.fullscreenElement || document.webkitFullscreenElement) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { } } else tamEkran(); setTimeout(boyutla, 300); };
        $('dfm-kapat').onclick = kapat; $('dfm-son-kapat').onclick = kapat; $('dfm-tekrar').onclick = () => { durum.t = 0; oynat(); };
        let _dz = null; k.addEventListener('pointerdown', () => { k.classList.add('dokundu'); clearTimeout(_dz); _dz = setTimeout(() => k.classList.remove('dokundu'), 3000); });
        document.addEventListener('fullscreenchange', () => setTimeout(boyutla, 100));
    }
    window.dagFilmAc = dagFilmAc;
    window._dfmIc = { hatalar: _hatalar, SURE, SAHNE, ANLATIM, bolum, sar: (t) => sar(t), ciz: (t) => ciz(t), durum };
})();
