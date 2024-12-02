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
    ContentCopy as ContentCopyIcon,
    Error as ErrorIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

// Firebase Functions base URL for API calls
const FIREBASE_FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net'
    : 'http://localhost:3000';

// Braintree script URL for payment processing
const BRAINTREE_SCRIPT_URL = 'https://js.braintreegateway.com/web/dropin/1.33.7/js/dropin.min.js';

// Error messages for various payment scenarios
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
    GATEWAY_ERROR: "Payment system temporarily unavailable. Please try again shortly."
};

// United States state data for shipping form
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
].sort((firstState, secondState) => firstState.name.localeCompare(secondState.name));

// Payment Error Dialog Component
const PaymentErrorDialog = function({ open, message, onClose, isWarning }) {
  return (
      <Dialog 
          open={open} 
          onClose={onClose}
          maxWidth="sm"
          fullWidth={true}
      >
          <DialogContent 
              sx={{ 
                  textAlign: 'center', 
                  paddingTop: 4,
                  paddingBottom: 4 
              }}
          >
              {isWarning === true ? (
                  <WarningIcon 
                      sx={{ 
                          fontSize: 48, 
                          color: 'warning.main', 
                          marginBottom: 2 
                      }} 
                  />
              ) : (
                  <ErrorIcon 
                      sx={{ 
                          fontSize: 48, 
                          color: 'error.main', 
                          marginBottom: 2 
                      }} 
                  />
              )}
              
              <Typography 
                  variant="h6" 
                  gutterBottom={true}
              >
                  {isWarning === true ? 'Payment Declined' : 'Payment Error'}
              </Typography>
              
              <Typography 
                  color="text.secondary" 
                  sx={{ 
                      marginBottom: 3 
                  }}
              >
                  {message}
              </Typography>
              
              <Box 
                  sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 2 
                  }}
              >
                  <Button 
                      variant="outlined" 
                      onClick={onClose}
                  >
                      Close
                  </Button>
                  
                  <Button
                      variant="contained"
                      onClick={onClose}
                      color={isWarning === true ? 'warning' : 'primary'}
                  >
                      Try Again
                  </Button>
              </Box>
          </DialogContent>
      </Dialog>
  );
};

// Empty Cart Component
const EmptyCartState = function() {
  return (
      <Card 
          sx={{ 
              maxWidth: 600, 
              margin: '20px auto', 
              paddingTop: 6,
              paddingBottom: 6 
          }}
      >
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
                          marginBottom: 2
                      }} 
                  />
                  
                  <Typography 
                      variant="h5" 
                      color="text.primary" 
                      gutterBottom={true}
                  >
                      Your Cart is Empty
                  </Typography>
                  
                  <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      sx={{ 
                          maxWidth: '80%', 
                          marginBottom: 3 
                      }}
                  >
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
};

// Success Dialog Component
const SuccessState = function({ orderId, onClose }) {
  return (
      <Dialog 
          open={true} 
          onClose={onClose}
          maxWidth="sm"
          fullWidth={true}
      >
          <Box 
              sx={{ 
                  padding: 4, 
                  textAlign: 'center' 
              }}
          >
              <Typography
                  component="div"
                  sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: 'success.light',
                      color: 'success.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px'
                  }}
              >
                  <CheckCircleIcon 
                      sx={{ 
                          fontSize: 40 
                      }} 
                  />
              </Typography>
              
              <Typography 
                  variant="h5" 
                  gutterBottom={true}
              >
                  Order Successful!
              </Typography>
              
              <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  paragraph={true}
              >
                  Thank you for your purchase. Your order has been received and is being processed.
              </Typography>
              
              {orderId && (
                  <Box 
                      sx={{ 
                          backgroundColor: 'grey.50', 
                          padding: 2, 
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          marginBottom: 3
                      }}
                  >
                      <Typography 
                          variant="body2" 
                          color="text.secondary"
                      >
                          Order ID:
                      </Typography>
                      
                      <Typography 
                          variant="body2" 
                          color="text.primary" 
                          sx={{ 
                              fontWeight: 'medium' 
                          }}
                      >
                          {orderId}
                      </Typography>
                      
                      <IconButton 
                          size="small"
                          onClick={function() {
                              navigator.clipboard.writeText(orderId);
                          }}
                          sx={{ 
                              marginLeft: 1 
                          }}
                      >
                          <ContentCopyIcon fontSize="small" />
                      </IconButton>
                  </Box>
              )}

              <Box 
                  sx={{ 
                      marginTop: 3, 
                      display: 'flex', 
                      gap: 2, 
                      justifyContent: 'center' 
                  }}
              >
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
};

