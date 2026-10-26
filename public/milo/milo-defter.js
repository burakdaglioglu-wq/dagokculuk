/* ================================================================================================
   📒 ÖĞRENCİ DEFTERİ — Milo (2026-10-15). Kullanıcı (antrenörün yazdığı): "bir tarih giriyorum, sayfa en üste çıkıyor,
   tekrar öğrenciye tıklıyorum, tekrar tarih giriyorum… Eylül'e tıklayayım geldiği seansları yazayım, Ekim'e geçeyim;
   ödemeye not yazabilmeliyim (forma ile beraber, bu ay eksik); 8 ders dolunca gelmediği ders varsa telafi hakkı uyarısı
   (telafiyle 9 ders); hasta günleri; profilde ne olmuş, kaç kez gelmiş, kaç telafi, ödemeler hangi gün — özet."
   Kullanıcı seçimleri: ÖDEME 8 DERSLİK PAKET · TELAFİ HAKKI HER GELMEDİĞİ DERSTE.
   Kayıtlar (yeni tablo yok):
     · yoklama: attendance_auto (geldi 1/0) — gün boşaltma DELETE /api/milo/attendance/auto
     · ek durum: meta 'yoklama_durum' { 'YYYY-MM-DD|ad': { d: 'hasta'|'telafi', t } }  (hasta = gelmedi + neden,
       telafi = geldi + telafi dersi)
     · paket ödemeleri: meta 'paket_odeme' { 'grup|ad|paketNo': { odendi, tutar, odemeTarihi, not, t } }
   (2026-10-27: TELAFİ KURALI değişti — aşağıda mdHesap; 📞 Haber verdi durumu eklendi.)
   PAKET HESABI (saklanmaz): öğrencinin kayıtları tarih sırasıyla; telafi olmayan her kayıt (geldi/gelmedi/hasta) paketin
   8 dersinden birini doldurur, 8 dolunca yeni paket. Gelmediği her ders 1 telafi hakkı; telafi kaydı hakkı açık en eski
   pakete yazılır (8 ders + telafi = 9). Paket 8'i doldurduysa ve hak kullanılmadıysa uyarı.
   ================================================================================================ */
const MD = { yuklendi: false, uyeler: [], att: {}, durum: {}, odeme: {}, slotlar: [], dues: [], secili: null, ay: null, ara: '', ekran: 'liste', secim: null, aktarim: null };
const MD_DURUM = { g: { ad: 'Geldi', ikon: '✓', cls: 'g' }, y: { ad: 'Gelmedi', ikon: '✕', cls: 'y' }, m: { ad: 'Haber verdi', ikon: '📞', cls: 'm' }, h: { ad: 'Hasta', ikon: '🤒', cls: 'h' }, t: { ad: 'Telafi', ikon: '🔁', cls: 't' }, k: { ad: 'Başka gün geldi', ikon: '↪', cls: 'k' } };
const MD_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function mdIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mdTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
function mdKisaTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? +m[3] + ' ' + MD_AY[+m[2] - 1].slice(0, 3) : ''; }
function mdKey(u) { return u.grup + '|' + u.ad; }
function mdEnc(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
async function mdMeta(k) { try { let r = await miloApi('/meta/' + k); return r && r.value ? JSON.parse(r.value) : {}; } catch (e) { return {}; } }
async function mdMetaYaz(k, yerel) {
    let uzak = await mdMeta(k), m = Object.assign({}, uzak);
    Object.keys(yerel).forEach(function (x) { if (!m[x] || (yerel[x].t || 0) >= (m[x].t || 0)) m[x] = yerel[x]; });
    await miloApi('/meta/' + k, { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(m) }) });
    return m;
}
async function mdYukle() {
    let r = await Promise.all([miloApi('/members'), miloApi('/attendance/auto'), mdMeta('yoklama_durum'), mdMeta('paket_odeme'), miloApi('/antrenman-programi'), miloApi('/dues').catch(function () { return { dues: [] }; }), mdMeta('kagit_aktarim'), mdMeta('paket_hatirlatma')]);
    MD.uyeler = r[0].members || []; MD.att = {};
    (r[1].attendance || []).forEach(function (a) { (MD.att[a.tarih] = MD.att[a.tarih] || {})[a.ad] = { geldi: a.geldi !== 0 && a.geldi !== false, grup: a.grup, saat: a.saat }; });
    MD.durum = r[2] || {}; MD.odeme = r[3] || {}; MD.slotlar = (r[4] && r[4].slots) || []; MD.dues = (r[5] && r[5].dues) || []; MD.kagitBitti = !!(r[6] && r[6].bitti); MD.hatirlatma = r[7] || {};
    try { miloUyeler = MD.uyeler; } catch (e) {}
    MD.yuklendi = true;
}
// Öğrencinin bir gündeki durumu: 'g' | 'y' | 'h' | 't' | null
function mdGun(u, iso) {
    let a = (MD.att[iso] || {})[u.ad]; if (!a) return null;
    if (a.grup && a.grup !== u.grup && MD.uyeler.some(function (x) { return x.grup === a.grup && x.ad === u.ad; })) return null;
    let e = MD.durum[iso + '|' + u.ad], d = e && !e.sil ? e.d : null;
    if (a.geldi) return d === 'telafi' ? 't' : 'g';
    return d === 'hasta' ? 'h' : d === 'haber' ? 'm' : d === 'baska' ? 'k' : 'y'; // k: o gün gelmedi, başka gün geldi (2026-10-16) · m: haber verdi (2026-10-27)
}
function mdKayitlar(u) {
    return Object.keys(MD.att).filter(function (iso) { return mdGun(u, iso); }).sort().map(function (iso) { return { iso: iso, s: mdGun(u, iso) }; });
}
// TELAFİ KURALI (2026-10-27, kullanıcı: "telafi yanlış anlaşılmış; her gelmeme hak olmamalı, hakkın süresi olmalı, yönetici elle
// düzeltebilsin, ekranda karışık" → "hasta + haber verdi", "30 gün"):
//   · 🤒 hasta ya da 📞 haber verdi → 1 telafi hakkı, o dersten itibaren 30 gün geçerli; ✕ habersiz gelmedi → hak yok.
//   · MD_KURAL_TARIH'ten önce "gelmedi" işaretlenen dersler eski kurala göre hak taşır, 30 günü o tarihten sayılır.
//   · Yönetici her derste değiştirir: yoklama_durum kaydında hak:'ver'|'yok', bitis:'YYYY-MM-DD' (süreyi uzat).
//   · Telafi dersi, o gün geçerli olan en eski açık hakkı kapatır ve o hakkın paketine yazılır; açık hak yoksa yine
//     kaydedilir (fazla telafi), paketten ders yemez.
// public/milo/../src/routes/milo/veliPano.ts aynı kuralı sunucuda hesaplar — biri değişirse öbürü de.
const MD_TELAFI_GUN = 30, MD_KURAL_TARIH = '2026-10-28';
function mdGunEkle(iso, n) { let d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return mdIso(d); }
function mdHakAyar(u, iso) { let e = MD.durum[iso + '|' + u.ad]; return e && !e.sil ? e : {}; }
// Bu derste telafi hakkı doğar mı (kural + yöneticinin elle ayarı)
function mdHakVarMi(u, r) {
    if (r.s !== 'y' && r.s !== 'h' && r.s !== 'm') return false;
    let e = mdHakAyar(u, r.iso); if (e.hak === 'ver') return true; if (e.hak === 'yok') return false;
    return r.s === 'h' || r.s === 'm' || r.iso < MD_KURAL_TARIH;
}
function mdHakBitis(u, iso) { let e = mdHakAyar(u, iso); return e.bitis || mdGunEkle(iso < MD_KURAL_TARIH ? MD_KURAL_TARIH : iso, MD_TELAFI_GUN); }
function mdPaketler(u) { return mdHesap(u).paketler; }
function mdHesap(u) {
    let pk = [], haklar = [], fazla = [], bugun = mdIso(new Date()), cur = null, yeni = function () { cur = { no: pk.length + 1, dersler: [], telafiler: [], hak: 0 }; pk.push(cur); };
    mdKayitlar(u).forEach(function (r) {
        if (r.s === 't') {
            let h = haklar.find(function (x) { return !x.kullanim && x.iso <= r.iso && r.iso <= x.bitis; });
            if (h) { h.kullanim = r.iso; pk[h.paket - 1].telafiler.push(r); }
            else { if (!cur) yeni(); cur.telafiler.push(r); fazla.push(r); }
            return;
        }
        if (r.s === 'k') return; // ↪ başka güne kaydı: paketten ders yemez, hak doğurmaz (geldiği gün ders sayılır)
        if (!cur || cur.dersler.length >= 8) yeni();
        cur.dersler.push(r);
        if (mdHakVarMi(u, r)) { cur.hak++; haklar.push({ iso: r.iso, s: r.s, paket: cur.no, bitis: mdHakBitis(u, r.iso), kullanim: null, elle: mdHakAyar(u, r.iso).hak || null }); }
    });
    haklar.forEach(function (h) { h.durum = h.kullanim ? 'kullanildi' : h.bitis < bugun ? 'dustu' : 'acik'; });
    pk.forEach(function (p) {
        p.bas = p.dersler.length ? p.dersler[0].iso : (p.telafiler[0] || {}).iso; let son = p.dersler.concat(p.telafiler).map(function (r) { return r.iso; }).sort(); p.bit = son[son.length - 1];
        p.geldi = p.dersler.filter(function (r) { return r.s === 'g'; }).length + p.telafiler.length;
        p.dolu = p.dersler.length >= 8; p.kalanHak = haklar.filter(function (h) { return h.paket === p.no && h.durum === 'acik'; }).length;
        p.odeme = MD.odeme[mdKey(u) + '|' + p.no] || null;
    });
    return { paketler: pk, haklar: haklar, fazla: fazla };
}
function mdOzet(u) {
    let k = mdKayitlar(u), say = { g: 0, y: 0, m: 0, h: 0, t: 0, k: 0 }; k.forEach(function (r) { say[r.s]++; });
    let hs = mdHesap(u), pk = hs.paketler, acik = hs.haklar.filter(function (h) { return h.durum === 'acik'; }), hak = acik.length, son = pk[pk.length - 1] || null;
    let hakYok = k.filter(function (r) { return (r.s === 'y' || r.s === 'h' || r.s === 'm') && !mdHakVarMi(u, r); });
    let odemeler = pk.filter(function (p) { return p.odeme && p.odeme.odendi; }).map(function (p) { return { no: p.no, tarih: p.odeme.odemeTarihi, tutar: p.odeme.tutar, not: p.odeme.not }; });
    let uyarilar = [];
    if (hak) { let ilk = acik.slice().sort(function (a, b) { return a.bitis < b.bitis ? -1 : 1; })[0]; uyarilar.push({ tur: 'telafi', metin: hak + ' telafi hakkı açık · ilkinin son günü ' + mdTR(ilk.bitis) + '.' }); }
    pk.forEach(function (p) { if (!(p.odeme && p.odeme.odendi) && (p.dersler.length || p.telafiler.length)) uyarilar.push({ tur: 'odeme', metin: 'Paket ' + p.no + ' ödemesi girilmedi.' }); });
    return { kayit: k, say: say, paketler: pk, haklar: hs.haklar, hakYok: hakYok, fazla: hs.fazla, acikHaklar: acik, hak: hak, son: son, odemeler: odemeler, uyarilar: uyarilar, ilk: k.length ? k[0].iso : null, sonGelis: (k.filter(function (r) { return r.s === 'g' || r.s === 't'; }).pop() || {}).iso || null };
}
// Yöneticinin telafi düzeltmesi: ver (kural dışı hak) · yok (hak verme) · uzat (bugünden 30 gün) · geri (kurala dön)
async function mdHakIslem(kEnc, iso, islem) {
    let u = mdUye(decodeURIComponent(kEnc)); if (!u) return;
    let anahtar = iso + '|' + u.ad, e = Object.assign({ d: null }, mdHakAyar(u, iso));
    delete e.sil;
    if (islem === 'ver') e.hak = 'ver'; else if (islem === 'yok') { e.hak = 'yok'; delete e.bitis; }
    else if (islem === 'uzat') { e.bitis = mdGunEkle(mdIso(new Date()), MD_TELAFI_GUN); if (e.hak === 'yok') delete e.hak; }
    else { delete e.hak; delete e.bitis; }
    e.t = Date.now(); let kayit = {}; kayit[anahtar] = e;
    try { MD.durum = await mdMetaYaz('yoklama_durum', kayit); } catch (x) { showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); return; }
    showToast({ ver: '🔁 ' + mdTR(iso) + ' için telafi hakkı verildi', yok: mdTR(iso) + ': telafi hakkı kaldırıldı', uzat: '🔁 Süre uzatıldı: ' + mdTR(e.bitis || '') + ' son gün', geri: mdTR(iso) + ': kurala döndü' }[islem] || 'Kaydedildi', 'success');
    mdDetayYenile();
}
function mdHakHTML(u, o) {
    let k = mdEnc(mdKey(u)), bugun = mdIso(new Date()), sinir = mdGunEkle(bugun, -150);
    let satir = o.haklar.map(function (h) { return { iso: h.iso, s: h.s, h: h }; }).concat(o.hakYok.map(function (r) { return { iso: r.iso, s: r.s, h: null }; }))
        .filter(function (x) { return x.iso >= sinir || (x.h && x.h.durum === 'acik'); }).sort(function (a, b) { return a.iso < b.iso ? 1 : -1; });
    if (!satir.length && !o.fazla.length) return '';
    let dugme = function (islem, yazi, ana) { return '<button class="md-btn' + (ana ? ' ana' : '') + '" onclick="mdHakIslem(\'' + k + '\',\'' + this.iso + '\',\'' + islem + '\')">' + yazi + '</button>'; };
    let sayi = { acik: 0, kullanildi: 0, dustu: 0 }; o.haklar.forEach(function (h) { sayi[h.durum]++; });
    return '<div class="md-bolum"><div class="md-bolum-bas">🔁 Telafi hakları <small>🤒 hasta / 📞 haber verdi → ' + MD_TELAFI_GUN + ' gün geçerli hak · ✕ habersiz → hak yok · her satırı değiştirebilirsin</small></div>'
        + '<div class="md-haklar">' + satir.map(function (x) {
            let d = { iso: x.iso }, el = mdHakAyar(u, x.iso).hak, kalan = x.h ? Math.round((new Date(x.h.bitis) - new Date(bugun)) / 864e5) : 0, rozet, metin, btn;
            if (!x.h) { rozet = '<span class="md-hd yok">Hak yok</span>'; metin = el === 'yok' ? 'Elle kaldırıldı' : 'Haber verilmeden gelmedi, kurala göre hak yok'; btn = el === 'yok' ? dugme.call(d, 'geri', 'Geri al') : dugme.call(d, 'ver', 'Yine de hak ver', true); }
            else if (x.h.durum === 'acik') { rozet = '<span class="md-hd acik">Açık</span>'; metin = '<b>' + mdTR(x.h.bitis) + '</b> tarihine kadar (' + kalan + ' gün)' + (el === 'ver' ? ' · elle verildi' : ''); btn = el === 'ver' ? dugme.call(d, 'geri', 'Geri al') : dugme.call(d, 'yok', 'Hak verme'); }
            else if (x.h.durum === 'kullanildi') { rozet = '<span class="md-hd kul">Kullanıldı</span>'; metin = mdTR(x.h.kullanim) + ' telafi dersiyle'; btn = ''; }
            else { rozet = '<span class="md-hd dus">Süresi doldu</span>'; metin = mdTR(x.h.bitis) + ' tarihinde düştü'; btn = dugme.call(d, 'uzat', 'Süreyi uzat'); }
            return '<div class="md-hs"><div class="md-hs-t"><b>' + mdKisaTR(x.iso) + ' ' + ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][new Date(x.iso + 'T12:00:00').getDay()] + '</b><small>' + MD_DURUM[x.s].ikon + ' ' + (x.s === 'y' ? 'Gelmedi (habersiz)' : MD_DURUM[x.s].ad) + '</small></div><div class="md-hs-m">' + rozet + metin + '</div>' + btn + '</div>';
        }).join('') + '</div>'
        + (o.fazla.length ? '<div class="md-alt">Açık hak olmadan yapılan telafi dersi: ' + o.fazla.map(function (r) { return mdTR(r.iso); }).join(', ') + ' (pakete sayılmadı).</div>' : '') + '</div>';
}
// Programda bu öğrencinin dersi olan günler (takvimde halka) — slot.gunler: 0=Pazar … 6=Cumartesi
function mdDersGunleri(u) {
    let g = {}; MD.slotlar.forEach(function (s) { if ((s.katilimcilar || []).some(function (k) { return k.grup === u.grup && k.ad === u.ad; })) (s.gunler && s.gunler.length ? s.gunler : [s.gun]).forEach(function (x) { g[+x] = (g[+x] || []).concat([s.baslangicSaat || '']); }); });
    return g;
}

