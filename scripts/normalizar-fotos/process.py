"""Normaliza las fotos de producto: frasco solo, fondo blanco puro,
mismo tamaño de lienzo y de producto, y resolución mejorada."""
import sys, time, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import numpy as np, torch, spandrel
from PIL import Image, ImageDraw, ImageFilter
from rembg import new_session, remove
from crops import CROPS
from scipy import ndimage

# Fondos con textura: ahí se usa el modelo de IA para separar el frasco
AI_MASK = {'al-haramain-aqua-dubai'}

SRC = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
names = sys.argv[3:] or sorted(p.stem for p in SRC.iterdir())
torch.set_num_threads(4)
model = spandrel.ModelLoader().load_from_file('/root/models/RealESRGAN_x4plus.pth').eval()
session = new_session('isnet-general-use')

def upscale(im):
    x = torch.from_numpy(np.asarray(im, dtype=np.float32) / 255).permute(2, 0, 1)[None]
    with torch.no_grad():
        y = model(x)
    return Image.fromarray((y[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255).round().astype(np.uint8))

def load(name):
    p = next(SRC.glob(name + '.*'))
    im = Image.open(p)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, 'white'); bg.alpha_composite(im); im = bg
    im = im.convert('RGB')
    c = CROPS.get(name)
    if c:
        d = ImageDraw.Draw(im)
        for r in c.get('white', []):
            l, t, rr, b = r; ox, oy = c['crop'][0], c['crop'][1]
            d.rectangle((l, t, rr, b), fill='white')
        l, t, r, b = c['crop']; im = im.crop((l, t, r or im.width, b or im.height))
    return im

def ai_mask(im):
    return np.asarray(remove(im, session=session, only_mask=True), dtype=np.float32) / 255

def light_bg_mask(im):
    # Fondo = zonas claras y sin color conectadas con el borde de la foto.
    x = np.asarray(im, dtype=np.int16)
    light = (x.min(axis=2) > 205) & ((x.max(axis=2) - x.min(axis=2)) < 22)
    lab, _ = ndimage.label(light)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    fg = ndimage.binary_fill_holes(~bg)
    return ndimage.gaussian_filter(fg.astype(np.float32), 1.2)

def clean(a):
    # Saca manchitas sueltas: se quedan solo las piezas grandes del producto.
    lab, n = ndimage.label(a > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.flatnonzero(sizes >= sizes.max() * 0.02))
        a = a * ndimage.binary_dilation(keep, iterations=3)
    return a

for name in names:
    if (OUT / f'{name}.png').exists(): continue
    t0 = time.time()
    im = load(name)
    # Real-ESRGAN x4 y después se ajusta al tamaño final (la red también limpia artefactos JPEG)
    big = upscale(im) if max(im.size) < 900 else im
    # La IA a veces borra frascos oscuros y el método de bordes borra frascos
    # blancos: la unión de las dos máscaras conserva el producto entero.
    a = ai_mask(big) if name in AI_MASK else np.maximum(light_bg_mask(big), ai_mask(big))
    a = clean(a)
    # recorte al producto
    ys, xs = np.where(a > 0.1)
    l, r, t, b = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb = np.asarray(big, dtype=np.float32)[t:b, l:r]; a = a[t:b, l:r, None]
    comp = rgb * a + 255 * (1 - a)
    # blancos casi puros -> blanco puro (elimina halos grises del fondo)
    lum = comp.min(axis=2, keepdims=True)
    comp = np.where(lum > 246, 255, comp)
    prod = Image.fromarray(comp.clip(0, 255).astype(np.uint8))
    prod.save(OUT / f'{name}.png')
    print(f'{name}: {im.size} -> {prod.size} en {time.time()-t0:.1f}s', flush=True)
