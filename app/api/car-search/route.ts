import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = process.env.MARKETCHECK_API_KEY

  const make        = searchParams.get('make')        || ''
  const model       = searchParams.get('model')       || ''
  const yearMin     = parseInt(searchParams.get('yearMin')     || '0')
  const yearMax     = parseInt(searchParams.get('yearMax')     || '9999')
  const priceMin    = parseInt(searchParams.get('priceMin')    || '0')
  const priceMax    = parseInt(searchParams.get('priceMax')    || '999999999')
  const mileageMax  = parseInt(searchParams.get('mileageMax')  || '999999999')
  const zip         = searchParams.get('zip')         || ''
  const radius      = parseInt(searchParams.get('radius')      || '999999')
  const transmission = searchParams.get('transmission') || ''
  const drivetrain  = searchParams.get('drivetrain')  || ''
  const condition   = searchParams.get('condition')   || ''
  const page        = parseInt(searchParams.get('page')        || '1')
  const sortBy      = searchParams.get('sortBy')      || 'price-asc'

  // Geocode ZIP if provided
  let userLat = 0
  let userLon = 0
  if (zip) {
    try {
      const geo = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'no-store' })
      const geoData = await geo.json()
      userLat = parseFloat(geoData.places[0].latitude)
      userLon = parseFloat(geoData.places[0].longitude)
    } catch (e) {
      console.log('[GEO] failed to geocode zip:', zip)
    }
  }

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  // Fetch 500 listings from Marketcheck - only send make and model
  const allListings: any[] = []
  const batchSize = 100
  const batches = 5

  await Promise.all(
    Array.from({ length: batches }, (_, i) =>
      fetch(
        `https://mc-api.marketcheck.com/v2/search/car/active?api_key=${key}&rows=${batchSize}&start=${i * batchSize}${make ? `&make=${encodeURIComponent(make)}` : ''}${model ? `&model=${encodeURIComponent(model)}` : ''}`,
        { cache: 'no-store' }
      )
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.listings)) allListings.push(...d.listings) })
        .catch(() => {})
    )
  )

  console.log('[MC] total fetched:', allListings.length)

  // Filter and map
  const filtered = allListings
    .filter((l: any) => {
      const year  = Number(l.build?.year  || 0)
      const price = Number(l.price        || 0)
      const miles = Number(l.miles        || 0)
      const dlat  = parseFloat(l.dealer?.latitude  || '0')
      const dlon  = parseFloat(l.dealer?.longitude || '0')

      if (yearMin    > 0       && year  > 0 && year  < yearMin)    return false
      if (yearMax    < 9999    && year  > 0 && year  > yearMax)    return false
      if (priceMin   > 0       && price > 0 && price < priceMin)   return false
      if (priceMax   < 999999999 && price > 0 && price > priceMax) return false
      if (mileageMax < 999999999 && miles > 0 && miles > mileageMax) return false
      if (transmission && l.build?.transmission && !l.build.transmission.toLowerCase().includes(transmission.toLowerCase())) return false
      if (drivetrain   && l.build?.drivetrain   && !l.build.drivetrain.toLowerCase().includes(drivetrain.toLowerCase()))   return false
      if (condition === 'new'  && l.inventory_type !== 'new')       return false
      if (condition === 'used' && l.inventory_type !== 'used')      return false
      if (condition === 'cpo'  && l.inventory_type !== 'certified') return false
      if (zip && userLat && userLon && dlat && dlon) {
        const dist = haversine(userLat, userLon, dlat, dlon)
        if (dist > radius) return false
      }
      return true
    })
    .map((l: any) => ({
      id:             l.id,
      year:           Number(l.build?.year  || 0),
      make:           l.build?.make  || '',
      model:          l.build?.model || '',
      trim:           l.build?.trim  || '',
      price:          Number(l.price || 0),
      miles:          Number(l.miles || 0),
      exterior_color: l.exterior_color     || '',
      transmission:   l.build?.transmission || '',
      drivetrain:     l.build?.drivetrain   || '',
      photo:          l.media?.photo_links?.[0] || null,
      dealer_name:    l.dealer?.name  || '',
      dealer_city:    l.dealer?.city  || '',
      dealer_state:   l.dealer?.state || '',
      dealer_phone:   l.dealer?.phone || '',
      dealer_lat:     parseFloat(l.dealer?.latitude  || '0'),
      dealer_lon:     parseFloat(l.dealer?.longitude || '0'),
      distance:       (zip && userLat && userLon)
        ? Math.round(haversine(userLat, userLon, parseFloat(l.dealer?.latitude || '0'), parseFloat(l.dealer?.longitude || '0')))
        : null,
      listing_url:    l.vdp_url || '',
      dom:            Number(l.dom || 0),
      price_drop:     Number(l.price_change || 0) < 0,
      inventory_type: l.inventory_type || '',
    }))

  // Sort
  if      (sortBy === 'price-desc')    filtered.sort((a, b) => b.price - a.price)
  else if (sortBy === 'mileage-asc')   filtered.sort((a, b) => a.miles - b.miles)
  else if (sortBy === 'distance-asc')  filtered.sort((a, b) => (a.distance || 9999) - (b.distance || 9999))
  else                                 filtered.sort((a, b) => a.price - b.price)

  console.log('[MC] filtered:', filtered.length, 'of', allListings.length)

  // Paginate
  const perPage    = 50
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  return NextResponse.json({
    listings:   paginated,
    total:      filtered.length,
    totalFiltered: filtered.length,
    totalPages,
    page,
    locationMode: zip && userLat ? 'local' : 'nationwide',
  })
}
