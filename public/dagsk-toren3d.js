// 🏟 3B MADALYA TÖRENİ — "Stadyum gecesi" (2026-10-18, kullanıcı 3 tören taslağından A'yı seçti: "A yap ve uygula hepsine").
// Yarışma (TV senkronlu), Oyunlar ve Dönem kupası törenlerinin ORTAK görseli. Zaman çizelgesi/İleri/TV eşlemesi
// dagsk-km-yarisma-pro.js'teki yzTorenTik'te kalır; bu dosya yalnız sahneyi çizer ve her tikte gelen durumu uygular:
//   durum({gi, sh, acilmis:[3,2,1 içinden açılanlar], son})   geriSay(n)   kapat()
// İlk durum çağrısı (ekran geç açıldı / İleri) animasyonsuz yerleşir; sonrakiler canlı oynar.
// WebGL yoksa dagskToren3D null döner → eski 2B kürsü kullanılır. three.js r128 yerel: /vendor/three-r128.min.js
(function () {
    'use strict';
    // Donanım hızlandırması yoksa (SwiftShader/llvmpipe gibi yazılımsal çizim) 3B tören ana iş parçacığını kilitler, zaman çizelgesi
    // takılır → hiç kurma, 2B kürsü kalsın.
    function webglVar() { try { let c = document.createElement('canvas'), gl = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')); if (!gl) return false; let d = gl.getExtension('WEBGL_debug_renderer_info'), ad = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; let ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); return !/swiftshader|llvmpipe|software|basic render/i.test(ad); } catch (e) { return false; } }
    const RENK = { 1: '#f6c945', 2: '#d5dce4', 3: '#d4894a' };
    const BX = { 1: 0, 2: -3.2, 3: 3.2 }, BY = { 1: 2.4, 2: 1.6, 3: 1.1 };
    const YAZI = '"Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif';
    const ease = { o3: t => 1 - Math.pow(1 - t, 3), io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c = 1.8; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
    function basHarf(ad) { let p = String(ad || '?').trim().split(/\s+/); return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : (p[0] || '').charAt(1) || '')).toLocaleUpperCase('tr-TR'); }
    function kisaAd(ad) { let p = String(ad || '').trim().split(/\s+/); return p.length > 1 ? p.slice(0, -1).join(' ') + ' ' + p[p.length - 1].charAt(0) + '.' : String(ad || ''); }

    function css() {
        if (document.getElementById('yz3-css')) return;
        let st = document.createElement('style'); st.id = 'yz3-css';
        st.textContent = [
            '.yz-toren.uc3{background:#05030a}',
            '.yz3-tuval{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}',
            '.yz-toren.uc3 .yz-tor-kursu{visibility:hidden}.yz-toren.uc3 .yz-tor-isik,.yz-toren.uc3 .yz-tor-konfeti{display:none}',
            '.yz-toren.uc3 .yz-tor-bas{z-index:2;text-shadow:0 2px 18px rgba(0,0,0,.8)}.yz-toren.uc3 .yz-tor-bas{margin-top:2vh}.yz-toren.uc3 .yz-tor-ust{font-size:1.1vw}.yz-toren.uc3 .yz-tor-baslik{font-size:2.8vw}.yz-toren.uc3 .yz-tor-grup{font-size:1.6vw;min-height:0}',
            '.yz-toren.uc3 .yz-tor-btn{z-index:5}.yz-toren.uc3 .yz-tor-final{z-index:3}',
            '.yz-toren.uc3.final .yz-tor-final{background:rgba(6,4,12,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-radius:2vw;padding:3vh 2vw;flex:0 1 auto;margin:auto 0}',
            '.yz3-vin{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,transparent 55%,rgba(0,0,0,.55) 100%)}',
            '.yz3-alt{position:absolute;left:4vw;bottom:6vh;z-index:3;display:flex;align-items:stretch;pointer-events:none;opacity:0;transform:translateX(-4vw);transition:opacity .45s,transform .6s cubic-bezier(.2,1,.3,1);box-shadow:0 1vh 4vh rgba(0,0,0,.5)}',
            '.yz3-alt.in{opacity:1;transform:none}',
            '.yz3-alt .no{font:900 6vw/1 ' + YAZI + ';padding:.15em .32em;background:var(--rc,#f6c945);color:#140b04;display:grid;place-items:center}',
            '.yz3-alt .ic{background:rgba(12,8,6,.92);border-top:.4vh solid var(--rc,#f6c945);padding:1.2vh 1.6vw;display:grid;align-content:center;gap:.5vh;min-width:22vw}',
            '.yz3-alt .ad{font:900 3.4vw/1 ' + YAZI + ';color:#fff;letter-spacing:.01em}',
            '.yz3-alt .alt{font:800 1.25vw/1.2 system-ui,sans-serif;color:#e8d9c8;letter-spacing:.12em;text-transform:uppercase}',
            '.yz3-geri{position:absolute;inset:0;z-index:4;display:grid;place-items:center;pointer-events:none;font:900 26vw/1 ' + YAZI + ';color:#fff;text-shadow:0 0 6vw rgba(253,142,1,.85);opacity:0}',
            '.yz3-flas{position:absolute;inset:0;z-index:4;background:#fff;opacity:0;pointer-events:none}',
            '@media (max-width:700px){.yz3-alt .no{font-size:11vw}.yz3-alt .ad{font-size:6vw}.yz3-alt .alt{font-size:2.6vw}.yz3-alt .ic{min-width:46vw}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    window.dagskToren3D = function (el, ops) {
        if (typeof THREE === 'undefined' || !webglVar()) return null;
        ops = ops || {};
        css();
        const zayif = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.hardwareConcurrency || 8) <= 4;
        const azHareket = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        let r;
        try { r = new THREE.WebGLRenderer({ antialias: !zayif, powerPreference: 'high-performance' }); } catch (e) { return null; }
        r.setPixelRatio(Math.min(zayif ? 1.25 : 2, window.devicePixelRatio || 1));
        r.shadowMap.enabled = !zayif; r.shadowMap.type = THREE.PCFSoftShadowMap;
        r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .9; r.outputEncoding = THREE.sRGBEncoding;
        r.domElement.className = 'yz3-tuval';
        el.insertBefore(r.domElement, el.firstChild);
        let ek = document.createElement('div');
        ek.innerHTML = '<div class="yz3-vin"></div><div class="yz3-alt"><div class="no"></div><div class="ic"><div class="ad"></div><div class="alt"></div></div></div><div class="yz3-geri"></div><div class="yz3-flas"></div>';
        while (ek.firstChild) el.appendChild(ek.firstChild);
        const altEl = el.querySelector('.yz3-alt'), geriEl = el.querySelector('.yz3-geri'), flasEl = el.querySelector('.yz3-flas');

        // ---------------- motor
        const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 16 / 9, .1, 600);
        const m = { T: 0, isler: [], olaylar: [], her: [], durdu: false };
        const boyut = () => { let w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < 1 ? 62 : 42; cam.updateProjectionMatrix(); };
        boyut(); window.addEventListener('resize', boyut);
        let son = performance.now();
        const dongu = (now) => {
            if (m.durdu) return;
            if (!el.isConnected) return kapat();
            const ham = now - son, dt = Math.min(.05, ham / 1000); son = now; m.T += dt;
            // yavaş cihaz koruması: ilk saniyelerde kare ortalaması 70 ms'yi aşarsa 3B kapanır, 2B kürsüye dönülür
            if (m.T < 4 && ham < 2000) { m.ks = (m.ks || 0) + 1; m.kt = (m.kt || 0) + ham; if (m.ks >= 12 && m.kt / m.ks > 70) { kapat(); if (ops.yavas) try { ops.yavas(); } catch (e) {} return; } }
            m.olaylar = m.olaylar.filter(o => { if (m.T >= o.t) { try { o.f(); } catch (e) {} return false; } return true; });
            m.isler = m.isler.filter(i => { const p = (m.T - i.t0) / i.d; if (p < 0) return true; i.f(i.e(Math.min(1, p))); return p < 1; });
            m.her.forEach(f => f(dt, m.T)); r.render(sc, cam); m.raf = requestAnimationFrame(dongu);
        };
        m.raf = requestAnimationFrame(dongu);
        const at = (t, f) => m.olaylar.push({ t: m.T + t, f });
        const tw = (t, d, f, e) => m.isler.push({ t0: m.T + t, d: Math.max(.001, d), f, e: e || ease.io });

        // ---------------- ses (yzTorAC: düdük sesleri kapalıysa null → sessiz)
        const AC = () => { try { return ops.ses ? ops.ses() : null; } catch (e) { return null; } };
        function ton(f, b, s, tur, v, f2) { const a = AC(); if (!a) return; try { const t = a.currentTime + b, o = a.createOscillator(), g = a.createGain(); o.type = tur || 'triangle'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + s); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .2, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + s); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + s + .05); } catch (e) {} }
        // ÇOCUK DOSTU SESLER (2026-10-20, kullanıcı: "ödül törenindeki patlama sesleri çok korkutucu"): gürültü patlaması, kalın
        // bas "bum" ve tok darbe yok — yerine kabarcık "pop", ksilofon/çan arpejleri ve yumuşak tahta tıkırtısı.
        const PENTA = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637];
        const SES = {
            vurus() { ton(520, 0, .12, 'sine', .12, 900); [523, 659, 784].forEach((f, i) => ton(f, .05 + i * .07, .35, 'triangle', .09)); },
            ding() { ton(1568, 0, .9, 'sine', .12); ton(2093, .03, 1, 'sine', .07); ton(784, 0, .6, 'triangle', .05); },
            havai() { ton(700, 0, .45, 'sine', .035, 1500); for (let i = 0; i < 6; i++) ton(PENTA[Math.floor(Math.random() * PENTA.length)], .45 + i * .07 + Math.random() * .04, .5, 'sine', .045); },
            tok() { ton(880, 0, .14, 'triangle', .12); ton(1320, 0, .1, 'sine', .04); },
            kalp() { ton(523, 0, .2, 'sine', .07); ton(392, .26, .22, 'sine', .06); }
        };

        // ---------------- dokular
        const dokular = [];
        function tuvalDoku(w, h, ciz) { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; dokular.push(t); return t; }
        const yumusak = tuvalDoku(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
        function avatarDoku(ad, renk) { return tuvalDoku(512, 512, (x, w) => { const g = x.createRadialGradient(w * .35, w * .3, 20, w / 2, w / 2, w / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, renk); g.addColorStop(1, '#2a1a10'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 14, 0, 7); x.fill(); x.lineWidth = 22; x.strokeStyle = '#fff'; x.stroke(); x.fillStyle = '#140b04'; x.font = '900 200px ' + YAZI; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(basHarf(ad), w / 2, w / 2 + 10); }); }
        function levhaDoku(ad, alt, renk) { return tuvalDoku(1024, 256, (x, w, h) => { x.fillStyle = 'rgba(10,7,5,.9)'; x.fillRect(0, 0, w, h); x.fillStyle = renk; x.fillRect(0, 0, w, 12); x.fillStyle = '#fff'; let fs = 120; x.font = '900 ' + fs + 'px ' + YAZI; while (x.measureText(ad).width > w - 60 && fs > 50) { fs -= 6; x.font = '900 ' + fs + 'px ' + YAZI; } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ad, w / 2, h * .45); x.fillStyle = renk; x.font = '800 40px system-ui, sans-serif'; x.fillText(alt, w / 2, h * .85); }); }

        // ---------------- sahne
        sc.background = new THREE.Color('#05030a'); sc.fog = new THREE.Fog('#05030a', 25, 70);
        sc.add(new THREE.HemisphereLight('#3a2a50', '#080406', .55));
        const zem = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: '#120c10', roughness: .25, metalness: .6 })); zem.rotation.x = -Math.PI / 2; zem.receiveShadow = true; sc.add(zem);
        const halka = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.8, 96), new THREE.MeshBasicMaterial({ color: '#fd8e01' })); halka.rotation.x = -Math.PI / 2; halka.position.y = .01; sc.add(halka);
        // tribün (instanced) + flaşlar
        (function () {
            const adet = zayif ? 140 : 260, bas = new THREE.InstancedMesh(new THREE.SphereGeometry(.28, 8, 6), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 1 }), adet), gov = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, .7, 8), bas.material, adet);
            const o = new THREE.Object3D(), fg = new THREE.BufferGeometry(), fp = new Float32Array(adet * 3);
            for (let i = 0; i < adet; i++) { const a = Math.PI * (.08 + .84 * Math.random()), rr = 14 + Math.floor(Math.random() * 6) * 1.1, sira = (rr - 14) / 1.1, x = Math.cos(a) * rr, z = -Math.sin(a) * rr * .55 - 6, y = 1 + sira * .75;
                o.position.set(x, y + .62, z); o.updateMatrix(); bas.setMatrixAt(i, o.matrix); o.position.set(x, y, z); o.updateMatrix(); gov.setMatrixAt(i, o.matrix); fp[i * 3] = x; fp[i * 3 + 1] = y + .7; fp[i * 3 + 2] = z + .3; }
            fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
            const flas = new THREE.Points(fg, new THREE.PointsMaterial({ size: .22, map: yumusak, color: '#fff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
            sc.add(bas); sc.add(gov); sc.add(flas);
            let tk = 0; m.her.push((dt) => { tk += dt; if (tk > .07) { tk = 0; flas.material.opacity = Math.random() < .35 ? .55 : 0; } });
        })();
        // podyum blokları
        const P = {};
        [1, 2, 3].forEach(n => {
            const g = new THREE.Group(), gen = 3, yuk = BY[n], renk = RENK[n];
            const b = new THREE.Mesh(new THREE.BoxGeometry(gen, yuk, 2.4), new THREE.MeshStandardMaterial({ color: '#0f0b12', roughness: .3, metalness: .75 })); b.position.y = yuk / 2; b.castShadow = b.receiveShadow = true; g.add(b);
            const serit = new THREE.Mesh(new THREE.BoxGeometry(gen + .02, .08, 2.42), new THREE.MeshBasicMaterial({ color: renk })); serit.position.y = yuk - .04; g.add(serit);
            const yz = new THREE.Mesh(new THREE.PlaneGeometry(gen * .5, gen * .5), new THREE.MeshBasicMaterial({ map: tuvalDoku(256, 256, (x, w) => { x.font = '900 210px ' + YAZI; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = renk; x.fillText(String(n), w / 2, w / 2 + 10); }), transparent: true })); yz.position.set(0, yuk * .5, 1.21); g.add(yz);
            g.position.x = BX[n]; g.scale.y = .001; sc.add(g); P[n] = { g, yuk };
        });
        // spotlar + görünür koniler
        const spot = (renk, x) => { const s = new THREE.SpotLight(renk, 0, 40, .32, .5, 1.2); s.position.set(x, 14, 6); s.castShadow = !zayif; if (!zayif) s.shadow.mapSize.set(1024, 1024); sc.add(s); sc.add(s.target); s.target.position.set(x, 0, 0);
            const koni = new THREE.Mesh(new THREE.ConeGeometry(2.6, 14, 48, 1, true), new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); koni.position.set(x, 7, 1.5); sc.add(koni); return { s, koni }; };
        const L = { 1: spot('#fff2cc', 0), 2: spot('#e6eefc', -3.2), 3: spot('#ffd2a8', 3.2) };
        const gez = [spot('#fd8e01', -9), spot('#d7262b', 9)]; gez.forEach(g => { g.s.intensity = 1.6; g.koni.material.opacity = .035; });
        m.her.push((dt, T) => { gez.forEach((g, i) => { const a = Math.sin(T * .7 + i * 2) * 6; g.s.target.position.set(a, 0, -2); g.koni.lookAt(a, 0, -2); g.koni.rotateX(Math.PI / 2); g.koni.position.set((g.s.position.x + a) / 2, 7, 2); }); halka.material.color.setHSL(.08, 1, .45 + Math.sin(T * 3) * .1); });
        // parçacıklar (kıvılcım / havai fişek)
        const fx = (function () {
            const N = zayif ? 2000 : 4000, geo = new THREE.BufferGeometry(), poz = new Float32Array(N * 3), renk = new Float32Array(N * 3), hiz = new Float32Array(N * 3), omur = new Float32Array(N);
            geo.setAttribute('position', new THREE.BufferAttribute(poz, 3)); geo.setAttribute('color', new THREE.BufferAttribute(renk, 3));
            const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: .22, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: yumusak })); p.frustumCulled = false; sc.add(p);
            let i0 = 0, aktif = 0; for (let i = 0; i < N; i++) poz[i * 3 + 1] = -999; const c = new THREE.Color();
            m.her.push((dt) => { if (!aktif) return; let say = 0; for (let i = 0; i < N; i++) { if (omur[i] <= 0) continue; say++; omur[i] -= dt; hiz[i * 3 + 1] -= 6 * dt; hiz[i * 3] *= .985; hiz[i * 3 + 2] *= .985; poz[i * 3] += hiz[i * 3] * dt; poz[i * 3 + 1] += hiz[i * 3 + 1] * dt; poz[i * 3 + 2] += hiz[i * 3 + 2] * dt; renk[i * 3] *= .992; renk[i * 3 + 1] *= .99; renk[i * 3 + 2] *= .99; if (omur[i] <= 0) poz[i * 3 + 1] = -999; } aktif = say; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; });
            return { patlat(x, y, z, n, renkler, guc) { if (azHareket) n = Math.ceil(n / 4); for (let k = 0; k < n; k++) { const i = i0 = (i0 + 1) % N, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), v = (guc || 9) * (.6 + Math.random() * .4); poz[i * 3] = x; poz[i * 3 + 1] = y; poz[i * 3 + 2] = z; hiz[i * 3] = Math.sin(ph) * Math.cos(th) * v; hiz[i * 3 + 1] = Math.cos(ph) * v; hiz[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * v; omur[i] = 1.4 + Math.random() * 1.2; c.set(renkler[k % renkler.length]); renk[i * 3] = c.r; renk[i * 3 + 1] = c.g; renk[i * 3 + 2] = c.b; } aktif = Math.max(aktif, 1); } };
        })();
        // konfeti (instanced)
        const kf = (function () {
            const N = zayif ? 450 : 900, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.12, .2), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, metalness: .4, roughness: .4 }), N);
            const rk = ['#f6c945', '#fd8e01', '#d7262b', '#ffffff', '#3b82f6', '#4ade80'], c = new THREE.Color(), d = []; im.frustumCulled = false;
            for (let i = 0; i < N; i++) { c.set(rk[i % rk.length]); im.setColorAt(i, c); d.push({ x: 0, y: -99, z: 0, vy: 0, rx: Math.random() * 6, ry: Math.random() * 6, w: 2 + Math.random() * 6, aktif: false }); }
            sc.add(im); const o = new THREE.Object3D(); let var_ = false;
            m.her.push((dt, T) => { if (!var_) return; let say = 0; for (let i = 0; i < N; i++) { const p = d[i]; if (p.aktif) { say++; p.y -= p.vy * dt; p.x += Math.sin(T * 2 + i) * .4 * dt; p.rx += p.w * dt; p.ry += p.w * .7 * dt; if (p.y < -1) p.aktif = false; } o.position.set(p.x, p.aktif ? p.y : -99, p.z); o.rotation.set(p.rx, p.ry, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.instanceMatrix.needsUpdate = true; var_ = say > 0; });
            return { yagdir(n) { if (azHareket) n = Math.ceil(n / 4); let k = 0; for (let i = 0; i < N && k < n; i++) { const p = d[i]; if (p.aktif) continue; p.aktif = true; p.x = (Math.random() - .5) * 14; p.z = (Math.random() - .5) * 6; p.y = 9 + Math.random() * 6; p.vy = 1.6 + Math.random() * 1.6; k++; } var_ = true; } };
        })();

        // ---------------- kamera
        const hedef = new THREE.Vector3(0, 2, 0); let yorunge = null, camIs = 0;
        cam.position.set(0, 9, 22); cam.lookAt(hedef);
        const camGit = (t, d, x, y, z, lx, ly, lz) => { const no = ++camIs; at(t, () => { if (no !== camIs) return; yorunge = null; const p0 = cam.position.clone(), h0 = hedef.clone(), p1 = new THREE.Vector3(x, y, z), h1 = new THREE.Vector3(lx, ly, lz); if (azHareket) { cam.position.copy(p1); hedef.copy(h1); cam.lookAt(hedef); return; } tw(0, d, e => { if (no !== camIs) return; cam.position.lerpVectors(p0, p1, e); hedef.lerpVectors(h0, h1, e); cam.lookAt(hedef); }); }); };
        const camKoy = (x, y, z, lx, ly, lz) => { ++camIs; yorunge = null; cam.position.set(x, y, z); hedef.set(lx, ly, lz); cam.lookAt(hedef); };
        m.her.push((dt, T) => { if (!yorunge || yorunge.no !== camIs || azHareket) return; yorunge.a = (yorunge.a == null ? Math.atan2(cam.position.x, cam.position.z) : yorunge.a) + dt * .16; const R = yorunge.R || 10, Y = yorunge.Y || 4.4; cam.position.x += (Math.sin(yorunge.a) * R - cam.position.x) * Math.min(1, dt * 1.5); cam.position.z += (Math.cos(yorunge.a) * R - cam.position.z) * Math.min(1, dt * 1.5); cam.position.y += (Y - cam.position.y) * Math.min(1, dt * 1.5); hedef.lerp(new THREE.Vector3(0, 3.1, 0), Math.min(1, dt * 1.5)); cam.lookAt(hedef); });
        function yorungeAc(R, Y) { ++camIs; yorunge = { no: camIs, R: R, Y: Y }; }

        // ---------------- sporcular
        let S = {}, gi = null, ilk = true, acik = {}, sonMu = false, geriSon = null;
        function sporcuTemizle() {
            Object.keys(S).forEach(n => { const s = S[n]; [s.g, s.md, s.levha].forEach(o => { sc.remove(o); o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); }); });
            S = {};
        }
        function grupKur(sh) {
            sporcuTemizle(); acik = {};
            [1, 2, 3].forEach(n => { P[n].g.scale.y = .001; L[n].s.intensity = 0; L[n].koni.material.opacity = 0; });
            (sh && sh.liste || []).slice(0, 3).forEach((k, i) => {
                const n = i + 1, renk = RENK[k.sira] || RENK[n], tab = P[n];
                const g = new THREE.Group();
                const arka = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .12, 64), new THREE.MeshStandardMaterial({ color: renk, metalness: .9, roughness: .25 })); arka.rotation.x = Math.PI / 2; arka.position.z = -.07; g.add(arka);
                const av = new THREE.Mesh(new THREE.CircleGeometry(.9, 64), new THREE.MeshBasicMaterial({ map: avatarDoku(k.ad, renk), toneMapped: false })); g.add(av);
                g.position.set(BX[n], tab.yuk + 1.15, 0); g.scale.setScalar(.001); sc.add(g);
                const puanYazi = (k.puan !== '' && k.puan != null ? k.puan + ' PUAN' : (k.alt || ''));
                const levha = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .7), new THREE.MeshBasicMaterial({ map: levhaDoku(kisaAd(k.ad).toLocaleUpperCase('tr-TR'), puanYazi.toLocaleUpperCase('tr-TR'), renk), transparent: true, toneMapped: false }));
                levha.position.set(BX[n], tab.yuk + 2.55, .1); levha.scale.set(1, .001, 1); sc.add(levha);
                const md = new THREE.Group(); const disk = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .05, 48), new THREE.MeshStandardMaterial({ color: renk, metalness: .6, roughness: .3, emissive: renk, emissiveIntensity: .45 })); disk.rotation.x = Math.PI / 2; md.add(disk);
                const kur = new THREE.Mesh(new THREE.PlaneGeometry(.16, .4), new THREE.MeshBasicMaterial({ color: '#c81e2c', side: THREE.DoubleSide, toneMapped: false })); kur.position.y = .27; md.add(kur);
                md.position.set(BX[n], 12, .55); sc.add(md);
                S[n] = { g, md, levha, k, tab };
            });
        }
        m.her.push(() => { [1, 2, 3].forEach(n => { P[n].g.visible = P[n].g.scale.y > .01; }); });
        m.her.push((dt, T) => { Object.keys(S).forEach(n => { const s = S[n]; if (s.g.scale.x > .5) s.g.position.y = s.tab.yuk + 1.15 + Math.sin(T * 2 + +n) * .04; s.md.rotation.y = Math.sin(T * 3 + +n) * .25; }); });
        function alt3(s) {
            altEl.classList.remove('in');
            setTimeout(() => { if (m.durdu) return; altEl.style.setProperty('--rc', RENK[s.k.sira] || '#f6c945'); altEl.querySelector('.no').textContent = (s.k.sira || '') + '.'; altEl.querySelector('.ad').textContent = s.k.ad; altEl.querySelector('.alt').textContent = [s.k.puan !== '' && s.k.puan != null ? s.k.puan + ' puan' : '', s.k.alt || ''].filter(Boolean).join(' · '); altEl.classList.add('in'); }, 140);
        }
        function flas(op) { try { flasEl.animate([{ opacity: op || .9 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' }); } catch (e) {} }
        function ac(n, canli) {
            const s = S[n]; if (!s || acik[n]) return; acik[n] = true;
            const tab = P[n], sp = L[n], sampiyon = n === 1;
            const spotG = sampiyon ? 4.5 : 3.2, koniG = sampiyon ? .07 : .05;
            if (!canli) {
                tab.g.scale.y = 1; sp.s.intensity = spotG; sp.koni.material.opacity = koniG; s.g.scale.setScalar(sampiyon ? 1.15 : 1); s.levha.scale.y = 1; s.md.position.y = tab.yuk + .42; if (sampiyon) s.md.scale.setScalar(1.15);
                return;
            }
            camGit(0, 1.4, BX[n] * .8, tab.yuk + (sampiyon ? 1.6 : 2.4), sampiyon ? 7.5 : 8.5, BX[n], tab.yuk + (sampiyon ? 1.6 : .9), 0);
            tw(.2, sampiyon ? 1.1 : .9, e => { tab.g.scale.y = Math.max(.001, ease.back(e)); });
            tw(.4, .6, e => { sp.s.intensity = spotG * e; sp.koni.material.opacity = koniG * e; });
            tw(1, .8, e => { s.g.scale.setScalar(Math.max(.001, ease.back(e)) * (sampiyon ? 1.15 : 1)); });
            tw(1.2, .6, e => { s.levha.scale.y = Math.max(.001, ease.back(e)); });
            at(1, () => { SES.vurus(); alt3(s); if (sampiyon) flas(.85); });
            tw(1.6, 1, e => { s.md.position.y = 12 - (12 - (tab.yuk + .42)) * ease.o3(e); if (sampiyon) s.md.scale.setScalar(1.15); });
            at(2.6, () => { SES.ding(); fx.patlat(BX[n], tab.yuk + 1.2, .6, 80, [RENK[n], '#ffffff'], 4); });
            if (sampiyon) {
                at(2.7, () => kf.yagdir(700));
                for (let i = 0; i < 9; i++) at(2.8 + i * .55, () => { const x = (Math.random() - .5) * 18, y = 8 + Math.random() * 4; fx.patlat(x, y, -4 - Math.random() * 4, 260, [['#f6c945', '#fff3c4'], ['#fd8e01', '#ffd28a'], ['#d7262b', '#ffb3a8'], ['#3b82f6', '#cfe1ff']][i % 4], 7 + Math.random() * 3); if (i % 2 === 0) SES.havai(); });
                camGit(3.4, 2.2, 0, 4.6, 11, 0, 2.6, 0);
                at(5.8, () => yorungeAc(10, 4.4));
            }
        }

        function durum(st) {
            if (m.durdu) return;
            const canli = !ilk; ilk = false;
            if (st.son) {
                if (!sonMu) { sonMu = true; altEl.classList.remove('in'); yorungeAc(13, 6.5); if (canli) { kf.yagdir(600); for (let i = 0; i < 6; i++) at(.3 + i * .6, () => { fx.patlat((Math.random() - .5) * 18, 9 + Math.random() * 4, -5 - Math.random() * 4, 220, [['#f6c945', '#fff3c4'], ['#fd8e01', '#ffd28a'], ['#3b82f6', '#cfe1ff']][i % 3], 8); if (i % 2 === 0) SES.havai(); }); } }
                return;
            }
            sonMu = false;
            if (st.gi !== gi) {
                gi = st.gi; grupKur(st.gi >= 0 ? st.sh : null); altEl.classList.remove('in'); geriSon = null;
                if (canli) { camKoy(0, 9, 22, 0, 2, 0); camGit(0, 3, 0, 5.5, 15, 0, 2, 0); } else camKoy(0, 5.5, 15, 0, 2, 0);
            }
            const yeni = (st.acilmis || []).filter(n => !acik[n]);
            yeni.forEach(n => ac(n, canli && yeni.length === 1));
            if (yeni.length && !canli) { if (acik[1]) yorungeAc(10, 4.4); else { const n = yeni[yeni.length - 1]; camKoy(BX[n] * .8, P[n].yuk + 2.4, 8.5, BX[n], P[n].yuk + .9, 0); alt3(S[n]); } }
        }
        function geriSay(n) {
            if (m.durdu || n === geriSon) return; geriSon = n;
            if (!n) return;
            if (n === 3) { altEl.classList.remove('in'); camGit(0, 2, 0, 3.6, 12, 0, 2.6, 0); SES.kalp(); }
            geriEl.textContent = n; SES.tok();
            try { geriEl.animate([{ opacity: 0, transform: 'scale(2.2)' }, { opacity: 1, transform: 'scale(1)', offset: .25 }, { opacity: 0, transform: 'scale(.85)' }], { duration: 800, easing: 'cubic-bezier(.2,1,.3,1)' }); } catch (e) {}
        }
        function kapat() {
            if (m.durdu) return; m.durdu = true; cancelAnimationFrame(m.raf); window.removeEventListener('resize', boyut);
            sporcuTemizle(); dokular.forEach(t => { try { t.dispose(); } catch (e) {} });
            sc.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); });
            try { r.dispose(); r.forceContextLoss(); } catch (e) {}
            r.domElement.remove();
        }
        return { durum, geriSay, kapat };
    };
})();
