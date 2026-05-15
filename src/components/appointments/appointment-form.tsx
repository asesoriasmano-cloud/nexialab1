'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createAppointment } from '@/actions/appointments'
import { addMinutes, format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface AppointmentFormProps {
  businessId: string
  services: any[]
  staff: any[]
  clients: any[]
  initialData?: any
}

export function AppointmentForm({ businessId, services, staff, clients, initialData }: AppointmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: initialData?.client_id || '',
    service_id: initialData?.service_id || '',
    staff_id: initialData?.staff_id || '',
    date: initialData?.start_time ? format(parseISO(initialData.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: initialData?.start_time ? format(parseISO(initialData.start_time), 'HH:mm') : '10:00',
    notes: initialData?.notes || '',
    internal_notes: initialData?.internal_notes || '',
    price: initialData?.price?.toString() || '',
  })

  const selectedService = services.find(s => s.id === form.service_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const startTime = parseISO(`${form.date}T${form.time}:00`)
      const duration = selectedService?.duration_minutes || 60
      const endTime = addMinutes(startTime, duration + (selectedService?.buffer_minutes || 0))

      await createAppointment({
        business_id: businessId,
        client_id: form.client_id || undefined,
        service_id: form.service_id || undefined,
        staff_id: form.staff_id || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: form.notes || undefined,
        price: form.price ? parseFloat(form.price) : (selectedService?.price || undefined),
        source: 'manual',
      })

      toast({ title: 'Cita creada', description: 'La cita ha sido creada exitosamente.' })
      router.push('/dashboard/appointments')
      router.refresh()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin cliente específico</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select value={form.service_id} onValueChange={v => setForm(p => ({ ...p, service_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={form.staff_id} onValueChange={v => setForm(p => ({ ...p, staff_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier disponible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier disponible</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder={selectedService?.price?.toString() || '0'}
                className="pl-7"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (visibles para el cliente)</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notas opcionales..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea
              value={form.internal_notes}
              onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))}
              placeholder="Solo visibles para tu equipo..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Crear cita
        </Button>
      </div>
    </form>
  )
}
