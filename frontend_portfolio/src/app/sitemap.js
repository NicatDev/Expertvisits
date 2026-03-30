const BASE_URL = 'https://expertvisits.com';

export default async function sitemap() {
    let sitemapData = { static_urls: [], dynamic_urls: [] };

    try {
        const res = await fetch('https://api.expertvisits.com/api/seo/sitemap/', { next: { revalidate: 3600 } });
        if (res.ok) {
            sitemapData = await res.json();
        }
    } catch (err) {
        console.error("Sitemap fetch failed", err);
    }

    const urls = [
        {
            url: `${BASE_URL}/u`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/u/en`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/u/ru`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        }
    ];

    // Only dynamic portfolio URLs for frontend_portfolio
    sitemapData.dynamic_urls.forEach((item) => {
        if (item.url.startsWith('/u/')) {
            urls.push({
                url: `${BASE_URL}${item.url}`,
                lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                changeFrequency: item.changefreq || 'weekly',
                priority: item.priority || 0.8,
            });
        }
    });

    return urls;
}
