import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''
  const zip = searchParams.get('zip') || ''
  const washType = searchParams.get('wash_type') || 'any'

  const typeLabel = {
    mobile_detailer: 'mobile car detailers and mobile detailing services',
    hand_wash: 'hand car wash businesses',
    tunnel_soft: 'automatic tunnel car washes',
    tunnel_touchless: 'touchless automatic car washes',
    self_serve: 'self serve coin operated car washes',
    full_detail: 'auto detailing shops and full service detail centers',
  }[washType] || 'car washes and auto detailing businesses'

  const prompt = `List 20 ${typeLabel} in and around ${city}, ${state} ${zip}.

For each business return these exact fields:
- name: the real business name
- address: street address
- city: city name
- state: state abbreviation
- phone: phone number with area code
- website: website URL if known or empty string
- rating: estimated rating out of 5
- price_range: $ or $$ or $$$
- description: one sentence about the business

Return ONLY a valid JSON array. No explanation text before or after. No markdown. Just the raw JSON array starting with [ and ending with ].

These must be real businesses that actually exist or realistic businesses typical of the ${city} ${state} area. Include both well known chains and local independent businesses.`

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text || '[]'

    let businesses = []
    try {
      const clean = text.replace(/```json/g,'').replace(/```/g,'').trim()
      businesses = JSON.parse(clean)
    } catch(e) {
      businesses = []
    }

    return NextResponse.json({ businesses, total: businesses.length })
  } catch(e) {
    return NextResponse.json({ businesses: [], total: 0, error: 'Search failed' })
  }
}
