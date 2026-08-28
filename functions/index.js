/* ============================================
   Cloud Functions - الأكاديمية الدولية
   1) إنشاء ملف Firestore تلقائياً عند التسجيل
   2) بوابة دفع Paymob (تنشئ الطلب + تتحقق من الـ Webhook بأمان)
      منقولة من server/server.js القديم، لكن الآن:
      - الوصول محمي بمصادقة Firebase (ID Token)
      - تأكيد الدفع مرتبط بـ uid حقيقي ويُكتب مباشرة في Firestore
      - HMAC غير الصحيح يُرفض فعلياً (لم يعد مجرد تحذير)
   ============================================ */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// أقسام مجانية افتراضية لأي مستخدم جديد (نفس افتراضي النسخة القديمة)
const DEFAULT_FREE_SECTIONS = [1, 2, 4, 8, 10];

// نسبة خصم نظام "ادعُ صديق" — لكل من المُحيل والمُحال إليه
const REFERRAL_DISCOUNT_PERCENT = 10;

// ========== 1) إنشاء مستند المستخدم تلقائياً عند التسجيل ==========
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const referralCode = 'IATC-' + user.uid.slice(0, 6).toUpperCase();
    await db.collection('users').doc(user.uid).set({
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        allowedSections: DEFAULT_FREE_SECTIONS,
        allowedSubSections: [],
        subscriptionType: 'free',
        paymentStatus: 'unpaid',
        blocked: false,
        role: 'student',
        referralCode: referralCode,
        rewardCredits: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
});

// ========== إعدادات Paymob (اضبطها بـ: firebase functions:config:set paymob.xxx="...") ==========
function paymobConfig() {
    const c = functions.config().paymob || {};
    return {
        apiKey: c.api_key || '',
        cardIntegrationId: c.card_integration_id || '',
        walletIntegrationId: c.wallet_integration_id || '',
        iframeId: c.iframe_id || '',
        hmacSecret: c.hmac_secret || '',
        paymobBase: 'https://accept.paymob.com/api'
    };
}

async function getAuthToken(cfg) {
    const res = await fetch(`${cfg.paymobBase}/auth/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: cfg.apiKey })
    });
    const data = await res.json();
    if (!data.token) throw new Error(data.message || 'فشل الحصول على Auth Token من Paymob');
    return data.token;
}

async function createOrder(cfg, authToken, amountCents, merchantOrderId, items) {
    const res = await fetch(`${cfg.paymobBase}/ecommerce/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: 'EGP',
            merchant_order_id: merchantOrderId,
            items: items || []
        })
    });
    const data = await res.json();
    if (!data.id) throw new Error(data.message || 'فشل إنشاء الطلب');
    return data;
}

