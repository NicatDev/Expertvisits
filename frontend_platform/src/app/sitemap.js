const BASE_URL = 'https://expertvisits.com';

export default async function sitemap() {
    let sitemapData = { static_urls: [], dynamic_urls: [] };
    
    try {
        const res = await fetch('http://127.0.0.1:8000/api/seo/sitemap/', { next: { revalidate: 3600 } });
        if (res.ok) {
            sitemapData = await res.json();
        }
    } catch (err) {
        console.error("Sitemap fetch failed", err);
    }
    
    const urls = [];

    // Static platform URLs
    sitemapData.static_urls.forEach((item) => {
        if (item.url === '/') {
            urls.push({
                url: `${BASE_URL}/`,
                lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                changeFrequency: item.changefreq || 'daily',
                priority: item.priority || 0.8,
                alternates: {
                    languages: {
                        en: `${BASE_URL}/en`,
                        az: `${BASE_URL}/az`,
                        ru: `${BASE_URL}/ru`,
                    },
                },
            });
        } else {
            urls.push({
                url: `${BASE_URL}${item.url}`,
                lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                changeFrequency: item.changefreq || 'daily',
                priority: item.priority || 0.8,
            });
        }
    });

    // Dynamic URLs
    sitemapData.dynamic_urls.forEach((item) => {
        // Only include non-portfolio paths
        if (!item.url.startsWith('/u/')) {
            urls.push({
                url: `${BASE_URL}${item.url}`,
                lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                changeFrequency: item.changefreq || 'weekly',
                priority: item.priority || 0.7,
            });
        }
    });

    return urls;
}
