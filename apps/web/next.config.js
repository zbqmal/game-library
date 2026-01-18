/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared workspace packages
  transpilePackages: ['@game-library/shared'],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
