// 🎯 TV hedef şeridi (2026-10-22, kullanıcı taslaklardan "2 · Hedef şeridi"ni seçti: "saniyeyi başlatıyorum, ekranın yarısını
// zaten saniye kaplıyor; altta da bu animasyonlar dönsün büyük olarak, her gelen sporcu daha büyük olabilir").
// Herkesin hedef kâğıdı: hedefe dokunarak / yönle girilen okların konumu + ısı haritası. Işık sıradaki sporcuya geçer; yeni skor
// gelince o sporcuya atlar, kartında ve tablodaki satırında "+56" uçar.
// v307 üç hâl —
//   kapalı (varsayılan): altta ince "🎯 Hedef kâğıtları ▲" çubuğu, tablo tüm ekranı kullanır;
//   açık: çubuğa dokununca tablonun altında kart şeridi (cihaz hatırlar), ışık 4,5 sn'de bir döner;
//   geri sayım (hatta geç / atış / son 30 sn) ya da ☕ mola: tablo gizlenir, şerit kalan alanı kaplar.
// v322 (2026-10-26, kullanıcı taslaklardan "A · Yakın çekim"i seçti: "dönen ısı analizleri animasyon ve detay olarak daha iyi olsun"):
// geri sayım / mola hâlinde YAKIN ÇEKİM — sırası gelenin hedefi büyüyerek gelir, son serinin okları iz bırakarak numaralarıyla
// saplanır, ısı haritası grubun ortasından yayılır (eş yükselti çizgili), grup halkası ve nişangah yönü çizilir; sağda kimlik,
// son seri, seri grafiği, halka dağılımı, grup çapı, nişangah önerisi; altta sıradakiler ve dolan süre çubuğu. Alan daralınca
// (büyük sayaç "Büyük" boyda) önce sıradakiler, sonra kutular gizlenir (container query). Isı haritası artık hedef yüzünün
// ÜSTÜNDE (eskiden yüzün altında kalıp soluk görünüyordu). Aynı içerik yeniden çizilmez → animasyon başka cihazın kaydıyla baştan başlamaz.
// Hiç kimsede ok konumu yoksa şerit çizilmez. Yalnız yzTvCiz çağırır (dagsk-km-yarisma-pro.js).
let _yzhs = { aktif: 0, son: {}, arti: {}, z: null, mz: null, tur: null, hal: null, isi: {}, donT: 0 };
const YZHS_SURE = 4500, YZHS_SURE_SAYAC = 6000;

function yzhsVeri(o, sira) {
    let d = o.durum;
    return sira.map(function (r) {
        let si = -1; for (let i = r.seriT.length - 1; i >= 0; i--) if (r.seriT[i] != null) { si = i; break; }
        let skor = yzSkor(o, r.k);
        return { k: r.k, ad: r.ad, sira: r.sira, toplam: r.toplam, son: si >= 0 ? r.seriT[si] : null, sonSeri: si, sonOklar: si >= 0 ? (skor[si] || []) : [], kon: yzKonumlar(o, r.k), seriT: r.seriT.filter(function (t) { return t != null; }), tum: [].concat.apply([], skor.filter(Boolean)), d: d };
    });
}
function yzhsAcikAyar() { try { return localStorage.getItem('dag_yz_hs_acik') === '1'; } catch (e) { return false; } }
// Geri sayım sürüyor mu (hatta geç / atış / son 30 sn) ya da ☕ mola mı
function yzhsSayacta(o) {
    if (o && typeof yzMolaDurum === 'function' && yzMolaDurum(o)) return true; // sayaç başlayınca mola silinir
    if (!o || !o.sayac) return false; let f = yzSayacDurum(o).faz; return f === 'hazirlik' || f === 'atis' || f === 'son';
}
function yzhsHal(o) { return yzhsSayacta(o) ? 'sayac' : yzhsAcikAyar() ? 'acik' : 'kapali'; }
// Açık şeritte bir sayfada kaç kart (genişliğe göre)
function yzhsSayfaBoy() { return Math.max(3, Math.min(8, Math.floor(window.innerWidth / 160))); }

