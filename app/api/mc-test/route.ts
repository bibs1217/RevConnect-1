import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sp     = new URL(request.url).searchParams
  const mcKey  = process.env.MARKETCHECK_API_KEY || ''
  const ebayId = process.env.EBAY_APP_ID         || ''
  const make   = sp.get('make')   || 'ford'
  const model  = sp.get('model')  || 'mustang'

  // ── Marketcheck test ──────────────────────────────────────────────────────
  const mcUrl = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${mcKey}&rows=3&start=0&make=${make}&model=${model}`
  const mcResult = await fetch(mcUrl, { cache: 'no-store' })
    .then(async r => {
      const text = await r.text()
      const data = (() => { try { return JSON.parse(text) } catch { return null } })()
      return { status: r.status, num_found: data?.num_found ?? 'N/A', listings: data?.listings?.length ?? 0, raw: text.slice(0, 200) }
    })
    .catch(e => ({ status: 'EXCEPTION', error: String(e) }))

  // ── eBay test ─────────────────────────────────────────────────────────────
  const ebayUrl = new URLSearchParams({
    'OPERATION-NAME':                 'findItemsAdvanced',
    'SERVICE-VERSION':                '1.13.0',
    'SECURITY-APPNAME':               ebayId,
    'RESPONSE-DATA-FORMAT':           'JSON',
    'categoryId':                     '6001',
    'keywords':                       `${make} ${model}`,
    'paginationInput.entriesPerPage': '5',
    'sortOrder':                      'PricePlusShippingLowest',
  })
  const ebayResult = await fetch(`https://svcs.ebay.com/services/search/FindingService/v1?${ebayUrl}`, {
    headers: { Accept: 'application/json' }, cache: 'no-store'
  })
    .then(async r => {
      const data = await r.json()
      const ack   = data.findItemsAdvancedResponse?.[0]?.ack?.[0]
      const total = data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0]
      const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item?.length ?? 0
      const err   = data.findItemsAdvancedResponse?.[0]?.errorMessage?.[0]?.error?.[0]?.message?.[0]
      return { status: r.status, ack, totalEntries: total, itemsReturned: items, error: err }
    })
    .catch(e => ({ status: 'EXCEPTION', error: String(e) }))

  return NextResponse.json({
    env: {
      MARKETCHECK_API_KEY: mcKey  ? `SET (${mcKey.slice(0,6)}...)` : 'MISSING',
      EBAY_APP_ID:         ebayId ? `SET (${ebayId.slice(0,6)}...)` : 'MISSING',
    },
    marketcheck: mcResult,
    ebay:        ebayResult,
  })
}
