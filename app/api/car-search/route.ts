import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Marketcheck ───────────────────────────────────────────────────────────────
// IMPORTANT: zip/radius causes 422 on this plan — do NOT send them.
// We fetch national inventory (rows=50 is the plan max) and apply
// Haversine distance client-side using dealer lat/lon.
async function fetchMarketcheck(
  key: string, make: string, model: string,
  yearMin: string, yearMax: string,
  priceMin: string, priceMax: string, mileageMax: string,
  transmission: string, drivetrain: string, condition: string
): Promise<any[]> {
  if (!key) return []
  try {
    const p = new URLSearchParams({ api_key: key, rows: '50', start: '0' })
    if (make)         p.set('make',         make)
    if (model)        p.set('model',        model)
    if (yearMin)      p.set('year_min',     yearMin)
    if (yearMax)      p.set('year_max',     yearMax)
    if (priceMin)     p.set('price_min',    priceMin)
    if (priceMax)     p.set('price_max',    priceMax)
    if (mileageMax)   p.set('miles_max',    mileageMax)
    if (transmission) p.set('transmission', transmission)
    if (drivetrain)   p.set('drivetrain',   drivetrain)
    if (condition === 'new')       p.set('car_type', 'new')
    else if (condition === 'cpo')  p.set('car_type', 'certified')
    else if (condition === 'used') p.set('car_type', 'used')

    const url = `https://mc-api.marketcheck.com/v2/search/car/active?${p}`
    console.log('[MC] GET', url.replace(key, 'KEY'))

    const res  = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
    const text = await res.text()
    if (!res.ok) { console.error('[MC] error', res.status, text.slice(0, 200)); return [] }
    const data = JSON.parse(text)
    const raw: any[] = Array.isArray(data.listings) ? data.listings : []
    console.log(`[MC] num_found=${data.num_found ?? '?'} returned=${raw.length}`)
    return raw
  } catch (e) { console.error('[MC] exception', e); return [] }
}

function mapMC(l: any, uLat: number, uLon: number): any {
  const dlat = parseFloat(l.dealer?.latitude  || '0')
  const dlon = parseFloat(l.dealer?.longitude || '0')
  const distance = (uLat && uLon && dlat && dlon)
    ? Math.round(haversine(uLat, uLon, dlat, dlon)) : null
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
    distance,
  }
}