function yzhsTazele(el, o, sira) {
    if (!el) return;
    let d = o && o.durum, serit = document.getElementById('yz-tv-serit');
    let kapat = function () { if (serit) serit.remove(); el.classList.remove('serit-var', 'hs-sayac'); if (serit) yzTvSigdir(el); clearInterval(_yzhs.z); _yzhs.z = null; clearInterval(_yzhs.mz); _yzhs.mz = null; };
    if (!d || d.asama !== 'tur') return kapat();
    if (_yzhs.tur !== d.id) { clearInterval(_yzhs.z); _yzhs = { aktif: 0, son: {}, arti: {}, z: null, mz: _yzhs.mz, tur: d.id, hal: null, isi: {}, donT: 0 }; }
    let veri = yzhsVeri(o, sira);
    if (!veri.some(function (v) { return v.kon.length; })) return kapat();
    yzhsCss();
    let yeni = !serit;
    if (yeni) { serit = document.createElement('div'); serit.id = 'yz-tv-serit'; serit.className = 'yzhs'; }
    if (serit.parentNode !== el) { let tb = el.querySelector('.yz-tv-tablo'); el.insertBefore(serit, tb ? tb.nextSibling : null); }
    el.classList.add('serit-var');
    // yeni skorlar: toplamı artan sporcu → ışık ona, "+fark"
    let gelen = [], eskiK = _yzhs.veri && _yzhs.veri[_yzhs.aktif] ? _yzhs.veri[_yzhs.aktif].k : null;
    veri.forEach(function (v) { let e = _yzhs.son[v.k]; if (e != null && v.toplam > e) { gelen.push(v.k); _yzhs.arti[v.k] = { fark: v.toplam - e, t: Date.now() }; } _yzhs.son[v.k] = v.toplam; });
    _yzhs.veri = veri;
    // ışık yeni skora atlar ve sayaç baştan başlar (kart tam bir tur ekranda kalsın); sıralama değişse de aynı sporcuda kalır
    if (gelen.length) { let i = veri.findIndex(function (v) { return v.k === gelen[gelen.length - 1]; }); if (i >= 0) _yzhs.aktif = i; clearInterval(_yzhs.z); _yzhs.z = null; }
    else { let i = eskiK ? veri.findIndex(function (v) { return v.k === eskiK; }) : -1; _yzhs.aktif = i >= 0 ? i : _yzhs.aktif >= veri.length ? 0 : _yzhs.aktif; }
    let hal = yzhsHal(o), degisti = hal !== _yzhs.hal; _yzhs.hal = hal;
    yzhsCiz();
    Object.keys(_yzhs.arti).forEach(function (k) { yzhsSatirArti(el, k, _yzhs.arti[k]); }); // tablo her çizimde yenilenir → yeniden ekle
    if (yeni || degisti) yzhsSigdir(el);
    yzhsZamanla();
    // geri sayım / mola veri değişmeden başlar/biter (süre dolunca) → hâli saniyede bir kontrol et
    if (!_yzhs.mz) _yzhs.mz = setInterval(yzhsHalKontrol, 1000);
}
function yzhsZamanla() {
    if (_yzhs.z) return; if (_yzhs.hal === 'kapali') return;
    _yzhs.donT = Date.now(); yzhsSureCubugu();
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
    _yzhs.aktif = (_yzhs.aktif + 1) % _yzhs.veri.length; _yzhs.donT = Date.now();
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

// ---------------------------------------------------------------- çizim
// Bölümler yalnız HTML'leri değişince yenilenir (aynı sporcu ekrandayken başka cihazdan gelen kayıt animasyonu baştan başlatmasın).
function yzhsYerlestir(kap, html, zorla) { if (!zorla && kap._yzhsHtml === html) return false; kap._yzhsHtml = html; kap.innerHTML = html; return true; }
function yzhsCiz(zorla) {
    let s = document.getElementById('yz-tv-serit'), el = document.getElementById('yz-tv'); if (!s) return;
    zorla = zorla === true;
    let hal = _yzhs.hal || 'kapali', veri = _yzhs.veri || [];
    s.className = 'yzhs ' + hal; if (el) el.classList.toggle('hs-sayac', hal === 'sayac');
    if (s._yzhsHal !== hal) { s._yzhsHal = hal; s.innerHTML = ''; s._yzhsHtml = null; }
    if (hal === 'kapali') {
        let konumlu = veri.filter(function (v) { return v.kon.length; }).length;
        yzhsYerlestir(s, '<button type="button" class="yzhs-tut" onclick="yzhsAcKapat()"><span>🎯 Hedef kâğıtları · ısı haritası</span><small>' + konumlu + ' sporcu · geri sayımda ve molada kendiliğinden büyür</small><b>▲ Aç</b></button>', zorla);
        return;
    }
    if (hal === 'sayac') yzhsYakinCiz(s, veri, zorla); else yzhsKartlarCiz(s, veri, zorla);
    yzhsArtiEkle(s);
    yzhsSureCubugu();
}

// Hedef: altta yüz, ortada ısı haritası (canvas), üstte oklar / grup. o: {anim, grup, num, t0}
function yzhsHedefHTML(v, yuz, o) {
    o = o || {};
    let gr = v.kon.length >= 3 ? yzGrup(v.kon) : null, gx = gr ? ((gr.mx + 1.1) / 2.2 * 100).toFixed(1) + '%' : '50%', gy = gr ? ((gr.my + 1.1) / 2.2 * 100).toFixed(1) + '%' : '50%';
    let l = v.kon.slice(-30), t0 = o.t0 || 0, anim = !!o.anim, sonlar = l.filter(function (p) { return p.seri === v.sonSeri; }), es = l.filter(function (p) { return p.seri !== v.sonSeri; });
    sonlar.sort(function (a, b) { return (a.n || 99) - (b.n || 99); });
    let ust = es.map(function (p, i) { return '<circle class="yzhs-ok' + (anim ? ' bel' : '') + '"' + (anim ? ' style="--d:' + (t0 + 0.1 + i * 0.025).toFixed(2) + 's"' : '') + ' cx="' + p.x.toFixed(3) + '" cy="' + p.y.toFixed(3) + '" r=".036"/>'; }).join('');
    ust += sonlar.map(function (p, i) {
        let x = p.x.toFixed(3), y = p.y.toFixed(3), d = (t0 + 0.55 + i * 0.3).toFixed(2), no = p.n || i + 1;
        let num = anim || o.num ? '<text class="yzhs-no" x="' + (p.x + 0.075).toFixed(3) + '" y="' + (p.y - 0.06).toFixed(3) + '">' + no + '</text>' : '';
        if (!anim) return '<circle class="yzhs-ok son" cx="' + x + '" cy="' + y + '" r=".055"/>' + num;
        let gx2 = (p.x + 0.5 + (i % 2) * 0.14).toFixed(3), gy2 = (p.y - 0.95).toFixed(3);
        return '<g class="yzhs-ucus" style="--d:' + d + 's"><line pathLength="1" x1="' + gx2 + '" y1="' + gy2 + '" x2="' + x + '" y2="' + y + '"/><circle class="yzhs-dalga" cx="' + x + '" cy="' + y + '" r=".2"/><circle class="yzhs-ok son" cx="' + x + '" cy="' + y + '" r=".058"/>' + num + '</g>';
    }).join('');
    if (o.grup && gr && v.kon.length >= 6) {
        let gd = (t0 + 0.55 + sonlar.length * 0.3 + 0.6).toFixed(2), rr = Math.max(0.08, gr.yay * 1.25), mx = gr.mx.toFixed(3), my = gr.my.toFixed(3), kay = Math.hypot(gr.mx, gr.my) * yuz.R;
        ust += '<g class="yzhs-grup" style="--d:' + gd + 's"><circle class="yzhs-gh" pathLength="1" cx="' + mx + '" cy="' + my + '" r="' + rr.toFixed(3) + '" transform="rotate(-90 ' + mx + ' ' + my + ')"/>'
            + '<g class="yzhs-mrk"><line x1="' + (gr.mx - 0.12).toFixed(3) + '" x2="' + (gr.mx + 0.12).toFixed(3) + '" y1="' + my + '" y2="' + my + '"/><line x1="' + mx + '" x2="' + mx + '" y1="' + (gr.my - 0.12).toFixed(3) + '" y2="' + (gr.my + 0.12).toFixed(3) + '"/></g>'
            + (kay >= 2 ? '<path class="yzhs-yon" pathLength="1" d="M' + mx + ' ' + my + 'L' + (gr.mx * 0.22).toFixed(3) + ' ' + (gr.my * 0.22).toFixed(3) + '"/><circle class="yzhs-yon-uc" cx="' + (gr.mx * 0.22).toFixed(3) + '" cy="' + (gr.my * 0.22).toFixed(3) + '" r=".03"/>' : '') + '</g>';
    }
    return '<div class="yzhs-kare' + (o.isi ? ' isi' : '') + '" style="--gx:' + gx + ';--gy:' + gy + '" data-k="' + esc(v.k) + '"><svg class="yzhs-yuz" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">' + yzHedefYuzSVG(yuz, yzMakaraliMi(v.k)) + '</svg><canvas></canvas>'
        + '<svg class="yzhs-ust-k" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">' + ust + '</svg>' + (v.kon.length ? '' : '<span class="yzhs-yok">yalnız puan</span>') + '</div>';
}
// Isı haritaları: kâğıt başına önbellek (yalnız oklar değişince yeniden hesaplanır), sonra kopyalanır
function yzhsIsileriBagla(kok, W) {
    kok.querySelectorAll('.yzhs-kare').forEach(function (h) {
        let k = h.getAttribute('data-k'), v = (_yzhs.veri || []).find(function (x) { return x.k === k; }); if (!v || !v.kon.length) return;
        let cv = h.querySelector('canvas'), kay = yzhsIsiKaynak(v, W); if (!kay) return;
        cv.width = cv.height = W; let c = cv.getContext('2d'); if (c) c.drawImage(kay, 0, 0);
    });
}
const YZHS_TERMAL = [[0, [56, 189, 248]], [0.3, [74, 222, 128]], [0.55, [250, 204, 21]], [0.78, [249, 115, 22]], [1, [220, 38, 38]]];
function yzhsTermal(a) { for (let i = 1; i < YZHS_TERMAL.length; i++) if (a <= YZHS_TERMAL[i][0]) { let p = YZHS_TERMAL[i - 1], q = YZHS_TERMAL[i], t = (a - p[0]) / (q[0] - p[0]); return [0, 1, 2].map(function (j) { return p[1][j] + (q[1][j] - p[1][j]) * t; }); } return YZHS_TERMAL[4][1]; }
// Her ok yumuşak bir leke (alfa birikir) → yoğunluğa göre mavi → yeşil → sarı → turuncu → kırmızı, kademe sınırlarında eş yükselti çizgisi
function yzhsIsiKaynak(v, W) {
    let imza = W + ':' + v.kon.map(function (p) { return p.x.toFixed(2) + ',' + p.y.toFixed(2); }).join(';'), c0 = _yzhs.isi[v.k + ':' + W];
    if (c0 && c0.imza === imza) return c0.cv;
    let cv = document.createElement('canvas'); cv.width = cv.height = W; let c = cv.getContext('2d'); if (!c) return null;
    let b = function (x) { return (x + 1.1) / 2.2 * W; };
    v.kon.forEach(function (p) { let x = b(p.x), y = b(p.y), g = c.createRadialGradient(x, y, 0, x, y, W * 0.13); g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
    let im = c.getImageData(0, 0, W, W), px = im.data, n = W * W, A = new Float32Array(n), mx = 0;
    for (let i = 0; i < n; i++) { A[i] = px[i * 4 + 3]; if (A[i] > mx) mx = A[i]; }
    let kat = function (a) { return a < 0.35 ? 0 : a < 0.6 ? 1 : a < 0.85 ? 2 : 3; };
    for (let i = 0; i < n; i++) {
        let a = A[i] / (mx || 1), j = i * 4;
        if (a < 0.1) { px[j + 3] = 0; continue; }
        let r = yzhsTermal(a), ka = kat(a), sinir = (i % W) < W - 1 && i + W < n && (ka !== kat(A[i + 1] / mx) || ka !== kat(A[i + W] / mx));
        px[j] = sinir ? 40 : r[0]; px[j + 1] = sinir ? 30 : r[1]; px[j + 2] = sinir ? 20 : r[2]; px[j + 3] = sinir ? 120 : Math.min(190, 30 + a * 170);
    }
    c.putImageData(im, 0, 0);
    _yzhs.isi[v.k + ':' + W] = { imza: imza, cv: cv };
    return cv;
}

// ---- 🔭 yakın çekim (geri sayım / mola)
function yzhsYakinCiz(s, veri, zorla) {
    let o = yzOku(), yuz = yzYuz(o.durum), v = veri[_yzhs.aktif] || veri[0]; if (!v) return;
    if (!s.querySelector('.yzhs-a')) { s.innerHTML = '<div class="yzhs-a"><div class="yzhs-baslik"><span>🎯 Oklar nereye gitti?</span><small><i class="yzhs-lj son"></i> son seri (numaralı) <i class="yzhs-lj"></i> önceki oklar <b>+</b> grup merkezi <em>→</em> nişangah yönü</small></div><div class="yzhs-a-ana"></div><div class="yzhs-a-film"></div></div>'; }
    let ana = s.querySelector('.yzhs-a-ana'), film = s.querySelector('.yzhs-a-film');
    let ok = v.tum.length, gr = v.kon.length >= 3 ? yzGrup(v.kon) : null, on = gr && v.kon.length >= 6 ? yzGrupOneri(gr, yuz) : null;
    let sonOklar = v.sonOklar.length ? '<div class="yzhs-sonseri"><span class="yzhs-et">Son seri' + (v.sonSeri >= 0 ? ' · ' + (v.sonSeri + 1) + '. seri' : '') + '</span>' + v.sonOklar.map(function (p, i) { return '<i class="yz-ok ' + yzOkRenk(p) + '" style="--d:' + (0.2 + 0.55 + i * 0.3 + 0.3).toFixed(2) + 's">' + esc(p) + '</i>'; }).join('') + '<b class="yzhs-esit" style="--d:' + (0.2 + 0.55 + v.sonOklar.length * 0.3 + 0.3).toFixed(2) + 's">= ' + v.son + '</b></div>' : '<div class="yzhs-sonseri"><span class="yzhs-et">Henüz seri yok</span></div>';
    let html = '<div class="yzhs-a-hedef">' + yzhsHedefHTML(v, yuz, { anim: true, grup: true, t0: 0.2 }) + '</div>'
        + '<div class="yzhs-a-bilgi">'
        + '<div class="yzhs-kimlik" style="--d:.15s">' + yzFotoYuz(v.k) + '<div class="yzhs-kim-ad"><b>' + esc(v.ad) + '</b><small><span class="yzhs-rozet">' + v.sira + '. sıra</span>' + v.seriT.length + ' seri · ' + ok + ' ok</small></div><div class="yzhs-kim-top"><b data-say="' + v.toplam + '">' + v.toplam + '</b><small>Toplam</small></div></div>'
        + '<div style="--d:.35s">' + sonOklar + '</div>'
        + '<div class="yzhs-kutular" style="--d:1.2s">'
        + '<div class="yzhs-kutu"><span class="yzhs-et">Seriler</span>' + yzhsCizgiHTML(v.seriT) + '</div>'
        + '<div class="yzhs-kutu"><span class="yzhs-et">Halka dağılımı</span>' + yzhsDagilimHTML(v.tum) + '</div>'
        + '<div class="yzhs-kutu"><span class="yzhs-et">Grup</span><b class="yzhs-buyuk">' + (on ? on.cap + ' cm' : '–') + '</b><small>' + (on ? on.sik + ' · ' : '') + 'ok ort. ' + (ok ? (v.toplam / ok).toFixed(1) : '–') + '</small></div>'
        + '</div>'
        + (on ? '<div class="yzhs-oneri" style="--d:' + (0.2 + 0.55 + v.sonOklar.length * 0.3 + 1).toFixed(2) + 's">' + yzhsPusulaHTML(gr, yuz) + '<div><b>' + esc(on.kisa) + '</b> · ' + esc(on.oneri.replace(/\.$/, '')) + '</div></div>' : '')
        + '</div>';
    if (yzhsYerlestir(ana, html, zorla)) {
        ana.setAttribute('data-k', v.k);
        yzhsIsileriBagla(ana, 320);
        let h = ana.querySelector('.yzhs-kare'), gec = (0.2 + 0.55 + Math.min(v.sonOklar.length, 6) * 0.3 + 0.2) * 1000;
        setTimeout(function () { if (h && h.isConnected) h.classList.add('isi'); }, gec);
        yzhsSay(ana);
    }
    // altta sıradakiler: aktif kartı içeren pencere
    let n = Math.max(3, Math.min(7, Math.floor(window.innerWidth / 230))), bas = Math.max(0, Math.min(veri.length - n, _yzhs.aktif - 1)), parca = veri.slice(bas, bas + n);
    let fh = parca.map(function (x, j) {
        let i = bas + j;
        return '<div class="yzhs-f' + (i === _yzhs.aktif ? ' aktif' : '') + (x.kon.length ? '' : ' konumsuz') + '" data-k="' + esc(x.k) + '">' + yzhsHedefHTML(x, yuz, { isi: true })
            + '<div class="yzhs-f-ad">' + x.sira + '. ' + esc(yzKisaAd(x.ad)) + '</div><div class="yzhs-f-top">' + x.toplam + '</div><small>' + (x.son != null ? 'son ' + x.son : 'skor bekleniyor') + '</small><i class="yzhs-sure"></i></div>';
    }).join('') + (veri.length > n ? '<div class="yzhs-f-say">' + (_yzhs.aktif + 1) + ' / ' + veri.length + '</div>' : '');
    if (yzhsYerlestir(film, fh, zorla)) yzhsIsileriBagla(film, 160);
}
function yzhsSay(kok) {
    kok.querySelectorAll('[data-say]').forEach(function (e) {
        let h = +e.getAttribute('data-say'), t0 = performance.now(), su = 900;
        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        (function ad(t) { let f = Math.min(1, (t - t0) / su); e.textContent = Math.round(h * (1 - Math.pow(1 - f, 3))); if (f < 1 && e.isConnected) requestAnimationFrame(ad); })(t0);
    });
}
function yzhsCizgiHTML(l) {
    if (!l.length) return '<small>–</small>';
    let w = 160, h = 46, mn = Math.min.apply(null, l) - 4, mx = Math.max.apply(null, l) + 4, x = function (i) { return l.length < 2 ? w / 2 : 8 + i * (w - 16) / (l.length - 1); }, y = function (v) { return 10 + (1 - (v - mn) / (mx - mn || 1)) * (h - 18); };
    let p = l.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
    let etiket = l.length <= 8 ? l : null;
    return '<svg class="yzhs-cizgi" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="' + p + 'L' + x(l.length - 1).toFixed(1) + ' ' + h + 'L' + x(0).toFixed(1) + ' ' + h + 'Z"/><path class="l" pathLength="1" d="' + p + '"/>'
        + l.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === l.length - 1 ? 3.6 : 2.6) + '"/>' + (etiket || i === l.length - 1 || i === 0 ? '<text x="' + x(i).toFixed(1) + '" y="' + (y(v) - 5).toFixed(1) + '" text-anchor="middle">' + v + '</text>' : ''); }).join('') + '</svg>';
}
function yzhsDagilimHTML(tum) {
    let say = { X: 0, '10': 0, '9': 0, '8': 0, '7': 0, '≤6': 0 }; tum.forEach(function (p) { say[say[p] != null ? p : '≤6']++; });
    let mx = Math.max.apply(null, Object.keys(say).map(function (k) { return say[k]; })) || 1, rk = { X: 'sari', '10': 'sari', '9': 'sari', '8': 'kirmizi', '7': 'kirmizi', '≤6': 'mavi' };
    return '<div class="yzhs-dagilim">' + Object.keys(say).map(function (k, i) { return '<div><em>' + say[k] + '</em><i class="yz-r-' + rk[k] + '" style="height:' + Math.max(4, say[k] / mx * 70).toFixed(0) + '%;--d:' + (1.4 + i * 0.07).toFixed(2) + 's"></i><span>' + k + '</span></div>'; }).join('') + '</div>';
}
// Nişangahın gideceği yön (grup merkezinden hedefin ortasına) — merkezdeyse ✓
function yzhsPusulaHTML(gr, yuz) {
    let L = Math.hypot(gr.mx, gr.my) || 1, ux = -gr.mx / L, uy = -gr.my / L, m = Math.hypot(gr.mx, gr.my) * yuz.R < 2.5;
    return '<svg class="yzhs-pus" viewBox="-1 -1 2 2" aria-hidden="true"><circle r=".9" fill="none" stroke="currentColor" stroke-width=".08" opacity=".4"/>' + (m ? '<path d="M-.35 0L-.08 .3L.4-.3" fill="none" stroke="#86efac" stroke-width=".16" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M0 0L' + (ux * 0.6).toFixed(2) + ' ' + (uy * 0.6).toFixed(2) + '" stroke="#fca5a5" stroke-width=".16" stroke-linecap="round"/><circle cx="' + (ux * 0.66).toFixed(2) + '" cy="' + (uy * 0.66).toFixed(2) + '" r=".15" fill="#fca5a5"/>') + '</svg>';
}

