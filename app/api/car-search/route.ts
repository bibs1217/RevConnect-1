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

async function fetchMarketcheck(key: string, make: string, model: string, condition: string, yearMax: string): Promise<any[]> {
  const listings: any[] = []
  for (let i = 0; i < 10; i++) {
    try {
      // No zip sent to Marketcheck — get the broadest national pool possible
      // We do all location filtering server-side with Haversine
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=${i * 50}`
      if (make)  u += `&make=${encodeURIComponent(make)}`
      if (model) u += `&model=${encodeURIComponent(model)}`
      // Send car_type to Marketcheck — it IS honored
      if (condition === 'new')       u += `&car_type=new`
      else if (condition === 'used') u += `&car_type=used`
      else if (condition === 'cpo')  u += `&car_type=certified`
      else if (yearMax && parseInt(yearMax) < 2025) u += `&car_type=used`
      const r = await fetch(u, { cache: 'no-store' })
      const d = await r.json()
      const batch: any[] = d.listings || []
      listings.push(...batch)
      if (batch.length === 0) break
    } catch {
      break
    }
  }
  return listings
}

async function fetchEbay(appId: string, make: string, model: string, priceMax: string): Promise<any[]> {
  if (!appId || !make) return []
  try {
    const keywords = [make, model].filter(Boolean).join(' ')
    const p = new URLSearchParams({
      'OPERATION-NAME':                 'findItemsAdvanced',
      'SERVICE-VERSION':                '1.13.0',
      'SECURITY-APPNAME':               appId,
      'RESPONSE-DATA-FORMAT':           'JSON',
      'categoryId':                     '6001',
      'keywords':                       keywords,
      'paginationInput.entriesPerPage': '50',
      'sortOrder':                      'PricePlusShippingLowest',
      'outputSelector(0)':              'PictureURLLarge',
      'outputSelector(1)':              'SellerInfo',
    })
    if (priceMax) {
      p.set('itemFilter(0).name',  'MaxPrice')
      p.set('itemFilter(0).value', priceMax)
    }
    const res = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${p}`, {
      headers: { Accept: 'application/json' }, cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    return items.map((item: any) => {
      const title: string = item.title?.[0] ?? ''
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
      const yearMatch = title.match(/\b(19|20)\d{2}\b/)
      const year = yearMatch ? parseInt(yearMatch[0]) : 0
      return {
        id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
        year,
        make:           make || '',
        model:          model || '',
        trim:           '',
        price,
        miles:          0,
        exterior_color: '',
        transmission:   '',
        drivetrain:     '',
        photo:          item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? null,
        dealer_name:    item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
        dealer_city:    item.location?.[0] ?? '',
        dealer_state:   '',
        dealer_phone:   '',
        listing_url:    item.viewItemURL?.[0] ?? '',
        dom:            0,
        price_drop:     false,
        inventory_type: 'used',
        distance:       null,
        source:         'eBay',
        listing_type:   item.listingInfo?.[0]?.listingType?.[0] ?? '',
      }
    })
  } catch {
    return []
  }
}

function applyFilters(
  listings: any[],
  yearMin: string, yearMax: string,
  priceMin: string, priceMax: string,
  mileageMax: string,
  transmission: string, drivetrain: string, condition: string,
  includeYear: boolean
): any[] {
  return listings.filter((l: any) => {
    if (includeYear) {
      if (yearMin && l.year && l.year < parseInt(yearMin)) return false
      if (yearMax && l.year && l.year > parseInt(yearMax)) return false
    }
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mcKey  = process.env.MARKETCHECK_API_KEY || ''
  const ebayId = process.env.EBAY_APP_ID         || ''

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

  // Geocode ZIP in parallel with data fetches
  let userLat = 0, userLon = 0
  const geoPromise = zip
    ? fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { userLat = parseFloat(d.places[0].latitude); userLon = parseFloat(d.places[0].longitude) })
        .catch(() => {})
    : Promise.resolve()

  const [mcRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, condition, yearMax),
    fetchEbay(ebayId, make, model, priceMax),
    geoPromise,
  ]) as [any[], any[], void]

  // Map Marketcheck listings with Haversine distance
  const mcMapped = mcRaw.map((l: any) => {
    const dlat = parseFloat(l.dealer?.latitude  || '0')
    const dlon = parseFloat(l.dealer?.longitude || '0')
    const distance = (userLat && userLon && dlat && dlon)
      ? Math.round(haversine(userLat, userLon, dlat, dlon)) : null
    return {
      id:             l.id,
      year:           Number(l.build?.year      || 0),
      make:           l.build?.make             || '',
      model:          l.build?.model            || '',
      trim:           l.build?.trim             || '',
      price:          Number(l.price            || 0),
      miles:          Number(l.miles            || 0),
      exterior_color: l.exterior_color          || '',
      transmission:   l.build?.transmission     || '',
      drivetrain:     l.build?.drivetrain       || '',
      photo:          l.media?.photo_links?.[0] || null,
      dealer_name:    l.dealer?.name            || '',
      dealer_city:    l.dealer?.city            || '',
      dealer_state:   l.dealer?.state           || '',
      dealer_phone:   l.dealer?.phone           || '',
      listing_url:    l.vdp_url                 || '',
      dom:            Number(l.dom              || 0),
      price_drop:     Number(l.price_change     || 0) < 0,
      inventory_type: l.inventory_type          || '',
      source:         'Marketcheck',
      listing_type:   '',
      distance,
    }
  })

  const allMapped = [...mcMapped, ...ebayRaw]

  // --- GRACEFUL DEGRADATION ---
  // Try strict filter (with year). If nothing matches, relax year filter.
  // This prevents the search from ever returning 0 results when cars exist.
  let filtered = applyFilters(allMapped, yearMin, yearMax, priceMin, priceMax, mileageMax, transmission, drivetrain, condition, true)
  let filtersRelaxed = false

  if (filtered.length === 0 && allMapped.length > 0 && (yearMin || yearMax)) {
    // Year filter killed everything — relax it, keep price/mileage/condition
    filtered = applyFilters(allMapped, '', '', priceMin, priceMax, mileageMax, transmission, drivetrain, condition, false)
    filtersRelaxed = true
  }

  // --- DISTANCE FILTER ---
  // eBay has no location (distance=null) so always passes through
  let locationMode = 'nationwide'
  if (userLat && userLon && filtered.length > 0) {
    const local = filtered.filter((l: any) => l.source === 'eBay' || l.distance === null || (l.distance !== null && l.distance <= radius))
    if (local.length > 0) {
      filtered = local
      locationMode = 'local'
    } else {
      // Cars match year/price/mileage but none are within the requested radius
      // Show the nearest ones so user isn't left with nothing
      filtered.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999))
      locationMode = 'nearest_only'
    }
  }

  // Sort
  if      (sortBy === 'price-desc')   filtered.sort((a: any, b: any) => b.price - a.price)
  else if (sortBy === 'mileage-asc')  filtered.sort((a: any, b: any) => a.miles - b.miles)
  else if (sortBy === 'distance-asc') filtered.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999))
  else                                filtered.sort((a: any, b: any) => a.price - b.price)

  const PER_PAGE   = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings:       paginated,
    total:          allMapped.length,
    totalFiltered:  filtered.length,
    totalPages,
    page:           safePage,
    locationMode,
    filtersRelaxed,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
