import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY

  const make        = searchParams.get('make')        || ''
  const model       = searchParams.get('model')       || ''
  const yearMin     = searchParams.get('yearMin')     ? parseInt(searchParams.get('yearMin')!)     : null
  const yearMax     = searchParams.get('yearMax')     ? parseInt(searchParams.get('yearMax')!)     : null
  const priceMin    = searchParams.get('priceMin')    ? parseInt(searchParams.get('priceMin')!)    : null
  const priceMax    = searchParams.get('priceMax')    ? parseInt(searchParams.get('priceMax')!)    : null
  const mileageMax  = searchParams.get('mileageMax')  ? parseInt(searchParams.get('mileageMax')!)  : null
  const zip         = (searchParams.get('zip') || '').replace(/[^0-9]/g, '')
  const radius      = searchParams.get('radius')      ? parseInt(searchParams.get('radius')!)      : 250
  const transmission = searchParams.get('transmission') || ''
  const drivetrain  = searchParams.get('drivetrain')  || ''
  const condition   = searchParams.get('condition')   || ''
  const sortBy      = searchParams.get('sortBy')      || 'price-asc'
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const PAGE_SIZE   = 50

  // Geocode user ZIP → lat/lon using zippopotam.us (free, no key)
  let userLat: number | null = null
  let userLon: number | null = null
  let locationMode = zip ? 'zip_invalid' : 'nationwide'

  if (zip) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        userLat = parseFloat(geoData.places[0].latitude)
        userLon = parseFloat(geoData.places[0].longitude)
        locationMode = 'local'
        console.log(`[GEO] zip=${zip} lat=${userLat} lon=${userLon}`)
      } else {
        console.log(`[GEO] zip=${zip} not found (${geoRes.status})`)
      }
    } catch (err) {
      console.error('[GEO] geocode error:', err)
    }
  }

  // Fetch 500 listings from Marketcheck — ONLY make and model as filters
  const urls: string[] = []
  for (let i = 0; i < 5; i++) {
    let u = `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=100&start=${i * 100}`
    if (make)  u += `&make=${encodeURIComponent(make)}`
    if (model) u += `&model=${encodeURIComponent(model)}`
    urls.push(u)
  }

  console.log(`[MC] fetching 5 batches — make="${make}" model="${model}"`)
  const settled = await Promise.allSettled(
    urls.map(u => fetch(u, { cache: 'no-store' }).then(r => r.json()))
  )

  const numFound: number = settled[0].status === 'fulfilled' ? (settled[0].value?.num_found ?? 0) : 0
  const allRaw: any[] = settled.flatMap(r => r.status === 'fulfilled' ? (r.value?.listings ?? []) : [])
  console.log(`[MC] raw=${allRaw.length} numFound=${numFound}`)

  console.log('[DEBUG-GEO]', JSON.stringify({ zip, lat: userLat, lon: userLon }))

  // Map to clean objects
  const mapped = allRaw.map((l: any) => {
    const dLat = l.dealer?.latitude  ?? l.dealer?.lat  ?? null
    const dLon = l.dealer?.longitude ?? l.dealer?.lon  ?? l.dealer?.lng ?? null
    const distance = (userLat !== null && userLon !== null && dLat !== null && dLon !== null)
      ? Math.round(haversine(userLat, userLon, parseFloat(dLat), parseFloat(dLon)))
      : null
    return {
      id:             l.id,
      year:           l.build?.year           ?? null,
      make:           l.build?.make           ?? null,
      model:          l.build?.model          ?? null,
      trim:           l.build?.trim           ?? null,
      price:          l.price                 ?? null,
      miles:          l.miles                 ?? null,
      exterior_color: l.exterior_color        ?? null,
      transmission:   l.build?.transmission   ?? null,
      drivetrain:     l.build?.drivetrain     ?? null,
      car_type:       l.car_type              ?? null,
      photo:          l.media?.photo_links?.[0] || null,
      dealer_name:    l.dealer?.name          ?? null,
      dealer_city:    l.dealer?.city          ?? null,
      dealer_state:   l.dealer?.state         ?? null,
      dealer_phone:   l.dealer?.phone         ?? null,
      listing_url:    l.vdp_url               ?? null,
      dom:            l.dom                   ?? null,
      price_drop:     (l.price_change ?? 0) < 0,
      distance,
    }
  })

  if (mapped.length > 0) {
    const first = mapped[0]
    console.log('[DEBUG-FIRST]', JSON.stringify({
      year: first.year,
      make: first.make,
      dealer_lat: (allRaw[0]?.dealer?.latitude ?? allRaw[0]?.dealer?.lat ?? null),
      dealer_lon: (allRaw[0]?.dealer?.longitude ?? allRaw[0]?.dealer?.lon ?? allRaw[0]?.dealer?.lng ?? null),
      distance: first.distance,
    }))
  }

  // Apply filters stage by stage for diagnostics
  console.log('[DEBUG-FILTER] total mapped:', mapped.length)

  const afterYear = mapped.filter((l: any) => {
    if (yearMin !== null && l.year !== null && l.year < yearMin) return false
    if (yearMax !== null && l.year !== null && l.year > yearMax) return false
    return true
  })
  console.log('[DEBUG-FILTER] after year filter:', afterYear.length)

  const afterDistance = afterYear.filter((l: any) => {
    if (userLat !== null && l.distance !== null && l.distance > radius) return false
    return true
  })
  console.log('[DEBUG-FILTER] after distance filter:', afterDistance.length)

  const afterPrice = afterDistance.filter((l: any) => {
    if (priceMin !== null && l.price !== null && l.price < priceMin) return false
    if (priceMax !== null && l.price !== null && l.price > priceMax) return false
    return true
  })
  console.log('[DEBUG-FILTER] after price filter:', afterPrice.length)

  const filtered = afterPrice.filter((l: any) => {
    if (mileageMax !== null && l.miles !== null && l.miles > mileageMax) return false
    if (transmission && l.transmission && !l.transmission.toLowerCase().startsWith(transmission.toLowerCase())) return false
    if (drivetrain   && l.drivetrain   && !l.drivetrain.toLowerCase().startsWith(drivetrain.toLowerCase()))   return false
    if (condition && l.car_type) {
      const target = condition === 'cpo' ? 'certified' : condition
      if (l.car_type.toLowerCase() !== target) return false
    }
    return true
  })

  // Sort
  if (sortBy === 'price-asc')    filtered.sort((a: any, b: any) => (a.price ?? 999999) - (b.price ?? 999999))
  if (sortBy === 'price-desc')   filtered.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0))
  if (sortBy === 'mileage-asc')  filtered.sort((a: any, b: any) => (a.miles ?? 999999) - (b.miles ?? 999999))
  if (sortBy === 'distance-asc') filtered.sort((a: any, b: any) => (a.distance ?? 999999) - (b.distance ?? 999999))

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageListings = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  console.log(`[FILTER] raw=${allRaw.length} filtered=${totalFiltered} page=${safePage}/${totalPages} returning=${pageListings.length}`)

  return NextResponse.json({
    listings: pageListings,
    total: numFound,
    totalFiltered,
    page: safePage,
    totalPages,
    locationMode,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  })
}
