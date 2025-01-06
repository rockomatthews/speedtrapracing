// PART 1

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Initialize Firebase Admin with explicit credential
const serviceAccount = require('./service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Create Express application instance
const app = express();

// Configure Express middleware with specific CORS settings
app.use(cors({
    origin: [
        'https://speedtrapracing.com', 
        'https://speedtrapracing-aa7c8.web.app',
        'https://speedtrapracing-aa7c8.firebaseapp.com',
        'https://checkout.stripe.com',
        'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net',
        'https://firestore.googleapis.com',
        'https://*.googleapis.com',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
}));

// Enable cookie parsing with secure settings
app.use(cookieParser());

// Enable JSON body parsing
app.use(express.json());

// Load Firebase Functions configuration
const firebaseConfig = functions.config();

// Cookie configuration based on environment
const COOKIE_CONFIG = {
    development: {
        domain: 'localhost',
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 5 * 1000 // 5 days
    },
    production: {
        domain: '.speedtrapracing.com',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 5 * 1000 // 5 days
    }
};

// Initialize Stripe with the secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || functions.config().stripe.secret_key);

// Helper function to get cookie configuration based on environment
function getCookieConfig() {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    return COOKIE_CONFIG[env];
}

// Helper function to set secure cookies
function setSecureCookie(response, name, value, expiresIn) {
    const cookieConfig = getCookieConfig();
    const cookieOptions = {
        maxAge: expiresIn || cookieConfig.maxAge,
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        domain: cookieConfig.domain,
        path: '/',
    };

    // Log cookie setting for debugging
    console.log('Setting cookie with options:', {
        name,
        options: cookieOptions,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });

    response.cookie(name, value, cookieOptions);
}

// Braintree client token generation endpoint
app.get('/api/braintree/client-token', async function(request, response) {
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

    // PART 3

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
app.post('/api/braintree/process-payment', async function(request, response) {
    const { nonce, amount, orderData } = request.body;
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

    // Validate required payment data
    if (!nonce || !amount || !items || !shipping) {
        return response.status(400).json({
            status: 'error',
            message: 'Missing required fields',
            details: { nonce: !!nonce, amount: !!amount, items: !!items, shipping: !!shipping }
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

// Stripe checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items format' });
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: [item.image],
                },
                unit_amount: item.price * 100, // Convert to cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 500, currency: 'usd' },
                        display_name: 'Standard shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 7 },
                        },
                    },
                },
            ],
        });

        res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ 
            error: 'Error creating checkout session',
            details: error.message 
        });
    }
});

//  PART 4

// API test endpoint with detailed system status
app.get('/test', function(request, response) {
    const cookieConfig = getCookieConfig();
    const systemStatus = {
        status: 'success',
        message: 'API system operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        cookieConfig: {
            domain: cookieConfig.domain,
            secure: cookieConfig.secure,
            sameSite: cookieConfig.sameSite
        },
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
    console.log('Starting auth verification process:', {
        timestamp: new Date().toISOString(),
        headers: request.headers,
        cookies: request.cookies
    });

    try {
        const sessionCookie = request.cookies?.adminSession;
        
        // First try to verify existing session cookie
        if (sessionCookie) {
            try {
                const decodedClaim = await admin.auth().verifySessionCookie(sessionCookie, true);
                const userDoc = await admin.firestore().collection('Users').doc(decodedClaim.uid).get();
                const userData = userDoc.data();

                console.log('Session cookie verification successful:', {
                    uid: decodedClaim.uid,
                    email: decodedClaim.email
                });

                return response.json({
                    status: 'success',
                    uid: decodedClaim.uid,
                    email: decodedClaim.email,
                    isAdmin: Boolean(userData?.isAdmin),
                    sessionValid: true
                });
            } catch (sessionError) {
                console.log('Session cookie verification failed:', sessionError);
            }
        }

        // If session cookie invalid or missing, try ID token
        const { idToken } = request.body;

        if (idToken) {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userDoc = await admin.firestore().collection('Users').doc(decodedToken.uid).get();
            const userData = userDoc.data();

            // Create new session
            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            const newSessionCookie = await admin.auth().createSessionCookie(idToken, {
                expiresIn: expiresIn
            });

            // Set cookie using helper function
            setSecureCookie(response, 'adminSession', newSessionCookie, expiresIn);

            console.log('New session created for user:', {
                uid: decodedToken.uid,
                email: decodedToken.email
            });

            return response.json({
                status: 'success',
                uid: decodedToken.uid,
                email: decodedToken.email,
                isAdmin: Boolean(userData?.isAdmin),
                sessionValid: true
            });
        }

        console.log('No valid authentication provided');
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

// PART 5

// Admin verification endpoint with enhanced cookie handling
app.post('/auth/admin/verify', async function(request, response) {
    console.log('Starting admin verification process:', {
        timestamp: new Date().toISOString(),
        headers: request.headers,
        cookies: request.cookies,
        origin: request.get('origin')
    });

    try {
        const { idToken } = request.body;
        const sessionCookie = request.cookies?.adminSession || request.body?.sessionCookie;
        let decodedToken;

        // First try existing session cookie with detailed logging
        if (sessionCookie) {
            try {
                decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
                console.log('Existing session cookie verified:', {
                    uid: decodedToken.uid,
                    timestamp: new Date().toISOString()
                });
            } catch (sessionError) {
                console.error('Session cookie verification failed:', {
                    error: sessionError.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Try ID token if session verification failed or no session exists
        if (!decodedToken && idToken) {
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
                console.log('ID token verified:', {
                    uid: decodedToken.uid,
                    timestamp: new Date().toISOString()
                });

                // Create new session cookie with explicit options
                const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
                const newSessionCookie = await admin.auth().createSessionCookie(idToken, {
                    expiresIn: expiresIn
                });

                // Set the secure cookie with explicit logging
                setSecureCookie(response, 'adminSession', newSessionCookie, expiresIn);
                console.log('New session cookie created and set');

            } catch (tokenError) {
                console.error('ID token verification failed:', {
                    error: tokenError.message,
                    timestamp: new Date().toISOString()
                });
                throw new Error('Invalid authentication token');
            }
        }

        if (!decodedToken) {
            console.error('No valid authentication provided');
            throw new Error('No valid authentication provided');
        }

        // Check if user is admin in Firestore with detailed logging
        const userDoc = await admin.firestore()
            .collection('Users')
            .doc(decodedToken.uid)
            .get();

        if (!userDoc.exists) {
            console.error('User not found:', {
                uid: decodedToken.uid,
                timestamp: new Date().toISOString()
            });
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        
        if (!userData.isAdmin) {
            console.error('User is not admin:', {
                uid: decodedToken.uid,
                email: userData.email,
                timestamp: new Date().toISOString()
            });
            throw new Error('Not authorized as admin');
        }

        // Set CORS headers explicitly
        response.set('Access-Control-Allow-Credentials', 'true');
        response.set('Access-Control-Allow-Origin', request.get('origin'));

        console.log('Admin verification successful:', {
            uid: decodedToken.uid,
            email: userData.email,
            timestamp: new Date().toISOString()
        });

        return response.status(200).json({
            status: 'success',
            isAdmin: true,
            uid: decodedToken.uid,
            email: userData.email,
            sessionValid: true
        });

    } catch (error) {
        console.error('Admin verification error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return response.status(401).json({
            status: 'error',
            message: 'Admin verification failed',
            details: error.message
        });
    }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);