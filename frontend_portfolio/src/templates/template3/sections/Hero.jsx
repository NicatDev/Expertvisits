'use client';

import styles from '../styles/template3.module.scss';

export default function Hero({ data, user }) {
    return (
        <section id="hero" className={styles.hero}>
            <div className={styles.heroContainer}>
                <h1 className={styles.heroTitle}>{user?.full_name || 'Your Name'}</h1>
                <p className={styles.heroSubtitle}>{data?.hero?.subtitle || 'Welcome to my portfolio'}</p>
            </div>
        </section>
    );
}
