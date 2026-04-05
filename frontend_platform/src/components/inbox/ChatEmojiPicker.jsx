'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import styles from './ChatEmojiPicker.module.scss';

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '💪', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
    '🔥', '✨', '💯', '🎉', '👀', '🙏', '💬', '📎', '✅', '❌', '⚠️', '❓', '💼', '📅', '⏰', '☕',
];

export default function ChatEmojiPicker({ onPick, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const close = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('touchstart', close, { passive: true });
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
        };
    }, [open]);

    return (
        <div className={styles.wrap} ref={rootRef}>
            <button
                type="button"
                className={styles.toggle}
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Smile size={22} strokeWidth={2} />
            </button>
            {open ? (
                <div className={styles.panel} role="listbox">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className={styles.emojiBtn}
                            onClick={() => {
                                onPick(emoji);
                                setOpen(false);
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
