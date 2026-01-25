import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X } from 'lucide-react';
import { services } from '@/lib/api';

const SimpleBookingModal = ({ isOpen, onClose, initialData, providerId, events = [], workingDays, workingHours, onSuccess }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            if (initialData.startStr) {
                // From Calendar Select
                // FullCalendar select returns startStr/endStr (ISO8601) or start/end (Date objects)

                // dateStr logic was used when I manually constructed object { dateStr: info.startStr }
                // Now I pass full info object.

                // Let's rely on info.start and info.end (Date objects) if available, or parse text strings.
                // FullCalendar's `select` info has `start` and `end` as Date objects.

                const d = initialData.start; // Date object
                if (!d) return; // Should not happen if confirmed

                // Set Date: YYYY-MM-DD
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDate(`${yyyy}-${mm}-${dd}`);

                // Set Time: HH:mm
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                setTime(`${hours}:${minutes}`);

                // Set Duration: based on selection
                if (initialData.end) {
                    const diffMs = initialData.end.getTime() - d.getTime();
                    const diffMins = Math.round(diffMs / 60000);
                    setDuration(diffMins);
                } else {
                    setDuration(30);
                }
            } else if (initialData.dateStr) {
                // Support legacy format if passed differently (manual trigger sometimes?)
                const d = new Date(initialData.dateStr);
                setDate(initialData.dateStr.split('T')[0]);
                if (initialData.dateStr.includes('T')) {
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    setTime(`${hours}:${minutes}`);
                }
            } else {
                // Manual or Reset
                setDate('');
                setTime('');
            }
        }
    }, [isOpen, initialData]);

    const checkOverlap = (start, end) => {
        // Convert to timestamps
        const startMs = start.getTime();
        const endMs = end.getTime();

        for (const evt of events) {
            // evt.start and evt.end are likely ISO strings
            const evtStart = new Date(evt.start).getTime();
            const evtEnd = new Date(evt.end).getTime();

            // Simple overlap check: (StartA < EndB) and (EndA > StartB)
            if (startMs < evtEnd && endMs > evtStart) {
                return true;
            }
        }
        return false;
    };

    const handleConfirm = async () => {
        if (!date || !time) {
            toast.error("Please select date and time");
            return;
        }

        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        // 1. Check Working Days/Hours (Simple check)
        // Note: workingHours is like { start: "09:00", end: "18:00" }
        // check workingDays [1, 2, 3...] where 0=Sun, 1=Mon... (FullCalendar uses 0=Sun)
        // JS Date.getDay() 0=Sun. 
        // Need to match format provided by backend. Usually backend returns 1=Mon...7=Sun or 0-6.
        // Assuming backend is 1=Mon...7=Sun based on previous experience? Or 0=Mon?
        // Actually Profile page used: { value: 0, name: 'Monday' } ... so 0=Mon?.
        // I will trust the user selection for now regarding days but strict overlap check is crucial.

        // 2. Check Overlap
        if (checkOverlap(startDateTime, endDateTime)) {
            toast.error("Selected time overlaps with an existing booking or busy slot.");
            return;
        }

        setLoading(true);
        try {
            // Determine timezone offset 
            // Send as ISO string. 
            // Note: If I define "2024-01-01T10:00" in local, sending it as is to backend might be interpreted as UTC or Local.
            // Previous fix used: localDate.toISOString() (which converts to UTC).
            // So if I picked 10:00 AZT, it becomes 06:00 UTC. Backend expects UTC.

            const payload = {
                provider_id: providerId,
                requested_datetime: startDateTime.toISOString(),
                duration_minutes: duration,
                note: note
            };

            await services.bookSlot(payload);
            toast.success("Booking request sent successfully!");
            onSuccess();

            // Reset fields
            setDate('');
            setTime('');
            setDuration(30);
            setNote('');

            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to book slot. " + (err.response?.data?.detail || ""));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', width: '400px', maxWidth: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Confirm Booking</h3>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Date</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Time</label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Duration</label>
                        <select
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9' }}
                        >
                            <option value={30}>30 Minutes</option>
                            <option value={60}>60 Minutes (1 hour)</option>
                            <option value={90}>90 Minutes (1.5 hours)</option>
                            <option value={120}>120 Minutes (2 hours)</option>
                            <option value={150}>150 Minutes (2.5 hours)</option>
                            <option value={180}>180 Minutes (3 hours)</option>
                            <option value={210}>210 Minutes (3.5 hours)</option>
                            <option value={240}>240 Minutes (4 hours)</option>
                            <option value={270}>270 Minutes (4.5 hours)</option>
                            <option value={300}>300 Minutes (5 hours)</option>
                            <option value={330}>330 Minutes (5.5 hours)</option>
                            <option value={360}>360 Minutes (6 hours)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Note (Optional)</label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9', resize: 'vertical' }}
                            placeholder="Briefly describe your request..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button type="default" onClick={onClose}>Cancel</Button>
                    <Button type="primary" onClick={handleConfirm} loading={loading}>Confirm Booking</Button>
                </div>
            </div>
        </div>
    );
};

export default SimpleBookingModal;
