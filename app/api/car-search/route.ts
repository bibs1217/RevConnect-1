import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const yearMin = searchParams.get('yearMin') || ''
  const yearMax = searchParams.get('yearMax') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const mileageMax = searchParams.get('mileageMax') || ''
  const page = parseInt(searchParams.get('page') || '1')

  let mcUrl = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=0`
  if (make) mcUrl += `&make=${encodeURIComponent(make)}`
  if (model) mcUrl += `&model=${encodeURIComponent(model)}`

  console.log('[MC] fetching:', mcUrl.replace(key!, 'HIDDEN'))

  const res = await fetch(mcUrl, { cache: 'no-store' })
  const data = await res.json()

  console.log('[MC] status:', res.status, 'num_found:', data.num_found, 'listings:', data.listings?.length)

  const all = data.listings || []

  const filtered = all.filter((l: any) => {
    const year = Number(l.build?.year || 0)
    const price = Number(l.price || 0)
    const miles = Number(l.miles || 0)
    if (yearMin && year && year < parseInt(yearMin)) return false
    if (yearMax && year && year > parseInt(yearMax)) return false
    if (priceMax && price && price > parseInt(priceMax)) return false
    if (mileageMax && miles && miles > parseInt(mileageMax)) return false
    return true
  })

  console.log('[MC] filtered:', filtered.length, 'of', all.length)

  const mapped = filtered.map((l: any) => ({
    id: l.id,
    year: Number(l.build?.year || 0),
    make: l.build?.make || '',
    model: l.build?.model || '',
    trim: l.build?.trim || '',
    price: Number(l.price || 0),
    miles: Number(l.miles || 0),
    exterior_color: l.exterior_color || '',
    transmission: l.build?.transmission || '',
    drivetrain: l.build?.drivetrain || '',
    photo: l.media?.photo_links?.[0] || null,
    dealer_name: l.dealer?.name || '',
    dealer_city: l.dealer?.city || '',
    dealer_state: l.dealer?.state || '',
    listing_url: l.vdp_url || '',
    dom: Number(l.dom || 0),
  }))

  return NextResponse.json({
    listings: mapped,
    total: data.num_found || 0,
    totalPages: 1,
    page: 1,
    sources: { marketcheck: mapped.length, ebay: 0 }
  })
}
