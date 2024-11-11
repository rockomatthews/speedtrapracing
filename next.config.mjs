/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration for remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.braintreegateway.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'checkoutshopper-test.adyen.com',
        pathname: '/**',
      },
      // Additional patterns for Braintree resources
      {
        protocol: 'https',
        hostname: '*.braintree-api.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.paypal.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.braintreegateway.com',
        pathname: '/**',
      }
    ]
  },

  // Webpack configuration for Node.js polyfills and module resolution
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "net": false,
      "tls": false,
      "fs": false,
    };
    
    // Add additional webpack configurations if needed for Braintree
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any necessary aliases here
    };

    return config;
  },

  // API and security configurations
  async headers() {
    return [
      {
        // Global API route headers
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Credentials', 
            value: 'true' 
          },
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : process.env.NEXT_PUBLIC_SITE_URL || '*' 
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
        ],
      },
      {
        // Specific headers for Braintree API routes
        source: '/api/braintree/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Credentials', 
            value: 'true' 
          },
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : process.env.NEXT_PUBLIC_SITE_URL || '*' 
          },
          { 
            key: 'Access-Control-Allow-Methods', 
            value: 'GET,POST,OPTIONS' 
          },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24 hours cache for preflight requests
          }
        ],
      }
    ];
  },

  // Environment variable configuration
  env: {
    NEXT_PUBLIC_BRAINTREE_ENVIRONMENT: process.env.BRAINTREE_ENVIRONMENT || 'sandbox',
  },

  // API configuration
  async rewrites() {
    return [
      {
        // Rewrite for Braintree client token endpoint
        source: '/api/braintree-token',
        destination: '/api/braintree/token'
      },
      {
        // Rewrite for Braintree payment processing endpoint
        source: '/api/process-payment',
        destination: '/api/braintree/process-payment'
      }
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.braintree-api.com" "https://*.paypal.com")'
          }
        ]
      }
    ];
  },

  // Additional experimental features if needed
  experimental: {
    // Enable if you need modern features
    esmExternals: true,
    outputFileTracingRoot: undefined,
    // Add other experimental features as needed
  }
};

export default nextConfig;