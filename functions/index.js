const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const braintree = require('braintree');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create Express application instance
const app = express();

// Configure Express middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie']
}));

// Enable cookie parsing
app.use(cookieParser());

// Enable JSON body parsing
app.use(express.json());

// Load Firebase Functions configuration
const firebaseConfig = functions.config();

// Initialize Braintree payment gateway
let braintreeGateway = null;

try {
    // Validate required Braintree configuration
    const requiredBraintreeConfig = {
        merchantId: firebaseConfig.braintree?.merchantid,
        publicKey: firebaseConfig.braintree?.publickey,
        privateKey: firebaseConfig.braintree?.privatekey,
        environment: firebaseConfig.braintree?.environment
    };

    // Check for missing configuration
    const missingConfig = Object.entries(requiredBraintreeConfig)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingConfig.length > 0) {
        throw new Error(
            `Missing required Braintree configuration: ${missingConfig.join(', ')}. ` +
            'Please set using firebase functions:config:set'
        );
    }

    // Initialize Braintree gateway with configuration
    braintreeGateway = new braintree.BraintreeGateway({
        environment: braintree.Environment[
            requiredBraintreeConfig.environment === 'production' ? 
            'Production' : 
            'Sandbox'
        ],
        merchantId: requiredBraintreeConfig.merchantId,
        publicKey: requiredBraintreeConfig.publicKey,
        privateKey: requiredBraintreeConfig.privateKey
    });

    console.log('Braintree gateway initialized successfully', {
        environment: requiredBraintreeConfig.environment,
        timestamp: new Date().toISOString()
    });
} catch (error) {
    console.error('Braintree initialization error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}

// Braintree client token generation endpoint
app.get('/braintree/client-token', async function(request, response) {
    // Check if Braintree is properly initialized
    if (braintreeGateway === null) {
        console.error('Braintree client token request failed: Gateway not initialized', {
            timestamp: new Date().toISOString(),
            requestId: request.id
        });

        return response.status(503).json({
            status: 'error',
            message: 'Payment service not initialized',
            code: 'SERVICE_UNAVAILABLE',
            timestamp: new Date().toISOString()
        });
    }

    try {
        // Log token generation attempt
        console.log('Generating Braintree client token', {
            timestamp: new Date().toISOString(),
            requestId: request.id
        });

        // Generate new client token
        const clientTokenResult = await braintreeGateway.clientToken.generate({});

        // Log successful token generation
        console.log('Braintree client token generated successfully', {
            timestamp: new Date().toISOString(),
            requestId: request.id
        });
        
        // Return success response with token
        return response.status(200).json({
            status: 'success',
            clientToken: clientTokenResult.clientToken,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log detailed error information
        console.error('Braintree client token generation failed:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            requestId: request.id
        });

        // Return error response
        return response.status(500).json({
            status: 'error',
            message: 'Failed to generate client token',
            code: 'TOKEN_GENERATION_FAILED',
            error: error.message,
            details: error.details || {},
            timestamp: new Date().toISOString()
        });
    }
});

// Braintree payment processing endpoint
app.post('/braintree/process-payment', async function(request, response) {
    // Check if Braintree is properly initialized
    if (braintreeGateway === null) {
        console.error('Payment processing failed: Gateway not initialized', {
            timestamp: new Date().toISOString(),
            requestId: request.id
        });

        return response.status(503).json({
            status: 'error',
            message: 'Payment service not initialized',
            code: 'SERVICE_UNAVAILABLE'
        });
    }

    // Extract payment information from request
    const { nonce, amount, orderData } = request.body;

    // Validate required payment data
    if (!nonce || !amount) {
        return response.status(400).json({
            status: 'error',
            message: 'Missing required payment information',
            code: 'INVALID_REQUEST'
        });
    }

    try {
        // Process the payment transaction
        const transactionResult = await braintreeGateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true
            }
        });

        // Handle transaction result
        if (transactionResult.success) {
            return response.status(200).json({
                status: 'success',
                transaction: transactionResult.transaction,
                timestamp: new Date().toISOString()
            });
        } else {
            return response.status(400).json({
                status: 'error',
                message: 'Transaction failed',
                code: 'TRANSACTION_FAILED',
                details: transactionResult.errors
            });
        }
    } catch (error) {
        console.error('Payment processing error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return response.status(500).json({
            status: 'error',
            message: 'Payment processing failed',
            code: 'PROCESSING_ERROR',
            error: error.message
        });
    }
});

