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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
              "style-src 'self' 'unsafe-inline' https://assets.braintreegateway.com",
              "img-src 'self' data: blob: https: *.ctfassets.net *.braintreegateway.com *.adyen.com *.paypal.com lh3.googleusercontent.com *.googleapis.com",
              "font-src 'self' data: https://assets.braintreegateway.com https://fonts.gstatic.com",
              "connect-src 'self' https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://*.braintree-api.com https://*.paypal.com https://*.braintreepayments.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://apis.google.com https://client-analytics.braintreegateway.com https://api.braintreegateway.com https://api2.amplitude.com https://*.cloudfunctions.net",
              "frame-src 'self' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://apis.google.com https://*.googleapis.com https://assets.braintreegateway.com https://*.firebaseapp.com https://speedtrapracing-aa7c8.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "script-src-elem 'self' 'unsafe-inline' https://*.braintreegateway.com https://*.paypal.com https://*.braintreepayments.com https://js.braintreegateway.com https://apis.google.com https://*.googleapis.com https://www.paypalobjects.com https://api2.amplitude.com",
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
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self https://*.braintree-api.com https://*.paypal.com https://*.braintreepayments.com), usb=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
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
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  },

  env: {
    NEXT_PUBLIC_BRAINTREE_ENVIRONMENT: 'production',
    BRAINTREE_MERCHANT_ID: 'nw8dgz48gg9sr53b',
    BRAINTREE_PUBLIC_KEY: 'dwq5jj83m6gn59rg',
    BRAINTREE_PRIVATE_KEY: 'fd5336ad01dd98d7eda800b123d16260'
  },

  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['firebase-admin'],
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'speedtrapracing-aa7c8.web.app',
        'speedtrapracing-aa7c8.firebaseapp.com'
      ]
    }
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

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/admin/:path*',
          has: [
            {
              type: 'cookie',
              key: 'adminSession'
            }
          ],
          destination: '/admin/:path*'
        }
      ],
      fallback: [
        {
          source: '/admin/:path*',
          destination: '/login'
        }
      ]
    };
  }
};

export default nextConfig;