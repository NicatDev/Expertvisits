'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { chatApi } from '@/lib/api/chat';
import Avatar from '@/components/ui/Avatar';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

export default function NewChatModal({ open, onClose, onChatStarted }) {
    const { t } = useTranslation('common');
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingId, setStartingId] = useState(null);
    const timer = useRef(null);

    const runSearch = useCallback(async (term) => {
        const s = term.trim();
        if (s.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await chatApi.searchUsers(s);
            setResults(Array.isArray(data) ? data : data.results || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            setQ('');
            setResults([]);
            return;
        }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => runSearch(q), 280);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [q, open, runSearch]);

    const pickUser = async (u) => {
        setStartingId(u.id);
        try {
            const { data } = await chatApi.createOrGet(u.id);
            onChatStarted(data.chat_id);
            onClose();
        } catch {
            toast.error(t('common.error_generic'));
            setStartingId(null);
        }
    };

    if (!open) return null;

    return (
        <div className={styles.overlay} role="presentation" onClick={onClose}>
            <div
                className={styles.panel}
                role="dialog"
                aria-labelledby="new-chat-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.head}>
                    <h2 id="new-chat-title">{t('inbox.new_chat_title')}</h2>
                    <button type="button" className={styles.close} onClick={onClose} aria-label={t('common.cancel')}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.searchWrap}>
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder={t('inbox.search_people_placeholder')}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        autoFocus
                    />
                    <p className={styles.hint}>{t('inbox.search_min_hint')}</p>
                </div>
                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.loading}>{t('common.loading')}</div>
                    ) : q.trim().length < 2 ? null : results.length === 0 ? (
                        <div className={styles.empty}>{t('inbox.no_users_found')}</div>
                    ) : (
                        results.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                className={styles.row}
                                disabled={startingId === u.id}
                                onClick={() => pickUser(u)}
                            >
                                <Avatar
                                    user={{
                                        username: u.username,
                                        first_name: u.name,
                                        last_name: u.surname,
                                        avatar: u.profile_image,
                                        avatar_compressed: u.profile_image_compressed,
                                    }}
                                    size={44}
                                />
                                <div>
                                    <div className={styles.name}>
                                        {`${u.name || ''} ${u.surname || ''}`.trim() || u.username}
                                    </div>
                                    <div className={styles.sub}>@{u.username}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
