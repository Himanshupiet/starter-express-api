const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert({
//         "type": "service_account",
//         "project_id": process.env.FIRBASE_PROJECT_ID,
//         "private_key_id": process.env.FIRBASE_PRIVATE_KEY_ID,
//         "private_key": process.env.FIRBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//         "client_email": process.env.FIRBASE_CLIENT_EMAIL,
//         "client_id": process.env.FIRBASE_CLIENT_ID,
//         "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//         "token_uri": "https://oauth2.googleapis.com/token",
//         "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//         "client_x509_cert_url": process.env.FIRBASE_CLIENT_CERT_URL ,
//         "universe_domain": "googleapis.com"
//   }),
//   storageBucket: `${process.env.FIRBASE_PROJECT_ID}.appspot.com`,
// });
// Initialize Firebase Admin
// admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//     storageBucket: `${process.env.FIRBASE_PROJECT_ID}.appspot.com`,
//   });

const bucket = admin.storage().bucket();

// Function to download all images
module.exports = {
  // to dowload unccoment in index file // dowload in util folder
 downloadAllImages: async (directoryPath) => {
  try {
    const files = await bucket.getFiles({ prefix: directoryPath });
    const downloadPromises = files[0].map(async (file) => {
      const fileName = path.basename(file.name);
      const localFilePath = path.join(__dirname, 'Class-1', fileName); // nmae chenge of folder class1 or class3
      //console.log("localFilePath", localFilePath)

      // Ensure the downloads folder exists
      if (!fs.existsSync(path.dirname(localFilePath))) {
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
      }

      // Download file
      await file.download({ destination: localFilePath });
      console.log(`Downloaded ${fileName} to ${localFilePath}`);
    });

    await Promise.all(downloadPromises);
    console.log('All files downloaded successfully');
  } catch (err) {
    console.error('Error downloading files:', err.message);
  }
}
}

// Specify the folder to download (use an empty string for the root directory)
// downloadAllImages('');
