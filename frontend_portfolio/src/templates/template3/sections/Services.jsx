'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Box } from 'lucide-react';
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
        <section id="services" className={styles.block}>
            <div className={styles.blockLabel}>{t('portfolio.services') || 'Services'}</div>

            <div style={{ margin: '16px 0 24px' }}>
                <Swiper
                    modules={[Autoplay, FreeMode]}
                    spaceBetween={20}
                    slidesPerView={1.2}
                    freeMode
                    breakpoints={{
                        640: { slidesPerView: 2.2 },
                        1024: { slidesPerView: 3.2 },
                    }}
                    autoplay={{ delay: 2500, disableOnInteraction: false }}
                    style={{ overflow: 'visible' }}
                >
                    {services.map((service, index) => {
                        const { excerpt, needsMore } = truncateDescription(service.description);
                        return (
                            <SwiperSlide key={service.id || index}>
                                <div
                                    style={{
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        minHeight: '280px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease',
                                        color: '#f3f4f6',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#fbbf24';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#374151';
                                        e.currentTarget.style.transform = 'translateY(0)';
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
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            background: 'rgba(251, 191, 36, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '16px',
                                            color: '#fbbf24',
                                        }}
                                    >
                                        <Box size={20} />
                                    </div>
                                    <h3
                                        style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '1.1rem',
                                            fontWeight: '500',
                                            color: '#fff',
                                        }}
                                    >
                                        {service.title}
                                    </h3>
                                    <p
                                        style={{
                                            color: '#9ca3af',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.6',
                                            flexGrow: 1,
                                            margin: 0,
                                        }}
                                    >
                                        {needsMore ? excerpt : service.description}
                                    </p>
                                    {needsMore ? (
                                        <button
                                            type="button"
                                            style={{
                                                marginTop: '10px',
                                                padding: 0,
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                font: 'inherit',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: '#fbbf24',
                                                textAlign: 'left',
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
                                        <div
                                            style={{
                                                marginTop: 'auto',
                                                paddingTop: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: '#fbbf24',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: '0.85rem',
                                                    color: '#d1d5db',
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
                dark
            />
        </section>
    );
}
