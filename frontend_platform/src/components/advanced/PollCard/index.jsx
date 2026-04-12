import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './style.module.scss';
import api from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils/date';
import { labelForSubCategory } from '@/lib/utils/subcategory';
import { usePathname } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';

const PollCard = ({ poll, onFeedRefresh }) => {
    const { t, i18n } = useTranslation('common');
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname) || defaultLocale;
    const userPublicHref = (username) =>
        username ? withLocale(pathLocale, `/user/${encodeURIComponent(username)}`) : null;
    const { user } = useAuth();
    const [data, setData] = useState(poll);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setData(poll);
    }, [poll]);

    const hasVoted = data.user_vote != null;
    const professionLabel = labelForSubCategory(data.sub_category, i18n.language);

    const handleVote = async (optionId) => {
        if (!user) {
            toast.info(t('feed.toast.login_participate') || 'Please login to vote');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/content/polls/${data.id}/vote/`, { option: optionId });
            setData(res.data);
            toast.success(t('feed.toast.vote_success') || 'Vote recorded!');
            onFeedRefresh?.();
        } catch (err) {
            console.error(err);
            toast.error(t('feed.toast.vote_failed') || 'Failed to vote');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pollCard}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    {data.author ? (
                        <Link href={userPublicHref(data.author)} className={styles.avatar}>
                            <Avatar
                                user={{
                                    username: data.author,
                                    avatar: data.author_avatar,
                                    avatar_compressed: data.author_avatar_compressed,
                                }}
                                size={32}
                            />
                        </Link>
                    ) : (
                        <div className={styles.avatar}>
                            <Avatar user={{ username: t('feed_item.unknown_user') }} size={32} />
                        </div>
                    )}
                    <div className={styles.meta}>
                        {data.author ? (
                            <Link href={userPublicHref(data.author)} className={styles.username}>
                                {data.author}
                            </Link>
                        ) : (
                            <div className={styles.username}>{t('feed_item.unknown_user')}</div>
                        )}
                        <div className={styles.date}>{formatDate(data.created_at, i18n.language)}</div>
                        {professionLabel ? <div className={styles.profession}>{professionLabel}</div> : null}
                    </div>
                </div>
            </div>

            <h3>{data.question}</h3>

            <div className={styles.options}>
                {hasVoted ? (
                    // Results View
                    data.options.map((opt) => (
                        <div
                            key={opt.id}
                            className={`${styles.resultItem} ${Number(data.user_vote) === Number(opt.id) ? styles.selected : ''}`}
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
                    data.options.map((opt) => (
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
                <span>
                    {data.total_votes} {t('feed.votes') || 'votes'}
                </span>
                {hasVoted && <span>{t('feed.voted') || 'Voted'}</span>}
            </div>
        </div>
    );
};

export default PollCard;
