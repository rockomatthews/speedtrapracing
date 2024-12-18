// src/app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { items, userId, email, shippingInfo } = body;

        // Validate inputs
        if (!items?.length) {
            throw new Error('No items provided');
        }

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.title,
                        images: item.image ? [item.image] : [],
                    },
                    unit_amount: Math.round(parseFloat(item.price) * 100),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?canceled=true`,
            customer_email: email,
            shipping_address_collection: {
                allowed_countries: ['US'],
            }
        });

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => 
            sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
        ).toFixed(2);

        // Create transaction log with shipping info from the form
        await adminDb.collection('transaction_logs').add({
            type: 'checkout_initiated',
            status: 'success',
            data: {
                amount: totalAmount,
                customerEmail: email,
                environment: process.env.NODE_ENV || 'development',
                isGuest: userId === 'guest',
                itemCount: items.length,
                shipping: {
                    address: shippingInfo.address,
                    city: shippingInfo.city,
                    country: 'US',
                    email: email,
                    firstName: shippingInfo.firstName,
                    lastName: shippingInfo.lastName,
                    state: shippingInfo.state,
                    zipCode: shippingInfo.zipCode
                },
                userId: userId,
                sessionId: session.id,
                error: null
            },
            timestamp: new Date()
        });

        return NextResponse.json({
            sessionId: session.id,
            success: true
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({
            message: error.message || 'Internal server error',
            success: false
        }, {
            status: 500
        });
    }
}