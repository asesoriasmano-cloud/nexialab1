import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const appointmentId = session.metadata?.appointment_id
      
      if (appointmentId) {
        await supabase
          .from('appointments')
          .update({ deposit_paid: true, status: 'confirmed' })
          .eq('id', appointmentId)

        await supabase.from('payments').insert({
          business_id: session.metadata?.business_id,
          appointment_id: appointmentId,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency?.toUpperCase() || 'CLP',
          status: 'paid',
          stripe_session_id: session.id,
          payment_method: session.payment_method_types?.[0],
        })
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      
      await supabase
        .from('businesses')
        .update({
          plan: subscription.metadata?.plan || 'starter',
          plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      
      await supabase
        .from('businesses')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
