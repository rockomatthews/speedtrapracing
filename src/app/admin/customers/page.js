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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import medusaClient from '@/lib/medusa-client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { customers } = await medusaClient.admin.customers.list();
      setCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Customers
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  {customer.firstName} {customer.lastName}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.orders?.length || 0}</TableCell>
                <TableCell>
                  {new Date(customer.createdAt).toLocaleDateString()}
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
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCustomer && (
          <>
            <DialogTitle>
              Customer Details
            </DialogTitle>
            <DialogContent dividers>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </Typography>
                <Typography gutterBottom>
                  Email: {selectedCustomer.email}
                </Typography>
                <Typography gutterBottom>
                  Phone: {selectedCustomer.phone || 'N/A'}
                </Typography>

                {selectedCustomer.shippingAddresses?.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                      Shipping Addresses
                    </Typography>
                    {selectedCustomer.shippingAddresses.map((address, index) => (
                      <Box key={index} mb={1}>
                        <Typography>
                          {address.address1}
                          {address.address2 && `, ${address.address2}`}
                        </Typography>
                        <Typography>
                          {address.city}, {address.state} {address.postal_code}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}