// PART 3
// Main Shopping Cart Component
const ShoppingCartComponent = function({ items = [], onUpdateQuantity, onRemoveItem }) {
  // Loading and Error State Management
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentErrorDialogOpen, setPaymentErrorDialogOpen] = useState(false);
  const [paymentErrorIsWarning, setPaymentErrorIsWarning] = useState(false);
  
  // Braintree and Checkout Flow State Management
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // User Message State Management
  const [snackbarMessage, setSnackbarMessage] = useState({
      open: false,
      message: '',
      severity: 'info'
  });
  
  // Shipping Information State Management
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

  // Braintree Instance Cleanup Function
  const cleanupBraintree = async function() {
      if (braintreeInstance !== null) {
          try {
              await braintreeInstance.teardown();
              setBraintreeInstance(null);
          } catch (error) {
              console.error('Error tearing down Braintree:', error);
          }
      }
  };

  // Load Braintree Script Effect
  useEffect(function() {
      const loadBraintreeScript = async function() {
          try {
              const existingScript = document.querySelector(
                  `script[src="${BRAINTREE_SCRIPT_URL}"]`
              );
              
              if (existingScript === null) {
                  const script = document.createElement('script');
                  script.src = BRAINTREE_SCRIPT_URL;
                  script.async = true;
                  
                  await new Promise(function(resolve, reject) {
                      script.onload = resolve;
                      script.onerror = reject;
                      document.body.appendChild(script);
                  });
              }
              
              setScriptsLoaded(true);
          } catch (error) {
              console.error('Error loading Braintree script:', error);
              handlePaymentError(
                  new Error('Failed to load payment system'),
                  false
              );
          }
      };

      loadBraintreeScript();

      // Cleanup function
      return function() {
          cleanupBraintree();
      };
  }, []); // Empty dependency array for mount-only effect

  // Initialize Braintree When Moving to Payment Step Effect
  useEffect(function() {
      const initializeBraintreeIfNeeded = async function() {
          if (
              items.length > 0 && 
              braintreeInstance === null && 
              activeStep === 1 && 
              scriptsLoaded === true
          ) {
              const container = document.getElementById('dropin-container');
              
              if (container !== null) {
                  container.innerHTML = '';
                  await fetchClientToken();
              }
          }
      };

      initializeBraintreeIfNeeded();
  }, [items.length, activeStep, scriptsLoaded, braintreeInstance]);

  // Error Handling Function
  const handlePaymentError = function(error, isWarning = false) {
      console.error('Payment error:', error);
      
      let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
      
      if (error.message) {
          if (error.message.includes('Processor Declined')) {
              errorMessage = ERROR_MESSAGES.PROCESSOR_DECLINED;
              isWarning = true;
          } else if (error.message.includes('Fraud Suspected')) {
              errorMessage = ERROR_MESSAGES.FRAUD_SUSPECTED;
              isWarning = true;
          } else if (error.message.includes('Insufficient Funds')) {
              errorMessage = ERROR_MESSAGES.INSUFFICIENT_FUNDS;
              isWarning = true;
          } else if (error.message.includes('CVV')) {
              errorMessage = ERROR_MESSAGES.CVV_VERIFICATION;
              isWarning = true;
          } else if (error.message.includes('Postal Code')) {
              errorMessage = ERROR_MESSAGES.POSTAL_CODE;
              isWarning = true;
          } else if (error.message.includes('Expired Card')) {
              errorMessage = ERROR_MESSAGES.EXPIRED_CARD;
              isWarning = true;
          } else if (error.message.includes('Network Error')) {
              errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
          } else if (error.message.includes('Gateway')) {
              errorMessage = ERROR_MESSAGES.GATEWAY_ERROR;
          }
      }

      setPaymentError(errorMessage);
      setPaymentErrorIsWarning(isWarning);
      setPaymentErrorDialogOpen(true);
      
      if (isWarning === false) {
          setSnackbarMessage({
              open: true,
              message: "There was an issue processing your payment",
              severity: 'error'
          });
      }
  };

  // Dialog and Snackbar Management Functions
  const handleCloseErrorDialog = function() {
      setPaymentErrorDialogOpen(false);
      setPaymentError(null);
      setPaymentErrorIsWarning(false);
  };

  const handleSnackbarClose = function() {
      setSnackbarMessage(function(previousState) {
          return {
              ...previousState,
              open: false
          };
      });
  };

