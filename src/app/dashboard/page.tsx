import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUSES } from '@/lib/utils'
import { Calendar, Plus, ArrowRight, Users, Scissors } from 'lucide-react'
import Link from 'next/link'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    redirect('/dashboard/settings?onboarding=1')
  }

  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()
  const weekStart = startOfWeek(now).toISOString()
  const weekEnd = endOfWeek(now).toISOString()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()

  const [todayAppts, weekRevenue, monthRevenue, newClients, totalClients] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .neq('status', 'cancelled'),
    supabase.from('appointments').select('price')
      .eq('business_id', business.id)
      .gte('start_time', weekStart)
      .lte('start_time', weekEnd)
      .eq('status', 'completed'),
    supabase.from('appointments').select('price')
      .eq('business_id', business.id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd)
      .eq('status', 'completed'),
    supabase.from('clients').select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .gte('created_at', monthStart),
    supabase.from('clients').select('*', { count: 'exact' })
      .eq('business_id', business.id),
  ])

  const weekRev = (weekRevenue.data || []).reduce((sum, a) => sum + (a.price || 0), 0)
  const monthRev = (monthRevenue.data || []).reduce((sum, a) => sum + (a.price || 0), 0)

  const { data: noShowData } = await supabase.from('appointments').select('status')
    .eq('business_id', business.id)
    .gte('start_time', monthStart)
    .lte('start_time', monthEnd)

  const totalAppts = noShowData?.length || 0
  const noShows = (noShowData || []).filter(a => a.status === 'no_show').length
  const noShowRate = totalAppts > 0 ? Math.round((noShows / totalAppts) * 100) : 0

  const stats = {
    todayAppointments: todayAppts.count || 0,
    weekRevenue: weekRev,
    monthRevenue: monthRev,
    newClientsMonth: newClients.count || 0,
    occupancyRate: 72,
    noShowRate,
  }

  const { data: upcomingAppts } = await supabase
    .from('appointments')
    .select('*, client:clients(*), service:services(*), staff:staff(*)')
    .eq('business_id', business.id)
    .gte('start_time', now.toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Buen día! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {formatDate(now, 'EEEE, d MMMM yyyy')} · {business.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/book/${business.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              Ver página de reservas
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/dashboard/appointments?new=1">
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
              <Plus className="mr-1 h-4 w-4" />
              Nueva cita
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Próximas citas</CardTitle>
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 h-8 text-xs">
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {!upcomingAppts || upcomingAppts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No hay citas próximas</p>
                  <Link href="/dashboard/appointments?new=1" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs">Crear primera cita</Button>
                  </Link>
                </div>
              ) : (
                upcomingAppts.map((appt: any) => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex-shrink-0 text-center bg-gradient-to-br from-violet-100 to-pink-50 rounded-lg p-2 w-12">
                      <div className="text-xs font-medium text-violet-600">
                        {formatDate(appt.start_time, 'EEE')}
                      </div>
                      <div className="text-lg font-bold text-violet-700 leading-none">
                        {formatDate(appt.start_time, 'd')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appt.client?.name || 'Sin cliente'}
                        </p>
                        <Badge 
                          className={`text-xs px-1.5 py-0 ${APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]?.color}`}
                          variant="outline"
                        >
                          {APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {appt.service?.name} · {appt.staff?.name} · {formatTime(appt.start_time)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(appt.price || appt.service?.price || 0)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent clients + quick actions */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Clientes recientes</CardTitle>
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="sm" className="text-violet-600 h-8 text-xs">
                  Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {!recentClients || recentClients.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">Sin clientes aún</p>
                </div>
              ) : (
                recentClients.map((client: any) => (
                  <div key={client.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-violet-100 to-pink-100 text-violet-700 font-semibold">
                        {client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.visit_count} visitas</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatCurrency(client.total_spent)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Acciones rápidas</h3>
              <div className="space-y-2">
                <Link href="/dashboard/appointments?new=1" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-9">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-violet-500" />
                    Nueva cita
                  </Button>
                </Link>
                <Link href="/dashboard/clients?new=1" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-9">
                    <Users className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Nuevo cliente
                  </Button>
                </Link>
                <Link href="/dashboard/services?new=1" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-9">
                    <Scissors className="mr-2 h-3.5 w-3.5 text-pink-500" />
                    Nuevo servicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
