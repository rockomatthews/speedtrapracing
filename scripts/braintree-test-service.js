const braintree = require('braintree');
require('dotenv').config({ path: '.env.local' });

class BraintreeTestService {
  constructor() {
    this.gateway = null;
    this.initialize();
  }

  initialize() {
    if (!this.gateway) {
      this.gateway = new braintree.BraintreeGateway({
        environment: braintree.Environment.Production, // Changed to Production
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAINTREE_PRIVATE_KEY
      });
    }
    return this.gateway;
  }

  async generateClientToken(options = {}) {
    try {
      const result = await this.gateway.clientToken.generate(options);
      return result.clientToken;
    } catch (error) {
      console.error('Client token generation error:', error);
      throw error;
    }
  }

  async verifyGateway() {
    try {
      await this.gateway.clientToken.generate({});
      return true;
    } catch (error) {
      console.error('Gateway verification failed:', error);
      return false;
    }
  }
}

module.exports = new BraintreeTestService();