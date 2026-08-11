import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { business, profiles } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { calculateProfileCompletion } from '@/lib/utils/profileCompletion';

const ApplyModal = ({ isOpen, onClose, vacancyId, vacancyTitle, onSuccess }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [motivation, setMotivation] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileProgress, setProfileProgress] = useState(null);

    useEffect(() => {
        if (!isOpen || !user?.id) return;
        let cancelled = false;

        const loadProfileProgress = async () => {
            try {
                const res = await profiles.getProfileDetails(user.id, {
                    params: { t: Date.now() },
                });
                if (!cancelled) {
                    setProfileProgress(calculateProfileCompletion(res.data, user));
                }
            } catch (err) {
                console.error('Failed to load profile completion for application', err);
                if (!cancelled) setProfileProgress(null);
            }
        };

        loadProfileProgress();

        return () => {
            cancelled = true;
        };
    }, [isOpen, user]);

    const handleSubmit = async () => {
        if (!motivation.trim()) {
            toast.error(t('apply_modal.errors.motivation_required'));
            return;
        }

        setLoading(true);
        try {
            await business.applyToVacancy({
                vacancy: vacancyId,
                motivation_letter: motivation
            });
            toast.success(t('apply_modal.success'));
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.non_field_errors) {
                toast.error(err.response.data.non_field_errors[0]);
            } else {
                toast.error(t('apply_modal.errors.failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('apply_modal.title', { title: vacancyTitle || t('vacancy_detail.apply_now') })}
        >
            <div className={styles.container}>
                {profileProgress !== null && profileProgress < 60 ? (
                    <div className={styles.profileWarning}>
                        <strong>{t('apply_modal.profile_warning_title', { progress: profileProgress })}</strong>
                        <p>{t('apply_modal.profile_warning_body')}</p>
                    </div>
                ) : null}
                <p className={styles.label}>{t('apply_modal.motivation_label')}</p>
                <textarea
                    className={styles.textarea}
                    rows={6}
                    placeholder={t('apply_modal.motivation_placeholder')}
                    value={motivation}
                    onChange={e => setMotivation(e.target.value)}
                />
                <div className={styles.actions}>
                    <Button type="default" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? t('apply_modal.submitting') : t('apply_modal.submit')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ApplyModal;
