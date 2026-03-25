"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template1.module.scss";

export default function TemplateLayout({ children, user }) {
    // Generate advanced CSS variables based on user data, or fallback to cool dark/light theme
    const rootStyle = {
        '--t1-bg': '#f8fafc',
        '--t1-text': '#0f172a',
        '--t1-text-light': '#64748b',
        '--t1-primary': '#3b82f6',
        '--t1-primary-glow': 'rgba(59, 130, 246, 0.4)',
        '--t1-border': 'rgba(255, 255, 255, 0.5)',
        '--glass-bg': 'rgba(255, 255, 255, 0.65)',
        '--glass-border': 'rgba(255, 255, 255, 0.5)',
        '--glass-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        '--glass-blur': 'blur(12px)',
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
