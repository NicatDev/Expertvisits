import React from 'react';
import CompanyDetailClient from './CompanyDetailClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildCompanyDetailMetadata } from '@/lib/seo/meta/buildMetadata';

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/';
  return raw.replace(/\/$/, '');
}

async function fetchCompanyForMeta(slug, locale) {
  const base = getApiBase();
  const url = `${base}/business/companies/${encodeURIComponent(slug)}/`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': locale || 'az', Accept: 'application/json' },
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const loc = locale || 'az';
  const company = await fetchCompanyForMeta(slug, loc);
  if (!company) {
    return { title: 'Expert Visits', robots: { index: false, follow: false } };
  }
  return buildCompanyDetailMetadata({
    siteOrigin: SITE_ORIGIN,
    company,
    slug,
    locale: loc,
  });
}

export default async function CompanyDetailPageWrapper({ params }) {
  return <CompanyDetailClient params={params} />;
}
