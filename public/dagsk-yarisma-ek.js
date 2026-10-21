/* 🏹 Yarışma ekleri (2026-10-21) — kullanıcı seçimi: 📜 fotoğraflı başarı belgesi (taslak A · Klasik), 🏆 kulüp ligi / sezon puanı,
   📋 resmi skor kağıdı. dagsk-km-yarisma-pro.js'ten yzEk('fonksiyon') ile tembel yüklenir.
   - Belge: A4 yatay tuval (2339×1654) → PDF (sporcu başına bir sayfa) ya da PNG → WhatsApp (dagsk-foto.js _paylas).
     Fotoğraf: fotoVeriAl (izin şartı yok — belge veliye gider). Derece: eleme varsa podyum (yzPodyumListe), yoksa yay grubundaki sıra.
   - Lig: tek lig = Karışık Sınıf Dönem ligi (dagsk-km-gelisim.js glLigTablo); burada yalnız tam ekran fotoğraflı tablo (bkz. aşağıda).
   - Skor kağıdı: hedef başına bir A4 (native jsPDF çizim), seri × ok kutuları, yarı/genel toplam, 10+X, X, atıcı + yazıcı imzası. */
const YZB_W = 2339, YZB_H = 1654;
const YZB_DERECE = ['BİRİNCİ', 'İKİNCİ', 'ÜÇÜNCÜ'];

