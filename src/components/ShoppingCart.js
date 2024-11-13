


// src/components/ShoppingCart.js
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Badge,
  Paper,
  Snackbar
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useShoppingCart } from '@/app/hooks/useShoppingCart';
import { useAuth } from '@/context/AuthContext';
import { useBraintree } from '@/context/BraintreeProvider';

function ShoppingCart() {
  // Core state management
  const { items, removeFromCart, clearCart } = useShoppingCart();
  const { user } = useAuth();

  // State for UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // State for Braintree
  const [clientToken, setClientToken] = useState(null);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  
  // Refs for tracking initialization
  const tokenFetchInProgress = useRef(false);
  const dropinInitInProgress = useRef(false);
  const isComponentMounted = useRef(true);

  // Calculate total with memoization
  const calculateCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + (itemPrice * quantity);
    }, 0);
  }, [items]);

  // Clean up effect
  useEffect(() => {
    // Set mounted flag
    isComponentMounted.current = true;

    // Cleanup function
    return () => {
      isComponentMounted.current = false;
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, []);

  // Token fetching function
  const fetchClientToken = async () => {
    if (tokenFetchInProgress.current) return null;
    
    try {
      tokenFetchInProgress.current = true;
      const response = await fetch('/api/braintree/token');
      const data = await response.json();

      if (!isComponentMounted.current) return null;

      if (!data.success || !data.clientToken) {
        throw new Error('Failed to get payment token');
      }

      setClientToken(data.clientToken);
      return data.clientToken;
    } catch (error) {
      console.error('Token fetch error:', error);
      if (isComponentMounted.current) {
        setErrorMessage('Could not initialize payment system');
      }
      return null;
    } finally {
      tokenFetchInProgress.current = false;
    }
  };

  // Braintree initialization function
  const initializeBraintree = async (token) => {
    if (dropinInitInProgress.current || !window.braintree) return;
    
    try {
      dropinInitInProgress.current = true;
      const dropinInstance = await window.braintree.dropin.create({
        authorization: token,
        container: '#braintree-payment-container',
        card: {
          overrides: {
            styles: {
              input: {
                'font-size': '16px',
                'font-family': 'inherit'
              }
            }
          }
        },
        paypal: false,
        venmo: false,
        applePay: false,
        googlePay: false
      });

      if (!isComponentMounted.current) {
        await dropinInstance.teardown();
        return;
      }

      setBraintreeInstance(dropinInstance);
      setErrorMessage(null);
    } catch (error) {
      console.error('Dropin creation error:', error);
      if (isComponentMounted.current) {
        setErrorMessage('Failed to load payment form');
      }
    } finally {
      dropinInitInProgress.current = false;
    }
  };

  // Cart open handler
  const handleOpenCart = async () => {
    setIsCartOpen(true);
    setIsLoading(true);

    try {
      // Get token if we don't have one
      const token = clientToken || await fetchClientToken();
      if (!token) {
        throw new Error('Could not get payment token');
      }

      // Initialize dropin if we don't have an instance
      if (!braintreeInstance) {
        await initializeBraintree(token);
      }
    } catch (error) {
      console.error('Cart opening error:', error);
      setErrorMessage(error.message);
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Cart close handler
  const handleCloseCart = async () => {
    setIsLoading(true);
    try {
      if (braintreeInstance) {
        await braintreeInstance.teardown();
      }
    } catch (error) {
      console.error('Teardown error:', error);
    } finally {
      if (isComponentMounted.current) {
        setBraintreeInstance(null);
        setClientToken(null);
        setErrorMessage(null);
        setIsLoading(false);
        setIsCartOpen(false);
      }
    }
  };

  // Payment submission handler
  const handleCheckoutSubmit = async () => {
    if (!braintreeInstance) return;

    setIsLoading(true);
    try {
      // Get payment nonce
      const { nonce } = await braintreeInstance.requestPaymentMethod();
      if (!nonce) {
        throw new Error('Payment information not available');
      }

      // Send payment to server
      const response = await fetch('/api/braintree/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          amount: calculateCartTotal().toFixed(2)
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }

      // Handle success
      setSnackbarMessage('Payment processed successfully!');
      setSnackbarOpen(true);
      clearCart();
      await handleCloseCart();

    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message);
      setSnackbarMessage('Payment failed. Please try again.');
      setSnackbarOpen(true);
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Item removal handler
  const handleRemoveItem = useCallback((itemId) => {
    removeFromCart(itemId);
    // Close cart if removing last item
    if (items.length === 1) {
      handleCloseCart();
    }
  }, [items.length, removeFromCart]);

  // Cart Icon Component - memoized to prevent unnecessary rerenders
  const CartIcon = useCallback(() => (
    <Box sx={{ 
      position: 'fixed', 
      right: '20px', 
      top: '20px', 
      zIndex: 1200 
    }}>
      <IconButton 
        onClick={handleOpenCart}
        aria-label={`Shopping cart with ${items.length} items`}
        disabled={isLoading}
        sx={{
          backgroundColor: 'white',
          boxShadow: 3,
          '&:hover': {
            backgroundColor: 'white',
            boxShadow: 6,
          },
          transition: 'box-shadow 0.3s ease',
          padding: '12px'
        }}
      >
        <Badge 
          badgeContent={items.length} 
          color="primary"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: '22px',
              minWidth: '22px',
              padding: '0 6px'
            }
          }}
        >
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Box>
  ), [items.length, isLoading, handleOpenCart]);

  // Cart Dialog Content Component - extracted for readability
  const CartContent = useCallback(() => {
    if (items.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          py: 4,
          gap: 2
        }}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6">Your cart is empty</Typography>
          <Button 
            variant="contained" 
            onClick={handleCloseCart}
            startIcon={<ArrowBackIcon />}
          >
            Continue Shopping
          </Button>
        </Box>
      );
    }

    return (
      <>
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell align="right">
                    ${parseFloat(item.price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Total:
                </TableCell>
                <TableCell align="right" colSpan={2} sx={{ fontWeight: 'bold' }}>
                  ${calculateCartTotal().toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment Form Container */}
        {clientToken && (
          <Box 
            id="braintree-payment-container" 
            sx={{ 
              minHeight: '250px',
              width: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              bgcolor: 'background.paper',
              visibility: isLoading ? 'hidden' : 'visible',
              '& iframe': {
                width: '100% !important'
              }
            }} 
          />
        )}

        <DialogActions sx={{ 
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={handleCloseCart}
            startIcon={<ArrowBackIcon />}
            disabled={isLoading}
          >
            Continue Shopping
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckoutSubmit}
            disabled={isLoading || !braintreeInstance}
            endIcon={!isLoading && <ArrowForwardIcon />}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Pay ${calculateCartTotal().toFixed(2)}`
            )}
          </Button>
        </DialogActions>
      </>
    );
  }, [items, isLoading, braintreeInstance, clientToken, calculateCartTotal, handleRemoveItem]);

  // Main Cart Dialog Component
  const CartDialog = useCallback(() => (
    <Dialog 
      open={isCartOpen}
      onClose={isLoading ? undefined : handleCloseCart}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          right: 0,
          margin: 0,
          height: '100%',
          maxHeight: '100vh',
          borderRadius: {
            xs: 0,
            sm: '4px 0 0 4px'
          },
          width: {
            xs: '100%',
            sm: '500px'
          },
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="div" variant="h6">
            Shopping Cart 
            {items.length > 0 && (
              <Typography 
                component="span" 
                variant="subtitle2" 
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </Typography>
            )}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleCloseCart} 
          size="small"
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Loading Overlay */}
        {isLoading && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 1300
            }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              {!clientToken ? 'Initializing payment...' : 'Processing...'}
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="error" 
                size="small"
                onClick={() => {
                  setErrorMessage(null);
                  if (!clientToken) {
                    fetchClientToken();
                  }
                }}
                disabled={isLoading}
              >
                Retry
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}

        <CartContent />
      </DialogContent>
    </Dialog>
  ), [isCartOpen, isLoading, items.length, errorMessage, clientToken]);

  // Main render
  return (
    <>
      <CartIcon />
      <CartDialog />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export default ShoppingCart;