import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/**
 * "Escultura de fragancia": representación abstracta del perfume moviéndose
 * en el aire. NO es un primitivo: son superficies generadas a lo largo de
 * curvas orgánicas que se recalculan cada fotograma (se retuercen, cambian
 * de ancho y ondulan muy despacio).
 *
 *  - Núcleo (group): cinta de seda en S / espiral abierta + dos hebras de
 *    vapor. Coordenadas locales: ~1 unidad de alto, centrado en el origen.
 *  - Estela (crossing): cinta larga que ATRAVIESA la pantalla pasando por el
 *    núcleo. Su recorrido lo fija la escena con setPath() en coordenadas de
 *    mundo (así evita los textos y botones).
 *  - Pocas partículas diminutas, casi invisibles.
 */

type Strand = {
  segmentsU: number;
  segmentsV: number;
  width: number; // ancho máximo relativo
  radius: number; // escala del radio de la espiral
  phase: number; // desfase a lo largo de la curva
  timeOffset: number;
  opacity: number;
};

const STRANDS: Strand[] = [
  { segmentsU: 440, segmentsV: 34, width: 0.17, radius: 1, phase: 0, timeOffset: 0, opacity: 0.95 },
  { segmentsU: 320, segmentsV: 4, width: 0.012, radius: 1.22, phase: 0.55, timeOffset: 7, opacity: 0.6 },
  { segmentsU: 320, segmentsV: 4, width: 0.008, radius: 0.82, phase: -0.4, timeOffset: 13, opacity: 0.5 },
];

/** Hebras de la estela que cruza la pantalla (ancho relativo al tamaño del núcleo) */
type CrossStrand = {
  segmentsU: number;
  segmentsV: number;
  width: number;
  offset: number; // separación lateral respecto al recorrido
  phase: number;
  opacity: number;
};

const CROSS: CrossStrand[] = [
  { segmentsU: 680, segmentsV: 28, width: 0.11, offset: 0, phase: 0, opacity: 0.9 },
  { segmentsU: 460, segmentsV: 4, width: 0.01, offset: 0.07, phase: 1.7, opacity: 0.55 },
  { segmentsU: 460, segmentsV: 4, width: 0.007, offset: -0.06, phase: 3.1, opacity: 0.45 },
];

/** Línea central orgánica del núcleo: S vertical suave + espiral abierta e irregular */
function centerline(u: number, t: number, s: Strand, out: THREE_NS.Vector3) {
  const a = (u + s.phase) * Math.PI * 2.1 + t * 0.07;
  const r =
    (0.1 + 0.17 * Math.sin(Math.PI * u) + 0.028 * Math.sin(u * 9 + t * 0.23 + s.phase * 3)) * s.radius;
  const sCurve = 0.11 * Math.sin(u * Math.PI * 2 + t * 0.11) + 0.03 * Math.sin(u * 5.3 - t * 0.09);
  out.set(
    r * Math.cos(a) + sCurve,
    (u - 0.5) * 1.02 + 0.018 * Math.sin(u * 7 + t * 0.17 + s.phase),
    r * Math.sin(a) * 0.9,
  );
  return out;
}

function makeSilkMaterial(THREE: Three, opacity: number, fibers: number) {
  // Champán oscuro con reflejos: dorado sutil, nunca amarillo plano
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xa2855c,
    metalness: 0.6,
    roughness: 0.22,
    sheen: 1,
    sheenColor: new THREE.Color(0xf4e6c8),
    sheenRoughness: 0.35,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.15,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOpacity = { value: opacity };
    shader.uniforms.uFibers = { value: fibers };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aRib;\nvarying vec2 vRib;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRib = aRib;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vRib;\nuniform float uOpacity;\nuniform float uFibers;")
      // Detalle de seda: hebras finas a lo largo de la cinta (se atenúan
      // cuando son más finas que un píxel para no generar parpadeos)
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        float fx = vRib.y * uFibers;
        float fAA = clamp(1.0 - fwidth(fx) * 0.6, 0.0, 1.0);
        float fiber = (0.5 + 0.5 * sin(fx * 6.2832 + sin(vRib.x * 40.0) * 0.6)) * fAA;
        float weave = (0.5 + 0.5 * sin(vRib.y * uFibers * 0.37 * 6.2832 + vRib.x * 23.0)) * fAA;
        roughnessFactor = clamp(roughnessFactor * (0.75 + 0.5 * fiber), 0.04, 1.0);
        diffuseColor.rgb *= 0.9 + 0.1 * fiber + 0.06 * weave;`,
      )
      .replace(
        "#include <dithering_fragment>",
        `// Bordes transparentes (a lo ancho y en los extremos) + brillo marfil en ángulos rasantes
        float across = smoothstep(0.0, 0.1, vRib.y) * smoothstep(1.0, 0.9, vRib.y);
        float along = smoothstep(0.0, 0.08, vRib.x) * smoothstep(1.0, 0.92, vRib.x);
        float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
        float fres = pow(1.0 - facing, 2.0);
        gl_FragColor.rgb += vec3(0.97, 0.91, 0.8) * fres * 0.34;
        gl_FragColor.a = uOpacity * across * along * clamp(0.5 + 0.7 * fres, 0.0, 1.0);
        #include <dithering_fragment>`,
      );
  };
  return mat;
}

