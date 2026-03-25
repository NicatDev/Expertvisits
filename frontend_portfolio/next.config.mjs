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
                hostname: 'pub-168042768634454d99435c94d19157aa.r2.dev',
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;
