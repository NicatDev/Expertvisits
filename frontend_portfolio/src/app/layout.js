import { Inter } from "next/font/google";
import "@/styles/globals.scss";
import { cookies } from 'next/headers';
import { getUser, getArticleDetail } from "@/lib/api/portfolio";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Portfolio | Expert Visits",
    description: "Professional Portfolio Platform",
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/logo.png', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/logo.png',
    }
};

export default async function RootLayout({ children }) {
    const cookieStore = await cookies();
    const fallbackLng = cookieStore.get('i18next')?.value || 'az';
    
    return (
        <html lang={fallbackLng} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/logo.png" sizes="any" />
            </head>
            <body className={inter.className} suppressHydrationWarning={true}>
                {children}
            </body>
        </html>
    );
}
