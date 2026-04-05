'use client';

import styles from '../styles/template3.module.scss';
import { useTranslation } from '@/i18n/client';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';

export default function Projects({ user }) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    if (!v.projects_on_home) return null;

    const projects = user?.projects || [];

    return (
        <section id="projects" className={styles.projects}>
            <div className={styles.projectsContainer}>
                <h2 className={styles.sectionTitle}>{t('portfolio.projects')}</h2>
                {projects.length > 0 ? (
                    <div className={styles.projectsGrid}>
                        {projects.map((project) => (
                            <div key={project.id} className={styles.projectCard}>
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyText}>{t('portfolio.projectsEmptyHome')}</p>
                )}
            </div>
        </section>
    );
}
