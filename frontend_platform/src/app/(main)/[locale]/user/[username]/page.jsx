import UserAboutPageClient from './UserAboutPageClient';

export const metadata = {
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

export default function UserPage() {
    return <UserAboutPageClient />;
}
