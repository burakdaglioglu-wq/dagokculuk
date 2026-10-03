/* ================================================================================================
   FORM LAB — Karışık Sınıf aracı (2026-10-03)
   Kullanıcı bir ArcherSense "Form Lab" videosu gösterdi: "karışık sınıfa böyle bir analiz ekleyebilir miyiz".
   Karar: tam paket + el modeli (hassasiyet > hız).
   Akış: sporcu seçilir → telefon sehpada, sporcunun karşısından 5-10 atış çekilir (ya da video seçilir) →
   video kare kare (FL_FPS) MediaPipe Tasks Vision ile işlenir: PoseLandmarker (vücut) her karede,
   HandLandmarker (el) yalnız çekiş eli yüzün yakınındayken. Sonra:
     - atış ayırma: çekiş eli çeneye yakın + yay kolu açık olan aralıklar = atış; aralığın sonu = bırakış
     - çapa kilidi: atış içinde çapa noktasının en uzun durgun aralığı (bekleme süresi)
     - çapa kayması: kilit aralığında çapa noktasının ortancadan en büyük sapması
     - atıştan atışa çapa noktası farkı, bırakışta yay kolu / çekiş dirseği / omuz eğimi, bırakış sonrası yay kolu düşüşü
   Uzunluklar omuz genişliğine bölünerek ölçülür (kamera uzaklığından bağımsız); mm yalnız TAHMİN — grubun
   ortalama omuz genişliğiyle çevrilir. Bulgular "olası" — Teknik Koçluk hata kimlikleriyle eşlenir ve tek
   dokunuşla sporcunun odağı yapılabilir (meta teknik_odak). Özet meta form_lab'a yazılır (video saklanmaz),
   karnede son analiz görünür (app.js formLabKarneHTML).
   ================================================================================================ */
var _fl = { secili: null, el: 'oto', durum: 'bos', mesaj: '', ilerleme: 0, sonuc: null, url: null, dosyaAd: '', yukleniyor: null, pose: null, hand: null, oynatRaf: 0, senk: false, kayitAnahtar: null };
const FL_TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const FL_MODEL_POSE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FL_MODEL_POSE_FULL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
function flPoseModel() { let mobil = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent); _fl.poseModelAd = mobil ? 'lite' : 'full'; _fl.poseModelUrl = mobil ? FL_MODEL_POSE : FL_MODEL_POSE_FULL; return _fl.poseModelUrl; }
const FL_MODEL_EL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const FL_FPS = 10, FL_MAKS_SN = 150;
// mm tahmini için ortalama omuz genişliği (akromiyon arası, cm) — yalnız gösterim; tüm eşikler omuz birimiyle
const FL_OMUZ_CM = { minikler: 28, kucukler: 31, yildizlar: 34, buyukler: 37 };
// MediaPipe Pose noktaları
const FL_P = { burun: 0, agizSol: 9, agizSag: 10, omuzSol: 11, omuzSag: 12, dirsekSol: 13, dirsekSag: 14, bilekSol: 15, bilekSag: 16, isaretSol: 19, isaretSag: 20, kalcaSol: 23, kalcaSag: 24 };

function flEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function flRoster() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(k => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); }
function flTr(n, b) { return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: b || 0, maximumFractionDigits: b || 0 }); }
function flKayitlar() { try { return kyDepoOku('form_lab'); } catch (e) { return {}; } }

// ---------------------------------------------------------------- ekran
function kmFormLabCiz() {
    flCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_fl.senk && typeof kyDepoSenkron === 'function') { _fl.senk = true; kyDepoSenkron('form_lab', () => flKayitlar(), false).then(() => { if (_kmAktifSekme === 'formlab' && _fl.durum !== 'analiz' && _fl.durum !== 'canli') kmFormLabCiz(); }).catch(() => {}); }
    // ön yükleme: araç açılınca modeller arka planda hazırlansın; "Uygulamada çek" beklemeden açılır
    if (!_fl.pose && !_fl.yukleniyor && !_fl.onYukHata) setTimeout(() => { if (_kmAktifSekme === 'formlab' && !_fl.pose && !_fl.yukleniyor) flModelYukle().then(flHazirlikYaz, () => { _fl.onYukHata = true; flHazirlikYaz(); }); flHazirlikYaz(); }, 300);
    flKayitliTelefonBekle();
    let L = flRoster();
    if (_fl.secili && !L.some(k => k.g + '|' + k.ad === _fl.secili)) _fl.secili = null;
    let sporcular = L.length ? L.map(k => {
        let key = k.g + '|' + k.ad, ilk = String(k.ad).trim().split(/\s+/)[0];
        return `<button class="fl-cip ${_fl.secili === key ? 'aktif' : ''}" onclick="flSporcuSec('${encodeURIComponent(key)}')" aria-pressed="${_fl.secili === key}">${flEsc(ilk)}</button>`;
    }).join('') : '<span class="fl-sessiz">Derste sporcu yok — yine de video analiz edebilirsin, kaydetmek için sporcu gerekir.</span>';
    let elSec = ['oto', 'sag', 'sol'].map(v => `<button class="fl-cip ${_fl.el === v ? 'aktif' : ''}" onclick="_fl.el='${v}'; kmFormLabCiz()">${{ oto: 'Otomatik', sag: 'Sağlak', sol: 'Solak' }[v]}</button>`).join('');
    let govde = '';
    if (_fl.durum === 'canli') govde = flCanliHTML();
    else if (_fl.durum === 'analiz') govde = flIlerlemeHTML();
    else if (_fl.durum === 'hata') govde = `<div class="fl-kutu fl-hata"><b>Analiz yapılamadı</b><p>${flEsc(_fl.mesaj)}</p><button class="fl-btn" onclick="_fl.durum='bos'; kmFormLabCiz()">Tamam</button></div>`;
    else if (_fl.durum === 'sonuc' && _fl.sonuc) govde = flSonucHTML();
    else govde = flBaslangicHTML();
    el.innerHTML = `<div class="fl">
        <div class="fl-ust"><div><div class="fl-etiket">KARIŞIK SINIF · FORM LAB</div><div class="fl-baslik">Çapa kilitli mi?</div>
            <div class="fl-alt">Videodan her atışın çapa noktası, bekleme süresi, kayması ve kol açıları. Atıştan atışa ne değişiyor, kare kare.</div></div>
            <div class="fl-ust-sag">${flSonKayitOzet()}</div></div>
        <div class="fl-satir"><span class="fl-satir-ad">Sporcu</span><div class="fl-cipler">${sporcular}</div></div>
        <div class="fl-satir"><span class="fl-satir-ad">Çekiş eli</span><div class="fl-cipler">${elSec}</div></div>
        ${flOmuzHTML()}
        ${govde}</div>`;
    if (_fl.durum === 'sonuc' && _fl.sonuc) { flOynaticiKur(); flCubukCiz(); }
    if (_fl.durum === 'canli') { flCanliBagla(); if (_fl.tv) flTvAdYaz(); }
}
function flSporcuSec(k) { k = decodeURIComponent(k); _fl.secili = _fl.secili === k ? null : k; _fl.kayitAnahtar = null; if (_fl.durum !== 'analiz') kmFormLabCiz(); }
function flSonKayitOzet() {
    if (!_fl.secili) return '<div class="fl-mini"><small>SPORCU SEÇ</small><b>—</b></div>';
    let son = flSporcuKayitlari(_fl.secili)[0];
    if (!son) return '<div class="fl-mini"><small>ÖNCEKİ ANALİZ</small><b>yok</b></div>';
    return `<div class="fl-mini"><small>SON ANALİZ · ${flEsc(son.tarih.slice(8, 10) + '.' + son.tarih.slice(5, 7))}</small><b>${son.puan}<span>/100</span></b></div>`;
}
function flSporcuKayitlari(key) {
    let d = flKayitlar();
    return Object.keys(d).filter(k => k.indexOf(key + '|') === 0 && d[k] && !d[k].sil).map(k => d[k]).sort((a, b) => (b.t || 0) - (a.t || 0));
}
function flBaslangicHTML() {
    return `<div id="fl-tel-yer">${flTelHTML()}</div><div class="fl-kutu fl-basla">
        <div class="fl-cekim">
            <svg viewBox="0 0 220 120" aria-hidden="true" class="fl-cekim-cizim"><rect x="8" y="34" width="34" height="56" rx="5"/><circle cx="25" cy="62" r="9"/><path d="M42 62h56" stroke-dasharray="4 5"/><circle cx="150" cy="30" r="10"/><path d="M150 40v40M150 80l-12 32M150 80l12 32M150 52l-40 0M150 52l26 10"/><path d="M110 30q-8 22 0 44" /><text x="25" y="108">sehpa</text><text x="150" y="16">sporcu</text></svg>
            <ul class="fl-ipucu">
                <li>Telefon <b>sehpada</b>, sporcunun <b>karşısında</b> (göğsü kameraya dönük), 3-5 m uzakta.</li>
                <li>Baştan ayağa ya da en az belden yukarısı kadrajda; yüz ve iki el hep görünsün.</li>
                <li><b>5-10 atış</b> art arda; kamera çekim boyunca kıpırdamasın.</li>
                <li>iPhone'da sorun çıkarsa: Ayarlar › Kamera › Biçimler › <b>En Uyumlu</b>.</li>
            </ul>
        </div>
        <div class="fl-butonlar">
            <button class="fl-btn fl-btn-ana" onclick="flCanliAc()">Uygulamada çek</button>
            <button class="fl-btn" onclick="flCanliAc('ayna')">Canlı açılar</button>
            <button class="fl-btn" onclick="flTelefonAc()" ${_fl.tel && !_fl.tel.pasif ? 'disabled' : ''}>Telefondan yayın al</button>
            ${flRoster().length >= 2 ? '<button class="fl-btn" onclick="flSiraBaslat()">Ders sırası</button>' : ''}
            <label class="fl-btn"><input type="file" accept="video/*" onchange="flDosyaSecildi(this)" hidden>Videodan seç</label>
        </div>
        <p class="fl-hazirlik" id="fl-hazirlik">${flHazirlikMetin()}</p>
        <p class="fl-sessiz">Video telefonda işlenir, hiçbir yere yüklenmez. Yapay zekâ modelleri (~13 MB) ilk seferde bir kez iner, sonra telefonda saklanır.</p>
    </div>`;
}
function flIlerlemeHTML() {
    let y = Math.round(_fl.ilerleme * 100);
    return `<div class="fl-kutu fl-ilerleme"><div class="fl-ilerleme-ust"><span>${flEsc(_fl.mesaj || 'Analiz ediliyor…')}</span><b>%${y}</b></div>
        <div class="fl-cubuk"><i style="width:${y}%"></i></div>
        <div class="fl-sessiz">Ekranı kapatma; uzun videolarda bir-iki dakika sürebilir.</div>
        <button class="fl-btn" onclick="_fl.iptal=true">Vazgeç</button></div>`;
}

// ---------------------------------------------------------------- model + kare kare analiz
// Önce GPU (telefonlarda genelde en hızlısı); yazılımsal WebGL'de (SwiftShader/llvmpipe) ya da ilk karelerde yavaşsa
// CPU'ya (XNNPACK) geçilir — bkz. flDosyaSecildi'deki hız ölçümü. Tercih bu cihaz için localStorage'da hatırlanır.
function flGpuYazilimsalMi() {
    try { let gl = document.createElement('canvas').getContext('webgl'), e = gl && gl.getExtension('WEBGL_debug_renderer_info'); return !gl || /swiftshader|llvmpipe|software/i.test(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return true; }
}
function flHazirlikMetin() {
    if (_fl.pose && _fl.hand) return '<i class="hazir"></i>Yapay zekâ hazır' + (_fl.cevrimdisi ? ' · internetsiz de çalışır' : '');
    if (_fl.onYukHata) return '<i class="hata"></i>' + (navigator.onLine === false ? flCevrimdisiMesaj() : 'Yapay zekâ indirilemedi — çekime basınca yeniden denenecek');
    return '<i></i>Yapay zekâ hazırlanıyor…';
}
function flCevrimdisiMesaj() { return 'İnternet yok ve yapay zekâ bu telefona henüz inmemiş. Bir kez internetliyken Form Lab’ı aç; sonra internetsiz de çalışır.'; }
// İnternetsiz kullanım (2026-10-03): modeller yüklendikten sonra kullanılan tüm dosyalar (kütüphane, wasm, iki model)
// kalıcı 'dagsk-ml-1' deposuna AÇIKÇA yazılır — service worker o sayfayı henüz yönetmiyorken (ilk açılış) inmiş
// olsalar bile. sw.js bu depodan önce-önbellek sunar; sürüm güncellemesinde silinmez.
async function flCevrimdisiHazirla() {
    try {
        if (!window.caches || !_fl.fileset) return;
        let c = await caches.open('dagsk-ml-1'), l = [FL_TV + '/vision_bundle.mjs', _fl.fileset.wasmLoaderPath, _fl.fileset.wasmBinaryPath, _fl.poseModelUrl || FL_MODEL_POSE, FL_MODEL_EL].filter(Boolean), hepsi = true;
        for (let u of l) { if (await c.match(u)) continue; try { let r = await fetch(u, { mode: 'cors' }); if (r.ok) await c.put(u, r); else hepsi = false; } catch (e) { hepsi = false; } }
        _fl.cevrimdisi = hepsi; flHazirlikYaz();
    } catch (e) {}
}
function flHazirlikYaz() { let el = document.getElementById('fl-hazirlik'); if (el) el.innerHTML = flHazirlikMetin(); if (_fl.pose) _fl.onYukHata = false; }
async function flModelYukle(delegate) {
    if (!delegate) { let k = null; try { k = localStorage.getItem('dagsk_formlab_delegate'); } catch (e) {} delegate = window.FL_DELEGATE || k || (flGpuYazilimsalMi() ? 'CPU' : 'GPU'); }
    if (_fl.pose && _fl.hand && _fl.delegate === delegate) return;
    if (_fl.yukleniyor && _fl.yukleniyorDelegate === delegate) return _fl.yukleniyor;
    try { if (_fl.pose) _fl.pose.close(); if (_fl.hand) _fl.hand.close(); } catch (e) {}
    _fl.pose = _fl.hand = null; _fl.yukleniyorDelegate = delegate;
    _fl.yukleniyor = (async () => {
        const v = _fl.vision || (_fl.vision = await import(FL_TV + '/vision_bundle.mjs'));
        const fs = _fl.fileset || (_fl.fileset = await v.FilesetResolver.forVisionTasks(FL_TV + '/wasm'));
        let kullanilan = delegate;
        const yap = async (Sinif, model, ek) => {
            try { return await Sinif.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: model, delegate: kullanilan }, runningMode: 'VIDEO' }, ek)); }
            catch (e) { if (kullanilan === 'CPU') throw e; kullanilan = 'CPU'; return await Sinif.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: model, delegate: 'CPU' }, runningMode: 'VIDEO' }, ek)); }
        };
        _fl.pose = await yap(v.PoseLandmarker, flPoseModel(), { numPoses: 3, minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4 });
        _fl.hand = await yap(v.HandLandmarker, FL_MODEL_EL, { numHands: 2, minHandDetectionConfidence: 0.35, minHandPresenceConfidence: 0.35, minTrackingConfidence: 0.35 });
        _fl.delegate = kullanilan;
        setTimeout(flCevrimdisiHazirla, 500);
    })().catch(e => { _fl.yukleniyor = null; throw e; });
    return _fl.yukleniyor;
}
function flBekle(v, olay, ms) { return new Promise((ok, hata) => { let f = () => { clearTimeout(z); v.removeEventListener(olay, f); ok(); }, z = setTimeout(() => { v.removeEventListener(olay, f); hata(new Error('zaman aşımı')); }, ms || 15000); v.addEventListener(olay, f); }); }
// iPhone Safari: sayfada olmayan bir videonun verisini oynatma denenmeden yüklemez (kullanıcının gördüğü "zaman aşımı"
// hatası buydu, 2026-10-03). Video görünmez şekilde sayfaya eklenir, kısa bir oynat-durdur ile çözücü açılır.
async function flVideoHazirla(url) {
    let v = document.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
    v.style.cssText = 'position:fixed; left:0; top:0; width:2px; height:2px; opacity:0; pointer-events:none; z-index:-1;';
    document.body.appendChild(v); v.src = url; v.load();
    if (v.readyState < 1) await flBekle(v, 'loadedmetadata', 30000);
    try { await v.play(); } catch (e) {} v.pause();
    if (v.readyState < 2) { try { await flBekle(v, 'loadeddata', 20000); } catch (e) {} }
    return v;
}
// tek kare atlama; takılırsa bir kez minik kaydırmayla yeniden dener, yine olmazsa false (kare atlanır)
async function flKareyeGit(v, t) {
    for (let deneme = 0; deneme < 2; deneme++) {
        let hedef = t + deneme * 0.001;
        if (Math.abs(v.currentTime - hedef) < 0.0005 && v.readyState >= 2) return true;
        let bekle = flBekle(v, 'seeked', 8000); v.currentTime = hedef;
        try { await bekle; return true; } catch (e) {}
    }
    return false;
}
function flIlerleme(oran, mesaj) {
    _fl.ilerleme = oran; if (mesaj) _fl.mesaj = mesaj;
    let k = document.querySelector('.fl-ilerleme'); if (!k) return;
    let y = Math.round(oran * 100);
    k.querySelector('.fl-ilerleme-ust span').textContent = _fl.mesaj; k.querySelector('.fl-ilerleme-ust b').textContent = '%' + y; k.querySelector('.fl-cubuk i').style.width = y + '%';
}
async function flDosyaSecildi(inp) {
    let f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
    if (_fl.url) { try { URL.revokeObjectURL(_fl.url); } catch (e) {} }
    _fl.olcum = null; _fl.takip = null; _fl.kisiKilit = false; _fl.hamBlob = f; _fl.disa = null; _fl.url = URL.createObjectURL(f); _fl.dosyaAd = f.name || 'video'; _fl.sonuc = null; _fl.kayitAnahtar = null; _fl.iptal = false;
    _fl.durum = 'analiz'; _fl.ilerleme = 0; _fl.mesaj = 'Yapay zekâ modelleri hazırlanıyor…'; kmFormLabCiz();
    try {
        let v; try { v = await flVideoHazirla(_fl.url); } catch (e) { throw new Error('Video açılamadı. Uygulamada çek seçeneğini kullan; ya da iPhone\'da Ayarlar › Kamera › Biçimler › "En Uyumlu" seçip tekrar çek.'); }
        _fl.gizliVideo = v;
        if (!v.videoWidth) throw new Error('Bu video biçimi bu cihazda açılamadı. Uygulamada çek seçeneğini kullan; ya da iPhone\'da Ayarlar › Kamera › Biçimler › "En Uyumlu" seçip tekrar çek.');
        await flModelYukle();
        let sure = Math.min(v.duration || 0, FL_MAKS_SN), N = Math.floor(sure * FL_FPS), kareler = [];
        if (N < FL_FPS * 2) throw new Error('Video çok kısa — en az birkaç atışlık (20 sn ve üzeri) bir video seç.');
        let takilan = 0; _fl.tsBaz = (_fl.sonTs || 0) + 1;
        if ('requestVideoFrameCallback' in v && !window.FL_SEEK) { kareler = await flOynatarakAnaliz(v, sure); N = 0; }
        for (let i = 0; i < N; i++) {
            if (_fl.iptal) throw new Error('Analiz durduruldu.');
            let t = i / FL_FPS, z0 = performance.now();
            if (!(await flKareyeGit(v, t))) {
                kareler.push({ t, p: null, h: null });
                if (++takilan > 12) throw new Error('Video karelerine ulaşılamadı. Uygulamada çek seçeneğiyle doğrudan çekmeyi dene.');
                continue;
            }
            takilan = 0;
            let z1 = performance.now();
            let ts = flTs(_fl.tsBaz + t * 1000), kare = { t, p: null, h: null };
            let r = _fl.pose.detectForVideo(v, ts), lm = flKisiSec(r && r.landmarks, v.videoWidth, v.videoHeight), z2 = performance.now(), z3 = z2;
            if (lm) {
                kare.p = lm.map(q => [q.x, q.y, q.visibility == null ? 1 : q.visibility]);
                if (flElGerekli(kare.p, v.videoWidth, v.videoHeight)) {
                    kare.hD = 1; let h = _fl.hand.detectForVideo(v, ts);
                    if (h && h.landmarks && h.landmarks.length) kare.h = h.landmarks.map(l => l.map(q => [q.x, q.y]));
                    z3 = performance.now();
                }
            }
            kareler.push(kare);
            let O = _fl.olcum || (_fl.olcum = { seek: 0, pose: 0, el: 0, n: 0 }); O.seek += z1 - z0; O.pose += z2 - z1; O.el += z3 - z2; O.n++;
            if (O.n === 8 && !window.FL_DELEGATE) { // hız ölçümü: GPU bu cihazda yavaşsa CPU'ya geç
                let kareMs = (O.pose + O.el) / O.n;
                if (_fl.delegate === 'GPU' && kareMs > 110) { flIlerleme((i + 1) / N, 'Bu cihaz için daha hızlı moda geçiliyor…'); await flModelYukle('CPU'); }
                try { localStorage.setItem('dagsk_formlab_delegate', _fl.delegate); } catch (e) {}
            }
            if (i % 4 === 0) { flIlerleme((i + 1) / N, 'Kare ' + (i + 1) + ' / ' + N + ' inceleniyor…'); await new Promise(r => setTimeout(r, 0)); }
        }
        flIlerleme(1, 'Atışlar ayrılıyor…');
        let W = v.videoWidth, H = v.videoHeight, sonuc = flHesapla(kareler, W, H);
        sonuc.W = W; sonuc.H = H; sonuc.sure = sure; sonuc.kareler = kareler;
        if (sonuc.atislar.length) { flIlerleme(1, 'Atış kareleri hazırlanıyor…'); await flKucukResimler(v, sonuc); }
        _fl.sonuc = sonuc; _fl.durum = 'sonuc';
    } catch (e) {
        _fl.durum = 'hata';
        _fl.mesaj = (e && e.message) ? e.message : 'Bilinmeyen bir hata oluştu.';
        if (/fetch|import|network|Failed/i.test(_fl.mesaj)) _fl.mesaj = (navigator.onLine === false ? flCevrimdisiMesaj() : 'Yapay zekâ modelleri indirilemedi — internet bağlantısını kontrol edip tekrar dene.');
    }
    if (_fl.gizliVideo) { try { _fl.gizliVideo.remove(); } catch (e) {} _fl.gizliVideo = null; }
    if (_kmAktifSekme === 'formlab') kmFormLabCiz();
}
// Hız: kare kare atlamak (seek) analizin en pahalı kısmıydı (~70 ms/kare). Video görünmez şekilde OYNATILIR, kareler
// geldikçe (requestVideoFrameCallback) işlenir; oynatma hızı cihazın yetişebildiği kadar ayarlanır (0,5x-3x) — hedef
// video zamanında en fazla ~0,12 sn arayla örnek. Sonra canlı çekimdeki gibi FL_FPS ızgarasına yeniden örneklenir.
function flOynatarakAnaliz(v, sure) {
    return new Promise((tamam, hata) => {
        let ham = [], sonT = -1, islemMs = 60, say = 0, bitti = false;
        const bitir = () => {
            if (bitti) return; bitti = true; v.pause();
            if (_fl.iptal) return hata(new Error('Analiz durduruldu.'));
            let N = Math.floor(sure * FL_FPS), kareler = [], j = 0;
            for (let i = 0; i < N; i++) {
                let t = i / FL_FPS;
                while (j + 1 < ham.length && Math.abs(ham[j + 1].t - t) <= Math.abs(ham[j].t - t)) j++;
                let h = ham[j];
                kareler.push(h && Math.abs(h.t - t) < 0.2 ? { t, p: h.p, h: h.h, hD: h.hD } : { t, p: null, h: null });
            }
            tamam(kareler);
        };
        const kare = (simdi, md) => {
            if (bitti) return;
            if (_fl.iptal || md.mediaTime >= sure - 0.02) return bitir();
            v.requestVideoFrameCallback(kare);
            let t = md.mediaTime; if (t - sonT < 1 / FL_FPS - 0.01) return; sonT = t;
            let z0 = performance.now(), ts = flTs(_fl.tsBaz + t * 1000), k = { t, p: null, h: null };
            let r = _fl.pose.detectForVideo(v, ts), lm = flKisiSec(r && r.landmarks, v.videoWidth, v.videoHeight);
            if (lm) {
                k.p = lm.map(q => [q.x, q.y, q.visibility == null ? 1 : q.visibility]);
                if (flElGerekli(k.p, v.videoWidth, v.videoHeight)) {
                    k.hD = 1; let h = _fl.hand.detectForVideo(v, ts);
                    if (h && h.landmarks && h.landmarks.length) k.h = h.landmarks.map(l => l.map(q => [q.x, q.y]));
                }
            }
            ham.push(k);
            islemMs = islemMs * 0.85 + (performance.now() - z0) * 0.15;
            if (++say % 8 === 0) {
                v.playbackRate = Math.max(0.5, Math.min(3, 0.12 / (islemMs / 1000 + 0.012)));
                flIlerleme(Math.min(1, t / sure), 'Video inceleniyor… ' + Math.round(t) + ' / ' + Math.round(sure) + ' sn');
            }
        };
        v.addEventListener('ended', bitir, { once: true });
        v.requestVideoFrameCallback(kare);
        v.currentTime = 0; v.playbackRate = 1;
        v.play().catch(e => { if (!bitti) { bitti = true; hata(new Error('Video oynatılamadı: ' + (e && e.message || e))); } });
    });
}

