import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const createPayment = async ({ amount, currency = 'usd' }) => {
    try {
      setLoading(true);
      setError(null);

      // Get fresh ID token
      const idToken = await user.getIdToken(true);

      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          idToken,
        }),
      });

      const { clientSecret, error: responseError } = await response.json();
      
      if (responseError) {
        throw new Error(responseError);
      }

      // Load Stripe
      const stripe = await stripePromise;
      
      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (stripeError) {
        throw stripeError;
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    loading,
    error,
  };
} 