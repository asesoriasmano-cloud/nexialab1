'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Scissors, Edit, Clock, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface Service {
  id: string
  name: string
  description?: string
  category?: string
  duration_minutes: number
  buffer_minutes: number
  price: number
  color: string
  is_active: boolean
}

interface Props {
  services: Service[]
  business: { id: string; currency: string }
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']

const INITIAL_FORM = {
  name: '', description: '', category: '', duration_minutes: '60',
  buffer_minutes: '0', price: '', color: '#8B5CF6', is_active: true,
}

export function ServicesManager({ services, business }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setSelectedService(null)
    setForm(INITIAL_FORM)
    setDialogOpen(true)
  }

  function openEdit(service: Service) {
    setSelectedService(service)
    setForm({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
      duration_minutes: service.duration_minutes.toString(),
      buffer_minutes: service.buffer_minutes.toString(),
      price: service.price.toString(),
      color: service.color || '#8B5CF6',
      is_active: service.is_active,
    })
    setDialogOpen(true)
  }

  async function toggleActive(service: Service) {
    await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    router.refresh()
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' })
      return
    }
    setSaving(true)

    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      buffer_minutes: parseInt(form.buffer_minutes) || 0,
      price: parseFloat(form.price) || 0,
      color: form.color,
      is_active: form.is_active,
    }

    const { error } = selectedService
      ? await supabase.from('services').update(payload).eq('id', selectedService.id)
      : await supabase.from('services').insert(payload)

    setSaving(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: selectedService ? 'Servicio actualizado' : 'Servicio creado' })
      setDialogOpen(false)
      router.refresh()
    }
  }

  const active = services.filter(s => s.is_active)
  const inactive = services.filter(s => !s.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-sm text-muted-foreground">{active.length} servicios activos</p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
          onClick={openNew}
        >
          <Plus className="w-4 h-4 mr-1" /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Scissors className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Aún no has creado servicios</p>
          <Button variant="link" onClick={openNew} className="mt-2">Crea tu primer servicio</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((service) => (
              <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                      <h3 className="font-semibold text-sm">{service.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(service)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => toggleActive(service)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {service.duration_minutes}min
                      </span>
                      {service.buffer_minutes > 0 && (
                        <span className="text-xs">+{service.buffer_minutes}min buffer</span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-violet-700">
                      {formatCurrency(service.price, business.currency)}
                    </span>
                  </div>
                  {service.category && (
                    <Badge variant="secondary" className="mt-2 text-xs">{service.category}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {inactive.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Servicios inactivos ({inactive.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                {inactive.map((service) => (
                  <Card key={service.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0 bg-gray-300" />
                          <h3 className="font-semibold text-sm">{service.name}</h3>
                        </div>
                        <Switch
                          checked={false}
                          onCheckedChange={() => toggleActive(service)}
                          className="scale-75"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedService ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Corte de cabello"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción breve del servicio..."
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input
                  placeholder="Ej: Cabello, Uñas"
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Buffer (minutos)</Label>
                <Input
                  type="number"
                  value={form.buffer_minutes}
                  onChange={(e) => setForm(f => ({ ...f, buffer_minutes: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Color en calendario</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm(f => ({ ...f, color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))}
                />
                <Label>Servicio activo (visible para reservas)</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Guardando...' : selectedService ? 'Actualizar' : 'Crear servicio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
