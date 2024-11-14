// src/components/ShoppingCart.js
'use client';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
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
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

import { useShoppingCart } from '@/app/hooks/useShoppingCart';
import { useAuth } from '@/context/AuthContext';
import { useBraintree } from '@/context/BraintreeProvider'; 

function ShoppingCart() {
  // Context initialization
  const { isScriptsLoaded } = useBraintree();
  const shoppingCartContext = useShoppingCart();
  const items = shoppingCartContext.items;
  const removeFromCart = shoppingCartContext.removeFromCart;
  const clearCart = shoppingCartContext.clearCart;
  const dropinContainerRef = useRef(null);

  const authContext = useAuth();
  const user = authContext.user;

  // Component state initialization with explicit naming
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [errorMessageState, setErrorMessageState] = useState(null);
  const [braintreeInstanceState, setBraintreeInstanceState] = useState(null);
  const [snackbarOpenState, setSnackbarOpenState] = useState(false);
  const [snackbarMessageState, setSnackbarMessageState] = useState('');

  // Component mount tracking for cleanup
  const isComponentMounted = useRef(true);

  // Cart total calculation with full implementation
  const calculateCartTotal = useCallback(function calculateCartTotalAmount() {
    const totalAmount = items.reduce(function calculateTotal(accumulator, currentItem) {
      const itemPrice = parseFloat(currentItem.price);
      const itemQuantity = currentItem.quantity;
      const itemTotal = itemPrice * itemQuantity;
      return accumulator + itemTotal;
    }, 0);

    return totalAmount;
  }, [items]);

  // Braintree initialization with complete error handling
  const initializeBraintree = useCallback(async function initializeBraintreePayment() {
    // Step 1: Validate prerequisites
    if (!dropinContainerRef.current) {
      console.error('Braintree initialization failed: Container not found');
      setErrorMessageState('Payment form initialization failed');
      return;
    }
  
    if (!window.braintree) {
      console.error('Braintree initialization failed: Braintree not loaded');
      setErrorMessageState('Payment system not available');
      return;
    }
  
    // Step 2: Start initialization
    console.log('Starting Braintree initialization...');
    setIsLoadingState(true);
    setErrorMessageState(null);
  
    // Step 3: Clean container
    dropinContainerRef.current.innerHTML = '';
  
    try {
      // Step 4: Get client token
      console.log('Requesting client token...');
      const tokenResponse = await fetch('/api/braintree/token');
      const tokenData = await tokenResponse.json();
  
      if (!tokenData.success || !tokenData.clientToken) {
        throw new Error('Invalid token received from server');
      }
  
      // Step 5: Create Braintree instance
      console.log('Creating Braintree Drop-in...');
      await new Promise((resolve, reject) => {
        window.braintree.dropin.create(
          {
            authorization: tokenData.clientToken,
            container: dropinContainerRef.current,
            card: true,
            paypal: false // Explicitly disable PayPal for now
          },
          (error, instance) => {
            if (error) {
              console.error('Braintree creation failed:', error);
              reject(error);
              return;
            }
  
            if (!isComponentMounted.current) {
              // Component unmounted during initialization
              instance.teardown().catch(console.error);
              reject(new Error('Component unmounted'));
              return;
            }
  
            console.log('Braintree Drop-in created successfully');
            setBraintreeInstanceState(instance);
            resolve(instance);
          }
        );
      });
  
    } catch (error) {
      console.error('Braintree initialization error:', error);
      setErrorMessageState(
        error.message === 'Component unmounted' 
          ? null 
          : 'Failed to initialize payment form'
      );
    } finally {
      if (isComponentMounted.current) {
        setIsLoadingState(false);
      }
    }
  }, []);
  // Continuing from Part 1...
  useLayoutEffect(function handleBraintreeMount() {
    if (isCartOpen && dropinContainerRef.current && !braintreeInstanceState) {
      initializeBraintreePayment();
    }

    return function cleanup() {
      if (braintreeInstanceState) {
        braintreeInstanceState.teardown().catch(console.error);
      }
    };
  }, [isCartOpen, braintreeInstanceState, initializeBraintreePayment]);
  // Cart opening handler with complete implementation
  const handleOpenCart = useCallback(function handleCartOpening() {
    setIsCartOpen(true);
    setIsLoadingState(true);
    setErrorMessageState(null);
  }, []);

  // Cart closing handler with complete teardown
  const handleCloseCart = useCallback(async function handleCartClosing() {
    setIsLoadingState(true);
    
    try {
      if (braintreeInstanceState) {
        await braintreeInstanceState.teardown();
        setBraintreeInstanceState(null);
        
        // Clear the container after teardown
        const container = document.getElementById('dropin-container');
        if (container) {
          container.innerHTML = '';
        }
      }
    } catch (error) {
      console.error('Teardown error:', error);
    } finally {
      if (isComponentMounted.current) {
        setErrorMessageState(null);
        setIsLoadingState(false);
        setIsCartOpen(false);
      }
    }
  }, [braintreeInstanceState]);

  // Payment submission handler with complete error handling
  const handleCheckoutSubmit = useCallback(async function handlePaymentSubmission() {
    // Verify we have a Braintree instance before proceeding
    if (!braintreeInstanceState) {
      console.error('No Braintree instance available');
      return;
    }

    // Set loading state while processing payment
    setIsLoadingState(true);

    try {
      console.log('Requesting payment method...');
      const paymentMethodResult = await braintreeInstanceState.requestPaymentMethod();

      // Verify we got a payment nonce
      if (!paymentMethodResult.nonce) {
        throw new Error('No payment nonce received');
      }

      // Calculate the final amount
      const finalAmount = calculateCartTotal();

      console.log('Processing payment...');
      const paymentResponse = await fetch('/api/braintree/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodNonce: paymentMethodResult.nonce,
          amount: finalAmount.toFixed(2)
        })
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // Handle successful payment
      console.log('Payment successful');
      setSnackbarMessageState('Payment processed successfully!');
      setSnackbarOpenState(true);

      // Clear the cart
      clearCart();

      // Close the cart dialog
      await handleCloseCart();

    } catch (error) {
      console.error('Payment processing error:', error);
      setErrorMessageState('Payment processing failed. Please try again.');
      setSnackbarMessageState('Payment failed');
      setSnackbarOpenState(true);
    } finally {
      // Reset loading state if component still mounted
      if (isComponentMounted.current) {
        setIsLoadingState(false);
      }
    }
  }, [braintreeInstanceState, calculateCartTotal, clearCart, handleCloseCart]);

  // Item removal handler with complete implementation
  const handleRemoveItem = useCallback(function handleItemRemoval(itemIdToRemove) {
    console.log('Removing item:', itemIdToRemove);
    
    // Remove the item from cart
    removeFromCart(itemIdToRemove);

    // If this was the last item, close the cart
    if (items.length === 1) {
      console.log('Last item removed, closing cart...');
      handleCloseCart();
    }
  }, [items.length, removeFromCart, handleCloseCart]);

  // Component mount and unmount effect
  useEffect(function handleComponentLifecycle() {
    // Set mounted flag
    isComponentMounted.current = true;

    // Cleanup function
    return function cleanupComponent() {
      console.log('Component unmounting, cleaning up...');
      
      // Set mounted flag to false
      isComponentMounted.current = false;

      // Teardown Braintree if it exists
      if (braintreeInstanceState) {
        console.log('Tearing down Braintree instance on unmount...');
        braintreeInstanceState.teardown().catch(function handleTeardownError(error) {
          console.error('Error during unmount teardown:', error);
        });
      }
    };
  }, [braintreeInstanceState]);

  // Cart state effect for Braintree initialization
  useEffect(function handleCartStateChange() {
    let timeoutId;
    // Only proceed if cart is open and we don't have an instance
    if (isCartOpen && !braintreeInstanceState) {
      console.log('Cart opened, preparing initialization...');
      
      // Set loading state
      setIsLoadingState(true);
      
      // Clear any existing error messages
      setErrorMessageState(null);
      
      // Add a delay to ensure DOM is ready
      timeoutId = setTimeout(function delayedInitialization() {
        initializeBraintreePayment();
      }, 300); // Increased delay for better reliability
    }
  
    // Cleanup
    return function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isCartOpen, braintreeInstanceState, initializeBraintreePayment]);


  // Cart Icon Component with full implementation
  const CartIcon = useCallback(function renderCartIcon() {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: '20px',
          top: '20px',
          zIndex: 1200,
          display: 'block'
        }}
      >
        <IconButton 
          onClick={function onCartIconClick() {
            handleOpenCart();
          }}
          aria-label={`Shopping cart containing ${items.length} items`}
          disabled={isLoadingState}
          sx={{
            backgroundColor: 'white',
            boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
            '&:hover': {
              backgroundColor: 'white',
              boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            },
            transition: 'box-shadow 0.3s ease',
            padding: '12px',
            width: 'auto',
            height: 'auto'
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
                padding: '0 6px',
                fontWeight: 'bold'
              }
            }}
          >
            <ShoppingCartIcon 
              sx={{
                width: '24px',
                height: '24px'
              }}
            />
          </Badge>
        </IconButton>
      </Box>
    );
  }, [items.length, isLoadingState, handleOpenCart]);

  // Cart Content Component with full implementation
  const CartContent = useCallback(function renderCartContent() {
    // Handle empty cart state
    if (items.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0',
            gap: '16px'
          }}
        >
          <ShoppingCartIcon
            sx={{
              fontSize: '48px',
              color: 'text.secondary'
            }}
          />
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: 'text.primary',
              fontWeight: 500
            }}
          >
            Your cart is empty
          </Typography>
          <Button 
            variant="contained"
            onClick={function onContinueShoppingClick() {
              handleCloseCart();
            }}
            startIcon={<ArrowBackIcon />}
            sx={{
              marginTop: '8px'
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      );
    }

    
    // Render cart with items
    return (
      <React.Fragment>
        <TableContainer 
          component={Paper} 
          sx={{
            marginBottom: '24px',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '4px',
            boxShadow: 'none'
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    padding: '16px',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  Item
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    padding: '16px',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  Price
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    padding: '16px',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  Qty
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    padding: '16px',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  Total
                </TableCell>
                <TableCell
                  padding="checkbox"
                  sx={{
                    width: '48px',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(function renderCartItem(item) {
                const itemPrice = parseFloat(item.price);
                const itemTotal = itemPrice * item.quantity;
                
                return (
                  <TableRow 
                    key={item.id}
                    sx={{
                      '&:last-child td': {
                        borderBottom: 0
                      }
                    }}
                  >
                    <TableCell
                      sx={{
                        padding: '16px',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {item.title}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        padding: '16px',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      ${itemPrice.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        padding: '16px',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {item.quantity}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        padding: '16px',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      ${itemTotal.toFixed(2)}
                    </TableCell>
                    <TableCell
                      padding="checkbox"
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={function onRemoveItemClick() {
                          handleRemoveItem(item.id);
                        }}
                        disabled={isLoadingState}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="right"
                  sx={{
                    padding: '16px',
                    fontWeight: 700
                  }}
                >
                  Total:
                </TableCell>
                <TableCell
                  align="right"
                  colSpan={2}
                  sx={{
                    padding: '16px',
                    fontWeight: 700
                  }}
                >
                  ${calculateCartTotal().toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Braintree Payment Form - Exactly as in tutorial */}
        <div id="dropin-wrapper">
          <div id="checkout-message"></div>
          <div 
            ref={dropinContainerRef}
            style={{ 
              minHeight: '250px',
              marginBottom: '20px',
              padding: '16px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>


        <DialogActions
          sx={{
            padding: '16px 0',
            marginTop: '16px',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Button 
            onClick={function onContinueShoppingClick() {
              handleCloseCart();
            }}
            startIcon={<ArrowBackIcon />}
            disabled={isLoadingState}
            sx={{
              textTransform: 'none'
            }}
          >
            Continue Shopping
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={function onCheckoutClick() {
              handleCheckoutSubmit();
            }}
            disabled={isLoadingState || !braintreeInstanceState}
            endIcon={!isLoadingState && <ArrowForwardIcon />}
            sx={{
              textTransform: 'none',
              minWidth: '150px'
            }}
          >
            {isLoadingState ? (
              <CircularProgress 
                size={24} 
                color="inherit" 
                sx={{
                  margin: '4px'
                }}
              />
            ) : (
              `Pay $${calculateCartTotal().toFixed(2)}`
            )}
          </Button>
        </DialogActions>
      </React.Fragment>
    );
  }, [
    items,
    isLoadingState,
    braintreeInstanceState,
    calculateCartTotal,
    handleCloseCart,
    handleCheckoutSubmit,
    handleRemoveItem
  ]);

  // Continuing from Part 3...

  // Cart Dialog Component with full implementation
  const CartDialog = useCallback(function renderCartDialog() {
    return (
      <Dialog 
        open={isCartOpen}
        onClose={function onDialogClose() {
          handleCloseCart();
        }}
        maxWidth="md"
        fullWidth={true}
        aria-labelledby="cart-dialog-title"
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
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle 
          id="cart-dialog-title"
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#ffffff'
          }}
        >
          <Box
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Typography 
              component="div" 
              variant="h6"
              sx={{
                fontWeight: 500,
                color: 'text.primary'
              }}
            >
              Shopping Cart 
              {items.length > 0 && (
                <Typography 
                  component="span" 
                  variant="subtitle2" 
                  sx={{ 
                    marginLeft: '8px', 
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  ({items.length} {items.length === 1 ? 'item' : 'items'})
                </Typography>
              )}
            </Typography>
          </Box>
          <IconButton 
            onClick={function onCloseButtonClick() {
              handleCloseCart();
            }}
            size="small"
            disabled={isLoadingState}
            aria-label="Close cart"
            sx={{
              padding: '8px',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: '20px' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Loading Overlay */}
          {isLoadingState && (
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
                zIndex: 1300,
                backdropFilter: 'blur(2px)'
              }}
            >
              <CircularProgress 
                size={40}
                thickness={4}
                sx={{
                  color: 'primary.main'
                }}
              />
              <Typography 
                sx={{ 
                  marginTop: '16px',
                  color: 'text.primary',
                  fontWeight: 500
                }}
              >
                Processing...
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {errorMessageState && (
            <Alert 
              severity="error" 
              sx={{ 
                marginBottom: '16px',
                width: '100%',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              {errorMessageState}
            </Alert>
          )}

          {/* Cart Content */}
          <CartContent />
        </DialogContent>
      </Dialog>
    );
  }, [
    isCartOpen, 
    isLoadingState, 
    items.length, 
    errorMessageState, 
    handleCloseCart, 
    CartContent
  ]);

  // Final component render
  return (
    <React.Fragment>
      {/* Cart Icon */}
      <CartIcon />

      {/* Cart Dialog */}
      <CartDialog />

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpenState}
        autoHideDuration={6000}
        onClose={function handleSnackbarClose(event, reason) {
          if (reason === 'clickaway') {
            return;
          }
          setSnackbarOpenState(false);
        }}
        message={snackbarMessageState}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: 'center' 
        }}
        ContentProps={{
          sx: {
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
            minWidth: '300px',
            maxWidth: '500px'
          }
        }}
      />
    </React.Fragment>
  );
}

// Export the component
export default ShoppingCart;