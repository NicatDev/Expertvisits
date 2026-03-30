import json
from pathlib import Path

locales_dir = Path(r'c:\Users\Boss\OneDrive\Desktop\Expert_visits_all\frontend_platform\src\i18n\locales')

translations = {
    'az': {
        'tabs_projects': 'Layihələr',
        'modal': {
            'add': 'Layihə əlavə et',
            'edit': 'Layihəni yenilə',
            'add_btn': 'Layihə əlavə et',
            'no_projects': 'Hələ layihə yoxdur.',
            'no_image': 'Şəkil yoxdur',
            'read_more': 'Ətraflı bax',
            'title_label': 'Başlıq',
            'description_label': 'Məlumat',
            'date_label': 'Tarix',
            'image_label': 'Şəkil (Opsional)',
            'upload_image': 'Şəkil Yüklə'
        }
    },
    'en': {
        'tabs_projects': 'Projects',
        'modal': {
            'add': 'Add Project',
            'edit': 'Edit Project',
            'add_btn': 'Add Project',
            'no_projects': 'No projects yet.',
            'no_image': 'No Image',
            'read_more': 'Read more',
            'title_label': 'Title',
            'description_label': 'Description',
            'date_label': 'Date',
            'image_label': 'Image (Optional)',
            'upload_image': 'Upload Image'
        }
    },
    'ru': {
        'tabs_projects': 'Проекты',
        'modal': {
            'add': 'Добавить проект',
            'edit': 'Изменить проект',
            'add_btn': 'Добавить проект',
            'no_projects': 'Пока нет проектов.',
            'no_image': 'Без картинки',
            'read_more': 'Подробнее',
            'title_label': 'Название',
            'description_label': 'Описание',
            'date_label': 'Дата',
            'image_label': 'Картинка (необязательно)',
            'upload_image': 'Загрузить картинку'
        }
    }
}

for lang, data in translations.items():
    file_path = locales_dir / f"{lang}.json"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            
        if 'profile' in content and 'tabs' in content['profile']:
            content['profile']['tabs']['projects'] = data['tabs_projects']
            
        if 'public_profile' in content and 'tabs' in content['public_profile']:
            content['public_profile']['tabs']['projects'] = data['tabs_projects']
            
        if 'profile_modals' in content:
            content['profile_modals']['project'] = data['modal']
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=4)
        print(f'Updated {lang}.json')
