'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/i18n/client';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import { resolvePortfolioMediaUrl, isDarkPortfolioTemplate } from '@/lib/portfolioMedia';
import { truncateDescription } from '@/lib/portfolioText';
import PortfolioContentModal from './PortfolioContentModal';

function formatProjectDate(dateVal) {
    if (!dateVal) return '';
    try {
        const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
        if (Number.isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(dateVal);
    }
}

/**
 * @param {object} props
 * @param {object} props.user
 * @param {object} props.styles — CSS module (projects, projectsContainer, projectsGrid, projectCard, …)
 * @param {React.ReactNode} [props.titleSlot]
 * @param {string} [props.sectionClassName] — outer section class (default: styles.projects)
 * @param {string} [props.gridClassName]
 * @param {string} [props.cardClassName]
 * @param {string} [props.imageWrapClassName]
 * @param {string} [props.imageClassName]
 * @param {string} [props.dateClassName]
 * @param {string} [props.readMoreClassName] — optional hook for template-specific “read more” link
 * @param {boolean} [props.reserveImageArea] — when true, keep a fixed image slot even without image (grid alignment)
 */
export default function ProjectsHomeSection({
    user,
    styles: s,
    titleSlot,
    sectionClassName,
    gridClassName,
    cardClassName,
    imageWrapClassName,
    imageClassName,
    dateClassName,
    readMoreClassName,
    reserveImageArea = false,
}) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    const [open, setOpen] = useState(null);

    const darkModal = isDarkPortfolioTemplate(user?.template_id);

    const projects = user?.projects || [];

    const sectionCls = sectionClassName || s.projects;
    const gridCls = gridClassName || s.projectsGrid;
    const cardCls = cardClassName || s.projectCard;
    const imgWrapCls = imageWrapClassName || s.projectImageWrap;
    const imgCls = imageClassName || s.projectImage;
    const dateCls = dateClassName || s.projectDate;
    const readMoreCls = readMoreClassName || s.projectReadMore;

    const defaultTitle = useMemo(
        () => (
            <h2 className={s.sectionTitle}>{t('portfolio.projects')}</h2>
        ),
        [s.sectionTitle, t]
    );

    if (!v.projects_on_home) return null;

    return (
        <>
            <section id="projects" className={sectionCls}>
                <div className={s.projectsContainer}>
                    {titleSlot ?? defaultTitle}
                    {projects.length > 0 ? (
                        <div className={gridCls}>
                            {projects.map((project) => {
                                const imgSrc = resolvePortfolioMediaUrl(project.image);
                                const { excerpt, needsMore, full } = truncateDescription(project.description);
                                return (
                                    <article key={project.id} className={cardCls}>
                                        <div className={s.projectTextBlock}>
                                            <h3>{project.title}</h3>
                                            {project.date ? (
                                                <time className={dateCls} dateTime={String(project.date)}>
                                                    {formatProjectDate(project.date)}
                                                </time>
                                            ) : null}
                                            <p className={s.projectExcerpt}>{needsMore ? excerpt : full}</p>
                                            {needsMore ? (
                                                <button
                                                    type="button"
                                                    className={readMoreCls}
                                                    onClick={() => setOpen(project)}
                                                >
                                                    {t('portfolio.readMore')}
                                                </button>
                                            ) : null}
                                        </div>
                                        {imgSrc || reserveImageArea ? (
                                            <div
                                                className={[
                                                    imgWrapCls,
                                                    !imgSrc && reserveImageArea && s.projectImageWrapEmpty,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            >
                                                {imgSrc ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={imgSrc} alt="" className={imgCls} />
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={s.emptyText}>{t('portfolio.projectsEmptyHome')}</p>
                    )}
                </div>
            </section>

            <PortfolioContentModal
                isOpen={Boolean(open)}
                onClose={() => setOpen(null)}
                title={open?.title}
                meta={open?.date ? `${t('portfolio.issued')} ${formatProjectDate(open.date)}` : null}
                body={open?.description}
                imageUrl={open ? resolvePortfolioMediaUrl(open.image) : ''}
                imageAlt={open?.title}
                projectUrl={open?.url}
                visitLabel={t('portfolio.visitProject')}
                dark={darkModal}
            />
        </>
    );
}
