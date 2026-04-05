import { mergeSectionVisibility } from './sectionVisibility';

/**
 * @param {object} user — API payload (template_id, user, articles_count, section_visibility, …)
 * @param {function} t — i18n t()
 * @returns {{ label: string, path: string }[]}
 */
export function buildPortfolioNavLinks(user, t) {
    const v = mergeSectionVisibility(user?.section_visibility);
    const un = user?.user?.username || '';
    if (!un) return [];

    const links = [{ label: t('nav.home', { defaultValue: 'Home' }), path: `/${un}` }];

    if (v.services_page) {
        links.push({ label: t('portfolio.navServices'), path: `/${un}/services` });
    }
    if (v.projects_page) {
        links.push({ label: t('portfolio.navProjects'), path: `/${un}/projects` });
    }
    if ((user?.articles_count >= 3) && v.articles_page) {
        links.push({
            label: t('portfolio.myWritings', { defaultValue: 'Articles' }),
            path: `/${un}/articles`,
        });
    }
    links.push({ label: t('nav.contact', { defaultValue: 'Contact' }), path: `/${un}/contact` });
    return links;
}
