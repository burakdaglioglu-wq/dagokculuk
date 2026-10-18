// 🏔 3B DAĞ TIRMANIŞI (2026-10-19, kullanıcı: "dağ tırmanışını şu ana kadar en iyi görselli, en komplike ve en heyecanlı
// oyuna çevirelim" → 3B dağ + ip takımı/kurtarma seçti). Oyunun KURALLARI app.js'te kalır (frac, kamplar, ara olaylar, ip
// takımı); bu dosya yalnız çizer:
//   dagskDag3D(kap, api) → { kur(v), guncelle(v), ilerlet(i, eski, yeni, o, bitti), kapat() }   (WebGL yoksa null)
//   v = { sporcular:[{k, ad, kisa, renk, frac, img, oran, asili, ip}], cp:[frac], cpRenk:[renk|null], olay:{kestirme, tehlike, bonus}, ipAcik }
//   api = { sec(i), aktif() → aktif sporcu no, yavas() → cihaz yavaşsa 2B'ye dön }
// Yol dağın ÖN yüzünde zikzak (serpantin) çıkar — TV'de geniş planda bütün sporcular ve zirve aynı anda görünür.
(function () {
    'use strict';
    function webglVar() { try { let c = document.createElement('canvas'), gl = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')); if (!gl) return false; let d = gl.getExtension('WEBGL_debug_renderer_info'), ad = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; let ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); return !/swiftshader|llvmpipe|software|basic render/i.test(ad); } catch (e) { return false; } }
    const H = 30, R0 = 21, KIVRIM = 5, GENLIK = 0.62;
    const IP_RENK = ['#ffd166', '#5cc8ff', '#ff6b9a', '#7ee081', '#c39bff', '#ff9f43', '#4dd6c4', '#f8f8f8'];
    const YAZI = '"Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif';
    const ease = { o3: t => 1 - Math.pow(1 - t, 3), io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
    // dağ yüzeyi: yükseklikle daralan yarıçap + deterministik kabartı
    function Rh(h) { return R0 * Math.pow(Math.max(0, 1 - h / H), 0.95) + 1.1; }
    function kabarti(t, h) { return 0.07 * Math.sin(3 * t + h * 0.35) + 0.045 * Math.sin(7 * t - h * 0.8) + 0.025 * Math.sin(13 * t + h * 1.9) + 0.02 * Math.sin(29 * t + h * 3.1); }
    function yuzeyR(t, h) { return Rh(h) * (1 + kabarti(t, h)); }
    // yol: f (0..1) → açı/yükseklik. Ön yüz +z (açı 0). Zikzak genliği yukarıda küçülür.
    function yolAci(f) { return GENLIK * (1 - f * 0.35) * Math.sin(Math.PI * (f * KIVRIM - 0.5)) ; }
    function yolH(f) { return 0.4 + f * (H - 0.9); }
    function nokta(f, disari) { f = Math.max(0, Math.min(1, f)); const t = yolAci(f), h = yolH(f), r = yuzeyR(t, h) + (disari == null ? 0.45 : disari); return new THREE.Vector3(Math.sin(t) * r, h, Math.cos(t) * r); }
    function css() {
        if (document.getElementById('dag3d-css')) return;
        let st = document.createElement('style'); st.id = 'dag3d-css';
        st.textContent = '.km-dag3d{position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:inherit;pointer-events:none}.km-dag3d canvas{display:block;width:100%;height:100%;pointer-events:auto;cursor:pointer}'
            + '.km-oyun-panel.d3 #km-oyun-svg-dag,.km-oyun-panel.d3 #km-oyun-kayalar-dag{visibility:hidden}'
            + '.km-dag3d .d3-sarsinti{animation:d3Sars .5s linear}@keyframes d3Sars{20%{transform:translate(4px,-3px)}40%{transform:translate(-5px,2px)}60%{transform:translate(3px,3px)}80%{transform:translate(-2px,-2px)}}'
            + '@media (prefers-reduced-motion:reduce){.km-dag3d .d3-sarsinti{animation:none}}';
        document.head.appendChild(st);
    }

    window.dagskDag3D = function (kap, api) {
        if (typeof THREE === 'undefined' || !webglVar()) return null;
        api = api || {};
        css();
        const zayif = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.hardwareConcurrency || 8) <= 4;
        const azHareket = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        let r;
        try { r = new THREE.WebGLRenderer({ antialias: !zayif, powerPreference: 'high-performance' }); } catch (e) { return null; }
        r.setPixelRatio(Math.min(zayif ? 1.25 : 2, window.devicePixelRatio || 1));
        r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1; r.outputEncoding = THREE.sRGBEncoding;
        r.shadowMap.enabled = !zayif; r.shadowMap.type = THREE.PCFSoftShadowMap;
        kap.appendChild(r.domElement);
        const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 900);
        const m = { T: 0, isler: [], olaylar: [], her: [], durdu: false };
        const boyut = () => { const w = kap.clientWidth, h = kap.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1.2 ? 55 : 40; m.alt = -1; cam.updateProjectionMatrix(); };
        boyut(); const ro = new ResizeObserver(boyut); ro.observe(kap);
        let son = performance.now();
        const dongu = (now) => {
            if (m.durdu) return;
            if (!kap.isConnected) return kapat();
            m.raf = requestAnimationFrame(dongu);
            const ham = now - son; son = now;
            if (!kap.offsetWidth || document.hidden) return; // gizli sekme / başka tema: çizme
            const dt = Math.min(.05, ham / 1000); m.T += dt;
            if (m.ks == null) m.ks = 0;
            if (m.T < 5 && ham < 2000) { m.ks++; m.kt = (m.kt || 0) + ham; if (m.ks >= 14 && m.kt / m.ks > 70) { kapat(); try { api.yavas && api.yavas(); } catch (e) {} return; } }
            m.olaylar = m.olaylar.filter(o => { if (m.T >= o.t) { try { o.f(); } catch (e) {} return false; } return true; });
            m.isler = m.isler.filter(i => { const p = (m.T - i.t0) / i.d; if (p < 0) return true; try { i.f(i.e(Math.min(1, p))); } catch (e) {} return p < 1; });
            m.her.forEach(f => { try { f(dt, m.T); } catch (e) {} });
            r.render(sc, cam);
        };
        m.raf = requestAnimationFrame(dongu);
        const at = (t, f) => m.olaylar.push({ t: m.T + t, f });
        const tw = (t, d, f, e) => m.isler.push({ t0: m.T + t, d: Math.max(.001, d), f, e: e || ease.io });
        const dokular = [];
        function tuval(w, h, ciz) { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; dokular.push(t); return t; }
        const yumusak = tuval(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
        function emojiDoku(e) { return tuval(128, 128, (x) => { x.font = '96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); }); }

        // ---------------- gökyüzü (saate göre: gündüz / gün batımı / gece)
        const saat = new Date().getHours();
        const PAL = saat >= 19 || saat < 6 ? { ust: '#070c26', orta: '#24306a', ufuk: '#5a4a86', sis: '#1c2450', gunes: '#dfe6ff', isik: '#c4d0ff', isikG: 1.5, hemi: 1.05, yildiz: 1 }
            : saat >= 16 ? { ust: '#1c2350', orta: '#7a4a7a', ufuk: '#ff9a5a', sis: '#6a4a6a', gunes: '#ffc27a', isik: '#ffd2a0', isikG: 1.5, hemi: .6, yildiz: .35 }
            : { ust: '#2a64c8', orta: '#6fa8e8', ufuk: '#cfe6ff', sis: '#9cc0e6', gunes: '#fff4d6', isik: '#fff1dc', isikG: 1.7, hemi: .75, yildiz: 0 };
        sc.fog = new THREE.Fog(PAL.sis, 90, 330);
        const gok = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: tuval(8, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, PAL.ust); g.addColorStop(.38, PAL.orta); g.addColorStop(.5, PAL.ufuk); g.addColorStop(.56, PAL.sis); g.addColorStop(1, PAL.sis); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
        sc.add(gok);
        if (PAL.yildiz) { const n = 900, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 + .15, R = 380; p[i * 3] = Math.cos(a) * Math.cos(e) * R; p[i * 3 + 1] = Math.sin(e) * R; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R; } g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, map: yumusak, transparent: true, opacity: PAL.yildiz, depthWrite: false, fog: false })); sc.add(st); m.her.push((dt, T) => { st.material.opacity = PAL.yildiz * (.8 + Math.sin(T * 1.3) * .2); }); }
        const gunes = new THREE.Sprite(new THREE.SpriteMaterial({ map: yumusak, color: PAL.gunes, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); gunes.position.set(-120, 80, -260); gunes.scale.set(90, 90, 1); sc.add(gunes);
        sc.add(new THREE.HemisphereLight(PAL.orta, '#2a2018', PAL.hemi));
        const isik = new THREE.DirectionalLight(PAL.isik, PAL.isikG); isik.position.set(-40, 60, 50); isik.castShadow = !zayif;
        if (!zayif) { isik.shadow.mapSize.set(2048, 2048); Object.assign(isik.shadow.camera, { left: -30, right: 30, top: 35, bottom: -5, near: 10, far: 160 }); }
        sc.add(isik); sc.add(isik.target);
        const dolgu = new THREE.DirectionalLight('#8fb0ff', .35); dolgu.position.set(40, 20, 30); sc.add(dolgu);

        // ---------------- dağ (düşük poligon, kar sınırı, kaya tonları)
        const dag = (function () {
            const HR = zayif ? 54 : 84, TR = zayif ? 110 : 170, poz = [], renk = [], ind = [], c = new THREE.Color();
            const kar = new THREE.Color('#f4f7ff'), kar2 = new THREE.Color('#cdd9ee'), kaya = new THREE.Color('#8a7464'), kaya2 = new THREE.Color('#5f5048'), ot = new THREE.Color('#3d5a32'), ot2 = new THREE.Color('#2c4426');
            for (let j = 0; j <= HR; j++) {
                const h = (j / HR) * H;
                for (let i = 0; i <= TR; i++) {
                    const t = (i / TR) * Math.PI * 2, rr = yuzeyR(t, h);
                    poz.push(Math.sin(t) * rr, h, Math.cos(t) * rr);
                    const sinir = H * 0.6 + Math.sin(t * 5) * 1.6 + Math.sin(t * 11) * .8, gurul = Math.sin(t * 23 + h * 2.3) * .5 + .5;
                    if (h > sinir) c.copy(kar).lerp(kar2, gurul * .5);
                    else if (h < 2.6 + Math.sin(t * 7) * .8) c.copy(ot).lerp(ot2, gurul);
                    else c.copy(kaya).lerp(kaya2, gurul).lerp(kar2, Math.max(0, (h - sinir + 3) / 3) * .45);
                    renk.push(c.r, c.g, c.b);
                }
            }
            for (let j = 0; j < HR; j++) for (let i = 0; i < TR; i++) { const a = j * (TR + 1) + i, b = a + TR + 1; ind.push(a, b, a + 1, b, b + 1, a + 1); }
            const tepe = poz.length / 3; poz.push(0, H + .4, 0); renk.push(kar.r, kar.g, kar.b);
            for (let i = 0; i < TR; i++) { const a = HR * (TR + 1) + i; ind.push(a, tepe, a + 1); }
            let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3)); g.setIndex(ind);
            g = g.toNonIndexed(); g.computeVertexNormals();
            const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, metalness: 0 }));
            mesh.receiveShadow = true; mesh.castShadow = true; sc.add(mesh); return mesh;
        })();
        // zemin + uzak sıradağlar
        const zemin = new THREE.Mesh(new THREE.CircleGeometry(300, 48), new THREE.MeshStandardMaterial({ color: '#2a3a2a', roughness: 1 })); zemin.rotation.x = -Math.PI / 2; zemin.position.y = -.05; zemin.receiveShadow = true; sc.add(zemin);
        (function () {
            const mat = new THREE.MeshStandardMaterial({ color: '#4a5a78', flatShading: true, roughness: 1 }), mat2 = new THREE.MeshStandardMaterial({ color: '#e8eef8', flatShading: true, roughness: 1 });
            for (let i = 0; i < 26; i++) {
                const a = Math.PI * (0.5 + (i / 25) * 1.9) + (Math.random() - .5) * .1, d = 140 + Math.random() * 80, h = 26 + Math.random() * 36, rr = h * (0.9 + Math.random() * .5);
                const g = new THREE.Group(); const k = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 6 + Math.floor(Math.random() * 3), 1), mat); k.position.y = h / 2; g.add(k);
                const t = new THREE.Mesh(new THREE.ConeGeometry(rr * .32, h * .32, k.geometry.parameters.radialSegments, 1), mat2); t.position.y = h - h * .16 + .05; g.add(t);
                g.position.set(Math.sin(a) * d, 0, Math.cos(a) * d - 20); g.rotation.y = Math.random() * 3; sc.add(g);
            }
            // çam ağaçları dağ eteğinde
            const cam1 = new THREE.MeshStandardMaterial({ color: '#21402a', flatShading: true }), gov = new THREE.MeshStandardMaterial({ color: '#4a3020' });
            const n = zayif ? 60 : 140, tg = new THREE.ConeGeometry(.7, 2.2, 6), gg = new THREE.CylinderGeometry(.12, .15, .6, 5);
            const im = new THREE.InstancedMesh(tg, cam1, n), ig = new THREE.InstancedMesh(gg, gov, n), o = new THREE.Object3D();
            for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, d = R0 + 1.5 + Math.random() * 18, s = .7 + Math.random() * .9; o.position.set(Math.sin(a) * d, 1.1 * s + .55 * s, Math.cos(a) * d); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); o.position.y = .3 * s; o.updateMatrix(); ig.setMatrixAt(i, o.matrix); }
            im.castShadow = true; sc.add(im); sc.add(ig);
        })();
        // bulutlar (yumuşak sprite kümeleri)
        const bulutDoku = tuval(256, 128, (x, w, h) => { for (let i = 0; i < 18; i++) { const cx = 40 + Math.random() * 176, cy = 50 + Math.random() * 40, rr = 18 + Math.random() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
        const bulutlar = [];
        for (let i = 0; i < (zayif ? 10 : 18); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bulutDoku, color: PAL.yildiz > .5 ? '#8a90b8' : '#ffffff', transparent: true, opacity: .55 + Math.random() * .3, depthWrite: false })); const a = Math.PI * (.55 + Math.random() * .9), d = 45 + Math.random() * 45; s.position.set(Math.sin(a) * d, 10 + Math.random() * 24, Math.cos(a) * d - 10); const k = 14 + Math.random() * 16; s.scale.set(k, k / 2, 1); s.userData = { a, d, v: (.006 + Math.random() * .01) * (Math.random() < .5 ? 1 : -1) }; sc.add(s); bulutlar.push(s); }
        m.her.push((dt) => { bulutlar.forEach(b => { b.userData.a += b.userData.v * dt; if (Math.cos(b.userData.a) > -.15) b.userData.v = -b.userData.v; b.position.x = Math.sin(b.userData.a) * b.userData.d; b.position.z = Math.cos(b.userData.a) * b.userData.d - 10; }); });
        // kar taneleri (zirve bölgesi)
        const kar = (function () {
            const n = zayif ? 500 : 1200, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = new Float32Array(n);
            for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * 50; p[i * 3 + 1] = H * .45 + Math.random() * H * .8; p[i * 3 + 2] = (Math.random() - .5) * 40 + 8; v[i] = .6 + Math.random() * 1.2; }
            g.setAttribute('position', new THREE.BufferAttribute(p, 3));
            const pt = new THREE.Points(g, new THREE.PointsMaterial({ size: .22, map: yumusak, color: '#ffffff', transparent: true, opacity: .8, depthWrite: false })); sc.add(pt);
            let ruzgar = 0;
            m.her.push((dt, T) => { const rz = 1.2 + Math.sin(T * .4) * .8 + ruzgar; for (let i = 0; i < n; i++) { p[i * 3 + 1] -= v[i] * dt * (1 + ruzgar * .6); p[i * 3] += rz * dt; if (p[i * 3 + 1] < H * .4) { p[i * 3 + 1] = H * 1.25; p[i * 3] = (Math.random() - .5) * 50; } if (p[i * 3] > 25) p[i * 3] -= 50; } g.attributes.position.needsUpdate = true; ruzgar = Math.max(0, ruzgar - dt * .5); });
            return { firtina(g) { ruzgar = g; } };
        })();

        // ---------------- yol (kayaya oyulmuş patika şeridi) + kenar ışıkları
        const yolOrnek = 700;
        (function () {
            const poz = [], ind = [], nrm = [];
            for (let s = 0; s <= yolOrnek; s++) {
                const f = s / yolOrnek, ic = nokta(f, -0.15), dis = nokta(f, 1.05);
                poz.push(ic.x, ic.y + .06, ic.z, dis.x, dis.y + .06, dis.z); nrm.push(0, 1, 0, 0, 1, 0);
                if (s < yolOrnek) { const a = s * 2; ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
            }
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(ind);
            const yol = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#e2c08c', emissive: '#7a5a30', emissiveIntensity: .35, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })); yol.receiveShadow = true; sc.add(yol);
            // dış kenarda küçük fener noktaları
            const n = 120, fg = new THREE.BufferGeometry(), fp = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) { const q = nokta(i / (n - 1), 1.1); fp[i * 3] = q.x; fp[i * 3 + 1] = q.y + .25; fp[i * 3 + 2] = q.z; }
            fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
            sc.add(new THREE.Points(fg, new THREE.PointsMaterial({ size: .45, map: yumusak, color: '#ffcf7a', transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending })));
        })();
        // zirve bayrağı + işaret ışığı
        const zirve = (function () {
            const g = new THREE.Group(), tp = new THREE.Vector3(0, H + .35, 0);
            const direk = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 8), new THREE.MeshStandardMaterial({ color: '#d9d9d9', metalness: .8, roughness: .3 })); direk.position.y = 1.6; g.add(direk);
            const bayrakG = new THREE.PlaneGeometry(1.8, 1.1, 12, 4); bayrakG.translate(.9, 0, 0);
            const bayrak = new THREE.Mesh(bayrakG, new THREE.MeshStandardMaterial({ color: '#e63946', side: THREE.DoubleSide, roughness: .7 })); bayrak.position.y = 2.6; g.add(bayrak);
            const isaret = new THREE.Sprite(new THREE.SpriteMaterial({ map: yumusak, color: '#ffd166', transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); isaret.scale.set(7, 7, 1); isaret.position.y = 1.4; g.add(isaret);
            g.position.copy(tp); sc.add(g);
            const pos = bayrakG.attributes.position, taban = Float32Array.from(pos.array);
            m.her.push((dt, T) => { for (let i = 0; i < pos.count; i++) { const x = taban[i * 3]; pos.array[i * 3 + 2] = Math.sin(x * 3 - T * 6) * .14 * x; } pos.needsUpdate = true; bayrak.geometry.computeVertexNormals(); isaret.material.opacity = .4 + Math.sin(T * 2.4) * .15; });
            return { g, bayrak, isaret, tp };
        })();
        // ara olay işaretleri + kamplar (kur'da çizilir)
        const sabitler = new THREE.Group(); sc.add(sabitler);
        function sabitTemizle() { while (sabitler.children.length) { const o = sabitler.children.pop(); o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); } }
        let kampBayrak = [];
        function sabitCiz(v) {
            sabitTemizle(); kampBayrak = [];
            (v.cp || []).forEach((f, i) => {
                const p = nokta(f, 1.6), g = new THREE.Group();
                const cadir = new THREE.Mesh(new THREE.ConeGeometry(.75, .95, 4), new THREE.MeshStandardMaterial({ color: ['#e76f51', '#2a9d8f', '#e9c46a', '#8d99ae', '#f4a261'][i % 5], flatShading: true })); cadir.position.y = .47; cadir.rotation.y = Math.PI / 4; cadir.castShadow = true; g.add(cadir);
                const direk = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2, 6), new THREE.MeshStandardMaterial({ color: '#cfcfcf' })); direk.position.set(.9, 1, 0); g.add(direk);
                const bm = new THREE.MeshStandardMaterial({ color: '#4a5468', side: THREE.DoubleSide }); const b = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), bm); b.position.set(1.3, 1.75, 0); g.add(b);
                const no = new THREE.Sprite(new THREE.SpriteMaterial({ map: tuval(128, 128, (x) => { x.fillStyle = 'rgba(10,14,24,.85)'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill(); x.strokeStyle = '#ffd166'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#fff'; x.font = '900 64px ' + YAZI; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), 64, 68); }), depthWrite: false })); no.position.set(0, 2.2, 0); no.scale.set(.9, .9, 1); g.add(no);
                g.position.copy(p); g.lookAt(0, p.y, 0); g.rotateY(Math.PI); sabitler.add(g); kampBayrak.push(bm);
            });
            const o = v.olay || {};
            if (o.tehlike) { // çığ bölgesi: buzlu mavi şerit + uyarı
                const pts = []; for (let k = 0; k <= 30; k++) pts.push(nokta(o.tehlike.bas + (o.tehlike.son - o.tehlike.bas) * k / 30, .45).add(new THREE.Vector3(0, .12, 0)));
                const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .55, 8, false), new THREE.MeshStandardMaterial({ color: '#bfe6ff', emissive: '#6fb6ff', emissiveIntensity: .5, transparent: true, opacity: .45, depthWrite: false })); sabitler.add(tb);
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('❄️'), depthWrite: false })); u.position.copy(nokta((o.tehlike.bas + o.tehlike.son) / 2, 1.4)).add(new THREE.Vector3(0, 2.2, 0)); u.scale.set(1.6, 1.6, 1); sabitler.add(u);
            }
            if (o.kestirme) { // kestirme: altın merdiven/ip, doğrudan iki nokta arası
                const a = nokta(o.kestirme.bas, .8), b = nokta(o.kestirme.son, .8), orta = a.clone().lerp(b, .5).add(new THREE.Vector3(0, .2, 0)).multiplyScalar(1).add(new THREE.Vector3(Math.sin(yolAci((o.kestirme.bas + o.kestirme.son) / 2)) * .6, 0, Math.cos(yolAci((o.kestirme.bas + o.kestirme.son) / 2)) * .6));
                const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, orta, b]), 40, .09, 6, false), new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: .8 })); sabitler.add(tb);
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('🧗'), depthWrite: false })); u.position.copy(orta).add(new THREE.Vector3(0, 1.4, 0)); u.scale.set(1.5, 1.5, 1); sabitler.add(u);
            }
            if (typeof o.bonus === 'number') {
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('⭐'), depthWrite: false })); u.position.copy(nokta(o.bonus, .5)).add(new THREE.Vector3(0, 1.3, 0)); u.scale.set(1.3, 1.3, 1); u.userData.bonus = true; sabitler.add(u);
            }
            cpRenkUygula(v.cpRenk);
        }
        m.her.push((dt, T) => { sabitler.children.forEach(o => { if (o.userData && o.userData.bonus) { o.material.rotation = Math.sin(T * 2) * .3; o.position.y += Math.sin(T * 3) * .004; } }); });
        function cpRenkUygula(renkler) { (renkler || []).forEach((c, i) => { if (kampBayrak[i]) { kampBayrak[i].color.set(c || '#4a5468'); kampBayrak[i].emissive = new THREE.Color(c ? c : '#000'); kampBayrak[i].emissiveIntensity = c ? .35 : 0; } }); }

        // ---------------- parçacıklar (kıvılcım / havai fişek / çığ tozu)
        const fx = (function () {
            const N = zayif ? 2000 : 4000, geo = new THREE.BufferGeometry(), poz = new Float32Array(N * 3), renk = new Float32Array(N * 3), hiz = new Float32Array(N * 3), omur = new Float32Array(N), yerc = new Float32Array(N);
            geo.setAttribute('position', new THREE.BufferAttribute(poz, 3)); geo.setAttribute('color', new THREE.BufferAttribute(renk, 3));
            const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: .32, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: yumusak })); p.frustumCulled = false; sc.add(p);
            let i0 = 0, aktif = 0; for (let i = 0; i < N; i++) poz[i * 3 + 1] = -999; const c = new THREE.Color();
            m.her.push((dt) => { if (!aktif) return; let say = 0; for (let i = 0; i < N; i++) { if (omur[i] <= 0) continue; say++; omur[i] -= dt; hiz[i * 3 + 1] -= yerc[i] * dt; hiz[i * 3] *= .985; hiz[i * 3 + 2] *= .985; poz[i * 3] += hiz[i * 3] * dt; poz[i * 3 + 1] += hiz[i * 3 + 1] * dt; poz[i * 3 + 2] += hiz[i * 3 + 2] * dt; renk[i * 3] *= .993; renk[i * 3 + 1] *= .991; renk[i * 3 + 2] *= .991; if (omur[i] <= 0) poz[i * 3 + 1] = -999; } aktif = say; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; });
            function ekle(x, y, z, vx, vy, vz, om, cc, g) { const i = i0 = (i0 + 1) % N; poz[i * 3] = x; poz[i * 3 + 1] = y; poz[i * 3 + 2] = z; hiz[i * 3] = vx; hiz[i * 3 + 1] = vy; hiz[i * 3 + 2] = vz; omur[i] = om; yerc[i] = g; c.set(cc); renk[i * 3] = c.r; renk[i * 3 + 1] = c.g; renk[i * 3 + 2] = c.b; aktif = Math.max(aktif, 1); }
            return {
                patlat(v, n, renkler, guc) { if (azHareket) n = Math.ceil(n / 4); for (let k = 0; k < n; k++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = (guc || 6) * (.55 + Math.random() * .45); ekle(v.x, v.y, v.z, Math.sin(ph) * Math.cos(th) * s, Math.cos(ph) * s, Math.sin(ph) * Math.sin(th) * s, 1.2 + Math.random() * 1.1, renkler[k % renkler.length], 5); } },
                cig(f1) { // çığ: kar tozu yamaçtan aşağı akar
                    const n = azHareket ? 120 : 600; for (let k = 0; k < n; k++) { const f = f1 + (Math.random() - .3) * .06, q = nokta(f, Math.random() * 2); const d = q.clone().setY(0).normalize(); ekle(q.x + (Math.random() - .5) * 2, q.y + Math.random() * 3 + 1, q.z + (Math.random() - .5) * 2, d.x * (2 + Math.random() * 4), -1 - Math.random() * 3, d.z * (2 + Math.random() * 4), 1.6 + Math.random() * 1.4, Math.random() < .5 ? '#ffffff' : '#cfe6ff', 2); }
                }
            };
        })();

        // ---------------- tırmanıcılar
        let S = [], V = { sporcular: [] }, anim = {}, ipler = [];
        const ipGrup = new THREE.Group(); sc.add(ipGrup);
        const yukleyici = new THREE.TextureLoader();
        const dokuOnbellek = {};
        function karakterDoku(src) { if (!src) return null; if (dokuOnbellek[src]) return dokuOnbellek[src]; const t = yukleyici.load(src); t.encoding = THREE.sRGBEncoding; dokuOnbellek[src] = t; return t; }
        function etiketDoku(metin, renk, aktif) { return tuval(512, 128, (x, w, h) => { x.font = '900 60px ' + YAZI; const tw = Math.min(w - 20, x.measureText(metin).width + 70); const x0 = (w - tw) / 2; x.fillStyle = aktif ? renk : 'rgba(10,12,20,.82)'; x.beginPath(); x.moveTo(x0 + 40, 14); x.arcTo(x0 + tw, 14, x0 + tw, h - 14, 46); x.arcTo(x0 + tw, h - 14, x0, h - 14, 46); x.arcTo(x0, h - 14, x0, 14, 46); x.arcTo(x0, 14, x0 + tw, 14, 46); x.fill(); x.lineWidth = 8; x.strokeStyle = renk; x.stroke(); x.fillStyle = aktif ? '#120a04' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(metin, w / 2, h / 2 + 4); }); }
        function sporcuTemizle() { S.forEach(o => { [o.g].forEach(g => { sc.remove(g); g.traverse(x => { if (x.material) { if (x.material.map && x.material.map !== o.kdoku) x.material.map.dispose(); x.material.dispose(); } if (x.geometry) x.geometry.dispose(); }); }); }); S = []; }
        function yerlesim(i, frac) {
            // aynı yerdekiler üst üste binmesin: sıraya göre yol boyunca küçük kaydırma + içeri/dışarı
            const n = S.length || 1, kay = (i - (n - 1) / 2) * Math.min(.006, .05 / n);
            const f = frac >= 1 ? 1 : Math.max(0, Math.min(.995, frac + kay));
            if (frac >= 1) { const a = (i / n) * Math.PI * 2; return new THREE.Vector3(Math.sin(a) * 1.3, H + .35, Math.cos(a) * 1.3 + .3); }
            return nokta(f, .25 + (i % 3) * .3);
        }
        function sporcuKur(v) {
            sporcuTemizle();
            v.sporcular.forEach((s, i) => {
                const g = new THREE.Group(), kd = karakterDoku(s.img);
                const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: kd, transparent: true, alphaTest: .05 })); sp.center.set(.5, 0); const boy = 1.5; sp.scale.set(boy * (s.oran || 1), boy, 1); sp.userData.i = i; sp.userData.oran = s.oran || 1; g.add(sp);
                const golge = new THREE.Mesh(new THREE.CircleGeometry(.45, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35, depthWrite: false })); golge.rotation.x = -Math.PI / 2; golge.position.y = .03; g.add(golge);
                const halka = new THREE.Mesh(new THREE.RingGeometry(.55, .72, 32), new THREE.MeshBasicMaterial({ color: s.renk, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); halka.rotation.x = -Math.PI / 2; halka.position.y = .05; g.add(halka);
                const et = new THREE.Sprite(new THREE.SpriteMaterial({ map: etiketDoku(s.kisa, s.renk, false), depthWrite: false, depthTest: false, transparent: true })); et.center.set(.5, 0); et.scale.set(1.5, .38, 1); et.position.y = boy + .12; et.renderOrder = 5; et.userData.i = i; g.add(et);
                const sos = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('🆘'), depthWrite: false, depthTest: false, transparent: true, opacity: 0 })); sos.position.y = boy + .95; sos.scale.set(.8, .8, 1); sos.renderOrder = 6; g.add(sos);
                const sarkit = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineBasicMaterial({ color: '#ffd166' })); sarkit.visible = false; g.add(sarkit);
                g.position.copy(yerlesim(i, s.frac)); sc.add(g);
                S.push({ g, sp, et, halka, sos, sarkit, kdoku: kd, frac: s.frac, asili: !!s.asili, aktif: false, k: s.k, renk: s.renk, kisa: s.kisa, sallan: 0, olcek: 1 });
            });
            ipCiz();
        }
        function etiketYenile(o, aktif) { const eski = o.et.material.map; o.et.material.map = etiketDoku(o.kisa, o.renk, aktif); o.et.material.needsUpdate = true; if (eski) eski.dispose(); }
        // ip: aynı takımdakileri yol boyunca birleştiren, hafif sarkan halat
        function ipCiz() {
            while (ipGrup.children.length) { const o = ipGrup.children.pop(); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }
            ipler = [];
            if (!V.ipAcik) return;
            const gr = {}; V.sporcular.forEach((s, i) => { if (s.ip == null || s.ip < 0) return; (gr[s.ip] = gr[s.ip] || []).push(i); });
            Object.keys(gr).forEach(no => { const uye = gr[no]; if (uye.length < 2) return; for (let a = 0; a < uye.length - 1; a++) { const ln = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: IP_RENK[no % IP_RENK.length] })); ipGrup.add(ln); ipler.push({ a: uye[a], b: uye[a + 1], ln, no: +no }); } });
        }
        function ipGuncelle() {
            ipler.forEach(ip => {
                const A = S[ip.a], B = S[ip.b]; if (!A || !B) return;
                const fa = A.anlikFrac != null ? A.anlikFrac : A.frac, fb = B.anlikFrac != null ? B.anlikFrac : B.frac;
                const lo = Math.min(fa, fb), hi = Math.min(1, Math.max(fa, fb)), pts = [];
                const pa = A.g.position.clone().add(new THREE.Vector3(0, .75, 0)), pb = B.g.position.clone().add(new THREE.Vector3(0, .75, 0));
                const ilk = fa <= fb ? pa : pb, sonN = fa <= fb ? pb : pa;
                pts.push(ilk);
                const adim = Math.max(2, Math.min(40, Math.round((hi - lo) * 220)));
                for (let k = 1; k < adim; k++) { const f = lo + (hi - lo) * k / adim; const q = nokta(f, .9); q.y += .55 - Math.sin(Math.PI * k / adim) * .25; pts.push(q); }
                pts.push(sonN);
                const egri = new THREE.CatmullRomCurve3(pts); const yeni = new THREE.TubeGeometry(egri, Math.max(8, adim * 3), .045, 5, false);
                ip.ln.geometry.dispose(); ip.ln.geometry = yeni;
            });
        }
        let ipSay = 0;
        m.her.push((dt, T) => {
            const ai = api.aktif ? api.aktif() : -1;
            S.forEach((o, i) => {
                const akt = i === ai; if (akt !== o.aktif) { o.aktif = akt; etiketYenile(o, akt); }
                o.halka.material.opacity = akt ? .65 + Math.sin(T * 5) * .25 : 0;
                // uzaktan da okunur boy: kameraya uzaklıkla büyür
                const d = cam.position.distanceTo(o.g.position), k = Math.max(1, Math.min(3.2, d / 22)) * (akt ? 1.15 : 1);
                o.olcek += (k - o.olcek) * Math.min(1, dt * 4);
                o.sp.scale.set(1.5 * o.olcek * o.sp.userData.oran, 1.5 * o.olcek, 1);
                o.et.scale.set(1.5 * o.olcek, .38 * o.olcek, 1); o.et.position.y = 1.5 * o.olcek + .12;
                o.sos.position.y = 1.5 * o.olcek + .5 * o.olcek + .5; o.sos.scale.set(.8 * o.olcek, .8 * o.olcek, 1);
                // asılı: patikadan aşağı sarkar, sallanır
                const hedefS = o.asili ? 1 : 0; o.sallan += (hedefS - o.sallan) * Math.min(1, dt * 3);
                if (o.sallan > .01) { const sal = Math.sin(T * 2.2 + i) * .35; o.sp.position.set(Math.sin(sal) * .9 * o.sallan, -.85 * o.sallan, 1.1 * o.sallan); o.sp.material.rotation = -sal * .6 * o.sallan; o.sarkit.visible = true; const pa = o.sarkit.geometry.attributes.position; pa.setXYZ(0, 0, .2, 0); pa.setXYZ(1, o.sp.position.x, o.sp.position.y + 1.3 * o.olcek, o.sp.position.z); pa.needsUpdate = true; }
                else { o.sp.position.set(0, 0, 0); o.sp.material.rotation = 0; o.sarkit.visible = false; }
                o.sos.material.opacity = o.asili ? .75 + Math.sin(T * 6) * .25 : 0;
                if (!o.hop) o.sp.position.y += o.sallan > .01 ? 0 : Math.abs(Math.sin(T * 1.6 + i)) * .03;
            });
            if (ipler.length && ++ipSay % 3 === 0) ipGuncelle();
        });
        // dokun → sporcuyu seç
        const ray = new THREE.Raycaster(), fare = new THREE.Vector2();
        function tik(e) {
            const rc = r.domElement.getBoundingClientRect(); fare.x = ((e.clientX - rc.left) / rc.width) * 2 - 1; fare.y = -((e.clientY - rc.top) / rc.height) * 2 + 1;
            ray.setFromCamera(fare, cam); const hedefler = []; S.forEach(o => { hedefler.push(o.sp, o.et); });
            const h = ray.intersectObjects(hedefler, false)[0]; if (h && h.object.userData.i != null && api.sec) api.sec(h.object.userData.i);
        }
        r.domElement.addEventListener('click', tik);

        // ---------------- kamera
        const bak = new THREE.Vector3(0, H * .45, 0), camHedefPoz = new THREE.Vector3(), camHedefBak = new THREE.Vector3();
        let mod = 'genel', takip = null, camHiz = 1.6;
        function genelPlan(T) {
            // geniş plan: tüm tırmanıcıları ve zirveyi kapsar, hafifçe süzülür
            let lo = H, hi = 0; S.forEach(o => { lo = Math.min(lo, o.g.position.y); hi = Math.max(hi, o.g.position.y); });
            if (!S.length) { lo = 0; hi = H; }
            hi = H + 6; lo = Math.max(0, Math.min(lo - 2, H - 16));
            const orta = (lo + hi) / 2, yay = Math.max(14, hi - lo), uz = yay / (2 * Math.tan(cam.fov * Math.PI / 360)) * (cam.aspect < 1.2 ? 1.05 : 1.15) / Math.max(.6, 1 - .45 * (m.alt > 0 ? m.alt : 0) / (kap.clientHeight || 1)) + Rh(orta) + 4;
            const a = Math.sin(T * .05) * .22;
            camHedefPoz.set(Math.sin(a) * uz, orta + yay * .18, Math.cos(a) * uz); camHedefBak.set(0, orta, 0);
        }
        m.her.push((dt, T) => {
            if (mod === 'genel') genelPlan(T);
            else if (mod === 'takip' && takip) { const p = takip.g.position, d = p.clone().setY(0).normalize(); const yan = new THREE.Vector3(d.z, 0, -d.x); camHedefPoz.copy(p).add(d.multiplyScalar(11)).add(yan.multiplyScalar(2.6)).add(new THREE.Vector3(0, 4, 0)); camHedefBak.copy(p).add(new THREE.Vector3(0, 1, 0)); }
            else if (mod === 'zirve') { const a = T * .25; camHedefPoz.set(Math.sin(a) * 14, H + 5.5, Math.cos(a) * 14); camHedefBak.set(0, H + 1.5, 0); }
            const k = azHareket ? 1 : Math.min(1, dt * camHiz);
            cam.position.lerp(camHedefPoz, k); bak.lerp(camHedefBak, k); cam.lookAt(bak);
            const alt = api.altKapali ? Math.max(0, Math.min(kap.clientHeight * .5, api.altKapali() || 0)) : 0;
            if (Math.abs(alt - (m.alt || 0)) > 2) { m.alt = alt; const w = kap.clientWidth, h = kap.clientHeight; if (alt > 2) cam.setViewOffset(w, h, 0, alt / 2, w, h); else cam.clearViewOffset(); }
            isik.target.position.set(0, H * .4, 0);
        });
        genelPlan(0); cam.position.copy(camHedefPoz).add(new THREE.Vector3(0, 12, 30)); bak.copy(camHedefBak);
        function sars() { try { kap.classList.remove('d3-sarsinti'); void kap.offsetWidth; kap.classList.add('d3-sarsinti'); setTimeout(() => kap.classList.remove('d3-sarsinti'), 600); } catch (e) {} }

        // ---------------- dış arayüz
        function kur(v) { V = v || V; sabitCiz(V); sporcuKur(V); }
        function guncelle(v) {
            const eskiIp = JSON.stringify(V.sporcular.map(s => s.ip)) + V.ipAcik;
            V = v || V;
            if (V.sporcular.length !== S.length || V.sporcular.some((s, i) => !S[i] || S[i].k !== s.k)) return sporcuKur(V);
            V.sporcular.forEach((s, i) => { const o = S[i]; if (anim[i]) return; o.frac = s.frac; o.asili = !!s.asili; o.g.position.copy(yerlesim(i, s.frac)); });
            if (eskiIp !== JSON.stringify(V.sporcular.map(s => s.ip)) + V.ipAcik) ipCiz();
            cpRenkUygula(V.cpRenk);
        }
        // tek seri animasyonu: kamera sporcuya iner, yol boyunca zıplayarak çıkar, olaylar oynar, geniş plana döner
        function ilerlet(i, eski, yeni, o, bitti) {
            o = o || {}; const s = S[i]; let bitti1 = false;
            const bit = () => { if (bitti1) return; bitti1 = true; try { bitti && bitti(); } catch (e) {} };
            if (!s || m.durdu) return bit();
            anim[i] = true; takip = s; mod = 'takip'; camHiz = 2.4;
            const sure = Math.max(1.1, Math.min(2.6, Math.abs(yeni - eski) * 22 + 1)), bek = azHareket ? .2 : .55;
            const ip = o.ip || {};
            if (ip.tur === 'dusme' || ip.tur === 'asili') {
                // kayma: biraz ileri hamle, ayak kayar → ipte sallanır
                at(bek, () => { s.asili = true; sars(); fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, .3, 0)), 40, ['#b8956a', '#8a7058', '#ffffff'], 2.5); });
                at(bek + 1.6, () => { anim[i] = false; s.frac = yeni; mod = 'genel'; camHiz = 1.2; takip = null; bit(); });
                return;
            }
            if (ip.tur === 'toparlandi') at(.1, () => { s.asili = false; });
            tw(bek, sure, e => { const f = eski + (yeni - eski) * e; s.anlikFrac = f; const p = yerlesim(i, f); p.y += Math.abs(Math.sin(e * Math.PI * Math.max(3, Math.round(sure * 4)))) * .45 * (1 - e * .4); s.g.position.copy(p); s.hop = true; }, ease.io);
            const sonT = bek + sure;
            (o.olaylar || []).forEach(ol => {
                if (ol === 'tehlike') at(bek + sure * .5, () => { fx.cig(eski + (yeni - eski) * .5); kar.firtina(4); sars(); });
                if (ol === 'tehlike-atlatti') at(bek + sure * .5, () => { fx.cig(eski + (yeni - eski) * .5); kar.firtina(2); });
                if (ol === 'kestirme') at(bek + .2, () => fx.patlat(s.g.position.clone(), 60, ['#ffd166', '#fff3c4'], 4));
                if (ol === 'bonus') at(sonT - .2, () => fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 90, ['#ffd166', '#ffffff'], 4.5));
            });
            at(sonT, () => {
                s.hop = false; s.anlikFrac = null; s.frac = yeni; s.g.position.copy(yerlesim(i, yeni));
                fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, .6, 0)), o.iyi ? 140 : 50, [s.renk, '#ffffff'], o.iyi ? 5 : 3);
                if (o.cp) fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, 2, 0)), 160, [s.renk, '#ffd166', '#ffffff'], 6);
            });
            let toplamSon = sonT + (o.cp ? 1.2 : .7);
            // kurtarma: kamera ip ortağına geçer, ip gerilir, ortak patikaya çekilir
            if (ip.tur === 'kurtarma' && S[ip.ortakI]) {
                const p2 = S[ip.ortakI]; const t0 = toplamSon - .2;
                at(t0, () => { takip = p2; camHiz = 2.6; });
                at(t0 + .7, () => { p2.asili = false; fx.patlat(p2.g.position.clone().add(new THREE.Vector3(0, 1, 0)), 120, ['#7ee081', '#ffffff', '#ffd166'], 4.5); });
                tw(t0 + .9, 1, e => { const f = ip.ortakEski + (ip.ortakYeni - ip.ortakEski) * e; p2.anlikFrac = f; p2.g.position.copy(yerlesim(ip.ortakI, f)); }, ease.o3);
                at(t0 + 1.95, () => { p2.anlikFrac = null; p2.frac = ip.ortakYeni; });
                toplamSon = t0 + 2.3;
            }
            if (o.zirve) {
                at(sonT + .2, () => { mod = 'zirve'; camHiz = 1.4; zirve.isaret.material.opacity = 1; });
                for (let k = 0; k < 8; k++) at(sonT + .4 + k * .45, () => fx.patlat(new THREE.Vector3((Math.random() - .5) * 16, H + 6 + Math.random() * 6, (Math.random() - .5) * 10), 220, [['#ffd166', '#fff3c4'], ['#ff6b9a', '#ffd2e0'], ['#5cc8ff', '#d6f1ff'], ['#7ee081', '#e3ffe0']][k % 4], 7));
                toplamSon = Math.max(toplamSon, sonT + 3.6);
            }
            at(toplamSon, () => { anim[i] = false; mod = 'genel'; camHiz = 1.1; takip = null; bit(); });
            // güvenlik: sekme gizliyse zaman ilerlemez — oyun kilitli kalmasın
            setTimeout(bit, (toplamSon + 2) * 1000);
        }
        function kapat() {
            if (m.durdu) return; m.durdu = true; cancelAnimationFrame(m.raf); ro.disconnect();
            r.domElement.removeEventListener('click', tik);
            sporcuTemizle(); sabitTemizle();
            Object.keys(dokuOnbellek).forEach(k => { try { dokuOnbellek[k].dispose(); } catch (e) {} });
            dokular.forEach(t => { try { t.dispose(); } catch (e) {} });
            sc.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); });
            try { r.dispose(); r.forceContextLoss(); } catch (e) {}
            r.domElement.remove();
        }
        return { kur, guncelle, ilerlet, kapat };
    };
})();
