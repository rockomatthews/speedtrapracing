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
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    customers: 0,
    products: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Get admin session token
        const cookies = document.cookie.split(';');
        const adminSessionCookie = cookies
          .find(cookie => cookie.trim().startsWith('adminSession='));
        
        if (!adminSessionCookie) {
          throw new Error('No admin session found');
        }
        
        const idToken = adminSessionCookie.split('=')[1].trim();
        
        // Fetch all necessary data
        const [ordersResponse, productsResponse] = await Promise.all([
          medusaClient.admin.orders.list({ headers: { Authorization: `Bearer ${idToken}` } }),
          medusaClient.admin.products.list({ headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        // Calculate total revenue and unique customers
        const totalRevenue = ordersResponse.orders.reduce((sum, order) => {
          const orderTotal = order.total || 0;
          return sum + (typeof orderTotal === 'number' ? orderTotal / 100 : parseFloat(orderTotal));
        }, 0);

        // Get unique customers count
        const uniqueCustomers = new Set(
          ordersResponse.orders.map(order => order.customerId)
        ).size;

        setStats({
          orders: ordersResponse.orders.length || 0,
          customers: uniqueCustomers,
          products: productsResponse.products.length || 0,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError(error.message || 'Failed to load dashboard statistics');
        if (error.message.includes('session')) {
          router.push('/login?from=/admin');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [router]);

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