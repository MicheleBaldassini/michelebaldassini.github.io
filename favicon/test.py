import os
from PIL import Image

# cartella con i PNG (cartella dello script)
base_path = os.path.dirname(os.path.abspath(__file__))

SIZES = [48, 96, 16, 32, 512]

for filename in os.listdir(base_path):
    if filename.lower().endswith(".png"):
        png_path = os.path.join(base_path, filename)

        try:
            with Image.open(png_path) as img:
                img = img.convert("RGBA")

                # 🔹 crea i favicon PNG ridimensionati
                for size in SIZES:
                    resized = img.resize((size, size), Image.LANCZOS)
                    out_name = f"favicon-{size}x{size}.png"
                    resized.save(
                        os.path.join(base_path, out_name),
                        format="PNG"
                    )

        except Exception as e:
            print(f"Errore con {filename}: {e}")

# 🔹 crea la ICO solo da icon.png
icon_png = os.path.join(base_path, "icon.png")

if os.path.exists(icon_png):
    try:
        with Image.open(icon_png) as img:
            img = img.convert("RGBA")
            img.save(
                os.path.join(base_path, "favicon.ico"),
                format="ICO",
                sizes=[(48,48)]
            )
            print("✔ icon.ico creata")
    except Exception as e:
        print(f"Errore con icon.png: {e}")
else:
    print("⚠ icon.png non trovata")
