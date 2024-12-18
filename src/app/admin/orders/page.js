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

  const formatCurrency = (amount) => {
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(dollars);
  };

  const logDebug = (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Orders Debug] ${message}`, data || '');
    }
  };

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      logDebug('Fetching orders...');

      const { orders } = await medusaClient.admin.orders.list();
      logDebug('Orders fetched successfully', orders);
      
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

  useEffect(() => {
    logDebug('Component mounted');
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 300000);

    return () => {
      clearInterval(interval);
      logDebug('Component unmounted');
    };
  }, []);

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
      })
      .catch((err) => {
        logDebug('Error copying to clipboard:', err);
        showSnackbar('Failed to copy to clipboard', 'error');
      });
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Orders
        </Typography>
        <IconButton onClick={handleRefresh} title="Refresh orders">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.id}
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(order.id)}
                      sx={{ ml: 1 }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{order.customer?.email || 'Guest'}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
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
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order Details - {selectedOrder.id}
            </DialogTitle>

            <DialogContent>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Email: {selectedOrder.customer?.email || 'Guest'}
                    </Typography>
                    {selectedOrder.customer?.phone && (
                      <Typography variant="body2">
                        Phone: {selectedOrder.customer.phone}
                      </Typography>
                    )}
                  </Box>

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