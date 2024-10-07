'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../public/logoBlack.svg';  // Ensure this path is correct
import SlideMenu from './SlideMenu';  // Import the SlideMenu component

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));  // Show hamburger menu on small screens
  const [menuOpen, setMenuOpen] = useState(false);  // State to control the SlideMenu

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <>
      {/* Header bar */}
      <AppBar position="fixed" sx={{ backgroundColor: theme.palette.background.default }}>
        <Toolbar sx={{ justifyContent: 'space-between', padding: '0 24px' }}>
          {/* Left: Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/">
              <Image src={logo} alt="Speed Trap Racing Logo" width={150} height={50} />
            </Link>
          </Box>

          {/* Center: Navigation Links (Hidden in Mobile) */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Link href="/race-nights" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Race Nights</Button>
              </Link>
              <Link href="/members" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Members</Button>
              </Link>
              <Link href="/marketplace" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Apparel</Button>
              </Link>
              <Link href="/franchise" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Franchise</Button>
              </Link>
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Cart Icon */}
              <IconButton sx={{ color: '#ffffff' }}>
                <ShoppingCartIcon />
              </IconButton>

              {/* Sign Up / Sign In */}
              <Link href="/signup" passHref>
                <Button 
                  variant="contained" 
                  sx={{
                    backgroundColor: '#ffcc03',
                    color: '#000000',
                    '&:hover': {
                      backgroundColor: '#d9ad00',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button 
                  variant="outlined" 
                  sx={{
                    backgroundColor: 'transparent',
                    border: '2px solid #ffcc03',
                    color: '#ffcc03',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 204, 3, 0.1)',
                      border: '2px solid #ffcc03',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Link>
            </Box>
          )}

          {isMobile && (
            <IconButton 
              edge="end" 
              aria-label="menu" 
              onClick={toggleMenu}
              sx={{ color: '#ffffff' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* SlideMenu for mobile view */}
      <SlideMenu open={menuOpen} onClose={toggleMenu} />
    </>
  );
};

export default Header;