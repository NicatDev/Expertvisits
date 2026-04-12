'use client';

import { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';
import styles from '../style.module.scss';

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

/**
 * Məqalə HTML məzmunu: kod bloklarına kopyala, xarici linklər, şəkillər.
 * Semaantika üçün <section> + mövcud .body tipografiyası.
 */
export default function ArticleBodyContent({ html, ariaLabel }) {
    const rootRef = useRef(null);
    const { t } = useTranslation('common');

    useEffect(() => {
        const root = rootRef.current;
        if (!root || !html) return;

        const labelGroup = t('article_page.code_block_group');
        const labelCopy = t('article_page.copy_code');
        const msgOk = t('article_page.code_copied');
        const msgErr = t('article_page.copy_failed');

        root.querySelectorAll('pre').forEach((pre) => {
            if (pre.closest('[data-ev-code-wrap="1"]')) return;

            const wrap = document.createElement('div');
            wrap.className = styles.codeBlockOuter;
            wrap.setAttribute('data-ev-code-wrap', '1');
            wrap.setAttribute('role', 'group');
            wrap.setAttribute('aria-label', labelGroup);

            const toolbar = document.createElement('div');
            toolbar.className = styles.codeToolbar;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = styles.codeCopyBtn;
            btn.setAttribute('aria-label', labelCopy);
            btn.innerHTML = COPY_SVG;

            const preEl = pre;
            btn.addEventListener('click', async () => {
                const code = preEl.querySelector('code');
                const text = (code?.textContent ?? preEl.textContent ?? '').replace(/\u00a0/g, ' ');
                try {
                    await navigator.clipboard.writeText(text);
                    toast.success(msgOk);
                } catch {
                    toast.error(msgErr);
                }
            });

            toolbar.appendChild(btn);
            const parent = pre.parentNode;
            if (!parent) return;
            parent.insertBefore(wrap, preEl);
            wrap.appendChild(toolbar);
            wrap.appendChild(preEl);
        });

        root.querySelectorAll('a[href]').forEach((a) => {
            if (a.getAttribute('data-ev-external') === '1') return;
            try {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#')) return;
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) {
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            } catch {
                /* ignore */
            }
            a.setAttribute('data-ev-external', '1');
        });

        root.querySelectorAll('img').forEach((img) => {
            if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
            if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
        });

        root.querySelectorAll('table').forEach((table) => {
            if (table.parentElement?.classList.contains(styles.tableScroll)) return;
            const wrap = document.createElement('div');
            wrap.className = styles.tableScroll;
            table.parentNode?.insertBefore(wrap, table);
            wrap.appendChild(table);
        });
    }, [html, t]);

    return (
        <section
            ref={rootRef}
            className={styles.body}
            aria-label={ariaLabel}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
