import React from 'react';
import { FileText, HelpCircle, BarChart2, X } from 'lucide-react';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

export default function ContentSelectionModal({ isOpen, onClose, onSelect }) {
    const { t } = useTranslation('common');

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <h2 className={styles.title}>{t('create_modal.choose_content_type')}</h2>

                <div className={styles.grid}>
                    {/* Left Side - Article */}
                    <div
                        className={`${styles.card} ${styles.articleCard}`}
                        onClick={() => onSelect('article')}
                    >
                        <div className={styles.iconWrapper}>
                            <FileText size={48} />
                        </div>
                        <h3>{t('create_modal.article_tab')}</h3>
                        <p>{t('create_modal.article_desc', 'Share your thoughts, knowledge, and stories in a long-form article.')}</p>
                    </div>

                    {/* Right Side - Stacked Quiz & Poll */}
                    <div className={styles.rightColumn}>
                        <div
                            className={`${styles.card} ${styles.quizCard}`}
                            onClick={() => onSelect('quiz')}
                        >
                            <div className={styles.iconWrapper}>
                                <HelpCircle size={32} />
                            </div>
                            <div>
                                <h3>{t('create_modal.quiz_tab')}</h3>
                                <p>{t('create_modal.quiz_desc', 'Engage directly with Q&A.')}</p>
                            </div>
                        </div>

                        <div
                            className={`${styles.card} ${styles.pollCard}`}
                            onClick={() => onSelect('poll')}
                        >
                            <div className={styles.iconWrapper}>
                                <BarChart2 size={32} />
                            </div>
                            <div>
                                <h3>{t('create_modal.poll_tab') || "Poll"}</h3>
                                <p>{t('create_modal.poll_desc') || "Gather opinions quickly."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
