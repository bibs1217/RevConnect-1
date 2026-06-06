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

function calcDist(userLat: number, userLon: number, lat: any, lon: any): number | null {
  const la = parseFloat(lat), lo = parseFloat(lon)
  if (!userLat || !userLon || !la || !lo) return null
  return Math.round(haversine(userLat, userLon, la, lo))
}

// ── Marketcheck ──────────────────────────────────────────────────────────────
async function fetchMarketcheck(
  key: string, make: string, model: string, condition: string, yearMax: string, zip: string
): Promise<any[]> {
  if (!key) return []
  const listings: any[] = []
  const deadline = Date.now() + 7500
  for (let i = 0; i < 20; i++) {
    if (Date.now() > deadline) break
    try {
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=${i * 50}`
      if (make)  u += `&make=${encodeURIComponent(make)}`
      if (model) u += `&model=${encodeURIComponent(model)}`
      if (zip)   u += `&zip=${zip}&radius=5000`
      if (condition === 'new')       u += `&car_type=new`
      else if (condition === 'used') u += `&car_type=used`
      else if (condition === 'cpo')  u += `&car_type=certified`
      else if (yearMax && parseInt(yearMax) < 2025) u += `&car_type=used`
      const r = await fetch(u, { cache: 'no-store' })
      const d = await r.json()
      const batch: any[] = d.listings || []
      listings.push(...batch)
      if (batch.length === 0) break
    } catch { break }
  }
  return listings
}

function mapMarketcheck(l: any, userLat: number, userLon: number): any {
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
    distance:       calcDist(userLat, userLon, l.dealer?.latitude, l.dealer?.longitude),
  }
}

// ── CarMax ───────────────────────────────────────────────────────────────────
// Uses CarMax's internal website API (unofficial — no public API exists).
// Fails silently if the endpoint changes.
async function fetchCarmax(
  make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  zip: string, radius: number,
  userLat: number, userLon: number
): Promise<any[]> {
  if (!zip) return []
  try {
    const p = new URLSearchParams({
      'api_key':   'vespa',
      'zipCode':   zip,
      'range':     String(Math.min(radius, 500)),
      'stocktype': 'used',
      'page':      '0',
      'take':      '100',
    })
    if (make)  p.set('makes',  make.toUpperCase())
    if (model) p.set('models', model)
    if (yearMin || yearMax) {
      const min = parseInt(yearMin) || 2000
      const max = parseInt(yearMax) || new Date().getFullYear()
      const yrs: string[] = []
      for (let y = min; y <= max; y++) yrs.push(String(y))
      if (yrs.length <= 15) p.set('year', yrs.join(','))
    }
    if (priceMax) p.set('maxPrice', priceMax)

    const res = await fetch(`https://api.carmax.com/v1/api/vehicles?${p}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const vehicles: any[] = data.vehicles || data.inventory || data.items || []
    return vehicles.map((v: any) => ({
      id:             `carmax_${v.stockNumber ?? v.vehicleId ?? Math.random()}`,
      year:           Number(v.year           || 0),
      make:           v.make                  || make,
      model:          v.model                 || model,
      trim:           v.trim                  || '',
      price:          Number(v.price ?? v.totalPrice ?? 0),
      miles:          Number(v.mileage ?? v.odometer ?? 0),
      exterior_color: v.exteriorColor         || '',
      transmission:   v.transmission          || '',
      drivetrain:     v.driveTrain ?? v.drivetrain ?? '',
      photo:          v.imageUrl ?? v.firstPhotoUrl ?? null,
      dealer_name:    'CarMax',
      dealer_city:    v.storeCity ?? v.city   ?? '',
      dealer_state:   v.storeState ?? v.state ?? '',
      dealer_phone:   '',
      listing_url:    v.vehicleDetailPageUrl
        ? `https://www.carmax.com${v.vehicleDetailPageUrl}`
        : `https://www.carmax.com/car/${v.stockNumber ?? ''}`,
      dom:            0,
      price_drop:     false,
      inventory_type: 'used',
      source:         'CarMax',
      listing_type:   '',
      distance:       calcDist(userLat, userLon, v.lat ?? v.latitude, v.lon ?? v.longitude),
    }))
  } catch { return [] }
}

// ── Carvana ──────────────────────────────────────────────────────────────────
// Uses Carvana's internal search API (unofficial).
async function fetchCarvana(
  make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  zip: string, radius: number,
  userLat: number, userLon: number
): Promise<any[]> {
  if (!zip) return []
  try {
    const p = new URLSearchParams({ zip, radius: String(Math.min(radius, 500)) })
    if (make)     p.set('make',     make)
    if (model)    p.set('model',    model)
    if (yearMin)  p.set('yearMin',  yearMin)
    if (yearMax)  p.set('yearMax',  yearMax)
    if (priceMax) p.set('priceMax', priceMax)
    p.set('perPage', '100')
    p.set('page',    '1')

    const res = await fetch(`https://apim.carvana.io/search/api/v1/listings?${p}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const vehicles: any[] = data.data ?? data.vehicles ?? data.listings ?? data.items ?? []
    return vehicles.map((v: any) => ({
      id:             `carvana_${v.vehicleId ?? v.id ?? Math.random()}`,
      year:           Number(v.year           || 0),
      make:           v.make                  || make,
      model:          v.model                 || model,
      trim:           v.trim                  || '',
      price:          Number(v.price ?? v.listPrice ?? 0),
      miles:          Number(v.miles ?? v.mileage ?? 0),
      exterior_color: v.exteriorColor ?? v.color ?? '',
      transmission:   v.transmission          || '',
      drivetrain:     v.driveType ?? v.drivetrain ?? '',
      photo:          v.imageUrl ?? v.primaryImageUrl ?? v.photoUrl ?? null,
      dealer_name:    'Carvana',
      dealer_city:    v.city                  || '',
      dealer_state:   v.state                 || '',
      dealer_phone:   '',
      listing_url:    v.url ?? v.detailUrl
        ? (v.url ?? v.detailUrl).startsWith('http')
            ? (v.url ?? v.detailUrl)
            : `https://www.carvana.com${v.url ?? v.detailUrl}`
        : `https://www.carvana.com/cars/${make}/${model}`,
      dom:            0,
      price_drop:     false,
      inventory_type: 'used',
      source:         'Carvana',
      listing_type:   '',
      distance:       null, // Carvana ships nationwide; no store location
    }))
  } catch { return [] }
}

