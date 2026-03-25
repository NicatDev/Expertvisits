"use client";

import React from 'react';
import Image from 'next/image';
import { Mail, MapPin, Briefcase, Calendar } from 'lucide-react';
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
    
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
    const hasBanner = !!user.banner;

    return (
        <div className={t1Styles.pageContainer}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div 
                    className={`${styles.banner} ${!hasBanner ? styles.gradientBanner : ''}`}
                    style={hasBanner ? { backgroundImage: `url(${user.banner})` } : {}}
                />
                
                <div className={styles.profileMeta}>
                    <div className={styles.avatarWrapper}>
                        {profile.avatar ? (
                            <Image src={profile.avatar} alt={fullName} width={140} height={140} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {fullName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.heroInfo}>
                        <h1 className={styles.name}>{fullName}</h1>
                        {profile.profession_sub_category && (
                            <h2 className={styles.profession}>{profile.profession_sub_category.name}</h2>
                        )}
                        <div className={styles.quickInfo}>
                            {profile.city && (
                                <span className={styles.infoBadge}><MapPin size={16} /> {profile.city}</span>
                            )}
                            {profile.email && (
                                <span className={styles.infoBadge}><Mail size={16} /> {profile.email}</span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.contentGrid}>
                {/* Left Column (Summary + Timeline) */}
                <div className={styles.mainColumn}>
                    {profile.summary && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>About Me</h3>
                            <p className={styles.summaryText}>{profile.summary}</p>
                        </section>
                    )}

                    {experiences.length > 0 && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>Experience</h3>
                            <div className={styles.timeline}>
                                {experiences.map((exp, idx) => (
                                    <div key={exp.id || idx} className={styles.timelineItem}>
                                        <div className={styles.timelineIcon}><Briefcase size={16} /></div>
                                        <div className={styles.timelineContent}>
                                            <h4>{exp.position}</h4>
                                            <h5>{exp.company_name}</h5>
                                            <span className={styles.date}>
                                                {new Date(exp.start_date).getFullYear()} - 
                                                {!exp.end_date ? ' Present' : ` ${new Date(exp.end_date).getFullYear()}`}
                                            </span>
                                            {exp.description && <p>{exp.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {educations.length > 0 && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>Education</h3>
                            <div className={styles.timeline}>
                                {educations.map((edu, idx) => (
                                    <div key={edu.id || idx} className={styles.timelineItem}>
                                        <div className={styles.timelineIcon}><Calendar size={16} /></div>
                                        <div className={styles.timelineContent}>
                                            <h4>{edu.degree_type_display ? edu.degree_type_display.toUpperCase() : 'Degree'} in {edu.field_of_study}</h4>
                                            <h5>{edu.institution}</h5>
                                            <span className={styles.date}>
                                                {new Date(edu.start_date).getFullYear()} - 
                                                {!edu.end_date ? ' Present' : ` ${new Date(edu.end_date).getFullYear()}`}
                                            </span>
                                            {edu.description && <p>{edu.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column (Skills, Languages, Certificates) */}
                <div className={styles.sideColumn}>
                    {skills.length > 0 && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>Skills</h3>
                            <div className={styles.pillsList}>
                                {skills.map((skill, idx) => (
                                    <span key={skill.id || idx} className={styles.pill}>{skill.name}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {languages.length > 0 && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>Languages</h3>
                            <ul className={styles.simpleList}>
                                {languages.map((lng, idx) => (
                                    <li key={lng.id || idx}>
                                        <span className={styles.listTag}>{lng.language}</span>
                                        <span className={styles.listLevel}>{lng.proficiency?.replace('_', ' ')}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {certificates.length > 0 && (
                        <section className={styles.card}>
                            <h3 className={styles.cardTitle}>Certificates</h3>
                            <ul className={styles.simpleList}>
                                {certificates.map((cert, idx) => (
                                    <li key={cert.id || idx}>
                                        <span className={styles.listTag}>{cert.name}</span>
                                        <span className={styles.listLevel}>{cert.organization}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
