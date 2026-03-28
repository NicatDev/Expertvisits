"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Calendar from '@/components/advanced/Calendar';
import BlockingModal from './components/BlockingModal';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Link from 'next/link';
import { User } from 'lucide-react';
import styles from '../profile.module.scss';
import { services, profiles } from '@/lib/api';
import { toast } from 'react-toastify';
import { useProfile } from '../context';

export default function BookingPage() {
    const { t } = useTranslation('common');
    const { profile, refreshProfile, isOwner } = useProfile();

    const [activeSubTab, setActiveSubTab] = useState('calendar'); // availability, calendar, requests
    const [bookingRequests, setBookingRequests] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [requestHistory, setRequestHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Modals
    const [paramModal, setParamModal] = useState({ isOpen: false, data: null });
    const [showBlockingModal, setShowBlockingModal] = useState(false);
    const [blockingDate, setBlockingDate] = useState(null);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Local Availability State
    const [localAvailability, setLocalAvailability] = useState({
        is_service_open: false,
        work_hours_start: '',
        work_hours_end: '',
        working_days: []
    });
    const [savedAvailability, setSavedAvailability] = useState(null);

    // Single unified useEffect - the duplicate below handles all tabs

    useEffect(() => {
        if (profile) {
            const initialData = {
                is_service_open: profile.is_service_open,
                work_hours_start: profile.work_hours_start,
                work_hours_end: profile.work_hours_end,
                working_days: profile.working_days || []
            };
            setLocalAvailability(initialData);
            setSavedAvailability(initialData);
        }
    }, [profile]);

    const loadBookingsData = async () => {
        try {
            const [reqs, evts] = await Promise.all([
                services.getBookings({ role: 'provider', status: 'pending' }),
                services.getEvents()
            ]);
            setBookingRequests(reqs.data.results || reqs.data);
            setCalendarEvents(evts.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [myMeetings, setMyMeetings] = useState([]);

    useEffect(() => {
        loadBookingsData();
        if (activeSubTab === 'requests') {
            loadRequestHistory(1, true);
        } else if (activeSubTab === 'meetings') {
            loadMyMeetings();
        }
    }, [activeSubTab]);

    const loadMyMeetings = async () => {
        try {
            const date24hAgo = new Date();
            date24hAgo.setHours(date24hAgo.getHours() - 24);

            const res = await services.getBookings({
                role: 'any',
                status: 'confirmed',
                min_date: date24hAgo.toISOString(),
                limit: 50
            });
            const allMeetings = res.data.results || res.data;
            // Filter out 'Blocked' slots (where provider == customer)
            const validMeetings = allMeetings.filter(b => {
                const getVal = (v) => (typeof v === 'object' && v !== null) ? v.id : v;
                const pId = getVal(b.provider_details || b.provider);
                const cId = getVal(b.customer_details || b.customer);
                return String(pId) !== String(cId);
            });
            setMyMeetings(validMeetings);
        } catch (err) {
            console.error(err);
        }
    };

    const loadRequestHistory = async (page = 1, reset = false) => {
        if (reset) {
            setRequestHistory([]);
            setHistoryPage(1);
            setHasMoreHistory(true);
        }
        setHistoryLoading(true);
        try {
            const res = await services.getBookings({
                role: 'provider',
                status: 'confirmed,cancelled,rejected,missed',
                exclude_self: true,
                page: page,
                limit: 10
            });
            const newItems = res.data.results || res.data;
            if (reset) setRequestHistory(newItems);
            else setRequestHistory(prev => [...prev, ...newItems]);

            if (res.data.next) setHasMoreHistory(true);
            else setHasMoreHistory(false);
            setHistoryPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAvailabilitySave = async () => {
        const data = {
            work_hours_start: localAvailability.work_hours_start,
            work_hours_end: localAvailability.work_hours_end,
            working_days: localAvailability.working_days,
            is_service_open: localAvailability.is_service_open
        };
        try {
            await profiles.updateProfile(profile.username, data);
            toast.success(t('profile.toasts.availability_saved'));
            setSavedAvailability(data);
            refreshProfile();
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.failed_update'));
        }
    };

    const toggleDay = (dayValue) => {
        const currentDays = localAvailability.working_days || [];
        const currentDaysInt = currentDays.map(d => parseInt(d));
        let newDays;
        if (currentDaysInt.includes(dayValue)) newDays = currentDaysInt.filter(d => d !== dayValue);
        else newDays = [...currentDaysInt, dayValue];
        setLocalAvailability(prev => ({ ...prev, working_days: newDays }));
    };

    const daysOfWeek = [
        { name: "Monday", value: 1 }, { name: "Tuesday", value: 2 }, { name: "Wednesday", value: 3 },
        { name: "Thursday", value: 4 }, { name: "Friday", value: 5 }, { name: "Saturday", value: 6 }, { name: "Sunday", value: 0 }
    ];

    const hasChanges = () => {
        if (!savedAvailability) return false;
        const currentDays = (localAvailability.working_days || []).map(d => +d).sort().join(',');
        const savedDays = (savedAvailability.working_days || []).map(d => +d).sort().join(',');
        return (
            Boolean(localAvailability.is_service_open) !== Boolean(savedAvailability.is_service_open) ||
            (localAvailability.work_hours_start || '') !== (savedAvailability.work_hours_start || '') ||
            (localAvailability.work_hours_end || '') !== (savedAvailability.work_hours_end || '') ||
            currentDays !== savedDays
        );
    };

    if (!profile) return null;

    return (
        <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                {['availability', 'calendar', 'requests', 'meetings'].map(st => (
                    <button
                        key={st}
                        onClick={() => setActiveSubTab(st)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: activeSubTab === st ? 600 : 400,
                            color: activeSubTab === st ? '#1890ff' : '#666',
                            borderBottom: activeSubTab === st ? '2px solid #1890ff' : 'none'
                        }}
                    >
                        {t(`profile.booking.${st}`)}
                    </button>
                ))}
            </div>

            {activeSubTab === 'availability' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>{t('profile.booking.settings_title')}</h2>
                        <Button
                            size="small"
                            onClick={handleAvailabilitySave}
                            disabled={!hasChanges()}
                            style={{ opacity: hasChanges() ? 1 : 0.7, cursor: hasChanges() ? 'pointer' : 'not-allowed' }}
                        >
                            {t('profile.booking.save_changes')}
                        </Button>
                    </div>
                    <div className={styles.list}>
                        <div className={styles.editableField}>
                            <span className={styles.label}>{t('profile.booking.accept_bookings')}</span>
                            <div className={styles.value}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={localAvailability.is_service_open || false}
                                        onChange={e => setLocalAvailability(prev => ({ ...prev, is_service_open: e.target.checked }))}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                        {localAvailability.is_service_open && (
                            <>
                                <div className={styles.editableField}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <span className={styles.label}>{t('profile.booking.working_hours')}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ whiteSpace: 'nowrap' }}>{t('profile.booking.start')}</span>
                                                <Input
                                                    type="time"
                                                    value={localAvailability.work_hours_start || ''}
                                                    onChange={e => setLocalAvailability(prev => ({ ...prev, work_hours_start: e.target.value }))}
                                                    style={{ width: '120px' }}
                                                    wrapperStyle={{ marginBottom: 0 }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ whiteSpace: 'nowrap' }}>{t('profile.booking.end')}</span>
                                                <Input
                                                    type="time"
                                                    value={localAvailability.work_hours_end || ''}
                                                    onChange={e => setLocalAvailability(prev => ({ ...prev, work_hours_end: e.target.value }))}
                                                    style={{ width: '120px' }}
                                                    wrapperStyle={{ marginBottom: 0 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '10px' }}>
                                    <span className={styles.label} style={{ display: 'block', marginBottom: '8px' }}>{t('profile.booking.working_days')}</span>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {daysOfWeek.map(dayObj => (
                                            <button
                                                key={dayObj.value}
                                                onClick={() => toggleDay(dayObj.value)}
                                                style={{
                                                    padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd',
                                                    background: (localAvailability.working_days || []).includes(dayObj.value) ? '#1890ff' : '#fff',
                                                    color: (localAvailability.working_days || []).includes(dayObj.value) ? '#fff' : '#333',
                                                    cursor: 'pointer', fontSize: '14px'
                                                }}
                                            >
                                                {t(`profile.days.${dayObj.name}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'calendar' && (
                <div className={styles.list}>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ width: 12, height: 12, background: '#fa8c16', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{t('profile.booking.legend.pending')}</span>
                        <div style={{ width: 12, height: 12, background: '#595959', marginLeft: '16px', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{t('profile.booking.legend.blocked')}</span>
                        <div style={{ width: 12, height: 12, background: '#52c41a', marginLeft: '16px', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{t('profile.booking.legend.confirmed')}</span>
                    </div>
                    <Calendar
                        events={calendarEvents}
                        workingDays={profile.working_days}
                        workingHours={{ start: profile.work_hours_start, end: profile.work_hours_end }}
                        onDateSelect={(info) => {
                            setBlockingDate({ start: new Date(info.startStr), end: new Date(info.endStr) });
                            setShowBlockingModal(true);
                        }}
                        onEventClick={(info) => {
                            setParamModal({
                                isOpen: true,
                                data: {
                                    id: info.event.id,
                                    title: info.event.title,
                                    start: info.event.start,
                                    end: info.event.end,
                                    status: info.event.extendedProps.status,
                                    note: info.event.extendedProps.note,
                                    meet_link: info.event.extendedProps.meet_link,
                                    location: info.event.extendedProps.location,
                                    is_incoming: info.event.extendedProps.is_incoming,
                                    customer: info.event.extendedProps.customer
                                }
                            });
                        }}
                    />
                </div>
            )}

            {activeSubTab === 'requests' && (
                <div>
                    <div className={styles.sectionHeader}>
                        <h2>{t('profile.booking.incoming_title')}</h2>
                    </div>
                    <div className={styles.list} style={{ flexDirection: 'column', gap: '12px' }}>
                        {bookingRequests.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic' }}>{t('profile.booking.no_pending')}</p> : (
                            bookingRequests.map(req => (
                                <div key={req.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Link href={`/user/${req.customer_details?.username}`}>
                                                {req.customer_details?.avatar ? (
                                                    <img src={req.customer_details.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                                                ) : (
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><User size={20} /></div>
                                                )}
                                            </Link>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{req.customer_details?.first_name} {req.customer_details?.last_name}</h4>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>@{req.customer_details?.username}</span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: '#fa8c16', fontWeight: 500 }}>{t('profile.booking.legend.pending')}</span>
                                    </div>
                                    <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', width: '100%' }}>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', marginBottom: '4px' }}>
                                            <span>📅 {new Date(req.requested_datetime).toLocaleDateString()}</span>
                                            <span>⏰ {new Date(req.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>⏳ {req.duration_minutes} min</span>
                                        </div>
                                        {req.note && <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.9rem' }}>"{req.note}"</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                                        <Button size="small" type="default" style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }} onClick={() => {
                                            setConfirmationModal({
                                                isOpen: true,
                                                title: t('profile.modals.reject_title'),
                                                message: t('profile.modals.reject_message'),
                                                onConfirm: async () => {
                                                    await services.rejectBooking(req.id);
                                                    loadBookingsData();
                                                    toast.success(t('profile.toasts.rejected'));
                                                }
                                            });
                                        }}>{t('profile.booking.reject_btn')}</Button>
                                        <Button size="small" type="primary" onClick={async () => {
                                            try {
                                                await services.acceptBooking(req.id);
                                                loadBookingsData();
                                                toast.success(t('profile.toasts.accepted'));
                                            } catch (e) { toast.error("Failed"); }
                                        }}>{t('profile.booking.accept_btn')}</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'meetings' && (
                <div>
                    <div className={styles.sectionHeader}>
                        <h2>{t('profile.booking.meetings')}</h2>
                    </div>
                    <div className={styles.list} style={{ flexDirection: 'column', gap: '12px' }}>
                        {myMeetings.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic' }}>{t('profile.booking.no_meetings', { defaultValue: 'No upcoming meetings.' })}</p> : (
                            myMeetings.map(booking => {
                                const isIncoming = booking.customer_details?.id !== profile.id;
                                const otherParty = isIncoming ? booking.customer_details : booking.provider_details;

                                return (
                                    <div key={booking.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Other Party Info */}
                                                <Link href={`/user/${otherParty?.username}`}>
                                                    {otherParty?.avatar ? (
                                                        <img src={otherParty.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><User size={20} /></div>
                                                    )}
                                                </Link>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>
                                                        {isIncoming
                                                            ? `${t('profile.booking.from', { defaultValue: 'From' })}: ${otherParty?.first_name} ${otherParty?.last_name}`
                                                            : `${t('profile.booking.to', { defaultValue: 'To' })}: ${otherParty?.first_name} ${otherParty?.last_name}`
                                                        }
                                                    </h4>
                                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                                        {isIncoming
                                                            ? `${t('profile.booking.to', { defaultValue: 'To' })}: ${profile.first_name}`
                                                            : `${t('profile.booking.from', { defaultValue: 'From' })}: ${profile.first_name}`
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: '#52c41a', fontWeight: 500 }}>{t('profile.booking.legend.confirmed')}</span>
                                        </div>
                                        <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', width: '100%' }}>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', marginBottom: '4px' }}>
                                                <span>📅 {new Date(booking.requested_datetime).toLocaleDateString()}</span>
                                                <span>⏰ {new Date(booking.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>⏳ {booking.duration_minutes} min</span>
                                            </div>
                                            {booking.note && <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.9rem' }}>"{booking.note}"</p>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <BlockingModal
                isOpen={showBlockingModal}
                onClose={() => setShowBlockingModal(false)}
                selectedEvent={blockingDate}
                providerId={profile?.id}
                onSuccess={() => { loadBookingsData(); setShowBlockingModal(false); }}
                workingDays={profile?.working_days}
                workingHours={{ start: profile?.work_hours_start, end: profile?.work_hours_end }}
                events={calendarEvents}
            />

            <Modal
                isOpen={paramModal.isOpen}
                onClose={() => setParamModal({ isOpen: false, data: null })}
                title={t('profile.booking.values_title')}
            >
                {paramModal.data && (
                    <div className={styles.content}>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0 }}>{paramModal.data.title}</h3>
                            <p><strong>{t('profile.booking.status')}</strong> <span style={{ textTransform: 'capitalize' }}>{paramModal.data.status}</span></p>
                            <p><strong>{t('profile.booking.time')}</strong> {paramModal.data.start.toLocaleString()} - {paramModal.data.end.toLocaleTimeString()}</p>
                            {paramModal.data.note && <p><strong>{t('profile.booking.note')}</strong> {paramModal.data.note}</p>}
                            {paramModal.data.meet_link && (
                                <p><strong>{t('booking_modal.meet_link')}</strong>{' '}
                                    <a href={paramModal.data.meet_link} target="_blank" rel="noreferrer" style={{ color: '#1890ff' }}>{paramModal.data.meet_link}</a>
                                </p>
                            )}
                            {paramModal.data.location && (
                                <p><strong>{t('booking_modal.location')}</strong> {paramModal.data.location}</p>
                            )}

                            <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <Button type="default" onClick={() => setParamModal({ isOpen: false, data: null })}>{t('profile.booking.close_btn')}</Button>

                                {paramModal.data.status === 'pending' && paramModal.data.is_incoming && (
                                    <>
                                        <Button type="default" style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }} onClick={() => {
                                            setParamModal({ isOpen: false, data: null });
                                            setConfirmationModal({
                                                isOpen: true,
                                                title: t('profile.modals.reject_title'),
                                                message: t('profile.modals.reject_message'),
                                                onConfirm: async () => {
                                                    await services.rejectBooking(paramModal.data.id);
                                                    loadBookingsData();
                                                    toast.success(t('profile.toasts.rejected'));
                                                }
                                            });
                                        }}>
                                            {t('profile.booking.reject_btn')}
                                        </Button>
                                        <Button type="primary" onClick={async () => {
                                            try {
                                                await services.acceptBooking(paramModal.data.id);
                                                setParamModal({ isOpen: false, data: null });
                                                loadBookingsData();
                                                toast.success(t('profile.toasts.accepted'));
                                            } catch (e) {
                                                console.error(e);
                                                toast.error(t('profile.toasts.failed_update'));
                                            }
                                        }}>
                                            {t('profile.booking.accept_btn')}
                                        </Button>
                                    </>
                                )}

                                {(paramModal.data.status === 'confirmed' || paramModal.data.title === 'Blocked') && (
                                    <Button type="default" style={{ borderColor: 'red', color: 'red' }} onClick={() => {
                                        setParamModal({ isOpen: false, data: null });
                                        setConfirmationModal({
                                            isOpen: true,
                                            title: paramModal.data.title === 'Blocked' ? t('profile.booking.unblock_slot') : t('profile.booking.cancel_meeting'),
                                            message: paramModal.data.title === 'Blocked' ? t('profile.booking.confirm_unblock') : t('profile.booking.confirm_cancel'),
                                            onConfirm: async () => {
                                                await services.updateBookingStatus(paramModal.data.id, 'rejected');
                                                loadBookingsData();
                                                toast.success(t('profile.toasts.deleted'));
                                            }
                                        })
                                    }}>
                                        {paramModal.data.title === 'Blocked' ? t('profile.booking.unblock_btn') : t('profile.booking.cancel_btn')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
            />
        </div>
    );
}
