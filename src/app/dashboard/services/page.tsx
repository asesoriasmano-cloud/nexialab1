import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Plus, Scissors, Clock, DollarSign, Edit, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500 text-sm">{services?.length || 0} servicios configurados</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo servicio
          </Button>
        </Link>
      </div>

      {!services || services.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay servicios aún</h3>
            <p className="text-gray-400 text-sm mb-4">Crea tus servicios para que los clientes puedan reservar</p>
            <Link href="/dashboard/services/new">
              <Button>Crear primer servicio</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service: any) => (
            <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${service.color}20` }}
                  >
                    <Scissors className="h-5 w-5" style={{ color: service.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-xs">
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Link href={`/dashboard/services/${service.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-green-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatCurrency(service.price)}</span>
                  </div>
                </div>
                {service.buffer_minutes > 0 && (
                  <p className="text-xs text-gray-400 mt-2">+ {service.buffer_minutes} min buffer</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
