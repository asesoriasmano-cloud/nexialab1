'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientAction(data: {
  business_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  tags?: string[]
  birth_date?: string
  address?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: client, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/clients')
  return client
}

export async function updateClientAction(clientId: string, data: {
  name?: string
  email?: string
  phone?: string
  notes?: string
  tags?: string[]
  birth_date?: string
  address?: string
  is_active?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('clients')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/dashboard/clients')
}

// Alias used by client-detail component
export const updateClient = updateClientAction

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/dashboard/clients')
}
