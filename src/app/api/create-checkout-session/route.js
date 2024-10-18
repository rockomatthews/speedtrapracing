import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { date, timeSlots, groupSize, totalPrice, paymentMethod } = body;

    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Racing Simulator Booking',
          description: `Date: ${date}, Time: ${timeSlots.join(', ')}, Group Size: ${groupSize}`,
        },
        unit_amount: Math.round(totalPrice * 100), // Stripe expects amount in cents
      },
      quantity: 1,
    }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'Apple Pay' ? ['card', 'apple_pay'] : ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/booking/cancel`,
    });

    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (err) {
    console.error('Error in create-checkout-session:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}