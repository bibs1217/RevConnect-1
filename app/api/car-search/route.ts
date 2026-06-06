import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  console.log('[PARAMS]', Object.fromEntries(searchParams))
  const key = process.env.MARKETCHECK_API_KEY

  const make        = searchParams.get('make')        || ''
  const model       = searchParams.get('model')       || ''
  const yearMin     = searchParams.get('yearMin')     || ''
  const yearMax     = searchParams.get('yearMax')     || ''
  const priceMin    = searchParams.get('priceMin')    || ''
  const priceMax    = searchParams.get('priceMax')    || ''
  const mileageMax  = searchParams.get('mileageMax')  || ''
  const zip         = (searchParams.get('zip') || '').replace(/[^0-9]/g, '')
  const radius      = searchParams.get('radius')      || ''
  const transmission = searchParams.get('transmission') || ''
  const drivetrain  = searchParams.get('drivetrain')  || ''
  const condition   = searchParams.get('condition')   || ''
  const start       = searchParams.get('start')       || '0'

  const yMin = yearMin    ? parseInt(yearMin)    : null
  const yMax = yearMax    ? parseInt(yearMax)    : null
  const pMin = priceMin   ? parseInt(priceMin)   : null
  const pMax = priceMax   ? parseInt(priceMax)   : null
  const mMax = mileageMax ? parseInt(mileageMax) : null

  const hasFilters = yMin !== null || yMax !== null || pMin !== null || pMax !== null || mMax !== null
  const MAX_ATTEMPTS = (hasFilters || zip) ? 10 : 1
  const ROWS = 200
  const TARGET = 20
  const baseStart = parseInt(start)

  function buildUrl(fetchStart: number, skipGeo = false): string {
    let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=${ROWS}&start=${fetchStart}`
    if (make)                       u += `&make=${encodeURIComponent(make)}`
    if (model)                      u += `&model=${encodeURIComponent(model)}`
    if (yearMin)                    u += `&year_min=${yearMin}`
    if (yearMax)                    u += `&year_max=${yearMax}`
    if (priceMin)                   u += `&price_min=${priceMin}`
    if (priceMax)                   u += `&price_max=${priceMax}`
    if (mileageMax)                 u += `&miles_max=${mileageMax}`
    if (!skipGeo && zip)            u += `&zip=${zip}`
    if (!skipGeo && zip && radius)  u += `&radius=${radius}`
    if (transmission)               u += `&transmission=${transmission}`
    if (drivetrain)                 u += `&drivetrain=${drivetrain}`
    if (condition === 'new')        u += `&car_type=new`
    if (condition === 'used')       u += `&car_type=used`
    if (condition === 'cpo')        u += `&car_type=certified`
    return u
  }

  function mapListing(l: any) {
    return {
      id:            l.id,
      year:          l.build?.year         ?? null,
      make:          l.build?.make         ?? null,
      model:         l.build?.model        ?? null,
      trim:          l.build?.trim         ?? null,
      price:         l.price               ?? null,
      miles:         l.miles               ?? null,
      exterior_color: l.exterior_color     ?? null,
      transmission:  l.build?.transmission ?? null,
      drivetrain:    l.build?.drivetrain   ?? null,
      photo:         l.media?.photo_links?.[0] || null,
      dealer_name:   l.dealer?.name        ?? null,
      dealer_city:   l.dealer?.city        ?? null,
      dealer_state:  l.dealer?.state       ?? null,
      dealer_phone:  l.dealer?.phone       ?? null,
      listing_url:   l.vdp_url             ?? null,
      dom:           l.dom                 ?? null,
      price_drop:    (l.price_change ?? 0) < 0,
    }
  }

  function passes(l: any, enforceLocation: boolean): boolean {
    if (yMin !== null && l.year  !== null && l.year  < yMin) return false
    if (yMax !== null && l.year  !== null && l.year  > yMax) return false
    if (pMin !== null && l.price !== null && l.price < pMin) return false
    if (pMax !== null && l.price !== null && l.price > pMax) return false
    if (mMax !== null && l.miles !== null && l.miles > mMax) return false
    if (enforceLocation && (!l.dealer_city || !l.dealer_state))  return false
    return true
  }

  async function fetchFiltered(skipGeo: boolean): Promise<{ results: any[], checked: number, numFound: number }> {
    const label = skipGeo ? 'nationwide' : 'local'
    let results: any[] = []
    let totalChecked = 0
    let numFound = 0

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const fetchStart = baseStart + attempt * ROWS
      const fetchUrl = buildUrl(fetchStart, skipGeo)
      console.log(`[MC] ${label} attempt ${attempt + 1}/${MAX_ATTEMPTS} start=${fetchStart}`, fetchUrl.replace(key!, 'KEY'))

      try {
        const res = await fetch(fetchUrl, { cache: 'no-store' })
        const text = await res.text()
        if (attempt === 0) console.log(`[MC] ${label} raw first 200:`, text.slice(0, 200))

        const data = JSON.parse(text)
        numFound = data.num_found ?? numFound
        const batch: any[] = data.listings ?? []

        if (batch.length === 0) { console.log(`[MC] empty batch, stopping`); break }

        totalChecked += batch.length
        const passed = batch.map(mapListing).filter(l => passes(l, !skipGeo && !!zip))
        results = [...results, ...passed]

        console.log(`[MC] ${label} attempt ${attempt + 1}: batch=${batch.length} passed=${passed.length} accumulated=${results.length}`)

        if (results.length >= TARGET) break
        if (totalChecked >= numFound) break
      } catch (err) {
        console.error(`[MC] ${label} attempt ${attempt + 1} error:`, err)
        break
      }
    }

    return { results, checked: totalChecked, numFound }
  }

  // First pass: with zip/radius if provided
  let { results: allFiltered, checked: totalChecked, numFound } = await fetchFiltered(false)
  let locationMode: 'local' | 'nationwide_fallback' | 'nationwide' = zip ? 'local' : 'nationwide'

  // Fallback: if zip was set but returned nothing, retry without geographic filter
  if (zip && allFiltered.length === 0) {
    console.log(`[MC] 0 local results for zip=${zip}, retrying nationwide`)
    const fallback = await fetchFiltered(true)
    allFiltered  = fallback.results
    totalChecked = fallback.checked
    numFound     = fallback.numFound
    locationMode = 'nationwide_fallback'
  }

  console.log(`[MC] DONE locationMode=${locationMode} checked=${totalChecked} filtered=${allFiltered.length} numFound=${numFound}`)

  return NextResponse.json({
    listings: allFiltered,
    total: numFound,
    sources: { marketcheck: allFiltered.length, ebay: 0 },
    nextStart: baseStart + totalChecked,
    locationMode,
    _debug: { checked: totalChecked, filtered: allFiltered.length, numFound }
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
