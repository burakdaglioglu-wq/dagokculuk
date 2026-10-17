/* ================================================================================================
   📊 SPORCU ANALİZİ — Karışık Sınıf › Yarışma (2026-10-17). Kullanıcı 9 taslaktan "antrenör tablosu gibi olsun ama ısı haritası
   da olsun, gelişim grafiği daha güzel ve detaylı" dedi.
   · Tablo: turdaki (tur yoksa son arşiv turundaki) herkes — bugün, ok ort., son turlar çizgisi, 10+X, ıska, durum etiketi.
     Sütun başlığına dokun → sırala. Satıra dokun → altında ayrıntı açılır.
   · Ayrıntı: 🔥 ısı haritası (bu tur / son 5 tur / tümü; hedefe dokunarak girilen oklardan) + 9 bölge yüzdesi + nişangâh önerisi ·
     📈 gelişim grafiği (aynı mesafedeki turlar: ok ortalaması, sınıf bandı ve ortalaması, 3 turluk eğilim, kişisel rekor) ·
     seri seri bu tur · 🔎 kendiliğinden tespitler.
   Veri: yzOku() (süren tur) + yzArsivOku() (geçmiş turlar; son 10 turda okların konumu da saklanır — kon). Gerçek skora dokunmaz.
   yza* önekli; dagsk-km-yarisma-pro.js'den yzAnalizAc() ile yüklenir.
   ================================================================================================ */
const _yza = { sec: null, kapsam: 'son5', sirala: 'bugun', ters: false, antrenman: true };
function yzaEsc(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s); }
function yzaTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? +m[3] + ' ' + ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][+m[2] - 1] : ''; }
function yzaSayi(v, h) { return v == null || isNaN(v) ? '·' : v.toFixed(h == null ? 2 : h).replace('.', ','); }

// ---------------------------------------------------------------- veri
function yzaTurBilgi() {
    let o = yzOku(), d = o.durum;
    if (d && d.asama && d.asama !== 'kurulum') {
        let sira = yzSiralama(o);
        return { canli: true, o: o, d: d, id: d.id, mesafe: d.ayar.mesafe, tarih: bugunISO(new Date(d.basla)), t: d.basla, yuz: yzYuz(d),
            sporcular: sira.map(function (r) { let dag = yzDagilim(o, r.k); return { k: r.k, ad: r.ad, sira: r.sira, toplam: r.toplam, ok: r.ok, on: r.on, x: r.x, seriT: r.seriT, M: dag.M || 0, r: r }; }) };
    }
    let a = yzArsivOku(), son = a[a.length - 1]; if (!son) return null;
    return { canli: false, o: null, d: null, id: son.id, mesafe: son.mesafe, tarih: son.tarih, t: son.t, yuz: YZ_YUZ[son.yuz || '6'] || YZ_YUZ['6'],
        sporcular: (son.sporcular || []).map(function (s) { return { k: s.k, ad: s.ad, sira: s.sira, toplam: s.toplam, ok: s.ok, on: s.on, x: s.x, seriT: s.seriT || [], M: (s.dag && s.dag.M) || 0 }; }) };
}
// Aynı mesafedeki turlar (eskiden yeniye) — sporcu ve sınıf için ok ortalaması
function yzaGecmis(tur, k) {
    let l = yzArsivOku().filter(function (r) { return r.mesafe === tur.mesafe && r.id !== tur.id; }).concat([{ id: tur.id, t: tur.t, tarih: tur.tarih, sporcular: tur.sporcular, simdi: true }]);
    return l.sort(function (a, b) { return (a.t || 0) - (b.t || 0); }).map(function (r) {
        let ss = (r.sporcular || []).filter(function (s) { return s.ok > 0; }), me = ss.find(function (s) { return s.k === k; });
        if (!me) return null;
        let digerleri = ss.filter(function (s) { return s.k !== k; }).map(function (s) { return s.toplam / s.ok; });
        let ort = digerleri.length ? digerleri.reduce(function (a, b) { return a + b; }, 0) / digerleri.length : null;
        return { id: r.id, tarih: r.tarih, t: r.t, simdi: !!r.simdi, v: me.toplam / me.ok, toplam: me.toplam, sira: me.sira, kisi: ss.length, sinifOrt: ort,
            sinifMin: digerleri.length ? Math.min.apply(null, digerleri) : null, sinifMax: digerleri.length ? Math.max.apply(null, digerleri) : null };
    }).filter(Boolean);
}
function yzaDurum(g, tur, s) {
    if (!s.ok) return { cls: '', ad: 'Atmadı' };
    let simdi = g[g.length - 1], once = g.slice(0, -1).slice(-5);
    let gr = yzaNoktalar(tur, s.k, 'bu'), grp = gr.length >= 6 ? yzGrup(gr) : null;
    if (grp && grp.yay >= 0.42) return { cls: 'uy', ad: 'Teknik bak', not: 'Oklar dağınık' };
    if (!once.length) return { cls: 'yeni', ad: 'İlk tur' };
    let ort = once.reduce(function (a, x) { return a + x.v; }, 0) / once.length, f = simdi.v - ort;
    if (f >= 0.3) return { cls: 'iyi', ad: 'Yükselişte', not: '+' + yzaSayi(f) + ' ok ort.' };
    if (f <= -0.3) return { cls: 'kotu', ad: 'Dikkat', not: yzaSayi(f) + ' ok ort.' };
    return { cls: '', ad: 'Sabit' };
}
// Okların konumu (yüz yerel koordinatı, yarıçap 1): bu tur / son 5 tur / tümü
function yzaNoktalar(tur, k, kapsam) {
    let n = [];
    if (tur.canli) yzKonumlar(tur.o, k).forEach(function (p) { n.push([p.x, p.y]); });
    else { let s = (yzArsivOku().find(function (r) { return r.id === tur.id; }) || { sporcular: [] }).sporcular.find(function (x) { return x.k === k; }); if (s && s.kon) n = n.concat(s.kon); }
    if (_yza.antrenman) n = n.concat(yzaAntrenmanNoktalari(k));
    if (kapsam === 'bu') return n;
    let a = yzArsivOku().filter(function (r) { return r.id !== tur.id; }).sort(function (x, y) { return (y.t || 0) - (x.t || 0); });
    if (kapsam === 'son5') a = a.slice(0, 4);
    a.forEach(function (r) { let s = (r.sporcular || []).find(function (x) { return x.k === k; }); if (s && s.kon) n = n.concat(s.kon); });
    return n;
}

