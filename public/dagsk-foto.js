/* 📷 Profil fotoğrafları (2026-10-21). Kullanıcı: "fotoğraflarını koyabileceği profil fotoğrafları gibisinden de yap, oyunlarda
   da kullanalım, kim attı gibi". Sunucu: migrations/0044_fotolar.sql + src/routes/fotolar.ts.
   - Fotoğraf sporcu kaydında DEĞİL: GET /api/fotolar küçük bir sürüm + izin listesi verir, görsel /api/foto/:anahtar?v=t adresinden
     tarayıcı önbelleğine alınır (eskiden base64 her sporcu listesiyle iniyordu → senkron şişiyordu).
   - anahtar: 's:grup|ad' sporcu, 'p:<id>' eğitmen. izin 1 = veli izni var → TV, Karışık Sınıf, oyunlar (girişsiz ekranlar) görür.
     İzin yoksa / bilinmiyorsa görsel yalnız yönetici ekranında (oturumla çekilip blob adresiyle) görünür.
   - Eski kod sp.fotoUrl okuyor (oyunlar, Karışık Sınıf): _fotoSporcuyaYaz() oraya izinli fotoğrafın ADRESİNİ yazar.
   - Avatarlar data-foto-k="anahtar" taşır; liste/izin değişince fotoDegisti() yeniden çizmeden yerinde günceller. */
let _fotoListe = (function () { try { return JSON.parse(localStorage.getItem('dag_fotolar') || '{}') || {}; } catch (e) { return {}; } })();
let _fotoBlob = {}, _fotoCekim = null, _fotoSonCekim = 0;
function fotoAnahtar(g, ad) { return 's:' + g + '|' + ad; }
function fotoBilgi(k) { return _fotoListe[k] || null; }
function fotoIzinAd(i) { return i === 1 ? 'Var' : i === 0 ? 'Yok' : 'Bilinmiyor'; }
// görüntü adresi — yonetici=true: izinsiz fotoğraf da (oturumla çekilmiş blob) döner
function fotoSrc(k, yonetici) {
    let f = _fotoListe[k]; if (!f || !f.var) return '';
    if (f.izin === 1) return '/api/foto/' + encodeURIComponent(k) + '?v=' + f.t;
    if (!yonetici) return '';
    let b = _fotoBlob[k];
    if (b && b.t === f.t) return b.url || '';
    _fotoBlob[k] = { t: f.t, url: '' };
    fetch('/api/foto/' + encodeURIComponent(k) + '?v=' + f.t).then(r => r.ok ? r.blob() : Promise.reject()).then(bl => { _fotoBlob[k] = { t: f.t, url: URL.createObjectURL(bl) }; fotoDegisti(); }).catch(() => {});
    return '';
}
function fotoStil(k, yonetici) { let s = fotoSrc(k, yonetici); return s ? "background-image:url('" + s + "');background-size:cover;background-position:center;color:transparent;" : ''; }
// avatar: fotoğraf varsa arka plan, yoksa baş harfler
function fotoAvatarHTML(k, ad, sinif, yonetici, ekStil) {
    let bas = String(ad || '?').trim().split(/\s+/).slice(0, 2).map(s => s.charAt(0)).join('').toLocaleUpperCase('tr-TR');
    return '<span class="' + sinif + '" data-foto-k="' + esc(k) + '"' + (yonetici ? ' data-foto-y="1"' : '') + ' style="' + fotoStil(k, yonetici) + (ekStil || '') + '">' + esc(bas) + '</span>';
}
function fotoDegisti() {
    document.querySelectorAll('[data-foto-k]').forEach(el => {
        let s = fotoSrc(el.getAttribute('data-foto-k'), el.hasAttribute('data-foto-y'));
        if (s) { el.style.backgroundImage = "url('" + s + "')"; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.style.color = 'transparent'; }
        else { el.style.backgroundImage = ''; el.style.color = ''; }
    });
    try { window.dispatchEvent(new Event('dag-foto')); } catch (e) {}
}
// eski kodun (oyunlar, Karışık Sınıf, kim attı) okuduğu sp.fotoUrl = izinli fotoğrafın adresi; base64 artığı temizlenir
function _fotoSporcuyaYaz() {
    if (typeof turnuvaDB === 'undefined') return;
    ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => {
        let sp = turnuvaDB[g][ad]; if (!sp) return;
        let s = fotoSrc(fotoAnahtar(g, ad), false);
        if (s) sp.fotoUrl = s; else if (sp.fotoUrl) delete sp.fotoUrl;
    }));
    // oyun listesi önbelleği (Karışık Sınıf oyunları: sırada kartı, kalabalık, vuruş kartı) fotoğraflar yüklenmeden kurulduysa
    try { if (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) _kmOyunRosterCache.forEach(r => { let sp = r && turnuvaDB[r.g] && turnuvaDB[r.g][r.ad]; if (sp) r.foto = sp.fotoUrl || null; }); } catch (e) {}
}
function fotoListeCek(zorla) {
    if (_fotoCekim) return _fotoCekim;
    if (!zorla && Date.now() - _fotoSonCekim < 60000) return Promise.resolve(_fotoListe);
    _fotoCekim = fetch('/api/fotolar').then(r => r.ok ? r.json() : Promise.reject()).then(d => {
        let yeni = d.fotolar || {}, degisti = JSON.stringify(yeni) !== JSON.stringify(_fotoListe);
        _fotoListe = yeni; _fotoSonCekim = Date.now();
        try { localStorage.setItem('dag_fotolar', JSON.stringify(_fotoListe)); } catch (e) {}
        _fotoSporcuyaYaz();
        if (degisti) fotoDegisti();
        return _fotoListe;
    }).catch(() => _fotoListe).finally(() => { _fotoCekim = null; });
    return _fotoCekim;
}
function fotoKaydet(k, govde) {
    return fetch('/api/foto/' + encodeURIComponent(k), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) })
        .then(r => r.json().catch(() => ({})).then(d => { if (!r.ok || !d.applied) throw new Error(r.status === 401 ? 'oturum gerekli — yeniden giriş yap' : (d.error || 'kaydedilemedi')); return d; }))
        .then(d => { _fotoListe[k] = { t: d.t, izin: d.izin, var: d.var }; try { localStorage.setItem('dag_fotolar', JSON.stringify(_fotoListe)); } catch (e) {} _fotoSporcuyaYaz(); fotoDegisti(); return d; });
}

