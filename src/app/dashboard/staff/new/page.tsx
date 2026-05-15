import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffForm } from '@/components/staff/staff-form'

export default async function NewStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: services } = await supabase
    .from('services').select('id, name').eq('business_id', business.id).eq('is_active', true)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo profesional</h1>
        <p className="text-gray-500 text-sm">Agrega un profesional a tu equipo</p>
      </div>
      <StaffForm businessId={business.id} services={services || []} />
    </div>
  )
}
