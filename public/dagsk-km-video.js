/* ================================================================================================
   🎥 VİDEO ANALİZ PENCERESİ — Karışık Sınıf / Yarışma (2026-10-15)
   Kullanıcı: "yarışmada bazı sporcuların tekniği yanlış oluyor. Fatmanur sözlü uyarılamıyor, gözüyle kendini
   görmesi gerekiyor. Üstüne tıklayınca canlı ya da video yükleyerek ekranda gösterebilmeliyiz. Beş saniye
   gecikmeli aynayı da buraya alabiliriz."
   Üç mod, tek pencere (TV ekranının ve skor girişinin üstünde açılır):
     ⏱ Gecikmeli ayna: kamera görüntüsü N sn geriden (3/5/8/10). Sporcu atar, döner, kendi atışını görür.
        Kareler küçük JPEG olarak tutulur (bellek dostu). "Son 10 sn'yi yavaş izle" ile arabellek dondurulur,
        kare kare / yavaş oynatılır.
     🔴 Canlı kamera: gecikmesiz görüntü + kayıt; kayıt bitince video moduna geçer.
     📁 Video: telefondan/galeriden video aç → yavaş çekim, kare ileri/geri, sürgü.
   Her modda çizgi / açı çizimi ve ayna (sağ-sol çevir). Video saklanmaz, sunucuya gitmez (indir düğmesi hariç).
   "Form Lab'da analiz et" kayıtlı/yüklenen videoyu bu sporcu seçili olarak Form Lab'a verir.
   ================================================================================================ */
var _kv = null;
// 24 kare/sn ve 720p (2026-10-15, kullanıcı: "en az 720; donarak hareket etmesin") — 10 kare/sn ayna takılarak görünüyordu
const KV_HZ = 24, KV_MAKS_G = 1280;

function kvEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function kvAd(k) { if (!k) return ''; let i = k.indexOf('|'); return i < 0 ? k : k.slice(i + 1); }

function kvAc(k, mod) {
    kvCss();
    if (_kv) kvKapat();
    _kv = { k: k || null, mod: mod || 'ayna', gecikme: 5, yuz: 'environment', ayna: false, arac: null, noktalar: [], sekiller: [],
        akis: null, akisTel: false, kaynak: 'yerel', kareler: [], tekrar: null, video: null, videoUrl: null, videoAd: '', kayit: null, hiz: 1, raf: 0, zam: 0, temiz: false };
    try { if (localStorage.getItem('kv_kaynak') === 'tel') _kv.kaynak = 'tel'; } catch (e) {}
    try { let g = parseInt(localStorage.getItem('kv_gecikme'), 10); if ([3, 5, 8, 10].indexOf(g) !== -1) _kv.gecikme = g; } catch (e) {}
    let kap = document.createElement('div'); kap.id = 'kv'; kap.className = 'kv-arka';
    (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap);
    document.addEventListener('keydown', kvTus, true);
    window.addEventListener('resize', kvYerlesim);
    kvCiz();
    if (_kv.mod === 'ayna' || _kv.mod === 'canli') kvKameraAc();
    kvKameraVarMi();
}
// Bilgisayarın kamerası yoksa (kullanıcı: "PC'nin kamerası yok, telefonun kamerasını PC'ye, oradan TV'ye yansıtacağım") kaynak kendiliğinden telefon
async function kvKameraVarMi() {
    if (!_kv || _kv.kaynak === 'tel' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    let l = []; try { l = (await navigator.mediaDevices.enumerateDevices()).filter(function (d) { return d.kind === 'videoinput'; }); } catch (e) { return; }
    if (!l.length && _kv && _kv.kaynak !== 'tel') kvKaynakSec('tel');
}
function kvKapat() {
    if (!_kv) return;
    kvKameraKapat();
    if (_kv.videoUrl) { try { URL.revokeObjectURL(_kv.videoUrl); } catch (e) {} }
    cancelAnimationFrame(_kv.raf); clearTimeout(_kv.zam);
    try { if (_kv.ro) _kv.ro.disconnect(); } catch (e) {} clearInterval(_kv.telIzle);
    if (document.fullscreenElement && document.fullscreenElement.id === 'kv') { try { document.exitFullscreen(); } catch (e) {} }
    let kap = document.getElementById('kv'); if (kap) kap.remove();
    document.removeEventListener('keydown', kvTus, true);
    window.removeEventListener('resize', kvYerlesim);
    _kv = null;
}
function kvTus(e) {
    if (!_kv) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return kvKapat(); }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
    if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); kvOynatDurdur(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); kvKare(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); kvKare(-1); }
}
function kvModSec(m) {
    if (!_kv || _kv.mod === m) return;
    kvKameraKapat(); cancelAnimationFrame(_kv.raf);
    _kv.mod = m; _kv.tekrar = null; _kv.sekiller = []; _kv.noktalar = [];
    kvCiz();
    if (m === 'ayna' || m === 'canli') kvKameraAc();
}

