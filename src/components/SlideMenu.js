'use client';
import React from 'react';
import { Box, Drawer, IconButton, Button, List, ListItem, ListItemText, Avatar } from '@mui/material';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import YouTubeIcon from '@mui/icons-material/YouTube';
import XIcon from '@mui/icons-material/X';
import ShareIcon from '@mui/icons-material/Share';
import InstagramIcon from '@mui/icons-material/Instagram';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { customFont } from '../app/fonts';

const SlideMenu = ({ open, onClose, user }) => {
  return (
    <Drawer 
      anchor="left" 
      open={open} 
      onClose={onClose} 
      PaperProps={{ 
        sx: { 
          width: '75%', 
          backgroundColor: "#000000",
          color: "#fff"
        } 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <IconButton onClick={onClose}>
          <CloseIcon sx={{ color: '#ffffff' }} />
        </IconButton>
        {/* User profile, shopping cart, or Sign Up and Log In buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px'}}>
          {user ? (
            <>
              <IconButton sx={{ color: '#ffffff' }} onClick={onClose}>
                <ShoppingCartIcon />
              </IconButton>
              <Link href="/profile" passHref>
                <IconButton onClick={onClose}>
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
                <Button variant="contained" color="primary" sx={{ marginRight: 1 }} onClick={onClose}>
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button 
                  variant="outlined" 
                  onClick={onClose}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffcc03',
                    borderColor: '#ffcc03',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 204, 3, 0.2)',
                      borderColor: '#ffcc03',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Box>
      
      {/* Navigation Links */}
      <List sx={{ marginTop: '20px' }}>
        {[
          { text: 'How it works', href: '/howitworks' },
          { text: 'Race Nights', href: '/race-nights' },
          { text: 'Pricing', href: '/pricing' },
          { text: 'Member Pass', href: '/members' },
          { text: 'Apparel', href: '/marketplace' },
          { text: 'Franchise', href: '/franchise' },
        ].map((item) => (
          <ListItem button component="a" href={item.href} onClick={onClose} key={item.text}>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                sx: { 
                  fontFamily: customFont.style.fontFamily,
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flexGrow: 1 }} /> {/* This pushes the icons to the bottom */}
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
          <IconButton component="a" href="https://www.youtube.com" target="_blank">
            <YouTubeIcon sx={{ color: '#ffffff' }} />
          </IconButton>
          <IconButton component="a" href="https://www.twitch.tv" target="_blank">
            <XIcon sx={{ color: '#ffffff' }} />
          </IconButton>
          <IconButton component="a" href="https://www.instagram.com" target="_blank">
            <InstagramIcon sx={{ color: '#ffffff' }} />
          </IconButton>
          <IconButton component="a" href="https://www.twitter.com" target="_blank">
            <ShareIcon sx={{ color: '#ffffff' }} />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SlideMenu;