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

// استقبال الإشعار والتطبيق مغلق
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // استخراج العنوان والنص بأمان تام من أي مكان في الـ payload
  const notificationTitle = payload.notification?.title || payload.data?.title || 'تنبيه';
  const notificationOptions = {
   tag: 'versa-update', // 🌟 هذا السطر يمنع التكرار
    body: payload.notification?.body || payload.data?.body || 'تحديث جديد',
    icon: '/pwa-192x192.png', // 🌟 نستخدم أيقونة التطبيق الحقيقية هنا
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    data: { url: payload.data?.url || '/' } 
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
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