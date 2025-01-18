const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp'); // Import Sharp for image processing

const removeBg = async (reqData) => {
  let apiKey = process.env.CLIP_DROP_API_KEY1;
  let apiKey2 = process.env.CLIP_DROP_API_KEY2;

  const form = new FormData();
  form.append('image_file', reqData.files.image.data, `image_${Math.floor(100000 + Math.random() * 900000)}.jpg`);

  const makeRequest = async (key) => {
    return await axios.post('https://clipdrop-api.co/remove-background/v1', form, {
      headers: {
        'x-api-key': key,
        'transparency_handling': 'discard_alpha_layer',
        ...form.getHeaders(),
      },
      responseType: 'arraybuffer',
    });
  };

  const compressImage = async (buffer) => {
    let quality = 80; // Start with high quality
    let compressedBuffer = buffer;

    while (compressedBuffer.length > 100 * 1024 && quality > 10) { // 100 KB = 100 * 1024 bytes
      compressedBuffer = await sharp(buffer)
        .jpeg({ quality })
        .toBuffer();
      quality -= 10; // Reduce quality incrementally
    }

    return compressedBuffer;
  };

  try {
    // Try with the first API key
    const response = await makeRequest(apiKey);
    if (response.data) {
      const compressedData = response.data //await compressImage(Buffer.from(response.data));
      return compressedData;
    }
  } catch (error1) {
    console.error('Error with first API key:', error1.message);

    try {
      // Try with the second API key
      const response = await makeRequest(apiKey2);
      if (response.data) {
        const compressedData = await compressImage(Buffer.from(response.data));
        return compressedData;
      }
    } catch (error2) {
      console.error('Error with second API key:', error2.message);

      // Return the original image in case of both failures
      return reqData.files.image.data;
    }
  }
};

module.exports = removeBg;
