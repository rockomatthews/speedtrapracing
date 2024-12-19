// src/app/admin/customers/page.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import medusaClient from '@/lib/medusa-client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
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
      console.log(`[Customers Debug] ${message}`, data || '');
    }
  };

  const fetchCustomers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      logDebug('Fetching customers and orders...');

      // Get both customers and orders
      const [ordersResponse, customersResponse] = await Promise.all([
        medusaClient.admin.orders.list(),
        medusaClient.admin.customers.list()
      ]);

      const { orders } = ordersResponse;
      const { customers: registeredCustomers } = customersResponse;

      logDebug('Raw orders:', orders);
      logDebug('Raw registered customers:', registeredCustomers);

      // Create a map to store unique customers
      const customerMap = new Map();

      // First add all registered customers
      registeredCustomers.forEach(customer => {
        customerMap.set(customer.email, {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name || 'Guest',
          last_name: customer.last_name || '',
          orders: [],
          total_spent: 0,
          created_at: customer.created_at,
          latest_order: customer.created_at,
          shipping_addresses: [],
          is_registered: true
        });
      });

      // Then process all orders
      orders.forEach(order => {
        const email = order.customer?.email || order.shipping_address?.email;
        logDebug(`Processing order ${order.id} with email:`, email);

        if (!email) {
          logDebug(`No email found for order:`, order);
          return;
        }

        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: order.customer?.id || `guest-${email}`,
            email: email,
            first_name: order.shipping_address?.first_name || 'Guest',
            last_name: order.shipping_address?.last_name || '',
            orders: [],
            total_spent: 0,
            created_at: order.created_at,
            latest_order: order.created_at,
            shipping_addresses: [],
            is_registered: false
          });
          logDebug(`Created new customer entry for email:`, email);
        }

        const customer = customerMap.get(email);
        customer.orders.push(order);
        customer.total_spent += order.total || 0;
        
        if (order.shipping_address) {
          customer.first_name = order.shipping_address.first_name || customer.first_name;
          customer.last_name = order.shipping_address.last_name || customer.last_name;
          
          // Add unique shipping addresses
          const addressStr = JSON.stringify(order.shipping_address);
          if (!customer.shipping_addresses.some(addr => JSON.stringify(addr) === addressStr)) {
            customer.shipping_addresses.push(order.shipping_address);
          }
        }

        // Update latest order date if newer
        if (new Date(order.created_at) > new Date(customer.latest_order)) {
          customer.latest_order = order.created_at;
        }
      });

      logDebug('Customer map:', customerMap);
      
      const customersList = Array.from(customerMap.values())
        .sort((a, b) => new Date(b.latest_order) - new Date(a.latest_order));

      logDebug('Final customers list:', customersList);
      setCustomers(customersList);
    } catch (err) {
      logDebug('Error fetching customers:', err);
      const errorMessage = err.message || 'Failed to load customers';
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
    fetchCustomers();

    const interval = setInterval(() => {
      fetchCustomers(false);
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

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
    logDebug('Viewing customer details:', customer.id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    logDebug('Closed customer details dialog');
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
    fetchCustomers();
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Customers ({customers.length})
        </Typography>
        <IconButton onClick={handleRefresh} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Total Spent</TableCell>
              <TableCell>Latest Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {customer.first_name} {customer.last_name}
                  </TableCell>
                  <TableCell>
                    {customer.email}
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(customer.email)}
                      title="Copy email"
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {customer.is_registered ? 'Registered' : 'Guest'}
                  </TableCell>
                  <TableCell>{customer.orders.length}</TableCell>
                  <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell>
                    {new Date(customer.latest_order).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleViewCustomer(customer)}
                      size="small"
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
          count={customers.length}
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
        {selectedCustomer && (
          <>
            <DialogTitle>
              Customer Details - {selectedCustomer.email}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Name: {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </Typography>
                    <Typography variant="body2">
                      Email: {selectedCustomer.email}
                    </Typography>
                    <Typography variant="body2">
                      Total Orders: {selectedCustomer.orders.length}
                    </Typography>
                    <Typography variant="body2">
                      Total Spent: {formatCurrency(selectedCustomer.total_spent)}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Shipping Addresses
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {selectedCustomer.shipping_addresses.map((address, index) => (
                      <Box key={index} mb={2}>
                        <Typography variant="body2">
                          {address.first_name} {address.last_name}
                        </Typography>
                        <Typography variant="body2">
                          {address.address1}
                        </Typography>
                        {address.address2 && (
                          <Typography variant="body2">
                            {address.address2}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {address.city}, {address.province} {address.postal_code}
                        </Typography>
                        <Typography variant="body2">
                          {address.country}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Order History
                  </Typography>
                  {selectedCustomer.orders.map((order) => (
                    <Box key={order.id} mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                      <Typography variant="subtitle2">
                        Order ID: {order.id}
                      </Typography>
                      <Typography variant="body2">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        Total: {formatCurrency(order.total)}
                      </Typography>
                      <Typography variant="body2">
                        Status: {order.status}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
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