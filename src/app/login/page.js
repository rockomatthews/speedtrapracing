'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon, Apple as AppleIcon } from '@mui/icons-material';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import { useRouter } from 'next/navigation';
import loginBackground from '../../public/loginBackground.png';
import { auth } from '../../config/firebase';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup, 
    GoogleAuthProvider, 
    FacebookAuthProvider,
    sendPasswordResetEmail,
    getAuth
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import safeStorage from '../../utils/safeStorage';
import { signIn } from '../../utils/auth';
import { useAuth } from '../../context/AuthContext';

// Base URL for Firebase Functions - IMPORTANT: this should not include /api
const FIREBASE_FUNCTIONS_URL = process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net'
    : 'http://localhost:3000';

const ERROR_MESSAGES = {
    USER_NOT_FOUND: 'No user found with this email address.',
    WRONG_PASSWORD: 'Incorrect password. Please try again.',
    EMAIL_IN_USE: 'An account with this email already exists.',
    NOT_ADMIN: 'Not authorized as admin.',
    PASSWORDS_NOT_MATCH: 'Passwords do not match.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
    DEFAULT: 'An error occurred during authentication.',
    SOCIAL_LOGIN_FAILED: 'Social login failed. Please try again.',
    UNSUPPORTED_PROVIDER: 'This login provider is not supported.',
};

const INITIAL_USER_DATA = {
    tokens: 2,
    isInitiated: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
};

