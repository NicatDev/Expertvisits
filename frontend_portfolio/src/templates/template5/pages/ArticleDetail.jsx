"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Clock, ArrowLeft, Shield, Share2, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { getArticleDetail, getArticles } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/articles.module.scss';

export default function ArticleDetail({ user, slug }) {
    const { t } = useTranslation();
    const [article, setArticle] = useState(null);
    const [recentArticles, setRecentArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    
    const profile = user?.user || {};
    const username = profile.username;
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || username;

    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            if (!username || !slug) return;
            setLoading(true);
            try {
                const [articleRes, recentRes] = await Promise.all([
                    getArticleDetail(username, slug),
                    getArticles({ username, page_size: 5 })
                ]);
                setArticle(articleRes);
                setRecentArticles(recentRes?.results || []);
            } catch (error) {
                console.error("Failed to fetch article detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [username, slug]);

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className={styles.detailBase}>
                <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <p>{t('portfolio.loadingArticle')}</p>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className={styles.detailBase}>
                <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <p>{t('portfolio.articleNotFound')}</p>
                    <Link href={`/${username}/articles`} className={styles.backBtn}>{t('portfolio.backToArticles')}</Link>
                </div>
            </div>
        );
    }

    return (
        <article className={styles.detailBase}>
            <div className={styles.container}>
                <Link href={`/${username}/articles`} className={styles.backBtn}>
                    <ArrowLeft size={16} /> {t('portfolio.backToArticles')}
                </Link>

                <div className={styles.articleLayout}>
                    <div className={styles.mainContentDetail}>
                        <div className={styles.articleHeader}>
                            <span className={styles.categoryBadge}>{t('feed.article')}</span>
                            <h1>{article.title}</h1>
                            <div className={styles.meta}>
                                <div className={styles.item}><Calendar size={18} /> {new Date(article.created_at).toLocaleDateString()}</div>
                                <div className={styles.item}><Clock size={18} /> {article.reading_time || '5'} {t('portfolio.minRead') || 'dəq'}</div>
                            </div>
                        </div>

                        {article.image && (
                            <div className={styles.heroImageDetail}>
                                <img src={article.image} alt={article.title} />
                            </div>
                        )}

                        <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: article.body }} />
                        
                        <div className={styles.articleFooter}>
                           <div className={styles.tags}>
                               <span>#Təbabət</span>
                               <span>#Səhiyyə</span>
                               <span>#Sağlamlıq</span>
                           </div>
                           <div className={styles.shareRow}>
                               <span>{t('portfolio.shareThis')}:</span>
                               <div className={styles.shareIcons}>
                                   <Share2 size={20} />
                                   <LinkIcon size={20} />
                               </div>
                           </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.sidebarWidget}>
                            <h4>{t('portfolio.author')}</h4>
                            <div className={styles.authorCard}>
                                <div className={styles.authorAvatar}>
                                    {profile.avatar && <img src={profile.avatar} alt={fullName} />}
                                </div>
                                <h5>{fullName}</h5>
                                <p>{profile.profession_sub_category?.profession || 'Specialist'}</p>
                                <p className={styles.shortBio}>{profile.summary?.substring(0, 80)}...</p>
                            </div>
                        </div>

                        {recentArticles && recentArticles.length > 0 && (
                            <div className={styles.sidebarWidget}>
                                <h4>{t('portfolio.recentPosts')}</h4>
                                <div className={styles.recentList}>
                                    {recentArticles.filter(a => a.id !== article.id).slice(0, 4).map((recent, idx) => (
                                        <Link 
                                            key={recent.id || idx} 
                                            href={`/${username}/articles/${recent.slug || recent.id}`}
                                            className={styles.recentItem}
                                        >
                                            <h6>{recent.title}</h6>
                                            <span>{new Date(recent.created_at).toLocaleDateString()}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </article>
    );
}
