import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, Link, MapPin } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { services } from '@/lib/api';

const SimpleBookingModal = ({
    isOpen,
    onClose,
    initialData,
    providerId,
    events = [],
    workingDays,
    workingHours,
    onSuccess,
    canBook = true,
}) => {
    const { t } = useTranslation('common');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [note, setNote] = useState('');
    const [meetLink, setMeetLink] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && initialData) {
            if (initialData.startStr) {
                const d = initialData.start; // Date object
                if (!d) return;

                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDate(`${yyyy}-${mm}-${dd}`);

                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                setTime(`${hours}:${minutes}`);

                if (initialData.end) {
                    const diffMs = initialData.end.getTime() - d.getTime();
                    const diffMins = Math.round(diffMs / 60000);
                    setDuration(diffMins);
                } else {
                    setDuration(30);
                }
            } else if (initialData.dateStr) {
                const d = new Date(initialData.dateStr);
                setDate(initialData.dateStr.split('T')[0]);
                if (initialData.dateStr.includes('T')) {
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    setTime(`${hours}:${minutes}`);
                }
            } else {
                setDate('');
                setTime('');
            }
        }
        if (!isOpen) {
            // Reset all fields when modal closes
            setDate('');
            setTime('');
            setDuration(30);
            setNote('');
            setMeetLink('');
            setLocation('');
            setErrors({});
        }
    }, [isOpen, initialData]);

    const checkOverlap = (start, end) => {
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

    const handleConfirm = async () => {
        setErrors({});
        if (!canBook) {
            toast.info(t('public_profile.booking_unavailable_toast'));
            return;
        }
        if (!date || !time) {
            toast.error(t('booking_modal.select_date_error'));
            return;
        }

        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        // Past check
        if (startDateTime < new Date()) {
            toast.error(t('booking_modal.past_time_error', { defaultValue: 'You cannot book a slot in the past.' }));
            return;
        }

        if (checkOverlap(startDateTime, endDateTime)) {
            toast.error(t('booking_modal.overlap_error', { defaultValue: 'Selected time overlaps with an existing booking.' }));
            return;
        }

        setLoading(true);
        try {
            const payload = {
                provider_id: providerId,
                requested_datetime: startDateTime.toISOString(),
                duration_minutes: duration,
                note: note || null,
                meet_link: meetLink || null,
                location: location || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            await services.bookSlot(payload);
            toast.success(t('booking_modal.success'));
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                setErrors(err.response.data);
                if (err.response.data.detail || err.response.data.non_field_errors) {
                    toast.error(t('booking_modal.error') + ' ' + (err.response.data.detail || err.response.data.non_field_errors[0] || ''));
                }
            } else {
                toast.error(t('booking_modal.error'));
            }
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
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', width: '440px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>{t('booking_modal.confirm')}</h3>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('booking_modal.date')}</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} error={errors.requested_datetime?.[0]} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('booking_modal.time')}</label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('booking_modal.duration')}</label>
                        <select
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9' }}
                        >
                            <option value={30}>30 {t('booking_modal.min')}</option>
                            <option value={60}>60 {t('booking_modal.min')} (1 {t('booking_modal.hr')})</option>
                            <option value={90}>90 {t('booking_modal.min')} (1.5 {t('booking_modal.hr')})</option>
                            <option value={120}>120 {t('booking_modal.min')} (2 {t('booking_modal.hr')})</option>
                            <option value={150}>150 {t('booking_modal.min')} (2.5 {t('booking_modal.hr')})</option>
                            <option value={180}>180 {t('booking_modal.min')} (3 {t('booking_modal.hr')})</option>
                            <option value={210}>210 {t('booking_modal.min')} (3.5 {t('booking_modal.hr')})</option>
                            <option value={240}>240 {t('booking_modal.min')} (4 {t('booking_modal.hr')})</option>
                        </select>
                    </div>

                    {/* Meet Link */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '14px' }}>
                            <Link size={14} />
                            {t('booking_modal.meet_link')}
                        </label>
                        <Input
                            type="url"
                            value={meetLink}
                            onChange={e => setMeetLink(e.target.value)}
                            placeholder={t('booking_modal.meet_link_placeholder')}
                            error={errors.meet_link?.[0]}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '14px' }}>
                            <MapPin size={14} />
                            {t('booking_modal.location')}
                        </label>
                        <Input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder={t('booking_modal.location_placeholder')}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('booking_modal.note')}</label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9', resize: 'vertical', boxSizing: 'border-box' }}
                            placeholder={t('booking_modal.placeholder')}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button type="default" onClick={onClose}>{t('booking_modal.cancel')}</Button>
                    <Button type="primary" onClick={handleConfirm} loading={loading}>{t('booking_modal.confirm')}</Button>
                </div>
            </div>
        </div>
    );
};

export default SimpleBookingModal;
