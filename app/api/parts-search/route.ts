import { NextRequest, NextResponse } from 'next/server'

// ── Marketcheck Parts ────────────────────────────────────────
async function fetchMarketcheck(
  query: string, year: string, make: string, model: string, apiKey: string
) {
  const keyword = [year, make, model, query].filter(Boolean).join(' ')
  const p = new URLSearchParams({
    api_key: apiKey,
    q: keyword,
    rows: '20',
    start: '0',
  })
  if (year)  p.set('year', year)
  if (make)  p.set('make', make.toLowerCase())
  if (model) p.set('model', model.toLowerCase())

  try {
    const res = await fetch(`https://mc-api.marketcheck.com/v2/parts/search?${p}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 180 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const items: any[] = data.parts ?? data.listings ?? data.items ?? []
    return items.map((item: any, i: number) => {
      const price = item.price ? parseFloat(String(item.price)) : null
      const shipping = item.shipping ? parseFloat(String(item.shipping)) : 0
      return {
        id: `mc_${item.id ?? item.part_id ?? i}`,
        title: item.name ?? item.title ?? item.part_name ?? keyword,
        price,
        shipping,
        total_price: price ? price + shipping : 0,
        free_shipping: shipping === 0,
        condition: item.condition ?? 'New',
        image: item.image ?? item.photo_url ?? item.image_url ?? '',
        url: item.url ?? item.listing_url ?? item.vdp_url ?? '',
        seller: item.seller ?? item.brand ?? item.dealer?.name ?? 'Marketcheck Parts',
        seller_feedback_score: 0,
        seller_feedback_pct: '100',
        location: item.location ?? '',
        listing_type: 'FixedPrice',
        is_auction: false,
        time_left: '',
        source: 'Marketcheck',
        source_badge: '🏪',
        part_number: item.part_number ?? item.oem_part_no ?? item.mpn ?? null,
        brand: item.brand ?? null,
      }
    })
  } catch { return [] }
}

// ── eBay Motors ──────────────────────────────────────────────
async function fetchEbay(
  query: string, year: string, make: string, model: string,
  priceMax: string, condition: string, sortBy: string, appId: string
) {
  const keywords = [year, make, model, query].filter(Boolean).join(' ')

  const p = new URLSearchParams({
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'categoryId': '6028',
    'keywords': keywords,
    'paginationInput.entriesPerPage': '24',
    'sortOrder': sortBy === 'price-desc' ? 'PricePlusShippingHighest' : 'PricePlusShippingLowest',
    'outputSelector(0)': 'PictureURLLarge',
    'outputSelector(1)': 'SellerInfo',
  })

  let filterIdx = 0
  if (condition === 'new_oem' || condition === 'new_aftermarket') {
    p.set(`itemFilter(${filterIdx}).name`, 'Condition')
    p.set(`itemFilter(${filterIdx}).value`, '1000')
    filterIdx++
  } else if (condition === 'used') {
    p.set(`itemFilter(${filterIdx}).name`, 'Condition')
    p.set(`itemFilter(${filterIdx}).value`, '3000')
    filterIdx++
  } else if (condition === 'remanufactured') {
    p.set(`itemFilter(${filterIdx}).name`, 'Condition')
    p.set(`itemFilter(${filterIdx}).value`, '2500')
    filterIdx++
  }
  if (priceMax) {
    p.set(`itemFilter(${filterIdx}).name`, 'MaxPrice')
    p.set(`itemFilter(${filterIdx}).value`, priceMax)
  }

  try {
    const res = await fetch(
      `https://svcs.ebay.com/services/search/FindingService/v1?${p}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 180 } }
    )
    if (!res.ok) return { items: [], total: 0 }
    const data = await res.json()
    const items: any[] = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const total = parseInt(data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0')

    return {
      total,
      items: items.map((item: any) => {
        const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
        const shippingCost = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.['__value__'] ?? '0')
        const freeShipping = item.shippingInfo?.[0]?.shippingType?.[0] === 'Free'
        const shipping = freeShipping ? 0 : shippingCost
        const listingType = item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice'
        return {
          id: `ebay_${item.itemId?.[0] ?? Math.random()}`,
          title: item.title?.[0] ?? '',
          price: price || null,
          shipping,
          total_price: price + shipping,
          free_shipping: freeShipping,
          condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? 'Unknown',
          image: item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? '',
          url: item.viewItemURL?.[0] ?? '',
          seller: item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller',
          seller_feedback_score: parseInt(item.sellerInfo?.[0]?.feedbackScore?.[0] ?? '0'),
          seller_feedback_pct: item.sellerInfo?.[0]?.positiveFeedbackPercent?.[0] ?? '0',
          location: item.location?.[0] ?? '',
          listing_type: listingType,
          is_auction: listingType === 'Auction',
          time_left: item.listingInfo?.[0]?.timeLeft?.[0] ?? '',
          source: 'eBay Motors',
          source_badge: '🏁',
          part_number: null,
          brand: null,
        }
      }),
    }
  } catch { return { items: [], total: 0 } }
}

// ── Price stats across all listings ─────────────────────────
function computeStats(listings: any[]) {
  const prices = listings
    .map(l => l.total_price)
    .filter(p => typeof p === 'number' && p > 0)
    .sort((a, b) => a - b)
  if (!prices.length) return null
  const sum = prices.reduce((s, p) => s + p, 0)
  return {
    min: prices[0],
    max: prices[prices.length - 1],
    avg: Math.round((sum / prices.length) * 100) / 100,
    median: prices[Math.floor(prices.length / 2)],
    count: prices.length,
  }
}

// ── Main handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query     = searchParams.get('query') ?? ''
  const make      = searchParams.get('make') ?? ''
  const model     = searchParams.get('model') ?? ''
  const year      = searchParams.get('year') ?? ''
  const priceMax  = searchParams.get('priceMax') ?? ''
  const condition = searchParams.get('condition') ?? ''
  const sortBy    = searchParams.get('sortBy') ?? 'price-asc'

  const ebayId = process.env.EBAY_APP_ID
  const mcKey  = process.env.MARKETCHECK_API_KEY

  if (!ebayId && !mcKey) {
    return NextResponse.json({ error: 'No parts search API keys configured.', listings: [], total: 0 })
  }
  if (!query.trim()) {
    return NextResponse.json({ listings: [], total: 0, stats: null, sources: {} })
  }

  const [ebayResult, mcListings] = await Promise.all([
    ebayId ? fetchEbay(query, year, make, model, priceMax, condition, sortBy, ebayId) : Promise.resolve({ items: [], total: 0 }),
    mcKey  ? fetchMarketcheck(query, year, make, model, mcKey) : Promise.resolve([]),
  ])

  const all = [...ebayResult.items, ...mcListings]

  // Sort merged list
  if (sortBy === 'price-asc')  all.sort((a, b) => (a.total_price || 999999) - (b.total_price || 999999))
  if (sortBy === 'price-desc') all.sort((a, b) => (b.total_price || 0) - (a.total_price || 0))

  const stats = computeStats(all)
  const sources = {
    ebay:       ebayResult.items.length,
    marketcheck: mcListings.length,
  }

  return NextResponse.json({
    listings: all,
    total: ebayResult.total + mcListings.length,
    stats,
    sources,
  })
}
