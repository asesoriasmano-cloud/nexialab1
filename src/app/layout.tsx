import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CitaPro - Sistema de Reservas para Negocios',
  description: 'Gestiona tus citas, clientes y pagos en un solo lugar. La plataforma de reservas más completa para salones, barberías, estudios y más.',
  keywords: 'reservas online, citas, salón de belleza, barbería, sistema de agendamiento',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
