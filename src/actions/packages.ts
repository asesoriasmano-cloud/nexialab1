'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPackage(data: {
  business_id: string
  name: string
  description?: string
  service_id?: string
  sessions_count: number
  price: number
  valid_days: number
  is_active: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('id', data.business_id).eq('owner_id', user.id).single()
  if (!business) throw new Error('No autorizado')

  const { error } = await supabase.from('packages').insert({
    ...data,
    service_id: data.service_id || null,
  })
  if (error) throw error
  revalidatePath('/dashboard/packages')
}

export async function updatePackage(id: string, data: Partial<{
  name: string
  description: string
  service_id: string
  sessions_count: number
  price: number
  valid_days: number
  is_active: boolean
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: pkg } = await supabase
    .from('packages')
    .select('business_id')
    .eq('id', id)
    .single()

  if (!pkg) throw new Error('No encontrado')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('id', pkg.business_id).eq('owner_id', user.id).single()
  if (!business) throw new Error('No autorizado')

  const { error } = await supabase.from('packages').update({
    ...data,
    service_id: data.service_id || null,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/packages')
}

export async function deletePackage(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: pkg } = await supabase.from('packages').select('business_id').eq('id', id).single()
  if (!pkg) throw new Error('No encontrado')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('id', pkg.business_id).eq('owner_id', user.id).single()
  if (!business) throw new Error('No autorizado')

  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/packages')
}

export async function assignPackageToClient(data: {
  package_id: string
  client_id: string
  business_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: pkg } = await supabase
    .from('packages').select('*').eq('id', data.package_id).single()
  if (!pkg) throw new Error('Paquete no encontrado')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + pkg.valid_days)

  const { error } = await supabase.from('client_packages').insert({
    ...data,
    sessions_remaining: pkg.sessions_count,
    sessions_total: pkg.sessions_count,
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw error
  revalidatePath('/dashboard/packages')
}
