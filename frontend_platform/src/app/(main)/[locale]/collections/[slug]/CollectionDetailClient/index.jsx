'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { content } from '@/lib/api';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
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

    if (loading) return <div className={styles.page}>{t('common.loading')}</div>;
    if (!collection) return <div className={styles.page}>{t('common.error_generic')}</div>;

    return (
        <div className={styles.page}>
            <button type="button" className={styles.backBtn} onClick={() => router.back()}>
                <ChevronLeft size={18} />
                {t('auth_page.back')}
            </button>

            <article className={styles.card}>
                <h1>{collection.title}</h1>
                <p className={styles.summary}>{collection.summary || t('collections_page.no_summary')}</p>
                <div className={styles.meta}>
                    <span>{t('collections_page.items_count', { count: collection.item_count || 0 })}</span>
                    <span>{t('collections_page.views_count', { count: collection.view_count || 0 })}</span>
                </div>

                <h2>{t('collections_page.collection_content')}</h2>
                <div className={styles.items}>
                    {(collection.items || []).map((it) => {
                        const href =
                            it.content_type === 'article'
                                ? withLocale(locale, `/article/${it.slug}`)
                                : withLocale(locale, `/quiz/${it.slug}`);
                        return (
                            <Link href={href} key={it.id} className={styles.item}>
                                <span className={styles.type}>{it.content_type}</span>
                                <span className={styles.title}>{it.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </article>
        </div>
    );
}

