/* ============================================
   الأكاديمية الدولية - التطبيق الرئيسي
   app.js - البيانات الأساسية والوظائف المشتركة
   ============================================ */

// ========== تسجيل Service Worker لتفعيل تثبيت التطبيق (PWA) عبر جوجل كروم ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function (err) {
            console.warn('[PWA] تعذّر تسجيل Service Worker:', err);
        });
    });
}


// ========== تنبيهات عامة (تُستخدم في كل الصفحات) ==========
function showToast(message, type) {
    let el = document.getElementById('globalToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'globalToast';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = message || '';
    el.className = 'toast' + (type ? ' ' + type : '');
    void el.offsetWidth; // إعادة تشغيل الانتقال (transition) عند تكرار نفس الرسالة
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ========== شاشة الترحيب (Splash): تختفي تلقائياً بعد 3 ثوانٍ بالضبط ==========
function hideSplash() {
    var splash = document.getElementById('splash');
    if (splash) splash.classList.add('hidden');
}

(function () {
    var splashTimer = setTimeout(hideSplash, 3000);
    // أمان إضافي: إن تعطّل أي كود لاحق، تأكد أن الشاشة تختفي بعد التحميل الكامل بحد أقصى 3 ثوانٍ
    window.addEventListener('load', function () {
        setTimeout(hideSplash, 3000);
    });
})();

// ========== إعدادات الموقع (تُخزَّن وتُقرأ من Firestore حتى تظهر فوراً لكل زوار الموقع، مش بس جهاز الأدمن) ==========
let __siteSettingsCache = {};
try {
    __siteSettingsCache = JSON.parse(localStorage.getItem('academySettingsCache') || '{}');
} catch (e) {
    __siteSettingsCache = {};
}

// إرجاع نسخة من الإعدادات الحالية (متاحة فوراً من الكاش المحلي بدون انتظار الشبكة)
function getSettings() {
    return __siteSettingsCache || {};
}

// ========== المستخدم الحالي من الكاش المحلي (auth.js يحدّثه عند تغيّر حالة الدخول) ==========
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
        return null;
    }
}

// حفظ الإعدادات في Firestore حتى تنتشر فوراً لكل من يتصفح الموقع الآن
function saveSettings(newSettings) {
    __siteSettingsCache = Object.assign({}, __siteSettingsCache, newSettings);
    try { localStorage.setItem('academySettingsCache', JSON.stringify(__siteSettingsCache)); } catch (e) {}
    if (typeof db !== 'undefined' && db) {
        db.collection('settings').doc('general').set(__siteSettingsCache, { merge: true }).catch(function (err) {
            console.error('تعذر حفظ إعدادات الموقع:', err);
        });
    }
}

// مزامنة لحظية: أي تعديل يحفظه الأدمن (لوجو / شاشة ترحيب / صورة الموقع / أيقونة البرنامج...) يظهر فوراً لكل زائر بدون إعادة تحميل الصفحة
function initSiteSettingsSync() {
    if (typeof db === 'undefined' || !db) return;
    db.collection('settings').doc('general').onSnapshot(function (doc) {
        if (!doc.exists) return;
        __siteSettingsCache = Object.assign({}, __siteSettingsCache, doc.data());
        try { localStorage.setItem('academySettingsCache', JSON.stringify(__siteSettingsCache)); } catch (e) {}
        if (typeof applyBrandingImages === 'function') applyBrandingImages();
        // لو الأدمن فاتح تبويب الإعدادات في نفس اللحظة، حدّث الحقول المعروضة
        if (typeof loadAdminSettings === 'function' && document.getElementById('settingCvUrl')) {
            loadAdminSettings();
        }
    }, function (err) {
        console.warn('تعذرت مزامنة إعدادات الموقع:', err);
    });
}

// ========== رابط السيرة الذاتية (قابل للتعديل من الأدمن) ==========
let cvUrl = "https://example.com/international-academy-cv.pdf";

/* ============================================================
   🖼️ صور الهوية البصرية — عدّل الروابط هنا بسهولة
   ضع رابط صورة أو مسار محلي مثل: images/logo.png
   اتركه فارغاً '' لاستخدام الأيقونة الافتراضية
   ============================================================ */
const SITE_BRANDING = {
    // صورة دائرية في شاشة الترحيب (Splash)
    splashImage: 'https://i.postimg.cc/HkDbnFpd/WA-1784067108744.jpg?w=400&h=400&fit=crop',

    // لوجو الهيدر بجانب الاسم / تسجيل الدخول
    logoImage: 'https://i.postimg.cc/HkDbnFpd/WA-1784067108744.jpg?w=200&h=200&fit=crop',

    // صورة لكل قسم رئيسي (1 إلى 13)
    sectionImages: {
        1:  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
        2:  'https://images.unsplash.com/photo-1544367563-12126dbcbb4a?w=600&h=400&fit=crop',
        3:  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop',
        4:  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=400&fit=crop',
        5:  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
        6:  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop',
        7:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
        8:  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop',
        9:  'https://images.unsplash.com/photo-1474418397713-7ede21c59118?w=600&h=400&fit=crop',
        10: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
        11: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
        12: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
        13: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
        14: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop'
    }
};

