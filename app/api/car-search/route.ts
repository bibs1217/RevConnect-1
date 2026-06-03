import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const apiKey = process.env.MARKETCHECK_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Marketcheck API key not configured' }, { status: 400 })
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    rows: '24',
    start: '0',
    seller_type: 'dealer',
  })

  const zip = searchParams.get('zip')
  const radius = searchParams.get('radius') || '100'
  const make = searchParams.get('make')
  const model = searchParams.get('model')
  const yearMin = searchParams.get('yearMin')
  const yearMax = searchParams.get('yearMax')
  const priceMax = searchParams.get('priceMax')
  const mileageMax = searchParams.get('mileageMax')
  const condition = searchParams.get('condition') || 'used'
  const sortBy = searchParams.get('sortBy') || 'price_asc'

  if (zip) { params.set('zip', zip); params.set('radius', radius) }
  if (make) params.set('make', make.toLowerCase())
  if (model) params.set('model', model.toLowerCase())

  // Year filters — Marketcheck uses year_min / year_max
  if (yearMin) params.set('year_min', yearMin)
  if (yearMax) params.set('year_max', yearMax)

  // Price and mileage
  if (priceMax && !isNaN(parseInt(priceMax))) params.set('price_max', priceMax)
  if (mileageMax && !isNaN(parseInt(mileageMax))) params.set('miles_max', mileageMax)

  // Condition
  if (condition === 'new') params.set('car_type', 'new')
  else if (condition === 'cpo') params.set('car_type', 'certified')
  else params.set('car_type', 'used')

  // Sort
  if (sortBy === 'price-asc') { params.set('sort_by', 'price'); params.set('sort_order', 'asc') }
  else if (sortBy === 'price-desc') { params.set('sort_by', 'price'); params.set('sort_order', 'desc') }
  else if (sortBy === 'mileage-asc') { params.set('sort_by', 'miles'); params.set('sort_order', 'asc') }

  console.log('Marketcheck query:', params.toString())

  try {
    const res = await fetch(`https://mc-api.marketcheck.com/v2/search/car/active?${params}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Marketcheck error: ${res.status}`, detail: err }, { status: res.status })
    }

    const data = await res.json()

    const listings = (data.listings ?? []).map((l: any) => ({
      id: l.id,
      year: l.build?.year,
      make: l.build?.make,
      model: l.build?.model,
      trim: l.build?.trim,
      price: l.price,
      mileage: l.miles,
      vin: l.vin,
      source: l.dealer?.name ?? 'Dealer',
      location: l.dealer?.city ? `${l.dealer.city}, ${l.dealer.state}` : '',
      distance: l.dist ? Math.round(l.dist) : null,
      images: l.media?.photo_links?.slice(0, 5) ?? [],
      exterior_color: l.build?.ext_color,
      transmission: l.build?.transmission,
      drivetrain: l.build?.drivetrain,
      engine: l.build?.engine,
      mpg_city: l.build?.city_mpg,
      mpg_hwy: l.build?.highway_mpg,
      is_certified: l.car_type === 'certified',
      dealer_name: l.dealer?.name,
      dealer_phone: l.dealer?.phone,
      listing_url: l.vdp_url,
      days_on_market: l.dom,
      price_drop: l.price_change < 0,
      price_change: l.price_change,
    }))

    // Client-side year enforcement as safety net in case API doesn't filter perfectly
    const filtered = listings.filter((l: any) => {
      if (yearMin && l.year && l.year < parseInt(yearMin)) return false
      if (yearMax && l.year && l.year > parseInt(yearMax)) return false
      return true
    })

    return NextResponse.json({ listings: filtered, total: data.num_found ?? filtered.length })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch listings', detail: String(err) }, { status: 500 })
  }
}
