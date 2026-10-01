/* ================================================================================================
   📝 MILO HIZLI DÜZENLE (2026-09-30) — ana app'teki Hızlı Düzenle'nin Milo karşılığı (kullanıcı: "Milo'ya da").
   Satır = üye, sütun = bilgi. Hücreye yazılanlar TASLAK'ta birikir; "💾 Kaydet" (Ctrl+S) basılana kadar sunucuya
   hiçbir şey gitmez. Kaydetmeden sekme değiştirme / çıkış / sayfa kapatmada uyarı. 📄 PDF: süzgece göre liste.
   - Enter / ↓ alt satır, ↑ üst satır (aynı sütun). Excel'den çok satırlı yapıştırma aşağı doğru doldurur.
   - İsim/grup değişikliği onayla ve veri kaybısız (/rename — aidat, yoklama, beceri, ders kayıtları taşınır).
   - Milo verisi doğrudan sunucuda (yerel kopya yok): kayıt = üye başına tek PATCH, sonra liste yeniden çekilir.
   - 15 sn'lik otomatik yenileme bu sekmede çalışmaz (yazarken tablo yeniden çizilmesin) — bkz. miloPollingBaslat.
   ================================================================================================ */
const MHD_SUTUNLAR = [
    { id: 'ad', ad: 'Ad Soyad', tip: 'metin', gen: 190 },
    { id: 'grup', ad: 'Grup', tip: 'grup', gen: 130 },
    { id: 'dogumTarihi', ad: 'Doğum tarihi', tip: 'tarih', gen: 138, eksik: true },
    { id: 'cinsiyet', ad: 'Cins.', tip: 'secim', secenek: [['', '—'], ['K', 'Kız'], ['E', 'Erkek']], gen: 76, eksik: true },
    { id: 'acilKisi', ad: 'Veli adı', tip: 'metin', gen: 150, eksik: true },
    { id: 'acilTelefon', ad: 'Veli telefonu', tip: 'tel', gen: 140, eksik: true },
    { id: 'veli2Kisi', ad: '2. veli adı', tip: 'metin', gen: 150 },
    { id: 'veli2Telefon', ad: '2. veli telefonu', tip: 'tel', gen: 140 },
    { id: 'aileMeslek', ad: 'Veli iş / meslek', tip: 'metin', gen: 190, yer: 'ör. Avukat · Yıldız Hukuk' },
    { id: 'boy', ad: 'Boy (cm)', tip: 'sayi', gen: 84 },
    { id: 'kilo', ad: 'Kilo (kg)', tip: 'sayi', gen: 84 },
    { id: 'saglikNotu', ad: 'Sağlık notu', tip: 'metin', gen: 170, yer: 'ör. astım, alerji' },
    { id: 'aidatMuaf', ad: 'Aidat muaf', tip: 'onay', gen: 70 },
    { id: 'pasif', ad: 'Pasif', tip: 'onay', gen: 60 },
    { id: 'genelNot', ad: 'Not', tip: 'metin', gen: 200 }
];
const MHD_SAYFA = 60;
let _mhd = { grup: 'hepsi', ara: '', eksik: false, pasifler: false, sayfa: 1, taslak: {}, tam: window.innerWidth >= 900 };

function mhdKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function mhdCoz(k) { let s = decodeURIComponent(k), i = s.indexOf('|'); return { g: s.slice(0, i), ad: s.slice(i + 1) }; }
function mhdKatla(s) { return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
function mhdUye(g, ad) { return miloUyeler.find(function (u) { return u.grup === g && u.ad === ad; }); }
function mhdGruplar() { return [...new Set(miloUyeler.map(function (u) { return u.grup; }))].sort(function (a, b) { return a.localeCompare(b, 'tr'); }); }
function mhdDeger(u, s) {
    if (s.id === 'ad') return u.ad; if (s.id === 'grup') return u.grup;
    let t = _mhd.taslak[u.grup + '|' + u.ad]; if (t && Object.prototype.hasOwnProperty.call(t, s.id)) return t[s.id];
    let v = u[s.id]; if (s.tip === 'onay') return !!v; return v === undefined || v === null ? '' : v;
}
function mhdTaslakMi(u, s) { let t = _mhd.taslak[u.grup + '|' + u.ad]; return !!(t && Object.prototype.hasOwnProperty.call(t, s.id)); }
function mhdEksikMi(u, s) { if (!s.eksik) return false; let v = mhdDeger(u, s); return v === '' || v === false; }
function mhdDegisiklikSay() { let n = 0; Object.keys(_mhd.taslak).forEach(function (k) { n += Object.keys(_mhd.taslak[k]).length; }); return n; }
function mhdSatirlar() {
    let q = mhdKatla(_mhd.ara.trim());
    return miloUyeler.filter(function (u) {
        if (_mhd.grup !== 'hepsi' && u.grup !== _mhd.grup) return false;
        if (mhdDeger(u, { id: 'pasif', tip: 'onay' }) && !_mhd.pasifler) return false;
        if (q && mhdKatla(u.ad).indexOf(q) < 0) return false;
        if (_mhd.eksik && !MHD_SUTUNLAR.some(function (s) { return mhdEksikMi(u, s); })) return false;
        return true;
    }).sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
}
function mhdHucre(u, s, satir) {
    let v = mhdDeger(u, s), k = mhdKey(u.grup, u.ad), ort = 'data-k="' + k + '" data-s="' + s.id + '" data-r="' + satir + '" onkeydown="mhdTus(event)"';
    let sinif = (mhdEksikMi(u, s) ? ' mhd-eksik' : '') + (mhdTaslakMi(u, s) ? ' mhd-degisti' : '');
    if (s.tip === 'onay') return '<td class="mhd-td mhd-orta' + sinif + '"><input type="checkbox" ' + ort + (v ? ' checked' : '') + ' onchange="mhdDegistir(this)" aria-label="' + s.ad + '"></td>';
    if (s.tip === 'secim') return '<td class="mhd-td' + sinif + '"><select ' + ort + ' onchange="mhdDegistir(this)" aria-label="' + s.ad + '">' + s.secenek.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>';
    let tur = s.tip === 'tarih' ? 'date' : s.tip === 'tel' ? 'tel' : 'text';
    let ek = s.tip === 'tel' ? ' inputmode="tel" placeholder="05xx…"' : s.tip === 'sayi' ? ' inputmode="decimal"' : s.yer ? ' placeholder="' + miloEsc(s.yer) + '"' : '';
    if (s.tip === 'grup') ek = ' list="mhd-grup-liste"';
    return '<td class="mhd-td' + sinif + (s.id === 'ad' ? ' mhd-sabit' : '') + '"><input type="' + tur + '" ' + ort + ' value="' + miloEsc(String(v)) + '" onchange="mhdDegistir(this)" onpaste="mhdYapistir(event)" aria-label="' + s.ad + '"' + ek + '></td>';
}
function mhdCubukIc() {
    let n = mhdDegisiklikSay();
    return n
        ? '<span class="mhd-kc-yazi"><b>● ' + n + ' kaydedilmemiş değişiklik</b></span><button class="mhd-btn" onclick="mhdVazgec()">↺ Vazgeç</button><button class="mhd-btn ana mhd-kc-kaydet" onclick="mhdTumunuKaydet()">💾 Kaydet</button>'
        : '<span class="mhd-kc-yazi">Kaydedilmemiş değişiklik yok</span><button class="mhd-btn ana mhd-kc-kaydet" disabled>💾 Kaydet</button>';
}
function mhdCubukGuncelle() { let c = document.getElementById('mhd-kaydet-cubuk'); if (c) { c.innerHTML = mhdCubukIc(); c.classList.toggle('bekliyor', mhdDegisiklikSay() > 0); } }
function mhdCiz() {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    let tum = mhdSatirlar(), goster = tum.slice(0, _mhd.sayfa * MHD_SAYFA), gruplar = mhdGruplar();
    if (_mhd.grup !== 'hepsi' && gruplar.indexOf(_mhd.grup) < 0) _mhd.grup = 'hepsi';
    let aktif = miloUyeler.filter(function (u) { return !u.pasif; });
    let bas = MHD_SUTUNLAR.map(function (s) { let n = s.eksik ? aktif.filter(function (u) { return mhdEksikMi(u, s); }).length : 0; return '<th style="min-width:' + s.gen + 'px"' + (s.id === 'ad' ? ' class="mhd-sabit"' : '') + '>' + s.ad + (n ? ' <small class="mhd-eksik-say">' + n + ' eksik</small>' : '') + '</th>'; }).join('');
    let cip = function (id, ad) { return '<button class="mhd-cip' + (_mhd.grup === id ? ' aktif' : '') + '" onclick="_mhd.grup=\'' + miloJsEsc(id) + '\'; _mhd.sayfa=1; mhdCiz()">' + miloEsc(ad) + '</button>'; };
    alan.innerHTML = '<div class="mhd' + (_mhd.tam ? ' tam' : '') + '">'
        + '<div class="mhd-ust"><div><div class="mhd-baslik">📝 Hızlı Düzenle</div><div class="mhd-alt">Değiştir, sonra 💾 Kaydet (Ctrl+S) · Enter/↓ alt satır · Excel\'den bir sütunu yapıştırabilirsin</div></div>'
        + '<div class="mhd-ust-btn"><button class="mhd-btn" onclick="mhdPdfIndir()" title="Şu an listede görünen üyelerin PDF\'i">📄 PDF</button><button class="mhd-btn" onclick="_mhd.tam=!_mhd.tam; mhdCiz()">' + (_mhd.tam ? '✕ Küçült' : '⛶ Tam ekran') + '</button></div></div>'
        + '<div class="mhd-kaydet-cubuk' + (mhdDegisiklikSay() ? ' bekliyor' : '') + '" id="mhd-kaydet-cubuk">' + mhdCubukIc() + '</div>'
        + '<div class="mhd-arac"><input class="mhd-ara" type="search" id="mhd-ara" placeholder="🔍 İsim ara" value="' + miloEsc(_mhd.ara) + '" oninput="_mhd.ara=this.value; _mhd.sayfa=1; mhdCiz(); let e=document.getElementById(\'mhd-ara\'); e.focus(); e.setSelectionRange(e.value.length,e.value.length)">'
        + '<div class="mhd-cipler">' + cip('hepsi', 'Tümü') + gruplar.map(function (g) { return cip(g, g); }).join('') + '</div>'
        + '<label class="mhd-sec"><input type="checkbox"' + (_mhd.eksik ? ' checked' : '') + ' onchange="_mhd.eksik=this.checked; _mhd.sayfa=1; mhdCiz()"> Sadece eksik bilgisi olanlar</label>'
        + '<label class="mhd-sec"><input type="checkbox"' + (_mhd.pasifler ? ' checked' : '') + ' onchange="_mhd.pasifler=this.checked; _mhd.sayfa=1; mhdCiz()"> Pasifleri de göster</label>'
        + '<span class="mhd-sayi">' + tum.length + ' üye</span></div>'
        + '<datalist id="mhd-grup-liste">' + gruplar.map(function (g) { return '<option value="' + miloEsc(g) + '">'; }).join('') + '</datalist>'
        + '<div class="mhd-tablo-kap"><table class="mhd-tablo"><thead><tr>' + bas + '</tr></thead><tbody>'
        + (goster.map(function (u, i) { return '<tr class="' + (mhdDeger(u, { id: 'pasif', tip: 'onay' }) ? 'mhd-pasif' : '') + '">' + MHD_SUTUNLAR.map(function (s) { return mhdHucre(u, s, i); }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + MHD_SUTUNLAR.length + '" class="mhd-bos">Bu süzgeçte üye yok.</td></tr>')
        + '</tbody></table></div>'
        + (tum.length > goster.length ? '<button class="mhd-btn" onclick="_mhd.sayfa++; mhdCiz()">▾ ' + Math.min(MHD_SAYFA, tum.length - goster.length) + ' üye daha göster</button>' : '')
        + '<div class="mhd-durum" id="mhd-durum" aria-live="polite"></div></div>';
}
function mhdDurum(metin, hata) { let e = document.getElementById('mhd-durum'); if (e) { e.textContent = metin; e.className = 'mhd-durum' + (hata ? ' hata' : ''); } }
// Hücre değişince SADECE taslağa yazar.
function mhdDegistir(el) {
    let k = mhdCoz(el.dataset.k), s = MHD_SUTUNLAR.find(function (x) { return x.id === el.dataset.s; });
    let u = mhdUye(k.g, k.ad); if (!u || !s) return;
    if (s.id === 'ad' || s.id === 'grup') return mhdAdGrupDegistir(u, s, el);
    let v = s.tip === 'onay' ? !!el.checked : String(el.value || '').trim();
    if (s.tip === 'sayi' && v !== '') { let n = parseFloat(v.replace(',', '.')); if (isNaN(n) || n <= 0) { el.value = mhdDeger(u, s); return mhdDurum(s.ad + ' sayı olmalı.', true); } v = String(s.id === 'boy' ? Math.round(n) : Math.round(n * 10) / 10); el.value = v; }
    if (s.id === 'dogumTarihi' && v && v > new Date().toISOString().slice(0, 10)) { el.value = mhdDeger(u, s); return mhdDurum('Doğum tarihi gelecekte olamaz.', true); }
    let ham = u[s.id], eski = s.tip === 'onay' ? !!ham : (ham === undefined || ham === null ? '' : String(ham));
    let kk = u.grup + '|' + u.ad;
    if (eski === v) { if (_mhd.taslak[kk]) { delete _mhd.taslak[kk][s.id]; if (!Object.keys(_mhd.taslak[kk]).length) delete _mhd.taslak[kk]; } }
    else { _mhd.taslak[kk] = _mhd.taslak[kk] || {}; _mhd.taslak[kk][s.id] = v; }
    let td = el.closest('td');
    if (td) { td.classList.toggle('mhd-eksik', !!s.eksik && (v === '' || v === false)); td.classList.toggle('mhd-degisti', eski !== v); }
    if (s.id === 'pasif') { let tr = el.closest('tr'); if (tr) tr.classList.toggle('mhd-pasif', v); }
    mhdDurum(''); mhdCubukGuncelle();
}
function mhdVazgec() {
    let n = mhdDegisiklikSay(); if (!n) return;
    mhdSor('Değişiklikler geri alınsın mı?', n + ' kaydedilmemiş değişiklik silinecek.', [['kal', 'Hayır'], ['evet', 'Evet, geri al', 'tehlike']], function (a) { if (a === 'evet') { _mhd.taslak = {}; mhdCiz(); mhdDurum('Değişiklikler geri alındı.'); } });
}
// Kaydet: üye başına tek PATCH (4'er paralel), sonra liste sunucudan yeniden çekilir.
async function mhdTumunuKaydet(sonra) {
    let aktifEl = document.activeElement; if (aktifEl && aktifEl.closest && aktifEl.closest('.mhd-tablo') && aktifEl.tagName === 'INPUT' && aktifEl.type !== 'checkbox' && aktifEl.dataset.s !== 'ad' && aktifEl.dataset.s !== 'grup') mhdDegistir(aktifEl);
    let isler = Object.keys(_mhd.taslak).map(function (kk) {
        let i = kk.indexOf('|'), t = _mhd.taslak[kk], alanlar = {};
        Object.keys(t).forEach(function (f) {
            let s = MHD_SUTUNLAR.find(function (x) { return x.id === f; }), v = t[f];
            alanlar[f] = s.tip === 'onay' ? (v ? 1 : 0) : s.tip === 'sayi' ? (v === '' ? null : parseFloat(v)) : (v === '' ? null : v);
        });
        return { g: kk.slice(0, i), ad: kk.slice(i + 1), alanlar: alanlar };
    });
    if (!isler.length) { if (typeof sonra === 'function') sonra(); return; }
    mhdDurum('Kaydediliyor… (' + isler.length + ' üye)');
    let btn = document.querySelector('.mhd-kc-kaydet'); if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor…'; }
    let sira = 0, hatalilar = [];
    let tek = async function () {
        while (sira < isler.length) {
            let x = isler[sira++];
            try { await miloApi('/members/' + encodeURIComponent(x.g) + '/' + encodeURIComponent(x.ad), { method: 'PATCH', body: JSON.stringify(x.alanlar) }); delete _mhd.taslak[x.g + '|' + x.ad]; }
            catch (e) { hatalilar.push(x.ad); }
        }
    };
    await Promise.all([tek(), tek(), tek(), tek()]);
    try { miloUyeler = (await miloApi('/members')).members; } catch (e) {}
    if (miloAktifSekme === 'hizli') mhdCiz();
    if (hatalilar.length) { mhdDurum(hatalilar.length + ' üye kaydedilemedi (bağlantı?) — değişiklikleri tabloda duruyor, tekrar 💾 Kaydet.', true); showToast('Bazı değişiklikler kaydedilemedi', 'error'); return; }
    mhdDurum('✓ ' + isler.length + ' üye kaydedildi'); showToast('💾 Kaydedildi (' + isler.length + ' üye)', 'success');
    if (typeof sonra === 'function') sonra();
}
function mhdAdGrupDegistir(u, s, el) {
    let yeniAd = s.id === 'ad' ? String(el.value || '').trim().toLocaleUpperCase('tr-TR') : u.ad;
    let yeniGrup = s.id === 'grup' ? String(el.value || '').trim() : u.grup;
    let geri = function () { el.value = s.id === 'ad' ? u.ad : u.grup; };
    if (!yeniAd || !yeniGrup) { geri(); return mhdDurum(s.id === 'ad' ? 'İsim boş olamaz.' : 'Grup boş olamaz.', true); }
    if (yeniAd === u.ad && yeniGrup === u.grup) { geri(); return; }
    if (mhdUye(yeniGrup, yeniAd)) { geri(); return mhdDurum(yeniAd + ' zaten ' + yeniGrup + ' grubunda kayıtlı — Çift Kayıt\'tan birleştir.', true); }
    let metin = s.id === 'ad' ? u.ad + ' → ' + yeniAd + ' olarak değişecek.' : u.ad + ': ' + u.grup + ' → ' + yeniGrup + ' grubuna taşınacak.';
    mhdSor(s.id === 'ad' ? 'İsim değişsin mi?' : 'Grup değişsin mi?', metin + ' Aidat, yoklama, beceri ve ders kayıtları da taşınır.', [['kal', 'Vazgeç'], ['evet', 'Evet, değiştir', 'ana']], async function (a) {
        if (a !== 'evet') { geri(); return; }
        mhdDurum('Değiştiriliyor…');
        try {
            let r = await fetch('/api/milo/members/' + encodeURIComponent(u.grup) + '/' + encodeURIComponent(u.ad) + '/rename', { method: 'POST', headers: { 'content-type': 'application/json', 'X-Dagsk-Oturum': miloOturumToken || '' }, body: JSON.stringify({ yeniAd: yeniAd, yeniGrup: yeniGrup }) });
            if (!r.ok) { let t = ''; try { t = (await r.json()).error || ''; } catch (e) {} throw new Error(t === 'target-exists' ? 'bu isim o grupta zaten var' : t || ('HTTP ' + r.status)); }
            try { if (typeof maTurTasi === 'function') maTurTasi(u.grup, u.ad, yeniGrup, yeniAd); } catch (e) {}
            let ek = u.grup + '|' + u.ad, t = _mhd.taslak[ek]; if (t) { delete _mhd.taslak[ek]; _mhd.taslak[yeniGrup + '|' + yeniAd] = t; } // kaydedilmemiş değişiklikler yeni isimle kalsın
            miloUyeler = (await miloApi('/members')).members;
            mhdCiz(); mhdDurum('✓ ' + yeniAd + ' güncellendi');
        } catch (e) { geri(); mhdDurum('Değiştirilemedi: ' + (e && e.message ? e.message : 'bağlantı hatası') + ' — hiçbir şey değişmedi.', true); }
    });
}
function mhdTus(e) {
    if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    let el = e.target; if (el.tagName === 'SELECT' && e.key !== 'Enter') return;
    e.preventDefault();
    let r = parseInt(el.dataset.r, 10) + (e.key === 'ArrowUp' ? -1 : 1);
    let hedef = document.querySelector('.mhd-tablo [data-s="' + el.dataset.s + '"][data-r="' + r + '"]');
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') el.dispatchEvent(new Event('change'));
    if (hedef) { hedef.focus(); if (hedef.select && hedef.type !== 'date' && hedef.type !== 'checkbox') hedef.select(); }
}
function mhdYapistir(e) {
    let t = (e.clipboardData || window.clipboardData).getData('text'); if (!t || t.indexOf('\n') < 0) return;
    e.preventDefault();
    let satirlar = t.replace(/\r/g, '').split('\n').filter(function (x, i, a) { return !(i === a.length - 1 && x === ''); });
    let el = e.target, s = el.dataset.s, r0 = parseInt(el.dataset.r, 10), n = 0;
    if (s === 'ad' || s === 'grup') return mhdDurum('İsim/grup sütununa toplu yapıştırma yapılmaz — tek tek değiştir.', true);
    satirlar.forEach(function (deger, i) {
        let h = document.querySelector('.mhd-tablo [data-s="' + s + '"][data-r="' + (r0 + i) + '"]'); if (!h) return;
        deger = deger.split('\t')[0].trim();
        if (s === 'dogumTarihi') { let m = deger.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/); if (m) deger = m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); }
        h.value = deger; mhdDegistir(h); n++;
    });
    mhdDurum(n + ' satıra yapıştırıldı — kalıcı olması için 💾 Kaydet');
}
// Küçük seçenekli pencere (Milo'da onayIste yok). butonlar: [[anahtar, yazı, 'ana'|'tehlike'?], ...]
function mhdSor(baslik, metin, butonlar, cb) {
    let eski = document.getElementById('mhd-sor'); if (eski) eski.remove();
    let m = document.createElement('div'); m.id = 'mhd-sor'; m.className = 'mhd-sor';
    m.innerHTML = '<div class="mhd-sor-kutu" role="dialog" aria-modal="true" aria-labelledby="mhd-sor-b"><div class="mhd-sor-baslik" id="mhd-sor-b">' + miloEsc(baslik) + '</div><div class="mhd-sor-metin">' + miloEsc(metin) + '</div>'
        + '<div class="mhd-sor-btnler">' + butonlar.map(function (b) { return '<button class="mhd-btn' + (b[2] ? ' ' + b[2] : '') + '" data-x="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</div></div>';
    let bitir = function (a) { m.remove(); cb(a); };
    m.addEventListener('click', function (e) { let b = e.target.closest('[data-x]'); if (b) bitir(b.dataset.x); else if (e.target === m) bitir('kal'); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); bitir('kal'); } });
    document.body.appendChild(m);
    let son = m.querySelectorAll('[data-x]'); son[son.length - 1].focus();
}
function mhdCikisSor(devam) {
    mhdSor('Kaydedilmemiş değişiklik var', mhdDegisiklikSay() + ' değişiklik henüz kaydedilmedi. Kaydetmeden çıkarsan kaybolur.',
        [['kal', 'Geri dön'], ['at', 'Kaydetmeden çık', 'tehlike'], ['kaydet', '💾 Kaydet ve çık', 'ana']],
        function (a) { if (a === 'kaydet') mhdTumunuKaydet(devam); else if (a === 'at') { _mhd.taslak = {}; devam(); } });
}
// 📄 PDF — ekrandaki süzgeçle listelenen TÜM üyeler, yatay A4, native jsPDF; "Tümü"de grup grup bölümlü.
function mhdPdfIndir() {
    let satirlar = mhdSatirlar();
    if (!satirlar.length) return mhdDurum('PDF için listede üye yok.', true);
    showToast('PDF hazırlanıyor...', 'success');
    let T = _miloTrTranslit;
    let d = function (u, id) { let s = MHD_SUTUNLAR.find(function (x) { return x.id === id; }) || { id: id }; let v = mhdDeger(u, s); return v === undefined || v === null || v === false ? '' : String(v).trim(); };
    let tarihTR = function (iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; };
    let tel = function (t) { let s = String(t || '').replace(/\D/g, ''); if (s.length === 10 && s[0] === '5') s = '0' + s; return s.length === 11 ? s.slice(0, 4) + ' ' + s.slice(4, 7) + ' ' + s.slice(7, 9) + ' ' + s.slice(9) : String(t || ''); };
    let S = [
        { b: '#', w: 9 }, { b: 'AD SOYAD', w: 50 }, { b: 'DOĞUM / YAŞ', w: 27 }, { b: 'CİNS.', w: 12 }, { b: 'BOY / KİLO', w: 27 },
        { b: 'VELİ ADI', w: 36 }, { b: 'TELEFON', w: 28 }, { b: 'VELİ İŞ / MESLEK', w: 38 }, { b: 'SAĞLIK / NOT', w: 42 }
    ];
    _miloYeniPdfAl('landscape').then(function (pdf) {
        let W = 297, H = 210, mx = 14, uw = W - mx * 2, y;
        let yeniSayfa = function () { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 14; };
        let sigdir = function (metin, w, boy) { pdf.setFontSize(boy); let s = T(metin); if (pdf.getTextWidth(s) <= w - 2.5) return s; while (s.length > 1 && pdf.getTextWidth(s + '...') > w - 2.5) s = s.slice(0, -1); return s + '...'; };
        let filtre = [_mhd.grup === 'hepsi' ? 'Tüm gruplar' : _mhd.grup];
        if (_mhd.ara.trim()) filtre.push('Arama: "' + _mhd.ara.trim() + '"'); if (_mhd.eksik) filtre.push('Sadece eksik bilgisi olanlar'); if (_mhd.pasifler) filtre.push('Pasifler dahil');
        y = _miloKurumsalBaslikCiz(pdf, mx, uw, 12, 'ÜYE LİSTESİ', 'Üye Bilgileri  |  ' + filtre.join('  |  '));
        let kiz = satirlar.filter(function (u) { return d(u, 'cinsiyet') === 'K'; }).length, erk = satirlar.filter(function (u) { return d(u, 'cinsiyet') === 'E'; }).length;
        let telYok = satirlar.filter(function (u) { return !d(u, 'acilTelefon'); }).length, dogYok = satirlar.filter(function (u) { return !d(u, 'dogumTarihi'); }).length;
        let ox = mx;
        [[String(satirlar.length), 'üye'], [String(kiz), 'kız'], [String(erk), 'erkek'], [String(telYok), 'veli telefonu eksik'], [String(dogYok), 'doğum tarihi eksik']].forEach(function (o, i) {
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); let w1 = pdf.getTextWidth(o[0]);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); let w2 = pdf.getTextWidth(T(o[1]));
            let kw = w1 + w2 + 9, uyari = i >= 3 && o[0] !== '0';
            pdf.setFillColor(uyari ? 255 : 236, uyari ? 247 : 248, uyari ? 237 : 246); pdf.setDrawColor(uyari ? 255 : 200, uyari ? 197 : 232, uyari ? 66 : 228); pdf.setLineWidth(0.25);
            pdf.roundedRect(ox, y, kw, 8, 2, 2, 'FD');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(uyari ? 180 : 20, uyari ? 83 : 110, uyari ? 9 : 100); pdf.text(o[0], ox + 3.5, y + 5.7);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139); pdf.text(T(o[1]), ox + 3.5 + w1 + 2, y + 5.5);
            ox += kw + 3;
        });
        y += 13;
        let basliklar = function () {
            pdf.setFillColor(20, 110, 100); pdf.rect(mx, y, uw, 7.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(230, 250, 246);
            let x = mx; S.forEach(function (s) { pdf.text(T(s.b), x + 2, y + 5); x += s.w; });
            y += 7.5;
        };
        let bolum = function (g, n) {
            pdf.setFillColor(255, 197, 66); pdf.rect(mx, y + 1, 1.6, 6, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(20, 40, 38); pdf.text(T(g), mx + 4, y + 5.6);
            let gw = pdf.getTextWidth(T(g));
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139); pdf.text(n + ' üye', mx + 6 + gw, y + 5.6);
            y += 9;
        };
        let gruplar = _mhd.grup === 'hepsi' ? mhdGruplar().filter(function (g) { return satirlar.some(function (u) { return u.grup === g; }); }) : [null];
        let sira = 0;
        gruplar.forEach(function (g) {
            let liste = g ? satirlar.filter(function (u) { return u.grup === g; }) : satirlar;
            if (y + 26 > H - 16) yeniSayfa();
            if (g) bolum(g, liste.length);
            basliklar();
            liste.forEach(function (u, i) {
                let v2k = d(u, 'veli2Kisi'), v2t = d(u, 'veli2Telefon'), saglik = d(u, 'saglikNotu'), not = d(u, 'genelNot');
                let rh = (v2k || v2t || (saglik && not)) ? 11.5 : 7;
                if (y + rh > H - 16) { yeniSayfa(); if (g) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(20, 130, 120); pdf.text(T(g + ' (devamı)'), mx, y + 4); y += 6; } basliklar(); }
                sira++;
                let pasif = !!mhdDeger(u, { id: 'pasif', tip: 'onay' }), muaf = !!mhdDeger(u, { id: 'aidatMuaf', tip: 'onay' });
                if (i % 2 === 1) { pdf.setFillColor(247, 250, 249); pdf.rect(mx, y, uw, rh, 'F'); }
                pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.15); pdf.line(mx, y + rh, mx + uw, y + rh);
                let hx = mx, hucre = function (s, metin, opt) {
                    opt = opt || {};
                    if (!metin) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(opt.eksik ? 217 : 203, opt.eksik ? 119 : 213, opt.eksik ? 6 : 225); pdf.text(opt.eksik ? 'eksik' : '-', hx + 2, y + 4.8); }
                    else { pdf.setFont('helvetica', opt.kalin ? 'bold' : 'normal'); let boy = opt.boy || 8.5; pdf.setTextColor(opt.renk ? opt.renk[0] : 30, opt.renk ? opt.renk[1] : 41, opt.renk ? opt.renk[2] : 59); pdf.text(sigdir(metin, s.w - (opt.sagBosluk || 0), boy), hx + 2, y + 4.8); }
                    hx += s.w;
                };
                let alt = function (sutun, metin, renk) { let x = mx + S.slice(0, sutun).reduce(function (a, c) { return a + c.w; }, 0); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(renk[0], renk[1], renk[2]); pdf.text(sigdir(metin, S[sutun].w, 7.5), x + 2, y + 9.3); };
                hucre(S[0], String(sira), { boy: 7.5, renk: [148, 163, 184] });
                let rozetler = []; if (pasif) rozetler.push('PASİF'); if (muaf) rozetler.push('MUAF');
                pdf.setFontSize(6); let rozW = rozetler.reduce(function (a, r) { return a + pdf.getTextWidth(r) + 4.5; }, 0);
                let adX = hx; hucre(S[1], u.ad, { kalin: true, boy: 8.5, renk: pasif ? [148, 163, 184] : [20, 40, 38], sagBosluk: rozW });
                if (rozetler.length) {
                    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); let rx = adX + 2 + Math.min(pdf.getTextWidth(sigdir(u.ad, S[1].w - rozW, 8.5)), S[1].w - rozW) + 1.5;
                    pdf.setFontSize(6);
                    rozetler.forEach(function (r) { let rw = pdf.getTextWidth(r) + 3; pdf.setFillColor(r === 'PASİF' ? 226 : 220, r === 'PASİF' ? 232 : 252, r === 'PASİF' ? 240 : 231); pdf.roundedRect(rx, y + 1.9, rw, 3.6, 1, 1, 'F'); pdf.setTextColor(r === 'PASİF' ? 100 : 22, r === 'PASİF' ? 116 : 101, r === 'PASİF' ? 139 : 52); pdf.text(r, rx + 1.5, y + 4.6); rx += rw + 1.5; });
                }
                let dt = tarihTR(d(u, 'dogumTarihi')), ys = typeof miloYasHesapla === 'function' ? miloYasHesapla(d(u, 'dogumTarihi')) : null;
                hucre(S[2], dt ? dt + (ys !== null ? '  (' + ys + ')' : '') : '', { eksik: true, boy: 8 });
                hucre(S[3], d(u, 'cinsiyet') === 'K' ? 'Kız' : d(u, 'cinsiyet') === 'E' ? 'Erkek' : '', { eksik: true, boy: 8 });
                let boy = d(u, 'boy'), kilo = d(u, 'kilo');
                hucre(S[4], boy || kilo ? (boy ? boy + ' cm' : '-') + ' / ' + (kilo ? kilo + ' kg' : '-') : '', { boy: 7.5 });
                hucre(S[5], d(u, 'acilKisi'), { eksik: true });
                hucre(S[6], tel(d(u, 'acilTelefon')), { eksik: true });
                hucre(S[7], d(u, 'aileMeslek'), { boy: 8 });
                // Sağlık notu (varsa kırmızımsı, önce) + not
                if (saglik) hucre(S[8], '+ ' + saglik, { boy: 7.5, renk: [190, 50, 40] }); else hucre(S[8], not, { boy: 7.5, renk: [71, 85, 105] });
                if (v2k) alt(5, v2k, [71, 85, 105]);
                if (v2t) alt(6, tel(v2t), [71, 85, 105]);
                if (saglik && not) alt(8, not, [71, 85, 105]);
                y += rh;
            });
            y += 5;
        });
        _miloKurumsalAltBilgiCiz(pdf, W, H);
        let bugun = new Date(), tarih = bugun.getFullYear() + String(bugun.getMonth() + 1).padStart(2, '0') + String(bugun.getDate()).padStart(2, '0');
        pdf.save('Milo_Uye_Listesi_' + T(_mhd.grup === 'hepsi' ? 'Tum' : _mhd.grup).replace(/[^A-Za-z0-9]+/g, '_') + '_' + tarih + '.pdf');
        showToast('PDF indirildi! 📄', 'success');
        if (mhdDegisiklikSay()) mhdDurum('Not: PDF kaydedilmemiş değişiklikleri de içeriyor — kalıcı olması için 💾 Kaydet.');
    }).catch(function (e) { showToast('PDF oluşturulamadı.', 'error'); console.error(e); });
}
function mhdAcikMi() { return miloAktifSekme === 'hizli' && !!document.querySelector('#milo-icerik .mhd'); }
// Çıkış korumaları: sekme değiştirme, çıkış yapma, sayfa kapatma/yenileme.
(function () {
    let eskiSekme = miloSekme, eskiCikis = miloCikisYap;
    miloSekme = function (k) {
        let args = arguments, self = this;
        if (k !== 'hizli' && mhdAcikMi() && mhdDegisiklikSay()) return mhdCikisSor(function () { eskiSekme.apply(self, args); });
        return eskiSekme.apply(this, arguments);
    };
    miloCikisYap = function () {
        let args = arguments, self = this;
        if (mhdAcikMi() && mhdDegisiklikSay()) return mhdCikisSor(function () { eskiCikis.apply(self, args); });
        return eskiCikis.apply(this, arguments);
    };
    window.addEventListener('beforeunload', function (e) { if (mhdDegisiklikSay()) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && mhdAcikMi()) { e.preventDefault(); mhdTumunuKaydet(); }
        if (e.key === 'Escape' && _mhd.tam && mhdAcikMi() && !document.getElementById('mhd-sor')) { _mhd.tam = false; mhdCiz(); }
    });
    let st = document.createElement('style');
    st.textContent = '.mhd{display:flex;flex-direction:column;gap:10px;color:var(--milo-ink)}'
        + '.mhd.tam{position:fixed;inset:0;z-index:9000;background:var(--milo-bg);padding:14px 16px;overflow:auto}.mhd.tam .mhd-tablo-kap{max-height:calc(100vh - 250px)}'
        + '.mhd input[type=checkbox]{-webkit-appearance:checkbox!important;appearance:auto!important;accent-color:var(--milo-teal)}'
        + '.mhd-ust{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.mhd-ust-btn{display:flex;gap:6px;flex-wrap:wrap}.mhd-baslik{font-weight:800;font-size:16px}.mhd-alt{font-size:11.5px;color:var(--milo-ink-dim);margin-top:2px}'
        + '.mhd-kaydet-cubuk{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--milo-line);border-radius:14px;background:var(--milo-card)}'
        + '.mhd-kaydet-cubuk.bekliyor{border-color:var(--milo-coral);box-shadow:0 0 0 1px var(--milo-coral),0 6px 18px rgba(236,72,153,.22)}'
        + '.mhd-kc-yazi{flex:1;min-width:160px;font-size:12.5px;color:var(--milo-ink-dim)}.mhd-kaydet-cubuk.bekliyor .mhd-kc-yazi{color:var(--milo-coral)}'
        + '.mhd-kc-kaydet{min-width:120px;font-size:14px}.mhd-kc-kaydet:disabled{opacity:.4;cursor:default}'
        + '.mhd-arac{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
        + '.mhd-ara{flex:1;min-width:180px;background:var(--milo-card-raised);border:1px solid var(--milo-line);border-radius:12px;padding:9px 12px;color:var(--milo-ink);font:inherit}'
        + '.mhd-cipler{display:flex;gap:4px;flex-wrap:wrap}.mhd-cip{border:1px solid var(--milo-line);background:transparent;color:var(--milo-ink-dim);border-radius:999px;padding:6px 11px;font-weight:700;font-size:12px;cursor:pointer;min-height:34px;font-family:inherit}.mhd-cip.aktif{border-color:var(--milo-teal);color:#fff;background:var(--milo-teal)}'
        + '.mhd-sec{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--milo-ink-dim);cursor:pointer}.mhd-sayi{font-size:12px;color:var(--milo-ink-dim);margin-left:auto;font-variant-numeric:tabular-nums}'
        + '.mhd-btn{border:1px solid var(--milo-line);background:transparent;color:var(--milo-ink);border-radius:12px;padding:0 14px;min-height:40px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}.mhd-btn.ana{background:var(--milo-coral);border-color:var(--milo-coral);color:#fff}.mhd-btn.tehlike{color:var(--milo-coral);border-color:rgba(236,72,153,.5)}'
        + '.mhd-tablo-kap{overflow:auto;max-height:66vh;border:1px solid var(--milo-line);border-radius:14px}'
        + '.mhd-tablo{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:12.5px}'
        + '.mhd-tablo th{position:sticky;top:0;z-index:2;background:var(--milo-card-raised);text-align:left;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--milo-ink-dim);padding:8px;border-bottom:1px solid var(--milo-line);white-space:nowrap}'
        + '.mhd-eksik-say{display:block;text-transform:none;letter-spacing:0;color:var(--milo-sun);font-weight:600}'
        + '.mhd-td{padding:2px;border-bottom:1px solid var(--milo-line);background:var(--milo-card)}'
        + '.mhd-sabit{position:sticky;left:0;z-index:1;background:var(--milo-card)}.mhd-tablo th.mhd-sabit{z-index:3;background:var(--milo-card-raised)}'
        + '.mhd-td input:not([type=checkbox]),.mhd-td select{width:100%;box-sizing:border-box;background:transparent;border:1px solid transparent;border-radius:8px;padding:7px 8px;color:var(--milo-ink);font:inherit;min-height:36px;margin:0}'
        + '.mhd-td select option{background:var(--milo-card-raised);color:var(--milo-ink)}'
        + '.mhd-td input:not([type=checkbox]):hover,.mhd-td select:hover{border-color:var(--milo-line)}'
        + '.mhd-td input:focus,.mhd-td select:focus{outline:none;border-color:var(--milo-teal);background:var(--milo-card-raised)}'
        + '.mhd-td.mhd-eksik input,.mhd-td.mhd-eksik select{background:rgba(255,197,66,.08)}'
        + '.mhd-td.mhd-degisti input:not([type=checkbox]),.mhd-td.mhd-degisti select{border-color:var(--milo-coral);background:rgba(236,72,153,.12)}.mhd-td.mhd-degisti.mhd-orta{box-shadow:inset 0 0 0 2px var(--milo-coral)}'
        + '.mhd-orta{text-align:center}.mhd-orta input{width:18px;height:18px;cursor:pointer}'
        + '.mhd-pasif td{opacity:.55}.mhd-bos{padding:20px;text-align:center;color:var(--milo-ink-dim)}'
        + '.mhd-durum{min-height:18px;font-size:12px;color:var(--milo-teal)}.mhd-durum.hata{color:var(--milo-coral)}'
        + '.mhd-sor{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6)}'
        + '.mhd-sor-kutu{width:min(440px,100%);background:var(--milo-card);color:var(--milo-ink);border:1px solid var(--milo-line);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 50px rgba(0,0,0,.5);font-family:\'Poppins\',sans-serif}'
        + '.mhd-sor-baslik{font-weight:800;font-size:16px}.mhd-sor-metin{font-size:13px;color:var(--milo-ink-dim)}.mhd-sor-btnler{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:4px}';
    document.head.appendChild(st);
})();
