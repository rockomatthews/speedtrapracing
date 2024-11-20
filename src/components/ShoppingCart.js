// src/components/ShoppingCart.js
import React, { useState, useEffect } from 'react';
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
  StepLabel
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const BRAINTREE_SCRIPT_URL = 'https://js.braintreegateway.com/web/dropin/1.33.7/js/dropin.min.js';
const BRAINTREE_SDK_URL = 'https://www.paypalobjects.com/api/checkout.min.js';

const ShoppingCartComponent = ({ items = [], onUpdateQuantity, onRemoveItem }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [clientToken, setClientToken] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  // Load Braintree scripts
  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Load Braintree SDK
        if (!document.querySelector(`script[src="${BRAINTREE_SCRIPT_URL}"]`)) {
          const braintreeScript = document.createElement('script');
          braintreeScript.src = BRAINTREE_SCRIPT_URL;
          braintreeScript.async = true;
          
          const paypalScript = document.createElement('script');
          paypalScript.src = BRAINTREE_SDK_URL;
          paypalScript.async = true;
          
          await Promise.all([
            new Promise((resolve, reject) => {
              braintreeScript.onload = resolve;
              braintreeScript.onerror = reject;
              document.body.appendChild(braintreeScript);
            }),
            new Promise((resolve, reject) => {
              paypalScript.onload = resolve;
              paypalScript.onerror = reject;
              document.body.appendChild(paypalScript);
            })
          ]);
          
          setScriptsLoaded(true);
        } else {
          setScriptsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading payment scripts:', error);
        setPaymentError('Failed to load payment system. Please refresh the page.');
      }
    };

    loadScripts();

    // Cleanup
    return () => {
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, []);

  // Initialize Braintree when moving to payment step
  useEffect(() => {
    if (items.length > 0 && !braintreeInstance && activeStep === 1 && scriptsLoaded) {
      const container = document.getElementById('dropin-container');
      if (container) {
        container.innerHTML = '';
        fetchClientToken();
      }
    }
  }, [items.length, activeStep, scriptsLoaded]);

const fetchClientToken = async () => {
  try {
    const response = await fetch('/api/braintree/client-token');
    const data = await response.json();
    
    if (data.clientToken) {
      setClientToken(data.clientToken);
      initializeBraintree(data.clientToken);
    } else {
      throw new Error('No client token received');
    }
  } catch (error) {
    console.error('Error fetching client token:', error);
    setPaymentError('Failed to initialize payment system: Could not get authorization token');
  }
};

const initializeBraintree = async (token) => {
  try {
    if (!window.braintree) {
      throw new Error('Braintree script not loaded');
    }

    const instance = await window.braintree.dropin.create({
      authorization: token,
      container: '#dropin-container',
      paypal: {
        flow: 'checkout',
        amount: calculateTotal().toFixed(2),
        currency: items[0]?.currency || 'USD',
        intent: 'capture',
        enableShippingAddress: true,
        shippingAddressEditable: false,
        shippingAddressOverride: {
          recipientName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          streetAddress: shippingInfo.address,
          locality: shippingInfo.city,
          region: shippingInfo.state,
          postalCode: shippingInfo.zipCode,
          countryCode: shippingInfo.country
        }
      },
      card: {
        cardholderName: {
          required: true
        }
      },
      styles: {
        input: {
          'font-size': '14px',
          'font-family': 'inherit'
        }
      }
    });
    
    setBraintreeInstance(instance);
  } catch (error) {
    console.error('Error initializing Braintree:', error);
    setPaymentError('Failed to initialize payment system: ' + error.message);
  }
};

const calculateTotal = () => {
  return items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);
};

const handleCheckout = async () => {
  if (!braintreeInstance) {
    setPaymentError('Payment system not initialized. Please try again.');
    return;
  }

  setIsLoading(true);
  setPaymentError(null);

  try {
    const { nonce, details } = await braintreeInstance.requestPaymentMethod();
    
    // Create or update user profile with order info
    if (auth.currentUser) {
      const userRef = doc(db, 'Users', auth.currentUser.uid);
      await updateDoc(userRef, {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: details.phone || null,
        hasOrdered: true,
        shippingAddresses: arrayUnion({
          address1: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country: shippingInfo.country
        }),
        updatedAt: new Date().toISOString()
      });
    }

    // Process payment
    const response = await fetch('/api/braintree/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodNonce: nonce,
        amount: calculateTotal().toFixed(2),
        items: items,
        shipping: shippingInfo,
        paymentDetails: details,
        userId: auth.currentUser?.uid
      }),
    });

    const result = await response.json();

    if (result.success) {
      items.forEach(item => onRemoveItem(item.id));
      await braintreeInstance.teardown();
      setBraintreeInstance(null);
      alert('Payment successful! Thank you for your purchase.');
      setActiveStep(0);
    } else {
      setPaymentError(result.error || 'Payment failed. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    setPaymentError('Payment processing failed: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setActiveStep(1); // Move to payment step
  };

  const validateShippingInfo = () => {
    return shippingInfo.firstName && 
           shippingInfo.lastName && 
           shippingInfo.email && 
           shippingInfo.address && 
           shippingInfo.city && 
           shippingInfo.state && 
           shippingInfo.zipCode;
  };

  if (items.length === 0) {
    return (
      <Card sx={{ maxWidth: 600, margin: '20px auto' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <ShoppingCartIcon color="action" />
            <Typography variant="body1" color="text.secondary">
              Your cart is empty
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, margin: '20px auto' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Shopping Cart
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Shipping</StepLabel>
          </Step>
          <Step>
            <StepLabel>Payment</StepLabel>
          </Step>
        </Stepper>
        
        {/* Cart Items */}
        {activeStep === 0 && (
          <>
            {items.map((item) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', py: 2, alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.currency.toUpperCase()} {Number(item.price).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Select
                      size="small"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value))}
                      sx={{ minWidth: 80 }}
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <MenuItem key={num} value={num}>
                          {num}
                        </MenuItem>
                      ))}
                    </Select>
                    
                    <IconButton
                      onClick={() => onRemoveItem(item.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Divider />
              </Box>
            ))}

            {/* Shipping Form */}
            <form onSubmit={handleShippingSubmit}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="First Name"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="email"
                    label="Email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="City"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="State"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="ZIP Code"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={!validateShippingInfo()}
                  >
                    Continue to Payment
                  </Button>
                </Grid>
              </Grid>
            </form>
          </>
        )}

        {/* Payment Step */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">
                {items[0]?.currency?.toUpperCase()} {calculateTotal().toFixed(2)}
              </Typography>
            </Box>

            {paymentError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {paymentError}
              </Alert>
            )}

            <div id="dropin-container"></div>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ flex: 1 }}
              >
                Back to Shipping
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                sx={{ flex: 1 }}
                disabled={isLoading || !braintreeInstance}
                onClick={handleCheckout}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Complete Purchase'}
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingCartComponent;