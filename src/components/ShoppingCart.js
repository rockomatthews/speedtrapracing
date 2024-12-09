import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    IconButton,
    Button,
    Divider,
    Box,
    CircularProgress,
    Alert,
    TextField,
    Grid,
    Stepper,
    Step,
    StepLabel,
    Snackbar,
    Dialog,
    DialogContent,
    DialogActions
} from '@mui/material';

import {
    ShoppingCart as ShoppingCartIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    ContentCopy as ContentCopyIcon,
    Error as ErrorIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const ERROR_MESSAGES = {
    CARD_DECLINED: "Your card was declined. Please try a different payment method.",
    FRAUD_SUSPECTED: "This transaction was flagged for potential fraud. Please try a different payment method or contact your bank.",
    PROCESSOR_DECLINED: "Transaction declined by your bank. Please try another card or contact your bank.",
    NETWORK_ERROR: "Connection error detected. Please check your internet and try again.",
    INVALID_PAYMENT: "Invalid payment information provided. Please check and try again.",
    GENERAL_ERROR: "An error occurred processing your payment. Please try again.",
    SESSION_EXPIRED: "Your payment session expired. Please refresh and try again.",
    INSUFFICIENT_FUNDS: "Insufficient funds. Please try a different card or payment method.",
    CVV_VERIFICATION: "CVV verification failed. Please check your card details.",
    POSTAL_CODE: "Postal code verification failed. Please check your billing information.",
    EXPIRED_CARD: "The card has expired. Please use a different card.",
    GATEWAY_ERROR: "Payment system temporarily unavailable. Please try again shortly.",
    INITIALIZATION_ERROR: "Failed to initialize payment system. Please try again or contact support."
};

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

const US_STATES = [
    { name: 'Alabama', code: 'AL' },
    { name: 'Alaska', code: 'AK' },
    { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' },
    { name: 'California', code: 'CA' },
    { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' },
    { name: 'Delaware', code: 'DE' },
    { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' },
    { name: 'Hawaii', code: 'HI' },
    { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' },
    { name: 'Kentucky', code: 'KY' },
    { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' },
    { name: 'Maryland', code: 'MD' },
    { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' },
    { name: 'Minnesota', code: 'MN' },
    { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' },
    { name: 'Montana', code: 'MT' },
    { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' },
    { name: 'New Hampshire', code: 'NH' },
    { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' },
    { name: 'New York', code: 'NY' },
    { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' },
    { name: 'Ohio', code: 'OH' },
    { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' },
    { name: 'Pennsylvania', code: 'PA' },
    { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' },
    { name: 'South Dakota', code: 'SD' },
    { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' },
    { name: 'Utah', code: 'UT' },
    { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' },
    { name: 'Washington', code: 'WA' },
    { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' },
    { name: 'Wyoming', code: 'WY' }
].sort((a, b) => a.name.localeCompare(b.name));

// Success Dialog goes outside main component
const SuccessDialog = function({ 
    open, 
    orderId, 
    email, 
    total, 
    onClose, 
    onContinueShopping, 
    onViewOrderDetails 
}) {
    return (
        <Dialog 
            open={open}
            maxWidth="sm"
            fullWidth={true}
        >
            <DialogContent sx={{ textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>
                <CheckCircleIcon sx={{ 
                    fontSize: 64, 
                    color: 'success.main', 
                    marginBottom: 2 
                }} />
                
                <Typography variant="h5" gutterBottom={true}>
                    Thank You for Your Order!
                </Typography>
                
                <Typography variant="body1" sx={{ marginBottom: 3 }} color="text.secondary">
                    Your order has been successfully placed. You will receive a confirmation email at {email} with tracking information once your order ships.
                </Typography>
                
                <Box sx={{ 
                    backgroundColor: 'grey.50',
                    padding: 2,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    marginBottom: 3
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Order ID:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {orderId}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={function() {
                            navigator.clipboard.writeText(orderId);
                        }}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Typography variant="body1" sx={{ marginBottom: 3 }}>
                    Order Total: ${total}
                </Typography>

                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    justifyContent: 'center' 
                }}>
                    <Button
                        variant="outlined"
                        onClick={onContinueShopping}
                    >
                        Continue Shopping
                    </Button>
                    <Button
                        variant="contained"
                        onClick={function() {
                            onViewOrderDetails(orderId);
                        }}
                    >
                        View Order Details
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

// Error Dialog also goes outside main component
const ErrorDialog = function({ open, message, isWarning, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth={true}
        >
            <DialogContent sx={{ textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>
                {isWarning ? (
                    <WarningIcon sx={{ fontSize: 64, color: 'warning.main', marginBottom: 2 }} />
                ) : (
                    <ErrorIcon sx={{ fontSize: 64, color: 'error.main', marginBottom: 2 }} />
                )}
                
                <Typography variant="h6" gutterBottom={true}>
                    {isWarning ? 'Payment Warning' : 'Payment Error'}
                </Typography>
                
                <Typography color="text.secondary" sx={{ marginBottom: 3 }}>
                    {message}
                </Typography>
                
                <Button
                    variant="contained"
                    onClick={onClose}
                    color={isWarning ? 'warning' : 'error'}
                >
                    Try Again
                </Button>
            </DialogContent>
        </Dialog>
    );
};


const ShoppingCartComponent = function({ items, onUpdateQuantity, onRemoveItem }) {
    

    const [isLoading, setIsLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [braintreeInstance, setBraintreeInstance] = useState(null);
    const [shippingInfo, setShippingInfo] = useState(INITIAL_SHIPPING_STATE);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [paymentErrorDialogOpen, setPaymentErrorDialogOpen] = useState(false);
    const [paymentErrorIsWarning, setPaymentErrorIsWarning] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    
    useEffect(function() {
        return function() {
            if (braintreeInstance) {
                cleanupBraintree();
            }
        };
    }, [braintreeInstance]);

    useEffect(function() {
        const loadBraintreeScript = async function() {
            // ... BraintreeScript loading effect code
        };

        loadBraintreeScript();
    }, [activeStep]);

    const [snackbarMessage, setSnackbarMessage] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const calculateTotal = function() {
        return items.reduce(function(sum, item) {
            const itemPrice = Number(item.price) || 0;
            const itemQuantity = Number(item.quantity) || 0;
            return sum + (itemPrice * itemQuantity);
        }, 0);
    };

    const cleanupBraintree = async function() {
        if (braintreeInstance) {
            try {
                await braintreeInstance.teardown();
                setBraintreeInstance(null);
            } catch (error) {
                console.error('Error cleaning up Braintree:', error);
            }
        }
    };

    const fetchClientToken = async function() {
        try {
            const response = await fetch('https://speedtrapracing.com/api/braintree/client-token');
            const data = await response.json();
            
            if (!data.clientToken) {
                throw new Error('No client token received');
            }

            return data.clientToken;
        } catch (error) {
            console.error('Error fetching client token:', error);
            throw error;
        }
    };

    const initializeBraintree = async function(clientToken) {
        try {
            await cleanupBraintree();

            await new Promise(function(resolve) {
                setTimeout(resolve, 100);
            });

            if (!window.braintree) {
                throw new Error('Braintree script not loaded');
            }

            const dropinContainer = document.getElementById('dropin-container');
            if (!dropinContainer) {
                throw new Error('Dropin container not found');
            }

            dropinContainer.innerHTML = '';

            console.log('Creating Braintree Drop-in instance...');

            const braintreeInstance = await window.braintree.dropin.create({
                authorization: clientToken,
                container: '#dropin-container',
                paypal: {
                    flow: 'checkout',
                    amount: calculateTotal().toFixed(2),
                    currency: 'USD',
                    intent: 'capture',
                    enableShippingAddress: true,
                    shippingAddressEditable: false,
                    shippingAddressOverride: {
                        recipientName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
                        streetAddress: shippingInfo.address,
                        extendedAddress: shippingInfo.address2 || undefined,
                        locality: shippingInfo.city,
                        region: shippingInfo.state,
                        postalCode: shippingInfo.zipCode,
                        countryCode: shippingInfo.country
                    },
                    buttonStyle: {
                        color: 'gold',
                        shape: 'rect',
                        size: 'responsive',
                        label: 'paypal'
                    }
                },
                card: {
                    cardholderName: {
                        required: true
                    },
                    overrides: {
                        styles: {
                            input: {
                                'font-size': '16px',
                                'font-family': 'Arial, sans-serif',
                                color: '#333333'
                            },
                            '.number': {
                                'font-family': 'monospace',
                                'font-size': '16px'
                            },
                            '.valid': {
                                color: '#2ecc71'
                            },
                            ':focus': {
                                color: '#333333'
                            }
                        },
                        fields: {
                            number: {
                                placeholder: 'Card Number',
                                prefill: ''
                            },
                            cvv: {
                                placeholder: 'CVV',
                                prefill: ''
                            },
                            expirationDate: {
                                placeholder: 'MM/YY',
                                prefill: ''
                            },
                            cardholderName: {
                                placeholder: 'Name on Card',
                                prefill: `${shippingInfo.firstName} ${shippingInfo.lastName}`
                            }
                        }
                    }
                },
                paymentOptionPriority: ['paypal', 'card'],
                callbacks: {
                    onError: function(error) {
                        console.error('Braintree Drop-in error:', error);
                        handlePaymentError(error);
                    },
                    onPaymentMethodRequestable: function(available) {
                        console.log('Payment method is requestable:', available);
                        setSnackbarMessage({
                            open: true,
                            message: "Payment method ready",
                            severity: 'success'
                        });
                    },
                    onPaymentOptionSelected: function(payload) {
                        console.log('Payment option selected:', payload.paymentOption);
                    },
                    onNoPaymentMethodRequestable: function() {
                        console.log('No payment method is currently requestable');
                    }
                }
            });

            console.log('Braintree Drop-in instance created successfully');
            setBraintreeInstance(braintreeInstance);
            return braintreeInstance;

        } catch (error) {
            console.error('Error initializing Braintree:', error);
            handlePaymentError(error);
            return null;
        }
    };

    const handlePaymentError = function(error, isWarning = false) {
        console.error('Payment error:', error);
        
        let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
        
        if (error.message) {
            if (error.message.includes('Insufficient Funds')) {
                errorMessage = ERROR_MESSAGES.INSUFFICIENT_FUNDS;
                isWarning = true;
            } else if (error.message.includes('CVV')) {
                errorMessage = ERROR_MESSAGES.CVV_VERIFICATION;
                isWarning = true;
            } else if (error.message.includes('Postal Code')) {
                errorMessage = ERROR_MESSAGES.POSTAL_CODE;
                isWarning = true;
            }
        }

        setPaymentError(errorMessage);
        setPaymentErrorIsWarning(isWarning);
        setPaymentErrorDialogOpen(true);
    };

    const handleCheckout = async function() {
        if (!braintreeInstance) {
            handlePaymentError(new Error('Payment system not initialized'));
            return;
        }
    
        setIsLoading(true);
        setPaymentError(null);
        setPaymentErrorDialogOpen(false);
    
        try {
            const paymentMethodResult = await braintreeInstance.requestPaymentMethod();
    
            if (auth.currentUser) {
                const userRef = doc(db, 'Users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    firstName: shippingInfo.firstName,
                    lastName: shippingInfo.lastName,
                    email: shippingInfo.email,
                    hasOrdered: true,
                    shippingAddresses: arrayUnion({
                        address1: shippingInfo.address,
                        address2: shippingInfo.address2 || null,
                        city: shippingInfo.city,
                        state: shippingInfo.state,
                        postal_code: shippingInfo.zipCode,
                        country: shippingInfo.country
                    }),
                    updatedAt: new Date().toISOString()
                });
            }
    
            const orderData = {
                paymentMethodNonce: paymentMethodResult.nonce,
                amount: calculateTotal().toFixed(2),
                items: items.map(function(item) {
                    return {
                        id: item.id,
                        price: Number(item.price),
                        quantity: Number(item.quantity),
                        title: item.title
                    };
                }),
                shipping: shippingInfo,
                userId: auth.currentUser?.uid
            };
    
            const response = await fetch('https://speedtrapracing.com/api/braintree/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment failed');
            }
    
            const result = await response.json();
    
            if (result.success) {
                // Clear cart items
                items.forEach(function(item) {
                    onRemoveItem(item.id);
                });
                
                // Set success data and show success dialog
                setOrderSuccess({
                    orderId: result.orderId,
                    transactionId: result.transaction?.id,
                    email: shippingInfo.email,
                    total: orderData.amount
                });
    
                setShowSuccessDialog(true);
                setActiveStep(0);
                setShippingInfo(INITIAL_SHIPPING_STATE);
    
                // Clean up Braintree instance
                await cleanupBraintree();
            } else {
                throw new Error(result.error || 'Payment failed');
            }
        } catch (error) {
            console.error('Checkout process failed:', error);
            handlePaymentError(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Success Dialog Component
    const SuccessDialog = function({ open, orderId, email, total, onClose }) {
        return (
            <Dialog 
                open={open} 
                onClose={onClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon 
                        sx={{ 
                            fontSize: 64, 
                            color: 'success.main', 
                            mb: 2 
                        }} 
                    />
                    
                    <Typography variant="h5" gutterBottom>
                        Thank You for Your Order!
                    </Typography>
                    
                    <Typography color="text.secondary" paragraph>
                        Your order has been successfully placed. You will receive a confirmation email
                        at {email} with tracking information once your order ships.
                    </Typography>
                    
                    <Box sx={{ 
                        bgcolor: 'grey.50', 
                        p: 2, 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mb: 3 
                    }}>
                        <Typography variant="body2" color="text.secondary">
                            Order ID:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {orderId}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={function() {
                                navigator.clipboard.writeText(orderId);
                            }}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Box>
    
                    <Typography variant="body1" gutterBottom>
                        Order Total: ${total}
                    </Typography>
    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            component="a"
                            href="/marketplace"
                        >
                            Continue Shopping
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    };

    const handleShippingInfoChange = function(field) {
        return function(event) {
            setShippingInfo(function(prev) {
                return {
                    ...prev,
                    [field]: event.target.value
                };
            });
        };
    };

    const validateShippingInfo = function() {
        const required = [
            'firstName',
            'lastName',
            'email',
            'address',
            'city',
            'state',
            'zipCode'
        ];
        
        return required.every(function(field) {
            return shippingInfo[field] && shippingInfo[field].trim() !== '';
        });
    };

    const handleShippingSubmit = function(event) {
        event.preventDefault();
        if (validateShippingInfo()) {
            setActiveStep(1);
            const initializePayment = async function() {
                try {
                    const token = await fetchClientToken();
                    await initializeBraintree(token);
                } catch (error) {
                    console.error('Failed to initialize payment:', error);
                    handlePaymentError(error);
                }
            };
            initializePayment();
        }
    };

    useEffect(function() {
        const loadBraintreeScript = async function() {
            try {
                if (!document.querySelector('script[src*="braintree"]')) {
                    const script = document.createElement('script');
                    script.src = 'https://js.braintreegateway.com/web/dropin/1.33.7/js/dropin.min.js';
                    script.async = true;
                    await new Promise(function(resolve, reject) {
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                }
            } catch (error) {
                console.error('Failed to load Braintree script:', error);
                handlePaymentError(error);
            }
        };

        loadBraintreeScript();

        return function() {
            cleanupBraintree();
        };
    }, []);

    if (items.length === 0) {
        return (
            <Card sx={{ maxWidth: 600, margin: '20px auto', padding: 4 }}>
                <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>Your Cart is Empty</Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Start adding items to your cart to check out.
                        </Typography>
                        <Button
                            variant="contained"
                            component="a"
                            href="/marketplace"
                            startIcon={<ShoppingCartIcon />}
                        >
                            Continue Shopping
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );

        
    }

    return (
        <>
            {items.length === 0 ? (
                <Card sx={{ maxWidth: 600, margin: '20px auto', padding: 4 }}>
                    <CardContent>
                        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                            <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h5" gutterBottom>Your Cart is Empty</Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Start adding items to your cart to check out.
                            </Typography>
                            <Button
                                variant="contained"
                                component="a"
                                href="/marketplace"
                                startIcon={<ShoppingCartIcon />}
                            >
                                Continue Shopping
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card sx={{ maxWidth: 800, margin: '20px auto' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom={true}>Shopping Cart</Typography>
                            
                            <Stepper activeStep={activeStep} sx={{ marginBottom: 4 }}>
                                <Step>
                                    <StepLabel>Shipping</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>Payment</StepLabel>
                                </Step>
                            </Stepper>
    
                            {activeStep === 0 ? (
                                <form onSubmit={handleShippingSubmit}>
                                    {items.map(function(item) {
                                        return (
                                            <Box key={item.id}>
                                                <Box sx={{ display: 'flex', py: 2, alignItems: 'center' }}>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1">{item.title}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            USD {Number(item.price).toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Select
                                                            size="small"
                                                            value={item.quantity}
                                                            onChange={function(event) {
                                                                onUpdateQuantity(item.id, parseInt(event.target.value));
                                                            }}
                                                        >
                                                            {[1, 2, 3, 4, 5].map(function(num) {
                                                                return (
                                                                    <MenuItem key={num} value={num}>{num}</MenuItem>
                                                                );
                                                            })}
                                                        </Select>
                                                        <IconButton 
                                                            onClick={function() {
                                                                onRemoveItem(item.id);
                                                            }}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                <Divider />
                                            </Box>
                                        );
                                    })}
    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
                                        <Typography variant="h6">
                                            Total: USD {calculateTotal().toFixed(2)}
                                        </Typography>
                                    </Box>
    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                label="First Name"
                                                value={shippingInfo.firstName}
                                                onChange={handleShippingInfoChange('firstName')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                label="Last Name"
                                                value={shippingInfo.lastName}
                                                onChange={handleShippingInfoChange('lastName')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                type="email"
                                                label="Email"
                                                value={shippingInfo.email}
                                                onChange={handleShippingInfoChange('email')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                label="Address Line 1"
                                                value={shippingInfo.address}
                                                onChange={handleShippingInfoChange('address')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth={true}
                                                label="Address Line 2 (Optional)"
                                                value={shippingInfo.address2}
                                                onChange={handleShippingInfoChange('address2')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                label="City"
                                                value={shippingInfo.city}
                                                onChange={handleShippingInfoChange('city')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select={true}
                                                required={true}
                                                fullWidth={true}
                                                label="State"
                                                value={shippingInfo.state}
                                                onChange={handleShippingInfoChange('state')}
                                            >
                                                {US_STATES.map(function(state) {
                                                    return (
                                                        <MenuItem key={state.code} value={state.code}>
                                                            {state.name}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required={true}
                                                fullWidth={true}
                                                label="ZIP Code"
                                                value={shippingInfo.zipCode}
                                                onChange={handleShippingInfoChange('zipCode')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth={true}
                                                label="Phone (Optional)"
                                                value={shippingInfo.phone}
                                                onChange={handleShippingInfoChange('phone')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                fullWidth={true}
                                                size="large"
                                                disabled={!validateShippingInfo()}
                                            >
                                                Continue to Payment
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                        <Typography variant="h6">Order Summary</Typography>
                                        <Typography variant="h6">
                                            USD {calculateTotal().toFixed(2)}
                                        </Typography>
                                    </Box>
    
                                    <div id="dropin-container" />
    
                                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={function() {
                                                setActiveStep(0);
                                                if (braintreeInstance) {
                                                    cleanupBraintree();
                                                }
                                            }}
                                            disabled={isLoading}
                                            fullWidth={true}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleCheckout}
                                            disabled={isLoading || !braintreeInstance}
                                            fullWidth={true}
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
    
                    <SuccessDialog
                        open={showSuccessDialog}
                        orderId={orderSuccess?.orderId}
                        email={orderSuccess?.email}
                        total={orderSuccess?.total}
                        onClose={function() {
                            setShowSuccessDialog(false);
                        }}
                        onContinueShopping={function() {
                            setShowSuccessDialog(false);
                            window.location.href = '/marketplace';
                        }}
                        onViewOrderDetails={function(orderId) {
                            window.location.href = `/order-confirmation/${orderId}`;
                        }}
                    />
    
                    <ErrorDialog
                        open={paymentErrorDialogOpen}
                        message={paymentError}
                        isWarning={paymentErrorIsWarning}
                        onClose={function() {
                            setPaymentErrorDialogOpen(false);
                            setPaymentError(null);
                        }}
                    />
    
                    <Snackbar
                        open={snackbarMessage.open}
                        autoHideDuration={6000}
                        onClose={function() {
                            setSnackbarMessage(function(prev) {
                                return { ...prev, open: false };
                            });
                        }}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={function() {
                                setSnackbarMessage(function(prev) {
                                    return { ...prev, open: false };
                                });
                            }}
                            severity={snackbarMessage.severity}
                            elevation={6}
                            variant="filled"
                        >
                            {snackbarMessage.message}
                        </Alert>
                    </Snackbar>
                </>
            )}
        </>
    );
}

export default ShoppingCartComponent;

