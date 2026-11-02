/* ================================================================================================
   🦸 BLOK KAHRAMANLAR — Karışık Sınıf › Oyunlar teması 'blok' (2026-11-03, v372).
   Kullanıcı 8 yaş için oyun istedi; iki taslak turu beğenilmedi, sonra "süper kahraman / canavar + oyun dünyası (blok)
   + hep birlikte büyük düşman" seçti, iki boss taslağına "bu ikisini de yap" dedi.
   OYUN: Her çocuk blok blok çizilmiş bir süper kahraman (pelerin = kendi rengi). Dev boss'a karşı bütün sınıf:
     🌋 Lav Golemi (gündüz blok şehir) · 🐉 Gölge Ejder (gece blok kale). Sırayla gelirler, HUD'dan seçilebilir.
   Her ok halkasına göre bir süper güç: sarı ⚡ 3 küp (X 4) · kırmızı 👊 2 · mavi ❄️ 1 + boss donar (saldırısı boşa gider) ·
     siyah 🛡️ 1 + şehir/kale onarılır · beyaz 🔨 1 · M 🍌 kayar (0). Her 5 seride boss saldırır (bina yıkar / kaleye dalar).
   ADİL / HEP BİRLİKTE (STANDING): boss, sınıftaki herkes en az bir kez atmadan düşmez — can biterse "SON KÜP" kalır,
     süper ışın şarj olur; son kahraman da atınca HERKES aynı anda ışın atar, ekranda herkesin adı. Tek kahraman yok.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumu + çizim:
     blkSahneKur() · blkGuncelle() · blkSeri(s, i, kaydedilecek, done) · blkAnlik() · blkGeriYukle(k) · blkSporcu(g, ad) · blkAyarUygula()
   DURUM 'dag_km_blok_<konum>' (km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır), GÜNE ÖZEL:
     { tarih, no, tip, toplam, can, katki{'g|ad':küp}, atanlar{'g|ad':1}, seri, donmus, sehir[6 bool], duvar, kule[4 bool], yenilenler[] }
   Çizim tek <canvas>; zemin ve golem gövdesi değişince önceden çizilir (her karede yüzlerce küp çizilmez).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1200, H = 600;
    const TIPLER = ['golem', 'ejder'];
    const BOSS = { golem: { ad: 'Lav Golemi', ikon: '🌋' }, ejder: { ad: 'Gölge Ejder', ikon: '🐉' } };
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('blok', k); } catch (e) { return true; } };
    function renk(i) { return typeof kmOyunRenk === 'function' ? kmOyunRenk('blok', i) : '#3b82f6'; }
    function azHareket() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
    // Halka → güç
    function guc(v) {
        v = String(v); if (v === 'M' || v === '0') return { tip: 'muz', hasar: 0 };
        const d = v === 'X' ? 10 : +v;
        if (d >= 9) return { tip: 'isin', hasar: v === 'X' ? 4 : 3 };
        if (d >= 7) return { tip: 'yumruk', hasar: 2 };
        if (d >= 5) return { tip: 'buz', hasar: 1 };
        if (d >= 3) return { tip: 'kalkan', hasar: 1 };
        return { tip: 'cekic', hasar: 1 };
    }
    const GUC = {
        isin: { renk: '#ffd23f', yazi: ['POW!', 'ZAAP!', 'SÜPER IŞIN!'] },
        yumruk: { renk: '#ff4a3a', yazi: ['BAM!', 'KABOOM!', 'GÜÇ YUMRUĞU!'] },
        buz: { renk: '#5ec8ff', yazi: ['DONDU! ❄️'] },
        kalkan: { renk: '#9aa4b8', yazi: ['ONARILDI! 🛡️'] },
        cekic: { renk: '#f2f2f2', yazi: ['TAK!', 'TOK!'] },
        muz: { renk: '#ffe14a', yazi: ['ups! 🍌'] }
    };
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];

    /* ---------------- SES (WebAudio sentezi; Oyunlar sessiz anahtarı + kendi düğmesi) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_blk_ses') !== '0'; } catch (e) { return true; } }
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function ton(f1, f2, dur, tip, vol, gec) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tip || 'square'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .08, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
    }
    function gurultu(dur, vol, gec, f) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = a.createBufferSource(); s.buffer = b; const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f || 1200;
        const g = a.createGain(); g.gain.value = vol || .2; s.connect(fl).connect(g).connect(a.destination); s.start(t);
    }
    const SES = {
        isin() { ton(1400, 300, .3, 'sawtooth', .07); ton(900, 1800, .15, 'square', .04, .05); },
        yumruk() { gurultu(.25, .3, 0, 600); ton(160, 60, .25, 'square', .1); },
        buz() { for (let i = 0; i < 4; i++) ton(1800 + i * 300, 2400 + i * 300, .08, 'triangle', .05, i * .06); },
        kalkan() { ton(500, 900, .15, 'square', .06); ton(700, 1200, .15, 'square', .06, .12); },
        cekic() { ton(800, 500, .07, 'square', .06); },
        muz() { ton(600, 200, .35, 'sine', .08); },
        kup() { ton(300 + Math.random() * 200, 120, .12, 'square', .04); },
        kukreme() { gurultu(1.1, .35, 0, 400); ton(110, 55, 1, 'sawtooth', .12); },
        patlama() { gurultu(1.6, .5, 0, 900); ton(200, 40, 1.2, 'square', .15); },
        zafer() { [523, 659, 784, 1047, 784, 1047].forEach((f, k) => ton(f, f, .18, 'square', .07, k * .14)); },
        sira() { ton(660, 990, .1, 'square', .05); }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_blok_' + konum(); }
    let _st = null, _stHam = null, _stKonum = null;
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.blokSeri > 0) ? a.blokSeri : 1; } catch (e) { return 1; } }
    // Boss canı (küp): sınıftaki her çocuktan ~1 seri × seviye. Çocuğun ok ortalaması beklenen küpü belirler.
    function toplamHesapla(no) {
        let top = 0;
        liste().forEach((s) => {
            let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { }
            top += 3 * (o >= 9 ? 2.6 : o >= 7 ? 2 : o >= 5 ? 1.4 : 1.1);
        });
        return Math.round(Math.max(18, top * seviye()) * (1 + .1 * Math.min(no, 5)));
    }
    function yeniBoss(st, tip) {
        st.no = (st.no == null ? 0 : st.no + 1); st.tip = tip || TIPLER[st.no % 2];
        st.toplam = toplamHesapla(st.no); st.can = st.toplam; st.katki = {}; st.atanlar = {}; st.seri = 0; st.donmus = 0;
        st.sehir = [true, true, true, true, true, true]; st.duvar = 3; st.kule = [true, true, true, true];
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !BOSS[_st.tip]) { _st = { tarih: bugun(), yenilenler: [] }; yeniBoss(_st, 'golem'); _st.no = 0; kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    // "Herkes" = listede olup gerçekten atış kaydı tutulabilen sporcular (kayıtta bulunmayan bir satır boss'u sonsuza bekletmesin).
    function atabilenler() { return liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad])); }
    function herkesAtti(st) { const l = atabilenler(); return l.length > 0 && l.every((s) => st.atanlar[s.g + '|' + s.ad]); }
    function atanSayi(st) { return atabilenler().filter((s) => st.atanlar[s.g + '|' + s.ad]).length; }
    // Final verisi (boss yenildi): katkı verenlerin hepsi; durum yeni boss'a geçer
    function finalKur(st) {
        const adlar = liste().map((x) => x.g + '|' + x.ad).filter((k2) => st.atanlar[k2]);
        const f = { tip: st.tip, adlar: adlar.map((k2) => ilkAd(k2.slice(k2.indexOf('|') + 1))), anahtarlar: adlar };
        st.yenilenler = (st.yenilenler || []).concat([{ tip: st.tip, adlar: f.adlar, t: Date.now() }]);
        rozetToplu(adlar);
        yeniBoss(st, st.tip === 'golem' ? 'ejder' : 'golem');
        return f;
    }
    // Koç: "⚡ Hep birlikte bitir" — can bitti ama atmayan biri kaldıysa (erken çıktı, bugün atmıyor) finali o an başlatır.
    function blkFinalZorla() {
        const st = durum(); if (st.can > 0 || _toren) return;
        const f = () => { const s2 = durum(); if (s2.can > 0) return; const fin = finalKur(s2); kaydet(); _toren = true; finalGoster(fin); };
        const kalan = atabilenler().length - atanSayi(st);
        if (typeof onayIste === 'function') onayIste('Süper ışın şimdi ateşlensin mi?<br><small>' + kalan + ' kahraman henüz atmadı. Atanların hepsi finalde adıyla görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function evre(st) { const o = st.can / (st.toplam || 1); return o > .66 ? 1 : o > .33 ? 2 : 3; }
    function rozetToplu(adlar) {
        adlar.forEach((k) => {
            const i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
            const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
            const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
            o.blok = o.blok || {}; o.blok.yenen = (o.blok.yenen || 0) + 1; sp.lastModified = Date.now();
        });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---------------- ÇİZİM: yardımcılar ---------------- */
    function koyu(h, k) { const n = parseInt(h.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.min(255, r * k); g = Math.min(255, g * k); b = Math.min(255, b * k); return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
    function kup(c, ox, oy, s, x, y, z, rk, p) {
        const X = ox + (x - z) * s * .866, Y = oy + (x + z) * s * .5 - y * s; p = p || 0;
        c.fillStyle = koyu(rk, 1.15 + p); c.beginPath(); c.moveTo(X, Y - s); c.lineTo(X + s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X - s * .866, Y - s * .5); c.closePath(); c.fill();
        c.fillStyle = koyu(rk, .82 + p); c.beginPath(); c.moveTo(X - s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X, Y + s); c.lineTo(X - s * .866, Y + s * .5); c.closePath(); c.fill();
        c.fillStyle = koyu(rk, .62 + p); c.beginPath(); c.moveTo(X + s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X, Y + s); c.lineTo(X + s * .866, Y + s * .5); c.closePath(); c.fill();
    }
    function isoXY(ox, oy, s, x, y, z) { return [ox + (x - z) * s * .866, oy + (x + z) * s * .5 - y * s]; }
    function tohum(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

    // Golem vokselleri (yerel ızgara). Kopma sırası: dış zırh önce, lav kalbi en son (tohumlu karışık).
    const GOLEM = (function () {
        const V = [], ek = (x0, x1, y0, y1, z0, z1, f) => { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) V.push({ x, y, z, r: f(x, y, z) }); };
        const tas = (x, y, z) => ((x * 7 + y * 13 + z * 5) % 9 === 0 ? '#ff7a2f' : ((x + y + z) % 3 ? '#6b6f7a' : '#5a5e69'));
        ek(1, 3, 0, 4, 1, 3, tas); ek(5, 7, 0, 4, 1, 3, tas); ek(0, 8, 4, 9, 0, 4, tas); ek(-2, 0, 4, 9, 1, 3, tas); ek(8, 10, 4, 9, 1, 3, tas); ek(-2, 0, 2, 4, 1, 3, () => '#5a5e69'); ek(8, 10, 2, 4, 1, 3, () => '#5a5e69'); ek(2, 6, 9, 12, 1, 4, tas);
        V.forEach((v) => { if (v.y === 10 && (v.x === 3 || v.x === 4) && v.z === 3) v.r = '#ffe14a'; if (v.y >= 5 && v.y <= 7 && v.x >= 3 && v.x <= 4 && v.z >= 2) { v.r = '#ff4a1a'; v.kalp = 1; } });
        const r = tohum(77); V.forEach((v) => { v.sira = (v.kalp ? 1000 : 0) + Math.hypot(v.x - 3.5, (v.y - 6) * .7, v.z - 1.5) * -10 + r() * 14; });
        const kopma = V.slice().sort((a, b) => a.sira - b.sira); kopma.forEach((v, i) => { v.k = i; });
        V.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y);
        return V;
    })();
    const BINA = [[-6, 1, '#e8d3a8', 3], [-6, 6, '#c9a0dc', 4], [12, -1, '#a8d8e8', 5], [13, 4, '#f0b8a0', 3], [12, 9, '#e8d3a8', 2], [-4, 11, '#b8e0a8', 3]];
    const ISO = { ox: 520, oy: 250, s: 21 }; // sahne sola kayık: skor kutusu sağ altta

    // Ejder blokları: zincir boyunca parçalar; her parçanın sırası (önce sırt dikenleri, sonra kanat, sonra gövde)
    const EJDER_N = 52;

    /* ---------------- SAHNE ---------------- */
    let _cv = null, _c = null, _boy = { w: 0, h: 0, k: 1, ox: 0, oy: 0 }, _raf = 0, _zemin = null, _zeminTip = null, _golemOn = null, _golemAnahtar = '';
    let _efekt = [], _parca = [], _yazi = [], _sallan = 0, _isinlar = [], _saldiri = null, _final = null, _toren = false, _zaman = [], _aktifZ = 0;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function panel() { return $('km-oyun-panel-blok'); }
    function boyutla() {
        const p = panel(); if (!p || !_cv) return; const r = p.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
        if (!r.width || !r.height) return;
        _cv.width = Math.round(r.width * d); _cv.height = Math.round(r.height * d); _cv.style.width = r.width + 'px'; _cv.style.height = r.height + 'px';
        const k = Math.min(r.width / W, r.height / H); _boy = { w: r.width, h: r.height, k: k, ox: (r.width - W * k) / 2, oy: (r.height - H * k) / 2, d: d };
        kahramanKutulari();
    }
    // Çocuk yerleri: altta 12'li sıralar (çok kalabalıkta iki sıra, arka sıra küçük)
    function cocukYer(i, n) {
        const sira = n > 12 ? (i < Math.ceil(n / 2) ? 0 : 1) : 0, satirN = n > 12 ? (sira === 0 ? Math.ceil(n / 2) : n - Math.ceil(n / 2)) : n, j = sira === 0 ? i : i - Math.ceil(n / 2);
        // skor kutusu varsayılan olarak sağ altta → kahramanlar sol üçte ikide dizilir (24 çocukta da sığar)
        const ara = Math.min(92, 640 / Math.max(1, satirN)), x0 = 350 - ara * (satirN - 1) / 2;
        return { x: x0 + j * ara + (sira ? ara / 2 : 0), y: sira === 0 ? 586 : 548, o: sira === 0 ? 1 : .82 };
    }
    // Dokununca sıra o çocuğa geçsin: kabuğun ortak data-km-sporcu dinleyicisi için şeffaf kutular
    function kahramanKutulari() {
        const k = $('blk-kutular'); if (!k) return; const n = liste().length, b = _boy;
        k.innerHTML = liste().map((s, i) => { const p = cocukYer(i, n), w = 70 * p.o * b.k, h = 96 * p.o * b.k; return `<button class="blk-kutu" data-km-sporcu="${i}" aria-label="${ilkAd(s.ad)} sıraya" style="left:${b.ox + p.x * b.k - w / 2}px;top:${b.oy + (p.y - 80 * p.o) * b.k}px;width:${w}px;height:${h}px"></button>`; }).join('');
    }
    function zeminCiz(tip) {
        const z = document.createElement('canvas'); z.width = W * 1.5; z.height = H * 1.5; const c = z.getContext('2d'); c.scale(1.5, 1.5);
        if (tip === 'golem') {
            let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6fbfff'); g.addColorStop(1, '#d6efff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            c.fillStyle = '#b9dcf2'; for (let x = 0; x < W; x += 60) { const h = 40 + ((x * 37) % 70); c.fillRect(x, 230 - h, 56, h + 40); }
            for (let x = -9; x < 18; x++) for (let z2 = -7; z2 < 15; z2++) kup(c, ISO.ox, ISO.oy, ISO.s, x, -1, z2, (x + z2) % 2 ? '#5fb552' : '#56a84a');
            c.fillStyle = '#4f9a42'; c.fillRect(0, 500, W, 100);
        } else {
            let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0a26'); g.addColorStop(1, '#3a2a6a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            const r = tohum(9); for (let i = 0; i < 160; i++) { c.fillStyle = 'rgba(255,255,255,' + (.3 + r() * .7) + ')'; c.fillRect(r() * W, r() * 330, r() < .1 ? 3 : 2, r() < .1 ? 3 : 2); }
            c.fillStyle = '#fff6d0'; c.fillRect(990, 50, 76, 76); c.fillStyle = '#e8dcae'; c.fillRect(1006, 66, 16, 16); c.fillRect(1036, 96, 12, 12);
            c.fillStyle = '#2a2350'; for (let x = 0; x < W; x += 50) { const h = 30 + ((x * 53) % 60); c.fillRect(x, 400 - h, 48, h + 20); }
            c.fillStyle = '#2b2440'; c.fillRect(0, 470, W, 130);
        }
        return z;
    }
    function golemOnCiz(st) {
        const gor = Math.max(st.can > 0 ? 1 : 0, Math.ceil(GOLEM.length * st.can / (st.toplam || 1))), e = evre(st), son = st.can <= 0;
        const anahtarG = gor + '|' + e + '|' + son; if (_golemOn && _golemAnahtar === anahtarG) return _golemOn;
        const z = document.createElement('canvas'); z.width = W * 1.5; z.height = H * 1.5; const c = z.getContext('2d'); c.scale(1.5, 1.5);
        GOLEM.forEach((v) => {
            if (son ? !v.kalp || v.y !== 6 || v.x !== 3 : v.k >= gor) return;
            let rk = v.r; if (e >= 2 && rk === '#ff7a2f') rk = '#ff9a3a'; if (e >= 2 && v.r === '#ffe14a') rk = '#ff3b3b'; // öfkeli: gözler kızarır
            kup(c, ISO.ox, ISO.oy, ISO.s, v.x + 2, v.y, v.z + 3, rk, (v.kalp && e === 3) || son ? .35 : 0);
        });
        _golemOn = z; _golemAnahtar = anahtarG; return z;
    }
    // Ejder zinciri: t anındaki segment konumları
    function ejderSeg(t, st) {
        const e = evre(st), yuk = e === 3 ? 60 : 0, hiz = st.donmus ? .25 : .6, out = [];
        for (let i = 0; i < EJDER_N; i++) { const f = t * hiz - i * .045; out.push([520 + Math.cos(f) * 340, 190 + yuk + Math.sin(f * 2) * 70]); }
        return out;
    }
    function ejderGorunen(st) { return st.can <= 0 ? 1 : Math.max(1, Math.ceil(EJDER_N * 1.6 * st.can / (st.toplam || 1))); }

    function kahramanCiz(c, x, y, rk, ad, t, i, aktif, o, atis) {
        const z = aktif ? Math.abs(Math.sin(t * 6)) * 8 : Math.abs(Math.sin(t * 2 + i)) * 2;
        c.save(); c.translate(x, y - z); c.scale(o, o);
        c.fillStyle = koyu(rk, .78); c.fillRect(-15, -44, 30, 40 + Math.sin(t * 5 + i) * 3);
        c.fillStyle = '#3a4a6a'; c.fillRect(-11, -14, 9, 14); c.fillRect(2, -14, 9, 14);
        c.fillStyle = rk; c.fillRect(-13, -42, 26, 28); c.fillStyle = '#ffd23f'; c.fillRect(-5, -36, 10, 10);
        c.fillStyle = '#f2c79a'; c.fillRect(-12, -66, 24, 24); c.fillStyle = koyu(rk, .6); c.fillRect(-12, -60, 24, 6);
        c.fillStyle = '#fff'; c.fillRect(-8, -59, 5, 4); c.fillRect(3, -59, 5, 4); c.fillStyle = '#1b1b24'; c.fillRect(-6, -58, 2, 2); c.fillRect(5, -58, 2, 2);
        c.fillStyle = rk; if (atis) { c.fillRect(13, -48, 8, 8); c.fillRect(18, -54, 14, 8); } else { c.fillRect(-19, -40, 8, 22); c.fillRect(13, -40, 8, 22); }
        c.restore();
        c.font = '800 ' + (aktif ? 15 : 13) + 'px system-ui,sans-serif'; const w = c.measureText(ad).width + 14;
        c.fillStyle = aktif ? '#ffd23f' : 'rgba(0,0,0,.62)'; c.fillRect(x - w / 2, y + 4, w, 19);
        c.fillStyle = aktif ? '#2a1d00' : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ad, x, y + 14); c.textBaseline = 'alphabetic';
    }
    // Boss'un ekrandaki hedef noktası (ışınların gittiği yer)
    function hedefNokta(st, t) {
        if (st.tip === 'golem') {
            const gor = GOLEM.filter((v) => v.k < Math.ceil(GOLEM.length * st.can / (st.toplam || 1)));
            const v = gor.length ? gor[Math.floor(Math.random() * gor.length)] : GOLEM.find((x) => x.kalp);
            const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, v.x + 2, v.y, v.z + 3); return { x: X + Math.sin(t * 1.2) * 3, y: Y - ISO.s * .5, r: v.r };
        }
        const seg = ejderSeg(t, st), i = Math.floor(Math.random() * Math.min(seg.length, 30)); return { x: seg[i][0], y: seg[i][1], r: '#7c5cff' };
    }
    function sahneCiz(ms) {
        const c = _c; if (!c) return; const st = durum(), t = ms / 1000, b = _boy;
        // kutlamada yenilen boss'un dünyası kalır, boss küplere dağılmış (çizilmez); durum çoktan sıradaki boss'a geçti
        const gt = _final ? _final.tip : st.tip, bossYok = !!_final;
        c.setTransform(b.d, 0, 0, b.d, 0, 0); c.fillStyle = gt === 'golem' ? '#4f9a42' : '#2b2440'; c.fillRect(0, 0, b.w, b.h);
        c.setTransform(b.d * b.k, 0, 0, b.d * b.k, b.d * b.ox, b.d * b.oy);
        if (_sallan > 0) { c.translate((Math.random() - .5) * _sallan, (Math.random() - .5) * _sallan); _sallan *= .9; if (_sallan < .5) _sallan = 0; }
        if (_zeminTip !== gt) { _zemin = zeminCiz(gt); _zeminTip = gt; _golemOn = null; }
        c.drawImage(_zemin, 0, 0, W, H);
        if (gt === 'golem') {
            [[140, 90], [520, 60], [980, 110]].forEach(([x, y], i) => { const dx = (t * 10 + i * 300) % 1400 - 100; c.fillStyle = 'rgba(255,255,255,.95)'; c.fillRect(x + dx - 60, y, 120, 24); c.fillRect(x + dx - 36, y - 20, 72, 20); });
            // binalar (arkadakiler golemden önce)
            BINA.forEach(([x, z, rk, h], bi) => {
                const sag = st.sehir[bi]; const hh = sag ? h : 1;
                for (let y = 0; y < hh; y++) for (let a = 0; a < 2; a++) for (let q = 0; q < 2; q++) kup(c, ISO.ox, ISO.oy, ISO.s, x + a, y, z + q, sag ? ((y % 2 && a === 1) ? '#ffe9a8' : rk) : '#8a8a8a');
                if (!sag) { const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, x + 1, 1.6, z + 1); c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💥', X, Y); }
            });
            const sal = st.donmus ? 0 : Math.sin(t * 1.2) * 3, atak = _saldiri && _saldiri.tip === 'golem' ? Math.sin(Math.min(1, (t - _saldiri.t0) / .9) * Math.PI) : 0;
            if (!bossYok) { c.save(); c.translate(sal + atak * -40, -atak * 30); c.drawImage(golemOnCiz(st), 0, 0, W, H); c.restore(); }
            if (st.donmus) { c.font = '30px system-ui'; c.textAlign = 'center'; [[560, 110], [700, 150], [520, 260], [740, 300], [640, 70]].forEach(([x, y], k) => c.fillText('❄️', x + Math.sin(t * 2 + k) * 6, y + Math.cos(t * 2 + k) * 6)); }
        } else {
            // kale: duvar (seviye) + kuleler
            const kule = (x, h, ok) => { const hh = ok ? h : 2; for (let y = 0; y < hh; y++) { c.fillStyle = y % 2 ? '#5a5f7a' : '#4e536c'; c.fillRect(x, 470 - (y + 1) * 28, 84, 28); c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeRect(x, 470 - (y + 1) * 28, 84, 28); } if (ok) { for (let k = 0; k < 3; k++) { c.fillStyle = '#5a5f7a'; c.fillRect(x + k * 30, 470 - hh * 28 - 18, 24, 18); } c.fillStyle = '#ffd27a'; c.fillRect(x + 34, 470 - (hh - 1) * 28 + 6, 16, 14); } else { c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💥', x + 42, 470 - hh * 28 - 6); } };
            for (let y = 0; y < st.duvar; y++) { c.fillStyle = y % 2 ? '#4a4f6a' : '#555a78'; c.fillRect(150, 470 - (y + 1) * 24, 900, 24); for (let x = 150; x < 1050; x += 50) { c.strokeStyle = 'rgba(0,0,0,.2)'; c.strokeRect(x + (y % 2) * 25, 470 - (y + 1) * 24, 50, 24); } }
            for (let x = 150; x < 1050; x += 40) { c.fillStyle = '#555a78'; c.fillRect(x, 470 - st.duvar * 24 - 16, 24, 16); }
            kule(90, 9, st.kule[0]); kule(1026, 9, st.kule[3]); kule(380, 7, st.kule[1]); kule(736, 7, st.kule[2]);
            // ejder
            if (!bossYok) {
            let seg = ejderSeg(t, st);
            if (_saldiri && _saldiri.tip === 'ejder') { const p = Math.min(1, (t - _saldiri.t0) / 1.4), d = Math.sin(p * Math.PI); seg = seg.map(([x, y], i) => [x + (600 - x) * d * .6 * Math.max(0, 1 - i / 40), y + d * 220 * Math.max(0, 1 - i / 50)]); }
            // can azaldıkça: önce sırt dikenleri (%66 altı), sonra kanatlar küçülür, kuyruktan geriye gövde küpleri düşer
            const oran = st.can / (st.toplam || 1), e = evre(st), son = st.can <= 0, gor = son ? 1 : Math.max(8, Math.ceil(EJDER_N * (.25 + .75 * oran)));
            for (let i = gor - 1; i >= 0; i--) {
                const [x, y] = seg[i], s = i === 0 ? 50 : Math.max(12, 38 - i * .5);
                const rk = son ? '#ffd23f' : (e === 3 ? (i % 4 ? '#6a2a9a' : '#c05cff') : (i % 4 === 0 ? '#7c5cff' : '#4b2a9a'));
                c.fillStyle = rk; c.fillRect(x - s / 2, y - s / 2, s, s); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - s / 2, y + s / 4, s, s / 4);
                if (oran > .66 && i > 3 && i < 40 && i % 4 === 0) { c.fillStyle = '#a78bfa'; c.fillRect(x - 4, y - s / 2 - 12, 8, 12); }
            }
            const [hx, hy] = seg[0]; c.fillStyle = e >= 2 ? '#ff4a3a' : '#ffe14a'; c.fillRect(hx + 6, hy - 12, 10, 8); c.fillStyle = '#fff'; c.fillRect(hx + 18, hy + 6, 14, 5);
            const kanat = son ? 0 : Math.max(0, Math.min(5, Math.round(oran * 6))); if (kanat) { const [wx, wy] = seg[9], kn = Math.sin(t * (st.donmus ? 2 : 6)) * 30; c.fillStyle = 'rgba(124,92,255,.85)'; for (let k = 0; k < kanat; k++) { c.fillRect(wx - 20 - k * 22, wy - 20 - kn * (k / 5) - k * 6, 20, 20); c.fillRect(wx + k * 22, wy - 20 - kn * (k / 5) - k * 6, 20, 20); } }
            if (st.donmus) { c.font = '28px system-ui'; c.textAlign = 'center'; c.fillText('❄️', hx, hy - 40); }
            if (son) { c.fillStyle = 'rgba(255,210,63,.3)'; c.beginPath(); c.arc(hx, hy, 50 + Math.sin(t * 6) * 8, 0, 7); c.fill(); }
            }
        }
        if (!bossYok && st.tip === 'golem' && st.can <= 0) { const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, 5, 6, 5); c.fillStyle = 'rgba(255,210,63,.3)'; c.beginPath(); c.arc(X, Y - 10, 46 + Math.sin(t * 6) * 8, 0, 7); c.fill(); }
        // ışınlar
        _isinlar = _isinlar.filter((s) => t - s.t0 < .45);
        _isinlar.forEach((s) => { const a = 1 - (t - s.t0) / .45; c.globalAlpha = a; c.strokeStyle = s.renk; c.lineWidth = s.kalin; c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = s.kalin / 3; c.stroke(); c.globalAlpha = 1; });
        // kopan küpler
        _parca = _parca.filter((p) => p.y < 640);
        _parca.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += .4; p.d += p.vd; c.save(); c.translate(p.x, p.y); c.rotate(p.d); c.fillStyle = p.r; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, -p.s / 2, p.s / 2, p.s); c.restore(); });
        // kahramanlar
        const l = liste(), n = l.length, ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(0, n > 12 ? 470 : 512, W, 130);
        const atanIdx = _isinlar.length ? _isinlar[_isinlar.length - 1].i : -1;
        // arka sıra önce çizilir
        l.map((s, i) => i).sort((a, b) => cocukYer(a, n).y - cocukYer(b, n).y).forEach((i) => { const p = cocukYer(i, n); kahramanCiz(c, p.x, p.y - 26, renk(i), ilkAd(l[i].ad).slice(0, 9), t, i, i === ai && !_toren, p.o, i === atanIdx || (_final && _final.atis)); });
        // yazılar
        _yazi = _yazi.filter((y) => t - y.t0 < 1.3);
        _yazi.forEach((y) => { const p = (t - y.t0) / 1.3, s = p < .2 ? .5 + p * 3 : 1.1; c.save(); c.globalAlpha = 1 - Math.max(0, p - .6) / .4; c.translate(y.x, y.y - p * 60); c.scale(s, s); c.font = '900 ' + y.boy + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(y.m, 0, 0); c.fillStyle = y.renk; c.fillText(y.m, 0, 0); c.restore(); });
        // final: isim yağmuru + konfeti
        if (_final) {
            const p = (t - _final.t0);
            _final.konf.forEach((k) => { k.y += k.v; k.x += Math.sin(t * 2 + k.f) * .8; if (k.y > 620) k.y = -10; c.fillStyle = k.r; c.fillRect(k.x, k.y, 10, 10); });
            if (p > 1.2) { c.globalAlpha = Math.min(1, (p - 1.2) * 2); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(150, 150, 900, 220); c.font = '900 46px system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.fillText('HEP BİRLİKTE YENDİK!', 600, 215);
                c.font = '800 22px system-ui,sans-serif'; c.fillStyle = '#fff'; const sat = []; let cur = ''; _final.adlar.forEach((a) => { if ((cur + a).length > 46) { sat.push(cur); cur = ''; } cur += (cur ? ' · ' : '') + a; }); if (cur) sat.push(cur); sat.slice(0, 4).forEach((s, i) => c.fillText(s, 600, 262 + i * 30)); c.globalAlpha = 1; }
        }
    }
    function dongu(ms) {
        _raf = 0;
        const p = panel(); if (!p || !p.isConnected || !_cv || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'blok')) return;
        if (!document.hidden) { if (ms - _aktifZ >= 31) { _aktifZ = ms; try { sahneCiz(ms); } catch (e) { } } }
        _raf = requestAnimationFrame(dongu);
    }
    function dongBaslat() { if (!_raf) _raf = requestAnimationFrame(dongu); }

    /* ---------------- HUD ---------------- */
    function hudCiz() {
        const st = durum(), h = $('blk-hud'); if (!h) return;
        const n = 24, dolu = st.can <= 0 ? 0 : Math.max(1, Math.round(st.can / (st.toplam || 1) * n)), e = evre(st);
        const atan = atanSayi(st), top = atabilenler().length;
        const durumYazi = st.tip === 'golem' ? '🏠 Şehir ' + st.sehir.filter(Boolean).length + '/6' : '🧱 Duvar ' + st.duvar + '/5 · 🏰 ' + st.kule.filter(Boolean).length + '/4';
        const sonra5 = 5 - (st.seri % 5);
        h.innerHTML = `<div class="blk-bas"><b>${BOSS[st.tip].ikon} ${BOSS[st.tip].ad.toLocaleUpperCase('tr-TR')}</b><span>${st.can <= 0 ? '⚡ SON KÜP — herkes atınca hep birlikte!' : ['', 'Zırhlı', 'Öfkeli!', 'Son güç!'][e]}</span></div>
          <div class="blk-can" aria-label="Boss canı">${Array.from({ length: n }, (_, i) => `<i class="${i < dolu ? (i < n * .3 ? 'k' : 'd') : ''}"></i>`).join('')}</div>
          <div class="blk-alt"><span title="Bu boss'a en az bir ok atan kahraman">🦸 ${atan}/${top} kahraman attı</span><span>${durumYazi}</span>${st.can <= 0 && !_toren ? '<button class="blk-bitir" id="blk-bitir">⚡ Hep birlikte bitir</button>' : ''}${ic('saldiri') ? `<span>${st.donmus ? '❄️ Boss dondu' : '👊 Saldırı: ' + sonra5 + ' seri sonra'}</span>` : ''}</div>`;
        const bt = $('blk-bitir'); if (bt) bt.onclick = blkFinalZorla;
        const ses = $('blk-ses'); if (ses) ses.textContent = sesAcik() ? '🔊' : '🔇';
        document.querySelectorAll('.blk-sec button').forEach((b) => b.classList.toggle('aktif', b.dataset.tip === st.tip));
    }
    function blkGuncelle() { hudCiz(); kahramanKutulari(); }

    /* ---------------- SERİ ---------------- */
    function blkSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); _toren = false; _final = null; }
        const st = durum(), key = s.g + '|' + s.ad, olay = [];
        st.seri = (st.seri || 0) + 1; st.atanlar[key] = 1;
        (kaydedilecek || []).forEach((k) => {
            const g = guc(k.puan), o = { tip: g.tip, hasar: 0, v: String(k.puan) };
            if (g.hasar && st.can > 0) { o.hasar = Math.min(st.can, g.hasar); st.can -= o.hasar; }
            if (g.hasar) st.katki[key] = (st.katki[key] || 0) + g.hasar;
            if (g.tip === 'buz') { st.donmus = 1; }
            if (g.tip === 'kalkan') {
                if (st.tip === 'golem') { const y = st.sehir.indexOf(false); if (y >= 0) { st.sehir[y] = true; o.onar = 'bina'; } }
                else { const y = st.kule.indexOf(false); if (y >= 0) { st.kule[y] = true; o.onar = 'kule'; } else if (st.duvar < 5) { st.duvar++; o.onar = 'duvar'; } }
            }
            olay.push(o);
        });
        // boss saldırısı (her 5 seride), mavi okla donmuşsa boşa gider
        let saldiri = null;
        if (ic('saldiri') && st.seri % 5 === 0 && st.can > 0) {
            if (st.donmus) { saldiri = { tip: st.tip, dondu: true }; }
            else if (st.tip === 'golem') { const ayakta = st.sehir.map((b, j) => b ? j : -1).filter((j) => j >= 0); if (ayakta.length) { const j = ayakta[st.seri % ayakta.length]; st.sehir[j] = false; saldiri = { tip: 'golem', yikti: j }; } else saldiri = { tip: 'golem' }; }
            else if (st.duvar >= 3) { st.duvar--; saldiri = { tip: 'ejder', sekti: true }; }
            else { const ayakta = st.kule.map((b, j) => b ? j : -1).filter((j) => j >= 0); if (ayakta.length) { const j = ayakta[st.seri % ayakta.length]; st.kule[j] = false; saldiri = { tip: 'ejder', yikti: j }; } else saldiri = { tip: 'ejder' }; }
        }
        if (saldiri) st.donmus = 0; // donma bir saldırıyı boşa çıkarır
        // final: can bitti VE herkes attı
        let final = null;
        if (st.can <= 0 && herkesAtti(st)) final = finalKur(st);
        kaydet();
        // görsel
        if (!panel() || !_cv) { try { done(); } catch (e) { } return; }
        const l = liste(), n = l.length, p = cocukYer(i, n), bas = { x: p.x + 14, y: p.y - 26 - 48 * p.o };
        olay.forEach((o, k) => sonra(() => {
            const tt = performance.now() / 1000, hedef = hedefNokta(final ? Object.assign({}, st, { tip: final.tip }) : st, tt), G = GUC[o.tip];
            if (o.tip === 'muz') { SES.muz(); _yazi.push({ m: 'ups! 🍌 kaydı', x: p.x, y: p.y - 120, renk: '#ffe14a', boy: 26, t0: tt }); return; }
            _isinlar.push({ x1: bas.x, y1: bas.y, x2: hedef.x, y2: hedef.y, renk: G.renk, kalin: o.tip === 'isin' ? 14 : 9, t0: tt, i: i });
            SES[o.tip] && SES[o.tip]();
            for (let q = 0; q < Math.max(1, o.hasar) * 2; q++) _parca.push({ x: hedef.x, y: hedef.y, vx: (Math.random() - .5) * 9, vy: -4 - Math.random() * 5, d: 0, vd: (Math.random() - .5) * .4, s: 12 + Math.random() * 8, r: hedef.r });
            if (o.hasar) sonra(SES.kup, 120);
            _yazi.push({ m: rnd(G.yazi) + (o.v === 'X' ? ' X!' : ''), x: hedef.x + 30, y: hedef.y - 30, renk: G.renk, boy: o.tip === 'isin' ? 40 : 32, t0: tt });
            if (o.onar) _yazi.push({ m: o.onar === 'bina' ? '🏠 Bina onarıldı!' : o.onar === 'kule' ? '🏰 Kule onarıldı!' : '🧱 Duvar yükseldi!', x: 600, y: 470, renk: '#c8f7c5', boy: 26, t0: tt + .1 });
            if (o.tip === 'isin' || o.tip === 'yumruk') _sallan = o.tip === 'isin' ? 10 : 6;
            hudCiz();
        }, k * 450));
        const bitis = olay.length * 450 + 300;
        if (saldiri) sonra(() => saldiriGoster(saldiri), bitis);
        const sonraki = bitis + (saldiri ? 1700 : 0);
        sonra(() => {
            if (final) _toren = true;
            try { done(); } catch (e) { }
            hudCiz();
            if (final) finalGoster(final);
            else if (st.can <= 0) { _yazi.push({ m: '⚡ SON KÜP! ' + (atabilenler().length - atanSayi(st)) + ' kahraman daha atınca hep birlikte!', x: 600, y: 120, renk: '#ffd23f', boy: 26, t0: performance.now() / 1000 }); }
        }, sonraki);
    }
    function saldiriGoster(sa) {
        const t = performance.now() / 1000;
        if (sa.dondu) { SES.buz(); _yazi.push({ m: '❄️ Boss saldıracaktı ama DONDU!', x: 600, y: 140, renk: '#9be0ff', boy: 30, t0: t }); hudCiz(); return; }
        _saldiri = { tip: sa.tip, t0: t }; SES.kukreme(); _sallan = 16;
        _yazi.push({ m: sa.tip === 'golem' ? (sa.yikti != null ? '👊 GOLEM BİR BİNAYI YIKTI!' : '👊 GOLEM YUMRUK ATTI!') : (sa.sekti ? '🐉 EJDER DUVARA ÇARPIP SEKTİ!' : (sa.yikti != null ? '🐉 EJDER BİR KULEYİ DEVİRDİ!' : '🐉 EJDER DALDI!')), x: 600, y: 150, renk: '#ff7a5a', boy: 30, t0: t + .4 });
        _yazi.push({ m: 'Siyah halka 🛡️ onarır!', x: 600, y: 196, renk: '#e8eef8', boy: 20, t0: t + .7 });
        sonra(() => { _saldiri = null; hudCiz(); }, 1600);
    }
    function finalGoster(f) {
        const t = performance.now() / 1000;
        _final = { t0: t, tip: f.tip, adlar: f.adlar, atis: true, konf: Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: -Math.random() * 600, v: 2 + Math.random() * 3, f: Math.random() * 6, r: rnd(['#ff5a5a', '#ffd23f', '#5fe07a', '#3fd2ff', '#b07bff', '#ff9be0']) })) };
        const l = liste(), n = l.length, hedef = f.tip === 'golem' ? { x: 560, y: 200 } : { x: 520, y: 200 };
        SES.isin(); SES.patlama();
        l.forEach((s, i) => { if (!f.anahtarlar.includes(s.g + '|' + s.ad)) return; const p = cocukYer(i, n); sonra(() => { _isinlar.push({ x1: p.x + 14, y1: p.y - 74 * p.o, x2: hedef.x, y2: hedef.y, renk: renk(i), kalin: 12, t0: performance.now() / 1000, i: -1 }); }, (i % 8) * 60); });
        for (let q = 0; q < 140; q++) _parca.push({ x: hedef.x + (Math.random() - .5) * 120, y: hedef.y + (Math.random() - .5) * 120, vx: (Math.random() - .5) * 16, vy: -6 - Math.random() * 9, d: 0, vd: (Math.random() - .5) * .5, s: 12 + Math.random() * 12, r: f.tip === 'golem' ? rnd(['#6b6f7a', '#5a5e69', '#ff7a2f', '#ff4a1a']) : rnd(['#7c5cff', '#4b2a9a', '#a78bfa', '#ffd23f']) });
        _sallan = 22; sonra(SES.zafer, 900);
        try { if (typeof kmOyunBanner === 'function') sonra(() => kmOyunBanner('🦸 ' + BOSS[f.tip].ad.toLocaleUpperCase('tr-TR') + ' YENİLDİ!', 'Hep birlikte: ' + f.adlar.slice(0, 14).join(', ') + (f.adlar.length > 14 ? ' ve ' + (f.adlar.length - 14) + ' kahraman daha' : ''), 'bitis'), 1400); } catch (e) { }
        sonra(() => { _final = null; _toren = false; _golemOn = null; hudCiz(); const st = durum(); _yazi.push({ m: BOSS[st.tip].ikon + ' Yeni boss geliyor: ' + BOSS[st.tip].ad + '!', x: 600, y: 160, renk: '#fff', boy: 32, t0: performance.now() / 1000 }); }, 7600);
    }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }

    /* ---------------- KURULUM ---------------- */
    function nasil() {
        const m = 'Her ok bir süper güç: sarı ⚡ 3 küp (X 4) · kırmızı 👊 2 küp · mavi ❄️ boss donar (saldırısı boşa gider) · siyah 🛡️ yıkılanı onarır · beyaz 🔨 1 küp · ıska 🍌 kayar.<br>Her 5 seride boss saldırır. Boss, sınıftaki herkes en az bir ok atmadan düşmez — son vuruşu hep birlikte yaparız!';
        if (typeof onayIste === 'function') onayIste(m, () => { }, 'Tamam', 'Kapat'); else alert(m.replace(/<br>/g, '\n'));
    }
    function bossSec(tip) {
        const st = durum(); if (st.tip === tip) return;
        const f = () => { const s2 = durum(); const no = s2.no; yeniBoss(s2, tip); s2.no = no; kaydet(); _golemOn = null; hudCiz(); };
        if (st.can < st.toplam && typeof onayIste === 'function') onayIste('Boss değişsin mi?<br><small>Bu boss\'taki ilerleme sıfırlanır (serileri silinmez).</small>', f, 'Değiştir', 'Vazgeç'); else f();
    }
    function yeniSor() {
        const f = () => { const st = durum(); yeniBoss(st, st.tip); kaydet(); _golemOn = null; zamanTemizle(); _toren = false; _final = null; hudCiz(); if (typeof showToast === 'function') showToast('🔄 Boss baştan başladı', 'success'); };
        if (typeof onayIste === 'function') onayIste('Boss baştan başlasın mı?<br><small>Can dolar, şehir/kale onarılır (sporcuların serileri silinmez).</small>', f, 'Baştan başlat', 'Vazgeç'); else f();
    }
    function blkSahneKur() {
        const p = panel(); if (!p) return; css();
        zamanTemizle(); _toren = false; _final = null; _isinlar = []; _parca = []; _yazi = []; _saldiri = null; _golemOn = null; _zeminTip = null;
        p.innerHTML = `<canvas id="blk-cv" aria-label="Blok Kahramanlar sahnesi"></canvas><div id="blk-kutular"></div>
          <div class="blk-hud" id="blk-hud"></div>
          <div class="blk-ust"><div class="blk-sec" role="group" aria-label="Boss"><button data-tip="golem" title="Lav Golemi">🌋 Golem</button><button data-tip="ejder" title="Gölge Ejder">🐉 Ejder</button></div>
            <button class="blk-btn" id="blk-ses" title="Ses">🔊</button><button class="blk-btn" id="blk-nasil" title="Nasıl oynanır?">❓</button><button class="blk-btn" id="blk-yeni-btn" title="Boss baştan">🔄</button></div>`;
        _cv = $('blk-cv'); _c = _cv.getContext('2d');
        p.querySelectorAll('.blk-sec button').forEach((b) => { b.onclick = () => bossSec(b.dataset.tip); });
        $('blk-ses').onclick = () => { try { localStorage.setItem('dag_blk_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.sira(); };
        $('blk-nasil').onclick = nasil; $('blk-yeni-btn').onclick = yeniSor;
        boyutla();
        if (window.ResizeObserver) { if (p._blkRo) p._blkRo.disconnect(); p._blkRo = new ResizeObserver(() => boyutla()); p._blkRo.observe(p); }
        hudCiz(); dongBaslat();
        if (azHareket()) sahneCiz(performance.now());
    }

    /* ---------------- GERİ AL / CHIP / AYAR ---------------- */
    function blkAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function blkGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _final = null; _st = k; _stKonum = konum(); kaydet(); _golemOn = null; if (panel()) hudCiz(); }
    function blkSporcu(g, ad) { const st = durum(); return Math.round(st.katki[g + '|' + ad] || 0); }
    function blkAyarUygula() { const st = durum(); if (_toren) return; const yeni = toplamHesapla(st.no); if (!yeni || yeni === st.toplam) return; const oran = st.can / (st.toplam || 1); st.toplam = yeni; st.can = Math.round(oran * yeni); kaydet(); _golemOn = null; hudCiz(); }

    function css() {
        if ($('blk-css')) return;
        const st = document.createElement('style'); st.id = 'blk-css';
        st.textContent = `
.km-oyun-panel-blok{padding:0;background:#2b2440;overflow:hidden}
#blk-cv{position:absolute;left:0;top:0;display:block}
#blk-kutular{position:absolute;inset:0;pointer-events:none}.blk-kutu{position:absolute;pointer-events:auto;background:transparent;border:0;cursor:pointer;border-radius:10px}.blk-kutu:hover{background:rgba(255,255,255,.08)}.blk-kutu:focus-visible{outline:3px solid #ffd23f}
.blk-hud{position:absolute;left:12px;top:10px;width:min(560px,56%);background:rgba(10,12,20,.72);border-radius:14px;padding:8px 12px;color:#fff;pointer-events:none;display:grid;gap:6px}
.blk-bas{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px}.blk-bas b{font-size:16px;letter-spacing:.04em}.blk-bas span{font-weight:800;color:#ffd23f;font-size:13px}
.blk-can{display:grid;grid-template-columns:repeat(24,1fr);gap:3px}.blk-can i{height:13px;background:#333;border-radius:2px}.blk-can i.d{background:#ff8a2a}.blk-can i.k{background:#ff3b3b}
.blk-alt{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;font-weight:800;color:#d9e0f0;align-items:center}.blk-bitir{pointer-events:auto;border:0;border-radius:999px;background:#ffd23f;color:#2a1d00;font-weight:900;font-size:12.5px;padding:6px 12px;cursor:pointer}
.blk-ust{position:absolute;right:10px;top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;max-width:26%}
.blk-sec{display:flex;background:rgba(10,12,20,.72);border-radius:999px;padding:3px}.blk-sec button{border:0;background:transparent;color:#fff;font-weight:800;font-size:12.5px;border-radius:999px;padding:6px 10px;cursor:pointer;min-height:34px}.blk-sec button.aktif{background:#ffd23f;color:#2a1d00}
.blk-btn{background:rgba(10,12,20,.72);border:0;color:#fff;border-radius:999px;width:36px;height:36px;font-size:16px;cursor:pointer}
@media (max-width:760px){.blk-hud{width:calc(100% - 20px);left:10px;top:56px}.blk-ust{max-width:none;left:10px;right:10px}.blk-alt{font-size:11px}}`;
        document.head.appendChild(st);
    }

    window.blkSahneKur = blkSahneKur;
    window.blkGuncelle = blkGuncelle;
    window.blkSeri = blkSeri;
    window.blkAnlik = blkAnlik;
    window.blkGeriYukle = blkGeriYukle;
    window.blkSporcu = blkSporcu;
    window.blkAyarUygula = blkAyarUygula;
    window.blkFinalZorla = blkFinalZorla;
    window.blkDurum = durum; // test/teşhis
})();
