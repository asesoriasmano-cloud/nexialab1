'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Users, Scissors,
  UserCog, Settings, ChevronRight, LogOut, CalendarDays,
  BarChart3, Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/calendar', icon: CalendarDays, label: 'Calendario' },
  { href: '/dashboard/appointments', icon: Calendar, label: 'Citas' },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  { href: '/dashboard/services', icon: Scissors, label: 'Servicios' },
  { href: '/dashboard/staff', icon: UserCog, label: 'Personal' },
  { href: '/dashboard/packages', icon: Package, label: 'Paquetes' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen">
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-sm">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">CitaPro</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-violet-50 to-pink-50 text-violet-700 border border-violet-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-4.5 w-4.5', isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600')} style={{ height: '1.125rem', width: '1.125rem' }} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all w-full group"
        >
          <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
