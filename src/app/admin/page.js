'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert
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

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Fetch all necessary data
        const [ordersResponse, productsResponse] = await Promise.all([
          medusaClient.admin.orders.list(),
          medusaClient.admin.products.list(),
        ]);

        // Calculate total revenue and unique customers
        const totalRevenue = ordersResponse.orders.reduce((sum, order) => {
          const orderTotal = order.total || 0;
          return sum + (typeof orderTotal === 'number' ? orderTotal / 100 : parseFloat(orderTotal));
        }, 0);

        // Get unique customers count
        const uniqueCustomers = new Set(
          ordersResponse.orders.map(order => order.customer?.id)
        ).size;

        setStats({
          orders: ordersResponse.orders.length || 0,
          customers: uniqueCustomers,
          products: productsResponse.products.length || 0,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

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
      value: `$${stats.revenue.toFixed(2)}`,
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

      {/* Stat Cards */}
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

      {/* Recent Activity Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Typography color="text.secondary">
                View all orders in the Orders tab
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Overview
              </Typography>
              <Typography color="text.secondary">
                Manage products in the Products tab
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}