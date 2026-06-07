import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

interface EbayListing {
  id: string
  itemId: string
  title: string
  price: number
  location: string
  photo: string | null
  listing_url: string
  listing_type: string
  condition: string
  seller: string
  source: 'eBay'
}

async function fetchEbay(params: {
  appId: string; make: string; model: string
  yearMin: string; yearMax: string
  priceMin: string; priceMax: string
  zip: string; radius: string; page: number
}): Promise<{ listings: EbayListing[]; total: number; totalPages: number }> {
  const { appId, make, model, yearMin, yearMax, priceMin, priceMax, zip, radius, page } = params
  const empty = { listings: [], total: 0, totalPages: 0 }

  if (!appId) { console.warn('[eBay] EBAY_APP_ID not set'); return empty }
  if (!make)  { console.warn('[eBay] no make');              return empty }

  // Build URL manually — URLSearchParams percent-encodes ( ) which breaks
  // eBay's itemFilter(N).name and outputSelector(N) param name syntax
  const parts: string[] = [
    'OPERATION-NAME=findItemsAdvanced',
    'SERVICE-VERSION=1.0.0',
    `SECURITY-APPNAME=${encodeURIComponent(appId)}`,
    'RESPONSE-DATA-FORMAT=JSON',
    'categoryId=6001',
    `keywords=${encodeURIComponent(`${make} ${model}`.trim())}`,
    'paginationInput.entriesPerPage=50',
    `paginationInput.pageNumber=${page}`,
    'outputSelector(0)=PictureURLLarge',
    'outputSelector(1)=SellerInfo',
  ]

  let fi = 0
  if (yearMin) { parts.push(`itemFilter(${fi}).name=MinYear`,  `itemFilter(${fi}).value=${yearMin}`);  fi++ }
  if (yearMax) { parts.push(`itemFilter(${fi}).name=MaxYear`,  `itemFilter(${fi}).value=${yearMax}`);  fi++ }
  if (priceMin) {
    parts.push(
      `itemFilter(${fi}).name=MinPrice`, `itemFilter(${fi}).value=${priceMin}`,
      `itemFilter(${fi}).paramName=Currency`, `itemFilter(${fi}).paramValue=USD`,
    )
    fi++
  }
  if (priceMax) {
    parts.push(
      `itemFilter(${fi}).name=MaxPrice`, `itemFilter(${fi}).value=${priceMax}`,
      `itemFilter(${fi}).paramName=Currency`, `itemFilter(${fi}).paramValue=USD`,
    )
    fi++
  }
  if (zip) {
    parts.push(
      `buyerPostalCode=${zip}`,
      `itemFilter(${fi}).name=MaxDistance`, `itemFilter(${fi}).value=${radius || '250'}`,
    )
  }

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?${parts.join('&')}`
  console.log(`[eBay] GET page=${page} kw="${make} ${model}"`)

  try {
    const res  = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) { console.error('[eBay] HTTP', res.status, text.slice(0, 300)); return empty }

    let data: any
    try { data = JSON.parse(text) }
    catch { console.error('[eBay] bad JSON:', text.slice(0, 300)); return empty }

    const resp       = data.findItemsAdvancedResponse?.[0]
    const ack        = resp?.ack?.[0]
    const total      = parseInt(resp?.paginationOutput?.[0]?.totalEntries?.[0] ?? '0')
    const totalPages = parseInt(resp?.paginationOutput?.[0]?.totalPages?.[0]    ?? '1')
    const items: any[] = resp?.searchResult?.[0]?.item ?? []
    const errMsg     = resp?.errorMessage?.[0]?.error?.[0]?.message?.[0]
    console.log(`[eBay] ack=${ack} total=${total} pages=${totalPages} items=${items.length}${errMsg ? ` ERR:${errMsg}` : ''}`)

    const listings: EbayListing[] = items.map((item: any) => ({
      id:           `ebay_${item.itemId?.[0]}`,
      itemId:        item.itemId?.[0] ?? '',
      title:         item.title?.[0] ?? '',
      price:         parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0'),
      location:      item.location?.[0] ?? '',
      photo:         item.pictureURLLarge?.[0] ?? item.galleryURL?.[0] ?? null,
      listing_url:   item.viewItemURL?.[0] ?? '',
      listing_type:  item.listingInfo?.[0]?.listingType?.[0] ?? 'FixedPrice',
      condition:     item.condition?.[0]?.conditionDisplayName?.[0] ?? '',
      seller:        item.sellerInfo?.[0]?.sellerUserName?.[0] ?? '',
      source:        'eBay' as const,
    }))

    return { listings, total, totalPages: Math.max(1, totalPages) }
  } catch (e) {
    console.error('[eBay] exception', e)
    return empty
  }
}

export async function GET(request: Request) {
  const sp     = new URL(request.url).searchParams
  const ebayId = process.env.EBAY_APP_ID || ''

  console.log(`[car-search] ebayId=${ebayId ? 'SET' : 'MISSING'}`)

  const make     = sp.get('make')     || ''
  const model    = sp.get('model')    || ''
  const yearMin  = sp.get('yearMin')  || ''
  const yearMax  = sp.get('yearMax')  || ''
  const priceMin = sp.get('priceMin') || ''
  const priceMax = sp.get('priceMax') || ''
  const zip      = (sp.get('zip') || '').replace(/\D/g, '')
  const radius   = sp.get('radius')   || '250'
  const page     = Math.max(1, parseInt(sp.get('page') || '1'))

  const { listings, total, totalPages } = await fetchEbay({
    appId: ebayId, make, model, yearMin, yearMax,
    priceMin, priceMax, zip, radius, page,
  })

  // Strip $0 listings (auction items with no bids yet or missing price)
  const filtered = listings.filter(l => l.price > 0)

  return NextResponse.json({
    listings:       filtered,
    total,
    totalPages,
    page,
    ebayConfigured: !!ebayId,
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
