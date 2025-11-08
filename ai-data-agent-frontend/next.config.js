/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker
  experimental: {
    // Allow runtime environment variables
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Expose environment variables to the server
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Rewrites removed - API calls will be made directly from client using NEXT_PUBLIC_API_URL
};

module.exports = nextConfig;