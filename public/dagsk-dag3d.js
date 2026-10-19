// 🏔 3B DAĞ TIRMANIŞI (2026-10-19, kullanıcı: "dağ tırmanışını şu ana kadar en iyi görselli, en komplike ve en heyecanlı
// oyuna çevirelim" → 3B dağ + ip takımı/kurtarma seçti). İlk sürüm (alçak poligon + düz şerit yol) için kullanıcı: "görseller
// cidden bu kadar kötü mü olacak, yollar..." → 2. sürüm: gürültülü gerçekçi arazi (sırtlar, kar örtüsü, arka zirveler),
// dağa OYULMUŞ patika (toprak dokusu, ahşap direkli ip korkuluk, fenerler), vadide bulut denizi, gökyüzü/güneş gölgelendirici,
// ışık parlaması (bloom, vendor/three-post-r128.js) ve sinematik renk (ACES + vinyet).
// Oyunun KURALLARI app.js'te kalır (frac, kamplar, ara olaylar, ip takımı); bu dosya yalnız çizer:
//   dagskDag3D(kap, api) → { kur(v), guncelle(v), ilerlet(i, eski, yeni, o, bitti), kapat() }   (WebGL yoksa null)
//   v = { sporcular:[{k, ad, kisa, renk, frac, img, oran, asili, ip}], cp:[frac], cpRenk:[renk|null], olay:{kestirme, tehlike, bonus}, ipAcik }
//   api = { sec(i), aktif() → aktif sporcu no, yavas() → cihaz yavaşsa 2B'ye dön, altKapali() → alttan örtülen px, cp:[frac] }
(function () {
    'use strict';
    function webglVar() { try { let c = document.createElement('canvas'), gl = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')); if (!gl) return false; let d = gl.getExtension('WEBGL_debug_renderer_info'), ad = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; let ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); return !/swiftshader|llvmpipe|software|basic render/i.test(ad); } catch (e) { return false; } }
    const H = 30, BOYUT = 260;
    const IP_RENK = ['#ffd166', '#5cc8ff', '#ff6b9a', '#7ee081', '#c39bff', '#ff9f43', '#4dd6c4', '#f8f8f8'];
    const YAZI = '"Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif';
    const ease = { o3: t => 1 - Math.pow(1 - t, 3), io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
    // ---------------- gürültü + arazi yüksekliği (deterministik: her açılışta aynı dağ)
    function hs(x, y) { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
    function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hs(xi, yi), b = hs(xi + 1, yi), c = hs(xi, yi + 1), d = hs(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
    function fbm(x, y, o) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= .5; } return s; }
    function sirt(x, y, o) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { const n = 1 - Math.abs(vn(x * f + 17, y * f + 31) * 2 - 1); s += a * n * n; f *= 2.07; a *= .5; } return s; }
    function tepe(x, z, cx, cz, h, r, us) { return h * Math.exp(-Math.pow(Math.hypot(x - cx, z - cz) / r, us || 1.8)); }
    function yukOrj(x, z) {
        const ana = tepe(x, z, 0, 0, H, 20, 1.55);
        const arka = Math.max(tepe(x, z, -34, -26, 19, 17), tepe(x, z, 38, -30, 23, 19), tepe(x, z, 6, -62, 27, 24), tepe(x, z, -70, -55, 22, 22), tepe(x, z, 75, -60, 20, 22), tepe(x, z, -62, 8, 11, 18), tepe(x, z, 66, 6, 12, 18));
        const govde = Math.max(ana, arka) + Math.min(ana, arka) * .3;
        const kaba = (sirt(x * .05, z * .05, 5) - .38) * 8 * Math.min(1, govde / 7 + .1);
        const ince = (fbm(x * .2 + 5, z * .2 + 9, 3) - .5) * 1.4 * Math.min(1, govde / 5 + .2);
        return Math.max(0, govde + kaba + ince);
    }
    function css() {
        if (document.getElementById('dag3d-css')) return;
        let st = document.createElement('style'); st.id = 'dag3d-css';
        st.textContent = '.km-dag3d{position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:inherit;pointer-events:none}.km-dag3d canvas{display:block;width:100%;height:100%;pointer-events:auto;cursor:pointer}'
            + '.km-oyun-panel.d3 #km-oyun-svg-dag,.km-oyun-panel.d3 #km-oyun-kayalar-dag{visibility:hidden}'
            + '.km-dag3d.d3-sarsinti canvas{animation:d3Sars .5s linear}@keyframes d3Sars{20%{transform:translate(4px,-3px)}40%{transform:translate(-5px,2px)}60%{transform:translate(3px,3px)}80%{transform:translate(-2px,-2px)}}'
            + '@media (prefers-reduced-motion:reduce){.km-dag3d.d3-sarsinti canvas{animation:none}}';
        document.head.appendChild(st);
    }

    window.dagskDag3D = function (kap, api) {
        if (typeof THREE === 'undefined' || !webglVar()) return null;
        api = api || {};
        css();
        const zayif = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.hardwareConcurrency || 8) <= 4;
        const azHareket = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        let r;
        try { r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
        r.setPixelRatio(Math.min(zayif ? 1.25 : 1.75, window.devicePixelRatio || 1));
        r.outputEncoding = THREE.sRGBEncoding;
        r.shadowMap.enabled = !zayif; r.shadowMap.type = THREE.PCFSoftShadowMap;
        kap.appendChild(r.domElement);
        const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 16 / 9, .2, 1200);
        // ---- ışık parlaması (bloom) + sinematik renk; yoksa düz ACES
        let komp = null, bloom = null;
        const postVar = !zayif && THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass && THREE.ShaderPass;
        if (postVar) {
            try {
                const rt = r.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(4, 4, { type: THREE.HalfFloatType }) : new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
                komp = new THREE.EffectComposer(r, rt);
                komp.addPass(new THREE.RenderPass(sc, cam));
                bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), .42, .5, 1.0); komp.addPass(bloom);
                komp.addPass(new THREE.ShaderPass({
                    uniforms: { tDiffuse: { value: null }, pozlama: { value: .92 } },
                    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
                    fragmentShader: 'uniform sampler2D tDiffuse; uniform float pozlama; varying vec2 vUv;'
                        + 'vec3 aces(vec3 x){ x *= pozlama; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }'
                        + 'void main(){ vec4 t = texture2D(tDiffuse, vUv); vec3 c = aces(t.rgb); c = pow(c, vec3(1.0 / 2.2)); float v = smoothstep(0.98, 0.32, length(vUv - 0.5)); c *= mix(0.68, 1.0, v); gl_FragColor = vec4(c, 1.0); }'
                }));
                r.toneMapping = THREE.NoToneMapping;
            } catch (e) { komp = null; }
        }
        if (!komp) { r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1; }
        const m = { T: 0, isler: [], olaylar: [], her: [], durdu: false };
        const boyut = () => { const w = kap.clientWidth, h = kap.clientHeight; if (!w || !h) return; r.setSize(w, h, false); if (komp) komp.setSize(w * r.getPixelRatio(), h * r.getPixelRatio()); cam.aspect = w / h; cam.fov = w / h < 1.2 ? 55 : 40; m.alt = -1; cam.updateProjectionMatrix(); };
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
            if (m.T < 6 && m.T > .8 && ham < 2000) { m.ks++; m.kt = (m.kt || 0) + ham; if (m.ks >= 20 && m.kt / m.ks > 75) { kapat(); try { api.yavas && api.yavas(); } catch (e) {} return; } }
            m.olaylar = m.olaylar.filter(o => { if (m.T >= o.t) { try { o.f(); } catch (e) {} return false; } return true; });
            m.isler = m.isler.filter(i => { const p = (m.T - i.t0) / i.d; if (p < 0) return true; try { i.f(i.e(Math.min(1, p))); } catch (e) {} return p < 1; });
            m.her.forEach(f => { try { f(dt, m.T); } catch (e) {} });
            if (komp) komp.render(); else r.render(sc, cam);
        };
        m.raf = requestAnimationFrame(dongu);
        const at = (t, f) => m.olaylar.push({ t: m.T + t, f });
        const tw = (t, d, f, e) => m.isler.push({ t0: m.T + t, d: Math.max(.001, d), f, e: e || ease.io });
        const dokular = [];
        function tuval(w, h, ciz, tekrar) { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (tekrar) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } dokular.push(t); return t; }
        const yumusak = tuval(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
        function emojiDoku(e) { return tuval(128, 128, (x) => { x.font = '96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); }); }
        const lin = (h) => new THREE.Color(h).convertSRGBToLinear();

        // ---------------- saat: gündüz / altın saat / gece
        const saat = window.__dag3dSaat != null ? window.__dag3dSaat : new Date().getHours(); // (test: __dag3dSaat)
        const PAL = saat >= 19 || saat < 6
            ? { ust: '#050a24', ufuk: '#2a3466', sis: '#1d2550', gunes: '#cfdcff', yuk: .42, aci: -.5, isik: '#aebfff', isikG: 1.25, hemiU: '#3a4a8a', hemiA: '#141018', hemi: .9, yildiz: 1, bulut: '#6a74a8', fener: 2.2, gece: true }
            : saat >= 16
                ? { ust: '#2b3f86', ufuk: '#ffb070', sis: '#c98a78', gunes: '#ffd29a', yuk: .1, aci: -.7, isik: '#ffcf96', isikG: 2.1, hemiU: '#8a96d0', hemiA: '#4a3426', hemi: .75, yildiz: 0, bulut: '#ffd9c0', fener: 1.2 }
                : { ust: '#2f6fd6', ufuk: '#cfe4ff', sis: '#b8d0ec', gunes: '#fff6e0', yuk: .55, aci: -.6, isik: '#fff2dc', isikG: 2.0, hemiU: '#a8c8ff', hemiA: '#5a4a3a', hemi: .65, yildiz: 0, bulut: '#ffffff', fener: .6 };
        const gunesYon = new THREE.Vector3(Math.sin(PAL.aci) * Math.cos(PAL.yuk), Math.sin(PAL.yuk), -Math.cos(PAL.aci) * Math.cos(PAL.yuk)).normalize();
        sc.fog = new THREE.Fog(PAL.sis, 110, 520);
        // gökyüzü (gölgelendirici: ufuk → tepe, güneş diski + hale)
        const gok = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false, fog: false,
            uniforms: { ust: { value: lin(PAL.ust) }, ufuk: { value: lin(PAL.ufuk) }, alt: { value: lin(PAL.sis) }, gy: { value: gunesYon }, gr: { value: lin(PAL.gunes) }, gece: { value: PAL.gece ? 1 : 0 } },
            vertexShader: 'varying vec3 vY; void main(){ vY = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: 'uniform vec3 ust, ufuk, alt, gy, gr; uniform float gece; varying vec3 vY;'
                + 'void main(){ float e = vY.y; vec3 c = mix(ufuk, ust, smoothstep(0.0, 0.5, e)); c = mix(alt, c, smoothstep(-0.12, 0.03, e)); float g = max(dot(vY, gy), 0.0);'
                + 'c += gr * (pow(g, mix(900.0, 2200.0, gece)) * mix(14.0, 6.0, gece) + pow(g, 14.0) * mix(0.5, 0.15, gece) + pow(g, 3.0) * mix(0.18, 0.04, gece));'
                + 'gl_FragColor = linearToOutputTexel(vec4(c, 1.0)); }'
        }));
        sc.add(gok);
        if (PAL.yildiz) { const n = 1400, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.25 + .12, R = 850; p[i * 3] = Math.cos(a) * Math.cos(e) * R; p[i * 3 + 1] = Math.sin(e) * R; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R; } g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, map: yumusak, transparent: true, opacity: .9, depthWrite: false, fog: false, color: '#ffffff' })); sc.add(st); m.her.push((dt, T) => { st.material.opacity = .75 + Math.sin(T * 1.3) * .15; }); }
        sc.add(new THREE.HemisphereLight(PAL.hemiU, PAL.hemiA, PAL.hemi));
        const isik = new THREE.DirectionalLight(PAL.isik, PAL.isikG); isik.position.copy(gunesYon).multiplyScalar(120); isik.castShadow = !zayif;
        if (!zayif) { isik.shadow.mapSize.set(2048, 2048); Object.assign(isik.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 20, far: 300 }); isik.shadow.bias = -.0006; isik.shadow.normalBias = .03; }
        sc.add(isik); sc.add(isik.target);

        // ---------------- arazi + patika
        const N = zayif ? 170 : 260, HUC = BOYUT / N, Y = new Float32Array((N + 1) * (N + 1));
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) Y[j * (N + 1) + i] = yukOrj(-BOYUT / 2 + i * HUC, -BOYUT / 2 + j * HUC);
        function zeminY(x, z) { const fx = (x + BOYUT / 2) / HUC, fz = (z + BOYUT / 2) / HUC, i = Math.max(0, Math.min(N - 1, Math.floor(fx))), j = Math.max(0, Math.min(N - 1, Math.floor(fz))), u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j)); const a = Y[j * (N + 1) + i], b = Y[j * (N + 1) + i + 1], c = Y[(j + 1) * (N + 1) + i], d = Y[(j + 1) * (N + 1) + i + 1]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
        // zirve: merkeze yakın en yüksek nokta
        const zirveP = (function () { let en = { x: 0, z: 0, y: -1 }; for (let x = -6; x <= 6; x += .5) for (let z = -6; z <= 6; z += .5) { const y = yukOrj(x, z); if (y > en.y) en = { x, z, y }; } return new THREE.Vector3(en.x, en.y, en.z); })();
        const ZY = zirveP.y;
        // patika: zirve çevresinde ön yüzde serpantin; her f için o yüksekliğin kontur noktası (yarıçap ikili aramayla)
        const YP = 520, ham = [];
        for (let k = 0; k <= YP; k++) {
            const f = k / YP, th = .78 * (1 - f * .45) * Math.sin(Math.PI * (f * 5 - .5)), h = .9 + f * (ZY - 1.3);
            const dx = Math.sin(th), dz = Math.cos(th); let lo = 0, hi = 75;
            for (let it = 0; it < 28; it++) { const md = (lo + hi) / 2; if (yukOrj(zirveP.x + dx * md, zirveP.z + dz * md) > h) lo = md; else hi = md; }
            ham.push({ x: zirveP.x + dx * hi, z: zirveP.z + dz * hi, y: h });
        }
        ham[YP] = { x: zirveP.x, z: zirveP.z + .6, y: ZY - .4 };
        for (let gec = 0; gec < 4; gec++) for (let k = 2; k < YP - 2; k++) { const a = ham[k - 2], b = ham[k - 1], c = ham[k + 1], d = ham[k + 2]; ham[k].x = (a.x + b.x * 2 + ham[k].x * 2 + c.x * 2 + d.x) / 8; ham[k].z = (a.z + b.z * 2 + ham[k].z * 2 + c.z * 2 + d.z) / 8; }
        // yay uzunluğuna göre parametre (ilerleme mesafeyle orantılı)
        const uz = [0]; for (let k = 1; k <= YP; k++) uz.push(uz[k - 1] + Math.hypot(ham[k].x - ham[k - 1].x, ham[k].z - ham[k - 1].z, ham[k].y - ham[k - 1].y));
        const YL = uz[YP];
        function yolNokta(f) { const L = Math.max(0, Math.min(1, f)) * YL; let lo = 0, hi = YP; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (uz[md] <= L) lo = md; else hi = md; } const t = (L - uz[lo]) / Math.max(1e-6, uz[hi] - uz[lo]), a = ham[lo], b = ham[hi]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
        function yolDis(f) { // patika ekseninde yatay dik yön, zirveden DIŞARI bakan
            const a = yolNokta(Math.max(0, f - .004)), b = yolNokta(Math.min(1, f + .004)); let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
            let nx = -tz, nz = tx; const p = yolNokta(f); if (nx * (p.x - zirveP.x) + nz * (p.z - zirveP.z) < 0) { nx = -nx; nz = -nz; } return { x: nx, z: nz };
        }
        // nokta(f, d): patika üstünde; d 0..1 → patika içinde (0 iç kenar, .45 orta, 1 dış kenar), >1 → dış yamaç
        const YARI = 1.35;
        function nokta(f, d) { const p = yolNokta(f), n = yolDis(f), yan = ((d == null ? .45 : d) - .45) * 2 * YARI; const x = p.x + n.x * yan, z = p.z + n.z * yan; return new THREE.Vector3(x, Math.abs(yan) <= YARI + .1 ? p.y + .02 : zeminY(x, z), z); }
        const CPF = (api.cp && api.cp.length ? api.cp : [.2, .4, .6, .8]).slice();
        // patikayı araziye oy: şerit düzlenir (kampta geniş düzlük), kenarlar yumuşak şevle kayaya bağlanır
        (function () {
            const kova = {}, KS = 4, ornek = [];
            for (let k = 0; k <= 1400; k++) { const f = k / 1400, p = yolNokta(f); let gen = YARI + .5; CPF.forEach(c => { gen += Math.max(0, 1 - Math.abs(f - c) / .018) * 2.6; }); if (f > .985) gen += 2.2; ornek.push({ x: p.x, z: p.z, y: p.y, g: gen }); const a = Math.floor(p.x / KS) + ',' + Math.floor(p.z / KS); (kova[a] = kova[a] || []).push(ornek.length - 1); }
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
                const x = -BOYUT / 2 + i * HUC, z = -BOYUT / 2 + j * HUC, bx = Math.floor(x / KS), bz = Math.floor(z / KS); let en = null, ed = 1e9;
                for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const l = kova[(bx + a) + ',' + (bz + b)]; if (!l) continue; for (const q of l) { const o = ornek[q], d = Math.hypot(o.x - x, o.z - z) - o.g; if (d < ed) { ed = d; en = o; } } }
                if (!en || ed > 4.5) continue;
                const idx = j * (N + 1) + i, y0 = Y[idx];
                if (ed <= 0) Y[idx] = en.y - .05; else { const t = ed / 4.5, s = t * t * (3 - 2 * t); Y[idx] = en.y - .05 + (y0 - en.y + .05) * s; }
            }
        })();
        // arazi ağı (pürüzsüz gölgeleme, yükseklik/eğime göre renk: çimen → kaya → kar)
        const arazi = (function () {
            const poz = new Float32Array((N + 1) * (N + 1) * 3), uv = new Float32Array((N + 1) * (N + 1) * 2), ind = [];
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = j * (N + 1) + i; poz[k * 3] = -BOYUT / 2 + i * HUC; poz[k * 3 + 1] = Y[k]; poz[k * 3 + 2] = -BOYUT / 2 + j * HUC; uv[k * 2] = i / N; uv[k * 2 + 1] = j / N; }
            for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + N + 1; ind.push(a, b, a + 1, b, b + 1, a + 1); }
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(poz, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(ind); g.computeVertexNormals();
            const nr = g.attributes.normal.array, renk = new Float32Array(poz.length), c = new THREE.Color(), t = new THREE.Color();
            const KAR = lin('#e4ebf6'), KARG = lin('#aebdd6'), KAYA = lin('#6e6258'), KAYA2 = lin('#4a423c'), KAYAA = lin('#8e8276'), CIM = lin('#4d6b34'), CIM2 = lin('#2f4a26'), TOP = lin('#7a6046');
            for (let k = 0; k < poz.length / 3; k++) {
                const x = poz[k * 3], y = poz[k * 3 + 1], z = poz[k * 3 + 2], ny = nr[k * 3 + 1], n1 = fbm(x * .08, z * .08, 4), n2 = vn(x * .9, z * .9), egim = 1 - ny;
                c.copy(CIM2).lerp(CIM, n1);
                const kayaK = Math.min(1, Math.max(0, (egim - .18) / .22) + Math.max(0, (y - 6 - n1 * 6) / 6));
                t.copy(KAYA2).lerp(KAYA, n1).lerp(KAYAA, n2 * .5); c.lerp(t, Math.min(1, kayaK));
                const karCizgi = H * .5 + (n1 - .5) * 8, karK = Math.max(0, Math.min(1, (y - karCizgi) / 2.5)) * Math.max(0, Math.min(1, (ny - .52) / .18));
                t.copy(KARG).lerp(KAR, Math.min(1, ny * 1.1 - .1 + n2 * .2)); c.lerp(t, karK);
                renk[k * 3] = c.r; renk[k * 3 + 1] = c.g; renk[k * 3 + 2] = c.b;
            }
            g.setAttribute('color', new THREE.BufferAttribute(renk, 3));
            const detay = tuval(256, 256, (x, w, h) => { const im = x.createImageData(w, h); for (let p = 0; p < w * h; p++) { const px = p % w, py = (p / w) | 0, v = 200 + (vn(px * .09, py * .09) * 30 + vn(px * .4, py * .4) * 18 + Math.random() * 10); im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = Math.min(255, v); im.data[p * 4 + 3] = 255; } x.putImageData(im, 0, 0); }, true);
            detay.repeat.set(70, 70); detay.encoding = THREE.LinearEncoding;
            const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: detay, roughness: .93, metalness: 0 }));
            mesh.receiveShadow = true; mesh.castShadow = true; sc.add(mesh); return mesh;
        })();
        // patika şeridi: toprak dokusu (çiğnenmiş orta, taşlı kenarlar)
        (function () {
            const dok = tuval(128, 256, (x, w, h) => { x.fillStyle = '#8a6d4c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const px = Math.random() * w, py = Math.random() * h, kenar = Math.abs(px / w - .5) * 2; x.fillStyle = 'rgba(' + (Math.random() < .5 ? '60,44,30' : '170,140,105') + ',' + (.18 + Math.random() * .25) + ')'; x.fillRect(px, py, 1 + Math.random() * 2, 1 + Math.random() * 2); if (kenar > .75 && Math.random() < .25) { x.fillStyle = 'rgba(120,112,104,' + (.5 + Math.random() * .4) + ')'; x.beginPath(); x.arc(px, py, 1.5 + Math.random() * 3.5, 0, 7); x.fill(); } } const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(40,30,22,.55)'); g.addColorStop(.18, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(255,230,190,.12)'); g.addColorStop(.82, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,30,22,.55)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, true);
            const S2 = 900, poz = [], uvs = [], ind = [];
            for (let s = 0; s <= S2; s++) { const f = s / S2, p = yolNokta(f), n = yolDis(f); [-1, 1].forEach(sg => { poz.push(p.x + n.x * YARI * sg, p.y + .07, p.z + n.z * YARI * sg); uvs.push(sg < 0 ? 0 : 1, f * YL / 3); }); if (s < S2) { const a = s * 2; ind.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(ind); g.computeVertexNormals();
            const yol = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: dok, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); yol.receiveShadow = true; sc.add(yol);
            // dış kenarda ahşap direkler + ip korkuluk + fenerler
            const aralik = 2.1, adet = Math.floor(YL / aralik), dg = new THREE.CylinderGeometry(.07, .09, 1.1, 6), dm = new THREE.MeshStandardMaterial({ color: '#5a3d24', roughness: .9 });
            const direk = new THREE.InstancedMesh(dg, dm, adet), o = new THREE.Object3D(), ust = [];
            for (let k = 0; k < adet; k++) { const f = k / adet, p = yolNokta(f), n = yolDis(f), x = p.x + n.x * (YARI + .15), z = p.z + n.z * (YARI + .15); o.position.set(x, p.y + .5, z); o.rotation.set((Math.random() - .5) * .08, 0, (Math.random() - .5) * .08); o.updateMatrix(); direk.setMatrixAt(k, o.matrix); ust.push(new THREE.Vector3(x, p.y + .98, z)); }
            direk.castShadow = true; sc.add(direk);
            const ipN = []; for (let k = 0; k < ust.length - 1; k++) { ipN.push(ust[k]); ipN.push(ust[k].clone().lerp(ust[k + 1], .5).add(new THREE.Vector3(0, -.14, 0))); } ipN.push(ust[ust.length - 1]);
            const korkuluk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ipN), ipN.length * 2, .028, 4, false), new THREE.MeshStandardMaterial({ color: '#d8c39a', roughness: .8 })); sc.add(korkuluk);
            // fener: her 6. direkte sıcak ışık (bloom ile parlar)
            const fn = [], fm = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: PAL.fener * 2.2 }), fk = new THREE.BoxGeometry(.18, .24, .18);
            for (let k = 0; k < ust.length; k += 6) { const b = new THREE.Mesh(fk, fm); b.position.copy(ust[k]).add(new THREE.Vector3(0, .16, 0)); sc.add(b); fn.push(ust[k].clone().add(new THREE.Vector3(0, .16, 0))); }
            const fg = new THREE.BufferGeometry().setFromPoints(fn); const hale = new THREE.Points(fg, new THREE.PointsMaterial({ size: 1.6, map: yumusak, color: '#ffb347', transparent: true, opacity: .55 * Math.min(1, PAL.fener), depthWrite: false, blending: THREE.AdditiveBlending })); sc.add(hale);
        })();
        // ağaçlar (3 katlı çam), kayalar
        (function () {
            const n = zayif ? 240 : 520, o = new THREE.Object3D(), c = new THREE.Color();
            const k1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.1, 2.2, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9 }), n), k2 = new THREE.InstancedMesh(new THREE.ConeGeometry(.85, 1.8, 8), k1.material, n), k3 = new THREE.InstancedMesh(new THREE.ConeGeometry(.55, 1.4, 8), k1.material, n), gv = new THREE.InstancedMesh(new THREE.CylinderGeometry(.13, .18, .9, 6), new THREE.MeshStandardMaterial({ color: '#4a3220' }), n);
            let say = 0, deneme = 0;
            while (say < n && deneme++ < n * 30) {
                const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 70, x = Math.sin(a) * d, z = Math.cos(a) * d, y = zeminY(x, z); if (y > 10 || y < .05) continue;
                const e = Math.abs(zeminY(x + 1, z) - zeminY(x - 1, z)) + Math.abs(zeminY(x, z + 1) - zeminY(x, z - 1)); if (e > 1.6) continue;
                // patikaya ve kameranın baktığı dış yamaca (takip planı) ağaç dikme — sporcuları örtmesin
                let yakin = false; for (let f = 0; f <= 1 && !yakin; f += .005) { const p = yolNokta(f); const dx = x - p.x, dz = z - p.z, dd = Math.hypot(dx, dz); if (dd < YARI + 1.6) yakin = true; else if (dd < 17) { const nn = yolDis(f); if (dx * nn.x + dz * nn.z > dd * .35) yakin = true; } } if (yakin) continue;
                const s = .7 + Math.random() * .8; c.setHSL(.3 + Math.random() * .05, .35 + Math.random() * .2, .16 + Math.random() * .08);
                [[gv, .45], [k1, 1.5], [k2, 2.5], [k3, 3.3]].forEach(([im, h]) => { o.position.set(x, y + h * s, z); o.scale.setScalar(s); o.rotation.y = Math.random() * 6; o.updateMatrix(); im.setMatrixAt(say, o.matrix); if (im !== gv) im.setColorAt(say, c); });
                say++;
            }
            [k1, k2, k3, gv].forEach(im => { im.count = say; im.castShadow = true; im.receiveShadow = true; sc.add(im); });
            const kn = zayif ? 50 : 110, kaya = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.6, 0), new THREE.MeshStandardMaterial({ color: '#7d7268', roughness: 1, flatShading: true }), kn); let ks = 0;
            for (let t = 0; t < kn * 8 && ks < kn; t++) { const f = Math.random(), p = yolNokta(f), nn = yolDis(f), yan = (Math.random() < .5 ? -1 : 1) * (YARI + .7 + Math.random() * 2.5), x = p.x + nn.x * yan, z = p.z + nn.z * yan; o.position.set(x, zeminY(x, z) + .1, z); o.scale.set(.3 + Math.random() * .5, .25 + Math.random() * .35, .3 + Math.random() * .5); o.rotation.set(Math.random() * 3, Math.random() * 3, 0); o.updateMatrix(); kaya.setMatrixAt(ks++, o.matrix); }
            kaya.count = ks; kaya.castShadow = true; kaya.receiveShadow = true; sc.add(kaya);
        })();
        // vadide bulut denizi (dağın çevresinde, sahnenin uzak kenarlarını örter)
        const bulutDeniz = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1), new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, fog: false,
            uniforms: { t: { value: 0 }, renk: { value: lin(PAL.bulut) }, golge: { value: lin(PAL.sis) } },
            vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
            fragmentShader: 'uniform float t; uniform vec3 renk, golge; varying vec3 vP;'
                + 'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }'
                + 'float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1,0)), u.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), u.x), u.y); }'
                + 'float fb(vec2 p){ float s = 0.0, a = 0.5; for(int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= 0.5; } return s; }'
                + 'void main(){ vec2 p = vP.xz * 0.022 + vec2(t * 0.012, t * 0.005); float c = fb(p); float d = length(vP.xz);'
                + 'float a = smoothstep(0.38, 0.7, c) * smoothstep(48.0, 95.0, d) * (1.0 - smoothstep(560.0, 680.0, d));'
                + 'vec3 col = mix(golge, renk, smoothstep(0.35, 0.85, c)); gl_FragColor = linearToOutputTexel(vec4(col, a * 0.95)); }'
        }));
        bulutDeniz.rotation.x = -Math.PI / 2; bulutDeniz.position.y = 3.2; bulutDeniz.renderOrder = 2; sc.add(bulutDeniz);
        m.her.push((dt, T) => { bulutDeniz.material.uniforms.t.value = T; });
        // dağın yamacında süzülen birkaç bulut (derinlik)
        const bulutDoku = tuval(256, 128, (x, w, h) => { for (let i = 0; i < 22; i++) { const cx = 30 + Math.random() * 196, cy = 45 + Math.random() * 45, rr = 16 + Math.random() * 32, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
        const bulutlar = [];
        for (let i = 0; i < (zayif ? 6 : 12); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bulutDoku, color: PAL.bulut, transparent: true, opacity: .45 + Math.random() * .25, depthWrite: false })); const a = Math.PI * (.6 + Math.random() * .8), d = 80 + Math.random() * 70; s.position.set(Math.sin(a) * d, 10 + Math.random() * 30, Math.cos(a) * d - 15); const k = 22 + Math.random() * 22; s.scale.set(k, k / 2.2, 1); s.userData = { a, d, v: (.004 + Math.random() * .006) * (Math.random() < .5 ? 1 : -1) }; sc.add(s); bulutlar.push(s); }
        m.her.push((dt) => { bulutlar.forEach(b => { b.userData.a += b.userData.v * dt; if (Math.cos(b.userData.a) > -.2) b.userData.v = -b.userData.v; b.position.x = Math.sin(b.userData.a) * b.userData.d; b.position.z = Math.cos(b.userData.a) * b.userData.d - 15; }); });
        // kar taneleri / tipi (zirve bölgesi)
        const kar = (function () {
            const n = zayif ? 500 : 1400, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = new Float32Array(n);
            for (let i = 0; i < n; i++) { p[i * 3] = zirveP.x + (Math.random() - .5) * 60; p[i * 3 + 1] = H * .4 + Math.random() * H * .9; p[i * 3 + 2] = zirveP.z + (Math.random() - .5) * 40 + 10; v[i] = .6 + Math.random() * 1.2; }
            g.setAttribute('position', new THREE.BufferAttribute(p, 3));
            const pt = new THREE.Points(g, new THREE.PointsMaterial({ size: .13, map: yumusak, color: '#ffffff', transparent: true, opacity: .6, depthWrite: false })); sc.add(pt);
            let ruzgar = 0;
            m.her.push((dt, T) => { const rz = 1 + Math.sin(T * .4) * .8 + ruzgar * 3; for (let i = 0; i < n; i++) { p[i * 3 + 1] -= v[i] * dt * (1 + ruzgar * .6); p[i * 3] += rz * dt; if (p[i * 3 + 1] < H * .35) { p[i * 3 + 1] = H * 1.3; p[i * 3] = zirveP.x + (Math.random() - .5) * 60; } if (p[i * 3] > zirveP.x + 30) p[i * 3] -= 60; } g.attributes.position.needsUpdate = true; ruzgar = Math.max(0, ruzgar - dt * .5); });
            return { firtina(g) { ruzgar = g; } };
        })();
        // zirve: taş höyük + dalgalanan bayrak + işaret ışığı
        const zirve = (function () {
            const g = new THREE.Group();
            const tm = new THREE.MeshStandardMaterial({ color: '#8a8078', roughness: 1, flatShading: true });
            for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.DodecahedronGeometry(.32 - i * .02, 0), tm); t.position.set((Math.random() - .5) * .5, .2 + i * .17, (Math.random() - .5) * .5); t.rotation.set(Math.random() * 3, Math.random() * 3, 0); t.castShadow = true; g.add(t); }
            const direk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 3.6, 8), new THREE.MeshStandardMaterial({ color: '#d9d9d9', metalness: .8, roughness: .3 })); direk.position.y = 1.8; g.add(direk);
            const bayrakG = new THREE.PlaneGeometry(1.9, 1.15, 14, 5); bayrakG.translate(.95, 0, 0);
            const bayrak = new THREE.Mesh(bayrakG, new THREE.MeshStandardMaterial({ color: '#e63946', side: THREE.DoubleSide, roughness: .7 })); bayrak.position.y = 3; bayrak.castShadow = true; g.add(bayrak);
            const isaret = new THREE.Sprite(new THREE.SpriteMaterial({ map: yumusak, color: '#ffd166', transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); isaret.scale.set(3.2, 3.2, 1); isaret.position.y = 3.2; g.add(isaret);
            g.position.set(zirveP.x, zeminY(zirveP.x, zirveP.z) - .05, zirveP.z - .4); sc.add(g);
            const pos = bayrakG.attributes.position, taban = Float32Array.from(pos.array);
            m.her.push((dt, T) => { for (let i = 0; i < pos.count; i++) { const x = taban[i * 3]; pos.array[i * 3 + 2] = Math.sin(x * 3 - T * 6) * .14 * x; } pos.needsUpdate = true; bayrak.geometry.computeVertexNormals(); isaret.material.opacity = .22 + Math.sin(T * 2.4) * .1; });
            return { g, isaret, tp: g.position.clone().add(new THREE.Vector3(0, 1, 0)) };
        })();

        // ---------------- kamplar + ara olay işaretleri (kur'da çizilir)
        const sabitler = new THREE.Group(); sc.add(sabitler);
        function sabitTemizle() { while (sabitler.children.length) { const o = sabitler.children.pop(); o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); } }
        let kampBayrak = [], ates = [];
        function sabitCiz(v) {
            sabitTemizle(); kampBayrak = []; ates = [];
            (v.cp || CPF).forEach((f, i) => {
                const p = nokta(f, 2.0), g = new THREE.Group(), n = yolDis(f);
                // çadır (üçgen prizma) + kamp ateşi + bayrak
                const cadir = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.7, 3, 1), new THREE.MeshStandardMaterial({ color: ['#e76f51', '#2a9d8f', '#e9c46a', '#8d99ae', '#f4a261'][i % 5], roughness: .8 }));
                cadir.rotation.z = Math.PI / 2; cadir.rotation.y = Math.atan2(n.x, n.z); cadir.position.y = .4; cadir.castShadow = true; g.add(cadir);
                const odun = new THREE.Mesh(new THREE.ConeGeometry(.28, .35, 5), new THREE.MeshStandardMaterial({ color: '#3a2616' })); odun.position.set(-n.x * 1.4, .18, -n.z * 1.4); g.add(odun);
                const alev = new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 6), new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff7a1a', emissiveIntensity: 4 })); alev.position.set(-n.x * 1.4, .55, -n.z * 1.4); g.add(alev);
                const hale = new THREE.Sprite(new THREE.SpriteMaterial({ map: yumusak, color: '#ff9a3a', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); hale.position.copy(alev.position); hale.scale.set(2.4, 2.4, 1); g.add(hale); ates.push({ alev, hale });
                const direk = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2.4, 6), new THREE.MeshStandardMaterial({ color: '#cfcfcf' })); direk.position.set(n.z * 1.1, 1.2, -n.x * 1.1); g.add(direk);
                const bm = new THREE.MeshStandardMaterial({ color: '#4a5468', side: THREE.DoubleSide, roughness: .7 }); const b = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), bm); b.position.set(n.z * 1.1 + .45, 2.15, -n.x * 1.1); g.add(b); kampBayrak.push(bm);
                const no = new THREE.Sprite(new THREE.SpriteMaterial({ map: tuval(128, 128, (x) => { x.fillStyle = 'rgba(10,14,24,.85)'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill(); x.strokeStyle = '#ffd166'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#fff'; x.font = '900 64px ' + YAZI; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), 64, 68); }), depthWrite: false })); no.position.set(n.z * 1.1, 2.9, -n.x * 1.1); no.scale.set(.7, .7, 1); g.add(no);
                g.position.copy(p); sabitler.add(g);
            });
            const o = v.olay || {};
            if (o.tehlike) { // çığ bölgesi: patikada buz + yamaçta kar yığınları + uyarı levhası
                const S2 = 80, poz = [], ind = [];
                for (let s = 0; s <= S2; s++) { const f = o.tehlike.bas + (o.tehlike.son - o.tehlike.bas) * s / S2, p = yolNokta(f), n = yolDis(f); [-1, 1].forEach(sg => poz.push(p.x + n.x * YARI * sg, p.y + .1, p.z + n.z * YARI * sg)); if (s < S2) { const a = s * 2; ind.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
                const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setIndex(ind); g.computeVertexNormals();
                sabitler.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#7fa6c2', emissive: '#7fc4ff', emissiveIntensity: .04, roughness: .7, metalness: 0, transparent: true, opacity: .6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })));
                const km = new THREE.MeshStandardMaterial({ color: '#c9d8e8', roughness: .7 });
                for (let k = 0; k < 14; k++) { const f = o.tehlike.bas + Math.random() * (o.tehlike.son - o.tehlike.bas), q = nokta(f, -0.6 - Math.random() * 1.5); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.18 + Math.random() * .28, 0), km); b.position.copy(q); b.position.y = zeminY(q.x, q.z) + .2; b.castShadow = true; sabitler.add(b); }
                const lp = nokta((o.tehlike.bas + o.tehlike.son) / 2, 1.35), lv = new THREE.Group();
                const ld = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#5a3d24' })); ld.position.y = .8; lv.add(ld);
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: tuval(256, 256, (x) => { x.fillStyle = '#ffd400'; x.beginPath(); x.moveTo(128, 18); x.lineTo(240, 226); x.lineTo(16, 226); x.closePath(); x.fill(); x.lineWidth = 14; x.strokeStyle = '#111'; x.stroke(); x.font = '110px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('❄️', 128, 160); }), depthWrite: false })); u.position.y = 1.9; u.scale.set(1.2, 1.2, 1); lv.add(u);
                lv.position.copy(lp); sabitler.add(lv);
            }
            if (o.kestirme) { // kestirme: kayaya çakılı altın sabit ip (iki kıvrımı birleştirir)
                const a = nokta(o.kestirme.bas, .1), b = nokta(o.kestirme.son, .1), pts = [];
                for (let k = 0; k <= 16; k++) { const t = k / 16, q = a.clone().lerp(b, t); q.y = Math.max(q.y, zeminY(q.x, q.z)) + .5 + Math.sin(Math.PI * t) * .4; pts.push(q); }
                sabitler.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .06, 6, false), new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 1.6, metalness: .6, roughness: .3 })));
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('🧗'), depthWrite: false })); u.position.copy(pts[8]).add(new THREE.Vector3(0, 1.2, 0)); u.scale.set(1.5, 1.5, 1); sabitler.add(u);
            }
            if (typeof o.bonus === 'number') {
                const u = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiDoku('⭐'), depthWrite: false, color: '#fff3c4' })); u.position.copy(nokta(o.bonus, .45)).add(new THREE.Vector3(0, 1.4, 0)); u.scale.set(1.3, 1.3, 1); u.userData.bonus = true; sabitler.add(u);
                const hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: yumusak, color: '#ffd166', transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); hl.position.copy(u.position); hl.scale.set(3, 3, 1); sabitler.add(hl);
            }
            cpRenkUygula(v.cpRenk);
        }
        m.her.push((dt, T) => {
            sabitler.children.forEach(o => { if (o.userData && o.userData.bonus) o.material.rotation = Math.sin(T * 2) * .3; });
            ates.forEach((a, i) => { const t = 1 + Math.sin(T * 13 + i) * .12 + Math.sin(T * 7.3 + i * 2) * .1; a.alev.scale.set(1, t, 1); a.hale.material.opacity = .5 + (t - 1) * 1.5; });
        });
        function cpRenkUygula(renkler) { (renkler || []).forEach((c, i) => { if (kampBayrak[i]) { kampBayrak[i].color.set(c || '#4a5468'); kampBayrak[i].emissive = new THREE.Color(c ? c : '#000'); kampBayrak[i].emissiveIntensity = c ? .5 : 0; } }); }

        // ---------------- parçacıklar (kıvılcım / havai fişek / çığ tozu)
        const fx = (function () {
            const NP = zayif ? 2000 : 5000, geo = new THREE.BufferGeometry(), poz = new Float32Array(NP * 3), renk = new Float32Array(NP * 3), hiz = new Float32Array(NP * 3), omur = new Float32Array(NP), yerc = new Float32Array(NP);
            geo.setAttribute('position', new THREE.BufferAttribute(poz, 3)); geo.setAttribute('color', new THREE.BufferAttribute(renk, 3));
            const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: .34, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: yumusak })); p.frustumCulled = false; sc.add(p);
            let i0 = 0, aktif = 0; for (let i = 0; i < NP; i++) poz[i * 3 + 1] = -999; const c = new THREE.Color();
            m.her.push((dt) => { if (!aktif) return; let say = 0; for (let i = 0; i < NP; i++) { if (omur[i] <= 0) continue; say++; omur[i] -= dt; hiz[i * 3 + 1] -= yerc[i] * dt; hiz[i * 3] *= .985; hiz[i * 3 + 2] *= .985; poz[i * 3] += hiz[i * 3] * dt; poz[i * 3 + 1] += hiz[i * 3 + 1] * dt; poz[i * 3 + 2] += hiz[i * 3 + 2] * dt; renk[i * 3] *= .993; renk[i * 3 + 1] *= .991; renk[i * 3 + 2] *= .991; if (omur[i] <= 0) poz[i * 3 + 1] = -999; } aktif = say; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; });
            function ekle(x, y, z, vx, vy, vz, om, cc, g, parlak) { const i = i0 = (i0 + 1) % NP; poz[i * 3] = x; poz[i * 3 + 1] = y; poz[i * 3 + 2] = z; hiz[i * 3] = vx; hiz[i * 3 + 1] = vy; hiz[i * 3 + 2] = vz; omur[i] = om; yerc[i] = g; c.set(cc); const k = parlak || 1.6; renk[i * 3] = c.r * k; renk[i * 3 + 1] = c.g * k; renk[i * 3 + 2] = c.b * k; aktif = Math.max(aktif, 1); }
            return {
                patlat(v, n, renkler, guc) { if (azHareket) n = Math.ceil(n / 4); for (let k = 0; k < n; k++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = (guc || 6) * (.55 + Math.random() * .45); ekle(v.x, v.y, v.z, Math.sin(ph) * Math.cos(th) * s, Math.cos(ph) * s, Math.sin(ph) * Math.sin(th) * s, 1.2 + Math.random() * 1.1, renkler[k % renkler.length], 5, 1.4); } },
                cig(f1) { // çığ: kar tozu yamaçtan aşağı akar
                    const n = azHareket ? 150 : 900; for (let k = 0; k < n; k++) { const f = Math.max(0, Math.min(1, f1 + (Math.random() - .2) * .05)), q = nokta(f, -1.5 + Math.random() * 3); const d = new THREE.Vector3(q.x - zirveP.x, 0, q.z - zirveP.z).normalize(); ekle(q.x + (Math.random() - .5) * 2, q.y + Math.random() * 4 + 1.5, q.z + (Math.random() - .5) * 2, d.x * (2 + Math.random() * 5), -1 - Math.random() * 3, d.z * (2 + Math.random() * 5), 1.8 + Math.random() * 1.4, Math.random() < .5 ? '#ffffff' : '#d6ecff', 2, 1); }
                }
            };
        })();

        // ---------------- tırmanıcılar
        let S = [], V = { sporcular: [] }, anim = {}, ipler = [];
        const ipGrup = new THREE.Group(); sc.add(ipGrup);
        const yukleyici = new THREE.TextureLoader();
        const dokuOnbellek = {};
        function karakterDoku(src) { if (!src) return null; if (dokuOnbellek[src]) return dokuOnbellek[src]; const t = yukleyici.load(src); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; dokuOnbellek[src] = t; return t; }
        function etiketDoku(metin, renk, aktif) { return tuval(512, 128, (x, w, h) => { x.font = '900 60px ' + YAZI; const tw = Math.min(w - 20, x.measureText(metin).width + 70); const x0 = (w - tw) / 2; x.fillStyle = aktif ? renk : 'rgba(10,12,20,.82)'; x.beginPath(); x.moveTo(x0 + 40, 14); x.arcTo(x0 + tw, 14, x0 + tw, h - 14, 46); x.arcTo(x0 + tw, h - 14, x0, h - 14, 46); x.arcTo(x0, h - 14, x0, 14, 46); x.arcTo(x0, 14, x0 + tw, 14, 46); x.fill(); x.lineWidth = 8; x.strokeStyle = renk; x.stroke(); x.fillStyle = aktif ? '#120a04' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(metin, w / 2, h / 2 + 4); }); }
        function sporcuTemizle() { S.forEach(o => { sc.remove(o.g); o.g.traverse(x => { if (x.material) { if (x.material.map && x.material.map !== o.kdoku) x.material.map.dispose(); x.material.dispose(); } if (x.geometry) x.geometry.dispose(); }); }); S = []; }
        function yerlesim(i, frac) {
            // aynı yerdekiler üst üste binmesin: sıraya göre yol boyunca küçük kaydırma + iç/dış şerit
            const n = S.length || 1, kay = (i - (n - 1) / 2) * Math.min(.005, .045 / n);
            if (frac >= 1) { const a = (i / n) * Math.PI * 2, x = zirveP.x + Math.sin(a) * 1.6, z = zirveP.z + Math.cos(a) * 1.6 + .3; return new THREE.Vector3(x, zeminY(x, z), z); }
            const f = Math.max(0, Math.min(.985, frac + kay));
            return nokta(f, .2 + (i % 3) * .3);
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
        // ip: aynı takımdakileri patika boyunca birleştiren, hafif sarkan renkli halat
        function ipCiz() {
            while (ipGrup.children.length) { const o = ipGrup.children.pop(); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }
            ipler = [];
            if (!V.ipAcik) return;
            const gr = {}; V.sporcular.forEach((s, i) => { if (s.ip == null || s.ip < 0) return; (gr[s.ip] = gr[s.ip] || []).push(i); });
            Object.keys(gr).forEach(no => { const uye = gr[no]; if (uye.length < 2) return; for (let a = 0; a < uye.length - 1; a++) { const ln = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: IP_RENK[no % IP_RENK.length], emissive: IP_RENK[no % IP_RENK.length], emissiveIntensity: .35, roughness: .6 })); ipGrup.add(ln); ipler.push({ a: uye[a], b: uye[a + 1], ln, no: +no }); } });
        }
        function ipGuncelle() {
            ipler.forEach(ip => {
                const A = S[ip.a], B = S[ip.b]; if (!A || !B) return;
                const fa = A.anlikFrac != null ? A.anlikFrac : A.frac, fb = B.anlikFrac != null ? B.anlikFrac : B.frac;
                const lo = Math.min(fa, fb), hi = Math.min(1, Math.max(fa, fb)), pts = [];
                const pa = A.g.position.clone().add(new THREE.Vector3(0, .75, 0)), pb = B.g.position.clone().add(new THREE.Vector3(0, .75, 0));
                pts.push(fa <= fb ? pa : pb);
                const adim = Math.max(2, Math.min(40, Math.round((hi - lo) * 220)));
                for (let k = 1; k < adim; k++) { const f = lo + (hi - lo) * k / adim; const q = nokta(f, .75); q.y += .55 - Math.sin(Math.PI * k / adim) * .25; pts.push(q); }
                pts.push(fa <= fb ? pb : pa);
                const yeni = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, adim * 3), .045, 5, false);
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
                const d = cam.position.distanceTo(o.g.position), k = Math.max(1, Math.min(3.4, d / 22)) * (akt ? 1.15 : 1);
                o.olcek += (k - o.olcek) * Math.min(1, dt * 4);
                o.sp.scale.set(1.5 * o.olcek * o.sp.userData.oran, 1.5 * o.olcek, 1);
                o.et.scale.set(1.5 * o.olcek, .38 * o.olcek, 1); o.et.position.y = 1.5 * o.olcek + .12;
                o.sos.position.y = 1.5 * o.olcek + .5 * o.olcek + .5; o.sos.scale.set(.8 * o.olcek, .8 * o.olcek, 1);
                // asılı: patika kenarından aşağı sarkar, sallanır
                const hedefS = o.asili ? 1 : 0; o.sallan += (hedefS - o.sallan) * Math.min(1, dt * 3);
                if (o.sallan > .01) { const sal = Math.sin(T * 2.2 + i) * .35, n = yolDis(o.frac); o.sp.position.set((n.x * 1.6 + Math.sin(sal) * .6) * o.sallan, -.9 * o.sallan, (n.z * 1.6 + Math.cos(sal) * .2) * o.sallan); o.sp.material.rotation = -sal * .6 * o.sallan; o.sarkit.visible = true; const pa = o.sarkit.geometry.attributes.position; pa.setXYZ(0, n.x * YARI * .8, .3, n.z * YARI * .8); pa.setXYZ(1, o.sp.position.x, o.sp.position.y + 1.3 * o.olcek, o.sp.position.z); pa.needsUpdate = true; }
                else { o.sp.position.set(0, 0, 0); o.sp.material.rotation = 0; o.sarkit.visible = false; }
                o.sos.material.opacity = o.asili ? .75 + Math.sin(T * 6) * .25 : 0;
                if (!o.hop && o.sallan <= .01) o.sp.position.y += Math.abs(Math.sin(T * 1.6 + i)) * .03;
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
            // geniş plan: patikanın tamamı ve zirve; skor kutusu altı örtüyorsa biraz geri çekilir
            const lo = 0, hi = ZY + 5, orta = (lo + hi) / 2 + 2, yay = hi - lo;
            const uzak = yay / (2 * Math.tan(cam.fov * Math.PI / 360)) * (cam.aspect < 1.2 ? 1.25 : 1.12) / Math.max(.6, 1 - .45 * (m.alt > 0 ? m.alt : 0) / (kap.clientHeight || 1)) + 18;
            const a = Math.sin(T * .045) * .2;
            camHedefPoz.set(zirveP.x + Math.sin(a) * uzak, orta + 6, zirveP.z + Math.cos(a) * uzak); camHedefBak.set(zirveP.x, orta - 2, zirveP.z);
        }
        m.her.push((dt, T) => {
            if (mod === 'genel') genelPlan(T);
            else if (mod === 'takip' && takip) { const p = takip.g.position, d = new THREE.Vector3(p.x - zirveP.x, 0, p.z - zirveP.z).normalize(); const yan = new THREE.Vector3(d.z, 0, -d.x); camHedefPoz.copy(p).add(d.multiplyScalar(12.5)).add(yan.multiplyScalar(2.6)).add(new THREE.Vector3(0, 5.5, 0)); camHedefPoz.y = Math.max(camHedefPoz.y, zeminY(camHedefPoz.x, camHedefPoz.z) + 3.5); camHedefBak.copy(p).add(new THREE.Vector3(0, 1, 0)); }
            else if (mod === 'zirve') { const a = T * .25; camHedefPoz.set(zirveP.x + Math.sin(a) * 13, ZY + 5, zirveP.z + Math.cos(a) * 13); camHedefBak.set(zirveP.x, ZY + 1.4, zirveP.z); }
            const k = azHareket ? 1 : Math.min(1, dt * camHiz);
            cam.position.lerp(camHedefPoz, k); bak.lerp(camHedefBak, k); cam.lookAt(bak);
            const alt = api.altKapali ? Math.max(0, Math.min(kap.clientHeight * .5, api.altKapali() || 0)) : 0;
            if (Math.abs(alt - (m.alt || 0)) > 2) { m.alt = alt; const w = kap.clientWidth, h = kap.clientHeight; if (alt > 2) cam.setViewOffset(w, h, 0, alt / 2, w, h); else cam.clearViewOffset(); }
            isik.target.position.set(zirveP.x, H * .35, zirveP.z + 8);
        });
        genelPlan(0); cam.position.copy(camHedefPoz).add(new THREE.Vector3(0, 14, 40)); bak.copy(camHedefBak);
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
        // tek seri animasyonu: kamera sporcuya iner, patika boyunca zıplayarak çıkar, olaylar oynar, geniş plana döner
        function ilerlet(i, eski, yeni, o, bitti) {
            o = o || {}; const s = S[i]; let bitti1 = false;
            const bit = () => { if (bitti1) return; bitti1 = true; try { bitti && bitti(); } catch (e) {} };
            if (!s || m.durdu) return bit();
            anim[i] = true; takip = s; mod = 'takip'; camHiz = 2.4;
            const sure = Math.max(1.1, Math.min(2.6, Math.abs(yeni - eski) * 22 + 1)), bek = azHareket ? .2 : .55;
            const ip = o.ip || {};
            if (ip.tur === 'dusme' || ip.tur === 'asili') {
                at(bek, () => { s.asili = true; sars(); fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, .3, 0)), 50, ['#b8956a', '#8a7058', '#ffffff'], 2.5); });
                at(bek + 1.6, () => { anim[i] = false; s.frac = yeni; mod = 'genel'; camHiz = 1.2; takip = null; bit(); });
                setTimeout(bit, (bek + 3.6) * 1000);
                return;
            }
            if (ip.tur === 'toparlandi') at(.1, () => { s.asili = false; });
            tw(bek, sure, e => { const f = eski + (yeni - eski) * e; s.anlikFrac = f; const p = yerlesim(i, f); p.y += Math.abs(Math.sin(e * Math.PI * Math.max(3, Math.round(sure * 4)))) * .45 * (1 - e * .4); s.g.position.copy(p); s.hop = true; }, ease.io);
            const sonT = bek + sure;
            (o.olaylar || []).forEach(ol => {
                if (ol === 'tehlike') at(bek + sure * .5, () => { fx.cig(eski + (yeni - eski) * .5); kar.firtina(4); sars(); });
                if (ol === 'tehlike-atlatti') at(bek + sure * .5, () => { fx.cig(eski + (yeni - eski) * .5); kar.firtina(2); });
                if (ol === 'kestirme') at(bek + .2, () => fx.patlat(s.g.position.clone(), 70, ['#ffd166', '#fff3c4'], 4));
                if (ol === 'bonus') at(sonT - .2, () => fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 110, ['#ffd166', '#ffffff'], 4.5));
            });
            at(sonT, () => {
                s.hop = false; s.anlikFrac = null; s.frac = yeni; s.g.position.copy(yerlesim(i, yeni));
                fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, .6, 0)), o.iyi ? 160 : 60, [s.renk, '#ffffff'], o.iyi ? 5 : 3);
                if (o.cp) fx.patlat(s.g.position.clone().add(new THREE.Vector3(0, 2, 0)), 180, [s.renk, '#ffd166', '#ffffff'], 6);
            });
            let toplamSon = sonT + (o.cp ? 1.2 : .7);
            // kurtarma: kamera ip ortağına geçer, ip gerilir, ortak patikaya çekilir
            if (ip.tur === 'kurtarma' && S[ip.ortakI]) {
                const p2 = S[ip.ortakI]; const t0 = toplamSon - .2;
                at(t0, () => { takip = p2; camHiz = 2.6; });
                at(t0 + .7, () => { p2.asili = false; fx.patlat(p2.g.position.clone().add(new THREE.Vector3(0, 1, 0)), 140, ['#7ee081', '#ffffff', '#ffd166'], 4.5); });
                tw(t0 + .9, 1, e => { const f = ip.ortakEski + (ip.ortakYeni - ip.ortakEski) * e; p2.anlikFrac = f; p2.g.position.copy(yerlesim(ip.ortakI, f)); }, ease.o3);
                at(t0 + 1.95, () => { p2.anlikFrac = null; p2.frac = ip.ortakYeni; });
                toplamSon = t0 + 2.3;
            }
            if (o.zirve) {
                at(sonT + .2, () => { mod = 'zirve'; camHiz = 1.4; });
                for (let k = 0; k < 9; k++) at(sonT + .4 + k * .45, () => fx.patlat(new THREE.Vector3(zirveP.x + (Math.random() - .5) * 18, ZY + 7 + Math.random() * 7, zirveP.z + (Math.random() - .5) * 12), 240, [['#ffd166', '#fff3c4'], ['#ff6b9a', '#ffd2e0'], ['#5cc8ff', '#d6f1ff'], ['#7ee081', '#e3ffe0']][k % 4], 7));
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
            try { if (komp) komp.renderTarget1.dispose(), komp.renderTarget2.dispose(); } catch (e) {}
            try { r.dispose(); r.forceContextLoss(); } catch (e) {}
            r.domElement.remove();
        }
        return { kur, guncelle, ilerlet, kapat };
    };
})();
