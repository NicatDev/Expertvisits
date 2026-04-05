"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';
import { chatApi } from '@/lib/api/chat';
import styles from './room.module.scss';

export default function ChatRoomPage() {
    const params = useParams();
    const roomId = params?.roomId;
    const { t } = useTranslation('common');
    const { user, loading: authLoading } = useAuth();
    const { sendWs, refreshSummary } = useInboxSocket();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    const load = useCallback(async () => {
        if (!roomId) return;
        const { data } = await chatApi.messages(roomId, { limit: 50 });
        setMessages(data.results || []);
    }, [roomId]);

    useEffect(() => {
        if (!user || !roomId) return;
        sendWs({ action: 'subscribe_chat', chat_id: Number(roomId) });
    }, [user, roomId, sendWs]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (!roomId) return;
        (async () => {
            try {
                await load();
                await chatApi.markRoomRead(roomId);
                await refreshSummary();
            } catch {
                router.push('/chat');
            }
        })();
    }, [user, authLoading, roomId, router, load, refreshSummary]);

    useEffect(() => {
        const h = (e) => {
            const p = e.detail;
            const m = p?.message;
            if (!m || String(m.chat_id) !== String(roomId)) return;
            if (p.type === 'message_ack' || p.type === 'chat_message') {
                setMessages((prev) => {
                    if (prev.some((x) => x.id === m.id)) return prev;
                    return [...prev, m];
                });
            }
        };
        window.addEventListener('chat-live-message', h);
        return () => window.removeEventListener('chat-live-message', h);
    }, [roomId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const send = () => {
        const v = text.trim();
        if (!v || !roomId) return;
        sendWs({ action: 'send_message', chat_id: Number(roomId), text: v });
        setText('');
    };

    if (!user && !authLoading) return null;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <Link href="/chat" className={styles.back}>
                    ← {t('inbox.back_to_list')}
                </Link>
            </div>
            <div className={styles.thread}>
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`${styles.bubble} ${
                            m.sender_id === user?.id ? styles.mine : styles.theirs
                        }`}
                    >
                        {m.text}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className={styles.composer}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder={t('inbox.type_message')}
                    className={styles.input}
                />
                <button type="button" className={styles.sendBtn} onClick={send}>
                    {t('inbox.send')}
                </button>
            </div>
        </div>
    );
}
