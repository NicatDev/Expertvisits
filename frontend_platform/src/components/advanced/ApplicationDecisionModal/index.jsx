'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

const MIN_MESSAGE_LENGTH = 10;

export default function ApplicationDecisionModal({ isOpen, status, applicantName, onClose, onConfirm, loading = false }) {
    const { t } = useTranslation('common');
    const [message, setMessage] = useState('');

    const trimmed = message.trim();
    const isValid = trimmed.length >= MIN_MESSAGE_LENGTH;
    const titleKey = status === 'accepted' ? 'accept_title' : 'reject_title';
    const actionKey = status === 'accepted' ? 'accept_confirm' : 'reject_confirm';
    const handleClose = () => {
        setMessage('');
        onClose();
    };

    const handleConfirm = () => {
        onConfirm(trimmed);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={loading ? undefined : handleClose}
            title={t(`vacancy_detail.decision_modal.${titleKey}`)}
            width={520}
        >
            <div className={styles.container}>
                <p className={styles.description}>
                    {t('vacancy_detail.decision_modal.description', {
                        name: applicantName || t('vacancy_detail.applicant_fallback'),
                    })}
                </p>
                <label className={styles.label} htmlFor="application-response-message">
                    {t('vacancy_detail.decision_modal.message_label')}
                </label>
                <textarea
                    id="application-response-message"
                    className={styles.textarea}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t('vacancy_detail.decision_modal.message_placeholder')}
                    rows={5}
                    autoFocus
                />
                <div className={`${styles.counter} ${!isValid && trimmed.length > 0 ? styles.counterError : ''}`}>
                    {t('vacancy_detail.decision_modal.min_chars', {
                        count: MIN_MESSAGE_LENGTH,
                        current: trimmed.length,
                    })}
                </div>
                <div className={styles.actions}>
                    <Button type="default" onClick={handleClose} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        disabled={!isValid}
                        loading={loading}
                        className={status === 'rejected' ? styles.rejectButton : styles.acceptButton}
                    >
                        {t(`vacancy_detail.decision_modal.${actionKey}`)}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