// ── eBay ──────────────────────────────────────────────────────────────────────
function mapEbay(item: any, make: string, model: string): any {
  const title = item.title?.[0] ?? ''
  const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const ym    = title.match(/\b(19|20)\d{2}\b/)
  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    year:           ym ? parseInt(ym[0]) : 0,
    make, model,
    trim:           title,
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
  priceMin: string, priceMax: string, sort: string, page: number
): Promise<any[]> {
  try {
    const p = new URLSearchParams({
      'OPERATION-NAME':                 'findItemsAdvanced',
      'SERVICE-VERSION':                '1.0.0',
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
    if (priceMin) {
      p.set(`itemFilter(${fi}).name`,       'MinPrice')
      p.set(`itemFilter(${fi}).value`,      priceMin)
      p.set(`itemFilter(${fi}).paramName`,  'Currency')
      p.set(`itemFilter(${fi}).paramValue`, 'USD')
      fi++
    }
    if (priceMax) {
      p.set(`itemFilter(${fi}).name`,       'MaxPrice')
      p.set(`itemFilter(${fi}).value`,      priceMax)
      p.set(`itemFilter(${fi}).paramName`,  'Currency')
      p.set(`itemFilter(${fi}).paramValue`, 'USD')
    }
    const res = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${p}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) { console.error('[eBay] HTTP', res.status); return [] }
    const data  = await res.json()
    const ack   = data.findItemsAdvancedResponse?.[0]?.ack?.[0]
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    console.log(`[eBay] kw="${keywords}" page=${page} ack=${ack} items=${items.length}`)
    return items.map(i => mapEbay(i, make, model))
  } catch (e) { console.error('[eBay] exception', e); return [] }
}

async function fetchEbay(
  appId: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMin: string, priceMax: string
): Promise<any[]> {
  if (!appId) { console.warn('[eBay] EBAY_APP_ID not set'); return [] }
  if (!make)  { console.warn('[eBay] no make — skipping'); return [] }

  const min      = parseInt(yearMin) || 0
  const max      = parseInt(yearMax) || 0
  const rangeSize = (min && max) ? max - min + 1 : 0

  let searches: Promise<any[]>[]
  if (rangeSize > 0 && rangeSize <= 8) {
    searches = []
    for (let y = min; y <= max; y++) {
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 1))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 2))
      searches.push(ebaySearch(appId, `${y} ${make} ${model}`, make, model, priceMin, priceMax, 'StartTimeNewest',         1))
    }
  } else {
    const kw = `${make} ${model}`.trim()
    searches = [
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 1),
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'StartTimeNewest',         1),
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 2),
    ]
  }

  const seen = new Set<string>()
  const all  = (await Promise.all(searches)).flat()
  const deduped = all.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })
  console.log(`[eBay] total unique=${deduped.length}`)
  return deduped
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const sp    = new URL(request.url).searchParams
  const mcKey = process.env.MARKETCHECK_API_KEY || ''
  const ebayId = process.env.EBAY_APP_ID        || ''

  console.log(`[car-search] mcKey=${mcKey ? 'SET' : 'MISSING'} ebayId=${ebayId ? 'SET' : 'MISSING'}`)

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

  // Geocode ZIP for Haversine distance (Marketcheck doesn't accept zip+radius on this plan)
  let uLat = 0, uLon = 0
  if (zip) {
    try {
      const g  = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      const gd = await g.json()
      uLat = parseFloat(gd.places[0].latitude)
      uLon = parseFloat(gd.places[0].longitude)
      console.log(`[geo] zip=${zip} lat=${uLat} lon=${uLon}`)
    } catch (e) { console.warn('[geo] geocode failed', e) }
  }

  const [mcRaw, ebayRaw] = await Promise.all([
    fetchMarketcheck(mcKey, make, model, yearMin, yearMax,
                     priceMin, priceMax, mileageMax, transmission, drivetrain, condition),
    fetchEbay(ebayId, make, model, yearMin, yearMax, priceMin, priceMax),
  ])

  const mcMapped = mcRaw.map(l => mapMC(l, uLat, uLon))
  const allRaw   = [...mcMapped, ...ebayRaw]

  // Deduplicate
  const seenIds = new Set<string>()
  const all     = allRaw.filter(l => { if (seenIds.has(l.id)) return false; seenIds.add(l.id); return true })

  console.log(`[car-search] MC=${mcMapped.length} eBay=${ebayRaw.length} total=${all.length}`)

  // ── Filters ───────────────────────────────���─────────────────────────────────
  const yMin = parseInt(yearMin)    || 0
  const yMax = parseInt(yearMax)    || 9999
  const pMin = parseInt(priceMin)   || 0
  const pMax = parseInt(priceMax)   || 0
  const mMax = parseInt(mileageMax) || 0

  function applyFilters(list: any[], checkYear: boolean) {
    return list.filter(l => {
      if (checkYear && l.year > 0) {
        if (yMin && l.year < yMin) return false
        if (yMax && l.year > yMax) return false
      }
      if (l.price > 0) {
        if (pMin && l.price < pMin) return false
        if (pMax && l.price > pMax) return false
      }
      if (mMax && l.miles > 0 && l.miles > mMax) return false
      if (transmission && l.transmission &&
          !l.transmission.toLowerCase().includes(transmission.toLowerCase())) return false
      if (drivetrain && l.drivetrain &&
          !l.drivetrain.toLowerCase().includes(drivetrain.toLowerCase())) return false
      if (condition === 'new'  && l.inventory_type && l.inventory_type !== 'new')       return false
      if (condition === 'used' && l.inventory_type && l.inventory_type !== 'used')      return false
      if (condition === 'cpo'  && l.inventory_type && l.inventory_type !== 'certified') return false
      return true
    })
  }

  let filtered       = applyFilters(all, true)
  let filtersRelaxed = false

  if (filtered.length === 0 && all.length > 0 && (yearMin || yearMax)) {
    filtered       = applyFilters(all, false)
    filtersRelaxed = true
  }
  if (filtered.length === 0 && all.length > 0) {
    filtered       = [...all]
    filtersRelaxed = true
  }

  console.log(`[car-search] filtered=${filtered.length} filtersRelaxed=${filtersRelaxed}`)

  // ── Distance filter ───────────────────────────────────────────────────────
  // eBay has no location (distance=null) — always included after local results
  let locationMode = 'nationwide'
  if (uLat && uLon && filtered.length > 0) {
    const local  = filtered.filter(l => l.distance !== null && (l.distance as number) <= radius)
    const online = filtered.filter(l => l.distance === null)
    const far    = filtered.filter(l => l.distance !== null && (l.distance as number) >  radius)

    if (local.length > 0) {
      filtered     = [...local, ...online]
      locationMode = 'local'
    } else if (far.length > 0) {
      far.sort((a, b) => (a.distance as number) - (b.distance as number))
      filtered     = [...far.slice(0, 20), ...online]   // show nearest 20 dealers + all eBay
      locationMode = 'nearest_only'
    }
    // if both are empty (all results are online), locationMode stays 'nationwide'
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  if      (sortBy === 'price-desc')   filtered.sort((a, b) => (b.price   || 0) - (a.price   || 0))
  else if (sortBy === 'mileage-asc')  filtered.sort((a, b) => (a.miles   || 0) - (b.miles   || 0))
  else if (sortBy === 'distance-asc') filtered.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
  else                                filtered.sort((a, b) => (a.price   || 0) - (b.price   || 0))

  const PER_PAGE   = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings:      paginated,
    total:         all.length,
    totalFiltered: filtered.length,
    totalPages,
    page:          safePage,
    locationMode,
    filtersRelaxed,
    sources: { marketcheck: mcMapped.length, carmax: 0, carvana: 0, ebay: ebayRaw.length },
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
