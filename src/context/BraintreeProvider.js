'use client';

import { createContext, useContext, useState } from 'react';

const BraintreeContext = createContext();

export function BraintreeProvider({ children }) {
  const [tokenData, setTokenData] = useState(null);

  const getToken = async () => {
    // Only fetch if we don't have it
    if (!tokenData) {
      const response = await fetch('/api/braintree/token');
      const data = await response.json();
      setTokenData(data);
    }
    return tokenData;
  };

  return (
    <BraintreeContext.Provider value={{ tokenData, getToken }}>
      {children}
    </BraintreeContext.Provider>
  );
}

export function useBraintree() {
  return useContext(BraintreeContext);
}