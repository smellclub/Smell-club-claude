"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Perfume destacado recortado (sin fondo) envuelto en cintas de seda
 * doradas que giran a su alrededor. Se dibuja en 2D (canvas) para que sea
 * liviano. Hay dos lienzos: uno detrás del frasco y otro delante, así la
 * seda pasa por detrás y por delante (parece que lo envuelve).
 */

type Ctx = CanvasRenderingContext2D;
type Frame = { back: Ctx; front: Ctx; W: number; H: number; t: number; ratio: number };
type Scene = (f: Frame) => void;

/** Alto del frasco respecto a la caja */
const BOTTLE_H = 0.64;

/**
 * bw no es el ancho real del frasco sino el radio base de las cintas: en
 * frascos muy finos se usa un mínimo para que la seda no quede pegada.
 */
function geometry(W: number, H: number, ratio: number) {
  const bh = H * BOTTLE_H;
  const bw = Math.max(bh * ratio, bh * 0.5);
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

function glowBehind(ctx: Ctx, W: number, H: number, ratio: number) {
  const { cx, cy, bh } = geometry(W, H, ratio);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, bh * 0.75);
  g.addColorStop(0, "rgba(197,162,90,0.22)");
  g.addColorStop(0.5, "rgba(197,162,90,0.07)");
  g.addColorStop(1, "rgba(197,162,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ---------- Cintas de seda ----------
function sedaScene(): Scene {
  const ribbons = [
    { R: 1.08, flat: 0.3, roll: -0.22, yc: 0.58, speed: 0.3, len: 4.6, width: 0.034, phase: 0 },
    { R: 1.22, flat: 0.24, roll: 0.16, yc: 0.2, speed: 0.24, len: 4.0, width: 0.024, phase: 2.2 },
    { R: 0.95, flat: 0.34, roll: -0.05, yc: 0.7, speed: 0.36, len: 3.4, width: 0.018, phase: 4.1 },
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
  return ({ back, front, W, H, t, ratio }) => {
    glowBehind(back, W, H, ratio);
    const { cx, cy, bh, bw } = geometry(W, H, ratio);
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

export function FeaturedAura({ image, alt, ratio }: { image: string; alt: string; ratio: number }) {
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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = sedaScene();

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
      scene({ back, front, W, H, t, ratio });
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
  }, [ratio]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={backRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div
        className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{ height: `${BOTTLE_H * 100}%`, aspectRatio: `${ratio}` }}
      >
        <Image src={image} alt={alt} fill priority sizes="(min-width: 768px) 20vw, 45vw" className="object-contain" />
      </div>
      <canvas ref={frontRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
    </div>
  );
}
