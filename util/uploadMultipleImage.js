const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const uniqid = require('uniqid');

module.exports = {
  uploadPhotos: async(folderPath)=> {
    function getAllFileNames(folderPath){

        try {
          // Read all files and directories in the folder
          const files = fs.readdirSync(folderPath);
      
          // Filter out only files (excluding directories)
          const fileNames = files.filter((file) => {
            const fullPath = path.join(folderPath, file);
            return fs.statSync(fullPath).isFile();
          });
          //console.log('Files in folder:', fileNames);
          return fileNames;
         
        } catch (error) {
          console.error(`Error reading folder: ${folderPath}`, error);
          return [];
        }
      }
    const fileNames = getAllFileNames(folderPath)
    return fileNames
//     console.log("fileNames", fileNames.length, fileNames)
//  const bucket = admin.storage().bucket();

//   for (const fileName of fileNames) {
//     try {
//       const localFilePath = path.join(folderPath, fileName); // Local file path
//       //const gcsFileName = `images/${fileName.replace(/\.[^/.]+$/, '.png')}`; // Save as PNG in GCS

//       // Check if the file exists locally
//       if (!fs.existsSync(localFilePath)) {
//         console.error(`File not found: ${localFilePath}`);
//         continue;
//       }

//       // Read the file data
//       const fileData = fs.readFileSync(localFilePath);

//       // Upload to GCS
//       const file = bucket.file(fileName);
//       await file.save(fileData, {
//         metadata: {
//           contentType: 'image/png',
//           metadata: {
//             firebaseStorageDownloadTokens: uniqid(),
//           },
//         },
//         public: true, // Make the file publicly accessible
//       });

//       console.log(`Uploaded: ${fileName}`);
//     } catch (error) {
//       console.error(`Failed to upload ${fileName}:`, error);
//     }
//   }
},
}
