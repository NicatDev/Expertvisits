'use client';

import styles from '../styles/template3.module.scss';

export default function Footer({ data, user }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <p>&copy; {currentYear} {user?.full_name || 'Portfolio'}. All rights reserved.</p>
            </div>
        </footer>
    );
}
