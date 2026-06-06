import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// ── Marketcheck ───────────────────────────────────────────────────────────────
// Single call — send ALL filters (including zip+radius) so Marketcheck does the
// geo work and returns the right local inventory. Do NOT send sort or car_type
// auto-overrides as those combinations cause 422 on the basic plan.
async function fetchMarketcheck(
  key: string,
  make: string, model: string,
  yearMin: string, yearMax: string,
  priceMin: string, priceMax: string, mileageMax: string,
  transmission: string, drivetrain: string, condition: string,
  zip: string, radius: string
): Promise<any[]> {
  if (!key) return []
  try {
    const p = new URLSearchParams()
    p.set('api_key', key)
    p.set('rows',    '100')
    p.set('start',   '0')

    if (make)         p.set('make',         make)
    if (model)        p.set('model',        model)
    if (yearMin)      p.set('year_min',     yearMin)
    if (yearMax)      p.set('year_max',     yearMax)
    if (priceMin)     p.set('price_min',    priceMin)
    if (priceMax)     p.set('price_max',    priceMax)
    if (mileageMax)   p.set('miles_max',    mileageMax)
    if (transmission) p.set('transmission', transmission)
    if (drivetrain)   p.set('drivetrain',   drivetrain)
    if (zip) {
      p.set('zip', zip)
      if (radius) p.set('radius', radius)
    }
    // Only set car_type when user explicitly chose a condition
    if (condition === 'new')       p.set('car_type', 'new')
    else if (condition === 'cpo')  p.set('car_type', 'certified')
    else if (condition === 'used') p.set('car_type', 'used')

    const url = `https://mc-api.marketcheck.com/v2/search/car/active?${p}`
    console.log('[MC] →', url.replace(key, 'KEY'))

    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
    const text = await res.text()
    console.log(`[MC] status=${res.status} preview=${text.slice(0, 300)}`)

    if (!res.ok) { console.error('[MC] error', res.status); return [] }

    const data = JSON.parse(text)
    const raw: any[] = Array.isArray(data.listings) ? data.listings : []
    console.log(`[MC] num_found=${data.num_found ?? '?'} returned=${raw.length}`)
    return raw
  } catch (e) {
    console.error('[MC] exception', e)
    return []
  }
}

function mapMC(l: any): any {
  return {
    id:             `mc_${l.id ?? Math.random()}`,
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
    // Marketcheck returns dist (miles) when zip is provided — use it directly
    distance:       l.dist != null ? Math.round(l.dist) : null,
  }
}

// ── eBay ──────────────────────────────────────────────────────────────────────
function mapEbay(item: any, make: string, model: string): any {
  const title  = item.title?.[0] ?? ''
  const price  = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const ym     = title.match(/\b(19|20)\d{2}\b/)
  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    year:           ym ? parseInt(ym[0]) : 0,
    make, model, trim: title,
    price, miles: 0, exterior_color: '', transmission: '', drivetrain: '',
    photo:          item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? null,
    dealer_name:    item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
    dealer_city:    item.location?.[0] ?? '',
    dealer_state:   '', dealer_phone: '',
    listing_url:    item.viewItemURL?.[0] ?? '',
    dom: 0, price_drop: false, inventory_type: 'used',
    source: 'eBay', listing_type: item.listingInfo?.[0]?.listingType?.[0] ?? '',
    distance: null,
  }
}

