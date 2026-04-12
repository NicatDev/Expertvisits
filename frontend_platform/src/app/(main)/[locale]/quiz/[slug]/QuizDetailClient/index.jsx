'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, PlayCircle, CheckCircle, Heart, MessageCircle, Send } from 'lucide-react';
import { content } from '@/lib/api';
import api from '@/lib/api/client';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import CommentsSection from '@/components/advanced/CommentsSection';
import LikesModal from '@/components/advanced/LikesModal';
import QuizModal from '@/components/advanced/QuizModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';
import { toast } from 'react-toastify';
import { formatDate } from '@/lib/utils/date';
import { labelForSubCategory } from '@/lib/utils/subcategory';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import styles from '../style.module.scss';

export default function QuizDetailClient({ slug: slugProp, initialQuiz }) {
    const { t, i18n } = useTranslation('common');
    const params = useParams();
    const slug = slugProp ?? params?.slug;
    const router = useRouter();
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname) || defaultLocale;

    const { user, loading: authLoading } = useAuth();
    const [quiz, setQuiz] = useState(initialQuiz);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [commentsTrigger, setCommentsTrigger] = useState(0);
    const [commentText, setCommentText] = useState('');

    const userPublicHref = (username) =>
        username ? withLocale(pathLocale, `/user/${encodeURIComponent(username)}`) : '#';

    useEffect(() => {
        if (!slug || authLoading) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await content.getQuiz(slug);
                if (!cancelled) setQuiz(data);
            } catch (e) {
                console.error(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [slug, authLoading, user?.id]);

    const stats = quiz?.quiz_stats;
    const myAttempts = quiz?.my_attempts || [];

    const openReview = async (attemptId) => {
        if (!user) {
            toast.info(t('auth.login_required'));
            return;
        }
        try {
            const { data } = await content.getQuizResult(slug, attemptId ? { attempt_id: attemptId } : {});
            setReviewData(data);
            setShowQuizModal(true);
        } catch (e) {
            console.error(e);
            toast.error(t('feed_item.toast.failed_load_result'));
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error(t('feed_item.toast.login_like'));
            return;
        }
        const isLiked = quiz.is_liked;
        const newCount = isLiked ? quiz.likes_count - 1 : quiz.likes_count + 1;
        setQuiz((prev) => ({ ...prev, is_liked: !isLiked, likes_count: newCount }));
        try {
            await api.post('/interactions/likes/toggle/', {
                model: 'quiz',
                object_id: quiz.id,
            });
        } catch (err) {
            console.error(err);
            setQuiz((prev) => ({ ...prev, is_liked: isLiked, likes_count: quiz.likes_count }));
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
                model: 'quiz',
                object_id: quiz.id,
                text: commentText,
            });
            setCommentText('');
            toast.success(t('feed_item.toast.comment_posted'));
            setCommentsTrigger((c) => c + 1);
            setQuiz((prev) => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_comment'));
        }
    };

    const startOrRetake = () => {
        if (!user) {
            toast.error(t('feed_item.toast.login_participate'));
            return;
        }
        setReviewData(null);
        setShowQuizModal(true);
    };

    if (!quiz) {
        return null;
    }

    const qCount = quiz.questions?.length || 0;

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
            <article className={styles.pageShell} lang={i18n.language || 'az'}>
                <div className={styles.backBtn} onClick={() => router.back()}>
                    <ChevronLeft size={20} />
                    <span>{t('auth_page.back')}</span>
                </div>
                <header className={styles.header}>
                    <div className={styles.authorRow}>
                        {quiz.author ? (
                            <Link href={userPublicHref(quiz.author)} className={styles.avatar}>
                                <Avatar
                                    user={{
                                        username: quiz.author,
                                        avatar: quiz.author_avatar,
                                        avatar_compressed: quiz.author_avatar_compressed,
                                    }}
                                    size={40}
                                />
                            </Link>
                        ) : (
                            <div className={styles.avatar}>
                                <Avatar user={{ username: t('feed_item.unknown_user') }} size={40} />
                            </div>
                        )}
                        <div>
                            {quiz.author ? (
                                <Link href={userPublicHref(quiz.author)} className={styles.username}>
                                    {quiz.author}
                                </Link>
                            ) : (
                                <span className={styles.username}>{t('feed_item.unknown_user')}</span>
                            )}
                            <div className={styles.date}>{formatDate(quiz.created_at, i18n.language)}</div>
                            {labelForSubCategory(quiz.sub_category, i18n.language) ? (
                                <div className={styles.pro}>{labelForSubCategory(quiz.sub_category, i18n.language)}</div>
                            ) : null}
                        </div>
                    </div>
                    <h1 className={styles.title}>{quiz.title}</h1>
                    <p className={styles.metaLine}>
                        {qCount} {t('feed_item.questions_count')} · {quiz.participation_count ?? 0}{' '}
                        {t('quiz_page.participants_unique')}
                    </p>
                </header>

                <div className={styles.actions}>
                    <Button type="primary" icon={<PlayCircle size={18} />} onClick={startOrRetake}>
                        {quiz.is_participated ? t('quiz_page.retake') : t('quiz_page.start')}
                    </Button>
                    {quiz.is_participated ? (
                        <Button
                            type="default"
                            icon={<CheckCircle size={18} />}
                            onClick={() => openReview(null)}
                        >
                            {t('quiz_page.view_latest_result')}
                        </Button>
                    ) : null}
                </div>

                {stats ? (
                    <section className={styles.stats} aria-label={t('quiz_page.stats_title')}>
                        <h2>{t('quiz_page.stats_title')}</h2>
                        <div className={styles.statGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{stats.average_percent ?? 0}%</span>
                                <span className={styles.statLabel}>{t('quiz_page.stats_avg')}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{stats.unique_participants ?? 0}</span>
                                <span className={styles.statLabel}>{t('quiz_page.stats_participants')}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{stats.total_attempts ?? 0}</span>
                                <span className={styles.statLabel}>{t('quiz_page.stats_attempts')}</span>
                            </div>
                        </div>
                    </section>
                ) : null}

                {user && myAttempts.length > 0 ? (
                    <section className={styles.attempts}>
                        <h2>{t('quiz_page.my_attempts')}</h2>
                        <ul className={styles.attemptList}>
                            {myAttempts.map((att, idx) => (
                                <li key={att.id}>
                                    <button
                                        type="button"
                                        className={styles.attemptBtn}
                                        onClick={() => openReview(att.id)}
                                    >
                                        <span>
                                            {t('quiz_page.attempt_label', {
                                                n: myAttempts.length - idx,
                                            })}
                                        </span>
                                        <span className={styles.attemptMeta}>
                                            {att.percentage}% · {formatDate(att.created_at, i18n.language)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {/* Məqalə detalı ilə eyni: bəyənmə sayı, rəy sayı, rəy inputu, sonra şərhlər */}
                <div className={styles.detailEngagement}>
                    <div className={styles.detailEngagementRow}>
                        <button
                            type="button"
                            className={quiz.is_liked ? styles.detailLikeActive : styles.detailLikeBtn}
                            onClick={handleLike}
                        >
                            <Heart size={20} fill={quiz.is_liked ? '#1890ff' : 'none'} />
                            <span>
                                {t('article_page.likes_count', { count: quiz.likes_count || 0 })}
                            </span>
                        </button>
                        <div className={styles.detailCommentsStat}>
                            <MessageCircle size={20} aria-hidden />
                            <span>
                                {t('article_page.comments_count', { count: quiz.comments_count || 0 })}
                            </span>
                        </div>
                    </div>

                    <div className={styles.detailCommentInput}>
                        <Avatar user={user} size={32} />
                        <div className={styles.detailCommentInputInner}>
                            <input
                                type="text"
                                placeholder={t('feed_item.write_comment')}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            />
                            <button type="button" onClick={handlePostComment} aria-label={t('feed_item.comment_action')}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    <CommentsSection
                        contentType="quiz"
                        objectId={quiz.id}
                        refreshTrigger={commentsTrigger}
                    />
                </div>
            </article>

            <LikesModal
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
                contentType="quiz"
                objectId={quiz.id}
            />

            <QuizModal
                isOpen={showQuizModal}
                onClose={() => {
                    setShowQuizModal(false);
                    setReviewData(null);
                }}
                quiz={reviewData || quiz}
                reviewMode={!!reviewData}
                onSuccess={async () => {
                    try {
                        const { data } = await content.getQuiz(slug);
                        setQuiz(data);
                        setCommentsTrigger((c) => c + 1);
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />
        </div>
    );
}