async function getPaymentKey(cfg, authToken, orderId, amountCents, billingData, integrationId) {
    const res = await fetch(`${cfg.paymobBase}/acceptance/payment_keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: 'EGP',
            integration_id: Number(integrationId),
            lock_order_when_paid: true
        })
    });
    const data = await res.json();
    if (!data.token) throw new Error(data.message || 'فشل إنشاء Payment Key');
    return data.token;
}

function verifyHmac(cfg, obj, receivedHmac) {
    if (!cfg.hmacSecret || !receivedHmac) return false;
    const fields = [
        'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
        'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
        'is_standalone_payment', 'is_voided', 'order', 'owner', 'pending',
        'source_data_pan', 'source_data_sub_type', 'source_data_type', 'success'
    ];
    let concatenated = '';
    for (const key of fields) {
        let val = obj[key];
        if (key === 'order') {
            val = obj.order && (obj.order.id !== undefined ? obj.order.id : obj.order);
        } else if (key.startsWith('source_data_')) {
            const sub = key.replace('source_data_', '');
            val = obj.source_data ? obj.source_data[sub] : '';
        }
        if (val === true || val === false) val = val.toString();
        if (val === null || val === undefined) val = '';
        concatenated += String(val);
    }
    const calculated = crypto.createHmac('sha512', cfg.hmacSecret).update(concatenated).digest('hex');
    return calculated === receivedHmac;
}

// ========== 2) إنشاء عملية دفع — يتطلب تسجيل دخول (Authorization: Bearer <idToken>) ==========
exports.createPayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const idToken = (req.headers.authorization || '').replace('Bearer ', '');
            if (!idToken) return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول' });
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const cfg = paymobConfig();
            if (!cfg.apiKey || !cfg.cardIntegrationId || !cfg.iframeId) {
                return res.status(503).json({ success: false, error: 'بوابة الدفع غير مُعدّة بعد' });
            }

            const { courseId, title, price, method, customer, referralCode, useRewardCredit } = req.body;
            if (!courseId || !price || price <= 0) {
                return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
            }

            // نظام الإحالة: كوبون كود صديق (خصم لطرفين) أو استخدام رصيد خصم مكتسب سابقاً
            // الخصم يُحسب من السيرفر دائماً وليس من السعر القادم من العميل مباشرة.
            let finalPrice = Number(price);
            let referredByUid = null;
            let usingCredit = false;

            if (referralCode) {
                const refSnap = await db.collection('users').where('referralCode', '==', String(referralCode).toUpperCase()).limit(1).get();
                if (!refSnap.empty && refSnap.docs[0].id !== uid) {
                    referredByUid = refSnap.docs[0].id;
                    finalPrice = Math.round(finalPrice * (1 - REFERRAL_DISCOUNT_PERCENT / 100) * 100) / 100;
                }
            } else if (useRewardCredit) {
                const userDoc = await db.collection('users').doc(uid).get();
                const credits = (userDoc.exists && userDoc.data().rewardCredits) || 0;
                if (credits > 0) {
                    usingCredit = true;
                    finalPrice = Math.round(finalPrice * (1 - REFERRAL_DISCOUNT_PERCENT / 100) * 100) / 100;
                }
            }

            const amountCents = Math.round(finalPrice * 100);
            const merchantOrderId = `ACADEMY-${courseId}-${Date.now()}`;

            let integrationId = cfg.cardIntegrationId;
            if (['vodafone', 'orange', 'etisalat', 'wallet'].includes(method) && cfg.walletIntegrationId) {
                integrationId = cfg.walletIntegrationId;
            }

            const nameParts = (customer?.name || 'عميل الأكاديمية').trim().split(/\s+/);
            const billingData = {
                apartment: 'NA', email: customer?.email || decoded.email || 'customer@example.com',
                floor: 'NA', first_name: nameParts[0] || 'Customer', street: 'NA', building: 'NA',
                phone_number: customer?.phone || '01000000000', shipping_method: 'NA', postal_code: 'NA',
                city: 'Cairo', country: 'EG', last_name: nameParts.slice(1).join(' ') || 'User', state: 'NA'
            };

            const items = [{ name: title || courseId, amount_cents: amountCents, description: `كورس: ${title || courseId}`, quantity: 1 }];

            const authToken = await getAuthToken(cfg);
            const order = await createOrder(cfg, authToken, amountCents, merchantOrderId, items);
            const paymentToken = await getPaymentKey(cfg, authToken, order.id, amountCents, billingData, integrationId);

            // الطلب المعلّق مرتبط بـ uid حقيقي — هذا هو أساس الحماية الحقيقية
            await db.collection('pendingOrders').doc(merchantOrderId).set({
                merchantOrderId, paymobOrderId: order.id, uid, courseId,
                title: title || courseId, price: finalPrice, originalPrice: Number(price), amountCents,
                method: method || 'paymob', status: 'pending',
                referredBy: referredByUid, usedRewardCredit: usingCredit,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${cfg.iframeId}?payment_token=${paymentToken}`;
            res.json({ success: true, iframeUrl, merchantOrderId, amount: finalPrice, currency: 'EGP' });
        } catch (err) {
            console.error('[createPayment]', err.message);
            res.status(500).json({ success: false, error: err.message || 'حدث خطأ أثناء إنشاء عملية الدفع' });
        }
    });
});

