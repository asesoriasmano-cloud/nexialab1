'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { format, addDays, isBefore, startOfDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimeSlotPickerProps {
  businessId: string
  serviceId?: string
  staffId?: string
  workingHours: any[]
  selectedDate?: string
  selectedTime?: string
  onSelect: (date: string, time: string) => void
  primaryColor?: string
}

export function TimeSlotPicker({
  businessId, serviceId, staffId, workingHours,
  selectedDate, selectedTime, onSelect, primaryColor,
}: TimeSlotPickerProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate ? parseISO(selectedDate) : undefined)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(selectedTime || '')

  const activeDays = workingHours.map(h => h.day_of_week)

  useEffect(() => {
    if (!date) return
    setLoading(true)
    setTime('')

    const params = new URLSearchParams({
      business_id: businessId,
      date: format(date, 'yyyy-MM-dd'),
    })
    if (serviceId) params.set('service_id', serviceId)
    if (staffId) params.set('staff_id', staffId)

    fetch(`/api/availability?${params}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [date, serviceId, staffId, businessId])

  function handleTimeSelect(t: string) {
    setTime(t)
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd')
      onSelect(dateStr, t)
    }
  }

  const availableSlots = slots.filter(s => s.available)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cuándo quieres tu cita?</h2>
      <p className="text-gray-500 text-sm mb-6">Selecciona una fecha y hora disponible</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={es}
            disabled={d => {
              if (isBefore(d, startOfDay(new Date()))) return true
              if (isBefore(addDays(new Date(), 60), d)) return true
              return !activeDays.includes(d.getDay())
            }}
            className="rounded-xl border border-gray-200 p-3 bg-white w-full"
          />
        </div>

        <div>
          {!date ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Selecciona una fecha primero
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Sin disponibilidad</p>
              <p className="text-sm mt-1">No hay horarios libres para este día</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {format(date, "EEEE d 'de' MMMM", { locale: es })} · {availableSlots.length} horarios disponibles
              </p>
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSelect(slot.time)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      time === slot.time
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                    style={time === slot.time ? { borderColor: primaryColor || '#8B5CF6', color: primaryColor || '#8B5CF6' } : {}}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
