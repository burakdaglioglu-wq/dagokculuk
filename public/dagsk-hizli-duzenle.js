/* ================================================================================================
   📝 HIZLI DÜZENLE (2026-09-30, kullanıcı: "sporcuların bilgilerini düzenleyebileceğim, hızlı girebileceğim bir
   sistem olmalı"). Bilgiler üç ayrı yerdeydi (sporcu kartı: isim/doğum/cinsiyet · Aidat: veli/telefon ·
   Belgeler: sağlık/lisans). Burada tek tablo: satır = sporcu, sütun = bilgi; hücreye yaz → çıkınca kaydedilir.
   - Enter / ↓ bir alt satıra, ↑ bir üst satıra (aynı sütun); Tab normal.
   - Excel/Sheets'ten çok satırlı yapıştırma: imlecin olduğu hücreden aşağı doğru doldurur (ör. telefon sütunu).
   - "Eksik bilgisi olanlar" süzgeci + her sütunun başlığında eksik sayısı.
   - İsim/grup değişikliği veri kaybı olmayan yoldan (_sporcuYenidenAdlandir — seriler/aidat/yoklama taşınır).
   - Diğer alanlar: yerelde anında, sunucuya sporcu başına 0,8 sn sonra tek PATCH (girişli; LWW lastModified).
   Kişisel bilgiler (telefon, doğum tarihi, belgeler) zaten sadece giriş yapılmış cihazda var (KVKK).
   ================================================================================================ */
const HD_GRUPLAR = [['buyukler', 'Büyükler'], ['yildizlar', 'Yıldızlar'], ['kucukler', 'Küçükler'], ['minikler', 'Minikler']];
const HD_SUTUNLAR = [
    { id: 'ad', ad: 'Ad Soyad', tip: 'metin', gen: 190, zorunlu: true },
    { id: 'grup', ad: 'Grup', tip: 'grup', gen: 104 },
    { id: 'dogumTarihi', ad: 'Doğum tarihi', tip: 'tarih', gen: 138, eksik: true },
    { id: 'cinsiyet', ad: 'Cins.', tip: 'secim', secenek: [['', '—'], ['K', 'Kız'], ['E', 'Erkek']], gen: 76, eksik: true },
    { id: 'yay', ad: 'Yay', tip: 'secim', secenek: [['', '—'], ['Klasik', 'Klasik'], ['Makaralı', 'Makaralı']], gen: 100 },
    { id: 'acilKisi', ad: 'Veli adı', tip: 'metin', gen: 150, eksik: true },
    { id: 'acilTelefon', ad: 'Veli telefonu', tip: 'tel', gen: 140, eksik: true },
    // İkinci veli (isteğe bağlı — "bazen ailede iki kişinin numarasını giriyorum"), eksik sayılmaz.
    { id: 'veli2Kisi', ad: '2. veli adı', tip: 'metin', gen: 150 },
    { id: 'veli2Telefon', ad: '2. veli telefonu', tip: 'tel', gen: 140 },
    // Aidat detayındaki "Aile iş/meslek" ile AYNI alan (aileMeslek) — sunucuda kişisel bilgi (KVKK) olarak korunuyor.
    { id: 'aileMeslek', ad: 'Veli iş / meslek', tip: 'metin', gen: 200, yer: 'ör. Avukat · Yıldız Hukuk' },
    // Sağlık raporu / Lisans sütunları kullanıcı isteğiyle çıkarıldı (2026-09-30) — veriler duruyor, Belgeler ekranında.
    { id: 'aidatMuaf', ad: 'Aidat muaf', tip: 'onay', gen: 70 },
    { id: 'pasif', ad: 'Pasif', tip: 'onay', gen: 60 },
    { id: 'genelNot', ad: 'Not', tip: 'metin', gen: 200 }
];
const HD_SAYFA = 60;
// taslak: { 'grup|ad': { alan: değer } } — kullanıcı "💾 Kaydet"e basana kadar hiçbir şey kaydedilmez
// (2026-09-30, kullanıcı: "otomatik kaydet yaptığı için kasıyor, üste bir yere Kaydet, kaydetmeden çıkarsam uyar").
let _hd = { grup: 'hepsi', ara: '', eksik: false, pasifler: false, sayfa: 1, taslak: {}, yeniAcik: false, tam: window.innerWidth >= 900 };

function hdKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function hdCoz(k) { let s = decodeURIComponent(k), i = s.indexOf('|'); return { g: s.slice(0, i), ad: s.slice(i + 1) }; }
function hdKatla(s) { return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
function hdDeger(x, s) {
    if (s.id === 'ad') return x.ad; if (s.id === 'grup') return x.g;
    let t = _hd.taslak[x.g + '|' + x.ad]; if (t && Object.prototype.hasOwnProperty.call(t, s.id)) return t[s.id];
    let v = x.sp[s.id]; return v === undefined || v === null ? '' : v;
}
function hdTaslakMi(x, s) { let t = _hd.taslak[x.g + '|' + x.ad]; return !!(t && Object.prototype.hasOwnProperty.call(t, s.id)); }
function hdDegisiklikSay() { let n = 0; Object.keys(_hd.taslak).forEach(function (k) { n += Object.keys(_hd.taslak[k]).length; }); return n; }
function hdEksikMi(x, s) { if (!s.eksik) return false; let v = hdDeger(x, s); return v === '' || v === false; }
function hdSatirlar() {
    let q = hdKatla(_hd.ara.trim()), r = [];
    HD_GRUPLAR.forEach(function (gr) {
        if (_hd.grup !== 'hepsi' && _hd.grup !== gr[0]) return;
        Object.keys(turnuvaDB[gr[0]] || {}).forEach(function (ad) {
            let sp = turnuvaDB[gr[0]][ad]; if (!sp || typeof sp !== 'object') return;
            if (sp.pasif && !_hd.pasifler) return;
            if (q && hdKatla(ad).indexOf(q) < 0) return;
            let x = { g: gr[0], ad: ad, sp: sp };
            if (_hd.eksik && !HD_SUTUNLAR.some(function (s) { return hdEksikMi(x, s); })) return;
            r.push(x);
        });
    });
    return r.sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
}
function hdHucre(x, s, satir) {
    let v = hdDeger(x, s), k = hdKey(x.g, x.ad), ort = 'data-k="' + k + '" data-s="' + s.id + '" data-r="' + satir + '" onkeydown="hdTus(event)"';
    let eksik = (hdEksikMi(x, s) ? ' hd-eksik' : '') + (hdTaslakMi(x, s) ? ' hd-degisti' : '');
    if (s.tip === 'onay') return '<td class="hd-td hd-orta' + eksik + '"><input type="checkbox" ' + ort + (v ? ' checked' : '') + ' onchange="hdKaydet(this)" aria-label="' + s.ad + '"></td>';
    if (s.tip === 'secim' || s.tip === 'grup') {
        let sec = s.tip === 'grup' ? HD_GRUPLAR : s.secenek;
        return '<td class="hd-td' + eksik + '"><select ' + ort + ' onchange="hdKaydet(this)" aria-label="' + s.ad + '">' + sec.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>';
    }
    let tur = s.tip === 'tarih' ? 'date' : s.tip === 'tel' ? 'tel' : 'text';
    return '<td class="hd-td' + eksik + (s.id === 'ad' ? ' hd-sabit' : '') + '"><input type="' + tur + '" ' + ort + ' value="' + esc(String(v)) + '" onchange="hdKaydet(this)" onpaste="hdYapistir(event)" aria-label="' + s.ad + '"' + (s.tip === 'tel' ? ' inputmode="tel" placeholder="05xx…"' : s.yer ? ' placeholder="' + esc(s.yer) + '"' : '') + '></td>';
}
function hdCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let tum = hdSatirlar(), goster = tum.slice(0, _hd.sayfa * HD_SAYFA);
    let tumAktif = []; HD_GRUPLAR.forEach(function (gr) { Object.keys(turnuvaDB[gr[0]] || {}).forEach(function (ad) { let sp = turnuvaDB[gr[0]][ad]; if (sp && !sp.pasif) tumAktif.push({ g: gr[0], ad: ad, sp: sp }); }); });
    let eksikSay = function (s) { return tumAktif.filter(function (x) { return hdEksikMi(x, s); }).length; };
    let cip = function (id, ad) { return '<button class="hd-cip' + (_hd.grup === id ? ' aktif' : '') + '" onclick="_hd.grup=\'' + id + '\'; _hd.sayfa=1; hdCiz()">' + ad + '</button>'; };
    let bas = HD_SUTUNLAR.map(function (s) { let n = s.eksik ? eksikSay(s) : 0; return '<th style="min-width:' + s.gen + 'px"' + (s.id === 'ad' ? ' class="hd-sabit"' : '') + '>' + s.ad + (n ? ' <small class="hd-eksik-say">' + n + ' eksik</small>' : '') + '</th>'; }).join('');
    alan.innerHTML = '<div class="hd' + (_hd.tam ? ' tam' : '') + '">'
        + '<div class="hd-ust"><div><div class="hd-baslik">📝 Hızlı Düzenle</div><div class="hd-alt">Değiştir, sonra 💾 Kaydet (Ctrl+S) · Enter/↓ alt satır · Excel\'den bir sütunu yapıştırabilirsin</div></div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="hd-btn ana" onclick="_hd.yeniAcik=!_hd.yeniAcik; hdCiz()">➕ Yeni sporcu</button><button class="hd-btn" onclick="hdPdfIndir()" title="Şu an listede görünen sporcuların PDF\'i">📄 PDF</button><button class="hd-btn" onclick="_hd.tam=!_hd.tam; hdCiz()">' + (_hd.tam ? '✕ Küçült' : '⛶ Tam ekran') + '</button></div></div>'
        + '<div class="hd-kaydet-cubuk" id="hd-kaydet-cubuk">' + hdCubukIc() + '</div>'
        + (_hd.yeniAcik ? '<div class="hd-yeni"><input id="hd-yeni-ad" placeholder="Ad Soyad" autocomplete="off"><select id="hd-yeni-grup">' + HD_GRUPLAR.map(function (g) { return '<option value="' + g[0] + '"' + ((_hd.grup === g[0] || (_hd.grup === 'hepsi' && g[0] === (typeof aktifGrup !== 'undefined' ? aktifGrup : 'buyukler'))) ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select><input id="hd-yeni-dogum" type="date" aria-label="Doğum tarihi"><select id="hd-yeni-cins"><option value="K">Kız</option><option value="E">Erkek</option></select><input id="hd-yeni-tel" type="tel" inputmode="tel" placeholder="Veli telefonu"><button class="hd-btn ana" onclick="hdYeniEkle()">Ekle</button></div>' : '')
        + '<div class="hd-arac"><input class="hd-ara" type="search" id="hd-ara" placeholder="🔍 İsim ara" value="' + esc(_hd.ara) + '" oninput="_hd.ara=this.value; _hd.sayfa=1; hdCiz(); let e=document.getElementById(\'hd-ara\'); e.focus(); e.setSelectionRange(e.value.length,e.value.length)">'
        + '<div class="hd-cipler">' + cip('hepsi', 'Tümü') + HD_GRUPLAR.map(function (g) { return cip(g[0], g[1]); }).join('') + '</div>'
        + '<label class="hd-sec"><input type="checkbox"' + (_hd.eksik ? ' checked' : '') + ' onchange="_hd.eksik=this.checked; _hd.sayfa=1; hdCiz()"> Sadece eksik bilgisi olanlar</label>'
        + '<label class="hd-sec"><input type="checkbox"' + (_hd.pasifler ? ' checked' : '') + ' onchange="_hd.pasifler=this.checked; _hd.sayfa=1; hdCiz()"> Pasifleri de göster</label>'
        + '<span class="hd-sayi">' + tum.length + ' sporcu</span></div>'
        + '<div class="hd-tablo-kap"><table class="hd-tablo"><thead><tr>' + bas + '</tr></thead><tbody>'
        + (goster.map(function (x, i) { return '<tr class="' + (hdDeger(x, { id: 'pasif' }) ? 'hd-pasif' : '') + '">' + HD_SUTUNLAR.map(function (s) { return hdHucre(x, s, i); }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + HD_SUTUNLAR.length + '" class="hd-bos">Bu süzgeçte sporcu yok.</td></tr>')
        + '</tbody></table></div>'
        + (tum.length > goster.length ? '<button class="hd-btn" onclick="_hd.sayfa++; hdCiz()">▾ ' + Math.min(HD_SAYFA, tum.length - goster.length) + ' sporcu daha göster</button>' : '')
        + '<div class="hd-durum" id="hd-durum" aria-live="polite"></div></div>';
}
function hdDurum(metin, hata) { let e = document.getElementById('hd-durum'); if (e) { e.textContent = metin; e.className = 'hd-durum' + (hata ? ' hata' : ''); } }
function hdCubukIc() {
    let n = hdDegisiklikSay();
    return n
        ? '<span class="hd-kc-yazi"><b>● ' + n + ' kaydedilmemiş değişiklik</b></span><button class="hd-btn" onclick="hdVazgec()">↺ Vazgeç</button><button class="hd-btn ana hd-kc-kaydet" onclick="hdTumunuKaydet()">💾 Kaydet</button>'
        : '<span class="hd-kc-yazi">Kaydedilmemiş değişiklik yok</span><button class="hd-btn ana hd-kc-kaydet" disabled>💾 Kaydet</button>';
}
function hdCubukGuncelle() { let c = document.getElementById('hd-kaydet-cubuk'); if (c) { c.innerHTML = hdCubukIc(); c.classList.toggle('bekliyor', hdDegisiklikSay() > 0); } }
// Hücre değişince SADECE taslağa yazar — veri, depo, sunucu "💾 Kaydet"e kadar hiç dokunulmaz.
function hdKaydet(el) {
    let k = hdCoz(el.dataset.k), s = HD_SUTUNLAR.find(function (x) { return x.id === el.dataset.s; });
    let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; if (!sp || !s) return;
    if (s.id === 'ad' || s.id === 'grup') return hdAdGrupDegistir(k, s, el);
    let v = s.tip === 'onay' ? !!el.checked : String(el.value || '').trim();
    if (s.tip === 'tarih' && v && s.id === 'dogumTarihi' && v > bugunISO()) { el.value = hdDeger({ g: k.g, ad: k.ad, sp: sp }, s); return hdDurum('Doğum tarihi gelecekte olamaz.', true); }
    let eski = sp[s.id] === undefined || sp[s.id] === null ? (s.tip === 'onay' ? false : '') : sp[s.id];
    let kk = k.g + '|' + k.ad;
    if (eski === v) { if (_hd.taslak[kk]) { delete _hd.taslak[kk][s.id]; if (!Object.keys(_hd.taslak[kk]).length) delete _hd.taslak[kk]; } }
    else { _hd.taslak[kk] = _hd.taslak[kk] || {}; _hd.taslak[kk][s.id] = v; }
    let td = el.closest('td');
    if (td) { td.classList.toggle('hd-eksik', !!s.eksik && (v === '' || v === false)); td.classList.toggle('hd-degisti', eski !== v); }
    if (s.id === 'pasif') { let tr = el.closest('tr'); if (tr) tr.classList.toggle('hd-pasif', v); }
    hdDurum(''); hdCubukGuncelle();
}
function hdVazgec() {
    let n = hdDegisiklikSay(); if (!n) return;
    onayIste(n + ' kaydedilmemiş değişiklik silinsin mi?', function () { _hd.taslak = {}; hdCiz(); hdDurum('Değişiklikler geri alındı.'); }, 'Evet, geri al');
}
// Tek seferde uygular: veriye yaz, depoya BİR kez kaydet, sunucuya sporcu başına tek PATCH (4'er paralel).
function hdTumunuKaydet(sonra) {
    let aktif = document.activeElement; if (aktif && aktif.closest && aktif.closest('.hd-tablo') && aktif.tagName === 'INPUT' && aktif.type !== 'checkbox') hdKaydet(aktif); // odaktaki hücre de dahil
    let anahtarlar = Object.keys(_hd.taslak);
    if (!anahtarlar.length) { if (typeof sonra === 'function') sonra(); return; }
    let isler = [], simdi = Date.now();
    anahtarlar.forEach(function (kk) {
        let i = kk.indexOf('|'), g = kk.slice(0, i), ad = kk.slice(i + 1), sp = turnuvaDB[g] && turnuvaDB[g][ad], t = _hd.taslak[kk];
        if (!sp) return;
        let alanlar = {};
        Object.keys(t).forEach(function (f) {
            let s = HD_SUTUNLAR.find(function (x) { return x.id === f; }), v = t[f];
            sp[f] = v; alanlar[f] = s && s.tip === 'onay' ? (v ? 1 : 0) : v; // boşaltma '' (null DEĞİL — sunucu kişisel alanda null'u yok sayar)
            if (f === 'dogumTarihi' && v) { sp.dogumYili = parseInt(v.slice(0, 4), 10); alanlar.dogumYili = sp.dogumYili; }
        });
        sp.lastModified = simdi;
        isler.push({ g: g, ad: ad, alanlar: alanlar });
    });
    _hd.taslak = {};
    try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
    try { bekleyenGonderim = true; } catch (e) {}
    hdCiz(); hdDurum('Kaydediliyor… (' + isler.length + ' sporcu)');
    let sira = 0, hata = 0;
    let tek = function () {
        if (sira >= isler.length) return Promise.resolve();
        let x = isler[sira++];
        return fetch('/api/athletes/' + encodeURIComponent(x.g) + '/' + encodeURIComponent(x.ad), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: x.alanlar, lastModified: simdi, deviceId: (typeof _cihazId !== 'undefined' ? _cihazId : null) }) })
            .then(function (r) { if (!r.ok && r.status !== 409) hata++; }, function () { hata++; }).then(tek);
    };
    Promise.all([tek(), tek(), tek(), tek()]).then(function () {
        if (hata) { hdDurum(hata + ' sporcu sunucuya gönderilemedi — cihazda kayıtlı, bağlantı gelince senkronla gidecek.', true); try { showToast('Cihazda kaydedildi, bağlantı gelince gönderilecek', 'warning'); } catch (e) {} }
        else { hdDurum('✓ ' + isler.length + ' sporcu kaydedildi'); try { showToast('💾 Kaydedildi (' + isler.length + ' sporcu)', 'success'); } catch (e) {} }
    });
    try { sporcuListesiniYenile(); } catch (e) {}
    if (typeof sonra === 'function') sonra();
}
// Kaydedilmemiş değişiklikle çıkışta: Geri dön / Kaydetmeden çık / Kaydet ve çık.
function hdCikisSor(devam) {
    let eski = document.getElementById('hd-cikis'); if (eski) eski.remove();
    let m = document.createElement('div'); m.id = 'hd-cikis'; m.className = 'hd-cikis';
    m.innerHTML = '<div class="hd-cikis-kutu" role="dialog" aria-modal="true" aria-labelledby="hd-cikis-b"><div class="hd-cikis-baslik" id="hd-cikis-b">Kaydedilmemiş değişiklik var</div>'
        + '<div class="hd-cikis-metin">' + hdDegisiklikSay() + ' değişiklik henüz kaydedilmedi. Kaydetmeden çıkarsan kaybolur.</div>'
        + '<div class="hd-cikis-btnler"><button class="hd-btn" data-x="kal">Geri dön</button><button class="hd-btn hd-tehlike" data-x="at">Kaydetmeden çık</button><button class="hd-btn ana" data-x="kaydet">💾 Kaydet ve çık</button></div></div>';
    m.addEventListener('click', function (e) {
        let b = e.target.closest('[data-x]'); if (!b && e.target !== m) return;
        let a = b ? b.dataset.x : 'kal'; m.remove();
        if (a === 'kaydet') hdTumunuKaydet(devam);
        else if (a === 'at') { _hd.taslak = {}; devam(); }
    });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); m.remove(); } });
    document.body.appendChild(m);
    m.querySelector('[data-x="kaydet"]').focus();
}
// 📄 PDF (2026-09-30) — ekrandaki süzgeçle (grup/arama/eksik/pasif) listelenen TÜM sporcular (sayfalama değil),
// yatay A4, native jsPDF (html2pdf bu projede boş sayfa üretiyor). "Tümü"de grup grup bölümlenir.
function hdPdfIndir() {
    let satirlar = hdSatirlar();
    if (!satirlar.length) return hdDurum('PDF için listede sporcu yok.', true);
    showToast('PDF hazırlanıyor...', 'warning');
    let T = _trTranslit, grupAd = function (g) { let x = HD_GRUPLAR.find(function (y) { return y[0] === g; }); return x ? x[1] : g; };
    let d = function (x, id) { let v = hdDeger(x, { id: id }); return v === undefined || v === null ? '' : String(v).trim(); };
    let tarihTR = function (iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; };
    let yas = function (x) {
        let iso = d(x, 'dogumTarihi'), bugun = new Date();
        if (/^\d{4}-\d{2}-\d{2}/.test(iso)) { let y = +iso.slice(0, 4), a = +iso.slice(5, 7), g = +iso.slice(8, 10); let n = bugun.getFullYear() - y; if (bugun.getMonth() + 1 < a || (bugun.getMonth() + 1 === a && bugun.getDate() < g)) n--; return n; }
        let dy = parseInt(x.sp.dogumYili, 10); return dy > 1900 ? bugun.getFullYear() - dy : null;
    };
    let tel = function (t) { let s = String(t || '').replace(/\D/g, ''); if (s.length === 10 && s[0] === '5') s = '0' + s; return s.length === 11 ? s.slice(0, 4) + ' ' + s.slice(4, 7) + ' ' + s.slice(7, 9) + ' ' + s.slice(9) : String(t || ''); };
    // Sütunlar (mm) — yatay A4 kullanılabilir genişlik 269
    let S = [
        { b: '#', w: 9 }, { b: 'AD SOYAD', w: 52 }, { b: 'DOĞUM / YAŞ', w: 27 }, { b: 'CİNS.', w: 12 }, { b: 'YAY', w: 18 },
        { b: 'VELİ ADI', w: 38 }, { b: 'TELEFON', w: 29 }, { b: 'VELİ İŞ / MESLEK', w: 44 }, { b: 'NOT', w: 40 }
    ];
    _yeniPdfAl('landscape').then(function (pdf) {
        let W = 297, H = 210, mx = 14, uw = W - mx * 2, y, sayfa = 1;
        let beyazSayfa = function () { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); sayfa++; y = 14; };
        let sigdir = function (metin, w, boy) { pdf.setFontSize(boy); let s = T(metin); if (pdf.getTextWidth(s) <= w - 2.5) return s; while (s.length > 1 && pdf.getTextWidth(s + '...') > w - 2.5) s = s.slice(0, -1); return s + '...'; };
        let filtre = [_hd.grup === 'hepsi' ? 'Tüm gruplar' : grupAd(_hd.grup)];
        if (_hd.ara.trim()) filtre.push('Arama: "' + _hd.ara.trim() + '"'); if (_hd.eksik) filtre.push('Sadece eksik bilgisi olanlar'); if (_hd.pasifler) filtre.push('Pasifler dahil');
        y = _kurumsalBaslikCiz(pdf, mx, uw, 12, 'SPORCU LİSTESİ', 'Sporcu Bilgileri  |  ' + filtre.join('  |  '));
        // Özet şeridi
        let kiz = satirlar.filter(function (x) { return d(x, 'cinsiyet') === 'K'; }).length, erk = satirlar.filter(function (x) { return d(x, 'cinsiyet') === 'E'; }).length;
        let telYok = satirlar.filter(function (x) { return !d(x, 'acilTelefon'); }).length, dogYok = satirlar.filter(function (x) { return !d(x, 'dogumTarihi'); }).length;
        let ozet = [[String(satirlar.length), 'sporcu'], [String(kiz), 'kız'], [String(erk), 'erkek'], [String(telYok), 'veli telefonu eksik'], [String(dogYok), 'doğum tarihi eksik']];
        let ox = mx;
        ozet.forEach(function (o, i) {
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); let w1 = pdf.getTextWidth(o[0]);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); let w2 = pdf.getTextWidth(T(o[1]));
            let kw = w1 + w2 + 9, uyari = i >= 3 && o[0] !== '0';
            pdf.setFillColor(uyari ? 255 : 241, uyari ? 247 : 245, uyari ? 237 : 249); pdf.setDrawColor(uyari ? 251 : 226, uyari ? 191 : 232, uyari ? 36 : 240); pdf.setLineWidth(0.25);
            pdf.roundedRect(ox, y, kw, 8, 2, 2, 'FD');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(uyari ? 180 : 9, uyari ? 83 : 22, uyari ? 9 : 43); pdf.text(o[0], ox + 3.5, y + 5.7);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139); pdf.text(T(o[1]), ox + 3.5 + w1 + 2, y + 5.5);
            ox += kw + 3;
        });
        y += 13;
        let basliklar = function () {
            pdf.setFillColor(9, 22, 43); pdf.rect(mx, y, uw, 7.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(203, 213, 225);
            let x = mx; S.forEach(function (s) { pdf.text(T(s.b), x + 2, y + 5); x += s.w; });
            y += 7.5;
        };
        let bolum = function (g, n) {
            pdf.setFillColor(251, 191, 36); pdf.rect(mx, y + 1, 1.6, 6, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(9, 22, 43); pdf.text(T(grupAd(g)), mx + 4, y + 5.6);
            let gw = pdf.getTextWidth(T(grupAd(g)));
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139); pdf.text(n + ' sporcu', mx + 6 + gw, y + 5.6);
            y += 9;
        };
        let bolumlu = _hd.grup === 'hepsi';
        let gruplar = bolumlu ? HD_GRUPLAR.map(function (g) { return g[0]; }).filter(function (g) { return satirlar.some(function (x) { return x.g === g; }); }) : [null];
        let sira = 0;
        gruplar.forEach(function (g, gi) {
            let liste = g ? satirlar.filter(function (x) { return x.g === g; }) : satirlar;
            if (y + 26 > H - 16) beyazSayfa();
            if (g) bolum(g, liste.length);
            basliklar();
            liste.forEach(function (x, i) {
                // 2. veli varsa satır iki katlı: veli adı/telefonu alt alta
                let v2k = d(x, 'veli2Kisi'), v2t = d(x, 'veli2Telefon'), rh = (v2k || v2t) ? 11.5 : 7;
                if (y + rh > H - 16) { beyazSayfa(); if (g) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 138, 152); pdf.text(T(grupAd(g) + ' (devamı)'), mx, y + 4); y += 6; } basliklar(); }
                sira++;
                let pasif = !!hdDeger(x, { id: 'pasif' }), muaf = !!hdDeger(x, { id: 'aidatMuaf' });
                if (i % 2 === 1) { pdf.setFillColor(248, 250, 252); pdf.rect(mx, y, uw, rh, 'F'); }
                pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.15); pdf.line(mx, y + rh, mx + uw, y + rh);
                let hx = mx, hucre = function (s, metin, opt) {
                    opt = opt || {};
                    if (!metin) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(opt.eksik ? 217 : 203, opt.eksik ? 119 : 213, opt.eksik ? 6 : 225); pdf.text(opt.eksik ? 'eksik' : '-', hx + 2, y + 4.8); }
                    else { pdf.setFont('helvetica', opt.kalin ? 'bold' : 'normal'); let boy = opt.boy || 8.5; pdf.setTextColor(opt.renk ? opt.renk[0] : 30, opt.renk ? opt.renk[1] : 41, opt.renk ? opt.renk[2] : 59); pdf.text(sigdir(metin, s.w - (opt.sagBosluk || 0), boy), hx + 2, y + 4.8); }
                    hx += s.w;
                };
                hucre(S[0], String(sira), { boy: 7.5, renk: [148, 163, 184] });
                // İsim + pasif/muaf rozetleri
                let rozetler = []; if (pasif) rozetler.push('PASİF'); if (muaf) rozetler.push('MUAF');
                pdf.setFontSize(6); let rozW = rozetler.reduce(function (a, r) { return a + pdf.getTextWidth(r) + 4.5; }, 0);
                let adX = hx; hucre(S[1], x.ad, { kalin: true, boy: 8.5, renk: pasif ? [148, 163, 184] : [9, 22, 43], sagBosluk: rozW });
                if (rozetler.length) {
                    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); let rx = adX + 2 + Math.min(pdf.getTextWidth(sigdir(x.ad, S[1].w - rozW, 8.5)), S[1].w - rozW) + 1.5;
                    pdf.setFontSize(6);
                    rozetler.forEach(function (r) { let rw = pdf.getTextWidth(r) + 3; pdf.setFillColor(r === 'PASİF' ? 226 : 220, r === 'PASİF' ? 232 : 252, r === 'PASİF' ? 240 : 231); pdf.roundedRect(rx, y + 1.9, rw, 3.6, 1, 1, 'F'); pdf.setTextColor(r === 'PASİF' ? 100 : 22, r === 'PASİF' ? 116 : 101, r === 'PASİF' ? 139 : 52); pdf.text(r, rx + 1.5, y + 4.6); rx += rw + 1.5; });
                }
                let dt = tarihTR(d(x, 'dogumTarihi')), ys = yas(x);
                hucre(S[2], dt ? dt + (ys !== null ? '  (' + ys + ')' : '') : (ys !== null ? x.sp.dogumYili + '  (' + ys + ')' : ''), { eksik: true, boy: 8 });
                hucre(S[3], d(x, 'cinsiyet') === 'K' ? 'Kız' : d(x, 'cinsiyet') === 'E' ? 'Erkek' : '', { eksik: true, boy: 8 });
                hucre(S[4], d(x, 'yay'), { boy: 8 });
                hucre(S[5], d(x, 'acilKisi'), { eksik: true });
                hucre(S[6], tel(d(x, 'acilTelefon')), { eksik: true });
                if (rh > 7) {
                    let x5 = mx + S.slice(0, 5).reduce(function (a, c) { return a + c.w; }, 0);
                    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
                    if (v2k) pdf.text(sigdir(v2k, S[5].w, 8), x5 + 2, y + 9.3);
                    if (v2t) { pdf.setFontSize(8); pdf.text(sigdir(tel(v2t), S[6].w, 8), x5 + S[5].w + 2, y + 9.3); }
                }
                hucre(S[7], d(x, 'aileMeslek'), { boy: 8 });
                hucre(S[8], d(x, 'genelNot'), { boy: 7.5, renk: [71, 85, 105] });
                y += rh;
            });
            y += 5;
        });
        _kurumsalAltBilgiCiz(pdf, W, H);
        let tarih = (typeof bugunISO === 'function' ? bugunISO() : '').replace(/-/g, '');
        pdf.save('Sporcu_Listesi_' + T(_hd.grup === 'hepsi' ? 'Tum' : grupAd(_hd.grup)) + '_' + tarih + '.pdf');
        showToast('PDF indirildi! 📄', 'success');
        if (hdDegisiklikSay()) hdDurum('Not: PDF kaydedilmemiş değişiklikleri de içeriyor — kalıcı olması için 💾 Kaydet.');
    }).catch(function (e) { showToast('PDF oluşturulamadı.', 'error'); console.error(e); });
}
function hdAcikMi() { return yoneticiSekmeAktif === 'hizliduzenle' && !!document.querySelector('#yonetici-liste .hd'); }
(function () {
    let eskiSekme = yoneticiSekme, eskiKapat = yoneticiPaneliKapat;
    yoneticiSekme = function (k) {
        let args = arguments, self = this;
        if (k !== 'hizliduzenle' && hdAcikMi() && hdDegisiklikSay()) return hdCikisSor(function () { eskiSekme.apply(self, args); });
        return eskiSekme.apply(this, arguments);
    };
    yoneticiPaneliKapat = function () {
        let args = arguments, self = this;
        // 10 dk hareketsizlik kilidi (_yonYetkiSon=0) soru sormadan kapatır — taslak bellekte kalır, geri gelince durur.
        if (hdAcikMi() && hdDegisiklikSay() && !(typeof _yonYetkiSon !== 'undefined' && _yonYetkiSon === 0)) return hdCikisSor(function () { eskiKapat.apply(self, args); });
        return eskiKapat.apply(this, arguments);
    };
    window.addEventListener('beforeunload', function (e) { if (hdDegisiklikSay()) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && hdAcikMi()) { e.preventDefault(); hdTumunuKaydet(); } });
})();
function hdAdGrupDegistir(k, s, el) {
    let yeniAd = s.id === 'ad' ? String(el.value || '').trim().toLocaleUpperCase('tr-TR') : k.ad, yeniGrup = s.id === 'grup' ? el.value : k.g;
    if (!yeniAd) { el.value = k.ad; return hdDurum('İsim boş olamaz.', true); }
    if (yeniAd === k.ad && yeniGrup === k.g) return;
    if (turnuvaDB[yeniGrup] && turnuvaDB[yeniGrup][yeniAd]) { el.value = s.id === 'ad' ? k.ad : k.g; return hdDurum(yeniAd + ' zaten o grupta var — iki kaydı Çift Kayıt\'tan birleştir.', true); }
    let grupAd = function (g) { let x = HD_GRUPLAR.find(function (y) { return y[0] === g; }); return x ? x[1] : g; };
    onayIste(s.id === 'ad' ? '<b>' + esc(k.ad) + '</b> → <b>' + esc(yeniAd) + '</b> olarak değişsin mi?<br><span style="font-size:12px;color:var(--text-muted)">Serileri, aidatı, yoklaması ve ders kayıtları yeni isme taşınır.</span>'
        : '<b>' + esc(k.ad) + '</b> ' + grupAd(k.g) + ' → <b>' + grupAd(yeniGrup) + '</b> grubuna taşınsın mı?<br><span style="font-size:12px;color:var(--text-muted)">Serileri, aidatı, yoklaması ve ders kayıtları da taşınır.</span>', function () {
        hdDurum('Değiştiriliyor…');
        _sporcuYenidenAdlandir(k.g, k.ad, yeniAd, yeniGrup !== k.g ? yeniGrup : undefined).then(function () {
            let ek = k.g + '|' + k.ad, t = _hd.taslak[ek]; if (t) { delete _hd.taslak[ek]; _hd.taslak[yeniGrup + '|' + yeniAd] = t; } // kaydedilmemiş değişiklikler yeni isimle kalsın
            hdDurum('✓ ' + yeniAd + ' güncellendi'); hdCiz(); try { sporcuListesiniYenile(); siralamaListesiDoldur(); } catch (e) {} })
            .catch(function (e) { hdDurum('Değiştirilemedi: ' + (e && e.message ? e.message : 'bağlantı hatası') + ' — hiçbir şey değişmedi.', true); hdCiz(); });
    }, 'Evet, değiştir');
    // Vazgeçilirse hücre eski değerine dönsün
    setTimeout(function () { let m = document.getElementById('onay-modal'); if (m && m.style.display === 'none') return; let geri = function () { if (m && m.style.display === 'none') { hdCiz(); } else setTimeout(geri, 400); }; geri(); }, 50);
}
// Klavye: Enter/↓ alt satır, ↑ üst satır — aynı sütun.
function hdTus(e) {
    if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    let el = e.target; if (el.tagName === 'SELECT' && e.key !== 'Enter') return;
    e.preventDefault();
    let r = parseInt(el.dataset.r, 10) + (e.key === 'ArrowUp' ? -1 : 1);
    let hedef = document.querySelector('.hd-tablo [data-s="' + el.dataset.s + '"][data-r="' + r + '"]');
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') el.dispatchEvent(new Event('change'));
    if (hedef) { hedef.focus(); if (hedef.select && hedef.type !== 'date' && hedef.type !== 'checkbox') hedef.select(); }
}
// Excel'den çok satırlı yapıştırma: bu hücreden aşağı doğru aynı sütunu doldurur.
function hdYapistir(e) {
    let t = (e.clipboardData || window.clipboardData).getData('text'); if (!t || t.indexOf('\n') < 0) return;
    e.preventDefault();
    let satirlar = t.replace(/\r/g, '').split('\n').filter(function (x, i, a) { return !(i === a.length - 1 && x === ''); });
    let el = e.target, s = el.dataset.s, r0 = parseInt(el.dataset.r, 10), n = 0;
    if (s === 'ad') return hdDurum('İsim sütununa toplu yapıştırma yapılmaz — isimleri tek tek değiştir.', true);
    satirlar.forEach(function (deger, i) {
        let h = document.querySelector('.hd-tablo [data-s="' + s + '"][data-r="' + (r0 + i) + '"]'); if (!h) return;
        deger = deger.split('\t')[0].trim();
        if (s === 'dogumTarihi' || s === 'saglikRaporuBitis' || s === 'lisansBitis') { let m = deger.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/); if (m) deger = m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); }
        h.value = deger; hdKaydet(h); n++;
    });
    hdDurum(n + ' satıra yapıştırıldı');
}
function hdYeniEkle() {
    let ad = String((document.getElementById('hd-yeni-ad') || {}).value || '').trim().toLocaleUpperCase('tr-TR');
    let g = (document.getElementById('hd-yeni-grup') || {}).value || 'buyukler';
    let dogum = (document.getElementById('hd-yeni-dogum') || {}).value || '', cins = (document.getElementById('hd-yeni-cins') || {}).value || 'K';
    let tel = String((document.getElementById('hd-yeni-tel') || {}).value || '').trim();
    if (!ad) return hdDurum('Ad Soyad yaz.', true);
    if (turnuvaDB[g] && turnuvaDB[g][ad]) return hdDurum(ad + ' zaten bu grupta kayıtlı.', true);
    let norm = typeof turkceNormalize === 'function' ? turkceNormalize(ad) : ad, baska = null;
    HD_GRUPLAR.forEach(function (gr) { if (!baska) Object.keys(turnuvaDB[gr[0]] || {}).forEach(function (m) { if (!baska && gr[0] !== g && (typeof turkceNormalize === 'function' ? turkceNormalize(m) : m) === norm) baska = gr[1]; }); });
    let ekle = function () {
        try { _yonCinsiyet = cins; } catch (e) {}
        _yoneticiSporcuEkleGerceklestir(ad, dogum ? parseInt(dogum.slice(0, 4), 10) : '', g);
        let sp = turnuvaDB[g] && turnuvaDB[g][ad];
        if (sp) { if (dogum) sp.dogumTarihi = dogum; if (tel) sp.acilTelefon = tel; sp.cinsiyet = cins; sp.lastModified = Date.now(); try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); bekleyenGonderim = true; } catch (e) {} }
        _hd.yeniAcik = true; _hd.ara = ''; hdCiz(); hdDurum('✓ ' + ad + ' eklendi');
        let e2 = document.getElementById('hd-yeni-ad'); if (e2) e2.focus();
    };
    if (baska) return onayIste('<b>' + esc(ad) + '</b> zaten <b>' + baska + '</b> grubunda kayıtlı. Farklı bir kişi mi?<br><span style="font-size:12px;color:var(--text-muted)">Aynı kişiyse grubunu tablodaki Grup sütunundan değiştir — yoksa skor geçmişi ikiye bölünür.</span>', ekle, 'Farklı kişi, ekle');
    ekle();
}
(function () {
    let st = document.createElement('style');
    st.textContent = '.hd{display:flex;flex-direction:column;gap:10px}'
        + '.hd.tam{position:fixed;inset:0;z-index:30500;background:var(--bg-main);padding:14px 16px;overflow:auto}.hd.tam .hd-tablo-kap{max-height:calc(100vh - 230px)}'
        + '.hd input[type=checkbox]{-webkit-appearance:checkbox!important;appearance:auto!important;accent-color:var(--accent-orange)}'
        + '.hd-ust{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.hd-baslik{font-weight:900;font-size:16px}.hd-alt{font-size:11.5px;color:var(--text-muted);margin-top:2px}'
        + '.hd-arac{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
        + '.hd-ara{flex:1;min-width:180px;background:var(--bg-panel);border:1px solid var(--border-color);border-radius:10px;padding:9px 12px;color:var(--text-primary,var(--text-main));font:inherit}'
        + '.hd-cipler{display:flex;gap:4px;flex-wrap:wrap}.hd-cip{border:1px solid var(--border-color);background:transparent;color:var(--text-muted);border-radius:999px;padding:6px 11px;font-weight:800;font-size:12px;cursor:pointer;min-height:34px}.hd-cip.aktif{border-color:var(--accent-orange);color:var(--accent-orange);background:color-mix(in srgb,var(--accent-orange) 12%,transparent)}'
        + '.hd-sec{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);cursor:pointer}.hd-sayi{font-size:12px;color:var(--text-muted);margin-left:auto;font-variant-numeric:tabular-nums}'
        + '.hd-btn{border:1px solid var(--border-color);background:transparent;color:var(--text-primary,var(--text-main));border-radius:10px;padding:0 14px;min-height:40px;font-weight:800;font-size:12.5px;cursor:pointer}.hd-btn.ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#1a0d05}'
        + '.hd-yeni{display:flex;gap:6px;flex-wrap:wrap;padding:10px;border:1px dashed var(--accent-orange);border-radius:12px}'
        + '.hd-yeni input,.hd-yeni select{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:8px;padding:8px 10px;color:var(--text-primary,var(--text-main));font:inherit;min-height:40px}.hd-yeni #hd-yeni-ad{flex:1;min-width:170px}'
        + '.hd-tablo-kap{overflow:auto;max-height:68vh;border:1px solid var(--border-color);border-radius:12px}'
        + '.hd-tablo{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:12.5px}'
        + '.hd-tablo th{position:sticky;top:0;z-index:2;background:var(--bg-panel);text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted);padding:8px;border-bottom:1px solid var(--border-color);white-space:nowrap}'
        + '.hd-eksik-say{display:block;text-transform:none;letter-spacing:0;color:var(--status-warning,#d97706);font-weight:700}'
        + '.hd-td{padding:2px;border-bottom:1px solid var(--border-color);background:var(--bg-main)}'
        + '.hd-sabit{position:sticky;left:0;z-index:1;background:var(--bg-main)}.hd-tablo th.hd-sabit{z-index:3;background:var(--bg-panel)}'
        + '.hd-td input:not([type=checkbox]),.hd-td select{width:100%;box-sizing:border-box;background:transparent;border:1px solid transparent;border-radius:6px;padding:7px 8px;color:var(--text-primary,var(--text-main));font:inherit;min-height:36px}'
        + '.hd-td input:not([type=checkbox]):hover,.hd-td select:hover{border-color:var(--border-color)}'
        + '.hd-td input:focus,.hd-td select:focus{outline:none;border-color:var(--accent-orange);background:var(--bg-panel)}'
        + '.hd-td.hd-eksik input,.hd-td.hd-eksik select{background:color-mix(in srgb,var(--status-warning,#d97706) 10%,transparent)}'
        + '.hd-orta{text-align:center}.hd-orta input{width:18px;height:18px;cursor:pointer}'
        + '.hd-pasif td{opacity:.55}.hd-bos{padding:20px;text-align:center;color:var(--text-muted)}'
        + '.hd-kaydet-cubuk{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-panel)}'
        + '.hd-kaydet-cubuk.bekliyor{border-color:var(--accent-orange);box-shadow:0 0 0 1px var(--accent-orange),0 6px 18px color-mix(in srgb,var(--accent-orange) 22%,transparent)}'
        + '.hd-kc-yazi{flex:1;min-width:160px;font-size:12.5px;color:var(--text-muted)}.hd-kaydet-cubuk.bekliyor .hd-kc-yazi{color:var(--accent-orange)}'
        + '.hd-kc-kaydet{min-width:120px;font-size:14px}.hd-kc-kaydet:disabled{opacity:.4;cursor:default}'
        + '.hd-td.hd-degisti input:not([type=checkbox]),.hd-td.hd-degisti select{border-color:var(--accent-orange);background:color-mix(in srgb,var(--accent-orange) 12%,transparent)}.hd-td.hd-degisti.hd-orta{box-shadow:inset 0 0 0 2px var(--accent-orange)}'
        + '.hd-cikis{position:fixed;inset:0;z-index:31500;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55)}'
        + '.hd-cikis-kutu{width:min(440px,100%);background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 50px rgba(0,0,0,.5)}'
        + '.hd-cikis-baslik{font-weight:900;font-size:16px}.hd-cikis-metin{font-size:13px;color:var(--text-muted)}.hd-cikis-btnler{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:4px}'
        + '.hd-btn.hd-tehlike{color:var(--status-danger,#ef4444);border-color:color-mix(in srgb,var(--status-danger,#ef4444) 50%,transparent)}'
        + '.hd-durum{min-height:18px;font-size:12px;color:var(--status-success,#16a34a)}.hd-durum.hata{color:var(--status-danger,#ef4444)}';
    document.head.appendChild(st);
})();

document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && _hd.tam && document.querySelector('.hd.tam') && !(document.getElementById('onay-modal') || {}).offsetParent) { _hd.tam = false; hdCiz(); } });
