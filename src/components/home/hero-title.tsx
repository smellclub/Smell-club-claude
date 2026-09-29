"use client";

import { useEffect, useRef } from "react";

/**
 * "SMELLCLUB" en relieve 3D: cada letra gira hasta su sitio al entrar y el
 * conjunto se inclina siguiendo el ratón / dedo (perspectiva CSS, sin librerías).
 */
export function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      el.style.setProperty("--rx", `${(-current.y * 10).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(current.x * 14).toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const letters = "SMELLCLUB".split("");

  return (
    <div className="[perspective:900px]">
      <h1
        ref={ref}
        aria-label="Smellclub"
        className="hero-title flex justify-center font-display text-[14vw] leading-none font-medium uppercase sm:text-8xl md:justify-start md:text-[4.2rem] lg:text-[7rem]"
      >
        {letters.map((l, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`hero-letter hero-letter-ready ${i >= 5 ? "hero-letter-gold" : ""}`}
            style={{ "--d": `${300 + i * 90}ms` } as React.CSSProperties}
          >
            {l}
          </span>
        ))}
      </h1>
    </div>
  );
}
