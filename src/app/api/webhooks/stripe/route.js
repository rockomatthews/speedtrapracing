import { headers } from 'next/headers';
import stripe from '@/config/stripe';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('⚠️  Webhook secret is not configured.');
      return Response.json(
        { error: 'Webhook secret not configured' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      return Response.json(
        { error: `Webhook signature verification failed` },
        { status: 400 }
      );
    }

    console.log('Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;

      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        // Check if the order is already paid
        if (checkoutSession.payment_status === 'paid') {
          await handleSuccessfulPayment(checkoutSession);
        }
        break;

      case 'checkout.session.async_payment_succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;

      case 'checkout.session.async_payment_failed':
        await handleFailedPayment(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

async function handleSuccessfulPayment(paymentIntent) {
  try {
    // Fulfill the purchase
    console.log('💰 Payment succeeded:', paymentIntent.id);
    // TODO: 
    // - Update order status in database
    // - Send confirmation email
    // - Update inventory
    // - Notify shipping/fulfillment
  } catch (err) {
    console.error('Error handling successful payment:', err);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    console.error('❌ Payment failed:', paymentIntent.id);
    // TODO:
    // - Update order status
    // - Send failure notification email
    // - Release held inventory
  } catch (err) {
    console.error('Error handling failed payment:', err);
  }
} 