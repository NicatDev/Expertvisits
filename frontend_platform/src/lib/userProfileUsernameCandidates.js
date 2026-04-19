/**
 * İctimai profil URL-i üçün accounts/users/... sorğusunda sıra ilə yoxlanacaq username variantları.
 * Nümunə: linkdə DərgahAbdullayev, DB-də Dərgah_Abdullayev.
 */
export function userProfileUsernameCandidates(raw) {
    if (raw == null || raw === '' || raw === 'undefined') return [];
    let s = String(raw).trim();
    const out = [];
    const add = (v) => {
        const t = (v || '').trim();
        if (t && !out.includes(t)) out.push(t);
    };
    add(s);
    if (s.includes('%')) {
        try {
            s = decodeURIComponent(s).trim();
            add(s);
        } catch {
            /* ignore */
        }
    }
    try {
        add(s.normalize('NFC'));
    } catch {
        /* ignore */
    }
    if (!s.includes('_')) {
        for (let i = 1; i < s.length; i++) {
            const c = s.charCodeAt(i);
            if (c >= 65 && c <= 90) {
                add(`${s.slice(0, i)}_${s.slice(i)}`);
                break;
            }
        }
    }
    return out;
}
