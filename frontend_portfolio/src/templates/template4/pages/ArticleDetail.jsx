"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User as UserIcon, Tag } from 'lucide-react';
import { getArticleDetail } from '@/lib/api/portfolio';
import { useTranslation } from '@/i18n/client';
import t4Styles from '../styles/template4.module.scss';
import styles from '../styles/article-detail.module.scss';

export default function ArticleDetail({ user, slug }) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const passedUsername = user?.user?.username || user?.username;
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchArticle = async () => {
            try {
                const passedUsername = user?.user?.username || user?.username;
                if (!passedUsername) return;
                
                const response = await getArticleDetail(passedUsername, slug);
                setArticle(response);
            } catch (error) {
                console.error("Failed to fetch article", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [slug]);

    if (loading) {
        return (
            <div style={{ padding: '40px' }}>
                <div className={styles.loadingState}>{t('portfolio.loadingArticle')}</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div style={{ padding: '40px' }}>
                <div className={styles.emptyState}>{t('portfolio.articleNotFound')}</div>
            </div>
        );
    }

    const createMarkup = (htmlContent) => {
        return { __html: htmlContent };
    };

    if (!isMounted) return null;

    return (
        <article className={styles.articlePage}>
            {/* Hero Header */}
            <header className={styles.articleHeader}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.title}>{article.title}</h1>
                    
                    <div className={styles.metaInfo}>
                        <span className={styles.metaItem}>
                            <UserIcon size={16} />
                            {article.author?.first_name || article.author?.username || user?.username}
                        </span>
                        <span className={styles.metaItem}>
                            <Calendar size={16} />
                            {new Date(article.created_at).toLocaleDateString()}
                        </span>
                        {article.category && (
                            <span className={styles.metaItem}>
                                <Tag size={16} />
                                {article.category.name}
                            </span>
                        )}
                    </div>

                    {/* Thumbnail Image */}
                    {article.image && (
                        <div className={styles.thumbnailContainer}>
                            <img src={article.image} alt={article.title} className={styles.mainImage} />
                        </div>
                    )}
                </div>
            </header>

            {/* Article Content */}
            <div className={styles.contentContainer}>
                <div 
                    className={styles.articleBody}
                    dangerouslySetInnerHTML={createMarkup(article.body)}
                />

                {article.tags && article.tags.length > 0 && (
                    <div className={styles.tagsContainer}>
                        {article.tags.map(tag => (
                            <span key={tag.id} className={styles.tagPill}>
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
