export const formatDate = (dateString, locale = 'en') => {
    if (!dateString) return '';
    const date = new Date(dateString);

    // Map internal locale codes to BCP 47 tags if necessary
    const localeMap = {
        'az': 'az-AZ',
        'ru': 'ru-RU',
        'en': 'en-US'
    };

    const targetLocale = localeMap[locale] || 'en-US';

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return new Intl.DateTimeFormat(targetLocale, options).format(date);
};
