import { adminAuth } from '@/config/firebaseAdmin';
import stripe from '@/config/stripe';

export async function POST(request) {
  try {
    const { amount, currency = 'usd', idToken } = await request.json();

    // Verify user authentication
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: decodedToken.uid,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 