import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
  },
  env: {
    // Allow EXPO_PUBLIC_BACKEND_URL (from the original Expo project) to be
    // used as NEXT_PUBLIC_BACKEND_URL so both env var names work in Vercel.
    NEXT_PUBLIC_BACKEND_URL:
      process.env.EXPO_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      '',
  },
};

export default nextConfig;
