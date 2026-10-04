const CACHE = 'dag-sk-v205';
// Form Lab yapay zekâ dosyaları (MediaPipe wasm + modeller, ~20 MB): sürümlü kabuk önbelleğinden AYRI ve kalıcı —
// her deploy'da silinmez, önce önbellekten sunulur (bir kez iner, sonra internetsiz de açılır). Adresler sürüm
// numarası taşıdığı için içerik değişmez; yeni sürüm = yeni adres.
const ML_CACHE = 'dagsk-ml-1';
const mlMi = (u) => (u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/@mediapipe/tasks-vision@')) || (u.hostname === 'storage.googleapis.com' && u.pathname.startsWith('/mediapipe-models/'));
const CORE_URLS = ['/', '/app.html', '/app.js', '/sync.js', '/styles.css', '/favicon.png', '/dagsk-ai-pose.js', '/dagsk-teknik-calisma.js', '/dagsk-video-compare.js', '/dagsk-cadence-coach.js', '/dagsk-target-cv.js', '/dagsk-performans.js', '/dagsk-km-rehber.js', '/dagsk-kisi-yonetimi.js', '/dagsk-km-yoklama-analiz.js', '/dagsk-km-kelime.js', '/dagsk-km-reaksiyon.js', '/dagsk-km-ortak.js', '/dagsk-km-sablon-ozet.js', '/dagsk-yapilacaklar.js', '/dagsk-hizli-duzenle.js', '/dagsk-km-yarisma-pro.js', '/dagsk-km-kocluk.js', '/dagsk-km-gelisim.js', '/dagsk-km-formlab.js', '/apple-touch-icon.png'];

// İNTERNETSİZ AÇILIŞ DÜZELTMESİ (2026-10-03): sunucu /app.html → /app (307) yönlendiriyor. Önbelleğe yönlendirilmiş
// (redirected) bir yanıt yazılınca tarayıcı sayfa açılışında onu reddediyor (ERR_FAILED) → uygulama internetsiz hiç
// açılmıyordu. Yönlendirilmiş yanıtlar 'temiz' bir kopya olarak, hem istenen hem varılan adrese yazılır.
const temiz = (res) => res.redirected ? res.blob().then((b) => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers })) : Promise.resolve(res);
const yaz = (c, istek, res) => {
    const hedef = res.redirected && res.url ? res.url : null;
    return temiz(res).then((t) => Promise.all([c.put(istek, t.clone()), hedef ? c.put(hedef, t.clone()) : null]));
};
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE_URLS.map((u) => fetch(u, { cache: 'reload' }).then((res) => (res.ok ? yaz(c, u, res) : null)).catch(() => null)))));
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
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res && res.status === 200 && res.type !== 'opaque') {
                    const clone = res.clone();
                    caches.open(CACHE).then((c) => yaz(c, e.request, clone));
                }
                return res;
            })
            .catch(() => caches.match(e.request).then((r) => r || (e.request.mode === 'navigate' && url.pathname.startsWith('/app') ? caches.match('/app.html').then((a) => a || caches.match('/app')) : r) || caches.match('/app.html')))
    );
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
