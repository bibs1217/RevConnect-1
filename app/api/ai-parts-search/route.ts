import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FALLBACK_PARTS = [
  { id: 'p-1', name: 'Brembo Front Brake Pad Set', brand: 'Brembo', price: 89.99, location: 'Warehouse, CA', seller: 'AutoZone Pro', condition: 'New', compatibility: 'Universal fit – check application guide', partNumber: 'P85075N', description: 'High-performance ceramic compound, low dust, OEM+ stopping power', url: 'https://www.autozone.com' },
  { id: 'p-2', name: 'K&N High-Flow Air Filter', brand: 'K&N', price: 64.99, location: 'Corona, CA', seller: 'K&N Direct', condition: 'New', compatibility: 'Multiple fitments available', partNumber: 'E-0665', description: 'Washable/reusable, up to 50% more airflow than stock, 1M mile warranty', url: 'https://www.amazon.com' },
  { id: 'p-3', name: 'Bosch ICON Windshield Wipers (Pair)', brand: 'Bosch', price: 42.95, location: 'Broadview, IL', seller: "O'Reilly Auto", condition: 'New', compatibility: 'Most vehicles 2010–2024', partNumber: '26A+18A', description: 'Bracketless beam design, OE replacement quality, all-weather performance', url: 'https://www.oreillyauto.com' },
  { id: 'p-4', name: 'Bilstein B6 Heavy Duty Shock Absorber', brand: 'Bilstein', price: 124.99, location: 'Collierville, TN', seller: 'Advance Auto Parts', condition: 'New', compatibility: 'Vehicle-specific – select your year/make/model', partNumber: '24-196527', description: 'Monotube design, OEM dampening improved, direct bolt-on replacement', url: 'https://shop.advanceautoparts.com' },
  { id: 'p-5', name: 'ACDelco GM OE Oil Filter', brand: 'ACDelco', price: 12.49, location: 'Flint, MI', seller: 'NAPA Auto Parts', condition: 'New', compatibility: 'GM vehicles – check fitment', partNumber: 'PF48E', description: 'OEM quality, cellulose/synthetic blend media, anti-drain back valve', url: 'https://www.napaonline.com' },
  { id: 'p-6', name: 'NGK Iridium IX Spark Plug (Set of 4)', brand: 'NGK', price: 58.99, location: 'Wixom, MI', seller: 'RockAuto', condition: 'New', compatibility: 'Engine-specific – verify fitment before purchasing', partNumber: 'IZFR6K11', description: 'Fine-wire iridium center electrode, longer life, improved ignitability', url: 'https://www.rockauto.com' },
  { id: 'p-7', name: 'DBA 4000 Series Slotted Rotors (Pair)', brand: 'DBA', price: 189.00, location: 'Redondo Beach, CA', seller: 'Summit Racing', condition: 'New', compatibility: 'Application specific – front or rear set', partNumber: 'DB4004S', description: 'T3 slotted, thermally stress-relieved, zinc-plated for corrosion resistance', url: 'https://www.summitracing.com' },
  { id: 'p-8', name: 'Flowmaster 40-Series Muffler', brand: 'Flowmaster', price: 79.99, location: 'Santa Rosa, CA', seller: 'JEGS', condition: 'New', compatibility: '2.5" inlet/outlet – universal', partNumber: '42441', description: 'Delta flow technology, aggressive sound, 16-gauge aluminized steel construction', url: 'https://www.jegs.com' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const year = searchParams.get('year') || ''
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const condition = searchParams.get('condition') || ''
  const priceMax = searchParams.get('priceMax') || ''

  if (!query.trim()) {
    return NextResponse.json({ listings: FALLBACK_PARTS, source: 'fallback' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ listings: FALLBACK_PARTS, source: 'fallback' })
  }

  const vehicleDesc = [year, make, model].filter(Boolean).join(' ')
  const searchDesc = vehicleDesc ? `${query} for a ${vehicleDesc}` : query

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate 8 realistic auto parts listings for: "${searchDesc}".

Return ONLY valid JSON, no other text:
{
  "listings": [
    {
      "id": "p-1",
      "name": "Brembo Front Brake Pad Set",
      "brand": "Brembo",
      "price": 89.99,
      "location": "Warehouse, CA",
      "seller": "AutoZone Pro",
      "condition": "New",
      "compatibility": "${vehicleDesc || 'Multiple fitments – verify before purchase'}",
      "partNumber": "P85075N",
      "description": "High-performance ceramic compound, OEM+ stopping power, low dust",
      "url": "https://www.autozone.com"
    }
  ]
}

Rules:
- Realistic current market pricing${priceMax ? ` (max $${priceMax})` : ''}
- ${condition ? `Condition: ${condition}` : 'Mix of new, used, and remanufactured'}
- Real brand names (Brembo, K&N, Bosch, Bilstein, ACDelco, NGK, etc.)
- Authentic part numbers
- ${vehicleDesc ? `Compatibility specifically for ${vehicleDesc}` : 'Include compatibility notes'}
- Diverse sellers: AutoZone, O'Reilly, NAPA, Advance Auto, Amazon, RockAuto, Summit Racing, JEGS, CarParts.com
- Descriptions with specific technical details
- Prices reflect real market (small parts $10–$50, mid $50–$200, performance $200+)`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.listings?.length) {
          return NextResponse.json({ listings: parsed.listings, source: 'ai' })
        }
      } catch { /* fall through */ }
    }
    return NextResponse.json({ listings: FALLBACK_PARTS, source: 'fallback' })
  } catch (err) {
    console.error('AI parts search error:', err)
    return NextResponse.json({ listings: FALLBACK_PARTS, source: 'fallback' })
  }
}
