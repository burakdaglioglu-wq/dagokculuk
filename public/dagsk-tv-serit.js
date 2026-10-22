// 🎯 TV hedef şeridi (2026-10-22, kullanıcı taslaklardan "2 · Hedef şeridi"ni seçti: "saniyeyi başlatıyorum, ekranın yarısını
// zaten saniye kaplıyor; altta da bu animasyonlar dönsün büyük olarak, her gelen sporcu daha büyük olabilir").
// Herkesin hedef kâğıdı yan yana: hedefe dokunarak girilen okların konumu + ısı haritası. Işık 4,5 sn'de bir sıradaki sporcuya
// geçer; onun kâğıdı büyür, okları yeniden düşer. Yeni skor gelince o sporcuya atlar, kartında ve tablodaki satırında "+56" uçar.
// v307 (kullanıcı: "tablo çok küçük kalmış, sporcular görünmüyor, skor giremiyorum; ısı haritası isteğe göre yukarı çekilsin,
// kapanıp açılsın; geri sayımı başlatınca büyük dönsün, yoksa kimse nereye attığını göremez; bir sporcu olsan TV'yi nasıl
// görmek isterdin"): üç hâl —
//   kapalı (varsayılan): altta ince "🎯 Hedef kâğıtları ▲" çubuğu, tablo tüm ekranı kullanır;
//   açık: çubuğa dokununca tablonun altında şerit (cihaz hatırlar);
//   geri sayım (hatta geç / atış / son 30 sn): tablo gizlenir, şerit kalan alanı kaplar, kartlar iri, 6 sn'de bir döner.
// Sporcu gözüyle: son serinin okları sarı ve büyük (eskiler küçük yeşil), aktif kartta son serinin puanları ve grup merkezi (+).
// Hiç kimsede ok konumu yoksa şerit çizilmez. Yalnız yzTvCiz çağırır (dagsk-km-yarisma-pro.js).
let _yzhs = { aktif: 0, son: {}, arti: {}, z: null, mz: null, tur: null, hal: null };
const YZHS_SURE = 4500, YZHS_SURE_SAYAC = 6000;

function yzhsVeri(o, sira) {
    let d = o.durum;
    return sira.map(function (r) {
        let si = -1; for (let i = r.seriT.length - 1; i >= 0; i--) if (r.seriT[i] != null) { si = i; break; }
        return { k: r.k, ad: r.ad, sira: r.sira, toplam: r.toplam, son: si >= 0 ? r.seriT[si] : null, sonSeri: si, sonOklar: si >= 0 ? (yzSkor(o, r.k)[si] || []) : [], kon: yzKonumlar(o, r.k), d: d };
    });
}
function yzhsAcikAyar() { try { return localStorage.getItem('dag_yz_hs_acik') === '1'; } catch (e) { return false; } }
// Geri sayım sürüyor mu (hatta geç / atış / son 30 sn)
function yzhsSayacta(o) { if (!o || !o.sayac) return false; let f = yzSayacDurum(o).faz; return f === 'hazirlik' || f === 'atis' || f === 'son'; }
function yzhsHal(o) { return yzhsSayacta(o) ? 'sayac' : yzhsAcikAyar() ? 'acik' : 'kapali'; }
// Bir sayfada kaç kart: genişliğe göre (geri sayımda kartlar iri → daha az)
function yzhsSayfaBoy() { let w = window.innerWidth, b = _yzhs.hal === 'sayac'; return Math.max(3, Math.min(b ? 6 : 8, Math.floor(w / (b ? 230 : 160)))); }

