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
   PAKET HESABI (saklanmaz): öğrencinin kayıtları tarih sırasıyla; telafi olmayan her kayıt (geldi/gelmedi/hasta) paketin
   8 dersinden birini doldurur, 8 dolunca yeni paket. Gelmediği her ders 1 telafi hakkı; telafi kaydı hakkı açık en eski
   pakete yazılır (8 ders + telafi = 9). Paket 8'i doldurduysa ve hak kullanılmadıysa uyarı.
   ================================================================================================ */
const MD = { yuklendi: false, uyeler: [], att: {}, durum: {}, odeme: {}, slotlar: [], dues: [], secili: null, ay: null, ara: '', ekran: 'liste', secim: null, aktarim: null };
const MD_DURUM = { g: { ad: 'Geldi', ikon: '✓', cls: 'g' }, y: { ad: 'Gelmedi', ikon: '✕', cls: 'y' }, h: { ad: 'Hasta', ikon: '🤒', cls: 'h' }, t: { ad: 'Telafi', ikon: '🔁', cls: 't' } };
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
    let r = await Promise.all([miloApi('/members'), miloApi('/attendance/auto'), mdMeta('yoklama_durum'), mdMeta('paket_odeme'), miloApi('/antrenman-programi'), miloApi('/dues').catch(function () { return { dues: [] }; })]);
    MD.uyeler = r[0].members || []; MD.att = {};
    (r[1].attendance || []).forEach(function (a) { (MD.att[a.tarih] = MD.att[a.tarih] || {})[a.ad] = { geldi: a.geldi !== 0 && a.geldi !== false, grup: a.grup, saat: a.saat }; });
    MD.durum = r[2] || {}; MD.odeme = r[3] || {}; MD.slotlar = (r[4] && r[4].slots) || []; MD.dues = (r[5] && r[5].dues) || [];
    try { miloUyeler = MD.uyeler; } catch (e) {}
    MD.yuklendi = true;
}
// Öğrencinin bir gündeki durumu: 'g' | 'y' | 'h' | 't' | null
function mdGun(u, iso) {
    let a = (MD.att[iso] || {})[u.ad]; if (!a) return null;
    if (a.grup && a.grup !== u.grup && MD.uyeler.some(function (x) { return x.grup === a.grup && x.ad === u.ad; })) return null;
    let e = MD.durum[iso + '|' + u.ad], d = e && !e.sil ? e.d : null;
    if (a.geldi) return d === 'telafi' ? 't' : 'g';
    return d === 'hasta' ? 'h' : 'y';
}
function mdKayitlar(u) {
    return Object.keys(MD.att).filter(function (iso) { return mdGun(u, iso); }).sort().map(function (iso) { return { iso: iso, s: mdGun(u, iso) }; });
}
function mdPaketler(u) {
    let pk = [], cur = null, yeni = function () { cur = { no: pk.length + 1, dersler: [], telafiler: [], hak: 0 }; pk.push(cur); };
    mdKayitlar(u).forEach(function (r) {
        if (r.s === 't') {
            let hedef = pk.find(function (p) { return p.hak > p.telafiler.length; }) || cur;
            if (!hedef) { yeni(); hedef = cur; }
            hedef.telafiler.push(r); return;
        }
        if (!cur || cur.dersler.length >= 8) yeni();
        cur.dersler.push(r); if (r.s === 'y' || r.s === 'h') cur.hak++;
    });
    pk.forEach(function (p) {
        p.bas = p.dersler.length ? p.dersler[0].iso : (p.telafiler[0] || {}).iso; let son = p.dersler.concat(p.telafiler).map(function (r) { return r.iso; }).sort(); p.bit = son[son.length - 1];
        p.geldi = p.dersler.filter(function (r) { return r.s === 'g'; }).length + p.telafiler.length;
        p.dolu = p.dersler.length >= 8; p.kalanHak = Math.max(0, p.hak - p.telafiler.length);
        p.odeme = MD.odeme[mdKey(u) + '|' + p.no] || null;
    });
    return pk;
}
function mdOzet(u) {
    let k = mdKayitlar(u), say = { g: 0, y: 0, h: 0, t: 0 }; k.forEach(function (r) { say[r.s]++; });
    let pk = mdPaketler(u), hak = pk.reduce(function (a, p) { return a + p.kalanHak; }, 0), son = pk[pk.length - 1] || null;
    let odemeler = pk.filter(function (p) { return p.odeme && p.odeme.odendi; }).map(function (p) { return { no: p.no, tarih: p.odeme.odemeTarihi, tutar: p.odeme.tutar, not: p.odeme.not }; });
    let uyarilar = [];
    pk.forEach(function (p) {
        if (p.dolu && p.kalanHak > 0) uyarilar.push({ tur: 'telafi', metin: 'Paket ' + p.no + ': 8 ders doldu — ' + p.kalanHak + ' telafi hakkı var (toplam ' + (8 + p.hak) + ' ders).' });
        if (!(p.odeme && p.odeme.odendi) && (p.dersler.length || p.telafiler.length)) uyarilar.push({ tur: 'odeme', metin: 'Paket ' + p.no + ' ödemesi girilmedi.' });
    });
    return { kayit: k, say: say, paketler: pk, hak: hak, son: son, odemeler: odemeler, uyarilar: uyarilar, ilk: k.length ? k[0].iso : null, sonGelis: (k.filter(function (r) { return r.s === 'g' || r.s === 't'; }).pop() || {}).iso || null };
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
    let ek = s === 'h' ? 'hasta' : s === 't' ? 'telafi' : null, mevcut = MD.durum[anahtar];
    if (ek || (mevcut && !mevcut.sil && mevcut.d)) {
        let kayit = {}; kayit[anahtar] = ek ? { d: ek, t: Date.now() } : { d: null, sil: true, t: Date.now() };
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
    MD.ekran = 'liste'; mdCiz();
}
function mdUye(k) { return MD.uyeler.find(function (u) { return mdKey(u) === k; }); }
function mdCiz(korunsun) {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    let y = korunsun ? (alan.scrollTop || 0) : 0, wy = korunsun ? window.scrollY : 0;
    if (MD.ekran === 'aktarim') alan.innerHTML = mdAktarimHTML();
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
    try { if (!localStorage.getItem('milo_kagit_aktarim_2026_10')) aktarim = '<button class="md-btn ana genis" onclick="mdAktarimAc()">📋 Kâğıt çizelgeyi aktar (okundu, onay bekliyor)</button>'; } catch (e) {}
    return '<div class="md-liste"><div class="md-baslik">📒 Öğrenci Defteri</div>' + aktarim
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
        + (u.acilTelefon ? '<button class="md-btn" onclick="mdVeliMesaj(\'' + mdEnc(mdKey(u)) + '\')">💬 Veliye özet</button>' : '') + '</div>'
        + '<div class="md-kutular">' + kutu(o.say.g + o.say.t, 'geldi', 'g') + kutu(o.say.y, 'gelmedi', 'y') + kutu(o.say.h, 'hasta', 'h') + kutu(o.say.t, 'telafi yaptı', 't') + kutu(o.hak, 'açık telafi hakkı', o.hak ? 'uyari' : '') + kutu(p ? p.dersler.length + '/8' : '—', p ? 'paket ' + p.no : 'paket', '') + '</div>'
        + o.uyarilar.map(function (w) { return '<div class="md-uyari ' + w.tur + '">' + (w.tur === 'telafi' ? '🔁 ' : '💰 ') + miloEsc(w.metin) + '</div>'; }).join('')
        + '<div class="md-bolum"><div class="md-bolum-bas">🗓 Yoklama takvimi <small>güne dokun → durum seç · halkalı günler programdaki ders günleri</small></div>'
        + '<div class="md-aylar">' + aylar.map(function (a) { let say = o.kayit.filter(function (r) { return r.iso.slice(0, 7) === a; }).length; return '<button class="' + (a === MD.ay ? 'aktif' : '') + '" onclick="MD.ay=\'' + a + '\'; MD.secim=null; mdDetayYenile()">' + MD_AY[+a.slice(5) - 1] + (a.slice(0, 4) !== String(new Date().getFullYear()) ? ' ' + a.slice(0, 4) : '') + (say ? ' <i>' + say + '</i>' : '') + '</button>'; }).join('') + '</div>'
        + mdTakvimHTML(u) + '<div class="md-lejant">' + Object.keys(MD_DURUM).map(function (k) { return '<span class="' + MD_DURUM[k].cls + '"><i>' + MD_DURUM[k].ikon + '</i>' + MD_DURUM[k].ad + '</span>'; }).join('') + '</div></div>'
        + '<div class="md-bolum"><div class="md-bolum-bas">📦 Paketler (8 ders) <small>gelmediği her ders 1 telafi hakkı · telafiyle 9 ders</small></div>' + (o.paketler.length ? o.paketler.slice().reverse().map(function (pk) { return mdPaketHTML(u, pk); }).join('') : '<div class="md-bos">Henüz yoklama yok — takvimden gün işaretle.</div>') + '</div>'
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
        let iso = a + '-' + String(d).padStart(2, '0'), s = mdGun(u, iso), wd = new Date(iso + 'T12:00:00').getDay(), ders = !!dg[wd], gelecek = iso > bugun;
        h += '<button class="md-gun' + (s ? ' ' + MD_DURUM[s].cls : '') + (ders ? ' ders' : '') + (iso === bugun ? ' bugun' : '') + (MD.secim === iso ? ' acik' : '') + '"' + (gelecek ? ' disabled' : '') + ' onclick="mdGunSec(\'' + iso + '\')" aria-label="' + d + ' ' + MD_AY[ilk.getMonth()] + (s ? ' ' + MD_DURUM[s].ad : '') + '"><span>' + d + '</span>' + (s ? '<i>' + MD_DURUM[s].ikon + '</i>' : '') + '</button>';
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
    try { await mdGunYaz(u, iso, s); } catch (e) { showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); return; }
    MD.secim = null; mdDetayYenile();
    let o = mdOzet(u), w = o.uyarilar.find(function (x) { return x.tur === 'telafi'; });
    showToast(s ? mdTR(iso) + ': ' + MD_DURUM[s].ad : mdTR(iso) + ' boşaltıldı', 'success');
    if (w && (s === 'y' || s === 'h' || s === 'g')) setTimeout(function () { showToast('🔁 ' + w.metin, 'warning'); }, 900);
}
function mdPaketHTML(u, p) {
    let o = p.odeme || {}, k = mdEnc(mdKey(u) + '|' + p.no);
    let nokta = p.dersler.map(function (r) { return '<span class="md-n ' + MD_DURUM[r.s].cls + '" title="' + mdTR(r.iso) + ' · ' + MD_DURUM[r.s].ad + '">' + MD_DURUM[r.s].ikon + '<small>' + mdKisaTR(r.iso) + '</small></span>'; }).join('')
        + Array.from({ length: Math.max(0, 8 - p.dersler.length) }, function () { return '<span class="md-n bos"><small>—</small></span>'; }).join('')
        + p.telafiler.map(function (r) { return '<span class="md-n t" title="Telafi ' + mdTR(r.iso) + '">🔁<small>' + mdKisaTR(r.iso) + '</small></span>'; }).join('')
        + Array.from({ length: p.kalanHak }, function () { return '<span class="md-n hak" title="Kullanılmamış telafi hakkı">🔁<small>hak</small></span>'; }).join('');
    let durum = p.dolu ? (p.kalanHak ? '<b class="md-turuncu">8/8 · ' + p.kalanHak + ' telafi hakkı açık</b>' : '<b class="md-yesil">tamamlandı</b>') : p.dersler.length + '/8 ders';
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
    showToast('✅ ' + isler.length + ' yoklama kaydı aktarıldı', 'success');
    MD.ekran = 'liste'; MD.yuklendi = false; await mdYukle(); mdCiz();
}

// ---------------- stil: "A · Sade" (2026-10-15, kullanıcı 3 tema arasından seçti): beyaz kâğıt, tek vurgu (petrol yeşili),
// bol boşluk, kutu/çerçeve en aza; sayılar büyük, açıklamalar küçük. Uygulamanın koyu kabuğu içinde açık bir sayfa olarak durur.
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
        '@media (max-width:480px){.md,.md-aktarim{padding:10px;border-radius:14px}}'
    ].join('\n');
    document.head.appendChild(st);
}
