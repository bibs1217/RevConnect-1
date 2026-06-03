import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription') {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id
        const tierMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_BUILDER_MONTHLY ?? '']: 'builder',
          [process.env.STRIPE_PRICE_BUILDER_ANNUAL ?? '']: 'builder',
          [process.env.STRIPE_PRICE_RACER_MONTHLY ?? '']: 'racer',
          [process.env.STRIPE_PRICE_RACER_ANNUAL ?? '']: 'racer',
          [process.env.STRIPE_PRICE_LEGEND_MONTHLY ?? '']: 'legend',
          [process.env.STRIPE_PRICE_LEGEND_ANNUAL ?? '']: 'legend',
        }
        await supabase.from('profiles').update({
          membership_tier: tierMap[priceId] ?? 'builder',
          stripe_subscription_id: session.subscription as string,
        }).eq('stripe_customer_id', session.customer as string)
      } else {
        await supabase.from('orders').update({ status: 'processing' })
          .eq('stripe_checkout_session_id', session.id)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('profiles').update({ membership_tier: 'cruiser' })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        const { data: p } = await supabase.from('profiles').select('id').eq('stripe_customer_id', invoice.customer).single()
        if (p) await supabase.from('notifications').insert({ user_id: p.id, type: 'payment_failed', title: 'Payment Failed', body: 'Update your payment method to keep your membership.' })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
