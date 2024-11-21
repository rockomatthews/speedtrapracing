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
  StepLabel,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

const BRAINTREE_SCRIPT_URL = 'https://js.braintreegateway.com/web/dropin/1.33.7/js/dropin.min.js';

// US States constant for dropdown
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

// Empty cart state component
const EmptyCartState = () => (
  <Card sx={{ maxWidth: 600, margin: '20px auto', py: 6 }}>
    <CardContent>
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        textAlign="center"
        gap={2}
      >
        <ShoppingCartIcon 
          sx={{ 
            fontSize: 60,
            color: 'action.disabled',
            mb: 2
          }} 
        />
        <Typography variant="h5" color="text.primary" gutterBottom>
          Your Cart is Empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '80%', mb: 3 }}>
          Looks like you haven't added any items to your cart yet.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component="a"
          href="/marketplace"
          startIcon={<ShoppingCartIcon />}
        >
          Start Shopping
        </Button>
      </Box>
    </CardContent>
  </Card>
);

// Success state component
const SuccessState = ({ orderId, onClose }) => (
  <Dialog 
    open={true} 
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography
        component="div"
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: 'success.light',
          color: 'success.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 40 }} />
      </Typography>
      
      <Typography variant="h5" gutterBottom>
        Order Successful!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Thank you for your purchase. Your order has been received and is being processed.
      </Typography>
      
      {orderId && (
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
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
            {orderId}
          </Typography>
          <IconButton 
            size="small"
            onClick={() => navigator.clipboard.writeText(orderId)}
            sx={{ ml: 1 }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
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
    </Box>
  </Dialog>
);

const ShoppingCartComponent = ({ items = [], onUpdateQuantity, onRemoveItem }) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Shipping information state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  // Load Braintree script
  useEffect(() => {
    const loadBraintreeScript = async () => {
      try {
        if (!document.querySelector(`script[src="${BRAINTREE_SCRIPT_URL}"]`)) {
          const script = document.createElement('script');
          script.src = BRAINTREE_SCRIPT_URL;
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        setScriptsLoaded(true);
      } catch (error) {
        console.error('Error loading Braintree script:', error);
        setPaymentError('Failed to load payment system. Please refresh the page.');
      }
    };

    loadBraintreeScript();

    // Cleanup on unmount
    return () => {
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, []);

  // Initialize Braintree when moving to payment step
  useEffect(() => {
    const initializeBraintreeIfNeeded = async () => {
      if (items.length > 0 && !braintreeInstance && activeStep === 1 && scriptsLoaded) {
        const container = document.getElementById('dropin-container');
        if (container) {
          container.innerHTML = '';
          await fetchClientToken();
        }
      }
    };

    initializeBraintreeIfNeeded();
  }, [items.length, activeStep, scriptsLoaded]);

  // Helper functions
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);
  };

  const validateShippingInfo = () => {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'address',
      'city',
      'state',
      'zipCode'
    ];
    
    return requiredFields.every(field => 
      shippingInfo[field] && shippingInfo[field].trim() !== ''
    );
  };

  // Braintree initialization
  const fetchClientToken = async () => {
    try {
      const response = await fetch('/api/braintree/client-token');
      const data = await response.json();
      
      if (data.clientToken) {
        await initializeBraintree(data.clientToken);
      } else {
        throw new Error('No client token received');
      }
    } catch (error) {
      console.error('Error fetching client token:', error);
      setPaymentError('Failed to initialize payment system. Please try again.');
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
            extendedAddress: shippingInfo.address2 || undefined,
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
        venmo: {
          allowNewBrowserTab: false
        }
      });
      
      setBraintreeInstance(instance);
    } catch (error) {
      console.error('Error initializing Braintree:', error);
      setPaymentError('Failed to initialize payment system: ' + error.message);
    }
  };

  // Handle checkout process
const handleCheckout = async () => {
  if (!braintreeInstance) {
    setPaymentError('Payment system not initialized. Please try again.');
    return;
  }

  setIsLoading(true);
  setPaymentError(null);

  try {
    const { nonce, details, type } = await braintreeInstance.requestPaymentMethod();
    
    // Update user profile if logged in
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

    const formattedShippingInfo = {
      firstName: shippingInfo.firstName,
      lastName: shippingInfo.lastName,
      email: shippingInfo.email,
      address: shippingInfo.address,
      address2: shippingInfo.address2 || undefined,
      city: shippingInfo.city,
      state: shippingInfo.state,
      zipCode: shippingInfo.zipCode,
      country: shippingInfo.country
    };

    const response = await fetch('/api/braintree/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodNonce: nonce,
        paymentType: type,
        amount: calculateTotal().toFixed(2),
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        shipping: formattedShippingInfo,
        userId: auth.currentUser?.uid,
        paymentDetails: details
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Clear cart
      items.forEach(item => onRemoveItem(item.id));
      
      // Clean up Braintree
      await braintreeInstance.teardown();
      setBraintreeInstance(null);
      
      // Show success dialog with order details
      setOrderSuccess({
        orderId: result.orderId,
        transactionId: result.transaction?.id
      });
      
      // Reset to first step
      setActiveStep(0);
      
      // Reset shipping form
      setShippingInfo({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      });
    } else {
      setPaymentError(result.error || 'Payment failed. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    setPaymentError(error.message || 'Payment processing failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Event handlers
const handleShippingSubmit = (e) => {
  e.preventDefault();
  setActiveStep(1);
};

const handleShippingInfoChange = (field) => (e) => {
  setShippingInfo(prev => ({
    ...prev,
    [field]: e.target.value
  }));
};

// Render empty cart state
if (items.length === 0) {
  return <EmptyCartState />;
}

// Main render
return (
  <>
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
        
        {/* Cart Items and Shipping Form */}
        {activeStep === 0 && (
          <>
            {/* Cart Items */}
            {items.map((item) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', py: 2, alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.currency?.toUpperCase() || 'USD'} {Number(item.price).toFixed(2)}
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
                        <MenuItem key={num} value={num}>{num}</MenuItem>
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
                    onChange={handleShippingInfoChange('firstName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    value={shippingInfo.lastName}
                    onChange={handleShippingInfoChange('lastName')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="email"
                    label="Email"
                    value={shippingInfo.email}
                    onChange={handleShippingInfoChange('email')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Address Line 1"
                    value={shippingInfo.address}
                    onChange={handleShippingInfoChange('address')}
                    helperText="Street address, P.O. box"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 2 (Optional)"
                    value={shippingInfo.address2}
                    onChange={handleShippingInfoChange('address2')}
                    helperText="Apartment, suite, unit, building, floor, etc."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="City"
                    value={shippingInfo.city}
                    onChange={handleShippingInfoChange('city')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    required
                    fullWidth
                    label="State"
                    value={shippingInfo.state}
                    onChange={handleShippingInfoChange('state')}
                    helperText="Please select your state"
                  >
                    {US_STATES.map((state) => (
                      <MenuItem key={state.code} value={state.code}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="ZIP Code"
                    value={shippingInfo.zipCode}
                    onChange={handleShippingInfoChange('zipCode')}
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
                {items[0]?.currency?.toUpperCase() || 'USD'} {calculateTotal().toFixed(2)}
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

    {/* Success Dialog */}
    {orderSuccess && (
      <SuccessState
        orderId={orderSuccess.orderId}
        onClose={() => setOrderSuccess(null)}
      />
    )}
  </>
);
};

export default ShoppingCartComponent;