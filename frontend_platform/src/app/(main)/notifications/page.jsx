"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';
import { notificationsApi } from '@/lib/api/notifications';
import { connectionsApi } from '@/lib/api/connections';
import { chatApi } from '@/lib/api/chat';
import Avatar from '@/components/ui/Avatar';
import { toast } from 'react-toastify';
import styles from './page.module.scss';

function kindLabel(kind, t) {
    switch (kind) {
        case 'connection_request':
            return t('inbox.connection_request');
        case 'connection_accepted':
            return t('inbox.connection_accepted');
        case 'chat_request':
            return t('inbox.chat_request');
        case 'chat_message':
            return t('inbox.new_message');
        default:
            return kind;
    }
}

export default function NotificationsPage() {
    const { t } = useTranslation('common');
    const { user, loading: authLoading } = useAuth();
    const { refreshSummary } = useInboxSocket();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [nextBefore, setNextBefore] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(
        async (beforeId) => {
            const { data } = await notificationsApi.inbox({
                limit: 30,
                ...(beforeId ? { before_id: beforeId } : {}),
            });
            return data;
        },
        []
    );

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await notificationsApi.markAllRead();
                await refreshSummary();
                const data = await load();
                if (!cancelled) {
                    setItems(data.results || []);
                    setNextBefore(data.next_before_id);
                }
            } catch (e) {
                if (!cancelled) toast.error(t('common.error_generic'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user, authLoading, router, load, refreshSummary, t]);

    const loadMore = async () => {
        if (!nextBefore) return;
        try {
            const data = await load(nextBefore);
            setItems((prev) => [...prev, ...(data.results || [])]);
            setNextBefore(data.next_before_id);
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const acceptConn = async (id) => {
        try {
            await connectionsApi.accept(id);
            toast.success(t('application_status.accepted'));
            await refreshSummary();
            setItems((prev) =>
                prev.map((n) =>
                    n.connection_request_id === id ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const declineConn = async (id) => {
        try {
            await connectionsApi.decline(id);
            await refreshSummary();
            setItems((prev) => prev.filter((n) => n.connection_request_id !== id));
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const openChatFromNotif = async (n) => {
        const uid = n.actor_id;
        const chatId = n.data?.chat_id;
        if (chatId) {
            router.push(`/chat/${chatId}`);
            return;
        }
        if (!uid) return;
        try {
            const { data } = await chatApi.createOrGet(uid);
            router.push(`/chat/${data.chat_id}`);
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    if (!user && !authLoading) return null;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Bell size={22} />
                <h1>{t('inbox.notifications')}</h1>
            </div>
            {loading ? (
                <p className={styles.muted}>{t('common.loading')}</p>
            ) : items.length === 0 ? (
                <p className={styles.muted}>{t('inbox.empty_notifications')}</p>
            ) : (
                <ul className={styles.list}>
                    {items.map((n) => (
                        <li key={n.id} className={styles.card}>
                            <div className={styles.cardTop}>
                                <Avatar
                                    user={{
                                        username: n.actor_username || '',
                                        avatar: n.actor_avatar,
                                        avatar_compressed: n.actor_avatar_compressed,
                                    }}
                                    size={44}
                                />
                                <div className={styles.cardBody}>
                                    <div className={styles.kind}>{kindLabel(n.kind, t)}</div>
                                    <div className={styles.actor}>
                                        {(n.actor_first_name || '') + ' ' + (n.actor_last_name || '')}
                                        {n.actor_username ? (
                                            <span className={styles.un}> @{n.actor_username}</span>
                                        ) : null}
                                    </div>
                                    {n.body ? <p className={styles.preview}>{n.body}</p> : null}
                                </div>
                            </div>
                            <div className={styles.actions}>
                                {n.kind === 'connection_request' && n.connection_request_id ? (
                                    <>
                                        <button
                                            type="button"
                                            className={styles.btnPrimary}
                                            onClick={() => acceptConn(n.connection_request_id)}
                                        >
                                            {t('inbox.accept')}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.btnGhost}
                                            onClick={() => declineConn(n.connection_request_id)}
                                        >
                                            {t('inbox.decline')}
                                        </button>
                                    </>
                                ) : null}
                                {(n.kind === 'chat_message' || n.kind === 'chat_request') && (
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={() => openChatFromNotif(n)}
                                    >
                                        {t('inbox.open_chat')}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {nextBefore ? (
                <button type="button" className={styles.loadMore} onClick={loadMore}>
                    {t('inbox.load_more')}
                </button>
            ) : null}
            <div className={styles.footerLink}>
                <Link href="/">{t('nav.home')}</Link>
            </div>
        </div>
    );
}
