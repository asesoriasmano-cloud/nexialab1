import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addMinutes, format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('business_id')
  const serviceId = searchParams.get('service_id')
  const staffId = searchParams.get('staff_id')
  const date = searchParams.get('date')

  if (!businessId || !date) {
    return NextResponse.json({ error: 'business_id and date required' }, { status: 400 })
  }

  const targetDate = parseISO(date)
  const dayOfWeek = targetDate.getDay()

  // Get service duration
  let duration = 60
  if (serviceId) {
    const { data: service } = await supabase
      .from('services').select('duration_minutes, buffer_minutes').eq('id', serviceId).single()
    if (service) duration = service.duration_minutes + (service.buffer_minutes || 0)
  }

  // Get working hours for the day
  let hoursQuery = supabase
    .from('working_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (staffId) {
    hoursQuery = hoursQuery.eq('staff_id', staffId)
  } else {
    hoursQuery = hoursQuery.eq('business_id', businessId)
  }

  const { data: workingHours } = await hoursQuery.single()

  if (!workingHours) {
    return NextResponse.json({ slots: [], message: 'No hay horario definido para este día' })
  }

  // Get existing appointments
  const dayStart = startOfDay(targetDate).toISOString()
  const dayEnd = endOfDay(targetDate).toISOString()

  let apptQuery = supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .neq('status', 'cancelled')

  if (staffId) apptQuery = apptQuery.eq('staff_id', staffId)

  const { data: existingAppts } = await apptQuery

  // Get blocked times
  let blockedQuery = supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)

  if (staffId) blockedQuery = blockedQuery.eq('staff_id', staffId)

  const { data: blockedTimes } = await blockedQuery

  // Generate slots
  const slots: { time: string; available: boolean }[] = []
  const [startHour, startMin] = workingHours.start_time.split(':').map(Number)
  const [endHour, endMin] = workingHours.end_time.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const slotInterval = 30 // 30 min slots

  for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += slotInterval) {
    const slotStart = new Date(targetDate)
    slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    const slotEnd = addMinutes(slotStart, duration)

    // Check if slot is in the past
    if (slotStart < new Date()) continue

    // Check conflicts with existing appointments
    const hasConflict = (existingAppts || []).some(appt => {
      const apptStart = parseISO(appt.start_time)
      const apptEnd = parseISO(appt.end_time)
      return (
        (slotStart >= apptStart && slotStart < apptEnd) ||
        (slotEnd > apptStart && slotEnd <= apptEnd) ||
        (slotStart <= apptStart && slotEnd >= apptEnd)
      )
    })

    const isBlocked = (blockedTimes || []).some(blocked => {
      const bStart = parseISO(blocked.start_time)
      const bEnd = parseISO(blocked.end_time)
      return slotStart < bEnd && slotEnd > bStart
    })

    slots.push({
      time: format(slotStart, 'HH:mm'),
      available: !hasConflict && !isBlocked,
    })
  }

  return NextResponse.json({ slots })
}
