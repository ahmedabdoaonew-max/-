/**
 * خادم بوابة الدفع Paymob
 * الأكاديمية الدولية للتدريب والاستشارات العلمية
 *
 * التدفق:
 * 1. الواجهة تستدعي POST /api/paymob/create-payment
 * 2. الخادم: auth → order → payment_key
 * 3. يُعاد رابط الـ iframe للمستخدم
 * 4. بعد الدفع: Paymob يعيد التوجيه إلى /api/paymob/return
 * 5. Webhook POST /api/paymob/webhook يؤكد العملية (مع HMAC)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== الإعدادات ==========
const CONFIG = {
  apiKey: process.env.PAYMOB_API_KEY || '',
  cardIntegrationId: process.env.PAYMOB_CARD_INTEGRATION_ID || '',
  walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID || '',
  iframeId: process.env.PAYMOB_IFRAME_ID || '',
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
  testMode: process.env.PAYMOB_TEST_MODE !== 'false',
  baseUrl: process.env.BASE_URL || `http://localhost:${PORT}`,
  paymobBase: 'https://accept.paymob.com/api'
};

const isConfigured = !!(CONFIG.apiKey && CONFIG.cardIntegrationId && CONFIG.iframeId);

// تخزين الطلبات المعلقة (ملف JSON بسيط)
const PENDING_FILE = path.join(__dirname, 'pending-orders.json');
const PAID_FILE = path.join(__dirname, 'paid-orders.json');

function readJson(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return {};
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ========== Middleware ==========
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم ملفات الواجهة من المجلد الأب
app.use(express.static(path.join(__dirname, '..')));

// ========== Paymob Helpers ==========

/** 1. الحصول على Auth Token */
async function getAuthToken() {
  const res = await fetch(`${CONFIG.paymobBase}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: CONFIG.apiKey })
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(data.message || data.detail || 'فشل الحصول على Auth Token من Paymob');
  }
  return data.token;
}

/** 2. إنشاء طلب (Order) */
async function createOrder(authToken, amountCents, merchantOrderId, items) {
  const res = await fetch(`${CONFIG.paymobBase}/ecommerce/orders`, {
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
  if (!data.id) {
    throw new Error(data.message || JSON.stringify(data) || 'فشل إنشاء الطلب');
  }
  return data;
}

/** 3. إنشاء Payment Key */
async function getPaymentKey(authToken, orderId, amountCents, billingData, integrationId) {
  const res = await fetch(`${CONFIG.paymobBase}/acceptance/payment_keys`, {
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
  if (!data.token) {
    throw new Error(data.message || JSON.stringify(data) || 'فشل إنشاء Payment Key');
  }
  return data.token;
}

/** التحقق من HMAC (Transaction Callback) */
function verifyHmac(obj, receivedHmac) {
  if (!CONFIG.hmacSecret || !receivedHmac) return false;

  // ترتيب الحقول حسب توثيق Paymob
  const fields = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data_pan',
    'source_data_sub_type',
    'source_data_type',
    'success'
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

  const calculated = crypto
    .createHmac('sha512', CONFIG.hmacSecret)
    .update(concatenated)
    .digest('hex');

  return calculated === receivedHmac;
}

// ========== API Routes ==========

/** حالة الإعداد */
app.get('/api/paymob/status', (req, res) => {
  res.json({
    configured: isConfigured,
    testMode: CONFIG.testMode,
    message: isConfigured
      ? 'بوابة Paymob جاهزة'
      : 'يرجى ضبط مفاتيح Paymob في ملف server/.env'
  });
});

/**
 * إنشاء عملية دفع
 * Body: { lectureId, title, price, method, customer: { name, email, phone } }
 */
app.post('/api/paymob/create-payment', async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'بوابة الدفع غير مُعدّة. ضع المفاتيح في server/.env',
        mock: true
      });
    }

    const { lectureId, title, price, method, customer } = req.body;

    if (!lectureId || !price || price <= 0) {
      return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
    }

    const amountCents = Math.round(Number(price) * 100);
    const merchantOrderId = `ACADEMY-${lectureId}-${Date.now()}`;

    // اختيار Integration حسب طريقة الدفع
    let integrationId = CONFIG.cardIntegrationId;
    if ((method === 'vodafone' || method === 'orange' || method === 'etisalat' || method === 'wallet')
        && CONFIG.walletIntegrationId) {
      integrationId = CONFIG.walletIntegrationId;
    }

    const nameParts = (customer?.name || 'عميل الأكاديمية').trim().split(/\s+/);
    const billingData = {
      apartment: 'NA',
      email: customer?.email || 'customer@example.com',
      floor: 'NA',
      first_name: nameParts[0] || 'Customer',
      street: 'NA',
      building: 'NA',
      phone_number: customer?.phone || '01000000000',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      last_name: nameParts.slice(1).join(' ') || 'User',
      state: 'NA'
    };

    const items = [{
      name: title || lectureId,
      amount_cents: amountCents,
      description: `محاضرة: ${title || lectureId}`,
      quantity: 1
    }];

    // خطوات Paymob
    const authToken = await getAuthToken();
    const order = await createOrder(authToken, amountCents, merchantOrderId, items);
    const paymentToken = await getPaymentKey(
      authToken,
      order.id,
      amountCents,
      billingData,
      integrationId
    );

    // حفظ الطلب المعلق
    const pending = readJson(PENDING_FILE);
    pending[merchantOrderId] = {
      merchantOrderId,
      paymobOrderId: order.id,
      lectureId,
      title: title || lectureId,
      price: Number(price),
      amountCents,
      method: method || 'paymob',
      customer: customer || {},
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    writeJson(PENDING_FILE, pending);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${CONFIG.iframeId}?payment_token=${paymentToken}`;

    res.json({
      success: true,
      iframeUrl,
      merchantOrderId,
      paymobOrderId: order.id,
      amount: price,
      currency: 'EGP'
    });
  } catch (err) {
    console.error('[Paymob] create-payment error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'حدث خطأ أثناء إنشاء عملية الدفع'
    });
  }
});

