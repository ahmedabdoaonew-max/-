/* =====================================================
   COURSES.JS
   نظام المحاضرات التدريبية
===================================================== */


/* =====================================================
   FIREBASE
===================================================== */

let db = null;

if (typeof firebase !== "undefined") {

    try {

        db = firebase.database();

    } catch (error) {

        console.error(
            "Firebase error:",
            error
        );

    }

}


/* =====================================================
   COURSE DATA
===================================================== */

const courses = {

    section1: {

        name: "القسم الأول",

        images: [

            "https://picsum.photos/seed/academy-section-1-a/1000/600",

            "https://picsum.photos/seed/academy-section-1-b/1000/600"

        ]

    },


    section2: {

        name: "القسم الثاني",

        images: [

            "https://picsum.photos/seed/academy-section-2-a/1000/600",

            "https://picsum.photos/seed/academy-section-2-b/1000/600"

        ]

    },


    section3: {

        name: "القسم الثالث",

        images: [

            "https://picsum.photos/seed/academy-section-3-a/1000/600",

            "https://picsum.photos/seed/academy-section-3-b/1000/600"

        ]

    }

};



/* =====================================================
   VARIABLES
===================================================== */

let selectedCourse = null;

let selectedLecture = null;



/* =====================================================
   IMAGE SLIDER
===================================================== */

function startSlider(
    imageId,
    images
) {

    let currentIndex = 0;


    const image =
        document.getElementById(
            imageId
        );


    if (!image) {

        return;

    }


    setInterval(
        function () {

            currentIndex++;


            if (
                currentIndex >=
                images.length
            ) {

                currentIndex = 0;

            }


            image.style.opacity =
                "0";


            setTimeout(
                function () {

                    image.src =
                        images[
                            currentIndex
                        ];


                    image.style.opacity =
                        "1";

                },
                300
            );


        },
        2000
    );

}



/* =====================================================
   START SLIDERS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startSlider(
            "section1Image",
            courses.section1.images
        );


        startSlider(
            "section2Image",
            courses.section2.images
        );


        startSlider(
            "section3Image",
            courses.section3.images
        );

    }
);



/* =====================================================
   SELECT LECTURE
===================================================== */

function selectLecture(
    courseId,
    lectureNumber
) {

    if (
        !courses[courseId]
    ) {

        return;

    }


    selectedCourse =
        courseId;


    selectedLecture =
        Number(
            lectureNumber
        );


    const selectedElement =
        document.getElementById(
            "selectedCourse"
        );


    if (selectedElement) {

        selectedElement.textContent =

            courses[
                courseId
            ].name +

            " - المحاضرة " +

            lectureNumber;

    }


    scrollToLogin();


    setTimeout(
        function () {

            const idInput =
                document.getElementById(
                    "accessId"
                );


            if (idInput) {

                idInput.focus();

            }

        },
        700
    );

}



/* =====================================================
   SCROLL TO LOGIN
===================================================== */

function scrollToLogin() {

    const loginSection =
        document.getElementById(
            "loginSection"
        );


    if (!loginSection) {

        return;

    }


    loginSection.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}



/* =====================================================
   LOGIN TO LECTURE
===================================================== */

