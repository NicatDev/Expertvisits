"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Link as LinkIcon, Calendar as CalendarIcon, Mail, Phone, Globe, User } from 'lucide-react';
import { profiles, content, accounts, interactions, services, business } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import styles from './profile.module.scss';
import FeedItem from '@/components/advanced/FeedItem';
import VacancyCard from '@/components/advanced/VacancyCard';
import Calendar from '@/components/advanced/Calendar';
// import BookingModal from '@/components/advanced/BookingModal'; // Removed
import FollowListModal from '@/components/advanced/FollowListModal';
import BookingViewWrapper from './components/BookingViewWrapper';



export default function PublicProfilePage() {
    const params = useParams();
    const { username } = params;
    const { user: currentUser } = useAuth();

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
    const [vacancies, setVacancies] = useState([]);
    const [filterType, setFilterType] = useState('all');

    // Follow State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Booking State
    // Booking State
    const [isBookingView, setIsBookingView] = useState(false);
    // const [showBookingModal, setShowBookingModal] = useState(false); // Removed
    // const [selectedDate, setSelectedDate] = useState(null); // Removed

    // Follow Modal
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followType, setFollowType] = useState('followers');

    // Calendar Events
    const [calendarEvents, setCalendarEvents] = useState([]);

    const handleOpenFollow = (type) => {
        setFollowType(type);
        setShowFollowModal(true);
    };

    // Determines if "Follow" button is shown (not shown if looking at self via public link, although redundant if they use /profile)
    const isMe = currentUser && currentUser.username === username;

    useEffect(() => {
        if (username && username !== 'undefined') {
            loadProfile(username);
        } else {
            setLoading(false);
        }
    }, [username, currentUser]);

    const loadProfile = async (uName) => {
        if (!uName || uName === 'undefined') {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await accounts.getUser(uName);
            const targetUser = res.data;

            if (!targetUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            setProfile(targetUser);
            setIsFollowing(targetUser.is_following || false);
            setFollowersCount(targetUser.followers_count || 0);
            setFollowingCount(targetUser.following_count || 0);

            // Related Data
            const userId = targetUser.id;
            const fetchConfig = { user_id: userId };

            const [exp, edu, ski, lan, cert, arts, quizzes, surveys] = await Promise.all([
                profiles.getExperience(fetchConfig),
                profiles.getEducation(fetchConfig),
                profiles.getSkills(fetchConfig),
                profiles.getLanguages(fetchConfig),
                profiles.getCertificates(fetchConfig),
                content.getUserArticles(userId),
                content.getUserQuizzes(userId),
                content.getUserSurveys(userId)
            ]);

            setExperiences(exp.data.results || exp.data || []);
            setEducations(edu.data.results || edu.data || []);
            setSkills(ski.data.results || ski.data || []);
            setLanguages(lan.data.results || lan.data || []);
            setCertificates(cert.data.results || cert.data || []);

            // Normalize and Combine
            const _articles = (arts.data.results || arts.data || []).map(a => ({ ...a, type: 'article' }));
            const _quizzes = (quizzes.data.results || quizzes.data || []).map(q => ({ ...q, type: 'quiz' }));
            const _surveys = (surveys.data.results || surveys.data || []).map(s => ({ ...s, type: 'survey' }));

            const combined = [..._articles, ..._quizzes, ..._surveys].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setPosts(combined);
            setArticles(arts.data.results || arts.data || []);

            // Vacancies
            const vacRes = await business.getVacancies({ company__owner: userId });
            setVacancies(vacRes.data.results || vacRes.data || []);

            // Fetch public events (busy slots)
            try {
                const eventsRes = await services.getEvents(userId);
                setCalendarEvents(eventsRes.data);
            } catch (e) {
                console.error("Failed to load events", e);
            }

        } catch (err) {
            console.error("Load profile failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await interactions.unfollowUser(profile.username);
                setIsFollowing(false);
                setFollowersCount(prev => prev - 1);
            } else {
                await interactions.followUser(profile.username);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Follow action failed", err);
        }
    };

    // Removed handleDateSelect for old modal

    if (loading) return <div>Loading...</div>;
    if (!profile) return <div>User not found</div>;

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
                                <strong>{followingCount || 0}</strong> following
                            </span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {!isMe && (
                            <>
                                <Button
                                    type={isFollowing ? "default" : "primary"}
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </Button>
                                <Button type="default" onClick={() => setIsBookingView(true)}>
                                    Book Now
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs & Content or Booking View */}
            {
                !isBookingView && (
                    <>
                        <div className={styles.tabs}>
                            <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>About</button>
                            <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>Paylaşımlar</button>
                            <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>Vacancies</button>

                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {activeTab === 'about' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                                    {/* Info with Birthday */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader}>
                                            <h2>Information</h2>
                                        </div>
                                        <div className={styles.list}>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>FULL NAME</span>
                                                <div className={styles.value}>{profile.first_name} {profile.last_name}</div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>USERNAME</span>
                                                <div className={styles.value}>@{profile.username}</div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>BIRTHDAY</span>
                                                <div className={styles.value}>
                                                    <span style={{ color: profile.birth_day ? '#333' : '#999' }}>{profile.birth_day || 'Not set'}</span>
                                                </div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>POSITION</span>
                                                <div className={styles.value}>
                                                    <span style={{ color: profile.profession_sub_category ? '#333' : '#999' }}>
                                                        {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || 'Not set'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Section title="Experience" items={experiences} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.position}</h3>
                                            <p>{item.company_name}</p>
                                            <span>{item.start_date} - {item.end_date || 'Present'}</span>
                                        </div>
                                    )} />

                                    <Section title="Education" items={educations} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.institution}</h3>
                                            <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                                            <span>{item.start_date} - {item.end_date || 'Present'}</span>
                                        </div>
                                    )} />

                                    <Section title="Skills" items={skills} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <span>{item.skill_type}</span>
                                        </div>
                                    )} />

                                    <Section title="Languages" items={languages} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <span>Level: {item.level.toUpperCase()}</span>
                                        </div>
                                    )} />

                                    <Section title="Certificates" items={certificates} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <p>{item.issuing_organization}</p>
                                            <span>{item.issue_date}</span>
                                        </div>
                                    )} />

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
                                        {posts.length === 0 && <p>This user hasn't shared anything yet.</p>}
                                    </div>
                                </div>
                            )}



                            {activeTab === 'vacancies' && (
                                <div className={styles.section}>
                                    <h3>Vacancies</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {vacancies.map(v => (
                                            <VacancyCard key={v.id} vacancy={v} />
                                        ))}
                                        {vacancies.length === 0 && <p>Thinking about hiring? No vacancies here yet.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )
            }

            {
                isBookingView && (
                    <BookingViewWrapper
                        profile={profile}
                        events={calendarEvents}
                        onBack={() => setIsBookingView(false)}
                        onBookingSuccess={() => {
                            // Refresh events
                            try {
                                services.getEvents(profile.id).then(res => setCalendarEvents(res.data));
                            } catch (e) { console.error(e); }
                        }}
                    />
                )
            }

            {/* Booking Modal */}
            {/* Booking Modal Removed */}
            {/* <BookingModal ... /> */}

            <FollowListModal
                isOpen={showFollowModal}
                onClose={() => setShowFollowModal(false)}
                username={username}
                type={followType}
            />
        </div >
    );
}

// Simple Read-Only Section
const Section = ({ title, items, renderItem }) => (
    <div className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2>{title}</h2>
        </div>
        <div className={styles.list}>
            {items.map(item => (
                <div key={item.id} className={styles.listItem}>
                    {renderItem(item)}
                </div>
            ))}
            {items.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No {title.toLowerCase()} added.</p>}
        </div>
    </div>
);
