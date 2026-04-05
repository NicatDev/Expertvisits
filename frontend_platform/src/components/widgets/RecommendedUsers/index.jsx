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

const RecommendedUsers = () => {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language || 'az';
    const { user: currentUser } = useAuth();
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
                }
            });
            const list = data.results || data;
            setUsers(list.filter(u => u.username).slice(0, 5));
        } catch (error) {
            console.error("Failed to load users", error);
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
                toast.info(t('inbox.pending_in_hint'));
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
        if (user.connection_pending_in) return t('widgets.accept_in_notifications');
        if (user.connection_pending_out) {
            return user.outgoing_connection_request_id
                ? t('widgets.cancel_request')
                : t('widgets.pending_request');
        }
        return t('widgets.follow');
    };

    if (!isMounted) return <div className={styles.container}>...</div>;
    if (loading) return <div className={styles.container}>{t('widgets.loading')}</div>;
    if (users.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{t('widgets.recommended_users')}</h3>
            <div className={styles.list}>
                {users.map(user => (
                    <div key={user.id} className={styles.item}>
                        <Avatar user={user} size={40} className={styles.avatar} />
                        <div className={styles.info}>
                            <Link href={`/user/${user.username}`} className={styles.name}>
                                {user.first_name} {user.last_name}
                            </Link>
                            <span className={styles.followers} style={{ color: '#999', fontSize: '12px' }}>
                                {user.profession_sub_category?.[`profession_${currentLang}`] || user.profession_sub_category?.[`name_${currentLang}`] || t('widgets.user_role')}
                            </span>
                        </div>
                        {user.connection_pending_in ? (
                            <Link href="/notifications" className={styles.notifLink}>
                                {t('widgets.accept_in_notifications')}
                            </Link>
                        ) : (
                            <button
                                className={`${styles.followBtn} ${user.is_following ? styles.following : ''}`}
                                onClick={() => handleFollow(user)}
                            >
                                {labelFor(user)}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedUsers;
