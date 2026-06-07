import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// eBay Finding API (svcs.ebay.com) returned HTTP 503 — it has been shut down.
// This file uses the eBay Browse API (api.ebay.com) with OAuth2 client credentials.
// Required env vars: EBAY_APP_ID (Client ID) + EBAY_CERT_ID (Client Secret)

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

// Module-level token cache — lives for the lifetime of the serverless instance
let cachedToken: { value: string; expiresAt: number } | null = null

async function getEbayToken(appId: string, certId: string): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && now < cachedToken.expiresAt) return cachedToken.value

  // base64(appId:certId) — btoa is available in Node 16+ and edge runtimes
  const credentials = btoa(`${appId}:${certId}`)
  try {
    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok || !data.access_token) {
      console.error('[eBay token] error:', JSON.stringify(data).slice(0, 300))
      return null
    }
    cachedToken = {
      value:     data.access_token,
      expiresAt: now + (data.expires_in - 60) * 1000,
    }
    console.log('[eBay token] obtained, expires in', data.expires_in, 's')
    return cachedToken.value
  } catch (e) {
    console.error('[eBay token] exception:', e)
    return null
  }
}

async function fetchEbay(params: {
  appId: string; certId: string; make: string; model: string
  yearMin: string; yearMax: string
  priceMin: string; priceMax: string
  zip: string; radius: string; page: number
}): Promise<{ listings: EbayListing[]; total: number; totalPages: number }> {
  const { appId, certId, make, model, yearMin, yearMax, priceMin, priceMax, zip, radius, page } = params
  const PER_PAGE = 50
  const empty = { listings: [], total: 0, totalPages: 0 }

  if (!appId || !certId) { console.warn('[eBay] EBAY_APP_ID or EBAY_CERT_ID not set'); return empty }
  if (!make)             { console.warn('[eBay] no make');                              return empty }

  const token = await getEbayToken(appId, certId)
  if (!token) return empty

  const offset = (page - 1) * PER_PAGE
  const q = `${make} ${model}`.trim()

  // --- filter parameter (price, location) ---
  const filterParts: string[] = []
  if (priceMin && priceMax) filterParts.push(`price:[${priceMin}..${priceMax}],priceCurrency:USD`)
  else if (priceMin)        filterParts.push(`price:[${priceMin}..],priceCurrency:USD`)
  else if (priceMax)        filterParts.push(`price:[..${priceMax}],priceCurrency:USD`)
  if (zip) filterParts.push(`pickupPostalCode:${zip},pickupRadius:${radius || '250'},pickupRadiusUnit:MILE`)

  // --- aspect_filter for year (Motors category-specific) ---
  // Browse API uses aspect_filter with pipe-separated values for Motors Year aspect
  let aspectFilter = ''
  if (yearMin || yearMax) {
    const minY = parseInt(yearMin) || 1980
    const maxY = parseInt(yearMax) || new Date().getFullYear() + 1
    const years: string[] = []
    for (let y = minY; y <= maxY && years.length < 25; y++) years.push(String(y))
    if (years.length) aspectFilter = `categoryId:6001,Year:{${years.join('|')}}`
  }

  const sp = new URLSearchParams({
    q,
    category_ids: '6001',
    limit:  String(PER_PAGE),
    offset: String(offset),
  })
  if (filterParts.length) sp.set('filter', filterParts.join(','))
  if (aspectFilter)       sp.set('aspect_filter', aspectFilter)

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${sp}`
  console.log(`[eBay Browse] GET page=${page} q="${q}" filter="${filterParts.join(',')}"`)

  try {
    const res  = await fetch(url, {
      headers: {
        'Authorization':           `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type':            'application/json',
      },
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok) { console.error('[eBay Browse] HTTP', res.status, text.slice(0, 400)); return empty }

    let data: any
    try { data = JSON.parse(text) }
    catch { console.error('[eBay Browse] bad JSON:', text.slice(0, 300)); return empty }

    const total      = data.total ?? 0
    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PER_PAGE)) : 0
    const items: any[] = data.itemSummaries ?? []
    console.log(`[eBay Browse] total=${total} pages=${totalPages} items=${items.length}`)

    if (data.warnings?.length) {
      console.warn('[eBay Browse] warnings:', JSON.stringify(data.warnings).slice(0, 200))
    }

    const listings: EbayListing[] = items.map((item: any) => ({
      id:           `ebay_${item.itemId}`,
      itemId:        item.itemId ?? '',
      title:         item.title  ?? '',
      price:         parseFloat(item.price?.value ?? '0'),
      location:      [item.itemLocation?.city, item.itemLocation?.stateOrProvince]
                       .filter(Boolean).join(', '),
      photo:         item.image?.imageUrl ?? null,
      listing_url:   item.itemWebUrl ?? '',
      listing_type:  item.buyingOptions?.[0] ?? 'FIXED_PRICE',
      condition:     item.condition ?? '',
      seller:        item.seller?.username ?? '',
      source:        'eBay' as const,
    }))

    return { listings, total, totalPages }
  } catch (e) {
    console.error('[eBay Browse] exception', e)
    return empty
  }
}

export async function GET(request: Request) {
  const sp      = new URL(request.url).searchParams
  const ebayId  = process.env.EBAY_APP_ID  || ''
  const certId  = process.env.EBAY_CERT_ID || ''

  console.log(`[car-search] appId=${ebayId ? ebayId.slice(0,4)+'...' : 'MISSING'} certId=${certId ? certId.slice(0,4)+'...' : 'MISSING'}`)

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
    appId: ebayId, certId, make, model, yearMin, yearMax,
    priceMin, priceMax, zip, radius, page,
  })

  const filtered = listings.filter(l => l.price > 0)

  return NextResponse.json({
    listings:       filtered,
    total,
    totalPages,
    page,
    ebayConfigured: !!(ebayId && certId),
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
}
