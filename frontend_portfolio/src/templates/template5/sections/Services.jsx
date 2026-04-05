"use client";

import React, { useState } from 'react';
import { X, ChevronRight, Briefcase, ShieldCheck, Activity, Award, UserCheck, Globe, Star } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import styles from '../styles/services.module.scss';

export default function Services({ data }) {
    const { t } = useTranslation();
    const [selectedService, setSelectedService] = useState(null);

    const getIcon = (idx) => {
        const icons = [<Briefcase key="1"/>, <Star key="2"/>, <Activity key="3"/>, <ShieldCheck key="4"/>, <Award key="5"/>, <UserCheck key="6"/>];
        return icons[idx % icons.length];
    };

    return (
        <section id="services" className={styles.servicesSection}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <span className={styles.subTitle}>{t('portfolio.servicesSectionSubtitle')}</span>
                    <h2 className={styles.sectionTitle}>{t('portfolio.servicesSectionTitle')}</h2>
                </div>

                <div className={styles.serviceGrid}>
                    {data.map((service, idx) => (
                        <div key={idx} className={styles.serviceCard} onClick={() => setSelectedService(service)}>
                            <div className={styles.serviceIcon}>{getIcon(idx)}</div>
                            <h3 className={styles.serviceTitle}>{service.title}</h3>
                            <p className={styles.serviceDescription}>
                                {service.description && service.description.length > 100
                                    ? `${service.description.substring(0, 100)}…`
                                    : service.description || ''}
                            </p>
                            <span className={styles.readMore}>
                                {t('portfolio.readMore')} <ChevronRight size={16} />
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Service Modal */}
            {selectedService && (
                <div className={styles.modalOverlay} onClick={() => setSelectedService(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedService(null)}><X size={24} /></button>
                        <div className={styles.modalBody}>
                           <div className={styles.modalIcon}>{getIcon(data.indexOf(selectedService))}</div>
                           <h3>{selectedService.title}</h3>
                           <div className={styles.divider}></div>
                           <p className={styles.fullDescription}>{selectedService.description}</p>
                           
                           {selectedService.steps && selectedService.steps.length > 0 && (
                               <div className={styles.stepsWrapper}>
                                   <h4>{t('portfolio.processSteps')}</h4>
                                   <div className={styles.stepsList}>
                                       {selectedService.steps.map((step, sIdx) => (
                                           <div key={sIdx} className={styles.stepItem}>
                                               <span className={styles.stepNumber}>{sIdx + 1}</span>
                                               <p>
                                                   {typeof step === 'string'
                                                       ? step
                                                       : step?.title || step?.text || ''}
                                               </p>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                           
                           <button className={styles.modalAction} onClick={() => setSelectedService(null)}>
                               {t('portfolio.understood')}
                           </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
