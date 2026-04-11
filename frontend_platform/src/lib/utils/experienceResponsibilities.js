/**
 * Work highlights / responsibilities per experience entry.
 * Backend: add a field such as `responsibilities` = JSONField(list of strings) on the Experience model.
 */

export function getExperienceResponsibilityLines(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) {
        return p.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Form state: at least one editable row (may be empty). */
export function responsibilitiesToFormLines(raw) {
  const lines = getExperienceResponsibilityLines(raw);
  return lines.length ? [...lines, ''] : [''];
}
