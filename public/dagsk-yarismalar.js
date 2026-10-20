/* ================================================================================================
   🏆 YARIŞMALAR (2026-10-20). Kullanıcı: "hafta sonu yarışma var, sporcu sayfasında eksik kaldık" → sporcunun kendi ekranında
   yarışma kartı, yarışma analizi, kişisel hedef + plan, yarışma sonrası sonuç; iki taslaktan "A · Ana ekranda yarışma kartı".
   · Koç: Karışık Sınıf › Yarışma › 🏆 Yarışmalar (yrsYonetAc) — yarışma ekle/düzenle, sporcu seç, sporcu başına hedef + not,
     yarışma planı (gün gün), sonuçları gör / gir.
   · Sporcu: ana ekranın en üstünde kart (yrsAnaKart) — geri sayım, bilgi, hazırlık listesi, hedef + plan (Yaptım), koç notu,
     analiz (Yarışma turu arşivinden: beklenen puan, grup yönü, sorunlu ok, yorulma), sonuç girişi + geçmiş yarışmalar.
   Depo (meta, kyDepo* — anahtar başına kayıt, t ile son yazan kazanır; koç ve sporcu AYRI anahtara yazar ki çakışmasın):
     yarismalar      { id: {id, ad, tarih, saat, yer, mesafe, yuz, kategori, ok, katilimci:[k], hazirlik:[metin], plan:[{g, i}], t, sil} }
     yarisma_hedef   { id|k: {hedef, not, t} }                       (koç)
     yarisma_sporcu  { id|k: {hazir:[bool], plan:[bool], sonuc:{puan, sira, kisi, madalya, kat}, t} }  (sporcu ya da koç)
   Gerçek skora/klasmana dokunmaz. yrs* önekli.
   ================================================================================================ */
const YRS_HAZIRLIK = ['Yay + ip (yedek ip)', 'Oklar (numaralı) + yedek ok', 'Parmaklık / kol koruyucu', 'Nişangah ayarı not edildi', 'Lisans kartı + kimlik', 'Su + atıştırmalık', 'Kulüp forması'];
const YRS_YUZ = { '6': '6 halka (tek yüz)', '3lu': "3'lü dikey", '10': '10 halka' };
let _yrs = { senkron: 0, arsiv: null, sayacZ: null, duzenle: null, ara: '' };
function yrsEsc(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function yrsE(k) { return encodeURIComponent(k).replace(/'/g, '%27'); }
function yrsD(k) { try { return decodeURIComponent(k); } catch (e) { return k; } }
function yrsBugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
function yrsTarihTR(iso, gun) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return ''; let d = new Date(+m[1], +m[2] - 1, +m[3]); return +m[3] + ' ' + ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][+m[2] - 1] + (gun ? ' ' + ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][d.getDay()] : ''); }
function yrsOku(a) { return typeof kyDepoOku === 'function' ? kyDepoOku(a) : {}; }
function yrsYaz(a, kayitlar) { let d = yrsOku(a); Object.keys(kayitlar).forEach(function (k) { d[k] = Object.assign({}, kayitlar[k], { t: Date.now() }); }); if (typeof kyDepoYazYerel === 'function') kyDepoYazYerel(a, d); if (typeof kyDepoSenkron === 'function') kyDepoSenkron(a, function () { return yrsOku(a); }, true).catch(function () {}); }
function yrsSenkron(sonra) {
    if (typeof kyDepoSenkron !== 'function' || Date.now() - _yrs.senkron < 45000) return;
    _yrs.senkron = Date.now();
    Promise.all(['yarismalar', 'yarisma_hedef', 'yarisma_sporcu'].map(function (a) { let once = JSON.stringify(yrsOku(a)); return kyDepoSenkron(a, function () { return yrsOku(a); }, false).then(function (t) { return JSON.stringify(t) !== once; }).catch(function () { return false; }); }))
        .then(function (r) { if (r.some(Boolean) && sonra) sonra(); });
    fetch('/api/meta/yz_arsiv').then(function (r) { return r.json(); }).then(function (d) { let l = []; try { l = d && d.value ? JSON.parse(d.value) : []; } catch (e) {} if (l.length) { _yrs.arsiv = l; try { if (!localStorage.getItem('dag_yz_arsiv') || typeof yzArsivBirlestir !== 'function') localStorage.setItem('dag_yz_arsiv', JSON.stringify(l)); } catch (e) {} if (sonra) sonra(); } }).catch(function () {});
}
function yrsArsiv() { if (_yrs.arsiv) return _yrs.arsiv; try { return JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]') || []; } catch (e) { return []; } }
function yrsListe() { let d = yrsOku('yarismalar'); return Object.keys(d).map(function (k) { return d[k]; }).filter(function (y) { return y && !y.sil && y.id; }).sort(function (a, b) { return String(a.tarih).localeCompare(String(b.tarih)); }); }
function yrsHedefTarih(y) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(y.tarih || ''); if (!m) return null; let s = /(\d{1,2})[:.](\d{2})/.exec(y.saat || '') || [0, 9, 0]; return new Date(+m[1], +m[2] - 1, +m[3], +s[1], +s[2]); }
function yrsMesafeNorm(m) { return String(m || '').replace(/\s+/g, '').toLowerCase(); }

// ---------------------------------------------------------------- 📊 analiz (Yarışma turu arşivinden)
function yrsMedyan(a) { a = a.slice().sort(function (x, y) { return x - y; }); let m = a.length >> 1; return a.length ? (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2) : 0; }
function yrsYon(dx, dy) { let a = Math.atan2(dy, dx), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return ['sağda', 'sağ altta', 'aşağıda', 'sol altta', 'solda', 'sol üstte', 'yukarıda', 'sağ üstte'][i]; }
function yrsYonAl(dx, dy) { let a = Math.atan2(dy, dx), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return ['sağa', 'sağ alta', 'aşağı', 'sol alta', 'sola', 'sol üste', 'yukarı', 'sağ üste'][i]; }
function yrsAnaliz(y, k) {
    let ms = yrsMesafeNorm(y.mesafe), turlar = yrsArsiv().filter(function (r) { return yrsMesafeNorm(r.mesafe) === ms; }).sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    let benim = turlar.map(function (r) { let s = (r.sporcular || []).find(function (x) { return x.k === k; }); return s && s.ok ? { r: r, s: s, ort: s.toplam / s.ok } : null; }).filter(Boolean);
    let R = { tur: benim.length };
    if (benim.length) {
        let son5 = benim.slice(-5), ok = +y.ok || 60;
        R.beklenen = Math.round(son5.reduce(function (a, b) { return a + b.ort; }, 0) / son5.length * ok);
        R.enIyi = Math.round(Math.max.apply(null, benim.map(function (b) { return b.ort; })) * ok);
        // son seriler (hedef çubuğu için): her turun seri toplamları, ok/seri
        let seri = []; benim.slice(-4).forEach(function (b) { (b.s.seriT || []).forEach(function (v) { if (v != null) seri.push({ v: v, okBasi: b.s.ok / Math.max(1, (b.s.seriT || []).filter(function (x) { return x != null; }).length) }); }); });
        R.seriler = seri.slice(-12);
        // yorulma: turların ikinci yarısı ilkinden düşük mü
        let fark = []; benim.slice(-4).forEach(function (b) { let st = (b.s.seriT || []).filter(function (v) { return v != null; }); if (st.length >= 6) { let h = st.length >> 1, a1 = st.slice(0, h), a2 = st.slice(h); fark.push(a2.reduce(function (a, b) { return a + b; }, 0) / a2.length - a1.reduce(function (a, b) { return a + b; }, 0) / a1.length); } });
        if (fark.length >= 2) R.yorulma = fark.reduce(function (a, b) { return a + b; }, 0) / fark.length;
        // konumlar: grup yönü + ok numarası
        let kon = [], okd = []; benim.slice(-5).forEach(function (b) { (b.s.kon || []).forEach(function (p) { kon.push({ x: p[0], y: p[1] }); }); (b.s.okd || []).forEach(function (q) { if (q[3] != null) okd.push({ n: q[0], x: q[3], y: q[4] }); }); });
        let yuz = (typeof YZ_YUZ !== 'undefined' && YZ_YUZ[y.yuz]) || { R: y.yuz === '3lu' ? 12 : 40, halka: y.yuz === '10' ? 10 : 6 };
        if (kon.length >= 8) { let mx = yrsMedyan(kon.map(function (p) { return p.x; })), my = yrsMedyan(kon.map(function (p) { return p.y; })); R.grup = { x: mx, y: my, cm: Math.hypot(mx, my) * (yuz.R || 12), yay: yrsMedyan(kon.map(function (p) { return Math.hypot(p.x - mx, p.y - my); })) }; R.kon = kon; }
        if (okd.length >= 12 && R.grup) { let no = {}; okd.forEach(function (q) { (no[q.n] = no[q.n] || []).push(q); }); R.sorunlu = Object.keys(no).map(function (n) { let l = no[n]; if (l.length < 4) return null; let cx = l.reduce(function (a, p) { return a + p.x; }, 0) / l.length, cy = l.reduce(function (a, p) { return a + p.y; }, 0) / l.length, cm = Math.hypot(cx - R.grup.x, cy - R.grup.y) * (yuz.R || 12); return cm >= Math.max(3, R.grup.yay * (yuz.R || 12) * 0.75) ? { n: +n, cm: Math.round(cm), yon: yrsYon(cx - R.grup.x, cy - R.grup.y), x: cx, y: cy } : null; }).filter(Boolean); }
        R.halka = yuz.halka || 6;
    }
    return R;
}

