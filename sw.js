/* ============================================
   Service Worker — الأكاديمية الدولية للتدريب والاستشارات العلمية
   يفعّل خاصية "تثبيت التطبيق" من جوجل كروم + تخزين مؤقت بسيط للعمل شبه دون اتصال
   ============================================ */

const CACHE_NAME = 'international-academy-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/css/style.css',
    '/manifest.json',
    '/images/favicon.svg',
    '/images/icons/icon-192.png',
    '/images/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// استراتيجية: شبكة أولاً مع رجوع للكاش عند فشل الاتصال (مناسب لموقع يعتمد على Firebase الحي)
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    // لا نتدخل في طلبات Firebase / APIs الخارجية — نتركها تمر مباشرة للشبكة
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then((res) => {
                const resClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                return res;
            })
            .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
});
