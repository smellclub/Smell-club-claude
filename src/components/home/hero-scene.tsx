"use client";

import { useEffect, useRef, useState } from "react";
import type * as T from "three";
import { heroModel } from "@/config/hero-model";

/**
 * Escena 3D del hero: frasco de producto (Liquid Brun) girando sobre su eje
 * vertical con una estela de fragancia tipo seda alrededor.
 *
 * - Si existe public/models/liquid-brun.glb (hasModel) se carga con GLTFLoader
 *   (admite Draco y Meshopt). Si no, se muestra un PLACEHOLDER genérico sin marca.
 * - Cámara FIJA (sin zoom ni movimiento). Solo gira el frasco: 360° cada
 *   `secondsPerTurn` s, velocidad constante, y flota ±`floatPx` px.
 * - El frasco se coloca sobre el elemento [data-hero-anchor] visible:
 *   a la derecha en escritorio y bajo el texto en móvil (nunca sobre botones).
 * - three.js se carga bajo demanda, se pausa fuera de pantalla y respeta
 *   "reducir movimiento".
 */
export function HeroScene({ hasModel }: { hasModel: boolean }) {
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
      const { createFragranceTrail } = await import("./hero-3d/fragrance-trail");
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

      // ---------- Cámara fija (perspectiva suave de anuncio de perfume) ----------
      const CAMERA_Z = 10;
      const FOV = 26;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      camera.position.set(0, 0, CAMERA_Z);
      camera.lookAt(0, 0, 0);

      // ---------- Fondo negro con halo cálido muy suave detrás del producto ----------
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = bgCanvas.height = 1024;
      const bg = bgCanvas.getContext("2d")!;
      bg.fillStyle = "#0a0a0a";
      bg.fillRect(0, 0, 1024, 1024);
      const bgGrad = bg.createRadialGradient(512, 512, 0, 512, 512, 150);
      bgGrad.addColorStop(0, "#3a2d16");
      bgGrad.addColorStop(0.55, "#1a140a");
      bgGrad.addColorStop(1, "#0a0a0a");
      bg.fillStyle = bgGrad;
      bg.fillRect(0, 0, 1024, 1024);
      const bgTex = new THREE.CanvasTexture(bgCanvas);
      bgTex.colorSpace = THREE.SRGBColorSpace;
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bgTex }));
      backdrop.position.z = -6;
      scene.add(backdrop);

      // ---------- Escenario: stage (posición/escala) > float (flotación) > producto (giro) ----------
      const stage = new THREE.Group();
      const floater = new THREE.Group();
      const product = new THREE.Group();
      scene.add(stage);
      stage.add(floater);
      floater.add(product);

      // Sombra de contacto suave (textura, sin coste de sombras reales)
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = shadowCanvas.height = 256;
      const sh = shadowCanvas.getContext("2d")!;
      const shGrad = sh.createRadialGradient(128, 128, 0, 128, 128, 128);
      shGrad.addColorStop(0, "rgba(0,0,0,0.75)");
      shGrad.addColorStop(0.5, "rgba(0,0,0,0.35)");
      shGrad.addColorStop(1, "rgba(0,0,0,0)");
      sh.fillStyle = shGrad;
      sh.fillRect(0, 0, 256, 256);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.32),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.03;
      stage.add(shadow);

      // ---------- Producto: modelo real o placeholder ----------
      let usingPlaceholder = true;
      if (hasModel) {
        try {
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
          const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
          const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
          const loader = new GLTFLoader();
          const draco = new DRACOLoader();
          draco.setDecoderPath("/draco/");
          loader.setDRACOLoader(draco);
          loader.setMeshoptDecoder(MeshoptDecoder);
          const gltf = await loader.loadAsync(heroModel.path);
          draco.dispose();
          if (disposed) return;
          const model = gltf.scene;
          model.rotation.x = THREE.MathUtils.degToRad(heroModel.uprightRotationXDeg);
          model.updateMatrixWorld(true);
          // Normaliza: 1 unidad de alto, centrado en X/Z y con la base en y = 0
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const wrapper = new THREE.Group();
          wrapper.add(model);
          const s = 1 / Math.max(size.y, 1e-6);
          model.position.set(-(box.min.x + size.x / 2), -box.min.y, -(box.min.z + size.z / 2));
          wrapper.scale.setScalar(s);
          model.traverse((o) => {
            const mesh = o as T.Mesh;
            if (!mesh.isMesh) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if ("envMapIntensity" in m) (m as T.MeshStandardMaterial).envMapIntensity = 1;
            });
          });
          product.add(wrapper);
          usingPlaceholder = false;
        } catch (err) {
          console.warn("[hero] No se pudo cargar el modelo 3D, se usa el placeholder.", err);
        }
      }
      if (usingPlaceholder) {
        const { createPlaceholderBottle } = await import("./hero-3d/placeholder-bottle");
        if (disposed) return;
        product.add(createPlaceholderBottle(THREE));
      }

      // ---------- Estela de fragancia ----------
      const trail = createFragranceTrail(THREE);
      floater.add(trail.group);

      // ---------- Iluminación de producto ----------
      scene.add(new THREE.AmbientLight(0xffffff, 0.12));
      const key = new THREE.DirectionalLight(0xffffff, 2.2); // luz principal blanca y suave
      key.position.set(-3, 4, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff4e6, 0.35);
      fill.position.set(4, 1, 5);
      scene.add(fill);
      const rim = new THREE.SpotLight(0xe0b86a, 60, 20, Math.PI / 6, 0.8, 1.2); // contraluz dorado
      scene.add(rim);
      scene.add(rim.target);
      const rim2 = new THREE.SpotLight(0xd8b060, 30, 20, Math.PI / 6, 0.8, 1.2);
      scene.add(rim2);
      scene.add(rim2.target);

      // ---------- Bloom controlado (solo escritorio) ----------
      let composer: { render(): void; setSize(w: number, h: number): void; setPixelRatio(r: number): void; dispose(): void } | null = null;
      if (!isSmall) {
        const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
        const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
        const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
        const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");
        if (disposed) return;
        const c = new EffectComposer(renderer);
        c.addPass(new RenderPass(scene, camera));
        c.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.22, 0.45, 0.88));
        c.addPass(new OutputPass());
        composer = c;
      }

      // ---------- Colocación según el ancla del layout ----------
      const layout = { worldPerPx: 0.01, scale: 1 };
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
        layout.worldPerPx = visibleH / h;

        const anchor = findAnchor();
        const mRect = mount.getBoundingClientRect();
        const rect = anchor?.getBoundingClientRect();
        const cx = rect ? rect.left - mRect.left + rect.width / 2 : w * 0.72;
        const cy = rect ? rect.top - mRect.top + rect.height / 2 : h * 0.5;
        const aw = rect?.width ?? w * 0.4;
        const ah = rect?.height ?? h * 0.7;
        // Alto del frasco en px: cabe en el ancla contando la estela alrededor
        const bottlePx = Math.min(ah * 0.78, aw / 1.5);
        layout.scale = bottlePx * layout.worldPerPx;
        stage.scale.setScalar(layout.scale);
        stage.position.set(
          (cx - w / 2) * layout.worldPerPx,
          -(cy - h / 2) * layout.worldPerPx - layout.scale / 2,
          0,
        );
        backdrop.position.x = stage.position.x;
        backdrop.position.y = stage.position.y + layout.scale / 2;

        const bx = stage.position.x;
        const by = stage.position.y + layout.scale / 2;
        rim.position.set(bx + 2.5 * layout.scale, by + 1.5 * layout.scale, -3);
        rim.target.position.set(bx, by, 0);
        rim2.position.set(bx - 2.5 * layout.scale, by + 0.8 * layout.scale, -3);
        rim2.target.position.set(bx, by, 0);
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(mount);
      const anchorEl = findAnchor();
      if (anchorEl) ro.observe(anchorEl);
      window.addEventListener("resize", place);

      // ---------- Animación ----------
      const baseRotation = THREE.MathUtils.degToRad(heroModel.initialRotationYDeg);
      const turnSpeed = (Math.PI * 2) / heroModel.secondsPerTurn;
      const applyTime = (t: number) => {
        product.rotation.y = baseRotation + t * turnSpeed; // velocidad constante
        const floatAmp = (heroModel.floatPx * layout.worldPerPx) / layout.scale;
        floater.position.y = Math.sin((t / heroModel.floatSeconds) * Math.PI * 2) * floatAmp;
        trail.update(t);
      };
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
        applyTime(elapsed);
        draw();
      };

      if (reduceMotion) {
        applyTime(0);
        draw();
      } else {
        raf = requestAnimationFrame(frame);
      }
      mount.dataset.heroModel = usingPlaceholder ? "placeholder" : "liquid-brun";
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("resize", place);
        trail.dispose();
        scene.traverse((obj) => {
          const mesh = obj as T.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            (m as T.MeshStandardMaterial).map?.dispose();
            m.dispose();
          });
        });
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
  }, [hasModel]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] [&>canvas]:h-full [&>canvas]:w-full ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
