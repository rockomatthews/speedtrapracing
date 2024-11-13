// src/lib/braintree-service.js

import braintree from 'braintree';

class BraintreeService {
  constructor() {
    this.gateway = null;
  }

  initialize() {
    if (this.gateway) return this.gateway;
    
    this.gateway = new braintree.BraintreeGateway({
      environment: process.env.BRAINTREE_ENVIRONMENT === 'production' 
        ? braintree.Environment.Production 
        : braintree.Environment.Sandbox,
      merchantId: process.env.BRAINTREE_MERCHANT_ID,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });

    return this.gateway;
  }

  async generateToken() {
    try {
      const gateway = this.initialize();
      const response = await gateway.clientToken.generate({
        // Only include merchantAccountId if it's set
        ...(process.env.BRAINTREE_MERCHANT_ACCOUNT_ID && {
          merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID
        })
      });

      return response.clientToken;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const braintreeService = new BraintreeService();