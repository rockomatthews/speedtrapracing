'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import PayPalIcon from '@mui/icons-material/AccountBalanceWallet';
import VenmoIcon from '@mui/icons-material/AccountBalance';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const storedBookingDetails = localStorage.getItem('bookingDetails');
    if (storedBookingDetails) {
      setBookingDetails(JSON.parse(storedBookingDetails));
    } else {
      setError("No booking details found. Please start your booking process again.");
    }
  }, []);

  const formatBookingDetails = (details) => {
    if (!details) return null;
    
    const date = new Date(details.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return (
      <Card 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '350px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <CardContent>
          <Typography variant={isMobile ? 'h6' : 'h5'} gutterBottom sx={{ fontWeight: 'bold' }}>
            Booking Summary
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
            <CalendarTodayIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">
              {date}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
            <AccessTimeIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">
              Time Slots: {details.timeSlots.join(', ')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <GroupIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">
              Group Size: {details.groupSize} {details.groupSize === 1 ? 'person' : 'people'}
            </Typography>
          </Box>
          
          <Typography 
            variant={isMobile ? 'h6' : 'h5'} 
            sx={{ 
              fontWeight: 'bold', 
              color: '#2196F3',
              borderTop: '1px solid rgba(0, 0, 0, 0.12)',
              paddingTop: 2
            }}
          >
            Total: ${details.totalPrice.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const handleMethodClick = async (method) => {
    setSelectedMethod(method);
    setLoading(true);
    setError(null);

    try {
      if (method === 'Debit/Credit' || method === 'Apple Pay') {
        await handleStripeCheckout(method);
      } else if (method === 'PayPal') {
        console.log('PayPal checkout not implemented yet');
        setError('PayPal checkout is not implemented yet');
      } else if (method === 'Venmo') {
        console.log('Venmo checkout not implemented yet');
        setError('Venmo checkout is not implemented yet');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async (paymentMethod) => {
    if (!bookingDetails) {
      throw new Error('Booking details not available');
    }

    const stripe = await stripePromise;
    
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...bookingDetails,
        paymentMethod,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const session = await response.json();

    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url('/loginBackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '16px' : '20px',
      }}
    >
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        sx={{
          color: '#fff',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: isMobile ? '8px 16px' : '10px 20px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        Select Payment Method
      </Typography>

      {bookingDetails && formatBookingDetails(bookingDetails)}

      <Box
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        <Button
          onClick={() => handleMethodClick('Debit/Credit')}
          startIcon={<CreditCardIcon />}
          fullWidth
          sx={{
            backgroundColor: '#333',
            color: '#fff',
            fontWeight: 'bold',
            padding: isMobile ? '12px 16px' : '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#444',
            },
          }}
        >
          Debit or Credit Card
        </Button>

        <Button
          onClick={() => handleMethodClick('PayPal')}
          startIcon={<PayPalIcon />}
          fullWidth
          sx={{
            backgroundColor: '#FFC107',
            color: '#000',
            fontWeight: 'bold',
            padding: isMobile ? '12px 16px' : '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#FFB000',
            },
          }}
        >
          PayPal
        </Button>

        <Button
          onClick={() => handleMethodClick('Venmo')}
          startIcon={<VenmoIcon />}
          fullWidth
          sx={{
            backgroundColor: '#1DA1F2',
            color: '#fff',
            fontWeight: 'bold',
            padding: isMobile ? '12px 16px' : '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#1A91DA',
            },
          }}
        >
          Venmo
        </Button>

        <Button
          onClick={() => handleMethodClick('Apple Pay')}
          startIcon={<AppleIcon />}
          fullWidth
          sx={{
            backgroundColor: '#000',
            color: '#fff',
            fontWeight: 'bold',
            padding: isMobile ? '12px 16px' : '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#222',
            },
          }}
        >
          Buy with Apple Pay
        </Button>
      </Box>

      {loading && (
        <CircularProgress 
          sx={{ 
            color: '#fff', 
            marginTop: '20px',
            width: isMobile ? '30px' : '40px',
            height: isMobile ? '30px' : '40px'
          }} 
        />
      )}

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'left' 
        }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            maxWidth: isMobile ? '100%' : '400px'
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payment;