/* ============================================
   إعدادات Firebase - عدّل القيم دي من:
   Firebase Console → Project settings → إنشاء تطبيق ويب (</>) 
   بعد إنشاء المشروع فعّل: Authentication (Email/Password) + Firestore Database
   ============================================ */
const firebaseConfig = {
    apiKey: "AIzaSyBjLyD4xWlNB_YBVeGAkTx8gJmGFvDSrS4",
    authDomain: "international-academy-d0e86.firebaseapp.com",
    projectId: "international-academy-d0e86",
    storageBucket: "international-academy-d0e86.firebasestorage.app",
    messagingSenderId: "265313485970",
    appId: "1:265313485970:web:b06c19e20d75824cd2924b"
};

// تهيئة Firebase (يستخدم SDK النسخة المتوافقة compat - بدون أدوات بناء)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// عنوان Cloud Functions (يُستخدم لطلبات الدفع)
// بعد نشر functions هيبقى شكله: https://us-central1-PROJECT_ID.cloudfunctions.net
const FUNCTIONS_BASE_URL = "https://us-central1-ضع_PROJECT_ID.cloudfunctions.net";
