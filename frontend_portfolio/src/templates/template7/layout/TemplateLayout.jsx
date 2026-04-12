"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template7.module.scss";

/** Editorial designer: warm cream, terracotta accent, serif display + clean sans body */
export default function TemplateLayout({ children, user }) {
    const rootStyle = {
        "--t7-bg": "#faf7f2",
        "--t7-bg-alt": "#ffffff",
        "--t7-text": "#1c1917",
        "--t7-text-light": "#78716c",
        "--t7-primary": "#c2410c",
        "--t7-primary-dark": "#9a3412",
        "--t7-accent": "#d97757",
        "--t7-muted": "#f5f0e8",
        "--t7-border": "#e7e5e4",
        "--t7-shadow": "0 28px 56px -16px rgba(28, 25, 23, 0.14)",
        "--t7-header-bg": "rgba(250, 247, 242, 0.94)",
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <Navbar user={user} />

            <main className={styles.mainContent}>{children}</main>

            <Footer user={user} />
        </div>
    );
}
