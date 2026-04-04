"use client";
import React from 'react';
import styles from '../app/Landing.module.scss';
import Link from 'next/link';

export default function LandingPage({ t }) {
    return (
        <div className={styles.wrapper}>
            <header className={styles.topNav}>
                <div className={styles.logo}>Expert Visits</div>
                <div className={styles.langSwitcher}>
                    <Link href="/az" className={styles.langLink}>AZ</Link>
                    <Link href="/en" className={styles.langLink}>EN</Link>
                    <Link href="/ru" className={styles.langLink}>RU</Link>
                </div>
            </header>
            <div className={styles.content}>
                {/* Hero Section */}
                <section className={styles.hero}>
                    <h1 className={styles.title}>
                        {t.heroTitle.split(' ').map((word, i) => (
                            <span key={i} className={i >= t.heroTitle.split(' ').length - 2 ? styles.titleHighlight : ''}>
                                {word}{' '}
                            </span>
                        ))}
                    </h1>
                    <p className={styles.subtitle}>{t.heroSubtitle}</p>
<Link href="https://expertvisits.com/register" className={styles.cta} style={{ fontSize: '1rem', padding: '14px 36px' }} target="_blank" rel="noopener noreferrer">{t.ctaBtn}</Link>


                    {/* Dashboard/Browser Mockup */}
                    <div className={styles.showcase}>
                        <div className={styles.browserHeader}>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                        </div>
                        <div className={styles.browserBody}>
                            <div className={styles.sidebarMock}>
                                <div className={styles.skeletonAvatar}></div>
                                <div className={styles.skeletonBlock}></div>
                                <div className={styles.skeletonBlock}></div>
                                <div className={styles.skeletonBlock}></div>
                                <div className={styles.skeletonBlock}></div>
                            </div>
                            <div className={styles.mainMock}>
                                <div className={styles.skeletonHeader}></div>
                                <div className={styles.gridMock}>
                                    <div className={styles.gridItem}></div>
                                    <div className={styles.gridItem}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Guide Section */}
                <section className={styles.guideSection}>
                    <h2 className={styles.sectionTitle}>{t.guideTitle}</h2>
                    <div className={styles.steps}>
                        <div className={styles.stepCard}>
                            <div className={styles.stepIcon}>1</div>
                            <h3>{t.step1Title}</h3>
                            <p>{t.step1Desc}</p>
                        </div>
                        <div className={styles.stepCard}>
                            <div className={styles.stepIcon}>2</div>
                            <h3>{t.step2Title}</h3>
                            <p>{t.step2Desc}</p>
                        </div>
                        <div className={styles.stepCard}>
                            <div className={styles.stepIcon}>3</div>
                            <h3>{t.step3Title}</h3>
                            <p>{t.step3Desc}</p>
                        </div>
                    </div>
                </section>

                {/* Templates Info */}
                <section className={styles.templatesSection}>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>{t.templatesTitle}</h2>
                    <p className={styles.templateDesc}>{t.templatesDesc}</p>
                    <a href="https://expertvisits.com/register" className={styles.cta} style={{ fontSize: '1rem', padding: '14px 36px' }}>
                        {t.ctaBtnAlt}
                    </a>
                </section>
            </div>
        
        </div>
    );
}
