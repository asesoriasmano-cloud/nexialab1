import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('business_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

  let query = supabase
    .from('appointments')
    .select('*, client:clients(name, phone, email), service:services(name, color, duration_minutes, price), staff:staff(name, color)')
    .eq('business_id', businessId)
    .neq('status', 'cancelled')

  if (from) query = query.gte('start_time', from)
  if (to) query = query.lte('start_time', to)

  const { data, error } = await query.order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('appointments')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}
