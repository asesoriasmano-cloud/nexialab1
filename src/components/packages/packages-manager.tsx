'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { createPackage, updatePackage, deletePackage } from '@/actions/packages'
import { Plus, Package, Tag, Users, Pencil, Trash2, CheckCircle } from 'lucide-react'

interface PackagesManagerProps {
  packages: any[]
  services: any[]
  clientPackages: any[]
  businessId: string
  currency: string
}

const defaultForm = {
  name: '',
  description: '',
  service_id: '',
  sessions_count: 5,
  price: 0,
  valid_days: 180,
  is_active: true,
}

export function PackagesManager({ packages, services, clientPackages, businessId, currency }: PackagesManagerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'packages' | 'sold'>('packages')

  function openNew() {
    setEditing(null)
    setForm(defaultForm)
    setOpen(true)
  }

  function openEdit(pkg: any) {
    setEditing(pkg)
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      service_id: pkg.service_id || '',
      sessions_count: pkg.sessions_count,
      price: pkg.price,
      valid_days: pkg.valid_days,
      is_active: pkg.is_active,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || form.price <= 0 || form.sessions_count <= 0) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      if (editing) {
        await updatePackage(editing.id, form)
        toast({ title: 'Paquete actualizado' })
      } else {
        await createPackage({ ...form, business_id: businessId })
        toast({ title: 'Paquete creado' })
      }
      setOpen(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este paquete?')) return
    try {
      await deletePackage(id)
      toast({ title: 'Paquete eliminado' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const selectedService = services.find(s => s.id === form.service_id)
  const originalPrice = selectedService ? selectedService.price * form.sessions_count : 0
  const discount = originalPrice > 0 ? Math.round((1 - form.price / originalPrice) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'packages', label: 'Paquetes activos', icon: Package },
          { id: 'sold', label: 'Paquetes vendidos', icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
        <div className="flex-1 flex justify-end pb-2">
          <Button onClick={openNew} size="sm" className="bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white">
            <Plus className="mr-1 h-4 w-4" />
            Nuevo paquete
          </Button>
        </div>
      </div>

      {/* Packages tab */}
      {tab === 'packages' && (
        <div>
          {packages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-600 mb-1">Sin paquetes aún</h3>
              <p className="text-sm text-gray-400 mb-4">Crea paquetes de sesiones para fidelizar clientes</p>
              <Button onClick={openNew} variant="outline" size="sm">Crear primer paquete</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg: any) => {
                const perSession = pkg.sessions_count > 0 ? pkg.price / pkg.sessions_count : 0
                return (
                  <Card key={pkg.id} className={`border-0 shadow-sm relative overflow-hidden ${!pkg.is_active ? 'opacity-60' : ''}`}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-pink-500" />
                    <CardContent className="p-5 pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          {pkg.service && (
                            <p className="text-xs text-gray-500 mt-0.5">{pkg.service.name}</p>
                          )}
                        </div>
                        {!pkg.is_active && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(pkg.price, currency)}</span>
                        <span className="text-sm text-gray-500">/ paquete</span>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          {pkg.sessions_count} sesiones incluidas
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          {formatCurrency(perSession, currency)} por sesión
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          Válido por {pkg.valid_days} días
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-gray-400 mb-4">{pkg.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(pkg)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(pkg.id)}
                          className="text-red-500 hover:text-red-600 hover:border-red-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Sold packages tab */}
      {tab === 'sold' && (
        <div>
          {clientPackages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-400">No hay paquetes vendidos aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paquete</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sesiones</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientPackages.map((cp: any) => {
                    const remaining = cp.sessions_remaining
                    const total = cp.sessions_total
                    const pct = (remaining / total) * 100
                    const expired = cp.expires_at && new Date(cp.expires_at) < new Date()
                    return (
                      <tr key={cp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{cp.client?.name || '-'}</p>
                            <p className="text-xs text-gray-400">{cp.client?.email || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{cp.package?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">{remaining} de {total}</span>
                              <span className="text-gray-500">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {cp.expires_at ? new Date(cp.expires_at).toLocaleDateString('es-CL') : 'Sin vencimiento'}
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">Vencido</Badge>
                          ) : remaining === 0 ? (
                            <Badge variant="outline" className="text-xs text-gray-500">Agotado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">Activo</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Package form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar paquete' : 'Nuevo paquete'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del paquete *</Label>
              <Input
                placeholder="Ej: Pack 5 sesiones, Membresía mensual..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Servicio incluido</Label>
              <Select value={form.service_id} onValueChange={v => setForm(f => ({ ...f, service_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier servicio</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price, currency)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Número de sesiones *</Label>
                <Input
                  type="number" min={1}
                  value={form.sessions_count}
                  onChange={e => setForm(f => ({ ...f, sessions_count: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio del paquete *</Label>
                <Input
                  type="number" min={0}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            {originalPrice > 0 && form.price > 0 && (
              <div className={`p-3 rounded-lg text-sm ${discount > 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {discount > 0
                  ? `✓ ${discount}% de descuento vs precio individual (${formatCurrency(originalPrice, currency)})`
                  : `Sin descuento respecto al precio individual`}
              </div>
            )}
            <div className="space-y-2">
              <Label>Válido por (días)</Label>
              <Input
                type="number" min={1}
                value={form.valid_days}
                onChange={e => setForm(f => ({ ...f, valid_days: parseInt(e.target.value) || 180 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción opcional del paquete..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
              {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear paquete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
