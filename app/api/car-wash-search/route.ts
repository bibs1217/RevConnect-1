import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* ── chain locator links ─────────────────────────────────────────────────── */
function buildChainLinks(city: string, state: string, zip: string) {
  const cityEnc  = encodeURIComponent(city)
  const stateEnc = encodeURIComponent(state)
  const z        = zip || ''

  return [
    { name:'Mister Car Wash',  emoji:'🔵', desc:'Largest car wash chain in the US — touchless & soft options',             safe: true,  url: `https://mistercarwash.com/locations/?location=${z || cityEnc}` },
    { name:"Tommy's Express",  emoji:'🟡', desc:'Conveyor tunnel — unlimited monthly memberships',                         safe: false, url: `https://tommysexpress.com/locations/?zip=${z}` },
    { name:'Zips Car Wash',    emoji:'⚡', desc:'Drive-through tunnel — monthly unlimited plans',                          safe: false, url: `https://www.zipscarwash.com/locations/?zip=${z}` },
    { name:'Tidal Wave Auto',  emoji:'🌊', desc:'Touchless & soft-touch tunnels, spot-free rinse',                         safe: true,  url: `https://tidalwaveauto.com/locations/` },
    { name:'Autobell',         emoji:'🔔', desc:'Soft-touch tunnel with full-service interior options (Southeast US)',     safe: false, url: `https://www.autobell.com/locations/` },
    { name:'DetailXPerts',     emoji:'✨', desc:'Eco-friendly detail shops — ceramic & PPF safe',                          safe: true,  url: `https://www.detailxperts.net/locations/` },
    { name:'Google Maps',      emoji:'📍', desc:'Search all car washes near you on Google Maps',                           safe: null,  url: `https://www.google.com/maps/search/car+wash+near+${cityEnc}+${stateEnc}` },
    { name:'Yelp',             emoji:'⭐', desc:'Read community reviews for local washes and detailers',                   safe: null,  url: `https://www.yelp.com/search?find_desc=car+wash&find_loc=${cityEnc}+${stateEnc}` },
  ]
}

/* ── google places ───────────────────────────────────────────────────────── */
async function getGooglePlaces(city: string, state: string, lat?: number, lng?: number) {
  const key = process.env.GOOGLE_API_KEY
  if (!key) return []

  try {
    // Use nearby search if we have coords, text search otherwise
    const url = lat && lng
      ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=24140&type=car_wash&key=${key}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=car+wash+near+${encodeURIComponent(city + ' ' + state)}&key=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()

    return (data.results ?? []).slice(0, 12).map((p: any) => ({
      place_id:    p.place_id,
      name:        p.name,
      address:     p.formatted_address ?? p.vicinity ?? '',
      lat:         p.geometry?.location?.lat ?? null,
      lng:         p.geometry?.location?.lng ?? null,
      rating:      p.rating ?? null,
      review_count:p.user_ratings_total ?? 0,
      open_now:    p.opening_hours?.open_now ?? null,
      price_level: p.price_level ?? null,
      types:       p.types ?? [],
      source:      'google',
    }))
  } catch {
    return []
  }
}

/* ── anthropic ai — known car washes ────────────────────────────────────── */
async function getAIWashes(city: string, state: string, washType: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const typeCtx = washType === 'all' ? 'all car wash types including tunnel washes, hand washes, self-serve bays, mobile detailers, and full detail shops' : washType.replace(/_/g, ' ') + ' locations'

  const prompt = `List real, known car washes near ${city}, ${state}. Include ${typeCtx}.

Include major chain locations (Mister Car Wash, Tommy's Express, Zips, Tidal Wave, Autobell) AND well-known local detail shops or hand wash operations in the area.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

[{
  "name": "business name",
  "address": "street address",
  "city": "city",
  "state": "FL",
  "zip": "zip code or empty string",
  "phone": "phone number or null",
  "wash_type": "tunnel_touchless|tunnel_soft|tunnel_hybrid|self_service|hand_wash|mobile_detailer|full_detail|waterless|rinseless",
  "is_ceramic_safe": true or false,
  "is_ppf_safe": true or false,
  "is_touchless": true or false,
  "has_membership": true or false,
  "price_range": "$|$$|$$$|$$$$",
  "rating": number or null,
  "website": "url or null",
  "description": "1-2 sentences"
}]

Rules:
- tunnel_soft and tunnel_hybrid are NOT ceramic or PPF safe (is_ceramic_safe: false, is_ppf_safe: false)
- tunnel_touchless CAN be ceramic safe but not always — use your knowledge
- hand_wash, mobile_detailer, full_detail, waterless, rinseless are typically safe for ceramic and PPF
- Only include locations you are confident exist or have existed
- Return 8-14 results`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return []
    const data  = await res.json()
    const text  = data.content?.[0]?.text ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

/* ── handler ─────────────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  const sp       = new URL(request.url).searchParams
  const city     = sp.get('city')?.trim()  ?? ''
  const state    = sp.get('state')?.trim() ?? ''
  const zip      = sp.get('zip')?.trim()   ?? ''
  const washType = sp.get('type')          ?? 'all'
  const lat      = sp.get('lat')  ? parseFloat(sp.get('lat')!)  : undefined
  const lng      = sp.get('lng')  ? parseFloat(sp.get('lng')!)  : undefined

  if (!city || !state) {
    return NextResponse.json({ error: 'city and state are required' }, { status: 400 })
  }

  const [googleResults, aiWashes] = await Promise.all([
    getGooglePlaces(city, state, lat, lng),
    getAIWashes(city, state, washType),
  ])

  return NextResponse.json({
    city, state, zip, washType,
    aiWashes,
    googleResults,
    chainLinks:       buildChainLinks(city, state, zip),
    googleAvailable:  !!process.env.GOOGLE_API_KEY,
    anthropicEnabled: !!process.env.ANTHROPIC_API_KEY,
  })
}
