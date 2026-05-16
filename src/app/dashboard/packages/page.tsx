import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PackagesManager } from '@/components/packages/packages-manager'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const [packagesRes, servicesRes, clientPackagesRes] = await Promise.all([
    supabase.from('packages').select('*, service:services(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
    supabase.from('services').select('id, name, price, duration_minutes').eq('business_id', business.id).eq('is_active', true),
    supabase.from('client_packages')
      .select('*, package:packages(name), client:clients(name, email)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paquetes y Membresías</h1>
        <p className="text-gray-500 text-sm">Vende sesiones en paquetes con descuento</p>
      </div>
      <PackagesManager
        packages={packagesRes.data || []}
        services={servicesRes.data || []}
        clientPackages={clientPackagesRes.data || []}
        businessId={business.id}
        currency={business.currency}
      />
    </div>
  )
}
