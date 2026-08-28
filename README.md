# الأكاديمية الدولية للتدريب والاستشارات العلمية

منصة ويب عربية (RTL) — HTML + CSS + JS + **Firebase (Auth + Firestore + Cloud Functions)**.

> **تحديث مهم:** المشروع كان يعتمد بالكامل على localStorage (بيانات مستخدمين وهمية، كلمات مرور نص واضح).
> تم استبدال طبقة المصادقة والصلاحيات بـ Firebase Authentication + Firestore حقيقيين.
> راجع `PHASE2_REPORT.md` لتفاصيل كل ما تغيّر وما زال متبقياً.

---

## 1) إعداد مشروع Firebase (مرة واحدة)

1. أنشئ مشروعاً جديداً في [Firebase Console](https://console.firebase.google.com)
2. فعّل: **Authentication → Email/Password**
3. فعّل: **Firestore Database** (ابدأ في وضع Production)
4. من Project settings → أضف تطبيق ويب (</>) وانسخ القيم إلى `js/firebase-config.js`
5. ثبّت أدوات Firebase محلياً وسجّل الدخول:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add   # اختر مشروعك
   ```
6. اضبط مفاتيح Paymob (بدل ملف .env القديم):
   ```bash
   firebase functions:config:set paymob.api_key="..." paymob.card_integration_id="..." paymob.iframe_id="..." paymob.hmac_secret="..."
   ```
7. انشر كل شيء:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only firestore:rules,functions,hosting
   ```
8. في لوحة Paymob اضبط:
   - Transaction processed callback → `https://REGION-PROJECT_ID.cloudfunctions.net/paymobWebhook`
9. **أول سوبر أدمن:** سجّل حساباً عادياً من `register.html`، ثم من Firestore Console افتح
   `users/{uid}` وغيّر الحقل `role` يدوياً إلى `super_admin`.

---

## 2) الرفع على GitHub + Firebase Hosting (تلقائي)

```bash
git init
git add .
git commit -m "الأكاديمية الدولية - نسخة Firebase"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

لنشر تلقائي عند كل push، من Firebase Console: **Hosting → ربط بمستودع GitHub** (يولّد GitHub Action جاهز).
بديل: Netlify يعمل أيضاً للـ Hosting الثابت فقط (بدون Functions/Auth — تلك تبقى على Firebase).

---

## التشغيل المحلي (Emulators)

```bash
firebase emulators:start --only auth,firestore,functions,hosting
```

---

## التحديثات (تراكمية)

- أقسام **3 في الصف** + ظهور سحري
- القسم → صفحة فرعيات | الفرعي → صفحة محتوى جاهزة
- إصلاح تشغيل الفيديو (YouTube + MP4)
- إدخال **ID المحاضرة يدوياً** من الأدمن
- أزرار متجاوبة (موبايل / تابلت / كمبيوتر)
- معرض صور متحرك + فيديو بصورة مصغرة + 5 أسئلة شائعة
- **مصادقة حقيقية عبر Firebase Auth بدل localStorage** (راجع PHASE2_REPORT.md)
- **هوية بصرية جديدة**: أبيض + أزرق داكن (#1B4B8C) + ذهبي (#C9A227)
- **بوابة الدفع منقولة إلى Cloud Functions** مع تحقق HMAC صارم وربط الشراء بمستخدم حقيقي
