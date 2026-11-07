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
function yzsOlcekle(el) {
    let tv = el.querySelector('.yzs-tv'); if (!tv) return;
    let w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight, k = Math.min(w / 1920, h / 1080);
    tv.style.transform = 'translate(' + ((w - 1920 * k) / 2).toFixed(1) + 'px,' + ((h - 1080 * k) / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
}
function yzsKontrolGoster() {
    let b = document.getElementById('yzs-kontrol'); if (!b) return;
    b.classList.remove('gizli'); clearTimeout(_yzs.gizleZ);
    _yzs.gizleZ = setTimeout(function () { let b2 = document.getElementById('yzs-kontrol'); if (b2 && !b2.matches(':hover')) b2.classList.add('gizli'); }, 4500);
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
    if (degisen) _yzs.spot = degisen;
    if (!_yzs.spot || d.katilimci.indexOf(_yzs.spot) === -1) { let g = yzHedefSirasi(o).filter(function (k) { return yzSkor(o, k)[seri]; }); _yzs.spot = g.length ? g[g.length - 1] : (sira[0] && sira[0].k) || null; }
    // üst: sayaç + seri
    let bek = yzBekleyenler(o, seri);
    el.querySelector('#yzs-ust').innerHTML = yzSayacHTML(o, 'yz-tv-sayac') + '<div class="yzs-seri"><small>SERİ</small><b>' + (seri + 1) + '<span>/' + f.seri + '</span></b></div>'
        + '<div class="yzs-kimlik"><small>DAĞ S.K. · ' + esc(d.ayar.mesafe) + '</small><b>SIRALAMA TURU</b></div>';
    // sahne
    let sk = _yzs.spot, sahne = el.querySelector('#yzs-sahne');
    if (sk) {
        let skor = yzSkor(o, sk), sSeri = skor[seri] ? seri : (function () { for (let i = skor.length - 1; i >= 0; i--) if (skor[i]) return i; return -1; })();
        let imza = sk + '|' + (siraMap[sk] ? siraMap[sk].seriT.join(',') : '') + '|' + sSeri + '|' + yuz.halka;
        if (imza !== _yzs.spotImza) {
            let anim = !!degisen || !_yzs.spotImza; _yzs.spotImza = imza;
            let kon = yzKonumlar(o, sk), simdi = kon.filter(function (p) { return p.seri === sSeri; }).sort(function (a, b) { return (a.n || 99) - (b.n || 99); }), onceki = kon.filter(function (p) { return p.seri !== sSeri; }).slice(-60);
            let oklar = sSeri >= 0 ? skor[sSeri] : [], r = siraMap[sk] || { toplam: 0, sira: '-' }, sp = sSeri >= 0 ? yzTop(oklar) : 0;
            sahne.innerHTML = yzsHedefSVG(yuz.halka, simdi, onceki, anim)
                + '<div class="yzs-kim"><small>' + esc((d.hedefler || {})[sk] || '') + (sSeri >= 0 ? ' · ' + (sSeri + 1) + '. SERİ' : '') + '</small><div class="yzs-ad">' + esc(yzKAd(sk)) + '</div>'
                + '<div class="yzs-oklar">' + oklar.map(function (v, j) { let a = yzsRenkAnahtar(v); return '<i style="background:' + YZS_RENK[a] + ';color:' + YZS_YAZI[a] + ';animation-delay:' + (anim ? (0.3 + j * 0.32).toFixed(2) : 0) + 's"' + (anim ? '' : ' class="dur"') + '>' + esc(v) + '</i>'; }).join('') + '</div>'
                + '<div class="yzs-sayi"><div><small>SERİ</small><b data-say="' + sp + '">' + (anim ? 0 : sp) + '</b></div><div><small>TOPLAM</small><b>' + r.toplam + '</b></div><div class="sira"><small>SIRA</small><b>' + r.sira + '.</b></div></div>'
                + (simdi.length ? '' : '<div class="yzs-not">' + (oklar.length ? 'Bu serinin okları hedefte işaretlenmedi' : 'Henüz skor yok') + '</div>') + '</div>';
            if (anim) { let b = sahne.querySelector('[data-say]'), hedef = sp, t0 = performance.now() + 300; (function k(t) { if (!b.isConnected) return; let q = Math.max(0, Math.min(1, (t - t0) / 1900)); b.textContent = Math.round(hedef * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(k); })(t0); }
        }
    } else sahne.innerHTML = '<div class="yzs-kim"><div class="yzs-ad">DAĞ S.K.</div><div class="yzs-not">İlk skor girilince burada</div></div>';
    // bekleyenler
    el.querySelector('#yzs-bek').innerHTML = bek.length ? '<em>Bu seriyi bekleyenler (' + bek.length + ')</em>' + bek.map(function (k) { return '<span>' + esc(yzKisaAd(yzKAd(k))) + '</span>'; }).join('') : '<em>✓ Herkes girdi · sıradaki seri</em>';
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
        '.yzs-sahne{position:absolute;left:0;right:0;top:150px;bottom:110px;display:grid;grid-template-columns:600px minmax(0,1fr);gap:44px;align-items:center}',
        '.yzs-hedef{width:600px;height:600px;filter:drop-shadow(0 30px 50px #000a)}',
        '.yzs-pin{transform-box:fill-box;transform-origin:center}.yzs-pin.dus{animation:yzsDus .55s cubic-bezier(.2,1.6,.4,1) backwards}',
        '@keyframes yzsDus{0%{transform:translate(40%,-260%) scale(1.6);opacity:0}55%{opacity:1}100%{transform:none}}',
        '.yzs-kim small{display:block;font:800 24px system-ui,sans-serif;letter-spacing:.3em;color:#ff8a3d}',
        '.yzs-ad{font-size:112px;font-weight:900;line-height:.92;text-transform:uppercase;overflow-wrap:anywhere}',
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
