"use client";

import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { LanguageContext } from '@/lib/contexts/LanguageContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useInboxSocket } from '@/lib/contexts/InboxSocketContext';
import { chatApi } from '@/lib/api/chat';
import Avatar from '@/components/ui/Avatar';
import ChatEmojiPicker from '@/components/inbox/ChatEmojiPicker';
import styles from './room.module.scss';

const PAGE_SIZE = 50;

function formatChatMessageTime(iso, lng) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const loc = lng === 'az' ? 'az-AZ' : lng === 'ru' ? 'ru-RU' : 'en-US';
    return d.toLocaleString(loc, { dateStyle: 'short', timeStyle: 'short' });
}

export default function ChatRoomPage() {
    const params = useParams();
    const roomId = params?.roomId;
    const { t } = useTranslation('common');
    const { lng } = useContext(LanguageContext);
    const { user, loading: authLoading } = useAuth();
    const { sendWs, refreshSummary } = useInboxSocket();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [peer, setPeer] = useState(null);
    const [nextBeforeId, setNextBeforeId] = useState(null);
    const [loadingOlder, setLoadingOlder] = useState(false);

    const threadRef = useRef(null);
    const inputRef = useRef(null);
    const bottomRef = useRef(null);
    const prependMeta = useRef({ active: false, prevScrollHeight: 0 });
    const loadingOlderRef = useRef(false);

    const scrollThreadToBottom = useCallback(() => {
        const el = threadRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, []);

    const load = useCallback(async () => {
        if (!roomId) return;
        const { data } = await chatApi.messages(roomId, { limit: PAGE_SIZE });
        setMessages(data.results || []);
        setNextBeforeId(data.next_before_id ?? null);
    }, [roomId]);

    const fetchOlder = useCallback(async () => {
        if (!roomId || loadingOlderRef.current || !nextBeforeId) return;
        const threadEl = threadRef.current;
        const oldestId = messages[0]?.id;
        if (oldestId == null) return;

        loadingOlderRef.current = true;
        setLoadingOlder(true);
        const prevH = threadEl?.scrollHeight ?? 0;
        prependMeta.current = { active: true, prevScrollHeight: prevH };

        try {
            const { data } = await chatApi.messages(roomId, {
                limit: 40,
                before_id: oldestId,
            });
            const batch = data.results || [];
            setNextBeforeId(data.next_before_id ?? null);
            if (batch.length) {
                setMessages((prev) => [...batch, ...prev]);
            } else {
                prependMeta.current.active = false;
            }
        } catch {
            prependMeta.current.active = false;
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }, [roomId, nextBeforeId, messages]);

    useLayoutEffect(() => {
        if (!prependMeta.current.active) return;
        const el = threadRef.current;
        const { prevScrollHeight } = prependMeta.current;
        prependMeta.current.active = false;
        if (el) {
            el.scrollTop = Math.max(0, el.scrollHeight - prevScrollHeight);
        }
    }, [messages]);

    useEffect(() => {
        if (!user || !roomId) return;
        sendWs({ action: 'subscribe_chat', chat_id: Number(roomId) });
    }, [user, roomId, sendWs]);

    useEffect(() => {
        if (!user?.id || !roomId) return;
        let cancelled = false;
        chatApi
            .rooms()
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : data.results || [];
                const r = list.find((x) => String(x.id) === String(roomId));
                if (!cancelled) setPeer(r?.other_user || null);
            })
            .catch(() => {
                if (!cancelled) setPeer(null);
            });
        return () => {
            cancelled = true;
        };
    }, [roomId, user?.id]);

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
                requestAnimationFrame(() => scrollThreadToBottom());
            } catch {
                router.push('/chat');
            }
        })();
    }, [user, authLoading, roomId, router, load, refreshSummary, scrollThreadToBottom]);

    useEffect(() => {
        const h = (e) => {
            const p = e.detail;
            if (p?.type === 'read_receipt' && String(p.chat_id) === String(roomId) && user?.id) {
                const maxId = p.message_id;
                if (maxId == null) return;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.sender_id === user.id && msg.id <= maxId
                            ? { ...msg, read_at: msg.read_at || new Date().toISOString() }
                            : msg
                    )
                );
                return;
            }
            const m = p?.message;
            if (!m || String(m.chat_id) !== String(roomId)) return;
            if (p.type === 'message_ack' || p.type === 'chat_message') {
                setMessages((prev) => {
                    if (prev.some((x) => x.id === m.id)) return prev;
                    return [...prev, m];
                });
                requestAnimationFrame(() => scrollThreadToBottom());
            }
        };
        window.addEventListener('chat-live-message', h);
        return () => window.removeEventListener('chat-live-message', h);
    }, [roomId, scrollThreadToBottom, user?.id]);

    const topSentinelRef = useRef(null);
    useEffect(() => {
        const root = threadRef.current;
        const target = topSentinelRef.current;
        if (!root || !target || !nextBeforeId) return undefined;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                if (loadingOlderRef.current) return;
                fetchOlder();
            },
            { root, rootMargin: '120px 0px 0px 0px', threshold: 0 }
        );
        io.observe(target);
        return () => io.disconnect();
    }, [nextBeforeId, fetchOlder, messages.length]);

    const send = () => {
        const v = text.trim();
        if (!v || !roomId) return;
        sendWs({ action: 'send_message', chat_id: Number(roomId), text: v });
        setText('');
        inputRef.current?.focus();
    };

    const insertEmoji = (emoji) => {
        const el = inputRef.current;
        if (!el) {
            setText((prev) => prev + emoji);
            return;
        }
        const start = el.selectionStart ?? text.length;
        const end = el.selectionEnd ?? text.length;
        const next = text.slice(0, start) + emoji + text.slice(end);
        setText(next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + emoji.length;
            try {
                el.setSelectionRange(pos, pos);
            } catch {
                /* ignore */
            }
        });
    };

    const displayName =
        (peer && `${peer.name || ''} ${peer.surname || ''}`.trim()) || peer?.username || '';

    if (!user && !authLoading) return null;

    return (
        <div className={styles.shell}>
            <div className={styles.card}>
                <div className={styles.topBar}>
                    <Link
                        href="/chat"
                        className={styles.back}
                        aria-label={t('inbox.back_to_list')}
                        title={t('inbox.back_to_list')}
                    >
                        <ArrowLeft size={22} strokeWidth={2.25} aria-hidden />
                    </Link>
                    {peer?.username ? (
                        <Link href={`/user/${peer.username}`} className={styles.peer}>
                            <Avatar
                                user={{
                                    username: peer.username,
                                    first_name: peer.name,
                                    last_name: peer.surname,
                                    avatar: peer.profile_image,
                                    avatar_compressed: peer.profile_image_compressed,
                                }}
                                size={40}
                            />
                            <div className={styles.peerMeta}>
                                <div className={styles.peerName}>{displayName || peer.username}</div>
                                <div className={styles.peerHint}>@{peer.username}</div>
                            </div>
                        </Link>
                    ) : (
                        <div className={styles.peerMeta}>
                            <div className={styles.peerName}>{t('inbox.chat')}</div>
                        </div>
                    )}
                </div>
                <div className={styles.thread} ref={threadRef}>
                    <div ref={topSentinelRef} className={styles.topSentinel} aria-hidden />
                    {nextBeforeId ? (
                        <button
                            type="button"
                            className={styles.loadOlder}
                            disabled={loadingOlder}
                            onClick={() => fetchOlder()}
                        >
                            {loadingOlder ? t('common.loading') : t('inbox.load_older_messages')}
                        </button>
                    ) : null}
                    {messages.map((m, idx) => {
                        const isMine = m.sender_id === user?.id;
                        const isLast = idx === messages.length - 1;
                        const showReadTicks = isLast && isMine;
                        return (
                            <div
                                key={m.id}
                                className={`${styles.bubbleCol} ${
                                    isMine ? styles.bubbleColMine : styles.bubbleColTheirs
                                }`}
                            >
                                <div
                                    className={`${styles.bubble} ${
                                        isMine ? styles.bubbleMine : styles.bubbleTheirs
                                    }`}
                                >
                                    {m.text}
                                </div>
                                <div className={styles.bubbleMeta}>
                                    <time dateTime={m.created_at}>
                                        {formatChatMessageTime(m.created_at, lng)}
                                    </time>
                                    {showReadTicks ? (
                                        <span
                                            className={`${styles.readTicks} ${m.read_at ? styles.read : ''}`}
                                            title={
                                                m.read_at
                                                    ? t('inbox.message_seen')
                                                    : t('inbox.message_not_seen')
                                            }
                                            aria-label={
                                                m.read_at
                                                    ? t('inbox.message_seen')
                                                    : t('inbox.message_not_seen')
                                            }
                                        >
                                            {m.read_at ? (
                                                <CheckCheck size={15} strokeWidth={2.5} />
                                            ) : (
                                                <Check size={15} strokeWidth={2.5} />
                                            )}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
                <div className={styles.composer}>
                    <ChatEmojiPicker onPick={insertEmoji} ariaLabel={t('inbox.emoji_picker')} />
                    <input
                        ref={inputRef}
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
        </div>
    );
}
