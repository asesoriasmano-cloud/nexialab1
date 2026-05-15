'use client'

import { Clock, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ServiceSelectorProps {
  services: any[]
  selected?: any
  onSelect: (service: any) => void
  primaryColor?: string
}

export function ServiceSelector({ services, selected, onSelect, primaryColor }: ServiceSelectorProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué servicio necesitas?</h2>
      <p className="text-gray-500 text-sm mb-6">Selecciona el servicio que deseas reservar</p>

      {services.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No hay servicios disponibles</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                selected?.id === service.id
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-violet-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${service.color || primaryColor || '#8B5CF6'}20` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: service.color || primaryColor || '#8B5CF6' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration_minutes} min
                    </span>
                    <span className="text-sm font-semibold" style={{ color: primaryColor || '#8B5CF6' }}>
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
