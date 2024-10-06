'use client';

import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import darkTheme from '../theme';

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}