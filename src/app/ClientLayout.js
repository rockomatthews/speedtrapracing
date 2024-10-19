'use client';

import React from 'react';
import usePeriodicReAuth from '../hooks/usePeriodicReAuth';

function ClientLayout({ children }) {
  usePeriodicReAuth();

  return <>{children}</>;
}

export default ClientLayout;