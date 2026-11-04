/* ================================================================================================
   📱 ATIŞ ÖLÇER — telefonun hareket sensörüyle kaldırma · nişan · bırakış (2026-11-04, v374).
   Kullanıcı rakip uygulamayı (saat + AirPods hareketiyle atış zamanlaması, "Aim Replay") gösterdi; tarayıcı saate ve
   kulaklık sensörüne erişemediği için telefonun KENDİ sensörüyle: telefon yaya (gövde/stabilizatör) ya da yay koluna takılır.
   Evreler (hkIsle, saf durum makinesi — testte sahte örnekle beslenir):
     BEKLE → (yerçekimi yönü dinlenmeye göre 35°+ döndü) KALDIR → (dönme hızı 400 ms boyunca < 12°/s) NİŞAN
     → (doğrusal ivme > 15 m/s² ya da dönme > 220°/s sarsıntı) BIRAKTI → TAKİP (1,2 sn) → (yay indi: < 20°) BEKLE.
     KALDIR/NİŞAN'dayken atmadan yay indi → İNDİRDİ (sayılır).
   Her ok: tutuş (nişan başı → bırakış), kaldırma (kaldırma → nişan), toplam, salınım (son 2 sn izin ortalamaya uzaklığı, derece),
   iz (jiroskop entegrali, derece). Hedef tutuş aşılınca titreşim (navigator.vibrate — Android; iPhone tarayıcısı desteklemez).
   Bitirince: bugün bu oturumdan sonra işaretlenen oklarla (detayliOklar, sırayla) eşleşir → NİŞAN İZİ TEKRARI: her okun
   salınım izi hedefte, deldiği yerde biter. Oturum özetleri cihazda (localStorage dagsk_atis_olcer), kimseye gönderilmez.
   v376: GELİŞİM kartı (gelisimVeri, saf): aynı yerdeki son 10 oturumda tutuş, tutarlılık ve salınım. Yalnız bu telefonda.
   v375 (kullanıcı: "yap bakalım"):
     · UYGUN SÜRE: aynı mesafe + hedef türündeki tüm oturumlar puanlı oklarla eşleşir (tutusAnaliz, saf), 18 oktan sonra en iyi
       2 sn'lik tutuş aralığı çıkar, fark 0,5 puandan azsa "belirgin etki yok" der. Hedef tutuş sporcu başına hatırlanır (dagsk_hk_hedef).
     · YANLIŞ BİLDİRME: canlıda "Yanlış saydı" / "Atış kaçtı", özette oku çıkar. Bildirim, o anın ham sensör penceresini (dagsk_hk_rapor,
       son 8, sporcu adı YOK) saklar; "Paylaş" JSON verir, eşikler bu kayıtlarla ayarlanır. Kaçan atış sonraki okların eşleşmesini kaydırır.
     · SESLİ UYARI: hedef aşılınca bip (iPhone titreyemediği için). AudioContext Başla dokunuşunda açılır (iPhone jestsiz açılanı susturur).
     · Varsayılan yer yay kolu; yaya takmada sarsıntı uyarısı.
   ================================================================================================ */
