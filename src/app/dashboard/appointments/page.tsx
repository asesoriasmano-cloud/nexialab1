import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUSES } from '@/lib/utils'
import { Plus, Calendar, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()

  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, client:clients(*), service:services(*), staff:staff(*)')
    .eq('business_id', business.id)
    .order('start_time', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm">{appointments?.length || 0} citas encontradas</p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, servicio..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!appointments || appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay citas aún</h3>
              <p className="text-gray-400 text-sm mb-4">Crea tu primera cita o comparte tu página de reservas</p>
              <Link href="/dashboard/appointments/new">
                <Button>Crear primera cita</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appt: any) => (
                    <TableRow key={appt.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{appt.client?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{appt.client?.phone || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{appt.service?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{appt.service?.duration_minutes}min</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{appt.staff?.name || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 font-medium">{formatDate(appt.start_time, 'd MMM yyyy')}</p>
                        <p className="text-xs text-gray-400">{formatTime(appt.start_time)} - {formatTime(appt.end_time)}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(appt.price || appt.service?.price || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]?.color}`}
                          variant="outline"
                        >
                          {APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/appointments/${appt.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
