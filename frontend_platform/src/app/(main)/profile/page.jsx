"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import FollowListModal from '@/components/advanced/FollowListModal';

import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './profile.module.scss';
import FeedItem from '@/components/advanced/FeedItem';
import VacancyCard from '@/components/advanced/VacancyCard';
import Calendar from '@/components/advanced/Calendar';
import BookingModal from '@/components/advanced/BookingModal';
import { auth, profiles, content, accounts, services, business } from '@/lib/api';
import { Edit2, Trash2, Plus, Camera, Check, X, User, LinkIcon } from 'lucide-react';
import {
    ExperienceModal, EducationModal, SkillModal, LanguageModal, CertificateModal, PasswordModal
} from '@/components/advanced/ProfileModals';
import CreateContentModal from '@/components/advanced/CreateContentModal';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';

export default function PrivateProfilePage() {
    const { user: currentUser, refreshUser } = useAuth();
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [loading, setLoading] = useState(true);

    // Profile Data Sections
    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);
    const [skills, setSkills] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [articles, setArticles] = useState([]);
    const [posts, setPosts] = useState([]);
    const [filterType, setFilterType] = useState('all'); // all, article, quiz, survey

    // Vacancies
    const [myVacancies, setMyVacancies] = useState([]);
    const [myApplications, setMyApplications] = useState([]);

    // Editing State (Inline About)
    const [editMode, setEditMode] = useState({}); // { fieldName: boolean }
    const [aboutData, setAboutData] = useState({}); // Temp data for editing

    // Modals State
    const [modalState, setModalState] = useState({ type: null, data: null }); // type: 'experience', etc.

    // Booking State
    const [bookingRequests, setBookingRequests] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    // Booking Modal for blocking
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    // Follower count (ReadOnly for owner)
    const [followersCount, setFollowersCount] = useState(0);

    const isOwner = true; // Always true for /profile

    useEffect(() => {
        loadProfile();
        // Load bookings if tab is calendar
        if (activeTab === 'calendar') {
            loadBookingsData();
        }
    }, [currentUser, activeTab]);

    const loadBookingsData = async () => {
        try {
            const [reqs, evts] = await Promise.all([
                services.getBookings('provider'), // status='pending' is default? No, backend filters by role only currently.
                services.getEvents()
            ]);
            // Filter pending locally if backend doesn't support status filter yet for getBookings 
            // Update: I added status filter support in services.js but backend get_queryset filters by role. 
            // Backend get_queryset doesn't explicitly filter status, returns all for role.
            // So we filter locally.
            const allBookings = reqs.data.results || reqs.data;
            setBookingRequests(allBookings.filter(b => b.status === 'pending'));

            setCalendarEvents(evts.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptBooking = async (id) => {
        try {
            await services.acceptBooking(id);
            toast.success("Booking Accepted");
            loadBookingsData(); // Refresh list and calendar
        } catch (err) {
            toast.error("Failed to accept");
        }
    };

    const handleRejectBooking = async (id) => {
        if (!confirm("Reject this booking?")) return;
        try {
            await services.rejectBooking(id);
            toast.success("Booking Rejected");
            loadBookingsData();
        } catch (err) {
            toast.error("Failed to reject");
        }
    };

    const loadProfile = async () => {
        // Wait for auth to resolve
        if (!currentUser && loading) {
            // If auth is strictly required, wrapper handles it, but let's safe check
            // Actually, useAuth usually has a loading state, but for this component, if no user, we can't show much.
            // We can fetch profile from API if token exists.
        }

        try {
            // Fetch own profile
            const res = await auth.getProfile();
            const targetUser = res.data;

            if (!targetUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            setProfile(targetUser);
            setFollowersCount(targetUser.followers_count || 0);

            setAboutData({
                first_name: targetUser.first_name,
                last_name: targetUser.last_name,
                username: targetUser.username,
                phone_number: targetUser.phone_number,
                birth_day: targetUser.birth_day
            });

            // 2. Fetch Related Data (By User ID)
            const userId = targetUser.id;
            const fetchConfig = { user_id: userId };

            const [exp, edu, ski, lan, cert, arts, quizzes, surveys, vacs, apps] = await Promise.all([
                profiles.getExperience(fetchConfig),
                profiles.getEducation(fetchConfig),
                profiles.getSkills(fetchConfig),
                profiles.getLanguages(fetchConfig),
                profiles.getCertificates(fetchConfig),
                content.getUserArticles(userId),
                content.getUserQuizzes(userId),
                content.getUserSurveys(userId),
                business.getMyVacancies(),
                business.getMyApplications()
            ]);

            setExperiences(exp.data.results || exp.data || []);
            setEducations(edu.data.results || edu.data || []);
            setSkills(ski.data.results || ski.data || []);
            setLanguages(lan.data.results || lan.data || []);
            setCertificates(cert.data.results || cert.data || []);
            setMyVacancies(vacs.data.results || vacs.data || []);
            setMyApplications(apps.data.results || apps.data || []);

            // Normalize and Combine
            const _articles = (arts.data.results || arts.data || []).map(a => ({ ...a, type: 'article' }));
            const _quizzes = (quizzes.data.results || quizzes.data || []).map(q => ({ ...q, type: 'quiz' }));
            const _surveys = (surveys.data.results || surveys.data || []).map(s => ({ ...s, type: 'survey' }));

            const combined = [..._articles, ..._quizzes, ..._surveys].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setPosts(combined);
            setSkills(ski.data.results || ski.data || []);
            setLanguages(lan.data.results || lan.data || []);
            setCertificates(cert.data.results || cert.data || []);
            setArticles(arts.data.results || arts.data || []);

        } catch (err) {
            console.error("Load profile failed", err);
        } finally {
            setLoading(false);
        }
    };

    // --- File Uploads ---
    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append(type === 'avatar' ? 'avatar' : 'cover_image', file);

        try {
            await profiles.updateProfile(profile.username, formData);
            loadProfile();
            refreshUser();
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    // --- Inline Editing ---
    const toggleEdit = (field) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
        if (!editMode[field]) {
            setAboutData(prev => ({ ...prev, [field]: profile[field] }));
        }
    };

    const saveInline = async (field) => {
        try {
            await profiles.updateProfile(profile.username, { [field]: aboutData[field] });
            setProfile(prev => ({ ...prev, [field]: aboutData[field] }));
            toggleEdit(field);
            refreshUser();
        } catch (err) {
            alert('Failed to update. Username might be taken.');
        }
    };

    // --- Modals Handlers ---
    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const handleSaveItem = async (formData) => {
        const { type, data } = modalState;
        const isEdit = !!data;
        const apiFunc = profiles[isEdit ? `update${capitalize(type)}` : `add${capitalize(type)}`];

        try {
            if (type === 'password') {
                await profiles.changePassword(formData);
                alert('Password changed successfully');
            } else {
                if (isEdit) await apiFunc(data.id, formData);
                else await apiFunc(formData); // Add
                loadProfile(); // Refresh
            }
        } catch (err) {
            console.error(err);
            alert('Operation failed');
            throw err;
        }
    };

    const handleDeleteItem = async (type, id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await profiles[`delete${capitalize(type)}`](id);
            loadProfile();
        } catch (err) {
            console.error(err);
        }
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Calendar Handler
    const handleDateSelect = (info) => {
        setSelectedDate(info);
        setShowBookingModal(true);
    };

    // FullCalendar: 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysOfWeek = [
        { name: "Monday", value: 1 },
        { name: "Tuesday", value: 2 },
        { name: "Wednesday", value: 3 },
        { name: "Thursday", value: 4 },
        { name: "Friday", value: 5 },
        { name: "Saturday", value: 6 },
        { name: "Sunday", value: 0 }
    ];

    const handleAvailabilitySave = async () => {
        const data = {
            work_hours_start: profile.work_hours_start,
            work_hours_end: profile.work_hours_end,
            working_days: profile.working_days, // Now sends array of ints [1, 2, ...]
            is_service_open: profile.is_service_open
        };
        try {
            await profiles.updateProfile(profile.username, data);
            toast.success("Availability settings saved successfully!");
            refreshUser();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update availability.");
        }
    };

    const toggleDay = (dayValue) => {
        const currentDays = profile.working_days || [];
        // Ensure we are working with ints if backend served strings or something else
        const currentDaysInt = currentDays.map(d => parseInt(d));

        let newDays;
        if (currentDaysInt.includes(dayValue)) {
            newDays = currentDaysInt.filter(d => d !== dayValue);
        } else {
            newDays = [...currentDaysInt, dayValue];
        }
        setProfile(prev => ({ ...prev, working_days: newDays }));
    };

    // Follow Modal State
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers');

    const handleOpenFollow = (type) => {
        setFollowModalType(type);
        setShowFollowModal(true);
    };

    if (loading) return <div>Loading...</div>;
    if (!profile) return <div>User not found. Please log in.</div>;

    return (
        <div className={styles.container}>
            {/* Header / Cover */}
            <div className={styles.header}>
                <div className={styles.coverContainer}>
                    {profile.cover_image ? (
                        <img src={profile.cover_image} className={styles.coverImage} alt="Cover" />
                    ) : (
                        <div className={styles.defaultCover} />
                    )}
                    <div className={styles.editOverlay} onClick={() => coverInputRef.current.click()}>
                        <Edit2 size={16} /> Edit Cover
                        <input type="file" hidden ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} />
                    </div>
                </div>

                <div className={styles.info}>
                    <div className={styles.avatarContainer}>
                        {profile.avatar ? (
                            <img src={profile.avatar} className={styles.avatar} alt="Avatar" />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                <User size={40} />
                            </div>
                        )}
                        <div className={styles.avatarOverlay} onClick={() => fileInputRef.current.click()}>
                            <Edit2 size={24} />
                        </div>
                        <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                    </div>

                    <div className={styles.names}>
                        <h1>{profile.first_name} {profile.last_name}</h1>
                        <p className={styles.subtitle}>@{profile.username} • {profile.profession_sub_category?.name || 'Professional'}</p>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            <span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => handleOpenFollow('followers')}
                            >
                                <strong>{followersCount}</strong> followers
                            </span>
                            <span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => handleOpenFollow('following')}
                            >
                                <strong>{profile.following_count || 0}</strong> following
                            </span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button onClick={() => openModal('password')} type="default">Change Password</Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>About</button>
                <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>Paylaşımlar</button>
                <button className={activeTab === 'services' ? styles.activeTab : ''} onClick={() => setActiveTab('services')}>Availability</button>
                <button className={activeTab === 'calendar' ? styles.activeTab : ''} onClick={() => setActiveTab('calendar')}>Calendar</button>
                <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>My Vacancies</button>
                <button className={activeTab === 'applications' ? styles.activeTab : ''} onClick={() => setActiveTab('applications')}>My Applications</button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'about' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        {/* Personal Info Section - Editable */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Personal Information</h2>
                            </div>
                            <div className={styles.list}>
                                {['first_name', 'last_name', 'username', 'phone_number', 'birth_day'].map(field => (
                                    <div key={field} className={styles.editableField}>
                                        <span className={styles.label}>{field.replace('_', ' ').toUpperCase()}</span>
                                        <div className={styles.value}>
                                            {editMode[field] ? (
                                                <div className={styles.inlineForm}>
                                                    <Input
                                                        type={field === 'birth_day' ? 'date' : 'text'}
                                                        value={aboutData[field] || ''}
                                                        onChange={e => setAboutData({ ...aboutData, [field]: e.target.value })}
                                                        wrapperStyle={{ marginBottom: 0 }}
                                                    />
                                                    <button onClick={() => saveInline(field)} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                                    <button onClick={() => toggleEdit(field)} className={styles.iconBtn}><X size={18} color="red" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>{profile[field] || 'Not set'}</span>
                                                    <Edit2 className={styles.editIcon} size={14} onClick={() => toggleEdit(field)} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Email always read-only */}
                                <div className={styles.editableField}>
                                    <span className={styles.label}>EMAIL</span>
                                    <div className={styles.value}>
                                        <span style={{ color: '#999' }}>{profile.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        <Section
                            title="Experience"
                            items={experiences}
                            isOwner={true}
                            onAdd={() => openModal('experience')}
                            onEdit={(item) => openModal('experience', item)}
                            onDelete={(id) => handleDeleteItem('experience', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.position}</h3>
                                    <p>{item.company_name}</p>
                                    <span>{item.start_date} - {item.end_date || 'Present'}</span>
                                </div>
                            )}
                        />

                        <Section
                            title="Education"
                            items={educations}
                            isOwner={true}
                            onAdd={() => openModal('education')}
                            onEdit={(item) => openModal('education', item)}
                            onDelete={(id) => handleDeleteItem('education', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.institution}</h3>
                                    <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                                    <span>{item.start_date} - {item.end_date || 'Present'}</span>
                                </div>
                            )}
                        />

                        <Section
                            title="Skills"
                            items={skills}
                            isOwner={true}
                            onAdd={() => openModal('skill')}
                            onEdit={(item) => openModal('skill', item)}
                            onDelete={(id) => handleDeleteItem('skill', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.name}</h3>
                                    <span>{item.skill_type}</span>
                                </div>
                            )}
                        />

                        <Section
                            title="Languages"
                            items={languages}
                            isOwner={true}
                            onAdd={() => openModal('language')}
                            onEdit={(item) => openModal('language', item)}
                            onDelete={(id) => handleDeleteItem('language', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.name}</h3>
                                    <span>Level: {item.level.toUpperCase()}</span>
                                </div>
                            )}
                        />

                        <Section
                            title="Certificates"
                            items={certificates}
                            isOwner={true}
                            onAdd={() => openModal('certificate')}
                            onEdit={(item) => openModal('certificate', item)}
                            onDelete={(id) => handleDeleteItem('certificate', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.name}</h3>
                                    <p>{item.issuing_organization}</p>
                                    <span>{item.issue_date}</span>
                                </div>
                            )}
                        />

                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className={styles.tabContent}>
                        <div className={styles.sectionHeader}>
                            <h3>Paylaşımlar</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['all', 'article', 'quiz', 'survey'].map(ft => (
                                    <Button
                                        key={ft}
                                        size="small"
                                        style={{ background: filterType === ft ? '#1890ff' : '#f0f0f0', color: filterType === ft ? '#fff' : '#333', border: 'none' }}
                                        onClick={() => setFilterType(ft)}
                                    >
                                        {ft.charAt(0).toUpperCase() + ft.slice(1)}s
                                    </Button>
                                ))}
                            </div>
                            <Button onClick={() => openModal('content')}>+ Add Content</Button>
                        </div>
                        <div className={styles.list} style={{ flexDirection: 'column', gap: '16px' }}>
                            {posts
                                .filter(p => filterType === 'all' || p.type === filterType)
                                .map(item => (
                                    <FeedItem
                                        key={`${item.type}-${item.id}`}
                                        item={item}
                                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                                    />
                                ))
                            }
                            {posts.length === 0 && <p>No content shared yet.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Availability Settings</h2>
                            <Button size="small" onClick={handleAvailabilitySave}>Save Changes</Button>
                        </div>

                        <div className={styles.list}>
                            <div className={styles.editableField}>
                                <span className={styles.label}>Accept Bookings</span>
                                <div className={styles.value}>
                                    <input
                                        type="checkbox"
                                        checked={profile.is_service_open || false}
                                        onChange={e => setProfile(prev => ({ ...prev, is_service_open: e.target.checked }))}
                                        style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            <div className={styles.editableField}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <span className={styles.label}>Working Hours</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '40px' }}>Start:</span>
                                        <Input
                                            type="time"
                                            value={profile.work_hours_start || ''}
                                            onChange={e => setProfile(prev => ({ ...prev, work_hours_start: e.target.value }))}
                                            style={{ width: '120px' }}
                                        />
                                        <span style={{ width: '40px' }}>End:</span>
                                        <Input
                                            type="time"
                                            value={profile.work_hours_end || ''}
                                            onChange={e => setProfile(prev => ({ ...prev, work_hours_end: e.target.value }))}
                                            style={{ width: '120px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ paddingTop: '10px' }}>
                                <span className={styles.label} style={{ display: 'block', marginBottom: '8px' }}>Working Days</span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {daysOfWeek.map(dayObj => (
                                        <button
                                            key={dayObj.value}
                                            onClick={() => toggleDay(dayObj.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '20px',
                                                border: '1px solid #ddd',
                                                background: (profile.working_days || []).includes(dayObj.value) ? '#1890ff' : '#fff',
                                                color: (profile.working_days || []).includes(dayObj.value) ? '#fff' : '#333',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {dayObj.name.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Incoming Requests */}
                        <div className={styles.sectionHeader}>
                            <h2>Incoming Requests</h2>
                        </div>
                        <div className={styles.list}>
                            {bookingRequests.length === 0 ? <p style={{ color: '#999' }}>No pending requests.</p> : (
                                bookingRequests.map(req => (
                                    <div key={req.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            {req.customer_details?.avatar ? (
                                                <img src={req.customer_details.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>}
                                            <div>
                                                <h4 style={{ margin: 0 }}>{req.customer_details?.first_name} {req.customer_details?.last_name}</h4>
                                                <span style={{ fontSize: '13px', color: '#666' }}>
                                                    {new Date(req.requested_datetime).toLocaleDateString()} @ {new Date(req.requested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({req.duration_minutes} min)
                                                </span>
                                                {req.note && <p style={{ margin: '4px 0 0', fontSize: '13px', fontStyle: 'italic', color: '#444' }}>"{req.note}"</p>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Button size="small" onClick={() => handleAcceptBooking(req.id)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}><Check size={16} /> Accept</Button>
                                            <Button size="small" type="default" onClick={() => handleRejectBooking(req.id)} style={{ color: 'red', borderColor: 'red' }}><X size={16} /> Reject</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0' }} />

                        {/* Calendar View */}
                        <div className={styles.sectionHeader}>
                            <h2>My Calendar</h2>
                        </div>
                        <Calendar
                            events={calendarEvents}
                            onDateSelect={handleDateSelect}
                            workingDays={profile.working_days}
                            workingHours={{
                                start: profile.work_hours_start,
                                end: profile.work_hours_end
                            }}
                        />
                    </div>
                )}

                {activeTab === 'vacancies' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>My Vacancies</h2>
                            <Button size="small" onClick={() => openModal('vacancy')}><Plus size={16} /> Post New</Button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {myVacancies.map(v => (
                                <VacancyCard
                                    key={v.id}
                                    vacancy={v}
                                    isOwner={true}
                                    onEdit={() => openModal('vacancy', v)}
                                    onDelete={async () => {
                                        if (!confirm("Delete this vacancy?")) return;
                                        await business.deleteVacancy(v.id);
                                        setMyVacancies(prev => prev.filter(item => item.id !== v.id));
                                        toast.success("Vacancy deleted");
                                    }}
                                />
                            ))}
                            {myVacancies.length === 0 && <p>No vacancies posted.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>My Applications</h2>
                        </div>
                        <div className={styles.list}>
                            {myApplications.length === 0 ? <p>No applications sent.</p> : (
                                myApplications.map(app => (
                                    <div key={app.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{app.vacancy_title}</h4>
                                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>{app.company_name}</p>
                                            <span style={{ fontSize: '12px', color: '#999' }}>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            backgroundColor: app.status === 'accepted' ? '#f6ffed' : app.status === 'rejected' ? '#fff1f0' : '#fff7e6',
                                            color: app.status === 'accepted' ? '#52c41a' : app.status === 'rejected' ? '#f5222d' : '#faad14',
                                            border: `1px solid ${app.status === 'accepted' ? '#b7eb8f' : app.status === 'rejected' ? '#ffa39e' : '#ffe58f'}`
                                        }}>
                                            {app.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <>
                <ExperienceModal isOpen={modalState.type === 'experience'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
                <EducationModal isOpen={modalState.type === 'education'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
                <SkillModal isOpen={modalState.type === 'skill'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
                <LanguageModal isOpen={modalState.type === 'language'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
                <CertificateModal isOpen={modalState.type === 'certificate'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
                <PasswordModal isOpen={modalState.type === 'password'} onClose={closeModal} onSave={handleSaveItem} />
                <CreateContentModal
                    isOpen={modalState.type === 'content'}
                    onClose={closeModal}
                    onSuccess={() => { loadProfile(); toast.success('Content created successfully'); }}
                />
                <AddVacancyModal
                    isOpen={modalState.type === 'vacancy'}
                    onClose={closeModal}
                    initialData={modalState.data}
                    onSuccess={() => { loadProfile(); }}
                />
            </>
            <FollowListModal
                isOpen={showFollowModal}
                onClose={() => setShowFollowModal(false)}
                username={profile.username}
                type={followModalType}
            />
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => { setShowBookingModal(false); loadBookingsData(); }} // Reload events after blocking
                selectedDate={selectedDate}
                providerId={profile.id}
                isOwner={true}
            />
        </div>
    );
}

// Helper Component for Sections
const Section = ({ title, items, isOwner, onAdd, onEdit, onDelete, renderItem }) => (
    <div className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2>{title}</h2>
            {isOwner && <Button size="small" onClick={onAdd}><Plus size={16} /> Add</Button>}
        </div>
        <div className={styles.list}>
            {items.map(item => (
                <div key={item.id} className={styles.listItem}>
                    {renderItem(item)}
                    {isOwner && (
                        <div className={styles.itemActions}>
                            <Edit2 size={16} color="#1890ff" style={{ cursor: 'pointer' }} onClick={() => onEdit(item)} />
                            <Trash2 size={16} color="red" style={{ cursor: 'pointer' }} onClick={() => onDelete(item.id)} />
                        </div>
                    )}
                </div>
            ))}
            {items.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No {title.toLowerCase()} added.</p>}
        </div>
    </div>
);
