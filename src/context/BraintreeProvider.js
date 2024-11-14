// src/context/BraintreeProvider.js
'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
import Script from 'next/script';

// Create the context
const BraintreeContext = createContext(null);

// Create the hook to use Braintree context
export function useBraintree() {  // Make sure to export this!
  const context = useContext(BraintreeContext);
  if (!context) {
    throw new Error('useBraintree must be used within a BraintreeProvider');
  }
  return context;
}

// Export the provider component
export function BraintreeProvider({ children }) {
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
  const scriptLoadCounter = useRef(0);

  const handleScriptLoad = () => {
    scriptLoadCounter.current += 1;
    if (scriptLoadCounter.current === 2) {
      setIsScriptsLoaded(true);
    }
  };

  return (
    <BraintreeContext.Provider value={{ isScriptsLoaded }}>
      <Script 
        src="https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={(e) => console.error('Dropin script error:', e)}
      />
      
      <Script
        src="https://js.braintreegateway.com/web/3.92.1/js/client.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={(e) => console.error('Client script error:', e)}
      />

      {children}
    </BraintreeContext.Provider>
  );
}

// You can also export the context if needed
export { BraintreeContext };