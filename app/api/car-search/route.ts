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

// ── Marketcheck ─────────────────────────────────────────────────────────────
// Up to 20 batches × 50 = 1000 listings. Time-guarded to stay under Vercel limit.
async function fetchMarketcheck(
  key: string, make: string, model: string, condition: string, yearMax: string
): Promise<any[]> {
  if (!key) return []
  const listings: any[] = []
  const deadline = Date.now() + 8500 // bail before Vercel's 10s serverless limit
  for (let i = 0; i < 20; i++) {
    if (Date.now() > deadline) break
    try {
      let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=50&start=${i * 50}`
      if (make)  u += `&make=${encodeURIComponent(make)}`
      if (model) u += `&model=${encodeURIComponent(model)}`
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

// ── eBay ─────────────────────────────────────────────────────────────────────
// Build eBay year aspect filter as a raw string — eBay uses literal parens in
// parameter names that URLSearchParams would percent-encode, breaking the filter.
function ebayYearAspect(yearMin: string, yearMax: string): string {
  if (!yearMin && !yearMax) return ''
  const min = parseInt(yearMin) || 2000
  const max = parseInt(yearMax) || new Date().getFullYear()
  if (max < min || max - min > 10) return '' // too wide a range — skip
  let s = '&aspectFilter(0).aspectName=Year'
  for (let y = min, i = 0; y <= max; y++, i++) {
    s += `&aspectFilter(0).aspectValueName(${i})=${y}`
  }
  return s
}

function mapEbayItem(item: any, make: string, model: string): any {
  const title: string  = item.title?.[0] ?? ''
  const price          = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const yearMatch      = title.match(/\b(19|20)\d{2}\b/)
  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    year:           yearMatch ? parseInt(yearMatch[0]) : 0,
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
}

async function fetchEbayPass(
  appId: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  sortOrder: string, listingType: string, pageNum: number
): Promise<any[]> {
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
      'paginationInput.pageNumber':     String(pageNum),
      'sortOrder':                      sortOrder,
      'outputSelector(0)':              'PictureURLLarge',
      'outputSelector(1)':              'SellerInfo',
    })
    let fi = 0
    if (priceMax) {
      p.set(`itemFilter(${fi}).name`,  'MaxPrice')
      p.set(`itemFilter(${fi}).value`, priceMax)
      fi++
    }
    if (listingType) {
      p.set(`itemFilter(${fi}).name`,  'ListingType')
      p.set(`itemFilter(${fi}).value`, listingType)
    }
    // Append year aspect filter as raw string (parens must not be encoded)
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${p}${ebayYearAspect(yearMin, yearMax)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    return items.map((item: any) => mapEbayItem(item, make, model))
  } catch {
    return []
  }
}

// Three parallel eBay passes:
//   1. All types,   price low→high, page 1  (with year aspect filter)
//   2. FixedPrice,  newest first,   page 1  (with year aspect filter — Buy It Now)
//   3. All types,   price low→high, page 2  (second page of results)
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
  // Deduplicate by id
  const seen = new Set<string>()
  return [...p1, ...p2, ...p3].filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

// ── Filter helpers ───────────────────────────────────────────────────────────
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

  // Geocode ZIP in parallel with fetches
  let userLat = 0, userLon = 0
  const geoPromise = zip
    ? fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { userLat = parseFloat(d.places[0].latitude); userLon = parseFloat(d.places[0].longitude) })
        .catch(() => {})
    : Promise.resolve()

  // Run Marketcheck (sequential, up to 1000 results) and eBay (3 parallel passes)
  // concurrently — eBay finishes fast, Marketcheck dominates the clock
  const [mcRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, condition, yearMax),
    fetchEbay(ebayId, make, model, yearMin, yearMax, priceMax),
    geoPromise,
  ]) as [any[], any[], void]

  // Map Marketcheck listings — compute Haversine distance from user ZIP
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

  // ── GRACEFUL DEGRADATION ─────────────────────────────────────────────────
  // 1. Try full strict filter (year + price + mileage + condition)
  // 2. If nothing passes: relax ONLY the year filter — keep everything else
  // 3. Never return an empty results page when inventory exists
  let filtered = applyFilters(allMapped, yearMin, yearMax, priceMin, priceMax, mileageMax, transmission, drivetrain, condition, true)
  let filtersRelaxed = false

  if (filtered.length === 0 && allMapped.length > 0 && (yearMin || yearMax)) {
    filtered = applyFilters(allMapped, '', '', priceMin, priceMax, mileageMax, transmission, drivetrain, condition, false)
    filtersRelaxed = true
  }

  // ── DISTANCE FILTER ──────────────────────────────────────────────────────
  // eBay listings carry no dealer lat/lon (distance=null) — always pass through.
  // Marketcheck listings get filtered by actual Haversine distance.
  let locationMode = 'nationwide'
  if (userLat && userLon && filtered.length > 0) {
    const local = filtered.filter((l: any) =>
      l.source === 'eBay' || l.distance === null || l.distance <= radius
    )
    if (local.length > 0) {
      filtered = local
      locationMode = 'local'
    } else {
      // Matching cars exist but none within requested radius — show nearest
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
    total:          allMapped.length,
    totalFiltered:  filtered.length,
    totalPages,
    page:           safePage,
    locationMode,
    filtersRelaxed,
    sources: {
      marketcheck: mcMapped.length,
      ebay:        ebayRaw.length,
    },
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
