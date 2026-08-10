export function isVacancyExpired(expiresAt) {
    if (!expiresAt) return false;

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiresAt);
    const expiryDate = dateOnlyMatch
        ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
        : new Date(expiresAt);
    if (Number.isNaN(expiryDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate < today;
}

export function sortVacanciesByStatus(vacancies) {
    return [...(vacancies || [])].sort((a, b) => {
        const expiredDiff = Number(isVacancyExpired(a.expires_at)) - Number(isVacancyExpired(b.expires_at));
        if (expiredDiff !== 0) return expiredDiff;
        return new Date(b.posted_at || 0) - new Date(a.posted_at || 0);
    });
}
