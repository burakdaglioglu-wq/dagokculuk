/* ================================================================================================
   📒 ÖĞRENCİ DEFTERİ + 📝 DERS GÜNLÜĞÜ — DAĞ Okçuluk (2026-10-15, kullanıcı Milo'da istediklerini "aynı zamanda DAĞ
   okçuluğa da yap" dedi; seçimleri: Defter + Sade görünüm, DAĞ'da ödeme AYLIK AİDAT (şimdiki gibi)).
   Yönetici › ANTRENMAN › 📒 Öğrenci Defteri / 📝 Ders Günlüğü. Görünüm Milo ile aynı "A · Sade" (beyaz kâğıt, tek vurgu).
   Kayıtlar (yeni tablo yok):
     · yoklama: otomatikYoklamaDB[tarih][ad] (geldi true/false) → senkron + doğrudan POST; boşalt → DELETE /api/attendance/auto
     · ek durum: meta 'yoklama_durum' { 'YYYY-MM-DD|ad': { d: 'hasta'|'telafi', t } }
     · aidat: aidatDB[ad][ay] — Defter yalnız GÖSTERİR (ödendi/ödenmedi + not, tutar yok); düzenleme Aidat sekmesinde (PIN kilidi)
   TELAFİ (aylık aidat düzeni): gelmediği / hasta olduğu her ders 1 telafi hakkı; telafi dersi hakkı açık en eski aya yazılır.
   Ders günlüğü: meta 'ders_gunlugu' — gruplar (Büyükler…Minikler) ve okçuluk becerileri; haftalık veli metni, aylık PDF.
   ================================================================================================ */
