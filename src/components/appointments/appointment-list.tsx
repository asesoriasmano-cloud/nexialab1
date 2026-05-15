'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUSES } from '@/lib/utils'
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  price?: number
  notes?: string
  clients: { name: string; email?: string; phone?: string } | null
  staff: { name: string; color: string } | null
  services: { name: string; duration_minutes: number; color: string } | null
}

interface Props {
  appointments: Appointment[]
  business: { id: string; name: string; currency: string }
  services: { id: string; name: string }[]
  staff: { id: string; name: string }[]
  clients: { id: string; name: string; email?: string; phone?: string }[]
}

export function AppointmentsList({ appointments, business, services, staff, clients }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [newApptOpen, setNewApptOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    service_id: '',
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: '',
    price: '',
    status: 'confirmed',
  })

  const filtered = appointments.filter((a) => {
    const matchSearch = !search ||
      a.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.services?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.staff?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Estado actualizado' })
      router.refresh()
    }
    setSelectedAppt(null)
  }

  async function createAppointment() {
    if (!form.client_id || !form.service_id || !form.date || !form.time) {
      toast({ title: 'Faltan datos', description: 'Cliente, servicio, fecha y hora son requeridos', variant: 'destructive' })
      return
    }

    setSaving(true)
    const service = services.find(s => s.id === form.service_id)
    const startTime = `${form.date}T${form.time}:00`

    const { error } = await supabase.from('appointments').insert({
      business_id: business.id,
      client_id: form.client_id,
      service_id: form.service_id,
      staff_id: form.staff_id || null,
      start_time: startTime,
      end_time: startTime,
      status: form.status,
      notes: form.notes || null,
      price: form.price ? parseFloat(form.price) : null,
      source: 'manual',
    })

    setSaving(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Cita creada exitosamente' })
      setNewApptOpen(false)
      setForm({ client_id: '', service_id: '', staff_id: '', date: new Date().toISOString().split('T')[0], time: '10:00', notes: '', price: '', status: 'confirmed' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Citas</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} citas encontradas</p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
          onClick={() => setNewApptOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Nueva cita
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, servicio o profesional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2 opacity-50" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(APPOINTMENT_STATUSES).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No se encontraron citas
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((appt) => {
                const status = APPOINTMENT_STATUSES[appt.status as keyof typeof APPOINTMENT_STATUSES]
                return (
                  <TableRow key={appt.id} className="cursor-pointer" onClick={() => setSelectedAppt(appt)}>
                    <TableCell>
                      <div className="text-sm font-medium">{formatDate(appt.start_time, 'dd/MM/yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{formatTime(appt.start_time)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{appt.clients?.name || '-'}</div>
                      {appt.clients?.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {appt.clients.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {appt.services?.color && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: appt.services.color }} />
                        )}
                        <span className="text-sm">{appt.services?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{appt.staff?.name || '-'}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {appt.price ? formatCurrency(appt.price, business.currency) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${status?.color}`}>{status?.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'confirmed') }}>
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'completed') }}>
                            Marcar completada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'no_show') }}>
                            Marcar no-show
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'cancelled') }}
                          >
                            Cancelar cita
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Appointment detail dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de cita</DialogTitle>
          </DialogHeader>
          {selectedAppt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Cliente</span>
                  <p className="font-medium">{selectedAppt.clients?.name}</p>
                  {selectedAppt.clients?.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {selectedAppt.clients.email}
                    </p>
                  )}
                  {selectedAppt.clients?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {selectedAppt.clients.phone}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Fecha y hora</span>
                  <p className="font-medium">{formatDate(selectedAppt.start_time, 'PPP')}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedAppt.start_time)} - {formatTime(selectedAppt.end_time)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Servicio</span>
                  <p className="font-medium">{selectedAppt.services?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAppt.services?.duration_minutes}min</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Profesional</span>
                  <p className="font-medium">{selectedAppt.staff?.name || 'Sin asignar'}</p>
                </div>
              </div>
              {selectedAppt.notes && (
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Notas</span>
                  <p className="text-sm bg-muted rounded p-2">{selectedAppt.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => updateStatus(selectedAppt.id, 'completed')} className="flex-1">
                  Completada
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(selectedAppt.id, 'no_show')} className="flex-1">
                  No-show
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedAppt.id, 'cancelled')}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New appointment dialog */}
      <Dialog open={newApptOpen} onOpenChange={setNewApptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Servicio *</Label>
                <Select value={form.service_id} onValueChange={(v) => setForm(f => ({ ...f, service_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profesional</Label>
                <Select value={form.staff_id} onValueChange={(v) => setForm(f => ({ ...f, staff_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquiera disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquiera disponible</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPOINTMENT_STATUSES).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Precio</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones internas..."
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setNewApptOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600" onClick={createAppointment} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear cita'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
