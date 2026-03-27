import Page, { generateMetadata as mainGenerateMetadata } from '../../../article/[slug]/page';
import LanguageSetter from '@/components/LanguageSetter';

export async function generateMetadata(props) {
    return mainGenerateMetadata(props);
}

export default function LangArticlePage(props) {
    return (
        <>
            <LanguageSetter lang="ru" />
            <Page {...props} />
        </>
    );
}