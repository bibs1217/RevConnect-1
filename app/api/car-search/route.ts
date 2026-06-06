import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY

  const make         = searchParams.get('make')         || ''
  const model        = searchParams.get('model')        || ''
  const yearMin      = searchParams.get('yearMin')      || ''
  const yearMax      = searchParams.get('yearMax')      || ''
  const priceMin     = searchParams.get('priceMin')     || ''
  const priceMax     = searchParams.get('priceMax')     || ''
  const mileageMax   = searchParams.get('mileageMax')   || ''
  const zip          = (searchParams.get('zip') || '').replace(/\D/g, '')
  const radius       = parseInt(searchParams.get('radius') || '250')
  const transmission = searchParams.get('transmission') || ''
  const drivetrain   = searchParams.get('drivetrain')   || ''
  const condition    = searchParams.get('condition')    || ''
  const sortBy       = searchParams.get('sortBy')       || 'price-asc'
  const page         = Math.max(1, parseInt(searchParams.get('page') || '1'))

  // Geocode ZIP if provided
  let userLat = 0, userLon = 0, locationMode = 'nationwide'
  if (zip) {
    try {
      const geo = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      if (geo.ok) {
        const gd = await geo.json()
        userLat = parseFloat(gd.places[0].latitude)
        userLon = parseFloat(gd.places[0].longitude)
        locationMode = 'local'
        console.log('[GEO]', zip, '->', userLat, userLon)
      }
    } catch { console.log('[GEO] failed for zip:', zip) }
  }

  // Fetch 500 listings — only make/model sent to Marketcheck
  const allListings: any[] = []
  await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=100&start=${i * 100}`
      if (make)  u += `&make=${encodeURIComponent(make)}`
      if (model) u += `&model=${encodeURIComponent(model)}`
      return fetch(u, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.listings)) allListings.push(...d.listings) })
        .catch(() => {})
    })
  )

  console.log('[MC] fetched:', allListings.length)

  // Map all listings — compute distance while we have the raw dealer lat/lon strings
  const mapped = allListings.map((l: any) => {
    const dlat = parseFloat(l.dealer?.latitude  || '0')
    const dlon = parseFloat(l.dealer?.longitude || '0')
    const distance = (userLat && userLon && dlat && dlon)
      ? Math.round(haversine(userLat, userLon, dlat, dlon))
      : null
    return {
      id:             l.id,
      year:           Number(l.build?.year         || 0),
      make:           l.build?.make                || '',
      model:          l.build?.model               || '',
      trim:           l.build?.trim                || '',
      price:          Number(l.price               || 0),
      miles:          Number(l.miles               || 0),
      exterior_color: l.exterior_color             || '',
      transmission:   l.build?.transmission        || '',
      drivetrain:     l.build?.drivetrain          || '',
      photo:          l.media?.photo_links?.[0]    || null,
      dealer_name:    l.dealer?.name               || '',
      dealer_city:    l.dealer?.city               || '',
      dealer_state:   l.dealer?.state              || '',
      dealer_phone:   l.dealer?.phone              || '',
      listing_url:    l.vdp_url                    || '',
      dom:            Number(l.dom                 || 0),
      price_drop:     Number(l.price_change        || 0) < 0,
      inventory_type: l.inventory_type             || '',
      distance,
    }
  })

  // Apply all filters to the full 500-item set
  const filtered = mapped.filter((l) => {
    if (yearMin    && l.year  && l.year  < parseInt(yearMin))    return false
    if (yearMax    && l.year  && l.year  > parseInt(yearMax))    return false
    if (priceMin   && l.price && l.price < parseInt(priceMin))   return false
    if (priceMax   && l.price && l.price > parseInt(priceMax))   return false
    if (mileageMax && l.miles && l.miles > parseInt(mileageMax)) return false
    if (transmission && l.transmission && !l.transmission.toLowerCase().includes(transmission.toLowerCase())) return false
    if (drivetrain   && l.drivetrain   && !l.drivetrain.toLowerCase().includes(drivetrain.toLowerCase()))   return false
    if (condition === 'new'  && l.inventory_type && l.inventory_type !== 'new')       return false
    if (condition === 'used' && l.inventory_type && l.inventory_type !== 'used')      return false
    if (condition === 'cpo'  && l.inventory_type && l.inventory_type !== 'certified') return false
    if (userLat && userLon && l.distance !== null && l.distance > radius) return false
    return true
  })

  console.log('[MC] filtered:', filtered.length, 'of', mapped.length)

  // Sort
  if      (sortBy === 'price-desc')   filtered.sort((a, b) => b.price - a.price)
  else if (sortBy === 'mileage-asc')  filtered.sort((a, b) => a.miles - b.miles)
  else if (sortBy === 'distance-asc') filtered.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
  else                                filtered.sort((a, b) => a.price - b.price)

  // Paginate within filtered results
  const PER_PAGE   = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings:      paginated,
    total:         allListings.length,
    totalFiltered: filtered.length,
    totalPages,
    page:          safePage,
    locationMode,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
