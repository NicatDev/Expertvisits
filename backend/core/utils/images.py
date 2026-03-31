from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

def compress_image(image_field, format='WEBP', quality=80, max_size=(1000, 1000)):
    """
    Compresses and optionally resizes the image field.
    """
    if not image_field or not hasattr(image_field, 'file') or not image_field.file:
        return

    try:
        img = Image.open(image_field)
        
        # Resize if image is too large
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
        # Save parameters
        save_params = {'optimize': True}
        
        if format.upper() == 'WEBP':
            save_params['quality'] = quality
            if img.mode not in ('RGB', 'RGBA', 'P'):
                img = img.convert('RGB')
        elif format.upper() == 'PNG':
            # PNG is lossless, so no 'quality' parameter. 
            # We ensure it's in a mode that PNG supports well.
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
        
        # Deep cleaning of extensions (e.g. image.webp.png -> image)
        clean_name = name_only
        while True:
            temp_name, ext = os.path.splitext(clean_name)
            if ext.lower() in ['.webp', '.png', '.jpg', '.jpeg', '.svg']:
                clean_name = temp_name
            else:
                break
            
        new_name = f"{clean_name}.{format.lower()}"
        
        # Directly update the field
        image_field.save(new_name, ContentFile(output.read()), save=False)
        
    except Exception as e:
        print(f"Error compressing image: {e}")

def create_compressed_avatar(avatar_field, size=(300, 300), format='PNG'):
    """
    Creates and returns a compressed version of the avatar as a ContentFile.
    """
    if not avatar_field or not hasattr(avatar_field, 'file') or not avatar_field.file:
        return None

    try:
        # Re-open the image to ensure we're at the beginning
        avatar_field.seek(0)
        img = Image.open(avatar_field)
        
        # Convert to RGBA for PNG if transparency exists, otherwise RGB
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
            
        # Resize using thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        output = BytesIO()
        img.save(output, format=format.upper(), optimize=True)
        output.seek(0)
        
        orig_name = os.path.basename(avatar_field.name)
        name_only = os.path.splitext(orig_name)[0]
        
        # Deep cleaning of extensions
        clean_name = name_only
        while True:
            temp_name, ext = os.path.splitext(clean_name)
            if ext.lower() in ['.webp', '.png', '.jpg', '.jpeg']:
                clean_name = temp_name
            else:
                break
                
        new_name = f"{clean_name}_compressed.{format.lower()}"
        
        return ContentFile(output.read(), name=new_name)
    except Exception as e:
        print(f"Error creating compressed avatar: {e}")
        return None
