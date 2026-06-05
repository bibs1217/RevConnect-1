import { NextRequest, NextResponse } from 'next/server'

// ── Marketcheck Salvage (Copart + IAAI) ──────────────────────
async function fetchMarketcheckAuctions(
  query: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string,
  zip: string, radius: string, apiKey: string
) {
  const p = new URLSearchParams({ api_key: apiKey, rows: '40', start: '0' })
  if (make)    p.set('make', make)
  if (model)   p.set('model', model)
  if (yearMin) p.set('year_min', yearMin)
  if (yearMax) p.set('year_max', yearMax)
  if (priceMax) p.set('price_max', priceMax)
  if (zip)     { p.set('zip', zip); p.set('radius', radius || '150') }

  // If a free-text query was entered, append it as a keyword filter
  if (query.trim()) p.set('q', query.trim())

  const url = `https://mc-api.marketcheck.com/v2/search/car/salvage?${p}`
  console.log('[MC-salvage] GET', url.replace(apiKey, 'KEY'))

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[MC-salvage] ${res.status}:`, body.slice(0, 300))
      return []
    }

    const data = await res.json()
    const items: any[] = data.listings ?? []
    console.log(`[MC-salvage] num_found=${data.num_found ?? '?'}, returned=${items.length}`)

    return items.map((l: any) => {
      const auctionSource: string = (l.auction_source ?? l.dealer?.name ?? 'Copart').toLowerCase()
      const isIAAI = auctionSource.includes('iaa') || auctionSource.includes('insurance')
      return {
        id: `mc_${l.id}`,
        title: [l.build?.year, l.build?.make, l.build?.model, l.build?.trim].filter(Boolean).join(' '),
        source: isIAAI ? 'IAAI' : 'Copart',
        source_badge: isIAAI ? '⚡' : '🔩',
        source_color: isIAAI ? '#F4A261' : '#3399FF',
        year: l.build?.year ?? null,
        make: l.build?.make ?? null,
        model: l.build?.model ?? null,
        trim: l.build?.trim ?? null,
        vin: l.vin ?? null,
        lot_number: l.lot_number ?? l.lot ?? null,
        condition_grade: l.condition_grade ?? l.cr_score ?? null,
        primary_damage: l.primary_damage ?? l.damage_description ?? null,
        secondary_damage: l.secondary_damage ?? null,
        odometer_status: l.odometer_status ?? null,
        price: l.price ?? null,
        buy_now_price: l.buy_now_price ?? l.buy_it_now_price ?? null,
        auction_date: l.auction_date ?? l.sale_date ?? null,
        mileage: l.miles ?? null,
        color: l.build?.ext_color ?? null,
        location: l.dealer?.city ? `${l.dealer.city}, ${l.dealer.state}` : (l.location ?? ''),
        distance: l.dist ? Math.round(l.dist) : null,
        images: l.media?.photo_links?.slice(0, 8) ?? [],
        listing_url: l.vdp_url ?? null,
        keys: l.keys ?? null,
        fuel_type: l.build?.fuel_type ?? null,
        drivetrain: l.build?.drivetrain ?? null,
        cylinders: l.build?.cylinders ?? null,
      }
    })
  } catch (err) {
    console.error('[MC-salvage] exception:', err)
    return []
  }
}

// ── eBay Motors — Auctions only ──────────────────────────────
async function fetchEbayAuctions(
  query: string, make: string, model: string,
  yearMin: string, yearMax: string, priceMax: string, appId: string
) {
  const keywords = [make, model, query].filter(Boolean).join(' ') || 'car'

  const p = new URLSearchParams({
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'categoryId': '6001',
    'keywords': keywords,
    'paginationInput.entriesPerPage': '20',
    'sortOrder': 'EndTimeSoonest',
    'outputSelector(0)': 'PictureURLLarge',
    'outputSelector(1)': 'SellerInfo',
  })

  // Filter to Auction listings only
  let fi = 0
  p.set(`itemFilter(${fi}).name`, 'ListingType')
  p.set(`itemFilter(${fi}).value`, 'Auction')
  fi++

  if (priceMax) {
    p.set(`itemFilter(${fi}).name`, 'MaxPrice')
    p.set(`itemFilter(${fi}).value`, priceMax)
    fi++
  }

  console.log(`[eBay-auction] keywords="${keywords}"`)

  try {
    const res = await fetch(
      `https://svcs.ebay.com/services/search/FindingService/v1?${p}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 120 } }
    )
    if (!res.ok) {
      console.error(`[eBay-auction] ${res.status}`)
      return []
    }
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const total = data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0'
    console.log(`[eBay-auction] totalFound=${total}, returned=${items.length}`)

    return items.map((item: any) => {
      const title: string = item.title?.[0] ?? ''
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
      const endTime: string = item.listingInfo?.[0]?.endTime?.[0] ?? ''
      const img: string = item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? ''
      const yearMatch = title.match(/\b(19|20)\d{2}\b/)

      return {
        id: `ebay_${item.itemId?.[0] ?? ''}`,
        title,
        source: 'eBay Motors',
        source_badge: '🏁',
        source_color: '#E43137',
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        make: make || null,
        model: model || null,
        trim: null,
        vin: null,
        lot_number: null,
        condition_grade: null,
        primary_damage: item.condition?.[0]?.conditionDisplayName?.[0] ?? null,
        secondary_damage: null,
        odometer_status: null,
        price: price || null,
        buy_now_price: null,
        auction_date: endTime,
        mileage: null,
        color: null,
        location: item.location?.[0] ?? '',
        distance: null,
        images: img ? [img] : [],
        listing_url: item.viewItemURL?.[0] ?? null,
        keys: null,
        fuel_type: null,
        drivetrain: null,
        cylinders: null,
        bid_count: item.sellingStatus?.[0]?.bidCount?.[0] ?? '0',
      }
    })
  } catch (err) {
    console.error('[eBay-auction] exception:', err)
    return []
  }
}

// ── Main handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query   = searchParams.get('query')   ?? ''
  const make    = searchParams.get('make')    ?? ''
  const model   = searchParams.get('model')   ?? ''
  const yearMin = searchParams.get('yearMin') ?? ''
  const yearMax = searchParams.get('yearMax') ?? ''
  const priceMax = searchParams.get('priceMax') ?? ''
  const zip     = searchParams.get('zip')     ?? ''
  const radius  = searchParams.get('radius')  ?? '150'

  const mcKey  = process.env.MARKETCHECK_API_KEY
  const ebayId = process.env.EBAY_APP_ID

  console.log(`[auction-search] mcKey=${mcKey ? 'SET' : 'MISSING'}, ebayId=${ebayId ? 'SET' : 'MISSING'}`)

  if (!mcKey && !ebayId) {
    return NextResponse.json({ error: 'No API keys configured.', listings: [], total: 0, sources: {} })
  }

  const [mcListings, ebayListings] = await Promise.all([
    mcKey  ? fetchMarketcheckAuctions(query, make, model, yearMin, yearMax, priceMax, zip, radius, mcKey) : Promise.resolve([]),
    ebayId ? fetchEbayAuctions(query, make, model, yearMin, yearMax, priceMax, ebayId) : Promise.resolve([]),
  ])

  const all = [...mcListings, ...ebayListings]
  console.log(`[auction-search] MC=${mcListings.length}, eBay=${ebayListings.length}, total=${all.length}`)

  return NextResponse.json({
    listings: all,
    total: all.length,
    sources: { marketcheck: mcListings.length, ebay: ebayListings.length },
  })
}
