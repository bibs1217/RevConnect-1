import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams

  const year       = sp.get('year')       || ''
  const make       = sp.get('make')       || ''
  const model      = sp.get('model')      || ''
  const mileage    = sp.get('mileage')    || '5000'
  const use        = sp.get('use')        || 'pleasure'
  const ownership  = sp.get('ownership')  || 'owned'
  const modsValue  = sp.get('mods_value') || '0'
  const zip        = sp.get('zip')        || ''
  const age        = sp.get('age')        || '35'
  const experience = sp.get('experience') || '10'
  const accidents  = sp.get('accidents')  || 'false'
  const tickets    = sp.get('tickets')    || 'false'
  const credit     = sp.get('credit')     || 'good'
  const coverage   = sp.get('coverage')   || 'full_coverage'

  const hasMods     = parseInt(modsValue) > 500
  const isCollector = use === 'show' || use === 'collector'
  const isTrack     = use === 'track'
  const hasAccident = accidents === 'true'
  const hasTicket   = tickets === 'true'

  const USE_LABELS: Record<string,string> = {
    daily:     'Daily driver (high exposure)',
    pleasure:  'Pleasure / weekend use',
    show:      'Show car only (very low mileage)',
    track:     'Track / performance use',
    collector: 'Collector / stored (minimal road use)',
  }

  const COVERAGE_LABELS: Record<string,string> = {
    liability:     'Liability only',
    full_coverage: 'Full coverage (comp + collision)',
    agreed_value:  'Agreed value (collector / enthusiast)',
    classic_car:   'Classic car specialty',
    modified:      'Modified vehicle specialty',
    track_day:     'Track day / racing coverage',
  }

  let carrierPool: string
  if (isTrack || coverage === 'track_day') {
    carrierPool = 'K&K Insurance, Hagerty, Heacock Classic, Grundy, National General, Progressive, Travelers, State Farm'
  } else if (isCollector || coverage === 'agreed_value' || coverage === 'classic_car' || hasMods || coverage === 'modified') {
    carrierPool = 'Hagerty, Grundy, American Collectors, Heacock Classic, JC Taylor, Condon Skelly, National General, Progressive, Geico, State Farm'
  } else {
    carrierPool = 'Progressive, Geico, State Farm, Allstate, Nationwide, Travelers, Erie Insurance, Liberty Mutual, Farmers, Root Insurance'
  }

  const prompt = `You are an insurance pricing expert. Generate realistic auto insurance quotes for this profile:

VEHICLE: ${year} ${make} ${model}
Annual mileage: ${mileage} miles
Primary use: ${USE_LABELS[use] || use}
Ownership: ${ownership === 'owned' ? 'Owned outright' : 'Financed / Leased'}
Aftermarket modifications value: $${modsValue}

DRIVER: ZIP ${zip}, Age ${age}, ${experience} years driving experience
Accidents last 3 years: ${hasAccident ? 'YES — raises rates 25-40%' : 'None'}
Tickets last 3 years: ${hasTicket ? 'YES — raises rates 15-25%' : 'None'}
Credit score range: ${credit}

COVERAGE REQUESTED: ${COVERAGE_LABELS[coverage] || coverage}

Generate realistic monthly quotes from: ${carrierPool}

Apply these rules:
- Standard carriers base: $100-$180/mo. Enthusiast/Collector: $55-$120/mo. Specialty: $80-$140/mo.
- Accidents: +25-40% to premium
- Tickets: +15-25% to premium
- Poor credit: +25-35%. Fair: +10-15%. Excellent: -5-10%
- Mods under $2k: standard carriers +10%, enthusiast covers included
- Mods $2k-$10k: standard +20% and may exclude, enthusiast +10%
- Mods over $10k: standard carriers cannot adequately cover; enthusiast specialists only
- Show/collector: specialty carriers give 30-50% discount vs standard
- Track use: only specialty carriers cover; +20-40% vs base
- Daily + high mileage (>12k): +15-20%
- Financed/leased: requires full coverage

Return ONLY a valid JSON array. No markdown. No explanation. Just the raw array:
[
  {
    "name": "carrier name",
    "logo": "single emoji",
    "type": "Enthusiast or Collector or Standard or Military or Specialty or Online",
    "monthly": integer monthly premium,
    "annual": integer annual premium,
    "coverage": "coverage type description",
    "agreed_value": true or false,
    "mods_covered": true or false,
    "track_day": true or false,
    "am_best": "A++ or A+ or A or A- or B+",
    "website": "https://full-url",
    "phone": "phone number",
    "notes": "one sentence explaining why this carrier is good or poor for this specific profile",
    "recommended": true or false
  }
]

Return 8-10 carriers. Mark 1-2 as recommended:true that best match the profile needs.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ carriers: [], total: 0, error: `AI API error ${res.status}: ${err.slice(0, 200)}` })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || '[]'

    let carriers: any[] = []
    try {
      const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()
      const match = clean.match(/\[[\s\S]*\]/)
      if (match) carriers = JSON.parse(match[0])
    } catch {
      carriers = []
    }

    carriers.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return (a.monthly || 0) - (b.monthly || 0)
    })

    return NextResponse.json({ carriers, total: carriers.length })
  } catch (e: any) {
    return NextResponse.json({ carriers: [], total: 0, error: e?.message || 'Search failed' })
  }
}
