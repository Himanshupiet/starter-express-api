const { StandardCheckoutClient, Env } = require('pg-sdk-node');
require('dotenv').config();

class PhonePeClient {
  constructor() {
    if (!PhonePeClient.instance) {
      this.client = StandardCheckoutClient.getInstance(
        process.env.PHONEPE_CLIENT_ID,
        process.env.PHONEPE_CLIENT_SECRET,
        parseInt(process.env.PHONEPE_CLIENT_VERSION),
        process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX
      );
      PhonePeClient.instance = this;
    }
    return PhonePeClient.instance;
  }

  getClient() {
    return this.client;
  }
}

const phonePeClient = new PhonePeClient();
Object.freeze(phonePeClient);

module.exports = phonePeClient;