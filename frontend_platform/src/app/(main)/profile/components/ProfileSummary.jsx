"use client";
import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { Edit2, Check, X } from 'lucide-react';
import styles from '../profile.module.scss'; // Corrected path to parent directory

const ProfileSummary = ({ profile, isOwner, onSave }) => {
    const { t } = useTranslation('common');
    const [isEditing, setIsEditing] = useState(false);
    const [summaryText, setSummaryText] = useState(profile?.summary || '');
    const [isExpanded, setIsExpanded] = useState(false);

    const CHAR_LIMIT = 200;
    const hasLongText = (profile?.summary || '').length > CHAR_LIMIT;

    const handleSave = () => {
        onSave('summary', summaryText);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setSummaryText(profile?.summary || '');
        setIsEditing(false);
    };

    if (!profile?.summary && !isOwner && !isEditing) {
        return null;
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{t('profile.summary', { defaultValue: 'Summary' })}</h2>
                {isOwner && !isEditing && (
                    <Edit2 className={styles.editIcon} size={16} onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }} />
                )}
            </div>
            
            <div className={styles.list} style={{ padding: '16px 20px' }}>
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                            value={summaryText}
                            onChange={(e) => setSummaryText(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #d9d9d9',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            placeholder={t('profile.summary_placeholder', { defaultValue: 'Write a brief summary about yourself...' })}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={handleSave} className={styles.iconBtn} style={{ background: '#f0fdf4', padding: '6px' }} title={t('common.save', { defaultValue: 'Save' })}>
                                <Check size={18} color="green" />
                            </button>
                            <button onClick={handleCancel} className={styles.iconBtn} style={{ background: '#fef2f2', padding: '6px' }} title={t('common.cancel', { defaultValue: 'Cancel' })}>
                                <X size={18} color="red" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p style={{ 
                            whiteSpace: 'pre-wrap', 
                            color: profile?.summary ? '#333' : '#999',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            {!profile?.summary 
                                ? t('profile.no_summary', { defaultValue: 'No summary provided yet.' })
                                : (isExpanded || !hasLongText) 
                                    ? profile.summary 
                                    : `${profile.summary.substring(0, CHAR_LIMIT)}...`
                            }
                        </p>
                        
                        {hasLongText && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0066cc',
                                    padding: '8px 0 0 0',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                {isExpanded 
                                    ? t('profile.read_less', { defaultValue: 'Read less' }) 
                                    : t('profile.read_more', { defaultValue: 'Read more' })
                                }
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSummary;
