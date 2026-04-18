"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/client';
import { mediaUrl } from '@/lib/mediaUrl';
import { parseServiceSteps } from '@/lib/parseServiceSteps';
import DetailModal from '../components/DetailModal';
import VacancyCard from '../components/VacancyCard';
import styles from '../styles/home.module.scss';
import modalStyles from '../styles/detailModal.module.scss';

function formatDate(iso, locale) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(locale?.startsWith('en') ? 'en-GB' : 'az-AZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

export default function HomePageClient({ company, companySlug, previewVacancies = [], visibility = {} }) {
    const { t, i18n } = useTranslation();
    const loc = i18n.language || 'az';
    const vis = visibility;

    const services = company?.services || [];
    const projects = company?.company_projects || [];
    const partners = company?.partners || [];

    const cover = mediaUrl(company?.cover_image);
    const founded = company?.founded_at ? formatDate(company.founded_at, loc) : '—';

    const [openServiceId, setOpenServiceId] = useState(null);
    const [openProjectId, setOpenProjectId] = useState(null);

    const selectedService = openServiceId != null ? services.find((s) => s.id === openServiceId) : null;
    const serviceSteps = selectedService ? parseServiceSteps(selectedService.steps) : [];

    const selectedProject = openProjectId != null ? projects.find((p) => p.id === openProjectId) : null;

    return (
        <>
            <section className={styles.hero}>
                {cover ? (
                    <div className={styles.heroBg} style={{ backgroundImage: `url(${cover})` }} aria-hidden />
                ) : (
                    <div className={styles.heroBg} style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }} aria-hidden />
                )}
                <div className={styles.heroGrad} aria-hidden />
                <div className={styles.heroInner}>
                    <span className={styles.badge}>
                        {(company?.slogan || '').trim() || t('home.heroBadge')}
                    </span>
                    <h1 className={styles.heroTitle}>{company?.name}</h1>
                    {company?.summary ? (
                        <p className={styles.heroSummary}>{company.summary}</p>
                    ) : null}
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <div className={styles.statLabel}>{t('home.founded')}</div>
                            <div className={styles.statValue}>{founded}</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statLabel}>{t('home.teamSize')}</div>
                            <div className={styles.statValue}>{company?.company_size || '—'}</div>
                        </div>
                        {vis.show_email_on_site ? (
                            <div className={styles.stat}>
                                <div className={styles.statLabel}>{t('home.email')}</div>
                                <div className={styles.statValue} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                    {company?.email ? (
                                        <a href={`mailto:${company.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {company.email}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </div>
                        ) : null}
                        {vis.show_phone_on_site ? (
                            <div className={styles.stat}>
                                <div className={styles.statLabel}>{t('home.phone')}</div>
                                <div className={styles.statValue} style={{ fontSize: '0.85rem' }}>{company?.phone || '—'}</div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            {services.length > 0 && vis.services_on_home ? (
                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{t('home.servicesPreview')}</h2>
                        {vis.services_page ? (
                            <Link href={`/${companySlug}/services`} className={styles.link}>{t('home.viewAll')} →</Link>
                        ) : null}
                    </div>
                    <div className={styles.grid3}>
                        {services.slice(0, 3).map((s) => (
                            <article
                                key={s.id}
                                className={`${styles.card} ${styles.cardClickable}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setOpenServiceId(s.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setOpenServiceId(s.id);
                                    }
                                }}
                            >
                                <h3 className={styles.cardTitle}>{s.title}</h3>
                                <p className={styles.cardBody}>{(s.description || '').slice(0, 180)}{(s.description || '').length > 180 ? '…' : ''}</p>
                                <span className={styles.link} style={{ pointerEvents: 'none', fontSize: '0.8rem' }}>
                                    {t('services.openDetail')} →
                                </span>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            {projects.length > 0 && vis.projects_on_home ? (
                <section className={styles.section} style={{ background: '#eef2f7', margin: 0, maxWidth: 'none', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 0' }}>
                        <div className={styles.sectionHead}>
                            <h2 className={styles.sectionTitle}>{t('home.projectsPreview')}</h2>
                            {vis.projects_page ? (
                                <Link href={`/${companySlug}/projects`} className={styles.link}>{t('home.viewAll')} →</Link>
                            ) : null}
                        </div>
                        <div className={styles.grid3}>
                            {projects.slice(0, 3).map((p) => (
                                <article
                                    key={p.id}
                                    className={`${styles.card} ${styles.cardClickable}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setOpenProjectId(p.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setOpenProjectId(p.id);
                                        }
                                    }}
                                >
                                    {p.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={mediaUrl(p.image)} alt="" className={styles.projectThumb} />
                                    ) : (
                                        <div className={styles.projectThumbPlaceholder} aria-hidden />
                                    )}
                                    <h3 className={styles.cardTitle}>{p.title}</h3>
                                    <p className={styles.cardBody}>{(p.description || '').slice(0, 120)}{(p.description || '').length > 120 ? '…' : ''}</p>
                                    <span className={styles.link} style={{ pointerEvents: 'none', fontSize: '0.8rem' }}>
                                        {t('projects.openDetail')} →
                                    </span>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {partners.length > 0 && vis.partners_on_home ? (
                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>{t('home.partnersPreview')}</h2>
                        {vis.partners_page ? (
                            <Link href={`/${companySlug}/partners`} className={styles.link}>{t('home.viewAll')} →</Link>
                        ) : null}
                    </div>
                    <div className={styles.grid3}>
                        {partners.slice(0, 6).map((p) => (
                            <article key={p.id} className={styles.card} style={{ textAlign: 'center' }}>
                                {p.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.logo} alt="" className={styles.partnerLogo} />
                                ) : (
                                    <div className={styles.partnerLogo} style={{ background: '#e2e8f0' }} />
                                )}
                                <div className={styles.partnerName}>{p.title}</div>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            {previewVacancies.length > 0 && vis.vacancies_on_home ? (
                <section className={styles.sectionVacancies}>
                    <div className={styles.sectionVacanciesInner}>
                        <div className={styles.sectionHead}>
                            <h2 className={styles.sectionTitle}>{t('home.vacanciesPreview')}</h2>
                            {vis.vacancies_page ? (
                                <Link href={`/${companySlug}/vacancies`} className={styles.link}>{t('home.viewAll')} →</Link>
                            ) : null}
                        </div>
                        <div className={styles.grid3}>
                            {previewVacancies.slice(0, 3).map((vac) => (
                                <VacancyCard key={vac.id} vac={vac} locale={loc} />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            <DetailModal
                open={Boolean(selectedService)}
                onClose={() => setOpenServiceId(null)}
                title={selectedService?.title}
            >
                {selectedService ? (
                    <>
                        <div className={modalStyles.body}>{selectedService.description || ''}</div>
                        {serviceSteps.length > 0 ? (
                            <ul className={modalStyles.steps}>
                                {serviceSteps.map((st, i) => (
                                    <li key={i}>{typeof st === 'string' ? st : st?.text || JSON.stringify(st)}</li>
                                ))}
                            </ul>
                        ) : null}
                    </>
                ) : null}
            </DetailModal>

            <DetailModal
                open={Boolean(selectedProject)}
                onClose={() => setOpenProjectId(null)}
                title={selectedProject?.title}
            >
                {selectedProject ? (
                    <>
                        {selectedProject.date ? (
                            <div className={modalStyles.meta}>{formatDate(selectedProject.date, loc)}</div>
                        ) : null}
                        {selectedProject.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(selectedProject.image)} alt="" className={modalStyles.img} />
                        ) : null}
                        <div className={modalStyles.body}>{selectedProject.description || ''}</div>
                        {selectedProject.url ? (
                            <a
                                href={selectedProject.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={modalStyles.ext}
                            >
                                {t('projects.visit')} →
                            </a>
                        ) : null}
                    </>
                ) : null}
            </DetailModal>
        </>
    );
}
