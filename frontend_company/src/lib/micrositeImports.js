import { getMicrositeTemplateId } from './micrositeTemplate';

export async function importTemplateLayout(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/layout/TemplateLayout')).default;
    }
    return (await import('@/templates/template1/layout/TemplateLayout')).default;
}

export async function importHomePageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/HomePageClient')).default;
    }
    return (await import('@/templates/template1/pages/HomePageClient')).default;
}

export async function importAboutPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/AboutPageClient')).default;
    }
    return (await import('@/templates/template1/pages/AboutPageClient')).default;
}

export async function importContactPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/ContactPageClient')).default;
    }
    return (await import('@/templates/template1/pages/ContactPageClient')).default;
}

export async function importServicesPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/ServicesPageClient')).default;
    }
    return (await import('@/templates/template1/pages/ServicesPageClient')).default;
}

export async function importProjectsPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/ProjectsPageClient')).default;
    }
    return (await import('@/templates/template1/pages/ProjectsPageClient')).default;
}

export async function importPartnersPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/PartnersPageClient')).default;
    }
    return (await import('@/templates/template1/pages/PartnersPageClient')).default;
}

export async function importVacanciesPageClient(company) {
    if (getMicrositeTemplateId(company) === 3) {
        return (await import('@/templates/template3/pages/VacanciesPageClient')).default;
    }
    return (await import('@/templates/template1/pages/VacanciesPageClient')).default;
}
