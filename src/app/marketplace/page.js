// src/app/marketplace/page.js
import React from 'react';
import medusaClient from '../../../lib/medusa';
import ProductList from '../../components/ProductList';

export default async function Marketplace() {
  let products = [];
  let error = null;

  try {
    // Get products from Medusa
    const { products: medusaProducts } = await medusaClient.products.list({
      limit: 100,
      fields: ['title', 'description', 'variants', 'thumbnail', 'handle', 'collection'],
      expand: ['variants', 'variants.prices', 'collection']
    });

    // Transform Medusa products to match your existing structure
    products = medusaProducts.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.variants[0]?.prices[0]?.amount / 100 || 0, // Medusa stores prices in cents
      currency: product.variants[0]?.prices[0]?.currency_code?.toUpperCase() || 'USD',
      images: [{
        src: product.thumbnail,
        alt: product.title
      }],
      category: product.collection?.title || 'Uncategorized',
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.prices[0]?.amount / 100 || 0,
        currency: variant.prices[0]?.currency_code?.toUpperCase() || 'USD',
        inventory_quantity: variant.inventory_quantity
      }))
    }));
  } catch (err) {
    console.error('Error fetching products:', err);
    error = 'Failed to load products. Please try again later.';
  }

  return <ProductList products={products} error={error} />;
}