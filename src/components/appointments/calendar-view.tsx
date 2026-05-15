'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { APPOINTMENT_STATUSES } from '@/lib/utils'

interface CalendarViewProps {
  appointments: any[]
  staff: any[]
  businessId: string
}

export function CalendarView({ appointments, staff, businessId }: CalendarViewProps) {
  const calendarRef = useRef<any>(null)
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [selectedAppt, setSelectedAppt] = useState<any>(null)

  const filteredAppts = selectedStaff === 'all'
    ? appointments
    : appointments.filter(a => a.staff_id === selectedStaff)

  const events = filteredAppts.map(appt => ({
    id: appt.id,
    title: `${appt.client?.name || 'Sin cliente'} - ${appt.service?.name || 'Servicio'}`,
    start: appt.start_time,
    end: appt.end_time,
    backgroundColor: appt.service?.color || appt.staff?.color || '#8B5CF6',
    borderColor: 'transparent',
    textColor: '#ffffff',
    extendedProps: { appt },
  }))

  function handleEventClick(info: any) {
    setSelectedAppt(info.event.extendedProps.appt)
  }

  function handleDateClick(info: any) {
    // TODO: open new appointment modal with pre-selected date
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-48 h-9 text-sm">
                  <SelectValue placeholder="Filtrar por profesional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los profesionales</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white ml-auto">
                <Plus className="h-4 w-4 mr-1" />
                Nueva cita
              </Button>
            </div>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
              }}
              height="auto"
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator
              slotDuration="00:30:00"
              editable
              selectable
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Staff legend */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Profesionales</h3>
            <div className="space-y-2">
              {staff.length === 0 ? (
                <p className="text-xs text-gray-400">No hay profesionales</p>
              ) : (
                staff.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#8B5CF6' }} />
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected appointment details */}
        {selectedAppt && (
          <Card className="border-0 shadow-sm border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Detalle de cita</h3>
                <button onClick={() => setSelectedAppt(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Cliente</p>
                  <p className="text-sm font-medium">{selectedAppt.client?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Servicio</p>
                  <p className="text-sm font-medium">{selectedAppt.service?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Profesional</p>
                  <p className="text-sm font-medium">{selectedAppt.staff?.name || '—'}</p>
                </div>
                <Badge
                  className={`text-xs ${APPOINTMENT_STATUSES[selectedAppt.status as keyof typeof APPOINTMENT_STATUSES]?.color}`}
                  variant="outline"
                >
                  {APPOINTMENT_STATUSES[selectedAppt.status as keyof typeof APPOINTMENT_STATUSES]?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
