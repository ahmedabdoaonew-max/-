/* ============================================
   إعدادات Firebase - عدّل القيم دي من:
   Firebase Console → Project settings → إنشاء تطبيق ويب (</>) 
   بعد إنشاء المشروع فعّل: Authentication (Email/Password) + Firestore Database
   ============================================ */
const firebaseConfig = {
    apiKey: "AIzaSyBCJUNaUO5LTjCu0koWu-RDGJh0uORJ2iE",
    authDomain: "courses-68a1e.firebaseapp.com",
    projectId: "courses-68a1e",
    storageBucket: "courses-68a1e.firebasestorage.app",
    messagingSenderId: "424796584661",
    appId: "1:424796584661:web:1cceded7709c1643c0405c"
};

// تهيئة Firebase (يستخدم SDK النسخة المتوافقة compat - بدون أدوات بناء)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// عنوان Cloud Functions (يُستخدم لطلبات الدفع)
// بعد نشر functions هيبقى شكله: https://us-central1-PROJECT_ID.cloudfunctions.net
const FUNCTIONS_BASE_URL = "https://us-central1-ضع_PROJECT_ID.cloudfunctions.net";
