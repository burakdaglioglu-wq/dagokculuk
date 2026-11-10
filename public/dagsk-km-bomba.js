/* ================================================================================================
   💣 FİTİL HATTI (Bomba Takımı) — Karışık Sınıf › Oyunlar teması 'bomba' (2026-11-10, v400). Kullanıcı: cezalı oyunlardan ikincisi;
   taslaklardan (https://claude.ai/artifact/NzMtD8eMq8tkPkocJQZ657) "A · Fitil Hattı"nı seçti.
   OYUN: sınıf 2–4 dengeli takıma bölünür (Dev Tahta ile aynı yılan dağıtımı). Her takımın bombası ve fitili var (30 sn ile başlar, en çok 60).
     Her seri fitili ok başına 4 sn yakar. Oklar çocuğun KENDİ seviyesine göre: kendi hedefi +6, hedefe değen +2, seviyesinin çok altı −2, ıska −5.
     3 ok da kendi hedefindeyse 🧯 söndürücü +4. Her seride küçük bir ŞANS olayı (kısa fitil, rüzgâr, fare · ıslak fitil, yedek fitil): iyi de kötü de atana çıkar.
   CEZA: fitil biten takımın bombası PATLAR; takım HEP BİRLİKTE bir ceza görevi yapar (yaylar yerde, atış çizgisinin arkasında), bomba yeniden kurulur (30 sn).
     Patlama mesajı atanı suçlamaz: "X takımının bombası patladı".
   KAZANAN (STANDING): herkes son serisini atınca en az patlayan takım; eşitlikte kalan fitil. Erken bitişte seri başına patlama. Finalde herkesin adı.
   KABUK: bmSahneKur · bmGuncelle · bmSeri(s, i, kaydedilecek, done) · bmAnlik · bmGeriYukle · bmSporcu · bmAyarUygula · bmFinalZorla.
   Durum 'dag_km_bomba_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK). Ayar: bombaTur, bombaTakim. İçerik: sans, ceza, gerilim.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('bomba', k); } catch (e) { return true; } };
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_bomba_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');
    const adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
    const ayar = (k, v) => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a[k] != null) ? a[k] : v; } catch (e) { return v; } };
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];
    const sure = (sn) => { sn = Math.max(0, Math.round(sn)); return Math.floor(sn / 60) + ':' + String(sn % 60).padStart(2, '0'); };

    /* ---- içerik ---- */
    const halka = (p) => p >= 9 ? 'sari' : p >= 7 ? 'kirmizi' : p >= 5 ? 'mavi' : p >= 3 ? 'siyah' : p >= 1 ? 'beyaz' : 'iska';
    const HALKA_RENK = { sari: '#F5D32A', kirmizi: '#E23B2E', mavi: '#2F7FD6', siyah: '#2A2D36', beyaz: '#F3F4F6', iska: '#4B5563' };
    const FITIL_BAS = 30, FITIL_MAX = 60, YANMA_OK = 4, SONDURUCU = 4, KRITIK = 12, OLAY_SANS = 1 / 6, GOREV_SN = 20;
    const TAKIM = [{ ad: 'KIRMIZI', renk: '#FF5A5A', ikon: '🔴' }, { ad: 'MAVİ', renk: '#4DA3FF', ikon: '🔵' }, { ad: 'SARI', renk: '#FFD34D', ikon: '🟡' }, { ad: 'YEŞİL', renk: '#5FD38D', ikon: '🟢' }];
    const OLAY_KOTU = [{ ikon: '✂️', ad: 'KISA FİTİL', yaz: 'Fitil kısa çıktı: −8 sn', d: -8 }, { ikon: '🌬️', ad: 'RÜZGÂR', yaz: 'Rüzgâr kıvılcımı harladı: −6 sn', d: -6 },
        { ikon: '🐀', ad: 'FARE KEMİRDİ', yaz: 'Fare fitili kemirdi: −5 sn', d: -5 }];
    const OLAY_IYI = [{ ikon: '💧', ad: 'ISLAK FİTİL', yaz: 'Fitil ıslandı, yavaş yanıyor: +8 sn', d: 8 }, { ikon: '🧵', ad: 'YEDEK FİTİL', yaz: 'Cepte yedek fitil vardı: +10 sn', d: 10 }];
    // Takım ceza görevleri: atış çizgisinin arkasında, yaylar yerde, takım HEP BİRLİKTE
    const GOREV = [['🐸', '10 KURBAĞA ZIPLAMASI', 'Takım hep birlikte, sayarak'], ['🙆', '10 YILDIZ ZIPLAMASI', 'Kollar yukarı, bacaklar aç-kapa'], ['🗿', 'HEYKEL', 'Takım 10 saniye hiç kıpırdamasın'],
        ['🦩', 'FLAMİNGO', 'Tek ayak üstünde 10 saniye, kimse düşmesin'], ['🏃', 'YERİNDE KOŞU', '10 saniye, dizler yukarı'], ['🤖', 'ROBOT YÜRÜYÜŞÜ', 'Sıra halinde 5 robot adımı ileri, 5 geri'],
        ['🪑', 'GÖRÜNMEZ SANDALYE', 'Duvara yaslanmadan 10 saniye çömel'], ['💥', 'BOMBA DANSI', '10 saniye patlayan bomba gibi titreyin, sonra donun']];

    /* ---- kurallar (saf) ---- */
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca +6
    function okFitil(p, es) { if (p >= es) return 6; if (p <= 0) return -5; if (p < es - 4) return -2; return 2; }
    function seriFitil(puanlar, es) {
        const oklar = puanlar.map((p) => okFitil(p, es)), tam = puanlar.length >= 3 && puanlar.every((p) => p >= es);
        const kazanc = oklar.reduce((t, x) => t + x, 0) + (tam ? SONDURUCU : 0), yanma = puanlar.length * YANMA_OK;
        return { oklar, tam, kazanc, yanma, net: kazanc - yanma };
    }
    function takimSayisi(n, secim) { if (n < 2) return 1; if (secim >= 2) return Math.min(secim, n); return n <= 9 ? 2 : n <= 17 ? 3 : 4; }
    // Dengeli yılan dağıtımı: güçlüler sırayla takımlara, sonra ters sıra (1-2-3-3-2-1…)
    function takimlaraBol(kisiler, T, ortOf, gurultu) {
        const s = kisiler.map((k) => ({ k, o: (ortOf(k) || 0) + (gurultu ? gurultu() * .4 : 0) })).sort((a, b) => b.o - a.o), m = {};
        s.forEach((x, i) => { const tur = Math.floor(i / T), j = i % T; m[x.k] = tur % 2 ? T - 1 - j : j; });
        return m;
    }
    // Fitile seri sonucunu uygula: biterse patlar, bomba yeniden kurulur
    function fitilUygula(f, net) { const y = f + net; return y <= 0 ? { fitil: FITIL_BAS, patladi: true } : { fitil: Math.min(FITIL_MAX, y), patladi: false }; }
    // Kazanan: en az patlama (erken bitişte seri başına), eşitlikte en uzun fitil. Yine eşitse birden çok takım.
    function kazananlar(patlama, fitil, seri, erken) {
        const T = patlama.length, skor = patlama.map((p, i) => erken ? (seri[i] ? p / seri[i] : Infinity) : p);
        const enAz = Math.min(...skor), aday = []; for (let i = 0; i < T; i++) if (Math.abs(skor[i] - enAz) < 1e-9 && skor[i] !== Infinity) aday.push(i);
        const enUzun = Math.max(...aday.map((i) => fitil[i]));
        return aday.filter((i) => fitil[i] === enUzun);
    }

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _gf = [], _gorevT = 0, _finalOynuyor = false, _cezaAcik = false;
    function yeniOyun() { return { tarih: bugun(), faz: 'oyun', basladi: false, T: 0, takim: {}, fitil: [], patlama: [], gorev: 0, atan: {}, katki: {}, seri: 0, ok: 0, son: [], ceza: null, kazanan: null, finalAdlar: null, erken: false }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { const t = +ayar('bombaTur', 1); return t > 0 ? t : 1; };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const ortKey = (k) => { const i = k.indexOf('|'); return ortalama({ g: k.slice(0, i), ad: k.slice(i + 1) }); };
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    function uyeler(st, ti) { return atabilenler().map(kimlik).filter((k) => st.takim[k] === ti); }
    function baslat(st) {
        const l = atabilenler().map(kimlik); if (!l.length) return;
        const T = takimSayisi(l.length, +ayar('bombaTakim', 0)); st.T = T;
        st.takim = takimlaraBol(l, T, ortKey, Math.random);
        st.fitil = Array(T).fill(FITIL_BAS); st.patlama = Array(T).fill(0); st.basladi = true; st.kadro = kadroImza(); _gf = st.fitil.slice();
    }
    const kadroImza = () => atabilenler().map(kimlik).sort().join(',') + '|' + ayar('bombaTakim', 0);
    // İlk seri girilene kadar kadro (ya da takım ayarı) değişirse takımlar yeniden kurulur; sonra gelen çocuk en küçük takıma
    function yeniKatilan(st) {
        if (!st.basladi) return false; let d = false;
        atabilenler().map(kimlik).forEach((k) => { if (st.takim[k] != null && st.takim[k] < st.T) return; const boy = Array.from({ length: st.T }, (_, i) => uyeler(st, i).length), en = Math.min(...boy); st.takim[k] = boy.indexOf(en); d = true; });
        return d;
    }
    function bitir(st, erken) {
        const l = atabilenler(), seri = Array.from({ length: st.T }, (_, i) => uyeler(st, i).reduce((t, k) => t + (st.atan[k] || 0), 0));
        st.erken = !!erken; st.kazanan = kazananlar(st.patlama, st.fitil, seri, st.erken); st.faz = 'son';
        st.finalAdlar = Array.from({ length: st.T }, (_, i) => uyeler(st, i).map(adOf));
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp || !st.atan[kimlik(s)]) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.bomba = o.bomba || {}; o.bomba.oyun = (o.bomba.oyun || 0) + 1; if (st.kazanan.indexOf(st.takim[kimlik(s)]) >= 0) o.bomba.kazanma = (o.bomba.kazanma || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure_, gec, tip, gur, f2) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure_); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure_); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure_); } catch (e) { } }
    function gurultu(sure_, gur, gec, f, tip) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = Math.floor(AC.sampleRate * sure_), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const k = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); k.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f || 800; g.gain.value = gur || .2; k.connect(fl); fl.connect(g); g.connect(AC.destination); k.start(AC.currentTime + (gec || 0)); } catch (e) { } }
    const SES = {
        ok: () => { gurultu(.2, .1, 0, 2400, 'bandpass'); ton(660, .12, 0, 'triangle', .05); },
        uzat: () => { ton(520, .12, 0, 'sine', .08, 1040); },
        kisalt: () => { gurultu(.25, .18, 0, 3200, 'highpass'); ton(300, .18, 0, 'square', .05, 180); },
        yan: () => { gurultu(.5, .12, 0, 5000, 'highpass'); },
        tik: () => ton(1500, .04, 0, 'square', .05),
        olay: () => { [523, 784].forEach((f, i) => ton(f, .14, i * .08, 'triangle', .07)); },
        sondur: () => { gurultu(.6, .2, 0, 1200, 'lowpass'); [784, 988, 1175].forEach((f, i) => ton(f, .2, .2 + i * .1, 'triangle', .06)); },
        patla: () => { gurultu(1.4, .55, 0, 380); ton(110, 1, 0, 'sawtooth', .14, 30); gurultu(.4, .3, 0, 2500, 'highpass'); },
        duduk: () => { ton(2100, .22, 0, 'sine', .08); ton(2100, .4, .3, 'sine', .08); },
        kur: () => { [262, 330, 392].forEach((f, i) => ton(f, .2, i * .12, 'triangle', .06)); },
        zafer: () => { [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, .28, i * .14, 'square', .07)); [1568, 2093, 2637].forEach((f, i) => ton(f, .3, .8 + i * .1, 'triangle', .05)); }
    };

    /* ---- çizim ---- */
    const panel = () => $('km-oyun-panel-bomba');
    let _fx = [], _raf = 0;
    function tuvalBoyut(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    function patlat(x, y, renkler, n, guc) {
        if (azHareket()) return; const t0 = performance.now(), h0 = guc || 7;
        for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, h = 2 + Math.random() * h0; _fx.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 3, s: 5 + Math.random() * 9, r: renkler[i % renkler.length], t0, om: 600 + Math.random() * 800 }); }
        if (!_raf) _raf = requestAnimationFrame(efekt);
    }
    function efekt(ms) {
        _raf = 0; const cv = $('bm-efekt'); if (!cv) { _fx = []; return; }
        if (!cv._c || cv._w !== cv.clientWidth || cv._h !== cv.clientHeight) { cv._c = tuvalBoyut(cv); cv._w = cv.clientWidth; cv._h = cv.clientHeight; }
        const c = cv._c; c.clearRect(0, 0, cv._w, cv._h);
        _fx = _fx.filter((q) => ms - q.t0 < q.om);
        _fx.forEach((q) => { const u = (ms - q.t0) / q.om; q.x += q.vx; q.y += q.vy; q.vy += .3; c.globalAlpha = 1 - u; c.fillStyle = q.r; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s * .6); });
        c.globalAlpha = 1; if (_fx.length) _raf = requestAnimationFrame(efekt);
    }
    function merkezOf(el) { const sa = document.querySelector('.bm-sahne'); if (!el || !sa) return null; const r = el.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width / 2, y: r.top - rs.top + r.height / 2 }; }

    const FITIL_YOL = 'M74 40 C92 10 112 52 132 26 S166 6 196 22';
    function bombaSVG(ti) {
        return '<svg class="bm-bomba" viewBox="0 0 200 130" aria-hidden="true">'
            + '<path class="bm-fitil-iz" d="' + FITIL_YOL + '"/>'
            + '<path class="bm-fitil" id="bm-fitil-' + ti + '" d="' + FITIL_YOL + '" pathLength="100"/>'
            + '<g id="bm-kiv-' + ti + '"><g class="bm-kiv"><circle r="9" fill="#FF7A2F" opacity=".55"/><circle r="5.5" fill="#FFD34D"/><circle r="2.5" fill="#fff"/></g></g>'
            + '<rect x="56" y="32" width="22" height="16" rx="3" fill="#5A5F6B" transform="rotate(32 67 40)"/>'
            + '<circle cx="54" cy="84" r="40" fill="#1E2129" stroke="var(--t)" stroke-width="4"/><circle cx="40" cy="68" r="11" fill="#ffffff20"/>'
            + '<text class="bm-bomba-sure" id="bm-sure-' + ti + '" x="54" y="95" text-anchor="middle">0:30</text></svg>';
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function oyunIskelet(st) {
        let tk = ''; for (let ti = 0; ti < st.T; ti++) {
            const t = TAKIM[ti];
            tk += '<div class="bm-tk" id="bm-tk-' + ti + '" style="--t:' + t.renk + '"><div class="bm-tk-bas"><b>' + t.ad + '</b><span class="bm-pat" id="bm-pat-' + ti + '"></span></div>'
                + '<div class="bm-tk-bomba">' + bombaSVG(ti) + '<span class="bm-deg" id="bm-deg-' + ti + '"></span><span class="bm-bum" aria-hidden="true">💥</span></div>'
                + '<div class="bm-tk-uye" id="bm-uye-' + ti + '"></div></div>';
        }
        $('bm-icerik').innerHTML = '<div class="bm-oyun" id="bm-oyun"><div class="bm-ust">'
            + '<div class="bm-kural"><i>💣</i><div><small>FİTİL HATTI</small><b>Fitil biterse bomba patlar</b><span>Her ok fitili 4 sn yakar · iyi oklar uzatır</span></div></div>'
            + '<div class="bm-sayac"><small>ATTI</small><b id="bm-at">0 / 0</b><span id="bm-toplam">💥 0</span></div></div>'
            + '<div class="bm-orta" id="bm-orta"><div class="bm-takimlar" id="bm-takimlar" style="--n:' + Math.max(1, st.T) + '">' + tk + '</div>'
            + '<div class="bm-duyuru" id="bm-duyuru" aria-live="polite"></div><div class="bm-ceza" id="bm-ceza" aria-live="assertive"></div></div>'
            + '<div class="bm-yan" id="bm-yan"><div class="bm-yan-hedef" id="bm-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte +6 bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div>'
            + '<div class="bm-yan-yazi"><small>SIRADA · <span id="bm-yan-tk"></span></small><b id="bm-yan-ad"></b><span id="bm-yan-esik"></span><span class="bm-yan-kotu" id="bm-yan-kotu"></span></div>'
            + '<div class="bm-arac"><button type="button" class="bm-kucuk" id="bm-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="bm-kucuk" id="bm-yeni-btn" aria-label="Yeni oyun">↻</button><button type="button" class="bm-kucuk genis" id="bm-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        $('bm-oyun')._T = st.T;
    }
    function fitilCiz(st) {
        for (let ti = 0; ti < st.T; ti++) {
            const f = Math.max(0, Math.min(FITIL_MAX, _gf[ti] != null ? _gf[ti] : st.fitil[ti])), oran = f / FITIL_MAX;
            const yol = $('bm-fitil-' + ti), kiv = $('bm-kiv-' + ti), s = $('bm-sure-' + ti), kart = $('bm-tk-' + ti); if (!yol) continue;
            yol.style.strokeDasharray = (oran * 100).toFixed(2) + ' 100';
            try { const L = yol.getTotalLength(), p = yol.getPointAtLength(L * oran); kiv.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')'); } catch (e) { }
            if (s && s.textContent !== sure(f)) s.textContent = sure(f);
            const kr = f <= KRITIK && st.faz === 'oyun';
            kart.classList.toggle('kritik', kr); kart.classList.toggle('gerilim', kr && ic('gerilim'));
            const pt = $('bm-pat-' + ti), n = st.patlama[ti] || 0, h = n ? '💥'.repeat(Math.min(n, 5)) + (n > 5 ? '×' + n : '') : '';
            if (pt && pt.textContent !== h) pt.textContent = h;
        }
        const top = st.patlama.reduce((a, b) => a + b, 0), e = $('bm-toplam'), t = '💥 ' + top + ' patlama';
        if (e && e.textContent !== t) e.textContent = t;
    }
    function uyelerCiz(st) {
        const l = liste(), ai = aktifIndeks(), sec = st.ceza ? st.ceza.ti : -1;
        for (let ti = 0; ti < st.T; ti++) {
            const kutu = $('bm-uye-' + ti); if (!kutu) continue;
            const uy = l.map((s, i) => ({ s, i, k: kimlik(s) })).filter((x) => st.takim[x.k] === ti);
            const imza = uy.map((x) => x.k + ':' + (st.atan[x.k] || 0) + ':' + (x.i === ai ? 1 : 0)).join(',') + '|' + turSay() + '|' + (sec === ti);
            if (kutu._imza === imza) continue; kutu._imza = imza;
            kutu.innerHTML = uy.map((x) => { const at = (st.atan[x.k] || 0) >= turSay(); return '<button type="button" class="bm-uye' + (at ? ' atti' : '') + (x.i === ai ? ' aktif' : '') + (sec === ti ? ' cezada' : '') + '" data-km-sporcu="' + x.i + '">' + esc(ilkAd(x.s.ad)) + '</button>'; }).join('');
        }
        const o = $('bm-takimlar'); if (o) o.classList.toggle('sik', l.length > 14);
    }
    function yanCiz(st) {
        const akt = liste()[aktifIndeks()], yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        if (akt) {
            const k = kimlik(akt), es = esikOf(ortalama(akt)), ti = st.takim[k], tk = TAKIM[ti] || TAKIM[0], h = $('bm-yan-hedef');
            if (h) h.setAttribute('data-esik', es); yaz('bm-yan-ad', buyuk(ilkAd(akt.ad))); yaz('bm-yan-tk', tk.ikon + ' ' + tk.ad);
            const yy = $('bm-yan'); if (yy) yy.style.setProperty('--t', tk.renk);
            yaz('bm-yan-esik', (es >= 9 ? 'Sarı' : es >= 7 ? 'Kırmızı ya da sarı' : 'Mavi ya da içi') + ' = +6 sn · hedefe değen = +2 sn');
            yaz('bm-yan-kotu', 'Iska = −5 sn' + (es >= 9 ? ' · beyaz/siyah = −2 sn' : es >= 7 ? ' · beyaz = −2 sn' : '') + ' · her ok −4 sn yakar');
        }
        const n = atabilenler().length, a = atanSay(st), bit = $('bm-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
        yaz('bm-at', a + ' / ' + n);
    }
    function ciz(st) { fitilCiz(st); uyelerCiz(st); yanCiz(st); }
    function guncelle() {
        const kok = $('bm-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son' && (_finalOynuyor || _kilit || _cezaAcik)) return;
        if (st.faz === 'son') return sonCiz(st);
        if (atabilenler().length && (!st.basladi || (!st.seri && st.kadro !== kadroImza()))) { baslat(st); kaydet(); }
        else if (yeniKatilan(st)) kaydet();
        if (!st.basladi) { kok.innerHTML = '<div class="bm-bos">Önce derse sporcu ekleyin.</div>'; return; }
        if (!$('bm-oyun') || $('bm-oyun')._T !== st.T) oyunIskelet(st);
        if (!_kilit) _gf = st.fitil.slice();
        ciz(st);
        if (st.ceza && !_kilit && !_cezaAcik) cezaGoster(st, true);
    }
    function sonCiz(st) {
        cezaKapatSessiz();
        const kz = st.kazanan || [], tek = kz.length === 1, top = (st.patlama || []).reduce((a, b) => a + b, 0);
        const bas = tek ? '🏆 ' + TAKIM[kz[0]].ad + ' TAKIMI KAZANDI!' : kz.length ? '🤝 BERABERE: ' + kz.map((i) => TAKIM[i].ad).join(' · ') : '💣 OYUN BİTTİ';
        const cumle = top ? 'Toplam <b>' + top + '</b> bomba patladı' + (st.gorev ? ', <b>' + st.gorev + '</b> takım görevi yapıldı' : '') + '. ' : 'Hiçbir bomba patlamadı! ';
        const kartlar = Array.from({ length: st.T }, (_, i) => {
            const t = TAKIM[i], kaz = kz.indexOf(i) >= 0, n = (st.patlama || [])[i] || 0;
            return '<div class="bm-son-tk' + (kaz ? ' kaz' : '') + '" style="--t:' + t.renk + '"><div class="bm-son-bas"><b>' + (kaz ? '🏆 ' : '') + t.ad + '</b><em>' + (n ? n + ' 💥' : 'hiç patlamadı') + ' · fitil ' + sure(st.fitil[i] || 0) + '</em></div>'
                + '<div class="bm-son-adlar">' + ((st.finalAdlar || [])[i] || []).map((a) => '<span>' + esc(a) + '</span>').join('') + '</div></div>';
        }).join('');
        $('bm-icerik').innerHTML = '<div class="bm-son-ekran" id="bm-son-ekran"><span class="bm-et">Herkes attı' + (st.erken ? ' · erken bitti, seri başına bakıldı' : '') + '</span><h2>' + esc(bas) + '</h2><p class="bm-cumle">' + cumle + 'En az patlayan takım kazanır; eşitlikte fitili uzun olan.</p>'
            + '<div class="bm-son-tklar">' + kartlar + '</div><button type="button" class="bm-buyuk" id="bm-yeni-son">Yeni oyun</button></div>';
    }
    function duyur(html, sinif) { const d = $('bm-duyuru'); if (!d) return; d.className = 'bm-duyuru ac ' + (sinif || ''); d.innerHTML = html; }
    function duyuruKapa() { const d = $('bm-duyuru'); if (d) d.className = 'bm-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; _finalOynuyor = false; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function degGoster(ti, d) { const e = $('bm-deg-' + ti); if (!e) return; e.textContent = (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + ' sn'; e.className = 'bm-deg ac ' + (d > 0 ? 'art' : 'eks'); clearTimeout(e._t); e._t = setTimeout(() => { e.className = 'bm-deg'; }, 700); }
    function kipir(ti, sinif) { const k = $('bm-tk-' + ti); if (!k) return; k.classList.remove(sinif); void k.offsetWidth; k.classList.add(sinif); }

    /* Patlama sonrası ceza: takım hep birlikte görev yapar. Sıradaki seri girilirse görev "yapıldı" sayılır. */
    function cezaGoster(st, sessiz) {
        const c = st.ceza, e = $('bm-ceza'); if (!c || !e) return;
        _cezaAcik = true; uyelerCiz(st);
        const g = GOREV[c.g % GOREV.length], t = TAKIM[c.ti] || TAKIM[0], adlar = uyeler(st, c.ti).map(adOf);
        e.style.setProperty('--t', t.renk);
        e.innerHTML = '<div class="bm-ceza-kutu"><small>💥 ' + t.ad + ' TAKIMININ BOMBASI PATLADI</small><b class="bm-ceza-bas">HEP BİRLİKTE GÖREV!</b>'
            + '<div class="bm-ceza-adlar">' + adlar.map((a) => '<span>' + esc(a) + '</span>').join('') + '</div>'
            + '<div class="bm-gorev"><i>' + g[0] + '</i><b>' + g[1] + '</b><span>' + esc(g[2]) + '</span><p>Yaylar yerde · atış çizgisinin arkasında · diğer takımlar alkışlasın!</p></div>'
            + '<div class="bm-gorev-alt"><em id="bm-gorev-sn">' + GOREV_SN + '</em><button type="button" id="bm-gorev-tamam">✓ Yaptık, bomba kurulsun</button><button type="button" id="bm-gorev-gec">Geç</button></div></div>';
        e.classList.add('ac');
        let kalan = GOREV_SN; clearInterval(_gorevT);
        _gorevT = setInterval(() => { kalan--; const s = $('bm-gorev-sn'); if (s) s.textContent = Math.max(0, kalan); if (kalan <= 0) cezaKapat(true); }, 1000);
        if (!sessiz) SES.duduk();
    }
    function cezaKapatSessiz() { clearInterval(_gorevT); _gorevT = 0; const e = $('bm-ceza'); if (e) { e.classList.remove('ac'); e.innerHTML = ''; } _cezaAcik = false; }
    function cezaKapat(yapildi, sessiz) {
        const st = durum(); cezaKapatSessiz();
        let ti = -1; if (st.ceza) { ti = st.ceza.ti; if (yapildi) st.gorev = (st.gorev || 0) + 1; st.ceza = null; kaydet(); }
        if (st.faz === 'son') { if (sessiz) return; _kilit = true; finalSahne(st, () => { _kilit = false; sonCiz(st); }); return; }
        if (!sessiz && ti >= 0) { SES.kur(); duyur('<b>💣 ' + TAKIM[ti].ad + ' BOMBASI YENİDEN KURULDU</b><small>Fitil ' + sure(FITIL_BAS) + ' · dikkatli atın!</small>', 'iyi'); sonra(duyuruKapa, 1800); }
        if ($('bm-oyun')) { if (!_kilit) _gf = st.fitil.slice(); ciz(st); }
    }

    /* ---- seri ---- */
    function bmSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); if (durum().ceza || _cezaAcik) cezaKapat(true, true); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; }
        if (!st.basladi) baslat(st); else yeniKatilan(st);
        const key = kimlik(s);
        if (st.takim[key] == null) { const boy = Array.from({ length: st.T }, (_, j) => uyeler(st, j).length); st.takim[key] = boy.indexOf(Math.min(...boy)); }
        const ti = st.takim[key], puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), es = esikOf(ortalama(s)), r = seriFitil(puanlar, es);
        let olay = null; if (ic('sans') && Math.random() < OLAY_SANS) olay = Math.random() < .6 ? rastgele(OLAY_KOTU) : rastgele(OLAY_IYI);
        const f0 = st.fitil[ti], net = r.net + (olay ? olay.d : 0), sonuc = fitilUygula(f0, net);
        st.fitil[ti] = sonuc.fitil;
        if (sonuc.patladi) { st.patlama[ti] = (st.patlama[ti] || 0) + 1; if (ic('ceza')) st.ceza = { ti, g: Math.floor(Math.random() * GOREV.length) }; }
        st.katki[key] = (st.katki[key] || 0) + r.kazanc;
        st.atan[key] = (st.atan[key] || 0) + 1; st.seri = (st.seri || 0) + 1; st.ok = (st.ok || 0) + puanlar.length;
        st.son = [{ a: adOf(key), t: ti, n: net }].concat(st.son || []).slice(0, 5);
        const final = herkesAtti(st);
        if (final) bitir(st);
        kaydet();
        if (!panel()) return bit();
        if (!$('bm-oyun') || $('bm-oyun')._T !== st.T) oyunIskelet(st);
        _gf = st.fitil.slice(); _gf[ti] = f0; ciz(st);
        const tk = TAKIM[ti], adi = buyuk(ilkAd(s.ad));
        const chips = puanlar.map((p, j) => { const h = halka(p), d = r.oklar[j]; return '<i class="bm-ok" style="--h:' + HALKA_RENK[h] + (h === 'beyaz' || h === 'sari' ? ';--hy:#151515' : '') + '"><s>' + (p === 10 && String((kaydedilecek[j] || {}).puan) === 'X' ? 'X' : p === 0 ? 'M' : p) + '</s><u class="' + (d > 0 ? 'art' : 'eks') + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + '</u></i>'; }).join('');
        duyur('<span class="bm-d-ad" style="color:' + tk.renk + '">' + esc(adi) + '</span><span class="bm-d-ok">' + chips + '</span><b class="bm-d-top">' + tk.ad + ' fitili ' + (r.net >= 0 ? '+' : '−') + Math.abs(r.net) + ' sn</b>', r.net >= 0 ? 'iyi' : 'kotu');
        SES.ok();
        let t = 650; const adimT = azHareket() ? 150 : 460;
        const altSinir = sonuc.patladi ? 0 : 1, ayarla = (d) => { _gf[ti] = Math.max(altSinir, Math.min(FITIL_MAX, _gf[ti] + d)); fitilCiz(st); };
        r.oklar.forEach((d) => { sonra(() => { ayarla(d); degGoster(ti, d); if (d > 0) SES.uzat(); else { SES.kisalt(); kipir(ti, 'kipir'); } }, t); t += adimT; });
        if (r.tam) { sonra(() => { ayarla(SONDURUCU); degGoster(ti, SONDURUCU); duyur('<b>🧯 TAM SERİ: SÖNDÜRÜCÜ!</b><small>Üç ok da kendi hedefinde. Fitil +' + SONDURUCU + ' sn</small>', 'iyi'); SES.sondur(); }, t); t += 1500; }
        sonra(() => { ayarla(-r.yanma); degGoster(ti, -r.yanma); SES.yan(); const k = $('bm-tk-' + ti); if (k) { k.classList.remove('yaniyor'); void k.offsetWidth; k.classList.add('yaniyor'); } }, t); t += azHareket() ? 300 : 900;
        if (olay) {
            sonra(() => { duyur('<b>' + olay.ikon + ' ' + olay.ad + '!</b><small>' + tk.ad + ' takımı · ' + esc(olay.yaz) + (olay.d < 0 ? ' · Şans işi, iyi atana da çıkar.' : '') + '</small>', olay.d < 0 ? 'kotu' : 'iyi'); olay.d < 0 ? SES.kisalt() : SES.olay(); ayarla(olay.d); degGoster(ti, olay.d); if (olay.d < 0) kipir(ti, 'kipir'); }, t);
            t += 1900;
        }
        if (!sonuc.patladi && st.fitil[ti] <= KRITIK && ic('gerilim')) sonra(() => { [0, .35, .7, 1.05].forEach((d) => ton(1500, .04, d, 'square', .05)); }, t);
        if (sonuc.patladi) {
            sonra(() => { _gf[ti] = 0; fitilCiz(st); duyur('<b>⏳ …</b><small>' + tk.ad + ' takımının fitili bitiyor…</small>', 'kotu'); const k = $('bm-tk-' + ti); if (k) k.classList.add('kritik'); [0, .2, .4, .6, .8].forEach((d) => ton(1700, .04, d, 'square', .06)); }, t); t += azHareket() ? 300 : 1200;
            sonra(() => {
                const k = $('bm-tk-' + ti); if (k) { k.classList.remove('patladi'); void k.offsetWidth; k.classList.add('patladi'); }
                duyur('<b class="bm-bum-yazi">💥 BUUUM! ' + tk.ad + ' BOMBASI PATLADI!</b><small>' + (st.ceza ? 'Takım hep birlikte görev yapacak, sonra bomba yeniden kurulur.' : 'Bomba yeniden kuruluyor.') + '</small>', 'kotu');
                SES.patla(); const m = merkezOf(k && k.querySelector('.bm-bomba')); if (m) { patlat(m.x, m.y, ['#FF7A2F', '#FFD34D', '#FF4057', '#ffffff', tk.renk], 70, 11); }
                const sa = document.querySelector('.bm-sahne'); if (sa) { sa.classList.remove('salla'); void sa.offsetWidth; sa.classList.add('salla'); }
            }, t); t += azHareket() ? 400 : 2200;
            sonra(() => {
                duyuruKapa(); _gf = st.fitil.slice(); ciz(st); const k = $('bm-tk-' + ti); if (k) k.classList.remove('patladi');
                if (st.ceza) { cezaGoster(st); _kilit = false; try { done(); } catch (e) { } yanCiz(st); return; }
                if (final) { _kilit = true; finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } }); return; }
                bit();
            }, t);
            return;
        }
        sonra(() => {
            duyuruKapa(); _gf = st.fitil.slice(); ciz(st);
            if (final) { _kilit = true; finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } }); return; }
            bit();
        }, t);
    }
    function finalSahne(st, sonrasi) {
        _finalOynuyor = true; SES.zafer(); const kz = st.kazanan || [];
        duyur('<b>HERKES ATTI! ' + (kz.length === 1 ? '🏆 ' + TAKIM[kz[0]].ad + ' KAZANDI!' : kz.length ? '🤝 BERABERE!' : '') + '</b>', 'iyi');
        kz.forEach((ti, j) => sonra(() => { const m = merkezOf($('bm-tk-' + ti)); if (m) patlat(m.x, m.y, [TAKIM[ti].renk, '#FFD34D', '#FFFFFF'], 40); }, j * 300));
        sonra(() => { duyuruKapa(); _finalOynuyor = false; sonrasi(); }, azHareket() ? 400 : 2600);
    }
    function bmFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; cezaKapat(true, true); bitir(s, atanSay(s) < atabilenler().length); kaydet(); zamanTemizle(); _kilit = true; finalSahne(s, () => { _kilit = false; guncelle(); }); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Oyun şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Takımlar, attıkları seri başına patlamayla karşılaştırılır; herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Sınıf dengeli takımlara bölünür. Her takımın bir <b>bombası</b> ve <b>fitili</b> var (30 sn ile başlar).<br>Her ok fitili <b>4 sn yakar</b>. Ok çocuğun kendi seviyesine göre: <b>kendi hedefi +6 sn</b>, hedefe değen +2 sn, seviyesinin çok altı −2 sn, <b>ıska −5 sn</b>. 3 ok da kendi hedefindeyse 🧯 söndürücü +4 sn.<br>'
            + 'Şans: ✂️ kısa fitil, 🌬️ rüzgâr, 🐀 fare fitili kısaltır; 💧 ıslak fitil ve 🧵 yedek fitil uzatır (iyi atana da kötü atana da çıkar).<br>'
            + '<b>Fitil biterse bomba patlar:</b> takım hep birlikte atış çizgisinin arkasında (yaylar yerde) bir görev yapar, bomba yeniden kurulur.<br>Herkes atınca <b>en az patlayan takım</b> kazanır; eşitlikte fitili uzun olan.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); cezaKapatSessiz(); _kilit = false; _st = yeniOyun(); kaydet(); _gf = []; $('bm-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni oyun başlasın mı?<br><small>Takımlar yeniden kurulur, bütün fitiller 30 sn olur. Sporcu serileri silinmez.</small>', f, 'Yeni oyun', 'Vazgeç'); else f();
    }
    function bmSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _cezaAcik = false; clearInterval(_gorevT);
        p.innerHTML = '<div class="bm-sahne"><div id="bm-icerik"></div><canvas id="bm-efekt" aria-hidden="true"></canvas></div>'; _fx = [];
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'bm-nasil') nasil(); else if (t.id === 'bm-yeni-btn' || t.id === 'bm-yeni-son') yeniSor(); else if (t.id === 'bm-bitir') bmFinalZorla();
            else if (t.id === 'bm-gorev-tamam') cezaKapat(true); else if (t.id === 'bm-gorev-gec') cezaKapat(false);
        };
        guncelle();
    }
    function css() {
        if ($('bm-css')) return; const st = document.createElement('style'); st.id = 'bm-css';
        st.textContent = '.km-oyun-panel-bomba{padding:0;background:#120C0A;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.bm-sahne{position:absolute;inset:0;color:#FFF4EA;overflow:hidden;background:radial-gradient(120% 90% at 50% 120%,#3A1D10 0%,#1A110D 55%,#0E0A09 100%)}'
            + '#bm-efekt{position:absolute;left:0;top:0;width:100%;height:100%;z-index:12;pointer-events:none;display:block;max-width:none}'
            + '#bm-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.bm-bos{display:grid;place-items:center;height:100%;font-size:20px;font-weight:800;color:#D9C2B0}'
            + '.bm-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:8px;min-height:0}'
            + '.bm-ust{flex:none;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}'
            + '.bm-kural{display:flex;gap:10px;align-items:center;padding:6px 12px;border-radius:14px;background:rgba(14,8,6,.78);border:1px solid rgba(255,122,47,.4);min-width:0}.bm-kural>i{font-style:normal;font-size:34px;line-height:1}.bm-kural div{display:flex;flex-direction:column;min-width:0}'
            + '.bm-kural small,.bm-sayac small{font-size:11px;font-weight:800;letter-spacing:.08em;color:#D9B08C}.bm-kural b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(22px,2.6vw,32px);font-weight:800;line-height:1;color:#FFD34D}.bm-kural span{font-size:13px;font-weight:700;color:#F0DCCB;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
            + '.bm-sayac{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 14px;border-radius:14px;background:rgba(14,8,6,.78);line-height:1.05}.bm-sayac b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(24px,2.8vw,34px);font-weight:800;font-variant-numeric:tabular-nums}.bm-sayac span{font-size:12px;font-weight:800;color:#FFB199;white-space:nowrap}'
            + '.bm-orta{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}'
            + '.bm-takimlar{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:10px}'
            + '.bm-tk{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;gap:4px;padding:8px;border-radius:16px;background:rgba(255,255,255,.05);border:3px solid var(--t);box-sizing:border-box}'
            + '.bm-tk-bas{display:flex;justify-content:space-between;align-items:center;gap:6px}.bm-tk-bas b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(20px,2.3vw,30px);font-weight:800;color:var(--t);line-height:1}.bm-pat{font-size:clamp(14px,1.5vw,20px);white-space:nowrap}'
            + '.bm-tk-bomba{position:relative;flex:1;min-height:70px;display:flex;align-items:center;justify-content:center}.bm-bomba{width:100%;height:100%;max-height:100%;overflow:visible}'
            + '.bm-kiv{transform-box:fill-box;transform-origin:center}.bm-fitil-iz{fill:none;stroke:#3A302A;stroke-width:3;stroke-dasharray:3 4}.bm-fitil{fill:none;stroke:#D9B98A;stroke-width:5;stroke-linecap:round;transition:stroke-dasharray .35s ease}'
            + '.bm-bomba-sure{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:26px;fill:#fff;font-variant-numeric:tabular-nums}.bm-tk.kritik .bm-bomba-sure{fill:#FF4057}'
            + '.bm-deg{position:absolute;right:6%;top:4%;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(22px,2.6vw,34px);opacity:0;transform:translateY(8px);transition:opacity .15s,transform .2s;pointer-events:none}.bm-deg.ac{opacity:1;transform:none}.bm-deg.art{color:#7DFFB0}.bm-deg.eks{color:#FF9AA8}'
            + '.bm-bum{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(60px,9vw,140px);opacity:0;pointer-events:none}'
            + '.bm-tk-uye{flex:none;display:flex;flex-wrap:wrap;gap:3px;justify-content:center}'
            + '.bm-uye{min-height:30px;padding:1px 8px;border-radius:99px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#FFF4EA;font:inherit;font-size:clamp(12.5px,1.25vw,15px);font-weight:800;cursor:pointer;display:flex;align-items:center;gap:3px}'
            + '.bm-uye.atti{background:var(--t);color:#16100C;border-color:var(--t)}.bm-uye.atti:after{content:"✓";font-weight:900}.bm-uye.aktif{outline:3px solid #fff;outline-offset:1px;background:#FFF4EA;color:#16100C}.bm-uye.cezada{box-shadow:0 0 0 2px #FF4057}'
            + '.bm-takimlar.sik .bm-uye{min-height:24px;padding:0 6px;font-size:12px}'
            + '.bm-tk.kritik{background:rgba(255,64,87,.12)}.bm-tk.patladi{background:rgba(255,122,47,.35)}.bm-tk.patladi .bm-bum{opacity:1}.bm-tk.patladi .bm-bomba{opacity:.15}'
            + '.bm-duyuru{position:absolute;left:50%;top:8px;z-index:8;transform:translate(-50%,-8px) scale(.96);width:max-content;max-width:94%;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;text-align:center;padding:8px 14px;border-radius:14px;background:rgba(14,8,6,.94);border:1px solid rgba(255,255,255,.14);opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}.bm-duyuru.ac{opacity:1;transform:translate(-50%,0)}'
            + '.bm-duyuru b,.bm-d-ad{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(24px,3vw,40px);line-height:1}.bm-duyuru.iyi b{color:#B9F26B}.bm-duyuru.kotu b{color:#FF8FA0}.bm-duyuru small{flex-basis:100%;font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#F5E6DA}.bm-d-top{color:#FFD34D}'
            + '.bm-d-ok{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.bm-ok{display:flex;align-items:center;gap:3px;font-style:normal;font-size:clamp(18px,2vw,24px)}.bm-ok s{text-decoration:none;display:grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;background:var(--h);color:var(--hy,#fff);font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:.8em;border:2px solid rgba(255,255,255,.6)}.bm-ok u{text-decoration:none;font-family:"Barlow Condensed",sans-serif;font-weight:800}.bm-ok u.art{color:#7DFFB0}.bm-ok u.eks{color:#FF9AA8}'
            + '.bm-ceza{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:8px;box-sizing:border-box;pointer-events:none;opacity:0;transition:opacity .2s}.bm-ceza.ac{opacity:1;pointer-events:auto;background:rgba(30,6,4,.55)}'
            + '.bm-ceza-kutu{box-sizing:border-box;width:min(520px,92%);max-height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:12px 16px;border-radius:20px;background:#170C09;border:4px solid var(--t);box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 40px rgba(255,122,47,.45)}'
            + '.bm-ceza-kutu>small{font-size:13px;font-weight:900;letter-spacing:.08em;color:#FFB199}.bm-ceza-bas{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(26px,3vw,40px);font-weight:800;line-height:1;color:#fff}'
            + '.bm-ceza-adlar{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}.bm-ceza-adlar span{padding:3px 10px;border-radius:10px;background:var(--t);color:#16100C;font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(17px,1.9vw,24px)}'
            + '.bm-gorev{display:grid;grid-template-columns:auto minmax(0,1fr);gap:0 10px;align-items:center;text-align:left}.bm-gorev>i{grid-row:1 / 3;font-style:normal;font-size:clamp(36px,4.4vw,54px);line-height:1}.bm-gorev>p{grid-column:1 / -1;text-align:center;margin:2px 0 0;font-size:13px;font-weight:700;color:#FFB199}.bm-gorev>b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(22px,2.7vw,34px);font-weight:800;color:#FFD34D;line-height:1}.bm-gorev>span{font-size:clamp(14px,1.5vw,18px);font-weight:700;color:#F5E6DA}'
            + '.bm-gorev-alt{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;align-items:center}.bm-gorev-alt em{font-style:normal;font-family:"Barlow Condensed",sans-serif;font-size:34px;font-weight:800;min-width:50px;color:#FFD34D}.bm-gorev-alt button{min-height:48px;padding:0 18px;border-radius:24px;border:0;font:inherit;font-weight:800;font-size:16px;cursor:pointer;background:#FFD34D;color:#2A1300}.bm-gorev-alt button+button{background:#2A1712;color:#FFF4EA;border:1px solid rgba(255,255,255,.2)}'
            + '.bm-yan{position:absolute;z-index:7;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(14,8,6,.85);border-left:5px solid var(--t,#FF7A2F);display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.bm-yan-hedef{flex:none;width:96px}.bm-yan-hedef svg{display:block;width:100%}.bm-yan-hedef .m{fill:#2F7FD6}.bm-yan-hedef .k{fill:#E23B2E}.bm-yan-hedef .s{fill:#F5D32A}.bm-yan-hedef[data-esik="7"] .m,.bm-yan-hedef[data-esik="9"] .m,.bm-yan-hedef[data-esik="9"] .k{fill:#3A3330}'
            + '.bm-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.bm-yan-yazi small{font-size:12px;font-weight:800;letter-spacing:.08em;color:#D9B08C}.bm-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;line-height:1;color:#FFD34D;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bm-yan-yazi>span{font-size:clamp(14px,1.4vw,17px);font-weight:800;line-height:1.25}.bm-yan-yazi .bm-yan-kotu{color:#FFB3BE}'
            + '.bm-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.bm-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.2);background:#2A1712;color:#FFF4EA;font:inherit;font-weight:800;cursor:pointer}.bm-kucuk[hidden]{display:none}.bm-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.bm-son-ekran{height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;padding:14px 18px;border-radius:18px;background:rgba(14,8,6,.88);border:2px solid rgba(255,122,47,.5)}.bm-et{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#D9B08C}'
            + '.bm-son-ekran h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(38px,5.4vw,72px);line-height:.95;color:#FFD34D}.bm-cumle{margin:0;font-size:clamp(16px,1.9vw,22px);font-weight:700;color:#F5E6DA}.bm-cumle b{color:#FFD34D}'
            + '.bm-son-tklar{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.bm-son-tk{padding:8px 12px;border-radius:14px;border:2px solid var(--t);background:rgba(255,255,255,.04)}.bm-son-tk.kaz{background:rgba(255,211,77,.12);box-shadow:0 0 30px rgba(255,211,77,.25)}'
            + '.bm-son-bas{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;align-items:baseline;margin-bottom:6px}.bm-son-bas b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(22px,2.4vw,30px);font-weight:800;color:var(--t)}.bm-son-bas em{font-style:normal;font-weight:800;color:#F0DCCB}'
            + '.bm-son-adlar{display:flex;flex-wrap:wrap;gap:5px}.bm-son-adlar span{padding:3px 10px;border-radius:9px;background:rgba(255,255,255,.08);font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:clamp(16px,1.7vw,21px)}'
            + '.bm-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFD34D;color:#2A1300;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.bm-sahne button:focus-visible{outline:3px solid #FFD34D;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.bm-kiv{animation:bm-kiv .22s infinite alternate}.bm-tk.gerilim{animation:bm-titre .35s infinite}.bm-tk.gerilim .bm-bomba-sure{animation:bm-yanip .7s infinite}'
            + '.bm-tk.kipir{animation:bm-kipir .35s ease}.bm-tk.yaniyor .bm-fitil{animation:bm-yan .9s ease}.bm-tk.patladi .bm-bum{animation:bm-bum .9s cubic-bezier(.2,1.6,.4,1)}.bm-sahne.salla #bm-icerik{animation:bm-salla .1s linear 8}'
            + '.bm-ceza.ac .bm-ceza-kutu{animation:bm-kart .5s cubic-bezier(.3,1.5,.5,1)}.bm-uye.aktif{animation:bm-nb 1.2s ease-in-out infinite}.bm-bum-yazi{animation:bm-salla .12s linear 6;display:inline-block}'
            + '@keyframes bm-kiv{from{transform:scale(.75)}to{transform:scale(1.25)}}@keyframes bm-titre{25%{transform:translate(-2px,1px)}75%{transform:translate(2px,-1px)}}@keyframes bm-yanip{50%{opacity:.35}}'
            + '@keyframes bm-kipir{30%{transform:translate(-4px,-3px) rotate(-1deg)}60%{transform:translate(3px,2px)}}@keyframes bm-yan{40%{stroke:#FF7A2F;filter:drop-shadow(0 0 6px #FF7A2F)}}@keyframes bm-bum{0%{transform:scale(.2)}100%{transform:none}}@keyframes bm-salla{25%{transform:translate(-7px,3px)}75%{transform:translate(7px,-3px)}}'
            + '@keyframes bm-kart{0%{transform:scale(.6) rotate(-4deg)}100%{transform:none}}@keyframes bm-nb{50%{transform:scale(1.06)}}}'
            + '@media(max-width:860px){#bm-icerik{padding:8px}.bm-oyun{overflow-y:auto}.bm-orta{flex:none}.bm-takimlar{grid-template-columns:repeat(2,minmax(0,1fr));flex:none}.bm-tk-bomba{height:110px;flex:none}.bm-kural span{white-space:normal}.bm-kural>i{font-size:26px}'
            + '.bm-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.bm-yan-hedef{width:48px}.bm-yan-yazi b{font-size:26px}.bm-yan-yazi>span{font-size:13px}.bm-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.bmSahneKur = bmSahneKur;
    window.bmGuncelle = guncelle;
    window.bmSeri = bmSeri;
    window.bmAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.bmGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); cezaKapatSessiz(); _kilit = false; _st = k; _kn = konum(); kaydet(); _gf = (k.fitil || []).slice(); if ($('bm-icerik')) { if (k.faz === 'oyun') $('bm-icerik').innerHTML = ''; guncelle(); } };
    window.bmSporcu = (g, ad) => (durum().katki || {})[g + '|' + ad] || 0;
    window.bmAyarUygula = () => { if ($('bm-icerik')) guncelle(); };
    window.bmFinalZorla = bmFinalZorla;
    window.bmDurum = durum;
    window._bmIc = { esikOf, okFitil, seriFitil, takimSayisi, takimlaraBol, fitilUygula, kazananlar, FITIL_BAS, FITIL_MAX, YANMA_OK, KRITIK, GOREV, TAKIM };
})();
