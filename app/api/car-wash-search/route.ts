import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* ── type-specific search config ────────────────────────────────────────── */
interface TypeConfig {
  googleQuery:  (city: string, state: string) => string
  aiSearchTerms: string
  aiPromptIntro: string
  aiOverrides:   string   // forced field values for JSON schema
  countTarget:   string
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  mobile_detailer: {
    googleQuery:   (city, state) => `mobile car detailing near ${city} ${state}`,
    aiSearchTerms: 'mobile car detailer OR mobile detailing OR detail on wheels OR mobile auto detailing',
    aiPromptIntro: 'List ONLY mobile car detailers and mobile detailing businesses — businesses that come TO the customer\'s location.',
    aiOverrides:   '"wash_type": "mobile_detailer", "is_ceramic_safe": true, "is_ppf_safe": true, "is_touchless": true',
    countTarget:   '15-20',
  },
  hand_wash: {
    googleQuery:   (city, state) => `hand car wash near ${city} ${state}`,
    aiSearchTerms: 'hand wash car wash OR hand car wash OR hand wash detailing',
    aiPromptIntro: 'List ONLY hand-wash car wash businesses where staff hand-wash vehicles by hand (not tunnel machines).',
    aiOverrides:   '"wash_type": "hand_wash", "is_ceramic_safe": true, "is_ppf_safe": true, "is_touchless": true',
    countTarget:   '15-20',
  },
  tunnel_touchless: {
    googleQuery:   (city, state) => `touchless car wash near ${city} ${state}`,
    aiSearchTerms: 'touchless car wash OR touchless automatic car wash OR no-touch car wash',
    aiPromptIntro: 'List touchless tunnel car washes — no brushes, water pressure and soap only.',
    aiOverrides:   '"wash_type": "tunnel_touchless", "is_touchless": true',
    countTarget:   '15-20',
  },
  tunnel_soft: {
    googleQuery:   (city, state) => `automatic car wash near ${city} ${state}`,
    aiSearchTerms: 'soft touch car wash OR automatic car wash OR tunnel car wash',
    aiPromptIntro: 'List soft-touch or brush tunnel car washes (conveyor or drive-through automatic washes).',
    aiOverrides:   '"wash_type": "tunnel_soft", "is_ceramic_safe": false, "is_ppf_safe": false, "is_touchless": false',
    countTarget:   '15-20',
  },
  tunnel_hybrid: {
    googleQuery:   (city, state) => `car wash near ${city} ${state}`,
    aiSearchTerms: 'hybrid car wash OR soft touch touchless car wash',
    aiPromptIntro: 'List hybrid tunnel car washes that offer both touchless and soft-touch options.',
    aiOverrides:   '"wash_type": "tunnel_hybrid"',
    countTarget:   '15-20',
  },
  self_service: {
    googleQuery:   (city, state) => `self serve car wash near ${city} ${state}`,
    aiSearchTerms: 'self serve car wash OR coin operated car wash OR DIY car wash',
    aiPromptIntro: 'List ONLY self-serve or coin-operated car wash bays where customers wash their own vehicles.',
    aiOverrides:   '"wash_type": "self_service", "is_ceramic_safe": true, "is_ppf_safe": true, "has_membership": false',
    countTarget:   '15-20',
  },
  full_detail: {
    googleQuery:   (city, state) => `auto detailing near ${city} ${state}`,
    aiSearchTerms: 'auto detailing shop OR full detail car wash OR professional car detailing',
    aiPromptIntro: 'List full-service auto detailing shops that offer interior and exterior detailing packages.',
    aiOverrides:   '"wash_type": "full_detail", "is_ceramic_safe": true, "is_ppf_safe": true, "is_touchless": true',
    countTarget:   '15-20',
  },
  waterless: {
    googleQuery:   (city, state) => `waterless car wash near ${city} ${state}`,
    aiSearchTerms: 'waterless car wash OR eco car wash OR no water car wash',
    aiPromptIntro: 'List waterless car wash services and eco-friendly no-water detailing businesses.',
    aiOverrides:   '"wash_type": "waterless", "is_ceramic_safe": true, "is_ppf_safe": true, "is_touchless": true',
    countTarget:   '15-20',
  },
  rinseless: {
    googleQuery:   (city, state) => `rinseless car wash near ${city} ${state}`,
    aiSearchTerms: 'rinseless car wash OR ONR car wash',
    aiPromptIntro: 'List rinseless car wash services and detailers who specialize in rinseless wash methods.',
    aiOverrides:   '"wash_type": "rinseless", "is_ceramic_safe": true, "is_ppf_safe": true, "is_touchless": true',
    countTarget:   '15-20',
  },
  all: {
    googleQuery:   (city, state) => `car wash near ${city} ${state}`,
    aiSearchTerms: 'car wash OR auto detailing OR mobile detailing',
    aiPromptIntro: 'List a mix of car washes including tunnel washes, hand washes, mobile detailers, and detail shops.',
    aiOverrides:   '',
    countTarget:   '15-20',
  },
}

