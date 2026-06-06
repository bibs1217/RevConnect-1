import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY

  const make        = searchParams.get('make')        || ''
  const model       = searchParams.get('model')       || ''
  const yearMin     = searchParams.get('yearMin')     ? parseInt(searchParams.get('yearMin')!)     : null
  const yearMax     = searchParams.get('yearMax')     ? parseInt(searchParams.get('yearMax')!)     : null
  const priceMin    = searchParams.get('priceMin')    ? parseInt(searchParams.get('priceMin')!)    : null
  const priceMax    = searchParams.get('priceMax')    ? parseInt(searchParams.get('priceMax')!)    : null
  const mileageMax  = searchParams.get('mileageMax')  ? parseInt(searchParams.get('mileageMax')!)  : null
  const zip         = (searchParams.get('zip') || '').replace(/[^0-9]/g, '')
  const transmission = searchParams.get('transmission') || ''
  const drivetrain  = searchParams.get('drivetrain')  || ''
  const condition   = searchParams.get('condition')   || ''
  const sortBy      = searchParams.get('sortBy')      || 'price-asc'
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const PAGE_SIZE   = 50

  const locationMode = 'nationwide'

  // Fetch 500 listings from Marketcheck — ONLY make and model as filters
  const urls: string[] = []
  for (let i = 0; i < 5; i++) {
    let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=100&start=${i * 100}`
    if (make)  u += `&make=${encodeURIComponent(make)}`
    if (model) u += `&model=${encodeURIComponent(model)}`
    urls.push(u)
  }

  console.log(`[MC] fetching 5 batches — make="${make}" model="${model}"`)
  const settled = await Promise.allSettled(
    urls.map(u => fetch(u, { cache: 'no-store' }).then(r => r.json()))
  )

  const numFound: number = settled[0].status === 'fulfilled' ? (settled[0].value?.num_found ?? 0) : 0
  const allRaw: any[] = settled.flatMap(r => r.status === 'fulfilled' ? (r.value?.listings ?? []) : [])
  console.log(`[MC] raw=${allRaw.length} numFound=${numFound}`)

  // Filter directly on raw Marketcheck data — no mapping, no Haversine
  const all = allRaw

  const filtered = all.filter((l: any) => {
    const year  = l.build?.year ?? l.year ?? null
    const price = l.price ?? null
    const miles = l.miles ?? null

    console.log('[ITEM]', JSON.stringify({ year, price, miles, dealer_lat: l.dealer?.latitude, dealer_lon: l.dealer?.longitude }))

    if (yearMin && year && year < yearMin) return false
    if (yearMax && year && year > yearMax) return false
    if (priceMin && price && price < priceMin) return false
    if (priceMax && price && price > priceMax) return false
    if (mileageMax && miles && miles > mileageMax) return false
    return true
  })

  console.log('[FILTER-RESULT]', filtered.length, 'of', all.length, 'passed')

  // Sort raw filtered results
  if (sortBy === 'price-asc')   filtered.sort((a: any, b: any) => (a.price ?? 999999) - (b.price ?? 999999))
  if (sortBy === 'price-desc')  filtered.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0))
  if (sortBy === 'mileage-asc') filtered.sort((a: any, b: any) => (a.miles ?? 999999) - (b.miles ?? 999999))

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRaw = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Map to clean objects for the frontend
  const pageListings = pageRaw.map((l: any) => ({
    id:             l.id,
    year:           l.build?.year           ?? null,
    make:           l.build?.make           ?? null,
    model:          l.build?.model          ?? null,
    trim:           l.build?.trim           ?? null,
    price:          l.price                 ?? null,
    miles:          l.miles                 ?? null,
    exterior_color: l.exterior_color        ?? null,
    transmission:   l.build?.transmission   ?? null,
    drivetrain:     l.build?.drivetrain     ?? null,
    car_type:       l.car_type              ?? null,
    photo:          l.media?.photo_links?.[0] || null,
    dealer_name:    l.dealer?.name          ?? null,
    dealer_city:    l.dealer?.city          ?? null,
    dealer_state:   l.dealer?.state         ?? null,
    dealer_phone:   l.dealer?.phone         ?? null,
    listing_url:    l.vdp_url               ?? null,
    dom:            l.dom                   ?? null,
    price_drop:     (l.price_change ?? 0) < 0,
    distance:       null,
  }))

  console.log(`[FILTER] raw=${allRaw.length} filtered=${totalFiltered} page=${safePage}/${totalPages} returning=${pageListings.length}`)

  return NextResponse.json({
    listings: pageListings,
    total: numFound,
    totalFiltered,
    page: safePage,
    totalPages,
    locationMode,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
