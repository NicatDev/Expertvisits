import json
from pathlib import Path

locales_dir = Path(r'c:\Users\Boss\OneDrive\Desktop\Expert_visits_all\frontend_platform\src\i18n\locales')

translations = {
    'az': {'change': 'Dəyiş'},
    'en': {'change': 'Change'},
    'ru': {'change': 'Изменить'}
}

for lang, data in translations.items():
    file_path = locales_dir / f"{lang}.json"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            
        if 'common' not in content:
            content['common'] = {}
            
        content['common']['change'] = data['change']
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        print(f'Updated common keys in {lang}.json')
