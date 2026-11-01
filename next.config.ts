import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL || (process.env.NODE_ENV === 'production'
  ? 'https://swift-e-commerce.onrender.com/api'
  : 'http://localhost:5000/api');

// Allow product/category uploads served by the backend through next/image.
const apiHostPattern: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = (() => {
  try {
    const u = new URL(backendApiUrl);
    return [{
      protocol: u.protocol.replace(':', '') as 'http' | 'https',
      hostname: u.hostname,
      port: u.port,
      pathname: '/uploads/**',
    }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [{ source: '/api/backend/:path*', destination: `${backendApiUrl.replace(/\/$/, '')}/:path*` }];
  },
  async headers() {
    return ['/auth/:path*', '/settings'].map(source => ({
      source,
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        { key: 'Referrer-Policy', value: process.env.NODE_ENV === 'development' ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin' },
      ],
    }));
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/uploads/**' },
      ...apiHostPattern,
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
