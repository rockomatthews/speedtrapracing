// src/app/login/page.js
'use client';
import React from 'react';
import { Box, Button, Typography, TextField, IconButton } from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon, Apple as AppleIcon } from '@mui/icons-material';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import { useRouter } from 'next/navigation';
import loginBackground from '../../public/loginBackground.png';

const LoginPage = () => {
  const router = useRouter();

  // Placeholder for actual authentication logic later
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
    // Placeholder logic for social login
  };

  const handleEmailLogin = () => {
    console.log('Logging in with Email');
    // Placeholder logic for email login
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${loginBackground.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        padding: '20px',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark overlay for better text contrast
          padding: '30px',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {/* Sign Up Header */}
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 5 }}>
          <SportsMotorsportsIcon alt="Helmet Icon" style={{ width: 50, height: 50, marginBottom: 30 }} />
          Sign In
        </Typography>

        {/* Social Login Options */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <IconButton onClick={() => handleSocialLogin('Google')} sx={{ backgroundColor: '#4285F4', color: '#fff' }}>
            <GoogleIcon />
          </IconButton>
          <IconButton onClick={() => handleSocialLogin('Facebook')} sx={{ backgroundColor: '#3b5998', color: '#fff' }}>
            <FacebookIcon />
          </IconButton>
          <IconButton onClick={() => handleSocialLogin('Apple')} sx={{ backgroundColor: '#000', color: '#fff' }}>
            <AppleIcon />
          </IconButton>
        </Box>

        <Typography variant="body1" gutterBottom>
          or
        </Typography>

        {/* Email and Password Fields */}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          sx={{ marginBottom: '15px', backgroundColor: '#fff', borderRadius: '5px' }}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          sx={{ marginBottom: '15px', backgroundColor: '#fff', borderRadius: '5px' }}
        />

        {/* Login Button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: '15px', backgroundColor: '#FFC107', color: '#000' }}
          onClick={handleEmailLogin}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
