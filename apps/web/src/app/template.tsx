/**
 * Next.js solo vuelve a montar `layout.tsx` al navegar, asi que la animacion de
 * entrada de pagina va en `template.tsx`, que si se recrea en cada ruta.
 *
 * Es un server component a proposito: la entrada es un fade con keyframes de
 * CSS, y asi `motion` no entra al bundle de la primera carga de cada ruta.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entrada-pagina">{children}</div>;
}
