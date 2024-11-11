// src/components/ShoppingCart.js
'use client';

import React, { useState, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useShoppingCart } from '@/app/hooks/useShoppingCart';
import { useAuth } from '@/context/AuthContext';  // Add this import
import dropin from 'braintree-web-drop-in';
import { useBraintree } from '@/context/BraintreeProvider';

function ShoppingCart() {
  // State management
  const { braintreeLoaded } = useBraintree();
  const { user, loading: authLoading } = useAuth(); // Add auth context
  const { items, removeFromCart, clearCart } = useShoppingCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize Braintree when cart opens
  const initializeBraintreePayments = async () => {
    try {
      if (!braintreeLoaded) {
        throw new Error('Braintree not loaded');
      }

      // Clean up any existing instance
      if (braintreeInstance) {
        await braintreeInstance.teardown();
        setBraintreeInstance(null);
      }

      const tokenResponse = await fetch('/api/braintree/token');
      if (!tokenResponse.ok) {
        throw new Error(`Failed to fetch token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      const dropinInstance = await window.braintree.dropin.create({
        authorization: tokenData.clientToken,
        container: '#braintree-payment-container',
        paypal: {
          flow: 'checkout',
          amount: calculateCartTotal().toFixed(2),
          currency: 'USD'
        }
      });

      setBraintreeInstance(dropinInstance);

    } catch (error) {
      console.error('Checkout initialization error:', error);
      setErrorMessage(error.message);
    }
  };

  // Calculate total cart value
  const calculateCartTotal = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Handle opening the cart
  const handleOpenCart = () => {
    setIsCartOpen(true);
    if (items.length > 0) {
      initializeBraintreePayments();
    }
  };

  // Handle closing the cart
  const handleCloseCart = () => {
    setIsCartOpen(false);
    setErrorMessage(null);
  };

  // Handle removing items
  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    if (items.length === 1) { // If this is the last item
      handleCloseCart();
    }
  };

  // Handle checkout process
  const handleCheckoutSubmit = async (event) => {
    if (!braintreeInstance) {
      setErrorMessage('Payment system not initialized');
      return;
    }
  
    setIsLoading(true);
    setErrorMessage(null);
  
    try {
      const { nonce } = await braintreeInstance.requestPaymentMethod();
      
      const response = await fetch('/api/braintree/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          amount: calculateCartTotal().toFixed(2),
          items: items.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price
          }))
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        clearCart();
        handleCloseCart();
        window.location.href = '/checkout/success';
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, [braintreeInstance]);

  // Render cart icon with badge
  const CartIcon = () => (
    <Box sx={{ position: 'fixed', right: '20px', top: '20px', zIndex: 1200 }}>
      <IconButton 
        onClick={handleOpenCart}
        sx={{
          backgroundColor: 'white',
          boxShadow: 3,
          '&:hover': {
            backgroundColor: 'white',
            boxShadow: 6,
          }
        }}
      >
        <Badge badgeContent={items.length} color="primary">
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Box>
  );

  // Render cart dialog
  const CartDialog = () => (
    <Dialog 
      open={isCartOpen}
      onClose={handleCloseCart}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          right: 0,
          margin: 0,
          height: '100%',
          maxHeight: '100vh',
          borderRadius: '0',
          width: {
            xs: '100%',
            sm: '500px'
          },
          overflow: 'hidden' // Prevent double scrollbars
        }
      }}
    >
      {/* Dialog Header */}
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
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontSize: '1.25rem', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Shopping Cart
            {items.length > 0 && (
              <Typography 
                component="span" 
                variant="subtitle2" 
                sx={{ 
                  ml: 1, 
                  color: 'text.secondary',
                  display: 'inline-flex',
                  alignItems: 'center' 
                }}
              >
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </Typography>
            )}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleCloseCart} 
          size="small"
          aria-label="close cart"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
  
      {/* Dialog Content */}
      <DialogContent sx={{ p: 2, overflowY: 'auto' }}>
        {/* Loading State */}
        {isLoading && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              p: 4 
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Preparing checkout...
            </Typography>
          </Box>
        )}
  
        {/* Error Messages */}
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ 
              marginBottom: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => initializeBraintreePayments()}
              >
                Retry
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}
  
        {/* Empty Cart State */}
        {items.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>Your cart is empty</Typography>
            <Button 
              variant="contained" 
              onClick={handleCloseCart}
              startIcon={<ShoppingCartIcon />}
            >
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <Box>
            {/* Cart Items Table */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                marginBottom: 2,
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
                    <TableCell padding="checkbox"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.title}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${parseFloat(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell 
                      colSpan={3} 
                      align="right"
                      sx={{ 
                        borderBottom: 'none',
                        typography: 'subtitle1'
                      }}
                    >
                      <strong>Total:</strong>
                    </TableCell>
                    <TableCell 
                      align="right" 
                      colSpan={2}
                      sx={{ 
                        borderBottom: 'none',
                        typography: 'h6'
                      }}
                    >
                      <strong>${calculateCartTotal().toFixed(2)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
  
            {/* Braintree Payment Container */}
            <Box 
              id="braintree-payment-container" 
              sx={{ 
                marginBottom: 2,
                minHeight: '300px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                '& iframe': {
                  width: '100% !important',
                  minHeight: '200px'
                },
                '& .braintree-option': {
                  borderColor: 'divider'
                },
                '& .braintree-upper-container': {
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }
              }} 
            />
          </Box>
        )}
      </DialogContent>
  
      {/* Dialog Actions */}
      <DialogActions 
        sx={{ 
          padding: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between'
        }}
      >
        <Button 
          onClick={handleCloseCart}
          startIcon={<ArrowBackIcon />}
        >
          Continue Shopping
        </Button>
        {items.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckoutSubmit}
            disabled={isLoading || !braintreeInstance}
            endIcon={!isLoading && <ArrowForwardIcon />}
            sx={{ 
              minWidth: 150,
              position: 'relative'
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress 
                  size={24} 
                  color="inherit" 
                  sx={{ 
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                <span style={{ visibility: 'hidden' }}>Processing</span>
              </>
            ) : (
              `Checkout ($${calculateCartTotal().toFixed(2)})`
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <CartIcon />
      <CartDialog />
    </>
  );
}

export default ShoppingCart;