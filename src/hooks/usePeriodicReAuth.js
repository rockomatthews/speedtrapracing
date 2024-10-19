'use client';

import { useEffect } from 'react';
import axios from 'axios';

function usePeriodicReAuth(interval = 5 * 60 * 1000) {
  useEffect(() => {
    const reAuth = async () => {
      try {
        await axios.post('/api/auth/refresh');
      } catch (error) {
        console.error('Re-authentication failed:', error);
      }
    };

    const intervalId = setInterval(reAuth, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
}

export default usePeriodicReAuth;