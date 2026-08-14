/* =====================================================
   ADMIN LECTURES SYSTEM
   الأكاديمية الدولية
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
            "Firebase Database Error:",
            error
        );

    }

}


/* =====================================================
   COURSE DATA
===================================================== */

const courseData = {

    section1: {

        name: "القسم الأول",

        title:
            "المحاضرات التدريبية الأولى"

    },

    section2: {

        name: "القسم الثاني",

        title:
            "المحاضرات التدريبية الثانية"

    },

    section3: {

        name: "القسم الثالث",

        title:
            "المحاضرات التدريبية الثالثة"

    }

};



/* =====================================================
   VARIABLES
===================================================== */

let users = {};

let views = {};

let lectures = {};

let selectedAdminCourse = "section1";

let editingUserKey = null;



/* =====================================================
   DEFAULT LECTURES
   10 محاضرات داخل كل قسم
===================================================== */

function createDefaultLectures() {

    const data = {};

    Object.keys(courseData).forEach(
        function (courseId) {

            data[courseId] = {};

            for (
                let i = 1;
                i <= 10;
                i++
            ) {

                data[courseId][
                    "lecture" + i
                ] = {

                    number: i,

                    title:
                        "المحاضرة " + i,

                    description:
                        "لم تتم إضافة محتوى هذه المحاضرة بعد.",

                    videoUrl: "",

                    active: false

                };

            }

        }
    );

    return data;

}



/* =====================================================
   INIT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdmin();

    }
);



/* =====================================================
   INITIALIZE ADMIN
===================================================== */

async function initializeAdmin() {

    if (!db) {

        showGlobalError(
            "لم يتم الاتصال بقاعدة البيانات. تأكد من firebase-config.js"
        );

        return;

    }


    await loadAllData();

    renderUsers();

    renderLectures();

    renderViews();

    renderPermissions();

    updateStatistics();

    loadSystemSettings();

}



/* =====================================================
   LOAD ALL DATA
===================================================== */

async function loadAllData() {

    try {

        const snapshot =
            await db.ref().once("value");

        const data =
            snapshot.val() || {};


        users =
            data.academyUsers || {};


        views =
            data.academyViews || {};


        lectures =
            data.academyLectures || {};


        if (
            Object.keys(lectures).length === 0
        ) {

            lectures =
                createDefaultLectures();

        }


    } catch (error) {

        console.error(error);

        showGlobalError(
            "تعذر تحميل بيانات الإدارة."
        );

    }

}



/* =====================================================
   TABS
===================================================== */

function showAdminTab(
    tabId,
    button
) {

    const tabs =
        document.querySelectorAll(
            ".admin-tab"
        );


    tabs.forEach(
        function (tab) {

            tab.classList.add(
                "hidden"
            );

        }
    );


    const selected =
        document.getElementById(
            tabId
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );

    }


    const buttons =
        document.querySelectorAll(
            ".tab-btn"
        );


    buttons.forEach(
        function (btn) {

            btn.classList.remove(
                "active"
            );

        }
    );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    if (tabId === "usersTab") {

        renderUsers();

    }


    if (tabId === "lecturesTab") {

        renderLectures();

    }


    if (tabId === "viewsTab") {

        renderViews();

    }

}



/* =====================================================
   COURSE SELECT
===================================================== */

