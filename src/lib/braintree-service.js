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

      console.log('Gateway initialized with credentials:', {
        environment: 'production',
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        hasPublicKey: Boolean(process.env.BRAINTREE_PUBLIC_KEY),
        hasPrivateKey: Boolean(process.env.BRAINTREE_PRIVATE_KEY)
      });
    }
    return this.gateway;
  }

  async generateToken() {
    try {
      if (!this.gateway) {
        this.initialize();
      }

      // Simplest possible token generation
      const result = await this.gateway.clientToken.generate({
        merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID
      });
      
      console.log('Raw Braintree Response:', result);

      if (!result || !result.clientToken) {
        throw new Error('Failed to generate client token');
      }

      return result.clientToken;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  async createTransaction(paymentMethodNonce, amount, options = {}) {
    if (!this.gateway) {
      this.initialize();
    }

    const transactionRequest = {
      amount,
      paymentMethodNonce,
      merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID,
      options: {
        submitForSettlement: true,
        ...options
      }
    };

    try {
      const result = await this.gateway.transaction.sale(transactionRequest);
      return result;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }
}

export const braintreeService = new BraintreeService();