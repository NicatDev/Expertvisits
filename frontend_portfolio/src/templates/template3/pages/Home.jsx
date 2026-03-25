"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, MapPin, Phone, ArrowUpRight, ShieldCheck, Cpu, Users, GraduationCap, Briefcase, Globe, Award, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import Services from '../sections/Services';
import styles from '../styles/home.module.scss';

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
            <div className={styles.bgPattern}></div>

            <div className={styles.wrapper}>
                {/* ===== HERO ===== */}
                <section className={styles.hero}>
                    <div className={styles.heroBadge}>
                        <Briefcase size={14} />
                        {profile.profession_sub_category?.profession || 'Professional'}
                    </div>
                    <h1 className={styles.heroName}>{fullName}</h1>
                    
                    <div className={styles.heroBottom}>
                        <div className={styles.heroAvatar}>
                            {profile.avatar ? (
                                <Image src={profile.avatar} alt={fullName} width={500} height={500} className={styles.avatarImg} />
                            ) : (
                                <div className={styles.avatarFallback}>{fullName?.charAt(0)}</div>
                            )}
                        </div>
                        <div className={styles.heroInfo}>
                            <div className={styles.heroActions}>
                                <a href="#about" className={styles.btnPrimary}>
                                    {t('portfolio.viewWork')} <ArrowUpRight size={18} />
                                </a>
                                {profile.email && (
                                    <a href={`mailto:${profile.email}`} className={styles.btnOutline}>
                                        <Mail size={18} /> {t('portfolio.contactMe')}
                                    </a>
                                )}
                            </div>
                            {(profile.city || profile.phone_number || profile.email) && (
                                <div className={styles.contactRow}>
                                    {profile.city && (
                                        <div className={styles.contactItem}>
                                            <MapPin size={18} />
                                            <span>{profile.city}</span>
                                        </div>
                                    )}
                                    {profile.phone_number && (
                                        <a href={`https://wa.me/${profile.phone_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                                            <Phone size={18} />
                                            <span>{profile.phone_number}</span>
                                        </a>
                                    )}
                                    {profile.email && (
                                        <a href={`mailto:${profile.email}`} className={styles.contactItem}>
                                            <Mail size={18} />
                                            <span>{profile.email.substring(0, 2)}***@{profile.email.split('@')[1]}</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ===== ABOUT ===== */}
                {profile.summary && (
                    <section id="about" className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.aboutMe')}</div>
                        <div className={styles.aboutCard}>
                            <div className={styles.quoteMark}>"</div>
                            <p>{profile.summary}</p>
                        </div>
                    </section>
                )}

                {/* ===== SERVICES ===== */}
                {user.services && user.services.length > 0 && (
                    <Services data={user.services} />
                )}

                {/* ===== EXPERIENCE TIMELINE ===== */}
                {experiences.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.experience')}</div>
                        <div className={styles.timeline}>
                            {experiences.map((exp, idx) => (
                                <div key={exp.id || idx} className={styles.timelineRow}>
                                    <div className={styles.timelineMeta}>
                                        <span className={styles.timelineYear}>
                                            {new Date(exp.start_date).getFullYear()} — {!exp.end_date ? t('portfolio.present') : new Date(exp.end_date).getFullYear()}
                                        </span>
                                    </div>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                        <h4>{exp.position}</h4>
                                        <span className={styles.timelineCompany}>{exp.company_name}</span>
                                        {exp.description && <p>{exp.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== EDUCATION TIMELINE ===== */}
                {educations.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.education')}</div>
                        <div className={styles.timeline}>
                            {educations.map((edu, idx) => (
                                <div key={edu.id || idx} className={styles.timelineRow}>
                                    <div className={styles.timelineMeta}>
                                        <span className={styles.timelineYear}>
                                            {new Date(edu.start_date).getFullYear()} — {!edu.end_date ? t('portfolio.present') : new Date(edu.end_date).getFullYear()}
                                        </span>
                                    </div>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                        <h4>{edu.degree_type_display ? edu.degree_type_display.toUpperCase() : 'Degree'} {t('portfolio.degreeIn')} {edu.field_of_study}</h4>
                                        <span className={styles.timelineCompany}>{edu.institution}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== HARD SKILLS — Horizontal Bars ===== */}
                {displayHardSkills.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.hardSkills')}</div>
                        <div className={styles.skillBars}>
                            {displayHardSkills.map((skill, idx) => (
                                <div key={skill.id || idx} className={styles.skillBar}>
                                    <div className={styles.skillBarHeader}>
                                        <Cpu size={16} />
                                        <span>{skill.name}</span>
                                    </div>
                                    <div className={styles.skillBarTrack}>
                                        <div className={styles.skillBarFill} style={{ width: `100%`, animationDelay: `${idx * 0.1}s` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== SOFT SKILLS — Chip Row ===== */}
                {softSkills.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.softSkills')}</div>
                        <div className={styles.chipRow}>
                            {softSkills.map((skill, idx) => (
                                <div key={skill.id || idx} className={styles.chip}>
                                    <Users size={16} />
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== CERTIFICATES — Horizontal Cards ===== */}
                {certificates.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.certificates')}</div>
                        <div className={styles.certScroll}>
                            {certificates.map((cert, idx) => (
                                <div key={cert.id || idx} className={styles.certCard}>
                                    <div className={styles.certIcon}><Award size={32} /></div>
                                    <div className={styles.certInfo}>
                                        <h4>{cert.name}</h4>
                                        <span>{cert.issuing_organization || cert.organization}</span>
                                        {cert.issue_date && (
                                            <small>{t('portfolio.issued')} {new Date(cert.issue_date).getFullYear()}</small>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== LANGUAGES — Level Dots ===== */}
                {languages.length > 0 && (
                    <section className={styles.block}>
                        <div className={styles.blockLabel}>{t('portfolio.languages')}</div>
                        <div className={styles.langGrid}>
                            {languages.map((lng, idx) => (
                                <div key={lng.id || idx} className={styles.langItem}>
                                    <Globe size={20} />
                                    <div className={styles.langInfo}>
                                        <span className={styles.langName}>{lng.language || lng.name}</span>
                                        <span className={styles.langLevel}>{lng.proficiency?.replace('_', ' ') || lng.level_display}</span>
                                    </div>
                                    <ChevronRight size={16} className={styles.langArrow} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== FOOTER CTA ===== */}
                <section className={styles.ctaBanner}>
                    <div className={styles.ctaInner}>
                        <h2>{t('portfolio.readyToCollaborate')} <br/><span>{t('portfolio.readyToCollaborateSpan')}</span></h2>
                        {profile.email && (
                            <a href={`mailto:${profile.email}`} className={styles.ctaBtn}>
                                {profile.email} <ArrowUpRight size={20} />
                            </a>
                        )}
                    </div>
                    <div className={styles.ctaFooter}>
                        <p>© {new Date().getFullYear()} {fullName}. {t('portfolio.allRightsReserved')}</p>
                        {profile.city && (
                            <div className={styles.ctaLocation}><MapPin size={16} /> {profile.city}</div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
