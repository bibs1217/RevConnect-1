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

  // Geocode ZIP
  let userLat = 0, userLon = 0
  if (zip) {
    try {
      const geo = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      if (geo.ok) {
        const gd = await geo.json()
        userLat = parseFloat(gd.places[0].latitude)
        userLon = parseFloat(gd.places[0].longitude)
        console.log('[GEO]', zip, '->', userLat, userLon)
      }
    } catch { console.log('[GEO] failed:', zip) }
  }

  // Fetch up to 500 listings sequentially — rows=50 matches confirmed API plan limit
  const allListings: any[] = []
  for (let i = 0; i < 20; i++) {
    try {
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=${i * 50}`
      if (make)  u += `&make=${encodeURIComponent(make)}`
      if (model) u += `&model=${encodeURIComponent(model)}`
      const r = await fetch(u, { cache: 'no-store' })
      const d = await r.json()
      const batch = d.listings || []
      allListings.push(...batch)
      console.log(`[MC] batch ${i}: ${batch.length} listings (total so far: ${allListings.length})`)
      if (batch.length === 0) break // no more results
    } catch (e) {
      console.log(`[MC] batch ${i} failed:`, e)
      break
    }
  }

  // Map all listings, computing distance from user ZIP
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

  // Apply non-distance filters first
  let filtered = mapped.filter((l) => {
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
    return true
  })

  // Apply distance filter — fall back to nationwide if no local results found
  let locationMode = 'nationwide'
  if (userLat && userLon) {
    const local = filtered.filter(l => l.distance === null || l.distance <= radius)
    if (local.length > 0) {
      filtered = local
      locationMode = 'local'
    } else {
      locationMode = 'nationwide_fallback'
    }
  }

  console.log(`[MC] filtered: ${filtered.length} of ${mapped.length} (mode: ${locationMode})`)

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
