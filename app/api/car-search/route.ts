import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function dist(uLat: number, uLon: number, lat: any, lon: any): number | null {
  const la = parseFloat(lat), lo = parseFloat(lon)
  if (!uLat || !uLon || !la || !lo) return null
  return Math.round(haversine(uLat, uLon, la, lo))
}

// ── Marketcheck ───────────────────────────────────────────────────────────────
// NOTE: zip/radius geographic filtering is NOT supported on this plan (returns 422).
// We fetch national inventory and apply Haversine distance client-side.
// year_min/year_max are sent (honored on most plans); sort=year_asc for old searches.
async function fetchMarketcheck(
  key: string, make: string, model: string,
  condition: string, yearMin: string, yearMax: string
): Promise<any[]> {
  if (!key) return []
  const listings: any[] = []
  const oldSearch = yearMax && parseInt(yearMax) < 2020
  for (let i = 0; i < 10; i++) {
    try {
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=${i * 50}`
      if (make)      u += `&make=${encodeURIComponent(make)}`
      if (model)     u += `&model=${encodeURIComponent(model)}`
      if (yearMin)   u += `&year_min=${yearMin}`
      if (yearMax)   u += `&year_max=${yearMax}`
      if (oldSearch) u += `&sort=year_asc`
      if (condition === 'new')                       u += `&car_type=new`
      else if (condition === 'used')                 u += `&car_type=used`
      else if (condition === 'cpo')                  u += `&car_type=certified`
      else if (yearMax && parseInt(yearMax) < 2025)  u += `&car_type=used`
      const r = await fetch(u, { cache: 'no-store' })
      if (!r.ok) { console.error('[MC] status', r.status, await r.text().then(t => t.slice(0, 200))); break }
      const d = await r.json()
      const batch: any[] = Array.isArray(d.listings) ? d.listings : []
      console.log(`[MC] batch=${i} got=${batch.length} numFound=${d.num_found ?? '?'}`)
      listings.push(...batch)
      if (batch.length === 0) break
    } catch (e) { console.error('[MC] exception', e); break }
  }
  return listings
}

function mapMC(l: any, uLat: number, uLon: number): any {
  return {
    id:             String(l.id || Math.random()),
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
    distance:       dist(uLat, uLon, l.dealer?.latitude, l.dealer?.longitude),
  }
}

// ── CarMax ────────────────────────────────────────────────────────────────────
async function fetchCarmax(
  make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  zip: string, radius: number, uLat: number, uLon: number
): Promise<any[]> {
  if (!zip) return []
  try {
    const p: Record<string, string> = {
      'api_key': 'vespa', 'zipCode': zip,
      'range': String(Math.min(radius, 500)),
      'stocktype': 'used', 'page': '0', 'take': '100',
    }
    if (make)     p['makes']    = make.toUpperCase()
    if (model)    p['models']   = model
    if (priceMax) p['maxPrice'] = priceMax
    if (yearMin || yearMax) {
      const min = parseInt(yearMin) || 2000
      const max = parseInt(yearMax) || new Date().getFullYear()
      const yrs: string[] = []
      for (let y = min; y <= max && yrs.length < 20; y++) yrs.push(String(y))
      if (yrs.length) p['year'] = yrs.join(',')
    }
    const qs = Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    const res = await fetch(`https://api.carmax.com/v1/api/vehicles?${qs}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const vehicles: any[] = data.vehicles ?? data.inventory ?? data.items ?? []
    return vehicles.map((v: any) => ({
      id:             `carmax_${v.stockNumber ?? v.vehicleId ?? Math.random()}`,
      year:           Number(v.year || 0),
      make:           v.make  || make,
      model:          v.model || model,
      trim:           v.trim  || '',
      price:          Number(v.price ?? v.totalPrice ?? 0),
      miles:          Number(v.mileage ?? v.odometer ?? 0),
      exterior_color: v.exteriorColor || '',
      transmission:   v.transmission  || '',
      drivetrain:     v.driveTrain ?? v.drivetrain ?? '',
      photo:          v.imageUrl ?? v.firstPhotoUrl ?? null,
      dealer_name:    'CarMax',
      dealer_city:    v.storeCity ?? v.city ?? '',
      dealer_state:   v.storeState ?? v.state ?? '',
      dealer_phone:   '',
      listing_url:    v.vehicleDetailPageUrl
        ? `https://www.carmax.com${v.vehicleDetailPageUrl}`
        : `https://www.carmax.com/cars/${make.toLowerCase()}/${model.toLowerCase()}`,
      dom: 0, price_drop: false, inventory_type: 'used',
      source: 'CarMax', listing_type: '',
      distance: dist(uLat, uLon, v.lat ?? v.latitude, v.lon ?? v.longitude),
    }))
  } catch { return [] }
}

// ── Carvana ───────────────────────────────────────────────────────────────────
async function fetchCarvana(
  make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string
): Promise<any[]> {
  try {
    const p = new URLSearchParams({ perPage: '96', page: '1' })
    if (make)     p.set('make',     make)
    if (model)    p.set('model',    model)
    if (yearMin)  p.set('yearMin',  yearMin)
    if (yearMax)  p.set('yearMax',  yearMax)
    if (priceMax) p.set('priceMax', priceMax)
    const res = await fetch(`https://apim.carvana.io/search/api/v1/listings?${p}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const vehicles: any[] = data.data ?? data.vehicles ?? data.listings ?? data.items ?? []
    return vehicles.map((v: any) => ({
      id:             `carvana_${v.vehicleId ?? v.id ?? Math.random()}`,
      year:           Number(v.year || 0),
      make:           v.make  || make,
      model:          v.model || model,
      trim:           v.trim  || '',
      price:          Number(v.price ?? v.listPrice ?? 0),
      miles:          Number(v.miles ?? v.mileage ?? 0),
      exterior_color: v.exteriorColor ?? v.color ?? '',
      transmission:   v.transmission  || '',
      drivetrain:     v.driveType ?? v.drivetrain ?? '',
      photo:          v.imageUrl ?? v.primaryImageUrl ?? null,
      dealer_name:    'Carvana',
      dealer_city: '', dealer_state: '', dealer_phone: '',
      listing_url:    v.url
        ? (v.url.startsWith('http') ? v.url : `https://www.carvana.com${v.url}`)
        : `https://www.carvana.com/cars/${make.toLowerCase()}`,
      dom: 0, price_drop: false, inventory_type: 'used',
      source: 'Carvana', listing_type: '', distance: null,
    }))
  } catch { return [] }
}