// ---------------- yazma
async function mdGunYaz(u, iso, s) {
    let eski = mdGun(u, iso), anahtar = iso + '|' + u.ad;
    if (s === null) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: iso, ad: u.ad }) });
    else await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: iso, ad: u.ad, grup: u.grup, saat: '12:00', elle: true, geldi: s === 'g' || s === 't' }) });
    if (s === null) delete (MD.att[iso] || {})[u.ad]; else (MD.att[iso] = MD.att[iso] || {})[u.ad] = { geldi: s === 'g' || s === 't', grup: u.grup, saat: '12:00' };
    let ek = s === 'h' ? 'hasta' : s === 'm' ? 'haber' : s === 't' ? 'telafi' : s === 'k' ? 'baska' : null, mevcut = MD.durum[anahtar];
    if (ek || (mevcut && !mevcut.sil && mevcut.d)) {
        let kayit = {}; kayit[anahtar] = ek ? Object.assign({ d: ek, t: Date.now() }, s === 'k' && mdGunYaz.ref ? { ref: mdGunYaz.ref } : {}) : { d: null, sil: true, t: Date.now() };
        MD.durum[anahtar] = kayit[anahtar]; MD.durum = await mdMetaYaz('yoklama_durum', kayit);
    }
    return eski;
}

// ---------------- ekran
async function mdDefterAc(grup, ad) {
    mdCss();
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    if (!MD.yuklendi) { alan.innerHTML = '<div class="md-yuk">Yükleniyor…</div>'; try { await mdYukle(); } catch (e) { alan.innerHTML = '<div class="md-yuk">Yüklenemedi — bağlantını kontrol et.</div>'; return; } }
    if (grup && ad) { MD.secili = grup + '|' + ad; MD.ay = null; }
    MD.ekran = MD.acilacak || 'liste'; MD.acilacak = null; mdCiz(); // acilacak: Yoklama'dan 'cizelge' ile gelinebilir
}
function mdUye(k) { return MD.uyeler.find(function (u) { return mdKey(u) === k; }); }
function mdCiz(korunsun) {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    let y = korunsun ? (alan.scrollTop || 0) : 0, wy = korunsun ? window.scrollY : 0;
    if (MD.ekran === 'aktarim') alan.innerHTML = mdAktarimHTML();
    else if (MD.ekran === 'cizelge') alan.innerHTML = mdCizelgeHTML();
    else alan.innerHTML = '<div class="md">' + mdListeHTML() + '<div class="md-detay" id="md-detay">' + (MD.secili && mdUye(MD.secili) ? mdDetayHTML(mdUye(MD.secili)) : '<div class="md-bos">👈 Bir öğrenci seç — takvim, paketler, telafi ve ödemeler burada.</div>') + '</div></div>';
    if (korunsun) { alan.scrollTop = y; window.scrollTo(0, wy); }
}
// Sadece sağ tarafı yenile (liste ve kaydırma yerinde kalsın — "sayfa en üste çıkıyor" sorunu)
function mdDetayYenile() {
    let d = document.getElementById('md-detay'), u = mdUye(MD.secili); if (!d || !u) return mdCiz(true);
    let alan = document.getElementById('milo-icerik'), y = alan ? alan.scrollTop : 0, wy = window.scrollY;
    d.innerHTML = mdDetayHTML(u);
    let sat = document.querySelector('.md-sat[data-k="' + CSS.escape(MD.secili) + '"] .md-sat-alt'); if (sat) sat.innerHTML = mdSatirAlt(u);
    if (alan) alan.scrollTop = y; window.scrollTo(0, wy);
}
function mdSatirAlt(u) { let o = mdOzet(u), p = o.son; return (p ? 'Paket ' + p.no + ' · ' + p.dersler.length + '/8' : 'kayıt yok') + (o.hak ? ' · <b class="md-turuncu">' + o.hak + ' telafi</b>' : '') + (o.uyarilar.some(function (x) { return x.tur === 'odeme'; }) ? ' · <b class="md-kirmizi">ödeme</b>' : ''); }
function mdListeHTML() {
    let q = (MD.ara || '').toLocaleLowerCase('tr'), l = MD.uyeler.filter(function (u) { return !u.pasif && (!q || u.ad.toLocaleLowerCase('tr').indexOf(q) !== -1); }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
    let aktarim = '';
    try { if (!MD.kagitBitti && !localStorage.getItem('milo_kagit_aktarim_2026_10')) aktarim = '<button class="md-btn ana genis" onclick="mdAktarimAc()">📋 Kâğıt çizelgeyi aktar (okundu, onay bekliyor)</button>'; } catch (e) {}
    return '<div class="md-liste"><div class="md-baslik">📒 Öğrenci Defteri</div>' + aktarim + '<button class="md-btn genis" onclick="mdCizelgeAc()">🗓 Geçmiş yoklama gir (çizelge)</button>'
        + mdPaketKartHTML()
        + '<input class="md-ara" placeholder="🔍 Öğrenci ara…" value="' + miloEsc(MD.ara) + '" oninput="MD.ara=this.value; mdListeYenile()">'
        + '<div class="md-satirlar" id="md-satirlar">' + mdSatirlarHTML(l) + '</div></div>';
}
function mdSatirlarHTML(l) { return l.map(function (u) { let k = mdKey(u); return '<button class="md-sat' + (MD.secili === k ? ' secili' : '') + '" data-k="' + miloEsc(k) + '" onclick="mdSec(\'' + mdEnc(k) + '\')"><b>' + miloEsc(u.ad) + '</b><small>' + miloEsc(u.grup) + '</small><span class="md-sat-alt">' + mdSatirAlt(u) + '</span></button>'; }).join('') || '<div class="md-bos">Öğrenci yok.</div>'; }
function mdListeYenile() { let q = (MD.ara || '').toLocaleLowerCase('tr'), el = document.getElementById('md-satirlar'); if (el) el.innerHTML = mdSatirlarHTML(MD.uyeler.filter(function (u) { return !u.pasif && (!q || u.ad.toLocaleLowerCase('tr').indexOf(q) !== -1); }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); })); }
function mdSec(kEnc) {
    MD.secili = decodeURIComponent(kEnc); MD.ay = null; MD.secim = null;
    document.querySelectorAll('.md-sat').forEach(function (b) { b.classList.toggle('secili', b.dataset.k === MD.secili); });
    mdDetayYenile();
    let d = document.getElementById('md-detay'); if (d && window.innerWidth < 860) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function mdAylar(u, o) {
    let bas = o.ilk || u.katilmaTarihi || mdIso(new Date()), b = new Date(bas.slice(0, 7) + '-01T12:00:00'), s = new Date(); s.setDate(1); s.setMonth(s.getMonth() + 1);
    let l = []; while (b <= s && l.length < 24) { l.push(mdIso(b).slice(0, 7)); b.setMonth(b.getMonth() + 1); }
    return l;
}
function mdDetayHTML(u) {
    let o = mdOzet(u), aylar = mdAylar(u, o);
    if (!MD.ay || aylar.indexOf(MD.ay) === -1) MD.ay = mdIso(new Date()).slice(0, 7);
    if (aylar.indexOf(MD.ay) === -1) MD.ay = aylar[aylar.length - 1];
    let yas = typeof miloYasMetin === 'function' && u.dogumTarihi ? miloYasMetin(u.dogumTarihi) : '';
    let kutu = function (n, ad, cls) { return '<div class="md-kutu ' + (cls || '') + '"><b>' + n + '</b><small>' + ad + '</small></div>'; };
    let p = o.son;
    return '<div class="md-ust"><div><div class="md-ad">' + miloEsc(u.ad) + '</div><div class="md-alt">' + miloEsc(u.grup) + (yas ? ' · ' + miloEsc(yas) : '') + (o.ilk ? ' · ilk ders ' + mdTR(o.ilk) : '') + (o.sonGelis ? ' · son geliş ' + mdTR(o.sonGelis) : '') + '</div></div>'
        + '<span style="display:flex;gap:8px;flex-wrap:wrap"><button class="md-btn" onclick="mdOgrenciPdf(\'' + mdEnc(mdKey(u)) + '\')">📄 Öğrenci raporu PDF</button>' + (u.acilTelefon ? '<button class="md-btn" onclick="mdVeliMesaj(\'' + mdEnc(mdKey(u)) + '\')">💬 Veliye özet</button>' : '') + '</span></div>'
        + '<div class="md-kutular">' + kutu(o.say.g + o.say.t, 'geldi', 'g') + kutu(o.say.y, 'gelmedi', 'y') + kutu(o.say.m, 'haber verdi', 'm') + kutu(o.say.h, 'hasta', 'h') + kutu(o.say.t, 'telafi yaptı', 't') + kutu(o.hak, 'açık telafi hakkı', o.hak ? 'uyari' : '') + kutu(p ? p.dersler.length + '/8' : '—', p ? 'paket ' + p.no : 'paket', '') + '</div>'
        + mdPaketUyariHTML(u)
        + o.uyarilar.map(function (w) { return '<div class="md-uyari ' + w.tur + '">' + (w.tur === 'telafi' ? '🔁 ' : '💰 ') + miloEsc(w.metin) + '</div>'; }).join('')
        + '<div class="md-bolum"><div class="md-bolum-bas">🗓 Yoklama takvimi <small>güne dokun → durum seç · halkalı günler programdaki ders günleri</small></div>'
        + '<div class="md-aylar">' + aylar.map(function (a) { let say = o.kayit.filter(function (r) { return r.iso.slice(0, 7) === a; }).length; return '<button class="' + (a === MD.ay ? 'aktif' : '') + '" onclick="MD.ay=\'' + a + '\'; MD.secim=null; mdDetayYenile()">' + MD_AY[+a.slice(5) - 1] + (a.slice(0, 4) !== String(new Date().getFullYear()) ? ' ' + a.slice(0, 4) : '') + (say ? ' <i>' + say + '</i>' : '') + '</button>'; }).join('') + '</div>'
        + mdTakvimHTML(u) + '<div class="md-lejant">' + Object.keys(MD_DURUM).map(function (k) { return '<span class="' + MD_DURUM[k].cls + '"><i>' + MD_DURUM[k].ikon + '</i>' + MD_DURUM[k].ad + '</span>'; }).join('') + '</div></div>'
        + mdHakHTML(u, o)
        + '<div class="md-bolum"><div class="md-bolum-bas">📦 Paketler (8 ders) <small>telafi dersleri pakete sayılmaz</small></div>' + (o.paketler.length ? o.paketler.slice().reverse().map(function (pk) { return mdPaketHTML(u, pk); }).join('') : '<div class="md-bos">Henüz yoklama yok — takvimden gün işaretle.</div>') + '</div>'
        + '<div class="md-bolum"><div class="md-bolum-bas">💰 Ödemeler</div>' + (o.odemeler.length ? '<div class="md-odemeler">' + o.odemeler.map(function (x) { return '<div><b>Paket ' + x.no + '</b><span>' + (x.tarih ? mdTR(x.tarih) : 'tarih yok') + '</span><span>' + (x.tutar ? x.tutar + ' ₺' : '') + '</span><small>' + miloEsc(x.not || '') + '</small></div>'; }).join('') + '</div>' : '<div class="md-bos">Paket ödemesi girilmedi.</div>')
        + mdAylikAidatHTML(u) + '</div>';
}
function mdAylikAidatHTML(u) {
    let l = MD.dues.filter(function (d) { return d.ad === u.ad && (d.odendi || d.notMetin); }).sort(function (a, b) { return b.ay.localeCompare(a.ay); });
    if (!l.length) return '';
    return '<div class="md-alt" style="margin-top:8px">Aidat sekmesindeki aylık kayıtlar: ' + l.map(function (d) { return miloEsc(MD_AY[+d.ay.slice(5) - 1] + ' ' + d.ay.slice(0, 4)) + (d.odendi ? ' ✓ ' + (d.tutar || '') + '₺' : '') + (d.notMetin ? ' (' + miloEsc(d.notMetin) + ')' : ''); }).join(' · ') + '</div>';
}
function mdTakvimHTML(u) {
    let a = MD.ay, ilk = new Date(a + '-01T12:00:00'), gunSay = new Date(ilk.getFullYear(), ilk.getMonth() + 1, 0).getDate(), bos = (ilk.getDay() + 6) % 7, dg = mdDersGunleri(u), bugun = mdIso(new Date());
    let h = '<div class="md-takvim">' + ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(function (g) { return '<div class="md-gb">' + g + '</div>'; }).join('');
    for (let i = 0; i < bos; i++) h += '<div></div>';
    for (let d = 1; d <= gunSay; d++) {
        let iso = a + '-' + String(d).padStart(2, '0'), s = mdGun(u, iso), wd = new Date(iso + 'T12:00:00').getDay(), once = !!(u.katilmaTarihi && iso < u.katilmaTarihi), ders = !!dg[wd] && !once, gelecek = iso > bugun;
        h += '<button class="md-gun' + (s ? ' ' + MD_DURUM[s].cls : '') + (ders ? ' ders' : '') + (iso === bugun ? ' bugun' : '') + (once && !s ? ' once' : '') + (MD.secim === iso ? ' acik' : '') + '"' + (gelecek ? ' disabled' : '') + ' onclick="mdGunSec(\'' + iso + '\')" aria-label="' + d + ' ' + MD_AY[ilk.getMonth()] + (s ? ' ' + MD_DURUM[s].ad : '') + '"><span>' + d + '</span>' + (s ? '<i>' + MD_DURUM[s].ikon + '</i>' : '') + '</button>';
    }
    h += '</div>';
    if (MD.secim && MD.secim.slice(0, 7) === a) {
        let s = mdGun(u, MD.secim);
        h += '<div class="md-secici"><b>' + mdTR(MD.secim) + '</b>' + Object.keys(MD_DURUM).map(function (k) { return '<button class="' + MD_DURUM[k].cls + (s === k ? ' aktif' : '') + '" onclick="mdDurumSec(\'' + k + '\')">' + MD_DURUM[k].ikon + ' ' + MD_DURUM[k].ad + '</button>'; }).join('') + '<button class="bos" onclick="mdDurumSec(null)">⌫ Boşalt</button><button class="kapat" onclick="MD.secim=null; mdDetayYenile()">✕</button></div>';
    }
    return h;
}
function mdGunSec(iso) { MD.secim = MD.secim === iso ? null : iso; mdDetayYenile(); }
async function mdDurumSec(s) {
    let u = mdUye(MD.secili), iso = MD.secim; if (!u || !iso) return;
    if (s === 'k') return mdBaskaGunSor(u, iso);
    try { await mdGunYaz(u, iso, s); } catch (e) { showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); return; }
    MD.secim = null; mdDetayYenile();
    let o = mdOzet(u), w = o.uyarilar.find(function (x) { return x.tur === 'telafi'; });
    showToast(s ? mdTR(iso) + ': ' + MD_DURUM[s].ad : mdTR(iso) + ' boşaltıldı', 'success');
    if (w && (s === 'm' || s === 'h')) setTimeout(function () { showToast('🔁 ' + w.metin, 'warning'); }, 900);
    if (s === 'y' && iso >= MD_KURAL_TARIH) setTimeout(function () { showToast('✕ Habersiz gelmedi: telafi hakkı yok. Haber verdiyse 📞 Haber verdi seç.', 'info'); }, 900);
}
function mdBaskaGunSor(u, iso) {
    let bugun = mdIso(new Date()), vars = iso < bugun ? bugun : mdIso(new Date(Date.now() - 864e5));
    onayIste('<div style="text-align:left"><b>↪ ' + miloEsc(u.ad) + ' başka gün geldi</b><div style="font-size:13px;opacity:.8;margin:6px 0 10px">' + mdTR(iso) + ' dersine gelmedi ama başka bir gün geldi. Hangi gün?</div><input type="date" id="md-bg-tarih" class="milo-input" max="' + bugun + '" value="' + vars + '" style="width:100%"></div>',
        async function () {
            let t = (document.getElementById('md-bg-tarih') || {}).value; if (!t || t === iso || t > bugun) return showToast('Geçerli, farklı bir gün seç.', 'warning');
            try { mdGunYaz.ref = t; await mdGunYaz(u, iso, 'k'); mdGunYaz.ref = null; if (mdGun(u, t) !== 'g' && mdGun(u, t) !== 't') await mdGunYaz(u, t, 'g'); }
            catch (e) { mdGunYaz.ref = null; return showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); }
            MD.secim = null; mdDetayYenile(); showToast('↪ ' + mdTR(t) + ' geldi olarak kaydedildi', 'success');
        }, '↪ Kaydet', 'Vazgeç');
}
function mdPaketHTML(u, p) {
    let o = p.odeme || {}, k = mdEnc(mdKey(u) + '|' + p.no);
    let nokta = p.dersler.map(function (r) { return '<span class="md-n ' + MD_DURUM[r.s].cls + '" title="' + mdTR(r.iso) + ' · ' + MD_DURUM[r.s].ad + '">' + MD_DURUM[r.s].ikon + '<small>' + mdKisaTR(r.iso) + '</small></span>'; }).join('')
        + Array.from({ length: Math.max(0, 8 - p.dersler.length) }, function () { return '<span class="md-n bos"><small>—</small></span>'; }).join('')
        + p.telafiler.map(function (r) { return '<span class="md-n t" title="Telafi ' + mdTR(r.iso) + '">🔁<small>' + mdKisaTR(r.iso) + '</small></span>'; }).join('')
        + Array.from({ length: p.kalanHak }, function () { return '<span class="md-n hak" title="Açık telafi hakkı">🔁<small>açık</small></span>'; }).join('');
    let durum = (p.dolu ? '<b class="md-yesil">8/8 ders işlendi</b>' : p.dersler.length + '/8 ders işlendi') + (p.kalanHak ? ' · <b class="md-turuncu">' + p.kalanHak + ' telafi hakkı açık</b>' : '');
    return '<div class="md-paket' + (p.dolu && !p.kalanHak ? ' bitti' : '') + '"><div class="md-paket-bas"><b>Paket ' + p.no + '</b><span>' + mdTR(p.bas) + (p.bit && p.bit !== p.bas ? ' → ' + mdTR(p.bit) : '') + '</span><span>' + durum + ' · geldi ' + p.geldi + '</span></div>'
        + '<div class="md-noktalar">' + nokta + '</div>'
        + '<div class="md-odeme"><input type="number" inputmode="numeric" placeholder="Tutar ₺" value="' + (o.tutar || '') + '" id="md-o-tutar-' + p.no + '"><label><input type="checkbox" id="md-o-odendi-' + p.no + '"' + (o.odendi ? ' checked' : '') + '> Ödendi</label><input type="date" id="md-o-tarih-' + p.no + '" value="' + (o.odemeTarihi || '') + '" max="' + mdIso(new Date()) + '">'
        + '<input type="text" id="md-o-not-' + p.no + '" placeholder="Not: forma ile beraber, eksik…" value="' + miloEsc(o.not || '') + '"><button class="md-btn ana" onclick="mdOdemeKaydet(\'' + k + '\',' + p.no + ')">Kaydet</button></div></div>';
}
async function mdOdemeKaydet(kEnc, no) {
    let k = decodeURIComponent(kEnc), v = function (id) { let e = document.getElementById(id + no); return e ? e : {}; };
    let tutar = parseInt(v('md-o-tutar-').value, 10) || null, odendi = !!v('md-o-odendi-').checked, tarih = v('md-o-tarih-').value || null, not = (v('md-o-not-').value || '').trim() || null;
    if (tutar && !odendi) odendi = true;
    if (odendi && !tarih) tarih = mdIso(new Date());
    let kayit = {}; kayit[k] = { odendi: odendi, tutar: tutar, odemeTarihi: tarih, not: not, t: Date.now() };
    try { MD.odeme = await mdMetaYaz('paket_odeme', kayit); } catch (e) { showToast('Kaydedilemedi.', 'error'); return; }
    showToast('💰 Paket ' + no + ' ödemesi kaydedildi', 'success'); mdDetayYenile();
}
// ---- 📦 Paket bitiyor hatırlatması (2026-10-27, kullanıcı: "7. derste veliye 'Son dersiniz yaklaşıyor, yeni paket' mesajı hazır olsun.
// Telafi hakkı varsa onu da yazsın"). Son paketi 7 ya da 8 derse ulaşan ve sıradaki paketi henüz ödenmemiş öğrenciler; mesaj hazır,
// tek dokunuşla WhatsApp. Gönderilen: meta 'paket_hatirlatma' { 'grup|ad|paketNo': { t } } → her cihazda "✓ gönderildi" görünür.
// Paket bitmiş, telafi hakkı da yok ve 45+ gündür gelmiyorsa (ayrılmış olabilir) listeye girmez.
function mdPaketBitenler() {
    let bugun = mdIso(new Date());
    return MD.uyeler.filter(function (u) { return !u.pasif; }).map(function (u) {
        let o = mdOzet(u), p = o.son; if (!p || p.dersler.length < 7) return null;
        let sonraki = MD.odeme[mdKey(u) + '|' + (p.no + 1)]; if (sonraki && sonraki.odendi) return null;
        if (p.dolu && !o.hak && p.bit && (new Date(bugun) - new Date(p.bit)) / 864e5 > 45) return null;
        let h = (MD.hatirlatma || {})[mdKey(u) + '|' + p.no];
        return { u: u, o: o, p: p, kalan: Math.max(0, 8 - p.dersler.length), hak: o.hak, gonderildi: h && h.t ? h.t : null };
    }).filter(Boolean).sort(function (a, b) { return (a.gonderildi ? 1 : 0) - (b.gonderildi ? 1 : 0) || a.kalan - b.kalan || a.u.ad.localeCompare(b.u.ad, 'tr'); });
}
function mdPaketBul(u) { return mdPaketBitenler().find(function (x) { return x.u === u; }) || null; }
function mdPaketMesaj(x) {
    let ilk = typeof miloIlkAdBuyuk === 'function' ? miloIlkAdBuyuk(x.u.ad) : x.u.ad.split(' ')[0], p = x.p;
    let son = x.o.odemeler.filter(function (o) { return o.tutar; }).pop();
    return 'Merhaba 🌟 MILO FITT KIDS\'ten yazıyoruz.\n\n' + ilk + ' için kısa bilgi:\n'
        + '• ' + p.no + '. paket: ' + p.dersler.length + '/8 ders tamamlandı' + (x.kalan === 1 ? ', son 1 dersi kaldı.' : x.kalan ? ', ' + x.kalan + ' dersi kaldı.' : '.') + '\n'
        + (x.hak ? '• 🔁 ' + x.hak + ' telafi hakkı var (' + mdTR(x.o.acikHaklar.map(function (h) { return h.bitis; }).sort()[0]) + ' tarihine kadar): uygun bir derste telafi yapabiliriz.\n' : '')
        + '\n' + (x.kalan ? 'Son dersiniz yaklaşıyor 💛 Derslere ara vermeden devam etmek için yeni paketi (8 ders) şimdiden yenileyebilirsiniz.' : 'Paketiniz tamamlandı 💛 Derslere ara vermeden devam etmek için yeni paketi (8 ders) yenileyebilirsiniz.')
        + (son ? '\nPaket ücreti: ' + son.tutar + ' ₺' : '') + '\n\nSorunuz olursa buradan yazabilirsiniz. Görüşmek üzere!';
}
async function mdPaketHatirlat(kEnc) {
    let u = mdUye(decodeURIComponent(kEnc)), x = u && mdPaketBul(u); if (!x) return;
    let msg = mdPaketMesaj(x), tel = String(u.acilTelefon || u.veli2Telefon || '').replace(/\D/g, '');
    if (tel.startsWith('0')) tel = '90' + tel.slice(1); else if (tel && !tel.startsWith('90')) tel = '90' + tel;
    if (tel) window.open('https://api.whatsapp.com/send?phone=' + tel + '&text=' + encodeURIComponent(msg), '_blank');
    else { try { await navigator.clipboard.writeText(msg); showToast('Veli telefonu yok — mesaj kopyalandı, kendin yapıştır.', 'warning'); } catch (e) { showToast('Veli telefonu yok.', 'warning'); } }
    let kayit = {}; kayit[mdKey(u) + '|' + x.p.no] = { t: Date.now() };
    try { MD.hatirlatma = await mdMetaYaz('paket_hatirlatma', kayit); } catch (e) { MD.hatirlatma = Object.assign({}, MD.hatirlatma, kayit); }
    mdCiz(true);
}
function mdPaketDurum(x) { return x.p.no + '. paket · ' + x.p.dersler.length + '/8' + (x.kalan === 1 ? ' · son ders' : !x.kalan ? ' · bitti' : '') + (x.hak ? ' · 🔁 ' + x.hak + ' telafi' : ''); }
function mdPaketKartHTML() {
    let l = mdPaketBitenler(); if (!l.length) return '';
    let bekleyen = l.filter(function (x) { return !x.gonderildi; }).length;
    return '<div class="md-ph"><div class="md-ph-bas">📦 Paketi bitiyor <small>' + (bekleyen ? bekleyen + ' veliye hatırlatma hazır' : 'hepsine gönderildi') + '</small></div>'
        + l.map(function (x) { let k = mdEnc(mdKey(x.u));
            return '<div class="md-ph-s' + (x.gonderildi ? ' gitti' : '') + '"><button class="md-ph-ad" onclick="mdSec(\'' + k + '\')"><b>' + miloEsc(x.u.ad) + '</b><small>' + miloEsc(mdPaketDurum(x)) + '</small></button>'
                + '<button class="md-btn' + (x.gonderildi ? '' : ' ana') + '" onclick="mdPaketHatirlat(\'' + k + '\')">' + (x.gonderildi ? '✓ ' + mdKisaTR(mdIso(new Date(x.gonderildi))) + ' · tekrar' : '💬 Hatırlat') + '</button></div>'; }).join('') + '</div>';
}
function mdPaketUyariHTML(u) {
    let x = mdPaketBul(u); if (!x) return '';
    return '<div class="md-uyari paket">📦 ' + (x.kalan ? 'Son ' + (x.kalan === 1 ? 'ders' : x.kalan + ' ders') + ' kaldı' : 'Paket bitti') + ' — yeni paket hatırlatması' + (x.hak ? ' (' + x.hak + ' telafi hakkıyla)' : '') + ' hazır.'
        + ' <button class="md-btn ana" onclick="mdPaketHatirlat(\'' + mdEnc(mdKey(u)) + '\')">' + (x.gonderildi ? '✓ Gönderildi · tekrar' : '💬 Veliye gönder') + '</button></div>';
}
// Genel Bakış "dikkat" listesi (yonetim-panel ekDikkat): Defter verisi yoksa bir kez arka planda yüklenir, sonra yeniden çizilir
let _mdPaketDikkatYuk = false;
function mdPaketDikkat() {
    if (!MD.yuklendi) { if (!_mdPaketDikkatYuk) { _mdPaketDikkatYuk = true; mdYukle().then(function () { if (typeof miloAktifSekme !== 'undefined' && miloAktifSekme === 'genel' && typeof mgbCiz === 'function') mgbCiz(); }).catch(function () {}); } return []; }
    let l = mdPaketBitenler().filter(function (x) { return !x.gonderildi; }); if (!l.length) return [];
    return [{ renk: 'var(--ap-uyari)', baslik: l.length + ' öğrencinin paketi bitiyor', alt: l.slice(0, 4).map(function (x) { return miloEsc(x.u.ad.split(' ')[0]) + ' ' + x.p.dersler.length + '/8'; }).join(', ') + (l.length > 4 ? '…' : '') + ' · yeni paket mesajı hazır', dugme: ['Hatırlat', "miloSekme('defter')"] }];
}
function mdVeliMesaj(kEnc) {
    let u = mdUye(decodeURIComponent(kEnc)); if (!u) return; let o = mdOzet(u), p = o.son;
    let ilk = typeof miloIlkAdBuyuk === 'function' ? miloIlkAdBuyuk(u.ad) : u.ad.split(' ')[0];
    let msg = 'Merhaba 🌟 MILO FITT KIDS\'ten yazıyoruz.\n\n' + ilk + ' için kısa özet:\n• Toplam ' + (o.say.g + o.say.t) + ' derse katıldı' + (o.say.t ? ' (' + o.say.t + ' telafi)' : '') + '\n'
        + (p ? '• Paket ' + p.no + ': ' + p.dersler.length + '/8 ders' + (p.kalanHak ? ' · ' + p.kalanHak + ' telafi hakkı var' : '') + '\n' : '')
        + (o.sonGelis ? '• Son geldiği ders: ' + mdTR(o.sonGelis) + '\n' : '') + '\nGörüşmek üzere! 💛';
    let tel = String(u.acilTelefon || '').replace(/\D/g, ''); if (tel.startsWith('0')) tel = '90' + tel.slice(1); else if (tel && !tel.startsWith('90')) tel = '90' + tel;
    window.open((tel ? 'https://api.whatsapp.com/send?phone=' + tel + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
}


// ================================================================================================
// 📄 YOKLAMA RAPORU PDF + ÖĞRENCİ RAPORU PDF (2026-10-15, kullanıcı: "PDF çıktısı neden yok? güzel detaylı olsun").
// "A · Sade" görünüm: beyaz kâğıt, ince başlık çizgisi, petrol yeşili; durum renkleri ekrandakiyle aynı.
// Yoklama raporu (yatay): seçili dönem (Yoklama ekranındaki hafta/ay) — özet kutuları, gün gün katılım grafiği, grup
// çubukları, en çok gelen / en uzun süredir yok, öğrenci tablosu (paket, geldi/gelmedi/hasta/telafi, açık hak, son geliş,
// paket ödemesi) + gün gün çizelge. Öğrenci raporu (dikey): özet, son aylar takvimi, paketler, ödemeler — veliye verilebilir.
// ================================================================================================
const MD_PDF_RENK = { g: [19, 138, 128], y: [180, 55, 47], m: [37, 99, 235], h: [109, 75, 184], t: [138, 90, 0], k: [107, 121, 118] };
function mdPdfBaslik(pdf, T, mx, uw, y, baslik, rozet) {
    pdf.setTextColor(27, 36, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(17); pdf.text(T(baslik), mx, y + 8);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(107, 121, 118); pdf.text('MILO FITT KIDS', mx, y + 14);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(15, 111, 103); pdf.text(T(rozet || ''), mx + uw, y + 8, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(107, 121, 118); pdf.text(T('Hazırlanma: ') + new Date().toLocaleDateString('tr-TR'), mx + uw, y + 14, { align: 'right' });
    pdf.setDrawColor(27, 36, 34); pdf.setLineWidth(0.5); pdf.line(mx, y + 17.5, mx + uw, y + 17.5);
    return y + 25;
}
function mdPdfAlt(pdf, T, W, H) {
    let n = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(154, 165, 162); pdf.text('Milo Fitt Kids', 14, H - 8); pdf.text(i + ' / ' + n, W - 14, H - 8, { align: 'right' }); }
}
function mdPdfKutu(pdf, T, x, y, w, sayi, ad, renk) {
    pdf.setDrawColor(228, 233, 231); pdf.setLineWidth(0.3); pdf.roundedRect(x, y, w, 17, 2, 2, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor.apply(pdf, renk || [27, 36, 34]); pdf.text(String(sayi), x + 4, y + 9.5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(107, 121, 118); pdf.text(T(ad), x + 4, y + 14.3);
}
async function mdYoklamaRaporPdf(bas, bit, donemAd) {
    if (typeof _miloYeniPdfAl !== 'function') return showToast('PDF aracı yüklenemedi.', 'error');
    showToast('📄 Yoklama raporu hazırlanıyor…', 'success');
    try { if (!MD.yuklendi) await mdYukle(); } catch (e) { return showToast('Veri yüklenemedi.', 'error'); }
    let bugun = mdIso(new Date()); if (bit > bugun) bit = bugun;
    let gunler = []; for (let d = new Date(bas + 'T12:00:00'); mdIso(d) <= bit; d.setDate(d.getDate() + 1)) gunler.push(mdIso(d));
    let aktif = MD.uyeler.filter(function (u) { return !u.pasif; }).sort(function (a, b) { return String(a.grup).localeCompare(String(b.grup), 'tr') || a.ad.localeCompare(b.ad, 'tr'); });
    let satir = aktif.map(function (u) {
        let say = { g: 0, y: 0, m: 0, h: 0, t: 0, k: 0 }, gun = {}; gunler.forEach(function (iso) { let s = mdGun(u, iso); if (s) { say[s]++; gun[iso] = s; } });
        let o = mdOzet(u), p = o.son, son = o.sonGelis;
        return { u: u, say: say, gun: gun, gel: say.g + say.t, paket: p ? p.no + ' · ' + p.dersler.length + '/8' : '—', hak: o.hak, son: son, odendi: p && p.odeme && p.odeme.odendi };
    });
    let dersGunleri = gunler.filter(function (iso) { return satir.some(function (r) { return r.gun[iso]; }); });
    let toplamGel = satir.reduce(function (a, r) { return a + r.gel; }, 0), gelen = satir.filter(function (r) { return r.gel; }).length;
    let hasta = satir.reduce(function (a, r) { return a + r.say.h; }, 0), telafi = satir.reduce(function (a, r) { return a + r.say.t; }, 0), gelmedi = satir.reduce(function (a, r) { return a + r.say.y + r.say.m; }, 0);
    let pdf = await _miloYeniPdfAl('landscape'), T = typeof _miloTrTranslit === 'function' ? _miloTrTranslit : function (s) { return s; }, W = 297, H = 210, mx = 14, uw = W - 28;
    let y = mdPdfBaslik(pdf, T, mx, uw, 10, 'Yoklama Raporu', donemAd);
    // özet kutuları
    let kutular = [[dersGunleri.length, 'ders günü'], [toplamGel, 'toplam katılım', MD_PDF_RENK.g], [dersGunleri.length ? (toplamGel / dersGunleri.length).toFixed(1).replace('.', ',') : '0', 'günlük ortalama'], [gelen + ' / ' + aktif.length, 'gelen öğrenci'], [gelmedi, 'gelmedi', MD_PDF_RENK.y], [hasta, 'hasta', MD_PDF_RENK.h], [telafi, 'telafi dersi', MD_PDF_RENK.t], [aktif.length - gelen, 'hiç gelmeyen', MD_PDF_RENK.y]];
    let kw = (uw - 7 * 3) / 8; kutular.forEach(function (k, i) { mdPdfKutu(pdf, T, mx + i * (kw + 3), y, kw, k[0], k[1], k[2]); });
    y += 24;
    // gün gün grafik (sol) + gruplar (sağ)
    let gx = mx, gw = uw * 0.6, gh = 40, maks = Math.max(1, ...gunler.map(function (iso) { return satir.filter(function (r) { return r.gun[iso] === 'g' || r.gun[iso] === 't'; }).length; }));
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(27, 36, 34); pdf.text(T('Gün gün katılım'), gx, y + 3);
    let gy = y + 6, bw = gw / Math.max(1, gunler.length);
    pdf.setDrawColor(228, 233, 231); pdf.setLineWidth(0.2); [0, 0.5, 1].forEach(function (f) { pdf.line(gx, gy + gh - gh * f, gx + gw, gy + gh - gh * f); });
    gunler.forEach(function (iso, i) {
        let n = satir.filter(function (r) { return r.gun[iso] === 'g' || r.gun[iso] === 't'; }).length, h = n / maks * (gh - 4), x = gx + i * bw, dt = new Date(iso + 'T12:00:00');
        if (h > 0) { pdf.setFillColor(19, 138, 128); pdf.rect(x + bw * 0.18, gy + gh - h, bw * 0.64, h, 'F'); if (bw > 4.5) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.8); pdf.setTextColor(27, 36, 34); pdf.text(String(n), x + bw / 2, gy + gh - h - 1, { align: 'center' }); } }
        if (bw > 3.6 || i % 2 === 0) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.2); pdf.setTextColor(140, 150, 147); pdf.text(String(dt.getDate()), x + bw / 2, gy + gh + 3.5, { align: 'center' }); }
    });
    let rx = mx + gw + 10, rw = uw - gw - 10, gruplar = {};
    satir.forEach(function (r) { let g = r.u.grup || 'Grup yok'; gruplar[g] = gruplar[g] || { a: 0, g: 0 }; gruplar[g].a++; if (r.gel) gruplar[g].g++; });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(27, 36, 34); pdf.text(T('Gruplara göre (gelen / aktif)'), rx, y + 3);
    let ry = y + 8; Object.keys(gruplar).sort(function (a, b) { return a.localeCompare(b, 'tr'); }).slice(0, 8).forEach(function (g) {
        let x = gruplar[g], oran = x.a ? x.g / x.a : 0;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(46, 57, 54); pdf.text(T(g).slice(0, 22), rx, ry + 3);
        pdf.setFillColor(243, 246, 245); pdf.roundedRect(rx + 34, ry, rw - 52, 3.6, 1, 1, 'F');
        if (oran > 0) { pdf.setFillColor(19, 138, 128); pdf.roundedRect(rx + 34, ry, Math.max(2, (rw - 52) * oran), 3.6, 1, 1, 'F'); }
        pdf.setTextColor(107, 121, 118); pdf.text(x.g + ' / ' + x.a, rx + rw, ry + 3, { align: 'right' }); ry += 5.4;
    });
    y = gy + gh + 9;
    // en çok gelen / en uzun süredir yok
    let cok = satir.filter(function (r) { return r.gel; }).sort(function (a, b) { return b.gel - a.gel; }).slice(0, 6);
    let uzun = satir.slice().sort(function (a, b) { return String(a.son || '').localeCompare(String(b.son || '')); }).slice(0, 6);
    let lw = uw / 2 - 5;
    [[cok, 'En çok gelenler', function (r) { return r.gel + ' ders'; }, MD_PDF_RENK.g], [uzun, 'En uzun süredir gelmeyenler', function (r) { return r.son ? mdTR(r.son) : 'hiç'; }, MD_PDF_RENK.y]].forEach(function (b, k) {
        let x = mx + k * (lw + 10), yy = y;
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor.apply(pdf, b[3]); pdf.text(T(b[1]), x, yy); yy += 4.5;
        b[0].forEach(function (r) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.3); pdf.setTextColor(46, 57, 54); pdf.text(T(r.u.ad).slice(0, 34), x, yy); pdf.setTextColor(107, 121, 118); pdf.text(T(r.u.grup || ''), x + lw * 0.55, yy); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(27, 36, 34); pdf.text(T(b[2](r)), x + lw, yy, { align: 'right' }); yy += 4.2; });
    });
    // öğrenci tablosu + gün gün çizelge (yeni sayfa)
    pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F');
    y = mdPdfBaslik(pdf, T, mx, uw, 10, 'Öğrenci bazında yoklama', donemAd);
    let sut = [['#', 7], ['Öğrenci', 44], ['Grup', 26], ['Paket', 16], ['Geldi', 11], ['Gelmedi', 13], ['Hasta', 10], ['Telafi', 11], ['Hak', 9], ['Son geliş', 17], ['Ödeme', 13]];
    let sabit = sut.reduce(function (a, c) { return a + c[1]; }, 0), izGun = gunler.length <= 31 ? gunler : gunler.slice(-31), cw = Math.max(2.6, Math.min(6, (uw - sabit) / Math.max(1, izGun.length)));
    let basCiz = function () {
        pdf.setFillColor(243, 246, 245); pdf.rect(mx, y, uw, 9, 'F'); pdf.setDrawColor(27, 36, 34); pdf.setLineWidth(0.3); pdf.line(mx, y + 9, mx + uw, y + 9);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.2); pdf.setTextColor(61, 74, 71);
        let x = mx; sut.forEach(function (c, i) { pdf.text(T(c[0]), i < 3 ? x + 1.2 : x + c[1] / 2, y + 5.8, i < 3 ? undefined : { align: 'center' }); x += c[1]; });
        izGun.forEach(function (iso) { let dt = new Date(iso + 'T12:00:00'); pdf.setFontSize(5.2); pdf.text(String(dt.getDate()), x + cw / 2, y + 4.2, { align: 'center' }); pdf.setFontSize(4.2); pdf.text(T(['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'][dt.getDay()]), x + cw / 2, y + 7.6, { align: 'center' }); x += cw; });
        y += 10;
    };
    basCiz();
    satir.forEach(function (r, i) {
        if (y + 6 > H - 14) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 14; basCiz(); }
        if (i % 2) { pdf.setFillColor(250, 251, 251); pdf.rect(mx, y, uw, 6, 'F'); }
        let x = mx, deger = [String(i + 1), T(r.u.ad).slice(0, 30), T(r.u.grup || '').slice(0, 18), T(r.paket), String(r.gel), String(r.say.y + r.say.m), String(r.say.h), String(r.say.t), String(r.hak || ''), r.son ? mdTR(r.son).slice(0, 5) : '—', r.odendi ? 'ödendi' : '—'];
        sut.forEach(function (c, j) {
            pdf.setFont('helvetica', j === 1 ? 'bold' : 'normal'); pdf.setFontSize(j === 1 ? 7 : 6.8);
            let renk = j === 4 ? MD_PDF_RENK.g : j === 5 && r.say.y ? MD_PDF_RENK.y : j === 6 && r.say.h ? MD_PDF_RENK.h : j === 7 && r.say.t ? MD_PDF_RENK.t : j === 8 && r.hak ? MD_PDF_RENK.t : j === 10 && r.odendi ? MD_PDF_RENK.g : [46, 57, 54];
            pdf.setTextColor.apply(pdf, renk); pdf.text(T(deger[j]), j < 3 ? x + 1.2 : x + c[1] / 2, y + 4.2, j < 3 ? undefined : { align: 'center' }); x += c[1];
        });
        izGun.forEach(function (iso) {
            let s = r.gun[iso], cx = x + cw / 2, cy = y + 3;
            if (s === 'g' || s === 't') { pdf.setFillColor.apply(pdf, MD_PDF_RENK[s]); pdf.rect(x + 0.6, y + 1, cw - 1.2, 4, 'F'); }
            else if (s === 'h') { pdf.setFillColor.apply(pdf, MD_PDF_RENK.h); pdf.circle(cx, cy, Math.min(1.5, cw / 3), 'F'); }
            else if (s === 'm') { pdf.setDrawColor.apply(pdf, MD_PDF_RENK.m); pdf.setLineWidth(0.45); pdf.circle(cx, cy, Math.min(1.4, cw / 3), 'S'); }
            else if (s === 'y') { pdf.setDrawColor.apply(pdf, MD_PDF_RENK.y); pdf.setLineWidth(0.45); pdf.line(cx - 1.1, cy - 1.1, cx + 1.1, cy + 1.1); pdf.line(cx - 1.1, cy + 1.1, cx + 1.1, cy - 1.1); }
            x += cw;
        });
        y += 6;
    });
    y += 4; if (y > H - 20) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 16; }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.8); pdf.setTextColor(107, 121, 118);
    pdf.text(T('Çizelge: dolu yeşil = geldi · sarı = telafi dersi · mor nokta = hasta · kırmızı çarpı = gelmedi · boş = kayıt yok. Paket: 8 derslik paket no · dolan ders. Hak: kullanılmamış telafi hakkı.'), mx, y);
    mdPdfAlt(pdf, T, W, H);
    pdf.save('Milo_Yoklama_' + bas + '_' + bit + '.pdf');
}
// Öğrenci raporu (dikey, veliye verilebilir)
async function mdOgrenciPdf(kEnc) {
    let u = mdUye(decodeURIComponent(kEnc)); if (!u) return;
    if (typeof _miloYeniPdfAl !== 'function') return showToast('PDF aracı yüklenemedi.', 'error');
    showToast('📄 Öğrenci raporu hazırlanıyor…', 'success');
    let o = mdOzet(u), pdf = await _miloYeniPdfAl('portrait'), T = typeof _miloTrTranslit === 'function' ? _miloTrTranslit : function (s) { return s; }, W = 210, H = 297, mx = 16, uw = W - 32;
    let yas = typeof miloYasMetin === 'function' && u.dogumTarihi ? miloYasMetin(u.dogumTarihi) : '';
    let y = mdPdfBaslik(pdf, T, mx, uw, 12, u.ad, u.grup);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 121, 118);
    pdf.text(T([yas, o.ilk ? 'İlk ders ' + mdTR(o.ilk) : '', o.sonGelis ? 'Son geliş ' + mdTR(o.sonGelis) : ''].filter(Boolean).join(' · ')), mx, y); y += 6;
    let k = [[o.say.g + o.say.t, 'geldi', MD_PDF_RENK.g], [o.say.y + o.say.m, 'gelmedi', MD_PDF_RENK.y], [o.say.h, 'hasta', MD_PDF_RENK.h], [o.say.t, 'telafi dersi', MD_PDF_RENK.t], [o.hak, 'açık telafi hakkı', MD_PDF_RENK.t], [o.son ? o.son.dersler.length + '/8' : '—', o.son ? 'paket ' + o.son.no : 'paket']];
    let kw = (uw - 5 * 3) / 6; k.forEach(function (x, i) { mdPdfKutu(pdf, T, mx + i * (kw + 3), y, kw, x[0], x[1], x[2]); }); y += 24;
    // son 3 ayın takvimi
    let aylar = mdAylar(u, o).slice(-3);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(27, 36, 34); pdf.text(T('Yoklama takvimi'), mx, y); y += 4;
    let tw = (uw - 2 * 6) / 3;
    aylar.forEach(function (a, ai) {
        let x0 = mx + ai * (tw + 6), y0 = y, ilk = new Date(a + '-01T12:00:00'), gs = new Date(ilk.getFullYear(), ilk.getMonth() + 1, 0).getDate(), bos = (ilk.getDay() + 6) % 7, cw = tw / 7, ch = 6.2;
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(15, 111, 103); pdf.text(T(MD_AY[ilk.getMonth()] + ' ' + ilk.getFullYear()), x0, y0 + 3);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.5); pdf.setTextColor(140, 150, 147);
        ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].forEach(function (g, i) { pdf.text(T(g), x0 + i * cw + cw / 2, y0 + 7.5, { align: 'center' }); });
        for (let d = 1; d <= gs; d++) {
            let idx = bos + d - 1, cx = x0 + (idx % 7) * cw, cy = y0 + 9 + Math.floor(idx / 7) * ch, iso = a + '-' + String(d).padStart(2, '0'), s = mdGun(u, iso);
            if (s) { pdf.setFillColor.apply(pdf, s === 'g' ? [227, 244, 241] : s === 'y' ? [253, 235, 234] : s === 'h' ? [238, 232, 251] : [255, 244, 217]); pdf.roundedRect(cx + 0.4, cy + 0.3, cw - 0.8, ch - 0.6, 1, 1, 'F'); }
            pdf.setFont('helvetica', s ? 'bold' : 'normal'); pdf.setFontSize(6.3); pdf.setTextColor.apply(pdf, s ? MD_PDF_RENK[s] : [120, 130, 127]); pdf.text(String(d), cx + cw / 2, cy + ch / 2 + 1.2, { align: 'center' });
        }
    });
    y += 9 + 6 * 6.2 + 6;
    // paketler
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(27, 36, 34); pdf.text(T('Paketler (8 ders)'), mx, y); y += 5;
    o.paketler.slice().reverse().forEach(function (p) {
        if (y > H - 40) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 18; }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(27, 36, 34); pdf.text(T('Paket ' + p.no), mx, y + 3);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.3); pdf.setTextColor(107, 121, 118);
        pdf.text(T(mdTR(p.bas) + (p.bit && p.bit !== p.bas ? ' – ' + mdTR(p.bit) : '') + ' · ' + p.dersler.length + '/8 ders · geldi ' + p.geldi + (p.hak ? ' · telafi hakkı ' + p.hak + ' (kullanılan ' + p.telafiler.length + ')' : '')), mx + 18, y + 3);
        let od = p.odeme && p.odeme.odendi ? 'Ödendi' + (p.odeme.odemeTarihi ? ' ' + mdTR(p.odeme.odemeTarihi) : '') + (p.odeme.tutar ? ' · ' + p.odeme.tutar + ' TL' : '') + (p.odeme.not ? ' · ' + p.odeme.not : '') : 'Ödeme girilmedi';
        pdf.setTextColor.apply(pdf, p.odeme && p.odeme.odendi ? MD_PDF_RENK.g : MD_PDF_RENK.y); pdf.text(T(od).slice(0, 70), mx + uw, y + 3, { align: 'right' });
        y += 6; let x = mx;
        p.dersler.concat(p.telafiler).forEach(function (r) {
            pdf.setFillColor.apply(pdf, r.s === 'g' ? [227, 244, 241] : r.s === 'y' ? [253, 235, 234] : r.s === 'h' ? [238, 232, 251] : [255, 244, 217]); pdf.roundedRect(x, y, 17, 9, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor.apply(pdf, MD_PDF_RENK[r.s]); pdf.text(T(MD_DURUM[r.s].ad), x + 8.5, y + 4, { align: 'center' });
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.8); pdf.text(T(mdKisaTR(r.iso)), x + 8.5, y + 7.4, { align: 'center' }); x += 19;
        });
        y += 14; pdf.setDrawColor(228, 233, 231); pdf.setLineWidth(0.2); pdf.line(mx, y - 2.5, mx + uw, y - 2.5);
    });
    if (!o.paketler.length) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(107, 121, 118); pdf.text(T('Henüz yoklama kaydı yok.'), mx, y + 3); }
    mdPdfAlt(pdf, T, W, H);
    pdf.save('Milo_' + u.ad.replace(/\s+/g, '_') + '_rapor.pdf');
}

