'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import loginBackground from '../../public/loginBackground.png';
import CalendarToday from '@mui/icons-material/CalendarToday';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';

const Book = () => {
  const router = useRouter();

  // Handle navigation to different routes
  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${loginBackground.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        gap: '20px',
      }}
    >
      <Box sx={{ textAlign: 'center', marginBottom: '30px' }}>
        <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>
          Cleveland
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#fff', fontStyle: 'italic' }}>
          Welcome to your booking experience!
        </Typography>
      </Box>

      {/* Schedule Button */}
      <Button
        onClick={() => handleNavigate('/schedule')}
        variant="contained"
        sx={{
          width: '300px',
          height: '110px',
          backgroundColor: '#ff0000',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CalendarToday sx={{ fontSize: '40px', color: '#fff' }} />
          Schedule
        </Box>
      </Button>

      {/* Check In Button */}
      <Button
        onClick={() => handleNavigate('/checkin')}
        variant="contained"
        sx={{
          width: '300px',
          height: '110px',
          backgroundColor: '#ff0000',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <HowToRegIcon sx={{ fontSize: '40px', color: '#fff' }} />
          Check In
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Existing Account
          </Typography>
        </Box>
      </Button>

      {/* Sign Up Button */}
      <Button
        onClick={() => handleNavigate('/signup')}
        variant="contained"
        sx={{
          width: '300px',
          height: '110px',
          backgroundColor: '#ff0000',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LoginIcon sx={{ fontSize: '40px', color: '#fff' }} />
          Sign Up
          <Typography variant="body2" sx={{ color: '#fff' }}>
            New Accounts
          </Typography>
        </Box>
      </Button>
    </Box>
  );
};

export default Book;
