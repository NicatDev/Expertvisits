/**
 * Local wall-clock time in 24-hour HH:mm (not locale-dependent).
 */
export function normalizeHm(value) {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    const parts = s.split(':');
    if (parts.length < 2) return s;
    const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatLocalTimeHm(dateLike) {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    return normalizeHm(`${d.getHours()}:${d.getMinutes()}`);
}

/** Date part only — user locale for month/day order; time is separate. */
export function formatLocalDateShort(dateLike) {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLocalBookingDateTimeLine(dateLike) {
    const t = formatLocalTimeHm(dateLike);
    const date = formatLocalDateShort(dateLike);
    if (!date && !t) return '';
    return `${date} ${t}`.trim();
}

/** Same calendar day: "12 Apr 2026, 09:00 – 10:00"; else full range. */
export function formatLocalBookingRange(startLike, endLike) {
    const s = startLike instanceof Date ? startLike : new Date(startLike);
    const e = endLike instanceof Date ? endLike : new Date(endLike);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
    if (s.toDateString() === e.toDateString()) {
        return `${formatLocalDateShort(s)}, ${formatLocalTimeHm(s)} – ${formatLocalTimeHm(e)}`;
    }
    return `${formatLocalBookingDateTimeLine(s)} – ${formatLocalBookingDateTimeLine(e)}`;
}

/** Every 30 minutes from 00:00 to 23:30. */
export function everyHalfHourSlots() {
    const slots = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
        const h = String(Math.floor(minutes / 60)).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        slots.push(`${h}:${m}`);
    }
    return slots;
}

/** Half-hour steps between work_hours start/end (exclusive of end as slot start). */
export function workingHoursHalfHourSlots(startStr, endStr) {
    if (!startStr || !endStr) return everyHalfHourSlots();
    const slots = [];
    const [startH, startM] = String(startStr).split(':').map((x) => parseInt(x, 10) || 0);
    const [endH, endM] = String(endStr).split(':').map((x) => parseInt(x, 10) || 0);
    const current = new Date();
    current.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);
    while (current < end) {
        slots.push(formatLocalTimeHm(current));
        current.setMinutes(current.getMinutes() + 30);
    }
    return slots.length ? slots : everyHalfHourSlots();
}

function compareHm(a, b) {
    const [ah, am] = String(a).split(':').map((x) => parseInt(x, 10) || 0);
    const [bh, bm] = String(b).split(':').map((x) => parseInt(x, 10) || 0);
    return ah * 60 + am - (bh * 60 + bm);
}

export function withSlotFallback(slots, value) {
    const v = normalizeHm(value);
    if (!v) return slots;
    if (slots.includes(v)) return slots;
    return [...slots, v].sort(compareHm);
}
