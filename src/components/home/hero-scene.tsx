"use client";

import { useEffect, useRef, useState } from "react";
import type * as T from "three";

/**
 * Escena 3D del hero: "escultura de fragancia" abstracta (seda, vapor,
 * líquido y luz dorada) a la derecha del título, con una estela de seda
 * que atraviesa la pantalla.
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
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
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
      scene.add(sculpture.crossing);

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
        // Render target con MSAA: sin él, el post-proceso pierde el antialiasing
        const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
        const c = new EffectComposer(renderer, rt);
        c.addPass(new RenderPass(scene, camera));
        c.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.14, 0.35, 0.9));
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

        const anchor = findAnchor();
        const mRect = mount.getBoundingClientRect();
        const rect = anchor?.getBoundingClientRect();
        const cx = rect ? rect.left - mRect.left + rect.width / 2 : w * 0.72;
        const cy = rect ? rect.top - mRect.top + rect.height / 2 : h * 0.5;
        const aw = rect?.width ?? w * 0.4;
        const ah = rect?.height ?? h * 0.7;
        // ~38 % del alto del hero, siempre con aire dentro del ancla
        const wide = aw < w * 0.7; // escritorio: ancla a la derecha del texto
        const sizePx = wide ? Math.min(h * 0.58, ah * 1.0, aw * 0.95) : Math.min(h * 0.5, ah * 1.0, aw * 0.9);
        const scale = sizePx * worldPerPx;
        stage.scale.setScalar(scale);
        stage.position.set((cx - w / 2) * worldPerPx, -(cy - h / 2) * worldPerPx, 0);

        // Recorrido de la estela: entra por un borde, pasa por la escultura y
        // sale por el otro, siempre por fuera de la zona de textos y botones.
        const top = cy - ah / 2;
        const left = cx - aw / 2;
        const px: Array<[number, number]> = wide
          ? [
              [-0.08 * w, 0.98 * h],
              [0.3 * w, 0.9 * h],
              [left + 0.12 * aw, top + 0.92 * ah],
              [cx, cy],
              [left + 0.88 * aw, top + 0.06 * ah],
              [0.9 * w, 0.03 * h],
              [1.08 * w, -0.08 * h],
            ]
          : [
              [-0.12 * w, top + 0.18 * ah],
              [0.22 * w, top + 0.3 * ah],
              [cx, cy],
              [0.78 * w, top + 0.7 * ah],
              [1.12 * w, top + 0.82 * ah],
            ];
        sculpture.setPath(
          px.map(([x, y]) => new THREE.Vector3((x - w / 2) * worldPerPx, -(y - h / 2) * worldPerPx, 0)),
          scale,
        );
        backdrop.position.x = stage.position.x;
        backdrop.position.y = stage.position.y;

        rim.position.set(stage.position.x + 2.2 * scale, stage.position.y + 1.4 * scale, -3);
        rim.target.position.copy(stage.position);
        if (reduceMotion) {
          sculpture.update(0);
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
          place();
        } else if (composer) {
          composer.dispose();
          composer = null;
        }
      };

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
        adapt(now);
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
