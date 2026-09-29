/**
 * ============================================================
 *  HERO 3D · MODELO DEL FRASCO (Liquid Brun)
 * ============================================================
 *  1. Coloca el archivo del modelo en:  public/models/liquid-brun.glb
 *  2. Sube el cambio a GitHub. La web lo detecta sola al compilar y
 *     sustituye el frasco provisional (placeholder) por el modelo real.
 *
 *  Formatos admitidos: .glb (recomendado) o .gltf. Se admiten modelos
 *  comprimidos con Draco o Meshopt. Tamaño recomendado: menos de 3 MB.
 *
 *  Los ajustes de abajo solo hacen falta si el modelo viene girado o
 *  descentrado; normalmente no hay que tocarlos.
 * ============================================================
 */
export const heroModel = {
  /** Ruta pública del archivo (dentro de /public) */
  path: "/models/liquid-brun.glb",
  /** Nombre del producto (texto alternativo / accesibilidad) */
  name: "Liquid Brun",
  /** Giro inicial en grados por si el frente del modelo no mira a la cámara */
  initialRotationYDeg: 0,
  /** Corrección si el modelo viene tumbado (grados en X) */
  uprightRotationXDeg: 0,
  /** Segundos por vuelta completa (360°) */
  secondsPerTurn: 10,
  /** Amplitud de la flotación vertical en píxeles de pantalla */
  floatPx: 5,
  /** Segundos por ciclo de flotación (subir y bajar) */
  floatSeconds: 6,
} as const;