function yzbAy(t) { return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
function yzbGorsel(src, cors) { return new Promise(function (ok) { if (!src) return ok(null); let im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }
function yzbSar(x, metin, maks) { let s = String(metin).split(' '), l = [], c = ''; s.forEach(function (w) { let d = c ? c + ' ' + w : w; if (x.measureText(d).width > maks && c) { l.push(c); c = w; } else c = d; }); if (c) l.push(c); return l; }

// ---------------------------------------------------------------- 📜 belge verisi (şu anki bitmiş tur)
function yzbListe() {
    let o = yzOku(), d = o.durum; if (!d || !d.katilimci) return null;
    let f = yzFormat(d), sira = yzSiralama(o), podyum = {};
    try { let p = yzPodyumListe(o); if (p && p.eleme) p.liste.forEach(function (x) { podyum[x.k] = x.sira; }); } catch (e) {}
    let l = [];
    yzGruplar(o, sira).forEach(function (gr) {
        gr.liste.forEach(function (r) { l.push({ k: r.k, ad: r.ad, sira: podyum[r.k] || r.sira, toplam: r.toplam, on: r.on, x: r.x, kisi: gr.liste.length, grup: gr.ad || '' }); });
    });
    l.sort(function (a, b) { return a.sira - b.sira || a.ad.localeCompare(b.ad, 'tr'); });
    return { o: o, d: d, f: f, l: l, tarih: d.basla, baslik: d.ayar.mesafe + ' · ' + (f.seri * f.ok) + ' ok Sıralama Turu' };
}
// ---------------------------------------------------------------- 📜 belge çizimi (A · Klasik)
async function yzbCiz(s, v) {
    let c = document.createElement('canvas'); c.width = YZB_W; c.height = YZB_H;
    let x = c.getContext('2d'), g = String(s.k).split('|')[0];
    let foto = typeof fotoVeriAl === 'function' && turnuvaDB[g] && turnuvaDB[g][s.ad] ? await fotoVeriAl(fotoAnahtar(g, s.ad)).then(yzbGorsel) : null;
    let logo = await yzbGorsel('/favicon.png');
    let SERIF = 'Georgia,"Times New Roman",serif', SANS = 'system-ui,"Segoe UI",Roboto,sans-serif', ALTIN = '#b8892a';
    x.fillStyle = '#fbf6ea'; x.fillRect(0, 0, YZB_W, YZB_H);
    x.strokeStyle = ALTIN; x.lineWidth = 10; x.strokeRect(70, 70, YZB_W - 140, YZB_H - 140); x.lineWidth = 3; x.strokeRect(100, 100, YZB_W - 200, YZB_H - 200);
    // köşe süsleri
    [[100, 100], [YZB_W - 100, 100], [100, YZB_H - 100], [YZB_W - 100, YZB_H - 100]].forEach(function (p) { x.fillStyle = ALTIN; x.beginPath(); x.arc(p[0], p[1], 16, 0, 7); x.fill(); });
    // fotoğraf
    let cx = 560, cy = 780, R = 300;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
    if (foto) { let m = Math.min(foto.naturalWidth, foto.naturalHeight); x.drawImage(foto, (foto.naturalWidth - m) / 2, (foto.naturalHeight - m) / 2, m, m, cx - R, cy - R, 2 * R, 2 * R); }
    else { x.fillStyle = '#efe4c8'; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); x.fillStyle = '#8a6a1f'; x.font = '700 200px ' + SERIF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(s.ad).trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join(''), cx, cy + 10); }
    x.restore();
    x.strokeStyle = ALTIN; x.lineWidth = 14; x.beginPath(); x.arc(cx, cy, R + 8, 0, 7); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R + 34, 0, 7); x.stroke();
    // yazılar
    let X = 1010, MAKS = YZB_W - X - 200, y = 330;
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#8a6a1f'; x.font = '800 42px ' + SANS; if ('letterSpacing' in x) x.letterSpacing = '14px'; x.fillText('DAĞ SPOR KULÜBÜ · OKÇULUK', X, y); if ('letterSpacing' in x) x.letterSpacing = '0px';
    y += 150; x.fillStyle = '#2b2214'; x.font = '700 132px ' + SERIF; x.fillText('Başarı Belgesi', X, y);
    y += 110; x.font = '400 50px ' + SERIF; x.fillStyle = '#3b3020';
    yzbSar(x, yzbAy(v.tarih) + ' tarihinde düzenlenen ' + v.baslik + '\'nda gösterdiği başarıdan dolayı', MAKS).forEach(function (l) { x.fillText(l, X, y); y += 68; });
    y += 70; x.fillStyle = '#7a1f12'; let adF = 128; do { x.font = 'italic 700 ' + adF + 'px ' + SERIF; adF -= 6; } while (x.measureText(s.ad).width > MAKS && adF > 60); x.fillText(s.ad, X, y);
    x.strokeStyle = ALTIN; x.lineWidth = 3; x.beginPath(); x.moveTo(X, y + 30); x.lineTo(X + MAKS, y + 30); x.stroke();
    y += 110; x.fillStyle = '#3b3020'; x.font = '400 50px ' + SERIF; x.fillText('bu belgeyi almaya hak kazanmıştır.', X, y);
    // derece / madalya
    y += 140;
    let ilk3 = s.sira >= 1 && s.sira <= 3, renk = ['#d4a017', '#9aa5b1', '#b0652c'][s.sira - 1];
    if (ilk3) {
        x.fillStyle = renk; x.beginPath(); x.arc(X + 48, y - 18, 48, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 6; x.stroke();
        x.fillStyle = '#fff'; x.font = '900 52px ' + SANS; x.textAlign = 'center'; x.fillText(String(s.sira), X + 48, y); x.textAlign = 'left';
    }
    x.fillStyle = ilk3 ? '#6b4e0a' : '#5a4b2c'; x.font = '800 60px ' + SANS;
    let derece = (ilk3 ? YZB_DERECE[s.sira - 1] : s.sira + '. SIRA') + ' · ' + s.toplam + ' puan' + (s.on ? ' · ' + s.on + ' × 10+X' : '');
    x.fillText(derece, X + (ilk3 ? 124 : 0), y);
    if (s.grup) { x.font = '600 40px ' + SANS; x.fillStyle = '#8a7a5a'; x.fillText(s.grup + ' · ' + s.kisi + ' sporcu', X + (ilk3 ? 124 : 0), y + 62); }
    // alt bilgi
    let ay = YZB_H - 190;
    if (logo) x.drawImage(logo, 200, ay - 70, 90, 90);
    x.fillStyle = '#8a6a1f'; x.font = '900 46px ' + SANS; if ('letterSpacing' in x) x.letterSpacing = '6px'; x.fillText('DAĞ S.K.', 310, ay - 10); if ('letterSpacing' in x) x.letterSpacing = '0px';
    // imza çizgisi: isim yazılmaz (kullanıcı: "yazmasın") — ıslak imza için boş çizgi + "Antrenör"
    let ix = YZB_W - 200 - 640;
    x.strokeStyle = '#6b5a3a'; x.lineWidth = 2; x.beginPath(); x.moveTo(ix, ay - 40); x.lineTo(ix + 640, ay - 40); x.stroke();
    x.fillStyle = '#6b5a3a'; x.font = '500 38px ' + SANS; x.textAlign = 'center'; x.fillText('Antrenör', ix + 320, ay + 10); x.textAlign = 'left';
    return c;
}
// ---------------------------------------------------------------- 📜 belgeler penceresi
let _yzb = null;
function yzBelgelerAc() {
    let v = yzbListe(); if (!v || !v.l.length) return showToast('Belge için önce turu bitir.', 'warning');
    _yzb = v;
    let a = document.getElementById('yzb-pencere'); if (!a) { a = document.createElement('div'); a.id = 'yzb-pencere'; document.body.appendChild(a); }
    a.style.cssText = 'position:fixed;inset:0;z-index:32000;background:rgba(4,6,9,.72);display:flex;align-items:center;justify-content:center;padding:12px';
    a.onclick = function (e) { if (e.target === a) a.remove(); };
    a.innerHTML = '<div style="background:#14171c;color:#e8ebf0;border:1px solid #2b313b;border-radius:16px;width:min(620px,100%);max-height:100%;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;text-align:left">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:17px">📜 Başarı belgeleri</b><button class="yz-btn" onclick="document.getElementById(\'yzb-pencere\').remove()">✕</button></div>'
        + '<div style="font-size:13px;color:#8f98a7">' + esc(v.baslik) + ' · ' + yzbAy(v.tarih) + ' · ilk 3 madalyalı, diğerleri katılım ve başarı. Fotoğraf yoksa baş harfler.</div>'
        + '<button class="yz-btn ana" onclick="yzBelgePdf()">🖨 Hepsini PDF (' + v.l.length + ' sayfa)</button>'
        + '<div>' + v.l.map(function (s, i) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #2b313b"><b style="width:30px;color:' + (['#d4a017', '#9aa5b1', '#b0652c'][s.sira - 1] || '#8f98a7') + '">' + s.sira + '.</b><span style="flex:1;min-width:0">' + esc(s.ad) + ' <small style="color:#8f98a7">' + s.toplam + ' puan</small></span>'
                + '<button class="yz-btn" onclick="yzBelgeGoster(' + i + ')">👁</button><button class="yz-btn" onclick="yzBelgeGonder(' + i + ')">💬</button><button class="yz-btn" onclick="yzBelgePdf(' + i + ')">📄</button></div>';
        }).join('') + '</div><div id="yzb-onizleme"></div></div>';
}
async function yzBelgeGoster(i) {
    let s = _yzb && _yzb.l[i]; if (!s) return;
    let e = document.getElementById('yzb-onizleme'); if (!e) return; e.innerHTML = '<div style="color:#8f98a7;padding:10px">Hazırlanıyor…</div>';
    let c = await yzbCiz(s, _yzb); c.style.cssText = 'width:100%;height:auto;border-radius:8px;display:block'; e.innerHTML = ''; e.appendChild(c);
    c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
async function yzBelgeGonder(i) {
    let s = _yzb && _yzb.l[i]; if (!s) return;
    let c = await yzbCiz(s, _yzb), g = String(s.k).split('|')[0], sp = turnuvaDB[g] && turnuvaDB[g][s.ad], ilk = s.ad.split(' ')[0];
    ilk = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let metin = 'Merhaba 🌟 ' + ilk + '\'in ' + yzbAy(_yzb.tarih) + ' tarihli yarışmadaki başarı belgesi 🏹 ' + (s.sira <= 3 ? YZB_DERECE[s.sira - 1].charAt(0) + YZB_DERECE[s.sira - 1].slice(1).toLocaleLowerCase('tr-TR') + ' oldu, tebrikler! 🏅' : s.toplam + ' puan, tebrikler!') + '\nDAĞ Spor Kulübü';
    if (typeof _paylas === 'function') _paylas(c, 'Basari_Belgesi_' + s.ad.replace(/\s+/g, '_') + '.png', metin, sp && sp.acilTelefon);
}
async function yzBelgePdf(tek) {
    let v = _yzb || yzbListe(); if (!v) return;
    let l = typeof tek === 'number' ? [v.l[tek]] : v.l;
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    showToast('📜 ' + l.length + ' belge hazırlanıyor…', 'warning');
    try {
        let pdf = await _yeniPdfAl('landscape');
        for (let i = 0; i < l.length; i++) { if (i) pdf.addPage(); let c = await yzbCiz(l[i], v); pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 297, 210); }
        pdf.save(l.length === 1 ? 'Basari_Belgesi_' + l[0].ad.replace(/\s+/g, '_') + '.pdf' : 'Basari_Belgeleri_' + new Date(v.tarih).toISOString().slice(0, 10) + '.pdf');
        showToast('📜 Belge PDF indirildi', 'success');
    } catch (e) { showToast('Belgeler hazırlanamadı.', 'error'); }
}