// ---------------------------------------------------------------- 👤 sporcunun ana ekran kartı
function yrsSporcununki(k) {
    let bugun = yrsBugun(), l = yrsListe().filter(function (y) { return (y.katilimci || []).indexOf(k) !== -1; });
    let yaklasan = l.filter(function (y) { return y.tarih >= bugun; })[0];
    let sp = yrsOku('yarisma_sporcu');
    let sonucBekleyen = l.filter(function (y) { return y.tarih < bugun && y.tarih >= yrsGunEkle(bugun, -10) && !((sp[y.id + '|' + k] || {}).sonuc); }).pop();
    return { y: yaklasan || sonucBekleyen || null, gecmis: l.filter(function (y) { return y.tarih < bugun || (sp[y.id + '|' + k] || {}).sonuc; }).map(function (y) { return { y: y, s: (sp[y.id + '|' + k] || {}).sonuc }; }).filter(function (x) { return x.s; }).reverse() };
}
function yrsGunEkle(iso, n) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso), d = new Date(+m[1], +m[2] - 1, +m[3] + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// Ana ekranda yalnız kısa şerit → 🏆 Yarışma sekmesi (2026-10-20, kullanıcı: "yarışma modu olarak sekme aç, ön hazırlık ve maç zamanı
// diye iki seçenek olsun, sporcu kendi kimliği ile girdiğinde olsun").
function yrsAnaKart(grup, ad) {
    let el = document.getElementById('yarisma-kart-ana'); if (!el) return;
    yrsCss();
    let k = grup + '|' + ad, bil = yrsSporcununki(k);
    yrsSenkron(function () { if (document.getElementById('yarisma-kart-ana')) yrsAnaKart(grup, ad); });
    if (!bil.y) { el.innerHTML = ''; return; }
    let y = bil.y, bugun = yrsBugun(), sd = yrsOku('yarisma_sporcu')[y.id + '|' + k] || {};
    let ht = yrsHedefTarih(y), kal = ht ? ht.getTime() - Date.now() : 0, g = Math.floor(kal / 864e5), sa = Math.floor(kal / 36e5) % 24;
    let durum = y.tarih < bugun ? (sd.sonuc ? '🏅 Sonucun kaydedildi' : '🏁 Sonucunu gir') : y.tarih === bugun ? '⚔️ Bugün yarışma günü · Maç zamanı' : '⏳ ' + (g > 0 ? g + ' gün ' : '') + sa + ' saat kaldı';
    el.innerHTML = '<button type="button" class="yrs-serit" onclick="sekmeAc(\'yarisma\')"><span class="yrs-serit-ikon" aria-hidden="true">🏆</span><span><b>' + yrsEsc(y.ad) + '</b><small>' + yrsTarihTR(y.tarih, true) + ' · ' + durum + '</small></span><span class="yrs-serit-ok">Yarışma modu ›</span></button>';
}
// 🏆 Yarışma sekmesi: üstte yarışma başlığı + geri sayım, altında iki mod: 🎒 Ön hazırlık · ⚔️ Maç zamanı.
function yrsSekme(grup, ad) {
    let el = document.getElementById('icerik-yarisma'); if (!el) return;
    yrsCss();
    if (!grup || !ad) { el.innerHTML = '<div class="yrs-bos">Yarışma modu için sporcu olarak giriş yap.</div>'; return; }
    let k = grup + '|' + ad, bil = yrsSporcununki(k);
    _yrs.kim = { grup: grup, ad: ad };
    yrsSenkron(function () { if (document.getElementById('icerik-yarisma') && document.getElementById('icerik-yarisma').classList.contains('aktif')) yrsSekme(grup, ad); });
    if (!bil.y) { el.innerHTML = '<div class="yrs"><div class="yrs-bos"><div style="font-size:44px">🏆</div><b>Yaklaşan yarışman yok</b><div class="yrs-alt">Koçun seni bir yarışmaya eklediğinde burada ön hazırlık ve maç zamanı açılır.</div></div>' + (bil.gecmis.length ? yrsGecmisHTML(bil.gecmis) : '') + '</div>'; return; }
    let y = bil.y, anahtar = y.id + '|' + k, hd = yrsOku('yarisma_hedef')[anahtar] || {}, sd = yrsOku('yarisma_sporcu')[anahtar] || {}, bugun = yrsBugun();
    let gecti = y.tarih < bugun, gunu = y.tarih === bugun;
    if (!_yrs.mod || _yrs.modY !== y.id) { _yrs.mod = (gunu || gecti || (sd.mac && (sd.mac.seriler || []).length)) ? 'mac' : 'hazirlik'; _yrs.modY = y.id; }
    let hero = '<div class="yrs-hero"><span class="yrs-rozet" aria-hidden="true">🏆</span><div class="yrs-etk" style="color:#ffd8a8">' + (gecti ? 'Yarışma bitti' : gunu ? 'Bugün yarışma günü!' : 'Yaklaşan yarışma') + '</div><h2>' + yrsEsc(y.ad) + '</h2>'
        + '<div class="yrs-yer">📅 ' + yrsTarihTR(y.tarih, true) + (y.saat ? ' · ⏰ ' + yrsEsc(y.saat) : '') + (y.yer ? '<br>📍 ' + yrsEsc(y.yer) : '') + '</div>'
        + (gecti || _yrs.mod === 'mac' ? '' : '<div class="yrs-sayac" id="yrs-sayac" data-hedef="' + (yrsHedefTarih(y) || new Date()).getTime() + '"></div>')
        + '<div class="yrs-bilgi">' + [y.mesafe ? '🎯 ' + y.mesafe : '', y.yuz ? '🧾 ' + (YRS_YUZ[y.yuz] || y.yuz) : '', y.kategori ? '🏷 ' + y.kategori : '', y.ok ? '🏹 ' + y.ok + ' ok' : ''].filter(Boolean).map(function (x) { return '<span>' + yrsEsc(x) + '</span>'; }).join('') + '</div></div>';
    let sec = '<div class="yrs-mod" role="tablist" aria-label="Yarışma modu"><button type="button" role="tab" aria-selected="' + (_yrs.mod === 'hazirlik') + '" class="' + (_yrs.mod === 'hazirlik' ? 'akt' : '') + '" onclick="yrsModSec(\'hazirlik\')"><b>🎒 Ön hazırlık</b><small>liste · hedef · plan · analiz</small></button><button type="button" role="tab" aria-selected="' + (_yrs.mod === 'mac') + '" class="' + (_yrs.mod === 'mac' ? 'akt' : '') + '" onclick="yrsModSec(\'mac\')"><b>⚔️ Maç zamanı</b><small>seri seri skor · tempo · nişangah</small></button></div>';
    let ic = _yrs.mod === 'mac' ? yrsMacHTML(y, anahtar, hd, sd) : yrsHazirlikHTML(y, k, anahtar, hd, sd);
    el.innerHTML = '<div class="yrs">' + hero + sec + ic + (bil.gecmis.length ? yrsGecmisHTML(bil.gecmis) : '') + '</div>';
    yrsSayacBaslat();
}
function yrsModSec(m) { _yrs.mod = m; if (_yrs.kim) yrsSekme(_yrs.kim.grup, _yrs.kim.ad); }
function yrsHazirlikHTML(y, k, anahtar, hd, sd) {
    let gecti = y.tarih < yrsBugun(), hz = y.hazirlik && y.hazirlik.length ? y.hazirlik : YRS_HAZIRLIK, hazir = sd.hazir || [], bugun = yrsBugun();
    let tamam = hz.filter(function (h, i) { return hazir[i]; }).length;
    let hazirlik = '<div class="yrs-kart"><div class="yrs-bas"><span class="yrs-etk">🎒 Hazırlık listesi</span><b class="yrs-say">' + tamam + '/' + hz.length + '</b></div><div class="yrs-ilerleme"><i style="width:' + Math.round(tamam / Math.max(1, hz.length) * 100) + '%"></i></div><div class="yrs-liste">'
        + hz.map(function (h, i) { return '<label class="' + (hazir[i] ? 'tamam' : '') + '"><input type="checkbox"' + (hazir[i] ? ' checked' : '') + ' onchange="yrsIsaretle(\'' + yrsE(anahtar) + '\',\'hazir\',' + i + ',this.checked)"><i class="yrs-tik" aria-hidden="true"></i>' + yrsEsc(h) + '</label>'; }).join('') + '</div></div>';
    let an = yrsAnaliz(y, k), ok = +y.ok || 60, seriOk = +y.seriOk || 3, seriHedef = hd.hedef ? Math.round(hd.hedef / ok * seriOk) : null;
    let planHTML = (y.plan || []).filter(function (p) { return p && (p.g || p.i); }).map(function (p, i) { let ok2 = (sd.plan || [])[i]; return '<div class="' + (p.g === yrsGunAdi(bugun) ? 'bugun' : '') + '"><b>' + yrsEsc(p.g || '') + '</b><span>' + yrsEsc(p.i || '') + '</span><button type="button" class="' + (ok2 ? 'ok' : '') + '" onclick="yrsIsaretle(\'' + yrsE(anahtar) + '\',\'plan\',' + i + ',' + (!ok2) + ')">' + (ok2 ? '✓ yaptım' : 'Yaptım') + '</button></div>'; }).join('');
    let cubuk = seriHedef && an.seriler && an.seriler.length ? '<div class="yrs-cubuk" aria-label="Son seriler hedefe göre">' + an.seriler.map(function (s) { return '<i class="' + (s.v >= seriHedef * (s.okBasi || seriOk) / seriOk ? 'd' : '') + '" title="' + s.v + '"></i>'; }).join('') + '</div><div class="yrs-alt">Son provalarındaki seriler: turuncu = hedef tempoda</div>' : '';
    let hedef = '<div class="yrs-kart"><span class="yrs-etk">🎯 Hedefin' + (hd.hedef ? ' (koçun belirledi)' : '') + '</span>'
        + (hd.hedef ? '<div class="yrs-hedef"><b>' + hd.hedef + '</b><span>/ ' + (ok * 10) + ' puan' + (seriHedef ? ' · ' + seriOk + ' okluk seri başı ~' + seriHedef : '') + '</span></div>' + cubuk : '<div class="yrs-alt" style="margin:6px 0">Koçun henüz hedef koymadı. Kendi hedefin: son provalarının biraz üstü.</div>')
        + (planHTML ? '<div class="yrs-plan">' + planHTML + '</div>' : '')
        + (hd.not ? '<div class="yrs-not">💬 <b>Koçun notu:</b> ' + yrsEsc(hd.not) + '</div>' : '') + '</div>';
    return (gecti ? '' : hazirlik + hedef + yrsAnalizHTML(an, hd.hedef, y)) + ((gecti || y.tarih === bugun) ? yrsSonucHTML(y, anahtar, sd.sonuc) : '');
}
// ⚔️ MAÇ ZAMANI: sporcu yarışma sırasında kendi serilerini girer (koçun kâğıdına dokunmaz, kendi takibi). Toplam, ok ortalaması,
// hedef temposuna göre +/−, tahmini bitiş; kısa rutin hatırlatması + koç notu; nişangah defteri (hangi seriden sonra kaç tık nereye).
// "🏁 Yarışmayı bitir" → toplam puan sonuç formuna geçer.
function yrsMacVeri(sd) { let m = Object.assign({ seriler: [], nis: [], bitti: false }, sd.mac || {}); m.seriler = (m.seriler || []).slice(); m.nis = (m.nis || []).slice(); return m; }
function yrsDeger(p) { return p === 'X' ? 10 : p === 'M' ? 0 : +p || 0; }
function yrsMacHTML(y, anahtar, hd, sd) {
    let m = yrsMacVeri(sd), ok = +y.ok || 60, seriOk = +y.seriOk || 3, top = 0, atilan = 0;
    m.seriler.forEach(function (s) { s.forEach(function (p) { top += yrsDeger(p); atilan++; }); });
    let su = _yrs.suanki || [], ort = atilan ? top / atilan : 0, kalanOk = Math.max(0, ok - atilan);
    let tahmin = atilan ? Math.round(top + ort * kalanOk) : null, tempo = hd.hedef && atilan ? Math.round(top - hd.hedef * atilan / ok) : null;
    let halka = y.yuz === '10' ? 10 : 6, tuslar = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].filter(function (p) { return p === 'X' || p === 'M' || +p >= 11 - halka; });
    let renk = function (p) { let v = yrsDeger(p); return p === 'M' ? 'm' : v >= 9 ? 's' : v >= 7 ? 'k' : v >= 5 ? 'b' : v >= 3 ? 'y' : 'w'; };
    let durum = '<div class="yrs-kart yrs-mac-durum"><div class="yrs-mac-sayilar"><div><b>' + top + '</b><small>TOPLAM</small></div><div><b>' + atilan + '<span>/' + ok + '</span></b><small>OK</small></div><div><b>' + (atilan ? ort.toFixed(2).replace('.', ',') : '–') + '</b><small>OK ORT.</small></div></div>'
        + (tempo != null ? '<div class="yrs-tempo ' + (tempo >= 0 ? 'iyi' : 'kotu') + '">' + (tempo >= 0 ? '▲ Hedef temposunun ' + tempo + ' puan önündesin' : '▼ Hedef temposunun ' + Math.abs(tempo) + ' puan gerisindesin') + '<small>Bu gidişle bitiş: <b>' + tahmin + '</b> · hedef ' + hd.hedef + '</small></div>' : (tahmin != null ? '<div class="yrs-tempo">Bu gidişle bitiş: <b>' + tahmin + '</b></div>' : '<div class="yrs-alt">İlk seriyi gir; toplam, ortalama ve hedef temposu burada görünür.</div>')) + '</div>';
    let slot = ''; for (let i = 0; i < seriOk; i++) slot += '<span class="yrs-slot ' + (su[i] ? renk(su[i]) : 'bos') + '">' + (su[i] || '') + '</span>';
    let giris = m.bitti ? '' : '<div class="yrs-kart"><div class="yrs-bas"><span class="yrs-etk">✍️ ' + (m.seriler.length + 1) + '. seri</span><span class="yrs-alt">' + seriOk + ' ok · dolunca kaydolur</span></div><div class="yrs-slotlar">' + slot + '</div>'
        + '<div class="yrs-puanlar">' + tuslar.map(function (p) { return '<button type="button" class="' + renk(p) + '" onclick="yrsMacOk(\'' + yrsE(anahtar) + '\',\'' + p + '\')">' + p + '</button>'; }).join('') + '</div>'
        + '<div class="yrs-mac-alt"><button type="button" class="yz-btn" onclick="yrsMacGeri(\'' + yrsE(anahtar) + '\')"' + (su.length || m.seriler.length ? '' : ' disabled') + '>⌫ Geri al</button></div></div>';
    let seriler = m.seriler.length ? '<div class="yrs-kart"><span class="yrs-etk">📋 Seriler</span><div class="yrs-seri-izgara">' + m.seriler.map(function (s, i) { let t = s.reduce(function (a, p) { return a + yrsDeger(p); }, 0), hh = hd.hedef ? hd.hedef / ok * s.length : null; return '<div class="' + (hh != null ? (t >= hh ? 'iyi' : 'kotu') : '') + '"><small>' + (i + 1) + '</small><b>' + t + '</b><span>' + s.join(' ') + '</span></div>'; }).join('') + '</div></div>' : '';
    let rutin = m.bitti ? '' : '<div class="yrs-kart yrs-rutin"><span class="yrs-etk">🧘 Seriler arası</span><div class="yrs-rutin-adim"><span>1 · Derin nefes</span><span>2 · Duruş + çapa</span><span>3 · Bırak ve takip et</span></div>' + (hd.not ? '<div class="yrs-not">💬 ' + yrsEsc(hd.not) + '</div>' : '') + '</div>';
    let nis = '<div class="yrs-kart"><span class="yrs-etk">🔧 Nişangah defteri</span><div class="yrs-alt" style="margin:4px 0 8px">Nişangahı oynattıysan dokun: hangi seriden sonra kaç tık nereye.</div><div class="yrs-nis-tus">' + [['⬅', 'sol'], ['➡', 'sağ'], ['⬆', 'yukarı'], ['⬇', 'aşağı']].map(function (x) { return '<button type="button" onclick="yrsMacNis(\'' + yrsE(anahtar) + '\',\'' + x[1] + '\')">' + x[0] + ' 1 tık ' + x[1] + '</button>'; }).join('') + '</div>'
        + (m.nis.length ? '<div class="yrs-nis-liste">' + m.nis.slice().reverse().slice(0, 8).map(function (n) { return '<span>' + n.seri + '. seriden sonra · ' + n.tik + ' tık ' + n.yon + '</span>'; }).join('') + '</div>' : '') + '</div>';
    let bitir = m.bitti ? yrsSonucHTML(y, anahtar, sd.sonuc || { puan: top }) : (atilan ? '<button type="button" class="yrs-ana-btn yrs-bitir" onclick="yrsMacBitir(\'' + yrsE(anahtar) + '\')">🏁 Yarışmayı bitir · ' + top + ' puan sonuca geçsin</button>' : '');
    return durum + giris + seriler + rutin + nis + bitir;
}
function yrsMacKaydet(anahtar, m) { let d = yrsOku('yarisma_sporcu')[anahtar] || {}, o = {}; o[anahtar] = Object.assign({}, d, { mac: m }); yrsYaz('yarisma_sporcu', o); }
function yrsMacYenile() { if (_yrs.kim) yrsSekme(_yrs.kim.grup, _yrs.kim.ad); }
function yrsMacOk(anahtar, p) {
    anahtar = yrsD(anahtar); let y = yrsOku('yarismalar')[anahtar.split('|')[0]] || {}, seriOk = +y.seriOk || 3, okTop = +y.ok || 60;
    let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}), atilan = m.seriler.reduce(function (a, s) { return a + s.length; }, 0);
    if (atilan + (_yrs.suanki || []).length >= okTop) { if (typeof showToast === 'function') showToast('Tüm oklar girildi — yarışmayı bitir.', 'info'); return; }
    _yrs.suanki = (_yrs.suanki || []).concat([p]);
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
    if (_yrs.suanki.length >= seriOk) {
        let s = _yrs.suanki.slice().sort(function (a, b) { return yrsDeger(b) - yrsDeger(a) || (b === 'X') - (a === 'X'); }); m.seriler.push(s); _yrs.suanki = [];
        yrsMacKaydet(anahtar, m);
        let t = s.reduce(function (a, q) { return a + yrsDeger(q); }, 0); if (typeof showToast === 'function') showToast(m.seriler.length + '. seri: ' + t + ' ✓', 'success');
    }
    yrsMacYenile();
}
function yrsMacGeri(anahtar) {
    anahtar = yrsD(anahtar);
    if ((_yrs.suanki || []).length) { _yrs.suanki.pop(); return yrsMacYenile(); }
    let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}); if (!m.seriler.length) return;
    let son = m.seriler.pop(); _yrs.suanki = son.slice(0, -1); yrsMacKaydet(anahtar, m); yrsMacYenile();
}
function yrsMacNis(anahtar, yon) {
    anahtar = yrsD(anahtar); let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}), seri = m.seriler.length, son = m.nis[m.nis.length - 1];
    if (son && son.seri === seri && son.yon === yon) son.tik++; else m.nis.push({ seri: seri, yon: yon, tik: 1 });
    yrsMacKaydet(anahtar, m); yrsMacYenile();
}
function yrsMacBitir(anahtar) {
    let a = yrsD(anahtar), d = yrsOku('yarisma_sporcu')[a] || {}, m = yrsMacVeri(d), top = m.seriler.reduce(function (t, s) { return t + s.reduce(function (x, p) { return x + yrsDeger(p); }, 0); }, 0);
    let bit = function () { m.bitti = true; let o = {}; o[a] = Object.assign({}, d, { mac: m, sonuc: Object.assign({}, d.sonuc || {}, { puan: top }) }); yrsYaz('yarisma_sporcu', o); _yrs.suanki = []; yrsMacYenile(); if (typeof showToast === 'function') showToast('🏁 ' + top + ' puan · sıralamanı ve madalyanı ekle.', 'success'); };
    if (typeof onayIste === 'function') onayIste('Yarışmayı bitirelim mi? <b>' + top + ' puan</b> sonucuna yazılır; sonra sırayı ve madalyanı eklersin.', bit, 'Bitir', 'Devam'); else bit();
}
function yrsGunAdi(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso), d = new Date(+m[1], +m[2] - 1, +m[3]); return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()]; }
function yrsAnalizHTML(an, hedef, y) {
    if (!an.tur) return '<div class="yrs-kart"><span class="yrs-etk">📊 Yarışma analizin</span><div class="yrs-alt" style="margin-top:6px">' + yrsEsc(y.mesafe || '') + ' Yarışma provası yok. Antrenmanda koçunla bir Sıralama Turu (prova) atınca beklenen puanın ve grup analizin burada çıkar.</div></div>';
    let t = [];
    if (an.grup) t.push(an.grup.cm >= 2 ? ['➡️', 'Grubun <b>~' + Math.round(an.grup.cm) + ' cm ' + yrsYon(an.grup.x, an.grup.y) + '</b> — nişangahı biraz ' + yrsYonAl(an.grup.x, an.grup.y) + ' al.'] : ['🎯', 'Grubun <b>merkezde</b> — nişangaha dokunma.']);
    (an.sorunlu || []).forEach(function (s) { t.push(['⚠️', '<b>' + s.n + ' numaralı ok</b> grubun ~' + s.cm + ' cm ' + s.yon.replace(/da$|de$|ta$|te$/, '') + 'ına gidiyor; tüy/uç/gövde kontrol.']); });
    if (an.yorulma != null && an.yorulma <= -1) t.push(['📉', 'Turun ikinci yarısında seri başına <b>' + Math.abs(an.yorulma).toFixed(1).replace('.', ',') + ' puan</b> düşüyorsun — su iç, seriler arası rutinini koru.']);
    if (an.yorulma != null && an.yorulma >= 1) t.push(['📈', 'Turun ikinci yarısında açılıyorsun — ilk serilere de ısınmış başla.']);
    if (!t.length) t.push(['ℹ️', 'Hedefe dokunarak / yönle girilen provalar biriktikçe burada grup ve ok analizi çıkar.']);
    let svg = '';
    if (an.kon && an.kon.length) { svg = '<svg viewBox="-1.1 -1.1 2.2 2.2" role="img" aria-label="Son provalarının grup haritası">'; for (let i = an.halka; i >= 1; i--) { let v = 11 - i; svg += '<circle r="' + (i / an.halka) + '" fill="' + (v >= 9 ? '#5c4a0e' : v >= 7 ? '#4f1c1d' : v >= 5 ? '#14294d' : v >= 3 ? '#1b1d22' : '#3b3a37') + '" stroke="rgba(255,255,255,.25)" stroke-width=".01"/>'; }
        an.kon.slice(-40).forEach(function (p) { svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r=".035" fill="#fff" opacity=".75"/>'; });
        (an.sorunlu || []).forEach(function (s) { svg += '<circle cx="' + s.x + '" cy="' + s.y + '" r=".09" fill="none" stroke="#ff6b6b" stroke-width=".035"/><text x="' + s.x + '" y="' + (s.y + 0.04) + '" text-anchor="middle" font-size=".12" font-weight="900" fill="#fff">' + s.n + '</text>'; });
        if (an.grup) svg += '<path d="M' + (an.grup.x - 0.07) + ' ' + an.grup.y + 'H' + (an.grup.x + 0.07) + 'M' + an.grup.x + ' ' + (an.grup.y - 0.07) + 'V' + (an.grup.y + 0.07) + '" stroke="#22c55e" stroke-width=".035"/>';
        svg += '</svg>'; }
    return '<div class="yrs-kart"><span class="yrs-etk">📊 Yarışma analizin <small>(' + an.tur + ' prova)</small></span><div class="yrs-beklenti"><div><b>' + an.beklenen + '</b><small>BEKLENEN</small></div><div><b style="color:var(--yrs-tur)">' + (hedef || '–') + '</b><small>HEDEF</small></div><div><b style="color:var(--yrs-yesil)">' + an.enIyi + '</b><small>EN İYİ PROVA</small></div></div>'
        + '<div class="yrs-analiz' + (svg ? '' : ' tek') + '">' + svg + '<div class="yrs-tespit">' + t.map(function (x) { return '<div><span>' + x[0] + '</span><span>' + x[1] + '</span></div>'; }).join('') + '</div></div></div>';
}
function yrsSonucHTML(y, anahtar, s) {
    s = s || {};
    let md = ['🥇', '🥈', '🥉', '🎖'];
    return '<div class="yrs-kart yrs-sonuc"><span class="yrs-etk">🏁 ' + (s.puan ? 'Sonucun' : 'Yarışma bitince · sonucunu gir') + '</span><div class="yrs-form">'
        + '<label>Toplam puan<input id="yrs-puan" inputmode="numeric" value="' + (s.puan || '') + '" placeholder="ör. 536"></label><label>Sıralama<input id="yrs-sira" inputmode="numeric" value="' + (s.sira || '') + '" placeholder="ör. 4"></label>'
        + '<label>Katılımcı<input id="yrs-kisi" inputmode="numeric" value="' + (s.kisi || '') + '" placeholder="ör. 23"></label><label>Kategori<input id="yrs-kat" value="' + yrsEsc(s.kat || y.kategori || '') + '"></label>'
        + '<div class="yrs-madalya">' + md.map(function (m) { return '<button type="button" class="' + (s.madalya === m ? 'sec' : '') + '" onclick="yrsMadalya(this,\'' + m + '\')" aria-label="' + m + '">' + m + '</button>'; }).join('') + '</div></div>'
        + '<button type="button" class="yrs-ana-btn" onclick="yrsSonucKaydet(\'' + yrsE(anahtar) + '\')">' + (s.puan ? '✓ Sonucu güncelle' : 'Sonucu kaydet → koçun görür') + '</button></div>';
}
function yrsGecmisHTML(l) {
    return '<div class="yrs-kart"><span class="yrs-etk">🏅 Geçmiş yarışmaların</span><div class="yrs-gecmis">' + l.slice(0, 6).map(function (x) { return '<div><em>' + (x.s.madalya || '🎖') + '</em><span>' + yrsEsc(x.y.ad) + '<small>' + yrsTarihTR(x.y.tarih) + ' · ' + yrsEsc(x.y.mesafe || '') + (x.s.sira ? ' · ' + x.s.sira + '.' + (x.s.kisi ? '/' + x.s.kisi : '') : '') + '</small></span><b>' + (x.s.puan || '') + '</b></div>'; }).join('') + '</div></div>';
}
let _yrsMadalya = null;
function yrsMadalya(b, m) { _yrsMadalya = m; b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('sec', x === b); }); }
function yrsIsaretle(anahtar, alan, i, deger) { anahtar = yrsD(anahtar);
    let d = yrsOku('yarisma_sporcu')[anahtar] || {}, l = (d[alan] || []).slice(); l[i] = !!deger;
    let yeni = {}; yeni[anahtar] = Object.assign({}, d, (function () { let o = {}; o[alan] = l; return o; })()); yrsYaz('yarisma_sporcu', yeni);
    yrsYenile();
}
function yrsSonucKaydet(anahtar) { anahtar = yrsD(anahtar);
    let v = function (id) { let e = document.getElementById(id); return e ? e.value.trim() : ''; };
    let puan = parseInt(v('yrs-puan'), 10); if (!puan) { if (typeof showToast === 'function') showToast('Toplam puanı yaz.', 'warning'); return; }
    let d = yrsOku('yarisma_sporcu')[anahtar] || {}, onceki = (d.sonuc || {}).madalya;
    let s = { puan: puan, sira: parseInt(v('yrs-sira'), 10) || null, kisi: parseInt(v('yrs-kisi'), 10) || null, kat: v('yrs-kat'), madalya: _yrsMadalya || onceki || null };
    let y = {}; y[anahtar] = Object.assign({}, d, { sonuc: s }); yrsYaz('yarisma_sporcu', y); _yrsMadalya = null;
    if (typeof showToast === 'function') showToast((s.madalya && s.madalya !== '🎖' ? s.madalya + ' Tebrikler! ' : '🏁 ') + 'Sonucun kaydedildi, koçun görecek.', 'success');
    yrsYenile();
}
function yrsYenile() { let t = document.getElementById('icerik-yarisma'); if (t && t.classList.contains('aktif') && _yrs.kim) yrsSekme(_yrs.kim.grup, _yrs.kim.ad); else if (document.getElementById('yarisma-kart-ana') && typeof sporcuAnaDoldur === 'function') sporcuAnaDoldur(); if (document.getElementById('yrs-yonet')) yrsYonetCiz(); }
function yrsSayacBaslat() {
    clearInterval(_yrs.sayacZ);
    let tik = function () { let e = document.getElementById('yrs-sayac'); if (!e) { clearInterval(_yrs.sayacZ); return; } let kal = Math.max(0, +e.dataset.hedef - Date.now()), g = Math.floor(kal / 864e5), s = Math.floor(kal / 36e5) % 24, d = Math.floor(kal / 6e4) % 60, sn = Math.floor(kal / 1e3) % 60;
        e.innerHTML = [[g, 'GÜN'], [s, 'SAAT'], [d, 'DAK'], [sn, 'SN']].map(function (x) { return '<div><b>' + String(x[0]).padStart(2, '0') + '</b><small>' + x[1] + '</small></div>'; }).join(''); };
    tik(); _yrs.sayacZ = setInterval(tik, 1000);
}

