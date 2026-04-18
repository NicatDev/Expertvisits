"use client";

import Navbar from './Navbar';
import Footer from './Footer';
import { buildMicrositeThemeStyle } from '@/lib/siteTheme';
import styles from '../styles/shell.module.scss';

export default function TemplateLayout({ children, company, companySlug, hasVacancies, visibility }) {
    return (
        <div className={styles.shell} style={buildMicrositeThemeStyle(company)}>
            <Navbar
                company={company}
                companySlug={companySlug}
                hasVacancies={hasVacancies}
                visibility={visibility}
            />
            <div style={{ flex: 1 }}>{children}</div>
            <Footer company={company} companySlug={companySlug} visibility={visibility} />
        </div>
    );
}