// ---------------------------------------------------------------- ekran
function kvCiz() {
    let kap = document.getElementById('kv'); if (!kap || !_kv) return;
    let m = _kv.mod, tekrar = !!_kv.tekrar, videoVar = m === 'video' && _kv.videoUrl;
    let sekme = function (id, ikon, yazi, uzun) { return '<button class="' + (m === id ? 'aktif' : '') + '" onclick="kvModSec(\'' + id + '\')">' + ikon + ' ' + yazi + (uzun ? '<span class="kv-uzun"> ' + uzun + '</span>' : '') + '</button>'; };
    let sahne = '';
    if (m === 'video' && !videoVar) {
        sahne = '<div class="kv-bos"><b>Videoyu aç</b><p>Telefonun galerisinden ya da dosyalardan bir atış videosu seç. Yavaş çekim ve kare kare izleyebilirsin; video hiçbir yere yüklenmez.</p>'
            + '<label class="kv-btn ana buyuk">📁 Video seç<input type="file" accept="video/*" onchange="kvDosya(this)" hidden></label>'
            + '<label class="kv-btn buyuk">📷 Telefonla çek<input type="file" accept="video/*" capture="environment" onchange="kvDosya(this)" hidden></label></div>';
    } else if (m === 'video') {
        sahne = '<div class="kv-cerceve" id="kv-cerceve"><video id="kv-v" src="' + _kv.videoUrl + '" playsinline muted loop preload="auto"></video><canvas id="kv-ciz"></canvas></div>';
    } else if (m === 'canli') {
        sahne = '<div class="kv-cerceve" id="kv-cerceve"><video id="kv-v" playsinline muted autoplay></video><canvas id="kv-ciz"></canvas>' + '<span class="kv-rozet kayit" id="kv-kayit-rozet"' + (_kv.kayit ? '' : ' hidden') + '>● KAYIT 0:00</span>' + '</div>';
    } else {
        sahne = '<div class="kv-cerceve" id="kv-cerceve"><canvas id="kv-c"></canvas><canvas id="kv-ciz"></canvas>'
            + (tekrar ? '<span class="kv-rozet">⏸ TEKRAR · son ' + Math.round(_kv.tekrar.sure) + ' sn</span>' : '<span class="kv-rozet" id="kv-rozet">⏱ ' + _kv.gecikme + ' sn geriden</span>')
            + '<video id="kv-canli-kucuk" playsinline muted autoplay></video></div>';
    }
    kap.innerHTML = '<div class="kv" role="dialog" aria-modal="true" aria-label="Video analiz">'
        + '<div class="kv-ust"><div class="kv-baslik"><b>🎥 ' + (_kv.k ? kvEsc(kvAd(_kv.k)) : 'Video analiz') + '</b><span>' + (m === 'ayna' ? 'Atışını yap, dön ve kendini izle' : m === 'canli' ? 'Canlı görüntü · kaydet, sonra yavaş izle' : 'Yavaş çekim · kare kare') + '</span></div>'
        + '<div class="kv-sekmeler">' + sekme('ayna', '⏱', 'Ayna', '(gecikmeli)') + sekme('canli', '🔴', 'Canlı') + sekme('video', '📁', 'Video') + '</div>'
        + '<div class="kv-ust-sag"><button class="kv-kapat" onclick="kvTemiz(true)" title="Yalnız görüntü (TV için) — ekrana dokununca düğmeler geri gelir" aria-label="Yalnız görüntü">👁</button><button class="kv-kapat" onclick="kvTamEkran()" title="Tam ekran" aria-label="Tam ekran">⛶</button><button class="kv-kapat" onclick="kvKapat()" aria-label="Kapat">✕</button></div></div>'
        + '<div class="kv-sahne" id="kv-sahne">' + sahne + '<div class="kv-ipucu" id="kv-ipucu" hidden></div></div>'
        + '<div class="kv-alt" id="kv-alt"></div></div>';
    kvAltCiz();
    kvBagla();
}
function kvAltCiz() {
    let altEl = document.getElementById('kv-alt'); if (!altEl || !_kv) return;
    let m = _kv.mod, tekrar = !!_kv.tekrar, videoVar = m === 'video' && _kv.videoUrl;
    let alt = '';
    let cizimler = '<div class="kv-grup"><button class="' + (_kv.arac === 'cizgi' ? 'aktif' : '') + '" onclick="kvArac(\'cizgi\')" title="İki noktaya dokun">📏 Çizgi</button><button class="' + (_kv.arac === 'aci' ? 'aktif' : '') + '" onclick="kvArac(\'aci\')" title="Üç noktaya dokun: kol, dirsek/omuz, kol">📐 Açı</button>'
        + (_kv.sekiller.length ? '<button onclick="kvCizimSil()">🧽 Temizle</button>' : '') + '<button class="' + (_kv.ayna ? 'aktif' : '') + '" onclick="kvAynaCevir()" title="Sağ-sol çevir (ayna gibi)">↔ Ayna</button></div>';
    let hizlar = '<div class="kv-grup">' + [0.25, 0.5, 1].map(function (h) { return '<button class="' + (_kv.hiz === h ? 'aktif' : '') + '" onclick="kvHiz(' + h + ')">' + (h === 1 ? '1×' : h === 0.5 ? '½×' : '¼×') + '</button>'; }).join('') + '</div>';
    let oynat = '<div class="kv-grup"><button onclick="kvKare(-1)" aria-label="Bir kare geri">◀</button><button class="genis" id="kv-oynat" onclick="kvOynatDurdur()">⏯</button><button onclick="kvKare(1)" aria-label="Bir kare ileri">▶</button></div>';
    let surgu = '<input type="range" id="kv-surgu" class="kv-surgu" min="0" max="1000" value="0" oninput="kvSurgu(this.value)" aria-label="Zaman">';
    let kaynak = '<div class="kv-grup"><button class="' + (_kv.kaynak === 'yerel' ? 'aktif' : '') + '" onclick="kvKaynakSec(\'yerel\')" title="Bu cihazın kamerası">📷 Bu cihaz</button><button class="' + (_kv.kaynak === 'tel' ? 'aktif' : '') + '" onclick="kvKaynakSec(\'tel\')" title="Telefonun kamerası QR ile bu ekrana gelir">📱 Telefon</button></div>';
    if (m === 'ayna' && !tekrar) {
        alt = '<div class="kv-alt-satir">' + kaynak + '<div class="kv-grup"><span class="kv-et">Gecikme</span>' + [3, 5, 8, 10].map(function (g) { return '<button class="' + (_kv.gecikme === g ? 'aktif' : '') + '" onclick="kvGecikme(' + g + ')">' + g + ' sn</button>'; }).join('') + '</div>'
            + '<button class="kv-btn ana" onclick="kvTekrar()">⏪ Son 10 sn\'yi yavaş izle</button><button class="kv-btn" onclick="kvKameraCevir()">🔄 Kamera</button></div>'
            + '<div class="kv-alt-satir">' + cizimler + '</div>';
    } else if (m === 'ayna' && tekrar) {
        alt = '<div class="kv-alt-satir">' + surgu + oynat + hizlar + '</div><div class="kv-alt-satir"><button class="kv-btn ana" onclick="kvTekrarBitir()">⏱ Aynaya dön</button>' + cizimler + '</div>';
    } else if (m === 'canli') {
        alt = '<div class="kv-alt-satir">' + (_kv.kayit ? '<button class="kv-btn kirmizi buyuk" onclick="kvKayitBitir()">⏹ Kaydı bitir ve izle</button>' : '<button class="kv-btn kirmizi buyuk" onclick="kvKayitBasla()">● Kayda başla</button>')
            + kaynak + '<button class="kv-btn" onclick="kvKameraCevir()">🔄 Kamera</button></div><div class="kv-alt-satir">' + cizimler + '</div>';
    } else if (videoVar) {
        alt = '<div class="kv-alt-satir">' + surgu + '<span class="kv-et" id="kv-zaman">0:00</span>' + oynat + hizlar + '</div><div class="kv-alt-satir">'
            + '<label class="kv-btn">📁 Başka video<input type="file" accept="video/*" onchange="kvDosya(this)" hidden></label>'
            + '<button class="kv-btn" onclick="kvIndir()">⬇ İndir</button>'
            + '<button class="kv-btn ana" onclick="kvFormLab()" title="Çene altı, kol açıları ve atış atış kıyas">🔬 Form Lab\'da analiz et</button>' + cizimler + '</div>';
    }
    altEl.innerHTML = alt; altEl.hidden = !alt;
    let ip = document.getElementById('kv-ipucu');
    if (ip) { ip.hidden = !_kv.arac; if (_kv.arac) ip.textContent = (_kv.arac === 'cizgi' ? 'Görüntüde iki noktaya dokun' : 'Üç noktaya dokun — ortadaki nokta açının köşesi') + ' (' + _kv.noktalar.length + '/' + (_kv.arac === 'cizgi' ? 2 : 3) + ')'; }
    kvOynatYazi(); kvSurguGuncelle();
}
function kvSure(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function kvBagla() {
    let sh = document.getElementById('kv-sahne');
    if (sh && window.ResizeObserver) { try { if (_kv.ro) _kv.ro.disconnect(); } catch (e) {} _kv.ro = new ResizeObserver(function () { kvYerlesim(); }); _kv.ro.observe(sh); }
    if (sh) sh.onclick = function (e) { if (_kv && _kv.temiz && !_kv.arac) { e.stopPropagation(); kvTemiz(false); } };
    let kp = document.getElementById('kv'); if (kp) kp.classList.toggle('kv-temiz', !!_kv.temiz);
    let ciz = document.getElementById('kv-ciz');
    if (ciz) ciz.onpointerdown = kvCizimDokun;
    let fr = document.getElementById('kv-cerceve'); if (fr) fr.classList.toggle('aynali', !!_kv.ayna);
    if (_kv.mod === 'video' && _kv.videoUrl) {
        let v = document.getElementById('kv-v');
        v.playbackRate = _kv.hiz;
        v.onloadedmetadata = function () { kvYerlesim(); kvSurguGuncelle(); };
        v.onplay = v.onpause = function () { kvOynatYazi(); };
        if (v.readyState >= 1) kvYerlesim();
        cancelAnimationFrame(_kv.raf);
        let dongu = function () { if (!_kv || _kv.mod !== 'video') return; kvSurguGuncelle(); _kv.raf = requestAnimationFrame(dongu); };
        _kv.raf = requestAnimationFrame(dongu);
    } else if (_kv.mod === 'canli' && _kv.akis) {
        let v = document.getElementById('kv-v'); v.srcObject = _kv.akis; v.onloadedmetadata = kvYerlesim; if (v.readyState >= 1) kvYerlesim();
    } else if (_kv.mod === 'ayna') {
        let kc = document.getElementById('kv-canli-kucuk'); if (kc && _kv.akis) kc.srcObject = _kv.akis;
        kvYerlesim();
        if (_kv.tekrar) kvTekrarCiz();
    }
    kvCizimYenile(); kvOynatYazi();
}
// medya oranına göre çerçeveyi sahneye sığdır (çizim katmanı görüntüyle birebir örtüşsün)
function kvYerlesim() {
    if (!_kv) return;
    let s = document.getElementById('kv-sahne'), fr = document.getElementById('kv-cerceve'); if (!s || !fr) return;
    let w = 16, h = 9;
    if (_kv.mod === 'ayna') { let c = _kv.tekrar ? _kv.tekrar : _kv; if (c.gW) { w = c.gW; h = c.gH; } }
    else { let v = document.getElementById('kv-v'); if (v && v.videoWidth) { w = v.videoWidth; h = v.videoHeight; } }
    let sw = s.clientWidth - 8, sh = s.clientHeight - 8, o = Math.min(sw / w, sh / h);
    fr.style.width = Math.max(10, Math.floor(w * o)) + 'px'; fr.style.height = Math.max(10, Math.floor(h * o)) + 'px';
    let c = document.getElementById('kv-c'); if (c && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; }
    let ciz = document.getElementById('kv-ciz'); if (ciz) { let r = window.devicePixelRatio || 1; ciz.width = Math.floor(w * o * r); ciz.height = Math.floor(h * o * r); kvCizimYenile(); }
}

// ---------------------------------------------------------------- kamera + gecikmeli ayna
async function kvKameraAc() {
    if (!_kv) return;
    let mod = _kv.mod;
    if (_kv.kaynak === 'tel') { let a = await kvTelAkis(mod); if (!a || !_kv || _kv.mod !== mod) return; _kv.akis = a; _kv.akisTel = true; return kvAkisHazir(mod); }
    try {
        _kv.akis = await navigator.mediaDevices.getUserMedia({ video: { facingMode: _kv.yuz, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }, audio: false });
        _kv.akisTel = false;
    } catch (e) {
        let s = document.getElementById('kv-sahne');
        let izin = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
        if (s && _kv && _kv.mod === mod) s.innerHTML = '<div class="kv-bos"><b>' + (izin ? 'Kamera izni verilmedi' : 'Bu cihazda kamera bulunamadı') + '</b><p>' + (izin ? 'Tarayıcıda bu siteye kamera izni ver. ' : '') + 'Telefonun kamerasını bu ekrana getirebilirsin: QR\'ı telefonla okut, görüntü buraya (ve TV\'ye) gelir.</p><button class="kv-btn ana buyuk" onclick="kvKaynakSec(\'tel\')">📱 Telefonun kamerasını kullan</button><button class="kv-btn" onclick="kvModSec(\'video\')">📁 Video seç</button></div>';
        return;
    }
    if (!_kv || _kv.mod !== mod) { kvAkisDurdur(); return; }
    return kvAkisHazir(mod);
}
async function kvAkisHazir(mod) {
    if (!_kv || _kv.mod !== mod) return;
    if (mod === 'canli') { kvCiz(); return; }
    // ayna: gizli video → küçük JPEG kareler → N sn geriden çiz
    let v = document.createElement('video'); v.muted = true; v.playsInline = true; v.srcObject = _kv.akis;
    try { await v.play(); } catch (e) {}
    await new Promise(function (r) { if (v.readyState >= 1 && v.videoWidth) r(); else v.onloadedmetadata = function () { r(); }; });
    if (!_kv) return;
    let o = Math.min(1, KV_MAKS_G / (v.videoWidth || 640));
    _kv.gW = Math.round((v.videoWidth || 640) * o); _kv.gH = Math.round((v.videoHeight || 360) * o);
    _kv.gizli = v; _kv.kareler = [];
    let yak = document.createElement('canvas'); yak.width = _kv.gW; yak.height = _kv.gH;
    let yctx = yak.getContext('2d');
    clearInterval(_kv.yakTimer);
    _kv.yakTimer = setInterval(function () {
        if (!_kv || !_kv.gizli || _kv.tekrar) return;
        try { yctx.drawImage(v, 0, 0, yak.width, yak.height); } catch (e) { return; }
        let t = Date.now();
        yak.toBlob(function (b) {
            if (!_kv || !b) return;
            _kv.kareler.push({ t: t, b: b });
            let sinir = Date.now() - (Math.max(_kv.gecikme, 10) + 3) * 1000;
            while (_kv.kareler.length && _kv.kareler[0].t < sinir) _kv.kareler.shift();
        }, 'image/jpeg', 0.8);
    }, 1000 / KV_HZ);
    kvCiz();
    kvAynaDongu();
}
function kvAynaDongu() {
    if (!_kv || _kv.mod !== 'ayna') return;
    _kv.raf = requestAnimationFrame(kvAynaDongu);
    if (_kv.tekrar || _kv.ciziliyor) return;
    let hedef = Date.now() - _kv.gecikme * 1000, en = null;
    for (let i = _kv.kareler.length - 1; i >= 0; i--) { if (_kv.kareler[i].t <= hedef) { en = _kv.kareler[i]; break; } }
    let rz = document.getElementById('kv-rozet');
    if (!en) { if (rz) rz.textContent = '⏱ ' + Math.max(1, Math.ceil((_kv.kareler.length ? _kv.kareler[0].t + _kv.gecikme * 1000 - Date.now() : _kv.gecikme * 1000) / 1000)) + ' sn sonra başlıyor…'; return; }
    if (rz) rz.textContent = '⏱ ' + _kv.gecikme + ' sn geriden';
    if (en === _kv.sonKare) return;
    _kv.sonKare = en; kvKareCiz(en.b);
}
function kvKareCiz(blob) {
    let c = document.getElementById('kv-c'); if (!c) return;
    _kv.ciziliyor = true;
    createImageBitmap(blob).then(function (bm) {
        if (_kv) _kv.ciziliyor = false;
        let c2 = document.getElementById('kv-c'); if (!c2) { bm.close && bm.close(); return; }
        c2.getContext('2d').drawImage(bm, 0, 0, c2.width, c2.height); bm.close && bm.close();
    }).catch(function () { if (_kv) _kv.ciziliyor = false; });
}
function kvGecikme(g) { if (!_kv) return; _kv.gecikme = g; try { localStorage.setItem('kv_gecikme', String(g)); } catch (e) {} _kv.sonKare = null; kvAltCiz(); }
function kvAkisDurdur() { if (_kv && _kv.akis && _kv.akisTel) { _kv.akis = null; _kv.akisTel = false; return; } if (_kv && _kv.akis) { try { _kv.akis.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} _kv.akis = null; } }
function kvKameraKapat() {
    if (!_kv) return;
    clearInterval(_kv.kayitSaat);
    if (_kv.kayit) { try { _kv.kayit.rec.onstop = null; _kv.kayit.rec.stop(); } catch (e) {} _kv.kayit = null; }
    clearInterval(_kv.yakTimer); _kv.yakTimer = null; cancelAnimationFrame(_kv.raf);
    kvAkisDurdur(); _kv.gizli = null; _kv.kareler = []; _kv.sonKare = null;
}
function kvKameraCevir() { if (!_kv) return; if (_kv.akisTel) { try { _fl.tel.kanal.send(JSON.stringify({ cevir: true })); } catch (e) {} if (typeof showToast === 'function') showToast('Telefonda kamera çevrildi', 'info'); return; } _kv.yuz = _kv.yuz === 'environment' ? 'user' : 'environment'; let m = _kv.mod; kvKameraKapat(); kvCiz(); if (m === 'ayna' || m === 'canli') kvKameraAc(); }

// ⏪ arabelleği dondur → kare kare / yavaş izle
function kvTekrar() {
    if (!_kv || !_kv.kareler.length) { if (typeof showToast === 'function') showToast('Henüz kayıtlı görüntü yok — birkaç saniye bekle.', 'info'); return; }
    let bit = Date.now(), kareler = _kv.kareler.filter(function (x) { return x.t >= bit - 10000; });
    if (kareler.length < 3) kareler = _kv.kareler.slice();
    _kv.tekrar = { kareler: kareler, i: 0, oynuyor: true, sure: (kareler[kareler.length - 1].t - kareler[0].t) / 1000, gW: _kv.gW, gH: _kv.gH };
    _kv.hiz = 0.5;
    kvCiz(); kvTekrarOynat();
}
function kvTekrarBitir() { if (!_kv) return; clearTimeout(_kv.zam); _kv.tekrar = null; _kv.hiz = 1; _kv.sonKare = null; kvCiz(); }
function kvTekrarCiz() { let r = _kv && _kv.tekrar; if (!r) return; let k = r.kareler[r.i]; if (k) kvKareCiz(k.b); kvSurguGuncelle(); }
function kvTekrarOynat() {
    let r = _kv && _kv.tekrar; if (!r) return;
    clearTimeout(_kv.zam);
    if (!r.oynuyor) return kvOynatYazi();
    kvTekrarCiz();
    let simdi = r.kareler[r.i], sonraki = r.kareler[r.i + 1];
    let bekle = sonraki ? (sonraki.t - simdi.t) / _kv.hiz : 700;
    _kv.zam = setTimeout(function () { if (!_kv || !_kv.tekrar) return; r.i = sonraki ? r.i + 1 : 0; kvTekrarOynat(); }, Math.max(20, bekle));
    kvOynatYazi();
}

// ---------------------------------------------------------------- canlı kayıt
function kvKayitBasla() {
    if (!_kv || !_kv.akis || typeof MediaRecorder === 'undefined') { if (typeof showToast === 'function') showToast('Bu cihazda kayıt desteklenmiyor — 📁 Video ile telefonun kamerasından çek.', 'error'); return; }
    let tip = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); }) || '';
    let parca = [], rec;
    try { rec = new MediaRecorder(_kv.akis, tip ? { mimeType: tip, videoBitsPerSecond: 6000000 } : undefined); } catch (e) { if (typeof showToast === 'function') showToast('Kayıt başlatılamadı.', 'error'); return; }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) parca.push(e.data); };
    rec.onstop = function () {
        let b = new Blob(parca, { type: rec.mimeType || tip || 'video/webm' });
        if (!_kv) return;
        _kv.kayit = null; kvKameraKapat();
        kvVideoYukle(b, 'atis-' + new Date().toTimeString().slice(0, 8).replace(/:/g, '') + (/mp4/.test(b.type) ? '.mp4' : '.webm'));
    };
    rec.start(500);
    _kv.kayit = { rec: rec, bas: Date.now() };
    let rz = document.getElementById('kv-kayit-rozet'); if (rz) rz.hidden = false;
    clearInterval(_kv.kayitSaat); _kv.kayitSaat = setInterval(function () { let r = document.getElementById('kv-kayit-rozet'); if (!_kv || !_kv.kayit || !r) return; r.textContent = '● KAYIT ' + kvSure((Date.now() - _kv.kayit.bas) / 1000); }, 500);
    kvAltCiz();
}
function kvKayitBitir() { if (_kv && _kv.kayit) { clearInterval(_kv.kayitSaat); try { _kv.kayit.rec.stop(); } catch (e) {} } }

