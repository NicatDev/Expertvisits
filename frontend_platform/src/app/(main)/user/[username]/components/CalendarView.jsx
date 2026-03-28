import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarView = ({ events, onDateSelect, workingHours, workingDays }) => {

    // Helper to ensure integers for days (FC uses 0=Sun, 1=Mon)
    // Assuming backend stores 0=Sun..6=Sat or similar standard. 
    // If backend uses 1=Mon..7=Sun, we'd need conversion.
    // Based on profile page: 0=Sunday. So 1:1 mapping.
    const mapDayToFC = (d) => parseInt(d);

    const businessHours = {
        daysOfWeek: (workingDays || []).map(mapDayToFC),
        startTime: workingHours?.start || '09:00',
        endTime: workingHours?.end || '18:00',
    };

    // Determine Min/Max Time for display
    // Add 1 hour buffer or strict? User said "yalniz is saatlari araligini gostersin" (only work hours range).
    // So strictly start to end.
    const slotMin = workingHours?.start || '08:00:00';
    const slotMax = workingHours?.end || '20:00:00';

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <style>{`
                .fc-event { cursor: pointer; }
                .fc-toolbar-title { font-size: 1rem !important; margin: 0 !important; }
                .fc-button { font-size: 0.75rem !important; padding: 4px 8px !important; }
                
                @media (max-width: 600px) {
                    .fc-toolbar {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                    }
                    .fc-toolbar-chunk {
                        display: flex;
                        justify-content: center;
                        gap: 4px;
                        width: 100%;
                    }
                }
            `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                }}
                events={events} // Backend provided colors now
                selectable={true}
                selectMirror={true}
                select={(info) => {
                    if (onDateSelect) onDateSelect(info);
                }}
                businessHours={businessHours}
                selectConstraint="businessHours"
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                displayEventTime={false}
                height="auto"
                slotMinTime={slotMin}
                slotMaxTime={slotMax}
            />
        </div>
    );
};

export default CalendarView;