const OD = { secili: null, ay: null, secim: null, ara: '', durum: {}, yuklendi: false };
const OD_DURUM = { g: { ad: 'Geldi', ikon: '✓', cls: 'g' }, y: { ad: 'Gelmedi', ikon: '✕', cls: 'y' }, h: { ad: 'Hasta', ikon: '🤒', cls: 'h' }, t: { ad: 'Telafi', ikon: '↺', cls: 't' } };
const OD_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const OD_GRUPLAR = ['buyukler', 'yildizlar', 'kucukler', 'minikler'];
const OD_GRUP_AD = { buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' };
function odIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function odTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function odKisa(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? +m[3] + ' ' + OD_AY[+m[2] - 1].slice(0, 3) : ''; }
function odEnc(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
function odEsc(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
async function odMeta(k) { try { let r = await fetch('/api/meta/' + k); let d = await r.json(); return d && d.value ? JSON.parse(d.value) : {}; } catch (e) { return {}; } }
async function odMetaYaz(k, yerel) {
    let uzak = await odMeta(k), m = Object.assign({}, uzak);
    Object.keys(yerel).forEach(function (x) { if (!m[x] || (yerel[x].t || 0) >= (m[x].t || 0)) m[x] = yerel[x]; });
    await fetch('/api/meta/' + k, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(m) }) });
    return m;
}
function odSporcular() { let l = []; OD_GRUPLAR.forEach(function (g) { Object.keys(turnuvaDB[g] || {}).forEach(function (ad) { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) l.push({ g: g, ad: ad, sp: sp, k: g + '|' + ad }); }); }); return l.sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); }); }
function odBul(k) { let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1), sp = turnuvaDB[g] && turnuvaDB[g][ad]; return sp ? { g: g, ad: ad, sp: sp, k: k } : null; }
function odGun(u, iso) {
    let a = (otomatikYoklamaDB[iso] || {})[u.ad]; if (!a) return null;
    if (a.grup && a.grup !== u.g && turnuvaDB[a.grup] && turnuvaDB[a.grup][u.ad]) return null;
    let e = OD.durum[iso + '|' + u.ad], d = e && !e.sil ? e.d : null;
    if (a.geldi !== false) return d === 'telafi' ? 't' : 'g';
    return d === 'hasta' ? 'h' : 'y';
}
function odKayitlar(u) { return Object.keys(otomatikYoklamaDB || {}).filter(function (iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) && odGun(u, iso); }).sort().map(function (iso) { return { iso: iso, s: odGun(u, iso) }; }); }
// Aylara göre: telafi hakkı = gelmedi + hasta; telafi dersi hakkı açık EN ESKİ aya yazılır.
function odAylar(u) {
    let A = {}, sira = [];
    let ay = function (a) { if (!A[a]) { A[a] = { ay: a, dersler: [], telafiler: [], hak: 0 }; sira.push(a); } return A[a]; };
    odKayitlar(u).forEach(function (r) {
        let m = ay(r.iso.slice(0, 7));
        if (r.s === 't') { let hedef = sira.map(function (x) { return A[x]; }).find(function (x) { return x.hak > x.telafiler.length; }) || m; hedef.telafiler.push(r); return; }
        m.dersler.push(r); if (r.s === 'y' || r.s === 'h') m.hak++;
    });
    sira.sort(); return sira.map(function (a) { let x = A[a]; x.geldi = x.dersler.filter(function (r) { return r.s === 'g'; }).length + x.telafiler.length; x.kalanHak = Math.max(0, x.hak - x.telafiler.length); return x; });
}
function odOzet(u) {
    let k = odKayitlar(u), say = { g: 0, y: 0, h: 0, t: 0 }; k.forEach(function (r) { say[r.s]++; });
    let aylar = odAylar(u), hak = aylar.reduce(function (a, x) { return a + x.kalanHak; }, 0), buAy = odIso(new Date()).slice(0, 7), uyarilar = [];
    aylar.forEach(function (x) { if (x.kalanHak && x.ay < buAy) uyarilar.push({ tur: 'telafi', metin: OD_AY[+x.ay.slice(5) - 1] + ': ' + x.kalanHak + ' telafi hakkı kullanılmadı.' }); else if (x.kalanHak) uyarilar.push({ tur: 'telafi', metin: 'Bu ay ' + x.kalanHak + ' telafi hakkı var.' }); });
    let rec = (typeof aidatDB !== 'undefined' && aidatDB[u.ad] && aidatDB[u.ad][buAy]) || null;
    if (!u.sp.aidatMuaf && aylar.some(function (x) { return x.ay === buAy; }) && !(rec && rec.odendi)) uyarilar.push({ tur: 'odeme', metin: OD_AY[+buAy.slice(5) - 1] + ' aidatı girilmedi.' });
    return { kayit: k, say: say, aylar: aylar, hak: hak, uyarilar: uyarilar, ilk: k.length ? k[0].iso : null, sonGelis: (k.filter(function (r) { return r.s === 'g' || r.s === 't'; }).pop() || {}).iso || null };
}
// ---------------- yazma
async function odGunYaz(u, iso, s) {
    let anahtar = iso + '|' + u.ad;
    if (!otomatikYoklamaDB[iso]) otomatikYoklamaDB[iso] = {};
    if (s === null) delete otomatikYoklamaDB[iso][u.ad];
    else otomatikYoklamaDB[iso][u.ad] = { saat: '12:00', grup: u.g, elle: true, geldi: s === 'g' || s === 't' };
    try { otomatikYoklamaKaydet(); } catch (e) {}
    try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    try {
        if (s === null) await fetch('/api/attendance/auto', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tarih: iso, ad: u.ad }) });
        else await fetch('/api/attendance/auto', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tarih: iso, ad: u.ad, grup: u.g, saat: '12:00', elle: true, geldi: s === 'g' || s === 't' }) });
    } catch (e) {}
    let ek = s === 'h' ? 'hasta' : s === 't' ? 'telafi' : null, mevcut = OD.durum[anahtar];
    if (ek || (mevcut && !mevcut.sil && mevcut.d)) { let kayit = {}; kayit[anahtar] = ek ? { d: ek, t: Date.now() } : { d: null, sil: true, t: Date.now() }; OD.durum[anahtar] = kayit[anahtar]; try { OD.durum = await odMetaYaz('yoklama_durum', kayit); } catch (e) {} }
    try { yoneticiDevamsizlikWidgetCiz(); } catch (e) {}
}
// ---------------- ekran
async function odAc() {
    odCss();
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    if (!OD.yuklendi) { alan.innerHTML = '<div class="od-yuk">Yükleniyor…</div>'; OD.durum = await odMeta('yoklama_durum'); OD.yuklendi = true; }
    odCiz();
}
function odCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let u = OD.secili && odBul(OD.secili);
    alan.innerHTML = '<div class="od">' + odListeHTML() + '<div class="od-detay" id="od-detay">' + (u ? odDetayHTML(u) : '<div class="od-bos">Bir sporcu seç: takvim, telafi hakkı, aidat ve özet burada.</div>') + '</div></div>';
}
function odDetayYenile() {
    let d = document.getElementById('od-detay'), u = OD.secili && odBul(OD.secili); if (!d || !u) return odCiz();
    let kap = document.getElementById('yonetici-icerik') || document.scrollingElement, y = kap ? kap.scrollTop : 0, wy = window.scrollY;
    d.innerHTML = odDetayHTML(u);
    let s = document.querySelector('.od-sat[data-k="' + CSS.escape(OD.secili) + '"] .od-sat-alt'); if (s) s.innerHTML = odSatirAlt(u);
    if (kap) kap.scrollTop = y; window.scrollTo(0, wy);
}
function odSatirAlt(u) { let o = odOzet(u), b = odIso(new Date()).slice(0, 7), m = o.aylar.find(function (x) { return x.ay === b; }); return (m ? 'bu ay ' + m.geldi + ' geldi' : 'bu ay kayıt yok') + (o.hak ? ' · <b class="od-amber">' + o.hak + ' telafi</b>' : '') + (o.uyarilar.some(function (x) { return x.tur === 'odeme'; }) ? ' · <b class="od-kirmizi">aidat</b>' : ''); }
function odListeHTML() {
    return '<div class="od-liste"><div class="od-baslik">📒 Öğrenci Defteri</div><input class="od-ara" id="od-ara" placeholder="Sporcu ara…" value="' + odEsc(OD.ara) + '" oninput="OD.ara=this.value; odListeYenile()"><div class="od-satirlar" id="od-satirlar">' + odSatirlarHTML() + '</div></div>';
}
function odSatirlarHTML() {
    let q = (OD.ara || '').toLocaleLowerCase('tr');
    return odSporcular().filter(function (u) { return !q || u.ad.toLocaleLowerCase('tr').indexOf(q) !== -1; }).map(function (u) { return '<button class="od-sat' + (OD.secili === u.k ? ' secili' : '') + '" data-k="' + odEsc(u.k) + '" onclick="odSec(\'' + odEnc(u.k) + '\')"><b>' + odEsc(u.ad) + '</b><small>' + OD_GRUP_AD[u.g] + '</small><span class="od-sat-alt">' + odSatirAlt(u) + '</span></button>'; }).join('') || '<div class="od-bos">Sporcu yok.</div>';
}
function odListeYenile() { let el = document.getElementById('od-satirlar'); if (el) el.innerHTML = odSatirlarHTML(); }
function odSec(kEnc) {
    OD.secili = decodeURIComponent(kEnc); OD.ay = null; OD.secim = null;
    document.querySelectorAll('.od-sat').forEach(function (b) { b.classList.toggle('secili', b.dataset.k === OD.secili); });
    odDetayYenile();
    let d = document.getElementById('od-detay'); if (d && window.innerWidth < 860) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function odAyListesi(u, o) {
    let bas = o.ilk || odIso(new Date()), b = new Date(bas.slice(0, 7) + '-01T12:00:00'), s = new Date(); s.setDate(1);
    let l = []; while (b <= s && l.length < 24) { l.push(odIso(b).slice(0, 7)); b.setMonth(b.getMonth() + 1); }
    return l.length ? l : [odIso(new Date()).slice(0, 7)];
}
function odDetayHTML(u) {
    let o = odOzet(u), aylar = odAyListesi(u, o);
    if (!OD.ay || aylar.indexOf(OD.ay) === -1) OD.ay = aylar[aylar.length - 1];
    let yas = null; try { yas = typeof yasHesapla === 'function' ? yasHesapla(u.sp) : null; } catch (e) {}
    let m = o.aylar.find(function (x) { return x.ay === OD.ay; }) || { geldi: 0, dersler: [], telafiler: [], hak: 0, kalanHak: 0 };
    let kutu = function (n, ad, cls) { return '<div class="od-kutu ' + (cls || '') + '"><b>' + n + '</b><small>' + ad + '</small></div>'; };
    return '<div class="od-ust"><div><div class="od-ad">' + odEsc(u.ad) + '</div><div class="od-alt">' + OD_GRUP_AD[u.g] + (yas ? ' · ' + yas + ' yaş' : '') + (o.ilk ? ' · ilk kayıt ' + odTR(o.ilk) : '') + (o.sonGelis ? ' · son geliş ' + odTR(o.sonGelis) : '') + '</div></div>'
        + (u.sp.acilTelefon ? '<button class="od-btn" onclick="odVeliMesaj(\'' + odEnc(u.k) + '\')">Veliye özet</button>' : '') + '</div>'
        + '<div class="od-kutular">' + kutu(o.say.g + o.say.t, 'geldi', 'g') + kutu(o.say.y, 'gelmedi', 'y') + kutu(o.say.h, 'hasta', 'h') + kutu(o.say.t, 'telafi yaptı', 't') + kutu(o.hak, 'açık telafi hakkı', o.hak ? 'uyari' : '') + '</div>'
        + o.uyarilar.map(function (w) { return '<div class="od-uyari ' + w.tur + '">' + odEsc(w.metin) + '</div>'; }).join('')
        + '<div class="od-bolum"><div class="od-bolum-bas">Yoklama takvimi <small>güne dokun → durum seç</small></div>'
        + '<div class="od-aylar">' + aylar.map(function (a) { let say = o.kayit.filter(function (r) { return r.iso.slice(0, 7) === a; }).length; return '<button class="' + (a === OD.ay ? 'aktif' : '') + '" onclick="OD.ay=\'' + a + '\'; OD.secim=null; odDetayYenile()">' + OD_AY[+a.slice(5) - 1] + (a.slice(0, 4) !== String(new Date().getFullYear()) ? ' ' + a.slice(0, 4) : '') + (say ? ' <i>' + say + '</i>' : '') + '</button>'; }).join('') + '</div>'
        + odTakvimHTML(u)
        + '<div class="od-lejant">' + Object.keys(OD_DURUM).map(function (k) { return '<span class="' + OD_DURUM[k].cls + '"><i>' + OD_DURUM[k].ikon + '</i>' + OD_DURUM[k].ad + '</span>'; }).join('') + '</div></div>'
        + '<div class="od-bolum"><div class="od-bolum-bas">' + OD_AY[+OD.ay.slice(5) - 1] + ' özeti <small>gelmediği her ders 1 telafi hakkı</small></div>'
        + '<div class="od-ay-ozet"><span><b>' + m.geldi + '</b> geldi</span><span><b>' + m.dersler.filter(function (r) { return r.s === 'y'; }).length + '</b> gelmedi</span><span><b>' + m.dersler.filter(function (r) { return r.s === 'h'; }).length + '</b> hasta</span><span><b>' + m.telafiler.length + '</b> telafi</span>' + (m.kalanHak ? '<span class="od-amber"><b>' + m.kalanHak + '</b> hak açık</span>' : '') + '</div>'
        + '<div class="od-noktalar">' + m.dersler.concat(m.telafiler).sort(function (a, b) { return a.iso.localeCompare(b.iso); }).map(function (r) { return '<span class="od-n ' + OD_DURUM[r.s].cls + '" title="' + odTR(r.iso) + ' · ' + OD_DURUM[r.s].ad + '">' + OD_DURUM[r.s].ikon + '<small>' + odKisa(r.iso) + '</small></span>'; }).join('') + Array.from({ length: m.kalanHak }, function () { return '<span class="od-n hak" title="Kullanılmamış telafi hakkı">↺<small>hak</small></span>'; }).join('') + '</div></div>'
        + '<div class="od-bolum"><div class="od-bolum-bas">Aidat <small>tutarlar Aidat sekmesinde (PIN ile)</small></div>' + odAidatHTML(u) + '</div>';
}
function odAidatHTML(u) {
    let kayit = (typeof aidatDB !== 'undefined' && aidatDB[u.ad]) || {}, aylar = Object.keys(kayit).filter(function (a) { return kayit[a] && (kayit[a].odendi || kayit[a].notMetin); }).sort().reverse().slice(0, 8);
    return (u.sp.aidatMuaf ? '<div class="od-alt">Aidattan muaf.</div>' : '')
        + (aylar.length ? '<div class="od-odemeler">' + aylar.map(function (a) { let r = kayit[a]; return '<div><b>' + OD_AY[+a.slice(5) - 1] + ' ' + a.slice(0, 4) + '</b><span class="' + (r.odendi ? 'od-yesil' : 'od-kirmizi') + '">' + (r.odendi ? 'ödendi' + (r.odemeTarihi ? ' · ' + odTR(r.odemeTarihi) : '') : 'ödenmedi') + '</span><small>' + odEsc(r.notMetin || '') + '</small></div>'; }).join('') + '</div>' : '<div class="od-alt">Aidat kaydı yok.</div>')
        + '<button class="od-btn" onclick="odAidataGit(\'' + odEnc(u.ad) + '\')">Aidat\'ta düzenle (not ekle)</button>';
}
function odAidataGit(adEnc) { try { _aidatAcikAd = decodeURIComponent(adEnc); _aidatAcikAy = odIso(new Date()).slice(0, 7); } catch (e) {} yoneticiSekme('aidat'); }
function odTakvimHTML(u) {
    let a = OD.ay, ilk = new Date(a + '-01T12:00:00'), gunSay = new Date(ilk.getFullYear(), ilk.getMonth() + 1, 0).getDate(), bos = (ilk.getDay() + 6) % 7, bugun = odIso(new Date());
    let h = '<div class="od-takvim">' + ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(function (g) { return '<div class="od-gb">' + g + '</div>'; }).join('');
    for (let i = 0; i < bos; i++) h += '<div></div>';
    for (let d = 1; d <= gunSay; d++) {
        let iso = a + '-' + String(d).padStart(2, '0'), s = odGun(u, iso), gelecek = iso > bugun;
        h += '<button class="od-gun' + (s ? ' ' + OD_DURUM[s].cls : '') + (iso === bugun ? ' bugun' : '') + (OD.secim === iso ? ' acik' : '') + '"' + (gelecek ? ' disabled' : '') + ' onclick="odGunSec(\'' + iso + '\')" aria-label="' + d + ' ' + OD_AY[ilk.getMonth()] + (s ? ' ' + OD_DURUM[s].ad : '') + '"><span>' + d + '</span>' + (s ? '<i>' + OD_DURUM[s].ikon + '</i>' : '') + '</button>';
    }
    h += '</div>';
    if (OD.secim && OD.secim.slice(0, 7) === a) {
        let s = odGun(u, OD.secim);
        h += '<div class="od-secici"><b>' + odTR(OD.secim) + '</b>' + Object.keys(OD_DURUM).map(function (k) { return '<button class="' + OD_DURUM[k].cls + (s === k ? ' aktif' : '') + '" onclick="odDurumSec(\'' + k + '\')">' + OD_DURUM[k].ikon + ' ' + OD_DURUM[k].ad + '</button>'; }).join('') + '<button onclick="odDurumSec(null)">Boşalt</button><button class="kapat" onclick="OD.secim=null; odDetayYenile()" aria-label="Kapat">✕</button></div>';
    }
    return h;
}
function odGunSec(iso) { OD.secim = OD.secim === iso ? null : iso; odDetayYenile(); }
async function odDurumSec(s) {
    let u = OD.secili && odBul(OD.secili), iso = OD.secim; if (!u || !iso) return;
    await odGunYaz(u, iso, s); OD.secim = null; odDetayYenile();
    showToast(s ? odTR(iso) + ': ' + OD_DURUM[s].ad : odTR(iso) + ' boşaltıldı', 'success');
}
function odVeliMesaj(kEnc) {
    let u = odBul(decodeURIComponent(kEnc)); if (!u) return; let o = odOzet(u), b = odIso(new Date()).slice(0, 7), m = o.aylar.find(function (x) { return x.ay === b; });
    let ilk = u.ad.split(' ')[0], ilkAd = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let msg = 'Merhaba, DAĞ Spor Kulübü\'nden yazıyoruz.\n\n' + ilkAd + ' için kısa özet:\n• Toplam ' + (o.say.g + o.say.t) + ' antrenmana katıldı' + (o.say.t ? ' (' + o.say.t + ' telafi)' : '') + '\n'
        + (m ? '• Bu ay ' + m.geldi + ' antrenman' + (m.kalanHak ? ' · ' + m.kalanHak + ' telafi hakkı var' : '') + '\n' : '') + (o.sonGelis ? '• Son geldiği antrenman: ' + odTR(o.sonGelis) + '\n' : '') + '\nGörüşmek üzere! 🏹';
    let tel = String(u.sp.acilTelefon || '').replace(/\D/g, ''); if (tel.startsWith('0')) tel = '90' + tel.slice(1); else if (tel && !tel.startsWith('90')) tel = '90' + tel;
    window.open((tel ? 'https://api.whatsapp.com/send?phone=' + tel + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
}

// ================================================================================================
// 📝 DERS GÜNLÜĞÜ (DAĞ)
// ================================================================================================
const DG = { yuklendi: false, kayit: {}, slotlar: [], hafta: 0, ay: 0, grup: 'hepsi', form: null, sekme: 'gunluk' };
const DG_BECERI = [
    ['durus', '🧍', 'Duruş & ayak'], ['cekis', '💪', 'Çekiş'], ['nisan', '🎯', 'Nişan'], ['birakis', '🏹', 'Bırakış'], ['takip', '➡️', 'Takip'], ['ritim', '⏱', 'Atış ritmi'],
    ['mesafe', '📏', 'Mesafe & skor'], ['kuvvet', '🏋️', 'Kuvvet & kondisyon'], ['esneklik', '🧘', 'Esneklik'], ['odak', '🧠', 'Odak & zihin'], ['guvenlik', '🦺', 'Güvenlik & ekipman'], ['oyun', '🎲', 'Oyun'], ['yarisma', '🏆', 'Yarışma']
];
function dgBeceri(id) { return DG_BECERI.find(function (b) { return b[0] === id; }) || [id, '•', id]; }
function dgTR(iso) { let d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + OD_AY[d.getMonth()]; }
function dgGunAd(iso) { return ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date(iso + 'T12:00:00').getDay()]; }
function dgGrupBul(ad) { let s = String(ad || '').toLocaleLowerCase('tr-TR'); if (s.indexOf('büyük') !== -1 || s.indexOf('buyuk') !== -1) return 'buyukler'; if (s.indexOf('yıldız') !== -1 || s.indexOf('yildiz') !== -1) return 'yildizlar'; if (s.indexOf('küçük') !== -1 || s.indexOf('kucuk') !== -1) return 'kucukler'; if (s.indexOf('minik') !== -1) return 'minikler'; return null; }
async function dgYaz(id, kayit) { let uzak = await odMeta('ders_gunlugu'), m = Object.assign({}, uzak); kayit.t = Date.now(); m[id] = kayit; await fetch('/api/meta/ders_gunlugu', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(m) }) }); DG.kayit = m; }
async function dgYukle() {
    DG.kayit = await odMeta('ders_gunlugu');
    try { let r = await fetch('/api/antrenman-programi'); let d = await r.json(); DG.slotlar = (d && (d.slots || d.program)) || []; } catch (e) { DG.slotlar = []; }
    DG.yuklendi = true;
}
function dgKayitlar() { return Object.keys(DG.kayit).map(function (id) { return Object.assign({ id: id }, DG.kayit[id]); }).filter(function (k) { return !k.sil && k.tarih; }).sort(function (a, b) { return b.tarih.localeCompare(a.tarih) || (b.t || 0) - (a.t || 0); }); }
function dgHafta(o) { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + o * 7); let s = new Date(d); s.setDate(d.getDate() + 6); return { bas: odIso(d), bit: odIso(s) }; }
function dgAyStr(o) { let d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + o); return odIso(d).slice(0, 7); }
function dgGunSlotlari(iso) { let wd = new Date(iso + 'T12:00:00').getDay(); return DG.slotlar.filter(function (s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number).indexOf(wd) !== -1 && !(s.istisnalar || []).some(function (i) { return i.tarih === iso; }); }).sort(function (a, b) { return String(a.baslangicSaat).localeCompare(String(b.baslangicSaat)); }); }
async function dgAc() {
    odCss();
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    if (!DG.yuklendi) { alan.innerHTML = '<div class="od-yuk">Yükleniyor…</div>'; await dgYukle(); }
    dgCiz();
}
function dgCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let sek = function (k, ad) { return '<button class="' + (DG.sekme === k ? 'aktif' : '') + '" onclick="DG.sekme=\'' + k + '\'; dgCiz()">' + ad + '</button>'; };
    alan.innerHTML = '<div class="od od-tek"><div class="od-detay"><div class="od-ust"><div><div class="od-ad">📝 Ders Günlüğü</div><div class="od-alt">Her antrenmanın konusu ve neler yaptırıldığı → haftalık veli mesajı ve aylık beceri özeti.</div></div><button class="od-btn ana" onclick="dgFormAc()">＋ Bugünün dersini yaz</button></div>'
        + '<div class="od-aylar">' + sek('gunluk', 'Günlük kayıtlar') + sek('hafta', 'Haftalık veli özeti') + sek('ay', 'Aylık beceri özeti') + '</div>'
        + (DG.form ? dgFormHTML() : '') + (DG.sekme === 'gunluk' ? dgGunlukHTML() : DG.sekme === 'hafta' ? dgHaftaHTML() : dgAyHTML()) + '</div></div>';
}
function dgFormAc(id, tarih) {
    let k = id ? DG.kayit[id] : null, iso = (k && k.tarih) || tarih || odIso(new Date()), sl = dgGunSlotlari(iso)[0];
    DG.form = { id: id || ('d' + Date.now().toString(36)), tarih: iso, slot: k ? k.slot : (sl ? sl.grup + ' ' + (sl.baslangicSaat || '') : ''), gruplar: k ? (k.gruplar || []).slice() : (sl && dgGrupBul(sl.grup) ? [dgGrupBul(sl.grup)] : []), beceriler: k ? (k.beceriler || []).slice() : [], konu: k ? k.konu || '' : '', yapilanlar: k ? k.yapilanlar || '' : '', yeni: !k };
    DG.sekme = 'gunluk'; dgCiz();
    setTimeout(function () { let e = document.getElementById('dg-form'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
}
function dgFormHTML() {
    let f = DG.form, sl = dgGunSlotlari(f.tarih), cip = function (aktif, yazi, fn) { return '<button type="button" class="od-cip' + (aktif ? ' aktif' : '') + '" onclick="' + fn + '">' + yazi + '</button>'; };
    return '<form class="od-form" id="dg-form" onsubmit="event.preventDefault(); dgKaydet()"><div class="od-bolum-bas">' + (f.yeni ? 'Yeni ders kaydı' : 'Ders kaydını düzenle') + '<button type="button" class="od-btn" onclick="DG.form=null; dgCiz()">Vazgeç</button></div>'
        + '<div class="od-form-satir"><label>Tarih<input type="date" value="' + f.tarih + '" max="' + odIso(new Date()) + '" onchange="DG.form.tarih=this.value; dgCiz()"></label><label>Ders<select onchange="DG.form.slot=this.value; let g=dgGrupBul(this.value); if(g && DG.form.gruplar.indexOf(g)===-1) DG.form.gruplar.push(g); dgCiz()"><option value="">Genel</option>' + sl.map(function (s) { let v = s.grup + ' ' + (s.baslangicSaat || ''); return '<option' + (f.slot === v ? ' selected' : '') + '>' + odEsc(v) + '</option>'; }).join('') + (f.slot && !sl.some(function (s) { return s.grup + ' ' + (s.baslangicSaat || '') === f.slot; }) ? '<option selected>' + odEsc(f.slot) + '</option>' : '') + '</select></label></div>'
        + '<div class="od-etiket">Grup</div><div class="od-cipler">' + OD_GRUPLAR.map(function (g) { return cip(f.gruplar.indexOf(g) !== -1, OD_GRUP_AD[g], 'dgDegistir(\'gruplar\',\'' + g + '\')'); }).join('') + '</div>'
        + '<div class="od-etiket">Çalışılan beceriler</div><div class="od-cipler">' + DG_BECERI.map(function (b) { return cip(f.beceriler.indexOf(b[0]) !== -1, b[1] + ' ' + b[2], 'dgDegistir(\'beceriler\',\'' + b[0] + '\')'); }).join('') + '</div>'
        + '<label class="od-tam">Antrenmanın konusu<input type="text" id="dg-konu" value="' + odEsc(f.konu) + '" placeholder="ör. Bırakış — sırt kası ile çekiş" oninput="DG.form.konu=this.value"></label>'
        + '<label class="od-tam">Neler yaptırıldı <small>(her satıra bir çalışma)</small><textarea id="dg-yap" rows="5" placeholder="Lastikle bırakış tekrarı 3×10&#10;Boş yay (ok yok) duruş&#10;18 m 6 seri × 3 ok" oninput="DG.form.yapilanlar=this.value">' + odEsc(f.yapilanlar) + '</textarea></label>'
        + '<div class="od-form-alt">' + (f.yeni ? '' : '<button type="button" class="od-btn sil" onclick="dgSil(\'' + f.id + '\')">Sil</button>') + '<button class="od-btn ana buyuk" type="submit">Kaydet</button></div></form>';
}
function dgDegistir(alan, v) { let l = DG.form[alan], i = l.indexOf(v); if (i === -1) l.push(v); else l.splice(i, 1); let k = document.getElementById('dg-konu'), y = document.getElementById('dg-yap'); if (k) DG.form.konu = k.value; if (y) DG.form.yapilanlar = y.value; dgCiz(); }
async function dgKaydet() {
    let f = DG.form; if (!f) return; let k = document.getElementById('dg-konu'), y = document.getElementById('dg-yap'); if (k) f.konu = k.value.trim(); if (y) f.yapilanlar = y.value.trim();
    if (!f.konu && !f.yapilanlar) return showToast('Konu ya da yapılanlardan birini yaz.', 'error');
    try { await dgYaz(f.id, { tarih: f.tarih, slot: f.slot || '', gruplar: f.gruplar, beceriler: f.beceriler, konu: f.konu, yapilanlar: f.yapilanlar }); } catch (e) { return showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); }
    DG.form = null; showToast('Ders kaydedildi', 'success'); dgCiz();
}
function dgSil(id) { onayIste('Bu ders kaydı silinsin mi?', function () { dgYaz(id, { sil: true, tarih: (DG.kayit[id] || {}).tarih || '' }).then(function () { DG.form = null; dgCiz(); showToast('Silindi', 'success'); }); }, 'Sil', 'Vazgeç'); }
function dgKartHTML(k) {
    let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    return '<div class="od-kart"><div class="od-kart-bas"><b>' + dgTR(k.tarih) + ' · ' + dgGunAd(k.tarih) + '</b>' + (k.slot ? '<span>' + odEsc(k.slot) + '</span>' : '<span></span>') + '<button class="od-btn kucuk" onclick="dgFormAc(\'' + k.id + '\')">Düzenle</button></div>'
        + (k.konu ? '<div class="od-konu">' + odEsc(k.konu) + '</div>' : '')
        + '<div class="od-cipler">' + (k.gruplar || []).map(function (g) { return '<span class="od-et yas">' + OD_GRUP_AD[g] + '</span>'; }).join('') + (k.beceriler || []).map(function (b) { let x = dgBeceri(b); return '<span class="od-et">' + x[1] + ' ' + odEsc(x[2]) + '</span>'; }).join('') + '</div>'
        + (sat.length ? '<ul>' + sat.map(function (x) { return '<li>' + odEsc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
}
function dgGunlukHTML() {
    let h = dgHafta(DG.hafta), l = dgKayitlar().filter(function (k) { return k.tarih >= h.bas && k.tarih <= h.bit; }), bugun = odIso(new Date()), gunler = [];
    for (let i = 0; i < 7; i++) { let d = new Date(h.bas + 'T12:00:00'); d.setDate(d.getDate() + i); gunler.push(odIso(d)); }
    return '<div class="od-nav"><button class="od-btn" onclick="DG.hafta--; dgCiz()" aria-label="Önceki hafta">‹</button><b>' + dgTR(h.bas) + ' – ' + dgTR(h.bit) + '</b><button class="od-btn" onclick="DG.hafta=Math.min(0,DG.hafta+1); dgCiz()"' + (DG.hafta >= 0 ? ' disabled' : '') + ' aria-label="Sonraki hafta">›</button></div>'
        + (gunler.filter(function (g) { return g <= bugun; }).reverse().map(function (g) {
            let kk = l.filter(function (k) { return k.tarih === g; }), ders = dgGunSlotlari(g);
            if (!kk.length && !ders.length) return '';
            return '<div class="od-gun-blok"><div class="od-kart-bas"><b>' + dgGunAd(g) + ' · ' + dgTR(g) + '</b><span>' + (ders.length ? ders.length + ' ders programda' : '') + '</span><button class="od-btn kucuk" onclick="dgFormAc(null,\'' + g + '\')">＋ yaz</button></div>' + (kk.length ? kk.map(dgKartHTML).join('') : '<div class="od-alt">Bu gün için kayıt yok.</div>') + '</div>';
        }).join('') || '<div class="od-bos">Bu hafta antrenman ya da kayıt yok.</div>');
}
function dgFiltre(l, g) { return g === 'hepsi' ? l : l.filter(function (k) { return (k.gruplar || []).indexOf(g) !== -1 || !(k.gruplar || []).length; }); }
function dgHaftaMetni(h, g) {
    let l = dgFiltre(dgKayitlar().filter(function (k) { return k.tarih >= h.bas && k.tarih <= h.bit; }), g); if (!l.length) return '';
    let bec = {}, konular = [];
    l.slice().reverse().forEach(function (k) { if (k.konu && konular.indexOf(k.konu) === -1) konular.push(k.konu); let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); ((k.beceriler || []).length ? k.beceriler : ['diger']).forEach(function (b) { bec[b] = bec[b] || []; sat.forEach(function (x) { if (bec[b].indexOf(x) === -1) bec[b].push(x); }); }); });
    let m = '🏹 DAĞ Spor Kulübü · ' + dgTR(h.bas) + ' – ' + dgTR(h.bit) + ' haftası' + (g !== 'hepsi' ? ' (' + OD_GRUP_AD[g] + ')' : '') + '\n\nBu hafta şunlar üzerine çalıştık:\n';
    if (konular.length) m += '\n📌 ' + konular.join(' · ') + '\n';
    Object.keys(bec).forEach(function (b) { let x = b === 'diger' ? ['', '✨', 'Diğer'] : dgBeceri(b); m += '\n' + x[1] + ' ' + x[2] + (bec[b].length ? ':\n' + bec[b].slice(0, 6).map(function (s) { return '  • ' + s; }).join('\n') : '') + '\n'; });
    return m + '\nGörüşmek üzere!';
}
function dgHaftaHTML() {
    let h = dgHafta(DG.hafta), metin = dgHaftaMetni(h, DG.grup), veliler = DG.grup === 'hepsi' ? [] : Object.keys(turnuvaDB[DG.grup] || {}).map(function (ad) { return { ad: ad, sp: turnuvaDB[DG.grup][ad] }; }).filter(function (x) { return x.sp && !x.sp.pasif && x.sp.acilTelefon; });
    return '<div class="od-nav"><button class="od-btn" onclick="DG.hafta--; dgCiz()" aria-label="Önceki hafta">‹</button><b>' + dgTR(h.bas) + ' – ' + dgTR(h.bit) + '</b><button class="od-btn" onclick="DG.hafta=Math.min(0,DG.hafta+1); dgCiz()"' + (DG.hafta >= 0 ? ' disabled' : '') + ' aria-label="Sonraki hafta">›</button></div>'
        + '<div class="od-cipler">' + ['hepsi'].concat(OD_GRUPLAR).map(function (g) { return '<button class="od-cip' + (DG.grup === g ? ' aktif' : '') + '" onclick="DG.grup=\'' + g + '\'; dgCiz()">' + (g === 'hepsi' ? 'Hepsi' : OD_GRUP_AD[g]) + '</button>'; }).join('') + '</div>'
        + (metin ? '<textarea class="od-metin" id="dg-hafta-metin" rows="14">' + odEsc(metin) + '</textarea><div class="od-form-alt"><button class="od-btn" onclick="dgKopyala()">Kopyala</button><button class="od-btn ana" onclick="dgPaylas()">WhatsApp\'ta paylaş</button></div>'
            + (veliler.length ? '<div class="od-etiket">' + OD_GRUP_AD[DG.grup] + ' velileri (' + veliler.length + ') — dokun, mesaj hazır açılır</div><div class="od-cipler">' + veliler.map(function (x) { return '<button class="od-cip" onclick="dgPaylas(\'' + String(x.sp.acilTelefon).replace(/\D/g, '') + '\')">' + odEsc(x.ad.split(' ')[0]) + '</button>'; }).join('') + '</div>' : '<div class="od-alt">' + (DG.grup === 'hepsi' ? 'Velilere tek tek göndermek için grup seç.' : 'Bu grupta telefonu kayıtlı veli yok.') + '</div>')
            : '<div class="od-bos">Bu hafta' + (DG.grup !== 'hepsi' ? ' ' + OD_GRUP_AD[DG.grup] + ' için' : '') + ' kayıt yok.</div>');
}
function dgKopyala() { let t = document.getElementById('dg-hafta-metin'); if (!t) return; try { navigator.clipboard.writeText(t.value).then(function () { showToast('Kopyalandı', 'success'); }); } catch (e) { t.select(); document.execCommand('copy'); showToast('Kopyalandı', 'success'); } }
function dgPaylas(tel) { let t = document.getElementById('dg-hafta-metin'); if (!t) return; let n = String(tel || ''); if (n.startsWith('0')) n = '90' + n.slice(1); else if (n && !n.startsWith('90')) n = '90' + n; window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(t.value), '_blank'); }
function dgAyVeri(ay) {
    let l = dgKayitlar().filter(function (k) { return k.tarih.slice(0, 7) === ay; }), t = {};
    l.forEach(function (k) { let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), gl = (k.gruplar || []).length ? k.gruplar : ['genel']; ((k.beceriler || []).length ? k.beceriler : ['diger']).forEach(function (b) { gl.forEach(function (g) { let h = ((t[b] = t[b] || {})[g] = t[b][g] || { gun: [], is: [] }); if (h.gun.indexOf(k.tarih) === -1) h.gun.push(k.tarih); sat.forEach(function (x) { if (h.is.indexOf(x) === -1) h.is.push(x); }); }); }); });
    return { l: l, t: t, sira: DG_BECERI.map(function (b) { return b[0]; }).concat(['diger']).filter(function (b) { return t[b]; }), gruplar: OD_GRUPLAR.concat(['genel']) };
}
function dgGrupAd(g) { return g === 'genel' ? 'Genel' : OD_GRUP_AD[g]; }
function dgAyHTML() {
    let ay = dgAyStr(DG.ay), v = dgAyVeri(ay), ad = OD_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4);
    return '<div class="od-nav"><button class="od-btn" onclick="DG.ay--; dgCiz()" aria-label="Önceki ay">‹</button><b>' + ad + '</b><button class="od-btn" onclick="DG.ay=Math.min(0,DG.ay+1); dgCiz()"' + (DG.ay >= 0 ? ' disabled' : '') + ' aria-label="Sonraki ay">›</button></div>'
        + (v.l.length ? '<div class="od-alt">' + v.l.length + ' ders kaydı · ' + v.sira.length + ' beceri</div>' + v.sira.map(function (b) { let x = b === 'diger' ? ['', '✨', 'Diğer'] : dgBeceri(b); return '<div class="od-kart"><div class="od-kart-bas"><b>' + x[1] + ' ' + x[2] + '</b></div>' + v.gruplar.filter(function (g) { return v.t[b][g]; }).map(function (g) { let h = v.t[b][g]; return '<div class="od-ay-sat"><span class="od-et yas">' + dgGrupAd(g) + '</span><small>' + h.gun.length + ' ders</small><div>' + (h.is.length ? h.is.map(odEsc).join(' · ') : '—') + '</div></div>'; }).join('') + '</div>'; }).join('')
            + '<div class="od-form-alt"><button class="od-btn ana buyuk" onclick="dgAyPdf()">' + ad + ' özetini PDF indir</button></div>' : '<div class="od-bos">' + ad + ' için ders kaydı yok.</div>');
}
function dgAyPdf() {
    let ay = dgAyStr(DG.ay), v = dgAyVeri(ay), ad = OD_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4);
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF aracı yüklenemedi.', 'error');
    showToast('PDF hazırlanıyor…', 'success');
    _yeniPdfAl('portrait').then(function (pdf) {
        let T = typeof _trTranslit === 'function' ? _trTranslit : function (s) { return s; }, mx = 18, uw = 174, pageH = 297, y = 24;
        let baslik = function (ilk) {
            pdf.setTextColor(27, 36, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(ilk ? 18 : 12); pdf.text(T(ad + ' · Antrenman Özeti'), mx, y);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 121, 118); pdf.text(T('DAĞ Spor Kulübü · Okçuluk'), mx, y + 6); pdf.text(T(v.l.length + ' ders kaydı · ' + v.sira.length + ' beceri'), mx + uw, y + 6, { align: 'right' });
            pdf.setDrawColor(27, 36, 34); pdf.setLineWidth(0.5); pdf.line(mx, y + 9, mx + uw, y + 9); y += 18;
        };
        baslik(true);
        v.sira.forEach(function (b) {
            let x = b === 'diger' ? ['', '', 'Diğer'] : dgBeceri(b);
            if (y > pageH - 40) { pdf.addPage(); y = 22; baslik(false); }
            pdf.setTextColor(15, 111, 103); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.text(T(x[2]).toLocaleUpperCase('tr-TR'), mx, y); y += 4.5;
            v.gruplar.filter(function (g) { return v.t[b][g]; }).forEach(function (g) {
                let h = v.t[b][g], satir = pdf.splitTextToSize(T(h.is.length ? h.is.join(' · ') : '—'), uw - 42), yuk = Math.max(11, satir.length * 4.6 + 4.5);
                if (y + yuk > pageH - 20) { pdf.addPage(); y = 22; baslik(false); }
                pdf.setTextColor(27, 36, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(T(dgGrupAd(g)), mx, y + 3.6);
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(140, 150, 147); pdf.text(T(h.gun.length + ' ders'), mx, y + 7.2);
                pdf.setTextColor(46, 57, 54); pdf.setFontSize(9); pdf.text(satir, mx + 40, y + 3.6); y += yuk;
                pdf.setDrawColor(228, 233, 231); pdf.setLineWidth(0.25); pdf.line(mx, y - 1.2, mx + uw, y - 1.2);
            });
            y += 5;
        });
        let n = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(154, 165, 162); pdf.text(T('DAĞ Spor Kulübü'), mx, pageH - 10); pdf.text(i + ' / ' + n, mx + uw, pageH - 10, { align: 'right' }); }
        pdf.save('DAG_Antrenman_Ozeti_' + ay + '.pdf');
    }).catch(function () { showToast('PDF oluşturulamadı.', 'error'); });
}
// ---------------- stil: "A · Sade" — Milo ile aynı jetonlar (kullanıcı seçimi 2026-10-15)
function odCss() {
    if (!document.getElementById('sade-font')) { let l = document.createElement('link'); l.id = 'sade-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('od-css')) return;
    let st = document.createElement('style'); st.id = 'od-css';
    st.textContent = [
        '.od{--s-zemin:#F4F7F6;--s-kagit:#FFFFFF;--s-ink:#1B2422;--s-dim:#6B7976;--s-line:#E4E9E7;--s-vurgu:#138A80;--s-vurgu-a:#E3F4F1;--s-kirmizi:#B4372F;--s-kirmizi-a:#FDEBEA;--s-amber:#8A5A00;--s-amber-a:#FFF4D9;--s-mor:#6D4BB8;--s-mor-a:#EEE8FB;--s-uyari:#E8A33D;',
        'font-family:"Manrope",system-ui,sans-serif;color:var(--s-ink);background:var(--s-zemin);border-radius:18px;padding:18px;color-scheme:light;display:grid;grid-template-columns:minmax(220px,290px) 1fr;gap:18px;align-items:start;text-align:left}',
        '.od.od-tek{grid-template-columns:1fr}.od-yuk,.od-bos{padding:18px;color:var(--s-dim);font-weight:600;text-align:center}',
        '.od-liste{position:sticky;top:0;display:grid;gap:10px;max-height:calc(100vh - 160px);overflow:auto}.od-baslik{font-size:20px;font-weight:800;letter-spacing:-.02em}',
        '.od-ara,.od-metin{width:100%;box-sizing:border-box;min-height:42px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:9px 12px;font:inherit;font-size:14px}.od-metin{resize:vertical;line-height:1.55}',
        '.od-satirlar{display:flex;flex-direction:column;background:var(--s-kagit);border:1px solid var(--s-line);border-radius:14px;overflow:hidden}',
        '.od-sat{flex:none;display:grid;text-align:left;gap:1px;padding:11px 14px;border:0;border-bottom:1px solid var(--s-line);background:transparent;color:var(--s-ink);font:inherit;cursor:pointer;min-height:52px}.od-sat:last-child{border-bottom:0}.od-sat:hover{background:#FAFBFB}',
        '.od-sat.secili{background:var(--s-vurgu-a);box-shadow:inset 3px 0 0 var(--s-vurgu)}.od-sat b{font-size:14px;font-weight:700}.od-sat small,.od-sat-alt{font-size:12px;color:var(--s-dim)}',
        '.od-amber{color:var(--s-amber)}.od-kirmizi{color:var(--s-kirmizi)}.od-yesil{color:var(--s-vurgu)}',
        '.od-detay{display:grid;gap:18px;min-width:0;background:var(--s-kagit);border:1px solid var(--s-line);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(20,40,35,.06)}',
        '.od-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.od-ad{font-size:24px;font-weight:800;letter-spacing:-.02em}.od-alt{font-size:13px;color:var(--s-dim);font-weight:500;margin-top:3px;line-height:1.5}',
        '.od-btn{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #D7DFDC;background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer;justify-self:start}.od-btn:hover:not(:disabled){border-color:var(--s-vurgu)}.od-btn:disabled{opacity:.35;cursor:default}',
        '.od-btn.ana{background:var(--s-vurgu);border-color:var(--s-vurgu);color:#fff}.od-btn.buyuk{min-height:50px;font-size:15px;padding:0 20px}.od-btn.kucuk{min-height:34px;padding:0 10px;font-size:12.5px}.od-btn.sil{color:var(--s-kirmizi)}',
        '.od-kutular{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px 16px}.od-kutu b{display:block;font-size:28px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}.od-kutu small{font-size:12px;color:var(--s-dim);font-weight:600}',
        '.od-kutu.g b{color:var(--s-vurgu)}.od-kutu.y b{color:var(--s-kirmizi)}.od-kutu.h b{color:var(--s-mor)}.od-kutu.t b,.od-kutu.uyari b{color:var(--s-amber)}',
        '.od-uyari{padding:10px 14px;border-left:3px solid var(--s-uyari);background:#FFF8EC;font-size:13px;font-weight:600;border-radius:0 8px 8px 0}.od-uyari.odeme{border-left-color:var(--s-kirmizi);background:#FFF4F3}',
        '.od-bolum{display:grid;gap:12px;padding-top:18px;border-top:1px solid var(--s-line)}.od-bolum-bas{font-weight:800;font-size:15px;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}.od-bolum-bas small{font-size:12px;font-weight:500;color:var(--s-dim)}',
        '.od-aylar{display:flex;gap:20px;overflow-x:auto;border-bottom:1px solid var(--s-line)}.od-aylar button{flex:none;min-height:38px;padding:0 0 6px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--s-dim);font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}',
        '.od-aylar button.aktif{color:var(--s-ink);border-bottom-color:var(--s-vurgu)}.od-aylar i{font-style:normal;font-size:11px;color:var(--s-dim);font-weight:600}',
        '.od-takvim{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.od-gb{text-align:center;font-size:11px;font-weight:700;color:#9AA5A2}',
        '.od-gun{aspect-ratio:1/1;min-height:40px;border-radius:10px;border:0;background:#F3F6F5;color:#2E3936;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0}',
        '.od-gun span{font-size:13px;font-weight:700}.od-gun i{font-style:normal;font-size:12px;line-height:1;font-weight:800}.od-gun:disabled{opacity:.3;cursor:default}.od-gun:hover:not(:disabled){box-shadow:inset 0 0 0 1.5px var(--s-vurgu)}.od-gun.bugun span{text-decoration:underline;text-underline-offset:3px}.od-gun.acik{outline:2px solid var(--s-ink);outline-offset:1px}',
        '.od-gun.g{background:var(--s-vurgu-a);color:#0F6F67}.od-gun.y{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.od-gun.h{background:var(--s-mor-a);color:var(--s-mor)}.od-gun.t{background:var(--s-amber-a);color:var(--s-amber)}',
        '.od-secici{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;border-radius:12px;background:#FAFBFB;border:1px solid var(--s-line)}.od-secici b{margin-right:6px;font-size:14px}',
        '.od-secici button{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #D7DFDC;background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}.od-secici button.g{color:#0F6F67}.od-secici button.y{color:var(--s-kirmizi)}.od-secici button.h{color:var(--s-mor)}.od-secici button.t{color:var(--s-amber)}',
        '.od-secici button.aktif{background:var(--s-ink);border-color:var(--s-ink);color:#fff}.od-secici button.kapat{margin-left:auto}',
        '.od-lejant{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;font-weight:600;color:var(--s-dim)}.od-lejant i{font-style:normal;display:inline-flex;width:18px;height:18px;border-radius:5px;align-items:center;justify-content:center;margin-right:5px;font-size:11px;font-weight:800}',
        '.od-lejant .g i{background:var(--s-vurgu-a);color:#0F6F67}.od-lejant .y i{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.od-lejant .h i{background:var(--s-mor-a);color:var(--s-mor)}.od-lejant .t i{background:var(--s-amber-a);color:var(--s-amber)}',
        '.od-ay-ozet{display:flex;flex-wrap:wrap;gap:6px 20px;font-size:13.5px;color:var(--s-dim)}.od-ay-ozet b{color:var(--s-ink);font-size:17px;font-weight:800}.od-ay-ozet .od-amber b{color:var(--s-amber)}',
        '.od-noktalar{display:flex;flex-wrap:wrap;gap:6px}.od-n{display:flex;flex-direction:column;align-items:center;justify-content:center;width:46px;height:42px;border-radius:9px;font-size:13px;font-weight:800;line-height:1.1}.od-n small{font-size:9.5px;font-weight:700}',
        '.od-n.g{background:var(--s-vurgu-a);color:#0F6F67}.od-n.y{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.od-n.h{background:var(--s-mor-a);color:var(--s-mor)}.od-n.t{background:var(--s-amber-a);color:var(--s-amber)}.od-n.hak{background:transparent;border:1.5px dashed var(--s-uyari);color:var(--s-amber)}',
        '.od-odemeler{display:grid}.od-odemeler div{display:grid;grid-template-columns:120px 150px 1fr;gap:10px;align-items:baseline;font-size:13.5px;padding:8px 0;border-bottom:1px solid var(--s-line)}.od-odemeler small{color:var(--s-dim);font-size:13px}',
        '.od-form{display:grid;gap:14px;padding:18px;border:1px solid var(--s-line);border-radius:16px;background:#FCFDFD}.od-form-satir{display:flex;flex-wrap:wrap;gap:12px}.od-form-satir label,.od-tam{display:grid;gap:5px;font-size:12px;font-weight:700;color:var(--s-dim)}.od-form-satir label{flex:1;min-width:160px}.od-tam small{font-weight:500}',
        '.od-form input,.od-form select,.od-form textarea{min-height:42px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:9px 12px;font:inherit;font-size:14px;box-sizing:border-box;width:100%}.od-form textarea{resize:vertical;line-height:1.55}',
        '.od-etiket{font-size:12px;font-weight:700;color:var(--s-dim)}.od-cipler{display:flex;flex-wrap:wrap;gap:6px}.od-cip{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:600;font-size:13px;cursor:pointer}',
        '.od-cip.aktif{background:var(--s-vurgu-a);border-color:var(--s-vurgu);color:#0F6F67;font-weight:800}.od-form-alt{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
        '.od-nav{display:flex;align-items:center;gap:12px}.od-nav b{min-width:170px;text-align:center;font-size:15px;font-weight:800}',
        '.od-gun-blok{display:grid;gap:8px}.od-kart{border:1px solid var(--s-line);border-radius:14px;padding:14px 16px;display:grid;gap:8px;background:var(--s-kagit)}.od-kart-bas{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.od-kart-bas b{font-size:14.5px;font-weight:800}.od-kart-bas span{font-size:12.5px;color:var(--s-dim);font-weight:600;flex:1}',
        '.od-konu{font-size:16px;font-weight:800}.od-kart ul{margin:0;padding-left:18px;display:grid;gap:3px;font-size:14px;color:#2E3936;line-height:1.5}',
        '.od-et{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:#F3F6F5;font-size:11.5px;font-weight:700;color:#3D4A47}.od-et.yas{background:var(--s-vurgu-a);color:#0F6F67}',
        '.od-ay-sat{display:grid;grid-template-columns:100px 64px 1fr;gap:10px;align-items:baseline;padding:8px 0;border-top:1px solid var(--s-line);font-size:14px;line-height:1.5}.od-ay-sat small{color:var(--s-dim);font-weight:600}',
        '.od button:focus-visible,.od input:focus-visible,.od select:focus-visible,.od textarea:focus-visible{outline:2px solid var(--s-vurgu);outline-offset:2px}',
        '@media (max-width:860px){.od{grid-template-columns:1fr;padding:12px}.od-liste{position:static;max-height:none}.od-satirlar{max-height:320px;overflow:auto}.od-detay{padding:16px}.od-odemeler div{grid-template-columns:1fr 1fr}.od-odemeler small{grid-column:1 / -1}.od-ay-sat{grid-template-columns:1fr 1fr}.od-ay-sat div{grid-column:1 / -1}}'
    ].join('\n');
    document.head.appendChild(st); if (typeof sadeGeceEkle === 'function') sadeGeceEkle(st);
}
window.odAc = odAc; window.dgAc = dgAc;
