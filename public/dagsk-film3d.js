/* ================================================================================================
   🎬 OKUN YOLCULUĞU — 3B okçuluk filmi (2026-11-16, v420). Kullanıcı: "kulüpte yayınlayabileceğim okçuluk hakkında 3 dk video oluştur,
   Karışık Sınıf'ta yayınla" (aynı gün 3B Hazine Adası'nı görünce: "genelde de böyle yapalım"). v405'teki fotoğraflı film (dagsk-film.js) durur;
   bu ikinci film tamamen gerçek zamanlı 3B (three.js r128, yerel /vendor). Gerçek video dosyası yok: her kare t'ye (saniye) bağlı ve
   deterministik → duraklat / sar / tekrar sorunsuz. Türkçe seslendirme (speechSynthesis) + büyük altyazı + sentez müzik (WebAudio).
   SAHNELER (182 sn): 1 açılış (atış alanı) · 2 tarih · 3 klasik ve makaralı yay · 4 atışın 8 adımı (3B okçu) · 5 okun uçuşu (ağır çekim,
   okçu paradoksu) · 6 puanlama (10…1, X) · 7 düdükler ve güvenlik · 8 kulübümüz (kulüp fotoğrafları) · 9 final.
   Bilgiler: olimpik yay 70 m, 122 cm hedef; okçuluk 1900 Paris'te olimpiyatlarda; düdük: 2 hatta gel, 1 başla, 3 okları topla, çok düdük dur.
   Açılış: dagFilm3dAc(). WebGL yoksa uyarı verir, fotoğraflı filme yönlendirir.
   ================================================================================================ */
