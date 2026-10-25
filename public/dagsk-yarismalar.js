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
function yrsYaz(a, kayitlar) { let d = yrsOku(a); Object.keys(kayitlar).forEach(function (k) { d[k] = Object.assign({}, kayitlar[k], { t: Date.now() }); }); if (typeof kyDepoYazYerel === 'function') kyDepoYazYerel(a, d); yrsGonder(a, true); }
// ☁️ Gönderim durumu (2026-10-25). Kullanıcı: "bugün ne anlık görebildim ne de çalıştı" — 25 Ekim yarışmasında sporcular
// telefondan girdi ama sunucuya hiçbir skor ulaşmadı; telefon "✓" diyordu (yalnız navigator.onLine'a bakıyordu). Artık
// skor giriş bandı gerçek durumu gösterir (gönderildi / telefonda bekliyor), bekleyen kayıt 15 sn'de bir yeniden denenir
// ve dosya yüklenince bir kez sunucuyla birleştirilir (sunucuda olmayan yerel skorlar geri gönderilir).
let _yrsGon = null; // null | 'gidiyor' | 'tamam' | 'bekliyor'
function yrsBekleyenVar() { return typeof kyBekleyenler === 'function' && kyBekleyenler().some(function (a) { return /^yarisma/.test(a); }); }
function yrsGonder(a, yaz) {
    if (typeof kyDepoSenkron !== 'function') return Promise.resolve();
    _yrsGon = 'gidiyor'; yrsGonderimGoster();
    return kyDepoSenkron(a, function () { return yrsOku(a); }, yaz).catch(function () {}).then(function () { _yrsGon = yrsBekleyenVar() ? 'bekliyor' : 'tamam'; yrsGonderimGoster(); });
}
function yrsGonderimHTML() {
    if (!_yrsGon) return '';
    let b = _yrsGon === 'bekliyor', g = _yrsGon === 'gidiyor';
    return '<div id="yrs-gonderim" class="yrs-gon ' + _yrsGon + '">' + (b ? '⚠️ İnternet yok — skorlar telefonda saklı, bağlanınca kendisi gönderecek' : g ? '☁️ gönderiliyor…' : '☁️ eğitmene gönderildi ✓') + '</div>';
}
function yrsGonderimGoster() { let el = document.getElementById('yrs-gonderim'); if (el) el.outerHTML = yrsGonderimHTML() || '<div id="yrs-gonderim"></div>'; }
function yrsBekleyenleriGonder() {
    if (!yrsBekleyenVar()) { if (_yrsGon === 'bekliyor') { _yrsGon = 'tamam'; yrsGonderimGoster(); } return; } // ortak kuyruk (kyBekleyenGonder) göndermiş olabilir
    if (navigator.onLine !== false) kyBekleyenler().filter(function (a) { return /^yarisma/.test(a); }).forEach(function (a) { yrsGonder(a, true); });
}
setInterval(yrsBekleyenleriGonder, 15000);
window.addEventListener('online', function () { setTimeout(yrsBekleyenleriGonder, 1000); });
setTimeout(function () { if (typeof kyDepoSenkron === 'function') ['yarisma_sporcu', 'yarisma_hedef'].forEach(function (a) { if (Object.keys(yrsOku(a)).length) kyDepoSenkron(a, function () { return yrsOku(a); }, false).catch(function () {}); }); }, 4000);
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
    let hd = yrsOku('yarisma_hedef'), sonucu = function (y) { let rs = (hd[y.id + '|' + k] || {}).resmi, so = (sp[y.id + '|' + k] || {}).sonuc; return rs && rs.puan ? Object.assign({}, so || {}, rs) : so; };
    return { y: yaklasan || sonucBekleyen || null, gecmis: l.filter(function (y) { return y.tarih < bugun || sonucu(y); }).map(function (y) { return { y: y, s: sonucu(y) }; }).filter(function (x) { return x.s; }).reverse() };
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
    el.innerHTML = '<button type="button" class="yrs-serit" onclick="_yrs.gorunum=\'benim\';sekmeAc(\'yarisma\')"><span class="yrs-serit-ikon" aria-hidden="true">🏆</span><span><b>' + yrsEsc(y.ad) + '</b><small>' + yrsTarihTR(y.tarih, true) + ' · ' + durum + '</small></span><span class="yrs-serit-ok">Yarışma modu ›</span></button>';
}
// 🏆 Yarışma sekmesi: üstte yarışma başlığı + geri sayım, altında iki mod: 🎒 Ön hazırlık · ⚔️ Maç zamanı.
function yrsSekme(grup, ad) {
    let el = document.getElementById('icerik-yarisma'); if (!el) return;
    yrsCss();
    if (!grup || !ad) { el.innerHTML = '<div class="yrs-bos">Yarışma modu için sporcu olarak giriş yap.</div>'; return; }
    _yrs.egitmen = false; _yrs.kim = { grup: grup, ad: ad };
    if (_yrs.gorunum === 'benim') return yrsBenimCiz(grup, ad);
    yrsSenkron(function () { if (el.classList.contains('aktif') && _yrs.gorunum !== 'benim') yrsSekmeCiz(); });
    yrsSekmeCiz();
}
// 🎯 "Benim skorum": sporcunun kendi yarışması (ön hazırlık / maç zamanı) — v312'den önce sekmenin tamamı buydu
function yrsBenimCiz(grup, ad) {
    let el = document.getElementById('icerik-yarisma'); if (!el) return;
    let k = grup + '|' + ad, bil = yrsSporcununki(k);
    _yrs.kim = { grup: grup, ad: ad };
    yrsSenkron(function () { if (document.getElementById('icerik-yarisma') && document.getElementById('icerik-yarisma').classList.contains('aktif')) yrsSekme(grup, ad); });
    if (!bil.y) { el.innerHTML = '<div class="yrs">' + yrsGeriHTML() + '<div class="yrs-bos"><div style="font-size:44px">🏆</div><b>Yaklaşan yarışman yok</b><div class="yrs-alt">Koçun seni bir yarışmaya eklediğinde burada ön hazırlık ve maç zamanı açılır.</div></div>' + (bil.gecmis.length ? yrsGecmisHTML(bil.gecmis) : '') + yrsSkorKartHTML() + '</div>'; return; }
    let y = bil.y, anahtar = y.id + '|' + k, hd = yrsOku('yarisma_hedef')[anahtar] || {}, sd = yrsOku('yarisma_sporcu')[anahtar] || {}, bugun = yrsBugun();
    let gecti = y.tarih < bugun, gunu = y.tarih === bugun;
    if (!_yrs.mod || _yrs.modY !== y.id) { _yrs.mod = (gunu || gecti || (sd.mac && (sd.mac.seriler || []).length)) ? 'mac' : 'hazirlik'; _yrs.modY = y.id; }
    let hero = '<div class="yrs-hero"><span class="yrs-rozet" aria-hidden="true">🏆</span><div class="yrs-etk" style="color:#ffd8a8">' + (gecti ? 'Yarışma bitti' : gunu ? 'Bugün yarışma günü!' : 'Yaklaşan yarışma') + '</div><h2>' + yrsEsc(y.ad) + '</h2>'
        + '<div class="yrs-yer">📅 ' + yrsTarihTR(y.tarih, true) + (y.saat ? ' · ⏰ ' + yrsEsc(y.saat) : '') + (y.yer ? '<br>📍 ' + yrsEsc(y.yer) : '') + '</div>'
        + (gecti || _yrs.mod === 'mac' ? '' : '<div class="yrs-sayac" id="yrs-sayac" data-hedef="' + (yrsHedefTarih(y) || new Date()).getTime() + '"></div>')
        + '<div class="yrs-bilgi">' + [y.mesafe ? '🎯 ' + y.mesafe : '', y.yuz ? '🧾 ' + (YRS_YUZ[y.yuz] || y.yuz) : '', y.kategori ? '🏷 ' + y.kategori : '', y.ok ? '🏹 ' + y.ok + ' ok' : ''].filter(Boolean).map(function (x) { return '<span>' + yrsEsc(x) + '</span>'; }).join('') + '</div></div>';
    let sec = '<div class="yrs-mod" role="tablist" aria-label="Yarışma modu"><button type="button" role="tab" aria-selected="' + (_yrs.mod === 'hazirlik') + '" class="' + (_yrs.mod === 'hazirlik' ? 'akt' : '') + '" onclick="yrsModSec(\'hazirlik\')"><b>🎒 Ön hazırlık</b><small>liste · hedef · plan · analiz</small></button><button type="button" role="tab" aria-selected="' + (_yrs.mod === 'mac') + '" class="' + (_yrs.mod === 'mac' ? 'akt' : '') + '" onclick="yrsModSec(\'mac\')"><b>⚔️ Maç zamanı</b><small>seri seri skor · tempo · nişangah</small></button></div>';
    let ic = _yrs.mod === 'mac' ? yrsMacHTML(y, anahtar, hd, sd) : yrsHazirlikHTML(y, k, anahtar, hd, sd);
    el.innerHTML = '<div class="yrs">' + yrsGeriHTML() + hero + sec + ic + yrsSkorKartHTML() + yrsKarneHTML(grup, ad) + (bil.gecmis.length ? yrsGecmisHTML(bil.gecmis) : '') + '</div>';
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
    let su = (_yrs.suanki || []).map(function (q) { return typeof q === 'string' ? { p: q, k: null } : q; }), ort = atilan ? top / atilan : 0, kalanOk = Math.max(0, ok - atilan);
    let tahmin = atilan ? Math.round(top + ort * kalanOk) : null, tempo = hd.hedef && atilan ? Math.round(top - hd.hedef * atilan / ok) : null;
    let halka = y.yuz === '10' ? 10 : 6, tuslar = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].filter(function (p) { return p === 'X' || p === 'M' || +p >= 11 - halka; });
    let renk = function (p) { let v = yrsDeger(p); return p === 'M' ? 'm' : v >= 9 ? 's' : v >= 7 ? 'k' : v >= 5 ? 'b' : v >= 3 ? 'y' : 'w'; };
    let durum = '<div class="yrs-kart yrs-mac-durum"><div class="yrs-mac-sayilar"><div><b>' + top + '</b><small>TOPLAM</small></div><div><b>' + atilan + '<span>/' + ok + '</span></b><small>OK</small></div><div><b>' + (atilan ? ort.toFixed(2).replace('.', ',') : '–') + '</b><small>OK ORT.</small></div></div>'
        + (tempo != null ? '<div class="yrs-tempo ' + (tempo >= 0 ? 'iyi' : 'kotu') + '">' + (tempo >= 0 ? '▲ Hedef temposunun ' + tempo + ' puan önündesin' : '▼ Hedef temposunun ' + Math.abs(tempo) + ' puan gerisindesin') + '<small>Bu gidişle bitiş: <b>' + tahmin + '</b> · hedef ' + hd.hedef + '</small></div>' : (tahmin != null ? '<div class="yrs-tempo">Bu gidişle bitiş: <b>' + tahmin + '</b></div>' : '<div class="yrs-alt">İlk seriyi gir; toplam, ortalama ve hedef temposu burada görünür.</div>')) + '</div>';
    let slot = ''; for (let i = 0; i < seriOk; i++) { let q = su[i] && su[i].p; slot += '<span class="yrs-slot-yer"><span class="yrs-slot ' + (q ? renk(q) : 'bos') + '">' + (q || '') + '</span><small>Ok ' + (i + 1) + '</small></span>'; }
    let bek = _yrs.bek, uclu = y.yuz === '3lu';
    let yonPed = Object.keys(YRS_YON).map(function (yy) { return '<button type="button" class="yrs-yon-b" onclick="yrsMacYon(\'' + yrsE(anahtar) + '\',\'' + yy + '\')"' + (bek ? '' : ' disabled') + ' aria-label="Yön ' + yy + '">' + yy + '</button>'; }).join('');
    let yonKutu = '<div class="yrs-yon-alan' + (uclu ? ' uclu' : '') + '"><div class="yrs-yon-kutu' + (bek ? ' bekliyor' : '') + '"><b>' + (bek ? bek.p + ' — ' + (uclu ? 'okun olduğu yüze, o tarafına dokun' : 'ok hangi tarafta?') : 'Önce puana bas') + '</b>' + (uclu ? '<small>Kağıtta okun olduğu yüzün sağına, soluna, üstüne… dokun. Ortaya dokun = merkez.</small>' : '<div class="yrs-yon-ped">' + yonPed + '</div>') + '<small>' + (bek ? 'Dokunmazsan ' + (uclu ? '2,5' : '1,5') + ' sn sonra yalnız puan kaydolur' : 'Yön, okların nereye gittiğini görmek için') + '</small>' + (bek ? '<i class="yrs-yon-sure' + (uclu ? ' uzun' : '') + '"></i>' : '') + '</div>'
        + '<div class="yrs-kagit-yer">' + yrsKagitSVG(y, (su || []).map(function (q) { return q.k; }), bek, 'yrsMacKagit(event,\'' + yrsE(anahtar) + '\')') + '</div></div>';
    let N = Math.ceil(ok / seriOk), tamam = m.seriler.length >= N;
    let giris = m.bitti ? '' : '<div class="yrs-kart yrs-gir-kart"><button type="button" class="yrs-gir-btn" onclick="yrsGirisAc(\'' + yrsE(anahtar) + '\')"><span class="yrs-gir-ikon">🎯</span><span><b>' + (tamam ? 'Bütün seriler girildi' : m.seriler.length ? (m.seriler.length + 1) + '. seriyi gir' : 'Skor girmeye başla') + '</b><small>' + (tamam ? 'düzeltmek için aç · sonra 🏁 Bitir' : 'Skor Gir ekranı açılır: hedefe dokun ya da hızlı giriş · ' + m.seriler.length + '/' + N + ' seri') + '</small></span><span class="yrs-gir-ok">›</span></button></div>';
    let seriler = m.seriler.length ? '<div class="yrs-kart"><span class="yrs-etk">📋 Seriler</span><div class="yrs-seri-izgara">' + m.seriler.map(function (s, i) { let t = s.reduce(function (a, p) { return a + yrsDeger(p); }, 0), hh = hd.hedef ? hd.hedef / ok * s.length : null; return '<div class="' + (hh != null ? (t >= hh ? 'iyi' : 'kotu') : '') + '"><small>' + (i + 1) + '</small><b>' + t + '</b><span>' + s.join(' ') + '</span></div>'; }).join('') + '</div></div>' : '';
    let grup = yrsMacGrupHTML(y, m);
    let rutin = m.bitti ? '' : '<div class="yrs-kart yrs-rutin"><span class="yrs-etk">🧘 Seriler arası</span><div class="yrs-rutin-adim"><span>1 · Derin nefes</span><span>2 · Duruş + çapa</span><span>3 · Bırak ve takip et</span></div>' + (hd.not ? '<div class="yrs-not">💬 ' + yrsEsc(hd.not) + '</div>' : '') + '</div>';
    let nis = '<div class="yrs-kart"><span class="yrs-etk">🔧 Nişangah defteri</span><div class="yrs-alt" style="margin:4px 0 8px">Nişangahı oynattıysan dokun: hangi seriden sonra kaç tık nereye.</div><div class="yrs-nis-tus">' + [['⬅', 'sol'], ['➡', 'sağ'], ['⬆', 'yukarı'], ['⬇', 'aşağı']].map(function (x) { return '<button type="button" onclick="yrsMacNis(\'' + yrsE(anahtar) + '\',\'' + x[1] + '\')">' + x[0] + ' 1 tık ' + x[1] + '</button>'; }).join('') + '</div>'
        + (m.nis.length ? '<div class="yrs-nis-liste">' + m.nis.slice().reverse().slice(0, 8).map(function (n) { return '<span>' + n.seri + '. seriden sonra · ' + n.tik + ' tık ' + n.yon + '</span>'; }).join('') + '</div>' : '') + '</div>';
    let bitir = m.bitti ? yrsSonucHTML(y, anahtar, sd.sonuc || { puan: top }) : (atilan ? '<button type="button" class="yrs-ana-btn yrs-bitir" onclick="yrsMacBitir(\'' + yrsE(anahtar) + '\')">🏁 Yarışmayı bitir · ' + top + ' puan sonuca geçsin</button>' : '');
    return durum + giris + seriler + grup + rutin + nis + bitir;
}
function yrsKagitSVG(y, konumlar, vurgu, tik) {
    let n = yrsHalka(y), uclu = y.yuz === '3lu', a = YRS_UCLU_ARA, ycler = uclu ? [-a, 0, a] : [0], id = 'yrspk', defs = '';
    let R = { s: ['#fff6a8', '#ffd21f', '#d99a00'], k: ['#ff8f8f', '#ef3b3b', '#a51d1d'], m: ['#8fdcff', '#1aa3e8', '#0b5f8f'], y: ['#5b6474', '#272d38', '#0e1117'], b: ['#ffffff', '#f2f4f7', '#c9ced6'] };
    Object.keys(R).forEach(function (k) { defs += '<radialGradient id="' + id + k + '" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="' + R[k][0] + '"/><stop offset=".55" stop-color="' + R[k][1] + '"/><stop offset="1" stop-color="' + R[k][2] + '"/></radialGradient>'; });
    defs += '<radialGradient id="' + id + 'pr" cx="30%" cy="22%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    let an = function (v) { return v >= 9 ? 's' : v >= 7 ? 'k' : v >= 5 ? 'm' : v >= 3 ? 'y' : 'b'; }, hh = uclu ? 2 * a + 2.4 : 2.4, y0 = uclu ? -a - 1.2 : -1.2;
    let s = '<svg class="yrs-kagit' + (uclu ? ' uclu' : '') + (vurgu ? ' bekliyor' : '') + '"' + (tik ? ' onclick="' + tik + '"' : '') + ' viewBox="-1.25 ' + (y0 - 0.05) + ' 2.5 ' + (hh + 0.1) + '" role="img" aria-label="Hedef kağıdı"><defs>' + defs + '</defs><rect x="-1.2" y="' + y0 + '" width="2.4" height="' + hh + '" rx="0.06" fill="#fbf6ec" stroke="rgba(0,0,0,.12)" stroke-width="0.01"/>';
    ycler.forEach(function (cy) { for (let i = n; i >= 1; i--) { let v = 11 - i; s += '<circle cy="' + cy + '" r="' + (i / n) + '" fill="url(#' + id + an(v) + ')" stroke="rgba(0,0,0,.28)" stroke-width="0.008"/>'; } s += '<path d="M-.035 ' + cy + 'H.035M0 ' + (cy - 0.035) + 'V' + (cy + 0.035) + '" stroke="#7c2d12" stroke-width="0.007"/><ellipse cx="-0.25" cy="' + (cy - 0.42) + '" rx="0.75" ry="0.42" fill="url(#' + id + 'pr)" pointer-events="none"/>'; });
    (konumlar || []).forEach(function (k, i) { if (!k || k.x == null) return; let gy = k.y + (uclu ? ((k.s != null ? k.s : 1) - 1) * a : 0); s += '<circle cx="' + k.x + '" cy="' + gy + '" r="0.055" fill="#0b0d12" stroke="#fff" stroke-width="0.02"/>' + (k.n || konumlar.length <= 6 ? '<text x="' + (k.x + 0.09) + '" y="' + (gy - 0.06) + '" font-size="0.1" font-weight="900" fill="#0b0d12" stroke="#fff" stroke-width="0.022" paint-order="stroke">' + (k.n || i + 1) + '</text>' : ''); });
    return s + '</svg>';
}
function yrsMacGrupHTML(y, m) {
    let tum = []; (m.kon || []).forEach(function (sk) { (sk || []).forEach(function (k) { if (k && k.x != null) tum.push(k); }); });
    if (tum.length < 3) return '';
    let n = tum.length, mx = tum.reduce(function (t, k) { return t + k.x; }, 0) / n, my = tum.reduce(function (t, k) { return t + k.y; }, 0) / n, R = y.yuz === '3lu' ? 12 : y.yuz === '10' ? 61 : 40, cm = Math.hypot(mx, my) * R;
    let metin = cm < 2 ? '🎯 Grubun <b>merkezde</b>, nişangaha dokunma.' : '➡️ Grubun <b>~' + Math.round(cm) + ' cm ' + yrsYon(mx, my) + '</b>. Tekrar ediyorsa nişangahı biraz ' + yrsYonAl(mx, my) + ' al.';
    let kopya = tum.map(function (k) { return { x: k.x, y: k.y, s: k.s }; });
    return '<div class="yrs-kart"><span class="yrs-etk">🎯 Bugünkü grubun · ' + n + ' ok</span><div class="yrs-grup-ic"><div class="yrs-kagit-yer kucuk">' + yrsKagitSVG(y, kopya, false, null) + '</div><div class="yrs-tespit"><div><span></span><span>' + metin + '</span></div><div><span></span><span class="yrs-alt">Yalnız yönü girilen oklar; yaklaşık yerleri.</span></div></div></div></div>';
}
function yrsMacKaydet(anahtar, m) { let d = yrsOku('yarisma_sporcu')[anahtar] || {}, o = {}; o[anahtar] = Object.assign({}, d, { mac: m }); yrsYaz('yarisma_sporcu', o); }
function yrsMacYenile() { if (_yrs.kim) yrsSekme(_yrs.kim.grup, _yrs.kim.ad); }
// Puan + yön (2026-10-21, kullanıcı: "sporcular skorları girerken noktalama işaretleriyle yapsın" → "Puan + yön"): puan tuşu okun
// puanını bekletir; yön pedi (tek yüz) ya da parlak kağıda dokunuş (3'lüde yüz + yön) okun yaklaşık yerini ekler; dokunulmazsa 1,5 sn
// (3'lüde 2,5 sn) sonra yalnız puan. Giriş sırası = ok numarası. Konumlar m.kon[seri] = [{x, y, s, n}] (seriyle aynı sırada).
const YRS_YON = { '↖': [-1, -1], '↑': [0, -1], '↗': [1, -1], '←': [-1, 0], '●': [0, 0], '→': [1, 0], '↙': [-1, 1], '↓': [0, 1], '↘': [1, 1] };
const YRS_UCLU_ARA = 2.3;
function yrsHalka(y) { return y.yuz === '10' ? 10 : 6; }
function yrsYaklasikKonum(p, yon, y, s) {
    if (p === 'M' || !YRS_YON[yon]) return null; let n = yrsHalka(y), v = YRS_YON[yon], l = Math.hypot(v[0], v[1]);
    let r = p === 'X' ? 0.25 / n : p === '10' ? 0.75 / n : (11 - (+p) - 0.5) / n;
    let k = !l ? ((p === 'X' || p === '10') ? { x: 0, y: 0 } : null) : { x: Math.round(v[0] / l * r * 1000) / 1000, y: Math.round(v[1] / l * r * 1000) / 1000 };
    if (k && y.yuz === '3lu') k.s = s; return k;
}
// Yön girişi isteğe bağlı (2026-10-21, kullanıcı: "turnuva sırasında kimse bunu böyle yapamaz, telefondan rahat girilsin — Skor Gir
// sekmesindeki gibi"): varsayılan KAPALI → puan tuşu oku hemen ekler, seri dolunca kendiliğinden kaydolur (bekleme yok).
function yrsYonAcik() { try { return localStorage.getItem('dag_yrs_yon') === '1'; } catch (e) { return false; } }
function yrsYonDegis() {
    let ac = !yrsYonAcik(); try { localStorage.setItem('dag_yrs_yon', ac ? '1' : '0'); } catch (e) {}
    if (!ac && _yrs.bek && _yrs.kim) { let a = _yrs.bek.anahtar; if (a) yrsMacBekBitir(a, null, null, true); }
    yrsMacYenile();
}
function yrsMacOk(anahtar, p) {
    anahtar = yrsD(anahtar); let y = yrsOku('yarismalar')[anahtar.split('|')[0]] || {}, okTop = +y.ok || 60;
    if (_yrs.bek) yrsMacBekBitir(anahtar, null, null, true);
    let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}), atilan = m.seriler.reduce(function (a, s) { return a + s.length; }, 0);
    if (atilan + (_yrs.suanki || []).length >= okTop) { if (typeof showToast === 'function') showToast('Tüm oklar girildi — yarışmayı bitir.', 'info'); return yrsMacYenile(); }
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
    if (p === 'M' || !yrsYonAcik()) { yrsMacEkle(anahtar, { p: p, k: null }); return; }
    _yrs.bek = { p: p, anahtar: anahtar, z: setTimeout(function () { yrsMacBekBitir(anahtar, null, null); }, y.yuz === '3lu' ? 2500 : 1500) };
    yrsMacYenile();
}
function yrsMacYon(anahtar, yon) { yrsMacBekBitir(yrsD(anahtar), yon, null); }
function yrsMacKagit(e, anahtar) {
    anahtar = yrsD(anahtar); if (!_yrs.bek) { if (typeof showToast === 'function') showToast('Önce puana bas, sonra kağıtta okun yerine dokun.', 'info'); return; }
    let svg = e.currentTarget, y = yrsOku('yarismalar')[anahtar.split('|')[0]] || {}, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; let q = pt.matrixTransform(svg.getScreenCTM().inverse());
    let uclu = y.yuz === '3lu', sNo = uclu ? Math.max(0, Math.min(2, Math.round(q.y / YRS_UCLU_ARA) + 1)) : null, ly = uclu ? q.y - (sNo - 1) * YRS_UCLU_ARA : q.y, r = Math.hypot(q.x, ly);
    let yon = r < 0.28 ? '●' : ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'][((Math.round(Math.atan2(ly, q.x) / (Math.PI / 4)) % 8) + 8) % 8];
    yrsMacBekBitir(anahtar, yon, sNo);
}
function yrsMacBekBitir(anahtar, yon, sNo, sessiz) {
    let b = _yrs.bek; if (!b) return; clearTimeout(b.z); _yrs.bek = null;
    let y = yrsOku('yarismalar')[anahtar.split('|')[0]] || {}, sira = (_yrs.suanki || []).length;
    let k = yon ? yrsYaklasikKonum(b.p, yon, y, sNo != null ? sNo : sira % 3) : null;
    yrsMacEkle(anahtar, { p: b.p, k: k }, sessiz);
}
function yrsMacEkle(anahtar, ok, sessiz) {
    let y = yrsOku('yarismalar')[anahtar.split('|')[0]] || {}, seriOk = +y.seriOk || 3;
    _yrs.suanki = (_yrs.suanki || []).concat([ok]);
    if (_yrs.suanki.length >= seriOk) {
        let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {});
        let cift = _yrs.suanki.map(function (q, i) { return { p: q.p, k: q.k ? Object.assign({}, q.k, { n: i + 1 }) : { n: i + 1 } }; }).sort(function (a, b) { return yrsDeger(b.p) - yrsDeger(a.p) || (b.p === 'X') - (a.p === 'X'); });
        m.seriler.push(cift.map(function (c) { return c.p; })); m.kon = (m.kon || []).slice(); while (m.kon.length < m.seriler.length - 1) m.kon.push(null); m.kon.push(cift.map(function (c) { return c.k; }));
        _yrs.suanki = [];
        yrsMacKaydet(anahtar, m);
        let t = cift.reduce(function (a, q) { return a + yrsDeger(q.p); }, 0); if (typeof showToast === 'function') showToast(m.seriler.length + '. seri: ' + t + ' ✓', 'success');
    }
    if (!sessiz) yrsMacYenile();
}
function yrsMacGeri(anahtar) {
    anahtar = yrsD(anahtar);
    if (_yrs.bek) { clearTimeout(_yrs.bek.z); _yrs.bek = null; return yrsMacYenile(); }
    if ((_yrs.suanki || []).length) { _yrs.suanki.pop(); return yrsMacYenile(); }
    let m = yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}); if (!m.seriler.length) return;
    let son = m.seriler.pop(), sk = (m.kon || [])[m.seriler.length] || []; if (m.kon) m.kon = m.kon.slice(0, m.seriler.length);
    let cf = son.map(function (p, i) { return { p: p, k: sk[i] && sk[i].x != null ? sk[i] : null, n: (sk[i] && sk[i].n) || i + 1 }; }).sort(function (a, b) { return a.n - b.n; });
    _yrs.suanki = cf.slice(0, -1).map(function (c) { return { p: c.p, k: c.k }; }); yrsMacKaydet(anahtar, m); yrsMacYenile();
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
function yrsYenile() { let t = document.getElementById('icerik-yarisma'); if (t && t.classList.contains('aktif') && _yrs.kim && _yrs.gorunum === 'benim') yrsSekme(_yrs.kim.grup, _yrs.kim.ad); else if (document.getElementById('yarisma-kart-ana') && typeof sporcuAnaDoldur === 'function') sporcuAnaDoldur(); if (document.getElementById('yrs-yonet')) yrsYonetCiz(); }
function yrsSayacBaslat() {
    clearInterval(_yrs.sayacZ);
    let tik = function () { let e = document.getElementById('yrs-sayac'); if (!e) { clearInterval(_yrs.sayacZ); return; } let kal = Math.max(0, +e.dataset.hedef - Date.now()), g = Math.floor(kal / 864e5), s = Math.floor(kal / 36e5) % 24, d = Math.floor(kal / 6e4) % 60, sn = Math.floor(kal / 1e3) % 60;
        e.innerHTML = [[g, 'GÜN'], [s, 'SAAT'], [d, 'DAK'], [sn, 'SN']].map(function (x) { return '<div><b>' + String(x[0]).padStart(2, '0') + '</b><small>' + x[1] + '</small></div>'; }).join(''); };
    tik(); _yrs.sayacZ = setInterval(tik, 1000);
}

