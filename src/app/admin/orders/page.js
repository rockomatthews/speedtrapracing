// src/app/admin/orders/page.js
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
  TextField
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ContentCopy as CopyIcon
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { orders } = await medusaClient.admin.orders.list();
      setOrders(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
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
              {orders
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
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.customer?.email || 'N/A'}</TableCell>
                    <TableCell align="right">
                      ${parseFloat(order.total).toFixed(2)}
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
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
    {/* Previous code remains the same until Dialog */}

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
                      <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Amount:</strong> ${parseFloat(selectedOrder.total).toFixed(2)}
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
                          {selectedOrder.shipping_address.address_line1}
                        </Typography>
                        {selectedOrder.shipping_address.address_line2 && (
                          <Typography variant="body2">
                            {selectedOrder.shipping_address.address_line2}
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
                          {selectedOrder.billing_address.address_line1}
                        </Typography>
                        {selectedOrder.billing_address.address_line2 && (
                          <Typography variant="body2">
                            {selectedOrder.billing_address.address_line2}
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
                              ${parseFloat(item.unit_price).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Subtotal</strong>
                          </TableCell>
                          <TableCell align="right">
                            ${parseFloat(selectedOrder.subtotal).toFixed(2)}
                          </TableCell>
                        </TableRow>
                        {selectedOrder.shipping_total > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <strong>Shipping</strong>
                            </TableCell>
                            <TableCell align="right">
                              ${parseFloat(selectedOrder.shipping_total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedOrder.tax_total > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <strong>Tax</strong>
                            </TableCell>
                            <TableCell align="right">
                              ${parseFloat(selectedOrder.tax_total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Total</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>${parseFloat(selectedOrder.total).toFixed(2)}</strong>
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
                  onClick={() => {
                    // Add order fulfillment logic here
                    console.log('Fulfill order:', selectedOrder.id);
                  }}
                >
                  Fulfill Order
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}