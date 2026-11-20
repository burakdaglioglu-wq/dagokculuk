// 🎯 TV "Hedef hatları" görünümü (2026-11-15, v418). Kullanıcı tarayıcıdaki taslaklardan "A ve 2'yi yap" dedi
// (taslak https://claude.ai/artifact/65kYZB6D3zQBGWCK6PcoyW · TV 2). Her hedef bir sütun, salondaki dizilişle aynı: sporcunun
// fotoğrafı (yalnız veli izni olan; yoksa baş harfler), harfi (A/B/C/D), toplamı, son serisi ve "✓ girdi / bekliyor". Çocuk TV'ye
// bakınca kendini hedefinin altında bulur. Üstte seri ve sayaç (yzTimerBaslat #yz-tv-sayac'ı günceller), altta ilk 3 ve kaç kişinin
// girdiği. Sporcuya dokununca skoru girilir. Renk: Kömür / Gece / Kestane (dag_yz_tv_renk, cihaz başına). Yalnız Sıralama Turu
// sürerken; eleme ve sonuçlar Tablo görünümünde kalır. Çizim 1920x1080, pencereye ölçeklenir (Sahne ile aynı yöntem).
var _yzh = { id: null, son: {}, yeni: null, yeniT: 0, imza: '', gizleZ: null, z: null };
var YZH_RENKLER = [
    { id: 'komur', ad: 'Kömür', acik: 'Koyu gri, şeftali vurgu' },
    { id: 'gece', ad: 'Gece', acik: 'Lacivert, skorbord sarısı' },
    { id: 'kestane', ad: 'Kestane', acik: 'Kulüp turuncusu, koyu kahve' }
];
var YZH_YENI_SN = 7000;
function yzhRenk() { try { let r = localStorage.getItem('dag_yz_tv_renk'); return YZH_RENKLER.some(function (x) { return x.id === r; }) ? r : 'komur'; } catch (e) { return 'komur'; } }
function yzhRenkSec(r) {
    try { localStorage.setItem('dag_yz_tv_renk', r); } catch (e) {}
    _yzh.imza = ''; let el = document.getElementById('yz-tv'); if (el && el.classList.contains('yzh-acik')) yzHatlarCiz(el, yzOku());
}
function yzhRenkDegis() { let i = YZH_RENKLER.findIndex(function (x) { return x.id === yzhRenk(); }); let y = YZH_RENKLER[(i + 1) % YZH_RENKLER.length]; yzhRenkSec(y.id); if (typeof showToast === 'function') showToast('🎨 TV rengi: ' + y.ad, 'success'); }
function yzhOlcekle(el) {
    let tv = el.querySelector('.yzh-tv'); if (!tv) return;
    let ust = 0; if (document.documentElement.classList.contains('yz-dev-acik')) { let dv = document.getElementById('yz-dev-sayac'); if (dv) ust = Math.max(0, dv.getBoundingClientRect().bottom - el.getBoundingClientRect().top); }
    let w = el.clientWidth || window.innerWidth, h = (el.clientHeight || window.innerHeight) - ust, k = Math.min(w / 1920, h / 1080);
    let imza = w + 'x' + h + '@' + ust; if (tv._olcek === imza) return; tv._olcek = imza;
    tv.style.transform = 'translate(' + ((w - 1920 * k) / 2).toFixed(1) + 'px,' + (ust + (h - 1080 * k) / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
}
function yzhKontrolGoster() {
    let b = document.getElementById('yzh-kontrol'); if (!b) return;
    b.classList.remove('gizli'); clearTimeout(_yzh.gizleZ);
    _yzh.gizleZ = setTimeout(function () { let b2 = document.getElementById('yzh-kontrol'); if (b2 && !b2.matches(':hover')) b2.classList.add('gizli'); }, 4500);
}
function yzhAvatar(k, px) {
    let ad = yzKAd(k), stil = 'width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.36) + 'px;';
    if (typeof fotoAvatarHTML === 'function') return fotoAvatarHTML('s:' + k, ad, 'yzh-av', false, stil);
    let bas = String(ad).trim().split(/\s+/).slice(0, 2).map(function (s) { return s.charAt(0); }).join('').toLocaleUpperCase('tr-TR');
    return '<span class="yzh-av" style="' + stil + '">' + esc(bas) + '</span>';
}
// Her 1 sn: ölçek + "az önce girildi" vurgusunun bitişi
function yzhTik() {
    let el = document.getElementById('yz-tv'); if (!el || !el.classList.contains('yzh-acik')) { clearInterval(_yzh.z); _yzh.z = null; return; }
    yzhOlcekle(el);
    if (_yzh.yeni && Date.now() - _yzh.yeniT > YZH_YENI_SN) { _yzh.yeni = null; _yzh.imza = ''; yzHatlarCiz(el, yzOku()); }
}
function yzHatlarCiz(el, o) {
    yzhCss();
    let d = o.durum; if (!d || d.asama !== 'tur') return;
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), sira = yzSiraIsaretle(d, yzSiralama(o)), siraMap = {}, hed = d.hedefler || {};
    sira.forEach(function (r) { siraMap[r.k] = r; });
    if (_yzh.id !== d.id) _yzh = { id: d.id, son: {}, yeni: null, yeniT: 0, imza: '', gizleZ: null, z: _yzh.z };
    if (!el.classList.contains('yzh-acik') || !el.querySelector('.yzh-tv')) {
        el.classList.remove('yzs-acik', 'kagit', 'serit-var', 'hs-sayac'); el.classList.add('yzh-acik');
        el.innerHTML = '<div class="yzh-tv" id="yzh-tv"></div><div class="yzh-kontrol" id="yzh-kontrol"></div>';
        _yzh.imza = '';
        el.addEventListener('pointermove', yzhKontrolGoster); el.addEventListener('pointerdown', yzhKontrolGoster);
        setTimeout(yzhKontrolGoster, 50);
    }
    if (!_yzh.z) _yzh.z = setInterval(yzhTik, 1000);
    // az önce skoru girilen
    let ilk = !Object.keys(_yzh.son).length;
    sira.forEach(function (r) { let im = r.seriT.join(','); if (!ilk && _yzh.son[r.k] != null && _yzh.son[r.k] !== im) { _yzh.yeni = r.k; _yzh.yeniT = Date.now(); } _yzh.son[r.k] = im; });
    // hedeflere göre grupla (1A, 1B … → hedef 1)
    let gruplar = {}, sayilar = [];
    yzHedefSirasi(o).forEach(function (k) {
        let m = /^(\d+)\s*([A-Z]?)$/i.exec(String(hed[k] || '')), no = m ? +m[1] : 0, harf = m ? m[2].toUpperCase() : '';
        if (!gruplar[no]) { gruplar[no] = []; sayilar.push(no); }
        gruplar[no].push({ k: k, harf: harf });
    });
    sayilar.sort(function (a, b) { return a - b; });
    let nH = Math.max(1, sayilar.length), hb = Math.max(1, Math.max.apply(null, sayilar.map(function (n) { return gruplar[n].length; })));
    let satir = nH <= 8 ? 1 : nH <= 16 ? 2 : 3, sutun = Math.ceil(nH / satir);
    let govdeH = 770, kartH = (govdeH - (satir - 1) * 16) / satir, slotH = (kartH - 66) / hb, kartW = (1840 - (sutun - 1) * 16) / sutun;
    // dikey: foto üstte, altında ad + toplam + sıra (~3.7 satır yazı); sığmazsa foto küçülür, çok sığmazsa yatay (foto solda)
    let fsD = Math.round(Math.max(15, Math.min(28, kartW / 10, slotH * 0.13))), avD = Math.min(slotH - fsD * 3.8 - 30, kartW * 0.48, 124);
    let dikey = avD >= 40 || kartW < 300; // dar sütunda yan yana sığmaz: foto üstte kalır, küçülür
    let fs = dikey ? fsD : Math.round(Math.max(14, Math.min(26, kartW / 13, slotH * 0.28)));
    let av = Math.round(dikey ? Math.max(30, avD) : Math.max(30, Math.min(slotH - 16, kartW * 0.22, 84)));
    let bek = yzBekleyenler(o, seri), girdi = d.katilimci.length - bek.length;
    let yeni = _yzh.yeni && Date.now() - _yzh.yeniT <= YZH_YENI_SN ? _yzh.yeni : null;
    let slot = function (x) {
        let r = siraMap[x.k] || { toplam: 0, sira: '–', seriT: [] }, sk = yzSkor(o, x.k), bu = sk[seri], son = null, siraVar = r.toplam > 0 && !yzSiraGizli(d, r); // v439 sıralama modu
        for (let i = sk.length - 1; i >= 0; i--) if (sk[i]) { son = yzTop(sk[i]); break; }
        return '<button type="button" class="yzh-s' + (dikey ? ' dikey' : '') + (siraVar && r.sira === 1 ? ' lider' : '') + (x.k === yeni ? ' yeni' : '') + '" onclick="yzGirisAc(\'' + yzEnc(x.k) + '\',' + seri + ')">'
            + '<span class="harf">' + esc(x.harf) + '</span><span class="dur' + (bu ? ' ok' : '') + '">' + (bu ? '✓ +' + yzTop(bu) : 'bekliyor') + '</span>'
            + yzhAvatar(x.k, av)
            + '<span class="bilgi"><span class="ad">' + esc(yzKisaAd(yzKAd(x.k))) + '</span>'
            + '<span class="rakam"><b>' + r.toplam + '</b><small>' + (son != null ? 'son ' + son : 'henüz yok') + '</small></span>'
            + '<span class="sira">' + (siraVar ? (r.sira === 1 ? '👑 ' : '') + r.sira + '. sırada' : '&nbsp;') + '</span></span></button>';
    };
    let govde = sayilar.map(function (n) {
        let sl = gruplar[n].map(slot).join(''); for (let i = gruplar[n].length; i < hb; i++) sl += '<div class="yzh-s bos"></div>';
        return '<div class="yzh-h"><div class="yzh-hb"><b>' + (n ? '<small>HEDEF</small> ' + n : 'HEDEFSİZ') + '</b>' + (kartW >= 260 ? yzhHedefIkon() : '') + '</div>' + sl + '</div>';
    }).join('');
    let ilk3 = yzSiraModu(d) === 'karisik' ? [] : sira.filter(function (r) { return r.toplam > 0; }).slice(0, 3);
    let html = '<div class="yzh-bas"><div class="yzh-kim"><small>DAĞ S.K.</small><b>SIRALAMA TURU</b><span>' + esc(yzKatEtiket(d)) + esc(d.ayar.mesafe) + ' · ' + esc(f.ad) + ' · ' + d.katilimci.length + ' sporcu, ' + nH + ' hedef</span></div>'
        + '<div class="yzh-seri"><small>SERİ</small><b>' + (seri + 1) + '<i>/' + f.seri + '</i></b></div>' + yzSayacHTML(o, 'yz-tv-sayac') + '</div>'
        + '<div class="yzh-govde" style="grid-template-columns:repeat(' + sutun + ',minmax(0,1fr));grid-template-rows:repeat(' + satir + ',minmax(0,1fr));--av:' + av + 'px;--fs:' + fs + 'px">' + govde + '</div>'
        + '<div class="yzh-alt">' + (ilk3.length ? '<span class="et">Şu an ilk 3</span>' + ilk3.map(function (r, i) { return '<span class="ilk">' + yzhAvatar(r.k, 48) + '<span>' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(yzKisaAd(yzKAd(r.k))) + '</span><b>' + r.toplam + '</b></span>'; }).join('') : '<span class="et">İlk skor girilince sıralama burada</span>')
        + '<span class="say' + (bek.length ? '' : ' tamam') + '">' + (bek.length ? '✓ ' + girdi + '/' + d.katilimci.length + ' sporcu ' + (seri + 1) + '. seriyi girdi' : '✓ Herkes girdi · sıradaki seri') + '</span></div>';
    let tv = el.querySelector('#yzh-tv'), renk = yzhRenk();
    let imza = html + renk;
    if (imza !== _yzh.imza) { _yzh.imza = imza; tv.setAttribute('data-renk', renk); tv.innerHTML = html; tv._olcek = null; }
    yzhOlcekle(el);
    el.querySelector('#yzh-kontrol').innerHTML = '<button class="yz-tv-k" onclick="yzTvKapat()">✕ Kapat</button>' + yzTvKontrolHTML(o)
        + '<button class="yz-tv-k" onclick="yzhRenkDegis()" title="TV rengi: Kömür / Gece / Kestane">🎨 ' + YZH_RENKLER.find(function (x) { return x.id === renk; }).ad + '</button>'
        + '<button class="yz-tv-k" onclick="yzTvGorunumSec(\'kartlar\')" title="Işıklı Kartlar">✨ Kartlar</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'sahne\')" title="Son skoru gireni büyük gösterir">🎭 Sahne</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'tablo\')" title="Eski tablo görünümü">📋 Tablo</button>';
}
function yzhHedefIkon() { return '<svg viewBox="-1 -1 2 2" class="yzh-ikon" aria-hidden="true"><circle r="1" fill="#f1f1ec"/><circle r=".8" fill="#25262b"/><circle r=".6" fill="#2ea5de"/><circle r=".4" fill="#e8463b"/><circle r=".2" fill="#f7d23e"/></svg>'; }
function yzhCss() {
    if (document.getElementById('yzh-css')) return;
    if (!document.getElementById('yzh-font')) { let l = document.createElement('link'); l.id = 'yzh-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap'; document.head.appendChild(l); }
    let st = document.createElement('style'); st.id = 'yzh-css';
    st.textContent = [
        '#yz-tv.yzh-acik{padding:0!important;overflow:hidden;background:#0b0b0d!important}',
        '.yzh-tv{--z:#18181b;--p:#232327;--k:#2c2c32;--y:#f4f4f5;--s:#a1a1aa;--v:#f59e5b;--i:#5ec98b;--c:rgba(255,255,255,.08)}',
        '.yzh-tv[data-renk="gece"]{--z:#07101d;--p:#0f1d33;--k:#152844;--y:#eaf1fb;--s:#8ea3bf;--v:#fbbf24;--i:#4ade80;--c:rgba(142,163,191,.16)}',
        '.yzh-tv[data-renk="kestane"]{--z:#170a06;--p:#28120a;--k:#371a0f;--y:#fff1e6;--s:#d6ab90;--v:#fd8e01;--i:#7bd88f;--c:rgba(253,142,1,.16)}',
        '#yz-tv.yzh-acik .yzh-tv{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;box-sizing:border-box;padding:36px 40px 30px;display:flex;flex-direction:column;gap:18px;background:var(--z);color:var(--y);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}',
        '.yzh-bas{display:flex;align-items:center;gap:26px;height:150px;flex:none}',
        '.yzh-kim small{display:block;font-size:22px;font-weight:800;letter-spacing:.32em;color:var(--v)}',
        '.yzh-kim b{display:block;font-family:"Barlow Condensed",Impact,"Arial Narrow",sans-serif;font-size:72px;line-height:1;font-weight:800}',
        '.yzh-kim span{display:block;font-size:23px;color:var(--s);margin-top:4px}',
        '.yzh-seri{margin-left:auto;text-align:center;background:var(--p);border:1px solid var(--c);border-radius:24px;padding:12px 30px}',
        '.yzh-seri small{display:block;font-size:18px;font-weight:800;letter-spacing:.22em;color:var(--s)}',
        '.yzh-seri b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:84px;line-height:1}.yzh-seri b i{font-style:normal;font-size:44px;color:var(--s)}',
        '#yz-tv.yzh-acik .yzh-bas .yz-sayac{display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:340px;height:140px;padding:0 30px;border-radius:24px;background:var(--k);color:var(--y);box-shadow:none;border:0;margin:0}',
        '#yz-tv.yzh-acik .yzh-bas .yz-sayac .yz-sayac-alt{font:900 22px Inter,system-ui,sans-serif;letter-spacing:.24em}',
        '#yz-tv.yzh-acik .yzh-bas .yz-sayac .yz-sayac-sure{font-family:"Barlow Condensed",Impact,sans-serif;font-size:96px;font-weight:800;line-height:.95;font-variant-numeric:tabular-nums}',
        '#yz-tv.yzh-acik .yz-sayac.hazirlik{background:#e5484d;color:#fff}#yz-tv.yzh-acik .yz-sayac.atis{background:var(--i);color:#062214}#yz-tv.yzh-acik .yz-sayac.son{background:#f1c75b;color:#2b2000}#yz-tv.yzh-acik .yz-sayac.bitti{background:#7f1d1d;color:#fff}',
        '.yzh-govde{flex:1;min-height:0;display:grid;gap:16px}',
        '.yzh-h{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--p);border:1px solid var(--c);border-radius:24px;overflow:hidden}',
        '.yzh-hb{flex:none;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:var(--k)}',
        '.yzh-hb b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:50px;line-height:1;letter-spacing:.02em;white-space:nowrap}.yzh-hb b small{font-size:.6em;color:var(--s)}.yzh-ikon{width:46px;height:46px}',
        '.yzh-s{position:relative;flex:1 1 0;min-height:0;overflow:hidden;display:flex;align-items:center;gap:14px;padding:8px 14px;border:0;border-top:1px solid var(--c);background:transparent;color:var(--y);font:inherit;font-size:var(--fs);text-align:left;cursor:pointer;transition:background .4s}',
        '.yzh-s:first-of-type{border-top:0}.yzh-s.bos{cursor:default}',
        '.yzh-s.dikey{flex-direction:column;justify-content:center;text-align:center;gap:4px;padding:8px 8px}',
        '.yzh-s .yzh-av{flex:none;border-radius:50%;display:grid;place-items:center;background:var(--k);background-size:cover;background-position:center;color:var(--s);font-weight:800;box-shadow:0 0 0 3px var(--c)}',
        '.yzh-s .bilgi{display:flex;flex-direction:column;gap:2px;min-width:0;align-items:inherit}.yzh-s.dikey .bilgi{align-items:center;max-width:100%}',
        '.yzh-s .ad{font-weight:800;font-size:1em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
        '.yzh-s .rakam{display:flex;gap:10px;align-items:baseline}.yzh-s .rakam b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:1.9em;line-height:1;font-variant-numeric:tabular-nums}.yzh-s .rakam small{font-size:.72em;color:var(--s)}',
        '.yzh-s .sira{font-size:.66em;font-weight:800;color:var(--v)}',
        '.yzh-s .harf{position:absolute;top:8px;left:12px;font-family:"Barlow Condensed",Impact,sans-serif;font-size:1.15em;font-weight:800;color:var(--s)}',
        '.yzh-s:not(.dikey) .harf{position:static;min-width:.8em}',
        '.yzh-s .dur{position:absolute;top:8px;right:10px;font-size:.6em;font-weight:900;padding:3px 10px;border-radius:999px;background:var(--k);color:var(--s)}.yzh-s .dur.ok{background:var(--i);color:#062214}',
        '.yzh-s:not(.dikey) .dur{top:50%;transform:translateY(-50%)}',
        '.yzh-s.lider{background:color-mix(in srgb,var(--v) 13%,transparent)}.yzh-s.lider .yzh-av{box-shadow:0 0 0 4px var(--v)}',
        '.yzh-s.yeni{background:color-mix(in srgb,var(--i) 22%,transparent);animation:yzhYeni 1.2s ease-out}@keyframes yzhYeni{0%{background:color-mix(in srgb,var(--i) 55%,transparent)}}',
        '.yzh-alt{flex:none;height:72px;display:flex;align-items:center;gap:16px;font-size:24px}',
        '.yzh-alt .et{color:var(--s);font-weight:700}',
        '.yzh-alt .ilk{display:flex;align-items:center;gap:12px;background:var(--p);border-radius:999px;padding:6px 22px 6px 6px;font-weight:700}.yzh-alt .ilk .yzh-av{border-radius:50%;display:grid;place-items:center;background:var(--k);background-size:cover;color:var(--s);font-weight:800}',
        '.yzh-alt .ilk b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:36px}',
        '.yzh-alt .say{margin-left:auto;color:var(--s);font-weight:700}.yzh-alt .say.tamam{color:var(--i)}',
        '.yzh-kontrol{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;padding:14px max(16px,env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,#000d 45%);transition:opacity .4s}',
        '.yzh-kontrol.gizli{opacity:0;pointer-events:none}.yzh-kontrol .yz-tv-kontrol{display:contents}',
        '@media (prefers-reduced-motion:reduce){.yzh-s{transition:none;animation:none!important}}'
    ].join('\n');
    document.head.appendChild(st);
}
