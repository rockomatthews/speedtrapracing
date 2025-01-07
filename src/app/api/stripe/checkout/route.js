import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    console.log('Received checkout request');
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe secret key');
    }

    const { items, shippingInfo } = await request.json();
    console.log('Processing items:', items);

    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Validate prices are numbers
    const invalidItems = items.filter(item => 
      typeof item.price !== 'number' || isNaN(item.price) || item.price <= 0
    );
    if (invalidItems.length > 0) {
      console.error('Invalid item prices:', invalidItems);
      return NextResponse.json(
        { error: 'Invalid item prices' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.images?.length ? [item.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    console.log('Creating Stripe session with line items:', lineItems);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'required',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 0,
                currency: 'usd',
              },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 5,
                },
                maximum: {
                  unit: 'business_day',
                  value: 7,
                },
              },
            },
          },
        ],
        metadata: {
          orderId: `order_${Date.now()}`,
          customerEmail: shippingInfo.email,
          customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        },
      });

      console.log('Created Stripe session:', session.id);
      return NextResponse.json({ sessionId: session.id });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || 'Error creating Stripe session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 