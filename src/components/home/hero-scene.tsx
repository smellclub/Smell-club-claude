"use client";

import { useEffect, useRef, useState } from "react";
import type * as T from "three";

/**
 * Escena 3D del hero: humo dorado translúcido que sube en espiral a la
 * derecha del título, con una estela de humo que atraviesa la pantalla.
 *
 * - El humo se genera por shader en ./hero-3d/golden-smoke.ts.
 * - Cámara FIJA. Solo el humo fluye, muy despacio.
 * - Se coloca según el elemento [data-hero-anchor] visible (derecha en
 *   escritorio, entre el texto en móvil) y nunca tapa textos ni botones.
 * - three.js se carga bajo demanda, se pausa fuera de pantalla, respeta
 *   "reducir movimiento" y baja la resolución sola si el equipo va lento.
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
      const { createGoldenSmoke } = await import("./hero-3d/golden-smoke");
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isSmall = window.innerWidth < 768;

      // ---------- Renderer ----------
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      // Resolución: nítida (hasta 2x) y se ajusta sola si el equipo va lento
      const maxRatio = Math.min(window.devicePixelRatio || 1, isSmall ? 2 : 2.5);
      let pixelRatio = maxRatio;
      renderer.setPixelRatio(pixelRatio);
      renderer.setClearColor(0x0a0a0a, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

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

      // ---------- Humo ----------
      const smoke = createGoldenSmoke(THREE, { lowPower: isSmall });
      smoke.setPixelRatio(pixelRatio);
      scene.add(smoke.group);

      // ---------- Bloom suave (solo escritorio) ----------
      let composer: {
        render(): void;
        setSize(w: number, h: number): void;
        setPixelRatio(r: number): void;
        dispose(): void;
      } | null = null;
      if (!isSmall) {
        const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
        const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
        const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
        const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");
        if (disposed) return;
        const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
        const c = new EffectComposer(renderer, rt);
        c.addPass(new RenderPass(scene, camera));
        c.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.25, 0.5, 0.7));
        c.addPass(new OutputPass());
        composer = c;
      }

      const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

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
        const toWorld = ([x, y]: [number, number]) =>
          new THREE.Vector3((x - w / 2) * worldPerPx, -(y - h / 2) * worldPerPx, 0);

        const anchor = findAnchor();
        const mRect = mount.getBoundingClientRect();
        const rect = anchor?.getBoundingClientRect();
        const cx = rect ? rect.left - mRect.left + rect.width / 2 : w * 0.72;
        const cy = rect ? rect.top - mRect.top + rect.height / 2 : h * 0.5;
        const aw = rect?.width ?? w * 0.4;
        const ah = rect?.height ?? h * 0.7;
        const top = cy - ah / 2;
        const left = cx - aw / 2;
        const wide = aw < w * 0.7; // escritorio: ancla a la derecha del texto

        if (wide) {
          // Columna que nace abajo, sube serpenteando y se abre arriba
          smoke.setLayout({
            plume: (
              [
                [cx, top + 1.08 * ah],
                [cx + 0.03 * aw, top + 0.45 * ah],
                [cx + 0.08 * aw, top - 0.14 * ah],
              ] as Array<[number, number]>
            ).map(toWorld),
            plumeWidth: [0.22 * aw * worldPerPx, 1.0 * aw * worldPerPx],
            // Estela: entra por abajo a la izquierda (bajo los botones), cruza
            // la columna y sale por arriba a la derecha
            trail: (
              [
                [-0.1 * w, 0.99 * h],
                [0.38 * w, 0.93 * h],
                [cx, cy],
                [left + 0.95 * aw, top + 0.02 * ah],
                [1.1 * w, -0.12 * h],
              ] as Array<[number, number]>
            ).map(toWorld),
            trailWidth: 0.3 * aw * worldPerPx,
            worldPerPx,
          });
        } else {
          smoke.setLayout({
            plume: (
              [
                [cx, top + 1.05 * ah],
                [cx + 0.02 * aw, top + 0.5 * ah],
                [cx + 0.04 * aw, top - 0.05 * ah],
              ] as Array<[number, number]>
            ).map(toWorld),
            plumeWidth: [0.2 * aw * worldPerPx, 0.85 * aw * worldPerPx],
            trail: (
              [
                [-0.15 * w, top + 0.22 * ah],
                [cx, cy],
                [1.15 * w, top + 0.78 * ah],
              ] as Array<[number, number]>
            ).map(toWorld),
            trailWidth: 0.42 * ah * worldPerPx,
            worldPerPx,
          });
        }
        backdrop.position.x = (cx - w / 2) * worldPerPx;
        backdrop.position.y = -(cy - h / 2) * worldPerPx;

        if (reduceMotion) {
          smoke.update(8);
          draw();
        }
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(mount);
      const anchorEl = findAnchor();
      if (anchorEl) ro.observe(anchorEl);
      window.addEventListener("resize", place);

      // ---------- Animación ----------
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
      io.observe(mount);

      // Calidad adaptativa: mide ~2 s de fotogramas; si va lento baja la
      // resolución por pasos (nunca por debajo de 1x) y, en último caso, el bloom.
      let sampleStart = 0;
      let sampleFrames = 0;
      let checks = 0;
      const adapt = (now: number) => {
        if (checks >= 6) return;
        if (!sampleStart) sampleStart = now;
        sampleFrames++;
        const span = now - sampleStart;
        if (span < 2000) return;
        const fps = (sampleFrames * 1000) / span;
        sampleStart = 0;
        sampleFrames = 0;
        checks++;
        if (fps >= 45) return;
        if (pixelRatio > 1) {
          pixelRatio = Math.max(1, pixelRatio - 0.5);
          renderer.setPixelRatio(pixelRatio);
          composer?.setPixelRatio(pixelRatio);
          smoke.setPixelRatio(pixelRatio);
          place();
        } else if (composer) {
          composer.dispose();
          composer = null;
        }
      };

      let raf = 0;
      let elapsed = 8; // empieza con el humo ya formado
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!visible || document.hidden) return;
        elapsed += dt;
        smoke.update(elapsed);
        draw();
        adapt(now);
      };

      if (reduceMotion) {
        smoke.update(elapsed);
        draw();
      } else {
        raf = requestAnimationFrame(frame);
      }
      mount.dataset.heroModel = "golden-smoke";
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("resize", place);
        smoke.dispose();
        backdrop.geometry.dispose();
        (backdrop.material as T.MeshBasicMaterial).dispose();
        bgTex.dispose();
        composer?.dispose();
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
