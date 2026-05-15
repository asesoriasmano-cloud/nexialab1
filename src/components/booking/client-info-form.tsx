'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ClientInfoFormProps {
  service?: any
  onSubmit: (data: {
    clientName: string
    clientEmail: string
    clientPhone: string
    notes: string
    intakeResponses: Record<string, any>
  }) => void
}

export function ClientInfoForm({ service, onSubmit }: ClientInfoFormProps) {
  const [data, setData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
    intakeResponses: {} as Record<string, any>,
  })

  const intakeQuestions = service?.intake_questions || []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.clientName.trim()) return
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Tus datos de contacto</h2>
      <p className="text-gray-500 text-sm mb-6">Para confirmar y recordarte tu cita</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Nombre completo *</Label>
          <Input
            id="clientName"
            value={data.clientName}
            onChange={e => setData(p => ({ ...p, clientName: e.target.value }))}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={data.clientEmail}
            onChange={e => setData(p => ({ ...p, clientEmail: e.target.value }))}
            placeholder="tu@email.com"
          />
          <p className="text-xs text-gray-400">Para recibir confirmación y recordatorios</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input
            id="clientPhone"
            type="tel"
            value={data.clientPhone}
            onChange={e => setData(p => ({ ...p, clientPhone: e.target.value }))}
            placeholder="+56 9 1234 5678"
          />
        </div>

        {/* Intake questions */}
        {intakeQuestions.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700">Información adicional</p>
            {intakeQuestions.map((q: any) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.question}{q.required && ' *'}</Label>
                {q.type === 'text' && (
                  <Textarea
                    value={data.intakeResponses[q.id] || ''}
                    onChange={e => setData(p => ({ ...p, intakeResponses: { ...p.intakeResponses, [q.id]: e.target.value } }))}
                    required={q.required}
                    rows={2}
                  />
                )}
                {q.type === 'select' && (
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                    value={data.intakeResponses[q.id] || ''}
                    onChange={e => setData(p => ({ ...p, intakeResponses: { ...p.intakeResponses, [q.id]: e.target.value } }))}
                    required={q.required}
                  >
                    <option value="">Selecciona...</option>
                    {(q.options || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
            placeholder="¿Algo que debamos saber?"
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white h-12">
          Continuar a confirmar
        </Button>
      </div>
    </form>
  )
}
