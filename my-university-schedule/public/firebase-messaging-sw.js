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

// المتصفح سيظهر الإشعار تلقائياً في الخلفية (لذلك لا نكتب كود الإظهار هنا لمنع التكرار)

// 🌟 عند الضغط على الإشعار: نفتح التطبيق 🌟
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});