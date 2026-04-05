"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { chatApi } from '@/lib/api/chat';
import Avatar from '@/components/ui/Avatar';
import styles from './chat.module.scss';

export default function ChatListPage() {
    const { t } = useTranslation('common');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await chatApi.rooms();
            setRooms(Array.isArray(data) ? data : data.results || []);
        } catch {
            setRooms([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchRooms();
    }, [user, authLoading, router, fetchRooms]);

    useEffect(() => {
        const h = () => fetchRooms();
        window.addEventListener('chat-rooms-refresh', h);
        return () => window.removeEventListener('chat-rooms-refresh', h);
    }, [fetchRooms]);

    if (!user && !authLoading) return null;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <MessageCircle size={22} />
                <h1>{t('inbox.chat')}</h1>
            </div>
            {loading ? (
                <p className={styles.muted}>{t('common.loading')}</p>
            ) : rooms.length === 0 ? (
                <p className={styles.muted}>{t('inbox.empty_chat')}</p>
            ) : (
                <ul className={styles.list}>
                    {rooms.map((r) => (
                        <li key={r.id}>
                            <Link href={`/chat/${r.id}`} className={styles.row}>
                                <Avatar
                                    user={{
                                        username: r.other_user?.username || '',
                                        first_name: r.other_user?.name,
                                        last_name: r.other_user?.surname,
                                        avatar: r.other_user?.profile_image,
                                        avatar_compressed: r.other_user?.profile_image_compressed,
                                    }}
                                    size={48}
                                />
                                <div className={styles.rowBody}>
                                    <div className={styles.rowTop}>
                                        <span className={styles.name}>
                                            {`${r.other_user?.name || ''} ${r.other_user?.surname || ''}`.trim() ||
                                                r.other_user?.username ||
                                                '—'}
                                        </span>
                                        {r.unread_count > 0 ? (
                                            <span className={styles.badge}>{r.unread_count}</span>
                                        ) : null}
                                    </div>
                                    <p className={styles.last}>{r.last_message_preview || '—'}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
