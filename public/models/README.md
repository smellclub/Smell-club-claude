# Modelo 3D del hero

Coloca aquí el modelo real del frasco con este nombre exacto:

    public/models/liquid-brun.glb

- Mientras este archivo NO exista, la portada muestra un frasco provisional
  genérico (placeholder, sin marca).
- En cuanto el archivo exista y se publique la web, se usa automáticamente.
- Formato: .glb (glTF binario). Se admite compresión Draco o Meshopt.
- Tamaño recomendado: menos de 3 MB (texturas de 1024–2048 px).
- El modelo se centra, se escala y se apoya en el suelo solo. Si aparece
  girado o tumbado, ajusta `initialRotationYDeg` / `uprightRotationXDeg`
  en `src/config/hero-model.ts`.
