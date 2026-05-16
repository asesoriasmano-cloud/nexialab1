import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendAppointmentReminder } from '@/lib/resend'
import { formatDate, formatTime } from '@/lib/utils'
import { addHours, isAfter, isBefore } from 'date-fns'

// Called by Vercel Cron or any scheduler every 30 min
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()
  let sent24 = 0
  let sent2 = 0
  let errors = 0

  // 24h reminders: appointments starting between 23.5h and 24.5h from now
  const window24Start = addHours(now, 23.5).toISOString()
  const window24End = addHours(now, 24.5).toISOString()

  const { data: appts24 } = await supabase
    .from('appointments')
    .select('*, client:clients(name, email), service:services(name), business:businesses(name, phone)')
    .in('status', ['confirmed', 'pending'])
    .eq('reminder_24h_sent', false)
    .gte('start_time', window24Start)
    .lte('start_time', window24End)

  for (const appt of appts24 || []) {
    if (!appt.client?.email) continue
    try {
      await sendAppointmentReminder({
        to: appt.client.email,
        clientName: appt.client.name,
        serviceName: appt.service?.name || 'Cita',
        date: formatDate(appt.start_time),
        time: formatTime(appt.start_time),
        businessName: appt.business?.name || '',
        hoursUntil: 24,
      })
      await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id)
      sent24++
    } catch {
      errors++
    }
  }

  // 2h reminders: appointments starting between 1.5h and 2.5h from now
  const window2Start = addHours(now, 1.5).toISOString()
  const window2End = addHours(now, 2.5).toISOString()

  const { data: appts2 } = await supabase
    .from('appointments')
    .select('*, client:clients(name, email), service:services(name), business:businesses(name)')
    .in('status', ['confirmed', 'pending'])
    .eq('reminder_2h_sent', false)
    .gte('start_time', window2Start)
    .lte('start_time', window2End)

  for (const appt of appts2 || []) {
    if (!appt.client?.email) continue
    try {
      await sendAppointmentReminder({
        to: appt.client.email,
        clientName: appt.client.name,
        serviceName: appt.service?.name || 'Cita',
        date: formatDate(appt.start_time),
        time: formatTime(appt.start_time),
        businessName: appt.business?.name || '',
        hoursUntil: 2,
      })
      await supabase.from('appointments').update({ reminder_2h_sent: true }).eq('id', appt.id)
      sent2++
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    success: true,
    sent24h: sent24,
    sent2h: sent2,
    errors,
    processedAt: now.toISOString(),
  })
}