// ── eBay ──────────────────────────────────────────────────────────────────────
function mapEbay(item: any, make: string, model: string): any {
  const title = item.title?.[0] ?? ''
  const price  = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const ym     = title.match(/\b(19|20)\d{2}\b/)
  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    year:           ym ? parseInt(ym[0]) : 0,
    make, model, trim: '',
    price, miles: 0, exterior_color: '', transmission: '', drivetrain: '',
    photo:          item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? null,
    dealer_name:    item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
    dealer_city:    item.location?.[0] ?? '',
    dealer_state: '', dealer_phone: '',
    listing_url:    item.viewItemURL?.[0] ?? '',
    dom: 0, price_drop: false, inventory_type: 'used',
    source: 'eBay', listing_type: item.listingInfo?.[0]?.listingType?.[0] ?? '',
    distance: null,
  }
}

async function ebaySearch(
  appId: string, keywords: string, make: string, model: string,
  priceMax: string, sort: string, listingType: string, page: number
): Promise<any[]> {
  try {
    const p = new URLSearchParams({
      'OPERATION-NAME':                 'findItemsAdvanced',
      'SERVICE-VERSION':                '1.13.0',
      'SECURITY-APPNAME':               appId,
      'RESPONSE-DATA-FORMAT':           'JSON',
      'categoryId':                     '6001',
      'keywords':                       keywords,
      'paginationInput.entriesPerPage': '50',
      'paginationInput.pageNumber':     String(page),
      'sortOrder':                      sort,
      'outputSelector(0)':              'PictureURLLarge',
      'outputSelector(1)':              'SellerInfo',
    })
    let fi = 0
    if (priceMax) { p.set(`itemFilter(${fi}).name`, 'MaxPrice'); p.set(`itemFilter(${fi}).value`, priceMax); fi++ }
    if (listingType) { p.set(`itemFilter(${fi}).name`, 'ListingType'); p.set(`itemFilter(${fi}).value`, listingType) }
    const res = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${p}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    return items.map(i => mapEbay(i, make, model))
  } catch { return [] }
}