// ---------------------------------------------------------------- video dosyası
function kvDosya(inp) { let f = inp.files && inp.files[0]; inp.value = ''; if (f) kvVideoYukle(f, f.name || 'video'); }
function kvVideoYukle(blob, ad) {
    if (!_kv) return;
    if (_kv.videoUrl) { try { URL.revokeObjectURL(_kv.videoUrl); } catch (e) {} }
    _kv.video = blob; _kv.videoAd = ad; _kv.videoUrl = URL.createObjectURL(blob);
    _kv.mod = 'video'; _kv.hiz = 0.5; _kv.sekiller = [];
    kvCiz();
    let v = document.getElementById('kv-v'); if (v) { v.playbackRate = 0.5; v.play().catch(function () {}); }
}
function kvIndir() {
    if (!_kv || !_kv.video) return;
    let a = document.createElement('a'), ad = (_kv.k ? kvAd(_kv.k).replace(/\s+/g, '-') + '-' : '') + (_kv.videoAd || 'video');
    a.href = _kv.videoUrl; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
}
// Form Lab'a devret: yarışma/TV kapanır (tur kayıtlı, geri dönülür), Form Lab bu sporcu seçili açılır ve video analiz edilir
function kvFormLab() {
    if (!_kv || !_kv.video) return;
    let dosya = _kv.video instanceof File ? _kv.video : new File([_kv.video], _kv.videoAd || 'video.mp4', { type: _kv.video.type || 'video/mp4' }), k = _kv.k;
    kvKapat();
    try { if (typeof yzGirisKapat === 'function') yzGirisKapat(); } catch (e) {}
    try { if (document.getElementById('yz-tv') && typeof yzTvKapat === 'function') yzTvKapat(); } catch (e) {}
    if (typeof kmAracSec !== 'function') return;
    kmAracSec('formlab');
    let n = 0, bekle = function () {
        if (typeof flDosyaSecildi === 'function' && typeof _fl !== 'undefined' && document.querySelector('#km-icerik .fl')) {
            if (k) _fl.secili = k;
            flDosyaSecildi({ files: [dosya], value: '' });
        } else if (n++ < 100) setTimeout(bekle, 150);
    };
    bekle();
}

