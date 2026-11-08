/* ================================================================================================
   🏹 OK HIZI ÖLÇER (2026-11-09, v391) — telefon sesi dinler: ipin bırakılma sesi → okun hedefe çarpma sesi.
   Kaynak fikir: CapTarget Instagram (DfHbnjOIEVh, "kronograf olmadan ok hızı"). Kullanıcı "1 ve 3" seçti (3 = Çok Açılı Kamera).
   Fizik: telefon atış çizgisinde, sporcunun p metre yanında. Bırakış sesi telefona p/c'de, çarpma sesi √(D²+p²)/c'de gelir.
     uçuş = aralık − (√(D²+p²) − p)/c ;  hız = D / uçuş  (ortalama hız; c = 331,3 + 0,606·°C, varsayılan 20 °C → 343 m/s)
   Algılama (okHiziAnaliz / algilayici, saf — testte sentetik sesle beslenir): tek kutuplu yüksek geçiren (300 Hz) → 1 ms'lik
     enerji kareleri. Başlangıç (onset): enerji > arka plan × 10 VE > son 15 ms ortalaması × 3 VE > mutlak eşik; 40 ms kör süre.
     Bırakış = güçlü başlangıç (arka plan × 30). Çarpma = bırakıştan sonra [tmin, tmax] penceresindeki İLK başlangıç
     (tmin: 110 m/s'den hızlı ok yok; tmax: 12 m/s'den yavaş ok yok). Bulunamazsa atış "çarpma duyulmadı" olur.
   Her atışın ses zarfı saklanır; dalga üstüne dokununca çarpma anı elle düzeltilir (yanlış algılamaya karşı).
   Kayıt: sp.ekipmanBilgisi.hiz[] = { id, t, tarih, mesafe, kmh, giren } (son 100) — ekipmanBilgisi_json ile senkronlanır.
   Canlı: getUserMedia (yankı/gürültü bastırma KAPALI) + ScriptProcessor (iPhone Safari'de de çalışır). Video/ses dosyası:
     decodeAudioData ile aynı algılayıcı tüm dosyada çalışır.
   ================================================================================================ */
