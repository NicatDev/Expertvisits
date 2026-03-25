import dynamic from "next/dynamic";

function TemplateLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>
            Loading Template...
        </div>
    );
}

// Layouts wrap all pages in the template (Navbar, Footer, CSS Variables)
const layouts = {
    template1: dynamic(() => import("@/templates/template1/layout/TemplateLayout"), { loading: () => <TemplateLoader /> }),
};

// Home pages for the root portfolio URL (/[username]/)
const homePages = {
    template1: dynamic(() => import("@/templates/template1/pages/Home"), { loading: () => <TemplateLoader /> }),
};

// Articles list pages (/[username]/articles/)
const articlesPages = {
    template1: dynamic(() => import("@/templates/template1/pages/Articles"), { loading: () => <TemplateLoader /> }),
};

// Article Detail pages (/[username]/articles/[slug]/)
const articleDetailPages = {
    template1: dynamic(() => import("@/templates/template1/pages/ArticleDetail"), { loading: () => <TemplateLoader /> }),
};

// Contact pages (/[username]/contact/)
const contactPages = {
    template1: dynamic(() => import("@/templates/template1/pages/Contact"), { loading: () => <TemplateLoader /> }),
};

export function getTemplateLayout(templateName) {
    return layouts[templateName] || layouts['template1'];
}

export function getTemplateHome(templateName) {
    return homePages[templateName] || homePages['template1'];
}

export function getTemplateArticles(templateName) {
    return articlesPages[templateName] || articlesPages['template1'];
}

export function getTemplateArticleDetail(templateName) {
    return articleDetailPages[templateName] || articleDetailPages['template1'];
}

export function getTemplateContact(templateName) {
    return contactPages[templateName] || contactPages['template1'];
}

export const templatesConfig = {
    layouts,
    homePages,
    articlesPages,
    articleDetailPages,
    contactPages
};
