const {
    createToken
} = require("./_auth");


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

        const {
            password
        } = req.body || {};


        if (!password) {

            return res
                .status(400)
                .json({

                    message:
                        "أدخل كلمة المرور."

                });

        }


        if (
            password !==
            process.env.SUPER_ADMIN_PASSWORD
        ) {

            return res
                .status(401)
                .json({

                    message:
                        "كلمة المرور غير صحيحة."

                });

        }


        const token =
            createToken();


        return res.json({

            success:
                true,

            token:
                token

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