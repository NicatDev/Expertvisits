import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { services } from '@/lib/api';
import styles from './style.module.scss';
import { toast } from 'react-toastify';

const BookingModal = ({ isOpen, onClose, selectedDate, providerId, isOwner = false, existingEvents = [] }) => {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');
    const [duration, setDuration] = useState(30); // Default 30 mins

    const handleBook = async () => {
        setLoading(true);
        try {
            await services.bookSlot({
                provider_id: providerId,
                requested_datetime: selectedDate.startStr, // Match backend field
                note: note,
                duration_minutes: duration
            });
            toast.success(isOwner ? 'Time Blocked Successfully!' : 'Booking Request Sent!');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to book slot.');
        } finally {
            setLoading(false);
        }
    };

    // Duration Options (30 to 360 mins, step 30)
    const durationOptions = [];
    for (let i = 30; i <= 360; i += 30) {
        durationOptions.push(i);
    }

    React.useEffect(() => {
        if (selectedDate && selectedDate.start && selectedDate.end) {
            const diff = (selectedDate.end.getTime() - selectedDate.start.getTime()) / 60000;
            if (diff >= 30) {
                setDuration(diff);
            } else {
                setDuration(30);
            }
        }
    }, [selectedDate]);

    const formatDuration = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        let text = '';
        if (h > 0) text += `${h} hour${h > 1 ? 's' : ''}`;
        if (m > 0) text += ` ${m} min`;
        return text.trim();
    };

    if (!selectedDate) return null;

    const startTime = new Date(selectedDate.startStr || selectedDate.start);

    // Check overlaps for dynamic options
    const checkOverlap = (mins) => {
        if (!existingEvents || existingEvents.length === 0) return false;
        const proposedEnd = new Date(startTime.getTime() + mins * 60000);

        return existingEvents.some(event => {
            const eStart = new Date(event.start);
            const eEnd = new Date(event.end);

            // Check intersection: (StartA < EndB) and (EndA > StartB)
            return (startTime < eEnd && proposedEnd > eStart);
        });
    };

    const endTimeDisplay = new Date(startTime.getTime() + duration * 60000);

    const handleDurationChange = (e) => {
        setDuration(parseInt(e.target.value));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isOwner ? "Block Time" : "Book Appointment"}>
            <div className={styles.content}>
                <div className={styles.infoRow}>
                    <span>Date:</span>
                    <strong>{startTime.toLocaleDateString()}</strong>
                </div>
                <div className={styles.infoRow}>
                    <span>Time:</span>
                    <strong>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTimeDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>

                <div className={styles.formGroup}>
                    <label>Duration</label>
                    <select
                        className={styles.selectInput}
                        value={duration}
                        onChange={handleDurationChange}
                    >
                        {durationOptions.map(mins => {
                            const isInvalid = checkOverlap(mins);
                            if (isInvalid) return null; // Hide invalid options? Or disable?
                            // User asked: "150 dise 2 saat yarim kimi gorunsun... eger 5 saat sonra doludusa 6 saat duration sece bilmemeliyem"
                            // (If full after 5 hours, shouldn't be able to select 6 hours).
                            // So hiding or disabling. Hiding is cleaner for now as it removes unusable choices.
                            return (
                                <option key={mins} value={mins} disabled={isInvalid}>
                                    {formatDuration(mins)}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>{isOwner ? "Title / Reason" : "Note (Optional)"}</label>
                    <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={isOwner ? "e.g. Lunch Break" : "Briefly describe your request..."}
                    />
                </div>
            </div>

            <div className={styles.footer}>
                <Button type="default" onClick={onClose}>Cancel</Button>
                <Button type="primary" loading={loading} onClick={handleBook}>{isOwner ? "Block Slot" : "Confirm Booking"}</Button>
            </div>
        </Modal>
    );
};

export default BookingModal;