// ---------------------------------------------------------------- uygulamada çekim (canlı analiz)
// Kullanıcı (2026-10-03): "uygulama üzerinden de video çekebilelim". Kamera akışı uygulamanın içinde açılır; her kare
// ÇEKİM SIRASINDA analiz edilir (sonradan kare atlama yok → iPhone'daki zaman aşımı/HEVC sorunları yok), aynı anda
// MediaRecorder ile oynatma için kayıt alınır. Çekerken iskelet, kadraj uyarısı ve canlı atış sayacı görünür.
// MediaPipe zaman damgaları her örnek için artan olmalı: dosya analizi de canlı da _fl.sonTs'i sürdürür.
function flTs(ms) { let ts = Math.max(Math.round(ms), (_fl.sonTs || 0) + 1); _fl.sonTs = ts; return ts; }
function flCanliHTML() {
    let c = _fl.canli || {};
    if (c.mod === 'ayna') return flAynaHTML(c);
    return `<div class="fl-canli${_fl.tamEkran ? ' fl-tam' : ''}${_fl.tv ? ' fl-tv' : ''}">
        <div class="fl-canli-sahne" onclick="flKisiTiklandi(event)"><div class="fl-zoom" id="fl-zoom"><video id="fl-canli-video" playsinline muted autoplay></video><canvas id="fl-canli-katman"></canvas></div>
            ${flSiraCanliHTML()}
            <div class="fl-canli-ust"><span id="fl-canli-sure" class="fl-rozet ${c.kayit ? 'kayit' : ''}">${c.kayit ? '● KAYIT' : 'HAZIR'}</span><span class="fl-ust-sag"><span id="fl-ses-rozet" class="fl-rozet fl-rozet-ses" style="${_fl.ses ? '' : 'display:none'}" title="Kiriş sesi dinleniyor">SES</span><span id="fl-canli-tel" class="fl-rozet fl-rozet-tel" style="display:none">TELEFON</span><button class="fl-rozet fl-son-btn" onclick="flTekrarSon()">Son 3 sn</button>${flAyarHTML()}<span id="fl-canli-atis" class="fl-rozet">ATIŞ ${c.atisSay || 0}</span><button class="fl-rozet fl-tam-btn" onclick="flTamEkranDegis()">${_fl.tamEkran ? 'Küçült' : 'Tam ekran'}</button></span></div>
            <div class="fl-yon-ipucu" id="fl-yon-ipucu" style="display:none">Görüntü dikey geliyor — telefonu <b>yatay</b> çevirirsen ekranı doldurur</div>
            <div class="fl-canli-ipucu" id="fl-canli-ipucu">${flEsc(c.ipucu || '')}</div>
        </div>
        <div class="fl-kamera-satir">${flKameraSecHTML()}</div>
        <div class="fl-canli-kontrol">
            <button class="fl-btn" onclick="flCanliVazgec()">Vazgeç</button>
            <button class="fl-kayit-btn ${c.kayit ? 'kayitta' : ''}" id="fl-kayit-btn" onclick="flKayitDugme()" aria-label="${c.kayit ? 'Kaydı bitir ve analiz et' : 'Kaydı başlat'}"><i></i></button>
            <button class="fl-btn" onclick="flKameraCevir()" ${c.kayit ? 'disabled' : ''}>Kamerayı çevir</button>
        </div>
        <p class="fl-sessiz">Önce sporcu kadraja tam girsin ("Kadraj tamam" yazısı), sonra kırmızı düğmeye bas. 5-10 atış çekip durdur; sonuç hemen çıkar.</p>
    </div>`;
}
// ---------------------------------------------------------------- CANLI AÇILAR (ayna) + elle açı ölçer
// Kullanıcı (2026-10-03): "ortamda internet yok ama sporcuya en azından açıları göstermek istiyorum, analiz yapmasan da".
// Kayıt/analiz yok. Yapay zekâ telefondaysa iskelet + yay kolu / çekiş dirseği / omuz eğimi canlı yazılır. "Dondur" ile
// görüntü durur; "Açı" (3 nokta) ve "Eğim" (2 nokta, yataya göre) ile ekrana dokunarak ELLE ölçülür — bu kısım hiçbir
// şey indirmeden, yapay zekâ olmadan da çalışır. Noktalar sürüklenebilir.
function flAynaHTML(c) {
    let o = _fl.olcu || {};
    return `<div class="fl-canli fl-ayna${_fl.tamEkran ? ' fl-tam' : ''}${_fl.tv ? ' fl-tv' : ''}">
        <div class="fl-canli-sahne" onclick="flKisiTiklandi(event)"><div class="fl-zoom" id="fl-zoom"><video id="fl-canli-video" playsinline muted autoplay></video><canvas id="fl-canli-katman"></canvas><canvas id="fl-olcu-katman" class="${o.arac ? 'aktif' : ''}"></canvas></div>
            <div class="fl-canli-ust"><span id="fl-canli-sure" class="fl-rozet">${c.donuk ? 'DONDURULDU' : 'CANLI AÇILAR'}</span><span class="fl-ust-sag"><span id="fl-ses-rozet" class="fl-rozet fl-rozet-ses" style="${_fl.ses ? '' : 'display:none'}" title="Kiriş sesi dinleniyor">SES</span><span id="fl-canli-tel" class="fl-rozet fl-rozet-tel" style="display:none">TELEFON</span><button class="fl-rozet fl-son-btn" onclick="flTekrarSon()">Son 3 sn</button>${flAyarHTML()}<button class="fl-rozet fl-tam-btn" onclick="flTamEkranDegis()">${_fl.tamEkran ? 'Küçült' : 'Tam ekran'}</button></span></div>
            <div class="fl-yon-ipucu" id="fl-yon-ipucu" style="display:none">Görüntü dikey geliyor — telefonu <b>yatay</b> çevirirsen ekranı doldurur</div>
            <div class="fl-canli-ipucu" id="fl-canli-ipucu">${flEsc(c.ipucu || '')}</div>
        </div>
        <div class="fl-ayna-araclar">
            <button class="fl-btn ${o.arac === 'aci' ? 'secili' : ''}" data-arac="aci" onclick="flOlcuArac('aci')">Açı ölç</button>
            <button class="fl-btn ${o.arac === 'egim' ? 'secili' : ''}" data-arac="egim" onclick="flOlcuArac('egim')">Eğim</button>
            <button class="fl-btn" onclick="flOlcuTemizle()">Temizle</button>
        </div>
        <div class="fl-kamera-satir">${flKameraSecHTML()}</div>
        <div class="fl-canli-kontrol">
            <button class="fl-btn" onclick="flCanliVazgec()">Kapat</button>
            <button class="fl-dondur-btn ${c.donuk ? 'donuk' : ''}" onclick="flDondur()">${c.donuk ? 'Devam' : 'Dondur'}</button>
            <button class="fl-btn" onclick="flKameraCevir()">Kamerayı çevir</button>
        </div>
        <p class="fl-sessiz">Dondurup sporcuya göster. Açı ölç: omuz, dirsek, bilek gibi 3 noktaya sırayla dokun. Eğim: 2 noktaya dokun (yataya göre). Noktaları sürükleyerek düzelt.</p>
    </div>`;
}
function flDondur() {
    let c = _fl.canli, v = document.getElementById('fl-canli-video'); if (!c || !v) return;
    c.donuk = !c.donuk;
    if (c.donuk) v.pause(); else { v.play().catch(() => {}); flOlcuTemizle(true); if (_fl.olcu) { _fl.olcu.arac = null; flOlcuArac(null); } }
    let b = document.querySelector('.fl-dondur-btn'); if (b) { b.textContent = c.donuk ? 'Devam' : 'Dondur'; b.classList.toggle('donuk', c.donuk); }
    let ro = document.getElementById('fl-canli-sure'); if (ro) ro.textContent = c.donuk ? 'DONDURULDU' : 'CANLI AÇILAR';
}
function flOlcuArac(tip) {
    _fl.olcu = _fl.olcu || { ogeler: [], taslak: [] };
    _fl.olcu.arac = tip && _fl.olcu.arac !== tip ? tip : null; _fl.olcu.taslak = [];
    if (_fl.olcu.arac && _fl.canli && !_fl.canli.donuk) flDondur(); // hareketli görüntüde ölçülmez
    document.querySelectorAll('.fl-ayna-araclar .fl-btn[data-arac]').forEach(b => b.classList.toggle('secili', b.dataset.arac === _fl.olcu.arac));
    let cv = document.getElementById('fl-olcu-katman'); if (cv) cv.classList.toggle('aktif', !!_fl.olcu.arac);
    flCanliIpucu(_fl.olcu.arac ? (_fl.olcu.arac === 'aci' ? '3 noktaya sırayla dokun (ör. omuz → dirsek → bilek)' : '2 noktaya dokun (ör. iki omuz)') : '');
    flOlcuCiz();
}
function flOlcuTemizle(sessiz) { if (_fl.olcu) { _fl.olcu.ogeler = []; _fl.olcu.taslak = []; } flOlcuCiz(); if (!sessiz) flCanliIpucu(_fl.olcu && _fl.olcu.arac ? (_fl.olcu.arac === 'aci' ? '3 noktaya sırayla dokun' : '2 noktaya dokun') : ''); }
function flOlcuBagla() {
    let cv = document.getElementById('fl-olcu-katman'); if (!cv || cv._bagli) return; cv._bagli = true;
    let surukle = null;
    const nokta = e => { let r = cv.getBoundingClientRect(), z = (r.width && cv.clientWidth) ? r.width / cv.clientWidth : 1; return [(e.clientX - r.left) / z, (e.clientY - r.top) / z]; };
    cv.addEventListener('pointerdown', e => {
        let o = _fl.olcu; if (!o || !o.arac) return; e.preventDefault();
        let q = nokta(e), en = null;
        o.ogeler.forEach((g, gi) => g.n.forEach((n, ni) => { if (Math.hypot(n[0] - q[0], n[1] - q[1]) < 22) en = [gi, ni]; }));
        if (en) { surukle = en; try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
        o.taslak.push(q);
        let gerek = o.arac === 'aci' ? 3 : 2;
        if (o.taslak.length >= gerek) { o.ogeler.push({ tip: o.arac, n: o.taslak.slice(0, gerek) }); o.taslak = []; }
        flOlcuCiz();
    });
    cv.addEventListener('pointermove', e => { if (!surukle) return; _fl.olcu.ogeler[surukle[0]].n[surukle[1]] = nokta(e); flOlcuCiz(); });
    const birak = () => { surukle = null; };
    cv.addEventListener('pointerup', birak); cv.addEventListener('pointercancel', birak);
}
function flOlcuCiz() {
    let cv = document.getElementById('fl-olcu-katman'), v = document.getElementById('fl-canli-video'); if (!cv || !v) return;
    flOlcuBagla();
    let r = { width: v.clientWidth, height: v.clientHeight }, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; }
    let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, r.width, r.height);
    let o = _fl.olcu; if (!o) return;
    let etiket = (q, yazi) => { x.font = '700 16px "Roboto Mono", monospace'; let w = x.measureText(yazi).width + 14; x.fillStyle = '#ff6a1a'; x.fillRect(q[0] + 12, q[1] - 26, w, 24); x.fillStyle = '#fff'; x.fillText(yazi, q[0] + 19, q[1] - 8); };
    let nokta = q => { x.fillStyle = '#fff'; x.beginPath(); x.arc(q[0], q[1], 7, 0, 7); x.fill(); x.strokeStyle = '#ff6a1a'; x.lineWidth = 3; x.stroke(); };
    o.ogeler.forEach(g => {
        x.strokeStyle = '#ff6a1a'; x.lineWidth = 3; x.beginPath(); x.moveTo(g.n[0][0], g.n[0][1]); g.n.slice(1).forEach(q => x.lineTo(q[0], q[1])); x.stroke();
        if (g.tip === 'aci') {
            let a = flAci(g.n[0], g.n[1], g.n[2]);
            let b1 = Math.atan2(g.n[0][1] - g.n[1][1], g.n[0][0] - g.n[1][0]), b2 = Math.atan2(g.n[2][1] - g.n[1][1], g.n[2][0] - g.n[1][0]), fark = ((b2 - b1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
            x.beginPath(); x.arc(g.n[1][0], g.n[1][1], 26, b1, b1 + fark, fark < 0); x.stroke();
            etiket(g.n[1], Math.round(a || 0) + '°');
        } else {
            let dx = g.n[1][0] - g.n[0][0], dy = g.n[1][1] - g.n[0][1], e = Math.abs(Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI);
            x.setLineDash([6, 6]); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(g.n[0][0], g.n[0][1]); x.lineTo(g.n[0][0] + (dx >= 0 ? 1 : -1) * Math.hypot(dx, dy), g.n[0][1]); x.stroke(); x.setLineDash([]);
            etiket([(g.n[0][0] + g.n[1][0]) / 2, (g.n[0][1] + g.n[1][1]) / 2], String(Math.round(e * 10) / 10).replace('.', ',') + '° eğim');
        }
        g.n.forEach(nokta);
    });
    o.taslak.forEach(nokta);
    if (o.taslak.length > 1) { x.strokeStyle = 'rgba(255,106,26,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(o.taslak[0][0], o.taslak[0][1]); o.taslak.slice(1).forEach(q => x.lineTo(q[0], q[1])); x.stroke(); }
}
async function flCanliAc(mod) {
    if (!flTelBagliMi() && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) { _fl.durum = 'hata'; _fl.mesaj = 'Bu tarayıcı uygulama içinden kamera açmayı desteklemiyor. "Videodan seç" ile telefonun kamerasında çektiğin videoyu kullan.'; return kmFormLabCiz(); }
    _fl.sonuc = null; _fl.kayitAnahtar = null;
    _fl.durum = 'canli'; _fl.canli = { mod: mod === 'ayna' ? 'ayna' : 'kayit', kayit: false, kareler: [], bas: 0, yon: _fl.canliYon || 'environment', ipucu: 'Kamera açılıyor…', atisSay: 0, yakinBas: null };
    _fl.olcu = { ogeler: [], taslak: [], arac: null }; _fl.takip = null; _fl.kisiKilit = false;
    _fl.tamEkran = true; kmFormLabCiz();
    flTamIste(document.querySelector('.fl-canli')); // dokunuşun içinde (tarayıcı tam ekranı yalnız kullanıcı hareketiyle açar)
    try {
        await flKameraBaslat();
        flCanliIpucu('Yapay zekâ hazırlanıyor… (ilk seferde ~13 MB iner)');
        if (_fl.canli.mod === 'ayna') { // açılar modu yapay zekâsız da açılır: elle ölçer her zaman çalışır
            try { await flModelYukle(); flCanliIpucu(''); flCanliDongu(); }
            catch (e) { _fl.canli.aiYok = true; flCanliIpucu('Yapay zekâ bu telefonda yok — Dondur, sonra "Açı ölç" ile elle ölç'); }
            return;
        }
        await flModelYukle();
        flCanliIpucu('');
        flCanliDongu();
    } catch (e) {
        flCanliKapat();
        _fl.durum = 'hata';
        let m = String((e && e.message) || e || '');
        _fl.mesaj = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'Kamera izni verilmedi. Tarayıcının site ayarlarından bu siteye kamera izni ver ve tekrar dene.'
            : /fetch|import|network|Failed/i.test(m) ? (navigator.onLine === false ? flCevrimdisiMesaj() : 'Yapay zekâ modelleri indirilemedi — internet bağlantısını kontrol edip tekrar dene.') : 'Kamera açılamadı: ' + m;
        if (_kmAktifSekme === 'formlab') kmFormLabCiz();
    }
}
// ---------------------------------------------------------------- TELEFONDAN YAYIN + KAMERA SEÇ
// Kullanıcı (2026-10-03): "PC'den ana ekrana yansıtıyorum, çocukları telefonla çekiyorum; telefondaki görüntüyü canlı
// buraya nasıl aktarırım". (1) "Telefondan yayın al": bilgisayar oda açar, QR → telefonda /kamera.html; WebRTC ile
// görüntü doğrudan bu cihaza akar (sunucu yalnız eşleştirir: /api/yayin). Bağlıyken "Uygulamada çek" ve "Canlı
// açılar" telefonun görüntüsünü kullanır; "Kamerayı çevir" telefona komut gönderir. (2) "Kamera seç": Iriun / Camo /
// Windows Phone Link gibi uygulamalarla web kamerası olmuş telefon dahil, bilgisayardaki tüm kameralar.
const FL_ICE = [{ urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun.l.google.com:19302' }];
function flTelBagliMi() { let t = _fl.tel; return !!(t && t.durum === 'bagli' && t.akis && t.akis.getVideoTracks().some(x => x.readyState === 'live')); }
async function flTelefonAc(pasif) {
    if (!window.RTCPeerConnection) { if (!pasif) showToast('Bu tarayıcı canlı yayını desteklemiyor', 'error'); return; }
    flTelefonKes(true);
    _fl.tel = { durum: 'hazirlaniyor', surum: 0, pasif: !!pasif, ilk: true }; flTelYaz();
    try {
        // kayıtlı oda hâlâ geçerliyse onu kullan (telefon aynı bağlantıyla kendiliğinden bağlanır)
        let d = null, ko = flKayitliOda();
        if (ko) { let r0 = await fetch('/api/yayin/' + ko.kod + '?g=' + ko.gizli, { cache: 'no-store' }).catch(() => null); if (r0 && r0.ok) { d = ko; _fl.tel.kayitli = true; } else if (r0 && r0.status === 404) { try { localStorage.removeItem('dagsk_formlab_oda'); } catch (e) {} } }
        if (!d) {
            if (pasif) { _fl.tel = null; flTelYaz(); return; }
            let r = await fetch('/api/yayin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
            if (!r.ok) throw new Error('http ' + r.status);
            d = await r.json(); try { localStorage.setItem('dagsk_formlab_oda', JSON.stringify({ kod: d.kod, gizli: d.gizli })); } catch (e) {}
        }
        Object.assign(_fl.tel, { kod: d.kod, gizli: d.gizli, durum: 'bekliyor' });
        _fl.tel.link = location.origin + '/kamera#k=' + d.kod + '&g=' + d.gizli;
        flTelYaz(); flTelSorgu();
    } catch (e) { if (pasif) { _fl.tel = null; flTelYaz(); return; } _fl.tel = { durum: 'hata', mesaj: navigator.onLine === false ? 'Telefondan yayın için internet gerekir (iki cihazın birbirini bulması için). İnternetsizken telefonu Iriun/Camo ile web kamerası yapıp "Kamera seç"ten seçebilirsin.' : 'Yayın odası açılamadı — tekrar dene.' }; flTelYaz(); }
}
function flTelefonKes(sessiz) {
    let t = _fl.tel; if (!t) return;
    t.bitti = true; clearTimeout(t.sorgu);
    try { if (t.pc) t.pc.close(); } catch (e) {}
    if (_fl.akisTel) { _fl.akis = null; _fl.akisTel = false; }
    _fl.tel = null;
    if (!sessiz) { flTelYaz(); if (_fl.durum === 'canli' && _fl.canli && !_fl.canli.kayit) flKameraBaslat().catch(() => {}); }
}
async function flTelSorgu() {
    let t = _fl.tel; if (!t || t.bitti || !t.kod) return;
    try {
        let r = await fetch('/api/yayin/' + t.kod + '?g=' + t.gizli, { cache: 'no-store' });
        if (r.status === 404) { if (_fl.tel === t) { try { localStorage.removeItem('dagsk_formlab_oda'); } catch (e) {} _fl.tel = t.pasif ? null : { durum: 'hata', mesaj: 'Yayın odasının süresi doldu. Yeniden "Telefondan yayın al"a basıp QR\'ı okut.' }; flTelYaz(); } return; }
        let d = r.ok ? await r.json() : null;
        // ilk sorguda eski oturumdan kalan teklifi yok say (telefon şu an açık değil); son 60 sn içindeki teklif tazedir
        if (t.ilk && d) { t.ilk = false; if (d.teklif && (d.cevapSurum === d.teklifSurum || !d.zaman || Date.now() - d.zaman > 60000)) t.surum = d.teklifSurum; }
        if (d && d.teklif && d.teklifSurum > (t.surum || 0) && _fl.tel === t) await flTelCevapla(t, d.teklif, d.teklifSurum);
    } catch (e) {}
    if (_fl.tel === t && !t.bitti) t.sorgu = setTimeout(flTelSorgu, t.durum === 'bagli' ? 4000 : 1000);
}
async function flTelCevapla(t, sdp, surum) {
    t.surum = surum;
    try { if (t.pc) t.pc.close(); } catch (e) {}
    let pc = t.pc = new RTCPeerConnection({ iceServers: FL_ICE });
    pc.ontrack = e => { if (pc === t.pc) t.akis = (e.streams && e.streams[0]) || new MediaStream([e.track]); };
    pc.ondatachannel = e => { if (pc === t.pc) t.kanal = e.channel; };
    pc.onconnectionstatechange = () => {
        if (pc !== t.pc || _fl.tel !== t) return;
        let s = pc.connectionState, once = t.durum;
        t.durum = s === 'connected' ? 'bagli' : (s === 'failed' || s === 'disconnected' || s === 'closed') ? 'koptu' : 'baglaniyor';
        if (t.durum !== once) {
            flTelYaz();
            if (t.durum === 'bagli') { showToast('Telefon bağlandı — görüntü artık telefondan geliyor', 'success'); if (_fl.durum === 'canli' && _fl.canli && !_fl.canli.kayit) flKameraBaslat().catch(() => {}); }
        }
    };
    await pc.setRemoteDescription({ type: 'offer', sdp });
    await pc.setLocalDescription(await pc.createAnswer());
    await new Promise(r => { if (pc.iceGatheringState === 'complete') return r(); let z = setTimeout(r, 3000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(z); r(); } }); });
    await fetch('/api/yayin/' + t.kod + '/cevap?g=' + t.gizli, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sdp: pc.localDescription.sdp, surum }) });
    if (t.durum !== 'bagli') { t.durum = 'baglaniyor'; flTelYaz(); }
}
function flTelHTML() {
    let t = _fl.tel; if (!t) return '';
    if (t.durum === 'hata') return `<div class="fl-kutu fl-tel"><div class="fl-tel-bilgi"><b>Telefondan yayın</b><p>${flEsc(t.mesaj)}</p></div><button class="fl-btn" onclick="_fl.tel=null; flTelYaz()">Tamam</button></div>`;
    if (t.durum === 'bagli') return `<div class="fl-tel-serit"><i></i><span><b>Telefon bağlı</b> · çekim ve canlı açılar telefonun kamerasını kullanır</span><button class="fl-btn fl-btn-kucuk" onclick="flTelefonKes()">Bağlantıyı kes</button></div>`;
    if (t.pasif && t.durum === 'bekliyor') return `<div class="fl-tel-serit bekliyor"><i></i><span><b>Kayıtlı telefon bekleniyor</b> · telefonda DAĞ Form Lab kamera sayfasını aç (kod ${flEsc(t.kod || '')})</span><button class="fl-btn fl-btn-kucuk" onclick="_fl.tel.pasif=false; flTelYaz()">QR göster</button><button class="fl-btn fl-btn-kucuk" onclick="flKayitliOdaUnut()">Unut</button></div>`;
    let qr = t.link ? 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + encodeURIComponent(t.link) : '';
    let durumYazi = { hazirlaniyor: 'Yayın odası açılıyor…', bekliyor: 'Telefonun bağlanması bekleniyor…', baglaniyor: 'Telefon bulundu, görüntü bağlanıyor…', koptu: 'Bağlantı koptu — telefonda "Yeniden bağlan"a bas' }[t.durum] || '';
    return `<div class="fl-kutu fl-tel">
        <div class="fl-tel-ic">
            ${qr ? `<img src="${qr}" alt="Telefonla okutulacak QR kod" width="180" height="180">` : '<span class="fl-tel-qr-bos"></span>'}
            <div class="fl-tel-bilgi">
                <b>Telefonla okut</b>
                <ol><li>iPhone kamerasını QR'a tut, çıkan bağlantıya dokun.</li><li>Kameraya izin ver; telefonu sehpaya koy.</li><li>Görüntü buraya gelince "Uygulamada çek" ya da "Canlı açılar"ı aç.</li></ol>
                ${t.kod ? `<p class="fl-sessiz">Kod: <b>${flEsc(t.kod)}</b> · iki cihaz aynı Wi-Fi'de olursa en akıcı çalışır.</p>` : ''}
                <p class="fl-tel-durum"><i></i>${flEsc(durumYazi)}</p>
            </div>
        </div>
        <button class="fl-btn" onclick="flTelefonKes()">Vazgeç</button>
    </div>`;
}
function flTelYaz() {
    if (_fl.durum === 'bos' && typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme === 'formlab' && document.querySelector('.fl-basla')) { kmFormLabCiz(); return; }
    let yer = document.getElementById('fl-tel-yer');
    if (yer) yer.innerHTML = flTelHTML();
    let ro = document.getElementById('fl-canli-tel'); if (ro) ro.style.display = flTelBagliMi() && _fl.akisTel ? '' : 'none';
}
// ---- kamera seç
function flKameraSecHTML() { return `<select id="fl-kamera-sec" class="fl-kamera-sec" onchange="flKameraDegis(this.value)" aria-label="Kamera seç" style="display:none"></select>`; }
async function flKameraListesi() {
    let sel = document.getElementById('fl-kamera-sec'); if (!sel || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    let l = []; try { l = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); } catch (e) {}
    let secenek = [];
    if (flTelBagliMi()) secenek.push(['tel', 'Telefon (QR ile bağlı)']);
    secenek.push(flTelBagliMi() ? ['yerel', 'Bu cihazın kamerası'] : ['oto', 'Varsayılan kamera']);
    l.forEach((d, i) => secenek.push([d.deviceId, d.label || ('Kamera ' + (i + 1))]));
    let secili = _fl.kamera || (flTelBagliMi() ? 'tel' : 'oto');
    if (_fl.akisTel) secili = 'tel';
    sel.innerHTML = secenek.map(([v, a]) => `<option value="${flEsc(v)}" ${v === secili ? 'selected' : ''}>${flEsc(a)}</option>`).join('');
    sel.style.display = secenek.length > 2 || flTelBagliMi() ? '' : 'none';
    sel.disabled = !!(_fl.canli && _fl.canli.kayit);
}
function flKameraDegis(v) {
    if (_fl.canli && _fl.canli.kayit) return;
    _fl.kamera = v; try { localStorage.setItem('dagsk_formlab_kamera', v); } catch (e) {}
    flKameraBaslat().catch(() => showToast('Bu kamera açılamadı', 'error'));
}
function flAkisBirak() { if (_fl.akis && !_fl.akisTel) _fl.akis.getTracks().forEach(t => t.stop()); _fl.akis = null; _fl.akisTel = false; }
async function flKameraBaslat() {
    if (_fl.kamera == null) { try { _fl.kamera = localStorage.getItem('dagsk_formlab_kamera') || 'oto'; } catch (e) { _fl.kamera = 'oto'; } }
    let sec = _fl.kamera;
    // telefon bağlıysa (ve başka kamera seçilmediyse) görüntü telefondan
    if ((sec === 'tel' || sec === 'oto') && flTelBagliMi()) {
        if (_fl.akis !== _fl.tel.akis) { flAkisBirak(); _fl.akis = _fl.tel.akis; _fl.akisTel = true; }
        flCanliBagla(); flKameraListesi(); flTelYaz(); flYerelSesKapat(); flSesBaslat(_fl.tel.akis); return;
    }
    flAkisBirak();
    let ozel = sec && sec !== 'oto' && sec !== 'tel' && sec !== 'yerel';
    let video = ozel ? { deviceId: { exact: sec }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { facingMode: (_fl.canli && _fl.canli.yon) || 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
    try { _fl.akis = await navigator.mediaDevices.getUserMedia({ audio: false, video }); }
    catch (e) { if (ozel) { _fl.kamera = 'oto'; return flKameraBaslat(); } throw e; } // seçilen kamera artık yoksa varsayılana dön
    flCanliBagla(); flKameraListesi(); flTelYaz(); flYerelSesAc();
}
function flCanliBagla() {
    let v = document.getElementById('fl-canli-video'); if (!v || !_fl.akis) return;
    if (v.srcObject !== _fl.akis) { v.srcObject = _fl.akis; v.play().catch(() => {}); }
}
async function flKameraCevir() {
    if (!_fl.canli || _fl.canli.kayit) return;
    if (_fl.akisTel) { let k = _fl.tel && _fl.tel.kanal; if (k && k.readyState === 'open') { k.send(JSON.stringify({ cevir: 1 })); showToast('Telefonun kamerası çevriliyor', 'info'); } else showToast('Telefona ulaşılamadı', 'error'); return; }
    _fl.canli.yon = _fl.canliYon = _fl.canli.yon === 'environment' ? 'user' : 'environment';
    try { await flKameraBaslat(); } catch (e) { showToast('Kamera değiştirilemedi', 'error'); }
}
function flCanliIpucu(m) { if (_fl.canli && _fl.canli.ipucu !== m) flKadrajKonus(m || ''); if (_fl.canli) _fl.canli.ipucu = m; let el = document.getElementById('fl-canli-ipucu'); if (el) { el.textContent = m; el.classList.toggle('tamam', /^Kadraj tamam/.test(m)); } }
// Tam ekran (2026-10-03, kullanıcı: "tam ekran modunu da aç"). Destekleyen tarayıcıda gerçek tam ekran (Fullscreen API);
// iPhone Safari bir öğeyi tam ekrana alamadığı için orada sayfayı kaplayan sabit katman (.fl-tam) kullanılır.
function flTamIste(el) {
    if (!el || document.fullscreenElement || document.webkitFullscreenElement) return;
    try { let p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null; if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
function flTamCik() {
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch (e) {}
}
function flTamEkranDegis() {
    let el = document.querySelector('.fl-canli'); if (!el) return;
    _fl.tamEkran = !_fl.tamEkran; el.classList.toggle('fl-tam', _fl.tamEkran);
    let b = el.querySelector('.fl-tam-btn'); if (b) b.textContent = _fl.tamEkran ? 'Küçült' : 'Tam ekran';
    if (_fl.tamEkran) flTamIste(el); else flTamCik();
}
function flSahneTam() {
    let el = document.querySelector('.fl-sahne'); if (!el) return;
    let ac = !el.classList.contains('fl-tam'); el.classList.toggle('fl-tam', ac);
    let b = el.querySelector('.fl-sahne-tam'); if (b) b.textContent = ac ? 'Küçült' : 'Tam ekran';
    if (ac) flTamIste(el); else flTamCik();
}
// geri tuşu / ESC ile gerçek tam ekrandan çıkılınca sayfa katmanı da kapansın (kullanıcı katmanda sıkışmasın)
if (!window._flTamDinleyici) {
    window._flTamDinleyici = true;
    const degisti = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        _fl.tamEkran = false;
        document.querySelectorAll('.fl-canli.fl-tam, .fl-sahne.fl-tam').forEach(el => { el.classList.remove('fl-tam'); let b = el.querySelector('.fl-tam-btn, .fl-sahne-tam'); if (b) b.textContent = 'Tam ekran'; });
    };
    document.addEventListener('fullscreenchange', degisti); document.addEventListener('webkitfullscreenchange', degisti);
}
function flCanliKapat() {
    flTamCik(); flSesDurdur(); flYerelSesKapat(); _fl.halka = null; _fl.tekrarOynuyor = false; clearTimeout(_fl.tekrarZaman);
    cancelAnimationFrame(_fl.canliRaf);
    try { if (_fl.kaydedici && _fl.kaydedici.state !== 'inactive') _fl.kaydedici.stop(); } catch (e) {}
    flAkisBirak();
}
function flCanliVazgec() { flCanliKapat(); _fl.canli = null; _fl.durum = 'bos'; kmFormLabCiz(); }
function flKayitDugme() {
    let c = _fl.canli; if (!c || !_fl.pose) { showToast('Yapay zekâ hâlâ hazırlanıyor, birkaç saniye bekle', 'info'); return; }
    if (!c.kayit) flKayitBaslat(); else flCanliBitir();
}
function flKayitBaslat() {
    let c = _fl.canli, v = document.getElementById('fl-canli-video'); if (!v || !v.videoWidth) return;
    c.kareler = []; c.atisSay = 0; c.yakinBas = null; c.parcalar = []; c.sesler = []; c.W = v.videoWidth; c.H = v.videoHeight;
    let sesIzi = _fl.ses && _fl.ses.iz && _fl.ses.iz.readyState === 'live' ? [_fl.ses.iz] : [];
    let kayitAkisi = new MediaStream([..._fl.akis.getVideoTracks(), ...sesIzi]);
    let tipler = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    let tip = window.MediaRecorder ? (tipler.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '') : null;
    _fl.kaydedici = null;
    if (tip !== null) {
        try {
            let r = new MediaRecorder(kayitAkisi, tip ? { mimeType: tip, videoBitsPerSecond: 8000000 } : undefined);
            r.ondataavailable = e => { if (e.data && e.data.size) c.parcalar.push(e.data); };
            r.start(1000); _fl.kaydedici = r; c.tip = r.mimeType || tip || 'video/webm';
        } catch (e) { _fl.kaydedici = null; }
    }
    c.bas = performance.now(); c.kayit = true; flKonus('Kayıt başladı', 'kayit');
    let b = document.getElementById('fl-kayit-btn'); if (b) { b.classList.add('kayitta'); b.setAttribute('aria-label', 'Kaydı bitir ve analiz et'); }
    let ro = document.getElementById('fl-canli-sure'); if (ro) ro.classList.add('kayit');
}
async function flCanliBitir() {
    let c = _fl.canli; if (!c || !c.kayit) return;
    c.kayit = false; cancelAnimationFrame(_fl.canliRaf);
    let T = (performance.now() - c.bas) / 1000;
    let blob = null;
    if (_fl.kaydedici && _fl.kaydedici.state !== 'inactive') {
        let bitti = new Promise(ok => { _fl.kaydedici.onstop = ok; setTimeout(ok, 4000); });
        try { _fl.kaydedici.stop(); } catch (e) {}
        await bitti;
        if (c.parcalar.length) blob = new Blob(c.parcalar, { type: c.tip || 'video/webm' });
    }
    flAkisBirak();
    flTamCik(); _fl.tamEkran = false;
    if (T < 3) { _fl.durum = 'hata'; _fl.mesaj = 'Çekim çok kısa — en az birkaç atış çek.'; _fl.canli = null; return kmFormLabCiz(); }
    _fl.durum = 'analiz'; _fl.ilerleme = 1; _fl.mesaj = 'Atışlar ayrılıyor…'; kmFormLabCiz();
    await new Promise(r => setTimeout(r, 30));
    if (_fl.url) { try { URL.revokeObjectURL(_fl.url); } catch (e) {} }
    _fl.url = blob ? URL.createObjectURL(blob) : null; _fl.hamBlob = blob; _fl.disa = null;
    // canlı kareler düzensiz aralıklı → FL_FPS ızgarasına en yakın kare ile yeniden örnekle
    let ham = c.kareler, N = Math.floor(T * FL_FPS), kareler = [], j = 0;
    for (let i = 0; i < N; i++) {
        let t = i / FL_FPS;
        while (j + 1 < ham.length && Math.abs(ham[j + 1].t - t) <= Math.abs(ham[j].t - t)) j++;
        let h = ham[j];
        kareler.push(h && Math.abs(h.t - t) < 0.2 ? { t, p: h.p, h: h.h, hD: h.hD, snap: h.snap } : { t, p: null, h: null });
    }
    let sonuc = flHesapla(kareler, c.W, c.H);
    sonuc.W = c.W; sonuc.H = c.H; sonuc.sure = T; sonuc.kareler = kareler; sonuc.canli = true;
    // kiriş sesi bırakış anına yakınsa atış "sesle doğrulandı"
    (c.sesler || []).forEach(t => { let a = sonuc.atislar.find(z => t >= z.son / FL_FPS - 0.6 && t <= z.son / FL_FPS + 0.4); if (a) a.sesli = true; });
    if (sonuc.atislar.length) await flKucukResimlerCanli(sonuc);
    _fl.sonuc = sonuc; _fl.canli = null; _fl.durum = 'sonuc'; _fl.kayitAnahtar = null;
    if (_fl.sira && _fl.secili && sonuc.atislar.length) { flKaydet(); _fl.sira.kaydedilen++; }
    else if (_kmAktifSekme === 'formlab') kmFormLabCiz();
    if (sonuc.atislar.length) { let dg = flDegerlendir(sonuc.ozet, _fl.secili ? _fl.secili.split('|')[0] : 'yildizlar'); flKonus('Analiz hazır. ' + (dg.baslik || ''), 'analiz'); }
    else flKonus('Atış bulunamadı', 'analiz');
}
function flCanliDongu() {
    cancelAnimationFrame(_fl.canliRaf);
    let son = 0, snapC = document.createElement('canvas'); snapC.width = snapC.height = 160;
    const adim = () => {
        if (_fl.durum !== 'canli' || !_fl.canli) return;
        _fl.canliRaf = requestAnimationFrame(adim);
        let v = document.getElementById('fl-canli-video'), cv = document.getElementById('fl-canli-katman');
        if (!v) { flCanliKapat(); _fl.canli = null; _fl.durum = 'bos'; return; } // Karışık Sınıf kapandı → kamera kapansın
        flZoomUygula();
        if (!cv || v.readyState < 2 || !v.videoWidth || !_fl.pose || _fl.canli.donuk) return;
        if (flTekrarAcikMi() || _fl.halka) flTekrarKaydet(v);
        let simdi = performance.now(); if (simdi - son < 85) return; son = simdi;
        let c = _fl.canli, W = v.videoWidth, H = v.videoHeight, ts = flTs(simdi), kare = { t: (simdi - c.bas) / 1000, p: null, h: null };
        let r = _fl.pose.detectForVideo(v, ts), lm = flKisiSec(r && r.landmarks, v.videoWidth, v.videoHeight);
        if (lm) {
            kare.p = lm.map(q => [q.x, q.y, q.visibility == null ? 1 : q.visibility]);
            if (flElYuzdeMi(kare.p, W, H)) {
                if (flElGerekli(kare.p, W, H)) { kare.hD = 1; let h = _fl.hand.detectForVideo(v, ts); if (h && h.landmarks && h.landmarks.length) kare.h = h.landmarks.map(l => l.map(q => [q.x, q.y])); }
                if (c.kayit) { // atış küçük resmi için ağız çevresinden küçük bir kare
                    let S = Math.hypot((kare.p[11][0] - kare.p[12][0]) * W, (kare.p[11][1] - kare.p[12][1]) * H), k = S * 1.25;
                    let mx = (kare.p[9][0] + kare.p[10][0]) / 2 * W, my = (kare.p[9][1] + kare.p[10][1]) / 2 * H, x0 = mx - k / 2, y0 = my - k / 2;
                    try { snapC.getContext('2d').drawImage(v, x0, y0, k, k, 0, 0, 160, 160); kare.snap = { u: snapC.toDataURL('image/jpeg', 0.62), x0, y0, k }; } catch (e) {}
                }
            }
        }
        if (c.kayit) {
            c.kareler.push(kare);
            if (kare.t > FL_MAKS_SN) { flCanliBitir(); return; }
            let s = Math.floor(kare.t), ro = document.getElementById('fl-canli-sure');
            if (ro) ro.textContent = '● ' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
        }
        _fl.sonKare = { p: kare.p, t: performance.now() };
        flCanliCiz(v, cv, kare, W, H);
        flZoomHedefle(kare, W, H, v); flYonIpucu(W, H);
    };
    if (_fl.yakinlas == null) { try { _fl.yakinlas = localStorage.getItem('dagsk_formlab_yakinlas') !== '0'; } catch (e) { _fl.yakinlas = true; } }
    _fl.zoom = { z: 1, tx: 0, ty: 0 }; _fl.zoomHedef = null;
    _fl.canliRaf = requestAnimationFrame(adim);
}
// canlı katman: iskelet + çapa vizörü + kadraj uyarısı + canlı atış sayacı (kaba: vücut modelinin işaret parmağı)
function flCanliCiz(v, cv, kare, W, H) {
    let r = { width: v.clientWidth, height: v.clientHeight }, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; }
    let x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, r.width, r.height);
    let olc = Math.min(r.width / W, r.height / H), ox = (r.width - W * olc) / 2, oy = (r.height - H * olc) / 2;
    let c = _fl.canli;
    if (!kare.p) { flCanliIpucu('Sporcu görünmüyor — kadraja al'); return; }
    let p = kare.p, P = i => [ox + p[i][0] * W * olc, oy + p[i][1] * H * olc];
    x.lineWidth = 2.5; x.strokeStyle = 'rgba(90,160,255,.9)';
    [[11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]].forEach(([a, b]) => { let A = P(a), B = P(b); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); });
    x.strokeStyle = '#ffd166'; x.lineWidth = 3; let A = P(11), B = P(12); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
    // kadraj
    let icerde = i => p[i][0] > 0.02 && p[i][0] < 0.98 && p[i][1] > 0.02 && p[i][1] < 0.98 && p[i][2] > 0.5;
    let S = Math.hypot((p[11][0] - p[12][0]) * W, (p[11][1] - p[12][1]) * H) / Math.min(W, H);
    let ipucu = ![0, 11, 12, 15, 16].every(icerde) ? 'Kadraja sığmıyor — biraz uzaklaş' : S < 0.09 ? 'Çok uzak — biraz yaklaş' : 'Kadraj tamam' + (c.kayit ? '' : ' — kayda basabilirsin');
    if (_fl.kisiSayisi > 1) {
        if (!_fl.kisiKilit && !c.kayit) ipucu = 'Kadrajda ' + _fl.kisiSayisi + ' kişi — takip edilecek sporcuya dokun';
        let bz = P(0); x.font = '700 12px "Roboto Mono", monospace'; x.fillStyle = '#ff6a1a'; x.fillRect(bz[0] - 34, bz[1] - 46, 68, 20); x.fillStyle = '#fff'; x.fillText('SEÇİLİ', bz[0] - 25, bz[1] - 31);
    }
    // canlı atış sayacı: çekiş eli çeneye yakın + yay kolu açık ≥0,6 sn sonra uzaklaşırsa +1
    let ag = [(p[9][0] + p[10][0]) / 2 * W, (p[9][1] + p[10][1]) / 2 * H], Spx = S * Math.min(W, H) || 1;
    let mes = i => Math.hypot(p[i][0] * W - ag[0], p[i][1] * H - ag[1]) / Spx;
    let sagMi = mes(20) <= mes(19), ci = sagMi ? 20 : 19, yay = sagMi ? [11, 13, 15] : [12, 14, 16];
    let yayAci = flAci(...yay.map(i => [p[i][0] * W, p[i][1] * H])), yakin = mes(ci) < 0.75 && yayAci > 145;
    flBirakisTakip(c, yakin, kare.t);
    // açılar: eklem yanına + sol üstte pano (kayıt ve açılar modunda; açılar modunda büyük)
    let cek = sagMi ? [12, 14, 16] : [11, 13, 15], cekAci = flAci(...cek.map(i => [p[i][0] * W, p[i][1] * H]));
    let yO = [p[yay[0]][0] * W, p[yay[0]][1] * H], cO = [p[cek[0]][0] * W, p[cek[0]][1] * H], egim = Math.atan2(cO[1] - yO[1], Math.abs(cO[0] - yO[0]) || 1) * 180 / Math.PI;
    let jet = (q, yazi) => { x.font = '700 13px "Roboto Mono", monospace'; let w = x.measureText(yazi).width + 10; x.fillStyle = 'rgba(10,10,10,.72)'; x.fillRect(q[0] + 8, q[1] - 20, w, 18); x.fillStyle = '#9ec5ff'; x.fillText(yazi, q[0] + 13, q[1] - 7); };
    if (yayAci != null) jet(P(yay[1]), Math.round(yayAci) + '°');
    if (cekAci != null) jet(P(cek[1]), Math.round(cekAci) + '°');
    let pano = [['YAY KOLU', yayAci != null ? Math.round(yayAci) + '°' : '—'], ['ÇEKİŞ DİRSEĞİ', cekAci != null ? Math.round(cekAci) + '°' : '—'], ['OMUZ EĞİMİ', Math.abs(Math.round(egim)) + '°' + (Math.abs(egim) >= 3 ? (egim > 0 ? ' yay omzu ↑' : ' çekiş omzu ↑') : '')]];
    // pano yakınlaştırma katmanının DIŞINDA (HTML) — yakınlaşınca ekran dışına kaymasın
    let buyuk = c.mod === 'ayna', panoRenk = [FL_DURUM_RENK[flYayDurum(yayAci)] || '#fff', '#fff', FL_DURUM_RENK[flOmuzDurum(egim)]];
    flPanoYaz(pano.map(([ad, d], i) => [ad, d, panoRenk[i]]), buyuk);
    if (buyuk) { if (!(_fl.olcu && _fl.olcu.arac)) flCanliIpucu(ipucu.replace(' — kayda basabilirsin', '')); return; }
    let Cp = P(ci), bo = 30, renk = yakin ? '#ff9a3c' : 'rgba(255,255,255,.85)';
    x.strokeStyle = renk; x.lineWidth = 2.5;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { let cx = Cp[0] + sx * bo / 2, cy = Cp[1] + sy * bo / 2; x.beginPath(); x.moveTo(cx, cy - sy * 11); x.lineTo(cx, cy); x.lineTo(cx - sx * 11, cy); x.stroke(); });
    if (c.kayit) {
        if (yakin && c.yakinBas != null) ipucu = 'ÇAPADA · ' + flTr(kare.t - c.yakinBas, 1) + ' sn';
    }
    flCanliIpucu(ipucu);
}
async function flKucukResimlerCanli(s) {
    let c = document.createElement('canvas'); c.width = c.height = 220; let x = c.getContext('2d');
    let ortX = flOrt(s.atislar.map(z => z.merkez[0])), ortY = flOrt(s.atislar.map(z => z.merkez[1]));
    for (let a of s.atislar) {
        let en = null;
        for (let d = 0; d <= 12 && !en; d++) for (let i of [a.ortaKare - d, a.ortaKare + d]) if (!en && s.kareler[i] && s.kareler[i].snap && s.olc[i]) en = i;
        if (en == null) continue;
        let sn = s.kareler[en].snap, o = s.olc[en];
        let img = await new Promise(ok => { let im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = sn.u; });
        if (!img) continue;
        x.drawImage(img, 0, 0, 220, 220);
        let cx = q => [(q[0] - sn.x0) / sn.k * 220, (q[1] - sn.y0) / sn.k * 220];
        let ort = cx([o.agiz[0] + ortX * o.S, o.agiz[1] + ortY * o.S]), bu = cx([o.agiz[0] + a.merkez[0] * o.S, o.agiz[1] + a.merkez[1] * o.S]);
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(ort[0] - 9, ort[1]); x.lineTo(ort[0] + 9, ort[1]); x.moveTo(ort[0], ort[1] - 9); x.lineTo(ort[0], ort[1] + 9); x.stroke();
        x.fillStyle = '#ff6a1a'; x.beginPath(); x.arc(bu[0], bu[1], 5, 0, 7); x.fill();
        a.resim = c.toDataURL('image/jpeg', 0.78);
    }
}

// Hız (2026-10-03, kullanıcı: "hızlandıramaz mıyız"): el modeli işin ~%40'ı. Yalnız bir işaret parmağı ağza 1 omuz
// genişliğinden yakınken (çapa evresi) ve orada da İKİ KAREDE BİR çalışır; arada kalan kareler flHesapla'da son el
// konumuyla doldurulur. Çapa sabit durduğu için ölçüm neredeyse değişmez.
function flElGerekli(p, W, H) {
    let px = i => [p[i][0] * W, p[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let S = d(px(FL_P.omuzSol), px(FL_P.omuzSag)) || 1, ag = [(px(FL_P.agizSol)[0] + px(FL_P.agizSag)[0]) / 2, (px(FL_P.agizSol)[1] + px(FL_P.agizSag)[1]) / 2];
    if (Math.min(d(px(FL_P.isaretSol), ag), d(px(FL_P.isaretSag), ag), d(px(FL_P.bilekSol), ag), d(px(FL_P.bilekSag), ag)) > 1.0 * S) return false;
    _fl.elSira = !_fl.elSira; return _fl.elSira;
}
// el modeli yalnız iki bilekten biri yüze yakınken çalışır (hız)
function flElYuzdeMi(p, W, H) {
    let px = i => [p[i][0] * W, p[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let S = d(px(FL_P.omuzSol), px(FL_P.omuzSag)) || 1, burun = px(FL_P.burun);
    return Math.min(d(px(FL_P.bilekSol), burun), d(px(FL_P.bilekSag), burun), d(px(FL_P.isaretSol), burun), d(px(FL_P.isaretSag), burun)) < 1.6 * S;
}

// ---------------------------------------------------------------- ölçümler
function flAci(a, b, c) { // b köşesindeki açı (derece)
    let v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    let n = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]); if (!n) return null;
    return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n))) * 180 / Math.PI;
}
function flOrtanca(l) { let s = l.filter(x => x != null && isFinite(x)).sort((a, b) => a - b); if (!s.length) return null; let m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function flOrt(l) { l = l.filter(x => x != null && isFinite(x)); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : null; }
function flSapma(l) { l = l.filter(x => x != null && isFinite(x)); if (l.length < 2) return 0; let m = flOrt(l); return Math.sqrt(l.reduce((a, b) => a + (b - m) * (b - m), 0) / (l.length - 1)); }

function flHesapla(kareler, W, H) {
    let px = (p, i) => [p[i][0] * W, p[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    // 1) çekiş tarafı: otomatik → çeneye en çok yaklaşan el
    let taraf = _fl.el;
    if (taraf === 'oto') {
        let sag = [], sol = [];
        kareler.forEach(k => { if (!k.p) return; let S = d(px(k.p, FL_P.omuzSol), px(k.p, FL_P.omuzSag)) || 1, b = px(k.p, FL_P.burun); sag.push(d(px(k.p, FL_P.isaretSag), b) / S); sol.push(d(px(k.p, FL_P.isaretSol), b) / S); });
        let q = l => { let s = l.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length * 0.15)] : 9; };
        taraf = q(sag) <= q(sol) ? 'sag' : 'sol';
    }
    let C = taraf === 'sag'
        ? { cOmuz: FL_P.omuzSag, cDirsek: FL_P.dirsekSag, cBilek: FL_P.bilekSag, cIsaret: FL_P.isaretSag, yOmuz: FL_P.omuzSol, yDirsek: FL_P.dirsekSol, yBilek: FL_P.bilekSol }
        : { cOmuz: FL_P.omuzSol, cDirsek: FL_P.dirsekSol, cBilek: FL_P.bilekSol, cIsaret: FL_P.isaretSol, yOmuz: FL_P.omuzSag, yDirsek: FL_P.dirsekSag, yBilek: FL_P.bilekSag };
    // 2) kare başına ölçüler
    let olc = kareler.map(k => {
        if (!k.p) return null;
        let p = k.p, S = d(px(p, FL_P.omuzSol), px(p, FL_P.omuzSag));
        if (!S || S < 8) return null;
        // ölçü birimi omuz genişliği: iki omuz kadrajda ve net değilse (yakın çekim, kadraj dışı) kare ölçüme girmez
        let icerde = i => p[i][0] > 0.01 && p[i][0] < 0.99 && p[i][1] > 0.01 && p[i][1] < 0.99;
        if (p[FL_P.omuzSol][2] < 0.6 || p[FL_P.omuzSag][2] < 0.6 || !icerde(FL_P.omuzSol) || !icerde(FL_P.omuzSag) || !icerde(FL_P.burun)) return null;
        let agiz = [(px(p, FL_P.agizSol)[0] + px(p, FL_P.agizSag)[0]) / 2, (px(p, FL_P.agizSol)[1] + px(p, FL_P.agizSag)[1]) / 2];
        let cBilek = px(p, C.cBilek), capaPoz = px(p, C.cIsaret), capaEl = null;
        if (k.h) { // çekiş bileğine en yakın el; çapa = işaret+orta parmak kökleri (5,6,9,10)
            let en = null, enD = 1e9;
            k.h.forEach(h => { let w = [h[0][0] * W, h[0][1] * H], dd = d(w, cBilek); if (dd < enD) { enD = dd; en = h; } });
            if (en && enD < 1.2 * S) capaEl = [5, 6, 9, 10].reduce((a, i) => [a[0] + en[i][0] * W / 4, a[1] + en[i][1] * H / 4], [0, 0]);
        }
        let capa = capaEl || capaPoz, elVar = !!capaEl;
        let vek = [(capa[0] - agiz[0]) / S, (capa[1] - agiz[1]) / S];
        let yayKol = flAci(px(p, C.yOmuz), px(p, C.yDirsek), px(p, C.yBilek));
        let cekDirsek = flAci(px(p, C.cOmuz), px(p, C.cDirsek), cBilek);
        let yO = px(p, C.yOmuz), cO = px(p, C.cOmuz);
        let egim = Math.atan2(cO[1] - yO[1], Math.abs(cO[0] - yO[0]) || 1) * 180 / Math.PI; // + : yay omzu daha yukarıda
        let cD = px(p, C.cDirsek), oranX = (cD[0] - yO[0]) / ((cO[0] - yO[0]) || 1), hatY = yO[1] + (cO[1] - yO[1]) * oranX;
        let dirsekYuk = (cD[1] - hatY) / S; // + : dirsek omuz çizgisinin altında
        let gor = Math.min(p[C.yBilek][2], p[C.yDirsek][2], p[C.cDirsek][2]);
        return { S, agiz, capa, capaEl, capaPoz, elDenendi: !!k.hD, vek, mes: Math.hypot(vek[0], vek[1]), yayKol, cekDirsek, egim, dirsekYuk, elVar, gor, yBilekY: px(p, C.yBilek)[1] };
    });
    // Sabit kamerada sporcunun boyu değişmez: omuz genişliği video ortancasından çok farklı kareler (yakın çekim,
    // sahne değişimi, kadraja başka biri girmesi) ölçüm dışı.
    let medS = flOrtanca(olc.map(o => o && o.S));
    if (medS) olc = olc.map(o => o && o.S > medS * 0.65 && o.S < medS * 1.5 ? o : null);
    // 3) atış ayırma: el çeneye yakın + yay kolu açık
    let yakin = olc.map(o => !!o && o.mes < 0.75 && o.yayKol != null && o.yayKol > 145);
    for (let i = 1; i < yakin.length - 1; i++) { // tek karelik boşlukları doldur
        if (!yakin[i] && yakin[i - 1]) { let j = i; while (j < yakin.length && !yakin[j] && j - i < 3) j++; if (j < yakin.length && yakin[j]) for (let k = i; k < j; k++) yakin[k] = true; }
    }
    let atislar = [];
    for (let i = 0; i < yakin.length; i++) {
        if (!yakin[i]) continue;
        let j = i; while (j + 1 < yakin.length && yakin[j + 1]) j++;
        if ((j - i + 1) / FL_FPS >= 0.6) atislar.push({ bas: i, son: j });
        i = j;
    }
    // 4) her atış: çapa kilidi, kayma, bırakış ölçüleri
    let omuzCm = 34;
    atislar.forEach((a, n) => {
        a.no = n + 1;
        // Atış içinde tek çapa kaynağı: el modeli karelerin yarısından çoğunda bulduysa el (boşluklar son el
        // konumuyla doldurulur), yoksa vücut modelinin işaret parmağı. Kaynak karışınca nokta zıplar, kilit kırılır.
        let elSay = 0, denenen = 0; for (let i = a.bas; i <= a.son; i++) { if (olc[i] && olc[i].capaEl) elSay++; if (olc[i] && olc[i].elDenendi) denenen++; }
        let kaynakEl = elSay >= 3 && elSay / Math.max(1, denenen) >= 0.5, sonEl = null, ham = [];
        for (let i = a.bas; i <= a.son; i++) {
            let o = olc[i]; if (!o) { ham.push(null); continue; }
            let c = kaynakEl ? (o.capaEl || sonEl || o.capaPoz) : o.capaPoz; if (o.capaEl) sonEl = o.capaEl;
            o.capa = c; ham.push([(c[0] - o.agiz[0]) / o.S, (c[1] - o.agiz[1]) / o.S]);
        }
        // 3 karelik ortanca ile titreşim yumuşatma
        ham.forEach((v, j) => {
            let o = olc[a.bas + j]; if (!o || !v) return;
            let pen = [ham[j - 1], v, ham[j + 1]].filter(Boolean);
            o.vek = [flOrtanca(pen.map(q => q[0])), flOrtanca(pen.map(q => q[1]))];
        });
        let hiz = []; for (let i = a.bas; i <= a.son; i++) { let o = olc[i], o0 = olc[i - 1]; hiz.push(o && o0 ? Math.hypot(o.vek[0] - o0.vek[0], o.vek[1] - o0.vek[1]) : 1); }
        let hizY = hiz.map((h, i) => (h + (hiz[i - 1] != null ? hiz[i - 1] : h) + (hiz[i + 1] != null ? hiz[i + 1] : h)) / 3);
        let enIyi = null;
        for (let i = 0; i < hizY.length; i++) {
            if (hizY[i] >= 0.04) continue;
            let j = i; while (j + 1 < hizY.length && (hizY[j + 1] < 0.04 || (j + 2 < hizY.length && hizY[j + 2] < 0.04) || (j + 3 < hizY.length && hizY[j + 3] < 0.04))) j++;
            if (!enIyi || j - i > enIyi[1] - enIyi[0]) enIyi = [i, j];
            i = j;
        }
        if (enIyi && (enIyi[1] - enIyi[0] + 1) / FL_FPS >= 0.4) { a.kilitBas = a.bas + enIyi[0]; a.kilitSon = a.bas + enIyi[1]; }
        else { a.kilitBas = null; a.kilitSon = null; }
        let kb = a.kilitBas != null ? a.kilitBas : a.bas, ks = a.kilitSon != null ? a.kilitSon : a.son;
        let vx = [], vy = []; for (let i = kb; i <= ks; i++) if (olc[i]) { vx.push(olc[i].vek[0]); vy.push(olc[i].vek[1]); }
        a.merkez = [flOrtanca(vx), flOrtanca(vy)];
        a.kayma = 0; a.egri = [];
        for (let i = a.bas; i <= a.son; i++) {
            let o = olc[i]; if (!o) { a.egri.push(null); continue; }
            let dd = Math.hypot(o.vek[0] - a.merkez[0], o.vek[1] - a.merkez[1]); a.egri.push(dd);
            if (i >= kb && i <= ks) a.kayma = Math.max(a.kayma, dd);
        }
        a.tutma = a.kilitBas != null ? (a.kilitSon - a.kilitBas + 1) / FL_FPS : 0;
        a.cekis = (a.son - a.bas + 1) / FL_FPS;
        let r0 = Math.max(a.bas, a.son - 2), on = olc.slice(r0, a.son + 1).filter(Boolean), net = on.filter(o => o.gor > 0.6);
        a.yayKol = flOrt(on.map(o => o.yayKol)); a.cekDirsek = flOrt(on.map(o => o.cekDirsek)); a.egim = flOrt(net.map(o => o.egim)); a.dirsekYuk = flOrt(net.map(o => o.dirsekYuk));
        // bırakış sonrası 0,5 sn: yay bileği ne kadar indi (omuz birimi, + aşağı)
        let once = olc[a.son], sonra = olc[Math.min(olc.length - 1, a.son + Math.round(FL_FPS * 0.5))];
        a.dusus = once && sonra ? (sonra.yBilekY - once.yBilekY) / once.S : null;
        a.elVar = elSay / Math.max(1, denenen);
        a.ortaKare = Math.round((kb + ks) / 2);
    });
    // 5) özet (Atış değil ile çıkarılanlar hariç — flOzetHesapla)
    let ozet = flOzetHesapla(atislar, taraf);
    return { atislar, ozet, olc, omuzCm };
}
// omuz birimi → mm (tahmini, grubun ortalama omuz genişliğiyle)
function flMm(birim, g) { return Math.round(birim * flOmuzCm(g) * 10); }
function flPuan(oz) {
    if (!oz.n) return 0;
    let p = 100;
    p -= Math.min(30, oz.capaFark * 220);            // çapa noktası atıştan atışa (≈0,1 omuz = ~34 mm → -22)
    p -= Math.min(20, (oz.kaymaOrt || 0) * 260);      // kilitliyken kayma
    p -= Math.min(15, (oz.tutmaSap || 0) * 14);       // bekleme süresi tutarsızlığı
    p -= Math.min(15, (oz.yayKolSap || 0) * 1.6);     // yay kolu açısı tutarsızlığı
    p -= Math.min(12, oz.dusen / oz.n * 24);          // bırakışta düşen yay kolu
    p -= Math.min(8, oz.kilitsiz / oz.n * 16);        // hiç kilitlenmeyen atış
    return Math.max(0, Math.round(p));
}
function flBulgular(oz, g) {
    let b = [], mm = x => flMm(x, g);
    if (!oz.n) return b;
    // omuz/dirsek: atışların çoğunda aynı yönde olmalı (tek karelik model hatası bulgu üretmesin)
    if (oz.n >= 3 && mm(oz.capaFark) >= 8) b.push({ hata: 'ankraj', ciddi: mm(oz.capaFark) >= 14, baslik: 'Çapa noktası atıştan atışa değişiyor', deger: '≈' + mm(oz.capaFark) + ' mm fark', not: 'Çekiş eli her atışta çenenin biraz farklı bir yerine geliyor. Oklar dikeyde dağılır.' });
    if (mm(oz.kaymaOrt || 0) >= 6) b.push({ hata: 'ankraj', ciddi: mm(oz.kaymaOrt) >= 10, baslik: 'Çapada el kayıyor', deger: 'ort. ≈' + mm(oz.kaymaOrt) + ' mm', not: 'El çenede dururken kıpırdıyor; genişleme yerine kolla oynama olabilir.' });
    if (oz.dusen / oz.n >= 0.4) b.push({ hata: 'kol-dusme', ciddi: oz.dusen / oz.n >= 0.6, baslik: 'Bırakışta yay kolu düşüyor', deger: oz.dusen + '/' + oz.n + ' atış', not: 'Bırakıştan sonraki yarım saniyede yay eli belirgin şekilde iniyor.' });
    if ((oz.egimOrt || 0) >= 6) b.push({ hata: 'omuz', ciddi: oz.egimOrt >= 10, baslik: 'Yay omzu kalkık', deger: flTr(oz.egimOrt) + '° eğim', not: 'Omuz çizgisi yay tarafında yukarı kalkıyor.' });
    if ((oz.dirsekYukOrt || 0) >= 0.15) b.push({ hata: 'kolla-cekme', ciddi: oz.dirsekYukOrt >= 0.25, baslik: 'Çekiş dirseği alçakta', deger: 'omuz çizgisinin altında', not: 'Dirsek ok hizasının altında kalınca çekiş sırttan değil koldan yapılıyor.' });
    if (oz.tutmaOrt != null && (oz.tutmaOrt > 4.5 || (oz.tutmaOrt < 0.8 && oz.kilitsiz < oz.n)) || (oz.n >= 3 && (oz.tutmaSap || 0) > 1)) b.push({ hata: 'donma', ciddi: (oz.tutmaSap || 0) > 1.6, baslik: oz.tutmaOrt > 4.5 ? 'Nişanda uzun bekliyor' : oz.tutmaOrt < 0.8 ? 'Çapada beklemeden bırakıyor' : 'Bekleme süresi her atışta farklı', deger: flTr(oz.tutmaOrt || 0, 1) + ' sn ±' + flTr(oz.tutmaSap || 0, 1), not: 'Her atışta aynı ritim, aynı bekleme isteriz.' });
    return b;
}

// ---------------------------------------------------------------- atış küçük resimleri (çapa anı, yüz-el kırpması)
async function flKucukResimler(v, s) {
    let c = document.createElement('canvas'); c.width = 220; c.height = 220; let x = c.getContext('2d');
    for (let a of s.atislar) {
        let o = s.olc[a.ortaKare]; if (!o) continue;
        if (!(await flKareyeGit(v, a.ortaKare / FL_FPS))) continue;
        let mx = (o.agiz[0] + o.capa[0]) / 2, my = (o.agiz[1] + o.capa[1]) / 2, k = o.S * 1.15;
        x.drawImage(v, mx - k / 2, my - k / 2, k, k, 0, 0, 220, 220);
        let sx = 220 / k, cx = (q => [(q[0] - (mx - k / 2)) * sx, (q[1] - (my - k / 2)) * sx]);
        // ortalama çapa noktası (artı) + bu atışın çapası (nokta)
        let ort = cx([o.agiz[0] + a.merkez[0] * o.S - (a.merkez[0] - (flOrt(s.atislar.map(z => z.merkez[0])))) * o.S, o.agiz[1] + a.merkez[1] * o.S - (a.merkez[1] - (flOrt(s.atislar.map(z => z.merkez[1])))) * o.S]);
        let bu = cx([o.agiz[0] + a.merkez[0] * o.S, o.agiz[1] + a.merkez[1] * o.S]);
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(ort[0] - 9, ort[1]); x.lineTo(ort[0] + 9, ort[1]); x.moveTo(ort[0], ort[1] - 9); x.lineTo(ort[0], ort[1] + 9); x.stroke();
        x.fillStyle = '#ff6a1a'; x.beginPath(); x.arc(bu[0], bu[1], 5, 0, 7); x.fill();
        a.resim = c.toDataURL('image/jpeg', 0.78);
    }
}

// ---------------------------------------------------------------- sonuç ekranı
function flSonucHTML() {
    let s = _fl.sonuc, oz = s.ozet, g = _fl.secili ? _fl.secili.split('|')[0] : 'yildizlar', mm = x => flMm(x, g);
    if (!s.atislar.length) return `<div class="fl-kutu fl-hata"><b>Videoda atış bulunamadı</b>
        <p>Çekiş eli çeneye gelen ve yay kolu açık olan bir an yakalanamadı. Sporcu önden, yüzü ve iki eli görünecek şekilde çekilmeli; kamera sabit olmalı.</p>
        <div class="fl-butonlar"><button class="fl-btn fl-btn-ana" onclick="flCanliAc()">Yeniden çek</button><label class="fl-btn"><input type="file" accept="video/*" onchange="flDosyaSecildi(this)" hidden>Başka video seç</label></div></div>`;
    let puan = flPuan(oz), bul = flBulgular(oz, g);
    let deg = flDegerlendir(oz, g), dur = id => { let x = deg.satirlar.find(z => z.id === id); return x ? x.d : ''; };
    let kpi = (b, e, a, d) => `<div class="fl-kpi${d ? ' fl-kpi-' + d : ''}"><b>${b}</b><span>${e}</span>${a ? `<small>${a}</small>` : ''}</div>`;
    let kartlar = s.atislar.map(a => { let [hd, hy] = flAtisHukmu(a, s.atislar.length > 1, mm); return `<div class="fl-atis fl-atis-${hd}${a.haric ? ' haric' : ''}"><button class="fl-atis-git" onclick="flAtisaGit(${a.no})">
        ${a.resim ? `<img src="${a.resim}" alt="Atış ${a.no} çapa anı">` : '<span class="fl-atis-resimsiz"></span>'}
        <span class="fl-atis-no">${String(a.no).padStart(2, '0')}</span><span class="fl-atis-hukum" style="background:${FL_DURUM_RENK[hd]}">${hy}</span>
        <span class="fl-atis-bilgi"><b>${a.kilitBas == null ? 'kilitlenmedi' : flTr(a.tutma, 1) + ' sn'}</b><small>kayma ≈${mm(a.kayma)} mm · yay kolu ${a.yayKol != null ? Math.round(a.yayKol) + '°' : '—'}</small>${a.dusus != null && a.dusus > 0.18 ? '<em>yay kolu düştü</em>' : ''}${s.atislar.length > 1 && mm(a.capaUzak) >= 10 ? '<em>çapa farklı yerde</em>' : ''}${a.sesli ? '<em class="sesli">bırakış sesle doğrulandı</em>' : ''}</span>
    </button><div class="fl-atis-aksiyon"><button onclick="flAtisHaric(${a.no})">${a.haric ? 'Geri ekle' : 'Atış değil'}</button><button onclick="flAtisBildir(${a.no})">Ölçüm hatalı</button></div></div>`; }).join('');
    let bulHTML = bul.length ? bul.map(b => `<div class="fl-bulgu ${b.ciddi ? 'ciddi' : ''}"><div><b>${flEsc(b.baslik)}</b><span class="fl-deger">${flEsc(b.deger)}</span><p>${flEsc(b.not)}</p></div>
        ${_fl.secili ? `<button class="fl-btn fl-btn-kucuk" onclick="flOdakYap('${b.hata}')">Teknik odak yap</button>` : ''}</div>`).join('')
        : '<div class="fl-bulgu iyi"><div><b>Belirgin bir sorun görünmüyor</b><p>Çapa yeri, bekleme ve kol açıları atıştan atışa tutarlı.</p></div></div>';
    let kayitli = !!_fl.kayitAnahtar;
    return `<div class="fl-sonuc">
        ${flSiraSonucHTML()}
        ${_fl.url ? `<div class="fl-sahne"><video id="fl-video" src="${_fl.url}" playsinline muted controls controlslist="nofullscreen noremoteplayback" disablepictureinpicture preload="auto"></video><canvas id="fl-katman"></canvas><span class="fl-sahne-dugmeler"><button class="fl-rozet fl-sahne-cubuk" onclick="flCubukGorunum()">${_fl.cubukGorunum ? 'Video' : 'Çubuk'}</button><button class="fl-rozet fl-sahne-tam" onclick="flSahneTam()">Tam ekran</button></span></div>` : '<p class="fl-sessiz">Bu tarayıcı çekimi kaydedemedi; analiz yapıldı ama video oynatılamıyor.</p>'}
        <div class="fl-grafik-kutu"><div class="fl-grafik-ust"><span>ÇEKİŞ ELİ ↔ ÇENE · ${oz.n} ATIŞ</span><span class="fl-lejant"><i class="k"></i>çapa kilitli <i class="b"></i>bırakış</span></div>${flGrafikSVG(s)}</div>
        ${oz.n ? flOzetHTML(s, g) : '<div class="fl-kutu"><b>Bütün atışlar analizden çıkarıldı</b><p class="fl-sessiz">Aşağıdaki kartlardan "Geri ekle" ile atışları geri alabilirsin.</p></div>'}
        <div class="fl-kpiler">
            ${kpi(puan + '<span>/100</span>', 'tutarlılık', 'çapa, bekleme ve kol açısına göre')}
            ${kpi(oz.n, 'atış bulundu', oz.kilitsiz ? oz.kilitsiz + ' tanesi kilitlenmedi' : 'hepsinde çapa kilitlendi')}
            ${kpi(oz.n > 1 ? '≈' + mm(oz.capaFark) + '<span> mm</span>' : '—', 'çapa noktası farkı', 'atıştan atışa · hedef 6 mm altı', dur('capa'))}
            ${kpi('≈' + mm(oz.kaymaOrt || 0) + '<span> mm</span>', 'çapada kayma', 'kilitliyken · hedef 4 mm altı', dur('kayma'))}
            ${kpi(flTr(oz.tutmaOrt || 0, 1) + '<span> sn</span>', 'çapada bekleme', '±' + flTr(oz.tutmaSap || 0, 1) + ' sn · hedef 1-4 sn', dur('ritim'))}
            ${kpi(oz.yayKolOrt != null ? Math.round(oz.yayKolOrt) + '°' : '—', 'yay kolu (bırakış)', '±' + flTr(oz.yayKolSap || 0, 0) + '° · hedef 165°+', dur('yay'))}
        </div>
        <div class="fl-baslik2 fl-baslik-satir"><span>Her atış, çapa anında</span><span class="fl-baslik-ek">${oz.haric ? oz.haric + ' atış analizden çıkarıldı · ' : ''}<button class="fl-link" onclick="flKacanBildir()">Atış kaçırıldı mı?</button></span></div>
        <div class="fl-atislar">${kartlar}</div>
        <div id="fl-cubuk-yer">${flCubukHTML(s)}</div>
        <div class="fl-baslik2">Olası bulgular</div>
        <div class="fl-bulgular">${bulHTML}</div>
        <p class="fl-sessiz">Ölçümler tek kameradan yapay zekâ tahminidir; mm değerleri grubun ortalama omuz genişliğiyle çevrilmiş yaklaşık değerlerdir. Karar eğitmenindir.</p>
        <div class="fl-butonlar">
            ${_fl.secili ? `<button class="fl-btn fl-btn-ana" onclick="flKaydet()" ${kayitli ? 'disabled' : ''}>${kayitli ? 'Karneye kaydedildi' : 'Sporcunun karnesine kaydet'}</button>` : '<span class="fl-sessiz">Kaydetmek için yukarıdan sporcu seç.</span>'}
            <button class="fl-btn" onclick="flPaylas()">WhatsApp'ta paylaş</button>
            <button class="fl-btn" onclick="flCanliAc()">Yeni çekim</button>
        </div>
        ${_fl.url ? `<div class="fl-baslik2">Videoyu sakla</div>
        <div class="fl-butonlar" id="fl-indir-yer">${flIndirAlaniHTML()}${_fl.hamBlob ? '<button class="fl-btn" onclick="flHamIndir()">Ham videoyu indir</button>' : ''}</div>
        <p class="fl-sessiz">Analizli video: iskelet, açılar ve çapa çizimleri videonun üstüne işlenir (videonun süresi kadar sürer). Telefonda paylaşım menüsünden "Videoyu Kaydet" ile Fotoğraflar'a, bilgisayarda İndirilenler'e kaydedilir.</p>` : ''}
    </div>`;
}
function flGrafikSVG(s) {
    let W = 1000, H = 150, N = s.olc.length, x = i => (i / Math.max(1, N - 1)) * W, y = v => 14 + Math.min(1, v / 1.6) * (H - 28);
    let yol = '', ac = false;
    s.olc.forEach((o, i) => { if (!o) { ac = false; return; } yol += (ac ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(o.mes).toFixed(1); ac = true; });
    let bantlar = s.atislar.map(a => (a.kilitBas != null ? `<rect x="${x(a.kilitBas).toFixed(1)}" y="0" width="${Math.max(2, x(a.kilitSon) - x(a.kilitBas)).toFixed(1)}" height="${H}" class="kb"/>` : '') +
        `<line x1="${x(a.son).toFixed(1)}" x2="${x(a.son).toFixed(1)}" y1="0" y2="${H}" class="br"/><text x="${(x(a.bas) + 2).toFixed(1)}" y="12" class="no">${a.no}</text>`).join('');
    return `<svg class="fl-grafik" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Çekiş elinin çeneye uzaklığı zaman içinde; turuncu bantlar çapanın kilitli olduğu anlar">
        <line x1="0" x2="${W}" y1="${y(0.75).toFixed(1)}" y2="${y(0.75).toFixed(1)}" class="esik"/>${bantlar}<path d="${yol}" class="egri"/>
        <line id="fl-imlec" x1="0" x2="0" y1="0" y2="${H}" class="imlec"/></svg>`;
}

// ---------------------------------------------------------------- oynatıcı + Form Lab katmanı
function flOynaticiKur() {
    let v = document.getElementById('fl-video'), c = document.getElementById('fl-katman'); if (!v || !c) return;
    cancelAnimationFrame(_fl.oynatRaf);
    let ciz = () => {
        if (!document.body.contains(v)) return;
        flKatmanCiz(v, c);
        _fl.oynatRaf = requestAnimationFrame(ciz);
    };
    v.addEventListener('loadedmetadata', () => {
        if (!isFinite(v.duration)) { v.currentTime = 1e101; v.addEventListener('timeupdate', function geri() { v.removeEventListener('timeupdate', geri); v.currentTime = 0; }); }
        flKatmanCiz(v, c);
    }, { once: true });
    _fl.oynatRaf = requestAnimationFrame(ciz);
    // tarayıcının yerleşik tam ekranında çizim katmanı yok ("tam ekranda analizler kayboluyor") → bizimkine yönlendir
    v.addEventListener('dblclick', e => { e.preventDefault(); flSahneTam(); });
    v.addEventListener('fullscreenchange', () => { if (document.fullscreenElement === v) { flTamCik(); setTimeout(flSahneTam, 150); } });
    v.addEventListener('webkitbeginfullscreen', () => { try { v.webkitExitFullscreen(); } catch (e) {} setTimeout(flSahneTam, 300); });
    let svg = document.querySelector('.fl-grafik');
    if (svg) svg.addEventListener('click', e => { let r = svg.getBoundingClientRect(); v.currentTime = Math.max(0, (e.clientX - r.left) / r.width * _fl.sonuc.sure); });
}
function flAtisaGit(no) {
    let a = _fl.sonuc && _fl.sonuc.atislar[no - 1], v = document.getElementById('fl-video'); if (!a || !v) return;
    v.currentTime = Math.max(0, a.bas / FL_FPS - 0.6); v.play().catch(() => {});
    document.querySelector('.fl-sahne').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function flKatmanCiz(v, c) {
    let s = _fl.sonuc; if (!s) return;
    let r = { width: v.clientWidth, height: v.clientHeight }, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; }
    let x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, r.width, r.height);
    // video içeriğinin kutu içindeki yeri (contain)
    let olc = Math.min(r.width / s.W, r.height / s.H), ox = (r.width - s.W * olc) / 2, oy = (r.height - s.H * olc) / 2;
    let i = Math.min(s.olc.length - 1, Math.max(0, Math.round(v.currentTime * FL_FPS)));
    let im = document.getElementById('fl-imlec'); if (im) { let gx = (i / Math.max(1, s.olc.length - 1)) * 1000; im.setAttribute('x1', gx); im.setAttribute('x2', gx); }
    if (_fl.cubukGorunum) { x.fillStyle = 'rgba(8,8,8,.93)'; x.fillRect(0, 0, r.width, r.height); }
    flKatmanCizX(x, r.width, r.height, olc, ox, oy, i);
}
// Form Lab çizimi (cetvel, iskelet, açılar, çapa vizörü, sayaç) — ekrandaki oynatıcı ve indirilen analizli video ortak.
function flKatmanCizX(x, gen, yuk, olc, ox, oy, i) {
    let s = _fl.sonuc; if (!s) return;
    let P = q => [ox + q[0] * olc, oy + q[1] * olc];
    let o = s.olc[i], k = s.kareler[i];
    let mono = '600 11px "Roboto Mono", ui-monospace, monospace';
    // sol cetvel
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '10px "Roboto Mono", monospace'; x.lineWidth = 1;
    for (let yy = 20, n = 0; yy < yuk - 10; yy += 12, n++) { x.beginPath(); x.moveTo(6, yy); x.lineTo(n % 5 ? 12 : 18, yy); x.stroke(); }
    let atis = s.atislar.find(a => i >= a.bas - 2 && i <= a.son + 4);
    // üst yazı
    x.font = mono; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('DAĞ · FORM LAB' + (atis ? '  ·  ATIŞ ' + atis.no + '/' + s.atislar.length : ''), 26, 20);
    if (!o || !k || !k.p) return;
    let p = k.p.map(q => [q[0] * s.W, q[1] * s.H]);
    // iskelet
    let cizgi = (a, b, renk, kal) => { x.strokeStyle = renk; x.lineWidth = kal; x.beginPath(); let A = P(p[a]), B = P(p[b]); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); };
    [[11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]].forEach(z => cizgi(z[0], z[1], 'rgba(90,160,255,.85)', 2.5));
    cizgi(11, 12, '#ffd166', 3);
    [11, 12, 13, 14, 15, 16].forEach(n => { let A = P(p[n]); x.fillStyle = '#ff4d4d'; x.beginPath(); x.arc(A[0], A[1], 4, 0, 7); x.fill(); });
    let taraf = s.ozet.taraf, yD = taraf === 'sag' ? 13 : 14, cD = taraf === 'sag' ? 14 : 13;
    let etiket = (q, metin, renk) => { let A = P(q); x.font = mono; let w = x.measureText(metin).width + 10; x.fillStyle = 'rgba(10,10,10,.72)'; x.fillRect(A[0] + 8, A[1] - 18, w, 16); x.fillStyle = renk; x.fillText(metin, A[0] + 13, A[1] - 6); };
    if (o.yayKol != null) etiket(p[yD], 'YAY KOLU ' + Math.round(o.yayKol) + '°', FL_DURUM_RENK[flYayDurum(o.yayKol)]);
    if (o.cekDirsek != null) etiket(p[cD], 'ÇEKİŞ ' + Math.round(o.cekDirsek) + '°', '#9ec5ff');
    // çapa vizörü
    let A = [ox + o.capa[0] * olc, oy + o.capa[1] * olc], kilit = atis && atis.kilitBas != null && i >= atis.kilitBas && i <= atis.kilitSon;
    let bo = Math.max(26, o.S * olc * 0.22), renk = kilit ? '#ff9a3c' : 'rgba(255,255,255,.85)', kol = bo * 0.4;
    x.strokeStyle = renk; x.lineWidth = 2.5;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { let cx = A[0] + sx * bo / 2, cy = A[1] + sy * bo / 2; x.beginPath(); x.moveTo(cx, cy - sy * kol); x.lineTo(cx, cy); x.lineTo(cx - sx * kol, cy); x.stroke(); });
    x.fillStyle = renk; x.beginPath(); x.arc(A[0], A[1], 3, 0, 7); x.fill();
    if (atis) {
        let yazi = kilit ? 'ÇAPA · KİLİTLİ · ' + flTr((i - atis.kilitBas + 1) / FL_FPS, 1) + ' sn' : (i > atis.son ? 'BIRAKIŞ' : 'ÇAPA ARANIYOR');
        x.font = mono; let w = x.measureText(yazi).width + 12;
        x.fillStyle = kilit ? '#ff9a3c' : 'rgba(10,10,10,.75)'; x.fillRect(A[0] + bo / 2 + 6, A[1] - bo / 2, w, 18);
        x.fillStyle = kilit ? '#1a0d04' : '#fff'; x.fillText(yazi, A[0] + bo / 2 + 12, A[1] - bo / 2 + 13);
        // sağ üst sayaç
        let g = _fl.secili ? _fl.secili.split('|')[0] : 'yildizlar', mmK = flMm(o.vek ? Math.hypot(o.vek[0] - atis.merkez[0], o.vek[1] - atis.merkez[1]) : 0, g);
        x.font = '700 28px "Roboto Mono", monospace'; x.fillStyle = '#fff'; let t = String(Math.min(99, mmK)).padStart(2, '0'); x.fillText(t, gen - 128, 40);
        x.font = '600 10px "Roboto Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('MM ÇAPA', gen - 86, 28); x.fillText('KAYMASI', gen - 86, 41);
    }
}

// ---------------------------------------------------------------- VİDEO İNDİR + ÇUBUK ANALİZ
// Kullanıcı (2026-10-03): "analiz yapılan videoyu kaydetme seçeneği koy, telefona ya da bilgisayara indirip sonra
// kontrol edelim" + "çubuk analiz seçeneği, mesela çubuklar gösterir". İki anlamı da karşılanır: çubuk adam (atışların
// vücut çizgileri üst üste) ve çubuk grafik (atış atış bekleme / kayma / yay kolu). Oynatıcıda "Çubuk" düğmesi videoyu
// karartıp yalnız iskeleti gösterir.
const FL_RENK = ['#ff6a1a', '#3ddc84', '#4dabf7', '#ffd166', '#e599f7', '#ff8787', '#63e6be', '#fab005', '#a5d8ff', '#d0bfff', '#ffa94d', '#8ce99a'];
function flDosyaAdi(ek, uzanti) {
    let ad = _fl.secili ? _fl.secili.split('|').slice(1).join(' ') : 'sporcu';
    let tarih = (typeof bsIsoTarih === 'function' ? bsIsoTarih(new Date()) : new Date().toISOString().slice(0, 10));
    return ('FormLab_' + ad + '_' + tarih + (ek ? '_' + ek : '')).replace(/[^\wçğıöşüÇĞİÖŞÜ.-]+/g, '_') + '.' + uzanti;
}
function flUzanti(tip) { return /mp4/i.test(tip || '') ? 'mp4' : /quicktime|mov/i.test(tip || '') ? 'mov' : 'webm'; }
// dokunuşun içinde çağrılmalı (iPhone paylaşım menüsü yalnız kullanıcı hareketiyle açılır)
function flDosyaVer(blob, ad) {
    try {
        let dosya = new File([blob], ad, { type: blob.type || 'video/mp4' });
        let mobil = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (mobil && navigator.canShare && navigator.canShare({ files: [dosya] })) { navigator.share({ files: [dosya], title: 'Form Lab' }).catch(() => {}); return; }
    } catch (e) {}
    let u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
    showToast('Video indiriliyor: ' + ad, 'success');
}
function flHamIndir() {
    if (!_fl.hamBlob) { showToast('Ham video bulunamadı', 'error'); return; }
    flDosyaVer(_fl.hamBlob, flDosyaAdi('ham', flUzanti(_fl.hamBlob.type || (_fl.hamBlob.name || '').split('.').pop())));
}
function flIndirAlaniHTML() {
    let d = _fl.disa || {};
    if (d.durum === 'hazirlaniyor') return `<button class="fl-btn" disabled id="fl-indir-analizli">Analizli video hazırlanıyor… %${d.yuzde || 0}</button>`;
    if (d.durum === 'hazir') return `<button class="fl-btn fl-btn-ana" onclick="flAnalizliVer()">Analizli videoyu kaydet</button>`;
    return `<button class="fl-btn" onclick="flAnalizliHazirla()" id="fl-indir-analizli">Analizli videoyu indir</button>`;
}
function flIndirYaz() { let el = document.getElementById('fl-indir-yer'); if (el) el.innerHTML = flIndirAlaniHTML() + (_fl.hamBlob ? `<button class="fl-btn" onclick="flHamIndir()">Ham videoyu indir</button>` : ''); }
function flAnalizliVer() { let d = _fl.disa; if (d && d.blob) flDosyaVer(d.blob, d.ad); }
// Analizli video: gizli oynatıcı baştan sona normal hızda oynar; her kare tuvale video + Form Lab çizimleriyle basılır,
// tuvalin akışı MediaRecorder ile kaydedilir (videonun kendi süresi kadar sürer).
async function flAnalizliHazirla() {
    let s = _fl.sonuc; if (!s || !_fl.url || (_fl.disa && _fl.disa.durum === 'hazirlaniyor')) return;
    let cs = document.createElement('canvas');
    if (!window.MediaRecorder || !cs.captureStream) { showToast('Bu tarayıcı analizli video oluşturamıyor — ham videoyu indirebilirsin', 'error'); return; }
    _fl.disa = { durum: 'hazirlaniyor', yuzde: 0 }; flIndirYaz();
    let v = null;
    try {
        v = await flVideoHazirla(_fl.url);
        let olcek = Math.min(1, 1280 / Math.max(s.W, s.H)), CW = Math.round(s.W * olcek / 2) * 2, CH = Math.round(s.H * olcek / 2) * 2;
        cs.width = CW; cs.height = CH; let x = cs.getContext('2d');
        let tip = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
        let akis = cs.captureStream(30), rec = new MediaRecorder(akis, tip ? { mimeType: tip, videoBitsPerSecond: 5000000 } : undefined), parca = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
        let durdu = new Promise(ok => { rec.onstop = ok; });
        await flKareyeGit(v, 0);
        const ciz = () => { x.drawImage(v, 0, 0, CW, CH); flKatmanCizX(x, CW, CH, olcek, 0, 0, Math.min(s.olc.length - 1, Math.max(0, Math.round(v.currentTime * FL_FPS))), olcek); };
        ciz(); rec.start(500);
        let bitti = false, son = performance.now();
        const dongu = () => {
            if (bitti) return; ciz();
            if (performance.now() - son > 400) { son = performance.now(); _fl.disa.yuzde = Math.min(99, Math.round(v.currentTime / s.sure * 100)); let b = document.getElementById('fl-indir-analizli'); if (b) b.textContent = 'Analizli video hazırlanıyor… %' + _fl.disa.yuzde; }
            if (v.currentTime >= s.sure - 0.05 || v.ended) { bitti = true; return; }
            requestAnimationFrame(dongu);
        };
        v.playbackRate = 1; await v.play();
        requestAnimationFrame(dongu);
        await new Promise(ok => { let z = setInterval(() => { if (bitti || v.ended || v.currentTime >= s.sure - 0.05) { bitti = true; clearInterval(z); ok(); } }, 200); v.addEventListener('ended', () => { bitti = true; }, { once: true }); });
        ciz(); v.pause(); rec.stop(); await durdu;
        let blob = new Blob(parca, { type: rec.mimeType || tip || 'video/webm' });
        if (!blob.size) throw new Error('boş kayıt');
        _fl.disa = { durum: 'hazir', blob, ad: flDosyaAdi('analizli', flUzanti(blob.type)) };
        showToast('Analizli video hazır — "Analizli videoyu kaydet"e bas', 'success');
    } catch (e) {
        _fl.disa = null; showToast('Analizli video oluşturulamadı — ham videoyu indirebilirsin', 'error');
    }
    if (v) { try { v.remove(); } catch (e) {} }
    flIndirYaz();
}
// ---- çubuk analiz
function flCubukKare(s, a) { return _fl.cubukAn === 'capa' ? a.ortaKare : Math.max(a.bas, a.son - 1); }
function flCubukHTML(s) {
    let g = _fl.secili ? _fl.secili.split('|')[0] : 'yildizlar', mm = x => flMm(x, g), gizli = _fl.cubukGizli || {};
    let an = _fl.cubukAn === 'capa' ? 'capa' : 'birakis';
    let lejant = s.atislar.map((a, i) => `<button class="fl-cubuk-lej ${gizli[a.no] ? 'kapali' : ''}" onclick="flCubukGizle(${a.no})" aria-pressed="${!gizli[a.no]}"><i style="background:${FL_RENK[i % FL_RENK.length]}"></i>${a.no}</button>`).join('');
    let grafik = (baslik, deger, birim, ondalik, alt) => {
        let l = s.atislar.map(a => deger(a)), gecerli = l.filter(v => v != null && isFinite(v));
        if (!gecerli.length) return '';
        let en = Math.max(...gecerli), enk = alt != null ? Math.min(alt, ...gecerli) : 0, ust = en + (en - enk) * 0.15 || 1;
        let W = 320, H = 130, sol = 4, gen = (W - sol * 2) / l.length, y = v => H - 18 - (v - enk) / ((ust - enk) || 1) * (H - 40);
        let ort = flOrt(gecerli), cubuk = l.map((v, i) => v == null ? '' : `<rect x="${(sol + i * gen + gen * 0.18).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(gen * 0.64).toFixed(1)}" height="${Math.max(1, H - 18 - y(v)).toFixed(1)}" rx="2" fill="${FL_RENK[i % FL_RENK.length]}" opacity="${gizli[i + 1] ? 0.25 : 0.95}"/><text x="${(sol + i * gen + gen / 2).toFixed(1)}" y="${(y(v) - 4).toFixed(1)}" class="d">${flTr(v, ondalik)}</text><text x="${(sol + i * gen + gen / 2).toFixed(1)}" y="${H - 4}" class="n">${i + 1}</text>`).join('');
        return `<figure class="fl-cubuk-grafik"><figcaption>${baslik} <small>ort. ${flTr(ort, ondalik)} ${birim}</small></figcaption>
            <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${baslik} atış atış">${cubuk}<line x1="0" x2="${W}" y1="${y(ort).toFixed(1)}" y2="${y(ort).toFixed(1)}" class="ort"/></svg></figure>`;
    };
    return `<div class="fl-baslik2">Çubuk analiz</div>
        <div class="fl-cbk">
            <div class="fl-cubuk-sol">
                <div class="fl-cubuk-an" role="tablist"><button class="${an === 'birakis' ? 'aktif' : ''}" onclick="_fl.cubukAn='birakis'; flCubukYenile()">Bırakış anı</button><button class="${an === 'capa' ? 'aktif' : ''}" onclick="_fl.cubukAn='capa'; flCubukYenile()">Çapa anı</button></div>
                <canvas id="fl-cubuk-cizim" width="720" height="720" aria-label="Atışların çubuk adam çizimleri üst üste"></canvas>
                <div class="fl-cubuk-lejlar">${lejant}</div>
                <p class="fl-sessiz">Her renk bir atış; vücutlar omuz ortasına hizalanıp aynı boya getirildi. Çizgiler üst üste biniyorsa duruş tutarlı.</p>
            </div>
            <div class="fl-cubuk-sag">
                ${grafik('Çapada bekleme', a => a.kilitBas != null ? a.tutma : null, 'sn', 1)}
                ${grafik('Çapada kayma', a => mm(a.kayma), 'mm', 0)}
                ${grafik('Yay kolu (bırakış)', a => a.yayKol != null ? a.yayKol : null, '°', 0, 140)}
                ${grafik('Çekiş dirseği (bırakış)', a => a.cekDirsek != null ? a.cekDirsek : null, '°', 0)}
            </div>
        </div>`;
}
function flCubukGizle(no) { _fl.cubukGizli = _fl.cubukGizli || {}; _fl.cubukGizli[no] = !_fl.cubukGizli[no]; flCubukYenile(); }
function flCubukYenile() { let el = document.getElementById('fl-cubuk-yer'); if (el && _fl.sonuc) { el.innerHTML = flCubukHTML(_fl.sonuc); flCubukCiz(); } }
function flCubukCiz() {
    let cv = document.getElementById('fl-cubuk-cizim'), s = _fl.sonuc; if (!cv || !s) return;
    let x = cv.getContext('2d'), N = cv.width, gizli = _fl.cubukGizli || {};
    x.fillStyle = '#0d0c0b'; x.fillRect(0, 0, N, N);
    x.strokeStyle = 'rgba(236,230,220,.08)'; x.lineWidth = 1;
    for (let k = 0; k <= N; k += N / 12) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, N); x.moveTo(0, k); x.lineTo(N, k); x.stroke(); }
    x.strokeStyle = 'rgba(236,230,220,.25)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(0, N * 0.42); x.lineTo(N, N * 0.42); x.stroke(); x.setLineDash([]);
    let parcalar = [[11, 12], [11, 13], [13, 15], [15, 19], [12, 14], [14, 16], [16, 20], [11, 23], [12, 24], [23, 24]];
    s.atislar.forEach((a, n) => {
        if (gizli[a.no]) return;
        let k = s.kareler[flCubukKare(s, a)]; if (!k || !k.p) return;
        let p = k.p.map(q => [q[0] * s.W, q[1] * s.H, q[2]]);
        let mx = (p[11][0] + p[12][0]) / 2, my = (p[11][1] + p[12][1]) / 2, S = Math.hypot(p[11][0] - p[12][0], p[11][1] - p[12][1]) || 1, b = N * 0.2 / S;
        let P = i => [N / 2 + (p[i][0] - mx) * b, N * 0.42 + (p[i][1] - my) * b];
        x.strokeStyle = FL_RENK[n % FL_RENK.length]; x.lineWidth = 4; x.lineCap = 'round'; x.globalAlpha = 0.85;
        parcalar.forEach(([u, v]) => { if (p[u][2] < 0.3 || p[v][2] < 0.3) return; let A = P(u), B = P(v); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); });
        let bur = P(0), boy = [N / 2, N * 0.42]; x.beginPath(); x.moveTo(boy[0], boy[1]); x.lineTo(bur[0], bur[1] + S * b * 0.22); x.stroke();
        x.beginPath(); x.arc(bur[0], bur[1], S * b * 0.22, 0, 7); x.stroke();
        x.globalAlpha = 1;
    });
    x.font = '600 20px "Roboto Mono", monospace'; x.fillStyle = 'rgba(236,230,220,.6)'; x.fillText(_fl.cubukAn === 'capa' ? 'ÇAPA ANI' : 'BIRAKIŞ ANI', 18, 32);
}
function flCubukGorunum() {
    _fl.cubukGorunum = !_fl.cubukGorunum;
    let b = document.querySelector('.fl-sahne-cubuk'); if (b) b.textContent = _fl.cubukGorunum ? 'Video' : 'Çubuk';
}

