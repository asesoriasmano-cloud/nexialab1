import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/appointments/calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id, timezone').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, client:clients(name, phone), service:services(name, color, duration_minutes), staff:staff(name, color)')
    .eq('business_id', business.id)
    .neq('status', 'cancelled')

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 text-sm">Vista de citas por día, semana y mes</p>
        </div>
      </div>
      <CalendarView appointments={appointments || []} staff={staff || []} businessId={business.id} />
    </div>
  )
}
