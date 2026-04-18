import { getMicrositeTemplateId } from './micrositeTemplate';

export async function importTemplateLayout(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/layout/TemplateLayout')).default;
        case 3:
            return (await import('@/templates/template3/layout/TemplateLayout')).default;
        default:
            return (await import('@/templates/template1/layout/TemplateLayout')).default;
    }
}

export async function importHomePageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/HomePageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/HomePageClient')).default;
        default:
            return (await import('@/templates/template1/pages/HomePageClient')).default;
    }
}

export async function importAboutPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/AboutPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/AboutPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/AboutPageClient')).default;
    }
}

export async function importContactPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/ContactPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/ContactPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/ContactPageClient')).default;
    }
}

export async function importServicesPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/ServicesPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/ServicesPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/ServicesPageClient')).default;
    }
}

export async function importProjectsPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/ProjectsPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/ProjectsPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/ProjectsPageClient')).default;
    }
}

export async function importPartnersPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/PartnersPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/PartnersPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/PartnersPageClient')).default;
    }
}

export async function importVacanciesPageClient(company) {
    switch (getMicrositeTemplateId(company)) {
        case 2:
            return (await import('@/templates/template2/pages/VacanciesPageClient')).default;
        case 3:
            return (await import('@/templates/template3/pages/VacanciesPageClient')).default;
        default:
            return (await import('@/templates/template1/pages/VacanciesPageClient')).default;
    }
}
