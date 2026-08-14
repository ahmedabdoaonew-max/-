const {
    getDatabase
} = require("./_firebase");


const {
    verifyToken
} = require("./_auth");


const crypto =
    require("crypto");



function createUid() {

    return crypto
        .randomBytes(16)
        .toString("hex");

}



module.exports = async function (
    req,
    res
) {

    if (
        req.method !==
        "POST"
    ) {

        return res
            .status(405)
            .json({

                message:
                    "Method not allowed"

            });

    }


    try {

        /* =========================================
           CHECK ADMIN
        ========================================== */

        const authorization =
            req.headers.authorization ||
            "";


        const token =
            authorization.startsWith(
                "Bearer "
            )

                ? authorization.substring(
                    7
                )

                : "";


        const adminUser =
            verifyToken(
                token
            );


        if (!adminUser) {

            return res
                .status(401)
                .json({

                    message:
                        "غير مصرح."

                });

        }



        /* =========================================
           DATABASE
        ========================================== */

        const database =
            getDatabase();


        const body =
            req.body || {};


        const action =
            body.action;



        /* =========================================
           CREATE
        ========================================== */

        if (
            action ===
            "create"
        ) {

            const name =
                String(
                    body.name || ""
                ).trim();


            const email =
                String(
                    body.email || ""
                )
                .trim()
                .toLowerCase();


            const phone =
                String(
                    body.phone || ""
                ).trim();


            const courseId =
                String(
                    body.courseId ||
                    "section1"
                ).trim();



            if (
                !email ||
                !phone
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "البريد ورقم الهاتف مطلوبان."

                    });

            }



            if (
                ![
                    "section1",
                    "section2",
                    "section3"
                ].includes(
                    courseId
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "القسم غير صحيح."

                    });

            }



            /* -------------------------------------
               Check duplicate email/phone
            -------------------------------------- */

            const usersSnapshot =
                await database
                    .ref(
                        "lectureUsers"
                    )
                    .once(
                        "value"
                    );


            const users =
                usersSnapshot.val() ||
                {};


            const duplicate =
                Object.values(
                    users
                ).some(
                    user =>

                        user.email ===
                        email

                        &&

                        user.phone ===
                        phone
                );


            if (duplicate) {

                return res
                    .status(409)
                    .json({

                        message:
                            "هذا العميل موجود بالفعل."

                    });

            }



            const uid =
                createUid();



            const userData = {

                name,

                email,

                phone,

                courseId,

                accessId:
                    "",

                approved:
                    false,

                blocked:
                    false,

                used:
                    false,

                createdAt:
                    Date.now(),

                createdBy:
                    "superadmin"

            };



            await database
                .ref(
                    "lectureUsers/" +
                    uid
                )
                .set(
                    userData
                );



            return res.json({

                success:
                    true,

                uid

            });

        }



        /* =========================================
           CHECK UID
        ========================================== */

        const uid =
            String(
                body.uid || ""
            ).trim();


        if (!uid) {

            return res
                .status(400)
                .json({

                    message:
                        "UID مطلوب."

                });

        }



        const userRef =
            database.ref(
                "lectureUsers/" +
                uid
            );


        const userSnapshot =
            await userRef.once(
                "value"
            );


        if (
            !userSnapshot.exists()
        ) {

            return res
                .status(404)
                .json({

                    message:
                        "المشترك غير موجود."

                });

        }



        /* =========================================
           APPROVE
        ========================================== */

        if (
            action ===
            "approve"
        ) {

            await userRef.update({

                approved:
                    true,

                approvedAt:
                    Date.now()

            });


            return res.json({

                success:
                    true

            });

        }



        /* =========================================
           BLOCK
        ========================================== */

        if (
            action ===
            "block"
        ) {

            const blocked =
                Boolean(
                    body.blocked
                );


            await userRef.update({

                blocked:

                    blocked,

                blockedAt:

                    blocked
                        ? Date.now()
                        : null

            });


            return res.json({

                success:
                    true

            });

        }



        /* =========================================
           CHANGE ID
        ========================================== */

        if (
            action ===
            "changeId"
        ) {

            const newId =
                String(
                    body.newId ||
                    ""
                ).trim();


            const courseId =
                String(
                    body.courseId ||
                    ""
                ).trim();


            if (!newId) {

                return res
                    .status(400)
                    .json({

                        message:
                            "اكتب الـ ID الجديد."

                    });

            }


            if (
                ![
                    "section1",
                    "section2",
                    "section3"
                ].includes(
                    courseId
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "القسم غير صحيح."

                    });

            }



            /* -------------------------------------
               Make sure ID isn't used by another
               customer
            -------------------------------------- */

            const allUsersSnapshot =
                await database
                    .ref(
                        "lectureUsers"
                    )
                    .once(
                        "value"
                    );


            const allUsers =
                allUsersSnapshot.val() ||
                {};


            const idAlreadyUsed =
                Object.entries(
                    allUsers
                ).some(
                    ([otherUid, user]) =>

                        otherUid !== uid

                        &&

                        user.accessId ===
                        newId
                );


            if (
                idAlreadyUsed
            ) {

                return res
                    .status(409)
                    .json({

                        message:
                            "هذا الـ ID مستخدم بالفعل."

                    });

            }



            await userRef.update({

                accessId:
                    newId,

                courseId:
                    courseId,

                accessIdChangedAt:
                    Date.now(),

                accessIdChangedBy:
                    "superadmin"

            });


            return res.json({

                success:
                    true,

                accessId:
                    newId

            });

        }



        /* =========================================
           RESET WATCH
        ========================================== */

        if (
            action ===
            "resetWatch"
        ) {

            await userRef.update({

                used:
                    false,

                usedAt:
                    null,

                lastDevice:
                    null,

                lastIp:
                    null,

                resetAt:
                    Date.now(),

                resetBy:
                    "superadmin"

            });


            return res.json({

                success:
                    true

            });

        }



        return res
            .status(400)
            .json({

                message:
                    "العملية غير معروفة."

            });

    }

    catch (error) {

        console.error(error);


        return res
            .status(500)
            .json({

                message:
                    "حدث خطأ في الخادم."

            });

    }

};