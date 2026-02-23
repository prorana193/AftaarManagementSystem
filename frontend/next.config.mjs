/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'https://dc97d10d-ebd3-4e11-8ad4-55485089aa6c-00-15ulaq10c5tu6.picard.replit.dev',
    'http://dc97d10d-ebd3-4e11-8ad4-55485089aa6c-00-15ulaq10c5tu6.picard.replit.dev',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
