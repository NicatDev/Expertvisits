"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, MapPin, Briefcase, GraduationCap, ArrowRight, Book, ShieldCheck, Cpu, Users } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import Services from '../sections/Services';
import styles from '../styles/home.module.scss';
import t1Styles from '../styles/template1.module.scss';

export default function Home({ user }) {
    if (!user) return null;
    
    const profile = user.user || {};
    const experiences = user.experiences || [];
    const educations = user.educations || [];
    const skills = user.skills || [];
    const languages = user.languages || [];
    const certificates = user.certificates || [];
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'az';
    const [isMounted, setIsMounted] = useState(false);
    
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;

    // Optional hover effect tracking for glassy cards
    useEffect(() => {
        setIsMounted(true);
        const handleMouseMove = e => {
            const cards = document.querySelectorAll(`.${styles.glassCard}`);
            for (const card of cards) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Split skills
    const hardSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'hard' || String(s.skill_type).toLowerCase().includes('hard'));
    const softSkills = skills.filter(s => String(s.skill_type).toLowerCase() === 'soft' || String(s.skill_type).toLowerCase().includes('soft'));
    const otherSkills = skills.filter(s => !String(s.skill_type).toLowerCase().includes('hard') && !String(s.skill_type).toLowerCase().includes('soft'));

    // Combine remaining skills into hard skills visually if no clear hard/soft boundaries exist
    const displayHardSkills = [...hardSkills, ...otherSkills];
    
    let sectionIndex = 1;

    if (!isMounted) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.glowBlob}></div>

            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.avatarWrapper}>
                    {profile.avatar ? (
                        <Image src={profile.avatar} alt={fullName} width={130} height={130} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {fullName?.charAt(0)}
                        </div>
                    )}
                </div>
                
                <div className={styles.heroContent}>
                    <span className={styles.greeting}>{t('portfolio.hello')}</span>
                    <h1 className={styles.name}>{fullName}</h1>
                    
                    {profile.profession_sub_category && (
                        <p className={styles.profession}>
                        <span>{profile.profession_sub_category?.[`profession_${currentLang}`] || profile.profession_sub_category?.profession}</span>
                        </p>
                    )}
                    
                    <div className={styles.heroActions}>
                        <a href="#about" className={styles.primaryBtn}>
                            {t('portfolio.viewWork')} <ArrowRight size={18} />
                        </a>
                        {profile.email && (
                            <a href={`mailto:${profile.email}`} className={styles.secondaryBtn}>
                                <Mail size={18} /> {t('portfolio.contactMe')}
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* About Section */}
            {profile.summary && (
                <section id="about" className={styles.section}>
                    <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.aboutMe')}
                        </h2>
                    </div>
                    <div className={styles.aboutContent}>
                        <p>{profile.summary}</p>
                    </div>
                </section>
            )}

            {/* Experience Section */}
            {experiences.length > 0 && (
                <section id="experience" className={styles.section}>
                     <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.experience')}
                        </h2>
                    </div>
                    <div className={styles.timelineWrapper}>
                        <div>
                            {experiences.map((exp, idx) => (
                                <div key={exp.id || idx} className={styles.timelineItem}>
                                    <div className={styles.dateBadge}>
                                        {new Date(exp.start_date).getFullYear()} - 
                                        {!exp.end_date ? ` ${t('portfolio.present')}` : ` ${new Date(exp.end_date).getFullYear()}`}
                                    </div>
                                    <h3>{exp.position}</h3>
                                    <h4>{exp.company_name}</h4>
                                    {exp.description && <p>{exp.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Services Section */}
            {user.services && user.services.length > 0 && (
                <Services data={user.services} sectionIndex={sectionIndex++} />
            )}

            {/* Education Section */}
            {educations.length > 0 && (
                <section id="education" className={styles.section}>
                     <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.education')}
                        </h2>
                    </div>
                    <div className={styles.timelineWrapper}>
                        <div>
                            {educations.map((edu, idx) => (
                                <div key={edu.id || idx} className={styles.timelineItem}>
                                    <div className={styles.dateBadge}>
                                        {new Date(edu.start_date).getFullYear()} - 
                                        {!edu.end_date ? ` ${t('portfolio.present')}` : ` ${new Date(edu.end_date).getFullYear()}`}
                                    </div>
                                    <h3>{edu.degree_type_display ? edu.degree_type_display.toUpperCase() : 'Degree'} {t('portfolio.degreeIn')} {edu.field_of_study}</h3>
                                    <h4>{edu.institution}</h4>
                                    {edu.description && <p>{edu.description}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Hard Skills Section */}
            {displayHardSkills.length > 0 && (
                <section id="hard-skills" className={styles.section}>
                    <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.hardSkills')}
                        </h2>
                    </div>
                    <div className={styles.skillsWrapper}>
                        {displayHardSkills.map((skill, idx) => (
                            <div key={skill.id || idx} className={styles.skillBadge}>
                                <Cpu size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: '-3px', opacity: 0.6}} />
                                {skill.name}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Soft Skills Section */}
            {softSkills.length > 0 && (
                <section id="soft-skills" className={styles.section}>
                    <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.softSkills')}
                        </h2>
                    </div>
                    <div className={styles.skillsWrapper}>
                        {softSkills.map((skill, idx) => (
                            <div key={skill.id || idx} className={styles.skillBadge}>
                                <Users size={16} style={{display: 'inline', marginRight: '6px', verticalAlign: '-3px', opacity: 0.6}} />
                                {skill.name}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Certificates Section */}
            {certificates.length > 0 && (
                <section id="certificates" className={styles.section}>
                    <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.certificates')}
                        </h2>
                    </div>
                    <div className={styles.cardsGrid}>
                        {certificates.map((cert, idx) => (
                            <div key={cert.id || idx} className={styles.glassCard}>
                                <h3>{cert.name}</h3>
                                <p><ShieldCheck size={14} style={{display: 'inline', marginRight: '4px'}}/> {cert.issuing_organization || cert.organization}</p>
                                {cert.issue_date && (
                                    <span className={styles.dateInfo}>{t('portfolio.issued')} {new Date(cert.issue_date).getFullYear()}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Languages Section */}
            {languages.length > 0 && (
                <section id="languages" className={styles.section}>
                    <div className={styles.titleWrapperLeft}>
                        <h2 className={styles.sectionTitle}>
                            <span>0{sectionIndex++} /</span> {t('portfolio.languages')}
                        </h2>
                    </div>
                    <div className={styles.cardsGrid}>
                        {languages.map((lng, idx) => (
                            <div key={lng.id || idx} className={styles.glassCard}>
                                <h3>{lng.language || lng.name} <span className={styles.levelBadge}>{lng.proficiency?.replace('_', ' ') || lng.level_display}</span></h3>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className={styles.contactSection}>
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
    );
}