// ================================================================================================
// 📋 KÂĞIT ÇİZELGEDEN AKTARIM (2026-10-15): antrenörün kâğıt yoklama çizelgesinin fotoğrafı okundu (Claude). Belirsiz
// okunanlar (?) sarı; kayıtlar onaylanmadan yazılmaz. Satır başına üye eşleştirmesi değiştirilebilir, her tarih
// düzeltilebilir (dokun → tarih/durum). Kaydet: attendance_auto + telafi için yoklama_durum.
// s: g geldi · y gelmedi · t telafi · '?' sonek = şüpheli (not ile)
// ================================================================================================
const MD_KAGIT = [
    { kagit: 'KIVANÇ', uye: ['KIVANÇ EGE RAMAZANOĞLU'], k: ['20.09:g', '26.09:g?:işaret seçilemedi'] },
    { kagit: 'HAYAT', uye: ['HAYAT CEYLAN'], k: ['03.09:g', '08.09:g', '19.09:g', '20.09:g', '24.09:g', '26.09:g', '01.10:g', '03.10:g?:kâğıtta 03.09 yazıyor, sıraya göre 03.10'] },
    { kagit: 'ZEHRA', uye: ['ZEHRA SARE YILMAZ'], k: ['19.09:g', '20.09:g', '24.09:g', '26.09:y', '01.10:g', '03.10:g?:kâğıtta 03.09 yazıyor, sıraya göre 03.10', '08.10:y', '10.10:g'] },
    { kagit: 'PERA', uye: ['PERA'], k: ['10.08:g?:10.08 mi 10.09 mu? sıraya göre Ağustos', '02.09:g', '07.09:g', '09.09:g?:işaret görünmüyor', '14.09:y', '16.09:y', '21.09:y', '23.09:g'] },
    { kagit: 'İPEK/İNCİ', uye: ['İPEK ÖÇSOY', 'İNCİ ÖÇSOY'], k: ['07.09:g?:kâğıtta 2025 yazıyor', '09.09:g?:işaret görünmüyor', '14.09:y', '16.09:g', '21.09:g', '23.09:g', '28.09:g', '30.09:y'] },
    { kagit: 'MİRAÇ', uye: ['MİRAÇ EGE AYDOĞDU'], k: ['01.09:g', '03.09:g', '08.09:g?:kâğıtta 09.08 yazıyor', '10.09:g', '19.09:g?:gün rakamı belirsiz (15? 17? 19?)', '20.09:g', '23.09:g', '28.09:g?:gün rakamı üstüne yazılmış'] },
    { kagit: 'NİL ZEHRA', uye: ['NİL ZEHRA YILDIZ'], k: ['01.09:g', '03.09:g', '07.09:g?:04 mü 07 mi?', '09.09:g', '14.09:g', '21.09:g', '28.09:g', '30.09:g'] },
    { kagit: 'NİL', uye: ['NİL ÖZKAN'], k: ['02.09:g', '07.09:g', '08.09:g?:işaret görünmüyor', '14.09:g', '21.09:g', '23.09:g', '28.09:g', '30.09:g'] },
    { kagit: 'YÜSRA', uye: ['YÜSRA ÇAKAL'], k: ['01.09:y', '03.09:y', '19.09:g?:gün düzeltilmiş, işaret yok', '20.09:g', '26.09:g', '01.10:y?:kâğıtta 01.09, sıraya göre 01.10', '03.10:y?:ay rakamı üstüne yazılmış', '10.10:g'] },
    { kagit: 'ERVA', uye: ['ERVA BAYRAM'], k: ['01.09:g', '03.09:g', '08.09:y?:03 mü 08 mi?'] },
    { kagit: 'HİRA', uye: ['HİRA DİN'], k: ['17.08:g?:kâğıtta 17.05 yazıyor', '19.08:g', '24.08:y', '26.08:g', '31.08:g', '02.09:g', '07.09:g', '09.09:g', '14.09:y?:kenar notu', '16.09:t?:kenar notu "#1 hak mevcut" — telafi', '23.09:g?:kenar notu', '26.09:g?:kenar notu'] },
    { kagit: 'ALİ KEMAL', uye: ['ALİ KEMAL ÖZTÜRK'], k: ['27.08:g', '31.08:g', '01.09:g', '03.09:y?:işaret ✕ gibi', '07.09:g', '10.09:g', '17.09:g?:gün rakamı belirsiz', '24.09:g'] },
    { kagit: 'Asila', uye: ['ASİLA'], k: ['14.09:g?:kâğıtta 14.08 yazıyor', '17.09:g?:hem ✓ hem ✕ var', '21.09:g', '27.09:g?:kâğıtta 27.08', '28.09:g', '01.10:g?:kâğıtta 01.09', '05.10:g', '08.10:g'] },
    { kagit: 'Eylül (alt satır)', uye: ['EYLÜL ÖZLÜ'], k: ['14.09:g', '17.09:g?:14 mü 17 mi?', '21.09:g', '23.09:g?:kâğıtta 23.08', '28.09:g', '01.10:g?:kâğıtta 01.08/01.09', '05.10:g', '08.10:g'] },
    { kagit: 'Alisia', uye: ['ALİSİA'], k: ['16.09:y', '23.09:g', '28.09:g?:25 mi 28 mi?', '30.09:g', '05.10:y', '07.10:g', '12.10:g'] },
    { kagit: 'Arya', uye: ['ARYA'], k: ['23.09:g', '28.09:y'] },
    { kagit: 'Devrim', uye: ['DEVRİM GÜLSUYU'], k: ['26.09:g'] },
    { kagit: 'YAMAÇ (çizili)', uye: [], k: ['27.08:y', '01.09:g', '03.09:g', '08.09:g'] },
    { kagit: 'ELİF', uye: [], k: ['27.08:g', '01.09:g', '03.09:g', '08.09:g'] },
    { kagit: 'EYLÜL (üst satır, çizili)', uye: [], k: ['01.09:g', '02.09:g', '07.09:g?', '14.09:g?'] },
    { kagit: 'LİNA (çizili)', uye: [], k: ['20.08:g', '25.08:g', '27.08:g', '01.09:y', '03.09:g', '08.09:g', '10.09:y'] },
    { kagit: 'Meysail? (okunamadı)', uye: [], k: ['24.09:g', '26.09:y'] }
];
function mdAktarimHazirla() {
    MD.aktarim = MD_KAGIT.map(function (r, i) {
        let uyeler = r.uye.map(function (ad) { let u = MD.uyeler.find(function (x) { return x.ad === ad; }); return u ? mdKey(u) : null; }).filter(Boolean);
        return { i: i, kagit: r.kagit, uyeler: uyeler, kayitlar: r.k.map(function (s) { let p = s.split(':'), g = p[0].split('.'); return { iso: '2026-' + g[1] + '-' + g[0], s: p[1].replace('?', ''), supheli: p[1].indexOf('?') !== -1, not: p[2] || '' }; }) };
    });
}
function mdAktarimAc() { mdCss(); if (!MD.aktarim) mdAktarimHazirla(); MD.ekran = 'aktarim'; mdCiz(); }
function mdAktarimHTML() {
    let A = MD.aktarim, sec = MD.uyeler.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
    let toplam = 0, suphe = 0, cakisma = 0;
    let satirlar = A.map(function (r) {
        let uSec = '<select onchange="mdAktarimUye(' + r.i + ', this.value)"><option value="">— aktarma —</option>' + sec.map(function (u) { let k = mdKey(u); return '<option value="' + miloEsc(k) + '"' + (r.uyeler[0] === k ? ' selected' : '') + '>' + miloEsc(u.ad) + ' · ' + miloEsc(u.grup) + '</option>'; }).join('') + '</select>' + (r.uyeler.length > 1 ? '<small>+ ' + r.uyeler.slice(1).map(function (k) { return miloEsc(k.split('|')[1]); }).join(', ') + ' (aynı yoklama)</small>' : '');
        let cipler = r.kayitlar.map(function (k, j) {
            if (r.uyeler.length) { toplam += r.uyeler.length; if (k.supheli) suphe++; }
            let mevcut = r.uyeler.map(function (uk) { let u = mdUye(uk); return u ? mdGun(u, k.iso) : null; }).filter(Boolean)[0] || null, farkli = mevcut && mevcut !== k.s && !(mevcut === 'g' && k.s === 'g');
            if (farkli && r.uyeler.length) cakisma++;
            return '<button class="md-cip ' + (MD_DURUM[k.s] ? MD_DURUM[k.s].cls : 'bos') + (k.supheli ? ' supheli' : '') + (farkli ? ' farkli' : '') + '" onclick="mdAktarimDuzenle(' + r.i + ',' + j + ')" title="' + miloEsc((k.not || '') + (mevcut ? ' · sistemde şu an: ' + MD_DURUM[mevcut].ad : '')) + '">' + mdKisaTR(k.iso) + ' ' + (MD_DURUM[k.s] ? MD_DURUM[k.s].ikon : '?') + (k.supheli ? ' ?' : '') + '</button>';
        }).join('');
        let duzenle = MD.aktarimDuz && MD.aktarimDuz.r === r.i ? mdAktarimDuzenleHTML(r, MD.aktarimDuz.j) : '';
        return '<div class="md-ak-sat' + (r.uyeler.length ? '' : ' pasif') + '"><div class="md-ak-ad"><b>' + miloEsc(r.kagit) + '</b>' + uSec + '</div><div class="md-ak-cip">' + cipler + '<button class="md-cip ekle" onclick="mdAktarimEkle(' + r.i + ')">+ tarih</button></div>' + duzenle + '</div>';
    }).join('');
    return '<div class="md-aktarim"><div class="md-ust"><div><div class="md-ad">📋 Kâğıt çizelgeden aktarım</div><div class="md-alt">Fotoğraftaki çizelge okundu. <b>Sarı (?)</b> olanları kâğıtla karşılaştır; dokun → düzelt. Kırmızı çerçeve: sistemde o gün farklı kayıt var (aktarınca kâğıttaki yazılır). Eşleşmeyen satırlar aktarılmaz.</div></div><button class="md-btn" onclick="MD.ekran=\'liste\'; mdCiz()">← Defter</button></div>'
        + '<div class="md-kutular"><div class="md-kutu"><b>' + toplam + '</b><small>yazılacak kayıt</small></div><div class="md-kutu uyari"><b>' + suphe + '</b><small>şüpheli (?)</small></div><div class="md-kutu y"><b>' + cakisma + '</b><small>sistemde farklı</small></div></div>'
        + '<div class="md-ak-liste">' + satirlar + '</div>'
        + '<div class="md-ak-alt"><button class="md-btn ana buyuk" onclick="mdAktarimKaydet()" id="md-ak-kaydet">✅ Kontrol ettim — ' + toplam + ' kaydı yaz</button><span class="md-alt">Kâğıdın kenarındaki "Çarşamba telafi 08.0?.26 ✓" notu kime ait belli değil — gerekirse Defter\'den elle telafi işaretle.</span></div></div>';
}
function mdAktarimUye(i, k) { let r = MD.aktarim[i]; r.uyeler = k ? [k].concat(r.uyeler.slice(1).filter(function (x) { return x !== k; })) : []; mdCiz(true); }
function mdAktarimDuzenle(i, j) { MD.aktarimDuz = MD.aktarimDuz && MD.aktarimDuz.r === i && MD.aktarimDuz.j === j ? null : { r: i, j: j }; mdCiz(true); }
function mdAktarimEkle(i) { let r = MD.aktarim[i]; r.kayitlar.push({ iso: mdIso(new Date()), s: 'g', supheli: false, not: 'elle eklendi' }); MD.aktarimDuz = { r: i, j: r.kayitlar.length - 1 }; mdCiz(true); }
function mdAktarimDuzenleHTML(r, j) {
    let k = r.kayitlar[j]; if (!k) return '';
    return '<div class="md-ak-duz">' + (k.not ? '<small>📝 ' + miloEsc(k.not) + '</small>' : '') + '<input type="date" value="' + k.iso + '" onchange="MD.aktarim[' + r.i + '].kayitlar[' + j + '].iso=this.value">'
        + ['g', 'y', 't'].map(function (s) { return '<button class="' + MD_DURUM[s].cls + (k.s === s ? ' aktif' : '') + '" onclick="let x=MD.aktarim[' + r.i + '].kayitlar[' + j + ']; x.s=\'' + s + '\'; x.supheli=false; MD.aktarimDuz=null; mdCiz(true)">' + MD_DURUM[s].ikon + ' ' + MD_DURUM[s].ad + '</button>'; }).join('')
        + '<button class="bos" onclick="MD.aktarim[' + r.i + '].kayitlar.splice(' + j + ',1); MD.aktarimDuz=null; mdCiz(true)">🗑 Sil</button><button class="kapat" onclick="let x=MD.aktarim[' + r.i + '].kayitlar[' + j + ']; x.supheli=false; MD.aktarimDuz=null; mdCiz(true)">✓ Doğru</button></div>';
}
async function mdAktarimKaydet() {
    let isler = []; MD.aktarim.forEach(function (r) { r.uyeler.forEach(function (k) { let u = mdUye(k); if (u) r.kayitlar.forEach(function (x) { if (x.iso && MD_DURUM[x.s]) isler.push({ u: u, iso: x.iso, s: x.s }); }); }); });
    if (!isler.length) return showToast('Yazılacak kayıt yok.', 'warning');
    let btn = document.getElementById('md-ak-kaydet'), hata = 0, telafi = {};
    for (let i = 0; i < isler.length; i++) {
        let x = isler[i]; if (btn) btn.textContent = '⏳ ' + (i + 1) + '/' + isler.length + ' yazılıyor…';
        try { await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: x.iso, ad: x.u.ad, grup: x.u.grup, saat: '12:00', elle: true, geldi: x.s !== 'y' }) }); (MD.att[x.iso] = MD.att[x.iso] || {})[x.u.ad] = { geldi: x.s !== 'y', grup: x.u.grup, saat: '12:00' }; }
        catch (e) { hata++; }
        if (x.s === 't') telafi[x.iso + '|' + x.u.ad] = { d: 'telafi', t: Date.now() };
    }
    if (Object.keys(telafi).length) { try { MD.durum = await mdMetaYaz('yoklama_durum', telafi); } catch (e) { hata++; } }
    if (hata) { showToast(hata + ' kayıt yazılamadı — tekrar dene (yazılanlar tekrar yazılır, sorun olmaz).', 'error'); if (btn) btn.textContent = '↻ Tekrar dene'; return; }
    try { localStorage.setItem('milo_kagit_aktarim_2026_10', String(Date.now())); } catch (e) {}
    try { await miloApi('/meta/kagit_aktarim', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify({ bitti: Date.now() }) }) }); } catch (e) {} // her cihazda düğme kalksın
    showToast('✅ ' + isler.length + ' yoklama kaydı aktarıldı', 'success');
    MD.ekran = 'liste'; MD.yuklendi = false; await mdYukle(); mdCiz();
}

