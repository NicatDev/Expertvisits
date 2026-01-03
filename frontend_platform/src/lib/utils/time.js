export const generateTimeSlots = (startStr, endStr, stepMins = 30) => {
    const slots = [];
    if (!startStr || !endStr) return slots;

    // Parse HH:mm
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
        const h = String(current.getHours()).padStart(2, '0');
        const m = String(current.getMinutes()).padStart(2, '0');
        slots.push(`${h}:${m}`);
        current.setMinutes(current.getMinutes() + stepMins);
    }
    return slots;
};
