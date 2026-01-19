"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import FollowListModal from '@/components/advanced/FollowListModal';

import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import LocationSelect from '@/components/ui/LocationSelect';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import styles from './profile.module.scss';
import FeedItem from '@/components/advanced/FeedItem';
import VacancyCard from '@/components/advanced/VacancyCard';
import Calendar from '@/components/advanced/Calendar';
import BlockingModal from './components/BlockingModal';
import { auth, profiles, content, accounts, services, business } from '@/lib/api';
import api from '@/lib/api/client'; // Direct client for categories
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

    useEffect(() => {
        const savedTab = sessionStorage.getItem('profileActiveTab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem('profileActiveTab', activeTab);
    }, [activeTab]);
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
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null }); // type: 'avatar' | 'cover'

    // Booking Sub-tabs
    const [bookingSubTab, setBookingSubTab] = useState('calendar'); // 'calendar' | 'requests'

    // Request History (Paginated)
    const [requestHistory, setRequestHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Posts Pagination
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'posts') {
            loadUserContent(1, filterType, true);
        }
    }, [activeTab, filterType]);

    const loadUserContent = async (page = 1, type = 'all', reset = false) => {
        if (reset) {
            setPosts([]);
            setPostsPage(1);
            setHasMorePosts(true);
        }
        setPostsLoading(true);
        try {
            const { data } = await api.get('/content/my-feed/', {
                params: {
                    type: type,
                    page: page,
                    limit: 3 // User requested 3 items
                }
            });

            const newPosts = data.results;
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            // Check if more
            if (newPosts.length < 3) { // If less than limit, no more
                setHasMorePosts(false);
            } else {
                // If exactly limit, maybe more? simplified check
                // Actually if backend returned count, we can be smarter.
                // data.count exists.
                if ((page * 3) >= data.count) {
                    setHasMorePosts(false);
                } else {
                    setHasMorePosts(true);
                }
            }
            setPostsPage(page);

        } catch (err) {
            console.error("Failed to load posts", err);
        } finally {
            setPostsLoading(false);
        }
    };

    // Follower count (ReadOnly for owner)
    const [followersCount, setFollowersCount] = useState(0);

    const [allCategories, setAllCategories] = useState([]);

    // Track initial "Availability" state for enabling Save button
    const [savedAvailability, setSavedAvailability] = useState(null);

    const isOwner = true; // Always true for /profile

    useEffect(() => {
        loadProfile();
        // Load bookings if tab is booking
        if (activeTab === 'booking') {
            loadBookingsData();
            if (bookingSubTab === 'requests') {
                loadRequestHistory(1, true); // Reset history on tab switch
            }
        }
    }, [currentUser, activeTab, bookingSubTab]);

    const loadBookingsData = async () => {
        try {
            const [reqs, evts] = await Promise.all([
                services.getBookings({ role: 'provider', status: 'pending' }),
                services.getEvents()
            ]);

            const allBookings = reqs.data.results || reqs.data;
            setBookingRequests(allBookings); // Pending ones

            setCalendarEvents(evts.data);
        } catch (err) {
            console.error("Failed to load bookings data", err);
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
                status: 'confirmed,cancelled,rejected', // All other statuses
                exclude_self: true,
                page: page,
                limit: 10 // Assuming backend supports limit or page_size, usually DRF uses page_size in settings or param
            });

            // Handle DRF pagination response
            const newItems = res.data.results || res.data;
            const totalCount = res.data.count;

            if (reset) {
                setRequestHistory(newItems);
            } else {
                setRequestHistory(prev => [...prev, ...newItems]);
            }

            // Check if more
            if (res.data.next) {
                setHasMoreHistory(true);
                setHistoryPage(page);
            } else {
                setHasMoreHistory(false);
            }

        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAcceptBooking = async (id) => {
        try {
            await services.acceptBooking(id);
            toast.success("Booking Accepted");
            loadBookingsData(); // Refresh list and calendar
            loadRequestHistory(1, true); // Refresh history to show the accepted item
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
            loadRequestHistory(1, true); // Refresh history
        } catch (err) {
            toast.error("Failed to reject");
        }
    };

    const loadProfile = async () => {
        // Wait for auth to resolve
        if (!currentUser) {
            // If user is null (and potentially loading finished), stop.
            // If loading is true, we might just be waiting.
            if (!loading) {
                setProfile(null);
            }
            return;
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
                phone_number: targetUser.phone_number,
                birth_day: targetUser.birth_day,
                city: targetUser.city
            });

            // Save initial availability state for change detection
            setSavedAvailability({
                is_service_open: targetUser.is_service_open,
                work_hours_start: targetUser.work_hours_start,
                work_hours_end: targetUser.work_hours_end,
                working_days: targetUser.working_days // array
            });

            // 2. Fetch Related Data (Unified)
            const userId = targetUser.id;

            // Unified Call
            const [detailsRes, vacs, apps] = await Promise.all([
                profiles.getProfileDetails(userId),
                business.getMyVacancies(),
                business.getMyApplications()
            ]);

            const details = detailsRes.data;

            setExperiences(details.experience || []);
            setEducations(details.education || []);
            setSkills((details.skills || []).map(s => ({ ...s, skill_type: s.skill_type || 'hard' })));
            setLanguages(details.languages || []);
            setCertificates(details.certificates || []);
            setMyApplications(apps.data.results || apps.data || []);
            setMyVacancies(vacs.data.results || vacs.data || []);

            // Posts are loaded via separate API in loadUserContent

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
            let payload = { [field]: aboutData[field] };

            // Special handling for nested objects updates (if any, typically fields are flat on user update except relations)
            // For profession_sub_category, we need to send ID.
            if (field === 'profession_sub_category') {
                payload = { profession_sub_category_id: aboutData['profession_sub_category'] };
            }

            await profiles.updateProfile(profile.username, payload);
            setProfile(prev => ({ ...prev, [field]: aboutData[field] })); // Optimistic update might be tricky for relation objects
            // Better to just reload
            loadProfile();
            toggleEdit(field);
            refreshUser();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update';
            alert(`Failed to update: ${msg}`);
        }
    };

    // --- Modals Handlers ---
    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const handleSaveItem = async (formData) => {
        const { type, data } = modalState;
        const isEdit = !!(data && data.id);
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

    const handleDeleteWithConfirmation = (type, id) => {
        setConfirmationModal({
            isOpen: true,
            title: `Delete ${capitalize(type)}`,
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            onConfirm: () => deleteItem(type, id)
        });
    };

    const deleteItem = async (type, id) => {
        try {
            await profiles[`delete${capitalize(type)}`](id);
            loadProfile();
            toast.success("Deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete");
        }
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Calendar Handler
    const handleDateSelect = (selectInfo) => {
        // Convert strings to Dates for the modal
        const start = new Date(selectInfo.startStr);
        const end = new Date(selectInfo.endStr);

        setSelectedDate({ start, end }); // Store as object expected by BlockingModal
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
            working_days: profile.working_days,
            is_service_open: profile.is_service_open
        };
        try {
            await profiles.updateProfile(profile.username, data);
            toast.success("Availability settings saved successfully!");

            // Update saved state
            setSavedAvailability({
                is_service_open: data.is_service_open,
                work_hours_start: data.work_hours_start,
                work_hours_end: data.work_hours_end,
                working_days: data.working_days
            });

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
                        <div className={styles.defaultCover} style={{ background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }} />
                    )}
                    <div className={styles.editOverlay} style={{ backdropFilter: 'none', background: 'transparent', gap: '10px' }}>
                        <div
                            onClick={(e) => { e.stopPropagation(); coverInputRef.current.click(); }}
                            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333' }}
                            title="Edit Cover"
                        >
                            <Edit2 size={16} />
                        </div>
                        {profile.cover_image && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmationModal({
                                        isOpen: true, title: "Delete Cover", message: "Are you sure?", onConfirm: async () => {
                                            await profiles.updateProfile(profile.username, { cover_image: null });
                                            loadProfile(); refreshUser();
                                        }
                                    });
                                }}
                                style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'red' }}
                                title="Delete Cover"
                            >
                                <Trash2 size={16} />
                            </div>
                        )}
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
                        <div
                            className={styles.avatarOverlay}
                            onClick={() => setActionModal({ isOpen: true, type: 'avatar' })}
                        >
                            <Edit2 size={24} />
                        </div>
                        <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                    </div>

                    <div className={styles.names}>
                        <h1>{profile.first_name} {profile.last_name}</h1>
                        <p className={styles.subtitle}>@{profile.username} • {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || 'Professional'}</p>

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
                <button className={activeTab === 'booking' ? styles.activeTab : ''} onClick={() => setActiveTab('booking')}>Booking</button>
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
                                {['first_name', 'last_name', 'username', 'phone_number', 'birth_day', 'city'].map(field => (
                                    <div key={field} className={styles.editableField}>
                                        <span className={styles.label}>{field.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                                        <div className={styles.value}>
                                            {editMode[field] ? (
                                                <div className={styles.inlineForm}>
                                                    {field === 'city' ? (
                                                        <div style={{ width: '100%' }}>
                                                            <LocationSelect
                                                                value={aboutData[field] || ''}
                                                                onChange={val => setAboutData({ ...aboutData, [field]: val })}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            type={field === 'birth_day' ? 'date' : 'text'}
                                                            value={aboutData[field] || ''}
                                                            onChange={e => setAboutData({ ...aboutData, [field]: e.target.value })}
                                                            wrapperStyle={{ marginBottom: 0 }}
                                                        />
                                                    )}
                                                    <button onClick={() => saveInline(field)} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                                    <button onClick={() => toggleEdit(field)} className={styles.iconBtn}><X size={18} color="red" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span style={{ color: profile[field] ? '#333' : '#999' }}>{profile[field] || 'Not set'}</span>
                                                    <Edit2 className={styles.editIcon} size={14} onClick={() => toggleEdit(field)} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Email always read-only */}
                                <div className={styles.editableField}>
                                    <span className={styles.label}>Email</span>
                                    <div className={styles.value}>
                                        <span style={{ color: '#999' }}>{profile.email}</span>
                                    </div>
                                </div>

                                {/* Position Editable */}
                                <div className={styles.editableField}>
                                    <span className={styles.label}>Position</span>
                                    <div className={styles.value}>
                                        {editMode['profession_sub_category'] ? (
                                            <div className={styles.inlineForm}>
                                                <SearchableSelect
                                                    options={allCategories}
                                                    value={aboutData.profession_sub_category}
                                                    onChange={(val) => setAboutData({ ...aboutData, profession_sub_category: val })}
                                                    groupBy="subcategories"
                                                    labelKey="name"
                                                    valueKey="id"
                                                    placeholder="Search profession..."
                                                />
                                                <button onClick={() => saveInline('profession_sub_category')} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                                <button onClick={() => toggleEdit('profession_sub_category')} className={styles.iconBtn}><X size={18} color="red" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{ color: profile.profession_sub_category ? '#333' : '#999' }}>
                                                    {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || 'Not set'}
                                                </span>
                                                <Edit2
                                                    className={styles.editIcon}
                                                    size={14}
                                                    onClick={async () => {
                                                        // Load categories if not loaded
                                                        if (allCategories.length === 0) {
                                                            try {
                                                                const { data } = await api.get('/accounts/categories/');
                                                                setAllCategories(data.results || data);
                                                            } catch (e) {
                                                                console.error(e);
                                                                return;
                                                            }
                                                        }
                                                        // Set initial ID
                                                        setAboutData(prev => ({ ...prev, profession_sub_category: profile.profession_sub_category?.id }));
                                                        toggleEdit('profession_sub_category');
                                                    }}
                                                />
                                            </>
                                        )}
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
                            onDelete={(id) => handleDeleteWithConfirmation('experience', id)}
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
                            onDelete={(id) => handleDeleteWithConfirmation('education', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.institution}</h3>
                                    <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                                    <span>{item.start_date} - {item.end_date || 'Present'}</span>
                                </div>
                            )}
                        />


                        <Section
                            title="Hard Skills"
                            items={skills.filter(s => s.skill_type === 'hard')}
                            isOwner={true}
                            onAdd={() => openModal('skill', { skill_type: 'hard' })}
                            onEdit={(item) => openModal('skill', item)}
                            onDelete={(id) => handleDeleteWithConfirmation('skill', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.name}</h3>
                                </div>
                            )}
                        />

                        <Section
                            title="Soft Skills"
                            items={skills.filter(s => s.skill_type === 'soft')}
                            isOwner={true}
                            onAdd={() => openModal('skill', { skill_type: 'soft' })}
                            onEdit={(item) => openModal('skill', item)}
                            onDelete={(id) => handleDeleteWithConfirmation('skill', id)}
                            renderItem={(item) => (
                                <div className={styles.itemContent}>
                                    <h3>{item.name}</h3>
                                </div>
                            )}
                        />

                        <Section
                            title="Languages"
                            items={languages}
                            isOwner={true}
                            onAdd={() => openModal('language')}
                            onEdit={(item) => openModal('language', item)}
                            onDelete={(id) => handleDeleteWithConfirmation('language', id)}
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
                            onDelete={(id) => handleDeleteWithConfirmation('certificate', id)}
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
                            {posts.map(item => (
                                <FeedItem
                                    key={`${item.type}-${item.id}`}
                                    item={item}
                                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                                />
                            ))
                            }
                            {posts.length === 0 && !postsLoading && <p>No content shared yet.</p>}

                            {hasMorePosts && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                    <Button
                                        type="default"
                                        loading={postsLoading}
                                        onClick={() => loadUserContent(postsPage + 1, filterType)}
                                    >
                                        Load More
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (() => {
                    const hasAvailabilityChanges = (() => {
                        if (!savedAvailability) return false;
                        // Compare normalized (sorted strings of ints)
                        const currentDays = (profile.working_days || []).map(d => +d).sort().join(',');
                        const savedDays = (savedAvailability.working_days || []).map(d => +d).sort().join(',');

                        return (
                            Boolean(profile.is_service_open) !== Boolean(savedAvailability.is_service_open) ||
                            (profile.work_hours_start || '') !== (savedAvailability.work_hours_start || '') ||
                            (profile.work_hours_end || '') !== (savedAvailability.work_hours_end || '') ||
                            currentDays !== savedDays
                        );
                    })();

                    return (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Availability Settings</h2>
                                <Button
                                    size="small"
                                    onClick={handleAvailabilitySave}
                                    disabled={!hasAvailabilityChanges}
                                    style={{
                                        backgroundColor: hasAvailabilityChanges ? '#1890ff' : '#ccc',
                                        borderColor: hasAvailabilityChanges ? '#1890ff' : '#ccc',
                                        cursor: hasAvailabilityChanges ? 'pointer' : 'not-allowed',
                                        color: '#fff',
                                        opacity: hasAvailabilityChanges ? 1 : 0.7
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>

                            <div className={styles.list}>
                                <div className={styles.editableField}>
                                    <span className={styles.label}>Accept Bookings</span>
                                    <div className={styles.value}>
                                        <label className={styles.switch}>
                                            <input
                                                type="checkbox"
                                                checked={profile.is_service_open || false}
                                                onChange={e => setProfile(prev => ({ ...prev, is_service_open: e.target.checked }))}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </div>
                                </div>

                                {profile.is_service_open && (
                                    <>
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
                                                        wrapperStyle={{ marginBottom: 0 }}
                                                    />
                                                    <span style={{ width: '40px' }}>End:</span>
                                                    <Input
                                                        type="time"
                                                        value={profile.work_hours_end || ''}
                                                        onChange={e => setProfile(prev => ({ ...prev, work_hours_end: e.target.value }))}
                                                        style={{ width: '120px' }}
                                                        wrapperStyle={{ marginBottom: 0 }}
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
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'booking' && (
                    <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Sub Tabs */}
                        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <button
                                onClick={() => setBookingSubTab('calendar')}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontWeight: bookingSubTab === 'calendar' ? 600 : 400,
                                    color: bookingSubTab === 'calendar' ? '#1890ff' : '#666',
                                    borderBottom: bookingSubTab === 'calendar' ? '2px solid #1890ff' : 'none'
                                }}
                            >
                                Calendar
                            </button>
                            <button
                                onClick={() => setBookingSubTab('requests')}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontWeight: bookingSubTab === 'requests' ? 600 : 400,
                                    color: bookingSubTab === 'requests' ? '#1890ff' : '#666',
                                    borderBottom: bookingSubTab === 'requests' ? '2px solid #1890ff' : 'none'
                                }}
                            >
                                Requests
                            </button>
                        </div>

                        {bookingSubTab === 'calendar' && (
                            <div className={styles.list}>
                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: 12, height: 12, background: '#fa8c16', borderRadius: '50%' }}></div>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Pending Requests</span>
                                    <div style={{ width: 12, height: 12, background: '#595959', marginLeft: '16px', borderRadius: '50%' }}></div>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Blocked / Busy</span>
                                    <div style={{ width: 12, height: 12, background: '#52c41a', marginLeft: '16px', borderRadius: '50%' }}></div>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Confirmed Meetings</span>
                                </div>
                                <Calendar
                                    events={calendarEvents}
                                    onDateSelect={handleDateSelect}
                                />
                            </div>
                        )}

                        {bookingSubTab === 'requests' && (
                            <>
                                {/* Incoming Requests */}
                                <div>
                                    <div className={styles.sectionHeader}>
                                        <h2>Incoming Requests</h2>
                                    </div>
                                    <div className={styles.list} style={{ flexDirection: 'column', gap: '12px' }}>
                                        {bookingRequests.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic' }}>No pending requests.</p> : (
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
                                                                <Link href={`/user/${req.customer_details?.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                                    <h4 style={{ margin: 0, cursor: 'pointer' }}>{req.customer_details?.first_name} {req.customer_details?.last_name}</h4>
                                                                </Link>
                                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>@{req.customer_details?.username}</span>
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', color: '#fa8c16', fontWeight: 500 }}>Pending</span>
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
                                                        <Button size="small" type="default" style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }} onClick={() => handleRejectBooking(req.id)}>Reject</Button>
                                                        <Button size="small" type="primary" onClick={() => handleAcceptBooking(req.id)}>Accept</Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Request History */}
                                <div style={{ marginTop: '30px' }}>
                                    <div className={styles.sectionHeader}>
                                        <h2>All Requests</h2>
                                    </div>
                                    <div className={styles.list} style={{ flexDirection: 'column', gap: '12px' }}>
                                        {requestHistory.map(req => (
                                            <div key={req.id} className={styles.listItem} style={{ alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    {req.customer_details?.avatar ? (
                                                        <img src={req.customer_details.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
                                                    )}
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Link href={`/user/${req.customer_details?.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                                <strong style={{ fontSize: '0.95rem', cursor: 'pointer' }}>{req.customer_details?.first_name} {req.customer_details?.last_name}</strong>
                                                            </Link>
                                                            <span style={{
                                                                fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px',
                                                                background: req.status === 'confirmed' ? '#f6ffed' : '#fff1f0',
                                                                color: req.status === 'confirmed' ? '#52c41a' : '#f5222d',
                                                                border: `1px solid ${req.status === 'confirmed' ? '#b7eb8f' : '#ffa39e'}`
                                                            }}>
                                                                {req.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                                            {new Date(req.requested_datetime).toLocaleString()} • {req.duration_minutes} min
                                                        </div>
                                                    </div>
                                                </div>
                                                {req.note && (
                                                    <div style={{ maxWidth: '40%', fontSize: '0.85rem', color: '#555', fontStyle: 'italic', textAlign: 'right' }}>
                                                        "{req.note}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {requestHistory.length === 0 && !historyLoading && (
                                            <p style={{ color: '#999', fontStyle: 'italic' }}>No history yet.</p>
                                        )}

                                        {hasMoreHistory && (
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                                <Button
                                                    type="default"
                                                    loading={historyLoading}
                                                    onClick={() => loadRequestHistory(historyPage + 1)}
                                                >
                                                    Load More
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
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
                                        setConfirmationModal({
                                            isOpen: true,
                                            title: "Delete Vacancy",
                                            message: "Are you sure you want to delete this vacancy?",
                                            onConfirm: async () => {
                                                await business.deleteVacancy(v.id);
                                                setMyVacancies(prev => prev.filter(item => item.id !== v.id));
                                                toast.success("Vacancy deleted");
                                            }
                                        });
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
                <ConfirmationModal
                    isOpen={confirmationModal.isOpen}
                    onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                    onConfirm={confirmationModal.onConfirm}
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                />

                {/* Simple Action Modal for Avatar */}
                {actionModal.isOpen && actionModal.type === 'avatar' && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }} onClick={() => setActionModal({ isOpen: false, type: null })}>
                        <div style={{ background: 'white', borderRadius: '8px', width: '300px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Update Profile Picture</div>
                            <div
                                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => {
                                    fileInputRef.current.click();
                                    setActionModal({ isOpen: false, type: null });
                                }}
                            >
                                <Edit2 size={16} /> Change Photo
                            </div>
                            {profile.avatar && (
                                <div
                                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'red' }}
                                    onClick={() => {
                                        setActionModal({ isOpen: false, type: null });
                                        setConfirmationModal({
                                            isOpen: true, title: "Delete Avatar", message: "Are you sure you want to remove your profile picture?", onConfirm: async () => {
                                                await profiles.updateProfile(profile.username, { avatar: null });
                                                loadProfile(); refreshUser();
                                            }
                                        });
                                    }}
                                >
                                    <Trash2 size={16} /> Remove Current Photo
                                </div>
                            )}
                            <div
                                style={{ padding: '12px 16px', cursor: 'pointer', borderTop: '1px solid #eee', textAlign: 'center', color: '#666' }}
                                onClick={() => setActionModal({ isOpen: false, type: null })}
                            >
                                Cancel
                            </div>
                        </div>
                    </div>
                )}
                <CreateContentModal
                    isOpen={modalState.type === 'content'}
                    onClose={closeModal}
                    onSuccess={() => {
                        loadProfile();
                        if (activeTab === 'posts') loadUserContent(1, filterType, true);
                        toast.success('Content created successfully');
                    }}
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
            {/* Blocking Modal */}
            <BlockingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                selectedEvent={selectedDate} // Passing full selectInfo object which contains start/end
                providerId={profile.id}
                onSuccess={() => { loadBookingsData(); setShowBookingModal(false); }}
                workingDays={profile.working_days}
                workingHours={{
                    start: profile.work_hours_start,
                    end: profile.work_hours_end
                }}
            />
        </div >
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
