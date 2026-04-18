const nextConfig = {
    basePath: '/c',

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
            {
                protocol: 'https',
                hostname: 'api.expertvisits.com',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '8000',
                pathname: '/media/**',
            },
        ],
    },
};

export default nextConfig;
