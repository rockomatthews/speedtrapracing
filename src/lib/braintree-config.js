// src/lib/braintree-config.js

// Force production environment
const ENVIRONMENT = 'production';

// Client-side configuration
export const BRAINTREE_CONFIG = {
  // Core configuration
  environment: ENVIRONMENT,
  merchantId: process.env.NEXT_PUBLIC_BRAINTREE_MERCHANT_ID,

  // API paths
  API_ENDPOINTS: {
    TOKEN: '/api/braintree/token',
    PROCESS_PAYMENT: '/api/braintree/process-payment',
  },

  // Drop-in configuration
  dropinConfig: {
    container: '#dropin-container',
    
    // PayPal configuration
    paypal: {
      flow: 'checkout',
      amount: '0.00', // This will be updated dynamically
      currency: 'USD',
      buttonStyle: {
        color: 'blue',
        shape: 'rect',
        size: 'responsive'
      }
    },
    
    // Venmo configuration 
    venmo: {
      allowNewBrowserTab: false,
      paymentMethodUsage: 'multi_use'
    },

    // Card configuration
    card: {
      vault: {
        allowVaulting: true
      },
      cardholderName: {
        required: true
      }
    }
  }
};

// Server-side gateway configuration
export const GATEWAY_CONFIG = {
  environment: ENVIRONMENT,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
  merchantAccountId: process.env.BRAINTREE_MERCHANT_ACCOUNT_ID
};