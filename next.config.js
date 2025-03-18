/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Add webpack configuration if needed
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all image URLs for development
      }
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Force exclusion of API routes from static optimization
    unstable_includeFiles: {
      include: [],
      exclude: [
        '**/api/stories/generate/webhook/**/*', 
        '**/api/stories/generate/**/*'
      ]
    }
  }
};

module.exports = nextConfig;