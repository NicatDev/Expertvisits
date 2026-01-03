import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarView = ({ events, onDateSelect, workingHours, workingDays }) => {

    // Transform workingDays to hiddenDays if needed, or businessHours.
    // FullCalendar businessHours: { daysOfWeek: [ 1, 2, 3, 4, 5 ], startTime: '10:00', endTime: '18:00' }

    // workingDays from backend likely: [0, 1, 2...] or similar.
    // If backend uses 0=Mon, 6=Sun (Django often does), FC uses 0=Sun. 
    // I need to be careful. Let's assume standard JS 0=Sun for FC. 
    // And backend might be standard too. 
    // `profile.working_days` in `profile/page.jsx` was [0, 1, 2, 3, 4].
    // If user saved Mon(0), Tue(1)... in previous component `daysOfWeek` map: `{ value: 0, name: 'Monday' }`
    // Wait, let's check profile/page.jsx map:
    // `const daysOfWeek = [{ name: 'Monday', value: 0 }, { name: 'Tuesday', value: 1 } ...]`
    // If `value: 0` is Monday, then FC (where 0 is Sunday) needs conversion.
    // Monday(0) -> FC(1).
    // Tuesday(1) -> FC(2).
    // ...
    // Sunday(6) -> FC(0).
    const mapDayToFC = (d) => {
        // user: 0=Mon ... 6=Sun
        // FC: 1=Mon ... 0=Sun
        if (d === 6) return 0;
        return d + 1;
    };

    const businessHours = {
        daysOfWeek: (workingDays || []).map(mapDayToFC),
        startTime: workingHours?.start || '09:00',
        endTime: workingHours?.end || '18:00',
    };

    // Constraint: "manual booking zamani dolu saatlar tarixlere muraciet etmek olmasin"
    // For Calendar click, we can enforce constraint via `selectConstraint` or just validate in Modal.
    // `selectConstraint`: "businessHours" ensures they can only click inside business hours.

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <style>{`
                .fc-event { cursor: pointer; }
                .fc-toolbar-title { font-size: 1.2rem !important; }
                .fc-button { font-size: 0.8rem !important; }
            `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                }}
                events={events}
                selectable={true}
                selectMirror={true}
                select={(info) => {
                    // info: { start, end, startStr, endStr, allDay, jsEvent, view }
                    if (onDateSelect) onDateSelect(info);
                }}
                // eventClick? If clicking an existing event (which is "Busy"), maybe show "Occupied"?
                // User can't book occupied.
                eventClick={(info) => {
                    // Show tooltip or toast "This slot is busy"
                }}
                businessHours={businessHours}
                selectConstraint="businessHours" // Restrict selection to business hours
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                height="auto"
            />
        </div>
    );
};

export default CalendarView;
