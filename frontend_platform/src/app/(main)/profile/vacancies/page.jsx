"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import VacancyCard from '@/components/advanced/VacancyCard';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Plus } from 'lucide-react';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from '../profile.module.scss';
import { useProfile } from '../context';

export default function VacanciesPage() {
    const { t } = useTranslation('common');
    const { profile, refreshProfile, isOwner } = useProfile();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalState, setModalState] = useState({ isOpen: false, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        loadVacancies();
    }, []);

    const loadVacancies = async () => {
        try {
            const vacs = await business.getMyVacancies();
            setVacancies(vacs.data.results || vacs.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{t('profile.vacancies.title')}</h2>
                {isOwner && <Button size="small" onClick={() => setModalState({ isOpen: true, data: null })}><Plus size={16} /> {t('profile.vacancies.post_new')}</Button>}
            </div>

            {loading ? <p>{t('common.loading')}</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {vacancies.map(v => (
                        <VacancyCard
                            key={v.id}
                            vacancy={v}
                            isOwner={isOwner}
                            onEdit={() => setModalState({ isOpen: true, data: v })}
                            onDelete={async () => {
                                setConfirmationModal({
                                    isOpen: true,
                                    title: t('profile.vacancies.delete_title'),
                                    message: t('profile.vacancies.delete_message'),
                                    onConfirm: async () => {
                                        try {
                                            await business.deleteVacancy(v.id);
                                            setVacancies(prev => prev.filter(item => item.id !== v.id));
                                            toast.success(t('profile.vacancies.deleted_success'));
                                        } catch (err) {
                                            console.error(err);
                                        }
                                        setConfirmationModal({ isOpen: false });
                                    }
                                });
                            }}
                        />
                    ))}
                    {vacancies.length === 0 && <p>{t('profile.vacancies.no_vacancies')}</p>}
                </div>
            )}

            <AddVacancyModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, data: null })}
                initialData={modalState.data}
                onSuccess={() => { loadVacancies(); refreshProfile(); }}
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
            />
        </div>
    );
}
