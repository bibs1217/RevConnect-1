import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') ?? ''
  const make = searchParams.get('make') ?? ''
  const model = searchParams.get('model') ?? ''
  const year = searchParams.get('year') ?? ''
  const priceMax = searchParams.get('priceMax') ?? ''
  const condition = searchParams.get('condition') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'price-asc'

  const appId = process.env.EBAY_APP_ID

  if (!appId) {
    return NextResponse.json({
      error: 'eBay App ID not configured. Add EBAY_APP_ID to Vercel environment variables at developer.ebay.com.',
      listings: [],
      total: 0,
    })
  }

  if (!query.trim()) {
    return NextResponse.json({ listings: [], total: 0 })
  }

  // Build keyword: combine query + vehicle info
  const keywords = [year, make, model, query].filter(Boolean).join(' ')

  const params = new URLSearchParams({
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'categoryId': '6028',  // eBay Motors: Parts & Accessories
    'keywords': keywords,
    'paginationInput.entriesPerPage': '24',
    'sortOrder': sortBy === 'price-desc' ? 'PricePlusShippingHighest' : 'PricePlusShippingLowest',
    'outputSelector(0)': 'PictureURLLarge',
    'outputSelector(1)': 'SellerInfo',
    'outputSelector(2)': 'UnitPriceInfo',
  })

  // Condition filter
  if (condition === 'new_oem' || condition === 'new_aftermarket') {
    params.set('itemFilter(0).name', 'Condition')
    params.set('itemFilter(0).value', '1000') // New
  } else if (condition === 'used') {
    params.set('itemFilter(0).name', 'Condition')
    params.set('itemFilter(0).value', '3000') // Used
  } else if (condition === 'remanufactured') {
    params.set('itemFilter(0).name', 'Condition')
    params.set('itemFilter(0).value', '2500') // Manufacturer refurbished
  }

  // Price filter
  if (priceMax) {
    const filterIdx = condition ? 1 : 0
    params.set(`itemFilter(${filterIdx}).name`, 'MaxPrice')
    params.set(`itemFilter(${filterIdx}).value`, priceMax)
  }

  try {
    const res = await fetch(
      `https://svcs.ebay.com/services/search/FindingService/v1?${params}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 180 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `eBay API error: ${res.status}`, listings: [], total: 0 })
    }

    const data = await res.json()
    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const totalItems = parseInt(data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0')

    const listings = items.map((item: any) => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0')
      const shipping = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.['__value__'] ?? '0')
      const conditionName = item.condition?.[0]?.conditionDisplayName?.[0] ?? 'Unknown'
      const img = item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? ''
      const viewUrl = item.viewItemURL?.[0] ?? ''
      const title = item.title?.[0] ?? ''
      const itemId = item.itemId?.[0] ?? ''
      const seller = item.sellerInfo?.[0]?.sellerUserName?.[0] ?? 'eBay Seller'
      const feedbackScore = parseInt(item.sellerInfo?.[0]?.feedbackScore?.[0] ?? '0')
      const feedbackPct = item.sellerInfo?.[0]?.positiveFeedbackPercent?.[0] ?? '0'
      const location = item.location?.[0] ?? ''
      const freeShipping = item.shippingInfo?.[0]?.shippingType?.[0] === 'Free'
      const listingType = item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice'
      const timeLeft = item.listingInfo?.[0]?.timeLeft?.[0] ?? ''

      return {
        id: `ebay_${itemId}`,
        title,
        price: price || null,
        shipping: freeShipping ? 0 : shipping,
        total_price: price + (freeShipping ? 0 : shipping),
        free_shipping: freeShipping,
        condition: conditionName,
        image: img,
        url: viewUrl,
        seller,
        seller_feedback_score: feedbackScore,
        seller_feedback_pct: feedbackPct,
        location,
        listing_type: listingType,
        is_auction: listingType === 'Auction',
        time_left: timeLeft,
        source: 'eBay Motors',
      }
    })

    return NextResponse.json({ listings, total: totalItems })
  } catch (err) {
    return NextResponse.json({ error: `Search failed: ${String(err)}`, listings: [], total: 0 })
  }
}
