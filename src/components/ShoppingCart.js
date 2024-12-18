// src/components/ShoppingCart.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// MUI Imports
import {
    Box,
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    IconButton,
    Button,
    Divider,
    TextField,
    Grid,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

// Validate Stripe key exists
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe with error handling
let stripePromise = null;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

// Constants
const INITIAL_SHIPPING_STATE = {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: ''
};

const CHECKOUT_STEPS = ['Cart & Shipping', 'Review & Payment'];

function ShoppingCartComponent({ items, onUpdateQuantity, onRemoveItem, clearCart }) {
    // Debug check for Stripe initialization
    useEffect(() => {
        const verifyStripe = async () => {
            const stripe = await getStripe();
            console.log('Stripe Loaded:', !!stripe);
            if (!stripe) {
                console.error('Stripe failed to initialize');
            }
        };
        verifyStripe();
    }, []);

    // Hooks
    const router = useRouter();
    const { user } = useAuth();

    // State Management
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [shippingInfo, setShippingInfo] = useState(INITIAL_SHIPPING_STATE);
    const [snackbarMessage, setSnackbarMessage] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Effect to populate email from user data
    useEffect(() => {
        if (user?.email) {
            setShippingInfo((previousState) => ({
                ...previousState,
                email: user.email
            }));
        }
    }, [user]);

    // Helper Functions
    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            return sum + (itemPrice * itemQuantity);
        }, 0).toFixed(2);
    };

    const validateShippingInfo = () => {
        const requiredFields = [
            'firstName',
            'lastName',
            'email',
            'address',
            'city',
            'state',
            'zipCode',
            'phone'
        ];

        const missingFields = requiredFields.filter(field => !shippingInfo[field]);
        
        if (missingFields.length > 0) {
            setSnackbarMessage({
                open: true,
                message: `Please fill in all required fields: ${missingFields.join(', ')}`,
                severity: 'error'
            });
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shippingInfo.email)) {
            setSnackbarMessage({
                open: true,
                message: 'Please enter a valid email address',
                severity: 'error'
            });
            return false;
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(shippingInfo.phone.replace(/\D/g, ''))) {
            setSnackbarMessage({
                open: true,
                message: 'Please enter a valid 10-digit phone number',
                severity: 'error'
            });
            return false;
        }

        return true;
    };

        // Event Handlers
        const handleShippingInfoChange = (event) => {
            const { name, value } = event.target;
            setShippingInfo((previousState) => ({
                ...previousState,
                [name]: value
            }));
        };
    
        const handleShippingSubmit = (event) => {
            event.preventDefault();
            if (validateShippingInfo()) {
                setActiveStep(1);
            }
        };
    
        const handleSnackbarClose = (event, reason) => {
            if (reason === 'clickaway') {
                return;
            }
            setSnackbarMessage((previousState) => ({
                ...previousState,
                open: false
            }));
        };
    
        const handleCheckout = async () => {
            try {
                setIsLoading(true);
                
                // Format items for the API
                const formattedItems = items.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    variant_id: item.variant_id || `${item.id}-default`
                }));

                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        items: formattedItems,
                        userId: user?.uid || 'guest',
                        email: shippingInfo.email,
                        shippingInfo: shippingInfo,
                        success_url: `${window.location.origin}/marketplace?success=true`,
                        cancel_url: `${window.location.origin}/marketplace?canceled=true`
                    }),
                });

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to create checkout session');
                }

                const stripe = await getStripe();
                const result = await stripe.redirectToCheckout({
                    sessionId: data.sessionId,
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }

            } catch (error) {
                console.error('Checkout error:', error);
                setSnackbarMessage({
                    open: true,
                    message: 'Failed to initiate checkout. Please try again.',
                    severity: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

            // Render Component
    return (
        <>
            <Card>
                <CardContent>
                    {/* Stepper */}
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {CHECKOUT_STEPS.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Cart Items */}
                    {items.length === 0 ? (
                        <Typography variant="body1" align="center">
                            Your cart is empty
                        </Typography>
                    ) : (
                        <Box sx={{ mb: 4 }}>
                            {items.map((item) => (
                                <Box key={item.id} sx={{ mb: 2 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={6}>
                                            <Typography variant="body1">
                                                {item.title}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Select
                                                value={item.quantity}
                                                onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                                                size="small"
                                                fullWidth
                                            >
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <MenuItem key={num} value={num}>
                                                        {num}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body1">
                                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <IconButton 
                                                onClick={() => onRemoveItem(item.id)}
                                                size="small"
                                                aria-label="remove item"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                    <Divider sx={{ my: 1 }} />
                                </Box>
                            ))}
                            <Typography variant="h6" align="right">
                                Total: ${calculateTotal()}
                            </Typography>
                        </Box>
                    )}

                    {/* Shipping Form */}
                    {activeStep === 0 ? (
                        <form onSubmit={handleShippingSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        value={shippingInfo.firstName}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        value={shippingInfo.lastName}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={shippingInfo.email}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Address"
                                        name="address"
                                        value={shippingInfo.address}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Address 2 (Optional)"
                                        name="address2"
                                        value={shippingInfo.address2}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="City"
                                        name="city"
                                        value={shippingInfo.city}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="State"
                                        name="state"
                                        value={shippingInfo.state}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="ZIP Code"
                                        name="zipCode"
                                        value={shippingInfo.zipCode}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Phone"
                                        name="phone"
                                        value={shippingInfo.phone}
                                        onChange={handleShippingInfoChange}
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isLoading || items.length === 0}
                                >
                                    Continue to Payment
                                </Button>
                            </Box>
                        </form>
                    ) : (
                        // Review Step
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Review Order
                            </Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Shipping Information
                                </Typography>
                                <Typography variant="body2">
                                    {shippingInfo.firstName} {shippingInfo.lastName}<br />
                                    {shippingInfo.address}<br />
                                    {shippingInfo.address2 && `${shippingInfo.address2}<br />`}
                                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                                    {shippingInfo.phone}<br />
                                    {shippingInfo.email}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setActiveStep(0)}
                                    disabled={isLoading}
                                    fullWidth
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleCheckout}
                                    disabled={isLoading}
                                    fullWidth
                                >
                                    {isLoading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={20} color="inherit" />
                                            <span>Processing...</span>
                                        </Box>
                                    ) : (
                                        'Complete Purchase'
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Snackbar for messages */}
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

export default ShoppingCartComponent;