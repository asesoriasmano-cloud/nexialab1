import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const { data: workingHours } = await supabase
    .from('working_hours')
    .select('*')
    .eq('business_id', business?.id || '')
    .order('day_of_week')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm">Gestiona los datos de tu negocio</p>
      </div>
      <SettingsForm business={business} workingHours={workingHours || []} userId={user.id} />
    </div>
  )
}
