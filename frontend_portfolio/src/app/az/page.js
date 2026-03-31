import LandingPage from '../components/LandingPage';

export const metadata = {
    title: 'Ödənişsiz Şəxsi Vebsayt Yarat | Expert Visits',
    description: 'Expert Visits platformasında qeydiyyatdan keçin, məlumatlarınızı doldurun və 1 kliklə öz unikal və peşəkar vebsaytınızı yaradın!',
    alternates: {
        canonical: 'https://expertvisits.com/u',
    },
    openGraph: {
        title: 'Ödənişsiz Şəxsi Vebsayt Yarat | Expert Visits',
        description: 'Expert Visits platformasında qeydiyyatdan keçin, məlumatlarınızı doldurun və 1 kliklə öz unikal və peşəkar vebsaytınızı yaradın!',
        url: 'https://expertvisits.com/u',
        images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Expert Visits Portfolio' }],
        locale: 'az_AZ',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Ödənişsiz Şəxsi Vebsayt Yarat | Expert Visits',
        description: 'Expert Visits platformasında qeydiyyatdan keçin, məlumatlarınızı doldurun və 1 kliklə öz unikal və peşəkar vebsaytınızı yaradın!',
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
        heroTitle: 'Cəmi 1 klikə Ödənişsiz Vebsaytın Olsun',
        heroSubtitle: 'Expert Visits profilinizi qurun, öz işlərinizi və bacarıqlarınızı bütün dünyaya nümayiş etdirmək üçün şəxsi portfel saytınızı saniyələr içində aktivləşdirin.',
        ctaBtn: 'İndi Qeydiyyatdan Keç',
        guideTitle: '3 Sadə Addımla Vebsaytını Yarat',
        step1Title: 'Profil Yarat',
        step1Desc: 'Expert Visits platformasında qeydiyyatdan keçin və asanlıqla öz peşəkar məlumatlarınızı sistemə daxil edin.',
        step2Title: 'Məlumatları Doldur',
        step2Desc: 'Bioqrafiyanızı, təklif etdiyiniz xidmətləri, iş təcrübənizi və bacarıqlarınızı profilinizə əlavə edin.',
        step3Title: 'Saytını Aktivləşdir',
        step3Desc: '"Öz vebsaytını yarat" düyməsinə klikləyin, sevdiyiniz şablonu seçin və rəqəmsal şəxsiyyətiniz tam hazırdır!',
        templatesTitle: 'İstədiyiniz Şablonu Seçin',
        templatesDesc: 'Müxtəlif peşəkar arxitektura və dizaynlar arasından özünüzə ən uyğun olanı seçib, ziyarətçilərinizi heyran edin.',
        ctaBtnAlt: 'Saytını Əldə Et'
    };

    return <LandingPage t={translations} />;
}
