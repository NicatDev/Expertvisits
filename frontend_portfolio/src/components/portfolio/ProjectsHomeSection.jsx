'use client';

import { useTranslation } from '@/i18n/client';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import { resolvePortfolioMediaUrl } from '@/lib/portfolioMedia';

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
 * @param {object} props.user — website payload from API
 * @param {object} props.styles — CSS module from template (projects, projectsContainer, …)
 */
export default function ProjectsHomeSection({ user, styles: s }) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    if (!v.projects_on_home) return null;

    const projects = user?.projects || [];

    return (
        <section id="projects" className={s.projects}>
            <div className={s.projectsContainer}>
                <h2 className={s.sectionTitle}>{t('portfolio.projects')}</h2>
                {projects.length > 0 ? (
                    <div className={s.projectsGrid}>
                        {projects.map((project) => {
                            const imgSrc = resolvePortfolioMediaUrl(project.image);
                            return (
                                <article key={project.id} className={s.projectCard}>
                                    {imgSrc ? (
                                        <div className={s.projectImageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imgSrc}
                                                alt=""
                                                className={s.projectImage}
                                            />
                                        </div>
                                    ) : null}
                                    <h3>{project.title}</h3>
                                    {project.date ? (
                                        <time className={s.projectDate} dateTime={String(project.date)}>
                                            {formatProjectDate(project.date)}
                                        </time>
                                    ) : null}
                                    <p>{project.description}</p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className={s.emptyText}>{t('portfolio.projectsEmptyHome')}</p>
                )}
            </div>
        </section>
    );
}
