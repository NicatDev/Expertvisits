const fs = require('fs');
const path = require('path');

const langs = ['en', 'ru'];
const oldBasePath = path.join(__dirname, 'src', 'app');
const basePath = path.join(__dirname, 'src', 'app', '(main)');

// Remove old incorrect root-level en/ru folders if they exist
try { fs.rmSync(path.join(oldBasePath, 'en'), { recursive: true, force: true }); } catch(e){}
try { fs.rmSync(path.join(oldBasePath, 'ru'), { recursive: true, force: true }); } catch(e){}

langs.forEach(lang => {
    // 1. (main)/lang/page.jsx
    fs.mkdirSync(path.join(basePath, lang), { recursive: true });
    fs.writeFileSync(path.join(basePath, lang, 'page.jsx'), 
`import Page from '../page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangHomePage(props) {
    return (
        <>
            <LanguageSetter lang="${lang}" />
            <Page {...props} />
        </>
    );
}`);

    // 2. (main)/lang/article/[slug]/page.jsx
    fs.mkdirSync(path.join(basePath, lang, 'article', '[slug]'), { recursive: true });
    fs.writeFileSync(path.join(basePath, lang, 'article', '[slug]', 'page.jsx'),
`import Page, { generateMetadata as mainGenerateMetadata } from '../../../article/[slug]/page';
import LanguageSetter from '@/components/LanguageSetter';

export async function generateMetadata(props) {
    return mainGenerateMetadata(props);
}

export default function LangArticlePage(props) {
    return (
        <>
            <LanguageSetter lang="${lang}" />
            <Page {...props} />
        </>
    );
}`);

    // 3. (main)/lang/vacancies/page.jsx
    fs.mkdirSync(path.join(basePath, lang, 'vacancies'), { recursive: true });
    fs.writeFileSync(path.join(basePath, lang, 'vacancies', 'page.jsx'),
`import Page from '../../vacancies/page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangVacanciesPage(props) {
    return (
        <>
            <LanguageSetter lang="${lang}" />
            <Page {...props} />
        </>
    );
}`);

});
console.log('Pages generated inside (main) correctly!');
