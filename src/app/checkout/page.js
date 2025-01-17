'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Button, Typography } from '@mui/material';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const { items, calculateTotal } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  if (!items.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Your cart is empty</Typography>
      </Box>
    );
  }

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      console.log('🛒 Starting checkout process...');
      
      const response = await fetch(
        'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net/api/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://speedtrapracing.com'
          },
          body: JSON.stringify({ items }),
          credentials: 'same-origin'
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { sessionId } = await response.json();
      
      // Load Stripe and redirect to checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Checkout</Typography>
      <Typography variant="h6" gutterBottom>
        Total: ${calculateTotal().toFixed(2)}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCheckout}
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? 'Processing...' : 'Complete Checkout'}
      </Button>
    </Box>
  );
} 