// ---------------- stil: "A · Sade" (2026-10-15, kullanıcı 3 tema arasından seçti): beyaz kâğıt, tek vurgu (petrol yeşili),
// bol boşluk, kutu/çerçeve en aza; sayılar büyük, açıklamalar küçük. Uygulamanın koyu kabuğu içinde açık bir sayfa olarak durur.
// ---------------- 🗓 GEÇMİŞ YOKLAMA ÇİZELGESİ (2026-10-16, kullanıcı: "yoklama geçmişini nasıl gireceğiz, bunu da kolaylaştır").
// Kâğıttaki çizelgenin aynısı: grup + ay seçilir; satırlar öğrenciler, sütunlar o ayın ders günleri (programdan; elle gün de
// eklenir). Hücreye dokun: boş → ✓ geldi → ✗ gelmedi → H hasta → T telafi → boş. Gün başlığı: o günün boşlarını "geldi" yapar.
// Değişiklikler ekranda birikir (turuncu çerçeve), "Kaydet" tek seferde yazar (mdGunYaz — Defter'le aynı kurallar).
// Bekleyen değişiklik varken arka plan yenilemesi ekrana dokunmaz (milo/app.js miloMesgulMu).
const MD_CZ_SIRA = [null, 'g', 'y', 'm', 'h', 't', 'k'];
function mdCzGruplar() { let g = {}; MD.uyeler.forEach(function (u) { if (!u.pasif) g[u.grup] = (g[u.grup] || 0) + 1; }); return Object.keys(g).sort(function (a, b) { return a.localeCompare(b, 'tr', { numeric: true }); }); }
function mdCzDurum() {
    if (!MD.cz) { let gr = mdCzGruplar(); MD.cz = { grup: gr[0] || '', ay: 0, bekleyen: {}, ekGun: {} }; }
    return MD.cz;
}
async function mdCizelgeAc(grup) {
    mdCss();
    if (!MD.yuklendi) { let alan = document.getElementById('milo-icerik'); if (alan) alan.innerHTML = '<div class="md-yuk">Yükleniyor…</div>'; try { await mdYukle(); } catch (e) { if (alan) alan.innerHTML = '<div class="md-yuk">Yüklenemedi — bağlantını kontrol et.</div>'; return; } }
    let cz = mdCzDurum(); if (grup) cz.grup = grup;
    MD.ekran = 'cizelge'; mdCiz();
}
function mdCizelgeKapat() {
    let n = Object.keys(mdCzDurum().bekleyen).length;
    let kapat = function () { MD.cz.bekleyen = {}; MD.ekran = 'liste'; mdCiz(); };
    if (n) return onayIste(n + ' değişiklik kaydedilmedi. Kaydetmeden çıkılsın mı?', kapat, 'Kaydetmeden çık', 'Kal');
    kapat();
}
function mdCzAyBas(o) { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() + o); return d; }
function mdCzUyeler() { let cz = mdCzDurum(), son = mdIso(new Date(mdCzAyBas(cz.ay).getFullYear(), mdCzAyBas(cz.ay).getMonth() + 1, 0, 12)); /* o ay kaydı varsa (tarih yanlış girilmiş olsa bile) gizleme */ let ayOn = son.slice(0, 7), kayitVar = function (u) { return Object.keys(MD.att).some(function (iso) { return iso.slice(0, 7) === ayOn && MD.att[iso][u.ad]; }); };
    return MD.uyeler.filter(function (u) { return !u.pasif && u.grup === cz.grup && !(u.katilmaTarihi && u.katilmaTarihi > son && !cz.ilkAcik && !kayitVar(u)); }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); }); }
