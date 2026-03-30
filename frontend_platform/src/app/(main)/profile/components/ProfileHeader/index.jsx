import React, { useRef } from 'react';
import { Edit2, Trash2, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';

const ProfileHeader = ({
    profile,
    followersCount,
    onUpdateProfile,
    onOpenFollow,
    onTriggerActionMonitor // For opening password modal etc.
}) => {
    const { t, i18n } = useTranslation('common');
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append(type === 'avatar' ? 'avatar' : 'cover_image', file);
        onUpdateProfile(formData);
    };

    const [actionModal, setActionModal] = React.useState({ isOpen: false, type: null });
    const [confirmationModal, setConfirmationModal] = React.useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
    const [websiteData, setWebsiteData] = React.useState(null);

    React.useEffect(() => {
        if (onUpdateProfile) {
            import('@/lib/api/websites').then(({ websites_api }) => {
                websites_api.getTemplate().then(res => setWebsiteData(res.data)).catch(console.error);
            });
        }
    }, [onUpdateProfile, templateModalOpen]);

    return (
        <div className={styles.header}>
            {templateModalOpen && (
                <div style={{ position: 'fixed', zIndex: 1000000 }}>
                    <React.Suspense fallback={null}>
                        {React.createElement(
                            React.lazy(() => import('@/components/widgets/PromoBanner/TemplateSelectionModal')),
                            { isOpen: templateModalOpen, onClose: () => setTemplateModalOpen(false) }
                        )}
                    </React.Suspense>
                </div>
            )}
            {/* Confirmation Modal */}
            {confirmationModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }} onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{confirmationModal.title}</h3>
                        <p>{confirmationModal.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button type="default" onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}>{t('common.cancel')}</Button>
                            <Button type="primary" onClick={() => { confirmationModal.onConfirm(); setConfirmationModal({ ...confirmationModal, isOpen: false }); }}>{t('common.delete')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Action Modal */}
            {actionModal.isOpen && actionModal.type === 'avatar' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }} onClick={() => setActionModal({ isOpen: false, type: null })}>
                    <div style={{ background: 'white', borderRadius: '8px', width: '300px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('profile.avatar_modal.title')}</div>
                        <div
                            style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                                setActionModal({ isOpen: false, type: null });
                                fileInputRef.current.click();
                            }}
                        >
                            <Edit2 size={20} />
                            <span>{t('profile.avatar_modal.change')}</span>
                        </div>
                        {profile.avatar && (
                            <div
                                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'red' }}
                                onClick={() => {
                                    setActionModal({ isOpen: false, type: null });
                                    setConfirmationModal({
                                        isOpen: true,
                                        title: t('profile.avatar_modal.delete_title'),
                                        message: t('profile.avatar_modal.delete_message'),
                                        onConfirm: () => onUpdateProfile({ avatar: null })
                                    });
                                }}
                            >
                                <Trash2 size={20} />
                                <span>{t('profile.avatar_modal.remove')}</span>
                            </div>
                        )}
                        <div
                            style={{ padding: '12px 16px', cursor: 'pointer', borderTop: '1px solid #eee', textAlign: 'center', color: '#666' }}
                            onClick={() => setActionModal({ isOpen: false, type: null })}
                        >
                            {t('profile.avatar_modal.cancel')}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.coverContainer}>
                {profile.cover_image ? (
                    <img src={profile.cover_image} className={styles.coverImage} alt="Cover" />
                ) : (
                    <div className={styles.defaultCover} style={{ background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }} />
                )}
                <div className={styles.editOverlay} style={{ backdropFilter: 'none', background: 'transparent', gap: '10px' }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); coverInputRef.current.click(); }}
                        style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333' }}
                        title={t('profile.edit_cover')}
                    >
                        <Edit2 size={16} />
                    </div>
                    {profile.cover_image && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmationModal({
                                    isOpen: true,
                                    title: t('profile.modals.delete_title'),
                                    message: t('profile.modals.delete_message'),
                                    onConfirm: () => onUpdateProfile({ cover_image: null })
                                });
                            }}
                            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'red' }}
                            title={t('profile.delete_cover')}
                        >
                            <Trash2 size={16} />
                        </div>
                    )}
                    <input type="file" hidden ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} />
                </div>
            </div>

            <div className={styles.info}>
                <div className={styles.avatarContainer}>
                    {profile.avatar ? (
                        <img src={profile.avatar} className={styles.avatar} alt="Avatar" />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <User size={40} />
                        </div>
                    )}
                    <div
                        className={styles.avatarOverlay}
                        onClick={() => setActionModal({ isOpen: true, type: 'avatar' })}
                    >
                        <Edit2 size={24} />
                    </div>
                    <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                </div>

                <div className={styles.names}>
                    <h1>{profile.first_name} {profile.last_name}</h1>
                    <p className={styles.subtitle}>@{profile.username} • {
                        profile.profession_sub_category?.[`profession_${i18n.language}`] 
                        || profile.profession_sub_category?.[`name_${i18n.language}`] 
                        || profile.profession_sub_category?.profession_az 
                        || profile.profession_sub_category?.name_az 
                        || ''
                    }</p>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                        <span
                            style={{ cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => onOpenFollow('followers')}
                        >
                            <strong>{followersCount}</strong> {t('profile.followers')}
                        </span>
                        <span
                            style={{ cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => onOpenFollow('following')}
                        >
                            <strong>{profile.following_count || 0}</strong> {t('profile.following')}
                        </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button onClick={() => onTriggerActionMonitor('password')} type="default">{t('profile.change_password')}</Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
