'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Plus, Edit, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface StaffMember {
  id: string
  name: string
  email?: string
  phone?: string
  bio?: string
  avatar_url?: string
  color: string
  role: string
  is_active: boolean
}

interface Props {
  staff: StaffMember[]
  business: { id: string; name: string }
  services: { id: string; name: string }[]
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']
const INITIAL_FORM = { name: '', email: '', phone: '', bio: '', color: '#8B5CF6', role: 'staff', is_active: true }

export function StaffManager({ staff, business }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setSelectedStaff(null)
    setForm(INITIAL_FORM)
    setDialogOpen(true)
  }

  function openEdit(member: StaffMember) {
    setSelectedStaff(member)
    setForm({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      bio: member.bio || '',
      color: member.color || '#8B5CF6',
      role: member.role || 'staff',
      is_active: member.is_active,
    })
    setDialogOpen(true)
  }

  async function toggleActive(member: StaffMember) {
    await supabase.from('staff').update({ is_active: !member.is_active }).eq('id', member.id)
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
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      color: form.color,
      role: form.role,
      is_active: form.is_active,
    }

    const { error } = selectedStaff
      ? await supabase.from('staff').update(payload).eq('id', selectedStaff.id)
      : await supabase.from('staff').insert(payload)

    setSaving(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: selectedStaff ? 'Profesional actualizado' : 'Profesional creado' })
      setDialogOpen(false)
      router.refresh()
    }
  }

  const active = staff.filter(s => s.is_active)
  const inactive = staff.filter(s => !s.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipo / Profesionales</h1>
          <p className="text-sm text-muted-foreground">{active.length} profesionales activos</p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
          onClick={openNew}
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar profesional
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <UserCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Aún no has agregado profesionales</p>
          <Button variant="link" onClick={openNew} className="mt-2">Agrega tu primer profesional</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((member) => (
            <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback
                        className="text-white text-sm font-semibold"
                        style={{ backgroundColor: member.color }}
                      >
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role === 'owner' ? 'Dueño/a' : 'Staff'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(member)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => toggleActive(member)}
                      className="scale-75"
                    />
                  </div>
                </div>
                {member.bio && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{member.bio}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                  <span className="text-xs text-muted-foreground">Color en calendario</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {inactive.map((member) => (
            <Card key={member.id} className="border-0 shadow-sm opacity-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-200 text-gray-500 text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">Inactivo</p>
                    </div>
                  </div>
                  <Switch
                    checked={false}
                    onCheckedChange={() => toggleActive(member)}
                    className="scale-75"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Editar profesional' : 'Nuevo profesional'}</DialogTitle>
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
                  placeholder="+56 9..."
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Biografía</Label>
              <Textarea
                placeholder="Especialidad, experiencia..."
                value={form.bio}
                onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
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
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label>Profesional activo</Label>
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
                {saving ? 'Guardando...' : selectedStaff ? 'Actualizar' : 'Crear profesional'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
