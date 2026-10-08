'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Fondo del hero con parallax: el contenido se mueve más lento que el scroll.
 * Solo anima `y`, y con `prefers-reduced-motion` no se mueve nada.
 */
export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ backgroundImage: 'var(--gradiente-marca)' }}
    >
      <div
        ref={ref}
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/25 blur-3xl"
      />
      <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-marca-magenta/40 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-marca-rosa/35 blur-3xl" />
    </div>
  );
}