// ---------------------------------------------------------------- oynatma kontrolleri (video + tekrar)
function kvOynatDurdur() {
    if (!_kv) return;
    if (_kv.tekrar) { _kv.tekrar.oynuyor = !_kv.tekrar.oynuyor; return kvTekrarOynat(); }
    let v = _kv.mod === 'video' && document.getElementById('kv-v'); if (!v) return;
    if (v.paused) v.play().catch(function () {}); else v.pause();
}
function kvOynatYazi() {
    let b = document.getElementById('kv-oynat'); if (!b || !_kv) return;
    let oynuyor = _kv.tekrar ? _kv.tekrar.oynuyor : (function () { let v = document.getElementById('kv-v'); return v && !v.paused; })();
    b.textContent = oynuyor ? '⏸ Durdur' : '▶ Oynat';
}
function kvKare(yon) {
    if (!_kv) return;
    if (_kv.tekrar) { let r = _kv.tekrar; r.oynuyor = false; clearTimeout(_kv.zam); r.i = Math.max(0, Math.min(r.kareler.length - 1, r.i + yon)); kvTekrarCiz(); return kvOynatYazi(); }
    let v = _kv.mod === 'video' && document.getElementById('kv-v'); if (!v) return;
    v.pause(); v.currentTime = Math.max(0, Math.min((v.duration || 0) - 0.01, v.currentTime + yon / 30));
}
function kvHiz(h) {
    if (!_kv) return; _kv.hiz = h;
    let v = document.getElementById('kv-v'); if (v && _kv.mod === 'video') v.playbackRate = h;
    kvAltCiz();
    if (_kv.tekrar && _kv.tekrar.oynuyor) kvTekrarOynat();
}
function kvSurgu(val) {
    if (!_kv) return;
    let p = Number(val) / 1000;
    if (_kv.tekrar) { let r = _kv.tekrar; r.oynuyor = false; clearTimeout(_kv.zam); r.i = Math.round(p * (r.kareler.length - 1)); kvTekrarCiz(); return kvOynatYazi(); }
    let v = document.getElementById('kv-v'); if (v && v.duration) { v.pause(); v.currentTime = p * v.duration; }
}
function kvSurguGuncelle() {
    let s = document.getElementById('kv-surgu'); if (!s || !_kv || document.activeElement === s) return;
    if (_kv.tekrar) { let r = _kv.tekrar; s.value = r.kareler.length > 1 ? Math.round(r.i / (r.kareler.length - 1) * 1000) : 0; return; }
    let v = document.getElementById('kv-v'); if (v && v.duration) { s.value = Math.round(v.currentTime / v.duration * 1000); let z = document.getElementById('kv-zaman'); if (z) z.textContent = kvSure(v.currentTime) + ' / ' + kvSure(v.duration); }
}

