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
    width: { xs: '165px', sm: '198px', md: '220px' },  // Increased by 10%
    height: { xs: '165px', sm: '198px', md: '220px' },  // Increased by 10%
    backgroundColor: '#ff0000',
    color: '#fff',
    fontSize: { xs: '16px', sm: '18px', md: '20px' },
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: { xs: '11px', sm: '16.5px', md: '22px' },  // Increased by 10%
    '&:hover': {
      backgroundColor: '#d10000',
    },
  };

  const iconStyle = {
    fontSize: { xs: '44px', sm: '55px', md: '66px' },  // Increased by 10%
    marginBottom: { xs: '5.5px', sm: '8.8px', md: '11px' },  // Increased by 10%
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '110%',  // Increased to 110%
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '22px',  // Increased by 10%
        gap: { xs: '22px', sm: '27.5px', md: '33px' },  // Increased by 10%
        backgroundColor: isMobile ? 'transparent' : '#000000',
        marginLeft: '-5%',  // Added to center the wider container
        marginRight: '-5%',  // Added to center the wider container
      }}
    >
      {isMobile && (
        <Image
          src={loginBackground}
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
      )}
      <Box 
        sx={{ 
          position: 'relative',
          textAlign: 'center', 
          marginBottom: { xs: '22px', sm: '27.5px', md: '33px' },  // Increased by 10%
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
        <Typography variant="body2" sx={{ fontSize: { xs: '13.2px', sm: '14.3px', md: '15.4px' }, marginTop: '5.5px' }}>  {/* Increased by 10% */}
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
        <Typography variant="body2" sx={{ fontSize: { xs: '13.2px', sm: '14.3px', md: '15.4px' }, marginTop: '5.5px' }}>  {/* Increased by 10% */}
          New Accounts
        </Typography>
      </Button>
    </Box>
  );
};

export default Book;