import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// ── eBay Motors ───────────────────────────────────────────────────────────────
function mapEbay(item: any, make: string, model: string): any {
  const title = item.title?.[0] ?? ''
  const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
  const ym    = title.match(/\b(19|20)\d{2}\b/)

  // Try to pull mileage from item specifics (not always present)
  const specs: any[] = item.attribute ?? []
  const miSpec = specs.find((s: any) =>
    /mileage|odometer/i.test(s.name?.[0] ?? ''))
  const miles = parseInt((miSpec?.value?.[0] ?? '').replace(/[^0-9]/g, '')) || 0

  return {
    id:             `ebay_${item.itemId?.[0] ?? Math.random()}`,
    vin:            null,
    year:           ym ? parseInt(ym[0]) : 0,
    make, model,
    trim:           title,
    price,
    miles,
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
    source:         'eBay',
    listing_type:   item.listingInfo?.[0]?.listingType?.[0] ?? '',
    distance:       null,
  }
}

async function ebaySearch(
  appId: string, keywords: string, make: string, model: string,
  priceMin: string, priceMax: string, sort: string, page: number
): Promise<any[]> {
  try {
    // Build URL manually — URLSearchParams encodes ( ) in param names which breaks
    // eBay's itemFilter(N).name / outputSelector(N) syntax
    const parts: string[] = [
      'OPERATION-NAME=findItemsAdvanced',
      'SERVICE-VERSION=1.0.0',
      `SECURITY-APPNAME=${encodeURIComponent(appId)}`,
      'RESPONSE-DATA-FORMAT=JSON',
      'categoryId=6001',
      `keywords=${encodeURIComponent(keywords)}`,
      'paginationInput.entriesPerPage=50',
      `paginationInput.pageNumber=${page}`,
      `sortOrder=${sort}`,
      'outputSelector(0)=PictureURLLarge',
      'outputSelector(1)=SellerInfo',
    ]
    let fi = 0
    if (priceMin) {
      parts.push(
        `itemFilter(${fi}).name=MinPrice`,
        `itemFilter(${fi}).value=${priceMin}`,
        `itemFilter(${fi}).paramName=Currency`,
        `itemFilter(${fi}).paramValue=USD`,
      )
      fi++
    }
    if (priceMax) {
      parts.push(
        `itemFilter(${fi}).name=MaxPrice`,
        `itemFilter(${fi}).value=${priceMax}`,
        `itemFilter(${fi}).paramName=Currency`,
        `itemFilter(${fi}).paramValue=USD`,
      )
    }
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${parts.join('&')}`
    console.log(`[eBay] GET kw="${keywords}" page=${page} sort=${sort}`)

    const res  = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) { console.error('[eBay] HTTP', res.status, text.slice(0, 300)); return [] }

    let data: any
    try { data = JSON.parse(text) }
    catch { console.error('[eBay] bad JSON:', text.slice(0, 300)); return [] }

    const ack    = data.findItemsAdvancedResponse?.[0]?.ack?.[0]
    const total  = data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0]
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const errMsg = data.findItemsAdvancedResponse?.[0]?.errorMessage?.[0]?.error?.[0]?.message?.[0]
    console.log(`[eBay] kw="${keywords}" page=${page} ack=${ack} total=${total} items=${items.length}${errMsg ? ` ERR:${errMsg}` : ''}`)

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
    // Per-year keyword searches for small ranges — forces year into the title
    // so the regex in mapEbay parses it accurately instead of guessing
    searches = []
    for (let y = min; y <= max; y++) {
      const kw = `${y} ${make} ${model}`.trim()
      searches.push(ebaySearch(appId, kw, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 1))
      searches.push(ebaySearch(appId, kw, make, model, priceMin, priceMax, 'StartTimeNewest',         1))
    }
  } else {
    const kw = `${make} ${model}`.trim()
    searches = [
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 1),
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'StartTimeNewest',         1),
      ebaySearch(appId, kw, make, model, priceMin, priceMax, 'PricePlusShippingLowest', 2),
    ]
  }

  const seen    = new Set<string>()
  const rawAll  = (await Promise.all(searches)).flat()
  const deduped = rawAll.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true })
  console.log(`[eBay] total unique=${deduped.length}`)
  return deduped
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const sp     = new URL(request.url).searchParams
  const ebayId = process.env.EBAY_APP_ID || ''

  console.log(`[car-search] ebayId=${ebayId ? 'SET' : 'MISSING'}`)

  const make         = sp.get('make')         || ''
  const model        = sp.get('model')        || ''
  const yearMin      = sp.get('yearMin')      || ''
  const yearMax      = sp.get('yearMax')      || ''
  const priceMin     = sp.get('priceMin')     || ''
  const priceMax     = sp.get('priceMax')     || ''
  const mileageMax   = sp.get('mileageMax')   || ''
  const transmission = sp.get('transmission') || ''
  const drivetrain   = sp.get('drivetrain')   || ''
  const condition    = sp.get('condition')    || ''
  const sortBy       = sp.get('sortBy')       || 'price-asc'
  const page         = Math.max(1, parseInt(sp.get('page') || '1'))

  const ebayRaw = await fetchEbay(ebayId, make, model, yearMin, yearMax, priceMin, priceMax)

  // Deduplicate
  const seenIds = new Set<string>()
  const all     = ebayRaw.filter(l => { if (seenIds.has(l.id)) return false; seenIds.add(l.id); return true })

  console.log(`[car-search] eBay raw=${ebayRaw.length} deduped=${all.length}`)

  // ── Filters ───────────────────────────────────────────────────────────────
  const yMin = parseInt(yearMin)    || 0
  const yMax = parseInt(yearMax)    || 0
  const pMin = parseInt(priceMin)   || 0
  const pMax = parseInt(priceMax)   || 0
  const mMax = parseInt(mileageMax) || 0

  // Hard year filter — always enforced, never relaxed
  const yearFiltered = all.filter(l => {
    if (!l.year || l.year === 0) return true   // keep unknown-year listings
    if (yMin && l.year < yMin) return false
    if (yMax && l.year > yMax) return false
    return true
  })

  function applyFilters(list: any[]) {
    return list.filter(l => {
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

  let filtered       = applyFilters(yearFiltered)
  let filtersRelaxed = false

  if (filtered.length === 0 && yearFiltered.length > 0) {
    filtered       = [...yearFiltered]
    filtersRelaxed = true
  }
  if (filtered.length === 0 && all.length > 0) {
    filtered       = [...all]
    filtersRelaxed = true
  }

  // Strip $0 / null-price listings
  filtered = filtered.filter(l => l.price !== null && l.price > 0)

  console.log(`[car-search] yearFiltered=${yearFiltered.length} filtered=${filtered.length} relaxed=${filtersRelaxed}`)

  // ── Sort ──────────────────────────────────────────────────────────────────
  if      (sortBy === 'price-desc')  filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
  else if (sortBy === 'mileage-asc') filtered.sort((a, b) => (a.miles || 0) - (b.miles || 0))
  else                               filtered.sort((a, b) => (a.price || 0) - (b.price || 0))

  const PER_PAGE   = 20
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return NextResponse.json({
    listings:      paginated,
    total:         all.length,
    totalFiltered: filtered.length,
    totalPages,
    page:          safePage,
    filtersRelaxed,
    sources: { ebay: all.length },
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