/* ── chain / platform links (type-aware) ────────────────────────────────── */
function buildChainLinks(city: string, state: string, zip: string, washType: string) {
  const cityEnc  = encodeURIComponent(city)
  const stateEnc = encodeURIComponent(state)
  const z        = zip || ''

  const alwaysLinks = [
    { name:'Google Maps',     emoji:'📍', desc:'Search near you on Google Maps', safe: null, url: `https://www.google.com/maps/search/${encodeURIComponent((TYPE_CONFIG[washType]?.googleQuery(city, state) ?? 'car wash near ' + city + ' ' + state))}` },
    { name:'Yelp',            emoji:'⭐', desc:'Read community reviews',          safe: null, url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(washType === 'mobile_detailer' ? 'mobile detailing' : washType === 'full_detail' ? 'auto detailing' : 'car wash')}&find_loc=${cityEnc}+${stateEnc}` },
  ]

  if (washType === 'mobile_detailer' || washType === 'full_detail') {
    return [
      { name:'Thumbtack',       emoji:'🔨', desc:'Find local mobile detailers with reviews and instant quotes', safe: true, url: `https://www.thumbtack.com/k/mobile-car-detailing/near-me/?zip=${z}` },
      { name:'TaskRabbit',      emoji:'🐰', desc:'Book verified mobile detailers near you',                   safe: true, url: `https://www.taskrabbit.com/services/auto-detailing?zip=${z}` },
      { name:'Angi',            emoji:'🔧', desc:'Compare quotes from local auto detailers',                  safe: true, url: `https://www.angi.com/companylist/auto-detailing.htm?zip=${z}` },
      { name:'DetailXPerts',    emoji:'✨', desc:'Eco-friendly detail shops — ceramic & PPF safe',            safe: true, url: `https://www.detailxperts.net/locations/` },
      ...alwaysLinks,
    ]
  }

  if (washType === 'self_service') {
    return [
      { name:'WhichCarWash',    emoji:'🪣', desc:'Find self-serve bays near you',                             safe: null, url: `https://www.google.com/maps/search/self+serve+car+wash+near+${cityEnc}+${stateEnc}` },
      ...alwaysLinks,
    ]
  }

  /* default — tunnel/all types */
  return [
    { name:'Mister Car Wash',  emoji:'🔵', desc:'Largest US chain — touchless & soft options',              safe: true,  url: `https://mistercarwash.com/locations/?location=${z || cityEnc}` },
    { name:"Tommy's Express",  emoji:'🟡', desc:'Conveyor tunnel — unlimited monthly memberships',          safe: false, url: `https://tommysexpress.com/locations/?zip=${z}` },
    { name:'Zips Car Wash',    emoji:'⚡', desc:'Drive-through tunnel — unlimited monthly plans',           safe: false, url: `https://www.zipscarwash.com/locations/?zip=${z}` },
    { name:'Tidal Wave Auto',  emoji:'🌊', desc:'Touchless & soft-touch tunnels, spot-free rinse',          safe: true,  url: `https://tidalwaveauto.com/locations/` },
    { name:'Autobell',         emoji:'🔔', desc:'Soft-touch tunnel with full-service interior (SE US)',     safe: false, url: `https://www.autobell.com/locations/` },
    { name:'DetailXPerts',     emoji:'✨', desc:'Eco-friendly detail shops — ceramic & PPF safe',           safe: true,  url: `https://www.detailxperts.net/locations/` },
    ...alwaysLinks,
  ]
}

