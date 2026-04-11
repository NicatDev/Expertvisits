"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
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
import { labelForSubCategory } from '@/lib/utils/subcategory';
import ArticleBodyContent from './ArticleBodyContent';

export default function ClientPage({ slug: slugProp, initialArticle = null }) {
    const { t, i18n } = useTranslation('common');
    const params = useParams();
    const slug = slugProp ?? params?.slug;
    const router = useRouter();
    const { user } = useAuth();
    const [article, setArticle] = useState(initialArticle);
    const [loading, setLoading] = useState(!initialArticle);
    const [fetchError, setFetchError] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0);

    useEffect(() => {
        if (!slug) return;
        if (initialArticle) {
            setArticle(initialArticle);
            setLoading(false);
            setFetchError(false);
            return;
        }
        fetchArticle();
    }, [slug, initialArticle]);

    const fetchArticle = async () => {
        setFetchError(false);
        try {
            const { data } = await api.get(`/content/articles/${slug}/`);
            setArticle(data);
        } catch (err) {
            if (err.response?.status === 404) {
                notFound();
                return;
            }
            console.error(err);
            setFetchError(true);
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
    if (!article) {
        if (fetchError) {
            return (
                <div style={{ textAlign: 'center', marginTop: '50px', padding: '0 16px' }}>
                    {t('article_page.load_error')}
                </div>
            );
        }
        return null;
    }

    const formattedDate = formatDate(article.created_at, i18n.language);
    const professionLabel = labelForSubCategory(article.sub_category, i18n.language);

    const publishedIso = article.created_at
        ? new Date(article.created_at).toISOString()
        : undefined;
    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
            <article className={styles.container} lang={article.language || 'az'}>
                <div className={styles.backBtn} onClick={() => router.back()}>
                    <ChevronLeft size={20} />
                    <span>{t('auth_page.back')}</span>
                </div>

                <header className={styles.header}>
                    <div className={styles.metaWrapper}>
                        <div className={styles.meta}>
                            <div className={styles.avatar}>
                                <Avatar user={{ username: article.author, avatar: article.author_avatar, avatar_compressed: article.author_avatar_compressed }} size={32} />
                            </div>
                            <div className={styles.infoColumn}>
                                <div className={styles.info}>
                                    <span className={styles.author}>{article.author}</span>
                                    <span className={styles.dot}>•</span>
                                    {publishedIso && (
                                        <time className={styles.date} dateTime={publishedIso}>
                                            {formattedDate}
                                        </time>
                                    )}
                                    {!publishedIso && (
                                        <span className={styles.date}>{formattedDate}</span>
                                    )}
                                </div>
                                {professionLabel ? (
                                    <div className={styles.profession}>{professionLabel}</div>
                                ) : null}
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

                <ArticleBodyContent html={article.body} ariaLabel={t('create_modal.content')} />

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
            </article>

            <LikesModal
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
                contentType="article"
                objectId={article.id}
            />
        </div>
    );
}
