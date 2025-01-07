import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

const PaymentForm = ({ onSubmit, loading, error }) => {
    return (
        <form onSubmit={(e) => onSubmit(e)}>
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mb: 2 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Pay with Stripe'}
            </Button>
            {error && (
                <Typography color="error" align="center">
                    {error}
                </Typography>
            )}
        </form>
    );
};

export default PaymentForm; 