async function loginToLecture() {

    const email =
        document.getElementById(
            "email"
        )
        ?.value
        .trim();


    const phone =
        document.getElementById(
            "phone"
        )
        ?.value
        .trim();


    const accessId =
        document.getElementById(
            "accessId"
        )
        ?.value
        .trim();


    const message =
        document.getElementById(
            "loginMessage"
        );


    const button =
        document.querySelector(
            ".login-btn"
        );



    /* =================================================
       VALIDATION
    ================================================= */


    if (!selectedCourse) {

        showMessage(

            message,

            "اختر القسم أولًا.",

            "error"

        );

        return;

    }


    if (!selectedLecture) {

        showMessage(

            message,

            "اختر رقم المحاضرة أولًا.",

            "error"

        );

        return;

    }


    if (!email) {

        showMessage(

            message,

            "اكتب البريد الإلكتروني.",

            "error"

        );

        return;

    }


    if (!isValidEmail(email)) {

        showMessage(

            message,

            "البريد الإلكتروني غير صحيح.",

            "error"

        );

        return;

    }


    if (!phone) {

        showMessage(

            message,

            "اكتب رقم الهاتف.",

            "error"

        );

        return;

    }


    if (!accessId) {

        showMessage(

            message,

            "اكتب الـ ID الذي حصلت عليه من الإدارة.",

            "error"

        );

        return;

    }



    /* =================================================
       CHECK FIREBASE
    ================================================= */


    if (!db) {

        showMessage(

            message,

            "تعذر الاتصال بالنظام. حاول مرة أخرى.",

            "error"

        );

        return;

    }



    /* =================================================
       DISABLE BUTTON
    ================================================= */

    if (button) {

        button.disabled = true;

    }


    showMessage(

        message,

        "جارٍ التحقق من بيانات الدخول...",

        "loading"

    );



    try {


        /* =============================================
           GET USERS
        ============================================= */

        const usersSnapshot =
            await db
                .ref(
                    "academyUsers"
                )
                .once(
                    "value"
                );


        const users =
            usersSnapshot.val() || {};


        let userKey = null;

        let user = null;



        /* =============================================
           FIND USER
        ============================================= */

        Object.entries(users)
            .forEach(
                function ([
                    key,
                    currentUser
                ]) {

                    if (
                        userKey
                    ) {

                        return;

                    }


                    const sameEmail =

                        (
                            currentUser.email ||
                            ""
                        )
                        .toLowerCase() ===

                        email.toLowerCase();


                    const samePhone =

                        normalizePhone(
                            currentUser.phone
                        ) ===

                        normalizePhone(
                            phone
                        );


                    const sameId =

                        (
                            currentUser.accessId ||
                            ""
                        )
                        .toUpperCase() ===

                        accessId
                            .toUpperCase();


                    if (
                        sameEmail &&
                        samePhone &&
                        sameId
                    ) {

                        userKey =
                            key;

                        user =
                            currentUser;

                    }

                }
            );



        /* =============================================
           USER NOT FOUND
        ============================================= */

        if (!user) {

            throw new Error(

                "بيانات الدخول غير صحيحة أو الـ ID غير موجود."

            );

        }



        /* =============================================
           BLOCKED
        ============================================= */

        if (
            user.blocked === true
        ) {

            throw new Error(

                "تم حظر هذا الحساب من الإدارة."

            );

        }



        /* =============================================
           PAYMENT
        ============================================= */

        if (
            user.paymentStatus !==
            "paid"
        ) {

            throw new Error(

                "لم يتم تفعيل الاشتراك بعد. يرجى التواصل مع الإدارة بعد إتمام الدفع."

            );

        }



        /* =============================================
           PERMISSION
        ============================================= */

        const permissionKey =

            selectedCourse +

            "_lecture" +

            selectedLecture;


        const permissions =
            user.permissions || {};


        if (
            permissions[
                permissionKey
            ] !== true
        ) {

            throw new Error(

                "ليس لديك صلاحية لهذه المحاضرة."

            );

        }



        /* =============================================
           GET LECTURE
        ============================================= */

        const lectureSnapshot =
            await db
                .ref(
                    "academyLectures/" +
                    selectedCourse +
                    "/lecture" +
                    selectedLecture
                )
                .once(
                    "value"
                );


        const lecture =
            lectureSnapshot.val();



        /* =============================================
           LECTURE NOT FOUND
        ============================================= */

        if (!lecture) {

            throw new Error(

                "المحاضرة غير موجودة."

            );

        }



        /* =============================================
           LECTURE DISABLED
        ============================================= */

        if (
            lecture.active !== true
        ) {

            throw new Error(

                "هذه المحاضرة غير متاحة حاليًا."

            );

        }



        /* =============================================
           CHECK PREVIOUS VIEW
        ============================================= */

        const viewKey =
            createViewKey(
                userKey,
                selectedCourse,
                selectedLecture
            );


        const viewSnapshot =
            await db
                .ref(
                    "academyViews/" +
                    viewKey
                )
                .once(
                    "value"
                );


        const previousView =
            viewSnapshot.val();



        if (previousView) {

            throw new Error(

                "لقد شاهدت هذه المحاضرة من قبل، ولا يمكن فتحها مرة أخرى."

            );

        }



        /* =============================================
           DEVICE
        ============================================= */

        const deviceId =
            getDeviceId();



        /* =============================================
           DEVICE PREVIOUS VIEW
        ============================================= */

        const deviceViewSnapshot =
            await db
                .ref(
                    "academyDeviceViews/" +
                    deviceId +
                    "/" +
                    selectedCourse +
                    "/lecture" +
                    selectedLecture
                )
                .once(
                    "value"
                );


        if (
            deviceViewSnapshot.exists()
        ) {

            throw new Error(

                "تم استخدام هذا الجهاز لمشاهدة هذه المحاضرة من قبل."

            );

        }



        /* =============================================
           SAVE VIEW
        ============================================= */

        const viewData = {

            userKey:
                userKey,

            email:
                email,

            phone:
                phone,

            accessId:
                accessId,

            courseId:
                selectedCourse,

            lectureNumber:
                selectedLecture,

            timestamp:
                Date.now(),

            deviceId:
                deviceId,

            userAgent:
                navigator.userAgent || ""

        };


        await db
            .ref(
                "academyViews/" +
                viewKey
            )
            .set(
                viewData
            );


        await db
            .ref(
                "academyDeviceViews/" +
                deviceId +
                "/" +
                selectedCourse +
                "/lecture" +
                selectedLecture
            )
            .set({

                timestamp:
                    Date.now(),

                userKey:
                    userKey,

                email:
                    email

            });



        /* =============================================
           SUCCESS
        ============================================= */

        showMessage(

            message,

            "تم التحقق بنجاح. جارٍ فتح المحاضرة...",

            "success"

        );


        setTimeout(
            function () {

                displayLecture(
                    lecture
                );

            },
            500
        );



    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showMessage(

            message,

            error.message ||
            "حدث خطأ أثناء تسجيل الدخول.",

            "error"

        );


    } finally {

        if (button) {

            button.disabled = false;

        }

    }

}



