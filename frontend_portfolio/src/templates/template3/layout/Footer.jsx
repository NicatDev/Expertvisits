'use client';

import styles from '../styles/template3.module.scss';

export default function Footer({ data, user }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            <p>&copy; {currentYear} {user?.full_name || 'Portfolio'}. All rights reserved.</p>
        </footer>
    );
}
