import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from '../../ui/Button';
import { X } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function QuizModal({ isOpen, onClose, quiz, onSuccess, reviewMode = false }) {
    const { t } = useTranslation('common');
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Modal açılanda / rejim və ya nəticə dəstəyi dəyişəndə: köhnə submit nəticəsi qalmasın (ana səhifə retake)
    useEffect(() => {
        if (!isOpen || !quiz) return;
        setResult(null);
        setSubmitting(false);
        setSubmitError('');
        if (reviewMode) {
            setAnswers(quiz.user_attempt?.answers_json || {});
        } else {
            setAnswers({});
        }
    }, [isOpen, reviewMode, quiz?.slug, quiz?.user_attempt?.id]);

    // If reviewMode, quiz prop contains user_attempt and is_correct flags on choice
    const attempt = reviewMode ? quiz.user_attempt : null;

    if (!isOpen || !quiz) return null;

    const handleSelect = (qId, cId) => {
        if (reviewMode) return;
        if (submitError) setSubmitError('');
        setAnswers(prev => ({ ...prev, [qId]: cId }));
    };

    const handleSubmit = async () => {
        const unansweredCount = Math.max((quiz?.questions?.length || 0) - Object.keys(answers).length, 0);
        if (unansweredCount > 0) {
            const message = t('quiz_modal.unanswered_error', { count: unansweredCount });
            setSubmitError(message);
            toast.info(message);
            return;
        }

        setSubmitting(true);
        setSubmitError('');
        try {
            const slug = quiz.slug;
            if (!slug) {
                toast.error(t('quiz_modal.error'));
                setSubmitting(false);
                return;
            }
            const { data } = await api.post(`/content/quizzes/${encodeURIComponent(slug)}/submit/`, {
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

    // Calculate class for option in review mode
    const getOptionClass = (qId, cId, isCorrect) => {
        if (!reviewMode) return answers[qId] == cId ? styles.selected : '';

        const userSelected = answers[qId] == cId || (attempt?.answers_json?.[qId] == cId);

        if (isCorrect) return styles.correct; // Show green for correct answer always
        if (userSelected && !isCorrect) return styles.incorrect; // Show red if user picked wrong
        return '';
    };

    const modalContent = (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} color="#666" />
                </button>

                <h2>{quiz.title}</h2>
                <div className={styles.meta}>
                    {reviewMode ? (
                        <span className={styles.reviewScore}>
                            {t('quiz_modal.score')}: {attempt?.percentage}%
                        </span>
                    ) : (
                        result ? `${t('quiz_modal.score')}: ${result.score} / ${result.total}` : `${quiz.questions.length} ${t('quiz_modal.questions')}`
                    )}
                </div>

                {result && !reviewMode ? (
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
                                                className={getOptionClass(q.id, c.id, c.is_correct)}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={c.id}
                                                    checked={reviewMode ? (answers[q.id] == c.id || attempt?.answers_json?.[q.id] == c.id) : (answers[q.id] == c.id)}
                                                    onChange={() => handleSelect(q.id, c.id)}
                                                    disabled={reviewMode}
                                                />
                                                <span>{c.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!reviewMode && (
                            <div className={styles.footer}>
                                {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? t('quiz_modal.submitting') : t('quiz_modal.submit')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Use createPortal to render outside of the transform context
    return ReactDOM.createPortal(modalContent, document.body);
}
