import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/**
 * "Escultura de fragancia": representación abstracta del perfume moviéndose
 * en el aire. NO es un primitivo: es una superficie generada a lo largo de
 * una curva orgánica en S / espiral abierta que se recalcula cada fotograma
 * (se retuerce, cambia de ancho y ondula muy despacio).
 *
 *  - Cinta principal: seda / líquido con reflejos (material físico con sheen)
 *    y bordes que se desvanecen (transparencia por borde y por ángulo).
 *  - Dos hebras finas de vapor que acompañan a la cinta.
 *  - Pocas partículas diminutas, casi invisibles.
 *
 * Coordenadas locales: ~1 unidad de alto, centrada en el origen.
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
  { segmentsU: 280, segmentsV: 22, width: 0.16, radius: 1, phase: 0, timeOffset: 0, opacity: 0.78 },
  { segmentsU: 220, segmentsV: 4, width: 0.012, radius: 1.22, phase: 0.55, timeOffset: 7, opacity: 0.5 },
  { segmentsU: 220, segmentsV: 4, width: 0.008, radius: 0.82, phase: -0.4, timeOffset: 13, opacity: 0.4 },
];

/** Línea central orgánica: S vertical suave + espiral abierta e irregular */
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

export function createFragranceSculpture(THREE: Three, opts: { lowPower: boolean }) {
  const group = new THREE.Group();
  group.name = "fragrance-sculpture";

  const up = new THREE.Vector3(0, 1, 0);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const faceN = new THREE.Vector3();

  const meshes: Array<{ strand: Strand; geo: THREE_NS.BufferGeometry; pos: Float32Array }> = [];
  const materials: THREE_NS.Material[] = [];

  for (const strand of STRANDS) {
    const su = opts.lowPower ? Math.round(strand.segmentsU * 0.7) : strand.segmentsU;
    const s = { ...strand, segmentsU: su };
    const cols = s.segmentsV + 1;
    const rows = s.segmentsU + 1;
    const pos = new Float32Array(rows * cols * 3);
    const rib = new Float32Array(rows * cols * 2);
    const index: number[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const k = i * cols + j;
        rib[k * 2] = i / s.segmentsU;
        rib[k * 2 + 1] = j / s.segmentsV;
        if (i < s.segmentsU && j < s.segmentsV) {
          const a = k;
          const b = k + cols;
          index.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aRib", new THREE.BufferAttribute(rib, 2));
    geo.setIndex(index);

    // Champán oscuro con reflejos: dorado sutil, nunca amarillo plano
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x9c8058,
      metalness: 0.55,
      roughness: 0.3,
      sheen: 1,
      sheenColor: new THREE.Color(0xf1e2c2),
      sheenRoughness: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.05,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uOpacity = { value: s.opacity };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aRib;\nvarying vec2 vRib;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRib = aRib;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vRib;\nuniform float uOpacity;")
        .replace(
          "#include <dithering_fragment>",
          `// Bordes transparentes (a lo ancho y en los extremos) + brillo marfil en ángulos rasantes
          float across = smoothstep(0.0, 0.24, vRib.y) * smoothstep(1.0, 0.76, vRib.y);
          float along = smoothstep(0.0, 0.14, vRib.x) * smoothstep(1.0, 0.84, vRib.x);
          float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
          float fres = pow(1.0 - facing, 2.2);
          gl_FragColor.rgb += vec3(0.96, 0.9, 0.78) * fres * 0.28;
          gl_FragColor.a = uOpacity * across * along * clamp(0.32 + 0.75 * fres, 0.0, 1.0);
          #include <dithering_fragment>`,
        );
    };
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = STRANDS.indexOf(strand) === 0 ? 1 : 2;
    group.add(mesh);
    meshes.push({ strand: s, geo, pos });
  }

  // Partículas: muy pocas, diminutas, casi invisibles
  const COUNT = opts.lowPower ? 18 : 30;
  const seeds = Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 0.9,
    y: (Math.random() - 0.5) * 1.2,
    z: (Math.random() - 0.5) * 0.7,
    s: 0.2 + Math.random() * 0.6,
    p: Math.random() * Math.PI * 2,
  }));
  const pPos = new Float32Array(COUNT * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
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
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materials.push(pMat);
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  const buildStrand = (s: Strand, pos: Float32Array, geo: THREE_NS.BufferGeometry, time: number) => {
    const t = time + s.timeOffset;
    const cols = s.segmentsV + 1;
    const e = 1 / s.segmentsU;
    for (let i = 0; i <= s.segmentsU; i++) {
      const u = i / s.segmentsU;
      centerline(u, t, s, p0);
      centerline(Math.min(u + e, 1.0001), t, s, p1);
      tangent.subVectors(p1, p0).normalize();
      side.crossVectors(tangent, up).normalize();
      binormal.crossVectors(side, tangent).normalize();
      // Giro de la cinta (seda) que evoluciona muy despacio
      const twist = u * Math.PI * 2.6 + 0.5 * Math.sin(t * 0.13 + u * 3);
      dir.copy(side).multiplyScalar(Math.cos(twist)).addScaledVector(binormal, Math.sin(twist));
      faceN.crossVectors(tangent, dir).normalize();
      const w =
        s.width *
        (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * u), 1.4)) *
        (0.85 + 0.15 * Math.sin(u * 5 + t * 0.19));
      const drape = 0.55 * Math.sin(u * 4 + t * 0.15); // curvatura transversal (caída de la seda)
      for (let j = 0; j <= s.segmentsV; j++) {
        const v = j / s.segmentsV - 0.5;
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

  const update = (time: number) => {
    for (const m of meshes) buildStrand(m.strand, m.pos, m.geo, time);
    for (let i = 0; i < COUNT; i++) {
      const sd = seeds[i];
      const drift = ((sd.y + 0.6 + time * 0.012 * sd.s) % 1.2) - 0.6;
      pPos[i * 3] = sd.x + Math.sin(time * 0.05 * sd.s + sd.p) * 0.05;
      pPos[i * 3 + 1] = drift;
      pPos[i * 3 + 2] = sd.z + Math.cos(time * 0.04 * sd.s + sd.p) * 0.05;
    }
    (pGeo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true;
    // Rotación extremadamente lenta (una vuelta cada ~48 s)
    group.rotation.y = time * ((Math.PI * 2) / 48);
  };

  update(0);

  return {
    group,
    update,
    dispose() {
      meshes.forEach((m) => m.geo.dispose());
      pGeo.dispose();
      dotTex.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}
