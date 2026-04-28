import os
from PIL import Image

base_path = os.path.dirname(os.path.abspath(__file__))
icon_png = os.path.join(base_path, 'icon.png')

SIZES = [16, 32, 48, 64, 96, 128, 256, 512]

png_path = os.path.join(base_path, icon_png)

try:
    with Image.open(png_path) as img:
        img = img.convert('RGBA')
        img.save(
            os.path.join(base_path, 'favicon.ico'),
            format='ICO',
            sizes=[(48, 48)]
        )

        for size in SIZES:
            resized = img.resize((size, size), Image.LANCZOS)
            out_name = f'favicon-{size}x{size}.png'
            resized.save(
                os.path.join(base_path, out_name),
                format='PNG'
            )

except Exception as e:
    print(f'Error with {filename}: {e}')