function applyBrandingImages() {
    var settings = {};
    try { settings = getSettings() || {}; } catch (e) {}
    var splashUrl = settings.splashImage || SITE_BRANDING.splashImage || '';
    var logoUrl = settings.logoImage || SITE_BRANDING.logoImage || '';
    var siteImageUrl = settings.siteImage || '';
    var appIconUrl = settings.appIcon || '';

    var splashLogo = document.querySelector('.splash-logo');
    if (splashLogo && splashUrl) {
        var img = document.createElement('img');
        img.alt = 'شعار';
        img.className = 'splash-circle-img';
        img.onerror = function () {
            splashLogo.innerHTML = '<i class="fas fa-graduation-cap"></i>';
        };
        splashLogo.innerHTML = '';
        splashLogo.appendChild(img);
        img.src = splashUrl;
        // ملحوظة: شاشة الترحيب تختفي بمؤقّت مستقل مدته 3 ثوانٍ بالضبط (بالأعلى)، وليس بمجرد تحميل الصورة
    }

    document.querySelectorAll('.logo-icon').forEach(function (el) {
        if (!logoUrl) return;
        var logoImg = document.createElement('img');
        logoImg.src = logoUrl;
        logoImg.alt = 'Logo';
        logoImg.className = 'header-logo-img';
        logoImg.onerror = function () {
            el.innerHTML = '<i class="fas fa-graduation-cap"></i>';
        };
        el.innerHTML = '';
        el.appendChild(logoImg);
        el.classList.add('has-image');
    });

    if (logoUrl) {
        document.querySelectorAll('#authButtons, #userMenu').forEach(function (box) {
            if (!box || box.querySelector('.header-side-logo')) return;
            var side = document.createElement('img');
            side.src = logoUrl;
            side.alt = 'Logo';
            side.className = 'header-side-logo';
            box.insertBefore(side, box.firstChild);
        });
    }

    // صورة الموقع: تُستخدم كأيقونة تبويب المتصفح (favicon) وكصورة معاينة عند مشاركة الرابط
    if (siteImageUrl) {
        document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(function (el) { el.href = siteImageUrl; });
        var favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = siteImageUrl;
            document.head.appendChild(favicon);
        }
        var ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', siteImageUrl);
    }

    // أيقونة البرنامج: تظهر عند إضافة الموقع كتطبيق على الشاشة الرئيسية بالجوال (خصوصاً آيفون)
    if (appIconUrl) {
        var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            document.head.appendChild(appleIcon);
        }
        appleIcon.href = appIconUrl;
    }
}

function getSectionImage(sectionId) {
    const settings = (typeof getSettings === 'function') ? getSettings() : {};
    const map = settings.sectionImages || SITE_BRANDING.sectionImages || {};
    return map[sectionId] || map[String(sectionId)] || '';
}

// ========== تفعيلات عامة تعمل في كل صفحات الموقع ==========
document.addEventListener('DOMContentLoaded', function () {
    // تطبيق صور الهوية البصرية (اللوجو / شاشة الترحيب / صورة الموقع / أيقونة البرنامج) فور فتح أي صفحة
    if (typeof applyBrandingImages === 'function') applyBrandingImages();

    // تفعيل المزامنة اللحظية: أي حفظ من الأدمن يظهر فوراً للجميع
    if (typeof initSiteSettingsSync === 'function') initSiteSettingsSync();

    // ===== القائمة الجانبية (زر القائمة على الجوال) =====
    var menuBtn = document.getElementById('mobileMenuBtn');
    var navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navLinks.classList.toggle('open');
        });
        // اقفل القائمة تلقائياً عند الضغط على أي رابط بداخلها
        navLinks.querySelectorAll('a, button').forEach(function (el) {
            el.addEventListener('click', function () { navLinks.classList.remove('open'); });
        });
        // اقفل القائمة عند الضغط في أي مكان خارجها
        document.addEventListener('click', function (e) {
            if (navLinks.classList.contains('open') &&
                !navLinks.contains(e.target) &&
                e.target !== menuBtn && !menuBtn.contains(e.target)) {
                navLinks.classList.remove('open');
            }
        });
    }
});


// ========== بيانات الأقسام (الأقسام القديمة الـ13 محذوفة) ==========
const sectionsData = [
    // ملاحظة: الأقسام الـ13 القديمة تم حذفها بالكامل — يمكن إضافة أقسام جديدة هنا لاحقاً
    {
        id: 14,
        title: "باقة المحاضرات الأونلاين",
        desc: "ثلاث مسارات محاضرات — كل مسار يضم 10 محاضرات بالشراء أو كود أو موافقة الإدارة",
        icon: "fa-video",
        free: true,
        isLecturesPackage: true,
        subs: [
            { id: "14-1", title: "مسار الإدارة والقيادة", desc: "10 محاضرات متخصصة في الإدارة والقيادة" },
            { id: "14-2", title: "مسار تطوير المهارات المهنية", desc: "10 محاضرات في بناء المهارات والأهداف" },
            { id: "14-3", title: "مسار الاستشارات العلمية", desc: "10 محاضرات في الاستشارات والتواصل المهني" }
        ]
    }
];
