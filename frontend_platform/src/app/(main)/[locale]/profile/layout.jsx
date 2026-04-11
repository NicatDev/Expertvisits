import ProfileLayoutClient from './ProfileLayoutClient';

export const metadata = {
  title: 'Mənim Profilim | Expert Visits',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ProfileSegmentLayout({ children }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
