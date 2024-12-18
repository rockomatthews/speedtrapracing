import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    try {
        const body = await request.text();
        const headersList = headers();
        const sig = headersList.get('stripe-signature');

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            // Get the shipping details from the session
            const shippingDetails = session.shipping_details;
            
            // Find the original transaction log
            const querySnapshot = await adminDb.collection('transaction_logs')
                .where('data.sessionId', '==', session.id)
                .get();

            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                
                // Update the transaction with shipping details
                await docRef.update({
                    'data.shipping': {
                        address: shippingDetails?.address?.line1 || '',
                        city: shippingDetails?.address?.city || '',
                        country: shippingDetails?.address?.country || 'US',
                        email: session.customer_email,
                        firstName: shippingDetails?.name?.split(' ')[0] || '',
                        lastName: shippingDetails?.name?.split(' ').slice(1).join(' ') || '',
                        state: shippingDetails?.address?.state || '',
                        zipCode: shippingDetails?.address?.postal_code || ''
                    }
                });
            }
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}