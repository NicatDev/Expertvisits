import React, { useState, useEffect } from 'react';
import api from '@/lib/api/client';
import Button from '../../ui/Button';
import { User } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

// Single Comment Item Component
const CommentItem = ({ comment, contentType, objectId, onReply, onLike, t }) => {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [visibleReplies, setVisibleReplies] = useState(1);

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        await onReply(comment.id, replyText);
        setReplyText('');
        setShowReplyBox(false);
        setVisibleReplies(prev => prev + 1); // Show the new reply
    };

    const displayedReplies = comment.replies ? comment.replies.slice(0, visibleReplies) : [];

    return (
        <div className={styles.commentItem}>
            <div className={styles.wrapper}>
                <div className={styles.avatar}>
                    {comment.user.avatar ? <img src={comment.user.avatar} /> : <User size={18} color="#999" />}
                </div>
                <div className={styles.content}>
                    <div className={styles.bubble}>
                        <div className={styles.username}>{comment.user.username}</div>
                        <div className={styles.text}>{comment.text}</div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button onClick={() => onLike(comment.id)} className={comment.is_liked ? styles.liked : ''}>
                            {t('comments.like_action')} {comment.likes_count > 0 && `(${comment.likes_count})`}
                        </button>
                        <button onClick={() => setShowReplyBox(!showReplyBox)}>
                            {t('comments.reply_action')}
                        </button>
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Reply Box */}
                    {showReplyBox && (
                        <div className={styles.replyBox}>
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`${t('comments.reply_placeholder')} ${comment.user.username}...`}
                            />
                            <Button size="small" onClick={handleSubmitReply}>{t('comments.post_btn')}</Button>
                        </div>
                    )}

                    {/* Nested Replies */}
                    {displayedReplies.length > 0 && (
                        <div className={styles.repliesContainer}>
                            {displayedReplies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    contentType={contentType}
                                    objectId={objectId}
                                    onReply={onReply}
                                    onLike={onLike}
                                    t={t}
                                />
                            ))}

                            {/* Nested View More */}
                            {comment.replies.length > visibleReplies && (
                                <button
                                    onClick={() => setVisibleReplies(prev => prev + 5)}
                                    className={styles.viewMoreReplies}
                                >
                                    {t('comments.view_more_replies')} ({comment.replies.length - visibleReplies})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function CommentsSection({ contentType, objectId, refreshTrigger, onCommentAdded }) {
    const { t } = useTranslation('common');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState(''); // Not used directly in UI as input is in FeedItem? Actually FeedItem calls API directly. But recursion needs this.
    const { user } = useAuth();
    const [visibleCount, setVisibleCount] = useState(1);

    // If refreshTrigger is passed (e.g. comment count from FeedItem), we can reload.
    // However, existing logic fetches on mount. 
    // FeedItem calls this component passing objectId.

    useEffect(() => {
        if (objectId) {
            fetchComments();
        }
    }, [contentType, objectId, refreshTrigger]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/interactions/comments/for_object/', {
                params: { model: contentType, object_id: objectId }
            });
            setComments(data);
        } catch (err) {
            console.error("Failed to load comments", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (parentId = null, text) => {
        if (!user) {
            setNewComment('');
            toast.error(t('comments.login_to_comment'));
            return;
        }

        try {
            await api.post('/interactions/comments/', {
                model: contentType,
                object_id: objectId,
                text: text,
                parent: parentId
            });

            if (onCommentAdded) onCommentAdded();
            fetchComments();
        } catch (err) {
            console.error(err);
            toast.error(t('comments.post_error'));
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!user) {
            toast.error(t('comments.login_to_like'));
            return;
        }

        // Helper to recursively update comments
        const updateCommentsRecursive = (list) => {
            return list.map(c => {
                if (c.id === commentId) {
                    const isLiked = c.is_liked;
                    return {
                        ...c,
                        is_liked: !isLiked,
                        likes_count: isLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
                    };
                }
                if (c.replies) {
                    return { ...c, replies: updateCommentsRecursive(c.replies) };
                }
                return c;
            });
        };

        // Optimistic Update
        setComments(current => updateCommentsRecursive(current));

        try {
            await api.post('/interactions/likes/toggle/', {
                model: 'comment',
                object_id: commentId
            });
        } catch (err) {
            console.error(err);
            toast.error(t('comments.like_error'));
            fetchComments();
        }
    };

    const displayedComments = comments.slice(0, visibleCount);

    const viewLess = () => {
        setVisibleCount(1);
    }

    return (
        (loading || comments.length > 0) && (<div className={styles.container}>
            {loading && comments.length === 0 ? <p>{t('comments.loading')}</p> : (
                <div>
                    {displayedComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            contentType={contentType}
                            objectId={objectId}
                            onReply={(parentId, text) => handlePostComment(parentId, text)}
                            onLike={handleLikeComment}
                            t={t}
                        />
                    ))}

                    {/* View More / Less */}
                    {comments.length > 1 && (
                        <div className={styles.viewControls}>
                            {visibleCount < comments.length && (
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 5)}
                                    className={styles.viewMore}
                                >
                                    {t('comments.view_more_comments')} ({comments.length - visibleCount})
                                </button>
                            )}
                            {visibleCount > 1 && (
                                <button
                                    onClick={() => viewLess()}
                                    className={styles.viewLess}
                                >
                                    {t('comments.view_less')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>)
    );
}
