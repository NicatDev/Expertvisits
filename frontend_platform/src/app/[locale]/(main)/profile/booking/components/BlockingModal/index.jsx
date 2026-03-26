import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { services } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './style.module.scss'; // Reuse or create new

const BlockingModal = ({ isOpen, onClose, selectedEvent, providerId, onSuccess, workingHours, events }) => {
    const { t } = useTranslation('common');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [note, setNote] = useState('Busy');
    const [loading, setLoading] = useState(false);

    // Initial Duration Options
    const durationOptions = [];
    for (let i = 30; i <= 480; i += 30) {
        durationOptions.push(i);
    }

    // Generate Time Options
    const timeOptions = React.useMemo(() => {
        if (!workingHours || !workingHours.start || !workingHours.end) {
            return [];
        }
        const slots = [];
        const [startH, startM] = workingHours.start.split(':').map(Number);
        const [endH, endM] = workingHours.end.split(':').map(Number);

        const current = new Date();
        current.setHours(startH, startM, 0, 0);
        const end = new Date();
        end.setHours(endH, endM, 0, 0);

        while (current < end) {
            const h = String(current.getHours()).padStart(2, '0');
            const m = String(current.getMinutes()).padStart(2, '0');
            slots.push(`${h}:${m}`);
            current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
    }, [workingHours]);

    useEffect(() => {
        if (isOpen && selectedEvent) {
            const start = selectedEvent.start;
            const end = selectedEvent.end;

            // YYYY-MM-DD
            const yyyy = start.getFullYear();
            const mm = String(start.getMonth() + 1).padStart(2, '0');
            const dd = String(start.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);

            // HH:mm
            const hh = String(start.getHours()).padStart(2, '0');
            const min = String(start.getMinutes()).padStart(2, '0');
            const timeStr = `${hh}:${min}`;

            // Use closest available slot or exact
            setTime(timeStr);

            const diff = Math.round((end - start) / 60000);
            setDuration(diff > 0 ? diff : 30);
            setNote('Busy');
        }
    }, [isOpen, selectedEvent]);

    const checkOverlap = (start, end) => {
        if (!events) return false;
        const startMs = start.getTime();
        const endMs = end.getTime();

        for (const evt of events) {
            const evtStart = new Date(evt.start).getTime();
            const evtEnd = new Date(evt.end).getTime();

            if (startMs < evtEnd && endMs > evtStart) {
                return true;
            }
        }
        return false;
    };

    const handleBlock = async () => {
        if (!date || !time) {
            toast.error(t('profile.toasts.select_date_time'));
            return;
        }

        const localDate = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(localDate.getTime() + duration * 60000);

        if (checkOverlap(localDate, endDateTime)) {
            toast.error(t('profile.toasts.overlap_error'));
            return;
        }

        setLoading(true);
        try {
            // Convert to Date object (Local Time) then to ISO String (UTC)
            // Explicitly ensuring browser parses it as local time by not adding 'Z'
            // const localDate = new Date(`${date}T${time}:00`); // Already defined above
            const requestedDatetime = localDate.toISOString();

            await services.bookSlot({
                provider_id: providerId,
                requested_datetime: requestedDatetime,
                note: note,
                duration_minutes: duration
            });

            toast.success(t('profile.toasts.time_blocked_success'));
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.block_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Block Time Slot">
            <div className={styles.content}>
                <div className={styles.summaryBox}>
                    <p className={styles.label}>Configure Block</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Starts At</label>
                            <select
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="" disabled>Select Time</option>
                                {timeOptions.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                                {/* If selected time not in options (e.g. dragged weirdly), show it anyway */}
                                {!timeOptions.includes(time) && time && <option value={time}>{time}</option>}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Duration</label>
                        <select
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value))}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            {durationOptions.map(min => (
                                <option key={min} value={min}>{min} mins ({min / 60} hrs)</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Note / Reason</label>
                    <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Lunch, Private Meeting..."
                    />
                </div>
            </div>

            <div className={styles.footer}>
                <Button type="default" onClick={onClose}>Cancel</Button>
                <Button type="primary" loading={loading} onClick={handleBlock}>Confirm Block</Button>
            </div>
        </Modal>
    );
};

export default BlockingModal;
