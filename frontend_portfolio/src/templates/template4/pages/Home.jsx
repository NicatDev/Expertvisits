"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, Briefcase, GraduationCap, Cpu, Users, Settings, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/home.module.scss';
import Projects from '../sections/Projects';
import ArticlesHomePreview from '@/components/portfolio/ArticlesHomePreview';
import { mergeSectionVisibility } from '@/lib/sectionVisibility';
import { truncateDescription } from '@/lib/portfolioText';
import PortfolioContentModal from '@/components/portfolio/PortfolioContentModal';

export default function Home({ user }) {
    if (!user) return null;
    
    const profile = user.user || {};
    const experiences = user.experiences || [];
    const educations = user.educations || [];
    const skills = user.skills || [];
    const services = user.services || [];
    const certificates = user.certificates || [];
    const languages = user.languages || [];
    
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'az';
    const [isMounted, setIsMounted] = useState(false);
    const [serviceModal, setServiceModal] = useState(null);
    
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Filter Skills correctly
    const hardSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'hard' || String(s.skill_type).toLowerCase().includes('hard'));
    const softSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'soft' || String(s.skill_type).toLowerCase().includes('soft'));
    const otherSkills = skills.filter(s => !String(s.skill_type).toLowerCase().includes('hard') && !String(s.skill_type).toLowerCase().includes('soft'));
    const displayHardSkills = [...hardSkills, ...otherSkills];

    if (!isMounted) return null;

    const v = mergeSectionVisibility(user?.section_visibility);
    let sectionIdx = 1;

    return (
        <div className={styles.pageContainer}>
            
            {/* HERO SECTION */}
            <section className={`${styles.section} ${styles.heroSection}`}>
                <div className={styles.heroContent}>
                    <div className={styles.glitchBlock}>
                        <span className={styles.cybertag}>// SYS.INIT</span>
                        <h1 className={styles.glitchText} data-text={fullName}>{fullName}</h1>
                        {profile.profession_sub_category && (
                            <h2 className={styles.profession}>
                                &gt; {profile.profession_sub_category?.[`profession_${currentLang}`] || profile.profession_sub_category?.profession}_
                            </h2>
                        )}
                        <p className={styles.heroGreeting}> {t('portfolio.systemStarting')}</p>
                    </div>

                    <div className={styles.heroActions}>
                        <a href="#about" className={styles.cyberBtn}>
                            {t('portfolio.viewWork')} <ArrowRight size={18} />
                            <span className={styles.btnGlitch}></span>
                        </a>
                        {profile.email && (
                            <a href={`mailto:${profile.email}`} className={styles.cyberBtnAlt}>
                                <Mail size={18} /> {t('portfolio.contactMe')}
                            </a>
                        )}
                    </div>
                </div>

                <div className={styles.heroImageWrapper}>
                    <div className={styles.cyberFrame}>
                        {profile.avatar ? (
                            <Image src={profile.avatar} alt={fullName} width={250} height={250} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {fullName?.charAt(0)}
                            </div>
                        )}
                        <div className={styles.cornerTopLeft}></div>
                        <div className={styles.cornerBottomRight}></div>
                    </div>
                </div>
            </section>

            {/* ABOUT SECTION */}
            {profile.summary && (
                <section id="about" className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.aboutMe')}
                    </h2>
                    <div className={styles.cyberCard}>
                        <p className={styles.aboutText}>{profile.summary}</p>
                    </div>
                </section>
            )}

            {/* EXPERIENCE & EDUCATION */}
            <div className={styles.splitSection}>
                {experiences.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.cyberTitle}>
                            <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.experience')}
                        </h2>
                        <div className={styles.cyberTimeline}>
                            {experiences.map((exp, index) => (
                                <div key={exp.id || index} className={styles.cyberTimeItem}>
                                    <div className={styles.timeHeader}>
                                        <h3 className={styles.timeTitle}>{exp.position || exp.title}</h3>
                                        <h4 className={styles.timeSubtitle}>@ {exp.company_name}</h4>
                                    </div>
                                    <span className={styles.timeDate}>
                                        [{exp.start_date ? new Date(exp.start_date).getFullYear() : ''} - 
                                        {exp.is_present ? ' ' + t('common.present') : (exp.end_date ? ' ' + new Date(exp.end_date).getFullYear() : '')}]
                                    </span>
                                    {exp.description && <p className={styles.timeDesc}>{exp.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {educations.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.cyberTitle}>
                            <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.education')}
                        </h2>
                        <div className={styles.cyberTimeline}>
                            {educations.map((edu, index) => (
                                <div key={edu.id || index} className={styles.cyberTimeItem}>
                                    <div className={styles.timeHeader}>
                                        <h3 className={styles.timeTitle}>{edu.degree_type_display ? edu.degree_type_display.toUpperCase() : 'Degree'} {t('portfolio.degreeIn')} {edu.field_of_study || edu.degree}</h3>
                                        <h4 className={styles.timeSubtitle}>@ {edu.institution_name || edu.institution}</h4>
                                    </div>
                                    <span className={styles.timeDate}>
                                        [{edu.start_date ? new Date(edu.start_date).getFullYear() : ''} - 
                                        {edu.is_present ? ' ' + t('common.present') : (edu.end_date ? ' ' + new Date(edu.end_date).getFullYear() : '')}]
                                    </span>
                                    {edu.description && <p className={styles.timeDesc}>{edu.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* HARD SKILLS SECTION */}
            {displayHardSkills.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.hardSkills')}
                    </h2>
                    <div className={styles.cyberCard}>
                        <div className={styles.skillsWrapper}>
                            {displayHardSkills.map((skill, index) => (
                                <div key={index} className={styles.cyberBadge}>
                                    <Cpu size={14} /> 
                                    {skill.name || skill.skill_name || 'Skill'} 
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* SOFT SKILLS SECTION */}
            {softSkills.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.softSkills')}
                    </h2>
                    <div className={styles.cyberCard}>
                        <div className={styles.skillsWrapper}>
                            {softSkills.map((skill, index) => (
                                <div key={index} className={styles.cyberBadge}>
                                    <Users size={14} /> 
                                    {skill.name || skill.skill_name || 'Skill'} 
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CERTIFICATES SECTION */}
            {certificates.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.certificates')}
                    </h2>
                    <div className={styles.servicesGrid}>
                        {certificates.map((cert, index) => (
                            <div key={cert.id || index} className={styles.cyberCard}>
                                <h3 className={styles.serviceTitle}>_ {cert.name}</h3>
                                <p className={styles.serviceDesc}>
                                    <ShieldCheck size={14} style={{display: 'inline', marginRight: '4px'}}/> 
                                    {cert.issuing_organization || cert.organization}
                                </p>
                                {cert.issue_date && (
                                    <p className={styles.timeDate} style={{marginTop: '10px'}}>[{t('portfolio.issued')} {new Date(cert.issue_date).getFullYear()}]</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

             {/* LANGUAGES SECTION */}
             {languages.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.languages')}
                    </h2>
                    <div className={styles.cyberCard}>
                        <div className={styles.skillsWrapper}>
                            {languages.map((lng, index) => (
                                <div key={index} className={styles.cyberBadge}>
                                    <Globe size={14} /> 
                                    {lng.language || lng.name} 
                                    <span className={styles.levelBadge}>/{lng.proficiency?.replace('_', ' ') || lng.level_display}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* SERVICES SECTION */}
            {v.services_on_home && services.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.cyberTitle}>
                        <span className={styles.prefix}>0{sectionIdx++}.</span> {t('portfolio.services')}
                    </h2>
                    <div className={styles.servicesGrid}>
                        {services.map((service, index) => {
                            const { excerpt, needsMore } = truncateDescription(service.description);
                            return (
                                <div
                                    key={service.id || index}
                                    className={styles.cyberCard}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setServiceModal(service)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setServiceModal(service);
                                        }
                                    }}
                                >
                                    <h3 className={styles.serviceTitle}>_ {service.title}</h3>
                                    {service.description ? (
                                        <p className={styles.serviceDesc}>
                                            {needsMore ? excerpt : service.description}
                                        </p>
                                    ) : null}
                                    {needsMore ? (
                                        <button
                                            type="button"
                                            style={{
                                                marginTop: '10px',
                                                padding: 0,
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                font: 'inherit',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: 'var(--t4-primary, #22d3ee)',
                                                textAlign: 'left',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setServiceModal(service);
                                            }}
                                        >
                                            {t('portfolio.readMore')}
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                    <PortfolioContentModal
                        isOpen={Boolean(serviceModal)}
                        onClose={() => setServiceModal(null)}
                        title={serviceModal?.title}
                        body={serviceModal?.description}
                        steps={serviceModal?.steps}
                        dark
                    />
                </section>
            )}

            {v.projects_on_home ? <Projects user={user} sectionIndex={sectionIdx++} /> : null}
            <ArticlesHomePreview user={user} />

        </div>
    );
}
