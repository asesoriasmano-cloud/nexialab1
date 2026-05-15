'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createServiceAction(data: {
  business_id: string
  name: string
  description?: string
  category?: string
  duration_minutes: number
  buffer_minutes?: number
  price: number
  color?: string
  is_active?: boolean
  requires_intake?: boolean
  intake_questions?: any[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: service, error } = await supabase
    .from('services')
    .insert({ ...data, buffer_minutes: data.buffer_minutes || 0, is_active: data.is_active !== false })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/services')
  return service
}

export async function updateServiceAction(serviceId: string, data: Partial<{
  name: string
  description: string
  duration_minutes: number
  buffer_minutes: number
  price: number
  color: string
  is_active: boolean
  requires_intake: boolean
  intake_questions: any[]
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('services')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', serviceId)

  if (error) throw error

  revalidatePath('/dashboard/services')
}

export async function deleteServiceAction(serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', serviceId)

  if (error) throw error

  revalidatePath('/dashboard/services')
}