// ---------------------------------------------------------------- çizim: çizgi + açı (normalize koordinat, ayna ile uyumlu)
function kvArac(a) { if (!_kv) return; _kv.arac = _kv.arac === a ? null : a; _kv.noktalar = []; kvAltCiz(); kvCizimYenile(); }
function kvAynaCevir() { if (!_kv) return; _kv.ayna = !_kv.ayna; let fr = document.getElementById('kv-cerceve'); if (fr) fr.classList.toggle('aynali', _kv.ayna); kvAltCiz(); kvCizimYenile(); }
function kvCizimSil() { if (!_kv) return; _kv.sekiller = []; _kv.noktalar = []; kvAltCiz(); kvCizimYenile(); }
function kvCizimDokun(e) {
    if (!_kv || !_kv.arac) return;
    let c = e.currentTarget, r = c.getBoundingClientRect();
    let x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (_kv.ayna) x = 1 - x; // çerçeve aynalanınca ekrandaki nokta görüntüde ters tarafta
    _kv.noktalar.push({ x: x, y: y });
    let gerek = _kv.arac === 'cizgi' ? 2 : 3;
    if (_kv.noktalar.length >= gerek) { _kv.sekiller.push({ tip: _kv.arac, n: _kv.noktalar.slice(0, gerek) }); _kv.noktalar = []; }
    kvAltCiz(); kvCizimYenile();
}
function kvCizimYenile() {
    let c = document.getElementById('kv-ciz'); if (!c || !_kv) return;
    let g = c.getContext('2d'), W = c.width, H = c.height, s = (window.devicePixelRatio || 1);
    g.clearRect(0, 0, W, H);
    // çizim katmanı da çerçeveyle birlikte aynalanıyor; yazılar ters okunmasın diye metni ayrıca düz çiz
    let P = function (p) { return { x: p.x * W, y: p.y * H }; };
    g.lineCap = 'round'; g.lineJoin = 'round';
    let yazi = function (t, p) {
        g.save(); g.font = '800 ' + Math.round(16 * s) + 'px Manrope, system-ui, sans-serif';
        let w = g.measureText(t).width + 14 * s, x = p.x + 10 * s, y = p.y - 30 * s;
        if (_kv.ayna) { g.translate(x + w / 2, 0); g.scale(-1, 1); g.translate(-(x + w / 2), 0); }
        g.fillStyle = 'rgba(10,14,13,.82)'; g.fillRect(x, y, w, 24 * s);
        g.fillStyle = '#FFE066'; g.fillText(t, x + 7 * s, y + 17 * s); g.restore();
    };
    _kv.sekiller.concat(_kv.noktalar.length ? [{ tip: 'nokta', n: _kv.noktalar }] : []).forEach(function (sk) {
        let n = sk.n.map(P);
        g.strokeStyle = '#FFE066'; g.lineWidth = 3 * s; g.fillStyle = '#FFE066';
        n.forEach(function (p) { g.beginPath(); g.arc(p.x, p.y, 5 * s, 0, Math.PI * 2); g.fill(); });
        if (sk.tip === 'nokta') return;
        g.beginPath(); g.moveTo(n[0].x, n[0].y); for (let i = 1; i < n.length; i++) g.lineTo(n[i].x, n[i].y); g.stroke();
        if (sk.tip === 'aci') {
            let a1 = Math.atan2(n[0].y - n[1].y, n[0].x - n[1].x), a2 = Math.atan2(n[2].y - n[1].y, n[2].x - n[1].x);
            let d = Math.abs(a1 - a2) * 180 / Math.PI; if (d > 180) d = 360 - d;
            g.beginPath(); g.arc(n[1].x, n[1].y, 26 * s, Math.min(a1, a2), Math.max(a1, a2), Math.abs(a1 - a2) > Math.PI); g.stroke();
            yazi(Math.round(d) + '°', n[1]);
        } else {
            let a = Math.atan2(n[1].y - n[0].y, n[1].x - n[0].x) * 180 / Math.PI, egim = Math.abs(a) > 90 ? 180 - Math.abs(a) : Math.abs(a);
            yazi(Math.round(egim) + '° eğim', { x: (n[0].x + n[1].x) / 2, y: (n[0].y + n[1].y) / 2 });
        }
    });
}

