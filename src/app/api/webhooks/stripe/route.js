import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Log successful transaction
        await addDoc(collection(db, 'transaction_logs'), {
            type: 'transaction_success',
            timestamp: serverTimestamp(),
            data: {
                stripeSessionId: session.id,
                amount: session.amount_total,
                customerEmail: session.customer_details.email,
                paymentStatus: session.payment_status,
                // Add other relevant data
            }
        });
    }

    return NextResponse.json({ received: true });
} 