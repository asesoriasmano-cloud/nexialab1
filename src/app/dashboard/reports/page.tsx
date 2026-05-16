import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, APPOINTMENT_STATUSES } from '@/lib/utils'
import {
  startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek,
  eachDayOfInterval, format, parseISO, isSameDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar,
  AlertTriangle, CheckCircle, XCircle, Clock
} from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const now = new Date()
  const thisMonthStart = startOfMonth(now).toISOString()
  const thisMonthEnd = endOfMonth(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

  const [thisMonth, lastMonth, thisWeek, allClients, topServices, topStaff] = await Promise.all([
    supabase.from('appointments').select('*')
      .eq('business_id', business.id)
      .gte('start_time', thisMonthStart)
      .lte('start_time', thisMonthEnd),
    supabase.from('appointments').select('*')
      .eq('business_id', business.id)
      .gte('start_time', lastMonthStart)
      .lte('start_time', lastMonthEnd),
    supabase.from('appointments').select('*, service:services(name, price, duration_minutes)')
      .eq('business_id', business.id)
      .gte('start_time', weekStart)
      .lte('start_time', weekEnd),
    supabase.from('clients').select('*').eq('business_id', business.id),
    supabase.from('appointments')
      .select('service_id, price, status, service:services(name)')
      .eq('business_id', business.id)
      .gte('start_time', thisMonthStart)
      .lte('start_time', thisMonthEnd),
    supabase.from('appointments')
      .select('staff_id, price, status, staff:staff(name)')
      .eq('business_id', business.id)
      .gte('start_time', thisMonthStart)
      .lte('start_time', thisMonthEnd),
  ])

  const thisAppts = thisMonth.data || []
  const lastAppts = lastMonth.data || []
  const weekAppts = thisWeek.data || []
  const clients = allClients.data || []

  // Revenue calculations
  const thisRevenue = thisAppts.filter(a => a.status === 'completed').reduce((s, a) => s + (a.price || 0), 0)
  const lastRevenue = lastAppts.filter(a => a.status === 'completed').reduce((s, a) => s + (a.price || 0), 0)
  const revenueDiff = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue * 100) : 0

  // Appointment stats
  const completed = thisAppts.filter(a => a.status === 'completed').length
  const cancelled = thisAppts.filter(a => a.status === 'cancelled').length
  const noShows = thisAppts.filter(a => a.status === 'no_show').length
  const pending = thisAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length
  const total = thisAppts.length

  const lastCompleted = lastAppts.filter(a => a.status === 'completed').length
  const apptDiff = lastCompleted > 0 ? ((completed - lastCompleted) / lastCompleted * 100) : 0

  // Client stats
  const newThisMonth = clients.filter(c => c.created_at >= thisMonthStart).length
  const newLastMonth = clients.filter(c =>
    c.created_at >= lastMonthStart && c.created_at <= lastMonthEnd
  ).length
  const clientDiff = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth * 100) : 0

  // Daily revenue for the week (mini chart data)
  const weekDays = eachDayOfInterval({
    start: parseISO(weekStart),
    end: parseISO(weekEnd),
  })
  const dailyData = weekDays.map(day => {
    const dayAppts = weekAppts.filter(a => isSameDay(parseISO(a.start_time), day))
    const revenue = dayAppts.filter(a => a.status === 'completed').reduce((s, a) => s + ((a as any).service?.price || a.price || 0), 0)
    return {
      day: format(day, 'EEE', { locale: es }),
      count: dayAppts.length,
      revenue,
      isToday: isSameDay(day, now),
    }
  })
  const maxCount = Math.max(...dailyData.map(d => d.count), 1)

  // Top services
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {}
  ;(topServices.data || []).forEach((a: any) => {
    if (!a.service_id) return
    const name = a.service?.name || 'Sin nombre'
    if (!serviceMap[a.service_id]) serviceMap[a.service_id] = { name, count: 0, revenue: 0 }
    serviceMap[a.service_id].count++
    if (a.status === 'completed') serviceMap[a.service_id].revenue += a.price || 0
  })
  const topServicesList = Object.values(serviceMap).sort((a, b) => b.count - a.count).slice(0, 5)

  // Top staff
  const staffMap: Record<string, { name: string; count: number; revenue: number }> = {}
  ;(topStaff.data || []).forEach((a: any) => {
    if (!a.staff_id) return
    const name = a.staff?.name || 'Sin nombre'
    if (!staffMap[a.staff_id]) staffMap[a.staff_id] = { name, count: 0, revenue: 0 }
    staffMap[a.staff_id].count++
    if (a.status === 'completed') staffMap[a.staff_id].revenue += a.price || 0
  })
  const topStaffList = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm">Análisis de {format(now, 'MMMM yyyy', { locale: es })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos del mes"
          value={formatCurrency(thisRevenue, business.currency)}
          diff={revenueDiff}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <MetricCard
          title="Citas completadas"
          value={completed.toString()}
          diff={apptDiff}
          icon={CheckCircle}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <MetricCard
          title="Clientes nuevos"
          value={newThisMonth.toString()}
          diff={clientDiff}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MetricCard
          title="Tasa no-show"
          value={`${noShowRate}%`}
          diff={noShowRate > 10 ? 5 : -5}
          icon={AlertTriangle}
          iconColor={noShowRate > 10 ? 'text-red-600' : 'text-teal-600'}
          iconBg={noShowRate > 10 ? 'bg-red-50' : 'bg-teal-50'}
          invertDiff
        />
      </div>

      {/* Status breakdown + Weekly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment status breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Estado de citas este mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Completadas', count: completed, color: 'bg-green-500', pct: total > 0 ? completed / total : 0 },
              { label: 'Pendientes / Confirmadas', count: pending, color: 'bg-blue-500', pct: total > 0 ? pending / total : 0 },
              { label: 'Canceladas', count: cancelled, color: 'bg-red-400', pct: total > 0 ? cancelled / total : 0 },
              { label: 'No-show', count: noShows, color: 'bg-gray-400', pct: total > 0 ? noShows / total : 0 },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.count} ({Math.round(item.pct * 100)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.color}`}
                    style={{ width: `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total del mes</span>
              <span className="font-semibold">{total} citas</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Actividad esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-36 mb-3">
              {dailyData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{day.count > 0 ? day.count : ''}</span>
                  <div className="w-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${day.isToday ? 'bg-violet-500' : 'bg-violet-200'}`}
                      style={{ height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 4)}px` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${day.isToday ? 'text-violet-600' : 'text-gray-400'}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {dailyData.map((day, i) => day.count > 0 && (
                <div key={i} className="flex justify-between text-sm">
                  <span className={`${day.isToday ? 'text-violet-600 font-medium' : 'text-gray-500'}`}>{day.day}</span>
                  <span className="text-gray-900">{day.count} cita{day.count !== 1 ? 's' : ''} · {formatCurrency(day.revenue, business.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top services + Top staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top servicios del mes</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {topServicesList.map((svc, i) => (
                  <div key={svc.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                      <p className="text-xs text-gray-500">{svc.count} reservas</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(svc.revenue, business.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Rendimiento por profesional</CardTitle>
          </CardHeader>
          <CardContent>
            {topStaffList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {topStaffList.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                      {s.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.count} citas · {Math.round(s.revenue / (s.count || 1))} promedio</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(s.revenue, business.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary metrics */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Métricas de calidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Tasa de completado</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{noShowRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Tasa no-show</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total clientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-600">
                {total > 0 ? formatCurrency(thisRevenue / completed || 0, business.currency) : '$0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ticket promedio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title, value, diff, icon: Icon, iconColor, iconBg, invertDiff
}: {
  title: string
  value: string
  diff: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  invertDiff?: boolean
}) {
  const positive = invertDiff ? diff < 0 : diff >= 0
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${positive ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}
          >
            {positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(Math.round(diff))}%
          </Badge>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{title}</p>
      </CardContent>
    </Card>
  )
}
