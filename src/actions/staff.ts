'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStaffAction(data: {
  business_id: string
  name: string
  email?: string
  phone?: string
  bio?: string
  role?: string
  color?: string
  service_ids?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { service_ids, ...staffData } = data

  const { data: staff, error } = await supabase
    .from('staff')
    .insert({ ...staffData, is_active: true })
    .select()
    .single()

  if (error) throw error

  if (service_ids && service_ids.length > 0) {
    await supabase.from('staff_services').insert(
      service_ids.map(sid => ({ staff_id: staff.id, service_id: sid }))
    )
  }

  revalidatePath('/dashboard/staff')
  return staff
}

export async function updateStaffAction(staffId: string, data: Partial<{
  name: string
  email: string
  phone: string
  bio: string
  color: string
  is_active: boolean
  service_ids: string[]
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { service_ids, ...staffData } = data

  if (Object.keys(staffData).length > 0) {
    const { error } = await supabase
      .from('staff')
      .update({ ...staffData, updated_at: new Date().toISOString() })
      .eq('id', staffId)
    if (error) throw error
  }

  if (service_ids !== undefined) {
    await supabase.from('staff_services').delete().eq('staff_id', staffId)
    if (service_ids.length > 0) {
      await supabase.from('staff_services').insert(
        service_ids.map(sid => ({ staff_id: staffId, service_id: sid }))
      )
    }
  }

  revalidatePath('/dashboard/staff')
}
