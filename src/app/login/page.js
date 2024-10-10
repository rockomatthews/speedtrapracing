'use client';
import React, { useState } from 'react';
import { Box, Button, Typography, TextField, IconButton } from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon, Apple as AppleIcon } from '@mui/icons-material';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import { useRouter } from 'next/navigation';
import loginBackground from '../../public/loginBackground.png';
import { auth } from '../../config/firebase';

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword
} from "firebase/auth";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSocialLogin = async (provider) => {
    try {
      let authProvider;
      switch(provider) {
        case 'Google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'Facebook':
          authProvider = new FacebookAuthProvider();
          break;
        default:
          console.error('Unsupported provider');
          return;
      }
      
      const result = await signInWithPopup(auth, authProvider);
      console.log(`Logged in with ${provider}`, result.user);
      // Redirect or update UI after successful login
      router.push('/dashboard');
    } catch (error) {
      console.error(`${provider} login failed`, error);
      // Handle errors here, such as displaying error messages
    }
  };

  const handleEmailLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in with email', result.user);
      // Redirect or update UI after successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Email login failed', error);
      // Handle errors here, such as displaying error messages
    }
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '30px',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 5 }}>
          <SportsMotorsportsIcon alt="Helmet Icon" style={{ width: 50, height: 50, marginBottom: 30 }} />
          Sign In
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <IconButton onClick={() => handleSocialLogin('Google')} sx={{ backgroundColor: '#4285F4', color: '#fff' }}>
            <GoogleIcon />
          </IconButton>
          <IconButton onClick={() => handleSocialLogin('Facebook')} sx={{ backgroundColor: '#3b5998', color: '#fff' }}>
            <FacebookIcon />
          </IconButton>
          <IconButton sx={{ backgroundColor: '#000', color: '#fff' }}>
            <AppleIcon />
          </IconButton>
        </Box>

        <Typography variant="body1" gutterBottom>
          or
        </Typography>

        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            marginBottom: '15px',
            backgroundColor: '#fff',
            borderRadius: '5px',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000',
              },
            },
            '& .MuiInputBase-input': {
              color: '#000',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          }}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            marginBottom: '15px',
            backgroundColor: '#fff',
            borderRadius: '5px',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000',
              },
            },
            '& .MuiInputBase-input': {
              color: '#000',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          }}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: '15px', backgroundColor: '#FFC107', color: '#000' }}
          onClick={handleEmailLogin}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;