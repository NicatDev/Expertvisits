import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';
import { MapPin, Users, GraduationCap, Globe } from 'lucide-react';

export default function UserCard({ user }) {
    const { t, i18n } = useTranslation('common');

    const profession =
        user.profession_sub_category?.[`profession_${i18n.language}`] ||
        user.profession_sub_category?.[`name_${i18n.language}`] ||
        user.profession_sub_category?.profession_az ||
        user.profession_sub_category?.name_az ||
        '';

    const showPortfolio = Boolean(user.website_active);
    const profileHref = `/user/${user.username}`;
    const portfolioHref = `/u/${user.username}`;

    return (
        <div className={styles.card}>
            <Link href={profileHref} className={styles.cardMain}>
                <div className={styles.coverWrapper}>
                    {user.cover_image ? (
                        <div className={styles.coverImage} style={{ backgroundImage: `url(${user.cover_image})` }} />
                    ) : (
                        <div className={styles.coverPlaceholder} />
                    )}
                </div>

                <div className={styles.content}>
                    <div className={styles.avatarWrapper}>
                        <Avatar user={user} size={64} className={styles.avatar} />
                    </div>

                    <div className={styles.info}>
                        <h3 className={styles.name}>
                            {user.first_name} {user.last_name}
                        </h3>
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
                </div>
            </Link>

            <div className={styles.footer}>
                <Link href={profileHref} className={styles.footerBtn}>
                    {t('experts.view_profile')}
                </Link>
                {showPortfolio && (
                    <Link href={portfolioHref} className={`${styles.footerBtn} ${styles.footerBtnWebsite}`}>
                        <Globe size={16} strokeWidth={2} aria-hidden />
                        <span>{t('experts.view_website')}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
