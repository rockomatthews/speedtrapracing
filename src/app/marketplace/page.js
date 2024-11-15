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

// Helper functions for cart persistence
const saveCartToStorage = (cart) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('shopping-cart', JSON.stringify(cart));
  }
};

const loadCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('shopping-cart');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.length > 0) {
      setCartItems(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

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

  const addToCart = (product) => {
    const cartProduct = {
      id: product.id,
      title: product.title,
      price: product.displayPrice,
      currency: product.currency,
      quantity: 1,
      variant_id: product.variants?.[0]?.id,
      raw_price: product.variants?.[0]?.prices?.[0]
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        saveCartToStorage(updatedItems);
        return updatedItems;
      }
      const newItems = [...prevItems, cartProduct];
      saveCartToStorage(newItems);
      return newItems;
    });
    setCartOpen(true);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
      saveCartToStorage(updatedItems);
      return updatedItems;
    });
  };

  const removeCartItem = (productId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== productId);
      saveCartToStorage(updatedItems);
      return updatedItems;
    });
  };

  // Rest of your component remains the same...

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