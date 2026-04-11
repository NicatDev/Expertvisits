import { Inter } from "next/font/google";
import "@/styles/globals.scss";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { InboxSocketProvider } from "@/lib/contexts/InboxSocketContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider } from "@/lib/contexts/LanguageProvider";
import { getRequestLocaleState } from "@/lib/i18n/requestLocale";
import { SITE_ORIGIN } from "@/lib/seo/siteOrigin";
import { buildMarketingMetadata } from "@/lib/seo/marketingMetadata";
import az from '@/locales/az.json';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

const inter = Inter({ subsets: ["latin"] });

const siteByLocale = { az: az.site_meta, en: en.site_meta, ru: ru.site_meta };

export async function generateMetadata() {
  const { effectiveLng, pathname } = await getRequestLocaleState();
  const t = siteByLocale[effectiveLng] || siteByLocale.az;
  const meta = buildMarketingMetadata(SITE_ORIGIN, pathname, t, {
    ogImages: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Expert Visits Logo",
      },
    ],
  });

  return {
    metadataBase: new URL(SITE_ORIGIN),
    ...meta,
    icons: {
      icon: '/logo.png',
    },
  };
}

export default async function RootLayout({ children }) {
  const { effectiveLng } = await getRequestLocaleState();

  return (
    <html lang={effectiveLng} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <InboxSocketProvider>
              <LanguageProvider lng={effectiveLng}>
                {children}
                <ToastContainer />
              </LanguageProvider>
            </InboxSocketProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
