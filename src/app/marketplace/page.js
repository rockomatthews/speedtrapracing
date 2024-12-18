// src/app/marketplace/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import medusaClient from '../../lib/medusa-client.mjs';
import ProductList from '../../components/ProductList';
import ShoppingCart from '../../components/ShoppingCart';
import { useCart } from '../../context/CartContext';

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

export default function Marketplace() {
    // State Management
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [snackbarMessage, setSnackbarMessage] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Hooks
    const searchParams = useSearchParams();
    const { 
        cartItems, 
        isCartOpen, 
        setIsCartOpen, 
        addToCart, 
        updateCartItemQuantity, 
        removeCartItem,
        clearCart 
    } = useCart();

    // Check for successful payment on mount
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            clearCart();
            setSnackbarMessage({
                open: true,
                message: 'Payment successful! Thank you for your purchase.',
                severity: 'success'
            });
            // Clear URL parameters
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
    }, [searchParams, clearCart]);

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

                if (!response?.products) {
                    throw new Error('Invalid product data received');
                }

                setProducts(response.products);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    // Handle snackbar close
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarMessage(prev => ({ ...prev, open: false }));
    };

    // Loading State
    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                height="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Error State
    if (error) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                height="100vh"
            >
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
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

            {/* Cart Button */}
            <Box 
                sx={{ 
                    position: 'fixed', 
                    right: 20, 
                    top: 80, 
                    zIndex: 1000 
                }}
            >
                <IconButton 
                    onClick={() => setIsCartOpen(true)}
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
                        badgeContent={cartItems.reduce(
                            (total, item) => total + (item.quantity || 0), 
                            0
                        )} 
                        color="secondary"
                    >
                        <ShoppingCartIcon />
                    </Badge>
                </IconButton>
            </Box>

            {/* Cart Drawer */}
            <Drawer
                anchor="right"
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
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

            {/* Success/Error Messages */}
            <Snackbar
                open={snackbarMessage.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbarMessage.severity}
                    elevation={6}
                    variant="filled"
                >
                    {snackbarMessage.message}
                </Alert>
            </Snackbar>
        </>
    );
}