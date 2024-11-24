'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Snackbar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as FulfillIcon
} from '@mui/icons-material';
import medusaClient from '@/lib/medusa-client';

export default function OrdersPage() {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Debug logging function
  const logDebug = (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Orders Debug] ${message}`, data || '');
    }
  };

  // Fetch orders with error handling
  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      logDebug('Fetching orders...');

      const { orders } = await medusaClient.admin.orders.list();
      logDebug('Orders fetched successfully', orders);
      
      // Sort orders by date
      const sortedOrders = orders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setOrders(sortedOrders);
    } catch (err) {
      logDebug('Error fetching orders:', err);
      const errorMessage = err.message || 'Failed to load orders';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    logDebug('Component mounted');
    fetchOrders();

    // Refresh orders every 5 minutes
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 300000);

    return () => {
      clearInterval(interval);
      logDebug('Component unmounted');
    };
  }, []);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    logDebug('Page changed to:', newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    logDebug('Rows per page changed to:', newRowsPerPage);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
    logDebug('Viewing order details:', order.id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    logDebug('Closed order details dialog');
  };

  const handleFulfillOrder = async (orderId) => {
    try {
      setFulfilling(true);
      logDebug('Fulfilling order:', orderId);

      await medusaClient.admin.orders.fulfillOrder(orderId);
      
      showSnackbar('Order fulfilled successfully');
      await fetchOrders(false);
      handleCloseDialog();
    } catch (err) {
      logDebug('Error fulfilling order:', err);
      showSnackbar(err.message || 'Failed to fulfill order', 'error');
    } finally {
      setFulfilling(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showSnackbar('Copied to clipboard');
        logDebug('Copied to clipboard:', text);
      })
      .catch((err) => {
        logDebug('Error copying to clipboard:', err);
        showSnackbar('Failed to copy to clipboard', 'error');
      });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'fulfilled':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount || 0));
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Denver'
    }).format(date instanceof Date ? date : date.toDate());
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Render component
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Orders
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => fetchOrders()}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {order.id.slice(0, 8)}...
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(order.id)}
                            sx={{ ml: 1 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        {order.customer?.email || 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewOrder(order)}
                          title="View order details"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Order Details
                </Typography>
                <Chip 
                  label={selectedOrder.status} 
                  color={getStatusColor(selectedOrder.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Order Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Order Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Amount:</strong> {formatCurrency(selectedOrder.total)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payment Status:</strong> {selectedOrder.payment_status || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fulfillment Status:</strong> {selectedOrder.fulfillment_status || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}
                    </Typography>
                    {selectedOrder.customer?.firstName && (
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Shipping Address */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {selectedOrder.shipping_address ? (
                      <>
                        <Typography variant="body2">
                          {selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.shipping_address.address1}
                        </Typography>
                        {selectedOrder.shipping_address.address2 && (
                          <Typography variant="body2">
                            {selectedOrder.shipping_address.address2}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.shipping_address.country}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2">No shipping address provided</Typography>
                    )}
                  </Box>
                </Grid>

                {/* Billing Address */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Billing Address
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {selectedOrder.billing_address ? (
                      <>
                        <Typography variant="body2">
                          {selectedOrder.billing_address.firstName} {selectedOrder.billing_address.lastName}
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.billing_address.address1}
                        </Typography>
                        {selectedOrder.billing_address.address2 && (
                          <Typography variant="body2">
                            {selectedOrder.billing_address.address2}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state} {selectedOrder.billing_address.postal_code}
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.billing_address.country}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2">No billing address provided</Typography>
                    )}
                  </Box>
                </Grid>

                {/* Order Items */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Subtotal</strong>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(selectedOrder.subtotal)}
                          </TableCell>
                        </TableRow>
                        {selectedOrder.shipping_total > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <strong>Shipping</strong>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(selectedOrder.shipping_total)}
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedOrder.tax_total > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <strong>Tax</strong>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(selectedOrder.tax_total)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Total</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(selectedOrder.total)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedOrder.status === 'pending' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleFulfillOrder(selectedOrder.id)}
                  disabled={fulfilling}
                  startIcon={<FulfillIcon />}
                >
                  {fulfilling ? 'Fulfilling...' : 'Fulfill Order'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}