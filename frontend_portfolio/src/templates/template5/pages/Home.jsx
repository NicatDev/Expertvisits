"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, MapPin, Phone, Award, ShieldCheck, Stethoscope, ChevronRight, Binary, GraduationCap, Briefcase, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import Services from '../sections/Services';
import styles from '../styles/home.module.scss';
import Link from 'next/link';

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
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
    const username = profile.username;
    const specialist = profile.profession_sub_category?.[`profession_${currentLang}`] || profile.profession_sub_category?.profession || 'Specialist Physician';

    return (
        <div className={styles.homeWrapper}>
            {/* HER0 - Modern Medical Look */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        <div className={styles.heroContent}>
                            <div className={styles.heroBadge}>
                                <ShieldCheck size={16} />
                                <span>{t('portfolio.trustedProfessional')}</span>
                            </div>
                            <h1 className={styles.heroName}>
                                <span className={styles.titlePrefix}></span> {fullName}
                            </h1>
                            <p className={styles.speciality}>{specialist}</p>
                            <p className={styles.heroSummary}>{profile.summary?.substring(0, 200)}...</p>
                            
                            <div className={styles.heroActions}>
                                <Link href={`/${username}/contact`} className={styles.btnPrimary}>
                                    {t('portfolio.bookConsultation')}
                                </Link>
                                <a href="#about" className={styles.btnOutline}>
                                    {t('portfolio.readMore')}
                                </a>
                            </div>
                            
                            <div className={styles.heroStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>{experiences.length}+</span>
                                    <span className={styles.statLabel}>{t('portfolio.yearsExperience')}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>{certificates.length}+</span>
                                    <span className={styles.statLabel}>{t('portfolio.certificates') || 'Sertifikat'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.heroImageWrapper}>
                            <div className={styles.imageCard}>
                                {profile.avatar ? (
                                    <Image src={profile.avatar} alt={fullName} width={600} height={700} className={styles.mainAvatar} priority />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <Briefcase size={80} />
                                    </div>
                                )}
                            
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK INFO BAR */}
            <section className={styles.infoBar}>
                <div className={styles.container}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><Phone size={24} /></div>
                            <div>
                                <h4>{t('portfolio.phone')}</h4>
                                <p>{profile.phone_number || 'N/A'}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                           <div className={styles.infoIcon}><MapPin size={24} /></div>
                            <div>
                                <h4>{t('portfolio.location')}</h4>
                                <p>{profile.city || 'Baku, Azerbaijan'}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><Mail size={24} /></div>
                            <div>
                                <h4>{t('portfolio.emailUs')}</h4>
                                <p>{profile.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ABOUT SECTION & SKILLS */}
            <section id="about" className={styles.aboutSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.subTitle}></span>
                        <h2 className={styles.sectionTitle}>{t('portfolio.aboutMe')}</h2>
                    </div>
                    
                    <div className={styles.aboutContent}>
                        <div className={styles.aboutText}>
                            <p>{profile.summary}</p>
                     
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES */}
            {user.services && user.services.length > 0 && (
                <section id="services">
                    <Services data={user.services} />
                </section>
            )}

            {/* EXPERIENCE & EDUCATION */}
            <section className={styles.experienceSection}>
                <div className={styles.container}>
                    <div className={styles.dualGrid}>
                        {/* Experience */}
                        <div className={styles.timelineWrapper}>
                           <div className={styles.sectionHeaderSmall}>
                                <Briefcase size={24} />
                                <h3>{t('portfolio.experience')}</h3>
                            </div>
                            <div className={styles.timeline}>
                                {experiences.map((exp, idx) => (
                                    <div key={idx} className={styles.timelineItem}>
                                        <div className={styles.timeTag}>
                                            {new Date(exp.start_date).getFullYear()} - {!exp.end_date ? t('portfolio.present') : new Date(exp.end_date).getFullYear()}
                                        </div>
                                        <h4>{exp.position}</h4>
                                        <p className={styles.location}>{exp.company_name}</p>
                                        <p className={styles.description}>{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Education */}
                        <div className={styles.timelineWrapper}>
                           <div className={styles.sectionHeaderSmall}>
                                <GraduationCap size={24} />
                                <h3>{t('portfolio.education')}</h3>
                            </div>
                            <div className={styles.timeline}>
                                {educations.map((edu, idx) => (
                                    <div key={idx} className={styles.timelineItem}>
                                        <div className={styles.timeTag}>
                                            {new Date(edu.start_date).getFullYear()} - {!edu.end_date ? t('portfolio.present') : new Date(edu.end_date).getFullYear()}
                                        </div>
                                        <h4>{edu.degree_type_display} - {edu.field_of_study}</h4>
                                        <p className={styles.location}>{edu.institution}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* CERTIFICATES */}
             {certificates.length > 0 && (
                 <section className={styles.certSection}>
                     <div className={styles.container}>
                        <div className={styles.sectionHeaderCenter}>
                             <h2>{t('portfolio.certificates')}</h2>
                        </div>
                        <div className={styles.certGrid}>
                            {certificates.map((cert, idx) => (
                                <div key={idx} className={styles.certCard}>
                                    <Award size={32} />
                                    <h4>{cert.name}</h4>
                                    <p>{cert.issuing_organization || cert.organization}</p>
                                </div>
                            ))}
                        </div>
                     </div>
                 </section>
             )}

            {/* SKILLS SECTION */}
            <section className={styles.skillsSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeaderCenter}>
                         <span className={styles.subTitle}>{t('portfolio.skills')}</span>
                         <h2>{t('portfolio.hardSkills')} & {t('portfolio.softSkills')}</h2>
                    </div>
                    
                    <div className={styles.skillsGrid}>
                        <div className={styles.skillCategory}>
                            <h4>{t('portfolio.hardSkills')}</h4>
                            <div className={styles.skillList}>
                                {skills.filter(s => s.skill_type === 'hard' || !s.skill_type).map((skill, idx) => (
                                    <div key={idx} className={styles.skillItem}>
                                        <span>{skill.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.skillCategory}>
                            <h4>{t('portfolio.softSkills')}</h4>
                            <div className={styles.skillList}>
                                {skills.filter(s => s.skill_type === 'soft').map((skill, idx) => (
                                    <div key={idx} className={styles.skillItem}>
                                        <span>{skill.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {languages.length > 0 && (
                <section className={styles.langSection}>
                    <div className={styles.container}>
                        <div className={styles.langWrapper}>
                            <div className={styles.langHeader}>
                                <Globe size={24} />
                                <h3>{t('portfolio.languages')}</h3>
                            </div>
                            <div className={styles.langList}>
                                {languages.map((lng, idx) => (
                                    <div key={idx} className={styles.langChip}>
                                        <strong>{lng.language || lng.name}</strong>: {lng.proficiency?.replace('_', ' ') || lng.level_display}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CALL TO ACTION */}
            <section className={styles.cta}>
                <div className={styles.container}>
                    <div className={styles.ctaCard}>
                        <h2>{t('portfolio.contactMeTitle')}</h2>
                        <p>{t('portfolio.contactMeDesc')}</p>
                        <Link href={`/${profile.username}/contact`} className={styles.btnPrimaryWhite}>
                            {t('portfolio.contactMeBtn')} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
