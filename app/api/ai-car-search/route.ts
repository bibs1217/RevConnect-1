import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FALLBACK_CARS = [
  { id: 'ai-1', title: '2022 Ford Mustang GT Premium', make: 'Ford', model: 'Mustang GT', year: 2022, price: 42500, location: 'Dallas, TX', condition: 'Used', mileage: 18000, description: 'Clean title, one owner, leather seats, 5.0L V8 450hp, 10-speed auto', seller: 'AutoNation Ford Dallas', url: 'https://www.cars.com' },
  { id: 'ai-2', title: '2021 Chevrolet Camaro SS 1LE', make: 'Chevrolet', model: 'Camaro SS', year: 2021, price: 38900, location: 'Houston, TX', condition: 'Used', mileage: 24000, description: 'V8 6.2L 455hp, 6-speed manual, Brembo brakes, magnetic ride control', seller: 'Hendrick Chevrolet', url: 'https://www.autotrader.com' },
  { id: 'ai-3', title: '2023 Toyota Camry XSE V6', make: 'Toyota', model: 'Camry XSE', year: 2023, price: 33200, location: 'Austin, TX', condition: 'Used', mileage: 8500, description: 'V6 3.5L, sport package, heated/cooled seats, Apple CarPlay, Toyota Safety Sense', seller: 'Toyota of Austin', url: 'https://www.cargurus.com' },
  { id: 'ai-4', title: '2020 Honda Accord Sport 2.0T', make: 'Honda', model: 'Accord Sport', year: 2020, price: 24800, location: 'San Antonio, TX', condition: 'Used', mileage: 35000, description: '2.0T 252hp, 10-speed auto, Honda Sensing, Android Auto, sport mode', seller: 'Honda of San Antonio', url: 'https://www.carmax.com' },
  { id: 'ai-5', title: '2022 BMW 330i xDrive', make: 'BMW', model: '3 Series 330i', year: 2022, price: 46500, location: 'Phoenix, AZ', condition: 'Used', mileage: 15000, description: 'xDrive AWD, premium package, panoramic moonroof, harman/kardon audio, nav', seller: 'BMW of Phoenix', url: 'https://www.autotrader.com' },
  { id: 'ai-6', title: '2021 Dodge Challenger R/T Scat Pack', make: 'Dodge', model: 'Challenger R/T', year: 2021, price: 38500, location: 'Las Vegas, NV', condition: 'Used', mileage: 22000, description: '392 HEMI 485hp, 8-speed auto, widebody, plus package, heated seats', seller: 'Dodge of Las Vegas', url: 'https://www.cars.com' },
  { id: 'ai-7', title: '2023 Nissan Altima SR VC-Turbo', make: 'Nissan', model: 'Altima SR', year: 2023, price: 28400, location: 'Orlando, FL', condition: 'Used', mileage: 11000, description: 'VC-Turbo 2.0L, ProPilot Assist, Bose audio, sport suspension, AWD', seller: 'Nissan of Orlando', url: 'https://www.carvana.com' },
  { id: 'ai-8', title: '2022 Hyundai Sonata N Line', make: 'Hyundai', model: 'Sonata N Line', year: 2022, price: 29900, location: 'Atlanta, GA', condition: 'Used', mileage: 19500, description: '2.5T 290hp, 8-speed DCT, sport-tuned suspension, Bose audio, sunroof', seller: 'Hyundai of Atlanta', url: 'https://www.truecar.com' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const yearMin = searchParams.get('yearMin') || ''
  const yearMax = searchParams.get('yearMax') || ''
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const zip = searchParams.get('zip') || ''

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ listings: FALLBACK_CARS, source: 'fallback' })
  }

  const searchDesc = [
    make && model ? `${make} ${model}` : make || model || 'used cars',
    yearMin && yearMax ? `${yearMin}–${yearMax}` : yearMin ? `${yearMin}+` : yearMax ? `up to ${yearMax}` : '',
    priceMax ? `under $${Number(priceMax).toLocaleString()}` : '',
    priceMin ? `over $${Number(priceMin).toLocaleString()}` : '',
    zip ? `near ${zip}` : '',
  ].filter(Boolean).join(', ')

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate 8 realistic used car listings for: "${searchDesc}".

Return ONLY valid JSON, no other text:
{
  "listings": [
    {
      "id": "ai-1",
      "title": "2022 Ford Mustang GT Premium",
      "make": "Ford",
      "model": "Mustang GT",
      "year": 2022,
      "price": 42500,
      "location": "Dallas, TX",
      "condition": "Used",
      "mileage": 18000,
      "description": "Clean title, one owner, leather seats, 5.0L V8, 10-speed auto",
      "seller": "AutoNation Ford Dallas",
      "url": "https://www.cars.com"
    }
  ]
}

Rules:
- Realistic current market pricing${priceMax ? ` (max $${priceMax})` : ''}${priceMin ? ` (min $${priceMin})` : ''}
- ${make ? `Focus on ${make}${model ? ` ${model}` : ''} vehicles` : 'Variety of popular makes/models'}
- ${yearMin || yearMax ? `Year range: ${yearMin || '2015'}–${yearMax || new Date().getFullYear()}` : 'Recent model years'}
- Diverse US city locations
- Authentic descriptions with real engine/trim specs
- Real dealership names as sellers
- Use cars.com, autotrader.com, cargurus.com, carmax.com, carvana.com as urls`
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
    return NextResponse.json({ listings: FALLBACK_CARS, source: 'fallback' })
  } catch (err) {
    console.error('AI car search error:', err)
    return NextResponse.json({ listings: FALLBACK_CARS, source: 'fallback' })
  }
}
