const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const braintree = require('braintree');

// Initialize Firebase Admin directly - no credentials needed in Cloud Functions environment
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Load configuration from Firebase config
const config = functions.config();

// Initialize Braintree with Firebase config
let gateway = null;
try {
    if (!config.braintree?.merchantid || !config.braintree?.publickey || !config.braintree?.privatekey) {
        throw new Error('Missing Braintree configuration. Please set using firebase functions:config:set');
    }

    gateway = new braintree.BraintreeGateway({
        environment: braintree.Environment[config.braintree?.environment === 'production' ? 'Production' : 'Sandbox'],
        merchantId: config.braintree.merchantid,
        publicKey: config.braintree.publickey,
        privateKey: config.braintree.privatekey
    });
    console.log('Braintree gateway initialized successfully');
} catch (error) {
    console.error('Braintree initialization error:', error);
}

app.get('/braintree/client-token', async (request, response) => {
    if (!gateway) {
        console.error('Braintree gateway not initialized');
        return response.status(500).json({
            status: 'error',
            message: 'Payment service not initialized',
            code: 'SERVICE_UNAVAILABLE'
        });
    }

    try {
        console.log('Attempting to generate client token...');
        const result = await gateway.clientToken.generate({});
        console.log('Client token generated successfully');
        
        return response.json({
            status: 'success',
            clientToken: result.clientToken
        });
    } catch (error) {
        console.error('Error generating client token:', error);
        return response.status(500).json({
            status: 'error',
            message: 'Failed to generate client token',
            code: 'TOKEN_GENERATION_FAILED',
            error: error.message,
            details: error.details || {}
        });
    }
});

// Test endpoint to verify function is working
app.get('/test', (request, response) => {
    response.json({
        status: 'success',
        message: 'API is working',
        braintreeConfig: {
            environment: config.braintree?.environment,
            hasMerchantId: !!config.braintree?.merchantid,
            hasPublicKey: !!config.braintree?.publickey,
            hasPrivateKey: !!config.braintree?.privatekey
        },
        firebaseAdmin: {
            isInitialized: admin.apps.length > 0
        }
    });
});

exports.api = functions.https.onRequest(app);