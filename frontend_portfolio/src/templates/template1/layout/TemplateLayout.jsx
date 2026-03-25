"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template1.module.scss";

export default function TemplateLayout({ children, user }) {
    // Generate advanced CSS variables based on user data, or fallback to cool dark/light theme
    const rootStyle = {
        '--t1-bg': '#05050f',
        '--t1-bg-alt': '#090916',
        '--t1-text': '#f8fafc',
        '--t1-text-light': '#94a3b8',
        '--t1-primary': '#4facfe',
        '--t1-primary-glow': 'rgba(79, 172, 254, 0.4)',
        '--t1-border': 'rgba(255, 255, 255, 0.08)',
        '--glass-bg': 'rgba(10, 10, 20, 0.65)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--glass-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        '--glass-blur': 'blur(16px)',
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <Navbar user={user} />
            
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}

