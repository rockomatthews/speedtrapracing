import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { items, shippingInfo } = await request.json();
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { message: 'No items provided' },
                { status: 400 }
            );
        }

        // Create line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?canceled=true`,
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
                        display_name: 'Free shipping',
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
            customer_email: shippingInfo.email,
            metadata: {
                ...shippingInfo,
            },
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { message: error.message || 'Error creating checkout session' },
            { status: 500 }
        );
    }
} 