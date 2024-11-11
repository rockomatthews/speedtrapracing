import braintree from 'braintree';

class BraintreeService {
  constructor() {
    this.gateway = null;
    this.initialize();
  }

  initialize() {
    if (!this.gateway) {
      this.gateway = new braintree.BraintreeGateway({
        environment: braintree.Environment.Production,
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAINTREE_PRIVATE_KEY
      });
    }
    return this.gateway;
  }

  async generateToken() {
    try {
      if (!this.gateway) {
        this.initialize();
      }

      // Get basic client token for PayPal
      const result = await this.gateway.clientToken.generate({
        merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID
      });

      if (!result || !result.clientToken) {
        throw new Error('Failed to generate client token');
      }

      return result.clientToken;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  async createTransaction(paymentMethodNonce, amount) {
    try {
      const result = await this.gateway.transaction.sale({
        amount,
        paymentMethodNonce,
        merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID,
        options: {
          submitForSettlement: true
        }
      });
      return result;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }
}

export const braintreeService = new BraintreeService();