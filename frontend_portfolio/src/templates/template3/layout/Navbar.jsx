'use client';

import styles from '../styles/template3.module.scss';

export default function Navbar({ data, user }) {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                <div className={styles.navbarLogo}>
                    {user?.full_name || 'Portfolio'}
                </div>
                <ul className={styles.navbarLinks}>
                    <li><a href="#hero">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>
        </nav>
    );
}
