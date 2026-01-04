import React, { useState } from 'react';
import Button from '../../ui/Button';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Send, User, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import LikesModal from '../LikesModal';
import CommentsSection from '../CommentsSection';
import QuizModal from '../QuizModal';
import SurveyModal from '../SurveyModal';
import CreateContentModal from '../CreateContentModal';
import api from '@/lib/api/client';
import { content } from '@/lib/api'; // Ensure content API is imported
import { useAuth } from '@/lib/contexts/AuthContext';
import styles from './style.module.scss'; // Import SCSS Module

const FeedItem = ({ item, onDelete }) => {
    const { user } = useAuth();
    // Basic detection of type based on fields
    const isArticle = item.body !== undefined;
    const isQuiz = item.questions !== undefined;
    const isSurvey = item.question !== undefined && item.sub_category !== undefined; // survey has 'question' field

    // Local state but initialized from props.
    const [likesCount, setLikesCount] = useState(item.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);

    // We update this 'localItem' when we refresh data
    const [localItem, setLocalItem] = useState(item);

    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(item.is_liked || false);

    // Determine type string for API
    const typeStr = isQuiz ? 'quiz' : (isSurvey ? 'survey' : 'article');

    // Helper to refresh just this item interactively
    const refreshItem = async () => {
        try {
            const headers = { params: { type: typeStr } };
            // ArticleViewSet uses lookup_field = 'slug', others use 'id'
            const identifier = (typeStr === 'article' && item.slug) ? item.slug : item.id;
            const endpoint = `/content/${typeStr === 'survey' ? 'surveys' : (typeStr === 'quiz' ? 'quizzes' : 'articles')}/${identifier}/`;
            const { data } = await api.get(endpoint);

            setLocalItem(data);
            if (data.likes_count !== undefined) setLikesCount(data.likes_count);
            // participation updates automatically via localItem state
        } catch (err) {
            console.error("Failed to refresh item", err);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/post/${typeStr}/${item.id}`;
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
                object_id: item.id
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
            toast.error("Please login to comment");
            return;
        }
        if (!commentText.trim()) return;

        try {
            await api.post('/interactions/comments/', {
                model: typeStr,
                object_id: item.id,
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

    const handleStartSurvey = () => {
        if (!user) {
            toast.error("Please login to participate");
            return;
        }
        if (localItem.is_participated) {
            toast.info("You have already participated in this survey.");
            return;
        }
        setShowSurveyModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this content?")) return;
        try {
            if (isArticle) await content.deleteArticle(item.slug);
            else if (isQuiz) await content.deleteQuiz(item.id);
            else if (isSurvey) await content.deleteSurvey(item.id);

            toast.success("Content deleted.");
            if (onDelete) onDelete(item.id);
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
                    {item.author ? (
                        <Link href={`/user/${item.author}`} className={styles.avatar}>
                            <User size={24} color="#999" />
                        </Link>
                    ) : (
                        <div className={styles.avatar}>
                            <User size={24} color="#999" />
                        </div>
                    )}
                    <div className={styles.meta}>
                        {item.author ? (
                            <Link href={`/user/${item.author}`} className={styles.username} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {item.author}
                            </Link>
                        ) : (
                            <div className={styles.username}>Unknown User</div>
                        )}
                        <div className={styles.date}>{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                {user?.username === item.author && (
                    <div style={{ position: 'relative' }}>
                        <button className={styles.moreBtn} onClick={() => setShowMenu(!showMenu)}>
                            <MoreHorizontal size={20} color="#999" />
                        </button>
                        {showMenu && (
                            <div className={styles.dropdownMenu} style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px' }}>
                                <button
                                    onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#333' }}
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
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
                {user?.username !== item.author && <button className={styles.moreBtn}><MoreHorizontal size={20} color="#999" /></button>}
            </div>

            {/* Content Body */}
            <div className={styles.contentBody}>
                {isArticle && (
                    <>
                        {item.image && (
                            <Link href={`/article/${item.slug}`} className={styles.coverImage}>
                                <img src={item.image} alt="Cover" />
                            </Link>
                        )}
                        <h3>
                            <Link href={`/article/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {item.title}
                            </Link>
                        </h3>
                        <p>
                            {item.body.length > 250 ? (
                                <>
                                    {item.body.substring(0, 250)}...
                                    <Link href={`/article/${item.slug}`} style={{ color: '#1890ff', marginLeft: '6px', fontWeight: '500' }}>
                                        View more
                                    </Link>
                                </>
                            ) : item.body}
                        </p>
                    </>
                )}

                {isQuiz && (
                    <div className={styles.quizCard}>
                        <h3>{item.title}</h3>
                        <p>
                            {item.questions.length} Questions • {localItem.participation_count || 0} Participants
                        </p>
                        {localItem.is_participated ? (
                            <Button disabled icon={<CheckCircle size={16} />}>Completed</Button>
                        ) : (
                            <Button type="primary" icon={<PlayCircle size={16} />} onClick={handleStartQuiz}>Start Quiz</Button>
                        )}
                    </div>
                )}

                {isSurvey && (
                    <div className={styles.surveyCard}>
                        <h4>Survey</h4>
                        <p className={styles.question}>{item.question}</p>

                        {localItem.is_participated ? (
                            <Button disabled icon={<CheckCircle size={16} />}>Submitted</Button>
                        ) : (
                            <Button type="primary" onClick={handleStartSurvey}>Participate</Button>
                        )}

                        <div className={styles.participants}>
                            {localItem.participation_count || 0} Participants
                        </div>
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
                objectId={item.id}
            />

            <QuizModal
                isOpen={showQuizModal}
                onClose={() => setShowQuizModal(false)}
                quiz={isQuiz ? item : null}
                onSuccess={() => refreshItem()}
            />

            <SurveyModal
                isOpen={showSurveyModal}
                onClose={() => setShowSurveyModal(false)}
                onSuccess={() => refreshItem()}
            />

            <CreateContentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => { refreshItem(); toast.success("Content updated"); }}
                initialData={item}
                initialType={typeStr}
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
                objectId={item.id}
                refreshTrigger={localItem.comments_count}
                onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            // Pass styles or use its own? CommentsSection uses its own inline for now, 
            // ideally refactor that too.
            />

        </div >
    );
};

export default FeedItem;
