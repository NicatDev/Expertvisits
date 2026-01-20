import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import FeedItem from '@/components/advanced/FeedItem';
import CreateContentModal from '@/components/advanced/CreateContentModal';
import styles from '../profile.module.scss';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';

const PostsTab = ({ isOwner, profile, onRefreshProfile }) => { // onRefreshProfile might be needed for counts?
    const { t } = useTranslation('common');
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadUserContent(1, filterType, true);
    }, [filterType]);

    const loadUserContent = async (pageNum = 1, type = 'all', reset = false) => {
        if (reset) {
            setPosts([]);
            setPage(1);
            setHasMore(true);
        }
        setLoading(true);
        try {
            const { data } = await api.get('/content/my-feed/', {
                params: {
                    type: type,
                    page: pageNum,
                    limit: 5 // Keeping it small or 5
                }
            });

            const newPosts = data.results;
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (data.next) {
                setHasMore(true);
            } else {
                setHasMore(false);
            }
            setPage(pageNum);

        } catch (err) {
            console.error("Failed to load posts", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <h3>{t('profile.tabs.posts')}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['all', 'article', 'quiz'].map(ft => (
                        <Button
                            key={ft}
                            size="small"
                            style={{ background: filterType === ft ? '#1890ff' : '#f0f0f0', color: filterType === ft ? '#fff' : '#333', border: 'none' }}
                            onClick={() => setFilterType(ft)}
                        >
                            {ft === 'all' ? t('profile.filters.all') : ft === 'article' ? t('profile.filters.articles') : t('profile.filters.quizzes')}
                        </Button>
                    ))}
                </div>
                {isOwner && <Button onClick={() => setShowCreateModal(true)}>+ {t('profile.content.add_content')}</Button>}
            </div>

            <div className={styles.list} style={{ flexDirection: 'column', gap: '16px' }}>
                {posts.map(item => (
                    <FeedItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                    />
                ))}

                {posts.length === 0 && !loading && <p>{t('profile.content.no_content')}</p>}

                {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <Button
                            type="default"
                            loading={loading}
                            onClick={() => loadUserContent(page + 1, filterType)}
                        >
                            {t('profile.content.load_more')}
                        </Button>
                    </div>
                )}
            </div>

            {isOwner && (
                <CreateContentModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadUserContent(1, filterType, true);
                        if (onRefreshProfile) onRefreshProfile();
                        toast.success(t('profile.content.created_success'));
                    }}
                />
            )}
        </div>
    );
};

export default PostsTab;
