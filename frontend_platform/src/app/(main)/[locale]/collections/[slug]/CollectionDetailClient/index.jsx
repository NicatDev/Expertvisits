'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { content } from '@/lib/api';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import articleStyles from '../../../article/[slug]/style.module.scss';
import styles from './style.module.scss';

export default function CollectionDetailClient({ slug }) {
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const locale = localeFromPathname(pathname) || defaultLocale;
    const router = useRouter();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await content.getCollection(slug);
                if (!cancelled) setCollection(data);
            } catch (e) {
                console.error(e);
                if (!cancelled) setCollection(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (loading) {
        return (
            <div className={styles.pageShell}>
                <div className={styles.loadingWrap}>{t('common.loading')}</div>
            </div>
        );
    }
    if (!collection) {
        return (
            <div className={styles.pageShell}>
                <div className={styles.loadingWrap}>{t('common.error_generic')}</div>
            </div>
        );
    }

    const items = (collection.items || []).filter((it) => it?.slug && it?.content_type);

    return (
        <div className={styles.pageShell}>
            <article className={articleStyles.container}>
                <button
                    type="button"
                    className={`${articleStyles.backBtn} ${styles.backBtnNative}`}
                    onClick={() => router.back()}
                >
                    <ChevronLeft size={20} />
                    <span>{t('auth_page.back')}</span>
                </button>

                <header className={articleStyles.header}>
                    <div className={articleStyles.metaWrapper}>
                        <div className={articleStyles.info}>
                            <span className={articleStyles.date}>
                                {t('collections_page.items_count', { count: collection.item_count || 0 })}
                            </span>
                            <span className={articleStyles.dot}>•</span>
                            <span className={articleStyles.date}>
                                {t('collections_page.views_count', { count: collection.view_count || 0 })}
                            </span>
                        </div>
                    </div>

                    <h1 className={articleStyles.title}>{collection.title}</h1>
                    <div className={articleStyles.divider} />
                </header>

                <p className={styles.summary}>{collection.summary || t('collections_page.no_summary')}</p>

                <section className={styles.itemsSection} aria-labelledby="collection-items-heading">
                    <h2 id="collection-items-heading" className={styles.sectionHeading}>
                        {t('collections_page.collection_content')}
                    </h2>
                    {items.length === 0 ? (
                        <p className={styles.emptyItems}>{t('collections_page.empty_items')}</p>
                    ) : (
                        <ul className={styles.itemList}>
                            {items.map((it) => {
                                const href =
                                    it.content_type === 'article'
                                        ? withLocale(locale, `/article/${it.slug}`)
                                        : withLocale(locale, `/quiz/${it.slug}`);
                                return (
                                    <li key={it.id}>
                                        <Link href={href} className={styles.item}>
                                            <span className={styles.iconWrap} aria-hidden>
                                                {it.content_type === 'article' ? (
                                                    <FileText size={20} />
                                                ) : (
                                                    <ClipboardCheck size={20} />
                                                )}
                                            </span>
                                            <div className={styles.itemBody}>
                                                <span className={styles.type}>
                                                    {it.content_type === 'article'
                                                        ? t('feed.article')
                                                        : t('feed.quiz')}
                                                </span>
                                                <span className={styles.itemTitle}>{it.title}</span>
                                            </div>
                                            <span className={styles.itemArrow} aria-hidden>
                                                <ArrowUpRight size={18} />
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </article>
        </div>
    );
}
