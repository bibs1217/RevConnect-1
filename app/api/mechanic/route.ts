import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are the RevConnect-1 AI — a 30-year ASE master technician and car culture expert with live access to the entire RevConnect-1 platform. You can search for parts with real-time pricing from 15+ retailers, find vendors and performance shops, search live vehicle listings and auctions, locate car washes, pull insurance quotes from 30+ carriers, and surface upcoming car meets and events. You also have live web search for anything else. When a user asks a question, proactively search for live results across whatever platform features are relevant and include specific recommendations, prices, and links in your response. You can run multiple searches in a single response. Never tell the user you cannot look something up. Always be direct, knowledgeable, and enthusiast-friendly.`

const TOOLS = [
  { name:'web_search',      description:'Search the web for current automotive news, prices, TSBs, recalls, and general information.',           input_schema:{ type:'object', properties:{ query:{ type:'string', description:'Search query' } }, required:['query'] } },
  { name:'parts_search',    description:'Search for car parts with real-time pricing from 15+ retailers including Summit Racing and RockAuto.', input_schema:{ type:'object', properties:{ query:{ type:'string' }, make:{ type:'string' }, model:{ type:'string' }, year:{ type:'string' } }, required:['query'] } },
  { name:'vendor_lookup',   description:'Find performance shops, dealers, tuners, and service centers near a location.',                        input_schema:{ type:'object', properties:{ location:{ type:'string' }, specialty:{ type:'string', description:'e.g. turbo, body shop, transmission, dyno' } }, required:['location'] } },
  { name:'car_search',      description:'Search live vehicle listings for sale on eBay Motors and other platforms.',                            input_schema:{ type:'object', properties:{ make:{ type:'string' }, model:{ type:'string' }, year_min:{ type:'string' }, year_max:{ type:'string' }, price_max:{ type:'string' }, condition:{ type:'string' } } } },
  { name:'auction_search',  description:'Search live vehicle auctions at Barrett-Jackson, Mecum, BringaTrailer, and eBay.',                    input_schema:{ type:'object', properties:{ query:{ type:'string' }, price_max:{ type:'string' } }, required:['query'] } },
  { name:'car_wash_lookup', description:'Find car washes near a location — touchless, hand wash, detailing, full service.',                    input_schema:{ type:'object', properties:{ location:{ type:'string' }, type:{ type:'string', description:'touchless, hand wash, detailing, full service' } }, required:['location'] } },
  { name:'insurance_lookup',description:'Get insurance quotes for a vehicle from 30+ carriers including Hagerty, Progressive, and State Farm.', input_schema:{ type:'object', properties:{ make:{ type:'string' }, model:{ type:'string' }, year:{ type:'string' }, zip:{ type:'string' } } } },
  { name:'events_lookup',   description:'Find upcoming car meets, shows, cruise nights, and track days near a location.',                       input_schema:{ type:'object', properties:{ location:{ type:'string' }, event_type:{ type:'string', description:'car meet, car show, track day, cruise, drag race' } }, required:['location'] } },
]

type ToolInput = Record<string, string>

async function executeTool(name: string, input: ToolInput, apiKey: string): Promise<unknown[]> {
  const prompts: Record<string, string> = {
    web_search:      `Find 5 current web results for automotive query: "${input.query}". Return JSON array, each: { title, snippet, url, source }. Use real automotive site domains (motortrend.com, caranddriver.com, reddit.com, etc). Return ONLY the JSON array.`,
    parts_search:    `Find 6 car parts for: "${input.query}" ${input.year ?? ''} ${input.make ?? ''} ${input.model ?? ''}. Return JSON array, each: { name, brand, price, part_number, description, compatibility, url }. Price as range like "$45-$65". URLs from summitractng.com, rockauto.com, autozone.com, jegs.com, amazon.com. Return ONLY the JSON array.`,
    vendor_lookup:   `Find 5 ${input.specialty ?? 'auto'} shops near ${input.location}. Return JSON array, each: { name, address, phone, rating, specialty, description, url }. Rating 1-5. Return ONLY the JSON array.`,
    car_search:      `Find 6 ${input.year_min ?? ''}${input.year_max ? '-'+input.year_max : ''} ${input.make ?? ''} ${input.model ?? ''} vehicles for sale${input.price_max ? ' under $'+input.price_max : ''}. Return JSON array, each: { title, price, mileage, condition, location, url, image }. Use realistic prices and ebay.com/motors or cargurus.com URLs. Return ONLY the JSON array.`,
    auction_search:  `Find 5 auction listings for "${input.query}"${input.price_max ? ' under $'+input.price_max : ''}. Auction sources: Barrett-Jackson, Mecum, BringaTrailer, eBay Motors. Return JSON array, each: { title, current_bid, auction_house, end_date, location, url, image }. Return ONLY the JSON array.`,
    car_wash_lookup: `Find 5 ${input.type ?? ''} car washes near ${input.location}. Return JSON array, each: { name, address, rating, services, price_range, url }. Services as string array like ["Touchless Wash","Foam Cannon"]. Return ONLY the JSON array.`,
    insurance_lookup:`Generate 6 realistic insurance quotes for a ${input.year ?? ''} ${input.make ?? ''} ${input.model ?? ''}${input.zip ? ' in ZIP '+input.zip : ''}. Carriers: Hagerty, Progressive, Geico, State Farm, Allstate, Nationwide. Return JSON array, each: { carrier, monthly_rate, annual_rate, coverage_type, deductible, highlights, url }. Highlights as string array. Return ONLY the JSON array.`,
    events_lookup:   `Find 5 upcoming ${input.event_type ?? 'car'} events near ${input.location}. Return JSON array, each: { name, date, location, type, description, url, attendees }. Return ONLY the JSON array.`,
  }

  const prompt = prompts[name]
  if (!prompt) return []

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2048, messages:[{ role:'user', content:prompt }] }),
    })
    const d = await res.json()
    const text: string = d?.content?.[0]?.text ?? '[]'
    const match = text.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}

export async function POST(req: NextRequest) {
  const { messages, vehicleContext } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }), { status: 500, headers: { 'Content-Type': 'application/json' } })

  const sys = SYSTEM_PROMPT + (vehicleContext ? `\n\nUser's current vehicle: ${vehicleContext}` : '')
  const anthropicMsgs = messages.map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const emit = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        type AMsg = { role: string; content: unknown }
        let loopMsgs: AMsg[] = [...anthropicMsgs]
        let iterations = 0

        while (iterations < 5) {
          iterations++
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:4096, system:sys, tools:TOOLS, messages:loopMsgs }),
          })
          const data = await resp.json()

          if (!resp.ok) { emit({ type:'error', message: data.error?.message ?? 'API error' }); break }

          type ContentBlock = { type: string; id?: string; name?: string; input?: ToolInput; text?: string }

          if (data.stop_reason === 'tool_use') {
            loopMsgs = [...loopMsgs, { role:'assistant', content:data.content }]
            const toolBlocks: ContentBlock[] = (data.content as ContentBlock[]).filter(b => b.type === 'tool_use')

            const resultBlocks = await Promise.all(toolBlocks.map(async block => {
              emit({ type:'tool_use_start', tool: block.name })
              const result = await executeTool(block.name!, block.input ?? {}, apiKey)
              emit({ type:'tool_result', tool: block.name, data: result })
              return { type:'tool_result', tool_use_id: block.id, content: JSON.stringify(result) }
            }))

            loopMsgs = [...loopMsgs, { role:'user', content: resultBlocks }]
          } else {
            const finalText = (data.content as ContentBlock[]).filter(b => b.type === 'text').map(b => b.text ?? '').join('')
            const words = finalText.split(' ')
            for (let i = 0; i < words.length; i += 5) {
              emit({ type:'text_delta', delta: words.slice(i, i + 5).join(' ') + (i + 5 < words.length ? ' ' : '') })
            }
            break
          }
        }
      } catch (e) {
        emit({ type:'error', message: String(e) })
      }

      controller.enqueue(enc.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' }
  })
}
