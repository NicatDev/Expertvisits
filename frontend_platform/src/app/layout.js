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

const inter = Inter({ subsets: ["latin"] });

export function generateMetadata() {
  return {
    metadataBase: new URL(SITE_ORIGIN),
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
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
