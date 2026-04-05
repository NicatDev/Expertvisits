'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import styles from './PortfolioContentModal.module.scss';

export default function PortfolioContentModal({
    isOpen,
    onClose,
    title,
    meta,
    body,
    imageUrl,
    imageAlt,
    projectUrl,
    visitLabel,
    steps,
    dark = false,
}) {
    if (!isOpen) return null;

    const panelClass = `${styles.panel} ${dark ? styles.panelDark : ''}`;

    return (
        <div className={styles.overlay} role="presentation" onClick={onClose}>
            <div
                className={panelClass}
                role="dialog"
                aria-modal="true"
                aria-labelledby="portfolio-content-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                    ×
                </button>
                <h2 id="portfolio-content-modal-title" className={styles.title}>
                    {title}
                </h2>
                {meta ? <div className={styles.meta}>{meta}</div> : null}
                {body ? (
                    <p className={styles.body}>{body}</p>
                ) : null}
                {Array.isArray(steps) && steps.length > 0 ? (
                    <ol className={styles.steps}>
                        {steps.map((step, i) => (
                            <li key={i}>
                                {typeof step === 'string' ? step : step?.title || step?.text || ''}
                            </li>
                        ))}
                    </ol>
                ) : null}
                {imageUrl ? (
                    <div className={styles.imageFrame}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt={imageAlt || ''} />
                    </div>
                ) : null}
                {projectUrl ? (
                    <a
                        href={projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.visitBtn}
                    >
                        <ExternalLink size={18} />
                        {visitLabel}
                    </a>
                ) : null}
            </div>
        </div>
    );
}
