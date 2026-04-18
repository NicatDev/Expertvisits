"use client";

import { useEffect } from 'react';
import styles from '../styles/detailModal.module.scss';

export default function DetailModal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.overlay} role="presentation">
            <button
                type="button"
                className={styles.backdrop}
                aria-label="Close"
                onClick={onClose}
            />
            <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
                <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                    ×
                </button>
                {title ? (
                    <h2 id="detail-modal-title" className={styles.title}>
                        {title}
                    </h2>
                ) : null}
                {children}
            </div>
        </div>
    );
}
