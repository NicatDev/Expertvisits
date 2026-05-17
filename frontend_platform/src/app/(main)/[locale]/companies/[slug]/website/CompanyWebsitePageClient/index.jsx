'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Download, LayoutTemplate } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { business } from '@/lib/api';
import { mergeCompanyWebsiteVisibility } from '@/lib/companyWebsiteVisibility';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useLocalizedPath } from '@/hooks/useLocalePath';
import pageStyles from '../../../../website-template/WebsiteTemplatePageClient/style.module.scss';

const MIN_ITEMS = 1;
const DEFAULT_THEME_PRIMARY = '#1e40af';
const DEFAULT_THEME_SECONDARY = '#6366f1';

function groupFromSectionKey(key) {
    if (key.startsWith('services_')) return 'services';
    if (key.startsWith('projects_')) return 'projects';
    if (key.startsWith('partners_')) return 'partners';
    if (key.startsWith('vacancies_')) return 'vacancies';
    return null;
}

function formatSaveError(error) {
    const d = error?.response?.data;
    if (!d) return error?.message || 'Request failed';
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.detail)) return d.detail[0] || 'Request failed';
    const firstKey = Object.keys(d).find((k) => k !== 'detail');
    if (firstKey) {
        const v = d[firstKey];
        if (Array.isArray(v)) return v[0];
        if (typeof v === 'string') return v;
    }
    return 'Request failed';
}

