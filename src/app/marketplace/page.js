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
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import ErrorBoundary from '../../components/ErrorBoundary';

// Improved cart storage with error handling and quota management
const cartManager = {
  save: (cart) => {
    try {
      const trimmedCart = cart.map(item => ({
        id: item.id,
        title: item.title?.substring(0, 100) || '',
        price: Number(item.price) || 0,
        currency: item.currency || 'USD',
        quantity: Number(item.quantity) || 1,
        variant_id: item.variant_id,
        raw_price: item.raw_price ? {
          amount: item.raw_price.amount,
          currency_code: item.raw_price.currency_code
        } : null
      }));

      localStorage.setItem('shopping-cart', JSON.stringify(trimmedCart));
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

export default function MarketplacePage() {
  return (
    <ErrorBoundary>
      <Marketplace />
    </ErrorBoundary>
  );
}

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('success') === 'true') {
      setCartItems([]);
      localStorage.removeItem('shopping-cart');
      
      setSnackbarMessage({
        open: true,
        message: 'Payment successful! Thank you for your purchase.',
        severity: 'success'
      });
      
      window.history.replaceState({}, '', '/marketplace');
    }

    if (searchParams.get('canceled') === 'true') {
      setSnackbarMessage({
        open: true,
        message: 'Payment was canceled.',
        severity: 'info'
      });
      window.history.replaceState({}, '', '/marketplace');
    }
  }, []);

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
        setLoading(true);
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
        const errorMessage = err.code === 'app/duplicate-app' 
          ? 'Application initialization error. Please refresh the page.'
          : err.message || 'Failed to load products. Please try again later.';
        setError(errorMessage);
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

      <Snackbar
        open={!!snackbarMessage?.open}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
      >
        <Alert 
          onClose={() => setSnackbarMessage(null)} 
          severity={snackbarMessage?.severity || 'info'} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage?.message}
        </Alert>
      </Snackbar>

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