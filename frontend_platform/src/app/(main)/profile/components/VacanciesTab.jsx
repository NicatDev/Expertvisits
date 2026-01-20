import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import VacancyCard from '@/components/advanced/VacancyCard';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Plus } from 'lucide-react';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from '../profile.module.scss';

const VacanciesTab = ({ vacancies, setVacancies, isOwner, onRefresh }) => {
    const { t } = useTranslation('common');
    const [modalState, setModalState] = useState({ isOpen: false, data: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{t('profile.vacancies.title')}</h2>
                {isOwner && <Button size="small" onClick={() => setModalState({ isOpen: true, data: null })}><Plus size={16} /> {t('profile.vacancies.post_new')}</Button>}
            </div>
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

            <AddVacancyModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, data: null })}
                initialData={modalState.data}
                onSuccess={() => { onRefresh(); }}
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
};

export default VacanciesTab;