// ---------------------------------------------------------------- ANLAŞILIR ANALİZ + YAKINLAŞ
// Kullanıcı (2026-10-03): "kamera kalitesi düşük, telefondan çekince ekranda küçük, tam ekranda analizler kayboluyor,
// analizin daha iyi anlaşılır olması gerekiyor". Her ölçü yeşil / sarı / kırmızı + sade bir cümleyle anlatılır
// (eşikler yaklaşık, tek kameradan), canlı görüntüde sporcuyu takip eden yakınlaştırma.
const FL_DURUM_RENK = { iyi: '#3ddc84', orta: '#ffb703', calis: '#ff6b5e' };
const FL_DURUM_AD = { iyi: 'İyi', orta: 'Dikkat', calis: 'Çalış' };
function flYayDurum(a) { return a == null ? null : a >= 165 ? 'iyi' : a >= 155 ? 'orta' : 'calis'; }
function flOmuzDurum(e) { e = Math.abs(e || 0); return e < 4 ? 'iyi' : e < 8 ? 'orta' : 'calis'; }
function flDegerlendir(oz, g) {
    let mm = x => flMm(x, g), sat = [];
    if (!oz.n) return { satirlar: [], baslik: '' };
    if (oz.n >= 2) {
        let v = mm(oz.capaFark), d = v <= 6 ? 'iyi' : v <= 12 ? 'orta' : 'calis';
        sat.push({ id: 'capa', ad: 'Çapa yeri', d, deger: '≈' + v + ' mm fark', cumle: d === 'iyi' ? 'Çekiş eli her atışta çenede aynı yere geliyor.' : d === 'orta' ? 'Çapa yeri atıştan atışa biraz değişiyor. Hep aynı noktaya getirmeye odaklan.' : 'Çapa her atışta farklı yere geliyor. Oklar yukarı-aşağı dağılır; önce bunu düzelt.' });
    }
    let k = mm(oz.kaymaOrt || 0), dk = k <= 4 ? 'iyi' : k <= 8 ? 'orta' : 'calis';
    sat.push({ id: 'kayma', ad: 'Çapada sabitlik', d: dk, deger: '≈' + k + ' mm kayma', cumle: dk === 'iyi' ? 'El çenede dururken kıpırdamıyor.' : dk === 'orta' ? 'Çapada el biraz kıpırdıyor; bırakmadan önce eli kilitle.' : 'Çapada el kayıyor. Kolla oynamak yerine sırtla genişle.' });
    let to = oz.tutmaOrt || 0, ts = oz.tutmaSap || 0;
    let dt = oz.kilitsiz >= oz.n ? 'calis' : (to >= 1.2 && to <= 4 && ts <= 0.6) ? 'iyi' : (to >= 0.8 && to <= 5 && ts <= 1.2) ? 'orta' : 'calis';
    sat.push({ id: 'ritim', ad: 'Bekleme ritmi', d: dt, deger: flTr(to, 1) + ' sn ±' + flTr(ts, 1), cumle: dt === 'iyi' ? 'Her atışta aynı sürede bekleyip bırakıyor.' : to > 4 ? 'Nişanda uzun bekliyor; kol yorulur. 2-3 saniyede bırakmayı dene.' : to < 1.2 ? 'Çapaya gelir gelmez bırakıyor; bir an durup sonra bırak.' : 'Bekleme süresi atıştan atışa değişiyor; aynı ritmi bul.' });
    if (oz.yayKolOrt != null) {
        let a = Math.round(oz.yayKolOrt), oran = oz.dusen / oz.n, d = flYayDurum(a);
        if (oran >= 0.6) d = 'calis'; else if (oran >= 0.3 && d === 'iyi') d = 'orta';
        sat.push({ id: 'yay', ad: 'Yay kolu', d, deger: a + '°' + (oz.dusen ? ' · ' + oz.dusen + '/' + oz.n + ' düştü' : ''), cumle: d === 'iyi' ? 'Yay kolu düz ve bırakışta yerinde kalıyor.' : a < 160 ? 'Yay kolu bükük görünüyor; kolu uzat, dirseği kilitleme ama düz tut.' : 'Bırakıştan sonra yay kolu düşüyor; ok gidene kadar kolu hedefte tut.' });
    }
    if (oz.egimOrt != null) {
        let e = Math.round(Math.abs(oz.egimOrt)), d = flOmuzDurum(oz.egimOrt);
        sat.push({ id: 'omuz', ad: 'Omuzlar', d, deger: e + '° eğim', cumle: d === 'iyi' ? 'Omuzlar düz, yay omzu aşağıda.' : oz.egimOrt > 0 ? 'Yay omzu kalkıyor; omzu aşağı ve geri bırak.' : 'Çekiş tarafı omuz kalkık; omuzları düz tut.' });
    }
    let calis = sat.filter(x => x.d === 'calis'), orta = sat.filter(x => x.d === 'orta');
    let baslik = calis.length ? 'Önce şuna odaklan: ' + calis[0].ad.toLocaleLowerCase('tr') : orta.length ? 'İyi gidiyor. Küçük bir düzeltme: ' + orta[0].ad.toLocaleLowerCase('tr') : 'Tutarlı bir seri. Böyle devam!';
    return { satirlar: sat, baslik, genel: calis.length ? 'calis' : orta.length ? 'orta' : 'iyi' };
}
function flAtisHukmu(a, coklu, mm) {
    if (a.kilitBas == null) return ['calis', 'Çapa kilitlenmedi'];
    if (a.dusus != null && a.dusus > 0.18) return ['calis', 'Yay kolu düştü'];
    if (coklu && mm(a.capaUzak) >= 10) return ['orta', 'Çapa farklı yerde'];
    if (mm(a.kayma) >= 8) return ['orta', 'Çapada kaydı'];
    if (a.yayKol != null && a.yayKol < 155) return ['orta', 'Yay kolu bükük'];
    return ['iyi', 'İyi atış'];
}
function flOzetHTML(s, g) {
    let d = flDegerlendir(s.ozet, g); if (!d.satirlar.length) return '';
    return `<div class="fl-ozet fl-ozet-${d.genel}">
        <div class="fl-ozet-bas"><span class="fl-ozet-etiket">NE GÖRDÜK</span><b>${flEsc(d.baslik)}</b></div>
        <div class="fl-ozet-satirlar">${d.satirlar.map(x => `<div class="fl-ozet-satir"><i style="background:${FL_DURUM_RENK[x.d]}"></i><span class="fl-ozet-ad">${flEsc(x.ad)}<em style="color:${FL_DURUM_RENK[x.d]}">${FL_DURUM_AD[x.d]}</em></span><span class="fl-ozet-deger">${flEsc(x.deger)}</span><span class="fl-ozet-cumle">${flEsc(x.cumle)}</span></div>`).join('')}</div>
        <details class="fl-nasil"><summary>Nasıl okunur?</summary>
            <ul>
                <li><b>Renkler:</b> yeşil iyi, sarı dikkat, kırmızı önce çalışılacak konu. Eşikler yaklaşıktır; tek kameradan tahmin edilir.</li>
                <li><b>Çapa yeri:</b> çekiş elinin çenede durduğu noktanın atıştan atışa ne kadar değiştiği. Ne kadar küçükse o kadar iyi (6 mm altı iyi).</li>
                <li><b>Çapada sabitlik:</b> el çenede kilitliyken ne kadar kıpırdadığı (4 mm altı iyi).</li>
                <li><b>Bekleme ritmi:</b> çapada kaç saniye beklediği ve bunun atıştan atışa ne kadar değiştiği (1-4 sn, ±0,6 sn iyi).</li>
                <li><b>Yay kolu:</b> bırakış anında dirsek açısı; 165° ve üstü düz sayılır. Kamera önden değilse açı küçük görünebilir.</li>
                <li><b>Grafik:</b> çizgi aşağı indikçe el çeneye yaklaşır; turuncu bantlar çapanın kilitli olduğu anlar, beyaz çizgiler bırakış.</li>
                <li><b>Videoda:</b> mavi çizgiler iskelet, sarı çizgi omuz hattı, köşeli çerçeve çapa noktası (turuncuysa kilitli). Açı yazısının rengi de iyi/dikkat/çalış demektir.</li>
            </ul>
        </details>
    </div>`;
}
// ---- canlı görüntüde sporcuyu takip eden yakınlaştırma (görüntü + çizimler birlikte ölçeklenir)
function flZoomHedefle(kare, W, H, el) {
    let Wel = el.clientWidth, Hel = el.clientHeight; if (!Wel || !Hel) return;
    let hedef = { z: 1, tx: 0, ty: 0 };
    if (_fl.yakinlas !== false && kare && kare.p) {
        let olc = Math.min(Wel / W, Hel / H), ox = (Wel - W * olc) / 2, oy = (Hel - H * olc) / 2;
        let ix = [0, 11, 12, 13, 14, 15, 16, 19, 20, 23, 24].filter(i => kare.p[i][2] > 0.5);
        if (ix.length >= 4) {
            let xs = ix.map(i => ox + kare.p[i][0] * W * olc), ys = ix.map(i => oy + kare.p[i][1] * H * olc);
            let S = Math.hypot((kare.p[11][0] - kare.p[12][0]) * W * olc, (kare.p[11][1] - kare.p[12][1]) * H * olc) || 40;
            let x0 = Math.min(...xs) - S * 0.6, x1 = Math.max(...xs) + S * 0.6, y0 = Math.min(...ys) - S * 0.9, y1 = Math.max(...ys) + S * 0.7;
            let z = Math.max(1, Math.min(3, Math.min(Wel / (x1 - x0), Hel / (y1 - y0))));
            let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
            hedef = { z, tx: Math.min(0, Math.max(Wel - Wel * z, Wel / 2 - cx * z)), ty: Math.min(0, Math.max(Hel - Hel * z, Hel / 2 - cy * z)) };
        }
    }
    _fl.zoomHedef = hedef;
}
function flZoomUygula() {
    let el = document.getElementById('fl-zoom'); if (!el) return;
    let h = _fl.yakinlas === false ? { z: 1, tx: 0, ty: 0 } : (_fl.zoomHedef || { z: 1, tx: 0, ty: 0 }), z = _fl.zoom || (_fl.zoom = { z: 1, tx: 0, ty: 0 }), k = 0.1;
    z.z += (h.z - z.z) * k; z.tx += (h.tx - z.tx) * k; z.ty += (h.ty - z.ty) * k;
    el.style.transform = 'translate(' + z.tx.toFixed(1) + 'px,' + z.ty.toFixed(1) + 'px) scale(' + z.z.toFixed(4) + ')';
}
function flYakinlasDegis() {
    _fl.yakinlas = _fl.yakinlas === false;
    try { localStorage.setItem('dagsk_formlab_yakinlas', _fl.yakinlas ? '1' : '0'); } catch (e) {}
    document.querySelectorAll('.fl-yak-btn').forEach(b => b.textContent = _fl.yakinlas ? 'Tüm kadraj' : 'Yakınlaş');
}
function flPanoYaz(satirlar, buyuk) {
    let sahne = document.querySelector('.fl-canli-sahne'); if (!sahne) return;
    let el = document.getElementById('fl-pano');
    if (!el) { el = document.createElement('div'); el.id = 'fl-pano'; el.className = 'fl-pano'; sahne.appendChild(el); }
    el.classList.toggle('buyuk', !!buyuk);
    el.innerHTML = satirlar.map(([ad, d, r]) => '<div><small>' + flEsc(ad) + '</small><b style="color:' + r + '">' + flEsc(d) + '</b></div>').join('');
}
function flYonIpucu(W, H) { let el = document.getElementById('fl-yon-ipucu'); if (el) el.style.display = H > W * 1.1 ? '' : 'none'; }

