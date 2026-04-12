'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getExperienceResponsibilityLines } from '@/lib/utils/experienceResponsibilities';
import styles from './style.module.scss';

/**
 * @param {'owner' | 'public'} variant — public: collapsible chevron when there are lines
 */
export default function ExperienceDisplay({ item, t, variant = 'owner' }) {
  const lines = getExperienceResponsibilityLines(item?.responsibilities);
  const [open, setOpen] = useState(false);

  const summary = (
    <>
      <h3>{item.position}</h3>
      <p>{item.company_name}</p>
      <span>
        {item.start_date} — {item.end_date || t('common.present')}
      </span>
    </>
  );

  if (variant === 'owner') {
    return (
      <div className={styles.wrap}>
        <div className={styles.main}>{summary}</div>
        {lines.length > 0 ? (
          <ul className={styles.listOwner}>
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const hasDetails = lines.length > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.main}>{summary}</div>
        {hasDetails ? (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-label={open ? t('public_profile.experience_hide_details') : t('public_profile.experience_show_details')}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown size={20} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden />
          </button>
        ) : null}
      </div>
      {open && hasDetails ? (
        <ul className={styles.list}>
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
