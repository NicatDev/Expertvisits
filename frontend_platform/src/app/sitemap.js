const BASE_URL = 'https://expertvisits.com';

export default async function sitemap() {
    let sitemapData = { static_urls: [], dynamic_urls: [] };

    try {
        const res = await fetch('https://api.expertvisits.com/api/seo/sitemap/', { next: { revalidate: 60 } });
        if (res.ok) {
            sitemapData = await res.json();
        }
    } catch (err) {
        console.error("Sitemap fetch failed", err);
    }

    const urls = [];

    // Static platform URLs
    sitemapData.static_urls.forEach((item) => {
        const u = item.url;

        urls.push({
            url: `${BASE_URL}${u}`,
            lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
            changeFrequency: item.changefreq || 'daily',
            priority: u === '/' ? 1.0 : (item.priority || 0.8),
        });

        // Add localized variants for Home/Root
        if (u === '/') {
            // Platform localized home
            ['en', 'ru'].forEach(lang => {
                urls.push({
                    url: `${BASE_URL}/${lang}/`,
                    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                    changeFrequency: 'daily',
                    priority: 0.9,
                });
            });
            
            // PORTFOLIO informational pages (since basePath is /u)
            urls.push({
                url: `${BASE_URL}/u`,
                lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                changeFrequency: 'monthly',
                priority: 0.9,
            });
            ['en', 'ru'].forEach(lang => {
                urls.push({
                    url: `${BASE_URL}/u/${lang}`,
                    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                    changeFrequency: 'monthly',
                    priority: 0.8,
                });
            });
        }

        // For specific pages that user wants localized variants
        if (u === '/experts/' || u === '/experts') {
            ['en', 'ru'].forEach(lang => {
                urls.push({
                    url: `${BASE_URL}/experts/${lang}`,
                    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                    changeFrequency: item.changefreq || 'daily',
                    priority: 0.7,
                });
            });
        }
        
        if (u === '/vacancies/' || u === '/vacancies') {
            ['en', 'ru'].forEach(lang => {
                urls.push({
                    url: `${BASE_URL}/${lang}/vacancies`,
                    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                    changeFrequency: item.changefreq || 'daily',
                    priority: 0.7,
                });
            });
        }
    });

    // Dynamic URLs (Both Platform and Portfolio)
    sitemapData.dynamic_urls.forEach((item) => {
        urls.push({
            url: `${BASE_URL}${item.url}`,
            lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
            changeFrequency: item.changefreq || 'weekly',
            priority: item.priority || 0.7,
        });

        // Add localized variants for articles (Platform only)
        if (item.url.startsWith('/article/')) {
            const pathWithoutSlash = item.url.startsWith('/') ? item.url.slice(1) : item.url;
            ['en', 'ru'].forEach(lang => {
                urls.push({
                    url: `${BASE_URL}/${lang}/${pathWithoutSlash}`,
                    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            });
        }
    });

    return urls;
}
