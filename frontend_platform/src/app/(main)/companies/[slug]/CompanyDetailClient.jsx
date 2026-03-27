"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { business } from '@/lib/api';
import { MapPin, Globe, Linkedin, Instagram, Facebook, Edit, Phone, Mail, Award, Users, Target, Briefcase, Camera, Trash2, Edit2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './CompanyDetail.module.scss';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import EditSectionModal from '../components/EditSectionModal'; // Will resolve to index.jsx
import EditCompanyModal from '../components/EditCompanyModal'; // Will resolve to index.jsx
import ServiceDetailModal from '@/components/ui/ServiceDetailModal';
import VacancyCard from '@/components/advanced/VacancyCard';
import FeedItem from '@/components/advanced/FeedItem'; // Assuming we can reuse or mock for now
import api from '@/lib/api/client'; // Direct API for feed if needed
import { useTranslation } from '@/i18n/client';

export default function CompanyDetailClient({ params }) {
    const { t } = useTranslation('common');
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    const router = useRouter();
    const { user } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [selectedService, setSelectedService] = useState(null);

    // Modal State
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
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);

    const loadCompany = async () => {
        try {
            const res = await business.getCompany(slug);
            setCompany(res.data);
            // Load related data
            loadVacancies(res.data.id);
            // loadPosts(res.data.id); // Uncomment if posts are ready
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

                    <div className={styles.actions}>
                        {isOwner ? (
                            <Button variant="outline" onClick={handleEditCompany} icon={<Edit size={16} />}>
                                {t('company_detail.edit_company')}
                            </Button>
                        ) : (
                            <Button variant="primary">{t('company_detail.follow')}</Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={activeTab === 'about' ? styles.activeTab : ''} onClick={() => setActiveTab('about')}>{t('company_detail.tabs.about')}</button>
                <button className={activeTab === 'services' ? styles.activeTab : ''} onClick={() => setActiveTab('services')}>{t('company_detail.tabs.services')}</button>
                <button className={activeTab === 'vacancies' ? styles.activeTab : ''} onClick={() => setActiveTab('vacancies')}>{t('company_detail.tabs.vacancies')}</button>
                <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>{t('company_detail.tabs.posts')}</button>
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
                                    {company.who_we_are.image && <img src={company.who_we_are.image} alt={company.who_we_are.title} />}
                                    <h3>{company.who_we_are.title}</h3>
                                    <p>{company.who_we_are.description}</p>
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
                                    {company.what_we_do.image && <img src={company.what_we_do.image} alt={company.what_we_do.title} />}
                                    <h3>{company.what_we_do.title}</h3>
                                    <p>{company.what_we_do.description}</p>
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
                                    {company.our_values.image && <img src={company.our_values.image} alt={company.our_values.title} />}
                                    <h3>{company.our_values.title}</h3>
                                    <p>{company.our_values.description}</p>
                                </div>
                            ) : (
                                <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('our-values')}>{t('company_detail.sections.add_placeholder', { section: t('company_detail.sections.our_values') })}</div>
                            )}
                        </div>
                    )}



                </div>
            )}

            {activeTab === 'services' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>{t('company_detail.services.title')}</h2>
                        {isOwner && (
                            <Button size="sm" variant="ghost" onClick={() => handleAddSection('services')}>
                                {t('company_detail.sections.add')}
                            </Button>
                        )}
                    </div>
                    <div className={styles.servicesGrid}>
                        {company.services?.map(service => (
                            <div key={service.id} className={styles.serviceCard} onClick={() => setSelectedService(service)} style={{ cursor: 'pointer' }}>
                                {isOwner && (
                                    <div className={styles.serviceEdit} onClick={(e) => e.stopPropagation()}>
                                        <Button size="sm" variant="ghost" onClick={() => handleEditSection(service, 'services')}><Edit size={14} /></Button>
                                    </div>
                                )}
                                {service.image ? (
                                    <img src={service.image} alt={service.title} />
                                ) : (
                                    <div className={styles.servicePlaceholder}>
                                        {service.title?.charAt(0)}
                                    </div>
                                )}
                                <h3>{service.title}</h3>
                                <p>
                                    {service.description.length > 100
                                        ? <>{service.description.substring(0, 100)}... <span style={{ color: '#1890ff', fontSize: '13px', fontWeight: '500' }}>{t('company_detail.services.read_more')}</span></>
                                        : service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    {company.services?.length === 0 && !isOwner && <p style={{ color: '#999' }}>{t('company_detail.services.no_services')}</p>}
                    {company.services?.length === 0 && isOwner && <p style={{ color: '#999' }}>{t('company_detail.services.add_hint')}</p>}
                </div>
            )}
            {activeTab === 'vacancies' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>{t('company_detail.vacancies.title')}</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {vacancies.map(v => (
                            <VacancyCard key={v.id} vacancy={v} />
                        ))}
                        {vacancies.length === 0 && <p style={{ color: '#999' }}>{t('company_detail.vacancies.empty')}</p>}
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className={styles.section}>
                    <p style={{ color: '#999', textAlign: 'center' }}>{t('company_detail.posts.coming_soon')}</p>
                </div>
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

            <ServiceDetailModal
                isOpen={!!selectedService}
                service={selectedService}
                onClose={() => setSelectedService(null)}
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
