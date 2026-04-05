'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/client';
import { resolvePortfolioMediaUrl, isDarkPortfolioTemplate } from '@/lib/portfolioMedia';
import { truncateDescription } from '@/lib/portfolioText';
import PortfolioContentModal from './PortfolioContentModal';
import styles from './portfolioListPage.module.scss';

function formatItemDate(dateVal) {
    if (!dateVal) return '';
    try {
        const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
        if (Number.isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(dateVal);
    }
}

export default function PortfolioListPage({ user, mode }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [openItem, setOpenItem] = useState(null);

    const username = user?.user?.username || '';
    const templateId = user?.template_id;
    const dark = isDarkPortfolioTemplate(templateId);
    const isServices = mode === 'services';
    const items = isServices ? user?.services || [] : user?.projects || [];
    const title = isServices ? t('portfolio.servicesPageTitle') : t('portfolio.projectsPageTitle');
    const empty = isServices ? t('portfolio.emptyServicesPage') : t('portfolio.emptyProjectsPage');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => {
            const titleStr = (item.title || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            return titleStr.includes(q) || desc.includes(q);
        });
    }, [items, query]);

    const pageClass = `${styles.page} ${dark ? styles.pageDark : styles.pageLight}`;
    const gridClass = isServices ? styles.grid : styles.gridProjects;

    return (
        <div className={pageClass}>
            <div className={styles.inner}>
                <h1 className={styles.title}>{title}</h1>
                <input
                    type="search"
                    className={styles.search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                        isServices
                            ? t('portfolio.searchServicesPlaceholder')
                            : t('portfolio.searchProjectsPlaceholder')
                    }
                    aria-label={t('portfolio.search')}
                />

                {items.length === 0 ? (
                    <p className={styles.empty}>{empty}</p>
                ) : filtered.length === 0 ? (
                    <p className={styles.empty}>{t('portfolio.noSearchResults')}</p>
                ) : (
                    <div className={gridClass}>
                        {filtered.map((item) => {
                            const { excerpt, needsMore, full } = truncateDescription(item.description);
                            const descShown = needsMore ? excerpt : full;
                            return (
                                <article
                                    key={item.id}
                                    className={isServices ? styles.card : styles.cardProject}
                                    onClick={() => setOpenItem(item)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setOpenItem(item);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={styles.cardBody}>
                                        <h2 className={styles.cardTitle}>{item.title}</h2>
                                        <p className={styles.cardDesc}>{descShown}</p>
                                        {needsMore ? (
                                            <span className={styles.readMore}>{t('portfolio.readMore')}</span>
                                        ) : null}
                                        {!isServices && item.date ? (
                                            <time className={styles.meta} dateTime={String(item.date)}>
                                                {formatItemDate(item.date)}
                                            </time>
                                        ) : null}
                                    </div>
                                    {!isServices && item.image ? (
                                        <div className={styles.thumbWrapSmall}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={resolvePortfolioMediaUrl(item.image)}
                                                alt=""
                                                className={styles.thumbSmall}
                                            />
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                )}

                <Link href={`/${username}`} className={styles.back}>
                    {t('portfolio.backToHome')}
                </Link>
            </div>

            <PortfolioContentModal
                isOpen={Boolean(openItem)}
                onClose={() => setOpenItem(null)}
                title={openItem?.title}
                meta={
                    !isServices && openItem?.date
                        ? `${t('portfolio.issued')} ${formatItemDate(openItem.date)}`
                        : null
                }
                body={openItem?.description}
                imageUrl={
                    !isServices && openItem ? resolvePortfolioMediaUrl(openItem.image) : ''
                }
                imageAlt={openItem?.title}
                projectUrl={!isServices ? openItem?.url : undefined}
                visitLabel={t('portfolio.visitProject')}
                steps={isServices && openItem?.steps ? openItem.steps : undefined}
                dark={dark}
            />
        </div>
    );
}