async function fetchEbay(
  appId: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string
): Promise<any[]> {
  if (!appId || !make) return []
  const min = parseInt(yearMin) || 0
  const max = parseInt(yearMax) || 0
  const rangeSize = (min && max) ? max - min + 1 : 0

  let searches: Promise<any[]>[]

  if (rangeSize > 0 && rangeSize <= 6) {
    // Small year range: search per-year × 3 pages so year appears in every title
    // e.g. "2013 ford mustang" page 1,2,3 — 150 results per year
    searches = []
    for (let y = min; y <= max; y++) {
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'PricePlusShippingLowest', '', 1))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'PricePlusShippingLowest', '', 2))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'StartTimeNewest',         '', 1))
    }
  } else {
    // Large range or no year filter: 3 general passes
    const kw = `${make} ${model}`
    searches = [
      ebaySearch(appId, kw, make, model, priceMax, 'PricePlusShippingLowest', '',           1),
      ebaySearch(appId, kw, make, model, priceMax, 'StartTimeNewest',         'FixedPrice', 1),
      ebaySearch(appId, kw, make, model, priceMax, 'PricePlusShippingLowest', '',           2),
    ]
  }

  const results = await Promise.all(searches)
  const seen = new Set<string>()
  return results.flat().filter(l => {
    if (seen.has(l.id)) return false; seen.add(l.id); return true
  })
}