/* ── google places ───────────────────────────────────────────────────────── */
async function getGooglePlaces(city: string, state: string, washType: string, lat?: number, lng?: number) {
  const key = process.env.GOOGLE_API_KEY
  if (!key) return []

  const cfg   = TYPE_CONFIG[washType] ?? TYPE_CONFIG.all
  const query = cfg.googleQuery(city, state)

  try {
    const url = lat && lng
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=40000&key=${key}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()

    return (data.results ?? []).slice(0, 15).map((p: any) => ({
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

/* ── platform name blocklist ─────────────────────────────────────────────── */
const PLATFORM_BLOCKLIST = [
  'yelp','google','thumbtack','taskrabbit','angi','facebook','instagram',
  'homeadvisor','houzz','amazon','groupon','doordash','platform','website',
  'app','directory','search','finder','near me','near you','results',
]

function isRealBusiness(name: string): boolean {
  const lower = name.toLowerCase()
  return !PLATFORM_BLOCKLIST.some(word => lower.includes(word))
}

/* ── anthropic ai ────────────────────────────────────────────────────────── */
async function getAIWashes(city: string, state: string, washType: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const cfg = TYPE_CONFIG[washType] ?? TYPE_CONFIG.all

  const overrideNote = cfg.aiOverrides
    ? `\nIMPORTANT: For every result in this search, always set these fields: ${cfg.aiOverrides}.`
    : ''

  const prompt = `${cfg.aiPromptIntro}

Search focus: "${cfg.aiSearchTerms}" near ${city}, ${state}.

CRITICAL NAMING RULE: Return ONLY real actual business names that operate in ${city}, ${state}. Do NOT return platform names like Yelp, Google, Thumbtack, TaskRabbit, Angi, Facebook, Instagram, HomeAdvisor, or any other app or directory. Return the actual name of the detailing company or car wash itself — for example: "Squeaky Clean Mobile Detailing", "Pro Shine Auto Spa", "Tampa Bay Detail Co", "Crystal Clear Auto Detailing".

Include a mix of franchise detailers like Ziebart, DetailXPerts, Shine Squad, and Tidal Wave AND independent local businesses with realistic local business names. Every single result must be an actual detailing business or car wash, not a platform, directory, or aggregator.${overrideNote}

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

[{
  "name": "ACTUAL business name (not a platform)",
  "address": "street address",
  "city": "city",
  "state": "${state}",
  "zip": "zip code or empty string",
  "phone": "phone number or null",
  "wash_type": "tunnel_touchless|tunnel_soft|tunnel_hybrid|self_service|hand_wash|mobile_detailer|full_detail|waterless|rinseless",
  "is_ceramic_safe": true or false,
  "is_ppf_safe": true or false,
  "is_touchless": true or false,
  "has_membership": true or false,
  "price_range": "$|$$|$$$|$$$$",
  "rating": number between 1-5 or null,
  "website": "url or null",
  "description": "1-2 sentences describing the business"
}]

General safety rules (apply unless overridden above):
- tunnel_soft and tunnel_hybrid: set is_ceramic_safe: false, is_ppf_safe: false, is_touchless: false
- tunnel_touchless: is_touchless: true, is_ceramic_safe varies by brand
- hand_wash, mobile_detailer, full_detail, waterless, rinseless: is_ceramic_safe: true, is_ppf_safe: true, is_touchless: true
- Only include businesses that actually operate in or near ${city}, ${state}
- Return ${cfg.countTarget} results`

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
        max_tokens: 4000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return []
    const data    = await res.json()
    const text    = data.content?.[0]?.text ?? ''
    const match   = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed: any[] = JSON.parse(match[0])
    return parsed.filter(w => w?.name && isRealBusiness(w.name))
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
    getGooglePlaces(city, state, washType, lat, lng),
    getAIWashes(city, state, washType),
  ])

  return NextResponse.json({
    city, state, zip, washType,
    aiWashes,
    googleResults,
    chainLinks:       buildChainLinks(city, state, zip, washType),
    googleAvailable:  !!process.env.GOOGLE_API_KEY,
    anthropicEnabled: !!process.env.ANTHROPIC_API_KEY,
  })
}
