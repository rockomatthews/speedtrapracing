// src/app/layout.js

// Import all required dependencies
import Header from '../components/Header';
import localFont from "next/font/local";
import ThemeRegistry from './ThemeRegistry';
import { Box } from '@mui/material';
import { customFont } from './fonts.js';
import { AuthProvider } from '../context/AuthContext';
import { ShoppingCartProvider } from './hooks/useShoppingCart';
import { BraintreeProvider } from '../context/BraintreeProvider';
import BraintreeScripts from '../components/BraintreeScripts';

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
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        {/* Load all Braintree scripts before the app initializes */}
        <BraintreeScripts />

        {/* Authentication wrapper */}
        <AuthProvider>
          {/* Material UI theme wrapper */}
          <ThemeRegistry>
            {/* Braintree payment provider */}
            <BraintreeProvider>
              {/* Shopping cart state provider */}
              <ShoppingCartProvider>
                {/* Global header component */}
                <Header />
                
                {/* Main content area */}
                <Box 
                  component="main" 
                  sx={{ 
                    marginTop: '64px' // Space for fixed header
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