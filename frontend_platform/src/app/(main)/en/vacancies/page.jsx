import Page from '../../vacancies/page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangVacanciesPage(props) {
    return (
        <>
            <LanguageSetter lang="en" />
            <Page {...props} />
        </>
    );
}