import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['*'], // Add your Supabase domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all image URLs
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all image URLs
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
