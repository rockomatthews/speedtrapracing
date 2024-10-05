// src/components/SlideMenu.js
'use client';
import React from 'react';
import { Box, Drawer, IconButton, Button, List, ListItem, ListItemText } from '@mui/material';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import YouTubeIcon from '@mui/icons-material/YouTube';
import XIcon from '@mui/icons-material/X';
import ShareIcon from '@mui/icons-material/Share';
import InstagramIcon from '@mui/icons-material/Instagram';

const SlideMenu = ({ open, onClose }) => {
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: '75%', backgroundColor:"#000" , color: "#fff"} }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <IconButton onClick={onClose}>
          <CloseIcon color='primary' />
        </IconButton>
              {/* Sign Up and Log In buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end'}}>
            <Link href="/login" passHref>
            <Button variant="contained" color="primary" sx={{ marginRight: 1 }} onClick={onClose}>
                Sign Up
            </Button>
            </Link>
            <Link href="/login" passHref>
            <Button variant="outlined" color="primary" onClick={onClose}>
                Log In
            </Button>
            </Link>
        </Box>
      </Box>
      


      {/* Navigation Links */}
      <List sx={{ marginTop: '20px' }}>
        <ListItem button component="a" href="/howitworks">
          <ListItemText primary="How it works" />
        </ListItem>
        <ListItem button component="a" href="/race-nights">
          <ListItemText primary="Race Nights" />
        </ListItem>
        <ListItem button component="a" href="/race-nights">
          <ListItemText primary="Pricing" />
        </ListItem>
        <ListItem button component="a" href="/members">
          <ListItemText primary="Member Pass" />
        </ListItem>
        <ListItem button component="a" href="/marketplace">
          <ListItemText primary="Apparel" />
        </ListItem>
        <ListItem button component="a" href="/franchise">
          <ListItemText primary="Franchise" />
        </ListItem>
      </List>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flexGrow: 1 }} /> {/* This pushes the icons to the bottom */}
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
          <IconButton component="a" href="https://www.youtube.com" target="_blank">
            <YouTubeIcon color='primary' />
          </IconButton>
          <IconButton component="a" href="https://www.twitch.tv" target="_blank">
            <XIcon color='primary' />
          </IconButton>
          <IconButton component="a" href="https://www.instagram.com" target="_blank">
            <InstagramIcon color='primary' />
          </IconButton>
          <IconButton component="a" href="https://www.twitter.com" target="_blank">
            <ShareIcon color='primary' />
          </IconButton>
        </Box>
      </Box>

    </Drawer>
  );
};

export default SlideMenu;