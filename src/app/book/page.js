'use client';

import React from 'react';
import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import loginBackground from '../../public/loginBackground.png';
import CalendarToday from '@mui/icons-material/CalendarToday';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';

const Book = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNavigate = (path) => {
    router.push(path);
  };

  const buttonStyle = {
    width: { xs: '150px', sm: '180px', md: '200px' },
    height: { xs: '150px', sm: '180px', md: '200px' },
    backgroundColor: '#ff0000',
    color: '#fff',
    fontSize: { xs: '16px', sm: '18px', md: '20px' },
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: { xs: '10px', sm: '15px', md: '20px' },
    '&:hover': {
      backgroundColor: '#d10000',
    },
  };

  const iconStyle = {
    fontSize: { xs: '40px', sm: '50px', md: '60px' },
    marginBottom: { xs: '5px', sm: '8px', md: '10px' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        gap: { xs: '20px', sm: '25px', md: '30px' },
      }}
    >
      <Image
        src={loginBackground}
        alt="Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        priority
      />
      <Box 
        sx={{ 
          position: 'relative',
          textAlign: 'center', 
          marginBottom: { xs: '20px', sm: '25px', md: '30px' },
          zIndex: 1,
        }}
      >
        <Typography variant={isMobile ? "h4" : "h3"} sx={{ color: '#fff', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>
          Cleveland
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#fff', fontStyle: 'italic' }}>
          Welcome to your booking experience!
        </Typography>
      </Box>

      <Button
        onClick={() => handleNavigate('/schedule')}
        variant="contained"
        sx={buttonStyle}
      >
        <CalendarToday sx={iconStyle} />
        Schedule
      </Button>

      <Button
        onClick={() => handleNavigate('/checkin')}
        variant="contained"
        sx={buttonStyle}
      >
        <HowToRegIcon sx={iconStyle} />
        Check In
        <Typography variant="body2" sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px' }, marginTop: '5px' }}>
          Existing Account
        </Typography>
      </Button>

      <Button
        onClick={() => handleNavigate('/signup')}
        variant="contained"
        sx={buttonStyle}
      >
        <LoginIcon sx={iconStyle} />
        Sign Up
        <Typography variant="body2" sx={{ fontSize: { xs: '12px', sm: '13px', md: '14px' }, marginTop: '5px' }}>
          New Accounts
        </Typography>
      </Button>
    </Box>
  );
};

export default Book;