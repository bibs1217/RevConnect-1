import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') ?? ''
  const make = searchParams.get('make') ?? ''
  const model = searchParams.get('model') ?? ''
  const yearMin = searchParams.get('yearMin') ?? ''
  const yearMax = searchParams.get('yearMax') ?? ''
  const priceMax = searchParams.get('priceMax') ?? ''
  const condition = searchParams.get('condition') ?? ''
  const appId = process.env.EBAY_APP_ID

  if (!appId) {
    return NextResponse.json({ error:'Add EBAY_APP_ID to Vercel environment variables to enable live eBay Motors auction listings.', listings:[], total:0 })
  }

  const keywords = [yearMin && yearMax && yearMin===yearMax ? yearMin:'', make, model, query].filter(Boolean).join(' ') || 'car'
  const p = new URLSearchParams({
    'OPERATION-NAME':'findItemsAdvanced',
    'SERVICE-VERSION':'1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT':'JSON',
    'categoryId':'6001',
    'keywords': keywords,
    'paginationInput.entriesPerPage':'20',
    'sortOrder':'EndTimeSoonest',
    'outputSelector(0)':'PictureURLLarge',
    'outputSelector(1)':'SellerInfo',
  })
  if (priceMax) { p.set('itemFilter(0).name','MaxPrice'); p.set('itemFilter(0).value', priceMax) }
  if (condition === 'new') { p.set('itemFilter(1).name','Condition'); p.set('itemFilter(1).value','1000') }
  if (yearMin) { p.set('itemFilter(2).name','MinYear'); p.set('itemFilter(2).value', yearMin) }

  try {
    const res = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${p}`, {
      headers: { Accept:'application/json' }, next: { revalidate: 120 }
    })
    if (!res.ok) return NextResponse.json({ error:`eBay error: ${res.status}`, listings:[], total:0 })
    const data = await res.json()
    const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item ?? []
    const total = parseInt(data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0')
    const listings = items.map((item: any) => ({
      id: `ebay_${item.itemId?.[0]}`,
      title: item.title?.[0] ?? '',
      price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0'),
      bid_count: item.sellingStatus?.[0]?.bidCount?.[0] ?? '0',
      listing_type: item.listingInfo?.[0]?.listingType?.[0] ?? 'Auction',
      end_time: item.listingInfo?.[0]?.endTime?.[0] ?? '',
      img: item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? '',
      url: item.viewItemURL?.[0] ?? '',
      location: item.location?.[0] ?? '',
      condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? '',
      seller: item.sellerInfo?.[0]?.sellerUserName?.[0] ?? '',
      source: 'eBay Motors',
    }))
    return NextResponse.json({ listings, total })
  } catch (err) {
    return NextResponse.json({ error: String(err), listings:[], total:0 })
  }
}
