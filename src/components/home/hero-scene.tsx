"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Escena 3D del hero: frasco de perfume de cristal con líquido ámbar,
 * tapón dorado facetado y partículas doradas (bruma de perfume).
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
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
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

      // ---------- Frasco ----------
      const bottle = new THREE.Group();
      scene.add(bottle);

      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.02,
        transmission: 1,
        thickness: 0.35,
        ior: 1.52,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        attenuationColor: new THREE.Color(0xf3e3bd),
        attenuationDistance: 4,
        envMapIntensity: 2.2,
        specularIntensity: 1,
      });
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.25, 1.6, 0.62, 6, 0.14), glass);
      bottle.add(body);

      const liquid = new THREE.Mesh(
        new RoundedBoxGeometry(1.05, 1.18, 0.44, 4, 0.1),
        new THREE.MeshPhysicalMaterial({
          color: 0xc27a1c,
          roughness: 0.1,
          transmission: 0.35,
          thickness: 0.4,
          ior: 1.33,
          emissive: new THREE.Color(0x6a3500),
          emissiveIntensity: 0.55,
        }),
      );
      liquid.position.y = -0.14;
      bottle.add(liquid);

      // Etiqueta con la marca
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 1024;
      labelCanvas.height = 256;
      const lc = labelCanvas.getContext("2d")!;
      lc.clearRect(0, 0, 1024, 256);
      lc.fillStyle = "rgba(10,10,10,0.82)";
      lc.fillRect(40, 48, 944, 160);
      lc.strokeStyle = "#c5a25a";
      lc.lineWidth = 4;
      lc.strokeRect(56, 64, 912, 128);
      lc.fillStyle = "#e3cc93";
      lc.font = "500 84px 'Cormorant Garamond', Georgia, serif";
      lc.textAlign = "center";
      lc.textBaseline = "middle";
      if ("letterSpacing" in lc) (lc as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "18px";
      lc.fillText("SMELLCLUB", 512, 132);
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.colorSpace = THREE.SRGBColorSpace;
      labelTex.anisotropy = 4;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.25),
        new THREE.MeshStandardMaterial({ map: labelTex, transparent: true, roughness: 0.4, metalness: 0.2 }),
      );
      label.position.set(0, -0.12, 0.315);
      bottle.add(label);

      const gold = new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.18, 32), gold);
      neck.position.y = 0.89;
      bottle.add(neck);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 16, 48), gold);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.98;
      bottle.add(collar);
      // Tapón facetado (estilo perfumería árabe)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.62, 8, 1), gold);
      cap.position.y = 1.32;
      bottle.add(cap);
      const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), gold);
      capTop.scale.set(1, 0.45, 1);
      capTop.position.y = 1.63;
      bottle.add(capTop);

      // ---------- Luces ----------
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      const key = new THREE.DirectionalLight(0xffe7b8, 2.4);
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
        layout.x = portrait ? 0 : Math.min(1.9, (w / h) * 0.95);
        layout.y = portrait ? 0.02 : -0.3;
        layout.s = portrait ? 0.46 : 0.9;
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
        bottle.rotation.y = t * 0.45 + (1 - intro) * -2.4 + pointer.x * 0.5;
        bottle.rotation.x = pointer.y * 0.18 + Math.sin(t * 0.7) * 0.03;
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
