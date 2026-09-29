"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Perfume destacado recortado (sin fondo) envuelto en una estela animada.
 * Tres estilos, dibujados en 2D (canvas) para que sea liviano:
 *  - "seda":  cintas doradas que giran alrededor del frasco.
 *  - "humo":  humo dorado que sube en espiral.
 *  - "polvo": remolino de polvo de oro orbitando.
 * Hay dos lienzos: uno detrás del frasco y otro delante, así la estela
 * pasa por detrás y por delante (parece que lo envuelve).
 */
export type AuraStyle = "seda" | "humo" | "polvo";

type Ctx = CanvasRenderingContext2D;
type Frame = { back: Ctx; front: Ctx; W: number; H: number; t: number };
type Scene = (f: Frame) => void;

/** Proporción de la foto recortada (ancho / alto) */
const BOTTLE_RATIO = 312 / 500;
/** Alto del frasco respecto a la caja */
const BOTTLE_H = 0.62;

function geometry(W: number, H: number) {
  const bh = H * BOTTLE_H;
  const bw = bh * BOTTLE_RATIO;
  return { cx: W / 2, cy: H / 2, bh, bw };
}

/** Punto de una órbita elíptica inclinada; z > 0 = delante del frasco */
function orbit(cx: number, yc: number, R: number, flat: number, roll: number, a: number) {
  const x = R * Math.cos(a);
  const y = R * flat * Math.sin(a);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return { x: cx + x * cr - y * sr, y: yc + x * sr + y * cr, z: Math.sin(a) };
}

function mix(a: number[], b: number[], k: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * k));
}

const CHAMPAGNE = [150, 112, 58];
const GOLD = [214, 172, 98];
const IVORY = [252, 240, 212];

