const nextConfig = {
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
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    unoptimized: process.env.NODE_ENV === 'production',
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['images.ctfassets.net']
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "net": false,
      "tls": false,
      "fs": false,
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
              "style-src 'self' 'unsafe-inline' https://assets.braintreegateway.com",
              "img-src 'self' data: blob: https: *.ctfassets.net *.braintreegateway.com *.adyen.com *.paypal.com lh3.googleusercontent.com *.googleapis.com",
              "font-src 'self' data: https://assets.braintreegateway.com",
              "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com",
              "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com",
              "object-src 'none'",
              "worker-src 'self' blob:",
              "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
              "style-src-elem 'self' 'unsafe-inline' https://assets.braintreegateway.com"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  },

  env: {
    NEXT_PUBLIC_BRAINTREE_ENVIRONMENT: process.env.BRAINTREE_ENVIRONMENT || 'sandbox',
  },

  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['firebase-admin'],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  distDir: '.next',

  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  reactStrictMode: true,

  poweredByHeader: false,

  compress: true,
};

export default nextConfig;