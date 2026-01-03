"use client";
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import styles from './style.module.scss';

const Calendar = ({ events, onDateSelect, onEventClick, workingDays, workingHours }) => {

    // Construct businessHours object if constraints are provided
    const businessHours = (workingDays && workingHours) ? {
        daysOfWeek: workingDays, // [1, 2, 3, 4, 5]
        startTime: workingHours.start || '09:00',
        endTime: workingHours.end || '17:00'
    } : undefined;

    return (
        <div className={styles.calendarWrapper}>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '' // Removed dayGridMonth, timeGridDay
                }}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events} // [{ title: 'Booked', start: '...', end: '...' }]
                select={onDateSelect}
                eventClick={onEventClick}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}

                // Availability Constraints
                businessHours={businessHours}
                selectConstraint={businessHours ? "businessHours" : undefined}
                selectOverlap={false}
            />
        </div>
    );
};

export default Calendar;