const LoginPage = () => {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/admin');
    const [snackbarMessage, setSnackbarMessage] = useState({
        open: false,
        severity: 'success',
        message: ''
    });

    // Get redirect path from URL on component mount
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const fromPath = searchParams.get('from');
        if (fromPath) {
            setRedirectPath(decodeURIComponent(fromPath));
        }
    }, []);

    // Error message handler with complete error mapping
    const getErrorMessage = (error) => {
        console.log('Processing error:', error);
        
        switch (error.code) {
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please check your credentials and try again.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/too-many-requests':
                return 'Too many failed login attempts. Please try again later or reset your password.';
            default:
                if (error.message.includes('Not authorized as admin')) {
                    return 'You are not authorized to access the admin area.';
                }
                console.error('Detailed auth error:', error);
                return error.message || 'An error occurred during authentication.';
        }
    };

    // Admin verification function
    const verifyAdminAccess = async function(user) {
        const idToken = await user.getIdToken(true);
        console.log('Verifying admin access at:', `${FIREBASE_FUNCTIONS_URL}/api/auth/admin/verify`);
        
        const verifyResponse = await fetch(`${FIREBASE_FUNCTIONS_URL}/api/auth/admin/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                idToken: idToken,
                timestamp: Date.now()
            }),
            credentials: 'include'
        });

        if (!verifyResponse.ok) {
            console.error('Admin verification failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText
            });
            throw new Error(ERROR_MESSAGES.NOT_ADMIN);
        }

        const responseData = await verifyResponse.json();
        console.log('Admin verification response:', responseData);
        return responseData;
    };

    // Regular user verification function
    const verifyRegularUser = async function(user) {
        const idToken = await user.getIdToken(true);
        console.log('Verifying regular user at:', `${FIREBASE_FUNCTIONS_URL}/api/auth/verify`);
        
        const verifyResponse = await fetch(`${FIREBASE_FUNCTIONS_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                idToken: idToken, 
                timestamp: Date.now() 
            }),
            credentials: 'include'
        });

        if (!verifyResponse.ok) {
            console.error('Regular user verification failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText
            });
            throw new Error('User verification failed');
        }

        const responseData = await verifyResponse.json();
        console.log('Regular user verification response:', responseData);
        return responseData;
    };

    // User data handling function
    const handleUserData = async function(user) {
        console.log('Handling user data for:', user.email);
        
        const userDocRef = doc(db, 'Users', user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        let userData;

        if (!userDocSnapshot.exists()) {
            console.log('Creating new user document for:', user.email);
            userData = {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                ...INITIAL_USER_DATA
            };
            await setDoc(userDocRef, userData);
            setIsNewUser(true);
        } else {
            console.log('Updating existing user document for:', user.email);
            userData = userDocSnapshot.data();
            await setDoc(userDocRef, {
                ...userData,
                lastLoginAt: new Date().toISOString()
            }, { merge: true });
            setIsNewUser(false);
        }

        // Store session data
        const sessionData = {
            email: user.email,
            uid: user.uid,
            isAdmin: userData.isAdmin || false,
            lastLogin: new Date().toISOString()
        };
        
        console.log('Storing session data:', sessionData);
        safeStorage.setItem('userSession', sessionData);

        return userData;
    };

    // Main authentication handler
    const handleAuthentication = async function(user, isAdminRoute) {
        console.log('Handling authentication for:', {
            email: user.email,
            isAdminRoute: isAdminRoute
        });

        if (isAdminRoute) {
            console.log('Verifying admin access for:', user.email);
            const adminVerification = await verifyAdminAccess(user);
            if (!adminVerification.isAdmin) {
                console.error('Admin verification failed - user is not admin');
                throw new Error(ERROR_MESSAGES.NOT_ADMIN);
            }
            console.log('Admin verification successful');
        } else {
            console.log('Verifying regular user access for:', user.email);
            await verifyRegularUser(user);
        }

        const userData = await handleUserData(user);
        console.log('User data processed successfully:', userData);
        return userData;
    };

    // Social media login handler
    const handleSocialLogin = async function(providerName) {
        setLoading(true);
        setError('');
        
        try {
            // Get URL parameters and determine route type
            // In handleSocialLogin:
const searchParams = new URLSearchParams(window.location.search);
const redirectPath = decodeURIComponent(searchParams.get('from') || '/');
const isAdminRoute = redirectPath.startsWith('/admin');

// Log with decoded path for debugging
console.log('Starting social login process:', {
    provider: providerName,
    intendedRedirectPath: redirectPath,
    decodedPath: decodeURIComponent(redirectPath),
    isAdminRoute: isAdminRoute
});
            
            // Set up authentication provider
            let authProvider;
            switch (providerName) {
                case 'Google':
                    authProvider = new GoogleAuthProvider();
                    break;
                case 'Facebook':
                    authProvider = new FacebookAuthProvider();
                    break;
                default:
                    console.error('Unsupported provider:', providerName);
                    throw new Error(ERROR_MESSAGES.UNSUPPORTED_PROVIDER);
            }
            
            // Attempt social login
            console.log('Initiating social login popup for:', providerName);
            const result = await signInWithPopup(auth, authProvider);
            console.log('Social login successful for:', result.user.email);
    
            // Handle authentication and admin verification
            try {
                await handleAuthentication(result.user, isAdminRoute);
                console.log('Authentication and verification completed successfully');
            } catch (authError) {
                console.error('Authentication/verification failed:', authError);
                throw authError;
            }
            
            // Perform redirect based on route type
            if (isAdminRoute) {
                console.log('Admin login successful. Redirecting to:', redirectPath);
                window.location.replace(redirectPath);
            } else {
                console.log('Regular user login successful. Redirecting to:', redirectPath);
                router.push(redirectPath);
            }
    
        } catch (error) {
            console.error('Social login error:', {
                provider: providerName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            setError(error.message.includes('admin') 
                ? ERROR_MESSAGES.NOT_ADMIN 
                : ERROR_MESSAGES.SOCIAL_LOGIN_FAILED
            );
        } finally {
            setLoading(false);
        }
    };

    // Email authentication handler
    const handleEmailAuth = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { user, isAdmin } = await signIn(email, password);
            
            // For admin routes, verify admin status
            if (redirectPath.startsWith('/admin')) {
                if (!isAdmin) {
                    throw new Error('Not authorized as admin');
                }
            }

            // If we get here, authentication was successful
            router.push(redirectPath);
        } catch (error) {
            console.error('Authentication error:', error);
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Add this function to your login component
    const handleResetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            // Show success message
            setSnackbarMessage({
                open: true,
                severity: 'success',
                message: 'Password reset email sent! Check your inbox.'
            });
        } catch (error) {
            console.error('Password reset error:', error);
            setSnackbarMessage({
                open: true,
                severity: 'error',
                message: 'Failed to send reset email: ' + error.message
            });
        }
    };

    // UI Rendering
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `url(${loginBackground.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }
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
                <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        marginBottom: 5 
                    }}
                >
                    <SportsMotorsportsIcon 
                        alt="Helmet Icon" 
                        style={{ 
                            width: 50, 
                            height: 50, 
                            marginBottom: 30 
                        }} 
                    />
                    {isNewUser ? 'Sign Up' : 'Sign In'}
                </Typography>

                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '10px', 
                        marginBottom: '20px' 
                    }}
                >
                    <IconButton 
                        onClick={() => handleSocialLogin('Google')} 
                        sx={{ 
                            backgroundColor: '#4285F4', 
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#3367D6'
                            } 
                        }}
                    >
                        <GoogleIcon />
                    </IconButton>
                    <IconButton 
                        onClick={() => handleSocialLogin('Facebook')} 
                        sx={{ 
                            backgroundColor: '#3b5998', 
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#2d4373'
                            }
                        }}
                    >
                        <FacebookIcon />
                    </IconButton>
                    <IconButton 
                        sx={{ 
                            backgroundColor: '#000', 
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#333'
                            }
                        }}
                        disabled
                    >
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
                    onChange={(event) => setEmail(event.target.value)}
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
                    onChange={(event) => setPassword(event.target.value)}
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
                        onChange={(event) => setConfirmPassword(event.target.value)}
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
                    <Typography 
                        color="error" 
                        variant="body2" 
                        sx={{ marginBottom: '15px' }}
                    >
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ 
                        marginTop: '15px', 
                        backgroundColor: '#FFC107', 
                        color: '#000',
                        '&:hover': {
                            backgroundColor: '#FFA000'
                        },
                        '&:disabled': {
                            backgroundColor: '#FFE082',
                            color: 'rgba(0, 0, 0, 0.26)'
                        }
                    }}
                    onClick={handleEmailAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : (
                        isNewUser ? 'Sign Up' : 'Sign In'
                    )}
                </Button>

                <Button
                    variant="text"
                    color="primary"
                    fullWidth
                    sx={{ 
                        marginTop: '10px',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }}
                    onClick={() => setIsNewUser(!isNewUser)}
                    disabled={loading}
                >
                    {isNewUser ? 
                        'Already have an account? Sign In' : 
                        "Don't have an account? Sign Up"
                    }
                </Button>

                <Button
                    variant="text"
                    onClick={() => handleResetPassword(email)}
                    sx={{ mt: 1 }}
                >
                    Forgot Password?
                </Button>
            </Box>
        </Box>
    );
};

export default LoginPage;