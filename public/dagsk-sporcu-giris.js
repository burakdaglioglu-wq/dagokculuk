/* ================================================================================================
   🔑 SPORCU GİRİŞLERİ (2026-10-25). Kullanıcı: "yönetici panelinde bir sistem yapmam gerek, sporcuların girişlerini
   ayarlamam lazım". Yönetici → 🔑 Sporcu Girişleri:
   - Toplu kod listesi: kodu olmayan / doğum yılıyla girenler işaretli; tek tek ya da toplu 🎲 4 haneli kod üretilir.
   - Giriş aç / kapat: kapalıysa sunucu girişi reddeder, telefondaki oturum kapanır (src/routes/sporcuGiris.ts).
   - Giriş bilgisini gönder: veliye WhatsApp (api.whatsapp.com/send — wa.me emoji bozuyor) ya da QR'lı giriş kartları (yazdır).
   - Kim ne zaman girdi: uygulama her sporcu girişinden sonra POST /api/sporcu-giris → son giriş + giriş sayısı.
   Giriş linki ?sg=AD&sk=KOD → telefonda doğrudan sporcu girişi (beni hatırla açık).
   ================================================================================================ */
const SG = { liste: null, filtre: 'hepsi', ara: '', grup: '__hepsi', yukleniyor: false, hata: null };
const SG_GRUPLAR = [['buyukler', 'Büyükler'], ['yildizlar', 'Yıldızlar'], ['kucukler', 'Küçükler'], ['minikler', 'Minikler']];

function sgCss() {
    if (document.getElementById('sg-css')) return;
    let s = document.createElement('style'); s.id = 'sg-css';
    s.textContent = `
.sg{display:flex;flex-direction:column;gap:12px;color:var(--text-main)}
.sg-ozet{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.sg-ozet button{font:inherit;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);cursor:pointer;transform:none!important}
.sg-ozet button[aria-pressed=true]{border-color:var(--accent-orange);box-shadow:inset 0 0 0 1px var(--accent-orange)}
.sg-ozet b{display:block;font-size:22px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}.sg-ozet small{font-size:11.5px;color:var(--text-muted);font-weight:700}
.sg-arac{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sg-arac input,.sg-arac select{font:inherit;font-size:14px;padding:9px 11px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);min-width:0}
.sg-arac input{flex:1 1 180px}
.sg-btn{font:inherit;font-weight:700;font-size:13px;padding:8px 11px;border-radius:9px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);cursor:pointer;white-space:nowrap;transform:none!important}
.sg-btn:hover{border-color:var(--text-muted)}.sg-btn.ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#fff}
.sg-satir{display:grid;grid-template-columns:minmax(0,1.6fr) 120px minmax(0,1.1fr) 120px auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-panel)}
.sg-satir.kapali{opacity:.62}
.sg-ad b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sg-ad small,.sg-son small{display:block;font-size:12px;color:var(--text-muted)}
.sg-kod{font-variant-numeric:tabular-nums;font-weight:800;font-size:16px;letter-spacing:.06em}
.sg-rozet{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:0;padding:2px 6px;border-radius:6px;margin-left:4px;vertical-align:2px;background:rgba(245,158,11,.18);color:#f59e0b}
.sg-rozet.yok{background:rgba(239,68,68,.16);color:#ef4444}
.sg-son b{font-size:13px}.sg-son b.hic{color:#ef4444}.sg-son b.yeni{color:#22c55e}
.sg-anahtar{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;cursor:pointer;user-select:none}
.sg-anahtar input{width:40px;height:22px;appearance:none;-webkit-appearance:none;border-radius:999px;background:#ef4444;position:relative;cursor:pointer;flex-shrink:0;margin:0}
.sg-anahtar input::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}
.sg-anahtar input:checked{background:#22c55e}.sg-anahtar input:checked::after{left:21px}
.sg-eylem{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
.sg-bos{padding:28px;text-align:center;color:var(--text-muted)}
.sg-not{font-size:12.5px;color:var(--text-muted);line-height:1.5}
@media (max-width:760px){
 .sg-ozet{grid-template-columns:repeat(2,minmax(0,1fr))}.sg-ozet button:first-child{grid-column:1/-1}
 .sg-satir{grid-template-columns:minmax(0,1fr) auto;row-gap:8px}
 .sg-ad{grid-column:1/-1}.sg-eylem{grid-column:1/-1;justify-content:flex-start}
}`;
    document.head.appendChild(s);
}