// ---------------------------------------------------------------- stil (koyu, sakin — video izlemek için)
function kvCss() {
    if (document.getElementById('kv-css')) return;
    let st = document.createElement('style'); st.id = 'kv-css';
    st.textContent = [
        '.kv-arka{position:fixed;inset:0;z-index:33000;background:#0b0e0d;color:#e7ecea;font-family:Manrope,"Plus Jakarta Sans",system-ui,sans-serif}',
        '.kv{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto}.kv>*{min-width:0}',
        '.kv-ust-sag{display:flex;gap:6px;flex-shrink:0}.kv-temiz .kv-ust,.kv-temiz .kv-alt{display:none}.kv-temiz .kv{grid-template-rows:minmax(0,1fr)}.kv-temiz .kv-sahne{cursor:pointer}',
        '.kv-tel{display:flex;gap:22px;align-items:center;max-width:640px;text-align:left;padding:20px;border:1px solid #27312e;border-radius:18px;background:#121816}.kv-tel img{width:210px;height:210px;border-radius:12px;background:#fff;flex-shrink:0}',
        '.kv-tel-qr-bos{width:210px;height:210px;border-radius:12px;background:#1b2220;flex-shrink:0}.kv-tel-m{display:flex;flex-direction:column;gap:10px;min-width:0}.kv-tel-m b{font-size:19px}.kv-tel-m ol{margin:0;padding-left:20px;display:grid;gap:5px;font-size:14px;color:#c9d3d0;line-height:1.45}',
        '.kv-tel-kod{font-size:13px;color:#93a19d}.kv-tel-kod b{color:#e7ecea;font-size:16px;letter-spacing:.08em}.kv-tel-durum{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:#FFE066}.kv-tel-durum i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:kvNabiz 1.2s ease-in-out infinite}',
        '@keyframes kvNabiz{50%{opacity:.25}}.kv-tel-btn{display:flex;gap:8px;flex-wrap:wrap}.kv-bos{max-height:100%;overflow:auto}',
        '@media (max-width:620px){.kv-tel{flex-direction:column;align-items:flex-start;padding:14px}.kv-tel img,.kv-tel-qr-bos{width:170px;height:170px;align-self:center}}',
        '.kv-ust{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid #222b28;min-width:0}',
        '.kv-baslik{display:flex;flex-direction:column;min-width:0;flex:1 1 180px}.kv-baslik b{font-size:18px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kv-baslik span{font-size:12px;color:#93a19d}',
        '.kv-sekmeler{display:flex;gap:4px;background:#161c1a;border-radius:12px;padding:4px;flex-shrink:0}.kv-sekmeler button{white-space:nowrap;min-height:40px;padding:0 14px;border:0;border-radius:9px;background:transparent;color:#b7c3bf;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}',
        '.kv-sekmeler button.aktif{background:#1f9d91;color:#fff}',
        '.kv-kapat{width:44px;height:44px;border-radius:12px;border:1px solid #2c3633;background:#161c1a;color:#e7ecea;font-size:18px;cursor:pointer}',
        '.kv-sahne{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}',
        '.kv-cerceve{position:relative;background:#000;border-radius:10px;overflow:hidden}.kv-cerceve.aynali{transform:scaleX(-1)}',
        '.kv-cerceve video,.kv-cerceve #kv-c{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}',
        '#kv-ciz{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}',
        '.kv-rozet{position:absolute;left:10px;top:10px;padding:5px 10px;border-radius:999px;background:rgba(10,14,13,.78);font-size:13px;font-weight:800;pointer-events:none}.kv-cerceve.aynali .kv-rozet{transform:scaleX(-1)}',
        '.kv-rozet.kayit{color:#ff6b6b}',
        '#kv-canli-kucuk{position:absolute!important;inset:auto 10px 10px auto!important;width:22%!important;height:auto!important;min-width:90px;border-radius:8px;border:2px solid rgba(255,255,255,.5);opacity:.9;pointer-events:none}',
        '.kv-ipucu{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:#FFE066;color:#1b1600;font-weight:800;font-size:13px;pointer-events:none;white-space:nowrap}',
        '.kv-bos{max-width:420px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;padding:20px}.kv-bos b{font-size:20px}.kv-bos p{margin:0;color:#93a19d;font-size:14px;line-height:1.5}',
        '.kv-alt{display:flex;flex-direction:column;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #222b28;background:#0f1312}',
        '.kv-alt-satir{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;justify-content:safe center;-webkit-overflow-scrolling:touch}.kv-alt-satir::-webkit-scrollbar{display:none}.kv-alt-satir>*{flex-shrink:0}',
        '.kv-grup{display:flex;gap:4px;align-items:center;background:#161c1a;border-radius:12px;padding:4px}.kv-grup button{min-width:44px;min-height:40px;padding:0 10px;border:0;border-radius:9px;background:transparent;color:#d5dddA;font:inherit;font-weight:700;font-size:13px;cursor:pointer}',
        '.kv-grup button.aktif{background:#e7ecea;color:#0b0e0d}.kv-grup button.genis{min-width:96px}.kv-et{font-size:12px;color:#93a19d;font-weight:700;padding:0 6px;font-variant-numeric:tabular-nums}',
        '.kv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid #2c3633;background:#161c1a;color:#e7ecea;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer}',
        '.kv-btn.ana{background:#1f9d91;border-color:#1f9d91;color:#fff}.kv-btn.kirmizi{background:#c0392b;border-color:#c0392b;color:#fff}.kv-btn.buyuk{min-height:52px;font-size:15px;padding:0 22px}',
        '.kv-surgu{flex:1 1 220px!important;min-width:160px;max-width:700px;accent-color:#1f9d91;height:32px}',
        '@media (orientation:landscape) and (max-height:560px){.kv{grid-template-columns:minmax(0,1fr) minmax(220px,34vw);grid-template-rows:auto minmax(0,1fr)}.kv-ust{grid-column:1/-1}.kv-sahne{grid-column:1;grid-row:2}.kv-alt{grid-column:2;grid-row:2;overflow-y:auto;border-top:0;border-left:1px solid #222b28;justify-content:flex-start}.kv-alt-satir{flex-wrap:wrap;overflow:visible;justify-content:flex-start}.kv-surgu{flex-basis:100%!important;max-width:none}.kv-temiz .kv{grid-template-columns:minmax(0,1fr)}}',
        '.kv button:focus-visible,.kv-btn:focus-within{outline:2px solid #FFE066;outline-offset:2px}',
        '.kv-grup button,.kv-btn{white-space:nowrap}',
        '@media (max-width:760px){.kv-uzun,.kv-baslik span{display:none}.kv-baslik b{font-size:16px}.kv-sekmeler button{padding:0 10px}.kv-btn{padding:0 12px}.kv-surgu{min-width:140px}}',
        '@media (max-width:480px){.kv-ust{flex-wrap:wrap;row-gap:6px}.kv-baslik{flex:1 1 0}.kv-sekmeler{order:3;width:100%}.kv-sekmeler button{flex:1}.kv-ust-sag .kv-kapat{width:40px;height:40px}.kv-alt-satir{flex-wrap:wrap;overflow:visible}.kv-surgu{flex-basis:100%!important;max-width:none}}',
        '@media (max-height:520px){.kv-ust{padding:4px 10px}.kv-baslik span{display:none}.kv-kapat{width:38px;height:38px}.kv-sekmeler button,.kv-grup button{min-height:34px}.kv-btn{min-height:36px}.kv-btn.buyuk{min-height:40px}.kv-alt{gap:4px;padding:6px 10px calc(6px + env(safe-area-inset-bottom))}.kv-surgu{height:24px}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- 📱 telefon kamerası (Form Lab'ın QR + WebRTC yayın altyapısı)
// Kullanıcı (2026-10-15): "PC'den açıyorum, PC'nin kamerası yok; telefonun kamerasını PC'ye, oradan TV'ye yansıtmak istiyorum;
// en az 720, en çok 1080; donarak hareket etmesin". Bilgisayar yayın odası açar, telefon QR'ı okutup /kamera sayfasını açar;
// görüntü doğrudan bu cihaza akar (aynı Wi-Fi en iyisi). Telefon 1080p gönderir, bağlantı yetmezse 720p'ye iner (asla altına
// değil — kamera.html akiciIzle). Bu pencere yalnız görüntü istediği için telefondaki iskelet analizi kapatılır (işlemci
// görüntüye kalsın); Form Lab açılınca geri açılır.
function kvKaynakSec(k) {
    if (!_kv || _kv.kaynak === k) return;
    _kv.kaynak = k; try { localStorage.setItem('kv_kaynak', k); } catch (e) {}
    let m = _kv.mod; kvKameraKapat(); _kv.tekrar = null; kvCiz();
    if (m === 'ayna' || m === 'canli') kvKameraAc();
}
async function kvTelAkis(mod) {
    if (typeof flTelefonAc !== 'function') {
        try { await dagskEkYukle('dagsk-km-formlab.js'); } catch (e) { kvSahneMesaj('<b>Telefon bağlantısı yüklenemedi</b><p>İnternet bağlantısını kontrol edip tekrar dene.</p>'); return null; }
    }
    if (!_kv || _kv.mod !== mod) return null;
    try { flCss(); } catch (e) {}
    if (!flTelBagliMi()) {
        if (!_fl.tel || _fl.tel.durum === 'hata' || _fl.tel.pasif) await flTelefonAc();
        if (!_kv || _kv.mod !== mod) return null;
        kvTelPanel();
        while (_kv && _kv.mod === mod && _kv.kaynak === 'tel' && !flTelBagliMi()) {
            await new Promise(function (r) { setTimeout(r, 400); });
            if (_kv && _kv.mod === mod && _fl.tel) kvTelPanel();
            if (_kv && _kv.mod === mod && !_fl.tel) { // QR penceresinde "Vazgeç"e basıldı
                kvSahneMesaj('<b>Telefon bağlantısı kapatıldı</b><p>Telefonu yeniden bağlayabilir ya da bu cihazın kamerasını kullanabilirsin.</p><button class="kv-btn ana" onclick="kvKaynakYenile()">📱 Telefonu bağla</button><button class="kv-btn" onclick="kvKaynakSec(\'yerel\')">📷 Bu cihaz</button>');
                return null;
            }
        }
        if (!_kv || _kv.mod !== mod || _kv.kaynak !== 'tel') return null;
        kvCiz();
    }
    let t = _fl.tel;
    let analizKapat = function () { try { if (t.kanal && t.kanal.readyState === 'open') { t.kanal.send(JSON.stringify({ analiz: 'kapat' })); return true; } } catch (e) {} return false; };
    if (!analizKapat()) { let n = 0, z = setInterval(function () { if (analizKapat() || ++n > 20) clearInterval(z); }, 500); }
    // alıcı tamponu biraz büyüsün: ağdaki küçük takılmalar donma olarak görünmesin (ayna zaten geriden gösteriyor)
    try { t.pc.getReceivers().forEach(function (r) { if (r.track && r.track.kind === 'video') { if ('jitterBufferTarget' in r) r.jitterBufferTarget = 150; else r.playoutDelayHint = 0.15; } }); } catch (e) {}
    clearInterval(_kv.telIzle);
    _kv.telIzle = setInterval(function () { if (_kv && _kv.akisTel && !flTelBagliMi()) { clearInterval(_kv.telIzle); let m = _kv.mod; kvKameraKapat(); kvCiz(); if (m === 'ayna' || m === 'canli') kvKameraAc(); } }, 2000);
    return t.akis;
}
function kvSahneMesaj(html) { let s = document.getElementById('kv-sahne'); if (s) s.innerHTML = '<div class="kv-bos">' + html + '</div>'; }
function kvTamEkran() {
    let el = document.getElementById('kv'); if (!el) return;
    if (document.fullscreenElement === el) { document.exitFullscreen().catch(function () {}); return; }
    if (document.fullscreenElement) { // TV ekranı tam ekrandaysa pencere onun içinde; tam ekranı pencereye devret
        document.exitFullscreen().then(function () { (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(function () {}); }).catch(function () {});
        return;
    }
    (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(function () {});
}
function kvTemiz(ac) { if (!_kv) return; _kv.temiz = !!ac; let kp = document.getElementById('kv'); if (kp) kp.classList.toggle('kv-temiz', _kv.temiz); setTimeout(kvYerlesim, 30); }
function kvKaynakYenile() { if (!_kv) return; let m = _kv.mod; kvKameraKapat(); kvCiz(); if (m === 'ayna' || m === 'canli') kvKameraAc(); }
// QR paneli — Form Lab'ın dar kutusu yerine bu pencereye göre: büyük QR, 3 adım, oda kodu, canlı durum
function kvTelPanel() {
    let t = typeof _fl !== 'undefined' && _fl.tel, sh = document.getElementById('kv-sahne'); if (!sh || !t) return;
    let durum = { hazirlaniyor: 'Yayın odası açılıyor…', bekliyor: 'Telefonun bağlanması bekleniyor…', baglaniyor: 'Telefon bulundu, görüntü bağlanıyor…', koptu: 'Bağlantı koptu — telefonda "Yeniden bağlan"a bas', hata: t.mesaj || 'Yayın odası açılamadı' }[t.durum] || '';
    let el = document.getElementById('kv-tel-durum');
    if (el && sh.querySelector('.kv-tel img')) { el.lastChild.textContent = durum; return; }
    let qr = t.link ? 'https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=10&data=' + encodeURIComponent(t.link) : '';
    sh.innerHTML = '<div class="kv-bos"><div class="kv-tel">' + (qr ? '<img src="' + qr + '" alt="Telefonla okutulacak QR kod">' : '<span class="kv-tel-qr-bos"></span>')
        + '<div class="kv-tel-m"><b>📱 Telefonun kamerasını bağla</b><ol><li>Telefonun kamerasını QR\'a tut, çıkan bağlantıya dokun.</li><li>Kameraya izin ver, telefonu yan çevirip sehpaya koy.</li><li>Görüntü bu ekrana gelir — bilgisayarı TV\'ye yansıtırsan TV\'de de görünür.</li></ol>'
        + (t.kod ? '<div class="kv-tel-kod">Oda kodu <b>' + kvEsc(t.kod) + '</b> · telefon ve bilgisayar aynı Wi-Fi\'de olursa en akıcı (720p–1080p)</div>' : '')
        + '<div class="kv-tel-durum" id="kv-tel-durum"><i></i><span>' + kvEsc(durum) + '</span></div>'
        + '<div class="kv-tel-btn"><button class="kv-btn" onclick="flTelefonKes()">Vazgeç</button><button class="kv-btn" onclick="kvKaynakSec(\'yerel\')">📷 Bu cihazın kamerası</button></div></div></div></div>';
}
