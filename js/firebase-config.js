/* ============================================
   إعدادات Firebase - عدّل القيم دي من:
   Firebase Console → Project settings → إنشاء تطبيق ويب (</>) 
   بعد إنشاء المشروع فعّل: Authentication (Email/Password) + Firestore Database
   ============================================ */
const firebaseConfig = {
    apiKey: "ضع_API_KEY_هنا",
    authDomain: "ضع_PROJECT_ID.firebaseapp.com",
    projectId: "ضع_PROJECT_ID",
    storageBucket: "ضع_PROJECT_ID.appspot.com",
    messagingSenderId: "ضع_SENDER_ID",
    appId: "ضع_APP_ID"
};

// تهيئة Firebase (يستخدم SDK النسخة المتوافقة compat - بدون أدوات بناء)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// عنوان Cloud Functions (يُستخدم لطلبات الدفع)
// بعد نشر functions هيبقى شكله: https://us-central1-PROJECT_ID.cloudfunctions.net
const FUNCTIONS_BASE_URL = "https://us-central1-ضع_PROJECT_ID.cloudfunctions.net";
