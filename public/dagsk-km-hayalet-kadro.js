/* ================================================================================================
   🎭 HAYALET KADROSU — Hayalet Avcıları 2.0 çizimleri (v467, 2026-11-26). Kullanıcı: "diğer oyunu da geliştir hayaleti" (Dedektif'teki
   "hep aynı karakterler, zorluğu o kadar değildi" ile aynı dert). dagsk-km-hayalet.js'ten ÖNCE yüklenir; yalnız çizer, durum tutmaz.
     HYLK.LISTE  32 hayalet {id, ad, tur, r, sekil, goz, agiz, aks[]} · tur: beyaz | zirh (birkaç kez vurulur) | hirsiz (kaçarken kavanoz açar)
     HYLK.BOS    4 patron (sezona göre)   HYLK.ciz(x, h, t, op)  merkez 0,0 (gövde ±40) · op: korku, mutlu, konus, can, canTop, kirik
     HYLK.ESYA   yeni eşyalar + adları    HYLK.esya(x, e, t, Z)  true dönerse çizdi   HYLK.dekor(x, id, t)  odanın hareketli süsü
     HYLK.yakala(x, tip, u, t)  yakalama efekti (isin / ag / supurge), u 0..1
   ================================================================================================ */
(function () {
    'use strict';
    const KOYU = '#1a1630';
    function yuv(x, a, b, w, h, r) { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function el(x, a, b, rx, ry, rot) { x.beginPath(); x.ellipse(a, b, rx, ry == null ? rx : ry, rot || 0, 0, 7); }
    function boya(x, r, k) { x.fillStyle = r; x.fill(); if (k !== 0) { x.strokeStyle = KOYU; x.lineWidth = k || 3; x.lineJoin = 'round'; x.stroke(); } }
    function koyu(hex, p) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, v + p)); return '#' + ((1 << 24) + (f(n >> 16) << 16) + (f(n >> 8 & 255) << 8) + f(n & 255)).toString(16).slice(1); }
    const H = (id, ad, tur, r, sekil, goz, agiz, aks) => ({ id, ad, tur, r, sekil, goz, agiz, aks: aks || [] });
    const LISTE = [
        H('mirmir', 'Mırmır', 'beyaz', '#f6f1ff', 'klasik', 'yuvarlak', 'kedi', ['kedikulak']), H('fisfis', 'Fısfıs', 'beyaz', '#c9f2ff', 'uzun', 'oval', 'o', []),
        H('tombik', 'Tombik', 'beyaz', '#ffe6f2', 'tombul', 'yuvarlak', 'gulen', ['yanak']), H('horhor', 'Horhor', 'beyaz', '#d8dcff', 'tombul', 'uykulu', 'o', ['uykusapka']),
        H('biyikbey', 'Bıyık Bey', 'beyaz', '#f2f6ff', 'klasik', 'oval', 'yok', ['silindir', 'biyik']), H('profesor', 'Profesör Vu', 'beyaz', '#dcffe8', 'klasik', 'yuvarlak', 'duz', ['gozluk', 'dikSac']),
        H('cicek', 'Çiçek', 'beyaz', '#ffd9ec', 'damla', 'yuvarlak', 'gulen', ['cicek', 'yanak']), H('fiyonk', 'Fiyonk', 'beyaz', '#ffeef6', 'klasik', 'kirpik', 'gulen', ['fiyonk']),
        H('djvuu', 'DJ Vuu', 'beyaz', '#c8b8ff', 'klasik', 'gunes', 'gulen', ['kulaklik']), H('buzcuk', 'Buzcuk', 'beyaz', '#b8ecff', 'dikenli', 'oval', 'dis', []),
        H('alev', 'Alev Topu', 'beyaz', '#ffb45a', 'alev', 'kizgin', 'dis', []), H('jole', 'Jöle', 'beyaz', '#8ff0a8', 'tombul', 'tek', 'gulen', []),
        H('damla', 'Damla', 'beyaz', '#7fc8ff', 'damla', 'oval', 'o', []), H('balon', 'Balon', 'beyaz', '#ff9aa8', 'balon', 'yuvarlak', 'gulen', ['ip']),
        H('yildiz', 'Yıldız Tozu', 'beyaz', '#fff0a0', 'klasik', 'yildiz', 'gulen', ['hale']), H('tekgoz', 'Tepegöz', 'beyaz', '#d8f08a', 'uzun', 'tek', 'dis', ['boynuz']),
        H('pit', 'Palyaço Pıt', 'beyaz', '#ffffff', 'klasik', 'yuvarlak', 'gulen', ['palyaco']), H('dalgic', 'Dalgıç Blup', 'beyaz', '#a8f0e8', 'klasik', 'oval', 'o', ['dalgic']),
        H('astro', 'Astro', 'beyaz', '#e8eeff', 'klasik', 'oval', 'gulen', ['astro']), H('sihir', 'Hokus', 'beyaz', '#e0c8ff', 'uzun', 'oval', 'gulen', ['cadi']),
        H('sef', 'Aşçı Duman', 'beyaz', '#fff6e0', 'tombul', 'oval', 'gulen', ['sef', 'biyik']), H('dili', 'Dilli', 'beyaz', '#ffc8a0', 'klasik', 'yuvarlak', 'dil', []),
        H('ejdo', 'Ejdo', 'beyaz', '#a0e070', 'klasik', 'kizgin', 'dis', ['boynuz', 'kanat']), H('yarasa', 'Yarasacık', 'beyaz', '#9a8ac8', 'klasik', 'yuvarlak', 'dis', ['kedikulak', 'kanat']),
        H('migfer', 'Miğfer', 'zirh', '#dfe6f2', 'klasik', 'kizgin', 'duz', ['migfer']), H('kazankafa', 'Kazan Kafa', 'zirh', '#e8ead8', 'tombul', 'oval', 'dis', ['kazan']),
        H('kalkan', 'Kalkan Kaya', 'zirh', '#c8d0c0', 'dikenli', 'kizgin', 'duz', ['kalkan']), H('demir', 'Demir Dobi', 'zirh', '#b8c4d8', 'tombul', 'tek', 'duz', ['percin']),
        H('maskeli', 'Maskeli', 'hirsiz', '#ece6ff', 'klasik', 'oval', 'gulen', ['maske', 'cuval']), H('kanca', 'Korsan Kanca', 'hirsiz', '#ffe0d0', 'klasik', 'oval', 'dis', ['korsan', 'cuval']),
        H('ninja', 'Ninja Sis', 'hirsiz', '#8a94b8', 'uzun', 'kizgin', 'yok', ['ninja', 'cuval']), H('pelerin', 'Kara Pelerin', 'hirsiz', '#d0d8f0', 'damla', 'oval', 'dis', ['pelerin', 'cuval'])
    ];
    const BOS = [
        H('kral', 'Hayalet Kral', 'bos', '#e8d8ff', 'tombul', 'kizgin', 'dis', ['tac', 'sakal']), H('kaptan', 'Kaptan Kemik', 'bos', '#ffe8d0', 'klasik', 'kizgin', 'dis', ['kaptan', 'sakal']),
        H('kontes', 'Cadı Kontes', 'bos', '#e0a8ff', 'uzun', 'kirpik', 'dis', ['cadi', 'kanat']), H('kabak', 'Dev Balkabağı', 'bos', '#ff9a3a', 'balkabagi', 'ucgen', 'dis', ['sap'])
    ];
    const TUR = { beyaz: { ad: 'Hayalet', ik: '👻', k: 'bir iyi ok yakalar' }, zirh: { ad: 'Zırhlı', ik: '🛡️', k: 'kalpleri bitene kadar vur' }, hirsiz: { ad: 'Kavanoz hırsızı', ik: '🎒', k: 'zayıf okta kaçar, bir kavanozu da açar' } };
    function bul(id) { return LISTE.find((h) => h.id === id) || BOS.find((h) => h.id === id) || LISTE[0]; }

    function govde(x, sek, t) {
        const d = Math.sin(t / 300) * 4, etek = (w, y) => { for (let k = 0; k < 4; k++) { const a = w - k * w / 2; x.quadraticCurveTo(a - w / 4, y + 16 + (k % 2 ? d : -d), a - w / 2, y); } };
        x.beginPath();
        if (sek === 'tombul') { x.moveTo(-48, 30); x.quadraticCurveTo(-58, -46, 0, -46); x.quadraticCurveTo(58, -46, 48, 30); etek(48, 30); }
        else if (sek === 'uzun') { x.moveTo(-32, 34); x.lineTo(-32, -26); x.arc(0, -26, 32, Math.PI, 0); x.lineTo(32, 34); etek(32, 34); }
        else if (sek === 'damla') { x.moveTo(-40, 14); x.quadraticCurveTo(-40, -18, 0, -64); x.quadraticCurveTo(40, -18, 40, 14); x.quadraticCurveTo(38, 44, 0, 44 + d); x.quadraticCurveTo(-38, 44, -40, 14); }
        else if (sek === 'balon') { x.ellipse(0, -10, 42, 48, 0, 0, 7); }
        else if (sek === 'balkabagi') { x.ellipse(0, -4, 52, 44, 0, 0, 7); }
        else if (sek === 'alev') { x.moveTo(-40, 30); x.quadraticCurveTo(-52, -10, -24, -40); x.quadraticCurveTo(-20, -24, -10, -30); x.quadraticCurveTo(-8, -54, 8, -70 + d); x.quadraticCurveTo(6, -44, 20, -36); x.quadraticCurveTo(28, -42, 28, -52); x.quadraticCurveTo(52, -14, 40, 30); etek(40, 30); }
        else if (sek === 'dikenli') { x.moveTo(-40, 30); x.lineTo(-40, -6); x.lineTo(-50, -20); x.lineTo(-32, -28); x.lineTo(-34, -48); x.lineTo(-14, -42); x.lineTo(0, -60); x.lineTo(14, -42); x.lineTo(34, -48); x.lineTo(32, -28); x.lineTo(50, -20); x.lineTo(40, -6); x.lineTo(40, 30); etek(40, 30); }
        else { x.moveTo(-40, 30); x.lineTo(-40, -10); x.arc(0, -10, 40, Math.PI, 0); x.lineTo(40, 30); etek(40, 30); }
        x.closePath();
    }
    function gozCiz(x, g, t, op) {
        const kirp = Math.sin(t / 850) > .975 ? .12 : 1, bk = Math.sin(t / 1200) * 2.5, b = op.korku ? 1.25 : 1;
        const beyazGoz = (dx, r) => { el(x, dx, -12, r * b, r * b * kirp); boya(x, '#fff', 2.5); if (kirp > .5) { x.fillStyle = KOYU; x.beginPath(); x.arc(dx + bk, -11, r * (op.korku ? .35 : .5), 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(dx + bk + 2, -14, r * .18, 0, 7); x.fill(); } };
        if (g === 'yuvarlak') { beyazGoz(-15, 12); beyazGoz(15, 12); }
        else if (g === 'tek') beyazGoz(0, 20);
        else if (g === 'kirpik') { beyazGoz(-15, 11); beyazGoz(15, 11); x.strokeStyle = KOYU; x.lineWidth = 2.5; [-1, 1].forEach((s) => { [0, 6].forEach((k) => { x.beginPath(); x.moveTo(s * (20 + k / 2), -20 + k); x.lineTo(s * (27 + k / 2), -26 + k * 1.4); x.stroke(); }); }); }
        else if (g === 'uykulu') { x.strokeStyle = KOYU; x.lineWidth = 4; x.lineCap = 'round'; if (op.korku) { beyazGoz(-15, 11); beyazGoz(15, 11); } else { [-15, 15].forEach((d) => { x.beginPath(); x.arc(d, -14, 9, .2, Math.PI - .2); x.stroke(); }); const z = (t / 1500) % 1, a0 = x.globalAlpha; x.globalAlpha = a0 * (1 - z); x.font = '900 18px sans-serif'; x.textAlign = 'center'; x.fillStyle = '#8ad0ff'; x.fillText('z', 34 + z * 14, -34 - z * 28); x.globalAlpha = a0; } }
        else if (g === 'gunes') { x.fillStyle = KOYU; yuv(x, -30, -22, 26, 18, 7); x.fill(); yuv(x, 4, -22, 26, 18, 7); x.fill(); x.fillRect(-6, -20, 12, 5); x.fillStyle = 'rgba(255,90,200,.75)'; yuv(x, -27, -19, 20, 12, 5); x.fill(); x.fillStyle = 'rgba(90,220,255,.75)'; yuv(x, 7, -19, 20, 12, 5); x.fill(); }
        else if (g === 'yildiz') { [-15, 15].forEach((d) => { x.save(); x.translate(d, -12); x.rotate(Math.sin(t / 500) * .3); x.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 12; x.lineTo(Math.cos(k * Math.PI / 5 - Math.PI / 2) * r * b, Math.sin(k * Math.PI / 5 - Math.PI / 2) * r * b); } x.closePath(); boya(x, '#ff9a1a', 2); x.restore(); }); }
        else if (g === 'ucgen') { [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(s * 6, -4); x.lineTo(s * 32, -4); x.lineTo(s * 20, -28); x.closePath(); boya(x, '#fff2a0', 3); }); }
        else if (g === 'kizgin') { beyazGoz(-15, 11); beyazGoz(15, 11); x.strokeStyle = KOYU; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); if (op.korku) { x.moveTo(-28, -24); x.lineTo(-8, -31); x.moveTo(28, -24); x.lineTo(8, -31); } else { x.moveTo(-28, -31); x.lineTo(-7, -22); x.moveTo(28, -31); x.lineTo(7, -22); } x.stroke(); }
        else { x.fillStyle = KOYU; [-14, 14].forEach((d) => { el(x, d + bk * .6, -12, 7 * b, 10 * b * kirp); x.fill(); }); x.fillStyle = '#fff'; [-14, 14].forEach((d) => { x.beginPath(); x.arc(d + 2 + bk * .6, -16, 2.4, 0, 7); x.fill(); }); }
    }
    function agizCiz(x, a, t, op) {
        x.lineCap = 'round';
        if (op.korku || op.konus) { el(x, 0, 12, 9, op.konus ? 4 + Math.abs(Math.sin(t / 90)) * 8 : 9); boya(x, '#3a1a3a', 2); return; }
        if (a === 'yok') return;
        if (a === 'gulen') { x.beginPath(); x.arc(0, 4, 14, .15, Math.PI - .15); x.closePath(); boya(x, '#5a1a3a', 2.5); x.fillStyle = '#ff7a96'; el(x, 0, 14, 7, 3.5); x.fill(); }
        else if (a === 'dis') { x.beginPath(); x.moveTo(-18, 6); x.lineTo(18, 6); x.quadraticCurveTo(14, 22, 0, 22); x.quadraticCurveTo(-14, 22, -18, 6); x.closePath(); boya(x, '#4a1230', 2.5); x.fillStyle = '#fff'; [-12, -4, 4, 12].forEach((d) => { x.beginPath(); x.moveTo(d - 4, 7); x.lineTo(d + 4, 7); x.lineTo(d, 14); x.fill(); }); }
        else if (a === 'dil') { x.beginPath(); x.arc(0, 4, 14, 0, Math.PI); x.closePath(); boya(x, '#5a1a3a', 2.5); yuv(x, -7, 10, 14, 22 + Math.sin(t / 200) * 4, 7); boya(x, '#ff7a96', 2.5); }
        else if (a === 'kedi') { x.strokeStyle = KOYU; x.lineWidth = 3; x.beginPath(); x.arc(-5, 6, 5, 0, Math.PI); x.stroke(); x.beginPath(); x.arc(5, 6, 5, 0, Math.PI); x.stroke(); x.lineWidth = 2; [-1, 1].forEach((s) => { [0, 7].forEach((k) => { x.beginPath(); x.moveTo(s * 18, 4 + k); x.lineTo(s * 38, k * 1.6); x.stroke(); }); }); }
        else if (a === 'duz') { x.strokeStyle = KOYU; x.lineWidth = 4; x.beginPath(); x.moveTo(-11, 12); x.lineTo(11, 12); x.stroke(); }
        else { el(x, 0, 10, 8, 7 + Math.sin(t / 200) * 2); x.fillStyle = KOYU; x.fill(); }
    }
    function arka(x, h, t) { // gövdenin arkasında kalanlar
        if (h.aks.indexOf('kanat') !== -1) { const k = Math.sin(t / 130) * .25; [-1, 1].forEach((s) => { x.save(); x.translate(s * 34, -8); x.rotate(s * k); x.beginPath(); x.moveTo(0, 0); x.lineTo(s * 44, -30); x.lineTo(s * 40, -6); x.lineTo(s * 46, 10); x.lineTo(s * 26, 10); x.lineTo(0, 20); x.closePath(); boya(x, koyu(h.r, -50)); x.restore(); }); }
        if (h.aks.indexOf('pelerin') !== -1) { x.beginPath(); x.moveTo(-26, -34); x.quadraticCurveTo(-70 + Math.sin(t / 200) * 8, 10, -56, 52); x.lineTo(56, 52); x.quadraticCurveTo(70 + Math.sin(t / 200) * 8, 10, 26, -34); x.closePath(); boya(x, '#3a1440'); }
        if (h.aks.indexOf('cuval') !== -1) { x.save(); x.translate(44, 12); x.rotate(Math.sin(t / 400) * .1); el(x, 6, 12, 24, 26); boya(x, '#8a5a2a'); x.beginPath(); x.moveTo(-6, -10); x.lineTo(16, -10); x.lineTo(10, -20); x.lineTo(0, -20); x.closePath(); boya(x, '#a8703a', 2.5); x.restore(); }
        if (h.aks.indexOf('ip') !== -1) { x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, 38); x.quadraticCurveTo(Math.sin(t / 300) * 14, 54, 0, 72); x.stroke(); }
    }
    const AKS = {
        kedikulak: (x, h) => [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(s * 12, -46); x.lineTo(s * 36, -36); x.lineTo(s * 32, -66); x.closePath(); boya(x, h.r); }),
        yanak: (x) => { x.fillStyle = 'rgba(255,90,140,.4)'; [-28, 28].forEach((d) => { el(x, d, 2, 8, 5); x.fill(); }); },
        uykusapka: (x, h, t) => { x.beginPath(); x.moveTo(-36, -34); x.quadraticCurveTo(0, -84, 50, -56 + Math.sin(t / 500) * 5); x.quadraticCurveTo(30, -50, 36, -34); x.closePath(); boya(x, '#5a7ae0'); yuv(x, -40, -42, 80, 14, 7); boya(x, '#fff', 2.5); x.beginPath(); x.arc(52, -54 + Math.sin(t / 500) * 5, 9, 0, 7); boya(x, '#fff', 2.5); },
        silindir: (x) => { el(x, 0, -44, 40, 8); boya(x, '#23222c'); yuv(x, -24, -92, 48, 50, 5); boya(x, '#23222c'); x.fillStyle = '#b02a3a'; x.fillRect(-23, -58, 46, 9); },
        biyik: (x) => { x.beginPath(); x.moveTo(0, 2); x.bezierCurveTo(-12, -4, -22, 2, -30, -4); x.bezierCurveTo(-28, 14, -10, 14, 0, 8); x.bezierCurveTo(10, 14, 28, 14, 30, -4); x.bezierCurveTo(22, 2, 12, -4, 0, 2); x.closePath(); boya(x, '#3a2a24', 2); },
        gozluk: (x) => { x.strokeStyle = KOYU; x.lineWidth = 4; [-15, 15].forEach((d) => { x.beginPath(); x.arc(d, -12, 15, 0, 7); x.fillStyle = 'rgba(180,230,255,.3)'; x.fill(); x.stroke(); }); },
        dikSac: (x) => [-24, -12, 0, 12, 24].forEach((d, i) => { x.beginPath(); x.moveTo(d - 9, -40); x.lineTo(d * 1.5, -70 + Math.abs(i - 2) * 6); x.lineTo(d + 9, -40); x.closePath(); boya(x, '#fff', 2.5); }),
        cicek: (x, h, t) => { x.save(); x.translate(22, -42); x.rotate(Math.sin(t / 700) * .4); for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(Math.cos(k * 1.047) * 11, Math.sin(k * 1.047) * 11, 7, 0, 7); boya(x, '#ff5a96', 2); } x.beginPath(); x.arc(0, 0, 7, 0, 7); boya(x, '#ffd34a', 2); x.restore(); },
        fiyonk: (x) => { [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(0, -46); x.lineTo(s * 30, -62); x.lineTo(s * 30, -32); x.closePath(); boya(x, '#ff4a7a'); }); x.beginPath(); x.arc(0, -47, 8, 0, 7); boya(x, '#ff7a9a', 2.5); },
        kulaklik: (x) => { x.strokeStyle = KOYU; x.lineWidth = 8; x.beginPath(); x.arc(0, -10, 44, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); [-44, 44].forEach((d) => { yuv(x, d - 9, -26, 18, 32, 8); boya(x, '#ff3a8a'); }); },
        hale: (x, h, t) => { x.strokeStyle = '#ffc21a'; x.lineWidth = 6; x.beginPath(); x.ellipse(0, -66 + Math.sin(t / 400) * 3, 26, 8, 0, 0, 7); x.stroke(); },
        boynuz: (x) => [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(s * 10, -48); x.quadraticCurveTo(s * 26, -56, s * 24, -76); x.quadraticCurveTo(s * 40, -56, s * 26, -40); x.closePath(); boya(x, '#f4e2b0', 2.5); }),
        palyaco: (x) => { [-1, 1].forEach((s) => { [[38, -26], [46, -8]].forEach((p) => { x.beginPath(); x.arc(s * p[0], p[1], 14, 0, 7); boya(x, '#ff5a3a', 2.5); }); }); x.beginPath(); x.moveTo(-18, -46); x.lineTo(0, -88); x.lineTo(18, -46); x.closePath(); boya(x, '#3fb8e0'); x.beginPath(); x.arc(0, -88, 8, 0, 7); boya(x, '#ffd34a', 2.5); x.beginPath(); x.arc(0, 1, 9, 0, 7); boya(x, '#ff2a2a', 2.5); },
        dalgic: (x, h, t) => { x.strokeStyle = KOYU; x.lineWidth = 4; yuv(x, -32, -28, 64, 32, 14); x.fillStyle = 'rgba(80,200,255,.3)'; x.fill(); x.stroke(); x.strokeStyle = '#ff8a1a'; x.lineWidth = 8; x.beginPath(); x.moveTo(36, 8); x.lineTo(46, -10); x.lineTo(46, -62); x.stroke(); for (let k = 0; k < 3; k++) { const u = (t / 1400 + k / 3) % 1; x.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; x.lineWidth = 2; x.beginPath(); x.arc(48 + Math.sin(u * 9) * 6, -66 - u * 34, 4 + k, 0, 7); x.stroke(); } },
        astro: (x) => { x.strokeStyle = '#cfd8e8'; x.lineWidth = 8; x.beginPath(); x.arc(0, -10, 50, 0, 7); x.fillStyle = 'rgba(140,200,255,.18)'; x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 5; x.beginPath(); x.arc(0, -10, 40, 3.6, 4.4); x.stroke(); x.beginPath(); x.arc(46, -44, 7, 0, 7); boya(x, '#ff5a3a', 2.5); },
        cadi: (x, h, t) => { el(x, 0, -44, 48, 9); boya(x, '#2a1a4a'); x.beginPath(); x.moveTo(-28, -46); x.quadraticCurveTo(-8, -70, 12 + Math.sin(t / 600) * 4, -108); x.quadraticCurveTo(20, -76, 28, -46); x.closePath(); boya(x, '#3a2468'); x.fillStyle = '#ffc94a'; x.fillRect(-26, -56, 52, 8); },
        sef: (x) => { [-20, 0, 20].forEach((d) => { x.beginPath(); x.arc(d, -66, 18, 0, 7); boya(x, '#fff'); }); yuv(x, -28, -62, 56, 24, 4); boya(x, '#fff'); x.fillStyle = '#fff'; x.fillRect(-26, -70, 52, 20); },
        migfer: (x, h, t, op) => { if (op.kirik) return; x.beginPath(); x.moveTo(-44, 2); x.lineTo(-44, -14); x.arc(0, -14, 44, Math.PI, 0); x.lineTo(44, 2); x.lineTo(34, 2); x.lineTo(34, -24); x.lineTo(-34, -24); x.lineTo(-34, 2); x.closePath(); boya(x, '#8a96ac'); x.beginPath(); x.moveTo(-2, -56); x.quadraticCurveTo(14 + Math.sin(t / 300) * 5, -92, 36, -70); x.quadraticCurveTo(18, -66, 10, -54); x.closePath(); boya(x, '#e0405a', 2.5); },
        kazan: (x, h, t, op) => { if (op.kirik) return; yuv(x, -46, -66, 92, 40, 10); boya(x, '#4a4e5c'); yuv(x, -52, -34, 104, 10, 5); boya(x, '#6a7080', 2.5); },
        kalkan: (x, h, t, op) => { if (op.kirik) return; x.save(); x.translate(-26, 14); x.beginPath(); x.moveTo(0, -30); x.lineTo(26, -22); x.lineTo(22, 12); x.lineTo(0, 30); x.lineTo(-22, 12); x.lineTo(-26, -22); x.closePath(); boya(x, '#c8a050'); x.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14; x.lineTo(Math.cos(k * Math.PI / 5 - Math.PI / 2) * r, Math.sin(k * Math.PI / 5 - Math.PI / 2) * r); } x.closePath(); x.fillStyle = '#a8303a'; x.fill(); x.restore(); },
        percin: (x, h, t, op) => { if (op.kirik) return; yuv(x, -50, 16, 100, 18, 6); boya(x, '#7a869c'); yuv(x, -40, -50, 80, 16, 6); boya(x, '#7a869c'); x.fillStyle = '#3a4252'; [-34, -12, 12, 34].forEach((d) => { x.beginPath(); x.arc(d, 25, 3.5, 0, 7); x.fill(); x.beginPath(); x.arc(d * .9, -42, 3.5, 0, 7); x.fill(); }); },
        maske: (x) => { yuv(x, -38, -26, 76, 28, 13); x.fillStyle = '#17131c'; x.fill(); x.fillStyle = '#fff'; [-14, 14].forEach((d) => { el(x, d, -12, 8, 8); x.fill(); }); x.fillStyle = '#17131c'; [-14, 14].forEach((d) => { x.beginPath(); x.arc(d, -11, 4, 0, 7); x.fill(); }); },
        korsan: (x) => { x.beginPath(); x.moveTo(-48, -36); x.quadraticCurveTo(0, -84, 48, -36); x.quadraticCurveTo(0, -50, -48, -36); x.closePath(); boya(x, '#23222c'); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -56, 7, 0, 7); x.fill(); el(x, 14, -12, 12, 12); x.fillStyle = KOYU; x.fill(); x.strokeStyle = KOYU; x.lineWidth = 3; x.beginPath(); x.moveTo(-34, -28); x.lineTo(36, -2); x.stroke(); },
        ninja: (x, h, t) => { x.fillStyle = '#23263a'; x.fillRect(-31, 2, 62, 24); yuv(x, -34, -40, 68, 13, 4); boya(x, '#d23a32', 2.5); x.save(); x.translate(32, -34); x.rotate(Math.sin(t / 250) * .25); x.beginPath(); x.moveTo(0, -4); x.lineTo(34, -10); x.lineTo(28, 2); x.lineTo(36, 14); x.lineTo(0, 6); x.closePath(); boya(x, '#d23a32', 2.5); x.restore(); },
        tac: (x) => { x.beginPath(); x.moveTo(-32, -42); x.lineTo(-36, -76); x.lineTo(-16, -58); x.lineTo(0, -84); x.lineTo(16, -58); x.lineTo(36, -76); x.lineTo(32, -42); x.closePath(); boya(x, '#ffc94a'); ['#ff3a5a', '#3a9aff', '#3ad88a'].forEach((r, i) => { x.beginPath(); x.arc(-18 + i * 18, -50, 5, 0, 7); x.fillStyle = r; x.fill(); }); },
        sakal: (x, h, t) => { x.beginPath(); x.moveTo(-26, 16); x.quadraticCurveTo(-24, 48, 0, 58 + Math.sin(t / 300) * 3); x.quadraticCurveTo(24, 48, 26, 16); x.quadraticCurveTo(0, 28, -26, 16); x.closePath(); boya(x, '#fff'); },
        kaptan: (x) => { x.beginPath(); x.moveTo(-58, -36); x.quadraticCurveTo(-30, -60, -24, -80); x.lineTo(24, -80); x.quadraticCurveTo(30, -60, 58, -36); x.quadraticCurveTo(0, -56, -58, -36); x.closePath(); boya(x, '#2a1a24'); x.fillStyle = '#ffc94a'; x.beginPath(); x.moveTo(-50, -38); x.quadraticCurveTo(0, -58, 50, -38); x.quadraticCurveTo(0, -50, -50, -38); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -66, 8, 0, 7); x.fill(); },
        sap: (x) => { x.beginPath(); x.moveTo(-8, -46); x.quadraticCurveTo(-6, -70, 16, -74); x.lineTo(20, -64); x.quadraticCurveTo(8, -60, 10, -46); x.closePath(); boya(x, '#4a8a3a'); }
    };
    function kalp(x, cx, cy, r, dolu) { x.beginPath(); x.moveTo(cx, cy + r); x.bezierCurveTo(cx - r * 1.7, cy - r * .2, cx - r * .8, cy - r * 1.3, cx, cy - r * .4); x.bezierCurveTo(cx + r * .8, cy - r * 1.3, cx + r * 1.7, cy - r * .2, cx, cy + r); x.closePath(); boya(x, dolu ? '#ff3a5a' : 'rgba(30,20,50,.75)', 2.5); }
    // cx,cy taşınmış/ölçeklenmiş tuvalde çağrılır (merkez 0,0)
    function ciz(x, h, t, op) {
        op = op || {}; x.save(); if (op.korku) x.translate(Math.sin(t / 28) * 2.5, 0); if (op.mutlu) x.rotate(Math.sin(t / 160) * .12);
        arka(x, h, t); x.shadowColor = h.r; x.shadowBlur = h.tur === 'bos' ? 34 : 18; govde(x, h.sekil, t); x.fillStyle = h.r; x.fill(); x.shadowBlur = 0; x.shadowColor = 'transparent';
        x.save(); x.clip(); const g = x.createLinearGradient(-40, -50, 50, 40); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(30,10,60,.28)'); x.fillStyle = g; x.fillRect(-70, -90, 140, 160); if (h.sekil === 'balkabagi') { x.strokeStyle = 'rgba(120,50,0,.4)'; x.lineWidth = 5; [8, 28].forEach((d) => { x.beginPath(); x.ellipse(0, -4, d, 44, 0, 0, 7); x.stroke(); }); } x.restore();
        govde(x, h.sekil, t); x.strokeStyle = KOYU; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke();
        gozCiz(x, h.goz, t, op); agizCiz(x, h.agiz, t, op); h.aks.forEach((k) => { if (AKS[k]) AKS[k](x, h, t, op); });
        if (op.canTop > 1) for (let i = 0; i < op.canTop; i++) kalp(x, (i - (op.canTop - 1) / 2) * 25, 62, 10, i < op.can);
        x.restore();
    }

    /* ---------- YENİ EŞYALAR ---------- */
    const ESYA = {
        kuvet: { ad: 'Küvet', h: 120, i: 'KÜVETİ', e: 'KÜVETE' }, kabak: { ad: 'Balkabağı', h: 130, i: 'BALKABAĞINI', e: 'BALKABAĞINA' }, perde: { ad: 'Perde', h: 225, i: 'PERDEYİ', e: 'PERDEYE' }, kutu: { ad: 'Kutu', h: 110, i: 'KUTUYU', e: 'KUTUYA' },
        buzdolabi: { ad: 'Buzdolabı', h: 215, i: 'BUZDOLABINI', e: 'BUZDOLABINA' }, tabut: { ad: 'Tabut', h: 205, i: 'TABUTU', e: 'TABUTA' }, tup: { ad: 'Tüp', h: 200, i: 'TÜPÜ', e: 'TÜPE' }, cadir: { ad: 'Çadır', h: 170, i: 'ÇADIRI', e: 'ÇADIRA' },
        kuyu: { ad: 'Kuyu', h: 175, i: 'KUYUYU', e: 'KUYUYA' }, davul: { ad: 'Davul', h: 130, i: 'DAVULU', e: 'DAVULA' }, agac: { ad: 'Ağaç', h: 220, i: 'AĞACI', e: 'AĞACA' }, top: { ad: 'Top', h: 110, i: 'TOPU', e: 'TOPA' }
    };
    function esya(x, e, t, Z) {
        const L = e.x - e.w / 2, U = Z - e.h, w = e.w, h = e.h, R = e.x + w / 2, c = e.x, ah = (r) => { x.fillStyle = r; };
        switch (e.t) {
            case 'kuvet': ah('#f4f6fa'); yuv(x, L - 4, U + 30, w + 8, 18, 9); x.fill(); x.beginPath(); x.moveTo(L, U + 42); x.quadraticCurveTo(L + 6, Z - 8, L + 20, Z - 12); x.lineTo(R - 20, Z - 12); x.quadraticCurveTo(R - 6, Z - 8, R, U + 42); x.closePath(); x.fill(); ah('#c8a050'); x.fillRect(L + 14, Z - 14, 9, 14); x.fillRect(R - 23, Z - 14, 9, 14); ah('rgba(160,220,255,.9)'); for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(L + 12 + k * (w - 24) / 5, U + 28 + Math.sin(t / 500 + k) * 4, 11, 0, 7); x.fill(); } break;
            case 'kabak': [-.3, .3, -.15, .15, 0].forEach((k) => { ah(Math.abs(k) > .2 ? '#c8641a' : '#e8822a'); x.beginPath(); x.ellipse(c + w * k, U + h * .58, w * .24, h * .42, 0, 0, 7); x.fill(); }); ah('#4a8a3a'); x.fillRect(c - 7, U, 14, 26); break;
            case 'perde': ah('#c8a050'); x.fillRect(L - 6, U, w + 12, 9); for (let k = 0; k < 6; k++) { ah(k % 2 ? '#8a1c34' : '#a82a44'); const a = L + k * w / 6, s = Math.sin(t / 700 + k) * 3; x.beginPath(); x.moveTo(a, U + 8); x.lineTo(a + w / 6 + 1, U + 8); x.lineTo(a + w / 6 + 1 + s, Z - 2); x.lineTo(a + s, Z - 2); x.fill(); } break;
            case 'kutu': ['#ff5a5a', '#ffd34a', '#5ee37a'].forEach((r, k) => { ah(r); x.beginPath(); x.arc(L + w * (k + 1) / 4, U + 24, 15, 0, 7); x.fill(); }); ah('#3a8ad0'); yuv(x, L, U + 26, w, h - 26, 8); x.fill(); ah('#ffe27a'); x.font = '900 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText('ABC', c, Z - 14); break;
            case 'buzdolabi': ah('#cfe0ea'); yuv(x, L + 4, U, w - 8, h, 14); x.fill(); ah('#a8bccb'); x.fillRect(L + 4, U + h * .36, w - 8, 5); ah('#6a7a8a'); yuv(x, R - 22, U + 24, 8, 36, 4); x.fill(); yuv(x, R - 22, U + h * .45, 8, 50, 4); x.fill(); ah('#ff5a5a'); x.fillRect(L + 18, U + 28, 14, 14); break;
            case 'tabut': ah('#5a3a22'); x.beginPath(); x.moveTo(c - w * .2, U); x.lineTo(c + w * .2, U); x.lineTo(R - 4, U + h * .3); x.lineTo(c + w * .24, Z); x.lineTo(c - w * .24, Z); x.lineTo(L + 4, U + h * .3); x.closePath(); x.fill(); x.strokeStyle = '#8a5f38'; x.lineWidth = 5; x.stroke(); ah('#8a5f38'); x.fillRect(L + 12, U + h * .32, w - 24, 9); x.fillRect(L + 18, U + h * .6, w - 36, 9); ah('#c8a050'); x.beginPath(); x.arc(c, U + 46, 13, 0, 7); x.fill(); ah('#5a3a22'); x.beginPath(); x.arc(c, U + 46, 6, 0, 7); x.fill(); break;
            case 'tup': ah('rgba(90,230,140,.4)'); x.fillRect(L + 12, U + 22, w - 24, h - 48); ah('rgba(180,255,200,.8)'); for (let k = 0; k < 5; k++) { const b = (t / 1400 + k / 5) % 1; x.beginPath(); x.arc(L + 20 + k * (w - 40) / 4, Z - 34 - b * (h - 70), 5, 0, 7); x.fill(); } ah('#4a5264'); yuv(x, L + 6, Z - 26, w - 12, 26, 6); x.fill(); yuv(x, L + 6, U, w - 12, 22, 6); x.fill(); break;
            case 'cadir': ah('#d0742a'); x.beginPath(); x.moveTo(c, U); x.lineTo(R + 4, Z); x.lineTo(L - 4, Z); x.closePath(); x.fill(); ah('#8a4a16'); x.beginPath(); x.moveTo(c, U + 24); x.lineTo(c + w * .22, Z); x.lineTo(c - w * .22, Z); x.closePath(); x.fill(); break;
            case 'kuyu': ah('#5a3a22'); x.fillRect(L + 8, U + 28, 8, h - 90); x.fillRect(R - 16, U + 28, 8, h - 90); x.beginPath(); x.moveTo(c, U); x.lineTo(R + 2, U + 38); x.lineTo(L - 2, U + 38); x.fill(); ah('#6a6a76'); x.fillRect(L + 2, Z - 74, w - 4, 74); ah('#82828e'); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { yuv(x, L + 5 + k * (w - 10) / 4, Z - 70 + r * 24, (w - 10) / 4 - 4, 18, 4); x.fill(); } break;
            case 'davul': ah('#c23a3a'); yuv(x, L + 4, U + 14, w - 8, h - 18, 12); x.fill(); ah('#fff3d8'); x.beginPath(); x.ellipse(c, U + 18, w / 2 - 6, 16, 0, 0, 7); x.fill(); x.strokeStyle = '#ffd34a'; x.lineWidth = 4; x.beginPath(); for (let k = 0; k <= 6; k++) x.lineTo(L + 8 + k * (w - 16) / 6, k % 2 ? Z - 14 : U + 36); x.stroke(); break;
            case 'agac': ah('#4a3020'); x.beginPath(); x.moveTo(c - 20, Z); x.quadraticCurveTo(c - 8, U + h * .6, c - 12, U + 60); x.lineTo(c + 12, U + 60); x.quadraticCurveTo(c + 8, U + h * .6, c + 20, Z); x.fill(); [[-.25, 60, 34], [.25, 56, 34], [0, 36, 38]].forEach((p) => { ah('#2f6a44'); x.beginPath(); x.arc(c + w * p[0] + Math.sin(t / 900) * 2, U + p[1], Math.min(p[2], w * .38), 0, 7); x.fill(); }); ah('#140c08'); x.beginPath(); x.ellipse(c, Z - 70, 8, 13, 0, 0, 7); x.fill(); break;
            case 'top': ah('#3a3a46'); x.save(); x.translate(c - 4, Z - 50); x.rotate(-.35); yuv(x, -w * .36, -22, w * .84, 42, 16); x.fill(); x.restore(); ah('#6a4428'); x.beginPath(); x.arc(c - 10, Z - 24, 24, 0, 7); x.fill(); ah('#8a5a38'); x.beginPath(); x.arc(c - 10, Z - 24, 9, 0, 7); x.fill(); break;
            default: return false;
        }
        return true;
    }
    /* ---------- ODALARIN HAREKETLİ SÜSÜ (pencere 860–1010 × 162–332, duvar y 150–420) ---------- */
    function dekor(x, id, t) {
        const s = t / 1000; x.save();
        const yarasa = (cx, cy, k) => { const f = Math.sin(s * 9 + k) * 9; x.fillStyle = '#17131f'; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx - 14, cy - 10 - f, cx - 28, cy - f); x.quadraticCurveTo(cx - 14, cy + 2, cx, cy + 8); x.quadraticCurveTo(cx + 14, cy + 2, cx + 28, cy - f); x.quadraticCurveTo(cx + 14, cy - 10 - f, cx, cy); x.fill(); };
        const mum = (cx, cy) => { x.fillStyle = '#f0e6d0'; x.fillRect(cx - 5, cy, 10, 26); x.fillStyle = '#ffb02e'; x.beginPath(); x.ellipse(cx, cy - 9, 5, 11 + Math.sin(s * 11 + cx) * 2, 0, 0, 7); x.fill(); const g = x.createRadialGradient(cx, cy - 8, 2, cx, cy - 8, 60); g.addColorStop(0, 'rgba(255,190,80,.35)'); g.addColorStop(1, 'rgba(255,150,40,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy - 8, 60, 0, 7); x.fill(); };
        if (id === 'hol' || id === 'kral') { mum(560, 350); mum(1230, 350); }
        else if (id === 'kutuphane') { for (let k = 0; k < 3; k++) { x.save(); x.translate(620 + k * 210 + Math.sin(s + k) * 24, 365 + Math.sin(s * 1.4 + k * 2) * 12); x.rotate(Math.sin(s + k) * .3); x.fillStyle = ['#b84a3a', '#3a7ab8', '#5aa06a'][k]; x.fillRect(-18, -13, 36, 26); x.fillStyle = '#f4ecd8'; x.fillRect(-14, -10, 28, 20); x.restore(); } }
        else if (id === 'mutfak') { for (let k = 0; k < 4; k++) { x.save(); x.translate(1050 + k * 58, 326); x.rotate(Math.sin(s * 1.5 + k) * .12); x.fillStyle = '#8a8f9c'; x.fillRect(-2, 0, 4, 18); x.beginPath(); x.arc(0, 28, 14, 0, 7); x.fill(); x.restore(); } }
        else if (id === 'yatak' || id === 'oyuncak') { for (let k = 0; k < 8; k++) { x.globalAlpha = .3 + Math.abs(Math.sin(s + k * 1.3)) * .5; x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(560 + k * 90, 345 + (k % 2) * 26, 4, 0, 7); x.fill(); } x.globalAlpha = 1; }
        else if (id === 'tavan' || id === 'kiler') { x.strokeStyle = 'rgba(230,230,240,.4)'; x.lineWidth = 2; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(1276, 330); x.lineTo(1276 - 90 * Math.cos(k * .39), 330 + 90 * Math.sin(k * .39)); x.stroke(); } [30, 56, 82].forEach((r) => { x.beginPath(); x.arc(1276, 330, r, Math.PI / 2, Math.PI); x.stroke(); }); const y = 350 + Math.sin(s * .8) * 26; x.beginPath(); x.moveTo(850, 330); x.lineTo(850, y); x.stroke(); x.fillStyle = '#17131f'; x.beginPath(); x.arc(850, y + 8, 10, 0, 7); x.fill(); }
        else if (id === 'banyo') { x.fillStyle = 'rgba(200,240,255,.4)'; for (let k = 0; k < 9; k++) { const u = (s / 5 + k / 9) % 1; x.beginPath(); x.arc(560 + k * 78 + Math.sin(s + k) * 14, 440 - u * 110, 5 + k % 3 * 3, 0, 7); x.fill(); } }
        else if (id === 'bahce') { for (let k = 0; k < 12; k++) { x.globalAlpha = .4 + Math.sin(s * 3 + k) * .4; x.fillStyle = '#d8ff8a'; x.beginPath(); x.arc(560 + k * 58 + Math.sin(s + k) * 18, 370 + Math.cos(s * .8 + k * 2) * 30, 4, 0, 7); x.fill(); } x.globalAlpha = 1; }
        else if (id === 'lab') { if (Math.sin(s * 2.1) > .55) { x.strokeStyle = '#8af0ff'; x.lineWidth = 3; x.beginPath(); x.moveTo(570, 350); for (let k = 1; k < 8; k++) x.lineTo(570 + k * 30, 350 + Math.random() * 34 - 17); x.stroke(); } }
        else if (id === 'tiyatro') { [[640, '#ff9ac8'], [1150, '#9ae0ff']].forEach((p, k) => { const ax = 900 + Math.sin(s * .9 + k * 2) * 240; x.globalAlpha = .14; x.fillStyle = p[1]; x.beginPath(); x.moveTo(p[0], 150); x.lineTo(ax - 80, 610); x.lineTo(ax + 80, 610); x.fill(); x.globalAlpha = 1; }); }
        else if (id === 'gemi') { x.strokeStyle = '#c8a050'; x.lineWidth = 3; x.save(); x.translate(850, 318); x.rotate(Math.sin(s * 1.3) * .25); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 24); x.stroke(); x.fillStyle = '#ffd98a'; yuv(x, -12, 24, 24, 28, 8); x.fill(); x.restore(); }
        else if (id === 'mezar') { for (let k = 0; k < 3; k++) yarasa(560 + (s * 60 + k * 230) % 700, 365 + Math.sin(s * 2 + k) * 16, k); }
        yarasa(880 + (s * 34) % 120, 220 + Math.sin(s * 3) * 10, 1);
        const sm = s % 11; if (sm < .18) { x.fillStyle = 'rgba(210,225,255,' + (.16 * (1 - sm / .18)) + ')'; x.fillRect(512, 74, 768, 536); }
        x.restore();
    }
    function yakala(x, tip, u, t) {
        const a = u < .15 ? u / .15 : u > .8 ? (1 - u) / .2 : 1; x.save(); x.globalAlpha = Math.max(0, a);
        if (tip === 'isin') { const g = x.createLinearGradient(0, -360, 0, 60); g.addColorStop(0, 'rgba(120,240,255,0)'); g.addColorStop(1, 'rgba(120,240,255,.75)'); x.fillStyle = g; x.beginPath(); x.moveTo(-22, -360); x.lineTo(22, -360); x.lineTo(86, 60); x.lineTo(-86, 60); x.fill(); x.strokeStyle = '#d8fbff'; x.lineWidth = 4; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(0, 50 - ((t / 4 + k * 60) % 240), 74, 14, 0, 0, 7); x.stroke(); } }
        else if (tip === 'ag') { const y = -320 * (1 - Math.min(1, u / .3)); x.translate(0, y); x.strokeStyle = '#fff3c4'; x.lineWidth = 4; for (let k = -4; k <= 4; k++) { x.beginPath(); x.moveTo(k * 8, -110); x.quadraticCurveTo(k * 22, -30, k * 22, 60); x.stroke(); } for (let j = 0; j < 5; j++) { const w = 34 + j * 14; x.beginPath(); x.moveTo(-w, -90 + j * 36); x.quadraticCurveTo(0, -76 + j * 36, w, -90 + j * 36); x.stroke(); } }
        else { x.strokeStyle = '#c9a6ff'; x.lineWidth = 6; for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i < 40; i++) { const r = 90 * (1 - i / 40), q = i * .42 + t / 120 + k * 2.1; x.lineTo(Math.cos(q) * r, Math.sin(q) * r * .7 + i * 3 - 30); } x.stroke(); } yuv(x, -34, 92, 68, 60, 14); boya(x, '#d23a5a', 4); yuv(x, -46, 76, 92, 22, 8); boya(x, '#3a3a4a', 4); }
        x.restore();
    }
    window.HYLK = { LISTE, BOS, TUR, ESYA, bul, ciz, esya, dekor, yakala, kalp };
})();
