import { Inter } from "next/font/google";
import "@/styles/globals.scss";
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
    return {
        title: "Portfolio | Expert Visits",
        description: "Professional Portfolio Platform",
        icons: {
            icon: '/favicon.ico',
        },
    };
}

export default async function RootLayout({ children }) {
    // Determine language from cookie to set html lang attribute
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'en';

    return (
        <html lang={lng} suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning={true}>
                {children}
            </body>
        </html>
    );
}
