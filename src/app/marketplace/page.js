import React from 'react';
import { getProducts } from '../../../lib/shopify';
import ProductList from '../../components/ProductList';

export default async function Marketplace() {
  let products = [];
  let error = null;

  try {
    products = await getProducts();
  } catch (err) {
    console.error('Error fetching products:', err);
    error = 'Failed to load products. Please try again later.';
  }

  return <ProductList products={products} error={error} />;
}