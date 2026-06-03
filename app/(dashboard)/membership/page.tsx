'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import Link from 'next/link'

const TIERS = [
  {
    id: 'cruiser',
    name: 'Cruiser',
    price: 0,
    color: '#aaa',
    badge: '🚗',
    points: '1×',
    features: [
      'Digital Garage (up to 2 vehicles)',
      'Events & Meets discovery',
      'AI Mechanic (10 messages/day)',
      'Parts & Car Search',
      'Car Wash locator',
      'Community feed access',
      'Basic profile',
    ],
    cta: 'Current Plan',
    stripe_price_monthly: null,
    stripe_price_annual: null,
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 9.99,
    annual: 99,
    color: '#3b82f6',
    badge: '🔧',
    points: '1.25×',
    popular: false,
    features: [
      'Everything in Cruiser',
      'Unlimited garage vehicles',
      'AI Mechanic (unlimited)',
      'Early sale access in store',
      '1.25× Rev Points on purchases',
      'Build cost reports (PDF export)',
      'Priority support',
    ],
    cta: 'Upgrade to Builder',
    stripe_price_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUILDER_MONTHLY,
    stripe_price_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUILDER_ANNUAL,
  },
  {
    id: 'racer',
    name: 'Racer',
    price: 19.99,
    annual: 199,
    color: '#a855f7',
    badge: '🏁',
    points: '1.5×',
    popular: true,
    features: [
      'Everything in Builder',
      'Exclusive drop access',
      '1.5× Rev Points on purchases',
      'Club creation & management',
      'Advanced garage analytics',
      'Auction watchlist alerts',
      'Insurance comparison tools',
    ],
    cta: 'Upgrade to Racer',
    stripe_price_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_RACER_MONTHLY,
    stripe_price_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_RACER_ANNUAL,
  },
  {
    id: 'legend',
    name: 'Legend',
    price: 39.99,
    annual: 399,
    color: '#F4A261',
    badge: '👑',
    points: '2×',
    popular: false,
    features: [
      'Everything in Racer',
      'Always free shipping on merch',
      '2× Rev Points on everything',
      'VIP event access & badges',
      'Annual exclusive gift drop',
      'Direct line to Rev support',
      'Beta feature access',
    ],
    cta: 'Upgrade to Legend',
    stripe_price_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGEND_MONTHLY,
    stripe_price_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGEND_ANNUAL,
  },
]

export default function MembershipPage() {
  const { user, profile } = useAuth()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentTier = profile?.membership_tier ?? 'cruiser'

  async function handleUpgrade(tier: typeof TIERS[0]) {
    if (!user) { window.location.href = '/register'; return }
    if (!tier.stripe_price_monthly) {
      alert('Stripe not configured. Add STRIPE_SECRET_KEY and price IDs to Vercel environment variables.')
      return
    }
    setLoading(tier.id)
    try {
      const priceId = billing === 'annual' ? tier.stripe_price_annual : tier.stripe_price_monthly
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode: 'subscription' })
      })
      const { url, error } = await res.json()
      if (error) { alert(error); return }
      if (url) window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>RevConnect-1 Membership</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Unlock the full platform. Earn more Rev Points. Rep harder.</p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '9999px', padding: '0.25rem' }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px', border: 'none', background: billing === b ? '#E63946' : 'transparent', color: billing === b ? 'white' : '#aaa', fontWeight: billing === b ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}>
              {b === 'monthly' ? 'Monthly' : 'Annual (save 20%)'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id
          const displayPrice = billing === 'annual' && tier.annual ? tier.annual / 12 : tier.price
          return (
            <div key={tier.id} style={{ background: '#1a1a2e', border: `1px solid ${isCurrent ? tier.color + '60' : tier.popular ? tier.color + '40' : '#2a2a3e'}`, borderRadius: '1rem', padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {tier.popular && (
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: tier.color, color: 'white', padding: '0.2rem 1rem', borderRadius: '0 0 0.75rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-1px', right: '1rem', background: tier.color, color: 'white', padding: '0.2rem 0.75rem', borderRadius: '0 0 0.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>CURRENT</div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{tier.badge}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem', color: tier.color }}>{tier.name}</h3>
                <div style={{ marginTop: '0.5rem' }}>
                  {tier.price === 0 ? (
                    <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>${displayPrice.toFixed(2)}</span>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>/mo</span>
                      {billing === 'annual' && tier.annual && (
                        <p style={{ fontSize: '0.75rem', color: tier.color, marginTop: '0.125rem' }}>Billed ${tier.annual}/yr</p>
                      )}
                    </>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#F4A261', marginTop: '0.375rem' }}>⚡ {tier.points} Rev Points</p>
              </div>

              <ul style={{ flex: 1, listStyle: 'none', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#ccc', alignItems: 'flex-start' }}>
                    <span style={{ color: tier.color, flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleUpgrade(tier)}
                disabled={isCurrent || loading === tier.id}
                style={{ width: '100%', background: isCurrent ? `${tier.color}15` : tier.color, color: isCurrent ? tier.color : 'white', border: `1px solid ${tier.color}${isCurrent ? '40' : ''}`, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: isCurrent ? 'default' : 'pointer', opacity: loading === tier.id ? 0.6 : 1 }}
              >
                {loading === tier.id ? 'Loading…' : isCurrent ? '✓ Current Plan' : tier.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Rev Points explanation */}
      <div style={{ background: 'linear-gradient(135deg, rgba(244,162,97,0.08), rgba(230,57,70,0.06))', border: '1px solid rgba(244,162,97,0.15)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>⚡ Rev Points</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            ['💰', 'Earn on Purchases', 'Get points for every dollar spent in the merch store based on your tier'],
            ['🎁', 'Daily Engagement', 'Earn points for event check-ins, reviews, and daily app activity'],
            ['👥', 'Referrals', 'Earn bonus points when friends join using your referral link'],
            ['🛍️', 'Redeem', 'Use points for store credit, free shipping, exclusive drops, and event tickets'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</p>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title as string}</p>
              <p style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>{desc as string}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#444' }}>
        Cancel anytime. No hidden fees. Questions? <Link href="mailto:support@revconnect1.com" style={{ color: '#E63946' }}>Contact support</Link>
      </p>
    </div>
  )
}
