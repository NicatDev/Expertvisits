"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template6.module.scss";

/** GitHub / VS Code–inspired palette: monospace, syntax accents, dark panes */
export default function TemplateLayout({ children, user }) {
    const rootStyle = {
        "--t6-bg": "#0d1117",
        "--t6-bg-alt": "#161b22",
        "--t6-text": "#e6edf3",
        "--t6-text-light": "#8b949e",
        "--t6-primary": "#58a6ff",
        "--t6-primary-dark": "#388bfd",
        "--t6-accent": "#3fb950",
        "--t6-keyword": "#ff7b72",
        "--t6-string": "#a5d6ff",
        "--t6-warning": "#d29922",
        "--t6-border": "#30363d",
        "--t6-shadow": "0 12px 40px rgba(0, 0, 0, 0.45)",
        "--t6-header-bg": "rgba(13, 17, 23, 0.94)",
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <Navbar user={user} />

            <main className={styles.mainContent}>{children}</main>

            <Footer user={user} />
        </div>
    );
}
