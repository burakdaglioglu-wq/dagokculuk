const CACHE = 'dag-sk-v121';
const CORE_URLS = ['/', '/app.html', '/app.js', '/sync.js', '/styles.css', '/favicon.png', '/dagsk-ai-pose.js', '/dagsk-teknik-calisma.js', '/dagsk-video-compare.js'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE_URLS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
    self.clients.claim();
});

// Uygulama kabuğu (html/js/css) için: her zaman önce ağı dene (canlı deploy'lar bayat kalmasın),
// ağ yoksa (yarışma alanında sinyal kesilirse) önbellekten sun. /api/ ve /ws asla önbelleklenmez —
// skor/sporcu verisi zaten app.js'in kendi yerel kuyruk mekanizmasıyla yönetiliyor.
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') return;
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res && res.status === 200 && res.type !== 'opaque') {
                    const clone = res.clone();
                    caches.open(CACHE).then((c) => c.put(e.request, clone));
                }
                return res;
            })
            .catch(() => caches.match(e.request).then((r) => r || caches.match('/app.html')))
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
