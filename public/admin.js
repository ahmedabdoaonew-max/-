/* =====================================================
   VARIABLES
===================================================== */

let adminToken = "";

let allUsers = [];



/* =====================================================
   ADMIN LOGIN
===================================================== */

async function adminLogin() {

    const password =
        document
            .getElementById("adminPassword")
            .value
            .trim();


    const message =
        document.getElementById(
            "adminLoginMessage"
        );


    if (!password) {

        showAdminMessage(
            message,
            "اكتب كلمة المرور.",
            "error"
        );

        return;

    }


    showAdminMessage(
        message,
        "جارٍ التحقق...",
        "loading"
    );


    try {

        const response =
            await fetch(
                "/api/admin-login",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        password:
                            password

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "كلمة المرور غير صحيحة."
            );

        }


        adminToken =
            data.token;


        sessionStorage.setItem(
            "academyAdminToken",
            adminToken
        );


        document
            .getElementById(
                "adminLogin"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "adminPanel"
            )
            .classList.remove(
                "hidden"
            );


        await loadUsers();

    }

    catch (error) {

        showAdminMessage(
            message,
            error.message,
            "error"
        );

    }

}



/* =====================================================
   CHECK EXISTING LOGIN
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedToken =
            sessionStorage.getItem(
                "academyAdminToken"
            );


        if (savedToken) {

            adminToken =
                savedToken;


            document
                .getElementById(
                    "adminLogin"
                )
                .classList.add(
                    "hidden"
                );


            document
                .getElementById(
                    "adminPanel"
                )
                .classList.remove(
                    "hidden"
                );


            loadUsers();

        }

    }
);



/* =====================================================
   LOAD USERS
===================================================== */

