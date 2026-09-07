/* ============================================
   Service Worker — الأكاديمية الدولية للتدريب والاستشارات العلمية
   يفعّل خاصية "تثبيت التطبيق" من جوجل كروم + تخزين مؤقت بسيط للعمل شبه دون اتصال
   ============================================ */

const CACHE_NAME = 'international-academy-v2';
const APP_SHELL = [
    '/',
    '/index.html',
    '/css/style.css',
    '/manifest.json',
    '/images/favicon.svg',
    '/images/icons/icon-192.png',
    '/images/icons/icon-512.png',

    /* ====== قسم "الصحة النفسية والروحية" (أضيف بتاريخ اليوم) ====== */
    '/mental-health.html',
    '/carrot-dash.html',
    '/css/mental-health.css',
    '/js/religious.js',
    '/data/quran/index.json',
    '/data/quran/1.json',
    '/data/quran/2.json',
    '/data/quran/3.json',
    '/data/quran/4.json',
    '/data/quran/5.json',
    '/data/quran/6.json',
    '/data/quran/7.json',
    '/data/quran/8.json',
    '/data/quran/9.json',
    '/data/quran/10.json',
    '/data/quran/11.json',
    '/data/quran/12.json',
    '/data/quran/13.json',
    '/data/quran/14.json',
    '/data/quran/15.json',
    '/data/quran/16.json',
    '/data/quran/17.json',
    '/data/quran/18.json',
    '/data/quran/19.json',
    '/data/quran/20.json',
    '/data/quran/21.json',
    '/data/quran/22.json',
    '/data/quran/23.json',
    '/data/quran/24.json',
    '/data/quran/25.json',
    '/data/quran/26.json',
    '/data/quran/27.json',
    '/data/quran/28.json',
    '/data/quran/29.json',
    '/data/quran/30.json',
    '/data/quran/31.json',
    '/data/quran/32.json',
    '/data/quran/33.json',
    '/data/quran/34.json',
    '/data/quran/35.json',
    '/data/quran/36.json',
    '/data/quran/37.json',
    '/data/quran/38.json',
    '/data/quran/39.json',
    '/data/quran/40.json',
    '/data/quran/41.json',
    '/data/quran/42.json',
    '/data/quran/43.json',
    '/data/quran/44.json',
    '/data/quran/45.json',
    '/data/quran/46.json',
    '/data/quran/47.json',
    '/data/quran/48.json',
    '/data/quran/49.json',
    '/data/quran/50.json',
    '/data/quran/51.json',
    '/data/quran/52.json',
    '/data/quran/53.json',
    '/data/quran/54.json',
    '/data/quran/55.json',
    '/data/quran/56.json',
    '/data/quran/57.json',
    '/data/quran/58.json',
    '/data/quran/59.json',
    '/data/quran/60.json',
    '/data/quran/61.json',
    '/data/quran/62.json',
    '/data/quran/63.json',
    '/data/quran/64.json',
    '/data/quran/65.json',
    '/data/quran/66.json',
    '/data/quran/67.json',
    '/data/quran/68.json',
    '/data/quran/69.json',
    '/data/quran/70.json',
    '/data/quran/71.json',
    '/data/quran/72.json',
    '/data/quran/73.json',
    '/data/quran/74.json',
    '/data/quran/75.json',
    '/data/quran/76.json',
    '/data/quran/77.json',
    '/data/quran/78.json',
    '/data/quran/79.json',
    '/data/quran/80.json',
    '/data/quran/81.json',
    '/data/quran/82.json',
    '/data/quran/83.json',
    '/data/quran/84.json',
    '/data/quran/85.json',
    '/data/quran/86.json',
    '/data/quran/87.json',
    '/data/quran/88.json',
    '/data/quran/89.json',
    '/data/quran/90.json',
    '/data/quran/91.json',
    '/data/quran/92.json',
    '/data/quran/93.json',
    '/data/quran/94.json',
    '/data/quran/95.json',
    '/data/quran/96.json',
    '/data/quran/97.json',
    '/data/quran/98.json',
    '/data/quran/99.json',
    '/data/quran/100.json',
    '/data/quran/101.json',
    '/data/quran/102.json',
    '/data/quran/103.json',
    '/data/quran/104.json',
    '/data/quran/105.json',
    '/data/quran/106.json',
    '/data/quran/107.json',
    '/data/quran/108.json',
    '/data/quran/109.json',
    '/data/quran/110.json',
    '/data/quran/111.json',
    '/data/quran/112.json',
    '/data/quran/113.json',
    '/data/quran/114.json',
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
