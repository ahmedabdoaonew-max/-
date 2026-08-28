/* ============================================
   نظام الدفع - payments.js
   دعم بوابة Paymob الحقيقية + وضع المحاكاة
   ============================================ */

let selectedPaymentMethod = 'paymob';
let currentLectureId = null;
let paymobConfigured = true; // نحاول الدفع الحقيقي دائماً، ونرجع لوضع المحاكاة لو فشل الاتصال

document.addEventListener('DOMContentLoaded', () => {

    // معالجة العودة من الدفع (query params)
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
        const orderId = params.get('order');
        if (orderId) {
            handlePaymentReturn(orderId);
        }
        // تنظيف الـ URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    // استقبال رسالة من نافذة الدفع المنبثقة
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'paymob-result') {
            if (event.data.success && event.data.merchantOrderId) {
                handlePaymentReturn(event.data.merchantOrderId);
            } else {
                showToast('لم تكتمل عملية الدفع', 'error');
            }
        }
    });
});

// ========== فتح نافذة الدفع ==========
async function openPaymentModal(lectureId) {
    const lectures = await getLecturesAsync();
    const lecture = lectures[lectureId];
    if (!lecture) {
        showToast('المحاضرة غير موجودة', 'error');
        return;
    }

    currentLectureId = lectureId;
    const user = getCurrentUser();

    let overlay = document.getElementById('paymentModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'paymentModal';
        overlay.className = 'modal-overlay payment-modal';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePaymentModal();
        });
    }

    const gatewayBadge = paymobConfigured
        ? '<span class="badge badge-success" style="margin-bottom:12px;display:inline-block;">بوابة Paymob مفعّلة</span>'
        : '<span class="badge badge-warning" style="margin-bottom:12px;display:inline-block;">وضع تجريبي (محاكاة)</span>';

    // طرق الدفع من الأدمن (المفعّلة فقط)
    let methods = [];
    try {
        methods = (typeof getPaymentMethods === 'function' ? getPaymentMethods() : [])
            .filter(function (m) { return m.active; })
            .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    } catch (e) { methods = []; }

    if (!methods.length) {
        methods = [
            { id: 'paymob', name: 'بطاقة ائتمان / Paymob', type: 'paymob', icon: 'fa-credit-card', instructions: '', accountInfo: '' }
        ];
    }

    selectedPaymentMethod = methods[0].id;
    const optionsHtml = methods.map(function (m, i) {
        const extra = [];
        if (m.accountInfo) extra.push(m.accountInfo);
        if (m.instructions) extra.push(m.instructions);
        const sub = extra.join(' — ') || (m.type === 'paymob' ? 'فيزا / ماستركارد' : 'طريقة دفع');
        return '<label class="payment-option' + (i === 0 ? ' selected' : '') + '" onclick="selectPayment(this, \'' + m.id + '\')">' +
            '<input type="radio" name="payMethod" value="' + m.id + '"' + (i === 0 ? ' checked' : '') + '>' +
            '<div><strong><i class="fas ' + (m.icon || 'fa-wallet') + '"></i> ' + m.name + '</strong>' +
            '<p style="font-size:0.85rem;color:#666;margin:0;">' + sub + '</p></div></label>';
    }).join('');

    const first = methods[0];
    const stepsHint = first.type === 'paymob'
        ? 'أكمل الدفع في صفحة Paymob الآمنة'
        : 'اتبع تعليمات التحويل ثم أكّد الدفع';

    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>شراء المحاضرة</h3>
                <button class="modal-close" onclick="closePaymentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align:center;margin-bottom:20px;">
                    ${gatewayBadge}
                    <h4 style="color:var(--primary-dark);font-size:1.2rem;">${lecture.title}</h4>
                    <div style="font-size:2rem;font-weight:700;color:var(--primary-blue);margin:10px 0;">
                        ${lecture.price} ج.م
                    </div>
                    <p style="color:#666;font-size:0.9rem;">عدد المشاهدات: ${lecture.maxViews === 0 ? 'غير محدود' : lecture.maxViews}</p>
                </div>

                <div class="form-group">
                    <label>الاسم الكامل (للإيصال والكود)</label>
                    <input type="text" id="payCustomerName" value="${user ? user.name : ''}" placeholder="الاسم الثلاثي" required>
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="payCustomerEmail" value="${user ? user.email : ''}" placeholder="email@example.com">
                </div>
                <div class="form-group">
                    <label>رقم الهاتف</label>
                    <input type="tel" id="payCustomerPhone" value="${user ? (user.phone || '') : ''}" placeholder="01xxxxxxxxx">
                </div>

                <h4 style="margin-bottom:12px;">اختر طريقة الدفع:</h4>
                <div class="payment-options">
                    ${optionsHtml}
                </div>

                <div class="payment-steps">
                    <strong>خطوات الدفع:</strong>
                    <ol>
                        <li>أدخل بياناتك واختر طريقة الدفع</li>
                        <li>اضغط «شراء الآن»</li>
                        <li>${stepsHint}</li>
                        <li>بعد النجاح ستحصل على كود المحاضرة</li>
                    </ol>
                </div>

                <button class="form-submit" onclick="processPayment()" id="buyBtn">
                    شراء الآن
                </button>
            </div>
        </div>
    `;

    overlay.classList.add('active');
}

function selectPayment(el, method) {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedPaymentMethod = method;
}

function closePaymentModal() {
    const overlay = document.getElementById('paymentModal');
    if (overlay) overlay.classList.remove('active');
}

// ========== معالجة الدفع ==========
async function processPayment() {
    const lectures = await getLecturesAsync();
    const lecture = lectures[currentLectureId];
    if (!lecture) return;

    const name = (document.getElementById('payCustomerName')?.value || '').trim();
    const email = (document.getElementById('payCustomerEmail')?.value || '').trim();
    const phone = (document.getElementById('payCustomerPhone')?.value || '').trim();

    if (!name) {
        showToast('يرجى إدخال الاسم الكامل', 'error');
        return;
    }

    const btn = document.getElementById('buyBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> جاري التحضير...';

    // معرفة نوع الطريقة المختارة من إعدادات الأدمن
    let methodMeta = null;
    try {
        methodMeta = (typeof getPaymentMethods === 'function' ? getPaymentMethods() : [])
            .find(function (m) { return m.id === selectedPaymentMethod; });
    } catch (e) {}
    const methodType = methodMeta ? methodMeta.type : selectedPaymentMethod;

    // Paymob فقط يذهب للبوابة الحقيقية — الباقي محاكاة/تحويل يدوي
    if (methodType === 'paymob' && paymobConfigured) {
        try {
            await processRealPayment(lecture, { name, email, phone });
            return;
        } catch (e) {
            // فشل الاتصال ببوابة الدفع الحقيقية (غير مُعدّة بعد) → رجوع لوضع المحاكاة
            console.warn('Paymob unavailable, falling back to mock mode', e);
        }
    }

    // محافظ / بنك / يدوي أو Paymob غير مُعدّ → محاكاة + عرض بيانات الحساب
    await processMockPayment(lecture, { name, email, phone }, methodMeta);
}

/** الدفع الحقيقي عبر Paymob (عبر Cloud Function) */
async function processRealPayment(lecture, customer) {
    const btn = document.getElementById('buyBtn');
    const res = await fetch(FUNCTIONS_BASE_URL + '/createLecturePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lectureId: lecture.id,
            title: lecture.title,
            price: lecture.price,
            method: selectedPaymentMethod,
            customer
        })
    });

    const data = await res.json();

    if (!data.success || !data.iframeUrl) {
        throw new Error(data.error || 'فشل إنشاء عملية الدفع');
    }

    // حفظ الطلب مؤقتاً في المتصفح
    sessionStorage.setItem('pendingPayment', JSON.stringify({
        merchantOrderId: data.merchantOrderId,
        lectureId: lecture.id,
        title: lecture.title,
        price: lecture.price,
        customer
    }));

    // فتح صفحة الدفع في نفس النافذة أو نافذة جديدة
    // نستخدم نفس النافذة لضمان عودة callback بشكل صحيح
    showToast('جاري التحويل لصفحة الدفع الآمنة...');
    setTimeout(() => {
        window.location.href = data.iframeUrl;
    }, 600);
}

/** المحاكاة (عند غياب المفاتيح أو الخادم) */
async function processMockPayment(lecture, customer, methodMeta) {
    const btn = document.getElementById('buyBtn');
    const isManual = methodMeta && methodMeta.type && methodMeta.type !== 'paymob';

    if (isManual && methodMeta.accountInfo) {
        // عرض بيانات التحويل أولاً ثم تأكيد
        const modalBody = document.querySelector('#paymentModal .modal-body');
        modalBody.innerHTML = `
            <div style="text-align:center;">
                <i class="fas fa-wallet" style="font-size:48px;color:var(--primary-blue);margin-bottom:12px;"></i>
                <h3 style="color:var(--primary-dark);">${methodMeta.name}</h3>
                <p style="color:#666;margin:8px 0;">حوّل مبلغ <strong>${lecture.price} ج.م</strong> إلى:</p>
                <div style="background:var(--beige-soft);padding:16px;border-radius:12px;margin:16px 0;font-size:1.2rem;font-weight:700;letter-spacing:1px;">
                    ${methodMeta.accountInfo}
                </div>
                ${methodMeta.instructions ? '<p style="color:#555;font-size:0.95rem;">' + methodMeta.instructions + '</p>' : ''}
                <p style="color:#888;font-size:0.85rem;margin-top:12px;">بعد التحويل اضغط تأكيد للحصول على كود المحاضرة (في الوضع الحقيقي سيراجع الأدمن الإيصال).</p>
                <button class="form-submit" id="confirmManualPay" style="margin-top:16px;">أكدت التحويل — أظهر الكود</button>
                <button type="button" class="btn-outline" onclick="closePaymentModal()" style="margin-top:10px;width:100%;padding:12px;border-radius:30px;cursor:pointer;">إلغاء</button>
            </div>`;
        document.getElementById('confirmManualPay').onclick = function () {
            const accessCode = lecture.id;
            logPayment(lecture.id, lecture.price, selectedPaymentMethod, customer);
            modalBody.innerHTML = buildSuccessHTML(accessCode, lecture, true);
            showToast('تم تسجيل الدفع — احتفظ بالكود', 'success');
        };
        return;
    }

    btn.innerHTML = '<span class="loader"></span> جاري معالجة الدفع (تجريبي)...';

    setTimeout(() => {
        const success = Math.random() > 0.05;
        if (!success) {
            btn.disabled = false;
            btn.textContent = 'شراء الآن';
            showToast('فشلت عملية الدفع. حاول مرة أخرى', 'error');
            return;
        }

        const accessCode = lecture.id;
        logPayment(lecture.id, lecture.price, selectedPaymentMethod, customer);

        const modalBody = document.querySelector('#paymentModal .modal-body');
        modalBody.innerHTML = buildSuccessHTML(accessCode, lecture, true);
        showToast('تم الدفع بنجاح (وضع تجريبي)!', 'success');
    }, 1800);
}

/** معالجة العودة من Paymob بعد الدفع */
async function handlePaymentReturn(merchantOrderId) {
    try {
        const res = await fetch(FUNCTIONS_BASE_URL + '/getOrderStatus?id=' + encodeURIComponent(merchantOrderId));
        const data = await res.json();

        if (data.success && data.status === 'paid' && data.order) {
            const order = data.order;
            const accessCode = order.lectureId;

            logPayment(order.lectureId, order.price, order.method || 'paymob', order.customer);

            // عرض نافذة النجاح
            showPaymentSuccessModal(accessCode, order);
            showToast('تم تأكيد الدفع بنجاح!', 'success');
            return;
        }

        // قد يكون الـ webhook لم يصل بعد — نعرض الكود من الجلسة إن وُجد
        const pending = sessionStorage.getItem('pendingPayment');
        if (pending) {
            const p = JSON.parse(pending);
            showPaymentSuccessModal(p.lectureId, p);
            sessionStorage.removeItem('pendingPayment');
            showToast('تم الدفع. جاري تأكيد العملية...', 'success');
        }
    } catch (e) {
        const pending = sessionStorage.getItem('pendingPayment');
        if (pending) {
            const p = JSON.parse(pending);
            showPaymentSuccessModal(p.lectureId, p);
            sessionStorage.removeItem('pendingPayment');
        }
    }
}

function showPaymentSuccessModal(accessCode, order) {
    let overlay = document.getElementById('paymentModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'paymentModal';
        overlay.className = 'modal-overlay payment-modal';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>نتيجة الدفع</h3>
                <button class="modal-close" onclick="closePaymentModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${buildSuccessHTML(accessCode, order, false)}
            </div>
        </div>
    `;
    overlay.classList.add('active');
}

