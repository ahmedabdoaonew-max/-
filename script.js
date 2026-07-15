// =============================================================
// ====== البيانات (روابط الصور والفيديوهات والأطباء والطلاب) ======
// =============================================================

// ---------- البرامج التدريبية (6 برامج) ----------
const programsData = [
    {
        id: 1,
        title: 'تأهيل اخصائي اكلينكي',
        desc: 'برنامج متكامل لتأهيل الاخصائيين الاكلينيكيين.',
        img1: 'https://i.postimg.cc/g0P9McmM/IMG-20260714-WA0081.jpg.jpg',
        img2: 'https://i.postimg.cc/TYyZf5PQ/IMG-20260714-WA0100.jpg.jpg',
        video: 'https://videotourl.com/videos/1784071587748-bbeb28f8-4aa5-4b6a-a0c1-1e2c090c2a4b.mp4'
    },
    {
        id: 2,
        title: 'تأهيل اخصائي صحة نفسية وتعديل السلوك',
        desc: 'برنامج متخصص في الصحة النفسية وتعديل السلوك.',
        img1: 'https://i.postimg.cc/90sgr1fK/IMG-20260714-WA0099.jpg.jpg',
        img2: 'https://i.postimg.cc/SssgdHY0/IMG-20260714-WA0106.jpg',
        video: 'https://videotourl.com/videos/1784082422334-ae817570-5f5b-4547-aedf-ec9f8235571d.mp4'
    },
    {
        id: 3,
        title: 'تأهيل مرشد أسري وتربوي',
        desc: 'برنامج إعداد مرشدين أسريين وتربويين محترفين.',
        img1: 'https://i.postimg.cc/T3t7bRhY/IMG-20260714-WA0098.jpg',
        img2: 'https://i.postimg.cc/Mpptqhtx/IMG-20260714-WA0072.jpg',
        video: 'https://videotourl.com/videos/1784079076779-9980f13e-7cb9-416e-ba2e-9ed8ab92ab9e.mp4'
    },
    {
        id: 4,
        title: 'تدريب المدربين TOT',
        desc: 'برنامج تدريب المدربين (TOT) لإعداد قادة التدريب.',
        img1: 'https://i.postimg.cc/RFKLg9Cc/IMG-20260714-WA0084.jpg',
        img2: 'https://i.postimg.cc/prPzkF13/IMG-20260714-WA0092.jpg',
        video: 'https://videotourl.com/videos/1784081986745-5f1eea13-21d3-4218-8e7a-3eb8f74615f8.mp4'
    },
    {
        id: 5,
        title: 'تأهيل اخصائي دعم نفسي وإدمان',
        desc: 'برنامج لتأهيل الاخصائيين في مجال الدعم النفسي والإدمان.',
        img1: 'https://i.postimg.cc/nzGQsLcR/IMG-20260714-WA0083.jpg',
        img2: 'https://i.postimg.cc/br6DTFn6/IMG-20260714-WA0093.jpg',
        video: 'https://videotourl.com/videos/1784081882304-39e49100-4dbd-4bf5-be4b-a50b98b778ac.mp4'
    },
    {
        id: 6,
        title: 'تأهيل اخصائي تربية خاصة',
        desc: 'برنامج لتأهيل الاخصائيين في مجال التربية الخاصة.',
        img1: 'https://i.postimg.cc/8zfJR4zH/IMG-20260714-WA0095.jpg',
        img2: 'https://i.postimg.cc/d16LsS57/IMG-20260714-WA0067.jpg',
        video: 'https://www.image2url.com/r2/default/videos/1784073451623-92b20533-c847-49bc-847a-f213e1171a7a.mp4'
    }
];

// ---------- الفروع ----------
const branchesData = [
    { city: 'القاهرة', branches: 'فرع عباس العقاد' },
    { city: 'الإسكندرية', branches: 'فرع السيوف / فرع سابا باشا' },
    { city: 'مطروح', branches: 'فرع ش الإسكندرية' },
    { city: 'بورسعيد', branches: 'فرع الثلاثيني / فرع الممشي السياحي' }
];

