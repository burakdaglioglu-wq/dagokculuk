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
    { id: 'saglikRaporuBitis', ad: 'Sağlık raporu', tip: 'tarih', gen: 138, eksik: true },
    { id: 'lisansBitis', ad: 'Lisans', tip: 'tarih', gen: 138 },
    { id: 'aidatMuaf', ad: 'Aidat muaf', tip: 'onay', gen: 70 },
    { id: 'pasif', ad: 'Pasif', tip: 'onay', gen: 60 },
    { id: 'genelNot', ad: 'Not', tip: 'metin', gen: 200 }
];
const HD_SAYFA = 60;
let _hd = { grup: 'hepsi', ara: '', eksik: false, pasifler: false, sayfa: 1, bekleyen: {}, zaman: {}, yeniAcik: false, tam: window.innerWidth >= 900 };

function hdKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function hdCoz(k) { let s = decodeURIComponent(k), i = s.indexOf('|'); return { g: s.slice(0, i), ad: s.slice(i + 1) }; }
function hdKatla(s) { return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
function hdDeger(x, s) { if (s.id === 'ad') return x.ad; if (s.id === 'grup') return x.g; let v = x.sp[s.id]; return v === undefined || v === null ? '' : v; }
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
    let eksik = hdEksikMi(x, s) ? ' hd-eksik' : '';
    if (s.tip === 'onay') return '<td class="hd-td hd-orta"><input type="checkbox" ' + ort + (v ? ' checked' : '') + ' onchange="hdKaydet(this)" aria-label="' + s.ad + '"></td>';
    if (s.tip === 'secim' || s.tip === 'grup') {
        let sec = s.tip === 'grup' ? HD_GRUPLAR : s.secenek;
        return '<td class="hd-td' + eksik + '"><select ' + ort + ' onchange="hdKaydet(this)" aria-label="' + s.ad + '">' + sec.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>';
    }
    let tur = s.tip === 'tarih' ? 'date' : s.tip === 'tel' ? 'tel' : 'text';
    return '<td class="hd-td' + eksik + (s.id === 'ad' ? ' hd-sabit' : '') + '"><input type="' + tur + '" ' + ort + ' value="' + esc(String(v)) + '" onchange="hdKaydet(this)" onpaste="hdYapistir(event)" aria-label="' + s.ad + '"' + (s.tip === 'tel' ? ' inputmode="tel" placeholder="05xx…"' : '') + '></td>';
}
function hdCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let tum = hdSatirlar(), goster = tum.slice(0, _hd.sayfa * HD_SAYFA);
    let tumAktif = []; HD_GRUPLAR.forEach(function (gr) { Object.keys(turnuvaDB[gr[0]] || {}).forEach(function (ad) { let sp = turnuvaDB[gr[0]][ad]; if (sp && !sp.pasif) tumAktif.push({ g: gr[0], ad: ad, sp: sp }); }); });
    let eksikSay = function (s) { return tumAktif.filter(function (x) { return hdEksikMi(x, s); }).length; };
    let cip = function (id, ad) { return '<button class="hd-cip' + (_hd.grup === id ? ' aktif' : '') + '" onclick="_hd.grup=\'' + id + '\'; _hd.sayfa=1; hdCiz()">' + ad + '</button>'; };
    let bas = HD_SUTUNLAR.map(function (s) { let n = s.eksik ? eksikSay(s) : 0; return '<th style="min-width:' + s.gen + 'px"' + (s.id === 'ad' ? ' class="hd-sabit"' : '') + '>' + s.ad + (n ? ' <small class="hd-eksik-say">' + n + ' eksik</small>' : '') + '</th>'; }).join('');
    alan.innerHTML = '<div class="hd' + (_hd.tam ? ' tam' : '') + '">'
        + '<div class="hd-ust"><div><div class="hd-baslik">📝 Hızlı Düzenle</div><div class="hd-alt">Hücreye yaz, çıkınca kaydedilir · Enter/↓ alt satır · Excel\'den bir sütunu yapıştırabilirsin</div></div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="hd-btn ana" onclick="_hd.yeniAcik=!_hd.yeniAcik; hdCiz()">➕ Yeni sporcu</button><button class="hd-btn" onclick="_hd.tam=!_hd.tam; hdCiz()">' + (_hd.tam ? '✕ Küçült' : '⛶ Tam ekran') + '</button></div></div>'
        + (_hd.yeniAcik ? '<div class="hd-yeni"><input id="hd-yeni-ad" placeholder="Ad Soyad" autocomplete="off"><select id="hd-yeni-grup">' + HD_GRUPLAR.map(function (g) { return '<option value="' + g[0] + '"' + ((_hd.grup === g[0] || (_hd.grup === 'hepsi' && g[0] === (typeof aktifGrup !== 'undefined' ? aktifGrup : 'buyukler'))) ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select><input id="hd-yeni-dogum" type="date" aria-label="Doğum tarihi"><select id="hd-yeni-cins"><option value="K">Kız</option><option value="E">Erkek</option></select><input id="hd-yeni-tel" type="tel" inputmode="tel" placeholder="Veli telefonu"><button class="hd-btn ana" onclick="hdYeniEkle()">Ekle</button></div>' : '')
        + '<div class="hd-arac"><input class="hd-ara" type="search" id="hd-ara" placeholder="🔍 İsim ara" value="' + esc(_hd.ara) + '" oninput="_hd.ara=this.value; _hd.sayfa=1; hdCiz(); let e=document.getElementById(\'hd-ara\'); e.focus(); e.setSelectionRange(e.value.length,e.value.length)">'
        + '<div class="hd-cipler">' + cip('hepsi', 'Tümü') + HD_GRUPLAR.map(function (g) { return cip(g[0], g[1]); }).join('') + '</div>'
        + '<label class="hd-sec"><input type="checkbox"' + (_hd.eksik ? ' checked' : '') + ' onchange="_hd.eksik=this.checked; _hd.sayfa=1; hdCiz()"> Sadece eksik bilgisi olanlar</label>'
        + '<label class="hd-sec"><input type="checkbox"' + (_hd.pasifler ? ' checked' : '') + ' onchange="_hd.pasifler=this.checked; _hd.sayfa=1; hdCiz()"> Pasifleri de göster</label>'
        + '<span class="hd-sayi">' + tum.length + ' sporcu</span></div>'
        + '<div class="hd-tablo-kap"><table class="hd-tablo"><thead><tr>' + bas + '</tr></thead><tbody>'
        + (goster.map(function (x, i) { return '<tr class="' + (x.sp.pasif ? 'hd-pasif' : '') + '">' + HD_SUTUNLAR.map(function (s) { return hdHucre(x, s, i); }).join('') + '</tr>'; }).join('') || '<tr><td colspan="' + HD_SUTUNLAR.length + '" class="hd-bos">Bu süzgeçte sporcu yok.</td></tr>')
        + '</tbody></table></div>'
        + (tum.length > goster.length ? '<button class="hd-btn" onclick="_hd.sayfa++; hdCiz()">▾ ' + Math.min(HD_SAYFA, tum.length - goster.length) + ' sporcu daha göster</button>' : '')
        + '<div class="hd-durum" id="hd-durum" aria-live="polite"></div></div>';
}
function hdDurum(metin, hata) { let e = document.getElementById('hd-durum'); if (e) { e.textContent = metin; e.className = 'hd-durum' + (hata ? ' hata' : ''); } }
// Sunucu: sporcu başına alanları biriktir, 0,8 sn sessizlikten sonra tek PATCH.
function hdSunucuyaGonder(g, ad) {
    let k = g + '|' + ad, alanlar = _hd.bekleyen[k]; if (!alanlar) return;
    delete _hd.bekleyen[k];
    fetch('/api/athletes/' + encodeURIComponent(g) + '/' + encodeURIComponent(ad), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: alanlar, lastModified: Date.now(), deviceId: (typeof _cihazId !== 'undefined' ? _cihazId : null) }) })
        .then(function (r) { if (r.ok || r.status === 409) hdDurum('✓ Kaydedildi — ' + kmOzetIlkAdHd(ad)); else throw new Error(r.status); })
        .catch(function () { hdDurum('Sunucuya gönderilemedi — cihazda kayıtlı, bağlantı gelince senkronla gidecek.', true); });
}
function kmOzetIlkAdHd(ad) { return String(ad).split(' ')[0]; }
function hdKaydet(el) {
    let k = hdCoz(el.dataset.k), s = HD_SUTUNLAR.find(function (x) { return x.id === el.dataset.s; });
    let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; if (!sp || !s) return;
    if (s.id === 'ad' || s.id === 'grup') return hdAdGrupDegistir(k, s, el);
    let v = s.tip === 'onay' ? !!el.checked : String(el.value || '').trim();
    if (s.tip === 'tarih' && v && s.id === 'dogumTarihi' && v > bugunISO()) { el.value = sp[s.id] || ''; return hdDurum('Doğum tarihi gelecekte olamaz.', true); }
    let eski = sp[s.id] === undefined || sp[s.id] === null ? (s.tip === 'onay' ? false : '') : sp[s.id];
    if (eski === v) return;
    sp[s.id] = v;
    let alanlar = {}; alanlar[s.id] = s.tip === 'onay' ? (v ? 1 : 0) : v; // boşaltma '' (null DEĞİL — sunucu kişisel alanda null'u yok sayar)
    if (s.id === 'dogumTarihi' && v) { sp.dogumYili = parseInt(v.slice(0, 4), 10); alanlar.dogumYili = sp.dogumYili; }
    sp.lastModified = Date.now();
    try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
    try { bekleyenGonderim = true; } catch (e) {}
    let kk = k.g + '|' + k.ad; _hd.bekleyen[kk] = Object.assign(_hd.bekleyen[kk] || {}, alanlar);
    clearTimeout(_hd.zaman[kk]); _hd.zaman[kk] = setTimeout(function () { hdSunucuyaGonder(k.g, k.ad); }, 800);
    let td = el.closest('td'); if (td) td.classList.toggle('hd-eksik', !!s.eksik && (v === '' || v === false));
    if (s.id === 'pasif') { let tr = el.closest('tr'); if (tr) tr.classList.toggle('hd-pasif', v); }
    hdDurum('Kaydediliyor…');
}
function hdAdGrupDegistir(k, s, el) {
    let yeniAd = s.id === 'ad' ? String(el.value || '').trim().toLocaleUpperCase('tr-TR') : k.ad, yeniGrup = s.id === 'grup' ? el.value : k.g;
    if (!yeniAd) { el.value = k.ad; return hdDurum('İsim boş olamaz.', true); }
    if (yeniAd === k.ad && yeniGrup === k.g) return;
    if (turnuvaDB[yeniGrup] && turnuvaDB[yeniGrup][yeniAd]) { el.value = s.id === 'ad' ? k.ad : k.g; return hdDurum(yeniAd + ' zaten o grupta var — iki kaydı Çift Kayıt\'tan birleştir.', true); }
    let grupAd = function (g) { let x = HD_GRUPLAR.find(function (y) { return y[0] === g; }); return x ? x[1] : g; };
    onayIste(s.id === 'ad' ? '<b>' + esc(k.ad) + '</b> → <b>' + esc(yeniAd) + '</b> olarak değişsin mi?<br><span style="font-size:12px;color:var(--text-muted)">Serileri, aidatı, yoklaması ve ders kayıtları yeni isme taşınır.</span>'
        : '<b>' + esc(k.ad) + '</b> ' + grupAd(k.g) + ' → <b>' + grupAd(yeniGrup) + '</b> grubuna taşınsın mı?<br><span style="font-size:12px;color:var(--text-muted)">Serileri, aidatı, yoklaması ve ders kayıtları da taşınır.</span>', function () {
        hdDurum('Değiştiriliyor…');
        _sporcuYenidenAdlandir(k.g, k.ad, yeniAd, yeniGrup !== k.g ? yeniGrup : undefined).then(function () { hdDurum('✓ ' + yeniAd + ' güncellendi'); hdCiz(); try { sporcuListesiniYenile(); siralamaListesiDoldur(); } catch (e) {} })
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
        + '.hd-durum{min-height:18px;font-size:12px;color:var(--status-success,#16a34a)}.hd-durum.hata{color:var(--status-danger,#ef4444)}';
    document.head.appendChild(st);
})();

document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && _hd.tam && document.querySelector('.hd.tam') && !(document.getElementById('onay-modal') || {}).offsetParent) { _hd.tam = false; hdCiz(); } });