function yzhsTazele(el, o, sira) {
    if (!el) return;
    let d = o && o.durum, serit = document.getElementById('yz-tv-serit');
    let kapat = function () { if (serit) serit.remove(); el.classList.remove('serit-var', 'hs-sayac'); if (serit) yzTvSigdir(el); clearInterval(_yzhs.z); _yzhs.z = null; clearInterval(_yzhs.mz); _yzhs.mz = null; };
    if (!d || d.asama !== 'tur') return kapat();
    if (_yzhs.tur !== d.id) { clearInterval(_yzhs.z); _yzhs = { aktif: 0, son: {}, arti: {}, z: null, mz: _yzhs.mz, tur: d.id, hal: null }; }
    let veri = yzhsVeri(o, sira);
    if (!veri.some(function (v) { return v.kon.length; })) return kapat();
    yzhsCss();
    let yeni = !serit;
    if (yeni) { serit = document.createElement('div'); serit.id = 'yz-tv-serit'; serit.className = 'yzhs'; }
    if (serit.parentNode !== el) { let tb = el.querySelector('.yz-tv-tablo'); el.insertBefore(serit, tb ? tb.nextSibling : null); }
    el.classList.add('serit-var');
    // yeni skorlar: toplamı artan sporcu → ışık ona, "+fark"
    let gelen = [];
    veri.forEach(function (v) { let e = _yzhs.son[v.k]; if (e != null && v.toplam > e) { gelen.push(v.k); _yzhs.arti[v.k] = { fark: v.toplam - e, t: Date.now() }; } _yzhs.son[v.k] = v.toplam; });
    _yzhs.veri = veri;
    // ışık yeni skora atlar ve sayaç baştan başlar (kart tam bir tur ekranda kalsın)
    if (gelen.length) { let i = veri.findIndex(function (v) { return v.k === gelen[gelen.length - 1]; }); if (i >= 0) _yzhs.aktif = i; clearInterval(_yzhs.z); _yzhs.z = null; }
    else if (_yzhs.aktif >= veri.length) _yzhs.aktif = 0;
    let hal = yzhsHal(o), degisti = hal !== _yzhs.hal; _yzhs.hal = hal;
    yzhsCiz();
    Object.keys(_yzhs.arti).forEach(function (k) { yzhsSatirArti(el, k, _yzhs.arti[k]); }); // tablo her çizimde yenilenir → yeniden ekle
    if (yeni || degisti) yzhsSigdir(el);
    yzhsZamanla();
    // geri sayım veri değişmeden başlar/biter (süre dolunca) → hâli saniyede bir kontrol et
    if (!_yzhs.mz) _yzhs.mz = setInterval(yzhsHalKontrol, 1000);
}
function yzhsZamanla() {
    if (_yzhs.z) return; if (_yzhs.hal === 'kapali') return;
    _yzhs.z = setInterval(yzhsDon, _yzhs.hal === 'sayac' ? YZHS_SURE_SAYAC : YZHS_SURE);
}
function yzhsHalKontrol() {
    let el = document.getElementById('yz-tv'), s = document.getElementById('yz-tv-serit');
    if (!el || !s) { clearInterval(_yzhs.mz); _yzhs.mz = null; return; }
    let hal = yzhsHal(yzOku()); if (hal === _yzhs.hal) return;
    _yzhs.hal = hal; clearInterval(_yzhs.z); _yzhs.z = null;
    yzhsCiz(); yzhsSigdir(el); yzhsZamanla();
}
function yzhsDon() {
    let s = document.getElementById('yz-tv-serit'); if (!s || !_yzhs.veri) { clearInterval(_yzhs.z); _yzhs.z = null; return; }
    if (_yzhs.hal === 'kapali') { clearInterval(_yzhs.z); _yzhs.z = null; return; }
    _yzhs.aktif = (_yzhs.aktif + 1) % _yzhs.veri.length;
    yzhsCiz();
}
// Çubuğa dokununca aç/kapat (bu cihaz hatırlar). Geri sayımda şerit zaten büyük açık.
function yzhsAcKapat() {
    try { localStorage.setItem('dag_yz_hs_acik', yzhsAcikAyar() ? '0' : '1'); } catch (e) {}
    _yzhs.hal = yzhsHal(yzOku()); clearInterval(_yzhs.z); _yzhs.z = null;
    yzhsCiz(); yzhsSigdir(document.getElementById('yz-tv')); yzhsZamanla();
}
// Tablo sığdırma: açık şerit yüzünden tablo sayfalanıyorsa şerit kısalır (tablo önce — skorlar oradan girilir)
function yzhsSigdir(el) {
    if (!el) return; let s = document.getElementById('yz-tv-serit'); if (s) s.style.height = '';
    yzTvSigdir(el);
    if (s && _yzhs.hal === 'acik' && (_yz.tvSayfaSay || 1) > 1) { s.style.height = '20vh'; yzTvSigdir(el); }
}
// Kartlar: aktif sporcunun bulunduğu sayfa (sayfa boyu ekrana göre). Aktif kart büyür, okları tek tek düşer, sonra ısı haritası.
function yzhsCiz() {
    let s = document.getElementById('yz-tv-serit'), el = document.getElementById('yz-tv'); if (!s) return;
    let hal = _yzhs.hal || 'kapali', veri = _yzhs.veri || [];
    s.className = 'yzhs ' + hal; if (el) el.classList.toggle('hs-sayac', hal === 'sayac');
    let konumlu = veri.filter(function (v) { return v.kon.length; }).length;
    if (hal === 'kapali') {
        s.innerHTML = '<button type="button" class="yzhs-tut" onclick="yzhsAcKapat()"><span>🎯 Hedef kâğıtları · ısı haritası</span><small>' + konumlu + ' sporcu · geri sayımda kendiliğinden büyür</small><b>▲ Aç</b></button>';
        return;
    }
    let n = yzhsSayfaBoy(), sayfa = Math.floor(_yzhs.aktif / n), parca = veri.slice(sayfa * n, sayfa * n + n), yuz = yzYuz(yzOku().durum);
    // +puan 2,2 sn yaşar; araya başka bir çizim girerse animasyon kaldığı yerden sürer (eksi gecikme)
    let simdi = Date.now(), arti = {}; Object.keys(_yzhs.arti).forEach(function (k) { let a = _yzhs.arti[k], g = simdi - a.t; if (g < 2200) arti[k] = '<span class="yzhs-arti" style="animation-delay:-' + g + 'ms">+' + a.fark + '</span>'; else delete _yzhs.arti[k]; });
    let ust = hal === 'acik' ? '<button type="button" class="yzhs-tut acik" onclick="yzhsAcKapat()"><span>🎯 Hedef kâğıtları</span><small><i class="yzhs-lj son"></i> son seri <i class="yzhs-lj"></i> önceki oklar</small><b>▼ Kapat</b></button>'
        : '<div class="yzhs-baslik"><span>🎯 Oklar nereye gitti?</span><small><i class="yzhs-lj son"></i> son seri <i class="yzhs-lj"></i> önceki oklar <b>+</b> grup merkezi</small></div>';
    s.innerHTML = ust + '<div class="yzhs-kartlar">' + parca.map(function (v, j) {
        let i = sayfa * n + j, akt = i === _yzhs.aktif, gr = v.kon.length >= 6 ? yzGrup(v.kon) : null, on = akt && gr ? yzGrupOneri(gr, yuz) : null;
        let oklar = akt && v.sonOklar.length ? '<div class="yzhs-oklar">' + v.sonOklar.map(function (p) { return '<i class="yz-ok ' + yzOkRenk(p) + '">' + esc(p) + '</i>'; }).join('') + '</div>' : '';
        return '<div class="yzhs-k' + (akt ? ' aktif' : '') + (v.kon.length ? '' : ' konumsuz') + '" data-k="' + esc(v.k) + '">'
            + '<div class="yzhs-ust">' + yzFotoYuz(v.k) + '<span class="yzhs-sira">' + v.sira + '.</span><b class="yzhs-top">' + v.toplam + '</b></div>'
            + '<div class="yzhs-h"><div class="yzhs-kare"><svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">' + yzHedefYuzSVG(yuz, yzMakaraliMi(v.k)) + yzhsNoktalar(v, akt) + (akt && gr ? yzhsMerkez(gr) : '') + '</svg><canvas></canvas>'
            + (v.kon.length ? '' : '<span class="yzhs-yok">yalnız puan</span>') + '</div></div>'
            + '<div class="yzhs-ad">' + esc(yzKisaAd(v.ad)) + '</div>' + oklar
            + '<small>' + (on ? esc(on.kisa) : (v.son != null ? (v.sonSeri + 1) + '. seri ' + v.son : 'skor bekleniyor')) + '</small>'
            + (arti[v.k] || '') + '</div>';
    }).join('') + '</div>' + (veri.length > n ? '<div class="yzhs-sayfa">' + (sayfa + 1) + ' / ' + Math.ceil(veri.length / n) + '</div>' : '');
    s.querySelectorAll('.yzhs-k').forEach(function (k, j) {
        let v = parca[j], h = k.querySelector('.yzhs-kare'); if (!v.kon.length) return;
        yzhsIsi(k.querySelector('canvas'), v.kon);
        if (k.classList.contains('aktif')) setTimeout(function () { h.classList.add('isi'); }, 400 + Math.min(v.kon.length, 24) * 90 + 700);
        else h.classList.add('isi');
    });
}
// Son 24 ok; son serinin okları sarı ve büyük (sporcu kendi son serisini hemen bulsun), aktif kartta sırayla düşer
function yzhsNoktalar(v, anim) {
    let l = v.kon.slice(-24);
    return l.map(function (p, i) { let son = p.seri === v.sonSeri; return '<circle class="yzhs-ok' + (son ? ' son' : '') + (anim ? ' dus' : '') + '" style="animation-delay:' + (anim ? (0.4 + i * 0.09).toFixed(2) : 0) + 's" cx="' + p.x.toFixed(3) + '" cy="' + p.y.toFixed(3) + '" r="' + (son ? 0.075 : 0.05) + '"/>'; }).join('');
}
function yzhsMerkez(gr) {
    let x = gr.mx.toFixed(3), y = gr.my.toFixed(3);
    return '<g class="yzhs-mrk"><line x1="' + (gr.mx - 0.13).toFixed(3) + '" x2="' + (gr.mx + 0.13).toFixed(3) + '" y1="' + y + '" y2="' + y + '"/><line x1="' + x + '" x2="' + x + '" y1="' + (gr.my - 0.13).toFixed(3) + '" y2="' + (gr.my + 0.13).toFixed(3) + '"/></g>';
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
        '#yz-tv .yzhs{flex:none;display:flex;flex-direction:column;gap:.6vh;position:relative}',
        '#yz-tv .yzhs.acik{height:30vh;min-height:170px}',
        '#yz-tv .yzhs.sayac{flex:1;min-height:0}',
        // aç/kapat çubuğu
        '.yzhs-tut{display:flex;align-items:center;gap:1vw;width:100%;min-height:38px;padding:.5vh 1.2vw;border-radius:.8vw;border:2px dashed #1d3354;background:#0e1f36;color:inherit;font:inherit;cursor:pointer;text-align:left}',
        '#yz-tv.kagit .yzhs-tut{background:#fffdf8;border-color:#c9bda6}',
        '.yzhs-tut span{font-weight:900;font-size:max(13px,1.05vw)}.yzhs-tut small{font-size:max(11px,.8vw);font-weight:700;opacity:.65}.yzhs-tut b{margin-left:auto;font-weight:900;font-size:max(13px,1vw);padding:.3vh .9vw;border-radius:99px;background:#1d1a16;color:#fff;white-space:nowrap}',
        '.yzhs-tut.acik{min-height:30px;padding:.2vh 1vw;border-style:solid;border-width:1px}.yzhs-tut.acik b{background:transparent;color:inherit;border:1px solid currentColor}',
        '.yzhs-baslik{display:flex;align-items:baseline;gap:1.2vw;padding:0 .4vw}.yzhs-baslik span{font-weight:900;font-size:max(15px,1.5vw)}.yzhs-baslik small{font-size:max(11px,.95vw);font-weight:800;opacity:.7}.yzhs-baslik b{color:#10b981;font-size:1.2em}',
        '.yzhs-lj{display:inline-block;width:.7em;height:.7em;border-radius:50%;background:#16a34a;border:1.5px solid #fff;vertical-align:-.05em;margin:0 .2em 0 .6em;box-shadow:0 0 0 1px rgba(0,0,0,.25)}.yzhs-lj.son{background:#facc15;width:.9em;height:.9em;border-color:#1d1a16}',
        '.yzhs-kartlar{flex:1;min-height:0;display:flex;gap:.9vw;align-items:stretch}',
        '.yzhs-k{flex:1 1 0;min-width:0;position:relative;display:flex;flex-direction:column;align-items:center;gap:.3vh;padding:.8vh .5vw;border-radius:1vw;background:#0e1f36;border:2px solid #1d3354;transition:flex-grow .6s cubic-bezier(.3,1.3,.5,1),border-color .4s,box-shadow .4s}',
        '#yz-tv.kagit .yzhs-k{background:#fffdf8;border-color:#1d1a16}',
        '.yzhs-k.aktif{flex-grow:1.7;border-color:#fbbf24;box-shadow:0 0 0 .3vw rgba(251,191,36,.28),0 1.2vh 3vh rgba(0,0,0,.25)}#yz-tv.kagit .yzhs-k.aktif{border-color:#d92c20;box-shadow:0 0 0 .3vw rgba(217,44,32,.15),0 1.2vh 3vh rgba(29,26,22,.18)}',
        '.yzhs.sayac .yzhs-k.aktif{flex-grow:2.4}',
        // aktif kart yan yana: solda büyük hedef, sağda isim / son serinin okları / grup — hedef boyu kartın tüm yüksekliği
        '.yzhs-k.aktif{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);grid-template-rows:auto auto 1fr auto;column-gap:.8vw;row-gap:.4vh;align-items:center;justify-items:start}',
        '.yzhs-k.aktif .yzhs-h{grid-column:1;grid-row:1/5;height:100%;align-self:stretch}',
        '.yzhs-k.aktif .yzhs-ust{grid-column:2;grid-row:1}.yzhs-k.aktif .yzhs-ad{grid-column:2;grid-row:2;white-space:normal;line-height:1.1}',
        '.yzhs-k.aktif .yzhs-oklar{grid-column:2;grid-row:3;justify-content:flex-start;align-self:start}.yzhs-k.aktif small{grid-column:2;grid-row:4;white-space:normal}',
        '.yzhs-k.aktif .yzhs-arti{left:auto;right:0;width:50%;top:40%}',
        '.yzhs-ust{display:flex;align-items:center;gap:.4vw;width:100%}.yzhs-ust .yz-yuz{width:max(24px,2.4vw);height:max(24px,2.4vw);font-size:max(10px,.9vw)}',
        '.yzhs.sayac .yzhs-k.aktif .yzhs-ust .yz-yuz{width:max(36px,3.6vw);height:max(36px,3.6vw)}',
        '.yzhs-sira{font-weight:900;font-size:max(12px,1.1vw);opacity:.6}.yzhs-top{margin-left:auto;font-weight:900;font-size:max(15px,1.6vw);font-variant-numeric:tabular-nums}.yzhs-k.aktif .yzhs-top{font-size:max(18px,2.1vw)}',
        '.yzhs-h{flex:1;min-height:0;width:100%;position:relative}',
        '.yzhs-kare{position:absolute;top:13%;bottom:13%;left:50%;transform:translateX(-50%);aspect-ratio:1;max-width:100%;transition:top .6s,bottom .6s}.yzhs-k.aktif .yzhs-kare{top:0;bottom:0}',
        '.yzhs-kare svg,.yzhs-kare canvas{position:absolute;inset:0;width:100%;height:100%}',
        '.yzhs-kare canvas{opacity:0;transition:opacity 1s;mix-blend-mode:multiply;border-radius:50%}.yzhs-kare.isi canvas{opacity:.85}',
        '.yzhs-kare svg{z-index:1}.yzhs-kare.isi svg .yzhs-ok:not(.son){opacity:.55}',
        '.yzhs-kare canvas{z-index:0}.yzhs-kare svg circle:not(.yzhs-ok){mix-blend-mode:normal}',
        '.yzhs-ok{fill:#16a34a;stroke:#fff;stroke-width:.018}.yzhs-ok.son{fill:#facc15;stroke:#1d1a16;stroke-width:.022}',
        '.yzhs-ok.dus{transform-box:fill-box;transform-origin:center;animation:yzhsDus .45s cubic-bezier(.2,1.6,.4,1) both}',
        '@keyframes yzhsDus{from{opacity:0;transform:scale(3.2)}to{opacity:1;transform:scale(1)}}',
        '.yzhs-mrk line{stroke:#10b981;stroke-width:.035;stroke-linecap:round}',
        '.yzhs-k.konumsuz .yzhs-kare{opacity:.35}.yzhs-yok{position:absolute;z-index:2;left:50%;top:50%;transform:translate(-50%,-50%);font-weight:900;font-size:max(10px,.8vw);background:#1d1a16;color:#fff;padding:.2vh .5vw;border-radius:99px;white-space:nowrap}',
        '.yzhs-ad{font-weight:900;font-size:max(12px,1.05vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.yzhs-k.aktif .yzhs-ad{font-size:max(14px,1.35vw)}.yzhs.sayac .yzhs-k.aktif .yzhs-ad{font-size:max(16px,1.8vw)}',
        '.yzhs-oklar{display:flex;gap:.25vw;justify-content:center;flex-wrap:wrap}.yzhs-oklar .yz-ok{width:max(20px,1.7vw);height:max(20px,1.7vw);font-size:max(10px,.8vw);font-style:normal;margin:0}',
        // açık şerit (tablonun altında, kısa): kartlar sade — küçük oklar, aktif olmayanda alt yazı yok, hedef kartı doldursun
        '.yzhs.acik .yzhs-oklar .yz-ok{width:max(16px,1.3vw);height:max(16px,1.3vw);font-size:max(9px,.65vw)}.yzhs.acik .yzhs-k small{display:none}.yzhs.acik .yzhs-kare{top:4%;bottom:4%}.yzhs.acik .yzhs-k{overflow:hidden}',
        '.yzhs.sayac .yzhs-oklar .yz-ok{width:max(26px,2.4vw);height:max(26px,2.4vw);font-size:max(12px,1.1vw)}',
        '.yzhs-k small{font-size:max(10px,.75vw);font-weight:800;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.yzhs-k.aktif small{opacity:.9;font-size:max(11px,.9vw)}',
        '.yzhs-arti{position:absolute;z-index:3;left:0;right:0;top:34%;text-align:center;font-weight:900;font-size:max(26px,4vw);color:#16a34a;-webkit-text-stroke:.12vw #fff;paint-order:stroke;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '.yzhs-satir-arti{position:absolute;right:105%;top:50%;font-weight:900;font-size:.8em;color:#16a34a;white-space:nowrap;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '@keyframes yzhsArti{0%{opacity:0;transform:translateY(0) scale(.6)}18%{opacity:1;transform:translateY(-40%) scale(1.25)}75%{opacity:1}100%{opacity:0;transform:translateY(-140%)}}',
        '.yzhs-sayfa{position:absolute;right:.4vw;top:.2vh;font-size:max(10px,.75vw);font-weight:800;opacity:.55}.yzhs.acik .yzhs-sayfa{right:9vw;top:.8vh}',
        // geri sayım: tablo (ve oyun şeridi) gizli, şerit kalan alanı kaplar
        '#yz-tv.hs-sayac .yz-tv-tablo,#yz-tv.hs-sayac .yz-tvo{display:none}',
        // ⛶ büyük sayaç da açıksa başlıktaki küçük sayaç ve seri kutusu aynı bilgiyi verir → gizli; yönetim düğmeleri sağda kalır
        'html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-kimlik,html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-seri,html.yz-dev-acik #yz-tv.hs-sayac #yz-tv-sayac{display:none}',
        'html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-bas{display:flex;justify-content:flex-end}',
        '@media (prefers-reduced-motion:reduce){.yzhs-ok.dus,.yzhs-arti,.yzhs-satir-arti{animation:none}.yzhs-k{transition:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
