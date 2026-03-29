'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Layers, X } from 'lucide-react';
import styles from '../styles/home.module.scss';
import { useTranslation } from '@/i18n/client';

export default function Services({ data, sectionIndex }) {
    const services = data || [];
    const { t } = useTranslation();
    const [selectedService, setSelectedService] = useState(null);

    if (!services || services.length === 0) return null;

    return (
        <section id="services" className={styles.section}>
            <div className={styles.titleWrapperLeft}>
                <h2 className={styles.sectionTitle}>
                    <span>0{sectionIndex} /</span> {t('portfolio.services') || 'Services'}
                </h2>
            </div>
            
            <div style={{ padding: '20px 0' }}>
                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={30}
                    slidesPerView={1}
                    breakpoints={{
                         640: { slidesPerView: 2 },
                         1024: { slidesPerView: 3 }
                    }}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    style={{ paddingBottom: '40px' }}
                >
                    {services.map((service, index) => (
                        <SwiperSlide key={service.id || index}>
                            <div 
                                className={styles.glassCard} 
                                style={{ height: '320px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                                onClick={() => setSelectedService(service)}
                            >
                                <div style={{ 
                                    width: '50px', height: '50px', borderRadius: '12px', 
                                    background: 'rgba(79, 172, 254, 0.15)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    marginBottom: '20px', color: '#4facfe'
                                }}>
                                    <Layers size={24} />
                                </div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{service.title}</h3>
                                <p style={{ 
                                    color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.6', 
                                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', 
                                    overflow: 'hidden', flexGrow: 1, margin: 0 
                                }}>
                                    {service.description}
                                </p>
                                {service.steps && service.steps.length > 0 && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <span className={styles.levelBadge} style={{ display: 'inline-block' }}>
                                            {service.steps.length} {t('portfolio.steps') || 'Steps'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {selectedService && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setSelectedService(null)}>
                    <div style={{
                        background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px',
                        maxHeight: '80vh', overflowY: 'auto', position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedService(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', paddingRight: '30px' }}>{selectedService.title}</h2>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px', fontSize: '0.95rem' }}>{selectedService.description}</p>
                        
                        {selectedService.steps && selectedService.steps.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '16px', color: '#4facfe', fontSize: '1rem' }}>{t('portfolio.steps') || 'Steps'}:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedService.steps.map((step, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ 
                                                width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(79, 172, 254, 0.2)', border: '1px solid rgba(79, 172, 254, 0.4)', color: '#4facfe', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', flexShrink: 0 
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ color: '#e2e8f0', lineHeight: '1.5', paddingTop: '2px' }}>
                                                {step}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
