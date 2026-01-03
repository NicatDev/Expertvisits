import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './ApplyModal.module.scss'; // Reuse or create new styles

const ApplyModal = ({ isOpen, onClose, vacancyId, vacancyTitle, onSuccess }) => {
    const [motivation, setMotivation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!motivation.trim()) {
            toast.error("Please write a motivation letter.");
            return;
        }

        setLoading(true);
        try {
            await business.applyToVacancy({
                vacancy: vacancyId,
                motivation_letter: motivation
            });
            toast.success("Application submitted successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.non_field_errors) {
                toast.error(err.response.data.non_field_errors[0]);
            } else {
                toast.error("Failed to submit application.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Apply to ${vacancyTitle}`}>
            <div className={styles.container}>
                <p className={styles.label}>Why are you a good fit for this role?</p>
                <textarea
                    className={styles.textarea}
                    rows={6}
                    placeholder="Write your motivation letter here..."
                    value={motivation}
                    onChange={e => setMotivation(e.target.value)}
                />
                <div className={styles.actions}>
                    <Button type="default" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Application'}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ApplyModal;
