/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image optimization and remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'downloads.ctfassets.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.ctfassets.net',
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
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      }
    ],
    minimumCacheTTL: 60
  },

  // Configure webpack for Node.js compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "net": false,
      "tls": false,
      "fs": false,
    };
    return config;
  },

  // Configure security headers
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
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow scripts from Google APIs, Braintree, and PayPal
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com",
              // Allow styles from self and inline styles
              "style-src 'self' 'unsafe-inline'",
              // Allow images from all necessary sources
              "img-src 'self' data: blob: https://*.ctfassets.net https://*.braintreegateway.com https://*.adyen.com https://*.paypal.com https://lh3.googleusercontent.com https://*.googleapis.com",
              // Allow fonts from self and data URIs
              "font-src 'self' data:",
              // Allow connections to all necessary APIs
              "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com",
              // Allow frames from payment providers and Google
              "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://apis.google.com https://*.googleapis.com",
              // Disable object sources for security
              "object-src 'none'",
              // Allow worker scripts for necessary functionality
              "worker-src 'self' blob:",
              // Add specific script-src-elem directive for element-level script control
              "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com"
            ].join('; ')
          }
        ]
      }
    ];
  },

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_BRAINTREE_ENVIRONMENT: process.env.BRAINTREE_ENVIRONMENT || 'sandbox',
  },

  // Experimental features configuration
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['firebase-admin'],
  },

  // Disable type checking during builds for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configure build output directory
  distDir: '.next',

  // Generate unique build ID for each deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Configure powered by header
  poweredByHeader: false,

  // Configure compression
  compress: true,
};

export default nextConfig;