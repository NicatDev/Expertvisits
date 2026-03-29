'use client';

import styles from '../styles/template4.module.scss';

export default function About({ data, user }) {
    return (
        <section id="about" className={styles.about}>
            <div className={styles.aboutContainer}>
                <h2 className={styles.sectionTitle}>About Me</h2>
                <p className={styles.aboutText}>
                    {data?.about?.description || 'About section content will go here.'}
                </p>
            </div>
        </section>
    );
}
