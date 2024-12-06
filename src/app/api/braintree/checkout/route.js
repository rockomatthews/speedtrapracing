import { NextResponse } from 'next/server';
import braintree from 'braintree';
import medusaClient from '@/lib/medusa-client';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Set dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sanitizes input strings by removing special characters and trimming
 * @param {string | undefined} value - The input value to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(value) {
    // Return empty string if value is undefined or null
    if (!value) {
        return '';
    }

    // Convert to string, remove special characters, trim whitespace, and limit length
    return String(value)
        .replace(/[^\w\s@.-]/g, '')
        .trim()
        .substring(0, 255);
}

/**
 * Logs transaction details and errors to Firestore
 * @param {string} type - Type of transaction log
 * @param {Object} data - Transaction data
 * @param {Error|null} error - Error object if transaction failed
 */
async function logTransaction(type, data, error = null) {
    try {
        // Get reference to transaction_logs collection
        const logsRef = collection(db, 'transaction_logs');

        // Clean data by removing undefined values
        const cleanData = Object.entries(data).reduce(function(accumulator, [key, value]) {
            if (value !== undefined) {
                accumulator[key] = value;
            }
            return accumulator;
        }, {});

        // Construct log entry
        const logEntry = {
            type: type,
            timestamp: serverTimestamp(),
            data: {
                ...cleanData,
                environment: 'production',
                userId: cleanData.userId || 'guest',
                isGuest: !cleanData.userId,
                customerEmail: cleanData.shipping?.email || cleanData.customerEmail || 'unknown'
            },
            error: error ? {
                message: error.message || 'Unknown error',
                stack: error.stack || '',
                code: error.code || 'unknown'
            } : null,
            status: error ? 'error' : 'success'
        };

        // Add log to Firestore
        await addDoc(logsRef, logEntry);
    } catch (logError) {
        console.error('Failed to write transaction log:', logError);
    }
}

/**
 * Creates or updates a customer in Medusa
 * @param {Object} shipping - Customer shipping information
 * @param {string} userId - User ID if available
 * @returns {Promise<string>} Customer ID
 */
async function createOrUpdateMedusaCustomer(shipping, userId) {
    try {
        // Try to find existing customer by email
        const { customers } = await medusaClient.admin.customers.list({
            email: shipping.email
        });

        // If customer exists, update their information
        if (customers && customers.length > 0) {
            const existingCustomer = customers[0];
            
            await medusaClient.admin.customers.update(existingCustomer.id, {
                first_name: shipping.firstName,
                last_name: shipping.lastName,
                email: shipping.email,
                phone: shipping.phone
            });

            return existingCustomer.id;
        } 
        // If customer doesn't exist, create new customer
        else {
            const { customer } = await medusaClient.admin.customers.create({
                first_name: shipping.firstName,
                last_name: shipping.lastName,
                email: shipping.email,
                phone: shipping.phone
            });

            return customer.id;
        }
    } catch (error) {
        console.error('Error managing Medusa customer:', error);
        throw error;
    }
}

/**
 * Creates a new order in Medusa
 * @param {Object} orderData - Order information
 * @param {string} customerId - Medusa customer ID
 * @returns {Promise<string>} Order ID
 */
async function createMedusaOrder(orderData, customerId) {
    try {
        const { order } = await medusaClient.admin.orders.create({
            email: orderData.shipping.email,
            customer_id: customerId,
            items: orderData.items.map(function(item) {
                return {
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    title: item.title,
                    unit_price: item.price * 100 // Convert to cents for Medusa
                };
            }),
            shipping_address: {
                first_name: orderData.shipping.firstName,
                last_name: orderData.shipping.lastName,
                address_1: orderData.shipping.address,
                city: orderData.shipping.city,
                province: orderData.shipping.state,
                postal_code: orderData.shipping.zipCode,
                country_code: orderData.shipping.country,
                phone: orderData.shipping.phone
            },
            billing_address: {
                first_name: orderData.shipping.firstName,
                last_name: orderData.shipping.lastName,
                address_1: orderData.shipping.address,
                city: orderData.shipping.city,
                province: orderData.shipping.state,
                postal_code: orderData.shipping.zipCode,
                country_code: orderData.shipping.country,
                phone: orderData.shipping.phone
            },
            payment_method: {
                provider_id: 'braintree',
                data: {
                    transaction_id: orderData.transactionId
                }
            }
        });

        return order.id;
    } catch (error) {
        console.error('Error creating Medusa order:', error);
        throw error;
    }
}

/**
 * Handles POST requests for processing payments and creating orders
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with transaction results
 */
export async function POST(request) {
    // Initialize Braintree gateway with production credentials
    const gateway = new braintree.BraintreeGateway({
        environment: braintree.Environment.Production,
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });

    try {
        // Parse request data
        const requestData = await request.json();
        const { paymentMethodNonce, amount, items, shipping, userId } = requestData;

        // Validate required fields
        if (!paymentMethodNonce || !amount || !shipping?.email) {
            throw new Error('Missing required fields');
        }

        // Process payment with Braintree
        const transactionResult = await gateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: paymentMethodNonce,
            options: {
                submitForSettlement: true
            },
            customer: {
                firstName: sanitizeInput(shipping.firstName),
                lastName: sanitizeInput(shipping.lastName),
                email: sanitizeInput(shipping.email),
                phone: shipping.phone ? sanitizeInput(shipping.phone) : undefined
            },
            billing: {
                firstName: sanitizeInput(shipping.firstName),
                lastName: sanitizeInput(shipping.lastName),
                streetAddress: sanitizeInput(shipping.address),
                locality: sanitizeInput(shipping.city),
                region: sanitizeInput(shipping.state),
                postalCode: sanitizeInput(shipping.zipCode),
                countryCodeAlpha2: shipping.country
            }
        });

        // Check if transaction was successful
        if (!transactionResult.success) {
            throw new Error(transactionResult.message);
        }

        // Create or update customer in Medusa
        const customerId = await createOrUpdateMedusaCustomer(shipping, userId);

        // Prepare order data for Medusa
        const orderData = {
            shipping: shipping,
            items: items,
            transactionId: transactionResult.transaction.id,
            customerId: customerId
        };

        // Create order in Medusa
        const orderId = await createMedusaOrder(orderData, customerId);

        // Log successful transaction
        await logTransaction('transaction_success', {
            userId: userId,
            customerId: customerId,
            orderId: orderId,
            transactionId: transactionResult.transaction.id,
            amount: transactionResult.transaction.amount
        });

        // Return success response
        return NextResponse.json({
            success: true,
            transaction: {
                id: transactionResult.transaction.id,
                status: transactionResult.transaction.status,
                amount: transactionResult.transaction.amount
            },
            orderId: orderId,
            customerId: customerId
        });

    } catch (error) {
        // Log error
        console.error('Error processing order:', error);

        // Log transaction error
        await logTransaction('system_error', {
            errorType: error.name,
            errorMessage: error.message,
            customerEmail: requestData?.shipping?.email || 'unknown'
        }, error);

        // Return error response
        return NextResponse.json({
            success: false,
            error: 'Order processing failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        }, {
            status: 500
        });
    }
}