// 🏹 Antrenman okları (2026-10-18, "hedef girişi her yerde"): Skor Gir ve Oyunlar'da hedefe dokunarak girilen son 90 ok.
// Koordinat: halka genişliği 10 birim (6 halka = 60); 3'lüde yüz merkezi y = (spot - 1) × 140. Yarışma yüzüne (yarıçap 1) çevrilir.
function yzaAntrenmanNoktalari(k) {
    let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (!sp || !sp.detayliOklar) return [];
    return sp.detayliOklar.filter(function (o) { return o && o.x != null && o.y != null && !o.duello; }).slice(-90).map(function (o) {
        let y = o.y; if (o.tip === '3spot') { let s = o.spot != null ? o.spot : Math.max(0, Math.min(2, Math.round(o.y / 140) + 1)); y = o.y - (s - 1) * 140; }
        return [Math.round(o.x / 60 * 100) / 100, Math.round(y / 60 * 100) / 100];
    }).filter(function (p) { return Math.hypot(p[0], p[1]) <= 1.15; });
}
function yzaAntrenmanDegis() { _yza.antrenman = !_yza.antrenman; yzaCiz(); }
// ---------------------------------------------------------------- ekran
function yzaAc(kEnc) {
    yzCssYukle(); yzaCss();
    if (!_yza.cekildi) { _yza.cekildi = true; yzArsivCek(function () { if (document.getElementById('yza')) yzaCiz(); }); }
    if (kEnc) _yza.sec = decodeURIComponent(kEnc);
    let kap = document.getElementById('yza');
    if (!kap) {
        kap = document.createElement('div'); kap.id = 'yza'; kap.className = 'yza-arka';
        kap.addEventListener('click', function (e) { if (e.target === kap) yzaKapat(); });
        (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap);
    }
    _yza.ham = localStorage.getItem(yzAnahtar()); yzaCiz(); yzaTazeleBaslat();
}
function yzaKapat() { clearInterval(_yza.z); _yza.z = null; let k = document.getElementById('yza'); if (k) k.remove(); }
// Tur sürerken açık kalırsa: başka cihazdan/girişten skor geldikçe tablo kendiliğinden güncellenir (4 sn'de bir değişiklik bakılır)
function yzaTazeleBaslat() { if (_yza.z) return; _yza.z = setInterval(function () { let k = document.getElementById('yza'); if (!k) { clearInterval(_yza.z); _yza.z = null; return; } let h = localStorage.getItem(yzAnahtar()); if (h !== _yza.ham) { _yza.ham = h; yzaCiz(); } }, 4000); }
function yzaSec(kEnc) { let k = decodeURIComponent(kEnc); _yza.sec = _yza.sec === k ? null : k; yzaCiz(); if (_yza.sec) setTimeout(function () { let r = document.querySelector('#yza tr.acik'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); }
function yzaKapsam(k) { _yza.kapsam = k; yzaCiz(); }
function yzaSirala(s) { if (_yza.sirala === s) _yza.ters = !_yza.ters; else { _yza.sirala = s; _yza.ters = false; } yzaCiz(); }
function yzaCiz() {
    let kap = document.getElementById('yza'); if (!kap) return;
    let tur = yzaTurBilgi();
    if (!tur || !tur.sporcular.length) { kap.innerHTML = '<div class="yza"><div class="yza-bas"><div><b>📊 Sporcu Analizi</b></div><button class="yz-btn" onclick="yzaKapat()">✕</button></div><div class="yz-alt" style="padding:30px;text-align:center">Henüz yarışma turu yok. Bir tur bitince analiz burada görünür.</div></div>'; return; }
    let satirlar = tur.sporcular.map(function (s) { let g = yzaGecmis(tur, s.k); return { s: s, g: g, durum: yzaDurum(g, tur, s), ort: s.ok ? s.toplam / s.ok : null }; });
    let anahtar = { bugun: function (x) { return x.s.toplam; }, ort: function (x) { return x.ort || 0; }, on: function (x) { return x.s.on; }, M: function (x) { return -x.s.M; }, ad: function (x) { return x.s.ad; }, durum: function (x) { return { iyi: 4, yeni: 3, '': 2, uy: 1, kotu: 0 }[x.durum.cls] || 2; } }[_yza.sirala] || function (x) { return x.s.toplam; };
    satirlar.sort(function (a, b) { let va = anahtar(a), vb = anahtar(b), c = typeof va === 'string' ? va.localeCompare(vb, 'tr') : vb - va; return _yza.ters ? -c : c; });
    let th = function (id, ad, cls) { return '<th class="' + (cls || '') + (_yza.sirala === id ? ' sec' : '') + '"><button onclick="yzaSirala(\'' + id + '\')">' + ad + (_yza.sirala === id ? (_yza.ters ? ' ▲' : ' ▼') : '') + '</button></th>'; };
    let govde = satirlar.map(function (x) {
        let s = x.s, acik = _yza.sec === s.k, mak = yzMakaraliMi(s.k);
        let tr = '<tr class="' + (acik ? 'acik' : '') + '" tabindex="0" onclick="yzaSec(\'' + yzEnc(s.k) + '\')" onkeydown="if(event.key===\'Enter\')yzaSec(\'' + yzEnc(s.k) + '\')">'
            + '<td class="ad"><b>' + yzaEsc(s.ad) + '</b><small>' + yzaEsc((typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[s.k.slice(0, s.k.indexOf('|'))]) || '') + (mak ? ' · ⚙️ makaralı' : '') + '</small></td>'
            + '<td class="s"><b class="yza-buyuk">' + s.toplam + '</b><small>' + s.sira + '. / ' + tur.sporcular.length + '</small></td>'
            + '<td class="s sayi">' + yzaSayi(x.ort) + '</td>'
            + '<td>' + yzaSparkSVG(x.g) + '</td>'
            + '<td class="s sayi">' + s.on + '<small>X ' + s.x + '</small></td>'
            + '<td class="s sayi">' + (s.M || 0) + '</td>'
            + '<td><span class="yza-durum ' + x.durum.cls + '">' + x.durum.ad + '</span>' + (x.durum.not ? '<small>' + yzaEsc(x.durum.not) + '</small>' : '') + '</td>'
            + '<td class="ok" aria-hidden="true">' + (acik ? '▴' : '▾') + '</td></tr>';
        if (acik) tr += '<tr class="yza-detay"><td colspan="8">' + yzaDetayHTML(tur, x) + '</td></tr>';
        return tr;
    }).join('');
    let sy = kap.querySelector('.yza-tablo-kap'), sx = sy ? sy.scrollLeft : 0, ust = kap.scrollTop;
    kap.innerHTML = '<div class="yza" role="dialog" aria-modal="true" aria-label="Sporcu analizi">'
        + '<div class="yza-bas"><div><b>📊 Sporcu Analizi</b><div class="yz-alt">' + yzaEsc(tur.mesafe) + ' · ' + yzaTR(tur.tarih) + (tur.canli ? ' · tur sürüyor' : ' · son tur') + ' · satıra dokun → ayrıntı' + (tur.canli ? ' · skor girildikçe kendiliğinden güncellenir' : '') + '</div></div><button class="yz-btn" onclick="yzaKapat()" aria-label="Kapat">' + (tur.canli ? '← Tura dön' : '✕') + '</button></div>'
        + '<div class="yza-tablo-kap"><table class="yza-tablo"><thead><tr>' + th('ad', 'Sporcu') + th('bugun', 'Bugün', 's') + th('ort', 'Ok ort.', 's') + '<th>Son turlar</th>' + th('on', '10+X', 's') + th('M', 'Iska', 's') + th('durum', 'Durum') + '<th></th></tr></thead><tbody>' + govde + '</tbody></table></div>'
        + '<div class="yz-alt">Durum: son 5 turun ok ortalamasından 0,3+ yukarı <b class="yza-r iyi">Yükselişte</b>, 0,3+ aşağı <b class="yza-r kotu">Dikkat</b>, oklar dağınıksa <b class="yza-r uy">Teknik bak</b>. Isı haritası için skorları 🎯 Hedefe dokun ile gir.</div>'
        + '</div>';
    let ny = kap.querySelector('.yza-tablo-kap'); if (ny) ny.scrollLeft = sx; kap.scrollTop = ust;
    if (_yza.sec) yzaIsiCiz(tur, _yza.sec);
}
function yzaSparkSVG(g) {
    let l = g.slice(-8); if (l.length < 2) return '<span class="yz-alt">ilk tur</span>';
    let w = 110, h = 30, mn = Math.min.apply(null, l.map(function (x) { return x.v; })), mx = Math.max.apply(null, l.map(function (x) { return x.v; })), sp = mx - mn || 1;
    let pts = l.map(function (x, i) { return [(i * (w - 6) / (l.length - 1) + 3).toFixed(1), (h - 4 - (x.v - mn) / sp * (h - 8)).toFixed(1)]; });
    let art = l[l.length - 1].v >= l[0].v, c = art ? '#4ade80' : '#f87171', son = pts[pts.length - 1];
    return '<svg class="yza-spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Son ' + l.length + ' tur ok ortalaması"><path d="M' + pts.map(function (p) { return p.join(' '); }).join('L') + '" fill="none" stroke="' + c + '" stroke-width="2" stroke-linejoin="round"/><circle cx="' + son[0] + '" cy="' + son[1] + '" r="3.2" fill="' + c + '"/></svg>';
}

// ---------------------------------------------------------------- ayrıntı
function yzaDetayHTML(tur, x) {
    let s = x.s, nk = yzaNoktalar(tur, s.k, _yza.kapsam), gr = nk.length >= 3 ? yzGrup(nk.map(function (p) { return { x: p[0], y: p[1] }; })) : null, on = gr ? yzGrupOneri(gr, tur.yuz) : null;
    let bolge = yzaBolge(nk), kap = function (id, ad) { return '<button class="' + (_yza.kapsam === id ? 'aktif' : '') + '" onclick="event.stopPropagation();yzaKapsam(\'' + id + '\')">' + ad + '</button>'; };
    let isi = '<div class="yza-k"><div class="yza-k-bas"><span class="yz-etiket">🔥 Isı haritası</span><span class="yza-sec">' + kap('bu', 'Bu tur') + kap('son5', 'Son 5 tur') + kap('tum', 'Tümü') + '<button class="' + (_yza.antrenman ? 'aktif' : '') + '" onclick="event.stopPropagation();yzaAntrenmanDegis()" title="Skor Gir ve Oyunlar\'da hedefe dokunarak girilen son 90 ok">＋ Antrenman</button></span></div>'
        + (nk.length ? '<canvas id="yza-isi" width="360" height="360" role="img" aria-label="Okların hedefteki yoğunluğu"></canvas><div class="yz-alt" style="text-align:center">' + nk.length + ' ok · ' + yzaEsc(tur.yuz.ad) + '</div>'
            + '<div class="yza-bolge">' + bolge.map(function (b) { return '<div style="--o:' + b.o + '"><b>%' + b.p + '</b><small>' + b.ad + '</small></div>'; }).join('') + '</div>'
            + (on ? '<div class="yza-oneri ' + (on.merkezde ? 'iyi' : '') + '"><b>' + yzaEsc(on.kisa) + '</b><span>' + yzaEsc(on.oneri) + '</span>' + (on.uyari ? '<small>' + yzaEsc(on.uyari) + '</small>' : '') + '</div>' : '')
            : '<div class="yza-bos">Bu sporcunun hedefe dokunarak girilmiş oku yok.<br><small>Skor girerken 🎯 Hedefe dokun\'u seç; oklar burada ısı haritası olur.</small></div>') + '</div>';
    let gel = '<div class="yza-k genis"><div class="yza-k-bas"><span class="yz-etiket">📈 Gelişim · ' + yzaEsc(tur.mesafe) + ' turları</span></div>' + yzaGelisimSVG(x.g) + yzaGelisimOzet(x.g) + '</div>';
    let seri = s.seriT && s.seriT.some(function (v) { return v != null; }) ? '<div class="yza-k"><span class="yz-etiket">Bu tur · seri seri</span>' + yzaSeriSVG(s.seriT, x.g) + '</div>' : '';
    let tes = '<div class="yza-k"><span class="yz-etiket">🔎 Tespitler</span><ul class="yza-tespit">' + yzaTespitler(tur, x, nk, gr, bolge).map(function (t) { return '<li><span>' + t[0] + '</span><div>' + t[1] + '</div></li>'; }).join('') + '</ul></div>';
    return '<div class="yza-detay-ic" onclick="event.stopPropagation()">' + isi + gel + seri + tes + '</div>';
}
function yzaBolge(nk) {
    let ad = ['Sol üst', 'Üst', 'Sağ üst', 'Sol', 'Orta', 'Sağ', 'Sol alt', 'Alt', 'Sağ alt'], c = [0, 0, 0, 0, 0, 0, 0, 0, 0], e = 0.3;
    nk.forEach(function (p) { let i = (p[1] < -e ? 0 : p[1] > e ? 2 : 1) * 3 + (p[0] < -e ? 0 : p[0] > e ? 2 : 1); c[i]++; });
    let n = nk.length || 1, mx = Math.max.apply(null, c) || 1;
    return c.map(function (v, i) { return { ad: ad[i], p: Math.round(v / n * 100), o: Math.round(v / mx * 60) }; });
}
function yzaIsiCiz(tur, k) {
    let cv = document.getElementById('yza-isi'); if (!cv) return;
    let nk = yzaNoktalar(tur, k, _yza.kapsam), W = cv.width, c = W / 2, R = W / 2 - 6, x = cv.getContext('2d'), n = tur.yuz.halka || 6;
    x.clearRect(0, 0, W, W);
    let renk = function (deger) { return deger >= 9 ? '#5c4a0e' : deger >= 7 ? '#4f1c1d' : deger >= 5 ? '#14294d' : deger >= 3 ? '#1b1d22' : '#3b3a37'; };
    for (let i = n; i >= 1; i--) { x.beginPath(); x.arc(c, c, R * i / n, 0, Math.PI * 2); x.fillStyle = renk(11 - i); x.fill(); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1; x.stroke(); }
    let off = document.createElement('canvas'); off.width = W; off.height = W; let o = off.getContext('2d'), rad = Math.max(16, W * (nk.length > 40 ? 0.07 : 0.09));
    nk.forEach(function (p) { let px = c + p[0] * R, py = c + p[1] * R, g = o.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g; o.fillRect(px - rad, py - rad, rad * 2, rad * 2); });
    let im = o.getImageData(0, 0, W, W), d = im.data, mx = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > mx) mx = d[i];
    let dur = [[0, [0, 0, 0, 0]], [0.12, [59, 130, 246, 110]], [0.32, [34, 197, 94, 165]], [0.55, [250, 204, 21, 200]], [0.8, [249, 115, 22, 225]], [1, [220, 38, 38, 240]]];
    if (mx) for (let j = 0; j < d.length; j += 4) {
        let v = d[j + 3] / mx, a = dur[0], b = dur[dur.length - 1], f = 0;
        for (let s2 = 1; s2 < dur.length; s2++) if (v <= dur[s2][0]) { a = dur[s2 - 1]; b = dur[s2]; f = (v - a[0]) / (b[0] - a[0]); break; }
        for (let q = 0; q < 4; q++) d[j + q] = a[1][q] + (b[1][q] - a[1][q]) * f;
    }
    o.putImageData(im, 0, 0);
    x.save(); x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.clip(); x.drawImage(off, 0, 0); x.restore();
    if (nk.length <= 36) nk.forEach(function (p) { x.beginPath(); x.arc(c + p[0] * R, c + p[1] * R, 3, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#111'; x.lineWidth = 1; x.stroke(); });
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(c - 9, c); x.lineTo(c + 9, c); x.moveTo(c, c - 9); x.lineTo(c, c + 9); x.stroke();
    let gr = nk.length >= 3 ? yzGrup(nk.map(function (p) { return { x: p[0], y: p[1] }; })) : null;
    if (gr) { x.setLineDash([6, 5]); x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.beginPath(); x.arc(c + gr.mx * R, c + gr.my * R, Math.max(10, gr.yay * R * 1.4), 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
        x.strokeStyle = '#22c55e'; x.lineWidth = 3; x.beginPath(); x.moveTo(c + gr.mx * R - 8, c + gr.my * R); x.lineTo(c + gr.mx * R + 8, c + gr.my * R); x.moveTo(c + gr.mx * R, c + gr.my * R - 8); x.lineTo(c + gr.mx * R, c + gr.my * R + 8); x.stroke(); }
}
// 📈 Gelişim: x = turlar (tarih), y = ok ortalaması; sınıf aralığı bandı + sınıf ortalaması, sporcunun çizgisi, 3 turluk eğilim,
// kişisel rekor yıldızı, son değer etiketi. Nokta başlığında (dokun/üzerine gel) tur ayrıntısı.
function yzaGelisimSVG(g) {
    if (!g.length) return '<div class="yza-bos">Geçmiş tur yok.</div>';
    g = g.slice(-15); // en çok son 15 tur — grafik kalabalıklaşmasın
    let W = 640, H = 250, sol = 40, sag = 64, ust = 18, alt = 34, gw = W - sol - sag, gh = H - ust - alt;
    let tum = []; g.forEach(function (p) { tum.push(p.v); if (p.sinifMin != null) { tum.push(p.sinifMin, p.sinifMax); } });
    let mn = Math.max(0, Math.floor((Math.min.apply(null, tum) - 0.4) * 2) / 2), mx = Math.min(10, Math.ceil((Math.max.apply(null, tum) + 0.3) * 2) / 2); if (mx - mn < 1) mx = Math.min(10, mn + 1);
    let X = function (i) { return sol + (g.length === 1 ? gw / 2 : i * gw / (g.length - 1)); }, Y = function (v) { return ust + gh - (v - mn) / (mx - mn) * gh; };
    let s = '<svg class="yza-gelisim" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Turlara göre ok ortalaması">';
    let adim = mx - mn > 3 ? 1 : 0.5;
    for (let t = Math.ceil(mn / adim) * adim; t <= mx + 1e-9; t += adim) s += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (sol - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end" font-size="11" fill="currentColor" opacity=".6">' + yzaSayi(t, adim < 1 ? 1 : 0) + '</text>';
    let bant = g.filter(function (p) { return p.sinifMin != null; });
    if (bant.length >= 2) {
        let ix = function (p) { return X(g.indexOf(p)); };
        s += '<path d="M' + bant.map(function (p) { return ix(p) + ' ' + Y(p.sinifMax); }).join('L') + 'L' + bant.slice().reverse().map(function (p) { return ix(p) + ' ' + Y(p.sinifMin); }).join('L') + 'Z" fill="currentColor" fill-opacity=".08"/>';
        s += '<path d="M' + bant.map(function (p) { return ix(p) + ' ' + Y(p.sinifOrt); }).join('L') + '" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="5 4"/>';
    }
    if (g.length >= 3) { let ma = g.map(function (p, i) { let a = g.slice(Math.max(0, i - 2), i + 1); return a.reduce(function (t, q) { return t + q.v; }, 0) / a.length; }); s += '<path d="M' + ma.map(function (v, i) { return X(i) + ' ' + Y(v); }).join('L') + '" fill="none" stroke="#ffb347" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'; }
    s += '<path d="M' + g.map(function (p, i) { return X(i) + ' ' + Y(p.v); }).join('L') + '" fill="none" stroke="#fd8e01" stroke-width="2.5" stroke-linejoin="round"/>';
    let rekor = Math.max.apply(null, g.map(function (p) { return p.v; })), ri = g.map(function (p) { return p.v; }).lastIndexOf(rekor);
    let etiketAdim = Math.ceil(g.length / 8);
    g.forEach(function (p, i) {
        let son = i === g.length - 1, ok = '#fd8e01';
        s += '<g><title>' + yzaTR(p.tarih) + ' · ok ort. ' + yzaSayi(p.v) + ' · ' + p.toplam + ' puan · ' + p.sira + '. / ' + p.kisi + (p.sinifOrt != null ? ' · sınıf ' + yzaSayi(p.sinifOrt) : '') + '</title>'
            + '<circle cx="' + X(i) + '" cy="' + Y(p.v) + '" r="' + (son ? 6.5 : 4.5) + '" fill="' + (son ? ok : 'var(--yza-zemin,#1d120b)') + '" stroke="' + ok + '" stroke-width="2.2"/>'
            + '<circle cx="' + X(i) + '" cy="' + Y(p.v) + '" r="14" fill="transparent"/></g>';
        if ((i % etiketAdim === 0 && (son || g.length - 1 - i >= etiketAdim)) || son) s += '<text x="' + X(i) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="currentColor" opacity="' + (son ? 1 : 0.6) + '" font-weight="' + (son ? 800 : 500) + '">' + yzaTR(p.tarih) + '</text>';
    });
    if (g.length > 1) s += '<text x="' + X(ri) + '" y="' + (Y(rekor) - 12) + '" text-anchor="middle" font-size="14">⭐</text>';
    let son = g[g.length - 1]; s += '<text x="' + (X(g.length - 1) + 10) + '" y="' + (Y(son.v) + 5) + '" font-size="15" font-weight="900" fill="#fd8e01">' + yzaSayi(son.v) + '</text>';
    s += '</svg><div class="yza-lejant"><span><i style="background:#fd8e01"></i>sporcu</span><span><i style="background:#ffb347;opacity:.6;height:5px"></i>3 turluk eğilim</span><span><i class="kesik"></i>sınıf ortalaması</span><span><i style="background:currentColor;opacity:.15;height:10px"></i>sınıf aralığı</span><span>⭐ kişisel rekor</span></div>';
    return s;
}
function yzaGelisimOzet(g) {
    if (g.length < 2) return '<div class="yz-alt">Gelişim çizgisi için en az 2 tur gerekli.</div>';
    let tumSay = g.length; g = g.slice(-15);
    let son = g[g.length - 1], ilk = g[0], son5 = g.slice(-5), f5 = son5[son5.length - 1].v - son5[0].v, rek = g.reduce(function (a, p) { return p.v > a.v ? p : a; }, g[0]);
    let ust = son.sinifOrt != null ? son.v - son.sinifOrt : null;
    let cip = function (b, t, cls) { return '<span class="yza-cip ' + (cls || '') + '"><b>' + b + '</b>' + t + '</span>'; };
    return '<div class="yza-cipler">' + cip((f5 >= 0 ? '+' : '') + yzaSayi(f5), ' son ' + son5.length + ' turda', f5 >= 0 ? 'iyi' : 'kotu') + cip((son.v - ilk.v >= 0 ? '+' : '') + yzaSayi(son.v - ilk.v), (tumSay > g.length ? ' son ' + g.length + ' turda' : ' ilk turdan beri (' + g.length + ' tur)'), son.v >= ilk.v ? 'iyi' : 'kotu')
        + cip(yzaSayi(rek.v), ' en iyi · ' + yzaTR(rek.tarih)) + (ust != null ? cip((ust >= 0 ? '+' : '') + yzaSayi(ust), ' sınıf ortalamasına göre', ust >= 0 ? 'iyi' : 'kotu') : '') + '</div>';
}
function yzaSeriSVG(seriT, g) {
    let v = seriT.map(function (x) { return x; }), dolu = v.filter(function (x) { return x != null; }); if (!dolu.length) return '';
    let n = v.length, W = 320, H = 130, bw = W / n, mx = Math.max.apply(null, dolu), mn = Math.min.apply(null, dolu), ort = dolu.reduce(function (a, b) { return a + b; }, 0) / dolu.length;
    let tepe = Math.max(mx, 1), Y = function (x) { return 110 - x / tepe * 92; };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Seri puanları">';
    v.forEach(function (x, i) { if (x == null) return; let c = mx !== mn && x === mx ? '#4ade80' : mx !== mn && x === mn ? '#f87171' : '#38bdf8'; s += '<rect x="' + (i * bw + 3) + '" y="' + Y(x) + '" width="' + Math.max(4, bw - 6) + '" height="' + (110 - Y(x)) + '" rx="3" fill="' + c + '"/>' + (n <= 12 ? '<text x="' + (i * bw + bw / 2) + '" y="' + (Y(x) - 4) + '" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">' + x + '</text>' : '') + '<text x="' + (i * bw + bw / 2) + '" y="126" text-anchor="middle" font-size="9.5" fill="currentColor" opacity=".55">' + (i + 1) + '</text>'; });
    s += '<line x1="0" x2="' + W + '" y1="' + Y(ort) + '" y2="' + Y(ort) + '" stroke="#fd8e01" stroke-dasharray="5 4" stroke-width="1.5"/></svg><div class="yz-alt">Kesikli çizgi: bu turun seri ortalaması ' + yzaSayi(ort, 1) + '</div>';
    return s;
}
function yzaTespitler(tur, x, nk, gr, bolge) {
    let t = [], s = x.s, g = x.g;
    if (g.length >= 2) { let rek = Math.max.apply(null, g.slice(0, -1).map(function (p) { return p.v; })); if (g[g.length - 1].v > rek) t.push(['🔥', '<b>Kişisel rekor.</b> Bu mesafedeki en iyi ok ortalaması (' + yzaSayi(g[g.length - 1].v) + ').']); }
    if (nk.length >= 6) {
        let enb = bolge.map(function (b, i) { return { b: b, i: i }; }).filter(function (z) { return z.i !== 4; }).sort(function (a, b) { return b.b.p - a.b.p; })[0];
        if (enb && enb.b.p >= 25) t.push(['➡️', '<b>Okların %' + enb.b.p + '\'i ' + enb.b.ad.toLocaleLowerCase('tr-TR') + ' bölgede.</b> Tekrarlıyorsa nişangâh ya da çapa kaynaklı.']);
        if (bolge[4].p >= 45) t.push(['🎯', '<b>Okların %' + bolge[4].p + '\'i ortada.</b> Grup merkezde.']);
        if (gr) t.push(['⭕', '<b>Grup çapı ~' + Math.round(gr.yay * 2 * tur.yuz.R) + ' cm</b> (' + (gr.yay < 0.22 ? 'sıkı' : gr.yay < 0.4 ? 'orta' : 'dağınık') + ').']);
    }
    if (tur.canli && s.r) { try { let y = yzYorgunluk(tur.o, s.r); if (y && y.durum !== 'az') t.push(['📉', '<b>' + yzaEsc(y.baslik) + '.</b> ' + yzaEsc(y.detay || y.ozet || '')]); } catch (e) {} }
    if (s.ok) { let xo = s.x / s.ok; if (xo >= 0.15) t.push(['✴️', '<b>' + s.x + ' X</b> — okların %' + Math.round(xo * 100) + '\'i tam merkez.']); }
    if (s.M) t.push(['⚠️', '<b>' + s.M + ' ıska.</b> ' + (s.M >= 3 ? 'Önce okun hedefte kalmasına odaklan.' : 'Seyrek; dikkat dağılması olabilir.')]);
    if (yzMakaraliMi(s.k)) t.push(['⚙️', 'Makaralı: yalnız iç 10 sayılır, puanlar buna göre.']);
    if (!t.length) t.push(['ℹ️', 'Daha fazla tespit için daha çok tur ve hedefe dokunarak giriş gerekli.']);
    return t;
}
function yzaCss() {
    if (document.getElementById('yza-css')) return;
    let st = document.createElement('style'); st.id = 'yza-css';
    st.textContent = [
        '.yza-arka{position:fixed;inset:0;z-index:33000;background:rgba(6,4,2,.72);display:flex;justify-content:center;align-items:flex-start;padding:max(12px,env(safe-area-inset-top,0px)) 12px 12px;overflow:auto}',
        '.yza{--yza-zemin:var(--bg-card,#1d120b);width:min(1240px,100%);background:var(--yza-zemin);color:var(--text-main,#fbeee3);border:1px solid var(--border-color,#3a2618);border-radius:20px;padding:16px;display:grid;gap:12px;box-shadow:0 30px 80px rgba(0,0,0,.5)}',
        '.yza-bas{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.yza-bas b{font-size:20px}',
        '.yza-tablo-kap{overflow-x:auto;border:1px solid var(--border-color,#3a2618);border-radius:14px}',
        '.yza-tablo{border-collapse:collapse;width:100%;min-width:760px;font-size:14px}',
        '.yza-tablo th{background:var(--bg-panel,#27180f);text-align:left;padding:0;font:700 11.5px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted,#b9a493)}',
        '.yza-tablo th button{all:unset;cursor:pointer;display:block;padding:11px 10px}.yza-tablo th.s button{text-align:right}.yza-tablo th.sec{color:var(--accent,#fd8e01)}.yza-tablo th:not(:has(button)){padding:11px 10px}',
        '.yza-tablo td{padding:9px 10px;border-top:1px solid var(--border-color,#3a2618);vertical-align:middle}.yza-tablo td.s{text-align:right}.yza-tablo td small{display:block;font-size:11.5px;color:var(--text-muted,#b9a493);font-weight:600}',
        '.yza-tablo tbody tr:not(.yza-detay){cursor:pointer}.yza-tablo tbody tr:not(.yza-detay):hover{background:rgba(253,142,1,.06)}.yza-tablo tr.acik{background:rgba(253,142,1,.12)}.yza-tablo tr:focus-visible{outline:2px solid var(--accent,#fd8e01);outline-offset:-2px}',
        '.yza-tablo td.ad b{display:block}.yza-buyuk{font-size:18px}.yza-tablo .sayi{font-variant-numeric:tabular-nums}.yza-tablo td.ok{color:var(--text-muted,#b9a493);width:20px}',
        '.yza-durum{font:800 11.5px system-ui,sans-serif;padding:4px 9px;border-radius:999px;white-space:nowrap;background:rgba(255,255,255,.06)}.yza-durum.iyi,.yza-r.iyi{color:#4ade80}.yza-durum.iyi{background:rgba(74,222,128,.15)}.yza-durum.kotu,.yza-r.kotu{color:#f87171}.yza-durum.kotu{background:rgba(248,113,113,.15)}.yza-durum.uy,.yza-r.uy{color:#facc15}.yza-durum.uy{background:rgba(250,204,21,.15)}.yza-durum.yeni{color:#38bdf8;background:rgba(56,189,248,.12)}',
        '.yza-detay>td{background:var(--bg-panel,#27180f);padding:14px;cursor:default}',
        '.yza-detay-ic{display:grid;grid-template-columns:minmax(260px,330px) minmax(0,1fr);gap:12px}',
        '.yza-k{display:grid;gap:8px;align-content:start;min-width:0;background:var(--yza-zemin);border-radius:14px;padding:12px}.yza-k-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}',
        '.yza-sec{display:flex;gap:4px}.yza-sec button{font:800 12px system-ui,sans-serif;padding:6px 9px;border-radius:9px;border:1px solid var(--border-color,#3a2618);background:transparent;color:var(--text-muted,#b9a493);cursor:pointer}.yza-sec button.aktif{color:var(--text-main,#fff);border-color:var(--accent,#fd8e01);background:rgba(253,142,1,.15)}',
        '#yza-isi{width:100%;max-width:330px;height:auto;justify-self:center;border-radius:50%}',
        '.yza-bolge{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.yza-bolge div{border-radius:8px;padding:6px 4px;text-align:center;background:color-mix(in srgb,#fd8e01 calc(var(--o) * 1%),transparent);display:grid}.yza-bolge b{font-size:15px;font-variant-numeric:tabular-nums}.yza-bolge small{font-size:10.5px;color:var(--text-muted,#b9a493);font-weight:700}',
        '.yza-oneri{display:grid;gap:2px;padding:9px 11px;border-radius:10px;background:rgba(253,142,1,.12);border:1px solid rgba(253,142,1,.4);font-size:13px}.yza-oneri.iyi{background:rgba(74,222,128,.1);border-color:rgba(74,222,128,.4)}.yza-oneri small{color:var(--text-muted,#b9a493)}',
        '.yza-bos{padding:22px 10px;text-align:center;color:var(--text-muted,#b9a493);font-weight:700;font-size:13px}',
        '.yza-gelisim{width:100%;height:auto;color:var(--text-main,#fbeee3)}',
        '.yza-lejant{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:var(--text-muted,#b9a493);font-weight:700}.yza-lejant i{display:inline-block;width:18px;height:3px;border-radius:2px;margin-right:5px;vertical-align:middle}.yza-lejant i.kesik{background:repeating-linear-gradient(90deg,currentColor 0 5px,transparent 5px 9px)}',
        '.yza-cipler{display:flex;flex-wrap:wrap;gap:6px}.yza-cip{font-size:12.5px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.05);color:var(--text-muted,#b9a493);font-weight:600}.yza-cip b{color:var(--text-main,#fff);margin-right:4px;font-variant-numeric:tabular-nums}.yza-cip.iyi b{color:#4ade80}.yza-cip.kotu b{color:#f87171}',
        '.yza-tespit{margin:0;padding:0;list-style:none;display:grid;gap:8px}.yza-tespit li{display:grid;grid-template-columns:24px 1fr;gap:8px;font-size:13.5px;line-height:1.4}',
        '.yza-k svg{max-width:100%;height:auto;color:var(--text-main,#fbeee3)}',
        '@media (max-width:820px){.yza-detay-ic{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(st);
}
window.yzaAc = yzaAc;
