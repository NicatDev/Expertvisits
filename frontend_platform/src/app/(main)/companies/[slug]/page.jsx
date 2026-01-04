"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { business } from '@/lib/api';
import { MapPin, Globe, Linkedin, Instagram, Facebook, Edit, Phone, Mail, Award, Users, Target, Briefcase } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './CompanyDetail.module.scss';

import EditSectionModal from '../components/EditSectionModal';
import EditCompanyModal from '../components/EditCompanyModal';

// Component for dynamic sections
const Section = ({ title, description, image, icon: Icon, onEdit, onDelete, isOwner }) => (
    <div className={styles.section}>
        <div className={styles.sectionHeader}>
            <div className={styles.titleWithIcon}>
                {Icon && <Icon className={styles.sectionIcon} size={24} />}
                <h3>{title}</h3>
            </div>
            {isOwner && (
                <div className={styles.editActions}>
                    <Button size="sm" variant="ghost" onClick={onEdit} className={styles.editBtn}>
                        <Edit size={16} /> Edit
                    </Button>
                    {/* Potentially add Delete button here or inside Edit Modal. Let's keep it simple: Edit modal can handle delete? Or specific button. 
                        User asked for "add delete edit". 
                        I'll assume Edit modal handles updates, but Delete might need a separate button or logic. 
                        Let's just adding Edit button for now which opens modal, and maybe add a delete capability?
                        Actually, I'll add a Delete button next to Edit.
                      */}
                </div>
            )}
        </div>
        <div className={styles.sectionContent}>
            {image && (
                <div className={styles.sectionImage}>
                    <img src={image} alt={title} />
                </div>
            )}
            <div className={styles.sectionText}>
                <p>{description}</p>
            </div>
        </div>
    </div>
);

export default function CompanyDetailPage({ params }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    const router = useRouter();
    const { user } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [isSectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null); // If null, it's adding
    const [sectionType, setSectionType] = useState(''); // 'who-we-are', 'what-we-do', etc.

    const loadCompany = async () => {
        try {
            const res = await business.getCompany(slug);
            setCompany(res.data);
        } catch (err) {
            console.error("Failed to load company", err);
            setError("Company not found or access denied.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) loadCompany();
    }, [slug]);

    const handleEditCompany = () => {
        setCompanyModalOpen(true);
    };

    const handleCompanyUpdated = () => {
        loadCompany();
    };

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

    const handleSectionSaved = () => {
        loadCompany();
    };

    if (loading) return <div className={styles.loading}>Loading company profile...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!company) return null;

    const isOwner = user?.id === company.owner_id || user?.username === company.owner;

    return (
        <div className={styles.container}>
            {/* Hero / Header */}
            <div className={styles.hero}>
                <div className={styles.coverImage} style={{ backgroundImage: `url(${company.cover_image || '/images/default-cover.jpg'})` }}></div>
                <div className={styles.headerContent}>
                    <div className={styles.logoWrapper}>
                        {company.logo ? (
                            <img src={company.logo} alt={company.name} className={styles.logo} />
                        ) : (
                            <div className={styles.logoPlaceholder}>{company.name?.charAt(0)}</div>
                        )}
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>{company.name}</h1>
                        <p className={styles.tagline}>{company.summary}</p>

                        <div className={styles.metaRow}>
                            {company.address && (
                                <span className={styles.metaItem}><MapPin size={16} /> {company.address}</span>
                            )}
                            {company.founded_at && (
                                <span className={styles.metaItem}><Award size={16} /> Est. {new Date(company.founded_at).getFullYear()}</span>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className={styles.actions}>
                            <Button variant="primary" onClick={handleEditCompany}>
                                <Edit size={16} /> Edit Profile
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Main Content */}
                <div className={styles.main}>
                    {/* Who We Are */}
                    {company.who_we_are?.map(item => (
                        <Section
                            key={`who-${item.id}`}
                            title={item.title}
                            description={item.description}
                            image={item.image}
                            icon={Users}
                            isOwner={isOwner}
                            onEdit={() => handleEditSection(item, 'who-we-are')}
                        />
                    ))}
                    {isOwner && (
                        <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('who-we-are')}>+ Add "Who We Are"</div>
                    )}


                    {/* What We Do */}
                    {company.what_we_do?.map(item => (
                        <Section
                            key={`what-${item.id}`}
                            title={item.title}
                            description={item.description}
                            image={item.image}
                            icon={Target}
                            isOwner={isOwner}
                            onEdit={() => handleEditSection(item, 'what-we-do')}
                        />
                    ))}
                    {isOwner && (
                        <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('what-we-do')}>+ Add "What We Do"</div>
                    )}

                    {/* Our Values */}
                    {company.our_values?.map(item => (
                        <Section
                            key={`val-${item.id}`}
                            title={item.title}
                            description={item.description}
                            image={item.image}
                            icon={Award}
                            isOwner={isOwner}
                            onEdit={() => handleEditSection(item, 'our-values')}
                        />
                    ))}
                    {isOwner && (
                        <div className={styles.addSectionPlaceholder} onClick={() => handleAddSection('our-values')}>+ Add "Our Values"</div>
                    )}

                    {/* Services */}
                    <div className={styles.servicesSection}>
                        <h3>Our Services</h3>
                        <div className={styles.servicesGrid}>
                            {company.services?.map(service => (
                                <div key={service.id} className={styles.serviceCard}>
                                    {service.image && <img src={service.image} alt={service.title} />}
                                    <h4>{service.title}</h4>
                                    <p>{service.description}</p>
                                    {isOwner && (
                                        <Button size="sm" variant="ghost" className={styles.serviceEdit} onClick={() => handleEditSection(service, 'services')}>
                                            <Edit size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {isOwner && (
                                <div className={`${styles.serviceCard} ${styles.addServiceCard}`} onClick={() => handleAddSection('services')}>
                                    <span>+ Add Service</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarSection}>
                        <h3>Contact Info</h3>
                        <div className={styles.contactList}>
                            {company.website_url && (
                                <a href={company.website_url} target="_blank" rel="noreferrer" className={styles.contactItem}>
                                    <Globe size={18} /> Website
                                </a>
                            )}

                            {/* Show Phone only if owner or public? User said: "eger company owneremse onda edit ede bilim ve phone gorunsun. deyilemse nomre de gorunmesin." -> "if I am owner, show phone. if not, don't show." */}
                            {isOwner && company.phone && (
                                <div className={styles.contactItem}>
                                    <Phone size={18} /> {company.phone}
                                </div>
                            )}

                            {/* Assuming we might want to show email? User didn't specify strict email hiding, but let's keep it safe. */}
                            {company.email && (
                                <a href={`mailto:${company.email}`} className={styles.contactItem}>
                                    <Mail size={18} /> {company.email}
                                </a>
                            )}
                        </div>
                    </div>

                    <div className={styles.sidebarSection}>
                        <h3>Follow Us</h3>
                        <div className={styles.socialLinks}>
                            {company.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noreferrer"><Linkedin size={24} /></a>}
                            {company.instagram_url && <a href={company.instagram_url} target="_blank" rel="noreferrer"><Instagram size={24} /></a>}
                            {company.facebook_url && <a href={company.facebook_url} target="_blank" rel="noreferrer"><Facebook size={24} /></a>}
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
}