(function () {
    'use strict';
    const ESIK = { kaldirAci: 35, inikAci: 20, sakinHiz: 12, sakinMs: 400, sarsinti: 15, donmeSarsinti: 220, takipMs: 1200, dinlenMs: 500 };
    const SPOT_Y = [-140, 0, 140];
    const HAM_MAKS = 12000, RAPOR_MAKS = 8, ANALIZ_MIN = 18, PENCERE_MIN = 6, DISI_MIN = 4, FARK_MIN = 0.5;
    let _hk = null;
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (e) { } };
    const sn = (ms) => (ms / 1000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const IK = {
        kapat: '<path d="M6 6l12 12M18 6 6 18"/>', telefon: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
        oynat: '<path d="M7 4l13 8-13 8z"/>', dur: '<rect x="6" y="6" width="12" height="12" rx="1"/>', hedef: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
        yenile: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>'
    };
    const svg = (k, b, w) => '<svg width="' + (b || 18) + '" height="' + (b || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2.2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IK[k] + '</svg>';

    /* ================= sinyal → evreler (saf) ================= */
    function aci(a, b) { const d = Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]) || 1; return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / d))) * 180 / Math.PI; }
    function yeniDurum() { return { evre: 'bekle', g: null, dinlen: null, sakinBas: null, kalkT: 0, nisanT: 0, yol: [], x: 0, y: 0, sonT: 0, takipT: 0, oklar: [], indirme: 0, titredi: 0, olay: null }; }
    // o: { t (ms), ag: [x,y,z] yerçekimli ivme, l: [x,y,z] | null doğrusal ivme, r: [alpha,beta,gamma] °/s }
    function hkIsle(D, o, ayar) {
        D.olay = null;
        const dt = D.sonT ? Math.min(0.1, (o.t - D.sonT) / 1000) : 0; D.sonT = o.t;
        D.g = D.g ? D.g.map((v, i) => v * 0.85 + o.ag[i] * 0.15) : o.ag.slice();
        const lin = o.l ? Math.hypot(o.l[0], o.l[1], o.l[2]) : Math.hypot(o.ag[0] - D.g[0], o.ag[1] - D.g[1], o.ag[2] - D.g[2]);
        const r = o.r || [0, 0, 0], hiz = Math.hypot(r[0], r[1], r[2]);
        if (!D.dinlen) D.dinlen = D.g.slice();
        const a = aci(D.g, D.dinlen);
        if (D.evre === 'bekle') {
            // dinlenme yönü: yay aşağıdayken sakin durduğu yön (yavaşça güncellenir)
            if (hiz < 20) { if (D.sakinBas == null) D.sakinBas = o.t; if (o.t - D.sakinBas > ESIK.dinlenMs && a < ESIK.inikAci) D.dinlen = D.dinlen.map((v, i) => v * 0.9 + D.g[i] * 0.1); } else D.sakinBas = null;
            if (a > ESIK.kaldirAci) { D.evre = 'kaldir'; D.kalkT = o.t; D.sakinBas = null; D.olay = 'kaldir'; }
        } else if (D.evre === 'kaldir') {
            if (a < ESIK.inikAci) { D.evre = 'bekle'; D.indirme++; D.olay = 'indirdi'; D.sakinBas = null; return D; }
            if (hiz < ESIK.sakinHiz) { if (D.sakinBas == null) D.sakinBas = o.t; if (o.t - D.sakinBas >= ESIK.sakinMs) { D.evre = 'nisan'; D.nisanT = D.sakinBas; D.yol = [[0, 0, D.sakinBas]]; D.x = 0; D.y = 0; D.titredi = 0; D.olay = 'nisan'; } }
            else D.sakinBas = null;
        } else if (D.evre === 'nisan') {
            if (lin > ESIK.sarsinti || hiz > ESIK.donmeSarsinti) {
                const yol = D.yol, son = yol.filter((p) => p[2] >= o.t - 2000), mx = son.reduce((t, p) => t + p[0], 0) / (son.length || 1), my = son.reduce((t, p) => t + p[1], 0) / (son.length || 1);
                const salinim = son.length ? Math.sqrt(son.reduce((t, p) => t + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / son.length) : 0;
                D.oklar.push({ t: o.t, tutus: o.t - D.nisanT, kaldir: D.nisanT - D.kalkT, toplam: o.t - D.kalkT, salinim: Math.round(salinim * 1000) / 1000, lin: Math.round(lin * 10) / 10, hiz: Math.round(hiz), yol: seyrelt((son.length >= 5 ? son : yol).map((p) => [p[0], p[1]]), 30) }); // iz = bırakıştan önceki son 2 sn (jiroskop kayması uzun tutuşta birikir)
                D.evre = 'takip'; D.takipT = o.t; D.olay = 'birakti'; return D;
            }
            if (a < ESIK.inikAci) { D.evre = 'bekle'; D.indirme++; D.olay = 'indirdi'; D.sakinBas = null; return D; }
            // iz, telefonun takılışından bağımsız olsun diye yerçekimine göre: yatay = dikey eksen (ĝ) etrafında dönme; dikey = ĝ × e
            // ekseni etrafında (e = nişan yönüne yakın telefon ekseni: yayda ekran normali z, kolda telefonun uzun ekseni y).
            // rotationRate: alpha = z, beta = x, gamma = y etrafında → telefon eksenlerinde [beta, gamma, alpha]. İşaret: "Yönü çevir".
            const gb = Math.hypot(D.g[0], D.g[1], D.g[2]) || 1, gu = D.g.map((v) => v / gb), rv = [r[1] || 0, r[2] || 0, r[0] || 0];
            const e = ayar && ayar.yer === 'kol' ? [0, 1, 0] : [0, 0, 1];
            let pa = [gu[1] * e[2] - gu[2] * e[1], gu[2] * e[0] - gu[0] * e[2], gu[0] * e[1] - gu[1] * e[0]], pb = Math.hypot(pa[0], pa[1], pa[2]);
            if (pb < 0.3) { pa = [0, gu[2], -gu[1]]; pb = Math.hypot(pa[0], pa[1], pa[2]) || 1; }
            D.x += (rv[0] * gu[0] + rv[1] * gu[1] + rv[2] * gu[2]) * dt; D.y += (rv[0] * pa[0] + rv[1] * pa[1] + rv[2] * pa[2]) / pb * dt;
            if (!D.yol.length || o.t - D.yol[D.yol.length - 1][2] >= 40) D.yol.push([D.x, D.y, o.t]);
            const tut = o.t - D.nisanT, hedef = (ayar && ayar.hedefMs) || 0;
            if (hedef && tut > hedef && D.titredi === 0) { D.titredi = 1; D.olay = 'uzun'; }
            else if (hedef && tut > hedef + 2000 && D.titredi === 1) { D.titredi = 2; D.olay = 'cokuzun'; }
        } else if (D.evre === 'takip') {
            // atıştan sonra yay iner → BEKLE (indirme SAYILMAZ). 6 sn indirilmeden sakin kaldıysa yeni dinlenme yönü bu kabul edilir.
            if (o.t - D.takipT > ESIK.takipMs && a < ESIK.inikAci) { D.evre = 'bekle'; D.sakinBas = null; }
            else if (o.t - D.takipT > 6000 && hiz < ESIK.sakinHiz) { D.evre = 'bekle'; D.dinlen = D.g.slice(); D.sakinBas = null; }
        }
        return D;
    }
    function seyrelt(l, n) { if (l.length <= n) return l.map((p) => [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]); const s = []; for (let i = 0; i < n; i++) { const p = l[Math.round(i * (l.length - 1) / (n - 1))]; s.push([Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]); } return s; }
    function ozet(oklar) {
        if (!oklar.length) return null;
        const t = oklar.map((o) => o.tutus), ort = t.reduce((a, b) => a + b, 0) / t.length, sd = Math.sqrt(t.reduce((a, b) => a + (b - ort) ** 2, 0) / t.length);
        const sal = oklar.reduce((a, o) => a + o.salinim, 0) / oklar.length, top = oklar.reduce((a, o) => a + o.toplam, 0) / oklar.length;
        return { n: oklar.length, ort, sd, enUzun: Math.max(...t), enKisa: Math.min(...t), sal, top };
    }

    // Tutuş–puan: [{ tutus (ms), puan (sayı) }] → saniye dilimleri (2 = 3 sn'den kısa, 8 = 8 sn ve üstü) ve en iyi 2 sn'lik aralık.
    function tutusAnaliz(c) {
        const r = { n: c.length, min: ANALIZ_MIN, hazir: c.length >= ANALIZ_MIN, dilimler: [], bas: null };
        if (!r.hazir) return r;
        const d = {}; for (let s = 2; s <= 8; s++) d[s] = { s, n: 0, top: 0 };
        c.forEach((x) => { const s = Math.max(2, Math.min(8, Math.floor(x.tutus / 1000))); d[s].n++; d[s].top += x.puan; });
        r.dilimler = Object.values(d).map((x) => ({ s: x.s, n: x.n, ort: x.n ? x.top / x.n : null }));
        const hepsi = c.reduce((t, x) => t + x.puan, 0), gerek = Math.max(PENCERE_MIN, Math.ceil(c.length * 0.2));
        let iyi = null;
        for (let s = 2; s <= 7; s++) {
            const n = d[s].n + d[s + 1].n, disi = c.length - n; if (n < gerek || disi < DISI_MIN) continue;
            const ort = (d[s].top + d[s + 1].top) / n, dOrt = (hepsi - d[s].top - d[s + 1].top) / disi;
            if (!iyi || ort > iyi.ort) iyi = { s, n, ort, dOrt };
        }
        if (iyi && iyi.ort - iyi.dOrt >= FARK_MIN) { r.bas = iyi.s; r.son = iyi.s + 2; r.ort = iyi.ort; r.disiOrt = iyi.dOrt; r.pencereN = iyi.n; }
        return r;
    }
    // Oturumlar → gelişim dizileri. 3 oktan az oturum gürültüdür, sayılmaz; yay ve kol salınımı karşılaştırılamaz, yalnız aynı yer.
    function gelisimVeri(g, yer) {
        const l = g.filter((s) => s.yer === yer && s.oklar && s.oklar.length >= 3).sort((a, b) => a.t - b.t).map((s) => { const z = ozet(s.oklar); return { t: s.t, ort: z.ort / 1000, sd: z.sd / 1000, sal: z.sal }; });
        return l.length >= 2 ? l : null;
    }
    const puanSayi = (p) => p === 'X' ? 10 : (p === 'M' ? 0 : (parseInt(p) || 0));
    // Oturumun oklarını işaretlenen oklarla sırayla eşleştirir; "Atış kaçtı" denen yerde bir işaretli ok atlanır.
    function eslestir(s, oklar, sonrakiT) {
        const alt = s.t - 5000, ust = Math.min(sonrakiT ? sonrakiT - 5000 : Infinity, s.t + 6 * 3600000), l = oklar.filter((o) => o.t >= alt && o.t < ust), kacan = s.kacan || [];
        return s.oklar.map((a, i) => ({ s: a, o: l[i + kacan.filter((p) => p <= i).length] || null }));
    }

    /* ================= sensör ================= */
    function dinle(e) {
        if (!_hk || !_hk.calisiyor) return;
        const ag = e.accelerationIncludingGravity, l = e.acceleration, r = e.rotationRate;
        if (!ag || ag.x == null) return;
        ornekAl({ t: performance.now(), ag: [ag.x, ag.y, ag.z], l: l && l.x != null ? [l.x, l.y, l.z] : null, r: r && r.alpha != null ? [r.alpha, r.beta, r.gamma] : [0, 0, 0] });
    }
    function ornekAl(o) {
        _hk.ornek++; hamEkle(o);
        olayIsle(hkIsle(_hk.D, o, { hedefMs: _hk.hedefSn * 1000, yer: _hk.yer }));
    }
    // Ham sensör halkası: son ~3 dk (60 Hz), tam hızda; bırakış sarsıntısı tek örneklik olabilir, seyreltilmez.
    function hamEkle(o) {
        const y = (a) => a ? a.map((v) => Math.round(v * 10) / 10) : null;
        _hk.ham.push([Math.round(o.t), y(o.ag), y(o.l), y(o.r)]);
        if (_hk.ham.length > HAM_MAKS) _hk.ham.splice(0, 2000);
    }
    function raporlarOku() { try { return JSON.parse(localStorage.getItem('dagsk_hk_rapor') || '[]') || []; } catch (e) { return []; } }
    function raporYaz(tur, merkezT, ok) {
        const h = _hk.ham; if (!h.length) return;
        const son = h[h.length - 1][0], bas = merkezT != null ? merkezT - 8000 : son - 15000, bit = merkezT != null ? merkezT + 3000 : son;
        const ornek = h.filter((x) => x[0] >= bas && x[0] <= bit).map((x) => [x[0] - bas, x[1], x[2], x[3]]);
        let l = raporlarOku().concat([{ tur, zaman: Date.now(), yer: _hk.yer, hedefSn: _hk.hedefSn, cihaz: navigator.userAgent, esik: ESIK, ok: ok ? { tutus: ok.tutus, lin: ok.lin, hiz: ok.hiz } : null, ornek }]).slice(-RAPOR_MAKS);
        // depo dolarsa eskiler düşer; uygulama verisini tehlikeye atmaz
        while (l.length) { try { localStorage.setItem('dagsk_hk_rapor', JSON.stringify(l)); return; } catch (e) { l = l.slice(1); } }
    }
    window.hkBildir = function (tur) {
        if (!_hk || !_hk.D) return; const D = _hk.D;
        if (tur === 'yanlis') {
            const ok = D.oklar.pop(); if (!ok) return tost('Silinecek ok yok.', 'warning');
            _hk.kacan = _hk.kacan.map((p) => Math.min(p, D.oklar.length));
            raporYaz('yanlis-sayim', ok.t, ok); tost('Son ok çıkarıldı, sensör kaydı saklandı.', 'success');
        } else {
            if (!_hk.ham.length) return tost('Sensör verisi gelmiyor, kayıt alınamadı.', 'warning');
            _hk.kacan.push(D.oklar.length);
            raporYaz('kacan-atis', null, null); tost('Kaçan atış not edildi, sensör kaydı saklandı.', 'success');
        }
        canliCiz(true);
    };
    window.hkOkCikar = function (i) {
        if (!_hk || _hk.ekran !== 'ozet') return; const D = _hk.D, ok = D.oklar[i]; if (!ok) return;
        if (!confirm((i + 1) + '. ok yanlış sayıldı, çıkarılsın mı?')) return;
        D.oklar.splice(i, 1); _hk.kacan = _hk.kacan.map((p) => p > i ? p - 1 : p);
        raporYaz('yanlis-sayim', ok.t, ok); gecmisYaz(); _hk.gecmis = gecmisOku(); ozetCiz();
    };
    window.hkRaporPaylas = async function () {
        const l = raporlarOku(); if (!l.length) return tost('Sensör kaydı yok.', 'info');
        const ad = 'atis-olcer-sensor-' + new Date().toLocaleDateString('sv-SE') + '.json', metin = JSON.stringify({ surum: 1, raporlar: l });
        const dosya = typeof File === 'function' ? new File([metin], ad, { type: 'application/json' }) : null;
        if (dosya && navigator.canShare && navigator.share && navigator.canShare({ files: [dosya] })) {
            try { await navigator.share({ files: [dosya], title: 'Atış Ölçer sensör kayıtları' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
        }
        const u = URL.createObjectURL(new Blob([metin], { type: 'application/json' })), a = document.createElement('a');
        a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
    };
    function olayIsle(D) {
        const o = D.olay; if (!o) return;
        try {
            if (o === 'birakti') { titre(60); sesBip(880, 0.08); }
            else if (o === 'uzun') { titre(220); sesBip(700, 0.3); }
            else if (o === 'cokuzun') { titre([120, 90, 120]); sesBip(520, 0.3); sesBip(520, 0.3, 0.18); }
            else if (o === 'indirdi') titre([40, 60, 40]);
        } catch (e) { }
        if (o === 'birakti' || o === 'indirdi' || o === 'nisan' || o === 'kaldir') canliCiz(true);
    }
    function titre(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
    let _ses = null;
    function sesAc() { try { _ses = _ses || new (window.AudioContext || window.webkitAudioContext)(); if (_ses.state === 'suspended') _ses.resume(); } catch (e) { } } // dokunuş içinde çağrılmalı
    function sesBip(f, guc, gecikme) { if (!_hk || !_hk.ses) return; _hk.bipler.push(f); try { sesAc(); const o = _ses.createOscillator(), g = _ses.createGain(), t = _ses.currentTime + (gecikme || 0); o.frequency.value = f; g.gain.value = guc || 0.08; o.connect(g); g.connect(_ses.destination); o.start(t); o.stop(t + 0.1); } catch (e) { } }
    async function izinIste() {
        try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { const c = await DeviceMotionEvent.requestPermission(); if (c !== 'granted') return false; } } catch (e) { return false; }
        return true;
    }
    async function uyanikTut() { try { if (navigator.wakeLock) _hk.kilit = await navigator.wakeLock.request('screen'); } catch (e) { } }
    function uyanikBirak() { try { if (_hk && _hk.kilit) { _hk.kilit.release(); _hk.kilit = null; } } catch (e) { } }

    /* ================= ekran ================= */
    function kabuk(govde) {
        let el = $('hk'); if (!el) { el = document.createElement('div'); el.id = 'hk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Atış Ölçer'); document.body.appendChild(el); }
        el.style.zIndex = document.getElementById('yz-tv') ? '33600' : '26500';
        el.innerHTML = '<div class="hk-sayfa"><div class="hk-ust"><button type="button" class="hk-yuv" onclick="hkKapat()" aria-label="Kapat">' + svg('kapat') + '</button><span class="hk-etiket">ATIŞ ÖLÇER' + (_hk.ad ? ' · ' + esc(_hk.ad) : '') + '</span></div>' + govde + '</div>';
        return el;
    }
    function kmSporcular() { try { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter((k) => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); } catch (e) { return []; } }
    function hazirlikCiz() {
        _hk.ekran = 'hazir';
        const km = _hk.km ? kmSporcular() : [];
        const cip = (ad, on, fn) => '<button type="button" class="hk-cip' + (on ? ' on' : '') + '" aria-pressed="' + !!on + '" onclick="' + fn + '">' + ad + '</button>';
        const rapor = raporlarOku().length;
        kabuk('<h1 class="hk-baslik">Kaldır,<br>nişan al, bırak.</h1>'
            + '<p class="hk-alt">Telefonu yay koluna sıkıca bağla. Her okta kaldırma, nişan (tutuş) süresi ve salınım ölçülür; bırakışı sarsıntıdan anlar.</p>'
            + (_hk.km && !km.length && !_hk.ad ? '<div class="hk-uyari">Derste sporcu yok. Önce Yoklama\'dan derse sporcu ekle, sonra buraya dön.</div>' : '')
            + (km.length ? '<p class="hk-alan">SPORCU</p><div class="hk-cipler">' + km.slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr')).map((k) => cip(esc(k.ad), _hk.ad === k.ad && _hk.g === k.g, 'hkSporcu(\'' + encodeURIComponent(k.g) + '\',\'' + encodeURIComponent(k.ad).replace(/'/g, '%27') + '\')')).join('') + '</div>' : '')
            + '<p class="hk-alan">TELEFON NEREDE?</p><div class="hk-cipler">' + cip('Yay kolunda', _hk.yer === 'kol', 'hkAyar(\'yer\',\'kol\')') + cip('Yayın üstünde', _hk.yer === 'yay', 'hkAyar(\'yer\',\'yay\')') + '</div>'
            + (_hk.yer === 'yay' ? '<div class="hk-uyari">Bırakış sarsıntısı telefonu düşürebilir ya da zarar verebilir. Yalnız sağlam bir tutucuyla kullan; çocuklarda ve güçlü yaylarda yay kolunu seç.</div>' : '')
            + '<p class="hk-alan">HEDEF TUTUŞ · aşınca uyarır</p><div class="hk-cipler">' + [0, 3, 4, 5, 6, 7, 8].map((s) => cip(s ? s + ' sn' : 'Kapalı', _hk.hedefSn === s, 'hkAyar(\'hedefSn\',' + s + ')')).join('') + '</div>'
            + '<p class="hk-alan">MESAFE · nişan izinin ölçeği</p><div class="hk-cipler">' + [10, 18, 30, 50, 70].map((m) => cip(m + ' m', _hk.mesafe === m, 'hkAyar(\'mesafe\',' + m + ')')).join('') + '</div>'
            + (_hk.ad ? kisiselKart() + gelisimKart() : '')
            + '<label class="hk-onay"><input type="checkbox"' + (_hk.ses ? ' checked' : '') + ' onchange="_hkAyarSes(this.checked)"><span class="hk-kutu"></span>Sesli uyarı: hedef süre aşılınca ve bırakışta bip</label>'
            + (_hk.gecmis.length ? '<p class="hk-alan">SON OTURUMLAR</p><div class="hk-gecmis">' + _hk.gecmis.slice(-3).reverse().map((g) => { const z = ozet(g.oklar); return '<div><b>' + new Date(g.t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + '</b><span>' + (z ? z.n + ' ok · tutuş ' + sn(z.ort) + ' sn ±' + sn(z.sd) : 'ok yok') + '</span></div>'; }).join('') + '</div>' : '')
            + (rapor ? '<button type="button" class="hk-cip hk-rapor" onclick="hkRaporPaylas()">Sensör kayıtlarını paylaş (' + rapor + ')</button>' : '')
            + '<div class="hk-alt-bar"><button type="button" class="hk-ana" onclick="hkBasla()"' + (_hk.ad ? '' : ' disabled') + '>' + svg('oynat', 18) + (_hk.ad ? 'Başla' : 'Önce sporcu seç') + '</button>'
            + '<span class="hk-not">' + (masaustu() ? 'Bilgisayarda hareket sensörü yok, ölçüm için telefondan aç.' : 'Ekran açık kalır. iPhone titremez; sessize alınmışsa bip de duyulmaz.') + '</span></div>');
    }
    function masaustu() { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; } }
    // Sporcunun tüm işaretli okları: bugünkü kart + arşivlenen kartlar (kart sıfırlanınca oklar kartGecmisi'ne taşınır).
    function tumOklar() {
        const sp = turnuvaDB[_hk.g] && turnuvaDB[_hk.g][_hk.ad]; if (!sp) return [];
        const g = new Set(), l = [];
        [sp.detayliOklar].concat((sp.kartGecmisi || []).map((k) => k.detayliOklar)).forEach((d) => (Array.isArray(d) ? d : []).forEach((o) => {
            if (!o || !o.t || o.x == null || o.y == null) return; const k = o.t + '|' + o.x + '|' + o.y + '|' + (o.okNo || ''); if (g.has(k)) return; g.add(k); l.push(o);
        }));
        return l.sort((a, b) => a.t - b.t);
    }
    function ciftlerTopla() {
        const oklar = tumOklar(), s = _hk.gecmis.slice().sort((a, b) => a.t - b.t), c = [];
        s.forEach((o, i) => { if (o.mesafe !== _hk.mesafe) return; eslestir(o, oklar, s[i + 1] && s[i + 1].t).forEach((e) => { if (e.o) c.push({ tutus: e.s.tutus, puan: puanSayi(e.o.puan), tip: e.o.tip || '6ring' }); }); });
        const say = {}; c.forEach((x) => { say[x.tip] = (say[x.tip] || 0) + 1; }); // farklı hedef türlerinin puanı karşılaştırılmaz
        const tip = Object.keys(say).sort((a, b) => say[b] - say[a])[0];
        return c.filter((x) => x.tip === tip);
    }
    function aralikYazi(a) { return a.bas === 2 ? '4 sn\'den kısa' : (a.bas === 7 ? '7 sn ve üstü' : a.bas + '–' + a.son + ' sn'); }
    const v1 = (x) => x.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    function kisiselKart() {
        const a = tutusAnaliz(ciftlerTopla());
        if (!a.n && !_hk.gecmis.length) return '';
        let ic;
        if (!a.hazir) ic = '<p>' + _hk.mesafe + ' m\'de puanla eşleşen <b>' + a.n + ' / ' + a.min + '</b> ok. ' + a.min + ' oka ulaşınca bu sporcunun en iyi tutuş süresi çıkar. Okları Skor Gir\'de hedefe dokunarak ya da fotoğrafla işaretle.</p><div class="hk-ilerle"><i style="width:' + Math.round(a.n / a.min * 100) + '%"></i></div>';
        else {
            const m = Math.max(10, ...a.dilimler.map((d) => d.ort || 0));
            const cubuk = '<div class="hk-cubuklar">' + a.dilimler.map((d) => '<div class="' + (a.bas != null && (d.s === a.bas || d.s === a.bas + 1) ? 'on' : '') + '"><b>' + (d.n ? v1(d.ort) : '–') + '</b><span style="height:' + (d.n ? Math.max(6, Math.round(d.ort / m * 56)) : 2) + 'px"></span><em>' + (d.s === 2 ? '<3' : d.s === 8 ? '8+' : d.s) + '</em></div>').join('') + '</div>';
            const hedef = a.bas != null && a.son <= 8 && a.bas !== 7 ? a.son : null;
            ic = a.bas != null
                ? '<strong class="hk-kisisel-sure">' + aralikYazi(a) + '</strong><p>Bu aralıkta ortalama <b>' + v1(a.ort) + '</b>, dışında <b>' + v1(a.disiOrt) + '</b> · ' + a.n + ' ok, ' + _hk.mesafe + ' m' + (a.n < 36 ? ' · ok arttıkça netleşir' : '') + '</p>' + cubuk
                    + (hedef && hedef !== _hk.hedefSn ? '<button type="button" class="hk-kisisel-btn" onclick="hkAyar(\'hedefSn\',' + hedef + ')">Hedef tutuşu ' + hedef + ' sn yap</button>' : '')
                : '<p>Şimdilik tutuş süresi puanı belirgin etkilemiyor (' + a.n + ' ok, ' + _hk.mesafe + ' m).</p>' + cubuk;
        }
        return '<div class="hk-kisisel"><p class="hk-alan">BU SPORCUYA UYGUN SÜRE</p>' + ic + '</div>';
    }
    function cizgi(d) {
        const a = Math.min(...d), b = Math.max(...d), r = b - a || 1, W = 120, H = 34;
        const n = d.map((v, i) => [Math.round(i / (d.length - 1) * (W - 6) + 3), Math.round(H - 4 - (v - a) / r * (H - 8))]), s = n[n.length - 1];
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="34" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="' + n.map((p) => p.join(',')).join(' ') + '"/><circle cx="' + s[0] + '" cy="' + s[1] + '" r="3" fill="currentColor"/></svg>';
    }
    function gelisimKart() {
        const v = gelisimVeri(_hk.gecmis, _hk.yer); if (!v) return '';
        const f = (x) => x.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), f2 = (x) => x.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const kutu = (ad, d, yaz, sinif) => '<div class="hk-gel ' + sinif + '"><span>' + ad + '</span><b>' + yaz(d[0]) + ' → ' + yaz(d[d.length - 1]) + '</b>' + cizgi(d) + '</div>';
        const sinif = (d) => d[d.length - 1] < d[0] ? 'iyi' : (d[d.length - 1] > d[0] ? 'kotu' : ''); // düşük daha iyi
        return '<div class="hk-kisisel" id="hk-gelisim"><p class="hk-alan">GELİŞİM · son ' + v.length + ' oturum</p><div class="hk-gel-kap">'
            + kutu('Ort. tutuş', v.map((x) => x.ort), (x) => f(x) + ' sn', '')
            + kutu('Tutarlılık', v.map((x) => x.sd), (x) => '±' + f(x), sinif(v.map((x) => x.sd)))
            + kutu('Salınım', v.map((x) => x.sal), (x) => f2(x) + '°', sinif(v.map((x) => x.sal)))
            + '</div></div>';
    }
    const EVRE = { bekle: ['HAZIR', 'Yayı kaldır'], kaldir: ['KALDIRIYOR', 'Çek, nişan al'], nisan: ['NİŞAN', ''], takip: ['BIRAKTI', 'Takip — pozisyonu koru'] };
    function canliCiz(tam) {
        if (!_hk || _hk.ekran !== 'canli') return;
        const D = _hk.D, e = EVRE[D.evre] || EVRE.bekle, son = D.oklar[D.oklar.length - 1];
        if (!tam && $('hk-evre')) {
            const tut = D.evre === 'nisan' ? performance.now() - D.nisanT : 0, uzun = _hk.hedefSn && tut > _hk.hedefSn * 1000;
            $('hk-evre').textContent = D.evre === 'nisan' ? sn(tut) + ' sn' : e[0];
            $('hk-evre').className = 'hk-evre ' + D.evre + (uzun ? ' uzun' : '');
            nisanCiz();
            return;
        }
        const z = ozet(D.oklar);
        kabuk('<div class="hk-canli">'
            + '<div class="hk-evre-kap"><span class="hk-evre ' + D.evre + '" id="hk-evre">' + e[0] + '</span><span class="hk-evre-alt" id="hk-evre-alt">' + (D.evre === 'nisan' ? (_hk.hedefSn ? 'hedef ' + _hk.hedefSn + ' sn' : 'tut') : e[1]) + '</span></div>'
            + '<canvas id="hk-nisan" width="300" height="300" aria-label="Nişan izi" role="img"></canvas>'
            + '<div class="hk-sayac"><div><b>' + D.oklar.length + '</b><span>ok</span></div><div><b>' + (z ? sn(z.ort) : '—') + '</b><span>ort. tutuş</span></div><div><b>' + (z ? '±' + sn(z.sd) : '—') + '</b><span>tutarlılık</span></div><div><b>' + D.indirme + '</b><span>indirme</span></div></div>'
            + (son ? '<div class="hk-son"><span>Son ok</span><b>tutuş ' + sn(son.tutus) + ' sn</b><b>kaldır→bırak ' + sn(son.toplam) + ' sn</b><b>salınım ' + son.salinim.toFixed(2) + '°</b></div>' : '')
            + (_hk.ornek === 0 && performance.now() - _hk.basT > 2500 ? '<div class="hk-uyari">Sensör verisi gelmiyor. Bu cihazda hareket sensörü yok ya da izin verilmedi (iPhone: Ayarlar › Safari › Hareket ve Yön).</div>' : '')
            + '</div>'
            + '<div class="hk-bildir"><button type="button" class="hk-cip" onclick="hkBildir(\'yanlis\')"' + (D.oklar.length ? '' : ' disabled') + '>Yanlış saydı</button><button type="button" class="hk-cip" onclick="hkBildir(\'kacti\')">Atış kaçtı</button></div>'
            + '<div class="hk-alt-bar"><button type="button" class="hk-ana" onclick="hkBitir()">' + svg('dur', 16) + 'Bitir · özet</button></div>');
        nisanCiz();
    }
    function nisanCiz() {
        const cv = $('hk-nisan'); if (!cv) return; const g = cv.getContext('2d'), S = cv.width, c = S / 2, D = _hk.D, olc = S / 2 / 1.5; // ±1,5°
        g.clearRect(0, 0, S, S);
        g.strokeStyle = 'rgba(245,242,239,.14)'; g.lineWidth = 1; [0.5, 1, 1.5].forEach((d) => { g.beginPath(); g.arc(c, c, d * olc, 0, Math.PI * 2); g.stroke(); });
        g.beginPath(); g.moveTo(c - 10, c); g.lineTo(c + 10, c); g.moveTo(c, c - 10); g.lineTo(c, c + 10); g.stroke();
        if (D.evre !== 'nisan' || D.yol.length < 2) return;
        const yol = D.yol.slice(-60), x0 = yol[yol.length - 1][0], y0 = yol[yol.length - 1][1], sx = _hk.cevirX ? -1 : 1, sy = _hk.cevirY ? -1 : 1;
        g.strokeStyle = '#FD8E01'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath();
        yol.forEach((p, i) => { const x = c + (p[0] - x0) * olc * sx, y = c + (p[1] - y0) * olc * sy; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        g.fillStyle = '#FD8E01'; g.beginPath(); g.arc(c, c, 6, 0, Math.PI * 2); g.fill();
    }

    /* ---- özet + nişan izi tekrarı ---- */
    // derece → hedef birimi (halka genişliği 10 birim): 6/10 halkalı 80 cm yüz → 1 birim 0,4 cm; 122 cm → 0,61 cm
    function birimPerDerece(tip) { const cm = Math.tan(Math.PI / 180) * _hk.mesafe * 100, birimCm = tip === '10ring' ? 0.61 : 0.4; return cm / birimCm; }
    function ozetCiz() {
        _hk.ekran = 'ozet';
        const D = _hk.D, z = ozet(D.oklar);
        _hk.eslesme = eslestir({ t: _hk.basDuvar, oklar: D.oklar, kacan: _hk.kacan }, tumOklar(), null);
        const n = _hk.eslesme.filter((e) => e.o).length, rapor = raporlarOku().length;
        const not = !z ? 'Ok algılanmadı. Telefonun sıkı bağlı olduğundan emin ol. Kolda bırakış sarsıntısı zayıf kalabilir; atış sırasında "Atış kaçtı"ya basarsan eşik bu kayıtlara göre ayarlanır.'
            : (z.sd > 1500 ? 'Tutuş süresi oktan oka çok değişiyor (±' + sn(z.sd) + ' sn) — aynı ritmi bulmak için Ritim aracını dene.'
                : z.enUzun > 8000 ? 'Bazı oklarda nişan 8 sn\'yi geçti — uzun tutuşta yorulma ve donma başlar; bırakamıyorsan indir, yeniden kaldır.'
                    : 'Ritim tutarlı (±' + sn(z.sd) + ' sn). Salınım ortalaması ' + z.sal.toFixed(2) + '°.');
        kabuk('<h1 class="hk-baslik">' + (z ? z.n + ' ok' : 'Özet') + '</h1>'
            + (z ? '<div class="hk-sayac"><div><b>' + sn(z.ort) + '</b><span>ort. tutuş sn</span></div><div><b>±' + sn(z.sd) + '</b><span>tutarlılık</span></div><div><b>' + sn(z.top) + '</b><span>kaldır→bırak</span></div><div><b>' + D.indirme + '</b><span>indirme</span></div></div>' : '')
            + '<div class="hk-not-kart">' + esc(not) + '</div>'
            + kisiselKart() + gelisimKart()
            + (z ? '<p class="hk-alan">NİŞAN İZİ TEKRARI' + (n ? ' · ' + n + ' ok hedefle eşleşti' : '') + '</p>'
                + '<div class="hk-tekrar"><canvas id="hk-tekrar" width="320" height="320" aria-label="Nişan izi tekrarı" role="img"></canvas>'
                + '<div class="hk-tekrar-btn"><button type="button" class="hk-cip" onclick="hkTekrar()">' + svg('yenile', 15) + 'Oynat</button><button type="button" class="hk-cip" onclick="_hkCevir(\'X\')">↔ Yönü çevir</button><button type="button" class="hk-cip" onclick="_hkCevir(\'Y\')">↕ Yönü çevir</button></div>'
                + (n ? '' : '<p class="hk-alt">Okları Skor Gir\'de hedefe dokunarak (ya da 📷 fotoğrafla) işaretlersen her iz okun deldiği yerde biter. Şimdilik izler merkezde.</p>') + '</div>'
                + '<p class="hk-alan">OKLAR · yanlış sayılanı ✕ ile çıkar</p><div class="hk-liste">' + _hk.eslesme.map((e, i) => '<div class="hk-sat"><b>' + (i + 1) + '</b><span>tutuş ' + sn(e.s.tutus) + ' sn</span><span>salınım ' + e.s.salinim.toFixed(2) + '°</span>' + (e.o ? '<i class="hk-puan">' + esc(e.o.puan) + '</i>' : '<i></i>') + '<button type="button" class="hk-sat-sil" onclick="hkOkCikar(' + i + ')" aria-label="' + (i + 1) + '. oku çıkar">' + svg('kapat', 15) + '</button></div>').join('') + '</div>' : '')
            + (rapor ? '<button type="button" class="hk-cip hk-rapor" onclick="hkRaporPaylas()">Sensör kayıtlarını paylaş (' + rapor + ')</button>' : '')
            + '<div class="hk-alt-bar iki"><button type="button" class="hk-ana acik" onclick="hkYeniden()">Yeni oturum</button><button type="button" class="hk-ana" onclick="hkKapat()">Kapat</button></div>');
        if (z) hkTekrar();
    }
    function tekrarCiz(adim) {
        const cv = $('hk-tekrar'); if (!cv) return; const g = cv.getContext('2d'), S = cv.width, c = S / 2;
        const ilk = _hk.eslesme.find((e) => e.o), tip = ilk && ilk.o.tip === '10ring' ? '10ring' : '6ring', R = tip === '10ring' ? 100 : 60, k = (S / 2 - 6) / (R + 2);
        g.clearRect(0, 0, S, S);
        const hk = tip === '10ring' ? [[100, '#f4f4f0'], [80, '#1a1a1a'], [60, '#2f7fd6'], [40, '#e23b2e'], [20, '#f5d32a']] : [[60, '#2f7fd6'], [40, '#e23b2e'], [20, '#f5d32a']];
        hk.forEach(([r, f]) => { g.fillStyle = f; g.beginPath(); g.arc(c, c, r * k, 0, Math.PI * 2); g.fill(); });
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let r = 10; r <= R; r += 10) { g.beginPath(); g.arc(c, c, r * k, 0, Math.PI * 2); g.stroke(); }
        const bpd = birimPerDerece(tip), sx = _hk.cevirX ? -1 : 1, sy = _hk.cevirY ? -1 : 1;
        _hk.eslesme.forEach((e, i) => {
            const yol = e.s.yol; if (!yol || !yol.length) return;
            const son = yol[yol.length - 1], hu = e.o ? e.o.x : 0, hv = e.o ? e.o.y - (e.o.tip === '3spot' && e.o.spot != null ? SPOT_Y[e.o.spot] || 0 : 0) : 0;
            const kac = adim == null ? yol.length : Math.max(0, Math.min(yol.length, adim - i * 12));
            if (!kac) return;
            const aktif = adim != null && kac < yol.length;
            g.strokeStyle = aktif ? '#FD8E01' : 'rgba(10,10,10,.75)'; g.lineWidth = aktif ? 3 : 1.6; g.lineJoin = 'round'; g.beginPath();
            for (let j = 0; j < kac; j++) { const p = yol[j], x = c + (hu + (p[0] - son[0]) * bpd * sx) * k, y = c + (hv + (p[1] - son[1]) * bpd * sy) * k; j ? g.lineTo(x, y) : g.moveTo(x, y); }
            g.stroke();
            if (kac >= yol.length) { const x = c + hu * k, y = c + hv * k; g.fillStyle = '#0A0A0A'; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
        });
    }
    window.hkTekrar = function () {
        if (!_hk) return; clearInterval(_hk.tekrarZ); let adim = 0; const top = _hk.eslesme.length * 12 + 40;
        _hk.tekrarZ = setInterval(() => { adim += 1; tekrarCiz(adim); if (adim > top) { clearInterval(_hk.tekrarZ); tekrarCiz(null); } }, 40);
    };
    window._hkCevir = function (e) { if (!_hk) return; _hk['cevir' + e] = !_hk['cevir' + e]; try { localStorage.setItem('dagsk_hk_cevir', JSON.stringify({ x: !!_hk.cevirX, y: !!_hk.cevirY })); } catch (er) { } tekrarCiz(null); };

    /* ================= akış ================= */
    function gecmisOku() { try { return (JSON.parse(localStorage.getItem('dagsk_atis_olcer') || '{}') || {})[_hk.g + '|' + _hk.ad] || []; } catch (e) { return []; } }
    function gecmisYaz() {
        try { const t = JSON.parse(localStorage.getItem('dagsk_atis_olcer') || '{}') || {}, k = _hk.g + '|' + _hk.ad, l = (t[k] || []).filter((s) => s.t !== _hk.basDuvar); t[k] = (_hk.D.oklar.length ? l.concat([{ t: _hk.basDuvar, mesafe: _hk.mesafe, yer: _hk.yer, oklar: _hk.D.oklar, indirme: _hk.D.indirme, kacan: _hk.kacan }]) : l).slice(-10); localStorage.setItem('dagsk_atis_olcer', JSON.stringify(t)); } catch (e) { }
    }
    function hedefOku() { try { const v = (JSON.parse(localStorage.getItem('dagsk_hk_hedef') || '{}') || {})[_hk.g + '|' + _hk.ad]; if (v != null) _hk.hedefSn = v; } catch (e) { } }
    function hedefYaz() { if (!_hk.ad) return; try { const t = JSON.parse(localStorage.getItem('dagsk_hk_hedef') || '{}') || {}; t[_hk.g + '|' + _hk.ad] = _hk.hedefSn; localStorage.setItem('dagsk_hk_hedef', JSON.stringify(t)); } catch (e) { } }
    window.hkAc = function (ops) {
        ops = ops || {};
        let cev = {}; try { cev = JSON.parse(localStorage.getItem('dagsk_hk_cevir') || '{}') || {}; } catch (e) { }
        let ayar = {}; try { ayar = JSON.parse(localStorage.getItem('dagsk_hk_ayar') || '{}') || {}; } catch (e) { }
        const km = !!ops.km, g = ops.g || (km ? null : (typeof aktifGrup !== 'undefined' ? aktifGrup : null)), ad = ops.ad || (km ? null : (typeof secilenSporcu !== 'undefined' ? secilenSporcu : null));
        _hk = { km, g, ad, yer: ayar.yer || 'kol', hedefSn: ayar.hedefSn != null ? ayar.hedefSn : 5, mesafe: ayar.mesafe || 18, ses: ayar.ses !== false, cevirX: !!cev.x, cevirY: !!cev.y, D: yeniDurum(), ornek: 0, gecmis: [], ham: [], kacan: [], bipler: [] };
        _hk.gecmis = _hk.ad ? gecmisOku() : [];
        if (_hk.ad) hedefOku();
        hkCss(); hazirlikCiz();
    };
    function ayarKaydet() { try { localStorage.setItem('dagsk_hk_ayar', JSON.stringify({ yer: _hk.yer, hedefSn: _hk.hedefSn, mesafe: _hk.mesafe, ses: _hk.ses })); } catch (e) { } }
    window.hkAyar = function (a, v) { if (!_hk) return; _hk[a] = v; ayarKaydet(); if (a === 'hedefSn') hedefYaz(); if (_hk.ekran === 'ozet') ozetCiz(); else hazirlikCiz(); };
    window._hkAyarSes = function (v) { if (!_hk) return; _hk.ses = !!v; ayarKaydet(); };
    window.hkSporcu = function (gE, aE) { if (!_hk) return; _hk.g = decodeURIComponent(gE); _hk.ad = decodeURIComponent(aE); _hk.gecmis = gecmisOku(); hedefOku(); hazirlikCiz(); };
    window.hkBasla = async function () {
        if (!_hk || !_hk.ad) return;
        if (_hk.ses) sesAc(); // izin penceresinden önce: dokunuş hâlâ geçerli
        const izin = await izinIste(); if (!izin) return tost('Hareket sensörü izni verilmedi.', 'error');
        _hk.D = yeniDurum(); _hk.ham = []; _hk.kacan = []; _hk.ornek = 0; _hk.basT = performance.now(); _hk.basDuvar = Date.now(); _hk.calisiyor = true; _hk.ekran = 'canli';
        window.addEventListener('devicemotion', dinle); uyanikTut();
        clearInterval(_hk.ciz); _hk.ciz = setInterval(() => canliCiz(false), 100);
        setTimeout(() => { if (_hk && _hk.ekran === 'canli' && !_hk.ornek) canliCiz(true); }, 2800);
        canliCiz(true);
    };
    function durdur() { if (!_hk) return; _hk.calisiyor = false; window.removeEventListener('devicemotion', dinle); clearInterval(_hk.ciz); clearInterval(_hk.tekrarZ); uyanikBirak(); }
    window.hkBitir = function () { if (!_hk) return; durdur(); gecmisYaz(); _hk.gecmis = gecmisOku(); ozetCiz(); };
    window.hkYeniden = function () { if (!_hk) return; durdur(); _hk.D = yeniDurum(); _hk.kacan = []; hazirlikCiz(); };
    window.hkKapat = function () {
        if (_hk && _hk.ekran === 'canli' && _hk.D.oklar.length) { durdur(); gecmisYaz(); }
        durdur(); const el = $('hk'); if (el) el.remove(); _hk = null;
    };
    // testler: sahte örnek akışı (performance.now yerine verilen t) ve saf fonksiyonlar
    window._hkIc = { hkIsle, yeniDurum, ozet, tutusAnaliz, eslestir, gelisimVeri, durum: () => _hk, besle: (l) => { if (!_hk) return; l.forEach(ornekAl); canliCiz(true); } };

    function hkCss() {
        if ($('hk-css')) return;
        const st = document.createElement('style'); st.id = 'hk-css';
        st.textContent = '#hk{position:fixed;inset:0;background:var(--ks-zemin,#0A0A0A);color:var(--ks-yazi,#F5F2EF);overflow-y:auto;font-family:inherit}'
            + '.hk-sayfa{width:min(560px,100%);margin:0 auto;box-sizing:border-box;padding:16px 16px 140px;display:flex;flex-direction:column;gap:12px}'
            + '.hk-ust{display:flex;align-items:center;gap:10px;min-height:44px}.hk-yuv{width:44px;height:44px;border-radius:22px;border:0;background:var(--ks-kart,#151515);color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}'
            + '.hk-etiket{font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--ks-soluk,#A8A29E);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
            + '.hk-baslik{margin:4px 0 0;font-family:var(--ks-baslik-font,sans-serif);font-weight:800;font-size:42px;line-height:.92;text-transform:uppercase}'
            + '.hk-alt{margin:0;font-size:13.5px;line-height:1.45;color:var(--ks-soluk,#A8A29E)}'
            + '.hk-alan{margin:8px 0 -2px;font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--ks-soluk,#A8A29E)}'
            + '.hk-cipler{display:flex;flex-wrap:wrap;gap:8px}.hk-cip{min-height:44px;padding:0 15px;border-radius:22px;border:1px solid var(--ks-cizgi,#262626);background:var(--ks-kart,#151515);color:inherit;font:inherit;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}'
            + '.hk-cip.on{background:var(--ks-acik,#F5F2EF);border-color:var(--ks-acik,#F5F2EF);color:var(--ks-acik-yazi,#0A0A0A);font-weight:800}'
            + '.hk-onay{display:flex;align-items:center;gap:10px;min-height:44px;font-size:14px;font-weight:600;cursor:pointer}.hk-onay input{position:absolute;opacity:0;width:1px;height:1px}'
            + '.hk-kutu{width:22px;height:22px;border-radius:6px;border:2px solid var(--ks-soluk,#A8A29E);box-sizing:border-box;flex-shrink:0}.hk-onay input:checked+.hk-kutu{background:var(--ks-vurgu,#FC5B01);border-color:var(--ks-vurgu,#FC5B01)}.hk-onay input:focus-visible+.hk-kutu{outline:3px solid var(--ks-vurgu2,#FD8E01);outline-offset:2px}'
            + '.hk-gecmis{display:flex;flex-direction:column;gap:6px}.hk-gecmis div{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:var(--ks-kart,#151515);font-size:13px}.hk-gecmis span{color:var(--ks-soluk,#A8A29E)}'
            + '.hk-alt-bar{position:fixed;left:0;right:0;bottom:0;padding:12px 16px calc(16px + env(safe-area-inset-bottom));background:var(--ks-zemin,#0A0A0A);border-top:1px solid var(--ks-cizgi,#262626);display:flex;flex-direction:column;align-items:center;gap:6px}'
            + '.hk-alt-bar>*{width:min(528px,100%)}.hk-alt-bar.iki{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding-left:max(16px,calc(50% - 264px));padding-right:max(16px,calc(50% - 264px))}.hk-alt-bar.iki>*{width:auto}'
            + '.hk-ana{min-height:56px;border-radius:28px;border:0;background:var(--ks-vurgu,#FC5B01);color:var(--ks-vurgu-yazi,#160600);font:inherit;font-size:15.5px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}'
            + '.hk-ana.acik{background:var(--ks-acik,#F5F2EF);color:var(--ks-acik-yazi,#0A0A0A)}.hk-ana:disabled{opacity:.45;cursor:default}.hk-not{font-size:12px;color:var(--ks-soluk,#A8A29E);text-align:center}'
            + '.hk-canli{display:flex;flex-direction:column;align-items:center;gap:14px}'
            + '.hk-evre-kap{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:6px}'
            + '.hk-evre{font-family:var(--ks-baslik-font,sans-serif);font-weight:800;font-size:64px;line-height:.9;text-transform:uppercase;font-variant-numeric:tabular-nums;color:var(--ks-soluk,#A8A29E)}'
            + '.hk-evre.kaldir{color:var(--ks-yazi,#F5F2EF)}.hk-evre.nisan{color:var(--ks-vurgu2,#FD8E01)}.hk-evre.nisan.uzun{color:var(--ks-kirmizi,#FF7A5C)}.hk-evre.takip{color:var(--ks-yesil,#5FBF7F)}'
            + '.hk-evre-alt{font-size:14px;color:var(--ks-soluk,#A8A29E);min-height:20px}'
            + '#hk-nisan{width:min(300px,78vw);height:auto;aspect-ratio:1;border-radius:50%;background:var(--ks-kart,#151515)}'
            + '.hk-sayac{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%}.hk-sayac div{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:14px;background:var(--ks-kart,#151515)}'
            + '.hk-sayac b{font-family:var(--ks-baslik-font,sans-serif);font-weight:800;font-size:26px;line-height:1;font-variant-numeric:tabular-nums}.hk-sayac span{font-size:11px;color:var(--ks-soluk,#A8A29E);text-align:center}'
            + '.hk-son{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;width:100%;padding:12px;border-radius:14px;border:1px solid var(--ks-cizgi,#262626);font-size:13px}.hk-son span{color:var(--ks-soluk,#A8A29E);width:100%;text-align:center;font-size:11px;letter-spacing:.1em;text-transform:uppercase}'
            + '.hk-uyari{padding:10px 12px;border-radius:12px;background:rgba(255,122,92,.12);color:var(--ks-kirmizi,#FF7A5C);font-size:13px;font-weight:600}'
            + '.hk-not-kart{padding:12px 14px;border-radius:14px;background:var(--ks-kart,#151515);font-size:14px;line-height:1.5}'
            + '.hk-tekrar{display:flex;flex-direction:column;align-items:center;gap:10px}#hk-tekrar{width:min(320px,86vw);height:auto;aspect-ratio:1;border-radius:50%;background:#1C1C1C}.hk-tekrar-btn{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}'
            + '.hk-liste{display:flex;flex-direction:column}.hk-sat{display:grid;grid-template-columns:22px minmax(0,1fr) minmax(0,1fr) 30px 44px;gap:6px;align-items:center;min-height:44px;border-bottom:1px solid var(--ks-cizgi,#262626);font-size:13.5px;font-variant-numeric:tabular-nums}.hk-sat b{color:var(--ks-soluk,#A8A29E)}'
            + '.hk-puan{font-style:normal;font-weight:800;text-align:center;border-radius:8px;background:var(--ks-kart2,#1C1C1C);padding:4px 0}'
            + '.hk-sat-sil{width:44px;height:44px;border:0;background:transparent;color:var(--ks-soluk,#A8A29E);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}'
            + '.hk-bildir{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}.hk-bildir .hk-cip{justify-content:center}.hk-cip:disabled{opacity:.45;cursor:default}.hk-rapor{align-self:center}'
            + '.hk-kisisel{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:16px;background:var(--ks-kart,#151515)}.hk-kisisel p{margin:0;font-size:13.5px;line-height:1.45}.hk-kisisel .hk-alan{margin:0}'
            + '.hk-kisisel-sure{font-family:var(--ks-baslik-font,sans-serif);font-weight:800;font-size:38px;line-height:1;color:var(--ks-vurgu2,#FD8E01);font-variant-numeric:tabular-nums}'
            + '.hk-ilerle{height:8px;border-radius:4px;background:var(--ks-kart2,#1C1C1C);overflow:hidden}.hk-ilerle i{display:block;height:100%;background:var(--ks-vurgu2,#FD8E01)}'
            + '.hk-cubuklar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;align-items:end;margin-top:4px}.hk-cubuklar div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;min-height:92px;color:var(--ks-soluk,#A8A29E)}.hk-cubuklar b{font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}.hk-cubuklar span{width:100%;border-radius:4px 4px 0 0;background:var(--ks-cizgi,#262626)}.hk-cubuklar em{font-style:normal;font-size:11px}.hk-cubuklar .on{color:var(--ks-yazi,#F5F2EF)}.hk-cubuklar .on span{background:var(--ks-vurgu2,#FD8E01)}'
            + '.hk-gel-kap{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hk-gel{display:flex;flex-direction:column;gap:3px;min-width:0;color:var(--ks-soluk,#A8A29E)}.hk-gel span{font-size:11px}.hk-gel b{font-size:12px;font-weight:700;color:var(--ks-yazi,#F5F2EF);font-variant-numeric:tabular-nums}.hk-gel.iyi{color:var(--ks-yesil,#5FBF7F)}.hk-gel.kotu{color:var(--ks-kirmizi,#FF7A5C)}'
            + '.hk-kisisel-btn{min-height:44px;border-radius:22px;border:0;background:var(--ks-acik,#F5F2EF);color:var(--ks-acik-yazi,#0A0A0A);font:inherit;font-size:14px;font-weight:800;cursor:pointer}'
            + '#hk button:focus-visible{outline:3px solid var(--ks-vurgu2,#FD8E01);outline-offset:2px}';
        document.head.appendChild(st);
    }
})();
