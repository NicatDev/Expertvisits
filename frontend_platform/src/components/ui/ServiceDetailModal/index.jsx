import React from 'react';
import { X } from 'lucide-react';
import styles from './style.module.scss';
import Button from '@/components/ui/Button';

export default function ServiceDetailModal({ isOpen, onClose, service }) {
    if (!isOpen || !service) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{service.title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>

                <div className={styles.content}>
                    {service.image && (
                        <div className={styles.imageContainer}>
                            <img src={service.image} alt={service.title} className={styles.serviceImage} />
                        </div>
                    )}

                    <div className={styles.description}>
                        {service.description}
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
