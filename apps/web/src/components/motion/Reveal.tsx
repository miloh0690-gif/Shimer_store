'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export type RevealProps = {
  children: React.ReactNode;
  /** Retraso en segundos, para escalonar elementos de una misma fila. */
  delay?: number;
  /** Distancia vertical de partida en píxeles. */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
};

/**
 * Revela su contenido al entrar en pantalla: opacidad 0→1 y translateY→0.
 * Solo anima transform y opacity. Con `prefers-reduced-motion` el contenido
 * queda visible y no se crea ninguna animación.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

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
  }, [delay, y]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}