"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template5.module.scss";

export default function TemplateLayout({ children, user }) {
    const rootStyle = {
        '--t5-bg': '#f8fafc',
        '--t5-bg-alt': '#ffffff',
        '--t5-text': '#1e293b',
        '--t5-text-light': '#64748b',
        '--t5-primary': '#0ea5e9', // Sky Blue
        '--t5-primary-dark': '#0369a1',
        '--t5-accent': '#0d9488', // Teal
        '--t5-border': '#e2e8f0',
        '--t5-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '--t5-header-bg': 'rgba(255, 255, 255, 0.9)',
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <Navbar user={user} />
            
            <main className={styles.mainContent}>
                {children}
            </main>
            
            <Footer user={user} />
        </div>
    );
}
