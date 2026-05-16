'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUSES } from '@/lib/utils'
import { updateClient } from '@/actions/clients'
import {
  ArrowLeft, Phone, Mail, Calendar, DollarSign, Award,
  MessageSquare, Tag, TrendingUp, Package, Pencil, Save, X
} from 'lucide-react'

interface ClientDetailProps {
  client: any
  appointments: any[]
  clientPackages: any[]
  currency: string
  businessId: string
}

export function ClientDetail({ client, appointments, clientPackages, currency, businessId }: ClientDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    notes: client.notes || '',
    tags: (client.tags || []).join(', '),
    address: client.address || '',
  })
  const [newTag, setNewTag] = useState('')

  const initials = client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const completedAppts = appointments.filter(a => a.status === 'completed')
  const cancelledAppts = appointments.filter(a => a.status === 'cancelled')
  const noShowAppts = appointments.filter(a => a.status === 'no_show')

  async function handleSave() {
    setSaving(true)
    try {
      await updateClient(client.id, {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      toast({ title: 'Cliente actualizado' })
      setEditing(false)
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Perfil del cliente</h1>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client card + stats */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-100 to-pink-100 text-violet-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {editing ? (
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="text-center font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Cliente desde {formatDate(client.created_at, 'MMMM yyyy')}
                </p>
              </div>

              <div className="space-y-3">
                {editing ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@ejemplo.cl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+56 9..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dirección</Label>
                      <Input
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tags (separados por coma)</Label>
                      <Input
                        value={form.tags}
                        onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                        placeholder="VIP, recurrente, ..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {client.phone}
                      </a>
                    )}
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {client.email}
                      </a>
                    )}
                    {client.address && (
                      <p className="text-sm text-gray-500">{client.address}</p>
                    )}
                    {client.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {client.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatMini icon={Calendar} label="Visitas" value={client.visit_count} color="text-violet-600" bg="bg-violet-50" />
            <StatMini icon={DollarSign} label="Total gastado" value={formatCurrency(client.total_spent, currency)} color="text-green-600" bg="bg-green-50" />
            <StatMini icon={Award} label="Completadas" value={completedAppts.length} color="text-blue-600" bg="bg-blue-50" />
            <StatMini icon={TrendingUp} label="No shows" value={client.no_show_count} color="text-red-500" bg="bg-red-50" />
          </div>

          {/* Packages */}
          {clientPackages.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Paquetes activos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clientPackages.map((cp: any) => (
                  <div key={cp.id} className="p-3 bg-violet-50 rounded-lg">
                    <p className="text-sm font-medium text-violet-900">{cp.package?.name}</p>
                    <p className="text-xs text-violet-600">{cp.sessions_remaining} de {cp.sessions_total} sesiones restantes</p>
                    <div className="h-1.5 bg-violet-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(cp.sessions_remaining / cp.sessions_total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Preferencias, alergias, observaciones..."
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {client.notes || <span className="text-gray-400 italic">Sin notas</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Appointment history */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Historial de citas</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin citas registradas</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appt: any) => {
                    const statusInfo = APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]
                    return (
                      <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                          <div className="flex-shrink-0 text-center bg-gray-100 rounded-lg p-2 w-11">
                            <div className="text-xs text-gray-500">{formatDate(appt.start_time, 'MMM')}</div>
                            <div className="text-base font-bold text-gray-800 leading-none">{formatDate(appt.start_time, 'd')}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{appt.service?.name || 'Servicio'}</p>
                            <p className="text-xs text-gray-500">
                              {formatTime(appt.start_time)} · {appt.staff?.name || 'Sin profesional'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(appt.price || appt.service?.price || 0, currency)}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-0.5 ${statusInfo?.color}`}
                            >
                              {statusInfo?.label}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatMini({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
