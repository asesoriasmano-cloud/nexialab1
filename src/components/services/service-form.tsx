'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createServiceAction, updateServiceAction } from '@/actions/services'
import { Loader2 } from 'lucide-react'

interface ServiceFormProps {
  businessId: string
  initialData?: any
}

export function ServiceForm({ businessId, initialData }: ServiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    duration_minutes: initialData?.duration_minutes || 60,
    buffer_minutes: initialData?.buffer_minutes || 0,
    price: initialData?.price || 0,
    color: initialData?.color || '#8B5CF6',
    is_active: initialData?.is_active !== false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (initialData?.id) {
        await updateServiceAction(initialData.id, form)
        toast({ title: 'Servicio actualizado' })
      } else {
        await createServiceAction({ ...form, business_id: businessId })
        toast({ title: 'Servicio creado' })
      }
      router.push('/dashboard/services')
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
            <Label htmlFor="name">Nombre del servicio *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Corte de cabello"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe el servicio..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Duración (minutos) *</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                min={5} max={480} required
              />
            </div>
            <div className="space-y-2">
              <Label>Buffer (minutos)</Label>
              <Input
                type="number"
                value={form.buffer_minutes}
                onChange={e => setForm(p => ({ ...p, buffer_minutes: parseInt(e.target.value) }))}
                min={0} max={120}
              />
              <p className="text-xs text-gray-400">Tiempo de preparación/limpieza</p>
            </div>
            <div className="space-y-2">
              <Label>Precio (CLP)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color identificador</Label>
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
                placeholder="#8B5CF6"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Servicio activo</Label>
              <p className="text-xs text-gray-400">Los clientes pueden reservar este servicio</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={checked => setForm(p => ({ ...p, is_active: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {initialData ? 'Guardar cambios' : 'Crear servicio'}
        </Button>
      </div>
    </form>
  )
}