// ---------------------------------------------------------------- OTOMATİK AĞIR ÇEKİM TEKRAR
// Kullanıcı (2026-10-03) "bence sıradaki" listesinden seçti: her bırakıştan sonra son atış büyük ekranda ağır çekimde
// kendiliğinden oynar. Canlı görüntünün son ~4 sn'si küçük tuvallerden oluşan bir halkada tutulur (her ~66 ms bir kare,
// o anki iskeletle birlikte). Bırakış algılanınca (çekiş eli çeneden ayrılır, ≥0,6 sn çapada kalmışsa) 0,6 sn beklenir,
// bırakıştan 2,0 sn önce → 0,7 sn sonrası 0,35x hızla sahnenin üstünde oynatılır. "Son 3 sn" elle tekrar.
const FL_TEKRAR = { fps: 15, sn: 4.2, once: 2000, sonra: 700, hiz: 0.35, genislik: 960 };
function flTekrarAcikMi() { if (_fl.tekrarAcik == null) { try { _fl.tekrarAcik = localStorage.getItem('dagsk_formlab_tekrar') !== '0'; } catch (e) { _fl.tekrarAcik = true; } } return _fl.tekrarAcik; }
function flTekrarDegis() {
    _fl.tekrarAcik = !flTekrarAcikMi();
    try { localStorage.setItem('dagsk_formlab_tekrar', _fl.tekrarAcik ? '1' : '0'); } catch (e) {}
    document.querySelectorAll('.fl-tekrar-btn').forEach(b => b.textContent = 'Oto tekrar: ' + (_fl.tekrarAcik ? 'açık' : 'kapalı'));
}
// halka: sabit sayıda tuval (telefonda da hafıza sabit kalsın)
function flTekrarKaydet(v) {
    let h = _fl.halka, simdi = performance.now();
    if (!h || h.W !== v.videoWidth || h.H !== v.videoHeight) {
        let oran = Math.min(1, FL_TEKRAR.genislik / Math.max(v.videoWidth, v.videoHeight)), n = Math.round(FL_TEKRAR.fps * FL_TEKRAR.sn);
        h = _fl.halka = { W: v.videoWidth, H: v.videoHeight, w: Math.round(v.videoWidth * oran), h: Math.round(v.videoHeight * oran), kareler: [], i: 0, son: 0, n };
    }
    if (simdi - h.son < 1000 / FL_TEKRAR.fps) return; h.son = simdi;
    let k = h.kareler[h.i];
    if (!k) { let c = document.createElement('canvas'); c.width = h.w; c.height = h.h; k = h.kareler[h.i] = { c, x: c.getContext('2d') }; }
    try { k.x.drawImage(v, 0, 0, h.w, h.h); } catch (e) { return; }
    k.t = simdi; k.p = _fl.sonKare && simdi - _fl.sonKare.t < 250 ? _fl.sonKare.p : null;
    h.i = (h.i + 1) % h.n;
}
// bırakış takibi (kayıt ya da açılar modu fark etmez)
function flBirakisTakip(c, yakin, t) {
    let simdi = performance.now();
    if (yakin && c.yakinBas == null) { c.yakinBas = t; c.yakinBasPerf = simdi; c.sesTetik = false; }
    // kiriş sesi: sporcu ≥0,6 sn çapadayken duyulan "tık" = bırakış (görüntüden önce ve daha kesin)
    if (c.yakinBas != null && !c.sesTetik && _fl.sonSes && _fl.sonSes > c.yakinBasPerf + 600 && simdi - _fl.sonSes < 500) {
        c.sesTetik = true; let capa = (_fl.sonSes - c.yakinBasPerf) / 1000, an = _fl.sonSes;
        // doğrulama: 0,7 sn içinde el çeneden ayrılmadıysa ses başka bir sporcunun kirişiydi → yok say
        clearTimeout(_fl.tekrarZaman); _fl.tekrarZaman = setTimeout(() => {
            let cc = _fl.canli; if (!cc) return;
            if (cc.yakinBas != null) { cc.sesTetik = false; return; }
            if (cc.kayit) { cc.atisSay++; let el = document.getElementById('fl-canli-atis'); if (el) el.textContent = 'ATIŞ ' + cc.atisSay; flKonus('Atış ' + cc.atisSay + '. Çapada ' + flTr(capa, 1) + ' saniye', 'atis'); } else flKonus('Çapada ' + flTr(capa, 1) + ' saniye', 'atis');
            if (flTekrarAcikMi() && !cc.donuk) flTekrarOynat(an - FL_TEKRAR.once, an + FL_TEKRAR.sonra, capa, an);
        }, Math.max(0, an + FL_TEKRAR.sonra - performance.now()));
    }
    if (!yakin && c.yakinBas != null) {
        let capa = t - c.yakinBas, sesli = c.sesTetik; c.yakinBas = null; c.sesTetik = false;
        if (capa >= 0.6 && !sesli) {
            if (c.kayit) { c.atisSay++; let el = document.getElementById('fl-canli-atis'); if (el) el.textContent = 'ATIŞ ' + c.atisSay; flKonus('Atış ' + c.atisSay + '. Çapada ' + flTr(capa, 1) + ' saniye', 'atis'); } else flKonus('Çapada ' + flTr(capa, 1) + ' saniye', 'atis');
            if (flTekrarAcikMi() && !c.donuk) { let an = performance.now(); clearTimeout(_fl.tekrarZaman); _fl.tekrarZaman = setTimeout(() => flTekrarOynat(an - FL_TEKRAR.once, an + FL_TEKRAR.sonra, capa, an), FL_TEKRAR.sonra - 100); }
        }
    }
}
function flTekrarSon() { let an = performance.now(); flTekrarOynat(an - 3000, an, null, null); }
function flTekrarOynat(bas, son, capaSn, birakis) {
    let h = _fl.halka, sahne = document.querySelector('.fl-canli-sahne'); if (!h || !sahne || _fl.tekrarOynuyor) return;
    let l = h.kareler.filter(k => k && k.t >= bas && k.t <= son).sort((a, b) => a.t - b.t);
    if (l.length < 5) { if (birakis == null) showToast('Tekrar için yeterli görüntü yok', 'info'); return; }
    _fl.tekrarOynuyor = true;
    // tuvaller oynatma sırasında üzerine yazılmasın: kopya al
    let kopya = l.map(k => { let c = document.createElement('canvas'); c.width = h.w; c.height = h.h; c.getContext('2d').drawImage(k.c, 0, 0); return { c, t: k.t, p: k.p }; });
    let kat = document.createElement('div'); kat.className = 'fl-tekrar'; kat.innerHTML = '<canvas></canvas><div class="fl-tekrar-ust"><span class="fl-rozet fl-tekrar-rozet">AĞIR ÇEKİM TEKRAR · 0,35x</span>' + (capaSn != null ? '<span class="fl-rozet">ÇAPADA ' + flTr(capaSn, 1) + ' SN</span>' : '') + '</div><button class="fl-tekrar-kapat" aria-label="Tekrarı kapat">Canlıya dön</button>';
    sahne.appendChild(kat);
    let cv = kat.querySelector('canvas'), x = cv.getContext('2d'), kapandi = false;
    const kapat = () => { if (kapandi) return; kapandi = true; kat.classList.add('gidiyor'); setTimeout(() => kat.remove(), 300); _fl.tekrarOynuyor = false; };
    kat.addEventListener('click', kapat);
    let t0 = performance.now(), ilk = kopya[0].t, sonT = kopya[kopya.length - 1].t;
    const ciz = () => {
        if (kapandi) return;
        let r = sahne.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; }
        x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, r.width, r.height);
        let tOrj = ilk + (performance.now() - t0) * FL_TEKRAR.hiz, k = kopya[0];
        for (let i = 0; i < kopya.length && kopya[i].t <= tOrj; i++) k = kopya[i];
        let olc = Math.min(r.width / h.w, r.height / h.h), ox = (r.width - h.w * olc) / 2, oy = (r.height - h.h * olc) / 2;
        x.drawImage(k.c, ox, oy, h.w * olc, h.h * olc);
        if (k.p) flTekrarIskelet(x, k.p, ox, oy, h.w * olc, h.h * olc);
        // zaman çubuğu + bırakış işareti
        let y = r.height - 8, ilerleme = Math.min(1, (tOrj - ilk) / Math.max(1, sonT - ilk));
        x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(16, y, r.width - 32, 4); x.fillStyle = '#ff6a1a'; x.fillRect(16, y, (r.width - 32) * ilerleme, 4);
        if (birakis != null) {
            let bx = 16 + (r.width - 32) * Math.min(1, (birakis - ilk) / Math.max(1, sonT - ilk)); x.fillStyle = '#fff'; x.fillRect(bx - 1, y - 6, 2, 16);
            if (Math.abs(tOrj - birakis) < 220) { x.font = '900 34px "Archivo", sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('BIRAKIŞ', r.width / 2, r.height * 0.18); x.textAlign = 'start'; }
        }
        if (tOrj > sonT + 500) { kapat(); return; }
        requestAnimationFrame(ciz);
    };
    requestAnimationFrame(ciz);
}
function flTekrarIskelet(x, p, ox, oy, w, h) {
    let P = i => [ox + p[i][0] * w, oy + p[i][1] * h];
    x.lineWidth = 3; x.strokeStyle = 'rgba(90,160,255,.95)';
    [[11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]].forEach(([a, b]) => { if (p[a][2] < 0.3 || p[b][2] < 0.3) return; let A = P(a), B = P(b); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); });
    x.strokeStyle = '#ffd166'; let A = P(11), B = P(12); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
    // yay kolu: işaret parmağı çeneden uzak olan taraf
    let ag = [(p[9][0] + p[10][0]) / 2, (p[9][1] + p[10][1]) / 2], d = i => Math.hypot(p[i][0] - ag[0], p[i][1] - ag[1]);
    let yay = d(20) <= d(19) ? [11, 13, 15] : [12, 14, 16], a = flAci(...yay.map(P));
    if (a != null) { let q = P(yay[1]), yazi = 'YAY KOLU ' + Math.round(a) + '°'; x.font = '700 15px "Roboto Mono", monospace'; let tw = x.measureText(yazi).width + 12; x.fillStyle = 'rgba(10,10,10,.75)'; x.fillRect(q[0] + 10, q[1] - 24, tw, 22); x.fillStyle = FL_DURUM_RENK[flYayDurum(a)]; x.fillText(yazi, q[0] + 16, q[1] - 8); }
}

