'use client';

import styles from '../styles/template2.module.scss';
import ProjectsHomeSection from '@/components/portfolio/ProjectsHomeSection';

export default function Projects({ user }) {
    return <ProjectsHomeSection user={user} styles={styles} />;
}
