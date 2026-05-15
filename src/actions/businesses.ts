'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/utils'

export async function saveBusiness(data: {
  owner_id: string
  name: string
  slug: string
  description?: string
  category: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  timezone?: string
  currency?: string
  booking_window_days?: number
  min_advance_hours?: number
  cancellation_hours?: number
  deposit_required?: boolean
  deposit_percentage?: number
  primary_color?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== data.owner_id) throw new Error('No autorizado')

  const slug = data.slug || generateSlug(data.name)

  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('businesses')
      .update({ ...data, slug, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('businesses')
      .insert({ ...data, slug })
    if (error) throw error
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

export async function saveWorkingHours(businessId: string, hours: {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses').select('id').eq('id', businessId).eq('owner_id', user.id).single()
  if (!business) throw new Error('No autorizado')

  // Delete existing and insert new
  await supabase.from('working_hours').delete().eq('business_id', businessId)

  const toInsert = hours.filter(h => h.is_active).map(h => ({
    business_id: businessId,
    day_of_week: h.day_of_week,
    start_time: h.start_time,
    end_time: h.end_time,
    is_active: true,
  }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('working_hours').insert(toInsert)
    if (error) throw error
  }

  revalidatePath('/dashboard/settings')
}
