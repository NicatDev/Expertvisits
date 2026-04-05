'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getArticles } from '@/lib/api/portfolio';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import { useTranslation } from '@/i18n/client';
import styles from './articlesHomePreview.module.scss';

export default function ArticlesHomePreview({ user }) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    const username = user?.user?.username || '';
    const allowed = v.articles_on_home && user?.articles_count >= 3;
    const showAllLink = allowed && v.articles_page;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!allowed || !username) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await getArticles({ username, page_size: 6 });
                const list = res?.results || [];
                if (!cancelled) setItems(list.slice(0, 6));
            } catch {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [allowed, username]);

    if (!allowed) return null;
    if (loading) return null;
    if (!items.length) return null;

    return (
        <section className={styles.section} aria-label={t('portfolio.articlesOnHomeTitle')}>
            <div className={styles.head}>
                <h2 className={styles.title}>{t('portfolio.articlesOnHomeTitle')}</h2>
                {showAllLink ? (
                    <Link href={`/${username}/articles`} className={styles.allLink}>
                        {t('portfolio.viewAllArticles')}
                    </Link>
                ) : null}
            </div>
            <div className={styles.grid}>
                {items.map((article) => {
                    const plain =
                        article.body?.replace(/(<([^>]+)>)/gi, '').substring(0, 100) || '';
                    return (
                        <Link
                            key={article.id}
                            href={`/${username}/articles/${article.slug}`}
                            className={styles.card}
                        >
                            {article.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={article.image}
                                    alt=""
                                    className={styles.thumb}
                                />
                            ) : (
                                <div className={styles.thumb} />
                            )}
                            <div className={styles.body}>
                                <h3 className={styles.cardTitle}>{article.title}</h3>
                                <p className={styles.excerpt}>{plain}…</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
