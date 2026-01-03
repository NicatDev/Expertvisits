"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api/client';
import { ChevronLeft, Send, Heart, MessageCircle, User } from 'lucide-react';
import styles from './style.module.scss';
import CommentsSection from '@/components/advanced/CommentsSection';
import LikesModal from '@/components/advanced/LikesModal';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ClientPage() {
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
        } catch (err) {
            console.error(err);
            toast.error("Failed to load article");
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like");
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
                model: 'article',
                object_id: article.id,
                text: commentText
            });
            setCommentText(''); // Clear input
            toast.success("Comment posted!");
            setRefreshCommentsTrigger(prev => prev + 1); // Trigger refresh in CommentsSection
            setArticle(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to post comment");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    if (!article) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Article not found.</div>;

    const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
            <div className={styles.container}>
                <div className={styles.backBtn} onClick={() => router.back()}>
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </div>

                <header className={styles.header}>
                    <h1>{article.title}</h1>
                    <div className={styles.meta}>
                        <div className={styles.avatar}>
                            <User size={24} color="#666" />
                        </div>
                        <div className={styles.info}>
                            <span className={styles.author}>{article.author}</span>
                            <span className={styles.date}>{formattedDate}</span>
                        </div>
                    </div>
                </header>

                {article.image && (
                    <div className={styles.coverImage}>
                        <img src={article.image} alt={article.title} />
                    </div>
                )}

                <div className={styles.body}>
                    {article.body}
                </div>

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
                            <span>{article.likes_count || 0} Likes</span>
                        </button>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#666' }}>
                            <MessageCircle size={20} />
                            <span>{article.comments_count || 0} Comments</span>
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className={styles.commentInput} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%' }} /> : <User size={20} color="#999" />}
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Write a comment..."
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
