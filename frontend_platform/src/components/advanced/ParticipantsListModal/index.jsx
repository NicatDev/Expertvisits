import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import { content } from '@/lib/api';
import { User, ChevronRight } from 'lucide-react';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

const ParticipantsListModal = ({ isOpen, onClose, quizSlug, onSelectParticipant }) => {
    const { t } = useTranslation('common');
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && quizSlug) {
            fetchParticipants();
        }
    }, [isOpen, quizSlug]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const { data } = await content.getQuizParticipants(quizSlug);
            setParticipants(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('participants_modal.title')}>
            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loading}>{t('common.loading')}</div>
                ) : participants.length === 0 ? (
                    <div className={styles.empty}>{t('participants_modal.no_participants')}</div>
                ) : (
                    <div className={styles.list}>
                        {participants.map((attempt) => (
                            <div
                                key={attempt.id}
                                className={styles.item}
                                onClick={() => onSelectParticipant(attempt.user.id)}
                            >
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>
                                        {attempt.user.avatar ? (
                                            <img src={attempt.user.avatar} alt={attempt.user.full_name} />
                                        ) : (
                                            <User size={20} color="#666" />
                                        )}
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.name}>{attempt.user.full_name || attempt.user.username}</div>
                                        <div className={styles.date}>{new Date(attempt.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className={styles.score}>
                                    {attempt.percentage}%
                                    <ChevronRight size={16} color="#ccc" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ParticipantsListModal;
