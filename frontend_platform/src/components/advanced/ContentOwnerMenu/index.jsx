'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/i18n/client';
import { content } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EditArticleModal from '@/components/advanced/EditArticleModal';
import styles from './style.module.scss';

/**
 * Məzmun sahibi üçün redaktə/sil menyusu (feed kartı və detal səhifələri).
 */
export default function ContentOwnerMenu({
    authorUsername,
    contentType,
    article = null,
    quiz = null,
    onArticleUpdated,
    onDeleted,
    redirectTo,
    className = '',
}) {
    const { user } = useAuth();
    const { t } = useTranslation('common');
    const router = useRouter();
    const menuRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (!showMenu) return;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [showMenu]);

    if (!user?.username || user.username !== authorUsername) {
        return null;
    }

    const handleDeleteConfirm = async () => {
        try {
            if (contentType === 'article' && article?.slug) {
                await content.deleteArticle(article.slug);
            } else if (contentType === 'quiz' && quiz?.slug) {
                await content.deleteQuiz(quiz.slug);
            } else {
                toast.error(t('feed_item.toast.failed_delete'));
                return;
            }
            toast.success(t('feed_item.toast.deleted'));
            setShowDeleteModal(false);
            if (onDeleted) {
                onDeleted();
            } else if (redirectTo) {
                router.push(redirectTo);
            } else {
                router.push('/');
            }
        } catch (err) {
            console.error(err);
            toast.error(t('feed_item.toast.failed_delete'));
        }
    };

    return (
        <>
            <div ref={menuRef} className={`${styles.wrap} ${className}`.trim()}>
                <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => setShowMenu((v) => !v)}
                    aria-expanded={showMenu}
                    aria-haspopup="menu"
                >
                    <MoreHorizontal size={20} />
                </button>
                {showMenu ? (
                    <div className={styles.dropdown} role="menu">
                        {contentType === 'article' && article ? (
                            <button
                                type="button"
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => {
                                    setShowMenu(false);
                                    setShowEditModal(true);
                                }}
                            >
                                <Edit2 size={16} />
                                {t('common.edit')}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.menuItem} ${styles.danger}`}
                            onClick={() => {
                                setShowMenu(false);
                                setShowDeleteModal(true);
                            }}
                        >
                            <Trash2 size={16} />
                            {t('common.delete')}
                        </button>
                    </div>
                ) : null}
            </div>

            {contentType === 'article' && article ? (
                <EditArticleModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    article={article}
                    onSuccess={(updatedData) => {
                        onArticleUpdated?.(updatedData);
                    }}
                />
            ) : null}

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('profile.modals.delete_title')}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button type="default" onClick={() => setShowDeleteModal(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="primary" danger onClick={handleDeleteConfirm}>
                            {t('common.delete')}
                        </Button>
                    </div>
                }
            >
                <p>{t('feed_item.toast.delete_confirm')}</p>
            </Modal>
        </>
    );
}
