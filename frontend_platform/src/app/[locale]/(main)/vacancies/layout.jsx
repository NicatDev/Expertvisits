import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lng = cookieStore.get('i18next')?.value || 'en';

  const metaTranslations = {
    az: {
      title: "Vakansiyalar | Expert Visits - İş Elanları",
      description: "Karyeranızı irəliyə aparacaq ən son iş elanlarını, təcrübə proqramlarını və vakansiyaları kəşf edin.",
      keywords: ["vakansiyalar", "iş elanları", "karyera", "təcrübə", "expert visits"],
      locale: "az_AZ"
    },
    en: {
      title: "Vacancies | Expert Visits - Job Listings",
      description: "Discover the latest job listings, internships, and vacancies to advance your career.",
      keywords: ["vacancies", "job listings", "career", "internships", "expert visits"],
      locale: "en_US"
    },
    ru: {
      title: "Вакансии | Expert Visits - Поиск работы",
      description: "Найдите последние списки вакансий, стажировки и предложения работы для продвижения вашей карьеры.",
      keywords: ["вакансии", "поиск работы", "карьера", "стажировки", "expert visits"],
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
      url: "https://app.expertvisits.com/vacancies",
      siteName: "Expert Visits",
      locale: t.locale,
      type: "website",
    },
  };
}

export default function VacanciesLayout({ children }) {
  return <>{children}</>;
}
