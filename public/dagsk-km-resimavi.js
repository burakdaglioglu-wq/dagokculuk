/* ================================================================================================
   🖼️ RESİM AVI — Karışık Sınıf › Oyunlar teması 'resimavi' (v447, 2026-11-23).
   Kullanıcı 6 fikirlik sayfadan (claude.ai/artifact/7Kktd8PBRe7ryD6jFTtJuh) "Resim Avı" + "Hayalet Avcıları"nı seçti.
   OYUN: karelerle kapalı gizli bir resim. Eşiği geçen ok bir kare açar: okun hedefte gittiği YÖN resmin o köşesi
   (sarı = orta). Konum girilmediyse puana göre (sarı ortadan, düşük kenardan) rastgele kapalı kare. 10/X = kare + 2 komşu.
   Sınıf tahmin eder, koç şıkka dokunur: doğru → az kareyle bildikçe ⭐⭐⭐; yanlış → bir can (3 can), şık çizilir.
   Normal/Zor'da mürekkep lekesi açılmış bir kareyi yeniden kapatır (kaybedilebilir). 6 resim = bir albüm (kalıcı yıldızlar).
   ZORLUK: Kolay 3×3 · 5+ · 3 şık · Normal 4×4 · 7+ · 4 şık · mürekkep 3 seride bir · Zor 5×5 · 8+ · 6 şık · yakın çekim · 2 seride bir.
   KABUK: skor girişi Oyunlar'ın ortak dock'u. rsmSahneKur · rsmGuncelle · rsmSeri · rsmAnlik · rsmGeriYukle · rsmSporcu
   DURUM 'dag_km_resimavi_<konum>' günlük (12 saat sıfırlaması) · KALICI 'dag_km_rsmkalici_<konum>' (albüm, yıldız, rütbe, rozet).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1280, H = 720;
    const K = window.kmKit;
    const sec = (a) => a[Math.floor(Math.random() * a.length)];
    const karistir = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    function aktif() { const l = K.liste(); return l[K.ai()] || null; }

    /* ---------- SES ---------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_rsm_ses') !== '0'; } catch (e) { return true; } }
    function ses(t) {
        if (!sesAcik()) return;
        try {
            AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = AC.currentTime;
            const ton = (f, d, tip, v, f2, g0) => { const o = AC.createOscillator(), g = AC.createGain(), b = n + (g0 || 0); o.type = tip || 'sine'; o.frequency.setValueAtTime(f, b); if (f2) o.frequency.exponentialRampToValueAtTime(f2, b + d); g.gain.setValueAtTime(v || .15, b); g.gain.exponentialRampToValueAtTime(.001, b + d); o.connect(g).connect(AC.destination); o.start(b); o.stop(b + d + .02); };
            ({
                cek: () => ton(900, .12, 'triangle', .06, 1600),
                ac: () => { ton(660, .1, 'triangle', .1); ton(990, .14, 'triangle', .08, null, .06); },
                iska: () => ton(300, .25, 'sine', .08, 150),
                dogru: () => [523, 659, 784, 1046, 1318].forEach((f, i) => ton(f, .35, 'triangle', .12, null, i * .1)),
                yanlis: () => { ton(300, .3, 'sawtooth', .1, 200); ton(200, .4, 'sawtooth', .1, 120, .25); },
                murekkep: () => { ton(220, .4, 'sine', .12, 90); },
                sec: () => ton(880, .07, 'square', .05)
            })[t]();
        } catch (e) { }
    }

    /* ---------- VERİ ---------- */
    const DZ = {
        kolay: { ad: '🐣 Kolay', d: '3×3 kare · 5+ · 3 şık', N: 3, esik: 5, sik: 3, murekkep: 0, zoom: false },
        normal: { ad: '🦊 Normal', d: '4×4 kare · 7+ · 4 şık · mürekkep lekesi', N: 4, esik: 7, sik: 4, murekkep: 3, zoom: false },
        zor: { ad: '🧠 Zor', d: '5×5 kare · 8+ · 6 şık · yakın çekim', N: 5, esik: 8, sik: 6, murekkep: 2, zoom: true }
    };
    const ALBUMLER = [
        { id: 'hayvan', ad: 'Hayvanlar', ikon: '🦁', r: [['🦒', 'Zürafa'], ['🐘', 'Fil'], ['🐙', 'Ahtapot'], ['🦓', 'Zebra'], ['🐧', 'Penguen'], ['🦩', 'Flamingo'], ['🐢', 'Kaplumbağa'], ['🦔', 'Kirpi']] },
        { id: 'masal', ad: 'Dinozor ve Masal', ikon: '🐉', r: [['🦖', 'T-Rex'], ['🦕', 'Uzun boyunlu dinozor'], ['🐉', 'Ejderha'], ['🦄', 'Tek boynuzlu at'], ['🧜', 'Deniz kızı'], ['👾', 'Uzaylı'], ['🧙', 'Büyücü'], ['🧞', 'Cin']] },
        { id: 'tasit', ad: 'Taşıtlar', ikon: '🚀', r: [['🚀', 'Roket'], ['🚁', 'Helikopter'], ['🚂', 'Tren'], ['🚜', 'Traktör'], ['⛵', 'Yelkenli'], ['🚒', 'İtfaiye'], ['🚲', 'Bisiklet'], ['🛸', 'Uçan daire']] },
        { id: 'yemek', ad: 'Yiyecekler', ikon: '🍕', r: [['🍕', 'Pizza'], ['🍉', 'Karpuz'], ['🍦', 'Dondurma'], ['🍔', 'Hamburger'], ['🍩', 'Donut'], ['🍓', 'Çilek'], ['🌽', 'Mısır'], ['🍌', 'Muz']] },
        { id: 'yer', ad: 'Ünlü Yerler', ikon: '🏰', r: [['🏰', 'Kale'], ['🗽', 'Özgürlük Heykeli'], ['🌋', 'Yanardağ'], ['🎡', 'Dönme dolap'], ['🏝️', 'Ada'], ['🗼', 'Kule'], ['⛺', 'Çadır'], ['🌈', 'Gökkuşağı']] },
        { id: 'spor', ad: 'Spor', ikon: '🏆', r: [['⚽', 'Futbol topu'], ['🏹', 'Yay ve ok'], ['🏆', 'Kupa'], ['🥊', 'Boks eldiveni'], ['🛹', 'Kaykay'], ['🏀', 'Basketbol topu'], ['🎳', 'Bowling'], ['🥇', 'Altın madalya']] }
    ];
    const RESIM_SAY = 6; // albüm başına oynanan resim
    const ROZET = { acti: ['🖼️', 'Kare Açan'], altin: ['⭐', 'Kartal Göz'], uclu: ['🎯', 'Üçü de İyi'], gelisen: ['📈', 'Gelişen'] };
    const RUTBE = [[0, '🐣', 'Çırak'], [1, '🖍️', 'Boyacı'], [6, '🎨', 'Ressam'], [15, '🖼️', 'Usta Ressam'], [30, '👑', 'Sanat Dâhisi']];
    function albumBul(id) { return ALBUMLER.find((a) => a.id === id) || ALBUMLER[0]; }

    /* ---------- KALICI ---------- */
    let _kal = null, _kalHam = null, _kalKonum = null;
    function kalAnahtar() { return 'dag_km_rsmkalici_' + konum(); }
    function kal() {
        if (_kalKonum !== konum()) { _kal = null; _kalHam = null; _kalKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(kalAnahtar()); } catch (e) { }
        if (ham !== _kalHam) { _kalHam = ham; try { _kal = ham ? JSON.parse(ham) : null; } catch (e) { _kal = null; } }
        if (!_kal || typeof _kal !== 'object') _kal = { album: ALBUMLER[0].id, sira: null, oynanan: [], yildiz: {}, acilan: {}, rozet: {}, biten: [] };
        ['yildiz', 'acilan', 'rozet'].forEach((k) => { _kal[k] = _kal[k] || {}; }); _kal.oynanan = _kal.oynanan || []; _kal.biten = _kal.biten || [];
        if (!_kal.sira) { const A = albumBul(_kal.album); _kal.sira = karistir(A.r.map((_, i) => i)).slice(0, RESIM_SAY); }
        return _kal;
    }
    function kalKaydet() { try { _kalHam = JSON.stringify(_kal); localStorage.setItem(kalAnahtar(), _kalHam); } catch (e) { } }
    function resimId(albumId, idx) { return albumId + ':' + idx; }

    /* ---------- DURUM ---------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_resimavi_' + konum(); }
    function bosDurum(zor) { const st = { tarih: bugun(), zor: zor || 'normal', faz: 'basla', hepAtan: [], toplamOk: 0, katki: {}, sonTop: {} }; resimKur(st); return st; }
    // Albümün sıradaki (oynanmamış) resmi
    function resimKur(st) {
        const Kl = kal(), A = albumBul(Kl.album), Z = DZ[st.zor] || DZ.normal;
        const sira = Kl.sira, oyn = Kl.oynanan, idx = sira.find((i) => oyn.indexOf(resimId(A.id, i)) === -1);
        st.album = A.id; st.ri = idx != null ? idx : sira[0]; st.no = Math.min(RESIM_SAY, oyn.length + 1);
        st.N = Z.N; st.esik = st.esikEl || Z.esik; st.kare = Array(Z.N * Z.N).fill(0); st.can = 3; st.elenen = [];
        const dogru = A.r[st.ri][1], diger = karistir(ALBUMLER.flatMap((a) => a.r.map((x) => x[1])).filter((x) => x !== dogru && A.r.some((y) => y[1] === x))).slice(0, Z.sik - 1);
        while (diger.length < Z.sik - 1) { const x = sec(ALBUMLER.flatMap((a) => a.r.map((y) => y[1]))); if (x !== dogru && diger.indexOf(x) === -1) diger.push(x); }
        st.secenek = karistir([dogru].concat(diger)); st.seri = 0; st.turAtan = []; st.turRozet = {}; st.yildiz = null; st.sonuc = null; st.son = [];
        st.zoom = Z.zoom ? { s: 1.75, x: Math.round((Math.random() - .5) * 30), y: Math.round((Math.random() - .5) * 30) } : null;
    }
    function durum() {
        if (_stKonum !== konum()) { _st = null; _stHam = null; _stKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (ham !== _stHam) { _stHam = ham; try { _st = ham ? JSON.parse(ham) : null; } catch (e) { _st = null; } }
        if (!_st || _st.tarih !== bugun() || !_st.kare || !_st.secenek) { _st = bosDurum(_st && _st.zor); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function acikSay(st) { return st.kare.filter(Boolean).length; }
    function yildizHesap(st) { const kapali = 1 - acikSay(st) / st.kare.length; return kapali >= .5 ? 3 : kapali >= .25 ? 2 : 1; }

    /* ---------- KARE SEÇİMİ (okun yönü) ---------- */
    // ok.x/ok.y: hedef SVG koordinatı (merkez 0,0; y aşağı). Sarı (9-10) → orta, kırmızı (7-8) → orta halka, diğerleri → kenar.
    function kareSec(st, ok) {
        const N = st.N, m = (N - 1) / 2, kapali = st.kare.map((v, i) => v ? -1 : i).filter((i) => i >= 0); if (!kapali.length) return -1;
        let tx, ty;
        const rr = ok.p >= 9 ? .1 : ok.p >= 7 ? .55 : 1;
        if (ok.x != null && ok.y != null && (ok.x || ok.y)) { const a = Math.atan2(ok.y, ok.x); tx = m + Math.cos(a) * rr * m * 1.3; ty = m + Math.sin(a) * rr * m * 1.3; }
        else { const a = Math.random() * Math.PI * 2; tx = m + Math.cos(a) * rr * m * 1.3; ty = m + Math.sin(a) * rr * m * 1.3; }
        let en = Infinity, sec2 = [];
        kapali.forEach((i) => { const d = Math.hypot(i % N - tx, Math.floor(i / N) - ty); if (d < en - .01) { en = d; sec2 = [i]; } else if (Math.abs(d - en) <= .01) sec2.push(i); });
        return sec(sec2);
    }
    function komsular(st, i) { const N = st.N, x = i % N, y = Math.floor(i / N), r = []; [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].forEach((d) => { const a = x + d[0], b = y + d[1]; if (a >= 0 && b >= 0 && a < N && b < N && !st.kare[b * N + a]) r.push(b * N + a); }); return r; }

    /* ---------- SAHNE ---------- */
    let _kok = null, _olcek = 1, _perdeFaz = null, _zaman = [], _ro = null;
    function panel() { return $('km-oyun-panel-resimavi'); }
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    const bekle = (ms) => new Promise((r) => sonra(r, ms));
    function rsmSahneKur(p) {
        p = p || panel(); if (!p) return; css(); K.css(); _zaman.forEach(clearTimeout); _zaman = []; _perdeFaz = null;
        p.innerHTML = `<div class="rsm-kap" id="rsm-kap"><div class="rsm-sahne" id="rsm-sahne">
            <div class="rsm-ust" id="rsm-ust"></div>
            <div class="rsm-hud"><button class="rsm-btn" id="rsm-zor-btn" title="Zorluk">⚙️</button><button class="rsm-btn" id="rsm-ses-btn" title="Ses">🔊</button><button class="rsm-btn" id="rsm-nasil-btn" title="Nasıl oynanır?">❓</button><button class="rsm-btn" id="rsm-yeni-btn" title="Bu resmi atla">⏭</button></div>
            <div class="rsm-kim" id="rsm-kim" hidden></div>
            <div class="rsm-yer" id="rsm-yer"></div>
            <div class="rsm-resim" id="rsm-resim"><div class="rsm-emoji" id="rsm-emoji"></div><div class="rsm-kareler" id="rsm-kareler"></div><div class="rsm-ok" id="rsm-ok" hidden>➶</div></div>
            <div class="rsm-sik" id="rsm-sik"></div>
            <div class="rsm-simdi" id="rsm-simdi"></div>
            <div class="kk-pop rsm-pop" id="rsm-pop" hidden></div>
            <div class="rsm-fx" id="rsm-fx"></div>
          </div><div class="rsm-perde" id="rsm-perde" hidden></div></div>`;
        _kok = $('rsm-sahne');
        try { if (_ro) _ro.disconnect(); _ro = new ResizeObserver(boyutla); _ro.observe($('rsm-kap')); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        $('rsm-zor-btn').onclick = zorlukAc; $('rsm-nasil-btn').onclick = nasil; $('rsm-yeni-btn').onclick = atlaSor;
        $('rsm-ses-btn').onclick = () => { try { localStorage.setItem('dag_rsm_ses', sesAcik() ? '0' : '1'); } catch (e) { } ses('sec'); ciz(); };
        clearInterval(rsmSahneKur._iv); rsmSahneKur._iv = setInterval(() => { if (!$('rsm-sahne')) { clearInterval(rsmSahneKur._iv); return; } kimCiz(); }, 400);
        rsmGuncelle(true);
    }
    function boyutla() {
        const k = $('rsm-kap'), s = $('rsm-sahne'); if (!k || !s) return; const r = k.getBoundingClientRect(); if (!r.width) return;
        _olcek = Math.min(r.width / W, r.height / H);
        s.style.width = (W * _olcek) + 'px'; s.style.height = (H * _olcek) + 'px'; s.style.fontSize = (10 * _olcek) + 'px';
        s.style.left = ((r.width - W * _olcek) / 2) + 'px'; s.style.top = ((r.height - H * _olcek) / 2) + 'px';
    }
    function rsmGuncelle(zorla) { if (!panel() || !$('rsm-sahne')) return; const st = durum(); ciz(zorla); if (st.faz !== _perdeFaz || zorla) perdeCiz(st); }
    function kimCiz(zorla) {
        const st = _st || durum();
        K.kim($('rsm-kim'), { goster: st.faz === 'oyun', zorla, tema: 'resimavi', alt: (s) => { const r = K.rutbe(kal().acilan[s.g + '|' + s.ad] || 0, RUTBE); return r[1] + ' ' + r[2]; }, rozet: (s) => ((st.turRozet || {})[s.g + '|' + s.ad] || []).map((id) => ROZET[id][0]).join(''), secAc: secAc, sonra: () => ciz() });
    }
    function ciz(zorla) {
        const st = durum(), A = albumBul(st.album), Z = DZ[st.zor] || DZ.normal, Kl = kal(), r = A.r[st.ri];
        // üst şerit: albüm, 6 resim noktası (yıldızlarıyla), canlar, şimdi bilinirse kaç yıldız
        const noktalar = Kl.sira.map((i) => { const y = Kl.yildiz[resimId(A.id, i)]; return '<span class="' + (i === st.ri ? 'su' : y != null ? 'bitti' : '') + '">' + (y != null ? (y ? '⭐'.repeat(y) : '💨') : i === st.ri ? '🖼️' : '·') + '</span>'; }).join('');
        $('rsm-ust').innerHTML = '<div class="rsm-al"><small>ALBÜM · ' + A.ikon + ' ' + K.kacis(A.ad.toLocaleUpperCase('tr-TR')) + '</small><b>RESİM ' + st.no + '/' + RESIM_SAY + '</b></div><div class="rsm-noktalar">' + noktalar + '</div>'
            + '<div class="rsm-can"><small>CAN</small><b>' + '❤️'.repeat(st.can) + '<i>' + '🤍'.repeat(3 - st.can) + '</i></b></div>'
            + '<div class="rsm-yildiz"><small>ŞİMDİ BİLİRSENİZ</small><b>' + '⭐'.repeat(yildizHesap(st)) + '</b></div><div class="rsm-zor">' + Z.ad.toUpperCase() + '</div>';
        $('rsm-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
        // resim + kareler
        const em = $('rsm-emoji'); em.textContent = r[0]; em.style.transform = st.zoom && st.faz === 'oyun' ? 'scale(' + st.zoom.s + ') translate(' + st.zoom.x + '%,' + st.zoom.y + '%)' : '';
        const kr = $('rsm-kareler'); kr.style.gridTemplateColumns = 'repeat(' + st.N + ',1fr)';
        if (kr.children.length !== st.kare.length || zorla) { kr.innerHTML = st.kare.map((_, i) => '<div class="rsm-k" data-i="' + i + '"><span>' + (i + 1) + '</span></div>').join(''); }
        [...kr.children].forEach((d, i) => { d.classList.toggle('acik', !!st.kare[i] || st.faz === 'bildi' || st.faz === 'kacti'); });
        // şıklar
        const sk = $('rsm-sik'), kapali = st.faz !== 'oyun';
        sk.innerHTML = '<div class="rsm-sik-bas">🤔 Ne olabilir?<small>Sınıf söylesin, koç dokunsun</small></div>' + st.secenek.map((s, i) => { const el = st.elenen.indexOf(s) !== -1, dg = st.faz === 'bildi' && s === r[1]; return '<button type="button" data-s="' + i + '" class="' + (el ? 'elendi' : '') + (dg ? ' dogru' : '') + '"' + (el || kapali ? ' disabled' : '') + '>' + (el ? '✗ ' : '') + K.kacis(s) + '</button>'; }).join('');
        sk.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => tahmin(st.secenek[+b.dataset.s]));
        // okun yeri (son serinin okları) — çocuk "nereye vurdum, hangi kare açıldı" görsün
        const son = st.son || [];
        $('rsm-yer').innerHTML = '<div class="rsm-yer-bas">🎯 Okun yeri = açılan kare</div><svg viewBox="-110 -110 220 220">' + [[100, '#f4f6fb'], [80, '#20242e'], [60, '#3fa7ff'], [40, '#ff4d5e'], [20, '#ffd23f']].map((x) => '<circle r="' + x[0] + '" fill="' + x[1] + '"/>').join('')
            + '<line x1="-104" y1="0" x2="104" y2="0" stroke="#fff" stroke-opacity=".35" stroke-dasharray="5 5"/><line x1="0" y1="-104" x2="0" y2="104" stroke="#fff" stroke-opacity=".35" stroke-dasharray="5 5"/>'
            + son.filter((o) => o.x != null).map((o, k) => '<circle cx="' + o.x.toFixed(1) + '" cy="' + o.y.toFixed(1) + '" r="11" fill="#5ee39b" stroke="#0b2a1c" stroke-width="3"/><text x="' + o.x.toFixed(1) + '" y="' + (o.y + 4).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#0b2a1c">' + (k + 1) + '</text>').join('') + '</svg>'
            + '<small>' + (son.some((o) => o.x != null) ? 'Sağ üste vuran → sağ üst kare' : 'Hedefe dokunarak girilirse okun yönündeki kare açılır') + '</small>';
        // şimdi cümlesi
        const s = aktif();
        $('rsm-simdi').innerHTML = st.faz === 'oyun' ? (s ? '🏹 <b>' + K.kacis(K.ilkAd(s.ad).toLocaleUpperCase('tr-TR')) + '</b> atıyor · ' : '') + 'İyi ok (' + st.esik + '+) bir kare açar · Bilen olursa şıkka dokun' : '';
        kimCiz(zorla);
    }
    function fx(metin, renk, x, y) { const f = $('rsm-fx'); if (!f) return; const d = document.createElement('div'); d.className = 'rsm-fxy'; d.textContent = metin; d.style.color = renk || '#ffd34a'; d.style.left = x + 'em'; d.style.top = y + 'em'; f.appendChild(d); setTimeout(() => d.remove(), 1600); }
    function kareMerkez(st, i) { const N = st.N, b = 47 / N; return { x: 53 + (i % N + .5) * b, y: 9.4 + (Math.floor(i / N) + .5) * b }; }
    function okUcur(st, i) {
        return new Promise((res) => {
            const o = $('rsm-ok'); if (!o) return res(); const m = i >= 0 ? kareMerkez(st, i) : { x: 76.5 + (Math.random() - .5) * 30, y: 60 };
            o.hidden = false; o.style.transition = 'none'; o.style.left = '76.5em'; o.style.top = '70em'; o.style.opacity = '1'; void o.offsetWidth;
            o.style.transition = 'left .5s cubic-bezier(.3,.7,.4,1), top .5s cubic-bezier(.3,.7,.4,1)'; o.style.left = (m.x - 53) + 'em'; o.style.top = (m.y - 9.4) + 'em';
            sonra(() => { o.hidden = true; res(); }, 520);
        });
    }

    /* ---------- PERDELER ---------- */
    function perde(html, bag) { const p = $('rsm-perde'); if (!p) return; p.innerHTML = '<div class="rsm-kart">' + html + '</div>'; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('rsm-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(aktifZ) { return '<p><b>Zorluk seç:</b></p><div class="rsm-zorsec">' + Object.keys(DZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === aktifZ ? 'on' : '') + '"><span class="n">' + DZ[k].ad + '</span><span class="d">' + DZ[k].d + '</span></button>').join('') + '</div>'; }
    function adlarHTML(l) { return '<div class="rsm-adlar">' + l.slice().sort((a, b) => String(a).localeCompare(String(b), 'tr')).map((a) => '<span>' + K.kacis(K.ilkAd(a)) + '</span>').join('') + '</div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const A = albumBul(st.album), r = A.r[st.ri], Kl = kal();
        if (st.faz === 'oyun') { perdeKapat(); return; }
        if (st.faz === 'basla') {
            perde('<span class="rsm-etiket">' + A.ikon + ' ' + K.kacis(A.ad) + ' albümü · Resim ' + st.no + '/' + RESIM_SAY + '</span><h2>Gizli resim ne?' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</h2><p>İyi atılan her ok bir kare açar. <b>Okun hedefte gittiği yön, resmin o köşesi!</b> Sarıya giden ortayı açar. Ne olduğunu bilen parmak kaldırsın, koç şıkka dokunsun. Ne kadar az kareyle bilirseniz o kadar çok ⭐. 3 yanlış tahminde resim kaybolur.</p>'
                + (st.no === 1 ? zorSecHTML(st.zor) : '') + '<div class="rsm-butonlar"><button class="rsm-b" id="rsm-bas">🖼️ Başla</button></div><p class="rsm-not">İlk seri girilince kendiliğinden başlar.</p>', (p) => {
                    p.querySelector('#rsm-bas').onclick = () => { const s = durum(); s.faz = 'oyun'; kaydet(); ses('sec'); rsmGuncelle(); };
                    p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
                });
        } else if (st.faz === 'bildi' || st.faz === 'kacti') {
            const bildi = st.faz === 'bildi', son = Kl.oynanan.length >= RESIM_SAY;
            perde('<div class="rsm-buyuk">' + r[0] + '</div><span class="rsm-etiket">' + (bildi ? 'BİLDİNİZ!' : 'Resim kayboldu') + '</span><h2>' + K.kacis(r[1]) + '</h2>'
                + (bildi ? '<p class="rsm-yildizlar">' + '⭐'.repeat(st.yildiz) + '<span>' + '☆'.repeat(3 - st.yildiz) + '</span></p><p>' + acikSay(st) + '/' + st.kare.length + ' kare açıkken bildiniz!</p>' : '<p>3 yanlış tahmin… Bu resimden yıldız yok, sıradakinde daha dikkatli!</p>')
                + '<p>Bu resmin okçuları:</p>' + adlarHTML(st.turAtan) + '<div class="rsm-butonlar"><button class="rsm-b" id="rsm-dev">' + (son ? '📒 Albümü gör →' : '🖼️ Sıradaki resim →') + '</button></div>', (p) => {
                    p.querySelector('#rsm-dev').onclick = () => { ileri(durum()); kaydet(); rsmGuncelle(true); };
                });
        } else if (st.faz === 'album') {
            const oz = st.albumOzet || { id: A.id, sira: [], yildiz: [] }, A2 = albumBul(oz.id), top = oz.yildiz.reduce((a, b) => a + b, 0), sonraki = albumBul(Kl.album);
            perde('<span class="rsm-etiket">ALBÜM TAMAM</span><h2>' + A2.ikon + ' ' + K.kacis(A2.ad) + '</h2><div class="rsm-album">' + oz.sira.map((i, k) => '<div><span>' + A2.r[i][0] + '</span><b>' + K.kacis(A2.r[i][1]) + '</b><i>' + ('⭐'.repeat(oz.yildiz[k]) || '💨') + '</i></div>').join('') + '</div><p>Toplam <b>' + top + '/' + (RESIM_SAY * 3) + '</b> yıldız · Sıradaki albüm: ' + sonraki.ikon + ' ' + K.kacis(sonraki.ad) + '</p><p>Bu albümün okçuları:</p>' + adlarHTML(st.hepAtan)
                + '<div class="rsm-butonlar"><button class="rsm-b" id="rsm-dev">' + sonraki.ikon + ' Yeni albüm →</button></div>', (p) => {
                    p.querySelector('#rsm-dev').onclick = () => { const s = durum(); resimKur(s); s.faz = 'basla'; kaydet(); rsmGuncelle(true); };
                });
        }
    }
    // resim bitti → sıradaki resim ya da albüm sonu (yeni albüm sırası hazırlanır)
    function ileri(st) {
        const Kl = kal();
        if (st.faz === 'album') { resimKur(st); st.faz = 'basla'; return; }
        if (Kl.oynanan.length >= RESIM_SAY) { albumBitir(st); return; }
        resimKur(st); st.faz = 'basla';
    }
    function albumBitir(st) {
        const Kl = kal(), i = ALBUMLER.findIndex((a) => a.id === Kl.album); Kl.biten.push(Kl.album);
        st.albumOzet = { id: Kl.album, sira: Kl.sira.slice(), yildiz: Kl.sira.map((k) => Kl.yildiz[resimId(Kl.album, k)] || 0) };
        const yeniA = ALBUMLER[(i + 1) % ALBUMLER.length]; Kl.album = yeniA.id; Kl.sira = karistir(yeniA.r.map((_, k) => k)).slice(0, RESIM_SAY); Kl.oynanan = []; kalKaydet();
        st.faz = 'album'; st.album = ALBUMLER[i].id; // perde eski albümü gösterir

    }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esikEl = 0; resimKur(st); st.faz = 'basla'; kaydet(); ses('sec'); _perdeFaz = null; rsmGuncelle(true); }
    function zorlukAc() {
        const st = durum();
        perde('<h2>⚙️ Zorluk</h2><p>Değiştirirsen bu resim baştan başlar.</p>' + zorSecHTML(st.zor) + '<p><b>Kare açmak için gereken puan:</b></p><div class="rsm-esik">' + [5, 6, 7, 8].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="rsm-butonlar"><button class="rsm-b ikincil" id="rsm-kapat">Kapat</button></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; s.esikEl = s.esik; kaydet(); ses('sec'); zorlukAc(); ciz(); });
            p.querySelector('#rsm-kapat').onclick = () => { _perdeFaz = null; rsmGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        perde('<h2>🖼️ Nasıl oynanır?</h2><p class="rsm-sol">📣 <b>Koç söyler:</b> "Okun gittiği yer açılır. Ne olduğunu bilen parmak kaldırsın!"<br>🏹 Eşiği geçen ok bir kare açar: okun hedefte gittiği yön resmin o köşesi, sarı ortası. <b>10/X</b> üç kare açar.<br>🤔 Sınıf tahmin eder, koç şıkka dokunur. Doğruysa: kareler ne kadar kapalıysa o kadar ⭐. Yanlışsa bir can gider (3 can).<br>🖋️ Normal ve Zor\'da mürekkep lekesi açılmış bir kareyi yeniden kapatır.<br>📒 6 resim = bir albüm; yıldızlar sonraki derslere kalır.<br>🏅 Rozetler: kare açan, 10/X, üçü de iyi, önceki serisinden iyi.</p><div class="rsm-butonlar"><button class="rsm-b" id="rsm-tamam">Tamam</button></div>', (p) => { p.querySelector('#rsm-tamam').onclick = () => { _perdeFaz = null; rsmGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    function atlaSor() {
        perde('<h2>⏭ Bu resim atlansın mı?</h2><p>Resim albümden çıkar, yıldızı olmaz.</p><div class="rsm-butonlar"><button class="rsm-b kirmizi" id="rsm-evet">Evet, atla</button><button class="rsm-b ikincil" id="rsm-hayir">Vazgeç</button></div>', (p) => {
            p.querySelector('#rsm-evet').onclick = () => { const s = durum(); bitir(s, false); kaydet(); _perdeFaz = null; rsmGuncelle(true); };
            p.querySelector('#rsm-hayir').onclick = () => { _perdeFaz = null; rsmGuncelle(); };
        });
        _perdeFaz = 'atla';
    }
    function secAc() {
        const st = durum();
        perde(K.secHTML((s) => (st.turAtan || []).indexOf(s.ad) !== -1, (s) => K.rutbe(kal().acilan[s.g + '|' + s.ad] || 0, RUTBE)[1], 'resimavi') + '<div class="rsm-butonlar"><button class="rsm-b ikincil" id="rsm-kapat">Kapat</button></div>', (p) => {
            K.secBagla(p, () => { ses('sec'); _perdeFaz = null; rsmGuncelle(); kimCiz(true); });
            p.querySelector('#rsm-kapat').onclick = () => { _perdeFaz = null; rsmGuncelle(); };
        });
        _perdeFaz = 'sec';
    }

    /* ---------- TAHMİN ---------- */
    function bitir(st, bildi) {
        const Kl = kal(), id = resimId(st.album, st.ri);
        st.yildiz = bildi ? yildizHesap(st) : 0; st.faz = bildi ? 'bildi' : 'kacti';
        Kl.yildiz[id] = Math.max(Kl.yildiz[id] || 0, st.yildiz); if (Kl.oynanan.indexOf(id) === -1) Kl.oynanan.push(id); kalKaydet();
    }
    function tahmin(s) {
        const st = durum(); if (st.faz !== 'oyun') return; const A = albumBul(st.album), dogru = A.r[st.ri][1];
        if (s === dogru) { bitir(st, true); kaydet(); ses('dogru'); ciz(true); fx('BİLDİNİZ! ' + '⭐'.repeat(st.yildiz), '#ffd34a', 76.5, 30); sonra(() => rsmGuncelle(), 1800); }
        else { st.elenen.push(s); st.can--; ses('yanlis'); const r = $('rsm-resim'); if (r) { r.classList.remove('salla'); void r.offsetWidth; r.classList.add('salla'); } fx('Yanlış! ❤️ −1', '#ff8a7a', 76.5, 30);
            if (st.can <= 0) { bitir(st, false); kaydet(); ciz(true); sonra(() => rsmGuncelle(), 1800); } else { kaydet(); ciz(); } }
    }

    /* ---------- ROZET ---------- */
    function rozetVer(S, s, id) {
        const key = s.g + '|' + s.ad; S.turRozet = S.turRozet || {}; const v = S.turRozet[key] = S.turRozet[key] || []; if (v.indexOf(id) !== -1) return; v.push(id);
        const Kl = kal(), r = Kl.rozet[key] = Kl.rozet[key] || {}; r[id] = (r[id] || 0) + 1; kalKaydet();
        K.pop($('rsm-pop'), s, ROZET[id][0] + ' ' + ROZET[id][1].toLocaleUpperCase('tr-TR') + ' rozeti!');
    }
    function acilanSay(s) { const key = s.g + '|' + s.ad, Kl = kal(), once = K.rutbe(Kl.acilan[key] || 0, RUTBE); Kl.acilan[key] = (Kl.acilan[key] || 0) + 1; kalKaydet(); const yeniR = K.rutbe(Kl.acilan[key], RUTBE); if (yeniR !== once) K.pop($('rsm-pop'), s, yeniR[1] + ' artık ' + yeniR[2].toLocaleUpperCase('tr-TR') + '!', true); }

    /* ---------- SERİ ---------- */
    function rsmSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitirD = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        let st = durum();
        if (st.faz === 'bildi' || st.faz === 'kacti' || st.faz === 'album') ileri(st);
        if (st.faz === 'album') { resimKur(st); st.faz = 'basla'; }
        const S = durum(); S.faz = 'oyun'; _perdeFaz = null; perdeKapat();
        const key = s.g + '|' + s.ad, oklar = (kaydedilecek || []).map((k) => ({ p: okDeger(k.puan), x: k.x != null ? +k.x : null, y: k.y != null ? +k.y : null, tip: k.tip }));
        // SVG konumunu −100..100'e ölçekle (hedef yarıçapına göre); bilinmiyorsa yalnız yön kullanılır
        oklar.forEach((o) => { if (o.x == null) return; o.gx = o.x; o.gy = o.y; }); // hedef SVG'si: merkez 0,0, dış halka yarıçapı 100
        if (S.turAtan.indexOf(s.ad) === -1) S.turAtan.push(s.ad); if (S.hepAtan.indexOf(s.ad) === -1) S.hepAtan.push(s.ad); S.toplamOk += oklar.length;
        S.son = oklar.map((o) => ({ x: o.gx != null ? Math.max(-104, Math.min(104, o.gx)) : null, y: o.gy != null ? Math.max(-104, Math.min(104, o.gy)) : null }));
        const top = oklar.reduce((a, o) => a + o.p, 0); S.sonTop = S.sonTop || {};
        if (oklar.some((o) => o.p === 10)) rozetVer(S, s, 'altin');
        if (oklar.length >= 3 && oklar.every((o) => o.p >= S.esik)) rozetVer(S, s, 'uclu');
        if (S.sonTop[key] != null && top >= S.sonTop[key] + 3) rozetVer(S, s, 'gelisen');
        S.sonTop[key] = top; kaydet(); ciz();
        const gorsel = !!($('rsm-sahne') && $('rsm-sahne').offsetParent !== null);
        (async () => {
            for (const o of oklar) {
                if (S.faz !== 'oyun') break;
                const iyi = o.p >= S.esik, k = iyi ? kareSec(S, o) : -1;
                if (gorsel) { ses('cek'); await okUcur(S, k); }
                if (iyi && k >= 0) {
                    const acilan = [k].concat(o.p === 10 ? karistir(komsular(S, k)).slice(0, 2) : []);
                    acilan.forEach((j) => { S.kare[j] = 1; }); S.katki[key] = (S.katki[key] || 0) + acilan.length;
                    rozetVer(S, s, 'acti'); acilanSay(s);
                    if (gorsel) { ses('ac'); const m = kareMerkez(S, k); fx(o.p === 10 ? '⭐ ÜÇ KARE!' : '+1 KARE', '#ffd34a', m.x, m.y - 3); }
                } else if (gorsel) fx(iyi ? 'Hepsi açık!' : o.p === 0 ? 'ISKA' : o.p + ' — ' + S.esik + '+ lazım', '#e8d8c0', 76.5, 52);
                if (!iyi && gorsel) ses('iska');
                kaydet(); if (gorsel) ciz();
                if (gorsel) await bekle(160);
            }
            S.seri++;
            // 🖋️ mürekkep lekesi: açılmış bir kareyi kapatır (Normal 3, Zor 2 seride bir; en az 3 açık kare varken)
            const Z = DZ[S.zor] || DZ.normal;
            if (S.faz === 'oyun' && Z.murekkep && S.seri % Z.murekkep === 0 && acikSay(S) >= 3) {
                const acik = S.kare.map((v, j) => v ? j : -1).filter((j) => j >= 0), j = sec(acik); S.kare[j] = 0;
                if (gorsel) { ses('murekkep'); const m = kareMerkez(S, j); fx('🖋️ MÜREKKEP!', '#9ab8ff', m.x, m.y - 3); const d = $('rsm-kareler') && $('rsm-kareler').children[j]; if (d) { d.classList.add('leke'); sonra(() => d.classList.remove('leke'), 1600); } }
            }
            if (S.faz === 'oyun' && acikSay(S) === S.kare.length && gorsel) fx('Bütün kareler açık! Ne olduğunu söyleyin!', '#ffd34a', 76.5, 30);
            kaydet(); ciz(); bitirD();
        })().catch(() => bitirD());
        setTimeout(bitirD, 6000);
    }
    function rsmAnlik() { const a = JSON.parse(JSON.stringify(durum())); a._kal = JSON.parse(JSON.stringify(kal())); return a; }
    function rsmGeriYukle(k) { if (!k) return; _zaman.forEach(clearTimeout); _zaman = []; k = JSON.parse(JSON.stringify(k)); if (k._kal) { _kal = k._kal; _kalKonum = konum(); kalKaydet(); delete k._kal; } _st = k; _stKonum = konum(); kaydet(); _perdeFaz = null; if (panel()) rsmGuncelle(true); }
    function rsmSporcu(g, ad) { const st = durum(), n = st.katki[g + '|' + ad] || 0; return n ? '🖼️' + n : '-'; }

    /* ---------- STİL ---------- */
    function css() {
        if ($('rsm-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'rsm-css';
        st.textContent = `
.km-oyun-panel-resimavi{padding:0;background:#0d1322;overflow:hidden}
.rsm-kap{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 60% 40%,#1c2a4a,#0b1020 70%)}
.rsm-sahne{position:absolute;color:#eef3ff;font-family:Nunito,system-ui,sans-serif}
.rsm-ust{position:absolute;left:0;top:0;width:128em;height:7.4em;background:rgba(6,8,14,.92);border-bottom:.3em solid #ffc94a;display:flex;align-items:center;gap:2.4em;padding:0 2.4em}
.rsm-ust small{display:block;font-size:1.5em;font-weight:900;letter-spacing:.1em;color:#ffc94a}.rsm-ust b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:3em;line-height:1.05;white-space:nowrap}
.rsm-noktalar{display:flex;gap:.5em}.rsm-noktalar span{min-width:3.4em;height:3.4em;border-radius:.8em;background:rgba(255,255,255,.08);display:grid;place-items:center;font-size:1.4em;padding:0 .3em}
.rsm-noktalar span.su{background:#ffc94a33;outline:.15em solid #ffc94a}.rsm-noktalar span.bitti{background:rgba(94,227,155,.15)}
.rsm-can b i{font-style:normal;opacity:.5}.rsm-can b,.rsm-yildiz b{font-size:2.6em}
.rsm-zor{font-family:"Lilita One","Baloo 2",sans-serif;font-size:2.2em;color:#ffd98a}
.rsm-hud{position:absolute;right:1em;top:1.6em;display:flex;gap:.6em;z-index:3}
.rsm-btn{background:rgba(10,12,24,.85);border:1px solid #3b4680;color:#fff;border-radius:99px;min-width:3.6em;height:3.6em;font-size:1.6em;cursor:pointer;font-weight:900;display:grid;place-items:center;padding:0}
.rsm-kim{position:absolute;left:1.4em;top:8.6em;width:48em;z-index:3}.rsm-kim[hidden]{display:none}
.rsm-yer{position:absolute;left:1.4em;top:26em;width:24em;background:rgba(255,255,255,.04);border:1px solid #2e3a58;border-radius:1.6em;padding:1em;display:flex;flex-direction:column;align-items:center;gap:.5em}
.rsm-yer svg{width:15em;height:15em}.rsm-yer-bas{font-weight:900;font-size:1.6em;color:#ffe2a0}.rsm-yer small{font-size:1.3em;color:#9aa6c2;font-weight:800;text-align:center}
.rsm-resim{position:absolute;left:53em;top:9.4em;width:47em;height:47em;border-radius:1.4em;overflow:hidden;background:linear-gradient(160deg,#fffaf0,#f0e6cf);box-shadow:0 0 0 .5em #c8a050,0 2em 4em rgba(0,0,0,.6)}
.rsm-resim.salla{animation:rsmSalla .5s}
@keyframes rsmSalla{20%{transform:translateX(-1.2em)}40%{transform:translateX(1.2em)}60%{transform:translateX(-.8em)}80%{transform:translateX(.6em)}}
.rsm-emoji{position:absolute;inset:0;display:grid;place-items:center;font-size:34em;line-height:1;transition:transform .8s ease}
.rsm-kareler{position:absolute;inset:0;display:grid;gap:0;perspective:60em}
.rsm-k{border-radius:.5em;background:repeating-linear-gradient(45deg,#2a3a6a 0 1.2em,#24335e 1.2em 2.4em);border:.2em solid #3d4f86;display:grid;place-items:center;transition:transform .5s ease,opacity .5s ease;transform-origin:center}
.rsm-k span{font-family:"Lilita One","Baloo 2",sans-serif;font-size:2.2em;color:rgba(255,255,255,.25)}
.rsm-k.acik{transform:rotateY(90deg) scale(.6);opacity:0}
.rsm-k.leke{background:radial-gradient(circle,#1a2a6a 40%,#0a1030 70%);animation:rsmLeke 1.5s}
@keyframes rsmLeke{0%{transform:scale(.2);opacity:0}30%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
.rsm-ok{position:absolute;font-size:5em;color:#ffd34a;text-shadow:0 0 .3em #000;transform:translate(-50%,-50%) rotate(-45deg);z-index:4;pointer-events:none}
.rsm-sik{position:absolute;left:101.6em;top:9.4em;width:23em;display:flex;flex-direction:column;gap:.9em}
.rsm-sik-bas{font-family:"Lilita One","Baloo 2",sans-serif;font-size:2.4em;line-height:1.1;color:#ffe2a0}.rsm-sik-bas small{display:block;font-family:Nunito,system-ui,sans-serif;font-size:.55em;font-weight:800;color:#9aa6c2}
.rsm-sik button{cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:2.4em;line-height:1.1;padding:.55em .5em;border-radius:.6em;border:.12em solid #ffc94a;background:linear-gradient(180deg,#ffd76a,#f0b42a);color:#2a1708;box-shadow:0 .2em 0 #a8742c;text-align:center}
.rsm-sik button:hover:not(:disabled){filter:brightness(1.08)}.rsm-sik button:disabled{cursor:default}
.rsm-sik button.elendi{background:#3a2a2a;color:#b88;border-color:#6a3a3a;box-shadow:none;text-decoration:line-through}
.rsm-sik button.dogru{background:linear-gradient(180deg,#7cf2b4,#3fbf6a);border-color:#3fbf6a}
.rsm-simdi{position:absolute;left:53em;top:59em;width:72em;min-height:4.8em;background:rgba(10,12,24,.88);border-radius:1.4em;display:flex;align-items:center;justify-content:center;font-family:"Lilita One","Baloo 2",sans-serif;font-size:2.4em;text-align:center;padding:.2em .8em}
.rsm-simdi:empty{display:none}.rsm-simdi b{color:#ffd34a;font-weight:400}
.rsm-pop{left:53em;top:10em;width:47em}
.rsm-fx{position:absolute;inset:0;pointer-events:none;z-index:5}
.rsm-fxy{position:absolute;transform:translate(-50%,-50%);font-family:"Lilita One","Baloo 2",sans-serif;font-size:4em;white-space:nowrap;text-shadow:0 .08em 0 #000,0 0 .4em rgba(0,0,0,.8);animation:rsmFx 1.6s ease-out forwards}
@keyframes rsmFx{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-120%)}}
.rsm-perde{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:2%;background:rgba(5,6,14,.62);backdrop-filter:blur(2px)}
.rsm-perde[hidden]{display:none}
.rsm-kart{max-width:820px;width:100%;max-height:100%;overflow:auto;background:linear-gradient(160deg,#fff6e0,#f3e2b8);color:#2a2014;border:2px solid #c8a050;border-radius:20px;padding:clamp(12px,2.6vw,26px);display:flex;flex-direction:column;gap:clamp(6px,1.2vw,12px);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.rsm-kart h2{margin:0;font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(26px,3.8vw,44px);line-height:1.1}
.rsm-kart p{margin:0 auto;max-width:62ch;font-size:clamp(15px,1.9vw,21px);color:#3a2c1a;line-height:1.4}.rsm-kart .rsm-sol{text-align:left}
.rsm-etiket{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#8a6a2a}
.rsm-buyuk{font-size:clamp(70px,12vw,130px);line-height:1}
.rsm-yildizlar{font-size:clamp(30px,5vw,52px)!important}.rsm-yildizlar span{color:#c8a868}
.rsm-not{font-size:13px!important;opacity:.7}
.rsm-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.rsm-adlar span{background:#2a3566;color:#fff;border-radius:999px;padding:3px 12px;font-weight:800;font-size:clamp(13px,1.6vw,17px)}
.rsm-butonlar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.rsm-b{border:0;cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.2vw,23px);padding:10px 22px;border-radius:14px;background:#ffc94a;color:#241800}
.rsm-b.kirmizi{background:#d93a3a;color:#fff}.rsm-b.ikincil{background:#2a3566;color:#fff}
.rsm-zorsec{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.rsm-zorsec button{cursor:pointer;border-radius:16px;padding:10px;background:#fff;border:3px solid #e0c890;color:#2a2014;display:flex;flex-direction:column;gap:3px;align-items:center}
.rsm-zorsec button.on{border-color:#ff9a1a;box-shadow:0 0 0 3px rgba(255,154,26,.35)}
.rsm-zorsec .n{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.4vw,25px)}.rsm-zorsec .d{font-weight:800;font-size:12px;opacity:.8}
.rsm-esik{display:flex;gap:8px;justify-content:center}.rsm-esik button{cursor:pointer;border-radius:12px;padding:8px 16px;font-weight:900;font-size:18px;background:#fff;border:2px solid #e0c890}.rsm-esik button.on{border-color:#ff9a1a;background:#ffe2a8}
.rsm-album{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.rsm-album div{background:#fff;border-radius:12px;padding:6px;display:flex;flex-direction:column;align-items:center}.rsm-album span{font-size:clamp(34px,5vw,54px);line-height:1.1}.rsm-album b{font-size:14px}.rsm-album i{font-style:normal;font-size:16px}
@media (max-width:600px){.rsm-zorsec{grid-template-columns:1fr}.rsm-zorsec .d{display:none}}
@media (prefers-reduced-motion:reduce){.rsm-k,.rsm-emoji{transition:none}.rsm-fxy,.rsm-resim.salla,.rsm-k.leke{animation:none}}`;
        document.head.appendChild(st);
    }

    window.rsmSahneKur = rsmSahneKur;
    window.rsmGuncelle = rsmGuncelle;
    window.rsmSeri = rsmSeri;
    window.rsmAnlik = rsmAnlik;
    window.rsmGeriYukle = rsmGeriYukle;
    window.rsmSporcu = rsmSporcu;
    window.rsmKareSecTest = (st, ok) => kareSec(st, ok); // e2e
    window.rsmCevapTest = () => { const st = durum(); return albumBul(st.album).r[st.ri][1]; }; // e2e
})();
