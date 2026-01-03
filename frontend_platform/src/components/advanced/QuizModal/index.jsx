import React, { useState } from 'react';
import Button from '../../ui/Button';
import { X } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

export default function QuizModal({ isOpen, onClose, quiz, onSuccess }) {
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
            toast.success("Quiz completed!");
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit quiz");
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
                    {result ? `You scored: ${result.score} / ${result.total}` : `${quiz.questions.length} Questions`}
                </div>

                {result ? (
                    <div className={styles.resultView}>
                        <div className={styles.score}>
                            {Math.round((result.score / result.total) * 100)}%
                        </div>
                        <p>Thanks for participating!</p>
                        <Button onClick={onClose}>Close</Button>
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
                                {submitting ? 'Submitting...' : 'Submit Quiz'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
