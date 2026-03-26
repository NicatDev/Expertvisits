export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/profile/',
        '/user/',
        '/admin/',
        '/api/',
        '/u/*/articles/',
      ],
    },
    sitemap: 'https://expertvisits.com/sitemap.xml',
  }
}
