import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, UserCog, Mail, Phone, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/dashboard/settings?onboarding=1')

  const { data: staffMembers } = await supabase
    .from('staff')
    .select('*, staff_services(service_id, services(name))')
    .eq('business_id', business.id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
          <p className="text-gray-500 text-sm">{staffMembers?.length || 0} profesionales</p>
        </div>
        <Link href="/dashboard/staff/new">
          <Button className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo profesional
          </Button>
        </Link>
      </div>

      {!staffMembers || staffMembers.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay personal aún</h3>
            <p className="text-gray-400 text-sm mb-4">Añade profesionales para asignarlos a servicios y citas</p>
            <Link href="/dashboard/staff/new">
              <Button>Añadir primer profesional</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.map((member: any) => (
            <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className="text-white font-semibold text-base"
                      style={{ backgroundColor: member.color || '#8B5CF6' }}
                    >
                      {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <Link href={`/dashboard/staff/${member.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                    <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-xs mt-1">
                      {member.role === 'owner' ? 'Dueño' : 'Profesional'}
                    </Badge>
                    <div className="mt-2 space-y-1">
                      {member.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                    {member.bio && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{member.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
