from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

def compress_image(image_field):
    """
    Compresses the image field to WebP format.
    """
    if not image_field:
        return

    # Check if image is already opened or modified
    if hasattr(image_field, 'file') and image_field.file:
        try:
            img = Image.open(image_field)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
                
            # Save to BytesIO
            output = BytesIO()
            img.save(output, format='WEBP', quality=80, optimize=True)
            output.seek(0)
            
            # Change extension to .webp
            new_name = os.path.splitext(image_field.name)[0] + '.webp'
            
            # Update the field
            image_field.save(new_name, ContentFile(output.read()), save=False)
        except Exception as e:
            print(f"Error compressing image: {e}")
