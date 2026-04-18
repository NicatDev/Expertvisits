"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/client';
import Button from '@/components/ui/Button';
import VacancyCard from '@/components/advanced/VacancyCard';
import AddVacancyModal from '@/components/advanced/AddVacancyModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Plus } from 'lucide-react';
import { business } from '@/lib/api';
import { toast } from 'react-toastify';
import styles from './style.module.scss';

/**
 * Same layout as /profile/vacancies. Parent passes isOwner (profile or company owner).
 *
 * @param {'profile'|'company'} scope
 * @param {boolean} isOwner
 * @param {number} [companyId] — company page; also passed to AddVacancyModal as lockCompanyId
 * @param {Array} [vacancies] — scope company: list from parent
 * @param {() => Promise<void>} [onRefresh] — reload list (company: loadVacancies; profile: internal)
 * @param {() => void} [onProfileExtrasRefresh] — profile: e.g. refreshProfile from context
 */
export default function EntityVacanciesTab({
    scope,
    isOwner,
    companyId,
    vacancies: vacanciesFromParent,
    onRefresh,
    onProfileExtrasRefresh,
    sectionClassName = '',
}) {
    const { t } = useTranslation('common');
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, data: null });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const loadProfileVacancies = useCallback(async () => {
        setLoading(true);
        try {
            const vacs = await business.getMyVacancies();
            setVacancies(vacs.data.results || vacs.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (scope === 'profile') {
            loadProfileVacancies();
        }
    }, [scope, loadProfileVacancies]);

    useEffect(() => {
        if (scope === 'company') {
            setVacancies(Array.isArray(vacanciesFromParent) ? vacanciesFromParent : []);
            setLoading(false);
        }
    }, [scope, vacanciesFromParent]);

    const afterMutation = async () => {
        if (scope === 'company' && onRefresh) {
            await onRefresh();
        } else if (scope === 'profile') {
            await loadProfileVacancies();
        }
        onProfileExtrasRefresh?.();
    };

    return (
        <div className={sectionClassName}>
            <div className={styles.sectionHeader}>
                <h2>{t('profile.vacancies.title')}</h2>
                {isOwner && (
                    <Button size="small" onClick={() => setModalState({ isOpen: true, data: null })}>
                        <Plus size={16} /> {t('profile.vacancies.post_new')}
                    </Button>
                )}
            </div>

            {loading ? (
                <p>{t('common.loading')}</p>
            ) : (
                <div className={styles.grid}>
                    {vacancies.map((v) => (
                        <VacancyCard
                            key={v.id}
                            vacancy={v}
                            isOwner={isOwner}
                            onEdit={
                                isOwner
                                    ? () => setModalState({ isOpen: true, data: v })
                                    : undefined
                            }
                            onDelete={
                                isOwner
                                    ? async () => {
                                          setConfirmationModal({
                                              isOpen: true,
                                              title: t('profile.vacancies.delete_title'),
                                              message: t('profile.vacancies.delete_message'),
                                              onConfirm: async () => {
                                                  try {
                                                      await business.deleteVacancy(v.id);
                                                      toast.success(t('profile.vacancies.deleted_success'));
                                                      if (scope === 'company' && onRefresh) {
                                                          await onRefresh();
                                                      } else {
                                                          setVacancies((prev) => prev.filter((item) => item.id !== v.id));
                                                      }
                                                      onProfileExtrasRefresh?.();
                                                  } catch (err) {
                                                      console.error(err);
                                                  }
                                                  setConfirmationModal({ isOpen: false });
                                              },
                                          });
                                      }
                                    : undefined
                            }
                        />
                    ))}
                    {vacancies.length === 0 && <p className={styles.empty}>{t('profile.vacancies.no_vacancies')}</p>}
                </div>
            )}

            <AddVacancyModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, data: null })}
                initialData={modalState.data}
                lockCompanyId={scope === 'company' ? companyId : undefined}
                onSuccess={afterMutation}
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
