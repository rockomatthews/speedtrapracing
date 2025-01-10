'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const [status, setStatus] = useState('loading');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Clear cart from localStorage
      localStorage.removeItem('cart');
      localStorage.removeItem('shippingInfo');
      
      // Clear cart from parent component if available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartCleared'));
      }
      
      setStatus('success');
    }
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Thank you for your order!
      </Typography>
      <Typography variant="body1" paragraph align="center">
        We'll send you a confirmation email with your order details shortly.
      </Typography>
    </Container>
  );
} 