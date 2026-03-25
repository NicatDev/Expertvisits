"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, MapPin, ArrowUpRight, ShieldCheck, Cpu, Users, GraduationCap, Briefcase, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/home.module.scss';
import t2Styles from '../styles/template2.module.scss';

export default function Home({ user }) {
    if (!user) return null;
    
    const profile = user.user || {};
    const experiences = user.experiences || [];
    const educations = user.educations || [];
    const skills = user.skills || [];
    const languages = user.languages || [];
    const certificates = user.certificates || [];
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
    
    const hardSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'hard' || String(s.skill_type).toLowerCase().includes('hard'));
    const softSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'soft' || String(s.skill_type).toLowerCase().includes('soft'));
    const otherSkills = skills.filter(s => !String(s.skill_type).toLowerCase().includes('hard') && !String(s.skill_type).toLowerCase().includes('soft'));
    const displayHardSkills = [...hardSkills, ...otherSkills];
    
    if (!isMounted) return null;

    return (
        <>
            <div className={styles.dynamicBg}>
                <div className={styles.orb1}></div>
                <div className={styles.orb2}></div>
                <div className={styles.orb3}></div>
            </div>

            <div className={styles.pageContainer}>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.heroContent}>
                        <div className={styles.greeting}>{t('portfolio.hello')}</div>
                        <h1 className={styles.name}>{fullName}</h1>
                        
                        {profile.profession_sub_category && (
                            <h2 className={styles.profession}>
                                <span>{profile.profession_sub_category.profession}</span>
                            </h2>
                        )}
                        
                        <div className={styles.heroActions}>
                            <a href="#about" className={styles.primaryBtn}>
                                {t('portfolio.viewWork')} <ArrowUpRight size={20} />
                            </a>
                            {profile.email && (
                                <a href={`mailto:${profile.email}`} className={styles.secondaryBtn}>
                                    <Mail size={20} /> {t('portfolio.contactMe')}
                                </a>
                            )}
                        </div>
                    </div>

                    <div className={styles.avatarBox}>
                        {profile.avatar ? (
                            <Image src={profile.avatar} alt={fullName} width={600} height={800} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {fullName?.charAt(0)}
                            </div>
                        )}
                    </div>
                </section>

                {/* About Section */}
                {profile.summary && (
                    <section id="about" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.aboutMe')}</h2>
                        </div>
                        <div className={styles.aboutContent}>
                            <p>{profile.summary}</p>
                        </div>
                    </section>
                )}

                {/* Experience Section */}
                {experiences.length > 0 && (
                    <section id="experience" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.experience')}</h2>
                        </div>
                        <div className={styles.timelineGrid}>
                            {experiences.map((exp, idx) => (
                                <div key={exp.id || idx} className={styles.timelineItem}>
                                    <div className={styles.dateBadge}>
                                        <Briefcase size={16} /> 
                                        <span>{new Date(exp.start_date).getFullYear()} - {!exp.end_date ? t('portfolio.present') : new Date(exp.end_date).getFullYear()}</span>
                                    </div>
                                    <h4>{exp.position}</h4>
                                    <h5>{exp.company_name}</h5>
                                    {exp.description && <p>{exp.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education Section */}
                {educations.length > 0 && (
                    <section id="education" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.education')}</h2>
                        </div>
                        <div className={styles.timelineGrid}>
                            {educations.map((edu, idx) => (
                                <div key={edu.id || idx} className={styles.timelineItem}>
                                    <div className={styles.dateBadge}>
                                        <GraduationCap size={16} /> 
                                        <span>{new Date(edu.start_date).getFullYear()} - {!edu.end_date ? t('portfolio.present') : new Date(edu.end_date).getFullYear()}</span>
                                    </div>
                                    <h4>{edu.degree_type_display ? edu.degree_type_display.toUpperCase() : 'Degree'} {t('portfolio.degreeIn')} {edu.field_of_study}</h4>
                                    <h5>{edu.institution}</h5>
                                    {edu.description && <p>{edu.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Hard Skills Section */}
                {displayHardSkills.length > 0 && (
                    <section id="hard-skills" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.hardSkills')}</h2>
                        </div>
                        <div className={styles.tagsCloud}>
                            {displayHardSkills.map((skill, idx) => (
                                <div key={skill.id || idx} className={styles.tag}>
                                    <Cpu size={20} />
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Soft Skills Section */}
                {softSkills.length > 0 && (
                    <section id="soft-skills" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.softSkills')}</h2>
                        </div>
                        <div className={styles.tagsCloud}>
                            {softSkills.map((skill, idx) => (
                                <div key={skill.id || idx} className={styles.tag}>
                                    <Users size={20} />
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Certificates Section */}
                {certificates.length > 0 && (
                    <section id="certificates" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.certificates')}</h2>
                        </div>
                        <div className={styles.timelineGrid}>
                            {certificates.map((cert, idx) => (
                                <div key={cert.id || idx} className={styles.timelineItem}>
                                    <h4>{cert.name}</h4>
                                    <h5 style={{color: '#4b5563', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: cert.issue_date ? '10px' : '0'}}>
                                        <ShieldCheck size={18} /> {cert.issuing_organization || cert.organization}
                                    </h5>
                                    {cert.issue_date && (
                                        <span style={{fontSize: '0.9rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                                            {t('portfolio.issued')} {new Date(cert.issue_date).getFullYear()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Languages Section */}
                {languages.length > 0 && (
                    <section id="languages" className={styles.section}>
                        <div className={styles.stickyHeader}>
                            <h2 className={styles.sectionTitle}>{t('portfolio.languages')}</h2>
                        </div>
                        <div className={styles.tagsCloud}>
                            {languages.map((lng, idx) => (
                                <div key={lng.id || idx} className={styles.tag}>
                                    <Globe size={20} />
                                    {lng.language || lng.name} 
                                    <span className={styles.levelBadge}>{lng.proficiency?.replace('_', ' ') || lng.level_display}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* MEGA FOOTER CTA */}
                <section className={styles.megaFooter}>
                    <h2 className={styles.megaText}>{t('portfolio.readyToCollaborate')} <br/><span>{t('portfolio.readyToCollaborateSpan')}</span></h2>
                    
                    {profile.email && (
                        <a href={`mailto:${profile.email}`} className={styles.emailLink}>
                            {profile.email} ↗
                        </a>
                    )}
                    
                    <div className={styles.copyright}>
                        <p>© {new Date().getFullYear()} {fullName}. {t('portfolio.allRightsReserved')}</p>
                        {profile.city && (
                            <div className={styles.location}><MapPin size={18} /> {profile.city}</div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