// ---------------------------------------------------------------- 🧑‍🏫 koç: yarışma yönetimi
function yrsTumSporcular() { let r = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(function (g) { Object.keys((typeof turnuvaDB !== 'undefined' && turnuvaDB[g]) || {}).forEach(function (ad) { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && !sp.donduruldu) r.push({ k: g + '|' + ad, g: g, ad: ad }); }); }); return r.sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); }); }
function yrsYonetAc() {
    yrsCss();
    let kap = document.getElementById('yrs-yonet');
    if (!kap) { kap = document.createElement('div'); kap.id = 'yrs-yonet'; kap.className = 'yrs-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yrsYonetKapat(); }); (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap); }
    _yrs.senkron = 0; yrsSenkron(function () { if (document.getElementById('yrs-yonet')) yrsYonetCiz(); });
    yrsYonetCiz();
}
function yrsYonetKapat() { let k = document.getElementById('yrs-yonet'); if (k) k.remove(); _yrs.duzenle = null; }
function yrsYonetCiz() {
    let kap = document.getElementById('yrs-yonet'); if (!kap) return;
    let ust = kap.scrollTop;
    if (_yrs.duzenle) { kap.innerHTML = yrsFormHTML(); kap.scrollTop = ust; return; }
    let bugun = yrsBugun(), l = yrsListe(), gelen = l.filter(function (y) { return y.tarih >= bugun; }), eski = l.filter(function (y) { return y.tarih < bugun; }).reverse(), sp = yrsOku('yarisma_sporcu');
    let sat = function (y) { let n = (y.katilimci || []).length, sonuc = (y.katilimci || []).filter(function (k) { return (sp[y.id + '|' + k] || {}).sonuc; }).length; return '<button class="yrs-yar" onclick="yrsDuzenle(\'' + yrsE(y.id) + '\')"><span class="yrs-yar-t"><b>' + yrsTarihTR(y.tarih).split(' ')[0] + '</b>' + yrsTarihTR(y.tarih).split(' ')[1].slice(0, 3) + '</span><span><b>' + yrsEsc(y.ad) + '</b><small>' + [y.mesafe, YRS_YUZ[y.yuz] || '', y.kategori, n + ' sporcu'].filter(Boolean).map(yrsEsc).join(' · ') + (y.tarih < bugun ? ' · ' + sonuc + '/' + n + ' sonuç' : '') + '</small></span><span class="yrs-ok">›</span></button>'; };
    kap.innerHTML = '<div class="yrs-pen" role="dialog" aria-modal="true" aria-label="Yarışmalar"><div class="yrs-pen-bas"><div><b>🏆 Yarışmalar</b><div class="yrs-alt">Eklenen yarışma, seçilen sporcuların kendi ana ekranında kart olarak görünür (geri sayım, hazırlık, hedef, analiz, sonuç).</div></div><button class="yz-btn" onclick="yrsYonetKapat()" aria-label="Kapat">✕</button></div>'
        + '<button class="yrs-ana-btn" onclick="yrsDuzenle(null)">＋ Yeni yarışma</button>'
        + '<div class="yrs-etk" style="margin-top:6px">Yaklaşan</div>' + (gelen.length ? gelen.map(sat).join('') : '<div class="yrs-alt">Yaklaşan yarışma yok.</div>')
        + (eski.length ? '<div class="yrs-etk" style="margin-top:10px">Geçmiş</div>' + eski.slice(0, 12).map(sat).join('') : '') + '</div>';
    kap.scrollTop = ust;
}
function yrsDuzenle(id) { id = id ? yrsD(id) : id;
    let y = id ? yrsOku('yarismalar')[id] : null;
    _yrs.duzenle = y ? JSON.parse(JSON.stringify(y)) : { id: 'y' + Date.now().toString(36), ad: '', tarih: yrsGunEkle(yrsBugun(), 5), saat: '09:30', yer: '', mesafe: '18m', yuz: '6', kategori: '', ok: 60, seriOk: 3, katilimci: [], hazirlik: YRS_HAZIRLIK.slice(), plan: [{ g: 'Pzt', i: 'Teknik çalışma' }, { g: 'Sal', i: 'Yarışma mesafesi · 2×30 ok' }, { g: 'Çar', i: 'Prova: Sıralama Turu' }, { g: 'Per', i: 'Hafif · 30 ok' }, { g: 'Cum', i: 'Dinlen · ekipman kontrolü' }], yeni: !y };
    _yrs.ara = ''; yrsYonetCiz();
}
function yrsAlan(a, v) { if (!_yrs.duzenle) return; _yrs.duzenle[a] = v; }
function yrsFormHTML() {
    let y = _yrs.duzenle, hed = yrsOku('yarisma_hedef'), sp = yrsOku('yarisma_sporcu'), tum = yrsTumSporcular(), ara = (_yrs.ara || '').toLocaleLowerCase('tr-TR');
    let inp = function (a, et, tip, ek) { return '<label>' + et + '<input type="' + (tip || 'text') + '" value="' + yrsEsc(y[a] == null ? '' : y[a]) + '" oninput="yrsAlan(\'' + a + '\', this.value)"' + (ek || '') + '></label>'; };
    let secili = (y.katilimci || []).map(function (k) { return tum.find(function (x) { return x.k === k; }) || { k: k, ad: k.slice(k.indexOf('|') + 1) }; });
    let adaylar = tum.filter(function (x) { return (y.katilimci || []).indexOf(x.k) === -1 && (!ara || x.ad.toLocaleLowerCase('tr-TR').indexOf(ara) !== -1); }).slice(0, ara ? 30 : 12);
    let sporcuSat = secili.map(function (x) { let h = hed[y.id + '|' + x.k] || {}, son = (sp[y.id + '|' + x.k] || {}).sonuc, on = yrsAnaliz(y, x.k);
        return '<div class="yrs-sp"><div class="yrs-sp-ad"><b>' + yrsEsc(x.ad) + '</b><small>' + (on.beklenen ? 'beklenen ~' + on.beklenen : 'prova yok') + (son ? ' · 🏁 ' + son.puan + (son.sira ? ' (' + son.sira + '.)' : '') + ' ' + (son.madalya || '') : '') + '</small></div>'
            + '<input class="yrs-sp-hedef" inputmode="numeric" placeholder="hedef" value="' + (h.hedef || '') + '" onchange="yrsHedefYaz(\'' + yrsE(x.k) + '\', \'hedef\', this.value)" aria-label="' + yrsEsc(x.ad) + ' hedef puan">'
            + (on.beklenen && !h.hedef ? '<button class="yz-btn" onclick="yrsHedefYaz(\'' + yrsE(x.k) + '\', \'hedef\', ' + Math.round(on.beklenen * 1.02) + ')" title="Beklenenin %2 üstü">≈' + Math.round(on.beklenen * 1.02) + '</button>' : '')
            + '<button class="yz-btn" onclick="yrsCikar(\'' + yrsE(x.k) + '\')" aria-label="Çıkar">✕</button>'
            + '<input class="yrs-sp-not" placeholder="Koç notu (sporcu görür)" value="' + yrsEsc(h.not || '') + '" onchange="yrsHedefYaz(\'' + yrsE(x.k) + '\', \'not\', this.value)"></div>'; }).join('');
    return '<div class="yrs-pen" role="dialog" aria-modal="true" aria-label="Yarışma düzenle"><div class="yrs-pen-bas"><div><b>' + (y.yeni ? '＋ Yeni yarışma' : '✏️ ' + yrsEsc(y.ad)) + '</b></div><button class="yz-btn" onclick="_yrs.duzenle=null;yrsYonetCiz()">← Liste</button></div>'
        + '<div class="yrs-form">' + inp('ad', 'Yarışma adı', 'text', ' placeholder="ör. İl Seçmesi · Salon"') + inp('tarih', 'Tarih', 'date') + inp('saat', 'Saat', 'text', ' placeholder="09:30 kayıt · 10:00 atış"') + inp('yer', 'Yer', 'text', ' placeholder="Salon / adres"')
        + '<label>Mesafe<select onchange="yrsAlan(\'mesafe\', this.value)">' + ['18m', '20m', '25m', '30m', '40m', '50m', '60m', '70m'].map(function (m) { return '<option' + (y.mesafe === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>'
        + '<label>Hedef yüzü<select onchange="yrsAlan(\'yuz\', this.value)">' + Object.keys(YRS_YUZ).map(function (k) { return '<option value="' + k + '"' + (y.yuz === k ? ' selected' : '') + '>' + YRS_YUZ[k] + '</option>'; }).join('') + '</select></label>'
        + inp('kategori', 'Kategori', 'text', ' placeholder="ör. U18 Klasik"') + inp('ok', 'Toplam ok', 'number', ' min="3" step="3"')
        + '<label>Seri başı ok<select onchange="yrsAlan(\'seriOk\', +this.value)">' + [3, 6].map(function (n) { return '<option value="' + n + '"' + ((+y.seriOk || 3) === n ? ' selected' : '') + '>' + n + ' ok</option>'; }).join('') + '</select></label></div>'
        + '<div class="yrs-etk">👥 Sporcular (' + secili.length + ') · hedef puan + not</div><div class="yrs-sp-liste">' + (sporcuSat || '<div class="yrs-alt">Henüz sporcu seçilmedi.</div>') + '</div>'
        + '<input class="yrs-ara" placeholder="🔎 Sporcu ara ve ekle" value="' + yrsEsc(_yrs.ara || '') + '" oninput="_yrs.ara=this.value; yrsAdayCiz()"><div class="yrs-adaylar" id="yrs-adaylar">' + yrsAdayHTML(adaylar) + '</div>'
        + '<div class="yrs-etk">🗓 Yarışma haftası planı (tüm sporcular görür)</div><div class="yrs-plan-duz">' + (y.plan || []).map(function (p, i) { return '<div><input value="' + yrsEsc(p.g || '') + '" placeholder="Gün" oninput="_yrs.duzenle.plan[' + i + '].g=this.value" aria-label="Gün"><input value="' + yrsEsc(p.i || '') + '" placeholder="Ne yapılacak" oninput="_yrs.duzenle.plan[' + i + '].i=this.value" aria-label="İş"><button class="yz-btn" onclick="_yrs.duzenle.plan.splice(' + i + ',1);yrsYonetCiz()" aria-label="Sil">✕</button></div>'; }).join('') + '<button class="yz-btn" onclick="_yrs.duzenle.plan.push({g:\'\',i:\'\'});yrsYonetCiz()">＋ Gün ekle</button></div>'
        + '<label class="yrs-uzun">🎒 Hazırlık listesi (her satır bir madde)<textarea rows="5" oninput="_yrs.duzenle.hazirlik=this.value.split(\'\\n\').map(function(x){return x.trim();}).filter(Boolean)">' + yrsEsc((y.hazirlik || []).join('\n')) + '</textarea></label>'
        + '<div class="yrs-alt-btn">' + (y.yeni ? '' : '<button class="yz-btn" onclick="yrsSil()">🗑 Sil</button>') + '<button class="yrs-ana-btn" onclick="yrsKaydet()">💾 Kaydet</button></div></div>';
}
function yrsAdayHTML(l) { return l.map(function (x) { return '<button class="yz-cip" onclick="yrsEkle(\'' + yrsE(x.k) + '\')">+ ' + yrsEsc(x.ad) + '</button>'; }).join(''); }
function yrsAdayCiz() { let y = _yrs.duzenle, ara = (_yrs.ara || '').toLocaleLowerCase('tr-TR'), el = document.getElementById('yrs-adaylar'); if (!y || !el) return; el.innerHTML = yrsAdayHTML(yrsTumSporcular().filter(function (x) { return (y.katilimci || []).indexOf(x.k) === -1 && (!ara || x.ad.toLocaleLowerCase('tr-TR').indexOf(ara) !== -1); }).slice(0, ara ? 30 : 12)); }
function yrsEkle(k) { k = yrsD(k); let y = _yrs.duzenle; if (!y) return; y.katilimci = (y.katilimci || []).concat([k]); yrsYonetCiz(); }
function yrsCikar(k) { k = yrsD(k); let y = _yrs.duzenle; if (!y) return; y.katilimci = (y.katilimci || []).filter(function (x) { return x !== k; }); yrsYonetCiz(); }
function yrsHedefYaz(k, alan, v) { k = yrsD(k); let y = _yrs.duzenle; if (!y) return; let a = y.id + '|' + k, d = yrsOku('yarisma_hedef')[a] || {}, o = {}; o[a] = Object.assign({}, d); o[a][alan] = alan === 'hedef' ? (parseInt(v, 10) || null) : String(v || '').trim(); yrsYaz('yarisma_hedef', o); yrsYonetCiz(); }
function yrsKaydet() {
    let y = _yrs.duzenle; if (!y) return;
    if (!String(y.ad || '').trim()) { if (typeof showToast === 'function') showToast('Yarışma adını yaz.', 'warning'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(y.tarih || '')) { if (typeof showToast === 'function') showToast('Tarihi seç.', 'warning'); return; }
    let kayit = Object.assign({}, y); delete kayit.yeni; kayit.ok = parseInt(kayit.ok, 10) || 60; kayit.plan = (kayit.plan || []).filter(function (p) { return p.g || p.i; });
    let o = {}; o[y.id] = kayit; yrsYaz('yarismalar', o);
    if (typeof showToast === 'function') showToast('🏆 ' + kayit.ad + ' kaydedildi · ' + (kayit.katilimci || []).length + ' sporcunun ekranında görünecek.', 'success');
    _yrs.duzenle = null; yrsYonetCiz();
}
function yrsSil() {
    let y = _yrs.duzenle; if (!y) return;
    let sil = function () { let o = {}; o[y.id] = Object.assign({}, yrsOku('yarismalar')[y.id] || y, { sil: true }); delete o[y.id].yeni; yrsYaz('yarismalar', o); _yrs.duzenle = null; yrsYonetCiz(); };
    if (typeof onayIste === 'function') onayIste(yrsEsc(y.ad) + ' silinsin mi? Sporcuların ekranından da kalkar.', sil, 'Sil', 'Vazgeç'); else sil();
}

// ---------------------------------------------------------------- stil
function yrsCss() {
    if (document.getElementById('yrs-css')) return;
    let st = document.createElement('style'); st.id = 'yrs-css';
    st.textContent = [
        '.yrs{--yrs-tur:#fd8e01;--yrs-yesil:#4ade80;display:grid;gap:12px;margin-bottom:14px}',
        '.yrs-etk{font:800 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}.yrs-etk small{letter-spacing:0;text-transform:none;font-weight:700}',
        '.yrs-alt{font-size:12.5px;color:var(--text-muted);line-height:1.4}',
        '.yrs-hero{position:relative;overflow:hidden;border-radius:22px;padding:16px;background:radial-gradient(120% 90% at 85% 0%,rgba(253,142,1,.35),transparent 55%),linear-gradient(160deg,#3a1f0c,#1d110a);border:1px solid rgba(253,142,1,.45);color:#fbeee3}',
        '.yrs-hero h2{margin:4px 0 2px;font-size:22px;font-weight:900;line-height:1.1;padding-right:40px}.yrs-yer{color:#d8c4b2;font-size:12.5px;line-height:1.5}',
        '.yrs-rozet{position:absolute;right:14px;top:12px;font-size:32px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))}',
        '.yrs-sayac{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0 8px}.yrs-sayac div{background:rgba(0,0,0,.35);border-radius:12px;padding:8px 4px;text-align:center}.yrs-sayac b{display:block;font-size:28px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}.yrs-sayac small{font-size:10px;color:#d8c4b2;font-weight:800;letter-spacing:.08em}',
        '.yrs-bilgi{display:flex;flex-wrap:wrap;gap:6px}.yrs-bilgi span{font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.08)}',
        '.yrs-kart{background:var(--bg-card);border:1px solid var(--border-color);border-radius:18px;padding:14px}',
        '.yrs-bas{display:flex;justify-content:space-between;align-items:center}.yrs-say{font-size:18px;font-weight:900}',
        '.yrs-ilerleme{height:8px;border-radius:4px;background:rgba(127,127,127,.18);overflow:hidden;margin-top:8px}.yrs-ilerleme i{display:block;height:100%;background:linear-gradient(90deg,#4ade80,#a3e635);transition:width .3s}',
        '.yrs-liste{display:grid;gap:6px;margin-top:8px}.yrs-liste label{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;background:var(--bg-main);cursor:pointer;font-size:14px;font-weight:700}.yrs-liste label{position:relative}.yrs-liste input{position:absolute;opacity:0;width:1px;height:1px}.yrs-liste input:focus-visible+.yrs-tik{outline:2px solid #fd8e01;outline-offset:2px}.yrs-tik{flex:0 0 auto;width:22px;height:22px;border-radius:7px;border:2px solid var(--border-color);display:grid;place-items:center;font-style:normal}.yrs-liste label.tamam .yrs-tik{background:#22c55e;border-color:#22c55e}.yrs-liste label.tamam .yrs-tik::after{content:"\\2713";color:#fff;font-weight:900;font-size:14px}.yrs-liste label.tamam{opacity:.6;text-decoration:line-through}',
        '.yrs-hedef{display:flex;align-items:baseline;gap:8px;margin-top:4px}.yrs-hedef b{font-size:44px;font-weight:900;line-height:1;color:var(--yrs-tur)}.yrs-hedef span{color:var(--text-muted);font-weight:800;font-size:13px}',
        '.yrs-cubuk{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:8px}.yrs-cubuk i{height:24px;border-radius:5px;background:rgba(127,127,127,.18)}.yrs-cubuk i.d{background:linear-gradient(180deg,#fd8e01,#c2410c)}',
        '.yrs-plan{display:grid;gap:6px;margin-top:10px}.yrs-plan div{display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--bg-main);font-size:13.5px}.yrs-plan b{color:var(--text-muted)}.yrs-plan div.bugun{outline:2px solid var(--yrs-tur)}.yrs-plan div.bugun b{color:var(--yrs-tur)}',
        '.yrs-plan button{font:800 12px system-ui,sans-serif;padding:6px 10px;border-radius:9px;border:2px solid var(--border-color);background:transparent;color:var(--text-main);cursor:pointer;min-height:34px}.yrs-plan button.ok{border-color:#22c55e;color:#22c55e}',
        '.yrs-not{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.35);font-size:13px;line-height:1.45}',
        '.yrs-beklenti{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.yrs-beklenti div{background:var(--bg-main);border-radius:12px;padding:8px;text-align:center}.yrs-beklenti b{display:block;font-size:26px;font-weight:900;line-height:1}.yrs-beklenti small{font-size:10.5px;color:var(--text-muted);font-weight:800}',
        '.yrs-analiz{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center;margin-top:10px}.yrs-analiz.tek{grid-template-columns:1fr}.yrs-analiz svg{width:120px;height:120px}',
        '.yrs-tespit{display:grid;gap:6px;font-size:13px;line-height:1.4}.yrs-tespit div{display:grid;grid-template-columns:20px 1fr;gap:6px}',
        '.yrs-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}.yrs-form label,.yrs-uzun{display:grid;gap:3px;font-size:11.5px;font-weight:800;color:var(--text-muted)}',
        '.yrs-form input,.yrs-form select,.yrs-uzun textarea,.yrs-ara,.yrs-sp input,.yrs-plan-duz input{font:inherit;font-size:15px;font-weight:700;padding:9px 10px;border-radius:10px;border:2px solid var(--border-color);background:var(--bg-main);color:var(--text-main);min-width:0;width:100%;box-sizing:border-box}',
        '.yrs-madalya{display:flex;gap:6px;grid-column:1/-1}.yrs-madalya button{flex:1;font-size:24px;padding:6px;border-radius:12px;border:2px solid var(--border-color);background:var(--bg-main);cursor:pointer;min-height:48px}.yrs-madalya button.sec{border-color:#facc15;background:rgba(250,204,21,.15)}',
        '.yrs-ana-btn{width:100%;margin-top:10px;font:900 16px system-ui,sans-serif;padding:14px;border-radius:14px;border:0;background:#fd8e01;color:#1a0d05;cursor:pointer}',
        '.yrs-gecmis{display:grid;gap:6px;margin-top:8px}.yrs-gecmis div{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--bg-main);font-size:13px}.yrs-gecmis em{font-style:normal;font-size:22px}.yrs-gecmis b{font-size:18px;font-weight:900}.yrs-gecmis small{display:block;color:var(--text-muted);font-size:11px}',
        // koç penceresi
        '.yrs-arka{position:fixed;inset:0;z-index:33000;background:rgba(6,4,2,.72);display:flex;justify-content:center;align-items:flex-start;padding:max(12px,env(safe-area-inset-top,0px)) 12px 12px;overflow:auto}',
        '.yrs-pen{width:min(760px,100%);background:var(--bg-card,#1d120b);color:var(--text-main);border:1px solid var(--border-color);border-radius:20px;padding:16px;display:grid;gap:10px;box-shadow:0 30px 80px rgba(0,0,0,.5)}',
        '.yrs-pen-bas{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.yrs-pen-bas b{font-size:20px}',
        '.yrs-yar{display:grid;grid-template-columns:52px 1fr auto;gap:10px;align-items:center;text-align:left;padding:10px 12px;border-radius:14px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;cursor:pointer}',
        '.yrs-yar-t{display:grid;justify-items:center;font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase}.yrs-yar-t b{font-size:22px;color:#fd8e01;line-height:1}.yrs-yar small{display:block;color:var(--text-muted);font-size:12px}.yrs-ok{font-size:22px;color:var(--text-muted)}',
        '.yrs-sp-liste{display:grid;gap:6px}.yrs-sp{display:grid;grid-template-columns:minmax(0,1fr) 84px auto auto;gap:6px;align-items:center;padding:8px;border-radius:12px;background:var(--bg-main)}.yrs-sp-ad small{display:block;font-size:11.5px;color:var(--text-muted)}.yrs-sp-not{grid-column:1/-1}',
        '.yrs-adaylar{display:flex;flex-wrap:wrap;gap:6px}',
        '.yrs-plan-duz{display:grid;gap:6px}.yrs-plan-duz div{display:grid;grid-template-columns:70px 1fr auto;gap:6px}',
        '.yrs-alt-btn{display:flex;gap:8px;align-items:center}.yrs-alt-btn .yrs-ana-btn{margin-top:0}',
        '.yrs-serit{width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;padding:12px 14px;margin-bottom:14px;border-radius:16px;border:1px solid rgba(253,142,1,.5);background:linear-gradient(135deg,rgba(253,142,1,.22),rgba(253,142,1,.06));color:var(--text-main);font:inherit;cursor:pointer}.yrs-serit-ikon{font-size:28px}.yrs-serit b{display:block;font-size:15px}.yrs-serit small{display:block;font-size:12px;color:var(--text-muted);font-weight:700}.yrs-serit-ok{font-weight:900;font-size:13px;color:#fd8e01;white-space:nowrap}',
        '.yrs-bos{text-align:center;padding:28px 16px;display:grid;gap:6px;justify-items:center}',
        '.yrs-mod{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:5px}.yrs-mod button{display:grid;gap:2px;padding:10px 8px;border-radius:12px;border:0;background:transparent;color:var(--text-muted);font:inherit;cursor:pointer}.yrs-mod button b{font-size:15px;color:var(--text-main)}.yrs-mod button small{font-size:11px;font-weight:700}.yrs-mod button.akt{background:#fd8e01}.yrs-mod button.akt b,.yrs-mod button.akt small{color:#1a0d05}',
        '.yrs-mac-sayilar{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.yrs-mac-sayilar div{background:var(--bg-main);border-radius:12px;padding:10px 6px;text-align:center}.yrs-mac-sayilar b{display:block;font-size:30px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}.yrs-mac-sayilar b span{font-size:15px;color:var(--text-muted)}.yrs-mac-sayilar small{font-size:10.5px;color:var(--text-muted);font-weight:800;letter-spacing:.08em}',
        '.yrs-tempo{margin-top:8px;padding:10px 12px;border-radius:12px;font-weight:900;font-size:15px;background:var(--bg-main);display:grid;gap:2px}.yrs-tempo small{font-size:12px;font-weight:700;color:var(--text-muted)}.yrs-tempo.iyi{background:rgba(74,222,128,.14);color:#4ade80}.yrs-tempo.kotu{background:rgba(248,113,113,.14);color:#f87171}',
        '.yrs-slotlar{display:flex;gap:8px;justify-content:center;margin:10px 0}.yrs-slot{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:22px;font-weight:900;border:2px solid transparent}.yrs-slot.bos{border:2px dashed var(--border-color)}',
        '.yrs-puanlar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.yrs-puanlar button{min-height:62px;border-radius:16px;border:0;font:inherit;font-size:26px;font-weight:900;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)}.yrs-puanlar button:active{transform:scale(.96)}',
        '.yrs-puanlar .s,.yrs-slot.s{background:#ffd43b;color:#3d2a00}.yrs-puanlar .k,.yrs-slot.k{background:#ff6b6b;color:#3a0808}.yrs-puanlar .b,.yrs-slot.b{background:#4dabf7;color:#06233d}.yrs-puanlar .y,.yrs-slot.y{background:#343a40;color:#fff}.yrs-puanlar .w,.yrs-slot.w{background:#f1f3f5;color:#222}.yrs-puanlar .m,.yrs-slot.m{background:#868e96;color:#fff}',
        '.yrs-mac-alt{display:flex;justify-content:flex-end;margin-top:8px}',
        '.yrs-seri-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px;margin-top:8px}.yrs-seri-izgara div{background:var(--bg-main);border-radius:10px;padding:6px;text-align:center;display:grid}.yrs-seri-izgara small{font-size:10px;color:var(--text-muted);font-weight:800}.yrs-seri-izgara b{font-size:20px;font-weight:900}.yrs-seri-izgara span{font-size:11px;color:var(--text-muted)}.yrs-seri-izgara .iyi b{color:#4ade80}.yrs-seri-izgara .kotu b{color:#f87171}',
        '.yrs-rutin-adim{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.yrs-rutin-adim span{font-size:13px;font-weight:800;padding:7px 10px;border-radius:10px;background:var(--bg-main)}',
        '.yrs-nis-tus{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.yrs-nis-tus button{min-height:44px;border-radius:12px;border:2px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-weight:800;cursor:pointer}.yrs-nis-liste{display:grid;gap:4px;margin-top:8px;font-size:12.5px;color:var(--text-muted);font-weight:700}',
        '.yrs-bitir{background:#22c55e}',
        '@media (max-width:560px){.yrs-form{grid-template-columns:1fr}.yrs-sp{grid-template-columns:minmax(0,1fr) 70px auto}}'
    ].join('\n');
    document.head.appendChild(st);
}
window.yrsAnaKart = yrsAnaKart; window.yrsYonetAc = yrsYonetAc; window.yrsSekme = yrsSekme;
