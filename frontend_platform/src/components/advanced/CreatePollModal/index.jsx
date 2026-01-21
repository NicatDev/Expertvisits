import React, { useState } from 'react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'react-toastify';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function CreatePollModal({ isOpen, onClose, onSuccess }) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(false);

    // Initial state: question empty, 2 empty options
    const [pollData, setPollData] = useState({
        question: '',
        options: ['', '']
    });

    // Reset state when opening? 
    // Usually handled by parent unmounting or by useEffect. 
    // Let's rely on simple state for now. If user closes and reopens, it might persist unless we reset.
    // Better to reset on Open.
    React.useEffect(() => {
        if (isOpen) {
            setPollData({ question: '', options: ['', ''] });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOptionChange = (index, value) => {
        const newOptions = [...pollData.options];
        newOptions[index] = value;
        setPollData({ ...pollData, options: newOptions });
    };

    const addOption = () => {
        if (pollData.options.length < 4) {
            setPollData({ ...pollData, options: [...pollData.options, ''] });
        } else {
            toast.info(t('create_modal.max_options') || "Max 4 options allowed");
        }
    };

    const removeOption = (index) => {
        if (pollData.options.length > 2) {
            const newOptions = pollData.options.filter((_, i) => i !== index);
            setPollData({ ...pollData, options: newOptions });
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!pollData.question.trim() || pollData.options.some(o => !o.trim())) {
            toast.error(t('create_modal.fill_required') || "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            await api.post('/content/polls/', {
                question: pollData.question,
                options: pollData.options
            });
            toast.success(t('create_modal.poll_created') || 'Poll created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(t('create_modal.error') || "Operation failed");
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

                <h2>{t('create_modal.create_poll') || "Create Poll"}</h2>

                <div className={styles.formContent}>
                    <Input
                        label={t('create_modal.poll_question') || "Question"}
                        value={pollData.question}
                        onChange={e => setPollData({ ...pollData, question: e.target.value })}
                        placeholder={t('create_modal.poll_question_placeholder') || "Ask a question..."}
                    />

                    <div className={styles.fieldGroup}>
                        <label>{t('create_modal.poll_options') || "Options"}</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {pollData.options.map((opt, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Input
                                        value={opt}
                                        onChange={e => handleOptionChange(idx, e.target.value)}
                                        placeholder={`${t('create_modal.option') || "Option"} ${idx + 1}`}
                                        style={{ marginBottom: 0 }}
                                    />
                                    {pollData.options.length > 2 && (
                                        <button onClick={() => removeOption(idx)} style={{ border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {pollData.options.length < 4 && (
                                <Button size="small" type="default" onClick={addOption} style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                                    {t('create_modal.add_option') || "Add Option"}
                                </Button>
                            )}
                        </div>
                    </div>

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