function sgKodZayif(sp) { let k = String(sp.kod || '').trim(); return !k ? (sp.dogumYili ? 'dogum' : 'yok') : (sp.dogumYili && k === String(sp.dogumYili) ? 'dogum' : null); }
function sgKod(sp) { return String(sp.kod || sp.dogumYili || '').trim(); }
function sgLink(ad, sp) { return location.origin + '/app.html?sg=' + encodeURIComponent(ad) + '&sk=' + encodeURIComponent(sgKod(sp)); }
function sgSure(t) {
    if (!t) return null;
    let d = Math.floor((Date.now() - t) / 60000);
    if (d < 60) return d <= 1 ? 'az önce' : d + ' dk önce';
    if (d < 1440) return Math.floor(d / 60) + ' saat önce';
    let g = Math.floor(d / 1440); return g === 1 ? 'dün' : g + ' gün önce';
}
function sgSporcular() {
    let r = [];
    SG_GRUPLAR.forEach(([g, gAd]) => Object.keys((typeof turnuvaDB !== 'undefined' && turnuvaDB[g]) || {}).forEach(ad => {
        let sp = turnuvaDB[g][ad]; if (!sp || sp.pasif) return;
        try { if (typeof kisiTuru === 'function' && kisiTuru(g, ad) !== 'sporcu') return; } catch (e) {}
        let b = (SG.liste || {})[g + '|' + ad] || {};
        r.push({ g, gAd, ad, sp, k: g + '|' + ad, kapali: !!b.kapali, son: b.son || null, sayi: b.sayi || 0, zayif: sgKodZayif(sp) });
    }));
    return r.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

function sgYukle() {
    SG.yukleniyor = true; SG.hata = null;
    return fetch('/api/sporcu-girisler').then(r => r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? 'oturum gerekli' : 'sunucu'))).then(d => { SG.liste = d.liste || {}; })
        .catch(e => { SG.hata = e.message; if (!SG.liste) SG.liste = {}; }).finally(() => { SG.yukleniyor = false; });
}
function sgAc() { sgCss(); sgCiz(); sgYukle().then(() => { if (yoneticiSekmeAktif === 'girisler') sgCiz(); }); }

function sgCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    sgCss();
    let tum = sgSporcular(), hafta = Date.now() - 7 * 864e5;
    let say = { hepsi: tum.length, hic: tum.filter(x => !x.son).length, hafta: tum.filter(x => x.son && x.son >= hafta).length, zayif: tum.filter(x => x.zayif).length, kapali: tum.filter(x => x.kapali).length };
    let l = tum.filter(x => (SG.grup === '__hepsi' || x.g === SG.grup)
        && (SG.filtre === 'hepsi' || (SG.filtre === 'hic' && !x.son) || (SG.filtre === 'hafta' && x.son && x.son >= hafta) || (SG.filtre === 'zayif' && x.zayif) || (SG.filtre === 'kapali' && x.kapali)));
    let kart = (id, n, et) => `<button aria-pressed="${SG.filtre === id}" onclick="SG.filtre='${id}';sgCiz()"><b>${n}</b><small>${et}</small></button>`;
    let ust = `<div class="sg-ozet">${kart('hepsi', say.hepsi, 'Aktif sporcu')}${kart('hafta', say.hafta, 'Son 7 günde girdi')}${kart('hic', say.hic, 'Hiç girmedi')}${kart('zayif', say.zayif, 'Kodu yok / doğum yılı')}${kart('kapali', say.kapali, 'Girişi kapalı')}</div>
        <div class="sg-arac"><input type="search" placeholder="🔍 Sporcu ara" value="${esc(SG.ara)}" oninput="SG.ara=this.value;sgListeCiz()" aria-label="Sporcu ara">
        <select onchange="SG.grup=this.value;sgCiz()" aria-label="Grup"><option value="__hepsi">Tüm gruplar</option>${SG_GRUPLAR.map(([g, a]) => `<option value="${g}"${SG.grup === g ? ' selected' : ''}>${a}</option>`).join('')}</select>
        <button class="sg-btn" onclick="sgTopluKod()" ${say.zayif ? '' : 'disabled'}>🎲 Zayıf kodlara yeni kod (${say.zayif})</button>
        <button class="sg-btn" onclick="sgKartlarYazdir()">🖨 Listedekilerin giriş kartları</button></div>
        ${SG.hata ? `<div class="sg-not" style="color:#ef4444">⚠️ Giriş kayıtları alınamadı (${esc(SG.hata)}). Kodlar yine de düzenlenebilir.</div>` : ''}
        <div class="sg-not">"Son giriş" bu sürümden sonra yapılan girişleri gösterir. Kod değişince sporcunun telefonundaki kayıtlı giriş ve eski giriş linki çalışmaz — yeni bilgiyi 📤 ile gönder.</div>
        <div id="sg-liste"></div>`;
    alan.innerHTML = '<div class="sg">' + ust + '</div>';
    SG._l = l; sgListeCiz();
}
function sgGorunen() {
    let n = typeof turkceNormalize === 'function' ? turkceNormalize : (t => String(t || '').toLowerCase()), q = n(SG.ara);
    return (SG._l || []).filter(x => !q || n(x.ad).includes(q));
}
function sgListeCiz() {
    let el = document.getElementById('sg-liste'); if (!el) return;
    let l = sgGorunen();
    if (SG.yukleniyor && !SG.liste) { el.innerHTML = '<div class="sg-bos">Yükleniyor…</div>'; return; }
    if (!l.length) { el.innerHTML = '<div class="sg-bos">Bu süzgeçte sporcu yok.</div>'; return; }
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px">' + l.map(x => {
        let a = esc(JSON.stringify(x.k)), kod = sgKod(x.sp), sure = sgSure(x.son), yeni = x.son && Date.now() - x.son < 7 * 864e5;
        return `<div class="sg-satir${x.kapali ? ' kapali' : ''}">
            <div class="sg-ad"><b>${esc(x.ad)}</b><small>${esc(x.gAd)}${x.sp.acilTelefon ? ' · 📞 veli' : ''}</small></div>
            <div><span class="sg-kod">${kod ? esc(kod) : '—'}</span>${x.zayif === 'yok' ? '<span class="sg-rozet yok">KOD YOK</span>' : x.zayif === 'dogum' ? '<span class="sg-rozet">doğum yılı</span>' : ''}</div>
            <div class="sg-son">${sure ? `<b class="${yeni ? 'yeni' : ''}">${sure}</b><small>${x.sayi} giriş</small>` : '<b class="hic">Hiç girmedi</b>'}</div>
            <label class="sg-anahtar"><input type="checkbox" ${x.kapali ? '' : 'checked'} onchange="sgKapaliYaz(${a}, !this.checked)" aria-label="${esc(x.ad)} girişi">${x.kapali ? 'Kapalı' : 'Açık'}</label>
            <div class="sg-eylem"><button class="sg-btn" onclick="sgKodDegistir(${a})">✏️ Kod</button><button class="sg-btn" onclick="sgKodUret(${a})" title="Rastgele 4 haneli kod">🎲</button><button class="sg-btn" onclick="sgGonder(${a})" ${kod ? '' : 'disabled'}>📤 Gönder</button><button class="sg-btn" onclick="sgLinkKopyala(${a})" ${kod ? '' : 'disabled'} title="Giriş linkini kopyala">🔗</button></div>
        </div>`;
    }).join('') + '</div>';
}

