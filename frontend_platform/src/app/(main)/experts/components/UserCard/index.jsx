import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import { MapPin, Users, BookOpen, GraduationCap } from 'lucide-react';

export default function UserCard({ user }) {
    const { t, i18n } = useTranslation('common');

    const profession = user.profession_sub_category?.[`profession_${i18n.language}`] 
        || user.profession_sub_category?.[`name_${i18n.language}`] 
        || user.profession_sub_category?.profession_az 
        || user.profession_sub_category?.name_az 
        || '';

    return (
        <Link href={`/user/${user.username}`} className={styles.card}>
            <div className={styles.coverWrapper}>
                {user.cover_image ? (
                    <div className={styles.coverImage} style={{ backgroundImage: `url(${user.cover_image})` }} />
                ) : (
                    <div className={styles.coverPlaceholder} />
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.avatarWrapper}>
                    <Image
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.username}
                        width={64}
                        height={64}
                        className={styles.avatar}
                    />
                </div>

                <div className={styles.info}>
                    <h3 className={styles.name}>{user.first_name} {user.last_name}</h3>
                    <p className={styles.profession}>{profession}</p>

                    <div className={styles.meta}>
                        {user.city && (
                            <div className={styles.metaItem} title={t('experts.filters.location')}>
                                <MapPin size={14} />
                                <span>{user.city}</span>
                            </div>
                        )}
                        {user.highest_education && (
                            <div className={styles.metaItem} title={t('experts.filters.degree')}>
                                <GraduationCap size={14} />
                                <span>{user.highest_education}</span>
                            </div>
                        )}
                        <div className={styles.metaItem} title={t('profile.followers')}>
                            <Users size={14} />
                            <span>{user.followers_count}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.action}>
                    <span className={styles.viewLink}>{t('experts.view_profile')}</span>
                </div>
            </div>
        </Link>
    );
}