function glowBehind(ctx: Ctx, W: number, H: number) {
  const { cx, cy, bh } = geometry(W, H);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, bh * 0.75);
  g.addColorStop(0, "rgba(197,162,90,0.22)");
  g.addColorStop(0.5, "rgba(197,162,90,0.07)");
  g.addColorStop(1, "rgba(197,162,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---------- Opción 1: cintas de seda ----------
function sedaScene(): Scene {
  const ribbons = [
    { R: 1.08, flat: 0.3, roll: -0.22, yc: 0.64, speed: 0.3, len: 4.6, width: 0.034, phase: 0 },
    { R: 1.22, flat: 0.24, roll: 0.16, yc: 0.34, speed: 0.24, len: 4.0, width: 0.024, phase: 2.2 },
    { R: 0.95, flat: 0.34, roll: -0.05, yc: 0.86, speed: 0.36, len: 3.4, width: 0.018, phase: 4.1 },
  ];
  const N = 120;
  type P = { x: number; y: number; hw: number; z: number; light: number; spec: number; fade: number };
  // Dibuja un tramo continuo como un solo polígono (sin costuras entre trozos)
  const drawRun = (ctx: Ctx, run: P[], front: boolean) => {
    if (run.length < 2) return;
    const a = run[0];
    const b = run[run.length - 1];
    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    const steps = Math.min(run.length, 8);
    for (let k = 0; k < steps; k++) {
      const p = run[Math.round((k / (steps - 1)) * (run.length - 1))];
      const col = mix(mix(CHAMPAGNE, GOLD, p.light), IVORY, p.spec * p.light);
      const alpha = (front ? 0.62 : 0.8) * (0.35 + 0.65 * p.light) * p.fade;
      grad.addColorStop(k / (steps - 1), `rgba(${col[0]},${col[1]},${col[2]},${alpha.toFixed(3)})`);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    run.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y - p.hw) : ctx.moveTo(p.x, p.y - p.hw)));
    for (let i = run.length - 1; i >= 0; i--) ctx.lineTo(run[i].x, run[i].y + run[i].hw);
    ctx.closePath();
    ctx.fill();
    // Filo brillante de la seda
    ctx.strokeStyle = `rgba(${IVORY[0]},${IVORY[1]},${IVORY[2]},${front ? 0.35 : 0.22})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    run.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y - p.hw) : ctx.moveTo(p.x, p.y - p.hw)));
    ctx.stroke();
  };
  return ({ back, front, W, H, t }) => {
    glowBehind(back, W, H);
    const { cx, cy, bh, bw } = geometry(W, H);
    for (const r of ribbons) {
      const head = r.phase + t * r.speed;
      const yc = cy - bh / 2 + bh * r.yc;
      const R = bw * r.R;
      let run: P[] = [];
      let runFront: boolean | null = null;
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const a = head - s * r.len;
        const o = orbit(cx, yc, R, r.flat, r.roll, a);
        const twist = Math.cos(a * 0.9 + t * 0.5);
        const taper = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.1)), 0.7);
        const p: P = {
          x: o.x,
          y: o.y,
          z: o.z,
          hw: r.width * H * taper * (0.3 + 0.7 * Math.abs(twist)),
          light: (o.z + 1) / 2,
          spec: Math.pow(Math.abs(twist), 6),
          fade: Math.pow(1 - s, 0.7),
        };
        const isFront = o.z > 0;
        if (runFront === null) runFront = isFront;
        if (isFront !== runFront) {
          run.push(p); // une los tramos
          drawRun(runFront ? front : back, run, runFront);
          run = [p];
          runFront = isFront;
        } else {
          run.push(p);
        }
      }
      if (runFront !== null) drawRun(runFront ? front : back, run, runFront);
    }
  };
}

// ---------- Opción 2: humo dorado ----------
function smokeSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(236,200,138,0.9)");
  grad.addColorStop(0.35, "rgba(214,170,100,0.35)");
  grad.addColorStop(1, "rgba(214,170,100,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function humoScene(small: boolean): Scene {
  const sprite = smokeSprite();
  const N = small ? 120 : 220;
  const parts = Array.from({ length: N }, (_, i) => ({
    a0: Math.random() * Math.PI * 2,
    off: i / N + Math.random() * 0.02,
    spin: 0.9 + Math.random() * 0.6,
    size: 0.7 + Math.random() * 0.6,
  }));
  const LIFE = 11;
  const SEG = small ? 70 : 110;
  const wisps = Array.from({ length: small ? 4 : 6 }, (_, i) => ({
    a0: (i / (small ? 4 : 6)) * Math.PI * 2 + Math.random() * 0.5,
    turns: 1.1 + Math.random() * 0.5,
    speed: 0.28 + Math.random() * 0.12,
    width: 0.7 + Math.random() * 0.6,
    alpha: 0.7 + Math.random() * 0.3,
  }));
  return ({ back, front, W, H, t }) => {
    glowBehind(back, W, H);
    const { cx, cy, bh, bw } = geometry(W, H);
    const base = cy + bh * 0.5;
    back.globalCompositeOperation = "lighter";
    front.globalCompositeOperation = "lighter";
    for (const p of parts) {
      const age = (t / LIFE + p.off) % 1;
      const a = p.a0 + age * Math.PI * 2 * 1.6 * p.spin + t * 0.1;
      const r = bw * (0.62 + 0.3 * age);
      const y = base - age * bh * 1.05 + Math.sin(a) * r * 0.26;
      const x = cx + Math.cos(a) * r + Math.sin(age * 6 + p.a0) * bw * 0.05;
      const z = Math.sin(a);
      const size = H * (0.05 + 0.11 * age) * p.size;
      // Se desvanece al subir para no cortarse contra el borde
      const topFade = Math.min(1, Math.max(0, (y - size) / (H * 0.12)));
      const alpha = Math.pow(Math.sin(Math.PI * age), 1.4) * (z > 0 ? 0.15 : 0.11) * topFade;
      const ctx = z > 0 ? front : back;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    }
    back.globalAlpha = front.globalAlpha = 1;

    // Hebras de humo en espiral que suben envolviendo el frasco
    back.lineCap = front.lineCap = "round";
    for (const w of wisps) {
      let prev: { x: number; y: number } | null = null;
      for (let i = 0; i <= SEG; i++) {
        const s = i / SEG;
        const a = w.a0 + s * Math.PI * 2 * w.turns + t * w.speed;
        const r = bw * (0.6 + 0.28 * s) + Math.sin(s * 7 + t * 0.6 + w.a0) * bw * 0.06;
        const x = cx + Math.cos(a) * r;
        const y = base - s * bh * 1.08 + Math.sin(a) * r * 0.24 + Math.sin(s * 5 - t * 0.4 + w.a0) * bh * 0.015;
        if (prev) {
          const z = Math.sin(a);
          const ctx = z > 0 ? front : back;
          const k = Math.pow(Math.sin(Math.PI * s), 1.2) * (z > 0 ? 1 : 0.6) * w.alpha;
          const width = (1.2 + 7 * s) * w.width;
          ctx.strokeStyle = `rgba(226,188,120,${(k * 0.07).toFixed(3)})`;
          ctx.lineWidth = width * 5;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.strokeStyle = `rgba(250,232,196,${(k * 0.32).toFixed(3)})`;
          ctx.lineWidth = width;
          ctx.stroke();
        }
        prev = { x, y };
      }
    }
    back.globalCompositeOperation = front.globalCompositeOperation = "source-over";
  };
}

// ---------- Opción 3: polvo de oro ----------
function polvoScene(small: boolean): Scene {
  const N = small ? 260 : 520;
  const bands = [
    { R: 1.05, flat: 0.28, roll: -0.2, yc: 0.55 },
    { R: 1.2, flat: 0.22, roll: 0.25, yc: 0.4 },
  ];
  const dots = Array.from({ length: N }, () => {
    const band = bands[Math.random() < 0.6 ? 0 : 1];
    const spread = 1 + (Math.random() - 0.5) * 0.45;
    return {
      band,
      spread,
      a0: Math.random() * Math.PI * 2,
      speed: 0.22 * Math.pow(1 / spread, 1.5),
      dy: (Math.random() - 0.5) * 0.06,
      tw: Math.random() * Math.PI * 2,
      w: 0.6 + Math.random() * 1.1,
    };
  });
  return ({ back, front, W, H, t }) => {
    glowBehind(back, W, H);
    const { cx, cy, bh, bw } = geometry(W, H);
    back.globalCompositeOperation = "lighter";
    front.globalCompositeOperation = "lighter";
    back.lineCap = front.lineCap = "round";
    for (const d of dots) {
      const a = d.a0 + t * d.speed;
      const R = bw * d.band.R * d.spread;
      const yc = cy - bh / 2 + bh * (d.band.yc + d.dy);
      const p1 = orbit(cx, yc, R, d.band.flat, d.band.roll, a);
      const p0 = orbit(cx, yc, R, d.band.flat, d.band.roll, a - 0.22);
      const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + d.tw);
      const light = (p1.z + 1) / 2;
      const col = mix(GOLD, IVORY, light * tw);
      const ctx = p1.z > 0 ? front : back;
      const alpha = (0.25 + 0.6 * light) * tw;
      const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      grad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      grad.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${alpha.toFixed(3)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.w * (0.7 + 0.5 * light);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    back.globalCompositeOperation = front.globalCompositeOperation = "source-over";
  };
}

export function FeaturedAura({ variant, image, alt }: { variant: AuraStyle; image: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const b = backRef.current;
    const f = frontRef.current;
    if (!wrap || !b || !f) return;
    const back = b.getContext("2d");
    const front = f.getContext("2d");
    if (!back || !front) return;

    const small = window.innerWidth < 768;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = variant === "seda" ? sedaScene() : variant === "humo" ? humoScene(small) : polvoScene(small);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let t = 6; // arranca con la estela ya formada
    const render = () => {
      for (const [c, ctx] of [
        [b, back],
        [f, front],
      ] as const) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      scene({ back, front, W, H, t });
    };
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      for (const c of [b, f]) {
        c.width = Math.max(1, Math.round(W * dpr));
        c.height = Math.max(1, Math.round(H * dpr));
      }
      render();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      t += dt;
      render();
    };
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [variant]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={backRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div
        className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{ height: `${BOTTLE_H * 100}%`, aspectRatio: `${BOTTLE_RATIO}` }}
      >
        <Image src={image} alt={alt} fill priority sizes="(min-width: 768px) 20vw, 45vw" className="object-contain" />
      </div>
      <canvas ref={frontRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
    </div>
  );
}
