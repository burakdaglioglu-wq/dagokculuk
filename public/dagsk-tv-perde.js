// 🎬 TV "İki perde" görünümü (2026-11-26, v470). Kullanıcı TV taslaklarından B'yi seçti
// (https://claude.ai/artifact/EpqhVs8DJtGajpEKCB5g28). TV dersin anına göre kendini değiştirir, koç bir şeye dokunmaz:
//  · ATIŞ perdesi — seri süresi işlerken (hatta geç / atış / son 30): dev halka sayaç, "N. SERİ · ATIŞ", hedef hedef hattakiler
//    yüzleriyle (bu seriyi henüz girmemiş olan parlak, girmiş olan soluk).
//  · PUAN perdesi — süre yokken / bitince: puan duvarı (her çocuk bir kart, bu serinin puanı; girilince kart dönerek açılır) ve
//    sağda son girenin hedefi (okları nereye gittiyse orada, "Puan + yön" / "Hedefe dokun" ile girildiyse) + kendi rekoruna göre not.
//  · Seri tamamlanınca merak anı: "N. serinin en çok gelişeni…" adı bulanıktan açılır (kendi bu tur ortalamasına göre; başkasıyla
//    kıyas yok, sıra numarası yok). Çizim 1920x1080, pencereye ölçeklenir (Hatlar ile aynı yöntem). Yalnız Sıralama Turu sürerken.
var _yzp = { id: null, son: {}, yeni: null, yeniT: 0, imza: '', gizleZ: null, z: null, acilis: null, acilan: {}, perde: null };
var YZP_YENI_SN = 9000, YZP_ACILIS_SN = 9000, YZP_BULANIK_SN = 2400;
function yzpOlcekle(el) {
    let tv = el.querySelector('.yzp-tv'); if (!tv) return;
    let ust = 0; if (document.documentElement.classList.contains('yz-dev-acik')) { let dv = document.getElementById('yz-dev-sayac'); if (dv) ust = Math.max(0, dv.getBoundingClientRect().bottom - el.getBoundingClientRect().top); }
    let w = el.clientWidth || window.innerWidth, h = (el.clientHeight || window.innerHeight) - ust, k = Math.min(w / 1920, h / 1080);
    let imza = w + 'x' + h + '@' + ust; if (tv._olcek === imza) return; tv._olcek = imza;
    tv.style.transform = 'translate(' + ((w - 1920 * k) / 2).toFixed(1) + 'px,' + (ust + (h - 1080 * k) / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
}
function yzpKontrolGoster() {
    let b = document.getElementById('yzp-kontrol'); if (!b) return;
    b.classList.remove('gizli'); clearTimeout(_yzp.gizleZ);
    _yzp.gizleZ = setTimeout(function () { let b2 = document.getElementById('yzp-kontrol'); if (b2 && !b2.matches(':hover')) b2.classList.add('gizli'); }, 4500);
}
function yzpAvatar(k, px, cls) {
    let ad = yzKAd(k), stil = 'width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.36) + 'px;';
    if (typeof fotoAvatarHTML === 'function') return fotoAvatarHTML('s:' + k, ad, 'yzp-av' + (cls ? ' ' + cls : ''), false, stil);
    let bas = String(ad).trim().split(/\s+/).slice(0, 2).map(function (s) { return s.charAt(0); }).join('').toLocaleUpperCase('tr-TR');
    return '<span class="yzp-av' + (cls ? ' ' + cls : '') + '" style="' + stil + '">' + esc(bas) + '</span>';
}
// Hangi perde: seri süresi işliyorsa atış, yoksa puan
function yzpPerde(o) { let s = yzSayacDurum(o); return ['hazirlik', 'atis', 'son'].indexOf(s.faz) !== -1 ? 'atis' : 'puan'; }
// Halka: kalan oran (hazırlıkta hazırlık süresine göre)
function yzpOran(o) {
    let s = o.sayac, d = o.durum; if (!s || !d || s.seri !== d.seri) return 1;
    let g = (Date.now() - s.basla) / 1000;
    if (g < s.hazir) return Math.max(0, 1 - g / Math.max(1, s.hazir));
    return Math.max(0, Math.min(1, 1 - (g - s.hazir) / Math.max(1, s.sure)));
}
function yzpTik() {
    let el = document.getElementById('yz-tv'); if (!el || !el.classList.contains('yzp-acik')) { clearInterval(_yzp.z); _yzp.z = null; return; }
    yzpOlcekle(el);
    let o = yzOku();
    if (!o.durum || o.durum.asama !== 'tur') return;
    let yay = el.querySelector('.yzp-halka-ilerle');
    if (yay) { let C = +yay.getAttribute('data-c'); yay.style.strokeDashoffset = (C * (1 - yzpOran(o))).toFixed(1); }
    let perde = yzpPerde(o), yeniBitti = _yzp.yeni && Date.now() - _yzp.yeniT > YZP_YENI_SN, ac = _yzp.acilis;
    let acDegisti = ac && ((!ac.acik && Date.now() - ac.t > YZP_BULANIK_SN) || Date.now() - ac.t > YZP_ACILIS_SN);
    if (perde !== _yzp.perde || yeniBitti || acDegisti) { if (yeniBitti) _yzp.yeni = null; yzPerdeCiz(el, o); }
}
// Seri tamam → en çok gelişen (bu serisi − bu turdaki önceki serilerinin ortalaması; en az 1 önceki seri)
function yzpGelisen(o, seri) {
    let d = o.durum, en = null;
    d.katilimci.forEach(function (k) {
        let sk = yzSkor(o, k), bu = sk[seri]; if (!bu) return;
        let onceki = []; for (let i = 0; i < seri; i++) if (sk[i]) onceki.push(yzTop(sk[i]));
        if (!onceki.length) return;
        let ort = onceki.reduce(function (a, b) { return a + b; }, 0) / onceki.length, fark = yzTop(bu) - ort;
        if (fark > 0 && (!en || fark > en.fark)) en = { k: k, fark: fark };
    });
    return en;
}
function yzpHedefSvg(o, k, seri) {
    let d = o.durum, yuz = yzYuz(d), n = yuz.halka || 10, kon = (o[yzPKey(d.id, k)] || [])[seri] || [];
    let renk = ['#f7d23e', '#f7d23e', '#e8463b', '#e8463b', '#2ea5de', '#2ea5de', '#2b2f38', '#2b2f38', '#eceef2', '#eceef2'].slice(0, n).reverse();
    let c = ''; for (let i = 0; i < n; i++) c += '<circle r="' + (1 - i / n).toFixed(3) + '" fill="' + renk[i] + '" stroke="rgba(0,0,0,.28)" stroke-width=".006"/>';
    c += '<circle r=".012" fill="#111"/>';
    let ok = (Array.isArray(kon) ? kon : []).filter(function (p) { return p && isFinite(p.x) && isFinite(p.y); }).map(function (p, i) {
        let x = Math.max(-1.02, Math.min(1.02, +p.x)), y = Math.max(-1.02, Math.min(1.02, +p.y));
        return '<g class="yzp-pin" style="animation-delay:' + (0.25 + i * 0.18).toFixed(2) + 's" transform="translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ')"><circle r=".07" fill="#0a0f1a" stroke="#fff" stroke-width=".016"/><text y=".028" text-anchor="middle" font-size=".08" font-weight="800" fill="#fff">' + (p.n || i + 1) + '</text></g>';
    }).join('');
    return '<svg class="yzp-hedef" viewBox="-1.08 -1.08 2.16 2.16" aria-hidden="true">' + c + ok + '</svg>';
}
function yzpTop(p) {
    let v = YZ_DEGER[p] || 0, r = p === 'M' ? 'm' : v >= 9 ? 's' : v >= 7 ? 'k' : v >= 5 ? 'm2' : v >= 3 ? 'y' : 'b';
    return '<span class="yzp-top ' + r + '">' + esc(p) + '</span>';
}
function yzPerdeCiz(el, o) {
    yzpCss();
    let d = o.durum; if (!d || d.asama !== 'tur') return;
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), hed = d.hedefler || {}, n = d.katilimci.length;
    if (_yzp.id !== d.id) _yzp = { id: d.id, son: {}, yeni: null, yeniT: 0, imza: '', gizleZ: null, z: _yzp.z, acilis: null, acilan: {}, perde: null };
    if (!el.classList.contains('yzp-acik') || !el.querySelector('.yzp-tv')) {
        el.classList.remove('yzs-acik', 'yzh-acik', 'yzk-acik', 'kagit', 'serit-var', 'hs-sayac'); el.classList.add('yzp-acik');
        el.innerHTML = '<div class="yzp-tv" id="yzp-tv"></div><div class="yzp-kontrol" id="yzp-kontrol"></div>';
        _yzp.imza = '';
        el.addEventListener('pointermove', yzpKontrolGoster); el.addEventListener('pointerdown', yzpKontrolGoster);
        setTimeout(yzpKontrolGoster, 50);
    }
    if (!_yzp.z) _yzp.z = setInterval(yzpTik, 250);
    // az önce girilen (bu serinin skoru değişen)
    let ilk = !Object.keys(_yzp.son).length;
    d.katilimci.forEach(function (k) { let sk = yzSkor(o, k)[seri], im = seri + ':' + (sk ? sk.join(',') : ''); if (!ilk && _yzp.son[k] != null && _yzp.son[k] !== im && sk) { _yzp.yeni = k; _yzp.yeniT = Date.now(); } _yzp.son[k] = im; });
    let bek = yzBekleyenler(o, seri), girdi = n - bek.length;
    // seri tamam → merak anı (bir kez)
    let anahtar = d.id + ':' + seri;
    if (!bek.length && n >= 3 && !_yzp.acilan[anahtar] && !ilk) {
        _yzp.acilan[anahtar] = 1; let g = yzpGelisen(o, seri);
        if (g) _yzp.acilis = { k: g.k, fark: g.fark, seri: seri, t: Date.now(), acik: false };
    }
    if (ilk && !bek.length) _yzp.acilan[anahtar] = 1;
    let ac = _yzp.acilis; if (ac && Date.now() - ac.t > YZP_ACILIS_SN) ac = _yzp.acilis = null;
    if (ac) ac.acik = Date.now() - ac.t > YZP_BULANIK_SN;
    let perde = yzpPerde(o), gir = _yzp.perde !== perde ? ' gir' : ''; _yzp.perde = perde;
    let ust = '<div class="yzp-bas"><span class="sol">DAĞ S.K. · ' + esc(yzKatEtiket(d)) + 'SIRALAMA TURU</span><span class="sag">' + esc(d.ayar.mesafe) + ' · SERİ <b>' + (seri + 1) + '</b>/' + f.seri + ' · <b>' + girdi + '</b>/' + n + ' girdi</span></div>';
    let html;
    if (perde === 'atis') {
        let s = yzSayacDurum(o), R = 46, C = 2 * Math.PI * R;
        let gruplar = {}, sayilar = [];
        yzHedefSirasi(o).forEach(function (k) { let m = /^(\d+)\s*([A-Z]?)$/i.exec(String(hed[k] || '')), no = m ? +m[1] : 0; if (!gruplar[no]) { gruplar[no] = []; sayilar.push(no); } gruplar[no].push({ k: k, harf: m ? m[2].toUpperCase() : '' }); });
        sayilar.sort(function (a, b) { return a - b; });
        let nH = sayilar.length, sut = nH <= 4 ? 2 : nH <= 9 ? 3 : 4, av = n <= 12 ? 64 : n <= 20 ? 52 : 42;
        let hatlar = sayilar.map(function (no) {
            return '<div class="yzp-hk"><b class="no">' + (no || '–') + '</b><div class="kisi">' + gruplar[no].map(function (x) {
                let gir = !!yzSkor(o, x.k)[seri];
                return '<span class="yzp-ki' + (gir ? ' girdi' : '') + '">' + yzpAvatar(x.k, av) + '<span>' + esc(yzKisaAd(yzKAd(x.k))) + '</span></span>';
            }).join('') + '</div></div>';
        }).join('');
        let baslik = s.faz === 'hazirlik' ? 'Hatta<br><em>geçin</em>' : s.faz === 'son' ? 'Son<br><em>saniyeler</em>' : '<em>' + (seri + 1) + '.</em> seri<br>atış';
        html = '<div class="yzp-perde atis' + gir + '">' + ust + '<div class="yzp-atis">'
            + '<div class="yzp-halka ' + s.faz + '"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5.5"/><circle class="yzp-halka-ilerle" data-c="' + C.toFixed(1) + '" cx="50" cy="50" r="' + R + '" fill="none" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - yzpOran(o))).toFixed(1) + '"/></svg>'
            + '<div class="ic">' + yzSayacHTML(o, 'yz-tv-sayac') + '</div></div>'
            + '<div class="yzp-sag"><h2>' + baslik + '</h2><p>Hatta olanlar · hedef hedef</p><div class="yzp-hatlar" style="grid-template-columns:repeat(' + sut + ',minmax(0,1fr))">' + hatlar + '</div></div>'
            + '</div></div>';
    } else {
        let cols = n <= 6 ? 2 : n <= 12 ? 3 : n <= 20 ? 4 : n <= 30 ? 5 : 6, rows = Math.max(1, Math.ceil(n / cols)), av = rows <= 4 ? 54 : rows <= 6 ? 42 : 32;
        let duvar = yzHedefSirasi(o).map(function (k) {
            let bu = yzSkor(o, k)[seri], tp = 0; yzSkor(o, k).forEach(function (x) { if (x) tp += yzTop(x); });
            return '<button type="button" class="yzp-kart' + (bu ? ' girdi' : ' bek') + (k === _yzp.yeni ? ' yeni' : '') + '" onclick="yzGirisAc(\'' + yzEnc(k) + '\',' + seri + ')">'
                + '<span class="ust">' + yzpAvatar(k, av) + '<b>' + esc(yzKisaAd(yzKAd(k))) + '</b><i>' + esc(hed[k] || '') + '</i></span>'
                + '<span class="alt"><span class="pu">' + (bu ? yzTop(bu) : '–') + '</span><span class="dur">' + (bu ? '✓ GİRDİ' : 'BEKLİYOR') + '<small>Toplam ' + tp + '</small></span></span></button>';
        }).join('');
        // son giren (yoksa bu seride en son kaydı olan / hiç yoksa bilgi)
        let sk = _yzp.yeni && yzSkor(o, _yzp.yeni)[seri] ? _yzp.yeni : (_yzp.sonGoster && yzSkor(o, _yzp.sonGoster)[seri] ? _yzp.sonGoster : null);
        if (_yzp.yeni) _yzp.sonGoster = _yzp.yeni;
        let spot;
        if (sk) {
            let oklar = yzSkor(o, sk)[seri], top = yzTop(oklar), not = '';
            try { let en = typeof yaEnIyiSeri === 'function' ? yaEnIyiSeri(o, sk, seri) : null; if (en && en.n >= 3 && en.enIyi != null) not = top > en.enIyi ? "🌟 Yeni kendi rekoru!" : top === en.enIyi ? "Kendi rekoruna eşit!" : "Kendi rekoruna " + (en.enIyi - top) + " kaldı"; } catch (e) {}
            spot = '<div class="yzp-spot"><small>SON GİREN · ' + esc(hed[sk] || '') + '</small><div class="kim">' + yzpAvatar(sk, 76) + '<h3>' + esc(yzKAd(sk)) + '</h3></div>'
                + '<div class="hedef-kap">' + yzpHedefSvg(o, sk, seri) + '</div>'
                + '<div class="toplar">' + oklar.map(yzpTop).join('') + '</div>'
                + '<div class="satir"><b>' + top + '</b><span>bu seri' + (not ? '<em>' + not + '</em>' : '') + '</span></div></div>';
        } else spot = '<div class="yzp-spot bos"><small>SON GİREN</small><h3>Puan girildikçe<br>burada görünür</h3><p>Okları "Puan + yön" ya da "Hedefe dokun" ile girersen hedefte nereye gittiği de çıkar.</p></div>';
        let acHTML = '';
        if (ac) acHTML = '<div class="yzp-acilis' + (ac.acik ? '' : ' ilk') + '"><small>' + (ac.seri + 1) + '. SERİNİN EN ÇOK GELİŞENİ</small>' + yzpAvatar(ac.k, 170, ac.acik ? '' : 'bulanik') + '<h2 class="' + (ac.acik ? 'acik' : 'bulanik') + '">' + esc(yzKAd(ac.k)) + '</h2><p>' + (ac.acik ? 'Kendi ortalamasından +' + Math.round(ac.fark) + ' puan' : 'Kim olabilir?') + '</p></div>';
        html = '<div class="yzp-perde puan' + gir + '">' + ust + '<div class="yzp-puan"><div class="yzp-duvar" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));grid-template-rows:repeat(' + rows + ',minmax(0,1fr));--av:' + av + 'px">' + duvar + '</div>' + spot + '</div>'
            + '<div class="yzp-alt">' + yzSayacHTML(o, 'yz-tv-sayac') + '<span class="' + (bek.length ? '' : 'tamam') + '">' + (bek.length ? bek.length + ' sporcu bekliyor' : '✓ Herkes girdi · sıradaki seri') + '</span></div>' + acHTML + '</div>';
    }
    let tv = el.querySelector('#yzp-tv'), imza = html.replace(' gir"', '"');
    if (imza !== _yzp.imza) { _yzp.imza = imza; tv.innerHTML = html; tv._olcek = null; }
    yzpOlcekle(el);
    el.querySelector('#yzp-kontrol').innerHTML = '<button class="yz-tv-k" onclick="yzTvKapat()">✕ Kapat</button>' + yzTvKontrolHTML(o)
        + '<button class="yz-tv-k" onclick="yzTvGorunumSec(\'hatlar\')" title="Her hedef bir sütun">🎯 Hatlar</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'sahne\')" title="Son skoru gireni büyük gösterir">🎭 Sahne</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'tablo\')" title="Eski tablo görünümü">📋 Tablo</button>';
}
function yzpCss() {
    if (document.getElementById('yzp-css')) return;
    if (!document.getElementById('yzh-font')) { let l = document.createElement('link'); l.id = 'yzh-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap'; document.head.appendChild(l); }
    let st = document.createElement('style'); st.id = 'yzp-css';
    let B = '"Barlow Condensed",Impact,"Arial Narrow",sans-serif';
    st.textContent = [
        '#yz-tv.yzp-acik{padding:0!important;overflow:hidden;background:#0a0f1a!important}',
        '#yz-tv.yzp-acik .yzp-tv{--z:#0d1424;--p:#141d31;--k:#1b2640;--y:#f3f5fa;--s:#8f9bb5;--a:#f5c542;--v:#f59e5b;--i:#34d399;--r:#ef4444;--c:rgba(255,255,255,.08);position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;box-sizing:border-box;background:radial-gradient(120% 90% at 50% 0%,#13203a,var(--z) 60%);color:var(--y);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}',
        '.yzp-perde{position:absolute;inset:0}.yzp-perde.gir{animation:yzpGir .6s ease-out}@keyframes yzpGir{from{opacity:0;transform:scale(.98)}}',
        '.yzp-bas{position:absolute;left:44px;right:44px;top:30px;height:50px;display:flex;align-items:center;justify-content:space-between;font-family:' + B + ';font-weight:800}',
        '.yzp-bas .sol{font-size:28px;letter-spacing:.3em;color:var(--a)}.yzp-bas .sag{font-size:30px;color:var(--s)}.yzp-bas .sag b{color:var(--y);font-size:42px}',
        // atış
        '.yzp-atis{position:absolute;inset:100px 60px 60px;display:grid;grid-template-columns:740px 1fr;align-items:center;gap:60px}',
        '.yzp-halka{position:relative;width:700px;height:700px;justify-self:center}.yzp-halka svg{width:100%;height:100%;transform:rotate(-90deg)}',
        '.yzp-halka-ilerle{stroke:var(--i);transition:stroke-dashoffset .3s linear,stroke .4s}.yzp-halka.son .yzp-halka-ilerle{stroke:var(--a)}.yzp-halka.hazirlik .yzp-halka-ilerle{stroke:var(--r)}',
        '.yzp-halka .ic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}',
        '#yz-tv.yzp-acik .yzp-halka .yz-sayac{background:none!important;box-shadow:none;border:0;min-width:0;padding:0;color:var(--y)!important;display:flex;flex-direction:column;align-items:center}',
        '#yz-tv.yzp-acik .yzp-halka .yz-sayac-alt{font:900 34px Inter,system-ui,sans-serif;letter-spacing:.35em;color:var(--s)}',
        '#yz-tv.yzp-acik .yzp-halka .yz-sayac-sure{font-family:' + B + ';font-size:240px;font-weight:800;line-height:.9;font-variant-numeric:tabular-nums}',
        '#yz-tv.yzp-acik .yzp-halka .yz-sayac.son .yz-sayac-sure{color:var(--a)}#yz-tv.yzp-acik .yzp-halka .yz-sayac.hazirlik .yz-sayac-sure{color:var(--r)}',
        '.yzp-sag{min-width:0}.yzp-sag h2{margin:0;font-family:' + B + ';font-size:150px;font-weight:800;line-height:.92}.yzp-sag h2 em{font-style:normal;color:var(--v)}',
        '.yzp-sag p{margin:18px 0 22px;font-size:30px;color:var(--s);font-weight:700}',
        '.yzp-hatlar{display:grid;gap:14px}',
        '.yzp-hk{display:flex;align-items:center;gap:16px;padding:14px 18px;border-radius:20px;background:var(--p);border:1px solid var(--c);min-width:0}',
        '.yzp-hk .no{font-family:' + B + ';font-size:58px;color:var(--v);width:52px;text-align:center;flex:none}',
        '.yzp-hk .kisi{display:flex;flex-wrap:wrap;gap:10px 16px;min-width:0}',
        '.yzp-ki{display:flex;align-items:center;gap:10px;font-size:25px;font-weight:800;min-width:0}.yzp-ki span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}',
        '.yzp-ki.girdi{opacity:.4}',
        '.yzp-av{flex:none;border-radius:50%;display:grid;place-items:center;background:var(--k);background-size:cover;background-position:center;color:#c9d3ea;font-weight:900;box-shadow:0 0 0 3px var(--c)}',
        // puan
        '.yzp-puan{position:absolute;left:44px;right:44px;top:100px;bottom:96px;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:36px}',
        '.yzp-duvar{display:grid;grid-auto-flow:row;gap:12px;min-height:0;perspective:1200px}',
        '.yzp-kart{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:6px;min-width:0;min-height:0;overflow:hidden;padding:12px 16px;border-radius:18px;background:var(--p);border:1.5px solid var(--c);color:var(--y);font:inherit;text-align:left;cursor:pointer;transition:background .5s,border-color .5s}',
        '.yzp-kart .ust{display:flex;align-items:center;gap:12px;min-width:0}',
        '.yzp-kart .ust b{flex:1;min-width:0;font-size:26px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.yzp-kart .ust i{font-style:normal;font-family:' + B + ';font-size:26px;color:var(--s);font-weight:800}',
        '.yzp-kart .alt{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}',
        '.yzp-kart .pu{font-family:' + B + ';font-size:64px;font-weight:800;line-height:.9;font-variant-numeric:tabular-nums}',
        '.yzp-kart .dur{font-size:17px;letter-spacing:.14em;font-weight:900;color:var(--s);text-align:right;display:flex;flex-direction:column;gap:3px}.yzp-kart .dur small{letter-spacing:0;font-size:18px;font-weight:700}',
        '.yzp-kart.bek{background:transparent;border-style:dashed}.yzp-kart.bek .pu{color:#33405c}.yzp-kart.bek .yzp-av{opacity:.55}',
        '.yzp-kart.girdi .dur{color:var(--i)}.yzp-kart.girdi .dur small{color:var(--s)}',
        '.yzp-kart.yeni{background:rgba(52,211,153,.16);border-color:var(--i);animation:yzpCevir .6s ease-out}@keyframes yzpCevir{from{transform:rotateY(90deg)}}',
        '.yzp-spot{border-radius:28px;background:linear-gradient(170deg,#1d2a47,#111a2e);border:1px solid rgba(245,197,66,.25);padding:28px 32px;display:flex;flex-direction:column;gap:14px;min-width:0;min-height:0;overflow:hidden}',
        '.yzp-spot small{font-size:20px;letter-spacing:.25em;color:var(--a);font-weight:900}',
        '.yzp-spot .kim{display:flex;align-items:center;gap:18px;min-width:0}.yzp-spot h3{margin:0;font-size:50px;font-weight:900;line-height:1.05;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.yzp-spot .hedef-kap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.yzp-hedef{height:100%;max-height:100%;max-width:100%;aspect-ratio:1}',
        '.yzp-pin{animation:yzpPin .45s cubic-bezier(.2,1.6,.4,1) both}@keyframes yzpPin{from{opacity:0}}',
        '.yzp-spot .toplar{display:flex;gap:10px;flex-wrap:wrap}',
        '.yzp-top{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-family:' + B + ';font-size:32px;font-weight:800;color:#111}',
        '.yzp-top.s{background:#f7d23e}.yzp-top.k{background:#e8463b;color:#fff}.yzp-top.m2{background:#2ea5de;color:#fff}.yzp-top.y{background:#2b2f38;color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}.yzp-top.b{background:#eceef2}.yzp-top.m{background:transparent;color:var(--s);box-shadow:inset 0 0 0 3px var(--s)}',
        '.yzp-spot .satir{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}',
        '.yzp-spot .satir b{font-family:' + B + ';font-size:120px;line-height:.85;font-weight:800}',
        '.yzp-spot .satir span{font-size:24px;color:var(--s);font-weight:700;text-align:right}.yzp-spot .satir em{display:block;font-style:normal;color:var(--i);font-weight:900;font-size:32px;margin-top:4px}',
        '.yzp-spot.bos{justify-content:center;align-items:flex-start}.yzp-spot.bos h3{white-space:normal;color:var(--s)}.yzp-spot.bos p{font-size:24px;color:var(--s);line-height:1.4;margin:0}',
        '.yzp-alt{position:absolute;left:44px;right:44px;bottom:22px;height:58px;display:flex;align-items:center;gap:22px;font-size:26px;font-weight:700;color:var(--s)}.yzp-alt .tamam{color:var(--i)}',
        '#yz-tv.yzp-acik .yzp-alt .yz-sayac{flex-direction:row;gap:12px;min-width:0;padding:6px 20px;border-radius:999px;background:var(--k);color:var(--y);box-shadow:none;border:0}',
        '#yz-tv.yzp-acik .yzp-alt .yz-sayac-alt{font-size:17px}#yz-tv.yzp-acik .yzp-alt .yz-sayac-sure{font-family:' + B + ';font-size:40px;line-height:1}',
        '#yz-tv.yzp-acik .yzp-alt .yz-sayac.bitti{background:#7f1d1d}#yz-tv.yzp-acik .yzp-alt .yz-sayac.mola{background:#0f4c75}',
        '.yzp-acilis{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:rgba(6,10,18,.86);text-align:center;z-index:3}.yzp-acilis.ilk{animation:yzpGir .5s ease-out}',
        '.yzp-acilis small{font-size:34px;letter-spacing:.3em;font-weight:900;color:var(--a)}',
        '.yzp-acilis h2{margin:0;font-size:120px;font-weight:900;line-height:1}.yzp-acilis p{margin:0;font-size:40px;color:var(--s);font-weight:700}',
        '.yzp-acilis .bulanik{filter:blur(28px)}.yzp-acilis h2.acik,.yzp-acilis .yzp-av{transition:filter 1.2s}',
        '.yzp-acilis h2.acik{animation:yzpAcil 1.2s ease-out}@keyframes yzpAcil{from{filter:blur(28px)}}',
        '.yzp-kontrol{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;padding:14px max(16px,env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,#000d 45%);transition:opacity .4s}',
        '.yzp-kontrol.gizli{opacity:0;pointer-events:none}.yzp-kontrol .yz-tv-kontrol{display:contents}',
        '@media (prefers-reduced-motion:reduce){.yzp-perde,.yzp-kart.yeni,.yzp-pin,.yzp-acilis,.yzp-acilis h2.acik{animation:none!important}.yzp-halka-ilerle{transition:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
