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
    Code,
    ArrowLeft,
    Download,
} from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { websites_api, content, profiles } from '@/lib/api';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useLocalizedPath } from '@/hooks/useLocalePath';
import pageStyles from './style.module.scss';

const MIN_SECTION_ITEMS = 3;

function groupFromSectionKey(key) {
    if (key.startsWith('services_')) return 'services';
    if (key.startsWith('projects_')) return 'projects';
    if (key.startsWith('articles_')) return 'articles';
    return null;
}

export default function WebsiteTemplatePageClient() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();
    const profileHref = useLocalizedPath('/profile');
    const profileServicesHref = useLocalizedPath('/profile/services');
    const profileProjectsHref = useLocalizedPath('/profile/projects');
    const profilePostsHref = useLocalizedPath('/profile/posts');

    const [selected, setSelected] = useState(2);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [articlesCount, setArticlesCount] = useState(0);
    const [servicesCount, setServicesCount] = useState(0);
    const [projectsCount, setProjectsCount] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isFetching, setIsFetching] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [sectionVisibility, setSectionVisibility] = useState(() => mergeSectionVisibility({}));

    const portfolioUrl = currentUser?.username
        ? `https://expertvisits.com/u/${currentUser.username}`
        : '';

    const syncQr = useCallback(async (active, url) => {
        if (!active || !url) {
            setQrDataUrl('');
            setQrLoading(false);
            return;
        }
        setQrLoading(true);
        try {
            const QR = await import('qrcode');
            const dataUrl = await QR.toDataURL(url, {
                width: 320,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
            setQrDataUrl(dataUrl);
        } catch (e) {
            console.error('QR generation failed', e);
            setQrDataUrl('');
        } finally {
            setQrLoading(false);
        }
    }, []);

    const syncTemplate = useCallback(async () => {
        setIsFetching(true);
        try {
            const { data } = await websites_api.getTemplate();
            if (data?.template_id != null) setSelected(parseInt(data.template_id, 10));
            setSectionVisibility(mergeSectionVisibility(data?.section_visibility));
            const active = Boolean(data?.is_active);
            setIsActive(active);
            return active;
        } catch (error) {
            console.error('Failed to fetch current template', error);
            setIsActive(false);
            return false;
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser?.id) {
            toast.info(t('auth.login_required'));
            router.replace(`/login?next=${encodeURIComponent('/website-template')}`);
            return;
        }

        let cancelled = false;

        const run = async () => {
            fetchArticlesCount();
            await fetchProfileAndCounts();
            const active = await syncTemplate();
            if (cancelled) return;
            const url = currentUser.username
                ? `https://expertvisits.com/u/${currentUser.username}`
                : '';
            await syncQr(active, url);
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [authLoading, currentUser?.id, currentUser?.username, router, t, syncTemplate, syncQr]);

    const fetchProfileAndCounts = async () => {
        if (!currentUser) return;
        try {
            const [detailsRes, projectsRes] = await Promise.all([
                profiles.getProfileDetails(currentUser.id, {
                    params: { t: new Date().getTime() },
                }),
                profiles.getProjects({ params: { user_id: currentUser.id } }),
            ]);
            const data = detailsRes.data;
            const pr = projectsRes.data;
            const projectList = Array.isArray(pr) ? pr : pr?.results || [];
            setServicesCount(Array.isArray(data.services) ? data.services.length : 0);
            setProjectsCount(projectList.length);

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

    const fetchArticlesCount = async () => {
        try {
            const res = await content.getArticleStats();
            setArticlesCount(res.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch article count', error);
        }
    };

    const canEnableSectionGroup = (group) => {
        if (group === 'services') return servicesCount >= MIN_SECTION_ITEMS;
        if (group === 'projects') return projectsCount >= MIN_SECTION_ITEMS;
        if (group === 'articles') return articlesCount >= MIN_SECTION_ITEMS;
        return true;
    };

    const isSectionToggleDisabled = (key, checked) => {
        if (checked) return false;
        const g = groupFromSectionKey(key);
        if (!g) return false;
        return !canEnableSectionGroup(g);
    };

    const handleSectionToggle = (key, nextChecked) => {
        if (nextChecked) {
            const g = groupFromSectionKey(key);
            if (g === 'services' && servicesCount < MIN_SECTION_ITEMS) {
                toast.warning(t('widgets.section_enable_toast_services'));
                return;
            }
            if (g === 'projects' && projectsCount < MIN_SECTION_ITEMS) {
                toast.warning(t('widgets.section_enable_toast_projects'));
                return;
            }
            if (g === 'articles' && articlesCount < MIN_SECTION_ITEMS) {
                toast.warning(t('widgets.section_enable_toast_articles'));
                return;
            }
        }
        setSectionVisibility((prev) => ({ ...prev, [key]: nextChecked }));
    };

    const validateSectionVisibilityForSave = () => {
        const v = sectionVisibility;
        if ((v.services_on_home || v.services_page) && servicesCount < MIN_SECTION_ITEMS) {
            toast.error(t('widgets.section_save_toast_services'));
            return false;
        }
        if ((v.projects_on_home || v.projects_page) && projectsCount < MIN_SECTION_ITEMS) {
            toast.error(t('widgets.section_save_toast_projects'));
            return false;
        }
        if ((v.articles_on_home || v.articles_page) && articlesCount < MIN_SECTION_ITEMS) {
            toast.error(t('widgets.section_save_toast_articles'));
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (progress < 60) {
            toast.error(t('widgets.profile_completion_desc'));
            return;
        }
        if (!validateSectionVisibilityForSave()) return;

        setLoading(true);
        try {
            await websites_api.updateTemplate(selected, sectionVisibility);
            toast.success(t('widgets.success_msg'));
            const active = await syncTemplate();
            await syncQr(active, portfolioUrl);
            router.refresh();
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
            const active = await syncTemplate();
            await syncQr(active, portfolioUrl);
            router.refresh();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to deactivate template');
        } finally {
            setLoading(false);
        }
    };

    const downloadQr = () => {
        if (!qrDataUrl || !currentUser?.username || !isActive) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `expertvisits-website-${currentUser.username}.png`;
        a.click();
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

    const showSectionRequirementsHint =
        servicesCount < MIN_SECTION_ITEMS ||
        projectsCount < MIN_SECTION_ITEMS ||
        articlesCount < MIN_SECTION_ITEMS;

    const qrSiteReady = isActive && Boolean(portfolioUrl);

    const qrBlock = (
        <div className={pageStyles.qrCard}>
            <h2 className={pageStyles.qrTitle}>{t('widgets.qr_portfolio_title')}</h2>
            {qrSiteReady ? (
                <>
                    <p className={pageStyles.qrHint}>{t('widgets.qr_portfolio_hint')}</p>
                    <div className={pageStyles.qrImageWrap}>
                        {qrLoading ? (
                            <div className={pageStyles.qrPlaceholder}>{t('common.loading')}</div>
                        ) : qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrDataUrl} alt="" className={pageStyles.qrImage} />
                        ) : (
                            <div className={pageStyles.qrPlaceholder}>
                                {t('widgets.qr_not_available')}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        className={pageStyles.downloadQrBtn}
                        onClick={downloadQr}
                        disabled={qrLoading || !qrDataUrl}
                    >
                        <Download size={18} />
                        {t('widgets.download_qr')}
                    </button>
                </>
            ) : (
                <>
                    <p className={pageStyles.qrHint}>{t('widgets.qr_no_website_hint')}</p>
                    <div className={pageStyles.qrImageWrap}>
                        <div
                            className={pageStyles.qrPlaceholder}
                            aria-label={t('widgets.qr_not_available')}
                        />
                    </div>
                    <button type="button" className={pageStyles.downloadQrBtn} disabled>
                        <Download size={18} />
                        {t('widgets.download_qr')}
                    </button>
                </>
            )}
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
                    {isActive
                        ? t('widgets.edit_website_modal_title')
                        : t('widgets.create_website_modal_title')}
                </h1>
            </div>

            <div className={pageStyles.grid}>
                <div className={pageStyles.mainCard}>
                    <div className={pageStyles.innerHeader}>
                        <h3>
                            {isActive
                                ? t('widgets.edit_website_modal_title')
                                : t('widgets.create_website_modal_title')}
                        </h3>
                    </div>

                    <div className={pageStyles.innerBody}>
                        {!isActive ? (
                            <div className={pageStyles.inactiveNotice}>
                                {t('widgets.website_inactive_notice')}
                            </div>
                        ) : (
                            <div
                                className={pageStyles.urlBox}
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
                                        href={portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: '14px',
                                            color: '#0284c7',
                                            fontWeight: 500,
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {portfolioUrl.replace(/^https?:\/\//, '')}
                                    </Link>
                                </div>
                            </div>
                        )}

                        <p className={pageStyles.label}>{t('widgets.select_template')}</p>

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
                            <div className={pageStyles.options}>
                                <div
                                    className={`${pageStyles.option} ${selected === 1 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(1)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(1)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template1_name')}
                                    </span>
                                    {selected === 1 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>

                                <div
                                    className={`${pageStyles.option} ${selected === 2 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(2)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(2)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <PaintBucket size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template2_name')}
                                    </span>
                                    {selected === 2 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>

                                <div
                                    className={`${pageStyles.option} ${selected === 3 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(3)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(3)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <Briefcase size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template3_name')}
                                    </span>
                                    {selected === 3 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>

                                <div
                                    className={`${pageStyles.option} ${selected === 4 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(4)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(4)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <Sidebar size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template4_name')}
                                    </span>
                                    {selected === 4 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>

                                <div
                                    className={`${pageStyles.option} ${selected === 5 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(5)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(5)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <Stethoscope size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template5_name')}
                                    </span>
                                    {selected === 5 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>

                                <div
                                    className={`${pageStyles.option} ${selected === 6 ? pageStyles.active : ''}`}
                                    onClick={() => setSelected(6)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setSelected(6)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <Code size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('widgets.template6_name')}
                                    </span>
                                    {selected === 6 && (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={pageStyles.disclaimer} style={{ marginBottom: '24px' }}>
                            {t('widgets.contact_disclaimer')}
                        </div>

                        <div className={pageStyles.sectionToggles}>
                            <p className={pageStyles.sectionTogglesTitle}>
                                {t('widgets.portfolio_sections_title')}
                            </p>
                            {[
                                ['services_on_home', 'widgets.sec_services_home'],
                                ['services_page', 'widgets.sec_services_page'],
                                ['projects_on_home', 'widgets.sec_projects_home'],
                                ['projects_page', 'widgets.sec_projects_page'],
                                ['articles_on_home', 'widgets.sec_articles_home'],
                                ['articles_page', 'widgets.sec_articles_page'],
                            ].map(([key, labelKey]) => {
                                const checked = Boolean(sectionVisibility[key]);
                                return (
                                    <label key={key} className={pageStyles.toggleRow}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={isSectionToggleDisabled(key, checked)}
                                            onChange={(e) =>
                                                handleSectionToggle(key, e.target.checked)
                                            }
                                        />
                                        <span>{t(labelKey)}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {showSectionRequirementsHint ? (
                            <div className={pageStyles.sectionRequirements}>
                                {servicesCount < MIN_SECTION_ITEMS ? (
                                    <p>
                                        {t('widgets.section_warn_services', {
                                            count: servicesCount,
                                            min: MIN_SECTION_ITEMS,
                                        })}{' '}
                                        <Link href={profileServicesHref}>
                                            {t('widgets.section_link_services')}
                                        </Link>
                                    </p>
                                ) : null}
                                {projectsCount < MIN_SECTION_ITEMS ? (
                                    <p>
                                        {t('widgets.section_warn_projects', {
                                            count: projectsCount,
                                            min: MIN_SECTION_ITEMS,
                                        })}{' '}
                                        <Link href={profileProjectsHref}>
                                            {t('widgets.section_link_projects')}
                                        </Link>
                                    </p>
                                ) : null}
                                {articlesCount < MIN_SECTION_ITEMS ? (
                                    <p>
                                        {t('widgets.section_warn_articles', {
                                            count: articlesCount,
                                            min: MIN_SECTION_ITEMS,
                                        })}{' '}
                                        <Link href={profilePostsHref}>
                                            {t('widgets.section_link_articles')}
                                        </Link>
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

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
                                            background: progress >= 60 ? '#10b981' : '#ef4444',
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
                                            href={profileHref}
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
                        </div>
                    </div>

                    <div
                        className={pageStyles.footer}
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
                            className={pageStyles.saveBtn}
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
                </div>

                {qrBlock}
            </div>
        </div>
    );
}
