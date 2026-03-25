'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Layers, X } from 'lucide-react';
import styles from '../styles/home.module.scss';
import { useTranslation } from '@/i18n/client';

export default function Services({ data }) {
    const services = data || [];
    const { t } = useTranslation();
    const [selectedService, setSelectedService] = useState(null);

    if (!services || services.length === 0) return null;

    return (
        <section id="services" className={styles.section}>
            <div className={styles.stickyHeader}>
                <h2 className={styles.sectionTitle}>{t('portfolio.services') || 'Services'}</h2>
            </div>
            
            <div style={{ padding: '10px 0 40px', minWidth: 0, width: '100%', overflow: 'hidden' }}>
                <Swiper
                    modules={[Pagination, Autoplay]}
                    spaceBetween={24}
                    slidesPerView={1}
                    breakpoints={{
                         768: { slidesPerView: 2 },
                         1280: { slidesPerView: 2 }
                    }}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3500, disableOnInteraction: false }}
                    style={{ paddingBottom: '60px', width: '100%' }}
                >
                    {services.map((service, index) => (
                        <SwiperSlide key={service.id || index} style={{ height: 'auto' }}>
                            <div 
                                style={{
                                    background: 'rgba(255,255,255,0.7)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '2px solid #f3f4f6',
                                    borderRadius: '24px',
                                    padding: '32px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    minHeight: '280px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.background = 'rgba(249, 250, 251, 0.95)';
                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                                }}
                                onClick={() => setSelectedService(service)}
                            >
                                <div style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    fontSize: '0.9rem', fontWeight: '700', color: '#6366f1',
                                    marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px'
                                }}>
                                    <Layers size={18} />
                                    <span>{t('portfolio.services') || 'Service'}</span>
                                </div>
                                
                                <h4 style={{ 
                                    fontSize: '1.5rem', fontWeight: '800', color: '#111', 
                                    marginBottom: '12px', letterSpacing: '-0.5px' 
                                }}>
                                    {service.title}
                                </h4>
                                
                                <p style={{ 
                                    color: '#4b5563', fontSize: '1rem', lineHeight: '1.7', 
                                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
                                    overflow: 'hidden', flexGrow: 1, margin: '0 0 20px 0' 
                                }}>
                                    {service.description}
                                </p>
                                
                                {service.steps && service.steps.length > 0 && (
                                    <div style={{ marginTop: 'auto', display: 'flex' }}>
                                        <span style={{ 
                                            display: 'inline-block', padding: '6px 14px', 
                                            background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', 
                                            borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', 
                                            textTransform: 'uppercase', letterSpacing: '0.5px' 
                                        }}>
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
                    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setSelectedService(null)}>
                    <div style={{
                        background: '#ffffff', border: '2px solid rgba(99, 102, 241, 0.1)',
                        borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '650px',
                        maxHeight: '85vh', overflowY: 'auto', position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                    }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedService(null)}
                            style={{ 
                                position: 'absolute', top: '24px', right: '24px', background: '#f3f4f6', 
                                border: 'none', color: '#6b7280', cursor: 'pointer', borderRadius: '50%', 
                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', transition: 'all 0.2s' 
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                        >
                            <X size={20} />
                        </button>
                        
                        <div style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.9rem', fontWeight: '700', color: '#6366f1',
                            marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            <Layers size={18} />
                            <span>{t('portfolio.services') || 'Service'}</span>
                        </div>

                        <h2 style={{ margin: '0 0 20px 0', color: '#111', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px', paddingRight: '40px' }}>
                            {selectedService.title}
                        </h2>
                        
                        <p style={{ color: '#4b5563', lineHeight: '1.8', marginBottom: '32px', fontSize: '1.1rem' }}>
                            {selectedService.description}
                        </p>
                        
                        {selectedService.steps && selectedService.steps.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '20px', color: '#111', fontSize: '1.3rem', fontWeight: '800' }}>
                                    {t('portfolio.steps') || 'Steps'}:
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedService.steps.map((step, idx) => (
                                        <div key={idx} style={{ 
                                            display: 'flex', gap: '20px', alignItems: 'flex-start', 
                                            background: '#f8fafc', padding: '24px', borderRadius: '20px', 
                                            border: '1px solid rgba(99, 102, 241, 0.1)' 
                                        }}>
                                            <div style={{ 
                                                width: '32px', height: '32px', borderRadius: '50%', 
                                                background: '#6366f1', color: '#ffffff', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '1rem', fontWeight: '800', flexShrink: 0,
                                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ color: '#374151', lineHeight: '1.7', paddingTop: '3px', fontSize: '1.05rem', fontWeight: '500' }}>
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
