/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/krychek',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co', pathname: '/**' },
      { protocol: 'https', hostname: '*.spotifycdn.com', pathname: '/**' },
    ],
  },
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ],
};
module.exports = nextConfig;
