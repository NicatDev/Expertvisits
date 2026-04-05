"use client";

import React from "react";
import { useTranslation } from "@/i18n/client";
import styles from "../styles/services.module.scss";
import ProjectsHomeSection from "@/components/portfolio/ProjectsHomeSection";

export default function Projects({ user }) {
    const { t } = useTranslation();

    const titleSlot = (
        <div className={styles.sectionHeader}>
            <span className={styles.subTitle}>{t("portfolio.navProjects")}</span>
            <h2 className={styles.sectionTitle}>{t("portfolio.projectsSectionTitle")}</h2>
        </div>
    );

    const mergedStyles = {
        ...styles,
        projects: styles.projectsSection,
        projectsContainer: styles.container,
        sectionTitle: styles.sectionTitle,
        projectsGrid: styles.serviceGrid,
        projectCard: styles.projectHomeCard,
        projectTextBlock: styles.projectHomeBody,
        projectExcerpt: styles.serviceDescription,
        projectImageWrap: styles.projectHomeImageWrap,
        projectImage: styles.projectHomeImage,
        projectDate: styles.projectHomeDate,
        projectReadMore: styles.projectReadMore,
        emptyText: styles.projectsEmpty,
    };

    return <ProjectsHomeSection user={user} styles={mergedStyles} titleSlot={titleSlot} />;
}
