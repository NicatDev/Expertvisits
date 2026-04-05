"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api/client';
import styles from './style.module.scss';
import Avatar from '@/components/ui/Avatar';
import { toast } from 'react-toastify';
import { interactions } from '@/lib/api';
import { connectionsApi } from '@/lib/api/connections';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';

const RecommendedUsers = () => {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language || 'az';
    const { user: currentUser } = useAuth();
    const { refreshSummary } = useInboxSocket();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/accounts/users/', {
                params: {
                    ordering: '-followers_count',
                },
            });
            const list = data.results || data;
            setUsers(list.filter((u) => u.username).slice(0, 5));
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshOne = async (user) => {
        try {
            const { data } = await api.get(`/accounts/users/${user.username}/`);
            setUsers((prev) => prev.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
        } catch {
            await fetchUsers();
        }
    };

    const handleAcceptIncoming = async (user) => {
        const rid = user.incoming_connection_request_id;
        if (!rid) return;
        try {
            await connectionsApi.accept(rid);
            toast.success(t('application_status.accepted'));
            await refreshSummary();
            await refreshOne(user);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error_generic'));
        }
    };

    const handleFollow = async (user) => {
        if (!currentUser) {
            toast.error(t('widgets.login_to_follow'));
            return;
        }
        try {
            if (user.is_following) {
                await interactions.unfollowUser(user.username);
                await refreshOne(user);
                return;
            }
            if (user.connection_pending_out && user.outgoing_connection_request_id) {
                await connectionsApi.cancel(user.outgoing_connection_request_id);
                await refreshOne(user);
                return;
            }
            if (user.connection_pending_in) {
                if (user.incoming_connection_request_id) {
                    await handleAcceptIncoming(user);
                } else {
                    toast.info(t('inbox.pending_in_hint'));
                }
                return;
            }
            await interactions.followUser(user.username);
            await refreshOne(user);
        } catch (error) {
            if (error.response?.status === 409) {
                toast.info(t('inbox.incoming_conflict'));
            } else {
                console.error(error);
                toast.error(t('common.error_generic'));
            }
        }
    };

    const labelFor = (user) => {
        if (user.is_following) return t('widgets.unfollow');
        if (user.connection_pending_in) {
            return user.incoming_connection_request_id ? t('inbox.accept') : t('widgets.pending_request');
        }
        if (user.connection_pending_out) {
            return user.outgoing_connection_request_id
                ? t('widgets.cancel_request')
                : t('widgets.pending_request');
        }
        return t('widgets.follow');
    };

    const primaryClassFor = (user) => {
        if (user.connection_pending_in && user.incoming_connection_request_id) {
            return `${styles.followBtn} ${styles.acceptBtn}`;
        }
        if (user.is_following) return `${styles.followBtn} ${styles.following}`;
        return styles.followBtn;
    };

    if (!isMounted) return <div className={styles.container}>...</div>;
    if (loading) return <div className={styles.container}>{t('widgets.loading')}</div>;
    if (users.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{t('widgets.recommended_users')}</h3>
            <div className={styles.list}>
                {users.map((user) => (
                    <div key={user.id} className={styles.item}>
                        <div className={styles.itemRow}>
                            <Avatar user={user} size={40} className={styles.avatar} />
                            <div className={styles.info}>
                                <Link href={`/user/${user.username}`} className={styles.name}>
                                    {user.first_name} {user.last_name}
                                </Link>
                                <span
                                    className={styles.followers}
                                    style={{ color: '#999', fontSize: '12px' }}
                                >
                                    {user.profession_sub_category?.[`profession_${currentLang}`] ||
                                        user.profession_sub_category?.[`name_${currentLang}`] ||
                                        t('widgets.user_role')}
                                </span>
                            </div>
                        </div>
                        <div className={styles.actionRow}>
                            <button
                                type="button"
                                className={primaryClassFor(user)}
                                onClick={() => handleFollow(user)}
                            >
                                {labelFor(user)}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedUsers;
