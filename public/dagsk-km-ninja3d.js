/* ================================================================================================
   🥷 GÖLGE YOLU 3B — iki ayrı Oyunlar teması (2026-11-16, v421). Kullanıcı Ninja için "bu oyun mantığında (Hazine 3B) ilerlemeli"
   bir oyun istedi; oynanabilir taslağı (https://claude.ai/artifact/YX9RUWKAKLwBt31D1xTJsU) açıp "A ve C'yi ayrı yap" dedi.
     · 'catikosu'  🥷 Çatı Koşusu  — bireysel: her sporcunun kendi ninjası, seri puanı kadar koşar. Çatı arasını atlamak için
                                     seride en az yarı puan (3 okta 15); 15-17 kıl payı tutunur, 27+ takla. Aynı aralıkta 2 kez kalana
                                     sensei yardım eder (eşik %40). Tur sonunda herkes kapıdaysa ya da 5. tur bittiyse bölüm biter;
                                     kapıya varanlar ⭐ alır, yıldızlar kuşak yükseltir (Beyaz → Siyah).
     · 'ejderkule' 🐉 Ejder Kulesi — hep birlikte: her ok muhafıza bir shuriken (puanı kadar hasar). Muhafız ancak herkes atınca
                                     düşer; klan bir kat çıkar. 5. kat Kızıl Ejder.
   İLERLEME: 5 bölüm (Köy Çatıları, Bambu Ormanı, Şelale Köprüsü, Kale Surları, Ejder Kulesi). Bölüm + yıldızlar
   'dag_km_n3ilerleme_<tid>_<konum>' (12 saat kuralına GİRMEZ, cihazlara km-ortak ile gider). Günlük oyun 'dag_km_n3_<tid>_<konum>'.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz; ortak oyunda finalde herkesin adı; tur içinde puan sıralaması yok.
   KABUK: n3SahneKur · n3Guncelle · n3Seri(tid, s, i, kaydedilecek, done) · n3Anlik · n3GeriYukle · n3Sporcu (dagsk-km-hazine3d.js ile aynı yapı).
   WebGL yoksa / yazılımsal çizimse / yavaşsa sade 2B (dag_h3_2b bayrağı Hazine ile ortak).
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
    const renk = (tid, i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk(tid, i) : '#7dd3fc');
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    const anahtar = (tid) => 'dag_km_n3_' + tid + '_' + konum();
    const ilerAnahtar = (tid) => 'dag_km_n3ilerleme_' + tid + '_' + konum();
    const panel = (tid) => $('km-oyun-panel-' + tid);
    const aktifTema = () => (typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : '');
    const OYUN = {
        catikosu: { ad: 'Çatı Koşusu', ikon: '🥷', kural: 'Her ok ninjanı ileri koşturur. Çatı arasını atlamak için seride en az yarı puan gerek (3 okta 15). Kapıya varan yıldız alır, yıldızlar kuşağı yükseltir. En çok 5 tur.' },
        ejderkule: { ad: 'Ejder Kulesi', ikon: '🐉', kural: 'Her ok muhafıza bir shuriken: puanı kadar hasar. Herkes atınca muhafızın canı bittiyse düşer, klan bir kat yukarı çıkar. 5. katta Kızıl Ejder.' }
    };
    const TIDLER = Object.keys(OYUN);
    const BOLUM = [
        { ad: 'Köy Çatıları', ikon: '🏮', gok: 0x0a1330, sis: 0x0f1a3a, govde: 0x1d2238, ust: 0x3a2c3c, isik: 0xffa04a, muh: 'Taş Muhafız', mr: 0x8a90a8, tip: 'koy', e2: '🗿' },
        { ad: 'Bambu Ormanı', ikon: '🎋', gok: 0x07201c, sis: 0x0e2e26, govde: 0x2f2416, ust: 0x6a4a28, isik: 0xb6f07a, muh: 'Bambu Gölgesi', mr: 0x3f9f5f, tip: 'bambu', e2: '👤' },
        { ad: 'Şelale Köprüsü', ikon: '🌊', gok: 0x061c2a, sis: 0x0b2a3a, govde: 0x29343c, ust: 0x56646c, isik: 0x7fdcff, muh: 'Şelale Ruhu', mr: 0x4fb8e0, tip: 'selale', e2: '👻' },
        { ad: 'Kale Surları', ikon: '🏯', gok: 0x170e2c, sis: 0x22143a, govde: 0x34304a, ust: 0x5c5672, isik: 0xffb347, muh: 'Kale Samurayı', mr: 0xc04848, tip: 'sur', e2: '👹' },
        { ad: 'Ejder Kulesi', ikon: '🐉', gok: 0x260810, sis: 0x360c18, govde: 0x4a121c, ust: 0x7c1c28, isik: 0xffd23f, muh: 'Kızıl Ejder', mr: 0xe0402a, tip: 'kule', e2: '🐉' }
    ];
    const KUSAK = [['Beyaz', 0xf2f2f2], ['Sarı', 0xffd23f], ['Turuncu', 0xff8a3d], ['Yeşil', 0x3fbf5f], ['Mavi', 0x3b82f6], ['Kahverengi', 0x8b5a2b], ['Siyah', 0x15161a]];

    /* ---------------------------------------------------------------- kurallar (saf) */
    const L = 110, DER = 26, MAKS_TUR = 5;
    const adim = (oran) => oran * 40.5;                 // 3 okta seri toplamı × 1.35 (ortalama 18 → ~5 turda kapı)
    const ESIK = 0.5, ESIK_SENSEI = 0.4, KIL = 0.6, TAKLA = 0.9;
    function parkur(bolum) {                            // platformlar + çatı araları (bölüm ilerledikçe aralık genişler)
        const gen = 4 + bolum * 0.5, kenar = [24, 52, 80], r = rnd(bolum + 11), hs = [4, 5.2, 4.4, 5.6].map((h) => h + (r() - 0.5) * 1.2), P = [];
        let a = -30; kenar.forEach((k, j) => { P.push({ a: a, b: k, h: hs[j] }); a = k + gen; }); P.push({ a: a, b: L + 30, h: hs[3] });
        const B = []; for (let j = 0; j < 3; j++) B.push({ k: j, a: P[j].b, b: P[j + 1].a, h0: P[j].h, h1: P[j + 1].h });
        return { P: P, B: B };
    }
    // Bir seri: s0'dan kaç birim ilerler, hangi aralıkta durur (saf; testte de kullanılır)
    function kosuHesap(s0, oran, hata, key, bolum) {
        const { B } = parkur(bolum); let s1 = Math.min(L, s0 + adim(oran)), kil = false, kaldi = null, sensei = false;
        if (s0 >= L) return { s1: s0, kil: false, kaldi: null, sensei: false };
        for (const g of B) {
            if (g.a > s0 && g.a < s1) {
                const an = key + '#' + g.k, yardim = (hata[an] || 0) >= 2, esik = yardim ? ESIK_SENSEI : ESIK;
                if (oran >= esik) { if (s1 < g.b + 0.7) s1 = Math.min(L, g.b + 0.7); if (oran < KIL) kil = true; if (yardim && oran < ESIK) sensei = true; }
                else { s1 = g.a - 0.5; hata[an] = (hata[an] || 0) + 1; kaldi = g; break; }
            }
        }
        return { s1: s1, kil: kil, kaldi: kaldi, sensei: sensei };
    }
    function muhafizCan(bolum, n, k) { return Math.max(40, Math.round(n * k * (bolum === 4 ? 10 : 8))); }
    function rnd(t) { let s = t * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

    /* ---------------------------------------------------------------- ilerleme (kalıcı) + günlük durum */
    function ilerleme(tid) {
        let o = null; try { o = JSON.parse(localStorage.getItem(ilerAnahtar(tid)) || 'null'); } catch (e) { }
        if (!o || typeof o.bolum !== 'number') o = { bolum: 0, yildiz: {}, tamam: 0 };
        o.yildiz = o.yildiz || {}; return o;
    }
    function ilerKaydet(tid, o) { try { localStorage.setItem(ilerAnahtar(tid), JSON.stringify(o)); } catch (e) { } }
    const yildizSay = (tid, key) => (ilerleme(tid).yildiz[key] || 0);
    const kusak = (key) => KUSAK[Math.min(6, yildizSay('catikosu', key))];
    const _onbellek = {};
    function yeniOyun(tid) { return { tid: tid, tarih: bugun(), bolum: ilerleme(tid).bolum, tur: 1, atan: {}, katki: {}, faz: 'oyun', pos: {}, hata: {}, hp: 0, hpMax: 0, varan: null, finalAdlar: null, ilerlemeOnce: null }; }
    function durum(tid) {
        let ham = null; try { ham = localStorage.getItem(anahtar(tid)); } catch (e) { }
        const o = _onbellek[tid];
        if (!o || o.ham !== ham || o.kn !== konum()) { let st = null; try { st = JSON.parse(ham || 'null'); } catch (e) { st = null; } _onbellek[tid] = { ham: ham, kn: konum(), st: st }; }
        let st = _onbellek[tid].st;
        if (!st || st.tarih !== bugun() || st.tid !== tid) { st = yeniOyun(tid); _onbellek[tid].st = st; kaydet(tid); }
        return st;
    }
    function kaydet(tid) { const st = _onbellek[tid] && _onbellek[tid].st; if (!st) return; try { const h = JSON.stringify(st); localStorage.setItem(anahtar(tid), h); _onbellek[tid].ham = h; } catch (e) { } }
    // atan[key] = o sporcunun en son attığı tur (geç gelen sporcu bir seriyle turu tamamlar)
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= st.tur); };
    const buTurAtan = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= st.tur).length;
    const kapida = (st) => atabilenler().filter((s) => (st.pos[kimlik(s)] || 0) >= L);

    /* ---------------------------------------------------------------- ses */
    let AC = null;
    function ac() { if (!sesAcik()) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
    function gurultu(sure, gur, f, gec) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; g.gain.value = gur; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t); } catch (e) { } }
    function ton(f, sure, gur, gec, tip) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain(); o.type = tip || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gur, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + sure); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + sure + 0.05); } catch (e) { } }
    const SES = {
        kos: () => { for (let i = 0; i < 4; i++) gurultu(0.06, 0.12, 1800, i * 0.11); },
        swish: (gec) => gurultu(0.25, 0.25, 3200, gec || 0),
        cin: (gec) => { ton(1760, 0.18, 0.05, gec || 0, 'sine'); ton(2637, 0.12, 0.03, (gec || 0) + 0.02, 'sine'); },
        vurus: (gec) => { gurultu(0.18, 0.35, 700, gec || 0); ton(110, 0.2, 0.15, gec || 0, 'sine'); },
        gong: () => { ton(98, 2.4, 0.22, 0, 'sine'); ton(196, 1.8, 0.1, 0, 'sine'); ton(293, 1.2, 0.05, 0.02, 'sine'); },
        zil: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.5, 0.09, i * 0.12)),
        kukre: () => { ton(80, 0.6, 0.2, 0, 'sawtooth'); gurultu(0.6, 0.25, 300); }
    };

    /* ---------------------------------------------------------------- 3B yetenek */
    function webglVar() {
        try { if (localStorage.getItem('dag_h3_2b') === '1') return false; if (window.__h3Zorla3B) return true; } catch (e) { }
        try { const c = document.createElement('canvas'), gl = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')); if (!gl) return false; const d = gl.getExtension('WEBGL_debug_renderer_info'), ad = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !/swiftshader|llvmpipe|software|basic render/i.test(ad); } catch (e) { return false; }
    }
    function threeHazir() { return typeof THREE !== 'undefined' ? Promise.resolve() : (typeof dagskEkYukle === 'function' ? dagskEkYukle('vendor/three-r128.min.js') : Promise.reject()); }

    /* ---------------------------------------------------------------- 3B sahne */
    let G3 = null, PARLA = null;
    function sahne3Kapat() {
        if (!G3) return; try { cancelAnimationFrame(G3.raf); } catch (e) { } try { G3.ro && G3.ro.disconnect(); } catch (e) { }
        try { temizle(G3.S); } catch (e) { }
        try { G3.R.dispose(); G3.R.forceContextLoss && G3.R.forceContextLoss(); } catch (e) { } try { G3.R.domElement.remove(); } catch (e) { } G3 = null;
    }
    function temizle(o) { o.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => { if (m.map && m.map !== PARLA) m.map.dispose(); m.dispose(); }); }); }
    function sahne3Kur(tid, kap) {
        const T = THREE, R = new T.WebGLRenderer({ antialias: true });
        R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); R.domElement.className = 'n3-tuval';
        kap.insertBefore(R.domElement, kap.firstChild);
        const S = new T.Scene(), cam = new T.PerspectiveCamera(46, 16 / 9, 0.1, 600);
        const hemi = new T.HemisphereLight(0x8899ff, 0x111122, 0.55); S.add(hemi);
        const ay = new T.DirectionalLight(0xcfd8ff, 0.95); ay.position.set(-30, 50, 30); S.add(ay);
        const dolgu = new T.DirectionalLight(0xff9a50, 0.35); dolgu.position.set(40, 10, -20); S.add(dolgu);
        if (!PARLA) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); PARLA = new T.CanvasTexture(c); }
        G3 = { tid: tid, R: R, S: S, cam: cam, kap: kap, hemi: hemi, dolgu: dolgu, an: [], t: 0, kareSure: [], olcuBitti: false, camP: new T.Vector3(-10, 14, 30), camH: new T.Vector3(-10, 14, 30), odak: new T.Vector3(0, 4, 0), bak: new T.Vector3(0, 4, 0), nin: {}, dunya: null, sonHareket: null };
        boyut();
        if (window.ResizeObserver) { G3.ro = new ResizeObserver(boyut); G3.ro.observe(kap); }
        return G3;
    }
    function boyut() { if (!G3) return; const w = G3.kap.clientWidth || 800, h = G3.kap.clientHeight || 450; G3.R.setSize(w, h, false); G3.cam.aspect = w / h; G3.cam.fov = w / h < 1 ? 60 : 46; G3.cam.updateProjectionMatrix(); }
    const dik = () => !!(G3 && G3.cam.aspect < 1.1);
    function mat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.05 }, o || {})); }
    function kutu(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
    function parlama(rk, boy) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: PARLA, color: rk, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(boy, boy, 1); return s; }
    function etiket(metin, rk, boy) {
        const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d');
        x.font = '900 34px Nunito, Inter, system-ui, sans-serif'; const w = Math.min(506, x.measureText(metin).width + 28);
        x.fillStyle = 'rgba(5,8,18,.72)'; x.beginPath(); if (x.roundRect) x.roundRect((512 - w) / 2, 8, w, 48, 24); else x.rect((512 - w) / 2, 8, w, 48); x.fill();
        x.fillStyle = rk || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(metin, 256, 33);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
        s.scale.set((boy || 2) * 2, (boy || 2) / 4, 1); s.renderOrder = 20; return s;
    }
    function an(sure, fn, bit, gec) { if (G3) G3.an.push({ t: -(gec || 0), sure: sure, fn: fn, bit: bit }); else { fn(1); if (bit) bit(); } }
    const kolay = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    function kivilcim(pos, rk, adet) {
        if (!G3 || azHareket()) return; const D = G3.dunya;
        for (let k = 0; k < (adet || 10); k++) { const p = parlama(rk, 1.2); p.position.copy(pos); D.add(p); const v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 6 + 2, (Math.random() - 0.5) * 6);
            an(0.8, (q) => { p.position.addScaledVector(v, 0.016); v.y -= 0.16; p.material.opacity = 1 - q; }, () => { D.remove(p); p.material.dispose(); }); }
    }

    // ---- ninja
    function ninjaYap(ad, rkCss, kusakHex) {
        const T = THREE, rk = new T.Color(rkCss).getHex(), g = new T.Group(), piv = new T.Group(); piv.position.y = 1.1; g.add(piv);
        const siyah = mat(0x14161c, { roughness: 0.9 }), kum = mat(rk, { emissive: rk, emissiveIntensity: 0.45 }), km = mat(kusakHex, { emissive: kusakHex, emissiveIntensity: 0.15 });
        const gv = new T.Mesh(new T.CylinderGeometry(0.3, 0.4, 0.95, 10), siyah); gv.position.y = 0.02; piv.add(gv);
        const ke = new T.Mesh(new T.CylinderGeometry(0.405, 0.405, 0.12, 12), km); ke.position.y = -0.38; piv.add(ke);
        const bas = new T.Mesh(new T.SphereGeometry(0.33, 14, 12), siyah); bas.position.y = 0.72; piv.add(bas);
        const bant = new T.Mesh(new T.CylinderGeometry(0.345, 0.345, 0.13, 14), kum); bant.position.y = 0.8; piv.add(bant);
        const goz = kutu(0.06, 0.07, 0.34, new T.MeshBasicMaterial({ color: 0xffffff })); goz.position.set(0.29, 0.7, 0); piv.add(goz);
        const k1 = kutu(0.5, 0.07, 0.12, kum); k1.position.set(-0.5, 0.82, 0.06); piv.add(k1);
        const k2 = kutu(0.45, 0.07, 0.12, kum); k2.position.set(-0.55, 0.72, -0.08); piv.add(k2);
        const kl = kutu(0.06, 1.1, 0.06, mat(0x8a6a3a)); kl.position.set(-0.3, 0.25, 0); kl.rotation.z = 0.7; piv.add(kl);
        const kollar = [], bacak = [];
        [-1, 1].forEach((y) => { const k = new T.Group(); k.position.set(0, 0.35, 0.42 * y); const m = kutu(0.13, 0.55, 0.13, siyah); m.position.y = -0.26; k.add(m); piv.add(k); kollar.push(k); });
        [-1, 1].forEach((y) => { const b = new T.Group(); b.position.set(0, -0.45, 0.17 * y); const m = kutu(0.16, 0.62, 0.16, siyah); m.position.y = -0.3; b.add(m); piv.add(b); bacak.push(b); });
        const e = etiket(ad, rkCss, 1.7); e.position.y = 2.75; g.add(e);
        g.userData = { piv: piv, bacak: bacak, kollar: kollar, kuyruk: [k1, k2], kosUntil: 0, s: 0, faz: Math.random() * 6 };
        return g;
    }
    function ninjaAnim(n, t) {
        const u = n.userData, kos = t < u.kosUntil, a = kos ? Math.sin(t * 15 + u.faz) * 0.9 : Math.sin(t * 2 + u.faz) * 0.05;
        u.bacak[0].rotation.z = a; u.bacak[1].rotation.z = -a; u.kollar[0].rotation.z = -a * 0.8; u.kollar[1].rotation.z = a * 0.8;
        u.kuyruk[0].rotation.z = 0.3 + Math.sin(t * (kos ? 18 : 4) + u.faz) * 0.25; u.kuyruk[1].rotation.z = 0.15 + Math.cos(t * (kos ? 16 : 3) + u.faz) * 0.25;
    }

    // ---- dünya
    function gokKur(b, D) {
        const T = THREE; G3.S.background = new T.Color(b.gok); G3.S.fog = new T.Fog(b.sis, 45, 190);
        G3.hemi.groundColor.setHex(b.govde); G3.dolgu.color.setHex(b.isik);
        const ayM = new T.Mesh(new T.SphereGeometry(9, 24, 16), new T.MeshBasicMaterial({ color: 0xfff4d6, fog: false }));
        const kule = G3.tid === 'ejderkule'; ayM.position.set(kule ? -120 : -40, kule ? 70 : 60, kule ? -150 : -170); D.add(ayM);
        const ap = parlama(0xffe7b0, 70); ap.material.fog = false; ap.position.copy(ayM.position); D.add(ap);
        const yg = new T.BufferGeometry(), p = [], r = rnd(7);
        for (let k = 0; k < 500; k++) { const t = r() * Math.PI * 2, f = r() * 0.45 + 0.05; p.push(Math.cos(t) * 240 * Math.cos(f), 20 + Math.sin(f) * 200, Math.sin(t) * 240 * Math.cos(f) - 60); }
        yg.setAttribute('position', new T.Float32BufferAttribute(p, 3));
        D.add(new T.Points(yg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })));
    }
    function fener(D, x, y, z, rk) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: rk })); f.scale.y = 1.25; f.position.set(x, y, z); D.add(f); const p = parlama(rk, 4); p.position.set(x, y, z); D.add(p); }
    function arkaPlan(b, D, bolum) {
        const T = THREE, r = rnd(bolum + 3), koyu = mat(new T.Color(b.sis).multiplyScalar(0.55).getHex(), { roughness: 1 }), uzun = L;
        if (b.tip === 'koy' || b.tip === 'sur' || b.tip === 'kule') {
            const pen = [];
            for (let k = 0; k < 46; k++) {
                const w = 5 + r() * 9, h = 6 + r() * (b.tip === 'sur' ? 16 : 12), x = -60 + r() * (uzun + 120), z = -40 - r() * 70;
                const bina = kutu(w, h + 30, 6 + r() * 6, koyu); bina.position.set(x, h / 2 - 23, z); D.add(bina);
                const cat = new T.Mesh(new T.ConeGeometry(w * 0.8, 3 + r() * 2, 4), mat(b.tip === 'kule' ? 0x3a0c12 : 0x10131f)); cat.rotation.y = Math.PI / 4; cat.position.set(x, h - 6.6, z); D.add(cat);
                for (let q = 0; q < 4; q++) if (r() < 0.55) pen.push([x - w / 3 + r() * w * 0.66, h - 11 - r() * (h * 0.6), z + 3.6]);
            }
            const im = new T.InstancedMesh(new T.PlaneGeometry(0.9, 1.2), new T.MeshBasicMaterial({ color: b.isik }), pen.length), m4 = new T.Matrix4();
            pen.forEach((p, k) => { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(k, m4); }); D.add(im);
            if (b.tip !== 'koy') { const kx = uzun + 30, kz = -70; for (let q = 0; q < 4; q++) { const w = 26 - q * 5, kat = kutu(w, 7, w * 0.7, koyu); kat.position.set(kx, -4 + q * 8, kz); D.add(kat); const c = new T.Mesh(new T.ConeGeometry(w * 0.78, 4, 4), mat(b.tip === 'kule' ? 0x6a1018 : 0x1c2033)); c.rotation.y = Math.PI / 4; c.scale.z = 0.7; c.position.set(kx, 1 + q * 8, kz); D.add(c); } }
        }
        if (b.tip === 'bambu') {
            const sayi = 260, im = new T.InstancedMesh(new T.CylinderGeometry(0.35, 0.42, 40, 6), mat(0x2f6a3a, { emissive: 0x0b2a12, emissiveIntensity: 0.5 }), sayi), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
            for (let k = 0; k < sayi; k++) { const x = -50 + r() * (uzun + 100), z = k % 5 === 0 ? (16 + r() * 14) : (-18 - r() * 60); e.set((r() - 0.5) * 0.12, 0, (r() - 0.5) * 0.12); q.setFromEuler(e); m4.compose(new T.Vector3(x, r() * 6 - 6, z), q, new T.Vector3(1, 1, 1)); im.setMatrixAt(k, m4); }
            D.add(im);
        }
        if (b.tip === 'selale') {
            const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
            for (let y = 0; y < 256; y += 4) { x.fillStyle = 'rgba(200,240,255,' + (0.25 + r() * 0.6) + ')'; x.fillRect(r() * 64, y, 6 + r() * 20, 3); }
            const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 2);
            G3.selale = new T.Mesh(new T.PlaneGeometry(50, 70), new T.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.75, color: 0xbfefff })); G3.selale.position.set(uzun * 0.5, 6, -55); D.add(G3.selale);
            for (let k = 0; k < 14; k++) { const kaya = kutu(10 + r() * 16, 40 + r() * 30, 12, koyu); kaya.position.set(-40 + k * 14 + (k > 5 && k < 9 ? 60 : 0), -5, -58 - r() * 10); D.add(kaya); }
            G3.su = new T.Mesh(new T.PlaneGeometry(uzun + 240, 160, 50, 24), mat(0x0b3a52, { roughness: 0.25, metalness: 0.4, emissive: 0x05202e, emissiveIntensity: 0.6 })); G3.su.rotation.x = -Math.PI / 2; G3.su.position.set(uzun / 2, -9, 0); D.add(G3.su);
        } else { const zem = new T.Mesh(new T.PlaneGeometry(uzun + 300, 260), mat(new T.Color(b.sis).multiplyScalar(0.5).getHex())); zem.rotation.x = -Math.PI / 2; zem.position.set(uzun / 2, -14, 0); D.add(zem); }
        if (b.tip === 'kule') { G3.ejder = new T.Group(); const em = mat(0xd8321e, { emissive: 0x5a0a00, emissiveIntensity: 0.6 }); for (let k = 0; k < 22; k++) G3.ejder.add(new T.Mesh(new T.SphereGeometry(1.5 - k * 0.05, 10, 8), em)); D.add(G3.ejder); }
    }
    function parkurKur(b, D, bolum) {
        const T = THREE, { P, B } = parkur(bolum), r = rnd(bolum + 11); G3.P = P; G3.B = B;
        const gm = mat(b.govde), um = mat(b.ust, { roughness: 0.6 }), km = mat(0x0d0f18);
        P.forEach((p, j) => {
            const w = p.b - p.a, cx = (p.a + p.b) / 2;
            if (b.tip === 'selale') {
                const kp = kutu(w, 0.5, DER, um); kp.position.set(cx, p.h - 0.25, 0); D.add(kp);
                for (let x = p.a + 2; x < p.b - 1; x += 7) [-DER / 2 + 1.5, DER / 2 - 1.5].forEach((z) => { const s = kutu(2.4, 30, 2.4, gm); s.position.set(x, p.h - 15.5, z); D.add(s); });
                const tm = mat(0x6b4a2a); for (let x = p.a; x < p.b; x += 1.6) { const t = kutu(1.2, 0.12, DER - 0.4, tm); t.position.set(x + 0.6, p.h + 0.03, 0); D.add(t); }
            } else {
                const g = kutu(w, p.h + 20, DER, gm); g.position.set(cx, (p.h - 20) / 2, 0); D.add(g);
                const u = kutu(w + 0.6, 0.4, DER + 0.6, um); u.position.set(cx, p.h - 0.2, 0); D.add(u);
                const sc = kutu(w + 1.2, 0.35, 1.6, km); sc.position.set(cx, p.h - 0.9, DER / 2 + 0.6); sc.rotation.x = 0.35; D.add(sc);
                if (b.tip === 'sur' || b.tip === 'kule') { const mm = b.tip === 'kule' ? mat(0xb08a2a, { metalness: 0.5, roughness: 0.4 }) : gm; for (let x = p.a + 0.6; x < p.b - 0.5; x += 2.2) { const m = kutu(1.2, 1.2, 1.2, mm); m.position.set(x, p.h + 0.6, -DER / 2 + 0.6); D.add(m); } }
                if (b.tip === 'bambu') { const tm = mat(0x7a5a30); for (let x = p.a + 1; x < p.b; x += 1.2) { const t = kutu(1, 0.14, DER, tm); t.position.set(x, p.h + 0.02, 0); D.add(t); } }
            }
            for (let x = p.a + 5; x < p.b - 2; x += 13) fener(D, x, p.h + 2.2, DER / 2 - 1, j % 2 ? 0xff5a3c : b.isik);
        });
        B.forEach((g) => { const t = etiket('Çatı arası · yarı puan', '#ffd23f', 4.2); t.position.set((g.a + g.b) / 2, Math.max(g.h0, g.h1) + 5.2, DER / 2 - 2); D.add(t); });
        const tm = mat(0xd0302a, { emissive: 0x3a0800 }), hp = P[3].h;
        [-6, 6].forEach((z) => { const d = new T.Mesh(new T.CylinderGeometry(0.45, 0.5, 9, 10), tm); d.position.set(L + 1, hp + 4.5, z); D.add(d); });
        const u1 = kutu(2, 0.7, 16, mat(0x1a1a1a)); u1.position.set(L + 1, hp + 9.2, 0); D.add(u1);
        const u2 = kutu(1.2, 0.5, 14, tm); u2.position.set(L + 1, hp + 7.8, 0); D.add(u2);
        const kp = parlama(b.isik, 18); kp.position.set(L + 1, hp + 5, 0); D.add(kp);
        const gong = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.25, 24), mat(0xd8a630, { metalness: 0.8, roughness: 0.3, emissive: 0x3a2600 })); gong.rotation.x = Math.PI / 2; gong.position.set(L + 6, hp + 3, -8); D.add(gong); G3.gong = gong;
        void r; arkaPlan(b, D, bolum);
    }
    function kuleKur(b, D, bolum) {
        const T = THREE;
        const zem = new T.Mesh(new T.CylinderGeometry(15, 15, 1.2, 40), mat(b.ust, { roughness: 0.6 })); zem.position.y = -0.6; D.add(zem);
        const kn = new T.Mesh(new T.TorusGeometry(15, 0.25, 6, 60), mat(0xd8a630, { metalness: 0.7, roughness: 0.3 })); kn.rotation.x = Math.PI / 2; D.add(kn);
        const dm = mat(0xa8242a, { emissive: 0x2a0000 });
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; if (Math.sin(a) >= 0.55) continue; const d = new T.Mesh(new T.CylinderGeometry(0.5, 0.55, 9, 10), dm); d.position.set(Math.cos(a) * 14, 4.5, Math.sin(a) * 14); D.add(d); }
        const sc = new T.Mesh(new T.ConeGeometry(21, 5, 8, 1, true), mat(0x1c1418, { side: T.DoubleSide })); sc.position.y = 15; sc.scale.setScalar(0.9); D.add(sc);
        for (let k = 1; k <= 4; k++) { const c = new T.Mesh(new T.ConeGeometry(17 + k * 2.5, 4, 8, 1, true), mat(0x2a1a20, { side: T.DoubleSide })); c.position.y = -k * 9; D.add(c); const g = new T.Mesh(new T.CylinderGeometry(12 + k * 2, 12 + k * 2, 9, 16), mat(b.govde)); g.position.y = -k * 9 - 4; D.add(g); }
        for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; fener(D, Math.cos(a) * 15.5, 8, Math.sin(a) * 15.5, k % 2 ? 0xff5a3c : b.isik); }
        const r = rnd(bolum + 5); for (let k = 0; k < 22; k++) { const c = new T.Mesh(new T.SphereGeometry(6 + r() * 8, 10, 8), new T.MeshStandardMaterial({ color: 0x8090b0, transparent: true, opacity: 0.25, depthWrite: false })); c.scale.y = 0.35; c.position.set(-90 + r() * 180, -30 + r() * 20, -40 - r() * 80); D.add(c); }
        G3.muh = muhafizYap(b, bolum); G3.muh.position.set(0, 0, -5); D.add(G3.muh);
        const t = etiket('Kat ' + (bolum + 1) + ' · ' + b.muh, '#ffd23f', 5); t.position.set(0, bolum === 4 ? 12 : 8.6, -5); D.add(t);
    }
    function muhafizYap(b, bolum) {
        const T = THREE, g = new T.Group(), zirh = mat(b.mr, { metalness: 0.4, roughness: 0.5, emissive: b.mr, emissiveIntensity: 0.12 });
        if (bolum === 4) {
            const em = mat(0xd8321e, { emissive: 0x6a0a00, emissiveIntensity: 0.7 }), pul = mat(0xffb020, { emissive: 0x6a3a00 }), parca = [];
            for (let k = 0; k < 18; k++) { const s = new T.Mesh(new T.SphereGeometry(1.6 - k * 0.06, 12, 10), em); g.add(s); parca.push(s); }
            const kafa = new T.Group(); kafa.add(kutu(3, 2, 2.2, em)); const ag = kutu(2, 0.5, 1.8, pul); ag.position.set(1.6, -0.6, 0); kafa.add(ag);
            [-0.8, 0.8].forEach((z) => { const b2 = new T.Mesh(new T.ConeGeometry(0.3, 1.8, 6), pul); b2.position.set(-0.6, 1.5, z); b2.rotation.z = 0.5; kafa.add(b2); const gz = new T.Mesh(new T.SphereGeometry(0.25, 8, 6), new T.MeshBasicMaterial({ color: 0xfff27a })); gz.position.set(1, 0.5, z * 1.1); kafa.add(gz); });
            kafa.rotation.y = Math.PI / 2; g.add(kafa); g.userData = { parca: parca, kafa: kafa, ejder: true, bob: 0 }; return g;
        }
        const piv = new T.Group(); g.add(piv); const koyu = mat(0x1a1a22);
        const gv = new T.Mesh(new T.CylinderGeometry(1.1, 1.4, 2.6, 10), zirh); gv.position.y = 3.1; piv.add(gv);
        const et = new T.Mesh(new T.CylinderGeometry(1.4, 1.9, 1.6, 10, 1, true), mat(0x1a1a22, { side: T.DoubleSide })); et.position.y = 1.5; piv.add(et);
        [-0.6, 0.6].forEach((x) => { const b2 = kutu(0.55, 1.4, 0.55, koyu); b2.position.set(x, 0.7, 0); piv.add(b2); });
        const om = kutu(3.6, 0.5, 1.6, zirh); om.position.y = 4.3; piv.add(om);
        const bas = new T.Mesh(new T.SphereGeometry(0.75, 14, 12), mat(0x22222a)); bas.position.y = 5.1; piv.add(bas);
        const mg = new T.Mesh(new T.ConeGeometry(1.1, 1, 10), zirh); mg.position.y = 5.8; piv.add(mg);
        const by = kutu(1.8, 0.25, 0.15, mat(0xd8a630, { metalness: 0.8, roughness: 0.3 })); by.position.set(0, 5.9, 0.7); piv.add(by);
        [-0.28, 0.28].forEach((x) => { const gz = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshBasicMaterial({ color: 0xff3020 })); gz.position.set(x, 5.15, 0.68); piv.add(gz); });
        const so = kutu(0.18, 6.5, 0.18, mat(0x5a3a1a)); so.position.set(2, 3.4, 0.3); so.rotation.z = -0.15; piv.add(so);
        const bc = kutu(0.12, 1.6, 0.5, mat(0xdfe6f0, { metalness: 0.9, roughness: 0.2 })); bc.position.set(2.5, 6.8, 0.3); bc.rotation.z = -0.15; piv.add(bc);
        g.scale.setScalar(bolum === 3 ? 1.25 : 1); g.userData = { piv: piv, olcek: bolum === 3 ? 1.25 : 1 };
        return g;
    }
    function yAt(s) { for (const p of (G3 && G3.P) || []) if (s >= p.a - 0.001 && s <= p.b + 0.001) return p.h; return null; }
    function yUcus(s, takla) { for (const g of (G3 && G3.B) || []) if (s > g.a && s < g.b) { const u = (s - g.a) / (g.b - g.a); return { y: g.h0 + (g.h1 - g.h0) * u + Math.sin(Math.PI * u) * 3.4, rot: takla ? -Math.PI * 2 * u : -0.25 * Math.sin(Math.PI * u) }; } return { y: yAt(s) || 0, rot: 0 }; }
    const seritZ = (i, n) => (i - (n - 1) / 2) * Math.min(1.05, 21 / Math.max(1, n));

    function sahneOyunKur(tid) {
        if (!G3) return; const T = THREE, st = durum(tid), l = atabilenler(), b = BOLUM[st.bolum] || BOLUM[0];
        if (G3.dunya) { G3.S.remove(G3.dunya); temizle(G3.dunya); }
        G3.dunya = new T.Group(); G3.S.add(G3.dunya); G3.muh = null; G3.ejder = null; G3.su = null; G3.selale = null; G3.nin = {}; G3.P = null; G3.B = null; G3.an = [];
        G3.imza = l.map(kimlik).join(',') + '#' + st.bolum;
        gokKur(b, G3.dunya);
        if (tid === 'ejderkule') kuleKur(b, G3.dunya, st.bolum); else parkurKur(b, G3.dunya, st.bolum);
        l.forEach((s, i) => {
            const key = kimlik(s), n = ninjaYap(ilkAd(s.ad), renk(tid, liste().indexOf(s)), (tid === 'catikosu' ? kusak(key) : KUSAK[0])[1]); G3.nin[key] = n; G3.dunya.add(n);
            if (tid === 'catikosu') { const sp = Math.min(L, st.pos[key] || 0); n.userData.s = sp; n.position.set(sp, yAt(sp) || 0, seritZ(i, l.length)); }
            else { const a = Math.PI * (0.18 + 0.64 * (i / Math.max(1, l.length - 1))), rr = l.length > 18 ? 11.5 : 10; n.position.set(-Math.cos(a) * rr, 0, Math.sin(a) * rr * 0.5 + 0.5); const dx = -n.position.x, dz = -5 - n.position.z; n.rotation.y = Math.atan2(-dz, dx); n.userData.ev = n.position.clone(); }
        });
        if (tid === 'ejderkule' && st.faz === 'son' && G3.muh) G3.muh.visible = false;
        kameraYerlestir(tid, true);
    }
    function kameraYerlestir(tid, aninda) {
        if (!G3) return; const g = G3;
        if (tid === 'ejderkule') { g.odak.set(0, dik() ? 2 : 0.5, dik() ? -1 : 1); g.camH.set(0, dik() ? 15 : 11, dik() ? 38 : 26); }
        else {
            const ns = Object.values(g.nin); let x = 0;
            if (ns.length) {
                const s = aktifSporcu(), vurgu = g.sonHareket && g.t < g.sonHareket.t ? g.nin[g.sonHareket.key] : null, akt = s ? g.nin[kimlik(s)] : null;
                const ort = ns.reduce((a, n) => a + n.position.x, 0) / ns.length, odak = vurgu || akt;
                x = (odak ? odak.position.x : ort) * 0.65 + ort * 0.35;
            }
            const y = yAt(x) || 5;
            if (dik()) { g.odak.set(x + 10, y + 1, 0); g.camH.set(x - 20, y + 15, 24); } else { g.odak.set(x + 6, y, 0); g.camH.set(x - 7, y + 10, 25); }
        }
        if (aninda) { g.camP.copy(g.camH); g.bak.copy(g.odak); }
    }
    function dongu() {
        if (!G3) return;
        const g = G3, kap = g.kap;
        if (!kap.isConnected || aktifTema() !== g.tid) { sahne3Kapat(); return; }
        g.raf = requestAnimationFrame(dongu);
        if (document.hidden) return;
        const simdi = performance.now(), dt = Math.min(0.05, g.son ? (simdi - g.son) / 1000 : 0.016); g.son = simdi; g.t += dt;
        if (!g.olcuBitti) { g.kareSure.push(dt); if (g.t > 3) { g.olcuBitti = true; const ort = g.kareSure.slice(5).reduce((a, b) => a + b, 0) / Math.max(1, g.kareSure.length - 5); if (ort > 0.07 && !window.__h3Zorla3B) { try { localStorage.setItem('dag_h3_2b', '1'); } catch (e) { } const tid = g.tid; sahne3Kapat(); n3SahneKur(tid); return; } } }
        for (let i = g.an.length - 1; i >= 0; i--) { const a = g.an[i]; a.t += dt; if (a.t < 0) continue; const q = Math.min(1, a.t / a.sure); try { a.fn(q); } catch (e) { } if (q >= 1) { g.an.splice(i, 1); if (a.bit) try { a.bit(); } catch (e) { } } }
        Object.values(g.nin).forEach((n) => ninjaAnim(n, g.t));
        if (g.ejder) g.ejder.children.forEach((s, k) => { const a = g.t * 0.35 - k * 0.09; s.position.set(L * 0.5 + Math.cos(a) * 70, 38 + Math.sin(a * 2.3) * 6, -90 + Math.sin(a) * 30); });
        if (g.muh && g.muh.userData.ejder && g.muh.visible) { const u = g.muh.userData; u.parca.forEach((s, k) => { const a = g.t * 1.4 - k * 0.32; s.position.set(Math.sin(a) * 3.2, 3.2 + k * 0.18 + Math.sin(a * 1.3) * 0.7, -Math.cos(a) * 1.4 - k * 0.25); }); u.kafa.position.set(u.parca[0].position.x, u.parca[0].position.y + 1.2 + (u.bob || 0), u.parca[0].position.z + 1.2); }
        if (g.selale) g.selale.material.map.offset.y -= dt * 0.9;
        if (g.su) { const p = g.su.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, Math.sin(x * 0.15 + g.t * 1.6) * 0.35 + Math.cos(y * 0.2 + g.t) * 0.3); } p.needsUpdate = true; }
        if (g.tid === 'catikosu') kameraYerlestir(g.tid);
        const k = 1 - Math.pow(0.02, dt); g.camP.lerp(g.camH, k); g.bak.lerp(g.odak, k);
        g.cam.position.copy(g.camP); g.cam.lookAt(g.bak);
        g.R.render(g.S, g.cam);
    }
    function kosTween(n, s0, s1, o) {
        const u = n.userData, sure = 0.55 + Math.abs(s1 - s0) * 0.032;
        u.kosUntil = G3.t + (o.gec || 0) + sure;
        an(sure, (p) => { const s = s0 + (s1 - s0) * kolay(p); u.s = s; const f = yUcus(s, o.takla); n.position.x = s; n.position.y = f.y; u.piv.rotation.z = f.rot; }, () => {
            u.piv.rotation.z = 0; n.position.x = s1; n.position.y = yAt(s1) || n.position.y; u.s = s1;
            if (o.kil) an(0.9, (q) => { u.piv.position.y = 1.1 - Math.sin(Math.PI * Math.min(1, q * 1.4)) * 1.25; }, () => { u.piv.position.y = 1.1; });
            if (o.bit) o.bit();
        }, o.gec);
    }
    function zipla(n, takla) { const u = n.userData, y0 = n.position.y; an(0.7, (p) => { n.position.y = y0 + Math.sin(Math.PI * p) * 2.2; u.piv.rotation.z = takla ? -Math.PI * 2 * p : 0; }, () => { n.position.y = y0; u.piv.rotation.z = 0; }); }
    function surikenYap() { const T = THREE, g = new T.Group(), m = mat(0xcfd6e2, { metalness: 0.9, roughness: 0.25, emissive: 0x334455 }); for (let k = 0; k < 4; k++) { const b = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 4), m); b.rotation.z = k * Math.PI / 2; b.position.set(Math.sin(k * Math.PI / 2) * -0.3, Math.cos(k * Math.PI / 2) * 0.3, 0); g.add(b); } g.add(parlama(0x9fdcff, 1.4)); return g; }
    function muhafizSarsil() { if (!G3 || !G3.muh) return; const u = G3.muh.userData; if (u.ejder) { an(0.3, (p) => { u.bob = Math.sin(Math.PI * p) * 0.8; }, () => { u.bob = 0; }); return; } an(0.28, (p) => { u.piv.rotation.x = -Math.sin(Math.PI * p) * 0.18; }, () => { u.piv.rotation.x = 0; }); }

    /* ---------------------------------------------------------------- yazılar */
    function yuzen(tid, yazi, pos3, renkCss) {
        const kap = panel(tid) && panel(tid).querySelector('.n3-sahne'); if (!kap) return;
        let x = kap.clientWidth / 2, y = kap.clientHeight * 0.45;
        if (G3 && pos3) { const v = pos3.clone().project(G3.cam); x = (v.x + 1) / 2 * kap.clientWidth; y = (1 - v.y) / 2 * kap.clientHeight; }
        const el = document.createElement('div'); el.className = 'n3-yuzen'; el.textContent = yazi; el.style.color = renkCss || '#fff'; el.style.left = x + 'px'; el.style.top = y + 'px'; kap.appendChild(el); setTimeout(() => el.remove(), 1500);
    }
    function afis(yazi, renkCss) { const a = $('n3-afis'); if (!a) return; a.textContent = yazi; a.style.color = renkCss || '#fff'; a.classList.remove('gor'); void a.offsetWidth; a.classList.add('gor'); }

    /* ---------------------------------------------------------------- HUD */
    function avatar(s, px) {
        const st = 'width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.38) + 'px;';
        if (typeof fotoAvatarHTML === 'function') return fotoAvatarHTML('s:' + kimlik(s), s.ad, 'n3-av', false, st);
        return '<span class="n3-av" style="' + st + '">' + esc(String(s.ad).slice(0, 2).toLocaleUpperCase('tr-TR')) + '</span>';
    }
    function aktifSporcu() { const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1, s = liste()[i]; return s && atabilenler().indexOf(s) !== -1 ? s : null; }
    function harita(tid, bolum) {
        return BOLUM.map((b, k) => (k ? '<i class="n3-cz"></i>' : '') + '<span class="n3-dg' + (k < bolum ? ' gecti' : k === bolum ? ' simdi' : '') + '" title="' + esc(b.ad) + '"><em>' + (k < bolum ? '✅' : b.ikon) + '</em><span>' + esc(tid === 'ejderkule' ? 'Kat ' + (k + 1) : b.ad) + '</span></span>').join('');
    }
    function hud(tid) {
        const p = panel(tid); if (!p || !$('n3-hud')) return;
        const st = durum(tid), l = atabilenler(), s = aktifSporcu(), b = BOLUM[st.bolum] || BOLUM[0];
        const sira = st.faz === 'son' ? '<div class="n3-sira-yazi"><small>BÖLÜM BİTTİ</small><b>' + b.ikon + ' ' + esc(b.ad) + '</b></div>'
            : s ? avatar(s, 52) + '<div class="n3-sira-yazi"><small>SIRADA · ' + st.tur + '. TUR</small><b>' + esc(ilkAd(s.ad)) + '</b>' + (tid === 'catikosu' ? '<em>' + kusak(kimlik(s))[0] + ' kuşak' + (yildizSay(tid, kimlik(s)) ? ' · ' + '⭐'.repeat(Math.min(6, yildizSay(tid, kimlik(s)))) : '') + '</em>' : '') + '</div>'
                : '<div class="n3-sira-yazi"><small>' + st.tur + '. TUR</small><b>Sporcuya dokun</b></div>';
        let d = '<div class="n3-harita">' + harita(tid, st.bolum) + '</div>';
        if (tid === 'catikosu') d += '<div class="n3-sat"><span>⛩️ Kapıya varan</span><span>' + kapida(st).length + ' ninja</span></div><div class="n3-sat ince"><span>Tur</span><span>' + Math.min(st.tur, MAKS_TUR) + ' / ' + MAKS_TUR + '</span></div>';
        else { const hp = st.hpMax ? st.hp : 0, mx = st.hpMax || 1; d += '<div class="n3-sat"><span>' + esc(b.muh) + '</span><span>' + (st.hpMax ? Math.max(0, hp) + ' / ' + mx : 'bekliyor') + '</span></div><div class="n3-cub"><i style="width:' + (st.hpMax ? Math.max(0, hp) / mx * 100 : 100).toFixed(1) + '%"></i></div>'; }
        d += '<div class="n3-sat ince"><span>Bu tur atan</span><span>' + buTurAtan(st) + ' / ' + l.length + '</span></div>';
        $('n3-sira').innerHTML = sira; $('n3-durum').innerHTML = d;
        $('n3-serit').innerHTML = l.map((k) => { const key = kimlik(k), atti = (st.atan[key] || 0) >= st.tur, su = s === k && st.faz !== 'son'; return '<span class="n3-k' + (su ? ' su' : atti ? ' atti' : '') + '" style="--r:' + renk(tid, liste().indexOf(k)) + '" title="' + esc(k.ad) + '">' + avatar(k, 34) + '</span>'; }).join('');
        $('n3-kural').textContent = OYUN[tid].kural;
        if (st.faz === 'son' && !$('n3-son')) sonKart(tid);
        if (st.faz !== 'son') { const sk = $('n3-son'); if (sk) sk.remove(); }
        if (!G3) duz2B(tid);
    }
    function sonKart(tid) {
        const st = durum(tid), kap = panel(tid).querySelector('.n3-sahne'); if (!kap) return;
        const b = BOLUM[st.bolum] || BOLUM[0], son = st.bolum >= 4, sonraki = BOLUM[(st.bolum + 1) % 5];
        const adlar = st.finalAdlar || atabilenler().map((s) => ilkAd(s.ad));
        let ic = '';
        if (tid === 'catikosu') {
            const v = st.varan || [], vAd = v.map((k) => ilkAd(k.slice(k.indexOf('|') + 1)));
            const kalan = adlar.filter((a) => vAd.indexOf(a) === -1);
            ic = '<h2>' + b.ikon + ' ' + esc(buyuk(b.ad)) + ' BİTTİ</h2>'
                + '<p>Kapıya varanlar ⭐ yıldız aldı</p><div class="n3-son-adlar buyuk">' + (vAd.length ? vAd.map((a) => '<span>⭐ ' + esc(a) + '</span>').join('') : '<span>Bu sefer kimse varamadı</span>') + '</div>'
                + (kalan.length ? '<p>Yolda kalanlar sonraki bölümde yine koşacak</p><div class="n3-son-adlar">' + kalan.map((a) => '<span>' + esc(a) + '</span>').join('') + '</div>' : '');
        } else {
            ic = '<h2>' + (son ? '🐉 KIZIL EJDER YENİLDİ!' : esc(buyuk(b.muh)) + ' DÜŞTÜ!') + '</h2><p>' + (son ? 'Kulenin tepesine hep birlikte çıktınız' : 'Klan Kat ' + (st.bolum + 2) + "'ye çıktı. Herkesin shurikeni değdi") + '</p><div class="n3-son-adlar">' + adlar.map((a) => '<span>' + esc(a) + '</span>').join('') + '</div>';
        }
        const d = document.createElement('div'); d.id = 'n3-son'; d.className = 'n3-son';
        d.innerHTML = '<div class="n3-son-ic">' + ic + '<div class="n3-son-btn"><button type="button" id="n3-sonraki">' + (son ? '↺ Baştan başla: ' + BOLUM[0].ikon + ' ' + (tid === 'ejderkule' ? 'Kat 1' : BOLUM[0].ad) : '▶ Sonraki bölüm: ' + sonraki.ikon + ' ' + (tid === 'ejderkule' ? 'Kat ' + (st.bolum + 2) : sonraki.ad)) + '</button></div></div>';
        kap.appendChild(d);
    }
    function duz2B(tid) {
        const z = $('n3-2b'); if (!z) return; const st = durum(tid), l = atabilenler(), b = BOLUM[st.bolum] || BOLUM[0];
        if (tid === 'catikosu') {
            const B = parkur(st.bolum).B, araliklar = B.map((g) => '<b class="ara" style="left:' + (g.a / L * 92).toFixed(1) + '%;width:' + ((g.b - g.a) / L * 92).toFixed(1) + '%"></b>').join('');
            z.innerHTML = '<div class="n3-2b-kosu">' + l.map((s, i) => { const o = Math.min(1, (st.pos[kimlik(s)] || 0) / L); return '<div class="n3-2b-hat"><span class="ad">' + esc(ilkAd(s.ad)) + '</span><span class="yol">' + araliklar + '<i style="left:' + (o * 92).toFixed(1) + '%;--r:' + renk(tid, liste().indexOf(s)) + '">🥷</i><em>⛩️</em></span></div>'; }).join('') + '</div>';
        } else z.innerHTML = '<div class="n3-2b-kule"><span class="muh' + (st.faz === 'son' ? ' dustu' : '') + '">' + b.e2 + '</span><span class="klan">' + '🥷'.repeat(Math.min(12, l.length)) + '</span></div>';
    }

    /* ---------------------------------------------------------------- seri */
    let _kilit = false, _z = [], _bekleyenTur = null;
    const sonra = (fn, ms) => { const t = setTimeout(fn, ms); _z.push(t); };
    const zTemizle = () => { _z.forEach(clearTimeout); _z = []; };
    function n3Seri(tid, s, i, kaydedilecek, done) {
        if (_bekleyenTur) { const f = _bekleyenTur; _bekleyenTur = null; try { f(); } catch (e) { } }
        zTemizle();
        const st = durum(tid), bit = () => { _kilit = false; try { done(); } catch (e) { } hud(tid); };
        if (st.faz !== 'oyun') { try { done(); } catch (e) { } return; }
        _kilit = true;
        const key = kimlik(s), pl = (kaydedilecek || []).map((k) => puan(k.puan)), top = pl.reduce((a, b) => a + b, 0), k = Math.max(1, pl.length), oran = top / (k * 10);
        const cizili = !!panel(tid), n = G3 && G3.nin[key], adi = ilkAd(s.ad);
        st.atan[key] = st.tur; st.katki[key] = (st.katki[key] || 0) + top;
        if (tid === 'catikosu') {
            const s0 = st.pos[key] || 0, h = kosuHesap(s0, oran, st.hata, key, st.bolum); st.pos[key] = h.s1;
            if (cizili) {
                if (n && G3) {
                    G3.sonHareket = { key: key, t: G3.t + 2.4 };
                    const tepe = () => n.position.clone().setY(n.position.y + 3.4);
                    if (s0 >= L) { zipla(n, oran >= TAKLA); yuzen(tid, adi + ' kapıda ✓', tepe(), '#5be38a'); }
                    else {
                        yuzen(tid, '+' + top, tepe(), oran >= TAKLA ? '#ffd23f' : '#fff'); SES.kos();
                        kosTween(n, n.userData.s, h.s1, { takla: oran >= TAKLA, kil: h.kil, bit: () => {
                            if (h.kaldi) { yuzen(tid, 'Çatı arası: yarı puan gerek', tepe(), '#ff9a7a'); }
                            else if (h.sensei) { afis('SENSEİ HALAT ATTI!\n' + adi + ' geçti', '#9fe8ff'); }
                            else if (h.kil) { afis('KIL PAYI!', '#ffd23f'); }
                            if (h.s1 >= L) { afis(buyuk(adi) + '\nKAPIYA VARDI!', '#5be38a'); SES.gong(); kivilcim(n.position.clone().setY(n.position.y + 2), 0xffd23f, 16); }
                        } });
                        if (oran >= TAKLA) sonra(() => { afis('TAKLA!', '#ffd23f'); SES.swish(); }, 350);
                    }
                } else yuzen(tid, adi + ' +' + top);
            }
        } else {
            if (!st.hpMax) { st.hpMax = muhafizCan(st.bolum, Math.max(1, atabilenler().length), k); st.hp = st.hpMax; }
            const once = st.hp; st.hp -= top;
            if (cizili) {
                if (n && G3) {
                    const ev = n.userData.ev, ileri = ev.clone().lerp(new THREE.Vector3(0, 0, -5), 0.18);
                    an(0.25, (p) => n.position.lerpVectors(ev, ileri, p)); an(0.3, (p) => n.position.lerpVectors(ileri, ev, p), null, 1.1);
                    let gor = Math.max(0, once);
                    pl.forEach((v, j) => {
                        const sk = surikenYap(); sk.visible = false; G3.dunya.add(sk); const bas = ev.clone().setY(1.8);
                        const hed = v > 0 ? new THREE.Vector3((Math.random() - 0.5) * 1.4, 3 + Math.random() * 1.6, -4.4) : new THREE.Vector3((Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 3), 2 + Math.random() * 3, -9);
                        SES.swish(0.18 + j * 0.24);
                        an(0.42, (p) => { sk.visible = true; sk.position.lerpVectors(bas, hed, p); sk.position.y += Math.sin(Math.PI * p) * 1.5; sk.rotation.z += 0.6; sk.rotation.x = 0.4; }, () => {
                            if (G3 && G3.dunya) G3.dunya.remove(sk);
                            if (v > 0) { SES.cin(); kivilcim(hed, v >= 9 ? 0xffd23f : 0xffffff, v >= 9 ? 14 : 6); yuzen(tid, '−' + v, hed.clone().setY(hed.y + 1), v >= 9 ? '#ffd23f' : '#fff'); muhafizSarsil(); gor = Math.max(0, gor - v); canCiz(tid, gor); }
                            else yuzen(tid, 'ıska', hed, '#9aa');
                        }, 0.18 + j * 0.24);
                    });
                    if (once > 0 && st.hp <= 0) sonra(() => afis(buyuk(BOLUM[st.bolum].muh) + ' SENDELİYOR!\nherkes atınca düşer', '#ffd23f'), pl.length * 240 + 700);
                } else yuzen(tid, adi + ' −' + top);
            }
        }
        const turBitti = herkesAtti(st);
        kaydet(tid);
        if (!cizili) { if (turBitti) turSonu(tid, null); return bit(); }
        hud(tid); if (tid === 'ejderkule') canCiz(tid, Math.max(0, st.hp + top));
        const bek = tid === 'ejderkule' ? pl.length * 240 + 1100 : 1300;
        if (turBitti) _bekleyenTur = () => turSonu(tid, null);
        sonra(() => { if (turBitti) { if (!_bekleyenTur) return bit(); _bekleyenTur = null; turSonu(tid, bit); } else bit(); }, bek);
    }
    function canCiz(tid, c) { const st = durum(tid), d = document.querySelector('#n3-durum .n3-cub i'), sat = document.querySelector('#n3-durum .n3-sat span:last-child'); if (!st.hpMax) return; if (d) d.style.width = (Math.max(0, c) / st.hpMax * 100).toFixed(1) + '%'; if (sat) sat.textContent = Math.max(0, Math.round(c)) + ' / ' + st.hpMax; }
    // Tur sonu: durum HEMEN hesaplanır; zamanlayıcılar yalnız görsel (Hazine 3B'de öğrenildi).
    function turSonu(tid, sonraFn) {
        const st = durum(tid), cizili = !!panel(tid) && !!sonraFn, son = () => { if (sonraFn) sonraFn(); }, biten = st.tur;
        const ilerle = () => { st.tur++; kaydet(tid); };
        if (tid === 'catikosu') {
            const varan = kapida(st).map(kimlik), l = atabilenler();
            if (varan.length === l.length || st.tur >= MAKS_TUR) return bitir(tid, varan, cizili, son);
            ilerle(); if (!cizili) return son();
            afis(biten + '. TUR BİTTİ\n' + (varan.length ? varan.length + ' ninja kapıda' : 'herkes attı, sıradaki tur'), '#fff'); sonra(son, 1900); return;
        }
        if (st.hp <= 0) return bitir(tid, null, cizili, son);
        ilerle(); if (!cizili) return son();
        afis('MUHAFIZ AYAKTA!\ncanı ' + st.hp + ' kaldı, bir tur daha', '#ff9a7a'); SES.kukre();
        if (G3 && G3.muh && !G3.muh.userData.ejder) { const o = G3.muh.userData.olcek || 1; an(0.6, (p) => { if (G3 && G3.muh) G3.muh.scale.setScalar(o * (1 + Math.sin(Math.PI * p) * 0.12)); }); }
        sonra(son, 2200);
    }
    function bitir(tid, varan, cizili, son) {
        const st = durum(tid), l = atabilenler(), il = ilerleme(tid);
        st.ilerlemeOnce = JSON.parse(JSON.stringify(il));
        st.faz = 'son'; st.varan = varan || null; st.finalAdlar = l.map((s) => ilkAd(s.ad)); kaydet(tid);
        if (tid === 'catikosu') (varan || []).forEach((k) => { il.yildiz[k] = (il.yildiz[k] || 0) + 1; });
        if (st.bolum >= 4) { il.bolum = 0; il.tamam = (il.tamam || 0) + 1; if (tid === 'catikosu') il.yildiz = il.yildiz; } else il.bolum = st.bolum + 1;
        ilerKaydet(tid, il);
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.ninja3b = o.ninja3b || {}; o.ninja3b[tid] = (o.ninja3b[tid] || 0) + 1; });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
        if (!cizili) { if (son) son(); return; }
        if (tid === 'ejderkule' && G3 && G3.muh) {
            const m = G3.muh, y0 = m.position.y; SES.kukre();
            an(1.2, (p) => { m.rotation.x = -Math.PI / 2 * kolay(p); m.position.y = y0 - p * 2; m.position.z = -5 - p * 3; }, () => { m.visible = false; }, 0.4);
            kivilcim(new THREE.Vector3(0, 4, -5), 0xffd23f, 30);
            afis(buyuk(BOLUM[st.bolum].muh) + ' DÜŞTÜ!\nhep birlikte', '#ffd23f');
            sonra(() => { SES.zil(); Object.values(G3 ? G3.nin : {}).forEach((n, i) => { const y0n = n.position.y; an(0.9, (p) => { n.position.y = y0n + Math.sin(Math.PI * p * 0.5) * 12; n.userData.piv.rotation.z = -Math.PI * 2 * p; }, null, i * 0.04); }); }, 1800);
            setTimeout(() => { hud(tid); if (son) son(); }, 3600);
        } else {
            SES.gong(); sonra(SES.zil, 600);
            afis(BOLUM[st.bolum].ikon + ' BÖLÜM BİTTİ\n' + ((varan || []).length ? (varan || []).length + ' ninja kapıda' : 'herkes koştu'), '#ffd23f');
            setTimeout(() => { hud(tid); if (son) son(); }, 2600);
        }
    }

    /* ---------------------------------------------------------------- kabuk */
    function yeniBaslat(tid) { zTemizle(); _kilit = false; _bekleyenTur = null; _onbellek[tid] = { ham: null, kn: konum(), st: yeniOyun(tid) }; kaydet(tid); n3SahneKur(tid); }
    function yeniOyunSor(tid) {
        const st = durum(tid);
        if (st.faz !== 'oyun' || !Object.keys(st.atan).length) return yeniBaslat(tid);
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Bu bölüm baştan başlasın mı?<br><small>Bölüm ilerlemesi ve yıldızlar silinmez.</small>', () => yeniBaslat(tid), 'Baştan başla', 'Vazgeç'); else yeniBaslat(tid);
    }
    function bolumSec(tid) {
        const il = ilerleme(tid);
        if (typeof onayIste !== 'function' || document.fullscreenElement) return;
        const st = durum(tid);
        onayIste('<b>Bölüm haritası</b><br>Şu an: ' + BOLUM[st.bolum].ikon + ' ' + BOLUM[st.bolum].ad + '<br><small>Sınıf ilk bölüme dönmek isterse (yeni grup) aşağıdan sıfırlayın. Yıldızlar da silinir.</small>', () => {
            ilerKaydet(tid, { bolum: 0, yildiz: {}, tamam: il.tamam || 0 }); yeniBaslat(tid);
        }, '⟲ 1. bölümden başlat', 'Kapat');
    }
    function n3SahneKur(tid) {
        const p = panel(tid); if (!p) return;
        css(); zTemizle(); _kilit = false; sahne3Kapat();
        TIDLER.forEach((t) => { const d = panel(t); if (d && t !== tid) { d.innerHTML = ''; d.onclick = null; } });
        const O = OYUN[tid];
        p.innerHTML = '<div class="n3-sahne" data-oyun="' + tid + '"><div class="n3-2b" id="n3-2b"></div>'
            + '<div class="n3-hud" id="n3-hud"><div class="n3-ust"><div class="n3-kutu n3-sira" id="n3-sira"></div><div class="n3-kutu n3-durum" id="n3-durum"></div></div>'
            + '<div class="n3-alt"><div class="n3-serit" id="n3-serit"></div><div class="n3-araclar"><span class="n3-baslik">' + O.ikon + ' ' + O.ad + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</span><button type="button" id="n3-nasil">❓ Nasıl oynanır</button><button type="button" id="n3-harita-btn">🗺️ Bölümler</button><button type="button" id="n3-yeni-btn">↺ Bölümü baştan</button></div><div class="n3-kural" id="n3-kural"></div></div></div>'
            + '<div class="n3-afis" id="n3-afis"></div></div>';
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'n3-yeni-btn') yeniOyunSor(tid);
            else if (t.id === 'n3-sonraki') yeniBaslat(tid);
            else if (t.id === 'n3-harita-btn') bolumSec(tid);
            else if (t.id === 'n3-nasil' && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('<b>' + O.ikon + ' ' + O.ad + '</b><br>' + O.kural + '<br><small>5 bölüm: ' + BOLUM.map((b) => b.ikon + ' ' + b.ad).join(' → ') + '. Sonuç ancak herkes atınca belli olur.</small>', () => { }, 'Tamam', 'Kapat');
        };
        const kap = p.querySelector('.n3-sahne');
        hud(tid);
        if (!webglVar()) { kap.classList.add('duz'); duz2B(tid); return; }
        threeHazir().then(() => {
            if (!kap.isConnected || aktifTema() !== tid) return;
            try { sahne3Kur(tid, kap); sahneOyunKur(tid); kap.classList.remove('duz'); hud(tid); G3.son = 0; G3.raf = requestAnimationFrame(dongu); }
            catch (e) { console.warn('ninja3b', e); sahne3Kapat(); kap.classList.add('duz'); duz2B(tid); }
        }).catch(() => { kap.classList.add('duz'); duz2B(tid); });
    }
    function n3Guncelle(tid) {
        const p = panel(tid); if (!p) return;
        if (!$('n3-hud') || !p.querySelector('.n3-sahne[data-oyun="' + tid + '"]')) return n3SahneKur(tid);
        if (_kilit) return;
        if (G3 && G3.tid === tid) { const st = durum(tid), imza = atabilenler().map(kimlik).join(',') + '#' + st.bolum; if (G3.imza !== imza) sahneOyunKur(tid); else kameraYerlestir(tid); }
        hud(tid);
    }
    function n3GeriYukle(tid, snap) {
        if (!snap) return; zTemizle(); _kilit = false; _bekleyenTur = null;
        const simdi = durum(tid);
        if (simdi.faz === 'son' && simdi.ilerlemeOnce && snap.faz !== 'son') ilerKaydet(tid, simdi.ilerlemeOnce); // bölüm bitişini geri al
        _onbellek[tid] = { ham: null, kn: konum(), st: snap }; kaydet(tid);
        const sk = $('n3-son'); if (sk) sk.remove();
        if (G3 && G3.tid === tid) sahneOyunKur(tid);
        hud(tid);
    }
    function css() {
        if ($('n3-css')) return; const st = document.createElement('style'); st.id = 'n3-css';
        st.textContent = [
            '.km-oyun-panel-catikosu,.km-oyun-panel-ejderkule{position:relative;flex:1;min-height:0;flex-direction:column}',
            '.n3-sahne{position:relative;flex:1;min-height:420px;width:100%;height:100%;overflow:hidden;border-radius:inherit;background:radial-gradient(ellipse at 30% 10%,#1d2a5a,#070b18 70%);font-family:Nunito,Inter,system-ui,sans-serif;color:#eef1ff}',
            '.n3-tuval{position:absolute;inset:0;width:100%;height:100%;display:block}',
            '.n3-hud{position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:12px}',
            '.n3-hud button,.n3-hud .n3-k{pointer-events:auto}',
            '.n3-ust{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;max-width:calc(100% - var(--km-dok-genislik,0px))}',
            '.n3-kutu{background:rgba(8,12,26,.8);border:1px solid rgba(170,185,255,.16);border-radius:16px;padding:10px 14px;backdrop-filter:blur(6px)}',
            '.n3-sira{display:flex;align-items:center;gap:12px;min-width:200px}',
            '.n3-av{flex:none;border-radius:50%;display:grid;place-items:center;background:#1a2340;background-size:cover;background-position:center;color:#cfd8ff;font-weight:800}',
            '.n3-sira .n3-av{box-shadow:0 0 0 3px #ffd23f}',
            '.n3-sira-yazi small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.16em;color:#ffd23f}.n3-sira-yazi b{display:block;font-size:22px;line-height:1.1}.n3-sira-yazi em{display:block;font-style:normal;font-size:12px;font-weight:800;color:#a3acc8}',
            '.n3-durum{flex:1 1 300px;min-width:0;max-width:600px;margin-left:auto;display:flex;flex-direction:column;gap:6px}',
            '.n3-harita{display:flex;align-items:center;gap:3px;overflow-x:auto;scrollbar-width:none}',
            '.n3-dg{display:flex;align-items:center;gap:4px;font-weight:800;font-size:12px;color:#8d96b4;white-space:nowrap;padding:2px 7px;border-radius:9px}.n3-dg em{font-style:normal;font-size:16px;filter:grayscale(1) brightness(.6)}',
            '.n3-dg.gecti{color:#5be38a}.n3-dg.gecti em{filter:none}.n3-dg.simdi{color:#fff;background:rgba(255,138,61,.22);outline:1px solid #ff8a3d}.n3-dg.simdi em{filter:none}',
            '.n3-cz{flex:none;width:10px;height:2px;background:rgba(170,185,255,.25)}',
            '.n3-sat{display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:800}.n3-sat span:last-child{color:#cfd8ff}.n3-sat.ince{font-size:11.5px;opacity:.8}',
            '.n3-cub{height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}.n3-cub i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ff4d4d,#ff9a3d);transition:width .35s}',
            '.n3-alt{display:flex;flex-direction:column;gap:8px;align-items:flex-start;max-width:calc(100% - var(--km-dok-genislik,0px))}',
            '.n3-serit{display:flex;gap:4px;flex-wrap:wrap;max-width:min(720px,100%);background:rgba(8,12,26,.55);border-radius:14px;padding:6px}',
            '.n3-k{position:relative;border-radius:50%;opacity:.5}.n3-k .n3-av{box-shadow:0 0 0 2px var(--r)}.n3-k.atti,.n3-k.su{opacity:1}.n3-k.su .n3-av{box-shadow:0 0 0 3px #fff,0 0 12px #fff}',
            '.n3-k.atti::after{content:"✓";position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;background:#5be38a;color:#062214;font-size:10px;font-weight:900;display:grid;place-items:center}',
            '.n3-araclar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.n3-baslik{font-weight:900;font-size:14px;background:rgba(8,12,26,.75);border-radius:999px;padding:6px 12px}',
            '.n3-araclar button{border:1px solid rgba(170,185,255,.2);background:rgba(8,12,26,.78);color:#eef1ff;border-radius:999px;padding:6px 12px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;min-height:36px}',
            '.n3-kural{font-size:12.5px;font-weight:700;background:rgba(8,12,26,.65);border-radius:10px;padding:5px 10px;max-width:640px}',
            '.n3-afis{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-family:Bungee,"Barlow Condensed",Impact,sans-serif;font-size:clamp(28px,5.5vw,76px);line-height:1.05;text-align:center;color:#fff;text-shadow:0 4px 0 #000,0 0 30px rgba(255,160,40,.5);pointer-events:none;opacity:0;white-space:pre-line;width:92%}',
            '.n3-afis.gor{animation:n3Afis 2s ease-out}@keyframes n3Afis{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}22%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%) scale(1)}}',
            '.n3-yuzen{position:absolute;font-weight:900;font-size:24px;pointer-events:none;text-shadow:0 2px 0 #000,0 0 10px #000;animation:n3Yuz 1.5s ease-out forwards;transform:translate(-50%,-50%);z-index:3;white-space:nowrap}',
            '@keyframes n3Yuz{0%{opacity:0;margin-top:10px}12%{opacity:1}75%{opacity:1}100%{opacity:0;margin-top:-60px}}',
            '.n3-son{position:absolute;inset:0;display:grid;place-items:center;background:rgba(2,3,10,.45);z-index:4;padding:16px;pointer-events:auto}',
            '.n3-son-ic{max-width:760px;width:100%;max-height:100%;overflow:auto;text-align:center;background:rgba(10,14,32,.92);border:2px solid #ffd23f;border-radius:22px;padding:20px 18px;display:flex;flex-direction:column;gap:10px;align-items:center}',
            '.n3-son-ic h2{margin:0;font-family:Bungee,"Barlow Condensed",Impact,sans-serif;font-weight:400;font-size:clamp(24px,4vw,44px);color:#ffd23f;line-height:1.05}.n3-son-ic p{margin:0;font-weight:800;color:#cfd8ff}',
            '.n3-son-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.n3-son-adlar span{background:rgba(255,255,255,.1);border-radius:999px;padding:4px 12px;font-weight:800;font-size:14px}.n3-son-adlar.buyuk span{background:#ffd23f;color:#2a1c00;font-size:17px}',
            '.n3-son-btn button{border:0;background:#ffd23f;color:#2a1c00;border-radius:999px;padding:12px 24px;font:inherit;font-weight:900;font-size:17px;cursor:pointer;min-height:48px}',
            '.n3-2b{position:absolute;inset:0;display:none;padding:150px 16px 160px;overflow:auto}.n3-sahne.duz .n3-2b{display:block}',
            '.n3-2b-kosu{display:flex;flex-direction:column;gap:4px;max-width:900px}.n3-2b-hat{display:grid;grid-template-columns:80px 1fr;gap:8px;align-items:center;font-weight:800;font-size:13px}',
            '.n3-2b-hat .yol{position:relative;height:26px;border-radius:6px;background:rgba(255,255,255,.12)}.n3-2b-hat .ara{position:absolute;top:0;bottom:0;background:#05070f}.n3-2b-hat i{position:absolute;top:50%;transform:translateY(-50%);font-style:normal;font-size:20px;transition:left .6s;filter:drop-shadow(0 0 4px var(--r,#fff))}.n3-2b-hat em{position:absolute;right:2px;top:50%;transform:translateY(-50%);font-style:normal;font-size:18px}',
            '.n3-2b-kule{display:flex;flex-direction:column;align-items:center;gap:20px;padding-top:20px}.n3-2b-kule .muh{font-size:120px;transition:all 1s}.n3-2b-kule .muh.dustu{transform:rotate(90deg) translateY(-30px);opacity:.3}.n3-2b-kule .klan{font-size:30px;letter-spacing:2px}',
            '@media (max-width:860px){.n3-sira-yazi b{font-size:17px}.n3-durum{margin-left:0;max-width:none}.n3-sahne{min-height:520px}.n3-kural{display:none}.n3-dg span{display:none}}',
            '@media (prefers-reduced-motion:reduce){.n3-afis.gor,.n3-yuzen{animation-duration:.01s}}'
        ].join('\n');
        document.head.appendChild(st);
    }
    window.n3SahneKur = n3SahneKur;
    window.n3Guncelle = n3Guncelle;
    window.n3Seri = n3Seri;
    window.n3Anlik = (tid) => JSON.parse(JSON.stringify(durum(tid)));
    window.n3GeriYukle = n3GeriYukle;
    window.n3Sporcu = (tid, g, ad) => { const st = durum(tid), k = g + '|' + ad; return tid === 'catikosu' ? Math.round(Math.min(1, (st.pos[k] || 0) / L) * 100) : (st.katki[k] || 0); };
    window.n3Durum = durum;
    window.n3Ilerleme = ilerleme;
    window.n3Oyunlar = TIDLER;
    window._n3Ic = { kosuHesap, muhafizCan, parkur, L, OYUN, BOLUM, KUSAK };
})();