function buildSuccessHTML(accessCode, order, isMock) {
    return `
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:60px;color:var(--primary-blue);margin-bottom:16px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="color:var(--primary-dark);margin-bottom:10px;">تم الدفع بنجاح!</h3>
            ${isMock ? '<p style="color:#EF6C00;font-size:0.9rem;">(وضع تجريبي - لم يتم خصم مبلغ حقيقي)</p>' : ''}
            <p style="color:#666;margin-bottom:20px;">احتفظ بالكود التالي لمشاهدة المحاضرة</p>
            
            <div style="background:var(--beige-soft);padding:20px;border-radius:12px;margin-bottom:20px;">
                <p style="font-size:0.9rem;color:#666;margin-bottom:8px;">كود المحاضرة:</p>
                <div style="font-size:1.8rem;font-weight:700;color:var(--primary-dark);letter-spacing:2px;" id="generatedCode">
                    ${accessCode}
                </div>
                <button onclick="copyCode('${accessCode}')" style="margin-top:12px;background:none;border:1px solid var(--primary-blue);color:var(--primary-dark);padding:6px 16px;border-radius:20px;cursor:pointer;">
                    <i class="fas fa-copy"></i> نسخ الكود
                </button>
            </div>

            <div class="payment-steps" style="text-align:right;">
                <strong>كيفية الاستخدام:</strong>
                <ol>
                    <li>انسخ الكود أعلاه</li>
                    <li>في قسم «الدخول إلى المحاضرة» أدخل الكود مع اسمك الثلاثي</li>
                    <li>استمتع بالمحاضرة</li>
                </ol>
            </div>

            <button class="form-submit" onclick="closePaymentModal(); if(document.getElementById('accessCode')) document.getElementById('accessCode').value='${accessCode}';">
                حسناً، فهمت
            </button>
        </div>
    `;
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('تم نسخ الكود!');
    }).catch(() => {
        showToast('لم يتم النسخ، انسخه يدوياً', 'warning');
    });
}

function logPayment(lectureId, amount, method, customer) {
    const payments = JSON.parse(localStorage.getItem('academyPayments') || '{}');
    const payId = 'PAY_' + Date.now();
    const user = getCurrentUser();

    payments[payId] = {
        id: payId,
        lectureId: lectureId,
        amount: amount,
        method: method,
        userId: user ? user.id : 'guest',
        userName: (customer && customer.name) || (user ? user.name : 'زائر'),
        status: 'success',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now()
    };
    localStorage.setItem('academyPayments', JSON.stringify(payments));
}
