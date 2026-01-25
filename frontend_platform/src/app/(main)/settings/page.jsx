"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { User, Lock, Bell, Globe } from 'lucide-react';
import styles from './style.module.scss';
import { useAuth } from '@/lib/contexts/AuthContext';
import { accounts } from '@/lib/api'; // Ensure this api export exists
import Switch from '@/components/ui/Switch';
import { toast } from 'react-toastify';

export default function SettingsPage() {
    const { t } = useTranslation('common');
    const { user: authUser, setUser } = useAuth(); // Need setUser to update context if possible
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        is_searchable: true,
        show_phone_number: false,
        notify_email_general: false,
        notify_meeting_reminder_1h: false,
        notify_meeting_reminder_15m: false,
        notify_new_follower: false,
        notify_updates: false
    });
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'general', label: t('settings.tabs.general', { defaultValue: 'General' }), icon: <User size={20} /> },
        // { id: 'security', label: t('settings.tabs.security', { defaultValue: 'Security' }), icon: <Lock size={20} /> },
        { id: 'notifications', label: t('settings.tabs.notifications', { defaultValue: 'Notifications' }), icon: <Bell size={20} /> },
        { id: 'language', label: t('settings.tabs.language', { defaultValue: 'Language' }), icon: <Globe size={20} /> },
    ];

    useEffect(() => {
        if (authUser?.username) {
            loadSettings();
        }
    }, [authUser]);

    const loadSettings = async () => {
        try {
            // Fetch fresh user data to get settings
            const res = await accounts.getUser(authUser.username);
            const userData = res.data;
            setSettings({
                is_searchable: userData.is_searchable ?? true,
                show_phone_number: userData.show_phone_number ?? false,
                notify_email_general: userData.notify_email_general ?? false,
                notify_meeting_reminder_1h: userData.notify_meeting_reminder_1h ?? false,
                notify_meeting_reminder_15m: userData.notify_meeting_reminder_15m ?? false,
                notify_new_follower: userData.notify_new_follower ?? false,
                notify_updates: userData.notify_updates ?? false
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, value) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));
        try {
            await accounts.updateProfile(authUser.username, { [key]: value });
            // Optionally update auth user context if it stores these
            toast.success(t('settings.updated', { defaultValue: 'Settings updated' }));
        } catch (err) {
            console.error(err);
            toast.error(t('settings.update_failed', { defaultValue: 'Failed to update' }));
            // Revert
            setSettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    // Config for rendering
    const settingConfig = {
        general: [
            { key: 'is_searchable', label: t('settings.is_searchable', { defaultValue: 'Show profile in search results' }) },
            { key: 'show_phone_number', label: t('settings.show_phone_number', { defaultValue: 'Show phone number' }) },
        ],
        notifications: [
            { key: 'notify_email_general', label: t('settings.notify_email_general', { defaultValue: 'Email notifications' }) },
            { key: 'notify_meeting_reminder_1h', label: t('settings.notify_meeting_reminder_1h', { defaultValue: 'Meeting reminder (1 hour before)' }) },
            { key: 'notify_meeting_reminder_15m', label: t('settings.notify_meeting_reminder_15m', { defaultValue: 'Meeting reminder (15 mins before)' }) },
            { key: 'notify_new_follower', label: t('settings.notify_new_follower', { defaultValue: 'New follower notifications' }) },
            { key: 'notify_updates', label: t('settings.notify_updates', { defaultValue: 'News and updates' }) },
        ]
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h2>{t('nav.settings')}</h2>
                <div className={styles.menu}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.menuItem} ${activeTab === tab.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.sectionHeader}>
                    <h2>
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                </div>

                <div className={styles.sectionBody}>
                    {loading ? (
                        <p>{t('common.loading')}</p>
                    ) : (
                        <div className={styles.settingsList}>
                            {settingConfig[activeTab]?.map(item => (
                                <div key={item.key} className={styles.settingItem}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>{item.label}</span>
                                        <p className={styles.settingDesc}>{t(`settings.${item.key}_desc`)}</p>
                                    </div>
                                    <Switch
                                        checked={settings[item.key]}
                                        onChange={(val) => handleToggle(item.key, val)}
                                    />
                                </div>
                            ))}

                            {activeTab === 'language' && <p>{t('settings.language_desc', { defaultValue: 'Language settings are managed via the top bar.' })}</p>}
                            {activeTab === 'security' && <p>{t('settings.security_desc', { defaultValue: 'Password and security settings coming soon.' })}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
