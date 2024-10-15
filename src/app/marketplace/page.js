'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress } from '@mui/material';
import Image from 'next/image';
import { fetchShopifyProducts } from '../../../lib/contentful';
import loginBackground from '../../public/loginBackground.png';

const Marketplace = ({ initialProducts = [] }) => {
  // Setting up state variables for products, loading state, error state, categories, and selected category.
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // useEffect hook to load products when the component is first mounted.
  useEffect(() => {
    // Load products only if initialProducts is empty, otherwise, they are already provided.
    if (initialProducts.length === 0) {
      const loadProducts = async () => {
        try {
          console.log('Fetching products from Shopify through Contentful integration...');
          const fetchedProducts = await fetchShopifyProducts();
          console.log('Fetched products:', fetchedProducts);
          setProducts(fetchedProducts);
          const uniqueCategories = ['All', ...new Set(fetchedProducts.map(product => product.category))];
          setCategories(uniqueCategories);
        } catch (err) {
          console.error('Error loading products:', err);
          setError('Failed to load products. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      loadProducts();
    } else {
      // If products are already provided, categorize them.
      const uniqueCategories = ['All', ...new Set(initialProducts.map(product => product.category))];
      setCategories(uniqueCategories);
      setLoading(false);
    }
  }, [initialProducts]);

  // Functionality to filter products based on the selected category.
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

  // If the component is still loading data, display a loading spinner.
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If there was an error loading the products, display an error message.
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Rendering the main marketplace interface.
  return (
    <Box sx={{ padding: '20px', backgroundColor: '#000', minHeight: '100vh' }}>
      {/* Header Section with Background */}
      <Box
        sx={{
          height: '300px',
          backgroundImage: `url(${loginBackground.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <Typography
          variant="h3"
          sx={{ color: '#fff', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
        >
          Apparel
        </Typography>
        <Typography variant="h5" sx={{ color: '#fff', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          #speedtraphats
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#FFC107', color: '#000', padding: '10px 30px', fontWeight: 'bold' }}
        >
          Checkout Now
        </Button>
      </Box>

      {/* Category Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            sx={{
              backgroundColor: selectedCategory === category ? '#FFC107' : '#ff0000',
              color: selectedCategory === category ? '#000' : '#fff',
              fontWeight: 'bold',
              padding: '10px 20px',
              '&:hover': {
                backgroundColor: selectedCategory === category ? '#FFC107' : '#cc0000',
              },
            }}
          >
            {category}
          </Button>
        ))}
      </Box>

      {/* Grid for Merchandise */}
      <Grid container spacing={4}>
        {filteredProducts.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id}>
            <Box
              sx={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                overflow: 'hidden',
                textAlign: 'center',
              }}
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={250}
                  height={250}
                  style={{ objectFit: 'cover' }}
                />
              )}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}
              >
                {item.name}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000', marginBottom: '15px' }}>
                ${item.price.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Message for Empty Categories */}
      {filteredProducts.length === 0 && (
        <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>
          No products available in this category.
        </Typography>
      )}
    </Box>
  );
};

export default Marketplace;