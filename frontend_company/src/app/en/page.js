import LandingPage from '../../components/LandingPage';

export const metadata = {
    title: 'Company website | Expert Visits',
    description: 'Professional company websites on Expert Visits (structure bootstrap).',
    alternates: {
        canonical: 'https://expertvisits.com/c/en',
    },
    openGraph: {
        title: 'Company website | Expert Visits',
        description: 'Professional company websites on Expert Visits (structure bootstrap).',
        url: 'https://expertvisits.com/c/en',
        images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Expert Visits Company' }],
        locale: 'en_US',
        type: 'website',
    },
};

export default function EnglishHomePage() {
    const translations = {
        heroTitle: 'Websites for your company',
        heroSubtitle: 'Marketing landing structure; company templates will be wired in next steps.',
        ctaBtn: 'Register Now',
        guideTitle: 'Three steps',
        step1Title: 'Company profile',
        step1Desc: 'Enter your company details on the platform.',
        step2Title: 'Content',
        step2Desc: 'Fill services, projects, and contact sections.',
        step3Title: 'Template',
        step3Desc: 'Pick a company template and publish under /c/[slug].',
        templatesTitle: 'Templates',
        templatesDesc: 'The template library will grow from templates/template1 in this app.',
        ctaBtnAlt: 'Go to Expert Visits'
    };

    return <LandingPage t={translations} />;
}
