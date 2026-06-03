import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { priceId, mode } = await req.json()

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel environment variables.' }, { status: 400 })
  }
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured. Add membership price IDs to Vercel environment variables.' }, { status: 400 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' as any })

  const origin = req.headers.get('origin') ?? 'https://rev-connect-1.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: mode ?? 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/membership?success=1`,
    cancel_url: `${origin}/membership`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return NextResponse.json({ url: session.url })
}
