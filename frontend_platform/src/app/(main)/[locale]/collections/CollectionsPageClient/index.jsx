'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Edit2, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { content } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';
import { defaultLocale, localeFromPathname, withLocale } from '@/lib/i18n/routing';
import Pagination from '@/components/ui/Pagination';
import styles from './style.module.scss';

function normalizeList(data) {
    return Array.isArray(data) ? data : data?.results || [];
}

function getTotalCount(data) {
    if (Array.isArray(data)) return data.length;
    return Number(data?.count || 0);
}

function CollectionEditorModal({
    open,
    onClose,
    onSubmit,
    initial,
    options,
    t,
}) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const [contentType, setContentType] = useState('article');
    const [selectedId, setSelectedId] = useState('');
    const [dragId, setDragId] = useState(null);

    useEffect(() => {
        if (!open) return;
        setTitle(initial?.title || '');
        setSummary(initial?.summary || '');
        setItems((initial?.items || []).filter((x) => x?.content_type && x?.content_id));
        setContentType('article');
        setSelectedId('');
    }, [open, initial]);

    const selectable = useMemo(() => {
        const base = contentType === 'article' ? options.articles : options.quizzes;
        const existing = new Set(
            items
                .filter((x) => x.content_type === contentType)
                .map((x) => String(x.content_id))
        );
        return (base || []).filter((x) => !existing.has(String(x.id)));
    }, [contentType, items, options]);

    const addSelected = () => {
        if (!selectedId) return;
        const source = contentType === 'article' ? options.articles : options.quizzes;
        const chosen = (source || []).find((x) => String(x.id) === String(selectedId));
        if (!chosen) return;
        setItems((prev) => [
            ...prev,
            {
                id: `tmp-${contentType}-${chosen.id}-${Date.now()}`,
                content_type: contentType,
                content_id: chosen.id,
                title: chosen.title,
                slug: chosen.slug,
                order: prev.length,
            },
        ]);
        setSelectedId('');
    };

    const removeItem = (id) => {
        setItems((prev) => prev.filter((x) => String(x.id) !== String(id)).map((x, idx) => ({ ...x, order: idx })));
    };

    const onDrop = (targetId) => {
        if (!dragId || dragId === targetId) return;
        setItems((prev) => {
            const from = prev.findIndex((x) => String(x.id) === String(dragId));
            const to = prev.findIndex((x) => String(x.id) === String(targetId));
            if (from < 0 || to < 0) return prev;
            const next = [...prev];
            const [picked] = next.splice(from, 1);
            next.splice(to, 0, picked);
            return next.map((x, idx) => ({ ...x, order: idx }));
        });
        setDragId(null);
    };

    const save = async () => {
        if (!title.trim()) {
            toast.error(t('collections_page.title_required'));
            return;
        }
        setSaving(true);
        try {
            await onSubmit({
                title: title.trim(),
                summary: summary.trim(),
                items: items.map((x, idx) => ({
                    content_type: x.content_type,
                    content_id: x.content_id,
                    order: idx,
                })),
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>{initial ? t('collections_page.edit_collection') : t('collections_page.create_collection')}</h2>
                <input
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('collections_page.title')}
                />
                <textarea
                    className={styles.textarea}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={t('collections_page.summary')}
                />
                <div className={styles.selectorRow}>
                    <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
                        <option value="article">{t('feed.article')}</option>
                        <option value="quiz">{t('feed.quiz')}</option>
                    </select>
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                        <option value="">{t('collections_page.select_content')}</option>
                        {selectable.map((x) => (
                            <option key={`${contentType}-${x.id}`} value={x.id}>
                                {x.title}
                            </option>
                        ))}
                    </select>
                    <button type="button" onClick={addSelected}>{t('collections_page.add')}</button>
                </div>

                <div className={styles.itemsBox}>
                    {items.map((it) => (
                        <div
                            key={it.id}
                            draggable
                            onDragStart={() => setDragId(it.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDrop(it.id)}
                            className={styles.itemRow}
                        >
                            <span className={styles.drag}><GripVertical size={16} /></span>
                            <span className={styles.itemType}>{it.content_type}</span>
                            <span className={styles.itemTitle}>{it.title}</span>
                            <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(it.id)}>
                                {t('common.delete')}
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.modalActions}>
                    <button type="button" onClick={onClose}>{t('common.cancel')}</button>
                    <button type="button" onClick={save} disabled={saving}>
                        {saving ? t('common.loading') : t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteCollectionModal({ open, onClose, onConfirm, t, deleting }) {
    if (!open) return null;
    return (
        <div className={styles.confirmOverlay} onClick={onClose} role="presentation">
            <div
                className={styles.confirmDialog}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="collections-delete-dialog-title"
            >
                <h3 id="collections-delete-dialog-title" className={styles.confirmTitle}>
                    {t('collections_page.delete_confirm_heading')}
                </h3>
                <p className={styles.confirmText}>{t('collections_page.confirm_delete')}</p>
                <div className={styles.confirmDialogActions}>
                    <button type="button" className={styles.confirmBtnSecondary} onClick={onClose} disabled={deleting}>
                        {t('common.cancel')}
                    </button>
                    <button type="button" className={styles.confirmBtnDanger} onClick={onConfirm} disabled={deleting}>
                        {deleting ? t('common.loading') : t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CollectionsPageClient() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const pathname = usePathname();
    const locale = localeFromPathname(pathname) || defaultLocale;
    const [scope, setScope] = useState('all');
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [options, setOptions] = useState({ articles: [], quizzes: [] });
    const [pendingDeleteSlug, setPendingDeleteSlug] = useState(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(timer);
    }, [query]);

    const load = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, scope, ...(debouncedQuery ? { search: debouncedQuery } : {}) };
            const { data } = await content.getCollections(params);
            setCollections(normalizeList(data));
            setTotalCount(getTotalCount(data));
        } catch (e) {
            console.error(e);
            toast.error(t('common.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [scope, debouncedQuery, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [scope, debouncedQuery]);

    const openCreate = async () => {
        if (!user) {
            toast.info(t('auth.login_required'));
            return;
        }
        try {
            const { data } = await content.getCollectionContentOptions();
            setOptions({ articles: data.articles || [], quizzes: data.quizzes || [] });
            setEditing(null);
            setModalOpen(true);
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const openEdit = async (collection) => {
        try {
            const [{ data: detail }, { data: opts }] = await Promise.all([
                content.getCollection(collection.slug),
                content.getCollectionContentOptions(),
            ]);
            setOptions({ articles: opts.articles || [], quizzes: opts.quizzes || [] });
            setEditing(detail);
            setModalOpen(true);
        } catch {
            toast.error(t('common.error_generic'));
        }
    };

    const submitModal = async (payload) => {
        if (editing) {
            await content.updateCollection(editing.slug, payload);
            toast.success(t('collections_page.updated'));
        } else {
            await content.createCollection(payload);
            toast.success(t('collections_page.created'));
        }
        await load();
    };

    const confirmRemoveCollection = async () => {
        if (!pendingDeleteSlug) return;
        setDeleteSubmitting(true);
        try {
            await content.deleteCollection(pendingDeleteSlug);
            setPendingDeleteSlug(null);
            await load();
        } catch {
            toast.error(t('common.error_generic'));
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const pageSize = 10;

    return (
        <div className={styles.page}>
            <h1>{t('collections_page.title_h1')}</h1>
            <p className={styles.subtitle}>{t('collections_page.subtitle')}</p>

            <div className={styles.controls}>
                <div className={styles.filters}>
                    <button
                        className={scope === 'all' ? styles.active : ''}
                        onClick={() => setScope('all')}
                    >
                        {t('collections_page.all_collections')}
                    </button>
                    <button
                        className={scope === 'mine' ? styles.active : ''}
                        onClick={() => setScope('mine')}
                    >
                        {t('collections_page.my_collections')}
                    </button>
                </div>
                <input
                    className={styles.search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('common.search')}
                />
                <button className={styles.createBtn} onClick={openCreate}>
                    <Plus size={16} /> {t('collections_page.create_collection')}
                </button>
            </div>

            {loading ? (
                <p className={styles.listLoading}>{t('common.loading')}</p>
            ) : collections.length === 0 ? (
                <div className={styles.emptyCollections}>
                    <h3>{t('collections_page.no_collections_title')}</h3>
                    <p>{t('collections_page.no_collections_desc')}</p>
                    <button className={styles.createBtn} onClick={openCreate}>
                        <Plus size={16} /> {t('collections_page.create_collection')}
                    </button>
                </div>
            ) : (
                <>
                    <ul className={styles.collectionList}>
                        {collections.map((c) => (
                            <li
                                className={`${styles.listRow} ${user && c.is_owner ? styles.listRowWithRail : ''}`}
                                key={c.id}
                            >
                                {user && c.is_owner ? (
                                    <div className={styles.ownerRail}>
                                        <button
                                            type="button"
                                            className={styles.railEdit}
                                            onClick={() => openEdit(c)}
                                            aria-label={t('common.edit')}
                                        >
                                            <Edit2 size={18} strokeWidth={2} aria-hidden />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.railDelete}
                                            onClick={() => setPendingDeleteSlug(c.slug)}
                                            aria-label={t('common.delete')}
                                        >
                                            <Trash2 size={18} strokeWidth={2} aria-hidden />
                                        </button>
                                    </div>
                                ) : null}
                                <div className={styles.listRowMain}>
                                    <div className={styles.listRowBody}>
                                        <Link
                                            href={withLocale(locale, `/collections/${c.slug}`)}
                                            className={styles.listTitle}
                                        >
                                            {c.title}
                                        </Link>
                                        <p className={styles.listSummary}>
                                            {c.summary || t('collections_page.no_summary')}
                                        </p>
                                        <div className={styles.listMeta}>
                                            <span className={styles.metaPill}>
                                                {t('collections_page.items_count', { count: c.item_count || 0 })}
                                            </span>
                                            <span className={styles.metaPill}>
                                                {t('collections_page.views_count', { count: c.view_count || 0 })}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href={withLocale(locale, `/collections/${c.slug}`)}
                                        className={styles.listOpenIcon}
                                        aria-label={t('collections_page.open_collection')}
                                    >
                                        <ChevronRight size={24} strokeWidth={2} aria-hidden />
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <Pagination
                        currentPage={currentPage}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        alwaysShow
                        className={styles.paginationBar}
                    />
                </>
            )}

            <DeleteCollectionModal
                open={Boolean(pendingDeleteSlug)}
                onClose={() => !deleteSubmitting && setPendingDeleteSlug(null)}
                onConfirm={confirmRemoveCollection}
                t={t}
                deleting={deleteSubmitting}
            />

            <CollectionEditorModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={submitModal}
                initial={editing}
                options={options}
                t={t}
            />
        </div>
    );
}