// API test endpoint
app.get('/test', function(request, response) {
    const systemStatus = {
        status: 'success',
        message: 'API system operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        services: {
            braintree: {
                configured: Boolean(firebaseConfig.braintree),
                environment: firebaseConfig.braintree?.environment || 'undefined',
                hasMerchantId: Boolean(firebaseConfig.braintree?.merchantid),
                hasPublicKey: Boolean(firebaseConfig.braintree?.publickey),
                hasPrivateKey: Boolean(firebaseConfig.braintree?.privatekey),
                gatewayInitialized: braintreeGateway !== null
            },
            firebase: {
                adminInitialized: Boolean(admin.apps.length),
                databaseAvailable: Boolean(admin.firestore)
            }
        }
    };

    return response.status(200).json(systemStatus);
});

// Regular auth verification endpoint
app.post('/auth/verify', async function(request, response) {
    console.log('Starting auth verification process');

    try {
        // Check for session cookie first (for middleware verification)
        const sessionCookie = request.cookies?.adminSession;
        
        if (sessionCookie) {
            try {
                const decodedClaim = await admin.auth().verifySessionCookie(sessionCookie, true);
                const userDoc = await admin.firestore().collection('Users').doc(decodedClaim.uid).get();
                const userData = userDoc.data();

                return response.json({
                    status: 'success',
                    uid: decodedClaim.uid,
                    email: decodedClaim.email,
                    isAdmin: Boolean(userData?.isAdmin),
                    sessionValid: true
                });
            } catch (sessionError) {
                console.log('Session verification failed:', sessionError);
                // Continue to ID token check if session verification fails
            }
        }

        // If no valid session, check for ID token (for initial login)
        const { idToken } = request.body;

        if (idToken) {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userDoc = await admin.firestore().collection('Users').doc(decodedToken.uid).get();
            const userData = userDoc.data();

            // Create new session
            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            const sessionCookie = await admin.auth().createSessionCookie(idToken, {
                expiresIn: expiresIn
            });

            // Set cookie in response
            response.cookie('adminSession', sessionCookie, {
                maxAge: expiresIn,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/'
            });

            return response.json({
                status: 'success',
                uid: decodedToken.uid,
                email: decodedToken.email,
                isAdmin: Boolean(userData?.isAdmin),
                sessionValid: true
            });
        }

        // No valid authentication provided
        return response.status(401).json({
            status: 'error',
            message: 'No valid authentication provided',
            code: 'NO_AUTH'
        });

    } catch (error) {
        console.error('Auth verification error:', error);
        return response.status(401).json({
            status: 'error',
            message: error.message,
            code: 'AUTH_ERROR'
        });
    }
});

// Admin verification endpoint
app.post('/auth/admin/verify', async function(request, response) {
    console.log('Starting admin verification process');

    try {
        const { idToken, sessionCookie } = request.body;
        let decodedToken;

        // First try session cookie if provided
        if (sessionCookie) {
            try {
                decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
            } catch (sessionError) {
                console.error('Session cookie verification failed:', sessionError);
            }
        }

        // If session verification failed or no session cookie, try ID token
        if (!decodedToken && idToken) {
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (tokenError) {
                console.error('ID token verification failed:', tokenError);
                throw new Error('Invalid authentication token');
            }
        }

        if (!decodedToken) {
            throw new Error('No valid authentication provided');
        }

        // Check if user is admin in Firestore
        const userDoc = await admin.firestore()
            .collection('Users')
            .doc(decodedToken.uid)
            .get();

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        
        if (!userData.isAdmin) {
            throw new Error('Not authorized as admin');
        }

        // If this was an ID token verification, create a session cookie
        let newSessionCookie = null;
        if (idToken) {
            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            newSessionCookie = await admin.auth().createSessionCookie(idToken, {
                expiresIn: expiresIn
            });

            // Set the cookie in response
            response.cookie('adminSession', newSessionCookie, {
                maxAge: expiresIn,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/'
            });
        }

        return response.status(200).json({
            status: 'success',
            isAdmin: true,
            uid: decodedToken.uid,
            email: userData.email
        });

    } catch (error) {
        console.error('Admin verification error:', error);
        return response.status(401).json({
            status: 'error',
            message: 'Admin verification failed',
            details: error.message
        });
    }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);