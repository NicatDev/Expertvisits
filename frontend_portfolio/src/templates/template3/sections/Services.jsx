'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Box, X } from 'lucide-react';
import styles from '../styles/home.module.scss';
import { useTranslation } from '@/i18n/client';

export default function Services({ data }) {
    const services = data || [];
    const { t } = useTranslation();
    const [selectedService, setSelectedService] = useState(null);

    if (!services || services.length === 0) return null;

    return (
        <section id="services" className={styles.block}>
            <div className={styles.blockLabel}>{t('portfolio.services') || 'Services'}</div>
            
            <div style={{ margin: '16px 0 24px' }}>
                <Swiper
                    modules={[Autoplay, FreeMode]}
                    spaceBetween={20}
                    slidesPerView={1.2}
                    freeMode={true}
                    breakpoints={{
                         640: { slidesPerView: 2.2 },
                         1024: { slidesPerView: 3.2 }
                    }}
                    autoplay={{ delay: 2500, disableOnInteraction: false }}
                    style={{ overflow: 'visible' }}
                >
                    {services.map((service, index) => (
                        <SwiperSlide key={service.id || index}>
                            <div style={{
                                background: '#111827', 
                                border: '1px solid #374151',
                                borderRadius: '12px',
                                padding: '24px',
                                height: '280px',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                color: '#f3f4f6',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            onClick={() => setSelectedService(service)}
                            >
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '8px', 
                                    background: 'rgba(251, 191, 36, 0.15)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    marginBottom: '16px', color: '#fbbf24'
                                }}>
                                    <Box size={20} />
                                </div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '500', color: '#fff' }}>{service.title}</h3>
                                <p style={{ 
                                    color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6', 
                                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', 
                                    overflow: 'hidden', flexGrow: 1, margin: 0 
                                }}>
                                    {service.description}
                                </p>
                                {service.steps && service.steps.length > 0 && (
                                    <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></div>
                                        <span style={{ fontSize: '0.85rem', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setSelectedService(null)}>
                    <div style={{
                        background: '#111827', border: '1px solid #374151',
                        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px',
                        maxHeight: '80vh', overflowY: 'auto', position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedService(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingRight: '40px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                                <Box size={20} />
                            </div>
                            <h2 style={{ margin: 0, color: '#f9fafb', fontSize: '1.4rem', fontWeight: '500' }}>{selectedService.title}</h2>
                        </div>
                        
                        <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '30px' }}>{selectedService.description}</p>
                        
                        {selectedService.steps && selectedService.steps.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '16px', color: '#fbbf24', fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('portfolio.steps') || 'Steps'}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedService.steps.map((step, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', borderLeft: '2px solid #5ab1b8', borderColor: idx === 0 ? '#fbbf24' : '#374151' }}>
                                            <div style={{ 
                                                width: '24px', height: '24px', borderRadius: '50%', background: '#374151', color: '#f3f4f6', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ color: '#d1d5db', lineHeight: '1.6', paddingTop: '2px', fontSize: '0.95rem' }}>
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
