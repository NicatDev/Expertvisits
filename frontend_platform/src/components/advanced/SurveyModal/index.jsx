import React, { useState } from 'react';
import Button from '../../ui/Button';
import { X } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

export default function SurveyModal({ isOpen, onClose, survey, onSuccess }) {
    const [answerText, setAnswerText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !survey) return null;

    const handleSubmit = async () => {
        if (!answerText.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/content/surveys/${survey.id}/submit/`, {
                answer_text: answerText
            });
            toast.success("Survey submitted!");
            onSuccess(); // To refresh parent
            onClose();
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error("Failed to submit survey");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} color="#666" />
                </button>

                <h3>Participate in Survey</h3>
                <p className={styles.question}>{survey.question}</p>

                <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer..."
                />

                <div className={styles.footer}>
                    <Button onClick={handleSubmit} disabled={submitting || !answerText.trim()}>
                        {submitting ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