function selectAdminCourse(
    courseId,
    button
) {

    if (!courseData[courseId]) {

        return;

    }


    selectedAdminCourse =
        courseId;


    document
        .querySelectorAll(
            ".course-select-btn"
        )
        .forEach(
            function (btn) {

                btn.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    renderLectures();

}



/* =====================================================
   RENDER LECTURES
===================================================== */

function renderLectures() {

    const container =
        document.getElementById(
            "adminLecturesGrid"
        );


    if (!container) {

        return;

    }


    if (
        !lectures[selectedAdminCourse]
    ) {

        lectures[
            selectedAdminCourse
        ] = {};

    }


    let html = "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const key =
            "lecture" + i;


        const lecture =
            lectures[
                selectedAdminCourse
            ][key] || {

                number: i,

                title:
                    "المحاضرة " + i,

                description:
                    "لم تتم إضافة المحتوى بعد.",

                videoUrl: "",

                active: false

            };


        const status =
            lecture.active
                ? `
                    <span class="badge badge-paid">
                        ● متاحة
                    </span>
                  `
                : `
                    <span class="badge badge-unpaid">
                        ● غير متاحة
                    </span>
                  `;


        html += `

            <article
                class="admin-lecture-card">

                <div
                    class="lecture-card-top">

                    <div>

                        <span
                            class="lecture-number">

                            ${i}

                        </span>

                    </div>

                    <div>

                        ${status}

                    </div>

                </div>


                <div
                    class="lecture-card-body">

                    <h3>

                        ${
                            escapeHtml(
                                lecture.title ||
                                "المحاضرة " + i
                            )
                        }

                    </h3>


                    <p>

                        ${
                            escapeHtml(
                                lecture.description ||
                                "لا يوجد وصف."
                            )
                        }

                    </p>


                    <div
                        class="video-url">

                        ${
                            lecture.videoUrl
                                ? escapeHtml(
                                    lecture.videoUrl
                                )
                                : "لم تتم إضافة رابط فيديو"
                        }

                    </div>


                    <div
                        class="lecture-card-actions">

                        <button
                            class="primary-btn"
                            onclick="
                                openLectureModal(
                                    '${selectedAdminCourse}',
                                    ${i}
                                )
                            ">

                            ✏️ تعديل

                        </button>

                    </div>

                </div>

            </article>

        `;

    }


    container.innerHTML =
        html;

}



/* =====================================================
   OPEN LECTURE MODAL
===================================================== */

function openLectureModal(
    courseId,
    lectureNumber
) {

    const lecture =
        lectures?.[courseId]?.[
            "lecture" + lectureNumber
        ] || {};


    document.getElementById(
        "lectureCourseId"
    ).value =
        courseId;


    document.getElementById(
        "lectureNumber"
    ).value =
        lectureNumber;


    document.getElementById(
        "lectureModalTitle"
    ).textContent =
        courseData[courseId].name +
        " - المحاضرة " +
        lectureNumber;


    document.getElementById(
        "lectureTitleInput"
    ).value =
        lecture.title ||
        "المحاضرة " +
        lectureNumber;


    document.getElementById(
        "lectureDescriptionInput"
    ).value =
        lecture.description ||
        "";


    document.getElementById(
        "lectureVideoUrl"
    ).value =
        lecture.videoUrl ||
        "";


    document.getElementById(
        "lectureActive"
    ).value =
        lecture.active
            ? "true"
            : "false";


    document.getElementById(
        "lectureModalMessage"
    ).textContent = "";


    document.getElementById(
        "lectureModal"
    ).classList.remove(
        "hidden"
    );

}



/* =====================================================
   CLOSE LECTURE MODAL
===================================================== */

function closeLectureModal() {

    document.getElementById(
        "lectureModal"
    ).classList.add(
        "hidden"
    );

}



/* =====================================================
   SAVE LECTURE
===================================================== */

async function saveLecture() {

    const courseId =
        document.getElementById(
            "lectureCourseId"
        ).value;


    const lectureNumber =
        document.getElementById(
            "lectureNumber"
        ).value;


    const title =
        document.getElementById(
            "lectureTitleInput"
        ).value.trim();


    const description =
        document.getElementById(
            "lectureDescriptionInput"
        ).value.trim();


    const videoUrl =
        document.getElementById(
            "lectureVideoUrl"
        ).value.trim();


    const active =
        document.getElementById(
            "lectureActive"
        ).value === "true";


    const message =
        document.getElementById(
            "lectureModalMessage"
        );


    if (!title) {

        message.textContent =
            "اكتب عنوان المحاضرة.";

        message.className =
            "modal-message error";

        return;

    }


    if (!videoUrl) {

        message.textContent =
            "ضع رابط الفيديو.";

        message.className =
            "modal-message error";

        return;

    }


    const lectureKey =
        "lecture" +
        lectureNumber;


    const lectureData = {

        number:
            Number(lectureNumber),

        title:
            title,

        description:
            description,

        videoUrl:
            videoUrl,

        active:
            active,

        updatedAt:
            Date.now()

    };


    try {

        await db
            .ref(
                "academyLectures/" +
                courseId +
                "/" +
                lectureKey
            )
            .set(
                lectureData
            );


        if (!lectures[courseId]) {

            lectures[courseId] = {};

        }


        lectures[courseId][lectureKey] =
            lectureData;


        message.textContent =
            "تم حفظ المحاضرة بنجاح.";

        message.className =
            "modal-message success";


        renderLectures();


        setTimeout(
            function () {

                closeLectureModal();

            },
            700
        );


    } catch (error) {

        console.error(error);

        message.textContent =
            "حدث خطأ أثناء حفظ المحاضرة.";

        message.className =
            "modal-message error";

    }

}



/* =====================================================
   USER MODAL
===================================================== */

function openUserModal() {

    editingUserKey = null;


    document.getElementById(
        "userEmail"
    ).value = "";


    document.getElementById(
        "userPhone"
    ).value = "";


    document.getElementById(
        "userAccessId"
    ).value = "";


    document.getElementById(
        "userPaymentStatus"
    ).value =
        "unpaid";


    document.getElementById(
        "userModalMessage"
    ).textContent = "";


    renderPermissions();


    document.getElementById(
        "userModal"
    ).classList.remove(
        "hidden"
    );

}



/* =====================================================
   CLOSE USER MODAL
===================================================== */

function closeUserModal() {

    document.getElementById(
        "userModal"
    ).classList.add(
        "hidden"
    );

}



/* =====================================================
   GENERATE ID
===================================================== */

function generateAccessId() {

    const year =
        new Date().getFullYear();


    const random =
        Math.floor(
            100000 +
            Math.random() *
            900000
        );


    document.getElementById(
        "userAccessId"
    ).value =
        "IA-" +
        year +
        "-" +
        random;

}



/* =====================================================
   SAVE USER
===================================================== */

async function saveUser() {

    const email =
        document.getElementById(
            "userEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "userPhone"
        ).value.trim();


    const accessId =
        document.getElementById(
            "userAccessId"
        ).value.trim();


    const paymentStatus =
        document.getElementById(
            "userPaymentStatus"
        ).value;


    const message =
        document.getElementById(
            "userModalMessage"
        );


    if (!email) {

        showModalMessage(
            message,
            "اكتب البريد الإلكتروني.",
            "error"
        );

        return;

    }


    if (!phone) {

        showModalMessage(
            message,
            "اكتب رقم الهاتف.",
            "error"
        );

        return;

    }


    if (!accessId) {

        showModalMessage(
            message,
            "اكتب ID المشترك.",
            "error"
        );

        return;

    }


    const exists =
        Object.values(users)
            .some(
                function (user) {

                    return (
                        user.accessId ===
                        accessId
                    );

                }
            );


    if (exists) {

        showModalMessage(
            message,
            "هذا الـ ID مستخدم بالفعل.",
            "error"
        );

        return;

    }


    const permissions =
        getSelectedPermissions(
            "permissionsSection"
        );


    const userKey =
        db.ref(
            "academyUsers"
        ).push().key;


    const userData = {

        email:
            email,

        phone:
            phone,

        accessId:
            accessId,

        paymentStatus:
            paymentStatus,

        blocked:
            false,

        permissions:
            permissions,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };


    try {

        await db
            .ref(
                "academyUsers/" +
                userKey
            )
            .set(
                userData
            );


        users[userKey] =
            userData;


        updateStatistics();

        renderUsers();


        showModalMessage(
            message,
            "تم إنشاء المشترك بنجاح.",
            "success"
        );


        setTimeout(
            function () {

                closeUserModal();

            },
            700
        );


    } catch (error) {

        console.error(error);

        showModalMessage(
            message,
            "تعذر حفظ المشترك.",
            "error"
        );

    }

}



/* =====================================================
   RENDER PERMISSIONS
===================================================== */

function renderPermissions() {

    renderPermissionList(
        "permissionsSection1",
        "section1"
    );


    renderPermissionList(
        "permissionsSection2",
        "section2"
    );


    renderPermissionList(
        "permissionsSection3",
        "section3"
    );

}



function renderPermissionList(
    elementId,
    courseId,
    selected = {}
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {

        return;

    }


    let html = "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const key =
            courseId +
            "_lecture" +
            i;


        const checked =
            selected[key]
                ? "checked"
                : "";


        html += `

            <label
                class="permission-item">

                <input
                    type="checkbox"
                    data-permission="${key}"
                    ${checked}>

                <span>
                    ${i}
                </span>

            </label>

        `;

    }


    container.innerHTML =
        html;

}