export default function CompanyWebsitePageClient({ params }) {
    const resolved = use(params);
    const slug = resolved.slug;
    const { t } = useTranslation('common');
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();
    const companyHref = useLocalizedPath(`/companies/${slug}`);
    const loginNext = useLocalizedPath(`/companies/${slug}/website`);

    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [publicUrl, setPublicUrl] = useState('');
    const [sectionVisibility, setSectionVisibility] = useState(() =>
        mergeCompanyWebsiteVisibility({}),
    );
    const [servicesCount, setServicesCount] = useState(0);
    const [projectsCount, setProjectsCount] = useState(0);
    const [partnersCount, setPartnersCount] = useState(0);
    const [vacanciesCount, setVacanciesCount] = useState(0);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState(1);
    const [themePrimary, setThemePrimary] = useState(DEFAULT_THEME_PRIMARY);
    const [themeSecondary, setThemeSecondary] = useState(DEFAULT_THEME_SECONDARY);

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

    const loadWebsiteState = useCallback(async () => {
        const { data } = await business.getCompanyWebsite(slug);
        setSectionVisibility(mergeCompanyWebsiteVisibility(data?.section_visibility));
        const active = Boolean(data?.is_active);
        setIsActive(active);
        const pub = (data?.public_url || '').trim();
        setPublicUrl(pub);
        const tid = Number(data?.template_id);
        setSelectedTemplateId([1, 2, 3].includes(tid) ? tid : 1);
        setThemePrimary((data?.theme_primary || DEFAULT_THEME_PRIMARY).toLowerCase());
        setThemeSecondary((data?.theme_secondary || DEFAULT_THEME_SECONDARY).toLowerCase());
        return { active, pub };
    }, [slug]);

    const loadCompanyCounts = useCallback(async () => {
        const { data: co } = await business.getCompany(slug);
        const isOwner =
            currentUser &&
            (currentUser.id === co.owner_id || currentUser.username === co.owner);
        if (!isOwner) {
            setForbidden(true);
            return null;
        }
        setServicesCount(Array.isArray(co.services) ? co.services.length : 0);
        setProjectsCount(Array.isArray(co.company_projects) ? co.company_projects.length : 0);
        setPartnersCount(Array.isArray(co.partners) ? co.partners.length : 0);
        try {
            const vac = await business.getVacancies({ company: co.id, page_size: 1 });
            const n = vac.data?.count ?? vac.data?.results?.length ?? 0;
            setVacanciesCount(typeof n === 'number' ? n : 0);
        } catch {
            setVacanciesCount(0);
        }
        return co;
    }, [slug, currentUser]);

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser?.id) {
            toast.info(t('auth.login_required'));
            router.replace(`/login?next=${encodeURIComponent(loginNext)}`);
            return;
        }

        let cancelled = false;

        const run = async () => {
            setIsFetching(true);
            setForbidden(false);
            try {
                const co = await loadCompanyCounts();
                if (cancelled || !co) return;
                const { active, pub } = await loadWebsiteState();
                if (cancelled) return;
                await syncQr(active, pub);
            } catch (e) {
                if (e?.response?.status === 403) {
                    setForbidden(true);
                } else {
                    console.error(e);
                    toast.error(formatSaveError(e));
                }
            } finally {
                if (!cancelled) setIsFetching(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [authLoading, currentUser?.id, loadCompanyCounts, loadWebsiteState, loginNext, router, slug, syncQr, t]);

    const canEnableSectionGroup = (group) => {
        if (group === 'services') return servicesCount >= MIN_ITEMS;
        if (group === 'projects') return projectsCount >= MIN_ITEMS;
        if (group === 'partners') return partnersCount >= MIN_ITEMS;
        if (group === 'vacancies') return vacanciesCount >= MIN_ITEMS;
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
            if (g === 'services' && servicesCount < MIN_ITEMS) {
                toast.warning(t('company_website.section_enable_services'));
                return;
            }
            if (g === 'projects' && projectsCount < MIN_ITEMS) {
                toast.warning(t('company_website.section_enable_projects'));
                return;
            }
            if (g === 'partners' && partnersCount < MIN_ITEMS) {
                toast.warning(t('company_website.section_enable_partners'));
                return;
            }
            if (g === 'vacancies' && vacanciesCount < MIN_ITEMS) {
                toast.warning(t('company_website.section_enable_vacancies'));
                return;
            }
        }
        setSectionVisibility((prev) => ({ ...prev, [key]: nextChecked }));
    };

    const validateSectionVisibilityForSave = () => {
        const v = sectionVisibility;
        if ((v.services_on_home || v.services_page) && servicesCount < MIN_ITEMS) {
            toast.error(t('company_website.section_save_services'));
            return false;
        }
        if ((v.projects_on_home || v.projects_page) && projectsCount < MIN_ITEMS) {
            toast.error(t('company_website.section_save_projects'));
            return false;
        }
        if ((v.partners_on_home || v.partners_page) && partnersCount < MIN_ITEMS) {
            toast.error(t('company_website.section_save_partners'));
            return false;
        }
        if ((v.vacancies_on_home || v.vacancies_page) && vacanciesCount < MIN_ITEMS) {
            toast.error(t('company_website.section_save_vacancies'));
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateSectionVisibilityForSave()) return;
        setLoading(true);
        try {
            await business.updateCompanyWebsite(slug, {
                template_id: selectedTemplateId,
                section_visibility: sectionVisibility,
                theme_primary: themePrimary,
                theme_secondary: themeSecondary,
            });
            toast.success(t('company_website.save_success'));
            const { active, pub } = await loadWebsiteState();
            await syncQr(active, pub);
            router.refresh();
        } catch (error) {
            toast.error(formatSaveError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            await business.deleteCompanyWebsite(slug);
            toast.success(t('company_website.deactivate_success'));
            const { active, pub } = await loadWebsiteState();
            await syncQr(active, pub);
            router.refresh();
        } catch (error) {
            toast.error(formatSaveError(error));
        } finally {
            setLoading(false);
        }
    };

    const downloadQr = () => {
        if (!qrDataUrl || !isActive || !publicUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `company-site-${slug}.png`;
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

    if (forbidden) {
        return (
            <div className={pageStyles.page}>
                <p style={{ textAlign: 'center', color: '#64748b', padding: 48 }}>
                    {t('company_website.forbidden')}
                </p>
                <p style={{ textAlign: 'center' }}>
                    <Link href={companyHref} className={pageStyles.backLink}>
                        {t('company_website.back_to_company')}
                    </Link>
                </p>
            </div>
        );
    }

    const showSectionHint =
        servicesCount < MIN_ITEMS ||
        projectsCount < MIN_ITEMS ||
        partnersCount < MIN_ITEMS ||
        vacanciesCount < MIN_ITEMS;

    const qrSiteReady = isActive && Boolean(publicUrl);

    const qrBlock = (
        <div className={pageStyles.qrCard}>
            <h2 className={pageStyles.qrTitle}>{t('company_website.qr_title')}</h2>
            {qrSiteReady ? (
                <>
                    <p className={pageStyles.qrHint}>{t('company_website.qr_hint')}</p>
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
                    <p className={pageStyles.qrHint}>{t('company_website.qr_inactive_hint')}</p>
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

    const sectionRows = [
        ['about_page', 'company_website.sec_about_page'],
        ['services_on_home', 'company_website.sec_services_home'],
        ['services_page', 'company_website.sec_services_page'],
        ['projects_on_home', 'company_website.sec_projects_home'],
        ['projects_page', 'company_website.sec_projects_page'],
        ['partners_on_home', 'company_website.sec_partners_home'],
        ['partners_page', 'company_website.sec_partners_page'],
        ['vacancies_on_home', 'company_website.sec_vacancies_home'],
        ['vacancies_page', 'company_website.sec_vacancies_page'],
        ['contact_page', 'company_website.sec_contact_page'],
        ['show_phone_on_site', 'company_website.sec_show_phone'],
        ['show_email_on_site', 'company_website.sec_show_email'],
    ];

    return (
        <div className={pageStyles.page}>
            <div className={pageStyles.topBar}>
                <Link href={companyHref} className={pageStyles.backLink}>
                    <ArrowLeft size={18} />
                    {t('company_website.back_to_company')}
                </Link>
                <h1 className={pageStyles.pageTitle}>
                    {isActive ? t('company_website.title_edit') : t('company_website.title_create')}
                </h1>
            </div>

            <div className={pageStyles.grid}>
                <div className={pageStyles.mainCard}>
                    <div className={pageStyles.innerHeader}>
                        <h3>
                            {isActive
                                ? t('company_website.title_edit')
                                : t('company_website.title_create')}
                        </h3>
                    </div>

                    <div className={pageStyles.innerBody}>
                        {!isActive ? (
                            <div className={pageStyles.inactiveNotice}>
                                {t('company_website.inactive_notice')}
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
                                        href={publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: '14px',
                                            color: '#0284c7',
                                            fontWeight: 500,
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {publicUrl.replace(/^https?:\/\//, '')}
                                    </Link>
                                </div>
                            </div>
                        )}

                        <p className={pageStyles.label}>{t('company_website.select_template')}</p>

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
                                <button
                                    type="button"
                                    className={`${pageStyles.option} ${selectedTemplateId === 1 ? pageStyles.active : ''}`}
                                    onClick={() => setSelectedTemplateId(1)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('company_website.template1_name')}
                                    </span>
                                    {selectedTemplateId === 1 ? (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    className={`${pageStyles.option} ${selectedTemplateId === 2 ? pageStyles.active : ''}`}
                                    onClick={() => setSelectedTemplateId(2)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('company_website.template2_name')}
                                    </span>
                                    {selectedTemplateId === 2 ? (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    className={`${pageStyles.option} ${selectedTemplateId === 3 ? pageStyles.active : ''}`}
                                    onClick={() => setSelectedTemplateId(3)}
                                >
                                    <div className={pageStyles.iconBox}>
                                        <LayoutTemplate size={24} />
                                    </div>
                                    <span className={pageStyles.templateName}>
                                        {t('company_website.template3_name')}
                                    </span>
                                    {selectedTemplateId === 3 ? (
                                        <CheckCircle className={pageStyles.checkIcon} size={20} />
                                    ) : null}
                                </button>
                            </div>
                        )}

                        <div style={{ marginTop: 24, marginBottom: 8 }}>
                            <p className={pageStyles.label}>{t('company_website.theme_title')}</p>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: 16,
                                    marginTop: 12,
                                }}
                            >
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                        {t('company_website.theme_primary')}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input
                                            type="color"
                                            value={themePrimary}
                                            onChange={(e) => setThemePrimary(e.target.value.toLowerCase())}
                                            style={{
                                                width: 48,
                                                height: 40,
                                                padding: 0,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={themePrimary}
                                            onChange={(e) => setThemePrimary(e.target.value.trim().toLowerCase())}
                                            maxLength={7}
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                border: '1px solid #e2e8f0',
                                                fontFamily: 'monospace',
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                        {t('company_website.theme_secondary')}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input
                                            type="color"
                                            value={themeSecondary}
                                            onChange={(e) => setThemeSecondary(e.target.value.toLowerCase())}
                                            style={{
                                                width: 48,
                                                height: 40,
                                                padding: 0,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={themeSecondary}
                                            onChange={(e) => setThemeSecondary(e.target.value.trim().toLowerCase())}
                                            maxLength={7}
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                border: '1px solid #e2e8f0',
                                                fontFamily: 'monospace',
                                                fontSize: 14,
                                            }}
                                        />
                                    </div>
                                </label>
                            </div>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                                {t('company_website.theme_hint')}
                            </p>
                        </div>

                        <div className={pageStyles.sectionToggles}>
                            <p className={pageStyles.sectionTogglesTitle}>
                                {t('company_website.sections_title')}
                            </p>
                            {sectionRows.map(([key, labelKey]) => {
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

                        {showSectionHint ? (
                            <div className={pageStyles.sectionRequirements}>
                                {servicesCount < MIN_ITEMS ? (
                                    <p>
                                        {t('company_website.warn_services', {
                                            count: servicesCount,
                                            min: MIN_ITEMS,
                                        })}{' '}
                                        <Link href={companyHref}>{t('company_website.link_company')}</Link>
                                    </p>
                                ) : null}
                                {projectsCount < MIN_ITEMS ? (
                                    <p>
                                        {t('company_website.warn_projects', {
                                            count: projectsCount,
                                            min: MIN_ITEMS,
                                        })}{' '}
                                        <Link href={companyHref}>{t('company_website.link_company')}</Link>
                                    </p>
                                ) : null}
                                {partnersCount < MIN_ITEMS ? (
                                    <p>
                                        {t('company_website.warn_partners', {
                                            count: partnersCount,
                                            min: MIN_ITEMS,
                                        })}{' '}
                                        <Link href={companyHref}>{t('company_website.link_company')}</Link>
                                    </p>
                                ) : null}
                                {vacanciesCount < MIN_ITEMS ? (
                                    <p>
                                        {t('company_website.warn_vacancies', {
                                            count: vacanciesCount,
                                            min: MIN_ITEMS,
                                        })}{' '}
                                        <Link href={companyHref}>{t('company_website.link_company')}</Link>
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
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
                            disabled={loading || isFetching}
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
