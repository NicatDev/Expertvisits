import { City, Country } from 'country-state-city';

let catalogMemo = null;
let validNamesMemo = null;

export function normalizeLocationSearchText(text) {
    if (!text) return '';
    let t = text.toLowerCase().trim();
    return t
        .replace(/ə/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ş/g, 'sh')
        .replace(/ç/g, 'ch')
        .replace(/ü/g, 'u');
}

export function getCityCatalog() {
    if (catalogMemo) return catalogMemo;
    const countriesMap = Country.getAllCountries().reduce((acc, c) => {
        acc[c.isoCode] = c.name;
        return acc;
    }, {});
    catalogMemo = City.getAllCities().map((city) => ({
        name: city.name,
        displayName: `${city.name}, ${countriesMap[city.countryCode] || city.countryCode}`,
        latitude: city.latitude,
        longitude: city.longitude,
        countryCode: city.countryCode,
    }));
    return catalogMemo;
}

function cityMatchesSearch(city, normSearch) {
    const cityNorm = normalizeLocationSearchText(city.displayName);
    let matches = cityNorm.includes(normSearch);

    if (!matches) {
        if ((normSearch.includes('baki') || normSearch.includes('baku')) && cityNorm.includes('baku')) {
            matches = true;
        }
        if ((normSearch.includes('ganc') || normSearch.includes('genc')) && cityNorm.includes('ganja')) {
            matches = true;
        }
        if (normSearch.includes('naxchi') && cityNorm.includes('nakhch')) matches = true;
        if (normSearch.includes('xirdal') && cityNorm.includes('khirdal')) matches = true;
        if (normSearch.includes('shamax') && cityNorm.includes('shamakh')) matches = true;
        if (normSearch.includes('lankar') && cityNorm.includes('lənkər')) matches = true;
        if (normSearch.includes('mingech') && cityNorm.includes('mingach')) matches = true;
    }

    return matches;
}

/** All cities matching the search (no limit). Used for unambiguous legacy coercion. */
export function findCitiesMatchingSearch(searchTerm) {
    if (!searchTerm || !String(searchTerm).trim()) return [];
    const normSearch = normalizeLocationSearchText(searchTerm);
    if (!normSearch) return [];
    return getCityCatalog().filter((city) => cityMatchesSearch(city, normSearch));
}

export function getValidLocationDisplayNameSet() {
    if (validNamesMemo) return validNamesMemo;
    validNamesMemo = new Set(getCityCatalog().map((c) => c.displayName));
    return validNamesMemo;
}

export function isValidLocationDisplayName(value) {
    if (!value || typeof value !== 'string') return false;
    return getValidLocationDisplayNameSet().has(value.trim());
}

/**
 * If the string is already a canonical display name, return it.
 * If it matches exactly one city in the catalog (e.g. legacy "Baku"), return that display name.
 * Otherwise return '' so the user must pick from the list.
 */
export function coerceLocationToValidDisplayName(raw) {
    if (!raw || !String(raw).trim()) return '';
    const t = raw.trim();
    if (isValidLocationDisplayName(t)) return t;
    const hits = findCitiesMatchingSearch(t);
    if (hits.length === 1) return hits[0].displayName;
    return '';
}
