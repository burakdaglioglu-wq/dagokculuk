/* ================================================================================================
   📝 DERS GÜNLÜĞÜ — Milo (2026-10-15, kullanıcı: "her gün neler yaptırdığımızı yazabileceğim bir bölüm: dersin konusu,
   neler yaptırıldı; ay sonunda 'koşma becerisinde 18-24 aya şu, 2 yaşa şunlar, 3 yaşa bunlar' özet döküman; haftalık
   özeti veliye atabileyim: bu hafta bunlar üzerine çalıştık").
   Kayıt: meta 'ders_gunlugu' { id: { tarih, slot, yaslar:[], beceriler:[], konu, yapilanlar, t, sil? } } (son yazan kazanır).
   Haftalık özet: seçilen hafta + yaş grubu → WhatsApp metni (kopyala / paylaş / o yaş grubundaki velilere tek tek).
   Aylık özet: beceri × yaş grubu tablosu (ekranda + PDF, Milo'nun Türkçe yazı tipli PDF yardımcısıyla).
   ================================================================================================ */
const MG = { yuklendi: false, kayit: {}, slotlar: [], uyeler: [], hafta: 0, ay: 0, yas: 'hepsi', form: null, sekme: 'gunluk' };
const MG_YASLAR = ['18-24 ay', '2 yaş', '3 yaş', '4-6 yaş', '7-9 yaş'];
const MG_BECERI = [
    ['kosma', '🏃', 'Koşma'], ['ziplama', '🐸', 'Zıplama'], ['denge', '🤸', 'Denge'], ['atma', '🏐', 'Atma-Tutma'], ['tirmanma', '🧗', 'Tırmanma'],
    ['emekleme', '🐛', 'Emekleme / Sürünme'], ['koordinasyon', '🎯', 'Koordinasyon'], ['esneklik', '🧘', 'Esneklik'], ['kuvvet', '💪', 'Kuvvet'],
    ['ritim', '🎵', 'Ritim / Müzik'], ['incemotor', '✋', 'İnce motor'], ['sosyal', '🤝', 'Sosyal / Paylaşma'], ['oyun', '🎲', 'Oyun / Hayal gücü']
];
const MG_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function mgIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mgTR(iso) { let d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MG_AY[d.getMonth()]; }
function mgGunAd(iso) { return ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date(iso + 'T12:00:00').getDay()]; }
function mgBeceri(id) { return MG_BECERI.find(function (b) { return b[0] === id; }) || [id, '•', id]; }
// Üye/slot grup adından yaş grubu: "18-24 AY" → 18-24 ay, "2 YAŞ GRUP 1" → 2 yaş, "3 Yaş" → 3 yaş …
function mgYasBul(ad) { let s = String(ad || '').toLocaleLowerCase('tr-TR'); if (/18\s*-\s*24/.test(s)) return '18-24 ay'; if (/7\s*-\s*9/.test(s)) return '7-9 yaş'; if (/4\s*-\s*6/.test(s)) return '4-6 yaş'; if (/(^|\D)3\s*ya/.test(s)) return '3 yaş'; if (/(^|\D)2\s*ya/.test(s)) return '2 yaş'; return null; }
async function mgMeta() { try { let r = await miloApi('/meta/ders_gunlugu'); return r && r.value ? JSON.parse(r.value) : {}; } catch (e) { return {}; } }
async function mgYaz(id, kayit) {
    let uzak = await mgMeta(), m = Object.assign({}, uzak); kayit.t = Date.now();
    if (!m[id] || (kayit.t >= (m[id].t || 0))) m[id] = kayit;
    await miloApi('/meta/ders_gunlugu', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(m) }) });
    MG.kayit = m;
}
async function mgYukle() {
    let r = await Promise.all([mgMeta(), miloApi('/antrenman-programi'), miloApi('/members')]);
    MG.kayit = r[0] || {}; MG.slotlar = (r[1] && r[1].slots) || []; MG.uyeler = (r[2] && r[2].members) || []; MG.yuklendi = true;
}
function mgKayitlar() { return Object.keys(MG.kayit).map(function (id) { return Object.assign({ id: id }, MG.kayit[id]); }).filter(function (k) { return !k.sil && k.tarih; }).sort(function (a, b) { return b.tarih.localeCompare(a.tarih) || (b.t || 0) - (a.t || 0); }); }
function mgHafta(o) { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + o * 7); let s = new Date(d); s.setDate(d.getDate() + 6); return { bas: mgIso(d), bit: mgIso(s) }; }
function mgAyStr(o) { let d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + o); return mgIso(d).slice(0, 7); }
function mgGunSlotlari(iso) { let wd = new Date(iso + 'T12:00:00').getDay(); return MG.slotlar.filter(function (s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number).indexOf(wd) !== -1 && !(s.istisnalar || []).some(function (i) { return i.tarih === iso; }); }).sort(function (a, b) { return String(a.baslangicSaat).localeCompare(String(b.baslangicSaat)); }); }

