import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { items } = await req.json()

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel.' }, { status: 400 })
  }
  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' as any })
  const origin = req.headers.get('origin') ?? 'https://rev-connect-1.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.images ?? [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    success_url: `${origin}/store?success=1`,
    cancel_url: `${origin}/store`,
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    shipping_options: [
      { shipping_rate_data: { type:'fixed_amount', fixed_amount:{ amount:0, currency:'usd' }, display_name:'Standard (5-7 days)' } },
      { shipping_rate_data: { type:'fixed_amount', fixed_amount:{ amount:1299, currency:'usd' }, display_name:'Express (2-3 days)' } },
    ],
  })
  return NextResponse.json({ url: session.url })
}
