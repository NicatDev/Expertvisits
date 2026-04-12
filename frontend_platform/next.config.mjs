/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      /* /sitemap/0.xml → /sitemap/0 (Route Handler) — Next app qovluğu .xml ilə bitmir */
      { source: '/sitemap/:id.xml', destination: '/sitemap/:id' },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'f9da94e68bb010775333b931ada830c6.r2.cloudflarestorage.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'pub-168042768634454d99435c94d19157aa.r2.dev',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
