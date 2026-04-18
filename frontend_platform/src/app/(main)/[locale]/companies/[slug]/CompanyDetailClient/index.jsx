"use client";
import React, { useState, useEffect, useLayoutEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { business } from '@/lib/api';
import { MapPin, Globe, Linkedin, Instagram, Facebook, Edit, Phone, Mail, Award, Users, Target, Briefcase, Camera, Trash2, Edit2, LayoutTemplate } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLocalizedPath } from '@/hooks/useLocalePath';
import styles from './style.module.scss';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import EditSectionModal from '../../components/EditSectionModal';
import EditCompanyModal from '../../components/EditCompanyModal';
import EntityServicesTab from '@/components/advanced/EntityServicesTab';
import EntityVacanciesTab from '@/components/advanced/EntityVacanciesTab';
import EntityProjectsTab from '@/components/advanced/EntityProjectsTab';
import EntityCompanyPartnerCardsTab from '@/components/advanced/EntityCompanyPartnerCardsTab';
import { useTranslation } from '@/i18n/client';

function ExpandableSectionDescription({ text, sectionStyles, translate }) {
    const [expanded, setExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const pRef = useRef(null);

    useLayoutEffect(() => {
        const el = pRef.current;
        if (!text?.trim() || !el) {
            setShowToggle(false);
            return;
        }
        if (expanded) {
            setShowToggle(true);
            return;
        }
        const measure = () => {
            setShowToggle(el.scrollHeight > el.clientHeight + 2);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [text, expanded]);

    if (!text?.trim()) return null;

    return (
        <>
            <p
                ref={pRef}
                className={
                    expanded
                        ? sectionStyles.sectionBody
                        : `${sectionStyles.sectionBody} ${sectionStyles.sectionBodyClamped}`.trim()
                }
            >
                {text}
            </p>
            {showToggle && (
                <button
                    type="button"
                    className={sectionStyles.readMoreToggle}
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded
                        ? translate('company_detail.sections.read_less')
                        : translate('company_detail.sections.read_more')}
                </button>
            )}
        </>
    );
}

export default function CompanyDetailClient({ params }) {
    const { t } = useTranslation('common');
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const router = useRouter();
    const companyWebsiteHref = useLocalizedPath(`/companies/${slug}/website`);

    const { user } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('about');

    // Modal State
    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [isSectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionType, setSectionType] = useState('');
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null });

    // Cover/Logo Menu State
    const fileInputRef = React.useRef(null);
    const logoInputRef = React.useRef(null);
    const [coverRefreshKey, setCoverRefreshKey] = useState(Date.now());

    // Tab Data
    const [vacancies, setVacancies] = useState([]);

    const loadCompany = async () => {
        try {
            const res = await business.getCompany(slug, {
                params: { _: Date.now() },
            });
            setCompany(res.data);
            loadVacancies(res.data.id);
        } catch (err) {
            console.error("Failed to load company", err);
            setError(t('company_detail.not_found'));
        } finally {
            setLoading(false);
        }
    };

    const loadVacancies = async (companyId) => {
        try {
            const res = await business.getVacancies({ company: companyId }); // Adjust filter if needed
            setVacancies(res.data.results || res.data || []);
        } catch (e) {
            console.error("Failed vacancies", e);
        }
    };

    useEffect(() => {
        if (slug) loadCompany();
    }, [slug]);

    const isOwner = user?.id === company?.owner_id || user?.username === company?.owner;

    // Handlers
    const handleEditCompany = () => setCompanyModalOpen(true);
    const handleCompanyUpdated = () => loadCompany();

    const handleAddSection = (type) => {
        setSectionType(type);
        setEditingSection(null);
        setSectionModalOpen(true);
    };

    const handleEditSection = (item, type) => {
        setSectionType(type);
        setEditingSection(item);
        setSectionModalOpen(true);
    };

    const handleSectionSaved = () => loadCompany();

    const handleFileChange = async (e, type = 'cover_image') => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append(type, file);

        try {
            await business.updateCompany(slug, formData);
            await loadCompany();
            if (type === 'cover_image') setCoverRefreshKey(Date.now());
        } catch (err) {
            console.error(`Failed to update ${type}`, err);
            // Optionally show toast
        }
    };

    const deleteCover = async () => {
        const formData = new FormData();
        formData.append('delete_cover_image', 'true');

        try {
            await business.updateCompany(slug, formData);
            await loadCompany();
            setCoverRefreshKey(Date.now());
            setConfirmationModal({ isOpen: false }); // Close modal
        } catch (err) {
            console.error("Failed to delete cover", err);
        }
    };

    const deleteLogo = async () => {
        const formData = new FormData();
        formData.append('delete_logo', 'true');

        try {
            await business.updateCompany(slug, formData);
            await loadCompany();
            setConfirmationModal({ isOpen: false });
        } catch (err) {
            console.error("Failed to delete logo", err);
        }
    };

    if (loading) return <div className={styles.loading}>{t('common.loading')}</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!company) return null;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.coverContainer}>
                    {company.cover_image ? (
                        <img
                            src={`${company.cover_image}?t=${coverRefreshKey}`}
                            className={styles.coverImage}
                            alt="Cover"
                            key={`${company.cover_image}-${coverRefreshKey}`}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : (
                        <div className={styles.defaultCover} />
                    )}

                    {isOwner && (
                        <div className={styles.editOverlay} style={{ backdropFilter: 'none', background: 'transparent', gap: '10px', display: 'flex', position: 'absolute', top: '10px', right: '10px' }}>
                            <div
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                                style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333' }}
                                title={t('company_detail.edit_cover')}
                            >
                                <Edit2 size={16} />
                            </div>
                            {company.cover_image && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmationModal({
                                            isOpen: true,
                                            title: t('company_detail.delete_cover'),
                                            message: t('company_detail.delete_cover_confirm'),
                                            onConfirm: deleteCover
                                        });
                                    }}
                                    style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'red' }}
                                    title={t('company_detail.delete_cover')}
                                >
                                    <Trash2 size={16} />
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileChange(e, 'cover_image')}
                                accept="image/*"
                            />
                        </div>
                    )}

                    {/* Social Links Overlay */}
                    {(company.linkedin_url || company.instagram_url || company.facebook_url) && (
                        <div className={styles.socialLinksOverlay}>
                            {company.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noreferrer"><Linkedin size={18} /></a>}
                            {company.instagram_url && <a href={company.instagram_url} target="_blank" rel="noreferrer"><Instagram size={18} /></a>}
                            {company.facebook_url && <a href={company.facebook_url} target="_blank" rel="noreferrer"><Facebook size={18} /></a>}
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.avatarContainer}>
                        {company.logo ? (
                            <img src={company.logo} className={styles.avatar} alt="Logo" />
                        ) : (
                            <div className={styles.avatarPlaceholder}>{company.name?.charAt(0)}</div>
                        )}
                        {isOwner && (
                            <div
                                className={styles.avatarOverlay}
                                onClick={() => setActionModal({ isOpen: true, type: 'logo' })}
                            >
                                <Camera size={20} />
                            </div>
                        )}
                        <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" />
                    </div>

                    <div className={styles.names}>
                        <h1>{company.name}</h1>
                        <div className={styles.subtitle}>
                            {company.industry && <span>{company.industry}</span>}
                            {company.website_url && (
                                <>
                                    <span><Globe size={14} style={{ display: 'inline', marginBottom: '-2px' }} /></span>
                                    <a href={company.website_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {company.website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            {company.address && <span><MapPin size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> {company.address}</span>}
                        </div>
                    </div>

                    {isOwner && (
                        <div className={styles.actions} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button
                                variant="outline"
                                onClick={() => router.push(companyWebsiteHref)}
                                icon={<LayoutTemplate size={16} />}
                            >
                                {t('company_detail.company_website')}
                            </Button>
                            <Button variant="outline" onClick={handleEditCompany} icon={<Edit size={16} />}>
                                {t('company_detail.edit_company')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>{t('company_detail.tabs.about')}</button>
                <button className={activeTab === 'services' ? styles.activeTab : ''} onClick={() => setActiveTab('services')}>{t('company_detail.tabs.services')}</button>
                <button className={activeTab === 'projects' ? styles.activeTab : ''} onClick={() => setActiveTab('projects')}>{t('company_detail.tabs.projects')}</button>
                <button className={activeTab === 'partners' ? styles.activeTab : ''} onClick={() => setActiveTab('partners')}>{t('company_detail.tabs.partners')}</button>
                <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>{t('company_detail.tabs.vacancies')}</button>
            </div>

            {/* Content */}
            {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                    {/* Basic Info Block */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>{t('company_detail.info.title')}</h2>
                        </div>
                        <div className={styles.list}>
                            {(company.slogan?.trim() || isOwner) && (
                                <div className={styles.editableField}>
                                    <span className={styles.label}>{t('company_detail.info.slogan')}</span>
                                    <div className={styles.value}>
                                        {company.slogan?.trim() || (isOwner ? '—' : '')}
                                    </div>
                                </div>
                            )}
                            {company.summary && (
                                <div className={styles.editableField}>
                                    <span className={styles.label}>{t('company_detail.info.summary')}</span>
                                    <div className={styles.value}>{company.summary}</div>
                                </div>
                            )}
                            {company.website_url && (
                                <div className={styles.editableField}>
                                    <span className={styles.label}>{t('company_detail.info.website')}</span>
                                    <div className={styles.value}>
                                        <a href={company.website_url} target="_blank" rel="noreferrer" style={{ color: '#1890ff', textDecoration: 'none' }}>
                                            {company.website_url}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {isOwner && company.phone && (
                                <div className={styles.editableField}>
                                    <span className={styles.label}>{t('company_detail.info.phone')}</span>
                                    <div className={styles.value}>{company.phone}</div>
                                </div>
                            )}
                            <div className={styles.editableField}>
                                <span className={styles.label}>{t('company_detail.info.founded')}</span>
                                <div className={styles.value}>{company.founded_at ? new Date(company.founded_at).getFullYear() : 'N/A'}</div>
                            </div>
                            <div className={styles.editableField}>
                                <span className={styles.label}>{t('company_detail.info.size')}</span>
                                <div className={styles.value}>{company.company_size || 'N/A'} {t('company_detail.info.employees')}</div>
                            </div>
                            {company.email && (
                                <div className={styles.editableField}>
                                    <span className={styles.label}>{t('company_detail.info.email')}</span>
                                    <div className={styles.value}>{company.email}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Who We Are */}
                    {(company.who_we_are || isOwner) && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>{t('company_detail.sections.who_we_are')}</h2>
                                {isOwner && (
                                    <Button size="sm" variant="ghost" onClick={() => company.who_we_are ? handleEditSection(company.who_we_are, 'who-we-are') : handleAddSection('who-we-are')}>
                                        {company.who_we_are ? <Edit size={16} /> : t('company_detail.sections.add')}
                                    </Button>
                                )}
                            </div>
                            {company.who_we_are ? (
                                <div className={styles.blockContent}>
                                    <ExpandableSectionDescription
                                        text={company.who_we_are.description}
                                        sectionStyles={styles}
                                        translate={t}
                                    />
                                </div>
                            ) : (
                                <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('who-we-are')}>{t('company_detail.sections.add_placeholder', { section: t('company_detail.sections.who_we_are') })}</div>
                            )}
                        </div>
                    )}

                    {/* What We Do */}
                    {(company.what_we_do || isOwner) && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>{t('company_detail.sections.what_we_do')}</h2>
                                {isOwner && (
                                    <Button size="sm" variant="ghost" onClick={() => company.what_we_do ? handleEditSection(company.what_we_do, 'what-we-do') : handleAddSection('what-we-do')}>
                                        {company.what_we_do ? <Edit size={16} /> : t('company_detail.sections.add')}
                                    </Button>
                                )}
                            </div>
                            {company.what_we_do ? (
                                <div className={styles.blockContent}>
                                    <ExpandableSectionDescription
                                        text={company.what_we_do.description}
                                        sectionStyles={styles}
                                        translate={t}
                                    />
                                </div>
                            ) : (
                                <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('what-we-do')}>{t('company_detail.sections.add_placeholder', { section: t('company_detail.sections.what_we_do') })}</div>
                            )}
                        </div>
                    )}

                    {/* Our Values */}
                    {(company.our_values || isOwner) && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>{t('company_detail.sections.our_values')}</h2>
                                {isOwner && (
                                    <Button size="sm" variant="ghost" onClick={() => company.our_values ? handleEditSection(company.our_values, 'our-values') : handleAddSection('our-values')}>
                                        {company.our_values ? <Edit size={16} /> : t('company_detail.sections.add')}
                                    </Button>
                                )}
                            </div>
                            {company.our_values ? (
                                <div className={styles.blockContent}>
                                    <ExpandableSectionDescription
                                        text={company.our_values.description}
                                        sectionStyles={styles}
                                        translate={t}
                                    />
                                </div>
                            ) : (
                                <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('our-values')}>{t('company_detail.sections.add_placeholder', { section: t('company_detail.sections.our_values') })}</div>
                            )}
                        </div>
                    )}



                </div>
            )}

            {activeTab === 'services' && (
                <EntityServicesTab
                    scope="company"
                    isOwner={isOwner}
                    companyId={company.id}
                    services={company.services}
                    onRefresh={loadCompany}
                    sectionClassName={styles.section}
                />
            )}
            {activeTab === 'projects' && (
                <EntityProjectsTab
                    scope="company"
                    isOwner={isOwner}
                    companyId={company.id}
                    projects={company.company_projects}
                    onRefresh={loadCompany}
                    sectionClassName={styles.section}
                />
            )}
            {activeTab === 'partners' && (
                <EntityCompanyPartnerCardsTab
                    isOwner={isOwner}
                    companyId={company.id}
                    items={company.partners}
                    onRefresh={loadCompany}
                    sectionClassName={styles.section}
                />
            )}
            {activeTab === 'vacancies' && (
                <EntityVacanciesTab
                    scope="company"
                    isOwner={isOwner}
                    companyId={company.id}
                    vacancies={vacancies}
                    onRefresh={() => loadVacancies(company.id)}
                    sectionClassName={styles.section}
                />
            )}

            <EditCompanyModal
                isOpen={isCompanyModalOpen}
                onClose={() => setCompanyModalOpen(false)}
                company={company}
                onSuccess={handleCompanyUpdated}
            />

            <EditSectionModal
                isOpen={isSectionModalOpen}
                onClose={() => setSectionModalOpen(false)}
                sectionType={sectionType}
                initialData={editingSection}
                companyId={company.id}
                onSuccess={handleSectionSaved}
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={confirmationModal.onConfirm}
            />

            {/* Simple Action Modal for Logo */}
            {actionModal.isOpen && actionModal.type === 'logo' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }} onClick={() => setActionModal({ isOpen: false, type: null })}>
                    <div style={{ background: 'white', borderRadius: '8px', width: '300px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{t('company_detail.logo_modal.title')}</div>
                        <div
                            style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                                logoInputRef.current.click();
                                setActionModal({ isOpen: false, type: null });
                            }}
                        >
                            <Edit2 size={16} /> {t('company_detail.logo_modal.change')}
                        </div>
                        {company.logo && (
                            <div
                                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'red' }}
                                onClick={() => {
                                    setActionModal({ isOpen: false, type: null });
                                    setConfirmationModal({
                                        isOpen: true, title: t('company_detail.logo_modal.delete'), message: t('company_detail.logo_modal.delete_confirm'), onConfirm: deleteLogo
                                    });
                                }}
                            >
                                <Trash2 size={16} /> {t('company_detail.logo_modal.remove')}
                            </div>
                        )}
                        <div
                            style={{ padding: '12px 16px', cursor: 'pointer', borderTop: '1px solid #eee', textAlign: 'center', color: '#666' }}
                            onClick={() => setActionModal({ isOpen: false, type: null })}
                        >
                            {t('company_detail.logo_modal.cancel')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
