export function parseServiceSteps(steps) {
    if (!steps) return [];
    if (Array.isArray(steps)) return steps;
    if (typeof steps === 'string') {
        try {
            const p = JSON.parse(steps);
            return Array.isArray(p) ? p : [];
        } catch {
            return [];
        }
    }
    return [];
}