(function () {
    'use strict';
    if (window.dagFilm3dAc) return;
    const SURE = 182;
    const $ = (id) => document.getElementById(id);
    const kis = (x, a, b) => Math.max(a, Math.min(b, x));
    const ara = (t, a, b) => kis((t - a) / (b - a), 0, 1);
    const yum = (p) => p * p * (3 - 2 * p);
    const cik = (p) => 1 - Math.pow(1 - p, 3);
    const FOTO = ['/hero/salon-1600.webp', '/kulup/salon2-1600.webp', '/galeri/okculuk-2.jpg', '/galeri/okculuk-1.jpg', '/galeri/okculuk-4.jpg', '/galeri/okculuk-5.jpg'];

    /* ---------------------------------------------------------------- seslendirme metni [başlangıç sn, metin] */
    const ANLATIM = [
        [1, 'Bir ok, yaydan çıktığı anda saatte iki yüz kilometreden hızlı uçar.'],
        [7, 'Bu filmde o okun yolculuğuna birlikte çıkıyoruz.'],
        [15, 'Okçuluk insanlık kadar eski. Binlerce yıl önce insanlar yayla avlanırdı.'],
        [22, 'Osmanlı okçuları İstanbul\'daki Okmeydanı\'nda yüzlerce metre öteye ok atardı.'],
        [28.5, 'Okçuluk ilk kez 1900\'de olimpiyatlara girdi. Bugün dünyanın her yerinde bir spor.'],
        [35, 'Kulübümüzde iki tür yay kullanıyoruz.'],
        [38.5, 'Klasik yay, yani olimpik yay. Bütün gücü okçu taşır. Olimpiyatlarda yetmiş metreden atılır.'],
        [48, 'Makaralı yayın uçlarında makaralar var. Tam çekişte yük hafifler, ok daha da hızlı gider.'],
        [57, 'Bir: duruş. Ayaklar omuz genişliğinde, hedefe yan dur.'],
        [61, 'İki: oku tak. Çentik ipe oturur.'],
        [65, 'Üç: yayı kaldır. Omuzlar aşağıda, rahat.'],
        [69, 'Dört: çek. Gücü sırtın versin, kol değil.'],
        [73, 'Beş: ankraj. El hep aynı yere, çenenin altına.'],
        [77, 'Altı: nişan al. Gözün nişangâhta, nefesin sakin.'],
        [81, 'Yedi: bırak. Parmaklar sadece gevşer.'],
        [85, 'Sekiz: takip. Ok hedefe varana kadar pozunu bozma.'],
        [90.5, 'Şimdi okun gözünden bakalım.'],
        [94, 'Ok yaydan çıkarken bir yılan gibi kıvrılır. Buna okçu paradoksu denir.'],
        [101, 'Rüzgâr, nefes, bir milimetrelik el hareketi. Hepsi okun nereye gideceğini değiştirir.'],
        [110.5, 'Hedefin ortası on puan. Dışa doğru dokuz, sekiz, en dıştaki halka bir puan.'],
        [117.5, 'En içteki küçük halka X. On sayılır, eşitlikte kazandırır.'],
        [123, 'Üç oklu bir seride en yüksek puan otuz.'],
        [128.5, 'Okçulukta en önemli kural: güvenlik.'],
        [132, 'İki düdük: atış hattına gel. Bir düdük: atışa başla.'],
        [137.5, 'Üç düdük: herkes birlikte okları toplamaya gider. Çok sayıda düdük: hemen dur!'],
        [144, 'Oku asla birine doğrultma. Yayı boş çekme.'],
        [148.5, 'DAĞ Spor Kulübü\'nde okçuluk bir aile.'],
        [152, 'Karışık sınıfta farklı yaşlar birlikte çalışır. Yarışmalarda kendimizi tanırız, oyunlarda birlikte güleriz.'],
        [160.5, 'Her antrenman, dünkü kendimizi bir puan geçmek için.'],
        [166.5, 'Sabır. Odak. Arkadaşlık.'],
        [170, 'Hazırsan nefes al. Çek. Ve bırak!'],
        [176, 'DAĞ Okçuluk. Hedef bizim!']
    ];
    const ADIM = ['DURUŞ', 'OKU TAK', 'KALDIR', 'ÇEK', 'ANKRAJ', 'NİŞAN', 'BIRAK', 'TAKİP'];
    const BOLUM = [[0, 'AÇILIŞ'], [14, 'TARİH'], [34, 'YAYLAR'], [56, 'ATIŞIN 8 ADIMI'], [90, 'OKUN UÇUŞU'], [110, 'PUANLAMA'], [128, 'GÜVENLİK'], [148, 'KULÜBÜMÜZ'], [166, 'FİNAL']];

    /* ---------------------------------------------------------------- durum */
    const D = { t: 0, oynuyor: false, bas: 0, basT: 0, soyleyen: -1, muzik: true, anlatim: true, bitti: false };
    let R = null, S = null, cam = null, raf = 0, G = {};
    function webglVar() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }

    /* ---------------------------------------------------------------- doku yardımcıları */
    function tuval(w, h, ciz) { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
    function hedefDoku() {
        return tuval(512, 512, (x, w) => {
            const renk = ['#f4f4f0', '#f4f4f0', '#25262b', '#25262b', '#2ea5de', '#2ea5de', '#e8463b', '#e8463b', '#f7d23e', '#f7d23e'];
            x.fillStyle = '#e9e2cf'; x.fillRect(0, 0, w, w);
            for (let i = 0; i < 10; i++) { const r = (w / 2 - 6) * (10 - i) / 10; x.beginPath(); x.arc(w / 2, w / 2, r, 0, 7); x.fillStyle = renk[i]; x.fill(); x.lineWidth = 1.5; x.strokeStyle = i === 2 || i === 3 ? '#9aa0a8' : 'rgba(0,0,0,.35)'; x.stroke(); }
            x.beginPath(); x.arc(w / 2, w / 2, (w / 2 - 6) / 20, 0, 7); x.strokeStyle = 'rgba(0,0,0,.5)'; x.stroke();
            x.fillStyle = '#222'; x.beginPath(); x.arc(w / 2, w / 2, 2, 0, 7); x.fill();
        });
    }
    function panoDoku(ikon, baslik, metin, renk) {
        return tuval(1024, 600, (x, w, h) => {
            const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#13202c'); g.addColorStop(1, '#0a121a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
            x.fillStyle = renk || '#FF6A1A'; x.fillRect(0, 0, w, 14); x.strokeStyle = 'rgba(255,255,255,.15)'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
            x.font = '150px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ikon, w / 2, 170);
            x.fillStyle = '#FFD23F'; x.font = '900 74px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; x.fillText(baslik, w / 2, 330);
            x.fillStyle = '#e8eef4'; x.font = '600 40px Inter,"Segoe UI",Arial,sans-serif';
            const kel = metin.split(' '), satir = []; let s = '';
            kel.forEach((k) => { const d = s ? s + ' ' + k : k; if (x.measureText(d).width > w - 120) { satir.push(s); s = k; } else s = d; }); if (s) satir.push(s);
            satir.slice(0, 3).forEach((l, i) => x.fillText(l, w / 2, 420 + i * 56));
        });
    }
    function yaziSprite(yazi, renk, boy) {
        const t = tuval(512, 160, (x, w, h) => { x.font = '900 120px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 14; x.strokeStyle = 'rgba(0,0,0,.65)'; x.strokeText(yazi, w / 2, h / 2); x.fillStyle = renk || '#fff'; x.fillText(yazi, w / 2, h / 2); });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(3.2 * (boy || 1), 1 * (boy || 1), 1); s.renderOrder = 9; return s;
    }
    const mat = (c, ek) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.05 }, ek || {}));
    function kemik(m, a, b) { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }

    /* ---------------------------------------------------------------- nesneler */
    function okYap(renkTuy) {
        const g = new THREE.Group();
        const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.76, 8), mat(0x2b2f36, { metalness: 0.5, roughness: 0.35 })); sap.rotation.x = Math.PI / 2; g.add(sap);
        const uc = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.05, 8), mat(0xc9ced6, { metalness: 0.9, roughness: 0.2 })); uc.rotation.x = -Math.PI / 2; uc.position.z = -0.4; g.add(uc);
        for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.03, 0.08), mat(i === 0 ? 0xffd23f : (renkTuy || 0xff6a1a))); t.position.set(Math.cos(i * 2.09) * 0.015, Math.sin(i * 2.09) * 0.015, 0.31); t.rotation.z = i * 2.09; g.add(t); }
        const centik = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), mat(0xff6a1a)); centik.rotation.x = Math.PI / 2; centik.position.z = 0.385; g.add(centik);
        return g;
    }
    function klasikYay() { // olimpik (recurve) yay: kabza + esneyen kollar + ucu geri kıvrık
        const g = new THREE.Group();
        const kab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.07), mat(0xb8261e, { metalness: 0.6, roughness: 0.3 })); g.add(kab);
        const kol = (yon) => {
            const p = [];
            for (let i = 0; i <= 12; i++) { const s = i / 12, y = yon * (0.3 + s * 0.42), z = -0.05 - Math.sin(s * Math.PI * 0.9) * 0.1 + (s > 0.82 ? (s - 0.82) * 0.55 : 0); p.push(new THREE.Vector3(0, y, z)); }
            return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 24, 0.016, 8), mat(0x3a3f48, { metalness: 0.4, roughness: 0.35 }));
        };
        g.add(kol(1)); g.add(kol(-1));
        const nisan = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.18), mat(0x9aa0a8, { metalness: 0.8 })); nisan.position.set(0, 0.12, -0.12); g.add(nisan);
        const nok = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f })); nok.position.set(0, 0.12, -0.21); g.add(nok); g.userData.nisanNok = nok;
        const den = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 6), mat(0x9aa0a8, { metalness: 0.8 })); den.rotation.x = Math.PI / 2; den.position.set(0, -0.05, -0.38); g.add(den);
        g.userData.ust = new THREE.Vector3(0, 0.72, -0.02); g.userData.alt = new THREE.Vector3(0, -0.72, -0.02);
        return g;
    }
    function makaraliYay() {
        const g = new THREE.Group();
        const kab = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.08), mat(0x2f6fb0, { metalness: 0.7, roughness: 0.3 })); g.add(kab);
        [1, -1].forEach((yon) => {
            const kol = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.05), mat(0x3a3f48)); kol.position.set(0, yon * 0.48, -0.06); kol.rotation.x = yon * 0.35; g.add(kol);
            const mk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), mat(0xb8bec7, { metalness: 0.9, roughness: 0.2 })); mk.rotation.z = Math.PI / 2; mk.position.set(0, yon * 0.62, -0.12); g.add(mk); (g.userData.makara = g.userData.makara || []).push(mk);
        });
        const kabin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.2), mat(0x9aa0a8, { metalness: 0.8 })); kabin.position.set(0, 0.1, -0.13); g.add(kabin);
        g.userData.ust = new THREE.Vector3(0, 0.62, -0.06); g.userData.alt = new THREE.Vector3(0, -0.62, -0.06);
        return g;
    }
    function ipYap() { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9).fill(0), 3)); return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xeeeeee })); }
    function ipGuncelle(ip, a, orta, b) { const p = ip.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, orta.x, orta.y, orta.z); p.setXYZ(2, b.x, b.y, b.z); p.needsUpdate = true; ip.geometry.computeBoundingSphere(); }
    function okcuYap() {
        const g = new THREE.Group(), forma = mat(0xff6a1a), koyu = mat(0x1b2230), ten = mat(0xe9b896), kol = () => new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 1, 10), forma), bacak = () => new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 1, 10), koyu);
        const govde = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.56, 0.4), forma); govde.position.set(0, 1.2, 0); g.add(govde);
        const yaka = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.08, 0.41), mat(0xffd23f)); yaka.position.set(0, 1.46, 0); g.add(yaka);
        const kafa = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), ten); kafa.position.set(0, 1.64, -0.02); g.add(kafa);
        const sac = new THREE.Mesh(new THREE.SphereGeometry(0.125, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x2a1a12)); sac.position.copy(kafa.position); sac.position.y += 0.01; g.add(sac);
        const kalca = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.38), koyu); kalca.position.set(0, 0.88, 0); g.add(kalca);
        const b1 = bacak(), b2 = bacak(); kemik(b1, new THREE.Vector3(0, 0.86, -0.12), new THREE.Vector3(0, 0.02, -0.2)); kemik(b2, new THREE.Vector3(0, 0.86, 0.12), new THREE.Vector3(0, 0.02, 0.2)); g.add(b1); g.add(b2);
        [-0.2, 0.2].forEach((z) => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.11), mat(0xf4f6fa)); a.position.set(0.05, 0.035, z); g.add(a); });
        const yu = kol(), ya = kol(), cu = kol(), ca = kol(); [yu, ya, cu, ca].forEach((m) => g.add(m));
        const el1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), ten), el2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), ten); g.add(el1); g.add(el2);
        const yay = klasikYay(); g.add(yay);
        const ip = ipYap(); g.add(ip);
        const ok = okYap(); g.add(ok);
        g.userData = { yu, ya, cu, ca, el1, el2, yay, ip, ok, kafa, govde };
        return g;
    }
    const OMUZ_Y = new THREE.Vector3(0, 1.43, -0.18), OMUZ_C = new THREE.Vector3(0, 1.43, 0.18);
    const P = {
        yayAsagi: new THREE.Vector3(0.05, 0.98, -0.32), yayYukari: new THREE.Vector3(0, 1.44, -0.8),
        cekYan: new THREE.Vector3(0.05, 0.95, 0.3), cekTak: new THREE.Vector3(0.12, 1.08, -0.45), ipte: new THREE.Vector3(0, 1.44, -0.72), ankraj: new THREE.Vector3(0.02, 1.5, 0.02), takip: new THREE.Vector3(0.03, 1.52, 0.14)
    };
    function lerpV(a, b, p) { return new THREE.Vector3().lerpVectors(a, b, p); }
    function poz(o, adim, p, t) { // adim 0..7 (+ p); okcunun kolları, yay, ip, ok
        const u = o.userData;
        let yayEl, cekEl, okVar = false, okUcuyor = 0, yayEgim = 0.9;
        if (adim <= 0) { yayEl = P.yayAsagi; cekEl = P.cekYan; }
        else if (adim === 1) { yayEl = lerpV(P.yayAsagi, new THREE.Vector3(0.1, 1.15, -0.5), yum(p)); cekEl = lerpV(P.cekYan, P.cekTak, yum(p)); okVar = p > 0.4; yayEgim = 0.9 - 0.5 * yum(p); }
        else if (adim === 2) { yayEl = lerpV(new THREE.Vector3(0.1, 1.15, -0.5), P.yayYukari, yum(p)); cekEl = lerpV(P.cekTak, P.ipte, yum(p)); okVar = true; yayEgim = 0.4 * (1 - yum(p)); }
        else if (adim === 3) { yayEl = P.yayYukari; cekEl = lerpV(P.ipte, P.ankraj, yum(p)); okVar = true; yayEgim = 0; }
        else if (adim === 4 || adim === 5) { yayEl = P.yayYukari; cekEl = P.ankraj.clone().add(new THREE.Vector3(0, Math.sin(t * 3) * 0.002, 0)); okVar = true; yayEgim = 0; }
        else if (adim === 6) { yayEl = P.yayYukari; cekEl = lerpV(P.ankraj, P.takip, cik(kis(p * 3, 0, 1))); okVar = true; okUcuyor = p; yayEgim = 0; }
        else { yayEl = P.yayYukari; cekEl = P.takip; yayEgim = 0; }
        // kollar: yay kolu düz, çeken kol dirsekli (dirsek omuz hizasında arkada)
        const yDirsek = lerpV(OMUZ_Y, yayEl, 0.5).add(new THREE.Vector3(0.03, 0, 0));
        kemik(u.yu, OMUZ_Y, yDirsek); kemik(u.ya, yDirsek, yayEl); u.el1.position.copy(yayEl);
        const cDirsek = adim >= 3 && adim <= 7 ? new THREE.Vector3(0.02, 1.47, 0.42) : lerpV(OMUZ_C, cekEl, 0.5).add(new THREE.Vector3(0.12, -0.05, 0.05));
        kemik(u.cu, OMUZ_C, cDirsek); kemik(u.ca, cDirsek, cekEl); u.el2.position.copy(cekEl);
        // yay
        u.yay.position.copy(yayEl); u.yay.rotation.set(-yayEgim, 0, 0); o.updateMatrixWorld(true);
        const ust = u.yay.localToWorld(u.yay.userData.ust.clone()), alt = u.yay.localToWorld(u.yay.userData.alt.clone());
        o.worldToLocal(ust); o.worldToLocal(alt);
        const cekik = adim >= 2 && adim <= 5 || (adim === 6 && p < 0.04);
        const nok = cekik ? cekEl.clone() : lerpV(ust, alt, 0.5).add(new THREE.Vector3(0, 0, 0.12));
        ipGuncelle(u.ip, ust, nok, alt);
        u.yay.userData.nisanNok.material.color.setHex(adim === 5 ? 0x7CFF6B : 0xffd23f);
        // ok
        u.ok.visible = okVar && okUcuyor < 0.35;
        if (u.ok.visible) {
            const yon = new THREE.Vector3().subVectors(yayEl.clone().add(new THREE.Vector3(0, 0, -0.12)), nok).normalize();
            const bas = okUcuyor > 0 ? nok.clone().addScaledVector(yon, okUcuyor * 40) : nok;
            u.ok.position.copy(bas).addScaledVector(yon, -0.385 * -1); u.ok.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), yon);
        }
    }

    /* ---------------------------------------------------------------- sahne kurulumu */
    function kur(kap) {
        R = new THREE.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        R.domElement.className = 'df3-tuval'; kap.insertBefore(R.domElement, kap.firstChild);
        S = new THREE.Scene(); cam = new THREE.PerspectiveCamera(45, 16 / 9, 0.02, 600);
        G.hemi = new THREE.HemisphereLight(0xffffff, 0x4a6b3a, 0.85); S.add(G.hemi);
        G.gunes = new THREE.DirectionalLight(0xffe2b0, 1.1); G.gunes.position.set(-20, 30, 10); S.add(G.gunes);
        S.fog = new THREE.Fog(0xf3c08a, 40, 220);
        // atış alanı
        G.alan = new THREE.Group(); S.add(G.alan);
        const zemin = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(0x5d9a3c, { roughness: 1 })); zemin.rotation.x = -Math.PI / 2; G.alan.add(zemin);
        for (let m = 10; m <= 70; m += 10) { const c = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.12), new THREE.MeshBasicMaterial({ color: 0xf4f6fa })); c.rotation.x = -Math.PI / 2; c.position.set(0, 0.01, -m); G.alan.add(c); const s = yaziSprite(m + ' m', '#fff', 0.6); s.position.set(-7.6, 0.4, -m); G.alan.add(s); }
        const hat = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.16), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); hat.rotation.x = -Math.PI / 2; hat.position.set(0, 0.012, 0.3); G.alan.add(hat);
        const hd = hedefDoku();
        G.hedefler = [];
        [-4.5, -1.5, 1.5, 4.5].forEach((x, i) => {
            const st = new THREE.Group(), yuz = new THREE.Mesh(new THREE.CircleGeometry(0.61, 48), new THREE.MeshStandardMaterial({ map: hd, roughness: 0.9 }));
            const sep = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.3), mat(0xd9cba6)); sep.position.z = -0.17; st.add(sep); yuz.position.z = 0.0; st.add(yuz);
            [-0.55, 0.55].forEach((ax) => { const ayak = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.0, 0.07), mat(0x8a5a2b)); ayak.position.set(ax, -0.5, -0.4); ayak.rotation.x = -0.25; st.add(ayak); });
            st.position.set(x, 1.3, -70); st.rotation.x = -0.12; G.alan.add(st); G.hedefler.push(st);
        });
        G.agaclar = new THREE.Group(); G.alan.add(G.agaclar);
        for (let i = 0; i < 60; i++) { const a = new THREE.Group(), h = 3 + (i % 5); const g1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h * 0.4, 6), mat(0x6b4425)); g1.position.y = h * 0.2; a.add(g1); const y1 = new THREE.Mesh(new THREE.ConeGeometry(1.2 + (i % 3) * 0.4, h, 7), mat([0x2f6b33, 0x3a7d3a, 0x25592b][i % 3], { flatShading: true })); y1.position.y = h * 0.4 + h * 0.5; a.add(y1); const sag = i % 2 ? 1 : -1; a.position.set(sag * (12 + (i * 7) % 30), 0, -((i * 13) % 140) + 20); G.agaclar.add(a); }
        G.okcu = okcuYap(); G.okcu.position.set(0, 0, 0); G.alan.add(G.okcu);
        // uçan ok (sahne 5 ve final)
        G.ucanOk = okYap(); G.ucanOk.scale.setScalar(1.4); S.add(G.ucanOk);
        G.iz = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffd23f, size: 0.05, transparent: true, opacity: 0.8 }));
        G.iz.geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(90 * 3), 3)); S.add(G.iz);
        G.saplanan = okYap(); G.saplanan.scale.setScalar(1.4); G.alan.add(G.saplanan);
        G.patlama = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffd23f, size: 0.06, transparent: true })); const pp = new Float32Array(120 * 3); G.patlamaYon = []; for (let i = 0; i < 120; i++) { const a = Math.random() * 6.28, b = Math.random() * 3.14; G.patlamaYon.push([Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b) * 0.4 + 0.6]); }
        G.patlama.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); S.add(G.patlama);
        // karanlık stüdyo (tarih, yaylar, puanlama, güvenlik, kulüp)
        G.studyo = new THREE.Group(); S.add(G.studyo);
        const zem2 = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x0c1520, roughness: 0.35, metalness: 0.3 })); zem2.rotation.x = -Math.PI / 2; G.studyo.add(zem2);
        G.yildiz = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.7 }));
        const ys = new Float32Array(600 * 3); for (let i = 0; i < 600; i++) { ys[i * 3] = (Math.random() - 0.5) * 120; ys[i * 3 + 1] = Math.random() * 40 + 1; ys[i * 3 + 2] = (Math.random() - 0.5) * 120; } G.yildiz.geometry.setAttribute('position', new THREE.Float32BufferAttribute(ys, 3)); G.studyo.add(G.yildiz);
        G.spot = new THREE.PointLight(0xffe2bf, 2.2, 40); G.spot.position.set(0, 6, 6); G.studyo.add(G.spot);
        // tarih panoları
        G.tarih = new THREE.Group(); G.studyo.add(G.tarih);
        [['🏹', 'BİNLERCE YIL ÖNCE', 'İnsanlar avlanmak ve korunmak için yay yaptı.'], ['🕌', 'OSMANLI · OKMEYDANI', 'Okçular yüzlerce metre öteye atış yaparak rekor taşları dikti.'], ['🏅', '1900 · OLİMPİYAT', 'Okçuluk ilk kez Paris Olimpiyatları\'nda yarıştı.'], ['🌍', 'BUGÜN', 'Dünyanın her yerinde, her yaştan sporcunun sporu.']].forEach((v, i) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.4), new THREE.MeshBasicMaterial({ map: panoDoku(v[0], v[1], v[2]) })); m.position.set(i * 5.2 - 7.8, 2.2, -i * 1.2); m.rotation.y = 0.12; G.tarih.add(m);
        });
        // yaylar
        G.yaylar = new THREE.Group(); G.studyo.add(G.yaylar);
        const k1 = klasikYay(), k2 = makaraliYay(); k1.scale.setScalar(2.2); k2.scale.setScalar(2.2); k1.position.set(-1.6, 2.1, 0); k2.position.set(1.6, 2.1, 0);
        const ip1 = ipYap(), ip2 = ipYap(); k1.add(ip1); k2.add(ip2); ipGuncelle(ip1, k1.userData.ust, new THREE.Vector3(0, 0, 0.14), k1.userData.alt); ipGuncelle(ip2, k2.userData.ust, new THREE.Vector3(0, 0, 0.1), k2.userData.alt);
        G.yaylar.add(k1); G.yaylar.add(k2); G.k1 = k1; G.k2 = k2;
        [[-1.6, 'KLASİK YAY', '#FFD23F'], [1.6, 'MAKARALI YAY', '#7CC4FF']].forEach(([x, y, r]) => { const s = yaziSprite(y, r, 0.3); s.position.set(x, 3.95, 0.3); G.yaylar.add(s); });
        [-1.6, 1.6].forEach((x) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.25, 32), mat(0x1c2a38, { metalness: 0.4 })); k.position.set(x, 0.12, 0); G.yaylar.add(k); });
        // puanlama hedefi
        G.puan = new THREE.Group(); G.studyo.add(G.puan);
        const bh = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({ map: hd })); bh.position.set(0, 2.4, 0); G.puan.add(bh);
        G.puanEt = [];
        for (let v = 10; v >= 1; v--) { const s = yaziSprite(String(v), v >= 9 ? '#2b2200' : v >= 3 && v <= 4 ? '#fff' : v <= 2 ? '#222' : '#fff', 0.32); const r = 2.2 * (10.5 - v) / 10; s.position.set(r * 0.82, 2.4 + r * 0.57, 0.05); G.puan.add(s); G.puanEt.push(s); }
        const xs = yaziSprite('X', '#2b2200', 0.3); xs.position.set(-0.02, 2.4 - 0.01, 0.06); G.puan.add(xs); G.puanEt.push(xs);
        G.puanOk = [0, 1, 2].map(() => { const o = okYap(); o.scale.setScalar(2.6); G.puan.add(o); return o; });
        // güvenlik panoları
        G.guv = new THREE.Group(); G.studyo.add(G.guv);
        [['🔔🔔', 'İKİ DÜDÜK', 'Atış hattına gel, yayını hazırla.', '#7CC4FF'], ['🔔', 'BİR DÜDÜK', 'Atışa başla.', '#7CFF6B'], ['🔔🔔🔔', 'ÜÇ DÜDÜK', 'Herkes birlikte okları toplamaya gider.', '#FFD23F'], ['🛑', 'ÇOK DÜDÜK', 'Hemen dur! Oku yaydan çıkar.', '#FF4B4B'], ['🙅', 'ASLA', 'Oku birine doğrultma, yayı boş çekme.', '#FF6A1A']].forEach((v, i) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2), new THREE.MeshBasicMaterial({ map: panoDoku(v[0], v[1], v[2], v[3]) })); const a = (i - 2) * 0.5; m.position.set(Math.sin(a) * 7, 2.1, -Math.cos(a) * 7 + 7); m.rotation.y = -a; G.guv.add(m);
        });
        // kulüp fotoğrafları
        G.kulup = new THREE.Group(); G.studyo.add(G.kulup);
        const yukleyici = new THREE.TextureLoader();
        FOTO.forEach((src, i) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshBasicMaterial({ color: 0x223344 })), cer = new THREE.Mesh(new THREE.PlaneGeometry(3.36, 2.16), new THREE.MeshBasicMaterial({ color: 0xff6a1a }));
            yukleyici.load(src, (tx) => { m.material.map = tx; m.material.color.setHex(0xffffff); m.material.needsUpdate = true; const im = tx.image; if (im && im.width && im.height) { const sx = Math.min(1.25, (im.width / im.height) / 1.6); m.scale.set(sx, 1, 1); cer.scale.set((3.2 * sx + 0.16) / 3.36, 1, 1); } }, undefined, () => { });
            cer.position.z = -0.01; const grp = new THREE.Group(); grp.add(cer); grp.add(m);
            const a = (i - 2.5) * 0.42; grp.position.set(Math.sin(a) * 8, 2.0 + (i % 2) * 0.35, -Math.cos(a) * 8 + 8); grp.rotation.y = -a; G.kulup.add(grp);
        });
        const logo = yaziSprite('DAĞ S.K.', '#FF6A1A', 0.8); logo.position.set(0, 3.75, 0.5); G.kulup.add(logo);
        // final: dev hedef ve ok yağmuru
        G.final = new THREE.Group(); S.add(G.final);
        const fh = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshBasicMaterial({ map: hd })); fh.position.set(0, 3, -12); G.final.add(fh);
        G.finalOk = []; for (let i = 0; i < 14; i++) { const o = okYap(i % 2 ? 0x7cc4ff : 0xff6a1a); o.scale.setScalar(3); G.final.add(o); G.finalOk.push({ o, a: (i / 14) * Math.PI * 2, gec: i * 0.32, r: 0.15 + (i % 4) * 0.12 }); }
        G.havaifisek = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true }));
        const hp = new Float32Array(400 * 3), hc = new Float32Array(400 * 3); G.hfYon = [];
        for (let i = 0; i < 400; i++) { const a = Math.random() * 6.28, b = Math.acos(2 * Math.random() - 1), k = i % 4; G.hfYon.push([Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a), k]); const r = [[1, 0.42, 0.1], [1, 0.82, 0.25], [0.48, 0.77, 1], [1, 1, 1]][k]; hc[i * 3] = r[0]; hc[i * 3 + 1] = r[1]; hc[i * 3 + 2] = r[2]; }
        G.havaifisek.geometry.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); G.havaifisek.geometry.setAttribute('color', new THREE.Float32BufferAttribute(hc, 3)); G.final.add(G.havaifisek);
        boyut();
    }
    function boyut() { if (!R) return; const k = $('df3'); const w = k.clientWidth, h = k.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 62 : 45; cam.updateProjectionMatrix(); }

    /* ---------------------------------------------------------------- kare: her şey t'ye bağlı */
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    function kameraYol(a, b, la, lb, p) { cam.position.lerpVectors(a, b, p); cam.lookAt(new THREE.Vector3().lerpVectors(la, lb, p)); }
    function ciz(t) {
        const studyo = (t >= 14 && t < 56) || (t >= 110 && t < 166), alan = !studyo && t < 166, fin = t >= 166;
        G.studyo.visible = studyo; G.alan.visible = alan; G.final.visible = fin;
        G.tarih.visible = t >= 14 && t < 34; G.yaylar.visible = t >= 34 && t < 56; G.puan.visible = t >= 110 && t < 128; G.guv.visible = t >= 128 && t < 148; G.kulup.visible = t >= 148 && t < 166;
        S.background = new THREE.Color(studyo ? 0x070b12 : fin ? 0x0a0612 : (t < 14 ? 0xf6c48c : 0x9fd3f0));
        S.fog.color.copy(S.background); S.fog.near = studyo ? 30 : 40; S.fog.far = studyo ? 80 : 220;
        G.hemi.intensity = studyo ? 0.85 : fin ? 0.45 : 0.85; G.gunes.color.setHex(t < 14 ? 0xffc890 : 0xfff2dc);
        G.ucanOk.visible = false; G.iz.visible = false; G.saplanan.visible = false; G.patlama.visible = false;
        G.okcu.visible = alan && t >= 56;
        let adim = 0, ap = 0;
        if (t < 14) { // açılış: altın saatte atış alanı üzerinden uçuş
            const p = yum(ara(t, 0, 14)); kameraYol(V(-14, 9, 12), V(3, 2.4, -48), V(0, 1, -40), V(0, 1.3, -70), p);
            G.okcu.visible = true; poz(G.okcu, 5, 0, t);
            if (t > 10.2) { const q = ara(t, 10.2, 13.2); okUcur(V(0, 1.44, -0.9), V(1.5, 1.3, -69.9), q, t); }
        } else if (t < 34) { // tarih panoları
            const i = kis(Math.floor((t - 15) / 5), 0, 3), p = yum(ara(t - 15, i * 5, i * 5 + 1.6)), hx = (k) => k * 5.2 - 7.8, hz = (k) => -k * 1.2;
            const onceki = Math.max(0, i - (p < 1 ? 1 : 0));
            const x = t < 15 ? hx(0) : hx(onceki) + (hx(i) - hx(onceki)) * (i === onceki ? 1 : p), z = t < 15 ? 0 : hz(onceki) + (hz(i) - hz(onceki)) * (i === onceki ? 1 : p);
            const giris = yum(ara(t, 14, 15.5)); cam.position.set(x + 0.5, 2.3 + (1 - giris) * 3, z + 4.2 + (1 - giris) * 6); cam.lookAt(x, 2.2, z);
            G.tarih.children.forEach((m, k) => { m.position.y = 2.2 + Math.sin(t * 0.8 + k) * 0.05; });
        } else if (t < 56) { // yaylar: dönen iki yay
            const p = ara(t, 34, 56);
            G.k1.rotation.y = t * 0.6; G.k2.rotation.y = -t * 0.6 + 1; G.k2.userData.makara.forEach((m) => { m.rotation.x = t * 3; });
            const odak = t < 38 ? 0 : t < 48 ? -1.6 : 1.6;
            const hedef = V(odak, 2.0, 0), yakin = t < 38 ? 7.5 : 5.4;
            const k = yum(ara(t, t < 38 ? 34 : t < 48 ? 38 : 48, (t < 38 ? 34 : t < 48 ? 38 : 48) + 1.5));
            G._yk = G._yk || hedef.clone(); G._yk.lerp(hedef, D.oynuyor ? k * 0.06 + 0.02 : 1);
            cam.position.set(G._yk.x + Math.sin(p * 2) * 0.6, 2.4, yakin); cam.lookAt(G._yk.x, 2.25, 0);
        } else if (t < 90) { // 8 adım
            const k = kis((t - 57) / 4, 0, 7.999); adim = t < 57 ? 0 : Math.floor(k); ap = t < 57 ? 0 : k - adim;
            poz(G.okcu, adim, ap, t);
            const yakin = adim >= 3 && adim <= 5, ac = (t - 56) * 0.09;
            const r = yakin ? 2.0 : 3.4, merkez = V(0, yakin ? 1.45 : 1.15, yakin ? -0.25 : -0.1);
            cam.position.set(merkez.x + Math.cos(ac + 0.6) * r, merkez.y + (yakin ? 0.15 : 0.5), merkez.z + Math.sin(ac + 0.6) * r + 0.6); cam.lookAt(merkez);
            if (adim === 6 || adim === 7) { const q = ara(t, 81, 84); okUcur(V(0, 1.44, -0.9), V(-1.5, 1.32, -69.9), q, t, true); }
        } else if (t < 110) { // okun uçuşu: ağır çekim, kamera okun yanında
            poz(G.okcu, t < 92 ? 5 : 7, 0, t);
            const q = cik(ara(t, 92, 104.5)) * 0.97 + ara(t, 104.5, 105.5) * 0.03;
            const pos = okUcur(V(0, 1.44, -0.9), V(1.5, 1.33, -69.95), q, t, false, true);
            if (t < 92) { cam.position.set(1.4, 1.6, 1.2); cam.lookAt(0, 1.4, -1.5); }
            else if (t < 104.5) { cam.position.set(pos.x + 0.45, pos.y + 0.12, pos.z + 1.3); cam.lookAt(pos.x, pos.y, pos.z - 2); }
            else { const s = yum(ara(t, 104.5, 110)); cam.position.set(1.5 + 0.9 + s * 0.6, 1.4 + s * 0.3, -66.5 + s * 1.5); cam.lookAt(1.5, 1.32, -70); }
        } else if (t < 128) { // puanlama
            const p = ara(t, 110, 128); cam.position.set(Math.sin(p * 0.6 - 0.3) * 1.2, 2.5, 5.6 - p * 0.6); cam.lookAt(0, 2.4, 0);
            G.puanEt.forEach((s, i) => { const g = ara(t, 111 + i * 0.55, 111.4 + i * 0.55); const gx = i === 10 ? ara(t, 117.5, 118.2) : g, b = (i === 10 ? 0.16 : 0.2) * (1 + (1 - gx) * 0.7); s.material.opacity = gx; s.scale.set(3.2 * b, b, 1); });
            const yer = [[0.05, 0.08, 'X'], [-0.32, 0.22, '9'], [0.18, -0.12, '10']];
            G.puanOk.forEach((o, i) => { const q = ara(t, 123.2 + i * 0.9, 123.6 + i * 0.9); o.visible = q > 0; const hd = V(yer[i][0] * 2.2, 2.4 + yer[i][1] * 2.2, 0.0); const bas = V(hd.x + 3, hd.y + 2, 10); o.position.lerpVectors(bas, hd.clone().add(V(0, 0, 0.95)), cik(q)); o.quaternion.setFromUnitVectors(V(0, 0, -1), new THREE.Vector3().subVectors(hd, bas).normalize()); });
        } else if (t < 148) { // güvenlik
            const i = t < 132 ? 0 : t < 135.5 ? 0 : t < 137.5 ? 1 : t < 141 ? 2 : t < 144 ? 3 : 4, a = (i - 2) * 0.5;
            const hp = V(Math.sin(a) * 7, 2.1, -Math.cos(a) * 7 + 7), g = yum(ara(t, 128, 130));
            G._gk = G._gk || hp.clone(); G._gk.lerp(hp, D.oynuyor ? 0.06 : 1);
            const dist = 3.2 + (1 - g) * 6;
            cam.position.set(G._gk.x * (1 - dist / 7) , 2.2, G._gk.z + (7 - G._gk.z) * (dist / 7)); cam.lookAt(G._gk);
        } else if (t < 166) { // kulüp fotoğrafları galerisi
            const p = ara(t, 148, 166), a = (p * 5 - 2.5) * 0.42;
            cam.position.set(Math.sin(a) * 2.2, 2.3, 8 - Math.cos(a) * 2.2 - 1.2 + 1.2 * Math.sin(p * 3)); cam.lookAt(Math.sin(a) * 8, 2.1, -Math.cos(a) * 8 + 8);
            G.kulup.children.forEach((m, k) => { if (m.isGroup) m.position.y = 2.0 + (k % 2) * 0.35 + Math.sin(t + k) * 0.05; });
        } else { // final: ok yağmuru, havai fişek
            const p = ara(t, 166, 182); cam.position.set(Math.sin(p * 1.2) * 1.5, 3 + p * 0.4, 6 - p * 2); cam.lookAt(0, 3, -12);
            G.finalOk.forEach((f, i) => { const q = ara(t, 167 + f.gec, 168.1 + f.gec); f.o.visible = q > 0; const hd = V(Math.cos(f.a) * f.r, 3 + Math.sin(f.a) * f.r, -12 + 1.1); const bas = V(Math.cos(f.a) * 9, 3 + Math.sin(f.a) * 6, 8); f.o.position.lerpVectors(bas, hd, cik(q)); f.o.quaternion.setFromUnitVectors(V(0, 0, -1), new THREE.Vector3().subVectors(hd, bas).normalize()); });
            const hq = ara(t, 172.5, 176.5), hpz = G.havaifisek.geometry.attributes.position; G.havaifisek.visible = hq > 0 && hq < 1;
            for (let i = 0; i < 400; i++) { const y = G.hfYon[i], merkezX = [-4, 4, 0, -2][y[3]], merkezY = [5.5, 5.8, 6.6, 4.8][y[3]], gec = y[3] * 0.12, q = kis((hq - gec) / (1 - gec), 0, 1), r = cik(q) * 3.2; hpz.setXYZ(i, merkezX + y[0] * r, merkezY + y[1] * r - q * q * 1.6, -14 + y[2] * r); }
            hpz.needsUpdate = true; G.havaifisek.material.opacity = 1 - hq;
        }
        R.render(S, cam);
        hud(t, adim, ap);
    }
    function okUcur(bas, bit, q, t, sessiz, uzun) {
        const pos = new THREE.Vector3().lerpVectors(bas, bit, q); pos.y += Math.sin(q * Math.PI) * 0.35;
        const yon = new THREE.Vector3().subVectors(bit, bas).normalize();
        G.ucanOk.visible = q > 0 && q < 1; G.ucanOk.position.copy(pos);
        G.ucanOk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), yon);
        const kivrim = Math.sin(q * 40) * 0.12 * Math.max(0, 1 - q * 2.2); G.ucanOk.rotateY(kivrim); // okçu paradoksu: çıkışta kıvrılır, sonra düzelir
        // iz
        G.iz.visible = q > 0 && q < 1; const ip = G.iz.geometry.attributes.position;
        for (let i = 0; i < 90; i++) { const qq = Math.max(0, q - i * (uzun ? 0.004 : 0.008)); const pp = new THREE.Vector3().lerpVectors(bas, bit, qq); pp.y += Math.sin(qq * Math.PI) * 0.35; ip.setXYZ(i, pp.x, pp.y, pp.z); }
        ip.needsUpdate = true; G.iz.geometry.computeBoundingSphere();
        if (q >= 1) { G.saplanan.visible = true; G.saplanan.position.copy(bit).add(V(0, 0, 0.36 * 1.4)); G.saplanan.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), yon); }
        // patlama: saplanınca 1 sn
        G._carpT = G._carpT || {};
        const anahtar = Math.round(bit.x * 10) + '_' + (uzun ? 1 : 0);
        if (q >= 1 && G._carpT[anahtar] == null) G._carpT[anahtar] = t;
        if (q < 1) G._carpT[anahtar] = null;
        const ct = G._carpT[anahtar];
        if (ct != null && t - ct < 1.2) { G.patlama.visible = true; const r = cik(ara(t, ct, ct + 1.2)) * 0.9, pp = G.patlama.geometry.attributes.position; for (let i = 0; i < 120; i++) { const y = G.patlamaYon[i]; pp.setXYZ(i, bit.x + y[0] * r, bit.y + y[1] * r, bit.z + y[2] * r * 0.6); } pp.needsUpdate = true; G.patlama.material.opacity = 1 - ara(t, ct, ct + 1.2); if (!sessiz && t - ct < 0.05) SES.saplan(); }
        return pos;
    }

    /* ---------------------------------------------------------------- arayüz */
    function hud(t, adim, ap) {
        const b = $('df3-baslik'), e = $('df3-etiket'), sk = $('df3-skor'), bl = $('df3-bolum');
        let bt = '', bs = '';
        if (t < 13.5) { const g = Math.min(ara(t, 4.5, 6), 1 - ara(t, 12.5, 13.5)); bt = g > 0 ? '<small>DAĞ S.K. OKÇULUK SUNAR</small>OKUN YOLCULUĞU' : ''; b.style.opacity = g; }
        else if (t >= 177) { const g = ara(t, 177, 178.2); bt = '<small>SABIR · ODAK · ARKADAŞLIK</small>DAĞ OKÇULUK<span>Hedef bizim!</span>'; b.style.opacity = g; }
        else b.style.opacity = 0;
        if (b._h !== bt) { b.innerHTML = bt; b._h = bt; }
        if (t >= 57 && t < 89) { e.style.opacity = Math.min(ara(ap, 0, 0.12), 1 - ara(ap, 0.9, 1)); bs = '<b>' + (adim + 1) + '</b>' + ADIM[adim]; } else e.style.opacity = 0;
        if (e._h !== bs) { e.innerHTML = bs; e._h = bs; }
        if (t >= 90 && t < 104.5) { sk.style.opacity = ara(t, 92.5, 93.2); sk.innerHTML = '<small>OKUN HIZI</small>' + Math.round(ara(t, 92, 93.5) * 220) + ' km/s'; }
        else if (t >= 123 && t < 128) { const n = [ara(t, 123.6, 123.7), ara(t, 124.5, 124.6), ara(t, 125.4, 125.5)]; const top = (n[0] >= 1 ? 10 : 0) + (n[1] >= 1 ? 9 : 0) + (n[2] >= 1 ? 10 : 0); sk.style.opacity = 1; sk.innerHTML = '<small>SERİ</small>' + (n[0] >= 1 ? 'X' : '·') + ' + ' + (n[1] >= 1 ? '9' : '·') + ' + ' + (n[2] >= 1 ? '10' : '·') + ' = ' + top; }
        else sk.style.opacity = 0;
        const bo = BOLUM.slice().reverse().find((x) => t >= x[0]); if (bl._h !== bo[1]) { bl.textContent = bo[1]; bl._h = bo[1]; }
        // altyazı
        let alt = ''; for (let i = ANLATIM.length - 1; i >= 0; i--) { const a = ANLATIM[i], son = (ANLATIM[i + 1] ? ANLATIM[i + 1][0] : SURE) - 0.2; if (t >= a[0] && t < Math.min(son, a[0] + 8.5)) { alt = a[1]; break; } }
        const ay = $('df3-alt'); if (ay._h !== alt) { ay.textContent = alt; ay._h = alt; ay.style.opacity = alt ? 1 : 0; }
        $('df3-cubuk-i').style.width = (t / SURE * 100).toFixed(2) + '%';
        $('df3-zaman').textContent = sn(t) + ' / ' + sn(SURE);
    }
    const sn = (t) => Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);

    /* ---------------------------------------------------------------- ses: seslendirme + müzik */
    let _tr = null;
    function sesSec() { try { const v = speechSynthesis.getVoices(); _tr = v.find((x) => /^tr/i.test(x.lang) && /Ahmet|Emel/i.test(x.name)) || v.find((x) => /^tr/i.test(x.lang) && /Natural|Online|Google|Yelda|Filiz/i.test(x.name)) || v.find((x) => /^tr/i.test(x.lang)) || null; } catch (e) { } }
    function konus(m) { if (!D.anlatim || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(m); u.lang = 'tr-TR'; if (_tr) u.voice = _tr; u.rate = 1.02; u.pitch = 1; speechSynthesis.speak(u); } catch (e) { } }
    function anlatimSenkron(t, atla) { let son = -1; for (let i = 0; i < ANLATIM.length; i++) if (t >= ANLATIM[i][0]) son = i; if (atla) { D.soyleyen = son; return; } if (son > D.soyleyen) { D.soyleyen = son; if (t - ANLATIM[son][0] < 2) konus(ANLATIM[son][1]); } }
    let AC = null, M = null;
    const AKOR = { Am: [220, 261.6, 329.6], F: [174.6, 220, 261.6], C: [196, 261.6, 329.6], G: [196, 246.9, 293.7], Em: [164.8, 196, 246.9], D: [146.8, 220, 293.7] };
    const DIZI = ['Am', 'F', 'C', 'G'], DIZI2 = ['Am', 'F', 'C', 'G', 'Am', 'Em', 'F', 'G'];
    function muzikKur() {
        if (M || !D.muzik) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
        const ana = AC.createGain(); ana.gain.value = 0; ana.connect(AC.destination);
        const filtre = AC.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 900; filtre.Q.value = 0.7; filtre.connect(ana);
        const ses = []; for (let i = 0; i < 3; i++) for (let d = 0; d < 2; d++) { const o = AC.createOscillator(), g = AC.createGain(); o.type = d ? 'sawtooth' : 'triangle'; o.detune.value = d ? 7 : -5; g.gain.value = d ? 0.035 : 0.06; o.connect(g); g.connect(filtre); o.start(); ses.push({ o, i }); }
        const bas = AC.createOscillator(), bg = AC.createGain(); bas.type = 'sine'; bg.gain.value = 0.12; bas.connect(bg); bg.connect(ana); bas.start();
        M = { ana, filtre, ses, bas, akor: '', vurus: 0 };
    }
    function muzikDur() { if (!M) return; try { M.ana.gain.setTargetAtTime(0, AC.currentTime, 0.1); } catch (e) { } }
    function muzikKare(t) {
        if (!D.muzik || !D.oynuyor) { muzikDur(); return; } muzikKur(); if (!M) return;
        const yogun = t < 14 ? 0.55 : t < 56 ? 0.38 : t < 90 ? 0.45 : t < 110 ? 0.62 : t < 148 ? 0.42 : t < 166 ? 0.6 : 1;
        const dizi = t >= 148 ? DIZI2 : DIZI, ad = dizi[Math.floor(t / (t >= 166 ? 2 : 4)) % dizi.length];
        const now = AC.currentTime;
        M.ana.gain.setTargetAtTime(0.55 * (t > SURE - 3 ? ara(SURE - t, 0, 3) : 1), now, 0.25);
        M.filtre.frequency.setTargetAtTime(500 + yogun * 2600, now, 0.6);
        if (M.akor !== ad) { M.akor = ad; const f = AKOR[ad]; M.ses.forEach((s) => s.o.frequency.setTargetAtTime(f[s.i] * (t >= 166 ? 1 : 0.5), now, 0.15)); M.bas.frequency.setTargetAtTime(f[0] / 2, now, 0.1); }
        // davul: final ve uçuşta
        const tempo = t >= 166 ? 0.42 : t >= 90 && t < 104 ? 0.6 : 0, v = tempo ? Math.floor(t / tempo) : -1;
        if (tempo && v !== M.vurus) { M.vurus = v; try { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(42, now + 0.18); g.gain.setValueAtTime(0.5 * yogun, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25); o.connect(g); g.connect(M.ana); o.start(now); o.stop(now + 0.3); } catch (e) { } }
    }
    const SES = { saplan: () => { if (!D.muzik || !AC) return; try { const n = Math.floor(AC.sampleRate * 0.25), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4); const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; g.gain.value = 0.7; s.connect(g); g.connect(AC.destination); s.start(); } catch (e) { } } };

    /* ---------------------------------------------------------------- oynatma */
    function simdi() { return D.oynuyor ? D.basT + (performance.now() - D.bas) / 1000 : D.t; }
    function dongu() {
        raf = requestAnimationFrame(dongu);
        if (!$('df3')) { cancelAnimationFrame(raf); return; }
        let t = simdi(); if (t >= SURE) { t = SURE; if (D.oynuyor) { D.t = SURE; D.oynuyor = false; D.bitti = true; dugmeler(); } }
        D.t = t;
        if (D.oynuyor) anlatimSenkron(t);
        muzikKare(t);
        try { ciz(t); } catch (e) { console.warn('film3d', e); }
    }
    function oynat() { if (D.bitti || D.t >= SURE - 0.1) { D.t = 0; D.bitti = false; D.soyleyen = -1; G._carpT = {}; } D.bas = performance.now(); D.basT = D.t; D.oynuyor = true; anlatimSenkron(D.t, true); if (D.t < 0.5) D.soyleyen = -1; dugmeler(); }
    function duraklat() { D.t = simdi(); D.oynuyor = false; try { speechSynthesis.cancel(); } catch (e) { } dugmeler(); }
    function sar(t) { const ac = D.oynuyor; D.t = kis(t, 0, SURE - 0.05); D.bitti = false; G._carpT = {}; try { speechSynthesis.cancel(); } catch (e) { } anlatimSenkron(D.t, true); if (ac) { D.bas = performance.now(); D.basT = D.t; } }
    function dugmeler() {
        $('df3-oynat').textContent = D.oynuyor ? '⏸ Duraklat' : D.bitti ? '↻ Tekrar izle' : D.t > 0.2 ? '▶ Devam' : '▶ İzle';
        $('df3-muzik').textContent = D.muzik ? '🎵 Müzik açık' : '🎵 Müzik kapalı'; $('df3-anlatim').textContent = D.anlatim ? '🗣️ Anlatım açık' : '🗣️ Anlatım kapalı';
        $('df3').classList.toggle('duruyor', !D.oynuyor);
    }
    function kapat() { D.oynuyor = false; try { speechSynthesis.cancel(); } catch (e) { } try { if (M) { M.ana.gain.value = 0; M.ses.forEach((s) => s.o.stop()); M.bas.stop(); } } catch (e) { } M = null; cancelAnimationFrame(raf); try { R.dispose(); R.forceContextLoss && R.forceContextLoss(); } catch (e) { } R = null; const k = $('df3'); if (k) k.remove(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { } window.removeEventListener('resize', boyut); document.removeEventListener('keydown', tus); }
    function tus(e) { if (!$('df3')) return; if (e.key === ' ') { e.preventDefault(); D.oynuyor ? duraklat() : oynat(); } else if (e.key === 'ArrowRight') sar(simdi() + 10); else if (e.key === 'ArrowLeft') sar(simdi() - 10); else if (e.key === 'Escape') kapat(); }
    function css() {
        if ($('df3-css')) return; const st = document.createElement('style'); st.id = 'df3-css';
        st.textContent = [
            '#df3{position:fixed;inset:0;z-index:40000;background:#05070b;color:#fff;font-family:Inter,system-ui,sans-serif;overflow:hidden}',
            '.df3-tuval{position:absolute;inset:0;width:100%;height:100%;display:block}',
            '#df3-baslik{position:absolute;z-index:1;left:0;right:0;top:34%;text-align:center;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-weight:900;font-size:clamp(46px,9vw,150px);line-height:.95;letter-spacing:.02em;text-shadow:0 6px 30px rgba(0,0,0,.6);pointer-events:none;transition:opacity .3s}',
            '#df3-baslik::before{content:"";position:absolute;left:50%;top:50%;width:min(1100px,96vw);height:2.4em;transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(5,8,14,.62),transparent);z-index:-1}',
            '#df3-baslik small{display:block;font-size:.2em;letter-spacing:.3em;color:#FFD23F;margin-bottom:.4em}#df3-baslik span{display:block;font-size:.32em;color:#FF6A1A;margin-top:.25em}',
            '#df3-etiket{position:absolute;left:4vw;top:9vh;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-weight:900;font-size:clamp(34px,6vw,96px);line-height:1;text-shadow:0 4px 20px rgba(0,0,0,.7);pointer-events:none;display:flex;align-items:center;gap:.3em}',
            '#df3-etiket b{display:grid;place-items:center;width:1.2em;height:1.2em;border-radius:50%;background:#FF6A1A;color:#fff;font-size:.8em}',
            '#df3-skor{position:absolute;right:4vw;top:9vh;text-align:right;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-weight:900;font-size:clamp(34px,5vw,84px);line-height:1;text-shadow:0 4px 20px rgba(0,0,0,.7);pointer-events:none;color:#FFD23F}',
            '#df3-skor small{display:block;font-size:.3em;letter-spacing:.25em;color:#fff}',
            '#df3-bolum{position:absolute;left:4vw;top:3vh;font-size:clamp(11px,1.3vw,18px);font-weight:900;letter-spacing:.3em;color:#FFD23F;text-shadow:0 2px 8px rgba(0,0,0,.6);pointer-events:none}',
            '#df3-alt{position:absolute;left:50%;bottom:clamp(86px,13vh,140px);transform:translateX(-50%);max-width:min(1100px,92vw);text-align:center;font-size:clamp(18px,2.6vw,40px);font-weight:800;line-height:1.25;padding:.35em .8em;border-radius:14px;background:rgba(0,0,0,.55);transition:opacity .25s;pointer-events:none}',
            '#df3-kontrol{position:absolute;left:0;right:0;bottom:0;padding:10px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:8px;background:linear-gradient(transparent,rgba(0,0,0,.75));transition:opacity .4s}',
            '#df3:not(.duruyor):not(:hover) #df3-kontrol{opacity:0}',
            '#df3-cubuk{height:10px;border-radius:999px;background:rgba(255,255,255,.2);cursor:pointer;position:relative}#df3-cubuk-i{position:absolute;left:0;top:0;bottom:0;background:#FF6A1A;border-radius:inherit}',
            '#df3-dug{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
            '#df3-dug button{border:1px solid rgba(255,255,255,.2);background:rgba(20,24,32,.85);color:#fff;border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;min-height:44px}',
            '#df3-dug button.ana{background:#FF6A1A;border-color:#FF6A1A}#df3-zaman{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums;opacity:.85}',
            '#df3-yok{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;font-size:20px;font-weight:700}'
        ].join('\n');
        document.head.appendChild(st);
    }
    window.dagFilm3dAc = function () {
        if ($('df3')) return; css();
        const k = document.createElement('div'); k.id = 'df3'; k.className = 'duruyor';
        k.innerHTML = '<div id="df3-bolum"></div><div id="df3-baslik"></div><div id="df3-etiket"></div><div id="df3-skor"></div><div id="df3-alt"></div>'
            + '<div id="df3-kontrol"><div id="df3-cubuk"><i id="df3-cubuk-i"></i></div><div id="df3-dug"><button type="button" class="ana" id="df3-oynat">▶ İzle</button><button type="button" id="df3-geri">⏪ 10 sn</button><button type="button" id="df3-ileri">10 sn ⏩</button><button type="button" id="df3-muzik"></button><button type="button" id="df3-anlatim"></button><button type="button" id="df3-tam">⛶ Tam ekran</button><button type="button" id="df3-kapat">✕ Kapat</button><span id="df3-zaman"></span></div></div>';
        document.body.appendChild(k);
        $('df3-kapat').onclick = kapat;
        if (!webglVar() || typeof THREE === 'undefined') { k.insertAdjacentHTML('beforeend', '<div id="df3-yok">Bu cihazda 3B çizim açılamadı.<br>Karışık Sınıf › Okçuluk Filmi (fotoğraflı film) bu cihazda çalışır.</div>'); return; }
        try { kur(k); } catch (e) { console.warn('film3d kur', e); k.insertAdjacentHTML('beforeend', '<div id="df3-yok">3B sahne kurulamadı. Fotoğraflı Okçuluk Filmi\'ni deneyin.</div>'); return; }
        sesSec(); try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = sesSec; } catch (e) { }
        D.t = 0; D.oynuyor = false; D.bitti = false; D.soyleyen = -1; G._carpT = {}; G._yk = null; G._gk = null;
        $('df3-oynat').onclick = () => (D.oynuyor ? duraklat() : oynat());
        $('df3-geri').onclick = () => sar(simdi() - 10); $('df3-ileri').onclick = () => sar(simdi() + 10);
        $('df3-muzik').onclick = () => { D.muzik = !D.muzik; if (!D.muzik) muzikDur(); dugmeler(); };
        $('df3-anlatim').onclick = () => { D.anlatim = !D.anlatim; if (!D.anlatim) try { speechSynthesis.cancel(); } catch (e) { } dugmeler(); };
        $('df3-tam').onclick = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else k.requestFullscreen(); } catch (e) { } };
        $('df3-cubuk').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); sar((e.clientX - r.left) / r.width * SURE); };
        window.addEventListener('resize', boyut); document.addEventListener('keydown', tus);
        dugmeler(); dongu();
    };
    window.dagFilm3dSar = (t) => { if ($('df3')) { D.t = kis(t, 0, SURE); D.oynuyor = false; anlatimSenkron(D.t, true); dugmeler(); } };
    window._df3 = { SURE, ANLATIM, D };
})();
