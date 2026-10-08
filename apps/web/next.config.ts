import type { NextConfig } from "next";

/**
 * Headers de seguridad del sitio. La API ya manda su helmet con CSP; esto es
 * para el HTML que ve el cliente, que es la superficie que realmente carga
 * scripts y guarda la sesion de Supabase.
 *
 * `X-Frame-Options` y `frame-ancestors` evitan el clickjacking. `nosniff` evita
 * que el navegador adivine el tipo de un recurso. `Referrer-Policy` no deja
 * que la URL de un pedido viaje a otro sitio.
 *
 * La CSP permite los estilos en linea porque Tailwind y los atributos de
 * animation los generan en el propio HTML.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' https://shimer-api.onrender.com",
      "style-src 'self' 'unsafe-inline' https://fonts.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://shimer-api.onrender.com https://rmqdpegyhmnxquswkvoy.supabase.co wss://rmqdpegyhmnxquswkvoy.supabase.co",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