function sgBul(k) { let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1); let sp = turnuvaDB[g] && turnuvaDB[g][ad]; return sp ? { g, ad, sp } : null; }
function sgYeniKod(haric) {
    let kul = new Set(); SG_GRUPLAR.forEach(([g]) => Object.values(turnuvaDB[g] || {}).forEach(sp => { if (sp && sp.kod) kul.add(String(sp.kod)); }));
    (haric || []).forEach(k => kul.add(k));
    for (let i = 0; i < 200; i++) { let k = String(1000 + Math.floor(Math.random() * 9000)); if (!kul.has(k) && !/^(19|20)\d\d$/.test(k)) return k; } // doğum yılına benzemesin
    return String(10000 + Math.floor(Math.random() * 90000));
}
function sgKodYaz(b, kod) {
    b.sp.kod = kod; b.sp.lastModified = Date.now();
    try { yoneticiKaydet(); } catch (e) {}
    try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
}
function sgKodDegistir(k) {
    let b = sgBul(k); if (!b) return;
    girdiIste(`🔑 <b>${esc(b.ad)}</b> için giriş kodu:`, b.sp.kod || '', yeni => {
        if (yeni === null) return; yeni = String(yeni).trim();
        if (!/^[0-9A-Za-z]{3,12}$/.test(yeni)) return showToast('Kod 3–12 harf/rakam olmalı.', 'error');
        sgKodYaz(b, yeni); showToast('🔑 ' + b.ad + ': yeni kod ' + yeni, 'success'); sgCiz();
    });
}
function sgKodUret(k) {
    let b = sgBul(k); if (!b) return;
    let yeni = sgYeniKod();
    onayIste(`<b>${esc(b.ad)}</b> için yeni kod: <b style="font-size:20px;letter-spacing:.08em">${yeni}</b><br><small>Eski kod ve eski giriş linki çalışmaz olur.</small>`, () => { sgKodYaz(b, yeni); showToast('🔑 ' + b.ad + ': ' + yeni, 'success'); sgCiz(); }, 'Kaydet', 'Vazgeç');
}
function sgTopluKod() {
    let l = sgSporcular().filter(x => x.zayif); if (!l.length) return;
    onayIste(`<b>${l.length} sporcuya</b> rastgele 4 haneli kod verilsin mi?<br><small>Kodu olmayan ya da doğum yılıyla girenler. Sonra 📤 ile velilere gönderebilirsin; kayıtlı girişleri tekrar ister.</small>`, () => {
        let ver = [];
        l.forEach(x => { let k = sgYeniKod(ver); ver.push(k); x.sp.kod = k; x.sp.lastModified = Date.now(); });
        try { yoneticiKaydet(); } catch (e) {}
        try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
        SG.filtre = 'hepsi'; showToast('🎲 ' + l.length + ' sporcuya yeni kod verildi', 'success'); sgCiz();
    }, '🎲 Kod ver', 'Vazgeç');
}
function sgKapaliYaz(k, kapali) {
    let b = sgBul(k); if (!b) return;
    fetch('/api/sporcu-giris/' + encodeURIComponent(k), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kapali }) })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? 'oturum gerekli' : 'kaydedilemedi')))
        .then(() => { SG.liste = SG.liste || {}; SG.liste[k] = Object.assign({}, SG.liste[k] || {}, { kapali }); showToast(kapali ? '⛔ ' + b.ad + ' artık giriş yapamaz' : '✓ ' + b.ad + ' girişi açık', kapali ? 'warning' : 'success'); sgCiz(); })
        .catch(e => { showToast('Değiştirilemedi: ' + e.message, 'error'); sgCiz(); });
}
function sgMesaj(ad, sp) {
    return `Merhaba 👋\n${ad} için DAĞ Spor Kulübü uygulamasının giriş bilgileri:\n\n👉 ${sgLink(ad, sp)}\n(Linke dokununca doğrudan giriş yapılır.)\n\n📲 Uygulama olarak kurmak için (ücretsiz, mağaza gerekmez, internetsiz de açılır):\n• iPhone: linki Safari'de aç → Paylaş ⬆️ → "Ana Ekrana Ekle"\n• Android: linki Chrome'da aç → ⋮ → "Uygulamayı yükle"\n\nElle giriş: Sporcu Girişi → Ad: ${ad} · Kod: ${sgKod(sp)}\n\nSkorlarını, yarışmalarını ve gelişimini buradan takip edebilir; profil fotoğrafını kendisi değiştirebilir. 🎯`;
}
function sgGonder(k) {
    let b = sgBul(k); if (!b || !sgKod(b.sp)) return;
    let no = typeof telefonWaFormat === 'function' ? telefonWaFormat(b.sp.acilTelefon || '') : '';
    window.open((no ? 'https://api.whatsapp.com/send?phone=' + no + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(sgMesaj(b.ad, b.sp)), '_blank');
}
function sgLinkKopyala(k) {
    let b = sgBul(k); if (!b) return;
    let t = sgMesaj(b.ad, b.sp);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => showToast('📋 Giriş mesajı kopyalandı', 'success')).catch(() => girdiIste('Kopyala:', sgLink(b.ad, b.sp), () => {}));
}
// 🖨 QR'lı giriş kartları: A4'e 8 kart, kesip dağıtılır. QR = giriş linki.
function sgKartlarYazdir() {
    let l = sgGorunen().filter(x => sgKod(x.sp)); if (!l.length) return showToast('Listede kodu olan sporcu yok.', 'warning');
    let qr = u => 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=' + encodeURIComponent(u);
    let kartlar = l.map(x => `<div class="k"><img src="${qr(sgLink(x.ad, x.sp))}" alt=""><div><b>${esc(x.ad)}</b><span>${esc(x.gAd)}</span><p>Kod: <strong>${esc(sgKod(x.sp))}</strong></p><small>Telefon kamerasıyla QR'ı okut → uygulama açılır, giriş yapılır.<br>Elle: Sporcu Girişi → adın + kodun</small></div></div>`).join('');
    let html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Giriş kartları</title><style>
@page{size:A4;margin:10mm}body{margin:0;font-family:system-ui,"Segoe UI",Roboto,sans-serif;color:#111}
.s{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.k{display:flex;gap:4mm;align-items:center;border:1px dashed #999;border-radius:4mm;padding:4mm;break-inside:avoid;height:52mm;box-sizing:border-box}
.k img{width:38mm;height:38mm}.k b{display:block;font-size:13pt}.k span{font-size:9pt;color:#555}.k p{margin:2mm 0;font-size:12pt}.k strong{font-size:16pt;letter-spacing:.08em}.k small{font-size:7.5pt;color:#555;line-height:1.35}
h1{font-size:12pt;margin:0 0 4mm}</style></head><body><h1>DAĞ SK · Uygulama giriş kartları</h1><div class="s">${kartlar}</div>
<script>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))).then(()=>setTimeout(()=>print(),200))<\/script></body></html>`;
    let f = document.getElementById('sg-yazdir'); if (f) f.remove();
    f = document.createElement('iframe'); f.id = 'sg-yazdir'; f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
    showToast('🖨 ' + l.length + ' giriş kartı yazdırılıyor…', 'info');
}
