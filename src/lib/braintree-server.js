import braintree from 'braintree';

// Utility function to clean credentials
const sanitizeCredential = (credential) => {
  if (!credential) return null;
  // Remove any whitespace and unwanted characters
  return credential.trim().replace(/['"]/g, '');
};

// Create and export the gateway instance
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Explicitly set to Sandbox
  merchantId: sanitizeCredential(process.env.BRAINTREE_MERCHANT_ID),
  publicKey: sanitizeCredential(process.env.BRAINTREE_PUBLIC_KEY),
  privateKey: sanitizeCredential(process.env.BRAINTREE_PRIVATE_KEY)
});

export default gateway;

// Utility function to validate the gateway
export async function validateGateway() {
  try {
    const result = await gateway.clientToken.generate({});
    return {
      isValid: true,
      token: result.clientToken
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      type: error.type,
      details: {
        merchantIdLength: process.env.BRAINTREE_MERCHANT_ID?.length,
        publicKeyLength: process.env.BRAINTREE_PUBLIC_KEY?.length,
        privateKeyLength: process.env.BRAINTREE_PRIVATE_KEY?.length,
      }
    };
  }
}