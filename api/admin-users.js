const {
    getDatabase
} = require("./_firebase");


const {
    verifyToken
} = require("./_auth");



module.exports = async function (
    req,
    res
) {

    try {

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
                        "غير مصرح لك بالدخول."

                });

        }



        const database =
            getDatabase();


        const snapshot =
            await database
                .ref(
                    "lectureUsers"
                )
                .once(
                    "value"
                );


        const data =
            snapshot.val() || {};


        const users =
            Object.entries(
                data
            ).map(
                ([uid, user]) => ({

                    uid,

                    ...user

                })
            );


        return res.json({

            success:
                true,

            users

        });

    }

    catch (error) {

        console.error(error);


        return res
            .status(500)
            .json({

                message:
                    "تعذر تحميل المشتركين."

            });

    }

};