async function mgAc() {
    mgCss();
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    if (!MG.yuklendi) { alan.innerHTML = '<div class="mg-bos">Yükleniyor…</div>'; try { await mgYukle(); } catch (e) { alan.innerHTML = '<div class="mg-bos">Yüklenemedi.</div>'; return; } }
    mgCiz();
}
function mgCiz() {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    let sek = function (k, ad) { return '<button class="' + (MG.sekme === k ? 'aktif' : '') + '" onclick="MG.sekme=\'' + k + '\'; mgCiz()">' + ad + '</button>'; };
    alan.innerHTML = '<div class="mg"><div class="mg-ust"><div><div class="mg-baslik">📝 Ders Günlüğü</div><div class="mg-alt">Her dersin konusu ve neler yaptırıldığı → haftalık veli mesajı ve aylık beceri özeti.</div></div>'
        + '<button class="mg-btn ana" onclick="mgFormAc()">＋ Bugünün dersini yaz</button></div>'
        + '<div class="mg-sekmeler">' + sek('gunluk', '🗓 Günlük kayıtlar') + sek('hafta', '💬 Haftalık veli özeti') + sek('ay', '📄 Aylık beceri özeti') + '</div>'
        + (MG.form ? mgFormHTML() : '')
        + (MG.sekme === 'gunluk' ? mgGunlukHTML() : MG.sekme === 'hafta' ? mgHaftaHTML() : mgAyHTML()) + '</div>';
}
// ---------------- form
function mgFormAc(id, tarih) {
    let k = id ? MG.kayit[id] : null, iso = (k && k.tarih) || tarih || mgIso(new Date()), sl = mgGunSlotlari(iso)[0];
    MG.form = { id: id || ('g' + Date.now().toString(36)), tarih: iso, slot: k ? k.slot : (sl ? sl.grup + ' ' + (sl.baslangicSaat || '') : ''), yaslar: k ? (k.yaslar || []).slice() : (sl && mgYasBul(sl.grup) ? [mgYasBul(sl.grup)] : []), beceriler: k ? (k.beceriler || []).slice() : [], konu: k ? k.konu || '' : '', yapilanlar: k ? k.yapilanlar || '' : '', yeni: !k };
    MG.sekme = 'gunluk'; mgCiz();
    setTimeout(function () { let e = document.getElementById('mg-form'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
}
function mgFormHTML() {
    let f = MG.form, sl = mgGunSlotlari(f.tarih);
    let cip = function (aktif, yazi, fn) { return '<button type="button" class="mg-cip' + (aktif ? ' aktif' : '') + '" onclick="' + fn + '">' + yazi + '</button>'; };
    return '<form class="mg-form" id="mg-form" onsubmit="event.preventDefault(); mgKaydet()">'
        + '<div class="mg-form-bas"><b>' + (f.yeni ? '＋ Yeni ders kaydı' : '✏️ Ders kaydını düzenle') + '</b><button type="button" class="mg-btn" onclick="MG.form=null; mgCiz()">Vazgeç</button></div>'
        + '<div class="mg-satir"><label>Tarih<input type="date" value="' + f.tarih + '" max="' + mgIso(new Date()) + '" onchange="MG.form.tarih=this.value; mgCiz()"></label>'
        + '<label>Ders<select onchange="MG.form.slot=this.value; let y=mgYasBul(this.value); if(y && MG.form.yaslar.indexOf(y)===-1) MG.form.yaslar.push(y); mgCiz()"><option value="">Genel / bütün gün</option>' + sl.map(function (s) { let v = s.grup + ' ' + (s.baslangicSaat || ''); return '<option' + (f.slot === v ? ' selected' : '') + '>' + miloEsc(v) + '</option>'; }).join('') + (f.slot && !sl.some(function (s) { return s.grup + ' ' + (s.baslangicSaat || '') === f.slot; }) ? '<option selected>' + miloEsc(f.slot) + '</option>' : '') + '</select></label></div>'
        + '<div class="mg-etiket">Yaş grubu</div><div class="mg-cipler">' + MG_YASLAR.map(function (y) { return cip(f.yaslar.indexOf(y) !== -1, y, 'mgDegistir(\'yaslar\',\'' + y + '\')'); }).join('') + '</div>'
        + '<div class="mg-etiket">Çalışılan beceriler</div><div class="mg-cipler">' + MG_BECERI.map(function (b) { return cip(f.beceriler.indexOf(b[0]) !== -1, b[1] + ' ' + b[2], 'mgDegistir(\'beceriler\',\'' + b[0] + '\')'); }).join('') + '</div>'
        + '<label class="mg-tam">Dersin konusu<input type="text" id="mg-konu" value="' + miloEsc(f.konu) + '" placeholder="ör. Orman macerası — denge parkuru" oninput="MG.form.konu=this.value"></label>'
        + '<label class="mg-tam">Neler yaptırıldı <small>(her satıra bir etkinlik)</small><textarea id="mg-yap" rows="5" placeholder="Isınma: hayvan yürüyüşleri&#10;Denge tahtasında yan adım&#10;Hula hop içinden zıplama&#10;Top yuvarlama — eşli" oninput="MG.form.yapilanlar=this.value">' + miloEsc(f.yapilanlar) + '</textarea></label>'
        + '<div class="mg-form-alt">' + (f.yeni ? '' : '<button type="button" class="mg-btn sil" onclick="mgSil(\'' + f.id + '\')">🗑 Sil</button>') + '<button class="mg-btn ana buyuk" type="submit">💾 Kaydet</button></div></form>';
}
function mgDegistir(alan, v) { let l = MG.form[alan], i = l.indexOf(v); if (i === -1) l.push(v); else l.splice(i, 1); let k = document.getElementById('mg-konu'), y = document.getElementById('mg-yap'); if (k) MG.form.konu = k.value; if (y) MG.form.yapilanlar = y.value; mgCiz(); }
async function mgKaydet() {
    let f = MG.form; if (!f) return;
    let k = document.getElementById('mg-konu'), y = document.getElementById('mg-yap'); if (k) f.konu = k.value.trim(); if (y) f.yapilanlar = y.value.trim();
    if (!f.konu && !f.yapilanlar) return showToast('Konu ya da yapılanlardan birini yaz.', 'error');
    try { await mgYaz(f.id, { tarih: f.tarih, slot: f.slot || '', yaslar: f.yaslar, beceriler: f.beceriler, konu: f.konu, yapilanlar: f.yapilanlar }); } catch (e) { return showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); }
    MG.form = null; showToast('📝 Ders kaydedildi', 'success'); mgCiz();
}
function mgSil(id) { if (!confirm('Bu ders kaydı silinsin mi?')) return; mgYaz(id, { sil: true, tarih: (MG.kayit[id] || {}).tarih || '' }).then(function () { MG.form = null; mgCiz(); showToast('Silindi', 'success'); }).catch(function () { showToast('Silinemedi.', 'error'); }); }
// ---------------- günlük liste
function mgKartHTML(k) {
    let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    return '<div class="mg-kart"><div class="mg-kart-bas"><b>' + mgTR(k.tarih) + ' · ' + mgGunAd(k.tarih) + '</b>' + (k.slot ? '<span>' + miloEsc(k.slot) + '</span>' : '') + '<button class="mg-btn kucuk" onclick="mgFormAc(\'' + k.id + '\')">✏️</button></div>'
        + (k.konu ? '<div class="mg-konu">' + miloEsc(k.konu) + '</div>' : '')
        + '<div class="mg-cipler kucuk">' + (k.yaslar || []).map(function (y) { return '<span class="mg-et yas">' + miloEsc(y) + '</span>'; }).join('') + (k.beceriler || []).map(function (b) { let x = mgBeceri(b); return '<span class="mg-et">' + x[1] + ' ' + miloEsc(x[2]) + '</span>'; }).join('') + '</div>'
        + (sat.length ? '<ul>' + sat.map(function (x) { return '<li>' + miloEsc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
}
function mgGunlukHTML() {
    let h = mgHafta(MG.hafta), l = mgKayitlar().filter(function (k) { return k.tarih >= h.bas && k.tarih <= h.bit; });
    let gunler = []; for (let i = 0; i < 7; i++) { let d = new Date(h.bas + 'T12:00:00'); d.setDate(d.getDate() + i); gunler.push(mgIso(d)); }
    let bugun = mgIso(new Date());
    return '<div class="mg-nav"><button class="mg-btn" onclick="MG.hafta--; mgCiz()">‹</button><b>' + mgTR(h.bas) + ' – ' + mgTR(h.bit) + '</b><button class="mg-btn" onclick="MG.hafta=Math.min(0,MG.hafta+1); mgCiz()"' + (MG.hafta >= 0 ? ' disabled' : '') + '>›</button></div>'
        + gunler.filter(function (g) { return g <= bugun; }).reverse().map(function (g) {
            let kk = l.filter(function (k) { return k.tarih === g; }), ders = mgGunSlotlari(g);
            if (!kk.length && !ders.length) return '';
            return '<div class="mg-gun"><div class="mg-gun-bas"><b>' + mgGunAd(g) + ' · ' + mgTR(g) + '</b><span>' + (ders.length ? ders.length + ' ders programda' : '') + '</span><button class="mg-btn kucuk" onclick="mgFormAc(null,\'' + g + '\')">＋ yaz</button></div>'
                + (kk.length ? kk.map(mgKartHTML).join('') : '<div class="mg-bos kucuk">Bu gün için kayıt yok.</div>') + '</div>';
        }).join('') || '<div class="mg-bos">Bu hafta ders ya da kayıt yok.</div>';
}
// ---------------- haftalık veli özeti
function mgFiltre(l, yas) { return yas === 'hepsi' ? l : l.filter(function (k) { return (k.yaslar || []).indexOf(yas) !== -1 || !(k.yaslar || []).length; }); }
function mgHaftaMetni(h, yas) {
    let l = mgFiltre(mgKayitlar().filter(function (k) { return k.tarih >= h.bas && k.tarih <= h.bit; }), yas);
    if (!l.length) return '';
    let bec = {}, konular = [];
    l.slice().reverse().forEach(function (k) {
        if (k.konu && konular.indexOf(k.konu) === -1) konular.push(k.konu);
        let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), bl = (k.beceriler || []).length ? k.beceriler : ['diger'];
        bl.forEach(function (b) { bec[b] = bec[b] || []; sat.forEach(function (x) { if (bec[b].indexOf(x) === -1) bec[b].push(x); }); });
    });
    let m = '🌟 MILO FITT KIDS · ' + mgTR(h.bas) + ' – ' + mgTR(h.bit) + ' haftası' + (yas !== 'hepsi' ? ' (' + yas + ')' : '') + '\n\nBu hafta şunlar üzerine çalıştık:\n';
    if (konular.length) m += '\n📌 ' + konular.join(' · ') + '\n';
    Object.keys(bec).forEach(function (b) { let x = b === 'diger' ? ['', '✨', 'Diğer'] : mgBeceri(b); m += '\n' + x[1] + ' ' + x[2] + (bec[b].length ? ':\n' + bec[b].slice(0, 6).map(function (s) { return '  • ' + s; }).join('\n') : '') + '\n'; });
    m += '\nEvde de birlikte deneyebilirsiniz 💛 Görüşmek üzere!';
    return m;
}
function mgHaftaHTML() {
    let h = mgHafta(MG.hafta), metin = mgHaftaMetni(h, MG.yas);
    let veliler = MG.yas === 'hepsi' ? [] : MG.uyeler.filter(function (u) { return !u.pasif && mgYasBul(u.grup) === MG.yas && u.acilTelefon; });
    return '<div class="mg-nav"><button class="mg-btn" onclick="MG.hafta--; mgCiz()">‹</button><b>' + mgTR(h.bas) + ' – ' + mgTR(h.bit) + '</b><button class="mg-btn" onclick="MG.hafta=Math.min(0,MG.hafta+1); mgCiz()"' + (MG.hafta >= 0 ? ' disabled' : '') + '>›</button></div>'
        + '<div class="mg-cipler">' + ['hepsi'].concat(MG_YASLAR).map(function (y) { return '<button class="mg-cip' + (MG.yas === y ? ' aktif' : '') + '" onclick="MG.yas=\'' + y + '\'; mgCiz()">' + (y === 'hepsi' ? 'Hepsi' : y) + '</button>'; }).join('') + '</div>'
        + (metin ? '<textarea class="mg-metin" id="mg-hafta-metin" rows="14">' + miloEsc(metin) + '</textarea>'
            + '<div class="mg-form-alt"><button class="mg-btn" onclick="mgKopyala()">📋 Kopyala</button><button class="mg-btn ana" onclick="mgPaylas()">💬 WhatsApp\'ta paylaş</button></div>'
            + (veliler.length ? '<div class="mg-etiket">' + MG.yas + ' velileri (' + veliler.length + ') — dokun, mesaj hazır açılır</div><div class="mg-cipler">' + veliler.map(function (u) { return '<button class="mg-cip" onclick="mgPaylas(\'' + String(u.acilTelefon).replace(/\D/g, '') + '\')">💬 ' + miloEsc(u.ad.split(' ')[0]) + '</button>'; }).join('') + '</div>' : (MG.yas !== 'hepsi' ? '<div class="mg-alt">Bu yaş grubunda telefonu kayıtlı veli yok.</div>' : '<div class="mg-alt">Velilere tek tek göndermek için yukarıdan yaş grubu seç.</div>'))
            : '<div class="mg-bos">Bu hafta' + (MG.yas !== 'hepsi' ? ' ' + MG.yas + ' için' : '') + ' ders kaydı yok — 🗓 Günlük kayıtlar\'dan yaz.</div>');
}
function mgKopyala() { let t = document.getElementById('mg-hafta-metin'); if (!t) return; try { navigator.clipboard.writeText(t.value).then(function () { showToast('📋 Kopyalandı', 'success'); }); } catch (e) { t.select(); document.execCommand('copy'); showToast('📋 Kopyalandı', 'success'); } }
function mgPaylas(tel) {
    let t = document.getElementById('mg-hafta-metin'); if (!t) return;
    let n = String(tel || ''); if (n.startsWith('0')) n = '90' + n.slice(1); else if (n && !n.startsWith('90')) n = '90' + n;
    window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(t.value), '_blank');
}
// ---------------- aylık beceri özeti
function mgAyVeri(ay) {
    let l = mgKayitlar().filter(function (k) { return k.tarih.slice(0, 7) === ay; }), t = {};
    l.forEach(function (k) {
        let sat = String(k.yapilanlar || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        let yl = (k.yaslar || []).length ? k.yaslar : ['Genel'], bl = (k.beceriler || []).length ? k.beceriler : ['diger'];
        bl.forEach(function (b) { yl.forEach(function (y) { let h = ((t[b] = t[b] || {})[y] = t[b][y] || { gun: [], is: [] }); if (h.gun.indexOf(k.tarih) === -1) h.gun.push(k.tarih); sat.forEach(function (x) { if (h.is.indexOf(x) === -1) h.is.push(x); }); }); });
    });
    let sira = MG_BECERI.map(function (b) { return b[0]; }).concat(['diger']).filter(function (b) { return t[b]; });
    return { l: l, t: t, sira: sira, yaslar: MG_YASLAR.concat(['Genel']) };
}
function mgAyHTML() {
    let ay = mgAyStr(MG.ay), v = mgAyVeri(ay), ad = MG_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4);
    return '<div class="mg-nav"><button class="mg-btn" onclick="MG.ay--; mgCiz()">‹</button><b>' + ad + '</b><button class="mg-btn" onclick="MG.ay=Math.min(0,MG.ay+1); mgCiz()"' + (MG.ay >= 0 ? ' disabled' : '') + '>›</button></div>'
        + (v.l.length ? '<div class="mg-alt">' + v.l.length + ' ders kaydı · ' + v.sira.length + ' beceri</div>'
            + v.sira.map(function (b) { let x = b === 'diger' ? ['', '✨', 'Diğer'] : mgBeceri(b); return '<div class="mg-kart"><div class="mg-kart-bas"><b>' + x[1] + ' ' + x[2] + '</b></div>' + v.yaslar.filter(function (y) { return v.t[b][y]; }).map(function (y) { let h = v.t[b][y]; return '<div class="mg-ay-sat"><span class="mg-et yas">' + y + '</span><small>' + h.gun.length + ' ders</small><div>' + (h.is.length ? h.is.map(miloEsc).join(' · ') : '—') + '</div></div>'; }).join('') + '</div>'; }).join('')
            + '<div class="mg-form-alt"><button class="mg-btn ana buyuk" onclick="mgAyPdf()">📄 ' + ad + ' özetini PDF indir</button></div>'
            : '<div class="mg-bos">' + ad + ' için ders kaydı yok.</div>');
}
// ---------------- aylık PDF — "A · Sade": beyaz sayfa, ince başlık çizgisi, petrol yeşili küçük başlıklar, düz satırlar
function mgAyPdf() {
    let ay = mgAyStr(MG.ay), v = mgAyVeri(ay), ad = MG_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4);
    if (typeof _miloYeniPdfAl !== 'function') return showToast('PDF aracı yüklenemedi.', 'error');
    showToast('PDF hazırlanıyor…', 'success');
    _miloYeniPdfAl('portrait').then(function (pdf) {
        let T = typeof _miloTrTranslit === 'function' ? _miloTrTranslit : function (s) { return s; }, mx = 18, uw = 174, pageH = 297, y = 24;
        let baslik = function (ilk) {
            pdf.setTextColor(27, 36, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(ilk ? 18 : 12);
            pdf.text(T(ad + ' · Ders Özeti'), mx, y);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(107, 121, 118);
            pdf.text('MILO FITT KIDS', mx, y + 6);
            pdf.text(T(v.l.length + ' ders kaydı · ' + v.sira.length + ' beceri'), mx + uw, y + 6, { align: 'right' });
            pdf.setDrawColor(27, 36, 34); pdf.setLineWidth(0.5); pdf.line(mx, y + 9, mx + uw, y + 9);
            y += 18;
        };
        baslik(true);
        v.sira.forEach(function (b) {
            let x = b === 'diger' ? ['', '', 'Diğer'] : mgBeceri(b);
            if (y > pageH - 40) { pdf.addPage(); y = 22; baslik(false); }
            pdf.setTextColor(15, 111, 103); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5);
            pdf.text(T(x[2]).toLocaleUpperCase('tr-TR'), mx, y); y += 4.5;
            v.yaslar.filter(function (yy) { return v.t[b][yy]; }).forEach(function (yy) {
                let h = v.t[b][yy], satir = pdf.splitTextToSize(T(h.is.length ? h.is.join(' · ') : '—'), uw - 42);
                let yuk = Math.max(11, satir.length * 4.6 + 4.5);
                if (y + yuk > pageH - 20) { pdf.addPage(); y = 22; baslik(false); }
                pdf.setTextColor(27, 36, 34); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(T(yy), mx, y + 3.6);
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(140, 150, 147); pdf.text(T(h.gun.length + ' ders'), mx, y + 7.2);
                pdf.setTextColor(46, 57, 54); pdf.setFontSize(9); pdf.text(satir, mx + 40, y + 3.6);
                y += yuk;
                pdf.setDrawColor(228, 233, 231); pdf.setLineWidth(0.25); pdf.line(mx, y - 1.2, mx + uw, y - 1.2);
            });
            y += 5;
        });
        let n = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= n; i++) { pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(154, 165, 162); pdf.text('Milo Fitt Kids', mx, pageH - 10); pdf.text(i + ' / ' + n, mx + uw, pageH - 10, { align: 'right' }); }
        pdf.save('Milo_Ders_Ozeti_' + ay + '.pdf');
    }).catch(function () { showToast('PDF oluşturulamadı.', 'error'); });
}
// ---------------- stil: "A · Sade" (kullanıcı seçimi 2026-10-15) — Defter ile aynı jetonlar
function mgCss() {
    if (!document.getElementById('sade-font')) { let l = document.createElement('link'); l.id = 'sade-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('mg-css')) return;
    let st = document.createElement('style'); st.id = 'mg-css';
    st.textContent = [
        '.mg{--s-zemin:#F4F7F6;--s-kagit:#FFFFFF;--s-ink:#1B2422;--s-dim:#6B7976;--s-line:#E4E9E7;--s-vurgu:#138A80;--s-vurgu-a:#E3F4F1;--s-kirmizi:#B4372F;',
        'font-family:"Manrope",system-ui,sans-serif;color:var(--s-ink);background:var(--s-zemin);border-radius:18px;padding:22px;color-scheme:light;display:grid;gap:16px;max-width:980px}',
        '.mg-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.mg-baslik{font-size:24px;font-weight:800;letter-spacing:-.02em}.mg-alt{font-size:13px;color:var(--s-dim);font-weight:500;margin-top:3px}',
        '.mg-btn{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #D7DFDC;background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}.mg-btn:hover:not(:disabled){border-color:var(--s-vurgu)}.mg-btn:disabled{opacity:.35;cursor:default}',
        '.mg-btn.ana{background:var(--s-vurgu);border-color:var(--s-vurgu);color:#fff}.mg-btn.buyuk{min-height:50px;padding:0 20px;font-size:15px}.mg-btn.kucuk{min-height:34px;padding:0 10px;font-size:12.5px}.mg-btn.sil{color:var(--s-kirmizi)}',
        '.mg-sekmeler{display:flex;gap:22px;border-bottom:1px solid var(--s-line);overflow-x:auto}.mg-sekmeler button{flex:none;min-height:40px;padding:0 0 8px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--s-dim);font:inherit;font-weight:700;font-size:14px;cursor:pointer}',
        '.mg-sekmeler button.aktif{color:var(--s-ink);border-bottom-color:var(--s-vurgu)}',
        '.mg-form{background:var(--s-kagit);border:1px solid var(--s-line);border-radius:16px;padding:20px;display:grid;gap:14px;box-shadow:0 12px 40px rgba(20,40,35,.06)}.mg-form-bas{display:flex;justify-content:space-between;align-items:center;gap:8px}.mg-form-bas b{font-size:17px;font-weight:800}',
        '.mg-satir{display:flex;flex-wrap:wrap;gap:12px}.mg-satir label,.mg-tam{display:grid;gap:5px;font-size:12px;font-weight:700;color:var(--s-dim)}.mg-satir label{flex:1;min-width:160px}.mg-tam small{font-weight:500}',
        '.mg-form input,.mg-form select,.mg-form textarea,.mg-metin{min-height:42px;border-radius:10px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);padding:9px 12px;font:inherit;font-size:14px;box-sizing:border-box;width:100%}',
        '.mg-form textarea,.mg-metin{resize:vertical;line-height:1.55}.mg-etiket{font-size:12px;font-weight:700;color:var(--s-dim)}',
        '.mg-cipler{display:flex;flex-wrap:wrap;gap:6px}.mg-cip{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--s-line);background:var(--s-kagit);color:var(--s-ink);font:inherit;font-weight:600;font-size:13px;cursor:pointer}',
        '.mg-cip.aktif{background:var(--s-vurgu-a);border-color:var(--s-vurgu);color:#0F6F67;font-weight:800}',
        '.mg-form-alt{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
        '.mg-nav{display:flex;align-items:center;gap:12px}.mg-nav b{min-width:170px;text-align:center;font-size:15px;font-weight:800}',
        '.mg-gun{display:grid;gap:8px;padding-top:6px}.mg-gun-bas{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.mg-gun-bas b{font-size:15px;font-weight:800}.mg-gun-bas span{font-size:12px;color:var(--s-dim);font-weight:600;flex:1}',
        '.mg-kart{background:var(--s-kagit);border:1px solid var(--s-line);border-radius:14px;padding:14px 16px;display:grid;gap:8px}.mg-kart-bas{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mg-kart-bas b{font-size:14.5px;font-weight:800}.mg-kart-bas span{font-size:12.5px;color:var(--s-dim);font-weight:600;flex:1}',
        '.mg-konu{font-size:16px;font-weight:800;letter-spacing:-.01em}.mg-kart ul{margin:0;padding-left:18px;display:grid;gap:3px;font-size:14px;color:#2E3936;line-height:1.5}',
        '.mg-cipler.kucuk{gap:5px}.mg-et{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:#F3F6F5;font-size:11.5px;font-weight:700;color:#3D4A47}.mg-et.yas{background:var(--s-vurgu-a);color:#0F6F67}',
        '.mg-ay-sat{display:grid;grid-template-columns:90px 64px 1fr;gap:10px;align-items:baseline;padding:8px 0;border-top:1px solid var(--s-line);font-size:14px;line-height:1.5}.mg-ay-sat small{color:var(--s-dim);font-weight:600}',
        '.mg-bos{padding:18px;text-align:center;color:var(--s-dim);font-weight:600}.mg-bos.kucuk{padding:4px 0;text-align:left;font-size:13px}',
        '.mg button:focus-visible,.mg input:focus-visible,.mg select:focus-visible,.mg textarea:focus-visible{outline:2px solid var(--s-vurgu);outline-offset:2px}',
        '@media (max-width:600px){.mg{padding:12px}.mg-ay-sat{grid-template-columns:1fr 1fr}.mg-ay-sat div{grid-column:1 / -1}}'
    ].join('\n');
    document.head.appendChild(st);
}
