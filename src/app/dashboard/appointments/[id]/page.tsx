import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppointmentDetail } from '@/components/appointments/appointment-detail'

interface Props {
  params: { id: string }
}

export default async function AppointmentDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('id, currency').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(*),
      service:services(*),
      staff:staff(*)
    `)
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!appointment) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('appointment_id', params.id)
    .order('created_at', { ascending: false })

  const { data: otherAppts } = await supabase
    .from('appointments')
    .select('*, service:services(name)')
    .eq('business_id', business.id)
    .eq('client_id', appointment.client_id || '')
    .neq('id', params.id)
    .order('start_time', { ascending: false })
    .limit(5)

  return (
    <AppointmentDetail
      appointment={appointment}
      payments={payments || []}
      otherAppointments={otherAppts || []}
      currency={business.currency}
    />
  )
}
