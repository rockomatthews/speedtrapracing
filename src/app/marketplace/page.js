// app/marketplace/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { fetchContentfulProducts } from '../../lib/contentful';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedProducts = await fetchContentfulProducts();
        console.log("Fetched products:", fetchedProducts);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (!products || products.length === 0) {
    return <div>No products available. Please check back later.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Shopify Products</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              maxWidth: '250px',
            }}
          >
            {product.image ? (
              <img
                src={product.image.fields.file.url}
                alt={product.name}
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ height: '200px', backgroundColor: '#f0f0f0' }}>
                <p>No image available</p>
              </div>
            )}
            <h2>{product.name}</h2>
            <p>Price: ${product.price}</p>
            <p>Category: {product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