// ---------- أطباء "جلستك النفسيه" ----------
const therapistsData = [
    {
        name: 'د/ رامي علاء الدين',
        image: 'https://i.postimg.cc/JhnS16K8/WA-1784114163484.jpg',
        whatsapp: '01020496810'
    },
    {
        name: 'د. سارة محمود',
        image: 'ضع_رابط_صورة_الدكتور_2.jpg',
        whatsapp: '201234567891'
    },
    {
        name: 'د. كريم حسن',
        image: 'ضع_رابط_صورة_الدكتور_3.jpg',
        whatsapp: '201234567892'
    },
    {
        name: 'د. نورا إبراهيم',
        image: 'ضع_رابط_صورة_الدكتور_4.jpg',
        whatsapp: '201234567893'
    }
];

// ---------- بيانات الطلاب (20 طالب وهمي) ----------
const studentsData = [
    { 
        code: 'SH-2025-001', 
        studentName: 'أحمد محمد علي', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي اكلينكي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_1.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_1.jpg' 
    },
    { 
        code: 'SH-2025-002', 
        studentName: 'سارة خالد عبدالله', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي صحة نفسية', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_2.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_2.jpg' 
    },
    { 
        code: 'SH-2025-003', 
        studentName: 'يوسف طارق إبراهيم', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل مرشد أسري', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_3.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_3.jpg' 
    },
    { 
        code: 'SH-2025-004', 
        studentName: 'ليلى عماد الدين', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تدريب المدربين TOT', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_4.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_4.jpg' 
    },
    { 
        code: 'SH-2025-005', 
        studentName: 'عمر سامي عبدالرحمن', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي دعم نفسي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_5.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_5.jpg' 
    },
    { 
        code: 'SH-2025-006', 
        studentName: 'نورا سعيد أحمد', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي تربية خاصة', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_6.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_6.jpg' 
    },
    { 
        code: 'SH-2025-007', 
        studentName: 'محمد جمال الدين', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي اكلينكي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_7.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_7.jpg' 
    },
    { 
        code: 'SH-2025-008', 
        studentName: 'فاطمة حسن علي', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي صحة نفسية', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_8.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_8.jpg' 
    },
    { 
        code: 'SH-2025-009', 
        studentName: 'كريم مصطفى ناجي', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل مرشد أسري', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_9.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_9.jpg' 
    },
    { 
        code: 'SH-2025-010', 
        studentName: 'هناء عاطف محمود', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تدريب المدربين TOT', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_10.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_10.jpg' 
    },
    { 
        code: 'SH-2025-011', 
        studentName: 'أحمد فتحي السيد', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي دعم نفسي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_11.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_11.jpg' 
    },
    { 
        code: 'SH-2025-012', 
        studentName: 'سعاد محمد رضا', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي تربية خاصة', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_12.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_12.jpg' 
    },
    { 
        code: 'SH-2025-013', 
        studentName: 'طارق ياسر أحمد', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي اكلينكي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_13.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_13.jpg' 
    },
    { 
        code: 'SH-2025-014', 
        studentName: 'منى عبدالرحمن سليمان', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي صحة نفسية', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_14.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_14.jpg' 
    },
    { 
        code: 'SH-2025-015', 
        studentName: 'سامي أحمد عبدالله', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل مرشد أسري', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_15.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_15.jpg' 
    },
    { 
        code: 'SH-2025-016', 
        studentName: 'رباب خالد محمد', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تدريب المدربين TOT', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_16.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_16.jpg' 
    },
    { 
        code: 'SH-2025-017', 
        studentName: 'أمير جمال حسن', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي دعم نفسي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_17.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_17.jpg' 
    },
    { 
        code: 'SH-2025-018', 
        studentName: 'حنان علي يوسف', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي تربية خاصة', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_18.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_18.jpg' 
    },
    { 
        code: 'SH-2025-019', 
        studentName: 'مروان ياسر إبراهيم', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي اكلينكي', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_19.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_19.jpg' 
    },
    { 
        code: 'SH-2025-020', 
        studentName: 'إيمان صلاح الدين', 
        lecturerName: 'د. محمد قطب', 
        courseName: 'تأهيل اخصائي صحة نفسية', 
        lecturerImage: 'ضع_رابط_صورة_المحاضر_20.jpg', 
        certificateImage: 'ضع_رابط_صورة_الشهادة_20.jpg' 
    }
];
// =============================================================
// ====== عرض البرامج مع صورة مصغرة للفيديو ======
// =============================================================
function renderPrograms() {
    const grid = document.getElementById('programsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    programsData.forEach(p => {
        const card = document.createElement('div');
        card.className = 'program-card';
        card.innerHTML = `
            <div class="program-images">
                <img src="${p.img1}" alt="${p.title}" 
                     data-img1="${p.img1}" 
                     data-img2="${p.img2}" 
                     class="auto-slide-img" />
            </div>
            <div class="program-video">
                <video preload="none" controls 
                       poster="${p.img1}">   <!-- ====== صورة مصغرة (بوستر) ====== -->
                    <source src="${p.video}" type="video/mp4" />
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
            </div>
            <div class="program-content">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
                <button class="btn-book" onclick="openBooking('${p.title}')">
                    <i class="fas fa-calendar-check"></i> حجز
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    startAutoSlides();
}
// =============================================================
// ====== دالة التبديل التلقائي للصور ======
// =============================================================
function startAutoSlides() {
    const images = document.querySelectorAll('.auto-slide-img');
    
    images.forEach(img => {
        const img1 = img.dataset.img1;
        const img2 = img.dataset.img2;
        let isFirst = true; // نبدأ بالصورة الأولى

        // تغيير الصورة كل 3 ثوانٍ (3000 ملي ثانية)
        setInterval(() => {
            // إضافة تأثير تلاشي سلس
            img.style.transition = 'opacity 0.8s ease-in-out';
            img.style.opacity = '0';

            setTimeout(() => {
                // تبديل المصدر
                if (isFirst) {
                    img.src = img2;
                } else {
                    img.src = img1;
                }
                isFirst = !isFirst;
                img.style.opacity = '1';
            }, 400); // نفس مدة الانتقال (0.8s) لكن ننتظر نصفها
        }, 2000); // <- غيّر الرقم 3000 إلى 2000 لتتغير كل ثانيتين، أو 4000 لأربع ثوانٍ
    });
}

function renderBranches() {
    const grid = document.getElementById('branchesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    branchesData.forEach(b => {
        const card = document.createElement('div');
        card.className = 'branch-card';
        card.innerHTML = `
            <h3>${b.city}</h3>
            <p>${b.branches}</p>
        `;
        grid.appendChild(card);
    });
}

function renderTherapists() {
    const grid = document.getElementById('therapistsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    therapistsData.forEach(t => {
        const card = document.createElement('div');
        card.className = 'therapist-card';
        card.innerHTML = `
            <img src="${t.image}" alt="${t.name}" loading="lazy" />
            <h3>${t.name}</h3>
            <a href="https://wa.me/20${t.whatsapp}" target="_blank" class="btn-whatsapp">
                <i class="fab fa-whatsapp"></i> تواصل عبر واتساب
            </a>
        `;
        grid.appendChild(card);
    });
}

// =============================================================
// ====== البحث عن الشهادة ======
// =============================================================
function searchCertificate() {
    const input = document.getElementById('certSearchInput');
    const code = input.value.trim();
    if (!code) {
        alert('الرجاء إدخال كود الشهادة.');
        return;
    }
    const student = studentsData.find(s => s.code === code);
    const modal = document.getElementById('certModal');
    const resultDiv = document.getElementById('certResult');
    if (!student) {
        resultDiv.innerHTML = `
            <h3 style="color: #c84e6b;">❌ لم يتم العثور على شهادة بهذا الكود</h3>
            <p style="color: var(--text-secondary);">الرجاء التأكد من الكود المدخل.</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <h3>🎓 شهادة معتمدة</h3>
            <div class="cert-detail">
                <p><strong>اسم الطالب:</strong> ${student.studentName}</p>
                <p><strong>اسم المحاضر:</strong> ${student.lecturerName}</p>
                <p><strong>البرنامج:</strong> ${student.courseName}</p>
                <p><strong>كود الشهادة:</strong> ${student.code}</p>
            </div>
            <h4 style="color: var(--accent-gold);">صورة المحاضر</h4>
            <img src="${student.lecturerImage}" alt="صورة المحاضر" style="max-height:200px;" />
            <h4 style="color: var(--accent-gold);">صورة الشهادة</h4>
            <img src="${student.certificateImage}" alt="صورة الشهادة" style="max-height:300px;" />
        `;
    }
    modal.style.display = 'block';
}
// =============================================================
// ====== الحجز مع إرسال إلى واتساب ======
// =============================================================
let selectedProgram = '';

function openBooking(programTitle) {
    selectedProgram = programTitle;
    const modal = document.getElementById('bookingModal');
    if (!modal) {
        alert('حدث خطأ: لم يتم العثور على نافذة الحجز.');
        return;
    }
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function bookProgram(e) {
    e.preventDefault();
    const name = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const msg = document.getElementById('bookingMessage');

    if (!name || !phone) {
        msg.innerHTML = '<span style="color:#c84e6b;">⚠️ الرجاء ملء جميع الحقول</span>';
        return;
    }

    // ====== 1. حفظ الحجز في localStorage (للأرشفة) ======
    const booking = {
        id: Date.now(),
        name: name,
        phone: phone,
        program: selectedProgram,
        date: new Date().toLocaleString('ar-EG', { hour12: true }),
        status: 'جديد'
    };
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // ====== 2. إرسال رسالة واتساب ======
    // رقم واتساب الأكاديمية (الرقم الموجود في الموقع)
    const whatsappNumber = '201208727737'; // بدون صفر أو +

    // نص الرسالة (تفاصيل الحجز)
    const message = `📋 *حجز جديد من موقع الأكاديمية الدولية*

👤 *الاسم:* ${name}
📱 *رقم الهاتف:* ${phone}
📚 *البرنامج:* ${selectedProgram}
📅 *تاريخ الحجز:* ${new Date().toLocaleString('ar-EG', { hour12: true })}

✅ يرجى التواصل مع العميل في أقرب وقت.`;

    // ترميز النص ليكون صالحاً للرابط
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // فتح رابط واتساب في نافذة جديدة
    window.open(whatsappLink, '_blank');

    // ====== 3. عرض رسالة نجاح للمستخدم ======
    msg.innerHTML = `
        <span style="color:#25d366;">✅ تم حجز برنامج "${selectedProgram}" بنجاح!</span><br />
        <span style="color:var(--text-secondary);">سيتم التواصل معك قريباً على رقم ${phone}</span>
        <br /><span style="color:var(--text-secondary); font-size:0.8rem;">✅ تم إرسال إشعار إلى الأكاديمية عبر واتساب</span>
    `;

    // إعادة تعيين الحقول وإغلاق المودال بعد 3 ثوان
    setTimeout(() => {
        closeModal('bookingModal');
        document.getElementById('studentName').value = '';
        document.getElementById('studentPhone').value = '';
        msg.innerHTML = '';
    }, 3000);
}
// =============================================================
// ====== إغلاق المودال ======
// =============================================================
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// =============================================================
// ====== قائمة الجوال وتحميل المحتوى ======
// =============================================================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
    renderPrograms();
    renderBranches();
    renderTherapists();
    
});
