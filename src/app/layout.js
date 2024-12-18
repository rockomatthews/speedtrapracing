// src/app/layout.js
import Header from '../components/Header';
import localFont from "next/font/local";
import { CartProvider } from '../context/CartContext';
import ThemeRegistry from './ThemeRegistry';
import { Box } from '@mui/material';
import { customFont } from './fonts.js';
import { AuthProvider } from '../context/AuthContext';
import Script from 'next/script';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: 'Speed Trap Racing',
  description: 'Race scheduling with no waiting',
};

export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Stripe.js */}
        <Script 
          src="https://js.stripe.com/v3/"
          strategy="lazyOnload"
          id="stripe-script"
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeRegistry>
            <CartProvider>
            <Header />
            <Box 
              component="main" 
              sx={{ 
                marginTop: '64px',
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {children}
            </Box>
            </CartProvider>
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}