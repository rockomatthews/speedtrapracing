'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Script from 'next/script';

const BraintreeContext = createContext();

export function BraintreeProvider({ children }) {
  const [braintreeLoaded, setBraintreeLoaded] = useState(false);

  useEffect(() => {
    // Check if Braintree script is loaded
    if (window.braintree) {
      setBraintreeLoaded(true);
    }
  }, []);

  return (
    <BraintreeContext.Provider value={{ braintreeLoaded }}>
      {children}
    </BraintreeContext.Provider>
  );
}

export function useBraintree() {
  const context = useContext(BraintreeContext);
  if (context === undefined) {
    throw new Error('useBraintree must be used within a BraintreeProvider');
  }
  return context;
}