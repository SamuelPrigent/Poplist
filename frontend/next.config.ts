import type { NextConfig } from 'next';

// URL du backend pour le proxy (NEXT_PUBLIC_ est aussi dispo côté serveur)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  devIndicators: false,

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Formats modernes
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
    ],
  },
};

export default nextConfig;
