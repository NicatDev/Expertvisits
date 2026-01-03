from django.utils.text import slugify

def custom_slugify(value):
    """
    Transliterates Azerbaijani characters to English equivalents before slugifying.
    """
    replacements = {
        'ə': 'e', 'Ə': 'E',
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U',
        'ı': 'i', 'I': 'I',
    }
    for k, v in replacements.items():
        value = value.replace(k, v)
    return slugify(value)
