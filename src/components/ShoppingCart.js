'use client'

import React, { useState, useEffect } from 'react';
import dropin from 'braintree-web-drop-in';
import medusaClient from '@/lib/medusa';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { useShoppingCart } from '@/app/hooks/useShoppingCart';

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useShoppingCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [medusaCartId, setMedusaCartId] = useState(null);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const toggleDrawer = (isOpen) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(isOpen);
  };

  const createMedusaCart = async () => {
    try {
      // Create a new cart in Medusa
      const response = await medusaClient.carts.create({
        items: cart.map(item => ({
          variant_id: item.id,
          quantity: item.quantity
        }))
      });

      if (response.cart) {
        setMedusaCartId(response.cart.id);
        return response.cart;
      } else {
        throw new Error('Failed to create cart in Medusa');
      }
    } catch (error) {
      console.error('Medusa cart creation error:', error);
      setPaymentError('Failed to initialize cart. Please try again.');
      return null;
    }
  };

  const setupPaymentSession = async (cartId) => {
    try {
      // Create payment sessions for the cart
      const response = await medusaClient.carts.createPaymentSessions(cartId);
      
      if (!response.cart) {
        throw new Error('Failed to create payment session');
      }

      // Select Braintree payment provider
      await medusaClient.carts.setPaymentSession(cartId, {
        provider_id: 'braintree'
      });

      return response.cart;
    } catch (error) {
      console.error('Payment session setup error:', error);
      setPaymentError('Failed to setup payment. Please try again.');
      return null;
    }
  };

  const initializeBraintree = async () => {
    try {
      setPaymentError(null);
      
      // First create Medusa cart and setup payment
      const medusaCart = await createMedusaCart();
      if (!medusaCart) return;

      const cartWithPayment = await setupPaymentSession(medusaCart.id);
      if (!cartWithPayment) return;

      // Get Braintree client token
      const tokenResponse = await fetch('/api/braintree/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get payment authorization');
      }
      
      const { clientToken } = await tokenResponse.json();

      // Initialize Braintree Drop-in UI
      const instance = await dropin.create({
        authorization: clientToken,
        container: '#braintree-drop-in-container',
        paypal: {
          flow: 'checkout',
          amount: totalPrice.toFixed(2),
          currency: cart[0]?.currency || 'USD',
          buttonStyle: {
            color: 'blue',
            shape: 'rect',
            size: 'responsive'
          }
        },
        venmo: {
          allowNewBrowserTab: false,
          paymentMethodUsage: 'single_use',
          allowDesktop: true
        },
        applePay: {
          displayName: 'Your Store Name',
          paymentRequest: {
            total: {
              label: 'Total Amount',
              amount: totalPrice.toFixed(2)
            },
            requiredBillingContactFields: ['postalAddress']
          }
        },
        googlePay: {
          googlePayVersion: 2,
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_ID,
          transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: totalPrice.toFixed(2),
            currencyCode: cart[0]?.currency || 'USD'
          },
          cardRequirements: {
            billingAddressRequired: true
          }
        },
        card: {
          vault: {
            allowVaulting: true
          }
        }
      });

      setBraintreeInstance(instance);
    } catch (error) {
      console.error('Braintree initialization error:', error);
      setPaymentError('Failed to initialize payment system. Please try again.');
    }
  };

  const handleCheckout = async () => {
    if (!braintreeInstance || !medusaCartId) {
      setPaymentDialogOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentError(null);

      // Get payment method nonce from Braintree
      const { nonce } = await braintreeInstance.requestPaymentMethod();

      // Update cart payment session with nonce
      await medusaClient.carts.updatePaymentSession(medusaCartId, 'braintree', {
        nonce: nonce
      });

      // Complete the cart/order in Medusa
      const { cart: completedCart } = await medusaClient.carts.complete(medusaCartId);

      if (completedCart.payment_status !== 'captured') {
        throw new Error('Payment not captured');
      }

      // Handle successful payment
      setPaymentSuccess(true);
      clearCart();
      
      // Create order record in Medusa
      await medusaClient.orders.retrieve(completedCart.id);

      setTimeout(() => {
        setPaymentDialogOpen(false);
        setDrawerOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, [braintreeInstance]);

  // Initialize when payment dialog opens
  useEffect(() => {
    if (paymentDialogOpen) {
      initializeBraintree();
    }
  }, [paymentDialogOpen]);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ShoppingCartIcon />}
        onClick={toggleDrawer(true)}
        sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1000 }}
      >
        Cart ({totalItems})
      </Button>

      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Shopping Cart
          </Typography>
          
          <List>
            {cart.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={item.title}
                  secondary={`${item.currency} ${item.price} x ${item.quantity}`}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Button 
                    size="small" 
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </Button>
                  <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <Button 
                    size="small" 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Total: {cart[0]?.currency} {totalPrice.toFixed(2)}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={cart.length === 0}
            onClick={() => setPaymentDialogOpen(true)}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Drawer>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => !isProcessing && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Complete Your Purchase
            {!isProcessing && (
              <IconButton 
                onClick={() => setPaymentDialogOpen(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          {paymentSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Payment successful! Thank you for your purchase.
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Order Summary
            </Typography>
            {cart.map((item) => (
              <Typography key={item.id} variant="body2">
                {item.title} x {item.quantity} - {item.currency} {(item.price * item.quantity).toFixed(2)}
              </Typography>
            ))}
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Total: {cart[0]?.currency} {totalPrice.toFixed(2)}
            </Typography>
          </Box>

          <div id="braintree-drop-in-container" />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCheckout}
            disabled={isProcessing || !braintreeInstance || paymentSuccess}
          >
            {isProcessing ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Processing...
              </Box>
            ) : (
              `Pay ${cart[0]?.currency} ${totalPrice.toFixed(2)}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}