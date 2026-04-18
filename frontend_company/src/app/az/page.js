import LandingPage from '../../components/LandingPage';

export const metadata = {
    title: 'Şirkət vebsaytı | Expert Visits',
    description: 'Expert Visits ilə şirkətiniz üçün peşəkar vebsayt (struktur hazırlığı).',
    alternates: {
        canonical: 'https://expertvisits.com/c/az',
    },
    openGraph: {
        title: 'Şirkət vebsaytı | Expert Visits',
        description: 'Expert Visits ilə şirkətiniz üçün peşəkar vebsayt (struktur hazırlığı).',
        url: 'https://expertvisits.com/c/az',
        images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Expert Visits Company' }],
        locale: 'az_AZ',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Şirkət vebsaytı | Expert Visits',
        description: 'Expert Visits ilə şirkətiniz üçün peşəkar vebsayt (struktur hazırlığı).',
        images: ['/logo.png'],
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/logo.png', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/logo.png',
    }
};

export default function HomePage() {
    const translations = {
        heroTitle: 'Şirkətiniz üçün vebsayt',
        heroSubtitle: 'Bu səhifə marketing landing strukturudur; şirkət şablonları sonrakı addımlarda qoşulacaq.',
        ctaBtn: 'İndi Qeydiyyatdan Keç',
        guideTitle: '3 addım',
        step1Title: 'Şirkət profili',
        step1Desc: 'Platformada şirkət məlumatlarınızı daxil edin.',
        step2Title: 'Məzmun',
        step2Desc: 'Xidmətlər, layihələr və əlaqə bölmələrini doldurun.',
        step3Title: 'Şablon',
        step3Desc: 'Şirkət şablonunu seçin və /c/[slug] ünvanında dərc edin.',
        templatesTitle: 'Şablonlar',
        templatesDesc: 'Şablon kitabxanası bu layihədə templates/template1 ilə genişlənəcək.',
        ctaBtnAlt: 'Expert Visits-ə keç'
    };

    return <LandingPage t={translations} />;
}
