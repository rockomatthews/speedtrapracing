import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    console.log('📦 Fetching orders...');
    
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert any timestamps or dates to strings
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || doc.data().updatedAt
    }));

    console.log(`✅ Retrieved ${orders.length} orders`);
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { orderId, status, fulfillmentStatus } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    
    await orderRef.update({
      status,
      fulfillmentStatus,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}