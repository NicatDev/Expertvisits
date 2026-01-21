"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Link as LinkIcon, Calendar as CalendarIcon, Mail, Phone, Globe, User } from 'lucide-react';
import { profiles, content, accounts, interactions, services, business } from '@/lib/api';
import api from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
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
    const { t } = useTranslation('common');

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

    // Posts Pagination
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'posts' && profile) {
            loadUserContent(profile.id, 1, filterType, true);
        }
    }, [activeTab, filterType, profile]);

    const loadUserContent = async (userId, page = 1, type = 'all', reset = false) => {
        if (!userId) return;

        if (reset) {
            setPosts([]);
            setPostsPage(1);
            setHasMorePosts(true);
        }
        setPostsLoading(true);
        try {
            const { data } = await api.get('/content/public-feed/', {
                params: {
                    user_id: userId,
                    type: type,
                    page: page,
                    limit: 3
                }
            });

            const newPosts = data.results;
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (newPosts.length < 3) {
                setHasMorePosts(false);
            } else {
                if (data.count && (page * 3) >= data.count) {
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

            const [exp, edu, ski, lan, cert] = await Promise.all([
                profiles.getExperience(fetchConfig),
                profiles.getEducation(fetchConfig),
                profiles.getSkills(fetchConfig),
                profiles.getLanguages(fetchConfig),
                profiles.getCertificates(fetchConfig),
            ]);

            setExperiences(exp.data.results || exp.data || []);
            setEducations(edu.data.results || edu.data || []);
            setSkills(ski.data.results || ski.data || []);
            setLanguages(lan.data.results || lan.data || []);
            setCertificates(cert.data.results || cert.data || []);

            // Posts loaded via loadUserContent
            // Vacancies

            // Vacancies
            const vacRes = await business.getVacancies({ company__owner: userId });
            setVacancies(vacRes.data.results || vacRes.data || []);

            // Fetch public events (busy slots)
            try {
                // Always fetch events for the user we are viewing. 
                // The backend handles privacy (showing confirmed as 'Busy' for others).
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



    // ...

    return (
        <div className={styles.container}>
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
                                <strong>{followersCount}</strong> {t('profile.followers', { defaultValue: 'Followers' })}
                            </span>
                            <span
                                style={{ cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => handleOpenFollow('following')}
                            >
                                <strong>{followingCount || 0}</strong> {t('profile.following', { defaultValue: 'Following' })}
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
                                    {isFollowing ? t('public_profile.unfollow') : t('public_profile.follow')}
                                </Button>
                                <Button type="default" onClick={() => setIsBookingView(true)}>
                                    {t('public_profile.book_now')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {
                !isBookingView && (
                    <>
                        <div className={styles.tabs}>
                            <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>{t('public_profile.tabs.about')}</button>
                            <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>{t('public_profile.tabs.posts')}</button>
                            <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>{t('public_profile.tabs.vacancies')}</button>

                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {activeTab === 'about' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                                    {/* Info with Birthday */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader}>
                                            <h2>{t('public_profile.info_title')}</h2>
                                        </div>
                                        <div className={styles.list}>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>{t('public_profile.labels.full_name')}</span>
                                                <div className={styles.value}>{profile.first_name} {profile.last_name}</div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>{t('public_profile.labels.username')}</span>
                                                <div className={styles.value}>@{profile.username}</div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>{t('public_profile.labels.birthday')}</span>
                                                <div className={styles.value}>
                                                    <span style={{ color: profile.birth_day ? '#333' : '#999' }}>{profile.birth_day || t('public_profile.not_set')}</span>
                                                </div>
                                            </div>
                                            <div className={styles.editableField}>
                                                <span className={styles.label}>{t('public_profile.labels.profession')}</span>
                                                <div className={styles.value}>
                                                    <span style={{ color: profile.profession_sub_category ? '#333' : '#999' }}>
                                                        {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || t('public_profile.not_set')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Section title={t('public_profile.sections.experience')} items={experiences} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.position}</h3>
                                            <p>{item.company_name}</p>
                                            <span>{item.start_date} - {item.end_date || t('public_profile.present')}</span>
                                        </div>
                                    )} t={t} />

                                    <Section title={t('public_profile.sections.education')} items={educations} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.institution}</h3>
                                            <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                                            <span>{item.start_date} - {item.end_date || t('public_profile.present')}</span>
                                        </div>
                                    )} t={t} />

                                    <Section title={t('public_profile.sections.skills')} items={skills} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <span>{item.skill_type}</span>
                                        </div>
                                    )} t={t} />

                                    <Section title={t('public_profile.sections.languages')} items={languages} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <span>{t('public_profile.level')}: {item.level.toUpperCase()}</span>
                                        </div>
                                    )} t={t} />

                                    <Section title={t('public_profile.sections.certificates')} items={certificates} renderItem={(item) => (
                                        <div className={styles.itemContent}>
                                            <h3>{item.name}</h3>
                                            <p>{item.issuing_organization}</p>
                                            <span>{item.issue_date}</span>
                                        </div>
                                    )} t={t} />

                                </div>
                            )}

                            {activeTab === 'posts' && (
                                <div className={styles.tabContent}>
                                    <div className={styles.sectionHeader}>
                                        <h3>{t('public_profile.tabs.posts')}</h3>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['all', 'article', 'quiz', 'poll'].map(ft => (
                                                <Button
                                                    key={ft}
                                                    size="small"
                                                    style={{ background: filterType === ft ? '#1890ff' : '#f0f0f0', color: filterType === ft ? '#fff' : '#333', border: 'none' }}
                                                    onClick={() => setFilterType(ft)}
                                                >
                                                    {t(`feed.${ft === 'all' ? 'all' : ft === 'article' ? 'article' : ft === 'quiz' ? 'quiz' : 'poll'}`)}
                                                </Button>
                                            ))}
                                        </div>
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
                                        {posts.length === 0 && !postsLoading && <p>{t('public_profile.no_posts')}</p>}

                                        {hasMorePosts && (
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                                <Button
                                                    type="default"
                                                    loading={postsLoading}
                                                    onClick={() => loadUserContent(profile.id, postsPage + 1, filterType)}
                                                >
                                                    {t('feed.load_more')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}



                            {activeTab === 'vacancies' && (
                                <div className={styles.section}>
                                    <h3>{t('public_profile.tabs.vacancies')}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {vacancies.map(v => (
                                            <VacancyCard key={v.id} vacancy={v} />
                                        ))}
                                        {vacancies.length === 0 && <p>{t('public_profile.no_vacancies')}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )
            }
            {isBookingView && (
                <BookingViewWrapper
                    profile={profile}
                    onClose={() => setIsBookingView(false)}
                />
            )}
        </div>
    );
}

const Section = ({ title, items, renderItem, t }) => (
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
            {items.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>{t('public_profile.no_items')}</p>}
        </div>
    </div>
);
