import { Inter } from "next/font/google";
import "@/styles/globals.scss";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ subsets: ["latin"] });

import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const lng = locale || cookieStore.get('i18next')?.value || 'en';

  const metaTranslations = {
    az: {
      title: "Expert Visits | Peşəkar Kimlik və Əməkdaşlıq Platforması",
      description: "Ekspertlər üçün peşəkar kimlik yaratmaq, məqalə və postlar paylaşmaq, şirkətlər və mütəxəssislərlə əlaqə qurmaq üçün rəqəmsal ekosistem.",
      keywords: ["expert visits", "peşəkar platforma", "ekspertlər", "iş elanları", "şirkətlər", "məqalələr", "əməkdaşlıq"],
      locale: "az_AZ"
    },
    en: {
      title: "Expert Visits | Professional Identity & Collaboration Platform",
      description: "Digital ecosystem for experts to create professional identities, share posts and articles, and connect with companies and peers.",
      keywords: ["expert visits", "professional platform", "experts", "job vacancies", "companies", "articles", "collaboration"],
      locale: "en_US"
    },
    ru: {
      title: "Expert Visits | Профессиональная идентичность и платформа сотрудничества",
      description: "Цифровая экосистема для экспертов: создание профессионального профиля, публикации и взаимодействие с компаниями.",
      keywords: ["expert visits", "профессиональная платформа", "эксперты", "вакансии", "компании", "статьи", "сотрудничество"],
      locale: "ru_RU"
    }
  };

  const t = metaTranslations[lng] || metaTranslations['az'];

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    icons: {
      icon: '/logo.png',
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: "https://app.expertvisits.com",
      siteName: "Expert Visits",
      images: [
        {
          url: "/logo.png",
          width: 800,
          height: 600,
          alt: "Expert Visits Logo",
        },
      ],
      locale: t.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["/logo.png"],
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