// sütunlar: grubun ders günleri (programdaki slotlardan) + o ay kaydı olan günler + elle eklenen günler; bugünden sonrası yok
function mdCzGunler() {
    let cz = mdCzDurum(), bas = mdCzAyBas(cz.ay), ay = bas.getMonth(), bugun = mdIso(new Date()), uyeler = mdCzUyeler(), adlar = {};
    uyeler.forEach(function (u) { adlar[u.ad] = 1; });
    let haftaGun = {};
    MD.slotlar.forEach(function (s) {
        let ilgili = (s.katilimcilar || []).some(function (k) { return k.grup === cz.grup; }) || s.grup === cz.grup;
        if (ilgili) (s.gunler && s.gunler.length ? s.gunler : [s.gun]).forEach(function (x) { haftaGun[+x] = 1; });
    });
    let set = {};
    for (let d = new Date(bas); d.getMonth() === ay; d.setDate(d.getDate() + 1)) { let iso = mdIso(d); if (iso > bugun) break; if (haftaGun[d.getDay()]) set[iso] = 1; }
    Object.keys(MD.att).forEach(function (iso) { if (iso.slice(0, 7) === mdIso(bas).slice(0, 7) && Object.keys(MD.att[iso]).some(function (ad) { return adlar[ad]; })) set[iso] = 1; });
    Object.keys(cz.ekGun).forEach(function (iso) { if (iso.slice(0, 7) === mdIso(bas).slice(0, 7)) set[iso] = 1; });
    return Object.keys(set).sort();
}
function mdCzHucre(u, iso) { let cz = mdCzDurum(), k = iso + '|' + mdKey(u); return k in cz.bekleyen ? cz.bekleyen[k] : mdGun(u, iso); }
function mdCzDokun(kEnc, iso) {
    let cz = mdCzDurum(), k = iso + '|' + decodeURIComponent(kEnc), u = mdUye(decodeURIComponent(kEnc)); if (!u) return;
    let simdi = mdCzHucre(u, iso), yeni = MD_CZ_SIRA[(MD_CZ_SIRA.indexOf(simdi) + 1) % MD_CZ_SIRA.length];
    if (yeni === mdGun(u, iso)) delete cz.bekleyen[k]; else cz.bekleyen[k] = yeni;
    mdCzYenile();
}
function mdCzHepsiGeldi(iso) {
    let cz = mdCzDurum(), n = 0;
    mdCzUyeler().forEach(function (u) { if (mdCzHucre(u, iso) === null && !(u.katilmaTarihi && iso < u.katilmaTarihi)) { cz.bekleyen[iso + '|' + mdKey(u)] = 'g'; n++; } });
    if (!n) showToast('Bu günde boş kalan yok.', 'info');
    mdCzYenile();
}
function mdCzGunEkle(iso) { if (!iso) return; let cz = mdCzDurum(); cz.ekGun[iso] = 1; let d = new Date(iso + 'T12:00:00'), b = new Date(); cz.ay = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth(); mdCzYenile(); }
function mdCzAy(o) { let cz = mdCzDurum(); cz.ay = Math.min(0, cz.ay + o); mdCzYenile(); }
function mdCzGrup(g) { let cz = mdCzDurum(); if (Object.keys(cz.bekleyen).length) return showToast('Önce kaydet ya da değişiklikleri geri al.', 'warning'); cz.grup = decodeURIComponent(g); mdCzYenile(); }
function mdCzGeriAl() { mdCzDurum().bekleyen = {}; mdCzYenile(); }
function mdCzYenile() {
    let alan = document.getElementById('milo-icerik'), y = alan ? alan.scrollTop : 0, wy = window.scrollY;
    let kap = document.getElementById('md-cz'); if (!kap) return mdCiz(true);
    let sx = (kap.querySelector('.md-cz-tablo-kap') || {}).scrollLeft || 0;
    kap.outerHTML = mdCizelgeHTML();
    let t = document.querySelector('#md-cz .md-cz-tablo-kap'); if (t) t.scrollLeft = sx;
    if (alan) alan.scrollTop = y; window.scrollTo(0, wy);
}
function mdCizelgeHTML() {
    let cz = mdCzDurum(), gruplar = mdCzGruplar(), uyeler = mdCzUyeler(), gunler = mdCzGunler(), bas = mdCzAyBas(cz.ay), n = Object.keys(cz.bekleyen).length;
    let ayAd = MD_AY[bas.getMonth()] + ' ' + bas.getFullYear(), gAd = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    let isaret = { g: '✓', y: '✗', m: '📞', h: 'H', t: 'T', k: '↪' };
    let bas2 = '<th class="ad">Öğrenci</th>' + gunler.map(function (iso) { let d = new Date(iso + 'T12:00:00'); return '<th><button class="md-cz-gun" onclick="mdCzHepsiGeldi(\'' + iso + '\')" title="Bu günün boşlarını geldi yap"><b>' + d.getDate() + '</b><small>' + gAd[d.getDay()] + '</small></button></th>'; }).join('') + '<th class="top">Geldi</th>';
    let satir = uyeler.map(function (u) {
        let k = mdKey(u), gel = 0;
        let h = gunler.map(function (iso) {
            let s = mdCzHucre(u, iso), deg = (iso + '|' + k) in cz.bekleyen; if (s === 'g' || s === 't') gel++;
            if (!s && u.katilmaTarihi && iso < u.katilmaTarihi) return '<td><span class="md-cz-h once" title="' + miloEsc(u.ad) + ' ' + mdTR(u.katilmaTarihi) + ' tarihinde başladı">–</span></td>';
            return '<td><button class="md-cz-h ' + (s || 'bos') + (deg ? ' deg' : '') + '" onclick="mdCzDokun(\'' + mdEnc(k) + '\',\'' + iso + '\')" aria-label="' + miloEsc(u.ad) + ' ' + mdTR(iso) + ': ' + (s ? MD_DURUM[s].ad : 'boş') + '">' + (s ? isaret[s] : '') + '</button></td>';
        }).join('');
        let bsl = u.katilmaTarihi && u.katilmaTarihi.slice(0, 7) === mdIso(bas).slice(0, 7) ? '<small class="md-cz-bas">' + mdKisaTR(u.katilmaTarihi) + '\'da başladı</small>' : '';
        return '<tr><td class="ad">' + miloEsc(u.ad) + bsl + '</td>' + h + '<td class="top">' + gel + '</td></tr>';
    }).join('');
    return '<div class="md-aktarim md-cz" id="md-cz">'
        + '<div class="md-ust"><div><div class="md-ad">🗓 Geçmiş yoklama</div><div class="md-alt">Kâğıttaki gibi: hücreye dokun → ✓ geldi → ✗ gelmedi → H hasta → T telafi → ↪ başka gün geldi → boş. Gün başlığına dokunmak o günün boşlarını "geldi" yapar. En sonda Kaydet.</div></div>'
        + '<div class="md-cz-ust-btn"><button class="md-btn' + (cz.ilkAcik ? ' ana' : '') + '" onclick="mdCzIlkAcKapat()">📅 İlk ders tarihleri</button><button class="md-btn" onclick="mdCizelgeKapat()">← Defter</button></div></div>'
        + (cz.ilkAcik ? mdCzIlkHTML() : '')
        + '<div class="md-cz-secim"><div class="md-aylar">' + gruplar.map(function (g) { return '<button class="' + (g === cz.grup ? 'aktif' : '') + '" onclick="mdCzGrup(\'' + mdEnc(g) + '\')">' + miloEsc(g) + '</button>'; }).join('') + '</div>'
        + '<div class="md-cz-ay"><button class="md-btn" onclick="mdCzAy(-1)" aria-label="Önceki ay">‹</button><b>' + ayAd + '</b><button class="md-btn" onclick="mdCzAy(1)"' + (cz.ay >= 0 ? ' disabled' : '') + ' aria-label="Sonraki ay">›</button>'
        + '<label class="md-cz-ekle">+ gün <input type="date" max="' + mdIso(new Date()) + '" onchange="mdCzGunEkle(this.value)"></label></div></div>'
        + (uyeler.length && gunler.length ? '<div class="md-cz-tablo-kap"><table class="md-cz-tablo"><thead><tr>' + bas2 + '</tr></thead><tbody>' + satir + '</tbody></table></div>'
            : '<div class="md-bos">' + (uyeler.length ? 'Bu ay bu grubun ders günü yok — "+ gün" ile tarih ekleyebilirsin.' : 'Bu grupta öğrenci yok.') + '</div>')
        + '<div class="md-cz-alt"><span class="md-cz-acik"><i class="md-cz-h g">✓</i> geldi <i class="md-cz-h y">✗</i> gelmedi <i class="md-cz-h h">H</i> hasta <i class="md-cz-h t">T</i> telafi <i class="md-cz-h k">↪</i> başka gün geldi</span>'
        + (n ? '<button class="md-btn" onclick="mdCzGeriAl()">Geri al</button>' : '') + '<button class="md-btn ana buyuk" id="md-cz-kaydet" onclick="mdCzKaydet()"' + (n ? '' : ' disabled') + '>💾 Kaydet' + (n ? ' (' + n + ' değişiklik)' : '') + '</button></div></div>';
}
// 📅 İlk ders tarihleri (2026-10-16, kullanıcı: "öğrencilerin ilk ders tarihlerini girdiğim bir bölüm olsun — başladıkları tarihten
// itibaren gruplarda ve günlerde yer alsınlar"). Üyenin katilmaTarihi alanı; ondan önceki günler Çizelge/Defter/Yoklama'da beklenmez.
// Öneri: o öğrencinin en eski yoklama kaydı (kayıtlıysa).
function mdCzIlkAcKapat() { let cz = mdCzDurum(); cz.ilkAcik = !cz.ilkAcik; mdCzYenile(); }
function mdIlkYoklama(u) { let en = null; Object.keys(MD.att).forEach(function (iso) { let a = MD.att[iso][u.ad]; if (a && (!a.grup || a.grup === u.grup) && (!en || iso < en)) en = iso; }); return en; }
function mdCzIlkHTML() {
    let l = MD.uyeler.filter(function (u) { return !u.pasif && u.grup === mdCzDurum().grup; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); }), bugun = mdIso(new Date());
    return '<div class="md-cz-ilk"><div class="md-alt">Her öğrencinin <b>ilk ders tarihi</b>: bu tarihten önceki günler çizelgede "–" olur, yoklamada ve defterde beklenmez.</div>'
        + l.map(function (u) {
            let ilk = mdIlkYoklama(u), k = mdEnc(mdKey(u)), uyari = ilk && u.katilmaTarihi && ilk < u.katilmaTarihi;
            return '<div class="md-cz-ilk-sat"><b>' + miloEsc(u.ad) + '</b><input type="date" max="' + bugun + '" value="' + (u.katilmaTarihi || '') + '" onchange="mdIlkDersKaydet(\'' + k + '\', this.value)" aria-label="' + miloEsc(u.ad) + ' ilk ders tarihi">'
                + (ilk && ilk !== u.katilmaTarihi ? '<button class="md-btn' + (uyari ? ' uyari' : '') + '" onclick="mdIlkDersKaydet(\'' + k + '\', \'' + ilk + '\')" title="En eski yoklama kaydı">' + (uyari ? '⚠️ ' : '') + 'ilk yoklama: ' + mdKisaTR(ilk) + ' · kullan</button>' : '')
                + '</div>';
        }).join('') + '</div>';
}
async function mdIlkDersKaydet(kEnc, iso) {
    let u = mdUye(decodeURIComponent(kEnc)); if (!u) return;
    try { await miloApi('/members/' + encodeURIComponent(u.grup) + '/' + encodeURIComponent(u.ad), { method: 'PATCH', body: JSON.stringify({ katilmaTarihi: iso || null }) }); }
    catch (e) { showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); return; }
    u.katilmaTarihi = iso || null;
    try { let m = (miloUyeler || []).find(function (x) { return x.grup === u.grup && x.ad === u.ad; }); if (m) m.katilmaTarihi = u.katilmaTarihi; } catch (e) {}
    try { if (typeof MA !== 'undefined' && MA.uyeler) { let m = MA.uyeler.find(function (x) { return x.grup === u.grup && x.ad === u.ad; }); if (m) m.katilmaTarihi = u.katilmaTarihi; } } catch (e) {}
    mdCzYenile();
    showToast('✓ ' + u.ad + ': ilk ders ' + (iso ? mdTR(iso) : 'silindi'), 'success');
}
async function mdCzKaydet() {
    let cz = mdCzDurum(), l = Object.keys(cz.bekleyen); if (!l.length) return;
    let btn = document.getElementById('md-cz-kaydet'), ok = 0, hata = 0;
    for (let i = 0; i < l.length; i++) {
        let k = l[i], p = k.indexOf('|'), iso = k.slice(0, p), u = mdUye(k.slice(p + 1)), s = cz.bekleyen[k];
        if (btn) btn.textContent = '💾 Kaydediliyor… ' + (i + 1) + '/' + l.length;
        if (!u) { delete cz.bekleyen[k]; continue; }
        try { await mdGunYaz(u, iso, s); delete cz.bekleyen[k]; ok++; } catch (e) { hata++; }
    }
    mdCzYenile();
    showToast(hata ? ok + ' kaydedildi, ' + hata + ' kaydedilemedi — bağlantını kontrol edip tekrar Kaydet\'e bas.' : '✓ ' + ok + ' yoklama kaydedildi', hata ? 'error' : 'success');
}

