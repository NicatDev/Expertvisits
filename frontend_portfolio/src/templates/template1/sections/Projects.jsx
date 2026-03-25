'use client';

import styles from '../styles/template1.module.scss';

export default function Projects({ data, user }) {
    const projects = data?.projects?.items || [];

    return (
        <section id="projects" className={styles.projects}>
            <div className={styles.projectsContainer}>
                <h2 className={styles.sectionTitle}>Projects</h2>
                {projects.length > 0 ? (
                    <div className={styles.projectsGrid}>
                        {projects.map((project, index) => (
                            <div key={index} className={styles.projectCard}>
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyText}>No projects added yet.</p>
                )}
            </div>
        </section>
    );
}
