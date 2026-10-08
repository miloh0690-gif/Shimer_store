'use client'

import { useEffect } from 'react'
import { arrancarMotion, motionActual } from './motion-engine'

type ConIdle = (cb: () => void) => number

/**
 * Raiz de la animacion del sitio: pide el motor diferido (gsap + ScrollTrigger
 * + lenis) cuando el navegador queda libre, para que ninguno de los tres
 * entre en el bundle del primer render. Mientras se descarga, el sitio usa el
 * scroll nativo y todo el contenido se ve con normalidad.
 *
 * Si el usuario pidio menos movimiento, `arrancarMotion` no descarga nada y
 * este componente no hace nada.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const pedir = (globalThis as unknown as { requestIdleCallback?: ConIdle })
      .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const id = pedir(() => arrancarMotion());

    return () => {
      if (typeof id === 'number') window.clearTimeout(id);
      motionActual().destruir?.();
    };
  }, []);

  return <>{children}</>;
}
