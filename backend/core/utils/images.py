from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

def compress_image(image_field, format='WEBP', quality=80):
    """
    Compresses the image field to specified format (default WebP).
    """
    if not image_field or not hasattr(image_field, 'file') or not image_field.file:
        return

    try:
        img = Image.open(image_field)
        
        # Save parameters
        save_params = {'optimize': True}
        
        if format.upper() == 'WEBP':
            save_params['quality'] = quality
            if img.mode in ('RGBA', 'P'):
                # WebP supports transparency
                pass
            else:
                img = img.convert('RGB')
        elif format.upper() == 'PNG':
            # PNG supports full transparency, no conversion needed usually
            # But let's ensure it's not some weird mode
            if img.mode not in ('RGB', 'RGBA', 'L', 'P'):
                img = img.convert('RGBA')
        else:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
        
        # Save to BytesIO
        output = BytesIO()
        img.save(output, format=format.upper(), **save_params)
        output.seek(0)
        
        # Extension handling
        orig_name = os.path.basename(image_field.name)
        name_only = os.path.splitext(orig_name)[0]
        
        # Remove any existing wrong extensions if it was double-processed
        if name_only.lower().endswith('.webp') or name_only.lower().endswith('.png') or name_only.lower().endswith('.jpg') or name_only.lower().endswith('.jpeg'):
            name_only = os.path.splitext(name_only)[0]
            
        new_name = f"{name_only}.{format.lower()}"
        
        # Directly update the name and the content
        image_field.save(new_name, ContentFile(output.read()), save=False)
        
    except Exception as e:
        print(f"Error compressing image: {e}")
