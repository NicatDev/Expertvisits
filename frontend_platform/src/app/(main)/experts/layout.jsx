import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18next')?.value || 'en';

  const metaTranslations = {
    az: {
      title: "Ekspertlər | Expert Visits - Mütəxəssis Axtarışı",
      description: "Öz sahəsində mütəxəssisləri, ekspertləri və peşəkarları kəşf edin. Fərqli bacarıqlara malik kadrları tapın.",
      keywords: ["ekspertlər", "mütəxəssislər", "işçilər", "professionallar", "expert visits"],
      locale: "az_AZ"
    },
    en: {
      title: "Experts | Expert Visits - Professional Search",
      description: "Discover experts and professionals in their fields. Find skilled personnel for your needs.",
      keywords: ["experts", "professionals", "personnel", "search experts", "expert visits"],
      locale: "en_US"
    },
    ru: {
      title: "Эксперты | Expert Visits - Поиск профессионалов",
      description: "Откройте для себя экспертов и профессионалов в их областях. Найдите квалифицированные кадры.",
      keywords: ["эксперты", "профессионалы", "кадры", "поиск экспертов", "expert visits"],
      locale: "ru_RU"
    }
  };

  const t = metaTranslations[lng] || metaTranslations['az'];

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    openGraph: {
      title: t.title,
      description: t.description,
      url: "https://app.expertvisits.com/experts",
      siteName: "Expert Visits",
      locale: t.locale,
      type: "website",
    },
  };
}

export default function ExpertsLayout({ children }) {
  return <>{children}</>;
}
