'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUSES } from '@/lib/utils'
import { updateAppointmentStatus, updateInternalNotes } from '@/actions/appointments'
import {
  Calendar, Clock, User, Scissors, DollarSign, Phone, Mail,
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, MessageSquare,
  CreditCard, History
} from 'lucide-react'

interface AppointmentDetailProps {
  appointment: any
  payments: any[]
  otherAppointments: any[]
  currency: string
}

const STATUS_ACTIONS = [
  { status: 'confirmed', label: 'Confirmar', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { status: 'completed', label: 'Completar', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700 text-white' },
  { status: 'no_show', label: 'No show', icon: AlertTriangle, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { status: 'cancelled', label: 'Cancelar', icon: XCircle, color: 'bg-red-500 hover:bg-red-600 text-white' },
]

export function AppointmentDetail({ appointment, payments, otherAppointments, currency }: AppointmentDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState(appointment.internal_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const statusInfo = APPOINTMENT_STATUSES[appointment.status as keyof typeof APPOINTMENT_STATUSES]

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true)
    try {
      await updateAppointmentStatus(appointment.id, status as any)
      toast({ title: `Cita marcada como: ${APPOINTMENT_STATUSES[status as keyof typeof APPOINTMENT_STATUSES]?.label}` })
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      await updateInternalNotes(appointment.id, notes)
      toast({ title: 'Notas guardadas' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  const availableActions = STATUS_ACTIONS.filter(a => a.status !== appointment.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/appointments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Detalle de cita</h1>
            <Badge className={`${statusInfo?.color} border-0`}>
              {statusInfo?.label}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatDate(appointment.start_time, 'EEEE, d MMMM yyyy')} · {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Información de la cita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Fecha" value={formatDate(appointment.start_time, 'd MMMM yyyy')} />
                <InfoRow icon={Clock} label="Hora" value={`${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`} />
                <InfoRow icon={Scissors} label="Servicio" value={appointment.service?.name || '—'} />
                <InfoRow icon={User} label="Profesional" value={appointment.staff?.name || '—'} />
                <InfoRow icon={DollarSign} label="Precio" value={formatCurrency(appointment.price || appointment.service?.price || 0, currency)} />
                <InfoRow icon={DollarSign} label="Depósito" value={appointment.deposit_paid ? `${formatCurrency(appointment.deposit_amount || 0, currency)} (pagado)` : 'Sin depósito'} />
              </div>

              {appointment.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Notas del cliente</p>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {appointment.intake_responses && Object.keys(appointment.intake_responses).length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Formulario de intake</p>
                  <div className="space-y-2">
                    {Object.entries(appointment.intake_responses).map(([q, a]) => (
                      <div key={q} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600">{q}</p>
                        <p className="text-sm text-gray-900 mt-0.5">{String(a)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas privadas sobre esta cita (no visibles para el cliente)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                size="sm"
                className="mt-3 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {savingNotes ? 'Guardando...' : 'Guardar notas'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment history */}
          {payments.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.description || 'Pago'}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString('es-CL')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount, currency)}</p>
                        <Badge variant="outline" className={`text-xs ${
                          payment.status === 'paid' ? 'text-green-700 border-green-200 bg-green-50' :
                          payment.status === 'refunded' ? 'text-orange-600 border-orange-200' : 'text-gray-500'
                        }`}>
                          {payment.status === 'paid' ? 'Pagado' : payment.status === 'refunded' ? 'Reembolsado' : payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          {appointment.client && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-violet-700 font-bold text-lg">
                    {appointment.client.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{appointment.client.name}</p>
                    <p className="text-xs text-gray-500">{appointment.client.visit_count} visitas</p>
                  </div>
                </div>
                {appointment.client.phone && (
                  <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600">
                    <Phone className="h-3.5 w-3.5" />
                    {appointment.client.phone}
                  </a>
                )}
                {appointment.client.email && (
                  <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600">
                    <Mail className="h-3.5 w-3.5" />
                    {appointment.client.email}
                  </a>
                )}
                <Link href={`/dashboard/clients/${appointment.client_id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">Ver perfil completo</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {appointment.status !== 'cancelled' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableActions.map(action => (
                  <Button
                    key={action.status}
                    onClick={() => handleStatusChange(action.status)}
                    disabled={updatingStatus}
                    className={`w-full justify-start gap-2 ${action.color}`}
                    size="sm"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other appointments */}
          {otherAppointments.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial del cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {otherAppointments.map((appt: any) => (
                    <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                      <div className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">{appt.service?.name || 'Servicio'}</p>
                        <p className="text-xs text-gray-400">{formatDate(appt.start_time, 'd MMM yyyy')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
