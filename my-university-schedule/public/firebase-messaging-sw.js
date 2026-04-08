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

messaging.onBackgroundMessage((payload) => {
  console.log('Background message: ', payload);

  const title = payload.notification?.title || payload.data?.title || 'تنبيه جديد';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'تحديث في الجدول',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    data: { url: payload.data?.url || '/' },
    // 🌟 أضف Tag لمنع تكرار الإشعارات القديمة 🌟
    tag: 'uni-notif-tag' 
  };

  // استخدم self.registration مباشرة لضمان التنفيذ
  return self.registration.showNotification(title, options);
});

// 🌟 عند الضغط على الإشعار: يأخذك للجدول مباشرة 🌟
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان التطبيق مفتوحاً في الخلفية، اجلبه للمقدمة
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان التطبيق مغلقاً تماماً، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});