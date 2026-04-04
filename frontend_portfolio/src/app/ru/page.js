import LandingPage from '../../components/LandingPage';

export const metadata = {
    title: 'Создайте Свой Бесплатный Личный Сайт | Expert Visits',
    description: 'Зарегистрируйтесь на платформе Expert Visits, заполните свои данные и создайте свой уникальный профессиональный веб-сайт всего в 1 клик!',
    alternates: {
        canonical: 'https://expertvisits.com/u/ru',
    },
    openGraph: {
        title: 'Создайте Свой Бесплатный Личный Сайт | Expert Visits',
        description: 'Зарегистрируйтесь на платформе Expert Visits, заполните свои данные и создайте свой уникальный профессиональный веб-сайт всего в 1 клик!',
        url: 'https://expertvisits.com/u/ru',
        images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Expert Visits Portfolio' }],
        locale: 'ru_RU',
        type: 'website',
    },
};

export default function RussianHomePage() {
    const translations = {
        heroTitle: 'Получите Бесплатный Сайт в 1 Клик',
        heroSubtitle: 'Создайте свой профиль Expert Visits и активируйте личный сайт-портфолио за секунды, чтобы продемонстрировать свои навыки и работу всему миру.',
        ctaBtn: 'Зарегистрироваться',
        guideTitle: 'Создайте Свой Веб-сайт за 3 Простых Шага',
        step1Title: 'Создайте Профиль',
        step1Desc: 'Зарегистрируйтесь на платформе Expert Visits и легко внесите свою профессиональную информацию в систему.',
        step2Title: 'Заполните Данные',
        step2Desc: 'Добавьте в свой профиль биографию, предлагаемые услуги, опыт работы и навыки.',
        step3Title: 'Активируйте Сайт',
        step3Desc: 'Нажмите кнопку «Создать свой сайт», выберите понравившийся шаблон, и ваша цифровая личность готова!',
        templatesTitle: 'Выберите Желаемый Шаблон',
        templatesDesc: 'Поразите своих посетителей, выбрав наиболее подходящий вам шаблон из множества профессиональных архитектур и дизайнов.',
        ctaBtnAlt: 'Получить Сайт'
    };

    return <LandingPage t={translations} />;
}
