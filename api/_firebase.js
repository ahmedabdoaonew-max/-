const admin = require("firebase-admin");


function getFirebase() {

    if (!admin.apps.length) {

        if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {

            throw new Error(
                "FIREBASE_SERVICE_ACCOUNT_JSON غير موجود"
            );

        }


        if (!process.env.FIREBASE_DATABASE_URL) {

            throw new Error(
                "FIREBASE_DATABASE_URL غير موجود"
            );

        }


        const serviceAccount =
            JSON.parse(
                process.env.FIREBASE_SERVICE_ACCOUNT_JSON
            );


        admin.initializeApp({

            credential:
                admin.credential.cert(
                    serviceAccount
                ),

            databaseURL:
                process.env.FIREBASE_DATABASE_URL

        });

    }


    return admin;
}



function getDatabase() {

    return getFirebase()
        .database();

}


module.exports = {

    admin,

    getFirebase,

    getDatabase

};