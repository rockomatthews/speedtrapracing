require('dotenv').config({ path: '.env.local' });
const braintree = require('braintree');

async function verifyCredentials() {
  console.log('Verifying Braintree credentials...');
  
  // Check credential formats
  const credentials = {
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY
  };

  Object.entries(credentials).forEach(([key, value]) => {
    console.log(`${key}:`, {
      length: value?.length,
      format: value?.match(/^[a-zA-Z0-9]+$/) ? 'valid' : 'invalid',
      firstChar: value?.[0],
      lastChar: value?.[value.length - 1]
    });
  });

  // Test gateway connection
  const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: credentials.merchantId,
    publicKey: credentials.publicKey,
    privateKey: credentials.privateKey
  });

  try {
    const result = await gateway.clientToken.generate({});
    console.log('Successfully generated token:', result.clientToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('Failed to generate token:', {
      message: error.message,
      type: error.type
    });
    return false;
  }
}

verifyCredentials();