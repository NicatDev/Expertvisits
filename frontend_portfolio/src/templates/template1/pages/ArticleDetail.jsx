"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User as UserIcon, Tag } from 'lucide-react';
import { getArticleDetail } from '@/lib/api/portfolio';
import t1Styles from '../styles/template1.module.scss';
import styles from '../styles/article-detail.module.scss';

export default function ArticleDetail({ user, slug }) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await getArticleDetail(slug);
                setArticle(response.data);
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
            <div className={t1Styles.pageContainer}>
                <div className={styles.loadingState}>Loading article...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className={t1Styles.pageContainer}>
                <div className={styles.emptyState}>Article not found.</div>
            </div>
        );
    }

    const createMarkup = (htmlContent) => {
        return { __html: htmlContent };
    };

    return (
        <article className={styles.articlePage}>
            {/* Hero Header */}
            <header className={styles.articleHeader}>
                <div className={styles.headerContainer}>
                    <Link href={`/${user.username}/articles`} className={styles.backLink}>
                        <ArrowLeft size={16} /> Back to Articles
                    </Link>

                    <h1 className={styles.title}>{article.title}</h1>
                    
                    <div className={styles.metaInfo}>
                        <span className={styles.metaItem}>
                            <UserIcon size={16} />
                            {article.author.first_name || article.author.username}
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
                </div>
            </header>

            {/* Thumbnail Image */}
            {article.thumbnail && (
                <div className={styles.thumbnailContainer}>
                    <img src={article.thumbnail} alt={article.title} className={styles.mainImage} />
                </div>
            )}

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
