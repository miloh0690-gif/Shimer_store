import type { Metadata } from 'next'
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google'
import { CartDrawer } from '@/components/carrito/CartDrawer'
import { CartProvider } from '@/components/carrito/CartProvider'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MotionRoot } from '@/components/motion/MotionRoot'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SHIMER — Librería, Papelería y Arte',
  description:
    'Librería, papelería y material de arte en Cochabamba. Cuadernos, marcadores, acuarelas y útiles para la escuela y el taller.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-BO" className={`${fredoka.variable} ${jakarta.variable}`}>
      <body>
        <MotionRoot>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <CartDrawer />
          </CartProvider>
        </MotionRoot>
      </body>
    </html>
  )
}