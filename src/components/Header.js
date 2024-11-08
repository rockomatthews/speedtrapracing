'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../public/logoBlack.svg';
import SlideMenu from './SlideMenu';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: theme.palette.background.default }}>
        <Toolbar sx={{ justifyContent: 'space-between', padding: '0 24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/">
              <Image src={logo} alt="Speed Trap Racing Logo" width={150} height={50} priority />
            </Link>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: '20px' }}>
              <Link href="/howitworks" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>How It Works</Button>
              </Link>
              <Link href="/pricing" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Pricing</Button>
              </Link>
              <Link href="/marketplace" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Apparel</Button>
              </Link>
              <Link href="/race-nights" passHref>
                <Button sx={{ backgroundColor: 'transparent', color: '#ffffff' }}>Race Radar</Button>
              </Link>
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/" passHref>
                <IconButton sx={{ color: '#ffffff' }}>
                  <SportsScoreIcon />
                </IconButton>
              </Link>

              {user ? (
                <>
                  <Button
                    onClick={handleLogout}
                    sx={{ color: '#ffffff', textTransform: 'none' }}
                  >
                    Logout
                  </Button>
                  <Link href="/profile" passHref>
                    <IconButton>
                      <Avatar 
                        src={user.photoURL} 
                        alt={user.displayName || user.email}
                        sx={{ width: 40, height: 40 }}
                      />
                    </IconButton>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" passHref>
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
                </>
              )}
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

      <SlideMenu open={menuOpen} onClose={toggleMenu} user={user} onLogout={handleLogout} />
    </>
  );
};

export default Header;
