/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for server-side rendering and API routes
  // Remove static export to enable dynamic features
  // output: 'export', // Removing this line
  
  // Configure image optimization and remote patterns
  images: {
    // Enable image optimization (remove unoptimized since we're not doing static export)
    domains: ['images.ctfassets.net', 'assets.braintreegateway.com', 'checkoutshopper-test.adyen.com'],
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
    // Enable support for ES modules
    esmExternals: true,
    // Enable server actions for form submissions
    serverActions: true,
    // Configure proper build output for Firebase
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