// ---- 📷 yükleme penceresi: çek / galeriden seç → kare kırp (sürükle + yakınlaştır) → veli izni → kaydet ----
const FY = { k: null, ad: '', sonra: null, img: null, x: 0, y: 0, z: 1, izin: null, surukle: null };
const FY_BOYUT = 280, FY_CIKTI = 320;
function fotoCss() {
    if (document.getElementById('foto-css')) return;
    let s = document.createElement('style'); s.id = 'foto-css';
    s.textContent = `
#foto-pencere{position:fixed;inset:0;z-index:32000;background:rgba(4,6,9,.72);display:flex;align-items:center;justify-content:center;padding:12px}
#foto-pencere .fp{background:#14171c;color:#e8ebf0;border:1px solid #2b313b;border-radius:16px;width:min(420px,100%);max-height:100%;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;font-size:14px;text-align:left}
#foto-pencere h3{margin:0;font-size:17px}#foto-pencere small{color:#8f98a7;font-size:12.5px;line-height:1.45}
#foto-pencere .fp-kirp{width:${FY_BOYUT}px;height:${FY_BOYUT}px;max-width:100%;margin:0 auto;border-radius:18px;overflow:hidden;position:relative;background:#222833;touch-action:none;cursor:grab;display:grid;place-items:center;color:#8f98a7;font-size:44px;font-weight:700}
#foto-pencere .fp-kirp canvas{position:absolute;inset:0;width:100%;height:100%}
#foto-pencere .fp-kirp::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 999px rgba(0,0,0,.35);pointer-events:none}
#foto-pencere .fp-btnlar{display:flex;gap:8px;flex-wrap:wrap}
#foto-pencere button{font:inherit;font-weight:700;font-size:13.5px;padding:10px 12px;border-radius:10px;border:1px solid #2b313b;background:#1c2027;color:#e8ebf0;cursor:pointer;flex:1 1 auto;transform:none!important}
#foto-pencere button.ana{background:#d4a73a;border-color:#d4a73a;color:#17130a}#foto-pencere button.ana:disabled{opacity:.45;cursor:not-allowed}
#foto-pencere button.tehlike{color:#ef6461;border-color:rgba(239,100,97,.45)}
#foto-pencere button[aria-pressed=true]{border-color:#d4a73a;background:rgba(212,167,58,.16);color:#f0c860}
#foto-pencere input[type=range]{width:100%;accent-color:#d4a73a}
#foto-pencere .fp-izin{display:flex;flex-direction:column;gap:6px;border:1px solid #2b313b;border-radius:12px;padding:10px 12px}`;
    document.head.appendChild(s);
}
function fotoYukleAc(k, ad, sonra) {
    fotoCss();
    let f = _fotoListe[k] || {};
    Object.assign(FY, { k, ad, sonra, img: null, x: 0, y: 0, z: 1, izin: f.izin === 1 || f.izin === 0 ? f.izin : null, surukle: null });
    let a = document.getElementById('foto-pencere'); if (!a) { a = document.createElement('div'); a.id = 'foto-pencere'; document.body.appendChild(a); }
    a.onclick = e => { if (e.target === a) fotoYukleKapat(); };
    a.innerHTML = `<div class="fp" role="dialog" aria-modal="true" aria-label="${esc(ad)} fotoğrafı">
        <h3>📷 ${esc(ad)}</h3>
        <div class="fp-kirp" id="fp-kirp"${f.var ? ` style="${fotoStil(k, true)}"` : ''}>${f.var ? '' : esc(String(ad || '?').trim().split(/\s+/).slice(0, 2).map(s => s.charAt(0)).join(''))}</div>
        <div id="fp-zoom" style="display:none"><small>Yakınlaştır — fotoğrafı parmağınla kaydırıp yüzü daireye ortala</small><input type="range" min="1" max="3" step="0.01" value="1" oninput="FY.z=+this.value; fotoCiz()"></div>
        <div class="fp-btnlar"><button onclick="fotoSec(true)">📷 Kamerayla çek</button><button onclick="fotoSec(false)">🖼 Galeriden seç</button></div>
        <div class="fp-izin"><b style="font-size:13.5px">${k.indexOf('p:') === 0 ? 'Fotoğraf kullanım izni' : 'Veli fotoğraf izni'}</b><small>İzin varsa fotoğraf TV'de, Karışık Sınıf'ta ve oyunlarda görünür. Yoksa yalnız yönetici ekranında.</small>
            <div class="fp-btnlar" id="fp-izin">${[[1, '✓ Var'], [0, '✗ Yok']].map(x => `<button aria-pressed="${FY.izin === x[0]}" onclick="FY.izin=${x[0]}; document.querySelectorAll('#fp-izin button').forEach((b,i)=>b.setAttribute('aria-pressed', i===${x[0] === 1 ? 0 : 1})); fotoDugmeler()">${x[1]}</button>`).join('')}</div></div>
        <div class="fp-btnlar"><button onclick="fotoYukleKapat()">Vazgeç</button>${f.var ? '<button class="tehlike" onclick="fotoKaldir()">🗑 Kaldır</button>' : ''}<button class="ana" id="fp-kaydet" onclick="fotoYukleKaydet()">💾 Kaydet</button></div>
    </div>`;
    fotoDugmeler();
}
// Kaydet: izin seçilmeden kapalı; fotoğraf seçilmediyse yalnız izni kaydettiğini açıkça söyler (2026-10-21: kullanıcı fotoğrafın
// yüklendiğini sandı, oysa seçilen fotoğraf pencereye hiç girmemişti ve yalnız izin kaydedilmişti)
function fotoDugmeler() {
    let b = document.getElementById('fp-kaydet'); if (!b) return;
    let f = _fotoListe[FY.k] || {};
    b.disabled = FY.izin === null || (!FY.img && FY.izin === f.izin);
    b.textContent = FY.img ? '💾 Fotoğrafı kaydet' : f.var ? '💾 İzni kaydet' : '💾 Yalnız izni kaydet';
}
function fotoYukleKapat() { let a = document.getElementById('foto-pencere'); if (a) a.remove(); FY.img = null; }
function fotoDurum(metin, hata) { let e = document.getElementById('fp-durum'); if (!e) { let z = document.getElementById('fp-zoom'); if (!z) return; z.insertAdjacentHTML('beforebegin', '<div id="fp-durum" style="font-size:13px;line-height:1.45;padding:8px 10px;border-radius:10px"></div>'); e = document.getElementById('fp-durum'); } e.style.display = metin ? '' : 'none'; e.style.background = hata ? 'rgba(239,100,97,.14)' : 'rgba(90,169,255,.12)'; e.style.color = hata ? '#ef6461' : '#9cc8ff'; e.innerHTML = metin || ''; }
// Seçilen dosya → en uzun kenarı 1600 px'lik tuval (dev telefon fotoğrafı belleği şişirmesin, EXIF yönü düzelsin)
function _fotoTuvale(kaynak, w, h) { let o = Math.min(1, 1600 / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * o); c.height = Math.round(h * o); c.getContext('2d').drawImage(kaynak, 0, 0, c.width, c.height); return c; }
function _fotoAc(dosya) {
    let bitmap = typeof createImageBitmap === 'function' ? createImageBitmap(dosya, { imageOrientation: 'from-image' }).then(b => _fotoTuvale(b, b.width, b.height)) : Promise.reject();
    return bitmap.catch(() => new Promise((ok, red) => { let url = URL.createObjectURL(dosya), im = new Image(); im.onload = () => { ok(_fotoTuvale(im, im.naturalWidth, im.naturalHeight)); URL.revokeObjectURL(url); }; im.onerror = () => { URL.revokeObjectURL(url); red(new Error('acilamadi')); }; im.src = url; }));
}
function fotoSec(kamera) {
    // iPhone Safari: sayfaya eklenmemiş dosya seçicide "change" bazen hiç gelmiyor → gizli olarak sayfaya eklenir
    let i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (kamera) i.setAttribute('capture', 'environment');
    i.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(i);
    let bitti = false;
    let isle = () => {
        if (bitti) return; let dosya = i.files && i.files[0]; if (!dosya) return; bitti = true; i.remove();
        fotoDurum('⏳ Fotoğraf açılıyor…');
        _fotoAc(dosya).then(c => {
            FY.img = c; FY.z = 1; FY.x = 0; FY.y = 0;
            let k = document.getElementById('fp-kirp'); if (k) { k.style.backgroundImage = ''; k.textContent = ''; k.innerHTML = '<canvas width="' + FY_CIKTI + '" height="' + FY_CIKTI + '"></canvas>'; fotoSurukleBagla(k); }
            let z = document.getElementById('fp-zoom'); if (z) { z.style.display = ''; z.querySelector('input').value = 1; }
            fotoDurum(FY.izin === null ? '✓ Fotoğraf seçildi — aşağıdan veli iznini seç, sonra Kaydet.' : '✓ Fotoğraf seçildi — yüzü daireye ortala, sonra Kaydet.');
            fotoCiz(); fotoDugmeler();
        }).catch(() => {
            let heic = /heic|heif/i.test((dosya.type || '') + ' ' + (dosya.name || ''));
            fotoDurum(heic ? '✗ Bu fotoğraf HEIC biçiminde ve bu tarayıcı açamıyor. iPhone: Ayarlar › Kamera › Biçimler › <b>En Uyumlu</b> seç; ya da fotoğrafın ekran görüntüsünü alıp onu yükle.'
                : '✗ Fotoğraf açılamadı (' + esc(dosya.type || 'bilinmeyen biçim') + '). Başka bir fotoğraf dene ya da kamerayla çek.', true);
        });
    };
    i.addEventListener('change', isle); i.addEventListener('input', isle);
    i.click();
}
// kaynak görüntüden kare kesit: en kısa kenar = kare, z ile küçülür, x/y kaydırma (çıktı pikseli cinsinden)
function fotoKesit() {
    let im = FY.img, W = im.naturalWidth || im.width, Hh = im.naturalHeight || im.height, kenar = Math.min(W, Hh) / FY.z, olcek = kenar / FY_CIKTI;
    let sx = (W - kenar) / 2 - FY.x * olcek, sy = (Hh - kenar) / 2 - FY.y * olcek;
    sx = Math.max(0, Math.min(W - kenar, sx)); sy = Math.max(0, Math.min(Hh - kenar, sy));
    FY.x = -(sx - (W - kenar) / 2) / olcek; FY.y = -(sy - (Hh - kenar) / 2) / olcek;
    return { sx, sy, kenar };
}
function fotoCiz() {
    let c = document.querySelector('#fp-kirp canvas'); if (!c || !FY.img) return;
    let k = fotoKesit(), x = c.getContext('2d');
    x.clearRect(0, 0, FY_CIKTI, FY_CIKTI); x.drawImage(FY.img, k.sx, k.sy, k.kenar, k.kenar, 0, 0, FY_CIKTI, FY_CIKTI);
}
function fotoSurukleBagla(el) {
    el.onpointerdown = e => { FY.surukle = { x: e.clientX, y: e.clientY, ox: FY.x, oy: FY.y }; el.setPointerCapture(e.pointerId); };
    el.onpointermove = e => { if (!FY.surukle) return; let o = FY_CIKTI / el.clientWidth; FY.x = FY.surukle.ox + (e.clientX - FY.surukle.x) * o; FY.y = FY.surukle.oy + (e.clientY - FY.surukle.y) * o; fotoCiz(); };
    el.onpointerup = el.onpointercancel = () => { FY.surukle = null; };
    el.onwheel = e => { e.preventDefault(); FY.z = Math.max(1, Math.min(3, FY.z - e.deltaY * 0.002)); let r = document.querySelector('#fp-zoom input'); if (r) r.value = FY.z; fotoCiz(); };
}
function fotoYukleKaydet() {
    if (FY.izin === null) return showToast('Veli izni var mı, seç.', 'error');
    let govde = { izin: FY.izin };
    if (FY.img) {
        let c = document.createElement('canvas'); c.width = c.height = FY_CIKTI;
        let k = fotoKesit(); c.getContext('2d').drawImage(FY.img, k.sx, k.sy, k.kenar, k.kenar, 0, 0, FY_CIKTI, FY_CIKTI);
        govde.veri = c.toDataURL('image/jpeg', 0.82);
    }
    let b = document.getElementById('fp-kaydet'); if (b) { b.disabled = true; b.textContent = 'Kaydediliyor…'; }
    let sonra = FY.sonra;
    fotoKaydet(FY.k, govde).then(() => { fotoYukleKapat(); showToast(govde.veri ? '📷 Fotoğraf kaydedildi' : '✓ İzin kaydedildi', 'success'); if (sonra) try { sonra(); } catch (e) {} })
        .catch(e => { showToast('Kaydedilemedi: ' + e.message, 'error'); if (b) { b.disabled = false; b.textContent = '💾 Kaydet'; } });
}
function fotoKaldir() {
    let k = FY.k, sonra = FY.sonra;
    onayIste('Fotoğraf kaldırılsın mı?', () => fotoKaydet(k, { veri: null }).then(() => { fotoYukleKapat(); showToast('Fotoğraf kaldırıldı', 'success'); if (sonra) try { sonra(); } catch (e) {} }).catch(e => showToast('Kaldırılamadı: ' + e.message, 'error')), '🗑 Kaldır');
}
function fotoIzinYaz(k, izin) { return fotoKaydet(k, { izin: izin === '1' || izin === 1 ? 1 : izin === '0' || izin === 0 ? 0 : null }); }

