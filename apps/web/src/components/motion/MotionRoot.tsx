'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

/**
 * Raíz de la animación del sitio: scroll suave con Lenis sincronizado con
 * ScrollTrigger. Se monta una sola vez desde layout.tsx y se destruye al
 * desmontar, así que navegar entre páginas no acumula listeners.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1 });

    lenis.on('scroll', ScrollTrigger.update);
    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time * 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}