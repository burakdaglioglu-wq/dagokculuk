/* ================================================================================================
   🏝️ HAZİNE ADASI 3B — üç ayrı Oyunlar teması (2026-11-16, v420). Kullanıcı: "Hazine Adası'nı tamamen yeni teknolojili harika bir oyun yap";
   oynanabilir 3B taslağı (https://claude.ai/artifact/PKbvPZwi4h9A48YuCyh79g) görünce: "mükemmel, genelde de oyunları böyle yapalım,
   bu üçünü de ayrı oyun olarak çıkart". Aynı 3B sahne (three.js r128, yerel /vendor), üç oyun:
     · 'filo'      ⛵ Filo Yarışı      — bireysel: her sporcunun kendi gemisi, seri puanı kadar ilerler; 9-10 okları arkadan rüzgâr.
                                         Tur sonunda (herkes atınca) adaya varanlar hazineyi bulur; diğerleri de yarışı tamamlar.
     · 'kacis'     🏴‍☠️ Korsandan Kaçış — hep birlikte: sınıf tek gemide, her ok yelkene rüzgâr; herkes atınca korsanlar yaklaşır.
                                         Yakalanırsa geri düşer, kaçış sürer. Adaya varış tur sonunda ilan edilir.
     · 'topsavasi' 💣 Top Savaşı       — hep birlikte: her ok gülle (9-10 tam isabet, 7-8 gövde, 5-6 sıyırır, altı denize).
                                         Tur sonunda korsanlar karşı ateş açar (iyi tur savuşturur). Gemi tur sonunda batar, hazine sınıfın.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz; ortak oyunda finalde herkesin adı, son atan kahraman değil; puan sıralaması yok.
   KABUK: skor girişi Oyunlar'ın dock'u. h3SahneKur(tid) · h3Guncelle(tid) · h3Seri(tid, s, i, kaydedilecek, done) · h3Anlik · h3GeriYukle · h3Sporcu.
   Durum 'dag_km_h3_<tid>_<konum>' (km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır: KM_OYUN_SIFIR_ONEK 'dag_km_h3_').
   WebGL yoksa ya da yazılımsal çizimse (yavaş tablet) sade 2B görünüm: aynı kurallar, aynı HUD.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const renk = (tid, i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk(tid, i) : '#F59E5B');
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    const anahtar = (tid) => 'dag_km_h3_' + tid + '_' + konum();
    const panel = (tid) => $('km-oyun-panel-' + tid);
    const aktifTema = () => (typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : '');
    const OYUN = {
        filo: { ad: 'Filo Yarışı', ikon: '⛵', kural: 'Her ok geminizi puanı kadar ileri sürer; 9-10 atan arkadan rüzgâr alır. Herkes atınca adaya varanlar hazineyi bulur.' },
        kacis: { ad: 'Korsandan Kaçış', ikon: '🏴‍☠️', kural: 'Sınıf tek gemide. Her ok yelkene rüzgâr: puanı kadar yol. Herkes atınca korsanlar yaklaşır; yakalanmadan adaya varın.' },
        topsavasi: { ad: 'Top Savaşı', ikon: '💣', kural: 'Her ok bir gülle: 9-10 tam isabet, 7-8 gövdeye, 5-6 sıyırır, altı denize. Zayıf seri korsana barut verir; tur sonunda korsan ateş eder. 4 tur içinde batırın, yoksa çarpar!' }
    };
    const TIDLER = Object.keys(OYUN);

    /* ---------------------------------------------------------------- kurallar (saf) */
    const FILO_HIZ = 0.34;                    // ortalama 7'lik seri ~4 turda adaya
    function filoAdim(puanlar) { const n = Math.max(1, puanlar.length), top = puanlar.reduce((a, b) => a + b, 0), ruzgar = puanlar.filter((p) => p >= 9).length; return top / (n * 10) * FILO_HIZ + ruzgar * 0.012; }
    const TOP_CAN = 6, TOP_TUR = 4; // v423: korsan 4 turda çarpar, gemimizin 6 canı var; zayıf seri korsana barut verir (3 barut = 1 top)
    function topHasar(p) { return p >= 9 ? 6 : p >= 7 ? 4 : p >= 5 ? 2 : p >= 3 ? 1 : 0; }
    function olcek(st, okSay) { // sınıf büyüklüğü ve ok sayısına göre hedefler (ilk seride kurulur, sonra sabit)
        const n = Math.max(1, atabilenler().length), k = okSay || 3, nk = n * k;
        if (st.tid === 'kacis' && !st.hedef) { st.hedef = nk * 7 * 3; st.ara = Math.round(nk * 1.6); st.korsanHiz = nk * 7; st.geriDusme = Math.round(nk * 3); }
        if (st.tid === 'topsavasi' && !st.hpMax) { st.hpMax = Math.max(30, nk * 5); st.hp = st.hpMax; st.iyiOrt = 6.5; }
    }

    /* ---------------------------------------------------------------- durum */
    const _onbellek = {};
    function yeniOyun(tid) { return { tid: tid, tarih: bugun(), tur: 1, atan: {}, katki: {}, faz: 'oyun', x: {}, yol: 0, hedef: 0, ara: 0, hp: 0, hpMax: 0, can: tid === 'topsavasi' ? TOP_CAN : 3, barut: 0, kalan: TOP_TUR, kayip: null, turPuan: 0, turOk: 0, kazanan: null, finalAdlar: null, bas: null }; }
    function durum(tid) {
        let ham = null; try { ham = localStorage.getItem(anahtar(tid)); } catch (e) { }
        const o = _onbellek[tid];
        if (!o || o.ham !== ham || o.kn !== konum()) { let st = null; try { st = JSON.parse(ham || 'null'); } catch (e) { st = null; } _onbellek[tid] = { ham: ham, kn: konum(), st: st }; }
        let st = _onbellek[tid].st;
        if (!st || st.tarih !== bugun() || st.tid !== tid) { st = yeniOyun(tid); _onbellek[tid].st = st; kaydet(tid); }
        return st;
    }
    function kaydet(tid) { const st = _onbellek[tid] && _onbellek[tid].st; if (!st) return; try { const h = JSON.stringify(st); localStorage.setItem(anahtar(tid), h); _onbellek[tid].ham = h; } catch (e) { } }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= st.tur); };
    const buTurAtan = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= st.tur).length;

    /* ---------------------------------------------------------------- ses (sentez, dosya yok) */
    let AC = null;
    function ac() { if (!sesAcik()) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
    function gurultu(sure, gur, f, gec) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = f; g.gain.value = gur; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t); } catch (e) { } }
    function ton(f, sure, gur, gec, tip) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain(); o.type = tip || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gur, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + sure); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + sure + 0.05); } catch (e) { } }
    const SES = {
        top: () => { gurultu(0.5, 0.5, 900); ton(70, 0.35, 0.25, 0, 'sine'); },
        patla: (b) => { gurultu(b ? 1.2 : 0.7, b ? 0.7 : 0.45, b ? 500 : 800); ton(50, 0.5, 0.3, 0, 'sine'); },
        su: () => gurultu(0.45, 0.25, 2600),
        ruzgar: () => { gurultu(0.8, 0.18, 1400); ton(660, 0.25, 0.05, 0.05); ton(880, 0.3, 0.05, 0.15); },
        zil: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.5, 0.09, i * 0.12)),
        alarm: () => [440, 330, 440, 330].forEach((f, i) => ton(f, 0.18, 0.08, i * 0.2, 'square'))
    };

    /* ---------------------------------------------------------------- 3B yetenek */
    function webglVar() {
        try { if (localStorage.getItem('dag_h3_2b') === '1') return false; if (window.__h3Zorla3B) return true; } catch (e) { }
        try { const c = document.createElement('canvas'), gl = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')); if (!gl) return false; const d = gl.getExtension('WEBGL_debug_renderer_info'), ad = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !/swiftshader|llvmpipe|software|basic render/i.test(ad); } catch (e) { return false; }
    }
    function threeHazir() { return typeof THREE !== 'undefined' ? Promise.resolve() : (typeof dagskEkYukle === 'function' ? dagskEkYukle('vendor/three-r128.min.js') : Promise.reject()); }

    /* ---------------------------------------------------------------- 3B sahne */
    let G3 = null; // { tid, R, S, cam, ... }
    function sahne3Kapat() {
        if (!G3) return; try { cancelAnimationFrame(G3.raf); } catch (e) { } try { G3.ro && G3.ro.disconnect(); } catch (e) { }
        try { G3.R.dispose(); G3.R.forceContextLoss && G3.R.forceContextLoss(); } catch (e) { } try { G3.R.domElement.remove(); } catch (e) { } G3 = null;
    }
    function sahne3Kur(tid, kap) {
        const T = THREE, R = new T.WebGLRenderer({ antialias: true, alpha: true });
        R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); R.setClearColor(0x000000, 0); R.domElement.className = 'h3-tuval';
        kap.insertBefore(R.domElement, kap.firstChild);
        const S = new T.Scene(); S.fog = new T.Fog(0xcfeeff, 190, 520);
        const cam = new T.PerspectiveCamera(42, 16 / 9, 0.5, 900);
        S.add(new T.HemisphereLight(0xffffff, 0x3a6f8f, 0.78));
        const gunes = new T.DirectionalLight(0xfff1d0, 0.85); gunes.position.set(90, 140, 70); S.add(gunes);
        const g = { tid: tid, R: R, S: S, cam: cam, kap: kap, an: [], par: [], gemiler: [], camP: new T.Vector3(0, 40, 80), camL: new T.Vector3(), bak: new T.Vector3(), sars: 0, t: 0, kareSure: [], olcuBitti: false };
        // deniz (gölgelendirici)
        const uni = { t: { value: 0 }, sun: { value: new T.Vector3(0.5, 0.75, 0.4).normalize() }, ufuk: { value: new T.Color(0xcfeeff) } };
        const deniz = new T.Mesh(new T.PlaneGeometry(1100, 1100, 200, 200), new T.ShaderMaterial({
            uniforms: uni, extensions: { derivatives: true },
            vertexShader: 'uniform float t; varying float vH; varying vec3 vP;\n'
                + 'float w(vec2 p){ return sin(p.x*0.16+t*1.1)*0.7 + sin(p.y*0.21+t*0.8)*0.55 + sin((p.x+p.y)*0.09+t*0.5)*0.5 + sin(p.x*0.47-t*1.7)*0.16 + sin(p.y*0.53+t*1.4)*0.14; }\n'
                + 'void main(){ vec3 p=position; float h=w(vec2(p.x,-p.y)); p.z=h; vH=h; vec4 wp=modelMatrix*vec4(p,1.0); vP=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }',
            fragmentShader: 'uniform vec3 sun; uniform vec3 ufuk; varying float vH; varying vec3 vP;\n'
                + 'void main(){ vec3 n=normalize(cross(dFdx(vP),dFdy(vP))); if(n.y<0.0) n=-n; vec3 v=normalize(cameraPosition-vP);\n'
                + ' vec3 c=mix(vec3(0.02,0.27,0.50),vec3(0.08,0.66,0.76),smoothstep(-1.5,1.8,vH));\n'
                + ' c*=0.60+0.58*max(dot(n,sun),0.0);\n'
                + ' float fr=pow(1.0-max(dot(n,v),0.0),3.0); c=mix(c,ufuk,fr*0.5);\n'
                + ' c+=vec3(1.0,0.96,0.82)*pow(max(dot(reflect(-sun,n),v),0.0),80.0)*0.95;\n'
                + ' c=mix(c,vec3(1.0),smoothstep(1.45,1.95,vH)*0.8);\n'
                + ' c=mix(c,ufuk,smoothstep(170.0,500.0,length(cameraPosition-vP)));\n'
                + ' gl_FragColor=vec4(c,1.0); }'
        }));
        deniz.rotation.x = -Math.PI / 2; S.add(deniz); g.uni = uni;
        // güneş
        (function () { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.25, 'rgba(255,240,180,.75)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
            const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), fog: false, depthWrite: false })); sp.scale.set(150, 150, 1); sp.position.set(230, 150, -330); S.add(sp); })();
        // bulutlar, martılar
        g.bulut = [];
        for (let b = 0; b < 10; b++) { const bg = new T.Group(); for (let q = 0; q < 3; q++) { const bm = new T.Mesh(new T.SphereGeometry(8 + ((b + q) % 3) * 3, 7, 5), new T.MeshLambertMaterial({ color: 0xffffff, flatShading: true, fog: false })); bm.position.set(q * 11 - 11, (q % 2) * 3, 0); bm.scale.set(1.5, 0.6, 1); bg.add(bm); } bg.position.set(-320 + b * 70, 70 + (b % 4) * 9, -260 - (b % 3) * 40); S.add(bg); g.bulut.push(bg); }
        g.marti = [];
        for (let m = 0; m < 5; m++) { const mg = new T.Group(); [1, -1].forEach((sg) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1.7 * sg, 0, -0.45, 1.7 * sg, 0, 0.45], 3)); const k = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide })); k.userData.s = sg; mg.add(k); }); mg.userData = { r: 30 + m * 9, h: 22 + m * 3, f: m * 1.3 }; S.add(mg); g.marti.push(mg); }
        // ada + sandık
        const ada = new T.Group(); S.add(ada); g.ada = ada;
        (function () {
            const kg = new T.ConeGeometry(20, 5, 16, 3), p = kg.attributes.position;
            for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + Math.sin(a * 3) * 0.14 + Math.sin(a * 7) * 0.06; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
            const kum = new T.Mesh(kg, mat(0xf2d79b)); kum.position.y = 1.2; ada.add(kum);
            const tepe = new T.Mesh(new T.ConeGeometry(9, 9, 9, 2), mat(0x3fae5a)); tepe.position.set(-5, 6.5, -4); ada.add(tepe);
            const kaya = new T.Mesh(new T.DodecahedronGeometry(3.2, 0), mat(0x7d8790)); kaya.position.set(7, 3.4, -6); ada.add(kaya);
            [[6, 5, 8], [-9, 6, 6.5], [1, -9, 7.5]].forEach(([x, z, h]) => {
                const pg = new T.Group(), gv = new T.Mesh(new T.CylinderGeometry(0.35, 0.55, h, 6), mat(0x8a5a2b)); gv.position.y = h / 2; gv.rotation.z = 0.12; pg.add(gv);
                for (let i = 0; i < 7; i++) { const y = new T.Mesh(new T.ConeGeometry(0.9, 5, 4), mat(0x2f9e4f)); y.position.set(Math.cos(i * 0.9) * 1.9 - 0.5, h + 0.2, Math.sin(i * 0.9) * 1.9); y.rotation.z = Math.cos(i * 0.9) * -1.25; y.rotation.x = Math.sin(i * 0.9) * 1.25; pg.add(y); }
                pg.position.set(x, 2.6, z); ada.add(pg);
            });
        })();
        const sandik = new T.Group(), kapak = new T.Group(), isik = new T.PointLight(0xffd34d, 0, 34);
        (function () {
            const gv = new T.Mesh(new T.BoxGeometry(4.2, 2.2, 2.8), mat(0x7a4a22)); gv.position.y = 1.1; sandik.add(gv);
            [-1.5, 1.5].forEach((x) => { const s = new T.Mesh(new T.BoxGeometry(0.4, 2.3, 2.9), mat(0xf5c542, { shininess: 90 })); s.position.set(x, 1.1, 0); sandik.add(s); });
            const al = new T.Mesh(new T.BoxGeometry(3.8, 0.5, 2.4), new T.MeshPhongMaterial({ color: 0xffd34d, emissive: 0xaa7a00, shininess: 100 })); al.position.y = 2.2; sandik.add(al);
            const kp = new T.Mesh(new T.BoxGeometry(4.2, 1.1, 2.8), mat(0x8a5527)); kp.position.set(0, 0.55, 1.4); kapak.add(kp);
            kapak.position.set(0, 2.25, -1.4); sandik.add(kapak); isik.position.set(0, 5, 0); sandik.add(isik);
            sandik.position.set(0, 3.9, 6); sandik.scale.setScalar(1.25); ada.add(sandik);
        })();
        g.sandik = sandik; g.kapak = kapak; g.isik = isik;
        g.oyun = new T.Group(); S.add(g.oyun);
        G3 = g;
        boyut();
        if (window.ResizeObserver) { g.ro = new ResizeObserver(boyut); g.ro.observe(kap); }
        return g;
    }
    function mat(c, ek) { return new THREE.MeshPhongMaterial(Object.assign({ color: c, flatShading: true, shininess: 20 }, ek || {})); }
    function boyut() { if (!G3) return; const w = G3.kap.clientWidth || 800, h = G3.kap.clientHeight || 450; G3.R.setSize(w, h, false); G3.cam.aspect = w / h; G3.cam.fov = w / h < 1 ? 60 : 42; G3.cam.updateProjectionMatrix(); }
    const dik = () => !!(G3 && G3.cam.aspect < 1.1);
    function dalga(x, z, t) { return Math.sin(x * 0.16 + t * 1.1) * 0.7 + Math.sin(z * 0.21 + t * 0.8) * 0.55 + Math.sin((x + z) * 0.09 + t * 0.5) * 0.5; }
    function etiket(yazi, renkCss) {
        const T = THREE, c = document.createElement('canvas'); c.width = 256; c.height = 72; const x = c.getContext('2d');
        x.fillStyle = 'rgba(8,20,30,.85)'; x.beginPath(); x.moveTo(18, 4); x.arcTo(252, 4, 252, 68, 18); x.arcTo(252, 68, 4, 68, 18); x.arcTo(4, 68, 4, 4, 18); x.arcTo(4, 4, 252, 4, 18); x.fill();
        x.fillStyle = renkCss || '#fff'; x.fillRect(4, 60, 248, 8);
        let fs = 40; x.font = '800 ' + fs + 'px Inter,Arial,sans-serif'; while (x.measureText(yazi).width > 228 && fs > 22) { fs -= 2; x.font = '800 ' + fs + 'px Inter,Arial,sans-serif'; }
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(yazi, 128, 34);
        const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false })); sp.scale.set(6.4, 1.8, 1); sp.renderOrder = 5; return sp;
    }
    function yelkenDoku(korsan, css) {
        const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
        x.fillStyle = korsan ? '#17171b' : '#fff5df'; x.fillRect(0, 0, 128, 128);
        if (korsan) {
            x.strokeStyle = '#e9e9ee'; x.lineWidth = 11; x.lineCap = 'round'; x.beginPath(); x.moveTo(26, 100); x.lineTo(102, 38); x.moveTo(102, 100); x.lineTo(26, 38); x.stroke();
            x.fillStyle = '#e9e9ee'; x.beginPath(); x.arc(64, 58, 27, 0, 6.3); x.fill(); x.fillRect(50, 76, 28, 18);
            x.fillStyle = '#17171b'; x.beginPath(); x.arc(54, 56, 7, 0, 6.3); x.arc(74, 56, 7, 0, 6.3); x.fill(); x.fillRect(57, 82, 3, 12); x.fillRect(63, 82, 3, 12); x.fillRect(69, 82, 3, 12);
        } else { x.fillStyle = css; x.globalAlpha = 0.85; x.fillRect(0, 52, 128, 24); x.globalAlpha = 1; x.strokeStyle = 'rgba(120,90,50,.25)'; x.lineWidth = 2; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.stroke(); } }
        return new THREE.CanvasTexture(c);
    }
    function gemi(renkHex, korsan) {
        const T = THREE, g = new T.Group(), ahsap = korsan ? 0x2b2622 : 0x7a4a2a, acik = korsan ? 0x40352c : 0xb9824f, css = '#' + new T.Color(renkHex).getHexString();
        const hg = new T.BoxGeometry(8, 2.1, 3, 10, 1, 1), p = hg.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = 1 - Math.pow(Math.abs(x) / 4, 2) * 0.82; p.setZ(i, p.getZ(i) * k); if (p.getY(i) < 0) { p.setZ(i, p.getZ(i) * 0.5); p.setX(i, x * 0.84); } else if (x > 2.8) p.setY(i, p.getY(i) + (x - 2.8) * 0.5); }
        const gv = new T.Mesh(hg, mat(ahsap)); gv.position.y = 0.7; g.add(gv);
        const se = new T.Mesh(new T.BoxGeometry(5.4, 0.34, 2.86), mat(renkHex)); se.position.set(-0.2, 1.5, 0); g.add(se);
        const gu = new T.Mesh(new T.BoxGeometry(5.6, 0.16, 2.3), mat(acik)); gu.position.set(-0.1, 1.78, 0); g.add(gu);
        const ka = new T.Mesh(new T.BoxGeometry(1.9, 1.3, 2.4), mat(ahsap)); ka.position.set(-2.9, 2.35, 0); g.add(ka);
        const ku = new T.Mesh(new T.BoxGeometry(2.1, 0.2, 2.6), mat(renkHex)); ku.position.set(-2.9, 3.05, 0); g.add(ku);
        const fe = new T.Mesh(new T.SphereGeometry(0.2, 6, 5), new T.MeshBasicMaterial({ color: 0xffd34d })); fe.position.set(-3.9, 3.5, 0); g.add(fe);
        const ci = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 3.2, 5), mat(0x5a3a22)); ci.rotation.z = -Math.PI / 2 + 0.28; ci.position.set(4.6, 2.6, 0); g.add(ci);
        [-1, 1].forEach((yan) => { for (let t = 0; t < 3; t++) { const tp = new T.Mesh(new T.CylinderGeometry(0.15, 0.2, 0.9, 6), mat(0x1c1c1e)); tp.rotation.x = Math.PI / 2; tp.position.set(-1.6 + t * 1.5, 1.35, yan * 1.4); g.add(tp); } });
        const doku = yelkenDoku(korsan, css), yelkenler = [];
        function direk(x, h, parcalar) {
            const d = new T.Group(), s = new T.Mesh(new T.CylinderGeometry(0.12, 0.17, h, 6), mat(0x5a3a22)); s.position.y = h / 2; d.add(s);
            parcalar.forEach((pr) => {
                const yg = new T.PlaneGeometry(pr[0], pr[1], 8, 4), yp = yg.attributes.position;
                for (let j = 0; j < yp.count; j++) yp.setZ(j, Math.sin((yp.getX(j) / pr[0] + 0.5) * Math.PI) * 0.7 * Math.sin((yp.getY(j) / pr[1] + 0.5) * Math.PI * 0.85 + 0.2));
                const y = new T.Mesh(yg, new T.MeshLambertMaterial({ map: doku, side: T.DoubleSide })); y.rotation.y = Math.PI / 2 - 0.62; y.position.set(0.3, pr[2], 0); d.add(y); yelkenler.push(y);
                const sr = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, pr[0] + 0.3, 5), mat(0x5a3a22)); sr.rotation.x = Math.PI / 2; sr.rotation.y = -0.62; sr.position.set(0.05, pr[2] + pr[1] / 2, 0); d.add(sr);
            });
            d.position.set(x, 1.8, 0); g.add(d); return d;
        }
        const ana = direk(-0.2, 8.4, [[4.4, 3.3, 3.1], [3.3, 2.4, 6.3]]); direk(2.5, 6.4, [[3.3, 3, 3.2]]);
        const bay = new T.Mesh(new T.PlaneGeometry(1.5, 0.9), new T.MeshBasicMaterial({ color: korsan ? 0x111111 : renkHex, side: T.DoubleSide })); bay.position.set(-0.8, 8.2, 0); ana.add(bay);
        g.userData = { direk: ana, yelkenler: yelkenler, faz: Math.random() * 6, taban: 0, oncekiX: null, iz: 0, hedefX: null };
        return g;
    }
    function murettebat(g, kids, tid) {
        const T = THREE;
        kids.forEach((s, i) => { const m = new T.Group(), gv = new T.Mesh(new T.CylinderGeometry(0.14, 0.17, 0.42, 6), new T.MeshLambertMaterial({ color: new T.Color(renk(tid, i)) })); gv.position.y = 0.21; m.add(gv); const kf = new T.Mesh(new T.SphereGeometry(0.14, 6, 5), new T.MeshLambertMaterial({ color: 0xf2c9a5 })); kf.position.y = 0.55; m.add(kf); const sira = Math.floor(i / 10); m.position.set(-2.2 + (i % 10) * 0.48, 1.86, (sira % 2 ? 0.62 : -0.62)); g.add(m); });
    }
    // efektler
    function an(sure, fn, bit) { if (G3) G3.an.push({ t: 0, sure: sure, fn: fn, bit: bit }); else { fn(1); if (bit) bit(); } }
    function parca(pos, n, rk, hiz, omur, boy, yuk) {
        if (!G3 || azHareket()) return; const T = THREE, geo = new T.BufferGeometry(), a = new Float32Array(n * 3), v = [];
        for (let i = 0; i < n; i++) { a[i * 3] = pos.x; a[i * 3 + 1] = pos.y; a[i * 3 + 2] = pos.z; const th = Math.random() * 6.28, r = Math.random() * hiz; v.push([Math.cos(th) * r, (yuk || 1) * (hiz * 0.6 + Math.random() * hiz), Math.sin(th) * r]); }
        geo.setAttribute('position', new T.BufferAttribute(a, 3));
        const m = new T.Points(geo, new T.PointsMaterial({ color: rk, size: boy || 0.7, transparent: true, depthWrite: false })); G3.S.add(m); G3.par.push({ m: m, v: v, t: 0, omur: omur || 1.2 });
    }
    function sicrat(x, z, b) { if (G3) parca(new THREE.Vector3(x, 0.6, z), b ? 60 : 26, 0xffffff, b ? 9 : 5, b ? 1.4 : 0.9, 0.55); }
    function patlat(pos, b) {
        if (!G3) return; parca(pos, b ? 80 : 40, 0xffb020, b ? 13 : 8, 1.1, b ? 1.1 : 0.8); parca(pos, 30, 0x44403c, 5, 1.6, 1.3);
        const k = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true })); k.position.copy(pos); G3.S.add(k);
        an(0.45, (q) => { k.scale.setScalar(1 + q * (b ? 7 : 4)); k.material.opacity = 1 - q; }, () => { if (G3) G3.S.remove(k); });
        G3.sars = Math.max(G3.sars, b ? 1.2 : 0.5);
    }
    function sandikAc() { if (!G3) return; an(1.1, (q) => { if (!G3) return; G3.kapak.rotation.x = -q * 1.9; G3.isik.intensity = q * 1.1; }); const p = new THREE.Vector3(); G3.sandik.getWorldPosition(p); p.y += 3; for (let i = 0; i < 6; i++) setTimeout(() => parca(p, 70, 0xffd34d, 12, 2.2, 1.2), i * 350); }
    function yuzen(tid, yazi, pos3, renkCss, x2, y2) {
        const kap = panel(tid) && panel(tid).querySelector('.h3-sahne'); if (!kap) return;
        let x = x2, y = y2;
        if (G3 && pos3) { const v = pos3.clone().project(G3.cam); x = (v.x + 1) / 2 * kap.clientWidth; y = (1 - v.y) / 2 * kap.clientHeight; }
        if (x == null) { x = kap.clientWidth / 2; y = kap.clientHeight * 0.45; }
        const el = document.createElement('div'); el.className = 'h3-yuzen'; el.textContent = yazi; el.style.color = renkCss || '#fff'; el.style.left = x + 'px'; el.style.top = y + 'px'; kap.appendChild(el); setTimeout(() => el.remove(), 1150);
    }
    function afis(tid, yazi, renkCss) { const a = $('h3-afis'); if (!a) return; a.textContent = yazi; a.style.color = renkCss || '#fff'; a.classList.remove('gor'); void a.offsetWidth; a.classList.add('gor'); }

    /* ---------------------------------------------------------------- oyun → sahne eşlemesi */
    const XA0 = -40, XA1 = 52; // filo başlangıç/varış (dünya x)
    function sahneOyunKur(tid) {
        if (!G3) return; const T = THREE, st = durum(tid), l = atabilenler();
        while (G3.oyun.children.length) G3.oyun.remove(G3.oyun.children[0]);
        G3.gemiler = []; G3.kids = {}; G3.kapak.rotation.x = st.faz === 'son' ? -1.9 : 0; G3.isik.intensity = st.faz === 'son' ? 1.1 : 0;
        const ada = G3.ada;
        if (tid === 'filo') {
            ada.position.set(84, 0, 0); ada.scale.setScalar(1.5); ada.rotation.y = -Math.PI / 2;
            const ara = l.length > 18 ? 3.4 : l.length > 12 ? 3.9 : 4.9;
            l.forEach((s, i) => { const key = kimlik(s), g = gemi(new T.Color(renk(tid, i)).getHex()); g.scale.setScalar(0.62); const z = (i - (l.length - 1) / 2) * ara, x = XA0 + (XA1 - XA0) * Math.min(1, st.x[key] || 0); g.position.set(x, 0, z); g.userData.hedefX = x; const e = etiket(ilkAd(s.ad), renk(tid, i)); e.position.y = 12.5; e.scale.multiplyScalar(2); g.add(e); G3.oyun.add(g); G3.gemiler.push(g); G3.kids[key] = g; });
        } else if (tid === 'kacis') {
            ada.position.set(104, 0, -8); ada.scale.setScalar(1.2); ada.rotation.y = -0.6;
            G3.biz = gemi(0xf59e5b); G3.biz.scale.setScalar(1.5); murettebat(G3.biz, l, tid); G3.oyun.add(G3.biz); G3.gemiler.push(G3.biz);
            G3.korsan = gemi(0xb91c1c, true); G3.korsan.scale.setScalar(1.75); const e2 = etiket('KORSANLAR', '#ef5350'); e2.position.y = 12; G3.korsan.add(e2); G3.oyun.add(G3.korsan); G3.gemiler.push(G3.korsan);
        } else {
            ada.position.set(-6, 0, -78); ada.scale.setScalar(1.7); ada.rotation.y = 0;
            G3.biz = gemi(0xf59e5b); G3.biz.scale.setScalar(1.7); G3.biz.position.set(-24, 0, 6); murettebat(G3.biz, l, tid); G3.oyun.add(G3.biz); G3.gemiler.push(G3.biz);
            G3.korsan = gemi(0xb91c1c, true); G3.korsan.scale.setScalar(2); G3.korsanP = korsanYer(st); G3.korsan.position.copy(G3.korsanP); G3.korsan.rotation.y = Math.PI * 0.85; /* skor paneli sağ altta: korsan arkada */ G3.oyun.add(G3.korsan); G3.gemiler.push(G3.korsan);
            if (st.hpMax && st.hp <= st.hpMax / 2) G3.korsan.userData.direk.rotation.x = 1.3;
            if (st.faz === 'son' && !st.kayip) { G3.korsan.userData.taban = -9; G3.korsan.rotation.z = 0.7; }
            if (st.kayip === 'batti') G3.biz.userData.taban = -7;
        }
        kameraYerlestir(tid, true);
    }
    function korsanYer(st) { const k = st.kayip === 'carpti' ? -0.6 : Math.max(0, st.kalan == null ? TOP_TUR : st.kalan), o = 1 - k / TOP_TUR; return new THREE.Vector3(14 - o * 30, 0, -18 + o * 16); } // 4 tur kala uzakta, her tur yaklaşır, çarpınca bizim geminin dibinde
    function kameraYerlestir(tid, aninda) {
        if (!G3) return; const st = durum(tid), uz = dik() ? 1.75 : 1;
        if (tid === 'topsavasi' && G3.korsan) G3.korsanP = korsanYer(st);
        if (st.faz === 'son' && !st.kayip) { const ap = new THREE.Vector3(); G3.sandik.getWorldPosition(ap); if (tid === 'filo') G3.camP.set(ap.x - 62 * uz, 26, ap.z + 10); else if (tid === 'kacis') G3.camP.set(ap.x - 40 * uz, 22, ap.z + 44 * uz); else G3.camP.set(ap.x + 6, 24, ap.z + 62 * uz); G3.camL.copy(ap); }
        else if (tid === 'filo') { // kovalama kamerası: filonun arkasından adaya bakar, şeritler ekranda yan yana
            const xs = Object.values(G3.kids || {}).map((g) => g.userData.hedefX), geri = xs.length ? Math.min.apply(null, xs) : XA0, ileri = xs.length ? Math.max.apply(null, xs) : XA0, orta = Math.max(-14, Math.min(40, (geri + ileri) / 2 + 12)), n = xs.length || 1, d = Math.max(0.8, Math.min(1.25, n / 16));
            G3.camP.set(geri - 48 * d * uz, 26 * d * uz, 0); G3.camL.set(geri + 12, 0, 0); void orta; }
        else if (tid === 'kacis') {
            const oran = st.hedef ? Math.min(1, st.yol / st.hedef) : 0, bx = -50 + oran * 128, kx = bx - 15 - Math.max(0, st.ara) * (st.korsanHiz ? 6 / st.korsanHiz * 2 : 0.075);
            G3.bizX = bx; G3.korsanX = Math.max(kx, bx - 60);
            const orta = (bx + G3.korsanX) / 2, acik = bx - G3.korsanX + 26;
            G3.camP.set(orta + 10, 12, Math.max(36, acik * 1.15) * (dik() ? 2.1 : 1)); G3.camL.set(orta + 6, 4.5, 0);
            if (aninda && G3.biz) { G3.biz.position.set(bx, 0, 0); G3.korsan.position.set(G3.korsanX, 0, -1.5); }
        } else { G3.camP.set(-12, 15, dik() ? 70 : 44); G3.camL.set(-4, 4, -7); }
        if (aninda) { G3.cam.position.copy(G3.camP); G3.bak.copy(G3.camL); }
    }
    function dongu() {
        if (!G3) return;
        const g = G3, kap = g.kap;
        if (!kap.isConnected || aktifTema() !== g.tid) { sahne3Kapat(); return; }
        g.raf = requestAnimationFrame(dongu);
        if (document.hidden) return;
        const simdi = performance.now(), dt = Math.min(0.05, g.son ? (simdi - g.son) / 1000 : 0.016); g.son = simdi; g.t += dt;
        // yavaş cihaz: ilk 3 saniyede kare ortalaması 70 ms'yi geçerse 2B'ye düş
        if (!g.olcuBitti) { g.kareSure.push(dt); if (g.t > 3) { g.olcuBitti = true; const ort = g.kareSure.slice(5).reduce((a, b) => a + b, 0) / Math.max(1, g.kareSure.length - 5); if (ort > 0.07 && !window.__h3Zorla3B) { try { localStorage.setItem('dag_h3_2b', '1'); } catch (e) { } const tid = g.tid; sahne3Kapat(); h3SahneKur(tid); return; } } }
        g.uni.t.value = g.t;
        g.bulut.forEach((b) => { b.position.x += dt * 1.5; if (b.position.x > 320) b.position.x = -320; });
        g.marti.forEach((m) => { const u = m.userData; m.position.set(g.ada.position.x + Math.cos(g.t * 0.35 + u.f) * u.r, u.h + Math.sin(g.t + u.f) * 2, g.ada.position.z + Math.sin(g.t * 0.35 + u.f) * u.r); m.rotation.y = -(g.t * 0.35 + u.f); m.children.forEach((k) => { k.rotation.z = k.userData.s * Math.sin(g.t * 7 + u.f) * 0.55; }); });
        if (g.tid === 'filo' && g.kids) Object.values(g.kids).forEach((sh) => { if (sh.userData.hedefX != null) sh.position.x += (sh.userData.hedefX - sh.position.x) * Math.min(1, dt * 3); });
        if (g.tid === 'topsavasi' && g.korsan && g.korsanP) { g.korsan.position.x += (g.korsanP.x - g.korsan.position.x) * Math.min(1, dt * 0.9); g.korsan.position.z += (g.korsanP.z - g.korsan.position.z) * Math.min(1, dt * 0.9); }
        if (g.tid === 'kacis' && g.biz) { g.biz.position.x += (g.bizX - g.biz.position.x) * Math.min(1, dt * 2.5); g.korsan.position.x += (g.korsanX - g.korsan.position.x) * Math.min(1, dt * 1.6); }
        g.gemiler.forEach((sh) => {
            const u = sh.userData;
            if (u.oncekiX != null && Math.abs(sh.position.x - u.oncekiX) > 0.02) { u.iz += dt; if (u.iz > 0.09) { u.iz = 0; parca(new THREE.Vector3(sh.position.x - 3.6 * sh.scale.x, 0.5, sh.position.z + (Math.random() - 0.5) * 2), 5, 0xffffff, 2.2, 0.7, 0.55, 0.4); } }
            u.oncekiX = sh.position.x; sh.position.y = dalga(sh.position.x, sh.position.z, g.t) * 0.55 + u.taban;
            if (!(sh === g.korsan && g.tid === 'topsavasi' && u.taban < 0)) sh.rotation.z = Math.sin(g.t * 1.3 + u.faz) * 0.05;
            if (!(sh === g.korsan && g.tid === 'topsavasi')) sh.rotation.x = Math.sin(g.t * 0.9 + u.faz) * 0.06;
        });
        for (let i = g.an.length - 1; i >= 0; i--) { const a = g.an[i]; a.t += dt; const q = Math.min(1, a.t / a.sure); try { a.fn(q); } catch (e) { } if (q >= 1) { g.an.splice(i, 1); if (a.bit) try { a.bit(); } catch (e) { } } }
        for (let j = g.par.length - 1; j >= 0; j--) {
            const P = g.par[j], pp = P.m.geometry.attributes.position; P.t += dt;
            for (let n = 0; n < P.v.length; n++) { const v = P.v[n]; v[1] -= 22 * dt; pp.setXYZ(n, pp.getX(n) + v[0] * dt, pp.getY(n) + v[1] * dt, pp.getZ(n) + v[2] * dt); }
            pp.needsUpdate = true; P.m.material.opacity = Math.max(0, 1 - P.t / P.omur);
            if (P.t >= P.omur) { g.S.remove(P.m); P.m.geometry.dispose(); g.par.splice(j, 1); }
        }
        g.cam.position.lerp(g.camP, Math.min(1, dt * 1.8)); g.bak.lerp(g.camL, Math.min(1, dt * 2.2));
        if (g.sars > 0.01) { g.cam.position.x += (Math.random() - 0.5) * g.sars; g.cam.position.y += (Math.random() - 0.5) * g.sars; g.sars *= 0.86; }
        g.cam.lookAt(g.bak);
        g.R.render(g.S, g.cam);
    }

    /* ---------------------------------------------------------------- HUD */
    function avatar(s, px) {
        const st = 'width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.38) + 'px;';
        if (typeof fotoAvatarHTML === 'function') return fotoAvatarHTML('s:' + kimlik(s), s.ad, 'h3-av', false, st);
        return '<span class="h3-av" style="' + st + '">' + esc(String(s.ad).slice(0, 2).toLocaleUpperCase('tr-TR')) + '</span>';
    }
    function aktifSporcu() { const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1, s = liste()[i]; return s && atabilenler().indexOf(s) !== -1 ? s : null; }
    function hud(tid) {
        const p = panel(tid); if (!p || !$('h3-hud')) return;
        const st = durum(tid), l = atabilenler(), s = aktifSporcu(), O = OYUN[tid];
        const sira = st.faz === 'son' ? '<div class="h3-sira-yazi"><small>OYUN BİTTİ</small><b>' + (st.kayip ? '☠️ Korsan kazandı' : '🏆 ' + (tid === 'filo' ? 'Hazine bulundu' : 'Hep birlikte başardınız')) + '</b></div>'
            : s ? avatar(s, 52) + '<div class="h3-sira-yazi"><small>SIRADA · ' + st.tur + '. TUR</small><b>' + esc(ilkAd(s.ad)) + '</b></div>' : '<div class="h3-sira-yazi"><small>' + st.tur + '. TUR</small><b>Sporcuya dokun</b></div>';
        let d = '';
        if (tid === 'filo') {
            const en = l.reduce((m, k) => Math.max(m, st.x[kimlik(k)] || 0), 0);
            d = '<div class="h3-sat"><span>🏝️ En öndeki gemi</span><span>' + (en >= 1 ? 'adaya vardı!' : 'yolun %' + Math.round(en * 100) + "'i") + '</span></div><div class="h3-cub"><i style="width:' + (Math.min(1, en) * 100).toFixed(1) + '%;background:#f5c542"></i></div>';
        } else if (tid === 'kacis') {
            const o = st.hedef ? Math.min(1, st.yol / st.hedef) : 0, kalan = st.hedef ? Math.max(0, Math.round(st.hedef - st.yol)) : '…', ara = Math.max(0, Math.round(st.ara)), yakin = st.korsanHiz && st.ara < st.korsanHiz * 0.5;
            d = '<div class="h3-sat"><span>🏝️ Adaya kalan</span><span>' + kalan + ' puan</span></div><div class="h3-cub"><i style="width:' + (o * 100).toFixed(1) + '%;background:#f5c542"></i></div><div class="h3-sat"><span>☠️ Korsanlar</span><span class="' + (yakin ? 'kirmizi' : '') + '">' + (st.hedef ? ara + ' puan geride' : 'ufukta') + '</span></div>';
        } else {
            const hp = st.hpMax ? st.hp : 0, mx = st.hpMax || 1;
            d = '<div class="h3-sat"><span>☠️ Korsan gemisi</span><span>' + (st.hpMax ? hp + ' / ' + mx : 'yaklaşıyor') + '</span></div><div class="h3-cub"><i style="width:' + (st.hpMax ? hp / mx * 100 : 100).toFixed(1) + '%;background:#ef5350"></i></div><div class="h3-sat"><span>⚠️ Çarpmasına</span><span class="' + ((st.kalan == null ? TOP_TUR : st.kalan) <= 1 ? 'kirmizi' : '') + '">' + (st.kalan == null ? TOP_TUR : st.kalan) + ' tur</span></div>'
                + '<div class="h3-sat"><span>🚢 Bizim gemi</span><span class="h3-can">' + '❤️'.repeat(Math.max(0, st.can)) + '🖤'.repeat(Math.max(0, TOP_CAN - st.can)) + '</span></div>'
                + '<div class="h3-sat" title="Zayıf seri korsana barut verir; 3 barut = 1 top"><span>💣 Korsanın topları</span><span>' + (Math.floor((st.barut || 0) / 3) ? '💣'.repeat(Math.floor((st.barut || 0) / 3)) : '') + ((st.barut || 0) % 3 ? ' +' + ((st.barut || 0) % 3) + '/3' : '') + (st.barut ? '' : 'yok') + '</span></div>';
        }
        d += '<div class="h3-sat ince"><span>Bu tur atan</span><span>' + buTurAtan(st) + ' / ' + l.length + '</span></div>';
        $('h3-sira').innerHTML = sira; $('h3-durum').innerHTML = d;
        $('h3-serit').innerHTML = l.map((k, i) => { const key = kimlik(k), atti = (st.atan[key] || 0) >= st.tur, su = s === k && st.faz !== 'son'; return '<span class="h3-k' + (su ? ' su' : atti ? ' atti' : '') + '" style="--r:' + renk(tid, liste().indexOf(k)) + '" title="' + esc(k.ad) + '">' + avatar(k, 34) + '</span>'; }).join('');
        $('h3-kural').textContent = O.kural;
        if (st.faz === 'son' && !$('h3-son')) sonKart(tid);
        if (st.faz !== 'son') { const sk = $('h3-son'); if (sk) sk.remove(); }
        if (!G3) duz2B(tid);
    }
    function sonKart(tid) {
        const st = durum(tid), l = atabilenler(), kap = panel(tid).querySelector('.h3-sahne'); if (!kap) return;
        let bas = '', alt = '';
        if (tid === 'filo') { const v = st.kazanan || []; bas = '🏆 HAZİNEYİ BULANLAR'; alt = '<div class="h3-son-adlar buyuk">' + v.map((k) => '<span>' + esc(ilkAd(k.slice(k.indexOf('|') + 1))) + '</span>').join('') + '</div><p>Yarışı tamamlayanlar</p>'; }
        else if (st.kayip) { bas = st.kayip === 'batti' ? '💥 GEMİMİZ BATTI!' : '☠️ KORSAN BİZE ÇARPTI!'; alt = '<p>Bu sefer korsan kazandı. Korsanın canı %' + Math.ceil(st.hp / Math.max(1, st.hpMax) * 100) + ' kalmıştı. Rövanş?</p>'; }
        else { bas = tid === 'kacis' ? '🏝️ ADAYA VARDINIZ!' : '💥 KORSAN GEMİSİ BATTI!'; alt = '<p>Hazine bütün sınıfın — hep birlikte başardınız</p>'; }
        const adlar = '<div class="h3-son-adlar">' + (st.finalAdlar || l.map((s) => ilkAd(s.ad))).map((a) => '<span>' + esc(a) + '</span>').join('') + '</div>';
        const d = document.createElement('div'); d.id = 'h3-son'; d.className = 'h3-son';
        d.innerHTML = '<div class="h3-son-ic"><h2>' + bas + '</h2>' + alt + adlar + '<div class="h3-son-btn"><button type="button" id="h3-yeni-son">' + (st.kayip ? '↺ Rövanş' : '↺ Yeni oyun') + '</button></div></div>';
        kap.appendChild(d);
    }
    // 2B sade görünüm (WebGL yok / yavaş cihaz)
    function duz2B(tid) {
        const z = $('h3-2b'); if (!z) return; const st = durum(tid), l = atabilenler();
        if (tid === 'filo') z.innerHTML = '<div class="h3-2b-filo">' + l.map((s, i) => { const o = Math.min(1, st.x[kimlik(s)] || 0); return '<div class="h3-2b-hat"><span class="ad">' + esc(ilkAd(s.ad)) + '</span><span class="yol"><i style="left:' + (o * 92).toFixed(1) + '%;--r:' + renk(tid, liste().indexOf(s)) + '">⛵</i><b>🏝️</b></span></div>'; }).join('') + '</div>';
        else if (tid === 'kacis') { const o = st.hedef ? Math.min(1, st.yol / st.hedef) : 0, ko = Math.max(0, o - (st.hedef ? Math.max(0, st.ara) / st.hedef : 0.1)); z.innerHTML = '<div class="h3-2b-kacis"><span class="yol"><i class="biz" style="left:' + (o * 88).toFixed(1) + '%">⛵</i><i class="kor" style="left:' + (ko * 88).toFixed(1) + '%">🏴‍☠️</i><b>🏝️</b></span></div>'; }
        else z.innerHTML = '<div class="h3-2b-top"><span class="kor' + (st.faz === 'son' ? ' batti' : '') + '">🏴‍☠️</span><span class="biz">⛵</span></div>';
    }

    /* ---------------------------------------------------------------- seri */
    let _kilit = false, _z = [], _bekleyenTur = null; // _bekleyenTur: animasyon sonrası çalışacak tur sonu; yeni seri erken gelirse önce bu (görselsiz) çalışır
    const sonra = (fn, ms) => { const t = setTimeout(fn, ms); _z.push(t); };
    const zTemizle = () => { _z.forEach(clearTimeout); _z = []; };
    function h3Seri(tid, s, i, kaydedilecek, done) {
        if (_bekleyenTur) { const f = _bekleyenTur; _bekleyenTur = null; try { f(); } catch (e) { } }
        zTemizle();
        const st = durum(tid), bit = () => { _kilit = false; try { done(); } catch (e) { } hud(tid); };
        if (st.faz !== 'oyun') { try { done(); } catch (e) { } return; }
        _kilit = true;
        const key = kimlik(s), pl = (kaydedilecek || []).map((k) => puan(k.puan)), top = pl.reduce((a, b) => a + b, 0);
        olcek(st, pl.length);
        st.atan[key] = (st.atan[key] || 0) + 1; st.turPuan += top; st.turOk += pl.length;
        const adi = buyuk(ilkAd(s.ad)), cizili = !!panel(tid);
        if (tid === 'filo') {
            st.x[key] = Math.min(1.08, (st.x[key] || 0) + filoAdim(pl)); st.katki[key] = (st.katki[key] || 0) + top;
            if (cizili) {
                const sh = G3 && G3.kids && G3.kids[key];
                if (sh) { sh.userData.hedefX = XA0 + (XA1 - XA0) * Math.min(1, st.x[key]); sicrat(sh.position.x - 2, sh.position.z, pl.some((p) => p >= 9)); yuzen(tid, '+' + top, sh.position.clone().setY(9), pl.some((p) => p >= 9) ? '#f5c542' : '#fff'); kameraYerlestir(tid); }
                else yuzen(tid, adi + ' +' + top);
                if (pl.some((p) => p >= 9)) { afis(tid, 'RÜZGÂR ARKADAN!', '#f5c542'); SES.ruzgar(); } else SES.su();
            }
        } else if (tid === 'kacis') {
            st.yol = Math.min(st.hedef, st.yol + top); st.ara += top; st.katki[key] = (st.katki[key] || 0) + top;
            if (cizili) {
                kameraYerlestir(tid);
                if (G3 && G3.biz) { sicrat(G3.biz.position.x - 7, 0, top >= pl.length * 9); yuzen(tid, '+' + top, G3.biz.position.clone().setY(13), top >= pl.length * 9 ? '#f5c542' : '#fff'); an(0.6, (q) => { if (G3 && G3.biz) G3.biz.userData.yelkenler.forEach((y) => { y.scale.z = 1 + Math.sin(q * Math.PI) * (top / Math.max(1, pl.length * 10)) * 1.4; }); }); }
                else yuzen(tid, adi + ' +' + top);
                if (top >= pl.length * 9) { afis(tid, 'TAM RÜZGÂR!', '#f5c542'); SES.ruzgar(); } else SES.su();
            }
        } else {
            let toplamHasar = 0; pl.forEach((p) => { toplamHasar += topHasar(p); });
            st.katki[key] = (st.katki[key] || 0) + toplamHasar;
            const onceki = st.hp; st.hp = Math.max(0, st.hp - toplamHasar);
            const barutlu = st.hp > 0 && toplamHasar <= pl.length; if (barutlu) st.barut = (st.barut || 0) + 1;
            if (cizili && barutlu) sonra(() => { afis(tid, 'KORSAN BARUT BULDU! 💣\n' + (st.barut % 3 ? (3 - st.barut % 3) + ' barut daha = 1 top' : 'korsanın bir topu daha var'), '#ef5350'); SES.alarm(); hud(tid); }, pl.length * 380 + 500);
            if (cizili) pl.forEach((p, j) => sonra(() => atesEt(tid, p), j * 380));
            if (cizili && onceki > st.hpMax / 2 && st.hp <= st.hpMax / 2) sonra(() => { afis(tid, 'DİREK KIRILDI!', '#ef5350'); if (G3 && G3.korsan) an(1.2, (q) => { if (G3 && G3.korsan) G3.korsan.userData.direk.rotation.x = q * 1.3; }); }, pl.length * 380 + 200);
            if (cizili && onceki > 0 && st.hp <= 0) sonra(() => afis(tid, 'KORSAN GEMİSİ BATIYOR!\nherkes atınca dibe', '#f5c542'), pl.length * 380 + 600);
        }
        const turBitti = herkesAtti(st);
        kaydet(tid);
        if (!cizili) { if (turBitti) turSonu(tid, null); return bit(); }
        hud(tid);
        const bek = tid === 'topsavasi' ? pl.length * 380 + 900 : 900;
        if (turBitti) _bekleyenTur = () => turSonu(tid, null);
        sonra(() => { if (turBitti) { if (!_bekleyenTur) return bit(); _bekleyenTur = null; turSonu(tid, bit); } else bit(); }, bek);
    }
    function atesEt(tid, p) {
        if (!G3 || !G3.korsan) { yuzen(tid, p >= 9 ? 'TAM İSABET!' : p >= 5 ? '−' + topHasar(p) : 'ıska', null, p >= 9 ? '#f5c542' : '#fff'); SES.top(); return; }
        const T = THREE, hasar = topHasar(p), biz = G3.biz.position, kor = G3.korsan.position;
        const bas = new T.Vector3(biz.x + (Math.random() * 5 - 2.5), 2.6, biz.z - 2.4);
        const hed = new T.Vector3(kor.x + (Math.random() * 8 - 4) + (hasar ? 0 : (Math.random() < 0.5 ? -13 : 13)), hasar ? 3 + Math.random() * 3 : 0.4, kor.z + (hasar ? 1.5 : 4 - Math.random() * 10));
        parca(bas, 14, 0xffe08a, 4, 0.35, 0.9); SES.top();
        const gl = new T.Mesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshPhongMaterial({ color: 0x1f1f1f })); G3.S.add(gl);
        an(0.55, (q) => { gl.position.lerpVectors(bas, hed, q); gl.position.y += Math.sin(q * Math.PI) * 7; }, () => {
            if (G3) G3.S.remove(gl);
            if (hasar <= 1) { sicrat(hed.x, hed.z, false); SES.su(); yuzen(tid, hasar ? '−1' : 'ıska', hed.clone().setY(3), '#cfe8f5'); return; }
            patlat(hed, p >= 9); SES.patla(p >= 9); yuzen(tid, '−' + hasar, hed.clone().setY(hed.y + 3), p >= 9 ? '#f5c542' : '#fff');
            if (p >= 9) afis(tid, 'TAM İSABET!', '#f5c542');
            an(0.4, (q) => { if (G3 && G3.korsan) G3.korsan.rotation.x = Math.sin(q * Math.PI * 3) * 0.08; });
        });
    }
    // Tur sonu: oyun durumu HEMEN hesaplanır ve kaydedilir; zamanlayıcılar yalnız görsel (sonraki seri gelip zamanlayıcıları
    // temizlese de tur sayacı, korsan mesafesi, can kaybolmaz — 3B'de testte yakalandı).
    function turSonu(tid, sonraFn) {
        const st = durum(tid), l = atabilenler(), cizili = !!panel(tid) && !!sonraFn, son = () => { if (sonraFn) sonraFn(); };
        const biten = st.tur, ilerle = () => { st.tur++; st.turPuan = 0; st.turOk = 0; kaydet(tid); };
        if (tid === 'filo') {
            const varan = l.filter((s) => (st.x[kimlik(s)] || 0) >= 1).map(kimlik);
            if (varan.length) return bitir(tid, varan, cizili, son);
            ilerle(); if (!cizili) return son();
            const en = Math.max.apply(null, l.map((s) => st.x[kimlik(s)] || 0));
            afis(tid, biten + '. tur bitti\nen öndeki gemi yolun %' + Math.round(en * 100) + "'inde"); sonra(son, 1900); return;
        }
        if (tid === 'kacis') {
            if (st.yol >= st.hedef) return bitir(tid, null, cizili, son);
            st.ara -= st.korsanHiz; let yakalandi = false;
            if (st.ara <= 0) { yakalandi = true; st.yol = Math.max(0, st.yol - st.geriDusme); st.ara = Math.round(st.korsanHiz * 0.6); }
            ilerle(); if (!cizili) return son();
            const ara = st.ara, yakin = ara < st.korsanHiz * 0.5;
            afis(tid, 'KORSANLAR YAKLAŞIYOR!', '#ef5350'); SES.alarm(); kameraYerlestir(tid);
            sonra(() => {
                if (yakalandi) { if (G3 && G3.biz) patlat(G3.biz.position.clone().setY(4), true); SES.patla(true); afis(tid, 'YAKALADILAR!\nyelkenler yırtıldı, kaçış sürüyor', '#ef5350'); kameraYerlestir(tid); }
                else afis(tid, yakin ? 'ÇOK YAKINLAR!\n' + Math.round(ara) + ' puan geride' : 'Korsanlar ' + Math.round(ara) + ' puan geride', yakin ? '#ef5350' : '#fff');
                hud(tid);
            }, 1700);
            sonra(son, 3600); return;
        }
        // top savaşı
        if (st.hp <= 0) return bitir(tid, null, cizili, son);
        const toplar = Math.max(1, Math.floor((st.barut || 0) / 3));
        st.can = Math.max(0, st.can - toplar); st.barut = 0; st.kalan = (st.kalan == null ? TOP_TUR : st.kalan) - 1;
        const kayip = st.can <= 0 ? 'batti' : st.kalan <= 0 ? 'carpti' : null;
        if (kayip) return kaybet(tid, kayip, cizili, son, toplar);
        ilerle(); if (!cizili) return son();
        const kalanCan = st.can, kalanTur = st.kalan;
        afis(tid, 'KORSANLAR ATEŞ AÇIYOR!\n💣 × ' + toplar, '#ef5350'); SES.alarm();
        sonra(() => { korsanVur(toplar); }, 1300);
        sonra(() => { kameraYerlestir(tid); afis(tid, kalanTur === 1 ? 'SON TUR!\nbatıramazsak korsan çarpacak' : 'GEMİ YARA ALDI! kalan can ' + kalanCan + '\nkorsan ' + kalanTur + ' tur sonra çarpar', '#ef5350'); hud(tid); }, 1500 + toplar * 300);
        sonra(son, 3700 + toplar * 300);
    }
    function korsanVur(n) {
        for (let k = 0; k < Math.min(n, 6); k++) sonra(() => {
            if (!G3 || !G3.biz || !G3.korsan) { SES.top(); return; }
            const T = THREE, bas = G3.korsan.position.clone().setY(4), hed = new T.Vector3(G3.biz.position.x + (Math.random() * 8 - 4), 3.5, G3.biz.position.z);
            const gl = new T.Mesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshPhongMaterial({ color: 0x1f1f1f })); G3.S.add(gl); SES.top();
            an(0.6, (q) => { gl.position.lerpVectors(bas, hed, q); gl.position.y += Math.sin(q * Math.PI) * 7; }, () => { if (G3) G3.S.remove(gl); patlat(hed, true); SES.patla(true); });
        }, k * 300);
    }
    function kaybet(tid, neden, cizili, son, toplar) {
        const st = durum(tid), l = atabilenler();
        st.faz = 'son'; st.kayip = neden; st.finalAdlar = l.map((s) => ilkAd(s.ad)); kaydet(tid);
        if (!cizili) { if (son) son(); return; }
        const ek = neden === 'batti' ? toplar * 300 : 0;
        afis(tid, neden === 'batti' ? 'KORSANLAR ATEŞ AÇIYOR!\n💣 × ' + toplar : 'KORSAN TAM YOL GELİYOR!', '#ef5350'); SES.alarm();
        if (neden === 'batti') sonra(() => korsanVur(toplar), 1300); else kameraYerlestir(tid);
        sonra(() => {
            if (G3 && G3.biz) { patlat(G3.biz.position.clone().setY(4), true); SES.patla(true); if (neden === 'batti') an(2.5, (q) => { if (G3 && G3.biz) G3.biz.userData.taban = -q * 7; }); }
            afis(tid, neden === 'batti' ? 'GEMİMİZ BATIYOR!\nbu sefer korsan kazandı' : 'KORSAN ÇARPTI!\nbu sefer korsan kazandı', '#ef5350');
        }, 2400 + ek);
        setTimeout(() => { hud(tid); if (son) son(); }, 5200 + ek);
    }
    function bitir(tid, varan, cizili, son) {
        const st = durum(tid), l = atabilenler();
        st.faz = 'son'; st.kazanan = varan || null; st.finalAdlar = l.map((s) => ilkAd(s.ad)); kaydet(tid);
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.hazine3b = o.hazine3b || {}; o.hazine3b[tid] = (o.hazine3b[tid] || 0) + 1; });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
        if (!cizili) { if (son) son(); return; }
        const kutla = () => { kameraYerlestir(tid); sandikAc(); SES.zil(); };
        if (tid === 'topsavasi' && G3 && G3.korsan) {
            afis(tid, 'KORSAN GEMİSİ BATIYOR!', '#f5c542'); patlat(G3.korsan.position.clone().setY(4), true); SES.patla(true);
            an(3, (q) => { if (G3 && G3.korsan) { G3.korsan.userData.taban = -q * 9; G3.korsan.rotation.z = q * 0.7; } }, () => { kutla(); sonra(() => { afis(tid, 'HAZİNE SİZİN!\nbütün sınıf birlikte batırdı', '#f5c542'); }, 600); });
            setTimeout(() => { hud(tid); if (son) son(); }, 5600);
        } else {
            kutla();
            afis(tid, tid === 'kacis' ? 'ADAYA VARDINIZ!\nhazine bütün sınıfın' : 'HAZİNEYİ BULANLAR\n' + (varan || []).map((k) => ilkAd(k.slice(k.indexOf('|') + 1))).join(' · '), '#f5c542');
            setTimeout(() => { hud(tid); if (son) son(); }, 2600);
        }
    }

    /* ---------------------------------------------------------------- kabuk */
    function yeniOyunSor(tid) {
        const f = () => { zTemizle(); _kilit = false; _bekleyenTur = null; _onbellek[tid] = { ham: null, kn: konum(), st: yeniOyun(tid) }; kaydet(tid); h3SahneKur(tid); };
        const st = durum(tid);
        if (st.faz !== 'oyun' || !Object.keys(st.atan).length) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni oyun başlasın mı?<br><small>Sporcu serileri silinmez.</small>', f, 'Yeni oyun', 'Vazgeç'); else f();
    }
    function h3SahneKur(tid) {
        const p = panel(tid); if (!p) return;
        css(); zTemizle(); _kilit = false; sahne3Kapat();
        TIDLER.forEach((t) => { const d = panel(t); if (d && t !== tid) { d.innerHTML = ''; d.onclick = null; } }); // üç panel sayfada birlikte durur: kimlikler çakışmasın
        const O = OYUN[tid];
        p.innerHTML = '<div class="h3-sahne" data-oyun="' + tid + '"><div class="h3-2b" id="h3-2b"></div>'
            + '<div class="h3-hud" id="h3-hud"><div class="h3-ust"><div class="h3-kutu h3-sira" id="h3-sira"></div><div class="h3-kutu h3-durum" id="h3-durum"></div></div>'
            + '<div class="h3-alt"><div class="h3-serit" id="h3-serit"></div><div class="h3-araclar"><span class="h3-baslik">' + O.ikon + ' ' + O.ad + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</span><button type="button" id="h3-nasil">❓ Nasıl oynanır</button><button type="button" id="h3-yeni-btn">↺ Yeni oyun</button></div><div class="h3-kural" id="h3-kural"></div></div></div>'
            + '<div class="h3-afis" id="h3-afis"></div></div>';
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'h3-yeni-btn' || t.id === 'h3-yeni-son') yeniOyunSor(tid);
            else if (t.id === 'h3-nasil' && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('<b>' + O.ikon + ' ' + O.ad + '</b><br>' + O.kural + '<br><small>Kazanan ancak herkes attıktan sonra belli olur.</small>', () => { }, 'Tamam', 'Kapat');
        };
        const kap = p.querySelector('.h3-sahne');
        hud(tid);
        if (!webglVar()) { kap.classList.add('duz'); duz2B(tid); return; }
        threeHazir().then(() => {
            if (!kap.isConnected || aktifTema() !== tid) return;
            try { sahne3Kur(tid, kap); sahneOyunKur(tid); kap.classList.remove('duz'); hud(tid); G3.son = 0; G3.raf = requestAnimationFrame(dongu); }
            catch (e) { console.warn('hazine3b', e); sahne3Kapat(); kap.classList.add('duz'); duz2B(tid); }
        }).catch(() => { kap.classList.add('duz'); duz2B(tid); });
    }
    function h3Guncelle(tid) {
        const p = panel(tid); if (!p) return;
        if (!$('h3-hud') || !p.querySelector('.h3-sahne[data-oyun="' + tid + '"]')) return h3SahneKur(tid);
        if (_kilit) return;
        if (G3 && G3.tid === tid) {
            // roster değiştiyse (kimler var) sahneyi yeniden diz
            const imza = atabilenler().map(kimlik).join(',');
            if (G3.imza !== imza) { G3.imza = imza; sahneOyunKur(tid); }
            else kameraYerlestir(tid);
        }
        hud(tid);
    }
    function h3GeriYukle(tid, snap) {
        if (!snap) return; zTemizle(); _kilit = false; _bekleyenTur = null;
        _onbellek[tid] = { ham: null, kn: konum(), st: snap }; kaydet(tid);
        const sk = $('h3-son'); if (sk) sk.remove();
        if (G3 && G3.tid === tid) sahneOyunKur(tid);
        hud(tid);
    }
    function css() {
        if ($('h3-css')) return; const st = document.createElement('style'); st.id = 'h3-css';
        st.textContent = [
            '.km-oyun-panel-filo,.km-oyun-panel-kacis,.km-oyun-panel-topsavasi{flex-direction:column;right:0}',
            '.h3-sahne{position:relative;flex:1;min-height:420px;width:100%;height:100%;overflow:hidden;border-radius:inherit;background:linear-gradient(#3f9fe6 0%,#8fd0f7 34%,#cfeeff 58%,#cfeeff 100%);font-family:Inter,system-ui,sans-serif;color:#f1f7fb}',
            '.h3-sahne.duz{background:linear-gradient(#3f9fe6 0%,#8fd0f7 30%,#1d8fb8 30.5%,#0e5f86 100%)}',
            '.h3-tuval{position:absolute;inset:0;width:100%;height:100%;display:block}',
            '.h3-hud{position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:12px}',
            '.h3-hud button,.h3-hud .h3-k{pointer-events:auto}',
            '.h3-ust{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}',
            '.h3-kutu{background:rgba(8,20,30,.8);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px 14px;backdrop-filter:blur(6px)}',
            '.h3-sira{display:flex;align-items:center;gap:12px;min-width:200px}',
            '.h3-av{flex:none;border-radius:50%;display:grid;place-items:center;background:#1a3040;background-size:cover;background-position:center;color:#cfe3ee;font-weight:800}',
            '.h3-sira .h3-av{box-shadow:0 0 0 3px #f5c542}',
            '.h3-sira-yazi small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:#f5c542}.h3-sira-yazi b{display:block;font-size:22px;line-height:1.1}',
            '.h3-durum{flex:1 1 260px;min-width:0;max-width:560px;margin-left:auto;display:flex;flex-direction:column;gap:6px}',
            '.h3-sat{display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:700}.h3-sat span:last-child{color:#cfe3ee}.h3-sat .kirmizi{color:#ff6b6b!important}.h3-sat.ince{font-size:11.5px;opacity:.8}',
            '.h3-cub{height:12px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden}.h3-cub i{display:block;height:100%;border-radius:inherit;transition:width .45s}',
            '.h3-can{letter-spacing:2px}',
            '.h3-alt{display:flex;flex-direction:column;gap:8px;align-items:flex-start;max-width:calc(100% - var(--km-dok-genislik,0px))}',
            '.h3-serit{display:flex;gap:4px;flex-wrap:wrap;max-width:min(720px,100%);background:rgba(8,20,30,.55);border-radius:14px;padding:6px}',
            '.h3-k{position:relative;border-radius:50%;opacity:.5}.h3-k .h3-av{box-shadow:0 0 0 2px var(--r)}.h3-k.atti{opacity:1}.h3-k.su{opacity:1}.h3-k.su .h3-av{box-shadow:0 0 0 3px #fff,0 0 12px #fff}',
            '.h3-k.atti::after{content:"✓";position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;background:#5ec98b;color:#062214;font-size:10px;font-weight:900;display:grid;place-items:center}',
            '.h3-araclar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.h3-baslik{font-weight:900;font-size:14px;background:rgba(8,20,30,.7);border-radius:999px;padding:6px 12px}',
            '.h3-araclar button{border:1px solid rgba(255,255,255,.18);background:rgba(8,20,30,.75);color:#f1f7fb;border-radius:999px;padding:6px 12px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;min-height:36px}',
            '.h3-kural{font-size:12.5px;font-weight:700;background:rgba(8,20,30,.6);border-radius:10px;padding:5px 10px;max-width:620px}',
            '.h3-afis{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-family:"Barlow Condensed",Impact,"Arial Narrow",sans-serif;font-weight:800;font-size:clamp(30px,6.5vw,96px);line-height:1;text-align:center;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.35),0 0 40px rgba(0,0,0,.45);pointer-events:none;opacity:0;white-space:pre-line;width:92%}',
            '.h3-afis.gor{animation:h3Afis 1.9s ease-out}@keyframes h3Afis{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}22%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%) scale(1)}}',
            '.h3-yuzen{position:absolute;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:34px;pointer-events:none;text-shadow:0 2px 0 rgba(0,0,0,.5);animation:h3Yuz 1.1s ease-out forwards;transform:translate(-50%,-50%);z-index:3}',
            '@keyframes h3Yuz{0%{opacity:0;margin-top:10px}15%{opacity:1}100%{opacity:0;margin-top:-70px}}',
            '.h3-son{position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,15,25,.35);z-index:4;padding:16px;pointer-events:auto}',
            '.h3-son-ic{max-width:760px;width:100%;text-align:center;background:rgba(8,20,30,.88);border:2px solid #f5c542;border-radius:22px;padding:20px 18px;display:flex;flex-direction:column;gap:10px;align-items:center}',
            '.h3-son-ic h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(30px,5vw,56px);color:#f5c542;line-height:1}.h3-son-ic p{margin:0;font-weight:700;color:#cfe3ee}',
            '.h3-son-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.h3-son-adlar span{background:rgba(255,255,255,.1);border-radius:999px;padding:4px 12px;font-weight:800;font-size:14px}.h3-son-adlar.buyuk span{background:#f5c542;color:#2b2000;font-size:18px}',
            '.h3-son-btn button{border:0;background:#f5c542;color:#2b2000;border-radius:999px;padding:10px 22px;font:inherit;font-weight:900;cursor:pointer;min-height:44px}',
            '.h3-2b{position:absolute;inset:0;display:none;padding:110px 16px 150px;overflow:auto}.h3-sahne.duz .h3-2b{display:block}',
            '.h3-2b-filo{display:flex;flex-direction:column;gap:4px;max-width:900px}.h3-2b-hat{display:grid;grid-template-columns:80px 1fr;gap:8px;align-items:center;font-weight:800;font-size:13px}',
            '.h3-2b-hat .yol,.h3-2b-kacis .yol{position:relative;height:26px;border-radius:999px;background:rgba(255,255,255,.12)}.h3-2b-hat i,.h3-2b-kacis i{position:absolute;top:50%;transform:translateY(-50%);font-style:normal;font-size:22px;transition:left .6s;filter:drop-shadow(0 0 4px var(--r,#fff))}.h3-2b-hat b,.h3-2b-kacis b{position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:20px}',
            '.h3-2b-kacis{padding-top:60px;max-width:900px}.h3-2b-kacis .yol{height:60px}.h3-2b-kacis i{font-size:46px}.h3-2b-kacis b{font-size:44px}',
            '.h3-2b-top{display:flex;justify-content:space-around;align-items:center;font-size:110px;padding-top:40px}.h3-2b-top .batti{transform:rotate(40deg) translateY(30px);opacity:.4;transition:all 1s}',
            '@media (max-width:860px){.h3-sira-yazi b{font-size:17px}.h3-durum{margin-left:0;max-width:none}.h3-sahne{min-height:520px}.h3-kural{display:none}}',
            '@media (prefers-reduced-motion:reduce){.h3-afis.gor,.h3-yuzen{animation-duration:.01s}}'
        ].join('\n');
        document.head.appendChild(st);
    }
    window.h3SahneKur = h3SahneKur;
    window.h3Guncelle = h3Guncelle;
    window.h3Seri = h3Seri;
    window.h3Anlik = (tid) => JSON.parse(JSON.stringify(durum(tid)));
    window.h3GeriYukle = h3GeriYukle;
    window.h3Sporcu = (tid, g, ad) => { const st = durum(tid), k = g + '|' + ad; return tid === 'filo' ? Math.round(Math.min(1, st.x[k] || 0) * 100) : (st.katki[k] || 0); };
    window.h3Durum = durum;
    window.h3Oyunlar = TIDLER;
    window._h3Ic = { TOP_CAN, TOP_TUR, filoAdim, topHasar, olcek, OYUN, ekran: (ad) => { if (!G3) return null; const o = ad === 'korsan' ? G3.korsan : ad === 'biz' ? G3.biz : null; if (!o) return null; const v = o.position.clone().setY(4).project(G3.cam); return { x: Math.round((v.x + 1) / 2 * G3.kap.clientWidth), y: Math.round((1 - v.y) / 2 * G3.kap.clientHeight), w: G3.kap.clientWidth, h: G3.kap.clientHeight }; } };
})();
