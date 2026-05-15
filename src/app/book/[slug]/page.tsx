import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/booking-wizard'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Phone, Clock } from 'lucide-react'

interface BookingPageProps {
  params: { slug: string }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!business) notFound()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name')

  const { data: staff } = await supabase
    .from('staff')
    .select('*, staff_services(service_id)')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name')

  const { data: workingHours } = await supabase
    .from('working_hours')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="w-full" style={{ backgroundColor: business.primary_color || '#8B5CF6' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                {business.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{business.name}</h1>
              {business.description && (
                <p className="text-white/80 text-sm mt-1">{business.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {business.address && (
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {business.address}
                {business.city && `, ${business.city}`}
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Phone className="h-3.5 w-3.5" />
                {business.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking wizard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BookingWizard
          business={business}
          services={services || []}
          staff={staff || []}
          workingHours={workingHours || []}
        />
      </div>
    </div>
  )
}
