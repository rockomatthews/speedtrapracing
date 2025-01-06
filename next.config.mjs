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
        hostname: 'checkoutshopper-test.adyen.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      }
    ],
    domains: ['images.ctfassets.net']
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com https://apis.google.com https://*.googleapis.com; " +
              "connect-src 'self' https://*.stripe.com https://api.stripe.com https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net https://*.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://*.firebase.googleapis.com https://*.contentful.com https://cdn.contentful.com https://preview.contentful.com https://api.contentful.com; " +
              "frame-src 'self' https://*.stripe.com https://js.stripe.com; " +
              "img-src 'self' data: blob: https: *.ctfassets.net *.stripe.com lh3.googleusercontent.com *.googleapis.com; " +
              "font-src 'self' https: data:; " +
              "media-src 'self'; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "worker-src 'self' blob:;"
          },
          {
            key: 'X-Content-Security-Policy',
            value: ''
          },
          {
            key: 'X-WebKit-CSP',
            value: ''
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      }
    ];
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "net": false,
      "tls": false,
      "fs": false,
      "crypto": false,
      "stream": false
    };
    
    return config;
  },

  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['firebase-admin'],
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'speedtrapracing.com',
        'www.speedtrapracing.com',
        'speedtrapracing-aa7c8.web.app',
        'speedtrapracing-aa7c8.firebaseapp.com'
      ]
    }
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  generateBuildId: async function() {
    return `build-${Date.now()}-production`;
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'https://us-central1-speedtrapracing-aa7c8.cloudfunctions.net/api/:path*',
          basePath: false
        }
      ]
    };
  },
  output: 'standalone',
  serverRuntimeConfig: {
    dynamicPages: ['schedule', 'profile']
  },
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://speedtrapracing.com' 
    : '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx']
};

export default nextConfig;