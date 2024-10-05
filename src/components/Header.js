'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../public/logo.svg';  // Ensure this path is correct
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
      <AppBar position="fixed" color="dark" sx={{ padding: '0 24px' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
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
                <Button>Race Nights</Button>
              </Link>
              <Link href="/members" passHref>
                <Button>Members</Button>
              </Link>
              <Link href="/marketplace" passHref>
                <Button>Apparel</Button>
              </Link>
              <Link href="/franchise" passHref>
                <Button>Franchise</Button>
              </Link>
            </Box>
          )}

          {!isMobile && (

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Cart Icon */}
              <IconButton>
                <ShoppingCartIcon />
              </IconButton>

              {/* Sign Up / Log In */}
              <Link href="/login" passHref>
                <Button variant="contained" color="primary">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button variant="outlined" color="primary">
                  Log In
                </Button>
              </Link>
            </Box>
          )}

          {isMobile && (
            <IconButton edge="end" color="inherit" aria-label="menu" onClick={toggleMenu}>
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