async function loadUsers() {

    const container =
        document.getElementById(
            "usersContainer"
        );


    container.innerHTML = `

        <div class="loading">

            جارٍ تحميل المشتركين...

        </div>

    `;


    try {

        const response =
            await fetch(
                "/api/admin-users",
                {

                    headers: {

                        "Authorization":
                            "Bearer " +
                            adminToken

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "تعذر تحميل البيانات."
            );

        }


        allUsers =
            data.users || [];


        updateStatistics();

        renderUsers(allUsers);

    }

    catch (error) {

        container.innerHTML = `

            <div class="loading">

                ❌ ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }

}



/* =====================================================
   STATISTICS
===================================================== */

function updateStatistics() {

    const total =
        allUsers.length;


    const approved =
        allUsers.filter(
            user => user.approved
        ).length;


    const watched =
        allUsers.filter(
            user => user.used
        ).length;


    const blocked =
        allUsers.filter(
            user => user.blocked
        ).length;


    document.getElementById(
        "totalUsers"
    ).textContent = total;


    document.getElementById(
        "approvedUsers"
    ).textContent = approved;


    document.getElementById(
        "watchedUsers"
    ).textContent = watched;


    document.getElementById(
        "blockedUsers"
    ).textContent = blocked;

}



/* =====================================================
   RENDER USERS
===================================================== */

function renderUsers(users) {

    const container =
        document.getElementById(
            "usersContainer"
        );


    if (!users.length) {

        container.innerHTML = `

            <div class="loading">

                لا يوجد مشتركين حاليًا.

            </div>

        `;

        return;

    }


    container.innerHTML =
        users
            .map(
                user =>
                    createUserCard(user)
            )
            .join("");

}



/* =====================================================
   USER CARD
===================================================== */

function createUserCard(user) {

    const statusHtml =
        user.blocked

            ? `
                <span class="
                    status
                    status-blocked
                ">
                    محظور
                </span>
            `

            : user.approved

                ? `
                    <span class="
                        status
                        status-approved
                    ">
                        مفعل
                    </span>
                `

                : `
                    <span class="
                        status
                        status-pending
                    ">
                        بانتظار الموافقة
                    </span>
                `;



    const watchedText =
        user.used
            ? "شاهد المحاضرة"
            : "لم يشاهد";



    return `

        <div class="user-card">

            <div class="user-top">

                <div>

                    <div class="user-name">

                        ${escapeHtml(
                            user.name ||
                            "بدون اسم"
                        )}

                    </div>

                    <div class="user-email">

                        ${escapeHtml(
                            user.email ||
                            "-"
                        )}

                    </div>

                </div>


                ${statusHtml}

            </div>



            <div class="user-details">


                <div class="detail">

                    <span>
                        UID
                    </span>

                    <strong>
                        ${escapeHtml(
                            user.uid ||
                            "-"
                        )}
                    </strong>

                </div>



                <div class="detail">

                    <span>
                        ID
                    </span>

                    <strong>
                        ${escapeHtml(
                            user.accessId ||
                            "لم يتم تعيينه"
                        )}
                    </strong>

                </div>



                <div class="detail">

                    <span>
                        الهاتف
                    </span>

                    <strong>
                        ${escapeHtml(
                            user.phone ||
                            "-"
                        )}
                    </strong>

                </div>



                <div class="detail">

                    <span>
                        القسم
                    </span>

                    <strong>
                        ${courseName(
                            user.courseId
                        )}
                    </strong>

                </div>



                <div class="detail">

                    <span>
                        المشاهدة
                    </span>

                    <strong>
                        ${watchedText}
                    </strong>

                </div>



                <div class="detail">

                    <span>
                        آخر دخول
                    </span>

                    <strong>
                        ${formatDate(
                            user.usedAt
                        )}
                    </strong>

                </div>


            </div>



            <div class="user-actions">


                ${
                    !user.approved

                    ? `

                        <button
                            class="approve-btn"
                            onclick="
                                approveUser(
                                    '${safeId(user.uid)}'
                                )
                            ">

                            ✅ تفعيل

                        </button>

                    `

                    : ""

                }



                <button
                    class="change-btn"
                    onclick="
                        changeUserId(
                            '${safeId(user.uid)}'
                        )
                    ">

                    🎫 تغيير ID

                </button>



                ${
                    !user.used

                    ? `

                        <button
                            class="reset-btn"
                            onclick="
                                resetUserWatch(
                                    '${safeId(user.uid)}'
                                )
                            ">

                            🔄 إعادة حالة المشاهدة

                        </button>

                    `

                    : `

                        <button
                            class="reset-btn"
                            onclick="
                                resetUserWatch(
                                    '${safeId(user.uid)}'
                                )
                            ">

                            🔓 السماح بمشاهدة جديدة

                        </button>

                    `

                }



                ${
                    user.blocked

                    ? `

                        <button
                            class="unblock-btn"
                            onclick="
                                toggleBlock(
                                    '${safeId(user.uid)}',
                                    false
                                )
                            ">

                            🔓 إلغاء الحظر

                        </button>

                    `

                    : `

                        <button
                            class="block-btn"
                            onclick="
                                toggleBlock(
                                    '${safeId(user.uid)}',
                                    true
                                )
                            ">

                            🚫 حظر

                        </button>

                    `

                }


            </div>


        </div>

    `;

}



/* =====================================================
   APPROVE USER
===================================================== */

async function approveUser(uid) {

    const confirmed =
        confirm(
            "هل تريد تفعيل هذا المشترك؟"
        );


    if (!confirmed) {

        return;

    }


    await adminAction(
        "approve",
        uid
    );

}



/* =====================================================
   CHANGE ID
===================================================== */

async function changeUserId(uid) {

    const user =
        allUsers.find(
            item =>
                item.uid === uid
        );


    const oldId =
        user &&
        user.accessId
            ? user.accessId
            : "";


    const newId =
        prompt(
            "اكتب الـ ID الجديد:",
            oldId
        );


    if (!newId) {

        return;

    }


    const courseId =
        prompt(
            "اكتب القسم:\nsection1 أو section2 أو section3",
            user &&
            user.courseId
                ? user.courseId
                : "section1"
        );


    if (
        courseId !== "section1" &&
        courseId !== "section2" &&
        courseId !== "section3"
    ) {

        alert(
            "القسم غير صحيح."
        );

        return;

    }


    await adminAction(
        "changeId",
        uid,
        {

            newId:
                newId.trim(),

            courseId:
                courseId

        }
    );

}



/* =====================================================
   MANUAL ID
===================================================== */

async function changeManualId() {

    const uid =
        document
            .getElementById(
                "manualUid"
            )
            .value
            .trim();


    const newId =
        document
            .getElementById(
                "manualId"
            )
            .value
            .trim();


    const courseId =
        document
            .getElementById(
                "manualCourse"
            )
            .value;


    const message =
        document
            .getElementById(
                "manualIdMessage"
            );


    if (!uid || !newId) {

        showAdminMessage(
            message,
            "اكتب UID والـ ID.",
            "error"
        );

        return;

    }


    showAdminMessage(
        message,
        "جارٍ حفظ الـ ID...",
        "loading"
    );


    try {

        await adminAction(
            "changeId",
            uid,
            {

                newId:
                    newId,

                courseId:
                    courseId

            }
        );


        showAdminMessage(
            message,
            "تم تعيين الـ ID بنجاح.",
            "success"
        );


        document
            .getElementById(
                "manualId"
            )
            .value = "";


    }

    catch (error) {

        showAdminMessage(
            message,
            error.message,
            "error"
        );

    }

}



/* =====================================================
   CREATE CUSTOMER
===================================================== */

async function createCustomer() {

    const name =
        document
            .getElementById(
                "newName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "newEmail"
            )
            .value
            .trim();


    const phone =
        document
            .getElementById(
                "newPhone"
            )
            .value
            .trim();


    const courseId =
        document
            .getElementById(
                "newCourse"
            )
            .value;


    const message =
        document
            .getElementById(
                "createMessage"
            );


    if (
        !email ||
        !phone
    ) {

        showAdminMessage(
            message,
            "البريد ورقم الهاتف مطلوبان.",
            "error"
        );

        return;

    }


    showAdminMessage(
        message,
        "جارٍ إنشاء المشترك...",
        "loading"
    );


    try {

        const response =
            await fetch(
                "/api/admin-user",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            adminToken

                    },

                    body: JSON.stringify({

                        action:
                            "create",

                        name:
                            name,

                        email:
                            email,

                        phone:
                            phone,

                        courseId:
                            courseId

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "تعذر إنشاء المشترك."
            );

        }


        showAdminMessage(
            message,
            "تم إنشاء المشترك. يمكنك الآن تعيين ID له.",
            "success"
        );


        document.getElementById(
            "newName"
        ).value = "";


        document.getElementById(
            "newEmail"
        ).value = "";


        document.getElementById(
            "newPhone"
        ).value = "";


        await loadUsers();

    }

    catch (error) {

        showAdminMessage(
            message,
            error.message,
            "error"
        );

    }

}



/* =====================================================
   BLOCK / UNBLOCK
===================================================== */

async function toggleBlock(
    uid,
    blocked
) {

    const question =
        blocked

            ? "هل تريد حظر هذا العميل؟"

            : "هل تريد إلغاء حظر هذا العميل؟";


    if (!confirm(question)) {

        return;

    }


    await adminAction(
        "block",
        uid,
        {

            blocked:
                blocked

        }
    );

}



/* =====================================================
   RESET WATCH
===================================================== */

async function resetUserWatch(uid) {

    if (
        !confirm(
            "هل تريد السماح لهذا العميل بمشاهدة المحاضرة مرة أخرى؟"
        )
    ) {

        return;

    }


    await adminAction(
        "resetWatch",
        uid
    );

}



/* =====================================================
   GENERIC ADMIN ACTION
===================================================== */

async function adminAction(
    action,
    uid,
    extra = {}
) {

    try {

        const response =
            await fetch(
                "/api/admin-user",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            adminToken

                    },

                    body: JSON.stringify({

                        action:
                            action,

                        uid:
                            uid,

                        ...extra

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "تعذر تنفيذ العملية."
            );

        }


        await loadUsers();


        return data;

    }

    catch (error) {

        alert(
            error.message
        );

        throw error;

    }

}



/* =====================================================
   SEARCH
===================================================== */

function filterUsers() {

    const search =
        document
            .getElementById(
                "searchUsers"
            )
            .value
            .trim()
            .toLowerCase();


    if (!search) {

        renderUsers(
            allUsers
        );

        return;

    }


    const filtered =
        allUsers.filter(
            user => {

                const text =
                    [

                        user.name,

                        user.email,

                        user.phone,

                        user.accessId,

                        user.uid

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    renderUsers(
        filtered
    );

}



/* =====================================================
   LOGOUT
===================================================== */

function adminLogout() {

    adminToken = "";

    sessionStorage.removeItem(
        "academyAdminToken"
    );


    location.reload();

}



/* =====================================================
   COURSE NAME
===================================================== */

function courseName(
    courseId
) {

    const courses = {

        section1:
            "القسم الأول",

        section2:
            "القسم الثاني",

        section3:
            "القسم الثالث"

    };


    return courses[
        courseId
    ] || "-";

}



/* =====================================================
   DATE
===================================================== */

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "لم يدخل بعد";

    }


    try {

        return new Date(
            timestamp
        ).toLocaleString(
            "ar-EG"
        );

    }

    catch {

        return "-";

    }

}



/* =====================================================
   SAFE HTML
===================================================== */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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
   SAFE ID
===================================================== */

function safeId(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );

}



/* =====================================================
   MESSAGE
===================================================== */

function showAdminMessage(
    element,
    text,
    type
) {

    element.textContent =
        text;

    element.className =
        "message " +
        type;

}