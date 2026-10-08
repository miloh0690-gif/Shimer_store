import { useEffect, useState } from 'react'

import type { gsap as GsapCore } from 'gsap'
import type { ScrollTrigger as ScrollTriggerCore } from 'gsap/ScrollTrigger'
import type LenisCore from 'lenis'

/**
 * Motor de animación diferido.
 *
 * gsap, ScrollTrigger y lenis pesan lo suficiente para atrasar el primer
 * render en moviles, asi que se cargan con `import()` dinamico recien
 * cuando la pagina quedo quieta. Los componentes que animan (Reveal,
 * HeroParallax) se suscriben con `onMotion` y recien ahi montan su
 * animacion: mientras tanto el contenido se ve normal, sin opacity 0.
 *
 * Con `prefers-reduced-motion` no se carga nada y se avisa igual, para que
 * los suscriptores leen y no queden esperando.
 */

export type MotionEstado = {
  gsap: typeof GsapCore | null;
  ScrollTrigger: typeof ScrollTriggerCore | null;
  lenis: LenisCore | null;
  destruir: (() => void) | null;
};

const estadoInicial: MotionEstado = {
  gsap: null,
  ScrollTrigger: null,
  lenis: null,
  destruir: null,
};

let estado: MotionEstado = estadoInicial;
let arrancando: Promise<void> | null = null;
const escuchas = new Set<() => void>();

function avisar() {
  for (const cb of [...escuchas]) cb();
}

export function motionActual(): MotionEstado {
  return estado;
}

/**
 * Se suscribe a la llegada del motor. Si ya esta listo, invoca la callback de
 * inmediato. Devuelve la funcion para cancelar la suscripcion.
 */
export function onMotion(cb: () => void): () => void {
  if (estado.gsap !== null) {
    cb();
    return () => {};
  }
  escuchas.add(cb);
  return () => {
    escuchas.delete(cb);
  };
}

/** Si el usuario pidio menos movimiento no se descarga nada. */
function quiereMovimientoReducido(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Arranca la carga diferida. Es idempotente. */
export function arrancarMotion(): void {
  if (arrancando !== null) return;

  arrancando = (async () => {
    if (quiereMovimientoReducido()) {
      avisar();
      return;
    }

    const [modGsap, modSt, modLenis] = await Promise.all([
      import('gsap') as Promise<{ gsap?: typeof GsapCore; default?: { gsap?: typeof GsapCore } }>,
      import('gsap/ScrollTrigger') as Promise<{
        ScrollTrigger?: typeof ScrollTriggerCore;
        default?: { ScrollTrigger?: typeof ScrollTriggerCore };
      }>,
      import('lenis') as Promise<{ default: typeof LenisCore }>,
    ]);

    // Los tres paquetes exponen formas distintas segun el empaquetador: se
    // prueban en orden el named export y el default, y si el modulo viene en
    // CommonJS tambien dentro del default.
    const gsap = modGsap.gsap ?? modGsap.default?.gsap;
    const ScrollTrigger = modSt.ScrollTrigger ?? modSt.default?.ScrollTrigger;
    const Lenis = modLenis.default;

    if (!gsap || !ScrollTrigger || !Lenis) {
      avisar();
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

    estado = {
      gsap,
      ScrollTrigger,
      lenis,
      destruir: () => {
        cancelAnimationFrame(frame);
        lenis.destroy();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      },
    };

    avisar();
  })();
}

/** Devuelve el motor a su estado inicial. Solo para pruebas. */
export function reiniciarMotion(): void {
  estado.destruir?.();
  estado = estadoInicial;
  arrancando = null;
  escuchas.clear();
}

/**
 * Devuelve el estado del motor y se vuelve a renderizar cuando llega.
 * El estado arranca con `gsap: null`, o sea "todavia no hay que animar".
 */
export function useMotionListo(): MotionEstado {
  const [estadoLocal, setEstadoLocal] = useState<MotionEstado>(motionActual);
  useEffect(() => onMotion(() => setEstadoLocal({ ...motionActual() })), []);
  return estadoLocal;
}
