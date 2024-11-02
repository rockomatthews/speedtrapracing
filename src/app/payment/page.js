'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import PayPalIcon from '@mui/icons-material/AccountBalanceWallet';
import VenmoIcon from '@mui/icons-material/AccountBalance';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();


  useEffect(() => {
    const storedBookingDetails = localStorage.getItem('bookingDetails');
    if (storedBookingDetails) {
      setBookingDetails(JSON.parse(storedBookingDetails));
    } else {
      setError("No booking details found. Please start your booking process again.");
    }

  }, []);

  const handleMethodClick = async (method) => {
    setSelectedMethod(method);
    setLoading(true);
    setError(null);
    
    // Generate a unique ID for the new booking document
    const newBookingId = `booking_${new Date().toISOString().slice(0, 10)}`; // Using ISO date format (YYYY-MM-DD)
    const userDocRef = doc(db, 'bookings', newBookingId);

    try {
        // Always create a new document

        if (method === 'Debit/Credit' || method === 'Apple Pay') {
            await handleStripeCheckout(method);
        } else if (method === 'PayPal') {
            console.log('PayPal checkout not implemented yet');
            setError('PayPal checkout is not implemented yet');
        } else if (method === 'Venmo') {
            console.log('Venmo checkout not implemented yet');
            setError('Venmo checkout is not implemented yet');
        } else if (method === 'test') {
            await setDoc(userDocRef, bookingDetails);
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
        height: '100vh',
        backgroundImage: `url('/loginBackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: '#fff',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 20px',
          borderRadius: '5px',
          marginBottom: '20px',
        }}
      >
        Select Payment Method
      </Typography>

      {bookingDetails && (
        <Typography variant="h5" sx={{ color: '#fff', marginBottom: '10px' }}>
          TOTAL: ${bookingDetails.totalPrice.toFixed(2)}
        </Typography>
      )}

      <Button
        onClick={() => handleMethodClick('Debit/Credit')}
        startIcon={<CreditCardIcon />}
        fullWidth
        sx={{
          backgroundColor: '#333',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
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
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
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
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
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
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        Buy with Apple Pay
      </Button>

      <Button
        onClick={() => handleMethodClick('test')}
        fullWidth
        sx={{
          backgroundColor: '#000',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
          marginBottom: '15px',
          maxWidth: '350px',
          textTransform: 'none',
        }}
      >
        test pay
      </Button>

      {loading && (
        <CircularProgress sx={{ color: '#fff', marginTop: '20px' }} />
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payment;