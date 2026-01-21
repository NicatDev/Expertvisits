import React, { useState } from 'react';
import styles from './style.module.scss';
import api from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';

const PollCard = ({ poll }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [data, setData] = useState(poll);
    const [loading, setLoading] = useState(false);

    const hasVoted = data.user_vote !== null;

    const handleVote = async (optionId) => {
        if (!user) {
            toast.info(t('feed.toast.login_participate') || "Please login to vote");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/content/polls/${data.id}/vote/`, { option: optionId });
            setData(res.data);
            toast.success(t('feed.toast.vote_success') || "Vote recorded!");
        } catch (err) {
            console.error(err);
            toast.error(t('feed.toast.vote_failed') || "Failed to vote");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pollCard}>
            <h3>{data.question}</h3>

            <div className={styles.options}>
                {hasVoted ? (
                    // Results View
                    data.options.map(opt => (
                        <div
                            key={opt.id}
                            className={`${styles.resultItem} ${data.user_vote === opt.id ? styles.selected : ''}`}
                        >
                            <div className={styles.progressBar} style={{ width: `${opt.percentage}%` }}></div>
                            <div className={styles.content}>
                                <span>{opt.text}</span>
                                <span className={styles.percentage}>{opt.percentage}%</span>
                            </div>
                        </div>
                    ))
                ) : (
                    // Voting View
                    data.options.map(opt => (
                        <button
                            key={opt.id}
                            className={styles.optionBtn}
                            onClick={() => handleVote(opt.id)}
                            disabled={loading}
                        >
                            {opt.text}
                        </button>
                    ))
                )}
            </div>

            <div className={styles.footer}>
                <span>{data.total_votes} {t('feed.votes') || "votes"}</span>
                {hasVoted && <span>{t('feed.voted') || "Voted"}</span>}
            </div>
        </div>
    );
};

export default PollCard;
