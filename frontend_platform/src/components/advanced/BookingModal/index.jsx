import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Calendar from '../Calendar'; // Import Calendar
import { services } from '@/lib/api';
import styles from './style.module.scss';
import { toast } from 'react-toastify';

const BookingModal = ({ isOpen, onClose, providerId, existingEvents = [], workingDays, workingHours }) => {
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'manual'
    const [loading, setLoading] = useState(false);

    // Form State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');
    const [duration, setDuration] = useState(30);

    // Initial Duration Options
    const durationOptions = [];
    for (let i = 30; i <= 360; i += 30) {
        durationOptions.push(i);
    }

    // Generate Time Options based on working hours
    const timeOptions = React.useMemo(() => {
        if (!workingHours || !workingHours.start || !workingHours.end) {
            // Fallback generic 09:00 - 18:00 if no hours
            return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
        }

        const slots = [];
        const [startH, startM] = workingHours.start.split(':').map(Number);
        const [endH, endM] = workingHours.end.split(':').map(Number);

        // Use arbitrary date to calculate steps
        let current = new Date();
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

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setActiveTab('calendar');
            setDate('');
            setTime('');
            setNote('');
            setDuration(30);
        }
    }, [isOpen]);

    const handleCalendarSelect = (selectInfo) => {
        // selectInfo: { startStr: "YYYY-MM-DDTHH:mm:ss", endStr: ..., start: Date, end: Date }
        const start = new Date(selectInfo.startStr);

        // Populate manual fields from calendar selection
        // YYYY-MM-DD
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);

        // HH:mm
        const hh = String(start.getHours()).padStart(2, '0');
        const min = String(start.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${min}`);

        // Calculate duration if user selected a range
        const diffMins = (new Date(selectInfo.endStr) - start) / 60000;
        if (diffMins >= 30) {
            setDuration(diffMins);
        } else {
            setDuration(30);
        }

        // Switch to manual tab to confirm/edit
        setActiveTab('manual');
    };

    const handleBook = async () => {
        if (!date || !time) {
            toast.error("Please select a date and time.");
            return;
        }

        setLoading(true);
        try {
            // Construct ISO datetime string (UTC)
            const localDate = new Date(`${date}T${time}:00`);
            const requestedDatetime = localDate.toISOString();

            await services.bookSlot({
                provider_id: providerId,
                requested_datetime: requestedDatetime,
                note: note,
                duration_minutes: duration
            });
            toast.success('Booking Request Sent!');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to book slot.');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        let text = '';
        if (h > 0) text += `${h} hr${h > 1 ? 's' : ''}`;
        if (m > 0) text += ` ${m} min`;
        return text.trim();
    };

    const checkOverlap = (mins) => {
        if (!date || !time || !existingEvents) return false;
        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + mins * 60000);

        return existingEvents.some(event => {
            const eStart = new Date(event.start);
            const eEnd = new Date(event.end);
            return (start < eEnd && end > eStart);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment">
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'calendar' ? styles.active : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    Calendar View
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'manual' ? styles.active : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual Input
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'calendar' && (
                    <div style={{ /* Removed max-height here to assume Modal handles scroll */ }}>
                        <p style={{ marginBottom: '10px', color: '#666', fontSize: '0.9rem' }}>
                            Click or drag on the calendar to select a slot.
                        </p>
                        <Calendar
                            events={existingEvents}
                            onDateSelect={handleCalendarSelect}
                            workingDays={workingDays}
                            workingHours={workingHours}
                        />
                    </div>
                )}

                {activeTab === 'manual' && (
                    <div>
                        <div className={styles.row} style={{ marginBottom: '20px' }}>
                            <div className={styles.formGroup}>
                                <label>Date</label>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Time</label>
                                <select
                                    className={styles.selectInput}
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                >
                                    <option value="" disabled>Select Time</option>
                                    {timeOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Duration</label>
                            <select
                                className={styles.selectInput}
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                            >
                                {durationOptions.map(mins => {
                                    const isInvalid = checkOverlap(mins);
                                    return (
                                        <option key={mins} value={mins} disabled={isInvalid}>
                                            {formatDuration(mins)} {isInvalid ? '(Unavailable)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Note (Optional)</label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Briefly describe your request..."
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <Button type="default" onClick={onClose}>Cancel</Button>
                <Button
                    type="primary"
                    loading={loading}
                    onClick={handleBook}
                    disabled={activeTab === 'calendar' || !date || !time}
                >
                    Confirm Booking
                </Button>
            </div>
        </Modal>
    );
};

export default BookingModal;
