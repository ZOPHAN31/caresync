/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is for self-hosted / Docker deploys (Linux). It creates
  // symlinks that fail on Windows (EPERM) and isn't needed on Vercel, so it's
  // opt-in: set BUILD_STANDALONE=true in a Linux/Docker build to produce it.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    domains: ['layandyybblrmrpxbctb.supabase.co'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