// PDF / canvas için fotoğrafın kendisi (dataURL) — izinsizse oturumla; yoksa ''
function fotoVeriAl(k) {
    let f = _fotoListe[k]; if (!f || !f.var) return Promise.resolve('');
    return fetch('/api/foto/' + encodeURIComponent(k) + '?v=' + f.t).then(r => r.ok ? r.blob() : Promise.reject())
        .then(b => new Promise(ok => { let fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(b); })).catch(() => '');
}
function _gorselYukle(src, cors) { return new Promise(ok => { if (!src) return ok(null); let im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }); }
function _yuvarlak(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function _sigdir(x, metin, maks, boyut, agirlik) { let b = boyut; do { x.font = agirlik + ' ' + b + 'px system-ui,"Segoe UI",Roboto,sans-serif'; b -= 2; } while (x.measureText(metin).width > maks && b > 14); }
function _basHarf(ad) { return String(ad || '?').trim().split(/\s+/).slice(0, 2).map(s => s.charAt(0)).join('').toLocaleUpperCase('tr-TR'); }
function _veliLink(ad, sp) { let kod = String(sp.kod || sp.dogumYili || '').trim(); return location.origin + '/app.html?vs=' + encodeURIComponent(ad) + (kod ? '&vk=' + encodeURIComponent(kod) : ''); }

// ---- 🪪 fotoğraflı sporcu kartı (kredi kartı oranı 85.6×54 mm, 1012×638 px) — QR: velinin canlı karnesi ----
async function sporcuKartCiz(g, ad) {
    let sp = turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) throw new Error('sporcu yok');
    let W = 1012, H = 638, c = document.createElement('canvas'); c.width = W; c.height = H;
    let x = c.getContext('2d');
    let [foto, logo, qr] = await Promise.all([fotoVeriAl(fotoAnahtar(g, ad)).then(v => _gorselYukle(v)), _gorselYukle('/favicon.png'), _gorselYukle('https://api.qrserver.com/v1/create-qr-code/?size=380x380&margin=0&data=' + encodeURIComponent(_veliLink(ad, sp)), true)]);
    _yuvarlak(x, 0, 0, W, H, 34); x.save(); x.clip();
    let gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#10141a'); gr.addColorStop(1, '#232a36'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(212,167,58,.16)'; x.beginPath(); x.moveTo(W * .62, 0); x.lineTo(W, 0); x.lineTo(W, H * .5); x.closePath(); x.fill();
    x.fillStyle = '#d4a73a'; x.fillRect(0, H - 12, W, 12);
    if (logo) x.drawImage(logo, 48, 36, 72, 72);
    x.fillStyle = '#ffffff'; x.font = '800 34px system-ui,"Segoe UI",Roboto,sans-serif'; x.fillText('DAĞ SPOR KULÜBÜ', 136, 72);
    x.fillStyle = '#d4a73a'; x.font = '700 19px system-ui,"Segoe UI",Roboto,sans-serif'; x.fillText('OKÇULUK · SPORCU KARTI', 136, 101);
    // fotoğraf
    x.save(); _yuvarlak(x, 48, 150, 260, 300, 26); x.clip();
    if (foto) { let s = Math.min(foto.naturalWidth, foto.naturalHeight * 260 / 300); let sw = s, sh = s * 300 / 260; x.drawImage(foto, (foto.naturalWidth - sw) / 2, (foto.naturalHeight - sh) / 2, sw, sh, 48, 150, 260, 300); }
    else { x.fillStyle = '#3a3020'; x.fillRect(48, 150, 260, 300); x.fillStyle = '#f0c860'; x.font = '800 96px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(_basHarf(ad), 178, 335); x.textAlign = 'left'; }
    x.restore();
    x.strokeStyle = 'rgba(212,167,58,.7)'; x.lineWidth = 3; _yuvarlak(x, 48, 150, 260, 300, 26); x.stroke();
    // bilgiler
    x.fillStyle = '#ffffff'; _sigdir(x, ad, W - 350 - 40, 46, '800'); x.fillText(ad, 340, 196);
    let yas = typeof yasHesapla === 'function' ? yasHesapla(sp) : null;
    let dogum = sp.dogumTarihi ? sp.dogumTarihi.split('-').reverse().join('.') : (sp.dogumYili || '');
    let satirlar = [['KATEGORİ', (typeof LIG_ETIKET_KISA_AIDAT !== 'undefined' && LIG_ETIKET_KISA_AIDAT[g]) || g], ['DOĞUM', dogum ? dogum + (yas != null ? '  (' + yas + ' yaş)' : '') : '—'], ['SPORCU KODU', String(sp.kod || sp.dogumYili || '—')], ['ÜYELİK', sp.katilmaTarihi ? sp.katilmaTarihi.slice(0, 4) + "'ten beri" : (sp.yay || 'Klasik') + ' yay']];
    satirlar.forEach((s, i) => { let yy = 252 + i * 74; x.fillStyle = '#8f98a7'; x.font = '700 17px system-ui,sans-serif'; x.fillText(s[0], 340, yy); x.fillStyle = '#e8ebf0'; _sigdir(x, s[1], 400, 28, '700'); x.fillText(s[1], 340, yy + 34); });
    // QR
    x.fillStyle = '#ffffff'; _yuvarlak(x, W - 256, H - 268, 212, 212, 16); x.fill();
    if (qr) x.drawImage(qr, W - 246, H - 258, 192, 192);
    else { x.fillStyle = '#10141a'; x.font = '700 16px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('QR yüklenemedi', W - 150, H - 160); x.textAlign = 'left'; }
    x.fillStyle = '#8f98a7'; x.font = '600 15px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('Okut → canlı karne', W - 150, H - 30); x.textAlign = 'left';
    x.restore();
    return c;
}
function _kartPencere(baslik, ic) {
    fotoCss();
    let a = document.getElementById('foto-pencere'); if (!a) { a = document.createElement('div'); a.id = 'foto-pencere'; document.body.appendChild(a); }
    a.onclick = e => { if (e.target === a) fotoYukleKapat(); };
    a.innerHTML = '<div class="fp" style="width:min(560px,100%)" role="dialog" aria-modal="true"><h3>' + baslik + '</h3>' + ic + '</div>';
    return a;
}
function _pngIndir(c, dosya) { let l = document.createElement('a'); l.download = dosya; l.href = c.toDataURL('image/png'); document.body.appendChild(l); l.click(); l.remove(); }
// telefonda: dosyayı paylaş (WhatsApp seçilebilir); olmazsa PNG indir + WhatsApp'ı metinle aç
async function _paylas(c, dosya, metin, tel) {
    try {
        let blob = await new Promise(ok => c.toBlob(ok, 'image/png')), f = new File([blob], dosya, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: metin }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    _pngIndir(c, dosya);
    let no = typeof telefonWaFormat === 'function' ? telefonWaFormat(tel) : '';
    window.open((no ? 'https://api.whatsapp.com/send?phone=' + no + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(metin + '\n(Kart görseli indirildi — sohbete ekleyebilirsiniz.)'), '_blank');
}
let _kartSon = null;
async function sporcuKartAc(g, ad) {
    _kartPencere('🪪 ' + esc(ad) + ' · sporcu kartı', '<div id="kart-onizleme" style="text-align:center;color:#8f98a7;padding:30px">Hazırlanıyor…</div>');
    try {
        let c = await sporcuKartCiz(g, ad); _kartSon = { c, g, ad };
        let o = document.getElementById('kart-onizleme'); if (!o) return;
        c.style.cssText = 'width:100%;height:auto;border-radius:14px;display:block';
        o.innerHTML = ''; o.style.padding = '0'; o.appendChild(c);
        o.insertAdjacentHTML('afterend', '<small>QR kodu okutan veli, çocuğunun canlı karnesini açar (sporcu kodu ile).' + ((fotoBilgi(fotoAnahtar(g, ad)) || {}).var ? '' : ' Fotoğraf yok — profilden 📷 ile ekleyebilirsin.') + '</small><div class="fp-btnlar"><button onclick="_pngIndir(_kartSon.c, \'Sporcu_Karti_\' + _kartSon.ad.replace(/\\s+/g, \'_\') + \'.png\')">⬇ PNG indir</button><button onclick="sporcuKartGonder()">💬 Veliye gönder</button><button onclick="sporcuKartlariPdf([[_kartSon.g, _kartSon.ad]])">🖨 Yazdır (PDF)</button></div><div class="fp-btnlar"><button onclick="fotoYukleKapat()">Kapat</button></div>');
    } catch (e) { let o = document.getElementById('kart-onizleme'); if (o) o.textContent = 'Kart çizilemedi.'; }
}
function sporcuKartGonder() {
    if (!_kartSon) return; let sp = turnuvaDB[_kartSon.g][_kartSon.ad] || {}, ilk = _kartSon.ad.split(' ')[0];
    _paylas(_kartSon.c, 'Sporcu_Karti_' + _kartSon.ad.replace(/\s+/g, '_') + '.png', 'Merhaba 🌟 ' + ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR') + "'in DAĞ Spor Kulübü sporcu kartı 🏹 Karttaki QR kodu okutarak canlı karnesine ulaşabilirsiniz.", sp.acilTelefon);
}
// A4'e 10 kart (2×5, gerçek boyut 85.6×54 mm) — tek sporcu ya da liste
async function sporcuKartlariPdf(liste) {
    if (!liste || !liste.length) return showToast('Kart basılacak sporcu yok.', 'warning');
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    showToast('🪪 ' + liste.length + ' kart hazırlanıyor…', 'warning');
    try {
        let pdf = await _yeniPdfAl('portrait'), kw = 85.6, kh = 54, gx = 6, gy = 3, x0 = (210 - 2 * kw - gx) / 2, y0 = (297 - 5 * kh - 4 * gy) / 2;
        for (let i = 0; i < liste.length; i++) {
            if (i && i % 10 === 0) pdf.addPage();
            let c = await sporcuKartCiz(liste[i][0], liste[i][1]), n = i % 10;
            pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', x0 + (n % 2) * (kw + gx), y0 + Math.floor(n / 2) * (kh + gy), kw, kh);
        }
        pdf.save(liste.length === 1 ? 'Sporcu_Karti_' + liste[0][1].replace(/\s+/g, '_') + '.pdf' : 'Sporcu_Kartlari_' + liste.length + '.pdf');
        showToast('🪪 Kart PDF indirildi', 'success');
    } catch (e) { showToast('Kartlar hazırlanamadı.', 'error'); }
}

// ---- 🎂 fotoğraflı doğum günü kartı (1080×1080) → WhatsApp ----
async function dogumGunuKartCiz(g, ad) {
    let sp = turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) throw new Error('sporcu yok');
    let S = 1080, c = document.createElement('canvas'); c.width = c.height = S;
    let x = c.getContext('2d'), foto = await fotoVeriAl(fotoAnahtar(g, ad)).then(v => _gorselYukle(v)), logo = await _gorselYukle('/favicon.png');
    let gr = x.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#2b1055'); gr.addColorStop(1, '#d4418e'); x.fillStyle = gr; x.fillRect(0, 0, S, S);
    let renk = ['#f0c860', '#5aa9ff', '#3fbf7f', '#ffffff', '#ff8a5b'], r = 7; // sabit konfeti (her kartta aynı desen)
    for (let i = 0; i < 90; i++) { r = (r * 9301 + 49297) % 233280; let px = r / 233280 * S; r = (r * 9301 + 49297) % 233280; let py = r / 233280 * S; x.fillStyle = renk[i % renk.length]; x.globalAlpha = .55; x.fillRect(px, py, 10 + (i % 3) * 4, 6); }
    x.globalAlpha = 1;
    let cx = S / 2, cy = 380, R = 230;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
    if (foto) { let s = Math.min(foto.naturalWidth, foto.naturalHeight); x.drawImage(foto, (foto.naturalWidth - s) / 2, (foto.naturalHeight - s) / 2, s, s, cx - R, cy - R, 2 * R, 2 * R); }
    else { x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); x.fillStyle = '#fff'; x.font = '800 150px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(_basHarf(ad), cx, cy + 52); }
    x.restore();
    x.strokeStyle = '#f0c860'; x.lineWidth = 12; x.beginPath(); x.arc(cx, cy, R + 6, 0, Math.PI * 2); x.stroke();
    let ilk = ad.split(' ')[0]; ilk = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let yas = typeof yasHesapla === 'function' ? yasHesapla(sp) : null;
    x.textAlign = 'center'; x.fillStyle = '#ffffff'; x.font = '700 64px system-ui,sans-serif'; x.fillText('İyi ki doğdun', cx, 720);
    x.fillStyle = '#f0c860'; _sigdir(x, ilk + '!', S - 120, 110, '900'); x.fillText(ilk + '!', cx, 840);
    x.fillStyle = '#ffffff'; x.font = '600 40px system-ui,sans-serif'; x.fillText(yas != null ? '🎂 ' + yas + ' yaşın kutlu olsun 🏹' : '🎂 Nice mutlu yıllara 🏹', cx, 920);
    if (logo) x.drawImage(logo, cx - 190, 978, 48, 48);
    x.font = '700 30px system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.9)'; x.textAlign = 'left'; x.fillText('DAĞ Spor Kulübü', cx - 130, 1012);
    return c;
}
async function dogumGunuKartPaylas(g, ad) {
    let sp = turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
    showToast('🎂 Doğum günü kartı hazırlanıyor…', 'warning');
    try {
        let c = await dogumGunuKartCiz(g, ad), ilk = ad.split(' ')[0]; ilk = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
        await _paylas(c, 'Dogum_Gunu_' + ad.replace(/\s+/g, '_') + '.png', 'Merhaba 🎉 DAĞ Spor Kulübü ailesi olarak ' + ilk + "'in doğum gününü kutlarız! Nice mutlu, sağlıklı yıllara 🎂", sp.acilTelefon);
    } catch (e) { showToast('Kart hazırlanamadı.', 'error'); }
}

// açılışta: önbellekteki listeyle hemen, sonra sunucudan; 10 dk'da bir ve yönetici paneli açılınca tazele
_fotoSporcuyaYaz();
setTimeout(() => fotoListeCek(true), 1500);
setInterval(() => { if (!document.hidden) fotoListeCek(true); }, 600000);

// ---- 📺 "Kim attı" alt bandı (2026-10-21, kullanıcı taslaktan A'yı seçti) ----
// Seri girilince (bu cihazda ya da canlı yayından) TV ekranında 4 sn alttan fotoğraf + isim + oklar + puan kayar; ekran kesilmez.
// Kişisel rekorda altın bant. Yalnız "TV gibi" ekranlarda: tam ekran (Karışık Sınıf oyunları, Yuva TV…) ya da Canlı Takip sekmesi.
// Yarışma TV'sinde gösterilmez (kendi sıralama duyurusu var). Fotoğraf yalnız veli izni olanlarda; yoksa baş harfler.
const KA = { kuyruk: [], gorulen: {}, aktif: false };
function kimAttiAcikMi() { try { return localStorage.getItem('dag_kim_atti') !== '0'; } catch (e) { return true; } }
function kimAttiAyarla(v) { try { localStorage.setItem('dag_kim_atti', v ? '1' : '0'); } catch (e) {} showToast(v ? '📺 Kim attı bandı açık' : '📺 Kim attı bandı kapalı', 'success'); }
function kimAttiEkranMi() {
    if (!kimAttiAcikMi() || document.hidden) return false;
    if (document.body.classList.contains('yz-tv-acik')) return false;
    if (document.fullscreenElement) return true;
    let ct = document.getElementById('tab-canlitakip'); return !!(ct && ct.classList.contains('aktif'));
}
// s: { id, g, ad, puan, oklar, mesafe, t } — aynı seri iki yoldan gelirse (yerel kayıt + yayın yankısı) bir kez
function kimAttiBildir(s) {
    if (!s || !s.ad || !s.g) return;
    let anahtar = s.id || (s.g + '|' + s.ad + '|' + s.puan + '|' + Math.round((s.t || Date.now()) / 5000));
    if (KA.gorulen[anahtar]) return; KA.gorulen[anahtar] = Date.now();
    if (s.t && Date.now() - s.t > 120000) return; // eski seri (açılışta bugünün listesi) bant göstermez
    if (!kimAttiEkranMi()) return;
    KA.kuyruk.push(s); if (KA.kuyruk.length > 5) KA.kuyruk.shift();
    if (!KA.aktif) kimAttiSiradaki();
}
function _kimAttiRekor(s) {
    let sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp || typeof _ysSeriler !== 'function') return false;
    let n = (s.oklar || []).length;
    let once = _ysSeriler(sp).filter(x => x.seriId !== s.id && (x.oklar || []).length === n && (x.t || 0) < (s.t || Date.now()));
    return once.length >= 5 && (Number(s.puan) || 0) > Math.max(...once.map(x => Number(x.puan) || 0));
}
// kürsü / podyum yüzü — k: 'grup|ad'; izinli fotoğraf yoksa '' (yer tutmaz)
function fotoYuzHTML(k, sinif) { let s = k ? fotoSrc('s:' + k, false) : ''; return s ? '<span class="' + sinif + '" style="background-image:url(\'' + s + '\')"></span>' : ''; }
(function () {
    let st = document.createElement('style'); st.id = 'foto-genel-css';
    st.textContent = '.yz-pod-foto{display:block;width:72px;height:72px;margin:0 auto 6px;border-radius:50%;background-size:cover;background-position:center;border:3px solid currentColor;box-shadow:0 4px 14px rgba(0,0,0,.35)}'
        + '.yz-tv-pod-foto{display:inline-block;width:1.6em;height:1.6em;border-radius:50%;background-size:cover;background-position:center;vertical-align:middle;margin-right:.35em;border:2px solid rgba(255,255,255,.8)}';
    document.head.appendChild(st);
})();
function kimAttiCss() {
    if (document.getElementById('ka-css')) return;
    let st = document.createElement('style'); st.id = 'ka-css';
    st.textContent = `
#ka-bant{position:fixed;left:3vw;bottom:5vh;z-index:2147483000;display:flex;align-items:center;gap:1.6vw;width:min(62vw,980px);min-width:300px;padding:1.2vw 1.6vw;border-radius:18px;background:linear-gradient(90deg,rgba(18,22,30,.97),rgba(18,22,30,.9));border:1px solid rgba(240,200,96,.45);box-shadow:0 10px 40px rgba(0,0,0,.5);color:#e8ebf0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;transform:translateX(-120%);transition:transform .55s cubic-bezier(.2,.9,.3,1.2);pointer-events:none}
#ka-bant.acik{transform:none}
#ka-bant.rekor{border-color:#f0c860;background:linear-gradient(90deg,#3a2c0b,#1a1408)}
#ka-bant .ka-foto{width:clamp(56px,8vw,120px);aspect-ratio:1;border-radius:50%;border:3px solid #f0c860;flex:none;display:grid;place-items:center;font-weight:800;font-size:clamp(18px,2.6vw,40px);background:#3a3020;color:#f0c860;background-size:cover;background-position:center}
#ka-bant .ka-ad{flex:1;min-width:0}
#ka-bant small{display:block;color:#8f98a7;font-size:clamp(10px,1vw,14px);letter-spacing:.06em;text-transform:uppercase}
#ka-bant .ka-isim{display:block;font-size:clamp(16px,2.3vw,32px);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ka-bant .ka-rozet{display:none;font-size:clamp(10px,1.1vw,15px);font-weight:800;color:#17130a;background:#f0c860;padding:2px 10px;border-radius:99px;margin-left:8px;vertical-align:middle}
#ka-bant.rekor .ka-rozet{display:inline-block}
#ka-bant .ka-oklar{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
#ka-bant .ka-oklar span{font-size:clamp(10px,1.05vw,15px);font-weight:800;padding:1px 7px;border-radius:6px;background:#fbbf24;color:#78350f}
#ka-bant .ka-oklar span.k{background:#ef4444;color:#fff}#ka-bant .ka-oklar span.m{background:#3b82f6;color:#fff}#ka-bant .ka-oklar span.s{background:#1f2937;color:#fff}#ka-bant .ka-oklar span.b{background:#fff;color:#334155}#ka-bant .ka-oklar span.x{background:#e2e8f0;color:#64748b}
#ka-bant .ka-puan{text-align:center;font-size:clamp(30px,4.4vw,62px);font-weight:900;color:#f0c860;line-height:1}
#ka-bant .ka-puan small{font-size:clamp(9px,.9vw,13px);font-weight:700;letter-spacing:.08em}
@media (prefers-reduced-motion:reduce){#ka-bant{transition:none}}`;
    document.head.appendChild(st);
}
function kimAttiSiradaki() {
    let s = KA.kuyruk.shift(); if (!s) { KA.aktif = false; return; }
    KA.aktif = true; kimAttiCss();
    let el = document.getElementById('ka-bant');
    if (!el) { el = document.createElement('div'); el.id = 'ka-bant'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    let rekor = _kimAttiRekor(s), k = fotoAnahtar(s.g, s.ad), stil = fotoStil(k, false);
    let ok = (s.oklar || []).map(o => { let c = (o === 'X' || o === '10' || o === '9') ? '' : (o === '8' || o === '7') ? 'k' : (o === '6' || o === '5') ? 'm' : (o === '4' || o === '3') ? 's' : o === 'M' ? 'x' : 'b'; return '<span class="' + c + '">' + esc(o) + '</span>'; }).join('');
    let grup = (typeof LIG_ETIKET_KISA_AIDAT !== 'undefined' && LIG_ETIKET_KISA_AIDAT[s.g]) || s.g;
    el.className = rekor ? 'rekor' : '';
    el.innerHTML = '<div class="ka-foto" style="' + stil + '">' + (stil ? '' : esc(_basHarf(s.ad))) + '</div><div class="ka-ad"><small>' + esc(grup) + (s.mesafe ? ' · ' + esc(s.mesafe) + ' m' : '') + '</small><span class="ka-isim">' + esc(s.ad) + '<span class="ka-rozet">🏅 REKOR</span></span><div class="ka-oklar">' + ok + '</div></div><div class="ka-puan">' + (Number(s.puan) || 0) + '<small>PUAN</small></div>';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('acik')));
    setTimeout(() => { el.classList.remove('acik'); setTimeout(kimAttiSiradaki, 650); }, rekor ? 5200 : 4000);
}