async function ebaySearch(
  appId: string, keywords: string, make: string, model: string,
  priceMax: string, sort: string, page: number
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
    if (priceMax) { p.set('itemFilter(0).name', 'MaxPrice'); p.set('itemFilter(0).value', priceMax) }
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
  if (rangeSize > 0 && rangeSize <= 8) {
    // Per-year searches — year is guaranteed to be in the title, parsing is accurate
    searches = []
    for (let y = min; y <= max; y++) {
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'PricePlusShippingLowest', 1))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'PricePlusShippingLowest', 2))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMax, 'StartTimeNewest',         1))
    }
  } else {
    const kw = `${make} ${model}`.trim()
    searches = [
      ebaySearch(appId, kw, make, model, priceMax, 'PricePlusShippingLowest', 1),
      ebaySearch(appId, kw, make, model, priceMax, 'StartTimeNewest',         1),
      ebaySearch(appId, kw, make, model, priceMax, 'PricePlusShippingLowest', 2),
    ]
  }

  const seen = new Set<string>()
  const results = await Promise.all(searches)
  return results.flat().filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const mcKey  = process.env.MARKETCHECK_API_KEY || ''
  const ebayId = process.env.EBAY_APP_ID         || ''

  const make         = sp.get('make')         || ''
  const model        = sp.get('model')        || ''
  const yearMin      = sp.get('yearMin')      || ''
  const yearMax      = sp.get('yearMax')      || ''
  const priceMin     = sp.get('priceMin')     || ''
  const priceMax     = sp.get('priceMax')     || ''
  const mileageMax   = sp.get('mileageMax')   || ''
  const zip          = (sp.get('zip') || '').replace(/\D/g, '')
  const radius       = sp.get('radius')       || '250'
  const transmission = sp.get('transmission') || ''
  const drivetrain   = sp.get('drivetrain')   || ''
  const condition    = sp.get('condition')    || ''
  const sortBy       = sp.get('sortBy')       || 'price-asc'
  const page         = Math.max(1, parseInt(sp.get('page') || '1'))

  const [mcRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, yearMin, yearMax, priceMin, priceMax,
                     mileageMax, transmission, drivetrain, condition, zip, radius),
    fetchEbay(ebayId, make, model, yearMin, yearMax, priceMax),
  ])

  const mcMapped = mcRaw.map(mapMC)
  const all      = [...mcMapped, ...ebayRaw]

  // Deduplicate
  const seen    = new Set<string>()
  const deduped = all.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })

  console.log(`[car-search] MC=${mcMapped.length} eBay=${ebayRaw.length} total=${deduped.length}`)

  // ── Post-filter (safety net for eBay which can't filter server-side) ────────
  const yMin = parseInt(yearMin)    || 0
  const yMax = parseInt(yearMax)    || 9999
  const pMin = parseInt(priceMin)   || 0
  const pMax = parseInt(priceMax)   || 0
  const mMax = parseInt(mileageMax) || 0
  const rad  = parseInt(radius)     || 250

  let filtered = deduped.filter(l => {
    // Year (only when year is known)
    if (l.year > 0) {
      if (yMin && l.year < yMin) return false
      if (yMax && l.year > yMax) return false
    }
    // Price
    if (l.price > 0) {
      if (pMin && l.price < pMin) return false
      if (pMax && l.price > pMax) return false
    }
    // Mileage (eBay has miles=0 — skip filter for those)
    if (mMax && l.miles > 0 && l.miles > mMax) return false
    // Transmission / drivetrain (skip when field is empty)
    if (transmission && l.transmission &&
        !l.transmission.toLowerCase().includes(transmission.toLowerCase())) return false
    if (drivetrain && l.drivetrain &&
        !l.drivetrain.toLowerCase().includes(drivetrain.toLowerCase())) return false
    // Condition
    if (condition === 'new'  && l.inventory_type && l.inventory_type !== 'new')       return false
    if (condition === 'used' && l.inventory_type && l.inventory_type !== 'used')      return false
    if (condition === 'cpo'  && l.inventory_type && l.inventory_type !== 'certified') return false
    return true
  })

  let filtersRelaxed = false

  // Graceful degradation: if year filter wiped everything, relax it
  if (filtered.length === 0 && deduped.length > 0 && (yearMin || yearMax)) {
    filtered       = deduped.filter(l => {
      if (l.price > 0) {
        if (pMin && l.price < pMin) return false
        if (pMax && l.price > pMax) return false
      }
      if (mMax && l.miles > 0 && l.miles > mMax) return false
      return true
    })
    filtersRelaxed = true
  }

  // Last resort: show everything
  if (filtered.length === 0 && deduped.length > 0) {
    filtered       = [...deduped]
    filtersRelaxed = true
  }

  // ── Distance filter ───────────────────────────────────────────────────────
  // Marketcheck already geo-filtered when zip was sent — l.dist is populated.
  // eBay has no location so distance=null — always include but sort after local.
  let locationMode = 'nationwide'
  if (zip && filtered.length > 0) {
    const local  = filtered.filter(l => l.distance !== null && l.distance <= rad)
    const online = filtered.filter(l => l.distance === null)
    const far    = filtered.filter(l => l.distance !== null && l.distance >  rad)

    if (local.length > 0) {
      filtered     = [...local, ...online]
      locationMode = 'local'
    } else if (far.length > 0) {
      far.sort((a, b) => a.distance - b.distance)
      filtered     = [...far, ...online]
      locationMode = 'nearest_only'
    } else {
      locationMode = 'nationwide'
    }
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  if      (sortBy === 'price-desc')   filtered.sort((a, b) => (b.price ?? 0)   - (a.price ?? 0))
  else if (sortBy === 'mileage-asc')  filtered.sort((a, b) => (a.miles ?? 0)   - (b.miles ?? 0))
  else if (sortBy === 'distance-asc') filtered.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
  else                                filtered.sort((a, b) => (a.price ?? 0)   - (b.price ?? 0))

  const PER_PAGE   = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings: paginated,
    total:         deduped.length,
    totalFiltered: filtered.length,
    totalPages,
    page:          safePage,
    locationMode,
    filtersRelaxed,
    sources: {
      marketcheck: mcMapped.length,
      carmax:      0,
      carvana:     0,
      ebay:        ebayRaw.length,
    },
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
