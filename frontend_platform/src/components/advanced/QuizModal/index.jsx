import React, { useState } from 'react';
import Button from '../../ui/Button';
import { X } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function QuizModal({ isOpen, onClose, quiz, onSuccess }) {
    const { t } = useTranslation('common');
    const [answers, setAnswers] = useState({}); // { questionId: choiceId }
    const [result, setResult] = useState(null); // { score, total }
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !quiz) return null;

    const handleSelect = (qId, cId) => {
        setAnswers(prev => ({ ...prev, [qId]: cId }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const { data } = await api.post(`/content/quizzes/${quiz.id}/submit/`, {
                answers: answers
            });
            setResult(data);
            toast.success(t('quiz_modal.success'));
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            toast.error(t('quiz_modal.error'));
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

                <h2>{quiz.title}</h2>
                <div className={styles.meta}>
                    {result ? `${t('quiz_modal.score')}: ${result.score} / ${result.total}` : `${quiz.questions.length} ${t('quiz_modal.questions')}`}
                </div>

                {result ? (
                    <div className={styles.resultView}>
                        <div className={styles.score}>
                            {Math.round((result.score / result.total) * 100)}%
                        </div>
                        <p>{t('quiz_modal.thanks')}</p>
                        <Button onClick={onClose}>{t('quiz_modal.close')}</Button>
                    </div>
                ) : (
                    <div>
                        <div className={styles.questionsList}>
                            {quiz.questions.map((q, idx) => (
                                <div key={q.id} className={styles.questionItem}>
                                    <p>
                                        {idx + 1}. {q.text}
                                    </p>
                                    <div className={styles.answers}>
                                        {q.choices.map(c => (
                                            <label
                                                key={c.id}
                                                className={answers[q.id] == c.id ? styles.selected : ''}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={c.id}
                                                    checked={answers[q.id] == c.id}
                                                    onChange={() => handleSelect(q.id, c.id)}
                                                />
                                                <span>{c.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.footer}>
                            <Button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < quiz.questions.length}>
                                {submitting ? t('quiz_modal.submitting') : t('quiz_modal.submit')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
