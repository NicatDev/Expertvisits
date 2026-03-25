"use client";

import React from "react";
import Navbar from "./Navbar";
import styles from "../styles/template3.module.scss";

export default function TemplateLayout({ children, user }) {
    return (
        <div className={styles.templateRoot}>
            <Navbar user={user} />
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
