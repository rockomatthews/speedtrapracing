// src/app/api/medusa/inventory/route.js
import { NextResponse } from 'next/server';
import medusaClient from '@/lib/medusa-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');

    const { variant } = await medusaClient.admin.variants.retrieve(variantId);

    return NextResponse.json({
      inventory_quantity: variant.inventory_quantity
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}