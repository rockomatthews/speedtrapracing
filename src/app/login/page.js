'use client';
import React, { useState } from 'react';
import { Box, Button, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon, Apple as AppleIcon } from '@mui/icons-material';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import { useRouter } from 'next/navigation';
import loginBackground from '../../public/loginBackground.png';
import { auth, db } from '../../config/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import safeStorage from '../../utils/safeStorage';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const doesUserExist = async (user) => {
    try {
      const userDocRef = doc(db, 'Users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      let userData;
  
      if (!userDocSnapshot.exists()) {
        userData = {
          email: user.email,
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
          isInitiated: false,
          tokens: 2,
        };
        await setDoc(userDocRef, userData);
        setIsNewUser(true);
      } else {
        userData = userDocSnapshot.data();
        setIsNewUser(false);
      }
  
      // Use safe storage
      safeStorage.setItem('userSession', {
        email: user.email,
        uid: user.uid,
        isAdmin: userData.isAdmin || false
      });
  
      return userData;
    } catch (error) {
      console.error('Error in doesUserExist function:', error);
      throw error;
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    
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
          throw new Error('Unsupported provider');
      }
      
      const result = await signInWithPopup(auth, authProvider);
  
      // Get the redirect URL from the query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('from') || '/';
  
      if (redirectPath.startsWith('/admin')) {
        const idToken = await result.user.getIdToken(true);
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
  
        if (!verifyResponse.ok) {
          throw new Error('Not authorized as admin');
        }
      }
  
      const userData = await doesUserExist(result.user);
  
      // Use window.location.href for admin redirects
      if (redirectPath.startsWith('/admin')) {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
  
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    setError('');
  
    try {
      let result;
      if (isNewUser) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Get the redirect URL from the query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('from') || '/';
  
      // If redirecting to admin, verify admin status first
      if (redirectPath.startsWith('/admin')) {
        const idToken = await result.user.getIdToken(true);
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
  
        if (!verifyResponse.ok) {
          throw new Error('Not authorized as admin');
        }
      }
  
      const userData = await doesUserExist(result.user);
      
      // Use window.location.href for a full page reload to ensure clean state
      if (redirectPath.startsWith('/admin')) {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
      
    } catch (error) {
      console.error('Email authentication failed:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = () => {
    router.push(isNewUser ? '/book' : '/');
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      default:
        return error.message;
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
          {isNewUser ? 'Sign Up' : 'Sign In'}
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
        {isNewUser && (
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ marginBottom: '15px' }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: '15px', backgroundColor: '#FFC107', color: '#000' }}
          onClick={handleEmailAuth}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : (isNewUser ? 'Sign Up' : 'Sign In')}
        </Button>

        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ marginTop: '10px' }}
          onClick={() => setIsNewUser(!isNewUser)}
          disabled={loading}
        >
          {isNewUser ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;