/* =====================================================
   GET PERMISSIONS
===================================================== */

function getSelectedPermissions(
    prefix
) {

    const permissions = {};

    const inputs =
        document.querySelectorAll(
            `input[data-permission]`
        );


    inputs.forEach(
        function (input) {

            if (
                input.checked
            ) {

                permissions[
                    input.dataset.permission
                ] = true;

            }

        }
    );


    return permissions;

}



/* =====================================================
   RENDER USERS
===================================================== */

function renderUsers() {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );


    if (!tbody) {

        return;

    }


    const search =
        (
            document.getElementById(
                "userSearch"
            )?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    let html = "";


    Object.entries(users)
        .forEach(
            function ([
                key,
                user
            ]) {

                const searchable =
                    (
                        (user.email || "") +
                        " " +
                        (user.phone || "") +
                        " " +
                        (user.accessId || "")
                    )
                    .toLowerCase();


                if (
                    search &&
                    !searchable.includes(
                        search
                    )
                ) {

                    return;

                }


                const paid =
                    user.paymentStatus ===
                    "paid";


                const blocked =
                    user.blocked === true;


                const permissions =
                    Object.keys(
                        user.permissions || {}
                    ).length;


                html += `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHtml(
                                    user.email ||
                                    "-"
                                )}
                            </strong>

                        </td>


                        <td>

                            <code>
                                ${escapeHtml(
                                    user.accessId ||
                                    "-"
                                )}
                            </code>

                        </td>


                        <td>

                            ${escapeHtml(
                                user.phone ||
                                "-"
                            )}

                        </td>


                        <td>

                            ${
                                paid
                                    ? `
                                        <span class="
                                            badge
                                            badge-paid">

                                            ✓ مدفوع

                                        </span>
                                      `
                                    : `
                                        <span class="
                                            badge
                                            badge-unpaid">

                                            ! غير مدفوع

                                        </span>
                                      `
                            }

                        </td>


                        <td>

                            ${
                                blocked
                                    ? `
                                        <span class="
                                            badge
                                            badge-blocked">

                                            🚫 محظور

                                        </span>
                                      `
                                    : `
                                        <span class="
                                            badge
                                            badge-active">

                                            ✓ نشط

                                        </span>
                                      `
                            }

                        </td>


                        <td>

                            ${permissions}
                            محاضرة

                        </td>


                        <td>

                            <div
                                class="action-buttons">

                                <button
                                    class="
                                        action-btn
                                        action-edit"
                                    onclick="
                                        editUser(
                                            '${key}'
                                        )
                                    ">

                                    ✏️ تعديل

                                </button>


                                <button
                                    class="
                                        action-btn
                                        action-block"
                                    onclick="
                                        toggleBlockUser(
                                            '${key}'
                                        )
                                    ">

                                    ${
                                        blocked
                                            ? "🔓 فك الحظر"
                                            : "🚫 حظر"
                                    }

                                </button>


                                <button
                                    class="
                                        action-btn
                                        action-delete"
                                    onclick="
                                        deleteUser(
                                            '${key}'
                                        )
                                    ">

                                    🗑️ حذف

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        );


    if (!html) {

        html = `

            <tr>

                <td
                    colspan="7">

                    <div
                        class="empty-state">

                        <div
                            class="empty-state-icon">

                            👥

                        </div>

                        <h3>
                            لا يوجد مشتركون
                        </h3>

                        <p>
                            أضف أول مشترك من زر
                            "إضافة مشترك".
                        </p>

                    </div>

                </td>

            </tr>

        `;

    }


    tbody.innerHTML =
        html;

}



/* =====================================================
   EDIT USER
===================================================== */

function editUser(key) {

    const user =
        users[key];


    if (!user) {

        return;

    }


    editingUserKey =
        key;


    document.getElementById(
        "editUserKey"
    ).value =
        key;


    document.getElementById(
        "editUserEmail"
    ).value =
        user.email || "";


    document.getElementById(
        "editUserPhone"
    ).value =
        user.phone || "";


    document.getElementById(
        "editUserAccessId"
    ).value =
        user.accessId || "";


    document.getElementById(
        "editUserPaymentStatus"
    ).value =
        user.paymentStatus ||
        "unpaid";


    document.getElementById(
        "editUserBlocked"
    ).value =
        user.blocked
            ? "true"
            : "false";


    renderEditPermissions(
        user.permissions || {}
    );


    document.getElementById(
        "editUserMessage"
    ).textContent = "";


    document.getElementById(
        "editUserModal"
    ).classList.remove(
        "hidden"
    );

}



/* =====================================================
   EDIT PERMISSIONS
===================================================== */

function renderEditPermissions(
    selected
) {

    const container =
        document.getElementById(
            "editPermissionsContainer"
        );


    let html = "";


    Object.keys(courseData)
        .forEach(
            function (courseId) {

                html += `

                    <div
                        class="permission-course">

                        <strong>
                            ${
                                courseData[
                                    courseId
                                ].name
                            }
                        </strong>

                        <div
                            class="permission-list">

                `;


                for (
                    let i = 1;
                    i <= 10;
                    i++
                ) {

                    const key =
                        courseId +
                        "_lecture" +
                        i;


                    html += `

                        <label
                            class="
                                permission-item">

                            <input
                                type="checkbox"
                                data-edit-permission="
                                    ${key}"
                                ${
                                    selected[key]
                                        ? "checked"
                                        : ""
                                }>

                            <span>
                                ${i}
                            </span>

                        </label>

                    `;

                }


                html += `

                        </div>

                    </div>

                `;

            }
        );


    container.innerHTML =
        html;

}



/* =====================================================
   UPDATE USER
===================================================== */

async function updateUser() {

    const key =
        editingUserKey ||
        document.getElementById(
            "editUserKey"
        ).value;


    if (!key || !users[key]) {

        return;

    }


    const email =
        document.getElementById(
            "editUserEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "editUserPhone"
        ).value.trim();


    const accessId =
        document.getElementById(
            "editUserAccessId"
        ).value.trim();


    const paymentStatus =
        document.getElementById(
            "editUserPaymentStatus"
        ).value;


    const blocked =
        document.getElementById(
            "editUserBlocked"
        ).value === "true";


    const message =
        document.getElementById(
            "editUserMessage"
        );


    if (!email || !phone || !accessId) {

        showModalMessage(
            message,
            "أكمل جميع البيانات.",
            "error"
        );

        return;

    }


    const duplicate =
        Object.entries(users)
            .some(
                function ([
                    userKey,
                    user
                ]) {

                    return (
                        userKey !== key &&
                        user.accessId ===
                        accessId
                    );

                }
            );


    if (duplicate) {

        showModalMessage(
            message,
            "الـ ID مستخدم بالفعل.",
            "error"
        );

        return;

    }


    const permissions = {};


    document
        .querySelectorAll(
            "input[data-edit-permission]"
        )
        .forEach(
            function (input) {

                if (
                    input.checked
                ) {

                    permissions[
                        input.dataset.editPermission
                    ] = true;

                }

            }
        );


    const updatedUser = {

        ...users[key],

        email:
            email,

        phone:
            phone,

        accessId:
            accessId,

        paymentStatus:
            paymentStatus,

        blocked:
            blocked,

        permissions:
            permissions,

        updatedAt:
            Date.now()

    };


    try {

        await db
            .ref(
                "academyUsers/" +
                key
            )
            .set(
                updatedUser
            );


        users[key] =
            updatedUser;


        renderUsers();

        updateStatistics();


        showModalMessage(
            message,
            "تم تحديث بيانات المشترك.",
            "success"
        );


        setTimeout(
            function () {

                closeEditUserModal();

            },
            700
        );


    } catch (error) {

        console.error(error);

        showModalMessage(
            message,
            "تعذر حفظ التعديلات.",
            "error"
        );

    }

}



/* =====================================================
   CLOSE EDIT MODAL
===================================================== */

function closeEditUserModal() {

    document.getElementById(
        "editUserModal"
    ).classList.add(
        "hidden"
    );

}



/* =====================================================
   BLOCK / UNBLOCK USER
===================================================== */

async function toggleBlockUser(
    key
) {

    const user =
        users[key];


    if (!user) {

        return;

    }


    const newStatus =
        !user.blocked;


    try {

        await db
            .ref(
                "academyUsers/" +
                key +
                "/blocked"
            )
            .set(
                newStatus
            );


        users[key].blocked =
            newStatus;


        renderUsers();

        updateStatistics();


    } catch (error) {

        console.error(error);

        alert(
            "تعذر تغيير حالة الحساب."
        );

    }

}



/* =====================================================
   DELETE USER
===================================================== */

async function deleteUser(key) {

    const user =
        users[key];


    if (!user) {

        return;

    }


    const confirmed =
        confirm(
            "هل أنت متأكد من حذف هذا المشترك؟"
        );


    if (!confirmed) {

        return;

    }


    try {

        await db
            .ref(
                "academyUsers/" +
                key
            )
            .remove();


        delete users[key];


        renderUsers();

        updateStatistics();


    } catch (error) {

        console.error(error);

        alert(
            "تعذر حذف المشترك."
        );

    }

}



/* =====================================================
   RENDER VIEWS
===================================================== */

function renderViews() {

    const tbody =
        document.getElementById(
            "viewsTableBody"
        );


    if (!tbody) {

        return;

    }


    let html = "";


    Object.values(views)
        .sort(
            function (a, b) {

                return (
                    (b.timestamp || 0) -
                    (a.timestamp || 0)
                );

            }
        )
        .forEach(
            function (view) {

                html += `

                    <tr>

                        <td>

                            ${escapeHtml(
                                view.email ||
                                "-"
                            )}

                        </td>


                        <td>

                            <code>
                                ${escapeHtml(
                                    view.accessId ||
                                    "-"
                                )}
                            </code>

                        </td>


                        <td>

                            ${
                                courseData[
                                    view.courseId
                                ]?.name ||
                                view.courseId ||
                                "-"
                            }

                        </td>


                        <td>

                            المحاضرة
                            ${
                                view.lectureNumber ||
                                "-"
                            }

                        </td>


                        <td>

                            ${
                                formatDate(
                                    view.timestamp
                                )
                            }

                        </td>

                    </tr>

                `;

            }
        );


    if (!html) {

        html = `

            <tr>

                <td colspan="5">

                    <div
                        class="empty-state">

                        <div
                            class="
                                empty-state-icon">

                            👁️

                        </div>

                        <h3>
                            لا توجد مشاهدات
                        </h3>

                        <p>
                            ستظهر سجلات المشاهدة هنا.
                        </p>

                    </div>

                </td>

            </tr>

        `;

    }


    tbody.innerHTML =
        html;

}



/* =====================================================
   STATISTICS
===================================================== */

function updateStatistics() {

    const userList =
        Object.values(users);


    const total =
        userList.length;


    const paid =
        userList.filter(
            function (user) {

                return (
                    user.paymentStatus ===
                    "paid"
                );

            }
        ).length;


    const blocked =
        userList.filter(
            function (user) {

                return (
                    user.blocked === true
                );

            }
        ).length;


    const totalViews =
        Object.keys(
            views
        ).length;


    setText(
        "totalUsers",
        total
    );


    setText(
        "paidUsers",
        paid
    );


    setText(
        "blockedUsers",
        blocked
    );


    setText(
        "totalViews",
        totalViews
    );

}



/* =====================================================
   SYSTEM SETTINGS
===================================================== */

async function loadSystemSettings() {

    try {

        const snapshot =
            await db
                .ref(
                    "academySettings"
                )
                .once(
                    "value"
                );


        const settings =
            snapshot.val() || {};


        const oneViewOnly =
            settings.oneViewOnly !==
            false;


        const paymentRequired =
            settings.paymentRequired !==
            false;


        const oneViewElement =
            document.getElementById(
                "oneViewOnly"
            );


        const paymentElement =
            document.getElementById(
                "paymentRequired"
            );


        if (oneViewElement) {

            oneViewElement.checked =
                oneViewOnly;

        }


        if (paymentElement) {

            paymentElement.checked =
                paymentRequired;

        }


    } catch (error) {

        console.error(error);

    }

}



/* =====================================================
   SAVE SYSTEM SETTINGS
===================================================== */

async function saveSystemSettings() {

    const oneViewOnly =
        document.getElementById(
            "oneViewOnly"
        )?.checked !== false;


    const paymentRequired =
        document.getElementById(
            "paymentRequired"
        )?.checked !== false;


    try {

        await db
            .ref(
                "academySettings"
            )
            .update({

                oneViewOnly:
                    oneViewOnly,

                paymentRequired:
                    paymentRequired,

                updatedAt:
                    Date.now()

            });

    } catch (error) {

        console.error(error);

        alert(
            "تعذر حفظ الإعدادات."
        );

    }

}



/* =====================================================
   ADMIN LOGOUT
===================================================== */

function logoutAdmin() {

    if (
        typeof firebase !==
        "undefined" &&
        firebase.auth
    ) {

        firebase.auth()
            .signOut()
            .then(
                function () {

                    window.location.href =
                        "/";

                }
            )
            .catch(
                function () {

                    window.location.href =
                        "/";

                }
            );

    } else {

        window.location.href =
            "/";

    }

}



/* =====================================================
   HELPERS
===================================================== */

function showModalMessage(
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
        "modal-message " +
        type;

}



function showGlobalError(
    text
) {

    console.error(text);

    alert(text);

}



function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}



function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "-";

    }


    try {

        return new Date(
            timestamp
        ).toLocaleString(
            "ar-EG"
        );

    } catch (error) {

        return "-";

    }

}



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
   CLOSE MODALS WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const userModal =
            document.getElementById(
                "userModal"
            );


        const editModal =
            document.getElementById(
                "editUserModal"
            );


        const lectureModal =
            document.getElementById(
                "lectureModal"
            );


        if (
            event.target ===
            userModal
        ) {

            closeUserModal();

        }


        if (
            event.target ===
            editModal
        ) {

            closeEditUserModal();

        }


        if (
            event.target ===
            lectureModal
        ) {

            closeLectureModal();

        }

    }
);