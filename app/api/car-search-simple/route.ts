import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const key = process.env.MARKETCHECK_API_KEY
  const url = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&make=Ford`
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json({
    status: res.status,
    num_found: data.num_found,
    returned: data.listings?.length,
    first: data.listings?.[0]?.heading,
    error: data.error ?? null
  })
}
