importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ضع إعدادات مشروعك هنا (نفس التي في firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyA9Gnzgm7U5EkYK1P9LY7N-kHa0EsZLz-g",
  authDomain: "uni-schedule-99109.firebaseapp.com",
  projectId: "uni-schedule-99109",
  messagingSenderId: "105399583397",
  appId: "1:105399583397:web:ec566e801ef45d3ae3434c"
});

const messaging = firebase.messaging();

// 🌟 هذا هو الكود السحري الذي يستقبل الإشعارات والهاتف مغلق 🌟
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // استخراج العنوان والتفاصيل من الإشعار القادم من القاعدة
  const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار من الجدول';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body,
    icon: '/vite.svg', // أيقونة الإشعار
    dir: 'rtl'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});