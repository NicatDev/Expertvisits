import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import ImageCropModal from '@/components/ui/ImageCropModal';
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

    // Crop state
    const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, type: null }); // type: 'avatar' | 'cover'
    const cropTypeRef = useRef(null);

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setActionModal({ isOpen: false, type: null });
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

        const reader = new FileReader();
        reader.onload = () => {
            cropTypeRef.current = type;
            setCropModal({ isOpen: true, imageSrc: reader.result, type });
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleCropComplete = (croppedBlob, croppedUrl) => {
        const currentType = cropTypeRef.current;
        const fieldName = currentType === 'avatar' ? 'avatar' : 'cover_image';
        const fileName = currentType === 'avatar' ? `avatar-${Date.now()}.png` : `cover-${Date.now()}.png`;
        const croppedFile = new File([croppedBlob], fileName, { type: 'image/png' });

        const formData = new FormData();
        formData.append(fieldName, croppedFile);
        onUpdateProfile(formData);

        setCropModal({ isOpen: false, imageSrc: null, type: null });
        cropTypeRef.current = null;
    };

    const handleCropCancel = () => {
        setCropModal({ isOpen: false, imageSrc: null, type: null });
        cropTypeRef.current = null;
    };

    const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [websiteData, setWebsiteData] = useState(null);

    React.useEffect(() => {
        if (onUpdateProfile) {
            import('@/lib/api/websites').then(({ websites_api }) => {
                websites_api.getTemplate().then(res => setWebsiteData(res.data)).catch(console.error);
            });
        }
    }, [onUpdateProfile]);

    /** Əsas avatar faylı varsa “şəkil var” — sıxılmış törəmədir; yoxdursa birbaşa yükləmə */
    const hasAvatarPhoto = Boolean(profile?.avatar);

    const openAvatarPickerOrMenu = (e) => {
        if (e?.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e?.type === 'keydown' && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
        if (hasAvatarPhoto) {
            setActionModal({ isOpen: true, type: 'avatar' });
        } else {
            fileInputRef.current?.click();
        }
    };

    return (
        <>
        <div className={styles.header}>
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
                        {hasAvatarPhoto && (
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
                    <input type="file" accept="image/*" hidden ref={coverInputRef} onChange={(e) => handleFileSelect(e, 'cover')} />
                </div>
            </div>

            <div className={styles.info}>
                <div
                    className={styles.avatarContainer}
                    onClick={openAvatarPickerOrMenu}
                    onKeyDown={openAvatarPickerOrMenu}
                    role="button"
                    tabIndex={0}
                    title={hasAvatarPhoto ? t('profile.edit_avatar') : t('profile.add_avatar')}
                >
                    <Avatar user={profile} size={120} className={styles.avatar} />
                    <span className={styles.avatarEditBadge} aria-hidden="true">
                        <Edit2 size={16} strokeWidth={2.25} />
                    </span>
                    <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'avatar')} />
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
                    <Link href="/website-template" style={{ textDecoration: 'none' }}>
                        <Button type="default">
                            {websiteData?.is_active ? t('widgets.manage_website') : t('widgets.create_website')}
                        </Button>
                    </Link>
                    <Button onClick={() => onTriggerActionMonitor('password')} type="default">{t('profile.change_password')}</Button>
                </div>
            </div>
        </div>

        {/* Image Crop Modal */}
        {cropModal.isOpen && cropModal.imageSrc && (
            <ImageCropModal
                imageSrc={cropModal.imageSrc}
                onCropComplete={handleCropComplete}
                onClose={handleCropCancel}
                aspectRatio={cropModal.type === 'cover' ? 900 / 200 : undefined}
            />
        )}
        </>
    );
};

export default ProfileHeader;

