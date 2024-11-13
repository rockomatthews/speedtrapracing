// BraintreeScripts.js - JUST the essentials
'use client';

import Script from 'next/script';

export default function BraintreeScripts() {
  return (
    <>
      {/* Only the absolute necessities for credit card */}
      <Script 
        src="https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js"
        strategy="beforeInteractive"
        id="braintree-dropin-script"
      />
    </>
  );
}

// Update initializeBraintree to be credit-card only:
const initializeBraintree = async () => {
  try {
    setIsLoading(true);
    setErrorMessage(null);

    const tokenResponse = await fetch('/api/braintree/token');
    const data = await tokenResponse.json();

    if (!data.clientToken) {
      throw new Error('Failed to get client token');
    }

    // Super simple configuration - just credit card
    const instance = await window.braintree.dropin.create({
      authorization: data.clientToken,
      container: '#braintree-payment-container',
      // ONLY credit card, nothing else
      paypal: false,
      venmo: false,
      googlePay: false,
      applePay: false,
      card: {
        vault: false // Don't even try to vault
      }
    });

    setBraintreeInstance(instance);
    setIsLoading(false);

  } catch (error) {
    console.error('Braintree initialization error:', error);
    setErrorMessage(error.message);
    setIsLoading(false);
  }
};