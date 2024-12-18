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
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            // Add Stripe image domain
            {
                protocol: 'https',
                hostname: '*.stripe.com',
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
  
    webpack: function(config) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "net": false,
            "tls": false,
            "fs": false,
            "crypto": false,
            "stream": false
        };
        
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true
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
  
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com https://*.googleapis.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https: *.ctfassets.net *.stripe.com lh3.googleusercontent.com *.googleapis.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "connect-src 'self' https://speedtrapracing.com https://*.speedtrapracing.com https://api.contentful.com https://cdn.contentful.com https://preview.contentful.com https://images.ctfassets.net https://api.stripe.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com",
                            "frame-src 'self' https://*.stripe.com https://apis.google.com https://*.googleapis.com https://*.firebaseapp.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                            "worker-src 'self' blob:",
                            "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://*.googleapis.com"
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
                        value: [
                            'accelerometer=()',
                            'camera=()',
                            'geolocation=()',
                            'gyroscope=()',
                            'magnetometer=()',
                            'microphone=()',
                            'payment=(self)',
                            'usb=()'
                        ].join(', ')
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload'
                    }
                ]
            },
            // Rest of your headers configuration remains the same
            {
                source: '/_next/image/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://speedtrapracing.com'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET'
                    }
                ]
            },
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, must-revalidate'
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://speedtrapracing.com'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, OPTIONS'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization'
                    }
                ]
            },
            {
                source: '/admin/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, must-revalidate'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    }
                ]
            }
        ];
    },
  
    // Rest of your config remains the same
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