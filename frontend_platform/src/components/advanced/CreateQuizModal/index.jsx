import React, { useState } from 'react';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function CreateQuizModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(false);

    const [quizData, setQuizData] = useState({
        title: '',
        questions: [{ text: '', choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]
    });

    React.useEffect(() => {
        if (isOpen && initialData) {
            setQuizData({
                title: initialData.title,
                questions: initialData.questions
            });
        } else if (isOpen && !initialData) {
            setQuizData({ title: '', questions: [{ text: '', choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }] });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    // --- Quiz Helpers ---
    const addQuestion = () => {
        setQuizData(prev => ({
            ...prev,
            questions: [...prev.questions, { text: '', choices: [{ text: '', is_correct: false }] }]
        }));
    };

    const removeQuestion = (idx) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx)
        }));
    };

    const updateQuestionText = (idx, text) => {
        const newQuestions = [...quizData.questions];
        newQuestions[idx].text = text;
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const addChoice = (qIdx) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIdx].choices.push({ text: '', is_correct: false });
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const updateChoice = (qIdx, cIdx, field, value) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIdx].choices[cIdx][field] = value;
        if (field === 'is_correct' && value === true) {
            newQuestions[qIdx].choices.forEach((c, i) => {
                if (i !== cIdx) c.is_correct = false;
            });
        }
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const removeChoice = (qIdx, cIdx) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIdx].choices = newQuestions[qIdx].choices.filter((_, i) => i !== cIdx);
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!quizData.title.trim()) {
                toast.error(t('create_modal.title_required', { defaultValue: "Başlıq mütləqdir" }));
                setLoading(false); return;
            }
            if (quizData.questions.length === 0) {
                toast.error(t('create_modal.question_required', { defaultValue: "Ən azı 1 sual əlavə edilməlidir" }));
                setLoading(false); return;
            }
            for (let i = 0; i < quizData.questions.length; i++) {
                const q = quizData.questions[i];
                if (!q.text.trim()) { toast.error(`${i + 1}-ci sualın mətni boş ola bilməz`); setLoading(false); return; }
                if (!q.choices.some(c => c.is_correct)) { toast.error(`${i + 1}-ci sual üçün ən azı 1 doğru variant seçilməlidir`); setLoading(false); return; }
            }

            if (initialData) {
                await content.updateQuiz(initialData.slug, quizData);
            } else {
                await content.createQuiz(quizData);
            }

            toast.success(initialData ? t('common.updated_success', { defaultValue: 'Yeniləndi!' }) : t('common.created_success', { defaultValue: 'Uğurla yaradıldı!' }));
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.title?.[0] || err.response?.data?.detail || t('common.operation_failed', { defaultValue: "Əməliyyat xətası baş verdi" });
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} color="#666" />
                </button>

                <h2>{initialData ? t('create_modal.edit_quiz') : t('create_modal.create_quiz')}</h2>

                <div className={styles.formContent}>
                    <Input label={t('create_modal.quiz_title')} value={quizData.title} onChange={e => setQuizData({ ...quizData, title: e.target.value })} />

                    <div className={styles.quizBuilder}>
                        {quizData.questions.map((q, qIdx) => (
                            <div key={qIdx} className={styles.questionCard}>
                                <div className={styles.header}>
                                    <span>{t('create_modal.question_label')} {qIdx + 1}</span>
                                    <button onClick={() => removeQuestion(qIdx)}><Trash2 size={16} /></button>
                                </div>
                                <Input placeholder="Enter question text..." value={q.text} onChange={e => updateQuestionText(qIdx, e.target.value)} />

                                <div className={styles.answers}>
                                    {q.choices.map((c, cIdx) => (
                                        <div key={cIdx} className={styles.answerRow}>
                                            <div
                                                onClick={() => updateChoice(qIdx, cIdx, 'is_correct', true)}
                                                className={`${styles.check} ${c.is_correct ? styles.correct : ''}`}
                                            >
                                                <CheckCircle size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={`${t('create_modal.option_placeholder')} ${cIdx + 1}`}
                                                value={c.text}
                                                onChange={e => updateChoice(qIdx, cIdx, 'text', e.target.value)}
                                            />
                                            <button onClick={() => removeChoice(qIdx, cIdx)} className={styles.removeBtn}><X size={14} /></button>
                                        </div>
                                    ))}
                                    <Button type="text" size="small" onClick={() => addChoice(qIdx)}>{t('create_modal.add_option')}</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button type="dashed" onClick={addQuestion} style={{ marginTop: '10px' }}>{t('create_modal.add_question')}</Button>

                    <div className={styles.actions}>
                        <Button type="default" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>
                            {loading ? t('create_modal.posting') : t('create_modal.post_btn')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