// ---------------------------------------------------------------- DOĞRULUK PAKETİ (2026-10-03, "burayı mükemmel hale getirmemiz lazım")
// (1) "Atış değil" ile yanlış atış analizden çıkar (özet yeniden hesaplanır) + "Ölçüm hatalı" / "Atış kaçırıldı" bildirimleri
//     meta form_lab_geri'ye yazılır (eşik ayarı için gerçek örnekler). (2) Kişi seçimi: model 3 kişiye kadar görür; en büyük
//     (kameraya en yakın) kişiyle başlar ve kareden kareye onu izler; canlıda sporcuya dokunarak kilitlenir. (3) Gerçek mm:
//     sporcunun omuz genişliği meta sporcu_olcu'ya bir kez girilir; bilgisayarda hassas (full) vücut modeli. (4) Ses: kirişin
//     "tık" sesi, sporcu çapadayken duyulursa bırakış anı odur (görüntüden daha kesin); kayıtta sesli doğrulama işaretlenir.
function flOzetHesapla(tum, taraf) {
    let atislar = tum.filter(a => !a.haric);
    let ozet = {
        n: atislar.length, taraf, haric: tum.length - atislar.length,
        tutmaOrt: flOrt(atislar.map(a => a.tutma)), tutmaSap: flSapma(atislar.map(a => a.tutma)),
        kaymaOrt: flOrt(atislar.map(a => a.kayma)),
        yayKolOrt: flOrt(atislar.map(a => a.yayKol)), yayKolSap: flSapma(atislar.map(a => a.yayKol)),
        egimOrt: flOrt(atislar.map(a => a.egim)), dirsekYukOrt: flOrt(atislar.map(a => a.dirsekYuk)),
        dusen: atislar.filter(a => a.dusus != null && a.dusus > 0.18).length,
        kilitsiz: atislar.filter(a => a.kilitBas == null).length,
    };
    let mx = flOrt(atislar.map(a => a.merkez[0])), my = flOrt(atislar.map(a => a.merkez[1]));
    ozet.capaFark = atislar.length > 1 ? Math.sqrt(flOrt(atislar.map(a => (a.merkez[0] - mx) ** 2 + (a.merkez[1] - my) ** 2))) : 0;
    tum.forEach(a => { a.capaUzak = mx == null ? 0 : Math.hypot(a.merkez[0] - mx, a.merkez[1] - my); });
    return ozet;
}
// ---- geri bildirim
function flGeriYaz(tip, a) {
    try {
        let s = _fl.sonuc, d = kyDepoOku('form_lab_geri'), id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        d[id] = { t: Date.now(), tarih: bsIsoTarih(new Date()), tip, sp: _fl.secili || '', kaynak: s && s.canli ? 'canli' : 'dosya', W: s && s.W, H: s && s.H, sure: s && Math.round(s.sure), n: s && s.atislar.length, delegate: _fl.delegate || '', model: _fl.poseModelAd || '',
            atis: a ? { no: a.no, bas: a.bas, son: a.son, kilit: a.kilitBas != null ? [a.kilitBas, a.kilitSon] : null, tutma: a.tutma, kayma: Math.round(a.kayma * 1000) / 1000, yayKol: a.yayKol && Math.round(a.yayKol), cekDirsek: a.cekDirsek && Math.round(a.cekDirsek), dusus: a.dusus != null ? Math.round(a.dusus * 100) / 100 : null, el: Math.round((a.elVar || 0) * 100) / 100, sesli: !!a.sesli } : null };
        kyDepoYazYerel('form_lab_geri', d);
        kyDepoSenkron('form_lab_geri', () => kyDepoOku('form_lab_geri'), true).catch(() => {});
    } catch (e) {}
}
function flAtisHaric(no) {
    let s = _fl.sonuc, a = s && s.atislar[no - 1]; if (!a) return;
    a.haric = !a.haric; if (a.haric) flGeriYaz('atis-degil', a);
    s.ozet = flOzetHesapla(s.atislar, s.ozet.taraf); _fl.kayitAnahtar = null; _fl.disa = null;
    showToast(a.haric ? 'Atış ' + no + ' analizden çıkarıldı — sonuçlar yeniden hesaplandı' : 'Atış ' + no + ' geri eklendi', 'info');
    kmFormLabCiz();
}
function flAtisBildir(no) { let a = _fl.sonuc && _fl.sonuc.atislar[no - 1]; if (!a) return; flGeriYaz('olcum-hatali', a); showToast('Teşekkürler — bu atış ayar için kaydedildi', 'success'); }
function flKacanBildir() { flGeriYaz('kacirilan', null); showToast('Kaçırılan atış kaydedildi — algılama ayarında kullanılacak', 'success'); }
// ---- kişi seçimi / takip
function flKisiSec(lms, W, H) {
    if (!lms || !lms.length) return null;
    _fl.kisiSayisi = lms.length;
    if (lms.length === 1) { let l = lms[0]; _fl.takip = [(l[11].x + l[12].x) / 2, (l[11].y + l[12].y) / 2]; return l; }
    let merkez = l => [(l[11].x + l[12].x) / 2, (l[11].y + l[12].y) / 2], boy = l => Math.hypot((l[11].x - l[12].x) * W, (l[11].y - l[12].y) * H);
    let sec = null;
    if (_fl.takip) { let en = 1e9; lms.forEach(l => { let m = merkez(l), d = Math.hypot(m[0] - _fl.takip[0], m[1] - _fl.takip[1]); if (d < en) { en = d; sec = l; } }); }
    else lms.forEach(l => { if (!sec || boy(l) > boy(sec)) sec = l; });
    _fl.takip = merkez(sec);
    return sec;
}
function flKisiTiklandi(e) {
    if (!_fl.canli || (_fl.olcu && _fl.olcu.arac) || e.target.closest('button, .fl-tekrar')) return;
    let z = document.getElementById('fl-zoom'), v = document.getElementById('fl-canli-video'); if (!z || !v || !v.videoWidth) return;
    let r = z.getBoundingClientRect(), k = (r.width && z.offsetWidth) ? r.width / z.offsetWidth : 1;
    let lx = (e.clientX - r.left) / k, ly = (e.clientY - r.top) / k, Wl = v.clientWidth, Hl = v.clientHeight;
    let olc = Math.min(Wl / v.videoWidth, Hl / v.videoHeight), ox = (Wl - v.videoWidth * olc) / 2, oy = (Hl - v.videoHeight * olc) / 2;
    let nx = (lx - ox) / (v.videoWidth * olc), ny = (ly - oy) / (v.videoHeight * olc);
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    _fl.takip = [nx, ny]; _fl.kisiKilit = true;
    flCanliIpucu('Sporcu seçildi — artık onu takip ediyorum'); showToast('Takip edilecek sporcu seçildi', 'success');
}
// ---- sporcunun gerçek omuz genişliği
function flOlculer() { try { return kyDepoOku('sporcu_olcu'); } catch (e) { return {}; } }
function flOmuzCm(g) { let o = _fl.secili && flOlculer()[_fl.secili]; return (o && !o.sil && o.omuzCm) || FL_OMUZ_CM[g] || 34; }
function flOmuzKaydet(deger) {
    if (!_fl.secili) return;
    let v = parseFloat(String(deger).replace(',', '.')), d = flOlculer();
    d[_fl.secili] = v >= 18 && v <= 65 ? { t: Date.now(), omuzCm: Math.round(v * 2) / 2 } : { t: Date.now(), sil: true };
    kyDepoYazYerel('sporcu_olcu', d); kyDepoSenkron('sporcu_olcu', () => flOlculer(), true).catch(() => {});
    showToast(v >= 18 && v <= 65 ? 'Omuz genişliği kaydedildi: ' + d[_fl.secili].omuzCm + ' cm — mm ölçüleri artık gerçek' : 'Ölçü silindi — yaş grubu ortalaması kullanılacak', 'success');
    if (_fl.durum === 'sonuc') setTimeout(kmFormLabCiz, 0); // değişiklik odak kaybında gelir; yeniden çizimi o olaydan sonraya bırak
}
function flOmuzHTML() {
    if (!_fl.secili) return '';
    let g = _fl.secili.split('|')[0], o = flOlculer()[_fl.secili], var_ = o && !o.sil && o.omuzCm;
    return `<div class="fl-satir"><span class="fl-satir-ad">Omuz</span><div class="fl-omuz"><input type="number" inputmode="decimal" min="18" max="65" step="0.5" value="${var_ || ''}" placeholder="${FL_OMUZ_CM[g] || 34}" onchange="flOmuzKaydet(this.value)" aria-label="Omuz genişliği (cm)"><span>cm</span><small>${var_ ? 'mm ölçüleri bu sporcuya göre' : 'iki omuz başı arası, mezurayla. Girilmezse yaş grubu ortalaması (tahmini mm)'}</small></div></div>`;
}
// ---- kiriş sesi
function flSesBaslat(akis) {
    try {
        let iz = akis && akis.getAudioTracks && akis.getAudioTracks()[0]; if (!iz) return;
        if (_fl.ses && _fl.ses.iz === iz) return;
        flSesDurdur();
        let ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume && ctx.resume();
        let kaynak = ctx.createMediaStreamSource(new MediaStream([iz])), filtre = ctx.createBiquadFilter(); filtre.type = 'highpass'; filtre.frequency.value = 1200;
        let an = ctx.createAnalyser(); an.fftSize = 1024; kaynak.connect(filtre); filtre.connect(an);
        let veri = new Float32Array(an.fftSize), taban = 0.004, son = 0;
        _fl.ses = { ctx, iz, an, zaman: setInterval(() => {
            an.getFloatTimeDomainData(veri); let t = 0; for (let i = 0; i < veri.length; i++) t += veri[i] * veri[i];
            let rms = Math.sqrt(t / veri.length), simdi = performance.now();
            if (rms > Math.max(0.03, taban * 6) && simdi - son > 450) { son = simdi; _fl.sonSes = simdi; if (_fl.canli && _fl.canli.kayit) (_fl.canli.sesler = _fl.canli.sesler || []).push((simdi - _fl.canli.bas) / 1000); }
            taban = taban * 0.97 + Math.min(rms, 0.2) * 0.03;
        }, 20) };
        let ro = document.getElementById('fl-ses-rozet'); if (ro) ro.style.display = '';
    } catch (e) {}
}
function flSesDurdur() { let s = _fl.ses; if (!s) return; clearInterval(s.zaman); try { s.ctx.close(); } catch (e) {} _fl.ses = null; }
async function flYerelSesAc() {
    if (_fl.akisTel || _fl.sesYerel) return;
    try { _fl.sesYerel = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); flSesBaslat(_fl.sesYerel); } catch (e) {}
}
function flYerelSesKapat() { if (_fl.sesYerel) { _fl.sesYerel.getTracks().forEach(t => t.stop()); _fl.sesYerel = null; } }