function makeRibbonGeometry(THREE: Three, segmentsU: number, segmentsV: number) {
  const cols = segmentsV + 1;
  const rows = segmentsU + 1;
  const pos = new Float32Array(rows * cols * 3);
  const rib = new Float32Array(rows * cols * 2);
  const index: number[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const k = i * cols + j;
      rib[k * 2] = i / segmentsU;
      rib[k * 2 + 1] = j / segmentsV;
      if (i < segmentsU && j < segmentsV) index.push(k, k + cols, k + 1, k + cols, k + cols + 1, k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aRib", new THREE.BufferAttribute(rib, 2));
  geo.setIndex(index);
  return { geo, pos };
}

export function createFragranceSculpture(THREE: Three, opts: { lowPower: boolean }) {
  const group = new THREE.Group();
  group.name = "fragrance-sculpture";
  const crossing = new THREE.Group();
  crossing.name = "fragrance-crossing";

  const up = new THREE.Vector3(0, 1, 0);
  const view = new THREE.Vector3(0, 0, 1);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const faceN = new THREE.Vector3();

  const materials: THREE_NS.Material[] = [];
  const geometries: THREE_NS.BufferGeometry[] = [];

  /** Rellena la malla de una cinta a partir de su línea central, giro y ancho */
  const fillRibbon = (
    pos: Float32Array,
    geo: THREE_NS.BufferGeometry,
    segU: number,
    segV: number,
    center: (u: number, out: THREE_NS.Vector3) => void,
    frameUp: THREE_NS.Vector3,
    twistAt: (u: number) => number,
    widthAt: (u: number) => number,
    drapeAt: (u: number) => number,
  ) => {
    const cols = segV + 1;
    const e = 1 / segU;
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      center(u, p0);
      if (u + e <= 1) {
        center(u + e, p1);
        tangent.subVectors(p1, p0).normalize();
      } else {
        center(u - e, p1);
        tangent.subVectors(p0, p1).normalize();
      }
      side.crossVectors(tangent, frameUp).normalize();
      binormal.crossVectors(side, tangent).normalize();
      const twist = twistAt(u);
      dir.copy(side).multiplyScalar(Math.cos(twist)).addScaledVector(binormal, Math.sin(twist));
      faceN.crossVectors(tangent, dir).normalize();
      const w = widthAt(u);
      const drape = drapeAt(u);
      for (let j = 0; j <= segV; j++) {
        const v = j / segV - 0.5;
        const k = (i * cols + j) * 3;
        const cup = v * v * w * drape;
        pos[k] = p0.x + dir.x * v * w + faceN.x * cup;
        pos[k + 1] = p0.y + dir.y * v * w + faceN.y * cup;
        pos[k + 2] = p0.z + dir.z * v * w + faceN.z * cup;
      }
    }
    (geo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true;
    geo.computeVertexNormals();
  };

  // ---------- Núcleo ----------
  const core = STRANDS.map((strand, idx) => {
    const segmentsU = opts.lowPower ? Math.round(strand.segmentsU * 0.6) : strand.segmentsU;
    const segmentsV = opts.lowPower ? Math.max(4, Math.round(strand.segmentsV * 0.7)) : strand.segmentsV;
    const s = { ...strand, segmentsU, segmentsV };
    const { geo, pos } = makeRibbonGeometry(THREE, s.segmentsU, s.segmentsV);
    const mat = makeSilkMaterial(THREE, s.opacity, idx === 0 ? 60 : 4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = idx === 0 ? 2 : 3;
    group.add(mesh);
    materials.push(mat);
    geometries.push(geo);
    return { s, geo, pos };
  });

  // ---------- Estela que cruza la pantalla ----------
  let path: THREE_NS.CatmullRomCurve3 | null = null;
  let pathScale = 1; // tamaño del núcleo en unidades de mundo
  const pathPts: THREE_NS.Vector3[] = [];
  const cross = CROSS.map((c, idx) => {
    const segmentsU = opts.lowPower ? Math.round(c.segmentsU * 0.6) : c.segmentsU;
    const segmentsV = opts.lowPower ? Math.max(4, Math.round(c.segmentsV * 0.7)) : c.segmentsV;
    const s = { ...c, segmentsU, segmentsV };
    const { geo, pos } = makeRibbonGeometry(THREE, s.segmentsU, s.segmentsV);
    const mat = makeSilkMaterial(THREE, s.opacity, idx === 0 ? 48 : 4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    mesh.visible = false;
    crossing.add(mesh);
    materials.push(mat);
    geometries.push(geo);
    return { s, geo, pos, mesh };
  });

  /** Recorrido (en coordenadas de mundo) y tamaño del núcleo */
  const setPath = (points: THREE_NS.Vector3[], scale: number) => {
    path = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
    pathScale = scale;
    // Muestreo por longitud de arco (se reutiliza cada fotograma)
    const n = 900;
    pathPts.length = 0;
    for (let i = 0; i <= n; i++) pathPts.push(path.getPointAt(i / n));
    cross.forEach((c) => (c.mesh.visible = true));
  };
  const samplePath = (u: number, out: THREE_NS.Vector3) => {
    const f = Math.min(Math.max(u, 0), 1) * (pathPts.length - 1);
    const i = Math.min(Math.floor(f), pathPts.length - 2);
    return out.copy(pathPts[i]).lerp(pathPts[i + 1], f - i);
  };

  // ---------- Partículas: muy pocas, diminutas, casi invisibles ----------
  const COUNT = opts.lowPower ? 18 : 30;
  const seeds = Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 1.1,
    y: (Math.random() - 0.5) * 1.3,
    z: (Math.random() - 0.5) * 0.7,
    s: 0.2 + Math.random() * 0.6,
    p: Math.random() * Math.PI * 2,
  }));
  const pPos = new Float32Array(COUNT * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  geometries.push(pGeo);
  const dot = document.createElement("canvas");
  dot.width = dot.height = 32;
  const dc = dot.getContext("2d")!;
  const dg = dc.createRadialGradient(16, 16, 0, 16, 16, 16);
  dg.addColorStop(0, "rgba(255,244,220,1)");
  dg.addColorStop(1, "rgba(255,244,220,0)");
  dc.fillStyle = dg;
  dc.fillRect(0, 0, 32, 32);
  const dotTex = new THREE.CanvasTexture(dot);
  const pMat = new THREE.PointsMaterial({
    size: 0.012,
    map: dotTex,
    color: 0xeadcc0,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materials.push(pMat);
  group.add(new THREE.Points(pGeo, pMat));

  const update = (time: number) => {
    for (const { s, geo, pos } of core) {
      const t = time + s.timeOffset;
      fillRibbon(
        pos,
        geo,
        s.segmentsU,
        s.segmentsV,
        (u, out) => centerline(Math.min(u, 1.0001), t, s, out),
        up,
        (u) => u * Math.PI * 2.6 + 0.5 * Math.sin(t * 0.13 + u * 3),
        (u) => s.width * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * u), 1.4)) * (0.85 + 0.15 * Math.sin(u * 5 + t * 0.19)),
        (u) => 0.55 * Math.sin(u * 4 + t * 0.15),
      );
    }

    if (path) {
      const k = pathScale;
      for (const { s, geo, pos } of cross) {
        const t = time + s.phase * 5;
        fillRibbon(
          pos,
          geo,
          s.segmentsU,
          s.segmentsV,
          (u, out) => {
            samplePath(u, out);
            // Ondulación lenta en el plano de la pantalla y en profundidad
            out.y += k * (0.05 * Math.sin(u * Math.PI * 5 - t * 0.22 + s.phase) + s.offset * Math.sin(u * 9 + t * 0.15));
            out.x += k * s.offset * 0.6 * Math.cos(u * 7 - t * 0.12);
            out.z += k * 0.12 * Math.sin(u * Math.PI * 3 + t * 0.17 + s.phase);
          },
          view,
          (u) => u * Math.PI * 4.2 + 0.7 * Math.sin(t * 0.1 + u * 5) + s.phase,
          (u) => k * s.width * (0.45 + 0.55 * Math.pow(Math.sin(Math.PI * u), 0.7)) * (0.8 + 0.2 * Math.sin(u * 11 + t * 0.2)),
          (u) => 0.5 * Math.sin(u * 6 + t * 0.14),
        );
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const sd = seeds[i];
      const drift = ((sd.y + 0.65 + time * 0.012 * sd.s) % 1.3) - 0.65;
      pPos[i * 3] = sd.x + Math.sin(time * 0.05 * sd.s + sd.p) * 0.05;
      pPos[i * 3 + 1] = drift;
      pPos[i * 3 + 2] = sd.z + Math.cos(time * 0.04 * sd.s + sd.p) * 0.05;
    }
    (pGeo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true;
    // Rotación extremadamente lenta del núcleo (una vuelta cada ~48 s)
    group.rotation.y = time * ((Math.PI * 2) / 48);
  };

  update(0);

  return {
    group,
    crossing,
    setPath,
    update,
    dispose() {
      geometries.forEach((g) => g.dispose());
      dotTex.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}
