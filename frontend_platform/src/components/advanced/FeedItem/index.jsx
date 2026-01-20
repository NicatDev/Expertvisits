import React, { useState } from 'react';
import Button from '../../ui/Button';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Send, User, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import LikesModal from '../LikesModal';
import CommentsSection from '../CommentsSection';
import QuizModal from '../QuizModal';

import CreateContentModal from '../CreateContentModal';
import api from '@/lib/api/client';
import { content } from '@/lib/api'; // Ensure content API is imported
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss'; // Import SCSS Module
import EditArticleModal from '../EditArticleModal';

const FeedItem = ({ item, onDelete }) => {
    const { user } = useAuth();



    // Local state but initialized from props.
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);

    // We update this 'localItem' when we refresh data
    const [localItem, setLocalItem] = useState(item);

    // Basic detection of type based on fields
    const isArticle = localItem.body !== undefined;
    const isQuiz = localItem.questions !== undefined;

    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(item.is_liked || false);

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
        const url = `${window.location.origin}/post/${typeStr}/${localItem.id}`;
        navigator.clipboard.writeText(url);
        toast.info('Link copied to clipboard!');
    };

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like");
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
            toast.error("Failed to like");
        }
    };

    const handlePostComment = async () => {
        if (!user) {
            setCommentText('');
            toast.error("Please login to comment");
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
            toast.success("Comment posted!");
            setCommentsCount(prev => prev + 1);
            await refreshItem();
        } catch (err) {
            console.error(err);
            toast.error("Failed to post comment");
        }
    };

    const handleStartQuiz = () => {
        if (!user) {
            toast.error("Please login to participate");
            return;
        }
        if (localItem.is_participated) {
            toast.info("You have already participated in this quiz.");
            return;
        }
        setShowQuizModal(true);
    };



    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this content?")) return;
        try {
            if (isArticle) await content.deleteArticle(localItem.slug);
            else if (isQuiz) await content.deleteQuiz(localItem.id);


            toast.success("Content deleted.");
            if (onDelete) onDelete(localItem.id);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete.");
        }
    };

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
                            <div className={styles.username}>Unknown User</div>
                        )}
                        <div className={styles.date}>{new Date(localItem.created_at).toLocaleDateString()}</div>
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
                                        <Edit2 size={16} /> Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowMenu(false); handleDelete(); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'red' }}
                                >
                                    <Trash2 size={16} /> Delete
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
                        <p>
                            {localItem.body.length > 250 ? (
                                <>
                                    {localItem.body.substring(0, 250)}...
                                    <Link href={`/article/${localItem.slug}`} style={{ color: '#1890ff', marginLeft: '6px', fontWeight: '500' }}>
                                        View more
                                    </Link>
                                </>
                            ) : localItem.body}
                        </p>
                    </>
                )}

                {isQuiz && (
                    <div className={styles.quizCard}>
                        <h3>{localItem.title}</h3>
                        <p>
                            {localItem.questions.length} Questions • {localItem.participation_count || 0} Participants
                        </p>
                        {localItem.is_participated ? (
                            <Button disabled icon={<CheckCircle size={16} />}>Completed</Button>
                        ) : (
                            <Button type="primary" icon={<PlayCircle size={16} />} onClick={handleStartQuiz}>Start Quiz</Button>
                        )}
                    </div>
                )}


            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <span onClick={() => setShowLikesModal(true)}>{likesCount} Likes</span>
                <span>{commentsCount} Comments</span>
            </div>

            {/* Footer Actions */}
            <div className={styles.footerActions}>
                <div className={styles.actionGroup}>
                    <button onClick={handleLike} className={isLiked ? styles.active : ''}>
                        <Heart size={18} fill={isLiked ? "#1890ff" : "none"} />
                        <span>Like</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle size={18} />
                        <span>Comment</span>
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
                        type="text"
                        placeholder="Write a comment..."
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
                onClose={() => setShowQuizModal(false)}
                quiz={isQuiz ? item : null}
                onSuccess={() => refreshItem()}
            />

            <EditArticleModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                article={isArticle ? localItem : null}
                onSuccess={(updatedData) => {
                    setLocalItem(prev => ({ ...prev, ...updatedData }));
                }}
            />

            {/* Always rendered but controlled by internal state if necessary, 
                actually CommentsSection fetches on mount. 
                Optimized: Only mount if showComments OR we want to prefetch? 
                User logic was "click to expand".
                But we have "Latest comment" which is static.
                Let's keep it mounted if we want to show it below, or just mount on click. 
                Wait, current logic in index.jsx has it always there? 
                No, logic was {showComments && ...} but user requested specific behavior. 
                I'll stick to mount on showComments for performance.
            */}

            <CommentsSection
                contentType={typeStr}
                objectId={localItem.id}
                refreshTrigger={localItem.comments_count}
                onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            // Pass styles or use its own? CommentsSection uses its own inline for now, 
            // ideally refactor that too.
            />

        </div >
    );
};

export default FeedItem;
