import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams

  const make        = s.get('make')        ?? ''
  const model       = s.get('model')       ?? ''
  const yearMin     = s.get('yearMin')     ?? ''
  const yearMax     = s.get('yearMax')     ?? ''
  const priceMin    = s.get('priceMin')    ?? ''
  const priceMax    = s.get('priceMax')    ?? ''
  const milesMax    = s.get('mileageMax')  ?? ''
  const zip         = s.get('zip')         ?? ''
  const radius      = s.get('radius')      ?? ''
  const condition   = s.get('condition')   ?? ''
  const transmission = s.get('transmission') ?? ''
  const drivetrain  = s.get('drivetrain')  ?? ''
  const sortBy      = s.get('sortBy')      ?? ''

  const mcKey    = process.env.MARKETCHECK_API_KEY
  const ebayId   = process.env.EBAY_APP_ID

  console.log(`[car-search] mcKey=${mcKey ? `SET(${mcKey.slice(0,8)}…)` : 'MISSING'} ebay=${ebayId ? 'SET' : 'MISSING'}`)

  if (!mcKey) {
    return NextResponse.json({ error: 'MARKETCHECK_API_KEY not configured', listings: [], total: 0 }, { status: 500 })
  }

  // ── Build Marketcheck query ──────────────────────────────────
  const params = new URLSearchParams()
  params.set('api_key', mcKey)
  params.set('rows', '50')
  params.set('start', '0')

  if (make)         params.set('make', make)
  if (model)        params.set('model', model)
  if (yearMin)      params.set('year_min', yearMin)
  if (yearMax)      params.set('year_max', yearMax)
  if (priceMin)     params.set('price_min', priceMin)
  if (priceMax)     params.set('price_max', priceMax)
  if (milesMax)     params.set('miles_max', milesMax)
  if (zip) {
    params.set('zip', zip)
    if (radius) params.set('radius', radius)
  }
  if (transmission) params.set('transmission', transmission)
  if (drivetrain)   params.set('drivetrain', drivetrain)

  if (condition === 'new')       params.set('car_type', 'new')
  else if (condition === 'cpo')  params.set('car_type', 'certified')
  else if (condition === 'used') params.set('car_type', 'used')

  // NOTE: sort_by/sort_order are intentionally NOT sent to Marketcheck.
  // Sending sort_by without a make/zip filter causes MC to return num_found
  // but suppress the listings array. We sort the returned results locally below.

  const mcUrl = `https://mc-api.marketcheck.com/v2/search/car/active?${params.toString()}`
  console.log('[MC] URL:', mcUrl.replace(mcKey, 'KEY_HIDDEN'))

  // ── Fetch from Marketcheck ───────────────────────────────────
  let mcListings: any[] = []
  let mcTotal = 0

  try {
    const res = await fetch(mcUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    const text = await res.text()
    console.log(`[MC] status=${res.status} body_preview=${text.slice(0, 500)}`)

    if (!res.ok) {
      console.error(`[MC] Error ${res.status}:`, text.slice(0, 500))
    } else {
      const data = JSON.parse(text)
      console.log('[MC-RAW]', JSON.stringify(data).slice(0, 500))
      mcTotal = data.num_found ?? 0
      const topKeys = Object.keys(data).join(',')
      console.log(`[MC] num_found=${mcTotal}, top_keys=${topKeys}`)

      // Try every key Marketcheck has ever used for the listings array
      const rawCandidate =
        data.listings ?? data.listing ?? data.response ??
        data.results  ?? data.vehicles ?? data.data     ?? []
      // Guard: MC sometimes returns an object with numeric keys instead of a true array
      const raw: any[] = Array.isArray(rawCandidate)
        ? rawCandidate
        : Object.values(rawCandidate as Record<string, any>)
      console.log(`[MC] raw type=${Array.isArray(rawCandidate) ? 'array' : typeof rawCandidate}, length=${raw.length}`)

      mcListings = raw.map((l: any) => ({
        id:             `mc_${l.id}`,
        source_name:    'Dealer Inventory',
        source_badge:   '🏪',
        listing_type:   'buy_now',
        year:           l.build?.year           ?? null,
        make:           l.build?.make           ?? null,
        model:          l.build?.model          ?? null,
        trim:           l.build?.trim           ?? null,
        price:          l.price                 ?? null,
        mileage:        l.miles                 ?? null,
        exterior_color: l.exterior_color        ?? l.build?.ext_color ?? null,
        transmission:   l.build?.transmission   ?? null,
        drivetrain:     l.build?.drivetrain     ?? null,
        engine:         l.build?.engine         ?? null,
        mpg_city:       l.build?.city_mpg       ?? null,
        mpg_hwy:        l.build?.highway_mpg    ?? null,
        images:         Array.isArray(l.media?.photo_links) ? l.media.photo_links.slice(0, 8) : [],
        dealer_name:    l.dealer?.name          ?? null,
        dealer_phone:   l.dealer?.phone         ?? null,
        location:       l.dealer?.city ? `${l.dealer.city}, ${l.dealer.state}` : '',
        distance:       l.dist != null ? Math.round(l.dist) : null,
        vin:            l.vin                   ?? null,
        listing_url:    l.vdp_url               ?? null,
        days_on_market: l.dom                   ?? null,
        price_drop:     l.price_change != null ? l.price_change < 0 : false,
        deal_rating:    l.price_rating          ?? null,
        is_certified:   l.car_type === 'certified',
        time_left:      null,
        bid_count:      null,
      }))
    }
  } catch (err) {
    console.error('[MC] exception:', err)
  }

  // ── Optional eBay Motors ─────────────────────────────────────
  let ebayListings: any[] = []

  if (ebayId) {
    try {
      const keywords = [make, model].filter(Boolean).join(' ') || 'car'
      const ep = new URLSearchParams({
        'OPERATION-NAME':              'findItemsAdvanced',
        'SERVICE-VERSION':             '1.13.0',
        'SECURITY-APPNAME':            ebayId,
        'RESPONSE-DATA-FORMAT':        'JSON',
        'categoryId':                  '6001',
        'keywords':                    keywords,
        'paginationInput.entriesPerPage': '25',
        'sortOrder':                   sortBy === 'price-desc' ? 'PricePlusShippingHighest' : 'PricePlusShippingLowest',
        'outputSelector(0)':           'PictureURLSuperSize',
        'outputSelector(1)':           'SellerInfo',
      })

      let fi = 0
      if (priceMax)               { ep.set(`itemFilter(${fi}).name`, 'MaxPrice');    ep.set(`itemFilter(${fi}).value`, priceMax);  fi++ }
      if (condition === 'used')   { ep.set(`itemFilter(${fi}).name`, 'Condition');   ep.set(`itemFilter(${fi}).value`, '3000');    fi++ }
      else if (condition === 'new') { ep.set(`itemFilter(${fi}).name`, 'Condition'); ep.set(`itemFilter(${fi}).value`, '1000');    fi++ }

      const ebayRes = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${ep}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })

      if (ebayRes.ok) {
        const ed = await ebayRes.json()
        const ack = ed.findItemsAdvancedResponse?.[0]?.ack?.[0]
        const items: any[] = ed.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
        console.log(`[eBay] ack=${ack}, returned=${items.length}`)

        ebayListings = items.map((item: any) => {
          const title = item.title?.[0] ?? ''
          const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
          const listingType = item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice'
          const yearMatch = title.match(/\b(19|20)\d{2}\b/)
          return {
            id:             `ebay_${item.itemId?.[0] ?? ''}`,
            source_name:    'eBay Motors',
            source_badge:   '🏁',
            listing_type:   listingType === 'Auction' ? 'auction' : 'buy_now',
            year:           yearMatch ? parseInt(yearMatch[0]) : null,
            make:           make || null,
            model:          model || null,
            trim:           title,
            price:          price || null,
            mileage:        null,
            exterior_color: null,
            transmission:   null,
            drivetrain:     null,
            engine:         null,
            mpg_city:       null,
            mpg_hwy:        null,
            images:         [item.pictureURLSuperSize?.[0] ?? item.galleryURL?.[0] ?? ''].filter(Boolean),
            dealer_name:    item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
            dealer_phone:   null,
            location:       item.location?.[0] ?? '',
            distance:       null,
            vin:            null,
            listing_url:    item.viewItemURL?.[0] ?? null,
            days_on_market: null,
            price_drop:     false,
            deal_rating:    null,
            is_certified:   false,
            time_left:      item.listingInfo?.[0]?.timeLeft?.[0] ?? null,
            bid_count:      item.sellingStatus?.[0]?.bidCount?.[0] ?? '0',
          }
        })
      }
    } catch (err) {
      console.error('[eBay] exception:', err)
    }
  }

  // ── Merge, sort, return ──────────────────────────────────────
  let all = [...mcListings, ...ebayListings]

  // Post-filter by year range (eBay can't do this server-side)
  if (yearMin) all = all.filter(l => !l.year || l.year >= parseInt(yearMin))
  if (yearMax) all = all.filter(l => !l.year || l.year <= parseInt(yearMax))

  if (sortBy === 'price-asc')  all.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999))
  if (sortBy === 'price-desc') all.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))

  console.log(`[car-search] FINAL: mc=${mcListings.length} ebay=${ebayListings.length} total=${all.length} num_found=${mcTotal}`)

  return NextResponse.json({
    listings: all,
    total:    mcTotal || all.length,
    sources:  { marketcheck: mcListings.length, ebay: ebayListings.length },
    _debug:   { mc_listings_returned: mcListings.length, mc_total: mcTotal },
  })
}
