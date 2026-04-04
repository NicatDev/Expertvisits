"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useProfile } from './context';
import { profiles, auth } from '@/lib/api';
import api from '@/lib/api/client';
import Section from './components/Section';
import styles from './profile.module.scss';
import { Check, X, Edit2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import LocationSelect from '@/components/ui/LocationSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';
import {
    ExperienceModal, EducationModal, SkillModal, LanguageModal, CertificateModal
} from '@/components/advanced/ProfileModals';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { toast } from 'react-toastify';

import OpenToWork from './components/OpenToWork';
import ProfileSummary from './components/ProfileSummary';

export default function AboutPage() {
    const { t, i18n } = useTranslation('common');
    const currentLang = i18n.language || 'az';
    const langKey = `name_${currentLang}`;
    const profKey = `profession_${currentLang}`;

    const { profile, loading: profileLoading, refreshProfile, isOwner } = useProfile();

    const [details, setDetails] = useState({
        experiences: [],
        educations: [],
        skills: [],
        languages: [],
        certificates: []
    });
    const [loadingDetails, setLoadingDetails] = useState(true);

    const [editMode, setEditMode] = useState({});
    const [aboutData, setAboutData] = useState({});
    const [allCategories, setAllCategories] = useState([]); // For profession edit
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [emailChangeModalOpen, setEmailChangeModalOpen] = useState(false);
    const [emailChangeStep, setEmailChangeStep] = useState('enter');
    const [newEmailInput, setNewEmailInput] = useState('');
    const [emailCodeInput, setEmailCodeInput] = useState('');
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);

    const emailChangeErrorToast = (detail) => {
        const key = `profile.email_change.errors.${detail}`;
        const msg = t(key);
        toast.error(msg !== key ? msg : t('profile.email_change.errors.generic'));
    };

    const openEmailChangeModal = () => {
        setEmailChangeModalOpen(true);
        setEmailChangeStep('enter');
        setNewEmailInput('');
        setEmailCodeInput('');
    };

    const closeEmailChangeModal = () => {
        setEmailChangeModalOpen(false);
        setEmailChangeStep('enter');
        setNewEmailInput('');
        setEmailCodeInput('');
    };

    const handleRequestEmailChange = async () => {
        const trimmed = newEmailInput.trim();
        if (!trimmed) {
            toast.error(t('profile.email_change.errors.new_email_required'));
            return;
        }
        setEmailChangeLoading(true);
        try {
            await auth.requestEmailChange(trimmed);
            toast.success(t('profile.email_change.code_sent'));
            setEmailChangeStep('code');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (detail) emailChangeErrorToast(detail);
            else toast.error(t('profile.toasts.failed_update'));
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleConfirmEmailChange = async () => {
        const trimmed = newEmailInput.trim();
        const code = emailCodeInput.trim();
        if (!code) {
            toast.error(t('profile.email_change.errors.code_required'));
            return;
        }
        setEmailChangeLoading(true);
        try {
            await auth.confirmEmailChange(trimmed, code);
            toast.success(t('profile.email_change.success'));
            closeEmailChangeModal();
            refreshProfile();
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (detail) emailChangeErrorToast(detail);
            else toast.error(t('profile.toasts.failed_update'));
        } finally {
            setEmailChangeLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            loadDetails();
        }
    }, [profile]);

    const loadDetails = async () => {
        try {
            const { data } = await profiles.getProfileDetails(profile.id);
            setDetails({
                experiences: data.experience || [],
                educations: data.education || [],
                skills: (data.skills || []).map(s => ({ ...s, skill_type: s.skill_type || 'hard' })),
                languages: data.languages || [],
                certificates: data.certificates || []
            });
        } catch (err) {
            console.error("Failed to load details", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Inline Edit Logic
    const toggleEdit = (field) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
        if (!editMode[field]) {
            setAboutData(prev => ({ ...prev, [field]: profile[field] }));
        }
    };

    const saveInline = async (field, overrideValue = undefined) => {
        const valueToSave = overrideValue !== undefined ? overrideValue : aboutData[field];
        let payload = { [field]: valueToSave };
        
        if (field === 'profession_sub_category') {
            payload = { profession_sub_category_id: valueToSave };
        }

        try {
            await profiles.updateProfile(profile.username, payload);
            refreshProfile(); // Refresh main profile context
            if (overrideValue === undefined) {
                toggleEdit(field);
            }
            toast.success(t('profile.toasts.updated'));
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.username 
                ? (Array.isArray(err.response.data.username) ? err.response.data.username[0] : err.response.data.username)
                : t('profile.toasts.failed_update');
            toast.error(errorMsg);
        }
    };

    const handleOpenToUpdate = async (newRoles) => {
        try {
            await profiles.updateProfile(profile.username, { open_to: newRoles });
            refreshProfile();
            toast.success(t('profile.toasts.updated'));
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.failed_update'));
        }
    };

    // Modal Logic
    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const handleSaveItem = async (formData) => {
        const { type, data } = modalState;
        const isEdit = !!(data && data.id);
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        const apiFunc = profiles[isEdit ? `update${capitalize(type)}` : `add${capitalize(type)}`];

        try {
            if (isEdit) await apiFunc(data.id, formData);
            else await apiFunc(formData);
            loadDetails(); // Refresh details only
            closeModal();
            toast.success(t('profile.toasts.availability_saved'));
        } catch (err) {
            console.error(err);
            toast.error(t('profile.toasts.failed_update'));
        }
    };

    const handleDelete = (type, id) => {
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        setConfirmationModal({
            isOpen: true,
            title: t('profile.modals.delete_title'),
            message: t('profile.modals.delete_message'),
            onConfirm: async () => {
                try {
                    await profiles[`delete${capitalize(type)}`](id);
                    loadDetails();
                    toast.success(t('profile.toasts.deleted'));
                } catch (err) {
                    console.error(err);
                    toast.error(t('profile.toasts.failed_delete'));
                }
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const loadCategories = async () => {
        if (allCategories.length === 0) {
            try {
                const { data } = await api.get('/accounts/categories/');
                setAllCategories(data.results || data);
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (profileLoading) return null; // Logic handled in layout, but safety check

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <OpenToWork user={profile} isEditable={isOwner} onUpdate={handleOpenToUpdate} />

            <ProfileSummary profile={profile} isOwner={isOwner} onSave={saveInline} />

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('profile.personal_info')}</h2>
                </div>
                <div className={styles.list}>
                    {['first_name', 'last_name', 'username', 'email', 'phone_number', 'birth_day', 'city'].map(field => (
                        <div key={field} className={styles.editableField}>
                            <span className={styles.label}>{t(`profile.${field}`) || field.replace('_', ' ')}</span>
                            <div className={styles.value}>
                                {editMode[field] ? (
                                    <div className={styles.inlineForm}>
                                        {field === 'city' ? (
                                            <div style={{ width: '100%' }}>
                                                <LocationSelect
                                                    value={aboutData[field] || ''}
                                                    onChange={val => setAboutData({ ...aboutData, [field]: val })}
                                                />
                                            </div>
                                        ) : (
                                            <Input
                                                type={field === 'birth_day' ? 'date' : 'text'}
                                                value={aboutData[field] || ''}
                                                onChange={e => setAboutData({ ...aboutData, [field]: e.target.value })}
                                                wrapperStyle={{ marginBottom: 0 }}
                                            />
                                        )}
                                        <button onClick={() => saveInline(field)} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                        <button onClick={() => toggleEdit(field)} className={styles.iconBtn}><X size={18} color="red" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ color: profile[field] ? '#333' : '#999' }}>{profile[field] || t('profile.not_set')}</span>
                                        {isOwner && field !== 'email' && (
                                            <Edit2 className={styles.editIcon} size={14} onClick={() => toggleEdit(field)} />
                                        )}
                                        {isOwner && field === 'email' && (
                                            <Edit2 className={styles.editIcon} size={14} onClick={openEmailChangeModal} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className={styles.editableField}>
                        <span className={styles.label}>{t('profile.profession')}</span>
                        <div className={styles.value}>
                            {editMode['profession_sub_category'] ? (
                                <div className={styles.inlineForm}>
                                    <SearchableSelect
                                        options={allCategories}
                                        value={aboutData.profession_sub_category}
                                        onChange={(val) => setAboutData({ ...aboutData, profession_sub_category: val })}
                                        groupBy="subcategories"
                                        labelKey={langKey}
                                        professionKey={profKey}
                                        valueKey="id"
                                        placeholder={t('profile.select_profession')}
                                    />
                                    <button onClick={() => saveInline('profession_sub_category')} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                    <button onClick={() => toggleEdit('profession_sub_category')} className={styles.iconBtn}><X size={18} color="red" /></button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ color: profile.profession_sub_category ? '#333' : '#999' }}>
                                        {profile.profession_sub_category?.[profKey] || profile.profession_sub_category?.[langKey] || t('profile.not_set')}
                                    </span>
                                    {isOwner && (
                                        <Edit2
                                            className={styles.editIcon}
                                            size={14}
                                            onClick={() => {
                                                loadCategories();
                                                setAboutData(prev => ({ ...prev, profession_sub_category: profile.profession_sub_category?.id }));
                                                toggleEdit('profession_sub_category');
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Section
                title={t('profile.sections.experience')}
                items={details.experiences || []}
                isOwner={isOwner}
                onAdd={() => openModal('experience')}
                onEdit={(item) => openModal('experience', item)}
                onDelete={(id) => handleDelete('experience', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.position}</h3>
                        <p>{item.company_name}</p>
                        <span>{item.start_date} - {item.end_date || t('common.present')}</span>
                    </div>
                )}
            />

            <Section
                title={t('profile.sections.education')}
                items={details.educations || []}
                isOwner={isOwner}
                onAdd={() => openModal('education')}
                onEdit={(item) => openModal('education', item)}
                onDelete={(id) => handleDelete('education', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.institution}</h3>
                        <p>{item.degree_type_display || item.degree_type} in {item.field_of_study}</p>
                        <span>{item.start_date} - {item.end_date || t('common.present')}</span>
                    </div>
                )}
            />

            <div className={styles.skillsGrid}>
                <Section
                    title={t('profile.sections.hard_skills')}
                    items={details.skills?.filter(s => s.skill_type === 'hard') || []}
                    isOwner={isOwner}
                    layout="compact"
                    onAdd={() => openModal('skill', { skill_type: 'hard' })}
                    onEdit={(item) => openModal('skill', item)}
                    onDelete={(id) => handleDelete('skill', id)}
                    renderItem={(item, isCompact) => (
                        <div className={styles.itemContent} style={{ padding: isCompact ? 0 : '' }}>
                            <h3 style={{ margin: 0, fontSize: isCompact ? '14px' : '', fontWeight: isCompact ? 500 : '' }}>{item.name}</h3>
                        </div>
                    )}
                />

                <Section
                    title={t('profile.sections.soft_skills')}
                    items={details.skills?.filter(s => s.skill_type === 'soft') || []}
                    isOwner={isOwner}
                    layout="compact"
                    onAdd={() => openModal('skill', { skill_type: 'soft' })}
                    onEdit={(item) => openModal('skill', item)}
                    onDelete={(id) => handleDelete('skill', id)}
                    renderItem={(item, isCompact) => (
                        <div className={styles.itemContent} style={{ padding: isCompact ? 0 : '' }}>
                            <h3 style={{ margin: 0, fontSize: isCompact ? '14px' : '', fontWeight: isCompact ? 500 : '' }}>{item.name}</h3>
                        </div>
                    )}
                />
            </div>

            <Section
                title={t('profile.sections.languages')}
                items={details.languages || []}
                isOwner={isOwner}
                onAdd={() => openModal('language')}
                onEdit={(item) => openModal('language', item)}
                onDelete={(id) => handleDelete('language', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <span>Level: {item.level.toUpperCase()}</span>
                    </div>
                )}
            />

            <Section
                title={t('profile.sections.certificates')}
                items={details.certificates || []}
                isOwner={isOwner}
                onAdd={() => openModal('certificate')}
                onEdit={(item) => openModal('certificate', item)}
                onDelete={(id) => handleDelete('certificate', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <p>{item.issuing_organization}</p>
                        <span>{item.issue_date}</span>
                    </div>
                )}
            />

            {/* Modals */}
            <ExperienceModal isOpen={modalState.type === 'experience'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
            <EducationModal isOpen={modalState.type === 'education'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
            <SkillModal isOpen={modalState.type === 'skill'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
            <LanguageModal isOpen={modalState.type === 'language'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />
            <CertificateModal isOpen={modalState.type === 'certificate'} onClose={closeModal} initialData={modalState.data} onSave={handleSaveItem} />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
            />

            <Modal
                isOpen={emailChangeModalOpen}
                onClose={closeEmailChangeModal}
                title={t('profile.email_change.modal_title')}
                width="420px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {emailChangeStep === 'enter' && (
                        <>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                                {t('profile.email_change.step_enter_hint')}
                            </p>
                            <Input
                                type="email"
                                value={newEmailInput}
                                onChange={(e) => setNewEmailInput(e.target.value)}
                                placeholder={t('profile.email_change.new_email_placeholder')}
                                autoComplete="email"
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <Button type="default" onClick={closeEmailChangeModal}>
                                    {t('profile.modals.cancel')}
                                </Button>
                                <Button type="primary" loading={emailChangeLoading} onClick={handleRequestEmailChange}>
                                    {t('profile.email_change.send_code')}
                                </Button>
                            </div>
                        </>
                    )}
                    {emailChangeStep === 'code' && (
                        <>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                                {t('profile.email_change.step_code_hint', { email: newEmailInput })}
                            </p>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={emailCodeInput}
                                onChange={(e) => setEmailCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder={t('profile.email_change.code_placeholder')}
                                autoComplete="one-time-code"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmailChangeStep('enter');
                                        setEmailCodeInput('');
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
                                >
                                    {t('profile.email_change.back_edit_email')}
                                </button>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button type="default" onClick={closeEmailChangeModal}>
                                        {t('profile.modals.cancel')}
                                    </Button>
                                    <Button type="primary" loading={emailChangeLoading} onClick={handleConfirmEmailChange}>
                                        {t('profile.email_change.confirm')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
