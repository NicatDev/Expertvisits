import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18next')?.value || 'en';

  const metaTranslations = {
    az: {
      title: "Şirkətlər | Expert Visits - Tərəfdaş Şirkətlər",
      description: "Bizimlə əməkdaşlıq edən şirkətləri kəşf edin, onların vakansiyaları və xidmətləri ilə tanış olun.",
      keywords: ["şirkətlər", "vacancies", "biznes", "expert visits"],
      locale: "az_AZ"
    },
    en: {
      title: "Companies | Expert Visits - Partner Companies",
      description: "Discover the companies partnering with us, explore their vacancies and services.",
      keywords: ["companies", "vacancies", "business", "expert visits"],
      locale: "en_US"
    },
    ru: {
      title: "Компании | Expert Visits - Компании-партнеры",
      description: "Откройте для себя компании, сотрудничающие с нами, изучите их вакансии и услуги.",
      keywords: ["компании", "вакансии", "бизнес", "expert visits"],
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
      url: "https://app.expertvisits.com/companies",
      siteName: "Expert Visits",
      locale: t.locale,
      type: "website",
    },
  };
}

export default function CompaniesLayout({ children }) {
  return <>{children}</>;
}
