import { NextRequest, NextResponse } from 'next/server'

// ─── Marketcheck ───────────────────────────────────────────
async function fetchMarketcheck(params: Record<string, string>, apiKey: string) {
  const p = new URLSearchParams({ api_key: apiKey, rows: '18', start: '0', seller_type: 'dealer', ...params })
  try {
    const res = await fetch(`https://mc-api.marketcheck.com/v2/search/car/active?${p}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
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
      exterior_color: l.build?.ext_color,
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
      price_drop: l.price_change < 0,
      deal_rating: l.price_rating ?? null,
      listing_type: 'buy_now',
    }))
  } catch { return [] }
}

// ─── eBay Motors ───────────────────────────────────────────
async function fetchEbay(params: Record<string, string>, appId: string) {
  // Build keyword from make/model/year
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
    'categoryId': '6001',        // eBay Motors: Cars & Trucks
    'keywords': keywords,
    'paginationInput.entriesPerPage': '12',
    'sortOrder': params.sortBy === 'price-desc' ? 'PricePlusShippingHighest' : 'PricePlusShippingLowest',
    'outputSelector(0)': 'PictureURLSuperSize',
    'outputSelector(1)': 'SellerInfo',
    'outputSelector(2)': 'AspectHistogram',
  })

  // Price filter
  if (params.priceMax) {
    p.set('itemFilter(0).name', 'MaxPrice')
    p.set('itemFilter(0).value', params.priceMax)
  }

  // Condition: used
  if (params.condition === 'used') {
    p.set('itemFilter(1).name', 'Condition')
    p.set('itemFilter(1).value', '3000') // Used
  }

  try {
    const res = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${p}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []

    return items.map((item: any) => {
      const title: string = item.title?.[0] ?? ''
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
      const listingType: string = item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice'
      const timeLeft: string = item.listingInfo?.[0]?.timeLeft?.[0] ?? ''
      const img: string = item.pictureURLSuperSize?.[0] ?? item.galleryURL?.[0] ?? ''
      const viewUrl: string = item.viewItemURL?.[0] ?? ''
      const itemId: string = item.itemId?.[0] ?? ''

      // Parse year/make/model from title
      const yearMatch = title.match(/\b(19|20)\d{2}\b/)
      const parsedYear = yearMatch ? parseInt(yearMatch[0]) : null

      return {
        id: `ebay_${itemId}`,
        source_name: 'eBay Motors',
        source_badge: '🏁',
        year: parsedYear,
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
        listing_type: listingType === 'Auction' ? 'auction' : 'buy_now',
        time_left: timeLeft,
        bid_count: item.sellingStatus?.[0]?.bidCount?.[0] ?? '0',
      }
    })
  } catch (err) {
    console.error('eBay fetch error:', err)
    return []
  }
}

// ─── Main handler ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mcKey = process.env.MARKETCHECK_API_KEY
  const ebayAppId = process.env.EBAY_APP_ID

  if (!mcKey && !ebayAppId) {
    return NextResponse.json({ error: 'No search API keys configured' }, { status: 400 })
  }

  const p: Record<string, string> = {}
  for (const [k, v] of searchParams.entries()) p[k] = v

  const mcParams: Record<string, string> = {}
  if (p.zip) { mcParams.zip = p.zip; mcParams.radius = p.radius || '100' }
  if (p.make) mcParams.make = p.make.toLowerCase()
  if (p.model) mcParams.model = p.model.toLowerCase()
  if (p.yearMin) mcParams.year_min = p.yearMin
  if (p.yearMax) mcParams.year_max = p.yearMax
  if (p.priceMax) mcParams.price_max = p.priceMax
  if (p.mileageMax) mcParams.miles_max = p.mileageMax
  if (p.priceMin) mcParams.price_min = p.priceMin
  if (p.transmission) mcParams.transmission = p.transmission.toLowerCase()
  if (p.drivetrain) mcParams.drivetrain = p.drivetrain.toLowerCase()
  if (p.condition === 'new') mcParams.car_type = 'new'
  else if (p.condition === 'cpo') mcParams.car_type = 'certified'
  else mcParams.car_type = 'used'
  if (p.sortBy === 'price-asc') { mcParams.sort_by = 'price'; mcParams.sort_order = 'asc' }
  else if (p.sortBy === 'price-desc') { mcParams.sort_by = 'price'; mcParams.sort_order = 'desc' }
  else if (p.sortBy === 'mileage-asc') { mcParams.sort_by = 'miles'; mcParams.sort_order = 'asc' }

  // Fetch from both sources in parallel
  const [mcListings, ebayListings] = await Promise.all([
    mcKey ? fetchMarketcheck(mcParams, mcKey) : Promise.resolve([]),
    ebayAppId ? fetchEbay(p, ebayAppId) : Promise.resolve([]),
  ])

  // Merge and apply year filter client-side
  const all = [...mcListings, ...ebayListings].filter((l: any) => {
    if (p.yearMin && l.year && l.year < parseInt(p.yearMin)) return false
    if (p.yearMax && l.year && l.year > parseInt(p.yearMax)) return false
    return true
  })

  // Sort merged results
  if (p.sortBy === 'price-asc') all.sort((a: any, b: any) => (a.price ?? 999999) - (b.price ?? 999999))
  else if (p.sortBy === 'price-desc') all.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0))

  return NextResponse.json({ listings: all, total: all.length, sources: { marketcheck: mcListings.length, ebay: ebayListings.length } })
}
