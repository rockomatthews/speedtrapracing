// src/app/api/medusa/cart/route.js
import { NextResponse } from 'next/server';
import medusaClient from '@/lib/medusa';

export async function POST(request) {
  try {
    const { items } = await request.json();
    
    // Create a new cart in Medusa
    const { cart } = await medusaClient.carts.create({
      items: items.map(item => ({
        variant_id: item.id,
        quantity: item.quantity
      }))
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Cart creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { cartId, items } = await request.json();
    
    // Update cart items
    const { cart } = await medusaClient.carts.update(cartId, {
      items: items.map(item => ({
        variant_id: item.id,
        quantity: item.quantity
      }))
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}