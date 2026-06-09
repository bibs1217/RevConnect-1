import { NextRequest } from 'next/server'
import { VENDORS } from '@/lib/platform-data'

export const runtime = 'edge'

/* ────────────────────────────────────────────────────────────────────────
   RevConnect-1 AI — tool-use upgrade.
   GPT-4o with platform search tools. Tool results are streamed to the
   client both as model context AND as structured "rc_cards" SSE events
   that the chat renders as inline result cards.
   ──────────────────────────────────────────────────────────────────────── */

export interface RCCard {
  type: 'part' | 'vehicle' | 'auction' | 'vendor' | 'event' | 'insurance' | 'carwash'
  id: string
  title: string
  subtitle?: string
  image?: string | null
  icon?: string
  priceLabel?: string
  meta?: string[]
  url?: string | null
  mapsUrl?: string | null
  description?: string
  badge?: string
  brand?: string | null
  price?: number | null
  source?: string
  fullPage: { label: string; href: string }
  detail?: Record<string, string>
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_parts',
      description: 'Search live auto parts listings (eBay Motors + Marketcheck) across major retailers. Use whenever the user wants to buy, price, or compare a part.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Part keyword, e.g. "brake pads", "coilovers", "cold air intake"' },
          year: { type: 'string' }, make: { type: 'string' }, model: { type: 'string' },
          priceMax: { type: 'string', description: 'Max price in USD, digits only' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_cars',
      description: 'Search live for-sale vehicle listings (eBay Motors). Use when the user wants to buy or browse cars for sale.',
      parameters: {
        type: 'object',
        properties: {
          make: { type: 'string' }, model: { type: 'string' },
          yearMin: { type: 'string' }, yearMax: { type: 'string' },
          priceMax: { type: 'string' }, zip: { type: 'string' },
        },
        required: ['make'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_auctions',
      description: 'Search live car auctions — salvage (Copart/IAAI) and eBay Motors auctions. Use for auction hunting, salvage builds, flip candidates.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' }, make: { type: 'string' }, model: { type: 'string' },
          yearMin: { type: 'string' }, yearMax: { type: 'string' },
          priceMax: { type: 'string' }, zip: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_vendors',
      description: 'Search RevConnect-1 verified vendor marketplace (brands, shops, member discounts). Use when the user asks for trusted brands, shops, or discounts.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free text to match vendor name/description' },
          category: { type: 'string', enum: ['Performance Parts','Wheels & Tires','Car Care','Insurance & Finance','Automotive Services','Audio & Electronics'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_events',
      description: 'Find car meets, shows, Cars & Coffee, track days near a city. Requires city and state — ask the user if you do not know their location.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          state: { type: 'string', description: '2-letter state code, e.g. FL' },
          type: { type: 'string', enum: ['all','street_meet','car_show','track_day','cruise','drag'] },
        },
        required: ['city', 'state'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_insurance_quotes',
      description: 'Generate realistic insurance quote estimates from enthusiast and standard carriers for a specific vehicle and usage profile.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'string' }, make: { type: 'string' }, model: { type: 'string' },
          use: { type: 'string', enum: ['daily','pleasure','show','track','collector'] },
          coverage: { type: 'string', enum: ['liability','full_coverage','agreed_value','classic_car','modified','track_day'] },
          mods_value: { type: 'string', description: 'Total value of aftermarket mods in USD, digits only' },
          zip: { type: 'string' }, age: { type: 'string' },
        },
        required: ['year', 'make', 'model'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_car_washes',
      description: 'Find car washes / detailers near a city (coating-safe options included). Requires city and state — ask the user if unknown.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          state: { type: 'string', description: '2-letter state code' },
          wash_type: { type: 'string', enum: ['any','mobile_detailer','hand_wash','tunnel_soft','tunnel_touchless','self_serve','full_detail'] },
        },
        required: ['city', 'state'],
      },
    },
  },
]

const money = (n: number | null | undefined) =>
  n == null || isNaN(Number(n)) ? null : `$${Math.round(Number(n)).toLocaleString()}`

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v)
  return p.toString()
}