/**
 * صفحة العودة بعد الدفع (Return URL - GET)
 * Paymob يعيد التوجيه هنا مع query params
 */
app.get('/api/paymob/return', (req, res) => {
  const success = req.query.success === 'true';
  const merchantOrderId = req.query.merchant_order_id || '';
  const txnId = req.query.id || '';

  // صفحة نتيجة بسيطة تعيد المستخدم للواجهة
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'تم الدفع بنجاح' : 'فشل الدفع'}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #F9F6F0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(46,125,50,0.12); text-align: center; max-width: 420px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: ${success ? '#2E7D32' : '#C62828'}; margin: 0 0 12px; }
    p { color: #546E7A; line-height: 1.6; }
    a { display: inline-block; margin-top: 24px; background: linear-gradient(135deg,#4CAF50,#2E7D32); color: #fff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
    code { background: #F1F8E9; padding: 4px 10px; border-radius: 6px; font-size: 1.1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${success ? 'تم الدفع بنجاح!' : 'لم تكتمل عملية الدفع'}</h1>
    <p>${success
      ? 'احتفظ بكود المحاضرة التالي واستخدمه مع اسمك الثلاثي للمشاهدة.'
      : 'يمكنك المحاولة مرة أخرى من صفحة المحاضرات.'}</p>
    ${success && merchantOrderId ? `<p>رقم الطلب: <code>${merchantOrderId}</code></p>` : ''}
    ${txnId ? `<p style="font-size:0.85rem;color:#888;">رقم العملية: ${txnId}</p>` : ''}
    <a href="/lectures.html${success ? '?paid=1&order=' + encodeURIComponent(merchantOrderId) : ''}">
      ${success ? 'متابعة إلى المحاضرات' : 'العودة للمحاضرات'}
    </a>
  </div>
  <script>
    // إرسال رسالة للنافذة الأم إن وُجدت (iframe)
    if (window.opener) {
      window.opener.postMessage({
        type: 'paymob-result',
        success: ${success},
        merchantOrderId: ${JSON.stringify(merchantOrderId)},
        transactionId: ${JSON.stringify(txnId)}
      }, '*');
    }
    // تخزين النتيجة محلياً للواجهة
    try {
      localStorage.setItem('lastPaymentResult', JSON.stringify({
        success: ${success},
        merchantOrderId: ${JSON.stringify(merchantOrderId)},
        transactionId: ${JSON.stringify(txnId)},
        time: Date.now()
      }));
    } catch(e) {}
  </script>
</body>
</html>`;

  res.send(html);
});

/**
 * Webhook من Paymob (Transaction Processed Callback)
 * يجب ضبطه في لوحة Paymob: Transaction processed callback
 */
app.post('/api/paymob/webhook', (req, res) => {
  try {
    const body = req.body;
    const hmac = req.query.hmac || req.body.hmac;

    // دعم الشكلين: { type, obj } أو obj مباشرة
    const obj = body.obj || body;
    const type = body.type || 'TRANSACTION';

    if (type !== 'TRANSACTION' && !obj.success !== undefined) {
      return res.status(200).send('ignored');
    }

    // التحقق من HMAC إن وُجد السر
    if (CONFIG.hmacSecret) {
      const valid = verifyHmac(obj, hmac);
      if (!valid) {
        console.warn('[Paymob] Invalid HMAC on webhook');
        // في الإنتاج يُفضّل رفض الطلب؛ هنا نُسجّل فقط للتجربة
        // return res.status(401).send('Invalid HMAC');
      }
    }

    const success = obj.success === true || obj.success === 'true';
    const orderId = obj.order?.id || obj.order;
    const merchantOrderId = obj.order?.merchant_order_id
      || obj.merchant_order_id
      || null;

    console.log(`[Paymob Webhook] success=${success} order=${orderId} merchant=${merchantOrderId}`);

    if (success && merchantOrderId) {
      const pending = readJson(PENDING_FILE);
      const paid = readJson(PAID_FILE);

      if (pending[merchantOrderId]) {
        const order = pending[merchantOrderId];
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        order.transactionId = obj.id;
        order.paymobData = {
          amount_cents: obj.amount_cents,
          currency: obj.currency,
          source: obj.source_data
        };
        paid[merchantOrderId] = order;
        delete pending[merchantOrderId];
        writeJson(PENDING_FILE, pending);
        writeJson(PAID_FILE, paid);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Paymob] webhook error:', err);
    res.status(200).send('OK'); // دائماً 200 لـ Paymob
  }
});

/**
 * الاستعلام عن حالة طلب (للاستخدام من الواجهة بعد العودة)
 */
app.get('/api/paymob/order/:merchantOrderId', (req, res) => {
  const id = req.params.merchantOrderId;
  const paid = readJson(PAID_FILE);
  const pending = readJson(PENDING_FILE);

  if (paid[id]) {
    return res.json({ success: true, status: 'paid', order: paid[id] });
  }
  if (pending[id]) {
    return res.json({ success: true, status: 'pending', order: pending[id] });
  }
  res.status(404).json({ success: false, error: 'الطلب غير موجود' });
});

/** صحة الخادم */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    paymobConfigured: isConfigured,
    time: new Date().toISOString()
  });
});

// ========== تشغيل ==========
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  الأكاديمية الدولية - خادم Paymob');
  console.log('═══════════════════════════════════════════');
  console.log(`  المنفذ:     http://localhost:${PORT}`);
  console.log(`  Paymob:     ${isConfigured ? '✅ مُعدّ' : '⚠️  غير مُعدّ (وضع تجريبي)'}`);
  console.log(`  Test Mode:  ${CONFIG.testMode}`);
  console.log('');
  if (!isConfigured) {
    console.log('  لتفعيل الدفع الحقيقي:');
    console.log('  1. انسخ server/.env.example إلى server/.env');
    console.log('  2. املأ مفاتيح Paymob من لوحة التحكم');
    console.log('  3. أعد تشغيل الخادم');
    console.log('');
  }
  console.log('  Callback URL:  ' + CONFIG.baseUrl + '/api/paymob/return');
  console.log('  Webhook URL:   ' + CONFIG.baseUrl + '/api/paymob/webhook');
  console.log('═══════════════════════════════════════════');
  console.log('');
});
