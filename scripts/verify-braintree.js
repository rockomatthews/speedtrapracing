const braintree = require('braintree');
require('dotenv').config({ path: '.env.local.test' }); // Use our test file

async function verifyBraintreeSetup() {
    console.log('Starting Braintree verification...');

    // 1. Check environment variables
    console.log('\nEnvironment Variables Check:');
    const envVars = {
        BRAINTREE_ENVIRONMENT: process.env.BRAINTREE_ENVIRONMENT,
        BRAINTREE_MERCHANT_ID: process.env.BRAINTREE_MERCHANT_ID,
        BRAINTREE_PUBLIC_KEY: process.env.BRAINTREE_PUBLIC_KEY,
        BRAINTREE_PRIVATE_KEY: process.env.BRAINTREE_PRIVATE_KEY
    };

    Object.entries(envVars).forEach(([key, value]) => {
        console.log(`${key}: ${value ? '✓ Present' : '✗ Missing'} ${value ? `(${value.length} characters)` : ''}`);
    });

    // 2. Validate credential format
    console.log('\nCredential Format Check:');
    const formatChecks = {
        merchantId: process.env.BRAINTREE_MERCHANT_ID?.match(/^[a-zA-Z0-9]{16}$/),
        publicKey: process.env.BRAINTREE_PUBLIC_KEY?.match(/^[a-zA-Z0-9]{16}$/),
        privateKey: process.env.BRAINTREE_PRIVATE_KEY?.match(/^[a-zA-Z0-9]{32}$/)
    };

    Object.entries(formatChecks).forEach(([key, isValid]) => {
        console.log(`${key}: ${isValid ? '✓ Valid format' : '✗ Invalid format'}`);
    });

    // 3. Test Gateway Connection
    console.log('\nTesting Gateway Connection:');
    try {
        const gateway = new braintree.BraintreeGateway({
            environment: process.env.BRAINTREE_ENVIRONMENT === 'production' 
                ? braintree.Environment.Production 
                : braintree.Environment.Sandbox,
            merchantId: process.env.BRAINTREE_MERCHANT_ID,
            publicKey: process.env.BRAINTREE_PUBLIC_KEY,
            privateKey: process.env.BRAINTREE_PRIVATE_KEY
        });

        console.log('Gateway initialized, attempting to generate token...');

        const result = await gateway.clientToken.generate({});
        
        if (result.clientToken) {
            console.log('✓ Successfully generated client token');
            console.log('Token preview:', result.clientToken.substring(0, 50) + '...');
            
            // 4. Test Additional Gateway Operations
            console.log('\nTesting Additional Gateway Operations:');
            
            try {
                const transactionResult = await gateway.transaction.find('nonexistent');
                console.log('Transaction find test: Unexpected success');
            } catch (error) {
                if (error.type === 'notFoundError') {
                    console.log('✓ Transaction API access verified (expected not found error)');
                } else {
                    console.log('✗ Transaction API test failed:', error.type);
                }
            }
        }
    } catch (error) {
        console.error('\n✗ Gateway test failed:', {
            type: error.type,
            message: error.message,
            details: error.details || {}
        });
        
        // Additional error analysis
        if (error.type === 'authenticationError') {
            console.log('\nPossible authentication issues:');
            console.log('1. Credentials might be from different environments (sandbox vs production)');
            console.log('2. Merchant account might be inactive');
            console.log('3. API keys might need to be regenerated');
            console.log('4. Credentials might be from a different merchant account');
        }
    }
}

verifyBraintreeSetup()
    .then(() => console.log('\nVerification complete'))
    .catch(err => console.error('\nVerification failed:', err))
    .finally(() => process.exit());