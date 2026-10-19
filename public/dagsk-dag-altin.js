// 🏔 DAĞ TIRMANIŞI · "ALTIN SAAT" SAHNESİ (2026-10-20). 3B sürüm (dagsk-dag3d.js) için kullanıcı "görseller hâlâ çok kötü" dedi;
// iki tema taslağından A · Altın Saat'i seçti (https://claude.ai/artifact/CUN7huWQtLN1hfSwkSFCgA): gün batımında ışık/gölgeyle
// boyanmış dağ (Firewatch posteri tadında), karlı zirve, kıvrılan krem patika, kuşlar, ön planda çam silüetleri. Düz 2B tuval —
// zayıf tablette de akıcı, WebGL gerekmez. Oyunun KURALLARI app.js'te; bu dosya yalnız çizer (3B ile aynı arayüz):
//   dagskDagAltin(kap, api) → { kur(v), guncelle(v), ilerlet(i, eski, yeni, o, bitti), kapat() }
//   v = { sporcular:[{k, ad, kisa, renk, frac, img, oran, asili, ip}], cp:[frac], cpRenk:[renk|null], olay:{kestirme, tehlike, bonus}, ipAcik }
//   api = { sec(i), aktif() → aktif sporcu no, altKapali() → skor kutusunun alttan örttüğü px }
(function () {
    'use strict';
    const W = 1600, H = 1000, TEPE = { x: 800, y: 150 };
    const IP_RENK = ['#ffd166', '#5cc8ff', '#ff6b9a', '#7ee081', '#c39bff', '#ff9f43', '#4dd6c4', '#f8f8f8'];
    function rnd(seed) { let h = seed >>> 0; return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function sirt(n, seed, puruz) { const r = rnd(seed), a = []; for (let i = 0; i <= n; i++) a.push(0); let adim = n, gen = 1; a[0] = r() - .5; a[n] = r() - .5; while (adim > 1) { const y = adim / 2; for (let i = y; i < n; i += adim) a[i] = (a[i - y] + a[i + y]) / 2 + (r() - .5) * gen; adim = y; gen *= puruz; } return a; }
    function yolOlustur(fn, N) { const p = []; for (let i = 0; i <= N; i++) p.push(fn(i / N)); const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y)); return { p, L, top: L[L.length - 1] }; }
    function yolda(yol, f) { f = Math.max(0, Math.min(1, f)); const hedef = f * yol.top; let lo = 0, hi = yol.L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (yol.L[m] <= hedef) lo = m; else hi = m; } const t = (hedef - yol.L[lo]) / Math.max(1e-6, yol.L[hi] - yol.L[lo]); const a = yol.p[lo], b = yol.p[hi]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    const M = 520; // katman kenar payı: kamera kenara kayınca boşluk görünmesin
    function katman(w, h, olc, ciz) { const c = document.createElement('canvas'); c.width = (w + 2 * M) * olc; c.height = (h + 2 * M) * olc; const x = c.getContext('2d'); x.scale(olc, olc); x.translate(M, M); ciz(x); return c; }
    function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    // patika: dağın yüzünde serpantin (6 kıvrım), yukarıda daralır
    const YOL = yolOlustur(f => { const y = 930 - f * 745, yari = (y - 150) / 850 * 700; return { x: 780 + Math.sin(Math.PI * (f * 6 - .5)) * yari * .5 * (1 - f * .2), y }; }, 1000);
    function dagKenar(y, sag) { const t = (y - TEPE.y) / (H - TEPE.y); return TEPE.x + (sag ? 1 : -1) * (t * 760); }
    const S_SOL = sirt(64, 11, .55), S_SAG = sirt(64, 23, .55), OMURGA = sirt(32, 5, .6), KAR_S = sirt(40, 77, .65);
    function dagPoligon(x) {
        x.beginPath(); x.moveTo(-M, H + M); x.lineTo(-M, H + 30);
        for (let i = 0; i <= 64; i++) { const y = H + 20 - i / 64 * (H + 20 - TEPE.y); x.lineTo(dagKenar(y, false) + S_SOL[i] * 70 * (1 - i / 80), y + S_SOL[i] * 18); }
        x.lineTo(TEPE.x, TEPE.y);
        for (let i = 64; i >= 0; i--) { const y = H + 20 - i / 64 * (H + 20 - TEPE.y); x.lineTo(dagKenar(y, true) + S_SAG[i] * 70 * (1 - i / 80), y + S_SAG[i] * 18); }
        x.lineTo(W + M, H + 30); x.lineTo(W + M, H + M); x.closePath();
    }
    function omurgaYol(x, kapat) { for (let i = 0; i <= 32; i++) { const y = TEPE.y + i / 32 * (H - TEPE.y + 40); x.lineTo(TEPE.x + 40 * (i / 32) + OMURGA[i] * 90 * (i / 32 + .2), y); } if (kapat) { x.lineTo(W + 60, H + 60); x.lineTo(W + 60, -10); } }
    function camSil(x, px, py, en, boy, renk) { x.fillStyle = renk; x.beginPath(); for (let k = 0; k < 4; k++) { const y0 = py - boy * (k / 4), w = en * (1 - k / 5); x.moveTo(px - w, y0); x.lineTo(px, y0 - boy * .42); x.lineTo(px + w, y0); } x.fill(); x.fillRect(px - en * .08, py - 4, en * .16, 14); }

    window.dagskDagAltin = function (kap, api) {
        api = api || {};
        const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer;pointer-events:auto';
        const cx = cv.getContext('2d'); if (!cx) return null;
        kap.appendChild(cv);
        if (!document.getElementById('dag-altin-css')) { const st = document.createElement('style'); st.id = 'dag-altin-css'; st.textContent = '.km-dag3d{position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:inherit;pointer-events:none}.km-oyun-panel.d3 #km-oyun-svg-dag,.km-oyun-panel.d3 #km-oyun-kayalar-dag{visibility:hidden}.km-dag3d.sars canvas{animation:dagSars .45s linear}@keyframes dagSars{20%{transform:translate(4px,-3px)}40%{transform:translate(-5px,2px)}60%{transform:translate(3px,3px)}80%{transform:translate(-2px,-2px)}}@media (prefers-reduced-motion:reduce){.km-dag3d.sars canvas{animation:none}}'; document.head.appendChild(st); }
        const azHareket = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        const zayif = (navigator.hardwareConcurrency || 8) <= 4;
        const OLC = zayif ? 1.4 : 2;
        let V = { sporcular: [], cp: [], cpRenk: [], olay: {} }, S = [], durdu = false, raf = 0, T = 0, son = performance.now();
        let vw = 0, vh = 0, dpr = 1;
        const GENEL_Y = 430; // geniş planda zirve + bayrak her zaman görünsün (alt kısım skor kutusunun arkasında kalabilir)
        const cam = { x: W / 2, y: GENEL_Y, z: 1 }, hedef = { x: W / 2, y: GENEL_Y, z: 1 };
        function boyut() { const r = kap.getBoundingClientRect(); if (!r.width || !r.height) return; dpr = Math.min(zayif ? 1.5 : 2, window.devicePixelRatio || 1); vw = r.width; vh = r.height; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
        const ro = new ResizeObserver(boyut); ro.observe(kap); boyut();
        // ---- sabit katmanlar (bir kez çizilir)
        const UZAK = [{ renk: '#e79a87', y: 610, gen: 120, seed: 3, kat: .15 }, { renk: '#c9727a', y: 650, gen: 150, seed: 7, kat: .25 }, { renk: '#9c5272', y: 700, gen: 170, seed: 13, kat: .38 }, { renk: '#6d3863', y: 760, gen: 150, seed: 19, kat: .55 }];
        const uzakK = UZAK.map(u => katman(W, H, OLC * .6, x => { const s = sirt(128, u.seed, .58); x.beginPath(); x.moveTo(-M, H); for (let i = 0; i <= 128; i++) x.lineTo(-M + i / 128 * (W + 2 * M), u.y - (s[i] + .5) * u.gen - Math.sin(i / 128 * Math.PI * 2 + u.seed) * u.gen * .35); x.lineTo(W + M, H + M); x.lineTo(-M, H + M); x.closePath(); const g = x.createLinearGradient(0, u.y - u.gen * 1.2, 0, H); g.addColorStop(0, u.renk); g.addColorStop(1, '#3a1f40'); x.fillStyle = g; x.fill(); }));
        let dunya = null;
        function dunyaCiz() {
            const o = V.olay || {};
            dunya = katman(W, H, OLC, x => {
                dagPoligon(x); let g = x.createLinearGradient(0, TEPE.y, 0, H); g.addColorStop(0, '#6a3460'); g.addColorStop(1, '#2c1430'); x.fillStyle = g; x.fill();
                x.save(); dagPoligon(x); x.clip(); x.beginPath(); x.moveTo(-60, -10); x.lineTo(TEPE.x, TEPE.y); omurgaYol(x, false); x.lineTo(-60, H + 60); x.closePath();
                g = x.createLinearGradient(0, TEPE.y, 600, H); g.addColorStop(0, '#ffb877'); g.addColorStop(.45, '#e0764f'); g.addColorStop(1, '#7d3446'); x.fillStyle = g; x.fill();
                const r = rnd(42); x.lineCap = 'round';
                for (let i = 0; i < 70; i++) { const y = 260 + r() * 700, xs = 200 + r() * 1200, l = 30 + r() * 120; x.strokeStyle = r() < .5 ? 'rgba(60,20,40,.28)' : 'rgba(255,220,180,.16)'; x.lineWidth = 2 + r() * 2; x.beginPath(); x.moveTo(xs, y); x.quadraticCurveTo(xs + l / 2, y - 6 - r() * 10, xs + l, y + r() * 8); x.stroke(); }
                x.beginPath(); x.moveTo(TEPE.x, TEPE.y - 2);
                for (let i = 0; i <= 40; i++) { const t = i / 40, y = 360 + KAR_S[i] * 70 + Math.sin(t * 18) * 14; x.lineTo(dagKenar(y, false) + (dagKenar(y, true) - dagKenar(y, false)) * t, y); }
                x.closePath(); x.save(); x.clip();
                g = x.createLinearGradient(0, TEPE.y, 0, 430); g.addColorStop(0, '#fff8ee'); g.addColorStop(1, '#ffd9bd'); x.fillStyle = g; x.fillRect(0, 0, W, H);
                x.beginPath(); x.moveTo(TEPE.x, TEPE.y); omurgaYol(x, true); x.closePath(); g = x.createLinearGradient(TEPE.x, TEPE.y, 1100, 420); g.addColorStop(0, '#c7aee0'); g.addColorStop(1, '#8c6fb3'); x.fillStyle = g; x.fill();
                x.restore(); x.restore();
                // kestirme: patikanın iki kıvrımını birleştiren altın sabit ip
                if (o.kestirme) { const a = yolda(YOL, o.kestirme.bas), b = yolda(YOL, o.kestirme.son); x.strokeStyle = 'rgba(255,209,102,.9)'; x.lineWidth = 4; x.setLineDash([10, 8]); x.beginPath(); x.moveTo(a.x, a.y - 4); x.quadraticCurveTo((a.x + b.x) / 2 + 30, (a.y + b.y) / 2 + 10, b.x, b.y - 4); x.stroke(); x.setLineDash([]); }
                x.lineJoin = x.lineCap = 'round';
                x.beginPath(); YOL.p.forEach((q, i) => i ? x.lineTo(q.x, q.y + 4) : x.moveTo(q.x, q.y + 4)); x.strokeStyle = 'rgba(40,10,30,.45)'; x.lineWidth = 15; x.stroke();
                x.beginPath(); YOL.p.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.strokeStyle = '#ffe2bd'; x.lineWidth = 9; x.stroke();
                x.setLineDash([2, 14]); x.strokeStyle = 'rgba(150,80,60,.6)'; x.lineWidth = 3; x.stroke(); x.setLineDash([]);
                if (o.tehlike) { x.beginPath(); for (let f = o.tehlike.bas; f <= o.tehlike.son + 1e-6; f += .002) { const q = yolda(YOL, f); f === o.tehlike.bas ? x.moveTo(q.x, q.y) : x.lineTo(q.x, q.y); } x.strokeStyle = '#bfe8ff'; x.lineWidth = 11; x.stroke(); }
                const ra = rnd(9);
                for (let i = 0; i < 110; i++) { const sol = i % 2, px = sol ? ra() * (360 + M) - M : W - ra() * (360 + M) + M, py = H - ra() * 120, s = .6 + ra() * 1.2; camSil(x, px, py + 20, 34 * s, 120 * s, '#2a1230'); }
            });
        }
        const kus = Array.from({ length: 7 }, (_, i) => ({ x: 200 + i * 60, y: 260 + (i % 3) * 30, v: 30 + i * 3, f: i }));
        const toz = Array.from({ length: zayif ? 50 : 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 10 + Math.random() * 25, r: .8 + Math.random() * 1.8 }));
        // ---- karakter resimleri
        const resim = {};
        function img(src) { if (!src) return null; if (!resim[src]) { const im = new Image(); im.src = src; resim[src] = im; } return resim[src]; }
        // ---- konumlar
        function konum(i, frac) {
            const n = Math.max(1, S.length);
            if (frac >= 1) { const sira = S.filter(s => s.frac >= 1).indexOf(S[i]); return { x: TEPE.x - 90 + ((sira < 0 ? i : sira) % 8) * 26, y: TEPE.y + 8 + Math.floor((sira < 0 ? 0 : sira) / 8) * 20 }; }
            const f = Math.max(0, Math.min(.995, frac + (i - (n - 1) / 2) * Math.min(.006, .06 / n)));
            return yolda(YOL, f);
        }
        let P = [];
        function patlat(q, n, renkler, guc) { if (azHareket) n = Math.ceil(n / 4); for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = (guc || 200) * (.4 + Math.random() * .6); P.push({ x: q.x, y: q.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, o: 1 + Math.random() * .6, r: 2 + Math.random() * 3, c: renkler[k % renkler.length] }); } }
        function kar(q) { const n = azHareket ? 30 : 140; for (let k = 0; k < n; k++) P.push({ x: q.x + (Math.random() - .5) * 160, y: q.y - 80 - Math.random() * 80, vx: 60 + Math.random() * 120, vy: 40 + Math.random() * 80, o: 1.4 + Math.random(), r: 2 + Math.random() * 3.5, c: Math.random() < .5 ? '#ffffff' : '#d6ecff', yumusak: true }); }
        function sars() { kap.classList.remove('sars'); void kap.offsetWidth; kap.classList.add('sars'); setTimeout(() => kap.classList.remove('sars'), 500); }
        function kameraYakin(q, z) { hedef.x = q.x; hedef.y = q.y - 40; hedef.z = z; }
        function kameraGenel() { hedef.x = W / 2; hedef.y = GENEL_Y; hedef.z = 1; }
        // ---- çizim döngüsü
        function ciz(now) {
            if (durdu) return;
            if (!kap.isConnected) return kapat();
            raf = requestAnimationFrame(ciz);
            const dt = Math.min(.05, (now - son) / 1000); son = now;
            if (!kap.offsetWidth || document.hidden) return;
            if (!vw) boyut(); if (!vw || !dunya) return;
            T += dt;
            const k = azHareket ? 1 : Math.min(1, dt * 3); cam.x += (hedef.x - cam.x) * k; cam.y += (hedef.y - cam.y) * k; cam.z += (hedef.z - cam.z) * k;
            const x = cx; x.setTransform(dpr, 0, 0, dpr, 0, 0);
            // gökyüzü + güneş + ince bulut şeritleri
            let g = x.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#24163f'); g.addColorStop(.35, '#6b2f63'); g.addColorStop(.62, '#e1684d'); g.addColorStop(.8, '#ffb15e'); g.addColorStop(1, '#ffd58a'); x.fillStyle = g; x.fillRect(0, 0, vw, vh);
            const sx = vw * .72, sy = vh * .6; g = x.createRadialGradient(sx, sy, 0, sx, sy, vh * .45); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(.12, 'rgba(255,214,140,.85)'); g.addColorStop(.13, 'rgba(255,190,120,.45)'); g.addColorStop(1, 'rgba(255,150,90,0)'); x.fillStyle = g; x.fillRect(0, 0, vw, vh);
            x.fillStyle = 'rgba(255,230,210,.18)'; for (let i = 0; i < 4; i++) { const y = vh * (.22 + i * .07); x.fillRect(0, y + Math.sin(T * .1 + i) * 4, vw, 2 + i); }
            // skor kutusu alttan örtüyorsa sahneyi yukarı kaydır, biraz küçült
            const alt = api.altKapali ? Math.max(0, Math.min(vh * .5, api.altKapali() || 0)) : 0;
            const fit = Math.min(vw / (W * .88), (vh - alt * .3) / (H - 170)), merkezY = (vh - alt * .45) / 2;
            const ekran = (kat) => { const s = fit * (1 + (cam.z - 1) * kat), mx = W / 2 + (cam.x - W / 2) * kat, my = GENEL_Y + (cam.y - GENEL_Y) * kat; x.setTransform(dpr * s, 0, 0, dpr * s, dpr * (vw / 2 - mx * s), dpr * (merkezY - my * s)); };
            UZAK.forEach((u, i) => { ekran(u.kat); x.drawImage(uzakK[i], -M, -M, W + 2 * M, H + 2 * M); });
            ekran(1); x.drawImage(dunya, -M, -M, W + 2 * M, H + 2 * M);
            // kuşlar + ışık tozları
            x.strokeStyle = 'rgba(40,15,40,.7)'; x.lineWidth = 2.4; x.lineCap = 'round';
            kus.forEach(b => { b.x += b.v * dt; if (b.x > W + 80) b.x = -80; const kk = Math.sin(T * 8 + b.f) * 6; x.beginPath(); x.moveTo(b.x - 9, b.y - kk); x.quadraticCurveTo(b.x - 4, b.y - 6, b.x, b.y); x.quadraticCurveTo(b.x + 4, b.y - 6, b.x + 9, b.y - kk); x.stroke(); });
            x.fillStyle = 'rgba(255,236,210,.55)';
            toz.forEach(p => { p.y += p.v * dt; p.x += Math.sin(T + p.y * .01) * .3; if (p.y > H) { p.y = -10; p.x = Math.random() * W; } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); });
            // kamplar
            (V.cp || []).forEach((f, i) => { const q = yolda(YOL, f); kampCiz(x, { x: q.x + 10, y: q.y - 2 }, i, (V.cpRenk || [])[i]); });
            const o = V.olay || {};
            if (typeof o.bonus === 'number') { const bq = yolda(YOL, o.bonus); x.save(); x.translate(bq.x, bq.y - 40 + Math.sin(T * 3) * 4); x.scale(Math.cos(T * 2.5), 1); x.fillStyle = '#ffd23f'; x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke(); x.restore(); }
            if (o.tehlike) { const tq = yolda(YOL, (o.tehlike.bas + o.tehlike.son) / 2); x.save(); x.translate(tq.x, tq.y - 52); x.fillStyle = '#ffd400'; x.strokeStyle = '#2b1a10'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -16); x.lineTo(16, 12); x.lineTo(-16, 12); x.closePath(); x.fill(); x.stroke(); x.font = '14px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.fillText('❄️', 0, 9); x.restore(); }
            if (o.kestirme) { const kq = yolda(YOL, (o.kestirme.bas + o.kestirme.son) / 2); x.font = '22px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.fillText('🧗', kq.x + 40, kq.y - 20); }
            // zirve bayrağı
            x.strokeStyle = '#fff3e2'; x.lineWidth = 4; x.beginPath(); x.moveTo(TEPE.x, TEPE.y + 10); x.lineTo(TEPE.x, TEPE.y - 60); x.stroke(); x.fillStyle = '#e63946'; x.beginPath(); x.moveTo(TEPE.x, TEPE.y - 60); for (let i = 0; i <= 10; i++) x.lineTo(TEPE.x + i * 4.5, TEPE.y - 60 + Math.sin(T * 6 - i * .7) * 3 * i / 10 + i * .4); x.lineTo(TEPE.x + 45, TEPE.y - 30); for (let i = 10; i >= 0; i--) x.lineTo(TEPE.x + i * 4.5, TEPE.y - 34 + Math.sin(T * 6 - i * .7) * 3 * i / 10); x.closePath(); x.fill();
            // ip takımları
            if (V.ipAcik) {
                const gr = {}; V.sporcular.forEach((s, i) => { if (s.ip != null && s.ip >= 0) (gr[s.ip] = gr[s.ip] || []).push(i); });
                Object.keys(gr).forEach(no => { const u = gr[no]; for (let a = 0; a < u.length - 1; a++) { const A = S[u[a]], B = S[u[a + 1]]; if (!A || !B) continue; const fa = A.anlik != null ? A.anlik : A.frac, fb = B.anlik != null ? B.anlik : B.frac, lo = Math.min(fa, fb), hi = Math.min(1, Math.max(fa, fb)), n = Math.max(2, Math.round((hi - lo) * 160));
                    x.beginPath(); for (let k2 = 0; k2 <= n; k2++) { const q = yolda(YOL, lo + (hi - lo) * k2 / n); const yy = q.y - 26 + Math.sin(Math.PI * k2 / n) * 6; k2 ? x.lineTo(q.x, yy) : x.moveTo(q.x, yy); }
                    const rk = IP_RENK[no % IP_RENK.length]; x.strokeStyle = rk; x.globalAlpha = .25; x.lineWidth = 8; x.stroke(); x.globalAlpha = 1; x.lineWidth = 3; x.stroke(); } });
            }
            // sporcular (yukarıdakiler arkada)
            const ai = api.aktif ? api.aktif() : -1;
            const sira = S.map((s, i) => i).sort((p, q) => konum(p, S[p].anlik != null ? S[p].anlik : S[p].frac).y - konum(q, S[q].anlik != null ? S[q].anlik : S[q].frac).y);
            const n = S.length, buyut = Math.max(1, Math.min(1.7, 1.7 / Math.max(1, cam.z))), boy = (n > 14 ? 50 : n > 9 ? 56 : 64) * buyut;
            sira.forEach(i => {
                const s = S[i], q = konum(i, s.anlik != null ? s.anlik : s.frac), im = img(s.img), en = im && im.naturalWidth ? boy * im.naturalWidth / im.naturalHeight : boy * (s.oran || 1);
                s.sallan += ((s.asili ? 1 : 0) - s.sallan) * Math.min(1, dt * 3);
                let ox = 0, oy = -Math.abs(Math.sin(T * 2 + i)) * 2 - (s.hop || 0), don = 0;
                if (s.sallan > .02) { const sal = Math.sin(T * 2.4 + i) * .35; ox = Math.sin(sal) * 26 * s.sallan; oy = 46 * s.sallan; don = -sal * .7 * s.sallan; x.strokeStyle = '#ffe9c7'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(q.x, q.y - 4); x.lineTo(q.x + ox, q.y + oy - boy + 6); x.stroke(); }
                if (i === ai) { x.strokeStyle = s.renk; x.lineWidth = 4; x.globalAlpha = .55 + Math.sin(T * 5) * .3; x.beginPath(); x.ellipse(q.x, q.y + 2, 30, 9, 0, 0, 7); x.stroke(); x.globalAlpha = 1; }
                x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(q.x, q.y + 2, 20, 6, 0, 0, 7); x.fill();
                x.save(); x.translate(q.x + ox, q.y + oy); x.rotate(don); x.shadowColor = 'rgba(255,170,90,.6)'; x.shadowBlur = 14;
                if (im && im.complete && im.naturalWidth) x.drawImage(im, -en / 2, -boy, en, boy); else { x.fillStyle = s.renk; x.beginPath(); x.arc(0, -boy / 2, boy / 3, 0, 7); x.fill(); }
                x.restore();
                // isim etiketi
                const akt = i === ai, fs = Math.round(15 * buyut); x.font = '900 ' + fs + 'px Nunito, system-ui, sans-serif'; const w = x.measureText(s.kisa).width + fs * 1.2, eh = fs * 1.5; x.fillStyle = akt ? s.renk : 'rgba(30,12,30,.8)'; rr(x, q.x + ox - w / 2, q.y + oy + 6, w, eh, eh / 2); x.fill(); x.strokeStyle = s.renk; x.lineWidth = 2 * buyut; x.stroke(); x.fillStyle = akt ? '#1e0e0a' : '#fff'; x.textAlign = 'center'; x.fillText(s.kisa, q.x + ox, q.y + oy + 6 + eh * .72);
                if (s.asili) { x.font = '900 18px Nunito, system-ui, sans-serif'; x.fillStyle = '#ff5a5f'; x.fillText('SOS', q.x + ox, q.y + oy - boy - 8 + Math.sin(T * 6) * 2); }
                s.ekran = { x: q.x + ox, y: q.y + oy - boy / 2 };
            });
            // parçacıklar
            P = P.filter(p => { p.o -= dt; if (p.yumusak) { p.vy += 20 * dt; } else p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.o <= 0) return false; x.globalAlpha = Math.min(1, p.o); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); x.globalAlpha = 1; return true; });
            // vinyet
            x.setTransform(dpr, 0, 0, dpr, 0, 0); g = x.createRadialGradient(vw / 2, vh / 2, vh * .3, vw / 2, vh / 2, vh * .9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,5,25,.45)'); x.fillStyle = g; x.fillRect(0, 0, vw, vh);
            s_ekranOlcek = { fit, merkezY, alt };
        }
        let s_ekranOlcek = { fit: 1, merkezY: 0 };
        function kampCiz(x, q, i, renk) {
            x.fillStyle = 'rgba(40,10,30,.35)'; x.beginPath(); x.ellipse(q.x + 22, q.y + 4, 22, 5, 0, 0, 7); x.fill();
            x.fillStyle = '#ffd7a0'; x.beginPath(); x.moveTo(q.x + 6, q.y + 2); x.lineTo(q.x + 22, q.y - 22); x.lineTo(q.x + 38, q.y + 2); x.fill();
            x.fillStyle = '#7d3446'; x.beginPath(); x.moveTo(q.x + 22, q.y - 22); x.lineTo(q.x + 38, q.y + 2); x.lineTo(q.x + 26, q.y + 2); x.fill();
            x.strokeStyle = '#ffe9d0'; x.lineWidth = 2; x.beginPath(); x.moveTo(q.x - 8, q.y); x.lineTo(q.x - 8, q.y - 40); x.stroke();
            x.fillStyle = renk || '#a06a8a'; x.beginPath(); x.moveTo(q.x - 8, q.y - 40); x.lineTo(q.x + 14, q.y - 33 + Math.sin(T * 5 + i) * 2); x.lineTo(q.x - 8, q.y - 26); x.fill();
            const fl = .6 + Math.sin(T * 9 + i) * .2, g = x.createRadialGradient(q.x - 20, q.y - 2, 0, q.x - 20, q.y - 2, 26); g.addColorStop(0, 'rgba(255,190,90,' + fl + ')'); g.addColorStop(1, 'rgba(255,120,60,0)'); x.fillStyle = g; x.fillRect(q.x - 46, q.y - 28, 52, 52);
            x.fillStyle = '#fff'; x.font = '900 13px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(String(i + 1), q.x - 8, q.y - 46);
        }
        raf = requestAnimationFrame(ciz);
        // dokun → sporcu seç
        function tik(e) {
            const r = cv.getBoundingClientRect(), o = s_ekranOlcek, s = o.fit * cam.z; const wx = cam.x + (e.clientX - r.left - vw / 2) / s, wy = cam.y + (e.clientY - r.top - o.merkezY) / s;
            let en = -1, ed = 60; S.forEach((p, i) => { if (!p.ekran) return; const d = Math.hypot(p.ekran.x - wx, p.ekran.y - wy); if (d < ed) { ed = d; en = i; } });
            if (en >= 0 && api.sec) api.sec(en);
        }
        cv.addEventListener('click', tik);
        // ---- dış arayüz
        function sporcuKur() { S = V.sporcular.map(s => ({ k: s.k, kisa: s.kisa, renk: s.renk, img: s.img, oran: s.oran, frac: s.frac, asili: !!s.asili, sallan: s.asili ? 1 : 0, anlik: null, hop: 0 })); V.sporcular.forEach(s => img(s.img)); }
        let olayAnahtar = '';
        function kur(v) { V = v || V; const ok = JSON.stringify(V.olay || {}); if (!dunya || ok !== olayAnahtar) { olayAnahtar = ok; dunyaCiz(); } sporcuKur(); }
        const anim = {};
        function guncelle(v) {
            V = v || V;
            if (V.sporcular.length !== S.length || V.sporcular.some((s, i) => !S[i] || S[i].k !== s.k)) return sporcuKur();
            V.sporcular.forEach((s, i) => { if (anim[i]) return; const o = S[i]; o.frac = s.frac; o.asili = !!s.asili; o.renk = s.renk; o.img = s.img; o.kisa = s.kisa; });
        }
        function bekle(t) { return new Promise(r => setTimeout(r, azHareket ? Math.min(t, 150) : t)); }
        function yuru(i, eski, yeni, sure) { const s = S[i]; return new Promise(r => { if (!s) return r(); const t0 = performance.now(); const adim = (now) => { if (durdu) return r(); const e = Math.min(1, (now - t0) / sure), ee = e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2; s.anlik = eski + (yeni - eski) * ee; s.hop = Math.abs(Math.sin(e * Math.PI * 8)) * 12 * (1 - e * .5); kameraYakin(konum(i, s.anlik), 1.65); if (e < 1) requestAnimationFrame(adim); else { s.anlik = null; s.hop = 0; s.frac = yeni; r(); } }; requestAnimationFrame(adim); }); }
        async function ilerlet(i, eski, yeni, o, bitti) {
            o = o || {}; let bitti1 = false; const bit = () => { if (bitti1) return; bitti1 = true; try { bitti && bitti(); } catch (e) {} };
            const s = S[i]; if (!s || durdu) return bit();
            setTimeout(bit, 12000); // güvenlik: oyun kilitli kalmasın
            anim[i] = true;
            try {
                kameraYakin(konum(i, s.frac), 1.65); await bekle(600);
                const ip = o.ip || {};
                if (ip.tur === 'dusme' || ip.tur === 'asili') { s.asili = true; sars(); patlat(konum(i, s.frac), 30, ['#c9a27a', '#ffffff'], 160); await bekle(1700); }
                else {
                    if (ip.tur === 'toparlandi') s.asili = false;
                    const sure = Math.max(1100, Math.min(2400, Math.abs(yeni - eski) * 9000 + 900));
                    const ol = o.olaylar || [];
                    if (ol.indexOf('tehlike') !== -1 || ol.indexOf('tehlike-atlatti') !== -1) setTimeout(() => { kar(konum(i, s.anlik != null ? s.anlik : s.frac)); if (ol.indexOf('tehlike') !== -1) sars(); }, sure * .5);
                    if (ol.indexOf('kestirme') !== -1) patlat(konum(i, s.frac), 60, ['#ffd166', '#fff3c4'], 220);
                    await yuru(i, eski, yeni, sure);
                    const q = konum(i, yeni);
                    patlat({ x: q.x, y: q.y - 30 }, o.iyi ? 90 : 40, [s.renk, '#ffffff'], o.iyi ? 260 : 180);
                    if (ol.indexOf('bonus') !== -1) patlat({ x: q.x, y: q.y - 60 }, 70, ['#ffd23f', '#ffffff'], 220);
                    if (o.cp) patlat({ x: q.x, y: q.y - 60 }, 100, [s.renk, '#ffd23f', '#ffffff'], 280);
                    if (o.zirve) { kameraYakin(TEPE, 1.8); for (let k = 0; k < 8; k++) { patlat({ x: TEPE.x + (Math.random() - .5) * 420, y: TEPE.y - 60 - Math.random() * 120 }, 70, [['#ffd23f', '#fff3c4'], ['#ff5d8f', '#ffd2e0'], ['#4cc9f0', '#d6f1ff']][k % 3], 260); await bekle(320); } }
                    await bekle(o.cp ? 900 : 600);
                    if (ip.tur === 'kurtarma' && S[ip.ortakI]) {
                        const p2 = S[ip.ortakI]; anim[ip.ortakI] = true;
                        kameraYakin(konum(ip.ortakI, p2.frac), 1.65); await bekle(700);
                        p2.asili = false; patlat(konum(ip.ortakI, p2.frac), 70, ['#7ee081', '#ffffff', '#ffd23f'], 220);
                        await yuru(ip.ortakI, ip.ortakEski, ip.ortakYeni, 900); anim[ip.ortakI] = false; await bekle(500);
                    }
                }
            } catch (e) {}
            anim[i] = false; s.frac = yeni; kameraGenel(); bit();
        }
        function kapat() { if (durdu) return; durdu = true; cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener('click', tik); cv.remove(); }
        return { kur, guncelle, ilerlet, kapat };
    };
})();
