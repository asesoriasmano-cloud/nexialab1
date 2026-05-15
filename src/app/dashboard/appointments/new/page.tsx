import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentForm } from '@/components/appointments/appointment-form'

export default async function NewAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const [{ data: services }, { data: staff }, { data: clients }] = await Promise.all([
    supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true).order('name'),
    supabase.from('staff').select('*').eq('business_id', business.id).eq('is_active', true).order('name'),
    supabase.from('clients').select('*').eq('business_id', business.id).eq('is_active', true).order('name'),
  ])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva cita</h1>
        <p className="text-gray-500 text-sm">Crea una cita manualmente</p>
      </div>
      <AppointmentForm
        businessId={business.id}
        services={services || []}
        staff={staff || []}
        clients={clients || []}
      />
    </div>
  )
}
