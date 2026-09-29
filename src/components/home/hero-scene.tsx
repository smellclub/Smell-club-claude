"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Escena 3D del hero: frasco de Afnan 9PM Night Out (cristal negro moteado,
 * "9" plateado, tapón esférico facetado) y partículas doradas (bruma).
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

      // ---------- Frasco: Afnan 9PM Night Out ----------
      // Frasco plano rectangular con hombros redondeados, cristal negro
      // moteado (efecto granito), gran "9" plateado y tapón esférico facetado.
      const bottle = new THREE.Group();
      scene.add(bottle);

      const bodyFont =
        getComputedStyle(document.documentElement).getPropertyValue("--font-inter").trim() || "Arial, sans-serif";
      const displayFont =
        getComputedStyle(document.documentElement).getPropertyValue("--font-cormorant").trim() || "Georgia, serif";
      await Promise.all([
        document.fonts.load(`600 100px ${displayFont}`),
        document.fonts.load(`500 100px ${bodyFont}`),
        document.fonts.load(`italic 500 100px ${displayFont}`),
      ]).catch(() => undefined);
      if (disposed) return;

      // Textura moteada (granito oscuro con destellos)
      const speckCanvas = document.createElement("canvas");
      speckCanvas.width = speckCanvas.height = 512;
      const sc = speckCanvas.getContext("2d")!;
      sc.fillStyle = "#121214";
      sc.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 7000; i++) {
        const v = Math.random();
        const shade = v < 0.7 ? 18 + Math.random() * 18 : v < 0.95 ? 45 + Math.random() * 35 : 150 + Math.random() * 100;
        sc.fillStyle = `rgba(${shade},${shade},${shade + 3},${0.3 + Math.random() * 0.6})`;
        const r = Math.random() < 0.92 ? 0.5 + Math.random() * 1 : 1.4 + Math.random() * 1.4;
        sc.beginPath();
        sc.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
        sc.fill();
      }
      const speckTex = new THREE.CanvasTexture(speckCanvas);
      speckTex.colorSpace = THREE.SRGBColorSpace;
      speckTex.wrapS = speckTex.wrapT = THREE.RepeatWrapping;
      speckTex.repeat.set(1.4, 1.4);
      const bumpTex = new THREE.CanvasTexture(speckCanvas);
      bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
      bumpTex.repeat.set(1.4, 1.4);

      const W = 1.2;
      const H = 1.72;
      const D = 0.42;
      const shoulder = 0.34;
      const foot = 0.08;
      const shape = new THREE.Shape();
      shape.moveTo(-W / 2 + foot, -H / 2);
      shape.lineTo(W / 2 - foot, -H / 2);
      shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + foot);
      shape.lineTo(W / 2, H / 2 - shoulder);
      shape.quadraticCurveTo(W / 2, H / 2, W / 2 - shoulder, H / 2);
      shape.lineTo(-W / 2 + shoulder, H / 2);
      shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - shoulder);
      shape.lineTo(-W / 2, -H / 2 + foot);
      shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + foot, -H / 2);
      const bevel = 0.05;
      const bodyGeo = new THREE.ExtrudeGeometry(shape, {
        depth: D - bevel * 2,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 6,
        curveSegments: 24,
      });
      bodyGeo.translate(0, 0, -(D - bevel * 2) / 2);
      const granite = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: speckTex,
        bumpMap: bumpTex,
        bumpScale: 0.6,
        metalness: 0.2,
        roughness: 0.45,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.1,
      });
      const body = new THREE.Mesh(bodyGeo, granite);
      bottle.add(body);

      // Etiqueta frontal: gran "9" plateado, "pm" vertical, "Night Out", AFNAN
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 640;
      labelCanvas.height = 920;
      const lc = labelCanvas.getContext("2d")!;
      lc.clearRect(0, 0, 640, 920);
      const silver = lc.createLinearGradient(0, 80, 0, 760);
      silver.addColorStop(0, "#f4f1ea");
      silver.addColorStop(0.45, "#cfcac0");
      silver.addColorStop(0.55, "#9d978d");
      silver.addColorStop(1, "#e7e3da");
      lc.fillStyle = silver;
      lc.textAlign = "center";
      lc.textBaseline = "alphabetic";
      // "9" alto (cifra de caja alta, estirada verticalmente como en el frasco)
      lc.save();
      lc.translate(340, 640);
      lc.scale(1.05, 1.45);
      lc.font = `500 440px ${bodyFont}`;
      lc.fillText("9", 0, 0);
      lc.restore();
      lc.save();
      lc.translate(205, 470);
      lc.rotate(-Math.PI / 2);
      lc.font = `italic 500 96px ${displayFont}`;
      lc.fillText("pm", 0, 0);
      lc.restore();
      lc.font = `italic 500 78px ${displayFont}`;
      lc.fillText("Night Out", 320, 735);
      lc.fillStyle = "#d8d3c9";
      lc.font = `600 34px ${displayFont}`;
      if ("letterSpacing" in lc) (lc as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
      lc.fillText("AFNAN", 320, 810);
      lc.font = `500 20px ${displayFont}`;
      lc.fillText("EAU DE PARFUM", 320, 850);
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.colorSpace = THREE.SRGBColorSpace;
      labelTex.anisotropy = 8;
      const labelMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        transparent: true,
        metalness: 0.85,
        roughness: 0.28,
        envMapIntensity: 1.8,
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), labelMat);
      label.position.set(0, -0.12, D / 2 + 0.002);
      bottle.add(label);
      const labelBack = label.clone();
      labelBack.position.z = -(D / 2 + 0.002);
      labelBack.rotation.y = Math.PI;
      bottle.add(labelBack);

      // Cuello y tapón esférico facetado (metal oscuro)
      const gunmetal = new THREE.MeshStandardMaterial({
        color: 0x3b3b3e,
        metalness: 0.9,
        roughness: 0.35,
        bumpMap: bumpTex,
        bumpScale: 0.4,
        envMapIntensity: 1.6,
      });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.14, 32), gunmetal);
      neck.position.y = H / 2 + 0.06;
      bottle.add(neck);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 40, 28),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          map: speckTex,
          bumpMap: bumpTex,
          bumpScale: 0.8,
          metalness: 0.45,
          roughness: 0.4,
          clearcoat: 0.8,
          clearcoatRoughness: 0.15,
          envMapIntensity: 1.3,
        }),
      );
      cap.position.y = H / 2 + 0.36;
      bottle.add(cap);
      bottle.position.y = 0;
      // Centra el conjunto verticalmente
      bottle.children.forEach((c) => (c.position.y -= 0.2));

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
