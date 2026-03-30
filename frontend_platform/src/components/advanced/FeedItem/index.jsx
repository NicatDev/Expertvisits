import React, { useState } from 'react';
import Button from '../../ui/Button';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Send, User, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import LikesModal from '../LikesModal';
import CommentsSection from '../CommentsSection';
import QuizModal from '../QuizModal';
import api from '@/lib/api/client';
import { content } from '@/lib/api'; // Ensure content API is imported
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss'; // Import SCSS Module
import EditArticleModal from '../EditArticleModal';
import ParticipantsListModal from '../ParticipantsListModal';
import Modal from '../../ui/Modal';
import { useTranslation } from '@/i18n/client';
import { formatDate } from '@/lib/utils/date';
import PollCard from '../PollCard';

const FeedItem = ({ item, onDelete }) => {
    if (item.type === 'poll') {
        return <PollCard poll={item} />;
    }
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();



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
            const headers = { params: { type: typeStr } };
            // ArticleViewSet uses lookup_field = 'slug', others use 'id'
            const identifier = (typeStr === 'article' && localItem.slug) ? localItem.slug : localItem.id;
            const endpoint = `/content/${typeStr === 'quiz' ? 'quizzes' : 'articles'}/${identifier}/`;
            const { data } = await api.get(endpoint);

            setLocalItem(data);
            if (data.likes_count !== undefined) setLikesCount(data.likes_count);
            // participation updates automatically via localItem state
        } catch (err) {
            console.error("Failed to refresh item", err);
        }
    };

    const handleShare = () => {
        const url = isArticle && localItem.slug
            ? `${window.location.origin}/article/${localItem.slug}`
            : `${window.location.origin}/post/${typeStr}/${localItem.id}`;
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
        if (localItem.is_participated) {
            toast.info(t('feed_item.toast.already_participated'));
            return;
        }
        setShowQuizModal(true);
    };



    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // ...

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (isArticle) await content.deleteArticle(localItem.slug);
            else if (isQuiz) await content.deleteQuiz(localItem.id);

            toast.success(t('feed_item.toast.deleted'));
            setShowDeleteModal(false);
            if (onDelete) onDelete(localItem.id);
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_delete'));
        }
    };


    console.log(localItem)
    return (
        <div className={styles.feedItem}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    {localItem.author ? (
                        <Link href={`/user/${localItem.author}`} className={styles.avatar}>
                            {localItem.author_avatar ? (
                                <img src={localItem.author_avatar} alt={localItem.author} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <User size={24} color="#999" />
                            )}
                        </Link>
                    ) : (
                        <div className={styles.avatar}>
                            <User size={24} color="#999" />
                        </div>
                    )}
                    <div className={styles.meta}>
                        {localItem.author ? (
                            <Link href={`/user/${localItem.author}`} className={styles.username} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {localItem.author}
                            </Link>
                        ) : (
                            <div className={styles.username}>{t('feed_item.unknown_user')}</div>
                        )}
                        <div className={styles.date}>{formatDate(localItem.created_at, i18n.language)}</div>
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
                        {localItem.image && (
                            <Link href={`/article/${localItem.slug}`} className={styles.coverImage}>
                                <img src={localItem.image} alt="Cover" />
                            </Link>
                        )}
                        <h3>
                            <Link href={`/article/${localItem.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {localItem.title}
                            </Link>
                        </h3>

                        {/* Wait, directly setting innerHTML with truncated string is bad. 
                            Better to render a sanitized Div with limited height. 
                            Let's use a helper or just render full body with CSS line-clamp? 
                            If I render full body with CSS line clamp, it handles HTML better. 
                            But valid HTML structure might break flex/grid. 
                            Let's try rendering full body but constrained.
                        */}
                        <div
                            className={styles.articleBody}
                            dangerouslySetInnerHTML={{ __html: localItem.body }}
                        />
                        {localItem.body.length > 300 && (
                            <Link href={`/article/${localItem.slug}`} className={styles.readMore}>
                                {t('feed_item.view_more')}
                            </Link>
                        )}
                    </>
                )}

                {isQuiz && (
                    <div className={styles.quizCard}>
                        <h3>{localItem.title}</h3>
                        <p>
                            {localItem.questions.length} {t('feed_item.questions_count')} • {localItem.participation_count || 0} {t('feed_item.participants_count')}
                        </p>
                        <div className={styles.quizActions} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {localItem.is_participated ? (
                                <>
                                    <Button
                                        icon={<CheckCircle size={16} />}
                                        onClick={async () => {
                                            try {
                                                const { data } = await content.getQuizResult(localItem.id);
                                                setReviewData(data); // New state needed
                                                setShowQuizModal(true);
                                            } catch (e) {
                                                console.error(e);
                                                toast.error(t('feed_item.toast.failed_load_result'));
                                            }
                                        }}
                                    >
                                        {t('feed_item.view_results')}
                                    </Button>
                                </>
                            ) : (
                                <Button type="primary" icon={<PlayCircle size={16} />} onClick={handleStartQuiz}>{t('feed_item.start_quiz')}</Button>
                            )}

                            {user?.username === localItem.author && (
                                <Button
                                    variant="secondary" // Assuming variant exists or use style
                                    onClick={() => setShowParticipantsModal(true)} // New state needed
                                >
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
                    {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%' }} /> : <User size={20} color="#999" />}
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
                quiz={isQuiz ? (reviewData || item) : null} // Use reviewData if available (contains answers)
                reviewMode={!!reviewData}
                onSuccess={() => refreshItem()}
            />

            <ParticipantsListModal
                isOpen={showParticipantsModal}
                onClose={() => setShowParticipantsModal(false)}
                quizId={localItem.id}
                onSelectParticipant={async (userId) => {
                    try {
                        const { data } = await content.getQuizParticipantResult(localItem.id, userId);
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