// ---------------------------------------------------------------- SAHA PAKETİ (2026-10-03)
// Ders sırası (sporcular sırayla çekilir, sonuç kendiliğinden karneye), kayıtlı telefon (oda 30 gün; Form Lab açıkken
// bilgisayar kayıtlı telefonu kendiliğinden bekler), TV modu (büyük ekran: düğmeler gizli, dev pano + sporcu adı),
// sesli rehber (Türkçe konuşma: kadraj, atış, analiz sonucu). Seyrek kullanılan seçenekler "Ayarlar" menüsünde.
// ---- ayarlar menüsü
function flAyarHTML() {
    return `<button class="fl-rozet fl-ayar-btn" onclick="flAyarAc(event)" aria-expanded="false">Ayarlar</button>
        <div class="fl-ayar-panel" id="fl-ayar-panel" hidden>
            <button class="fl-tekrar-btn" onclick="flTekrarDegis()">Oto tekrar: ${flTekrarAcikMi() ? 'açık' : 'kapalı'}</button>
            <button class="fl-yak-btn" onclick="flYakinlasDegis()">${_fl.yakinlas === false ? 'Yakınlaş' : 'Tüm kadraj'}</button>
            <button class="fl-konus-btn" onclick="flKonusDegis()">Sesli rehber: ${flKonusAcikMi() ? 'açık' : 'kapalı'}</button>
            <button class="fl-tv-btn" onclick="flTvDegis()">TV modu</button>
        </div>`;
}
function flAyarAc(e) {
    e.stopPropagation();
    let p = document.getElementById('fl-ayar-panel'); if (!p) return;
    p.hidden = !p.hidden; e.currentTarget.setAttribute('aria-expanded', String(!p.hidden));
    if (!p.hidden) setTimeout(() => document.addEventListener('click', function kapat(ev) { if (!ev.target.closest('#fl-ayar-panel')) { p.hidden = true; document.removeEventListener('click', kapat); } }), 0);
}
// ---- TV modu
function flTvDegis() {
    let el = document.querySelector('.fl-canli'); if (!el) return;
    _fl.tv = !el.classList.contains('fl-tv'); el.classList.toggle('fl-tv', _fl.tv);
    let p = document.getElementById('fl-ayar-panel'); if (p) p.hidden = true;
    if (_fl.tv && !_fl.tamEkran) flTamEkranDegis();
    flTvAdYaz();
}
function flTvAdYaz() {
    let sahne = document.querySelector('.fl-canli-sahne'); if (!sahne) return;
    let el = document.getElementById('fl-tv-ad');
    if (!el) { el = document.createElement('div'); el.id = 'fl-tv-ad'; el.className = 'fl-tv-ad'; sahne.appendChild(el); }
    let ad = _fl.secili ? _fl.secili.split('|').slice(1).join(' ') : '';
    el.innerHTML = (ad ? '<b>' + flEsc(ad) + '</b>' : '') + '<button onclick="event.stopPropagation(); flTvDegis()">TV\'den çık</button>';
}
// ---- sesli rehber (tarayıcının Türkçe sesi; internet gerekmez)
function flKonusAcikMi() { if (_fl.konus == null) { try { _fl.konus = localStorage.getItem('dagsk_formlab_konus') === '1'; } catch (e) { _fl.konus = false; } } return _fl.konus; }
function flKonusDegis() {
    _fl.konus = !flKonusAcikMi(); try { localStorage.setItem('dagsk_formlab_konus', _fl.konus ? '1' : '0'); } catch (e) {}
    document.querySelectorAll('.fl-konus-btn').forEach(b => b.textContent = 'Sesli rehber: ' + (_fl.konus ? 'açık' : 'kapalı'));
    if (_fl.konus) flKonus('Sesli rehber açık', 'ac', true);
}
function flKonus(metin, anahtar, zorla) {
    if ((!flKonusAcikMi() && !zorla) || !window.speechSynthesis) return;
    let simdi = Date.now(), son = (_fl.konusSon = _fl.konusSon || {});
    if (anahtar && son[anahtar] && simdi - son[anahtar] < 4000) return;
    if (anahtar) son[anahtar] = simdi;
    try {
        let u = new SpeechSynthesisUtterance(metin); u.lang = 'tr-TR'; u.rate = 1.05;
        let ses = speechSynthesis.getVoices().find(v => /^tr/i.test(v.lang)); if (ses) u.voice = ses;
        speechSynthesis.speak(u);
    } catch (e) {}
}
function flKadrajKonus(m) {
    let tur = /^Kadraj tamam/.test(m) ? 'tamam' : /^Kadraja sığmıyor/.test(m) ? 'uzak' : /^Çok uzak/.test(m) ? 'yakin' : null;
    if (!tur || tur === _fl.sonKadraj) return; _fl.sonKadraj = tur;
    flKonus({ tamam: 'Kadraj tamam', uzak: 'Biraz uzaklaş', yakin: 'Biraz yaklaş' }[tur], 'kadraj');
}
// ---- ders sırası
function flSiraBaslat() {
    let l = flRoster(); if (l.length < 2) { showToast('Ders sırası için derste en az 2 sporcu olmalı', 'info'); return; }
    _fl.sira = { liste: l.map(k => k.g + '|' + k.ad), i: 0, kaydedilen: 0 };
    _fl.secili = _fl.sira.liste[0];
    flCanliAc();
}
function flSiraAd(i) { let k = _fl.sira && _fl.sira.liste[i]; return k ? k.split('|').slice(1).join(' ') : ''; }
function flSiraSonraki() {
    let s = _fl.sira; if (!s) return;
    s.i++;
    if (s.i >= s.liste.length) { showToast('Ders sırası bitti — ' + s.kaydedilen + ' sporcunun analizi karneye kaydedildi', 'success'); flKonus('Ders sırası bitti', 'sira'); _fl.sira = null; kmFormLabCiz(); return; }
    _fl.secili = s.liste[s.i];
    flCanliAc();
}
function flSiraAtla() { if (!_fl.sira) return; flCanliKapat(); _fl.canli = null; flSiraSonraki(); }
function flSiraBitir() { _fl.sira = null; kmFormLabCiz(); }
function flSiraCanliHTML() {
    let s = _fl.sira; if (!s) return '';
    return `<div class="fl-sira-rozet"><small>SIRADA ${s.i + 1}/${s.liste.length}</small><b>${flEsc(flSiraAd(s.i))}</b><button onclick="event.stopPropagation(); flSiraAtla()">Atla</button></div>`;
}
function flSiraSonucHTML() {
    let s = _fl.sira; if (!s) return '';
    let sonraki = flSiraAd(s.i + 1);
    return `<div class="fl-sira-serit"><span><small>DERS SIRASI ${s.i + 1}/${s.liste.length}</small><b>${flEsc(flSiraAd(s.i))}</b>${_fl.kayitAnahtar ? ' <em>karneye kaydedildi</em>' : ''}</span>
        <span class="fl-sira-butonlar"><button class="fl-btn" onclick="flCanliAc()">Tekrar çek</button><button class="fl-btn fl-btn-ana" onclick="flSiraSonraki()">${sonraki ? 'Sıradaki: ' + flEsc(sonraki.split(' ')[0]) : 'Sırayı bitir'}</button><button class="fl-btn" onclick="flSiraBitir()">Sıradan çık</button></span></div>`;
}
// ---- kayıtlı telefon
function flKayitliOda() { try { return JSON.parse(localStorage.getItem('dagsk_formlab_oda') || 'null'); } catch (e) { return null; } }
function flKayitliOdaUnut() { try { localStorage.removeItem('dagsk_formlab_oda'); } catch (e) {} flTelefonKes(); showToast('Kayıtlı telefon unutuldu', 'info'); }
function flKayitliTelefonBekle() {
    if (_fl.tel || _fl.telDenendi || !flKayitliOda() || !window.RTCPeerConnection) return;
    _fl.telDenendi = true; flTelefonAc(true);
}

