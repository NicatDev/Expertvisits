import dynamic from "next/dynamic";
import { useTranslation } from "@/i18n/client";

function TemplateLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666', background: '#0a0a0a' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '1px' }}>
                LOADING...
            </div>
        </div>
    );
}

// Layouts wrap all pages in the template (Navbar, Footer, CSS Variables)
const layouts = {
    1: dynamic(() => import("@/templates/template1/layout/TemplateLayout"), { loading: () => <TemplateLoader /> }),
    2: dynamic(() => import("@/templates/template2/layout/TemplateLayout"), { loading: () => <TemplateLoader /> }),
    3: dynamic(() => import("@/templates/template3/layout/TemplateLayout"), { loading: () => <TemplateLoader /> }),
    4: dynamic(() => import("@/templates/template4/layout/TemplateLayout"), { loading: () => <TemplateLoader /> }),
};

// Home pages for the root portfolio URL (/[username]/)
const homePages = {
    1: dynamic(() => import("@/templates/template1/pages/Home"), { loading: () => <TemplateLoader /> }),
    2: dynamic(() => import("@/templates/template2/pages/Home"), { loading: () => <TemplateLoader /> }),
    3: dynamic(() => import("@/templates/template3/pages/Home"), { loading: () => <TemplateLoader /> }),
    4: dynamic(() => import("@/templates/template4/pages/Home"), { loading: () => <TemplateLoader /> }),
};

// Articles list pages (/[username]/articles/)
const articlesPages = {
    1: dynamic(() => import("@/templates/template1/pages/Articles"), { loading: () => <TemplateLoader /> }),
    2: dynamic(() => import("@/templates/template2/pages/Articles"), { loading: () => <TemplateLoader /> }),
    3: dynamic(() => import("@/templates/template3/pages/Articles"), { loading: () => <TemplateLoader /> }),
    4: dynamic(() => import("@/templates/template4/pages/Articles"), { loading: () => <TemplateLoader /> }),
};

// Article Detail pages (/[username]/articles/[slug]/)
const articleDetailPages = {
    1: dynamic(() => import("@/templates/template1/pages/ArticleDetail"), { loading: () => <TemplateLoader /> }),
    2: dynamic(() => import("@/templates/template2/pages/ArticleDetail"), { loading: () => <TemplateLoader /> }),
    3: dynamic(() => import("@/templates/template3/pages/ArticleDetail"), { loading: () => <TemplateLoader /> }),
    4: dynamic(() => import("@/templates/template4/pages/ArticleDetail"), { loading: () => <TemplateLoader /> }),
};

// Contact pages (/[username]/contact/)
const contactPages = {
    1: dynamic(() => import("@/templates/template1/pages/Contact"), { loading: () => <TemplateLoader /> }),
    2: dynamic(() => import("@/templates/template2/pages/Contact"), { loading: () => <TemplateLoader /> }),
    3: dynamic(() => import("@/templates/template3/pages/Contact"), { loading: () => <TemplateLoader /> }),
    4: dynamic(() => import("@/templates/template4/pages/Contact"), { loading: () => <TemplateLoader /> }),
};

export function getTemplateLayout(templateName) {
    return layouts[templateName] || layouts[1];
}

export function getTemplateHome(templateName) {
    return homePages[templateName] || homePages[1];
}

export function getTemplateArticles(templateName) {
    return articlesPages[templateName] || articlesPages[1];
}

export function getTemplateArticleDetail(templateName) {
    return articleDetailPages[templateName] || articleDetailPages[1];
}

export function getTemplateContact(templateName) {
    return contactPages[templateName] || contactPages[1];
}

export const templatesConfig = {
    layouts,
    homePages,
    articlesPages,
    articleDetailPages,
    contactPages
};
