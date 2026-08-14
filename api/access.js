const admin =
    require("firebase-admin");


if (!admin.apps.length) {

    const raw =
        process.env
            .FIREBASE_SERVICE_ACCOUNT_JSON;


    if (!raw) {

        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT_JSON is missing"
        );

    }


    admin.initializeApp({

        credential:
            admin.credential.cert(
                JSON.parse(raw)
            ),

        databaseURL:
            process.env
                .FIREBASE_DATABASE_URL

    });

}


const db =
    admin.database();


function norm(value) {

    return String(
        value ?? ""
    ).trim();

}


function emailNorm(value) {

    return norm(value)
        .toLowerCase();

}


function paid(user) {

    return (

        user?.paid === true ||

        user?.paymentStatus ===
            "paid" ||

        user?.paymentStatus ===
            "مدفوع"

    );

}


function allowed(
    user,
    courseId,
    lectureNumber
) {

    const permissions =
        user?.permissions?.[
            courseId
        ];


    if (
        permissions === true ||
        permissions === "all"
    ) {

        return true;

    }


    if (
        Array.isArray(
            permissions
        )
    ) {

        return (

            permissions.includes(
                lectureNumber
            ) ||

            permissions.includes(
                String(
                    lectureNumber
                )
            )

        );

    }


    return false;

}


module.exports =
async function (
    req,
    res
) {

    if (
        req.method !== "POST"
    ) {

        return res
            .status(405)
            .json({

                message:
                    "Method Not Allowed"

            });

    }


    try {

        const body =
            req.body || {};


        const email =
            emailNorm(
                body.email
            );


        const phone =
            norm(
                body.phone
            );


        const accessId =
            norm(
                body.accessId
            );


        const courseId =
            norm(
                body.courseId
            );


        const lectureNumber =
            Number(
                body.lectureNumber
            );


        if (
            !email ||
            !phone ||
            !accessId ||
            !courseId ||
            !lectureNumber
        ) {

            return res
                .status(400)
                .json({

                    message:
                        "جميع بيانات الدخول مطلوبة."

                });

        }


        if (

            ![
                "section1",
                "section2",
                "section3"
            ].includes(
                courseId
            ) ||

            !Number.isInteger(
                lectureNumber
            ) ||

            lectureNumber < 1 ||

            lectureNumber > 10

        ) {

            return res
                .status(400)
                .json({

                    message:
                        "القسم أو رقم المحاضرة غير صحيح."

                });

        }


        const snapshot =
            await db
                .ref("users")
                .once("value");


        const users =
            snapshot.val() || {};


        let user = null;


        for (
            const uid
            of Object.keys(users)
        ) {

            const u =
                users[uid];


            if (

                u &&

                emailNorm(
                    u.email
                ) === email &&

                norm(
                    u.phone
                ) === phone &&

                norm(
                    u.accessId
                ) === accessId

            ) {

                user = {

                    ...u,

                    uid

                };

                break;

            }

        }


        if (!user) {

            return res
                .status(401)
                .json({

                    message:
                        "بيانات الدخول غير صحيحة."

                });

        }


        if (!paid(user)) {

            return res
                .status(403)
                .json({

                    message:
                        "لا يمكنك الدخول لأن الاشتراك لم يتم تأكيد دفعه بعد."

                });

        }


        if (
            !allowed(
                user,
                courseId,
                lectureNumber
            )
        ) {

            return res
                .status(403)
                .json({

                    message:
                        "ليس لديك صلاحية للوصول إلى هذه المحاضرة."

                });

        }


        const lectureSnapshot =
            await db
                .ref(
                    `lectures/${courseId}/lecture${lectureNumber}`
                )
                .once("value");


        const lecture =
            lectureSnapshot.val();


        if (!lecture) {

            return res
                .status(404)
                .json({

                    message:
                        "هذه المحاضرة غير موجودة."

                });

        }


        if (
            lecture.active === false
        ) {

            return res
                .status(403)
                .json({

                    message:
                        "هذه المحاضرة غير متاحة حاليًا."

                });

        }


        if (
            !lecture.videoUrl
        ) {

            return res
                .status(404)
                .json({

                    message:
                        "لم يتم إضافة رابط الفيديو لهذه المحاضرة بعد."

                });

        }


        /*
         * منع المشاهدة الثانية
         */

        const viewRef =
            db.ref(
                `views/${accessId}/${courseId}/lecture${lectureNumber}`
            );


        const viewSnapshot =
            await viewRef.once(
                "value"
            );


        const oldView =
            viewSnapshot.val();


        if (
            oldView?.viewed === true
        ) {

            return res
                .status(403)
                .json({

                    message:
                        "لقد شاهدت هذه المحاضرة من قبل ولا يمكن فتحها مرة أخرى."

                });

        }


        /*
         * تسجيل المشاهدة
         */

        await viewRef.set({

            viewed: true,

            viewedAt:
                new Date()
                    .toISOString(),

            email:
                user.email ||
                email,

            uid:
                user.uid,

            courseId:
                courseId,

            lectureNumber:
                lectureNumber

        });


        return res
            .status(200)
            .json({

                success: true,

                title:
                    lecture.title ||
                    `المحاضرة ${lectureNumber}`,

                description:
                    lecture.description ||
                    "",

                videoUrl:
                    lecture.videoUrl

            });

    }

    catch (error) {

        console.error(error);


        return res
            .status(500)
            .json({

                message:
                    "حدث خطأ داخلي في الخادم."

            });

    }

};