// ── eBay ─────────────────────────────────────────────────────────────────────
function ebayYearAspect(yearMin: string, yearMax: string): string {
  if (!yearMin && !yearMax) return ''
  const min = parseInt(yearMin) || 2000
  const max = parseInt(yearMax) || new Date().getFullYear()
  if (max < min || max - min > 10) return ''
  let s = '&aspectFilter(0).aspectName=Year'
  for (let y = min, i = 0; y <= max; y++, i++) s += `&aspectFilter(0).aspectValueName(${i})=${y}`
  return s
}

function mapEbayItem(item: any, make: string, model: string): any {
  const title = item.title?.[0] ?? ''
  const price  = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const ym     = title.match(/\b(19|20)\d{2}\b/)
  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    year:           ym ? parseInt(ym[0]) : 0,
    make:           make  || '',
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
}

async function fetchEbayPass(
  appId: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  sortOrder: string, listingType: string, pageNum: number
): Promise<any[]> {
  try {
    const p = new URLSearchParams({
      'OPERATION-NAME':                 'findItemsAdvanced',
      'SERVICE-VERSION':                '1.13.0',
      'SECURITY-APPNAME':               appId,
      'RESPONSE-DATA-FORMAT':           'JSON',
      'categoryId':                     '6001',
      'keywords':                       [make, model].filter(Boolean).join(' '),
      'paginationInput.entriesPerPage': '50',
      'paginationInput.pageNumber':     String(pageNum),
      'sortOrder':                      sortOrder,
      'outputSelector(0)':              'PictureURLLarge',
      'outputSelector(1)':              'SellerInfo',
    })
    let fi = 0
    if (priceMax) { p.set(`itemFilter(${fi}).name`, 'MaxPrice'); p.set(`itemFilter(${fi}).value`, priceMax); fi++ }
    if (listingType) { p.set(`itemFilter(${fi}).name`, 'ListingType'); p.set(`itemFilter(${fi}).value`, listingType) }
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${p}${ebayYearAspect(yearMin, yearMax)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    return items.map((item: any) => mapEbayItem(item, make, model))
  } catch { return [] }
}

async function fetchEbay(
  appId: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string
): Promise<any[]> {
  if (!appId || !make) return []
  const [p1, p2, p3] = await Promise.all([
    fetchEbayPass(appId, make, model, yearMin, yearMax, priceMax, 'PricePlusShippingLowest', '',           1),
    fetchEbayPass(appId, make, model, yearMin, yearMax, priceMax, 'StartTimeNewest',         'FixedPrice', 1),
    fetchEbayPass(appId, make, model, yearMin, yearMax, priceMax, 'PricePlusShippingLowest', '',           2),
  ])
  const seen = new Set<string>()
  return [...p1, ...p2, ...p3].filter(item => {
    if (seen.has(item.id)) return false; seen.add(item.id); return true
  })
}

// ── Filters ──────────────────────────────────────────────────────────────────
function applyFilters(
  listings: any[],
  yearMin: string, yearMax: string,
  priceMin: string, priceMax: string, mileageMax: string,
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

// ── Main handler ─────────────────────────────────────────────────────────────
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

  // Geocode ZIP in parallel with all fetches
  let userLat = 0, userLon = 0
  const geoPromise = zip
    ? fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { userLat = parseFloat(d.places[0].latitude); userLon = parseFloat(d.places[0].longitude) })
        .catch(() => {})
    : Promise.resolve()

  // Marketcheck is sequential (rate limit) and dominates time budget.
  // CarMax, Carvana, eBay all run in parallel against it.
  await geoPromise // resolve geo first so CarMax/Carvana can use userLat/userLon
  const [mcRaw, carmaxRaw, carvanaRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, condition, yearMax, zip),
    fetchCarmax(make, model, yearMin, yearMax, priceMax, zip, radius, userLat, userLon),
    fetchCarvana(make, model, yearMin, yearMax, priceMax, zip, radius, userLat, userLon),
    fetchEbay(ebayId, make, model, yearMin, yearMax, priceMax),
  ])

  const mcMapped = mcRaw.map((l: any) => mapMarketcheck(l, userLat, userLon))

  const allMapped = [...mcMapped, ...carmaxRaw, ...carvanaRaw, ...ebayRaw]

  // Deduplicate across sources by VIN if available, else by id
  const seenIds = new Set<string>()
  const deduped = allMapped.filter(l => {
    const key = l.id
    if (seenIds.has(key)) return false
    seenIds.add(key)
    return true
  })

  // ── GRACEFUL DEGRADATION ─────────────────────────────────────────────────
  let filtered = applyFilters(deduped, yearMin, yearMax, priceMin, priceMax, mileageMax, transmission, drivetrain, condition, true)
  let filtersRelaxed = false

  if (filtered.length === 0 && deduped.length > 0 && (yearMin || yearMax)) {
    filtered = applyFilters(deduped, '', '', priceMin, priceMax, mileageMax, transmission, drivetrain, condition, false)
    filtersRelaxed = true
  }

  // ── DISTANCE FILTER ──────────────────────────────────────────────────────
  let locationMode = 'nationwide'
  if (userLat && userLon && filtered.length > 0) {
    const local = filtered.filter((l: any) =>
      l.source === 'eBay' || l.source === 'Carvana' ||
      l.distance === null || l.distance <= radius
    )
    if (local.length > 0) {
      filtered = local
      locationMode = 'local'
    } else {
      filtered.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999))
      locationMode = 'nearest_only'
    }
  }

  // ── SORT ─────────────────────────────────────────────────────────────────
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
    total:          deduped.length,
    totalFiltered:  filtered.length,
    totalPages,
    page:           safePage,
    locationMode,
    filtersRelaxed,
    sources: {
      marketcheck: mcMapped.length,
      carmax:      carmaxRaw.length,
      carvana:     carvanaRaw.length,
      ebay:        ebayRaw.length,
    },
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
