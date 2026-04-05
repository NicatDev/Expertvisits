/** API-dən gələn sub_category obyekti üçün görünən peşə/ad (dilə görə). */
export function labelForSubCategory(sub, lang = 'az') {
    if (!sub || typeof sub !== 'object') return '';
    if (lang === 'en') return sub.profession_en || sub.name_en || '';
    if (lang === 'ru') return sub.profession_ru || sub.name_ru || '';
    return sub.profession_az || sub.name_az || '';
}
