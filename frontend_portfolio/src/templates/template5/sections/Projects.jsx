"use client";

import React from "react";
import { useTranslation } from "@/i18n/client";
import { mergeSectionVisibility } from "@/lib/sectionVisibility";
import { resolvePortfolioMediaUrl } from "@/lib/portfolioMedia";
import styles from "../styles/services.module.scss";

function formatProjectDate(dateVal) {
    if (!dateVal) return "";
    try {
        const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
        if (Number.isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return String(dateVal);
    }
}

export default function Projects({ user }) {
    const { t } = useTranslation();
    const v = mergeSectionVisibility(user?.section_visibility);
    if (!v.projects_on_home) return null;

    const projects = user?.projects || [];

    return (
        <section id="projects" className={styles.projectsSection}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <span className={styles.subTitle}>{t("portfolio.navProjects")}</span>
                    <h2 className={styles.sectionTitle}>{t("portfolio.projectsSectionTitle")}</h2>
                </div>

                {projects.length === 0 ? (
                    <p className={styles.projectsEmpty}>{t("portfolio.projectsEmptyHome")}</p>
                ) : (
                    <div className={styles.serviceGrid}>
                        {projects.map((p) => {
                            const imgSrc = resolvePortfolioMediaUrl(p.image);
                            return (
                                <article key={p.id} className={styles.projectHomeCard}>
                                    {imgSrc ? (
                                        <div className={styles.projectHomeImageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgSrc} alt="" className={styles.projectHomeImage} />
                                        </div>
                                    ) : null}
                                    <div className={styles.projectHomeBody}>
                                        <h3 className={styles.serviceTitle}>{p.title}</h3>
                                        {p.date ? (
                                            <time className={styles.projectHomeDate} dateTime={String(p.date)}>
                                                {formatProjectDate(p.date)}
                                            </time>
                                        ) : null}
                                        <p className={styles.serviceDescription}>
                                            {(p.description || "").length > 160
                                                ? `${(p.description || "").substring(0, 160)}…`
                                                : p.description || ""}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
