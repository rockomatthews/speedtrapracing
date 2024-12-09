import { NextResponse } from 'next/server';
import braintree from 'braintree';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function sanitizeInputValue(inputValue) {
    if (inputValue === null || inputValue === undefined) {
        return '';
    }

    return String(inputValue)
        .replace(/[^\w\s@.-]/g, '')
        .trim()
        .substring(0, 255);
}

async function createTransactionLog(transactionType, transactionData, transactionError = null) {
    try {
        const transactionLogsCollection = collection(db, 'transaction_logs');
        
        const cleanedTransactionData = Object.entries(transactionData).reduce(function(cleanedData, [key, value]) {
            if (value !== undefined) {
                cleanedData[key] = value;
            }
            return cleanedData;
        }, {});

        const transactionLogEntry = {
            type: transactionType,
            timestamp: serverTimestamp(),
            data: {
                ...cleanedTransactionData,
                environment: 'production',
                userId: cleanedTransactionData.userId || 'guest',
                isGuest: !cleanedTransactionData.userId,
                customerEmail: cleanedTransactionData.shipping?.email || cleanedTransactionData.customerEmail || 'unknown',
                platform: 'speedtrapracing.com',
                source: 'braintree-checkout'
            },
            error: transactionError ? {
                message: transactionError.message || 'Unknown error occurred',
                stack: transactionError.stack || '',
                code: transactionError.code || 'unknown',
                timestamp: new Date().toISOString()
            } : null,
            status: transactionError ? 'error' : 'success'
        };

        const transactionLogReference = await addDoc(transactionLogsCollection, transactionLogEntry);
        return transactionLogReference.id;
    } catch (loggingError) {
        console.error('Failed to create transaction log entry:', {
            errorMessage: loggingError.message,
            errorStack: loggingError.stack,
            timestamp: new Date().toISOString()
        });
        return null;
    }
}

export async function POST(request) {
    let incomingRequestData = null;
    let braintreeTransactionResult = null;
    let transactionLogId = null;

    try {
        incomingRequestData = await request.json();
        
        const { 
            paymentMethodNonce, 
            amount, 
            items, 
            shipping, 
            userId 
        } = incomingRequestData;

        if (!paymentMethodNonce) {
            throw new Error('Payment method nonce must be provided');
        }

        if (!amount || isNaN(parseFloat(amount))) {
            throw new Error('Valid payment amount must be provided');
        }

        if (!shipping?.email) {
            throw new Error('Shipping email address must be provided');
        }

        const braintreeGateway = new braintree.BraintreeGateway({
            environment: braintree.Environment.Production,
            merchantId: process.env.BRAINTREE_MERCHANT_ID,
            publicKey: process.env.BRAINTREE_PUBLIC_KEY,
            privateKey: process.env.BRAINTREE_PRIVATE_KEY
        });

        console.log('Processing payment transaction:', {
            amount: amount,
            email: shipping.email,
            timestamp: new Date().toISOString()
        });

        braintreeTransactionResult = await braintreeGateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: paymentMethodNonce,
            options: {
                submitForSettlement: true
            },
            customer: {
                firstName: sanitizeInputValue(shipping.firstName),
                lastName: sanitizeInputValue(shipping.lastName),
                email: sanitizeInputValue(shipping.email),
                phone: shipping.phone ? sanitizeInputValue(shipping.phone) : undefined
            },
            billing: {
                firstName: sanitizeInputValue(shipping.firstName),
                lastName: sanitizeInputValue(shipping.lastName),
                streetAddress: sanitizeInputValue(shipping.address),
                locality: sanitizeInputValue(shipping.city),
                region: sanitizeInputValue(shipping.state),
                postalCode: sanitizeInputValue(shipping.zipCode),
                countryCodeAlpha2: shipping.country
            },
            shipping: {
                firstName: sanitizeInputValue(shipping.firstName),
                lastName: sanitizeInputValue(shipping.lastName),
                streetAddress: sanitizeInputValue(shipping.address),
                locality: sanitizeInputValue(shipping.city),
                region: sanitizeInputValue(shipping.state),
                postalCode: sanitizeInputValue(shipping.zipCode),
                countryCodeAlpha2: shipping.country
            }
        });

        console.log('Payment transaction completed:', {
            success: braintreeTransactionResult.success,
            transactionId: braintreeTransactionResult.transaction?.id,
            status: braintreeTransactionResult.transaction?.status,
            timestamp: new Date().toISOString()
        });

        if (!braintreeTransactionResult.success) {
            throw new Error(braintreeTransactionResult.message || 'Payment transaction failed');
        }

        transactionLogId = await createTransactionLog('transaction_success', {
            userId: userId,
            transactionId: braintreeTransactionResult.transaction.id,
            amount: braintreeTransactionResult.transaction.amount,
            shipping: shipping,
            items: items,
            paymentProcessor: 'braintree',
            paymentMethod: braintreeTransactionResult.transaction.paymentInstrumentType
        });

        const successResponse = NextResponse.json({
            success: true,
            transaction: {
                id: braintreeTransactionResult.transaction.id,
                status: braintreeTransactionResult.transaction.status,
                amount: braintreeTransactionResult.transaction.amount,
                paymentMethod: braintreeTransactionResult.transaction.paymentInstrumentType
            },
            orderId: transactionLogId
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Content-Type': 'application/json'
            }
        });

        return successResponse;

    } catch (error) {
        console.error('Payment transaction failed:', {
            errorMessage: error.message,
            errorType: error.name,
            errorStack: error.stack,
            requestData: incomingRequestData,
            timestamp: new Date().toISOString()
        });

        await createTransactionLog('payment_error', {
            errorType: error.name,
            errorMessage: error.message,
            customerEmail: incomingRequestData?.shipping?.email || 'unknown',
            transactionResult: braintreeTransactionResult ? {
                success: braintreeTransactionResult.success,
                message: braintreeTransactionResult.message,
                status: braintreeTransactionResult.transaction?.status
            } : null,
            timestamp: new Date().toISOString()
        }, error);

        const errorResponse = NextResponse.json({
            success: false,
            error: 'Payment processing failed',
            message: error.message,
            code: error.code || 'PAYMENT_ERROR',
            timestamp: new Date().toISOString()
        }, { 
            status: 400,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Content-Type': 'application/json'
            }
        });

        return errorResponse;
    }
}