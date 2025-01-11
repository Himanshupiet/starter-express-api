const axios = require('axios');
const FormData = require('form-data');

const removeBg = async (reqData) => {
  try {
    let apiKey = process.env.CLIP_DROP_API_KEY

    const form = new FormData();
    form.append('image_file', reqData.files.image.data, `image_${Math.floor(100000 + Math.random() * 900000)}.jpg`); // 'image.jpg' is the default file name, adjust if needed.
    // console.log('Form Headers:', form.getHeaders());
    const response = await axios.post('https://clipdrop-api.co/remove-background/v1', form, {
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders(),
      },
      responseType: 'arraybuffer', // Return binary data
    });

    return Buffer.from(response.data); // Get processed image as buffer

  } catch (error) {
    console.error('Error processing image:', error.message , error);
    return reqData.files.image.data
  }
};

module.exports = removeBg;
