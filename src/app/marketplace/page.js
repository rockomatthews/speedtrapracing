// src/app/marketplace/page.js
'use client';

import React, { useEffect, useState } from 'react';
import medusaClient from '../../lib/medusa-client.mjs';
import ProductList from '../../components/ProductList';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await medusaClient.products.list({
          limit: 100,
          fields: [
            'title',
            'description',
            'variants',
            'thumbnail',
            'handle',
            'images',
            'category',
            'inventory',
            'size',
            'price',
            'currency'
          ],
          expand: ['variants', 'variants.prices']
        });

        if (response && response.products) {
          setProducts(response.products);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return <ProductList products={products} error={error} />;
}