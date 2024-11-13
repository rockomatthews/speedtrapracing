import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

export const braintreeService = {
  async generateToken() {
    try {
      const response = await gateway.clientToken.generate();
      return response.clientToken;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }
};