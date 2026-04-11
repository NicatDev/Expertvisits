'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../app/CreateSiteModal.module.scss';
import { useLocalizedPath } from '@/hooks/useLocalePath';

// Helper to calculate progress based on required fields
const calculateProgress = (profile) => {
  const required = [
    !!profile.summary,
    !!profile.phone_number,
    !!(profile.certificates && profile.certificates.length > 0), // first certificate counts
    !!profile.education,
    !!(profile.languages && profile.languages.length > 0),
    !!(profile.soft_skills && profile.soft_skills.length > 0),
  ];
  const completed = required.filter(Boolean).length;
  return Math.round((completed / required.length) * 100);
};

export default function CreateSiteModal({ isOpen, onClose }) {
  const profileHref = useLocalizedPath('/profile');
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [profileRes, articlesRes] = await Promise.all([
          fetch('/api/profile/'),
          fetch('/api/articles/'),
        ]);
        const profileData = await profileRes.json();
        const articlesData = await articlesRes.json();
        setProfile(profileData);
        setArticles(articlesData);
        setProgress(calculateProgress(profileData));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  const canCreate = progress >= 60;

  const handleCreate = () => {
    if (!canCreate) return;
    // Here you would call the backend endpoint that actually creates the site.
    // For demo we simply redirect to the newly created site URL.
    window.location.href = '/my-website';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Veb saytınızı yaratmaq üçün profilinizi tamamlayın</h2>
        {loading ? (
          <p>Yüklənir...</p>
        ) : (
          <>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressText}>Tamamlanma: {progress}%</p>
            {canCreate ? (
              <button className={styles.createBtn} onClick={handleCreate}>Veb saytımı yarat</button>
            ) : (
              <p className={styles.warning}>Profilinizin ən azı 60% tamamlanması lazımdır. Əks halda sayt boş qalacaq.</p>
            )}
            <div className={styles.links}>
              <Link href={profileHref}><a className={styles.link}>Profilinizi redaktə edin</a></Link>
            </div>
            {articles.length < 3 && (
              <p className={styles.info}>3 məqaləniz yoxdur – məqalə səhifəniz boş qalacaq, amma bloq məhdudiyyəti yoxdur.</p>
            )}
          </>
        )}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