// ---------------------------------------------------------------- 🧑‍🏫 koç: yarışma yönetimi
function yrsTumSporcular() { let r = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(function (g) { Object.keys((typeof turnuvaDB !== 'undefined' && turnuvaDB[g]) || {}).forEach(function (ad) { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && !sp.donduruldu) r.push({ k: g + '|' + ad, g: g, ad: ad }); }); }); return r.sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); }); }
function yrsYonetAc() {
    if (_yrs.salt) { _yrs.salt = false; _yrs.canli = null; }
    _yrs.gun = null;
    yrsCss();
    let kap = document.getElementById('yrs-yonet');
    if (!kap) { kap = document.createElement('div'); kap.id = 'yrs-yonet'; kap.className = 'yrs-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yrsYonetKapat(); }); (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap); }
    _yrs.senkron = 0; yrsSenkron(function () { if (document.getElementById('yrs-yonet')) yrsYonetCiz(); });
    yrsYonetCiz();
}
function yrsYonetKapat() { let k = document.getElementById('yrs-yonet'); if (k) k.remove(); _yrs.duzenle = null; if (_yrs.salt) { _yrs.salt = false; _yrs.canli = null; _yrs.canliSec = null; } }
function yrsYonetCiz() {
    let kap = document.getElementById('yrs-yonet'); if (!kap) return;
    let ust = kap.scrollTop, sekme = kap.classList.contains('yrs-sekme-yonet'), sar = function (ic, et) { return sekme ? '<div class="yrs-pen yrs-pen-sekme">' + ic + '</div>' : '<div class="yrs-pen" role="dialog" aria-modal="true" aria-label="' + et + '">' + ic + '</div>'; };
    if (_yrs.duzenle) { kap.innerHTML = yrsFormHTML(); kap.scrollTop = ust; return; }
    if (_yrs.canli) { let h = yrsCanliHTML(_yrs.canli); if (h) { kap.innerHTML = sar(h + (sekme ? '' : '<button class="yz-btn" onclick="yrsYonetKapat()">✕ Kapat</button>'), 'Yarışma sonuçları'); kap.scrollTop = ust; yrsCanliZamanla(); return; } }
    if (_yrs.gun && sekme) { kap.innerHTML = sar(yrsGunHTML(), 'Yarışma skorları'); kap.scrollTop = ust; yrsCanliZamanla(); return; }
    let bugun = yrsBugun(), l = yrsListe(), gelen = l.filter(function (y) { return y.tarih >= bugun; }), eski = l.filter(function (y) { return y.tarih < bugun; }).reverse(), sp = yrsOku('yarisma_sporcu');
    let sat = function (y) {
        let n = (y.katilimci || []).length, sonuc = (y.katilimci || []).filter(function (k) { let d = sp[y.id + '|' + k] || {}; return d.sonuc || yrsMacVeri(d).seriler.length; }).length, gun = y.tarih === bugun;
        return '<div class="yrs-yar-sat"><button class="yrs-yar' + (gun ? ' bugun' : '') + '" onclick="yrsCanliAc(\'' + yrsE(y.id) + '\')"><span class="yrs-yar-t"><b>' + yrsTarihTR(y.tarih).split(' ')[0] + '</b>' + yrsTarihTR(y.tarih).split(' ')[1].slice(0, 3) + '</span><span><b>' + (gun ? '<span class="yrs-canli-rozet">● BUGÜN</span> ' : '') + yrsEsc(y.ad) + '</b><small>' + [y.mesafe, YRS_YUZ[y.yuz] || '', y.kategori, n + ' sporcu'].filter(Boolean).map(yrsEsc).join(' · ') + (y.tarih <= bugun ? ' · ' + sonuc + '/' + n + ' skor girdi' : '') + '</small></span><span class="yrs-ok">' + (y.tarih <= bugun ? '📊' : '›') + '</span></button><button class="yz-btn yrs-yar-duz" onclick="yrsDuzenle(\'' + yrsE(y.id) + '\')" aria-label="Düzenle">✏️</button></div>';
    };
    kap.innerHTML = sar((sekme ? yrsGeriHTML() : '') + '<div class="yrs-pen-bas"><div><b>🏆 Yarışmalar</b><div class="yrs-alt">Yarışmaya dokun → sporcuların skorları (canlı ısı haritası, düşüş / yükseliş). Eklenen yarışma seçilen sporcuların ekranında görünür; yarışma günü skorlarını Skor Gir ekranından girerler.</div></div>' + (sekme ? '' : '<button class="yz-btn" onclick="yrsYonetKapat()" aria-label="Kapat">✕</button>') + '</div>'
        + '<button class="yrs-ana-btn" onclick="yrsDuzenle(null)">＋ Yeni yarışma</button>'
        + '<div class="yrs-etk" style="margin-top:6px">Yaklaşan</div>' + (gelen.length ? gelen.map(sat).join('') : '<div class="yrs-alt">Yaklaşan yarışma yok.</div>')
        + (eski.length ? '<div class="yrs-etk" style="margin-top:10px">Geçmiş</div>' + eski.slice(0, 20).map(sat).join('') : ''), 'Yarışmalar');
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

// ---------------------------------------------------------------- 🎯 yarışmada skor girişi = normal Skor Gir ekranı (v309)
// Kullanıcı (2026-10-24, yarışma günü): "sporcuların skor gireceği yeri düzgün yap, normal Skor Gir ekranı gayet iyi".
// Maç zamanı artık kendi tuş takımını değil Skor Gir'in kendisini açar (hedefe dokun, büyüteç, yakınlaştır, hızlı giriş,
// otomatik kaydet, 3'lü spot kuralı). window._yrsGiris açıkken app.js'teki skorKaydet / oncekiSeriyiDuzelt /
// skorEkraniniKapat buraya döner: seri antrenmana (turnuvaDB) DEĞİL yarisma_sporcu.mac'e yazılır. Okun yeri
// kağıt birimine (yüz yarıçapı = 1, 3'lüde s = yüz no) çevrilip m.kon'a yazılır → eğitmen grubu/yönü görür.
const YRS_HEDEF_TIP = { '3lu': '3spot', '10': '10ring', '6': '6ring' };
function yrsAnahtarAc(a) { let p = a.split('|'); return { id: p[0], grup: p[1], ad: p.slice(2).join('|') }; }
function yrsSeriToplam(s) { return (s || []).reduce(function (a, p) { return a + yrsDeger(p); }, 0); }
function yrsGirisAc(anahtar) {
    anahtar = yrsD(anahtar);
    let a = yrsAnahtarAc(anahtar), y = yrsOku('yarismalar')[a.id];
    if (!y || typeof skorEkraniniAc !== 'function') return;
    if (typeof turnuvaDB === 'undefined' || !turnuvaDB[a.grup] || !turnuvaDB[a.grup][a.ad]) { if (typeof showToast === 'function') showToast('Sporcu bulunamadı.', 'error'); return; }
    if (yrsMacVeri(yrsOku('yarisma_sporcu')[anahtar] || {}).bitti) { if (typeof showToast === 'function') showToast('Bu yarışma bitti olarak işaretli.', 'warning'); return; }
    yrsCss();
    window._yrsGiris = { anahtar: anahtar, id: a.id, grup: a.grup, ad: a.ad, eskiGrup: aktifGrup, eskiOk: manuelOkSayisi };
    aktifGrup = a.grup; manuelOkSayisi = +y.seriOk || 3;
    document.body.classList.add('yrs-giris-acik');
    skorEkraniniAc(a.ad);
    setHedefTipi(YRS_HEDEF_TIP[y.yuz] || '6ring');
    let bar = document.getElementById('hizli-gecis-bar'); if (bar) bar.innerHTML = '';
    yrsGirisBantCiz();
}
function yrsGirisBantCiz() {
    let g = window._yrsGiris; if (!g) return;
    let y = yrsOku('yarismalar')[g.id] || {}, m = yrsMacVeri(yrsOku('yarisma_sporcu')[g.anahtar] || {}), hd = yrsOku('yarisma_hedef')[g.anahtar] || {};
    let seriOk = +y.seriOk || 3, ok = +y.ok || 60, N = Math.ceil(ok / seriOk), top = 0, atilan = 0;
    m.seriler.forEach(function (s) { top += yrsSeriToplam(s); atilan += s.length; });
    let tempo = hd.hedef && atilan ? Math.round(top - hd.hedef * atilan / ok) : null, bitti = m.seriler.length >= N;
    let el = document.getElementById('yrs-giris-bant');
    if (!el) { el = document.createElement('div'); el.id = 'yrs-giris-bant'; let ref = document.getElementById('hizli-gecis-bar'); if (!ref) return; ref.insertAdjacentElement('beforebegin', el); }
    el.innerHTML = '<div class="yrs-gb-ust"><span><b>🏆 ' + yrsEsc(y.ad || 'Yarışma') + '</b><small>' + (bitti ? 'Bütün seriler girildi' : (m.seriler.length + 1) + '. seri / ' + N) + (tempo != null ? ' · hedef temposu ' + (tempo >= 0 ? '+' : '') + tempo : '') + '</small></span><span class="yrs-gb-say"><b>' + top + '</b><small>' + atilan + '/' + ok + ' ok</small></span></div>'
        + '<div class="yrs-gb-cubuk"><i style="width:' + Math.min(100, Math.round(m.seriler.length / N * 100)) + '%"></i></div>'
        + (yrsGonderimHTML() || '<div id="yrs-gonderim"></div>')
        + (m.seriler.length ? '<div class="yrs-gb-seriler">' + m.seriler.slice(-8).map(function (s, i, l) { return '<span>' + yrsSeriToplam(s) + '</span>'; }).join('') + '<small>son seriler</small></div>' : '')
        + (bitti || atilan ? '<button type="button" class="yrs-gb-bitir' + (bitti ? ' tam' : '') + '" onclick="yrsGirisBitir()">🏁 Yarışmayı bitir · ' + top + ' puan</button>' : '');
    let b = document.getElementById('giris-paneli-baslik'); if (b) b.innerText = '🏆 ' + g.ad + ' · ' + (bitti ? 'tamam' : (m.seriler.length + 1) + '. seri');
}
function yrsKonumCevir(o, n) {
    if (!o || o.x == null || o.y == null) return { n: n };
    if (o.tip === '3spot') { let s = o.spot != null ? o.spot : 1; return { x: +(o.x / 60).toFixed(3), y: +((o.y - (s - 1) * 140) / 60).toFixed(3), s: s, n: n }; }
    let R = o.tip === '10ring' ? 100 : 60; return { x: +(o.x / R).toFixed(3), y: +(o.y / R).toFixed(3), n: n };
}
function yrsKonumGeri(k, tip) {
    if (!k || k.x == null) return { x: null, y: null, spot: null };
    if (tip === '3spot') { let s = k.s != null ? k.s : 1; return { x: k.x * 60, y: k.y * 60 + (s - 1) * 140, spot: s }; }
    let R = tip === '10ring' ? 100 : 60; return { x: k.x * R, y: k.y * R, spot: null };
}
function yrsGirisKaydet() {
    let g = window._yrsGiris; if (!g) return;
    let y = yrsOku('yarismalar')[g.id] || {}, okAdet = getMaksOk();
    if (anlikAtilanOklar.length !== okAdet) { if (typeof buyukHata === 'function') buyukHata('EKSİK SKOR!\n\nBu seride ' + okAdet + ' ok olmalı, şu an ' + anlikAtilanOklar.length + ' ok var.'); return; }
    let d = yrsOku('yarisma_sporcu')[g.anahtar] || {}, m = yrsMacVeri(d), N = Math.ceil((+y.ok || 60) / okAdet);
    if (m.bitti) { if (typeof showToast === 'function') showToast('Yarışma bitti olarak işaretli.', 'warning'); return; }
    if (m.seriler.length >= N) { if (typeof showToast === 'function') showToast('Bütün seriler zaten girildi — 🏁 Bitir.', 'warning'); return; }
    let oklar = efektifOklar().map(function (o, i) { return { p: o.cezali ? 'M' : String(o.puan), k: yrsKonumCevir(o, i + 1) }; })
        .sort(function (a, b) { return yrsDeger(b.p) - yrsDeger(a.p) || (b.p === 'X') - (a.p === 'X'); });
    m.seriler.push(oklar.map(function (o) { return o.p; }));
    m.kon = (m.kon || []).slice(); while (m.kon.length < m.seriler.length - 1) m.kon.push(null); m.kon.push(oklar.map(function (o) { return o.k; }));
    m.son = Date.now();
    yrsMacKaydet(g.anahtar, m);
    anlikAtilanOklar = []; if (typeof _seriAraliklari !== 'undefined') _seriAraliklari = [];
    hedefGorseliGuncelle(false);
    try { sesCal(900, 0.12); } catch (e) {}
    let t = oklar.reduce(function (a, o) { return a + yrsDeger(o.p); }, 0);
    if (typeof showToast === 'function') showToast(m.seriler.length + '. seri: ' + t + ' kaydedildi', 'success');
    yrsGirisBantCiz();
    if (m.seriler.length >= N) yrsGirisBitir();
}
function yrsGirisGeriAl() {
    let g = window._yrsGiris; if (!g) return;
    let d = yrsOku('yarisma_sporcu')[g.anahtar] || {}, m = yrsMacVeri(d);
    if (!m.seriler.length || m.bitti) { if (typeof showToast === 'function') showToast('Düzeltilecek seri yok.', 'warning'); return; }
    let geri = function () {
        let son = m.seriler.pop(), sk = (m.kon || [])[m.seriler.length] || []; m.kon = (m.kon || []).slice(0, m.seriler.length);
        let tip = aktifHedefTipi;
        anlikAtilanOklar = son.map(function (p, i) { return { p: p, k: sk[i], n: (sk[i] && sk[i].n) || i + 1 }; }).sort(function (a, b) { return a.n - b.n; })
            .map(function (q) { let r = getRenkForPuan(q.p), kk = q.k && q.k.x != null && (tip === '3spot') === (q.k.s != null) ? yrsKonumGeri(q.k, tip) : { x: null, y: null, spot: null }; return { x: kk.x, y: kk.y, puan: q.p, bg: r.bg, color: r.c, tip: tip, spot: kk.spot }; });
        if (typeof _seriAraliklari !== 'undefined') _seriAraliklari = [];
        yrsMacKaydet(g.anahtar, m); hedefGorseliGuncelle(false); yrsGirisBantCiz();
        if (typeof showToast === 'function') showToast('Son seri geri alındı — oku sil / taşı, sonra yeniden kaydet.', 'info');
    };
    if (anlikAtilanOklar.length) { if (typeof onayIste === 'function') onayIste('Bu seride girdiğin oklar silinip son kaydedilen seri açılsın mı?', geri, 'Aç', 'Vazgeç'); else geri(); } else geri();
}
function yrsGirisBitir() {
    let g = window._yrsGiris; if (!g) return;
    let a = g.anahtar, d = yrsOku('yarisma_sporcu')[a] || {}, m = yrsMacVeri(d), top = m.seriler.reduce(function (t, s) { return t + yrsSeriToplam(s); }, 0);
    let bit = function () { m.bitti = true; let o = {}; o[a] = Object.assign({}, d, { mac: m, sonuc: Object.assign({}, d.sonuc || {}, { puan: top }) }); yrsYaz('yarisma_sporcu', o); anlikAtilanOklar = []; skorEkraniniKapat(); if (typeof showToast === 'function') showToast('🏁 ' + top + ' puan kaydedildi.', 'success'); };
    if (typeof onayIste === 'function') onayIste('Yarışmayı bitirelim mi? <b>' + m.seriler.length + ' seri · ' + top + ' puan</b>', bit, '🏁 Bitir', 'Devam'); else bit();
}
function yrsGirisKapat() {
    let g = window._yrsGiris; if (!g) return;
    window._yrsGiris = null;
    aktifGrup = g.eskiGrup; manuelOkSayisi = g.eskiOk;
    document.body.classList.remove('yrs-giris-acik');
    let el = document.getElementById('yrs-giris-bant'); if (el) el.remove();
    let l = document.getElementById('skor-liste-gorunumu'); if (l) l.style.display = 'block';
    try { okSayisiGorunumGuncelle(); } catch (e) {}
    if (typeof sekmeAc === 'function') sekmeAc('yarisma');
}

// ---------------------------------------------------------------- 🏆 eğitmen sekmesi + canlı ısı haritası (v309)
// Kullanıcı: "yarışma oldu, sporcular skor girdi ama eğitmen olarak görebileceğim yer bulamadım; düşüşleri/yükselişleri
// görmek istiyorum" + "eğitmen için Yarışma sekmesi: ayarlanmış yarışmalar + yeni yarışma". Üç taslaktan B · Canlı Isı
// Haritası: herkes × seriler tek tabloda (renk = seri puanı), ± antrenmana göre, Dikkat kutusu, kulüp seri ortalaması.
// Yarışma günü açıkken 15 sn'de bir tazelenir (yalnız bu ekran açıkken).
function yrsEgitmenSekme() {
    let el = document.getElementById('icerik-yarisma'); if (!el) return;
    yrsCss();
    _yrs.egitmen = true; _yrs.kim = null;
    let m = document.getElementById('yrs-yonet'); if (m && !m.classList.contains('yrs-sekme-yonet')) m.remove();
    yrsSenkron(function () { if (el.classList.contains('aktif')) yrsSekmeCiz(); });
    yrsSekmeCiz();
}
// 🏆 Yarışma sekmesi açılışı (v312). Kullanıcı: "daha önce girilmiş olanı gösteriyor, onu kaldıralım, bugün girilenleri göstersin;
// PC, tablet, telefon fark etmesin; bana sorabilir: bugün atılanlar vs." → sekme önce sorar: 🔴 Bugün atılanlar · 📅 Dün ·
// 🎯 Benim skorum (sporcu) · 🗂 Tüm yarışmalar. Gün görünümü (Bugün/Dün/Bu hafta/Tümü çipleri) yarışmaların ısı haritasını
// gösterir; eğitmende düzenle / gir açık, sporcuda salt okunur. Seçim sayfa açık kaldıkça korunur, uygulama açılınca yine sorar.
// _yrs.gorunum: null (soru) | 'gun' (_yrs.gunSec) | 'benim' | 'liste' (eğitmen yönetim listesi).
function yrsSekmeCiz() {
    let el = document.getElementById('icerik-yarisma'); if (!el) return;
    if (!_yrs.gorunum) { el.innerHTML = yrsAcilisHTML(); return; }
    if (_yrs.gorunum === 'benim' && _yrs.kim) return yrsBenimCiz(_yrs.kim.grup, _yrs.kim.ad);
    if (!el.querySelector('.yrs-sekme-yonet')) el.innerHTML = '<div id="yrs-yonet" class="yrs-sekme-yonet"></div>';
    _yrs.salt = !_yrs.egitmen;
    _yrs.gun = _yrs.gorunum === 'gun' ? (_yrs.gunSec || 'bugun') : null;
    yrsYonetCiz();
}
function yrsSekmeYeniden() { if (_yrs.egitmen) yrsEgitmenSekme(); else if (_yrs.kim) yrsSekme(_yrs.kim.grup, _yrs.kim.ad); }
function yrsAcilisSec(sec) {
    _yrs.canli = null; _yrs.canliSec = null; _yrs.duzenle = null;
    if (!sec) _yrs.gorunum = null;
    else if (sec === 'benim' || sec === 'liste') _yrs.gorunum = sec;
    else { _yrs.gorunum = 'gun'; _yrs.gunSec = sec; }
    let el = document.getElementById('icerik-yarisma'); if (el) el.innerHTML = '';
    yrsSekmeYeniden();
    try { window.scrollTo(0, 0); } catch (e) {}
}
function yrsGunSec(g) { _yrs.gunSec = g; _yrs.canli = null; _yrs.canliSec = null; yrsSekmeCiz(); }
function yrsGeriHTML() { return '<button type="button" class="yz-btn yrs-geri-ust" onclick="yrsAcilisSec(null)">← Yarışma</button>'; }
function yrsSkorGirenSay(y) { let sp = yrsOku('yarisma_sporcu'); return (y.katilimci || []).filter(function (k) { let d = sp[y.id + '|' + k] || {}; return d.sonuc || yrsMacVeri(d).seriler.length; }).length; }
function yrsAcilisHTML() {
    let bugun = yrsBugun(), dun = yrsGunEkle(bugun, -1), l = yrsListe().filter(function (y) { return (y.katilimci || []).length; });
    let bL = l.filter(function (y) { return y.tarih === bugun; }), dL = l.filter(function (y) { return y.tarih === dun; });
    let ozet = function (x) { return x.map(function (y) { return yrsEsc(String(y.ad || '').trim().slice(0, 34)) + (y.kategori ? ' · ' + yrsEsc(y.kategori) : '') + ' · ' + yrsSkorGirenSay(y) + '/' + (y.katilimci || []).length + ' skor girdi'; }).join('<br>'); };
    let kart = function (ik, baslik, alt, sec, cls) { return '<button type="button" class="yrs-sec-kart' + (cls ? ' ' + cls : '') + '" onclick="yrsAcilisSec(' + Q2 + sec + Q2 + ')"><span class="yrs-sec-ik">' + ik + '</span><span><b>' + baslik + '</b><small>' + alt + '</small></span><span class="yrs-ok">›</span></button>'; };
    let h = '<div class="yrs yrs-acilis"><div class="yrs-acilis-soru">Hangi skorlara bakalım?</div><div class="yrs-alt" style="text-align:center">' + (bL.length ? 'Bugün yarışma var' : 'Bugün yarışma yok') + '</div>';
    h += kart('🔴', 'Bugün atılanlar' + (bL.length ? ' <span class="yrs-canli-rozet">● CANLI</span>' : ''), bL.length ? ozet(bL) : 'Bugün yarışma yok', 'bugun', bL.length ? 'ana' : 'soluk');
    h += kart('📅', 'Dün', dL.length ? ozet(dL) : 'Dün yarışma yok', 'dun', dL.length ? '' : 'soluk');
    if (!_yrs.egitmen && _yrs.kim) { let b = yrsSporcununki(_yrs.kim.grup + '|' + _yrs.kim.ad); h += kart('🎯', 'Benim skorum', b.y ? yrsEsc(String(b.y.ad || '').trim().slice(0, 40)) + ' · seri gir, hazırlık, sonuç' : 'Kayıtlı olduğun yaklaşan yarışma yok', 'benim', ''); }
    h += kart('🗂', 'Tüm yarışmalar', _yrs.egitmen ? 'Yaklaşan + geçmiş · ＋ Yeni yarışma · düzenle' : 'Bu haftaki ve geçmiş yarışmaların skorları', _yrs.egitmen ? 'liste' : 'tum', '');
    return h + '</div>';
}
const Q2 = String.fromCharCode(39);
function yrsGunHTML() {
    let g = _yrs.gun, bugun = yrsBugun(), dun = yrsGunEkle(bugun, -1), hafta = yrsGunEkle(bugun, -6);
    let l = yrsListe().filter(function (y) { return (y.katilimci || []).length && (g === 'bugun' ? y.tarih === bugun : g === 'dun' ? y.tarih === dun : g === 'hafta' ? y.tarih >= hafta && y.tarih <= bugun : y.tarih <= bugun); }).reverse();
    let cip = [['bugun', 'Bugün'], ['dun', 'Dün'], ['hafta', 'Bu hafta'], ['tum', 'Tümü']].map(function (c) { return '<button type="button" class="' + (g === c[0] ? 'akt' : '') + '" onclick="yrsGunSec(' + Q2 + c[0] + Q2 + ')">' + c[1] + '</button>'; }).join('');
    let bas = '<div class="yrs-pen-bas"><div>' + yrsGeriHTML() + '</div><div class="yrs-cn-sag"><button class="yz-btn" onclick="_yrs.senkron=0;yrsSenkron(yrsYonetCiz)" aria-label="Yenile">⟳</button></div></div><div class="yrs-gun-cip" role="tablist">' + cip + '</div>';
    if (!l.length) return bas + '<div class="yrs-kart yrs-bos"><div style="font-size:40px">🏆</div><b>' + (g === 'bugun' ? 'Bugün yarışma yok' : g === 'dun' ? 'Dün yarışma yok' : 'Yarışma yok') + '</b>' + (_yrs.egitmen ? '<button class="yrs-ana-btn" onclick="yrsDuzenle(null)">＋ Yeni yarışma</button>' : '') + '</div>';
    if (g === 'bugun' || g === 'dun') return bas + l.map(function (y) { return '<div class="yrs-gun-blok">' + yrsCanliHTML(y.id, true) + '</div>'; }).join('');
    return bas + l.map(function (y) { let n = (y.katilimci || []).length; return '<button class="yrs-yar' + (y.tarih === bugun ? ' bugun' : '') + '" onclick="yrsCanliAc(' + Q2 + yrsE(y.id) + Q2 + ')"><span class="yrs-yar-t"><b>' + yrsTarihTR(y.tarih).split(' ')[0] + '</b>' + yrsTarihTR(y.tarih).split(' ')[1].slice(0, 3) + '</span><span><b>' + yrsEsc(y.ad) + '</b><small>' + [y.mesafe, y.kategori, yrsSkorGirenSay(y) + '/' + n + ' skor girdi'].filter(Boolean).map(yrsEsc).join(' · ') + '</small></span><span class="yrs-ok">📊</span></button>'; }).join('');
}
function yrsSatirlar(y) {
    let sp = yrsOku('yarisma_sporcu'), hd = yrsOku('yarisma_hedef'), tum = yrsTumSporcular(), seriOk = +y.seriOk || 3;
    return (y.katilimci || []).map(function (k) {
        let d = sp[y.id + '|' + k] || {}, m = yrsMacVeri(d), st = m.seriler.map(yrsSeriToplam), x = tum.find(function (t) { return t.k === k; });
        let top = st.reduce(function (a, b) { return a + b; }, 0), atilan = m.seriler.reduce(function (a, s) { return a + s.length; }, 0);
        let bek = yrsBeklenenOrt(y, k), fark = bek != null && atilan ? Math.round(top - bek * atilan) : null, uygTop = top;
        let resmi = (hd[y.id + '|' + k] || {}).resmi || null;
        if (!atilan && d.sonuc && d.sonuc.puan) top = +d.sonuc.puan || 0; // yalnız sonucu elle girilmiş
        if (resmi && resmi.puan != null && resmi.puan !== '') top = +resmi.puan || 0; // eğitmenin girdiği resmi puan önce gelir
        let sonuc = Object.assign({}, d.sonuc || {}, resmi ? { sira: resmi.sira || (d.sonuc || {}).sira, kisi: resmi.kisi || (d.sonuc || {}).kisi, madalya: resmi.madalya || (d.sonuc || {}).madalya } : {});
        return { k: k, ad: x ? x.ad : k.slice(k.indexOf('|') + 1), m: m, st: st, top: top, uygTop: uygTop, resmi: resmi, atilan: atilan, bek: bek, fark: fark, sonuc: sonuc, seriOk: seriOk, son: m.son || 0, veri: !!(atilan || (d.sonuc && d.sonuc.puan) || (resmi && resmi.puan)) };
    }).sort(function (a, b) { return b.veri - a.veri || b.top - a.top || a.ad.localeCompare(b.ad, 'tr'); });
}
// Antrenman ok ortalaması (v313): yarışmadan ÖNCEKİ 30 günde Skor Gir'e girilen normal antrenman serileri (mesafesi yazılıysa
// aynı mesafe) — Σpuan / Σok. 24 oktan azsa aynı mesafedeki Yarışma provaları (yz_arsiv) eklenir. Toplam 24 ok yoksa null ("—").
// v312'ye kadar yalnız provalara bakıyordu; prova yapmayan sporcuda hep "—" çıkıyordu (kullanıcıya önerilen düzeltme 2).
function yrsBeklenenBilgi(y, k) {
    let ms = yrsMesafeNorm(y.mesafe), bit = y.tarih, bas = yrsGunEkle(y.tarih, -30), p = 0, o = 0, g = k.split('|')[0], ad = k.slice(k.indexOf('|') + 1);
    let sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad];
    if (sp && typeof _ysSeriler === 'function') _ysSeriler(sp).forEach(function (x) {
        let t = String(x.tarih || '').slice(0, 10), n = (x.oklar || []).length;
        if (!n || !t || t >= bit || t < bas || (x.mesafe && yrsMesafeNorm(x.mesafe) !== ms)) return;
        p += Number(x.puan) || 0; o += n;
    });
    let kaynak = o ? 'antrenman' : '';
    if (o < 24) { let pr = yrsProvaOrt(y, k); if (pr) { p += pr.p; o += pr.o; kaynak = kaynak ? 'antrenman + prova' : 'prova'; } }
    return o >= 24 ? { ort: p / o, ok: o, kaynak: kaynak } : null;
}
function yrsBeklenenOrt(y, k) { let b = yrsBeklenenBilgi(y, k); return b ? b.ort : null; }
function yrsProvaOrt(y, k) {
    let ms = yrsMesafeNorm(y.mesafe), bas = yrsHedefTarih(y), sinir = bas ? new Date(bas.getFullYear(), bas.getMonth(), bas.getDate()).getTime() : Date.now();
    let l = yrsArsiv().filter(function (r) { return yrsMesafeNorm(r.mesafe) === ms && (r.t || 0) < sinir; }).sort(function (a, b) { return (a.t || 0) - (b.t || 0); })
        .map(function (r) { let s = (r.sporcular || []).find(function (x) { return x.k === k; }); return s && s.ok ? s : null; }).filter(Boolean);
    let uzun = l.filter(function (s) { return s.ok >= 24; }), sec = (uzun.length ? uzun : l).slice(-5);
    if (!sec.length) return null;
    let p = sec.reduce(function (a, s) { return a + (+s.toplam || 0); }, 0), o = sec.reduce(function (a, s) { return a + s.ok; }, 0);
    return o ? { p: p, o: o } : null;
}
function yrsHucreRenk(v, seriOk) { let q = v / (seriOk * 10); return q >= 0.8 ? ['#16a34a', '#04210d'] : q >= 0.63 ? ['#4ade80', '#06230f'] : q >= 0.47 ? ['#fd8e01', '#1a0d05'] : q >= 0.27 ? ['#c2410c', '#fff'] : ['#7f1d1d', '#fff']; }
function yrsFarkHTML(f) { return f == null ? '<span class="yrs-f notr">—</span>' : '<span class="yrs-f ' + (f >= 3 ? 'ok' : f <= -3 ? 'dus' : 'notr') + '">' + (f > 0 ? '▲ +' + f : f < 0 ? '▼ ' + f : '＝ 0') + '</span>'; }
function yrsDikkat(y, sat) {
    let t = [], gun = y.tarih <= yrsBugun();
    sat.forEach(function (s) {
        let n = s.st.length, ad = '<b>' + yrsEsc(s.ad.split(' ')[0]) + '</b>', esik = s.seriOk * 0.67;
        if (!n) { if (gun && !s.veri) t.push([3, '✏️', ad + ' skor girmedi', s.k]); return; }
        if (n >= 8) { let h = n >> 1, a1 = s.st.slice(0, h), a2 = s.st.slice(h), o1 = a1.reduce(function (a, b) { return a + b; }, 0), o2 = a2.reduce(function (a, b) { return a + b; }, 0), fark = o2 / a2.length - o1 / a1.length;
            if (fark <= -esik) t.push([0, '📉', ad + ' 2. yarıda düştü: seri ort. ' + (o1 / a1.length).toFixed(1).replace('.', ',') + ' → ' + (o2 / a2.length).toFixed(1).replace('.', ',') + '. Yorulma / konsantrasyon — seri arası rutin.']);
            else if (fark >= esik) t.push([2, '📈', ad + ' 2. yarıda yükseldi: seri ort. ' + (o1 / a1.length).toFixed(1).replace('.', ',') + ' → ' + (o2 / a2.length).toFixed(1).replace('.', ',') + '.']); }
        if (s.resmi && s.resmi.puan && s.atilan && +s.resmi.puan !== s.uygTop) t.push([1, '🧾', ad + ' resmi puan ' + s.resmi.puan + ', uygulamaya girilen ' + s.uygTop + ' (fark ' + (+s.resmi.puan - s.uygTop > 0 ? '+' : '') + (+s.resmi.puan - s.uygTop) + ') — seri girişi eksik ya da yanlış olabilir.']);
        let sifir = s.st.map(function (v, i) { return v === 0 ? i + 1 : 0; }).filter(Boolean);
        if (sifir.length) t.push([1, '⚠️', ad + ' ' + sifir.length + ' seride hiç vuramadı (' + sifir.join('., ') + '.) · ' + s.m.seriler.reduce(function (a, q) { return a + q.filter(function (p) { return p === 'M'; }).length; }, 0) + ' karavana.']);
        if (n >= 6 && !s.m.bitti) { let ort = s.top / n, son3 = s.st.slice(-3).reduce(function (a, b) { return a + b; }, 0) / 3; if (son3 <= ort - esik * 1.5) t.push([0, '🔻', ad + ' son 3 seride düşüşte (' + s.st.slice(-3).join(', ') + ') — şimdi müdahale et.']); }
    });
    return t.sort(function (a, b) { return a[0] - b[0]; });
}
function yrsSeriBarSVG(st, seriOk, w, h) {
    if (!st.length) return '';
    let mx = seriOk * 10, bw = w / Math.max(st.length, 10), ort = st.reduce(function (a, b) { return a + b; }, 0) / st.length, esik = seriOk * 0.67;
    let s = '<svg class="yrs-bar" viewBox="0 0 ' + w + ' ' + (h + 14) + '" preserveAspectRatio="none" role="img" aria-label="Seri puanları"><line x1="0" x2="' + w + '" y1="' + (h - ort / mx * h) + '" y2="' + (h - ort / mx * h) + '" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="3 3"/>';
    st.forEach(function (v, i) { let bh = Math.max(2, v / mx * h), c = v >= ort + esik ? '#4ade80' : v <= ort - esik * 1.5 ? '#f87171' : '#fd8e01'; s += '<rect x="' + (i * bw + 1.5) + '" y="' + (h - bh) + '" width="' + Math.max(2, bw - 3) + '" height="' + bh + '" rx="2" fill="' + c + '"><title>' + (i + 1) + '. seri: ' + v + '</title></rect>' + (st.length <= 12 || i % 2 === 0 ? '<text x="' + (i * bw + bw / 2) + '" y="' + (h + 11) + '" font-size="8" text-anchor="middle" fill="currentColor" fill-opacity=".6">' + (i + 1) + '</text>' : ''); });
    return s + '</svg>';
}
function yrsCanliHTML(id, gomulu) {
    let y = yrsOku('yarismalar')[id]; if (!y || y.sil) { if (!gomulu) _yrs.canli = null; return ''; }
    let seriOk = +y.seriOk || 3, N = Math.ceil((+y.ok || 60) / seriOk), sat = yrsSatirlar(y), bugun = yrsBugun(), canli = y.tarih === bugun;
    let girdi = sat.filter(function (s) { return s.veri; }), simdi = sat.filter(function (s) { return s.son && Date.now() - s.son < 4 * 60000 && !s.m.bitti; }).length;
    let ortTop = girdi.length ? Math.round(girdi.reduce(function (a, s) { return a + s.top; }, 0) / girdi.length) : 0, dusen = sat.filter(function (s) { return s.fark != null && s.fark <= -3; }).length;
    let salt = !!_yrs.salt, ekD = salt ? '' : '<button class="yz-btn" onclick="yrsResmiAc(\'' + yrsE(y.id) + '\')">🏅 Resmi sonuç</button><button class="yz-btn" onclick="yrsRaporAc(\'' + yrsE(y.id) + '\')">📄 Rapor</button>';
    let bas = gomulu ? (salt ? '' : '<div class="yrs-cn-sag">' + ekD + '<button class="yz-btn" onclick="yrsDuzenle(\'' + yrsE(y.id) + '\')">✏️ Düzenle</button></div>') : '<div class="yrs-pen-bas"><div>' + (salt ? '<b>📊 Yarışma skorları</b>' : '<button class="yz-btn" onclick="_yrs.canli=null;_yrs.canliSec=null;yrsYonetCiz()">← Yarışmalar</button>') + '</div><div class="yrs-cn-sag">' + (canli ? '<span class="yrs-canli-rozet">● CANLI</span>' : '') + '<button class="yz-btn" onclick="_yrs.senkron=0;yrsSenkron(yrsYonetCiz)" aria-label="Yenile">⟳</button>' + (salt ? '<button class="yz-btn" onclick="yrsYonetKapat()" aria-label="Kapat">✕</button>' : ekD + '<button class="yz-btn" onclick="yrsDuzenle(\'' + yrsE(y.id) + '\')">✏️ Düzenle</button>') + '</div></div>';
    let hero = '<div class="yrs-hero yrs-cn-hero"><div class="yrs-yer">' + (canli ? '🏆 Bugün · ' : '🏆 ') + yrsTarihTR(y.tarih, true) + (y.saat ? ' · ' + yrsEsc(y.saat) : '') + '</div><h2>' + yrsEsc(y.ad) + '</h2><div class="yrs-bilgi">' + [y.mesafe ? '🎯 ' + y.mesafe : '', y.yuz ? '🧾 ' + (YRS_YUZ[y.yuz] || y.yuz) : '', y.kategori ? '🏷 ' + y.kategori : '', '🏹 ' + (+y.ok || 60) + ' ok · ' + N + ' seri'].filter(Boolean).map(function (x) { return '<span>' + yrsEsc(x) + '</span>'; }).join('') + '</div></div>';
    let tiles = '<div class="yrs-cn-tiles"><div><b>' + girdi.length + '<small>/' + sat.length + '</small></b><span>SONUÇ</span></div><div><b>' + (ortTop || '–') + '</b><span>KULÜP ORT.</span></div><div><b class="' + (dusen ? 'dus' : '') + '">' + dusen + '</b><span>ANTRENMANIN ALTINDA</span></div>' + (canli ? '<div><b class="' + (simdi ? 'ok' : '') + '">' + simdi + '</b><span>ŞU AN ATIYOR</span></div>' : '') + '</div>';
    if (!sat.length) return bas + hero + '<div class="yrs-kart yrs-alt">Bu yarışmaya sporcu eklenmemiş. ✏️ Düzenle → sporcu seç.</div>';
    let th = ''; for (let i = 0; i < N; i++) th += '<th>' + (i + 1) + '</th>';
    let satir = sat.map(function (s) {
        let td = ''; for (let i = 0; i < N; i++) { let v = s.st[i]; if (v == null) td += '<td class="bos"></td>'; else { let r = yrsHucreRenk(v, seriOk); td += '<td style="background:' + r[0] + ';color:' + r[1] + '" title="' + (i + 1) + '. seri: ' + (s.m.seriler[i] || []).join(' ') + '">' + v + '</td>'; } }
        let simdiAt = s.son && Date.now() - s.son < 4 * 60000 && !s.m.bitti;
        return '<tr class="' + (_yrs.canliSec === s.k ? 'sec' : '') + (s.atilan ? '' : ' girmedi') + '"><td class="ad"><button onclick="yrsCanliSec(\'' + yrsE(s.k) + '\')">' + (simdiAt ? '<i class="yrs-nabiz" title="Şu an atıyor"></i>' : s.m.bitti ? '🏁 ' : '') + (s.sonuc && s.sonuc.madalya ? s.sonuc.madalya + ' ' : '') + yrsEsc(s.ad) + '</button></td>' + td
            + '<td class="top">' + (s.veri ? '<b>' + s.top + '</b>' + (s.resmi && s.resmi.puan ? '<small class="yrs-resmi-et">resmi' + (s.atilan && +s.resmi.puan !== s.uygTop ? ' · ⚠ ' + s.uygTop : '') + '</small>' : s.atilan && !s.m.bitti ? '<small>' + s.st.length + '/' + N + '</small>' : '') : (y.tarih <= bugun && !salt ? '<button class="yrs-sen-gir" onclick="yrsGirisAc(\'' + yrsE(y.id + '|' + s.k) + '\')">✏️ Gir</button>' : '—')) + '</td><td class="fk">' + yrsFarkHTML(s.fark) + '</td></tr>';
    }).join('');
    var tablo = '<div class="yrs-kart"><span class="yrs-etk">Seri ısı haritası · koyu yeşil = seri başı ' + Math.ceil(seriOk * 8) + '+ · koyu kırmızı = ' + Math.floor(seriOk * 2.7) + ' ve altı · ± = antrenman ortalamasına göre</span><div class="yrs-isi-kap"><table class="yrs-isi"><thead><tr><th class="ad"></th>' + th + '<th>TOP</th><th>±</th></tr></thead><tbody>' + satir + '</tbody></table></div><div class="yrs-alt" style="margin-top:6px">İsme dokun → seri dökümü' + (canli ? ' · sporcu seriyi kaydedince kutu dolar' : '') + '</div></div>';
    let sec = _yrs.canliSec && sat.find(function (s) { return s.k === _yrs.canliSec; });
    let detay = sec ? yrsCanliDetayHTML(y, sec, N) : '';
    if (yrsDarMi()) { tablo = '<div class="yrs-kartlar">' + sat.map(function (s) { return yrsSporcuKartHTML(y, s, N, salt) + (sec === s ? detay : ''); }).join('') + '</div>'; detay = ''; }
    let dk = yrsDikkat(y, sat), dikkat = '<div class="yrs-kart"><span class="yrs-etk">⚡ Dikkat</span>' + (dk.length ? dk.map(function (u) { return '<div class="yrs-uyari"><em>' + u[1] + '</em><span>' + u[2] + (u[3] && !_yrs.salt ? ' · <button class="yrs-link" onclick="yrsGirisAc(\'' + yrsE(y.id + '|' + u[3]) + '\')">sen gir</button>' : '') + '</span></div>'; }).join('') : '<div class="yrs-alt">' + (girdi.length ? 'Belirgin düşüş yok.' : 'Seriler girildikçe düşüş/yükseliş burada çıkar.') + '</div>') + '</div>';
    let kulupSt = []; for (let i = 0; i < N; i++) { let v = sat.filter(function (s) { return s.st[i] != null; }).map(function (s) { return s.st[i]; }); if (v.length) kulupSt.push(Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10); }
    let kulup = kulupSt.length ? '<div class="yrs-kart"><span class="yrs-etk">Kulüp seri ortalaması</span>' + yrsSeriBarSVG(kulupSt, seriOk, 320, 90) + '<div class="yrs-alt">Her seride sporcuların ortalaması · kesik çizgi = genel ortalama</div></div>' : '';
    let resmiDuz = !salt && _yrs.resmiDuz === y.id ? yrsResmiHTML(y, sat) : '';
    return bas + hero + tiles + resmiDuz + tablo + detay + '<div class="yrs-cn-ikili">' + (yrsDarMi() ? '' : dikkat) + kulup + '</div>';
}
function yrsCanliDetayHTML(y, s, N) {
    let n = s.st.length, kap = '<button class="yz-btn" onclick="yrsCanliSec(null)" aria-label="Kapat">✕</button>';
    let gir = y.tarih <= yrsBugun() && !s.m.bitti && !_yrs.salt ? '<button class="yz-btn" onclick="yrsGirisAc(\'' + yrsE(y.id + '|' + s.k) + '\')">✏️ ' + (n ? 'Seri ekle / düzelt' : 'Skor gir') + '</button>' : '';
    let ust = '<div class="yrs-bas"><span class="yrs-etk">📋 ' + yrsEsc(s.ad) + (s.m.bitti ? ' · 🏁 bitti' : n ? ' · ' + n + '/' + N + ' seri' : '') + '</span><span style="display:flex;gap:6px">' + gir + kap + '</span></div>';
    if (!n) return '<div class="yrs-kart yrs-cn-detay">' + ust + '<div class="yrs-alt">' + (s.sonuc && s.sonuc.puan ? 'Yalnız sonuç girilmiş: ' + s.sonuc.puan + ' puan.' : 'Henüz seri girilmedi.') + '</div></div>';
    let h = n >> 1, y1 = s.st.slice(0, h).reduce(function (a, b) { return a + b; }, 0), y2 = s.st.slice(h).reduce(function (a, b) { return a + b; }, 0);
    let say = function (k) { return s.m.seriler.reduce(function (a, q) { return a + q.filter(function (p) { return p === k; }).length; }, 0); };
    let puanlar = (y.yuz === '10' ? ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'] : ['X', '10', '9', '8', '7', '6', '5', 'M']).filter(function (k) { return say(k) || k === 'M' || k === '10'; });
    let dag = '<div class="yrs-cn-dag">' + puanlar.map(function (k) { let v = yrsDeger(k); return '<span class="' + (k === 'M' ? 'm' : v >= 9 ? 's' : v >= 7 ? 'k' : v >= 5 ? 'b' : 'y') + '">' + k + '<b>' + say(k) + '</b></span>'; }).join('') + '</div>';
    let yari = n >= 4 ? '<div class="yrs-cn-yari"><div><b>' + y1 + '</b><small>1–' + h + '. SERİ</small></div><div><b class="' + (y2 / (n - h) > y1 / h ? 'ok' : y2 / (n - h) < y1 / h ? 'dus' : '') + '">' + y2 + '</b><small>' + (h + 1) + '–' + n + '. SERİ</small></div><div><b>' + (s.top / s.atilan).toFixed(2).replace('.', ',') + '</b><small>OK ORT.</small></div><div><b>' + (s.bek != null ? s.bek.toFixed(2).replace('.', ',') : '–') + '</b><small>ANTRENMAN ORT.</small></div></div>' + (function () { let b = yrsBeklenenBilgi(y, s.k); return b ? '<div class="yrs-alt" style="margin-top:4px">Antrenman ortalaması: yarışmadan önceki 30 gün · ' + b.ok + ' ok · ' + b.kaynak + '</div>' : '<div class="yrs-alt" style="margin-top:4px">Antrenman ortalaması için son 30 günde en az 24 ok gerekli.</div>'; })() : '';
    let sonuc = s.sonuc && (s.sonuc.sira || s.sonuc.madalya) ? '<div class="yrs-alt" style="margin-top:6px">🏅 ' + (s.sonuc.madalya || '') + (s.sonuc.sira ? ' ' + s.sonuc.sira + '.' + (s.sonuc.kisi ? ' / ' + s.sonuc.kisi : '') : '') + '</div>' : '';
    let nis = (s.m.nis || []).length ? '<div class="yrs-alt" style="margin-top:6px">🔧 ' + s.m.nis.map(function (q) { return q.seri + '. seriden sonra ' + q.tik + ' tık ' + q.yon; }).join(' · ') + '</div>' : '';
    return '<div class="yrs-kart yrs-cn-detay">' + ust + yrsSeriBarSVG(s.st, s.seriOk, 320, 90) + yari + dag + sonuc + nis + '</div>' + yrsKarneHTML(s.k.split('|')[0], s.k.slice(s.k.indexOf('|') + 1)) + yrsMacGrupHTML(y, s.m).replace('Bugünkü grubun', 'Ok grubu').replace('Yalnız yönü girilen oklar; yaklaşık yerleri.', 'Hedefe dokunarak girilen oklar.');
}
// 📱 Telefon görünümü (v314). Kullanıcı: "telefondan ekrana sığmıyor, sporcuların analizlerini anlık görmem lazım ki yorumlayayım,
// bu sayfa insanı çok zorluyor" → dar ekranda ısı haritası yerine her sporcu bir kart: toplam (resmi), seri / ok ortalaması /
// antrenmana göre, seri şeridi, kendiliğinden yazılan analiz satırları; dokun → seri dökümü kartın altında açılır.
function yrsDarMi() { return window.innerWidth <= 700; }
function yrsSporcuAnaliz(y, s) {
    let t = [], n = s.st.length, seriOk = s.seriOk, N = Math.ceil((+y.ok || 60) / seriOk), esik = seriOk * 0.67, ort = n ? s.st.reduce(function (a, b) { return a + b; }, 0) / n : 0, v = function (x) { return x.toFixed(1).replace('.', ','); };
    if (!n) return t;
    if (n >= 4) { let son = s.st.slice(-3), so = son.reduce(function (a, b) { return a + b; }, 0) / son.length; t.push([so >= ort + esik ? '📈' : so <= ort - esik ? '📉' : '➖', 'Son 3 seri: ' + son.join(', ') + (so >= ort + esik ? ' — yükselişte' : so <= ort - esik ? ' — düşüşte' : ' — ortalamasında') + ' (seri ort. ' + v(ort) + ')']); }
    if (n >= 8) { let h = n >> 1, a = s.st.slice(0, h).reduce(function (p, q) { return p + q; }, 0) / h, b = s.st.slice(h).reduce(function (p, q) { return p + q; }, 0) / (n - h); if (Math.abs(b - a) >= esik) t.push([b > a ? '⬆️' : '⬇️', '2. yarı ' + (b > a ? 'daha iyi' : 'daha zayıf') + ': seri ort. ' + v(a) + ' → ' + v(b) + (b < a ? ' (yorulma / konsantrasyon)' : '')]); }
    let enIyi = Math.max.apply(null, s.st), enIyiI = s.st.indexOf(enIyi);
    let m = s.m.seriler.reduce(function (a, q) { return a + q.filter(function (p) { return p === 'M'; }).length; }, 0), on = s.m.seriler.reduce(function (a, q) { return a + q.filter(function (p) { return p === 'X' || p === '10'; }).length; }, 0);
    t.push(['🎯', 'En iyi seri ' + enIyi + ' (' + (enIyiI + 1) + '.) · ' + on + ' tane 10 · ' + m + ' karavana' + (s.atilan ? ' (%' + Math.round(m / s.atilan * 100) + ')' : '')]);
    let sifir = s.st.map(function (x, i) { return x === 0 ? i + 1 : 0; }).filter(Boolean); if (sifir.length) t.push(['⚠️', sifir.length + ' seride hiç vuramadı: ' + sifir.join('., ') + '.']);
    let hd = (yrsOku('yarisma_hedef')[y.id + '|' + s.k] || {}).hedef;
    if (hd && s.atilan) { let tempo = Math.round(s.uygTop - hd * s.atilan / (+y.ok || 60)); t.push([tempo >= 0 ? '✅' : '⏱', 'Hedef ' + hd + ': temposunun ' + Math.abs(tempo) + ' puan ' + (tempo >= 0 ? 'önünde' : 'gerisinde')]); }
    if (!s.m.bitti && n < N && s.atilan) t.push(['🔮', 'Bu gidişle bitiş ≈ ' + Math.round(s.uygTop + (s.uygTop / s.atilan) * ((+y.ok || 60) - s.atilan))]);
    let tum = []; (s.m.kon || []).forEach(function (sk) { (sk || []).forEach(function (k) { if (k && k.x != null) tum.push(k); }); });
    if (tum.length >= 6) { let mx = tum.reduce(function (a, k) { return a + k.x; }, 0) / tum.length, my = tum.reduce(function (a, k) { return a + k.y; }, 0) / tum.length, cm = Math.hypot(mx, my) * (y.yuz === '3lu' ? 12 : y.yuz === '10' ? 61 : 40); t.push(['🧭', cm < 2 ? 'Ok grubu merkezde (' + tum.length + ' ok)' : 'Ok grubu ~' + Math.round(cm) + ' cm ' + yrsYon(mx, my) + ' → nişangahı biraz ' + yrsYonAl(mx, my) + ' (' + tum.length + ' ok)']); }
    if (s.resmi && s.resmi.puan && s.atilan && +s.resmi.puan !== s.uygTop) t.push(['🧾', 'Resmi ' + s.resmi.puan + ' · uygulamada ' + s.uygTop + ' (fark ' + (+s.resmi.puan - s.uygTop > 0 ? '+' : '') + (+s.resmi.puan - s.uygTop) + ')']);
    return t;
}
function yrsSporcuKartHTML(y, s, N, salt) {
    let n = s.st.length, simdiAt = s.son && Date.now() - s.son < 4 * 60000 && !s.m.bitti, acik = _yrs.canliSec === s.k;
    let durum = simdiAt ? '<span class="yrs-canli-rozet">● atıyor</span>' : s.m.bitti ? '<span class="yrs-sk-bitti">🏁 bitti</span>' : n ? '<span class="yrs-alt">' + n + '/' + N + ' seri</span>' : '';
    let alt = s.atilan ? 'ok ort ' + (s.uygTop / s.atilan).toFixed(2).replace('.', ',') + (s.bek != null ? ' · antr. ' + s.bek.toFixed(2).replace('.', ',') : '') : (s.veri ? 'yalnız sonuç girildi' : 'skor girmedi');
    let serit = n ? '<div class="yrs-sk-serit">' + s.st.map(function (v, i) { let c = yrsHucreRenk(v, s.seriOk); return '<i style="background:' + c[0] + ';color:' + c[1] + '" title="' + (i + 1) + '. seri">' + v + '</i>'; }).join('') + '</div>' : '';
    let an = yrsSporcuAnaliz(y, s), analiz = an.length ? '<div class="yrs-sk-analiz">' + an.map(function (a) { return '<div><span>' + a[0] + '</span><span>' + a[1] + '</span></div>'; }).join('') + '</div>' : '';
    let gir = !s.atilan && !s.veri && y.tarih <= yrsBugun() && !salt ? '<button class="yrs-sen-gir" onclick="event.stopPropagation();yrsGirisAc(' + Q2 + yrsE(y.id + '|' + s.k) + Q2 + ')">✏️ Gir</button>' : '';
    return '<div class="yrs-sk' + (acik ? ' acik' : '') + (simdiAt ? ' canli' : '') + (s.veri ? '' : ' girmedi') + '" role="button" tabindex="0" onclick="yrsCanliSec(' + Q2 + (acik ? '' : yrsE(s.k)) + Q2 + ')">'
        + '<div class="yrs-sk-ust"><span class="yrs-sk-ad"><b>' + (s.sonuc && s.sonuc.madalya ? s.sonuc.madalya + ' ' : '') + yrsEsc(s.ad) + '</b><small>' + alt + '</small></span><span class="yrs-sk-top"><b>' + (s.veri ? s.top : '—') + '</b>' + (s.resmi && s.resmi.puan ? '<small class="yrs-resmi-et">resmi</small>' : '') + yrsFarkHTML(s.fark) + '</span></div>'
        + '<div class="yrs-sk-durum">' + durum + gir + (n ? '<span class="yrs-alt">' + (acik ? '▴ kapat' : '▾ seri dökümü') + '</span>' : '') + '</div>' + serit + analiz + '</div>';
}
function yrsCanliSec(k) { _yrs.canliSec = k ? yrsD(k) : null; yrsYonetCiz(); }
// dar ↔ geniş geçişte (telefon döndürme) yeniden çiz
(function () { let dar = null; window.addEventListener('resize', function () { let d = window.innerWidth <= 700; if (dar !== null && d !== dar && document.getElementById('yrs-yonet')) yrsYonetCiz(); dar = d; }); })();
function yrsCanliAc(id) { _yrs.canli = yrsD(id); _yrs.canliSec = null; _yrs.duzenle = null; yrsYonetCiz(); }
function yrsCanliZamanla() {
    clearInterval(_yrs.canliZ);
    _yrs.canliZ = setInterval(function () {
        let k = document.getElementById('yrs-yonet'), y = _yrs.canli && yrsOku('yarismalar')[_yrs.canli], gunCanli = !_yrs.canli && _yrs.gun === 'bugun';
        if (!k || (!_yrs.canli && !gunCanli)) { clearInterval(_yrs.canliZ); return; }
        if ((!gunCanli && (!y || y.tarih !== yrsBugun())) || (k.classList.contains('yrs-sekme-yonet') && !k.closest('.sekme-icerik.aktif')) || document.hidden) return;
        let once = JSON.stringify(yrsOku('yarisma_sporcu'));
        kyDepoSenkron('yarisma_sporcu', function () { return yrsOku('yarisma_sporcu'); }, false).then(function (t) { if (JSON.stringify(t) !== once && document.getElementById('yrs-yonet') && (_yrs.canli || _yrs.gun) && !_yrs.duzenle) yrsYonetCiz(); }).catch(function () {});
    }, 15000);
}

// 📊 Herkesin yarışma skorları (salt okunur, v311). Kullanıcı (2026-10-25): "PC'den skorları gördüm, telefondan girince yeni
// seri gözüküyor" — telefon sporcu hesabıyla açıktı, sporcu görünümü yalnız kendi seri girişini gösteriyordu. Artık sporcu
// görünümünde de bugünkü / son 10 gündeki yarışmaların canlı ısı haritası açılır (düzenle / gir düğmeleri olmadan).
function yrsSkorKartHTML() {
    let bugun = yrsBugun(), l = yrsListe().filter(function (y) { return y.tarih <= bugun && y.tarih >= yrsGunEkle(bugun, -10) && (y.katilimci || []).length; }).reverse();
    if (!l.length) return '';
    return '<div class="yrs-kart"><span class="yrs-etk">📊 Yarışma skorları · herkes</span><div class="yrs-skor-liste">' + l.slice(0, 4).map(function (y) { return '<button type="button" class="yrs-yar' + (y.tarih === bugun ? ' bugun' : '') + '" onclick="yrsSonuclarAc(\'' + yrsE(y.id) + '\')"><span class="yrs-yar-t"><b>' + yrsTarihTR(y.tarih).split(' ')[0] + '</b>' + yrsTarihTR(y.tarih).split(' ')[1].slice(0, 3) + '</span><span><b>' + (y.tarih === bugun ? '<span class="yrs-canli-rozet">● BUGÜN</span> ' : '') + yrsEsc(y.ad) + '</b><small>' + [y.mesafe, y.kategori, (y.katilimci || []).length + ' sporcu'].filter(Boolean).map(yrsEsc).join(' · ') + '</small></span><span class="yrs-ok">📊</span></button>'; }).join('') + '</div></div>';
}
function yrsSonuclarAc(id) {
    yrsCss();
    let kap = document.getElementById('yrs-yonet'); if (kap) kap.remove();
    kap = document.createElement('div'); kap.id = 'yrs-yonet'; kap.className = 'yrs-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yrsYonetKapat(); }); document.body.appendChild(kap);
    _yrs.salt = true; _yrs.canli = yrsD(id); _yrs.canliSec = null; _yrs.duzenle = null;
    _yrs.senkron = 0; yrsSenkron(function () { if (document.getElementById('yrs-yonet')) yrsYonetCiz(); });
    yrsYonetCiz();
}

// ---------------------------------------------------------------- 🏅 resmi sonuç · 📄 rapor · 📈 sezon karnesi (v313)
// Kullanıcı "hepsini yap" (2026-10-25, öneriler): (4) eğitmen skor kağıdındaki resmi puan / sıra / madalyayı girer → tabloda
// "resmi" yazar, sporcunun uygulamaya girdiği toplamla farkı Dikkat'e düşer; (3) yarışma raporu tek görsel (PNG/PDF/paylaş,
// WhatsApp metni) — görselde yalnız olumlu öne çıkanlar; (6) sezon karnesi: sporcunun yarışmadan yarışmaya ok ortalaması.
// Resmi sonuç yarisma_hedef[id|k].resmi = {puan, sira, kisi, madalya} — eğitmenin anahtarı, sporcunun yazdığı yerle çakışmaz.
function yrsResmiAc(id) { id = yrsD(id); _yrs.resmiDuz = _yrs.resmiDuz === id ? null : id; yrsYonetCiz(); }
function yrsResmiHTML(y, sat) {
    let kisi = sat.map(function (s) { return s.resmi && s.resmi.kisi; }).filter(Boolean)[0] || '';
    let satir = sat.map(function (s) {
        let rs = s.resmi || {}, md = rs.madalya || '';
        return '<tr data-k="' + yrsE(s.k) + '"><td class="ad">' + yrsEsc(s.ad) + '</td><td class="uyg">' + (s.atilan ? s.uygTop : '—') + '</td>'
            + '<td><input class="r-puan" inputmode="numeric" value="' + (rs.puan != null ? rs.puan : '') + '" placeholder="' + (s.atilan ? s.uygTop : '') + '" aria-label="' + yrsEsc(s.ad) + ' resmi puan"></td>'
            + '<td><input class="r-sira" inputmode="numeric" value="' + (rs.sira || '') + '" aria-label="' + yrsEsc(s.ad) + ' sıra"></td>'
            + '<td><select class="r-mad" aria-label="' + yrsEsc(s.ad) + ' madalya">' + ['', '🥇', '🥈', '🥉'].map(function (m) { return '<option value="' + m + '"' + (m === md ? ' selected' : '') + '>' + (m || '—') + '</option>'; }).join('') + '</select></td></tr>';
    }).join('');
    return '<div class="yrs-kart yrs-cn-detay yrs-resmi" data-id="' + yrsE(y.id) + '"><div class="yrs-bas"><span class="yrs-etk">🏅 Resmi sonuçlar · skor kağıdından</span><button class="yz-btn" onclick="yrsResmiAc(\'' + yrsE(y.id) + '\')" aria-label="Kapat">✕</button></div>'
        + '<div class="yrs-alt">Puanı boş bırakırsan sporcunun uygulamaya girdiği toplam geçerli olur. Resmi puan farklıysa Dikkat kutusu uyarır.</div>'
        + '<div class="yrs-resmi-kisi">Kategoride kaç kişi <input class="r-kisi" inputmode="numeric" value="' + kisi + '" aria-label="Kategoride kaç kişi"></div>'
        + '<div class="yrs-isi-kap"><table class="yrs-resmi-tablo"><thead><tr><th>Sporcu</th><th>Uygulama</th><th>Resmi puan</th><th>Sıra</th><th>Madalya</th></tr></thead><tbody>' + satir + '</tbody></table></div>'
        + '<button class="yrs-ana-btn" onclick="yrsResmiKaydet(\'' + yrsE(y.id) + '\')">💾 Resmi sonuçları kaydet</button></div>';
}
function yrsResmiKaydet(id) {
    id = yrsD(id);
    let kart = document.querySelector('.yrs-resmi[data-id="' + yrsE(id) + '"]'); if (!kart) return;
    let hd = yrsOku('yarisma_hedef'), o = {}, kisi = parseInt((kart.querySelector('.r-kisi') || {}).value, 10) || null, n = 0;
    kart.querySelectorAll('tbody tr').forEach(function (tr) {
        let k = yrsD(tr.dataset.k), a = id + '|' + k, puan = parseInt(tr.querySelector('.r-puan').value, 10), sira = parseInt(tr.querySelector('.r-sira').value, 10), md = tr.querySelector('.r-mad').value;
        let resmi = (!isNaN(puan) || !isNaN(sira) || md) ? { puan: isNaN(puan) ? null : puan, sira: isNaN(sira) ? null : sira, kisi: kisi, madalya: md } : null;
        let eski = (hd[a] || {}).resmi || null;
        if (JSON.stringify(eski) === JSON.stringify(resmi)) return;
        o[a] = Object.assign({}, hd[a] || {}, { resmi: resmi }); n++;
    });
    if (n) yrsYaz('yarisma_hedef', o);
    _yrs.resmiDuz = null; yrsYonetCiz();
    if (typeof showToast === 'function') showToast(n ? '🏅 ' + n + ' sporcunun resmi sonucu kaydedildi' : 'Değişiklik yok', n ? 'success' : 'info');
}

// 📄 Rapor: 1080 px genişlikte tek görsel (WhatsApp'ta net görünür) → paylaş / PNG / PDF; ayrıca düz metin özeti.
function yrsRaporOneCikan(y, sat) {
    let t = [], esik = (+y.seriOk || 3) * 0.67;
    if (sat[0]) t.push(['🏆', 'En yüksek puan: ' + yrsKisaAd(sat[0].ad) + ' · ' + sat[0].top]);
    let enSeri = null; sat.forEach(function (s) { s.st.forEach(function (v, i) { if (!enSeri || v > enSeri.v) enSeri = { v: v, i: i, s: s }; }); });
    if (enSeri) t.push(['🔥', 'En iyi seri: ' + yrsKisaAd(enSeri.s.ad) + ' · ' + enSeri.v + ' puan (' + (enSeri.i + 1) + '. seri)']);
    let yuk = sat.filter(function (s) { let n = s.st.length; if (n < 8) return false; let h = n >> 1; return s.st.slice(h).reduce(function (a, b) { return a + b; }, 0) / (n - h) - s.st.slice(0, h).reduce(function (a, b) { return a + b; }, 0) / h >= esik; });
    if (yuk.length) t.push(['📈', '2. yarıda yükselen: ' + yuk.map(function (s) { return yrsKisaAd(s.ad); }).join(', ')]);
    let ust = sat.filter(function (s) { return s.fark != null && s.fark > 0; });
    if (ust.length) t.push(['✅', 'Antrenman ortalamasının üstünde: ' + ust.map(function (s) { return yrsKisaAd(s.ad); }).join(', ')]);
    let onlar = sat.map(function (s) { return { s: s, n: s.m.seriler.reduce(function (a, q) { return a + q.filter(function (p) { return p === 'X' || p === '10'; }).length; }, 0) }; }).sort(function (a, b) { return b.n - a.n; })[0];
    if (onlar && onlar.n) t.push(['🎯', 'En çok 10: ' + yrsKisaAd(onlar.s.ad) + ' · ' + onlar.n + ' ok']);
    let mad = sat.filter(function (s) { return s.sonuc && s.sonuc.madalya; });
    if (mad.length) t.unshift(['🏅', 'Madalya: ' + mad.map(function (s) { return s.sonuc.madalya + ' ' + yrsKisaAd(s.ad); }).join(', ')]);
    return t;
}
function yrsKisaAd(ad) { let p = String(ad || '').split(/\s+/).filter(Boolean); let b = function (x) { return x.charAt(0) + x.slice(1).toLocaleLowerCase('tr-TR'); }; return p.length > 1 ? b(p[0]) + ' ' + p[p.length - 1].charAt(0) + '.' : b(p[0] || ''); }
function yrsRaporCiz(y) {
    let sat = yrsSatirlar(y).filter(function (s) { return s.veri; }), seriOk = +y.seriOk || 3, N = Math.ceil((+y.ok || 60) / seriOk), one = yrsRaporOneCikan(y, sat);
    let W = 1080, P = 48, satH = 84, c = document.createElement('canvas'), g = c.getContext('2d'), F = function (w, px) { return w + ' ' + px + 'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'; };
    // başlık satır sayısı üst bandın yüksekliğini belirler (tek satırda boşluk kalmasın); K = alttaki her şeyin kayması
    g.font = F(900, 52);
    let kel = String(y.ad || 'Yarışma').trim().split(/\s+/), sat1 = '', satirlar = [];
    kel.forEach(function (w) { let d = sat1 ? sat1 + ' ' + w : w; if (g.measureText(d).width > W - 2 * P && sat1) { satirlar.push(sat1); sat1 = w; } else sat1 = d; }); if (sat1) satirlar.push(sat1);
    let UST = 145 + (Math.min(2, satirlar.length) - 1) * 62 + 100, K = UST - 330;
    let H = UST + 150 + 60 + Math.max(1, sat.length) * satH + (one.length ? 90 + one.length * 52 : 0) + 100;
    c.width = W; c.height = H;
    let kutu = function (x, yy, w, h, r, dolgu, cizgi) { g.beginPath(); if (g.roundRect) g.roundRect(x, yy, w, h, r); else g.rect(x, yy, w, h); g.fillStyle = dolgu; g.fill(); if (cizgi) { g.strokeStyle = cizgi; g.lineWidth = 2; g.stroke(); } };
    let kes = function (metin, gen) { metin = String(metin); if (g.measureText(metin).width <= gen) return metin; while (metin.length > 1 && g.measureText(metin + '…').width > gen) metin = metin.slice(0, -1); return metin + '…'; };
    g.fillStyle = '#140e0a'; g.fillRect(0, 0, W, H);
    let gr = g.createLinearGradient(0, 0, W, UST); gr.addColorStop(0, '#5a2e0e'); gr.addColorStop(1, '#1d110a'); g.fillStyle = gr; g.fillRect(0, 0, W, UST);
    g.fillStyle = '#fd8e01'; g.font = F(800, 26); g.fillText('DAĞ OKÇULUK · YARIŞMA RAPORU', P, 72);
    g.fillStyle = '#fbeee3'; g.font = F(900, 52);
    satirlar.slice(0, 2).forEach(function (l, i) { g.fillText(i === 1 && satirlar.length > 2 ? kes(l + ' ' + satirlar.slice(2).join(' '), W - 2 * P) : l, P, 145 + i * 62); });
    g.fillStyle = '#d8c4b2'; g.font = F(600, 27); g.fillText(kes([yrsTarihTR(y.tarih, true), y.mesafe, YRS_YUZ[y.yuz] || '', y.kategori, (+y.ok || 60) + ' ok'].filter(Boolean).join(' · '), W - 2 * P), P, UST - 42);
    let ort = sat.length ? Math.round(sat.reduce(function (a, s) { return a + s.top; }, 0) / sat.length) : 0, tw = (W - 2 * P - 32) / 3;
    [['KATILAN', sat.length], ['KULÜP ORTALAMASI', ort || '–'], ['EN YÜKSEK', sat[0] ? sat[0].top : '–']].forEach(function (t, i) {
        let x = P + i * (tw + 16); kutu(x, 360 + K, tw, 116, 18, '#1d140e', '#3a2a1e');
        g.textAlign = 'center'; g.fillStyle = '#fbeee3'; g.font = F(900, 50); g.fillText(String(t[1]), x + tw / 2, 425 + K); g.fillStyle = '#b9a493'; g.font = F(800, 19); g.fillText(t[0], x + tw / 2, 460 + K); g.textAlign = 'left';
    });
    let y0 = 520 + K; g.fillStyle = '#b9a493'; g.font = F(800, 19); g.fillText('SIRA', P + 8, y0); g.fillText('SPORCU', P + 86, y0); g.fillText('SERİLER', 470, y0); g.textAlign = 'right'; g.fillText('TOPLAM', W - P - 16, y0); g.textAlign = 'left';
    let alanX = 470, alanW = W - P - 150 - alanX, hw = Math.max(4, Math.min(22, alanW / N - 3));
    sat.forEach(function (s, i) {
        let yy = y0 + 18 + i * satH; kutu(P, yy, W - 2 * P, satH - 10, 14, i % 2 ? '#1a120c' : '#21160f');
        let orta = yy + (satH - 10) / 2;
        g.fillStyle = '#fbeee3'; g.font = F(900, 32); g.textAlign = 'center'; g.fillText(s.sonuc && s.sonuc.madalya ? s.sonuc.madalya : (s.sonuc && s.sonuc.sira ? s.sonuc.sira + '.' : String(i + 1)), P + 36, orta + 11); g.textAlign = 'left';
        g.font = F(800, 29); g.fillText(kes(yrsKisaAd(s.ad), alanX - P - 100), P + 86, orta + 2);
        g.fillStyle = '#b9a493'; g.font = F(600, 19); g.fillText(kes((s.atilan ? 'ok ort ' + (s.uygTop / s.atilan).toFixed(2).replace('.', ',') : 'yalnız sonuç') + (s.resmi && s.resmi.puan ? ' · resmi' : ''), alanX - P - 100), P + 86, orta + 28);
        for (let j = 0; j < N; j++) { let v = s.st[j], x = alanX + j * (hw + 3); if (v == null) { g.fillStyle = 'rgba(255,255,255,.06)'; } else g.fillStyle = yrsHucreRenk(v, seriOk)[0]; g.fillRect(x, orta - 15, hw, 30); }
        g.textAlign = 'right'; g.fillStyle = '#fbeee3'; g.font = F(900, 38); g.fillText(String(s.top), W - P - 16, orta + 13); g.textAlign = 'left';
    });
    if (!sat.length) { g.fillStyle = '#b9a493'; g.font = F(600, 26); g.fillText('Henüz skor girilmedi.', P, y0 + 60); }
    let yh = y0 + 18 + Math.max(1, sat.length) * satH + 40;
    if (one.length) {
        g.fillStyle = '#fd8e01'; g.font = F(800, 24); g.fillText('ÖNE ÇIKANLAR', P, yh); yh += 20;
        one.forEach(function (o, i) { let yy = yh + i * 52; kutu(P, yy, W - 2 * P, 44, 12, '#1d140e'); g.fillStyle = '#fbeee3'; g.font = F(600, 24); g.fillText(kes(o[0] + '  ' + o[1], W - 2 * P - 30), P + 16, yy + 30); });
        yh += one.length * 52 + 10;
    }
    g.fillStyle = '#b9a493'; g.font = F(600, 20); g.fillText(kes('Kutular = seri puanı: koyu yeşil en iyi seriler', W - 2 * P), P, H - 50);
    g.fillText('DAĞ Okçuluk · ' + yrsTarihTR(yrsBugun()), P, H - 20);
    return c;
}
function yrsRaporMetinYap(y) {
    let sat = yrsSatirlar(y).filter(function (s) { return s.veri; }), one = yrsRaporOneCikan(y, sat);
    return '🏆 ' + String(y.ad || '').trim() + '\n📅 ' + [yrsTarihTR(y.tarih, true), y.mesafe, y.kategori].filter(Boolean).join(' · ') + '\n\n'
        + sat.map(function (s, i) { return (s.sonuc && s.sonuc.madalya ? s.sonuc.madalya : (s.sonuc && s.sonuc.sira ? s.sonuc.sira : i + 1) + '.') + ' ' + yrsKisaAd(s.ad) + ' — ' + s.top; }).join('\n')
        + (one.length ? '\n\n' + one.map(function (o) { return o[0] + ' ' + o[1]; }).join('\n') : '') + '\n\nTebrikler sporcularımıza! 🏹 DAĞ Okçuluk';
}
function yrsRaporAc(id) {
    let y = yrsOku('yarismalar')[yrsD(id)]; if (!y) return;
    yrsCss();
    let c = yrsRaporCiz(y); _yrs.rapor = { c: c, y: y };
    let m = document.getElementById('yrs-rapor'); if (m) m.remove();
    m = document.createElement('div'); m.id = 'yrs-rapor'; m.className = 'yrs-arka'; m.style.zIndex = '33500';
    m.addEventListener('click', function (e) { if (e.target === m) yrsRaporKapat(); });
    m.innerHTML = '<div class="yrs-pen yrs-rapor-pen" role="dialog" aria-modal="true" aria-label="Yarışma raporu"><div class="yrs-pen-bas"><b>📄 Yarışma raporu</b><button class="yz-btn" onclick="yrsRaporKapat()" aria-label="Kapat">✕</button></div>'
        + '<img class="yrs-rapor-img" src="' + c.toDataURL('image/png') + '" alt="Yarışma raporu">'
        + '<div class="yrs-rapor-btn"><button class="yrs-ana-btn" style="margin:0" onclick="yrsRaporPaylas()">📲 Paylaş</button><button class="yz-btn" onclick="yrsRaporPdf()">📄 PDF</button><button class="yz-btn" onclick="yrsRaporPng()">⬇️ PNG indir</button><button class="yz-btn" onclick="yrsRaporMetin()">💬 WhatsApp metni</button></div>'
        + '<div class="yrs-alt">Görselde yalnız olumlu öne çıkanlar var; düşüşler uygulamadaki Dikkat kutusunda kalır.</div></div>';
    (document.fullscreenElement || document.body).appendChild(m);
}
function yrsRaporKapat() { let m = document.getElementById('yrs-rapor'); if (m) m.remove(); _yrs.rapor = null; }
function yrsRaporDosya() { let y = _yrs.rapor && _yrs.rapor.y; return 'Yarisma_Raporu_' + (y ? y.tarih : yrsBugun()); }
function yrsRaporPng() { let r = _yrs.rapor; if (!r) return; let a = document.createElement('a'); a.download = yrsRaporDosya() + '.png'; a.href = r.c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }
async function yrsRaporPaylas() {
    let r = _yrs.rapor; if (!r) return;
    let metin = yrsRaporMetinYap(r.y);
    try {
        let blob = await new Promise(function (ok) { r.c.toBlob(ok, 'image/png'); }), dosya = new File([blob], yrsRaporDosya() + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [dosya] })) { await navigator.share({ files: [dosya], text: metin }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    yrsRaporPng();
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(metin + '\n(Rapor görseli indirildi — sohbete ekleyebilirsiniz.)'), '_blank');
}
function yrsRaporMetin() { let r = _yrs.rapor; if (!r) return; window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(yrsRaporMetinYap(r.y)), '_blank'); }
async function yrsRaporPdf() {
    let r = _yrs.rapor; if (!r) return;
    if (typeof _yeniPdfAl !== 'function') { if (typeof showToast === 'function') showToast('PDF altyapısı yüklenemedi.', 'error'); return; }
    try {
        let pdf = await _yeniPdfAl('portrait'), w = 210, h = 210 * r.c.height / r.c.width, x = 0;
        if (h > 297) { w = 297 * r.c.width / r.c.height; h = 297; x = (210 - w) / 2; }
        pdf.setFillColor(20, 14, 10); pdf.rect(0, 0, 210, 297, 'F');
        pdf.addImage(r.c.toDataURL('image/jpeg', 0.92), 'JPEG', x, 0, w, h);
        pdf.save(yrsRaporDosya() + '.pdf');
        if (typeof showToast === 'function') showToast('📄 Rapor PDF indirildi', 'success');
    } catch (e) { if (typeof showToast === 'function') showToast('PDF hazırlanamadı.', 'error'); }
}

// 🏆 Yönetici sporcu kartı "Kayıt işlemleri" satırı (2026-10-25). Kullanıcı: "bugün Toprak için atışları göremedim" — kart yalnız
// antrenman serilerini sayıyordu ("0 aktif seri"). Satır son yarışmayı özetler; dokununca o yarışmanın ısı haritası bu sporcu
// açık hâlde gelir.
function yrsSporcuYarismalari(g, ad) { let k = g + '|' + ad, bugun = yrsBugun(); return yrsListe().filter(function (y) { return y.tarih <= bugun && (y.katilimci || []).indexOf(k) !== -1; }).reverse(); }
function yrsKartOzet(g, ad) {
    let l = yrsSporcuYarismalari(g, ad); if (!l.length) return null;
    let y = l[0], m = yrsMacVeri(yrsOku('yarisma_sporcu')[y.id + '|' + g + '|' + ad] || {}), top = m.seriler.reduce(function (a, s) { return a + yrsSeriToplam(s); }, 0);
    return yrsTarihTR(y.tarih) + ' · ' + (m.seriler.length ? m.seriler.length + ' seri, ' + top + ' puan' + (m.bitti ? ' · bitti' : '') : 'sunucuya skor gelmedi') + (l.length > 1 ? ' · toplam ' + l.length + ' yarışma' : '');
}
function yrsKarttanAc(g, ad) {
    let l = yrsSporcuYarismalari(g, ad); if (!l.length) return;
    let t = document.querySelector('#icerik-yarisma .yrs-sekme-yonet'); if (t) t.remove(); // sekmedeki #yrs-yonet ile aynı id çakışmasın
    _yrs.egitmen = true; yrsYonetAc();
    _yrs.canli = l[0].id; _yrs.canliSec = g + '|' + ad; yrsYonetCiz();
}

// 📈 Sezon karnesi: sporcunun katıldığı yarışmalar (resmi puan > sonuç > uygulama toplamı), ok ortalaması çizgisi + antrenman
// ortalaması (kesik) + liste. Sporcu profilinde (ekPanel), Benim skorum'da ve canlı tablodaki seri dökümünde görünür.
function yrsKarneVeri(g, ad) {
    let k = g + '|' + ad, bugun = yrsBugun(), sp = yrsOku('yarisma_sporcu'), hd = yrsOku('yarisma_hedef');
    return yrsListe().filter(function (y) { return y.tarih <= bugun && (y.katilimci || []).indexOf(k) !== -1; }).map(function (y) {
        let d = sp[y.id + '|' + k] || {}, m = yrsMacVeri(d), rs = (hd[y.id + '|' + k] || {}).resmi || null;
        let uyg = m.seriler.reduce(function (a, q) { return a + yrsSeriToplam(q); }, 0), okS = m.seriler.reduce(function (a, q) { return a + q.length; }, 0);
        let resmiVar = rs && rs.puan != null && rs.puan !== '', puan = resmiVar ? +rs.puan : (d.sonuc && d.sonuc.puan ? +d.sonuc.puan : (okS ? uyg : null));
        if (puan == null) return null;
        let ok = resmiVar || !okS ? (+y.ok || 60) : okS;
        return { y: y, puan: puan, ort: puan / ok, bek: yrsBeklenenOrt(y, k), sira: (rs && rs.sira) || (d.sonuc || {}).sira, kisi: (rs && rs.kisi) || (d.sonuc || {}).kisi, madalya: (rs && rs.madalya) || (d.sonuc || {}).madalya, resmi: resmiVar };
    }).filter(Boolean);
}
function yrsKarneHTML(g, ad) {
    yrsCss();
    let l = yrsKarneVeri(g, ad); if (!l.length) return '';
    let grafik = '';
    if (l.length >= 2) {
        let W = 320, H = 120, deg = l.map(function (x) { return x.ort; }).concat(l.map(function (x) { return x.bek; }).filter(function (v) { return v != null; }));
        let mn = Math.floor(Math.min.apply(null, deg)) - 0.5, mx = Math.ceil(Math.max.apply(null, deg)) + 0.5, dx = (W - 40) / (l.length - 1), yy = function (v) { return H - 22 - (v - mn) / (mx - mn) * (H - 36); };
        grafik = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Yarışmalara göre ok ortalaması">';
        [mn + 0.5, (mn + mx) / 2, mx - 0.5].forEach(function (v) { grafik += '<line x1="22" x2="' + W + '" y1="' + yy(v) + '" y2="' + yy(v) + '" stroke="currentColor" stroke-opacity=".12"/><text x="0" y="' + (yy(v) + 3) + '" font-size="9" fill="currentColor" fill-opacity=".55">' + v.toFixed(1).replace('.', ',') + '</text>'; });
        let bekN = l.map(function (x, i) { return x.bek != null ? (30 + i * dx) + ',' + yy(x.bek) : null; }).filter(Boolean);
        if (bekN.length >= 2) grafik += '<polyline points="' + bekN.join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="4 4" stroke-width="1.5"/>';
        grafik += '<polyline points="' + l.map(function (x, i) { return (30 + i * dx) + ',' + yy(x.ort); }).join(' ') + '" fill="none" stroke="#fd8e01" stroke-width="2.5"/>';
        l.forEach(function (x, i) { grafik += '<circle cx="' + (30 + i * dx) + '" cy="' + yy(x.ort) + '" r="4.5" fill="#fd8e01"><title>' + yrsEsc(x.y.ad) + ': ' + x.ort.toFixed(2) + '</title></circle><text x="' + (30 + i * dx) + '" y="' + (H - 6) + '" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity=".6">' + yrsTarihTR(x.y.tarih).split(' ').slice(0, 2).map(function (p, j) { return j ? p.slice(0, 3) : p; }).join(' ') + '</text>'; });
        grafik += '</svg><div class="yrs-alt">Turuncu = yarışmadaki ok ortalaması · kesik = o yarışmadan önceki antrenman ortalaması</div>';
    }
    let liste = l.slice().reverse().map(function (x) {
        let fk = x.bek != null ? x.ort - x.bek : null;
        return '<div><span><b style="font-size:13px">' + yrsEsc(String(x.y.ad || '').trim()) + '</b><small>' + yrsTarihTR(x.y.tarih) + (x.y.mesafe ? ' · ' + yrsEsc(x.y.mesafe) : '') + ' · ok ort ' + x.ort.toFixed(2).replace('.', ',') + (fk != null ? ' <span class="yrs-f ' + (fk >= 0.15 ? 'ok' : fk <= -0.15 ? 'dus' : 'notr') + '">' + (fk >= 0 ? '▲' : '▼') + ' antr. ' + x.bek.toFixed(2).replace('.', ',') + '</span>' : '') + (x.resmi ? ' · resmi' : '') + '</small></span><span>' + (x.madalya || '') + (x.sira ? ' ' + x.sira + '.' + (x.kisi ? '/' + x.kisi : '') : '') + '</span><b>' + x.puan + '</b></div>';
    }).join('');
    return '<div class="yrs-kart yrs-karne"><span class="yrs-etk">📈 Sezon karnesi · ' + l.length + ' yarışma</span>' + grafik + '<div class="yrs-karne-l">' + liste + '</div></div>';
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
        '.yrs-slot-yer{display:grid;justify-items:center;gap:2px}.yrs-slot-yer small{font-size:10px;font-weight:800;color:var(--text-muted)}',
        '.yrs-puanlar button.secili{outline:4px solid #fd8e01;outline-offset:2px}',
        '.yrs-puanlar{gap:7px}.yrs-puanlar button{min-height:72px;font-size:30px;border-radius:14px;-webkit-tap-highlight-color:transparent;user-select:none}.yrs-mac-sayilar div{padding:7px 4px}.yrs-mac-sayilar b{font-size:24px}.yrs-tempo{padding:8px 10px;font-size:14px}.yrs-slotlar{margin:6px 0 10px}',
        '.yrs-mac-alt{justify-content:space-between;gap:8px;flex-wrap:wrap}.yrs-mac-alt .yz-btn{min-height:46px;font-size:14px}.yrs-mac-alt .yrs-geri{flex:1 1 140px}.yrs-yon-anahtar b{font-weight:900}.yrs-yon-anahtar.acik{border-color:#fd8e01;color:#fd8e01}',
        '.yrs-yon-alan{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:center;margin-top:10px}.yrs-yon-alan.uclu{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}',
        '.yrs-yon-kutu{position:relative;display:grid;gap:8px;justify-items:center;text-align:center;padding:10px 8px 14px;border-radius:14px;border:2px dashed var(--border-color)}.yrs-yon-kutu.bekliyor{border-color:#fd8e01;background:rgba(253,142,1,.08)}.yrs-yon-kutu b{font-size:14px}.yrs-yon-kutu small{font-size:11.5px;color:var(--text-muted);line-height:1.35}',
        '.yrs-yon-ped{display:grid;grid-template-columns:repeat(3,52px);gap:5px}.yrs-yon-b{height:48px;border-radius:12px;border:2px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:22px;cursor:pointer;touch-action:manipulation}.yrs-yon-kutu.bekliyor .yrs-yon-b{border-color:#fd8e01}.yrs-yon-b:disabled{opacity:.35}',
        '.yrs-yon-sure{position:absolute;left:10px;right:10px;bottom:5px;height:4px;border-radius:2px;background:#fd8e01;transform-origin:left;animation:yrsSure 1.5s linear forwards}.yrs-yon-sure.uzun{animation-duration:2.5s}@keyframes yrsSure{to{transform:scaleX(0)}}',
        '.yrs-kagit-yer{display:grid;justify-items:center}.yrs-kagit{width:min(100%,220px);height:auto;cursor:pointer;touch-action:manipulation;border-radius:8px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.3))}.yrs-kagit.uclu{width:auto;height:min(380px,50vh);max-width:100%}.yrs-kagit.bekliyor{box-shadow:0 0 0 4px #fd8e01,0 0 22px rgba(253,142,1,.5)}',
        '.yrs-grup-ic{display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:center;margin-top:8px}.yrs-kagit-yer.kucuk .yrs-kagit{width:130px;cursor:default}.yrs-kagit-yer.kucuk .yrs-kagit.uclu{height:220px;width:auto}',
        '@media (prefers-reduced-motion:reduce){.yrs-yon-sure{animation:none}}',
        '.yrs-seri-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px;margin-top:8px}.yrs-seri-izgara div{background:var(--bg-main);border-radius:10px;padding:6px;text-align:center;display:grid}.yrs-seri-izgara small{font-size:10px;color:var(--text-muted);font-weight:800}.yrs-seri-izgara b{font-size:20px;font-weight:900}.yrs-seri-izgara span{font-size:11px;color:var(--text-muted)}.yrs-seri-izgara .iyi b{color:#4ade80}.yrs-seri-izgara .kotu b{color:#f87171}',
        '.yrs-rutin-adim{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.yrs-rutin-adim span{font-size:13px;font-weight:800;padding:7px 10px;border-radius:10px;background:var(--bg-main)}',
        '.yrs-nis-tus{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.yrs-nis-tus button{min-height:44px;border-radius:12px;border:2px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-weight:800;cursor:pointer}.yrs-nis-liste{display:grid;gap:4px;margin-top:8px;font-size:12.5px;color:var(--text-muted);font-weight:700}',
        '.yrs-bitir{background:#22c55e}',
        // v309: Skor Gir yarışma bandı + sporcu "Skor gir" düğmesi
        'body.yrs-giris-acik #hizli-gecis-bar,body.yrs-giris-acik [onclick="seriUzat()"],body.yrs-giris-acik #tavsan-ana-btn{display:none!important}',
        '#yrs-giris-bant{display:grid;gap:6px;margin:0 0 10px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(253,142,1,.28),rgba(253,142,1,.08));border:1px solid rgba(253,142,1,.55);color:var(--text-main)}',
        '.yrs-gb-ust{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.yrs-gb-ust b{font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yrs-gb-ust small{display:block;font-size:12px;color:var(--text-muted);font-weight:700}',
        '.yrs-gon{margin-top:6px;padding:5px 9px;border-radius:9px;font-size:12px;font-weight:800;background:rgba(34,197,94,.14);color:#4ade80}.yrs-gon.gidiyor{background:rgba(148,163,184,.14);color:var(--text-muted)}.yrs-gon.bekliyor{background:rgba(245,158,11,.18);color:#fbbf24}',
        '.yrs-gb-say{text-align:right}.yrs-gb-say b{font-size:26px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}',
        '.yrs-gb-cubuk{height:6px;border-radius:3px;background:rgba(127,127,127,.25);overflow:hidden}.yrs-gb-cubuk i{display:block;height:100%;background:#fd8e01}',
        '.yrs-gb-seriler{display:flex;gap:4px;align-items:center;flex-wrap:wrap}.yrs-gb-seriler span{font-size:12px;font-weight:900;padding:2px 7px;border-radius:7px;background:rgba(0,0,0,.25)}.yrs-gb-seriler small{font-size:10.5px;color:var(--text-muted);font-weight:700}',
        '.yrs-gb-bitir{font:800 13px system-ui,sans-serif;padding:8px;border-radius:10px;border:1px solid #22c55e;background:transparent;color:#22c55e;cursor:pointer}.yrs-gb-bitir.tam{background:#22c55e;color:#04210d;font-size:15px;padding:12px}',
        '.yrs-gir-kart{padding:6px}.yrs-gir-btn{width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;text-align:left;padding:16px 14px;border-radius:14px;border:0;background:#fd8e01;color:#1a0d05;font:inherit;cursor:pointer}.yrs-gir-ikon{font-size:34px}.yrs-gir-btn b{display:block;font-size:19px;font-weight:900}.yrs-gir-btn small{display:block;font-size:12.5px;font-weight:700;opacity:.8}.yrs-gir-ok{font-size:28px;font-weight:900}',
        // v309: eğitmen sekmesi + canlı ısı haritası
        '.yrs-sekme-yonet{padding:12px 12px 90px;overflow-x:hidden}.yrs-pen-sekme{width:min(1100px,100%);margin:0 auto;box-shadow:none;border:0;background:transparent;padding:0}',
        '.yrs-pen{grid-template-columns:minmax(0,1fr);min-width:0}.yrs-pen>*{min-width:0}',
        // Yarışma (KM) modülü yüklenmeden sekme açılınca .yz-btn/.yz-cip stilsiz kalmasın (aynı görünüm)
        '.yrs-pen .yz-btn{border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);border-radius:12px;padding:0 14px;min-height:42px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}',
        '.yrs-pen .yz-cip{border:1px solid var(--border-color);background:transparent;color:var(--text-muted);border-radius:999px;padding:0 13px;min-height:38px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
        '.yrs-skor-liste{display:grid;gap:6px;margin-top:6px}',
        // v313 resmi sonuç · rapor · sezon karnesi
        '.yrs-resmi-et{display:block;font-size:9.5px!important;color:#fd8e01!important;font-weight:800;white-space:nowrap}',
        '.yrs-resmi-tablo{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}.yrs-resmi-tablo th{font-size:10px;color:var(--text-muted);text-align:left;font-weight:800;padding:4px}.yrs-resmi-tablo td{padding:4px;border-top:1px solid var(--border-color)}.yrs-resmi-tablo input,.yrs-resmi-tablo select,.yrs-resmi-kisi input{font:inherit;font-size:15px;font-weight:800;padding:7px 6px;border-radius:9px;border:2px solid var(--border-color);background:var(--bg-main);color:var(--text-main);width:100%;box-sizing:border-box;min-width:0}',
        '.yrs-resmi-tablo td.ad{font-weight:800;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yrs-resmi-tablo td.uyg{color:var(--text-muted);font-weight:800;text-align:center}.yrs-resmi-kisi{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--text-muted);font-weight:800;margin-top:6px}.yrs-resmi-kisi input{width:80px}',
        '.yrs-rapor-pen{width:min(560px,100%)}.yrs-rapor-img{width:100%;height:auto;border-radius:12px;display:block;border:1px solid var(--border-color)}.yrs-rapor-btn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
        '.yrs-karne svg{width:100%;height:auto;display:block;margin-top:6px;color:var(--text-main)}.yrs-karne-l{display:grid;gap:4px;margin-top:8px}.yrs-karne-l div{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;font-size:12.5px;padding:7px 10px;border-radius:10px;background:var(--bg-main)}.yrs-karne-l small{display:block;color:var(--text-muted);font-size:11px}.yrs-karne-l b{font-size:15px}',
        // v312 açılış + gün görünümü
        '.yrs-acilis{max-width:620px;margin:0 auto;padding:4px 0 90px}.yrs-acilis-soru{font-size:20px;font-weight:900;text-align:center;margin-top:6px}',
        '.yrs-sec-kart{width:100%;display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;padding:14px 12px;border-radius:16px;border:2px solid var(--border-color);background:var(--bg-card);color:var(--text-main);font:inherit;cursor:pointer}',
        '.yrs-sec-kart.ana{border-color:#22c55e;background:linear-gradient(135deg,rgba(34,197,94,.16),var(--bg-card))}.yrs-sec-kart.soluk{opacity:.6}.yrs-sec-ik{font-size:28px;text-align:center}.yrs-sec-kart b{font-size:16px;display:block}.yrs-sec-kart small{display:block;font-size:12px;color:var(--text-muted);line-height:1.45;margin-top:2px}',
        '.yrs-geri-ust{justify-self:start;width:max-content}',
        '.yrs-gun-cip{display:flex;gap:4px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:4px}.yrs-gun-cip button{flex:1;font:inherit;font-size:13px;font-weight:800;padding:9px 2px;border-radius:9px;border:0;background:transparent;color:var(--text-muted);cursor:pointer}.yrs-gun-cip button.akt{background:#fd8e01;color:#1a0d05}',
        '.yrs-gun-blok{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding-bottom:6px;border-bottom:1px dashed var(--border-color)}.yrs-gun-blok>*{min-width:0}.yrs-gun-blok:last-child{border-bottom:0}',
        '.yrs-cn-sag{min-width:0}.yrs-cn-sag .yz-btn{white-space:normal;min-height:40px;padding:0 12px}.yrs-pen-bas{flex-wrap:wrap}.yrs-cn-hero h2{overflow-wrap:anywhere}',
        // v314 telefon sporcu kartları
        '.yrs-kartlar{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.yrs-kartlar>*{min-width:0}.yrs-sk{background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:12px;display:grid;gap:8px;cursor:pointer;min-width:0}.yrs-sk.canli{border-color:rgba(74,222,128,.6)}.yrs-sk.acik{border-color:#fd8e01}.yrs-sk.girmedi{opacity:.7}',
        '.yrs-sk-ust{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.yrs-sk-ad b{display:block;font-size:15px;line-height:1.25;overflow-wrap:anywhere}.yrs-sk-ad small{display:block;font-size:12px;color:var(--text-muted);margin-top:2px}',
        '.yrs-sk-top{display:grid;justify-items:end;gap:1px}.yrs-sk-top b{font-size:28px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}',
        '.yrs-sk-durum{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between}.yrs-sk-bitti{font-size:12px;font-weight:800;color:var(--text-muted)}',
        '.yrs-sk-serit{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px}.yrs-sk-serit i{font-style:normal;text-align:center;font-size:11.5px;font-weight:900;border-radius:5px;padding:4px 0;font-variant-numeric:tabular-nums}',
        '.yrs-sk-analiz{display:grid;gap:4px;font-size:13px;line-height:1.4;padding-top:6px;border-top:1px dashed var(--border-color)}.yrs-sk-analiz div{display:grid;grid-template-columns:22px minmax(0,1fr);gap:4px}',
        '.yrs-yar-sat{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:stretch}.yrs-yar-duz{min-width:48px}.yrs-yar.bugun{border-color:#fd8e01;background:rgba(253,142,1,.1)}',
        '.yrs-canli-rozet{display:inline-block;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;background:rgba(74,222,128,.16);color:#4ade80;letter-spacing:.04em;vertical-align:middle}',
        '.yrs-cn-sag{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.yrs-cn-hero{margin:0}.yrs-cn-hero h2{padding-right:0}',
        '.yrs-cn-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px}.yrs-cn-tiles div{background:var(--bg-main);border:1px solid var(--border-color);border-radius:12px;padding:8px 4px;text-align:center}.yrs-cn-tiles b{display:block;font-size:24px;font-weight:900;line-height:1.1}.yrs-cn-tiles b small{font-size:13px;color:var(--text-muted)}.yrs-cn-tiles span{font-size:10px;font-weight:800;color:var(--text-muted);letter-spacing:.05em}',
        '.yrs-cn-tiles .ok,.yrs-f.ok,.yrs-cn-yari .ok{color:#4ade80}.yrs-cn-tiles .dus,.yrs-f.dus,.yrs-cn-yari .dus{color:#f87171}.yrs-f{font-size:11.5px;font-weight:900;white-space:nowrap}.yrs-f.notr{color:var(--text-muted)}',
        '.yrs-isi-kap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:4px}.yrs-isi{border-collapse:separate;border-spacing:3px;font-size:12.5px;min-width:100%}',
        '.yrs-isi th{font-size:10px;color:var(--text-muted);font-weight:800;padding:0 1px}.yrs-isi td{text-align:center;border-radius:6px;padding:7px 2px;min-width:26px;font-weight:900;font-variant-numeric:tabular-nums}.yrs-isi td.bos{background:rgba(127,127,127,.1)}',
        '.yrs-isi td.ad,.yrs-isi th.ad{position:sticky;left:0;z-index:1;background:var(--bg-card);text-align:left;padding:0 6px 0 0}.yrs-isi td.ad button{font:inherit;font-weight:800;font-size:13px;color:var(--text-main);background:none;border:0;padding:6px 4px;cursor:pointer;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px}',
        '.yrs-isi tr.sec td.ad button{color:#fd8e01}.yrs-isi tr.girmedi td.ad button{opacity:.6}.yrs-isi td.top{background:var(--bg-main);border:1px solid var(--border-color);padding:4px 8px;min-width:52px}.yrs-isi td.top b{font-size:15px;display:block}.yrs-isi td.top small{font-size:10px;color:var(--text-muted)}.yrs-isi td.fk{padding:0 4px}',
        '.yrs-sen-gir{font:800 11.5px system-ui,sans-serif;padding:5px 7px;border-radius:8px;border:1px solid #fd8e01;background:transparent;color:#fd8e01;cursor:pointer;white-space:nowrap}.yrs-link{font:inherit;font-weight:800;color:#fd8e01;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}',
        '.yrs-nabiz{display:inline-block;width:9px;height:9px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:yrsNabiz 1.6s infinite;flex:0 0 auto}@keyframes yrsNabiz{70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}',
        '.yrs-cn-ikili{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;align-items:start}',
        '.yrs-uyari{display:grid;grid-template-columns:26px 1fr;gap:8px;align-items:start;padding:9px 10px;border-radius:12px;background:var(--bg-main);margin-top:6px;font-size:13.5px;line-height:1.4}.yrs-uyari em{font-style:normal;font-size:18px}',
        '.yrs-bar{width:100%;height:120px;display:block;margin-top:6px;color:var(--text-main)}.yrs-cn-detay{border-color:#fd8e01}',
        '.yrs-cn-yari{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.yrs-cn-yari div{background:var(--bg-main);border-radius:10px;padding:7px 4px;text-align:center}.yrs-cn-yari b{display:block;font-size:19px;font-weight:900}.yrs-cn-yari small{font-size:9.5px;color:var(--text-muted);font-weight:800}',
        '.yrs-cn-dag{display:flex;gap:4px;margin-top:8px;flex-wrap:wrap}.yrs-cn-dag span{flex:1 1 34px;text-align:center;font-size:11px;font-weight:900;border-radius:8px;padding:4px 0;display:grid}.yrs-cn-dag b{font-size:14px}',
        '.yrs-cn-dag .s{background:#ffd43b;color:#3d2a00}.yrs-cn-dag .k{background:#ff6b6b;color:#3a0808}.yrs-cn-dag .b{background:#4dabf7;color:#06233d}.yrs-cn-dag .y{background:#343a40;color:#fff}.yrs-cn-dag .m{background:#868e96;color:#fff}',
        '@media (prefers-reduced-motion:reduce){.yrs-nabiz{animation:none}}',
        '@media (max-width:560px){.yrs-cn-yari{grid-template-columns:repeat(2,1fr)}.yrs-sekme-yonet{padding:10px 10px 90px}}',
        '@media (max-width:700px){.yrs-cn-tiles{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.yrs-cn-tiles div{padding:6px 2px}.yrs-cn-tiles b{font-size:18px}.yrs-cn-tiles span{font-size:8.5px;letter-spacing:0;line-height:1.15;display:block}.yrs-cn-hero{padding:10px 12px;border-radius:16px}.yrs-cn-hero h2{font-size:16px;margin:2px 0 4px}.yrs-cn-hero .yrs-bilgi span{font-size:10.5px;padding:3px 7px}.yrs-cn-sag .yz-btn{min-height:36px;font-size:12px;padding:0 9px}}',
        '@media (max-width:560px){.yrs-form{grid-template-columns:1fr}.yrs-sp{grid-template-columns:minmax(0,1fr) 70px auto}}'
    ].join('\n');
    document.head.appendChild(st);
}
window.yrsAnaKart = yrsAnaKart; window.yrsYonetAc = yrsYonetAc; window.yrsSekme = yrsSekme;
