import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClientDetail } from '@/components/clients/client-detail'

interface Props {
  params: { id: string }
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('id, currency').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!client) notFound()

  const [appointmentsRes, packagesRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, service:services(name, price, duration_minutes), staff:staff(name)')
      .eq('client_id', params.id)
      .order('start_time', { ascending: false })
      .limit(20),
    supabase
      .from('client_packages')
      .select('*, package:packages(name, sessions_count)')
      .eq('client_id', params.id),
  ])

  return (
    <ClientDetail
      client={client}
      appointments={appointmentsRes.data || []}
      clientPackages={packagesRes.data || []}
      currency={business.currency}
      businessId={business.id}
    />
  )
}