function mdCss() {
    if (!document.getElementById('sade-font')) { let l = document.createElement('link'); l.id = 'sade-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('md-css')) return;
    let st = document.createElement('style'); st.id = 'md-css';
    st.textContent = [
        '.md,.md-aktarim{--s-zemin:#F4F7F6;--s-kagit:#FFFFFF;--s-ink:#1B2422;--s-dim:#6B7976;--s-line:#E4E9E7;--s-vurgu:#138A80;--s-vurgu-a:#E3F4F1;--s-kirmizi:#B4372F;--s-kirmizi-a:#FDEBEA;--s-amber:#8A5A00;--s-amber-a:#FFF4D9;--s-mor:#6D4BB8;--s-mor-a:#EEE8FB;--s-uyari:#E8A33D;',
        'font-family:"Manrope",system-ui,sans-serif;color:var(--s-ink);background:var(--s-zemin);border-radius:18px;padding:18px;color-scheme:light}',
        '.md{display:grid;grid-template-columns:minmax(220px,290px) 1fr;gap:18px;align-items:start}.md-yuk,.md-bos{padding:18px;color:var(--s-dim);font-weight:600;text-align:center}',
        '.md-liste{position:sticky;top:0;display:grid;gap:10px;max-height:calc(100vh - 150px);overflow:auto}.md-baslik{font-size:20px;font-weight:800;letter-spacing:-.02em}',
        '.md-ara{width:100%;box-sizing:border-box;min-height:42px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:8px 12px;font:inherit;font-size:14px}',
        '.md-satirlar{display:flex;flex-direction:column;background:var(--s-kagit);border:1px solid var(--s-line);border-radius:14px;overflow:hidden}',
        '.md-sat{flex:none;display:grid;text-align:left;gap:1px;padding:11px 14px;border:0;border-bottom:1px solid var(--s-line);background:transparent;color:var(--s-ink);font:inherit;cursor:pointer;min-height:52px}.md-sat:last-child{border-bottom:0}',
        '.md-sat:hover{background:#FAFBFB}.md-sat.secili{background:var(--s-vurgu-a);box-shadow:inset 3px 0 0 var(--s-vurgu)}.md-sat b{font-size:14px;font-weight:700}.md-sat small,.md-sat-alt{font-size:12px;color:var(--s-dim)}',
        '.md-turuncu{color:var(--s-amber)}.md-kirmizi{color:var(--s-kirmizi)}.md-yesil{color:var(--s-vurgu)}',
        '.md-detay{display:grid;gap:18px;min-width:0;background:var(--s-kagit);border:1px solid var(--s-line);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(20,40,35,.06)}',
        '.md-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.md-ad{font-size:24px;font-weight:800;letter-spacing:-.02em}.md-alt{font-size:13px;color:var(--s-dim);font-weight:500;margin-top:3px;line-height:1.5}',
        '.md-btn{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #D7DFDC;background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}.md-btn:hover{border-color:var(--s-vurgu)}',
        '.md-btn.ana{background:var(--s-vurgu);border-color:var(--s-vurgu);color:#fff}.md-btn.genis{width:100%}.md-btn.buyuk{min-height:50px;font-size:15px;padding:0 20px}',
        '.md-kutular{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px 16px}.md-kutu{padding:0}.md-kutu b{display:block;font-size:28px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}.md-kutu small{font-size:12px;color:var(--s-dim);font-weight:600}',
        '.md-kutu.g b{color:var(--s-vurgu)}.md-kutu.y b{color:var(--s-kirmizi)}.md-kutu.h b{color:var(--s-mor)}.md-kutu.t b{color:var(--s-amber)}.md-kutu.uyari b{color:var(--s-amber)}',
        '.md-gun.m{background:#E8F0FE;color:#2563EB}.md-secici button.m{color:#2563EB}.md-lejant .m i{background:#E8F0FE;color:#2563EB}.md-n.m{background:#E8F0FE;color:#2563EB}.md-kutu.m b{color:#2563EB}',
        '.md-cz-h.m{background:#E8F0FE;color:#2563EB;border-color:transparent}',
        '.md-haklar{display:flex;flex-direction:column;border:1px solid var(--s-line);border-radius:12px;overflow:hidden}',
        '.md-hs{display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 14px;border-top:1px solid var(--s-line)}.md-hs:first-child{border-top:0}',
        '.md-hs-t b{display:block;font-size:13.5px}.md-hs-t small{font-size:12px;color:var(--s-dim);font-weight:600}.md-hs-m{font-size:13px;font-weight:600;line-height:1.4}.md-hs .md-btn{min-height:36px;font-size:12.5px;padding:0 12px;white-space:nowrap}',
        '.md-hd{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:99px;margin-right:6px}.md-hd.acik{background:var(--s-vurgu-a);color:#0D6B63}.md-hd.yok{background:#F1F3F2;color:var(--s-dim)}.md-hd.kul{background:#EEF2FF;color:#4338CA}.md-hd.dus{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}',
        '@media (max-width:640px){.md-hs{grid-template-columns:1fr}}',
        '.md-uyari.paket{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-left-color:var(--s-vurgu);background:var(--s-vurgu-a)}',
        '.md-ph{background:var(--s-kagit);border:1px solid var(--s-line);border-radius:14px;overflow:hidden}.md-ph-bas{padding:10px 14px;font-weight:800;font-size:14px;background:var(--s-amber-a);display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}.md-ph-bas small{font-size:12px;font-weight:600;color:var(--s-amber)}',
        '.md-ph-s{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;border-top:1px solid var(--s-line)}.md-ph-s.gitti{opacity:.6}.md-ph-ad{flex:1;min-width:0;display:grid;gap:1px;text-align:left;border:0;background:transparent;color:var(--s-ink);font:inherit;cursor:pointer;padding:0}.md-ph-ad b{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.md-ph-ad small{font-size:12px;color:var(--s-dim)}.md-ph-s .md-btn{flex:none;min-height:36px;padding:0 12px;font-size:12.5px}',
        '.md-uyari{padding:10px 14px;border-left:3px solid var(--s-uyari);background:#FFF8EC;font-size:13px;font-weight:600;border-radius:0 8px 8px 0}.md-uyari.odeme{border-left-color:var(--s-kirmizi);background:#FFF4F3}',
        '.md-bolum{display:grid;gap:12px;padding-top:18px;border-top:1px solid var(--s-line)}.md-bolum-bas{font-weight:800;font-size:15px;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}.md-bolum-bas small{font-size:12px;font-weight:500;color:var(--s-dim)}',
        '.md-aylar{display:flex;gap:18px;overflow-x:auto;border-bottom:1px solid var(--s-line)}.md-aylar button{flex:none;min-height:38px;padding:0 0 6px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--s-dim);font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}',
        '.md-aylar button.aktif{color:var(--s-ink);border-bottom-color:var(--s-vurgu)}.md-aylar i{font-style:normal;font-size:11px;color:var(--s-dim);font-weight:600}',
        '.md-takvim{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.md-gb{text-align:center;font-size:11px;font-weight:700;color:#9AA5A2}',
        '.md-gun{aspect-ratio:1/1;min-height:40px;border-radius:10px;border:0;background:#F3F6F5;color:#2E3936;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0}',
        '.md-gun span{font-size:13px;font-weight:700}.md-gun i{font-style:normal;font-size:12px;line-height:1;font-weight:800}.md-gun:disabled{opacity:.3;cursor:default}.md-gun:hover:not(:disabled){box-shadow:inset 0 0 0 1.5px var(--s-vurgu)}',
        '.md-gun.ders{box-shadow:inset 0 0 0 1.5px #C7DCD8}.md-gun.bugun span{text-decoration:underline;text-underline-offset:3px}.md-gun.acik{outline:2px solid var(--s-ink);outline-offset:1px}',
        '.md-gun.g{background:var(--s-vurgu-a);color:#0F6F67}.md-gun.y{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.md-gun.h{background:var(--s-mor-a);color:var(--s-mor)}.md-gun.t{background:var(--s-amber-a);color:var(--s-amber)}',
        '.md-secici{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;border-radius:12px;background:#FAFBFB;border:1px solid var(--s-line)}.md-secici b{margin-right:6px;font-size:14px}',
        '.md-secici button,.md-ak-duz button{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #D7DFDC;background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}',
        '.md-secici button.g,.md-ak-duz button.g{color:#0F6F67}.md-secici button.y,.md-ak-duz button.y{color:var(--s-kirmizi)}.md-secici button.h{color:var(--s-mor)}.md-secici button.t,.md-ak-duz button.t{color:var(--s-amber)}',
        '.md-secici button.aktif,.md-ak-duz button.aktif{background:var(--s-ink);border-color:var(--s-ink);color:#fff}.md-secici button.kapat{margin-left:auto}',
        '.md-lejant{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;font-weight:600;color:var(--s-dim)}.md-lejant i{font-style:normal;display:inline-flex;width:18px;height:18px;border-radius:5px;align-items:center;justify-content:center;margin-right:5px;font-size:11px;font-weight:800}',
        '.md-lejant .g i{background:var(--s-vurgu-a);color:#0F6F67}.md-lejant .y i{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.md-lejant .h i{background:var(--s-mor-a);color:var(--s-mor)}.md-lejant .t i{background:var(--s-amber-a);color:var(--s-amber)}',
        '.md-paket{display:grid;gap:10px;padding:14px 0;border-bottom:1px solid var(--s-line)}.md-paket:last-child{border-bottom:0}.md-paket.bitti .md-noktalar{opacity:.75}',
        '.md-paket-bas{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;font-size:13px;color:var(--s-dim)}.md-paket-bas b{font-size:15px;color:var(--s-ink);font-weight:800}',
        '.md-noktalar{display:flex;flex-wrap:wrap;gap:6px}.md-n{display:flex;flex-direction:column;align-items:center;justify-content:center;width:46px;height:42px;border-radius:9px;font-size:13px;font-weight:800;line-height:1.1}.md-n small{font-size:9.5px;font-weight:700}',
        '.md-n.g{background:var(--s-vurgu-a);color:#0F6F67}.md-n.y{background:var(--s-kirmizi-a);color:var(--s-kirmizi)}.md-n.h{background:var(--s-mor-a);color:var(--s-mor)}.md-n.t{background:var(--s-amber-a);color:var(--s-amber)}',
        '.md-n.bos{background:transparent;border:1px dashed #CBD5D2;color:#A6B1AE}.md-n.hak{background:transparent;border:1.5px dashed var(--s-uyari);color:var(--s-amber)}',
        '.md-odeme{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.md-odeme input[type=number],.md-odeme input[type=date],.md-odeme input[type=text]{min-height:40px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:0 10px;font:inherit;font-size:13px}',
        '.md-odeme input[type=number]{width:104px}.md-odeme input[type=text]{flex:1;min-width:170px}.md-odeme label{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px}.md-odeme label input{width:18px;height:18px;accent-color:var(--s-vurgu)}',
        '.md-odemeler{display:grid}.md-odemeler div{display:grid;grid-template-columns:80px 110px 90px 1fr;gap:10px;align-items:baseline;font-size:13.5px;padding:8px 0;border-bottom:1px solid var(--s-line)}.md-odemeler small{color:var(--s-dim);font-size:13px}',
        '.md-aktarim{display:grid;gap:16px}.md-aktarim .md-ust{background:var(--s-kagit);border:1px solid var(--s-line);border-radius:16px;padding:18px}',
        '.md-ak-liste{display:grid;background:var(--s-kagit);border:1px solid var(--s-line);border-radius:16px;overflow:hidden}.md-ak-sat{padding:14px 16px;display:grid;gap:10px;border-bottom:1px solid var(--s-line)}.md-ak-sat:last-child{border-bottom:0}.md-ak-sat.pasif{opacity:.5}',
        '.md-ak-ad{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.md-ak-ad b{min-width:120px;font-size:15px}.md-ak-ad select{min-height:38px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);font:inherit;font-size:13px;padding:0 8px;max-width:100%}.md-ak-ad small{color:var(--s-dim);font-weight:600}',
        '.md-ak-cip{display:flex;flex-wrap:wrap;gap:6px}.md-cip{min-height:34px;padding:0 11px;border-radius:999px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:12.5px;cursor:pointer}',
        '.md-cip.g{background:var(--s-vurgu-a);border-color:transparent;color:#0F6F67}.md-cip.y{background:var(--s-kirmizi-a);border-color:transparent;color:var(--s-kirmizi)}.md-cip.t{background:var(--s-amber-a);border-color:transparent;color:var(--s-amber)}',
        '.md-cip.supheli{box-shadow:inset 0 0 0 2px var(--s-uyari)}.md-cip.farkli{outline:2px solid var(--s-kirmizi);outline-offset:1px}.md-cip.ekle{border-style:dashed;color:var(--s-dim);background:transparent}',
        '.md-ak-duz{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;border-radius:12px;background:#FAFBFB;border:1px solid var(--s-line)}.md-ak-duz small{flex-basis:100%;color:var(--s-dim);font-weight:600}.md-ak-duz input{min-height:40px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:0 8px;font:inherit}',
        '.md-ak-alt{display:grid;gap:6px;position:sticky;bottom:0;padding:12px 0 2px;background:var(--s-zemin)}',
        '.md button:focus-visible,.md-aktarim button:focus-visible,.md input:focus-visible,.md select:focus-visible{outline:2px solid var(--s-vurgu);outline-offset:2px}',
        '@media (max-width:860px){.md{grid-template-columns:1fr}.md-liste{position:static;max-height:none}.md-satirlar{max-height:320px;overflow:auto}.md-detay{padding:16px}.md-odemeler div{grid-template-columns:1fr 1fr}}',
        '@media (max-width:480px){.md,.md-aktarim{padding:10px;border-radius:14px}}',
        '.md-cz{display:grid;gap:14px;grid-template-columns:minmax(0,1fr);min-width:0;max-width:100%}.md-cz>*{min-width:0;max-width:100%}.md-cz .md-aylar{max-width:100%}.md-cz-secim{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}.md-cz-ay{display:flex;gap:8px;align-items:center}.md-cz-ay b{min-width:120px;text-align:center}',
        '.md-cz-ekle{font-size:12.5px;color:var(--s-dim);display:flex;gap:6px;align-items:center;font-weight:700}.md-cz-ekle input{border:1px solid var(--s-line);border-radius:8px;padding:5px 6px;background:var(--s-kagit);color:var(--s-ink);font:inherit}',
        '.md-cz-tablo-kap{overflow:auto;max-height:65vh;border:1px solid var(--s-line);border-radius:12px;background:var(--s-kagit)}.md-cz-tablo{border-collapse:separate;border-spacing:0;font-size:13px}',
        '.md-cz-tablo th,.md-cz-tablo td{padding:3px;text-align:center;border-bottom:1px solid var(--s-line)}.md-cz-tablo thead th{position:sticky;top:0;background:var(--s-kagit);z-index:2}',
        '.md-cz-tablo .ad{position:sticky;left:0;background:var(--s-kagit);text-align:left;padding:6px 10px;font-weight:700;white-space:nowrap;z-index:1;min-width:150px}.md-cz-tablo thead .ad{z-index:3}.md-cz-tablo .top{font-weight:800;color:var(--s-vurgu);padding:0 10px}',
        '.md-cz-gun{border:0;background:transparent;color:var(--s-ink);font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:40px;padding:4px;border-radius:8px}.md-cz-gun:hover{background:var(--s-vurgu-a)}.md-cz-gun small{font-size:10px;color:var(--s-dim);font-weight:600}',
        '.md-cz-h{width:40px;height:40px;border-radius:10px;border:1px solid var(--s-line);background:#F3F6F5;color:var(--s-ink);font:inherit;font-weight:900;font-size:16px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-style:normal;padding:0}',
        '.md-cz-h.g{background:var(--s-vurgu-a);color:var(--s-vurgu);border-color:transparent}.md-cz-h.y{background:var(--s-kirmizi-a);color:var(--s-kirmizi);border-color:transparent}.md-cz-h.h{background:var(--s-mor-a);color:var(--s-mor);border-color:transparent}.md-cz-h.t{background:var(--s-amber-a);color:var(--s-amber);border-color:transparent}',
        '.md-cz-h.k{background:var(--s-vurgu-a);color:var(--s-vurgu);border:1px dashed var(--s-vurgu)}.md-gun.k{box-shadow:inset 0 0 0 1.5px var(--s-vurgu);background:transparent}.md-gun.k i{color:var(--s-vurgu)}',
        '.md-cz-h.deg{box-shadow:0 0 0 2px var(--s-uyari)}.md-cz-alt{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.md-cz-acik{margin-right:auto;font-size:12px;color:var(--s-dim);display:flex;gap:6px;align-items:center;flex-wrap:wrap}.md-cz-acik .md-cz-h{width:24px;height:24px;font-size:12px;border-radius:6px;cursor:default}',
        '.md-cz-h.once{background:transparent;border-style:dashed;color:var(--s-dim);cursor:default;font-weight:600}.md-cz-bas{display:block;font-size:10.5px;font-weight:600;color:var(--s-amber)}.md-gun.once{opacity:.45}',
        '.md-cz-ilk{display:grid;gap:8px;padding:14px;border:1px solid var(--s-line);border-radius:14px;background:var(--s-kagit)}.md-cz-ilk-sat{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--s-line)}.md-cz-ilk-sat:last-child{border-bottom:0}.md-cz-ilk-sat b{min-width:150px}.md-cz-ilk-sat input{border:1px solid var(--s-line);border-radius:8px;padding:6px 8px;background:var(--s-kagit);color:var(--s-ink);font:inherit}.md-btn.uyari{border-color:var(--s-uyari);color:var(--s-amber)}',
        '.md-btn:disabled{opacity:.45;cursor:default}.md-cz-ust-btn{display:flex;gap:8px}@media (max-width:480px){.md-cz-tablo .ad{min-width:96px;max-width:118px;overflow:hidden;text-overflow:ellipsis;padding:6px}}'
    ].join('\n');
    document.head.appendChild(st); if (typeof sadeGeceEkle === 'function') sadeGeceEkle(st);
}
