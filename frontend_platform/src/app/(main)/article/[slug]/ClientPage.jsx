"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api/client';
import { ChevronLeft, Send, Heart, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import styles from './style.module.scss';
import CommentsSection from '@/components/advanced/CommentsSection';
import LikesModal from '@/components/advanced/LikesModal';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';

import { formatDate } from '@/lib/utils/date';

export default function ClientPage() {
    const { t, i18n } = useTranslation('common');
    // ...
    // ...
    // slug is passed from Server Component
    const params = useParams();
    const slug = params?.slug;
    const router = useRouter();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0);

    useEffect(() => {
        if (slug) fetchArticle();
    }, [slug]);

    const fetchArticle = async () => {
        try {
            const { data } = await api.get(`/content/articles/${slug}/`);
            setArticle(data);
            
            // Force the site language and HTML lang tag to match the article's language
            if (data.language && i18n.language !== data.language) {
                i18n.changeLanguage(data.language);
                document.documentElement.lang = data.language;
            } else if (data.language) {
                document.documentElement.lang = data.language;
            }
        } catch (err) {
            console.error(err);
            toast.error(t('article_page.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error(t('feed_item.toast.login_like'));
            return;
        }
        const isLiked = article.is_liked;
        const newCount = isLiked ? article.likes_count - 1 : article.likes_count + 1;

        setArticle(prev => ({ ...prev, is_liked: !isLiked, likes_count: newCount }));

        try {
            await api.post(`/interactions/likes/toggle/`, {
                model: 'article',
                object_id: article.id
            });
        } catch (err) {
            console.error(err);
            setArticle(prev => ({ ...prev, is_liked: isLiked, likes_count: prev.likes_count }));
            toast.error(t('feed_item.toast.failed_like'));
        }
    };

    const handlePostComment = async () => {
        if (!user) {
            setCommentText('');
            toast.error(t('feed_item.toast.login_comment'));
            return;
        }
        if (!commentText.trim()) return;

        try {
            await api.post('/interactions/comments/', {
                model: 'article',
                object_id: article.id,
                text: commentText
            });
            setCommentText(''); // Clear input
            toast.success(t('feed_item.toast.comment_posted'));
            setRefreshCommentsTrigger(prev => prev + 1); // Trigger refresh in CommentsSection
            setArticle(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_comment'));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>{t('common.loading')}</div>;
    if (!article) return <div style={{ textAlign: 'center', marginTop: '50px' }}>{t('article_page.not_found')}</div>;

    const formattedDate = formatDate(article.created_at, i18n.language);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
            <div className={styles.container}>
                <div className={styles.backBtn} onClick={() => router.back()}>
                    <ChevronLeft size={20} />
                    <span>{t('auth_page.back')}</span>
                </div>

                <header className={styles.header}>
                    <div className={styles.metaWrapper}>
                        <div className={styles.meta}>
                            <div className={styles.avatar}>
                                <Avatar user={{ username: article.author, avatar: article.author_avatar }} size={32} />
                            </div>
                            <div className={styles.info}>
                                <span className={styles.author}>{article.author}</span>
                                <span className={styles.dot}>•</span>
                                <span className={styles.date}>{formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <h1 className={styles.title}>{article.title}</h1>
                    <div className={styles.divider}></div>
                </header>

                {article.image && (
                    <div className={styles.featuredImage}>
                        <img src={article.image} alt={article.title} />
                    </div>
                )}

                <div
                    className={styles.body}
                    dangerouslySetInnerHTML={{ __html: article.body }}
                />

                {/* Actions Bar (Like, Comment) */}
                <div className={styles.actions}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                        <button
                            onClick={handleLike}
                            style={{
                                display: 'flex', gap: '6px', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer',
                                color: article.is_liked ? '#1890ff' : '#666'
                            }}
                        >
                            <Heart size={20} fill={article.is_liked ? "#1890ff" : "none"} />
                            <span>{t('article_page.likes_count', { count: article.likes_count || 0 })}</span>
                        </button>

                      
                    </div>

                    {/* Comment Input */}
                    <div className={styles.commentInput} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <Avatar user={user} size={32} />
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                placeholder={t('feed_item.write_comment')}
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                style={{ width: '100%', padding: '8px 36px 8px 12px', borderRadius: '20px', border: '1px solid #eee', background: '#f9f9f9', outline: 'none' }}
                            />
                            <button onClick={handlePostComment} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#1890ff' }}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <CommentsSection
                        contentType="article"
                        objectId={article.id}
                        refreshTrigger={refreshCommentsTrigger}
                    />
                </div>
            </div>

            <LikesModal
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
                contentType="article"
                objectId={article.id}
            />
        </div>
    );
}
