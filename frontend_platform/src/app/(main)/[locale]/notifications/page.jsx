"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import { Bell, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';
import { notificationsApi } from '@/lib/api/notifications';
import { connectionsApi } from '@/lib/api/connections';
import { chatApi } from '@/lib/api/chat';
import Avatar from '@/components/ui/Avatar';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

const PAGE_LIMIT = 30;

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
        case 'vacancy_application':
            return t('inbox.vacancy_application');
        default:
            return kind;
    }
}

function formatNotifTime(iso, locale) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString(locale || undefined, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

export default function NotificationsPage() {
    const { t, i18n } = useTranslation('common');
    const pathname = usePathname();
    const pathLocale = localeFromPathname(pathname);
    const localePrefix = pathLocale || defaultLocale;
    const { user, loading: authLoading } = useAuth();
    const { refreshSummary } = useInboxSocket();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [nextBefore, setNextBefore] = useState(null);
    const [loading, setLoading] = useState(true);
    /** @type {Record<number, 'accepted' | 'declined'>} connection_request_id -> outcome */
    const [connectionOutcomeByRequestId, setConnectionOutcomeByRequestId] = useState({});
    /** ids currently being deleted (disable button, avoid double submit) */
    const [deletingIds, setDeletingIds] = useState(() => new Set());

    const load = useCallback(
        async (beforeId) => {
            const { data } = await notificationsApi.inbox({
                limit: PAGE_LIMIT,
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

    const acceptConn = async (n) => {
        const id = n.connection_request_id;
        if (!id) return;
        try {
            await connectionsApi.accept(id);
            toast.success(t('application_status.accepted'));
            await refreshSummary();
            setConnectionOutcomeByRequestId((prev) => ({ ...prev, [id]: 'accepted' }));
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const declineConn = async (n) => {
        const id = n.connection_request_id;
        if (!id) return;
        try {
            await connectionsApi.decline(id);
            await refreshSummary();
            setConnectionOutcomeByRequestId((prev) => ({ ...prev, [id]: 'declined' }));
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const deleteNotification = async (n) => {
        let proceed = false;
        setDeletingIds((prev) => {
            if (prev.has(n.id)) return prev;
            proceed = true;
            return new Set(prev).add(n.id);
        });
        if (!proceed) return;
        try {
            await notificationsApi.deleteInbox(n.id);
            setItems((prev) => prev.filter((x) => x.id !== n.id));
            if (n.connection_request_id) {
                setConnectionOutcomeByRequestId((prev) => {
                    const next = { ...prev };
                    delete next[n.connection_request_id];
                    return next;
                });
            }
            await refreshSummary();
        } catch (e) {
            if (e?.response?.status === 404) {
                // Artıq serverdə silinibsə UI-dan da çıxar.
                setItems((prev) => prev.filter((x) => x.id !== n.id));
            } else {
                toast.error(t('common.error_generic'));
            }
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(n.id);
                return next;
            });
        }
    };

    const openChatFromNotif = async (n) => {
        const uid = n.actor_id;
        const chatId = n.data?.chat_id;
        if (chatId) {
            router.push(withLocale(localePrefix, `/chat/${chatId}`));
            return;
        }
        if (!uid) return;
        try {
            const { data } = await chatApi.createOrGet(uid);
            router.push(withLocale(localePrefix, `/chat/${data.chat_id}`));
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const goProfile = (username) => {
        if (username) router.push(withLocale(localePrefix, `/user/${username}`));
    };

    if (!user && !authLoading) return null;

    const showLoadMore = Boolean(nextBefore) && items.length > 0;

    return (
        <div className={styles.shell}>
            <div className={styles.header}>
                <Bell size={26} strokeWidth={2} className={styles.headerIcon} />
                <h1>{t('inbox.notifications')}</h1>
            </div>
            {loading ? (
                <p className={styles.muted}>{t('common.loading')}</p>
            ) : items.length === 0 ? (
                <p className={styles.muted}>{t('inbox.empty_notifications')}</p>
            ) : (
                <ul className={styles.list}>
                    {items.map((n) => {
                        const connOutcome =
                            n.connection_request_id ? connectionOutcomeByRequestId[n.connection_request_id] : undefined;
                        const isDeleting = deletingIds.has(n.id);
                        return (
                        <li key={n.id} className={styles.card}>
                            <div className={styles.cardTop}>
                                {n.actor_username ? (
                                    <Link
                                        href={withLocale(localePrefix, `/user/${n.actor_username}`)}
                                        className={styles.avatarLink}
                                        aria-label={t('inbox.view_profile')}
                                    >
                                        <Avatar
                                            user={{
                                                username: n.actor_username || '',
                                                avatar: n.actor_avatar,
                                                avatar_compressed: n.actor_avatar_compressed,
                                            }}
                                            size={48}
                                        />
                                    </Link>
                                ) : (
                                    <Avatar
                                        user={{
                                            username: n.actor_username || '',
                                            avatar: n.actor_avatar,
                                            avatar_compressed: n.actor_avatar_compressed,
                                        }}
                                        size={48}
                                    />
                                )}
                                <div className={styles.cardBody}>
                                    <div className={styles.metaRow}>
                                        <span className={styles.kind}>{kindLabel(n.kind, t)}</span>
                                        <span className={styles.time}>
                                            {formatNotifTime(n.created_at, i18n.language)}
                                        </span>
                                    </div>
                                    {n.actor_username ? (
                                        <Link href={withLocale(localePrefix, `/user/${n.actor_username}`)} className={styles.actor}>
                                            {(n.actor_first_name || '') + ' ' + (n.actor_last_name || '')}
                                            <span className={styles.un}> @{n.actor_username}</span>
                                        </Link>
                                    ) : (
                                        <span className={styles.actor}>
                                            {(n.actor_first_name || '') + ' ' + (n.actor_last_name || '')}
                                        </span>
                                    )}
                                    {n.body ? <p className={styles.preview}>{n.body}</p> : null}
                                </div>
                                <button
                                    type="button"
                                    className={styles.btnDelete}
                                    onClick={() => deleteNotification(n)}
                                    disabled={isDeleting}
                                    aria-label={t('inbox.delete_notification_aria')}
                                    title={t('inbox.delete_notification')}
                                >
                                    <Trash2 size={18} strokeWidth={2} aria-hidden />
                                </button>
                            </div>
                            <div className={styles.actions}>
                                {n.kind === 'connection_request' && n.connection_request_id ? (
                                    connOutcome === 'accepted' ? (
                                        <span className={styles.resolvedStatus}>
                                            {t('inbox.connection_resolved_accepted')}
                                        </span>
                                    ) : connOutcome === 'declined' ? (
                                        <span className={styles.resolvedStatus}>
                                            {t('inbox.connection_resolved_declined')}
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className={styles.btnPrimary}
                                                onClick={() => acceptConn(n)}
                                            >
                                                {t('inbox.accept')}
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.btnGhost}
                                                onClick={() => declineConn(n)}
                                            >
                                                {t('inbox.decline')}
                                            </button>
                                        </>
                                    )
                                ) : null}
                                {(n.kind === 'chat_message' || n.kind === 'chat_request') && (
                                    <>
                                        <button
                                            type="button"
                                            className={styles.btnPrimary}
                                            onClick={() => openChatFromNotif(n)}
                                        >
                                            {t('inbox.open_chat')}
                                        </button>
                                        {n.actor_username ? (
                                            <button
                                                type="button"
                                                className={styles.btnLink}
                                                onClick={() => goProfile(n.actor_username)}
                                            >
                                                {t('inbox.view_profile')}
                                            </button>
                                        ) : null}
                                    </>
                                )}
                                {n.kind === 'vacancy_application' && n.data?.vacancy_slug ? (
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={() =>
                                            router.push(
                                                withLocale(localePrefix, `/vacancies/${n.data.vacancy_slug}`)
                                            )
                                        }
                                    >
                                        {t('inbox.view_vacancy')}
                                    </button>
                                ) : null}
                            </div>
                        </li>
                        );
                    })}
                </ul>
            )}
            {showLoadMore ? (
                <button type="button" className={styles.loadMore} onClick={loadMore}>
                    {t('inbox.load_more')}
                </button>
            ) : null}
            <div className={styles.footerLink}>
                <Link href={withLocale(localePrefix, '/')}>{t('nav.home')}</Link>
            </div>
        </div>
    );
}
