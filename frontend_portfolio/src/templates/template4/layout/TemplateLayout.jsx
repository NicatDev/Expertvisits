"use client";

import React from "react";
import Navbar from "./Navbar";
import styles from "../styles/template4.module.scss";

export default function TemplateLayout({ children, user }) {
    // Soft Cyberpunk Theme
    const rootStyle = {
        '--t4-bg': '#090a0f',
        '--t4-bg-alt': '#12141f',
        '--t4-sidebar-bg': 'rgba(9, 10, 15, 0.85)',
        '--t4-text': '#e2e8f0',
        '--t4-text-light': '#94a3b8',
        '--t4-primary': '#22d3ee', // Soft Cyan
        '--t4-secondary': '#f472b6', // Soft Pink
        '--t4-accent': '#fef08a', // Soft Yellow
        '--t4-border': 'rgba(34, 211, 238, 0.15)',
        '--t4-glow': 'rgba(34, 211, 238, 0.3)',
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <div className={styles.scanlines}></div>
            <Navbar user={user} />
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
