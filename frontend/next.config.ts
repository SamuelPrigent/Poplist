import type { NextConfig } from 'next';

// URL du backend pour le proxy (NEXT_PUBLIC_ est aussi dispo côté serveur)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  devIndicators: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://image.tmdb.org https://res.cloudinary.com data:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Rewrites pour proxifier les appels API vers le backend
  // Cela permet aux cookies d'être sur le même domaine (same-site)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },

  // Optimisation des images
  images: {
    unoptimized: true,
  },

  // Experimental features
  experimental: {
    // Optimized package imports
    optimizePackageImports: [
      'lucide-react',
      'motion/react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
    ],
  },
};

export default nextConfig;
