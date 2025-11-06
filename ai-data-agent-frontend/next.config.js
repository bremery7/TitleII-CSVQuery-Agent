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
  async rewrites() {
    return [
      {
        source: '/api/query/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/query/:path*`
          : 'http://localhost:3001/api/query/:path*'
      },
      {
        source: '/api/agent/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/agent/:path*`
          : 'http://localhost:3001/api/agent/:path*'
      }
    ];
  }
};

module.exports = nextConfig;