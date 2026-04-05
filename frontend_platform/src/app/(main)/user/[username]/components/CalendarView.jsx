import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const toSlotTime = (t) => {
    if (!t) return null;
    const s = String(t);
    return s.length === 5 ? `${s}:00` : s;
};

const CalendarView = ({
    events,
    onDateSelect,
    onEventClick,
    workingHours,
    workingDays,
    isServiceOpen = true,
}) => {
    const mapDayToFC = (d) => parseInt(d, 10);

    const hasWorkingDays = Array.isArray(workingDays) && workingDays.length > 0;
    const highlightAvailability =
        isServiceOpen && hasWorkingDays && workingHours?.start && workingHours?.end;

    const businessHours = highlightAvailability
        ? {
              daysOfWeek: workingDays.map(mapDayToFC),
              startTime: workingHours.start,
              endTime: workingHours.end,
          }
        : false;

    const slotMin = highlightAvailability
        ? toSlotTime(workingHours.start) || '08:00:00'
        : '00:00:00';
    const slotMax = highlightAvailability
        ? toSlotTime(workingHours.end) || '20:00:00'
        : '24:00:00';

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
                selectable={Boolean(highlightAvailability)}
                selectMirror={Boolean(highlightAvailability)}
                select={(info) => {
                    if (onDateSelect) onDateSelect(info);
                }}
                eventClick={onEventClick}
                businessHours={businessHours}
                selectConstraint={businessHours ? 'businessHours' : undefined}
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    hourCycle: 'h23',
                    meridiem: false,
                }}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    hourCycle: 'h23',
                }}
                displayEventTime={false}
                height="auto"
                slotMinTime={slotMin}
                slotMaxTime={slotMax}
            />
        </div>
    );
};

export default CalendarView;
