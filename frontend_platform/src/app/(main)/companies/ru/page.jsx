import Page from '../page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangPage(props) {
    return (
        <>
            <LanguageSetter lang="ru" />
            <Page {...props} />
        </>
    );
}
