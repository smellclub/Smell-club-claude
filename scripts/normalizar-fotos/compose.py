"""Centra cada recorte en un lienzo blanco 4:5 con el mismo margen."""
import sys, pathlib
from PIL import Image, ImageFilter
SRC = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
W, H = 1000, 1250            # mismo formato que las tarjetas de la tienda
MAX_W, MAX_H = 0.76, 0.78    # espacio máximo que ocupa el producto
for p in sorted(SRC.glob('*.png')):
    prod = Image.open(p).convert('RGB')
    # recorte automático al producto (todo lo que no sea blanco puro)
    inv = Image.eval(prod.convert('L'), lambda v: 255 if v < 250 else 0)
    prod = prod.crop(inv.getbbox())
    s = min(W * MAX_W / prod.width, H * MAX_H / prod.height)
    prod = prod.resize((round(prod.width * s), round(prod.height * s)), Image.LANCZOS)
    if s < 1:  # tras reducir, un toque de nitidez
        prod = prod.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    c = Image.new('RGB', (W, H), 'white')
    c.paste(prod, ((W - prod.width) // 2, (H - prod.height) // 2))
    c.save(OUT / f'{p.stem}.jpg', quality=86, optimize=True, progressive=True)
