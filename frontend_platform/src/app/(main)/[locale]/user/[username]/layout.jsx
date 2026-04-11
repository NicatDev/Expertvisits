import { notFound } from 'next/navigation';
import UserProfileLayoutClient from './UserProfileLayoutClient';

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvisits.com/api/').replace(
  /\/?$/,
  '/',
);

async function assertUserProfileExists(username) {
  if (!username || username === 'undefined') {
    notFound();
  }
  const res = await fetch(`${API_BASE}accounts/users/${encodeURIComponent(username)}/`, {
    cache: 'no-store',
  });
  if (res.status === 404) {
    notFound();
  }
}

export default async function UserProfileLayout({ children, params }) {
  const { username } = await params;
  await assertUserProfileExists(username);
  return <UserProfileLayoutClient>{children}</UserProfileLayoutClient>;
}
