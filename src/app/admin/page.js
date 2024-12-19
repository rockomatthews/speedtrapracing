'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  AttachMoney as RevenueIcon
} from '@mui/icons-material';
import medusaClient from '@/lib/medusa-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    products: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      console.log(`[Dashboard Debug] ${message}`, data || '');
    }
  };

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      logDebug('Fetching dashboard data...');

      // Get orders first
      const { orders } = await medusaClient.admin.orders.list();
      logDebug('Orders fetched successfully', orders);

      // Calculate stats from orders
      const uniqueCustomers = new Set(orders.map(order => order.customer?.email).filter(Boolean));
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Get products
      const { products } = await medusaClient.admin.products.list();
      logDebug('Products fetched successfully', products);

      setStats({
        orders: orders.length,
        customers: uniqueCustomers.size,
        products: products.length,
        revenue: totalRevenue
      });
    } catch (err) {
      logDebug('Error fetching dashboard data:', err);
      const errorMessage = err.message || 'Failed to load dashboard statistics';
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
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 300000);

    return () => {
      clearInterval(interval);
      logDebug('Component unmounted');
    };
  }, []);

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

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: <OrdersIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      color: '#bbdefb'
    },
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: <CustomersIcon sx={{ fontSize: 40, color: '#388e3c' }} />,
      color: '#c8e6c9'
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: <ProductsIcon sx={{ fontSize: 40, color: '#f57c00' }} />,
      color: '#ffe0b2'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      icon: <RevenueIcon sx={{ fontSize: 40, color: '#d32f2f' }} />,
      color: '#ffcdd2'
    }
  ];

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', backgroundColor: stat.color }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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