export function vacancyDetailUrl(slug, locale = 'az') {
    const base = (process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://expertvisits.com').replace(/\/$/, '');
    const loc = locale === 'en' ? 'en' : 'az';
    return `${base}/${loc}/vacancies/${slug}`;
}
