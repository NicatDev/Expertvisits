'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { notificationsApi } from '@/lib/api/notifications';
import { getChatWebSocketUrlWithToken } from '@/lib/utils/wsUrl';

const InboxSocketContext = createContext(null);

export function InboxSocketProvider({ children }) {
    const { user } = useAuth();
    const [notificationUnread, setNotificationUnread] = useState(0);
    const [chatUnread, setChatUnread] = useState(0);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef(null);
    const refreshTimer = useRef(null);

    const refreshSummary = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) return;
        try {
            const { data } = await notificationsApi.summary();
            setNotificationUnread(data.notification_unread ?? 0);
            setChatUnread(data.chat_unread ?? 0);
        } catch {
            /* ignore */
        }
    }, []);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
            refreshSummary();
        }, 250);
    }, [refreshSummary]);

    useEffect(() => {
        if (!user) {
            setNotificationUnread(0);
            setChatUnread(0);
            return;
        }
        refreshSummary();
    }, [user, refreshSummary]);

    useEffect(() => {
        if (!user) return undefined;
        const onVis = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                refreshSummary();
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [user, refreshSummary]);

    useEffect(() => {
        if (!user) return undefined;

        let closed = false;
        const connect = () => {
            const url = getChatWebSocketUrlWithToken();
            let ws;
            try {
                ws = new WebSocket(url);
            } catch {
                return;
            }
            wsRef.current = ws;

            ws.onopen = () => {
                if (!closed) setWsConnected(true);
            };
            ws.onclose = () => {
                setWsConnected(false);
                if (!closed) {
                    setTimeout(connect, 4000);
                }
            };
            ws.onerror = () => {
                try {
                    ws.close();
                } catch {
                    /* ignore */
                }
            };
            ws.onmessage = (ev) => {
                let payload;
                try {
                    payload = JSON.parse(ev.data);
                } catch {
                    return;
                }
                const t = payload.type;
                if (
                    t === 'badge_refresh' ||
                    t === 'inbox_notification' ||
                    t === 'connection_request' ||
                    t === 'chat_message' ||
                    t === 'message_ack' ||
                    t === 'mark_read_ack'
                ) {
                    scheduleRefresh();
                }
                if (t === 'chat_message' || t === 'message_ack' || t === 'typing' || t === 'read_receipt') {
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('chat-live-message', { detail: payload }));
                    }
                }
                if (t === 'chat_rooms_refresh') {
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('chat-rooms-refresh'));
                    }
                    scheduleRefresh();
                }
            };
        };

        connect();
        return () => {
            closed = true;
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            try {
                wsRef.current?.close();
            } catch {
                /* ignore */
            }
            wsRef.current = null;
        };
    }, [user, scheduleRefresh]);

    const sendWs = useCallback((obj) => {
        const raw = wsRef.current;
        if (raw && raw.readyState === WebSocket.OPEN) {
            raw.send(JSON.stringify(obj));
        }
    }, []);

    const value = {
        notificationUnread,
        chatUnread,
        refreshSummary,
        wsConnected,
        sendWs,
    };

    return (
        <InboxSocketContext.Provider value={value}>{children}</InboxSocketContext.Provider>
    );
}

export function useInboxSocket() {
    const ctx = useContext(InboxSocketContext);
    if (!ctx) {
        return {
            notificationUnread: 0,
            chatUnread: 0,
            refreshSummary: async () => {},
            wsConnected: false,
            sendWs: () => {},
        };
    }
    return ctx;
}
