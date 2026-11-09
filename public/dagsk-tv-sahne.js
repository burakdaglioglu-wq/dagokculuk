// 🎭 TV Sahne görünümü (2026-11-08, v388). Kullanıcı 3 TV taslağından C'yi seçti: "Sahne güzel gibi, alternatif olarak bunu da ekle,
// temalardan değiştirebileyim şu ankini de, ama bu yaptığın ilk açtığımda açılsın" (taslak https://claude.ai/artifact/43fdFyYUffDLpriSSZDCHw).
// Son skoru giren sporcu sahneye çıkar: büyük hedefte bu serinin okları numarasıyla tek tek düşer, önceki seriler soluk; seri puanı sayarak
// yazılır, toplam ve sıra dev. Sağda herkesin canlı sıralaması (satır yeni yerine kayar, dokununca o sporcunun skoru girilir). Altta seriyi
// bekleyenler. Sayaç sol üstte (yzTimerBaslat #yz-tv-sayac'ı günceller). TV'den yönetim düğmeleri altta, fare/dokunuşla görünür.
// Yalnız Sıralama Turu sürerken; eleme ve sonuçlar (podyum, tören) Tablo görünümünde kalır. Çizim 1920x1080, pencereye ölçeklenir.
// Tek görünüm (koyu sahne), tema yok. Tablo görünümüne: ⋯ Diğer › Tema › TV görünümü ya da alttaki 📋 Tablo.
var _yzs = { id: null, son: {}, spot: null, spotImza: '', gizleZ: null, kur: false };
var YZS_RENK = { s: '#f7d23e', k: '#e8463b', m: '#2ea5de', y: '#25262b', b: '#f1f1ec', M: '#4a4f5a' };
var YZS_YAZI = { s: '#2a2200', k: '#fff', m: '#04202e', y: '#fff', b: '#222', M: '#fff' };
function yzsRenkAnahtar(v) { if (v === 'M') return 'M'; let n = v === 'X' ? 10 : +v; return n >= 9 ? 's' : n >= 7 ? 'k' : n >= 5 ? 'm' : n >= 3 ? 'y' : 'b'; }
function yzsHedefSVG(halka, simdi, onceki, anim) {
    let s = '<svg class="yzs-hedef" viewBox="-1.14 -1.14 2.28 2.28" aria-hidden="true">';
    for (let i = halka; i >= 1; i--) { let v = 11 - i, a = yzsRenkAnahtar(String(v)); s += '<circle r="' + (i / halka).toFixed(4) + '" fill="' + YZS_RENK[a] + '" stroke="' + (a === 'y' ? '#ffffff55' : '#00000038') + '" stroke-width=".006"/>'; }
    s += '<circle r="' + (1 / (2 * halka)).toFixed(4) + '" fill="none" stroke="#0006" stroke-width=".005"/>';
    onceki.forEach(function (p) { s += '<circle cx="' + p.x + '" cy="' + p.y + '" r=".032" fill="#fff" fill-opacity=".55" stroke="#000" stroke-opacity=".5" stroke-width=".01"/>'; });
    simdi.forEach(function (p, j) {
        s += '<g class="yzs-pin' + (anim ? ' dus' : '') + '" style="animation-delay:' + (anim ? (0.25 + j * 0.32).toFixed(2) : 0) + 's"><circle cx="' + p.x + '" cy="' + p.y + '" r=".075" fill="#111" stroke="#fff" stroke-width=".018"/>'
            + '<text x="' + p.x + '" y="' + (p.y + 0.04).toFixed(3) + '" text-anchor="middle" font-size=".1" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">' + (p.n || j + 1) + '</text></g>';
    });
    return s + '</svg>';
}
function yzsAdBoy(ad) { let en = String(ad).split(/\s+/).reduce(function (m, w) { return Math.max(m, w.length); }, 1); return Math.max(54, Math.min(112, Math.floor(436 / (en * 0.5)))); }
function yzsOlcekle(el) {
    let tv = el.querySelector('.yzs-tv'); if (!tv) return;
    let ust = 0; if (document.documentElement.classList.contains('yz-dev-acik')) { let dv = document.getElementById('yz-dev-sayac'); if (dv) ust = Math.max(0, dv.getBoundingClientRect().bottom - el.getBoundingClientRect().top); }
    let w = el.clientWidth || window.innerWidth, h = (el.clientHeight || window.innerHeight) - ust, k = Math.min(w / 1920, h / 1080);
    let imza = w + 'x' + h + '@' + ust; if (tv._olcek === imza) return; tv._olcek = imza;
    tv.style.transform = 'translate(' + ((w - 1920 * k) / 2).toFixed(1) + 'px,' + (ust + (h - 1080 * k) / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
}
function yzsKontrolGoster() {
    let b = document.getElementById('yzs-kontrol'); if (!b) return;
    b.classList.remove('gizli'); clearTimeout(_yzs.gizleZ);
    _yzs.gizleZ = setTimeout(function () { let b2 = document.getElementById('yzs-kontrol'); if (b2 && !b2.matches(':hover')) b2.classList.add('gizli'); }, 4500);
}
// ⏱ Süre başlayınca sırayla (2026-11-08, kullanıcı: "süre başlayınca sporcuların atışları ekranda animasyon ile gözüksün, sırayla geçmesi lazım").
// Hatta geçiş / atış / son 30 sn boyunca sahne her 5,5 sn'de hedef sırasındaki bir sonraki sporcuya geçer (skoru olanlar); okları yeniden düşer.
// Yeni skor gelince o sporcu 8 sn sahnede kalır, sonra sıra ondan devam eder. Süre yokken son skoru giren kalır. Ölçek de burada izlenir (büyük sayaç açılıp kapanır).
var YZS_DON_SN = 5500, YZS_YENI_BEKLE = 8000;
function yzsDon() {
    let el = document.getElementById('yz-tv'); if (!el || !el.classList.contains('yzs-acik')) { clearInterval(_yzs.donZ); _yzs.donZ = null; return; }
    yzsOlcekle(el);
    let o = yzOku(), d = o.durum; if (!d || d.asama !== 'tur') return;
    if (yzsMolaAktif(o)) { yzsMolaCiz(el, o, true); return; } // ☕ molada analiz slaytları döner
    if (_yzs.mola) { _yzs.mola = null; _yzs.spotImza = ''; yzSahneCiz(el, o); }
    let faz = yzSayacDurum(o).faz, simdi = Date.now();
    if (faz !== 'hazirlik' && faz !== 'atis' && faz !== 'son') { _yzs.donT = 0; return; }
    if (!_yzs.donT) { _yzs.donT = simdi; return; }
    if (simdi - _yzs.donT < YZS_DON_SN || simdi - (_yzs.yeniT || 0) < YZS_YENI_BEKLE) return;
    let l = yzHedefSirasi(o).filter(function (k) { return yzSkor(o, k).some(Boolean); }); if (l.length < 2) return;
    _yzs.spot = l[(l.indexOf(_yzs.spot) + 1) % l.length]; _yzs.spotImza = ''; _yzs.donT = simdi; _yzs.sirada = true;
    yzSahneCiz(el, o);
}
function yzSahneCiz(el, o) {
    yzsCss();
    let d = o.durum, f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), sira = yzSiralama(o), yuz = yzYuz(d), siraMap = {};
    sira.forEach(function (r) { siraMap[r.k] = r; });
    if (_yzs.id !== d.id) { _yzs = { id: d.id, son: {}, spot: null, spotImza: '', gizleZ: null, kur: false }; }
    if (!el.classList.contains('yzs-acik') || !el.querySelector('.yzs-tv')) {
        el.classList.add('yzs-acik'); el.classList.remove('kagit', 'serit-var', 'hs-sayac');
        el.innerHTML = '<div class="yzs-tv"><div class="yzs-sol"><div class="yzs-ust" id="yzs-ust"></div><div class="yzs-sahne" id="yzs-sahne"></div><div class="yzs-bek" id="yzs-bek"></div></div>'
            + '<div class="yzs-tablo"><h3>SIRALAMA</h3><div class="yzs-tkap" id="yzs-tab"></div></div></div><div class="yzs-kontrol" id="yzs-kontrol"></div>';
        _yzs.spotImza = '';
        el.addEventListener('pointermove', yzsKontrolGoster); el.addEventListener('pointerdown', yzsKontrolGoster);
        setTimeout(yzsKontrolGoster, 50);
    }
    yzsOlcekle(el);
    // sahneye kim çıkar: skoru son değişen sporcu (ilk açılışta bu seride en son girilen, yoksa lider)
    let degisen = null, ilk = !Object.keys(_yzs.son).length;
    sira.forEach(function (r) { let im = r.seriT.join(','); if (!ilk && _yzs.son[r.k] != null && _yzs.son[r.k] !== im) degisen = r.k; _yzs.son[r.k] = im; });
    if (degisen) { _yzs.spot = degisen; _yzs.yeniT = Date.now(); _yzs.donT = Date.now(); _yzs.sirada = false; }
    if (!_yzs.donZ) _yzs.donZ = setInterval(yzsDon, 500);
    if (!_yzs.spot || d.katilimci.indexOf(_yzs.spot) === -1) { let g = yzHedefSirasi(o).filter(function (k) { return yzSkor(o, k)[seri]; }); _yzs.spot = g.length ? g[g.length - 1] : (sira[0] && sira[0].k) || null; }
    // üst: sayaç + seri
    let bek = yzBekleyenler(o, seri);
    el.querySelector('#yzs-ust').innerHTML = yzSayacHTML(o, 'yz-tv-sayac') + '<div class="yzs-seri"><small>SERİ</small><b>' + (seri + 1) + '<span>/' + f.seri + '</span></b></div>'
        + '<div class="yzs-kimlik"><small>DAĞ S.K. · ' + esc(d.ayar.mesafe) + '</small><b>SIRALAMA TURU</b></div>';
    // sahne
    let sk = _yzs.spot, sahne = el.querySelector('#yzs-sahne'), molaV = yzsMolaAktif(o);
    if (molaV) { _yzs.spotImza = ''; yzsMolaCiz(el, o, false); }
    else if (sk) {
        let skor = yzSkor(o, sk), sSeri = skor[seri] ? seri : (function () { for (let i = skor.length - 1; i >= 0; i--) if (skor[i]) return i; return -1; })();
        let imza = sk + '|' + (siraMap[sk] ? siraMap[sk].seriT.join(',') : '') + '|' + sSeri + '|' + yuz.halka;
        if (imza !== _yzs.spotImza) {
            let anim = !!degisen || !_yzs.spotImza; _yzs.spotImza = imza;
            let kon = yzKonumlar(o, sk), simdi = kon.filter(function (p) { return p.seri === sSeri; }).sort(function (a, b) { return (a.n || 99) - (b.n || 99); }), onceki = kon.filter(function (p) { return p.seri !== sSeri; }).slice(-60);
            let oklar = sSeri >= 0 ? skor[sSeri] : [], r = siraMap[sk] || { toplam: 0, sira: '-' }, sp = sSeri >= 0 ? yzTop(oklar) : 0;
            sahne.classList.remove('gir'); void sahne.offsetWidth; if (anim) sahne.classList.add('gir');
            sahne.innerHTML = yzsHedefSVG(yuz.halka, simdi, onceki, anim)
                + '<div class="yzs-kim"><small>' + esc((d.hedefler || {})[sk] || '') + (sSeri >= 0 ? ' · ' + (sSeri + 1) + '. SERİ' : '') + (_yzs.sirada ? ' · SIRAYLA' : '') + '</small><div class="yzs-ad" style="font-size:' + yzsAdBoy(yzKAd(sk)) + 'px">' + esc(yzKAd(sk)) + '</div>'
                + '<div class="yzs-oklar">' + oklar.map(function (v, j) { let a = yzsRenkAnahtar(v); return '<i style="background:' + YZS_RENK[a] + ';color:' + YZS_YAZI[a] + ';animation-delay:' + (anim ? (0.3 + j * 0.32).toFixed(2) : 0) + 's"' + (anim ? '' : ' class="dur"') + '>' + esc(v) + '</i>'; }).join('') + '</div>'
                + '<div class="yzs-sayi"><div><small>SERİ</small><b data-say="' + sp + '">' + (anim ? 0 : sp) + '</b></div><div><small>TOPLAM</small><b>' + r.toplam + '</b></div><div class="sira"><small>SIRA</small><b>' + r.sira + '.</b></div></div>'
                + (simdi.length ? '' : '<div class="yzs-not">' + (oklar.length ? 'Bu serinin okları hedefte işaretlenmedi' : 'Henüz skor yok') + '</div>') + '</div>';
            if (anim) { let b = sahne.querySelector('[data-say]'), hedef = sp, t0 = performance.now() + 300; (function k(t) { if (!b.isConnected) return; let q = Math.max(0, Math.min(1, (t - t0) / 1900)); b.textContent = Math.round(hedef * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(k); })(t0); }
        }
    } else sahne.innerHTML = '<div class="yzs-kim"><div class="yzs-ad">DAĞ S.K.</div><div class="yzs-not">İlk skor girilince burada</div></div>';
    // bekleyenler
    if (!molaV) el.querySelector('#yzs-bek').innerHTML = bek.length ? '<em>Bu seriyi bekleyenler (' + bek.length + ')</em>' + bek.map(function (k) { return '<span>' + esc(yzKisaAd(yzKAd(k))) + '</span>'; }).join('') : '<em>✓ Herkes girdi · sıradaki seri</em>';
    // sıralama: kalıcı satırlar, yeni yere kayar
    let tab = el.querySelector('#yzs-tab'), n = Math.max(1, sira.length), satH = Math.max(26, Math.min(58, Math.floor(930 / n))), fs = Math.round(satH * 0.68);
    tab.querySelectorAll('.yzs-tsat').forEach(function (s) { if (!siraMap[s.getAttribute('data-k')]) s.remove(); });
    sira.forEach(function (r, i) {
        let sat = null; tab.querySelectorAll('.yzs-tsat').forEach(function (s) { if (s.getAttribute('data-k') === r.k) sat = s; });
        if (!sat) { sat = document.createElement('button'); sat.type = 'button'; sat.className = 'yzs-tsat'; sat.setAttribute('data-k', r.k); sat.style.top = (i * satH) + 'px'; sat.innerHTML = '<span class="r"></span><span class="n"></span><span class="s"></span><span class="t"></span>'; tab.appendChild(sat); }
        sat.onclick = function () { yzGirisAc(yzEnc(r.k), seri); };
        sat.style.top = (i * satH) + 'px'; sat.style.height = satH + 'px'; sat.style.fontSize = fs + 'px';
        sat.classList.toggle('ilk3', r.sira <= 3); sat.classList.toggle('aktif', r.k === sk);
        let t = yzSkor(o, r.k)[seri];
        sat.querySelector('.r').textContent = r.sira; sat.querySelector('.n').textContent = yzKisaAd(yzKAd(r.k)); sat.querySelector('.s').textContent = t ? '+' + yzTop(t) : ''; sat.querySelector('.t').textContent = r.toplam;
    });
    // yönetim düğmeleri
    el.querySelector('#yzs-kontrol').innerHTML = '<button class="yz-tv-k" onclick="yzTvKapat()">✕ Kapat</button>' + yzTvKontrolHTML(o) + '<button class="yz-tv-k" onclick="yzTvGorunumSec(\'tablo\')" title="Eski tablo görünümü">📋 Tablo</button>';
}
function yzsCss() {
    if (document.getElementById('yzs-css')) return;
    if (!document.getElementById('yzs-font')) { let l = document.createElement('link'); l.id = 'yzs-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&display=swap'; document.head.appendChild(l); }
    let st = document.createElement('style'); st.id = 'yzs-css';
    st.textContent = [
        '#yz-tv.yzs-acik{background:radial-gradient(1100px 820px at 26% 55%,#3a1608 0%,#170905 55%,#0c0604 100%)!important;padding:0!important;overflow:hidden;color:#fff4e6}',
        '#yz-tv.yzs-acik .yzs-tv{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;font-family:"Big Shoulders Display","Saira Condensed","Arial Narrow",system-ui,sans-serif}',
        '.yzs-sol{position:absolute;left:56px;top:40px;bottom:40px;width:1080px}',
        '.yzs-ust{position:absolute;left:0;top:0;right:0;height:120px;display:flex;align-items:center;gap:28px}',
        '#yz-tv.yzs-acik .yzs-ust .yz-sayac{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-width:300px;height:116px;padding:0 34px;border-radius:999px;background:#3b302a;color:#fff;transition:background .4s;box-shadow:none;border:0;margin:0}',
        '#yz-tv.yzs-acik .yzs-ust .yz-sayac .yz-sayac-alt{font:800 22px system-ui,sans-serif;letter-spacing:.25em;opacity:.9}',
        '#yz-tv.yzs-acik .yzs-ust .yz-sayac .yz-sayac-sure{font-size:84px;font-weight:900;line-height:.9;font-variant-numeric:tabular-nums}',
        '#yz-tv.yzs-acik .yz-sayac.hazirlik{background:#e53935;color:#fff}#yz-tv.yzs-acik .yz-sayac.atis{background:#1fbf6b;color:#03140b}#yz-tv.yzs-acik .yz-sayac.son{background:#ffc93c;color:#1d1400}#yz-tv.yzs-acik .yz-sayac.bitti{background:#7f1d1d;color:#fff}',
        '.yzs-seri small,.yzs-kimlik small{display:block;font:800 22px system-ui,sans-serif;letter-spacing:.3em;color:#ff8a3d}',
        '.yzs-seri b{font-size:96px;font-weight:900;line-height:.9}.yzs-seri b span{font-size:50px;opacity:.6}',
        '.yzs-kimlik{margin-left:auto;text-align:right}.yzs-kimlik b{font-size:56px;font-weight:900;line-height:1}',
        '.yzs-sahne.gir{animation:yzsGir .5s ease-out}@keyframes yzsGir{from{opacity:0;transform:translateX(40px)}}',
        '.yzs-sahne{position:absolute;left:0;right:0;top:150px;bottom:110px;display:grid;grid-template-columns:600px minmax(0,1fr);gap:44px;align-items:center}',
        '.yzs-hedef{width:600px;height:600px;filter:drop-shadow(0 30px 50px #000a)}',
        '.yzs-pin{transform-box:fill-box;transform-origin:center}.yzs-pin.dus{animation:yzsDus .55s cubic-bezier(.2,1.6,.4,1) backwards}',
        '@keyframes yzsDus{0%{transform:translate(40%,-260%) scale(1.6);opacity:0}55%{opacity:1}100%{transform:none}}',
        '.yzs-kim small{display:block;font:800 24px system-ui,sans-serif;letter-spacing:.3em;color:#ff8a3d}',
        '.yzs-ad{font-size:112px;font-weight:900;line-height:.92;text-transform:uppercase;overflow-wrap:normal;word-break:keep-all}',
        '.yzs-oklar{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 18px}',
        '.yzs-oklar i{font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:34px;font-weight:900;animation:yzsPop .55s cubic-bezier(.2,1.8,.4,1) backwards}.yzs-oklar i.dur{animation:none}',
        '@keyframes yzsPop{0%{transform:scale(.2);opacity:0}65%{transform:scale(1.2);opacity:1}100%{transform:none}}',
        '.yzs-sayi{display:flex;gap:48px;align-items:flex-end}.yzs-sayi small{display:block;font:700 22px system-ui,sans-serif;opacity:.7}.yzs-sayi b{font-size:130px;font-weight:900;line-height:.85;font-variant-numeric:tabular-nums}.yzs-sayi .sira b{color:#ff8a3d}',
        '.yzs-not{font:700 26px system-ui,sans-serif;opacity:.6;margin-top:14px}',
        '.yzs-bek{position:absolute;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;overflow:hidden;font:700 24px system-ui,sans-serif;white-space:nowrap}',
        '.yzs-bek span{flex-shrink:0;background:#ffffff16;border-radius:999px;padding:8px 16px}.yzs-bek em{font-style:normal;opacity:.75;margin-right:6px;flex-shrink:0}',
        '.yzs-tablo{position:absolute;right:56px;top:40px;bottom:40px;width:680px;background:#00000055;border:2px solid #ffffff14;border-radius:28px;padding:20px 22px}',
        '.yzs-tablo h3{margin:0 0 10px;font:800 22px system-ui,sans-serif;letter-spacing:.3em;color:#ff8a3d}',
        '.yzs-tkap{position:relative;height:930px}',
        '.yzs-tsat{position:absolute;left:0;right:0;display:grid;grid-template-columns:1.6em minmax(0,1fr) 2.4em 2.8em;align-items:center;gap:.35em;padding:0 .3em;border:0;border-radius:10px;background:transparent;color:#fff4e6;font-family:inherit;font-weight:800;text-align:left;cursor:pointer;transition:top .9s cubic-bezier(.3,1.25,.5,1),background .3s}',
        '.yzs-tsat:hover{background:#ffffff10}.yzs-tsat .r{text-align:center;color:#ffb27a}.yzs-tsat .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yzs-tsat .s{text-align:right;color:#ffffffaa;font-size:.8em}.yzs-tsat .t{text-align:right;font-variant-numeric:tabular-nums}',
        '.yzs-tsat.ilk3 .r{color:#ffc93c}.yzs-tsat.aktif{background:linear-gradient(90deg,#ff6a1a66,transparent)}',
        '.yzs-kontrol{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;padding:14px max(16px,env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,#000d 45%);transition:opacity .4s}',
        '.yzs-kontrol.gizli{opacity:0;pointer-events:none}.yzs-kontrol .yz-tv-kontrol{display:contents}',
        '@media (prefers-reduced-motion:reduce){.yzs-tsat{transition:none}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ☕ MOLA ANALİZİ (2026-11-09, v398; kullanıcı: "molada sporcular dönmüyor; bütün okların sıcak analizi, görseller güzel olsun, merak ettirsin" —
// "Tablo kısmında yapmışsın ama Sahne kısmında yapmamışsın"). Mola sürerken sahne slayt gibi döner:
//   🔥 sınıfın ısı haritası (bu turun bütün okları) → 🥁 ödül kartları ("Merkeze en yakın grup kimin?" — 2,4 sn bulanık, sonra açılır)
//   → aralarda her sporcunun kendi ısı haritası + seri çubukları. Yalnız hedefe dokunarak girilmiş oklar haritaya girer.
var YZS_MOLA_SN = 8500, YZS_ODUL_SN = 10000;
var YZS_TERMAL = [[0, [56, 189, 248]], [0.3, [74, 222, 128]], [0.55, [250, 204, 21]], [0.78, [249, 115, 22]], [1, [220, 38, 38]]];
function yzsMolaAktif(o) { let m = typeof yzMolaDurum === 'function' ? yzMolaDurum(o) : null; return m && !m.bitti ? m : null; }
function yzsTermal(a) { for (let i = 1; i < YZS_TERMAL.length; i++) if (a <= YZS_TERMAL[i][0]) { let p = YZS_TERMAL[i - 1], q = YZS_TERMAL[i], t = (a - p[0]) / (q[0] - p[0]); return [0, 1, 2].map(function (j) { return p[1][j] + (q[1][j] - p[1][j]) * t; }); } return YZS_TERMAL[4][1]; }
// Her ok yumuşak bir leke; yoğunluk mavi → yeşil → sarı → turuncu → kırmızı, kademe sınırlarında eş yükselti çizgisi
function yzsIsiCiz(cv, pts, W, rad) {
    cv.width = cv.height = W; let c = cv.getContext('2d'); if (!c || !pts.length) return;
    let b = function (x) { return (x + 1.14) / 2.28 * W; }, R = W * (rad || 0.1);
    pts.forEach(function (p) { let x = b(p.x), y = b(p.y), g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - R, y - R, 2 * R, 2 * R); });
    let im = c.getImageData(0, 0, W, W), px = im.data, n = W * W, A = new Float32Array(n), mx = 0;
    for (let i = 0; i < n; i++) { A[i] = px[i * 4 + 3]; if (A[i] > mx) mx = A[i]; }
    let kat = function (a) { return a < 0.35 ? 0 : a < 0.6 ? 1 : a < 0.85 ? 2 : 3; };
    for (let i = 0; i < n; i++) {
        let a = A[i] / (mx || 1), j = i * 4;
        if (a < 0.08) { px[j + 3] = 0; continue; }
        let r = yzsTermal(a), ka = kat(a), sinir = (i % W) < W - 1 && i + W < n && (ka !== kat(A[i + 1] / mx) || ka !== kat(A[i + W] / mx));
        px[j] = sinir ? 255 : r[0]; px[j + 1] = sinir ? 255 : r[1]; px[j + 2] = sinir ? 255 : r[2]; px[j + 3] = sinir ? 150 : Math.min(205, 40 + a * 175);
    }
    c.putImageData(im, 0, 0);
}
function yzsYon(gr, R) {
    if (!gr) return null; let cx = gr.mx * R, cy = gr.my * R;
    if (Math.hypot(cx, cy) < 2.5) return { ad: 'TAM MERKEZ', ok: '🎯' };
    let d = Math.abs(cy) >= 2 ? (cy < 0 ? 'ÜST' : 'ALT') : '', y = Math.abs(cx) >= 2 ? (cx > 0 ? 'SAĞ' : 'SOL') : '';
    let ok = { 'SAĞÜST': '↗', 'SOLÜST': '↖', 'SAĞALT': '↘', 'SOLALT': '↙', 'ÜST': '↑', 'ALT': '↓', 'SAĞ': '→', 'SOL': '←' }[y + d] || '';
    return { ad: (y && d ? y + ' ' + d : y || d), ok: ok };
}
function yzsMolaVeri(o) {
    let d = o.durum, yuz = yzYuz(d), sira = yzSiralama(o), kisiler = [];
    yzHedefSirasi(o).forEach(function (k) {
        let sk = yzSkor(o, k), seriler = []; sk.forEach(function (s, i) { if (s) seriler.push({ i: i, p: yzTop(s), oklar: s }); }); if (!seriler.length) return;
        let kon = yzKonumlar(o, k), on = 0, x = 0, ok = 0, iska = 0;
        sk.forEach(function (s) { (s || []).forEach(function (v) { v = String(v); ok++; if (v === 'X') { x++; on++; } else if (v === '10') on++; else if (v === 'M') iska++; }); });
        let enIyi = seriler.slice().sort(function (a, b) { return b.p - a.p; })[0], ort = seriler.reduce(function (a, s) { return a + s.p; }, 0) / seriler.length;
        kisiler.push({ k: k, ad: yzKAd(k), kon: kon, gr: kon.length >= 3 ? yzGrup(kon) : null, seriler: seriler, enIyi: enIyi, r: sira.find(function (r) { return r.k === k; }) || { toplam: 0, sira: '-' }, on: on, x: x, ok: ok, iska: iska, ort: ort, son: seriler[seriler.length - 1] });
    });
    let tum = []; kisiler.forEach(function (k) { tum = tum.concat(k.kon); });
    return { yuz: yuz, kisiler: kisiler, tum: tum };
}
function yzsMolaSlaytlar(v) {
    let K = v.kisiler, R = v.yuz.R || 24, odul = [], gruplu = K.filter(function (k) { return k.gr && k.kon.length >= 6; });
    let enAz = function (l, f) { return l.slice().sort(function (a, b) { return f(a) - f(b); })[0]; };
    if (gruplu.length >= 2) {
        let m = enAz(gruplu, function (k) { return Math.hypot(k.gr.mx, k.gr.my); });
        odul.push({ tip: 'odul', ikon: '🎯', soru: 'MERKEZE EN YAKIN GRUP KİMİN?', kisi: m, alt: 'Grubunun ortası tam merkeze ' + Math.max(1, Math.round(Math.hypot(m.gr.mx, m.gr.my) * R)) + ' cm' });
        let s = enAz(gruplu, function (k) { return k.gr.yay; });
        odul.push({ tip: 'odul', ikon: '🤏', soru: 'EN SIKI GRUBU KİM ATTI?', kisi: s, alt: 'Okları ortalama ' + Math.max(1, Math.round(s.gr.yay * R)) + ' cm aralıkla, kümelenmiş!' });
    }
    if (K.length >= 2) {
        let b = enAz(K, function (k) { return -k.enIyi.p; });
        odul.push({ tip: 'odul', ikon: '🔥', soru: 'TURUN EN İYİ SERİSİ KİMDE?', kisi: b, alt: (b.enIyi.i + 1) + '. seride ' + b.enIyi.p + ' puan', oklar: b.enIyi.oklar });
        let x = enAz(K, function (k) { return -(k.on * 10 + k.x); });
        if (x.on > 0) odul.push({ tip: 'odul', ikon: '💥', soru: 'EN ÇOK 10 VURAN KİM?', kisi: x, alt: x.on + ' tane 10' + (x.x ? ' (' + x.x + ' tanesi X!)' : '') });
        let fl = K.filter(function (k) { return k.seriler.length >= 3; }), f = fl.length ? enAz(fl, function (k) { return -(k.son.p - k.ort); }) : null;
        if (f && f.son.p - f.ort >= 1) odul.push({ tip: 'odul', ikon: '📈', soru: 'FORMU EN ÇOK YÜKSELEN KİM?', kisi: f, alt: 'Son serisi kendi ortalamasından +' + Math.round(f.son.p - f.ort) + ' puan' });
    }
    let kisi = K.map(function (k) { return { tip: 'kisi', kisi: k }; }), sl = [];
    if (v.tum.length >= 6) sl.push({ tip: 'sinif' });
    odul.forEach(function (o) { sl.push(o); sl = sl.concat(kisi.splice(0, 2)); });
    return sl.concat(kisi);
}
function yzsMolaCiz(el, o, tick) {
    let sahne = el.querySelector('#yzs-sahne'); if (!sahne) return;
    let M = _yzs.mola, simdi = Date.now();
    if (!M || M.id !== o.mola.basla) M = _yzs.mola = { id: o.mola.basla, i: -1, t: 0, s: null, n: 0 };
    let yeni = M.i < 0 || (tick && simdi - M.t >= (M.s && M.s.tip === 'odul' ? YZS_ODUL_SN : YZS_MOLA_SN));
    if (!yeni && sahne.querySelector('.yzs-mola')) return;
    let v = yzsMolaVeri(o);
    if (yeni) {
        let sl = yzsMolaSlaytlar(v);
        if (!sl.length) { M.i = 0; M.t = simdi; sahne.innerHTML = '<div class="yzs-kim yzs-mola"><div class="yzs-ad">☕ MOLA</div><div class="yzs-not">İlk skorlar girilince burada analiz döner</div></div>'; return; }
        M.i = (M.i + 1) % sl.length; M.n = sl.length; M.s = sl[M.i]; M.t = simdi;
    }
    let s = M.s; if (!s) return;
    if (s.kisi) s.kisi = v.kisiler.find(function (k) { return k.k === s.kisi.k; }) || s.kisi;
    let yuz = v.yuz, R = yuz.R || 24, pts, bas, govde, gizem = s.tip === 'odul';
    let nokta = '<div class="yzs-m-nokta">' + Array.from({ length: Math.min(M.n, 24) }, function (_, i) { return '<i' + (i === M.i % 24 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
    if (s.tip === 'sinif') {
        pts = v.tum; let gr = yzGrup(pts), yon = yzsYon(gr, R), on = 0, x = 0, iska = 0, ok = 0;
        v.kisiler.forEach(function (k) { on += k.on; x += k.x; iska += k.iska; ok += k.ok; });
        bas = '🔥 SINIFIN ISI HARİTASI';
        govde = '<div class="yzs-m-buyuk">' + ok + '<small> OK</small></div><div class="yzs-m-alt">' + v.kisiler.length + ' sporcu · ' + pts.length + ' ok hedefte işaretli</div>'
            + (yon ? '<div class="yzs-m-yon"><span>' + yon.ok + '</span><div><small>EN SICAK BÖLGE</small><b>' + yon.ad + '</b></div></div>' : '')
            + '<div class="yzs-m-cip"><i class="s">10 · ' + on + '</i><i class="x">X · ' + x + '</i><i class="m">ISKA · ' + iska + '</i></div>'
            + '<div class="yzs-m-merak">🥁 Sırada ödüller… kim kazandı?</div>';
    } else {
        let k = s.kisi; pts = k.kon; let yon = yzsYon(k.gr, R), mxP = Math.max(30, Math.max.apply(null, k.seriler.map(function (x) { return x.p; })));
        let bar = '<div class="yzs-m-bar">' + k.seriler.map(function (x) { return '<i class="' + (x === k.enIyi ? 'en' : '') + '" style="height:' + Math.max(6, Math.round(x.p / mxP * 100)) + '%"><b>' + x.p + '</b></i>'; }).join('') + '</div>';
        let sayi = '<div class="yzs-m-sayi"><div><small>TOPLAM</small><b>' + k.r.toplam + '</b></div><div class="sira"><small>SIRA</small><b>' + k.r.sira + '.</b></div></div>';
        if (s.tip === 'odul') {
            bas = s.ikon + ' ' + s.soru;
            govde = '<div class="yzs-m-gizem"><div class="yzs-m-ad" style="font-size:' + Math.min(96, yzsAdBoy(k.ad)) + 'px">' + esc(k.ad) + '</div><div class="yzs-m-davul">🥁</div></div>'
                + '<div class="yzs-m-odul">' + esc(s.alt) + '</div>'
                + (s.oklar ? '<div class="yzs-oklar">' + s.oklar.map(function (q) { let a = yzsRenkAnahtar(String(q)); return '<i class="dur" style="background:' + YZS_RENK[a] + ';color:' + YZS_YAZI[a] + '">' + esc(q) + '</i>'; }).join('') + '</div>' : '')
                + sayi;
        } else {
            bas = '🔍 KİŞİSEL ANALİZ' + ((o.durum.hedefler || {})[k.k] ? ' · ' + esc(o.durum.hedefler[k.k]) : '');
            govde = '<div class="yzs-m-ad" style="font-size:' + Math.min(96, yzsAdBoy(k.ad)) + 'px">' + esc(k.ad) + '</div>'
                + (yon ? '<div class="yzs-m-yon"><span>' + yon.ok + '</span><div><small>OKLAR EN ÇOK</small><b>' + yon.ad + '</b></div></div>' : '<div class="yzs-m-alt">' + (pts.length ? pts.length + ' ok işaretli' : 'Okları hedefte işaretlenmedi, sadece puan') + '</div>')
                + (k.gr && k.kon.length >= 6 ? '<div class="yzs-m-alt">Grup: <b>' + (k.gr.yay < 0.22 ? 'sıkı 🤏' : k.gr.yay < 0.4 ? 'orta' : 'dağınık') + '</b> · en iyi seri <b>' + k.enIyi.p + '</b></div>' : '<div class="yzs-m-alt">En iyi seri <b>' + k.enIyi.p + '</b> · ' + k.on + ' tane 10</div>')
                + bar + sayi;
        }
    }
    sahne.classList.remove('gir'); void sahne.offsetWidth; sahne.classList.add('gir');
    sahne.innerHTML = '<div class="yzs-mola-h' + (gizem ? ' gizem' : '') + '">' + yzsHedefSVG(yuz.halka, [], pts.length <= 160 ? pts : [], false) + '<canvas class="yzs-m-isi"></canvas>' + (pts.length ? '' : '<div class="yzs-m-bos">yalnız puan<br>(konum yok)</div>') + '</div>'
        + '<div class="yzs-kim yzs-mola' + (gizem ? ' gizem' : '') + '"><small class="yzs-m-bas">☕ MOLA ANALİZİ</small><div class="yzs-m-baslik">' + bas + '</div>' + govde + nokta + '</div>';
    let cv = sahne.querySelector('.yzs-m-isi'); if (cv && pts.length) yzsIsiCiz(cv, pts, 600, s.tip === 'sinif' ? (pts.length > 60 ? 0.07 : 0.09) : 0.12);
    let bek = el.querySelector('#yzs-bek'); if (bek) { let d = o.durum, f = yzFormat(d); bek.innerHTML = '<em>☕ Mola · sonra ' + (Math.min(d.seri, f.seri - 1) + 1) + '. seri · analiz ' + (M.i + 1) + '/' + M.n + '</em>'; }
}
(function () {
    if (document.getElementById('yzs-mola-css')) return;
    let st = document.createElement('style'); st.id = 'yzs-mola-css';
    st.textContent = [
        '.yzs-mola-h{position:relative;width:600px;height:600px}.yzs-mola-h .yzs-hedef{position:absolute;inset:0}',
        '.yzs-m-isi{position:absolute;inset:0;width:600px;height:600px;animation:yzsIsi 1.6s ease-out both}@keyframes yzsIsi{from{opacity:0;transform:scale(.6)}}',
        '.yzs-m-bos{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font:800 30px system-ui,sans-serif;color:#0009}',
        '.yzs-mola .yzs-m-bas{color:#7cc7ff}.yzs-m-baslik{font-size:54px;font-weight:900;line-height:1;margin:6px 0 18px;color:#ffd27a}',
        '.yzs-m-buyuk{font-size:150px;font-weight:900;line-height:.85}.yzs-m-buyuk small{font-size:54px;opacity:.7}',
        '.yzs-m-alt{font:700 26px system-ui,sans-serif;opacity:.85;margin:10px 0}.yzs-m-alt b{color:#ffd27a}',
        '.yzs-m-yon{display:flex;align-items:center;gap:18px;margin:18px 0}.yzs-m-yon span{width:96px;height:96px;border-radius:50%;background:#ff6a1a;display:grid;place-items:center;font-size:62px;line-height:1;box-shadow:0 0 40px #ff6a1a88;animation:yzsNabiz 1.4s ease-in-out infinite alternate}',
        '.yzs-m-yon small{display:block;font:800 20px system-ui,sans-serif;letter-spacing:.25em;opacity:.7}.yzs-m-yon b{font-size:64px;font-weight:900;line-height:1}',
        '@keyframes yzsNabiz{to{transform:scale(1.08);box-shadow:0 0 70px #ff6a1acc}}',
        '.yzs-m-cip{display:flex;gap:10px;flex-wrap:wrap}.yzs-m-cip i{font:900 30px system-ui,sans-serif;font-style:normal;padding:8px 18px;border-radius:999px;background:#ffffff18}.yzs-m-cip i.s{background:#f7d23e;color:#2a2200}.yzs-m-cip i.x{background:#fff;color:#111}.yzs-m-cip i.m{background:#4a4f5a}',
        '.yzs-m-merak{margin-top:26px;font:800 28px system-ui,sans-serif;color:#ffd27a;animation:yzsNabiz2 1.2s ease-in-out infinite alternate}@keyframes yzsNabiz2{to{opacity:.55}}',
        '.yzs-m-gizem{position:relative}.yzs-m-ad{font-weight:900;line-height:.95;text-transform:uppercase;margin:4px 0 8px}',
        '.yzs-mola.gizem .yzs-m-ad{animation:yzsAc 1s 2.4s both}@keyframes yzsAc{from{filter:blur(26px);opacity:.35;transform:scale(.92)}to{filter:none;opacity:1;transform:none}}',
        '.yzs-m-davul{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:110px;display:none;pointer-events:none}.yzs-mola.gizem .yzs-m-davul{display:block;animation:yzsDavul 2.5s both}',
        '@keyframes yzsDavul{0%,20%,40%,60%,80%{transform:translateY(-50%) rotate(-12deg)}10%,30%,50%,70%{transform:translateY(-50%) rotate(12deg)}90%{opacity:1}100%{opacity:0;transform:translateY(-50%) scale(2)}}',
        '.yzs-mola-h.gizem .yzs-m-isi,.yzs-mola-h.gizem .yzs-hedef{animation:yzsAc 1s 2.4s both}',
        '.yzs-m-odul{font:800 34px system-ui,sans-serif;color:#9be0ff;margin:6px 0 10px;animation:yzsGir .6s 3s both}',
        '.yzs-mola.gizem .yzs-oklar,.yzs-mola.gizem .yzs-m-sayi{animation:yzsGir .6s 3.3s both}',
        '.yzs-m-bar{display:flex;align-items:flex-end;gap:6px;height:120px;margin:40px 0 18px}.yzs-m-bar i{flex:1;max-width:44px;background:linear-gradient(#ff8a3d,#ff6a1a55);border-radius:8px 8px 3px 3px;position:relative;transform-origin:bottom;animation:yzsBar .9s cubic-bezier(.2,1.4,.4,1) both}.yzs-m-bar i.en{background:linear-gradient(#ffd23f,#ffb000)}',
        '.yzs-m-bar i b{position:absolute;top:-30px;left:50%;transform:translateX(-50%);font:800 20px system-ui,sans-serif}@keyframes yzsBar{from{transform:scaleY(0)}}',
        '.yzs-m-sayi{display:flex;gap:44px;align-items:flex-end}.yzs-m-sayi small{display:block;font:700 22px system-ui,sans-serif;opacity:.7}.yzs-m-sayi b{font-size:100px;font-weight:900;line-height:.85;font-variant-numeric:tabular-nums}.yzs-m-sayi .sira b{color:#ff8a3d}',
        '.yzs-m-nokta{display:flex;gap:8px;margin-top:22px}.yzs-m-nokta i{width:12px;height:12px;border-radius:50%;background:#ffffff30}.yzs-m-nokta i.on{background:#7cc7ff;box-shadow:0 0 10px #7cc7ff}',
        '#yz-tv.yzs-acik .yz-sayac.mola{background:#0f4c75;color:#fff}',
        '@media (prefers-reduced-motion:reduce){.yzs-mola *,.yzs-mola-h *{animation:none!important;filter:none!important;opacity:1!important}}'
    ].join('\n');
    document.head.appendChild(st);
})();