(function () {
    'use strict';
    const KARE_MS = 1, KOR_MS = 40, SONRA_KOR_MS = 900, V_MAKS = 110, V_MIN = 12, ESIK = { bg: 10, yakin: 3, guclu: 30, mutlak: 2e-7 };
    const MESAFELER = [10, 18, 25, 30, 50, 70], YAN = [0.5, 1, 2, 3];
    let _oh = null;
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (e) { } };
    const sesHizi = (c) => 331.3 + 0.606 * (c == null ? 20 : c);

    // ---- saf hesap
    function hizHesap(aralikSn, D, p, sicaklik) {
        const c = sesHizi(sicaklik), ucus = aralikSn - (Math.sqrt(D * D + p * p) - p) / c;
        if (!(ucus > 0)) return null;
        const ms = D / ucus; return { ucus, ms, kmh: ms * 3.6 };
    }
    function pencere(D, p, sicaklik) {
        const ek = (Math.sqrt(D * D + p * p) - p) / sesHizi(sicaklik);
        return { tmin: D / V_MAKS + ek, tmax: D / V_MIN + ek };
    }
    // Akış algılayıcı: ornekleri parça parça yer, olayları (atış) geri çağırır. sr: örnekleme hızı.
    function algilayici(sr, ayar, olay) {
        const n = Math.max(8, Math.round(sr * KARE_MS / 1000)), rc = 1 / (2 * Math.PI * 300), dt = 1 / sr, a = rc / (rc + dt);
        const s = { i: 0, kare: 0, top: 0, kn: 0, yP: 0, xP: 0, bg: 0, gecmis: [], sonOnset: -1e9, bekleyen: null, kor: 0, cikis: null, aday: null, ornek: 0, zarf: [], zarfMaks: Math.round(8000 / KARE_MS) };
        const pen = pencere(ayar.D, ayar.p, ayar.c);
        function kareBitti(e, t) {
            s.zarf.push(e); if (s.zarf.length > s.zarfMaks) s.zarf.shift();
            const yakin = s.gecmis.length ? s.gecmis.reduce((x, y) => x + y, 0) / s.gecmis.length : e;
            const bg = s.bg || e;
            const onset = t - s.sonOnset > KOR_MS / 1000 && t >= s.kor && e > ESIK.mutlak && e > bg * ESIK.bg && e > yakin * ESIK.yakin;
            if (onset) {
                s.sonOnset = t;
                if (s.bekleyen && t - s.bekleyen.t >= pen.tmin && t - s.bekleyen.t <= pen.tmax) {
                    const b = s.bekleyen; s.bekleyen = null; s.kor = t + SONRA_KOR_MS / 1000;
                    s.cikis = { bT: b.t, cT: t, zaman: t + 0.25 }; // dalgada çarpmanın sonrası da görünsün diye 250 ms sonra bildirilir
                } else if (!s.bekleyen && !s.aday) {
                    s.aday = { t: t, zirve: e, bg: bg, bitis: t + 0.006 }; // ses karenin ortasında başlayabilir: gücü ilk 6 ms'nin zirvesinden
                }
            }
            if (s.aday) { s.aday.zirve = Math.max(s.aday.zirve, e); if (t >= s.aday.bitis) { const d = s.aday; s.aday = null; if (d.zirve > d.bg * ESIK.guclu) { s.bekleyen = { t: d.t }; olay({ tip: 'birakis', t: d.t }); } } }
            if (s.cikis && t >= s.cikis.zaman) cikisVer();
            if (s.bekleyen && t - s.bekleyen.t > pen.tmax) { const b = s.bekleyen; s.bekleyen = null; olay({ tip: 'kayip', bT: b.t, zarf: zarfKes(b.t, b.t + pen.tmax - 0.2), zarfBas: b.t - 0.1 }); }
            // arka plan: olay yokken yavaş takip (≈0,5 sn), olay sırasında donar
            if (!s.bekleyen && !s.aday && !onset && t >= s.kor) s.bg = s.bg ? s.bg + (Math.min(e, s.bg * 3) - s.bg) * 0.002 * KARE_MS : e;
            s.gecmis.push(e); if (s.gecmis.length > 15) s.gecmis.shift();
        }
        function cikisVer() { const c = s.cikis; s.cikis = null; olay({ tip: 'atis', bT: c.bT, cT: c.cT, zarf: zarfKes(c.bT, c.cT), zarfBas: c.bT - 0.1 }); }
        // zarf: [bırakış−0,1 sn, çarpma+0,25 sn] — kare başına enerji (dalga çizimi ve elle düzeltme için)
        function zarfKes(bT, cT) {
            const simdi = s.ornek / sr, bas = bT - 0.1, son = cT + 0.25;
            const i0 = s.zarf.length - Math.round((simdi - bas) * 1000 / KARE_MS), i1 = s.zarf.length - Math.round((simdi - son) * 1000 / KARE_MS);
            return s.zarf.slice(Math.max(0, i0), Math.min(s.zarf.length, i1));
        }
        return {
            yut(veri) {
                for (let k = 0; k < veri.length; k++) {
                    const x = veri[k], y = a * (s.yP + x - s.xP); s.yP = y; s.xP = x;
                    s.top += y * y; s.kn++;
                    if (s.kn >= n) { const e = s.top / s.kn, t = s.ornek / sr; s.ornek += s.kn; s.kare++; s.top = 0; s.kn = 0; kareBitti(e, t); }
                }
            },
            bitir() { if (s.cikis) cikisVer(); },
            durum: () => ({ bekliyor: !!s.bekleyen, bg: s.bg })
        };
    }
    // Tüm dosya / dizi için: [{bT, cT, aralik, kmh}] + kayıp bırakışlar
    function okHiziAnaliz(veri, sr, ayar) {
        const r = [], al = algilayici(sr, ayar, (o) => { if (o.tip === 'atis') { const h = hizHesap(o.cT - o.bT, ayar.D, ayar.p, ayar.c); r.push({ bT: o.bT, cT: o.cT, aralik: o.cT - o.bT, kmh: h ? h.kmh : null, zarf: o.zarf, zarfBas: o.zarfBas }); } else if (o.tip === 'kayip') r.push({ bT: o.bT, cT: null, kayip: true, zarf: o.zarf, zarfBas: o.zarfBas }); });
        const P = 4096; for (let i = 0; i < veri.length; i += P) al.yut(veri.subarray ? veri.subarray(i, i + P) : veri.slice(i, i + P));
        al.bitir();
        return r;
    }
    window.okHiziAnaliz = okHiziAnaliz; window.okHiziHesap = hizHesap;

    function benzet(kmh) {
        if (kmh >= 250) return 'Formula 1 aracı kadar hızlı 🏎️';
        if (kmh >= 200) return 'Hızlı trenden hızlı 🚄';
        if (kmh >= 150) return 'Şahin dalışı gibi 🦅';
        if (kmh >= 110) return 'Çitadan hızlı 🐆';
        if (kmh >= 70) return 'Yarış atından hızlı 🐎';
        return 'Bisikletliden hızlı 🚲';
    }
    const kmhYaz = (v) => Math.round(v).toLocaleString('tr-TR');

    // ---- kayıt
    function spBul() { return _oh && _oh.g && _oh.ad && turnuvaDB[_oh.g] ? turnuvaDB[_oh.g][_oh.ad] : null; }
    function gecmis() { const sp = spBul(); return sp && sp.ekipmanBilgisi && Array.isArray(sp.ekipmanBilgisi.hiz) ? sp.ekipmanBilgisi.hiz : []; }
    function rekor(mesafe) { return gecmis().filter((h) => h.mesafe === mesafe).reduce((m, h) => Math.max(m, h.kmh), 0); }
    function kaydet(atis) {
        const sp = spBul(); if (!sp || atis.kmh == null) return;
        const eki = ekipmanBos(sp); if (!Array.isArray(eki.hiz)) eki.hiz = [];
        if (atis.kayitId) { const k = eki.hiz.find((h) => h.id === atis.kayitId); if (k) k.kmh = Math.round(atis.kmh * 10) / 10; }
        else { atis.kayitId = 'h_' + Date.now() + '_' + Math.floor(Math.random() * 1000); eki.hiz.push({ id: atis.kayitId, t: Date.now(), tarih: bugunISO(), mesafe: _oh.D, kmh: Math.round(atis.kmh * 10) / 10, giren: ekipmanGiren() }); }
        if (eki.hiz.length > 100) eki.hiz = eki.hiz.slice(-100);
        ekipmanKaydet(sp);
    }
    function kayitSil(atis) {
        const sp = spBul(); if (!sp || !atis.kayitId) return;
        const eki = ekipmanBos(sp); eki.hiz = (eki.hiz || []).filter((h) => h.id !== atis.kayitId); ekipmanKaydet(sp);
    }

    // ---- görünüm
    function css() {
        if ($('oh-stil')) return;
        const st = document.createElement('style'); st.id = 'oh-stil';
        st.textContent = '.oh{position:fixed;inset:0;z-index:99600;background:var(--bg-main,#120804);color:var(--text-main,#fff1e6);overflow:auto;-webkit-overflow-scrolling:touch;font-family:inherit}'
            + '.oh-ic{max-width:520px;margin:0 auto;padding:max(14px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(110px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}'
            + '.oh-ust{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.oh-ust b{font-size:15px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted,#c2a998)}'
            + '.oh-kapat{width:44px;height:44px;border-radius:50%;border:1px solid var(--border-color,#3a2316);background:transparent;color:inherit;font-size:22px;cursor:pointer}'
            + '.oh-baslik{font-size:clamp(30px,8vw,40px);line-height:1.05;font-weight:900;margin:0 0 8px}.oh-alt{color:var(--text-muted,#c2a998);margin:0 0 16px;font-size:15px;line-height:1.45}'
            + '.oh-alan{font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--text-muted,#c2a998);margin:18px 0 8px}'
            + '.oh-cipler{display:flex;flex-wrap:wrap;gap:8px}.oh-cip{min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid var(--border-color,#3a2316);background:transparent;color:inherit;font-weight:700;font-size:15px;cursor:pointer}'
            + '.oh-cip.on{background:var(--accent,#ff7a2e);border-color:transparent;color:#fff}'
            + '.oh-uyari{background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.4);border-radius:12px;padding:10px 12px;font-size:14px;margin:12px 0}'
            + '.oh-sema{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-muted,#c2a998);margin:6px 0 4px}.oh-sema svg{flex:none}'
            + '.oh-alt-bar{position:fixed;left:0;right:0;bottom:0;padding:12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,var(--bg-main,#120804) 30%);display:flex;gap:10px;justify-content:center}'
            + '.oh-alt-bar button{flex:1;max-width:260px;min-height:56px;border-radius:16px;font-weight:900;font-size:17px;cursor:pointer;border:1px solid var(--border-color,#3a2316);background:var(--bg-panel,#1f110a);color:inherit}'
            + '.oh-alt-bar .ana{background:var(--accent,#ff7a2e);border-color:transparent;color:#fff}.oh-alt-bar button:disabled{opacity:.45;cursor:default}'
            + '.oh-dev{text-align:center;margin:8px 0 2px}.oh-dev b{display:block;font-size:clamp(84px,26vw,140px);line-height:.95;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-.02em}'
            + '.oh-dev span{font-size:20px;font-weight:800;color:var(--text-muted,#c2a998)}.oh-dev.yeni b{animation:ohZipla .5s ease-out}'
            + '@keyframes ohZipla{0%{transform:scale(.6);opacity:.2}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}'
            + '.oh-benzet{text-align:center;font-size:18px;font-weight:800;min-height:26px}.oh-rekor{display:inline-block;margin-left:6px;background:#facc15;color:#2a1a00;border-radius:999px;padding:2px 10px;font-size:13px;font-weight:900}'
            + '.oh-durum{display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 0;font-size:15px;color:var(--text-muted,#c2a998)}.oh-nokta{width:10px;height:10px;border-radius:50%;background:#4ade80;animation:ohNabiz 1.4s infinite}.oh-nokta.b{background:#facc15}'
            + '@keyframes ohNabiz{50%{opacity:.3}}'
            + '.oh-dalga{display:block;width:100%;height:96px;background:var(--bg-panel,#1f110a);border:1px solid var(--border-color,#3a2316);border-radius:14px;touch-action:manipulation;cursor:crosshair}'
            + '.oh-dalga-not{font-size:12px;color:var(--text-muted,#c2a998);margin:6px 0 0}'
            + '.oh-liste{margin-top:16px;border-top:1px solid var(--border-color,#3a2316)}.oh-satir{display:grid;grid-template-columns:44px 1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color,#3a2316);font-variant-numeric:tabular-nums}'
            + '.oh-satir b{font-size:20px}.oh-satir small{color:var(--text-muted,#c2a998)}.oh-satir button{background:transparent;border:1px solid var(--border-color,#3a2316);color:inherit;border-radius:10px;min-height:38px;padding:4px 10px;cursor:pointer}'
            + '.oh-satir.sec{background:rgba(255,122,46,.08)}'
            + '@media (prefers-reduced-motion:reduce){.oh-dev.yeni b,.oh-nokta{animation:none}}';
        document.head.appendChild(st);
    }
    function kabuk(ic, bar) {
        let el = $('oh'); if (!el) { el = document.createElement('div'); el.id = 'oh'; el.className = 'oh'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Ok Hızı Ölçer'); document.body.appendChild(el); }
        el.innerHTML = '<div class="oh-ic"><div class="oh-ust"><b>🏹 Ok Hızı</b><button type="button" class="oh-kapat" onclick="okHiziKapat()" aria-label="Kapat">×</button></div>' + ic + '</div>' + (bar ? '<div class="oh-alt-bar">' + bar + '</div>' : '');
    }
    const cip = (ad, on, fn) => '<button type="button" class="oh-cip' + (on ? ' on' : '') + '" aria-pressed="' + !!on + '" onclick="' + fn + '">' + ad + '</button>';
    function sporcular() {
        try { const l = typeof _kmListe !== 'undefined' && Array.isArray(_kmListe) ? _kmListe : []; return l.filter((k) => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); } catch (e) { return []; }
    }
    function hazirlikCiz() {
        _oh.ekran = 'hazir';
        const km = _oh.km ? sporcular() : [];
        const spSec = km.length ? '<p class="oh-alan">SPORCU</p><div class="oh-cipler">' + km.slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr')).map((k) => cip(esc(k.ad), _oh.ad === k.ad && _oh.g === k.g, 'okHiziSporcu(\'' + encodeURIComponent(k.g) + '\',\'' + encodeURIComponent(k.ad).replace(/'/g, '%27') + '\')')).join('') + '</div>'
            : (_oh.ad ? '<p class="oh-alan">SPORCU</p><div class="oh-cipler">' + cip(esc(_oh.ad), true, '') + '</div>' : '<div class="oh-uyari">Derste sporcu yok. Önce Yoklama\'dan derse sporcu ekle.</div>');
        const rk = _oh.ad ? rekor(_oh.D) : 0;
        kabuk('<h1 class="oh-baslik">Okun ne kadar<br>hızlı gidiyor?</h1>'
            + '<p class="oh-alt">Telefon ipin sesini ve okun hedefe çarpma sesini duyar, aradaki süreden hızı hesaplar. Ek alet gerekmez.</p>'
            + '<div class="oh-sema"><svg width="150" height="34" viewBox="0 0 150 34" aria-hidden="true"><circle cx="10" cy="17" r="6" fill="currentColor"/><rect x="6" y="24" width="9" height="6" rx="1.5" fill="var(--accent,#ff7a2e)"/><path d="M20 17h104" stroke="currentColor" stroke-dasharray="4 4"/><circle cx="138" cy="17" r="11" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="138" cy="17" r="4" fill="var(--accent,#ff7a2e)"/></svg><span>Telefonu (turuncu) atış çizgisinde sporcunun yanına koy. Salon sessiz olsun.</span></div>'
            + spSec
            + '<p class="oh-alan">HEDEF MESAFESİ</p><div class="oh-cipler">' + MESAFELER.map((m) => cip(m + ' m', _oh.D === m, 'okHiziAyar(\'D\',' + m + ')')).join('') + '</div>'
            + '<p class="oh-alan">TELEFON SPORCUDAN KAÇ METRE UZAKTA?</p><div class="oh-cipler">' + YAN.map((m) => cip(String(m).replace('.', ',') + ' m', _oh.p === m, 'okHiziAyar(\'p\',' + m + ')')).join('') + '</div>'
            + (rk ? '<p class="oh-alt" style="margin-top:16px">' + esc(_oh.ad) + ' rekoru (' + _oh.D + ' m): <b>' + kmhYaz(rk) + ' km/s</b></p>' : '')
            + '<p class="oh-alan">ÇEKİLMİŞ VİDEO VAR MI?</p><label class="oh-cip" style="display:inline-flex;align-items:center">🎬 Videodan ölç<input type="file" accept="video/*,audio/*" hidden onchange="okHiziDosya(this)"' + (_oh.ad ? '' : ' disabled') + '></label>'
            + '<p class="oh-alt" style="margin-top:8px;font-size:13px">Telefonun kamerasıyla atışı çek, buradan seç. Ses aynı şekilde incelenir.</p>',
            '<button type="button" class="ana" onclick="okHiziBasla()"' + (_oh.ad ? '' : ' disabled') + '>' + (_oh.ad ? '🎤 Dinlemeye başla' : 'Önce sporcu seç') + '</button>');
    }
    function canliCiz(yeni) {
        _oh.ekran = 'canli';
        const son = _oh.atislar.filter((a) => a.kmh != null).slice(-1)[0], rk = rekor(_oh.D), sec = _oh.atislar[_oh.secili] || son || null;
        const rekorMu = son && son.kmh >= rk - 0.05 && _oh.atislar.filter((a) => a.kmh != null).length >= 1 && gecmis().filter((h) => h.mesafe === _oh.D).length > 1;
        const durum = !_oh.dinliyor ? '<span>' + (_oh.dosyadan && !_oh.ses ? '🎬 Videodan ölçüldü · ' + _oh.D + ' m' : 'Duraklatıldı') + '</span>' : _oh.birakisVar ? '<i class="oh-nokta b"></i><span>Bırakış duyuldu, çarpma bekleniyor…</span>' : '<i class="oh-nokta"></i><span>Dinliyor · ' + esc(_oh.ad) + ' · ' + _oh.D + ' m</span>';
        kabuk('<div class="oh-dev' + (yeni ? ' yeni' : '') + '" aria-live="polite"><b>' + (son ? kmhYaz(son.kmh) : '–') + '</b><span>km/s</span></div>'
            + '<div class="oh-benzet">' + (son ? benzet(son.kmh) + (rekorMu ? '<span class="oh-rekor">REKOR</span>' : '') : 'Atışı bekliyorum') + '</div>'
            + '<div class="oh-durum">' + durum + '</div>'
            + (sec && sec.zarf ? '<canvas class="oh-dalga" id="oh-dalga" width="600" height="96" onclick="okHiziDalgaDokun(event)" aria-label="Son atışın sesi: dokununca çarpma anı oraya taşınır"></canvas><p class="oh-dalga-not">' + (sec.kayip ? 'Çarpma duyulmadı. Dalgada çarpma sesine dokunursan hız hesaplanır.' : 'Turuncu çizgi bırakış, yeşil çizgi çarpma. Yanlışsa çarpma sesine dokun.') + '</p>' : '')
            + listeHTML(),
            '<button type="button" onclick="okHiziDuraklat()">' + (_oh.dinliyor ? '⏸ Duraklat' : _oh.ses ? '▶ Devam' : '🎤 Dinle') + '</button><button type="button" class="ana" onclick="okHiziBitir()">Bitir</button>');
        if (sec && sec.zarf) dalgaCiz(sec);
    }
    function listeHTML() {
        if (!_oh.atislar.length) return '';
        return '<div class="oh-liste">' + _oh.atislar.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => '<div class="oh-satir' + (i === _oh.secili ? ' sec' : '') + '"><small>' + (i + 1) + '. ok</small>'
            + (a.kmh != null ? '<span><b>' + kmhYaz(a.kmh) + '</b> <small>km/s · ' + (a.aralik * 1000).toFixed(0) + ' ms</small></span>' : '<span><small>Çarpma duyulmadı</small></span>')
            + '<button type="button" onclick="okHiziSec(' + i + ')">Dalga</button><button type="button" onclick="okHiziAtisSil(' + i + ')" aria-label="' + (i + 1) + '. oku sil">🗑️</button></div>').join('') + '</div>';
    }
    function dalgaCiz(a) {
        const cv = $('oh-dalga'); if (!cv) return;
        const g = cv.getContext('2d'), W = cv.width, H = cv.height, z = a.zarf, n = z.length; if (!n) return;
        const st = getComputedStyle(cv), renk = st.color || '#fff';
        g.clearRect(0, 0, W, H);
        let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.sqrt(z[i]));
        g.fillStyle = renk; g.globalAlpha = 0.75;
        for (let x = 0; x < W; x++) { const i = Math.floor(x / W * n), v = mx ? Math.pow(Math.sqrt(z[i]) / mx, 0.4) : 0, h = Math.max(1, v * (H - 10)); g.fillRect(x, (H - h) / 2, 1, h); }
        g.globalAlpha = 1;
        const xT = (t) => (t - a.zarfBas) / (n * KARE_MS / 1000) * W;
        g.fillStyle = '#ff7a2e'; g.fillRect(Math.round(xT(a.bT)) - 1, 0, 3, H);
        if (a.cT != null) { g.fillStyle = '#4ade80'; g.fillRect(Math.round(xT(a.cT)) - 1, 0, 3, H); }
    }
    function atisEkle(o) {
        const h = o.tip === 'atis' ? hizHesap(o.cT - o.bT, _oh.D, _oh.p, _oh.c) : null;
        const a = { bT: o.bT, cT: o.tip === 'atis' ? o.cT : null, aralik: o.tip === 'atis' ? o.cT - o.bT : null, kmh: h ? h.kmh : null, kayip: o.tip !== 'atis', zarf: o.zarf, zarfBas: o.zarfBas };
        _oh.atislar.push(a); _oh.secili = _oh.atislar.length - 1;
        if (a.kmh != null) { kaydet(a); try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { } }
        return a;
    }

    // ---- canlı ses
    async function mikrofonAc() {
        const akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
        if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) { } }
        const kaynak = ctx.createMediaStreamSource(akis), isl = ctx.createScriptProcessor(2048, 1, 1), sus = ctx.createGain(); sus.gain.value = 0;
        const al = algilayici(ctx.sampleRate, { D: _oh.D, p: _oh.p, c: _oh.c }, (o) => {
            if (!_oh || !_oh.dinliyor) return;
            if (o.tip === 'birakis') { _oh.birakisVar = true; if (_oh.ekran === 'canli') canliCiz(false); return; }
            _oh.birakisVar = false; const a = atisEkle(o); if (_oh.ekran === 'canli') canliCiz(a.kmh != null);
        });
        isl.onaudioprocess = (e) => { if (_oh && _oh.dinliyor) al.yut(e.inputBuffer.getChannelData(0)); };
        kaynak.connect(isl); isl.connect(sus); sus.connect(ctx.destination);
        return { akis, ctx, isl, kaynak };
    }
    function mikrofonKapat() {
        if (!_oh || !_oh.ses) return; const s = _oh.ses; _oh.ses = null;
        try { s.isl.disconnect(); s.kaynak.disconnect(); } catch (e) { }
        try { s.akis.getTracks().forEach((t) => t.stop()); } catch (e) { }
        try { s.ctx.close(); } catch (e) { }
    }
    async function uyanik(ac) {
        try { if (ac && navigator.wakeLock) _oh.kilit = await navigator.wakeLock.request('screen'); else if (!ac && _oh && _oh.kilit) { _oh.kilit.release(); _oh.kilit = null; } } catch (e) { }
    }

    // ---- dışa açık
    window.okHiziAc = function (ops) {
        ops = ops || {};
        let ayar = {}; try { ayar = JSON.parse(localStorage.getItem('dagsk_ok_hizi') || '{}') || {}; } catch (e) { }
        _oh = { km: !!ops.km, g: ops.g || null, ad: ops.ad || null, D: ayar.D || 18, p: ayar.p || 1, c: 20, atislar: [], secili: -1, dinliyor: false, birakisVar: false, ses: null, ekran: 'hazir', sfx: ops.sfx };
        css(); hazirlikCiz();
    };
    window.okHiziKapat = function () { if (!_oh) return; mikrofonKapat(); uyanik(false); const el = $('oh'); if (el) el.remove(); const sfx = _oh.sfx; _oh = null; if (sfx != null) { try { ekipmanYenile(sfx); } catch (e) { } } };
    window.okHiziSporcu = function (gE, aE) { if (!_oh) return; _oh.g = decodeURIComponent(gE); _oh.ad = decodeURIComponent(aE); hazirlikCiz(); };
    window.okHiziAyar = function (k, v) { if (!_oh) return; _oh[k] = v; try { localStorage.setItem('dagsk_ok_hizi', JSON.stringify({ D: _oh.D, p: _oh.p })); } catch (e) { } hazirlikCiz(); };
    window.okHiziBasla = async function () {
        if (!_oh || !_oh.ad) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return tost('Bu tarayıcı mikrofona erişemiyor. "Videodan ölç"ü dene.', 'error');
        try { _oh.ses = await mikrofonAc(); } catch (e) { return tost('Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofona izin ver.', 'error'); }
        _oh.dinliyor = true; _oh.birakisVar = false; uyanik(true); canliCiz(false);
    };
    window.okHiziDuraklat = function () { if (!_oh) return; if (!_oh.ses) return window.okHiziBasla(); _oh.dinliyor = !_oh.dinliyor; _oh.birakisVar = false; canliCiz(false); };
    window.okHiziBitir = function () {
        if (!_oh) return; mikrofonKapat(); uyanik(false); _oh.dinliyor = false;
        const ok = _oh.atislar.filter((a) => a.kmh != null);
        if (ok.length) tost(ok.length + ' ok kaydedildi · en hızlı ' + kmhYaz(Math.max.apply(null, ok.map((a) => a.kmh))) + ' km/s', 'success');
        _oh.atislar = []; _oh.secili = -1; hazirlikCiz();
    };
    window.okHiziSec = function (i) { if (!_oh) return; _oh.secili = i; canliCiz(false); };
    window.okHiziAtisSil = function (i) { if (!_oh) return; const a = _oh.atislar[i]; if (!a) return; kayitSil(a); _oh.atislar.splice(i, 1); _oh.secili = _oh.atislar.length - 1; canliCiz(false); };
    window.okHiziDalgaDokun = function (e) {
        if (!_oh) return; const a = _oh.atislar[_oh.secili]; if (!a || !a.zarf) return;
        const cv = e.currentTarget, r = cv.getBoundingClientRect(), t = a.zarfBas + (e.clientX - r.left) / r.width * a.zarf.length * KARE_MS / 1000;
        if (t <= a.bT + 0.02) return tost('Çarpma, bırakıştan (turuncu) sonra olmalı.', 'warning');
        const h = hizHesap(t - a.bT, _oh.D, _oh.p, _oh.c); if (!h) return;
        a.cT = t; a.aralik = t - a.bT; a.kmh = h.kmh; a.kayip = false; kaydet(a); canliCiz(true);
    };
    window.okHiziDosya = async function (inp) {
        const f = inp.files && inp.files[0]; inp.value = ''; if (!f || !_oh) return;
        tost('Ses inceleniyor…', 'info');
        try {
            const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
            const tampon = await new Promise((ok, hata) => { f.arrayBuffer().then((b) => { const p = ctx.decodeAudioData(b, ok, hata); if (p && p.then) p.then(ok, hata); }, hata); });
            const r = okHiziAnaliz(tampon.getChannelData(0), tampon.sampleRate, { D: _oh.D, p: _oh.p, c: _oh.c });
            try { ctx.close(); } catch (e) { }
            if (!r.length) return tost('Atış sesi bulunamadı. Video sesli mi, salon sessiz mi?', 'warning');
            r.forEach((o) => atisEkle(o.kayip ? { tip: 'kayip', bT: o.bT, zarf: o.zarf, zarfBas: o.zarfBas } : { tip: 'atis', bT: o.bT, cT: o.cT, zarf: o.zarf, zarfBas: o.zarfBas }));
            _oh.dinliyor = false; _oh.dosyadan = true; canliCiz(true);
        } catch (e) { console.error(e); tost('Bu dosyanın sesi okunamadı. Telefonun kamerasıyla çekilmiş bir video dene.', 'error'); }
    };
})();
