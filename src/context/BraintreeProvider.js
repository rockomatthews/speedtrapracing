// src/context/BraintreeProvider.js
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Script from 'next/script';

const BraintreeContext = createContext(undefined);

export function BraintreeProvider({ children }) {
  const [tokenData, setTokenData] = useState(null);
  const [isTokenFetching, setIsTokenFetching] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const scriptLoadCounter = useRef(0);

  const handleScriptLoad = () => {
    scriptLoadCounter.current += 1;
    if (scriptLoadCounter.current === 2) { // Both scripts loaded
      setScriptsLoaded(true);
    }
  };

  const getToken = async () => {
    if (isTokenFetching || !scriptsLoaded) return null;
    
    try {
      setIsTokenFetching(true);
      const response = await fetch('/api/braintree/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.clientToken) {
        throw new Error('Invalid token response format');
      }

      setTokenData(data);
      return data;

    } catch (error) {
      console.error('Token fetch error:', error);
      setTokenData(null);
      throw error;
    } finally {
      setIsTokenFetching(false);
    }
  };

  return (
    <BraintreeContext.Provider value={{ tokenData, getToken, scriptsLoaded }}>
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

export function useBraintree() {
  const context = useContext(BraintreeContext);
  if (!context) {
    throw new Error('useBraintree must be used within a BraintreeProvider');
  }
  return context;
}