// ========== 2ب) شراء محاضرة بدون تسجيل دخول (نفس تجربة الموقع الحالية) ==========
exports.createLecturePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const cfg = paymobConfig();
            if (!cfg.apiKey || !cfg.cardIntegrationId || !cfg.iframeId) {
                return res.status(503).json({ success: false, error: 'بوابة الدفع غير مُعدّة بعد' });
            }

            const { lectureId, title, price, method, customer } = req.body;
            if (!lectureId || !price || price <= 0) {
                return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
            }

            const amountCents = Math.round(Number(price) * 100);
            const merchantOrderId = `LEC-${lectureId}-${Date.now()}`;

            let integrationId = cfg.cardIntegrationId;
            if (['vodafone', 'orange', 'etisalat', 'wallet'].includes(method) && cfg.walletIntegrationId) {
                integrationId = cfg.walletIntegrationId;
            }

            const nameParts = (customer?.name || 'عميل الأكاديمية').trim().split(/\s+/);
            const billingData = {
                apartment: 'NA', email: customer?.email || 'customer@example.com',
                floor: 'NA', first_name: nameParts[0] || 'Customer', street: 'NA', building: 'NA',
                phone_number: customer?.phone || '01000000000', shipping_method: 'NA', postal_code: 'NA',
                city: 'Cairo', country: 'EG', last_name: nameParts.slice(1).join(' ') || 'User', state: 'NA'
            };

            const items = [{ name: title || lectureId, amount_cents: amountCents, description: `محاضرة: ${title || lectureId}`, quantity: 1 }];

            const authToken = await getAuthToken(cfg);
            const order = await createOrder(cfg, authToken, amountCents, merchantOrderId, items);
            const paymentToken = await getPaymentKey(cfg, authToken, order.id, amountCents, billingData, integrationId);

            await db.collection('pendingOrders').doc(merchantOrderId).set({
                merchantOrderId, paymobOrderId: order.id, lectureId,
                title: title || lectureId, price: Number(price), amountCents,
                method: method || 'paymob', status: 'pending', customer: customer || {},
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${cfg.iframeId}?payment_token=${paymentToken}`;
            res.json({ success: true, iframeUrl, merchantOrderId, amount: price, currency: 'EGP' });
        } catch (err) {
            console.error('[createLecturePayment]', err.message);
            res.status(500).json({ success: false, error: err.message || 'حدث خطأ أثناء إنشاء عملية الدفع' });
        }
    });
});

// ========== 2ج) الاستعلام عن حالة طلب (للعودة من صفحة الدفع) ==========
exports.getOrderStatus = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const merchantOrderId = req.query.id || (req.body && req.body.id);
            if (!merchantOrderId) return res.status(400).json({ success: false, error: 'معرّف الطلب مطلوب' });
            const doc = await db.collection('pendingOrders').doc(merchantOrderId).get();
            if (!doc.exists) return res.json({ success: false, error: 'الطلب غير موجود' });
            const order = doc.data();
            res.json({ success: true, status: order.status, order });
        } catch (err) {
            console.error('[getOrderStatus]', err);
            res.status(500).json({ success: false, error: 'حدث خطأ' });
        }
    });
});

// ========== 4) التحقق من كود المحاضرة + الاسم — بديل حقيقي للتحقق المحلي ==========
// العميل ما بيشوفش رابط الفيديو أبداً إلا من هنا، وبعد التأكد من عدم تجاوز
// حد المشاهدات المسموح — الحساب والتخزين يتمّان في السيرفر (Admin SDK) وليس
// في المتصفح، فلا يمكن التلاعب بعدد المشاهدات من Developer Tools.
exports.verifyLectureAccess = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { code, name, lectureId } = req.body;
            if (!code || !name) {
                return res.status(400).json({ success: false, error: 'يرجى إدخال الكود والاسم' });
            }

            // النظام القديم (lectures hub): الكود هو نفسه معرّف المستند.
            // نظام الأقسام الفرعية: lectureId معروف مسبقاً، والكود يُقارَن
            // مع حقل customCode (أو معرّف المحاضرة كبديل).
            const docId = lectureId || String(code).trim().toUpperCase();
            const lecRef = db.collection('lectures').doc(docId);
            const lecDoc = await lecRef.get();
            if (!lecDoc.exists) {
                return res.status(404).json({ success: false, error: 'كود المحاضرة غير صحيح' });
            }
            const lec = lecDoc.data();

            if (lectureId) {
                const expected = String(lec.customCode || lec.id || '').toUpperCase();
                if (String(code).trim().toUpperCase() !== expected) {
                    return res.status(403).json({ success: false, error: 'الكود غير صحيح' });
                }
            }

            if (!lec.active) {
                return res.status(403).json({ success: false, error: 'هذه المحاضرة غير نشطة حالياً' });
            }

            const nameKey = String(name).trim().replace(/\s+/g, '_').toLowerCase();
            const viewRef = lecRef.collection('viewLog').doc(nameKey);

            const result = await db.runTransaction(async (t) => {
                const viewDoc = await t.get(viewRef);
                const current = viewDoc.exists ? (viewDoc.data().count || 0) : 0;
                const maxViews = lec.maxViews || 0;
                if (maxViews > 0 && current >= maxViews) {
                    return { allowed: false };
                }
                t.set(viewRef, {
                    count: current + 1,
                    name: name,
                    lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                t.set(lecRef, {
                    viewCount: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
                return { allowed: true };
            });

            if (!result.allowed) {
                return res.status(403).json({ success: false, error: 'لقد استنفدت عدد المشاهدات المسموح بها لهذا الكود' });
            }

            const secureDoc = await lecRef.collection('secureContent').doc('video').get();
            const url = secureDoc.exists ? secureDoc.data().url : '';

            await db.collection('activityLogs').add({
                type: 'lecture_view', lectureId: lecDoc.id, viewerName: name,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({ success: true, title: lec.title, url });
        } catch (err) {
            console.error('[verifyLectureAccess]', err);
            res.status(500).json({ success: false, error: 'حدث خطأ، حاول مرة أخرى' });
        }
    });
});
// ========== 5) طلب موافقة أدمن على محاضرة (يتطلب تسجيل دخول) ==========
exports.requestLectureAccess = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const idToken = (req.headers.authorization || '').replace('Bearer ', '');
            if (!idToken) return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول' });
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const { lectureId } = req.body;
            if (!lectureId) return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });

            const lecDoc = await db.collection('lectures').doc(lectureId).get();
            if (!lecDoc.exists) return res.status(404).json({ success: false, error: 'المحاضرة غير موجودة' });

            const reqId = `${uid}_${lectureId}`;
            const reqRef = db.collection('accessRequests').doc(reqId);
            const existing = await reqRef.get();

            if (existing.exists && existing.data().status === 'approved') {
                return res.json({ success: true, status: 'approved' });
            }
            if (existing.exists && existing.data().status === 'pending') {
                return res.json({ success: true, status: 'pending' });
            }

            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            await reqRef.set({
                userId: uid, userName: userData.name || decoded.email || '',
                userEmail: userData.email || decoded.email || '',
                lectureId, lectureTitle: lecDoc.data().title || lectureId,
                status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({ success: true, status: 'pending' });
        } catch (err) {
            console.error('[requestLectureAccess]', err);
            res.status(500).json({ success: false, error: 'حدث خطأ، حاول مرة أخرى' });
        }
    });
});

// ========== 6) جلب رابط الفيديو بعد موافقة الأدمن (يتطلب تسجيل دخول) ==========
exports.getApprovedLectureUrl = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const idToken = (req.headers.authorization || '').replace('Bearer ', '');
            if (!idToken) return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول' });
            const decoded = await admin.auth().verifyIdToken(idToken);
            const uid = decoded.uid;

            const { lectureId } = req.body;
            if (!lectureId) return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });

            const reqDoc = await db.collection('accessRequests').doc(`${uid}_${lectureId}`).get();
            if (!reqDoc.exists || reqDoc.data().status !== 'approved') {
                return res.status(403).json({ success: false, error: 'لا يوجد لديك موافقة على هذه المحاضرة' });
            }

            const lecDoc = await db.collection('lectures').doc(lectureId).get();
            const secureDoc = await db.collection('lectures').doc(lectureId).collection('secureContent').doc('video').get();

            res.json({
                success: true,
                title: lecDoc.exists ? lecDoc.data().title : lectureId,
                url: secureDoc.exists ? secureDoc.data().url : ''
            });
        } catch (err) {
            console.error('[getApprovedLectureUrl]', err);
            res.status(500).json({ success: false, error: 'حدث خطأ، حاول مرة أخرى' });
        }
    });
});

exports.paymobWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const cfg = paymobConfig();
        const body = req.body;
        const hmac = req.query.hmac || req.body.hmac;
        const obj = body.obj || body;

        const valid = verifyHmac(cfg, obj, hmac);
        if (!valid) {
            console.warn('[paymobWebhook] HMAC غير صحيح — تم الرفض');
            return res.status(401).send('Invalid HMAC');
        }

        const success = obj.success === true || obj.success === 'true';
        const merchantOrderId = obj.order?.merchant_order_id || obj.merchant_order_id || null;
        if (!success || !merchantOrderId) return res.status(200).send('ignored');

        const orderRef = db.collection('pendingOrders').doc(merchantOrderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) return res.status(200).send('unknown order');

        const order = orderDoc.data();
        const batch = db.batch();

        if (order.courseId) {
            // مسار شراء كورس/قسم (يتطلب تسجيل دخول) — يفتح المحتوى فعلياً عبر purchases
            const purchaseId = `${order.uid}_${order.courseId}`;
            batch.set(db.collection('purchases').doc(purchaseId), {
                userId: order.uid, courseId: order.courseId, merchantOrderId,
                price: order.price, transactionId: obj.id,
                purchasedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            batch.set(db.collection('payments').doc(String(obj.id)), {
                userId: order.uid, courseId: order.courseId, merchantOrderId,
                amountCents: obj.amount_cents, currency: obj.currency,
                status: 'paid', createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // فتح القسم فعلياً في ملف المستخدم (لو الشراء لقسم من الـ13: courseId = "section-N")
            const sectionMatch = /^section-(\d+)$/.exec(order.courseId);
            if (sectionMatch) {
                const sectionNum = parseInt(sectionMatch[1], 10);
                batch.set(db.collection('users').doc(order.uid), {
                    allowedSections: admin.firestore.FieldValue.arrayUnion(sectionNum)
                }, { merge: true });
            }

            batch.set(db.collection('notifications').doc(), {
                userId: order.uid, message: `تم تفعيل اشتراكك في: ${order.title}`,
                read: false, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // نظام "ادعُ صديق": لو الدفع تم بكود إحالة → المُحيل ياخد رصيد خصم لمرة جاية
            if (order.referredBy) {
                batch.set(db.collection('users').doc(order.referredBy), {
                    rewardCredits: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
                batch.set(db.collection('notifications').doc(), {
                    userId: order.referredBy,
                    message: `صديقك اشترك عن طريق كود الدعوة بتاعك! خصم ${REFERRAL_DISCOUNT_PERCENT}% جاهز لاستخدامه في اشتراكك القادم`,
                    read: false, createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // لو استخدم رصيد خصم مكتسب سابقاً → يُخصم رصيد واحد بعد نجاح الدفع
            if (order.usedRewardCredit) {
                batch.set(db.collection('users').doc(order.uid), {
                    rewardCredits: admin.firestore.FieldValue.increment(-1)
                }, { merge: true });
            }
        } else if (order.lectureId) {
            // مسار شراء محاضرة بدون تسجيل دخول — الدفع فقط، الوصول يبقى بالكود+الاسم
            // (verifyLectureAccess) تمامًا كما في تصميم الموقع الأصلي
            batch.set(db.collection('payments').doc(String(obj.id)), {
                lectureId: order.lectureId, customer: order.customer || {}, merchantOrderId,
                amountCents: obj.amount_cents, currency: obj.currency,
                status: 'paid', createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        batch.update(orderRef, { status: 'paid', paidAt: admin.firestore.FieldValue.serverTimestamp() });

        await batch.commit();
        res.status(200).send('OK');
    } catch (err) {
        console.error('[paymobWebhook]', err);
        res.status(500).send('error');
    }
});
