// Theme: Archway — Root layout wiring DM Serif Display + Inter; warm off-white page canvas

import './global.css'
import Header from '../shared/widgets/header/header'
import { Inter } from 'next/font/google'

export const metadata = {
  title: 'Eshop',
  description: 'Multi-vendor marketplace',
}

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

/*
 * DM Serif Display is loaded via <link> in global.css (or add it here
 * once next/font/google supports display fonts without subsets lock).
 * Add to global.css:
 *   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
 *
 * Then in tailwind.config.ts:
 *   fontFamily: {
 *     display: ['"DM Serif Display"', 'serif'],
 *     sans:    ['Inter', 'var(--font-inter)', 'sans-serif'],
 *     mono:    ['"JetBrains Mono"', 'monospace'],
 *   }
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          font-sans
          bg-[#F7F6F4]
          text-[#111110]
          antialiased
        `}
      >
        <Header />
        {children}
      </body>
    </html>
  )
}