importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA9Gnzgm7U5EkYK1P9LY7N-kHa0EsZLz-g",
  authDomain: "uni-schedule-99109.firebaseapp.com",
  projectId: "uni-schedule-99109",
  messagingSenderId: "105399583397",
  appId: "1:105399583397:web:ec566e801ef45d3ae3434c"
});

const messaging = firebase.messaging();

// ==========================================
// 1. قسم الإشعارات (Notifications)
// ==========================================
messaging.onBackgroundMessage((payload) => {
  // 🌟 منع التكرار: بما أننا نرسل notification من السيرفر، المتصفح سيعرض الإشعار تلقائياً.
  // إذا اكتشفنا وجود notification نوقف العرض اليدوي هنا لكي لا يصل الإشعار مرتين.
  if (payload.notification) {
    return; 
  }

  // الكود القديم يعمل فقط كاحتياطي في حال إرسال بيانات (Data) فقط مستقبلاً
  const title = payload.data?.title || "تنبيه جديد";
  const options = {
    body: payload.data?.body || "يوجد تحديث",
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    vibrate: [200, 100, 200],
    data: { url: payload.data?.url || '/' }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ==========================================
// 2. قسم الأوفلاين (Offline Caching)
// ==========================================
const CACHE_NAME = 'versa-schedule-cache-v2';

// تنصيب السيرفس ووركر فوراً
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// تنظيف الكاش القديم إن وجد
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// اعتراض الطلبات وحفظها للعمل أوفلاين
self.addEventListener('fetch', (event) => {
  // نتجاهل طلبات فايربيس والـ API لأننا نريد كاش للواجهة فقط
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }).catch(() => {}); 
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {});
    })
  );
});