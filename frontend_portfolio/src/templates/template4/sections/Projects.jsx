'use client';

import styles from '../styles/template4.module.scss';
import ProjectsHomeSection from '@/components/portfolio/ProjectsHomeSection';

export default function Projects({ user }) {
    return <ProjectsHomeSection user={user} styles={styles} />;
}
