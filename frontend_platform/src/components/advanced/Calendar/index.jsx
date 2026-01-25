"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import styles from './style.module.scss';

const Calendar = ({ events, onDateSelect, onEventClick, workingDays, workingHours }) => {
    const { i18n } = useTranslation();

    // Construct businessHours object if constraints are provided
    const businessHours = (workingDays && workingHours) ? {
        daysOfWeek: workingDays, // [1, 2, 3, 4, 5]
        startTime: workingHours.start || '09:00',
        endTime: workingHours.end || '18:00'
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
                locale={i18n.language}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events} // [{ title: 'Booked', start: '...', end: '...' }]
                select={onDateSelect}
                eventClick={onEventClick}
                height="auto"
                slotMinTime={workingHours?.start ? `${workingHours.start}:00` : "09:00:00"}
                slotMaxTime={workingHours?.end ? `${workingHours.end}:00` : "18:00:00"}
                allDaySlot={false}

                // Availability Constraints
                businessHours={businessHours}
                selectConstraint={businessHours ? "businessHours" : undefined}
                selectOverlap={false}

                // Time Formatting (24h)
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    meridiem: false
                }}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
                displayEventTime={false}

                // Event Application Colors (Dark Green BG, White Text) - Defaults if not provided by event
                eventBackgroundColor="#389e0d"
                eventBorderColor="#237804"
                eventTextColor="#ffffff"
            />
        </div>
    );
};

export default Calendar;
