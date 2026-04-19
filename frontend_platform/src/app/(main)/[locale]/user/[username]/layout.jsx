import { notFound } from 'next/navigation';
import UserProfileLayoutClient from './UserProfileLayoutClient';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { buildNoIndexMetadata } from '@/lib/seo/meta/buildMetadata';
import { getMetaBundle } from '@/lib/seo/meta/loadMeta';
import { userProfileUsernameCandidates } from '@/lib/userProfileUsernameCandidates';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/').replace(
  /\/?$/,
  '/',
);

export async function generateMetadata({ params }) {
  const { username, locale } = await params;
  const loc = locale || 'az';
  const pathname = `/${loc}/user/${username}`;
  let profile = null;
  try {
    for (const u of userProfileUsernameCandidates(username)) {
      const res = await fetch(`${API_BASE}accounts/users/${encodeURIComponent(u)}/`, {
        next: { revalidate: 120 },
      });
      if (res.ok) {
        profile = await res.json();
        break;
      }
    }
  } catch {
    /* fallback meta below */
  }
  if (!profile) {
    return buildNoIndexMetadata({
      siteOrigin: SITE_ORIGIN,
      pathname,
      locale: loc,
      noindexKey: 'userPublic',
    });
  }
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username;
  const t = getMetaBundle(loc);
  const title = `${name} ${t.noindex.userPublic.titleSuffix}`.trim();
  const description = t.noindex.userPublic.description;
  const ogImage = profile.avatar_compressed || profile.avatar || profile.profile_image;
  return buildNoIndexMetadata({
    siteOrigin: SITE_ORIGIN,
    pathname,
    locale: loc,
    noindexKey: 'userPublic',
    title,
    description,
    ogImage,
  });
}

async function assertUserProfileExists(username) {
  if (!username || username === 'undefined') {
    notFound();
  }
  for (const u of userProfileUsernameCandidates(username)) {
    const res = await fetch(`${API_BASE}accounts/users/${encodeURIComponent(u)}/`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return;
    }
  }
  notFound();
}

export default async function UserProfileLayout({ children, params }) {
  const { username } = await params;
  await assertUserProfileExists(username);
  return <UserProfileLayoutClient>{children}</UserProfileLayoutClient>;
}
