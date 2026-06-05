import { NextRequest, NextResponse } from 'next/server'

// ─── Marketcheck ───────────────────────────────────────────
async function fetchMarketcheck(params: Record<string, string>, apiKey: string) {
  const p = new URLSearchParams({
    api_key: apiKey,
    start: '0',
    ...params,
    rows: '50',   // always last — never overridden by caller params
  })

  const url = `https://mc-api.marketcheck.com/v2/search/car/active?${p}`
  console.log('[MC] GET', url.replace(apiKey, 'MC_KEY_HIDDEN'))

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[MC] Error ${res.status} ${res.statusText}:`, body.slice(0, 400))
      return []
    }

    const data = await res.json()
    const count = data.listings?.length ?? 0
    console.log(`[MC] num_found=${data.num_found ?? 'n/a'}, listings_in_page=${count}`)

    if (count === 0) {
      console.warn('[MC] Zero listings returned — check make/model casing, zip, radius, or plan limits')
    }

    return (data.listings ?? []).map((l: any) => ({
      id: `mc_${l.id}`,
      source_name: 'Dealer Inventory',
      source_badge: '🏪',
      year: l.build?.year,
      make: l.build?.make,
      model: l.build?.model,
      trim: l.build?.trim,
      price: l.price,
      mileage: l.miles,
      vin: l.vin,
      location: l.dealer?.city ? `${l.dealer.city}, ${l.dealer.state}` : '',
      distance: l.dist ? Math.round(l.dist) : null,
      images: l.media?.photo_links?.slice(0, 5) ?? [],
      exterior_color: l.exterior_color ?? l.build?.ext_color ?? null,
      transmission: l.build?.transmission,
      drivetrain: l.build?.drivetrain,
      engine: l.build?.engine,
      mpg_city: l.build?.city_mpg,
      mpg_hwy: l.build?.highway_mpg,
      is_certified: l.car_type === 'certified',
      dealer_name: l.dealer?.name,
      dealer_phone: l.dealer?.phone,
      listing_url: l.vdp_url,
      days_on_market: l.dom,
      price_drop: l.price_change != null ? l.price_change < 0 : false,
      deal_rating: l.price_rating ?? null,
      listing_type: 'buy_now',
      time_left: null,
      bid_count: null,
    }))
  } catch (err) {
    console.error('[MC] Fetch exception:', err)
    return []
  }
}

// ─── eBay Motors ───────────────────────────────────────────
async function fetchEbay(params: Record<string, string>, appId: string) {
  const parts = [
    params.yearMin && params.yearMax && params.yearMin === params.yearMax ? params.yearMin : '',
    params.make ?? '',
    params.model ?? '',
  ].filter(Boolean)
  const keywords = parts.length ? parts.join(' ') : 'car'

  const p = new URLSearchParams({
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'categoryId': '6001',
    'keywords': keywords,
    // raised from 12 → 25 to return more results per search
    'paginationInput.entriesPerPage': '25',
    'sortOrder': params.sortBy === 'price-desc' ? 'PricePlusShippingHighest' : 'PricePlusShippingLowest',
    'outputSelector(0)': 'PictureURLSuperSize',
    'outputSelector(1)': 'SellerInfo',
  })

  // FIX: use a sequential index counter so eBay filters are never skipped.
  // Previously itemFilter(1) was used without itemFilter(0) when priceMax was
  // empty — eBay silently drops non-sequential filters, causing 0 condition
  // matches to be returned.
  let filterIdx = 0

  if (params.priceMax) {
    p.set(`itemFilter(${filterIdx}).name`, 'MaxPrice')
    p.set(`itemFilter(${filterIdx}).value`, params.priceMax)
    filterIdx++
  }

  if (params.condition === 'used') {
    p.set(`itemFilter(${filterIdx}).name`, 'Condition')
    p.set(`itemFilter(${filterIdx}).value`, '3000')
    filterIdx++
  } else if (params.condition === 'new') {
    p.set(`itemFilter(${filterIdx}).name`, 'Condition')
    p.set(`itemFilter(${filterIdx}).value`, '1000')
    filterIdx++
  }

  console.log(`[eBay] keywords="${keywords}", filters=${filterIdx}, entriesPerPage=25`)

  try {
    const res = await fetch(
      `https://svcs.ebay.com/services/search/FindingService/v1?${p}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error(`[eBay] Error ${res.status} ${res.statusText}:`, body.slice(0, 400))
      return []
    }

    const data = await res.json()
    const ack = data.findItemsAdvancedResponse?.[0]?.ack?.[0]
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const totalFound = data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0'

    console.log(`[eBay] ack=${ack}, totalFound=${totalFound}, returned=${items.length}`)

    if (ack === 'Failure') {
      const errMsg = data.findItemsAdvancedResponse?.[0]?.errorMessage?.[0]?.error?.[0]?.message?.[0]
      console.error('[eBay] API Failure:', errMsg)
    }

    return items.map((item: any) => {
      const title: string = item.title?.[0] ?? ''
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
      const listingType: string = item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice'
      const timeLeft: string = item.listingInfo?.[0]?.timeLeft?.[0] ?? ''
      const img: string = item.pictureURLSuperSize?.[0] ?? item.galleryURL?.[0] ?? ''
      const viewUrl: string = item.viewItemURL?.[0] ?? ''
      const itemId: string = item.itemId?.[0] ?? ''
      const yearMatch = title.match(/\b(19|20)\d{2}\b/)

      return {
        id: `ebay_${itemId}`,
        source_name: 'eBay Motors',
        source_badge: '🏁',
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        make: params.make || null,
        model: params.model || null,
        trim: title,
        price: price || null,
        mileage: null,
        vin: null,
        location: item.location?.[0] ?? '',
        distance: null,
        images: img ? [img] : [],
        exterior_color: null,
        transmission: null,
        drivetrain: null,
        engine: null,
        mpg_city: null,
        mpg_hwy: null,
        is_certified: false,
        dealer_name: item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
        dealer_phone: null,
        listing_url: viewUrl,
        days_on_market: null,
        price_drop: false,
        deal_rating: null,
        listing_type: listingType === 'Auction' ? 'auction' : 'buy_now',
        time_left: timeLeft,
        bid_count: item.sellingStatus?.[0]?.bidCount?.[0] ?? '0',
      }
    })
  } catch (err) {
    console.error('[eBay] Fetch exception:', err)
    return []
  }
}

