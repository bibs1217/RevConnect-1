import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY

  const make       = searchParams.get('make')       || ''
  const model      = searchParams.get('model')      || ''
  const yearMin    = searchParams.get('yearMin')     || ''
  const yearMax    = searchParams.get('yearMax')     || ''
  const priceMin   = searchParams.get('priceMin')   || ''
  const priceMax   = searchParams.get('priceMax')   || ''
  const mileageMax = searchParams.get('mileageMax') || ''
  const sortBy     = searchParams.get('sortBy')     || 'price-asc'
  const page       = searchParams.get('page')       || '1'

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
  const all: any[] = settled.flatMap(r => r.status === 'fulfilled' ? (r.value?.listings ?? []) : [])
  console.log(`[MC] raw=${all.length} numFound=${numFound}`)

  // Log first item raw to inspect field names
  if (all.length > 0) {
    const firstItem = all[0]
    console.log('[FIRST-ITEM-RAW]', JSON.stringify(firstItem).slice(0, 1000))
  }

  const filtered = all.filter((l: any) => {
    const year  = Number(l.build?.year  || l.year     || 0)
    const price = Number(l.price        || 0)
    const miles = Number(l.miles        || l.mileage  || 0)

    if (yearMin    && year  && year  < Number(yearMin))    return false
    if (yearMax    && year  && year  > Number(yearMax))    return false
    if (priceMin   && price && price < Number(priceMin))   return false
    if (priceMax   && price && price > Number(priceMax))   return false
    if (mileageMax && miles && miles > Number(mileageMax)) return false
    return true
  })

  console.log('[FILTER-RESULT]', filtered.length, 'of', all.length, 'passed')

  // Sort
  if (sortBy === 'price-asc')   filtered.sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0))
  if (sortBy === 'price-desc')  filtered.sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0))
  if (sortBy === 'mileage-asc') filtered.sort((a: any, b: any) => Number(a.miles || 0) - Number(b.miles || 0))

  const mapped = filtered.map((l: any) => ({
    id:             l.id || Math.random().toString(),
    year:           Number(l.build?.year  || l.year    || 0),
    make:           l.build?.make  || l.make  || '',
    model:          l.build?.model || l.model || '',
    trim:           l.build?.trim  || l.trim  || '',
    price:          Number(l.price || 0),
    miles:          Number(l.miles || l.mileage || 0),
    exterior_color: l.exterior_color    || l.build?.ext_color || '',
    transmission:   l.build?.transmission || l.transmission   || '',
    drivetrain:     l.build?.drivetrain   || l.drivetrain     || '',
    photo:          l.media?.photo_links?.[0] || null,
    dealer_name:    l.dealer?.name  || '',
    dealer_city:    l.dealer?.city  || '',
    dealer_state:   l.dealer?.state || '',
    dealer_phone:   l.dealer?.phone || '',
    dealer_lat:     Number(l.dealer?.latitude  || 0),
    dealer_lon:     Number(l.dealer?.longitude || 0),
    listing_url:    l.vdp_url || '',
    dom:            Number(l.dom || 0),
    price_drop:     Number(l.price_change || 0) < 0,
  }))

  const perPage    = 50
  const pageNum    = Number(page || 1)
  const start      = (pageNum - 1) * perPage
  const paginated  = mapped.slice(start, start + perPage)
  const totalPages = Math.ceil(mapped.length / perPage)

  console.log(`[PAGINATE] total=${mapped.length} page=${pageNum}/${totalPages} returning=${paginated.length}`)

  return NextResponse.json({
    listings:   paginated,
    total:      numFound,
    totalFiltered: mapped.length,
    totalPages,
    page:       pageNum,
    locationMode: 'nationwide',
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
