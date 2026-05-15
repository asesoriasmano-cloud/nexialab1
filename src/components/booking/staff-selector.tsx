'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCircle2 } from 'lucide-react'

interface StaffSelectorProps {
  staff: any[]
  serviceId?: string
  selected?: any
  onSelect: (staff: any) => void
  primaryColor?: string
}

export function StaffSelector({ staff, serviceId, selected, onSelect, primaryColor }: StaffSelectorProps) {
  // Filter staff who can perform this service
  const availableStaff = serviceId
    ? staff.filter(s => 
        !s.staff_services || 
        s.staff_services.length === 0 || 
        s.staff_services.some((ss: any) => ss.service_id === serviceId)
      )
    : staff

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">¿Con quién quieres tu cita?</h2>
      <p className="text-gray-500 text-sm mb-6">Elige un profesional o selecciona cualquiera disponible</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Any available option */}
        <button
          onClick={() => onSelect(null)}
          className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
            selected === null
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-200 hover:border-violet-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
              <UserCircle2 className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cualquier disponible</h3>
              <p className="text-sm text-gray-500">Primer profesional libre</p>
            </div>
          </div>
        </button>

        {availableStaff.map(member => (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
              selected?.id === member.id
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-200 hover:border-violet-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback
                  className="text-white font-semibold"
                  style={{ backgroundColor: member.color || primaryColor || '#8B5CF6' }}
                >
                  {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                {member.bio && <p className="text-sm text-gray-500 line-clamp-1">{member.bio}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
