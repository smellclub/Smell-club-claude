# Normalizar fotos de producto

Deja cada foto como en el catálogo: solo el frasco, fondo blanco puro,
lienzo 1000×1250 (4:5, igual que las tarjetas) y el producto centrado
ocupando siempre el mismo espacio.

## Pasos

1. `process.py` — recorta la caja si hace falta (`crops.py`), mejora la
   resolución ×4 con Real-ESRGAN, separa el producto del fondo (máscara
   por bordes claros + modelo de IA `isnet-general-use`) y guarda un PNG
   recortado por foto.
2. `compose.py` — centra cada PNG en el lienzo blanco y exporta el JPG final.

```bash
pip install "rembg[cpu]" spandrel scipy pillow
curl -L -o /root/models/RealESRGAN_x4plus.pth \
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
python3 process.py <carpeta-originales> recortes/ [nombre ...]
python3 compose.py recortes/ public/products/
```

Sin placa de video tarda entre 5 y 60 s por foto.

## Retoques manuales ya aplicados

- `victoria`: el borde derecho estaba tapado por la caja; se reconstruyó
  espejando el borde izquierdo.
- `oud-for-glory`: se blanqueó una tira de la caja junto a la tapa.

Para fotos nuevas, lo más fácil es sacarlas ya sobre fondo blanco y sin caja.
