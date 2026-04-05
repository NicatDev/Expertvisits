'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Layers } from 'lucide-react';
import styles from '../styles/home.module.scss';
import { useTranslation } from '@/i18n/client';
import { truncateDescription } from '@/lib/portfolioText';
import PortfolioContentModal from '@/components/portfolio/PortfolioContentModal';

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
                        1280: { slidesPerView: 2 },
                    }}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3500, disableOnInteraction: false }}
                    style={{ paddingBottom: '60px', width: '100%' }}
                >
                    {services.map((service, index) => {
                        const { excerpt, needsMore } = truncateDescription(service.description);
                        return (
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
                                        transition: 'all 0.3s ease',
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
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedService(service);
                                        }
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: '700',
                                            color: '#6366f1',
                                            marginBottom: '16px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        <Layers size={18} />
                                        <span>{t('portfolio.services') || 'Service'}</span>
                                    </div>

                                    <h4
                                        style={{
                                            fontSize: '1.35rem',
                                            fontWeight: '800',
                                            color: '#111',
                                            marginBottom: '12px',
                                            letterSpacing: '-0.5px',
                                        }}
                                    >
                                        {service.title}
                                    </h4>

                                    <p
                                        style={{
                                            color: '#4b5563',
                                            fontSize: '1rem',
                                            lineHeight: '1.7',
                                            flexGrow: 1,
                                            margin: '0 0 20px 0',
                                        }}
                                    >
                                        {needsMore ? excerpt : service.description}
                                    </p>

                                    {needsMore ? (
                                        <button
                                            type="button"
                                            style={{
                                                alignSelf: 'flex-start',
                                                marginBottom: '8px',
                                                padding: 0,
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                font: 'inherit',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                color: '#4f46e5',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedService(service);
                                            }}
                                        >
                                            {t('portfolio.readMore')}
                                        </button>
                                    ) : null}

                                    {service.steps && service.steps.length > 0 && (
                                        <div style={{ marginTop: 'auto', display: 'flex' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '6px 14px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: '#4f46e5',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                {service.steps.length} {t('portfolio.steps') || 'Steps'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            <PortfolioContentModal
                isOpen={Boolean(selectedService)}
                onClose={() => setSelectedService(null)}
                title={selectedService?.title}
                body={selectedService?.description}
                steps={selectedService?.steps}
                dark={false}
            />
        </section>
    );
}