/* =====================================================
   DISPLAY LECTURE
===================================================== */

function displayLecture(
    lecture
) {

    const lectureSection =
        document.getElementById(
            "lectureSection"
        );


    const lectureTitle =
        document.getElementById(
            "lectureTitle"
        );


    const lectureContent =
        document.getElementById(
            "lectureContent"
        );


    if (
        !lectureSection ||
        !lectureContent
    ) {

        return;

    }



    /* =============================================
       TITLE
    ============================================= */

    if (lectureTitle) {

        lectureTitle.textContent =

            lecture.title ||

            (
                courses[
                    selectedCourse
                ].name +

                " - المحاضرة " +

                selectedLecture
            );

    }



    /* =============================================
       VIDEO
    ============================================= */

    const videoUrl =
        lecture.videoUrl || "";


    if (!videoUrl) {

        lectureContent.innerHTML = `

            <div
                style="
                    text-align:center;
                    padding:50px 20px;
                ">

                <h3>
                    تم السماح بالدخول
                </h3>

                <p>
                    لم يتم إضافة فيديو لهذه المحاضرة بعد.
                </p>

            </div>

        `;

    } else {

        lectureContent.innerHTML = `

            <div
                class="video-container">

                <video
                    id="academyLectureVideo"
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    playsinline
                    preload="metadata">

                    <source
                        src="${escapeHtml(videoUrl)}"
                        type="video/mp4">

                    متصفحك لا يدعم تشغيل الفيديو.

                </video>

            </div>

        `;

        protectVideo();

    }



    /* =============================================
       SHOW SECTION
    ============================================= */

    lectureSection.classList.remove(
        "hidden"
    );


    lectureSection.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}



/* =====================================================
   VIDEO PROTECTION
===================================================== */

function protectVideo() {

    const video =
        document.getElementById(
            "academyLectureVideo"
        );


    if (!video) {

        return;

    }


    video.addEventListener(
        "contextmenu",
        function (event) {

            event.preventDefault();

        }
    );


    video.addEventListener(
        "dragstart",
        function (event) {

            event.preventDefault();

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.ctrlKey &&
                (
                    event.key === "s" ||
                    event.key === "S"
                )
            ) {

                event.preventDefault();

            }

        }
    );

}



/* =====================================================
   DEVICE ID
===================================================== */

function getDeviceId() {

    let deviceId =
        localStorage.getItem(
            "academyDeviceId"
        );


    if (!deviceId) {

        deviceId =

            "DEVICE-" +

            Date.now() +

            "-" +

            Math.random()
                .toString(36)
                .substring(2, 12);


        localStorage.setItem(
            "academyDeviceId",
            deviceId
        );

    }


    return deviceId;

}



/* =====================================================
   CREATE VIEW KEY
===================================================== */

function createViewKey(
    userKey,
    courseId,
    lectureNumber
) {

    return (

        userKey +

        "_" +

        courseId +

        "_lecture" +

        lectureNumber

    );

}



/* =====================================================
   EMAIL VALIDATION
===================================================== */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            email
        );

}



/* =====================================================
   PHONE NORMALIZATION
===================================================== */

function normalizePhone(
    phone
) {

    return String(
        phone || ""
    )
    .replace(
        /\s/g,
        ""
    )
    .replace(
        /-/g,
        ""
    )
    .replace(
        /^(?:\+20|0020)/,
        "0"
    );

}



/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    element,
    text,
    type
) {

    if (!element) {

        return;

    }


    element.textContent =
        text;


    element.className =
        "login-message " +
        type;

}



/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}



/* =====================================================
   ENTER KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            const active =
                document.activeElement;


            if (
                active &&
                (
                    active.id ===
                    "email" ||

                    active.id ===
                    "phone" ||

                    active.id ===
                    "accessId"
                )
            ) {

                loginToLecture();

            }

        }

    }
);