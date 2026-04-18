"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { business } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

/**
 * @param {'collaborator'|'partner'} kind
 * @param {boolean} isOwner
 * @param {number} companyId
 * @param {Array} items — company.collaborators | company.partners
 * @param {() => Promise<void>} onRefresh — e.g. loadCompany
 * @param {string} sectionClassName
 */
export default function EntityCompanyPartnerCardsTab({
    kind,
    isOwner,
    companyId,
    items: itemsProp,
    onRefresh,
    sectionClassName = '',
}) {
    const { t } = useTranslation('common');
    const items = Array.isArray(itemsProp) ? itemsProp : [];

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, id: null });

    const openCreate = () => {
        setEditing(null);
        setTitle('');
        setLogoFile(null);
        setLogoPreview(null);
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setTitle(row.title || '');
        setLogoFile(null);
        setLogoPreview(row.logo || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setTitle('');
        setLogoFile(null);
        setLogoPreview(null);
    };

    const onPickLogo = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        setLogoPreview(URL.createObjectURL(f));
        e.target.value = '';
    };

    const handleSave = async () => {
        const trimmed = (title || '').trim();
        if (!trimmed) {
            toast.error(t('company_detail.partner_cards.title_required'));
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title', trimmed);
            fd.append('company', String(companyId));
            fd.append('kind', kind);
            if (logoFile) {
                fd.append('logo', logoFile);
            } else if (editing && !logoPreview) {
                fd.append('delete_logo', 'true');
            }
            if (editing?.id) {
                await business.updatePartnerCard(editing.id, fd);
            } else {
                await business.createPartnerCard(fd);
            }
            await onRefresh?.();
            toast.success(t('company_detail.partner_cards.saved'));
            closeModal();
        } catch (err) {
            console.error(err);
            toast.error(t('company_detail.partner_cards.save_failed'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await business.deletePartnerCard(id);
            await onRefresh?.();
            toast.success(t('company_detail.partner_cards.deleted'));
        } catch (err) {
            console.error(err);
            toast.error(t('company_detail.partner_cards.delete_failed'));
        }
        setConfirm({ open: false, id: null });
    };

    const sectionTitle =
        kind === 'collaborator'
            ? t('company_detail.tabs.collaborators')
            : t('company_detail.tabs.partners');

    return (
        <div className={sectionClassName.trim()}>
            <div className={styles.sectionHeader}>
                <h2>{sectionTitle}</h2>
            </div>

            <div className={styles.grid}>
                {items.length === 0 && !isOwner && (
                    <div className={styles.empty}>{t('company_detail.partner_cards.empty')}</div>
                )}

                {items.map((row) => (
                    <div key={row.id} className={styles.card}>
                        {isOwner && (
                            <div className={styles.cardActions}>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    title={t('company_detail.partner_cards.edit')}
                                    onClick={() => openEdit(row)}
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                    title={t('company_detail.partner_cards.delete')}
                                    onClick={() => setConfirm({ open: true, id: row.id })}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                        <div className={styles.logoWrap}>
                            {row.logo ? (
                                <img src={row.logo} alt="" className={styles.logo} />
                            ) : (
                                <span className={styles.logoPlaceholder}>
                                    {t('company_detail.partner_cards.no_logo')}
                                </span>
                            )}
                        </div>
                        <p className={styles.title}>{row.title}</p>
                    </div>
                ))}

                {isOwner && (
                    <button type="button" className={styles.addCard} onClick={openCreate}>
                        <Plus size={36} strokeWidth={1.5} />
                        <span>{t('company_detail.partner_cards.add')}</span>
                    </button>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={
                    editing
                        ? t('company_detail.partner_cards.edit_title')
                        : t('company_detail.partner_cards.add_title')
                }
                footer={
                    <>
                        <Button type="default" onClick={closeModal} disabled={saving}>
                            {t('company_detail.section_modal.cancel')}
                        </Button>
                        <Button type="primary" onClick={handleSave} loading={saving}>
                            {t('company_detail.section_modal.save')}
                        </Button>
                    </>
                }
            >
                <div className={styles.modalBody}>
                    <Input
                        label={t('company_detail.partner_cards.title_label')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 8,
                                fontWeight: 500,
                                color: '#333',
                                fontSize: 14,
                            }}
                        >
                            {t('company_detail.partner_cards.logo_label')}
                        </label>
                        {logoPreview ? (
                            <img src={logoPreview} alt="" className={styles.logoPreview} />
                        ) : null}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            <Button type="default" size="small" onClick={() => document.getElementById('partner-logo-input')?.click()}>
                                {logoPreview ? t('common.change') : t('company_detail.partner_cards.upload_logo')}
                            </Button>
                            {logoPreview && (
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={() => {
                                        setLogoFile(null);
                                        setLogoPreview(null);
                                    }}
                                >
                                    {t('common.delete')}
                                </Button>
                            )}
                        </div>
                        <input id="partner-logo-input" type="file" accept="image/*" hidden onChange={onPickLogo} />
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
                            {t('company_detail.partner_cards.logo_hint')}
                        </p>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={confirm.open}
                onClose={() => setConfirm({ open: false, id: null })}
                onConfirm={() => confirm.id && handleDelete(confirm.id)}
                title={t('company_detail.partner_cards.delete_title')}
                message={t('company_detail.partner_cards.delete_message')}
            />
        </div>
    );
}
