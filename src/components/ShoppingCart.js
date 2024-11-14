// src/components/ShoppingCart.js
import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ShoppingCartComponent = ({ items = [], onUpdateQuantity, onRemoveItem }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [clientToken, setClientToken] = useState(null);

  useEffect(() => {
    if (items.length > 0 && !braintreeInstance) {
      fetchClientToken();
    }
  }, [items.length]);

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
    if (!window.braintree) {
      setPaymentError('Payment system not loaded. Please refresh the page.');
      return;
    }

    try {
      const instance = await window.braintree.dropin.create({
        authorization: token, 
        container: '#dropin-container',
        paypal: {
          flow: 'checkout',
          amount: calculateTotal().toFixed(2),
          currency: items[0]?.currency || 'USD'
        },
        // Add CSE key if needed for your integration
        client: {
          clientKey: process.env.NEXT_PUBLIC_BRAINTREE_CSE_KEY
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
      const { nonce } = await braintreeInstance.requestPaymentMethod();
      
      const response = await fetch('/api/braintree/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          amount: calculateTotal().toFixed(2),
          items: items
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear the cart
        items.forEach(item => onRemoveItem(item.id));
        
        // Clean up Braintree instance
        await braintreeInstance.teardown();
        setBraintreeInstance(null);
        
        alert('Payment successful! Thank you for your purchase.');
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

  const total = calculateTotal();

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

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6">
              {items[0]?.currency?.toUpperCase()} {total.toFixed(2)}
            </Typography>
          </Box>

          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          <div id="dropin-container"></div>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={isLoading || !braintreeInstance}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ShoppingCartComponent;