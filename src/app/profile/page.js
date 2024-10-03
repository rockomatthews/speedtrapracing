// src/app/profile/page.js
'use client';

import React from 'react';
import { Box, Button, Typography, Avatar, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';

const Profile = () => {
  const router = useRouter();

  // Placeholder data for the user's profile (replace with real data as needed)
  const user = {
    name: 'John Fishburne',
    email: 'J.Fish@gmail.com',
    profileImage: '/profileImage.png', // Replace this with actual user profile image
  };

  // Handle navigation to booking path
  const handleRaceClick = () => {
    router.push('/booking');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // Black background
        padding: '20px',
        position: 'relative', // Position relative to enable absolute positioning for Edit button
      }}
    >
      {/* Edit Button */}
      <IconButton
        sx={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: '#FFC107',
          color: '#000',
          '&:hover': {
            backgroundColor: '#FFA000',
          },
        }}
        onClick={() => console.log('Edit profile')}
      >
        <EditIcon />
      </IconButton>

      {/* Profile Image */}
      <Avatar
        src={user.profileImage}
        alt="Profile Image"
        sx={{
          width: '120px',
          height: '120px',
          border: '5px solid #fff',
          marginBottom: '20px',
        }}
      />

      {/* Name Field */}
      <Box
        sx={{
          backgroundColor: '#000',
          padding: '10px 20px',
          marginBottom: '10px',
          borderRadius: '10px',
          border: '2px solid #fff',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
          Name
        </Typography>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
          {user.name}
        </Typography>
      </Box>

      {/* Email Field */}
      <Box
        sx={{
          backgroundColor: '#000',
          padding: '10px 20px',
          borderRadius: '10px',
          border: '2px solid #fff',
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
          Email
        </Typography>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {user.email}
        </Typography>
      </Box>

      {/* Race Button */}
      <Button
        variant="contained"
        sx={{
          backgroundColor: '#FFC107',
          color: '#000',
          fontWeight: 'bold',
          padding: '10px 40px',
          '&:hover': {
            backgroundColor: '#FFA000',
          },
        }}
        onClick={handleRaceClick}
      >
        Race
      </Button>
    </Box>
  );
};

export default Profile;
