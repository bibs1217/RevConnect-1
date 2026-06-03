import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items } = await req.json()
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email!, metadata: { supabase_id: user.id } })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map((item: { name: string; price: number; quantity: number; images?: string[] }) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.images ?? [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: { user_id: user.id },
    success_url: process.env.NEXT_PUBLIC_APP_URL + '/store/orders?success=1',
    cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/store',
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
  })

  return NextResponse.json({ url: session.url })
}
