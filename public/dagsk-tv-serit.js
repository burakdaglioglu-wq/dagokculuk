// 🎯 TV hedef şeridi (2026-10-22, kullanıcı taslaklardan "2 · Hedef şeridi"ni seçti: "saniyeyi başlatıyorum, ekranın yarısını
// zaten saniye kaplıyor; altta da bu animasyonlar dönsün büyük olarak, her gelen sporcu daha büyük olabilir").
// Sıralama tablosunun altında herkesin hedef kâğıdı yan yana: hedefe dokunarak girilen okların konumu + ısı haritası. Işık
// 4,5 sn'de bir sıradaki sporcuya geçer; onun kâğıdı büyür, okları yeniden düşer. Yeni skor gelince o sporcuya atlar, kartında ve
// tablodaki satırında "+56" uçar. ⛶ Büyük sayaç açıkken tablo gizlenir, şerit sayacın altındaki yarıyı kaplar (kartlar büyük).
// Hiç kimsede ok konumu yoksa (yalnız puanla girildiyse) şerit çizilmez. Yalnız yzTvCiz çağırır (dagsk-km-yarisma-pro.js).
let _yzhs = { aktif: 0, son: {}, arti: {}, z: null, tur: null };
const YZHS_SURE = 4500;

function yzhsVeri(o, sira) {
    return sira.map(function (r) {
        let son = null; for (let i = r.seriT.length - 1; i >= 0; i--) if (r.seriT[i] != null) { son = r.seriT[i]; break; }
        return { k: r.k, ad: r.ad, sira: r.sira, toplam: r.toplam, son: son, kon: yzKonumlar(o, r.k) };
    });
}
function yzhsBuyukMu() { return document.documentElement.classList.contains('yz-dev-acik'); }
// Bir sayfada kaç kart: genişliğe göre (büyük sayaçta kartlar iri → daha az)
function yzhsSayfaBoy() { let w = window.innerWidth; return Math.max(3, Math.min(yzhsBuyukMu() ? 6 : 8, Math.floor(w / (yzhsBuyukMu() ? 230 : 160)))); }

