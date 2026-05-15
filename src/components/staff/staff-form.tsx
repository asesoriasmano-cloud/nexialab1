'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createStaffAction, updateStaffAction } from '@/actions/staff'
import { Loader2 } from 'lucide-react'

interface StaffFormProps {
  businessId: string
  services: { id: string; name: string }[]
  initialData?: any
}

export function StaffForm({ businessId, services, initialData }: StaffFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    bio: initialData?.bio || '',
    color: initialData?.color || '#8B5CF6',
    service_ids: (initialData?.staff_services || []).map((ss: any) => ss.service_id) as string[],
  })

  function toggleService(serviceId: string) {
    setForm(p => ({
      ...p,
      service_ids: p.service_ids.includes(serviceId)
        ? p.service_ids.filter(id => id !== serviceId)
        : [...p.service_ids, serviceId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (initialData?.id) {
        await updateStaffAction(initialData.id, form)
        toast({ title: 'Profesional actualizado' })
      } else {
        await createStaffAction({ ...form, business_id: businessId })
        toast({ title: 'Profesional creado' })
      }
      router.push('/dashboard/staff')
      router.refresh()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Carlos González"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="profesional@salon.cl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Especialidad</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Especialista en cortes y coloración..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color de identificación</Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="font-mono text-sm w-32"
              />
            </div>
          </div>

          {services.length > 0 && (
            <div className="space-y-3">
              <Label>Servicios que puede realizar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={form.service_ids.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <label
                      htmlFor={`service-${service.id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
              {form.service_ids.length === 0 && (
                <p className="text-xs text-gray-400">Sin servicios seleccionados = puede realizar todos</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {initialData ? 'Guardar cambios' : 'Crear profesional'}
        </Button>
      </div>
    </form>
  )
}
