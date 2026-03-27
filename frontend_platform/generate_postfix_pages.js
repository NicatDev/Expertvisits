const fs = require('fs');
const path = require('path');

const langs = ['en', 'ru'];
const basePath = path.join(__dirname, 'src', 'app', '(main)');

['experts', 'vacancies'].forEach(folder => {
    langs.forEach(lang => {
        const destDir = path.join(basePath, folder, lang);
        fs.mkdirSync(destDir, { recursive: true });
        
        fs.writeFileSync(path.join(destDir, 'page.jsx'), 
`import Page from '../page';
import LanguageSetter from '@/components/LanguageSetter';

export default function LangPage(props) {
    return (
        <>
            <LanguageSetter lang="${lang}" />
            <Page {...props} />
        </>
    );
}`);
    });
});

console.log('Experts and Vacancies language pages generated successfully!');
