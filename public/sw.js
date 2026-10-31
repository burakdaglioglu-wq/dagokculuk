const CACHE = 'dag-sk-v361';
// Form Lab yapay zekâ dosyaları (MediaPipe wasm + modeller, ~20 MB): sürümlü kabuk önbelleğinden AYRI ve kalıcı —
// her deploy'da silinmez, önce önbellekten sunulur (bir kez iner, sonra internetsiz de açılır). Adresler sürüm
// numarası taşıdığı için içerik değişmez; yeni sürüm = yeni adres.
const ML_CACHE = 'dagsk-ml-1';
const AG_SURE_MS = 3000, YAVAS_MS = 60000;
let _yavasBitis = 0;
const mlMi =(u) => (u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/@mediapipe/tasks-vision@')) || (u.hostname === 'storage.googleapis.com' && u.pathname.startsWith('/mediapipe-models/'));
const CORE_URLS = ['/', '/app.html', '/app.js', '/sync.js', '/styles.css', '/favicon.png', '/dagsk-ai-pose.js', '/dagsk-teknik-calisma.js', '/dagsk-video-compare.js', '/dagsk-cadence-coach.js', '/dagsk-target-cv.js', '/dagsk-hedef-foto.js', '/dagsk-performans.js', '/dagsk-km-rehber.js', '/dagsk-kisi-yonetimi.js', '/dagsk-km-yoklama-analiz.js', '/dagsk-km-kelime.js', '/dagsk-km-parti.js', '/dagsk-km-yuva.js', '/dagsk-km-ders-paneli.js', '/dagsk-km-kurtarma.js', '/dagsk-km-hapsirik.js', '/dagsk-km-akvaryum.js', '/dagsk-km-kale.js', '/dagsk-km-fener.js', '/dagsk-km-halat.js', '/dagsk-km-il.js', '/dagsk-vitrin.js', '/dagsk-defter.js', '/dagsk-km-reaksiyon.js', '/dagsk-km-ortak.js', '/dagsk-km-sablon-ozet.js', '/dagsk-ozel-ders.js', '/dagsk-yapilacaklar.js', '/dagsk-hizli-duzenle.js', '/dagsk-km-yarisma-pro.js', '/dagsk-toren3d.js', '/dagsk-dag-altin.js', '/vendor/three-r128.min.js', '/dagsk-km-yarisma-analiz.js', '/dagsk-yarismalar.js', '/dagsk-sporcu-giris.js', '/dagsk-istatistik.js', '/dagsk-sporcu-kart.js', '/dagsk-km-kocluk.js', '/dagsk-km-gelisim.js', '/dagsk-km-formlab.js', '/dagsk-km-video.js', '/sade-gece.js', '/dagsk-deneme.js', '/dagsk-program-pano.js', '/kamera-analiz.js', '/apple-touch-icon.png', '/manifest.webmanifest', '/ikon-192.png', '/ikon-512.png',
    // sayfa başındaki dış dosyalar (crossorigin ile yüklenir → önbelleğe girebilir; yoksa zayıf internette sayfa bunları bekliyordu)
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js', 'https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800&family=Roboto+Mono:wght@400;500;700&family=Poppins:wght@300;400;600;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap'];

// İNTERNETSİZ AÇILIŞ DÜZELTMESİ (2026-10-03): sunucu /app.html → /app (307) yönlendiriyor. Önbelleğe yönlendirilmiş
// (redirected) bir yanıt yazılınca tarayıcı sayfa açılışında onu reddediyor (ERR_FAILED) → uygulama internetsiz hiç
// açılmıyordu. Yönlendirilmiş yanıtlar 'temiz' bir kopya olarak, hem istenen hem varılan adrese yazılır.
const temiz = (res) => res.redirected ? res.blob().then((b) => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers })) : Promise.resolve(res);
const yaz = (c, istek, res) => {
    const hedef = res.redirected && res.url ? res.url : null;
    return temiz(res).then((t) => Promise.all([c.put(istek, t.clone()), hedef ? c.put(hedef, t.clone()) : null]));
};
self.addEventListener('install', (e) => {
    // Yeni sürüm zayıf internette inemezse o dosyanın eski kopyası yeni önbelleğe taşınır — yoksa activate eski önbelleği silince
    // uygulama yarım kalıp dosyayı yine internetten beklerdi.
    const eski = (c, u) => caches.match(u).then((r) => (r ? c.put(u, r) : null));
    e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE_URLS.map((u) => fetch(u, { cache: 'reload' }).then((res) => (res.ok ? yaz(c, u, res) : eski(c, u))).catch(() => eski(c, u).catch(() => null))))));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== ML_CACHE).map((k) => caches.delete(k)))));
    self.clients.claim();
});

