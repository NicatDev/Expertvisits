import Page from '../page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangHomePage(props) {
    return (
        <>
            <LanguageSetter lang="ru" />
            <Page {...props} />
        </>
    );
}