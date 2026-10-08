'use client'

import { useEffect, useRef } from 'react'
import { useMotionListo } from './motion-engine'

export type RevealProps = {
  children: React.ReactNode;
  /** Retraso en segundos, para escalonar elementos de una misma fila. */
  delay?: number;
  /** Distancia vertical de partida en pixeles. */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
};

/**
 * Revela su contenido al entrar en pantalla: opacidad 0->1 y translateY->0.
 * Solo anima transform y opacity.
 *
 * El motor de animacion se descarga diferido, asi que el contenido se
 * renderiza visible desde el principio y la animacion se aplica recien cuando
 * hay motor y el elemento sigue por debajo del borde: si el visitante ya lo
 * esta viendo, no hay nada que revelar.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;
  const { gsap } = useMotionListo();

  useEffect(() => {
    const el = ref.current;
    if (!el || !gsap) return;

    // Si ya esta en pantalla no hay entrada que animar.
    const caja = el.getBoundingClientRect();
    if (caja.top < window.innerHeight * 0.85) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          delay,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y, gsap]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
