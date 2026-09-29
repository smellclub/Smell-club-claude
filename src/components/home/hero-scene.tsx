"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Escena 3D del hero: gota de oro líquido que ondula como metal fundido,
 * dos anillos dorados en órbita y partículas doradas (bruma de perfume).
 * - three.js se carga bajo demanda (no bloquea la primera pintura).
 * - Se pausa fuera de pantalla / pestaña oculta.
 * - Respeta "reducir movimiento" (un único fotograma estático).
 */
export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const probe = document.createElement("canvas");
      if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;

      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isSmall = window.innerWidth < 768;

      // ---------- Renderer / escena ----------
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

      // Fondo OPACO con halo dorado: el cristal lo refracta (transmission)
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 1024;
      const g = glowCanvas.getContext("2d")!;
      g.fillStyle = "#0a0a0a";
      g.fillRect(0, 0, 1024, 1024);
      const grad = g.createRadialGradient(512, 512, 0, 512, 512, 125);
      grad.addColorStop(0, "#5c4520");
      grad.addColorStop(0.5, "#271d0d");
      grad.addColorStop(1, "#0a0a0a");
      g.fillStyle = grad;
      g.fillRect(0, 0, 1024, 1024);
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      glowTex.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: glowTex }));
      glow.position.set(0, 0.1, -4);
      scene.add(glow);

      // ---------- Gota de oro líquido + anillos orbitales ----------
      // La esfera se deforma en la GPU con ruido (oro fundido en movimiento).
      const bottle = new THREE.Group();
      scene.add(bottle);

      const goldLiquid = new THREE.MeshPhysicalMaterial({
        color: 0xd9b46a,
        metalness: 1,
        roughness: 0.16,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.7,
      });
      const blobUniforms = { uTime: { value: 0 } };
      goldLiquid.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = blobUniforms.uTime;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
            uniform float uTime;
            // Simplex 3D noise (Ashima Arts, licencia MIT)
            vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
            vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
            float snoise(vec3 v){
              const vec2 C = vec2(1.0/6.0, 1.0/3.0);
              const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
              vec3 i = floor(v + dot(v, C.yyy));
              vec3 x0 = v - i + dot(i, C.xxx);
              vec3 g = step(x0.yzx, x0.xyz);
              vec3 l = 1.0 - g;
              vec3 i1 = min(g.xyz, l.zxy);
              vec3 i2 = max(g.xyz, l.zxy);
              vec3 x1 = x0 - i1 + C.xxx;
              vec3 x2 = x0 - i2 + 2.0 * C.xxx;
              vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
              i = mod(i, 289.0);
              vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              float n_ = 1.0/7.0;
              vec3 ns = n_ * D.wyz - D.xzx;
              vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
              vec4 x_ = floor(j * ns.z);
              vec4 y_ = floor(j - 7.0 * x_);
              vec4 x = x_ * ns.x + ns.yyyy;
              vec4 y = y_ * ns.x + ns.yyyy;
              vec4 h = 1.0 - abs(x) - abs(y);
              vec4 b0 = vec4(x.xy, y.xy);
              vec4 b1 = vec4(x.zw, y.zw);
              vec4 s0 = floor(b0) * 2.0 + 1.0;
              vec4 s1 = floor(b1) * 2.0 + 1.0;
              vec4 sh = -step(h, vec4(0.0));
              vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
              vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
              vec3 p0 = vec3(a0.xy, h.x);
              vec3 p1 = vec3(a0.zw, h.y);
              vec3 p2 = vec3(a1.xy, h.z);
              vec3 p3 = vec3(a1.zw, h.w);
              vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
              p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
              vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
              m = m * m;
              return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            vec3 displaceBlob(vec3 p){
              float n = snoise(p * 0.85 + vec3(0.0, uTime * 0.3, uTime * 0.18)) * 0.13
                      + snoise(p * 1.7 - vec3(uTime * 0.22)) * 0.025;
              return p + normalize(p) * n;
            }`,
          )
          .replace(
            "#include <beginnormal_vertex>",
            `vec3 bnPos = displaceBlob(position);
            vec3 bnT = normalize(cross(normal, abs(normal.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
            vec3 bnB = normalize(cross(normal, bnT));
            float bnE = 0.01;
            vec3 bnA = displaceBlob(position + bnT * bnE);
            vec3 bnC = displaceBlob(position + bnB * bnE);
            vec3 objectNormal = normalize(cross(bnA - bnPos, bnC - bnPos));
            if (dot(objectNormal, normal) < 0.0) objectNormal = -objectNormal;
            #ifdef USE_TANGENT
              vec3 objectTangent = vec3(tangent.xyz);
            #endif`,
          )
          .replace("#include <begin_vertex>", "vec3 transformed = bnPos;");
      };
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, isSmall ? 48 : 72), goldLiquid);
      bottle.add(blob);

      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xe3cc93,
        metalness: 1,
        roughness: 0.22,
        emissive: new THREE.Color(0x3a2a0a),
        envMapIntensity: 1.8,
      });
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.014, 16, 220), ringMat);
      ring1.rotation.set(Math.PI / 2.3, 0.35, 0);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.008, 16, 260), ringMat);
      ring2.rotation.set(Math.PI / 1.7, -0.5, 0.4);
      bottle.add(ring1, ring2);

      // ---------- Luces ----------
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(0xfff0d6, 3.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.PointLight(0xc5a25a, 18, 12);
      rim.position.set(-3, 1.5, -2);
      scene.add(rim);
      const top = new THREE.SpotLight(0xffffff, 30, 14, Math.PI / 7, 0.6);
      top.position.set(0, 6, 3);
      scene.add(top);

      // ---------- Partículas doradas (bruma) ----------
      const COUNT = isSmall ? 260 : 520;
      const positions = new Float32Array(COUNT * 3);
      const speeds = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 9;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
        speeds[i] = 0.08 + Math.random() * 0.25;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = dotCanvas.height = 64;
      const dc = dotCanvas.getContext("2d")!;
      const dg = dc.createRadialGradient(32, 32, 0, 32, 32, 32);
      dg.addColorStop(0, "rgba(255,236,190,1)");
      dg.addColorStop(0.4, "rgba(227,204,147,0.6)");
      dg.addColorStop(1, "rgba(197,162,90,0)");
      dc.fillStyle = dg;
      dc.fillRect(0, 0, 64, 64);
      const dotTex = new THREE.CanvasTexture(dotCanvas);
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          size: isSmall ? 0.06 : 0.05,
          map: dotTex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.85,
        }),
      );
      scene.add(particles);

      // ---------- Tamaño / encuadre ----------
      // Móvil (vertical): frasco centrado bajo el título. Escritorio: a la derecha.
      const layout = { x: 0, y: -0.43, s: 0.62 };
      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const portrait = w / h < 1;
        layout.x = portrait ? 0 : Math.min(1.7, (w / h) * 0.9);
        layout.y = portrait ? 0.12 : 0.05;
        layout.s = portrait ? 0.5 : 0.85;
        glow.position.x = layout.x;
        camera.position.set(0, 0.15, portrait ? 8.6 : 7);
        camera.lookAt(0, 0.1, 0);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      // ---------- Interacción (ratón / dedo) ----------
      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // ---------- Bucle ----------
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
      io.observe(mount);

      const clock = new THREE.Clock();
      let raf = 0;
      const INTRO = 1.8;
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;

        const intro = easeOut(Math.min(t / INTRO, 1));
        pointer.x += (target.x - pointer.x) * 0.05;
        pointer.y += (target.y - pointer.y) * 0.05;

        bottle.scale.setScalar(layout.s * (0.55 + 0.45 * intro));
        bottle.position.x = layout.x;
        bottle.position.y = layout.y + (1 - intro) * -1.2 + Math.sin(t * 1.1) * 0.07;
        bottle.rotation.y = t * 0.25 + (1 - intro) * -2.4 + pointer.x * 0.5;
        bottle.rotation.x = pointer.y * 0.18 + Math.sin(t * 0.7) * 0.03;
        blobUniforms.uTime.value = t;
        ring1.rotation.z += dt * 0.35;
        ring2.rotation.z -= dt * 0.22;
        ring2.rotation.x += dt * 0.05;
        bottle.rotation.z = -pointer.x * 0.06;

        camera.position.x = pointer.x * 0.35;
        camera.lookAt(0, 0.1, 0);

        const pos = pGeo.attributes.position as InstanceType<typeof THREE.BufferAttribute>;
        for (let i = 0; i < COUNT; i++) {
          let y = pos.getY(i) + speeds[i] * dt;
          if (y > 3.5) y = -3.5;
          pos.setY(i, y);
          pos.setX(i, pos.getX(i) + Math.sin(t * 0.5 + i) * 0.0015);
        }
        pos.needsUpdate = true;
        particles.rotation.y = t * 0.02;

        renderer.render(scene, camera);
      };

      if (reduceMotion) {
        bottle.scale.setScalar(layout.s);
        bottle.position.set(layout.x, layout.y, 0);
        bottle.rotation.y = 0.5;
        renderer.render(scene, camera);
      } else {
        frame();
      }
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        scene.traverse((obj) => {
          const mesh = obj as { geometry?: { dispose(): void }; material?: { dispose(): void; map?: { dispose(): void } | null } };
          mesh.geometry?.dispose();
          mesh.material?.map?.dispose();
          mesh.material?.dispose();
        });
        envTexture.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      // Sin WebGL: se queda el fondo CSS
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] [&>canvas]:h-full [&>canvas]:w-full ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