// ---- açık şerit (tablonun altında): kartlar, aktif kart büyür, okları düşer
function yzhsKartlarCiz(s, veri, zorla) {
    let n = yzhsSayfaBoy(), sayfa = Math.floor(_yzhs.aktif / n), parca = veri.slice(sayfa * n, sayfa * n + n), yuz = yzYuz(yzOku().durum);
    let html = '<button type="button" class="yzhs-tut acik" onclick="yzhsAcKapat()"><span>🎯 Hedef kâğıtları</span><small><i class="yzhs-lj son"></i> son seri <i class="yzhs-lj"></i> önceki oklar</small><b>▼ Kapat</b></button>'
        + '<div class="yzhs-kartlar">' + parca.map(function (v, j) {
            let i = sayfa * n + j, akt = i === _yzhs.aktif, gr = v.kon.length >= 6 ? yzGrup(v.kon) : null, on = akt && gr ? yzGrupOneri(gr, yuz) : null;
            let oklar = akt && v.sonOklar.length ? '<div class="yzhs-oklar">' + v.sonOklar.map(function (p) { return '<i class="yz-ok ' + yzOkRenk(p) + '">' + esc(p) + '</i>'; }).join('') + '</div>' : '';
            return '<div class="yzhs-k' + (akt ? ' aktif' : '') + (v.kon.length ? '' : ' konumsuz') + '" data-k="' + esc(v.k) + '">'
                + '<div class="yzhs-ust">' + yzFotoYuz(v.k) + '<span class="yzhs-sira">' + v.sira + '.</span><b class="yzhs-top">' + v.toplam + '</b></div>'
                + '<div class="yzhs-h">' + yzhsHedefHTML(v, yuz, { anim: akt, grup: akt, num: akt, isi: !akt }) + '</div>'
                + '<div class="yzhs-ad">' + esc(yzKisaAd(v.ad)) + '</div>' + oklar
                + '<small>' + (on ? esc(on.kisa) : (v.son != null ? (v.sonSeri + 1) + '. seri ' + v.son : 'skor bekleniyor')) + '</small></div>';
        }).join('') + '</div>' + (veri.length > n ? '<div class="yzhs-sayfa">' + (sayfa + 1) + ' / ' + Math.ceil(veri.length / n) + '</div>' : '');
    if (!yzhsYerlestir(s, html, zorla)) return;
    yzhsIsileriBagla(s, 160);
    let a = s.querySelector('.yzhs-k.aktif .yzhs-kare'), v = veri[_yzhs.aktif];
    if (a && v) setTimeout(function () { if (a.isConnected) a.classList.add('isi'); }, (0.75 + Math.min(v.sonOklar.length, 6) * 0.3 + 0.2) * 1000);
}
// "+puan": yeni seri gelen sporcunun kartında (2,2 sn; araya çizim girerse kaldığı yerden sürer)
function yzhsArtiEkle(s) {
    s.querySelectorAll('.yzhs-arti').forEach(function (x) { x.remove(); });
    let simdi = Date.now();
    Object.keys(_yzhs.arti).forEach(function (k) {
        let a = _yzhs.arti[k], g = simdi - a.t; if (g >= 2200) { delete _yzhs.arti[k]; return; }
        [].slice.call(s.querySelectorAll('.yzhs-k[data-k], .yzhs-f[data-k], .yzhs-a-ana[data-k]')).filter(function (e) { return e.getAttribute('data-k') === k; }).forEach(function (kart) {
            let sp = document.createElement('span'); sp.className = 'yzhs-arti'; sp.textContent = '+' + a.fark; sp.style.animationDelay = '-' + g + 'ms'; kart.appendChild(sp);
            setTimeout(function () { sp.remove(); }, 2200 - g);
        });
    });
}
// Aktif kartın altındaki süre çubuğu: sıradaki sporcuya kalan süre
function yzhsSureCubugu() {
    let i = document.querySelector('#yz-tv-serit .yzhs-f.aktif .yzhs-sure'); if (!i) return;
    let g = Date.now() - (_yzhs.donT || Date.now());
    i.style.animation = 'none'; void i.offsetWidth; i.style.animation = 'yzhsSure ' + YZHS_SURE_SAYAC + 'ms linear -' + Math.min(g, YZHS_SURE_SAYAC) + 'ms forwards';
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
        // renkler: koyu TV ve krem kâğıt TV
        '#yz-tv .yzhs{--hs-kart:#0e1f36;--hs-cizgi:#1d3354;--hs-yazi:#e8eef7;--hs-soluk:#8aa2c0;--hs-vurgu:#fbbf24;--hs-koyu:#060d18;--hs-koyu-yazi:#e8eef7;--hs-golge:rgba(0,0,0,.45)}',
        '#yz-tv.kagit .yzhs{--hs-kart:#fffdf8;--hs-cizgi:#1d1a16;--hs-yazi:#1d1a16;--hs-soluk:#6b6358;--hs-vurgu:#d92c20;--hs-koyu:#1d1a16;--hs-koyu-yazi:#fffdf8;--hs-golge:rgba(29,26,22,.22)}',
        '#yz-tv .yzhs{flex:none;display:flex;flex-direction:column;gap:.6vh;position:relative;color:var(--hs-yazi)}',
        '#yz-tv .yzhs.acik{height:30vh;min-height:170px}',
        '#yz-tv .yzhs.sayac{flex:1;min-height:0;container-type:size}',
        // aç/kapat çubuğu
        '.yzhs-tut{display:flex;align-items:center;gap:1vw;width:100%;min-height:38px;padding:.5vh 1.2vw;border-radius:.8vw;border:2px dashed var(--hs-cizgi);background:var(--hs-kart);color:inherit;font:inherit;cursor:pointer;text-align:left}',
        '#yz-tv.kagit .yzhs-tut{border-color:#c9bda6}',
        '.yzhs-tut span{font-weight:900;font-size:max(13px,1.05vw)}.yzhs-tut small{font-size:max(11px,.8vw);font-weight:700;opacity:.65}.yzhs-tut b{margin-left:auto;font-weight:900;font-size:max(13px,1vw);padding:.3vh .9vw;border-radius:99px;background:var(--hs-koyu);color:var(--hs-koyu-yazi);white-space:nowrap}',
        '.yzhs-tut.acik{min-height:30px;padding:.2vh 1vw;border-style:solid;border-width:1px}.yzhs-tut.acik b{background:transparent;color:inherit;border:1px solid currentColor}',
        '.yzhs-lj{display:inline-block;width:.7em;height:.7em;border-radius:50%;background:#16a34a;border:1.5px solid #fff;vertical-align:-.05em;margin:0 .2em 0 .6em;box-shadow:0 0 0 1px rgba(0,0,0,.25)}.yzhs-lj.son{background:#facc15;width:.9em;height:.9em;border-color:#1d1a16}',
        // hedef katmanları: yüz → ısı haritası → oklar
        '.yzhs-kare{position:relative;aspect-ratio:1;max-width:100%;max-height:100%}',
        '.yzhs-kare>svg,.yzhs-kare>canvas{position:absolute;inset:0;width:100%;height:100%}',
        '.yzhs-kare>canvas{z-index:1;border-radius:50%;opacity:0;pointer-events:none}.yzhs-kare>.yzhs-ust-k{z-index:2;overflow:visible}',
        '.yzhs-kare.isi>canvas{animation:yzhsIsi 1.1s cubic-bezier(.2,.8,.2,1) forwards}',
        '@keyframes yzhsIsi{from{opacity:0;clip-path:circle(0% at var(--gx) var(--gy))}to{opacity:1;clip-path:circle(80% at var(--gx) var(--gy))}}',
        '.yzhs-ok{fill:#16a34a;stroke:#fff;stroke-width:.016}.yzhs-ok.son{fill:#facc15;stroke:#1d1a16;stroke-width:.022}.yzhs-kare.isi .yzhs-ok:not(.son){opacity:.6}',
        '.yzhs-ok.bel{opacity:0;animation:yzhsBel .4s var(--d) forwards}@keyframes yzhsBel{to{opacity:.85}}',
        '.yzhs-no{font-weight:900;font-size:.085px;fill:#1d1a16;paint-order:stroke;stroke:#fff;stroke-width:.026px}',
        // ok uçuşu: iz → saplanma → halka dalgası → numara
        '.yzhs-ucus line{stroke:var(--hs-koyu);stroke-width:.03;stroke-linecap:round;stroke-dasharray:.3 1;stroke-dashoffset:.3;opacity:0;animation:yzhsIz .32s var(--d) cubic-bezier(.5,0,.9,.6) forwards}',
        '#yz-tv:not(.kagit) .yzhs-ucus line{stroke:#fff}',
        '@keyframes yzhsIz{0%{stroke-dashoffset:.3;opacity:1}85%{opacity:1}100%{stroke-dashoffset:-.72;opacity:0}}',
        '.yzhs-ucus .yzhs-ok{transform-box:fill-box;transform-origin:center;transform:scale(0);animation:yzhsSapla .5s calc(var(--d) + .3s) cubic-bezier(.2,1.8,.4,1) forwards}',
        '@keyframes yzhsSapla{to{transform:scale(1)}}',
        '.yzhs-dalga{fill:none;stroke:#1d1a16;stroke-width:.012;transform-box:fill-box;transform-origin:center;opacity:0;animation:yzhsDalga .7s calc(var(--d) + .3s) ease-out forwards}',
        '@keyframes yzhsDalga{0%{opacity:.9;transform:scale(.2)}100%{opacity:0;transform:scale(1)}}',
        '.yzhs-ucus .yzhs-no{opacity:0;animation:yzhsBel2 .3s calc(var(--d) + .45s) forwards}@keyframes yzhsBel2{to{opacity:1}}',
        // grup halkası çizilir, merkez artısı, nişangah yönü
        '.yzhs-gh{fill:none;stroke:#1d1a16;stroke-width:.014;stroke-dasharray:1;stroke-dashoffset:1;animation:yzhsCiz 1s var(--d) ease-out forwards}',
        '.yzhs-mrk line{stroke:#10b981;stroke-width:.035;stroke-linecap:round}.yzhs-grup .yzhs-mrk{opacity:0;animation:yzhsBel2 .3s var(--d) forwards}',
        '.yzhs-yon{fill:none;stroke:#d92c20;stroke-width:.024;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:yzhsCiz .6s calc(var(--d) + .5s) forwards}.yzhs-yon-uc{fill:#d92c20;opacity:0;animation:yzhsBel2 .2s calc(var(--d) + 1.05s) forwards}',
        '@keyframes yzhsCiz{to{stroke-dashoffset:0}}',
        '.yzhs-kare .yzhs-yok{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);font-weight:900;font-size:max(10px,.8vw);background:#1d1a16;color:#fff;padding:.2vh .5vw;border-radius:99px;white-space:nowrap}',
        '.konumsuz .yzhs-yuz{opacity:.35}',
        // +puan
        '.yzhs-arti{position:absolute;z-index:5;left:0;right:0;top:34%;text-align:center;font-weight:900;font-size:max(26px,4vw);color:#16a34a;-webkit-text-stroke:.12vw #fff;paint-order:stroke;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '.yzhs-a-ana>.yzhs-arti{left:0;right:auto;width:45%;top:38%;font-size:min(16cqh,9vw)}',
        '.yzhs-satir-arti{position:absolute;right:105%;top:50%;font-weight:900;font-size:.8em;color:#16a34a;white-space:nowrap;animation:yzhsArti 2.2s forwards;pointer-events:none}',
        '@keyframes yzhsArti{0%{opacity:0;transform:translateY(0) scale(.6)}18%{opacity:1;transform:translateY(-40%) scale(1.25)}75%{opacity:1}100%{opacity:0;transform:translateY(-140%)}}',
        // ---- açık şerit kartları
        '.yzhs-kartlar{flex:1;min-height:0;display:flex;gap:.9vw;align-items:stretch}',
        '.yzhs-k{flex:1 1 0;min-width:0;position:relative;display:flex;flex-direction:column;align-items:center;gap:.3vh;padding:.8vh .5vw;border-radius:1vw;background:var(--hs-kart);border:2px solid var(--hs-cizgi);overflow:hidden;transition:flex-grow .6s cubic-bezier(.3,1.3,.5,1),border-color .4s,box-shadow .4s}',
        '.yzhs-k.aktif{flex-grow:1.7;border-color:var(--hs-vurgu);box-shadow:0 0 0 .3vw color-mix(in srgb,var(--hs-vurgu) 22%,transparent),0 1.2vh 3vh var(--hs-golge);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);grid-template-rows:auto auto 1fr auto;column-gap:.8vw;row-gap:.4vh;align-items:center;justify-items:start}',
        '.yzhs-k.aktif .yzhs-h{grid-column:1;grid-row:1/5;height:100%;align-self:stretch}',
        '.yzhs-k.aktif .yzhs-ust{grid-column:2;grid-row:1}.yzhs-k.aktif .yzhs-ad{grid-column:2;grid-row:2;white-space:normal;line-height:1.1}',
        '.yzhs-k.aktif .yzhs-oklar{grid-column:2;grid-row:3;justify-content:flex-start;align-self:start}.yzhs-k.aktif small{grid-column:2;grid-row:4;white-space:normal}',
        '.yzhs-k.aktif .yzhs-arti{left:auto;right:0;width:50%;top:40%}',
        '.yzhs-h{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center}.yzhs-h .yzhs-kare{height:100%}',
        '.yzhs-ust{display:flex;align-items:center;gap:.4vw;width:100%}.yzhs-ust .yz-yuz{width:max(24px,2.4vw);height:max(24px,2.4vw);font-size:max(10px,.9vw)}',
        '.yzhs-sira{font-weight:900;font-size:max(12px,1.1vw);opacity:.6}.yzhs-top{margin-left:auto;font-weight:900;font-size:max(15px,1.6vw);font-variant-numeric:tabular-nums}.yzhs-k.aktif .yzhs-top{font-size:max(18px,2.1vw)}',
        '.yzhs-ad{font-weight:900;font-size:max(12px,1.05vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.yzhs-k.aktif .yzhs-ad{font-size:max(14px,1.35vw)}',
        '.yzhs-oklar{display:flex;gap:.25vw;justify-content:center;flex-wrap:wrap}.yzhs-oklar .yz-ok{width:max(16px,1.3vw);height:max(16px,1.3vw);font-size:max(9px,.65vw);font-style:normal;margin:0}',
        '.yzhs.acik .yzhs-k small{display:none}',
        '.yzhs-k small{font-size:max(10px,.75vw);font-weight:800;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
        '.yzhs-sayfa{position:absolute;right:9vw;top:.8vh;font-size:max(10px,.75vw);font-weight:800;opacity:.55}',
        // ---- 🔭 yakın çekim (geri sayım / mola) — ölçüler şeridin kendi boyuna göre (cqh/cqw)
        '.yzhs-a{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:max(6px,2cqh)}',
        '.yzhs-baslik{display:flex;align-items:baseline;gap:1.2vw;padding:0 .4vw;flex-wrap:wrap}.yzhs-baslik span{font-weight:900;font-size:max(14px,min(1.4vw,3.6cqh))}.yzhs-baslik small{font-size:max(11px,min(.95vw,2.6cqh));font-weight:800;opacity:.7}.yzhs-baslik b{color:#10b981;font-size:1.2em}.yzhs-baslik em{color:#d92c20;font-style:normal;font-weight:900}',
        '.yzhs-a>.yzhs-baslik{grid-row:1}.yzhs-a>.yzhs-a-ana{grid-row:2}.yzhs-a>.yzhs-a-film{grid-row:3}',
        '.yzhs-a-ana{position:relative;min-height:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:3cqw;align-items:center}',
        '.yzhs-a-hedef{height:100%;aspect-ratio:1;max-width:46cqw;display:flex;align-items:center;justify-content:center;min-height:0}',
        '.yzhs-a-hedef .yzhs-kare{height:100%;width:auto;filter:drop-shadow(0 1.2cqh 2cqh var(--hs-golge));animation:yzhsYaklas .8s cubic-bezier(.2,.9,.25,1) both}',
        '@keyframes yzhsYaklas{from{transform:scale(.55) translateY(14%);opacity:0;filter:blur(6px)}to{transform:none;opacity:1}}',
        '.yzhs-a-bilgi{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:max(6px,2.2cqh)}',
        '.yzhs-a-bilgi>*{opacity:0;animation:yzhsSag .5s var(--d,0s) cubic-bezier(.2,.9,.3,1) forwards}@keyframes yzhsSag{from{opacity:0;transform:translateX(3cqw)}to{opacity:1;transform:none}}',
        '.yzhs-kimlik{display:flex;align-items:center;gap:1.4cqw;min-width:0}',
        '.yzhs-kimlik .yz-yuz{flex:none;width:min(11cqh,6cqw);height:min(11cqh,6cqw);font-size:min(4.4cqh,2.4cqw);box-shadow:0 0 0 .35vw var(--hs-kart),0 0 0 .6vw var(--hs-vurgu)}',
        '.yzhs-kim-ad{min-width:0}.yzhs-kim-ad b{display:block;font-weight:900;font-size:max(18px,min(8cqh,4.2cqw));line-height:1.02;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.yzhs-kim-ad small{display:block;font-weight:800;font-size:max(11px,min(2.8cqh,1.3cqw));color:var(--hs-soluk);margin-top:.6cqh}',
        '.yzhs-rozet{display:inline-block;background:var(--hs-vurgu);color:#fff;border-radius:99px;padding:.1em .7em;margin-right:.6em}#yz-tv:not(.kagit) .yzhs-rozet{color:#0b1220}',
        '.yzhs-kim-top{margin-left:auto;text-align:right;flex:none}.yzhs-kim-top b{display:block;font-weight:900;font-size:max(26px,min(14cqh,7cqw));line-height:.9;font-variant-numeric:tabular-nums}.yzhs-kim-top small{font-weight:900;font-size:max(10px,min(2.4cqh,1.1cqw));letter-spacing:.1em;text-transform:uppercase;color:var(--hs-soluk)}',
        '.yzhs-et{display:block;width:100%;font-weight:900;font-size:max(10px,min(2.4cqh,1.05cqw));letter-spacing:.08em;text-transform:uppercase;color:var(--hs-soluk)}',
        '.yzhs-sonseri{display:flex;align-items:center;gap:.8cqw;flex-wrap:wrap}',
        '.yzhs-sonseri .yz-ok{width:max(24px,min(9cqh,4.4cqw));height:max(24px,min(9cqh,4.4cqw));font-size:max(12px,min(4.4cqh,2.1cqw));font-style:normal;margin:0;transform:scale(0);animation:yzhsSapla .45s var(--d) cubic-bezier(.2,1.8,.4,1) forwards}',
        '.yzhs-esit{font-weight:900;font-size:max(18px,min(7cqh,3.3cqw));margin-left:.4cqw;white-space:nowrap;opacity:0;animation:yzhsBel2 .3s var(--d) forwards}',
        '.yzhs-kutular{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1cqw}',
        '.yzhs-kutu{background:var(--hs-kart);border:2px solid var(--hs-cizgi);border-radius:1vw;padding:1cqh 1cqw;min-width:0;display:flex;flex-direction:column;gap:.4cqh}',
        '#yz-tv:not(.kagit) .yzhs-kutu{border-color:#2a4466}',
        '.yzhs-kutu small{font-weight:800;font-size:max(10px,min(2.4cqh,1.05cqw));color:var(--hs-soluk)}.yzhs-buyuk{font-weight:900;font-size:max(18px,min(8cqh,3cqw));line-height:1.05;font-variant-numeric:tabular-nums}',
        '.yzhs-cizgi{width:100%;height:max(34px,11cqh);overflow:visible}.yzhs-cizgi path.l{fill:none;stroke:var(--hs-vurgu);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:yzhsCiz 1.1s 1.5s ease-out forwards}',
        '.yzhs-cizgi path.a{fill:var(--hs-vurgu);opacity:0;animation:yzhsAlan .6s 2.3s forwards}@keyframes yzhsAlan{to{opacity:.13}}',
        '.yzhs-cizgi circle{fill:var(--hs-vurgu);stroke:var(--hs-kart);stroke-width:1.5}.yzhs-cizgi text{font-weight:900;font-size:9px;fill:var(--hs-yazi)}',
        '.yzhs-dagilim{display:flex;align-items:flex-end;gap:.4cqw;height:max(34px,11cqh)}',
        '.yzhs-dagilim div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:.2cqh;min-width:0}',
        '.yzhs-dagilim i{display:block;width:100%;border-radius:.3vw .3vw 0 0;border:1px solid #1d1a16;transform-origin:bottom;transform:scaleY(0);animation:yzhsBoy .7s var(--d) cubic-bezier(.2,.9,.3,1) forwards}@keyframes yzhsBoy{to{transform:scaleY(1)}}',
        '.yzhs-dagilim span,.yzhs-dagilim em{font-weight:900;font-style:normal;font-size:max(9px,min(2.2cqh,.95cqw))}',
        '.yzhs-oneri{display:flex;align-items:center;gap:1.2cqw;background:var(--hs-koyu);color:var(--hs-koyu-yazi);border-radius:1vw;padding:1.4cqh 1.4cqw;font-weight:700;font-size:max(13px,min(3.6cqh,1.5cqw))}',
        '#yz-tv:not(.kagit) .yzhs-oneri{border:2px solid #2a4466}.yzhs-oneri b{color:#86efac}.yzhs-pus{flex:none;width:max(26px,min(9cqh,3.6cqw));height:max(26px,min(9cqh,3.6cqw))}',
        // sıradakiler
        '.yzhs-a-film{display:flex;gap:.8cqw;height:max(70px,min(19cqh,170px));position:relative}',
        '.yzhs-f{flex:1 1 0;min-width:0;position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:1fr auto auto;column-gap:.7cqw;align-items:center;padding:.6cqh .6cqw;border-radius:1vw;background:var(--hs-kart);border:2px solid transparent;overflow:hidden;opacity:.72;transition:transform .5s,opacity .4s,border-color .4s}',
        '#yz-tv.kagit .yzhs-f{border-color:#d8cdb8}#yz-tv:not(.kagit) .yzhs-f{border-color:var(--hs-cizgi)}',
        '.yzhs-f .yzhs-kare{grid-row:1/4;height:calc(100% - 2px);max-height:100%}',
        '.yzhs-f-ad{font-weight:900;font-size:max(11px,min(3.4cqh,1.2cqw));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:end}',
        '.yzhs-f-top{font-weight:900;font-size:max(14px,min(5.4cqh,2cqw));line-height:1;font-variant-numeric:tabular-nums}.yzhs-f small{font-weight:800;font-size:max(10px,min(2.4cqh,.95cqw));color:var(--hs-soluk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:start}',
        '#yz-tv .yzhs-f.aktif{opacity:1;border-color:var(--hs-vurgu);transform:translateY(-.6cqh);box-shadow:0 .8cqh 1.6cqh var(--hs-golge)}',
        '.yzhs-f .yzhs-arti{font-size:min(8cqh,3vw);top:10%;left:auto;right:6%;width:auto}',
        '.yzhs-sure{position:absolute;left:0;bottom:0;height:max(3px,.8cqh);width:0;background:var(--hs-vurgu);display:none}.yzhs-f.aktif .yzhs-sure{display:block}',
        '@keyframes yzhsSure{from{width:0}to{width:100%}}',
        '.yzhs-f-say{position:absolute;right:.4cqw;top:-2.6cqh;font-weight:900;font-size:max(10px,min(2.2cqh,.85cqw));opacity:.55}',
        // alan daralınca: önce sıradakiler, sonra kutular, sonra başlık/öneri gizlenir
        '@container (max-height:430px){.yzhs-a-film{display:none}}',
        '@container (max-height:320px){.yzhs-kutular,.yzhs-baslik{display:none}}',
        '@container (max-height:210px){.yzhs-oneri{display:none}.yzhs-a{gap:0}}',
        // geri sayım / mola: tablo (ve oyun şeridi) gizli, şerit kalan alanı kaplar
        '#yz-tv.hs-sayac .yz-tv-tablo,#yz-tv.hs-sayac .yz-tvo{display:none}',
        // ⛶ büyük sayaç da açıksa başlıktaki küçük sayaç ve seri kutusu aynı bilgiyi verir → gizli; yönetim düğmeleri sağda kalır
        'html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-kimlik,html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-seri,html.yz-dev-acik #yz-tv.hs-sayac #yz-tv-sayac{display:none}',
        'html.yz-dev-acik #yz-tv.hs-sayac .yz-tv-bas{display:flex;justify-content:flex-end}',
        '@media (prefers-reduced-motion:reduce){.yzhs *{animation-duration:.01ms!important;animation-delay:0s!important}.yzhs-k,.yzhs-f{transition:none}.yzhs-satir-arti{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