function yzhsTazele(el, o, sira) {
    if (!el) return;
    let d = o && o.durum, serit = document.getElementById('yz-tv-serit');
    let kapat = function () { if (serit) { serit.remove(); el.classList.remove('serit-var'); yzTvSigdir(el); } clearInterval(_yzhs.z); _yzhs.z = null; };
    if (!d || d.asama !== 'tur') return kapat();
    if (_yzhs.tur !== d.id) { _yzhs = { aktif: 0, son: {}, arti: {}, z: _yzhs.z, tur: d.id }; }
    let veri = yzhsVeri(o, sira);
    if (!veri.some(function (v) { return v.kon.length; })) return kapat();
    yzhsCss();
    let yeni = !serit;
    if (yeni) { serit = document.createElement('div'); serit.id = 'yz-tv-serit'; serit.className = 'yzhs'; }
    if (serit.parentNode !== el) { let kapatBtn = el.querySelector('.yz-tv-tablo'); el.insertBefore(serit, kapatBtn ? kapatBtn.nextSibling : null); }
    el.classList.add('serit-var');
    // yeni skorlar: toplamı artan sporcu → ışık ona, "+fark"
    let gelen = [];
    veri.forEach(function (v) { let e = _yzhs.son[v.k]; if (e != null && v.toplam > e) { gelen.push({ k: v.k, fark: v.toplam - e }); _yzhs.arti[v.k] = { fark: v.toplam - e, t: Date.now() }; } _yzhs.son[v.k] = v.toplam; });
    _yzhs.veri = veri;
    // ışık yeni skora atlar ve sayaç baştan başlar (kart tam bir tur ekranda kalsın)
    if (gelen.length) { let i = veri.findIndex(function (v) { return v.k === gelen[gelen.length - 1].k; }); if (i >= 0) _yzhs.aktif = i; clearInterval(_yzhs.z); _yzhs.z = null; }
    else if (_yzhs.aktif >= veri.length) _yzhs.aktif = 0;
    yzhsCiz(gelen);
    Object.keys(_yzhs.arti).forEach(function (k) { yzhsSatirArti(el, k, _yzhs.arti[k]); }); // tablo her çizimde yenilenir → yeniden ekle
    if (yeni) yzTvSigdir(el);
    if (!_yzhs.z) _yzhs.z = setInterval(yzhsDon, YZHS_SURE);
}
function yzhsDon() {
    let s = document.getElementById('yz-tv-serit'); if (!s || !_yzhs.veri) { clearInterval(_yzhs.z); _yzhs.z = null; return; }
    _yzhs.aktif = (_yzhs.aktif + 1) % _yzhs.veri.length;
    yzhsCiz([]);
}
// Kartlar: aktif sporcunun bulunduğu sayfa (sayfa boyu ekrana göre). Aktif kart büyür, okları tek tek düşer, sonra ısı haritası.
function yzhsCiz(gelen) {
    let s = document.getElementById('yz-tv-serit'); if (!s) return;
    let veri = _yzhs.veri, n = yzhsSayfaBoy(), sayfa = Math.floor(_yzhs.aktif / n), parca = veri.slice(sayfa * n, sayfa * n + n), yuz = yzYuz(yzOku().durum);
    // +puan 2,2 sn yaşar; araya başka bir çizim girerse animasyon kaldığı yerden sürer (eksi gecikme)
    let simdi = Date.now(), arti = {}; Object.keys(_yzhs.arti).forEach(function (k) { let a = _yzhs.arti[k], g = simdi - a.t; if (g < 2200) arti[k] = '<span class="yzhs-arti" style="animation-delay:-' + g + 'ms">+' + a.fark + '</span>'; else delete _yzhs.arti[k]; });
    s.innerHTML = parca.map(function (v, j) {
        let i = sayfa * n + j, akt = i === _yzhs.aktif;
        return '<div class="yzhs-k' + (akt ? ' aktif' : '') + (v.kon.length ? '' : ' konumsuz') + '" data-k="' + esc(v.k) + '">'
            + '<div class="yzhs-ust">' + yzFotoYuz(v.k) + '<span class="yzhs-sira">' + v.sira + '.</span><b class="yzhs-top">' + v.toplam + '</b></div>'
            + '<div class="yzhs-h"><div class="yzhs-kare"><svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">' + yzHedefYuzSVG(yuz, yzMakaraliMi(v.k)) + yzhsNoktalar(v.kon, akt) + '</svg><canvas></canvas>'
            + (v.kon.length ? '' : '<span class="yzhs-yok">yalnız puan</span>') + '</div></div>'
            + '<div class="yzhs-ad">' + esc(yzKisaAd(v.ad)) + '</div><small>' + (v.son != null ? 'son seri ' + v.son : 'skor bekleniyor') + ' · ' + v.kon.length + ' ok</small>'
            + (arti[v.k] || '') + '</div>';
    }).join('') + (veri.length > n ? '<div class="yzhs-sayfa">' + (sayfa + 1) + ' / ' + Math.ceil(veri.length / n) + '</div>' : '');
    s.querySelectorAll('.yzhs-k').forEach(function (k, j) {
        let v = parca[j], h = k.querySelector('.yzhs-kare'); if (!v.kon.length) return;
        yzhsIsi(k.querySelector('canvas'), v.kon);
        if (k.classList.contains('aktif')) setTimeout(function () { h.classList.add('isi'); }, 400 + Math.min(v.kon.length, 24) * 90 + 700);
        else h.classList.add('isi');
    });
}
// Son 24 ok; aktif kartta sırayla düşer (her biri 90 ms arayla)
function yzhsNoktalar(kon, anim) {
    let l = kon.slice(-24);
    return l.map(function (p, i) { return '<circle class="yzhs-ok' + (anim ? ' dus' : '') + '" style="animation-delay:' + (anim ? (0.4 + i * 0.09).toFixed(2) : 0) + 's" cx="' + p.x.toFixed(3) + '" cy="' + p.y.toFixed(3) + '" r="0.055"/>'; }).join('');
}
// Isı haritası: her ok yumuşak bir leke (alfa birikir), sonra yoğunluğa göre mavi → sarı → kırmızı
function yzhsIsi(cv, kon) {
    let W = 160; cv.width = cv.height = W; let c = cv.getContext('2d'); if (!c) return;
    let b = function (v) { return (v + 1.1) / 2.2 * W; };
    kon.forEach(function (p) { let x = b(p.x), y = b(p.y), g = c.createRadialGradient(x, y, 0, x, y, W * 0.12); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
    let im = c.getImageData(0, 0, W, W), px = im.data, mx = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > mx) mx = px[i];
    for (let i = 0; i < px.length; i += 4) {
        let a = px[i + 3] / (mx || 1); if (a < 0.08) { px[i + 3] = 0; continue; }
        px[i] = a < 0.5 ? 40 + a * 430 : 255; px[i + 1] = a < 0.5 ? 120 + a * 270 : 255 - (a - 0.5) * 420; px[i + 2] = a < 0.5 ? 255 - a * 500 : 0; px[i + 3] = Math.min(235, 70 + a * 170);
    }
    c.putImageData(im, 0, 0);
}
// Tablodaki satırda "+56" uçar (satır zaten "yeni" diye parlıyor)
function yzhsSatirArti(el, k, a) {
    let g = Date.now() - a.t; if (g >= 2200) return;
    let tr = [].slice.call(el.querySelectorAll('.yz-tv-tablo tr[data-k]')).find(function (t) { return t.getAttribute('data-k') === k; }); if (!tr || tr.querySelector('.yzhs-satir-arti')) return;
    let td = tr.querySelector('td.top') || tr.lastElementChild; if (!td) return;
    let s = document.createElement('span'); s.className = 'yzhs-satir-arti'; s.textContent = '+' + a.fark; s.style.animationDelay = '-' + g + 'ms'; td.style.position = 'relative'; td.appendChild(s);
    setTimeout(function () { s.remove(); }, 2200 - g);
}
function yzhsCss() {
    if (document.getElementById('yzhs-css')) return;
    let st = document.createElement('style'); st.id = 'yzhs-css';
    st.textContent = [
        '#yz-tv .yzhs{flex:none;height:27vh;display:flex;gap:.9vw;align-items:stretch;position:relative;min-height:150px}',
        '.yzhs-k{flex:1 1 0;min-width:0;position:relative;display:flex;flex-direction:column;align-items:center;gap:.3vh;padding:.8vh .5vw;border-radius:1vw;background:#0e1f36;border:2px solid #1d3354;transition:flex-grow .6s cubic-bezier(.3,1.3,.5,1),border-color .4s,box-shadow .4s}',
        '#yz-tv.kagit .yzhs-k{background:#fffdf8;border-color:#1d1a16}',
        '.yzhs-k.aktif{flex-grow:1.7;border-color:#fbbf24;box-shadow:0 0 0 .3vw rgba(251,191,36,.28),0 1.2vh 3vh rgba(0,0,0,.25)}#yz-tv.kagit .yzhs-k.aktif{border-color:#d92c20;box-shadow:0 0 0 .3vw rgba(217,44,32,.15),0 1.2vh 3vh rgba(29,26,22,.18)}',
        '.yzhs-ust{display:flex;align-items:center;gap:.4vw;width:100%}.yzhs-ust .yz-yuz{width:max(24px,2.4vw);height:max(24px,2.4vw);font-size:max(10px,.9vw)}',
        '.yzhs-sira{font-weight:900;font-size:max(12px,1.1vw);opacity:.6}.yzhs-top{margin-left:auto;font-weight:900;font-size:max(15px,1.6vw);font-variant-numeric:tabular-nums}.yzhs-k.aktif .yzhs-top{font-size:max(18px,2.1vw)}',
        '.yzhs-h{flex:1;min-height:0;width:100%;position:relative}',
        '.yzhs-kare{position:absolute;top:13%;bottom:13%;left:50%;transform:translateX(-50%);aspect-ratio:1;max-width:100%;transition:top .6s,bottom .6s}.yzhs-k.aktif .yzhs-kare{top:0;bottom:0}',
        '.yzhs-kare svg,.yzhs-kare canvas{position:absolute;inset:0;width:100%;height:100%}',
        '.yzhs-kare canvas{opacity:0;transition:opacity 1s;mix-blend-mode:multiply;border-radius:50%}.yzhs-kare.isi canvas{opacity:.9}',
        '.yzhs-ok{fill:#16a34a;stroke:#fff;stroke-width:.018}.yzhs-ok.dus{transform-box:fill-box;transform-origin:center;animation:yzhsDus .45s cubic-bezier(.2,1.6,.4,1) both}',
        '@keyframes yzhsDus{from{opacity:0;transform:scale(3.2)}to{opacity:1;transform:scale(1)}}',
        '.yzhs-k.konumsuz .yzhs-kare{opacity:.35}.yzhs-yok{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-weight:900;font-size:max(10px,.8vw);background:#1d1a16;color:#fff;padding:.2vh .5vw;border-radius:99px;white-space:nowrap}',
        '.yzhs-ad{font-weight:900;font-size:max(12px,1.05vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.yzhs-k.aktif .yzhs-ad{font-size:max(14px,1.35vw)}',
        '.yzhs-k small{font-size:max(10px,.75vw);font-weight:800;opacity:.6;white-space:nowrap}',
        '.yzhs-arti{position:absolute;left:0;right:0;top:34%;text-align:center;font-weight:900;font-size:max(26px,4vw);color:#16a34a;-webkit-text-stroke:.12vw #fff;paint-order:stroke;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '.yzhs-satir-arti{position:absolute;right:105%;top:50%;font-weight:900;font-size:.8em;color:#16a34a;white-space:nowrap;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '@keyframes yzhsArti{0%{opacity:0;transform:translateY(0) scale(.6)}18%{opacity:1;transform:translateY(-40%) scale(1.25)}75%{opacity:1}100%{opacity:0;transform:translateY(-140%)}}',
        '.yzhs-sayfa{position:absolute;right:.4vw;bottom:-2.2vh;font-size:max(10px,.75vw);font-weight:800;opacity:.55}',
        // ⛶ büyük sayaç açıkken: tablo gizli, şerit sayacın altındaki alanı kaplar
        'html.yz-dev-acik #yz-tv.serit-var .yz-tv-tablo,html.yz-dev-acik #yz-tv.serit-var .yz-tv-simdi{display:none}',
        'html.yz-dev-acik #yz-tv.serit-var .yzhs{flex:1;height:auto}',
        // başlıktaki küçük sayaç ve seri kutusu büyük sayaçla aynı bilgiyi verir → gizli; yönetim düğmeleri sağda kalır
        'html.yz-dev-acik #yz-tv.serit-var .yz-tv-kimlik,html.yz-dev-acik #yz-tv.serit-var .yz-tv-seri,html.yz-dev-acik #yz-tv.serit-var #yz-tv-sayac{display:none}',
        'html.yz-dev-acik #yz-tv.serit-var .yz-tv-bas{display:flex;justify-content:flex-end}',
        'html.yz-dev-acik .yzhs-k.aktif{flex-grow:2.2}',
        '@media (prefers-reduced-motion:reduce){.yzhs-ok.dus,.yzhs-arti,.yzhs-satir-arti{animation:none}.yzhs-k{transition:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
