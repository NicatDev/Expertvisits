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

function mergeMessageIntoRooms(prev, m, userId) {
    const cid = Number(m.chat_id);
    const idx = prev.findIndex((r) => Number(r.id) === cid);
    const preview = (m.text || '').slice(0, 120);

    if (idx === -1) {
        return { next: prev, missingRoom: true };
    }

    const row = { ...prev[idx] };
    row.last_message_preview = preview;
    row.last_message_at = m.created_at;
    if (Number(m.recipient_id) === userId) {
        row.unread_count = (Number(row.unread_count) || 0) + 1;
    }

    const rest = prev.filter((_, i) => i !== idx);
    return { next: [row, ...rest], missingRoom: false };
}

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
        const uid = user?.id;
        if (!uid) return undefined;

        const h = (e) => {
            const p = e.detail;
            if (!p?.message) return;
            if (p.type !== 'chat_message' && p.type !== 'message_ack') return;
            const m = p.message;
            setRooms((prev) => {
                const { next, missingRoom } = mergeMessageIntoRooms(prev, m, uid);
                if (missingRoom) {
                    queueMicrotask(() => fetchRooms());
                }
                return next;
            });
        };
        window.addEventListener('chat-live-message', h);
        return () => window.removeEventListener('chat-live-message', h);
    }, [user?.id, fetchRooms]);

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
