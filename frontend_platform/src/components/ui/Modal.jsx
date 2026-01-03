import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';
import Button from './Button';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer = null,
    width
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                style={{ width: width }}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button className={styles.closeParams} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
                {footer !== null && (
                    <div className={styles.footer}>
                        {footer ? footer : (
                            <>
                                <Button onClick={onClose}>Cancel</Button>
                                <Button type="primary" onClick={onClose}>OK</Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