// ---------------------------------------------------------------- kaydet / paylaş / odak
function flKaydet() {
    if (!_fl.secili || !_fl.sonuc) return;
    let [g, ...r] = _fl.secili.split('|'), ad = r.join('|'), oz = _fl.sonuc.ozet, mm = x => flMm(x, g);
    let tarih = bsIsoTarih(new Date()), anahtar = _fl.secili + '|' + tarih + '|' + Date.now().toString(36);
    let kayit = { t: Date.now(), g, ad, tarih, n: oz.n, puan: flPuan(oz), capaFarkMm: oz.n > 1 ? mm(oz.capaFark) : null, kaymaMm: mm(oz.kaymaOrt || 0),
        tutmaSn: Math.round((oz.tutmaOrt || 0) * 10) / 10, tutmaSap: Math.round((oz.tutmaSap || 0) * 10) / 10, yayKol: oz.yayKolOrt != null ? Math.round(oz.yayKolOrt) : null,
        dusen: oz.dusen, bulgular: flBulgular(oz, g).map(b => b.baslik), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '' };
    let d = flKayitlar(); d[anahtar] = kayit; kyDepoYazYerel('form_lab', d);
    kyDepoSenkron('form_lab', () => flKayitlar(), true).catch(() => {});
    _fl.kayitAnahtar = anahtar; showToast('Form Lab sonucu ' + ad.split(' ')[0] + ' karnesine kaydedildi', 'success'); kmFormLabCiz();
}
function flPaylas() {
    let s = _fl.sonuc; if (!s) return;
    let g = _fl.secili ? _fl.secili.split('|')[0] : 'yildizlar', ad = _fl.secili ? _fl.secili.split('|').slice(1).join('|') : '', oz = s.ozet, mm = x => flMm(x, g);
    let satir = ['DAĞ Okçuluk · Form Lab' + (ad ? ' · ' + ad : ''), bsIsoTarih(new Date()).split('-').reverse().join('.'), '',
        oz.n + ' atış · tutarlılık ' + flPuan(oz) + '/100',
        oz.n > 1 ? 'Çapa noktası farkı: ≈' + mm(oz.capaFark) + ' mm' : '',
        'Çapada kayma: ≈' + mm(oz.kaymaOrt || 0) + ' mm',
        'Çapada bekleme: ' + flTr(oz.tutmaOrt || 0, 1) + ' sn (±' + flTr(oz.tutmaSap || 0, 1) + ')',
        oz.yayKolOrt != null ? 'Bırakışta yay kolu: ' + Math.round(oz.yayKolOrt) + '°' : ''];
    let bul = flBulgular(oz, g); if (bul.length) { satir.push('', 'Çalışacağımız noktalar:'); bul.forEach(b => satir.push('- ' + b.baslik)); }
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(satir.filter((x, i, l) => x !== '' || l[i - 1] !== '').join('\n')), '_blank', 'noopener');
}
function flOdakYap(hataId) {
    if (!_fl.secili) return;
    let [g, ...r] = _fl.secili.split('|'), ad = r.join('|');
    dagskEkYukle('dagsk-km-kocluk.js').then(() => {
        let h = kcHata(hataId); if (!h) return;
        onayIste('<b>' + flEsc(ad) + '</b> için bu haftanın teknik odağı:<br><b>' + flEsc(h.ad) + '</b><br><span style="font-size:12px;color:var(--text-muted)">Bütün eğitmenler Teknik Koçluk ve karnede aynı cümleyi görür.</span>', () => {
            kcOdakYaz(g, ad, { hata: h.id, hataAd: h.ad, cumle: h.cumle[kcYasGrubu(g)], tarih: bsIsoTarih(new Date()), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '', kaynak: 'formlab' });
            showToast('Teknik odak kaydedildi: ' + h.ad, 'success');
        }, 'Odak yap');
    }).catch(() => showToast('Teknik Koçluk yüklenemedi — bağlantını kontrol et.', 'error'));
}

