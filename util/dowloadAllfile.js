const { bucket } = require('./firebasebucket');
const fs = require('fs');
const path = require('path');

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
