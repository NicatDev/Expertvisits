import TemplateLayout from '@/templates/template1/layout/TemplateLayout';
import LanguageManager from '@/components/LanguageManager';
import { getCompanyCached, getVacancies } from '@/lib/api/company';
import { getRequestLocaleState } from '@/lib/i18n/requestLocale';
import { requireActiveCompanyMicrosite } from '@/lib/requireCompanyMicrosite';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);
    const cookieStore = await cookies();
    const lng = cookieStore.get('i18next')?.value || 'az';

    if (!company || !company.website?.is_active) {
        const title = lng === 'en' ? 'Company not found' : 'Şirkət tapılmadı';
        return { title };
    }

    const desc = (company.summary || '').slice(0, 160);
    const title = `${company.name} | Expert Visits`;

    return {
        title,
        description: desc || title,
        openGraph: {
            title,
            description: desc || title,
            images: company.logo ? [{ url: company.logo }] : [{ url: '/logo.png' }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: desc || title,
            images: company.logo ? [company.logo] : ['/logo.png'],
        },
    };
}

export default async function CompanySiteLayout({ children, params }) {
    const { companySlug } = await params;
    const company = await getCompanyCached(companySlug);

    if (!company) {
        notFound();
    }

    const visibility = requireActiveCompanyMicrosite(company);

    let hasVacancies = false;
    try {
        const v = await getVacancies({ company: company.id, page_size: 1 });
        hasVacancies = (v.count ?? v.results?.length ?? 0) > 0;
    } catch {
        hasVacancies = false;
    }

    const { effectiveLng } = await getRequestLocaleState();

    return (
        <TemplateLayout
            company={company}
            companySlug={companySlug}
            hasVacancies={hasVacancies}
            visibility={visibility}
        >
            <LanguageManager lang={effectiveLng} />
            {children}
        </TemplateLayout>
    );
}
