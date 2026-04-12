"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "../styles/template8.module.scss";

/** RPG / MMO HUD: deep panels, gold frame, mint highlights — distinct from Cyberpunk neon */
export default function TemplateLayout({ children, user }) {
    const rootStyle = {
        "--t8-bg": "#070910",
        "--t8-bg-alt": "#0f1420",
        "--t8-panel": "#141b2e",
        "--t8-text": "#e8ecf4",
        "--t8-text-light": "#8b95ab",
        "--t8-text-dim": "#8b95ab",
        "--t8-primary": "#e8c547",
        "--t8-primary-dark": "#b8921a",
        "--t8-gold": "#e8c547",
        "--t8-gold-dim": "#9a7b1a",
        "--t8-accent": "#5eead4",
        "--t8-danger": "#fb7185",
        "--t8-border": "#2d3a55",
        "--t8-glow": "0 0 24px rgba(232, 197, 71, 0.15)",
        "--t8-shadow": "0 16px 40px rgba(0, 0, 0, 0.45)",
        "--t8-header-bg": "rgba(7, 9, 16, 0.95)",
    };

    return (
        <div className={styles.templateRoot} style={rootStyle}>
            <Navbar user={user} />

            <main className={styles.mainContent}>{children}</main>

            <Footer user={user} />
        </div>
    );
}