// Uygulama kabuğu (html/js/css) için: her zaman önce ağı dene (canlı deploy'lar bayat kalmasın),
// ağ yoksa (yarışma alanında sinyal kesilirse) önbellekten sun. /api/ ve /ws asla önbelleklenmez —
// skor/sporcu verisi zaten app.js'in kendi yerel kuyruk mekanizmasıyla yönetiliyor.
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') return;
    if (mlMi(url)) {
        e.respondWith(caches.open(ML_CACHE).then((c) => c.match(e.request.url).then((r) => r || fetch(e.request).then((res) => {
            if (res && res.status === 200 && res.type !== 'opaque') c.put(e.request.url, res.clone());
            return res;
        }))));
        return;
    }
    // ZAYIF İNTERNET (2026-10-26). Ölçüm: her istek 25 sn'de cevaplanınca uygulama 77 sn'de açılıyordu — ağ önce deneniyor,
    // önbellek ancak istek tamamen düşünce kullanılıyordu (yarışma salonunda "hiçbir şey çalışmadı"). Artık önbellekte kopyası
    // olan dosyada ağ en çok AG_SURE_MS beklenir, sonra önbellekten açılır; ağ cevabı sonradan gelirse önbellek yine tazelenir
    // (yeni sürüm bir sonraki açılışta). Bir istek süreyi aşınca ağ YAVAS_MS boyunca "yavaş" sayılır: önbellekte olan her dosya
    // beklemeden verilir ve arkadan istek de atılmaz (zayıf hattı skor gönderimine bırakır). Ölçüm: 32 sn → birkaç sn.
    // Sayfa adreslerinde ?sg=… gibi sorgu önbellek eşleşmesinde yok sayılır.
    const navigate = e.request.mode === 'navigate';
    const yedek = () => caches.match(e.request, { ignoreSearch: navigate }).then((r) => r || (navigate && url.pathname.startsWith('/app') ? caches.match('/app.html').then((a) => a || caches.match('/app')) : null) || caches.match('/app.html'));
    const agdan = () => fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            return caches.open(CACHE).then((c) => yaz(c, e.request, clone)).catch(() => {}).then(() => res);
        }
        return res;
    });
    e.respondWith(caches.match(e.request, { ignoreSearch: navigate }).then((onbellek) => {
        if (!onbellek) return agdan().catch(yedek);
        if (Date.now() < _yavasBitis) return onbellek;
        const ag = agdan();
        e.waitUntil(ag.catch(() => {}));
        return new Promise((ok) => {
            let bitti = false;
            const z = setTimeout(() => { if (bitti) return; bitti = true; _yavasBitis = Date.now() + YAVAS_MS; ok(onbellek); }, AG_SURE_MS);
            ag.then((res) => { if (bitti) return; bitti = true; clearTimeout(z); ok(res); }, () => { if (bitti) return; bitti = true; clearTimeout(z); ok(onbellek); });
        });
    }));
});

// Düello daveti gibi bildirimler için Web Push. Uygulama arka planda/kapalıyken de gösterilir.
self.addEventListener('push', (e) => {
    let data = {};
    try { data = e.data ? e.data.json() : {}; } catch (err) {}
    const title = data.title || 'DAĞ S.K.';
    const options = {
        body: data.body || '',
        tag: data.tag || undefined,
        data: data.data || {},
        actions: data.actions || [],
        renotify: !!data.tag,
        requireInteraction: (data.data && data.data.kind === 'duello-davet') || false,
    };
    e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const data = e.notification.data || {};
    const action = e.action || 'open';
    e.waitUntil(
        (async () => {
            const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const payload = { source: 'dagsk-push', action, data };
            if (clientsList.length) {
                clientsList[0].postMessage(payload);
                return clientsList[0].focus();
            }
            const win = await self.clients.openWindow('/app.html');
            if (win) setTimeout(() => win.postMessage(payload), 1500);
        })()
    );
});
