// src/app/layout.js
import Header from '../components/Header';
import localFont from "next/font/local";
import Script from 'next/script';  // Add this import
import ThemeRegistry from './ThemeRegistry';
import { Box } from '@mui/material';
import { customFont } from './fonts.js';
import { AuthProvider } from '../context/AuthContext';
import { ShoppingCartProvider } from './hooks/useShoppingCart';
import { BraintreeProvider } from '../context/BraintreeProvider';

// Load Geist Sans font
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

// Load Geist Mono font
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Define metadata for the application
export const metadata = {
  title: 'Speed Trap Racing',
  description: 'Race scheduling with no waiting',
};

// Root layout component that wraps the entire application
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script 
          src="https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js"
          strategy="beforeInteractive"
          id="braintree-dropin-script"
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeRegistry>
            <BraintreeProvider>
              <ShoppingCartProvider>
                <Header />
                <Box 
                  component="main" 
                  sx={{ 
                    marginTop: '64px'
                  }}
                >
                  {children}
                </Box>
              </ShoppingCartProvider>
            </BraintreeProvider>
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}