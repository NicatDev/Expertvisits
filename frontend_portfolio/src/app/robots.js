export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/u/*/articles/',
      ],
    },
    sitemap: 'https://expertvisits.com/sitemap.xml',
  }
}
