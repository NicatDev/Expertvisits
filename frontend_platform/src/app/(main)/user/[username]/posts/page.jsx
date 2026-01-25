"use client";
import React, { useState, useEffect } from 'react';
import { usePublicProfile } from '../context';
import api from '@/lib/api/client';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import FeedItem from '@/components/advanced/FeedItem';
import NoContent from '@/components/ui/NoContent';
import styles from './style.module.scss';

export default function UserPostsPage() {
    const { profile, loading: profileLoading } = usePublicProfile();
    const { t } = useTranslation('common');

    const [posts, setPosts] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            loadPosts(profile.id, 1, filterType, true);
        }
    }, [profile, filterType]);

    const loadPosts = async (userId, pageNo = 1, type = 'all', reset = false) => {
        if (reset) {
            setPosts([]);
            setPage(1);
            setHasMore(true);
        }
        setLoading(true);

        try {
            const { data } = await api.get('/content/public-feed/', {
                params: {
                    user_id: userId,
                    type: type,
                    page: pageNo,
                    limit: 5 // Default limit
                }
            });

            const newPosts = data.results || [];
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (newPosts.length < 5) {
                setHasMore(false);
            } else {
                if (data.count && (pageNo * 5) >= data.count) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }
            setPage(pageNo);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) return <div style={{ padding: 20 }}>Loading...</div>;
    if (!profile) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>{t('public_profile.tabs.posts')}</h3>
                <div className={styles.filters}>
                    {['all', 'article', 'quiz', 'poll'].map(ft => (
                        <Button
                            key={ft}
                            size="small"
                            className={filterType === ft ? styles.activeFilter : styles.filterBtn}
                            onClick={() => setFilterType(ft)}
                        >
                            {t(`feed.${ft === 'all' ? 'all' : ft === 'article' ? 'article' : ft === 'quiz' ? 'quiz' : 'poll'}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className={styles.list}>
                {posts.map(item => (
                    <FeedItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                    />
                ))}
                {posts.length === 0 && !loading && <NoContent message={t('public_profile.no_posts')} />}

                {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <Button
                            type="default"
                            loading={loading}
                            onClick={() => loadPosts(profile.id, page + 1, filterType)}
                        >
                            {t('feed.load_more')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
