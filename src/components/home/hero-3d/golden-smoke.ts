import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/**
 * "Humo dorado": vapor translúcido generado por shader (ruido fractal con
 * deformación de dominio) que dibuja hebras finas como el humo real.
 *
 *  - Columna (plume): sube y se abre en espiral junto al título.
 *  - Estela (trail): cruza la pantalla pasando por la columna.
 *  - Destellos: pocas motas doradas que suben dentro del humo.
 *
 * Cada capa es una tira plana que sigue una curva; la escena fija los
 * recorridos con setLayout() en coordenadas de mundo (fuera de los textos).
 */

const NOISE = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
// Ruido suave (formas grandes del humo)
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) { s += a * snoise(p); p = ROT * p; a *= 0.45; }
  return s;
}
// Turbulencia fina (solo rompe el velo, muy tenue)
float detail(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < DETAIL_OCTAVES; i++) { s += a * snoise(p); p = ROT * p; a *= 0.5; }
  return s;
}
`;

const VERT = /* glsl */ `
attribute vec2 aRib;
varying vec2 vRib;
void main() {
  vRib = aRib;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uAspect;   // largo de la tira / ancho de referencia
uniform float uOpacity;
uniform float uSpeed;    // velocidad del flujo a lo largo de la tira
uniform float uSeed;
uniform float uSpread;   // ancho relativo del humo dentro de la tira
uniform float uSway;     // cuánto serpentea
uniform float uFadeIn;
uniform float uFadeOut;
uniform vec3 uColorA;    // champán oscuro
uniform vec3 uColorB;    // marfil cálido
varying vec2 vRib;
${NOISE}
void main() {
  float u = vRib.x;
  float v = vRib.y - 0.5;
  float t = uTime;
  // Coordenadas estiradas a lo largo del flujo: hebras largas y sedosas
  vec2 q = vec2(u * uAspect * 0.6 - t * uSpeed, v * 2.0) + uSeed;
  vec2 w = vec2(fbm(q * 0.8 + vec2(0.0, t * 0.03)), fbm(q * 0.8 + vec2(4.3, 1.7) - t * 0.025));
  float n = fbm(q * 1.2 + w * 1.4);
  // Hebras: línea fina y suave con un halo alrededor (sin derivadas por
  // píxel, que generan escalones en algunos móviles)
  float an = abs(n);
  float ridge = (1.0 - smoothstep(0.0, 0.055, an)) * 0.5 + exp(-an * 9.0) * 0.5;
  float an2 = abs(n - 0.32);
  float ridge2 = (1.0 - smoothstep(0.0, 0.04, an2)) * 0.45 + exp(-an2 * 12.0) * 0.55;
  float soft = smoothstep(-0.35, 0.85, n) * (0.75 + 0.25 * detail(q * 3.5 + w * 2.0));
  float sway = uSway * (0.6 * sin(u * uAspect * 0.9 - t * 0.22 + uSeed) + 0.4 * sin(u * uAspect * 2.3 + t * 0.15)) + w.x * 0.12;
  float dv = (v - sway) / uSpread;
  float mask = exp(-dv * dv * 4.0);
  float ends = smoothstep(0.0, uFadeIn, u) * smoothstep(1.0, 1.0 - uFadeOut, u);
  float dens = (ridge * 0.75 + ridge2 * 0.28 + soft * 0.3) * mask * ends;
  vec3 col = mix(uColorA, uColorB, clamp((ridge + ridge2 * 0.5) * mask * 1.2, 0.0, 1.0));
  float a = clamp(dens * uOpacity, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const SPARK_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSize;
uniform float uTime;
uniform float uPixelRatio;
varying float vA;
void main() {
  float tw = 0.5 + 0.5 * sin(uTime * (0.5 + aPhase * 0.4) + aPhase * 6.2832);
  vA = tw * tw;
  gl_PointSize = aSize * uPixelRatio * (0.6 + 0.4 * tw);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SPARK_FRAG = /* glsl */ `
uniform float uOpacity;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a * vA * uOpacity;
  gl_FragColor = vec4(vec3(1.0, 0.9, 0.72) * a, a);
  #include <colorspace_fragment>
}
`;

type Layer = {
  segments: number;
  opacity: number;
  speed: number;
  seed: number;
  spread: number;
  sway: number;
  fadeIn: number;
  fadeOut: number;
};

const PLUME: Layer = { segments: 140, opacity: 0.95, speed: 0.1, seed: 0, spread: 0.34, sway: 0.14, fadeIn: 0.2, fadeOut: 0.32 };
const PLUME_BACK: Layer = { segments: 140, opacity: 0.45, speed: 0.07, seed: 17.3, spread: 0.44, sway: 0.18, fadeIn: 0.25, fadeOut: 0.35 };
const TRAIL: Layer = { segments: 260, opacity: 0.8, speed: 0.09, seed: 41.7, spread: 0.32, sway: 0.16, fadeIn: 0.04, fadeOut: 0.04 };

const ACROSS = 24;

export type SmokeLayout = {
  plume: THREE_NS.Vector3[]; // de abajo hacia arriba
  plumeWidth: [number, number]; // ancho abajo / arriba (mundo)
  trail: THREE_NS.Vector3[];
  trailWidth: number;
  worldPerPx: number;
};

export function createGoldenSmoke(THREE: Three, opts: { lowPower: boolean }) {
  const group = new THREE.Group();
  group.name = "golden-smoke";
  const detailOctaves = opts.lowPower ? 1 : 2;
  const disposables: Array<{ dispose(): void }> = [];

  const makeStrip = (layer: Layer, order: number) => {
    // Subdividida también a lo ancho: en una tira que se ensancha, dos
    // vértices por fila deforman las coordenadas y el humo se ve en zigzag
    const rows = layer.segments + 1;
    const cols = ACROSS + 1;
    const pos = new Float32Array(rows * cols * 3);
    const rib = new Float32Array(rows * cols * 2);
    const index: number[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const k = i * cols + j;
        rib[k * 2] = i / layer.segments;
        rib[k * 2 + 1] = j / ACROSS;
        if (i < layer.segments && j < ACROSS) index.push(k, k + cols, k + 1, k + 1, k + cols, k + cols + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRib", new THREE.BufferAttribute(rib, 2));
    geo.setIndex(index);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      defines: { DETAIL_OCTAVES: detailOctaves },
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uOpacity: { value: layer.opacity },
        uSpeed: { value: layer.speed },
        uSeed: { value: layer.seed },
        uSpread: { value: layer.spread },
        uSway: { value: layer.sway },
        uFadeIn: { value: layer.fadeIn },
        uFadeOut: { value: layer.fadeOut },
        uColorA: { value: new THREE.Color(0x7a5a32) },
        uColorB: { value: new THREE.Color(0xf6ead2) },
      },
      transparent: true,
      premultipliedAlpha: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    mesh.visible = false;
    group.add(mesh);
    disposables.push(geo, mat);
    return { layer, geo, pos, mat, mesh };
  };

  const trail = makeStrip(TRAIL, 1);
  const plumeBack = makeStrip(PLUME_BACK, 2);
  const plume = makeStrip(PLUME, 3);
  const strips = [trail, plumeBack, plume];

  // Muestreo por longitud de arco de una curva suave
  const sampleCurve = (points: THREE_NS.Vector3[], n: number) =>
    new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5).getSpacedPoints(n);

  const plumePts: THREE_NS.Vector3[] = [];
  let plumeW: [number, number] = [0, 0];
  const plumeWidthAt = (u: number) => plumeW[0] + (plumeW[1] - plumeW[0]) * Math.pow(u, 1.15);

  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);

  const fillStrip = (
    strip: ReturnType<typeof makeStrip>,
    points: THREE_NS.Vector3[],
    widthAt: (u: number) => number,
    refWidth: number,
  ) => {
    const n = strip.layer.segments;
    const pts = sampleCurve(points, n);
    let len = 0;
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(i - 1, 0)];
      const b = pts[Math.min(i + 1, n)];
      tangent.subVectors(b, a).normalize();
      normal.crossVectors(zAxis, tangent).normalize();
      const w = widthAt(i / n);
      const p = pts[i];
      for (let j = 0; j <= ACROSS; j++) {
        const f = (j / ACROSS - 0.5) * w;
        const k = (i * (ACROSS + 1) + j) * 3;
        strip.pos[k] = p.x + normal.x * f;
        strip.pos[k + 1] = p.y + normal.y * f;
        strip.pos[k + 2] = 0;
      }
      if (i > 0) len += p.distanceTo(pts[i - 1]);
    }
    (strip.geo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true;
    strip.mat.uniforms.uAspect.value = len / refWidth;
    strip.mesh.visible = true;
  };

  // ---------- Destellos ----------
  const SPARKS = opts.lowPower ? 22 : 38;
  const sparkSeeds = Array.from({ length: SPARKS }, () => ({
    u: Math.random(),
    v: (Math.random() - 0.5) * 0.5,
    speed: 0.012 + Math.random() * 0.02,
    wobble: Math.random() * Math.PI * 2,
  }));
  const sPos = new Float32Array(SPARKS * 3);
  const sPhase = new Float32Array(SPARKS);
  const sSize = new Float32Array(SPARKS);
  for (let i = 0; i < SPARKS; i++) {
    sPhase[i] = Math.random();
    sSize[i] = 1.6 + Math.random() * 2.4;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1));
  sGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
  const sMat = new THREE.ShaderMaterial({
    vertexShader: SPARK_VERT,
    fragmentShader: SPARK_FRAG,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0.85 } },
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const sparks = new THREE.Points(sGeo, sMat);
  sparks.frustumCulled = false;
  sparks.renderOrder = 4;
  sparks.visible = false;
  group.add(sparks);
  disposables.push(sGeo, sMat);

  const setLayout = (l: SmokeLayout) => {
    plumeW = l.plumeWidth;
    const plumeRef = (l.plumeWidth[0] + l.plumeWidth[1]) / 2;
    fillStrip(plume, l.plume, plumeWidthAt, plumeRef);
    fillStrip(plumeBack, l.plume, (u) => plumeWidthAt(u) * 1.25, plumeRef * 1.25);
    fillStrip(trail, l.trail, (u) => l.trailWidth * (0.7 + 0.3 * Math.sin(Math.PI * u)), l.trailWidth);
    plumePts.length = 0;
    plumePts.push(...sampleCurve(l.plume, 200));
    sparks.visible = true;
  };

  const setPixelRatio = (r: number) => {
    sMat.uniforms.uPixelRatio.value = r;
  };

  const tmp = new THREE.Vector3();
  const update = (time: number) => {
    for (const s of strips) s.mat.uniforms.uTime.value = time;
    sMat.uniforms.uTime.value = time;
    if (plumePts.length) {
      const last = plumePts.length - 1;
      for (let i = 0; i < SPARKS; i++) {
        const sd = sparkSeeds[i];
        const u = (sd.u + time * sd.speed) % 1;
        const f = u * last;
        const k = Math.min(Math.floor(f), last - 1);
        tmp.copy(plumePts[k]).lerp(plumePts[k + 1], f - k);
        const w = plumeWidthAt(u) * (sd.v + 0.08 * Math.sin(time * 0.3 + sd.wobble));
        sPos[i * 3] = tmp.x + w;
        sPos[i * 3 + 1] = tmp.y;
        sPos[i * 3 + 2] = 0.01;
      }
      (sGeo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true;
    }
  };

  return {
    group,
    setLayout,
    setPixelRatio,
    update,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
