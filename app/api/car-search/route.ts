import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  console.log('[PARAMS]', Object.fromEntries(searchParams))
  const key = process.env.MARKETCHECK_API_KEY

  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const yearMin = searchParams.get('yearMin') || ''
  const yearMax = searchParams.get('yearMax') || ''
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const mileageMax = searchParams.get('mileageMax') || ''
  const zip = searchParams.get('zip') || ''
  const radius = searchParams.get('radius') || ''
  const transmission = searchParams.get('transmission') || ''
  const drivetrain = searchParams.get('drivetrain') || ''
  const condition = searchParams.get('condition') || ''
  const start = searchParams.get('start') || '0'

  let url = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=100&start=${start}`
  if (make) url += `&make=${encodeURIComponent(make)}`
  if (model) url += `&model=${encodeURIComponent(model)}`
  if (yearMin) url += `&year_min=${yearMin}`
  if (yearMax) url += `&year_max=${yearMax}`
  if (priceMin) url += `&price_min=${priceMin}`
  if (priceMax) url += `&price_max=${priceMax}`
  if (mileageMax) url += `&miles_max=${mileageMax}`
  if (zip) url += `&zip=${zip}`
  if (zip && radius) url += `&radius=${radius}`
  if (transmission) url += `&transmission=${transmission}`
  if (drivetrain) url += `&drivetrain=${drivetrain}`
  if (condition === 'new') url += `&car_type=new`
  if (condition === 'used') url += `&car_type=used`
  if (condition === 'cpo') url += `&car_type=certified`

  console.log('[MC] fetching:', url.replace(key!, 'KEY_HIDDEN'))

  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  console.log('[MC] raw first 300 chars:', text.slice(0, 300))

  const data = JSON.parse(text)
  const listings = (data.listings || []).map((l: any) => ({
    id: l.id,
    year: l.build?.year,
    make: l.build?.make,
    model: l.build?.model,
    trim: l.build?.trim,
    price: l.price,
    miles: l.miles,
    exterior_color: l.exterior_color,
    transmission: l.build?.transmission,
    drivetrain: l.build?.drivetrain,
    photo: l.media?.photo_links?.[0] || null,
    dealer_name: l.dealer?.name,
    dealer_city: l.dealer?.city,
    dealer_state: l.dealer?.state,
    dealer_phone: l.dealer?.phone,
    listing_url: l.vdp_url,
    dom: l.dom,
    price_drop: (l.price_change ?? 0) < 0,
  }))

  const yMin = yearMin ? parseInt(yearMin) : null
  const yMax = yearMax ? parseInt(yearMax) : null
  const pMin = priceMin ? parseInt(priceMin) : null
  const pMax = priceMax ? parseInt(priceMax) : null
  const mMax = mileageMax ? parseInt(mileageMax) : null

  const filtered = listings.filter((l: any) => {
    if (yMin !== null && l.year !== null && l.year < yMin) return false
    if (yMax !== null && l.year !== null && l.year > yMax) return false
    if (pMin !== null && l.price !== null && l.price < pMin) return false
    if (pMax !== null && l.price !== null && l.price > pMax) return false
    if (mMax !== null && l.miles !== null && l.miles > mMax) return false
    return true
  })

  console.log(`[MC] mapped=${listings.length} after_filter=${filtered.length}`)

  return NextResponse.json({
    listings: filtered,
    total: data.num_found ?? 0,
    sources: { marketcheck: listings.length, ebay: 0 },
    _debug_mc_url: url.replace(key!, 'KEY_HIDDEN')
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