async function getJSON(url: string, timeoutMs = 25000): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

async function execTool(name: string, args: any, origin: string): Promise<{ cards: RCCard[]; model: string }> {
  const a = args ?? {}
  try {
    switch (name) {
      case 'search_parts': {
        const data = await getJSON(`${origin}/api/parts-search?${qs({ query: a.query, year: a.year, make: a.make, model: a.model, priceMax: a.priceMax, sortBy: 'price-asc' })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const fullHref = '/parts'
        const cards: RCCard[] = items.map((p: any, i: number) => ({
          type: 'part', id: String(p.id ?? i),
          title: p.title ?? 'Part',
          subtitle: [p.brand, p.seller || p.source].filter(Boolean).join(' · '),
          image: p.image || null, icon: '🔩',
          price: p.total_price ?? p.price ?? null,
          priceLabel: money(p.total_price ?? p.price) ?? 'See price',
          brand: p.brand ?? null, source: p.source ?? p.seller ?? '',
          meta: [p.condition, p.free_shipping ? 'Free shipping' : (p.shipping ? `+${money(p.shipping)} ship` : null), p.location].filter(Boolean) as string[],
          url: p.url ?? null,
          fullPage: { label: 'Open in Parts', href: fullHref },
          detail: {
            Condition: p.condition ?? '—', Seller: p.seller ?? '—',
            'Seller feedback': p.seller_feedback_pct ? `${p.seller_feedback_pct} (${p.seller_feedback_score ?? '—'})` : '—',
            Source: p.source ?? '—', Location: p.location ?? '—',
            'Part #': p.part_number ?? '—',
          },
        }))
        return { cards, model: cards.length ? JSON.stringify(cards.map(c => ({ title: c.title, price: c.priceLabel, retailer: c.source, condition: c.detail?.Condition }))) : 'No part listings found. Suggest refining the search or checking /parts.' }
      }
      case 'search_cars': {
        const data = await getJSON(`${origin}/api/car-search?${qs({ make: a.make, model: a.model, yearMin: a.yearMin, yearMax: a.yearMax, priceMax: a.priceMax, zip: a.zip })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((l: any, i: number) => ({
          type: 'vehicle', id: String(l.id ?? i),
          title: l.title ?? 'Vehicle',
          image: l.photo || null, icon: '🚗',
          price: l.price ?? null, priceLabel: money(l.price) ?? 'See price',
          source: l.source ?? 'eBay',
          meta: [l.condition, l.location].filter(Boolean) as string[],
          url: l.listing_url ?? null,
          fullPage: { label: 'Open in Buy a Car', href: '/car-search' },
          detail: { Condition: l.condition ?? '—', Seller: l.seller ?? '—', Location: l.location ?? '—', Source: l.source ?? 'eBay', 'Listing type': l.listing_type ?? '—' },
        }))
        return { cards, model: cards.length ? JSON.stringify(cards.map(c => ({ title: c.title, price: c.priceLabel, location: c.detail?.Location }))) : 'No live vehicle listings found. Suggest the /car-search page which links 20+ marketplaces.' }
      }
      case 'search_auctions': {
        const data = await getJSON(`${origin}/api/auction-search?${qs({ query: a.query, make: a.make, model: a.model, yearMin: a.yearMin, yearMax: a.yearMax, priceMax: a.priceMax, zip: a.zip })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((l: any, i: number) => {
          const bid = l.price ?? l.current_bid ?? l.buy_now_price ?? null
          const allIn = bid ? Math.round(Number(bid) * 1.12 + 450) : null
          return {
            type: 'auction', id: String(l.id ?? i),
            title: l.title ?? 'Auction lot',
            subtitle: l.source ?? '',
            image: (l.images && l.images[0]) || l.image || null, icon: '🏁',
            price: bid, priceLabel: bid ? `Bid ${money(bid)}` : 'No bid yet',
            badge: allIn ? `All-In Est: ${money(allIn)}` : undefined,
            source: l.source ?? '',
            meta: [l.mileage ? `${Number(l.mileage).toLocaleString()} mi` : null, l.primary_damage ? `Damage: ${l.primary_damage}` : null, l.location, l.auction_date ? `Sale: ${l.auction_date}` : null].filter(Boolean) as string[],
            url: l.listing_url ?? null,
            fullPage: { label: 'Open in Auctions', href: '/auctions' },
            detail: {
              Source: l.source ?? '—', VIN: l.vin ?? '—', 'Lot #': String(l.lot_number ?? '—'),
              'Primary damage': l.primary_damage ?? '—', Odometer: l.odometer_status ?? '—',
              'Buy now': money(l.buy_now_price) ?? '—', Location: l.location ?? '—',
              Keys: l.keys != null ? String(l.keys) : '—', Drivetrain: l.drivetrain ?? '—',
            },
          }
        })
        return { cards, model: cards.length ? JSON.stringify(cards.map(c => ({ title: c.title, bid: c.priceLabel, allIn: c.badge, damage: c.detail?.['Primary damage'] }))) : 'No auction lots found. The /auctions page also lists Bring a Trailer, Cars & Bids, Mecum and in-person events.' }
      }
      case 'search_vendors': {
        const q = (a.query ?? '').toLowerCase()
        const items = VENDORS.filter(v => {
          if (a.category && v.category !== a.category) return false
          if (q && !v.name.toLowerCase().includes(q) && !v.description.toLowerCase().includes(q) && !v.sub.toLowerCase().includes(q)) return false
          return true
        }).sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0)).slice(0, 6)
        const cards: RCCard[] = items.map(v => ({
          type: 'vendor', id: v.id,
          title: v.name, subtitle: `${v.category} · ${v.sub}`,
          icon: v.logo,
          badge: v.discount ?? undefined,
          meta: [v.verified ? '✓ Verified' : null, v.city ?? null].filter(Boolean) as string[],
          description: v.description,
          url: v.website,
          fullPage: { label: 'Open in Vendors', href: '/vendors' },
          detail: { Category: v.category, Specialty: v.sub, Discount: v.discount ?? '—', Location: v.city ?? 'Nationwide / Online', Verified: v.verified ? 'Yes' : 'No' },
        }))
        return { cards, model: cards.length ? JSON.stringify(items.map(v => ({ name: v.name, specialty: v.sub, discount: v.discount }))) : 'No matching vendors.' }
      }
      case 'search_events': {
        const data = await getJSON(`${origin}/api/events-search?${qs({ city: a.city, state: a.state, type: a.type ?? 'all' })}`, 30000)
        const ai: any[] = data?.aiEvents ?? []
        const eb: any[] = data?.eventbriteResults ?? []
        const cards: RCCard[] = [
          ...ai.slice(0, 5).map((e: any, i: number): RCCard => ({
            type: 'event', id: `ai_${i}`,
            title: e.name ?? 'Event',
            subtitle: e.schedule ?? '',
            icon: '📍',
            meta: [[e.location, e.city, e.state].filter(Boolean).join(', ')].filter(Boolean) as string[],
            description: e.description ?? '',
            url: e.website || null,
            mapsUrl: mapsSearch([e.location, e.city, e.state].filter(Boolean).join(' ')),
            fullPage: { label: 'Open in Events', href: '/events' },
            detail: { Schedule: e.schedule ?? '—', Venue: e.location ?? '—', City: `${e.city ?? a.city}, ${e.state ?? a.state}`, Type: (e.type ?? '—').replace(/_/g, ' ') },
          })),
          ...eb.slice(0, 3).map((e: any, i: number): RCCard => ({
            type: 'event', id: `eb_${i}`,
            title: e.title ?? 'Event',
            subtitle: e.date ? new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '',
            image: e.image || null, icon: '🎟️',
            meta: [[e.venue, e.city, e.state].filter(Boolean).join(', '), e.isFree ? 'Free' : null].filter(Boolean) as string[],
            url: e.url || null,
            mapsUrl: mapsSearch([e.venue, e.city, e.state].filter(Boolean).join(' ')),
            fullPage: { label: 'Open in Events', href: '/events' },
            detail: { Date: e.date ?? '—', Venue: e.venue ?? '—', City: `${e.city ?? a.city}, ${e.state ?? a.state}`, Source: 'Eventbrite' },
          })),
        ]
        return { cards, model: cards.length ? JSON.stringify(cards.map(c => ({ name: c.title, when: c.subtitle, where: c.meta?.[0] }))) : `No events found near ${a.city}, ${a.state}. Suggest the /events page for platform-wide search links.` }
      }
      case 'get_insurance_quotes': {
        const data = await getJSON(`${origin}/api/insurance-search?${qs({ year: a.year, make: a.make, model: a.model, use: a.use, coverage: a.coverage, mods_value: a.mods_value, zip: a.zip, age: a.age })}`, 35000)
        const items: any[] = (data?.carriers ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((c: any, i: number) => ({
          type: 'insurance', id: String(i),
          title: c.name ?? 'Carrier',
          subtitle: [c.type, c.am_best ? `AM Best ${c.am_best}` : null].filter(Boolean).join(' · '),
          icon: c.logo ?? '🛡️',
          priceLabel: c.monthly ? `~${money(c.monthly)}/mo` : 'Quote varies',
          badge: c.recommended ? '★ Recommended' : undefined,
          meta: [c.annual ? `${money(c.annual)}/yr` : null, c.agreed_value ? 'Agreed value' : null, c.mods_covered ? 'Mods covered' : null].filter(Boolean) as string[],
          description: c.notes ?? '',
          url: c.website || null,
          fullPage: { label: 'Open in Insurance', href: '/insurance' },
          detail: { Type: c.type ?? '—', Coverage: c.coverage ?? '—', Monthly: money(c.monthly) ?? '—', Annual: money(c.annual) ?? '—', 'AM Best': c.am_best ?? '—', Phone: c.phone ?? '—', 'Agreed value': c.agreed_value ? 'Yes' : 'No', 'Mods covered': c.mods_covered ? 'Yes' : 'No', 'Track day': c.track_day ? 'Yes' : 'No' },
        }))
        return { cards, model: cards.length ? JSON.stringify(items.map((c: any) => ({ carrier: c.name, monthly: c.monthly, notes: c.notes, recommended: c.recommended }))) : 'Quote engine returned nothing — suggest the /insurance page.' }
      }
      case 'search_car_washes': {
        const data = await getJSON(`${origin}/api/car-wash-search?${qs({ city: a.city, state: a.state, wash_type: a.wash_type ?? 'any' })}`, 35000)
        const items: any[] = (data?.businesses ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((w: any, i: number) => ({
          type: 'carwash', id: String(i),
          title: w.name ?? 'Car wash',
          subtitle: w.price_range ?? '',
          icon: '🚿',
          priceLabel: w.rating ? `★ ${w.rating}` : undefined,
          meta: [[w.address, w.city, w.state].filter(Boolean).join(', '), w.phone].filter(Boolean) as string[],
          description: w.description ?? '',
          url: w.website || null,
          mapsUrl: mapsSearch([w.name, w.address, w.city, w.state].filter(Boolean).join(' ')),
          fullPage: { label: 'Open in Car Wash', href: '/car-wash' },
          detail: { Address: [w.address, w.city, w.state].filter(Boolean).join(', '), Phone: w.phone ?? '—', Rating: w.rating ? `${w.rating} / 5` : '—', Price: w.price_range ?? '—' },
        }))
        return { cards, model: cards.length ? JSON.stringify(items.map((w: any) => ({ name: w.name, rating: w.rating, price: w.price_range }))) : `No washes found near ${a.city}, ${a.state}.` }
      }
      default:
        return { cards: [], model: `Unknown tool ${name}` }
    }
  } catch (e: any) {
    return { cards: [], model: `Tool ${name} failed: ${e?.message ?? 'error'}` }
  }
}

export async function POST(req: NextRequest) {
  const { messages, vehicleContext } = await req.json()

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY to Vercel environment variables.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const origin = new URL(req.url).origin

  const systemPrompt = `You are RevConnect-1 AI — the single conversational interface to the entire RevConnect-1 automotive platform, AND a master ASE-certified technician with 30+ years of experience.

${vehicleContext ? `The user's current vehicle: ${vehicleContext}` : 'No vehicle selected yet — ask what they\'re working on when relevant.'}

You have live search tools covering every platform feature: parts listings, cars for sale, auctions, verified vendors, local events, insurance quotes, and car washes. USE THEM proactively:
- If the user mentions buying/pricing a part → call search_parts.
- Shopping for a car → search_cars. Auction hunting / salvage → search_auctions.
- Brands, shops, discounts → search_vendors. Meets/shows → search_events (need city+state — ask if unknown).
- Insurance costs → get_insurance_quotes. Wash/detail spots → search_car_washes (need city+state).
- Combine tools when useful (e.g. a brake job: explain the repair AND search_parts for pads/rotors).

Tool results render as visual cards in the chat automatically — do NOT repeat listing details, prices, or URLs in your text. After results arrive, write a SHORT expert take (2-4 sentences): which option you'd pick and why, what to watch out for. Never paste raw links.

As a mechanic:
- Confirm the specific vehicle before giving repair advice
- Step-by-step numbered instructions with torque specs where relevant
- Rate job difficulty 1-10, list required tools upfront, warn about safety hazards
- Know when to recommend a professional shop
- Be conversational but precise — like a knowledgeable friend in the garage

Format installation guides with: Difficulty rating, Tools needed, Safety notes, numbered steps, and a verification checklist.`

  const convo: any[] = [{ role: 'system', content: systemPrompt }, ...messages]
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: any) => {
        const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
        controller.enqueue(encoder.encode(`data: ${body}\n\n`))
      }
      const sendText = (text: string) => send({ choices: [{ delta: { content: text } }] })

      try {
        for (let round = 0; round < 4; round++) {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: convo,
              tools: TOOLS,
              tool_choice: round < 3 ? 'auto' : 'none',
              stream: true,
              max_tokens: 2048,
              temperature: 0.7,
            }),
          })

          if (!res.ok || !res.body) {
            const err = await res.text().catch(() => '')
            sendText(`\n⚠️ AI service error (${res.status}). ${err.slice(0, 120)}`)
            break
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buf = ''
          const toolCalls: any[] = []
          let finish: string | null = null

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data || data === '[DONE]') continue
              let j: any
              try { j = JSON.parse(data) } catch { continue }
              const ch = j.choices?.[0]
              if (!ch) continue
              if (ch.delta?.content) send(j)
              for (const tc of ch.delta?.tool_calls ?? []) {
                const i = tc.index ?? 0
                if (!toolCalls[i]) toolCalls[i] = { id: tc.id ?? '', type: 'function', function: { name: '', arguments: '' } }
                if (tc.id) toolCalls[i].id = tc.id
                if (tc.function?.name) toolCalls[i].function.name += tc.function.name
                if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments
              }
              if (ch.finish_reason) finish = ch.finish_reason
            }
          }

          if (finish !== 'tool_calls' || toolCalls.length === 0) break

          // Tell the client which searches are running (renders a status line)
          send({ rc_status: toolCalls.map(t => t.function.name) })

          convo.push({ role: 'assistant', content: null, tool_calls: toolCalls })

          const results = await Promise.all(toolCalls.map(async (tc) => {
            let parsed: any = {}
            try { parsed = JSON.parse(tc.function.arguments || '{}') } catch {}
            const r = await execTool(tc.function.name, parsed, origin)
            return { tc, r }
          }))

          for (const { tc, r } of results) {
            if (r.cards.length) send({ rc_cards: r.cards, rc_tool: tc.function.name })
            convo.push({ role: 'tool', tool_call_id: tc.id, content: r.model })
          }
        }
      } catch {
        sendText('\n⚠️ Connection issue — please try again.')
      }

      send('[DONE]')
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