// ── Filters ───────────────────────────────────────────────────────────────────
function filterListings(
  all: any[], yearMin: string, yearMax: string,
  priceMin: string, priceMax: string, mileageMax: string,
  transmission: string, drivetrain: string, condition: string,
  applyYear: boolean
): any[] {
  const yMin = parseInt(yearMin)    || 0
  const yMax = parseInt(yearMax)    || 9999
  const pMin = parseInt(priceMin)   || 0
  const pMax = parseInt(priceMax)   || 0
  const mMax = parseInt(mileageMax) || 0
  return all.filter(l => {
    if (applyYear && l.year > 0) {
      if (yearMin && l.year < yMin) return false
      if (yearMax && l.year > yMax) return false
    }
    if (l.price > 0) {
      if (pMin && l.price < pMin) return false
      if (pMax && l.price > pMax) return false
    }
    if (mMax && l.miles > 0 && l.miles > mMax) return false
    if (transmission && l.transmission &&
        !l.transmission.toLowerCase().includes(transmission.toLowerCase())) return false
    if (drivetrain && l.drivetrain &&
        !l.drivetrain.toLowerCase().includes(drivetrain.toLowerCase()))   return false
    if (condition === 'new'  && l.inventory_type && l.inventory_type !== 'new')       return false
    if (condition === 'used' && l.inventory_type && l.inventory_type !== 'used')      return false
    if (condition === 'cpo'  && l.inventory_type && l.inventory_type !== 'certified') return false
    return true
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const sp      = new URL(request.url).searchParams
  const mcKey   = process.env.MARKETCHECK_API_KEY || ''
  const ebayId  = process.env.EBAY_APP_ID         || ''

  const make         = sp.get('make')         || ''
  const model        = sp.get('model')        || ''
  const yearMin      = sp.get('yearMin')      || ''
  const yearMax      = sp.get('yearMax')      || ''
  const priceMin     = sp.get('priceMin')     || ''
  const priceMax     = sp.get('priceMax')     || ''
  const mileageMax   = sp.get('mileageMax')   || ''
  const zip          = (sp.get('zip') || '').replace(/\D/g, '')
  const radius       = parseInt(sp.get('radius') || '250')
  const transmission = sp.get('transmission') || ''
  const drivetrain   = sp.get('drivetrain')   || ''
  const condition    = sp.get('condition')    || ''
  const sortBy       = sp.get('sortBy')       || 'price-asc'
  const page         = Math.max(1, parseInt(sp.get('page') || '1'))

  // Geocode ZIP first so CarMax can receive correct coordinates
  let uLat = 0, uLon = 0
  if (zip) {
    try {
      const g  = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      const gd = await g.json()
      uLat = parseFloat(gd.places[0].latitude)
      uLon = parseFloat(gd.places[0].longitude)
    } catch { /* distance filter skipped if geocode fails */ }
  }

  // All four sources in parallel
  const [mcRaw, carmaxRaw, carvanaRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, condition, yearMin, yearMax),
    fetchCarmax(make, model, yearMin, yearMax, priceMax, zip, radius, uLat, uLon),
    fetchCarvana(make, model, yearMin, yearMax, priceMax),
    fetchEbay(ebayId, make, model, yearMin, yearMax, priceMax),
  ])

  const mcMapped = mcRaw.map(l => mapMC(l, uLat, uLon))
  const allRaw   = [...mcMapped, ...carmaxRaw, ...carvanaRaw, ...ebayRaw]

  // Deduplicate by id
  const seenIds = new Set<string>()
  const all     = allRaw.filter(l => { if (seenIds.has(l.id)) return false; seenIds.add(l.id); return true })

  // ── Filtering (3-pass graceful degradation) ───────────────────────────────
  // Pass 1: strict — all filters
  let filtered      = filterListings(all, yearMin, yearMax, priceMin, priceMax, mileageMax, transmission, drivetrain, condition, true)
  let filtersRelaxed = false

  // Pass 2: year filter eliminated everything — relax it, keep price/mileage
  if (filtered.length === 0 && all.length > 0 && (yearMin || yearMax)) {
    filtered      = filterListings(all, '', '', priceMin, priceMax, mileageMax, transmission, drivetrain, condition, false)
    filtersRelaxed = true
  }

  // Pass 3: still nothing — show all results for this make/model
  if (filtered.length === 0 && all.length > 0) {
    filtered      = [...all]
    filtersRelaxed = true
  }

  // ── Distance filter ───────────────────────────────────────────────────────
  let locationMode = 'nationwide'
  if (uLat && uLon && filtered.length > 0) {
    // Split: listings WITH a known distance vs online-only (eBay/Carvana, distance=null)
    const located  = filtered.filter(l => l.distance !== null)
    const online   = filtered.filter(l => l.distance === null)

    const inRadius = located.filter(l => (l.distance as number) <= radius)

    if (inRadius.length > 0) {
      // We have local dealer results — show them first, online sources appended after
      filtered     = [...inRadius, ...online]
      locationMode = 'local'
    } else if (located.length > 0) {
      // No dealers within radius — show nearest dealers + online sources
      located.sort((a, b) => (a.distance as number) - (b.distance as number))
      filtered     = [...located, ...online]
      locationMode = 'nearest_only'
    } else {
      // No located listings at all (all online) — show as-is
      locationMode = 'nationwide'
    }
  }

  // ── Sort (within each group, preserve local-first order) ─────────────────
  // When a ZIP is provided, always keep located results before null-distance ones
  function stableSort(arr: any[]) {
    if      (sortBy === 'price-desc')   arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else if (sortBy === 'mileage-asc')  arr.sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0))
    else if (sortBy === 'distance-asc') arr.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
    else                                arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    return arr
  }

  if (uLat && uLon && locationMode !== 'nationwide') {
    // Sort each group independently, then re-join so local results stay first
    const located = filtered.filter(l => l.distance !== null)
    const online  = filtered.filter(l => l.distance === null)
    filtered = [...stableSort(located), ...stableSort(online)]
  } else {
    stableSort(filtered)
  }

  const PER_PAGE   = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings: paginated, total: all.length,
    totalFiltered: filtered.length, totalPages,
    page: safePage, locationMode, filtersRelaxed,
    sources: {
      marketcheck: mcMapped.length,
      carmax:      carmaxRaw.length,
      carvana:     carvanaRaw.length,
      ebay:        ebayRaw.length,
    },
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
