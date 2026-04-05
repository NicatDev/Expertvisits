'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Layers } from 'lucide-react';
import styles from '../styles/home.module.scss';
import { useTranslation } from '@/i18n/client';
import { truncateDescription } from '@/lib/portfolioText';
import PortfolioContentModal from '@/components/portfolio/PortfolioContentModal';

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
                        1024: { slidesPerView: 3 },
                    }}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    style={{ paddingBottom: '40px' }}
                >
                    {services.map((service, index) => {
                        const { excerpt, needsMore } = truncateDescription(service.description);
                        return (
                            <SwiperSlide key={service.id || index}>
                                <div
                                    className={styles.glassCard}
                                    style={{
                                        minHeight: '320px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
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
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'rgba(79, 172, 254, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                            color: '#4facfe',
                                        }}
                                    >
                                        <Layers size={24} />
                                    </div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>
                                        {service.title}
                                    </h3>
                                    <p
                                        style={{
                                            color: '#9ca3af',
                                            fontSize: '0.95rem',
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
                                                marginTop: '12px',
                                                padding: 0,
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                font: 'inherit',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: '#4facfe',
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
                                                marginTop: '16px',
                                                paddingTop: '16px',
                                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <span className={styles.levelBadge} style={{ display: 'inline-block' }}>
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
