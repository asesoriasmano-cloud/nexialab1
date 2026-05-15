'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendAppointmentConfirmation } from '@/lib/resend'
import { formatDate, formatTime } from '@/lib/utils'

export async function createAppointment(data: {
  business_id: string
  client_id?: string
  staff_id?: string
  service_id?: string
  start_time: string
  end_time: string
  notes?: string
  price?: number
  source?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ ...data, status: 'confirmed' })
    .select('*, client:clients(*), service:services(*), staff:staff(*), business:businesses(*)')
    .single()

  if (error) throw error

  // Send confirmation email
  if (appointment.client?.email) {
    try {
      await sendAppointmentConfirmation({
        to: appointment.client.email,
        clientName: appointment.client.name,
        serviceName: appointment.service?.name || 'Servicio',
        staffName: appointment.staff?.name || 'Profesional',
        date: formatDate(appointment.start_time),
        time: formatTime(appointment.start_time),
        businessName: appointment.business?.name || '',
        businessPhone: appointment.business?.phone,
      })
    } catch (err) {
      console.error('Error sending confirmation email:', err)
    }
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')

  return appointment
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
  reason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'cancelled') {
    updates.cancellation_reason = reason
    updates.cancelled_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)

  if (error) throw error

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
}

export async function createPublicAppointment(data: {
  business_id: string
  service_id: string
  staff_id?: string
  start_time: string
  end_time: string
  client_name: string
  client_email?: string
  client_phone?: string
  notes?: string
  intake_responses?: Record<string, any>
}) {
  const supabase = await createClient()

  // Create or find client
  let clientId: string | undefined

  if (data.client_email) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', data.business_id)
      .eq('email', data.client_email)
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: data.business_id,
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
        })
        .select('id')
        .single()

      if (!clientError && newClient) clientId = newClient.id
    }
  }

  const { data: service } = await supabase
    .from('services')
    .select('price')
    .eq('id', data.service_id)
    .single()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      business_id: data.business_id,
      client_id: clientId,
      service_id: data.service_id,
      staff_id: data.staff_id,
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes,
      price: service?.price,
      intake_responses: data.intake_responses || {},
      status: 'pending',
      source: 'online',
    })
    .select('*, client:clients(*), service:services(*), staff:staff(*), business:businesses(*)')
    .single()

  if (error) throw error

  // Send confirmation
  if (data.client_email) {
    try {
      await sendAppointmentConfirmation({
        to: data.client_email,
        clientName: data.client_name,
        serviceName: appointment.service?.name || 'Servicio',
        staffName: appointment.staff?.name || 'Profesional',
        date: formatDate(appointment.start_time),
        time: formatTime(appointment.start_time),
        businessName: appointment.business?.name || '',
        businessPhone: appointment.business?.phone,
      })
    } catch (err) {
      console.error('Error sending email:', err)
    }
  }

  // Update client stats
  if (clientId) {
    await supabase.from('clients').update({
      visit_count: supabase.rpc('increment', { x: 1 }) as any,
      last_visit_at: data.start_time,
    }).eq('id', clientId)
  }

  return appointment
}
