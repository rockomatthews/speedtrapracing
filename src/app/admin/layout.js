'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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

const drawerWidth = 240;

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  
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
    const verifySession = async () => {
      try {
        setLoading(true);
        setSessionError(null);

        // First check if we have a session in localStorage
        const localSession = localStorage.getItem('adminSession');
        let hasLocalSession = false;
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession);
            if (new Date(parsed.expiresAt) > new Date()) {
              hasLocalSession = true;
            } else {
              localStorage.removeItem('adminSession');
            }
          } catch (e) {
            console.error('Error parsing local session:', e);
            localStorage.removeItem('adminSession');
          }
        }

        // Always verify with the backend
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: this ensures cookies are sent
          body: JSON.stringify({
            hasLocalSession,
            path: pathname,
            timestamp: Date.now()
          })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success' && data.isAdmin) {
          console.log('✅ Session verified successfully');
          setIsAuthenticated(true);
          // Update local session
          localStorage.setItem('adminSession', JSON.stringify({
            isAdmin: true,
            email: data.email,
            expiresAt: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString() // 5 days
          }));
        } else {
          console.log('❌ Session verification failed:', data);
          setSessionError(data.message || 'Authentication failed');
          localStorage.removeItem('adminSession');
          router.push('/login?from=' + encodeURIComponent(pathname));
        }
      } catch (error) {
        console.error('Session verification error:', error);
        setSessionError(error.message);
        localStorage.removeItem('adminSession');
        router.push('/login?from=' + encodeURIComponent(pathname));
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [pathname, router]);

  // Loading state
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

  // Error state
  if (sessionError) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <Typography color="error">{sessionError}</Typography>
        <Link href="/login" passHref>
          <Typography color="primary" sx={{ cursor: 'pointer' }}>
            Return to Login
          </Typography>
        </Link>
      </Box>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return null;
  }

  // Drawer content
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
        {/* Mobile drawer */}
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
        
        {/* Desktop drawer */}
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

      {/* Main content */}
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