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
        ${govde}</div>`;
    if (_fl.durum === 'sonuc' && _fl.sonuc) flOynaticiKur();
    if (_fl.durum === 'canli') flCanliBagla();
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
    return `<div class="fl-kutu fl-basla">
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
        let c = await caches.open('dagsk-ml-1'), l = [FL_TV + '/vision_bundle.mjs', _fl.fileset.wasmLoaderPath, _fl.fileset.wasmBinaryPath, FL_MODEL_POSE, FL_MODEL_EL].filter(Boolean), hepsi = true;
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
        _fl.pose = await yap(v.PoseLandmarker, FL_MODEL_POSE, { numPoses: 1, minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4 });
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
    _fl.olcum = null; _fl.url = URL.createObjectURL(f); _fl.dosyaAd = f.name || 'video'; _fl.sonuc = null; _fl.kayitAnahtar = null; _fl.iptal = false;
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
            let r = _fl.pose.detectForVideo(v, ts), lm = r && r.landmarks && r.landmarks[0], z2 = performance.now(), z3 = z2;
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
            let r = _fl.pose.detectForVideo(v, ts), lm = r && r.landmarks && r.landmarks[0];
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
    return `<div class="fl-canli${_fl.tamEkran ? ' fl-tam' : ''}">
        <div class="fl-canli-sahne"><video id="fl-canli-video" playsinline muted autoplay></video><canvas id="fl-canli-katman"></canvas>
            <div class="fl-canli-ust"><span id="fl-canli-sure" class="fl-rozet ${c.kayit ? 'kayit' : ''}">${c.kayit ? '● KAYIT' : 'HAZIR'}</span><span class="fl-ust-sag"><span id="fl-canli-atis" class="fl-rozet">ATIŞ ${c.atisSay || 0}</span><button class="fl-rozet fl-tam-btn" onclick="flTamEkranDegis()">${_fl.tamEkran ? 'Küçült' : 'Tam ekran'}</button></span></div>
            <div class="fl-canli-ipucu" id="fl-canli-ipucu">${flEsc(c.ipucu || '')}</div>
        </div>
        <div class="fl-canli-kontrol">
            <button class="fl-btn" onclick="flCanliVazgec()">Vazgeç</button>
            <button class="fl-kayit-btn ${c.kayit ? 'kayitta' : ''}" id="fl-kayit-btn" onclick="flKayitDugme()" aria-label="${c.kayit ? 'Kaydı bitir ve analiz et' : 'Kaydı başlat'}"><i></i></button>
            <button class="fl-btn" onclick="flKameraCevir()" ${c.kayit ? 'disabled' : ''}>Kamerayı çevir</button>
        </div>
        <p class="fl-sessiz">Önce sporcu kadraja tam girsin ("Kadraj tamam" yazısı), sonra kırmızı düğmeye bas. 5-10 atış çekip durdur; sonuç hemen çıkar.</p>
    </div>`;
}
async function flCanliAc() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { _fl.durum = 'hata'; _fl.mesaj = 'Bu tarayıcı uygulama içinden kamera açmayı desteklemiyor. "Videodan seç" ile telefonun kamerasında çektiğin videoyu kullan.'; return kmFormLabCiz(); }
    _fl.sonuc = null; _fl.kayitAnahtar = null;
    _fl.durum = 'canli'; _fl.canli = { kayit: false, kareler: [], bas: 0, yon: _fl.canliYon || 'environment', ipucu: 'Kamera açılıyor…', atisSay: 0, yakinBas: null };
    _fl.tamEkran = true; kmFormLabCiz();
    flTamIste(document.querySelector('.fl-canli')); // dokunuşun içinde (tarayıcı tam ekranı yalnız kullanıcı hareketiyle açar)
    try {
        await flKameraBaslat();
        flCanliIpucu('Yapay zekâ hazırlanıyor… (ilk seferde ~13 MB iner)');
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
async function flKameraBaslat() {
    if (_fl.akis) _fl.akis.getTracks().forEach(t => t.stop());
    _fl.akis = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: _fl.canli.yon, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } });
    flCanliBagla();
}
function flCanliBagla() {
    let v = document.getElementById('fl-canli-video'); if (!v || !_fl.akis) return;
    if (v.srcObject !== _fl.akis) { v.srcObject = _fl.akis; v.play().catch(() => {}); }
}
async function flKameraCevir() {
    if (!_fl.canli || _fl.canli.kayit) return;
    _fl.canli.yon = _fl.canliYon = _fl.canli.yon === 'environment' ? 'user' : 'environment';
    try { await flKameraBaslat(); } catch (e) { showToast('Kamera değiştirilemedi', 'error'); }
}
function flCanliIpucu(m) { if (_fl.canli) _fl.canli.ipucu = m; let el = document.getElementById('fl-canli-ipucu'); if (el) { el.textContent = m; el.classList.toggle('tamam', /^Kadraj tamam/.test(m)); } }
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
    flTamCik();
    cancelAnimationFrame(_fl.canliRaf);
    try { if (_fl.kaydedici && _fl.kaydedici.state !== 'inactive') _fl.kaydedici.stop(); } catch (e) {}
    if (_fl.akis) { _fl.akis.getTracks().forEach(t => t.stop()); _fl.akis = null; }
}
function flCanliVazgec() { flCanliKapat(); _fl.canli = null; _fl.durum = 'bos'; kmFormLabCiz(); }
function flKayitDugme() {
    let c = _fl.canli; if (!c || !_fl.pose) { showToast('Yapay zekâ hâlâ hazırlanıyor, birkaç saniye bekle', 'info'); return; }
    if (!c.kayit) flKayitBaslat(); else flCanliBitir();
}
function flKayitBaslat() {
    let c = _fl.canli, v = document.getElementById('fl-canli-video'); if (!v || !v.videoWidth) return;
    c.kareler = []; c.atisSay = 0; c.yakinBas = null; c.parcalar = []; c.W = v.videoWidth; c.H = v.videoHeight;
    let tipler = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    let tip = window.MediaRecorder ? (tipler.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '') : null;
    _fl.kaydedici = null;
    if (tip !== null) {
        try {
            let r = new MediaRecorder(_fl.akis, tip ? { mimeType: tip, videoBitsPerSecond: 4000000 } : undefined);
            r.ondataavailable = e => { if (e.data && e.data.size) c.parcalar.push(e.data); };
            r.start(1000); _fl.kaydedici = r; c.tip = r.mimeType || tip || 'video/webm';
        } catch (e) { _fl.kaydedici = null; }
    }
    c.bas = performance.now(); c.kayit = true;
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
    if (_fl.akis) { _fl.akis.getTracks().forEach(t => t.stop()); _fl.akis = null; }
    flTamCik(); _fl.tamEkran = false;
    if (T < 3) { _fl.durum = 'hata'; _fl.mesaj = 'Çekim çok kısa — en az birkaç atış çek.'; _fl.canli = null; return kmFormLabCiz(); }
    _fl.durum = 'analiz'; _fl.ilerleme = 1; _fl.mesaj = 'Atışlar ayrılıyor…'; kmFormLabCiz();
    await new Promise(r => setTimeout(r, 30));
    if (_fl.url) { try { URL.revokeObjectURL(_fl.url); } catch (e) {} }
    _fl.url = blob ? URL.createObjectURL(blob) : null;
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
    if (sonuc.atislar.length) await flKucukResimlerCanli(sonuc);
    _fl.sonuc = sonuc; _fl.canli = null; _fl.durum = 'sonuc';
    if (_kmAktifSekme === 'formlab') kmFormLabCiz();
}
function flCanliDongu() {
    cancelAnimationFrame(_fl.canliRaf);
    let son = 0, snapC = document.createElement('canvas'); snapC.width = snapC.height = 160;
    const adim = () => {
        if (_fl.durum !== 'canli' || !_fl.canli) return;
        _fl.canliRaf = requestAnimationFrame(adim);
        let v = document.getElementById('fl-canli-video'), cv = document.getElementById('fl-canli-katman');
        if (!v) { flCanliKapat(); _fl.canli = null; _fl.durum = 'bos'; return; } // Karışık Sınıf kapandı → kamera kapansın
        if (!cv || v.readyState < 2 || !v.videoWidth || !_fl.pose) return;
        let simdi = performance.now(); if (simdi - son < 85) return; son = simdi;
        let c = _fl.canli, W = v.videoWidth, H = v.videoHeight, ts = flTs(simdi), kare = { t: (simdi - c.bas) / 1000, p: null, h: null };
        let r = _fl.pose.detectForVideo(v, ts), lm = r && r.landmarks && r.landmarks[0];
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
        flCanliCiz(v, cv, kare, W, H);
    };
    _fl.canliRaf = requestAnimationFrame(adim);
}
// canlı katman: iskelet + çapa vizörü + kadraj uyarısı + canlı atış sayacı (kaba: vücut modelinin işaret parmağı)
function flCanliCiz(v, cv, kare, W, H) {
    let r = v.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
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
    // canlı atış sayacı: çekiş eli çeneye yakın + yay kolu açık ≥0,6 sn sonra uzaklaşırsa +1
    let ag = [(p[9][0] + p[10][0]) / 2 * W, (p[9][1] + p[10][1]) / 2 * H], Spx = S * Math.min(W, H) || 1;
    let mes = i => Math.hypot(p[i][0] * W - ag[0], p[i][1] * H - ag[1]) / Spx;
    let sagMi = mes(20) <= mes(19), ci = sagMi ? 20 : 19, yay = sagMi ? [11, 13, 15] : [12, 14, 16];
    let yayAci = flAci(...yay.map(i => [p[i][0] * W, p[i][1] * H])), yakin = mes(ci) < 0.75 && yayAci > 145;
    let Cp = P(ci), bo = 30, renk = yakin ? '#ff9a3c' : 'rgba(255,255,255,.85)';
    x.strokeStyle = renk; x.lineWidth = 2.5;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { let cx = Cp[0] + sx * bo / 2, cy = Cp[1] + sy * bo / 2; x.beginPath(); x.moveTo(cx, cy - sy * 11); x.lineTo(cx, cy); x.lineTo(cx - sx * 11, cy); x.stroke(); });
    if (c.kayit) {
        if (yakin && c.yakinBas == null) c.yakinBas = kare.t;
        if (!yakin && c.yakinBas != null) { if (kare.t - c.yakinBas >= 0.6) { c.atisSay++; let el = document.getElementById('fl-canli-atis'); if (el) el.textContent = 'ATIŞ ' + c.atisSay; } c.yakinBas = null; }
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
    // 5) özet + bulgular
    let ozet = {
        n: atislar.length, taraf,
        tutmaOrt: flOrt(atislar.map(a => a.tutma)), tutmaSap: flSapma(atislar.map(a => a.tutma)),
        kaymaOrt: flOrt(atislar.map(a => a.kayma)),
        yayKolOrt: flOrt(atislar.map(a => a.yayKol)), yayKolSap: flSapma(atislar.map(a => a.yayKol)),
        egimOrt: flOrt(atislar.map(a => a.egim)), dirsekYukOrt: flOrt(atislar.map(a => a.dirsekYuk)),
        dusen: atislar.filter(a => a.dusus != null && a.dusus > 0.18).length,
        kilitsiz: atislar.filter(a => a.kilitBas == null).length,
    };
    let mx = flOrt(atislar.map(a => a.merkez[0])), my = flOrt(atislar.map(a => a.merkez[1]));
    ozet.capaFark = atislar.length > 1 ? Math.sqrt(flOrt(atislar.map(a => (a.merkez[0] - mx) ** 2 + (a.merkez[1] - my) ** 2))) : 0;
    atislar.forEach(a => { a.capaUzak = Math.hypot(a.merkez[0] - mx, a.merkez[1] - my); });
    return { atislar, ozet, olc, omuzCm };
}
// omuz birimi → mm (tahmini, grubun ortalama omuz genişliğiyle)
function flMm(birim, g) { return Math.round(birim * (FL_OMUZ_CM[g] || 34) * 10); }
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
    if (!oz.n) return `<div class="fl-kutu fl-hata"><b>Videoda atış bulunamadı</b>
        <p>Çekiş eli çeneye gelen ve yay kolu açık olan bir an yakalanamadı. Sporcu önden, yüzü ve iki eli görünecek şekilde çekilmeli; kamera sabit olmalı.</p>
        <div class="fl-butonlar"><button class="fl-btn fl-btn-ana" onclick="flCanliAc()">Yeniden çek</button><label class="fl-btn"><input type="file" accept="video/*" onchange="flDosyaSecildi(this)" hidden>Başka video seç</label></div></div>`;
    let puan = flPuan(oz), bul = flBulgular(oz, g);
    let kpi = (b, e, a) => `<div class="fl-kpi"><b>${b}</b><span>${e}</span>${a ? `<small>${a}</small>` : ''}</div>`;
    let kartlar = s.atislar.map(a => `<button class="fl-atis ${a.kilitBas == null ? 'kilitsiz' : ''}" onclick="flAtisaGit(${a.no})">
        ${a.resim ? `<img src="${a.resim}" alt="Atış ${a.no} çapa anı">` : '<span class="fl-atis-resimsiz"></span>'}
        <span class="fl-atis-no">${String(a.no).padStart(2, '0')}</span>
        <span class="fl-atis-bilgi"><b>${a.kilitBas == null ? 'kilitlenmedi' : flTr(a.tutma, 1) + ' sn'}</b><small>kayma ≈${mm(a.kayma)} mm · yay kolu ${a.yayKol != null ? Math.round(a.yayKol) + '°' : '—'}</small>${a.dusus != null && a.dusus > 0.18 ? '<em>yay kolu düştü</em>' : ''}${s.atislar.length > 1 && mm(a.capaUzak) >= 10 ? '<em>çapa farklı yerde</em>' : ''}</span>
    </button>`).join('');
    let bulHTML = bul.length ? bul.map(b => `<div class="fl-bulgu ${b.ciddi ? 'ciddi' : ''}"><div><b>${flEsc(b.baslik)}</b><span class="fl-deger">${flEsc(b.deger)}</span><p>${flEsc(b.not)}</p></div>
        ${_fl.secili ? `<button class="fl-btn fl-btn-kucuk" onclick="flOdakYap('${b.hata}')">Teknik odak yap</button>` : ''}</div>`).join('')
        : '<div class="fl-bulgu iyi"><div><b>Belirgin bir sorun görünmüyor</b><p>Çapa yeri, bekleme ve kol açıları atıştan atışa tutarlı.</p></div></div>';
    let kayitli = !!_fl.kayitAnahtar;
    return `<div class="fl-sonuc">
        ${_fl.url ? `<div class="fl-sahne"><video id="fl-video" src="${_fl.url}" playsinline muted controls preload="auto"></video><canvas id="fl-katman"></canvas><button class="fl-rozet fl-sahne-tam" onclick="flSahneTam()">Tam ekran</button></div>` : '<p class="fl-sessiz">Bu tarayıcı çekimi kaydedemedi; analiz yapıldı ama video oynatılamıyor.</p>'}
        <div class="fl-grafik-kutu"><div class="fl-grafik-ust"><span>ÇEKİŞ ELİ ↔ ÇENE · ${oz.n} ATIŞ</span><span class="fl-lejant"><i class="k"></i>çapa kilitli <i class="b"></i>bırakış</span></div>${flGrafikSVG(s)}</div>
        <div class="fl-kpiler">
            ${kpi(puan + '<span>/100</span>', 'tutarlılık', 'çapa, bekleme ve kol açısına göre')}
            ${kpi(oz.n, 'atış bulundu', oz.kilitsiz ? oz.kilitsiz + ' tanesi kilitlenmedi' : 'hepsinde çapa kilitlendi')}
            ${kpi(oz.n > 1 ? '≈' + mm(oz.capaFark) + '<span> mm</span>' : '—', 'çapa noktası farkı', 'atıştan atışa')}
            ${kpi('≈' + mm(oz.kaymaOrt || 0) + '<span> mm</span>', 'çapada kayma', 'kilitliyken, ortalama')}
            ${kpi(flTr(oz.tutmaOrt || 0, 1) + '<span> sn</span>', 'çapada bekleme', '±' + flTr(oz.tutmaSap || 0, 1) + ' sn')}
            ${kpi(oz.yayKolOrt != null ? Math.round(oz.yayKolOrt) + '°' : '—', 'yay kolu (bırakış)', '±' + flTr(oz.yayKolSap || 0, 0) + '°')}
        </div>
        <div class="fl-baslik2">Her atış, çapa anında</div>
        <div class="fl-atislar">${kartlar}</div>
        <div class="fl-baslik2">Olası bulgular</div>
        <div class="fl-bulgular">${bulHTML}</div>
        <p class="fl-sessiz">Ölçümler tek kameradan yapay zekâ tahminidir; mm değerleri grubun ortalama omuz genişliğiyle çevrilmiş yaklaşık değerlerdir. Karar eğitmenindir.</p>
        <div class="fl-butonlar">
            ${_fl.secili ? `<button class="fl-btn fl-btn-ana" onclick="flKaydet()" ${kayitli ? 'disabled' : ''}>${kayitli ? 'Karneye kaydedildi' : 'Sporcunun karnesine kaydet'}</button>` : '<span class="fl-sessiz">Kaydetmek için yukarıdan sporcu seç.</span>'}
            <button class="fl-btn" onclick="flPaylas()">WhatsApp'ta paylaş</button>
            <button class="fl-btn" onclick="flCanliAc()">Yeni çekim</button>
        </div>
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
    let r = v.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; }
    let x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, r.width, r.height);
    // video içeriğinin kutu içindeki yeri (contain)
    let olc = Math.min(r.width / s.W, (r.height - 0) / s.H), ox = (r.width - s.W * olc) / 2, oy = (r.height - s.H * olc) / 2;
    let P = q => [ox + q[0] * olc, oy + q[1] * olc];
    let i = Math.min(s.olc.length - 1, Math.max(0, Math.round(v.currentTime * FL_FPS))), o = s.olc[i], k = s.kareler[i];
    let im = document.getElementById('fl-imlec'); if (im) { let gx = (i / Math.max(1, s.olc.length - 1)) * 1000; im.setAttribute('x1', gx); im.setAttribute('x2', gx); }
    let mono = '600 11px "Roboto Mono", ui-monospace, monospace';
    // sol cetvel
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '10px "Roboto Mono", monospace'; x.lineWidth = 1;
    for (let yy = 20, n = 0; yy < r.height - 10; yy += 12, n++) { x.beginPath(); x.moveTo(6, yy); x.lineTo(n % 5 ? 12 : 18, yy); x.stroke(); }
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
    if (o.yayKol != null) etiket(p[yD], 'YAY KOLU ' + Math.round(o.yayKol) + '°', '#9ec5ff');
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
        x.font = '700 28px "Roboto Mono", monospace'; x.fillStyle = '#fff'; let t = String(Math.min(99, mmK)).padStart(2, '0'); x.fillText(t, r.width - 128, 40);
        x.font = '600 10px "Roboto Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('MM ÇAPA', r.width - 86, 28); x.fillText('KAYMASI', r.width - 86, 41);
    }
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
.fl-canli-sahne video{ display:block; width:100%; max-height:66vh; object-fit:contain; background:#000; }
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
.fl-kayit-btn{ width:76px; height:76px; border-radius:50%; border:4px solid #fff; background:transparent; display:grid; place-items:center; cursor:pointer; padding:0; }
.fl-kayit-btn i{ width:56px; height:56px; border-radius:50%; background:#e5383b; transition:all .2s ease; }
.fl-kayit-btn.kayitta i{ width:28px; height:28px; border-radius:6px; }
.fl button:focus-visible, .fl label.fl-btn:focus-within{ outline:2px solid var(--fl-or); outline-offset:2px; }
`;
    document.head.appendChild(st);
}