// ---------------------------------------------------------------- 🏆 kulüp ligi (tek lig, 2026-10-22)
// Kullanıcı iki lig olmasın, "ikisini birleştir" dedi: HESAP Karışık Sınıf'taki Dönem ligi (dagsk-km-gelisim.js glLigTablo —
// dönem, lig günü takvimi, tur bazında "lige sayılsın", kategori grup × yay, antrenman günü +1, dönem kupa töreni), GÖRÜNÜM bu
// tam ekran fotoğraflı tablo. Yarışma'da kurulumdaki "🏆 Kulüp ligine sayılsın" işareti arşive lig:true yazar; glLigTurlari onu da sayar.
let _yzl = { kat: null };
function yzlYukle() {
    let l = [];
    if (typeof glLigTablo !== 'function') l.push(dagskEkYukle('dagsk-km-gelisim.js'));
    if (typeof yzArsivCek !== 'function') l.push(dagskEkYukle('dagsk-km-yarisma-pro.js'));
    return Promise.all(l);
}
function yzLigAc() {
    let a = document.getElementById('yzl-ekran'); if (!a) { a = document.createElement('div'); a.id = 'yzl-ekran'; document.body.appendChild(a); }
    yzlCss(); a.innerHTML = '<div class="ic"><div class="bos">Yükleniyor…</div></div>';
    yzlYukle().then(function () {
        yzLigCiz();
        try { kyDepoSenkron('kulup_lig', function () { return kyDepoOku('kulup_lig'); }, false).then(function () { if (document.getElementById('yzl-ekran')) yzLigCiz(); }).catch(function () {}); } catch (e) {}
        try { yzArsivCek(function () { if (document.getElementById('yzl-ekran')) yzLigCiz(); }); } catch (e) {}
    }).catch(function () { a.innerHTML = '<div class="ic"><div class="bos">Lig yüklenemedi — bağlantıyı kontrol et. <button onclick="yzLigKapat()">Kapat</button></div></div>'; });
}
function yzlCss() {
    if (document.getElementById('yzl-css')) return;
    let s = document.createElement('style'); s.id = 'yzl-css';
    s.textContent = '#yzl-ekran{position:fixed;inset:0;z-index:30500;background:#f6f1e6;color:#17130d;overflow-y:auto;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
        + '#yzl-ekran .ic{max-width:1200px;margin:0 auto;padding:22px clamp(12px,3vw,32px) 40px}'
        + '#yzl-ekran .bas{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;border-left:5px solid #e03e36;padding-left:14px;margin-bottom:14px}'
        + '#yzl-ekran .bas small{display:block;color:#e03e36;font-weight:900;letter-spacing:.2em;font-size:13px}#yzl-ekran .bas h2{margin:2px 0;font-size:clamp(24px,3.4vw,40px);letter-spacing:.04em}#yzl-ekran .bas span{color:#7c7466;font-size:14px}'
        + '#yzl-ekran .dug{display:flex;gap:6px;flex-wrap:wrap}#yzl-ekran button{font:inherit;font-weight:800;font-size:14px;padding:8px 14px;border-radius:10px;border:2px solid #17130d;background:#fffdf8;color:#17130d;cursor:pointer;transform:none!important}'
        + '#yzl-ekran button.ana{background:#17130d;color:#f6f1e6}#yzl-ekran .sek{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}#yzl-ekran .sek button{border-radius:99px;padding:6px 14px}#yzl-ekran .sek button[aria-pressed=true]{background:#17130d;color:#f6f1e6}'
        + '#yzl-ekran table{width:100%;border-collapse:collapse;background:#fffdf8;border:2px solid #17130d;border-radius:12px;overflow:hidden}'
        + '#yzl-ekran th{font:700 12px ui-monospace,Consolas,monospace;letter-spacing:.08em;text-align:left;padding:9px 10px;border-bottom:2px solid #17130d}'
        + '#yzl-ekran td{padding:8px 10px;border-bottom:1px solid #e7dfcf;font-weight:800;font-size:clamp(15px,1.6vw,20px);vertical-align:middle}'
        + '#yzl-ekran td.s{font-size:clamp(18px,2vw,26px);width:44px}#yzl-ekran td.n{text-align:center}#yzl-ekran td.top{text-align:right;font-size:clamp(20px,2.2vw,30px)}'
        + '#yzl-ekran .adk{display:flex;align-items:center;gap:10px}#yzl-ekran .av{width:40px;height:40px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:14px;color:#7c7466;background:#efe7d6 center/cover no-repeat;border:3px solid #e7dfcf}'
        + '#yzl-ekran tr.p1 td.s{color:#d4a017}#yzl-ekran tr.p2 td.s{color:#8a96a3}#yzl-ekran tr.p3 td.s{color:#b0652c}#yzl-ekran tr.p1 .av{border-color:#d4a017}'
        + '#yzl-ekran .tur{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#efe7d6;font-size:12px;font-weight:900;margin:1px 3px 1px 0}'
        + '#yzl-ekran .tur.a{background:#f4c430}#yzl-ekran .tur.g{background:#cfd6df}#yzl-ekran .tur.b{background:#e2a874}#yzl-ekran .tur.y{background:transparent;color:#c9bfae}'
        + '#yzl-ekran .not{font-size:13px;color:#7c7466;margin-top:10px;line-height:1.5}#yzl-ekran .bos{padding:30px;text-align:center;color:#7c7466;font-size:15px}'
        + '#yzl-ekran .turlar{margin-top:16px}#yzl-ekran .turlar div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #e7dfcf;font-size:14px}'
        + '@media (max-width:640px){#yzl-ekran td:nth-child(3){display:none}#yzl-ekran th:nth-child(3){display:none}}';
    document.head.appendChild(s);
}
function yzLigCiz() {
    let a = document.getElementById('yzl-ekran'); if (!a || typeof glLigTablo !== 'function') return;
    let ayar = glLigAyar(), turlar = glLigTurlari().filter(function (t) { return t.say; }), sonuc = glLigTablo(), tablo = sonuc.tablo;
    let kats = Object.keys(tablo).sort(function (x, y) { return GL_GRUPLAR.indexOf(y.split('|')[0]) - GL_GRUPLAR.indexOf(x.split('|')[0]) || x.localeCompare(y); });
    if (!_yzl.kat || !tablo[_yzl.kat]) _yzl.kat = kats[0] || null;
    let liste = _yzl.kat ? Object.values(tablo[_yzl.kat]).sort(function (x, y) { return y.puan - x.puan || x.enIyi - y.enIyi; }) : [];
    let devam = ayar.devamPuani !== false;
    let foto = function (g, ad) { let s = typeof fotoSrc === 'function' ? fotoSrc('s:' + g + '|' + ad, false) : ''; return '<span class="av"' + (s ? ' style="background-image:url(\'' + s + '\')"' : '') + '>' + (s ? '' : esc(String(ad).trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join(''))) + '</span>'; };
    let tablo_ = liste.length ? '<table><thead><tr><th>#</th><th>SPORCU</th><th>LİG TURLARI</th><th style="text-align:center">KATILIM</th>' + (devam ? '<th style="text-align:center">ANTRENMAN</th>' : '') + '<th style="text-align:right">PUAN</th></tr></thead><tbody>' + liste.map(function (x, i) {
        let yer = {}; (x.son || []).forEach(function (s) { yer[s.ti] = s.sira; });
        let kare = turlar.map(function (t, ti) { let y = yer[ti]; return '<span class="tur ' + (!y ? 'y' : y === 1 ? 'a' : y === 2 ? 'g' : y === 3 ? 'b' : '') + '" title="' + glTarihYaz(t.tarih) + '">' + (y || '–') + '</span>'; }).join('');
        return '<tr class="p' + (i + 1) + '"><td class="s">' + (i + 1) + '</td><td><span class="adk">' + foto(x.g, x.ad) + esc(x.ad) + '</span></td><td>' + kare + '</td><td class="n">' + (x.katilim || 0) + '/' + turlar.length + '</td>' + (devam ? '<td class="n">' + (x.devam || 0) + ' gün</td>' : '') + '<td class="top">' + x.puan + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="bos">Bu dönem henüz puan yok.<br>Lig gününde Yarışma › Sıralama Turu at (ya da kurulumda <b>🏆 Kulüp ligine sayılsın</b> işaretle) — sonuç buraya kendiliğinden işlenir.</div>';
    let turListe = turlar.length ? '<div class="turlar"><b>Lige sayılan turlar</b>' + turlar.slice().reverse().map(function (t) { return '<div><span>' + glTarihYaz(t.tarih) + ' · ' + esc(t.mesafe || '') + ' · ' + (t.sporcular || []).length + ' sporcu' + (t.otomatik ? ' · lig günü' : '') + '</span><button onclick="yzLigTurDegistir(\'' + encodeURIComponent(t.id) + '\', false)">Ligden çıkar</button></div>'; }).join('') + '</div>' : '';
    a.innerHTML = '<div class="ic"><div class="bas"><div><small>DAĞ S.K.</small><h2>KULÜP LİGİ · ' + esc(glDonemAd(ayar)).toLocaleUpperCase('tr-TR') + '</h2><span>' + turlar.length + ' lig turu · ' + glTarihYaz(ayar.sezonBas) + ' – ' + glTarihYaz(ayar.sezonBit) + '</span></div>'
        + '<div class="dug"><button onclick="glDonemSec(\'simdi\'); yzLigCiz()">Bu dönem</button><button onclick="glDonemSec(\'guz\'); yzLigCiz()">Güz</button><button onclick="glDonemSec(\'bahar\'); yzLigCiz()">Bahar</button>'
        + (liste.length ? '<button class="ana" onclick="yzLigToren()">🏅 Dönem kupa töreni</button>' : '') + '<button onclick="yzLigTamEkran()">📺 Tam ekran</button><button onclick="yzLigKapat()">✕ Kapat</button></div></div>'
        + (kats.length > 1 ? '<div class="sek">' + kats.map(function (k) { return '<button aria-pressed="' + (k === _yzl.kat) + '" onclick="_yzl.kat=\'' + k + '\'; yzLigCiz()">' + esc(glKategoriAd(k)) + '</button>'; }).join('') + '</div>' : '')
        + tablo_
        + '<div class="not">Puan: her lig turunda kendi kategorisinde (grup × yay) 1.=25 · 2.=18 · 3.=15 · 4.=12 · 5.=10 · 6.=8 · 7.=6 · 8.=4 · 9.=2 · 10.=1, her katılım +2' + (devam ? ', antrenmana gelinen her gün +1' : '') + '. Kareler her turdaki yeri gösterir (sarı 1. · gri 2. · bronz 3. · – katılmadı). Lig günleri, dönem ve antrenman puanı: Karışık Sınıf › Kulüp Ligi.</div>'
        + turListe + '</div>';
}
function yzLigKapat() { let a = document.getElementById('yzl-ekran'); if (a) a.remove(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} }
function yzLigTamEkran() { let a = document.getElementById('yzl-ekran'); try { if (a && a.requestFullscreen) a.requestFullscreen(); } catch (e) {} }
// bir turu lige ekle / çıkar — Dönem liginin kendi kaydı (kulup_lig "tur|id"), tüm cihazlarda
function yzLigTurDegistir(idEnc, say) {
    let id = decodeURIComponent(idEnc);
    yzlYukle().then(function () { glLigYaz('tur|' + id, { say: !!say }); showToast(say ? '🏆 Tur lige eklendi' : 'Tur ligden çıkarıldı', 'success'); if (document.getElementById('yzl-ekran')) yzLigCiz(); });
}
function yzLigToren() { yzLigKapat(); glDonemToreni(); }

// ---------------------------------------------------------------- 📋 resmi skor kağıdı (hedef başına bir A4)
async function yzSkorKagitlariPdf() {
    let o = yzOku(), d = o.durum; if (!d || !d.katilimci || !d.katilimci.length) return showToast('Önce turu başlat.', 'warning');
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    let f = yzFormat(d), h = d.hedefler || {}, gr = {};
    yzHedefSirasi(o).forEach(function (k) { let no = String(h[k] || '?').replace(/[A-D]$/, ''); (gr[no] = gr[no] || []).push(k); });
    let nolar = Object.keys(gr).sort(function (a, b) { return (+a) - (+b); });
    showToast('📋 ' + nolar.length + ' skor kâğıdı hazırlanıyor…', 'warning');
    try {
        let pdf = await _yeniPdfAl('portrait'), W = 210, M = 10;
        nolar.forEach(function (no, pi) {
            if (pi) pdf.addPage();
            pdf.setTextColor(17, 17, 17); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
            pdf.text('DAĞ S.K. · SIRALAMA TURU', M, 16);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(85, 85, 85);
            pdf.text(new Date(d.basla).toLocaleDateString('tr-TR') + ' · ' + d.ayar.mesafe + ' · ' + f.seri + ' seri × ' + f.ok + ' ok · ' + (f.seri * f.ok) + ' ok', M, 21.5);
            pdf.setDrawColor(17, 17, 17); pdf.setLineWidth(0.8); pdf.roundedRect(W - M - 34, 8, 34, 15, 2, 2);
            pdf.setTextColor(17, 17, 17); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text('HEDEF ' + no, W - M - 17, 18.3, { align: 'center' });
            pdf.setLineWidth(0.6); pdf.line(M, 25, W - M, 25);
            let kisi = gr[no], kolon = kisi.length > 1 ? 2 : 1, satir = Math.ceil(kisi.length / kolon);
            let kw = (W - 2 * M - (kolon - 1) * 6) / kolon, kh = (297 - 30 - 8 - (satir - 1) * 6) / satir;
            kisi.forEach(function (k, ki) {
                let x0 = M + (ki % kolon) * (kw + 6), y0 = 30 + Math.floor(ki / kolon) * (kh + 6);
                let g = String(k).split('|')[0], sp = turnuvaDB[g] && turnuvaDB[g][yzKAd(k)];
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5); pdf.setTextColor(17, 17, 17);
                pdf.text('Atıcı: ' + yzKAd(k), x0, y0 + 3.5, { maxWidth: kw * 0.62 });
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
                pdf.text([h[k] || '', (typeof LIG_ETIKET_KISA_AIDAT !== 'undefined' && LIG_ETIKET_KISA_AIDAT[g]) || '', (sp && sp.yay) || ''].filter(Boolean).join(' · '), x0 + kw, y0 + 3.5, { align: 'right' });
                // tablo: Seri | ok×n | Seri top | Toplam | 10+X | X
                let sabit = [9, 11, 13, 9, 7], okw = (kw - sabit.reduce(function (a, b) { return a + b; }, 0)) / f.ok;
                let cols = [sabit[0]].concat(Array(f.ok).fill(okw), sabit.slice(1));
                let basliklar = ['Seri'].concat(Array.from({ length: f.ok }, function (_, i) { return String(i + 1); }), ['Seri', 'Toplam', '10+X', 'X']);
                let rows = f.seri + 1 + (f.yari ? 1 : 0) + 1, rh = Math.min(9, (kh - 6 - 14) / rows), ty = y0 + 6;
                let hucre = function (cx, cy, w, hh, metin, dolgu, kalin) { if (dolgu) { pdf.setFillColor(235, 235, 235); pdf.rect(cx, cy, w, hh, 'F'); } pdf.setDrawColor(17, 17, 17); pdf.setLineWidth(kalin ? 0.5 : 0.25); pdf.rect(cx, cy, w, hh); if (metin) { pdf.setFont('helvetica', dolgu || kalin ? 'bold' : 'normal'); pdf.setFontSize(Math.min(9, rh * 1.6)); pdf.text(String(metin), cx + w / 2, cy + hh / 2 + 1.2, { align: 'center' }); } };
                let cx = x0; basliklar.forEach(function (b, i) { hucre(cx, ty, cols[i], rh, b, true); cx += cols[i]; }); ty += rh;
                for (let s = 1; s <= f.seri; s++) {
                    cx = x0; cols.forEach(function (w, i) { hucre(cx, ty, w, rh, i === 0 ? String(s) : '', i === 0); cx += w; }); ty += rh;
                    if (f.yari && s === f.yari) { let sol = cols.slice(0, f.ok + 2).reduce(function (a, b) { return a + b; }, 0); hucre(x0, ty, sol, rh, '1. yarı', true); cx = x0 + sol; cols.slice(f.ok + 2).forEach(function (w) { hucre(cx, ty, w, rh, '', false, true); cx += w; }); ty += rh; }
                }
                let sol = cols.slice(0, f.ok + 2).reduce(function (a, b) { return a + b; }, 0);
                hucre(x0, ty, sol, rh, f.yari ? '2. yarı / GENEL' : 'GENEL TOPLAM', true); cx = x0 + sol; cols.slice(f.ok + 2).forEach(function (w) { hucre(cx, ty, w, rh, '', false, true); cx += w; }); ty += rh;
                // imzalar
                pdf.setLineWidth(0.3); let iy = Math.min(y0 + kh - 2, ty + 12);
                pdf.line(x0, iy, x0 + kw * 0.46, iy); pdf.line(x0 + kw * 0.54, iy, x0 + kw, iy);
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.text('Atıcı imzası', x0 + kw * 0.23, iy + 3.5, { align: 'center' }); pdf.text('Yazıcı imzası', x0 + kw * 0.77, iy + 3.5, { align: 'center' });
            });
        });
        pdf.save('Skor_Kagitlari_' + new Date(d.basla).toISOString().slice(0, 10) + '.pdf');
        showToast('📋 Skor kâğıtları indirildi', 'success');
    } catch (e) { showToast('Skor kâğıtları hazırlanamadı.', 'error'); }
}
