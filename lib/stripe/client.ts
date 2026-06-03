import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
  typescript: true,
})

// Product IDs — set these after creating products in Stripe Dashboard
export const STRIPE_PRODUCTS = {
  // Membership tiers
  MEMBERSHIP_BUILDER: process.env.STRIPE_PRODUCT_BUILDER ?? '',
  MEMBERSHIP_RACER: process.env.STRIPE_PRODUCT_RACER ?? '',
  MEMBERSHIP_LEGEND: process.env.STRIPE_PRODUCT_LEGEND ?? '',
} as const

export const STRIPE_PRICES = {
  BUILDER_MONTHLY: process.env.STRIPE_PRICE_BUILDER_MONTHLY ?? '',
  BUILDER_ANNUAL: process.env.STRIPE_PRICE_BUILDER_ANNUAL ?? '',
  RACER_MONTHLY: process.env.STRIPE_PRICE_RACER_MONTHLY ?? '',
  RACER_ANNUAL: process.env.STRIPE_PRICE_RACER_ANNUAL ?? '',
  LEGEND_MONTHLY: process.env.STRIPE_PRICE_LEGEND_MONTHLY ?? '',
  LEGEND_ANNUAL: process.env.STRIPE_PRICE_LEGEND_ANNUAL ?? '',
} as const
