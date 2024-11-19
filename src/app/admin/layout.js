'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// Update import to use relative path
import { getSession } from '../../utils/sessionHandler';

const drawerWidth = 240;

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { text: 'Dashboard', href: '/admin', icon: <DashboardIcon /> },
    { text: 'Products', href: '/admin/products', icon: <InventoryIcon /> },
    { text: 'Orders', href: '/admin/orders', icon: <OrdersIcon /> },
    { text: 'Customers', href: '/admin/customers', icon: <CustomersIcon /> },
    { text: 'Settings', href: '/admin/settings', icon: <SettingsIcon /> },
  ];

  useEffect(() => {
    const verifyAdmin = async () => {
      console.log('🔍 Starting admin verification...');
      console.log('📍 Current pathname:', pathname);

      try {
        const session = getSession();
        console.log('📦 Session state:', session ? {
          hasToken: !!session.token,
          isAdmin: !!session.user?.isAdmin,
          expiry: new Date(session.expiresAt).toLocaleString()
        } : 'No session');
        
        if (!session?.user?.isAdmin) {
          console.log('❌ No admin session found or user is not admin');
          console.log('🔄 Redirecting to login with return path');
          window.location.href = `/login?from=${pathname}`;
          return;
        }

        console.log('🔑 Verifying session with server...');
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sessionCookie: session.token 
          }),
        });

        console.log('📡 Server response status:', response.status);
        const data = await response.json();
        console.log('📡 Server response:', data);

        if (!response.ok) {
          console.log('❌ Server verification failed');
          console.log('🔄 Redirecting to login');
          window.location.href = `/login?from=${pathname}`;
          return;
        }

        console.log('✅ Admin verified successfully');
        setIsAuthenticated(true);

      } catch (error) {
        console.error('🚨 Verification error:', error);
        window.location.href = `/login?from=${pathname}`;
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [pathname]);

  // Return loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Return null if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Create drawer content
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              href={item.href}
              selected={pathname === item.href}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Return main layout
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.href === pathname)?.text || 'Admin'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}