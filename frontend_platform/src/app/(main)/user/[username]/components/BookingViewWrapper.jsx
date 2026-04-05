import React, { useState } from 'react';
import { formatLocalBookingRange } from '@/lib/time24h';
import Button from '@/components/ui/Button';
import CalendarView from './CalendarView';
import SimpleBookingModal from './SimpleBookingModal';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';

const BookingViewWrapper = ({ profile, events, onBack, onBookingSuccess }) => {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null); // { dateStr: string } or null
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const [selectedEvent, setSelectedEvent] = useState(null);

    const canAcceptBookings =
        Boolean(profile?.is_service_open) &&
        Array.isArray(profile?.working_days) &&
        profile.working_days.length > 0;

    const notifyBookingUnavailable = () => {
        toast.info(t('public_profile.booking_unavailable_toast'));
    };

    const handleCalendarSelect = (info) => {
        if (!canAcceptBookings) {
            notifyBookingUnavailable();
            return;
        }
        setModalData(info);
        setIsModalOpen(true);
    };

    const handleEventClick = (info) => {
        // info.event.extendedProps: { status, note }
        // title: "Request Pending" etc.
        const evt = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            status: info.event.extendedProps.status,
            meetLink: info.event.extendedProps.meet_link,
            location: info.event.extendedProps.location,
            note: info.event.extendedProps.note
        };
        setSelectedEvent(evt);
    };

    const handleManualBooking = () => {
        if (!canAcceptBookings) {
            notifyBookingUnavailable();
            return;
        }
        setModalData(null);
        setIsModalOpen(true);
    };

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.3s' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Button type="text" onClick={onBack} style={{ paddingLeft: 0, color: '#666' }}>
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        {t('public_profile.back_to_profile')}
                    </Button>
                    <h2 style={{ marginTop: '8px', marginBottom: '4px' }}>{t('public_profile.book_a_session')}</h2>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
                        {t('public_profile.select_slot_instruction')}
                    </p>
                </div>

                <Button type="primary" onClick={handleManualBooking}>
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    {t('public_profile.manual_booking')}
                </Button>
            </div>

            {/* Calendar */}
            <CalendarView
                events={events} // Pass events (busy slots)
                onDateSelect={handleCalendarSelect}
                onEventClick={handleEventClick}
                isServiceOpen={Boolean(profile.is_service_open)}
                workingDays={profile.working_days}
                workingHours={{
                    start: profile.work_hours_start,
                    end: profile.work_hours_end
                }}
            />

            {/* Modal */}
            <SimpleBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={modalData}
                providerId={profile.id}
                events={events}
                canBook={canAcceptBookings}
                workingDays={profile.working_days}
                workingHours={{
                    start: profile.work_hours_start,
                    end: profile.work_hours_end
                }}
                onSuccess={() => {
                    setIsModalOpen(false);
                    if (onBookingSuccess) onBookingSuccess();
                }}
            />

            {/* Action Modal for Existing Events */}
            {
                selectedEvent && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }} onClick={() => setSelectedEvent(null)}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '300px' }} onClick={e => e.stopPropagation()}>
                            <h3>{selectedEvent.title}</h3>
                            <p style={{ marginTop: '4px', marginBottom: '4px' }}><strong>{t('profile.booking.time', { defaultValue: 'Time' })}:</strong> {formatLocalBookingRange(selectedEvent.start, selectedEvent.end)}</p>
                            {selectedEvent.meetLink && (
                                <p style={{ marginTop: '4px', marginBottom: '4px' }}><strong>{t('booking_modal.meet_link')}:</strong> <a href={selectedEvent.meetLink} target="_blank" rel="noreferrer" style={{ color: '#1890ff', textDecoration: 'underline' }}>{selectedEvent.meetLink}</a></p>
                            )}
                            {selectedEvent.location && (
                                <p style={{ marginTop: '4px', marginBottom: '4px' }}><strong>{t('booking_modal.location')}:</strong> {selectedEvent.location}</p>
                            )}
                            {selectedEvent.note && (
                                <p style={{ marginTop: '4px', marginBottom: '8px' }}><strong>{t('booking_modal.note')}:</strong> {selectedEvent.note}</p>
                            )}

                            {(selectedEvent.title !== 'Busy' && selectedEvent.title !== 'Blocked') ? (
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <Button type="default" style={{ borderColor: 'red', color: 'red' }} onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Cancel Booking',
                                            message: 'Are you sure you want to cancel this booking?',
                                            onConfirm: async () => {
                                                const { services } = await import('@/lib/api');
                                                try {
                                                    await services.updateBookingStatus(selectedEvent.id, 'cancelled');
                                                    if (onBookingSuccess) onBookingSuccess();
                                                    setSelectedEvent(null);
                                                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
                                                } catch (e) { console.error(e); alert('Failed to cancel'); }
                                            }
                                        });
                                    }}>Cancel Booking</Button>
                                    <Button type="default" onClick={() => setSelectedEvent(null)}>Close</Button>
                                </div>
                            ) : (
                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <p style={{ color: '#666', fontStyle: 'italic', marginRight: 'auto' }}>This slot is occupied.</p>
                                    <Button type="default" onClick={() => setSelectedEvent(null)}>Close</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
            >
                <div style={{ padding: '20px' }}>
                    <p>{confirmModal.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button type="default" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>No, Keep it</Button>
                        <Button type="default" style={{ borderColor: 'red', color: 'red' }} onClick={confirmModal.onConfirm}>Yes, Cancel it</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BookingViewWrapper;
