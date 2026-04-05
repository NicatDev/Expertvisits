'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    CheckCircle,
    LayoutTemplate,
    PaintBucket,
    Briefcase,
    Sidebar,
    Stethoscope,
    ArrowLeft,
    Download,
} from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { websites_api, content, profiles } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import modalStyles from '@/components/widgets/PromoBanner/modal.module.scss';
import pageStyles from './website-template.module.scss';

export default function WebsiteTemplatePageClient() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [selected, setSelected] = useState(2);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [articlesCount, setArticlesCount] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrLoading, setQrLoading] = useState(false);

    const websiteUrl = currentUser?.username
        ? `https://expertvisits.com/u/${currentUser.username}`
        : '';

    const buildQr = useCallback(async () => {
        if (!websiteUrl) return;
        setQrLoading(true);
        try {
            const QR = await import('qrcode');
            const url = await QR.toDataURL(websiteUrl, {
                width: 320,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
            setQrDataUrl(url);
        } catch (e) {
            console.error('QR generation failed', e);
        } finally {
            setQrLoading(false);
        }
    }, [websiteUrl]);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser?.id) {
            toast.info(t('auth.login_required'));
            router.replace(`/login?next=${encodeURIComponent('/website-template')}`);
            return;
        }
        fetchCurrentTemplate();
        fetchArticlesCount();
        fetchProfileData();
        setShowSuccess(false);
    }, [authLoading, currentUser?.id]);

    useEffect(() => {
        if (currentUser?.username && websiteUrl) {
            buildQr();
        }
    }, [currentUser?.username, websiteUrl, buildQr]);

    const downloadQr = () => {
        if (!qrDataUrl || !currentUser?.username) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `expertvisits-website-${currentUser.username}.png`;
        a.click();
    };

    const fetchProfileData = async () => {
        if (!currentUser) return;
        try {
            const { data } = await profiles.getProfileDetails(currentUser.id, {
                params: { t: new Date().getTime() },
            });

            const summary = data.summary !== undefined ? data.summary : currentUser.summary;
            const phone =
                data.phone_number !== undefined ? data.phone_number : currentUser.phone_number;

            const requiredFields = [
                !!summary,
                !!(data.first_name !== undefined ? data.first_name : currentUser.first_name),
                !!(data.last_name !== undefined ? data.last_name : currentUser.last_name),
                !!(data.username !== undefined ? data.username : currentUser.username),
                !!(data.email !== undefined ? data.email : currentUser.email),
                !!phone,
                !!(data.birth_day !== undefined
                    ? data.birth_day
                    : data.birth_date !== undefined
                      ? data.birth_date
                      : currentUser.birth_day),
                !!(data.city !== undefined ? data.city : currentUser.city),
                !!(data.profession_sub_category !== undefined
                    ? data.profession_sub_category
                    : currentUser.profession_sub_category),
                !!(data.experience && data.experience.length > 0),
                !!(data.education && data.education.length > 0),
                !!(data.skills && data.skills.some((s) => s.skill_type === 'hard')),
                !!(data.skills && data.skills.some((s) => s.skill_type === 'soft')),
                !!(data.languages && data.languages.length > 0),
                !!(data.certificates && data.certificates.length > 0),
            ];
            const completed = requiredFields.filter(Boolean).length;
            setProgress(Math.round((completed / requiredFields.length) * 100));
        } catch (error) {
            console.error('Failed to fetch profile info for progress', error);
        }
    };

    const fetchCurrentTemplate = async () => {
        setIsFetching(true);
        try {
            const { data } = await websites_api.getTemplate();
            if (data?.template_id) setSelected(parseInt(data.template_id, 10));
            if (data?.is_active) setIsActive(true);
        } catch (error) {
            console.error('Failed to fetch current template', error);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchArticlesCount = async () => {
        try {
            const res = await content.getArticleStats();
            setArticlesCount(res.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch article count', error);
        }
    };

    const handleSave = async () => {
        if (progress < 60) {
            toast.error(t('widgets.profile_completion_desc'));
            return;
        }

        setLoading(true);
        try {
            await websites_api.updateTemplate(selected);
            toast.success(t('widgets.success_msg'));
            setShowSuccess(true);
            buildQr();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            await websites_api.deactivateTemplate();
            toast.success(t('widgets.deactivate_success_msg'));
            setIsActive(false);
            router.refresh();
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to deactivate template');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !currentUser?.id) {
        return (
            <div className={pageStyles.page}>
                <p style={{ textAlign: 'center', color: '#64748b', padding: 48 }}>
                    {t('common.loading')}
                </p>
            </div>
        );
    }

    const qrBlock = (
        <div className={pageStyles.qrCard}>
            <h2 className={pageStyles.qrTitle}>{t('widgets.qr_portfolio_title')}</h2>
            <p className={pageStyles.qrHint}>{t('widgets.qr_portfolio_hint')}</p>
            <div className={pageStyles.qrImageWrap}>
                {qrLoading ? (
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('common.loading')}</span>
                ) : qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="" className={pageStyles.qrImage} />
                ) : null}
            </div>
            <button
                type="button"
                className={pageStyles.downloadQrBtn}
                onClick={downloadQr}
                disabled={!qrDataUrl}
            >
                <Download size={18} />
                {t('widgets.download_qr')}
            </button>
        </div>
    );

    return (
        <div className={pageStyles.page}>
            <div className={pageStyles.topBar}>
                <Link href="/" className={pageStyles.backLink}>
                    <ArrowLeft size={18} />
                    {t('nav.home')}
                </Link>
                <h1 className={pageStyles.pageTitle}>
                    {showSuccess
                        ? t('widgets.success_msg')
                        : isActive
                          ? t('widgets.edit_website_modal_title')
                          : t('widgets.create_website_modal_title')}
                </h1>
            </div>

            <div className={pageStyles.grid}>
                <div className={pageStyles.mainCard}>
                    <div className={pageStyles.innerHeader}>
                        <h3>
                            {showSuccess
                                ? t('widgets.success_msg')
                                : isActive
                                  ? t('widgets.edit_website_modal_title')
                                  : t('widgets.create_website_modal_title')}
                        </h3>
                    </div>

                    <div className={pageStyles.innerBody}>
                        {showSuccess ? (
                            <div className={modalStyles.successContent}>
                                <div className={modalStyles.successIcon}>
                                    <CheckCircle size={32} />
                                </div>
                                <h4>{t('widgets.success_msg')}</h4>
                                <p>{t('widgets.visit_website_desc')}</p>

                                <div className={modalStyles.urlBox}>
                                    <span>{t('widgets.website_url')}</span>
                                    <Link href={websiteUrl} target="_blank" rel="noopener noreferrer">
                                        {websiteUrl}
                                    </Link>
                                </div>

                                <div className={`${modalStyles.urlBox} ${pageStyles.successQr}`}>
                                    <span>{t('widgets.qr_portfolio_title')}</span>
                                    <div className={pageStyles.qrImageWrap} style={{ marginTop: 12 }}>
                                        {qrDataUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={qrDataUrl} alt="" className={pageStyles.qrImage} />
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        className={modalStyles.doneBtn}
                                        style={{ marginTop: 12 }}
                                        onClick={downloadQr}
                                        disabled={!qrDataUrl}
                                    >
                                        {t('widgets.download_qr')}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className={modalStyles.doneBtn}
                                    onClick={() => {
                                        window.location.reload();
                                    }}
                                >
                                    {t('quiz_modal.close')}
                                </button>
                            </div>
                        ) : (
                            <>
                                {isActive && (
                                    <div
                                        className={modalStyles.urlBox}
                                        style={{
                                            marginBottom: '20px',
                                            background: '#f0f9ff',
                                            padding: '12px',
                                            borderRadius: '10px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.85rem',
                                                color: '#0369a1',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t('widgets.current_website_label')}
                                        </span>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginTop: '4px',
                                            }}
                                        >
                                            <Link
                                                href={`https://expertvisits.com/u/${currentUser?.username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontSize: '14px',
                                                    color: '#0284c7',
                                                    fontWeight: 500,
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                expertvisits.com/u/{currentUser?.username}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <p className={modalStyles.label}>{t('widgets.select_template')}</p>

                                {isFetching ? (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '20px',
                                            color: '#6b7280',
                                        }}
                                    >
                                        {t('common.loading')}
                                    </div>
                                ) : (
                                    <div className={modalStyles.options}>
                                        <div
                                            className={`${modalStyles.option} ${selected === 1 ? modalStyles.active : ''}`}
                                            onClick={() => setSelected(1)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && setSelected(1)
                                            }
                                        >
                                            <div className={modalStyles.iconBox}>
                                                <LayoutTemplate size={24} />
                                            </div>
                                            <span className={modalStyles.templateName}>
                                                {t('widgets.template1_name')}
                                            </span>
                                            {selected === 1 && (
                                                <CheckCircle className={modalStyles.checkIcon} size={20} />
                                            )}
                                        </div>

                                        <div
                                            className={`${modalStyles.option} ${selected === 2 ? modalStyles.active : ''}`}
                                            onClick={() => setSelected(2)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && setSelected(2)
                                            }
                                        >
                                            <div className={modalStyles.iconBox}>
                                                <PaintBucket size={24} />
                                            </div>
                                            <span className={modalStyles.templateName}>
                                                {t('widgets.template2_name')}
                                            </span>
                                            {selected === 2 && (
                                                <CheckCircle className={modalStyles.checkIcon} size={20} />
                                            )}
                                        </div>

                                        <div
                                            className={`${modalStyles.option} ${selected === 3 ? modalStyles.active : ''}`}
                                            onClick={() => setSelected(3)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && setSelected(3)
                                            }
                                        >
                                            <div className={modalStyles.iconBox}>
                                                <Briefcase size={24} />
                                            </div>
                                            <span className={modalStyles.templateName}>
                                                {t('widgets.template3_name')}
                                            </span>
                                            {selected === 3 && (
                                                <CheckCircle className={modalStyles.checkIcon} size={20} />
                                            )}
                                        </div>

                                        <div
                                            className={`${modalStyles.option} ${selected === 4 ? modalStyles.active : ''}`}
                                            onClick={() => setSelected(4)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && setSelected(4)
                                            }
                                        >
                                            <div className={modalStyles.iconBox}>
                                                <Sidebar size={24} />
                                            </div>
                                            <span className={modalStyles.templateName}>
                                                {t('widgets.template4_name')}
                                            </span>
                                            {selected === 4 && (
                                                <CheckCircle className={modalStyles.checkIcon} size={20} />
                                            )}
                                        </div>

                                        <div
                                            className={`${modalStyles.option} ${selected === 5 ? modalStyles.active : ''}`}
                                            onClick={() => setSelected(5)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && setSelected(5)
                                            }
                                        >
                                            <div className={modalStyles.iconBox}>
                                                <Stethoscope size={24} />
                                            </div>
                                            <span className={modalStyles.templateName}>
                                                {t('widgets.template5_name')}
                                            </span>
                                            {selected === 5 && (
                                                <CheckCircle className={modalStyles.checkIcon} size={20} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={modalStyles.disclaimer} style={{ marginBottom: '24px' }}>
                                    {t('widgets.contact_disclaimer')}
                                </div>

                                <div
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {t('widgets.profile_completion')}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    color: progress >= 60 ? '#10b981' : '#ef4444',
                                                }}
                                            >
                                                {progress}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                background: '#e2e8f0',
                                                height: '8px',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    background:
                                                        progress >= 60 ? '#10b981' : '#ef4444',
                                                    transition: 'width 0.4s ease',
                                                }}
                                            />
                                        </div>
                                        {progress < 60 && (
                                            <p
                                                style={{
                                                    color: '#64748b',
                                                    fontSize: '0.8rem',
                                                    marginTop: '8px',
                                                    lineHeight: '1.4',
                                                }}
                                            >
                                                {t('widgets.profile_completion_desc')}
                                                <Link
                                                    href="/profile"
                                                    style={{
                                                        color: '#4f46e5',
                                                        marginLeft: '6px',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {t('widgets.go_to_profile')}
                                                </Link>
                                            </p>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            height: '1px',
                                            background: '#e2e8f0',
                                            width: '100%',
                                        }}
                                    />

                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {t('widgets.articles')}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    color: articlesCount >= 3 ? '#10b981' : '#f59e0b',
                                                }}
                                            >
                                                {articlesCount} / 3
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                background: '#e2e8f0',
                                                height: '8px',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${Math.min((articlesCount / 3) * 100, 100)}%`,
                                                    height: '100%',
                                                    background:
                                                        articlesCount >= 3 ? '#10b981' : '#f59e0b',
                                                    transition: 'width 0.4s ease',
                                                }}
                                            />
                                        </div>
                                        {articlesCount < 3 && (
                                            <p
                                                style={{
                                                    color: '#64748b',
                                                    fontSize: '0.8rem',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                {t('widgets.articles_desc')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {!showSuccess && (
                        <div
                            className={modalStyles.footer}
                            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                        >
                            {isActive && (
                                <button
                                    type="button"
                                    onClick={handleDeactivate}
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {t('widgets.deactivate_website')}
                                </button>
                            )}
                            <button
                                type="button"
                                className={modalStyles.saveBtn}
                                onClick={handleSave}
                                disabled={loading || progress < 60}
                                style={{
                                    flex: 1,
                                    minWidth: '160px',
                                    opacity: progress < 60 ? 0.6 : 1,
                                    cursor: progress < 60 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading
                                    ? t('widgets.saving')
                                    : isActive
                                      ? t('common.save')
                                      : t('widgets.create_website_btn')}
                            </button>
                        </div>
                    )}
                </div>

                {!showSuccess ? qrBlock : null}
            </div>
        </div>
    );
}