// ---------------------------------------------------------------- stil (bilinçli koyu "laboratuvar" paneli; açık temada da koyu)
function flCss() {
    if (document.getElementById('fl-css')) return;
    if (!document.querySelector('link[href*="Roboto+Mono"]')) { let l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap'; document.head.appendChild(l); }
    let st = document.createElement('style'); st.id = 'fl-css';
    st.textContent = `
.fl{ --fl-bg:#121110; --fl-panel:#1b1917; --fl-ink:#efebe5; --fl-soft:#a59e94; --fl-line:rgba(236,230,220,.12); --fl-or:#ff6a1a;
  background:var(--fl-bg); color:var(--fl-ink); border-radius:14px; padding:18px 16px 22px; display:flex; flex-direction:column; gap:14px; font-family:'Archivo','Plus Jakarta Sans',sans-serif; }
.fl-ust{ display:flex; justify-content:space-between; gap:14px; align-items:flex-start; }
.fl-etiket{ font:500 11px/1 'Roboto Mono',monospace; letter-spacing:.16em; color:var(--fl-soft); }
.fl-baslik{ font:900 clamp(26px,4.4vw,40px)/1 'Archivo',sans-serif; text-transform:uppercase; margin:8px 0 6px; }
.fl-alt{ font-size:13.5px; color:var(--fl-soft); max-width:56ch; line-height:1.5; }
.fl-mini{ text-align:right; border:1px solid var(--fl-line); border-radius:8px; padding:8px 12px; min-width:110px; }
.fl-mini small{ display:block; font:500 10px/1.2 'Roboto Mono',monospace; letter-spacing:.1em; color:var(--fl-soft); }
.fl-mini b{ font:700 26px/1.1 'Roboto Mono',monospace; } .fl-mini b span{ font-size:12px; color:var(--fl-soft); }
.fl-satir{ display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.fl-satir-ad{ font:500 11px/1 'Roboto Mono',monospace; letter-spacing:.14em; text-transform:uppercase; color:var(--fl-soft); min-width:74px; }
.fl-cipler{ display:flex; gap:6px; flex-wrap:wrap; flex:1; }
@media (max-width:520px){ .fl-satir{ flex-direction:column; align-items:flex-start; gap:8px; } .fl-ust{ flex-wrap:wrap; } }
.fl-cip{ min-height:36px; padding:0 13px; border-radius:6px; border:1px solid var(--fl-line); background:transparent; color:var(--fl-ink); font-weight:700; font-size:13px; cursor:pointer; }
.fl-cip.aktif{ border-color:var(--fl-or); background:rgba(255,106,26,.16); }
.fl-kutu{ background:var(--fl-panel); border:1px solid var(--fl-line); border-radius:10px; padding:16px; display:flex; flex-direction:column; gap:14px; }
.fl-hata b{ font-size:16px; } .fl-hata p{ margin:0; color:var(--fl-soft); font-size:14px; line-height:1.5; }
.fl-cekim{ display:grid; grid-template-columns:200px 1fr; gap:16px; align-items:center; }
@media (max-width:620px){ .fl-cekim{ grid-template-columns:1fr; } .fl-cekim-cizim{ max-width:220px; } }
.fl-cekim-cizim{ width:100%; fill:none; stroke:var(--fl-soft); stroke-width:2; stroke-linecap:round; }
.fl-cekim-cizim text{ fill:var(--fl-soft); stroke:none; font:500 10px 'Roboto Mono',monospace; text-anchor:middle; }
.fl-ipucu{ margin:0; padding-left:18px; display:flex; flex-direction:column; gap:7px; font-size:13.5px; line-height:1.45; color:var(--fl-ink); }
.fl-butonlar{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.fl-btn{ min-height:44px; padding:0 16px; border-radius:8px; border:1px solid rgba(236,230,220,.25); background:transparent; color:var(--fl-ink); font:700 14px/1 'Archivo',sans-serif; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.fl-btn-ana{ background:var(--fl-or); border-color:var(--fl-or); color:#fff; }
.fl-btn:disabled{ opacity:.6; cursor:default; }
.fl-btn-kucuk{ min-height:36px; font-size:12.5px; padding:0 12px; flex-shrink:0; }
.fl-sessiz{ font:400 11.5px/1.5 'Roboto Mono',monospace; color:var(--fl-soft); margin:0; }
.fl-hazirlik{ margin:0; font:500 12px/1.4 'Roboto Mono',monospace; color:var(--fl-ink); display:flex; align-items:center; gap:8px; }
.fl-hazirlik i{ width:8px; height:8px; border-radius:50%; background:#ffb703; animation:flNabiz 1.2s ease-in-out infinite; } .fl-hazirlik i.hazir{ background:#3ddc84; animation:none; } .fl-hazirlik i.hata{ background:#ff4d4d; animation:none; }
@keyframes flNabiz{ 50%{ opacity:.35; } }
.fl-ilerleme-ust{ display:flex; justify-content:space-between; font:500 13px/1.3 'Roboto Mono',monospace; }
.fl-cubuk{ height:6px; border-radius:3px; background:rgba(236,230,220,.1); overflow:hidden; } .fl-cubuk i{ display:block; height:100%; background:var(--fl-or); transition:width .2s ease; }
.fl-ilerleme .fl-btn{ align-self:flex-start; }
.fl-sonuc{ display:flex; flex-direction:column; gap:14px; }
.fl-sahne{ position:relative; background:#000; border-radius:10px; overflow:hidden; }
.fl-sahne video{ display:block; width:100%; max-height:70vh; background:#000; }
.fl-sahne canvas{ position:absolute; left:0; top:0; pointer-events:none; }
.fl-grafik-kutu{ background:var(--fl-panel); border:1px solid var(--fl-line); border-radius:10px; padding:10px 12px; }
.fl-grafik-ust{ display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; font:500 10.5px/1.4 'Roboto Mono',monospace; letter-spacing:.1em; color:var(--fl-soft); margin-bottom:6px; }
.fl-lejant i{ display:inline-block; width:10px; height:10px; margin:0 5px 0 10px; vertical-align:-1px; } .fl-lejant i.k{ background:rgba(255,106,26,.45); } .fl-lejant i.b{ width:2px; background:#fff; }
.fl-grafik{ width:100%; height:120px; display:block; cursor:pointer; }
.fl-grafik .egri{ fill:none; stroke:var(--fl-ink); stroke-width:2; vector-effect:non-scaling-stroke; }
.fl-grafik .kb{ fill:rgba(255,106,26,.3); } .fl-grafik .br{ stroke:rgba(255,255,255,.7); stroke-width:1.5; vector-effect:non-scaling-stroke; }
.fl-grafik .esik{ stroke:rgba(236,230,220,.2); stroke-dasharray:4 4; vector-effect:non-scaling-stroke; }
.fl-grafik .imlec{ stroke:#3ddc84; stroke-width:1.5; vector-effect:non-scaling-stroke; }
.fl-grafik .no{ fill:var(--fl-soft); font:600 11px 'Roboto Mono',monospace; }
.fl-kpiler{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-top:1px solid var(--fl-line); border-bottom:1px solid var(--fl-line); }
@media (max-width:620px){ .fl-kpiler{ grid-template-columns:repeat(2,1fr); } }
.fl-kpi{ padding:14px 12px; border-left:1px solid var(--fl-line); display:flex; flex-direction:column; gap:3px; }
.fl-kpi:nth-child(3n+1){ border-left:0; } @media (max-width:620px){ .fl-kpi{ border-left:0; border-top:1px solid var(--fl-line); } .fl-kpi:nth-child(-n+2){ border-top:0; } .fl-kpi:nth-child(even){ border-left:1px solid var(--fl-line); } }
.fl-kpi b{ font:700 clamp(24px,3.6vw,34px)/1 'Roboto Mono',monospace; color:var(--fl-or); } .fl-kpi b span{ font-size:13px; color:var(--fl-soft); }
.fl-kpi span{ font-weight:700; font-size:13px; } .fl-kpi small{ font:400 11px/1.3 'Roboto Mono',monospace; color:var(--fl-soft); }
.fl-baslik2{ font:900 18px/1 'Archivo',sans-serif; text-transform:uppercase; margin-top:6px; }
.fl-atislar{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; }
.fl-atis{ position:relative; padding:0; border:1px solid var(--fl-line); border-radius:8px; overflow:hidden; background:var(--fl-panel); color:var(--fl-ink); text-align:left; cursor:pointer; display:flex; flex-direction:column; }
.fl-atis img, .fl-atis-resimsiz{ width:100%; aspect-ratio:1; object-fit:cover; display:block; background:#000; }
.fl-atis.kilitsiz{ border-color:rgba(255,77,77,.5); }
.fl-atis-no{ position:absolute; left:8px; top:8px; font:700 12px/1 'Roboto Mono',monospace; background:rgba(10,10,10,.72); padding:4px 6px; border-radius:4px; }
.fl-atis-bilgi{ padding:8px 10px 10px; display:flex; flex-direction:column; gap:3px; }
.fl-atis-bilgi b{ font:700 15px/1 'Roboto Mono',monospace; } .fl-atis-bilgi small{ font:400 11px/1.35 'Roboto Mono',monospace; color:var(--fl-soft); }
.fl-atis-bilgi em{ font-style:normal; font-size:11.5px; font-weight:700; color:#ff8b6b; }
.fl-bulgular{ display:flex; flex-direction:column; gap:0; border-top:1px solid var(--fl-line); }
.fl-bulgu{ display:flex; justify-content:space-between; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid var(--fl-line); }
.fl-bulgu b{ font-size:15px; } .fl-bulgu p{ margin:4px 0 0; font-size:13px; color:var(--fl-soft); line-height:1.45; }
.fl-deger{ display:inline-block; margin-left:8px; font:600 12px/1 'Roboto Mono',monospace; color:var(--fl-or); }
.fl-bulgu.ciddi b{ color:#ff8b6b; } .fl-bulgu.iyi b{ color:#3ddc84; }
@media (max-width:560px){ .fl-bulgu{ flex-direction:column; align-items:flex-start; } }
.fl-canli{ display:flex; flex-direction:column; gap:12px; }
.fl-canli-sahne{ position:relative; background:#000; border-radius:10px; overflow:hidden; }
.fl-canli-sahne video{ display:block; width:100%; max-height:78vh; object-fit:contain; background:#000; }
.fl-canli-sahne canvas{ position:absolute; left:0; top:0; pointer-events:none; }
.fl-canli-ust{ position:absolute; left:10px; right:10px; top:10px; display:flex; justify-content:space-between; gap:8px; }
.fl-rozet{ font:700 12px/1 'Roboto Mono',monospace; letter-spacing:.08em; background:rgba(10,10,10,.72); color:#fff; padding:7px 9px; border-radius:6px; }
.fl-rozet.kayit{ background:#e5383b; }
.fl-canli-ipucu{ position:absolute; left:50%; bottom:12px; transform:translateX(-50%); max-width:92%; text-align:center; font:600 13px/1.3 'Roboto Mono',monospace; background:rgba(10,10,10,.75); color:#fff; padding:8px 12px; border-radius:8px; }
.fl-canli-ipucu:empty{ display:none; }
.fl-canli-ipucu.tamam{ background:rgba(25,135,84,.85); }
.fl-canli-kontrol{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px; }
.fl-canli-kontrol .fl-btn:first-child{ justify-self:start; } .fl-canli-kontrol .fl-btn:last-child{ justify-self:end; }
.fl-ust-sag{ display:flex; gap:8px; align-items:center; }
.fl-tam-btn, .fl-sahne-tam{ border:0; cursor:pointer; }
.fl-sahne-tam{ position:absolute; right:10px; top:10px; z-index:3; }
.fl-canli.fl-tam{ position:fixed; inset:0; z-index:40000; background:#000; margin:0; padding:max(8px, env(safe-area-inset-top)) 8px max(10px, env(safe-area-inset-bottom)); gap:10px; }
.fl-canli.fl-tam .fl-canli-sahne{ flex:1; min-height:0; border-radius:8px; }
.fl-canli.fl-tam .fl-canli-sahne video{ max-height:none; width:100%; height:100%; object-fit:contain; }
.fl-canli.fl-tam > .fl-sessiz{ display:none; }
.fl-canli.fl-tam .fl-btn{ color:#fff; border-color:rgba(255,255,255,.3); }
.fl-sahne.fl-tam{ position:fixed; inset:0; z-index:40000; border-radius:0; background:#000; }
.fl-sahne.fl-tam video{ max-height:none; width:100%; height:100%; object-fit:contain; }
.fl-canli-sahne #fl-olcu-katman{ position:absolute; left:0; top:0; pointer-events:none; touch-action:none; }
.fl-canli-sahne #fl-olcu-katman.aktif{ pointer-events:auto; cursor:crosshair; }
.fl-ayna-araclar{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
.fl-ayna-araclar .fl-btn.secili{ border-color:var(--fl-or); background:rgba(255,106,26,.25); }
.fl-canli.fl-tam .fl-ayna-araclar .fl-btn{ color:#fff; }
.fl-dondur-btn{ min-width:120px; min-height:56px; border-radius:28px; border:3px solid #fff; background:rgba(255,255,255,.12); color:#fff; font:800 16px/1 'Archivo',sans-serif; cursor:pointer; }
.fl-dondur-btn.donuk{ background:#ff6a1a; border-color:#ff6a1a; }
.fl-kamera-satir{ display:flex; justify-content:center; }
.fl-kamera-sec{ width:auto; max-width:min(420px, 100%); min-height:40px; padding:0 12px; border-radius:8px; border:1px solid rgba(236,230,220,.25); background:#1b1917; color:#efebe5; font:600 13px/1 'Archivo',sans-serif; }
.fl-rozet-tel{ background:#198754; }
.fl-tel{ flex-direction:row; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; }
.fl-tel-ic{ display:flex; gap:16px; align-items:flex-start; flex:1; min-width:260px; }
.fl-tel-ic img, .fl-tel-qr-bos{ width:180px; height:180px; border-radius:8px; background:#fff; flex-shrink:0; }
@media (max-width:560px){ .fl-tel-ic{ flex-direction:column; } }
.fl-tel-bilgi b{ font-size:16px; }
.fl-tel-bilgi ol{ margin:8px 0; padding-left:18px; display:flex; flex-direction:column; gap:5px; font-size:13.5px; line-height:1.45; }
.fl-tel-bilgi p{ margin:6px 0 0; }
.fl-tel-durum{ display:flex; align-items:center; gap:8px; font:600 13px/1.3 'Roboto Mono',monospace; }
.fl-tel-durum i{ width:9px; height:9px; border-radius:50%; background:#ffb703; animation:flNabiz 1.2s ease-in-out infinite; flex-shrink:0; }
.fl-tel-serit{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 12px; border-radius:10px; border:1px solid rgba(61,220,132,.45); background:rgba(25,135,84,.16); font-size:13.5px; }
.fl-tel-serit i{ width:9px; height:9px; border-radius:50%; background:#3ddc84; }
.fl-tel-serit span{ flex:1; min-width:180px; }
.fl-sahne-dugmeler{ position:absolute; right:10px; top:52px; z-index:3; display:flex; gap:6px; }
.fl-sahne-dugmeler .fl-sahne-tam{ position:static; }
.fl-sahne-cubuk{ border:0; cursor:pointer; }
.fl-cbk{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; }
@media (max-width:760px){ .fl-cbk{ grid-template-columns:1fr; } }
.fl-cubuk-sol{ display:flex; flex-direction:column; gap:10px; }
.fl-cubuk-sol canvas{ width:100%; max-width:440px; aspect-ratio:1; border-radius:10px; border:1px solid var(--fl-line); align-self:center; }
.fl-cubuk-an{ display:flex; gap:6px; }
.fl-cubuk-an button{ min-height:36px; padding:0 12px; border-radius:6px; border:1px solid var(--fl-line); background:transparent; color:var(--fl-ink); font-weight:700; font-size:13px; cursor:pointer; }
.fl-cubuk-an button.aktif{ border-color:var(--fl-or); background:rgba(255,106,26,.16); }
.fl-cubuk-lejlar{ display:flex; gap:6px; flex-wrap:wrap; }
.fl-cubuk-lej{ display:inline-flex; align-items:center; gap:6px; min-height:32px; padding:0 10px; border-radius:6px; border:1px solid var(--fl-line); background:transparent; color:var(--fl-ink); font:700 12px/1 'Roboto Mono',monospace; cursor:pointer; }
.fl-cubuk-lej i{ width:12px; height:12px; border-radius:3px; }
.fl-cubuk-lej.kapali{ opacity:.4; }
.fl-cubuk-sag{ display:grid; grid-template-columns:1fr 1fr; gap:10px; align-content:start; }
@media (max-width:480px){ .fl-cubuk-sag{ grid-template-columns:1fr; } }
.fl-cubuk-grafik{ margin:0; background:var(--fl-panel); border:1px solid var(--fl-line); border-radius:8px; padding:8px 10px; }
.fl-cubuk-grafik figcaption{ font:700 12.5px/1.3 'Archivo',sans-serif; margin-bottom:4px; } .fl-cubuk-grafik figcaption small{ font:400 11px 'Roboto Mono',monospace; color:var(--fl-soft); }
.fl-cubuk-grafik svg{ width:100%; height:auto; display:block; }
.fl-cubuk-grafik .d{ fill:var(--fl-ink); font:600 10px 'Roboto Mono',monospace; text-anchor:middle; }
.fl-cubuk-grafik .n{ fill:var(--fl-soft); font:500 10px 'Roboto Mono',monospace; text-anchor:middle; }
.fl-cubuk-grafik .ort{ stroke:rgba(236,230,220,.55); stroke-dasharray:4 4; }
.fl-zoom{ position:relative; transform-origin:0 0; will-change:transform; }
.fl-canli.fl-tam .fl-zoom{ height:100%; }
.fl-yak-btn, .fl-tekrar-btn, .fl-son-btn, .fl-ayar-btn{ border:0; cursor:pointer; }
.fl-ust-sag{ position:relative; }
.fl-ayar-panel{ position:absolute; right:0; top:calc(100% + 6px); z-index:6; display:flex; flex-direction:column; gap:4px; background:rgba(14,13,12,.96); border:1px solid rgba(255,255,255,.18); border-radius:10px; padding:6px; min-width:200px; }
.fl-ayar-panel[hidden]{ display:none; }
.fl-ayar-panel button{ min-height:40px; padding:0 12px; text-align:left; border:0; border-radius:6px; background:transparent; color:#fff; font:600 13.5px/1 'Archivo',sans-serif; cursor:pointer; }
.fl-ayar-panel button:hover{ background:rgba(255,255,255,.08); }
.fl-sira-rozet{ position:absolute; left:50%; top:10px; transform:translateX(-50%); z-index:3; display:flex; align-items:center; gap:10px; background:rgba(255,106,26,.95); color:#fff; padding:6px 8px 6px 14px; border-radius:10px; }
.fl-sira-rozet small{ font:600 10.5px/1 'Roboto Mono',monospace; letter-spacing:.1em; opacity:.85; }
.fl-sira-rozet b{ font:900 18px/1 'Archivo',sans-serif; text-transform:uppercase; }
.fl-sira-rozet button{ min-height:30px; padding:0 10px; border-radius:6px; border:1px solid rgba(255,255,255,.6); background:transparent; color:#fff; font:700 12px 'Archivo',sans-serif; cursor:pointer; }
.fl-sira-serit{ display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding:12px 14px; border-radius:10px; background:rgba(255,106,26,.12); border:1px solid rgba(255,106,26,.5); }
.fl-sira-serit small{ display:block; font:600 11px/1.2 'Roboto Mono',monospace; letter-spacing:.1em; color:var(--fl-soft); }
.fl-sira-serit b{ font:900 20px/1.1 'Archivo',sans-serif; } .fl-sira-serit em{ font-style:normal; color:#3ddc84; font-weight:700; font-size:13px; }
.fl-sira-butonlar{ display:flex; gap:8px; flex-wrap:wrap; }
.fl-tel-serit.bekliyor{ border-color:rgba(255,183,3,.5); background:rgba(255,183,3,.1); } .fl-tel-serit.bekliyor i{ background:#ffb703; animation:flNabiz 1.2s ease-in-out infinite; }
/* TV modu: büyük ekran — kontroller gizli, dev pano, sporcu adı */
.fl-tv .fl-ayna-araclar, .fl-tv .fl-kamera-satir, .fl-tv > .fl-sessiz, .fl-tv .fl-canli-kontrol > .fl-btn, .fl-tv .fl-canli-kontrol > .fl-dondur-btn, .fl-tv .fl-ust-sag, .fl-tv .fl-canli-ipucu, .fl-tv .fl-yon-ipucu, .fl-tv .fl-sira-rozet{ display:none !important; }
.fl-tv .fl-canli-kontrol{ position:absolute; left:50%; bottom:max(14px, env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:4; display:flex; }
.fl-tv .fl-kayit-btn{ width:60px; height:60px; opacity:.8; } .fl-tv .fl-kayit-btn i{ width:44px; height:44px; } .fl-tv .fl-kayit-btn.kayitta i{ width:22px; height:22px; }
.fl-tv .fl-pano{ top:auto; bottom:24px; left:24px; min-width:420px; padding:16px 22px; gap:10px; }
.fl-tv .fl-pano small{ font-size:15px; } .fl-tv .fl-pano b{ font-size:44px; } .fl-tv .fl-pano div{ grid-template-columns:220px 1fr; }
.fl-tv-ad{ display:none; }
.fl-tv .fl-tv-ad{ display:flex; position:absolute; left:130px; right:24px; top:14px; z-index:4; justify-content:space-between; align-items:flex-start; gap:12px; pointer-events:none; }
.fl-tv-ad b{ font:900 clamp(28px,4vw,56px)/1 'Archivo',sans-serif; text-transform:uppercase; color:#fff; text-shadow:0 3px 20px rgba(0,0,0,.6); }
.fl-tv-ad button{ pointer-events:auto; min-height:36px; padding:0 12px; border-radius:8px; border:1px solid rgba(255,255,255,.3); background:rgba(10,10,10,.5); color:rgba(255,255,255,.8); font:600 13px 'Archivo',sans-serif; cursor:pointer; margin-left:auto; }
.fl-rozet-ses{ background:#4dabf7; color:#0b1d2e; }
.fl-omuz{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; flex:1; }
.fl-omuz input{ width:90px; min-height:38px; padding:0 10px; border-radius:6px; border:1px solid var(--fl-line); background:#0f0e0d; color:var(--fl-ink); font:600 15px/1 'Roboto Mono',monospace; }
.fl-omuz span{ font:600 13px 'Roboto Mono',monospace; color:var(--fl-soft); }
.fl-omuz small{ font:400 11.5px/1.4 'Roboto Mono',monospace; color:var(--fl-soft); flex-basis:100%; }
.fl-atis-git{ display:flex; flex-direction:column; padding:0; border:0; background:none; color:inherit; text-align:left; cursor:pointer; position:relative; width:100%; font:inherit; }
.fl-atis-aksiyon{ display:flex; border-top:1px solid var(--fl-line); }
.fl-atis-aksiyon button{ flex:1; min-height:34px; border:0; background:none; color:var(--fl-soft); font:600 11.5px/1 'Archivo',sans-serif; cursor:pointer; }
.fl-atis-aksiyon button + button{ border-left:1px solid var(--fl-line); }
.fl-atis-aksiyon button:hover{ color:var(--fl-ink); }
.fl-atis.haric{ opacity:.45; } .fl-atis.haric .fl-atis-hukum{ display:none; }
.fl-atis-bilgi em.sesli{ color:#4dabf7; }
.fl-baslik-satir{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; flex-wrap:wrap; }
.fl-baslik-ek{ font:400 12px/1.3 'Roboto Mono',monospace; color:var(--fl-soft); text-transform:none; }
.fl-link{ border:0; background:none; color:var(--fl-or); font:600 12px 'Roboto Mono',monospace; cursor:pointer; padding:0; text-decoration:underline; }
.fl-ust-sag{ flex-wrap:wrap; justify-content:flex-end; }
.fl-tekrar{ position:absolute; inset:0; z-index:5; background:#000; animation:flTekrarGel .25s ease; cursor:pointer; }
.fl-tekrar.gidiyor{ opacity:0; transition:opacity .3s ease; }
@keyframes flTekrarGel{ from{ opacity:0; } to{ opacity:1; } }
.fl-tekrar canvas{ position:absolute; inset:0; }
.fl-tekrar-ust{ position:absolute; left:10px; top:10px; display:flex; gap:8px; flex-wrap:wrap; }
.fl-tekrar-rozet{ background:#ff6a1a; color:#fff; }
.fl-tekrar-kapat{ position:absolute; right:12px; bottom:22px; min-height:42px; padding:0 14px; border-radius:8px; border:1px solid rgba(255,255,255,.35); background:rgba(10,10,10,.6); color:#fff; font:700 14px/1 'Archivo',sans-serif; cursor:pointer; }
.fl-pano{ position:absolute; left:10px; top:46px; z-index:2; background:rgba(10,10,10,.74); border-radius:8px; padding:8px 12px; display:flex; flex-direction:column; gap:4px; pointer-events:none; min-width:200px; }
.fl-pano div{ display:grid; grid-template-columns:104px 1fr; align-items:baseline; gap:8px; }
.fl-pano small{ font:500 10px/1.2 'Roboto Mono',monospace; letter-spacing:.06em; color:rgba(255,255,255,.65); }
.fl-pano b{ font:700 15px/1.2 'Roboto Mono',monospace; }
.fl-pano.buyuk{ min-width:260px; padding:10px 14px; gap:6px; } .fl-pano.buyuk b{ font-size:21px; } .fl-pano.buyuk div{ grid-template-columns:118px 1fr; }
@media (max-width:520px){ .fl-pano{ min-width:0; } .fl-pano.buyuk b{ font-size:17px; } .fl-pano div, .fl-pano.buyuk div{ grid-template-columns:92px 1fr; } }
.fl-yon-ipucu{ position:absolute; left:50%; top:46px; transform:translateX(-50%); max-width:92%; width:max-content; text-align:center; font:600 12.5px/1.35 'Archivo',sans-serif; color:#fff; background:rgba(255,106,26,.9); padding:7px 12px; border-radius:8px; z-index:2; }
.fl-ozet{ border-radius:12px; border:1px solid var(--fl-line); background:var(--fl-panel); padding:16px; display:flex; flex-direction:column; gap:12px; border-left:5px solid #3ddc84; }
.fl-ozet-orta{ border-left-color:#ffb703; } .fl-ozet-calis{ border-left-color:#ff6b5e; }
.fl-ozet-bas{ display:flex; flex-direction:column; gap:6px; }
.fl-ozet-etiket{ font:500 11px/1 'Roboto Mono',monospace; letter-spacing:.16em; color:var(--fl-soft); }
.fl-ozet-bas b{ font:900 clamp(20px,2.6vw,28px)/1.15 'Archivo',sans-serif; }
.fl-ozet-satirlar{ display:flex; flex-direction:column; }
.fl-ozet-satir{ display:grid; grid-template-columns:14px 170px 150px 1fr; gap:10px; align-items:baseline; padding:10px 0; border-top:1px solid var(--fl-line); }
.fl-ozet-satir i{ width:12px; height:12px; border-radius:50%; align-self:center; }
.fl-ozet-ad{ font-weight:800; font-size:15px; display:flex; gap:8px; align-items:baseline; }
.fl-ozet-ad em{ font:700 11px/1 'Roboto Mono',monospace; font-style:normal; text-transform:uppercase; letter-spacing:.06em; }
.fl-ozet-deger{ font:700 14px/1.2 'Roboto Mono',monospace; }
.fl-ozet-cumle{ font-size:14px; line-height:1.45; color:var(--fl-ink); }
@media (max-width:760px){ .fl-ozet-satir{ grid-template-columns:14px 1fr auto; } .fl-ozet-cumle{ grid-column:2 / -1; color:var(--fl-soft); } }
.fl-nasil summary{ cursor:pointer; font-weight:700; font-size:13.5px; color:var(--fl-soft); }
.fl-nasil ul{ margin:10px 0 0; padding-left:18px; display:flex; flex-direction:column; gap:6px; font-size:13px; line-height:1.5; color:var(--fl-ink); }
.fl-kpi-iyi b{ color:#3ddc84; } .fl-kpi-orta b{ color:#ffb703; } .fl-kpi-calis b{ color:#ff6b5e; }
.fl-kpi-iyi, .fl-kpi-orta, .fl-kpi-calis{ box-shadow:inset 0 3px 0 currentColor; }
.fl-kpi-iyi{ color:#3ddc84; } .fl-kpi-orta{ color:#ffb703; } .fl-kpi-calis{ color:#ff6b5e; }
.fl-kpi-iyi span, .fl-kpi-orta span, .fl-kpi-calis span{ color:var(--fl-ink); } .fl-kpi-iyi small, .fl-kpi-orta small, .fl-kpi-calis small{ color:var(--fl-soft); }
.fl-atis-iyi{ border-color:rgba(61,220,132,.6); } .fl-atis-orta{ border-color:rgba(255,183,3,.6); } .fl-atis-calis{ border-color:rgba(255,107,94,.7); }
.fl-atis-hukum{ position:absolute; right:8px; top:8px; font:700 11px/1 'Archivo',sans-serif; color:#111; padding:5px 7px; border-radius:4px; }
.fl-kayit-btn{ width:76px; height:76px; border-radius:50%; border:4px solid #fff; background:transparent; display:grid; place-items:center; cursor:pointer; padding:0; }
.fl-kayit-btn i{ width:56px; height:56px; border-radius:50%; background:#e5383b; transition:all .2s ease; }
.fl-kayit-btn.kayitta i{ width:28px; height:28px; border-radius:6px; }
.fl button:focus-visible, .fl label.fl-btn:focus-within{ outline:2px solid var(--fl-or); outline-offset:2px; }
`;
    document.head.appendChild(st);
}
