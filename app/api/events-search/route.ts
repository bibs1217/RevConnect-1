import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* ── platform links ─────────────────────────────────────────────────────── */
function buildPlatformLinks(city: string, state: string, type: string) {
  const citySlug  = city.toLowerCase().replace(/\s+/g, '-')
  const stateSlug = state.toLowerCase()
  const cityEnc   = encodeURIComponent(city)
  const q = type === 'all'
    ? 'car meet car show automotive'
    : type.replace(/_/g, ' ')

  return [
    {
      name: 'Eventbrite',
      emoji: '🎟️',
      desc: 'Largest event ticketing platform',
      url: `https://www.eventbrite.com/d/${stateSlug}--${citySlug}/car-meet--car-show--automotive/`,
    },
    {
      name: 'Meetup',
      emoji: '👥',
      desc: 'Local car clubs and casual meets',
      url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(q)}&location=${cityEnc}+${state}&radius=50`,
    },
    {
      name: 'Facebook Events',
      emoji: '📘',
      desc: 'Local community meets and shows',
      url: `https://www.facebook.com/events/search/?q=${encodeURIComponent('car meet ' + city + ' ' + state)}`,
    },
    {
      name: 'Cars & Coffee Finder',
      emoji: '☕',
      desc: 'Dedicated Cars & Coffee directory',
      url: `https://www.carsandcoffee.com/events/?location=${cityEnc}`,
    },
    {
      name: 'MotorsportReg',
      emoji: '🏁',
      desc: 'Track days, autocross, HPDE, time trials',
      url: `https://www.motorsportreg.com/events/${stateSlug}`,
    },
    {
      name: 'TrackDays.com',
      emoji: '🏎️',
      desc: 'Find open track days near you',
      url: `https://www.trackdays.com/find-track-days/`,
    },
    {
      name: 'SCCA Events',
      emoji: '🏆',
      desc: 'Autocross, time trials, road racing',
      url: `https://www.scca.com/events`,
    },
    {
      name: 'NASA Racing',
      emoji: '🚀',
      desc: 'HPDE, time trials, wheel-to-wheel',
      url: `https://nasaproracing.com/events/`,
    },
  ]
}

/* ── google custom search ───────────────────────────────────────────────── */
async function getGoogleResults(city: string, state: string, type: string) {
  const apiKey = process.env.GOOGLE_API_KEY
  const cseId  = process.env.GOOGLE_CSE_ID
  if (!apiKey || !cseId) return []

  const typeQ = type === 'all'
    ? 'car meet OR car show OR car cruise OR "track day" OR autocross'
    : type.replace(/_/g, ' ')
  const q = `${typeQ} ${city} ${state}`

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(q)}&num=10`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []).map((item: any) => ({
      title:   item.title,
      link:    item.link,
      snippet: item.snippet,
      source:  new URL(item.link).hostname.replace('www.', ''),
    }))
  } catch {
    return []
  }
}

/* ── eventbrite public endpoint ─────────────────────────────────────────── */
async function getEventbriteResults(city: string, state: string) {
  try {
    const url = `https://www.eventbrite.com/api/v3/destination/search/?q=car+meet&location.address=${encodeURIComponent(city + ' ' + state)}&location.within=50mi&expand=image,venue`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.events?.results ?? []).slice(0, 10).map((ev: any) => ({
      id:          ev.id,
      title:       ev.name?.text ?? ev.name ?? '',
      url:         ev.url ?? '',
      date:        ev.start?.local ?? '',
      venue:       ev.venue?.name ?? '',
      city:        ev.venue?.address?.city ?? city,
      state:       ev.venue?.address?.region ?? state,
      image:       ev.logo?.url ?? ev.image?.url ?? null,
      isFree:      ev.is_free ?? false,
    }))
  } catch {
    return []
  }
}

/* ── anthropic ai — known recurring events ──────────────────────────────── */
async function getAIEvents(city: string, state: string, type: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const typeCtx = type === 'all'
    ? 'car meets, Cars & Coffee events, car shows, track days, autocross events, cruise nights, drag events, and HPDE events'
    : type.replace(/_/g, ' ') + ' events'

  const prompt = `List real, known recurring automotive events near ${city}, ${state}. Include ${typeCtx}.

Focus on well-known recurring events within 100 miles — actual Cars & Coffee locations, SCCA chapter events, NASA region events, cruise nights, shows you know about.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

[{"name":"event name","schedule":"e.g. Every 1st Saturday 8-11am","location":"venue name or intersection","city":"city","state":"FL","type":"street_meet","website":"url or null","description":"1-2 sentences"}]

Return 8-12 events. Only include events you are confident actually exist. If unsure about that specific city, include events from the broader metro area or region.`

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
        max_tokens: 2000,
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

/* ── handler ────────────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  const sp    = new URL(request.url).searchParams
  const city  = sp.get('city')?.trim()  ?? ''
  const state = sp.get('state')?.trim() ?? ''
  const type  = sp.get('type')          ?? 'all'

  if (!city || !state) {
    return NextResponse.json({ error: 'city and state are required' }, { status: 400 })
  }

  const [googleResults, eventbriteResults, aiEvents] = await Promise.all([
    getGoogleResults(city, state, type),
    getEventbriteResults(city, state),
    getAIEvents(city, state, type),
  ])

  return NextResponse.json({
    city, state, type,
    aiEvents,
    eventbriteResults,
    googleResults,
    platformLinks:    buildPlatformLinks(city, state, type),
    googleAvailable:  !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID),
    anthropicEnabled: !!process.env.ANTHROPIC_API_KEY,
  })
}
