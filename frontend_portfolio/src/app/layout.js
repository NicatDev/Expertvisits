import { Inter } from "next/font/google";
import "@/styles/globals.scss";
import { getRequestLocaleState } from "@/lib/i18n/requestLocale";

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
    const { effectiveLng } = await getRequestLocaleState();

    return (
        <html lang={effectiveLng} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/logo.png" sizes="any" />
            </head>
            <body className={inter.className} suppressHydrationWarning={true}>
                {children}
            </body>
        </html>
    );
}
