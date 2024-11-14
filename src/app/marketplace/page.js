// src/app/marketplace/page.js
'use client';

import React, { useEffect, useState } from 'react';
import medusaClient from '../../lib/medusa-client.mjs';
import ProductList from '../../components/ProductList';
import ShoppingCart from '../../components/ShoppingCart';
import { 
  Box, 
  IconButton, 
  Badge, 
  Drawer,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

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
          // Keep the raw data from Medusa without transformation
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

  const addToCart = (product) => {
    const cartProduct = {
      id: product.id,
      title: product.title,
      price: product.displayPrice,  // This is now coming directly from Medusa's price
      currency: product.currency,   // This is now coming directly from Medusa's currency
      quantity: 1,
      variant_id: product.variants?.[0]?.id,
      // Store the raw price info for reference if needed
      raw_price: product.variants?.[0]?.prices?.[0]
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, cartProduct];
    });
    setCartOpen(true);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeCartItem = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  if (loading) {
    return (
      <Container>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="50vh"
        >
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <ProductList 
        products={products}
        onAddToCart={addToCart}
      />

      <Box 
        sx={{ 
          position: 'fixed', 
          right: 20, 
          top: 80, 
          zIndex: 1000 
        }}
      >
        <IconButton 
          onClick={() => setCartOpen(true)}
          color="primary"
          sx={{ 
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
              opacity: 0.9
            }
          }}
        >
          <Badge 
            badgeContent={cartItems.reduce((total, item) => total + item.quantity, 0)} 
            color="secondary"
          >
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Box>

      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: {
              xs: '100%',
              sm: 400
            },
            paddingTop: '64px'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeCartItem}
          />
        </Box>
      </Drawer>
    </>
  );
}