// part 4
// Cart Management Helper Functions
const calculateTotal = function() {
  return items.reduce(function(sum, item) {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
  }, 0);
};

const validateShippingInfo = function() {
  const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'address',
      'city',
      'state',
      'zipCode'
  ];
  
  return requiredFields.every(function(field) {
      return shippingInfo[field] && 
             shippingInfo[field].trim() !== '';
  });
};

// Braintree Integration Functions
const fetchClientToken = async function() {
  try {
      console.log('Attempting to fetch client token from:', `${FIREBASE_FUNCTIONS_BASE_URL}/braintree/client-token`);
      
      const response = await fetch(
        `${FIREBASE_FUNCTIONS_BASE_URL}/api/braintree/client-token`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
      
      if (!response.ok) {
          console.error('Client token fetch failed with status:', response.status);
          throw new Error('Failed to fetch client token');
      }

      const data = await response.json();
      console.log('Client token response received');
      
      if (data.clientToken) {
          await initializeBraintree(data.clientToken);
      } else {
          throw new Error('No client token received in response');
      }
  } catch (error) {
      console.error('Error fetching client token:', error);
      handlePaymentError(new Error('Failed to initialize payment system'));
  }
};

const initializeBraintree = async function(token) {
    try {
        // Verify Braintree is loaded
        if (!window.braintree) {
            throw new Error('Braintree script not loaded');
        }

        // Clear existing container
        const dropinContainer = document.getElementById('dropin-container');
        if (dropinContainer) {
            dropinContainer.innerHTML = '';
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DOM update
        }

        // Create new Braintree instance
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
                },
                buttonStyle: {
                    color: 'blue',
                    shape: 'rect',
                    size: 'responsive'
                }
            },
            card: {
                cardholderName: {
                    required: true
                }
            },
            venmo: {
                allowNewBrowserTab: false
            },
            callbacks: {
                onError: function(error) {
                    handlePaymentError(error);
                },
                onPaymentMethodRequestable: function() {
                    setSnackbarMessage({
                        open: true,
                        message: "Payment method ready",
                        severity: 'success'
                    });
                }
            }
        });
        
        console.log('Braintree instance created successfully');
        setBraintreeInstance(instance);
        return instance;
    } catch (error) {
        console.error('Error initializing Braintree:', error);
        handlePaymentError(error);
        return null;
    }
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
        // Get payment method from Braintree
        const paymentMethodResult = await braintreeInstance.requestPaymentMethod();
        
        // Update user profile if logged in
        if (auth.currentUser) {
            try {
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
            } catch (error) {
                console.error('Error updating user profile:', error);
            }
        }

        // Process payment through Firebase Functions
        const checkoutResponse = await fetch(
            `${FIREBASE_FUNCTIONS_BASE_URL}/api/braintree/process-payment`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    paymentMethodNonce: paymentMethodResult.nonce,
                    paymentType: paymentMethodResult.type,
                    amount: calculateTotal().toFixed(2),
                    items: items.map(function(item) {
                        return {
                            ...item,
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                        };
                    }),
                    shipping: {
                        firstName: shippingInfo.firstName,
                        lastName: shippingInfo.lastName,
                        email: shippingInfo.email,
                        address: shippingInfo.address,
                        address2: shippingInfo.address2 || undefined,
                        city: shippingInfo.city,
                        state: shippingInfo.state,
                        zipCode: shippingInfo.zipCode,
                        country: shippingInfo.country
                    },
                    userId: auth.currentUser?.uid,
                    paymentDetails: paymentMethodResult.details
                })
            }
        );

        if (!checkoutResponse.ok) {
            const errorData = await checkoutResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Payment failed: ${checkoutResponse.statusText}`);
        }

        const result = await checkoutResponse.json();

        if (result.success) {
            // Clear cart
            items.forEach(function(item) {
                onRemoveItem(item.id);
            });
            
            // Clean up Braintree
            await cleanupBraintree();
            
            // Show success dialog
            setOrderSuccess({
                orderId: result.orderId,
                transactionId: result.transaction?.id
            });
            
            // Reset form and step
            setActiveStep(0);
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

            setSnackbarMessage({
                open: true,
                message: "Order placed successfully!",
                severity: 'success'
            });
        } else {
            throw new Error(result.error || 'Payment failed');
        }
    } catch (error) {
        handlePaymentError(error);
        
        try {
            await cleanupBraintree();
            await fetchClientToken();
        } catch (reinitError) {
            console.error('Error reinitializing Braintree:', reinitError);
        }
    } finally {
        setIsLoading(false);
    }
};

const handleShippingSubmit = function(event) {
    event.preventDefault();
    if (validateShippingInfo()) {
        setActiveStep(1);
        setSnackbarMessage({
            open: true,
            message: "Please complete your payment details",
            severity: 'info'
        });
    }
};

const handleShippingInfoChange = function(field) {
  return function(event) {
      setShippingInfo(function(previousState) {
          return {
              ...previousState,
              [field]: event.target.value
          };
      });
  };
};

// Early return for empty cart
if (items.length === 0) {
  return <EmptyCartState />;
}

// Main Component Render
return (
  <>
      <Card sx={{ maxWidth: 600, margin: '20px auto' }}>
          <CardContent>
              <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom={true}
              >
                  Shopping Cart
              </Typography>

              <Stepper 
                  activeStep={activeStep} 
                  sx={{ marginBottom: 4 }}
              >
                  <Step>
                      <StepLabel>Shipping</StepLabel>
                  </Step>
                  <Step>
                      <StepLabel>Payment</StepLabel>
                  </Step>
              </Stepper>
              
              {/* Cart Items and Shipping Form Step */}
              {activeStep === 0 && (
                  <>
                      {/* Cart Items List */}
                      {items.map(function(item) {
                          return (
                              <Box key={item.id}>
                                  <Box sx={{ 
                                      display: 'flex', 
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      alignItems: 'center' 
                                  }}>
                                      <Box sx={{ flexGrow: 1 }}>
                                          <Typography variant="subtitle1">
                                              {item.title}
                                          </Typography>
                                          <Typography 
                                              variant="body2" 
                                              color="text.secondary"
                                          >
                                              {item.currency?.toUpperCase() || 'USD'} {Number(item.price).toFixed(2)}
                                          </Typography>
                                      </Box>
                                      
                                      <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: 2 
                                      }}>
                                          <Select
                                              size="small"
                                              value={item.quantity}
                                              onChange={function(event) {
                                                  onUpdateQuantity(
                                                      item.id, 
                                                      parseInt(event.target.value)
                                                  );
                                              }}
                                              sx={{ minWidth: 80 }}
                                          >
                                              {[1, 2, 3, 4, 5].map(function(num) {
                                                  return (
                                                      <MenuItem 
                                                          key={num} 
                                                          value={num}
                                                      >
                                                          {num}
                                                      </MenuItem>
                                                  );
                                              })}
                                          </Select>
                                          
                                          <IconButton
                                              onClick={function() {
                                                  onRemoveItem(item.id);
                                                  setSnackbarMessage({
                                                      open: true,
                                                      message: "Item removed from cart",
                                                      severity: 'info'
                                                  });
                                              }}
                                              size="small"
                                              color="error"
                                          >
                                              <DeleteIcon />
                                          </IconButton>
                                      </Box>
                                  </Box>
                                  <Divider />
                              </Box>
                          );
                      })}

                      {/* Cart Total */}
                      <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          marginTop: 2, 
                          marginBottom: 4,
                          gap: 2,
                          alignItems: 'baseline'
                      }}>
                          <Typography variant="body1">
                              Total:
                          </Typography>
                          <Typography variant="h6">
                              {items[0]?.currency?.toUpperCase() || 'USD'} {calculateTotal().toFixed(2)}
                          </Typography>
                      </Box>

                      {/* part 6 */}

                      {/* Shipping Information Form */}
                      <form onSubmit={handleShippingSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required={true}
                                            fullWidth={true}
                                            label="First Name"
                                            value={shippingInfo.firstName}
                                            onChange={handleShippingInfoChange('firstName')}
                                            error={!shippingInfo.firstName && shippingInfo.firstName !== ''}
                                            helperText={
                                                !shippingInfo.firstName && 
                                                shippingInfo.firstName !== '' ? 
                                                'First name is required' : ''
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required={true}
                                            fullWidth={true}
                                            label="Last Name"
                                            value={shippingInfo.lastName}
                                            onChange={handleShippingInfoChange('lastName')}
                                            error={!shippingInfo.lastName && shippingInfo.lastName !== ''}
                                            helperText={
                                                !shippingInfo.lastName && 
                                                shippingInfo.lastName !== '' ? 
                                                'Last name is required' : ''
                                            }
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
                                            error={!shippingInfo.email && shippingInfo.email !== ''}
                                            helperText={
                                                !shippingInfo.email && 
                                                shippingInfo.email !== '' ? 
                                                'Valid email is required' : ''
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            required={true}
                                            fullWidth={true}
                                            label="Address Line 1"
                                            value={shippingInfo.address}
                                            onChange={handleShippingInfoChange('address')}
                                            error={!shippingInfo.address && shippingInfo.address !== ''}
                                            helperText={
                                                !shippingInfo.address && 
                                                shippingInfo.address !== '' ?
                                                'Street address is required' :
                                                'Street address, P.O. box'
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth={true}
                                            label="Address Line 2 (Optional)"
                                            value={shippingInfo.address2}
                                            onChange={handleShippingInfoChange('address2')}
                                            helperText="Apartment, suite, unit, building, floor, etc."
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required={true}
                                            fullWidth={true}
                                            label="City"
                                            value={shippingInfo.city}
                                            onChange={handleShippingInfoChange('city')}
                                            error={!shippingInfo.city && shippingInfo.city !== ''}
                                            helperText={
                                                !shippingInfo.city && 
                                                shippingInfo.city !== '' ? 
                                                'City is required' : ''
                                            }
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
                                            error={!shippingInfo.state && shippingInfo.state !== ''}
                                            helperText={!shippingInfo.state ? 'Please select your state' : ''}
                                        >
                                            {US_STATES.map(function(state) {
                                                return (
                                                    <MenuItem 
                                                        key={state.code} 
                                                        value={state.code}
                                                    >
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
                                            error={!shippingInfo.zipCode && shippingInfo.zipCode !== ''}
                                            helperText={
                                                !shippingInfo.zipCode && 
                                                shippingInfo.zipCode !== '' ? 
                                                'ZIP code is required' : ''
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth={true}
                                            disabled={!validateShippingInfo()}
                                            sx={{ marginTop: 2 }}
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
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginBottom: 3 
                            }}>
                                <Typography variant="h6">
                                    Order Summary
                                </Typography>
                                <Typography variant="h6">
                                    {items[0]?.currency?.toUpperCase() || 'USD'} {calculateTotal().toFixed(2)}
                                </Typography>
                            </Box>

                            {paymentError && (
                                <Alert 
                                    severity="error" 
                                    sx={{ marginBottom: 3 }}
                                >
                                    {paymentError}
                                </Alert>
                            )}

                            <div id="dropin-container"></div>

                            <Box sx={{ marginTop: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={function() {
                                        setActiveStep(0);
                                        cleanupBraintree();
                                    }}
                                    sx={{ flex: 1 }}
                                    disabled={isLoading}
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
                                    {isLoading ? (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1 
                                        }}>
                                            <CircularProgress 
                                                size={24} 
                                                color="inherit" 
                                            />
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

            {/* part 7 */}

            {/* Success Dialog */}
            {orderSuccess !== null && (
                <SuccessState
                    orderId={orderSuccess.orderId}
                    onClose={function() {
                        setOrderSuccess(null);
                    }}
                />
            )}

            {/* Error Dialog */}
            <PaymentErrorDialog
                open={paymentErrorDialogOpen}
                message={paymentError}
                onClose={handleCloseErrorDialog}
                isWarning={paymentErrorIsWarning}
            />

            {/* Snackbar Notifications */}
            <Snackbar
                open={snackbarMessage.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ 
                    vertical: 'bottom', 
                    horizontal: 'center' 
                }}
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
};

// Export the component
export default ShoppingCartComponent;