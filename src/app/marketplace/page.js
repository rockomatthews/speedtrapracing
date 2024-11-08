// src/app/marketplace/page.js
import React from 'react';
import medusaClient from '../../lib/medusa';
import ProductList from '../../components/ProductList';

export default async function Marketplace() {
  let products = [];
  let error = null;

  try {
    // Fetch all products from the database
    const response = await medusaClient.products.list({
      limit: 100,
      fields: [
        'title',
        'description',
        'variants',
        'thumbnail',
        'handle',
        'collection',
        'images',
        'category',
        'inventory',
        'size',
        'price',
        'currency'
      ],
      expand: [
        'variants',
        'variants.prices',
        'collection'
      ]
    });

    // Log raw response to debug
    console.log('Raw database response:', response);

    // Transform each product to match the exact structure needed by ProductList
    if (response && response.products) {
      products = response.products.map(product => {
        return {
          id: product.id,
          title: product.title || '',
          description: product.description || '',
          price: product.price || '0',
          currency: product.currency || 'USD',
          category: product.category || 'Uncategorized',
          size: product.size || '',
          inventory: product.inventory || '0',
          images: product.images || [{
            src: product.thumbnail || 'https://placehold.co/400x300?text=No+Image',
            alt: product.title || 'Product Image'
          }],
          thumbnail: product.thumbnail || 'https://placehold.co/400x300?text=No+Image',
          handle: product.handle || '',
          variants: product.variants || [],
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: product.updatedAt || new Date().toISOString()
        };
      });
    }

    // Log transformed products to debug
    console.log('Transformed products:', products);

  } catch (error) {
    console.error('Error fetching products:', error);
    error = 'Failed to load products. Please try again later.';
  }

  // Return the ProductList component with products or error
  return (
    <ProductList 
      products={products} 
      error={error} 
    />
  );
}