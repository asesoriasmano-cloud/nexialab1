'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { BUSINESS_CATEGORIES, DAYS_OF_WEEK, generateSlug } from '@/lib/utils'
import { saveBusiness, saveWorkingHours } from '@/actions/businesses'
import { Loader2, Copy, ExternalLink } from 'lucide-react'

interface SettingsFormProps {
  business: any
  workingHours: any[]
  userId: string
}

const DEFAULT_HOURS = DAYS_OF_WEEK.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '18:00',
  is_active: i >= 1 && i <= 5,
}))

export function SettingsForm({ business, workingHours, userId }: SettingsFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: business?.name || '',
    slug: business?.slug || '',
    description: business?.description || '',
    category: business?.category || 'salon',
    phone: business?.phone || '',
    email: business?.email || '',
    website: business?.website || '',
    address: business?.address || '',
    city: business?.city || '',
    timezone: business?.timezone || 'America/Santiago',
    currency: business?.currency || 'CLP',
    booking_window_days: business?.booking_window_days || 60,
    min_advance_hours: business?.min_advance_hours || 1,
    cancellation_hours: business?.cancellation_hours || 24,
    deposit_required: business?.deposit_required || false,
    deposit_percentage: business?.deposit_percentage || 30,
    primary_color: business?.primary_color || '#8B5CF6',
  })

  const hours = workingHours.length > 0
    ? DAYS_OF_WEEK.map((_, i) => {
        const existing = workingHours.find(h => h.day_of_week === i)
        return existing || DEFAULT_HOURS[i]
      })
    : DEFAULT_HOURS

  const [schedule, setSchedule] = useState(hours)

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !business ? generateSlug(name) : prev.slug,
    }))
  }

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await saveBusiness({ ...formData, owner_id: userId })
      toast({ title: 'Configuración guardada', description: 'Los cambios han sido guardados exitosamente.' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSchedule() {
    setLoading(true)
    try {
      if (!business?.id) {
        toast({ variant: 'destructive', title: 'Primero guarda los datos del negocio' })
        return
      }
      await saveWorkingHours(business.id, schedule)
      toast({ title: 'Horarios guardados' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const bookingUrl = business?.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${business.slug}` : null

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="schedule">Horarios</TabsTrigger>
        <TabsTrigger value="booking">Reservas</TabsTrigger>
        <TabsTrigger value="plan">Plan</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <form onSubmit={handleSaveBusiness}>
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Datos del negocio</CardTitle>
                <CardDescription>Información básica que verán tus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del negocio *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="Mi Salón de Belleza"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL de reservas</Label>
                    <div className="flex gap-2">
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                        placeholder="mi-salon"
                        className="font-mono text-sm"
                      />
                      {bookingUrl && (
                        <Button type="button" variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(bookingUrl)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {bookingUrl && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {bookingUrl}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe tu negocio..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contacto</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="contacto@minegoio.cl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Av. Providencia 1234" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} placeholder="Santiago" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Color principal</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={e => setFormData(p => ({ ...p, primary_color: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <Input value={formData.primary_color} onChange={e => setFormData(p => ({ ...p, primary_color: e.target.value }))} className="font-mono text-sm" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar cambios
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="schedule">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Horarios de atención</CardTitle>
            <CardDescription>Define los días y horas en que atiendes clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.map((day, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Switch
                    checked={day.is_active}
                    onCheckedChange={checked => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, is_active: checked } : d))}
                  />
                  <span className={`text-sm font-medium w-24 ${!day.is_active ? 'text-gray-400' : 'text-gray-900'}`}>
                    {DAYS_OF_WEEK[i]}
                  </span>
                  {day.is_active ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.start_time}
                        onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, start_time: e.target.value } : d))}
                        className="w-28 text-sm"
                      />
                      <span className="text-gray-400 text-sm">a</span>
                      <Input
                        type="time"
                        value={day.end_time}
                        onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, end_time: e.target.value } : d))}
                        className="w-28 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleSaveSchedule} disabled={loading} className="mt-6 bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar horarios
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="booking">
        <form onSubmit={handleSaveBusiness}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Configuración de reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ventana de reserva (días)</Label>
                  <Input
                    type="number"
                    value={formData.booking_window_days}
                    onChange={e => setFormData(p => ({ ...p, booking_window_days: parseInt(e.target.value) }))}
                    min={1} max={365}
                  />
                  <p className="text-xs text-gray-400">¿Con cuántos días de antelación puede reservar?</p>
                </div>
                <div className="space-y-2">
                  <Label>Antelación mínima (horas)</Label>
                  <Input
                    type="number"
                    value={formData.min_advance_hours}
                    onChange={e => setFormData(p => ({ ...p, min_advance_hours: parseInt(e.target.value) }))}
                    min={0} max={72}
                  />
                  <p className="text-xs text-gray-400">Mínimo de horas para reservar</p>
                </div>
                <div className="space-y-2">
                  <Label>Horas para cancelar sin penalidad</Label>
                  <Input
                    type="number"
                    value={formData.cancellation_hours}
                    onChange={e => setFormData(p => ({ ...p, cancellation_hours: parseInt(e.target.value) }))}
                    min={0} max={168}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Depósito requerido</Label>
                    <p className="text-xs text-gray-400">Cobrar depósito al reservar para reducir no-shows</p>
                  </div>
                  <Switch
                    checked={formData.deposit_required}
                    onCheckedChange={checked => setFormData(p => ({ ...p, deposit_required: checked }))}
                  />
                </div>
                {formData.deposit_required && (
                  <div className="space-y-2 pl-4 border-l-2 border-violet-200">
                    <Label>Porcentaje de depósito (%)</Label>
                    <Input
                      type="number"
                      value={formData.deposit_percentage}
                      onChange={e => setFormData(p => ({ ...p, deposit_percentage: parseInt(e.target.value) }))}
                      min={10} max={100} className="w-32"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar configuración
              </Button>
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="plan">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Plan actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg border border-violet-100">
              <div>
                <p className="font-semibold text-gray-900 capitalize">Plan {business?.plan || 'Gratis'}</p>
                <p className="text-sm text-gray-500">
                  {business?.plan_expires_at ? `Expira: ${business.plan_expires_at}` : 'Sin fecha de expiración'}
                </p>
              </div>
              <Badge className="ml-auto capitalize">{business?.plan || 'free'}</Badge>
            </div>
            <div className="mt-6">
              <Button className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
                Mejorar plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
