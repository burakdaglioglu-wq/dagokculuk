/* ================================================================================================
   🗺️ 81 İL: BAYRAK KAPMACA — Karışık Sınıf › Oyunlar teması 'il' (2026-10-28, 29 Ekim turnuvası için).
   Kullanıcı Cumhuriyet turnuvası taslaklarından "Dev Halat Çekme" ile birlikte seçti ("ikisini bitir ve yayınla").
   OYUN: Petek Türkiye haritası — 81 ilin her biri gerçek konumuna en yakın petekte, plaka koduyla. Sınıf 2 (≤7 sporcu) ya da
   3 takıma ayrılır (🔴 Al · ⚪ Ak · 🟨 Altın; ok ortalamasına göre dengeli). Sırası gelen sporcu için koç haritadan bir il seçer
   (seçmezse sistem önerir), sporcu seri atar:
     · Boş il: seri ≥ eşik (3 okta 10) → bayrak dikilir; ilin savunması = seri toplamı.
     · Rakip il: seri > savunma → ÇALAR 💥 (savunma = yeni seri) · ≤ → "Savundu!".
     · Kendi ili: savunma = max(eski, seri) → güçlendirir.
     · X ok: komşu boş/zayıf bir il de gelir (bayrak fırtınası). Ankara 5 il değerinde, İstanbul ve İzmir 3.
   SÜRE: koç seçer (30/45/60/90 dk ya da süresiz). Son 10 dk "Altın Dakikalar": her ele geçirme komşu bir boş ili de getirir.
   ADİL BİTİŞ (kullanıcı kuralı, Halat'la aynı): süre bitince ya da koç 🏁 deyince oyun hemen bitmez — o turda herkes eşit
   sayıda seri atınca biter (önce atan avantajlı olmasın).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumunu ve çizimi yönetir:
     ilSahneKur(panel) · ilGuncelle() · ilSeri(s, i, kaydedilecek, done) · ilAnlik() · ilGeriYukle(kopya) · ilSporcu(g, ad)
   DURUM 'dag_km_il_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL:
     { tarih, takimSay, takim{'g|ad':t}, iller{plaka:{t,d}}, hedef, sure, bas, bitir, bitti, atis{'g|ad':n}, katki{'g|ad':n}, oyun, seri }
   Rozet: sp.oyun.il = { sampiyon, caldi }.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    const TAKIM = [{ ad: 'Al', renk: '#e30a17', yazi: '#fff' }, { ad: 'Ak', renk: '#f2f2f2', yazi: '#2a1015' }, { ad: 'Altın', renk: '#f5b700', yazi: '#2a1015' }];

    /* ---------------- 81 İL (plaka, ad, enlem, boylam — il merkezi, yaklaşık) ---------------- */
    const IL = [['01','Adana',37.0,35.32],['02','Adıyaman',37.76,38.28],['03','Afyonkarahisar',38.76,30.54],['04','Ağrı',39.72,43.05],['05','Amasya',40.65,35.83],
        ['06','Ankara',39.93,32.86],['07','Antalya',36.9,30.7],['08','Artvin',41.18,41.82],['09','Aydın',37.85,27.85],['10','Balıkesir',39.65,27.88],
        ['11','Bilecik',40.14,29.98],['12','Bingöl',38.88,40.5],['13','Bitlis',38.4,42.1],['14','Bolu',40.73,31.6],['15','Burdur',37.72,30.29],
        ['16','Bursa',40.18,29.06],['17','Çanakkale',40.15,26.41],['18','Çankırı',40.6,33.62],['19','Çorum',40.55,34.95],['20','Denizli',37.78,29.09],
        ['21','Diyarbakır',37.91,40.24],['22','Edirne',41.68,26.56],['23','Elazığ',38.67,39.22],['24','Erzincan',39.75,39.49],['25','Erzurum',39.9,41.27],
        ['26','Eskişehir',39.78,30.52],['27','Gaziantep',37.07,37.38],['28','Giresun',40.91,38.39],['29','Gümüşhane',40.46,39.48],['30','Hakkari',37.57,43.74],
        ['31','Hatay',36.2,36.16],['32','Isparta',37.76,30.55],['33','Mersin',36.8,34.63],['34','İstanbul',41.01,28.98],['35','İzmir',38.42,27.14],
        ['36','Kars',40.6,43.1],['37','Kastamonu',41.38,33.78],['38','Kayseri',38.73,35.48],['39','Kırklareli',41.73,27.22],['40','Kırşehir',39.15,34.17],
        ['41','Kocaeli',40.77,29.94],['42','Konya',37.87,32.48],['43','Kütahya',39.42,29.98],['44','Malatya',38.35,38.31],['45','Manisa',38.61,27.43],
        ['46','Kahramanmaraş',37.58,36.94],['47','Mardin',37.31,40.74],['48','Muğla',37.22,28.36],['49','Muş',38.74,41.49],['50','Nevşehir',38.62,34.71],
        ['51','Niğde',37.97,34.68],['52','Ordu',40.98,37.88],['53','Rize',41.02,40.52],['54','Sakarya',40.69,30.43],['55','Samsun',41.29,36.33],
        ['56','Siirt',37.93,41.94],['57','Sinop',42.03,35.15],['58','Sivas',39.75,37.02],['59','Tekirdağ',40.98,27.51],['60','Tokat',40.31,36.55],
        ['61','Trabzon',41.0,39.72],['62','Tunceli',39.1,39.55],['63','Şanlıurfa',37.16,38.79],['64','Uşak',38.68,29.41],['65','Van',38.49,43.38],
        ['66','Yozgat',39.82,34.81],['67','Zonguldak',41.45,31.79],['68','Aksaray',38.37,34.03],['69','Bayburt',40.26,40.23],['70','Karaman',37.18,33.22],
        ['71','Kırıkkale',39.85,33.51],['72','Batman',37.88,41.13],['73','Şırnak',37.52,42.46],['74','Bartın',41.63,32.34],['75','Ardahan',41.11,42.7],
        ['76','Iğdır',39.92,44.05],['77','Yalova',40.65,29.27],['78','Karabük',41.2,32.62],['79','Kilis',36.72,37.12],['80','Osmaniye',37.07,36.25],['81','Düzce',40.84,31.16]];
    const DEGER = { '06': 5, '34': 3, '35': 3 };
    // Petek yerleşimi: her il, harita izdüşümündeki noktasına en yakın BOŞ peteğe oturur (önce büyükler, sonra plaka sırası).
    // R/KX oranı denenerek seçildi: ortalama 4,4 komşu, yalnız kalan il yok (petekler bitişik, harita dağınık durmuyor).
    const R = 32, HW = R * Math.sqrt(3), HH = R * 1.5, KX = 43.8, KY = 43.8 * 1.29;
    function izdusum(lat, lon) { return { x: 92 + (lon - 25.8) * KX, y: 124 + (42.25 - lat) * KY }; }
    function petekMerkez(q, r) { return { x: 80 + q * HW + (r & 1) * HW / 2, y: 112 + r * HH }; }
    function enYakinPetek(x, y) { const r = Math.round((y - 112) / HH), q = Math.round((x - 80 - (r & 1) * HW / 2) / HW); return [q, r]; }
    function komsular(q, r) { const d = r & 1 ? [[1, 0], [-1, 0], [0, -1], [1, -1], [0, 1], [1, 1]] : [[1, 0], [-1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]]; return d.map(([a, b]) => [q + a, r + b]); }
    const HARITA = (() => {
        const dolu = {}, sonuc = {}, sira = IL.slice().sort((a, b) => (DEGER[b[0]] || 1) - (DEGER[a[0]] || 1) || a[0].localeCompare(b[0]));
        sira.forEach(([p, ad, lat, lon]) => {
            const z = izdusum(lat, lon); const [q0, r0] = enYakinPetek(z.x, z.y);
            let en = null, enD = 1e9;
            for (let dr = -3; dr <= 3; dr++) for (let dq = -3; dq <= 3; dq++) { const q = q0 + dq, r = r0 + dr; if (dolu[q + ',' + r]) continue; const m = petekMerkez(q, r), d = Math.hypot(m.x - z.x, m.y - z.y); if (d < enD) { enD = d; en = [q, r]; } }
            dolu[en[0] + ',' + en[1]] = p; const m = petekMerkez(en[0], en[1]);
            sonuc[p] = { p: p, ad: ad, q: en[0], r: en[1], x: m.x, y: m.y, deger: DEGER[p] || 1 };
        });
        Object.values(sonuc).forEach((h) => { h.komsu = komsular(h.q, h.r).map(([q, r]) => dolu[q + ',' + r]).filter(Boolean); });
        return sonuc;
    })();

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_il_ses') !== '0'; } catch (e) { return true; } }
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function ton(f1, f2, dur, tip, vol, gec) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tip || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .15, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
    }
    const SES = {
        sec() { ton(700, 900, .08, 'triangle', .06); },
        dik() { [523, 659, 784].forEach((f, i) => ton(f, f, .15, 'triangle', .09, i * .08)); },
        cal() { ton(200, 600, .25, 'sawtooth', .1); [784, 988, 1175].forEach((f, i) => ton(f, f, .15, 'square', .06, .2 + i * .08)); },
        savun() { ton(300, 150, .3, 'square', .08); },
        kac() { ton(400, 250, .2, 'sine', .06); },
        altin() { [880, 1108, 1318, 1760].forEach((f, i) => ton(f, f, .18, 'triangle', .1, i * .1)); },
        fanfar() { [392, 523, 659, 784].forEach((f, i) => ton(f, f, .3, 'triangle', .14, i * .16)); ton(1046, 1046, .8, 'triangle', .14, .7); }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_il_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function kisi(s) { return s.g + '|' + s.ad; }
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) return a; } } catch (e) { } return 6; }
    function takimKur(st) {
        const n = liste().length <= 7 ? 2 : 3; st.takimSay = n; st.takim = {};
        const yilan = n === 2 ? [0, 1, 1, 0] : [0, 1, 2, 2, 1, 0];
        liste().slice().sort((a, b) => ortalama(b) - ortalama(a)).forEach((s, k) => { st.takim[kisi(s)] = yilan[k % yilan.length]; });
    }
    function takimTamamla(st) {
        let d = false;
        liste().forEach((s) => { const k = kisi(s); if (st.takim[k] == null) { const n = [...Array(st.takimSay).keys()].map((t) => liste().filter((x) => st.takim[kisi(x)] === t).length); st.takim[k] = n.indexOf(Math.min(...n)); d = true; } });
        return d;
    }
    function yeniOyun(st, no) { st.oyun = no; st.iller = {}; st.hedef = null; st.bas = Date.now(); st.bitir = false; st.bitti = null; st.atis = {}; st.katki = {}; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !_st.takim) { _st = { tarih: bugun(), sure: 45, seri: 0 }; takimKur(_st); yeniOyun(_st, 1); kaydet(); }
        else if (takimTamamla(_st)) kaydet();
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.il = o.il || {}; o.il[alan] = (o.il[alan] || 0) + 1; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }
    function puanlar(st) { const p = new Array(st.takimSay).fill(0); Object.entries(st.iller).forEach(([pl, v]) => { if (v.t < st.takimSay) p[v.t] += HARITA[pl].deger; }); return p; }
    function kalanMs(st) { return st.sure ? st.bas + st.sure * 60000 - Date.now() : Infinity; }
    function altinMi(st) { const k = kalanMs(st); return st.sure && k > 0 && k <= 10 * 60000; }
    // Adil bitiş: herkesin attığı seri sayısı eşitse tur tamam
    function turTamam(st) { const n = liste().map((s) => st.atis[kisi(s)] || 0); return n.length && Math.min(...n) === Math.max(...n); }
    function bitisBekliyor(st) { return !st.bitti && (st.bitir || kalanMs(st) <= 0); }
    // Öneri: rakibin en değerli/zayıf ili ya da takımın komşusundaki boş il
    function oneri(st, t) {
        const sahip = (p) => st.iller[p] ? st.iller[p].t : -1;
        const bos = Object.keys(HARITA).filter((p) => sahip(p) < 0);
        const komsuBos = bos.filter((p) => HARITA[p].komsu.some((k) => sahip(k) === t));
        const aday = (komsuBos.length ? komsuBos : bos).sort((a, b) => HARITA[b].deger - HARITA[a].deger || a.localeCompare(b));
        if (aday.length) return aday[0];
        const rakip = Object.keys(st.iller).filter((p) => st.iller[p].t !== t).sort((a, b) => HARITA[b].deger - HARITA[a].deger || st.iller[a].d - st.iller[b].d);
        return rakip[0] || null;
    }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false, _saatT = null;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-il'); }
    function altiGen(x, y, r) { const p = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; p.push((x + Math.cos(a) * r).toFixed(1) + ',' + (y + Math.sin(a) * r).toFixed(1)); } return p.join(' '); }
    function petekSVG(h, v) {
        const T = v ? TAKIM[v.t] : null;
        return `<g class="il-petek${v ? ' sahipli' : ''}${h.deger > 1 ? ' degerli' : ''}" id="il-p${h.p}" data-il="${h.p}">
          <polygon points="${altiGen(h.x, h.y, R - 1)}" fill="${T ? T.renk : '#2b3d5a'}" stroke="#0b1424" stroke-width="2"/>
          <text x="${h.x}" y="${h.y + (h.deger > 1 ? -2 : 4)}" text-anchor="middle" font-size="${h.p === '06' ? 18 : 14}" font-weight="900" fill="${T ? T.yazi : '#9fb3d1'}">${h.p === '06' ? '★' : h.p}</text>
          ${h.deger > 1 ? `<text x="${h.x}" y="${h.y + 14}" text-anchor="middle" font-size="10.5" font-weight="900" fill="${T ? T.yazi : '#ffd23f'}">×${h.deger}</text>` : ''}
          ${v ? `<text class="il-d" x="${h.x + 15}" y="${h.y - 13}" text-anchor="middle" font-size="10" font-weight="900" fill="${T.yazi}">${v.d}</text>` : ''}</g>`;
    }
    function sahneHTML(st) {
        let petek = ''; Object.values(HARITA).forEach((h) => { petek += petekSVG(h, st.iller[h.p]); });
        let takim = '';
        for (let t = 0; t < st.takimSay; t++) {
            const T = TAKIM[t], x = 22 + t * (st.takimSay === 2 ? 300 : 210), u = liste().map((s, i) => [s, i]).filter(([s]) => st.takim[kisi(s)] === t);
            takim += `<g transform="translate(${x} 8)"><rect width="${st.takimSay === 2 ? 285 : 198}" height="70" rx="14" fill="#0b1424cc" stroke="${T.renk}" stroke-width="3"/>
              <rect x="10" y="10" width="14" height="14" rx="4" fill="${T.renk}"/><text x="30" y="23" font-size="15" font-weight="900" fill="#fff">${T.ad}</text>
              <text class="il-puan" id="il-puan${t}" x="${(st.takimSay === 2 ? 285 : 198) - 12}" y="25" text-anchor="end" font-size="20" font-weight="900" fill="#ffd23f">0</text>`;
            u.forEach(([s, i], k) => {
                const renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('il', i) : T.renk, kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 26) : `<circle cy="-12" r="11" fill="${renk}"/>`;
                const sx = 22 + k * Math.min(34, ((st.takimSay === 2 ? 285 : 198) - 30) / Math.max(1, u.length));
                takim += `<g class="il-cocuk" id="il-c${i}" data-km-sporcu="${i}" transform="translate(${sx.toFixed(1)} 62)"><circle class="il-halka" cx="0" cy="-12" r="15" fill="none" stroke="#ffd23f" stroke-width="2.5" opacity="0"/><g class="il-ci">${kar}</g></g>`;
            });
            takim += '</g>';
        }
        return `<svg id="il-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><radialGradient id="il-den" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="#1c4a78"/><stop offset="1" stop-color="#0a1830"/></radialGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#il-den)"/>
          <g id="il-harita">${petek}</g>
          <g id="il-hedef-isaret"></g>
          <g id="il-takimlar">${takim}</g>
          <g id="il-pop"></g>
        </svg>
        <div class="il-hud"><div class="il-hud-ust"><span class="il-ad" id="il-ad"></span><span class="il-cip" id="il-saat"></span>
          <button class="il-btn" id="il-ses-btn" title="Ses">🔊</button><button class="il-btn" id="il-nasil-btn" title="Nasıl oynanır?">❓</button><button class="il-btn" id="il-sure-btn" title="Süre">⏱️</button><button class="il-btn" id="il-bitir-btn" title="Oyunu bitir (tur tamamlanınca)">🏁</button><button class="il-btn" id="il-yeni-btn" title="Yeni oyun / takımlar">🔀</button></div>
          <div class="il-hedef" id="il-hedef"></div></div>
        <div class="il-alt" id="il-alt"></div>
        <div class="il-dev" id="il-dev"></div>`;
    }
    function ilSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false;
        const st = durum();
        p.innerHTML = sahneHTML(st);
        $('il-ses-btn').onclick = () => { try { localStorage.setItem('dag_il_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.sec(); };
        $('il-nasil-btn').onclick = nasil;
        $('il-sure-btn').onclick = sureDegis;
        $('il-bitir-btn').onclick = bitirSor;
        $('il-yeni-btn').onclick = yeniSor;
        $('il-harita').addEventListener('click', (e) => { const g = e.target.closest('.il-petek'); if (!g || _toren) return; const st2 = durum(); if (st2.bitti) return; st2.hedef = g.dataset.il; kaydet(); SES.sec(); hedefCiz(); });
        _sonAi = -1; hudCiz(); ilGuncelle();
        clearInterval(_saatT); _saatT = setInterval(() => { if (!panel() || !panel().isConnected || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'il')) { clearInterval(_saatT); return; } saatCiz(); }, 1000);
    }
    function saatCiz() {
        const st = durum(), e = $('il-saat'); if (!e) return;
        if (st.bitti) { e.textContent = '🏁 Bitti'; return; }
        const k = kalanMs(st);
        if (k === Infinity) e.textContent = st.bitir ? '🏁 Son tur' : '⏱️ Süresiz';
        else if (k <= 0) e.textContent = '🏁 Son tur';
        else { const m = Math.floor(k / 60000), s = Math.floor(k % 60000 / 1000); e.textContent = (k <= 600000 ? '✨ ' : '⏱️ ') + m + ':' + String(s).padStart(2, '0'); }
        e.classList.toggle('altin', !!altinMi(st));
        altCiz();
    }
    function altCiz() {
        const st = durum(), a = $('il-alt'); if (!a) return;
        if (st.bitti) { a.innerHTML = ''; return; }
        if (bitisBekliyor(st)) { const n = liste().map((s) => st.atis[kisi(s)] || 0), mx = Math.max(0, ...n), kalan = liste().filter((s) => (st.atis[kisi(s)] || 0) < mx).length; a.innerHTML = kalan ? `🏁 Son tur: <b>${kalan}</b> sporcu daha atınca oyun biter` : '🏁 Son tur — tur tamamlandı'; return; }
        a.innerHTML = altinMi(st) ? '✨ <b>ALTIN DAKİKALAR</b>: her ele geçirme komşu bir boş ili de getirir!' : '';
    }
    function hudCiz() {
        const st = durum(); if (!$('il-ad')) return;
        $('il-ad').textContent = '🗺️ 81 İl · Oyun ' + st.oyun;
        const p = puanlar(st); p.forEach((v, t) => { const e = $('il-puan' + t); if (e) e.textContent = v; });
        $('il-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
        saatCiz(); hedefCiz();
    }
    function hedefCiz() {
        const st = durum(), ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0, s = liste()[ai], g = $('il-hedef-isaret'), h = $('il-hedef'); if (!g || !h) return;
        g.innerHTML = '';
        if (!s || st.bitti) { h.innerHTML = ''; return; }
        const t = st.takim[kisi(s)], hp = st.hedef && HARITA[st.hedef] ? st.hedef : oneri(st, t); if (!hp) { h.innerHTML = ''; return; }
        const H = HARITA[hp], v = st.iller[hp];
        g.innerHTML = `<polygon class="il-hedef-cerceve" points="${altiGen(H.x, H.y, R + 3)}" fill="none" stroke="#ffd23f" stroke-width="4"/>`;
        const ne = !v ? `boş · bayrak için ≥ ${esik()}` : v.t === t ? `kendi ili · savunma ${v.d} (güçlendir)` : `${TAKIM[v.t].ad} takımının · çalmak için > ${v.d}`;
        h.innerHTML = `🎯 <b>${kacis(ilkAd(s.ad))}</b> (${TAKIM[t].ad}) → <b>${H.p} ${H.ad}</b>${H.deger > 1 ? ' ×' + H.deger : ''} <small>${ne}${st.hedef ? '' : ' · öneri — haritadan değiştir'}</small>`;
    }
    let _okSay = 3;
    function esik() { return Math.round(_okSay * 10 / 3); }
    let _sonAi = -1;
    function ilGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#il-takimlar .il-cocuk').forEach((g) => { const aktif = +g.id.slice(4) === ai, h = g.querySelector('.il-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('il-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const st = durum(); st.hedef = null; kaydet(); const c = $('il-c' + ai), e = c && c.querySelector('.il-ci'); if (e) { e.classList.remove('il-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('il-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('il-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 22, 'font-weight': 900, fill: renk || '#fff', stroke: '#0b1424', 'stroke-width': 4, 'paint-order': 'stroke', class: 'il-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1700);
    }
    function dev(html, ms) { const d = $('il-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function petekYenile(p) { const st = durum(), e = $('il-p' + p); if (!e) return; e.outerHTML = petekSVG(HARITA[p], st.iller[p]); const n = $('il-p' + p); if (n) { n.classList.add('il-al'); } }

    /* ---------------- SERİ İŞLEME ---------------- */
    function ilSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); ilSahneKur(); }
        const st = durum(), key = kisi(s), t = st.takim[key];
        _okSay = (kaydedilecek || []).length || 3;
        if (st.bitti || t == null) { try { done(); } catch (e) { } return; }
        const top = (kaydedilecek || []).reduce((a, k) => a + okDeger(k.puan), 0), xVar = (kaydedilecek || []).some((k) => String(k.puan) === 'X');
        st.seri = (st.seri || 0) + 1; st.atis[key] = (st.atis[key] || 0) + 1;
        const hp = st.hedef && HARITA[st.hedef] ? st.hedef : oneri(st, t); st.hedef = null;
        const olay = { p: hp, tur: 'kac', top: top, ek: [] };
        if (hp) {
            const v = st.iller[hp];
            if (!v) { if (top >= esik()) { st.iller[hp] = { t: t, d: top }; olay.tur = 'dik'; } }
            else if (v.t === t) { olay.tur = 'guc'; olay.eski = v.d; v.d = Math.max(v.d, top); }
            else if (top > v.d) { olay.tur = 'cal'; olay.eskiT = v.t; st.iller[hp] = { t: t, d: top }; rozetYaz(s.g, s.ad, 'caldi'); }
            else { olay.tur = 'savun'; olay.d = v.d; }
            // X: bayrak fırtınası · Altın Dakikalar: ele geçirince komşu boş il de gelir
            const aldi = olay.tur === 'dik' || olay.tur === 'cal';
            const ekSay = (aldi && altinMi(st) ? 1 : 0) + (xVar && aldi ? 1 : 0);
            for (let k = 0; k < ekSay; k++) {
                const aday = HARITA[hp].komsu.filter((p) => !st.iller[p]).sort((a, b) => HARITA[b].deger - HARITA[a].deger || a.localeCompare(b))[0]
                    || HARITA[hp].komsu.filter((p) => st.iller[p] && st.iller[p].t !== t && st.iller[p].d < top).sort((a, b) => st.iller[a].d - st.iller[b].d)[0];
                if (aday) { st.iller[aday] = { t: t, d: Math.max(1, Math.round(top / 2)) }; olay.ek.push(aday); }
            }
            if (aldi) st.katki[key] = (st.katki[key] || 0) + HARITA[hp].deger + olay.ek.reduce((a, p) => a + HARITA[p].deger, 0);
        }
        // adil bitiş: süre doldu / koç bitir dedi → tur eşitlenince biter
        let bitis = null;
        if (bitisBekliyor(st) && turTamam(st)) {
            const p = puanlar(st), mx = Math.max(...p), kaz = p.map((v, k) => v === mx ? k : -1).filter((k) => k >= 0);
            const en = Object.entries(st.katki).sort((a, b) => b[1] - a[1])[0];
            st.bitti = { p: p, kazanan: kaz, enCok: en ? en[0] : null, t: Date.now() };
            if (kaz.length === 1) liste().forEach((x) => { if (st.takim[kisi(x)] === kaz[0]) rozetYaz(x.g, x.ad, 'sampiyon'); });
            bitis = st.bitti;
        }
        kaydet();
        if (!panel() || !$('il-svg')) { try { done(); } catch (e) { } return; }
        gorsel(olay, s, t);
        setTimeout(() => { if (bitis) _toren = true; try { done(); } catch (e) { } if (bitis) bitisGoster(bitis); }, 1100);
    }
    function gorsel(o, s, t) {
        if (!o.p) return; const H = HARITA[o.p], T = TAKIM[t];
        if (o.tur === 'dik') { SES.dik(); petekYenile(o.p); pop(`🚩 ${T.ad}: ${H.ad}!${H.deger > 1 ? ' ×' + H.deger : ''}`, H.x, H.y - 30, 22, '#ffd23f'); }
        else if (o.tur === 'cal') { SES.cal(); petekYenile(o.p); pop(`💥 ÇALDI! ${H.ad}: ${TAKIM[o.eskiT].ad} → ${T.ad}`, H.x, H.y - 32, 24, '#ffd23f'); const w = document.getElementById('km-oyun-sahne') || panel(); w.classList.remove('il-salla'); void w.offsetWidth; w.classList.add('il-salla'); }
        else if (o.tur === 'guc') { SES.dik(); petekYenile(o.p); pop(`🛡️ ${H.ad} güçlendi: ${Math.max(o.eski, o.top)}`, H.x, H.y - 30, 20, '#9fd3ff'); }
        else if (o.tur === 'savun') { SES.savun(); const e = $('il-p' + o.p); if (e) { e.classList.remove('il-savun'); void e.getBoundingClientRect(); e.classList.add('il-savun'); } pop(`🛡️ Savundu! ${o.d} ≥ ${o.top}`, H.x, H.y - 30, 22, '#9fd3ff'); }
        else { SES.kac(); pop(`Kaçtı! ${o.top} < ${esik()}`, H.x, H.y - 30, 20, '#c9d4e6'); }
        if (o.ek.length) { setTimeout(() => { SES.altin(); o.ek.forEach((p) => { petekYenile(p); pop('+' + HARITA[p].ad, HARITA[p].x, HARITA[p].y - 26, 18, '#ffd23f'); }); }, 500); }
        hudCiz();
    }
    function bitisGoster(b) {
        _toren = true; SES.fanfar();
        const bul = (k) => liste().find((s) => kisi(s) === k), en = b.enCok ? bul(b.enCok) : null;
        const sat = b.p.map((v, t) => `${TAKIM[t].ad} ${v}`).join(' · ');
        const baslik = b.kazanan.length === 1 ? `🏆 ${TAKIM[b.kazanan[0]].ad.toLocaleUpperCase('tr')} TAKIMI KAZANDI!` : '🤝 BERABERE!';
        const ank = durum().iller['06'];
        dev(`${baslik}<small>${sat}${ank ? ' · ★ Başkent Ankara: ' + TAKIM[ank.t].ad : ''}${en ? '<br>🚩 En çok il kazandıran: ' + kacis(ilkAd(en.ad)) : ''}<br>Yaşasın Cumhuriyet! 🎉 · yeni oyun için 🔀</small>`);
        document.querySelectorAll('#il-harita .il-petek.sahipli').forEach((e, k) => { e.style.animationDelay = (k % 12) * .05 + 's'; e.classList.add('il-dalga'); });
        sonra(() => { _toren = false; const d = $('il-dev'); if (d) d.classList.remove('goster'); hudCiz(); }, 9000);
    }
    function nasil() {
        dev(`🗺️ 81 İl: Bayrak Kapmaca<small style="text-align:left;display:inline-block;max-width:640px">
          Takımlar haritada il kapar. Sırası gelen için koç haritadan il seçer (seçmezse öneri):<br>
          · Boş il: seri ≥ ${esik()} → bayrak · Rakip il: savunmayı geçersen <b>ÇALARSIN</b> · Kendi ilin: güçlendirirsin<br>
          · X ok: komşu il de gelir · ★ Ankara ×5, İstanbul ve İzmir ×3 · Son 10 dk: Altın Dakikalar<br>
          · Süre bitince oyun <b>herkes eşit sayıda atınca</b> biter (önce atan avantajlı olmaz)<br><i>(kapatmak için dokun)</i></small>`);
        const d = $('il-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    const SURELER = [30, 45, 60, 90, 0];
    function sureDegis() {
        const st = durum(), i = SURELER.indexOf(st.sure), yeni = SURELER[(i + 1) % SURELER.length];
        st.sure = yeni; if (!Object.keys(st.iller).length) st.bas = Date.now(); kaydet(); saatCiz();
        if (typeof showToast === 'function') showToast('⏱️ Süre: ' + (yeni ? yeni + ' dk (oyun başından itibaren)' : 'süresiz'), 'info');
    }
    function bitirSor() {
        const st = durum(); if (st.bitti) return;
        const f = () => { const s2 = durum(); s2.bitir = true; kaydet(); altCiz(); saatCiz(); if (typeof showToast === 'function') showToast('🏁 Son tur — herkes eşit sayıda atınca oyun bitecek.', 'info'); };
        if (typeof onayIste === 'function') onayIste('Oyun bitsin mi?<br><small>Adil olsun diye hemen bitmez: bu turda henüz atmayanlar da atınca biter.</small>', f, 'Son tur', 'Vazgeç'); else f();
    }
    function yeniSor() {
        const f = () => { const st = durum(); takimKur(st); yeniOyun(st, (st.oyun || 1) + (Object.keys(st.iller).length ? 1 : 0)); kaydet(); ilSahneKur(); if (typeof showToast === 'function') showToast('🔀 Yeni oyun — takımlar yeniden kuruldu!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Yeni oyun başlasın mı?<br><small>Harita boşalır, takımlar dengeli yeniden kurulur (serileri silinmez).</small>', f, 'Yeni oyun', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function ilAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function ilGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _st = k; _stKonum = konum(); kaydet(); if (panel()) ilSahneKur(); }
    function ilSporcu(g, ad) { const st = durum(); return st.katki[g + '|' + ad] || 0; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('il-css')) return;
        const st = document.createElement('style'); st.id = 'il-css';
        st.textContent = `
.km-oyun-panel-il{padding:0;background:#0a1830;overflow:hidden}
.il-hud{position:absolute;right:10px;top:8px;z-index:1;width:min(400px,40%);display:grid;gap:6px;pointer-events:none;justify-items:end}
.il-hud-ust{display:flex;gap:5px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.il-ad,.il-cip{background:rgba(11,20,36,.85);color:#fff;border-radius:999px;padding:6px 11px;font-weight:900;font-size:13px;white-space:nowrap}
.il-cip.altin{background:#f5b700;color:#2a1015}
.il-btn{pointer-events:auto;background:rgba(11,20,36,.85);border:0;color:#fff;border-radius:999px;width:32px;height:32px;font-size:15px;cursor:pointer}
.il-hedef{background:rgba(11,20,36,.88);border:2px solid #ffd23f;color:#fff;border-radius:14px;padding:6px 12px;font-weight:800;font-size:13px;max-width:100%}
.il-hedef:empty{display:none}.il-hedef b{color:#ffd23f}.il-hedef small{display:block;color:#c9d4e6;font-size:11.5px}
.il-alt{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;background:rgba(11,20,36,.9);color:#fff;border-radius:999px;padding:7px 16px;font-weight:800;font-size:clamp(12px,1.5vw,16px);white-space:nowrap;pointer-events:none;z-index:1}
.il-alt:empty{display:none}.il-alt b{color:#ffd23f}
.il-petek{cursor:pointer}.il-petek polygon{transition:fill .5s}.il-petek:hover polygon{filter:brightness(1.25)}
.il-al{animation:ilAl .7s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:center}@keyframes ilAl{0%{transform:scale(1)}40%{transform:scale(1.45)}100%{transform:scale(1)}}
.il-savun{animation:ilSavun .4s linear;transform-box:fill-box;transform-origin:center}@keyframes ilSavun{25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
.il-dalga{animation:ilAl .6s ease 3;transform-box:fill-box;transform-origin:center}
.il-hedef-cerceve{animation:ilHedef 1s ease-in-out infinite;pointer-events:none}@keyframes ilHedef{50%{opacity:.35}}
.il-cocuk{cursor:pointer}.il-cocuk:hover .il-ci{filter:brightness(1.2)}.il-halka{transition:opacity .3s}
.il-sira-geldi{transform-box:fill-box;transform-origin:50% 100%;animation:ilSira .7s cubic-bezier(.3,1.6,.5,1)}@keyframes ilSira{40%{transform:translateY(-10px) scale(1.2)}}
.il-pop{animation:ilPop 1.7s ease-out forwards;transform-box:fill-box;transform-origin:center;pointer-events:none}
@keyframes ilPop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-44px)}}
.il-salla{animation:ilSalla .1s linear 6}@keyframes ilSalla{25%{transform:translate(-5px,2px)}75%{transform:translate(5px,-2px)}}
.il-dev{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(26px,5.4vw,70px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.4);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.08;width:92%}
.il-dev small{display:block;font-size:.32em;font-weight:800;margin-top:10px;color:#e8f0ff;line-height:1.4}
.il-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (max-width:700px){.il-hud{width:58%}.il-ad,.il-cip{font-size:11px;padding:4px 8px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-il *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.ilSahneKur = ilSahneKur;
    window.ilGuncelle = ilGuncelle;
    window.ilSeri = ilSeri;
    window.ilAnlik = ilAnlik;
    window.ilGeriYukle = ilGeriYukle;
    window.ilSporcu = ilSporcu;
    window.ilHarita = HARITA;
})();
