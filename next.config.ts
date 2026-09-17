import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-slot',
      'motion',
      'sonner',
      '@tanstack/react-query',
      'cmdk',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.appwrite.io',
        pathname: '/v1/storage/buckets/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        pathname: '/v1/storage/buckets/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.worldvectorlogo.com',
        pathname: '/logos/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self "https://verify.didit.me" "https://verification.didit.me"), microphone=(self "https://verify.didit.me" "https://verification.didit.me"), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' only permitted in development for Next.js Fast Refresh / source maps
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com"
                : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.appwrite.io https://cloud.appwrite.io https://cdn.worldvectorlogo.com https://upload.wikimedia.org https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.didit.me",
              "font-src 'self' data:",
              "connect-src 'self' https://*.appwrite.io https://cloud.appwrite.io https://api.freelancexchain.works https://challenges.cloudflare.com https://stats.uptimerobot.com https://*.didit.me https://verification.didit.me https://verify.didit.me http://localhost:* http://127.0.0.1:* wss: ws:",
              "frame-src 'self' https://challenges.cloudflare.com https://verify.didit.me https://verification.didit.me https://*.didit.me",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
