const admin = require("firebase-admin");
//const serviceAccount = require("./path/to/your-service-account-file.json");
const fireBaseJson={
  "type": "service_account",
  "project_id": process.env.FIRBASE_PROJECT_ID,
  "private_key_id": process.env.FIRBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIRBASE_PRIVATE_KEY,
  "client_email": process.env.FIRBASE_CLIENT_EMAIL,
  "client_id": process.env.FIRBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIRBASE_CLIENT_CERT_URL ,
  "universe_domain": "googleapis.com"
}

const serviceAccount = JSON.stringify()

admin.initializeApp({
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": process.env.FIRBASE_PROJECT_ID,
    "private_key_id": process.env.FIRBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIRBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIRBASE_CLIENT_EMAIL,
    "client_id": process.env.FIRBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIRBASE_CLIENT_CERT_URL ,
    "universe_domain": "googleapis.com"
  }),
  storageBucket: `${process.env.FIRBASE_PROJECT_ID}.appspot.com`
});

const bucket = admin.storage().bucket();
module.exports = { bucket };
