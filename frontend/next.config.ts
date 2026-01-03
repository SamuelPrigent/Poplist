import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
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
