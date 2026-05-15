'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, Calendar, Clock, User, Scissors, Mail, Phone } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createPublicAppointment } from '@/actions/appointments'
import { parseISO, addMinutes } from 'date-fns'
import type { BookingState } from './booking-wizard'

interface BookingConfirmationProps {
  booking: BookingState
  business: any
  onConfirm: (appointmentId: string) => void
  onBack: () => void
}

export function BookingConfirmation({ booking, business, onConfirm, onBack }: BookingConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const startTime = parseISO(`${booking.date}T${booking.time}:00`)
      const endTime = addMinutes(startTime, booking.service?.duration_minutes || 60)

      const appointment = await createPublicAppointment({
        business_id: business.id,
        service_id: booking.service?.id,
        staff_id: booking.staff?.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        client_name: booking.clientName,
        client_email: booking.clientEmail || undefined,
        client_phone: booking.clientPhone || undefined,
        notes: booking.notes || undefined,
        intake_responses: booking.intakeResponses,
      })

      onConfirm(appointment.id)
    } catch (err: any) {
      setError(err.message || 'Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const details = [
    { icon: Scissors, label: 'Servicio', value: booking.service?.name },
    { icon: User, label: 'Profesional', value: booking.staff?.name || 'Cualquier disponible' },
    { icon: Calendar, label: 'Fecha', value: booking.date ? formatDate(parseISO(booking.date), 'EEEE d MMMM yyyy') : '' },
    { icon: Clock, label: 'Hora', value: booking.time },
    { icon: User, label: 'Cliente', value: booking.clientName },
    { icon: Mail, label: 'Email', value: booking.clientEmail || '—' },
    { icon: Phone, label: 'Teléfono', value: booking.clientPhone || '—' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Confirma tu cita</h2>
      <p className="text-gray-500 text-sm mb-6">Revisa los detalles antes de confirmar</p>

      <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6">
        {details.map(d => d.value ? (
          <div key={d.label} className="flex items-center gap-3">
            <d.icon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 w-24">{d.label}</span>
            <span className="text-sm font-medium text-gray-900">{d.value}</span>
          </div>
        ) : null)}
        <Separator />
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold" style={{ color: business.primary_color || '#8B5CF6' }}>
            {formatCurrency(booking.service?.price || 0)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {booking.notes && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
          <p className="font-medium mb-1">Notas:</p>
          <p>{booking.notes}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-4">
        Al confirmar aceptas la política de cancelación de {business.name}. 
        {business.cancellation_hours > 0 && ` Las cancelaciones se pueden realizar hasta ${business.cancellation_hours} horas antes de la cita.`}
      </p>

      <Button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full h-12 text-white border-0"
        style={{ background: `linear-gradient(135deg, ${business.primary_color || '#8B5CF6'}, #EC4899)` }}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar cita'}
      </Button>
    </div>
  )
}
