import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientForm } from '@/components/clients/client-form'

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo cliente</h1>
        <p className="text-gray-500 text-sm">Agrega un cliente a tu CRM</p>
      </div>
      <ClientForm businessId={business.id} />
    </div>
  )
}
