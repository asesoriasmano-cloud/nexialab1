'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { saveBusiness, saveWorkingHours } from '@/actions/businesses'
import { BUSINESS_CATEGORIES, DAYS_OF_WEEK, generateSlug } from '@/lib/utils'
import {
  Building2, Clock, CheckCircle2, Palette, ChevronRight, ChevronLeft, Scissors
} from 'lucide-react'

const STEPS = [
  { id: 'business', title: 'Tu negocio', icon: Building2 },
  { id: 'hours', title: 'Horario', icon: Clock },
  { id: 'branding', title: 'Marca', icon: Palette },
  { id: 'done', title: 'Listo', icon: CheckCircle2 },
]

const DEFAULT_HOURS = DAYS_OF_WEEK.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '18:00',
  is_active: i >= 1 && i <= 5,
}))

const PRESET_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
]

interface OnboardingPageProps {
  userId: string
}

export default function OnboardingPage({ userId }: OnboardingPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [business, setBusiness] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    timezone: 'America/Santiago',
    currency: 'CLP',
    min_advance_hours: 1,
    cancellation_hours: 24,
    booking_window_days: 60,
    deposit_required: false,
    deposit_percentage: 30,
    primary_color: '#8B5CF6',
  })

  const [hours, setHours] = useState(DEFAULT_HOURS)

  function handleNameChange(name: string) {
    setBusiness(b => ({ ...b, name, slug: generateSlug(name) }))
  }

  function toggleDay(index: number) {
    setHours(h => h.map((d, i) => i === index ? { ...d, is_active: !d.is_active } : d))
  }

  function updateHour(index: number, field: 'start_time' | 'end_time', value: string) {
    setHours(h => h.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  async function handleFinish() {
    if (!business.name || !business.category) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await saveBusiness({ ...business, owner_id: userId })

      const { data: biz } = await fetch('/api/business/mine').then(r => r.json()).catch(() => ({ data: null }))

      if (biz?.id) {
        await saveWorkingHours(biz.id, hours)
      }

      toast({ title: '¡Negocio configurado! Bienvenido a CitaPro 🎉' })
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error guardando', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CitaPro</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configura tu negocio</h1>
          <p className="text-gray-500 text-sm mt-1">Solo toma 2 minutos y puedes modificarlo después</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? 'bg-violet-600 text-white shadow-md' :
                i < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Step 0: Business Info */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900">Información del negocio</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Nombre del negocio *</Label>
                    <Input
                      placeholder="Ej: Salón Bella, Barbería El Rey..."
                      value={business.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="h-11"
                    />
                    {business.slug && (
                      <p className="text-xs text-gray-400">
                        Tu página: <span className="text-violet-600 font-medium">citapro.cl/book/{business.slug}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de negocio *</Label>
                    <Select value={business.category} onValueChange={v => setBusiness(b => ({ ...b, category: v }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      placeholder="Santiago"
                      value={business.city}
                      onChange={e => setBusiness(b => ({ ...b, city: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+56 9 1234 5678"
                      value={business.phone}
                      onChange={e => setBusiness(b => ({ ...b, phone: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de contacto</Label>
                    <Input
                      type="email"
                      placeholder="hola@minegocio.cl"
                      value={business.email}
                      onChange={e => setBusiness(b => ({ ...b, email: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Descripción breve</Label>
                    <Textarea
                      placeholder="Describe tu negocio en pocas palabras..."
                      value={business.description}
                      onChange={e => setBusiness(b => ({ ...b, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Working Hours */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900">Horario de atención</h2>
                <p className="text-sm text-gray-500">¿Qué días y horarios atiendes?</p>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                      hours[i].is_active ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
                    }`}>
                      <Switch
                        checked={hours[i].is_active}
                        onCheckedChange={() => toggleDay(i)}
                      />
                      <span className={`w-24 text-sm font-medium ${hours[i].is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      {hours[i].is_active ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={hours[i].start_time}
                            onChange={e => updateHour(i, 'start_time', e.target.value)}
                            className="h-8 text-sm w-28"
                          />
                          <span className="text-gray-400 text-sm">a</span>
                          <Input
                            type="time"
                            value={hours[i].end_time}
                            onChange={e => updateHour(i, 'end_time', e.target.value)}
                            className="h-8 text-sm w-28"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 flex-1">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Personalización</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Color principal</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setBusiness(b => ({ ...b, primary_color: color }))}
                          className={`w-10 h-10 rounded-xl transition-transform ${
                            business.primary_color === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Política de cancelación</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { hours: 2, label: '2 horas' },
                        { hours: 24, label: '24 horas' },
                        { hours: 48, label: '48 horas' },
                      ].map(opt => (
                        <button
                          key={opt.hours}
                          onClick={() => setBusiness(b => ({ ...b, cancellation_hours: opt.hours }))}
                          className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                            business.cancellation_hours === opt.hours
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Tiempo mínimo antes del cual el cliente puede cancelar</p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Requerir depósito</p>
                      <p className="text-xs text-gray-500">Los clientes pagan un % al reservar</p>
                    </div>
                    <Switch
                      checked={business.deposit_required}
                      onCheckedChange={v => setBusiness(b => ({ ...b, deposit_required: v }))}
                    />
                  </div>

                  {business.deposit_required && (
                    <div className="space-y-2">
                      <Label>Porcentaje de depósito: {business.deposit_percentage}%</Label>
                      <input
                        type="range"
                        min={10} max={100} step={5}
                        value={business.deposit_percentage}
                        onChange={e => setBusiness(b => ({ ...b, deposit_percentage: parseInt(e.target.value) }))}
                        className="w-full accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>10%</span><span>50%</span><span>100%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="p-4 text-white" style={{ backgroundColor: business.primary_color }}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold mb-2">
                      {business.name[0] || 'N'}
                    </div>
                    <p className="font-bold text-lg">{business.name || 'Tu negocio'}</p>
                    <p className="text-sm opacity-80">{business.city || 'Tu ciudad'}</p>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-xs text-gray-500">Así verán tu página de reservas los clientes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center py-6 space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">¡Todo listo!</h2>
                  <p className="text-gray-500 mt-2">
                    <strong>{business.name}</strong> está configurado y listo para recibir reservas.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl p-5 text-left space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Próximos pasos recomendados:</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">1</span>
                      Agrega tus servicios y precios
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">2</span>
                      Crea perfiles de tus profesionales
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">3</span>
                      Comparte tu link de reservas con tus clientes
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0 text-base font-medium"
                >
                  {loading ? 'Guardando...' : 'Ir al panel →'}
                </Button>
              </div>
            )}

            {/* Navigation */}
            {step < 3 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={() => {
                    if (step === 0 && (!business.name || !business.category)) {
                      toast({ title: 'Completa el nombre y tipo de negocio', variant: 'destructive' })
                      return
                    }
                    setStep(s => s + 1)
                  }}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
