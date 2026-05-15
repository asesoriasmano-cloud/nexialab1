'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import { Plus, Search, Phone, Mail, Edit, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  tags: string[]
  visit_count: number
  total_spent: number
  last_visit_at?: string
  created_at: string
}

interface Props {
  clients: Client[]
  business: { id: string; name: string; currency: string }
}

const INITIAL_FORM = { name: '', email: '', phone: '', notes: '', tags: '' }

export function ClientsManager({ clients, business }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = clients.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  function openNew() {
    setSelectedClient(null)
    setForm(INITIAL_FORM)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setSelectedClient(client)
    setForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
      tags: client.tags?.join(', ') || '',
    })
    setDialogOpen(true)
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
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    const { error } = selectedClient
      ? await supabase.from('clients').update(payload).eq('id', selectedClient.id)
      : await supabase.from('clients').insert(payload)

    setSaving(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: selectedClient ? 'Cliente actualizado' : 'Cliente creado' })
      setDialogOpen(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clientes registrados</p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
          onClick={openNew}
        >
          <Plus className="w-4 h-4 mr-1" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {search ? 'No se encontraron clientes con ese criterio' : 'Aún no tienes clientes registrados'}
          </p>
          {!search && (
            <Button variant="link" onClick={openNew} className="mt-2">
              Agrega tu primer cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Total gastado</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {formatDate(client.created_at, 'MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{client.visit_count}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(client.total_spent, business.currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.last_visit_at ? formatDate(client.last_visit_at, 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {client.tags?.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{client.tags.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  placeholder="+56 9 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                placeholder="vip, recurrente, referido (separados por coma)"
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas internas</Label>
              <Textarea
                placeholder="Observaciones del cliente..."
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
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
                {saving ? 'Guardando...' : selectedClient ? 'Actualizar' : 'Crear cliente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
