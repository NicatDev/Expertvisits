import React from 'react';
import { useTranslation } from '@/i18n/client';
import { BookOpen, Users, Laptop, Briefcase } from 'lucide-react';
import styles from './style.module.scss';
import { toast } from 'react-toastify';
import { accounts } from '@/lib/api';

export default function OpenToWork({ user, isEditable, onUpdate }) {
    const { t } = useTranslation('common');

    // Default to empty array if undefined
    const selectedRoles = user?.open_to || [];

    const roles = [
        { id: 'teacher', icon: <BookOpen size={20} />, label: t('profile.open_to_roles.teacher') },
        { id: 'mentor', icon: <Users size={20} />, label: t('profile.open_to_roles.mentor') },
        { id: 'freelance', icon: <Laptop size={20} />, label: t('profile.open_to_roles.freelance') },
        { id: 'long_term', icon: <Briefcase size={20} />, label: t('profile.open_to_roles.long_term') },
    ];

    const toggleRole = async (roleId) => {
        if (!isEditable) return;

        let newRoles;
        if (selectedRoles.includes(roleId)) {
            newRoles = selectedRoles.filter(id => id !== roleId);
        } else {
            newRoles = [...selectedRoles, roleId];
        }

        // Optimistic update locally if parent provided a way, or just trigger API
        if (onUpdate) {
            onUpdate(newRoles);
        } else {
            // If no onUpdate provided, handle direct update (but usually parent manages state)
            // We'll rely on parent for state management usually, but here we can try updating profile.
            try {
                await accounts.updateProfile(user.username, { open_to: newRoles });
                // Manually triggering a refresh or assuming parent re-renders through context
                toast.success(t('profile.toasts.updated', { defaultValue: 'Updated' }));
                // Need to refresh context? 
            } catch (e) {
                toast.error(t('settings.update_failed'));
            }
        }
    };

    // If not editable and no roles selected, maybe hide? 
    // Usually "Show section but empty" or user said "user/username-de sadece gorunsun", implying if they correspond.
    if (!isEditable && selectedRoles.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{t('profile.open_to')}</h3>
            <div className={styles.grid}>
                {roles.map(role => {
                    const isSelected = selectedRoles.includes(role.id);
                    if (!isEditable && !isSelected) return null; // Hide unselected in read-only

                    return (
                        <div
                            key={role.id}
                            className={`${styles.card} ${isSelected ? styles.selected : ''} ${!isEditable ? styles.readOnly : ''}`}
                            onClick={() => toggleRole(role.id)}
                        >
                            <div className={styles.iconWrapper}>
                                {role.icon}
                            </div>
                            <span className={styles.label}>{role.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
