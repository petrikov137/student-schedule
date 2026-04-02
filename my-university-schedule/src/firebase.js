import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging"; // 🌟 إضافة خدمة الإشعارات

const firebaseConfig = {
  apiKey: "AIzaSyA9Gnzgm7U5EkYK1P9LY7N-kHa0EsZLz-g",
  authDomain: "uni-schedule-99109.firebaseapp.com",
  databaseURL: "https://uni-schedule-99109-default-rtdb.firebaseio.com",
  projectId: "uni-schedule-99109",
  storageBucket: "uni-schedule-99109.firebasestorage.app",
  messagingSenderId: "105399583397",
  appId: "1:105399583397:web:ec566e801ef45d3ae3434c"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app); // 🌟 تصدير خدمة الإشعارات