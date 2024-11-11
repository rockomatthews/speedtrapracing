const braintree = require('braintree');
require('dotenv').config({ path: '.env.local' });

async function testBraintreeAuth() {
  try {
    console.log('Testing Braintree Authentication');
    console.log('Environment variables present:', {
      merchantId: !!process.env.BRAINTREE_MERCHANT_ID,
      publicKey: !!process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: !!process.env.BRAINTREE_PRIVATE_KEY,
      environment: process.env.BRAINTREE_ENVIRONMENT || 'sandbox'
    });

    const gateway = new braintree.BraintreeGateway({
      environment: process.env.BRAINTREE_ENVIRONMENT === 'production' 
        ? braintree.Environment.Production 
        : braintree.Environment.Sandbox,
      merchantId: process.env.BRAINTREE_MERCHANT_ID,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });

    console.log('Gateway created, testing connection...');

    const result = await gateway.clientToken.generate({});

    console.log('Success! Generated client token:', result.clientToken.substring(0, 50) + '...');
  } catch (error) {
    console.error('Authentication test failed:', {
      message: error.message,
      type: error.type,
      stack: error.stack
    });
  }
}

testBraintreeAuth();