// ─── Main handler ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mcKey = process.env.MARKETCHECK_API_KEY
  const ebayAppId = process.env.EBAY_APP_ID

  console.log(`[car-search] mcKey=${mcKey ? 'SET' : 'MISSING'}, ebayAppId=${ebayAppId ? 'SET' : 'MISSING'}`)

  if (!mcKey && !ebayAppId) {
    return NextResponse.json({ error: 'No search API keys configured' }, { status: 400 })
  }

  const p: Record<string, string> = {}
  for (const [k, v] of searchParams.entries()) p[k] = v

  console.log('[car-search] Incoming params:', JSON.stringify(p))

  const mcParams: Record<string, string> = {}
  if (p.zip)          { mcParams.zip = p.zip; mcParams.radius = p.radius || '100' }
  if (p.make)         mcParams.make = p.make          // pass as-is; MC API is case-insensitive
  if (p.model)        mcParams.model = p.model        // pass as-is
  if (p.yearMin)      mcParams.year_min = p.yearMin
  if (p.yearMax)      mcParams.year_max = p.yearMax
  if (p.priceMin)     mcParams.price_min = p.priceMin
  if (p.priceMax)     mcParams.price_max = p.priceMax
  if (p.mileageMax)   mcParams.miles_max = p.mileageMax
  if (p.transmission) mcParams.transmission = p.transmission.toLowerCase()
  if (p.drivetrain)   mcParams.drivetrain = p.drivetrain.toLowerCase()

  // Only set car_type if condition is explicitly specified — not defaulting to
  // 'used' here because that was artificially restricting results
  if (p.condition === 'new')        mcParams.car_type = 'new'
  else if (p.condition === 'cpo')   mcParams.car_type = 'certified'
  else if (p.condition === 'used')  mcParams.car_type = 'used'
  // if condition is empty/unset, omit car_type so MC returns all types

  if (p.sortBy === 'price-asc')    { mcParams.sort_by = 'price'; mcParams.sort_order = 'asc' }
  else if (p.sortBy === 'price-desc') { mcParams.sort_by = 'price'; mcParams.sort_order = 'desc' }
  else if (p.sortBy === 'mileage-asc') { mcParams.sort_by = 'miles'; mcParams.sort_order = 'asc' }

  const [mcListings, ebayListings] = await Promise.all([
    mcKey     ? fetchMarketcheck(mcParams, mcKey) : Promise.resolve([]),
    ebayAppId ? fetchEbay(p, ebayAppId)           : Promise.resolve([]),
  ])

  // Merge and apply year filter post-hoc (for eBay which can't filter server-side by year range)
  const all = [...mcListings, ...ebayListings].filter((l: any) => {
    if (p.yearMin && l.year && l.year < parseInt(p.yearMin)) return false
    if (p.yearMax && l.year && l.year > parseInt(p.yearMax)) return false
    return true
  })

  if (p.sortBy === 'price-asc')  all.sort((a: any, b: any) => (a.price ?? 999999) - (b.price ?? 999999))
  else if (p.sortBy === 'price-desc') all.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0))

  console.log(`[car-search] RESULT: MC=${mcListings.length}, eBay=${ebayListings.length}, merged_total=${all.length}`)

  return NextResponse.json({
    listings: all,
    total: all.length,
    sources: { marketcheck: mcListings.length, ebay: ebayListings.length },
  })
}
