"use client";

import { useEffect, useRef, useState } from "react";
import type * as T from "three";

/**
 * Escena 3D del hero: "escultura de fragancia" abstracta (seda, vapor,
 * líquido y luz dorada) suspendida a la derecha del título.
 *
 * - La forma se genera por código en ./hero-3d/fragrance-sculpture.ts.
 * - Cámara FIJA. Solo la escultura gira y se deforma, muy despacio.
 * - Se coloca sobre el elemento [data-hero-anchor] visible (derecha en
 *   escritorio, entre el texto en móvil) y nunca tapa textos ni botones.
 * - three.js se carga bajo demanda, se pausa fuera de pantalla y respeta
 *   "reducir movimiento".
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
      const { createFragranceSculpture } = await import("./hero-3d/fragrance-sculpture");
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isSmall = window.innerWidth < 768;

      // ---------- Renderer ----------
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
      renderer.setClearColor(0x0a0a0a, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      scene.environmentIntensity = 0.55; // reflejos sutiles, no espejo

      // ---------- Cámara fija ----------
      const CAMERA_Z = 10;
      const FOV = 26;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      camera.position.set(0, 0, CAMERA_Z);
      camera.lookAt(0, 0, 0);

      // ---------- Fondo negro con resplandor cálido muy suave detrás ----------
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = bgCanvas.height = 1024;
      const bg = bgCanvas.getContext("2d")!;
      bg.fillStyle = "#0a0a0a";
      bg.fillRect(0, 0, 1024, 1024);
      const bgGrad = bg.createRadialGradient(512, 512, 0, 512, 512, 170);
      bgGrad.addColorStop(0, "#241c10");
      bgGrad.addColorStop(0.6, "#14100a");
      bgGrad.addColorStop(1, "#0a0a0a");
      bg.fillStyle = bgGrad;
      bg.fillRect(0, 0, 1024, 1024);
      const bgTex = new THREE.CanvasTexture(bgCanvas);
      bgTex.colorSpace = THREE.SRGBColorSpace;
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bgTex }));
      backdrop.position.z = -6;
      scene.add(backdrop);

      // ---------- Escultura ----------
      const stage = new THREE.Group();
      scene.add(stage);
      const sculpture = createFragranceSculpture(THREE, { lowPower: isSmall });
      stage.add(sculpture.group);

      // ---------- Iluminación: blanco cálido suave + contraluz dorado sutil ----------
      scene.add(new THREE.AmbientLight(0xfff2e0, 0.1));
      const key = new THREE.DirectionalLight(0xfff6ea, 1.6);
      key.position.set(-3, 4, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xf3e6d2, 0.25);
      fill.position.set(4, -1, 5);
      scene.add(fill);
      const rim = new THREE.SpotLight(0xd9b27a, 40, 20, Math.PI / 6, 0.9, 1.2);
      scene.add(rim);
      scene.add(rim.target);

      // ---------- Bloom muy controlado (solo escritorio) ----------
      let composer: { render(): void; setSize(w: number, h: number): void; dispose(): void } | null = null;
      if (!isSmall) {
        const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
        const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
        const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
        const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");
        if (disposed) return;
        const c = new EffectComposer(renderer);
        c.addPass(new RenderPass(scene, camera));
        c.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.18, 0.5, 0.86));
        c.addPass(new OutputPass());
        composer = c;
      }

      // ---------- Colocación según el ancla del layout ----------
      const findAnchor = () => {
        const section = mount.parentElement;
        if (!section) return null;
        const anchors = Array.from(section.querySelectorAll<HTMLElement>("[data-hero-anchor]"));
        return anchors.find((a) => a.offsetParent !== null && a.clientHeight > 0) ?? null;
      };
      const place = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        composer?.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        const visibleH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
        const worldPerPx = visibleH / h;

        const anchor = findAnchor();
        const mRect = mount.getBoundingClientRect();
        const rect = anchor?.getBoundingClientRect();
        const cx = rect ? rect.left - mRect.left + rect.width / 2 : w * 0.72;
        const cy = rect ? rect.top - mRect.top + rect.height / 2 : h * 0.5;
        const aw = rect?.width ?? w * 0.4;
        const ah = rect?.height ?? h * 0.7;
        // ~38 % del alto del hero, siempre con aire dentro del ancla
        const sizePx = Math.min(h * 0.38, ah * 0.85, aw * 0.8);
        const scale = sizePx * worldPerPx;
        stage.scale.setScalar(scale);
        stage.position.set((cx - w / 2) * worldPerPx, -(cy - h / 2) * worldPerPx, 0);
        backdrop.position.x = stage.position.x;
        backdrop.position.y = stage.position.y;

        rim.position.set(stage.position.x + 2.2 * scale, stage.position.y + 1.4 * scale, -3);
        rim.target.position.copy(stage.position);
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(mount);
      const anchorEl = findAnchor();
      if (anchorEl) ro.observe(anchorEl);
      window.addEventListener("resize", place);

      // ---------- Animación ----------
      const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
      io.observe(mount);

      let raf = 0;
      let elapsed = 0;
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!visible || document.hidden) return;
        elapsed += dt;
        sculpture.update(elapsed);
        draw();
      };

      if (reduceMotion) {
        sculpture.update(0);
        draw();
      } else {
        raf = requestAnimationFrame(frame);
      }
      mount.dataset.heroModel = "fragrance-sculpture";
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("resize", place);
        sculpture.dispose();
        backdrop.geometry.dispose();
        (backdrop.material as T.MeshBasicMaterial).dispose();
        bgTex.dispose();
        composer?.dispose();
        envTexture.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch((err) => {
      console.warn("[hero] Escena 3D no disponible", err);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] [&>canvas]:h-full [&>canvas]:w-full ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
