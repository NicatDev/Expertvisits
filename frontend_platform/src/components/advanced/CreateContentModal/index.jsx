import React, { useState, useRef } from 'react';
import { content } from '@/lib/api';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Plus, CheckCircle, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function CreateContentModal({ isOpen, onClose, onSuccess, initialData = null, initialType = 'article' }) {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState(initialType);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Article
    const [articleData, setArticleData] = useState({ title: '', body: '', image: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    // Quiz
    const [quizData, setQuizData] = useState({
        title: '',
        questions: [{ text: '', choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]
    });



    // Load Initial Data for Editing
    React.useEffect(() => {
        if (isOpen && initialData) {
            setActiveTab(initialType);
            if (initialType === 'article') {
                setArticleData({
                    title: initialData.title,
                    body: initialData.body,
                    image: null // Can't easily prefill file input, handle logic if image exists (maybe show existing coverage)
                });
                if (initialData.image) setPreviewUrl(initialData.image);
            } else if (initialType === 'quiz') {
                setQuizData({
                    title: initialData.title,
                    questions: initialData.questions // Assumes matching structure
                });

            }
        } else if (isOpen && !initialData) {
            // Reset if opening fresh
            setArticleData({ title: '', body: '', image: null });
            setPreviewUrl(null);
            setQuizData({ title: '', questions: [{ text: '', choices: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }] });

        }
    }, [isOpen, initialData, initialType]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleData({ ...articleData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setArticleData({ ...articleData, image: null });
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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

    // --- Submission ---
    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (activeTab === 'article') {
                const fd = new FormData();
                fd.append('title', articleData.title);
                fd.append('body', articleData.body);
                if (articleData.image) fd.append('image', articleData.image);

                if (initialData) {
                    await content.updateArticle(initialData.slug, fd);
                } else {
                    await content.createArticle(fd);
                }
            } else if (activeTab === 'quiz') {
                // Validation (Reused)
                if (quizData.questions.length === 0) {
                    toast.error("Please add at least one question.");
                    setLoading(false); return;
                }
                for (let i = 0; i < quizData.questions.length; i++) {
                    const q = quizData.questions[i];
                    if (!q.text.trim()) { toast.error(`Question ${i + 1} text required`); setLoading(false); return; }
                    if (!q.choices.some(c => c.is_correct)) { toast.error(`Question ${i + 1} needs correct answer`); setLoading(false); return; }
                }

                if (initialData) {
                    await content.updateQuiz(initialData.id, quizData);
                } else {
                    await content.createQuiz(quizData);
                }


            }

            toast.success(initialData ? 'Content updated!' : 'Content created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Operation failed");
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

                <h2>{t('create_modal.title')}</h2>

                <div className={styles.tabs}>
                    {['article', 'quiz'].map(tabType => (
                        <button
                            key={tabType}
                            onClick={() => setActiveTab(tabType)}
                            className={activeTab === tabType ? styles.active : ''}
                        >
                            {t(`create_modal.${tabType}_tab`)}
                        </button>
                    ))}
                </div>

                <div className={styles.formContent}>
                    {activeTab === 'article' && (
                        <>
                            <Input label={t('create_modal.post_title')} value={articleData.title} onChange={e => setArticleData({ ...articleData, title: e.target.value })} />

                            <div className={styles.fieldGroup}>
                                <label>{t('create_modal.cover_image')}</label>
                                <div className={styles.uploadContainer} onClick={() => fileInputRef.current.click()}>
                                    {previewUrl ? (
                                        <div className={styles.previewImage}>
                                            <img src={previewUrl} alt="Preview" />
                                            <button className={styles.removeBtn} onClick={removeImage}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={styles.uploadTrigger}>
                                            <ImageIcon size={32} />
                                            <span>{t('create_modal.upload_placeholder')}</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>{t('create_modal.content')}</label>
                                <textarea
                                    value={articleData.body}
                                    onChange={e => setArticleData({ ...articleData, body: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'quiz' && (
                        <>
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
                        </>
                    )}



                    <div className={styles.actions}>
                        <Button type="default" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>{loading ? t('create_modal.posting') : t('create_modal.post_btn')}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
