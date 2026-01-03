import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import CalendarView from './CalendarView';
import SimpleBookingModal from './SimpleBookingModal';
import { ArrowLeft, Calendar as CalendarIcon, Plus } from 'lucide-react';

const BookingViewWrapper = ({ profile, events, onBack, onBookingSuccess }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null); // { dateStr: string } or null

    const handleCalendarSelect = (info) => {
        setModalData(info);
        setIsModalOpen(true);
    };

    const handleManualBooking = () => {
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
                        Back to Profile
                    </Button>
                    <h2 style={{ marginTop: '8px', marginBottom: '4px' }}>Book a Session</h2>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
                        Select a slot on the calendar or create a manual booking.
                    </p>
                </div>

                <Button type="primary" onClick={handleManualBooking}>
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    Manual Booking
                </Button>
            </div>

            {/* Calendar */}
            <CalendarView
                events={events} // Pass events (busy slots)
                onDateSelect={handleCalendarSelect}
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
        </div>
    );
};

export default BookingViewWrapper;
