import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSelect from '@/components/ui/LocationSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Check, X, Edit2 } from 'lucide-react';
import Section from './Section';
import styles from '../profile.module.scss';
import api from '@/lib/api/client';
import { profiles } from '@/lib/api';
import {
    ExperienceModal, EducationModal, SkillModal, LanguageModal, CertificateModal
} from '@/components/advanced/ProfileModals';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'react-toastify';

const AboutTab = ({ profile, details, onUpdateProfile, onRefresh, isOwner }) => {
    const { t } = useTranslation('common');
    const [editMode, setEditMode] = useState({});
    const [aboutData, setAboutData] = useState({});
    const [allCategories, setAllCategories] = useState([]);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Inline Edit Logic
    const toggleEdit = (field) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
        if (!editMode[field]) {
            setAboutData(prev => ({ ...prev, [field]: profile[field] }));
        }
    };

    const saveInline = async (field) => {
        let payload = { [field]: aboutData[field] };
        if (field === 'profession_sub_category') {
            payload = { profession_sub_category_id: aboutData['profession_sub_category'] };
        }
        await onUpdateProfile(payload);
        toggleEdit(field);
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
            onRefresh();
            closeModal();
            toast.success(t('profile.toasts.availability_saved')); // Using generic save msg or specific?
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
                    onRefresh();
                    toast.success(t('profile.toasts.deleted'));
                } catch (err) {
                    console.error(err);
                    toast.error(t('profile.toasts.failed_delete'));
                }
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Helper to fetch categories for profession edit
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('profile.personal_info')}</h2>
                </div>
                <div className={styles.list}>
                    {['first_name', 'last_name', 'username', 'phone_number', 'birth_day', 'city'].map(field => (
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
                                        {isOwner && <Edit2 className={styles.editIcon} size={14} onClick={() => toggleEdit(field)} />}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Profession Special Case */}
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
                                        labelKey="name"
                                        valueKey="id"
                                        placeholder={t('profile.select_profession')}
                                    />
                                    <button onClick={() => saveInline('profession_sub_category')} className={styles.iconBtn}><Check size={18} color="green" /></button>
                                    <button onClick={() => toggleEdit('profession_sub_category')} className={styles.iconBtn}><X size={18} color="red" /></button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ color: profile.profession_sub_category ? '#333' : '#999' }}>
                                        {profile.profession_sub_category?.profession || profile.profession_sub_category?.name || t('profile.not_set')}
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
                        <span>{item.start_date} - {item.end_date || 'Present'}</span>
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
                        <span>{item.start_date} - {item.end_date || 'Present'}</span>
                    </div>
                )}
            />

            <Section
                title={t('profile.sections.hard_skills')}
                items={details.skills?.filter(s => s.skill_type === 'hard') || []}
                isOwner={isOwner}
                onAdd={() => openModal('skill', { skill_type: 'hard' })}
                onEdit={(item) => openModal('skill', item)}
                onDelete={(id) => handleDelete('skill', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                    </div>
                )}
            />

            <Section
                title={t('profile.sections.soft_skills')}
                items={details.skills?.filter(s => s.skill_type === 'soft') || []}
                isOwner={isOwner}
                onAdd={() => openModal('skill', { skill_type: 'soft' })}
                onEdit={(item) => openModal('skill', item)}
                onDelete={(id) => handleDelete('skill', id)}
                renderItem={(item) => (
                    <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                    </div>
                )}
            />

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
        </div>
    );
};

export default AboutTab;
