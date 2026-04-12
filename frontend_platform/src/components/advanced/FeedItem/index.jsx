import React, { useState, useMemo } from 'react';
import Button from '../../ui/Button';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Send, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import Link from 'next/link';
import { toast } from 'react-toastify';
import LikesModal from '../LikesModal';
import CommentsSection from '../CommentsSection';
import QuizModal from '../QuizModal';
import api from '@/lib/api/client';
import { content } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss'; // Import SCSS Module
import EditArticleModal from '../EditArticleModal';
import ParticipantsListModal from '../ParticipantsListModal';
import Modal from '../../ui/Modal';
import { useTranslation } from '@/i18n/client';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import { formatDate } from '@/lib/utils/date';
import { htmlToFeedPreview } from '@/lib/utils/htmlFeedPreview';
import { labelForSubCategory } from '@/lib/utils/subcategory';
import PollCard from '../PollCard';

const FeedItem = ({ item, onDelete, onFeedRefresh, onFeedItemRefresh }) => {
    if (item.type === 'poll') {
        return <PollCard poll={item} onFeedItemRefresh={onFeedItemRefresh} />;
    }
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname);

    // Local state but initialized from props.
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);

    // We update this 'localItem' when we refresh data
    const [localItem, setLocalItem] = useState(item);

    React.useEffect(() => {
        setLocalItem(item);
        setLikesCount(item.likes_count || 0);
        setCommentsCount(item.comments_count || 0);
        setIsLiked(item.is_liked || false);
    }, [item]);

    // Basic detection of type based on fields
    const isArticle = localItem.body !== undefined;
    const isQuiz = localItem.questions !== undefined;

    // UI locale from URL only — not article.language (SEO alternate URLs are separate; same for share link)
    const articleLinkLocale = pathLocale || defaultLocale;
    const userPublicHref = (username) =>
        username ? withLocale(articleLinkLocale, `/user/${encodeURIComponent(username)}`) : null;
    const articleHref =
        isArticle && localItem.slug
            ? withLocale(articleLinkLocale, `/article/${localItem.slug}`)
            : null;
    const quizDetailHref =
        isQuiz && localItem.slug
            ? withLocale(articleLinkLocale, `/quiz/${localItem.slug}`)
            : null;

    const articleFeedPreview = useMemo(
        () => (isArticle && localItem.body ? htmlToFeedPreview(localItem.body, 320) : { text: '', truncated: false }),
        [isArticle, localItem.body]
    );

    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showComments, setShowComments] = useState(true);
    const [showQuizModal, setShowQuizModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(item.is_liked || false);

    // Quiz Enhancement States
    const [reviewData, setReviewData] = useState(null);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);

    const commentInputRef = React.useRef(null);

    const handleCommentAction = () => {
        setShowComments(true);
        // Focus the input
        setTimeout(() => {
            commentInputRef.current?.focus();
        }, 50);
    };

    // Determine type string for API
    const typeStr = isQuiz ? 'quiz' : 'article';

    // Helper to refresh just this item interactively
    const refreshItem = async () => {
        try {
            const identifier =
                typeStr === 'article' && localItem.slug
                    ? localItem.slug
                    : isQuiz && localItem.slug
                      ? localItem.slug
                      : localItem.id;
            const endpoint = `/content/${typeStr === 'quiz' ? 'quizzes' : 'articles'}/${identifier}/`;
            const { data } = await api.get(endpoint);

            setLocalItem(data);
            if (data.likes_count !== undefined) setLikesCount(data.likes_count);
            return data;
        } catch (err) {
            console.error("Failed to refresh item", err);
            return null;
        }
    };

    const handleShare = () => {
        let path;
        if (isArticle && localItem.slug && articleHref) {
            path = articleHref;
        } else if (isQuiz && localItem.slug && quizDetailHref) {
            path = quizDetailHref;
        } else {
            path = `/post/${typeStr}/${localItem.id}`;
        }
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url);
        toast.info(t('feed_item.toast.link_copied'));
    };

    const handleLike = async () => {
        if (!user) {
            toast.error(t('feed_item.toast.login_like'));
            return;
        }
        // Optimistic State Update
        const previousState = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousState);
        setLikesCount(prev => previousState ? Math.max(0, prev - 1) : prev + 1);

        try {
            await api.post('/interactions/likes/toggle/', {
                model: typeStr,
                object_id: localItem.id
            });
            await refreshItem();
        } catch (err) {
            console.error(err);
            // Revert
            setIsLiked(previousState);
            setLikesCount(previousCount);
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
                model: typeStr,
                object_id: localItem.id,
                text: commentText
            });
            setCommentText('');
            toast.success(t('feed_item.toast.comment_posted'));
            setCommentsCount(prev => prev + 1);
            await refreshItem();
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_comment'));
        }
    };

    const handleStartQuiz = () => {
        if (!user) {
            toast.error(t('feed_item.toast.login_participate'));
            return;
        }
        setReviewData(null);
        setShowQuizModal(true);
    };

    const handleViewQuizResults = async () => {
        if (!user || !localItem.slug) return;
        try {
            const { data } = await content.getQuizResult(localItem.slug);
            setReviewData(data);
            setShowQuizModal(true);
        } catch (e) {
            console.error(e);
            toast.error(t('feed_item.toast.failed_load_result'));
        }
    };



    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // ...

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (isArticle) await content.deleteArticle(localItem.slug);
            else if (isQuiz) {
                if (!localItem.slug) {
                    toast.error(t('common.operation_failed', { defaultValue: 'Əməliyyat uğursuz' }));
                    return;
                }
                await content.deleteQuiz(localItem.slug);
            }

            toast.success(t('feed_item.toast.deleted'));
            setShowDeleteModal(false);
            if (onDelete) onDelete(localItem.id);
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_delete'));
        }
    };


    return (
        <div className={styles.feedItem}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    {localItem.author ? (
                        <Link href={userPublicHref(localItem.author)} className={styles.avatar}>
                            <Avatar user={{ username: localItem.author, avatar: localItem.author_avatar, avatar_compressed: localItem.author_avatar_compressed }} size={32} />
                        </Link>
                    ) : (
                        <div className={styles.avatar}>
                            <Avatar user={{ username: t('feed_item.unknown_user') }} size={32} />
                        </div>
                    )}
                    <div className={styles.meta}>
                        {localItem.author ? (
                            <Link href={userPublicHref(localItem.author)} className={styles.username} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {localItem.author}
                            </Link>
                        ) : (
                            <div className={styles.username}>{t('feed_item.unknown_user')}</div>
                        )}
                        <div className={styles.date}>{formatDate(localItem.created_at, i18n.language)}</div>
                        {labelForSubCategory(localItem.sub_category, i18n.language) ? (
                            <div className={styles.profession}>{labelForSubCategory(localItem.sub_category, i18n.language)}</div>
                        ) : null}
                    </div>
                </div>
                {user?.username === localItem.author && (
                    <div style={{ position: 'relative' }}>
                        <button className={styles.moreBtn} onClick={() => setShowMenu(!showMenu)}>
                            <MoreHorizontal size={20} color="#999" />
                        </button>
                        {showMenu && (
                            <div className={styles.dropdownMenu} style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px' }}>
                                {isArticle && (
                                    <button
                                        onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#333' }}
                                    >
                                        <Edit2 size={16} /> {t('common.edit')}
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowMenu(false); handleDeleteClick(); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'red' }}
                                >
                                    <Trash2 size={16} /> {t('common.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Content Body */}
            <div className={styles.contentBody}>
                {isArticle && (
                    <>
                        {localItem.image && articleHref && (
                            <Link href={articleHref} className={styles.coverImage}>
                                <img src={localItem.image} alt="Cover" />
                            </Link>
                        )}
                        <h3>
                            <Link href={articleHref || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {localItem.title}
                            </Link>
                        </h3>

                        <p className={styles.articlePreview}>{articleFeedPreview.text}</p>
                        {articleFeedPreview.truncated && (
                            <Link href={articleHref || '#'} className={styles.readMore}>
                                {t('feed_item.view_more')}
                            </Link>
                        )}
                    </>
                )}

                {isQuiz && (
                    <div className={styles.quizCard}>
                        <h3>
                            {quizDetailHref ? (
                                <Link href={quizDetailHref} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {localItem.title}
                                </Link>
                            ) : (
                                localItem.title
                            )}
                        </h3>
                        {labelForSubCategory(localItem.sub_category, i18n.language) ? (
                            <div className={styles.quizProfession}>{labelForSubCategory(localItem.sub_category, i18n.language)}</div>
                        ) : null}
                        <p>
                            {localItem.questions.length} {t('feed_item.questions_count')} • {localItem.participation_count || 0}{' '}
                            {t('feed_item.participants_count')}
                            {localItem.my_attempt_count > 1 ? (
                                <span>
                                    {' '}
                                    · {localItem.my_attempt_count} {t('feed_item.my_attempts_short')}
                                </span>
                            ) : null}
                        </p>
                        <div className={styles.quizActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                            <Button type="primary" icon={<PlayCircle size={16} />} onClick={handleStartQuiz}>
                                {localItem.is_participated ? t('feed_item.retake_quiz') : t('feed_item.start_quiz')}
                            </Button>
                            {localItem.is_participated ? (
                                <Button icon={<CheckCircle size={16} />} onClick={handleViewQuizResults}>
                                    {t('feed_item.view_results')}
                                </Button>
                            ) : null}
                            {user?.username === localItem.author && (
                                <Button type="default" onClick={() => setShowParticipantsModal(true)}>
                                    {t('feed_item.view_participants')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}


            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <span onClick={() => setShowLikesModal(true)}>{likesCount} {t('feed_item.likes')}</span>
                <span>{commentsCount} {t('feed_item.comments')}</span>
            </div>

            {/* Footer Actions */}
            <div className={styles.footerActions}>
                <div className={styles.actionGroup}>
                    <button onClick={handleLike} className={isLiked ? styles.active : ''}>
                        <Heart size={18} fill={isLiked ? "#1890ff" : "none"} />
                        <span>{t('feed_item.like_action')}</span>
                    </button>

                    <button
                        onClick={handleCommentAction}
                    >
                        <MessageCircle size={18} />
                        <span>{t('feed_item.comment_action')}</span>
                    </button>
                </div>

                <button onClick={handleShare}>
                    <Share2 size={18} />
                </button>
            </div>

            {/* Persistent Input */}
            <div className={styles.commentInput}>
                <div className={styles.avatar}>
                    <Avatar user={user} size={32} />
                </div>
                <div className={styles.inputWrapper}>
                    <input
                        ref={commentInputRef}
                        type="text"
                        placeholder={t('feed_item.write_comment')}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    />
                    <button onClick={handlePostComment}>
                        <Send size={16} />
                    </button>
                </div>
            </div>


            {/* Interactions */}
            <LikesModal
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
                contentType={typeStr}
                objectId={localItem.id}
            />

            <QuizModal
                isOpen={showQuizModal}
                onClose={() => {
                    setShowQuizModal(false);
                    setReviewData(null); // Clear review data on close
                }}
                quiz={isQuiz ? (reviewData || localItem) : null}
                reviewMode={!!reviewData}
                onSuccess={async () => {
                    const data = await refreshItem();
                    if (data && isQuiz) onFeedItemRefresh?.({ ...data, type: 'quiz' });
                }}
            />

            <ParticipantsListModal
                isOpen={showParticipantsModal}
                onClose={async () => {
                    setShowParticipantsModal(false);
                    const data = await refreshItem();
                    if (data && isQuiz) onFeedItemRefresh?.({ ...data, type: 'quiz' });
                }}
                quizSlug={localItem.slug}
                onSelectParticipant={async (userId) => {
                    try {
                        const { data } = await content.getQuizParticipantResult(localItem.slug, userId);
                        setReviewData(data);
                        setShowParticipantsModal(false);
                        setShowQuizModal(true);
                    } catch (e) {
                        console.error(e);
                        toast.error("Failed to load participant result");
                    }
                }}
            />

            <EditArticleModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                article={isArticle ? localItem : null}
                onSuccess={(updatedData) => {
                    setLocalItem(prev => ({ ...prev, ...updatedData }));
                }}
            />

            {/* Interactions */}
            {showComments && (
                <CommentsSection
                    contentType={typeStr}
                    objectId={localItem.id}
                    refreshTrigger={commentsCount} // Allow refreshing when count changes
                />
            )}



            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('profile.modals.delete_title')}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button type="default" onClick={() => setShowDeleteModal(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="primary" danger onClick={handleDeleteConfirm}>
                            {t('common.delete')}
                        </Button>
                    </div>
                }
            >
                <p>{t('feed_item.toast.delete_confirm')}</p>
            </Modal>

        </div >
    );
};

export default FeedItem;
