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

    // Validate items have required fields
    const invalidItems = items.filter(item => {
      const hasValidPrice = typeof item.price === 'number' && !isNaN(item.price) && item.price > 0;
      const hasValidName = typeof item.name === 'string' && item.name.trim().length > 0;
      const hasValidQuantity = typeof item.quantity === 'number' && item.quantity > 0;
      
      if (!hasValidPrice || !hasValidName || !hasValidQuantity) {
        console.error('Invalid item:', item);
        return true;
      }
      return false;
    });

    if (invalidItems.length > 0) {
      console.error('Invalid items:', invalidItems);
      return NextResponse.json(
        { error: 'Invalid items: Missing required fields or invalid values' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map(item => {
      const lineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name.trim(),
            description: item.description || 'No description available',
            images: item.images?.length ? [item.images[0]] : [],
            metadata: {
              id: item.id
            }
          },
          unit_amount_decimal: (item.price * 100).toFixed(0),
        },
        quantity: item.quantity,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: 10,
        },
      };

      // Remove empty or undefined values
      if (!lineItem.price_data.product_data.images.length) {
        delete lineItem.price_data.product_data.images;
      }

      console.log('Created line item:', JSON.stringify(lineItem, null, 2));
      return lineItem;
    });

    console.log('Line items:', JSON.stringify(lineItems, null, 2));

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        phone_number_collection: {
          enabled: true,
        },
        payment_intent_data: {
          receipt_email: shippingInfo.email,
          metadata: {
            orderId: `order_${Date.now()}`,
            customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          }
        },
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
        customer_email: shippingInfo.email,
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