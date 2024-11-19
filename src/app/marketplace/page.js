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

// Improved cart storage with error handling and quota management
const cartManager = {
  save: (cart) => {
    try {
      // Trim cart data to prevent storage issues
      const trimmedCart = cart.map(item => ({
        id: item.id,
        title: item.title?.substring(0, 100) || '',  // Limit title length
        price: Number(item.price) || 0,
        currency: item.currency || 'USD',
        quantity: Number(item.quantity) || 1,
        variant_id: item.variant_id,
        raw_price: item.raw_price ? {
          amount: item.raw_price.amount,
          currency_code: item.raw_price.currency_code
        } : null
      }));

      // Try to save, clear if needed
      try {
        localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
      } catch (e) {
        // If quota exceeded, clear and try again
        localStorage.clear();
        localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  },

  load: () => {
    try {
      const saved = localStorage.getItem('shopping-cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  }
};

export default function Marketplace() {
  // State Management
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Load cart on initial render
  useEffect(() => {
    const savedCart = cartManager.load();
    if (savedCart.length > 0) {
      setCartItems(savedCart);
    }
  }, []);

  // Save cart when it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      cartManager.save(cartItems);
    }
  }, [cartItems]);

  // Fetch products from Medusa client
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

        if (response?.products) {
          setProducts(response.products);
        } else {
          throw new Error('Invalid product data received');
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

  // Cart Management Functions
  const addToCart = (product) => {
    if (!product?.id) return;

    const cartProduct = {
      id: product.id,
      title: product.title,
      price: product.displayPrice,
      currency: product.currency || 'USD',
      quantity: 1,
      variant_id: product.variants?.[0]?.id,
      raw_price: product.variants?.[0]?.prices?.[0]
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update existing item
        const updatedItems = prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 0) + 1 }
            : item
        );
        cartManager.save(updatedItems);
        return updatedItems;
      }
      
      // Add new item
      const newItems = [...prevItems, cartProduct];
      cartManager.save(newItems);
      return newItems;
    });

    setCartOpen(true);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (!productId || newQuantity < 1) return;

    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: Number(newQuantity) }
          : item
      );
      cartManager.save(updatedItems);
      return updatedItems;
    });
  };

  const removeCartItem = (productId) => {
    if (!productId) return;

    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== productId);
      cartManager.save(updatedItems);
      return updatedItems;
    });
  };

  // Loading State
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Main Render
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
            badgeContent={cartItems.reduce((total, item) => total + (item.quantity || 0), 0)} 
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