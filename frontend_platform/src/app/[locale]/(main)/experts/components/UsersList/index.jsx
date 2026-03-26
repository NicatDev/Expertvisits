import React from 'react';
import styles from './style.module.scss';
import UserCard from '../UserCard';
import { useTranslation } from '@/i18n/client';
import NoContent from '@/components/ui/NoContent';
import { Users } from 'lucide-react';

export default function UsersList({ users, loading }) {
    const { t } = useTranslation('common');

    if (loading && (users?.length === 0 || !users)) {
        return <div className={styles.loading}>{t('common.loading')}</div>;
    }

    if (!loading && (users?.length === 0 || !users)) {
        return (
            <div className={styles.empty}>
                <NoContent
                    message={t('experts.no_results_desc')}
                    icon={Users}
                />
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {users?.map(user => (
                <UserCard key={user.id} user={user} />
            ))}
        </div>
    );
}
