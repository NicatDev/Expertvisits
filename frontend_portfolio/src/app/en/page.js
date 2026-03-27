import LandingPage from '../../components/LandingPage';

export const metadata = {
    title: 'Create Your Free Personal Website | Expert Visits',
    description: 'Register on the Expert Visits platform, fill in your details, and create your unique, professional website with just 1 click!',
    openGraph: {
        title: 'Create Your Free Personal Website | Expert Visits',
        description: 'Register on the Expert Visits platform, fill in your details, and create your unique, professional website with just 1 click!',
        url: 'https://expertvisits.com/en',
        images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Expert Visits Portfolio' }],
        locale: 'en_US',
        type: 'website',
    },
};

export default function EnglishHomePage() {
    const translations = {
        heroTitle: 'Get Your Free Website in 1 Click',
        heroSubtitle: 'Build your Expert Visits profile and activate your personal portfolio site in seconds to showcase your skills and work to the world.',
        ctaBtn: 'Register Now',
        guideTitle: 'Create Your Website in 3 Simple Steps',
        step1Title: 'Create a Profile',
        step1Desc: 'Register on the Expert Visits platform and easily enter your professional information into the system.',
        step2Title: 'Fill in Details',
        step2Desc: 'Add your biography, the services you offer, your work experience, and skills to your profile.',
        step3Title: 'Activate Your Site',
        step3Desc: 'Click the "Create your website" button, choose your favorite template, and your digital identity is ready!',
        templatesTitle: 'Choose Your Desired Template',
        templatesDesc: 'Amaze your visitors by choosing the template that best suits you from various professional architectures and designs.',
        ctaBtnAlt: 'Get Your Website'
    };

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang = "en";` }} suppressHydrationWarning />
            <LandingPage t={translations} />
        </>
    );
}
