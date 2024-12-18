// src/app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth } from '../../../lib/firebaseAdmin';

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_BASE_URL environment variable');
}

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
});

export async function POST(request) {
    try {
        // Validate request existence
        if (!request || !request.body) {
            return NextResponse.json({ 
                message: 'Invalid request: Missing request body' 
            }, { 
                status: 400 
            });
        }

        // Parse request body
        const body = await request.json();
        const { items, userId, email, success_url, cancel_url } = body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({
                message: 'Invalid request: Items array is required and must not be empty'
            }, {
                status: 400
            });
        }

        if (!userId) {
            return NextResponse.json({
                message: 'Invalid request: userId is required'
            }, {
                status: 400
            });
        }

        if (!email) {
            return NextResponse.json({
                message: 'Invalid request: email is required'
            }, {
                status: 400
            });
        }

        // Validate each item in the items array
        const validatedLineItems = items.map((item) => {
            if (!item.title) {
                throw new Error(`Invalid item: missing title for item ${JSON.stringify(item)}`);
            }

            if (!item.price || isNaN(parseFloat(item.price))) {
                throw new Error(`Invalid item: invalid price for item ${item.title}`);
            }

            if (!item.quantity || isNaN(parseInt(item.quantity))) {
                throw new Error(`Invalid item: invalid quantity for item ${item.title}`);
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.title,
                        images: item.image ? [item.image] : [],
                        metadata: {
                            productId: item.id || '',
                            variantId: item.variant_id || ''
                        }
                    },
                    unit_amount: Math.round(parseFloat(item.price) * 100), // Convert dollars to cents
                },
                quantity: parseInt(item.quantity),
            };
        });

        // Create Stripe checkout session with full configuration
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: validatedLineItems,
            mode: 'payment',
            success_url: success_url || `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?canceled=true`,
            customer_email: email,
            metadata: {
                userId: userId,
                orderCreatedAt: new Date().toISOString()
            },
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
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true
            }
        });

        // Validate session creation
        if (!session || !session.id) {
            throw new Error('Failed to create Stripe checkout session');
        }

        // Return successful response with session ID
        return NextResponse.json({
            sessionId: session.id,
            success: true
        }, {
            status: 200
        });

    } catch (error) {
        // Log the full error for debugging
        console.error('Stripe session creation error:', error);

        // Return appropriate error response
        return NextResponse.json({
            message: error.message || 'Internal server error',
            success: false,
            error: {
                type: error.type || 'unknown',
                message: error.message || 'An unexpected error occurred',
                code: error.statusCode || 500
            }
        }, {
            status: error.statusCode || 500
        });
    }
}