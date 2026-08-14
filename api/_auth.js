const crypto = require("crypto");


function getSecret() {

    const secret =
        process.env.SUPER_ADMIN_PASSWORD;


    if (!secret) {

        throw new Error(
            "SUPER_ADMIN_PASSWORD غير موجود"
        );

    }


    return secret;

}



/* =====================================================
   CREATE TOKEN
===================================================== */

function createToken() {

    const payload = {

        role:
            "superadmin",

        createdAt:
            Date.now(),

        expiresAt:
            Date.now() +
            (
                8 *
                60 *
                60 *
                1000
            )

    };


    const data =
        Buffer
            .from(
                JSON.stringify(
                    payload
                )
            )
            .toString(
                "base64url"
            );


    const signature =
        crypto
            .createHmac(
                "sha256",
                getSecret()
            )
            .update(data)
            .digest(
                "base64url"
            );


    return (
        data +
        "." +
        signature
    );

}



/* =====================================================
   VERIFY TOKEN
===================================================== */

function verifyToken(
    token
) {

    try {

        if (!token) {

            return null;

        }


        const parts =
            token.split(".");


        if (
            parts.length !== 2
        ) {

            return null;

        }


        const data =
            parts[0];


        const signature =
            parts[1];


        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    getSecret()
                )
                .update(data)
                .digest(
                    "base64url"
                );


        if (
            signature.length !==
            expectedSignature.length
        ) {

            return null;

        }


        if (
            !crypto.timingSafeEqual(
                Buffer.from(
                    signature
                ),
                Buffer.from(
                    expectedSignature
                )
            )
        ) {

            return null;

        }


        const payload =
            JSON.parse(
                Buffer
                    .from(
                        data,
                        "base64url"
                    )
                    .toString()
            );


        if (
            !payload.expiresAt ||
            payload.expiresAt <
            Date.now()
        ) {

            return null;

        }


        if (
            payload.role !==
            "superadmin"
        ) {

            return null;

        }


        return payload;

    }

    catch {

        return null;

    }

}


module.exports = {

    createToken,

    verifyToken

};