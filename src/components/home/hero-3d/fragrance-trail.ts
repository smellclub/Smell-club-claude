import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/**
 * Estela de fragancia: cintas finas tipo seda, semitransparentes y
 * orgánicas que rodean el frasco. No es un anillo: cada cinta es una
 * curva irregular (radio, altura y anchura variables) con opacidad que
 * se desvanece a lo largo, un brillo champán que la recorre y una
 * ondulación lenta. Lo que queda delante del frasco se atenúa para no
 * taparlo.
 *
 * Coordenadas pensadas para un frasco de 1 unidad de alto con la base en y=0.
 */
export function createFragranceTrail(THREE: Three) {
  const group = new THREE.Group();
  group.name = "hero-fragrance-trail";

  const uniforms = { uTime: { value: 0 } };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    varying vec2 vUv;
    varying float vFront;
    void main() {
      vUv = uv;
      vec3 p = position;
      // Ondulación lenta y orgánica (vapor)
      float a = uv.x * 6.2831;
      p.y += sin(a * 2.0 + uTime * 0.6 + uSeed) * 0.035 + sin(a * 5.0 - uTime * 0.4 + uSeed * 2.0) * 0.012;
      p.x += cos(a * 3.0 + uTime * 0.35 + uSeed) * 0.02;
      vec4 world = modelMatrix * vec4(p, 1.0);
      // > 0 cuando la cinta pasa por delante del frasco (hacia la cámara)
      vFront = world.z - (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    uniform float uOpacity;
    uniform float uSpeed;
    uniform vec3 uColor;
    uniform vec3 uHighlight;
    varying vec2 vUv;
    varying float vFront;
    void main() {
      // Bordes suaves (seda / vapor), más finos en el centro de la cinta
      float edge = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
      // Tramo visible que viaja a lo largo de la cinta (cola que se desvanece)
      float head = fract(vUv.x - uTime * uSpeed + uSeed * 0.13);
      float tail = smoothstep(0.0, 0.55, head) * smoothstep(1.0, 0.8, head);
      // Brillo champán que recorre la cinta
      float glint = pow(max(0.0, sin((vUv.x * 3.0 - uTime * 0.25 + uSeed) * 6.2831) ), 18.0);
      vec3 col = mix(uColor, uHighlight, glint * 0.8);
      float alpha = edge * tail * uOpacity * (0.75 + glint * 0.6);
      // Delante del frasco: mucho más tenue para no tapar el producto
      alpha *= mix(1.0, 0.28, smoothstep(0.0, 0.25, vFront));
      if (alpha < 0.002) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `;

  const ribbons: Array<{ radiusX: number; radiusZ: number; y: number; tilt: number; width: number; opacity: number; speed: number; seed: number; wobble: number }> = [
    { radiusX: 0.55, radiusZ: 0.42, y: 0.62, tilt: 0.22, width: 0.07, opacity: 0.34, speed: 0.045, seed: 0.3, wobble: 0.1 },
    { radiusX: 0.68, radiusZ: 0.5, y: 0.4, tilt: -0.16, width: 0.05, opacity: 0.26, speed: 0.035, seed: 1.7, wobble: 0.14 },
    { radiusX: 0.48, radiusZ: 0.38, y: 0.82, tilt: 0.35, width: 0.035, opacity: 0.22, speed: 0.055, seed: 3.1, wobble: 0.08 },
  ];

  const SEGMENTS = 220;
  const materials: THREE_NS.ShaderMaterial[] = [];

  for (const cfg of ribbons) {
    // Curva cerrada irregular alrededor del frasco (no un círculo perfecto)
    const points: THREE_NS.Vector3[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const irregular = 1 + Math.sin(a * 3 + cfg.seed) * cfg.wobble + Math.sin(a * 5 + cfg.seed * 2) * cfg.wobble * 0.4;
      points.push(
        new THREE.Vector3(
          Math.cos(a) * cfg.radiusX * irregular,
          cfg.y + Math.sin(a) * cfg.tilt * 0.5 + Math.sin(a * 2 + cfg.seed) * 0.05,
          Math.sin(a) * cfg.radiusZ * irregular,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");

    // Tira de triángulos a lo largo de la curva; ancho variable y ligero giro (seda)
    const positions = new Float32Array((SEGMENTS + 1) * 2 * 3);
    const uvs = new Float32Array((SEGMENTS + 1) * 2 * 2);
    const indices: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const normalDir = new THREE.Vector3();
    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      const p = curve.getPointAt(u % 1);
      curve.getTangentAt(u % 1, tangent);
      normalDir.crossVectors(tangent, up).normalize();
      const twist = Math.sin(u * Math.PI * 4 + cfg.seed) * 0.9;
      side.copy(up).multiplyScalar(Math.cos(twist)).addScaledVector(normalDir, Math.sin(twist));
      const w = cfg.width * (0.55 + 0.45 * Math.sin(u * Math.PI * 6 + cfg.seed) ** 2);
      for (let k = 0; k < 2; k++) {
        const s = k === 0 ? -0.5 : 0.5;
        const idx = (i * 2 + k) * 3;
        positions[idx] = p.x + side.x * w * s;
        positions[idx + 1] = p.y + side.y * w * s;
        positions[idx + 2] = p.z + side.z * w * s;
        const uvIdx = (i * 2 + k) * 2;
        uvs[uvIdx] = u;
        uvs[uvIdx + 1] = k;
      }
      if (i < SEGMENTS) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: uniforms.uTime,
        uSeed: { value: cfg.seed },
        uOpacity: { value: cfg.opacity },
        uSpeed: { value: cfg.speed },
        uColor: { value: new THREE.Color(0xe9dcc0) },
        uHighlight: { value: new THREE.Color(0xf6e2a8) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    materials.push(material);
    group.add(new THREE.Mesh(geo, material));
  }

  return {
    group,
    update(time: number) {
      uniforms.uTime.value = time;
      // Deriva muy lenta alrededor del frasco (independiente de su giro)
      group.rotation.y = -time * 0.08;
    },
    dispose() {
      group.traverse((o) => (o as THREE_NS.Mesh).geometry?.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
