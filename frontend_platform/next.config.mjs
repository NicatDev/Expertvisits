/** @type {import('next').NextConfig} */
const nextConfig = {
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
