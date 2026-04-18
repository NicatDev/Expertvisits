'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '@/components/ui/Button';
import styles from './style.module.scss';

/**
 * In-app confirmation dialog (replaces window.confirm).
 */
export default function Sure({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setLoading(false);
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={styles.overlay} role="presentation" onClick={loading ? undefined : onClose}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? 'sure-dialog-title' : undefined}
        aria-describedby="sure-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 id="sure-dialog-title" className={styles.title}>
            {title}
          </h2>
        ) : null}
        <p id="sure-dialog-message" className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <Button type="default" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="primary"
            className={confirmVariant === 'danger' ? styles.confirmDanger : undefined}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
